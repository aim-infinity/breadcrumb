(async()=>{
const $=id=>document.getElementById(id);
try{
const response=await fetch('prototype.json');if(!response.ok)throw Error('Unable to load prototype');
const data=await response.json(), flows=data.flows.filter(f=>f.screens.length), nodes=new Map(data.screens.map(s=>[s.id,s]));
let flow=flows.find(f=>f.name==='Test flow')||flows[0], current=flow.screens[0], mode='explore', history=[], completed=false;
const drafts=new Map();
$('original').href=data.original;
function url(){location.hash=new URLSearchParams({screen:current,mode}).toString()}
function open(id,push=true){if(!nodes.has(id))return;if(push&&id!==current)history.push(current);current=id;flow=flows.find(f=>f.screens.includes(id));completed=false;url();render()}
function box(el,r,v){Object.assign(el.style,{left:r.x/v.w*100+'%',top:r.y/v.h*100+'%',width:r.w/v.w*100+'%',height:r.h/v.h*100+'%'})}
function button(text,action){const b=document.createElement('button');b.textContent=text;b.onclick=action;return b}
function advance(){const index=flow.screens.indexOf(current);if(index<flow.screens.length-1)open(flow.screens[index+1]);else{completed=true;render();$('notice').textContent='End of this recording. You can explore another screen or open the original app.'}}
function render(){
const s=nodes.get(current),index=flow.screens.indexOf(current);$('position').textContent=`Screen ${index+1} / ${flow.screens.length}`;
$('back').disabled=!history.length;$('explore').classList.toggle('active',mode==='explore');$('guided').classList.toggle('active',mode==='guided');
$('flows').replaceChildren(...flows.map(f=>{const b=button(`${f.name} · ${f.screens.length} screens`,()=>open(f.screens[0]));b.classList.toggle('active',f.id===flow.id);return b}));
$('count').textContent=flow.screens.length;
$('screens').replaceChildren(...flow.screens.map((id,i)=>{const b=button(`${i+1}. ${nodes.get(id).title}`,()=>open(id));b.classList.toggle('active',id===current);return b}));
const stage=$('stage');stage.replaceChildren();stage.classList.toggle('show',$('hints').checked);
const img=document.createElement('img');img.src=s.image;img.alt=`Captured screen: ${s.title}`;img.onclick=()=>{$('notice').textContent='This area wasn’t connected in the recording. Use a highlighted area, the screen list, or Open original.'};stage.append(img);
for(const [i,h] of s.hotspots.entries()){
 if(s.kind==='input'&&i===0){const input=document.createElement('textarea');input.className='draft';input.setAttribute('aria-label','Try entering an agent description');input.placeholder='Try typing here — prototype only';input.value=drafts.get(current)||'';input.oninput=()=>drafts.set(current,input.value);box(input,h.rect,s.viewport);stage.append(input);continue}
 const b=button('',()=>h.to?open(h.to):advance());b.className='hotspot';b.setAttribute('aria-label',h.label);b.title=h.label;box(b,h.rect,s.viewport);stage.append(b);
}
$('guide').replaceChildren();$('notice').textContent='';
if(mode==='guided'||s.kind==='input'||completed){const text=document.createElement('div'),small=document.createElement('small'),title=document.createElement('h3'),p=document.createElement('p');small.textContent=mode==='guided'?`GUIDED FLOW · ${index+1} OF ${flow.screens.length}`:'EXPLORE THE PROTOTYPE';title.textContent=completed?'Journey complete':s.title;p.textContent=completed?'Explore any captured screen or choose another journey.':s.kind==='input'?'Type a sample description, then continue. Your text stays in this browser session.':s.instruction;text.append(small,title,p);$('guide').append(text,button(completed?'Start again':index===flow.screens.length-1?'Finish journey':'Continue',()=>completed?open(flow.screens[0]):advance()))}
}
$('explore').onclick=()=>{mode='explore';completed=false;url();render()};$('guided').onclick=()=>{mode='guided';url();render()};$('home').onclick=()=>open(flow.screens[0]);$('back').onclick=()=>{const id=history.pop();if(id)open(id,false)};$('hints').onchange=()=>render();
function readHash(){const p=new URLSearchParams(location.hash.slice(1));mode=p.get('mode')==='guided'?'guided':'explore';if(nodes.has(p.get('screen'))){current=p.get('screen');flow=flows.find(f=>f.screens.includes(current))}render()}
window.addEventListener('hashchange',readHash);readHash();
}catch(e){$('notice').textContent=e.message}
})();
