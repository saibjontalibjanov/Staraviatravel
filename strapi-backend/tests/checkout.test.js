'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { validate, websiteOrigin, hashToken, tokenValid, state, publicCheckout, publicView, registerCheckoutRoutes, saveBilling } = require('../src/services/lead-checkout');
const { validatePassports, validateBilling, validateJourneys } = require('../src/services/checkout-data');
const now = new Date('2030-01-01T00:00:00Z');
const passports = () => [{id:crypto.randomUUID(),firstName:'Aziz',lastName:'Karimov',passportNumber:'AA1234567',birthDate:'1990-01-01',expiryDate:'2040-01-01',nationality:'Uzbekistan',passengerType:'adult'}];
const lead = () => ({id:1,clientId:'123456',passportDetails:passports()});
const leg = (extra={}) => ({from:'TAS',to:'DXB',fromCity:'Tashkent',toCity:'Dubai',departureDate:'2030-05-15',arrivalDate:'2030-05-15',departureTime:'08:40',arrivalTime:'11:55',airline:'Uzbekistan Airways',flightNumber:'HY333',cabin:'Business',durationMinutes:255,...extra});
const input = () => ({requestId:crypto.randomUUID(),currency:'USD',profit:'56.80',expiryDays:7,route:'Tashkent → Dubai',tripType:'one-way',journeys:[{legs:[leg()]}],baggage:[{type:'checked',allowance:'23 kg',appliesTo:'Each passenger'}],fareTerms:'Actual refund conditions',language:'uz',paymentInformation:'Contact your agent for payment.',fareConfirmed:true});
const quote = () => ({reference:crypto.randomUUID(),offer:{price:1100},expiresAt:'2099-01-01'});
const create = (changes={}, person=lead(), offer=quote()) => validate({...input(),...changes},person,now,offer);
const billing = () => ({fullName:'Aziz Karimov',email:'User@Example.test',phone:'+998901234567',country:'Uzbekistan',city:'Tashkent',address:'Street 1'});

