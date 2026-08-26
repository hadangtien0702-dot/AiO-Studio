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
  ipcMain, screen, desktopCapturer, nativeImage, clipboard, shell, dialog,
} = require('electron')
const path = require('path')
const fs = require('fs')
const kho = require('./kho')
const i18n = require('./i18n')

const IS_DEV = process.argv.includes('--dev')
const IS_SELFTEST = process.argv.includes('--selftest')
const IS_DRAGTEST = process.argv.includes('--selftest-drag')
const DEFAULT_HOTKEY = 'CommandOrControl+Shift+S'
let currentHotkey = DEFAULT_HOTKEY // nap tu config khi app ready
let lang = 'vi' // 'vi' | 'en' — nap tu config
const T = (key) => i18n.t(lang, key)

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

/* Nhat ky chay nhe (LUON bat) — de nguoi dung gap loi la co dau vet ngay.
   File .run-log.txt canh ma nguon, da gitignore. Tu cat khi qua 300KB. */
const RUN_LOG = path.join(__dirname, '..', '.run-log.txt')
function ghiLog(msg) {
  try {
    const dong = new Date().toISOString().slice(11, 23) + ' ' + msg + '\n'
    try { if (fs.statSync(RUN_LOG).size > 300 * 1024) fs.writeFileSync(RUN_LOG, '') } catch (e) {}
    fs.appendFileSync(RUN_LOG, dong)
  } catch (e) {}
}

/** Con tro app: tray + cac cua so dang song. */
let tray = null
let overlayWins = [] // mot overlay MOI man hinh (moi man mot cua so)
const overlayShots = new Map() // wcId -> { image (full-res), sf } de cat sau
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
  currentHotkey = kho.docCauHinh().hotkey || DEFAULT_HOTKEY
  lang = kho.docCauHinh().lang || 'vi'
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
    { label: T('tray.chup'), accelerator: currentHotkey, click: () => startCapture() },
    { type: 'separator' },
    { label: T('tray.khay'), click: () => showShelf() },
    { label: T('tray.moThuMuc'), click: () => shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh())) },
    { type: 'separator' },
    { label: T('tray.caiDat'), click: () => openSettings() },
    { type: 'separator' },
    { label: 'AiO Shot & Save  v' + app.getVersion(), enabled: false },
    { type: 'separator' },
    { label: T('tray.thoat'), click: () => { forceQuit() } },
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
  let ok = false
  try { ok = globalShortcut.register(currentHotkey, () => startCapture()) }
  catch (e) { ok = false }
  if (!ok && IS_DEV) console.warn('[shotandsave] khong dang ky duoc phim tat', currentHotkey)
  return ok
}

/* Doi phim tat: thu dang ky phim moi. That bai (app khac dang giu) thi KHOI
   PHUC phim cu va bao that bai — khong de nguoi dung mat luon phim tat. */
function setHotkey(accel) {
  const old = currentHotkey
  globalShortcut.unregisterAll()
  let ok = false
  try { ok = globalShortcut.register(accel, () => startCapture()) } catch (e) { ok = false }
  if (!ok) {
    try { globalShortcut.register(old, () => startCapture()) } catch (e) {}
    return { ok: false, hotkey: old }
  }
  currentHotkey = accel
  kho.ghiCauHinh({ hotkey: accel })
  rebuildTrayMenu()
  return { ok: true, hotkey: accel }
}

/* Dinh dang luu anh tu config (anh Tien 26/08): mac dinh JPEG chat luong CAO. */
// Anh Tien 26/08: "basic nhat cung phai ~100KB" — nang toan bo thang chat luong.
// Do that vung 1200x700 man 4K: q95~101KB, nen thap=95, cao=98, sieu=100.
const CHAT_LUONG_Q = { thap: 95, cao: 98, sieu: 100 }
function layDinhDangAnh() {
  const c = kho.docCauHinh()
  const loai = c.anhLoai === 'png' ? 'png' : 'jpeg'
  const q = CHAT_LUONG_Q[c.anhChatLuong] || CHAT_LUONG_Q.cao
  return { loai, q }
}

