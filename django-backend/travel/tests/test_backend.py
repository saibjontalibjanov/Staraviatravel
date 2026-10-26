import json
import io
import uuid
from datetime import timedelta, date
from decimal import Decimal
from unittest.mock import Mock, patch
from django.test import TestCase, Client, override_settings
from django.core.management import call_command
from django.contrib.auth.models import User, Group
from django.utils import timezone
from travel.models import Lead, Checkout, FareQuote, HotFlight, NewsletterSubscriber, TelegramChat, TelegramMessage, RateBucket
from travel.services.validation import ServiceError, passports_input, journeys_input, billing_input
from travel.services.checkouts import create_checkout, admin_checkout, active_checkout
from travel.services.flights import search_flights, normalize_search
from travel.services.telegram import ingest_update, drain_outbox, queue_message, call_telegram, TelegramError

FUTURE=(timezone.localdate()+timedelta(days=30)).isoformat()
LATER=(timezone.localdate()+timedelta(days=37)).isoformat()
def passport():return {'id':str(uuid.uuid4()),'firstName':'Aziz','lastName':'Karimov','passportNumber':'AA1234567','birthDate':'1990-01-01','expiryDate':'2045-01-01','nationality':'Uzbekistan','passengerType':'adult'}
def leg(**extra):return {'from':'TAS','to':'DXB','fromCity':'Tashkent','toCity':'Dubai','departureDate':FUTURE,'arrivalDate':FUTURE,'departureTime':'08:40','arrivalTime':'11:55','airline':'Test Airways','flightNumber':'HY333','cabin':'Business','durationMinutes':255,**extra}
def payload(quote,**extra):return {'requestId':str(uuid.uuid4()),'quoteReference':str(quote.reference),'route':'Tashkent → Dubai','tripType':'one-way','journeys':[{'legs':[leg()]}],'baggage':[{'type':'checked','allowance':'23 kg','appliesTo':'Each passenger'}],'profit':'56.80','currency':'USD','expiryDays':7,'language':'en','fareTerms':'Refunds subject to actual fare conditions.','paymentInformation':'Contact your agent to arrange payment.','fareConfirmed':True,**extra}
def contact(**extra):return {'fullName':'Aziz Karimov','email':'Client@Example.test','phone':'+998901234567','country':'Uzbekistan','city':'Tashkent','address':'Street 10',**extra}
def provider():return {'best_flights':[{'price':1100,'total_duration':255,'flights':[{'airline':'Test Airways','flight_number':'HY333','travel_class':'Business','duration':255,'departure_airport':{'id':'TAS','name':'Tashkent','time':FUTURE+' 08:40'},'arrival_airport':{'id':'DXB','name':'Dubai','time':FUTURE+' 11:55'}}]}]}

class Base(TestCase):
    def setUp(self):
        call_command('bootstrap_roles',verbosity=0,stdout=io.StringIO())
        self.admin=User.objects.create_superuser('administrator','admin@example.test','Test-password-987!')
        self.agent=User.objects.create_user('agent',password='Test-password-987!',is_staff=True)
        self.agent.groups.add(Group.objects.get(name='Agents'))
        self.lead=Lead.objects.create(first_name='Original',last_name='Enquiry',phone='+998901234567',email='private@example.test',source='quote',departure_airport='TAS',arrival_airport='DXB',departure_date=FUTURE,passengers=1,cabin='Business',passport_details=passports_input([passport()]))
        self.quote=FareQuote.objects.create(lead=self.lead,agent=self.agent,offer={'price':1100},search={'passengers':1},expires_at=timezone.now()+timedelta(minutes=30))
    def post(self,url,data):return self.client.post(url,json.dumps(data),content_type='application/json')

