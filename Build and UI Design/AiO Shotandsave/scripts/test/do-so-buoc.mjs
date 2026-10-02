/* =========================================================================
   Bai do DANH SO BUOC (phim 6, 02/10/2026) — npm run test:sobuoc
   KHONG hien cua so nao len man (Electron offscreen), KHONG chay main.js cua app -> chay duoc khi anh dang lam viec.
   [1] Day noi (node): nut + chu 2 ngon ngu + phim 6 o ca man chup lan anh ghim; 4 ham ve so GIONG HET nhau o 2 file;
       mau chu so tren 7 mau cua bang mau.
   [2] Chay that (scripts/test/so-buoc-main.cjs) o 3 ti le man 100 / 125 / 150%: bam phim 6, bam chuot dong so, doc
       DIEM ANH tren canvas (mau huy hieu, net chu so tung so phai KHAC nhau), hoan tac, xen khung, keo bang cong cu V,
       xoa so o giua (so con lai don lai), mau vang chu den, bam sat mep, bam-giu-keo, keo co khung, bam Xong, luu anh ghim.
   [3] DOI CHUNG: lam hong ham dem so + ham kep mep trong trang -> bai cham PHAI bat duoc.
   Dieu bai nay KHONG do duoc: chuot that tren cua so that (su kien o day la gia lap trong trang), anh nen that phia
   sau huy hieu, cam giac to / nho cua huy hieu tren anh 4K.
   ========================================================================= */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const doc = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
let truot = 0
const kiem = (ten, ok, ct = '') => { if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }

console.log('\n[1] Day noi + chu')
const i18n = doc('src', 'i18n.js'), ovJs = doc('src', 'overlay', 'overlay.js'), pinJs = doc('src', 'pin', 'pin.js')
const ovHtml = doc('src', 'overlay', 'index.html'), pinHtml = doc('src', 'pin', 'index.html')
const dongSo = i18n.split('\n').filter((l) => l.includes("'overlay.so':"))
kiem("Khoa 'overlay.so' co du 2 ngon ngu, khong gach ngang dai", dongSo.length === 2 && !dongSo.some((l) => l.includes('—')), dongSo.length + ' dong')
kiem('Goi y anh ghim (2 ngon ngu) co nhac phim 6', i18n.split('\n').filter((l) => l.includes("'ghim.goiY':") && /\b6\b/.test(l)).length === 2)
for (const [ten, html] of [['man chup', ovHtml], ['anh ghim', pinHtml]]) {
  kiem('Nut danh so tren thanh cong cu ' + ten, /<button class="cong-cu" data-tool="so" data-i18n-title="overlay\.so"/.test(html) && /<i class="so">6<\/i>/.test(html))
}
for (const [ten, ma] of [['overlay.js', ovJs], ['pin.js', pinJs]]) {
  kiem('Phim 6 (hang so + ban phim so) -> cong cu so trong ' + ten, ma.includes("'6': 'so'") && ma.includes("'Digit6': 'so'") && ma.includes("'Numpad6': 'so'"))
}
const ham = (ma, ten) => { const d = 'function ' + ten + '\\([^)]*\\) \\{'; const m = new RegExp(d + '[^\\n]*\\}(?=\\r?\\n)').exec(ma) || new RegExp(d + '[\\s\\S]*?\\n\\}').exec(ma); return m ? m[0] : null }
const lech = ['veSo', 'chuTrenMau', 'kepTamSo', 'danhSoLai'].filter((t) => !ham(ovJs, t) || ham(ovJs, t) !== ham(pinJs, t))
kiem('4 ham ve so GIONG HET nhau o overlay.js va pin.js', lech.length === 0, lech.join(', '))
const chuTrenMau = new Function(ham(ovJs, 'chuTrenMau') + '; return chuTrenMau')()
const mauBang = [...ovHtml.matchAll(/class="mau" data-color="(#[0-9a-f]{6})"/g)].map((m) => m[1])
const mongDoi = { '#f86820': '#ffffff', '#ff3b30': '#ffffff', '#0a84ff': '#ffffff', '#111111': '#ffffff', '#ffcc00': '#111111', '#34c759': '#111111', '#ffffff': '#111111' }
const saiMau = mauBang.filter((m) => chuTrenMau(m) !== mongDoi[m])
kiem('Mau chu so tren 7 mau cua bang: cam / do / xanh duong / den -> chu trang; vang / xanh la / trang -> chu den', mauBang.length === 7 && saiMau.length === 0, mauBang.length + ' mau' + (saiMau.length ? ', sai: ' + saiMau.join(' ') : ''))

