import hashlib
import re
from datetime import timedelta
from urllib.parse import urlsplit
from uuid import UUID
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from travel.models import Checkout, Payment, PaymentEvent, PaymentNotice
from travel.services.checkouts import active_checkout, website_origin
from travel.services.leads import audit
from travel.services.validation import ServiceError, request_uuid
from .provider import get_provider, ProviderUnavailable, ProviderUncertain, VerifiedStatus, HostedSession

OPEN = ('creating','pending','unknown')
FINAL = ('succeeded','failed','cancelled','expired')

def checkout_authorization(request, allow_expired=False):
    # Capability auth, independent of cookies. Never accept a checkout/order ID as auth.
    header=request.headers.get('Authorization','')
    token=header[7:] if header.startswith('Bearer ') else ''
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}',token):
        raise ServiceError('Private checkout authorization required.',401)
    if not allow_expired:
        return active_checkout(token)
    row=Checkout.objects.filter(token_hash=hashlib.sha256(token.encode()).hexdigest(),lead__isnull=False,revoked_at__isnull=True).first()
    if not row:raise ServiceError('Checkout not found.',404)
    return row

def authorized_payment(request, payment_id):
    checkout=checkout_authorization(request,allow_expired=True)
    payment=Payment.objects.filter(pk=payment_id,checkout=checkout).first()
    if not payment:raise ServiceError('Payment not found.',404)
    return payment

def event(payment, key, source):
    digest=hashlib.sha256(key.encode()).hexdigest()
    return PaymentEvent.objects.get_or_create(key=digest,defaults={'payment':payment,'source':source,'status':payment.status})[1]

def safe_hosted_url(value):
    try:
        url=urlsplit(value)
        origin=f'{url.scheme}://{url.netloc}'
        if not isinstance(value,str) or len(value)>2000 or any(ord(c)<=32 for c in value) or url.scheme!='https' or not url.hostname or url.username or url.password or url.fragment or origin not in settings.IPAK_HOSTED_CHECKOUT_ORIGINS:raise ValueError
    except (ValueError,TypeError):raise ProviderUncertain() from None
    return value

def public_payment(payment):
    # A local expiry cannot prove a bank session is unpaid; keep it blocked for reconciliation.
    return {'id':str(payment.pk),'orderId':payment.checkout_id,'status':payment.status,
            'amountMinor':str(payment.amount_minor),'currency':payment.currency,
            'expiresAt':payment.expires_at.isoformat(),'verifiedAt':payment.verified_at.isoformat() if payment.verified_at else None,
            'paidAt':payment.paid_at.isoformat() if payment.paid_at else None,
            'issuanceStatus':payment.issuance_status,
            'checkoutUrl':safe_hosted_url(payment.hosted_url) if payment.status=='pending' and payment.expires_at>timezone.now() and payment.hosted_url else None}

def initiate(checkout, data):
    if set(data)-{'requestId','termsAccepted'}:raise ServiceError('Only requestId and termsAccepted are accepted. Prices are calculated by the server.')
    reference=request_uuid(data.get('requestId'))
    if data.get('termsAccepted') is not True:raise ServiceError('Accept the fare and refund terms before paying.')
    provider=get_provider()
    if settings.IPAK_PAYMENT_MODE not in ('sandbox','production') or not provider.available():raise ProviderUnavailable()
    if checkout.currency not in provider.supported_currencies:raise ServiceError('The bank does not support this order currency.',409)
    origin=website_origin()
    if not origin.startswith('https://'):raise ServiceError('HTTPS website origin is required for bank payments.',503)
    try:
        with transaction.atomic():
            checkout=Checkout.objects.select_for_update().get(pk=checkout.pk)
            if checkout.revoked_at or checkout.expires_at<=timezone.now() or not checkout.lead_id:raise ServiceError('Checkout no longer available.',404)
            existing=Payment.objects.filter(checkout=checkout,request_id=reference).first()
            if existing:return existing
            existing=Payment.objects.filter(checkout=checkout,status__in=OPEN+('succeeded',)).first()
            if existing:return existing
            if checkout.payment_status=='paid':raise ServiceError('This order is already paid.',409)
            if not checkout.billing_contact:raise ServiceError('Save your billing contact before paying.')
            payment=Payment.objects.create(checkout=checkout,request_id=reference,mode=settings.IPAK_PAYMENT_MODE,amount_minor=checkout.amount_minor,currency=checkout.currency,expires_at=min(checkout.expires_at,timezone.now()+timedelta(minutes=20)))
            event(payment,f'create:{payment.pk}','create');audit(None,'payment.created',payment.pk)
    except IntegrityError:
        existing=Payment.objects.filter(checkout=checkout,status__in=OPEN+('succeeded',)).first()
        if existing:return existing
        raise ServiceError('Payment state changed. Refresh before retrying.',409) from None
    # Do not keep a database transaction open across a bank request.
    returns={name:f'{origin}/payment/{name}?payment={payment.pk}' for name in ('success','failed','pending','cancelled')}
    try:
        session=provider.create_session(payment,returns)
        if not isinstance(session,HostedSession) or not isinstance(session.reference,str) or not 1<=len(session.reference)<=150 or not timezone.is_aware(session.expires_at) or session.expires_at<=timezone.now():raise ProviderUncertain()
        url=safe_hosted_url(session.url)
        with transaction.atomic():
            current=Payment.objects.select_for_update().get(pk=payment.pk)
            if current.bank_reference and current.bank_reference!=session.reference:raise ProviderUncertain()
            if current.status in ('creating','pending'):
                current.bank_reference=session.reference;current.hosted_url=url;current.expires_at=min(current.expires_at,session.expires_at);current.status='pending'
                current.save();event(current,f'session:{current.pk}','session')
            return current
    except Exception:
        # Timeout, malformed response or local DB failure may all follow a bank-side create.
        with transaction.atomic():
            current=Payment.objects.select_for_update().get(pk=payment.pk)
            if current.status=='creating':
                current.status='unknown';current.save(update_fields=['status','updated_at']);event(current,f'uncertain:{current.pk}','session')
        raise ProviderUncertain() from None

