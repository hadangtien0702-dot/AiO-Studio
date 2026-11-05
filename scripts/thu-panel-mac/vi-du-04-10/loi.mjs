import { es } from '../lib.mjs';
import fs from 'node:fs'; import os from 'node:os';
const kq = await es(`var ss = app.project.sequences, q = null; for (var i = 0; i < ss.numSequences; i++) if (ss[i].name.indexOf('CL04 autocut - autocut') === 0) q = ss[i]; if (!q) return 'KHONG THAY'; var t = q.videoTracks[0], r = []; for (var c = 0; c < t.clips.numItems; c++) r.push(t.clips[c].inPoint.seconds + '-' + t.clips[c].outPoint.seconds); return r.join('|');`);
const giu = kq.split('|').map((x) => x.split('-').map(Number));
console.log('doan GIU (giay trong file goc): ' + giu.map((g) => g[0].toFixed(2) + '-' + g[1].toFixed(2)).join('  '));
const cau = JSON.parse(fs.readFileSync(os.homedir() + '/Movies/AiO Mac Test/Test dai 3.autocut-nghe.json', 'utf8')).cau;
let mat = 0;
for (const c of cau) { const trong = giu.some((g) => c.tu >= g[0] - 0.02 && c.den <= g[1] + 0.02); if (!trong) { mat++; console.log('  CAU BI CAT PHAM: ' + c.tu + '-' + c.den + ' ' + c.chu.slice(0, 40)); } }
console.log('cau noi nam tron trong doan giu: ' + (cau.length - mat) + '/' + cau.length + ' | tong giu ' + giu.reduce((s, g) => s + g[1] - g[0], 0).toFixed(2) + ' s');
