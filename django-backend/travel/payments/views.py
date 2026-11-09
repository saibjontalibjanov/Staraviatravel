from django.views.decorators.csrf import csrf_exempt
from travel.api import endpoint, body, rate
from travel.services.validation import ServiceError
from .service import checkout_authorization, authorized_payment, initiate, public_payment, reconcile, webhook

# Public writes use private Bearer capabilities, never cookie authentication.
# CRM forms continue to use Django sessions and CSRF protection.
@csrf_exempt
@endpoint(['POST'])
def create(request):
    rate(request,'payment-create',10,600)
    return {'payment':public_payment(initiate(checkout_authorization(request),body(request)))},201

@endpoint(['GET'])
def status(request,payment_id):
    rate(request,'payment-status',120,600)
    return {'payment':public_payment(authorized_payment(request,payment_id))}

@csrf_exempt
@endpoint(['POST'])
def verify(request,payment_id):
    rate(request,'payment-verify',12,600)
    return {'payment':public_payment(reconcile(authorized_payment(request,payment_id)))}

@csrf_exempt
@endpoint(['POST'])
def bank_webhook(request):
    if len(request.body)>65536:raise ServiceError('Notification too large.',413)
    webhook(request.body,request.headers)
    return {'received':True}
