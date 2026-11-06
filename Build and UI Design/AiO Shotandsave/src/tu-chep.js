'use strict'
/* =========================================================================
   BAM XONG = TU CHEP ANH VAO CLIPBOARD (06/11/2026)
   Nguoi moi chup xong, bam Xong roi dan (Ctrl+V) vao chat thi khong co gi — chi Ctrl+C moi chep (thoi quen "Lightshot / Snipping Tool").
   Nay duong Xong cung chep nhu Ctrl+C. MAC DINH BAT cho CA nguoi cu lan nguoi moi (khoa cau hinh tuChepXong chua dat = bat).
   ☠️ MOT cho kiem cau hinh duy nhat: doi mac dinh chi sua hang TU_CHEP_MAC_DINH o day, handleConfirm (main.js) goi nenChep().
   ========================================================================= */
const TU_CHEP_MAC_DINH = true

/** Cau hinh co bat tu chep khi bam Xong khong. Chua dat / gia tri la -> mac dinh. */
function tuChepKhiXong(cauHinh) {
  const v = cauHinh && cauHinh.tuChepXong
  return typeof v === 'boolean' ? v : TU_CHEP_MAC_DINH
}

/** handleConfirm: co chep anh vao clipboard khong? Ctrl+C luon chep (payload.copy); bam Xong chep khi cai dat bat. */
function nenChep(payload, cauHinh) {
  return !!(payload && payload.copy) || tuChepKhiXong(cauHinh)
}

module.exports = { TU_CHEP_MAC_DINH, tuChepKhiXong, nenChep }
