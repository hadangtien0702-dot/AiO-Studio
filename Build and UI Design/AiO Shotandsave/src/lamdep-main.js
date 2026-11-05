'use strict'

/* LAM DEP ANH — phan tien trinh chinh: cua so, luu FILE MOI, sao chep (05/11/2026).
   Luat cung (anh Tien, bai 5bi): anh goc KHONG bao gio bi ghi de / doi ten / chuyen. File moi
   mo bang co 'wx' (loi neu ten da co), nen dung code loi cung khong ghi de duoc file nao.
   Ten file moi bat dau 'shotandsave-lamdep-' -> khay nap lai duoc khi mo app (loc .png/.jpg,
   khong dung vao shelfAdd). */

const path = require('path')
const fs = require('fs')

const PNG_DAU = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
let dem = 0

function tenMoi(d) {
  const p = (n, k) => String(n).padStart(k || 2, '0')
  return 'shotandsave-lamdep-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + p(d.getMilliseconds(), 3) + '-' + (++dem) + '.png'
}

/** Ghi buf (PNG) thanh file MOI trong dir. Tra { ok, filePath, ten } hoac { ok:false, error }. */
function luuFileMoi(dir, buf) {
  if (!buf || buf.length < 16 || !buf.subarray(0, 8).equals(PNG_DAU)) return { ok: false, error: 'khong phai PNG' }
  try {
    fs.mkdirSync(dir, { recursive: true })
    for (let i = 0; i < 5; i++) {
      const ten = tenMoi(new Date())
      const filePath = path.join(dir, ten)
      try {
        fs.writeFileSync(filePath, buf, { flag: 'wx' })
        return { ok: true, filePath, ten }
      } catch (err) {
        if (err.code !== 'EEXIST') throw err
      }
    }
    return { ok: false, error: 'khong tim duoc ten file moi' }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

const layBuf = (u8) => (u8 && u8.byteLength ? Buffer.from(u8.buffer ? u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) : u8) : null)

/**
 * deps: { ipcMain, BrowserWindow, nativeImage, clipboard, screen, thuMucAnh: () => string, ghiLog, hien (mac dinh true), icon }
 * Tra { mo({ image, filePath }), cuaSo: () => BrowserWindow|null }
 */
function khoiTao(deps) {
  const { ipcMain, BrowserWindow, nativeImage, clipboard, screen } = deps
  const log = deps.ghiLog || (() => {})
  let win = null
  let nguon = null // { image, filePath }

  const laCuaSoNay = (e) => win && !win.isDestroyed() && e.sender.id === win.webContents.id

  function thuMucLuu() {
    if (nguon && nguon.filePath) {
      const d = path.dirname(nguon.filePath)
      try { if (fs.statSync(d).isDirectory()) return d } catch (e) {}
    }
    return deps.thuMucAnh()
  }

  ipcMain.handle('lamdep:get-data', (e) => {
    if (!laCuaSoNay(e) || !nguon) return null
    return { png: nguon.image.toPNG(), ten: nguon.filePath ? path.basename(nguon.filePath) : '' }
  })

  ipcMain.handle('lamdep:luu', (e, u8) => {
    if (!laCuaSoNay(e)) return { ok: false, error: 'sender' }
    const kq = luuFileMoi(thuMucLuu(), layBuf(u8))
    log('lamdep luu: ' + (kq.ok ? kq.filePath : 'LOI ' + kq.error))
    return kq.ok ? { ok: true, ten: kq.ten, filePath: kq.filePath } : { ok: false, error: kq.error }
  })

  ipcMain.handle('lamdep:chep', (e, u8) => {
    if (!laCuaSoNay(e)) return { ok: false, error: 'sender' }
    const buf = layBuf(u8)
    try {
      const img = buf && nativeImage.createFromBuffer(buf)
      if (!img || img.isEmpty()) throw new Error('anh rong')
      clipboard.writeImage(img)
      log('lamdep chep clipboard: OK ' + Math.round(buf.length / 1024) + ' KB')
      return { ok: true }
    } catch (err) {
      log('lamdep chep LOI: ' + err.message)
      return { ok: false, error: err.message }
    }
  })

  ipcMain.on('lamdep:close', (e) => { if (laCuaSoNay(e)) win.close() })

  function mo(nguonMoi) {
    if (!nguonMoi || !nguonMoi.image || nguonMoi.image.isEmpty()) return null
    nguon = { image: nguonMoi.image, filePath: nguonMoi.filePath || null }
    if (win && !win.isDestroyed()) {
      win.webContents.reload()
      if (deps.hien !== false) { win.show(); win.focus() }
      return win
    }
    const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    const w = Math.min(980, Math.round(wa.width * 0.9))
    const h = Math.min(660, Math.round(wa.height * 0.85))
    win = new BrowserWindow({
      x: wa.x + Math.round((wa.width - w) / 2),
      y: wa.y + Math.round((wa.height - h) / 2),
      width: w, height: h,
      minWidth: 760, minHeight: 540,
      frame: false, show: false,
      title: 'AiO Shot & Save',
      backgroundColor: '#141414',
      icon: deps.icon,
      webPreferences: {
        preload: path.join(__dirname, 'preload-lamdep.js'),
        contextIsolation: true, sandbox: false, backgroundThrottling: false,
      },
    })
    // Anh ghim nam o cap 'screen-saver': cua so nay phai noi tren no.
    win.setAlwaysOnTop(true, 'screen-saver')
    win.loadFile(path.join(__dirname, 'lamdep', 'index.html'))
    if (deps.hien !== false) win.once('ready-to-show', () => win.show())
    win.on('closed', () => { win = null })
    return win
  }

  return { mo, cuaSo: () => (win && !win.isDestroyed() ? win : null) }
}

module.exports = { khoiTao, luuFileMoi, tenMoi }
