'use strict'
/* LUONG CHUP CHAY SAN (0.5.0, 15/09) — anh Tien: "quá chậm, anh muốn 30ms là tối đa".

   Van de: desktopCapturer.getSources co SAN ~400 ms (do 15/09: 5 lan 388-539 ms, trong
   do KHOA LUONG CHINH ~285 ms) -> bam phim toi overlay hien trung vi 581 ms (93 lan
   run-log 0.4.17). Khong native (anh chot 14/09) thi khong rut duoc.

   Cach nay: mot cua so AN giu luong getDisplayMedia cua TUNG man chay san o FPS thap
   (LUONG_FPS). Bam phim -> ve <video> len canvas = khung hinh co NGAY (do 15/09: 0,2-1,4
   ms), CPU nam nen 0,2-0,4 % ca app (10 s, 2 man 4K+2K). Khung duoc lay TRUOC khi overlay
   phu len -> video YouTube khong den (cai gia cua che do overlay-truoc cu).

   Duong du phong: luong chua san sang (2 s dau sau boot, vua doi man, vua ngu day) ->
   main.js roi ve grabDisplaysList() cu (grab-truoc). Log ghi `nguon=luong|grab`.

   ☠️ Bay da vap khi dung spike (15/09):
   - navigator.mediaDevices UNDEFINED tren data: URL -> phai loadFile (file://).
   - getDisplayMedia can USER GESTURE -> goi qua executeJavaScript(code, true).
   - Khong co setDisplayMediaRequestHandler thi getDisplayMedia TREO im lang (khong loi,
     khong resolve). Handler dat tren session cua cua so nay, chi tra loi cho chinh no.
   - Anh raw tu canvas la RGBA; nativeImage.createFromBitmap can BGRA (toBitmap) -> doi
     kenh o renderer (Uint32 xoay byte) truoc khi gui. */

const { BrowserWindow, desktopCapturer, screen, ipcMain, nativeImage, powerMonitor } = require('electron')
const path = require('path')

const LUONG_FPS = Number(process.env.AIO_LUONG_FPS) > 0 ? Number(process.env.AIO_LUONG_FPS) : 5
const TAT = process.env.AIO_LUONG === '0' // doi chung: ep di duong grab cu

let win = null
let ghiLog = () => {}
let sanSangLuc = 0 // Date.now() khi renderer bao 'san-sang' (0 = chua)
let cauHinh = []   // [{displayId, srcId, w, h, sf, bounds}]
let hangChon = []  // srcId cho setDisplayMediaRequestHandler, theo thu tu renderer xin
let dangKhoiDong = false
let timerLai = null
let gen = 0
let soLoiLienTiep = 0 // qua 3 lan loi lien tiep (vd mac tu choi quyen) thi NGUNG thu, cho doi man/boot sau
const cho = new Map() // gen -> { jpg: fn(list), resolve, list: Map(displayId -> item), can }

function sanSang() { return !TAT && sanSangLuc > 0 && win && !win.isDestroyed() }

async function khoiDong(opts) {
  if (TAT) return
  if (opts && opts.ghiLog) ghiLog = opts.ghiLog
  if (dangKhoiDong) return
  dangKhoiDong = true
  sanSangLuc = 0
  try {
    if (win && !win.isDestroyed()) { win.destroy() }
    win = null
    const t0 = Date.now()
    const displays = screen.getAllDisplays()
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 }, fetchWindowIcons: false })
    cauHinh = displays.map((d, i) => {
      const src = sources.find((s) => String(s.display_id) === String(d.id)) || sources[i] || sources[0]
      const sf = d.scaleFactor || 1
      return { displayId: d.id, srcId: src && src.id, w: Math.round(d.size.width * sf), h: Math.round(d.size.height * sf), sf, bounds: d.bounds }
    }).filter((c) => c.srcId)
    if (!cauHinh.length) { ghiLog('LUONG: khong co nguon man hinh'); dangKhoiDong = false; return }

    win = new BrowserWindow({
      width: 320, height: 200, show: false, skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload-luong.js'),
        contextIsolation: true, sandbox: false, backgroundThrottling: false,
      },
    })
    const w0 = win
    hangChon = cauHinh.map((c) => c.srcId)
    win.webContents.session.setDisplayMediaRequestHandler((req, cb) => {
      // Chi phuc vu cua so luong; cua so khac (khong co) thi tu choi.
      if (!win || win.isDestroyed() || req.frame !== win.webContents.mainFrame) { cb({}); return }
      const id = hangChon.shift()
      const src = sources.find((s) => s.id === id)
      if (!src) { cb({}); return }
      cb({ video: src })
    })
    win.on('closed', () => { if (win === w0) { win = null; sanSangLuc = 0 } })
    win.webContents.on('render-process-gone', (_e, d) => {
      ghiLog('LUONG: renderer chet (' + (d && d.reason) + ') -> khoi dong lai')
      lenLichLai(1500)
    })
    await win.loadFile(path.join(__dirname, 'luong', 'index.html'))
    if (win !== w0 || w0.isDestroyed()) return
    const cfg = cauHinh.map((c) => ({ displayId: String(c.displayId), w: c.w, h: c.h, fps: LUONG_FPS }))
    // ☠️ getDisplayMedia can user gesture -> executeJavaScript voi userGesture=true
    await w0.webContents.executeJavaScript('window.batDauLuong(' + JSON.stringify(cfg) + ')', true)
    ghiLog('LUONG: bat dau ' + cfg.length + ' man @' + LUONG_FPS + 'fps, chuan bi ' + (Date.now() - t0) + 'ms')
  } catch (e) {
    ghiLog('LUONG LOI khoi dong: ' + (e && e.message || e))
    lenLichLai(5000, true)
  } finally { dangKhoiDong = false }
}

