'use strict'

/* =========================================================================
   webp.js — MA HOA / GIAI MA WebP (06/11/2026, ROADMAP 0k #13 "Xuat anh WebP")
   -------------------------------------------------------------------------
   DO 06/11 (Electron 43.4.1, scripts/test/do-webp.cjs): nativeImage KHONG co toWEBP va cung KHONG DOC duoc WebP
   (createFromPath / createFromBuffer tra anh RONG). Chromium thi doc va ghi WebP rat tot -> dung MOT cua so AN
   (khong bao gio hien len man hinh) lam bo ma hoa: main gui diem anh tho (BGRA), cua so ve len OffscreenCanvas roi
   convertToBlob('image/webp'); chieu nguoc lai createImageBitmap -> getImageData -> tra BGRA ve main.
   - Cua so tao LAZY, tu huy sau 60 giay khong dung (luat tai nguyen: khong de tien trinh nhan RAM khi khong can).
   - Gioi han cua WebP: moi canh <= 16383 px. Anh vuot (chup cuon dai) ma() tra null -> BEN GOI PHAI luu dinh dang khac.
   - Moi lenh co han chot 30 giay; cua so hong thi huy va tao lai o lenh sau.
   Tat ca ham async TRA NULL khi that bai (khong nem), ben goi tu quyet dinh duong lui. Ghi log qua ghiLog neu da noi.
   ========================================================================= */

const path = require('path')

const NGU_MS = 60 * 1000
const HAN_MS = 30 * 1000
const TOI_DA_CANH = 16383

let el = null
let win = null
let san = null          // Promise<boolean> cua cua so hien tai
let dem = 0
const cho = new Map()   // id -> { res, timer }
let henTat = null
let daNoi = false
let ghiLog = () => {}

function electron() { return el || (el = require('electron')) }

function noiLog(fn) { if (typeof fn === 'function') ghiLog = fn }

/** RIFF....WEBP ? */
function laWebp(buf) {
  return !!buf && buf.length >= 16 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP'
}

