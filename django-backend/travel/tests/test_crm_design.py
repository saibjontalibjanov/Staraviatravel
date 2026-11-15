from django.contrib.auth.models import User, Permission
from django.test import TestCase, override_settings
from travel.models import Lead, Partner, FAQ


@override_settings(CRM_ROOT_ENABLED=True, LOGIN_URL='/')
class CrmDesignTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_superuser('design-admin', 'admin@example.test', 'test-pass-only')
        self.client.force_login(self.staff)

    def test_root_uses_reference_components_and_real_counts(self):
        Lead.objects.create(first_name='Stored client', phone='+998901234567', source='agent')
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['lead_count'], 1)
        self.assertEqual(list(response.context['lead_sources']), [{'source':'agent', 'total':1}])
        self.assertContains(response, 'Stored client')
        self.assertContains(response, 'office/reference.css')
        self.assertContains(response, 'data-collapse')
        self.assertContains(response, 'aria-current="page"')
        self.assertContains(response, 'Search CRM clients')
        self.assertNotContains(response, '<iframe')
        self.assertNotContains(response, 'demo records')
        self.assertEqual(response['Cache-Control'], 'no-store, private')

    def test_content_cards_and_filters_use_database_and_protected_previews(self):
        draft = Partner.objects.create(name='Private fixture', logo='partners/draft.png', published=False)
        published = Partner.objects.create(name='Published fixture', logo='partners/public.png')
        response = self.client.get('/', {'section':'partners','visibility':'draft','q':'Private'})
        self.assertContains(response, 'Private fixture')
        self.assertContains(response, f'/office/partners/{draft.pk}/logo')
        self.assertNotContains(response, '/uploads/partners/')
        self.assertNotContains(response, 'Published fixture')
        self.assertEqual(list(response.context['page']), [draft])
        response = self.client.get('/', {'section':'partners','record':published.pk})
        self.assertNotContains(response, '/uploads/partners/')
        self.assertContains(response, 'multipart/form-data')
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_form_validation_and_permissions_survive_redesign(self):
        self.assertEqual(self.client.post('/?section=partners&record=new', {'name':'Missing upload','position':0}).status_code, 200)
        self.assertFalse(Partner.objects.exists())
        user = User.objects.create_user('view-only', is_staff=True)
        user.user_permissions.add(Permission.objects.get(codename='view_partner'))
        self.client.force_login(user)
        self.assertNotContains(self.client.get('/?section=partners'), 'Add partner')
        self.assertEqual(self.client.post('/?section=partners&record=new', {}).status_code, 403)
        self.assertEqual(self.client.get('/?section=team').status_code, 403)
        response = self.client.get('/')
        self.assertIsNone(response.context['lead_count'])
        self.assertNotContains(response, 'Lead sources')
        self.assertNotContains(response, 'Search CRM clients')

    def test_faq_search_and_publication_filter_are_server_side(self):
        row = FAQ.objects.create(question_en='Unique english', answer_en='Answer', question_uz='Maxsus savol', answer_uz='Javob', question_ru='Vopros', answer_ru='Otvet', published=False)
        response = self.client.get('/', {'section':'faqs','q':'Maxsus','visibility':'draft'})
        self.assertEqual(list(response.context['page']), [row])
        self.assertContains(response, 'Unique english')
        self.assertContains(response, 'Maxsus savol')
        self.assertContains(response, 'Draft')

    def test_account_profile_updates_only_current_user_and_validates_email(self):
        user = User.objects.create_user('ordinary-staff', is_staff=True)
        other = User.objects.create_user('other-staff', is_staff=True)
        self.client.force_login(user)
        data = {'action':'profile','profile-first_name':'Updated','profile-last_name':'Staff','profile-email':'invalid','is_superuser':'on','user_id':other.pk}
        self.assertEqual(self.client.post('/?section=account', data).status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.first_name, '')
        data['profile-email'] = 'staff@example.test'
        self.assertEqual(self.client.post('/?section=account', data).status_code, 302)
        user.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(user.first_name, 'Updated')
        self.assertEqual(user.email, 'staff@example.test')
        self.assertFalse(user.is_superuser)
        self.assertEqual(other.first_name, '')

    def test_profile_write_requires_csrf(self):
        from django.test import Client
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.staff)
        self.assertEqual(client.post('/?section=account', {'action':'profile','profile-first_name':'Blocked'}).status_code, 403)
        self.staff.refresh_from_db()
        self.assertEqual(self.staff.first_name, '')

    def test_pipeline_and_table_share_real_records_and_stage_updates_validate(self):
        lead = Lead.objects.create(first_name='Pipeline fixture', phone='+998901234567', source='agent')
        response = self.client.get('/?section=leads')
        self.assertContains(response, 'pipeline-board')
        self.assertContains(response, 'Pipeline fixture')
        self.assertEqual(response.context['lead_columns'][0]['rows'], [lead])
        self.assertContains(self.client.get('/?section=leads&view=table'), 'Client directory')
        url = '/?section=leads'
        data = {'action':'stage','client_id':lead.client_id,'lead_status':'contacted'}
        self.assertEqual(self.client.post(url, data).status_code, 302)
        lead.refresh_from_db()
        self.assertEqual(lead.lead_status, 'contacted')
        data['lead_status'] = 'made-up'
        self.assertEqual(self.client.post(url, data).status_code, 400)
        lead.refresh_from_db()
        self.assertEqual(lead.lead_status, 'contacted')
        user = User.objects.create_user('pipeline-viewer', is_staff=True)
        user.user_permissions.add(Permission.objects.get(codename='view_lead'))
        self.client.force_login(user)
        self.assertNotContains(self.client.get(url), 'stage-form')
        self.assertEqual(self.client.post(url, data).status_code, 403)

    def test_pipeline_writes_require_csrf(self):
        from django.test import Client
        lead = Lead.objects.create(phone='+998901234567', source='agent')
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.staff)
        self.assertEqual(client.post('/?section=leads', {'action':'stage','client_id':lead.client_id,'lead_status':'closed'}).status_code, 403)
        lead.refresh_from_db()
        self.assertEqual(lead.lead_status, 'new')
