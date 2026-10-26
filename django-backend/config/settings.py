import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env', override=False)
def flag(name, default=False):
    return os.getenv(name, str(default)).lower() in ('true', '1', 'yes')
def items(name, default=''):
    return [value.strip() for value in os.getenv(name, default).split(',') if value.strip()]
DEBUG = flag('DJANGO_DEBUG')
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    raise ImproperlyConfigured('Set DJANGO_SECRET_KEY in django-backend/.env. See README.md.')
ALLOWED_HOSTS = items('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')
INSTALLED_APPS = ['django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', 'corsheaders', 'travel']
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware', 'whitenoise.middleware.WhiteNoiseMiddleware', 'corsheaders.middleware.CorsMiddleware', 'django.contrib.sessions.middleware.SessionMiddleware', 'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware', 'django.contrib.auth.middleware.AuthenticationMiddleware', 'django.contrib.messages.middleware.MessageMiddleware', 'django.middleware.clickjacking.XFrameOptionsMiddleware', 'travel.middleware.PrivateResponsesMiddleware', 'travel.middleware.TrustedProxyClientIPMiddleware']
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True, 'OPTIONS': {'context_processors': ['django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
(BASE_DIR / 'data').mkdir(exist_ok=True)
DATABASES = {'default': dj_database_url.parse((os.getenv('DATABASE_URL') or f'sqlite:///{BASE_DIR / "data/db.sqlite3"}'), conn_max_age=60, conn_health_checks=True)}
if DATABASES['default']['ENGINE'].endswith('sqlite3'):
    DATABASES['default']['OPTIONS'] = {'timeout': 20}
AUTH_PASSWORD_VALIDATORS = [{'NAME': f'django.contrib.auth.password_validation.{name}'} for name in ['UserAttributeSimilarityValidator', 'MinimumLengthValidator', 'CommonPasswordValidator', 'NumericPasswordValidator']]
LANGUAGE_CODE = 'en'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/uploads/'
MEDIA_ROOT = BASE_DIR / 'media'
WHITENOISE_ROOT = BASE_DIR.parent / 'dist'
WHITENOISE_USE_FINDERS = DEBUG
STORAGES = {'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'}, 'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'}}
CORS_ALLOWED_ORIGINS = items('CLIENT_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
CORS_URLS_REGEX = r'^/api/.*$'
CORS_ALLOW_CREDENTIALS = False
CSRF_TRUSTED_ORIGINS = items('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_AGE = 8 * 60 * 60
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
SECURE_SSL_REDIRECT = flag('DJANGO_HTTPS_ONLY', not DEBUG)
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
X_FRAME_OPTIONS = 'DENY'
# Enable only behind a trusted reverse proxy that overwrites this header.
if flag('TRUST_PROXY_HTTPS'):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 8 * 1024 * 1024
PUBLIC_WEBSITE_URL = os.getenv('PUBLIC_WEBSITE_URL', '')
PUBLIC_BACKEND_URL = os.getenv('PUBLIC_BACKEND_URL', '')
SERPAPI_KEY = os.getenv('SERPAPI_KEY', '')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_LEADS_CHAT_ID = os.getenv('TELEGRAM_LEADS_CHAT_ID', '')
TELEGRAM_WEBHOOK_SECRET = os.getenv('TELEGRAM_WEBHOOK_SECRET', '')
LOGIN_URL = '/office/login/'
LOGIN_REDIRECT_URL = '/office/'
LOGOUT_REDIRECT_URL = '/office/login/'

TRUST_PROXY_CLIENT_IP = flag('TRUST_PROXY_CLIENT_IP')

SECURE_REDIRECT_EXEMPT = [r'^_health$']
