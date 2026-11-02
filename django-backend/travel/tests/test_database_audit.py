import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import TestCase, SimpleTestCase

class DatabaseAuditTests(TestCase):
    def test_audit_is_read_only_and_has_no_credentials(self):
        out=io.StringIO()
        with connection.cursor() as cursor:
            cursor.execute('SELECT COUNT(*) FROM django_migrations');before=cursor.fetchone()[0]
        call_command('audit_database',json_output=True,stdout=out)
        report=json.loads(out.getvalue());self.assertTrue(report['healthy']);self.assertTrue(report['readOnlyAudit'])
        self.assertEqual(report['pendingMigrations'],[])
        self.assertNotIn('PASSWORD',out.getvalue());self.assertNotIn('SECRET_KEY',out.getvalue())
        with connection.cursor() as cursor:
            cursor.execute('SELECT COUNT(*) FROM django_migrations');self.assertEqual(before,cursor.fetchone()[0])
    def test_missing_column_is_reported_without_repair(self):
        describe=connection.introspection.get_table_description
        def missing(cursor,table):
            return [row for row in describe(cursor,table) if not(table=='travel_lead' and row.name=='notes')]
        out=io.StringIO()
        with patch.object(connection.introspection,'get_table_description',side_effect=missing):
            with self.assertRaises(CommandError):call_command('audit_database',json_output=True,stdout=out)
        self.assertEqual(json.loads(out.getvalue())['missingColumns']['travel_lead'],['notes'])

class MissingSQLiteAuditTests(SimpleTestCase):
    def test_missing_file_is_never_created(self):
        with TemporaryDirectory() as directory:
            path=Path(directory)/'missing.sqlite3';out=io.StringIO()
            with patch.dict(connection.settings_dict,NAME=str(path)):
                with self.assertRaises(CommandError):call_command('audit_database',json_output=True,stdout=out)
            self.assertFalse(path.exists())
