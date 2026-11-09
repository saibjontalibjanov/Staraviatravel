from django.core.management.base import BaseCommand, CommandError
from travel.models import Payment
from travel.payments.service import reconcile
from travel.services.validation import ServiceError
from travel.payments.provider import get_provider

class Command(BaseCommand):
    help='Read-only bank status lookup + local reconciliation. Never creates payments or refunds.'
    def add_arguments(self,parser):
        parser.add_argument('--payment',help='Specific payment UUID (required for terminal-state review).')
        parser.add_argument('--limit',type=int,default=100)
    def handle(self,*args,**options):
        if not get_provider().available():raise CommandError('Official bank adapter is not configured/implemented. No bank request made.')
        rows=Payment.objects.all()
        if options['payment']:
            import uuid
            try:reference=uuid.UUID(options['payment'])
            except ValueError:raise CommandError('Invalid payment UUID.') from None
            rows=rows.filter(pk=reference)
        else:rows=rows.filter(status__in=['creating','pending','unknown'])
        if not 1<=options['limit']<=1000:raise CommandError('Limit must be 1–1000.')
        for row in rows.order_by('created_at')[:options['limit']]:
            try:
                result=reconcile(row,source='reconciliation')
                self.stdout.write(f'{row.pk}: {result.status}')
            except ServiceError:self.stderr.write(f'{row.pk}: verification unavailable; retained for review')
