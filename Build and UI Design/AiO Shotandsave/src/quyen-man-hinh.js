'use strict'

/* =========================================================================
   quyen-man-hinh.js — macOS: bao RO khi app chua duoc cap quyen "Ghi man hinh"
   -------------------------------------------------------------------------
   04/10 (anh Tien, may Mac): "anh bam option + 1 no chop 1 cai overlay roi mat luon". Run-log: 35 lan bam chup,
   lan nao cung `Failed to get sources` (macOS chua cap quyen "Screen & System Audio Recording" cho ban dang chay).
   App CO gui Notification `app.khongChupDuoc` nhung thong bao khong hien tren may anh -> that bai IM LANG.
   App ky ad-hoc: moi ban dung la mot danh tinh moi voi macOS -> quyen phai bat lai sau MOI lan cai ban moi, nen
   loi nay se gap lai hoai. Cach: hop thoai that (dialog) noi ro ly do + nut mo dung trang quyen.

   KHONG require electron: moi thu tiem vao qua taoKiemQuyen({...}) -> do duoc bang node thuan
   (scripts/test/do-quyen.cjs). Windows / Linux: moi ham tra false, khong hien gi.
   ========================================================================= */

const URL_QUYEN = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'

function taoKiemQuyen({ platform = process.platform, systemPreferences, dialog, shell, T, ghiLog = () => {}, app = null }) {
  const laMac = platform === 'darwin'
  let dangHoi = null // Promise cua hop thoai dang mo (chi 1 hop thoai mot luc)

  /** 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unknown' */
  function trangThai() {
    if (!laMac) return 'granted'
    try { return systemPreferences.getMediaAccessStatus('screen') || 'unknown' } catch (e) { return 'unknown' }
  }

  function bao(lyDo) {
    if (dangHoi) return dangHoi
    ghiLog('quyen man hinh: CHUA CO (' + lyDo + '), hien hop thoai')
    dangHoi = (async () => {
      try {
        if (app && typeof app.focus === 'function') { try { app.focus({ steal: true }) } catch (e) {} }
        const r = await dialog.showMessageBox({
          type: 'warning', title: 'AiO Shot & Save',
          message: T('quyen.tieuDe'), detail: T('quyen.noiDung'),
          buttons: [T('quyen.moCaiDat'), T('quyen.deSau')], defaultId: 0, cancelId: 1, noLink: true,
        })
        if (r && r.response === 0) {
          ghiLog('quyen man hinh: mo Cai dat he thong')
          await shell.openExternal(URL_QUYEN)
        }
      } catch (e) {
        ghiLog('quyen man hinh: LOI hop thoai ' + ((e && e.message) || e))
      } finally { dangHoi = null }
    })()
    return dangHoi
  }

  /** Goi DAU luot chup. true = CHAN luot nay (da hien hop thoai, khoi chop overlay); false = cu chup.
      'not-determined': de macOS tu hoi lan dau. 'unknown': cu thu, hong thi baoKhiChupHong lo. */
  function chanTruocKhiChup() {
    if (!laMac) return false
    const tt = trangThai()
    if (tt !== 'denied' && tt !== 'restricted') return false
    bao('truoc khi chup: ' + tt)
    return true
  }

  /** Goi khi chup xong ma KHONG man nao co anh. true = da hien hop thoai (ben goi khoi bao kieu cu).
      Co quyen ma van hong = loi khac -> tra false, de ben goi bao nhu cu. */
  function baoKhiChupHong() {
    if (!laMac) return false
    const tt = trangThai()
    if (tt === 'granted') return false
    bao('chup hong: ' + tt)
    return true
  }

  return { trangThai, chanTruocKhiChup, baoKhiChupHong, dangHoi: () => dangHoi }
}

module.exports = { taoKiemQuyen, URL_QUYEN }
