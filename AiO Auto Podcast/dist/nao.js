/**
 * nao.js — não "AI ĐANG NÓI" của AiO Auto Podcast.
 *
 * THUẦN: không import gì, không đụng Node, không đụng CEP — nhờ vậy
 * `node tests/kiem-nao.mjs` chạy được ngoài Premiere và toàn bộ phần quyết
 * định cắt ở đâu kiểm chứng được bằng số (bài học 5h: viết phép đo trước).
 *
 * Thuật toán (spike 01/08/2026, đo trên liệu tổng hợp CÓ ĐÁP ÁN):
 *   1. RMS cửa sổ 20 ms từng mic → dBFS (đường đo của Autocut amluong.ts).
 *   2. Mỗi cửa sổ: mic to nhất chênh mic nhì ≥ 6 dB → người đó đang nói.
 *      Không chênh đủ → cửa sổ "mù", giữ người đang nói trước đó (hysteresis).
 *   3. Nuốt lượt ngắn hơn 1 s (chống nhấp nháy cam — anh Tiến chốt: đây là
 *      chống lỗi kỹ thuật, không phải "tối ưu nhịp dựng").
 *   Kết quả spike: bleed −16 dB và −8 dB → 10/10 lượt, lệch ranh 0 ms.
 *   Bleed −5 dB (dưới ngưỡng) → tỉ lệ cửa sổ rõ tụt → TRẢ LỖI "không phân
 *   biệt được" thay vì đoán bậy (gãy an toàn — panel phải báo người dùng
 *   kiểm tra thu âm, không được im lặng).
 */
