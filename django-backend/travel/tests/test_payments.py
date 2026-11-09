import hashlib
import io
import uuid
from datetime import timedelta
from unittest.mock import patch, Mock
from django.contrib.auth.models import User, Group
from django.core.management import call_command, CommandError
from django.db import IntegrityError, transaction
from django.test import TestCase, Client, override_settings
from django.utils import timezone
from travel.models import Lead, Checkout, Payment, PaymentEvent, PaymentNotice, AuditEvent
from travel.payments import service
from travel.payments.provider import IpakProvider, HostedSession, VerifiedStatus, VerifiedNotification, ProviderUnavailable
from travel.services.validation import ServiceError

class PaymentTests(TestCase):
    def setUp(self):
        call_command('bootstrap_roles',stdout=io.StringIO())
        self.manager=User.objects.create_user('payment-manager',is_staff=True)
        self.manager.groups.add(Group.objects.get(name='Managers'))
        self.token='a'*43
        self.lead=Lead.objects.create(phone='+998901234567',first_name='Fixture')
        self.checkout=Checkout.objects.create(lead=self.lead,token=self.token,token_hash=hashlib.sha256(self.token.encode()).hexdigest(),snapshot={'passengerName':'Fixture Passenger','passengerDetails':[{'fullName':'Fixture Passenger'}]},amount_minor=125050,currency='UZS',billing_contact={'fullName':'Fixture Passenger'},expires_at=timezone.now()+timedelta(days=1))
        self.provider=Mock()
        self.provider.available.return_value=True
        self.provider.supported_currencies=('UZS',)
        self.provider.create_session.side_effect=lambda payment,urls:HostedSession('bank-'+str(payment.pk),'https://bank-checkout.example.test/session/fixture',timezone.now()+timedelta(minutes=15))
        self.patch=patch('travel.payments.service.get_provider',return_value=self.provider);self.patch.start();self.addCleanup(self.patch.stop)
        self.headers={'HTTP_AUTHORIZATION':'Bearer '+self.token}
    def create(self,**changes):
        return self.client.post('/api/payments/create/',{'requestId':str(uuid.uuid4()),'termsAccepted':True,**changes},content_type='application/json',**self.headers)
    def payment(self):
        response=self.create();self.assertEqual(response.status_code,201,response.content)
        return Payment.objects.get(pk=response.json()['payment']['id'])
    def evidence(self,payment,status='succeeded',**changes):
        return VerifiedStatus(**{'payment_id':payment.pk,'reference':payment.bank_reference or 'bank-fixture','amount_minor':payment.amount_minor,'currency':payment.currency,'status':status,**changes})
    def test_success_updates_order_but_not_ticket_issuance_and_notifies_once(self):
        payment=self.payment();self.provider.verify_status.return_value=self.evidence(payment)
        result=service.reconcile(payment)
        self.assertEqual(result.status,'succeeded');self.assertEqual(result.issuance_status,'ready')
        self.checkout.refresh_from_db();self.assertEqual(self.checkout.payment_status,'paid')
        self.assertIsNotNone(result.paid_at);self.assertIsNotNone(result.verified_at)
        self.assertEqual(PaymentNotice.objects.filter(payment=payment,recipient=self.manager).count(),1)
        self.assertEqual(self.create().json()['payment']['id'],str(payment.pk))
        self.provider.create_session.assert_called_once()
    def test_verified_failed_pending_cancelled_and_expired_states(self):
        for status in ('failed','pending','cancelled','expired'):
            with self.subTest(status=status):
                payment=self.payment();self.provider.verify_status.return_value=self.evidence(payment,status)
                result=service.reconcile(payment)
                self.assertEqual(result.status,status);self.assertEqual(result.issuance_status,'not_ready')
                self.checkout.refresh_from_db();self.assertEqual(self.checkout.payment_status,'unpaid')
                if status=='pending':
                    self.provider.verify_status.return_value=self.evidence(payment,'failed');service.reconcile(payment)
    def test_duplicate_webhook_is_idempotent_and_late_failure_cannot_downgrade_paid(self):
        payment=self.payment();self.provider.verify_webhook.return_value=VerifiedNotification('event-1',payment.pk)
        self.provider.verify_status.return_value=self.evidence(payment)
        for _ in range(2):self.assertEqual(self.client.post('/api/payments/webhook/',b'fixture',content_type='application/octet-stream').status_code,200)
        self.provider.verify_status.assert_called_once()
        self.assertEqual(PaymentNotice.objects.filter(payment=payment,recipient=self.manager).count(),1)
        self.assertEqual(AuditEvent.objects.filter(action='payment.succeeded').count(),1)
        self.provider.verify_status.return_value=self.evidence(payment,'failed');service.reconcile(payment)
        payment.refresh_from_db();self.assertEqual(payment.status,'succeeded')
    def test_invalid_signature_is_rejected_before_any_bank_lookup_or_database_mutation(self):
        self.payment();self.provider.verify_webhook.side_effect=ValueError('untrusted signature fixture')
        before=PaymentEvent.objects.count()
        response=self.client.post('/api/payments/webhook/',b'bad',content_type='application/octet-stream')
        self.assertEqual(response.status_code,403);self.provider.verify_status.assert_not_called();self.assertEqual(PaymentEvent.objects.count(),before)
    def test_missing_auth_wrong_order_and_amount_manipulation(self):
        self.assertEqual(self.client.post('/api/payments/create/',{},content_type='application/json').status_code,401)
        self.assertEqual(self.create(amountMinor=1).status_code,400)
        self.assertEqual(self.create(orderId=self.checkout.pk+1).status_code,400)
        payment=self.payment()
        self.assertEqual(payment.amount_minor,125050)
        self.assertEqual(self.client.get(f'/api/payments/status/{payment.pk}/').status_code,401)
        wrong='b'*43;Checkout.objects.create(lead=self.lead,token=wrong,token_hash=hashlib.sha256(wrong.encode()).hexdigest(),snapshot={},amount_minor=1,currency='UZS',expires_at=self.checkout.expires_at)
        self.assertEqual(self.client.get(f'/api/payments/status/{payment.pk}/',HTTP_AUTHORIZATION='Bearer '+wrong).status_code,404)
        self.assertEqual(self.client.get(f'/api/payments/status/{uuid.uuid4()}/',**self.headers).status_code,404)
    def test_duplicate_initiation_is_one_session_even_with_different_request_ids(self):
        reference=str(uuid.uuid4());first=self.create(requestId=reference)
        for changes in ({'requestId':reference},{}):self.assertEqual(self.create(**changes).json()['payment']['id'],first.json()['payment']['id'])
        self.assertEqual(Payment.objects.count(),1);self.provider.create_session.assert_called_once()
    def test_uncertain_bank_create_blocks_retries_and_can_be_reconciled(self):
        self.provider.create_session.side_effect=TimeoutError('fixture timeout')
        self.assertEqual(self.create().status_code,503)
        payment=Payment.objects.get();self.assertEqual(payment.status,'unknown')
        self.assertEqual(self.create().json()['payment']['status'],'unknown');self.provider.create_session.assert_called_once()
        self.provider.verify_status.return_value=self.evidence(payment)
        result=service.reconcile(payment);self.assertEqual(result.status,'succeeded')
    def test_verification_timeout_and_amount_currency_reference_mismatch_do_not_mark_paid(self):
        payment=self.payment();self.provider.verify_status.side_effect=TimeoutError()
        response=self.client.post(f'/api/payments/status/{payment.pk}/verify/',{},content_type='application/json',**self.headers)
        self.assertEqual(response.status_code,503)
        self.provider.verify_status.side_effect=None
        for mismatch in ({'amount_minor':1},{'currency':'USD'},{'reference':'wrong'},{'payment_id':uuid.uuid4()}):
            self.provider.verify_status.return_value=self.evidence(payment,**mismatch)
            with self.assertRaises(ServiceError):service.reconcile(payment)
        payment.refresh_from_db();self.checkout.refresh_from_db()
        self.assertEqual(payment.status,'pending');self.assertEqual(self.checkout.payment_status,'unpaid')
    def test_safe_redirects_and_expired_sessions_do_not_allow_new_charge(self):
        for url in ('https://evil.example/pay','javascript:alert(1)','https://bank-checkout.example.test@evil.example','http://bank-checkout.example.test','https://bank-checkout.example.test/#bad'):
            with self.assertRaises(ServiceError):service.safe_hosted_url(url)
        payment=self.payment();Payment.objects.filter(pk=payment.pk).update(expires_at=timezone.now()-timedelta(seconds=1))
        data=self.create().json()['payment'];self.assertEqual(data['id'],str(payment.pk));self.assertIsNone(data['checkoutUrl'])
        self.provider.create_session.assert_called_once()
    def test_expired_and_revoked_checkout_creation_denied_but_late_bank_success_is_recorded(self):
        payment=self.payment();Checkout.objects.filter(pk=self.checkout.pk).update(expires_at=timezone.now()-timedelta(seconds=1))
        self.assertEqual(self.create().status_code,404)
        self.provider.verify_status.return_value=self.evidence(payment)
        self.assertEqual(service.reconcile(payment).status,'succeeded')
        self.assertEqual(self.client.get(f'/api/payments/status/{payment.pk}/',**self.headers).status_code,200)
        Checkout.objects.filter(pk=self.checkout.pk).update(revoked_at=timezone.now())
        self.assertEqual(self.client.get(f'/api/payments/status/{payment.pk}/',**self.headers).status_code,404)
    def test_crm_permissions_csrf_and_manual_issuance(self):
        payment=self.payment();self.client.force_login(self.manager)
        self.assertEqual(self.client.get('/office/?section=payments').status_code,200)
        with self.assertRaises(ServiceError):service.mark_issued(payment.pk,self.manager)
        self.provider.verify_status.return_value=self.evidence(payment);service.reconcile(payment)
        self.assertContains(self.client.get('/office/'),'Payment confirmed')
        self.assertEqual(service.mark_issued(payment.pk,self.manager).issuance_status,'issued')
        user=User.objects.create_user('no-payment-access',is_staff=True)
        with self.assertRaises(ServiceError):service.mark_issued(payment.pk,user)
        self.client.force_login(user);self.assertEqual(self.client.get('/office/?section=payments').status_code,403)
        self.assertNotContains(self.client.get('/office/'),'Recent payments')
        csrf=Client(enforce_csrf_checks=True);csrf.force_login(self.manager)
        self.assertEqual(csrf.post('/office/?section=payments',{'action':'verify','payment':str(payment.pk)}).status_code,403)
    def test_constraints_and_non_sensitive_status(self):
        payment=self.payment()
        with self.assertRaises(IntegrityError),transaction.atomic():
            Payment.objects.create(checkout=self.checkout,request_id=uuid.uuid4(),amount_minor=125050,currency='UZS',expires_at=self.checkout.expires_at)
        response=self.client.get(f'/api/payments/status/{payment.pk}/',**self.headers)
        self.assertEqual(response['Cache-Control'],'no-store, private')
        for value in ('profitMinor','billing_contact','bank_reference',self.token):self.assertNotIn(value,response.content.decode())
    def test_unimplemented_adapter_fails_closed_even_with_credentials_and_no_refund_route(self):
        self.patch.stop()
        with override_settings(IPAK_MERCHANT_ID='fixture',IPAK_API_KEY='fixture',IPAK_PAYMENT_MODE='production'):
            self.assertFalse(IpakProvider().available());self.assertEqual(self.create().status_code,503)
            self.assertEqual(self.client.post('/api/payments/webhook/',b'fixture',content_type='application/octet-stream').status_code,503)
            with self.assertRaises(CommandError):call_command('reconcile_payments',stdout=io.StringIO())
            with self.assertRaises(ProviderUnavailable):IpakProvider().refund(None,1)
        self.assertEqual(self.client.post('/api/payments/refund/',{},content_type='application/json').status_code,404)
        self.assertFalse(Payment.objects.exists())
    def test_terms_billing_currency_and_oversized_notification(self):
        self.assertEqual(self.create(termsAccepted=False).status_code,400)
        Checkout.objects.filter(pk=self.checkout.pk).update(billing_contact={})
        self.assertEqual(self.create().status_code,400)
        Checkout.objects.filter(pk=self.checkout.pk).update(currency='USD')
        self.assertEqual(self.create().status_code,409)
        self.assertEqual(self.client.post('/api/payments/webhook/',b'x'*65537,content_type='application/octet-stream').status_code,413)
    def test_changed_order_amount_and_replayed_event_for_other_payment_are_rejected(self):
        payment=self.payment()
        self.provider.verify_status.return_value=self.evidence(payment)
        Checkout.objects.filter(pk=self.checkout.pk).update(amount_minor=999)
        with self.assertRaises(ServiceError):service.reconcile(payment)
        Checkout.objects.filter(pk=self.checkout.pk).update(amount_minor=payment.amount_minor)
        PaymentEvent.objects.create(payment=payment,key=hashlib.sha256(b'collision').hexdigest(),source='webhook',status='pending')
        other=Checkout.objects.create(lead=self.lead,token='c'*43,token_hash=hashlib.sha256(('c'*43).encode()).hexdigest(),snapshot={},amount_minor=1,currency='UZS',expires_at=self.checkout.expires_at)
        other_payment=Payment.objects.create(checkout=other,request_id=uuid.uuid4(),amount_minor=1,currency='UZS',expires_at=other.expires_at)
        evidence=VerifiedStatus(other_payment.pk,'other-bank-ref',1,'UZS','succeeded')
        with self.assertRaises(ServiceError):service.apply_verified(other_payment.pk,evidence,'collision','webhook')
    def test_payment_environment_cannot_be_changed_during_reconciliation(self):
        payment=self.payment()
        self.assertEqual(payment.mode,'sandbox')
        with override_settings(IPAK_PAYMENT_MODE='production'):
            with self.assertRaises(ServiceError):service.reconcile(payment)
        self.provider.verify_status.assert_not_called()

    def test_pending_notification_before_create_response_preserves_hosted_session(self):
        def create_after_notification(payment,urls):
            reference='bank-'+str(payment.pk)
            service.apply_verified(payment.pk,VerifiedStatus(payment.pk,reference,payment.amount_minor,payment.currency,'pending'),'early-notification','webhook')
            return HostedSession(reference,'https://bank-checkout.example.test/session/fixture',timezone.now()+timedelta(minutes=15))
        self.provider.create_session.side_effect=create_after_notification
        response=self.create()
        self.assertEqual(response.status_code,201)
        self.assertEqual(response.json()['payment']['checkoutUrl'],'https://bank-checkout.example.test/session/fixture')