class PublicContracts(Base):
    def test_lead_contract_whitelists_and_returns_six_digit_reference(self):
        response=self.post('/api/leads',{'data':{'phone':'+998901234567','source':'callback','language':'uz','clientId':'111111','leadStatus':'closed','passportDetails':[passport()],'notes':'internal'}})
        self.assertEqual(response.status_code,201)
        reference=response.json()['data']['clientId'];self.assertRegex(reference,r'^[1-9]\d{5}$')
        lead=Lead.objects.get(client_id=reference);self.assertEqual(lead.passport_details,[]);self.assertEqual(lead.notes,'');self.assertEqual(lead.lead_status,'new');self.assertNotIn('phone',response.json()['data'])
    def test_invalid_booking_and_phone_do_not_save(self):
        for data in [{'source':'callback','phone':'bad'},{'source':'booking','phone':'+998901234567','firstName':'A','lastName':'B','email':'a@example.test'}]:self.assertEqual(self.post('/api/leads',{'data':data}).status_code,400)
        self.assertEqual(Lead.objects.count(),1)
    def test_no_public_lead_or_subscriber_listing(self):
        self.assertEqual(self.client.get('/api/leads').status_code,405)
        self.assertEqual(self.client.get('/api/newsletter').status_code,405)
        self.assertEqual(self.client.get('/api/checkouts').status_code,404)
    def test_airport_catalogue_and_offer_shape(self):
        response=self.client.get('/api/airports');self.assertEqual(response.status_code,200);self.assertTrue(any(a['code']=='TAS' for a in response.json()))
        HotFlight.objects.create(title='Private draft',published=False);offer=HotFlight.objects.create(title='Published trip',published=True,price='$700')
        for query in ['', '?status=draft&populate=*']:
            self.assertEqual([a['title'] for a in self.client.get('/api/hot-flights'+query).json()['data']],['Published trip'])
        self.assertEqual(self.client.get('/api/hot-flights/'+str(offer.pk)).status_code,200)
    def test_newsletter_idempotency_and_language_validation(self):
        for address in [' Client@Example.test ','client@example.test']:
            self.assertEqual(self.post('/api/newsletter',{'data':{'email':address,'language':'uz'}}).json(),{'subscribed':True})
        self.assertEqual(NewsletterSubscriber.objects.count(),1)
        self.assertEqual(self.post('/api/newsletter',{'data':{'email':'bad'}}).status_code,400)
    def test_legacy_record_crud_keeps_original_field_names_and_permissions(self):
        self.client.force_login(self.agent)
        response=self.post('/api/bookings',{'data':{'PassengerName':'Aziz Karimov','PassportNumber':'AA1234567','FlightId':'HY333','PaidPrice':'700.00'}})
        self.assertEqual(response.status_code,200);reference=response.json()['data']['id']
        detail=self.client.get(f'/api/bookings/{reference}');self.assertEqual(detail.json()['data']['PassengerName'],'Aziz Karimov');self.assertIn('no-store',detail['Cache-Control'])
        response=self.client.put(f'/api/bookings/{reference}',json.dumps({'data':{'PassengerName':'Aziz Karimov','PassportNumber':'AA1234567','FlightId':'HY334','PaidPrice':'725.00'}}),content_type='application/json')
        self.assertEqual(response.json()['data']['FlightId'],'HY334')
        self.assertEqual(self.client.delete(f'/api/bookings/{reference}').status_code,403)
        self.client.force_login(self.admin);self.assertEqual(self.client.delete(f'/api/bookings/{reference}').status_code,200)
    def test_rate_limit_persists_between_requests(self):
        for _ in range(20):response=self.post('/api/leads',{'data':{'source':'callback','phone':'+998901234567'}})
        self.assertEqual(response.status_code,201)
        self.assertEqual(self.post('/api/leads',{'data':{'source':'callback','phone':'+998901234567'}}).status_code,429)
    def test_legacy_private_records_require_permissions(self):
        self.assertEqual(self.client.get('/api/bookings').status_code,401)
        self.client.force_login(self.agent);self.assertEqual(self.client.get('/api/bookings').status_code,200)
        self.assertEqual(self.client.get('/api/not-a-real-route').status_code,404)

