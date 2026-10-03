import { chay, moPanel, dongPanel, song, CONG, HUB, ngu } from '../lib.mjs';
import fs from 'node:fs'; import os from 'node:os';
const F = os.homedir() + '/Library/Application Support/AiOStudio/ngonngu.json';
let ds = ['videodownload', 'guideframe', 'autocut', 'podcast'];
for (const t of ds) { try { const m = await moPanel(t); console.log('mo ' + t + ': ' + (m.daMoSan ? 'da mo san' : m.ms + ' ms')); } catch (e) { console.log('mo ' + t + ' LOI: ' + e.message); } }
await ngu(2000); { const con = []; for (const t of ds) if (await song(CONG[t])) con.push(t); else console.log('!! ' + t + ' khong con mo sau 2 s'); ds = con; }
const dau = async (t) => (await chay(CONG[t], `(document.body.innerText || '').replace(/\\s+/g, ' ').trim()`)).slice(0, 4000);
const tiengViet = (s) => (s.match(/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi) || []).length;
const do1 = async (nhan) => { const r = {}; for (const t of ds) { const s = await dau(t); r[t] = tiengViet(s) + ' ky tu co dau / ' + s.length; } console.log(nhan + ': file = ' + fs.readFileSync(F, 'utf8').trim() + ' | ' + JSON.stringify(r)); };
await do1('TRUOC (VI)');
console.log('bam nut ngon ngu tren panel tong: ' + await chay(HUB, `(() => { const b = document.querySelector('#nut-lang'); b.click(); return 'da bam, nut gio la [' + (document.querySelector('#nut-lang').innerText || '').trim() + ']'; })()`));
await ngu(3500);
await do1('SAU 3,5 s (EN)');
for (const t of ds) { const s = await dau(t); const sot = (s.match(/[A-Za-zÀ-ỹ][^.·|]{0,24}[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ][^.·|]{0,24}/gi) || []).slice(0, 4); if (sot.length) console.log('  chu Viet con sot tren ' + t + ' (ban EN): ' + sot.map((x) => x.trim()).join(' | ')); }
console.log('tra lai tieng Viet: ' + await chay(HUB, `(() => { const b = document.querySelector('#nut-lang'); b.click(); return '[' + (document.querySelector('#nut-lang').innerText || '').trim() + ']'; })()`));
await ngu(3500);
await do1('TRA LAI (VI)');
for (const t of ds) await dongPanel(t);
