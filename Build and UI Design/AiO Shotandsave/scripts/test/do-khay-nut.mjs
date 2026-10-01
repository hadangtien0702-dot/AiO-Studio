/* =========================================================================
   Bai do KHAY TU THU VE NUT TRON (01/10/2026) — npm run test:khaynut
   KHONG hien cua so nao len man (Electron offscreen), KHONG chay main.js cua app -> chay duoc khi anh dang lam viec.
   [1] Hinh hoc (node): nut nam o goc duoi-phai, cua so nut >= 64 px (Windows khong cho cua so nho hon ~58 px diem anh
       that — so loi #13), bong cua nut khong tran le cua so. Kem doi chung cua so 52 px phai truot.
   [2] Day noi: kenh preload goi -> main / khay-thu.js nghe; ham trang khay main goi -> shelf.js co; chu VI + EN du.
   [3] Chay that (scripts/test/khay-nut-main.cjs): thu ve, xuat hien, tu thu 5 giay, 2 doi chung KHONG thu (con tro trong
       khay / dang ban), anh moi giua chung, an han, khay trong, san dien HONG van ket thuc dung trang thai.
   Dieu bai nay KHONG do duoc: cua so that tren man that (thu tu chong cua so, do muot, nhieu man khac ti le).
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

console.log('\n[1] Hinh hoc nut tron')
const K = require(path.join(ROOT, 'src', 'khay-thu.js'))
const MIN_WIN = 58 // co toi thieu Windows ep, tinh ra DIP o man 100% (so loi #13)
const giao = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
let loiHH = []
for (const wa of [{ x: 0, y: 0, width: 2560, height: 1392 }, { x: -2048, y: 474, width: 2048, height: 1104 }, { x: 0, y: 0, width: 1280, height: 680 }, { x: 1920, y: -200, width: 1366, height: 728 }]) {
  const cs = K.oCuaSoNut(wa), tr = K.oTronNut(wa)
  if (cs.width < MIN_WIN || cs.height < MIN_WIN) loiHH.push('cua so nho hon muc Windows ep')
  if (cs.x < wa.x || cs.y < wa.y || cs.x + cs.width > wa.x + wa.width || cs.y + cs.height > wa.y + wa.height) loiHH.push('cua so nut tran khoi workArea')
  if (tr.x + tr.width !== wa.x + wa.width - K.NUT.LE || tr.y + tr.height !== wa.y + wa.height - K.NUT.LE) loiHH.push('vong tron khong cach goc ' + K.NUT.LE + ' px')
  if (tr.x - cs.x !== (cs.width - tr.width) / 2 || tr.y - cs.y !== (cs.height - tr.height) / 2) loiHH.push('vong tron khong nam giua cua so')
  const td = K.tuongDoi(tr, wa)
  if (td.x !== wa.width - K.NUT.LE - K.NUT.TRON || td.y !== wa.height - K.NUT.LE - K.NUT.TRON) loiHH.push('toa do tren san dien sai')
}
kiem('Nut o goc duoi-phai, cua so ' + K.NUT.CUA_SO + ' px >= ' + MIN_WIN + ', nam trong workArea (4 man, co man toa do am)', loiHH.length === 0, [...new Set(loiHH)].join('; '))
kiem('DOI CHUNG: cua so nut 52 px (bang vong tron) bi Windows ep ' + MIN_WIN + ' px', K.NUT.TRON < MIN_WIN && K.NUT.CUA_SO >= MIN_WIN, 'tron ' + K.NUT.TRON + ', cua so ' + K.NUT.CUA_SO)
const cssNut = doc('src', 'nut', 'nut.css')
const bong = /\.nut\s*\{[^}]*box-shadow:\s*0\s+(\d+)px\s+(\d+)px/.exec(cssNut)
const le = (K.NUT.CUA_SO - K.NUT.TRON) / 2
kiem('Bong cua nut (lech + nhoe) khong tran le ' + le + ' px cua cua so trong suot', !!bong && Number(bong[1]) + Number(bong[2]) <= le, bong ? bong[1] + ' + ' + bong[2] : 'khong doc duoc')
kiem('giayHopLe: chi nhan 5 / 10 / 15, con lai ve 5', K.giayHopLe(10) === 10 && K.giayHopLe(15) === 15 && K.giayHopLe(7) === 5 && K.giayHopLe(undefined) === 5 && K.giayHopLe('10') === 10)
kiem('chonO: bo o qua nho, toi da 7 o', K.chonO([{ x: 0, y: 0, w: 3, h: 50 }, ...Array.from({ length: 12 }, (_, i) => ({ x: i * 10, y: 0, w: 60.4, h: 64 }))]).length === 7)
const O80 = { x: 10, y: 20, width: 80, height: 80 }
kiem('lechDang: to them 1 px phai / duoi = dung; lech goc hoac to them 2 px = lech (doi chung)', !K.lechDang({ x: 10, y: 20, width: 81, height: 81 }, O80) && !K.lechDang(O80, O80) && K.lechDang({ x: 11, y: 20, width: 80, height: 80 }, O80) && K.lechDang({ x: 10, y: 20, width: 82, height: 80 }, O80) && K.lechDang({ x: 10, y: 20, width: 79, height: 80 }, O80))
kiem('trongO: con tro trong / ngoai khay', K.trongO({ x: 10, y: 10 }, { x: 0, y: 0, width: 20, height: 20 }) && !K.trongO({ x: 40, y: 10 }, { x: 0, y: 0, width: 20, height: 20 }, 8) && giao({ x: 0, y: 0, width: 2, height: 2 }, { x: 1, y: 1, width: 2, height: 2 }))

console.log('\n[2] Day noi + chu')
const main = doc('src', 'main.js'), kt = doc('src', 'khay-thu.js'), shelfJs = doc('src', 'shelf', 'shelf.js')
const nghe = new Set([...(main + kt).matchAll(/ipcMain\.(?:on|handle)\('([^']+)'/g)].map((m) => m[1]))
const gui = new Set([...(main + kt).matchAll(/\.send\('([^']+)'/g)].map((m) => m[1]))
for (const pre of ['preload-nut.js', 'preload-dien.js']) {
  const s = doc('src', pre)
  const goi = [...new Set([...s.matchAll(/ipcRenderer\.(?:send|sendSync|invoke)\('([^']+)'/g)].map((m) => m[1]))]
  const nhan = [...new Set([...s.matchAll(/ipcRenderer\.on\('([^']+)'/g)].map((m) => m[1]))]
  kiem(pre + ': ' + goi.length + ' kenh goi len deu co nguoi nghe, ' + nhan.length + ' kenh nhan deu co nguoi gui', goi.length > 0 && goi.every((k) => nghe.has(k)) && nhan.every((k) => gui.has(k)), [...goi.filter((k) => !nghe.has(k)), ...nhan.filter((k) => !gui.has(k))].join(', '))
}
const hamGoi = [...new Set([...kt.matchAll(/window\.(__khay\w+)/g)].map((m) => m[1]))]
kiem('khay-thu.js goi ' + hamGoi.length + ' ham cua trang khay - shelf.js deu co', hamGoi.length === 3 && hamGoi.every((h) => shelfJs.includes('window.' + h + ' =')), hamGoi.filter((h) => !shelfJs.includes('window.' + h + ' =')).join(', '))
kiem('main.js: nut "–" thu ve nut tron, showShelf bung tu nut, khoi chup go san dien, thoat app dong cua so phu',
  /ipcMain\.on\('shelf:hide', \(\) => \{ khayThu\.thu\(/.test(main) && /khayThu\.trangThai\(\) === 'thu'\) \{ khayThu\.bung\(/.test(main) && main.includes('khayThu.huy()') && main.includes('khayThu.dongHet()'))
kiem('Cai dat: hang chon 5 / 10 / 15 giay noi du (trang -> preload -> main -> cau hinh khayTuThu)',
  /id="khay-tu-thu"[\s\S]*data-v="5"[\s\S]*data-v="10"[\s\S]*data-v="15"/.test(doc('src', 'settings', 'index.html')) && doc('src', 'settings', 'settings.js').includes('setKhayTuThu(') && doc('src', 'preload-settings.js').includes("'settings:set-khay-tu-thu'") && main.includes("ipcMain.handle('settings:set-khay-tu-thu'") && main.includes('khayTuThu: giayHopLe(c.khayTuThu)'))
const { DICH } = require(path.join(ROOT, 'src', 'i18n.js'))
const khoa = ['khay.an', 'nut.mo', 'nut.an', 'set.khay.tuThu']
kiem(khoa.length + ' khoa chu co du VI + EN, khong gach ngang dai', khoa.every((k) => DICH.vi[k] && DICH.en[k] && !/[—–]/.test(DICH.vi[k] + DICH.en[k])), khoa.filter((k) => !DICH.vi[k] || !DICH.en[k]).join(', '))
const token = new Set([...doc('assets', 'tokens.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
const moi = [['nut', 'nut.css'], ['nut', 'index.html'], ['nut', 'nut.js'], ['dien', 'index.html'], ['dien', 'dien.js']]
const dungToi = [...new Set(moi.flatMap((p) => [...doc('src', ...p).matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])))]
const tuKhai = moi.flatMap((p) => [...doc('src', ...p).matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)].map((m) => m[1]))
kiem('Trang moi dung ' + dungToi.length + ' token - deu co trong tokens.css, KHONG tu khai token rieng', dungToi.length >= 3 && dungToi.every((v) => token.has(v)) && tuKhai.length === 0, [...dungToi.filter((v) => !token.has(v)), ...tuKhai].join(', '))
const emoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
kiem('Khong emoji trong 5 file giao dien moi', moi.every((p) => !emoji.test(doc('src', ...p))), moi.filter((p) => emoji.test(doc('src', ...p))).map((p) => p.join('/')).join(', '))

console.log('\n[3] Chay that (Electron offscreen, ~35 giay, khong hien gi len man)')
const RA = path.join(ROOT, '.selftest', 'khay-nut')
const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
const electron = require('electron')
const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'khay-nut-main.cjs'), RA], { env, encoding: 'utf8', timeout: 120000 })
const dong = (r.stdout || '').split('\n').find((l) => l.startsWith('KQ='))
let kq = null
try { kq = JSON.parse(dong.slice(3)) } catch (e) {}
kiem('Bai chay xong va tra ket qua', !!kq, kq ? '' : String(r.stderr || r.error || '').slice(-300))
if (kq) {
  const sach = (k) => k && k.an === false && k.clip === 'none' && k.mo === '1' && k.anim === 0
  kiem('Khay bao dung cac o dang thay (nam trong cua so)', kq.thongTin.o.length >= 2 && kq.thongTin.o.every((o) => o.x >= 0 && o.y >= 0 && o.x + o.w <= kq.thongTin.w && o.y + o.h <= kq.thongTin.h), kq.thongTin.o.length + ' o / ' + kq.thongTin.tong + ' anh')
  kiem('THU VE: xong, khay an noi dung, san dien da xoa sach hinh', kq.thu.ok && kq.thu.tt === 'thu' && kq.thu.khay.an === true && kq.thu.dien.hinh === 0, kq.thu.ms + ' ms')
  // cua so 80 hoac 81 px: Windows tra cua so to them 1 px o man 125% (do 01/10 19:1x, so loi #13); vong tron van o (14,14)
  kiem('THU VE: nut that hien so anh + tam moi nhat, vong tron 52 px o (14,14) trong cua so 80-81 px', kq.thu.nut.so === '6' && kq.thu.nut.matAnh && !kq.thu.nut.matLogo && [80, 81].includes(kq.thu.nut.rong) && [80, 81].includes(kq.thu.nut.cao) && kq.thu.nut.tron.join() === '14,14,52,52', JSON.stringify(kq.thu.nut))
  kiem('THU VE duoi 1,3 giay', kq.thu.ms < 1300, kq.thu.ms + ' ms')
  kiem('XUAT HIEN: khay hien lai sach (khong con an, khong con clip-path / animation treo), san dien sach', kq.mo.ok && kq.mo.tt === 'mo' && sach(kq.mo.khay) && kq.mo.dien.hinh === 0, JSON.stringify(kq.mo.khay))
  kiem('XUAT HIEN duoi 1,2 giay', kq.mo.ms < 1200, kq.mo.ms + ' ms')
  kiem('TU THU sau 5 giay khi con tro o ngoai khay (5,0 - 7,0 giay ke ca chuyen dong)', kq.tuThu.tt === 'thu' && kq.tuThu.ms >= 5000 && kq.tuThu.ms <= 7000, kq.tuThu.ms + ' ms')
  kiem('DOI CHUNG: con tro nam trong khay 6,3 giay -> KHONG thu', kq.conTroTrong === 'mo', kq.conTroTrong)
  kiem('DOI CHUNG: dang keo / chup / quay 6,3 giay -> KHONG thu', kq.dangBan === 'mo', kq.dangBan)
  kiem('Co anh moi dung luc dang thu -> thu xong tu bung lai, khay sach', kq.anhMoiGiuaChung.tt === 'mo' && sach(kq.anhMoiGiuaChung.khay))
  kiem('Bam x tren nut -> an han; goi hien khay -> hien thang, khay sach', kq.anHan.tt === 'an' && kq.anHan.sau === 'mo' && sach(kq.anHan.khay))
  kiem('Khay TRONG: van thu duoc, nut la logo, khong hien so', kq.trong.ok && kq.trong.tt === 'thu' && kq.trong.nut.matLogo && !kq.trong.nut.matAnh && kq.trong.nut.so === '')
  kiem('DOI CHUNG HONG: san dien khong tra loi -> van thu (an thang) va van hien lai, khay sach, co ghi run-log', kq.hongThu.tt === 'thu' && kq.hongMo.tt === 'mo' && sach(kq.hongMo.khay) && kq.log.some((l) => l.includes('LOI thu')) && kq.log.some((l) => l.includes('LOI bung')), kq.hongThu.ms + ' / ' + kq.hongMo.ms + ' ms')
  kiem('Khong loi console tren trang khay', kq.loiTrang.length === 0, kq.loiTrang.join(' ; ').slice(0, 200))
  kiem('Run-log khong co dong LOI nao ngoai 2 dong cua doi chung hong', kq.log.filter((l) => /LOI|CANH BAO/.test(l)).length === 2, kq.log.filter((l) => /LOI|CANH BAO/.test(l)).join(' | '))
}
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
