// bamid.mjs <panel> <css selector> [giay]: bam phan tu theo selector roi in chu nut do + thong bao
import { chay, CONG, ngu } from './lib.mjs';
const [ten, sel, giay = '4'] = process.argv.slice(2); const c = CONG[ten];
const t0 = Date.now();
console.log(await chay(c, `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return 'KHONG THAY ' + ${JSON.stringify(sel)}; if (b.disabled) return 'DANG TAT'; const truoc = (b.innerText || '').replace(/\\s+/g, ' ').trim(); b.click(); return 'da bam [' + truoc + ']'; })()`));
await ngu(Number(giay) * 1000);
console.log('sau ' + giay + ' s: nut = [' + await chay(c, `(() => { const b = document.querySelector(${JSON.stringify(sel)}); return b ? (b.innerText || '').replace(/\\s+/g, ' ').trim() + (b.disabled ? ' (tat)' : '') : 'mat'; })()`) + '] | cuoi trang: ' + (await chay(c, `(document.body.innerText || '').replace(/\\s+/g, ' ').trim().slice(-170)`)));
