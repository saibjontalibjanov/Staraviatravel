from django.test import SimpleTestCase
from travel.services.flights import format_flights

class AirlineLogoTests(SimpleTestCase):
    def offer(self, **changes):
        return {'price':100, 'flights':[{'airline':'Uzbekistan Airways','flight_number':'HY333','departure_airport':{'id':'TAS'},'arrival_airport':{'id':'DXB'},**changes}]}
    def test_logo_is_resolved_from_iata_when_provider_omits_it(self):
        result=format_flights({'best_flights':[self.offer()]},{'departure_id':'TAS','arrival_id':'DXB','cabin':'Business'})[0]
        self.assertEqual(result['airlineCode'],'HY')
        self.assertTrue(result['airlineLogo'].endswith('/HY.png'))
    def test_provider_logo_is_kept_with_an_independent_fallback(self):
        result=format_flights({'best_flights':[self.offer(airline_logo='https://provider.test/logo.png')]},{'departure_id':'TAS','arrival_id':'DXB','cabin':'Business'})[0]
        self.assertEqual(result['airlineLogo'],'https://provider.test/logo.png')
        self.assertTrue(result['airlineLogoFallback'].endswith('/HY.png'))
    def test_unsafe_logos_are_not_forwarded(self):
        result=format_flights({'best_flights':[self.offer(airline_logo='javascript:alert(1)',flight_number='unknown')]},{'departure_id':'TAS','arrival_id':'DXB','cabin':'Business'})[0]
        self.assertIsNone(result['airlineLogo'])
