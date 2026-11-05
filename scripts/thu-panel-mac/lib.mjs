// lib.mjs - do panel AiO trong Premiere qua cong go loi CEP (CDP). Dung chung cho cac bai thu 04/10.
import fs from 'node:fs';
export const HUB = 8101;
export const CONG = { autocut: 8089, podcast: 8094, shortviral: 8100, reframe: 8092, transcript: 8091, guideframe: 8096,
  assetmanager: 8088, powerbin: 8090, videodownload: 8098, music: 8097 };
export const THE = { autocut: 'Autocut', podcast: 'Auto Podcast', shortviral: 'Auto Short Viral', reframe: 'Auto Re-Frames',
  transcript: 'Transcripts', guideframe: 'Auto Guideline Frame', assetmanager: 'Asset Manager', powerbin: 'Power Bins',
  videodownload: 'Video Download', music: 'Music & SFX' };
export const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

async function trang(cong) {
  try {
    const r = await fetch('http://127.0.0.1:' + cong + '/json', { signal: AbortSignal.timeout(1500) });
    const ds = await r.json();
    return ds.find((t) => t.type === 'page' && t.webSocketDebuggerUrl) || ds.find((t) => t.webSocketDebuggerUrl) || null;
  } catch (e) { return null; }
}
export async function song(cong) {
  try { await fetch('http://127.0.0.1:' + cong + '/json/version', { signal: AbortSignal.timeout(1000) }); return true; } catch (e) { return false; }
}
// Chay mot bieu thuc JS trong trang cua panel. Tra ve gia tri, nem loi neu khong noi duoc / het gio.
export async function chay(cong, bieuThuc, hetGio = 20000) {
  const t = await trang(cong);
  if (!t) throw new Error('khong noi duoc cong ' + cong + ' (panel chua mo?)');
  return await new Promise((res, rej) => {
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    const het = setTimeout(() => { try { ws.close(); } catch (e) {} rej(new Error('het gio ' + hetGio + ' ms o cong ' + cong)); }, hetGio);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: bieuThuc, awaitPromise: true, returnByValue: true } }));
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data); if (m.id !== 1) return;
      clearTimeout(het); ws.close();
      if (m.result && m.result.exceptionDetails) rej(new Error('loi JS trong panel: ' + JSON.stringify(m.result.exceptionDetails.exception || m.result.exceptionDetails).slice(0, 300)));
      else res(m.result && m.result.result ? m.result.result.value : undefined);
    };
    ws.onerror = () => { clearTimeout(het); rej(new Error('loi websocket cong ' + cong)); };
  });
}
// Chay ExtendScript trong Premiere qua cau noi cua mot panel dang mo (mac dinh panel tong). Ma boc trong ham an danh
// de khong de lai ten toan cuc nao (11 panel dung chung mot engine).
export async function es(ma, hetGio = 20000, cong = HUB) {
  const boc = '(function(){ try { ' + ma + ' } catch (e) { return "ERR_JSX:" + e + (e.line ? " dong " + e.line : ""); } })()';
  const bt = `new Promise((res) => { let xong = false; setTimeout(() => { if (!xong) res('HET_GIO_HOST'); }, ${hetGio - 1500});
    window.__adobe_cep__.evalScript(${JSON.stringify(boc)}, (r) => { xong = true; res(String(r)); }); })`;
  return await chay(cong, bt, hetGio);
}
export async function esFile(duong, hetGio = 30000, thayThe = {}) {
  let ma = fs.readFileSync(duong, 'utf8');
  for (const k of Object.keys(thayThe)) ma = ma.split(k).join(thayThe[k]);
  return await es(ma, hetGio);
}
// Bam the tren panel tong (nhu nguoi dung) roi cho cong cua panel do song.
export async function moPanel(ten) {
  const cong = CONG[ten];
  if (await song(cong)) return { daMoSan: true, ms: 0 };
  const t0 = Date.now();
  const kq = await chay(HUB, `(() => { const b = Array.from(document.querySelectorAll('button[data-i]')).find((x) => ((x.getAttribute('aria-label') || x.innerText || '').replace(/\\s+/g, ' ') + ' ').toLowerCase().includes(${JSON.stringify(THE[ten].toLowerCase() + ' ')})); if (!b) return 'KHONG THAY THE'; b.click(); return 'ok'; })()`);
  if (kq !== 'ok') throw new Error('panel tong: ' + kq + ' (' + ten + ')');
  for (let k = 0; k < 120; k++) { await ngu(250); if (await song(cong)) { await ngu(3000); return { daMoSan: false, ms: Date.now() - t0 }; } }
  throw new Error('bam the ' + ten + ' roi nhung 30 s sau panel chua mo');
}
export async function dongPanel(ten) {
  const cong = CONG[ten];
  try { await chay(cong, `(() => { try { window.__adobe_cep__.closeExtension(); } catch (e) {} return 'x'; })()`, 4000); } catch (e) {}
  for (let j = 0; j < 24; j++) { await ngu(250); if (!(await song(cong))) return true; }
  return false;
}
// Chu dang hien tren panel (gon khoang trang).
export async function chu(cong, max = 600) {
  return await chay(cong, `(document.body.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, ${max})`);
}
// Liet ke nut bam dang thay.
export async function nut(cong) {
  return await chay(cong, `JSON.stringify(Array.from(document.querySelectorAll('button, [role=button], input, select, textarea')).filter((e) => e.offsetParent !== null).map((e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.disabled ? '[tat]' : '') + ':' + ((e.getAttribute('aria-label') || e.title || e.innerText || e.placeholder || e.value || '') + '').replace(/\\s+/g, ' ').trim().slice(0, 40))))`);
}
// Chup man hinh panel -> file png
export async function chup(cong, file) {
  const t = await trang(cong);
  if (!t) throw new Error('khong noi duoc cong ' + cong);
  const d = await new Promise((res, rej) => {
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    const het = setTimeout(() => { try { ws.close(); } catch (e) {} rej(new Error('het gio chup')); }, 15000);
    ws.onopen = () => ws.send(JSON.stringify({ id: 7, method: 'Page.captureScreenshot', params: { format: 'png' } }));
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id !== 7) return; clearTimeout(het); ws.close(); m.result && m.result.data ? res(m.result.data) : rej(new Error('khong co anh')); };
    ws.onerror = () => { clearTimeout(het); rej(new Error('loi websocket')); };
  });
  fs.writeFileSync(file, Buffer.from(d, 'base64'));
  return file;
}
