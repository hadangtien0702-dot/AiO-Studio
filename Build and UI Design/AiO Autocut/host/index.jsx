/**
 * Host Bridge — ROUTER cua AiO Autocut.
 * Duoc CEP nap qua ScriptPath trong manifest.xml.
 * Ham dinh nghia o day goi duoc tu panel qua CSInterface.evalScript().
 */

#include "autocut.jsx"

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
