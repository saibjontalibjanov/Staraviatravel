"""Explicit local browser fixtures; never use this settings module in production."""
from .settings import *
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']
DATABASES = {'default': {'ENGINE':'django.db.backends.sqlite3', 'NAME':BASE_DIR / '.test-data/browser.sqlite3'}}
MEDIA_ROOT = BASE_DIR / '.test-data/media'
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
PUBLIC_WEBSITE_URL = 'http://127.0.0.1:3000'
PUBLIC_BACKEND_URL = 'http://127.0.0.1:8000'
CORS_ALLOWED_ORIGINS = ['http://127.0.0.1:3000']
CSRF_TRUSTED_ORIGINS = ['http://127.0.0.1:8000']
SERPAPI_KEY = ''
TELEGRAM_BOT_TOKEN = ''
TELEGRAM_LEADS_CHAT_ID = ''
TELEGRAM_WEBHOOK_SECRET = ''
PHONE_BRIDGE_TOKEN = ''
STORAGES = {'default':{'BACKEND':'django.core.files.storage.FileSystemStorage'}, 'staticfiles':{'BACKEND':'django.contrib.staticfiles.storage.StaticFilesStorage'}}
