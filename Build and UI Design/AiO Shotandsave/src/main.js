'use strict'

/* =========================================================================
   AiO Shot & Save — tien trinh chinh (main process)
   -------------------------------------------------------------------------
   v0.1.0 — CHI hai viec: (1) chup vung chon, (2) ghim noi sticky len man hinh.
   Luu thu muc + keo-tha ra app khac => ban sau.

   Luong chup:
     phim tat / bam tray
       -> grab anh full-res cua man hinh DANG co con tro (truoc khi hien overlay)
       -> mo overlay opaque phu kin man hinh do, ve lai anh dong bang
       -> nguoi dung keo chon vung -> tha
       -> crop anh goc -> tao cua so GHIM dung tai cho, alwaysOnTop
   ========================================================================= */

const {
  app, BrowserWindow, Tray, Menu, globalShortcut,
  ipcMain, screen, desktopCapturer, nativeImage, clipboard, shell,
} = require('electron')
const path = require('path')
const fs = require('fs')
const kho = require('./kho')

const IS_DEV = process.argv.includes('--dev')
const IS_SELFTEST = process.argv.includes('--selftest')
const IS_DRAGTEST = process.argv.includes('--selftest-drag')
const HOTKEY = 'CommandOrControl+Shift+S'

/* ☠️ Khi chay dev/selftest, GHI LAI moi loi khong bat duoc ra file.
   Vap 24/08: selftest thoat app ngay sau khi ghim nen hop thoai loi bi nuot —
   bao "chay sach" trong khi app that su nem TypeError luc dong cua so ghim.
   Ban that KHONG dat handler nay: de Electron hien hop thoai, con hon loi im. */
if (IS_DEV || IS_SELFTEST) {
  process.on('uncaughtException', (err) => {
    console.error('[shotandsave] LOI KHONG BAT DUOC:', err)
    try {
      const dir = path.join(__dirname, '..', '.selftest')
      fs.mkdirSync(dir, { recursive: true })
      fs.appendFileSync(path.join(dir, 'errors.txt'), String((err && err.stack) || err) + '\n')
    } catch (e) {}
  })
}

/** Con tro app: tray + cac cua so dang song. */
let tray = null
let overlayWin = null
let shelfWin = null

/** Khay anh: id -> { id, filePath, image }. Anh THAT nam tren dia (kho.js). */
const shelfItems = new Map()
let shelfSeq = 0
/** Ghim tu khay xep chong nhe cho khoi de len nhau. */
let cascade = 0

/** Anh dang chup dở: { image: NativeImage full-res, display, scaleFactor }. */
let pending = null

/** Map webContents.id -> { image: NativeImage } cho tung cua so ghim (de Copy). */
const pins = new Map()

/* Chi chay mot ban. */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => startCapture())
}

app.setName('AiO Shot & Save')
if (process.platform === 'win32') app.setAppUserModelId('com.aiostudio.shotandsave')

app.whenReady().then(() => {
  createTray()
  registerHotkey()
  // Khong tu mo cua so nao — day la app song o khay he thong.

  // Che do tu kiem: tu chup -> tu chon vung -> tu ghim (de verify pipeline).
  if (IS_SELFTEST) setTimeout(() => startCapture(), 1200)

  // Do that viec KEO KHAY: kich thuoc co phinh ra khong (anh Tien bao loi 24/08).
  if (IS_DRAGTEST) setTimeout(() => doKeoKhay(), 1200)
})

// App song o tray: dong het cua so KHONG thoat app.
app.on('window-all-closed', (e) => {
  // Khong lam gi — giu app song. Thoat chi qua menu tray.
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

/* ---------------------------------------------------------------------- */
/* Tray + phim tat                                                         */
/* ---------------------------------------------------------------------- */

function trayIcon() {
  const p = path.join(__dirname, '..', 'assets', 'tray.png')
  const img = nativeImage.createFromPath(p)
  if (img.isEmpty()) return undefined
  // Logo AiO la 386x351 (KHONG vuong). Ep vao o vuong 18x18 la bop meo chu A —
  // chi ghim CHIEU CAO, de chieu rong tu theo ti le.
  return img.resize({ height: 16, quality: 'best' })
}

function createTray() {
  const icon = trayIcon()
  tray = new Tray(icon || nativeImage.createEmpty())
  tray.setToolTip('AiO Shot & Save')
  rebuildTrayMenu()
  // Bam trai vao tray = chup ngay.
  tray.on('click', () => startCapture())
}

function rebuildTrayMenu() {
  const menu = Menu.buildFromTemplate([
    { label: 'Chup vung chon', accelerator: HOTKEY, click: () => startCapture() },
    { type: 'separator' },
    { label: 'Hien khay anh', click: () => showShelf() },
    { label: 'Mo thu muc luu anh', click: () => shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh())) },
    { type: 'separator' },
    { label: 'AiO Shot & Save  v' + app.getVersion(), enabled: false },
    { type: 'separator' },
    { label: 'Thoat', click: () => { forceQuit() } },
  ])
  tray.setContextMenu(menu)
}

