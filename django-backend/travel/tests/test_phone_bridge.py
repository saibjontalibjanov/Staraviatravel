import io,hashlib
from datetime import timedelta
from django.contrib.auth.models import User,Group,Permission
from django.core.management import call_command
from django.test import TestCase,override_settings,Client
from django.utils import timezone
from travel.models import Lead,PhoneCall,PhoneCallEvent

@override_settings(PHONE_BRIDGE_TOKEN='test-device-token-with-32-characters-minimum',PHONE_BRIDGE_LINE='+998910235737')
class PhoneBridgeTests(TestCase):
    def setUp(self):
        call_command('bootstrap_roles',stdout=io.StringIO())
        self.staff=User.objects.create_user('call-manager',is_staff=True)
        self.staff.groups.add(Group.objects.get(name='Managers'))
        self.lead=Lead.objects.create(phone='+998901112233',first_name='Caller',last_name='Fixture')
        self.time=timezone.now().isoformat()
    def send(self,**changes):
        data={'deviceId':'business-huawei','callId':'call-1','eventId':'call-1-ringing','phone':'+998901112233','direction':'incoming','status':'ringing','occurredAt':self.time,**changes}
        return self.client.post('/api/phone-bridge/events',data,content_type='application/json',secure=True,HTTP_AUTHORIZATION='Bearer test-device-token-with-32-characters-minimum')
    def test_event_matches_customer_and_duplicate_delivery_is_idempotent(self):
        for _ in range(2):self.assertEqual(self.send().status_code,200)
        self.assertEqual(PhoneCall.objects.count(),1);self.assertEqual(PhoneCallEvent.objects.count(),1)
        call=PhoneCall.objects.get();self.assertEqual(call.lead,self.lead);self.assertEqual(call.line_number,'+998910235737')
        self.assertEqual(self.send(eventId='end-1',status='completed',durationSeconds=63).status_code,200)
        call.refresh_from_db();self.assertEqual(call.status,'completed');self.assertEqual(call.duration_seconds,63)
    def test_auth_https_and_disabled_bridge(self):
        response=self.client.post('/api/phone-bridge/events',{},content_type='application/json',secure=True)
        self.assertEqual(response.status_code,403)
        with override_settings(PHONE_BRIDGE_TOKEN=''):
            self.assertEqual(self.send().status_code,503)
        self.assertEqual(self.client.post('/api/phone-bridge/events',{},content_type='application/json').status_code,403)
        self.assertFalse(PhoneCall.objects.exists())
    def test_ambiguous_and_private_numbers_do_not_choose_arbitrary_client(self):
        Lead.objects.create(phone='+998 90 111 22 33',first_name='Duplicate')
        self.send();call=PhoneCall.objects.get();self.assertIsNone(call.lead);self.assertEqual(call.match_count,2)
        self.send(callId='private',eventId='private-ring',phone='')
        self.assertEqual(PhoneCall.objects.get(remote_number='').match_count,0)
        # A different international number sharing a suffix must never match.
        self.send(callId='foreign',eventId='foreign-ring',phone='+1901112233')
        self.assertIsNone(PhoneCall.objects.get(remote_number='+1901112233').lead)
    def test_out_of_order_and_missing_number_updates_preserve_terminal_state_and_identity(self):
        self.send(status='completed',durationSeconds=42)
        older=(timezone.now()-timedelta(seconds=30)).isoformat()
        self.send(eventId='older',status='ringing',phone='',occurredAt=older)
        call=PhoneCall.objects.get();self.assertEqual(call.status,'completed');self.assertEqual(call.duration_seconds,42);self.assertEqual(call.lead,self.lead)
    def test_conflicting_replay_invalid_payload_timestamp_and_no_raw_recording(self):
        self.send();self.assertEqual(self.send(status='missed').status_code,409)
        for changes in [{'audio':'not-supported'},{'phone':'javascript:alert(1)'},{'occurredAt':'bad'},{'occurredAt':(timezone.now()+timedelta(days=1)).isoformat()},{'direction':'invalid'},{'durationSeconds':True},{'deviceId':'x'*65}]:
            with self.subTest(changes=changes):self.assertEqual(self.send(eventId='bad',**changes).status_code,400)
        self.assertEqual(PhoneCallEvent.objects.count(),1)
    def test_permissions_poll_cursor_and_crm_history(self):
        self.send()
        self.assertEqual(self.client.get('/office/api/calls/recent').status_code,401)
        user=User.objects.create_user('no-call-access',is_staff=True);self.client.force_login(user)
        self.assertEqual(self.client.get('/office/api/calls/recent').status_code,403)
        self.client.force_login(self.staff)
        response=self.client.get('/office/api/calls/recent');self.assertEqual(response.status_code,200)
        row=response.json()['calls'][0];self.assertEqual(row['clientId'],self.lead.client_id)
        after=response.json()['cursor'];self.assertEqual(self.client.get('/office/api/calls/recent',{'after':after}).json()['calls'],[])
        self.assertEqual(self.client.get('/office/api/calls/recent',{'after':'bad'}).status_code,400)
        response=self.client.get('/office/?section=calls');self.assertContains(response,'Caller Fixture');self.assertNotContains(response,'test-device-token-with-32-characters-minimum')
        response=self.client.get('/office/',{'section':'leads','lead':'new','phone':'+998901112233'})
        self.assertEqual(response.context['form']['phone'].value(),'+998901112233')
    def test_phone_does_not_receive_customer_data_and_lead_permission_is_respected(self):
        response=self.send();self.assertNotIn('Caller',response.content.decode());self.assertNotIn(self.lead.client_id,response.content.decode())
        viewer=User.objects.create_user('calls-only',is_staff=True);viewer.user_permissions.add(Permission.objects.get(codename='view_phonecall'))
        self.client.force_login(viewer);row=self.client.get('/office/api/calls/recent').json()['calls'][0]
        self.assertIsNone(row['clientId']);self.assertEqual(row['name'],'')
    def test_epoch_timestamp_is_supported(self):
        self.assertEqual(self.send(occurredAt=int(timezone.now().timestamp())).status_code,200)
    def test_formatted_and_local_uzbek_phone_numbers_match_full_customer_number(self):
        self.assertEqual(self.send(phone='90 111 22 33').status_code,200)
        self.assertEqual(PhoneCall.objects.get().remote_number,'+998901112233')
        self.assertEqual(PhoneCall.objects.get().lead,self.lead)
        self.assertEqual(self.send(callId='formatted',eventId='formatted',phone='+998 (90) 111-22-33').status_code,200)
        self.assertEqual(PhoneCall.objects.filter(lead=self.lead).count(),2)
    @override_settings(CRM_ROOT_ENABLED=True,LOGIN_URL='/',LOGIN_REDIRECT_URL='/',LOGOUT_REDIRECT_URL='/')
    def test_call_history_works_at_backend_root(self):
        self.send();self.client.force_login(self.staff)
        response=self.client.get('/?section=calls');self.assertEqual(response.status_code,200);self.assertContains(response,'Caller Fixture')
        self.assertEqual(self.client.get('/office/?section=calls')['Location'],'/?section=calls')
