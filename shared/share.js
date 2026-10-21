let pkg,available=false;
const status=document.getElementById('status'),button=document.getElementById('open');
function ready(){button.disabled=!(pkg&&available)}
window.addEventListener('message',event=>{
 if(event.source!==window||event.origin!==location.origin)return;
 if(event.data?.type==='walkthrough:available'){available=true;status.textContent='Walkthrough is connected.';ready()}
 if(event.data?.type==='walkthrough:opened'){status.textContent=event.data.ok?'Opened in Walkthrough. Click Start live walkthrough there.':event.data.error;ready()}
});
window.postMessage({type:'breadcrumb:detect'},location.origin);
setTimeout(()=>{if(!available)status.textContent='Install or reload the updated Walkthrough extension, then refresh this page. This test requires the extension.'},2500);
fetch('test-flow.json').then(r=>{if(!r.ok)throw Error('Could not load this flow.');return r.json()}).then(data=>{pkg=data;document.getElementById('title').textContent=data.flows[0].name;document.getElementById('summary').textContent=data.flows[0].steps.length+' steps · '+new URL(data.project.url).hostname;document.getElementById('original').href=data.project.url;ready()}).catch(e=>status.textContent=e.message);
button.onclick=()=>{button.disabled=true;status.textContent='Opening Walkthrough…';window.postMessage({type:'breadcrumb:open-shared',pkg},location.origin)};
