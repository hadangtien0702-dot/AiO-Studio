// ap-ket-qua.mjs — doc ket qua do cua cac agent (JSON: mang [{id, anhDung, vungVideo, deXuatVung, mockDo, ...}])
// (1) in bang tom tat de nguoi doc duyet, (2) --ap: ghi MOCK_DO vao ve-guide.js (giua 2 dong danh dau) va
// vung vao safe-zones.json (pt + px1080 tinh lai, trangThai ben_thu_3, nguon/ghiChu noi them), (3) ghi manifest.json
// cho ghep-tat-ca.py. KHONG bao gio ghi so nho hon so do that (quyDoi1080x1920).
// Dung: node ap-ket-qua.mjs <ket-qua.json> [--ap] [--chi id1,id2]
import fs from 'node:fs';
import path from 'node:path';
const GOC = 'E:/2026/Production/AiO Studio/Build and UI Design/AiO Auto Guiline Frame';
const [, , fileKq, ...co] = process.argv;
const AP = co.includes('--ap');
const chiIdx = co.indexOf('--chi'); const CHI = chiIdx >= 0 ? co[chiIdx + 1].split(',') : null;
let ds = JSON.parse(fs.readFileSync(fileKq, 'utf8'));
if (!Array.isArray(ds)) ds = ds.result || ds.ok || [];
ds = ds.filter(Boolean).filter(d => d && d.id && (!CHI || CHI.includes(d.id)));
const json = JSON.parse(fs.readFileSync(path.join(GOC, 'safe-zones.json'), 'utf8'));
const tim = (id) => json.nenTang.flatMap(n => n.dinhDang).find(f => f.id === id);
const manifest = [];
const dong = [];
for (const d of ds) {
  const f = tim(d.id);
  const hien = f ? Object.fromEntries(f.vung.map(v => [v.canh, v.pt])) : {};
  const q = d.quyDoi1080x1920 || {};
  const dx = d.deXuatVung || {};
  const doThat = { top: q.topPx != null ? q.topPx / 19.2 : null, bottom: q.bottomPx != null ? q.bottomPx / 19.2 : null, right: q.rightPx != null ? q.rightPx / 10.8 : null, left: q.leftPx != null ? q.leftPx / 10.8 : null };
  console.log(`\n=== ${d.id} | tin cay: ${d.doTinCay} | anh that: ${d.laAnhThat} | goc: ${d.gocNhin || '?'} ===`);
  console.log(`  anh: ${d.anhDung || '(khong)'} | ${d.anhNguon || ''}`);
  if (d.khongLamDuoc) console.log('  KHONG LAM DUOC: ' + d.khongLamDuoc);
  if (d.vungVideo) console.log(`  vung video: (${d.vungVideo.x0},${d.vungVideo.y0})-(${d.vungVideo.x1},${d.vungVideo.y1}) mapping ${d.vungVideo.mapping}`);
  console.log('  do that (%): ' + Object.entries(doThat).map(([k, v]) => k + '=' + (v == null ? '-' : v.toFixed(1))).join('  '));
  console.log('  hien tai  : ' + Object.entries(hien).map(([k, v]) => k + '=' + v).join('  '));
  console.log('  de xuat   : ' + ['top', 'bottom', 'right', 'left'].map(k => k + '=' + (dx[k] == null ? '-' : dx[k])).join('  ') + (dx.leftLoai ? ' (left ' + dx.leftLoai + ')' : ''));
  console.log('  mockDo: ' + ((d.mockDo || []).length) + ' phan tu | chuaChac: ' + ((d.chuaChac || []).length));
  (d.chuaChac || []).slice(0, 4).forEach(c => console.log('    ? ' + String(c).slice(0, 160)));
  // canh bao: de xuat nho hon do that
  for (const k of ['top', 'bottom', 'right', 'left']) if (dx[k] != null && doThat[k] != null && dx[k] < doThat[k] - 0.05) console.log(`  !! ${k}: de xuat ${dx[k]}% < do that ${doThat[k].toFixed(1)}%`);
  if (d.anhDung && d.vungVideo) manifest.push({ id: d.id, anh: d.anhDung, rect: [d.vungVideo.x0, d.vungVideo.y0, d.vungVideo.x1, d.vungVideo.y1], mapping: d.vungVideo.mapping });
  if (d.mockDo && d.mockDo.length) {
    const rows = d.mockDo.map(e => {
      const o = {};
      // 'mau' / 'pt' / 'mauChu' / 'vien' cung phai chep (agent ig-reels bat: thieu 'mau' thi pill thanh tab ve TRANG)
      for (const k of ['t', 'x', 'y', 'w', 'h', 's', 'nhan', 'mo', 'doc', 'cong', 'n', 'dam', 'can', 'mau', 'pt', 'mauChu', 'vien']) if (e[k] !== undefined && e[k] !== null && e[k] !== '') o[k] = typeof e[k] === 'number' ? Math.round(e[k] * 100) / 100 : e[k];
      return '      ' + JSON.stringify(o).replace(/"([a-zA-Z]+)":/g, '$1: ').replace(/,/g, ', ').replace(/"/g, "'");
    });
    dong.push(`  MOCK_DO['${d.id}'] = [ // ${(d.anhNguon || '').replace(/\n/g, ' ').slice(0, 110)} | tin cay: ${String(d.doTinCay).slice(0, 40)}\n${rows.join(',\n')}\n  ];`);
  }
}
fs.writeFileSync(path.join(path.dirname(fileKq), 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`\nmanifest.json: ${manifest.length} app co anh + vung video`);
if (!AP) { console.log('\n(chay lai voi --ap de ghi vao ve-guide.js + safe-zones.json)'); process.exit(0); }
// --- ghi MOCK_DO ---
const vg = path.join(GOC, 'dist', 've-guide.js');
let js = fs.readFileSync(vg, 'utf8');
const D1 = '// ==== BAT DAU MOCK_DO SINH TU KET QUA DO', D2 = '// ==== KET THUC MOCK_DO SINH TU KET QUA DO ====';
const i1 = js.indexOf(D1), i2 = js.indexOf(D2);
if (i1 < 0 || i2 < 0) throw new Error('khong thay dau danh dau MOCK_DO trong ve-guide.js');
const dauDong = js.slice(i1, js.indexOf('\n', i1) + 1);
// GOP, khong ghi de: bang cua id KHONG thuoc lot nay giu nguyen (26/09 lot 3 tung xoa mat 4 bang cua lot 2)
const khoiCu = js.slice(i1 + dauDong.length, i2);
const idLot = new Set(ds.map(d => d.id));
const giuLai = [];
const reBang = /  MOCK_DO\['([a-z0-9-]+)'\] = \[[\s\S]*?\n  \];/g; let mBang;
while ((mBang = reBang.exec(khoiCu))) if (!idLot.has(mBang[1])) giuLai.push(mBang[0]);
const tatCa = giuLai.concat(dong);
js = js.slice(0, i1) + dauDong + tatCa.join('\n') + '\n  ' + js.slice(i2);
fs.writeFileSync(vg, js, 'utf8');
console.log(`ve-guide.js: ghi ${dong.length} bang MOCK_DO moi + giu ${giuLai.length} bang cu = ${tatCa.length}`);
// --- ghi vung vao JSON ---
let soDoi = 0;
for (const d of ds) {
  const f = tim(d.id); const dx = d.deXuatVung; if (!f || !dx) continue;
  const q = d.quyDoi1080x1920 || {};
  for (const canh of ['top', 'bottom', 'right', 'left']) {
    if (dx[canh] == null || dx[canh] <= 0) continue; // 0 = khong co vung canh do (bat bien JSON doi 0 < pt < 50)
    let pt = dx[canh];
    // do that: canh left loai crop thi so voi phan bi cat (cropMoiMepPx), khong phai mep chu
    // canh left/right loai crop (x-vertical 26/09: cot icon doc khong con, chi con phan bi cat mep)
    const laCrop = (canh === 'left' && dx.leftLoai === 'crop') || (canh === 'right' && dx.rightLoai === 'crop');
    const doThatPt = canh === 'top' ? q.topPx / 19.2 : canh === 'bottom' ? q.bottomPx / 19.2 : (laCrop ? (q.cropMoiMepPx || 0) : (canh === 'right' ? q.rightPx : q.leftPx)) / 10.8;
    if (Number.isFinite(doThatPt) && pt < doThatPt) pt = Math.ceil(doThatPt); // khong bao gio nho hon do that
    let v = f.vung.find(x => x.canh === canh);
    // so CHINH THUC (spec ads) lon hon so do -> giu lam bien tren (nhu YouTube bottom 25%): khong ha
    if (v && v.trangThai === 'chinh_thuc' && v.pt > pt && v.loai === 'ui') { console.log(`  giu ${d.id}/${canh} = ${v.pt}% (chinh thuc, > de xuat ${pt}%)`); continue; }
    if (v && v.pt > pt) console.log(`  HA ${d.id}/${canh}: ${v.pt}% (${v.trangThai}) -> ${pt}% ${laCrop ? 'crop' : 'ui'} (do that ${Number.isFinite(doThatPt) ? doThatPt.toFixed(1) : '-'}%)`);
    const px = Math.round(pt / 100 * (canh === 'top' || canh === 'bottom' ? 1920 : 1080));
    if (!v) { v = { canh, pt, px1080: px, loai: laCrop ? 'crop' : 'ui', trangThai: 'ben_thu_3', ui: { vi: 'Đo từ ảnh app thật 26/09/2026', en: 'Measured from a real app screenshot 26/09/2026' } }; f.vung.push(v); }
    if (v.pt !== pt || (laCrop && v.loai !== 'crop')) { soDoi++; v.pt = pt; v.px1080 = px; v.trangThai = 'ben_thu_3'; if (laCrop) v.loai = 'crop'; }
  }
  // idempotent: cat doan da noi lan truoc roi noi lai (chay lai cung lot khong nhan doi)
  f.nguon = String(f.nguon || '').replace(/ \| DO ANH APP THAT [\s\S]*$/, '') + ` | DO ANH APP THAT 26/09/2026 (${(d.anhNguon || '').replace(/\|/g, '/').slice(0, 90)}): top ${(q.topPx / 19.2).toFixed(1)}% / bottom ${(q.bottomPx / 19.2).toFixed(1)}% / right ${(q.rightPx / 10.8).toFixed(1)}% / left ${(q.leftPx / 10.8).toFixed(1)}%, mapping ${d.vungVideo ? d.vungVideo.mapping : '?'}; tin cay: ${String(d.doTinCay).slice(0, 60)}`;
}
fs.writeFileSync(path.join(GOC, 'safe-zones.json'), JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log(`safe-zones.json: ${soDoi} canh doi so`);
