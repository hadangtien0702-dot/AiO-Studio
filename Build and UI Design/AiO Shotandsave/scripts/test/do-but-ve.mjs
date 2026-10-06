/* =========================================================================
   Do BUT VE TAY (phim 7) + BUT DA QUANG (phim 8) — 06/10 — chay bang: npm run test:butve
   [1] Day noi (node): 2 nut + chu 2 ngon ngu + phim 7 / 8 o ca man chup lan anh ghim; hang NET + 6 ham ve net GIONG HET
       nhau o overlay.js va pin.js.
   [2] Chay that trong Electron AN (scripts/test/but-ve-main.cjs, khong bat cua so) o 3 ti le man 100 / 125 / 150 %:
       ve net bang chuot gia lap roi DOC DIEM ANH tren canvas va tren ANH XUAT RA (man chup: anh ghep; anh ghim: anh luu).
   [3] DOI CHUNG: lam hong ham them diem + cho da quang thanh dac -> bai cham PHAI bat duoc.
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'but-ve')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }
const doc = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8')

// ───────────── [1] Day noi ─────────────
const ovHtml = doc('src/overlay/index.html'), pinHtml = doc('src/pin/index.html')
const ovJs = doc('src/overlay/overlay.js'), pinJs = doc('src/pin/pin.js'), i18n = doc('src/i18n.js')
for (const [ten, html] of [['man chup', ovHtml], ['anh ghim', pinHtml]]) {
  kiem(ten + ': co nut but (so 7) va nut da quang (so 8), khong dung emoji', /data-tool="but"[^>]*data-i18n-title="overlay\.but"[\s\S]*?<i class="so">7<\/i>/.test(html) && /data-tool="daquang"[^>]*data-i18n-title="overlay\.daquang"[\s\S]*?<i class="so">8<\/i>/.test(html))
}
for (const k of ['overlay.but', 'overlay.daquang']) {
  const dong = i18n.split('\n').filter((l) => l.includes("'" + k + "'"))
  kiem("Khoa '" + k + "' co du 2 ngon ngu, khong gach ngang dai", dong.length === 2 && !dong.some((l) => l.includes('—')), dong.length + ' dong')
}
for (const [ten, js] of [['overlay.js', ovJs], ['pin.js', pinJs]]) {
  kiem(ten + ": phim 7 -> 'but', phim 8 -> 'daquang' (ca hang so tren lan ban phim so)", /'7': 'but', '8': 'daquang'/.test(js) && /'Digit7': 'but', 'Digit8': 'daquang'/.test(js) && /'Numpad7': 'but', 'Numpad8': 'daquang'/.test(js))
}
/* Lay nguyen van mot ham (ham 1 dong: het dong; ham nhieu dong: toi dong "}" dau tien o cot 0) */
const ham = (src, ten) => {
  const i = src.indexOf('function ' + ten + '(')
  if (i < 0) return null
  const hetDong = src.indexOf('\n', i)
  if (src.slice(i, hetDong).trimEnd().endsWith('}')) return src.slice(i, hetDong).trimEnd()
  const j = src.indexOf('\n}', i)
  return j < 0 ? null : src.slice(i, j + 2)
}
const hangNet = (src) => (src.match(/^const NET = .*$/m) || [null])[0]
const lech = ['doDayNet', 'veNet', 'hopNet', 'cachNet', 'dichNet', 'themDiemNet'].filter((t) => !ham(ovJs, t) || ham(ovJs, t) !== ham(pinJs, t))
kiem('hang NET + 6 ham ve net GIONG HET nhau o overlay.js va pin.js', lech.length === 0 && !!hangNet(ovJs) && hangNet(ovJs) === hangNet(pinJs), lech.join(', '))

