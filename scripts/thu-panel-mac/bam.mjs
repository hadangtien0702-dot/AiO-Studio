// bam.mjs <panel> <chu tren nut | -> [giay theo doi] [regex dung]: bam nut (click that) roi theo doi chu + nut cua panel.
import { chay, CONG, ngu } from './lib.mjs';
const [ten, chuNut, giay = '120', dung = ''] = process.argv.slice(2);
const cong = CONG[ten] || Number(ten);
const tt = async () => JSON.parse(await chay(cong, `JSON.stringify({ chu: (document.body.innerText || '').replace(/\\s+/g, ' ').trim(), nut: Array.from(document.querySelectorAll('button')).filter((e) => e.offsetParent !== null).map((e) => (e.disabled ? '[tat]' : '') + (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 34)) })`));
if (chuNut !== '-') {
  const kq = await chay(cong, `(() => { const ds = Array.from(document.querySelectorAll('button')).filter((e) => e.offsetParent !== null); const b = ds.find((e) => (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim() === ${JSON.stringify(chuNut)}) || ds.find((e) => (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().startsWith(${JSON.stringify(chuNut)})); if (!b) return 'KHONG THAY NUT'; if (b.disabled) return 'NUT DANG TAT'; b.click(); return 'da bam: ' + (b.innerText || '').replace(/\\s+/g, ' ').trim(); })()`);
  console.log('[0.0 s] ' + kq);
  if (!kq.startsWith('da bam')) process.exit(1);
}
const t0 = Date.now(); let cu = ''; const re = dung ? new RegExp(dung, 'i') : null;
while ((Date.now() - t0) / 1000 < Number(giay)) {
  await ngu(1500);
  let s; try { s = await tt(); } catch (e) { console.log('[' + ((Date.now() - t0) / 1000).toFixed(1) + ' s] KHONG DOC DUOC: ' + e.message); continue; }
  const dau = s.chu.indexOf('Kết quả') >= 0 ? s.chu.slice(s.chu.indexOf('Kết quả')) : s.chu.slice(-260);
  const moi = dau.slice(0, 330) + ' || NUT: ' + s.nut.join(' · ');
  const khoa = moi.replace(/\d+:\d\d/g, "T").replace(/\d+%/g, "P").replace(/\d+[.,]?\d*\s*s\b/g, "S");
  if (khoa !== cu) { console.log('[' + ((Date.now() - t0) / 1000).toFixed(1) + ' s] ' + moi); cu = khoa; }
  if (re && re.test(s.chu)) { console.log('[' + ((Date.now() - t0) / 1000).toFixed(1) + ' s] GAP MOC DUNG /' + dung + '/'); break; }
}
