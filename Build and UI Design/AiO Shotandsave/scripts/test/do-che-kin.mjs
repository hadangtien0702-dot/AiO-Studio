/* Bai do kieu lam mo thu ba "TO KIN" (04/10/2026, anh: "them kieu lam mo").
   Chay:  npm run test:chekin        (chay AN, ~25 giay, khong hien cua so nao len man)
   Do gi:
   [1] Day noi: chu 2 ngon ngu, nut trong Cai dat, ham kiem kieu cua main (chay THAT ham do), 2 trang deu co ham ve.
   [2] HANH VI (Electron offscreen nap trang that, 3 ti le man 100 / 150 / 200%): ve mot vung lam mo kieu To kin roi DOC
       DIEM ANH: tung diem trong vung phai den dac ca tren canvas lan trong ANH XUAT / ANH LUU; ngoai vung khong bi dung.
       Doi chung trong cung luot: kieu Kham o tren cung vung KHONG duoc den dac.
   [3] DOI CHUNG HONG: thay veCheKin bang ham rong -> cac phep do o [2] PHAI truot (thuoc biet do la gi). */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'che-kin')
let tong = 0, truot = 0
const kiem = (ten, ok, ct = '') => { tong++; if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
const doc = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8')
const DEN = (d) => Array.isArray(d) && d[0] === 0 && d[1] === 0 && d[2] === 0 && d[3] === 255

console.log('\n[1] Day noi + chu')
const i18n = doc('src/i18n.js')
const dongKin = i18n.split('\n').filter((l) => l.includes("'set.lamMo.kin':"))
kiem("Khoa 'set.lamMo.kin' co du 2 ngon ngu, khong gach ngang dai", dongKin.length === 2 && !dongKin.some((l) => l.includes('—')), dongKin.map((l) => l.trim()).join(' | '))
const caiDat = doc('src/settings/index.html')
const nhom = caiDat.slice(caiDat.indexOf('id="lam-mo-kieu"'), caiDat.indexOf('</div>', caiDat.indexOf('id="lam-mo-kieu"')))
const nut = [...nhom.matchAll(/data-v="([a-z]+)"/g)].map((m) => m[1])
kiem('Cai dat: cum "Kieu lam mo" co dung 3 nut mosaic / blur / kin', nut.join() === 'mosaic,blur,kin', nut.join())
const mainJs = doc('src/main.js')
const mHam = mainJs.match(/function kieuLamMo\(v\) \{[^}]*\}/)
let hamKieu = null
try { hamKieu = mHam && new Function(mHam[0] + '; return kieuLamMo')() } catch (e) {}
const bang = [['kin', 'kin'], ['blur', 'blur'], ['mosaic', 'mosaic'], ['KIN', 'mosaic'], ['', 'mosaic'], [undefined, 'mosaic'], [null, 'mosaic'], [7, 'mosaic']]
kiem('main.js kieuLamMo(): nhan kin / blur / mosaic, gia tri la ve mosaic (chay that ham)', !!hamKieu && bang.every(([v, can]) => hamKieu(v) === can),
  hamKieu ? bang.map(([v]) => JSON.stringify(v) + '->' + hamKieu(v)).join(' ') : 'khong tim thay ham')
