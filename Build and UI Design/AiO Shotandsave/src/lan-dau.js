'use strict'
/* =========================================================================
   THE LAN CHAY DAU (06/11/2026) — nguoi moi cai app xong khong biet phim chup la gi, bieu tuong nam dau, khay se tu thu ve.
   Mot the nho canh goc man hinh (Windows: goc duoi-phai, cao hon vung nut tron cua khay; Mac: goc tren-phai duoi thanh menu), noi:
   phim chup · phim nay trung Luu thanh cua Premiere, Photoshop, AE thi tu doi (anh chot 07/11: giu phim mac dinh, chi huong dan) · bieu tuong o dau · khay se tu thu ve nut tron. Co nut Doi phim (mo Cai dat) va Da hieu. KHONG chan gi: khong hoi
   thoai, khong cuop tieu diem (showInactive), khong tu mat sau mot thoi gian — dong khi bam nut hoac khi nguoi dung chup lan dau.
   CHI HIEN cho may MOI: chua co cau-hinh.json, ban-quyen.json, file hong, khong dang do, chua tung hien (co lanDauDaHien).
   May anh Tien da co cau hinh nen KHONG BAO GIO thay the nay. Ghi co NGAY LUC HIEN (ghi cau-hinh.json) nen khong hien lai.
   File nay khong goi truc tiep electron (nhan qua deps) -> do duoc bang bai do an: scripts/test/do-de-dung.cjs.
   ========================================================================= */
const path = require('path')

const THE = { RONG: 388, CAO_MAC_DINH: 300, LE: 12, NUT_TRON: 80, KHE: 8 } // DIP; RONG gom 14 px bong moi ben

/** May moi? Tat ca dieu kien phai dung. `o` = { coCauHinh, coBanQuyen, coFileHong, daHien, dangDo } */
function nenHienThe(o) {
  const x = o || {}
  return !x.coCauHinh && !x.coBanQuyen && !x.coFileHong && !x.daHien && !x.dangDo
}

/** Doc thu muc du lieu: may moi = khong co cau-hinh.json, ban-quyen.json va file .hong-*. Goi TRUOC moi lan ghi vao userData. */
function docDauHieuMayMoi(fs, thuMuc) {
  let ds = []
  try { ds = fs.readdirSync(thuMuc) } catch (e) { ds = [] }
  return {
    coCauHinh: ds.includes('cau-hinh.json'),
    coBanQuyen: ds.includes('ban-quyen.json'),
    coFileHong: ds.some((n) => /^(cau-hinh|ban-quyen)\.hong-/.test(n)),
  }
}

/** Vi tri cua so the (toan cuc DIP). wa = workArea man dang co chuot / man chinh. Luon nam trong wa. */
function tinhViTri(wa, w, h, nenTang) {
  const ww = Math.min(w, wa.width), hh = Math.min(h, wa.height)
  const x = wa.x + wa.width - ww - THE.LE
  // Windows / Linux: khay he thong o duoi-phai -> the nam TREN vung nut tron cua khay (80 px) de khay thu ve nut khong de len the.
  // Mac: thanh menu o tren -> the nam ngay duoi thanh menu, xa goc duoi-phai.
  const y = nenTang === 'darwin' ? wa.y + THE.LE : wa.y + wa.height - hh - THE.NUT_TRON - THE.KHE
  const kep = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b))
  return { x: kep(x, wa.x, wa.x + wa.width - ww), y: kep(y, wa.y, wa.y + wa.height - hh), width: ww, height: hh }
}

/**
 * deps: { electron: { BrowserWindow, screen, ipcMain }, ghiLog, moiDesktop(w, ten), phim(): chuoi phim da dinh dang,
 *         lang(): 'vi'|'en', nenTang, doiPhim(): mo Cai dat, ghiCo(): ghi co lanDauDaHien, hienThat: false khi do (mac dinh true) }
 */
function taoTheLanDau(deps) {
  const { BrowserWindow, screen, ipcMain } = deps.electron
  const log = deps.ghiLog || (() => {})
  const nenTang = deps.nenTang || process.platform
  let win = null
  let wcId = null
  const laThe = (e) => !!win && !win.isDestroyed() && e.sender === win.webContents

  const dong = (lyDo) => {
    if (!win || win.isDestroyed()) { win = null; return false }
    log('the lan dau: dong (' + (lyDo || '?') + ')')
    try { win.destroy() } catch (e) {}
    win = null
    return true
  }
  const handlers = [
    ['lan-dau:cao', (e, h) => {
      if (!laThe(e)) return
      const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const cao = Math.max(160, Math.min(Math.round(Number(h) || THE.CAO_MAC_DINH), wa.height))
      const b = tinhViTri(wa, THE.RONG, cao, nenTang)
      win.setBounds(b)
      if (deps.hienThat !== false) win.showInactive()
      log('the lan dau: hien ' + b.width + 'x' + b.height + ' tai ' + b.x + ',' + b.y)
    }],
    ['lan-dau:dong', (e) => { if (laThe(e)) dong('da hieu') }],
    ['lan-dau:doi-phim', (e) => { if (!laThe(e)) return; dong('doi phim'); try { deps.doiPhim() } catch (err) {} }],
  ]
  for (const [k, f] of handlers) ipcMain.on(k, f)

  return {
    mo() {
      if (win && !win.isDestroyed()) return win
      try { deps.ghiCo() } catch (e) { log('the lan dau: ghi co LOI ' + e.message) }
      const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const b = tinhViTri(wa, THE.RONG, THE.CAO_MAC_DINH, nenTang)
      win = new BrowserWindow({
        x: b.x, y: b.y, width: b.width, height: b.height,
        frame: false, transparent: true, backgroundColor: '#00000000', thickFrame: false, hasShadow: false,
        resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
        alwaysOnTop: true, skipTaskbar: true, focusable: true, show: false,
        webPreferences: { preload: path.join(__dirname, 'preload-lan-dau.js'), contextIsolation: true, sandbox: false },
      })
      wcId = win.webContents.id
      win.setAlwaysOnTop(true, 'floating')
      if (deps.moiDesktop) deps.moiDesktop(win, 'the lan dau')
      win.on('closed', () => { win = null })
      win.webContents.on('console-message', (e, level, msg) => {
        const nang = typeof level === 'number' ? level >= 3 : e.level === 'error'
        if (nang) log('the lan dau LOI trang: ' + String(msg || e.message).slice(0, 200))
      })
      win.loadFile(path.join(__dirname, 'lan-dau', 'index.html'), { query: { phim: String(deps.phim() || ''), mac: nenTang === 'darwin' ? '1' : '0' } })
      return win
    },
    dong,
    dangMo: () => !!win && !win.isDestroyed(),
    cuaSo: () => (win && !win.isDestroyed() ? win : null),
    go() { for (const [k, f] of handlers) ipcMain.removeListener(k, f); dong('go') },
  }
}

module.exports = { nenHienThe, docDauHieuMayMoi, tinhViTri, taoTheLanDau, THE }
