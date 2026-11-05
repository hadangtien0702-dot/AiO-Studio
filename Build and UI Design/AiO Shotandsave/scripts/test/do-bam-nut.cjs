'use strict'
/* 08/10 DO CU BAM THAT vao cua so NUT TRON (trang + preload that cua app) khi `backgroundThrottling` false / true.
   Chay: npm run test:bamnut      (chi Windows)
   ☠️ CANH BAO (so loi #12): HIEN 2 o vuong 80x80 len goc duoi-phai man chinh ~10 giay va CUOP CON TRO 4 lan (bam chuot gia
   lap bang bam-xy.ps1 roi tra con tro ve cho cu). Anh dang ngoi may thi XIN GIO truoc.
   Vi sao co bai nay (so loi #21): ban 0.9.1 them `backgroundThrottling: false` cho cua so nut tron + khay (lam cho Mac) ->
   tren Windows cua so van hien, van nam tren cung, WindowFromPoint van tra dung no, nhung KHONG cu bam nao toi trang. Bai an
   `test:khaynut` (offscreen) van 30/30 vi no goi thang ham, khong co chuot that.
   Moi cua so: hien -> bam (lan 1) -> an 1,5 giay -> hien lai -> bam (lan 2); dem so lan trang gui `nut:mo` ve main.
   Ket qua 08/10 (may cong ty, man 4K 150%): false = 0 / 0 cu bam · true = 1 / 1. Them AIO_NHAN_FOCUS=1 de do kieu cua so
   cua KHAY (nhan focus): false = 0 / 0 · true = 1 / 1.
   DAT khi: cau hinh "true" nhan du 2 cu bam (thuoc song) — cau hinh "false" duoc in ra de biet Electron da het loi chua. */
const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const { spawnSync } = require('child_process')
const APP = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'))
const NHAN_FOCUS = process.env.AIO_NHAN_FOCUS === '1'
const BAM = path.join(__dirname, 'bam-xy.ps1')
process.on('uncaughtException', (e) => { console.log('LOI=' + (e && e.stack || e)); process.exit(1) })
process.on('unhandledRejection', (e) => { console.log('LOI=' + (e && e.stack || e)); process.exit(1) })
setTimeout(() => { console.log('LOI=qua 60 giay'); process.exit(1) }, 60000).unref()
app.setPath('userData', path.join(__dirname, 'thu-nut-ham-userData'))
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const dem = new Map()
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('nut:mo', (e) => dem.set(e.sender.id, (dem.get(e.sender.id) || 0) + 1))

function tao(b, ham) {
  // dung bo tuy chon cua taoCuaSo trong src/khay-thu.js, chi doi backgroundThrottling
  const w = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false, transparent: true, backgroundColor: '#00000000', thickFrame: false, roundedCorners: false,
    resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
    focusable: NHAN_FOCUS, skipTaskbar: true, hasShadow: false, show: false, enableLargerThanScreen: true,
    webPreferences: { preload: path.join(APP, 'src', 'preload-nut.js'), contextIsolation: true, sandbox: false, backgroundThrottling: ham },
  })
  w.setAlwaysOnTop(true, 'screen-saver')
  w.setContentProtection(true)
  w.setBounds(b)
  w.__xong = new Promise((r) => w.webContents.once('did-finish-load', () => r(true)))
  w.loadFile(path.join(APP, 'src', 'nut', 'index.html'))
  return w
}
const hien = (w) => { w.showInactive(); w.setAlwaysOnTop(true, 'screen-saver'); w.moveTop() }
function bam(w) {
  const b = w.getBounds()
  const p = screen.dipToScreenPoint({ x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) })
  spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', BAM, String(Math.round(p.x)), String(Math.round(p.y))], { windowsHide: true })
}
app.whenReady().then(async () => {
  const wa = screen.getPrimaryDisplay().workArea
  const y = wa.y + wa.height - 80 - 12
  const cuaSo = [
    { ten: 'backgroundThrottling=false (nhu ban 0.9.1)', w: tao({ x: wa.x + wa.width - 300, y, width: 80, height: 80 }, false) },
    { ten: 'backgroundThrottling=true  (nhu ban 06/10)', w: tao({ x: wa.x + wa.width - 400, y, width: 80, height: 80 }, true) },
  ]
  for (const c of cuaSo) await c.w.__xong
  let datDoiChung = false
  for (const c of cuaSo) {
    const id = c.w.webContents.id
    const kq = []
    hien(c.w); await cho(700)
    bam(c.w); await cho(400); kq.push(dem.get(id) || 0)
    c.w.hide(); await cho(1500)
    hien(c.w); await cho(700)
    bam(c.w); await cho(400); kq.push((dem.get(id) || 0) - kq[0])
    const tt = await c.w.webContents.executeJavaScript('document.visibilityState + " / hasFocus " + document.hasFocus()').catch((e) => 'loi ' + e.message)
    c.w.hide()
    if (c.ten.includes('=true') && kq[0] === 1 && kq[1] === 1) datDoiChung = true
    console.log('KQ ' + c.ten + ': lan 1 (hien lan dau) nhan ' + kq[0] + ' cu bam · lan 2 (an roi hien lai) nhan ' + kq[1] + ' · trang: ' + tt)
  }
  for (const c of cuaSo) c.w.destroy()
  console.log(datDoiChung ? 'Ket qua: DAT (cau hinh mac dinh nhan du 2 cu bam)' : 'Ket qua: TRUOT (cau hinh mac dinh khong nhan du cu bam: thuoc hong hoac may dang bi che)')
  app.exit(datDoiChung ? 0 : 1)
})
