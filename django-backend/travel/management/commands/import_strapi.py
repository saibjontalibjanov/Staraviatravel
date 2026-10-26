"""Read-only, repeatable import of the deployed Strapi SQLite schema. Dry-run by default."""
import hashlib
import json
import shutil
import sqlite3
from datetime import datetime, timezone as dt_timezone
from pathlib import Path
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from travel.models import Lead, Checkout, FareQuote, HotFlight, NewsletterSubscriber, TelegramChat, TelegramMessage, Booking, SavedSearch

TABLES=['leads','lead_checkouts','agent_ticket_quotes','hot_flights','bookings','flightsearch','telegram_chats','telegram_messages','newsletter_subscribers']
def stamp(value):
    if value is None or value=='':return None
    if isinstance(value,(int,float)):
        return datetime.fromtimestamp(value/1000 if abs(value)>100000000000 else value,tz=dt_timezone.utc)
    if str(value).isdigit():return stamp(int(value))
    parsed=parse_datetime(str(value))
    if parsed and timezone.is_naive(parsed):parsed=timezone.make_aware(parsed,dt_timezone.utc)
    return parsed

def structured(value,default):
    if value is None or value=='':return default
    if isinstance(value,(dict,list)):return value
    return json.loads(value)

class Command(BaseCommand):
    help='Import Strapi SQLite data without modifying the original. Stop Strapi before final cutover. Default is a count-only dry-run.'
    def add_arguments(self,parser):
        parser.add_argument('--database',required=True,type=Path)
        parser.add_argument('--uploads',type=Path)
        parser.add_argument('--apply',action='store_true')
    def handle(self,*args,**options):
        source=options['database'].resolve()
        if not source.is_file():raise CommandError('Strapi SQLite database not found.')
        connection=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True);connection.row_factory=sqlite3.Row
        tables={row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        def rows(name):
            if name not in tables:return []
            return [dict(row) for row in connection.execute(f'SELECT * FROM "{name}"')]
        def documents(name):
            chosen={}
            for row in rows(name):
                key=row.get('document_id') or str(row['id']);old=chosen.get(key)
                if old is None or bool(row.get('published_at'))>bool(old.get('published_at')):chosen[key]=row
            return list(chosen.values())
        versioned={'hot_flights','bookings','flightsearch'}
        counts={name:len(rows(name) if name in versioned else documents(name)) for name in TABLES}
        for name,count in counts.items():self.stdout.write(f'{name}: {count}')
        if not options['apply']:
            connection.close();self.stdout.write('Dry-run only. No records or files changed. Add --apply after reviewing counts.');return
        for name,model in [('leads',Lead),('newsletter_subscribers',NewsletterSubscriber)]:
            for row in documents(name):
                lookup={'client_id':row['client_id']} if name=='leads' else {'email':row['email'].lower()}
                existing=model.objects.filter(**lookup).first()
                key=f'{name}:{row.get("document_id") or row["id"]}'
                if existing and existing.legacy_key!=key:raise CommandError(f'{name}: destination contains a conflicting unique identifier. Import into a clean database or resolve the conflict first.')
        file_rows={row['id']:row for row in rows('files')}
        media={}
        for row in rows('files_related_mph'):
            if row.get('related_type')=='api::card-flights.card-flights' and row.get('file_id') in file_rows:media[(row['related_id'],row.get('field'))]=file_rows[row['file_id']].get('url') or ''
        def save(model,table,row,values):
            key=f'{table}:{row.get("document_id") or row["id"]}'+(f':{row["id"]}' if table in versioned else '')
            existing=model.objects.filter(legacy_key=key).first()
            if existing:return existing
            values={**values,'legacy_key':key}
            if stamp(row.get('created_at')):values['created_at']=stamp(row['created_at'])
            return model.objects.create(**values)
        leads={};chats={}
        with transaction.atomic():
            for row in documents('leads'):
                fields=['client_id','first_name','last_name','phone','email','source','language','page_path','flight_route','airline','quoted_price','payment_method','terms_accepted','lead_status','notes','departure_airport','arrival_airport','departure_date','return_date','passengers','cabin']
                values={key:row[key] for key in fields if row.get(key) is not None}
                values['passport_details']=structured(row.get('passport_details'),[])
                if values.get('quoted_price') is not None:values['quoted_price']=Decimal(str(values['quoted_price']))
                leads[row['id']]=save(Lead,'leads',row,values)
            lead_by_reference={row.client_id:row for row in leads.values()}
            checkout_links={row['checkout_id']:row['lead_id'] for row in rows('lead_checkouts_lead_lnk')}
            quote_links={row['ticket_quote_id']:row['lead_id'] for row in rows('agent_ticket_quotes_lead_lnk')}
            for row in documents('agent_ticket_quotes'):
                lead=leads.get(quote_links.get(row['id']))
                if not lead:raise CommandError('A quote has no matching lead. Import stopped; no database changes committed.')
                save(FareQuote,'agent_ticket_quotes',row,{'lead':lead,'reference':row['reference'],'offer':structured(row['offer'],{}),'search':structured(row['search'],{}),'expires_at':stamp(row['expires_at'])})
            for row in documents('lead_checkouts'):
                lead=leads.get(checkout_links.get(row['id']))
                snapshot=structured(row['snapshot'],{})
                if lead and 'clientId' not in snapshot:snapshot['clientId']=lead.client_id
                save(Checkout,'lead_checkouts',row,{'lead':lead,'token':row['token'],'token_hash':row.get('token_hash') or hashlib.sha256(row['token'].encode()).hexdigest(),'request_id':row['request_id'],'snapshot':snapshot,'pricing':structured(row.get('pricing'),{}),'billing_contact':structured(row.get('billing_contact'),{}),'amount_minor':int(row['amount_minor']),'currency':row['currency'],'expires_at':stamp(row['expires_at']),'revoked_at':stamp(row.get('revoked_at'))})
            for row in rows('hot_flights'):
                values={key:row.get(key) or '' for key in ['title','type','badge','price','old_price','link','badge_color']}
                # A media relationship can be on either draft or published physical row.
                siblings=[other for other in rows('hot_flights') if other['id']==row['id'] or row.get('document_id') and other.get('document_id')==row.get('document_id')]
                for field in ['image','background']:
                    values[f'legacy_{field}']=media.get((row['id'],field)) or next((media[(other['id'],field)] for other in siblings if (other['id'],field) in media),'')
                values['published']=bool(row.get('published_at'))
                save(HotFlight,'hot_flights',row,values)
            for row in documents('newsletter_subscribers'):save(NewsletterSubscriber,'newsletter_subscribers',row,{'email':row['email'].strip().lower(),'language':row.get('language') or 'uz'})
            for row in documents('telegram_chats'):
                values={key:row.get(key) or '' for key in ['chat_id','display_name','username','chat_type','preview']}
                values.update({key:stamp(row.get(key)) for key in ['last_message_at','last_inbound_at','last_read_at']});values['lead']=lead_by_reference.get(row.get('client_id'))
                chat=save(TelegramChat,'telegram_chats',row,values);chats[chat.chat_id]=chat
            for row in documents('telegram_messages'):
                chat=chats.get(row['chat_id'])
                if not chat:raise CommandError('A Telegram message has no matching chat. Import stopped.')
                values={key:row.get(key) or '' for key in ['event_key','text','direction','sender_name','telegram_message_id','delivery_status','last_error','client_id']}
                values.update(chat=chat,attempts=row.get('attempts') or 0,next_attempt_at=stamp(row.get('next_attempt_at')))
                if values['delivery_status']=='sending':values.update(delivery_status='unknown',last_error='Delivery was in flight during migration. Check Telegram before retrying.')
                save(TelegramMessage,'telegram_messages',row,values)
            for row in rows('bookings'):
                values={key:row.get(key) or '' for key in ['passenger_name','passport_number','flight_id']};values['paid_price']=Decimal(str(row['paid_price'])) if row.get('paid_price') is not None else None;values['published']=bool(row.get('published_at'));save(Booking,'bookings',row,values)
            for row in rows('flightsearch'):save(SavedSearch,'flightsearch',row,{'from_location':row.get('from') or '', 'to_location':row.get('to') or '', 'departure_date':row.get('departure_date') or None,'published':bool(row.get('published_at'))})
            if options['uploads']:
                source_media=options['uploads'].resolve()
                if not source_media.is_dir():raise CommandError('Uploads directory does not exist.')
                for file in source_media.rglob('*'):
                    if not file.is_file() or file.is_symlink():continue
                    relative=file.relative_to(source_media);target=settings.MEDIA_ROOT/relative
                    if target.exists():
                        if hashlib.sha256(target.read_bytes()).digest()!=hashlib.sha256(file.read_bytes()).digest():raise CommandError('An upload filename conflicts with a different destination file. No database changes committed.')
                    else:target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,target)
        connection.close()
        self.stdout.write('Import complete. Existing imported records were left unchanged. Source database was read-only. Staff accounts/passwords are not copied; create Django staff accounts separately.')
