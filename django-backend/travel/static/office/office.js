import { emptyLeg, fromOffer, pricePreview, initialSearch } from './itinerary.js'
const $ = (value, root=document) => root.querySelector(value)
const $$ = (value, root=document) => [...root.querySelectorAll(value)]
const lead = $('#lead-data') ? JSON.parse($('#lead-data').textContent) : {}
const state = { passports: [], selected: null, journeys: [{legs:[emptyLeg(lead)]}], baggage: [], requestId:null }
const csrf = () => $('[name=csrfmiddlewaretoken]')?.value || ''
const node = (tag, content, attrs={}) => { const element=document.createElement(tag);if(content!==undefined&&content!==null)element.textContent=content;for(const [key,value]of Object.entries(attrs)){if(key==='class')element.className=value;else element.setAttribute(key,value)}return element }
const button = (label, action, style='secondary') => {const value=node('button',label,{type:'button',class:`button ${style}`});value.addEventListener('click',action);return value}
async function api(url,method='GET',data){
 const response=await fetch(url,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRFToken':csrf()},...(data===undefined?{}:{body:JSON.stringify(data)})})
 const body=await response.json().catch(()=>({}))
 if(!response.ok)throw new Error(body.error?.message || (response.status===403?'Access denied or your session expired. Sign in again.':'The operation failed. Please try again.'))
 return body
}
function feedback(form,message,error=false){const target=$('.feedback',form);if(target){target.textContent=message;target.classList.toggle('error',error)}}
function submit(form,action){if(!form)return;let busy=false;form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;const disabled=$$('button',form).map(value=>[value,value.disabled]);disabled.forEach(([value])=>value.disabled=true);feedback(form,'Working…');try{await action()}catch(error){feedback(form,error.message,true)}finally{busy=false;disabled.forEach(([value,wasDisabled])=>value.disabled=wasDisabled)}})}
function input(label,value,onChange,{type='text',required=true,max=200,min,options,name,list}={}){
 const wrapper=node('label',label);const field=node(options?'select':'input');if(name)field.name=name
 if(options){for(const option of options){const [key,text]=Array.isArray(option)?option:[option,option];field.append(node('option',text,{value:key}))}}
 else{field.type=type;if(type!=='date'&&type!=='time')field.maxLength=max;if(list)field.setAttribute('list',list)}
 field.value=value??'';field.required=required;if(min!==undefined)field.min=min
 field.addEventListener('input',()=>onChange(field.value));wrapper.append(field);return wrapper
}
function dirty(){state.requestId=null;const confirmed=$('[name=fareConfirmed]',$('#checkout-form')||document);if(confirmed)confirmed.checked=false;overview()}
function money(amount,currency='USD'){return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(amount)}
$('[data-menu]')?.addEventListener('click',()=>$('.sidebar').classList.toggle('open'))