/* ── chay that ─────────────────────────────────────────────────────────── */
const RA = path.join(ROOT, '.selftest', 'so-buoc')
const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
const electron = require('electron')
function chay(tiLe, hong) {
  const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'so-buoc-main.cjs'), RA, String(tiLe), ...(hong ? ['hong'] : [])], { env, encoding: 'utf8', timeout: 90000 })
  const dong = (r.stdout || '').split('\n').find((l) => l.startsWith('KQ='))
  if (!dong) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 3).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
  return JSON.parse(dong.slice(3))
}

const CAM = [248, 104, 32], XAM = [64, 64, 64]
const gan = (a, b, d = 6) => a && [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= d)
const day = (ds) => ds.map((s) => s.n).join(',')
const o = (ds) => ds.map((s) => s.x + ':' + s.y).join(' ')
const khac = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n }
const netChu = (ds, loai) => ds.every((c) => c[loai] >= 15 && c[loai === 'trang' ? 'den' : 'trang'] === 0 && Math.abs(c.lechX) <= 1 && Math.abs(c.lechY) <= 1)
const khacNhau = (ds) => Math.min(khac(ds[0].mat, ds[1].mat), khac(ds[0].mat, ds[2].mat), khac(ds[1].mat, ds[2].mat))

/* Tra ve danh sach [ten, dat, chi tiet] — dung chung cho luot that va luot doi chung. */
function cham(k, tiLe) {
  const kq = []
  const them = (ten, ok, ct = '') => kq.push([ten, !!ok, ct])
  them('man gia lap dung ti le, canvas ve = vung x ti le', k.dpr === tiLe && k.vaoVe.rong === Math.round(600 * tiLe) && k.vaoVe.cao === Math.round(400 * tiLe), 'DPR ' + k.dpr + ', canvas ' + k.vaoVe.rong + 'x' + k.vaoVe.cao)
  them('phim 6 -> cong cu so, chi nut so sang, nut co chu goi y', k.a1.tool === 'so' && k.a1.chon.join() === 'so' && k.a1.nhan.length > 10)
  them('bam 3 cho -> so 1, 2, 3 dung cho bam', day(k.a2) === '1,2,3' && o(k.a2) === '80:60 300:200 500:330', day(k.a2) + ' | ' + o(k.a2))
  them('diem anh: trong huy hieu mau cam, cach 25 px la trong suot', k.a3.every((d) => gan(d.trong, CAM) && d.ngoai[3] === 0))
  them('chu so trang, nam giua huy hieu (lech <= 1 px)', netChu(k.a4, 'trang'), k.a4.map((c) => c.trang + ' diem, lech ' + c.lechX.toFixed(1) + '/' + c.lechY.toFixed(1)).join(' · '))
  them('net chu cua so 1, 2, 3 KHAC nhau (khong phai ba so giong nhau)', khacNhau(k.a4) >= 6, 'khac it nhat ' + khacNhau(k.a4) + ' diem')
  them('Ctrl+Z bo so cuoi, bam lai ra dung so 3', day(k.a5a) === '1,2' && day(k.a5b) === '1,2,3')
  them('ve khung xen giua: khung khong an mat so (so tiep theo la 4)', k.a6.loai.join() === 'so,so,so,rect,so' && day(k.a6.so) === '1,2,3,4')
  them('cong cu V keo so 2 di (+40, +30): doi cho, van la so 2', k.a7.chon === 'so' && k.a7.so[1].n === 2 && k.a7.so[1].x === 340 && k.a7.so[1].y === 230, o(k.a7.so))
  them('xoa so 2: cac so con lai don lai 1, 2, 3 (khong ra 1, 3, 4)', day(k.a8) === '1,2,3' && o(k.a8) === '80:60 500:330 420:60', day(k.a8))
  them('mau vang: chu so DEN', k.a9.so.color === '#ffcc00' && k.a9.chu.den >= 15 && k.a9.chu.trang === 0, k.a9.chu.den + ' diem den')
  them('bam sat mep: tam bi day vao 16 px, ca vong tron nam trong vung', o(k.a10.so) === '16:16 584:384' && k.a10.mepTrai[3] === 255 && k.a10.mepPhai[3] === 255, o(k.a10.so))
  them('bam-giu-keo: huy hieu theo chuot, tha ra la chot, khong sinh so thua', k.a10b.truoc === k.a10b.sau && k.a10b.cuoi.x === 280 && k.a10b.cuoi.y === 120, k.a10b.truoc + ' -> ' + k.a10b.sau)
  const t = k.a11.truoc, s = k.a11.sau
  them('keo to khung (-30, -20): huy hieu dung yen tren man', s.r.x === 70 && s.r.y === 80 && t.r.x + t.s.x === s.r.x + s.s.x && t.r.y + t.s.y === s.r.y + s.s.y, 'man ' + (t.r.x + t.s.x) + ':' + (t.r.y + t.s.y) + ' -> ' + (s.r.x + s.s.x) + ':' + (s.r.y + s.s.y))
  them('bam Xong: anh gui ve dung co, co huy hieu', !k.a12.loi && k.a12.rong === k.a12.canRong && k.a12.cao === k.a12.canCao && gan(k.a12.trong, CAM) && k.a12.ngoai[3] === 0, k.a12.loi || k.a12.rong + 'x' + k.a12.cao)
  them('ANH GHIM: phim 6 luc dang xem -> vao ve voi cong cu so', k.b1.mode === 've' && k.b1.tool === 'so' && k.b1.nut && k.b1.chon.join() === 'so')
  const dung = [[100, 80], [400, 300], [240, 260]]
  them('ANH GHIM: 2 lan bam + 1 lan bam-giu-keo -> so 1, 2, 3 dung cho (lech <= 1 px)', day(k.b2) === '1,2,3' && k.b2.every((h, i) => Math.abs(h.x - dung[i][0]) <= 1 && Math.abs(h.y - dung[i][1]) <= 1), o(k.b2))
  them('ANH GHIM: chu so trang nam giua, 3 so khac nhau', netChu(k.b2chu, 'trang') && khacNhau(k.b2chu) >= 6)
  them('ANH GHIM: Enter luu anh THAT 900x600, huy hieu phong 1,5 lan dung cho, cho khong bam con nguyen', !k.b3.loi && k.b3.rong === 900 && k.b3.cao === 600 && gan(k.b3.trong, CAM) && gan(k.b3.sat, CAM) && gan(k.b3.trong2, CAM) && gan(k.b3.ngoai, XAM, 8) && gan(k.b3.khongBam, XAM, 2), k.b3.loi || '')
  them('ANH GHIM: luu xong ve che do xem; vao ve lai thi dem lai tu 1', k.b4truoc === 'view' && day(k.b4) === '1')
  const la = k.loiTrang.filter((l) => !l.includes('Inter.woff2'))
  them('khong co loi trong trang', la.length === 0, la.join(' | ').slice(0, 200))
  return kq
}