kiem('main.js dung kieuLamMo o ca luc doc lan luc ghi cai dat', (mainJs.match(/kieuLamMo\(/g) || []).length >= 3 && !/lamMoKieu: c\.lamMoKieu === 'blur'/.test(mainJs))
for (const [f, ten] of [['src/overlay/overlay.js', 'man chup'], ['src/pin/pin.js', 'anh ghim']]) {
  const s = doc(f)
  kiem('Trang ' + ten + ': co ham veCheKin + nhanh rieng cho kieu kin', /function veCheKin\(/.test(s) && /bType === 'kin'\) \{\s*veCheKin\(/.test(s))
}

console.log('\n[2] Hanh vi (Electron offscreen, khong hien gi len man)')
const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
const electron = require('electron')
function chay(tiLe, hong) {
  const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'che-kin-main.cjs'), RA, String(tiLe), ...(hong ? ['hong'] : [])], { env, encoding: 'utf8', timeout: 90000 })
  const ra = (r.stdout || '') + (r.stderr || '')
  const d = ra.split('\n').find((l) => l.startsWith('KQ='))
  if (!d) return { loi: (ra.split('\n').find((l) => l.startsWith('LOI=')) || 'khong co KQ, ma thoat ' + r.status).slice(0, 300) }
  try { return JSON.parse(d.slice(3)) } catch (e) { return { loi: 'KQ khong doc duoc' } }
}
for (const tiLe of ['1', '1.5', '2']) {
  const k = chay(tiLe, false), T = 'man ' + Math.round(Number(tiLe) * 100) + '%: '
  if (k.loi) { kiem(T + 'bai chay xong va tra ket qua', false, k.loi); continue }
  kiem(T + 'MAN CHUP nhan kieu moi khi doi trong Cai dat luc dang mo', k.a0 === 'mosaic' && k.a1 === 'kin', k.a0 + ' -> ' + k.a1)
  kiem(T + 'MAN CHUP To kin: giua + 2 goc trong den dac, ngoai vung khong bi dung', DEN(k.a2.giua) && DEN(k.a2.gocTren) && DEN(k.a2.gocDuoi) && k.a2.ngoai[3] === 0,
    'giua ' + k.a2.giua + ' · ngoai ' + k.a2.ngoai)
  kiem(T + 'MAN CHUP To kin: 0 diem khong den trong ca vung', k.a3.tong > 1000 && k.a3.khac === 0, k.a3.khac + ' / ' + k.a3.tong)
  kiem(T + 'DOI CHUNG: Kham o tren cung vung KHONG den dac', !DEN(k.a4.giua) && k.a4.quet.khac > 0, 'giua ' + k.a4.giua + ' · khac ' + k.a4.quet.khac + ' / ' + k.a4.quet.tong)
  kiem(T + 'Net da ghi kieu kin van To kin sau khi Cai dat doi lai Kham o', k.a5.kieuHienTai === 'mosaic' && k.a5.quet.khac === 0, 'cai dat ' + k.a5.kieuHienTai + ' · khac ' + k.a5.quet.khac)
  kiem(T + 'ANH XUAT tu man chup: vung do den dac tung diem', !k.a6.loi && k.a6.quet.tong > 1000 && k.a6.quet.khac === 0 &&
    k.a6.rong === Math.round(600 * k.dpr) && k.a6.cao === Math.round(400 * k.dpr), k.a6.loi || (k.a6.rong + 'x' + k.a6.cao + ' · khac ' + k.a6.quet.khac + ' / ' + k.a6.quet.tong))
  kiem(T + 'ANH GHIM: phim 4 vao cong cu lam mo voi kieu kin', k.b1.tool === 'blur' && k.b1.kieu === 'kin', JSON.stringify(k.b1))
  kiem(T + 'DOI CHUNG: Kham o tren anh nhieu KHONG den dac', k.b2.khac > 0, k.b2.khac + ' / ' + k.b2.tong)
  kiem(T + 'ANH GHIM To kin: 0 diem khong den trong ca vung', k.b3.tong > 1000 && k.b3.khac === 0, k.b3.khac + ' / ' + k.b3.tong)
  kiem(T + 'ANH LUU 900x600: vung do den dac tung diem; 4 goc ngoai vung khong co diem den', !k.b4.loi && k.b4.rong === 900 && k.b4.cao === 600 &&
    k.b4.trong.tong > 1000 && k.b4.trong.khac === 0 && k.b4.ngoai.den === 0,
    k.b4.loi || ('trong khac ' + k.b4.trong.khac + ' / ' + k.b4.trong.tong + ' · ngoai den ' + k.b4.ngoai.den + ', doi ' + k.b4.ngoai.doi + ' / ' + k.b4.ngoai.tong + ' · ' + k.b4.kieu))
  /* Bo qua 1 loi CO SAN, khong thuoc viec nay (do-so-buoc.mjs cung bo): trang man chup + anh ghim thieu `font-src file:`
     trong Content-Security-Policy tu 24/08 nen Inter.woff2 bi chan (trang khay + Cai dat thi co). Chua sua, da ghi so. */
  const la = (k.loiTrang || []).filter((l) => !l.includes('Inter.woff2'))
  kiem(T + 'khong co loi trong trang (tru loi font co san)', la.length === 0, la.join(' | ').slice(0, 200))
}

console.log('\n[3] Doi chung hong (veCheKin bi thay bang ham rong)')
const h = chay('2', true)
if (h.loi) kiem('DOI CHUNG HONG chay duoc', false, h.loi)
else kiem('DOI CHUNG HONG: ca 4 phep do diem anh deu bat duoc (khac > 0)', h.a3.khac > 0 && !h.a6.loi && h.a6.quet.khac > 0 && h.b3.khac > 0 && !h.b4.loi && h.b4.trong.khac > 0,
  'canvas man chup ' + h.a3.khac + ' · anh xuat ' + (h.a6.quet && h.a6.quet.khac) + ' · canvas ghim ' + h.b3.khac + ' · anh luu ' + (h.b4.trong && h.b4.trong.khac))

console.log('\n' + '='.repeat(60))
console.log('Ket qua: ' + (tong - truot) + ' / ' + tong + ' DAT' + (truot ? ', CO ' + truot + ' MUC TRUOT (FAIL)' : ''))
process.exit(truot ? 1 : 0)
