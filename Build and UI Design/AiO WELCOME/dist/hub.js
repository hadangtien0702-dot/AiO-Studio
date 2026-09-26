/* =========================================================================
   AiO Studio — PANEL TỔNG 2.1.0 (25/09/2026) — "bệ phóng" mở mọi tool AiO.
   Viết tay, KHÔNG có bước build (giống Guide Frame / Podcast) → dist/ nằm trong git.
   2.1.0: đồng bộ UI với web Shot & Save + animation "vào" lúc mở panel (anh 25/09) —
   phần nhìn nằm ở hub.css; ở đây: cờ st.moDau (lần vẽ đầu của mỗi dạng → #hub.khoi-dong),
   --tre theo thứ tự thẻ, lọc/tìm thêm lớp .moi, nút Nền sáng/tối THẬT (localStorage
   'aio-theme', mặc định tối vì nằm trong Premiere tối), thanh trên có vạch khi cuộn,
   focus không vẽ lại nếu không có gì đổi (khỏi nháy / khỏi chạy lại animation).

   Nguồn dữ liệu THẬT, không gõ cứng trạng thái:
     · Tool nào ĐÃ CÀI  → window.__adobe_cep__.getExtensions() (Premiere trả danh sách)
     · Phiên bản        → đọc ExtensionBundleVersion trong <basePath>/CSXS/manifest.xml
     · Shot & Save      → có file .exe (Win) / .app (Mac) hay không
     · Ngôn ngữ         → file chung %APPDATA%\AiOStudio\ngonngu.json (cả bộ dùng chung)
   Mở tool → requestOpenExtension(<ID thật>) — ID đọc từ manifest 11 panel ngày 22/09.
   ☠️ Welcome Hub 1.5.0 gọi `com.aio.autocut`… (sai 7/7 ID) nên bấm không mở gì.
   ========================================================================= */