function forceQuit() {
  for (const w of BrowserWindow.getAllWindows()) w.destroy()
  app.quit()
}

/** [selftest] Chup noi dung mot cua so ra file PNG trong .selftest/. */
async function saveCapture(win, name) {
  try {
    if (!win || win.isDestroyed()) return
    const img = await win.webContents.capturePage()
    const dir = path.join(__dirname, '..', '.selftest')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, name), img.toPNG())
    if (IS_DEV || IS_SELFTEST) console.log('[selftest] luu', name)
  } catch (err) {
    console.error('[selftest] loi chup', name, err)
  }
}

function registerHotkey() {
  const ok = globalShortcut.register(HOTKEY, () => startCapture())
  if (!ok && IS_DEV) console.warn('[shotandsave] khong dang ky duoc phim tat', HOTKEY)
}

/* ---------------------------------------------------------------------- */
/* Chup: grab man hinh duoi con tro -> overlay chon vung                   */
/* ---------------------------------------------------------------------- */

async function startCapture() {
  if (overlayWin) return // dang chon vung, bo qua

  const cursor = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursor)

  let image
  try {
    image = await grabDisplay(display)
  } catch (err) {
    if (IS_DEV) console.error('[shotandsave] grab loi', err)
    return
  }
  if (!image || image.isEmpty()) return

  pending = { image, display, scaleFactor: display.scaleFactor || 1 }
  openOverlay(display, image)
}

/** Chup 1 man hinh o do phan giai that (device px). Tra ve NativeImage. */
async function grabDisplay(display) {
  const scale = display.scaleFactor || 1
  const w = Math.round(display.size.width * scale)
  const h = Math.round(display.size.height * scale)

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: w, height: h },
    fetchWindowIcons: false,
  })
  if (!sources.length) return null

  // Khop nguon voi dung man hinh theo display_id; khong khop thi lay cai dau.
  let src = sources.find((s) => String(s.display_id) === String(display.id))
  if (!src) {
    const all = screen.getAllDisplays()
    const idx = all.findIndex((d) => d.id === display.id)
    src = sources[idx] || sources[0]
  }
  return src.thumbnail
}

function openOverlay(display, image) {
  const b = display.bounds
  overlayWin = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false, transparent: false, backgroundColor: '#000000',
    alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    hasShadow: false, enableLargerThanScreen: true, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-overlay.js'),
      contextIsolation: true, sandbox: false,
    },
  })
  overlayWin.setAlwaysOnTop(true, 'screen-saver')

  overlayWin.loadFile(path.join(__dirname, 'overlay', 'index.html'))
  overlayWin.webContents.once('did-finish-load', () => {
    overlayWin.webContents.send('overlay:shot', {
      dataUrl: image.toDataURL(),
      cssWidth: b.width,
      cssHeight: b.height,
    })
    overlayWin.show()
    overlayWin.focus()

    // Tu kiem: chup lai chinh overlay -> tu xac nhan mot vung o giua man hinh.
    if (IS_SELFTEST) {
      const rw = Math.min(640, Math.round(b.width * 0.5))
      const rh = Math.min(420, Math.round(b.height * 0.5))
      const rx = Math.round((b.width - rw) / 2)
      const ry = Math.round((b.height - rh) / 2)
      setTimeout(() => saveCapture(overlayWin, 'selftest-overlay.png'), 900)
      setTimeout(() => handleConfirm({ x: rx, y: ry, w: rw, h: rh }), 1600)
    }
  })
  overlayWin.on('closed', () => { overlayWin = null })
}

function closeOverlay() {
  if (overlayWin) { overlayWin.close(); overlayWin = null }
  pending = null
}

/* ---------------------------------------------------------------------- */
/* Overlay -> xac nhan vung chon -> tao cua so GHIM                        */
/* ---------------------------------------------------------------------- */

// rect: { x, y, w, h } theo CSS px, goc = goc man hinh dang chon.
ipcMain.on('overlay:confirm', (_e, rect) => handleConfirm(rect))