for (const tiLe of [1, 1.25, 1.5]) {
  console.log('\n[2] Chay that, man ' + tiLe * 100 + '%')
  const k = chay(tiLe)
  if (k.loi) { kiem('bai do chay duoc', false, k.loi); continue }
  for (const [ten, ok, ct] of cham(k, tiLe)) kiem(ten, ok, ct)
}

console.log('\n[3] DOI CHUNG: lam hong ham dem so + ham kep mep, bai cham phai bat duoc')
const kh = chay(1, true)
if (kh.loi) kiem('luot doi chung chay duoc', false, kh.loi)
else {
  const ds = cham(kh, 1), truotTen = ds.filter((d) => !d[1]).map((d) => d[0])
  const phaiTruot = ['bam 3 cho -> so 1, 2, 3', 'net chu cua so 1, 2, 3 KHAC nhau', 'xoa so 2', 'bam sat mep']
  const sot = phaiTruot.filter((p) => !truotTen.some((t) => t.startsWith(p)))
  kiem('ban hong bi bat o ca 4 muc: dem so, net chu khac nhau, don so sau khi xoa, kep mep', sot.length === 0, sot.length ? 'KHONG bat duoc: ' + sot.join('; ') : truotTen.length + ' muc truot tren ban hong')
}

console.log(truot ? '\nTRUOT ' + truot + ' muc' : '\nDAT het')
process.exit(truot ? 1 : 0)
