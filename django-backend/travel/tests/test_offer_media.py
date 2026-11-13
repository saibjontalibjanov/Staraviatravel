import io,tempfile
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase,override_settings
from travel.models import HotFlight

class OfferMediaTests(TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory();self.addCleanup(self.directory.cleanup)
        settings=override_settings(MEDIA_ROOT=self.directory.name,DEBUG=False)
        settings.enable();self.addCleanup(settings.disable)
    def image(self,name,color):
        data=io.BytesIO();Image.new('RGB',(32,20),color).save(data,'PNG')
        return SimpleUploadedFile(name,data.getvalue(),content_type='image/png')
    def test_published_uploads_stream_card_and_background_without_uploads_mapping(self):
        offer=HotFlight.objects.create(title='Fixture',published=True,image=self.image('card.png','red'),background=self.image('background.png','blue'))
        data=self.client.get('/api/hot-flights').json()['data'][0]
        for kind in ('image','background'):
            url=data[kind]['url'];self.assertTrue(url.startswith(f'/api/hot-flights/{offer.pk}/{kind}?v='))
            response=self.client.get(url)
            self.assertEqual(response.status_code,200);self.assertEqual(response['Content-Type'],'image/png');self.assertEqual(response['X-Content-Type-Options'],'nosniff')
            contents=b''.join(response.streaming_content);response.close()
            self.assertEqual(Image.open(io.BytesIO(contents)).getpixel((0,0)),(255,0,0) if kind=='image' else (0,0,255))
        self.assertEqual(self.client.head(data['image']['url']).status_code,200)
    def test_unpublished_missing_and_arbitrary_files_are_not_public(self):
        hidden=HotFlight.objects.create(title='Hidden',image=self.image('private.png','red'))
        self.assertEqual(self.client.get(f'/api/hot-flights/{hidden.pk}/image').status_code,404)
        offer=HotFlight.objects.create(title='Missing',published=True,image='offers/missing.png')
        for suffix in ['image','background','pricing','../../.env']:
            self.assertEqual(self.client.get(f'/api/hot-flights/{offer.pk}/{suffix}').status_code,404)
        self.assertEqual(self.client.post(f'/api/hot-flights/{offer.pk}/image').status_code,405)
    def test_non_image_file_is_rejected_and_legacy_urls_are_preserved(self):
        offer=HotFlight.objects.create(title='Unsafe',published=True)
        offer.image.save('document.html',SimpleUploadedFile('document.html',b'<script>alert(1)</script>'))
        self.assertEqual(self.client.get(f'/api/hot-flights/{offer.pk}/image').status_code,404)
        offer.image='';offer.legacy_image='https://example.test/legacy.jpg';offer.save()
        self.assertEqual(self.client.get(f'/api/hot-flights/{offer.pk}').json()['data']['image']['url'],offer.legacy_image)
