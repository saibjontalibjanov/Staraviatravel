"""Read-only schema, migration and integrity diagnostics; never applies migrations."""
import json
import os
from pathlib import Path
from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import connections
from django.db.migrations.executor import MigrationExecutor

class Command(BaseCommand):
    help='Read-only database audit. Prints no credentials or customer records. Does not repair or migrate.'
    requires_system_checks=[]
    def add_arguments(self,parser):
        parser.add_argument('--database',default='default')
        parser.add_argument('--json',action='store_true',dest='json_output')
    def handle(self,*args,**options):
        alias=options['database'];connection=connections[alias]
        report={'alias':alias,'engine':connection.settings_dict['ENGINE'],'readOnlyAudit':True,'issues':[],'pendingMigrations':[],'missingTables':[],'missingColumns':{},'counts':{}}
        try:
            if connection.vendor=='sqlite':
                name=str(connection.settings_dict['NAME'])
                memory=name==':memory:' or (name.startswith('file:') and 'mode=memory' in name)
                if not memory:
                    path=Path(name)
                    # sqlite3.connect would create an empty DB. Refuse that side effect.
                    if not path.is_file():raise CommandError('SQLite database does not exist. Audit refused to create it.')
                    report['sqlitePath']=str(path.resolve())
                    report['sqliteFileWritable']=os.access(path,os.W_OK)
                    report['sqliteDirectoryWritable']=os.access(path.parent,os.W_OK)
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1');report['connectionHealthy']=cursor.fetchone()[0]==1
                tables=set(connection.introspection.table_names(cursor))
                for model in apps.get_models(include_auto_created=True):
                    if not model._meta.managed or model._meta.proxy:continue
                    table=model._meta.db_table
                    if table not in tables:report['missingTables'].append(table);continue
                    actual={column.name for column in connection.introspection.get_table_description(cursor,table)}
                    missing={field.column for field in model._meta.local_concrete_fields}-actual
                    if missing:report['missingColumns'][table]=sorted(missing)
                for table in ['auth_user','auth_group','django_session','travel_lead','travel_checkout','travel_booking','travel_savedsearch','travel_auditevent']:
                    if table in tables:
                        cursor.execute(f'SELECT COUNT(*) FROM {connection.ops.quote_name(table)}')
                        report['counts'][table]=cursor.fetchone()[0]
                if connection.vendor=='sqlite':
                    cursor.execute('PRAGMA quick_check');report['sqliteIntegrityHealthy']=all(row[0]=='ok' for row in cursor.fetchall())
                    cursor.execute('PRAGMA foreign_key_check');report['foreignKeyViolations']=sum(1 for _ in cursor)
            executor=MigrationExecutor(connection)
            executor.loader.check_consistent_history(connection)
            report['pendingMigrations']=[f'{migration.app_label}.{migration.name}' for migration,_ in executor.migration_plan(executor.loader.graph.leaf_nodes())]
            if report['missingTables']:report['issues'].append('Missing model tables')
            if report['missingColumns']:report['issues'].append('Missing model columns')
            if report['pendingMigrations']:report['issues'].append('Pending migrations; review and back up before applying')
            if report.get('sqliteIntegrityHealthy') is False:report['issues'].append('SQLite integrity check failed')
            if report.get('foreignKeyViolations'):report['issues'].append('Foreign key violations')
            if report.get('sqliteFileWritable') is False or report.get('sqliteDirectoryWritable') is False:report['issues'].append('SQLite write permissions require review')
        except Exception as error:
            report['issues'].append(f'Diagnostic failed: {type(error).__name__}. Review the server traceback privately.')
        report['healthy']=not report['issues']
        if options['json_output']:self.stdout.write(json.dumps(report,indent=2))
        else:
            self.stdout.write('Read-only database audit (no schema/data changes):')
            for key,value in report.items():self.stdout.write(f'{key}: {value}')
        if not report['healthy']:raise CommandError('Database audit found issues. No changes were made.')
