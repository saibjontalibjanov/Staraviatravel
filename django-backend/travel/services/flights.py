import json
import math
import re
from pathlib import Path
from datetime import timedelta
import requests
from django.conf import settings
from django.utils import timezone
from travel.models import FareQuote
from .validation import ServiceError, obj, iso_date

AIRPORTS=json.loads((Path(__file__).resolve().parent.parent/'data/airports.json').read_text())
AIRPORTS=[{'code':str(a.get('code') or ''),'name':str(a.get('name') or ''),'city':str(a.get('city') or ''),'country':str(a.get('country') or '')} for a in AIRPORTS if a.get('code')]
CITIES={a['code']:a['city'] for a in AIRPORTS}
CABINS={'economy':1,'premium economy':2,'business':3,'first':4}

def normalize_search(data,today=None):
    obj(data)
    today=(today or timezone.localdate()).isoformat()
    cabin=data.get('cabin','Business')
    if not isinstance(cabin,str): raise ServiceError('Invalid cabin class.')
    cabin=cabin.strip().lower().replace('first class','first')
    if cabin not in CABINS: raise ServiceError('Choose a supported cabin class.')
    passengers=data.get('passengers',1)
    if isinstance(passengers,bool) or not re.fullmatch('[1-9]',str(passengers)): raise ServiceError('Choose 1–9 passengers.')
    common={'cabin':{'economy':'Economy','premium economy':'Premium Economy','business':'Business','first':'First'}[cabin],'passengers':int(passengers)}
    if data.get('tripType')=='multi-city':
        parts=data.get('multiCity')
        if not isinstance(parts,list) or not 2<=len(parts)<=6: raise ServiceError('Multi-city search needs 2–6 journeys.')
        journeys=[normalize_search({**obj(part),**common},timezone.datetime.fromisoformat(today).date()) for part in parts]
        if any(a['date']>b['date'] for a,b in zip(journeys,journeys[1:])): raise ServiceError('Multi-city dates must be in order.')
        return {**common,'departure_id':journeys[0]['departure_id'],'arrival_id':journeys[-1]['arrival_id'],'date':journeys[0]['date'],'tripType':'multi-city','multiCity':[{k:item[k] for k in ['departure_id','arrival_id','date']} for item in journeys]}
    departure,arrival=data.get('departure_id',''),data.get('arrival_id','')
    if not all(isinstance(v,str) and re.fullmatch('[A-Za-z]{3}',v.strip()) for v in [departure,arrival]): raise ServiceError('Enter valid three-letter airport codes.')
    departure,arrival=departure.strip().upper(),arrival.strip().upper()
    if departure==arrival: raise ServiceError('Departure and arrival must be different.')
    outbound=iso_date(data.get('date'))
    if outbound<today: raise ServiceError('Choose a departure date today or later.')
    result={**common,'departure_id':departure,'arrival_id':arrival,'date':outbound}
    if data.get('return_date'):
        back=iso_date(data['return_date'])
        if back<outbound: raise ServiceError('Return date must follow departure.')
        result['return_date']=back
    return result

def format_flights(data,search):
    offers=[]
    for key in ['best_flights','other_flights']:
        if isinstance(data.get(key),list): offers.extend(data[key])
    result=[]
    for offer in offers:
        if not isinstance(offer,dict) or not isinstance(offer.get('flights'),list) or not offer['flights']: continue
        legs=[]
        for part in offer['flights']:
            if not isinstance(part,dict): continue
            def airport(key):
                raw=part.get(key) or {};code=raw.get('id','')
                return {'airport':raw.get('name',''),'city':CITIES.get(code) or raw.get('name',''),'code':code,'time':raw.get('time',''),'terminal':raw.get('terminal','')}
            legs.append({'airline':part.get('airline') or 'Unknown Airline','flightNumber':part.get('flight_number',''),'cabin':part.get('travel_class') or search['cabin'],'departure':airport('departure_airport'),'arrival':airport('arrival_airport'),'duration':part.get('duration') if type(part.get('duration')) in [int,float] else None})
        if not legs: continue
        price=offer.get('price')
        if type(price) not in [int,float] or not math.isfinite(price) or price<0: price=None
        logo=offer['flights'][0].get('airline_logo','')
        result.append({'id':len(result)+1,'airline':legs[0]['airline'],'airlineLogo':logo if isinstance(logo,str) and logo.startswith('https://') else None,'flightNumber':' / '.join(leg['flightNumber'] for leg in legs if leg['flightNumber']),'departure':{**legs[0]['departure'],'code':legs[0]['departure']['code'] or search['departure_id']},'arrival':{**legs[-1]['arrival'],'code':legs[-1]['arrival']['code'] or search['arrival_id']},'duration':offer.get('total_duration'),'stops':len(legs)-1,'price':price,'cabin':legs[0]['cabin'],'type':'multi-city' if search.get('multiCity') else 'round-trip' if search.get('return_date') else 'one-way','legs':legs,'layovers':[{'airport':stop.get('id',''),'city':stop.get('name',''),'minutes':stop.get('duration')} for stop in (offer.get('layovers') or []) if isinstance(stop,dict)],'baggage':offer.get('baggage','') if isinstance(offer.get('baggage',''),str) else ''})
    return result

def search_flights(data,lead=None,agent=None):
    search=normalize_search(data)
    if not settings.SERPAPI_KEY: raise ServiceError('Ticket search is not configured. Set SERPAPI_KEY in django-backend/.env.',503)
    params={'engine':'google_flights','type':3 if search.get('multiCity') else 1 if search.get('return_date') else 2,'adults':search['passengers'],'travel_class':CABINS[search['cabin'].lower()],'currency':'USD','hl':'en','api_key':settings.SERPAPI_KEY}
    if search.get('multiCity'): params['multi_city_json']=json.dumps(search['multiCity'])
    else:
        params.update(departure_id=search['departure_id'],arrival_id=search['arrival_id'],outbound_date=search['date'])
        if search.get('return_date'): params['return_date']=search['return_date']
    try:
        response=requests.get('https://serpapi.com/search.json',params=params,timeout=(5,30))
        if response.status_code in [401,403,429]: raise ServiceError('The flight provider rejected the request or its quota is exhausted. Check the provider account.',503)
        response.raise_for_status();body=response.json()
    except (requests.RequestException,ValueError):
        raise ServiceError('The flight provider is unavailable. Please retry.',502) from None
    if not isinstance(body,dict) or body.get('error'): raise ServiceError('The provider could not complete this search.',502)
    flights=format_flights(body,search)
    if lead:
        FareQuote.objects.filter(expires_at__lt=timezone.now()-timedelta(days=1)).delete()
        for flight in flights[:100]:
            if flight['price'] is None or flight['price']<=0: continue
            quote=FareQuote.objects.create(lead=lead,agent=agent,offer=flight,search=search,expires_at=timezone.now()+timedelta(minutes=30))
            flight['quoteReference']=str(quote.reference);flight['quoteExpiresAt']=quote.expires_at.isoformat()
    return {'flights':flights,'search':search,'currency':'USD','searchedAt':timezone.now().isoformat(),**({'message':'No flights found for this search.'} if not flights else {})}