function lenLichLai(ms, laLoi) {
  if (TAT) return
  if (laLoi) { soLoiLienTiep++; if (soLoiLienTiep > 3) { ghiLog('LUONG: loi 3 lan lien tiep -> ngung thu, dung duong grab cu'); sanSangLuc = 0; return } }
  sanSangLuc = 0
  if (timerLai) clearTimeout(timerLai)
  timerLai = setTimeout(() => { timerLai = null; khoiDong() }, ms)
}

ipcMain.on('luong:san-sang', (e, info) => {
  if (!win || e.sender.id !== win.webContents.id) return
  sanSangLuc = Date.now()
  soLoiLienTiep = 0
  ghiLog('LUONG: san sang ' + (info && info.man) + ' man [' + (info && info.kich || '') + ']')
})
ipcMain.on('luong:loi', (e, msg) => {
  if (!win || e.sender.id !== win.webContents.id) return
  ghiLog('LUONG LOI: ' + msg + ' -> thu lai sau 5s')
  lenLichLai(5000, true)
})
// Luong ket thuc (man rut, khoa man, ...) -> khoi dong lai
ipcMain.on('luong:ket-thuc', (e, id) => {
  if (!win || e.sender.id !== win.webContents.id) return
  ghiLog('LUONG: luong man ' + id + ' ket thuc -> khoi dong lai')
  lenLichLai(1500)
})

/* Khung ve: renderer gui 2 dot cho MOI man: 'jpg' truoc (nhe, de hien overlay), 'raw' sau
   (BGRA ~33MB/man 4K, de cat luc Xong). */
ipcMain.on('luong:khung', (e, d) => {
  if (!win || e.sender.id !== win.webContents.id) return
  const c = cho.get(d.gen)
  if (!c) return
  const cfg = cauHinh.find((x) => String(x.displayId) === String(d.displayId))
  const display = screen.getAllDisplays().find((x) => String(x.id) === String(d.displayId))
  if (!cfg || !display) return
  let item = c.list.get(d.displayId)
  if (!item) { item = { display, sf: cfg.sf, image: null, jpg: null }; c.list.set(d.displayId, item) }
  if (d.loai === 'jpg') {
    item.jpg = Buffer.from(d.buf)
    c.daJpg++
    if (c.daJpg === c.can && c.jpg) { c.jpg(Array.from(c.list.values())); c.jpg = null }
  } else if (d.loai === 'raw') {
    item.image = nativeImage.createFromBitmap(Buffer.from(d.buf), { width: d.w, height: d.h })
    c.daRaw++
    if (c.daRaw === c.can) { cho.delete(d.gen); c.resolve(Array.from(c.list.values())) }
  }
})

/** Lay khung hien tai cua MOI man. onJpg(list) goi som khi JPEG cua moi man da ve
    (item.image con null); promise resolve khi ca raw da ve (list day du, cung shape
    voi grabDisplaysList: {display, image, jpg, sf}). */
function layKhung(onJpg) {
  if (!sanSang()) return Promise.resolve([])
  gen++
  const g = gen
  return new Promise((resolve) => {
    const c = { jpg: onJpg, resolve, list: new Map(), can: cauHinh.length, daJpg: 0, daRaw: 0 }
    cho.set(g, c)
    win.webContents.send('luong:lay', { gen: g })
    // Khong ve du trong 3s -> tra cai da co (co the rong) + khoi dong lai luong
    setTimeout(() => {
      if (!cho.has(g)) return
      cho.delete(g)
      ghiLog('LUONG: het gio cho khung gen ' + g + ' (jpg ' + c.daJpg + '/' + c.can + ', raw ' + c.daRaw + '/' + c.can + ')')
      resolve(Array.from(c.list.values()).filter((x) => x.image))
      lenLichLai(500)
    }, 3000)
  })
}

/* Man hinh doi / may ngu day -> nguon doi -> khoi dong lai (debounce). */
function theoDoiMoiTruong() {
  if (TAT) return
  const lai = (ly) => { soLoiLienTiep = 0; ghiLog('LUONG: ' + ly + ' -> khoi dong lai'); lenLichLai(1200) }
  screen.on('display-added', () => lai('them man'))
  screen.on('display-removed', () => lai('rut man'))
  screen.on('display-metrics-changed', () => lai('doi man'))
  try {
    powerMonitor.on('resume', () => lai('may day'))
    powerMonitor.on('unlock-screen', () => lai('mo khoa'))
  } catch (e) {}
}

module.exports = { khoiDong, sanSang, layKhung, theoDoiMoiTruong, LUONG_FPS, TAT }