class CheckoutContracts(Base):
    def create(self,**changes):return create_checkout(self.lead,payload(self.quote,**changes),self.agent)
    def test_exact_total_and_private_data_are_excluded_from_public_json(self):
        checkout=self.create(amountMinor='1',amount='0.01',passengerName='Forged')
        self.assertEqual(checkout.amount_minor,115680);self.assertEqual(checkout.pricing['profitMinor'],'5680')
        data=self.client.get('/api/checkouts/'+checkout.token).json();serialized=json.dumps(data)
        self.assertEqual(data['booking']['clientId'],self.lead.client_id);self.assertEqual(data['booking']['passengerName'],'Aziz Karimov')
        for secret in ['profit','baseMinor','sourceMinor','pricing','AA1234567','1990-01-01','2045-01-01','private@example.test']:self.assertNotIn(secret,serialized)
        self.assertFalse(data['paymentsEnabled'])
    def test_client_link_is_long_private_and_not_cached(self):
        checkout=self.create();self.assertRegex(checkout.token,r'^[A-Za-z0-9_-]{43}$')
        response=self.client.get('/api/checkouts/'+checkout.token);self.assertIn('no-store',response['Cache-Control']);self.assertIn('noindex',response['X-Robots-Tag'])
        self.assertEqual(self.client.get('/api/checkouts/123456').status_code,404)
    def test_expired_revoked_and_deleted_lead_links_are_unavailable(self):
        for change in [{'revoked_at':timezone.now()},{'expires_at':timezone.now()-timedelta(seconds=1)},{'lead':None}]:
            checkout=self.create();Checkout.objects.filter(pk=checkout.pk).update(**change)
            self.assertEqual(self.client.get('/api/checkouts/'+checkout.token).status_code,404)
    def test_billing_name_must_match_passport_and_never_changes_price(self):
        checkout=self.create();url='/api/checkouts/'+checkout.token+'/billing'
        self.assertEqual(self.post(url,contact(fullName='Someone Else')).status_code,400)
        self.assertEqual(self.post(url,contact(fullName=' AZIZ   KARIMOV ',paid=True,amountMinor='1')).json(),{'saved':True})
        checkout.refresh_from_db();self.assertEqual(checkout.amount_minor,115680);self.assertEqual(checkout.billing_contact['fullName'],'Aziz Karimov');self.assertNotIn('paid',checkout.billing_contact)
    def test_retry_creation_is_idempotent(self):
        data=payload(self.quote);first=create_checkout(self.lead,data,self.agent);second=create_checkout(self.lead,data,self.agent)
        self.assertEqual(first.pk,second.pk);self.assertEqual(Checkout.objects.count(),1)
    def test_missing_expired_or_other_lead_quote_is_rejected(self):
        other=Lead.objects.create(phone='+998901234567',source='callback')
        for data in [payload(self.quote,quoteReference='bad'),payload(self.quote,fareConfirmed=False),payload(self.quote,profit='-1')]:
            with self.assertRaises(ServiceError):create_checkout(self.lead,data,self.agent)
        with self.assertRaises(ServiceError):create_checkout(other,payload(self.quote),self.agent)
        self.quote.expires_at=timezone.now()-timedelta(seconds=1);self.quote.save()
        with self.assertRaises(ServiceError):self.create()
    def test_explicit_uzs_conversion(self):
        checkout=self.create(currency='UZS',exchangeRate='12900.123456',profit='10000.25')
        self.assertEqual(checkout.amount_minor,1420013605)
    def test_passport_dates_duplicates_and_missing_data_are_rejected(self):
        for people in [[],[passport(),passport()],[{**passport(),'expiryDate':'2000-01-01'}]]:
            with self.assertRaises(ServiceError):passports_input(people)
        self.lead.passport_details=[];self.lead.save()
        with self.assertRaises(ServiceError):self.create()
    def test_stops_layovers_round_trip_and_multi_city(self):
        first=leg(to='IST',toCity='Istanbul',arrivalTime='10:00',durationMinutes=240)
        onward=leg(**{'from':'IST','fromCity':'Istanbul','departureTime':'12:30','durationMinutes':210})
        journeys=journeys_input([{'legs':[first,onward]}],'one-way');self.assertEqual(journeys[0]['stops'],1);self.assertEqual(journeys[0]['layovers'][0]['minutes'],150);self.assertEqual(journeys[0]['durationMinutes'],600)
        back=leg(**{'from':'DXB','to':'TAS','fromCity':'Dubai','toCity':'Tashkent','departureDate':LATER,'arrivalDate':LATER})
        self.assertEqual(len(self.create(tripType='round-trip',journeys=[{'legs':[leg()]},{'legs':[back]}]).snapshot['journeys']),2)
        back['to']='IST'
        self.assertEqual(len(self.create(tripType='multi-city',journeys=[{'legs':[leg()]},{'legs':[back]}]).snapshot['journeys']),2)
        with self.assertRaises(ServiceError):self.create(tripType='round-trip',journeys=[{'legs':[leg()]},{'legs':[back]}])