/* --- Cua so Cai dat --- */
let settingsWin = null
function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return }
  settingsWin = new BrowserWindow({
    width: 440, height: 584, resizable: false, minimizable: false,
    maximizable: false, fullscreenable: false,
    frame: false, // header rieng co logo AiO (xem settings/index.html)
    title: 'AiO Shot & Save - Cai dat', backgroundColor: '#141414', show: false,
    icon: path.join(__dirname, '..', 'assets', 'app.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-settings.js'),
      contextIsolation: true, sandbox: false,
    },
  })
  settingsWin.loadFile(path.join(__dirname, 'settings', 'index.html'))
  settingsWin.once('ready-to-show', () => settingsWin.show())
  settingsWin.on('closed', () => { settingsWin = null })
}

ipcMain.handle('settings:get', () => {
  const c = kho.docCauHinh()
  return {
    hotkey: currentHotkey, def: DEFAULT_HOTKEY, isMac: process.platform === 'darwin',
    saveFolder: kho.thuMucAnh(), lang, version: app.getVersion(),
    anhLoai: c.anhLoai === 'png' ? 'png' : 'jpeg',
    anhChatLuong: CHAT_LUONG_Q[c.anhChatLuong] ? c.anhChatLuong : 'cao',
  }
})

/* Doi dinh dang / chat luong anh — ap dung ngay tu lan chup sau. */
ipcMain.handle('settings:set-anh', (_e, d) => {
  const patch = {}
  if (d && (d.anhLoai === 'png' || d.anhLoai === 'jpeg')) patch.anhLoai = d.anhLoai
  if (d && CHAT_LUONG_Q[d.anhChatLuong]) patch.anhChatLuong = d.anhChatLuong
  kho.ghiCauHinh(patch)
  ghiLog('doi dinh dang anh: ' + JSON.stringify(patch))
  return layDinhDangAnh()
})

// Preload nap lang DONG BO luc khoi tao renderer.
ipcMain.on('i18n:lang', (e) => { e.returnValue = lang })

/** Dinh dang phim tat cho de doc: CommandOrControl->Ctrl/⌘, ghep " + ". */
function formatAccel(accel) {
  const isMac = process.platform === 'darwin'
  return (accel || '').split('+').map((x) => {
    if (x === 'CommandOrControl' || x === 'CmdOrCtrl') return isMac ? '⌘' : 'Ctrl'
    if (x === 'Cmd' || x === 'Command') return '⌘'
    if (x === 'Alt' || x === 'Option') return isMac ? '⌥' : 'Alt'
    if (x === 'Shift') return isMac ? '⇧' : 'Shift'
    if (x === 'Ctrl' || x === 'Control') return 'Ctrl'
    return x
  }).join(' + ')
}
ipcMain.on('hotkey:display', (e) => { e.returnValue = formatAccel(currentHotkey) })

// Doi ngon ngu: luu, cap nhat tray, NAP LAI cac cua so dang mo de dich lai.
ipcMain.handle('settings:set-lang', (_e, l) => {
  lang = (l === 'en') ? 'en' : 'vi'
  kho.ghiCauHinh({ lang })
  rebuildTrayMenu()
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.reload()
  }
  return { lang }
})

ipcMain.on('settings:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w && !w.isDestroyed()) w.close()
})
ipcMain.handle('settings:set-hotkey', (_e, accel) => setHotkey(accel))

/* Chon thu muc luu anh. Tra { folder } (thu muc moi) hoac { folder, huy:true }. */
ipcMain.handle('settings:pick-folder', async (e) => {
  const parent = BrowserWindow.fromWebContents(e.sender)
  const res = await dialog.showOpenDialog(parent, {
    title: 'Chon thu muc luu anh',
    defaultPath: kho.thuMucAnh(),
    properties: ['openDirectory', 'createDirectory'],
  })
  if (res.canceled || !res.filePaths.length) return { folder: kho.thuMucAnh(), huy: true }
  const folder = res.filePaths[0]
  kho.ghiCauHinh({ thuMucAnh: folder })
  return { folder }
})

