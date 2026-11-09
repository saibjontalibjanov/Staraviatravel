"""Bank boundary. No guessed endpoints, signatures, credentials or card handling.

Implement this adapter ONLY against the merchant's official Ipak Yo‘li specification.
Normalized dataclasses below are internal application contracts, not bank API fields.
"""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from django.conf import settings
from travel.services.validation import ServiceError

class ProviderUnavailable(ServiceError):
    def __init__(self):
        super().__init__('Bank payments are unavailable until the official merchant integration is verified.',503)

class ProviderUncertain(ServiceError):
    """A request may have reached the bank: reconcile, never blindly create again."""
    def __init__(self):
        super().__init__('Payment confirmation is pending. Do not pay again; contact your agent.',503)

@dataclass(frozen=True)
class HostedSession:
    reference: str
    url: str
    expires_at: datetime

@dataclass(frozen=True)
class VerifiedStatus:
    payment_id: UUID
    reference: str
    amount_minor: int
    currency: str
    status: str

@dataclass(frozen=True)
class VerifiedNotification:
    event_id: str
    payment_id: UUID

class IpakProvider:
    implemented = False
    supported_methods = ()
    supported_currencies = ()
    supports_refunds = False

    def available(self):
        # Credentials alone cannot enable an unimplemented banking protocol.
        return False

    def create_session(self, payment, return_urls):
        """Must use payment.id as the bank idempotency/order reference and server amount.

        Require documented bank idempotency, bounded network timeouts, HTTPS,
        verified TLS, no redirect following and sanitized errors. Never send raw cards.
        """
        raise ProviderUnavailable()

    def verify_status(self, payment):
        """Must resolve uncertain creates by immutable merchant order reference too."""
        raise ProviderUnavailable()

    def verify_webhook(self, raw_body, headers):
        """Verify documented signature, timestamp freshness, merchant and replay ID
        over the exact raw bytes BEFORE returning a normalized notification.
        """
        raise ProviderUnavailable()

    def refund(self, payment, amount_minor):
        raise ProviderUnavailable()

def get_provider():
    return IpakProvider()

def capabilities(currency=None):
    provider=get_provider()
    enabled=provider.available() and (currency is None or currency in provider.supported_currencies)
    return {'enabled':bool(enabled),'provider':'ipak','methods':list(provider.supported_methods) if enabled else [],
            'mode':settings.IPAK_PAYMENT_MODE,'reason':None if enabled else 'merchant_integration_required'}
