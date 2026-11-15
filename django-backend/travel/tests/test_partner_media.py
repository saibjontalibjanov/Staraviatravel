import io
import tempfile
from PIL import Image
from django.contrib.auth.models import User, Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from travel.models import Partner


class PartnerMediaTests(TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        settings = override_settings(MEDIA_ROOT=directory.name, DEBUG=False)
        settings.enable()
        self.addCleanup(settings.disable)

    def upload(self, name='partner.png', color='red'):
        image = io.BytesIO()
        Image.new('RGB', (24, 16), color).save(image, 'PNG')
        return SimpleUploadedFile(name, image.getvalue(), content_type='image/png')

    def test_production_logo_works_without_apache_uploads_mapping(self):
        row = Partner.objects.create(name='Published', logo=self.upload(), published=True)
        self.assertTrue(row.logo.storage.exists(row.logo.name))
        # This is the old API URL: a real upload exists, yet production returns 404.
        self.assertEqual(self.client.get(row.logo.url).status_code, 404)
        data = self.client.get('/api/partners').json()['data']
        self.assertEqual(len(data), 1)
        url = data[0]['logo']
        self.assertTrue(url.startswith(f'/api/partners/{row.pk}/logo?v='))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'image/png')
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertIn('no-store', response['Cache-Control'])
        contents = b''.join(response.streaming_content)
        response.close()
        self.assertEqual(Image.open(io.BytesIO(contents)).getpixel((0, 0)), (255, 0, 0))
        response = self.client.head(url)
        self.assertEqual(response.status_code, 200)
        response.close()
        row.published = False
        row.save()
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.get('/api/partners').json()['data'], [])

    def test_drafts_missing_files_and_arbitrary_paths_are_not_public(self):
        hidden = Partner.objects.create(name='Draft', logo=self.upload(), published=False)
        missing = Partner.objects.create(name='Missing', logo='partners/not-found.png')
        empty = Partner.objects.create(name='Empty', logo='')
        for row in [hidden, missing, empty]:
            self.assertEqual(self.client.get(f'/api/partners/{row.pk}/logo').status_code, 404)
        self.assertEqual(self.client.get('/api/partners/99999/logo').status_code, 404)
        self.assertEqual(self.client.get('/api/partners/1/../../.env').status_code, 404)
        self.assertEqual(self.client.post(f'/api/partners/{hidden.pk}/logo').status_code, 405)
        self.assertTrue(hidden.logo.storage.exists(hidden.logo.name))

    def test_private_preview_requires_active_staff_and_view_permission(self):
        row = Partner.objects.create(name='Draft', logo=self.upload(), published=False)
        url = f'/office/partners/{row.pk}/logo'
        self.assertEqual(self.client.get(url).status_code, 401)
        user = User.objects.create_user('customer')
        self.client.force_login(user)
        self.assertEqual(self.client.get(url).status_code, 401)
        user.is_staff = True
        user.save()
        self.assertEqual(self.client.get(url).status_code, 403)
        user.user_permissions.add(Permission.objects.get(codename='view_partner'))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Cache-Control'], 'no-store, private')
        response.close()
        self.assertEqual(self.client.post(url).status_code, 405)
        self.assertEqual(self.client.get(f'/api/partners/{row.pk}/logo').status_code, 404)

    @override_settings(DEBUG=True)
    def test_debug_uploads_route_does_not_bypass_publication(self):
        row = Partner.objects.create(name='Draft', logo=self.upload(), published=False)
        self.assertEqual(self.client.get(row.logo.url).status_code, 404)

    def test_replacement_changes_api_url_and_rejects_non_images(self):
        row = Partner.objects.create(name='Logo', logo=self.upload())
        previous_name = row.logo.name
        old_url = self.client.get('/api/partners').json()['data'][0]['logo']
        row.logo = self.upload('updated.png', 'blue')
        row.save()
        new_url = self.client.get('/api/partners').json()['data'][0]['logo']
        self.assertNotEqual(old_url, new_url)
        # Existing uploads are never deleted by this endpoint or a replacement.
        self.assertTrue(row.logo.storage.exists(previous_name))
        row.logo.save('unsafe.html', SimpleUploadedFile('unsafe.html', b'<script>alert(1)</script>'))
        self.assertEqual(self.client.get(new_url).status_code, 404)

    def test_upload_validation_rejects_gif_and_preserves_existing_logo(self):
        from travel.forms import PartnerForm
        image = io.BytesIO()
        Image.new('RGB', (20, 20)).save(image, 'GIF')
        form = PartnerForm({'name':'GIF', 'position':0}, {'logo':SimpleUploadedFile('logo.gif', image.getvalue(), content_type='image/gif')})
        self.assertFalse(form.is_valid())
        self.assertIn('logo', form.errors)
        row = Partner.objects.create(name='Keep', logo=self.upload())
        form = PartnerForm({'name':'Updated', 'position':1, 'published':'on'}, instance=row)
        self.assertTrue(form.is_valid(), form.errors)
        form.save()
        row.refresh_from_db()
        self.assertTrue(row.logo.storage.exists(row.logo.name))

    def test_editing_metadata_does_not_require_reading_an_existing_missing_upload(self):
        from travel.forms import PartnerForm
        row = Partner.objects.create(name='Missing', logo='partners/not-on-this-machine.png')
        form = PartnerForm({'name':'Preserved record', 'position':0, 'published':'on'}, instance=row)
        self.assertTrue(form.is_valid(), form.errors)
        form.save()
        row.refresh_from_db()
        self.assertEqual(row.logo.name, 'partners/not-on-this-machine.png')
