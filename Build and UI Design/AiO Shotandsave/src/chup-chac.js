'use strict'

/* =========================================================================
   chup-chac.js — MOI LAN CHUP PHAI TOI KHAY (05/11/2026)
   -------------------------------------------------------------------------
   Anh Tien (05/11, MacBook cong ty): "anh chup rat nhieu ... phan khay no khong tu luu vao ... doi luc bi loi ...
   chac chan 100% luc nao no cung chay". Run-log may Windows: 306 luot chup, 0 luot mat -> loi nam o duong rieng cua Mac.
   Doc ma ra 4 lo, moi lo mat anh IM LANG tren Mac (Notification khong hien tren may anh, so loi #20):
   1. Khung chup hien o desktop khac / sau app toan man hinh: nguoi dung khong thay, `overlayWins` con day nen moi lan bam
      phim sau deu bi bo qua toi khi tat app (so loi #22: overlay chua khai di theo moi desktop) -> `overlayKet`.
   2. getSources hong mot lan la bo ca luot chup -> `thuLai`.
   3. handleConfirm la ham async goi khong await: loi nem ben trong bien mat, khong log, khong bao.
   4. Lenh them anh gui sang trang khay khong ai xac nhan -> `taoGuiChac`: trang bao da ve, chua bao thi gui lai.

   KHONG require electron: do duoc bang node thuan (scripts/test/do-chup-chac.cjs).
   ========================================================================= */

const cho = (ms) => new Promise((r) => setTimeout(r, ms))

/** Goi `lam()` toi khi `du(ketQua)` dung. Het luot thi tra ket qua tot nhat da co (nhieu man nhat), khong nem loi. */
async function thuLai(lam, { lan = 3, tre = 150, du = (k) => k && k.length > 0, ghiLog = () => {}, ten = 'viec' } = {}) {
  let tot = null
  for (let i = 1; i <= lan; i++) {
    let k = null
    try { k = await lam() } catch (e) { ghiLog('LOI ' + ten + ' lan ' + i + ': ' + ((e && e.message) || e)) }
    if (k && (!tot || (k.length || 0) >= (tot.length || 0))) tot = k
    if (k && du(k)) {
      if (i > 1) ghiLog(ten + ': lan ' + i + ' moi duoc')
      return k
    }
    if (i < lan) { ghiLog(ten + ': lan ' + i + ' thieu, thu lai sau ' + tre + ' ms'); await cho(tre) }
  }
  return tot || []
}

/** Bam phim chup luc man chup van con mo. Nguoi dung chua cham vao man chup sau `moiMs` -> coi la KET, mo lai.
    Da bam chuot / keo (coTuongTac) thi la dang lam viec that: bo qua nhu cu, khong duoc lam mat vung ho dang chon.
    `moiMs` chan cu bam dup phim trong luc man chup vua hien. */
function overlayKet({ coCuaSo, coTuongTac, moLuc, bayGio, moiMs = 1200 }) {
  return !!coCuaSo && !coTuongTac && bayGio - moLuc >= moiMs
}

/** Gui mot muc sang trang khay va CHO trang bao da ve. Khong co tin bao sau `henMs` thi gui lai, toi da `lan` lan,
    roi ghi log. `gui(muc)` co the nem (cua so vua dong): tinh la mot lan chua toi. */
function taoGuiChac({ gui, ghiLog = () => {}, henMs = 1500, lan = 3, datHen = setTimeout, huyHen = clearTimeout }) {
  const cho = new Map() // id -> { muc, daGui, hen }
  function thu(id) {
    const c = cho.get(id)
    if (!c) return
    if (c.daGui >= lan) {
      cho.delete(id)
      ghiLog('LOI khay: trang khay khong xac nhan anh #' + id + ' sau ' + lan + ' lan gui')
      return
    }
    c.daGui++
    if (c.daGui > 1) ghiLog('khay: gui lai anh #' + id + ' lan ' + c.daGui)
    try { gui(c.muc) } catch (e) { ghiLog('khay: gui anh #' + id + ' loi: ' + ((e && e.message) || e)) }
    c.hen = datHen(() => thu(id), henMs)
  }
  return {
    gui(muc) { cho.set(muc.id, { muc, daGui: 0, hen: null }); thu(muc.id) },
    daNhan(id) { const c = cho.get(id); if (!c) return; huyHen(c.hen); cho.delete(id) },
    /** Muc da bi nguoi dung xoa truoc khi trang kip bao. */
    bo(id) { this.daNhan(id) },
    conCho: () => cho.size,
  }
}

module.exports = { thuLai, overlayKet, taoGuiChac }
