/**
 * Host Bridge — ROUTER cua AiO Video Download.
 * Duoc CEP nap qua ScriptPath trong manifest.xml.
 * Ham dinh nghia o day goi duoc tu panel qua CSInterface.evalScript().
 *
 * ☠️ Premiere nap file nay DUNG MOT LAN luc khoi dong. Panel goi
 * `napLaiHost()` ($.evalFile) truoc moi lenh de luon lay ban moi tren dia —
 * xem client/src/lib/cep.ts.
 */

#include "videodownload.jsx"

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
