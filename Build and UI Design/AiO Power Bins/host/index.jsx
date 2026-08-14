/**
 * Host Bridge — ROUTER
 * Được nạp bởi CEP (ScriptPath trong manifest.xml).
 * Các hàm định nghĩa ở đây gọi được từ panel qua CSInterface.evalScript().
 *
 * Host ưu tiên: Premiere Pro (ppro.jsx). After Effects (ae.jsx) làm sau.
 */

// Nạp logic riêng của từng host. #include theo đường dẫn tương đối file này.
#include "ppro.jsx"
// #include "ae.jsx"   // mở khi làm phần After Effects

/**
 * Ping thử — panel gọi để xác nhận cầu nối ExtendScript hoạt động.
 * @returns {string}
 */
function ping() {
  return 'pong';
}

/**
 * Thông tin host, trả về chuỗi "appName|appVersion|project".
 * Dùng dấu | thay JSON để không phụ thuộc JSON polyfill của ExtendScript.
 * @returns {string}
 */
function getHostInfo() {
  var appName = 'unknown';
  var appVersion = 'unknown';
  var project = '(no project)';

  try { appName = app.name; } catch (e) {}
  try { appVersion = app.version; } catch (e) {}

  // Tên project (Premiere). Bọc try/catch phòng khi chưa mở project.
  try {
    if (typeof app.project !== 'undefined' && app.project && app.project.name) {
      project = app.project.name;
    }
  } catch (e) {}

  return appName + '|' + appVersion + '|' + project;
}
