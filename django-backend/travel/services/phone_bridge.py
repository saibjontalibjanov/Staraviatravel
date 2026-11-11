"""Phone-reported metadata only. Never accesses a SIM or claims carrier verification."""
import hashlib
import hmac
import json
import re
from datetime import timedelta, datetime, timezone as dt_timezone
from urllib.parse import urlsplit
from django.conf import settings
from django.db import transaction, IntegrityError
from django.db.models import Value
from django.db.models.functions import Replace
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from travel.models import Lead, PhoneCall, PhoneCallEvent
from .validation import ServiceError, phone, obj

STATUSES=('ringing','answered','completed','missed','rejected')
TERMINAL=('completed','missed','rejected')

def configured():
    if not re.fullmatch(r'[A-Za-z0-9_-]{32,256}',settings.PHONE_BRIDGE_TOKEN):return False
    try:normalized_number(settings.PHONE_BRIDGE_LINE)
    except ServiceError:return False
    return True

def authorize(request):
    expected=settings.PHONE_BRIDGE_TOKEN
    if not configured():raise ServiceError('Phone bridge is not configured.',503)
    if not settings.DEBUG and not request.is_secure():raise ServiceError('HTTPS is required.',403)
    provided=request.headers.get('Authorization','')
    if not hmac.compare_digest(provided.encode(),('Bearer '+expected).encode()):raise ServiceError('Invalid phone bridge authorization.',403)

def timestamp(value):
    try:
        if type(value) is int or (isinstance(value,str) and re.fullmatch(r'\d{10}|\d{13}',value)):
            epoch=int(value);result=datetime.fromtimestamp(epoch/1000 if epoch>9999999999 else epoch,tz=dt_timezone.utc)
        else:result=parse_datetime(value) if isinstance(value,str) and len(value)<=50 else None
    except (ValueError,OverflowError,OSError):result=None
    if not result or timezone.is_naive(result):raise ServiceError('Use an ISO timestamp with timezone.')
    if result>timezone.now()+timedelta(minutes=5) or result<timezone.now()-timedelta(days=7):raise ServiceError('Event timestamp is outside the allowed window.')
    return result

def identifier(value,label):
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_.:+-]{1,120}',value):raise ServiceError(f'Invalid {label}.')
    return value

def normalized_number(value):
    value=phone(value)
    digits=re.sub(r'\D','',value)
    if value.startswith('+'):return '+'+digits
    if digits.startswith('00'):return '+'+digits[2:]
    if len(digits)==12 and digits.startswith('998'):return '+'+digits
    if len(digits)==9 and settings.PHONE_BRIDGE_LINE.startswith('+998'):return '+998'+digits
    raise ServiceError('Send a full international phone number, or a 9-digit Uzbek number.')

def match_leads(number):
    if not number:return []
    # Imported historical phone formatting may differ; compare full international
    # numbers, never suffix-only matches or an arbitrary first customer.
    expression='phone'
    for character in [' ','+','-','(',')','\u00a0']:
        expression=Replace(expression,Value(character),Value(''))
    return list(Lead.objects.annotate(dial_digits=expression).filter(dial_digits=number.lstrip('+')).order_by('pk')[:2])

def ingest(data):
    obj(data)
    if set(data)-{'deviceId','callId','eventId','phone','direction','status','occurredAt','durationSeconds'}:raise ServiceError('Unsupported phone event fields.')
    device=identifier(data.get('deviceId'),'device ID');call_id=identifier(data.get('callId'),'call ID');event_id=identifier(data.get('eventId'),'event ID')
    if len(device)>64:raise ServiceError('Device ID too long.')
    raw_number=data.get('phone','')
    number='' if raw_number is None or raw_number=='' else normalized_number(raw_number)
    direction=data.get('direction');status=data.get('status')
    if direction not in ['incoming','outgoing'] or status not in STATUSES:raise ServiceError('Invalid call direction or status.')
    when=timestamp(data.get('occurredAt'));duration=data.get('durationSeconds')
    if duration is not None and (type(duration) is not int or not 0<=duration<=86400):raise ServiceError('Invalid call duration.')
    line=normalized_number(settings.PHONE_BRIDGE_LINE)
    fingerprint=hashlib.sha256(json.dumps([device,call_id,number,direction,status,when.isoformat(),duration],separators=(',',':')).encode()).hexdigest()
    event_key=hashlib.sha256(f'{device}:{event_id}'.encode()).hexdigest()
    call_key=hashlib.sha256(f'{line}:{device}:{call_id}'.encode()).hexdigest()
    try:
        with transaction.atomic():
            previous=PhoneCallEvent.objects.filter(key=event_key).first()
            if previous:
                if previous.fingerprint!=fingerprint:raise ServiceError('Event reference already used for different data.',409)
                return {'received':True,'duplicate':True}
            call,created=PhoneCall.objects.get_or_create(call_key=call_key,defaults={'device_id':device,'line_number':line,'remote_number':number,'direction':direction,'status':status,'first_reported_at':when,'last_reported_at':when})
            call=PhoneCall.objects.select_for_update().get(pk=call.pk)
            if call.direction!=direction or (call.remote_number and number and call.remote_number!=number):raise ServiceError('Call identity changed.',409)
            if number:call.remote_number=number
            call.first_reported_at=min(call.first_reported_at,when)
            if when>=call.last_reported_at and (call.status not in TERMINAL or status in TERMINAL):
                if not (call.status=='answered' and status=='ringing'):call.status=status
                call.last_reported_at=when
                if duration is not None:call.duration_seconds=duration
            matches=match_leads(call.remote_number)
            call.lead=matches[0] if len(matches)==1 else None;call.match_count=len(matches)
            call.save()
            PhoneCallEvent.objects.create(key=event_key,fingerprint=fingerprint,call=call,status=status,reported_at=when)
        return {'received':True,'duplicate':False}
    except IntegrityError:
        # Concurrent deliveries remain retryable without duplicate call/event rows.
        previous=PhoneCallEvent.objects.filter(key=event_key).first()
        if previous and previous.fingerprint==fingerprint:return {'received':True,'duplicate':True}
        raise ServiceError('Call state changed. Retry the same event reference.',409) from None

def bridge_status():
    try:
        url=urlsplit(settings.PUBLIC_BACKEND_URL)
        origin=f'{url.scheme}://{url.netloc}' if url.scheme=='https' and url.netloc and not url.username and not url.password and url.path in ('','/') and not url.query and not url.fragment else ''
    except ValueError:origin=''
    return {'configured':configured(),'line':settings.PHONE_BRIDGE_LINE,'webhook':origin+'/api/phone-bridge/events' if origin else '', 'last_event':PhoneCall.objects.order_by('-updated_at').first()}
