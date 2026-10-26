"""Create one private .env without ever printing credentials or replacing an existing file."""
import argparse
import os
import secrets
from pathlib import Path
from dotenv import dotenv_values
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--from-strapi',type=Path,help='Optional old .env; imports provider settings only, never Strapi JWT/signing keys.')
args=parser.parse_args()
target=root/'.env'
if target.exists():
    raise SystemExit('.env already exists. It was not changed. Edit it locally if needed.')
values={key:value or '' for key,value in dotenv_values(root/'.env.example').items()}
values['DJANGO_SECRET_KEY']=secrets.token_urlsafe(64)
if args.from_strapi:
    old=dotenv_values(args.from_strapi)
    for key in ['SERPAPI_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_LEADS_CHAT_ID','TELEGRAM_WEBHOOK_SECRET','PUBLIC_WEBSITE_URL','CLIENT_ORIGINS','CLICK_SERVICE_ID','CLICK_MERCHANT_ID','CLICK_SECRET_KEY']:
        if old.get(key):values[key]=old[key]
    if old.get('PUBLIC_STRAPI_URL'):values['PUBLIC_BACKEND_URL']=old['PUBLIC_STRAPI_URL']
# Empty DATABASE_URL should select the SQLite default, not an empty database engine.
values.pop('DATABASE_URL',None)
with target.open('x',encoding='utf-8') as handle:
    for key,value in values.items():
        escaped=str(value).replace('\\','\\\\').replace("'","\\'").replace('\n','\\n')
        handle.write(f"{key}='{escaped}'\n")
try:os.chmod(target,0o600)
except OSError:pass
print('Created django-backend/.env with a generated Django secret. Provider values, if supplied, were copied privately. No credentials were printed.')
