/**
 * sync.js — bộ não TỰ SYNC MIC của AiO Auto Podcast (v0.4.0, 04/08/2026).
 *
 * THUẦN như nao.js: không import gì, không đụng Node/CEP — nhờ vậy
 * `node tests/kiem-sync.mjs` chạy được ngoài Premiere và toàn bộ phần toán
 * quyết-định-mốc kiểm chứng được bằng số TRƯỚC khi đụng timeline.
 *
 * Bài toán: người dùng có sequence với CAM đã đặt, và các FILE MIC rời chưa
 * nằm trong sequence. Tool phải tự tìm mốc đặt mic — vì đặt tay là dính bẫy
 * "dán mic vào đầu clip cam" (vấp thật 04/08: tiếng trễ môi 1,17–1,54s,
 * nhát cắt đội ảo 103→193 — PROGRESS mục [mic-lech-moc]).
 *
 * Cách đo: tương quan chéo đường bao âm lượng (dB, cửa sổ 20ms như não):
 *   1. Quét THÔ ở bước 0,2s (gộp 10 cửa sổ) trong ±quétGiây.
 *   2. Chốt TIN CẬY bằng HAI NỬA ĐỘC LẬP: nửa đầu và nửa sau file phải
 *      cùng chỉ về một mốc (lệch ≤ 0,6s). KHÔNG dùng ngưỡng r tuyệt đối —
 *      bài học 04/08: r=0,13–0,17 vẫn là mốc ĐÚNG (đối chiếu PluralEyes),
 *      ngưỡng r≥0,25 từng loại nhầm cặp đúng.
 *   3. Tinh chỉnh ở bước 20ms trong ±1,5s quanh mốc thô.
 *
 * Đã đối chiếu thước ngoài (03–04/08): lệch PluralEyes trung bình 0,59
 * frame; cặp C4026↔mic 0,30 frame; thắng PluralEyes ở ca nó bỏ cuộc
 * (mic Trọng bị nó vứt cuối timeline, thuật toán này sync được).
 *
 * QUY ƯỚC DẤU (đừng đổi — bộ kiểm khoá chặt):
 *   offsetGiay L nghĩa là:  mic_file_time = cam_file_time + L
 *   (L > 0: máy mic bấm ghi TRƯỚC cam L giây — sự kiện tại giây f của file
 *   cam nằm ở giây f+L của file mic.)
 */
