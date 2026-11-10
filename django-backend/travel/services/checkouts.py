import hashlib
import re
import secrets
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from urllib.parse import urlsplit
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.utils import timezone
from travel.models import FareQuote, Checkout
from .validation import ServiceError, obj, text, integer, minor, decimal_value, request_uuid, passports_input, journeys_input, billing_input
from .leads import audit

PUBLIC_FIELDS=['version','clientId','route','tripType','journeys','baggage','passengerDetails','passengerName','passengers','departureDate','returnDate','cabin','airline','fareTerms','paymentInformation','language']

def website_origin():
    try:
        url=urlsplit(settings.PUBLIC_WEBSITE_URL)
        if not url.netloc or url.username or url.password or url.query or url.fragment or url.path not in ['','/'] or (url.scheme!='https' and not(url.scheme=='http' and url.hostname in ['localhost','127.0.0.1'])): raise ValueError
        return f'{url.scheme}://{url.netloc}'
    except ValueError:
        raise ServiceError('Set PUBLIC_WEBSITE_URL to your public website origin in django-backend/.env.',503) from None

def create_checkout(lead,data,agent):
    obj(data);origin=website_origin();reference=request_uuid(data.get('requestId'))
    existing=Checkout.objects.filter(request_id=reference).first()
    if existing:
        if existing.lead_id!=lead.pk: raise ServiceError('Submission reference already used.',409)
        return existing
    try:
        quote=FareQuote.objects.get(reference=data.get('quoteReference'),lead=lead,expires_at__gt=timezone.now())
    except (FareQuote.DoesNotExist,ValueError,TypeError, ValidationError):
        raise ServiceError('Select a current priced fare from ticket search; quotes expire after 30 minutes.') from None
    if data.get('fareConfirmed') is not True: raise ServiceError('Confirm the selected fare covers every passenger, flight and baggage allowance.')
    passports=passports_input(lead.passport_details)
    trip_type=data.get('tripType');journeys=journeys_input(data.get('journeys'),trip_type)
    if any(person['expiryDate']<=journeys[-1]['legs'][-1]['arrivalDate'] for person in passports): raise ServiceError('A passport expires before the trip ends.')
    currency=data.get('currency')
    if currency not in ['USD','UZS']: raise ServiceError('Choose USD or UZS.')
    source=minor(quote.offer.get('price'),'selected fare')
    rate=Decimal(1)
    if currency=='UZS': rate=decimal_value(data.get('exchangeRate'),'exchange rate',places=6,maximum='999999.999999')
    base=int((Decimal(source)*rate).quantize(Decimal(1),rounding=ROUND_HALF_UP))
    profit=minor(data.get('profit'),'profit',True);total=base+profit
    if not 0<total<=99999999999: raise ServiceError('Total is outside the supported limit.')
    days=integer(data.get('expiryDays'),1,30,'link validity')
    language=data.get('language',lead.language)
    if language not in ['uz','ru','en']: raise ServiceError('Invalid checkout language.')
    baggage=data.get('baggage',[])
    if not isinstance(baggage,list) or len(baggage)>20: raise ServiceError('Invalid baggage details.')
    clean_baggage=[]
    for item in baggage:
        obj(item)
        if item.get('type') not in ['checked','cabin','personal']: raise ServiceError('Invalid baggage type.')
        clean_baggage.append({'type':item['type'],'allowance':text(item.get('allowance'),200,'baggage allowance',True),'appliesTo':text(item.get('appliesTo'),200,'baggage applicability',True)})
    snapshot={'version':2,'clientId':lead.client_id,'route':text(data.get('route'),200,'route',True),'tripType':trip_type,'journeys':journeys,'baggage':clean_baggage,'passengerDetails':[{k:person[k] for k in ['id','fullName','passengerType']} for person in passports],'passengerName':passports[0]['fullName'],'passengers':len(passports),'departureDate':journeys[0]['legs'][0]['departureDate'],'returnDate':journeys[1]['legs'][0]['departureDate'] if trip_type=='round-trip' else '', 'cabin':journeys[0]['legs'][0]['cabin'],'airline':journeys[0]['legs'][0]['airline'],'fareTerms':text(data.get('fareTerms'),5000,'fare/refund terms',True),'paymentInformation':text(data.get('paymentInformation'),2000,'payment information'),'language':language}
    token=secrets.token_urlsafe(32)
    values={'lead':lead,'request_id':reference,'token':token,'token_hash':hashlib.sha256(token.encode()).hexdigest(),'agent':agent,'snapshot':snapshot,'amount_minor':total,'currency':currency,'expires_at':timezone.now()+timedelta(days=days),'pricing':{'baseMinor':str(base),'profitMinor':str(profit),'sourceMinor':str(source),'sourceCurrency':'USD','exchangeRate':str(rate),'quoteReference':str(quote.reference)}}
    try:
        with transaction.atomic(): checkout=Checkout.objects.create(**values)
    except IntegrityError:
        checkout=Checkout.objects.filter(request_id=reference,lead=lead).first()
        if not checkout: raise ServiceError('Could not create checkout. Please retry.',409) from None
    audit(agent,'checkout.created',checkout.pk)
    return checkout

def active_checkout(token):
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}',token): raise ServiceError('Checkout not found or no longer available.',404)
    checkout=Checkout.objects.filter(token_hash=hashlib.sha256(token.encode()).hexdigest(),lead__isnull=False,revoked_at__isnull=True,expires_at__gt=timezone.now()).first()
    if not checkout: raise ServiceError('Checkout not found or no longer available.',404)
    return checkout

def public_checkout(checkout):
    return {'booking':{key:checkout.snapshot[key] for key in PUBLIC_FIELDS if key in checkout.snapshot},'amountMinor':str(checkout.amount_minor),'currency':checkout.currency,'expiresAt':checkout.expires_at.isoformat(),'paymentsEnabled':False}

def admin_checkout(checkout):
    try: origin=website_origin()
    except ServiceError: origin=''
    return {'id':checkout.pk,'snapshot':checkout.snapshot,'pricing':checkout.pricing,'billingContact':checkout.billing_contact,'amountMinor':str(checkout.amount_minor),'currency':checkout.currency,'expiresAt':checkout.expires_at.isoformat(),'status':checkout.state,'url':f'{origin}/checkout/{checkout.token}' if checkout.state=='active' and origin else None}

def save_billing(token,data):
    checkout=active_checkout(token)
    values=billing_input(data,checkout.snapshot)
    if not Checkout.objects.filter(pk=checkout.pk,revoked_at__isnull=True,expires_at__gt=timezone.now(),lead__isnull=False).update(billing_contact=values,updated_at=timezone.now()): raise ServiceError('Checkout not found or no longer available.',404)
    return {'saved':True}
