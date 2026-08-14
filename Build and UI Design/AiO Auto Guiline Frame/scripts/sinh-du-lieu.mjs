// sinh-du-lieu.mjs — kiem tra safe-zones.json roi sinh dist/safe-zones.js
// Chay:  node scripts/sinh-du-lieu.mjs
// Vi sao co file nay: JSON goc la NGUON CHAN LY, nhung panel CEP nap qua
// file:// khong fetch duoc JSON canh no — phai boc thanh <script> .js.
// SUA SO LIEU THI SUA safe-zones.json roi chay lai script nay.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const goc = dirname(dirname(fileURLToPath(import.meta.url)));
const duongJson = join(goc, 'safe-zones.json');
const duongRa = join(goc, 'dist', 'safe-zones.js');

const chuoi = readFileSync(duongJson, 'utf8');
const du = JSON.parse(chuoi); // nem loi neu JSON hong

// --- Kiem bat bien: moi so phai tu nhat quan ---
const loi = [];
let soVung = 0, soDinhDang = 0;
for (const nt of du.nenTang) {
  for (const dd of nt.dinhDang) {
    soDinhDang++;
    if (!dd.canvas || !dd.canvas.w || !dd.canvas.h) loi.push(`${dd.id}: thieu canvas`);
    if (!dd.ten || !dd.ten.vi || !dd.ten.en) loi.push(`${dd.id}: thieu ten song ngu`);
    if (!dd.nguon) loi.push(`${dd.id}: thieu nguon`);
    for (const v of dd.vung) {
      soVung++;
      if (!['top', 'bottom', 'left', 'right'].includes(v.canh)) loi.push(`${dd.id}: canh la "${v.canh}"`);
      if (!(v.pt > 0 && v.pt < 50)) loi.push(`${dd.id}/${v.canh}: pt=${v.pt} ngoai (0,50)`);
      if (!v.ui || !v.ui.vi || !v.ui.en) loi.push(`${dd.id}/${v.canh}: thieu mo ta UI song ngu`);
      if (!['chinh_thuc', 'ben_thu_3', 'uoc_luong'].includes(v.trangThai)) loi.push(`${dd.id}/${v.canh}: trangThai la?`);
      if (!['ui', 'crop', 'khuyen_nghi'].includes(v.loai)) loi.push(`${dd.id}/${v.canh}: loai la?`);
      // px1080 phai khop pt tren canvas khai bao (dung sai 1px do lam tron)
      const truc = (v.canh === 'left' || v.canh === 'right') ? dd.canvas.w : dd.canvas.h;
      const pxTinh = (v.pt / 100) * truc;
      if (Math.abs(pxTinh - v.px1080) > 1.0) {
        loi.push(`${dd.id}/${v.canh}: pt=${v.pt}% cua ${truc} = ${pxTinh.toFixed(1)}px, nhung px1080=${v.px1080} (lech ${(pxTinh - v.px1080).toFixed(1)})`);
      }
    }
    // top+bottom (hoac left+right) khong duoc phu kin khung
    const tong = (a, b) => dd.vung.filter(v => v.canh === a || v.canh === b).reduce((s, v) => s + v.pt, 0);
    if (tong('top', 'bottom') >= 95) loi.push(`${dd.id}: top+bottom = ${tong('top', 'bottom')}% — phu gan kin khung?`);
    if (tong('left', 'right') >= 95) loi.push(`${dd.id}: left+right = ${tong('left', 'right')}% — phu gan kin khung?`);
  }
}

if (loi.length) {
  console.error(`HONG — ${loi.length} loi trong safe-zones.json:`);
  for (const l of loi) console.error('  - ' + l);
  process.exit(1);
}

const js = `// SINH TU DONG tu safe-zones.json boi scripts/sinh-du-lieu.mjs — DUNG SUA TAY FILE NAY\nwindow.SAFE_ZONES = ${JSON.stringify(du)};\n`;
writeFileSync(duongRa, js, 'utf8');
console.log(`DAT — ${du.nenTang.length} nen tang, ${soDinhDang} dinh dang, ${soVung} vung. Da sinh dist/safe-zones.js (${js.length} byte). Phien ban du lieu: ${du.phienBanDuLieu}`);
