/**
 * cau-noi.js — lop noi giua panel va Premiere (ExtendScript) + Node.
 *
 * ☠️ BA CAI BAY DA TRA GIA (ghi trong CLAUDE.md, dung vap lai):
 *  1. Premiere nap host/*.jsx DUNG MOT LAN luc khoi dong. Cai ban moi roi
 *     reload panel = giao dien moi + host CU -> moi ham moi bao
 *     "EvalScript error." Chua bang cach $.evalFile lai host truoc moi lenh.
 *  2. KHONG boc $.evalFile trong ham — ham nap vao scope do roi bien mat.
 *  3. Panel nap qua file:// nen Chromium CHAN doc file khac tren dia.
 *     Muon phat nhac phai qua may chu HTTP noi bo (xem nen.js).
 */

/* ══ CEP ══ */
var csi = null;
function getCSI() {
  if (!csi && typeof CSInterface !== 'undefined') csi = new CSInterface();
  return csi;
}

/** Panel co dang chay trong Premiere khong (hay dang mo bang trinh duyet). */
function trongPremiere() {
  return typeof CSInterface !== 'undefined' && typeof window.__adobe_cep__ !== 'undefined';
}

/** Duong dan thu muc extension. */
function duongDanExt() {
  var c = getCSI();
  if (!c) return '';
  try { return c.getSystemPath(SystemPath.EXTENSION); } catch (e) { return ''; }
}

/** Thu muc luu du lieu rieng cua panel. */
function duongDanKho() {
  var c = getCSI();
  if (!c) return '';
  try {
    var base = c.getSystemPath(SystemPath.USER_DATA);
    return base + '/AiOMusic';
  } catch (e) { return ''; }
}

/**
 * Goi mot ham trong host. Tu nap lai host truoc khi goi (bay so 1).
 * Tra ve Promise<string> — chuoi 'OK:...' hoac 'ERR:...'.
 */
var daNapHost = false;
function goiHost(bieuThuc) {
  return new Promise(function (resolve) {
    var c = getCSI();
    if (!c) { resolve('ERR:Khong chay trong Premiere'); return; }

    function chay() {
      c.evalScript(bieuThuc, function (kq) {
        if (kq === 'EvalScript error.') {
          resolve('ERR:Host chua nap duoc ham nay. Thu dong/mo lai panel.');
        } else {
          resolve(kq);
        }
      });
    }

    if (daNapHost) { chay(); return; }
    // ☠️ Nap thang o scope goc, KHONG boc trong ham (bay so 2)
    var ext = duongDanExt().replace(/\\/g, '/');
    c.evalScript('$.evalFile("' + ext + '/host/index.jsx")', function () {
      daNapHost = true;
      chay();
    });
  });
}

/** Tach chuoi 'OK:...'/'ERR:...' thanh {ok, dulieu} */
function tach(kq) {
  kq = String(kq || '');
  if (kq.indexOf('OK:') === 0)  return { ok: true,  dulieu: kq.slice(3) };
  if (kq.indexOf('ERR:') === 0) return { ok: false, dulieu: kq.slice(4) };
  return { ok: false, dulieu: kq || 'Khong co phan hoi tu host' };
}

/* ══ NODE ══ */
/** require cua Node trong CEP (chi co khi bat --enable-nodejs). */
function nodeRequire(ten) {
  try {
    if (typeof window.cep_node !== 'undefined' && window.cep_node.require) {
      return window.cep_node.require(ten);
    }
    if (typeof require !== 'undefined') return require(ten);
  } catch (e) {}
  return null;
}

function getFs()   { return nodeRequire('fs'); }
function getPath() { return nodeRequire('path'); }
function getCP()   { return nodeRequire('child_process'); }

/** Node co dung duoc khong — thieu la moi thu doc dia deu chet. */
function coNode() {
  return !!getFs();
}
