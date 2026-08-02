/**
 * Host Bridge — ROUTER cua AiO Auto Guiline Frame.
 * Duoc CEP nap qua ScriptPath trong manifest.xml.
 *
 * ☠️ KHONG boc #include hay $.evalFile trong ham — scope se nuot het
 * (bai hoc AiO Studio 28/07/2026, ghi trong skill adobe-cep-panel).
 * Panel se tu $.evalFile("host/guideframe.jsx") truoc moi lenh de
 * tranh benh "panel moi noi chuyen voi host cu".
 */

#include "guideframe.jsx"

/** Ping thu — xac nhan cau noi ExtendScript hoat dong. */
function ping() {
  return 'pong';
}

/** Thong tin host, tra ve chuoi "appVersion|project". */
function getHostInfo() {
  var appVersion = 'unknown';
  var project = '(chua mo project)';
  try { appVersion = app.version; } catch (e) {}
  try {
    if (app.project && app.project.name) { project = app.project.name; }
  } catch (e) {}
  return appVersion + '|' + project;
}
