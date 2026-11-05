// nghe-loi.mjs <cong> <selector nut> <giay>: nap lai trang panel, bam nut, ghi lai moi loi JS + console trong luc chay
const [cong, sel, giay = '60'] = process.argv.slice(2);
const ds = await (await fetch('http://127.0.0.1:' + cong + '/json')).json();
const t = ds.find((x) => x.type === 'page' && x.webSocketDebuggerUrl) || ds.find((x) => x.webSocketDebuggerUrl);
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const cho = new Map();
const goi = (method, params = {}) => new Promise((res) => { const i = ++id; cho.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const t0 = Date.now(); const giayNay = () => ((Date.now() - t0) / 1000).toFixed(1);
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && cho.has(m.id)) { cho.get(m.id)(m.result || m.error); cho.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; console.log('[' + giayNay() + ' s] LOI JS: ' + (d.exception && (d.exception.description || d.exception.value) || d.text).toString().slice(0, 500) + ' @dong ' + d.lineNumber); }
  if (m.method === 'Runtime.consoleAPICalled' && /error|warning/.test(m.params.type)) console.log('[' + giayNay() + ' s] console.' + m.params.type + ': ' + m.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 400));
  if (m.method === 'Log.entryAdded' && /error/.test(m.params.entry.level)) console.log('[' + giayNay() + ' s] log: ' + m.params.entry.text.slice(0, 300));
};
await new Promise((r) => (ws.onopen = r));
await goi('Runtime.enable'); await goi('Log.enable'); await goi('Page.enable');
await goi('Page.reload'); await new Promise((r) => setTimeout(r, 6000));
const ev = async (e) => (await goi('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
console.log('[' + giayNay() + ' s] sau khi nap lai: nut = ' + await ev(`(document.querySelector(${JSON.stringify(sel)}) || {}).innerText`) + ' | seq = ' + await ev(`(document.querySelector('#seqBtn') || {}).innerText`) + ' | chon = ' + await ev(`Array.from(document.querySelectorAll('select')).map((s) => s.value).join(',')`));
console.log('[' + giayNay() + ' s] ' + await ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b || b.disabled) return 'KHONG BAM DUOC'; b.click(); return 'da bam'; })()`));
let cu = '';
while ((Date.now() - t0) / 1000 < Number(giay)) {
  await new Promise((r) => setTimeout(r, 1500));
  const s = await ev(`(document.querySelector(${JSON.stringify(sel)}) || {}).innerText + ' | tat=' + (document.querySelector(${JSON.stringify(sel)}) || {}).disabled`);
  if (s !== cu) { console.log('[' + giayNay() + ' s] nut: ' + s); cu = s; }
}
ws.close(); process.exit(0);
