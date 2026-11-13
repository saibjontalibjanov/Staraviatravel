# Offer card and background images on Namecheap

## Fix delivered

The Business Class page previously ignored the CRM `background` field and used only the offer card image. It now uses the separate background, falling back to the card image when no background was supplied. A background-only offer can also use that photo for its card. Both current Django and imported legacy media shapes are normalized consistently against the frontend API origin.

CRM uploads were exposed as `/uploads/...`, which requires a working production Apache/media mapping. Django's DEBUG-only media route does not serve those files when `DEBUG=False`. The live API could not be reached from this execution environment, so the actual server's image-file presence and mapping were not verified.

Newly uploaded **published offer** photos now use:

```text
/api/hot-flights/<offer-id>/image?v=<record-version>
/api/hot-flights/<offer-id>/background?v=<record-version>
```

These are real FileResponse image streams through Django, working with `DEBUG=False` and without an `/uploads` mapping. They expose only the image/background fields of published HotFlight records, not arbitrary filesystem paths. Missing, unpublished and non-image files are rejected; POST is not allowed. Content type comes from image headers, `nosniff` is enabled, and versioned URLs bypass stale image caches after CRM edits. Legacy external URLs are preserved rather than fetched/proxied by the backend.

This does not restore files missing from the server or change uploaded media storage. Existing `/uploads/` mapping is still useful for other media such as partner logos and legacy direct links. Do not enable DEBUG, expose the application root or use permissive filesystem access as a workaround.

## Deploy this fix

1. Pull the current `main` source on your laptop.
2. Update the backend source while preserving its `.env`, database and `media/`. The changed runtime backend files are `travel/api.py` and `config/urls.py`; restart the existing cms Python application afterward. Pillow is already an existing dependency. No new migration or API key is needed for this fix.
3. Keep root `.env.production` set to `VITE_API_URL=https://cms.staraviatravel.com`, then run `npm run build`. Upload all newly built `dist/` contents to the public website document root, preserving the hosting rules and old assets during transition.
4. Hard-refresh the website. Open `https://cms.staraviatravel.com/api/hot-flights` and inspect the actual `image.url` / `background.url` returned for your offer. The new upload URLs should start with `/api/hot-flights/` rather than `/uploads/`.
5. Open the returned URL on the cms origin. It should display the photo with an `image/*` content type. Verify the card on Home and its separate hero image on Business Class.

If the file itself is absent, an endpoint cannot recreate it. Re-upload the card and background through CRM (or restore the original `media/` from the correct backup), preserving all database records and other existing media. Make sure the offer is published.

## Read-only check if a photo is still missing

In the activated backend virtualenv, from the actual app folder, run:

```bash
python manage.py shell
```

Then:

```python
from travel.models import HotFlight
from django.conf import settings
print(settings.MEDIA_ROOT)
for offer in HotFlight.objects.filter(published=True).order_by('-created_at')[:10]:
    print(offer.pk)
    for kind in ('image', 'background'):
        field = getattr(offer, kind)
        print(kind, field.name, field.storage.exists(field.name) if field else False)
```

This prints public offer filenames and existence, not secrets; it makes no changes. `False` on a newly uploaded image field means that field is empty or the underlying file is unavailable at the configured storage location. Existing imported external URL fields do not imply a local file. Do not print/share `.env` or database credentials.

## Validation

- 88 Django tests passed, including production-mode real photo streaming, separate card/background pixels, published-only access, invalid/missing files, rejected non-image content and preserved external legacy URLs.
- 40 frontend tests passed, including media-shape normalization and separate/fallback background selection.
- Vite production build passed.
- Chromium desktop/mobile: Home rendered an actual uploaded card PNG and Business Class fetched the different uploaded background through a real isolated Django server with `DEBUG=False` and no `/uploads` mapping.
- No production deployment, live database update or customer-data modification was performed. Tests used disposable local data.
