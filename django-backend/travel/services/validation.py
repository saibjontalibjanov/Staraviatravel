import re
import math
import uuid
import unicodedata
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from django.utils import timezone

class ServiceError(Exception):
    def __init__(self, message, status=400):
        self.message, self.status = message, status
        super().__init__(message)

def text(value, maximum, label, required=False):
    if value is None and not required:
        return ''
    if not isinstance(value, str) or len(value.strip()) > maximum or (required and not value.strip()):
        raise ServiceError(f'Invalid {label}.')
    return value.strip()

def obj(value):
    if not isinstance(value, dict):
        raise ServiceError('Invalid request details.')
    return value

def iso_date(value, required=True):
    if not value and not required:
        return ''
    try:
        if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
            raise ValueError
        return date.fromisoformat(value).isoformat()
    except ValueError:
        raise ServiceError('Enter a valid calendar date.') from None

def integer(value, minimum, maximum, label):
    if type(value) is not int or not minimum <= value <= maximum:
        raise ServiceError(f'Invalid {label}.')
    return value

def decimal_value(value, label, allow_zero=False, places=2, maximum='999999999.99'):
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        raise ServiceError(f'Invalid {label}.')
    try:
        number = Decimal(str(value))
        if not number.is_finite() or number < 0 or (number == 0 and not allow_zero) or number > Decimal(maximum) or number.as_tuple().exponent < -places:
            raise InvalidOperation
        return number
    except (ValueError, InvalidOperation):
        raise ServiceError(f'Invalid {label}; use a positive amount with up to {places} decimal places.') from None

def minor(value, label='amount', allow_zero=False):
    return int(decimal_value(value, label, allow_zero) * 100)

def request_uuid(value):
    try:
        parsed = uuid.UUID(str(value))
        if parsed.version != 4:
            raise ValueError
        return str(parsed)
    except (ValueError, AttributeError):
        raise ServiceError('A valid submission reference is required.') from None

def email(value):
    value = text(value, 254, 'email', True).lower()
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email(value)
    except ValidationError:
        raise ServiceError('Enter a valid email address.') from None
    return value

def phone(value):
    value = text(value, 30, 'phone number', True)
    if not re.fullmatch(r'\+?[0-9 ()-]+', value) or not 7 <= len(re.sub(r'\D', '', value)) <= 15:
        raise ServiceError('Enter a valid phone number.')
    return value

def lead_input(data):
    obj(data)
    if data.get('source') not in ['callback', 'quote', 'booking']:
        raise ServiceError('Invalid application source.')
    full = data['source'] != 'callback'
    result = {'source': data['source'], 'phone': phone(data.get('phone')), 'first_name': text(data.get('firstName'), 100, 'first name', full), 'last_name': text(data.get('lastName'), 100, 'last name', full), 'language': data.get('language', 'uz')}
    if result['language'] not in ['uz', 'ru', 'en']:
        raise ServiceError('Invalid language.')
    if data.get('email') or full:
        result['email'] = email(data.get('email'))
    for source, target, maximum in [('pagePath','page_path',500),('flightRoute','flight_route',200),('airline','airline',100)]:
        result[target] = text(data.get(source), maximum, source)
    if result['page_path'] and (not result['page_path'].startswith('/') or result['page_path'].startswith('//')):
        raise ServiceError('Invalid page path.')
    if data.get('quotedPrice') is not None:
        result['quoted_price'] = decimal_value(data['quotedPrice'], 'quoted price', True)
    if data['source'] == 'booking' and data.get('termsAccepted') is not True:
        raise ServiceError('Accept the booking terms.')
    result.update(terms_accepted=data.get('termsAccepted') is True)
    for source,target in [('departureAirport','departure_airport'),('arrivalAirport','arrival_airport')]:
        if data.get(source):
            if not isinstance(data[source],str) or not re.fullmatch('[A-Z]{3}',data[source]):
                raise ServiceError('Invalid airport code.')
            result[target]=data[source]
    if result.get('departure_airport') and result.get('departure_airport') == result.get('arrival_airport'):
        raise ServiceError('Departure and arrival must be different.')
    for source,target in [('departureDate','departure_date'),('returnDate','return_date')]:
        if data.get(source):
            result[target]=iso_date(data[source])
    if result.get('return_date') and result.get('departure_date') and result['return_date'] < result['departure_date']:
        raise ServiceError('Return date must follow departure.')
    if data.get('passengers') is not None:
        result['passengers']=integer(data['passengers'],1,9,'passenger count')
    if data.get('cabin'):
        if data['cabin'] not in ['Economy','Premium Economy','Business','First']:
            raise ServiceError('Invalid cabin class.')
        result['cabin']=data['cabin']
    return result

