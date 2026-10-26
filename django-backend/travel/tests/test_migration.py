import hashlib
import io
import json
import sqlite3
import tempfile
import uuid
from pathlib import Path
from datetime import timedelta
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.utils import timezone
from travel.models import Lead, Checkout, HotFlight, NewsletterSubscriber, TelegramChat, TelegramMessage, FareQuote, Booking, SavedSearch
from travel.services.checkouts import active_checkout, public_checkout

class ImportTests(TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.database=self.root/'source.db';self.uploads=self.root/'uploads';self.uploads.mkdir();(self.uploads/'offer.png').write_bytes(b'preserved-upload')
        self.media=self.root/'destination';self.settings_override=override_settings(MEDIA_ROOT=self.media);self.settings_override.enable();self.addCleanup(self.settings_override.disable)
        token='A'*43;now=timezone.now();self.token=token
        connection=sqlite3.connect(self.database)
        connection.executescript('''
        create table leads(id integer primary key, document_id text,client_id text,first_name text,last_name text,phone text,email text,source text,language text,lead_status text,passport_details text,created_at integer);
        create table lead_checkouts(id integer primary key,document_id text,token text,token_hash text,request_id text,snapshot text,amount_minor integer,currency text,expires_at text,revoked_at text,pricing text,billing_contact text);
        create table lead_checkouts_lead_lnk(id integer primary key,checkout_id integer,lead_id integer);
        create table agent_ticket_quotes(id integer primary key,document_id text,reference text,offer text,search text,expires_at text);
        create table agent_ticket_quotes_lead_lnk(id integer primary key,ticket_quote_id integer,lead_id integer);
        create table hot_flights(id integer primary key,document_id text,title text,price text,published_at text);
        create table files(id integer primary key,url text);
        create table files_related_mph(id integer primary key,file_id integer,related_id integer,related_type text,field text);
        create table newsletter_subscribers(id integer primary key,document_id text,email text,language text);
        create table telegram_chats(id integer primary key,document_id text,chat_id text,display_name text,client_id text);
        create table telegram_messages(id integer primary key,document_id text,event_key text,chat_id text,text text,direction text,delivery_status text,attempts integer);
        create table bookings(id integer primary key,document_id text,passenger_name text,passport_number text,flight_id text,paid_price float,published_at text);
        create table flightsearch(id integer primary key,document_id text,"from" text,"to" text,departure_date text,published_at text);
        ''')
        connection.execute('insert into leads values(?,?,?,?,?,?,?,?,?,?,?,?)',(11,'legacy-lead','654321','Aziz','Karimov','+998901234567','private@example.test','quote','uz','qualified',json.dumps([{'fullName':'Aziz Karimov','passportNumber':'AA1234567'}]),int(now.timestamp()*1000)))
        snapshot={'route':'Tashkent → Dubai','passengerName':'Aziz Karimov','passengers':1,'language':'uz'}
        connection.execute('insert into lead_checkouts values(?,?,?,?,?,?,?,?,?,?,?,?)',(21,'legacy-checkout',token,hashlib.sha256(token.encode()).hexdigest(),str(uuid.uuid4()),json.dumps(snapshot),115680,'USD',(now+timedelta(days=7)).isoformat(),None,json.dumps({'profitMinor':'5680'}),'{}'))
        connection.execute('insert into lead_checkouts_lead_lnk values(1,21,11)')
        connection.execute('insert into agent_ticket_quotes values(?,?,?,?,?,?)',(31,'legacy-quote',str(uuid.uuid4()),'{"price":1100}','{}',(now+timedelta(minutes=30)).isoformat()));connection.execute('insert into agent_ticket_quotes_lead_lnk values(1,31,11)')
        connection.execute('insert into hot_flights values(1,"same-document","Draft","$1",null)');connection.execute('insert into hot_flights values(2,"same-document","Published","$700",?)',(now.isoformat(),))
        connection.execute('insert into files values(1,"/uploads/offer.png")');connection.execute('insert into files_related_mph values(1,1,1,"api::card-flights.card-flights","image")')
        connection.execute('insert into newsletter_subscribers values(1,"subscriber","USER@example.test","uz")')
        connection.execute('insert into telegram_chats values(1,"chat","42","Client","654321")')
        connection.execute('insert into telegram_messages values(1,"message","update:1","42","Hello","incoming","received",0)')
        connection.execute('insert into telegram_messages values(2,"message2","reply:1","42","Reply in flight","outgoing","sending",1)')
        connection.execute('insert into bookings values(1,"booking","Aziz Karimov","AA1234567","HY333",700,?)',(now.isoformat(),))
        connection.execute('insert into flightsearch values(1,"search","TAS","DXB","2030-05-15",?)',(now.isoformat(),))
        connection.commit();connection.close()
    def run_import(self,apply=False):
        call_command('import_strapi',database=self.database,uploads=self.uploads,apply=apply,stdout=io.StringIO())
    def test_dry_run_changes_nothing(self):
        before=hashlib.sha256(self.database.read_bytes()).digest();self.run_import();self.assertEqual(Lead.objects.count(),0);self.assertFalse(self.media.exists());self.assertEqual(hashlib.sha256(self.database.read_bytes()).digest(),before)
    def test_import_preserves_references_relations_prices_media_and_tokens(self):
        before=hashlib.sha256(self.database.read_bytes()).digest();self.run_import(True)
        lead=Lead.objects.get(client_id='654321');checkout=active_checkout(self.token)
        self.assertEqual(checkout.lead,lead);self.assertEqual(checkout.amount_minor,115680);self.assertEqual(checkout.pricing['profitMinor'],'5680');self.assertEqual(public_checkout(checkout)['booking']['clientId'],'654321')
        self.assertEqual(lead.passport_details[0]['passportNumber'],'AA1234567');self.assertEqual(FareQuote.objects.get().lead,lead)
        self.assertEqual(HotFlight.objects.count(),2);offer=HotFlight.objects.get(published=True);self.assertTrue(offer.published);self.assertEqual(offer.title,'Published');self.assertEqual(offer.legacy_image,'/uploads/offer.png')
        self.assertEqual((self.media/'offer.png').read_bytes(),b'preserved-upload');self.assertEqual(NewsletterSubscriber.objects.get().email,'user@example.test');self.assertEqual(TelegramChat.objects.get().lead,lead)
        self.assertEqual(TelegramMessage.objects.get(event_key='reply:1').delivery_status,'unknown');self.assertEqual(Booking.objects.count(),1);self.assertEqual(SavedSearch.objects.count(),1);self.assertEqual(hashlib.sha256(self.database.read_bytes()).digest(),before)
    def test_import_is_idempotent_and_does_not_overwrite_new_edits(self):
        self.run_import(True);lead=Lead.objects.get();lead.notes='New Django notes';lead.save();self.run_import(True)
        self.assertEqual(Lead.objects.count(),1);self.assertEqual(Checkout.objects.count(),1);self.assertEqual(TelegramMessage.objects.count(),2);lead.refresh_from_db();self.assertEqual(lead.notes,'New Django notes')
