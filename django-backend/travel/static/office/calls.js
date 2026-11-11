// Optional, permission-gated, visible-tab polling. Never invokes the global loader.
const configNode=document.getElementById('phone-bridge-data')
if(configNode){
 const config=JSON.parse(configNode.textContent),target=document.getElementById('phone-call-alert')
 let cursor='',timer,request,stopped=false,shownId='',dismissed=''
 const text=(tag,value)=>{const node=document.createElement(tag);node.textContent=value;return node}
 function show(call){
  if(call.direction!=='incoming')return
  if(call.status!=='ringing'){if(shownId===call.id)target.hidden=true;return}
  if(call.id===dismissed||Date.parse(call.reportedAt)<Date.now()-120000)return
  shownId=call.id;target.replaceChildren(text('p','Incoming call reported by your phone'),text('h3',call.name||call.number||'Private / unavailable number'),text('p',call.ambiguous?'Several client records use this number. Open the directory to choose.':call.clientId?`Client #${call.clientId}`:'No linked client'))
  if(call.clientId){const link=text('a','Open client →');link.className='button primary';link.href=config.workspaceUrl+'?section=leads&lead='+encodeURIComponent(call.clientId);target.append(link)}else if(call.ambiguous&&config.canViewClients){const link=text('a','Find matching clients →');link.className='button primary';link.href=config.workspaceUrl+'?section=leads&q='+encodeURIComponent(call.number);target.append(link)}
  const close=text('button','Dismiss');close.type='button';close.className='button secondary';close.addEventListener('click',()=>{dismissed=call.id;target.hidden=true});target.append(close);target.hidden=false
 }
 async function poll(){
  if(stopped||!config.enabled||document.hidden||request)return
  request=new AbortController();const current=request,deadline=setTimeout(()=>current.abort(),12000)
  try{
   const response=await fetch('/office/api/calls/recent'+(cursor?'?after='+encodeURIComponent(cursor):''),{signal:current.signal,credentials:'same-origin',cache:'no-store'})
   if([401,403].includes(response.status)){stopped=true;return}
   if(!response.ok)return
   const body=await response.json();if(!Array.isArray(body.calls))return
   // Process in chronological order so a terminal update can dismiss the old alert.
   [...body.calls].reverse().forEach(show);cursor=body.cursor
  }catch{/* Network loss does not block or repeatedly interrupt the CRM. */}
  finally{clearTimeout(deadline);request=null;if(!stopped&&!document.hidden)timer=setTimeout(poll,5000)}
 }
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(document.hidden)request?.abort();else poll()})
 window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer);request?.abort()})
 window.addEventListener('pageshow',event=>{if(event.persisted){stopped=false;cursor='';poll()}})
 if(config.enabled)poll()
}
