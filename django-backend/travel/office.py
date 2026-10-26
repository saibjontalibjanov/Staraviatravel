import json
from decimal import Decimal
from urllib.parse import urlencode
from django import forms
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash
from travel.models import Lead, Checkout, HotFlight, NewsletterSubscriber, TelegramChat, TelegramMessage, Booking, SavedSearch, AuditEvent
from travel.forms import StaffLoginForm, LeadForm, HotFlightForm, BookingForm, SavedSearchForm, StaffCreationForm
from travel.services.leads import limit, audit
from travel.services.validation import ServiceError
from travel.services.telegram import config_status
from travel.services.checkouts import admin_checkout

SECTIONS=[('dashboard','Overview','◫',None),('leads','Leads & CRM','◎','travel.view_lead'),('tickets','Ticket search','✈','travel.search_flights'),('offers','Website offers','▧','travel.view_hotflight'),('telegram','Telegram inbox','➤','travel.view_telegramchat'),('subscribers','Subscribers','✉','travel.view_newslettersubscriber'),('bookings','Booking records','▤','travel.view_booking'),('searches','Saved searches','⌕','travel.view_savedsearch'),('team','Team access','♙','superuser'),('settings','Integrations','⚙','travel.configure_telegram'),('audit','Activity log','◷','travel.view_auditevent'),('account','My account','♙',None)]

def available(user):return [item for item in SECTIONS if item[3] is None or (user.is_superuser if item[3]=='superuser' else user.has_perm(item[3]))]

class OfficeLogin(LoginView):
    template_name='office/login.html'
    authentication_form=StaffLoginForm
    redirect_authenticated_user=False
    def post(self,request,*args,**kwargs):
        try:limit(f'login:{request.META.get("REMOTE_ADDR","")}',10,300)
        except ServiceError:
            form=self.get_form();form.add_error(None,'Too many sign-in attempts. Please wait five minutes.')
            return self.render_to_response(self.get_context_data(form=form),status=429)
        return super().post(request,*args,**kwargs)