var AiONao = (function () {
  'use strict'

  var CUA_GIAY = 0.02
  var DAY = -90 // đáy dB; dưới mức này coi như im tuyệt đối

  /**
   * Đọc file WAV PCM 16-bit (mono) đã nằm sẵn trong bộ nhớ.
   * Trả { sr, pcm: Int16Array } hoặc null nếu file hỏng — bên gọi phải chịu
   * được null, mất một mic chứ không được sập.
   */
  function taiWav(buf) {
    if (!buf || buf.byteLength < 44) return null
    var dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    function doc4(p) {
      return String.fromCharCode(buf[p], buf[p + 1], buf[p + 2], buf[p + 3])
    }
    if (doc4(0) !== 'RIFF' || doc4(8) !== 'WAVE') return null
    var pos = 12
    var dataOff = 0
    var dataLen = 0
    var sr = 0
    try {
      while (pos < buf.byteLength - 8) {
        var id = doc4(pos)
        var sz = dv.getUint32(pos + 4, true)
        if (id === 'fmt ') sr = dv.getUint32(pos + 12, true)
        if (id === 'data') {
          dataOff = pos + 8
          dataLen = Math.min(sz, buf.byteLength - dataOff)
          break
        }
        pos += 8 + sz + (sz & 1)
      }
    } catch (e) {
      return null
    }
    if (!dataLen || !(sr > 0)) return null
    var soMau = Math.floor(dataLen / 2)
    var pcm
    try {
      pcm = new Int16Array(buf.buffer, buf.byteOffset + dataOff, soMau)
    } catch (e2) {
      return null // dataOff lẻ — file lạ, bỏ qua
    }
    return { sr: sr, pcm: pcm }
  }

  /** RMS từng cửa sổ 20 ms → dBFS. Int16Array + vòng trần (nhanh ~20 lần). */
  function doDb(pcm, sr) {
    var cua = Math.round(sr * CUA_GIAY)
    var soCua = Math.floor(pcm.length / cua)
    var ra = new Float32Array(soCua)
    for (var w = 0; w < soCua; w++) {
      var tong = 0
      var goc = w * cua
      for (var i = 0; i < cua; i++) {
        var m = pcm[goc + i]
        tong += m * m
      }
      var rms = Math.sqrt(tong / cua) / 32768
      ra[w] = rms > 0 ? Math.max(DAY, 20 * Math.log10(rms)) : DAY
    }
    return ra
  }

  /**
   * Sàn "coi là CÓ TIẾNG" — TỰ ĐO từ chính liệu, không dùng số cứng.
   *
   * ☠️ Vì sao bỏ hằng số −50 dB (đo thật 04/08/2026, liệu phỏng vấn 44 phút):
   * mic thật thu nhỏ, mức GIỮA của cả hai mic là −54,6 / −54,8 dBFS — tức
   * NẰM DƯỚI sàn. Sàn cứng gạt thẳng **57% số cửa sổ** trước khi kịp so
   * sánh, nên não chỉ quyết định được 23% thời lượng, 77% còn lại là giữ
   * người trước (đoán). Bàn đo có ĐÁP ÁN ở 4 mức âm lượng: sàn cứng đạt
   * 12/12 khi tiếng to (−24/−40 dBFS) nhưng **0/6 khi tiếng nhỏ**
   * (−54/−60 dBFS); mọi công thức tự đo đều 12/12.
   *
   * Cách đo: Otsu trên histogram dB 1 dB/bin — cùng đường Autocut đã đi khi
   * bỏ ngưỡng im lặng −30 dB cứng. Otsu tách histogram thành hai cụm "nền
   * phòng" và "có tiếng" rồi lấy ranh giữa, nên tự co giãn theo từng file.
   * Kẹp trong [−75, −35] để một file dị dạng không kéo sàn đi quá xa.
   */
  function sanTuDo(mics) {
    var B = 90 // bin 1 dB, từ −90 đến 0
    var h = new Array(B)
    for (var b = 0; b < B; b++) h[b] = 0
    var N = 0
    for (var m = 0; m < mics.length; m++) {
      var d = mics[m].db
      for (var i = 0; i < d.length; i++) {
        var v = d[i]
        if (v <= DAY + 1) continue // ngoài vùng thu / im tuyệt đối — không phải nền phòng
        var k = Math.floor(v + 90)
        if (k < 0) k = 0
        if (k >= B) k = B - 1
        h[k]++
        N++
      }
    }
    if (N < 100) return -50 // quá ít dữ liệu để đo — về số cũ
    var best = -1, bestVar = -1
    var w0 = 0, s0 = 0, tong = 0
    for (var b2 = 0; b2 < B; b2++) tong += h[b2] * b2
    for (var t = 1; t < B; t++) {
      w0 += h[t - 1]
      s0 += h[t - 1] * (t - 1)
      var w1 = N - w0
      if (!w0 || !w1) continue
      var hieu = s0 / w0 - (tong - s0) / w1
      var giaTri = w0 * w1 * hieu * hieu
      if (giaTri > bestVar) { bestVar = giaTri; best = t }
    }
    if (best < 0) return -50
    var san = best - 90
    if (san < -75) san = -75
    if (san > -35) san = -35
    return san
  }

  /**
   * Quyết định AI ĐANG NÓI trên trục thời gian SEQUENCE.
   *
   * @param mics  [{ db: Float32Array, offset: giây }] — offset = mốc MEDIA trừ
   *              mốc SEQUENCE của mic đó (panel tính từ inPoint − start clip).
   * @param daiGiay  thời lượng cần phủ (giây, trục sequence)
   * @param opts  { nguongChenh=6, nguongSan=<TỰ ĐO>, luotToiThieu=1, toiThieuRo=0.2 }
   *              nguongSan truyền số thì ÉP CỨNG (bộ kiểm dùng để quét ngưỡng).
   * @return { trangThai: 'OK'|'KHONG_PHAN_BIET'|'RONG',
   *           doan: [{tu, den, nguoi}],  // phủ kín [0, daiGiay], không hở
   *           thongKe: { soCua, tyLeRo, cuaMoiNguoi: [], san } }
   */
  function aiDangNoi(mics, daiGiay, opts) {
    opts = opts || {}
    var CHENH = opts.nguongChenh !== undefined ? opts.nguongChenh : 6
    var SAN = opts.nguongSan !== undefined ? opts.nguongSan
      : (mics && mics.length >= 2 ? sanTuDo(mics) : -50)
    var LUOT = opts.luotToiThieu !== undefined ? opts.luotToiThieu : 1
    var RO = opts.toiThieuRo !== undefined ? opts.toiThieuRo : 0.2

    if (!mics || mics.length < 2 || !(daiGiay > 0)) return { trangThai: 'RONG', doan: [], thongKe: null }
    var soCua = Math.floor(daiGiay / CUA_GIAY)
    if (soCua < 1) return { trangThai: 'RONG', doan: [], thongKe: null }

    // dB của mic m tại cửa sổ sequence w (ngoài vùng thu → đáy).
    function db(m, w) {
      var t = w * CUA_GIAY + mics[m].offset
      var i = Math.round(t / CUA_GIAY)
      if (i < 0 || i >= mics[m].db.length) return DAY
      return mics[m].db[i]
    }

    // ── 1. Cửa sổ thô: -1 = mù (không chênh đủ hoặc cả phòng im) ──
    var tho = new Int16Array(soCua)
    var soRo = 0
    var cuaMoiNguoi = []
    for (var m0 = 0; m0 < mics.length; m0++) cuaMoiNguoi.push(0)
    for (var w = 0; w < soCua; w++) {
      var nhat = -1
      var dbNhat = -Infinity
      var dbNhi = -Infinity
      for (var m = 0; m < mics.length; m++) {
        var v = db(m, w)
        if (v > dbNhat) { dbNhi = dbNhat; dbNhat = v; nhat = m }
        else if (v > dbNhi) { dbNhi = v }
      }
      if (dbNhat >= SAN && dbNhat - dbNhi >= CHENH) {
        tho[w] = nhat
        soRo++
        cuaMoiNguoi[nhat]++
      } else {
        tho[w] = -1
      }
    }

    var tyLeRo = soRo / soCua
    // ── Gãy an toàn: gần như không cửa sổ nào phân biệt được → mic giống
    //    nhau quá (bleed nặng) hoặc cả file im — KHÔNG đoán bậy. ──
    if (tyLeRo < RO) {
      return {
        trangThai: 'KHONG_PHAN_BIET',
        doan: [],
        thongKe: { soCua: soCua, tyLeRo: tyLeRo, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
      }
    }

    // ── 2. Chốt CHUYỂN NGƯỜI: một cửa sổ rõ lẻ loi KHÔNG đủ đổi người.
    //       Vấp stress 01/08 ca "cười chung": hai người cùng to 2 giây, vài
    //       cửa sổ trùng hợp âm tiết chênh đủ 6dB làm não nhảy cam sang
    //       người cười rồi nhảy về (12 lượt thay vì 10) — đúng kiểu "cắt
    //       máy móc" người ta chê AutoPod. Luật: muốn ĐỔI sang X tại w thì
    //       trong 0,5s kế tiếp X phải rõ DÀY (≥60% cửa sổ rõ-X) và người
    //       đang giữ hình gần như im (≤5 cửa sổ rõ). Vào lượt sạch thì cửa
    //       sổ đầu tiên đã đạt ngay nên RANH KHÔNG SUY SUYỂN (đo: vẫn 0ms).
    //       Cửa sổ mù giữ người đang nói (hysteresis) như cũ. ──
    var K_ONSET = 25 // 0,5 giây
    var NG_X = 15    // X phải rõ ≥15/25
    var NG_CUR = 5   // người đang giữ hình phải im: ≤5/25 cửa sổ rõ
    var ket = new Int16Array(soCua)
    var cur = -1
    for (var w2 = 0; w2 < soCua; w2++) {
      var ung = tho[w2]
      if (ung >= 0 && ung !== cur) {
        var cuoiSpan = Math.min(w2 + K_ONSET, soCua)
        var span = cuoiSpan - w2
        var demX = 0
        var demCur = 0
        for (var j = w2; j < cuoiSpan; j++) {
          if (tho[j] === ung) demX++
          else if (cur >= 0 && tho[j] === cur) demCur++
        }
        if (demX >= Math.ceil(NG_X * span / K_ONSET) && (cur < 0 || demCur <= NG_CUR)) {
          cur = ung
        }
      }
      ket[w2] = cur
    }
    // Đoạn dẫn đầu trước người rõ đầu tiên: lấy người đó.
    var dau = 0
    while (dau < soCua && ket[dau] === -1) dau++
    if (dau >= soCua) {
      return {
        trangThai: 'KHONG_PHAN_BIET',
        doan: [],
        thongKe: { soCua: soCua, tyLeRo: tyLeRo, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
      }
    }
    for (var w1 = 0; w1 < dau; w1++) ket[w1] = ket[dau]
    tho = ket

    // ── 3. Gom thành lượt, rồi nuốt lượt ngắn hơn LUOT giây vào lượt trước
    //       (lặp tới khi sạch — nuốt xong hai lượt cùng người phải gộp lại). ──
    var luot = []
    for (var w3 = 0; w3 < soCua; w3++) {
      if (luot.length && luot[luot.length - 1].nguoi === tho[w3]) {
        luot[luot.length - 1].den = w3 + 1
      } else {
        luot.push({ nguoi: tho[w3], tu: w3, den: w3 + 1 })
      }
    }
    var toiThieuCua = Math.round(LUOT / CUA_GIAY)
    var con = true
    while (con && luot.length > 1) {
      con = false
      for (var i = 0; i < luot.length; i++) {
        if (luot[i].den - luot[i].tu < toiThieuCua) {
          // Nuốt vào lượt TRƯỚC (đổi cam muộn tự nhiên hơn đổi sớm);
          // lượt đầu tiên thì nuốt vào lượt sau.
          if (i > 0) {
            luot[i - 1].den = luot[i].den
          } else {
            luot[1].tu = luot[0].tu
          }
          luot.splice(i === 0 ? 0 : i, 1)
          // Gộp hai lượt cùng người vừa bị dí sát nhau.
          for (var j = luot.length - 2; j >= 0; j--) {
            if (luot[j].nguoi === luot[j + 1].nguoi) {
              luot[j].den = luot[j + 1].den
              luot.splice(j + 1, 1)
            }
          }
          con = true
          break
        }
      }
    }

    // ── 4. Đổi cửa sổ → giây. Phủ kín [0, daiGiay]: ranh cuối ép về daiGiay. ──
    var doan = []
    for (var d = 0; d < luot.length; d++) {
      doan.push({
        tu: luot[d].tu * CUA_GIAY,
        den: d === luot.length - 1 ? daiGiay : luot[d].den * CUA_GIAY,
        nguoi: luot[d].nguoi,
      })
    }

    return {
      trangThai: 'OK',
      doan: doan,
      thongKe: { soCua: soCua, tyLeRo: tyLeRo, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
    }
  }

  /**
   * Phổ âm lượng một dãy cửa sổ dB: {p10, p50, p90}.
   * Dùng cho chốt an toàn "mic đều": p90−p10 < 6 dB và p50 > −50 dB nghĩa là
   * track kêu đều suốt cả tập — tiếng cam / nhạc nền, không phải mic riêng
   * một người (vấp thật 01/08: gán tiếng cam làm mic → cả tập thành 1 lượt).
   * Đặt ở đây (thuần) để bộ kiểm stress đo được cùng một công thức panel dùng.
   */
  function phoMic(db) {
    var m = Array.prototype.slice.call(db).sort(function (a, b) { return a - b })
    function p(q) { return m[Math.min(m.length - 1, Math.floor(m.length * q))] }
    return { p10: p(0.1), p50: p(0.5), p90: p(0.9) }
  }

  return {
    taiWav: taiWav, doDb: doDb, aiDangNoi: aiDangNoi, phoMic: phoMic,
    sanTuDo: sanTuDo, CUA_GIAY: CUA_GIAY,
  }
})()

/* Cho Node chạy bộ kiểm; trong panel thì AiONao là biến toàn cục. */
if (typeof module !== 'undefined' && module.exports) module.exports = AiONao