// Native dialogs provide focus trapping, Escape dismissal and focus restoration.
const dialogTriggers = new WeakMap()
function openDialog(id, trigger){const dialog=document.getElementById(id);if(!dialog)return;dialogTriggers.set(dialog,trigger||document.activeElement);dialog.showModal();document.body.classList.add('modal-open')}
function closeDialog(dialog){dialog.close()}
$$('[data-dialog-open]').forEach(trigger=>trigger.addEventListener('click',()=>openDialog(trigger.dataset.dialogOpen,trigger)))
$$('.workspace-dialog').forEach(dialog=>{
 $('[data-dialog-close]',dialog)?.addEventListener('click',()=>closeDialog(dialog))
 dialog.addEventListener('close',()=>{if(!$('.workspace-dialog[open]'))document.body.classList.remove('modal-open');dialogTriggers.get(dialog)?.focus()})
 dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))closeDialog(dialog)})
 if(dialog.hasAttribute('data-auto-open'))openDialog(dialog.id)
})
function savedOverview(checkout){
 const target=$('#checkout-overview');if(!target||state.selected)return
 target.replaceChildren();const snapshot=checkout.snapshot
 const header=node('div',null,{class:'booking-preview-header'});header.append(node('div',snapshot.route),node('span',`#${lead.clientId}`,{class:'pill'}));target.append(header)
 for(const [index,journey] of (snapshot.journeys||[]).entries()){
  const first=journey.legs[0],last=journey.legs.at(-1),row=node('article',null,{class:'booking-preview-flight'})
  row.append(node('small',snapshot.tripType==='round-trip'?(index?'RETURN':'OUTBOUND'):`JOURNEY ${index+1}`),node('h3',`${first.from} → ${last.to}`),node('p',`${first.departureDate} · ${first.departureTime} → ${last.arrivalTime}`),node('p',`${journey.legs.length-1} stop(s) · ${first.airline} · ${first.cabin}`,{class:'muted'}));target.append(row)
 }
 target.append(node('p',(snapshot.passengerDetails||[]).map(person=>person.fullName).join(', ')||snapshot.passengerName||'',{class:'preview-passengers'}),node('div',`Client total · ${money(Number(checkout.amountMinor)/100,checkout.currency)}`,{class:'booking-preview-total'}),node('p',`Saved offer · ${checkout.status} · Expires ${new Date(checkout.expiresAt).toLocaleString()}`,{class:'fine-print'}))
}
function overview(){
 const target=$('#checkout-overview');if(!target||!state.selected)return
 const form=$('#checkout-form');target.replaceChildren()
 const header=node('div',null,{class:'booking-preview-header'});header.append(node('div',form.elements.route.value||'Your journey'),node('span',`#${lead.clientId}`,{class:'pill'}));target.append(header)
 for(const [index,journey] of state.journeys.entries()){
  const first=journey.legs[0],last=journey.legs.at(-1);const row=node('article',null,{class:'booking-preview-flight'});row.append(node('small',form.elements.tripType.value==='round-trip'?(index?'RETURN':'OUTBOUND'):`JOURNEY ${index+1}`),node('h3',`${first.from||'—'}  →  ${last.to||'—'}`),node('p',`${first.departureDate||'Date to confirm'} · ${first.departureTime||'—'} → ${last.arrivalTime||'—'}`),node('p',`${journey.legs.length-1} stop(s) · ${first.airline||state.selected.flight.airline} · ${first.cabin||'Class to confirm'}`,{class:'muted'}));target.append(row)
 }
 const passengers=state.passports.filter(person=>person.firstName&&person.lastName).map(person=>`${person.firstName} ${person.lastName}`).join(', ')
 target.append(node('p',passengers||'Save passport details to confirm passenger names.',{class:'preview-passengers'}))
 const pricing=pricePreview(state.selected.flight.price,form.elements.currency.value,form.elements.exchangeRate.value,form.elements.profit.value)
 if(pricing)target.append(node('div',`Client total · ${money(pricing.total,form.elements.currency.value)}`,{class:'booking-preview-total'}))
 target.append(node('p','Draft preview · Generate a checkout link in PNR to save this offer.',{class:'fine-print'}))
}

// Passport editor: only explicitly saved server records become checkout names.
function passportRows(){
 const target=$('#passport-rows');if(!target)return;target.replaceChildren()
 state.passports.forEach((person,index)=>{const row=node('div',null,{class:'passport-row'});row.append(node('h3',`Passenger ${index+1}`));const fields=node('div',null,{class:'form-grid'});for(const [key,label,type]of [['firstName','Given names','text'],['lastName','Surname','text'],['passportNumber','Passport number','text'],['birthDate','Date of birth','date'],['expiryDate','Passport expiry','date'],['nationality','Nationality','text']])fields.append(input(label,person[key],value=>{person[key]=value;dirty()},{type,max:key==='passportNumber'?30:100}));fields.append(input('Passenger type',person.passengerType,value=>{person.passengerType=value;dirty()},{options:[['adult','Adult'],['child','Child'],['infant','Infant']]}));row.append(fields);const remove=button('Remove passenger',()=>{state.passports.splice(index,1);passportRows();dirty()});remove.disabled=state.passports.length===1;row.append(remove);target.append(row)})
}
const newPerson=()=>({id:crypto.randomUUID(),firstName:'',lastName:'',passportNumber:'',birthDate:'',expiryDate:'',nationality:'Uzbekistan',passengerType:'adult'})
if($('#passport-form')){
 api(`/office/api/leads/${lead.clientId}/passports`).then(data=>{state.passports=data.passengers.length?data.passengers:[newPerson()];passportRows()}).catch(error=>feedback($('#passport-form'),error.message,true))
 $('#add-passenger').addEventListener('click',()=>{if(state.passports.length>=9)return;state.passports.push(newPerson());passportRows();dirty()})
 submit($('#passport-form'),async()=>{const result=await api(`/office/api/leads/${lead.clientId}/passports`,'PUT',{passengers:state.passports});state.passports=result.passengers;passportRows();feedback($('#passport-form'),'Passport details saved. Checkout names will use these saved records.');dirty();overview()})
}