function handleConfirm(rect) {
  if (!pending) { closeOverlay(); return }
  const { image, display, scaleFactor } = pending
  const b = display.bounds

  // Crop tren anh goc (device px).
  const cx = Math.max(0, Math.round(rect.x * scaleFactor))
  const cy = Math.max(0, Math.round(rect.y * scaleFactor))
  const cw = Math.max(1, Math.round(rect.w * scaleFactor))
  const ch = Math.max(1, Math.round(rect.h * scaleFactor))
  let cropped
  try {
    cropped = image.crop({ x: cx, y: cy, width: cw, height: ch })
  } catch (err) {
    if (IS_DEV) console.error('[shotandsave] crop loi', err, { cx, cy, cw, ch })
    closeOverlay()
    return
  }

  // Vi tri man hinh (DIP) noi se dat cua so ghim.
  const screenX = b.x + Math.round(rect.x)
  const screenY = b.y + Math.round(rect.y)

  closeOverlay()

  // 1) Luu file THAT tren dia truoc — de dong ghim / tat app khong mat anh.
  const filePath = kho.luuAnh(cropped)
  // 2) Vao khay (cho gom moi tam da chup).
  shelfAdd(cropped, filePath)
  // 3) Ghim noi ngay tai cho vua chon.
  createPinWindow(cropped, screenX, screenY, Math.round(rect.w), Math.round(rect.h))
}

ipcMain.on('overlay:cancel', () => closeOverlay())

/* ---------------------------------------------------------------------- */
/* KEO CUA SO — dung chung cho khay va cua so ghim                         */
/* ---------------------------------------------------------------------- */

/* ☠️ VAP 24/08 — anh Tien: *"drag cai khay la cang keo no tu scale to ra"*.
   Do that (`--selftest-drag`): 380x128 -> 384x252, moi buoc keo CAO THEM 1px.

   Goc: man hinh chinh chay DPI 1.25. Cach cu moi buoc lai `getPosition()` roi
   `setPosition()` — moi vong la mot lan doi DIP <-> pixel that, va SAI SO LAM
   TRON CONG DON vao kich thuoc.

   Chua: NEO bounds MOT LAN luc bat dau keo. Moi buoc tinh vi tri TUYET DOI tu
   neo do va `setBounds` co khai bao width/height — sai so khong con cho de
   tich luy. Tuyet doi KHONG doc lai `getPosition()` giua chung. */

/** webContents.id -> bounds luc bat dau keo. */
const dragAnchors = new Map()

function batDauKeo(win, wcId) {
  if (!win || win.isDestroyed()) return
  dragAnchors.set(wcId, win.getBounds())
}

function keoDen(win, wcId, tongDx, tongDy) {
  if (!win || win.isDestroyed()) return
  const neo = dragAnchors.get(wcId)
  if (!neo) return
  win.setBounds({
    x: neo.x + Math.round(tongDx),
    y: neo.y + Math.round(tongDy),
    width: neo.width,   // khoa cung — khong cho phinh
    height: neo.height,
  })
}

function ketThucKeo(wcId) {
  dragAnchors.delete(wcId)
}

/* ---------------------------------------------------------------------- */
/* Cua so GHIM (sticky)                                                    */
/* ---------------------------------------------------------------------- */

const PIN_PAD = 12 // le trong suot quanh anh de co bong + goc bo tron

function createPinWindow(image, screenX, screenY, dipW, dipH) {
  const win = new BrowserWindow({
    x: screenX - PIN_PAD,
    y: screenY - PIN_PAD,
    width: dipW + PIN_PAD * 2,
    height: dipH + PIN_PAD * 2,
    frame: false, transparent: true, backgroundColor: '#00000000',
    alwaysOnTop: true, skipTaskbar: true, resizable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    hasShadow: false, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-pin.js'),
      contextIsolation: true, sandbox: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')

  const dataUrl = image.toDataURL()

  // ☠️ Nho `id` NGAY BAY GIO. Trong handler 'closed', `win.webContents` da bi
  // huy — doc `.id` tu no nem "Object has been destroyed" (vap 24/08).
  const wcId = win.webContents.id
  pins.set(wcId, { image })

  win.loadFile(path.join(__dirname, 'pin', 'index.html'))
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('pin:data', { dataUrl, pad: PIN_PAD, w: dipW, h: dipH })
    win.show()

    // Tu kiem: chup ghim + KHAY -> dong ghim (duong da lam sap app) -> thoat.
    if (IS_SELFTEST) {
      setTimeout(() => saveCapture(win, 'selftest-pin.png'), 1000)
      setTimeout(() => saveCapture(shelfWin, 'selftest-shelf.png'), 1300)
      setTimeout(() => { if (!win.isDestroyed()) win.close() }, 1700)
      setTimeout(() => forceQuit(), 2400)
    }
  })
  win.on('closed', () => { pins.delete(wcId) })
}

