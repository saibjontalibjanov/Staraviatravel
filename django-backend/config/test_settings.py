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

IPAK_MERCHANT_ID = ''
IPAK_API_KEY = ''
IPAK_API_BASE_URL = ''
IPAK_WEBHOOK_SECRET = ''
IPAK_PAYMENT_MODE = 'sandbox'
IPAK_HOSTED_CHECKOUT_ORIGINS = ['https://bank-checkout.example.test']