var AiOSync = (function () {
  'use strict'

  /** Gộp k giá trị dB liên tiếp thành 1 (trung bình) — bước thô 0,2s = k 10. */
  function giamMau(db, k) {
    var n = Math.floor(db.length / k)
    var ra = new Float64Array(n)
    for (var i = 0; i < n; i++) {
      var s = 0
      for (var j = 0; j < k; j++) s += db[i * k + j]
      ra[i] = s / k
    }
    return ra
  }

  /** Chuẩn hoá z-score — tương quan không bị lệch vì mức thu khác nhau. */
  function chuanHoa(arr) {
    var n = arr.length
    var m = 0
    var i
    for (i = 0; i < n; i++) m += arr[i]
    m /= n
    var sd = 0
    for (i = 0; i < n; i++) sd += (arr[i] - m) * (arr[i] - m)
    sd = Math.sqrt(sd / n) || 1
    var ra = new Float64Array(n)
    for (i = 0; i < n; i++) ra[i] = (arr[i] - m) / sd
    return ra
  }

  /**
   * Tìm lag tốt nhất giữa hai dãy ĐÃ chuẩn hoá.
   * b[i + lag] ghép với a[i] — lag dương nghĩa là b TRỄ hơn a.
   * @param toiThieu  số mẫu chồng lấn tối thiểu để một lag được xét
   */
  function timLag(a, b, lagMax, toiThieu) {
    var best = { lag: 0, r: -2 }
    for (var lag = -lagMax; lag <= lagMax; lag++) {
      var i0 = Math.max(0, -lag)
      var i1 = Math.min(a.length, b.length - lag)
      var n = i1 - i0
      if (n < toiThieu) continue
      var s = 0
      for (var i = i0; i < i1; i++) s += a[i] * b[i + lag]
      var r = s / n
      if (r > best.r) best = { lag: lag, r: r }
    }
    return best
  }

  /**
   * Đo offset giữa đường bao dB của CAM (mốc) và MIC.
   * @param dbCam  Float32Array dB cửa sổ 20ms của tiếng cam (từ AiONao.doDb)
   * @param dbMic  cùng dạng, của file mic
   * @param opts   { quetGiay: ±phạm vi quét thô (mặc định 900s),
   *                 cuaGiay: cỡ cửa sổ dB (mặc định 0.02) }
   * @return { tinCay, offsetGiay, r, lech2NuaGiay, viSao }
   */
  function timOffset(dbCam, dbMic, opts) {
    opts = opts || {}
    var CUA = opts.cuaGiay || 0.02
    var GOP = 10                              // 20ms -> 0,2s
    var BUOC_THO = CUA * GOP
    var quetGiay = opts.quetGiay || 900
    var lagMax = Math.round(quetGiay / BUOC_THO)

    var thoCamRaw = giamMau(dbCam, GOP)
    var thoMicRaw = giamMau(dbMic, GOP)
    if (thoCamRaw.length < 50 || thoMicRaw.length < 50) {
      return { tinCay: false, offsetGiay: 0, r: 0, lech2NuaGiay: 0, viSao: 'FILE_QUA_NGAN' }
    }
    var thoCam = chuanHoa(thoCamRaw)
    var thoMic = chuanHoa(thoMicRaw)

    // Chồng lấn tối thiểu: 1/4 file ngắn hơn (ít nhất 25 mẫu = 5s)
    var toiThieu = Math.max(25, Math.floor(Math.min(thoCam.length, thoMic.length) / 4))

    // ── Chốt tin cậy: HAI NỬA ĐỘC LẬP phải cùng chỉ một mốc ──
    var nuaN = Math.floor(thoCam.length / 2)
    var nuaDau = chuanHoa(thoCamRaw.slice(0, nuaN))
    var nuaSau = chuanHoa(thoCamRaw.slice(nuaN))
    var t1 = timLag(nuaDau, thoMic, lagMax, Math.max(25, Math.floor(nuaN / 4)))
    // nửa sau bắt đầu ở mẫu nuaN của cam → lag so với mic phải TRỪ nuaN đi
    var t2 = timLag(nuaSau, thoMic, lagMax + nuaN, Math.max(25, Math.floor(nuaN / 4)))
    var lag2QuyVe = t2.lag - nuaN
    var lech2Nua = Math.abs(t1.lag - lag2QuyVe) * BUOC_THO
    if (lech2Nua > 0.6) {
      return {
        tinCay: false, offsetGiay: 0, r: Math.max(t1.r, t2.r),
        lech2NuaGiay: lech2Nua, viSao: 'HAI_NUA_KHONG_KHOP',
      }
    }

    // ── Mốc thô = quét cả file (chắc hơn từng nửa) ──
    var tho = timLag(thoCam, thoMic, lagMax, toiThieu)

    // ── Tinh chỉnh 20ms trong ±1,5s quanh mốc thô ──
    var mCam = chuanHoa(dbCam)
    var mMic = chuanHoa(dbMic)
    var tam = tho.lag * GOP
    var vung = Math.round(1.5 / CUA)
    var best = { lag: tam, r: -2 }
    var toiThieuMin = Math.max(250, Math.floor(Math.min(mCam.length, mMic.length) / 4))
    for (var lag = tam - vung; lag <= tam + vung; lag++) {
      var i0 = Math.max(0, -lag)
      var i1 = Math.min(mCam.length, mMic.length - lag)
      var n = i1 - i0
      if (n < toiThieuMin) continue
      var s = 0
      for (var i = i0; i < i1; i++) s += mCam[i] * mMic[i + lag]
      var r = s / n
      if (r > best.r) best = { lag: lag, r: r }
    }

    return {
      tinCay: true,
      offsetGiay: best.lag * CUA,
      r: best.r,
      lech2NuaGiay: lech2Nua,
      viSao: '',
    }
  }

  /**
   * Từ offset ra chỗ ĐẶT mic trên timeline.
   * Cam mốc nằm trên sequence tại start S, inPoint I (giây).
   * mic_file = cam_file + L  →  mic_file_0 nằm tại timeline S − I − L.
   * Âm thì không đặt được (timeline không có thời gian âm) → cắt đầu mic.
   * @return { viTriGiay, catDauGiay }
   */
  function viTriDat(S, I, L) {
    var moc = S - I - L
    if (moc >= 0) return { viTriGiay: moc, catDauGiay: 0 }
    return { viTriGiay: 0, catDauGiay: -moc }
  }

  /** p50 dB của một dãy cửa sổ — chọn cam MỐC (loại cam câm kiểu C4234). */
  function p50(db) {
    var m = Array.prototype.slice.call(db).sort(function (a, b) { return a - b })
    if (!m.length) return -120
    return m[Math.floor(m.length * 0.5)]
  }

  return {
    timOffset: timOffset,
    viTriDat: viTriDat,
    p50: p50,
    giamMau: giamMau,
    chuanHoa: chuanHoa,
    timLag: timLag,
  }
})()

if (typeof module !== 'undefined' && module.exports) module.exports = AiOSync