// Ticket search. Additional journeys are editable for multi-city searches.
const searchForm=$('#ticket-form')
const defaults=initialSearch(lead)
let searchJourneys=[{departure_id:defaults.departure_id,arrival_id:defaults.arrival_id,date:defaults.date},{departure_id:defaults.arrival_id,arrival_id:defaults.departure_id,date:defaults.return_date}]
let ticketResults = null
function searchRows(){
 if(!searchForm)return
 const kind=searchForm.elements.tripType.value,target=$('#search-journeys'),extra=$('#search-extra-journeys');target.replaceChildren();extra.replaceChildren()
 const main=searchJourneys[0]
 for(const [key,label] of [['departure_id','From (IATA)'],['arrival_id','To (IATA)']])target.append(input(`${label} · journey 1`,main[key],value=>{main[key]=value.toUpperCase();if(kind==='round-trip'){searchJourneys[1].departure_id=main.arrival_id;searchJourneys[1].arrival_id=main.departure_id}},{max:3,list:'airport-catalogue'}))
 const dates=node('div',null,{class:'ticket-date-fields'});dates.append(input('Departure date · journey 1',main.date,value=>main.date=value,{type:'date',min:new Date().toLocaleDateString('en-CA')}))
 if(kind==='round-trip'){
  searchJourneys[1].departure_id=main.arrival_id;searchJourneys[1].arrival_id=main.departure_id
  dates.append(input('Return date',searchJourneys[1].date,value=>searchJourneys[1].date=value,{type:'date',min:main.date||new Date().toLocaleDateString('en-CA')}))
 }
 target.append(dates)
 if(kind==='multi-city')searchJourneys.slice(1).forEach((journey,offset)=>{const index=offset+1,row=node('div',null,{class:'ticket-extra-journey'});row.append(node('strong',`Journey ${index+1}`));for(const [key,label]of [['departure_id','From (IATA)'],['arrival_id','To (IATA)']])row.append(input(`${label} · journey ${index+1}`,journey[key],value=>journey[key]=value.toUpperCase(),{max:3,list:'airport-catalogue'}));row.append(input(`Departure date · journey ${index+1}`,journey.date,value=>journey.date=value,{type:'date',min:new Date().toLocaleDateString('en-CA')}));if(searchJourneys.length>2)row.append(button('Remove journey',()=>{searchJourneys.splice(index,1);searchRows()}));extra.append(row)})
 $('#add-search-city').hidden=kind!=='multi-city'
}
function renderTickets(){
 if(!ticketResults)return
 const target=$('#ticket-results'),stop=$('#ticket-stop-filter').value,airline=$('#ticket-airline-filter').value,maximum=$('#ticket-price-filter').value,sort=$('#ticket-sort').value
 let flights=ticketResults.flights.filter(flight=>(stop==='all'||flight.stops<=Number(stop))&&(airline==='all'||flight.airline===airline)&&(!maximum||(flight.price!==null&&flight.price<=Number(maximum))))
 if(sort==='price')flights.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity))
 if(sort==='duration')flights.sort((a,b)=>(Number.isFinite(a.duration)?a.duration:Infinity)-(Number.isFinite(b.duration)?b.duration:Infinity))
 target.replaceChildren();$('#ticket-result-count').textContent=`${flights.length} / ${ticketResults.flights.length} offers`
 if(!flights.length){const empty=node('div',null,{class:'ticket-empty'});empty.append(node('h3',ticketResults.flights.length?'No offers match your filters':'No flights found'),node('p',ticketResults.flights.length?'Reset or adjust filters to see more tickets.':'Try different dates or airports.'));target.append(empty);return}
 for(const flight of flights){
  const card=node('article',null,{class:'ticket-offer-card'}),identity=node('div',null,{class:'ticket-airline'}),logo=node('div',null,{class:'ticket-airline-logo'})
  if(flight.airlineLogo){const img=node('img',null,{src:flight.airlineLogo,alt:flight.airline,loading:'lazy',referrerpolicy:'no-referrer'});img.addEventListener('error',()=>logo.replaceChildren(node('strong',flight.airline)),{once:true});logo.append(img)}else logo.append(node('strong',flight.airline))
  identity.append(logo,node('p',flight.baggage||'Baggage: confirm fare allowance'),node('small',`${flight.stops===0?'Nonstop':`${flight.stops} stop(s)`} · ${flight.cabin}`))
  const itinerary=node('div',null,{class:'ticket-segment-list'});itinerary.append(node('strong',`${flight.departure.code} → ${flight.arrival.code}`,{class:'ticket-route'}))
  const lines=node('ol');for(const leg of flight.legs)lines.append(node('li',`${leg.flightNumber||'Flight to confirm'}  ${leg.departure.code} → ${leg.arrival.code}  ${leg.departure.time||'Time to confirm'} / ${leg.arrival.time||'Time to confirm'}  ${leg.cabin}`));itinerary.append(lines)
  if(Number.isFinite(flight.duration))itinerary.append(node('small',`Total duration: ${flight.duration} minutes`))
  const actions=node('div',null,{class:'ticket-offer-actions'});actions.append(node('strong',flight.price===null?'Price unavailable':money(flight.price)))
  for(const [label,pnr]of [['Add',false],['Create PNR',true]]){const action=button(label,()=>{selectFare(flight,ticketResults.search);if(pnr)openDialog('pnr-dialog')},pnr?'primary':'secondary');action.disabled=!$('#checkout-form')||!flight.quoteReference;action.title=!$('#checkout-form')?'Open a client record to use this fare':!flight.quoteReference?'A current priced fare is required':pnr?'Fill the PNR checkout form with this fare':'Add this fare to the client checkout';actions.append(action)}
  card.append(identity,itinerary,actions);target.append(card)
 }
}
if(searchForm){
 searchForm.elements.cabin.value=defaults.cabin
 searchForm.elements.tripType.addEventListener('change',searchRows)
 $('#add-search-city').addEventListener('click',()=>{if(searchJourneys.length>=6)return;const last=searchJourneys.at(-1);searchJourneys.push({departure_id:last.arrival_id,arrival_id:'',date:last.date});searchRows()})
 searchRows()
 const travellers=()=>$('#traveller-summary').textContent=`${searchForm.elements.cabin.value} · ${searchForm.elements.passengers.value} adult(s)`
 travellers();for(const field of [searchForm.elements.cabin,searchForm.elements.passengers])field.addEventListener('input',travellers)
 for(const id of ['ticket-stop-filter','ticket-airline-filter','ticket-price-filter','ticket-sort'])$('#'+id).addEventListener('input',renderTickets)
 $('#reset-ticket-filters').addEventListener('click',()=>{$('#ticket-stop-filter').value='all';$('#ticket-airline-filter').value='all';$('#ticket-price-filter').value='';$('#ticket-sort').value='recommended';renderTickets()})
 searchForm.addEventListener('invalid',()=>{const details=$('.ticket-travellers');if(details)details.open=true},true)
 fetch('/api/airports').then(response=>response.json()).then(rows=>{if(!Array.isArray(rows))return;const list=node('datalist',null,{id:'airport-catalogue'});for(const airport of rows)list.append(node('option',`${airport.city} · ${airport.name}`,{value:airport.code}));document.body.append(list)}).catch(()=>{})
 submit(searchForm,async()=>{
  const kind=searchForm.elements.tripType.value
  const data={...searchJourneys[0],cabin:searchForm.elements.cabin.value,passengers:Number(searchForm.elements.passengers.value),...(lead.clientId?{clientId:lead.clientId}:{}),...(kind==='round-trip'?{return_date:searchJourneys[1].date}:{}),...(kind==='multi-city'?{tripType:kind,multiCity:searchJourneys}:{})}
  if(kind==='round-trip'&&(searchJourneys[1].departure_id!==searchJourneys[0].arrival_id||searchJourneys[1].arrival_id!==searchJourneys[0].departure_id))throw new Error('Round-trip airports must reverse the outbound route. Choose multi-city for a different return routing.')
  ticketResults=null;$('#ticket-results').replaceChildren(node('p','Searching current fares…',{class:'ticket-empty'}));$('#ticket-result-count').textContent='Searching…'
  try{
   const result=await api('/office/api/search','POST',data);ticketResults=result
   const airlines=$('#ticket-airline-filter');airlines.replaceChildren(node('option','All airlines',{value:'all'}));for(const name of [...new Set(result.flights.map(flight=>flight.airline))].sort())airlines.append(node('option',name,{value:name}))
   feedback(searchForm,`${result.flights.length} offers found · ${result.currency}`);renderTickets()
  }catch(error){$('#ticket-results').replaceChildren(node('p',error.message,{class:'ticket-empty'}));$('#ticket-result-count').textContent='Search unavailable';throw error}

 })
}
function selectFare(flight,search){
 state.selected={flight,search};const filled=fromOffer(state.selected,lead);state.journeys=filled.journeys;const form=$('#checkout-form');form.elements.route.value=filled.route;form.elements.tripType.value=filled.tripType;form.elements.currency.value='USD';$('#exchange-field').hidden=true
 $('#selected-fare').replaceChildren(node('strong',`${flight.airline} · ${flight.flightNumber} · ${money(flight.price)}`),node('p',`Selected fare expires ${new Date(flight.quoteExpiresAt).toLocaleString()}. Verify all flight details and complete any missing journeys.`));checkoutRows();priceDisplay();dirty();overview();const dialog=$('#ticket-dialog');if(dialog?.open)closeDialog(dialog);$('#checkout-editor').scrollIntoView({behavior:'smooth'})
}
// Private quote editor. The server calculates and freezes the actual total.
const flightFields=[['from','From airport (IATA)','text'],['to','To airport (IATA)','text'],['fromCity','From city / airport','text'],['toCity','To city / airport','text'],['departureDate','Flight departure date','date'],['arrivalDate','Flight arrival date','date'],['departureTime','Departure time (local)','time'],['arrivalTime','Arrival time (local)','time'],['departureTerminal','Departure terminal','text'],['arrivalTerminal','Arrival terminal','text'],['airline','Operating airline','text'],['flightNumber','Flight number','text'],['cabin','Class of seats','text'],['durationMinutes','Flight duration (minutes)','number']]
function checkoutRows(){
 const form=$('#checkout-form');if(!form)return;const kind=form.elements.tripType.value;const target=$('#checkout-journeys');target.replaceChildren()
 state.journeys.forEach((journey,index)=>{const block=node('div',null,{class:'journey-editor'});block.append(node('h3',`${kind==='round-trip'?(index?'Return':'Outbound'):`Journey ${index+1}`} · ${journey.legs.length-1} stop(s)`));journey.legs.forEach((leg,legIndex)=>{const segment=node('div',null,{class:'flight-editor'});segment.append(node('h4',`Flight segment ${legIndex+1}`));const fields=node('div',null,{class:'form-grid'});for(const [key,label,type]of flightFields)fields.append(input(label,leg[key],value=>{leg[key]=['from','to'].includes(key)?value.toUpperCase():value;dirty()},{type,max:['from','to'].includes(key)?3:100,required:!['departureTerminal','arrivalTerminal'].includes(key),min:type==='number'?1:undefined}));segment.append(fields);if(legIndex)segment.append(node('p','Layover duration is calculated from the previous arrival and this departure at the same airport.',{class:'fine-print'}));const remove=button('Remove flight segment',()=>{journey.legs.splice(legIndex,1);checkoutRows();dirty()});remove.disabled=journey.legs.length===1;segment.append(remove);block.append(segment)});const add=button('＋ Add connecting flight',()=>{const last=journey.legs.at(-1);journey.legs.push({...emptyLeg(),from:last.to,fromCity:last.toCity,departureDate:last.arrivalDate,arrivalDate:last.arrivalDate});checkoutRows();dirty()});add.disabled=journey.legs.length>=6;block.append(add);if(kind==='multi-city'&&state.journeys.length>2)block.append(button('Remove journey',()=>{state.journeys.splice(index,1);checkoutRows();dirty()}));target.append(block)})
 $('#add-checkout-city').hidden=kind!=='multi-city'
}
function baggageRows(){const target=$('#baggage-rows');target.replaceChildren();state.baggage.forEach((item,index)=>{const row=node('div',null,{class:'baggage-row'});const fields=node('div',null,{class:'form-grid'});fields.append(input('Baggage type',item.type,value=>{item.type=value;dirty()},{options:[['checked','Checked'],['cabin','Cabin'],['personal','Personal item']]}),input('Allowance',item.allowance,value=>{item.allowance=value;dirty()}),input('Applies to',item.appliesTo,value=>{item.appliesTo=value;dirty()}));row.append(fields,button('Remove baggage',()=>{state.baggage.splice(index,1);baggageRows();dirty()}));target.append(row)})}
function priceDisplay(){const form=$('#checkout-form');if(!form)return;const result=pricePreview(state.selected?.flight.price,form.elements.currency.value,form.elements.exchangeRate.value,form.elements.profit.value);$('#price-preview').textContent=result?`Agents only — cost: ${money(result.base,form.elements.currency.value)} · private profit: ${money(result.profit,form.elements.currency.value)} · client total: ${money(result.total,form.elements.currency.value)}`:'Select a priced fare. UZS requires an agreed exchange rate. Only the final total is shared with the client.'}
function shareLink(checkout,target){if(!checkout.url)return;const field=node('input',null,{value:checkout.url,readonly:'', 'aria-label':'Client checkout link'});field.addEventListener('focus',()=>field.select());const actions=node('div',null,{class:'button-row'});actions.append(button('Copy link',async()=>{try{await navigator.clipboard.writeText(checkout.url);feedback($('#checkout-form'),'Checkout link copied.')}catch{field.focus();field.select();feedback($('#checkout-form'),'Copy the selected link manually.')}}),node('a','Open client page ↗',{href:checkout.url,target:'_blank',rel:'noreferrer',class:'button secondary'}));target.append(field,actions)}
async function loadCheckouts(){
 const target=$('#checkout-history');if(!target)return
 try{const result=await api(`/office/api/leads/${lead.clientId}/checkouts`);target.replaceChildren();if(!state.selected&&result.checkouts.length)savedOverview(result.checkouts.find(item=>item.status==='active')||result.checkouts[0]);if(result.configurationError)target.append(node('p',result.configurationError,{class:'feedback error'}));if(!result.checkouts.length)target.append(node('p','No checkout pages created yet.',{class:'muted'}));for(const checkout of result.checkouts){const row=node('article',null,{class:'checkout-history-item'});row.append(node('h3',`${checkout.snapshot.route} · ${money(Number(checkout.amountMinor)/100,checkout.currency)}`),node('p',`${checkout.status} · Expires ${new Date(checkout.expiresAt).toLocaleString()}`));if(checkout.pricing?.baseMinor)row.append(node('p',`Agents only — cost ${money(Number(checkout.pricing.baseMinor)/100,checkout.currency)} · private profit ${money(Number(checkout.pricing.profitMinor)/100,checkout.currency)}`));if(checkout.billingContact?.fullName)row.append(node('p',`Billing submitted: ${checkout.billingContact.fullName} · ${checkout.billingContact.email} · ${checkout.billingContact.phone} · ${checkout.billingContact.country}, ${checkout.billingContact.city}, ${checkout.billingContact.address}`));shareLink(checkout,row);if(checkout.url)row.append(button('Revoke link',async()=>{try{await api(`/office/api/leads/${lead.clientId}/checkouts/${checkout.id}/revoke`,'POST',{});await loadCheckouts();$('#created-checkout').replaceChildren();feedback($('#checkout-form'),'Checkout revoked.')}catch(error){feedback($('#checkout-form'),error.message,true)}}));target.append(row)}}catch(error){target.replaceChildren(node('p',error.message,{class:'feedback error'}))}
}
if($('#checkout-form')){
 const form=$('#checkout-form');checkoutRows();priceDisplay();loadCheckouts()
 form.addEventListener('input',event=>{if(event.target.name!=='fareConfirmed')dirty();priceDisplay();overview()})
 form.elements.currency.addEventListener('change',()=>{$('#exchange-field').hidden=form.elements.currency.value!=='UZS';form.elements.exchangeRate.required=form.elements.currency.value==='UZS';priceDisplay()})
 form.elements.tripType.addEventListener('change',()=>{const kind=form.elements.tripType.value;if(kind==='one-way')state.journeys=state.journeys.slice(0,1);else if(state.journeys.length<2){const first=state.journeys[0].legs[0];const last=state.journeys[0].legs.at(-1);state.journeys.push({legs:[{...emptyLeg(),from:last.to,to:first.from,fromCity:last.toCity,toCity:first.fromCity,cabin:last.cabin}]})}if(kind==='round-trip')state.journeys=state.journeys.slice(0,2);checkoutRows();dirty()})
 $('#add-checkout-city').addEventListener('click',()=>{if(state.journeys.length>=6)return;state.journeys.push({legs:[emptyLeg()]});checkoutRows();dirty()})
 $$('[data-add-baggage]').forEach(value=>value.addEventListener('click',()=>{if(state.baggage.length>=20)return;state.baggage.push({type:value.dataset.addBaggage,allowance:'',appliesTo:''});baggageRows();dirty()}))
 $('#refresh-checkouts').addEventListener('click',loadCheckouts)
 submit(form,async()=>{if(!state.selected)throw new Error('Choose a priced fare from ticket search first.');state.requestId ||= crypto.randomUUID();const data=Object.fromEntries(new FormData(form));Object.assign(data,{journeys:state.journeys,baggage:state.baggage,quoteReference:state.selected.flight.quoteReference,expiryDays:Number(data.expiryDays),fareConfirmed:form.elements.fareConfirmed.checked,requestId:state.requestId});const result=await api(`/office/api/leads/${lead.clientId}/checkouts`,'POST',data);state.requestId=null;const target=$('#created-checkout');target.replaceChildren();const box=node('div',null,{class:'created-checkout'});box.append(node('h3','Your client’s checkout link'));shareLink(result.checkout,box);target.append(box);feedback(form,'Checkout created. Copy the private link and share it with this client.');await loadCheckouts();if($('#pnr-dialog')?.open)closeDialog($('#pnr-dialog'));target.scrollIntoView({behavior:'smooth'})})
}

