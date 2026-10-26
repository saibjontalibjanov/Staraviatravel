import json
import logging
from functools import wraps
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import Http404
from travel.models import Lead, NewsletterSubscriber, HotFlight, TelegramChat, TelegramMessage, Checkout, Booking, SavedSearch
from travel.services.validation import ServiceError, obj, email, passports_input, text, request_uuid
from travel.services.leads import create_lead, limit, audit
from travel.services.flights import AIRPORTS, search_flights
from travel.services.checkouts import active_checkout, public_checkout, save_billing, create_checkout, admin_checkout, website_origin
from travel.services import telegram

logger=logging.getLogger(__name__)

def body(request):
    if request.content_type!='application/json': raise ServiceError('Send application/json.',415)
    try: return obj(json.loads(request.body))
    except (json.JSONDecodeError,UnicodeDecodeError): raise ServiceError('Invalid JSON request.') from None

def endpoint(methods):
    def decorate(function):
        @wraps(function)
        def wrapped(request,*args,**kwargs):
            try:
                if request.method not in methods: raise ServiceError('Method not allowed.',405)
                result=function(request,*args,**kwargs)
                data,status=result if isinstance(result,tuple) else (result,200)
                return JsonResponse(data,safe=False,status=status)
            except ServiceError as error:
                response=JsonResponse({'error':{'status':error.status,'message':error.message}},status=error.status)
                if error.status==429: response['Retry-After']='60'
                return response
            except Http404:
                return JsonResponse({'error':{'status':404,'message':'Not found.'}},status=404)
            except Exception:
                # Raw provider exceptions/URLs and passport data must never enter logs or API errors.
                logger.error('Backend request failed (%s).',function.__name__)
                return JsonResponse({'error':{'status':500,'message':'Operation failed. Please try again.'}},status=500)
        return wrapped
    return decorate

def require_staff(request,permission=None):
    if not request.user.is_authenticated or not request.user.is_active or not request.user.is_staff: raise ServiceError('Staff sign-in required.',401)
    if permission and not request.user.has_perm(permission): raise ServiceError('Your role does not allow this operation.',403)

def rate(request,scope,maximum=20,seconds=600):
    limit(f'{scope}:{request.META.get("REMOTE_ADDR","")}',maximum,seconds)

@csrf_exempt
@endpoint(['POST'])
def lead_create(request):
    rate(request,'lead')
    lead=create_lead(body(request).get('data'))
    response={'data':{'clientId':lead.client_id,'createdAt':lead.created_at.isoformat()}}
    return response,201

@endpoint(['GET'])
def airports(request): return AIRPORTS

@endpoint(['GET'])
def flights(request):
    rate(request,'flight',60,600)
    return search_flights(request.GET.dict())

def offer_view(offer):
    image=offer.image.url if offer.image else offer.legacy_image
    background=offer.background.url if offer.background else offer.legacy_background
    return {'id':offer.pk,'documentId':str(offer.pk),'title':offer.title,'type':offer.type,'badge':offer.badge,'price':offer.price,'oldPrice':offer.old_price,'image':{'url':image} if image else None,'background':{'url':background} if background else None,'link':offer.link if (offer.link.startswith('https://') or offer.link.startswith('/') and not offer.link.startswith('//')) else '','badgeColor':offer.badge_color}

@endpoint(['GET'])
def hot_flights(request,pk=None):
    queryset=HotFlight.objects.filter(published=True).order_by('-created_at')
    if pk:return {'data':offer_view(get_object_or_404(queryset,pk=pk))}
    return {'data':[offer_view(offer) for offer in queryset[:100]],'meta':{'pagination':{'total':queryset.count()}}}

@csrf_exempt
@endpoint(['POST'])
def newsletter(request):
    rate(request,'newsletter')
    data=obj(body(request).get('data'))
    language=data.get('language','uz')
    if language not in ['uz','ru','en']:raise ServiceError('Invalid language.')
    NewsletterSubscriber.objects.get_or_create(email=email(data.get('email')),defaults={'language':language})
    return {'subscribed':True}

@endpoint(['GET'])
def checkout_get(request,token):
    rate(request,'checkout',120,600)
    return public_checkout(active_checkout(token))