@login_required
def office(request):
    if not request.user.is_staff or not request.user.is_active:raise PermissionDenied
    section=request.GET.get('section','dashboard')
    navigation=available(request.user)
    if section not in [row[0] for row in navigation]:raise PermissionDenied
    context={'section':section,'navigation':navigation,'page_title':next(row[1] for row in navigation if row[0]==section),'today':timezone.localdate().isoformat()}
    user=request.user
    if section=='dashboard':
        context.update(lead_count=Lead.objects.count() if user.has_perm('travel.view_lead') else None,new_count=Lead.objects.filter(lead_status='new').count() if user.has_perm('travel.view_lead') else None,checkout_count=Checkout.objects.count() if user.has_perm('travel.manage_checkouts') else None,subscriber_count=NewsletterSubscriber.objects.count() if user.has_perm('travel.view_newslettersubscriber') else None,recent_leads=Lead.objects.select_related('assigned_to')[:6] if user.has_perm('travel.view_lead') else [],recent_activity=AuditEvent.objects.select_related('actor')[:6] if user.has_perm('travel.view_auditevent') else [])
    elif section=='leads':
        reference=request.GET.get('lead')
        lead=get_object_or_404(Lead,client_id=reference) if reference and reference!='new' else None
        if reference:
            permission='travel.change_lead' if lead else 'travel.add_lead'
            if request.method=='POST' and not user.has_perm(permission):raise PermissionDenied
            if request.method=='POST' and request.POST.get('action')=='delete':
                if not lead or not user.has_perm('travel.delete_lead'):raise PermissionDenied
                if request.POST.get('confirm_delete')!='DELETE':messages.error(request,'Type DELETE to confirm removal.');return redirect(request.get_full_path())
                reference=lead.client_id;lead.delete();audit(user,'lead.deleted',reference);messages.success(request,'Client removed. Associated checkout links are unavailable.');return redirect('/office/?section=leads')
            form=LeadForm(request.POST or None,instance=lead,initial={'source':'agent','language':'uz'})
            if request.method=='POST' and form.is_valid():
                record=form.save();audit(user,'lead.updated' if lead else 'lead.created',record.client_id);messages.success(request,'Client record saved.');return redirect(f'/office/?section=leads&lead={record.client_id}')
            context.update(lead=lead,form=form,can_edit=user.has_perm(permission))
            if lead:context['lead_bootstrap']={'clientId':lead.client_id,'firstName':lead.first_name,'lastName':lead.last_name,'departureAirport':lead.departure_airport,'arrivalAirport':lead.arrival_airport,'departureDate':lead.departure_date.isoformat() if lead.departure_date else '', 'returnDate':lead.return_date.isoformat() if lead.return_date else '', 'passengers':lead.passengers or 1,'cabin':lead.cabin or 'Business','language':lead.language,'flightRoute':lead.flight_route,'airline':lead.airline}
        else:
            query=request.GET.get('q','').strip()[:100];state=request.GET.get('status','')
            leads=Lead.objects.select_related('assigned_to')
            if query:leads=leads.filter(Q(client_id__icontains=query)|Q(first_name__icontains=query)|Q(last_name__icontains=query)|Q(phone__icontains=query)|Q(email__icontains=query))
            if state in ['new','contacted','qualified','closed']:leads=leads.filter(lead_status=state)
            context.update(page=Paginator(leads,25).get_page(request.GET.get('page')),query=query,status=state,states=['new','contacted','qualified','closed'])
    elif section=='tickets':
        context['lead_bootstrap']={}
    elif section in ['offers','bookings','searches']:
        model,form_class={'offers':(HotFlight,HotFlightForm),'bookings':(Booking,BookingForm),'searches':(SavedSearch,SavedSearchForm)}[section]
        reference=request.GET.get('record')
        record=get_object_or_404(model,pk=reference) if reference and reference!='new' else None
        if reference:
            code='change' if record else 'add';permission=f'travel.{code}_{model._meta.model_name}'
            if not user.has_perm(permission):raise PermissionDenied
            if request.method=='POST' and request.POST.get('action')=='delete':
                if not record or not user.has_perm(f'travel.delete_{model._meta.model_name}'):raise PermissionDenied
                if request.POST.get('confirm_delete')!='DELETE':messages.error(request,'Type DELETE to confirm removal.');return redirect(request.get_full_path())
                reference=record.pk;record.delete();audit(user,f'{model._meta.model_name}.deleted',reference);messages.success(request,'Record removed.');return redirect(f'/office/?section={section}')
            form=form_class(request.POST or None,request.FILES or None,instance=record)
            if request.method=='POST' and form.is_valid():
                record=form.save();audit(user,f'{model._meta.model_name}.saved',record.pk);messages.success(request,'Record saved.');return redirect(f'/office/?section={section}')
            context.update(form=form,record=record)
        else:context['page']=Paginator(model.objects.order_by('-created_at'),25).get_page(request.GET.get('page'))
    elif section=='subscribers':
        context['page']=Paginator(NewsletterSubscriber.objects.order_by('-created_at'),50).get_page(request.GET.get('page'))
        if request.GET.get('export')=='csv':
            import csv
            response=HttpResponse(content_type='text/csv');response['Content-Disposition']='attachment; filename="subscribers.csv"'
            writer=csv.writer(response);writer.writerow(['Email','Language','Subscribed'])
            for row in NewsletterSubscriber.objects.iterator():writer.writerow([row.email if not row.email.startswith(('=','+','-','@')) else "'"+row.email,row.language,row.created_at.isoformat()])
            audit(user,'newsletter.exported');return response
    elif section=='telegram':
        query=request.GET.get('q','').strip()[:100]
        chats=TelegramChat.objects.select_related('lead')
        if query:chats=chats.filter(Q(display_name__icontains=query)|Q(username__icontains=query)|Q(chat_id__icontains=query)|Q(lead__client_id__icontains=query))
        context.update(page=Paginator(chats,25).get_page(request.GET.get('page')),query=query,telegram=config_status())
        if request.GET.get('chat'):
            chat=get_object_or_404(TelegramChat,pk=request.GET['chat'])
            records=chat.messages.order_by('-pk')
            if request.GET.get('before','').isdigit():records=records.filter(pk__lt=request.GET['before'])
            records=list(records[:51]);context.update(chat=chat,chat_messages=list(reversed(records[:50])),older_cursor=records[49].pk if len(records)>50 else None)
            TelegramChat.objects.filter(pk=chat.pk).update(last_read_at=timezone.now())
    elif section=='settings':context['telegram']=config_status()
    elif section=='team':
        form=StaffCreationForm(request.POST or None)
        if request.method=='POST':
            if request.POST.get('action')=='toggle-user':
                target=get_object_or_404(User,pk=request.POST.get('user_id'))
                if target.pk==user.pk or target.is_superuser:messages.error(request,'You cannot deactivate yourself or another superuser here.')
                else:target.is_active=not target.is_active;target.save(update_fields=['is_active']);audit(user,'staff.access.changed',target.pk)
                return redirect('/office/?section=team')
            if form.is_valid():record=form.save();audit(user,'staff.created',record.pk);messages.success(request,'Staff account created.');return redirect('/office/?section=team')
        context.update(form=form,team=User.objects.filter(is_staff=True).prefetch_related('groups'))
    elif section=='account':
        form=PasswordChangeForm(user,request.POST or None)
        if request.method=='POST' and form.is_valid():
            form.save();update_session_auth_hash(request,user);audit(user,'staff.password.changed',user.pk);messages.success(request,'Your password was updated.');return redirect('/office/?section=account')
        context['form']=form
    elif section=='audit':context['page']=Paginator(AuditEvent.objects.select_related('actor'),50).get_page(request.GET.get('page'))
    return render(request,'office/workspace.html',context)
