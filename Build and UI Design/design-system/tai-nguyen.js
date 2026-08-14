/* =========================================================================
   AiO STUDIO — TÀI NGUYÊN: NGUỒN CHÂN LÝ DUY NHẤT
   =========================================================================

   ☠️ ĐỪNG SỬA BẢN COPY TRONG TỪNG PANEL. Sửa `design-system/tai-nguyen.js`
   rồi chạy:

       powershell -File "design-system\dong-bo-tai-nguyen.ps1"

   ─────────────────────────────────────────────────────────────────────────
   VÌ SAO CÓ FILE NÀY — anh Tiến chốt 2026-08-04
   ─────────────────────────────────────────────────────────────────────────
   Nguyên văn: *"tất cả các tool đang trong quá trình xây dựng em set cài đặt
   tài nguyên ở mức RAM - CPU và GPU em dùng toàn bộ ở mức tối thiểu là 50%
   và tối đa là 70% giúp anh cho toàn bộ tool chứ không riêng gì mỗi tool"*.
   Kèm theo: *"sau khi hoàn thiện thì mình sẽ tung ra một bản riêng cho user
   máy yếu sau"*.

   Đây là luật CHUNG cho cả 7 panel, không phải tuỳ chỉnh của từng panel.
   Cùng lý do với `tokens.css`: lời dặn nằm trong tài liệu thì mỗi panel lại
   chép tay một kiểu và lệch đi trong im lặng — nên nó phải nằm trong CƠ CHẾ.

   ─────────────────────────────────────────────────────────────────────────
   HIỂU "50% – 70%" LÀ GÌ
   ─────────────────────────────────────────────────────────────────────────
   Đây là DẢI HOẠT ĐỘNG, không phải hai con số rời:

     • TRẦN 70% — không bao giờ vượt. Premiere là phần mềm chính đang chạy
       cùng lúc; ăn hết máy là host giật, người dùng bỏ tool.
     • SÀN 50% — không được rụt rè hơn mức này. Máy 16 nhân mà chạy 2 luồng
       thì tool chậm vô lý, người dùng cũng bỏ tool.

   Mọi con số tính theo TỈ LỆ của máy đang chạy, KHÔNG hằng số cứng — máy
   khách yếu hơn máy anh Tiến (Ryzen 9 5950X · 32 luồng · 64 GB · RTX 4060 Ti)
   thì tự co lại theo.

   ─────────────────────────────────────────────────────────────────────────
   ☠️ CPU: NGÂN SÁCH LÀ CỦA CẢ PANEL, KHÔNG PHẢI CỦA TỪNG TIẾN TRÌNH
   ─────────────────────────────────────────────────────────────────────────
   Đây là chỗ dễ sai nhất. Đặt `-threads 22` cho FFmpeg rồi chạy 4 tiến trình
   song song là ăn 88 luồng trên máy 32 luồng — vượt trần gấp 4 mà nhìn code
   thì thấy "đã giới hạn rồi".

       ĐÚNG:  soTienTrinh × luongMoiTienTrinh ≤ tranLuong()

   Dùng `chiaLuong(soTienTrinh)` để chia ngân sách, đừng tự nhân tay.

   ─────────────────────────────────────────────────────────────────────────
   HAI CHẾ ĐỘ — sàn 50% KHÔNG áp cho việc chạy nền
   ─────────────────────────────────────────────────────────────────────────
   Đo 04/08 thấy hai kiểu việc khác hẳn nhau, và luật phải khác nhau:

   • VIỆC NGƯỜI DÙNG ĐANG ĐỢI (bấm nút rồi nhìn thanh tiến độ: cắt podcast,
     chép lời, dò khoảng lặng). Đây là lúc áp đủ dải **50–70%**, ưu tiên
     NORMAL. Người dùng đang chờ mà tool rón rén là tool tồi.

   • VIỆC CHẠY NỀN (tự sinh thumbnail / sóng âm / proxy khi người dùng đang
     dựng phim). Chỉ áp **TRẦN 70%**, KHÔNG áp sàn — và phải hạ ưu tiên
     xuống IDLE bằng `haUuTien(pid)`. Ở đây Premiere mới là việc chính;
     ép đủ 50% là tự tay làm giật máy người ta.

   Asset Manager / Power Bins đã đi đúng hướng này sẵn (turbo vs nền).
   ========================================================================= */