/* Mo thu muc luu anh hien tai trong Explorer. */
ipcMain.handle('settings:open-folder', () => {
  shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh()))
})
ipcMain.handle('settings:reset', () => setHotkey(DEFAULT_HOTKEY))

/* ---------------------------------------------------------------------- */
/* Chup: grab man hinh duoi con tro -> overlay chon vung                   */
/* ---------------------------------------------------------------------- */

let grabPromise = null
let grabStarted = false

async function startCapture() {
  if (overlayWins.length) return // dang chon vung, bo qua

  const displays = screen.getAllDisplays()
  if (!displays.length) return

  // Overlay hien NGAY (trong suot, thay man hinh THAT qua no) — tuc thi nhu
  // Lightshot. Grab bat dau SAU khi overlay da hien (kickGrab, goi tu overlay
  // dau tien) vi getSources CHAN luong chinh ~0,5s: goi truoc la overlay khong
  // kip hien.
  grabStarted = false
  grabPromise = null
  napManCache()
  ghiLog('capture-start displays=' + displays.length + ' ' +
    manCache.map((m) => m.px + ',' + m.py + ' ' + m.pw + 'x' + m.ph + '@' + m.sf).join(' | '))
  openOverlays(displays)
}

/* Bat dau grab — goi SAU khi overlay dau tien da hien + paint. Chan luong ~0,5s
   (getSources + toJPEG) nhung overlay da hien roi nen chi "kho" mot chut, khong
   phai doi moi thay gi. Xong -> gui anh dong bang (freeze) + luu full-res. */
function kickGrab() {
  if (grabStarted) return
  grabStarted = true
  const _tg = Date.now() // TAM do gio
  grabPromise = grabDisplaysList().catch((e) => {
    if (IS_DEV) console.error('[shotandsave] grab loi', e)
    return []
  })
  grabPromise.then((list) => {
    // Gui anh dong bang cua MOI man (kem toa do DIP toan cuc) cho TUNG overlay —
    // de renderer GHEP duoc vung chon VAT NGANG 2 man (anh Tien 25/08: khoanh
    // ca 2 man ma luu chi co 1 man).
    const layers = list.map((x) => {
      const m = manCache.find((mm) => mm.id === x.display.id) || {}
      return {
        x: x.display.bounds.x, y: x.display.bounds.y,
        w: x.display.bounds.width, h: x.display.bounds.height,
        sf: x.sf, dataUrl: x.dataUrl,
        px: m.px, py: m.py, pw: m.pw, ph: m.ph, // goc + co PHYS de ghep 1:1
      }
    })
    ghiLog('grab-xong ' + (Date.now() - _tg) + 'ms layers=' + layers.length + ' [' +
      list.map((x) => { const sz = x.image.getSize(); const m = manCache.find((mm) => mm.id === x.display.id) || {}; return 'anh ' + sz.width + 'x' + sz.height + ' / native ' + m.pw + 'x' + m.ph }).join(' | ') + ']')
    for (const win of overlayWins) {
      if (win.isDestroyed()) continue
      const item = list.find((x) => x.display.id === win._displayId)
      if (item) {
        const rec = overlayShots.get(win.webContents.id)
        if (rec) { rec.image = item.image; rec.sf = item.sf }
      }
      win.webContents.send('overlay:frozen', { layers })
    }
  })
}

/* Khoa mot-nguoi-keo: overlay nao mousedown TRUOC thi giu quyen; cac overlay khac
   bo qua chuot (het canh 2 man cung chon -> 2 anh). Reset moi lan capture (cua so
   moi). Renderer cung gui log su kien qua day. */