class PermissionsAndWorkspace(Base):
    def test_unauthenticated_redirect_and_staff_permission_guards(self):
        self.assertEqual(self.client.get('/office/').status_code,302)
        self.assertEqual(self.client.get(f'/office/api/leads/{self.lead.client_id}/passports').status_code,401)
        ordinary=User.objects.create_user('ordinary',password='test123');self.client.force_login(ordinary);self.assertEqual(self.client.get('/office/').status_code,403)
        staff=User.objects.create_user('empty-staff',password='test123',is_staff=True);self.client.force_login(staff)
        self.assertEqual(self.client.get(f'/office/api/leads/{self.lead.client_id}/passports').status_code,403)
        self.assertEqual(self.client.get('/office/?section=team').status_code,403)
    def test_all_green_workspace_sections_render(self):
        self.client.force_login(self.admin)
        for section in ['dashboard','leads','tickets','offers','telegram','subscribers','bookings','searches','team','settings','audit']:
            response=self.client.get('/office/',{'section':section});self.assertEqual(response.status_code,200,section);self.assertContains(response,'ADMIN & CRM');self.assertEqual(response['Referrer-Policy'],'same-origin')
        for section in ['offers','bookings','searches']:
            self.assertEqual(self.client.get('/office/',{'section':section,'record':'new'}).status_code,200)
        self.assertEqual(self.client.get('/office/',{'section':'leads','lead':self.lead.client_id}).status_code,200)
    def test_agent_cannot_configure_integrations_or_manage_users(self):
        self.client.force_login(self.agent)
        self.assertEqual(self.client.get('/office/?section=team').status_code,403)
        self.assertEqual(self.post('/office/api/telegram/connect',{}).status_code,403)
        self.assertEqual(self.client.get('/office/?section=subscribers').status_code,403)
    def test_csrf_protects_staff_writes_and_logout_is_post_only(self):
        client=Client(enforce_csrf_checks=True);client.force_login(self.admin)
        response=client.put(f'/office/api/leads/{self.lead.client_id}/passports',json.dumps({'passengers':[passport()]}),content_type='application/json');self.assertEqual(response.status_code,403)
        self.assertEqual(client.get('/office/logout/').status_code,405)
    def test_agent_can_save_passports_and_cannot_choose_client_reference(self):
        self.client.force_login(self.agent)
        response=self.client.put(f'/office/api/leads/{self.lead.client_id}/passports',json.dumps({'passengers':[passport()]}),content_type='application/json');self.assertEqual(response.status_code,200)
        self.lead.refresh_from_db();self.assertEqual(self.lead.passport_details[0]['fullName'],'Aziz Karimov')
    def test_subscriber_export_requires_manager_permission(self):
        NewsletterSubscriber.objects.create(email='subscriber@example.test')
        self.client.force_login(self.admin);response=self.client.get('/office/?section=subscribers&export=csv');self.assertEqual(response.status_code,200);self.assertIn('text/csv',response['Content-Type'])