ipcMain.on('pin:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w) w.close()
})

ipcMain.on('pin:copy', (e) => {
  const rec = pins.get(e.sender.id)
  if (rec && rec.image) clipboard.writeImage(rec.image)
})

ipcMain.on('pin:opacity', (e, value) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w) w.setOpacity(Math.max(0.2, Math.min(1, value)))
})

ipcMain.on('pin:drag-start', (e) => {
  batDauKeo(BrowserWindow.fromWebContents(e.sender), e.sender.id)
})
ipcMain.on('pin:drag-to', (e, tongDx, tongDy) => {
  keoDen(BrowserWindow.fromWebContents(e.sender), e.sender.id, tongDx, tongDy)
})
ipcMain.on('pin:drag-end', (e) => ketThucKeo(e.sender.id))

/* ---------------------------------------------------------------------- */
/* KHAY ANH — cho gom moi tam da chup                                      */
/* ---------------------------------------------------------------------- */

const SHELF_W = 380
const SHELF_H = 128
const SHELF_MARGIN = 16 // cach mep man hinh khi lan dau

/** Vi tri mo khay: lay tu cau hinh, khong co thi goc phai duoi man hinh chinh. */
function viTriKhay() {
  const luu = kho.docCauHinh().viTriKhay
  if (luu && Number.isFinite(luu.x) && Number.isFinite(luu.y) && trongManHinh(luu)) {
    return luu
  }
  const wa = screen.getPrimaryDisplay().workArea
  return {
    x: wa.x + wa.width - SHELF_W - SHELF_MARGIN,
    y: wa.y + wa.height - SHELF_H - SHELF_MARGIN,
  }
}

/** Vi tri da luu co con nam tren mot man hinh nao khong (thao man hinh phu). */
function trongManHinh(p) {
  return screen.getAllDisplays().some((d) => {
    const b = d.workArea
    return p.x < b.x + b.width && p.x + SHELF_W > b.x &&
           p.y < b.y + b.height && p.y + SHELF_H > b.y
  })
}

function ensureShelf() {
  if (shelfWin && !shelfWin.isDestroyed()) return shelfWin

  const pos = viTriKhay()
  shelfWin = new BrowserWindow({
    x: pos.x, y: pos.y, width: SHELF_W, height: SHELF_H,
    frame: false, transparent: true, backgroundColor: '#00000000',
    alwaysOnTop: true, skipTaskbar: true, resizable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    hasShadow: false, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-shelf.js'),
      contextIsolation: true, sandbox: false,
    },
  })
  shelfWin.setAlwaysOnTop(true, 'screen-saver')
  shelfWin.loadFile(path.join(__dirname, 'shelf', 'index.html'))
  shelfWin.on('closed', () => { shelfWin = null })
  return shelfWin
}

/**
 * Hien khay MA KHONG cuop focus — nguoi dung dang dung Premiere, keo focus
 * sang khay la lam gian doan viec cua ho.
 */
function showShelf() {
  const w = ensureShelf()
  if (!w.isVisible()) w.showInactive()
}

/** Them mot anh vao khay (goi sau khi da luu file). */
function shelfAdd(image, filePath) {
  const w = ensureShelf()
  const id = ++shelfSeq
  shelfItems.set(id, { id, filePath, image })

  // Thumbnail nho de gui qua IPC cho nhe — anh goc van giu trong shelfItems.
  const thumb = image.resize({ height: 128, quality: 'good' }).toDataURL()

  const send = () => w.webContents.send('shelf:add', { id, thumb, filePath })
  if (w.webContents.isLoading()) {
    w.webContents.once('did-finish-load', send)
  } else {
    send()
  }
  showShelf()
}

ipcMain.on('shelf:pin', (_e, id) => {
  const it = shelfItems.get(id)
  if (!it) return
  // Dat gan giua man hinh dang co con tro, xep chong nhe cho de nhin.
  const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const size = it.image.getSize()
  const scale = d.scaleFactor || 1
  const dipW = Math.round(size.width / scale)
  const dipH = Math.round(size.height / scale)
  const off = (cascade++ % 6) * 24
  const x = d.workArea.x + Math.round((d.workArea.width - dipW) / 2) + off
  const y = d.workArea.y + Math.round((d.workArea.height - dipH) / 2) + off
  createPinWindow(it.image, x, y, dipW, dipH)
})

