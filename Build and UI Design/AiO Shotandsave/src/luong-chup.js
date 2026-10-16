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
/* 16/09: JPEG NHANH (0.5.2) TAT mac dinh — anh: "co mot cai gi no chop len rat nhanh... rat kho chiu";
   doi mo -> net sau ~100 ms chinh la cu chop. AIO_NHANH=1 de bat lai khi can doi chung. */
const NHANH = process.env.AIO_NHANH === '1'

let win = null
let ghiLog = () => {}
let sanSangLuc = 0 // Date.now() khi renderer bao 'san-sang' (0 = chua)
let cauHinh = []   // [{displayId, srcId, w, h, sf, bounds}]
let hangChon = []  // srcId (hoac { id, tieng } cho QUAY VIDEO) cho setDisplayMediaRequestHandler, theo thu tu renderer xin
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
      const muc = hangChon.shift()
      const id = muc && typeof muc === 'object' ? muc.id : muc
      const src = sources.find((s) => s.id === id)
      if (!src) { cb({}); return }
      // 01/10 QUAY VIDEO co tieng may: 'loopback' = tieng dang phat tren may (do: AAC 48 kHz 2 kenh). Chi Windows.
      if (muc && typeof muc === 'object' && muc.tieng) cb({ video: src, audio: 'loopback' })
      else cb({ video: src })
    })
    win.on('closed', () => { if (win === w0) { win = null; sanSangLuc = 0; ketQuay('cua so luong dong') } })
    win.webContents.on('render-process-gone', (_e, d) => {
      ghiLog('LUONG: renderer chet (' + (d && d.reason) + ') -> khoi dong lai')
      ketQuay('renderer luong chet')
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
  if (!item) { item = { display, sf: cfg.sf, image: null, jpg: null, jpgNhanh: null }; c.list.set(d.displayId, item) }
  if (d.loai === 'nhanh') {
    item.jpgNhanh = Buffer.from(d.buf)
    c.daNhanh++
    if (c.daNhanh === c.can && c.nhanh) { c.nhanh(Array.from(c.list.values())); c.nhanh = null }
  } else if (d.loai === 'jpg') {
    item.jpg = Buffer.from(d.buf)
    item.doJpg = d.do || null   // 07/10: bam gio tung buoc cua renderer luong (cho lenh · ve · nen)
    c.daJpg++
    if (c.daJpg === c.can && c.jpg) { c.jpg(Array.from(c.list.values())); c.jpg = null }
  } else if (d.loai === 'raw') {
    const tAnh = Date.now()
    item.image = nativeImage.createFromBitmap(Buffer.from(d.buf), { width: d.w, height: d.h })
    // 07/10: doc diem · doi mau (renderer) · gui (IPC ~33 MB/man 4K) · tao anh (main)
    item.doRaw = d.do ? { doc: d.do.doc, doi: d.do.doi, gui: d.do.luc ? Math.max(0, tAnh - d.do.luc) : -1, anh: Date.now() - tAnh } : null
    c.daRaw++
    if (c.daRaw === c.can) { cho.delete(d.gen); c.resolve(Array.from(c.list.values())) }
  }
})

/** Lay khung hien tai cua MOI man. onNhanh(list) goi khi JPEG NHANH (nua do phan giai) cua moi man
    da ve (item.jpgNhanh); onJpg(list) goi som khi JPEG cua moi man da ve
    (item.image con null); promise resolve khi ca raw da ve (list day du, cung shape
    voi grabDisplaysList: {display, image, jpg, sf}). */
