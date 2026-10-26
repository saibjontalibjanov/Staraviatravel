from django.conf import settings
from django.contrib.auth.views import LogoutView
from django.http import FileResponse, HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.urls import path, re_path
from django.views.static import serve
from travel import api, office

def health(request):return HttpResponse(status=204)
def frontend(request,path=''):
    if path.startswith(('api/','admin','office/','uploads/','static/')):return JsonResponse({'error':{'message':'Not found.'}},status=404)
    index=settings.BASE_DIR.parent/'dist/index.html'
    return FileResponse(index.open('rb'),content_type='text/html') if index.exists() else HttpResponse('Frontend not built. Run npm run build at the repository root, or use the Vite development server.',status=503)
urlpatterns=[path('office',lambda request:redirect('/office/')),re_path(r'^admin/client=(?P<client_id>[1-9][0-9]{5})$',lambda request,client_id:redirect('/office/?section=leads&lead='+client_id)),path('admin',lambda request:redirect('/office/')),path('admin/',lambda request:redirect('/office/')),path('_health',health),path('office/login/',office.OfficeLogin.as_view(),name='login'),path('office/logout/',LogoutView.as_view(),name='logout'),path('office/',office.office,name='office'),path('api/leads',api.lead_create),path('api/airports',api.airports),path('api/flights',api.flights),path('api/hot-flights',api.hot_flights),path('api/hot-flights/<int:pk>',api.hot_flights),path('api/newsletter',api.newsletter),path('api/checkouts/<str:token>',api.checkout_get),path('api/checkouts/<str:token>/billing',api.checkout_billing),path('api/telegram/webhook',api.telegram_webhook),path('api/<str:kind>/<int:pk>',api.staff_records),path('api/<str:kind>',api.staff_records),path('office/api/search',api.office_api,{'operation':'search'}),path('office/api/leads/<str:client_id>/passports',api.office_api,{'operation':'passports'}),path('office/api/leads/<str:client_id>/checkouts',api.office_api,{'operation':'checkouts'}),path('office/api/leads/<str:client_id>/checkouts/<int:pk>/revoke',api.office_api,{'operation':'revoke'}),path('office/api/telegram/status',api.office_api,{'operation':'telegram-status'}),path('office/api/telegram/connect',api.office_api,{'operation':'telegram-connect'}),path('office/api/telegram/webhook',api.office_api,{'operation':'telegram-webhook'}),path('office/api/telegram/chats/<int:pk>/reply',api.office_api,{'operation':'telegram-reply'}),path('office/api/telegram/chats/<int:pk>/link',api.office_api,{'operation':'telegram-link'}),path('office/api/telegram/messages/<int:pk>/retry',api.office_api,{'operation':'telegram-retry'})]
if settings.DEBUG:urlpatterns+=[re_path(r'^uploads/(?P<path>.*)$',serve,{'document_root':settings.MEDIA_ROOT})]
urlpatterns+=[re_path(r'^(?P<path>.*)$',frontend)]
