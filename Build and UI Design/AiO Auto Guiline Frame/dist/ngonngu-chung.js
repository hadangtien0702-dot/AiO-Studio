/* =============================================================================
 * ngonngu-chung.js — NGÔN NGỮ DÙNG CHUNG cả bộ AiO, cho panel KHÔNG build
 * (nạp bằng <script src="./ngonngu-chung.js">). NGUỒN CHÂN LÝ nằm ở
 * design-system/, chép sang panel bằng dong-bo-tai-nguyen.ps1 — sửa ở đây,
 * KHÔNG sửa bản chép trong dist/.
 *
 * Cùng logic với design-system/ngonngu.tsx (panel có build) và panel tổng:
 *   - File chung %APPDATA%\AiOStudio\ngonngu.json  {"lang":"vi"|"en"}
 *   - Chưa có file → localStorage 'aio-lang' → MẶC ĐỊNH 'en'
 *     (anh Tiến chốt bán ra nước ngoài; người Việt thấy tiếng Anh tự đổi được).
 *   - theoDoi(cb): hỏi mốc giờ sửa file mỗi 2 s, panel khác đổi thì gọi cb(lang).
 *
 * Lập 27/09/2026: Podcast, Re-Frames, Guide Frame từng chỉ lưu localStorage
 * riêng (grep 'ngonngu' = 0) → đổi ngôn ngữ ở panel tổng thì 3 panel này đứng yên.
 * ============================================================================= */
(function () {
  var MAC_DINH = 'en';
  var moc = 0;

  function napNode(ten) {
    try { if (window.cep_node && window.cep_node.require) return window.cep_node.require(ten); } catch (e) { /* bỏ qua */ }
    try { if (typeof require === 'function') return require(ten); } catch (e) { /* bỏ qua */ }
    return null;
  }
  function duongDan() {
    var path = napNode('path');
    if (!path) return null;
    var ad = null;
    try { if (window.cep_node && window.cep_node.process && window.cep_node.process.env.APPDATA) ad = String(window.cep_node.process.env.APPDATA); } catch (e) { /* bỏ qua */ }
    if (!ad) { try { var pr = napNode('process'); if (pr && pr.env && pr.env.APPDATA) ad = String(pr.env.APPDATA); } catch (e) { /* bỏ qua */ } }
    if (!ad) { try { var os = napNode('os'); if (os) ad = path.join(os.homedir(), 'AppData', 'Roaming'); } catch (e) { /* bỏ qua */ } }
    return ad ? path.join(ad, 'AiOStudio', 'ngonngu.json') : null;
  }
  function hopLe(l) { return l === 'vi' || l === 'en'; }

  function doc() {
    var fs = napNode('fs'), p = duongDan();
    if (fs && p) {
      try {
        if (fs.existsSync(p)) {
          moc = fs.statSync(p).mtimeMs;
          var o = JSON.parse(String(fs.readFileSync(p, 'utf8')));
          if (o && hopLe(o.lang)) return o.lang;
        }
      } catch (e) { try { console.warn('[AiO ngonngu] doc hong', e); } catch (x) { /* bỏ qua */ } }
    }
    try { var l = localStorage.getItem('aio-lang'); if (hopLe(l)) return l; } catch (e) { /* bỏ qua */ }
    return MAC_DINH;
  }

  function ghi(lang) {
    if (!hopLe(lang)) return;
    try { localStorage.setItem('aio-lang', lang); } catch (e) { /* bỏ qua */ }
    var fs = napNode('fs'), path = napNode('path'), p = duongDan();
    if (!fs || !path || !p) return;
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify({ lang: lang }), 'utf8');
      moc = fs.statSync(p).mtimeMs;
    } catch (e) { try { console.warn('[AiO ngonngu] ghi hong', e); } catch (x) { /* bỏ qua */ } }
  }

  // setTimeout chứ không rAF: panel bị che thì rAF đứng yên (đo 22/09).
  function theoDoi(cb) {
    var fs = napNode('fs'), p = duongDan();
    if (!fs || !p) return;
    (function vong() {
      try {
        if (fs.existsSync(p) && fs.statSync(p).mtimeMs !== moc) cb(doc());
      } catch (e) { /* bỏ qua lần này */ }
      setTimeout(vong, 2000);
    })();
  }

  window.AiONgonNgu = { MAC_DINH: MAC_DINH, doc: doc, ghi: ghi, theoDoi: theoDoi };
})();
