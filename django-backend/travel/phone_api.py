from datetime import timedelta
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from travel.api import endpoint,body,require_staff,rate
from travel.models import PhoneCall
from travel.services import phone_bridge
from travel.services.validation import ServiceError

@csrf_exempt
@endpoint(['POST'])
def event(request):
    if len(request.body)>16384:raise ServiceError('Phone event too large.',413)
    phone_bridge.authorize(request)
    rate(request,'phone-bridge',120,600)
    return phone_bridge.ingest(body(request))

@endpoint(['GET'])
def recent(request):
    require_staff(request,'travel.view_phonecall')
    rate(request,f'phone-poll:{request.user.pk}',600,600)
    now=timezone.now();after=request.GET.get('after')
    try:since=parse_datetime(after) if after and len(after)<=50 else now-timedelta(minutes=2)
    except ValueError:since=None
    if not since or timezone.is_naive(since) or since>now+timedelta(minutes=1):raise ServiceError('Invalid call cursor.')
    rows=PhoneCall.objects.filter(updated_at__gt=since,updated_at__lte=now).select_related('lead').order_by('-updated_at')[:20]
    can_view=request.user.has_perm('travel.view_lead')
    return {'cursor':now.isoformat(),'calls':[{'id':str(row.pk),'number':row.remote_number,'status':row.status,'direction':row.direction,'reportedAt':row.last_reported_at.isoformat(),'clientId':row.lead.client_id if row.lead and can_view else None,'name':f'{row.lead.first_name} {row.lead.last_name}'.strip() if row.lead and can_view else '', 'ambiguous':row.match_count>1} for row in rows]}
