from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
class Command(BaseCommand):
    help='Create/update Agents and Managers permission groups. Does not create accounts.'
    def handle(self,*args,**kwargs):
        allowed=['view_testimonial','view_faq','view_lead','add_lead','change_lead','manage_passports','search_flights','view_farequote','manage_checkouts','view_checkout','view_telegramchat','view_telegrammessage','reply_telegram','view_hotflight','view_booking','add_booking','change_booking','view_savedsearch','add_savedsearch','change_savedsearch']
        agents,_=Group.objects.get_or_create(name='Agents');agents.permissions.set(Permission.objects.filter(content_type__app_label='travel',codename__in=allowed))
        managers,_=Group.objects.get_or_create(name='Managers');managers.permissions.set(Permission.objects.filter(content_type__app_label='travel'))
        self.stdout.write('Agents and Managers roles are ready. No default users or passwords were created.')
