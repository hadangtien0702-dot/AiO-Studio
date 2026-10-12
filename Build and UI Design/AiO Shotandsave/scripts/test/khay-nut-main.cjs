'use strict'
/* Phan Electron cua bai do "khay thu ve nut tron" (goi tu do-khay-nut.mjs). KHONG chay main.js cua app, khong hien
   cua so nao len man: moi cua so la offscreen. Dung THAT: src/khay-thu.js + trang khay (src/shelf) + san dien (src/dien)
   + nut tron (src/nut) va 3 preload cua chung. Gia lap: man hinh 1600x900, con tro, 6 anh trong khay.
   Chay: electron scripts/test/khay-nut-main.cjs <thu-muc-ra> */
const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const RA = process.argv[2] || path.join(ROOT, '.selftest', 'khay-nut')
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData'))
app.on('window-all-closed', () => {})
const { taoKhayThu } = require(path.join(ROOT, 'src', 'khay-thu.js'))
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

const WA = { x: 0, y: 0, width: 1600, height: 900 }
const KHAY = { x: 300, y: 200, width: 425, height: 129 }
const log = []
let giay = 5, ban = false, tuDong = false, conTro = { x: 5, y: 5 }, soAnh = 6
let vtLuu = null // vi tri nut nguoi dung keo toi (thay cho cau-hinh.json)
const mau = ['#2b5876', '#614385', '#134e5e', '#8e2d4f', '#b7791f', '#3f7a63', '#5a4d7a', '#7a4d4d']
const anh = (i, w, h) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><rect width="100%" height="100%" fill="' + mau[i % mau.length] + '"/></svg>')

ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Shift + `' })
ipcMain.on('khay:kieu', (e) => { e.returnValue = 'ngang' })

app.whenReady().then(async () => {
  const kq = { log }
  const loiTrang = []
  const khay = new BrowserWindow({ x: KHAY.x, y: KHAY.y, width: KHAY.width, height: KHAY.height, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: true, preload: path.join(ROOT, 'src', 'preload-shelf.js'), contextIsolation: true, sandbox: false } })
  khay.setBounds(KHAY)
  khay.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') loiTrang.push('khay: ' + (msg || e.message)) })
  await khay.loadFile(path.join(ROOT, 'src', 'shelf', 'index.html'))
  for (let i = 0; i < soAnh; i++) khay.webContents.send('shelf:add', { id: i + 1, seq: i + 1, thumb: anh(i, 160 + (i % 3) * 40, 100), filePath: 'x' + i, w: 1600, h: 1000, kb: 100 })
  await cho(500)
  const js = (w, s) => w.webContents.executeJavaScript(s, true)

  const kt = taoKhayThu({
    electron: { BrowserWindow, screen, ipcMain }, thuNghiem: true,
    hienSom: process.env.AIO_HIEN_SOM === '1' ? true : undefined, // 04/10: ep duong "hien cua so khay som" (mac dinh cua macOS) trong bai do an
    layKhay: () => khay, damBaoKhay: () => khay,
    anhMoiNhat: () => (soAnh ? anh(soAnh - 1, 200, 100) : ''), soAnh: () => soAnh,
    docGiay: () => giay, banKhac: () => ban, tuDong: () => tuDong,
    conTro: () => conTro, manCua: () => ({ id: 1, workArea: WA }),
    // 12/10: ep bat keo nut tren moi he dieu hanh. Doi chung: AIO_KEO_NUT=0 npm run test:khaynut -> 2 muc KEO + muc "Thu lai" phai TRUOT
    keoNut: process.env.AIO_KEO_NUT !== '0', docViTriNut: () => vtLuu, luuViTriNut: (v) => { vtLuu = v },
    ghiLog: (s) => log.push(s),
  })
  const trangKhay = () => js(khay, '({ an: document.body.classList.contains("an"), clip: getComputedStyle(document.getElementById("shelf")).clipPath, mo: getComputedStyle(document.getElementById("shelf")).opacity, anim: document.getAnimations().length, o: document.querySelectorAll(".item").length })')
  const trangNut = async () => { const n = kt._cuaSo().nut; return n ? js(n, '({ so: document.getElementById("so").textContent, matAnh: document.querySelector(".mat.anh").classList.contains("hien"), matLogo: document.querySelector(".mat.logo").classList.contains("hien"), coAnh: !!document.getElementById("anh").getAttribute("src"), rong: innerWidth, cao: innerHeight, tron: (() => { const r = document.getElementById("nut").getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })() })') : null }
  const trangDien = async () => { const d = kt._cuaSo().dien; return d ? js(d, '({ hinh: document.getElementById("san").children.length, rong: innerWidth, cao: innerHeight })') : null }
  const chupGiua = async (ten, saoMs) => { await cho(saoMs); const d = kt._cuaSo().dien; if (d) fs.writeFileSync(path.join(RA, ten + '.png'), (await d.webContents.capturePage()).toPNG()) }

  // [1] thong tin o anh
  kt.hienThang(khay)
  await cho(200)
  kq.thongTin = await js(khay, 'window.__khayThongTin()')
  kq.dau = { tt: kt.trangThai(), khay: await trangKhay() }

  // [2] THU ve (kieu B) — chup 1 khung giua chung de xem bang mat
  let t0 = Date.now()
  const pThu = kt.thu('bai do')
  chupGiua('thu-giua', 420)
  kq.thu = { ok: await pThu, ms: Date.now() - t0, tt: kt.trangThai(), khay: await trangKhay(), nut: await trangNut(), dien: await trangDien() }
  fs.writeFileSync(path.join(RA, 'nut-nghi.png'), (await kt._cuaSo().nut.webContents.capturePage()).toPNG())

  // [3] XUAT HIEN (kieu A)
  t0 = Date.now()
  const pMo = kt.bung('bai do')
  chupGiua('mo-giua', 260)
  kq.mo = { ok: await pMo, ms: Date.now() - t0, tt: kt.trangThai() }
  await cho(250)
  Object.assign(kq.mo, { khay: await trangKhay(), dien: await trangDien() })

  // [4] TU THU sau 5 giay khi con tro o ngoai
  tuDong = true; conTro = { x: 5, y: 5 }; kt.chamVao()
  t0 = Date.now()
  while (kt.trangThai() !== 'thu' && Date.now() - t0 < 9000) await cho(100)
  while (kt.dangChay()) await cho(50)
  kq.tuThu = { tt: kt.trangThai(), ms: Date.now() - t0 }

  // [5] DOI CHUNG: con tro nam trong khay -> KHONG thu; dang ban (keo / chup) -> KHONG thu
  await kt.bung('doi chung'); conTro = { x: KHAY.x + 50, y: KHAY.y + 50 }
  await cho(6300); kq.conTroTrong = kt.trangThai()
  conTro = { x: 5, y: 5 }; ban = true
  await cho(6300); kq.dangBan = kt.trangThai()
  ban = false; tuDong = false

  // [6] co anh moi DUNG LUC dang thu -> thu xong tu bung lai
  const p6 = kt.thu('anh moi giua chung'); await cho(200); kt.chamVao(); await p6
  t0 = Date.now(); while ((kt.trangThai() !== 'mo' || kt.dangChay()) && Date.now() - t0 < 4000) await cho(50)
  kq.anhMoiGiuaChung = { tt: kt.trangThai(), khay: await trangKhay() }

  // [7] an han nut (x) roi hien lai
  await kt.thu('truoc khi an'); kt.anHan()
  kq.anHan = { tt: kt.trangThai() }
  await kt.bung('sau khi an'); kq.anHan.sau = kt.trangThai(); kq.anHan.khay = await trangKhay()

  // [8] khay TRONG (0 anh): van thu duoc, nut la logo, khong so
  soAnh = 0; khay.webContents.send('shelf:cleared'); await cho(150)
  kq.trong = { ok: await kt.thu('khay trong'), tt: kt.trangThai(), nut: await trangNut() }
  await kt.bung('khay trong'); soAnh = 6
  for (let i = 0; i < soAnh; i++) khay.webContents.send('shelf:add', { id: 20 + i, seq: 20 + i, thumb: anh(i, 180, 100), filePath: 'y' + i, w: 1600, h: 1000, kb: 100 })
  await cho(300)

  // [8b] KEO nut tron (12/10): chuot gia lap vao chinh trang nut (pointerdown -> pointermove -> pointerup that cua trang)
  await kt.thu('truoc khi keo')
  {
    const n = kt._cuaSo().nut
    const chuot = (type, gx, gy, them) => n.webContents.sendInputEvent(Object.assign({ type, x: 40, y: 40, globalX: Math.round(gx), globalY: Math.round(gy), button: 'left', clickCount: 1 }, them || {}))
    const keo = async (dx, dy) => {
      const b = n.getBounds(), gx = b.x + 40, gy = b.y + 40
      chuot('mouseDown', gx, gy); await cho(40)
      for (let i = 1; i <= 8; i++) { chuot('mouseMove', gx + dx * i / 8, gy + dy * i / 8, { modifiers: ['leftButtonDown'] }); await cho(16) }
      chuot('mouseUp', gx + dx, gy + dy); await cho(150)
    }
    const b0 = n.getBounds()
    await keo(-300, -200)
    kq.keo = { truoc: b0, sau: n.getBounds(), tt: kt.trangThai(), luu: vtLuu && Object.assign({}, vtLuu) }
    await keo(-5000, -5000) // keo qua khoi man: phai bi kep lai trong vung lam viec
    kq.keo.kep = n.getBounds(); kq.keo.ttKep = kt.trangThai()
    await keo(3, 2)         // nhich duoi 5 px roi tha = BAM -> mo khay
    t0 = Date.now(); while ((kt.trangThai() !== 'mo' || kt.dangChay()) && Date.now() - t0 < 4000) await cho(50)
    kq.keo.bam = kt.trangThai()
    await kt.thu('sau khi keo') // thu lai: nut phai ve DUNG cho vua keo toi, khong ve goc
    kq.keo.lai = kt._cuaSo().nut.getBounds(); kq.keo.nut = await trangNut()
    await kt.bung('sau khi keo')
    kq.keo.cuoi = kt.trangThai()
  }

  // [9] DOI CHUNG HONG: san dien khong tra loi -> van phai ket thuc o trang thai dung (khong ket nua chung)
  await kt._cuaSo().dien.loadURL('about:blank')
  t0 = Date.now()
  kq.hongThu = { ok: await kt.thu('san dien hong'), ms: Date.now() - t0, tt: kt.trangThai(), nut: await trangNut() }
  t0 = Date.now()
  kq.hongMo = { ok: await kt.bung('san dien hong'), ms: Date.now() - t0, tt: kt.trangThai(), khay: await trangKhay() }

  kq.loiTrang = loiTrang
  fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 1))
  console.log('KQ=' + JSON.stringify(kq))
  kt.dongHet()
  app.quit()
})
