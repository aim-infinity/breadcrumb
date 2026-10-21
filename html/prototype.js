(async function boot(){
'use strict';
const $=id=>document.getElementById(id), data=window.__BREADCRUMB_HTML__;
if(!data?.screens?.length){$('status').textContent='No HTML captures available. Record again with Capture editable HTML prototype enabled.';return}
const screens=new Map(data.screens.map(s=>[s.id,s]));
let journey=data.flows[0], current=data.screens[0].id, mode='explore', trail=[], selected='', nonce='', complete=false;
const mappings=structuredClone(data.mappings||{}), fieldStates={};
const frame=$('frame');
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o}
$('flows').replaceChildren(...data.flows.map(f=>option(f.id,f.name)));
$('screens').replaceChildren(...data.screens.map(s=>option(s.id,s.title)));
$('destination').replaceChildren(option('','Choose a destination'),...data.screens.map(s=>option(s.id,s.title)),option('__back','Go back'));
// Only inert, approved markup enters the sandbox; original scripts, handlers, forms and navigation are stripped.
function sanitize(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const allowed=new Set('body form div span p a button input textarea select option optgroup label fieldset legend section article aside header footer main nav h1 h2 h3 h4 h5 h6 ul ol li table thead tbody tfoot tr th td caption colgroup col br hr strong em b i small pre code blockquote img details summary dialog svg path circle rect line polyline polygon ellipse g defs clippath'.split(' '));
 const attrs=new Set(['style','data-bc-id','alt','title','role','aria-label','placeholder','type','multiple','rows','cols','min','max','step','disabled','open','viewbox','d','fill','stroke','stroke-width','points','cx','cy','r','x','y','width','height','colspan','rowspan']);
 for(const el of [...doc.body.querySelectorAll('*')]){
  if(!allowed.has(el.localName.toLowerCase())){el.remove();continue}
  for(const a of [...el.attributes])if(!attrs.has(a.name.toLowerCase())&&a.name!=='src')el.removeAttribute(a.name);
  if(el.hasAttribute('src')){const src=el.getAttribute('src');if(el.localName!=='img'||!/^https?:\/\//i.test(src)&&!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(src))el.removeAttribute('src');else el.setAttribute('referrerpolicy','no-referrer')}
  if(el.localName==='input'){el.removeAttribute('value');if(['password','file','hidden'].includes(el.getAttribute('type')))el.setAttribute('disabled','')}
  if(el.localName==='textarea')el.textContent='';
  if(el.localName==='button')el.setAttribute('type','button');
 }
 // The body itself is not trusted either.
 for(const a of [...doc.body.attributes])if(a.name!=='style'&&a.name!=='data-bc-id')doc.body.removeAttribute(a.name);
 return doc.body.outerHTML;
}
function bridge(){
 const cfg=JSON.parse(document.getElementById('bc-config').textContent);
 const send=(type,extra={})=>parent.postMessage({bc:cfg.nonce,type,...extra},'*');
 for(const el of document.querySelectorAll('input,textarea,select')) {
  const prior=cfg.fields[el.getAttribute('data-bc-id')];
  if(prior){el.value=prior.value;if('checked' in el)el.checked=prior.checked}
 }
 document.addEventListener('input',e=>{const el=e.target;if(el.matches('input:not([type=password]):not([type=file]),textarea,select'))send('input',{id:el.getAttribute('data-bc-id'),value:el.value.slice(0,10000),checked:!!el.checked})},true);
 document.addEventListener('submit' ,e=>e.preventDefault(),true);
 document.addEventListener('click',e=>{
  const el=e.target.closest('[data-bc-id]');if(!el)return;
  const actionable=e.target.closest('button,a,input,textarea,select,summary,[role="button"]')||el;
  const chosen=actionable;
  const id=chosen.getAttribute('data-bc-id');
  if(cfg.mode==='map'){e.preventDefault();e.stopImmediatePropagation();send('select',{id});return}
  const mapped=cfg.connections[id];
  if(mapped){e.preventDefault();send('navigate',{to:mapped});return}
  if(actionable.matches('a,button,[role="button"]')){e.preventDefault();send('unmapped')}
 },true);
 if(cfg.mode==='guide'){
  const el=[...document.querySelectorAll('[data-bc-id]')].find(e=>e.getAttribute('data-bc-id')===cfg.targetId);
  if(el){el.style.outline='3px solid #8baf41';el.style.outlineOffset='3px';el.scrollIntoView({block:'center'})}
 }
 if(cfg.mode==='map')document.body.style.cursor='crosshair';
}
const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c');
function render(){
 const s=screens.get(current);selected='';$('save').disabled=true;$('remove').disabled=true;$('selected').value='';$('saved').textContent='';$('status').textContent='';
 $('mapping').hidden=mode!=='map';$('map').classList.toggle('active',mode==='map');$('explore').classList.toggle('active',mode==='explore');$('guide').classList.toggle('active',mode==='guide');
 $('screens').value=current;$('flows').value=journey.id;$('back').disabled=!trail.length;
 $('instruction').textContent=mode==='guide'?(complete?'Journey complete. Explore freely or select another journey.':s.instruction):mode==='map'?'Choose any element to connect it to another captured state.':'Native inputs work. Connected elements navigate between captured states.';
 $('next').hidden=mode!=='guide';$('next').disabled=complete;
 nonce=crypto.randomUUID().replaceAll('-','');
 const config={fields:fieldStates[current]||{},nonce,mode,targetId:s.targetId,connections:mappings[current]||{}};
 frame.srcdoc=`<!doctype html><html><head><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src https: http: data:; font-src 'none'; form-action 'none'; base-uri 'none'; connect-src 'none'"><style>body{margin:0}*{box-sizing:border-box}</style></head>${sanitize(s.html)}<script id="bc-config" type="application/json">${safe(config)}</script><script nonce="${nonce}">(${bridge.toString()})()<\/script></html>`;
}
function go(id,push=true){if(!screens.has(id))return;if(push)trail.push(current);current=id;if(!journey.screens.includes(id))journey=data.flows.find(f=>f.screens.includes(id))||journey;complete=false;render()}
function back(){if(trail.length)go(trail.pop(),false)}
window.addEventListener('message',e=>{
 if(e.source!==frame.contentWindow||e.data?.bc!==nonce)return;
 if(e.data.type==='input'&&/^el-\d+$/.test(e.data.id)&&typeof e.data.value==='string'){fieldStates[current]??={};fieldStates[current][e.data.id]={value:e.data.value.slice(0,10000),checked:!!e.data.checked}}
 if(e.data.type==='select'&&mode==='map'&&/^el-\d+$/.test(e.data.id)){selected=e.data.id;$('save').disabled=false;$('remove').disabled=false;$('selected').value=selected;$('destination').value=mappings[current]?.[selected]||''}
 if(e.data.type==='navigate'&&mode!=='map'){if(e.data.to==='__back')back();else go(e.data.to)}
 if(e.data.type==='unmapped')$('status').textContent='No interaction mapped here yet. Use Map interactions to connect it.';
});
$('save').onclick=()=>{const to=$('destination').value;if(!selected||!to)return; mappings[current]??={};mappings[current][selected]=to;$('saved').textContent='Connection saved in this session. Export to keep it.'};
$('remove').onclick=()=>{if(selected&&mappings[current])delete mappings[current][selected];$('saved').textContent='Connection removed.'};
for(const [id,m] of [['explore','explore'],['guide','guide'],['map','map']])$(id).onclick=()=>{mode=m;complete=false;render()};
$('back').onclick=back;$('screens').onchange=()=>go($('screens').value);$('flows').onchange=()=>{journey=data.flows.find(f=>f.id===$('flows').value);go(journey.screens[0])};
$('next').onclick=()=>{const f=journey,i=f.screens.indexOf(current);if(i+1<f.screens.length)go(f.screens[i+1]);else{complete=true;$('instruction').textContent='Journey complete. Explore freely or select another journey.';$('next').disabled=true}};
$('download').onclick=async()=>{
 try{
 const css=document.querySelector('style[data-bc-shell]')?.textContent || await (await fetch('prototype.css')).text();
 const clone=document.documentElement.cloneNode(true);clone.querySelectorAll('script,link').forEach(e=>e.remove());clone.querySelector('iframe').removeAttribute('srcdoc');
 const style=document.createElement('style');style.textContent=css;style.dataset.bcShell='';clone.querySelector('head').append(style);
 const payload=document.createElement('script');payload.textContent=`window.__BREADCRUMB_HTML__=${safe({...data,mappings})};(${boot.toString()})();`;
 payload.textContent=payload.textContent.replace(/<\/script/gi,'<\\/script');
 clone.querySelector('body').append(payload);
 const url=URL.createObjectURL(new Blob(['<!doctype html>'+clone.outerHTML],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='breadcrumb-prototype.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){$('status').textContent='Export failed: '+e.message}
};
render();
})();