/** Doc kich thuoc tu DAU file WebP (khong giai ma): { w, h } hoac null. Dung de ve cho tam anh khi chua giai ma xong. */
function docKichThuoc(buf) {
  if (!laWebp(buf) || buf.length < 30) return null
  const loai = buf.toString('latin1', 12, 16)
  try {
    if (loai === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    if (loai === 'VP8L') {
      const b = buf.subarray(21, 25)
      return { w: 1 + (((b[1] & 0x3f) << 8) | b[0]), h: 1 + (((b[3] & 0x0f) << 10) | (b[2] << 2) | ((b[1] & 0xc0) >> 6)) }
    }
    if (loai === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
  } catch (e) {}
  return null
}

function huyCho(lyDo) {
  for (const c of cho.values()) { clearTimeout(c.timer); c.res({ ok: false, loi: lyDo }) }
  cho.clear()
}

function tatCuaSo(lyDo) {
  clearTimeout(henTat); henTat = null
  const w = win
  win = null; san = null
  huyCho(lyDo || 'cua so ma hoa da tat')
  if (w && !w.isDestroyed()) { try { w.destroy() } catch (e) {} }
}

function noiIpc() {
  if (daNoi) return
  daNoi = true
  electron().ipcMain.on('webp:xong', (e, m) => {
    if (!win || win.isDestroyed() || e.sender.id !== win.webContents.id) return // chi nhan tu cua so ma hoa cua minh
    const c = m && cho.get(m.id)
    if (!c) return
    cho.delete(m.id); clearTimeout(c.timer)
    c.res(m)
  })
}

function moCuaSo() {
  if (win && !win.isDestroyed() && san) return san
  noiIpc()
  const { BrowserWindow } = electron()
  const w = new BrowserWindow({
    show: false, width: 64, height: 64, frame: false, skipTaskbar: true, focusable: false,
    webPreferences: { preload: path.join(__dirname, 'preload-webp.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false },
  })
  win = w
  w.on('closed', () => { if (win === w) { win = null; san = null; huyCho('cua so ma hoa bi dong') } })
  w.webContents.on('render-process-gone', () => { ghiLog('webp: cua so ma hoa CHET, se tao lai o lenh sau'); if (win === w) tatCuaSo('cua so ma hoa chet') })
  san = new Promise((res) => {
    w.webContents.once('did-finish-load', () => res(true))
    w.webContents.once('did-fail-load', () => res(false))
    w.loadURL('data:text/html;charset=utf-8,<meta charset="utf-8"><title>webp</title>').catch(() => res(false))
  })
  return san
}

async function guiLenh(lenh) {
  const sanSang = await moCuaSo()
  if (!sanSang || !win || win.isDestroyed()) { tatCuaSo('khong mo duoc cua so ma hoa'); return { ok: false, loi: 'khong mo duoc cua so ma hoa' } }
  clearTimeout(henTat)
  henTat = setTimeout(() => tatCuaSo('het gio nghi'), NGU_MS)
  if (henTat.unref) henTat.unref()
  const id = ++dem
  const w = win
  return new Promise((res) => {
    const timer = setTimeout(() => { cho.delete(id); res({ ok: false, loi: 'qua ' + (HAN_MS / 1000) + ' giay' }); if (win === w) tatCuaSo('het han') }, HAN_MS)
    cho.set(id, { res, timer })
    try { w.webContents.send('webp:lenh', Object.assign({ id }, lenh)) } catch (e) { cho.delete(id); clearTimeout(timer); res({ ok: false, loi: e.message }) }
  })
}

/** Lam nong cua so ma hoa truoc (vd. luc nguoi dung chon WebP) de lan luu dau khong phai doi mo cua so. */
function lamNong() { try { return moCuaSo().then(() => true).catch(() => false) } catch (e) { return Promise.resolve(false) } }

/**
 * NativeImage -> Buffer WebP. q: 0..1 (1 = lossless cua Chromium). null neu that bai / anh qua lon (> 16383 px moi canh).
 */
async function ma(image, q) {
  try {
    if (!image || image.isEmpty()) return null
    const sz = image.getSize()
    if (sz.width > TOI_DA_CANH || sz.height > TOI_DA_CANH) { ghiLog('webp: anh ' + sz.width + 'x' + sz.height + ' vuot ' + TOI_DA_CANH + ' px, khong ma hoa duoc'); return null }
    const r = await guiLenh({ kieu: 'ma', w: sz.width, h: sz.height, q: Math.min(1, Math.max(0.01, Number(q) || 0.8)), buf: image.toBitmap() })
    if (!r.ok || !r.buf) { ghiLog('webp: ma hoa LOI ' + (r.loi || '?')); return null }
    const buf = Buffer.from(r.buf.buffer ? Buffer.from(r.buf.buffer, r.buf.byteOffset, r.buf.byteLength) : r.buf)
    if (!laWebp(buf)) { ghiLog('webp: ket qua khong phai WebP (' + buf.length + ' byte)'); return null }
    return buf
  } catch (e) { ghiLog('webp: ma hoa LOI ' + (e && e.message)); return null }
}

/** Buffer WebP -> NativeImage (hoac null). */
async function giaiMa(buf) {
  try {
    if (!laWebp(buf)) return null
    const r = await guiLenh({ kieu: 'giai', buf })
    if (!r.ok || !r.buf || !r.w || !r.h) { ghiLog('webp: giai ma LOI ' + (r.loi || '?')); return null }
    const b = Buffer.from(r.buf.buffer ? Buffer.from(r.buf.buffer, r.buf.byteOffset, r.buf.byteLength) : r.buf)
    const img = electron().nativeImage.createFromBitmap(b, { width: r.w, height: r.h })
    return img.isEmpty() ? null : img
  } catch (e) { ghiLog('webp: giai ma LOI ' + (e && e.message)); return null }
}

/** Doc file WebP tren dia -> NativeImage (hoac null). */
async function giaiMaFile(duong) {
  try { return await giaiMa(require('fs').readFileSync(duong)) } catch (e) { ghiLog('webp: doc file LOI ' + (e && e.code)); return null }
}

module.exports = { laWebp, docKichThuoc, ma, giaiMa, giaiMaFile, lamNong, tat: () => tatCuaSo('tat app'), noiLog, TOI_DA_CANH }
