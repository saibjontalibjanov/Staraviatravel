# Archived Strapi implementation

This directory is retained as a read-only migration/reference archive. It is not the active backend, is not built or started by the website, and is not part of the Django runtime.

Use `django-backend/` and `/office/` for every current backend and CRM function. Existing Strapi databases and uploads can be copied into Django with `manage.py import_strapi`; see `docs/MIGRATION.md`.

Do not run the legacy Telegram worker or Strapi server alongside the Django deployment against the same bot. Old Strapi admin passwords are not Django passwords. API keys belong only in `django-backend/.env` for the active application.