ipcMain.on('overlay:lock', (e) => {
  for (const w of overlayWins) {
    if (!w.isDestroyed() && w.webContents.id !== e.sender.id) {
      w.webContents.send('overlay:locked')
    }
  }
})
ipcMain.on('overlay:log', (_e, msg) => ghiLog('[overlay] ' + msg))

/* ---------------------------------------------------------------------- */
/* KEO CHON do MAIN theo doi — screen.getCursorScreenPoint() tra DIP toan  */
/* cuc DUNG theo scale TUNG man (anh Tien 26/08: moi user mot cau hinh     */
/* man/scale khac nhau; clientX cua renderer chi dung khi 2 man CUNG scale)*/
/* ---------------------------------------------------------------------- */
let dragOwnerId = null
let dragAnchor = null
let dragTimer = null
let manCache = [] // {id, dip(bounds), sf, px, py, pw, ph} — phys tinh 1 lan/capture

/** DIP -> pixel VAT LY (Windows). May khac Windows: xap xi qua sf man chua diem. */
function raPhys(p) {
  try { return screen.dipToScreenPoint(p) } catch (e) {
    const d = screen.getDisplayNearestPoint(p)
    const sf = d.scaleFactor || 1
    return { x: Math.round(d.bounds.x * sf + (p.x - d.bounds.x) * sf),
             y: Math.round(d.bounds.y * sf + (p.y - d.bounds.y) * sf) }
  }
}

function napManCache() {
  manCache = screen.getAllDisplays().map((d) => {
    const goc = raPhys({ x: d.bounds.x, y: d.bounds.y })
    const sf = d.scaleFactor || 1
    return { id: d.id, dip: d.bounds, sf, px: goc.x, py: goc.y,
             pw: Math.round(d.bounds.width * sf), ph: Math.round(d.bounds.height * sf) }
  })
}

/* rect PHYS -> rect CUC BO (DIP) cua tung man de renderer ve. */
function phatSelRect(rect) {
  for (const w of overlayWins) {
    if (w.isDestroyed()) continue
    if (rect === null) { w.webContents.send('overlay:sel-rect', null); continue }
    const m = manCache.find((x) => x.id === w._displayId)
    if (!m) continue
    w.webContents.send('overlay:sel-rect', {
      x: (rect.x - m.px) / m.sf, y: (rect.y - m.py) / m.sf,
      w: rect.w / m.sf, h: rect.h / m.sf,
      physW: rect.w, physH: rect.h,
      laChu: w.webContents.id === dragOwnerId,
    })
  }
}

function rectHienTai() {
  const c = raPhys(screen.getCursorScreenPoint())
  const x = Math.min(dragAnchor.x, c.x), y = Math.min(dragAnchor.y, c.y)
  return { x, y, w: Math.abs(c.x - dragAnchor.x), h: Math.abs(c.y - dragAnchor.y) }
}

ipcMain.on('overlay:drag-start', (e) => {
  dragOwnerId = e.sender.id
  dragAnchor = raPhys(screen.getCursorScreenPoint())
  ghiLog('drag-start anchor=' + JSON.stringify(dragAnchor))
  if (dragTimer) clearInterval(dragTimer)
  dragTimer = setInterval(() => phatSelRect(rectHienTai()), 16)
})