def passports_input(data, today=None):
    today = (today or timezone.localdate()).isoformat()
    if not isinstance(data,list) or not 1 <= len(data) <= 9:
        raise ServiceError('Add passport details for 1–9 passengers.')
    ids,numbers,result=set(),set(),[]
    for passenger in data:
        obj(passenger)
        reference=request_uuid(passenger.get('id') or str(uuid.uuid4()))
        first=' '.join(text(passenger.get('firstName'),100,'passport given names',True).split())
        last=' '.join(text(passenger.get('lastName'),100,'passport surname',True).split())
        number=text(passenger.get('passportNumber'),30,'passport number',True).upper()
        if not re.fullmatch(r'[A-Z0-9 -]{3,30}',number) or number in numbers or reference in ids:
            raise ServiceError('Invalid or duplicate passport number/reference.')
        birth,expiry=iso_date(passenger.get('birthDate')),iso_date(passenger.get('expiryDate'))
        if birth >= today or expiry <= today or expiry <= birth:
            raise ServiceError('Check passport birth and expiry dates.')
        kind=passenger.get('passengerType')
        if kind not in ['adult','child','infant']:
            raise ServiceError('Invalid passenger type.')
        ids.add(reference);numbers.add(number)
        result.append({'id':reference,'firstName':first,'lastName':last,'fullName':f'{first} {last}','passportNumber':number,'birthDate':birth,'expiryDate':expiry,'passengerType':kind,'nationality':text(passenger.get('nationality'),60,'nationality',True)})
    return result

def journeys_input(data,trip_type,today=None):
    today=(today or timezone.localdate()).isoformat()
    if trip_type not in ['one-way','round-trip','multi-city'] or not isinstance(data,list) or len(data) not in ({'one-way':[1],'round-trip':[2],'multi-city':range(2,7)}[trip_type]):
        raise ServiceError('Check the number of journeys for this trip type.')
    journeys=[];previous=''
    for index,journey in enumerate(data):
        obj(journey)
        if not isinstance(journey.get('legs'),list) or not 1<=len(journey['legs'])<=6:
            raise ServiceError('Each journey needs 1–6 flight segments.')
        legs=[]
        for leg in journey['legs']:
            obj(leg)
            item={key:text(leg.get(key),maximum,key,required) for key,maximum,required in [('from',3,True),('to',3,True),('fromCity',100,True),('toCity',100,True),('departureTime',5,True),('arrivalTime',5,True),('departureTerminal',30,False),('arrivalTerminal',30,False),('airline',100,True),('flightNumber',30,True),('cabin',50,True)]}
            item['from'],item['to']=item['from'].upper(),item['to'].upper()
            if not all(re.fullmatch('[A-Z]{3}',item[key]) for key in ['from','to']) or item['from']==item['to']:
                raise ServiceError('Enter different three-letter airports.')
            if not all(re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d',item[key]) for key in ['departureTime','arrivalTime']):
                raise ServiceError('Enter valid flight times.')
            item['departureDate'],item['arrivalDate']=iso_date(leg.get('departureDate')),iso_date(leg.get('arrivalDate'))
            if item['departureDate']<today or item['arrivalDate']<item['departureDate']:
                raise ServiceError('Check flight dates.')
            raw=leg.get('durationMinutes')
            if isinstance(raw,str) and raw.isdigit(): raw=int(raw)
            item['durationMinutes']=integer(raw,1,2880,'flight duration')
            legs.append(item)
        if legs[0]['departureDate']<previous:
            raise ServiceError('Journeys must be in date order.')
        layovers=[]
        for before,after in zip(legs,legs[1:]):
            arrival=datetime.fromisoformat(f"{before['arrivalDate']}T{before['arrivalTime']}")
            departure=datetime.fromisoformat(f"{after['departureDate']}T{after['departureTime']}")
            if before['to']!=after['from'] or departure<arrival:
                raise ServiceError('Connecting flights must follow arrival at the same airport.')
            layovers.append({'airport':after['from'],'city':after['fromCity'],'minutes':int((departure-arrival).total_seconds()/60)})
        previous=legs[-1]['arrivalDate']
        journeys.append({'label':('outbound' if index==0 else 'return') if trip_type=='round-trip' else 'segment','legs':legs,'stops':len(legs)-1,'layovers':layovers,'durationMinutes':sum(leg['durationMinutes'] for leg in legs)+sum(stop['minutes'] for stop in layovers)})
    if trip_type=='round-trip' and (journeys[0]['legs'][0]['from']!=journeys[1]['legs'][-1]['to'] or journeys[0]['legs'][-1]['to']!=journeys[1]['legs'][0]['from']):
        raise ServiceError('Return airports must reverse the outbound route. Use multi-city for open-jaw trips.')
    return journeys

def billing_input(data,snapshot):
    obj(data)
    people=snapshot.get('passengerDetails',[])
    key=lambda value:' '.join(unicodedata.normalize('NFKC',value).split()).upper()
    name=text(data.get('fullName'),201,'billing full name',True)
    passenger=next((p for p in people if key(p['fullName'])==key(name)),None)
    if not passenger:
        raise ServiceError('Billing full name must match a passport passenger on this booking.')
    return {'fullName':passenger['fullName'],'email':email(data.get('email')),'phone':phone(data.get('phone')),'country':text(data.get('country'),80,'country',True),'city':text(data.get('city'),100,'city',True),'address':text(data.get('address'),300,'address',True)}
