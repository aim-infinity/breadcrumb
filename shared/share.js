let pkg, available = false, loadError = '';
const status = document.getElementById('status'), button = document.getElementById('open');
function ready() { button.disabled = !(pkg && available); }
function showStatus() { status.textContent = loadError || (available ? 'Walkthrough is connected.' : 'Open this page in Chrome with the updated Walkthrough extension installed, then refresh.'); ready(); }
window.addEventListener('message', event => {
  if (event.source !== window || event.origin !== location.origin) return;
  if (event.data?.type === 'walkthrough:available') { available = true; showStatus(); }
  if (event.data?.type === 'walkthrough:opened') { status.textContent = event.data.ok ? 'Opened in Walkthrough. Click Start live walkthrough there.' : event.data.error; ready(); }
});
window.postMessage({ type: 'breadcrumb:detect' }, location.origin);
setTimeout(() => { if (!available) showStatus(); }, 2500);
async function decodeFlow(hash) {
  const encoded = new URLSearchParams(hash.slice(1)).get('flow');
  if (!encoded || !encoded.startsWith('v1.') || encoded.length > 60000 || !/^[A-Za-z0-9_-]+$/.test(encoded.slice(3))) throw Error('This share link is invalid or incomplete. Ask the author to copy the full link again.');
  const binary = atob(encoded.slice(3).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 900000) throw Error('This flow is too large to open.'); chunks.push(value); }
  } finally { await reader.cancel(); }
  return JSON.parse(await new Blob(chunks).text());
}
async function load() {
  pkg = undefined; loadError = ''; ready();
  document.getElementById('original').removeAttribute('href');
  try {
    const data = location.hash ? await decodeFlow(location.hash) : await fetch('test-flow.json').then(r => { if (!r.ok) throw Error('Could not load this flow.'); return r.json(); });
    if (data.format !== 'walkthrough-package' || data.version !== 1 || !Array.isArray(data.flows) || data.flows.length !== 1 || !data.flows[0].steps?.length) throw Error('This link does not contain a valid flow.');
    const start = new URL(data.flows[0].startUrl);
    const project = new URL(data.project.url);
    if (!['http:', 'https:'].includes(start.protocol) || start.origin !== project.origin) throw Error('This flow has an invalid website address.');
    pkg = data;
    document.getElementById('title').textContent = data.flows[0].name;
    document.title = `${data.flows[0].name} · Shared Walkthrough`;
    document.getElementById('summary').textContent = `${data.flows[0].steps.length} steps · ${start.hostname}`;
    document.getElementById('original').href = start.href;
    showStatus();
  } catch (e) { loadError = `Could not open this flow. ${e.message}`; document.getElementById('title').textContent = 'Link could not be opened'; document.getElementById('summary').textContent = ''; showStatus(); }
}
window.addEventListener('hashchange', load);
load();
button.onclick = () => { if (!pkg || !available) return; button.disabled = true; status.textContent = 'Opening Walkthrough…'; window.postMessage({ type: 'breadcrumb:open-shared', pkg }, location.origin); };
