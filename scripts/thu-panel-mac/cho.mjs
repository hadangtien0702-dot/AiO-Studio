// cho.mjs <panel> <chu nut> <giay>: cho toi khi nut do BAT (khong con disabled)
import { chay, CONG, ngu } from './lib.mjs';
const [ten, chuNut, giay = '40'] = process.argv.slice(2); const t0 = Date.now();
while ((Date.now() - t0) / 1000 < Number(giay)) {
  const k = await chay(CONG[ten], `(() => { const b = Array.from(document.querySelectorAll('button')).filter((e) => e.offsetParent !== null).find((e) => (e.innerText || '').replace(/\\s+/g, ' ').trim().startsWith(${JSON.stringify(chuNut)})); return b ? (b.disabled ? 'tat' : 'bat') : 'khong thay'; })()`);
  if (k === 'bat') { console.log('nut "' + chuNut + '" bat sau ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); process.exit(0); }
  await ngu(700);
}
console.log('HET GIO: nut "' + chuNut + '" chua bat sau ' + giay + ' s'); process.exit(1);
