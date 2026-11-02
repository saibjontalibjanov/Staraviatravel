"""Create and verify a NEW SQLite backup. Never overwrite a database or backup."""
import argparse
import os
import sqlite3
from pathlib import Path

def backup(source, destination):
    source=Path(source).resolve();destination=Path(destination).resolve()
    if not source.is_file():raise ValueError('Source SQLite file does not exist.')
    if source==destination:raise ValueError('Source and destination must differ.')
    destination.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    # Exclusive creation prevents replacing an existing backup or production DB.
    descriptor=os.open(destination,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(descriptor)
    with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src, sqlite3.connect(destination) as dst:
        src.execute('BEGIN')
        tables=[row[0] for row in src.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        def counts(connection):
            return {table:connection.execute('SELECT COUNT(*) FROM "'+table.replace('"','""')+'"').fetchone()[0] for table in tables}
        expected=counts(src);src.backup(dst)
        if [row[0] for row in dst.execute('PRAGMA integrity_check')]!=['ok']:raise ValueError('Backup integrity check failed. Keep the file for investigation; do not migrate.')
        if counts(dst)!=expected:raise ValueError('Backup row counts differ. Do not migrate.')
        src.rollback()
    print('New SQLite backup verified: integrity and per-table row counts match. No customer data printed.')

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source');parser.add_argument('destination');args=parser.parse_args();backup(args.source,args.destination)
if __name__=='__main__':main()
