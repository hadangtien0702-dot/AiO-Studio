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
   * ═══════════════════════════════════════════════════════════════════════
   * NGHE TRỌN TỪNG KÊNH TRƯỚC — cách anh Tiến chỉ 05/08/2026
   * ═══════════════════════════════════════════════════════════════════════
   * Nguyên văn: *"anh muốn em trước tiên nghe toàn bộ A1, sau đó mute toàn bộ
   * nghe toàn bộ A2, sau đó mới đưa ra các nhát cắt phù hợp"*.
   *
   * VÌ SAO ĐÚNG, VÀ VÌ SAO CÁCH CŨ KHÔNG BAO GIỜ CHỮA ĐƯỢC BẰNG VÁ:
   * Cách cũ so TỪNG CỬA SỔ 20ms giữa hai mic ("mic nào to hơn ≥6 dB"). Ba hệ quả
   * chết người, đo được cả ba trên liệu thật của anh (2 mic, 58 phút):
   *   1. Phụ thuộc GAIN TƯƠNG ĐỐI. Hai recorder lệch 8 dB — chuyện thường —
   *      là mù hẳn một người: Will thắng 0,2% thời lượng, bản dựng ra ĐÚNG
   *      1 nhát cắt, 100% cam Trọng.
   *   2. KHÔNG CÓ CHỖ ĐỂ VỨT TẠP ÂM. Anh Tiến: *"khi quay thực tế thì chắc
   *      chắn có tạp âm, những câu nói vô nghĩa, những nụ cười... rất nhiều
   *      âm thanh lọt vào"*. So theo cửa sổ thì tiếng cười 0,3s cũng là một
   *      "lượt nói" ngang với câu 10 giây.
   *   3. Mọi bản vá lên trên đều lệch thêm (đã thử bù gain theo p90 → phá ca
   *      độc thoại; theo nền phòng → 70/30). Anh: *"em càng sửa thì lại càng
   *      bị sai"*. Đúng — vì nền sai chứ không phải tham số sai.
   *
   * CÁCH MỚI — ba bước tách bạch:
   *   B1. Nghe TRỌN kênh A1: ngưỡng riêng (Otsu trên chính nó) + hysteresis
   *       vào/ra + NỐI khe lấy hơi + VỨT khoảng vụn → danh sách khoảng nói.
   *   B2. Y hệt cho A2 (và A3, A4… nếu nhiều người).
   *   B3. Hợp nhất các danh sách → nhát cắt.
   * Gain lệch bao nhiêu không còn ảnh hưởng: mỗi kênh so với nền của chính nó.
   * Không tăng âm, không bù, không thêm ô cấu hình nào cho người dùng.
   *
   * ĐO TRÊN 2 MIC THẬT CỦA ANH TIẾN (58 phút):
   *   ngưỡng tự đo   Will −53,0 dB · Trọng −45,0 dB (tự chênh đúng phần gain)
   *   B1 lọc ra      941 khoảng nói, VỨT 568 khoảng vụn
   *   B2 lọc ra      839 khoảng nói, VỨT 921 khoảng vụn
   *   B3 hợp nhất    271 nhát cắt · Will 54,6% / Trọng 45,4% · ngắn nhất 1,04s
   *
   *   Cách                              nhát cắt   Will / Trọng
   *   so cửa sổ, chênh 6 dB (cũ)        1          0% / 100%
   *   + bù gain theo p90                —          12,5% / 16,4%  (phá độc thoại)
   *   + bù gain theo nền phòng          149        70,3% / 29,7%
   *   NGHE TRỌN TỪNG KÊNH               271        54,6% / 45,4%  ← cân nhất
   *
   * ⚠️ Giới hạn phải nói ra: các số trên chứng minh "hết mù một người" và
   * "có chỗ vứt tạp âm", KHÔNG chứng minh "cắt đúng chỗ" — thước vẫn làm bằng
   * dB, cùng vật liệu với cái nó đo (bài học 5d). Chỉ tai anh Tiến chấm được.
   *
   * @param db  envelope dB của MỘT kênh
   * @return { nguong, kh: [[tu,den]…], boVun }
   */
  function ngheMotKenh(db, opts) {
    opts = opts || {}
    var BIEN_VAO = opts.bienVao !== undefined ? opts.bienVao : 3    // vượt hẳn mới là bắt đầu nói
    var BIEN_RA = opts.bienRa !== undefined ? opts.bienRa : 0       // tụt hẳn mới là thôi nói
    var TOI_THIEU = opts.khoangToiThieu !== undefined ? opts.khoangToiThieu : 0.35
    var NOI_KHE = opts.noiKhe !== undefined ? opts.noiKhe : 0.30    // khe lấy hơi giữa hai câu

    var nguong = sanTuDo([{ db: db }])
    var vao = nguong + BIEN_VAO
    var ra = nguong + BIEN_RA

    var tho = []
    var dang = false, tu = 0, i
    for (i = 0; i < db.length; i++) {
      if (!dang && db[i] >= vao) { dang = true; tu = i }
      else if (dang && db[i] < ra) { dang = false; tho.push([tu * CUA_GIAY, i * CUA_GIAY]) }
    }
    if (dang) tho.push([tu * CUA_GIAY, db.length * CUA_GIAY])

    // Nối hai khoảng cách nhau quá gần — một câu bị ngắt bởi nhịp lấy hơi.
    var noi = []
    for (i = 0; i < tho.length; i++) {
      if (noi.length && tho[i][0] - noi[noi.length - 1][1] <= NOI_KHE) noi[noi.length - 1][1] = tho[i][1]
      else noi.push([tho[i][0], tho[i][1]])
    }
    // VỨT khoảng vụn — tiếng cười, ho, ghế kêu, "ừm". Đây là bước cách cũ
    // KHÔNG CÓ, và là lý do tạp âm trước giờ đi thẳng vào phép so.
    var sach = []
    for (i = 0; i < noi.length; i++) {
      if (noi[i][1] - noi[i][0] >= TOI_THIEU) sach.push(noi[i])
    }
    return { nguong: nguong, kh: sach, boVun: noi.length - sach.length }
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
    /**
     * CAM CHUNG (wide) — anh Tiến 04/08: quay thật có "1 cam chung giữa 2
     * người nhưng khi anh chọn thì lại không sử dụng được".
     *
     * Bật `coWide: true` thì đoạn nào KHÔNG AI NÓI RÕ kéo dài quá WIDE_GIAY
     * sẽ trả `nguoi = -1` (về cam chung) thay vì đoán giữ người trước. Số đo
     * ủng hộ: 4/6 khoảng hai thuật toán cãi nhau trên liệu thật rơi đúng lúc
     * KHÔNG AI NÓI — đó là chỗ nên về wide thay vì đoán bừa.
     *
     * 2 giây đầu của khoảng im vẫn GIỮ người vừa nói (nhịp editor: máy nán
     * lại một chút rồi mới về toàn cảnh). TẮT mặc định — không đổi hành vi
     * 28 phép kiểm cũ.
     */
    var WIDE = opts.coWide === true
    var WIDE_GIAY = opts.wideSauGiay !== undefined ? opts.wideSauGiay : 2.0

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
    // Chỉ số gãy an toàn của đường nghe-từng-kênh — xem khối chú thích ở chốt.
    var coNoi = 0, cuaChong = 0, chongLan = 0, bienNhatNhi = 0, dsBien = []
    var cuaMoiNguoi = []
    var m0
    for (m0 = 0; m0 < mics.length; m0++) cuaMoiNguoi.push(0)

    /**
     * ĐƯỜNG MỚI (mặc định) — nghe TRỌN từng kênh trước rồi mới hợp nhất.
     * Xem khối ghi chú của ngheMotKenh: đây là cách anh Tiến chỉ 05/08, và là
     * đường duy nhất có CHỖ ĐỂ VỨT tiếng cười / tạp âm trước khi so.
     * Đặt opts.theoCuaSo = true để chạy lại đường cũ (so từng cửa sổ).
     */
    var THEO_KENH = opts.theoCuaSo !== true && opts.nguongSan === undefined
    var kenhDs = null
    if (THEO_KENH) {
      kenhDs = []
      for (m0 = 0; m0 < mics.length; m0++) kenhDs.push(ngheMotKenh(mics[m0].db, opts))
      // Trải khoảng nói của từng người lên trục SEQUENCE (trừ offset của mic).
      var ai = new Int16Array(soCua)
      var vuot = new Float32Array(soCua)
      var vuotNhi = new Float32Array(soCua)
      var demKenh = new Int16Array(soCua)
      for (var w2 = 0; w2 < soCua; w2++) { ai[w2] = -1; vuot[w2] = 0; vuotNhi[w2] = -1e9; demKenh[w2] = 0 }
      for (m0 = 0; m0 < mics.length; m0++) {
        var kh = kenhDs[m0].kh
        var ng = kenhDs[m0].nguong
        for (var q = 0; q < kh.length; q++) {
          var a1 = Math.floor((kh[q][0] - mics[m0].offset) / CUA_GIAY)
          var b1 = Math.ceil((kh[q][1] - mics[m0].offset) / CUA_GIAY)
          if (a1 < 0) a1 = 0
          if (b1 > soCua) b1 = soCua
          for (var i1 = a1; i1 < b1; i1++) {
            // Chồng lấn: ai vượt ngưỡng CỦA CHÍNH MÌNH nhiều hơn thì lên hình.
            var vv = db(m0, i1) - ng
            demKenh[i1]++
            if (vv > vuot[i1] || ai[i1] === -1) { vuotNhi[i1] = vuot[i1] }
            else if (vv > vuotNhi[i1]) { vuotNhi[i1] = vv }
            if (ai[i1] === -1 || vv > vuot[i1]) { ai[i1] = m0; vuot[i1] = vv }
          }
        }
      }
      for (var w3 = 0; w3 < soCua; w3++) {
        tho[w3] = ai[w3]
        if (ai[w3] >= 0) { soRo++; cuaMoiNguoi[ai[w3]]++ }
        if (demKenh[w3] >= 1) coNoi++
        if (demKenh[w3] >= 2) { cuaChong++; dsBien.push(vuot[w3] - vuotNhi[w3]) }
      }
      chongLan = coNoi ? cuaChong / coNoi : 0
      if (dsBien.length) {
        dsBien.sort(function (x, y) { return x - y })
        bienNhatNhi = dsBien[Math.floor(dsBien.length / 2)]
      }
    } else
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
    // ══ GÃY AN TOÀN CỦA ĐƯỜNG NGHE-TỪNG-KÊNH ═══════════════════════════════
    // ☠️ Chốt cũ (`tyLeRo < RO`) chỉ đúng cho đường so-từng-cửa-sổ. Đường mới
    // nghe mỗi kênh so nền CỦA CHÍNH NÓ nên hai mic giống hệt nhau vẫn cho
    // tyLeRo 0,955 → tool đoán bừa mà không ai biết.
    //
    // ☠️ SUÝT XÂY CHỐT LÊN MỘT CHỈ SỐ VÔ DỤNG: ý đầu tiên là "chồng lấn cao =
    // không phân biệt được" — nghe rất hợp lý. Đo mới thấy chồng lấn đã 0,999
    // ngay từ bleed −16 dB, nơi thuật toán vẫn cắt ĐÚNG 10/10 lượt. Nó không
    // tách được ca tốt khỏi ca xấu (bài học 5s).
    //
    // Chỉ số ĐÚNG: BIÊN ĐỘ NHẤT–NHÌ — chênh "mức vượt ngưỡng riêng" giữa kênh
    // to nhất và kênh nhì, lấy trung vị trên các cửa sổ CÓ TRANH CHẤP. Nó bám
    // sát mức bleed gần như tuyệt đối (−16→15,99 · −8→8,00 · −5→5,00).
    //
    // Số đo chọn ngưỡng:
    //   liệu THẬT 2 mic 58 phút của anh Tiến : chồng lấn 0,428 · biên 4,61 dB
    //   gán NHẦM 2 người vào cùng 1 file mic : chồng lấn 1,000 · biên 0,00 dB
    //   mic sạch (bleed −24 dB)              : chồng lấn 0,000 · biên 0,00 dB
    // → phải chặn bằng CẢ HAI điều kiện: mic sạch cũng có biên 0 (không cửa sổ
    //   nào tranh chấp), chặn theo mình biên là chặn oan ngay.
    var CHONG_CAO = 0.5
    var BIEN_TOI_THIEU = 1.0 // dB
    if (THEO_KENH && chongLan >= CHONG_CAO && bienNhatNhi < BIEN_TOI_THIEU) {
      return {
        trangThai: 'KHONG_PHAN_BIET',
        doan: [],
        thongKe: { soCua: soCua, tyLeRo: tyLeRo, chongLan: chongLan, bienNhatNhi: bienNhatNhi, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
      }
    }
    // ── Gãy an toàn (đường CŨ): gần như không cửa sổ nào phân biệt được → mic
    //    giống nhau quá (bleed nặng) hoặc cả file im — KHÔNG đoán bậy. ──
    if (!THEO_KENH && tyLeRo < RO) {
      return {
        trangThai: 'KHONG_PHAN_BIET',
        doan: [],
        thongKe: { soCua: soCua, tyLeRo: tyLeRo, chongLan: chongLan, bienNhatNhi: bienNhatNhi, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
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
    var NG_WIDE = Math.max(1, Math.round(WIDE_GIAY / CUA_GIAY))
    var ket = new Int16Array(soCua)
    var cur = -1
    var muLienTiep = 0 // số cửa sổ mù liên tục — quá NG_WIDE thì về cam chung
    for (var w2 = 0; w2 < soCua; w2++) {
      var ung = tho[w2]
      if (ung >= 0) muLienTiep = 0
      else muLienTiep++
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
      // Im quá WIDE_GIAY → về cam chung (-1). Chỉ khi coWide; hysteresis
      // giữ-người-trước vẫn nguyên cho 2 giây đầu của khoảng im.
      if (WIDE && muLienTiep > NG_WIDE) cur = -1
      ket[w2] = cur
    }
    // Đoạn dẫn đầu trước người rõ đầu tiên: có wide thì về CAM CHUNG
    // (chưa ai nói mà cắt cận một người là đoán bừa); không wide thì giữ
    // hành vi cũ — lấy người rõ đầu tiên.
    var dau = 0
    while (dau < soCua && ket[dau] === -1) dau++
    if (dau >= soCua) {
      return {
        trangThai: 'KHONG_PHAN_BIET',
        doan: [],
        thongKe: { soCua: soCua, tyLeRo: tyLeRo, chongLan: chongLan, bienNhatNhi: bienNhatNhi, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
      }
    }
    if (!WIDE) {
      for (var w1 = 0; w1 < dau; w1++) ket[w1] = ket[dau]
    }
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
      thongKe: { soCua: soCua, tyLeRo: tyLeRo, chongLan: chongLan, bienNhatNhi: bienNhatNhi, cuaMoiNguoi: cuaMoiNguoi, san: SAN },
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
