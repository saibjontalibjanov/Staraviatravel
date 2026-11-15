"""Build isolated, labelled UI fixtures. Never connects to a production database."""
import io
import json
import os
from pathlib import Path
import secrets
import sys

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.browser_test_settings'
(root / '.test-data').mkdir(exist_ok=True)
import django
django.setup()
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from travel.models import Lead, Partner, HotFlight, TelegramChat, TelegramMessage, Testimonial

assert Path(settings.DATABASES['default']['NAME']) == root / '.test-data/browser.sqlite3'
call_command('migrate', verbosity=0)
call_command('bootstrap_roles', verbosity=0)
password = secrets.token_urlsafe(28)
user, _ = User.objects.get_or_create(username='browser-fixture', defaults={'is_staff':True,'is_superuser':True,'first_name':'Browser Fixture'})
user.set_password(password)
user.save()
agent, _ = User.objects.get_or_create(username='browser-agent-fixture', defaults={'is_staff':True})
agent.set_password(password)
agent.save()
agent.groups.add(Group.objects.get(name='Agents'))
lead, _ = Lead.objects.get_or_create(client_id='987654', defaults={'first_name':'Browser','last_name':'Fixture','phone':'+998901234567','source':'agent','language':'en'})

def upload(name, color):
    content = io.BytesIO()
    Image.new('RGB', (160, 72), color).save(content, 'PNG')
    return SimpleUploadedFile(name, content.getvalue(), content_type='image/png')

for index, color in enumerate(['red','blue','green','purple']):
    row, _ = Partner.objects.get_or_create(name=f'Browser partner fixture {index}', defaults={'position':index,'published':index<3})
    if not row.logo:
        row.logo = upload(f'fixture-{index}.png', color)
        row.save()
offer, _ = HotFlight.objects.get_or_create(title='Browser offer fixture', defaults={'published':True,'price':'Price pending confirmation','type':'Fixture only'})
if not offer.image:
    offer.image = upload('offer-fixture.png', 'blue')
    offer.save()
Testimonial.objects.get_or_create(name='Browser review fixture', defaults={'text':'Isolated browser fixture review.','language':'en','rating':4,'published':False})
chat, _ = TelegramChat.objects.get_or_create(chat_id='-987654321000', defaults={'display_name':'Browser inbox fixture','lead':lead})
if not chat.messages.exists():
    TelegramMessage.objects.create(chat=chat, direction='incoming', text='Local fixture, never sent to Telegram.', delivery_status='received')
path = root / '.test-data/browser-fixture.json'
path.write_text(json.dumps({'username':user.username,'password':password,'agent':agent.username,'leadId':lead.client_id}))
path.chmod(0o600)
print('Isolated browser fixtures ready; credentials stored privately in .test-data/browser-fixture.json.')