test('server totals the selected fare and profit in exact minor units, ignoring a client-supplied total',()=>{
 const result=create({amount:'0.01',amountMinor:'1',passengerName:'Forged',pricing:{profitMinor:'0'}});
 assert.equal(result.amountMinor,'115680');assert.equal(result.pricing.baseMinor,'110000');assert.equal(result.pricing.profitMinor,'5680');assert.equal(result.snapshot.passengerName,'Aziz Karimov');
 assert.equal(create({profit:'0.01'}).amountMinor,'110001');assert.equal(create({profit:'0'}).amountMinor,'110000');
});
test('UZS conversion uses an explicit rate and rounds once before adding profit',()=>{
 const result=create({currency:'UZS',exchangeRate:'12900.123456',profit:'10000.25'});
 assert.equal(result.amountMinor,'1420013605');assert.equal(result.pricing.profitMinor,'1000025');
 assert.throws(()=>create({currency:'UZS',exchangeRate:'0'}));assert.throws(()=>create({currency:'UZS',exchangeRate:'1e4'}));
});
test('selected fare, confirmed coverage, passports and valid profit are required',()=>{
 assert.throws(()=>create({},lead(),null));assert.throws(()=>create({},lead(),{...quote(),expiresAt:'2000-01-01'}));assert.throws(()=>create({},lead(),{...quote(),offer:{price:null}}));
 assert.throws(()=>create({}, {clientId:'123456',passportDetails:[]}));
 for(const change of [{profit:'-1'},{profit:'1.001'},{profit:'NaN'},{fareConfirmed:false},{expiryDays:31},{currency:'EUR'},{fareTerms:' '},{language:'de'}])assert.throws(()=>create(change));
});
test('passport validation rejects duplicates, expired documents and invalid birth dates; names come from passport fields',()=>{
 const people=validatePassports(passports(),now);assert.equal(people[0].fullName,'Aziz Karimov');
 for(const people of [[],[...passports(),...passports()],[{...passports()[0],expiryDate:'2029-01-01'}],[{...passports()[0],birthDate:'2031-01-01'}]])assert.throws(()=>validatePassports(people,now));
 const person=lead();person.passportDetails[0].expiryDate='2030-04-01';assert.throws(()=>create({},person));
});
test('round-trip and multi-city preserve ordered flight dates, seat classes and editable destinations',()=>{
 const back=leg({from:'DXB',to:'TAS',fromCity:'Dubai',toCity:'Tashkent',departureDate:'2030-05-22',arrivalDate:'2030-05-22',departureTime:'13:20',arrivalTime:'18:10',flightNumber:'HY334',cabin:'Economy Comfort'});
 const result=create({tripType:'round-trip',route:'Tashkent ⇄ Dubai',journeys:[{legs:[leg()]},{legs:[back]}]});assert.equal(result.snapshot.journeys[1].label,'return');assert.equal(result.snapshot.journeys[1].legs[0].cabin,'Economy Comfort');
 const onward={...back,to:'IST',toCity:'Istanbul'};assert.equal(create({tripType:'multi-city',journeys:[{legs:[leg()]},{legs:[onward]}]}).snapshot.journeys.length,2);
 assert.throws(()=>create({tripType:'round-trip',journeys:[{legs:[leg()]},{legs:[onward]}]}));assert.throws(()=>create({tripType:'one-way',journeys:[{legs:[leg()]},{legs:[back]}]}));
});
test('connecting flights calculate actual stops, same-airport layovers and total duration',()=>{
 const first=leg({to:'IST',toCity:'Istanbul',arrivalTime:'10:00',durationMinutes:240});
 const second=leg({from:'IST',fromCity:'Istanbul',departureTime:'12:30',arrivalTime:'16:00',durationMinutes:210,flightNumber:'TK100'});
 const journeys=validateJourneys([{legs:[first,second]}],'one-way',now);assert.equal(journeys[0].stops,1);assert.equal(journeys[0].layovers[0].minutes,150);assert.equal(journeys[0].durationMinutes,600);
 assert.throws(()=>validateJourneys([{legs:[first,{...second,from:'AUH'}]}],'one-way',now));assert.throws(()=>validateJourneys([{legs:[first,{...second,departureTime:'09:00'}]}],'one-way',now));
});
test('public checkout exposes the lead reference, names and itinerary but no profit, fare cost or passport documents',()=>{
 const data=create();const result=publicView({...data,token:'secret',snapshot:{...data.snapshot,pricing:data.pricing,passportNumber:'AA1234567'},billingContact:billing()});
 const json=JSON.stringify(result);assert.equal(result.booking.clientId,'123456');assert.equal(result.amountMinor,'115680');
 for(const secret of ['profit','baseMinor','sourceMinor','quoteReference','pricing','AA1234567','birthDate','expiryDate','User@Example.test','secret'])assert(!json.includes(secret),secret);
 assert.deepEqual(result.booking.passengerDetails.map(p=>p.fullName),['Aziz Karimov']);assert.equal(result.paymentsEnabled,false);
});
test('billing full name is matched against passport names on the server; untrusted fields are ignored',()=>{
 const snapshot=create().snapshot;const result=validateBilling({...billing(),fullName:' AZIZ   KARIMOV ',profit:'1000',paid:true,passportNumber:'secret'},snapshot);
 assert.equal(result.fullName,'Aziz Karimov');assert.equal(result.email,'user@example.test');assert.equal(result.paid,undefined);assert.equal(result.passportNumber,undefined);
 for(const change of [{fullName:'Someone Else'},{email:'bad'},{phone:'abc'},{city:' '},{address:' '}])assert.throws(()=>validateBilling({...billing(),...change},snapshot));
});
test('billing saves only against an active link and never changes payment or pricing',async()=>{
 const row={...create(),id:1,lead:{id:1},expiresAt:'2099-01-01'};let written;
 const strapi={db:{query:()=>({findOne:async()=>row,updateMany:async query=>{written=query;return{count:1}}})}};
 const token=crypto.randomBytes(32).toString('base64url');assert.deepEqual(await saveBilling(strapi,token,{...billing(),amountMinor:'1',paid:true}),{saved:true});assert.deepEqual(Object.keys(written.data),['billingContact']);
 row.revokedAt='2030-01-01';await assert.rejects(saveBilling(strapi,token,billing()),{status:404});
});
test('unguessable token lookup rejects expired, revoked, deleted-lead and unknown links',async()=>{
 const token=crypto.randomBytes(32).toString('base64url');assert(tokenValid(token));assert.equal(token.length,43);let query;
 const row={...create(),lead:{id:1},expiresAt:'2099-01-01'};
 const strapi={db:{query:()=>({findOne:async value=>{query=value;return row}})}};
 await publicCheckout(strapi,token);assert.equal(query.where.tokenHash,hashToken(token));
 await assert.rejects(publicCheckout(strapi,'123456'),{status:404});row.revokedAt='2030-01-01';await assert.rejects(publicCheckout(strapi,token),{status:404});delete row.revokedAt;row.expiresAt='2000-01-01';await assert.rejects(publicCheckout(strapi,token),{status:404});row.expiresAt='2099-01-01';row.lead=null;await assert.rejects(publicCheckout(strapi,token),{status:404});
});
test('checkout links use only a configured trustworthy website origin',()=>{
 const previous=process.env.PUBLIC_WEBSITE_URL;try{for(const value of ['', 'javascript:alert(1)','http://example.com','https://user:password@example.com','https://example.com/?x=1','https://example.com/path']){process.env.PUBLIC_WEBSITE_URL=value;assert.throws(websiteOrigin)}process.env.PUBLIC_WEBSITE_URL='https://travel.example.com';assert.equal(websiteOrigin(),'https://travel.example.com');process.env.PUBLIC_WEBSITE_URL='http://localhost:3000';assert.equal(websiteOrigin(),'http://localhost:3000')}finally{if(previous==null)delete process.env.PUBLIC_WEBSITE_URL;else process.env.PUBLIC_WEBSITE_URL=previous}
});
test('all agent checkout and passport routes require admin authentication, checkout action and lead read access',async()=>{
 let routes;registerCheckoutRoutes({server:{routes:value=>{routes=value}}});for(const route of routes.routes){assert.equal(route.config.policies[0],'admin::isAuthenticatedAdmin');assert.deepEqual(route.config.policies[1].config.actions,['api::checkout.manage']);const ctx={set(){},state:{userAbility:{can:()=>false}}};await route.handler(ctx);assert.equal(ctx.status,403)}
});
test('legacy checkout snapshots remain readable and expired/revoked status is stable',()=>{
 assert.equal(publicView({snapshot:{route:'TAS → DXB',passengerName:'Legacy',internalCost:'secret'},currency:'USD',amountMinor:'100',expiresAt:'2099-01-01'}).booking.internalCost,undefined);
 assert.equal(state({expiresAt:'2030-01-01'},now),'expired');assert.equal(state({expiresAt:'2031-01-01',revokedAt:'2030-01-01'},now),'revoked');
});
