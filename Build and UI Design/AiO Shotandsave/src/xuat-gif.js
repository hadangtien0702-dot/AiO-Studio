'use strict'
/* XUAT GIF tu video da quay (06/10/2026, anh chon trong bang hoi sau khi xem bang so doi thu: ShareX va CleanShot deu co
   GIF, minh chua). Phan cua MAIN: moi lan xuat tao MOT cua so AN (src/gif) -> trang do tu doc file MP4, giai ma, ma hoa
   va gui tung khuc byte GIF ve day -> ghi noi vao `<dich>.tam` -> xong moi doi ten thanh `<dich>` (nhu file video: khong
   bao gio de mot file .gif do dang mang ten that). Khong can FFmpeg.

   Mac dinh (CHUA phai so anh chot, xem PROGRESS 06/10): 10 hinh / giay, canh dai <= 800 px, tran 60 giay.
   Mot luc chi MOT viec (goi lan 2 khi dang chay -> { ok: false, loi: 'dang-ban' }). */
const { BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const MAC_DINH = { buocMs: 100, canhDai: 800, toiDaMs: 60000, nguong: 6 }
const HET_GIO_MS = 10 * 60 * 1000 // 10 phut khong xong thi bo (may dung, cua so treo)

let ghiLog = () => {}
let viec = null // { nguon, dich, tam, fd, win, bytes, tuyChon, tienDo, ketThuc, hen, t0 }

function khoiTao(log) { if (typeof log === 'function') ghiLog = log }
function dangBan() { return !!viec }

ipcMain.handle('gif:viec', (e) => {
  if (!viec || !viec.win || viec.win.isDestroyed() || e.sender !== viec.win.webContents) return null
  return Object.assign({ nguon: viec.nguon }, viec.tuyChon)
})
const cuaViec = (e) => viec && viec.win && !viec.win.isDestroyed() && e.sender === viec.win.webContents
ipcMain.on('gif:khuc', (e, u8) => {
  if (!cuaViec(e) || viec.hong) return
  try {
    const b = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
    fs.writeSync(viec.fd, b)
    viec.bytes += b.length
  } catch (err) { viec.hong = 'ghi file: ' + err.message; ket({ ok: false, loi: viec.hong }) }
})
ipcMain.on('gif:tien-do', (e, p) => { if (cuaViec(e) && viec.tienDo) { try { viec.tienDo(Math.max(0, Math.min(1, Number(p) || 0))) } catch (err) {} } })
ipcMain.on('gif:xong', (e, tt) => { if (cuaViec(e)) ket({ ok: true, tt: tt || {} }) })
ipcMain.on('gif:loi', (e, chuoi) => { if (cuaViec(e)) ket({ ok: false, loi: String(chuoi) }) })

/* Dong viec hien tai: dong file, doi ten (neu xong) hoac xoa file tam (neu hong), huy cua so, tra ket qua. */
function ket(kq) {
  const v = viec
  if (!v) return
  viec = null
  clearTimeout(v.hen)
  try { fs.closeSync(v.fd) } catch (e) {}
  if (v.win && !v.win.isDestroyed()) v.win.destroy()
  let ra
  if (kq.ok) {
    try {
      const st = fs.statSync(v.tam)
      if (!st.size || st.size !== v.bytes || st.size !== (kq.tt.bytes || 0)) throw new Error('so byte lech: file ' + st.size + ', da nhan ' + v.bytes + ', trang bao ' + kq.tt.bytes)
      fs.renameSync(v.tam, v.dich)
      ra = { ok: true, file: v.dich, bytes: st.size, khung: kq.tt.khung | 0, w: kq.tt.w | 0, h: kq.tt.h | 0, ms: kq.tt.ms | 0, nguonMs: kq.tt.nguonMs | 0, cat: !!kq.tt.cat, msLam: Date.now() - v.t0 }
      if (kq.tt.tuKiem) ra.tuKiem = kq.tt.tuKiem // chi co khi bai do bat tuyChon.tuKiem
    } catch (e) { ra = { ok: false, loi: 'chot file: ' + e.message } }
  } else ra = { ok: false, loi: kq.loi || 'khong ro' }
  if (!ra.ok) { try { fs.unlinkSync(v.tam) } catch (e) {} }
  ghiLog('gif ' + path.basename(v.nguon) + ': ' + (ra.ok
    ? 'xong ' + ra.msLam + ' ms, ' + ra.khung + ' khung ' + ra.w + 'x' + ra.h + ', ' + Math.round(ra.bytes / 1024) + ' KB' + (ra.cat ? ' (cat o tran)' : '')
    : 'LOI ' + ra.loi))
  v.ketThuc(ra)
}

/* nguon: duong dan .mp4 do app quay · dich: duong dan .gif se tao · tuyChon: de len MAC_DINH · tienDo(0..1).
   Tra Promise<{ ok: true, file, bytes, khung, w, h, ms, cat, msLam } | { ok: false, loi }> — khong bao gio nem. */
function xuat(nguon, dich, tuyChon, tienDo) {
  return new Promise((ketThuc) => {
    if (viec) { ketThuc({ ok: false, loi: 'dang-ban' }); return }
    if (!nguon || !dich || !fs.existsSync(nguon)) { ketThuc({ ok: false, loi: 'khong co file nguon' }); return }
    const tam = dich + '.tam'
    let fd
    try { fd = fs.openSync(tam, 'w') } catch (e) { ketThuc({ ok: false, loi: 'khong tao duoc file: ' + e.message }); return }
    const win = new BrowserWindow({
      width: 320, height: 200, show: false, skipTaskbar: true,
      webPreferences: { preload: path.join(__dirname, 'preload-gif.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false },
    })
    viec = { nguon, dich, tam, fd, win, bytes: 0, tuyChon: Object.assign({}, MAC_DINH, tuyChon || {}), tienDo, ketThuc, t0: Date.now(), hen: null }
    const v = viec
    v.hen = setTimeout(() => { if (viec === v) ket({ ok: false, loi: 'het gio' }) }, HET_GIO_MS)
    win.webContents.on('render-process-gone', (_e, d) => { if (viec === v) ket({ ok: false, loi: 'cua so xuat GIF chet (' + (d && d.reason) + ')' }) })
    win.on('closed', () => { if (viec === v) ket({ ok: false, loi: 'cua so xuat GIF dong som' }) })
    win.loadFile(path.join(__dirname, 'gif', 'index.html')).catch((e) => { if (viec === v) ket({ ok: false, loi: 'khong nap duoc trang: ' + e.message }) })
  })
}

module.exports = { khoiTao, xuat, dangBan, MAC_DINH }
