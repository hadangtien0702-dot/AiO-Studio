/**
 * Host Bridge — ROUTER của AiO Auto Short Viral.
 * CEP nạp file này qua ScriptPath trong CSXS/manifest.xml. Hàm định nghĩa ở đây
 * (và trong file được #include) gọi được từ panel qua CSInterface.evalScript().
 *
 * ☠️ Premiere nạp file này ĐÚNG MỘT LẦN lúc extension khởi động. Cài bản mới
 * rồi reload panel = giao diện mới, host cũ, hàm mới báo "EvalScript error.".
 * Panel gọi napLaiHost() ($.evalFile file này) trước mỗi lệnh ghi và kiểm
 * sv_phienBan() — xem client/src/lib/cep.ts.
 * ☠️ KHÔNG bọc #include hay $.evalFile trong hàm: nội dung file chạy trong scope
 * của chỗ gọi, bọc trong hàm là mọi hàm biến mất cùng scope đó (Autocut 28/07).
 *
 * ping() và getHostInfo() là tên CHUNG của mọi panel AiO (engine ExtendScript
 * dùng chung, panel nào nạp sau thì đè) — thân hàm phải giữ Y HỆT các panel anh
 * em, đổi định dạng trả về ở đây là làm hỏng panel khác.
 */

#include "shortviral.jsx"

/** Ping thử — xác nhận cầu nối ExtendScript còn sống (engine không bị hộp thoại chặn). */
function ping() {
  return 'pong';
}

/** Thông tin host, trả chuỗi "appVersion|project". */
function getHostInfo() {
  var appVersion = 'unknown';
  var project = '(chua mo project)';
  try { appVersion = app.version; } catch (e) {}
  try {
    if (app.project && app.project.name) { project = app.project.name; }
  } catch (e) {}
  return appVersion + '|' + project;
}
