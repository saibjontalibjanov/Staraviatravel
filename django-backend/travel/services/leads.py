import hashlib
from datetime import timedelta
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from travel.models import Lead, RateBucket, AuditEvent
from .validation import ServiceError, lead_input

def limit(key, maximum=20, seconds=600):
    now=timezone.now()
    digest=hashlib.sha256(key.encode()).hexdigest()
    RateBucket.objects.filter(expires_at__lt=now-timedelta(hours=1)).delete()
    with transaction.atomic():
        bucket,_=RateBucket.objects.select_for_update().get_or_create(key=digest,defaults={'expires_at':now+timedelta(seconds=seconds)})
        if bucket.expires_at<=now:
            bucket.count=0;bucket.expires_at=now+timedelta(seconds=seconds)
        if bucket.count>=maximum:
            raise ServiceError('Too many requests. Please try again later.',429)
        bucket.count+=1;bucket.save(update_fields=['count','expires_at'])

def audit(user,action,target=''):
    AuditEvent.objects.create(actor=user if user and user.is_authenticated else None,action=action,target=str(target)[:100])

def create_lead(data):
    values=lead_input(data)
    for _ in range(20):
        try:
            with transaction.atomic():
                lead=Lead.objects.create(**values)
            break
        except IntegrityError:
            continue
    else:
        raise ServiceError('Could not allocate a client reference. Please retry.',503)
    from .telegram import enqueue_lead
    # A bot configuration/outbox failure must never turn a saved application into a failed submission.
    try:
        enqueue_lead(lead)
    except Exception:
        import logging
        logging.getLogger(__name__).error('Lead saved, but Telegram notification could not be queued.')
    return lead