ipcMain.on('overlay:drag-end', (e) => {
  if (dragTimer) { clearInterval(dragTimer); dragTimer = null }
  if (!dragAnchor) return
  const rect = rectHienTai()
  dragAnchor = null
  ghiLog('drag-end rect=' + JSON.stringify(rect))
  if (rect.w < 8 || rect.h < 8) { ghiLog('huy (vung qua nho)'); closeOverlay(); return }
  // Nam TRON mot man? (so bang PIXEL VAT LY — dung moi scale/do phan giai)
  const chua = manCache.find((m) =>
    rect.x >= m.px && rect.y >= m.py &&
    rect.x + rect.w <= m.px + m.pw && rect.y + rect.h <= m.py + m.ph)
  phatSelRect(rect) // dong bang khung hien tai tren moi man
  if (chua) {
    const win = overlayWins.find((w) => !w.isDestroyed() && w._displayId === chua.id)
    if (win) {
      ghiLog('vao annotate tren display=' + chua.id)
      // rect CUC BO theo DIP man do (renderer lam viec bang CSS px)
      win.webContents.send('overlay:annotate', {
        x: (rect.x - chua.px) / chua.sf, y: (rect.y - chua.py) / chua.sf,
        w: rect.w / chua.sf, h: rect.h / chua.sf,
      })
      win.focus() // phim Enter/Ctrl+C phai roi vao dung man nay
      return
    }
  }
  // Vat ngang nhieu man -> chu ghep theo PIXEL VAT LY (1:1 tung man, khong meo)
  const owner = overlayWins.find((w) => !w.isDestroyed() && w.webContents.id === dragOwnerId)
  ghiLog('composite (vat ngang, phys)')
  if (owner) owner.webContents.send('overlay:composite', rect)
  else closeOverlay()
})


/**
 * Chup TUNG man hinh -> mang { display, dataUrl, sf }. Moi man se co MOT overlay
 * rieng phu dung man do -> khoanh vung o man nao cung duoc (tu nhien nhu
 * Lightshot, anh Tien 25/08). Lam RIENG moi man (khong mot cua so khong lo vat
 * ngang) vi cua so vat qua nhieu man 4K DPI khac nhau khong phu het -> vap
 * 25/08 tren may 4K + man phu cua anh Tien.
 */
async function grabDisplaysList() {
  const displays = screen.getAllDisplays()
  // ☠️ MOI man goi getSources RIENG voi thumbnailSize = NATIVE cua man do.
  // Mot size chung thi man nho bi UPSCALE (do that 26/08: 2560x1441 tra ve
  // 3840x2160 — mo + sai co luu). Grab chay NEN (overlay da hien) nen cham hon
  // mot chut khong sao. Promise.all cho chay song song.
  const boSung = await Promise.all(displays.map(async (d) => {
    const sf = d.scaleFactor || 1
    const w = Math.round(d.size.width * sf), h = Math.round(d.size.height * sf)
    const sources = await desktopCapturer.getSources({
      types: ['screen'], thumbnailSize: { width: w, height: h }, fetchWindowIcons: false,
    })
    let src = sources.find((x) => String(x.display_id) === String(d.id))
    if (!src) { const idx = displays.findIndex((x) => x.id === d.id); src = sources[idx] || sources[0] }
    if (!src || !src.thumbnail || src.thumbnail.isEmpty()) return null
    const img = src.thumbnail
    // ☠️ PNG (lossless) chu KHONG JPEG: anh co shape / vat 2 man ghep tu lop nay
    // — JPEG 90 la chu nho co vien nhieu khi zoom (khong xung tool cho editor).
    // PNG 4K ton ~250ms/man nhung grab chay NEN (overlay da hien) nen khong sao.
    const dataUrl = 'data:image/png;base64,' + img.toPNG().toString('base64')
    return { display: d, image: img, dataUrl, sf }
  }))
  return boSung.filter(Boolean)
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

function openOverlays(displays) {
  displays.forEach((disp, idx) => {
    const b = disp.bounds
    const win = new BrowserWindow({
      x: b.x, y: b.y, width: b.width, height: b.height,
      frame: false, transparent: true, backgroundColor: '#00000000',
      alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false,
      minimizable: false, maximizable: false, fullscreenable: false,
      hasShadow: false, enableLargerThanScreen: true, show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload-overlay.js'),
        contextIsolation: true, sandbox: false, backgroundThrottling: false,
      },
    })
    win._displayId = disp.id
    win.setAlwaysOnTop(true, 'screen-saver')
    // ☠️ LOAI overlay khoi anh chup (WDA_EXCLUDEFROMCAPTURE): grab chay SAU khi
    // overlay da hien -> khong co dong nay thi LOP MO 42% bi nuong vao anh ->
    // "ket qua hinh bi toi" (anh Tien 26/08). Co dong nay grab ra man hinh SACH.
    win.setContentProtection(true)
    overlayWins.push(win)

    // ☠️ Nho wcId NGAY BAY GIO — 'closed' thi webContents da huy (vap 24-25/08).
    const wcId = win.webContents.id
    // image = null luc dau; grab xong (song song) moi dien vao de cat.
    overlayShots.set(wcId, { display: disp, sf: disp.scaleFactor || 1, image: null })

    const laSelftest = IS_SELFTEST && idx === 0

    win.loadFile(path.join(__dirname, 'overlay', 'index.html'))
    win.webContents.once('did-finish-load', () => {
      // origin = goc DIP toan cuc cua man nay — renderer quy doi toa do toan cuc.
      win.webContents.send('overlay:init', { selftest: laSelftest, origin: { x: b.x, y: b.y } })
      // HIEN NGAY — cua so trong suot, thay man hinh that, lop mo fade vao (CSS).
      if (!win.isDestroyed() && !win.isVisible()) { win.show(); win.focus() }
      // Grab bat dau SAU khi overlay dau tien da hien + kip PAINT (~40ms) — de
      // getSources chan luong thi overlay da hien roi.
      setTimeout(kickGrab, 40)
      if (laSelftest) setTimeout(() => saveCapture(win, 'selftest-overlay.png'), 900)
    })
    win.on('closed', () => {
      overlayShots.delete(wcId)
      overlayWins = overlayWins.filter((w) => w !== win)
    })
  })
}