@csrf_exempt
@endpoint(['POST'])
def checkout_billing(request,token):
    rate(request,'billing')
    return save_billing(token,body(request))

@csrf_exempt
@endpoint(['POST'])
def telegram_webhook(request):
    expected=settings.TELEGRAM_WEBHOOK_SECRET
    provided=request.headers.get('X-Telegram-Bot-Api-Secret-Token','')
    if not re_secret(expected) or not __import__('hmac').compare_digest(provided.encode(),expected.encode()):raise ServiceError('Invalid webhook secret.',403)
    return telegram.ingest_update(body(request))

def re_secret(value):
    import re
    return bool(re.fullmatch(r'[A-Za-z0-9_-]{16,256}',value))

@endpoint(['GET','POST','PUT','DELETE'])
def staff_records(request,kind,pk=None):
    if kind not in ['bookings','search-results']:raise Http404
    model=Booking if kind=='bookings' else SavedSearch
    action={'GET':'view','POST':'add','PUT':'change','DELETE':'delete'}[request.method]
    require_staff(request,f'travel.{action}_{model._meta.model_name}')
    record=get_object_or_404(model,pk=pk) if pk is not None else None
    if request.method in ['PUT','DELETE'] and not record:raise Http404
    if request.method=='POST' and record:raise ServiceError('Method not allowed.',405)
    if request.method=='DELETE':
        reference=record.pk;record.delete();audit(request.user,f'{model._meta.model_name}.deleted',reference)
        return {'data':{'id':reference}}
    if request.method in ['POST','PUT']:
        from travel.forms import BookingForm, SavedSearchForm
        data=obj(body(request).get('data',{}))
        aliases={'PassengerName':'passenger_name','PassportNumber':'passport_number','FlightId':'flight_id','PaidPrice':'paid_price'} if kind=='bookings' else {'from':'from_location','to':'to_location','departureDate':'departure_date'}
        clean={aliases.get(key,key):value for key,value in data.items()}
        form_class=BookingForm if kind=='bookings' else SavedSearchForm
        if record:clean={**{key:getattr(record,key) for key in form_class.base_fields},**clean}
        form=form_class(clean,instance=record)
        if not form.is_valid():raise ServiceError('Invalid record fields.')
        record=form.save();audit(request.user,f'{model._meta.model_name}.saved',record.pk)
    def view(row):
        values={'PassengerName':row.passenger_name,'PassportNumber':row.passport_number,'FlightId':row.flight_id,'PaidPrice':str(row.paid_price) if row.paid_price is not None else None} if kind=='bookings' else {'from':row.from_location,'to':row.to_location,'departureDate':row.departure_date.isoformat() if row.departure_date else None}
        return {'id':row.pk,'documentId':str(row.pk),'createdAt':row.created_at.isoformat(),'publishedAt':row.created_at.isoformat() if row.published else None,**values}
    if record:return {'data':view(record)}
    return {'data':[view(row) for row in model.objects.order_by('-created_at')[:100]]}

