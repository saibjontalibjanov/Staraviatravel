"""Scan tracked/staged source and reachable Git history without printing secret values."""
import argparse
import re
import subprocess
import sys
from pathlib import Path

PATTERNS = [
    ('private key', re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----')),
    ('GitHub token', re.compile(rb'\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b')),
    ('AWS access key', re.compile(rb'\bAKIA[0-9A-Z]{16}\b')),
    ('Telegram token', re.compile(rb'\b[0-9]{6,12}:[A-Za-z0-9_-]{30,}\b')),
    ('payment/provider token', re.compile(rb'\b(?:sk_live_|duffel_live_)[A-Za-z0-9_-]{20,}\b')),
]
ASSIGNMENT = re.compile(rb'''(?im)^[ \t]*["']?(?:DJANGO_SECRET_KEY|SERPAPI_KEY|TELEGRAM_BOT_TOKEN|DUFFEL_API_TOKEN|CLICK_SECRET_KEY|JWT_SECRET|ADMIN_JWT_SECRET|APP_KEYS|API_TOKEN_SALT|TRANSFER_TOKEN_SALT|POSTGRES_PASSWORD|API_KEY|API_TOKEN)["']?[ \t]*[:=][ \t]*["']?([A-Za-z0-9_:+/!@#$%^&*().=-]{16,})''')

def git(*args, input=None):
    return subprocess.check_output(['git', *args], input=input)

def findings(data, path):
    if b'\0' in data or len(data)>2_000_000:return []
    found=[]
    for kind,pattern in PATTERNS:
        for match in pattern.finditer(data):found.append((kind,data[:match.start()].count(b'\n')+1))
    for match in ASSIGNMENT.finditer(data):
        value=match.group(1).lower()
        if any(term in value for term in [b'example',b'password',b'replace_',b'placeholder',b'fixture',b'local-',b'test-',b'test_',b'your',b'tobemodified',b'os.getenv',b'process.env',b'secrets.']):continue
        if len(set(value))<6:continue
        if '/tests/' in path or path.startswith('tests/'):continue
        found.append(('literal credential assignment',data[:match.start()].count(b'\n')+1))
    return found

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--history',action='store_true');parser.add_argument('--staged',action='store_true');args=parser.parse_args()
    objects={}
    if args.history:
        for line in git('rev-list','--objects','--all').decode().splitlines():
            parts=line.split(' ',1)
            if len(parts)==2:objects.setdefault(parts[0],parts[1])
    else:
        for line in git('ls-files','--stage').decode().splitlines():
            meta,path=line.split('\t',1);objects.setdefault(meta.split()[1],path)
    # Query sizes first so large media never enters the scanner process.
    meta=git('cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)',input=('\n'.join(objects)+'\n').encode()).decode().splitlines()
    hits=[];checked=0
    for line in meta:
        oid,kind,size=line.split()
        if kind!='blob' or int(size)>2_000_000:continue
        path=objects[oid]
        if Path(path).suffix.lower() in ['.png','.jpg','.jpeg','.gif','.webp','.mp4','.zip','.ico','.woff','.woff2']:continue
        data=git('cat-file','blob',oid);checked+=1
        for issue,number in findings(data,path):hits.append(f'{path}:{number} [{issue}; blob {oid[:12]}]')
    for hit in hits:print(hit)
    print(f'Scanned {checked} source blobs; {len(hits)} potential secret findings. Values are never printed.')
    return bool(hits)
if __name__=='__main__':sys.exit(main())