function closeOverlay() {
  for (const w of overlayWins) { if (!w.isDestroyed()) w.close() }
  overlayWins = []
  pending = null
}

/* ---------------------------------------------------------------------- */
/* Overlay -> xac nhan vung chon -> tao cua so GHIM                        */
/* ---------------------------------------------------------------------- */

// Renderer gui { rect } (khong ve shape -> main cat full-res, net) HOAC
// { dataUrl } (co ve shape -> renderer da ghep san bang canvas).
ipcMain.on('overlay:confirm', (e, payload) => {
  const shot = overlayShots.get(e.sender.id)
  ghiLog('confirm tu display=' + (shot && shot.display ? shot.display.id : '?') +
    ' kieu=' + (payload && payload.dataUrl ? 'dataUrl(' + payload.dataUrl.length + ')' : 'rect') +
    (payload && payload.rect ? ' rect=' + JSON.stringify(payload.rect) : ''))
  handleConfirm(e.sender.id, payload)
})

async function handleConfirm(wcId, payload) {
  const shot = overlayShots.get(wcId)
  const display = shot && shot.display
  const sf = shot ? shot.sf : 1
  closeOverlay()
  if (!display || !payload) return

  let cropped

  // Truong hop CO VE SHAPE: renderer da ghep (crop + shape) roi gui dataURL.
  if (payload.dataUrl) {
    try { cropped = nativeImage.createFromDataURL(payload.dataUrl) } catch (e) { cropped = null }
    if (!cropped || cropped.isEmpty()) return
  } else {
    // Khong ve shape: cat tu anh GOC full-res (net khong mat).
    const rect = payload.rect
    if (!rect) return
    // Anh dong bang co the CHUA grab xong (chon nhanh hon ~0,5s). Cho.
    let image = shot.image
    if (!image) {
      if (!grabPromise) kickGrab()
      const list = grabPromise ? await grabPromise : []
      const item = list.find((x) => x.display.id === display.id)
      image = item && item.image
    }
    if (!image) return
    // ☠️ Quy doi theo kich thuoc anh THAT (desktopCapturer co the tra anh khong
    // dung co native) — k = anh-that / (DIP man * sf).
    const isz = image.getSize()
    const kx = isz.width / (display.bounds.width * sf)
    const ky = isz.height / (display.bounds.height * sf)
    const cx = Math.max(0, Math.round(rect.x * sf * kx))
    const cy = Math.max(0, Math.round(rect.y * sf * ky))
    const cw = Math.max(1, Math.round(rect.w * sf * kx))
    const ch = Math.max(1, Math.round(rect.h * sf * ky))
    try {
      cropped = image.crop({ x: cx, y: cy, width: cw, height: ch })
    } catch (err) {
      if (IS_DEV) console.error('[shotandsave] crop loi', err)
      return
    }
    if (!cropped || cropped.isEmpty()) return
  }

  // 0) Ctrl+C: copy vao clipboard luon (them, ngoai Enter/nut check) — anh Tien
  //    25/08. Van vao khay binh thuong o duoi.
  if (payload.copy) { try { clipboard.writeImage(cropped) } catch (e) {} }

  // 1) Luu file THAT tren dia truoc — tat app khong mat anh. Dinh dang theo
  //    cai dat nguoi dung (JPEG/PNG + chat luong).
  const filePath = kho.luuAnh(cropped, layDinhDangAnh())
  const _sz = cropped.getSize()
  ghiLog('luu ' + path.basename(filePath) + ' ' + _sz.width + 'x' + _sz.height)
  // 2) Vao khay (cho gom moi tam da chup). Khay tu hien len.
  //    ☠️ Anh Tien chot 25/08: chup xong CHI vao khay, KHONG bung anh ghim noi.
  //    Muon ghim len man hinh thi bam thumbnail trong khay (shelf:pin van con).
  shelfAdd(cropped, filePath)

  // [selftest] Van chay duong GHIM de kiem (that: bam thumbnail se goi ham nay).
  // Khoi selftest o day cung lo chup selftest-pin/shelf.png + thoat app.
  if (IS_SELFTEST) {
    const sz = cropped.getSize()
    createPinWindow(cropped, 100, 100, sz.width, sz.height, filePath)
  }
}

