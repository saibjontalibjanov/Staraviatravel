import secrets
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

def client_reference():
    return str(secrets.randbelow(900000) + 100000)

class Stamped(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    legacy_key = models.CharField(max_length=150, unique=True, null=True, blank=True, editable=False)
    class Meta:
        abstract = True

class Lead(Stamped):
    client_id = models.CharField(max_length=6, unique=True, default=client_reference, editable=False)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    source = models.CharField(max_length=20, choices=[(x, x.title()) for x in ['callback', 'quote', 'booking', 'agent']])
    language = models.CharField(max_length=2, default='uz', choices=[('uz', 'Uzbek'), ('ru', 'Russian'), ('en', 'English')])
    page_path = models.CharField(max_length=500, blank=True)
    flight_route = models.CharField(max_length=200, blank=True)
    airline = models.CharField(max_length=100, blank=True)
    quoted_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payment_method = models.CharField(max_length=30, blank=True)
    terms_accepted = models.BooleanField(default=False)
    lead_status = models.CharField(max_length=20, default='new', choices=[(x, x.title()) for x in ['new', 'contacted', 'qualified', 'closed']])
    notes = models.TextField(blank=True, max_length=10000)
    departure_airport = models.CharField(max_length=3, blank=True)
    arrival_airport = models.CharField(max_length=3, blank=True)
    departure_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    passengers = models.PositiveSmallIntegerField(null=True, blank=True)
    cabin = models.CharField(max_length=30, blank=True)
    passport_details = models.JSONField(default=list, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    class Meta:
        ordering = ['-created_at']
        permissions = [('manage_passports', 'View and edit passport details')]
    def __str__(self):
        return f'{self.client_id} · {self.first_name} {self.last_name}'.strip()

class FareQuote(Stamped):
    reference = models.UUIDField(default=uuid.uuid4, unique=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='quotes')
    offer = models.JSONField()
    search = models.JSONField()
    expires_at = models.DateTimeField()
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    class Meta:
        permissions = [('search_flights', 'Search live ticket fares')]

class Checkout(Stamped):
    lead = models.ForeignKey(Lead, null=True, on_delete=models.SET_NULL, related_name='checkouts')
    token = models.CharField(max_length=43, unique=True, editable=False)
    token_hash = models.CharField(max_length=64, unique=True, editable=False)
    request_id = models.UUIDField(default=uuid.uuid4, unique=True)
    snapshot = models.JSONField()
    pricing = models.JSONField(default=dict)
    billing_contact = models.JSONField(default=dict, blank=True)
    amount_minor = models.PositiveBigIntegerField()
    currency = models.CharField(max_length=3)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    class Meta:
        permissions = [('manage_checkouts', 'Create and revoke private checkout links')]
    @property
    def state(self):
        return 'revoked' if self.revoked_at else 'expired' if self.expires_at <= timezone.now() else 'active'
    @property
    def total(self):
        from decimal import Decimal
        return Decimal(self.amount_minor) / 100

class HotFlight(Stamped):
    title = models.TextField(max_length=1000)
    type = models.TextField(max_length=500, blank=True)
    badge = models.TextField(max_length=500, blank=True)
    price = models.CharField(max_length=255, blank=True)
    old_price = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='offers/', blank=True)
    background = models.ImageField(upload_to='offers/', blank=True)
    legacy_image = models.TextField(blank=True)
    legacy_background = models.TextField(blank=True)
    link = models.CharField(max_length=500, blank=True)
    badge_color = models.CharField(max_length=255, blank=True)
    published = models.BooleanField(default=False)
    def __str__(self):
        return self.title

class NewsletterSubscriber(Stamped):
    email = models.EmailField(unique=True)
    language = models.CharField(max_length=2, default='uz')
    def __str__(self):
        return self.email

class TelegramChat(Stamped):
    chat_id = models.CharField(max_length=21, unique=True)
    display_name = models.CharField(max_length=200)
    username = models.CharField(max_length=100, blank=True)
    chat_type = models.CharField(max_length=20, default='private')
    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.SET_NULL)
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_inbound_at = models.DateTimeField(null=True, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    preview = models.CharField(max_length=200, blank=True)
    class Meta:
        ordering = ['-last_message_at', '-id']
        permissions = [('reply_telegram', 'Reply and link Telegram conversations'), ('configure_telegram', 'Configure Telegram webhook')]
    @property
    def unread(self):
        return self.last_inbound_at and (not self.last_read_at or self.last_read_at < self.last_inbound_at)

class TelegramMessage(Stamped):
    event_key = models.CharField(max_length=180, unique=True)
    chat = models.ForeignKey(TelegramChat, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField(max_length=4096)
    direction = models.CharField(max_length=10)
    sender_name = models.CharField(max_length=200, blank=True)
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    telegram_message_id = models.CharField(max_length=30, blank=True)
    delivery_status = models.CharField(max_length=15, default='pending')
    attempts = models.PositiveIntegerField(default=0)
    next_attempt_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=500, blank=True)
    client_id = models.CharField(max_length=6, blank=True)

class Booking(Stamped):
    passenger_name = models.TextField(max_length=1000)
    passport_number = models.CharField(max_length=255, blank=True)
    flight_id = models.CharField(max_length=255, blank=True)
    paid_price = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    published = models.BooleanField(default=False)

class SavedSearch(Stamped):
    from_location = models.CharField(max_length=255, blank=True)
    to_location = models.CharField(max_length=255, blank=True)
    departure_date = models.DateField(null=True, blank=True)
    published = models.BooleanField(default=False)

class RateBucket(models.Model):
    key = models.CharField(max_length=64, unique=True)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()

class AuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