ipcMain.on('shelf:remove', (e, id) => {
  // CHI bo khoi khay — file tren dia GIU NGUYEN (xoa file cua nguoi dung phai
  // do chinh ho quyet dinh, khong phai mot cu bam nham trong khay).
  shelfItems.delete(id)
  e.sender.send('shelf:removed', id)
})

ipcMain.on('shelf:clear', (e) => {
  shelfItems.clear()
  e.sender.send('shelf:cleared')
})

ipcMain.on('shelf:open-folder', () => {
  try {
    shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh()))
  } catch (err) {
    console.error('[shotandsave] khong mo duoc thu muc:', err)
  }
})

ipcMain.on('shelf:hide', () => {
  if (shelfWin && !shelfWin.isDestroyed()) shelfWin.hide()
})

ipcMain.on('shelf:drag-start', (e) => {
  batDauKeo(BrowserWindow.fromWebContents(e.sender), e.sender.id)
})
ipcMain.on('shelf:drag-to', (e, tongDx, tongDy) => {
  keoDen(BrowserWindow.fromWebContents(e.sender), e.sender.id, tongDx, tongDy)
})
ipcMain.on('shelf:drag-end', (e) => ketThucKeo(e.sender.id))

/* ── [do that] Keo khay co lam no phinh ra khong? ────────────────────────
   Anh Tien 24/08: *"drag cai khay la cang nay no tu scale to ra"*. Khong doan
   nguyen nhan — mo phong dung duong ma renderer goi (`shelf:move` tung buoc
   nho), ghi lai kich thuoc sau moi buoc, keo QUA CA man hinh thu hai vi may
   anh Tien co 2 man khac DPI. */
function doKeoKhay() {
  const dong = []
  const w = ensureShelf()
  w.showInactive()

  const ghi = (nhan) => {
    const b = w.getBounds()
    dong.push(`${nhan}\tx=${b.x}\ty=${b.y}\tw=${b.width}\th=${b.height}`)
  }

  dong.push('=== MAN HINH ===')
  for (const d of screen.getAllDisplays()) {
    dong.push(`display ${d.id}\tscale=${d.scaleFactor}\tbounds=${JSON.stringify(d.bounds)}`)
  }
  dong.push(`=== KHAY: kich thuoc khai bao ${SHELF_W}x${SHELF_H} ===`)

  /* ☠️ Moc so sanh la bounds NGAY TRUOC KHI KEO, khong phai hang SHELF_W/H.
     Cua so tao ra o DPI 1.25 bao ve 382x130 du xin 380x128 — do la quy doi
     DIP, khong phai phinh. So voi hang so thi phep do bao dong gia. */
  const truoc = w.getBounds()
  ghi('truoc-khi-keo')

  // Keo 120 buoc x 12px sang trai -> di qua man hinh khac (neu co).
  // Di dung duong THAT ma renderer goi: neo mot lan, roi gui delta TUYET DOI.
  const wcId = w.webContents.id
  batDauKeo(w, wcId)
  let buoc = 0
  const timer = setInterval(() => {
    buoc++
    keoDen(w, wcId, -12 * buoc, 0)
    if (buoc % 20 === 0) ghi(`sau-${buoc}-buoc`)
    if (buoc >= 120) {
      clearInterval(timer)
      ketThucKeo(wcId)
      ghi('ket-thuc')
      const b = w.getBounds()
      const phinh = b.width !== truoc.width || b.height !== truoc.height
      dong.push(phinh
        ? `KET LUAN: KHAY DA PHINH khi keo — ${truoc.width}x${truoc.height} -> ${b.width}x${b.height}`
        : `KET LUAN: OK — giu nguyen ${b.width}x${b.height} sau 120 buoc keo`)
      try {
        const dir = path.join(__dirname, '..', '.selftest')
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'drag.txt'), dong.join('\n') + '\n')
      } catch (err) { console.error(err) }
      console.log(dong.join('\n'))
      setTimeout(() => forceQuit(), 400)
    }
  }, 16)
}

ipcMain.on('shelf:save-pos', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w || w.isDestroyed()) return
  const [x, y] = w.getPosition()
  kho.ghiCauHinh({ viTriKhay: { x, y } })
})
