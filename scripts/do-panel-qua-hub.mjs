// do-qua-hub.mjs - bam tung the tren panel tong (nhu nguoi dung bam), cho panel tool mo, do, roi dong lai panel do.
// Khong dung gi toi project / sequence: chi mo panel, doc trang thai, dong panel.
const HUB = 8101;
const TOOL = [ // ten tren the, cong go loi, mot ham host de thu
  ['Autocut', 8089, 'ac_seqInSec'],
  ['Auto Podcast', 8094, 'pc_err'],
  ['Auto Short Viral', 8100, 'sv__sach'],
  ['Auto Re-Frames', 8092, 'rf_err'],
  ['Transcripts', 8091, 'ac_seqInSec'],
  ['Auto Guideline Frame', 8096, 'gf_laySeq_'],
  ['Asset Manager', 8088, 'ppro_check'],
  ['Power Bins', 8090, 'ppro_check'],
  ['Video Download', 8098, 'vd__chuan'],
  ['Music & SFX', 8097, 'mus_sequenceInfo'],
];
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

async function trang(cong) {
  try {
    const r = await fetch('http://127.0.0.1:' + cong + '/json', { signal: AbortSignal.timeout(1500) });
    const ds = await r.json();
    return ds.find((t) => t.type === 'page' && t.webSocketDebuggerUrl) || ds.find((t) => t.webSocketDebuggerUrl) || null;
  } catch (e) { return null; }
}
async function song(cong) {
  try { await fetch('http://127.0.0.1:' + cong + '/json/version', { signal: AbortSignal.timeout(1000) }); return true; } catch (e) { return false; }
}
async function chay(cong, bieuThuc, hetGio = 15000) {
  const t = await trang(cong);
  if (!t) return { loi: 'khong noi duoc cong ' + cong };
  return await new Promise((res) => {
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    const het = setTimeout(() => { try { ws.close(); } catch (e) {} res({ loi: 'het gio ' + hetGio + ' ms' }); }, hetGio);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: bieuThuc, awaitPromise: true, returnByValue: true } }));
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data); if (m.id !== 1) return;
      clearTimeout(het); ws.close();
      if (m.result && m.result.exceptionDetails) res({ loi: 'loi JS: ' + JSON.stringify(m.result.exceptionDetails).slice(0, 200) });
      else res({ gt: m.result && m.result.result ? m.result.result.value : undefined });
    };
    ws.onerror = () => { clearTimeout(het); res({ loi: 'loi websocket' }); };
  });
}

const doPanel = (ham) => `(async () => {
  const hoi = (ma) => new Promise((res) => { let xong = false; const t0 = Date.now(); setTimeout(() => { if (!xong) res('HET GIO 6s'); }, 6000);
    try { window.__adobe_cep__.evalScript(ma, (r) => { xong = true; res(String(r) + ' (' + (Date.now() - t0) + ' ms)'); }); } catch (e) { res('LOI ' + e.message); } });
  const chu = (document.body.innerText || '').replace(/\\s+/g, ' ').trim();
  const kq = { ready: document.readyState, soThe: document.body.querySelectorAll('*').length, soChu: chu.length,
    dau: chu.slice(0, 70), coLoi: /EvalScript error|is not defined|Cannot read|undefined is not|ENOENT|khong tim thay|không tìm thấy/i.test(chu) ? (chu.match(/.{0,40}(EvalScript error|is not defined|Cannot read|ENOENT|không tìm thấy).{0,60}/i) || [''])[0] : '' };
  kq.host = await hoi('app.version');
  kq.ham = await hoi('typeof ${ham}');
  return JSON.stringify(kq);
})()`;

// 0. panel tong dang hien gi
const hub = await chay(HUB, `JSON.stringify({ nut: Array.from(document.querySelectorAll('button[data-i]')).map((b) => ({ i: b.getAttribute('data-i'), ten: (b.getAttribute('aria-label') || b.getAttribute('title') || b.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 90) })), chuaCai: (document.body.innerText.match(/Chưa cài|Not installed/g) || []).length, rong: window.innerWidth, cao: window.innerHeight })`);
if (hub.loi) { console.log('Panel tong (8101) khong tra loi: ' + hub.loi); process.exit(1); }
const H = JSON.parse(hub.gt);
console.log('PANEL TONG: ' + H.rong + 'x' + H.cao + ' | ' + H.nut.length + ' the | nhan "Chua cai": ' + H.chuaCai);
for (const n of H.nut) console.log('   the ' + n.i + ': ' + n.ten);

let dat = 0, tong = 0;
for (const [ten, cong, ham] of TOOL) {
  tong++;
  const nut = H.nut.find((n) => n.ten.toLowerCase().includes(ten.toLowerCase()));
  if (!nut) { console.log('[TRUOT] ' + ten + ': khong thay the tren panel tong'); continue; }
  const daMo = await song(cong);
  const t0 = Date.now();
  if (!daMo) {
    const b = await chay(HUB, `(() => { const b = document.querySelector('button[data-i="${nut.i}"]'); if (!b) return 'KHONG THAY NUT'; b.click(); return 'ok'; })()`);
    if (b.loi || b.gt !== 'ok') { console.log('[TRUOT] ' + ten + ': bam the khong duoc (' + (b.loi || b.gt) + ')'); continue; }
  }
  let mo = daMo;
  for (let k = 0; k < 80 && !mo; k++) { await ngu(250); mo = await song(cong); }
  const msMo = Date.now() - t0;
  if (!mo) { console.log('[TRUOT] ' + ten + ' (' + cong + '): bam the roi nhung 20 s sau panel chua mo'); continue; }
  await ngu(2500); // cho giao dien cua panel dung xong
  const k = await chay(cong, doPanel(ham), 25000);
  let dong = 'de nguyen (da mo san tu truoc)';
  if (!daMo) { // panel do script mo thi script dong lai
    await chay(cong, `(() => { try { window.__adobe_cep__.closeExtension(); } catch (e) {} return 'x'; })()`, 3000);
    let con = true; for (let j = 0; j < 20 && con; j++) { await ngu(250); con = await song(cong); }
    dong = con ? 'CHUA dong duoc' : 'da dong lai';
  }
  if (k.loi) { console.log('[TRUOT] ' + ten + ' (' + cong + '): ' + k.loi + ' | ' + dong); continue; }
  const p = JSON.parse(k.gt);
  const ok = p.ready === 'complete' && p.soThe > 20 && /^\d+\.\d+/.test(p.host) && /^function/.test(p.ham) && !p.coLoi;
  if (ok) dat++;
  console.log((ok ? '[DAT ] ' : '[TRUOT] ') + ten + ' (' + cong + '): ' + (daMo ? 'da mo san' : 'mo sau ' + msMo + ' ms') + ' | ' + p.soThe + ' the, ' + p.soChu + ' ky tu | "' + p.dau + '" | host ' + p.host + ' | ham ' + p.ham + (p.coLoi ? ' | CHU LOI: ' + p.coLoi : '') + ' | ' + dong);
}
console.log('KET QUA: ' + dat + '/' + tong + ' panel mo tu the va tra loi dung');
