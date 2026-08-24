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
  ipcMain, screen, desktopCapturer, nativeImage, clipboard,
} = require('electron')
const path = require('path')
const fs = require('fs')

const IS_DEV = process.argv.includes('--dev')
const IS_SELFTEST = process.argv.includes('--selftest')
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
  return img.resize({ width: 18, height: 18 })
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
  createPinWindow(cropped, screenX, screenY, Math.round(rect.w), Math.round(rect.h))
}

ipcMain.on('overlay:cancel', () => closeOverlay())

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

    // Tu kiem: chup cua so ghim -> DONG NO (duong da lam sap app) -> roi thoat.
    if (IS_SELFTEST) {
      setTimeout(() => saveCapture(win, 'selftest-pin.png'), 1000)
      setTimeout(() => { if (!win.isDestroyed()) win.close() }, 1500)
      setTimeout(() => forceQuit(), 2200)
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

ipcMain.on('pin:move', (e, dx, dy) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w) return
  const [x, y] = w.getPosition()
  w.setPosition(x + Math.round(dx), y + Math.round(dy))
})