// ───────────── [2] Chay that ─────────────
const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron')
const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE
fs.mkdirSync(RA, { recursive: true })
function chay(tiLe, hong) {
  const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'but-ve-main.cjs'), RA, String(tiLe), ...(hong ? ['hong'] : [])], { env, encoding: 'utf8', timeout: 90000 })
  const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
  if (!dong) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 3).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
  return JSON.parse(dong.slice(3))
}
const CAM = [248, 104, 32], VANG = [255, 204, 0]
const gan = (p, m, sai = 6) => !!p && Math.abs(p[0] - m[0]) <= sai && Math.abs(p[1] - m[1]) <= sai && Math.abs(p[2] - m[2]) <= sai
const dac = (p, m) => gan(p, m) && p[3] >= 250           // net but: dung mau, dac
const trong40 = (p, m) => gan(p, m) && Math.abs(p[3] - 102) <= 6 // da quang: dung mau, trong 40 % (canvas tra mau chua nhan alpha)
const rong = (p) => !!p && p[3] === 0                    // khong co gi
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* Cham mot luot chay -> [{ ten, ok, chiTiet }] */
function cham(k) {
  const ra = []
  const them = (ten, ok, chiTiet = '') => ra.push({ ten, ok: !!ok, chiTiet })
  if (k.loi) { them('chay duoc', false, k.loi); return ra }
  them('phim 7 chon but, phim 8 chon da quang, nut tuong ung sang, co chu goi y', k.a1.but.tool === 'but' && bang(k.a1.but.chon, ['but']) && /7/.test(k.a1.but.goiY) && k.a1.daquang.tool === 'daquang' && bang(k.a1.daquang.chon, ['daquang']) && /8/.test(k.a1.daquang.goiY))
  them('thanh cong cu man chup nam tron trong man', k.thanhOv.trai >= 0 && k.thanhOv.phai <= k.thanhOv.cuaSo && k.thanhOv.nut.includes('but') && k.thanhOv.nut.includes('daquang'), k.thanhOv.trai + '..' + k.thanhOv.phai + ' / ' + k.thanhOv.cuaSo)
  const n2 = k.a2.ds[0] || {}
  them('BUT: giu chuot keo ra MOT net 7 diem, mau cam, dac; cach tam 6 px la trong', n2.type === 'but' && n2.n === 7 && dac(k.a2.giua, CAM) && dac(k.a2.doc, CAM) && rong(k.a2.lech5) && rong(k.a2.xa), 'n ' + n2.n + ' giua ' + k.a2.giua + ' lech ' + k.a2.lech5)
  them('DA QUANG: net 16 px (cach tam 6 px van co mau, 11 px la het), trong 40 %', trong40(k.a3.giua, VANG) && trong40(k.a3.mep6, VANG) && rong(k.a3.ngoai11), 'giua ' + k.a3.giua + ' mep ' + k.a3.mep6 + ' ngoai ' + k.a3.ngoai11)
  them('DA QUANG: cho net tu de len chinh no KHONG dam len (van 40 %)', trong40(k.a3.chong, VANG) && trong40(k.a3.mot, VANG), 'cho de ' + k.a3.chong + ' , ' + k.a3.mot)
  them('giu Shift: di ngoan ngoeo van ra duong THANG 2 diem dau - cuoi', k.a4.net.n === 2 && bang(k.a4.net.pts, [400, 300, 500, 300]) && dac(k.a4.tren, CAM) && rong(k.a4.choNgoan), 'pts ' + k.a4.net.pts)
  them('bam roi tha ngay = mot cham; chuot rung 1 px khong them diem', k.a5.cham.length === 2 && k.a5.cham.every((c) => c.n === 1) && dac(k.a5.diem, CAM), k.a5.cham.map((c) => c.n).join(','))
  them('ve tran ra ngoai vung: diem bi kep trong vung 600x400', bang(k.a6.pts, [560, 380, 600, 380, 600, 400]), '' + k.a6.pts)
  them('Ctrl+Z bo dung 1 net cuoi', k.a7.sau === k.a7.truoc - 1, k.a7.truoc + ' -> ' + k.a7.sau)
  const dung = (a, b, dx, dy) => a.length === b.length && a.every((v, i) => b[i] === v + (i % 2 ? dy : dx))
  them('cong cu V: bam trung net but, keo (+40, +30) moi diem di dung; phim mui ten phai +1', k.a8.chon === 'but' && dung(k.a8.truoc, k.a8.sauKeo, 40, 30) && dung(k.a8.sauKeo, k.a8.sauPhim, 1, 0), '' + k.a8.sauPhim.slice(0, 4))
  them('khung chon cua net om tron net (co le theo do day)', !!k.a8.hop && k.a8.hop.w >= 200 && k.a8.hop.w <= 212 && k.a8.hop.h >= 100 && k.a8.hop.h <= 112, JSON.stringify(k.a8.hop))
  const t = k.a9.truoc, s = k.a9.sau
  them('keo to khung chup (-30, -20): net DUNG YEN tren man', s.r.x === t.r.x - 30 && s.r.y === t.r.y - 20 && s.p[0] === t.p[0] + 30 && s.p[1] === t.p[1] + 20 && s.dq[0] === t.dq[0] + 30 && s.dq[1] === t.dq[1] + 20, JSON.stringify(s.p) + ' ' + JSON.stringify(s.dq))
  them('cong cu so buoc (phim 6) van chay canh net ve', k.a10[k.a10.length - 1] === 'so' && k.a10.filter((x) => x === 'but').length === 4 && k.a10.filter((x) => x === 'daquang').length === 2, k.a10.join(','))
  // anh ghep: bitmap da nhan alpha -> da quang vang 40 % ra (102, 82, 0, 102)
  them('MAN CHUP bam Xong: anh ghep dung co, net but dac dung cho, da quang 40 % dung cho', !k.a11.loi && k.a11.rong === k.a11.canRong && k.a11.cao === k.a11.canCao && dac(k.a11.but, CAM) && rong(k.a11.butLech) && Math.abs(k.a11.dq[3] - 102) <= 6 && gan(k.a11.dq, [102, 82, 0], 8), k.a11.loi || (k.a11.rong + 'x' + k.a11.cao + ' but ' + k.a11.but + ' dq ' + k.a11.dq))
  them('ANH GHIM: phim 7 khi dang xem -> vao che do ve voi cong cu but', k.b1.mode === 've' && k.b1.tool === 'but' && bang(k.b1.chon, ['but']))
  them('ANH GHIM: thanh cong cu nam tron trong cua so (ca anh ghim nho 320 px)', k.thanhPin.trai >= 0 && k.thanhPin.phai <= k.thanhPin.cuaSo && k.thanhPinNho.trai >= 0 && k.thanhPinNho.phai <= k.thanhPinNho.cuaSo, k.thanhPin.trai + '..' + k.thanhPin.phai + '/' + k.thanhPin.cuaSo + ' ; nho ' + k.thanhPinNho.trai + '..' + k.thanhPinNho.phai + '/' + k.thanhPinNho.cuaSo)
  // Sai so 1 px: o man 125 % mep canvas anh ghim la so le con su kien chuot la so nguyen (da ghi tu bai so buoc 02/10)
  const gan1 = (a, b) => !!a && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= 1)
  them('ANH GHIM: net but + da quang, V keo net but (+20, +10)', k.b2.length === 2 && k.b2[0].type === 'but' && gan1(k.b2[0].pts, [120, 110, 220, 110, 320, 110]) && k.b2[1].type === 'daquang' && gan1(k.b2[1].pts, [100, 250, 250, 250, 400, 250]), JSON.stringify(k.b2.map((x) => x.pts)))
  // da quang vang 40 % tren nen xam 64: 0,4 x (255, 204, 0) + 0,6 x 64 = (140, 120, 38)
  them('ANH GHIM: Enter luu anh THAT 900x600, net phong 1,5 lan dung cho, da quang TRON voi nen (140, 120, 38), cho khong ve con nguyen',
    !k.b3.loi && k.b3.rong === 900 && k.b3.cao === 600 && dac(k.b3.but, CAM) && gan(k.b3.butLech, [64, 64, 64]) && gan(k.b3.dq, [140, 120, 38], 8) && gan(k.b3.dqMep, [140, 120, 38], 8) && gan(k.b3.dqNgoai, [64, 64, 64]) && gan(k.b3.nen, [64, 64, 64]),
    k.b3.loi || ('but ' + k.b3.but + ' dq ' + k.b3.dq + ' ngoai ' + k.b3.dqNgoai))
  const la = (k.loiTrang || []).filter((l) => !l.includes('Inter.woff2')) // loi font bi CSP chan la loi CO SAN cua 2 trang (xem PROGRESS 06/10)
  them('khong co loi trong trang', la.length === 0, la.join(' | ').slice(0, 200))
  return ra
}

for (const tiLe of [1, 1.25, 1.5]) {
  const k = chay(tiLe, false)
  for (const m of cham(k)) kiem('[' + Math.round(tiLe * 100) + ' %] ' + m.ten, m.ok, m.chiTiet)
}

// ───────────── [3] Doi chung ─────────────
{
  const k = chay(1, true)
  const truot = cham(k).filter((m) => !m.ok).map((m) => m.ten)
  const canBat = ['BUT: giu chuot keo', 'DA QUANG: net 16 px', 'giu Shift', 'ANH GHIM: Enter luu']
  const sot = canBat.filter((c) => !truot.some((t) => t.startsWith(c)))
  kiem('[DOI CHUNG] ban hong (net khong dai ra, da quang thanh dac) bi bat o ca 4 muc: net but, do trong da quang, Shift, anh luu', sot.length === 0, sot.length ? 'KHONG bat duoc: ' + sot.join('; ') : truot.length + ' muc truot tren ban hong')
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
