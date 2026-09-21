/*
 * CSInterface — cầu nối giữa panel (WebView) và Adobe host qua bridge
 * native `window.__adobe_cep__` mà CEP runtime tiêm vào.
 *
 * Đây là bản gọn (lean) của AiO Studio, cài đặt đúng chữ ký API công khai của
 * Adobe CEP, đủ cho các Phase hiện tại (evalScript, system path, events).
 * Có thể thay bằng CSInterface.js chính thức của Adobe bất cứ lúc nào.
 */

/** Các loại đường dẫn hệ thống dùng với getSystemPath(). */
var SystemPath = {
  USER_DATA: 'userData',
  COMMON_FILES: 'commonFiles',
  MY_DOCUMENTS: 'myDocuments',
  APPLICATION: 'application',
  EXTENSION: 'extension',
  HOST_APPLICATION: 'hostApplication'
};

/** Loại màu (dùng khi đọc theme của host). */
var ColorType = { RGB: 'rgb', GRADIENT: 'gradient', NONE: 'none' };

function RGBColor(red, green, blue) {
  this.red = red;
  this.green = green;
  this.blue = blue;
}

function UIColor(type, antialiasLevel, color) {
  this.type = type;
  this.antialiasLevel = antialiasLevel;
  this.color = color;
}

function AppSkinInfo(baseFontFamily, baseFontSize, appBarBackgroundColor,
                     panelBackgroundColor, appBarBackgroundColorSRGB,
                     panelBackgroundColorSRGB, systemHighlightColor) {
  this.baseFontFamily = baseFontFamily;
  this.baseFontSize = baseFontSize;
  this.appBarBackgroundColor = appBarBackgroundColor;
  this.panelBackgroundColor = panelBackgroundColor;
  this.appBarBackgroundColorSRGB = appBarBackgroundColorSRGB;
  this.panelBackgroundColorSRGB = panelBackgroundColorSRGB;
  this.systemHighlightColor = systemHighlightColor;
}

function HostEnvironment(appName, appVersion, appLocale, appUILocale, appId,
                         isAppOnline, appSkinInfo) {
  this.appName = appName;
  this.appVersion = appVersion;
  this.appLocale = appLocale;
  this.appUILocale = appUILocale;
  this.appId = appId;
  this.isAppOnline = isAppOnline;
  this.appSkinInfo = appSkinInfo;
}

/** Sự kiện CEP để dispatch giữa host và panel. */
function CSEvent(type, scope, appId, extensionId) {
  this.type = type;
  this.scope = scope;
  this.appId = appId;
  this.extensionId = extensionId;
  this.data = '';
}

var EvalScript_ErrMessage = 'EvalScript error.';

function CSInterface() {
  this.hostEnvironment = this.getHostEnvironment();
}

/** Có đang chạy bên trong host Adobe (có bridge native) không. */
CSInterface.prototype.isInHost = function () {
  return typeof window !== 'undefined' && !!window.__adobe_cep__;
};

/** Chạy một đoạn ExtendScript trong host; kết quả trả về qua callback (string). */
CSInterface.prototype.evalScript = function (script, callback) {
  if (callback === null || callback === undefined) {
    callback = function () {};
  }
  if (!this.isInHost()) {
    callback(EvalScript_ErrMessage);
    return;
  }
  window.__adobe_cep__.evalScript(script, callback);
};

/** Lấy thông tin host hiện tại (tên app, version, locale, id...). */
CSInterface.prototype.getHostEnvironment = function () {
  if (!this.isInHost()) return null;
  try {
    return JSON.parse(window.__adobe_cep__.getHostEnvironment());
  } catch (e) {
    return null;
  }
};

/** appId của host đang chạy (vd: "PPRO", "AEFT"). */
CSInterface.prototype.getApplicationID = function () {
  var env = this.hostEnvironment || this.getHostEnvironment();
  return env ? env.appId : null;
};

/** Lấy đường dẫn hệ thống theo SystemPath. */
CSInterface.prototype.getSystemPath = function (pathType) {
  if (!this.isInHost()) return '';
  var path = window.__adobe_cep__.getSystemPath(pathType);
  try { path = decodeURI(path); } catch (e) {}
  // Chuẩn hoá "file:///C:/..." -> "C:/..." trên Windows
  if (path.indexOf('file:///') === 0) {
    path = path.replace('file:///', '');
  } else if (path.indexOf('file://') === 0) {
    path = path.replace('file://', '');
  }
  return path;
};

/** Thông tin hệ điều hành (chuỗi). */
CSInterface.prototype.getOSInformation = function () {
  if (typeof window !== 'undefined' && window.navigator) {
    return window.navigator.platform + ' | ' + window.navigator.userAgent;
  }
  return 'unknown';
};

/** ID của chính extension này. */
CSInterface.prototype.getExtensionID = function () {
  if (!this.isInHost()) return null;
  return window.__adobe_cep__.getExtensionId();
};

/** Đăng ký lắng nghe sự kiện CEP. */
CSInterface.prototype.addEventListener = function (type, listener, obj) {
  if (this.isInHost()) {
    window.__adobe_cep__.addEventListener(type, listener, obj);
  }
};

/** Huỷ lắng nghe sự kiện CEP. */
CSInterface.prototype.removeEventListener = function (type, listener, obj) {
  if (this.isInHost()) {
    window.__adobe_cep__.removeEventListener(type, listener, obj);
  }
};

/** Phát một sự kiện CEP. */
CSInterface.prototype.dispatchEvent = function (event) {
  if (typeof event.data === 'object') {
    event.data = JSON.stringify(event.data);
  }
  if (this.isInHost()) {
    window.__adobe_cep__.dispatchEvent(event);
  }
};

/** Đóng chính extension này. */
CSInterface.prototype.closeExtension = function () {
  if (this.isInHost()) {
    window.__adobe_cep__.closeExtension();
  }
};

/** Mở URL bằng trình duyệt mặc định của hệ thống. */
CSInterface.prototype.openURLInDefaultBrowser = function (url) {
  if (typeof cep !== 'undefined' && cep.util) {
    return cep.util.openURLInDefaultBrowser(url);
  }
};

/** Thông tin skin (màu nền, font) của host để panel tự đổi theme. */
CSInterface.prototype.getHostEnvironmentSkinInfo = function () {
  var env = this.hostEnvironment || this.getHostEnvironment();
  return env ? env.appSkinInfo : null;
};

// Xuất ra global cho <script src> cổ điển của CEP.
if (typeof window !== 'undefined') {
  window.CSInterface = CSInterface;
  window.SystemPath = SystemPath;
  window.CSEvent = CSEvent;
  window.ColorType = ColorType;
  window.RGBColor = RGBColor;
  window.UIColor = UIColor;
}
