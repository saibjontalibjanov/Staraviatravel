from .settings import *
DEBUG = False
ALLOWED_HOSTS = ['testserver','localhost','127.0.0.1']
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
STORAGES = {'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'}, 'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}}
PUBLIC_WEBSITE_URL = 'https://website.test'
PUBLIC_BACKEND_URL = 'https://backend.test'
SERPAPI_KEY = ''
TELEGRAM_BOT_TOKEN = ''
TELEGRAM_LEADS_CHAT_ID = ''
TELEGRAM_WEBHOOK_SECRET = ''

# Legacy alias coverage remains explicit; CRMRootTests exercise the production default.
CRM_ROOT_ENABLED = False
LOGIN_URL = '/office/login/'
LOGIN_REDIRECT_URL = '/office/'
LOGOUT_REDIRECT_URL = '/office/login/'
PHONE_BRIDGE_TOKEN = ''
PHONE_BRIDGE_LINE = '+998910235737'
