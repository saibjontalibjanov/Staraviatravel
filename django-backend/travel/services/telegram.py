import re
import hmac
from datetime import timedelta
from urllib.parse import urlsplit
import requests
from django.conf import settings
from django.db import transaction, IntegrityError
from django.db.models import Q, F
from django.utils import timezone
from travel.models import TelegramChat, TelegramMessage
from .validation import ServiceError, obj, text

class TelegramError(ServiceError):
    def __init__(self,message,status=502,retry_after=None,ambiguous=False):
        super().__init__(message,status);self.retry_after=retry_after;self.ambiguous=ambiguous

def public_origin():
    url=urlsplit(settings.PUBLIC_BACKEND_URL)
    return f'{url.scheme}://{url.netloc}' if url.scheme=='https' and url.netloc and not url.username and not url.password and not url.query and not url.fragment and url.path in ['','/'] else ''

def config_status():
    origin=public_origin()
    return {'botConfigured':bool(settings.TELEGRAM_BOT_TOKEN),'notificationsConfigured':bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_LEADS_CHAT_ID),'webhookSecretConfigured':bool(re.fullmatch(r'[A-Za-z0-9_-]{16,256}',settings.TELEGRAM_WEBHOOK_SECRET)),'publicUrlConfigured':bool(origin),'webhookUrl':f'{origin}/api/telegram/webhook' if origin else None,'failedDeliveries':TelegramMessage.objects.filter(delivery_status__in=['failed','unknown']).count()}

def call_telegram(method,data):
    if not settings.TELEGRAM_BOT_TOKEN: raise TelegramError('Set TELEGRAM_BOT_TOKEN in django-backend/.env.',503)
    try:
        response=requests.post(f'https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{method}',json=data,timeout=(5,20))
        body=response.json()
    except (requests.RequestException,ValueError):
        raise TelegramError('Telegram delivery could not be confirmed. Check the conversation before retrying.',ambiguous=True) from None
    if not isinstance(body,dict) or not body.get('ok'):
        if isinstance(body,dict) and body.get('error_code')==429:
            delay=body.get('parameters',{}).get('retry_after',30)
            try: delay=min(3600,max(1,int(delay)))
            except (ValueError,TypeError): delay=30
            raise TelegramError('Telegram rate limit reached.',429,retry_after=delay)
        raise TelegramError('Telegram rejected the request. Check bot configuration and chat access.')
    return body.get('result')

def ensure_chat(chat_id,**values):
    if not isinstance(chat_id,str) or not re.fullmatch(r'-?\d{1,20}',chat_id): raise ServiceError('Invalid Telegram chat ID.')
    chat,_=TelegramChat.objects.get_or_create(chat_id=chat_id,defaults={'display_name':values.get('display_name') or f'Chat {chat_id}','chat_type':'supergroup' if chat_id.startswith('-') else 'private'})
    return chat

def update_preview(chat,message,incoming=False):
    changes={}
    if not chat.last_message_at or chat.last_message_at<=message.created_at: changes.update(last_message_at=message.created_at,preview=' '.join(message.text.split())[:200])
    if incoming and (not chat.last_inbound_at or chat.last_inbound_at<=message.created_at): changes['last_inbound_at']=message.created_at
    if changes: TelegramChat.objects.filter(pk=chat.pk).update(**changes)

def ingest_update(update):
    obj(update)
    if type(update.get('update_id')) is not int or not 0<=update['update_id']<=9007199254740991: raise ServiceError('Invalid Telegram update.')
    message=update.get('message')
    if not isinstance(message,dict): return {'ignored':True}
    sender=message.get('from') or {};raw=message.get('chat') or {}
    if sender.get('is_bot') or raw.get('type') not in ['private','group','supergroup']: return {'ignored':True}
    if type(raw.get('id')) is not int or abs(raw['id'])>9007199254740991 or type(message.get('message_id')) is not int or message['message_id']<0: raise ServiceError('Invalid Telegram message.')
    name=' '.join(str(sender.get(key) or '') for key in ['first_name','last_name']).strip()[:200] or 'Telegram user'
    attachment=next((key for key in ['photo','document','voice','video','audio','sticker','contact','location'] if message.get(key)),None)
    body=message.get('text') if isinstance(message.get('text'),str) else f'[{attachment or "Unsupported"} attachment]'+ ('\n'+message['caption'] if isinstance(message.get('caption'),str) else '')
    with transaction.atomic():
        chat=ensure_chat(str(raw['id']),display_name=name)
        chat.display_name=str(raw.get('title') or name)[:200];chat.username=str(raw.get('username') or '')[:100];chat.chat_type=raw['type'];chat.save()
        record,created=TelegramMessage.objects.get_or_create(event_key=f"update:{update['update_id']}",defaults={'chat':chat,'text':body[:4096] or '[Empty message]','direction':'incoming','delivery_status':'received','telegram_message_id':str(message['message_id']),'sender_name':name})
        update_preview(chat,record,True)
    return {'received':True,'duplicate':not created}

