import io
import json
from unittest.mock import patch
from django.contrib.auth.models import User, Group
from django.core.management import call_command
from django.test import TestCase, Client
from travel.forms import LeadForm
from travel.models import Lead, FAQ, Testimonial, RateBucket


class CRMContentTests(TestCase):
    def setUp(self):
        call_command('bootstrap_roles', stdout=io.StringIO())
        self.manager = User.objects.create_user('manager', is_staff=True)
        self.manager.groups.add(Group.objects.get(name='Managers'))
        self.agent = User.objects.create_user('agent', is_staff=True)
        self.agent.groups.add(Group.objects.get(name='Agents'))

    def post_json(self, path, data):
        return self.client.post(path, json.dumps({'data': data}), content_type='application/json')

    def test_public_reviews_are_moderated_and_cannot_self_publish(self):
        response = self.post_json('/api/testimonials', {'name': 'Test client', 'text': 'A thoughtful journey.', 'language': 'uz', 'rating': 4, 'published': True})
        self.assertEqual(response.status_code, 201)
        row = Testimonial.objects.get()
        self.assertFalse(row.published)
        self.assertEqual(self.client.get('/api/testimonials').json()['data'], [])
        self.client.force_login(self.manager)
        response = self.client.post(f'/office/?section=testimonials&record={row.pk}', {'name': row.name, 'text': 'Edited review', 'rating': 4, 'language': 'uz', 'published': 'on'})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.get('/api/testimonials').json()['data'][0]['text'], 'Edited review')
        self.assertNotIn('legacy_key', self.client.get('/api/testimonials').json()['data'][0])

    def test_review_validation_and_abuse_limit(self):
        for update in [{'name': ''}, {'text': ''}, {'language': 'de'}, {'rating': 0}, {'rating': 6}, {'rating': True}]:
            response = self.post_json('/api/testimonials', {'name': 'A', 'text': 'Review', 'rating': 5, **update})
            self.assertEqual(response.status_code, 400)
            RateBucket.objects.all().delete()
        self.assertFalse(Testimonial.objects.exists())
        for _ in range(5):
            self.assertEqual(self.post_json('/api/testimonials', {'name': 'A', 'text': 'Review'}).status_code, 201)
        self.assertEqual(self.post_json('/api/testimonials', {'name': 'A', 'text': 'Review'}).status_code, 429)

    def test_faq_publication_order_and_language(self):
        FAQ.objects.all().delete()
        values = {f'{kind}_{lang}': f'{kind} {lang}' for kind in ['question', 'answer'] for lang in ['uz', 'ru', 'en']}
        second = FAQ.objects.create(**values, position=20)
        first = FAQ.objects.create(**{**values, 'question_en': 'First'}, position=1)
        FAQ.objects.create(**values, position=0, published=False)
        for lang in ['uz', 'ru', 'en']:
            data = self.client.get('/api/faqs', {'language': lang}).json()['data']
            self.assertEqual([row['id'] for row in data], [first.pk, second.pk])
            self.assertEqual(data[0]['answer'], 'answer ' + lang)
        self.assertEqual(self.client.get('/api/faqs?language=invalid').status_code, 400)

    def test_agents_can_read_content_but_only_managers_can_edit(self):
        self.client.force_login(self.agent)
        for section in ['testimonials', 'faqs']:
            self.assertEqual(self.client.get('/office/', {'section': section}).status_code, 200)
            self.assertEqual(self.client.get('/office/', {'section': section, 'record': 'new'}).status_code, 403)
        self.client.force_login(self.manager)
        for section in ['testimonials', 'faqs']:
            self.assertEqual(self.client.get('/office/', {'section': section, 'record': 'new'}).status_code, 200)

    def test_staff_content_writes_require_csrf(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.manager)
        self.assertEqual(client.post('/office/?section=faqs&record=new', {}).status_code, 403)

    def test_random_assignment_uses_active_staff_and_keeps_existing_owner(self):
        User.objects.create_user('inactive', is_staff=True, is_active=False)
        User.objects.create_user('visitor')
        with patch('travel.models.secrets.choice', return_value=self.agent.pk) as choose:
            response = self.post_json('/api/leads', {'source': 'callback', 'phone': '+998901234567'})
            self.assertEqual(response.status_code, 201)
            self.assertEqual(set(choose.call_args.args[0]), {self.agent.pk, self.manager.pk})
        lead = Lead.objects.get(client_id=response.json()['data']['clientId'])
        self.assertEqual(lead.assigned_to, self.agent)
        with patch('travel.models.secrets.choice') as choose:
            lead.notes = 'Updated'; lead.save()
            choose.assert_not_called()
        lead.refresh_from_db(); self.assertEqual(lead.assigned_to, self.agent)

    def test_new_lead_without_staff_stays_available(self):
        User.objects.all().delete()
        lead = Lead.objects.create(source='agent', phone='+998901234567')
        self.assertIsNone(lead.assigned_to)

    def test_booking_accepts_terms_without_payment_preference(self):
        response = self.post_json('/api/leads', {'source': 'booking', 'phone': '+998901234567', 'firstName': 'Test', 'lastName': 'Client', 'email': 'test@example.test', 'termsAccepted': True, 'paymentMethod': 'untrusted-removed-field'})
        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get(client_id=response.json()['data']['clientId'])
        self.assertEqual(lead.payment_method, '')
        for field in ['source', 'lead_status', 'assigned_to', 'airline', 'quoted_price', 'payment_method']:
            self.assertNotIn(field, LeadForm().fields)

    def test_manual_lead_ignores_removed_fields_and_is_assigned(self):
        self.client.force_login(self.manager)
        response = self.client.post('/office/?section=leads&lead=new', {
            'first_name': 'Manual', 'last_name': 'Client', 'phone': '+998901234567', 'language': 'uz',
            'source': 'forged', 'assigned_to': '99999', 'lead_status': 'closed', 'payment_method': 'cash',
        })
        self.assertEqual(response.status_code, 302)
        lead = Lead.objects.get(first_name='Manual')
        self.assertEqual(lead.source, 'agent')
        self.assertEqual(lead.lead_status, 'new')
        self.assertEqual(lead.payment_method, '')
        self.assertIn(lead.assigned_to_id, [self.manager.pk, self.agent.pk])
