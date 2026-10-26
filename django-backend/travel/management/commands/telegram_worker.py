import time
from django.core.management.base import BaseCommand
from django.db import close_old_connections
from travel.services.telegram import drain_outbox
class Command(BaseCommand):
    help='Deliver the durable Telegram outbox. Run as a separate supervised worker.'
    def add_arguments(self,parser): parser.add_argument('--once',action='store_true')
    def handle(self,*args,**options):
        try:
            while True:
                close_old_connections()
                try: count=drain_outbox()
                except Exception:
                    self.stderr.write('Outbox processing failed; pending records are retained. Check database connectivity.')
                else:
                    if count:self.stdout.write(f'Delivered {count} Telegram message(s).')
                if options['once']:break
                time.sleep(3)
        except KeyboardInterrupt: pass
