import io
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import Client, TestCase, override_settings
from travel.models import Lead, TelegramChat

class LoginDashboardRegressionTests(TestCase):
    def setUp(self):
        call_command('bootstrap_roles',stdout=io.StringIO())
        self.user=User.objects.create_superuser('production-test','admin@example.test','Temporary-test-password!42')
        self.client=Client(enforce_csrf_checks=True,HTTP_ORIGIN='https://testserver')
    def sign_in(self, path='/office/login/'):
        self.client.get(path,secure=True)
        token=self.client.cookies['csrftoken'].value
        return self.client.post(path,{'username':self.user.username,'password':'Temporary-test-password!42','csrfmiddlewaretoken':token},secure=True,follow=True)
    def test_valid_login_dashboard_session_and_logout(self):
        response=self.sign_in()
        self.assertEqual(response.status_code,200)
        self.assertContains(response,'Latest enquiries')
        self.assertEqual(str(self.user.pk),self.client.session['_auth_user_id'])
        self.assertEqual(self.client.get('/office/',secure=True).status_code,200)
        self.assertEqual(self.client.get('/office/logout/',secure=True).status_code,405)
        token=self.client.cookies['csrftoken'].value
        self.assertEqual(self.client.post('/office/logout/',{'csrfmiddlewaretoken':token},secure=True).status_code,302)
        self.assertNotIn('_auth_user_id',self.client.session)
    def test_bad_credentials_and_csrf_do_not_create_session(self):
        self.client.get('/office/login/',secure=True)
        token=self.client.cookies['csrftoken'].value
        response=self.client.post('/office/login/',{'username':self.user.username,'password':'wrong','csrfmiddlewaretoken':token},secure=True)
        self.assertEqual(response.status_code,200)
        self.assertNotIn('_auth_user_id',self.client.session)
        self.assertEqual(self.client.post('/office/login/',{'username':self.user.username,'password':'wrong'},secure=True).status_code,403)
    def test_unassigned_client_record_renders(self):
        row=Lead.objects.create(source='agent',phone='+998901234567')
        Lead.objects.filter(pk=row.pk).update(assigned_to=None)
        self.client.force_login(self.user)
        self.assertEqual(self.client.get('/office/',{'section':'leads','lead':row.client_id},secure=True).status_code,200)
    def test_invalid_record_and_chat_references_return_404(self):
        self.client.force_login(self.user)
        chat=TelegramChat.objects.create(chat_id='42',display_name='Fixture chat')
        for params in [{'section':'offers','record':'bad'},{'section':'telegram','chat':'bad'},{'section':'telegram','chat':str(chat.pk),'before':'²'}]:
            with self.subTest(params=params):self.assertEqual(self.client.get('/office/',params,secure=True).status_code,404)

@override_settings(CRM_ROOT_ENABLED=True,LOGIN_URL='/',LOGIN_REDIRECT_URL='/',LOGOUT_REDIRECT_URL='/')
class CRMRootTests(LoginDashboardRegressionTests):
    def test_root_renders_login_and_dashboard_without_office_redirect(self):
        response=self.client.get('/',secure=True)
        self.assertEqual(response.status_code,200)
        self.assertContains(response,'Sign in')
        self.assertIn('no-store',response['Cache-Control'])
        response=self.sign_in('/')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.request['PATH_INFO'],'/')
        self.assertContains(response,'Latest enquiries')
        self.assertEqual(self.client.get('/office',secure=True).status_code,302)
        self.assertEqual(self.client.get('/office/',secure=True).status_code,200)
        self.assertEqual(self.client.get('/api/airports',secure=True).status_code,200)
        token=self.client.cookies['csrftoken'].value
        response=self.client.post('/office/logout/',{'csrfmiddlewaretoken':token},secure=True,follow=True)
        self.assertEqual(response.request['PATH_INFO'],'/')
        self.assertContains(response,'Sign in')
    def test_external_next_is_rejected(self):
        self.client.get('/',secure=True);token=self.client.cookies['csrftoken'].value
        response=self.client.post('/',{'username':self.user.username,'password':'Temporary-test-password!42','next':'https://attacker.invalid','csrfmiddlewaretoken':token},secure=True)
        self.assertEqual(response['Location'],'/')
    def test_nonstaff_and_inactive_cannot_sign_in(self):
        for changes in [{'is_staff':False},{'is_active':False}]:
            self.user.is_staff=True;self.user.is_active=True
            for key,value in changes.items():setattr(self.user,key,value)
            self.user.save();response=self.sign_in('/')
            self.assertEqual(response.status_code,200);self.assertNotIn('_auth_user_id',self.client.session)

class ProductionCookieAndCorsTests(TestCase):
    @override_settings(SESSION_COOKIE_SECURE=True,CSRF_COOKIE_SECURE=True)
    def test_secure_login_cookies_and_expected_origin_only(self):
        user=User.objects.create_user('secure-staff',password='Temporary-test-password!42',is_staff=True)
        self.client.get('/office/login/',secure=True)
        self.assertTrue(self.client.cookies['csrftoken']['secure'])
        self.client.force_login(user)
        response=self.client.get('/office/',secure=True)
        self.assertEqual(response.status_code,200)
        from django.conf import settings
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
    @override_settings(CORS_ALLOWED_ORIGINS=['https://staraviatravel.com','https://www.staraviatravel.com'])
    def test_public_api_cors_and_office_is_not_cross_origin(self):
        for origin in ['https://staraviatravel.com','https://www.staraviatravel.com']:
            response=self.client.get('/api/airports',HTTP_ORIGIN=origin)
            self.assertEqual(response['Access-Control-Allow-Origin'],origin)
            self.assertNotIn('Access-Control-Allow-Credentials',response)
        self.assertNotIn('Access-Control-Allow-Origin',self.client.get('/api/airports',HTTP_ORIGIN='https://attacker.invalid'))
        self.assertNotIn('Access-Control-Allow-Origin',self.client.get('/office/',HTTP_ORIGIN='https://staraviatravel.com'))

class ASCIILocaleStartupTests(TestCase):
    def test_startup_check_does_not_depend_on_process_locale(self):
        import os,subprocess,sys
        from django.conf import settings
        environment={**os.environ,'LC_ALL':'C','PYTHONUTF8':'0','PYTHONCOERCECLOCALE':'0','DJANGO_SECRET_KEY':'fixture-only-signing-value-not-a-production-secret'}
        result=subprocess.run([sys.executable,str(settings.BASE_DIR/'manage.py'),'check','--settings=config.test_settings'],cwd=settings.BASE_DIR,env=environment,capture_output=True,timeout=30)
        self.assertEqual(result.returncode,0,result.stderr.decode('utf-8',errors='replace'))