;(function (goc) {
  'use strict'

  var SAN = 0.50 // không rụt rè hơn mức này
  var TRAN = 0.70 // không bao giờ vượt

  /**
   * Nạp module Node. Trong panel CEP phải đi qua `window.cep_node.require` —
   * `require` trần không tồn tại ở renderer, đó là bẫy đã trả giá nhiều lần.
   */
  function napNode(ten) {
    try {
      if (typeof window !== 'undefined' && window.cep_node && window.cep_node.require) {
        return window.cep_node.require(ten)
      }
    } catch (e) {}
    try {
      if (typeof require === 'function') return require(ten)
    } catch (e2) {}
    return null
  }

  /** Số luồng logic của máy. Trả 4 nếu không đọc được (đoán an toàn). */
  function tongLuong() {
    var os = napNode('os')
    try {
      if (os && os.cpus && os.cpus().length) return os.cpus().length
    } catch (e) {}
    try {
      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency
      }
    } catch (e2) {}
    return 4
  }

  /** Tổng RAM (byte). Trả 8 GB nếu không đọc được. */
  function tongRam() {
    var os = napNode('os')
    try {
      if (os && os.totalmem) return os.totalmem()
    } catch (e) {}
    return 8 * 1024 * 1024 * 1024
  }

  /**
   * Hạ ưu tiên một tiến trình con xuống IDLE (19) — để Premiere luôn được
   * phục vụ trước. Đây là cái PHANH thật sự: `-threads` chỉ giới hạn số
   * luồng, còn cái quyết định người dùng có thấy giật hay không là ưu tiên.
   *
   * ☠️ CHỈ dùng cho việc chạy NỀN (người dùng không ngồi đợi). Việc người
   * dùng vừa bấm và đang nhìn thanh tiến độ thì để NORMAL, hạ xuống IDLE là
   * tự làm chậm mình trong khi máy vẫn còn chỗ trống.
   */
  function haUuTien(pid) {
    var os = napNode('os')
    try {
      if (os && os.setPriority && pid) { os.setPriority(pid, 19); return true }
    } catch (e) {}
    return false
  }

  /** Trần luồng CPU cho CẢ panel (70%). Luôn ≥ 1. */
  function tranLuong() {
    return Math.max(1, Math.floor(tongLuong() * TRAN))
  }

  /** Sàn luồng CPU (50%) — đừng chạy chậm hơn mức này khi máy đang rảnh. */
  function sanLuong() {
    return Math.max(1, Math.floor(tongLuong() * SAN))
  }

  /**
   * Chia ngân sách luồng cho N tiến trình chạy SONG SONG.
   * Trả { soTienTrinh, luongMoi } — nhân hai số này lại luôn ≤ tranLuong().
   *
   * Ví dụ máy 32 luồng (trần 22):
   *   chiaLuong(1) → { soTienTrinh: 1, luongMoi: 22 }
   *   chiaLuong(4) → { soTienTrinh: 4, luongMoi: 5  }  (4×5 = 20 ≤ 22)
   *   chiaLuong(30) → { soTienTrinh: 22, luongMoi: 1 } (cắt bớt tiến trình)
   */
  function chiaLuong(soTienTrinh) {
    var tran = tranLuong()
    var n = Math.max(1, Math.min(soTienTrinh | 0 || 1, tran))
    return { soTienTrinh: n, luongMoi: Math.max(1, Math.floor(tran / n)) }
  }

  /**
   * Số việc nặng chạy song song (hàng đợi thumbnail, sóng âm, proxy…).
   * Giữ trong dải [sàn/2, trần/2]: mỗi việc thường tự nuốt ~2 luồng.
   */
  function soViecSongSong() {
    var tran = tranLuong()
    return Math.max(1, Math.floor(tran / 2))
  }

  /** Trần RAM cho cả panel (byte, 70%). */
  function tranRam() {
    return Math.floor(tongRam() * TRAN)
  }

  /**
   * maxBuffer cho child_process — KHÔNG lấy theo % RAM tổng (một tiến trình
   * FFmpeg log ra vài trăm KB là cùng; cấp 44 GB chỉ tổ che mất lỗi tràn).
   * Lấy trần mềm 64 MB, hạ xuống nếu máy ít RAM.
   */
  function tranDemLog() {
    var theoMay = Math.floor(tongRam() * 0.001) // 0,1% RAM
    return Math.max(8 * 1024 * 1024, Math.min(64 * 1024 * 1024, theoMay))
  }

  /**
   * GPU — whisper.cpp không có tham số "dùng N% GPU". Điều khiển gián tiếp:
   *  • chọn model turbo (đo 28/07: GPU đỉnh 67%, dưới trần 70%;
   *    large-v3 đỉnh 88% — VƯỢT TRẦN, không dùng làm mặc định)
   *  • KHÔNG chạy hai tiến trình whisper song song
   *  • số luồng CPU phụ trợ vẫn theo tranLuong()
   */
  var GPU = {
    modelMacDinh: 'turbo',
    modelVuotTran: ['large-v3', 'large-v2', 'large'],
    soTienTrinhToiDa: 1,
  }

  /** Một dòng mô tả để in ra log/panel — đo được thì phải nói ra được. */
  function moTa() {
    var t = tongLuong()
    return 'CPU ' + tranLuong() + '/' + t + ' luong (tran ' + Math.round(TRAN * 100) + '%)' +
      ' · RAM tran ' + Math.round(tranRam() / 1073741824) + ' GB' +
      ' · GPU model ' + GPU.modelMacDinh
  }

  var API = {
    SAN: SAN, TRAN: TRAN,
    tongLuong: tongLuong, tongRam: tongRam,
    tranLuong: tranLuong, sanLuong: sanLuong, chiaLuong: chiaLuong,
    soViecSongSong: soViecSongSong,
    tranRam: tranRam, tranDemLog: tranDemLog,
    haUuTien: haUuTien, napNode: napNode,
    GPU: GPU, moTa: moTa,
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = API
  goc.AiOTaiNguyen = API
})(typeof globalThis !== 'undefined' ? globalThis : this)
