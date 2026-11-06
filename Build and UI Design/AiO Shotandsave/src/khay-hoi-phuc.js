'use strict'

/* =========================================================================
   khay-hoi-phuc.js — TRANG KHAY CHET THI TU SONG LAI (06/11/2026)
   -------------------------------------------------------------------------
   Anh Tien (05/11, MacBook): chup xong anh co luu nhung KHONG hien trong khay. Run-log Windows 306 luot chup 0 luot mat.
   Doc ma (soat dot 2, muc 2): ensureShelf chi kiem `shelfWin && !isDestroyed()`. Tien trinh ve (renderer) cua khay chet
   (render-process-gone) hoac treo (unresponsive) trong khi BrowserWindow van con -> moi lan chup sau van gui vao trang chet,
   mo khay tu menu cung dung lai cua so hong; `taoGuiChac` gui 3 lan khong ai xac nhan thi chi ghi log roi bo.
   Nay: (1) render-process-gone -> nap lai trang, did-finish-load gui lai DU danh sach; (2) unresponsive qua `treMs` ma van
   chua tinh lai -> ep renderer chet (forcefullyCrashRenderer) roi vao nhanh (1); (3) gui 3 lan khong xac nhan -> `napLai`.
   Chong vong lap: toi da `toiDa` lan trong `trongMs`, qua thi dong cua so (lan chup sau ensureShelf tao cua so moi).
   Moi buoc deu ghi run-log de lan sau doc la biet.

   KHONG require electron: cua so + bo hen tiem vao, do duoc bang cua so an that (scripts/test/do-khay-chet.cjs).
   ========================================================================= */

function ganHoiPhuc(win, { ghiLog = () => {}, guiLai = () => {}, toiDa = 4, trongMs = 60000, treMs = 8000, soMuc = () => 0,
  datHen = setTimeout, huyHen = clearTimeout, bayGio = Date.now } = {}) {
  const wc = win.webContents
  const lanNap = [] // moc thoi gian cac lan tu nap lai
  let henTreo = null, dangNap = false, tuBo = false

  function napLai(lyDo) {
    if (tuBo || win.isDestroyed()) return false
    if (dangNap && wc.isLoading()) { ghiLog('khay: dang nap lai, bo qua yeu cau (' + lyDo + ')'); return false }
    const t = bayGio()
    while (lanNap.length && t - lanNap[0] > trongMs) lanNap.shift()
    if (lanNap.length >= toiDa) {
      tuBo = true
      ghiLog('khay LOI: ' + lanNap.length + ' lan nap lai trong ' + Math.round(trongMs / 1000) + ' giay van chet (' + lyDo + ') -> dong cua so khay, lan chup sau tao cua so moi')
      try { win.destroy() } catch (e) {}
      return false
    }
    lanNap.push(t)
    dangNap = true
    ghiLog('khay: TU CUU nap lai trang khay (' + lyDo + '), khay co ' + soMuc() + ' anh, lan ' + lanNap.length + '/' + toiDa)
    try { wc.reload() } catch (e) {
      ghiLog('khay: reload LOI ' + ((e && e.message) || e) + ' -> loadURL lai')
      try { wc.loadURL(wc.getURL()) } catch (e2) { ghiLog('khay LOI: khong nap lai duoc: ' + ((e2 && e2.message) || e2)) }
    }
    return true
  }

  wc.on('render-process-gone', (_e, d) => {
    ghiLog('khay LOI: tien trinh ve cua trang khay chet (ly do ' + (d && d.reason) + ', ma ' + (d && d.exitCode) + ')')
    napLai('render-process-gone ' + (d && d.reason))
  })
  wc.on('unresponsive', () => {
    ghiLog('khay LOI: trang khay khong tra loi, doi ' + Math.round(treMs / 1000) + ' giay roi ep nap lai')
    if (henTreo) huyHen(henTreo)
    henTreo = datHen(() => {
      henTreo = null
      if (win.isDestroyed()) return
      ghiLog('khay: trang khay van treo -> ep tien trinh ve chet de nap lai')
      try { wc.forcefullyCrashRenderer() } catch (e) { napLai('unresponsive (khong ep duoc)') }
    }, treMs)
  })
  wc.on('responsive', () => {
    if (henTreo) { huyHen(henTreo); henTreo = null; ghiLog('khay: trang khay tra loi lai, khong can nap lai') }
  })
  wc.on('did-fail-load', (_e, ma, mota, url, laKhung) => {
    if (laKhung) ghiLog('khay LOI: nap trang khay hong (' + ma + ' ' + mota + ')')
  })
  wc.on('did-finish-load', () => {
    dangNap = false
    if (win.isDestroyed()) return
    try { guiLai(win) } catch (e) { ghiLog('khay LOI: gui lai danh sach: ' + ((e && e.message) || e)) }
  })
  win.on('closed', () => { if (henTreo) huyHen(henTreo); henTreo = null })

  return { napLai, daTuBo: () => tuBo, soLanNap: () => lanNap.length }
}

module.exports = { ganHoiPhuc }