ipcMain.on('overlay:cancel', () => { ghiLog('cancel'); closeOverlay() })

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

function createPinWindow(image, screenX, screenY, dipW, dipH, filePath) {
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
  pins.set(wcId, { image, filePath })

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

/* KEO-THA ra app khac: keo anh ghim -> tha file .png that vao Premiere / Zalo /
   Messenger... `startDrag` PHAI goi trong nhip dragstart that cua nguoi dung
   (renderer chan default roi goi sang day), va icon BAT BUOC khong rong. */
ipcMain.on('pin:start-drag', (e) => {
  const rec = pins.get(e.sender.id)
  if (!rec || !rec.filePath) return
  try {
    e.sender.startDrag({ file: rec.filePath, icon: rec.image.resize({ height: 96 }) })
  } catch (err) { if (IS_DEV) console.error('[shotandsave] pin startDrag loi', err) }
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
  // Kem kich thuoc + dung luong de khay hien cho nguoi dung (anh Tien 26/08).
  const sz = image.getSize()
  let kb = 0
  try { kb = Math.round(fs.statSync(filePath).size / 1024) } catch (e) {}

  const send = () => w.webContents.send('shelf:add', { id, thumb, filePath, w: sz.width, h: sz.height, kb })
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
  createPinWindow(it.image, x, y, dipW, dipH, it.filePath)
})

/* KEO-THA tu KHAY ra app khac. Cung `startDrag` nhu pin, nguon la item khay. */
ipcMain.on('shelf:start-drag', (e, id) => {
  const it = shelfItems.get(id)
  if (!it || !it.filePath) return
  try {
    e.sender.startDrag({ file: it.filePath, icon: it.image.resize({ height: 96 }) })
  } catch (err) { if (IS_DEV) console.error('[shotandsave] shelf startDrag loi', err) }
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