// Telegram operations are performed only by explicit staff actions.
submit($('#telegram-reply'),async()=>{const form=$('#telegram-reply');form.dataset.requestId ||= crypto.randomUUID();await api(`/office/api/telegram/chats/${form.dataset.chat}/reply`,'POST',{text:form.elements.text.value,requestId:form.dataset.requestId});delete form.dataset.requestId;form.reset();feedback(form,'Reply queued. The Telegram worker will deliver it; refresh to check status.')})
$('#telegram-reply textarea')?.addEventListener('input',()=>delete $('#telegram-reply').dataset.requestId)
submit($('#link-chat-form'),async()=>{const form=$('#link-chat-form');await api(`/office/api/telegram/chats/${form.dataset.chat}/link`,'PUT',{clientId:form.elements.clientId.value||null});location.reload()})
$$('[data-retry-message]').forEach(value=>value.addEventListener('click',async()=>{const uncertain=value.dataset.uncertain==='unknown';if(uncertain&&!confirm('Check the Telegram conversation first. This message may already have been sent. Send it again?'))return;try{await api(`/office/api/telegram/messages/${value.dataset.retryMessage}/retry`,'POST',{confirmUncertain:uncertain});location.reload()}catch(error){alert(error.message)}}))
$('[data-telegram-connect]')?.addEventListener('click',async()=>{try{await api('/office/api/telegram/connect','POST',{});$('#integration-feedback').textContent='Webhook connected.'}catch(error){$('#integration-feedback').textContent=error.message}})
$('[data-telegram-check]')?.addEventListener('click',async()=>{try{const result=await api('/office/api/telegram/webhook');$('#integration-feedback').textContent=`${result.configuredForThisServer?'Connected to this server':'Not connected to this server'} · ${result.pendingUpdates} updates waiting${result.lastError?' · Telegram reported a delivery error':''}`}catch(error){$('#integration-feedback').textContent=error.message}})
