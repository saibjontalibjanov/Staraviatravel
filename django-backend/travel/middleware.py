from django.conf import settings

class PrivateResponsesMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        response = self.get_response(request)
        if (request.path=='/' and settings.CRM_ROOT_ENABLED) or request.path.startswith(('/office', '/login/', '/logout/', '/api/checkouts/', '/api/phone-bridge/', '/api/bookings', '/api/search-results')):
            response['Cache-Control'] = 'no-store, private'
            response['X-Robots-Tag'] = 'noindex, nofollow'
            response['Referrer-Policy'] = 'same-origin' if request.path.startswith('/office') or (request.path=='/' and settings.CRM_ROOT_ENABLED) else 'no-referrer'
        return response

class TrustedProxyClientIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        from django.conf import settings
        import ipaddress
        if settings.TRUST_PROXY_CLIENT_IP:
            try:
                request.META['REMOTE_ADDR'] = str(ipaddress.ip_address(request.META.get('HTTP_X_REAL_IP', '')))
            except ValueError:
                pass
        return self.get_response(request)
