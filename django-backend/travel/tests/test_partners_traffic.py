import io,json,uuid,tempfile
from datetime import timedelta
from PIL import Image
from django.test import TestCase, override_settings
from django.contrib.auth.models import User,Group
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from travel.models import Partner,WebsiteVisitor,WebsitePageView

class PartnersTrafficTests(TestCase):
    def setUp(self):
        call_command('bootstrap_roles',stdout=io.StringIO())
        self.staff=User.objects.create_user('manager',is_staff=True)
        self.staff.groups.add(Group.objects.get(name='Managers'))
    def post_visit(self,**changes):
        data={'visitorId':str(uuid.uuid4()),'eventId':str(uuid.uuid4()),'path':'/','language':'uz',**changes}
        return self.client.post('/api/visits',json.dumps({'data':data}),content_type='application/json')
    def test_visits_are_idempotent_and_unique_browsers_are_deduplicated(self):
        visitor=str(uuid.uuid4());event=str(uuid.uuid4())
        for _ in range(2):self.assertEqual(self.post_visit(visitorId=visitor,eventId=event).status_code,200)
        self.assertEqual(WebsitePageView.objects.count(),1)
        self.post_visit(visitorId=visitor,path='/about-us')
        self.assertEqual(WebsiteVisitor.objects.count(),1);self.assertEqual(WebsitePageView.objects.count(),2)
        self.assertNotEqual(WebsiteVisitor.objects.get().key,visitor)
        self.client.force_login(self.staff)
        response=self.client.get('/office/?section=visitors')
        self.assertEqual(response.context['traffic']['total'],1)
        self.assertEqual(response.context['traffic']['today'],1)
        self.assertEqual(response.context['traffic']['todayViews'],2)
    def test_heartbeat_updates_active_status_without_inflating_views(self):
        visitor=str(uuid.uuid4());self.post_visit(visitorId=visitor)
        WebsiteVisitor.objects.update(last_seen=timezone.now()-timedelta(minutes=10))
        response=self.post_visit(visitorId=visitor,type='heartbeat')
        self.assertTrue(response.json()['recorded']);self.assertEqual(WebsitePageView.objects.count(),1)
        self.assertGreater(WebsiteVisitor.objects.get().last_seen,timezone.now()-timedelta(minutes=1))
        self.assertFalse(self.post_visit(type='heartbeat').json()['recorded'])
        self.assertEqual(WebsiteVisitor.objects.count(),1)
    def test_private_urls_and_invalid_ids_never_enter_analytics(self):
        for change in [{'path':'/checkout/private-token'},{'path':'/?email=private@example.test'},{'path':'/office/'},{'visitorId':'bad'},{'eventId':'bad'},{'language':'de'}]:
            self.assertEqual(self.post_visit(**change).status_code,400)
        self.assertFalse(WebsitePageView.objects.exists())
    def test_bot_requests_and_public_statistics_access(self):
        self.client.defaults['HTTP_USER_AGENT']='Googlebot'
        self.assertFalse(self.post_visit().json()['recorded'])
        self.assertEqual(self.client.get('/office/?section=visitors').status_code,302)
        user=User.objects.create_user('unprivileged',is_staff=True);self.client.force_login(user)
        self.assertEqual(self.client.get('/office/?section=visitors').status_code,403)
        self.assertFalse(WebsitePageView.objects.exists())
        self.client.defaults['HTTP_USER_AGENT']='Mozilla/5.0'
        for header in ['HTTP_DNT','HTTP_SEC_GPC']:
            self.client.defaults[header]='1';self.assertFalse(self.post_visit().json()['recorded']);del self.client.defaults[header]
    def test_partner_cms_upload_publication_order_and_permissions(self):
        with tempfile.TemporaryDirectory() as directory,override_settings(MEDIA_ROOT=directory):
            self.client.force_login(self.staff)
            image=io.BytesIO();Image.new('RGB',(120,50),(240,140,30)).save(image,'PNG')
            response=self.client.post('/office/?section=partners&record=new',{'name':'Fixture Partner','logo':SimpleUploadedFile('partner.png',image.getvalue(),content_type='image/png'),'website':'https://partner.example','position':2,'published':'on'})
            self.assertEqual(response.status_code,302)
            row=Partner.objects.get();Partner.objects.create(name='Hidden',logo='partners/hidden.png',published=False,position=0)
            earlier=Partner.objects.create(name='First',logo='partners/first.png',position=1)
            data=self.client.get('/api/partners').json()['data']
            self.assertEqual([item['id'] for item in data],[earlier.pk,row.pk]);self.assertTrue(data[1]['logo'].endswith('partner.png'))
            self.assertNotIn('legacy_key',data[1])
            self.assertEqual(self.client.get('/office/?section=partners').status_code,200)
            self.assertEqual(self.client.get('/office/?section=partners&record='+str(row.pk)).status_code,200)
            agent=User.objects.create_user('agent',is_staff=True);agent.groups.add(Group.objects.get(name='Agents'));self.client.force_login(agent)
            self.assertEqual(self.client.get('/office/?section=partners').status_code,200)
            self.assertEqual(self.client.get('/office/?section=partners&record='+str(row.pk)).status_code,403)
    def test_partner_form_rejects_svg_and_unsafe_links(self):
        from travel.forms import PartnerForm
        bad=PartnerForm({'name':'Bad','website':'https://user:password@partner.example','position':0},{'logo':SimpleUploadedFile('bad.svg',b'<svg/>',content_type='image/svg+xml')})
        self.assertFalse(bad.is_valid());self.assertIn('logo',bad.errors);self.assertIn('website',bad.errors)