def queue_message(chat,body,event_key,agent=None,client_id='',sender_name=''):
    body=text(body,4096,'Telegram message',True)
    record,created=TelegramMessage.objects.get_or_create(event_key=event_key,defaults={'chat':chat,'text':body,'direction':'outgoing','delivery_status':'pending','agent':agent,'client_id':client_id,'sender_name':sender_name})
    if record.text!=body or record.chat_id!=chat.pk: raise ServiceError('Submission reference already used for a different message.',409)
    update_preview(chat,record)
    return record

def enqueue_lead(lead):
    if not settings.TELEGRAM_BOT_TOKEN or not re.fullmatch(r'-?\d{1,20}',settings.TELEGRAM_LEADS_CHAT_ID): return
    chat=ensure_chat(settings.TELEGRAM_LEADS_CHAT_ID)
    lines=[f'New STARAVIA lead #{lead.client_id}',f'Client: {lead.first_name} {lead.last_name}',f'Phone: {lead.phone}',f'Email: {lead.email}',f'Source: {lead.source}']
    if lead.flight_route: lines.append(f'Route: {lead.flight_route}')
    if public_origin(): lines.append(f'Open lead: {public_origin()}/office/?section=leads&lead={lead.client_id}')
    queue_message(chat,'\n'.join(lines)[:4096],f'lead:{lead.pk}',client_id=lead.client_id,sender_name='STARAVIA lead notification')

def drain_outbox(batch=5):
    if not settings.TELEGRAM_BOT_TOKEN: return 0
    now=timezone.now()
    TelegramMessage.objects.filter(delivery_status='sending',updated_at__lt=now-timedelta(minutes=2)).update(delivery_status='unknown',last_error='Delivery interrupted. Check Telegram before retrying.',updated_at=now)
    records=TelegramMessage.objects.filter(direction='outgoing',delivery_status='pending').filter(Q(next_attempt_at__isnull=True)|Q(next_attempt_at__lte=now)).order_by('pk')[:batch]
    sent=0
    for record in records:
        claimed=TelegramMessage.objects.filter(pk=record.pk,delivery_status='pending').update(delivery_status='sending',attempts=F('attempts')+1,updated_at=timezone.now())
        if not claimed: continue
        acknowledged=False
        try:
            data={'chat_id':record.chat.chat_id,'text':record.text,'link_preview_options':{'is_disabled':True}}
            if record.client_id and public_origin(): data['reply_markup']={'inline_keyboard':[[{'text':f'Open lead #{record.client_id}','url':f'{public_origin()}/office/?section=leads&lead={record.client_id}'}]]}
            result=call_telegram('sendMessage',data)
            if not isinstance(result,dict) or type(result.get('message_id')) is not int: raise TelegramError('Telegram delivery could not be confirmed.',ambiguous=True)
            acknowledged=True
            TelegramMessage.objects.filter(pk=record.pk).update(delivery_status='sent',telegram_message_id=str(result['message_id']),last_error='',next_attempt_at=None,updated_at=timezone.now());sent+=1
        except Exception as error:
            retry=isinstance(error,TelegramError) and error.retry_after and record.attempts<4 and not acknowledged
            unknown=acknowledged or not isinstance(error,TelegramError) or error.ambiguous
            TelegramMessage.objects.filter(pk=record.pk).update(delivery_status='pending' if retry else 'unknown' if unknown else 'failed',last_error='Telegram accepted the message but its delivery record could not be saved. Check the conversation.' if acknowledged else error.message if isinstance(error,TelegramError) else 'Delivery could not be confirmed. Check Telegram before retrying.',next_attempt_at=timezone.now()+timedelta(seconds=error.retry_after) if retry else None,updated_at=timezone.now())
    return sent