function layKhung(onNhanh, onJpg) {
  if (!sanSang()) return Promise.resolve([])
  gen++
  const g = gen
  return new Promise((resolve) => {
    const c = { nhanh: NHANH ? onNhanh : null, jpg: onJpg, resolve, list: new Map(), can: cauHinh.length, daNhanh: 0, daJpg: 0, daRaw: 0 }
    cho.set(g, c)
    win.webContents.send('luong:lay', { gen: g, nhanh: NHANH, gui: Date.now() })
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

/* 28/09 QUAY 3 GIAY: cat DUNG vung khoanh tu video dang chay (renderer luong.js onCat) -> Buffer JPEG.
   Tra null neu luong chua san sang / loi / qua 1,5 s (nguoi goi tu roi ve duong grab). */
let soCat = 0
const choCat = new Map() // id -> resolve
ipcMain.on('luong:cat-xong', (e, d) => {
  if (!win || e.sender.id !== win.webContents.id) return
  const r = choCat.get(d.id)
  if (!r) return
  choCat.delete(d.id)
  if (d.loi || !d.buf) { ghiLog('LUONG cat loi: ' + d.loi); r(null); return }
  r({ buf: Buffer.from(d.buf), w: d.w, h: d.h })
})
function catVung(display, rect) {
  if (!sanSang()) return Promise.resolve(null)
  const id = ++soCat
  return new Promise((resolve) => {
    choCat.set(id, resolve)
    win.webContents.send('luong:cat', {
      id, displayId: String(display.id), rect,
      dipW: display.bounds.width, dipH: display.bounds.height,
    })
    setTimeout(() => { if (choCat.has(id)) { choCat.delete(id); ghiLog('LUONG cat het gio id ' + id); resolve(null) } }, 1500)
  })
}

/* ── 01/10 QUAY VIDEO vung man hinh (anh chot: bam Dung, nut bat tieng may, MP4) ─────────────────────────
   Renderer luong (cua so AN nay) mo THEM mot luong getDisplayMedia 30 fps cua dung man do (luong 5 fps chay san
   giu nguyen), cat vung -> canvas -> MediaRecorder MP4 H.264 (+AAC). Do 01/10 tren Electron 43.4.1, cua so an:
   vung 1280x720 tu man 4K = 119-120 khung / 4 s; ca man 3840x2160 = 118 khung / 3,93 s; vung le 37x23 -> 36x22.
   File la MP4 PHAN MANH (moof/mdat), cu ~1 s renderer gui 1 khuc -> main ghi noi vao dia (khong giu ca doan trong
   RAM: 5 phut x 8 Mbit/s = 300 MB). Trinh phat Chromium doc dung thoi luong + tua duoc (do).
   Moi luc chi MOT luot quay. onKhuc(Buffer) goi theo dung thu tu; onXong({ loi, ms, khung }) goi DUNG 1 lan. */
let quay = null // { id, onKhuc, onXong }
let soQuay = 0

function ketQuay(loi, info) {
  const q = quay
  if (!q) return
  quay = null
  try { q.onXong(Object.assign({ loi: loi || null }, info || {})) } catch (e) { ghiLog('LUONG quay onXong loi: ' + e.message) }
}

ipcMain.on('luong:quay-khuc', (e, d) => {
  if (!win || e.sender.id !== win.webContents.id || !quay || d.id !== quay.id || !d.buf) return
  try { quay.onKhuc(Buffer.from(d.buf)) } catch (err) { ghiLog('LUONG quay onKhuc loi: ' + err.message) }
})
ipcMain.on('luong:quay-xong', (e, d) => {
  if (!win || e.sender.id !== win.webContents.id || !quay || d.id !== quay.id) return
  ketQuay(d.loi, { ms: d.ms, khung: d.khung, tre: d.tre || null, treTieng: d.treTieng || 0 })
})

/* Bat dau quay vung `rect` (DIP cuc bo cua man `display`). opts: { tieng, onKhuc, onXong }.
   Tra ve { ok, w, h, mime, duoi, tieng, msMo } hoac { ok: false, loi }. */
async function batDauQuay(display, rect, opts) {
  if (!sanSang()) return { ok: false, loi: 'luong chua san sang' }
  if (quay) return { ok: false, loi: 'dang quay' }
  const cfg = cauHinh.find((c) => String(c.displayId) === String(display.id))
  if (!cfg) return { ok: false, loi: 'khong co nguon cho man ' + display.id }
  const id = ++soQuay
  const tieng = !!(opts && opts.tieng) && process.platform === 'win32'
  quay = { id, onKhuc: opts.onKhuc, onXong: opts.onXong }
  hangChon.push({ id: cfg.srcId, tieng })
  const q = {
    id, tieng, rect, w: cfg.w, h: cfg.h,
    dipW: display.bounds.width, dipH: display.bounds.height,
    // opts.fps / opts.nhip chi de bai do so cac cach (scripts/test/do-nhip-quay.mjs); app goi khong truyen -> mac dinh
    fps: (opts && opts.fps) || QUAY_FPS, nhip: (opts && opts.nhip) || QUAY_NHIP,
    treTieng: (opts && typeof opts.treTieng === 'number') ? opts.treTieng : undefined, // ms, chi bai do truyen
    displayId: String(display.id), nang: !(opts && opts.nang === false), // nang = nang luong chay san len q.fps khi quay
    toiDaW: QUAY_TOI_DA.w, toiDaH: QUAY_TOI_DA.h,
  }
  try {
    // ☠️ getDisplayMedia can user gesture -> executeJavaScript voi userGesture=true (nhu batDauLuong)
    const r = await win.webContents.executeJavaScript('window.batDauQuay(' + JSON.stringify(q) + ')', true)
    if (!r || !r.ok) { quay = null; return { ok: false, loi: (r && r.loi) || 'renderer khong tra loi' } }
    return r
  } catch (e) {
    quay = null
    return { ok: false, loi: (e && e.message) || String(e) }
  }
}

/* Bao renderer dung. Ket qua ve qua onXong; qua 4 s khong thay thi tu ket (file da ghi toi khuc cuoi van phat duoc). */
function dungQuay() {
  if (!quay) return
  const id = quay.id
  if (win && !win.isDestroyed()) win.webContents.send('luong:quay-dung', { id })
  setTimeout(() => { if (quay && quay.id === id) { ghiLog('LUONG quay: het gio cho renderer dung'); ketQuay('het gio dung') } }, 4000)
}

const QUAY_FPS = 30
const QUAY_NHIP = 'xuly' // 'xuly' (mac dinh) | 'khung' (du phong) | 'dongho' (cach cu, doi chung) — xem src/luong/luong.js
/* Tran co video ra: vung to hon thi THU NHO cho vua (giu ti le). Anh: "khong can nang de dep, can nhe de nhanh".
   2560x1440 = man 2K nguyen co; ca man 4K ra 2560x1440. */
const QUAY_TOI_DA = { w: 2560, h: 1440 }

/* Man hinh doi / may ngu day -> nguon doi -> khoi dong lai (debounce). */
function theoDoiMoiTruong() {
  if (TAT) return
  const lai = (ly) => {
    // Dang quay video thi KHONG pha cua so luong (doan quay se dut): doi quay xong roi moi khoi dong lai.
    if (quay) { ghiLog('LUONG: ' + ly + ' nhung dang quay video -> hoan khoi dong lai'); setTimeout(() => lai(ly), 3000); return }
    soLoiLienTiep = 0; ghiLog('LUONG: ' + ly + ' -> khoi dong lai'); lenLichLai(1200)
  }
  screen.on('display-added', () => lai('them man'))
  screen.on('display-removed', () => lai('rut man'))
  screen.on('display-metrics-changed', () => lai('doi man'))
  try {
    powerMonitor.on('resume', () => lai('may day'))
    powerMonitor.on('unlock-screen', () => lai('mo khoa'))
  } catch (e) {}
}

module.exports = { khoiDong, sanSang, layKhung, catVung, batDauQuay, dungQuay, theoDoiMoiTruong, LUONG_FPS, TAT, NHANH }