class Flights(Base):
    @override_settings(SERPAPI_KEY='secret-test-key')
    @patch('travel.services.flights.requests.get')
    def test_flight_contract_quote_storage_and_key_privacy(self,http):
        http.return_value=Mock(status_code=200,json=lambda:provider())
        result=search_flights({'departure_id':'tas','arrival_id':'dxb','date':FUTURE,'cabin':'Business','passengers':1},self.lead,self.agent)
        self.assertEqual(result['flights'][0]['price'],1100);self.assertIn('quoteReference',result['flights'][0]);self.assertNotIn('secret-test-key',json.dumps(result));self.assertEqual(http.call_args.kwargs['params']['adults'],1)
    def test_missing_key_and_invalid_dates_do_not_call_provider(self):
        with patch('travel.services.flights.requests.get') as http:
            with self.assertRaises(ServiceError):search_flights({'departure_id':'TAS','arrival_id':'DXB','date':FUTURE})
            http.assert_not_called()
        for change in [{'date':'2000-01-01'},{'passengers':0},{'arrival_id':'TAS'},{'date':'2030-02-30'}]:
            with self.assertRaises(ServiceError):normalize_search({'departure_id':'TAS','arrival_id':'DXB','date':FUTURE,**change})
    @override_settings(SERPAPI_KEY='secret-test-key')
    @patch('travel.services.flights.requests.get')
    def test_multicity_provider_mapping(self,http):
        http.return_value=Mock(status_code=200,json=lambda:provider())
        journeys=[{'departure_id':'TAS','arrival_id':'DXB','date':FUTURE},{'departure_id':'DXB','arrival_id':'IST','date':LATER}]
        search_flights({'tripType':'multi-city','multiCity':journeys,'passengers':1,'cabin':'Business'})
        self.assertEqual(http.call_args.kwargs['params']['type'],3);self.assertEqual(json.loads(http.call_args.kwargs['params']['multi_city_json']),journeys)
    @override_settings(SERPAPI_KEY='secret-test-key')
    @patch('travel.services.flights.requests.get')
    def test_provider_errors_are_sanitized(self,http):
        import requests
        http.side_effect=requests.Timeout('https://provider?api_key=secret-test-key')
        response=self.client.get('/api/flights',{'departure_id':'TAS','arrival_id':'DXB','date':FUTURE})
        self.assertEqual(response.status_code,502);self.assertNotIn('secret-test-key',response.content.decode())

class Telegram(Base):
    def update(self):return {'update_id':123,'message':{'message_id':7,'text':'Hello','chat':{'id':42,'type':'private'},'from':{'first_name':'Client'}}}
    @override_settings(TELEGRAM_WEBHOOK_SECRET='A'*32)
    def test_webhook_signature_and_deduplication(self):
        self.assertEqual(self.post('/api/telegram/webhook',self.update()).status_code,403)
        for _ in range(2):self.assertEqual(self.client.post('/api/telegram/webhook',json.dumps(self.update()),content_type='application/json',HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN='A'*32).status_code,200)
        self.assertEqual(TelegramMessage.objects.count(),1)
    @override_settings(TELEGRAM_BOT_TOKEN='test-token')
    @patch('travel.services.telegram.call_telegram')
    def test_worker_sends_only_claimed_messages_and_marks_acknowledged(self,http):
        chat=TelegramChat.objects.create(chat_id='42',display_name='Client');record=queue_message(chat,'Hello','request:1');http.return_value={'message_id':100}
        self.assertEqual(drain_outbox(),1);self.assertEqual(drain_outbox(),0);http.assert_called_once();record.refresh_from_db();self.assertEqual(record.delivery_status,'sent')
    @override_settings(TELEGRAM_BOT_TOKEN='test-token')
    @patch('travel.services.telegram.call_telegram')
    def test_ambiguous_delivery_is_not_automatically_retried(self,http):
        chat=TelegramChat.objects.create(chat_id='42',display_name='Client');record=queue_message(chat,'Hello','request:1');http.side_effect=TelegramError('Unconfirmed',ambiguous=True)
        drain_outbox();record.refresh_from_db();self.assertEqual(record.delivery_status,'unknown');drain_outbox();http.assert_called_once()
    @override_settings(TELEGRAM_BOT_TOKEN='test-token')
    @patch('travel.services.telegram.call_telegram')
    def test_rate_limit_is_backed_off(self,http):
        chat=TelegramChat.objects.create(chat_id='42',display_name='Client');record=queue_message(chat,'Hello','request:1');http.side_effect=TelegramError('Rate limited',429,retry_after=60)
        drain_outbox();record.refresh_from_db();self.assertEqual(record.delivery_status,'pending');self.assertGreater(record.next_attempt_at,timezone.now())
    def test_reply_reference_prevents_duplicates_and_uncertain_retry_needs_confirmation(self):
        chat=TelegramChat.objects.create(chat_id='42',display_name='Client')
        first=queue_message(chat,'Hello','same-id');self.assertEqual(first.pk,queue_message(chat,'Hello','same-id').pk)
        with self.assertRaises(ServiceError):queue_message(chat,'Changed text','same-id')
        first.delivery_status='unknown';first.save();self.client.force_login(self.agent)
        self.assertEqual(self.post(f'/office/api/telegram/messages/{first.pk}/retry',{}).status_code,409)
