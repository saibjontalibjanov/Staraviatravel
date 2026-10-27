import test from 'node:test'
import assert from 'node:assert/strict'
import { checkoutAutofill } from '../django-backend/travel/static/office/itinerary.js'
import { compactLaptop } from '../src/lib/displayScale.js'
const leg = {airline:'Uzbekistan Airways',flightNumber:'HY333',cabin:'Business',duration:255,departure:{code:'TAS',city:'Tashkent',time:'2030-05-15 08:40',terminal:'T2'},arrival:{code:'DXB',city:'Dubai',time:'2030-05-15 11:55',terminal:'T1'}}
const search = {departure_id:'TAS',arrival_id:'DXB',date:'2030-05-15',cabin:'Business'}
test('selected ticket fills every provided journey field, baggage, terms and client language',()=>{
 const result=checkoutAutofill({flight:{airline:leg.airline,legs:[leg],baggageDetails:[{type:'checked',allowance:'1 piece · 23 kg',appliesTo:'Every passenger'}],fareTerms:'Provider fare rules'},search},{language:'en'})
 assert.equal(result.route,'Tashkent → Dubai');assert.equal(result.tripType,'one-way');assert.equal(result.currency,'USD');assert.equal(result.fareTerms,'Provider fare rules');assert(result.paymentInformation);assert.equal(result.baggage[0].allowance,'1 piece · 23 kg');assert.deepEqual(result.missing,[])
 assert.deepEqual(result.journeys[0].legs[0],{from:'TAS',to:'DXB',fromCity:'Tashkent',toCity:'Dubai',departureDate:'2030-05-15',arrivalDate:'2030-05-15',departureTime:'08:40',arrivalTime:'11:55',departureTerminal:'T2',arrivalTerminal:'T1',airline:'Uzbekistan Airways',flightNumber:'HY333',cabin:'Business',durationMinutes:255})
})
test('missing return details are flagged and never copied from the outbound flight',()=>{
 const result=checkoutAutofill({flight:{airline:leg.airline,legs:[leg]},search:{...search,return_date:'2030-05-22'}},{cabin:'Economy',language:'uz'})
 const back=result.journeys[1].legs[0];assert.equal(back.departureDate,'2030-05-22');assert.equal(back.from,'DXB');assert.equal(back.to,'TAS');assert.equal(back.cabin,'Business');assert.equal(back.flightNumber,'');assert.equal(back.departureTime,'');assert.equal(back.arrivalDate,'');assert.equal(back.fromCity,'Dubai');assert(result.missing.some(item=>item.includes('departureTime')));assert(result.fareTerms.includes('O‘zgartirish'))
})
test('baggage autofill does not combine checked and cabin allowances into the wrong category',()=>{
 const fill=baggage=>checkoutAutofill({flight:{legs:[leg],baggage},search},{language:'en'})
 assert.equal(fill('1 checked bag · 23 kg').baggage[0].type,'checked');assert.deepEqual(fill('Checked 23 kg and cabin 8 kg').baggage,[]);assert.deepEqual(fill('Ask your airline').baggage,[])
})
test('compact-laptop scale is restricted to small desktop screens',()=>{
 assert(compactLaptop({width:1366,height:768},true));assert(compactLaptop({width:1536,height:960},true));assert(!compactLaptop({width:1920,height:1080},true));assert(!compactLaptop({width:390,height:844},false));assert(!compactLaptop({width:1366,height:768},false))
})
