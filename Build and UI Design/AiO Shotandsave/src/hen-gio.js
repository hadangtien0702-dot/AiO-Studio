'use strict'
/* HEN GIO CHUP (05/11): tray -> "Hen gio chup" -> 3 / 5 / 10 giay. Dem nguoc bang MOT cua so nho o giua-tren man hinh co
   con tro; het gio thi DONG cua so dem, doi mot nhip cho he dieu hanh go no khoi man hinh, roi moi goi `chup()` (chinh la
   startCapture). Dem nguoc khong lot vao anh vi: (1) cua so setContentProtection(true) (Windows: WDA_EXCLUDEFROMCAPTURE,
   Mac: sharingType none); (2) no da bi DONG truoc khi chup bat dau; (3) startCapture chup anh dong bang CUA LUC SAU DO.
   Module nay khong phu thuoc main.js: nhan BrowserWindow / screen qua deps nen bai do (scripts/test/do-hen-gio.cjs) thay duoc
   bang ban ghi lai. */
const path = require('path')

const NHIP_SAU_DONG_MS = 180 // doi cua so dem bien khoi man hinh truoc khi chup
let phien = null // { giay, con, timer, win, huy() }

function dangDem() { return !!phien }
function conLai() { return phien ? phien.con : 0 }

function huy() {
  if (!phien) return false
  const p = phien
  phien = null
  clearTimeout(p.timer)
  try { if (p.win && !p.win.isDestroyed()) p.win.destroy() } catch (e) {}
  if (p.onDoi) p.onDoi()
  return true
}

/* deps: { BrowserWindow, screen, chup, ghiLog, onDoi, quanSat, an, nhip }
   - chup(): goi het gio (startCapture)
   - onDoi(): bat dau / het dem (de dung lai menu khay)
   - quanSat(n): [do] moi lan so dem doi
   - an: [do] true = cua so khong hien len man hinh
   - nhip: [do] do dai 1 giay (ms), mac dinh 1000 */
function batDau(giay, deps) {
  const { BrowserWindow, screen, chup } = deps
  const ghiLog = deps.ghiLog || (() => {})
  const g = [3, 5, 10].includes(Number(giay)) ? Number(giay) : 5
  const nhip = deps.nhip || 1000
  if (phien) huy()
  const p = { giay: g, con: g, timer: 0, win: null, onDoi: deps.onDoi }
  phien = p

  let win = null
  try {
    const cur = screen.getCursorScreenPoint ? screen.getCursorScreenPoint() : null
    const disp = (cur && screen.getDisplayNearestPoint(cur)) || screen.getPrimaryDisplay()
    const W = 150, H = 150
    const wa = disp.workArea
    win = new BrowserWindow({
      x: Math.round(wa.x + (wa.width - W) / 2), y: Math.round(wa.y + 24), width: W, height: H,
      frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
      alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false, focusable: false,
      minimizable: false, maximizable: false, fullscreenable: false, show: false,
      webPreferences: { contextIsolation: true, sandbox: true },
    })
    win.setContentProtection(true)
    win.setIgnoreMouseEvents(true)
    p.win = win
    win.loadFile(path.join(__dirname, 'hen-gio', 'index.html'), { query: { n: String(g) } })
      .then(() => { if (phien === p && !deps.an && win && !win.isDestroyed()) win.showInactive() })
      .catch(() => {})
  } catch (e) {
    ghiLog('hen gio: khong tao duoc cua so dem (' + (e && e.message) + ') -> van dem, khong hien so')
  }
  ghiLog('hen gio: bat dau ' + g + ' giay')
  if (deps.onDoi) deps.onDoi()
  if (deps.quanSat) deps.quanSat(g)

  const buoc = () => {
    if (phien !== p) return
    p.con--
    if (p.con > 0) {
      if (p.win && !p.win.isDestroyed()) p.win.webContents.executeJavaScript('window.datSo && window.datSo(' + p.con + ')').catch(() => {})
      if (deps.quanSat) deps.quanSat(p.con)
      p.timer = setTimeout(buoc, nhip)
      return
    }
    // het gio: dong cua so dem TRUOC, roi doi mot nhip, roi moi chup
    try { if (p.win && !p.win.isDestroyed()) p.win.destroy() } catch (e) {}
    p.win = null
    if (deps.quanSat) deps.quanSat(0)
    p.timer = setTimeout(() => {
      if (phien !== p) return
      phien = null
      if (p.onDoi) p.onDoi()
      ghiLog('hen gio: het ' + g + ' giay -> chup')
      chup()
    }, deps.nhipSauDong != null ? deps.nhipSauDong : NHIP_SAU_DONG_MS)
  }
  p.timer = setTimeout(buoc, nhip)
  return { huy }
}

module.exports = { batDau, huy, dangDem, conLai, NHIP_SAU_DONG_MS }