(function () {
  'use strict';

  var cep = window.__adobe_cep__ || null;

  function napNode(ten) {
    try { if (window.cep_node && window.cep_node.require) return window.cep_node.require(ten); } catch (e) { /* bỏ qua */ }
    try { if (typeof require === 'function') return require(ten); } catch (e) { /* bỏ qua */ }
    return null;
  }
  function canhBao(msg, e) { try { console.warn('[AiO hub] ' + msg, e || ''); } catch (x) { /* bỏ qua */ } }

  // ── 12 tool. id = Extension Id THẬT (grep manifest 22/09). c = màu nhận diện (nền ô icon đặc,
  //    icon trắng trên nền này đo ≥ 3:1). Autocut giữ cam thương hiệu.
  var TOOLS = [
    { id: 'com.aiostudio.autocut.panel', ten: 'Autocut', icon: 'scissors', nhom: 'dung', c: '#f86820', viec: { vi: 'Cắt khoảng lặng', en: 'Cut silences' } },
    { id: 'com.aiostudio.podcast.panel', ten: 'Auto Podcast', icon: 'mic', nhom: 'dung', c: '#2563eb', viec: { vi: 'Cắt theo người đang nói', en: 'Cut to whoever is speaking' } },
    { id: 'com.aiostudio.shortviral.panel', ten: 'Auto Short Viral', icon: 'messages', nhom: 'dung', c: '#059669', viec: { vi: 'Chia hỏi–đáp thành short', en: 'Turn Q&A into shorts' } },
    { id: 'com.aiostudio.reframe.panel', ten: 'Auto Re-Frames', icon: 'crop', nhom: 'dung', c: '#7c3aed', viec: { vi: 'Dựng dọc 9:16 bám chủ thể', en: 'Vertical 9:16 that follows the subject' } },
    { id: 'com.aiostudio.transcript.panel', ten: 'Transcripts', icon: 'captions', nhom: 'chu', c: '#0284c7', viec: { vi: 'Làm phụ đề từ giọng nói', en: 'Captions from speech' } },
    { id: 'com.aiostudio.guideframe.panel', ten: 'Auto Guideline Frame', icon: 'frame', nhom: 'chu', c: '#d97706', viec: { vi: 'Đặt vùng an toàn mạng xã hội', en: 'Social media safe zones' } },
    { id: 'com.aiostudio.assetmanager.panel', ten: 'Asset Manager', icon: 'layers', nhom: 'tainguyen', c: '#db2777', viec: { vi: 'Kho nhạc, logo, hiệu ứng', en: 'Music, logo and effects library' } },
    { id: 'com.aiostudio.powerbin.panel', ten: 'Power Bins', icon: 'backpack', nhom: 'tainguyen', c: '#0d9488', viec: { vi: 'Brand kit hiện ở mọi project', en: 'Brand kit in every project' } },
    { id: 'com.aiostudio.videodownload.panel', ten: 'Video Download', icon: 'download', nhom: 'tainguyen', c: '#4f46e5', viec: { vi: 'Tải video từ link vào bin', en: 'Download a video link into a bin' } },
    { id: 'com.aiostudio.music.panel', ten: 'Music & SFX', icon: 'music', nhom: 'tainguyen', c: '#c026d3', viec: { vi: 'Nhạc nền và hiệu ứng âm thanh', en: 'Background music and sound effects' } },
    { id: null, app: true, ten: 'Shot & Save', icon: 'camera', nhom: 'khac', c: '#65a30d', viec: { vi: 'Chụp màn hình, ghim, vẽ', en: 'Screenshot, pin, annotate' } },
    { id: null, sap: true, ten: 'Auto Organize Folder', icon: 'folders', nhom: 'khac', c: '#52525b', viec: { vi: 'Tự xếp thư mục dự án', en: 'Auto-organize project folders' } }
  ];
  var CUOI_NHOM = [3, 5, 9]; // vạch chia ở thanh icon: sau Re-Frames, Guide Frame, Music
  var NHOM = ['dung', 'chu', 'tainguyen', 'khac'];

  var CHU = {
    vi: {
      tatCa: 'Tất cả', dung: 'Dựng & cắt', chu: 'Chữ & khung hình', tainguyen: 'Tài nguyên', khac: 'Khác',
      tim: 'Tìm tool…', timNut: 'Tìm tool', nenSang: 'Nền sáng', nenToi: 'Nền tối', chuong: 'Thông báo (sắp có)', taiKhoan: 'Tài khoản (sắp có)',
      doiNgonNgu: 'Đổi sang English', app: 'App', appGiai: 'Mở app riêng, ngoài Premiere', sapCo: 'Sắp có', chuaCai: 'Chưa cài',
      bannerNho: 'Khám phá sức mạnh AiO Studio', bannerLon1: 'Tất cả công cụ, cho ', bannerLon2: 'nhà sáng tạo hiện đại',
      bannerPhu: 'Tự động hóa quy trình – Tiết kiệm thời gian – Tập trung vào sáng tạo.',
      mo: 'Mở', ban: 'bản', khongThay: 'Không thấy tool nào khớp',
      tbSapCo: 'Tính năng này sắp có.', tbToolSapCo: ' sắp có, chưa phát hành.',
      tbChuaCai: ' chưa cài trên máy này. Cài từ bộ cài AiO Studio rồi mở lại Premiere.',
      tbNgoaiPremiere: 'Chỉ mở được tool khi panel chạy trong Premiere.', tbLoiMo: 'Không mở được ',
      tbMoApp: 'Đang mở Shot & Save…', tbChuaCaiApp: 'Chưa cài Shot & Save trên máy này.'
    },
    en: {
      tatCa: 'All', dung: 'Edit & cut', chu: 'Text & frames', tainguyen: 'Assets', khac: 'Other',
      tim: 'Search tools…', timNut: 'Search tools', nenSang: 'Light mode', nenToi: 'Dark mode', chuong: 'Notifications (coming soon)', taiKhoan: 'Account (coming soon)',
      doiNgonNgu: 'Chuyển sang Tiếng Việt', app: 'App', appGiai: 'Opens a separate app, outside Premiere', sapCo: 'Coming soon', chuaCai: 'Not installed',
      bannerNho: 'Discover the power of AiO Studio', bannerLon1: 'Every tool, for ', bannerLon2: 'the modern creator',
      bannerPhu: 'Automate your workflow – Save time – Focus on creating.',
      mo: 'Open', ban: 'version', khongThay: 'No tool matches',
      tbSapCo: 'This is coming soon.', tbToolSapCo: ' is coming soon, not released yet.',
      tbChuaCai: ' is not installed on this computer. Install it from the AiO Studio installer, then restart Premiere.',
      tbNgoaiPremiere: 'Tools can only be opened when this panel runs inside Premiere.', tbLoiMo: 'Could not open ',
      tbMoApp: 'Opening Shot & Save…', tbChuaCaiApp: 'Shot & Save is not installed on this computer.'
    }
  };

  // ── Icon Lucide (ISC) ─────────────────────────────────────────────────────
  var P = {
    scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    captions: '<rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
    messages: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    frame: '<line x1="22" x2="2" y1="6" y2="6"/><line x1="22" x2="2" y1="18" y2="18"/><line x1="6" x2="6" y1="2" y2="22"/><line x1="18" x2="18" y1="2" y2="22"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    folders: '<path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>'
  };
  function ic(ten, s, w) {
    return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.9) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[ten] + '</svg>';
  }
  function thoat(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Trạng thái ───────────────────────────────────────────────────────────
  // moDau: lần vẽ này là "mở panel / đổi dạng" → chạy animation vào (#hub.khoi-dong). vaoNhe: vẽ lại vì lọc/tìm → thẻ .moi
  var st = { lang: 'vi', theme: 'dark', nhom: 'tatca', tim: '', moTim: false, daCai: {}, ban: {}, coCep: !!cep, dang: '', rong: null, ratRong: null, cao: null, moDau: false, vaoNhe: false };
  var hub = document.getElementById('hub');

  // ── Nền sáng / tối: token của web Shot & Save. Mặc định TỐI (panel nằm trong Premiere tối),
  //    bấm nút thì nhớ trong localStorage — riêng panel này, 11 panel tool vẫn tối.
  function docTheme() {
    try { var t = localStorage.getItem('aio-theme'); if (t === 'light' || t === 'dark') return t; } catch (e) { /* bỏ qua */ }
    return 'dark';
  }
  function apTheme() { document.documentElement.setAttribute('data-theme', st.theme); }
  function ghiTheme(t) { try { localStorage.setItem('aio-theme', t); } catch (e) { /* bỏ qua */ } }

  // ── Ngôn ngữ: file CHUNG cả bộ (cùng logic design-system/ngonngu.tsx) ────
  function layAppData() {
    try { if (window.cep_node && window.cep_node.process && window.cep_node.process.env.APPDATA) return String(window.cep_node.process.env.APPDATA); } catch (e) { /* bỏ qua */ }
    try { var pr = napNode('process'); if (pr && pr.env && pr.env.APPDATA) return String(pr.env.APPDATA); } catch (e) { /* bỏ qua */ }
    try { var os = napNode('os'), path = napNode('path'); if (os && path) return path.join(os.homedir(), 'AppData', 'Roaming'); } catch (e) { /* bỏ qua */ }
    return null;
  }
  function fileNgonNgu() {
    var path = napNode('path'), ad = layAppData();
    return path && ad ? path.join(ad, 'AiOStudio', 'ngonngu.json') : null;
  }
  var mocNgonNgu = 0;
  function docNgonNgu() {
    var fs = napNode('fs'), p = fileNgonNgu();
    if (fs && p) {
      try {
        if (fs.existsSync(p)) {
          mocNgonNgu = fs.statSync(p).mtimeMs;
          var o = JSON.parse(String(fs.readFileSync(p, 'utf8')));
          if (o && (o.lang === 'vi' || o.lang === 'en')) return o.lang;
        }
      } catch (e) { canhBao('doc ngonngu.json hong', e); }
    }
    try { var l = localStorage.getItem('aio-lang'); if (l === 'vi' || l === 'en') return l; } catch (e) { /* bỏ qua */ }
    return 'vi';
  }
  function ghiNgonNgu(lang) {
    try { localStorage.setItem('aio-lang', lang); } catch (e) { /* bỏ qua */ }
    var fs = napNode('fs'), path = napNode('path'), p = fileNgonNgu();
    if (!fs || !path || !p) return;
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify({ lang: lang }), 'utf8');
      mocNgonNgu = fs.statSync(p).mtimeMs;
    } catch (e) { canhBao('ghi ngonngu.json hong', e); }
  }
  // Đồng hành: panel khác đổi ngôn ngữ → panel tổng đổi theo (hỏi mốc giờ sửa file, ~0,1 ms)
  function theoDoiNgonNgu() {
    var fs = napNode('fs'), p = fileNgonNgu();
    if (!fs || !p) return;
    try {
      if (!fs.existsSync(p)) return;
      if (fs.statSync(p).mtimeMs === mocNgonNgu) return;
      var l = docNgonNgu();
      if (l !== st.lang) { st.lang = l; ve(); }
    } catch (e) { /* bỏ qua lần này */ }
  }

  // ── Tool nào đã cài + phiên bản — hỏi thẳng Premiere ────────────────────
  function docDaCai() {
    st.daCai = {}; st.ban = {};
    if (!cep) return;
    var ds = null;
    try { ds = JSON.parse(cep.getExtensions()); } catch (e) { canhBao('getExtensions() khong tham so hong', e); }
    if (!ds || !ds.length) {
      try { ds = JSON.parse(cep.getExtensions(JSON.stringify(TOOLS.filter(function (t) { return t.id; }).map(function (t) { return t.id; })))); } catch (e) { canhBao('getExtensions(ds id) hong', e); }
    }
    if (!ds) return;
    var fs = napNode('fs'), path = napNode('path');
    ds.forEach(function (x) {
      if (!x || !x.id) return;
      st.daCai[x.id] = true;
      if (fs && path && x.basePath) {
        try {
          var xml = String(fs.readFileSync(path.join(x.basePath, 'CSXS', 'manifest.xml'), 'utf8'));
          var m = xml.match(/ExtensionBundleVersion="([^"]+)"/);
          if (m) st.ban[x.id] = m[1];
        } catch (e) { /* manifest không đọc được thì bỏ số phiên bản */ }
      }
    });
    // Shot & Save là app ngoài Premiere — có file chạy hay không
    st.coApp = !!duongDanApp();
  }
  function duongDanApp() {
    var fs = napNode('fs'), path = napNode('path'), os = napNode('os'), pr = napNode('process');
    if (!fs || !path || !os) return null;
    try {
      if (pr && pr.platform === 'darwin') {
        var mac = '/Applications/AiO Shot & Save.app';
        return fs.existsSync(mac) ? mac : null;
      }
      var local = (pr && pr.env && pr.env.LOCALAPPDATA) || path.join(os.homedir(), 'AppData', 'Local');
      var exe = path.join(local, 'Programs', 'aio-shot-and-save', 'AiO Shot & Save.exe');
      return fs.existsSync(exe) ? exe : null;
    } catch (e) { return null; }
  }
  function trangThaiTool(t) {
    if (t.sap) return 'sap';
    if (t.app) return !st.coCep || st.coApp ? 'ok' : 'chua';
    if (!st.coCep) return 'ok'; // xem ngoài Premiere: không biết → không gắn nhãn
    return st.daCai[t.id] ? 'ok' : 'chua';
  }

  // ── Mở tool ─────────────────────────────────────────────────────────────
  var hen = null;
  function bao(msg) {
    var el = document.getElementById('thong-bao');
    el.textContent = msg; el.classList.add('hien');
    clearTimeout(hen); hen = setTimeout(function () { el.classList.remove('hien'); }, 2600);
  }
  function moTool(i) {
    var t = TOOLS[i], C = CHU[st.lang], tt = trangThaiTool(t);
    if (tt === 'sap') { bao(t.ten + C.tbToolSapCo); return; }
    if (t.app) { moApp(); return; }
    if (!cep) { bao(C.tbNgoaiPremiere); return; }
    if (tt === 'chua') { bao(t.ten + C.tbChuaCai); return; }
    try { cep.requestOpenExtension(t.id, ''); } catch (e) { canhBao('requestOpenExtension ' + t.id, e); bao(C.tbLoiMo + t.ten); }
  }
  function moApp() {
    var C = CHU[st.lang], cp = napNode('child_process'), pr = napNode('process');
    if (!cp) { bao(C.tbNgoaiPremiere); return; }
    var dd = duongDanApp();
    if (!dd) { bao(C.tbChuaCaiApp); return; }
    try {
      // Chạy thẳng file .exe, KHÔNG qua explorer + windowsHide (Video Download 21/09: 9 cửa sổ ẩn, 1,67 GB)
      var p = pr && pr.platform === 'darwin'
        ? cp.spawn('open', ['-a', dd], { detached: true, stdio: 'ignore' })
        : cp.spawn(dd, [], { detached: true, stdio: 'ignore' });
      p.on('error', function (e) { canhBao('mo Shot & Save hong', e); bao(C.tbLoiMo + 'Shot & Save'); });
      p.unref();
      bao(C.tbMoApp);
    } catch (e) { canhBao('spawn Shot & Save', e); bao(C.tbLoiMo + 'Shot & Save'); }
  }

  // ── Vẽ ──────────────────────────────────────────────────────────────────
  var BO_DAU = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  function boDau(s) { return String(s).normalize('NFD').replace(BO_DAU, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
  function hopLoc(t) {
    if (st.nhom !== 'tatca' && t.nhom !== st.nhom) return false;
    if (!st.tim) return true;
    var q = boDau(st.tim.trim());
    return boDau(t.ten).indexOf(q) >= 0 || boDau(t.viec.vi).indexOf(q) >= 0 || boDau(t.viec.en).indexOf(q) >= 0;
  }
  function oIcon(t, s) {
    return '<span class="o-icon" style="background: linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0) 58%), ' + t.c + '; box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 6px 16px ' + t.c + '40;">' + ic(t.icon, s, 2.1) + '</span>';
  }
  function tieuDeThe(t, tt) {
    var C = CHU[st.lang];
    if (tt === 'sap') return t.ten + ': ' + C.sapCo;
    if (tt === 'chua') return t.ten + ': ' + C.chuaCai;
    var b = t.id ? st.ban[t.id] : '';
    return C.mo + ' ' + t.ten + (b ? ' · ' + C.ban + ' ' + b : '');
  }
  function nhanThe(t, tt) {
    var C = CHU[st.lang];
    if (tt === 'sap') return '<span class="nhan vien">' + C.sapCo + '</span>';
    if (tt === 'chua') return '<span class="nhan vien canh">' + C.chuaCai + '</span>';
    if (t.app) return '<span class="nhan" title="' + thoat(C.appGiai) + '">' + ic('external', 11) + C.app + '</span>';
    return '';
  }
  // k = thứ tự thẻ ĐANG HIỆN (sau lọc), quyết định độ trễ animation:
  //   mở panel: 260 ms (sau banner/chip) + k × 55 ms · lọc/tìm: k × 25 ms (nhẹ như .ditem.moi của web)
  function veThe(t, i, k) {
    var tt = trangThaiTool(t);
    var lop = 'the' + (tt === 'sap' ? ' sap-co' : tt === 'chua' ? ' chua-cai' : '') + (st.vaoNhe && !st.moDau ? ' moi' : '');
    var tre = st.moDau ? 260 + k * 55 : k * 25;
    return '<button type="button" class="' + lop + '" data-i="' + i + '" style="--tre:' + tre + 'ms" title="' + thoat(tieuDeThe(t, tt)) + '">' +
      oIcon(t, 22) +
      '<span class="the-chu"><span class="the-dong"><span class="the-ten">' + thoat(t.ten) + '</span>' + nhanThe(t, tt) + '</span>' +
      '<span class="the-viec">' + thoat(t.viec[st.lang]) + '</span></span>' +
      (tt === 'ok' ? '<span class="chev">' + ic('chevron', 16, 2.2) + '</span>' : '') +
      '</button>';
  }
  function veDau() {
    var C = CHU[st.lang];
    var tim = st.rong
      ? '<label class="tim">' + ic('search', 15) + '<input type="search" id="o-tim" placeholder="' + thoat(C.tim) + '" aria-label="' + thoat(C.timNut) + '" value="' + thoat(st.tim) + '"></label>'
      : '';
    return '<header class="dau">' +
      '<img class="logo" src="assets/logo-mark.png" alt="">' +
      '<h1 class="ten-app">AiO Studio</h1>' +
      (st.rong ? tim + '<span class="gian"></span>' : '<span class="gian"></span><button type="button" class="nut-ic" id="nut-tim" aria-pressed="' + st.moTim + '" aria-label="' + thoat(C.timNut) + '" title="' + thoat(C.timNut) + '">' + ic('search', 18) + '</button>') +
      nutTheme() +
      '<button type="button" class="nut-ic" data-sapco="1" aria-label="' + thoat(C.chuong) + '" title="' + thoat(C.chuong) + '">' + ic('bell', 18) + '<span class="cham" aria-hidden="true"></span></button>' +
      '<button type="button" class="nut-lang" id="nut-lang" aria-label="' + thoat(C.doiNgonNgu) + '" title="' + thoat(C.doiNgonNgu) + '">' + (st.lang === 'vi' ? 'VI' : 'EN') + '</button>' +
      '<button type="button" class="avatar" data-sapco="1" aria-label="' + thoat(C.taiKhoan) + '" title="' + thoat(C.taiKhoan) + '">' + ic('user', 17) + '</button>' +
      '</header>' +
      (!st.rong && st.moTim ? '<div class="hang-tim"><label class="tim">' + ic('search', 15) + '<input type="search" id="o-tim" placeholder="' + thoat(C.tim) + '" aria-label="' + thoat(C.timNut) + '" value="' + thoat(st.tim) + '"></label></div>' : '');
  }
  // Nút đổi nền: đang tối → hiện mặt trời "Nền sáng"; đang sáng → mặt trăng "Nền tối" (như nút .theme của web)
  function nutTheme() {
    var C = CHU[st.lang], nhan = st.theme === 'light' ? C.nenToi : C.nenSang;
    return '<button type="button" class="nut-ic" id="nut-theme" aria-label="' + thoat(nhan) + '" title="' + thoat(nhan) + '">' + ic(st.theme === 'light' ? 'moon' : 'sun', 18) + '</button>';
  }
  function veBanner() {
    var C = CHU[st.lang];
    return '<section class="banner">' +
      '<div class="banner-chu"><span class="banner-nho">' + C.bannerNho + '</span>' +
      '<h2 class="banner-lon">' + C.bannerLon1 + '<em>' + C.bannerLon2 + '</em></h2>' +
      '<span class="banner-phu">' + C.bannerPhu + '</span></div>' +
      '<span class="khoi khoi-1" aria-hidden="true">' + ic('frame', 34, 2.6) + '</span>' +
      '<span class="khoi khoi-2" aria-hidden="true">' + ic('plus', 40, 2.6) + '</span>' +
      '<span class="khoi khoi-3" aria-hidden="true">' + ic('plus', 38, 2.6) + '</span>' +
      '<span class="chu-tay" aria-hidden="true">Create\nFaster\nTogether</span>' +
      '</section>';
  }
  function veLoc() {
    var C = CHU[st.lang];
    var ds = [{ id: 'tatca', ten: C.tatCa, so: TOOLS.length }].concat(NHOM.map(function (n) {
      return { id: n, ten: C[n], so: TOOLS.filter(function (t) { return t.nhom === n; }).length };
    }));
    return '<div class="loc" role="toolbar">' + ds.map(function (c, k) {
      return '<button type="button" class="chip" data-nhom="' + c.id + '" aria-pressed="' + (st.nhom === c.id) + '" style="--n:' + k + '">' + thoat(c.ten) + ' <span class="so">' + c.so + '</span></button>';
    }).join('') + '</div>';
  }
  function veLuoi() {
    var C = CHU[st.lang], html = '', k = 0;
    TOOLS.forEach(function (t, i) { if (hopLoc(t)) { html += veThe(t, i, k); k++; } });
    if (!html) return '<div class="rong-khong">' + C.khongThay + ' “' + thoat(st.tim) + '”</div>';
    return '<div class="luoi">' + html + '</div>';
  }
  function veRail() {
    var C = CHU[st.lang];
    var ds = TOOLS.map(function (t, i) {
      var tt = trangThaiTool(t);
      var lop = 'o-rail' + (tt === 'sap' ? ' sap-co' : tt === 'chua' ? ' chua-cai' : '');
      return '<button type="button" class="' + lop + '" data-i="' + i + '" style="--tre:' + (80 + i * 40) + 'ms" aria-label="' + thoat(t.ten) + '" title="' + thoat(t.ten + ': ' + t.viec[st.lang] + (tt === 'chua' ? ' (' + C.chuaCai + ')' : tt === 'sap' ? ' (' + C.sapCo + ')' : '')) + '">' +
        oIcon(t, 18) + (t.app ? '<span class="phu">' + ic('external', 9) + '</span>' : '') + '</button>' +
        (CUOI_NHOM.indexOf(i) >= 0 ? '<span class="rail-vach" aria-hidden="true"></span>' : '');
    }).join('');
    return '<div class="rail">' +
      '<div class="rail-dau"><img class="logo" src="assets/logo-mark.png" alt="AiO Studio"><span class="ten-app">AiO Studio</span></div>' +
      '<span class="rail-vach-dau" aria-hidden="true"></span>' +
      '<nav class="rail-ds" aria-label="AiO Studio">' + ds + '</nav>' +
      '<div class="rail-cuoi">' +
      '<button type="button" class="nut-ic" data-sapco="1" aria-label="' + thoat(C.chuong) + '" title="' + thoat(C.chuong) + '">' + ic('bell', 18) + '<span class="cham" aria-hidden="true"></span></button>' +
      nutTheme() +
      '<button type="button" class="avatar" data-sapco="1" aria-label="' + thoat(C.taiKhoan) + '" title="' + thoat(C.taiKhoan) + '">' + ic('user', 17) + '</button>' +
      '</div></div>';
  }
  // Animation "vào" chạy tối đa ~1,9 s (thẻ cuối: 260 + 11×55 + 420 + icon 620 ms). Gỡ lớp bằng
  // setTimeout, KHÔNG chờ animationend (panel bị che thì animationend không tới — bài 5ao).
  var henKhoi = null;
  function ve() {
    document.documentElement.lang = st.lang;
    var dangGo = document.activeElement && document.activeElement.id === 'o-tim';
    var viTri = dangGo ? document.activeElement.selectionStart : 0;
    var cuon = hub.querySelector('.than'); var cuonY = cuon ? cuon.scrollTop : 0;
    var khoiDong = st.moDau;
    if (st.dang === 'luoi') {
      hub.innerHTML = veDau() + '<main class="than">' + veBanner() + veLoc() + veLuoi() + '</main>';
    } else {
      hub.innerHTML = veRail();
    }
    st.moDau = false; st.vaoNhe = false;
    if (khoiDong) {
      hub.classList.add('khoi-dong');
      clearTimeout(henKhoi); henKhoi = setTimeout(function () { hub.classList.remove('khoi-dong'); }, 2200);
    } else {
      hub.classList.remove('khoi-dong'); clearTimeout(henKhoi);
    }
    var o = document.getElementById('o-tim');
    if (o && (dangGo || (!st.rong && st.moTim && st.vuaMoTim))) { o.focus(); try { o.setSelectionRange(viTri || o.value.length, viTri || o.value.length); } catch (e) { /* bỏ qua */ } }
    st.vuaMoTim = false;
    var cuonMoi = hub.querySelector('.than');
    if (cuonMoi) {
      cuonMoi.scrollTop = cuonY;
      // Thanh trên có vạch dưới khi thân đã cuộn (như header.scrolled của web)
      hub.classList.toggle('cuon', cuonY > 2);
      cuonMoi.addEventListener('scroll', function () { hub.classList.toggle('cuon', cuonMoi.scrollTop > 2); }, { passive: true });
    } else {
      hub.classList.remove('cuon');
    }
  }
  // Chỉ vẽ lại danh sách thẻ khi gõ tìm — giữ nguyên ô nhập (khỏi mất con trỏ)
  function veLaiLuoi() {
    var than = hub.querySelector('.than'); if (!than) return;
    var cu = than.querySelector('.luoi, .rong-khong');
    st.vaoNhe = true; // thẻ khớp hiện nhẹ (vao 220 ms) như web
    var tam = document.createElement('div'); tam.innerHTML = veLuoi();
    st.vaoNhe = false;
    if (cu) than.replaceChild(tam.firstChild, cu); else than.appendChild(tam.firstChild);
  }

  // ── Dạng theo kích thước panel ──────────────────────────────────────────
  function doKhoi() {
    var w = window.innerWidth, h = window.innerHeight;
    var dang = (w < 340 || h < 260) ? (w > h ? 'ngang' : 'doc') : 'luoi';
    var rong = w >= 720, ratRong = w >= 1100, cao = h >= 520;
    hub.classList.toggle('rong', rong); hub.classList.toggle('rat-rong', ratRong); hub.classList.toggle('cao', cao);
    hub.setAttribute('data-dang', dang);
    // Đổi dạng (lưới ↔ thanh icon, thẻ ngang ↔ đứng) = mở một bố cục mới → chạy animation vào
    if (dang !== st.dang || rong !== st.rong) { st.dang = dang; st.rong = rong; st.moDau = true; ve(); }
  }

  // ── Sự kiện (gắn MỘT lần lên #hub, không gắn lại sau mỗi lần vẽ) ─────────
  hub.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('button') : null;
    if (!el) return;
    if (el.hasAttribute('data-i')) { moTool(Number(el.getAttribute('data-i'))); return; }
    if (el.hasAttribute('data-nhom')) { st.nhom = el.getAttribute('data-nhom'); st.vaoNhe = true; ve(); return; }
    if (el.id === 'nut-lang') { st.lang = st.lang === 'vi' ? 'en' : 'vi'; ghiNgonNgu(st.lang); ve(); return; }
    if (el.id === 'nut-theme') { st.theme = st.theme === 'light' ? 'dark' : 'light'; ghiTheme(st.theme); apTheme(); ve(); return; }
    if (el.id === 'nut-tim') { st.moTim = !st.moTim; st.vuaMoTim = st.moTim; if (!st.moTim) st.tim = ''; ve(); return; }
    if (el.hasAttribute('data-sapco')) { bao(CHU[st.lang].tbSapCo); return; }
  });
  hub.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'o-tim') { st.tim = e.target.value; veLaiLuoi(); }
  });
  // Dải icon NGANG tràn (đo 22/09: 600×200 tràn 309px) — con lăn chuột dọc cũng phải cuộn được nó
  hub.addEventListener('wheel', function (e) {
    if (st.dang !== 'ngang') return;
    var ds = hub.querySelector('.rail-ds');
    if (!ds || ds.scrollWidth <= ds.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    ds.scrollLeft += e.deltaY; e.preventDefault();
  }, { passive: false });
  hub.addEventListener('keydown', function (e) {
    if (e.target && e.target.id === 'o-tim' && e.key === 'Escape') { st.tim = ''; e.target.value = ''; veLaiLuoi(); }
  });
  // setTimeout, KHÔNG requestAnimationFrame: panel nằm ở tab dock bị che thì rAF đứng yên → kéo
  // panel lúc đó sẽ kẹt ở dạng cũ (đo 22/09 trên tab chạy ngầm: 1280×720 mà thiếu lớp rat-rong/cao)
  var henDo = null;
  window.addEventListener('resize', function () { clearTimeout(henDo); henDo = setTimeout(doKhoi, 60); });
  // Người dùng cài thêm tool / đổi ngôn ngữ ở panel khác rồi quay lại → hỏi lại (rẻ)
  // Chỉ vẽ lại khi danh sách cài / phiên bản / app THẬT SỰ đổi — focus xảy ra liên tục khi
  // người dùng bấm qua lại panel, vẽ lại mỗi lần là nháy và mất trạng thái rê chuột.
  window.addEventListener('focus', function () {
    var truoc = JSON.stringify([st.daCai, st.ban, st.coApp]);
    docDaCai();
    if (JSON.stringify([st.daCai, st.ban, st.coApp]) !== truoc) ve();
  });
  setInterval(theoDoiNgonNgu, 2000);

  // ── Khởi động ──────────────────────────────────────────────────────────
  st.theme = docTheme(); apTheme();
  st.lang = docNgonNgu();
  docDaCai();
  st.moDau = true; // lần vẽ đầu = mở panel → animation vào
  doKhoi();
  if (!st.dang) { st.dang = 'luoi'; ve(); }
  window.__aioHub = { st: st, TOOLS: TOOLS, doKhoi: doKhoi, ve: ve }; // để đo qua cổng gỡ lỗi 8101
})();