def apply_verified(payment_id, result, key, source):
    """The ONLY path to paid. Input is normalized evidence from a bank API lookup."""
    if not isinstance(result,VerifiedStatus) or result.status not in ('pending','succeeded','failed','cancelled','expired'):raise ServiceError('Bank verification failed.',502)
    if result.payment_id!=payment_id or type(result.amount_minor) is not int:raise ServiceError('Bank verification failed.',502)
    if not isinstance(result.reference,str) or not 1<=len(result.reference)<=150:raise ServiceError('Bank verification failed.',502)
    try:
        with transaction.atomic():
            # Lock the order first, consistently with payment initiation.
            order_id=Payment.objects.values_list('checkout_id',flat=True).get(pk=payment_id)
            checkout=Checkout.objects.select_for_update().get(pk=order_id)
            payment=Payment.objects.select_for_update().get(pk=payment_id)
            if payment.amount_minor!=checkout.amount_minor or payment.currency!=checkout.currency or result.amount_minor!=payment.amount_minor or result.currency!=payment.currency or (payment.bank_reference and payment.bank_reference!=result.reference):raise ServiceError('Bank amount, currency or reference verification failed.',502)
            digest=hashlib.sha256(key.encode()).hexdigest()
            existing=PaymentEvent.objects.filter(key=digest).first()
            if existing:
                if existing.payment_id!=payment.pk:raise ServiceError('Conflicting bank notification reference.',409)
                return payment
            # A confirmed success never downgrades on delayed failed/pending notifications.
            if payment.status=='succeeded' or (payment.status in FINAL and result.status!='succeeded'):
                event(payment,key,source);return payment
            payment.status=result.status;payment.bank_reference=result.reference;payment.verified_at=timezone.now()
            if result.status=='succeeded':
                payment.paid_at=timezone.now();payment.issuance_status='ready'
                checkout.payment_status='paid';checkout.save(update_fields=['payment_status','updated_at'])
            payment.save();event(payment,key,source)
            audit(None,f'payment.{payment.status}',payment.pk)
            if payment.status=='succeeded':
                for staff in get_user_model().objects.filter(is_active=True,is_staff=True):
                    if staff.has_perm('travel.view_payment'):PaymentNotice.objects.get_or_create(payment=payment,recipient=staff)
            return payment
    except IntegrityError:
        raise ServiceError('Conflicting bank reference or payment state; manual reconciliation required.',409) from None

def reconcile(payment, key=None, source='verification'):
    import uuid
    if payment.mode!=settings.IPAK_PAYMENT_MODE:raise ServiceError('Payment environment differs; reconcile in its original environment.',409)
    try:result=get_provider().verify_status(payment)
    except ProviderUnavailable:raise
    except Exception:raise ProviderUncertain() from None
    return apply_verified(payment.pk,result,key or f'verify:{uuid.uuid4()}',source)

def webhook(raw_body, headers):
    from .provider import VerifiedNotification
    provider=get_provider()
    if not provider.available():raise ProviderUnavailable()
    try:notification=provider.verify_webhook(raw_body,headers)
    except ProviderUnavailable:raise
    except Exception:raise ServiceError('Bank webhook authentication failed.',403) from None
    if not isinstance(notification,VerifiedNotification) or not isinstance(notification.payment_id,UUID) or not isinstance(notification.event_id,str) or not 1<=len(notification.event_id)<=200:raise ServiceError('Invalid bank notification.',403)
    payment=Payment.objects.filter(pk=notification.payment_id).first()
    if not payment:raise ServiceError('Payment not found.',404)
    key=f'ipak:webhook:{notification.event_id}'
    if PaymentEvent.objects.filter(key=hashlib.sha256(key.encode()).hexdigest(),payment=payment).exists():return payment
    # Never use browser redirects or webhook amount/status claims as proof of payment.
    return reconcile(payment,key,'webhook')

def mark_issued(payment_id, user):
    if not user.is_active or not user.is_staff or not user.has_perm('travel.issue_paid_ticket'):raise ServiceError('Ticket issuance permission required.',403)
    with transaction.atomic():
        payment=Payment.objects.select_for_update().get(pk=payment_id)
        if payment.status!='succeeded':raise ServiceError('Only a bank-confirmed paid order can be marked issued.',409)
        if payment.issuance_status!='issued':
            payment.issuance_status='issued';payment.save(update_fields=['issuance_status','updated_at']);audit(user,'ticket.manually_issued',payment.pk)
        return payment