@endpoint(['GET','POST','PUT'])
def office_api(request,operation,client_id=None,pk=None):
    require_staff(request)
    if operation=='search':
        require_staff(request,'travel.search_flights')
        if request.method!='POST':raise ServiceError('Method not allowed.',405)
        data=body(request);lead=None
        if data.get('clientId'):
            require_staff(request,'travel.view_lead');lead=get_object_or_404(Lead,client_id=data['clientId'])
        rate(request,f'agent-search:{request.user.pk}',100,600)
        return search_flights(data,lead,request.user)
    if operation in ['passports','checkouts','revoke']:
        require_staff(request,'travel.view_lead')
        require_staff(request,'travel.manage_passports' if operation=='passports' else 'travel.manage_checkouts')
        lead=get_object_or_404(Lead,client_id=client_id)
        if operation=='passports':
            if request.method=='GET':return {'passengers':lead.passport_details}
            if request.method!='PUT':raise ServiceError('Method not allowed.',405)
            people=passports_input(body(request).get('passengers'))
            Lead.objects.filter(pk=lead.pk).update(passport_details=people,updated_at=timezone.now())
            audit(request.user,'passport.updated',lead.client_id)
            return {'passengers':people}
        if operation=='checkouts':
            if request.method=='GET':
                try:website_origin();error=''
                except ServiceError as cause:error=cause.message
                return {'checkouts':[admin_checkout(row) for row in lead.checkouts.order_by('-created_at')[:100]],'configurationError':error}
            if request.method!='POST':raise ServiceError('Method not allowed.',405)
            return {'checkout':admin_checkout(create_checkout(lead,body(request),request.user))}
        if request.method!='POST':raise ServiceError('Method not allowed.',405)
        row=get_object_or_404(Checkout,pk=pk,lead=lead)
        Checkout.objects.filter(pk=row.pk,revoked_at__isnull=True).update(revoked_at=timezone.now())
        audit(request.user,'checkout.revoked',row.pk)
        return {'revoked':True}
    if operation.startswith('telegram-'):
        require_staff(request,'travel.view_telegramchat')
        if operation=='telegram-status':return telegram.config_status()
        if operation in ['telegram-connect','telegram-webhook']:
            require_staff(request,'travel.configure_telegram')
            config=telegram.config_status()
            if not(config['webhookSecretConfigured'] and config['publicUrlConfigured']):raise ServiceError('Set PUBLIC_BACKEND_URL (HTTPS) and TELEGRAM_WEBHOOK_SECRET in .env.',503)
            if operation=='telegram-connect':
                if request.method!='POST':raise ServiceError('Method not allowed.',405)
                telegram.call_telegram('setWebhook',{'url':config['webhookUrl'],'secret_token':settings.TELEGRAM_WEBHOOK_SECRET,'allowed_updates':['message'],'drop_pending_updates':False})
                audit(request.user,'telegram.webhook.connected')
                return {'connected':True,'webhookUrl':config['webhookUrl']}
            info=telegram.call_telegram('getWebhookInfo',{}) or {}
            return {'configuredForThisServer':info.get('url')==config['webhookUrl'],'pendingUpdates':info.get('pending_update_count',0),'lastError':bool(info.get('last_error_date'))}
        if operation=='telegram-retry':
            require_staff(request,'travel.reply_telegram')
            if request.method!='POST':raise ServiceError('Method not allowed.',405)
            row=get_object_or_404(TelegramMessage,pk=pk,direction='outgoing')
            if row.delivery_status not in ['failed','unknown']:raise ServiceError('Message is already queued or delivered.',409)
            if row.delivery_status=='unknown' and body(request).get('confirmUncertain') is not True:raise ServiceError('Check Telegram and confirm before retrying this uncertain delivery.',409)
            if not settings.TELEGRAM_BOT_TOKEN:raise ServiceError('Configure TELEGRAM_BOT_TOKEN before retrying.',503)
            if not TelegramMessage.objects.filter(pk=row.pk,delivery_status=row.delivery_status).update(delivery_status='pending',attempts=0,next_attempt_at=None,last_error='',updated_at=timezone.now()):raise ServiceError('Message status changed. Refresh before retrying.',409)
            audit(request.user,'telegram.retry',row.pk)
            return {'queued':True}
        chat=get_object_or_404(TelegramChat,pk=pk)
        if operation=='telegram-link':
            require_staff(request,'travel.reply_telegram');require_staff(request,'travel.view_lead')
            if request.method!='PUT':raise ServiceError('Method not allowed.',405)
            value=body(request).get('clientId')
            chat.lead=get_object_or_404(Lead,client_id=value) if value else None;chat.save(update_fields=['lead'])
            audit(request.user,'telegram.link',chat.pk)
            return {'clientId':value}
        if operation=='telegram-reply':
            require_staff(request,'travel.reply_telegram')
            if request.method!='POST':raise ServiceError('Method not allowed.',405)
            if not settings.TELEGRAM_BOT_TOKEN:raise ServiceError('Configure TELEGRAM_BOT_TOKEN before replying.',503)
            data=body(request);reference=request_uuid(data.get('requestId'))
            record=telegram.queue_message(chat,data.get('text'),f'reply:{chat.chat_id}:{reference}',agent=request.user,sender_name=request.user.get_full_name() or request.user.username)
            audit(request.user,'telegram.queued',record.pk)
            return {'queued':True,'id':record.pk}
    raise ServiceError('Not found.',404)
