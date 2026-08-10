/**
 * ung-dung.js — THAY CAC HAM GIA BANG CHUC NANG THAT.
 *
 * Nap SAU script dieu khien UI trong index.html, nen cac ham dinh nghia o day
 * de len ban gia cung ten. Lam vay de giu nguyen ban thiet ke anh Tien da duyet
 * (khong phai viet lai 1000 dong HTML) ma van co chuc nang that.
 *
 * ☠️ THIET KE THEO QUY MO THAT — do tren kho nhac anh Tien: **10.673 file**.
 * Ban dau em lam kieu "quet xong het roi moi hien" va no hong hoan toan:
 *   - Goi ffprobe 10.673 lan = 10-20 phut, man hinh trong tron, nguoi dung
 *     tuong tool hong (dung nguyen van cai anh Tien gap: "import khong duoc").
 *   - Ve 10.673 hang x 80 vach song = 853.840 the DOM -> panel treo cung.
 * Nay chia ba thi:
 *   1. HIEN NGAY  — doc ten file, khong goi ffprobe. 10.673 bai hien tuc thi.
 *   2. CHAY NGAM  — ffprobe theo lo, co bo nho dem, cap nhat tung hang tai cho.
 *   3. VE THEO CUA SO — chi dung 150 hang trong DOM, cuon toi dau ve toi do.
 */

/* ══════════════════════════════════════════
   KHO — danh sach thu muc nguoi dung da them
══════════════════════════════════════════ */
var KHO = { thuMuc: [] };

function fileKho() {
  var path = getPath(), kho = duongDanKho();
  if (!path || !kho) return '';
  return path.join(kho, 'kho.json');
}

function luuKho() {
  var fs = getFs(), path = getPath(), f = fileKho();
  if (!fs || !f) return;
  try {
    var cha = path.dirname(f);
    if (!fs.existsSync(cha)) fs.mkdirSync(cha, { recursive: true });
    fs.writeFileSync(f, JSON.stringify({ thuMuc: KHO.thuMuc }, null, 2), 'utf8');
  } catch (e) {}
}

function napKho() {
  var fs = getFs(), f = fileKho();
  if (!fs || !f) return;
  try {
    if (!fs.existsSync(f)) return;
    var j = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (j && j.thuMuc) KHO.thuMuc = j.thuMuc;
  } catch (e) {}
}

/* ══════════════════════════════════════════
   TIEN ICH
══════════════════════════════════════════ */
function tenGon(duongDan) {
  var path = getPath();
  var t = path ? path.basename(duongDan) : String(duongDan).split(/[\\/]/).pop();
  return t.replace(/\.[^.]+$/, '');
}

function dinhDangPhut(giay) {
  if (!giay || giay <= 0) return '--:--';
  var p = Math.floor(giay / 60), g = Math.round(giay % 60);
  if (g === 60) { p += 1; g = 0; }
  return p + ':' + (g < 10 ? '0' : '') + g;
}

function doanTheLoai(chuoi) {
  var s = String(chuoi).toLowerCase(), ra = [];
  var bang = [
    ['cinematic', ['cinematic', 'orchestral', 'epic']],
    ['lofi',      ['lofi', 'lo-fi', 'chill', 'relax', 'jazz']],
    ['upbeat',    ['upbeat', 'happy', 'pop', 'energetic', 'edm', 'dance', 'funk']],
    ['corporate', ['corporate', 'business', 'motivat', 'inspir', 'tech']],
    ['suspense',  ['suspense', 'tension', 'dark', 'horror', 'drama']],
    ['trailer',   ['trailer', 'stomp', 'impact']]
  ];
  for (var i = 0; i < bang.length; i++) {
    for (var j = 0; j < bang[i][1].length; j++) {
      if (s.indexOf(bang[i][1][j]) >= 0) { ra.push(bang[i][0]); break; }
    }
  }
  return ra;
}

/* ══════════════════════════════════════════
   BUOC 1 — HIEN NGAY (khong goi ffprobe)
══════════════════════════════════════════ */
var dangQuet = false;
var tienTrinh = { xong: 0, tong: 0, chay: false };

function quetLai() {
  if (!coNode()) return Promise.resolve();
  if (dangQuet) { toast2('Dang quet, doi chut...'); return Promise.resolve(); }
  dangQuet = true;

  var tatCa = [];
  for (var i = 0; i < KHO.thuMuc.length; i++) {
    var ds = quetThuMuc(KHO.thuMuc[i].duongDan);
    KHO.thuMuc[i].soFile = ds.length;
    tatCa = tatCa.concat(ds);
  }
  veDanhSachThuMuc();

  if (!tatCa.length) {
    TRACKS = []; dangQuet = false;
    renderTracks([]); capNhatDemDanhMuc();
    return Promise.resolve();
  }

  // Dung bo nho dem neu co san -> mo lai panel la hien du ngay, khong doi
  napDem();

  TRACKS = tatCa.map(function (f, i) {
    var ten = tenGon(f);
    var doan = doanTuTenFile(f);
    var vt = vanTay(f);
    var cu = DEM.du[f];
    var m = (cu && cu.vt === vt) ? cu.m : null;   // co trong dem thi lay luon

    return {
      id: i + 1,
      duongDan: f,
      name: (m && m.title) ? m.title : ten,
      tags: m ? [m.genre, m.artist].filter(Boolean).slice(0, 2) : [],
      bpm: m ? (m.bpm || 0) : doan.bpm,
      key: m ? (m.key || '') : doan.key,
      giay: m ? (m.duration || 0) : 0,
      dur: m ? dinhDangPhut(m.duration) : '--:--',
      mood: (doanTheLoai(f + ' ' + (m ? m.genre : '')).join(' ')).toLowerCase(),
      nguon: m ? m.nguon : (doan.bpm || doan.key ? 'ten-file' : ''),
      daDoc: !!m,
      song: null
    };
  });

  dangQuet = false;
  capNhatDemDanhMuc();
  renderTracks(getFiltered());

  var chuaDoc = TRACKS.filter(function (t) { return !t.daDoc; }).length;
  if (chuaDoc) {
    toast2(TRACKS.length + ' bai — dang doc thong tin ' + chuaDoc + ' bai...');
    docNgam();
  } else {
    toast2(TRACKS.length.toLocaleString('vi') + ' bài (lấy từ bộ nhớ đệm)');
    doTuDong();
  }
  return Promise.resolve();
}

/* ══════════════════════════════════════════
   BUOC 2 — CHAY NGAM doc metadata
   ☠️ 8 tien trinh song song, KHONG nhieu hon. Bai hoc do that cua Asset
   Manager: nut that la DAU DOC O CUNG chu khong phai CPU — 16 luong chay
   CHAM HON 8. Va day la viec chay nen trong luc nguoi ta dang dung, nen
   chi ap TRAN tai nguyen, khong ap san (luat tai nguyen 04/08).
══════════════════════════════════════════ */
var SONG_SONG = 8;
var dungNgam = false;

function docNgam() {
  var canDoc = TRACKS.filter(function (t) { return !t.daDoc; });
  if (!canDoc.length) { capNhatTienTrinh(0, 0); return; }

  dungNgam = false;
  tienTrinh = { xong: 0, tong: canDoc.length, chay: true };
  capNhatTienTrinh(0, canDoc.length);

  var viTri = 0;
  var luuMoi = 0;

  function ganTiep() {
    if (dungNgam || viTri >= canDoc.length) return Promise.resolve();
    var t = canDoc[viTri++];
    return docMetadataCoDem(t.duongDan).then(function (m) {
      apMeta(t, m);
      tienTrinh.xong++;
      if (tienTrinh.xong % 25 === 0 || tienTrinh.xong === canDoc.length) {
        capNhatTienTrinh(tienTrinh.xong, canDoc.length);
      }
      if (++luuMoi >= 300) { luuMoi = 0; luuDem(); }   // luu dan, khong doi den cuoi
      return ganTiep();
    }).catch(function () {
      tienTrinh.xong++;
      return ganTiep();
    });
  }

  var chay = [];
  for (var i = 0; i < SONG_SONG; i++) chay.push(ganTiep());

  return Promise.all(chay).then(function () {
    tienTrinh.chay = false;
    luuDem();
    capNhatTienTrinh(tienTrinh.tong, tienTrinh.tong);
    capNhatDemDanhMuc();
    // Doc metadata xong -> moi biet bai nao du dai de la nhac -> do BPM/Key
    var soNhac = TRACKS.filter(laNhac).length;
    toast2(TRACKS.length.toLocaleString('vi') + ' bài · ' + soNhac.toLocaleString('vi') + ' bài đủ dài để đo BPM/Key');
    doTuDong();
  });
}

/** Do metadata vao mot bai va cap nhat DUNG HANG do tren man hinh. */
function apMeta(t, m) {
  if (m.title) t.name = m.title;
  var the = [m.genre, m.artist].filter(Boolean).slice(0, 2);
  if (the.length) t.tags = the;
  if (m.bpm) t.bpm = m.bpm;
  if (m.key) t.key = m.key;
  if (m.duration) { t.giay = m.duration; t.dur = dinhDangPhut(m.duration); }
  if (m.genre) t.mood = (t.mood + ' ' + doanTheLoai(m.genre).join(' ')).trim();
  t.nguon = m.nguon || t.nguon;
  t.daDoc = true;

  // Cap nhat tai cho — khong ve lai ca danh sach (10.673 hang thi treo)
  var row = document.getElementById('row-' + t.id);
  if (!row) return;
  var elTen = row.querySelector('.tr-name');   if (elTen) elTen.innerText = t.name;
  var elBpm = row.querySelector('.sp-bpm');    if (elBpm) elBpm.innerText = t.bpm || '—';
  var elKey = row.querySelector('.sp-key');    if (elKey) elKey.innerText = t.key || '—';
  var elDur = row.querySelector('.sp-dur');    if (elDur) elDur.innerText = t.dur;
  var elThe = row.querySelector('.tr-tags');
  if (elThe && t.tags.length) {
    elThe.innerHTML = t.tags.map(function (g) { return '<span class="tr-tag">' + g + '</span>'; }).join('');
  }
}

function capNhatTienTrinh(xong, tong) {
  var el = document.getElementById('tien-trinh');
  var thanh = document.getElementById('tien-trinh-thanh');
  if (!el) return;
  if (!tong || xong >= tong) { el.classList.remove('hien'); return; }
  el.classList.add('hien');
  var pct = Math.round(xong / tong * 100);
  if (thanh) thanh.style.width = pct + '%';
  var chu = document.getElementById('tien-trinh-chu');
  if (chu) chu.innerText = 'Đang đọc ' + xong.toLocaleString('vi') + '/' + tong.toLocaleString('vi');
}

/* ══════════════════════════════════════════
   BUOC 3 — VE THEO CUA SO
   Chi giu ~150 hang trong DOM. Cuon xuong gan het thi ve them.
══════════════════════════════════════════ */
var LO_VE = 150;
var daVe = 0;
var dsHienTai = [];

/**
 * Badge BPM/Key.
 * ☠️ File ngan (< 30s) la SOUND EFFECT — BPM/Key VO NGHIA voi tieng chuong bao,
 * tieng gio, tieng buoc chan. Hien "—" o day trong nhu tool hong, ma hien so
 * thi con te hon: bia dat. Nen bao thang la KHONG AP DUNG (dau "·" mo, ro tooltip).
 */
function badgeHtml(t) {
  // ☠️ Sua 09/08: truoc day cu file < 30s la AN badge, ke ca khi DA CO key that.
  // Hau qua: bam loc theo tong thi "Tone A" / "Sampletraxx Cello" lot vao danh
  // sach (dung, chung co tong that) nhung o hang lai khong hien tong nao —
  // nguoi dung khong hieu no vao day kieu gi.
  // Luat dung: CO du lieu thi HIEN, du bai ngan. Chi khi THIEU du lieu moi phan
  // biet — bai dai la "dang doi do" (…), bai ngan la "khong ap dung" (·).
  if (!t.bpm && !t.key && !laNhac(t)) {
    return '<span class="sp sp-na" title="Sound effect — BPM/Key không áp dụng">·</span>' +
           '<span class="sp sp-na" title="Sound effect — BPM/Key không áp dụng">·</span>';
  }
  var cho = laNhac(t) ? '<span class="cho-do">…</span>' : '<span class="sp-na-in">·</span>';
  var b = t.bpm ? t.bpm : cho;
  var k = t.key ? t.key : cho;
  // Bam vao badge la SO RA nhac lien quan luon (anh Tien 09/08) — khong phai
  // sang tab khac roi bam Do lai tu dau. Key da co san thi khoi do lai.
  var nhac = locKeyGoc === t.key ? 'Bỏ lọc' : ('Xem nhạc & sound hợp tông ' + t.key);
  var bamK = t.key ? ' onclick="event.stopPropagation();soRaTheoKey(' + t.id + ')" title="' + nhac + '"' : '';
  var bamB = t.bpm ? ' onclick="event.stopPropagation();soRaTheoBPM(' + t.id + ')" title="Xem nhạc cùng nhịp ' + t.bpm + ' BPM"' : '';

  // Dang loc theo tong -> to mau badge theo MUC HOP, nhin la biet ngay bai nao
  // hop nhat, khong phai doc tung chu.
  var mau = '';
  if (locKeyGoc && t.key) {
    var qh = quanHeKey(locKeyGoc, t.key);
    mau = ' hop-q' + qh.muc;
    if (locKeyGoc === t.key) mau += ' dang-loc';
  }

  return '<span class="sp sp-bpm' + (t.bpm ? ' bam' : '') + '"' + bamB + '>' + b + '</span>' +
         '<span class="sp sp-key' + (t.key ? ' bam' : '') + mau + '"' + bamK + '>' + k + '</span>';
}

/**
 * Bam badge Key -> LOC NGAY TRONG THU VIEN.
 * ☠️ Anh Tien 09/08: *"no phai duoc filter ngay tren trong tab thu vien luon
 * chu khong phai nhay sang tab khac"*. Ban truoc em cho nhay sang tab Tim Key —
 * sai thoi quen: dang duyet kho ma bi day sang man hinh khac, mat mach.
 * Nay o nguyen cho, danh sach loc lai, co dai bao + nut bo loc.
 * Lay CA nhac VA sound (*"cac bai nhac va sound tuong ung"*), khong loai SFX.
 */
function soRaTheoKey(id) {
  var t = TRACKS.find(function (x) { return x.id === id; });
  if (!t || !t.key) return;

  // Bam lai chinh badge dang loc = bo loc
  if (locKeyGoc === t.key) { boLocKey(); return; }

  locKeyGoc = t.key;
  locBPMGoc = 0;                    // hai bo loc khong chong nhau cho roi mat
  // ☠️ Bo loc thu muc: anh Tien muon *"cac bai NHAC VA SOUND tuong ung"* — tuc
  // la quet CA KHO, khong bo trong thu muc dang mo. Sound hop tong hay nam o
  // kho SFX khac han thu muc nhac.
  thuMucChon = '';
  veCayThuMuc();
  switchMode('lib');
  renderTracks(getFiltered());
  var n = dsHienTai.length;
  toast2('Hợp với ' + t.key + ' (' + keyVi(t.key) + ') · ' + n.toLocaleString('vi') + ' bài trong cả kho');
}

function boLocKey() {
  locKeyGoc = '';
  renderTracks(getFiltered());
  toast2('Đã bỏ lọc');
}

/** Ban cu — sang han tab Tim Key. Giu lai cho nut trong tab do dung. */
function moTabKeyVoiBai(id) {
  var t = TRACKS.find(function (x) { return x.id === id; });
  if (!t || !t.key) return;
  // ☠️ THU TU QUAN TRONG: `switchMode('key')` co goi `capNhatNguonDoKey()`, ma
  // ham do GHI DE `baiDoKey` bang `dsHienTai[0]`. Dat baiDoKey TRUOC switchMode
  // la bi xoa ngay — do that 09/08: bam badge key cua bai DRIP ma goi y lai
  // tinh theo "_ Alarm 1" (bai dau danh sach). Phai doi tab XONG roi moi dat.
  nguonDoKey = 'kho';
  switchMode('key');
  var a = document.getElementById('dn-tab-kho-k'), b = document.getElementById('dn-tab-seq-k');
  if (a) a.classList.add('active');
  if (b) b.classList.remove('active');

  baiDoKey = { duongDan: t.duongDan, name: t.name, giay: t.giay, track: t };
  keyDangCo = t.key;

  var ten = document.getElementById('dnk-ten'); if (ten) ten.innerText = t.name;
  var phu = document.getElementById('dnk-phu');
  if (phu) phu.innerText = t.dur + ' · ' + (t._nhanh || []).join(' / ');

  var pt = layPhanTich(t.duongDan);
  var pct = pt && pt.tinCayKey ? Math.round(pt.tinCayKey * 100) : 0;
  var eK = document.getElementById('ks-key-val');
  if (eK) { eK.innerText = t.key; eK.classList.remove('trong'); }
  var eV = document.getElementById('ks-mode');   if (eV) eV.innerText = keyVi(t.key);
  var eP = document.getElementById('ks-conf-pct'); if (eP) eP.innerText = pct ? pct + '%' : '—';
  var eF = document.getElementById('ks-conf-fill'); if (eF) eF.style.width = pct + '%';
  var eC = document.getElementById('ks-canh');
  if (eC) eC.innerText = (pct && pct < 50) ? '⚠ Cao độ không rõ — con số chỉ nên tham khảo.' : '';

  veNhacHop(t.key);
  toast2('Nhạc hợp với ' + t.key + ' (' + keyVi(t.key) + ')');
}

/** Bam badge BPM -> loc ngay trong Thu Vien nhung bai cung nhip. */
function soRaTheoBPM(id) {
  var t = TRACKS.find(function (x) { return x.id === id; });
  if (!t || !t.bpm) return;
  locBPMGoc = t.bpm;
  thuMucChon = '';
  switchMode('lib');
  veCayThuMuc();
  renderTracks(getFiltered());
  toast2('Nhạc quanh ' + t.bpm + ' BPM · bấm lại để bỏ lọc');
}

function veMotHang(t) {
  var d = document.createElement('div');
  d.className = 'track-row' + (idDangPhat === t.id ? ' playing' : '');
  d.id = 'row-' + t.id;
  d.innerHTML =
    '<div class="tr-play" onclick="togglePlay(' + t.id + ')">' +
      '<button class="play-btn">' + (idDangPhat === t.id
        ? '<svg viewBox="0 0 24 24" style="width:8px;height:8px;fill:#fff;stroke:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg viewBox="0 0 24 24" style="width:8px;height:8px;fill:#fff;stroke:none"><polygon points="5 3 19 12 5 21 5 3"/></svg>') +
      '</button></div>' +
    '<div class="tr-meta">' +
      '<div class="tr-name" title="' + t.duongDan + '">' + t.name + '</div>' +
      '<div class="tr-tags">' + t.tags.map(function (g) { return '<span class="tr-tag">' + g + '</span>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="tr-wave" id="wave-' + t.id + '" onclick="seekWave(this,event)"></div>' +
    '<div class="tr-stats">' + badgeHtml(t) +
      '<span class="sp sp-dur">' + t.dur + '</span>' +
    '</div>' +
    '<div class="tr-acts">' +
      '<button class="act-btn act-ins" onclick="insertT(\'\',' + t.id + ')" title="Chèn vào Timeline">' +
        '<svg class="ic" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
      '</button>' +
    '</div>';
  return d;
}

/** Ve vach song. Co du lieu that thi ve that, chua co thi ve dai mo. */
function veSongAm(id, duLieu) {
  var w = document.getElementById('wave-' + id);
  if (!w) return;
  w.innerHTML = '';
  var n = 80;
  for (var i = 0; i < n; i++) {
    var b = document.createElement('div');
    b.className = 'w-bar';
    var cao;
    if (duLieu && duLieu.length) {
      cao = Math.max(8, Math.round(duLieu[Math.floor(i / n * duLieu.length)] * 92));
    } else {
      cao = 14;                       // dai mo — chua doc song am that
      b.classList.add('cho');
    }
    b.style.height = cao + '%';
    w.appendChild(b);
  }
}

/* ══ SONG AM THAT cho hang dang xem
   ☠️ KHONG doc ca 10.673 bai (moi bai mot lan goi ffmpeg = treo may). Chi doc
   cho hang vua ve ra man hinh, xep hang 3 cai mot, va NHO ra dia de lan sau
   khoi doc lai. Anh Tien: song am vach mo khong giup chon duoc bai. */
var hangDoiSong = [];
var dangDoSong = 0;
var SONG_SONG_SONG = 3;

function xepHangSongAm(t) {
  if (!t || t.song || t._dangCho) return;
  t._dangCho = true;
  hangDoiSong.push(t);
  chayHangSong();
}

function chayHangSong() {
  while (dangDoSong < SONG_SONG_SONG && hangDoiSong.length) {
    var t = hangDoiSong.shift();
    dangDoSong++;
    (function (bai) {
      docSongAmCoDem(bai.duongDan, 80).then(function (s) {
        bai._dangCho = false;
        if (s) { bai.song = s; veSongAm(bai.id, s); }
      }).catch(function () { bai._dangCho = false; })
        .then(function () { dangDoSong--; chayHangSong(); });
    })(t);
  }
}

function veThem() {
  var c = document.getElementById('track-list');
  if (!c) return;
  var het = Math.min(daVe + LO_VE, dsHienTai.length);
  var manh = document.createDocumentFragment();
  for (var i = daVe; i < het; i++) manh.appendChild(veMotHang(dsHienTai[i]));
  c.appendChild(manh);
  for (var j = daVe; j < het; j++) {
    veSongAm(dsHienTai[j].id, dsHienTai[j].song);
    xepHangSongAm(dsHienTai[j]);
  }
  daVe = het;

  var con = document.getElementById('con-lai');
  if (con) con.remove();
  if (daVe < dsHienTai.length) {
    var d = document.createElement('div');
    d.id = 'con-lai';
    d.className = 'con-lai';
    d.innerText = 'Còn ' + (dsHienTai.length - daVe).toLocaleString('vi') + ' bài — cuộn xuống để xem thêm';
    c.appendChild(d);
  }
}

/** DE LEN renderTracks cua index.html — ban cu ve het mot luc, 10.673 hang la treo. */
function renderTracks(list) {
  var c = document.getElementById('track-list');
  if (!c) return;
  dsHienTai = list || [];
  daVe = 0;
  c.innerHTML = '';
  c.scrollTop = 0;   // doi bo loc ma giu cho cuon cu -> mo ra thay giua danh sach

  var dem = document.getElementById('view-ct');
  if (dem) dem.innerText = dsHienTai.length.toLocaleString('vi') + ' bài';
  veDaiLoc();

  if (!dsHienTai.length) {
    c.innerHTML = '<div class="empty-state">' +
      '<svg class="ic" style="width:30px;height:30px" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
      '<div class="empty-title">' + (KHO.thuMuc.length ? 'Không tìm thấy bài nào' : 'Chưa có thư mục nhạc') + '</div>' +
      '<div class="empty-desc">' + (KHO.thuMuc.length
        ? 'Thử đổi từ khoá tìm kiếm hoặc chọn danh mục khác.'
        : 'Bấm nút bánh răng ở trên rồi chọn <b>Import thư mục nhạc</b>.') + '</div></div>';
    return;
  }
  veThem();
}

/** Cuon gan het thi ve them. */
function ganCuon() {
  var c = document.getElementById('track-list');
  if (!c || c._daGan) return;
  c._daGan = true;
  c.addEventListener('scroll', function () {
    if (daVe >= dsHienTai.length) return;
    if (c.scrollTop + c.clientHeight >= c.scrollHeight - 400) veThem();
  });
}

/* ══════════════════════════════════════════
   CAY THU MUC — cach duyet CHINH
   ☠️ Thay cho danh muc bia (Cinematic/Lo-Fi/...). Anh Tien 08/08:
   *"nhu nay sao anh chon duoc em"*. Doan the loai tu ten file cho ra
   "Background Music 0 / Sound Effects 0" trong khi co 10.673 bai — vua sai
   vua vo dung. Nguoi dung DA sap xep kho theo thu muc roi, cu dung cai do.
══════════════════════════════════════════ */
var thuMucChon = '';     // '' = tat ca
var cayMo = {};          // nhanh nao dang mo

function tachNhanh(t) {
  // Duong dan tuong doi so voi thu muc goc da them
  for (var i = 0; i < KHO.thuMuc.length; i++) {
    var goc = KHO.thuMuc[i].duongDan.replace(/[\\/]+$/, '');
    var d = t.duongDan.replace(/\\/g, '/');
    var g = goc.replace(/\\/g, '/');
    if (d.indexOf(g + '/') === 0) {
      var con = d.slice(g.length + 1);
      var phan = con.split('/');
      phan.pop();                      // bo ten file
      return phan;
    }
  }
  return [];
}

function dungCay() {
  var cay = { con: {}, dem: 0 };
  for (var i = 0; i < TRACKS.length; i++) {
    var t = TRACKS[i];
    t._nhanh = t._nhanh || tachNhanh(t).slice(0, 2);   // sau 2 tang la du
    var nut = cay;
    nut.dem++;
    var duong = '';
    for (var j = 0; j < t._nhanh.length; j++) {
      var ten = t._nhanh[j];
      duong = duong ? duong + '/' + ten : ten;
      if (!nut.con[ten]) nut.con[ten] = { con: {}, dem: 0, duong: duong };
      nut = nut.con[ten];
      nut.dem++;
    }
  }
  return cay;
}

function veCayThuMuc() {
  var box = document.getElementById('cay-thu-muc');
  if (!box) return;
  box.innerHTML = '';

  var cay = dungCay();

  function mucHtml(ten, dem, duong, tang, coCon) {
    var d = document.createElement('div');
    d.className = 'sb-item' + (thuMucChon === duong ? ' active' : '');
    d.style.paddingLeft = (7 + tang * 11) + 'px';
    var mui = coCon
      ? '<span class="sb-mui' + (cayMo[duong] ? ' mo' : '') + '">▸</span>'
      : '<span class="sb-mui trong"></span>';
    d.innerHTML = mui +
      '<svg class="ic" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' +
      '<span class="sb-ten" title="' + ten + '">' + ten + '</span>' +
      '<span class="sb-badge">' + dem.toLocaleString('vi') + '</span>';
    d.onclick = function (e) {
      var muiEl = d.querySelector('.sb-mui');
      if (coCon && e.target === muiEl) {           // bam mui ten = dong/mo nhanh
        cayMo[duong] = !cayMo[duong];
        veCayThuMuc();
        return;
      }
      thuMucChon = duong;
      if (coCon) cayMo[duong] = true;
      veCayThuMuc();
      filterTracks();
    };
    return d;
  }

  // "Tat ca"
  var tatCa = document.createElement('div');
  tatCa.className = 'sb-item' + (thuMucChon === '' ? ' active' : '');
  tatCa.innerHTML =
    '<span class="sb-mui trong"></span>' +
    '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
    '<span class="sb-ten">Tất cả</span>' +
    '<span class="sb-badge">' + TRACKS.length.toLocaleString('vi') + '</span>';
  tatCa.onclick = function () { thuMucChon = ''; veCayThuMuc(); filterTracks(); };

  var nhan = document.createElement('div');
  nhan.className = 'sb-lbl';
  nhan.innerText = 'Thư mục';
  var boc = document.createElement('div');
  boc.className = 'sb-section';
  boc.appendChild(nhan);
  boc.appendChild(tatCa);

  function veNhanh(nut, tang) {
    var tenCon = Object.keys(nut.con).sort(function (a, b) { return a.localeCompare(b, 'vi'); });
    tenCon.forEach(function (ten) {
      var c = nut.con[ten];
      var coCon = Object.keys(c.con).length > 0;
      boc.appendChild(mucHtml(ten, c.dem, c.duong, tang, coCon));
      if (coCon && cayMo[c.duong]) veNhanh(c, tang + 1);
    });
  }
  veNhanh(cay, 0);
  box.appendChild(boc);
}

/** Giu ten cu de code khac goi khong vo — nay tro thanh ve lai cay. */
function capNhatDemDanhMuc() { veCayThuMuc(); }

/** DE LEN getFiltered cua index.html — loc theo THU MUC thay vi danh muc bia. */
var locBPMGoc = 0;    // > 0 = dang loc quanh mot nhip
var locKeyGoc = '';   // != '' = dang loc theo tong

function boLocBPM() {
  locBPMGoc = 0;
  renderTracks(getFiltered());
}

/** Dai bao dang loc + nut bo — de nguoi dung khong bi ket trong bo loc. */
function veDaiLoc() {
  var cu = document.getElementById('dai-loc');
  if (cu) cu.remove();
  if (!locBPMGoc && !locKeyGoc) return;

  var c = document.getElementById('track-list');
  if (!c || !c.parentNode) return;

  var chu, boHam;
  if (locKeyGoc) {
    chu = 'Hợp tông với <b>' + locKeyGoc + '</b> <span class="dai-loc-vi">(' + keyVi(locKeyGoc) + ')</span>';
    boHam = 'boLocKey()';
  } else {
    chu = 'Quanh nhịp <b>' + locBPMGoc + ' BPM</b>';
    boHam = 'boLocBPM()';
  }

  var d = document.createElement('div');
  d.id = 'dai-loc';
  d.className = 'dai-loc';
  d.innerHTML = '<span>' + chu + ' · ' + dsHienTai.length.toLocaleString('vi') + ' bài</span>' +
                '<button class="dai-loc-bo" onclick="' + boHam + '">Bỏ lọc ×</button>';
  c.parentNode.insertBefore(d, c);
}

function getFiltered() {
  var q = (document.getElementById('inp-srch') || {}).value || '';
  q = q.toLowerCase().trim();

  var ra = TRACKS.filter(function (t) {
    if (locKeyGoc) {
      if (!t.key) return false;
      if (quanHeKey(locKeyGoc, t.key).muc > 3) return false;
    }
    if (locBPMGoc) {
      if (!t.bpm) return false;
      var r = t.bpm / locBPMGoc;
      // Cung nhip = lech duoi 6%, hoac gap doi / mot nua (van dem khop duoc)
      if (!(Math.abs(r - 1) < 0.06 || Math.abs(r - 2) < 0.1 || Math.abs(r - 0.5) < 0.05)) return false;
    }
    if (thuMucChon) {
      var nh = (t._nhanh || tachNhanh(t)).join('/');
      if (nh !== thuMucChon && nh.indexOf(thuMucChon + '/') !== 0) return false;
    }
    if (!q) return true;
    return (t.name + ' ' + t.tags.join(' ') + ' ' + t.key + ' ' + t.bpm).toLowerCase().indexOf(q) >= 0;
  });

  // Dang loc theo tong thi xep BAI HOP NHAT len dau — sap A-Z luc nay la vo dung,
  // nguoi dung dang can "cai nao nghe hop nhat", khong phai "cai nao dau bang chu".
  if (locKeyGoc) {
    // Gop ban trung (cung ten + cung do dai) — dang "goi y cho toi chon" thi hai
    // dong y het nhau chi to chiem cho. Do that: "Epic Documentary" hien 2 lan.
    var daCoK = {};
    ra = ra.filter(function (t) {
      var kh = t.name.toLowerCase() + '|' + Math.round(t.giay || 0);
      if (daCoK[kh]) return false;
      daCoK[kh] = 1;
      return true;
    });
    ra.sort(function (a, b) {
      var ma = quanHeKey(locKeyGoc, a.key).muc, mb = quanHeKey(locKeyGoc, b.key).muc;
      if (ma !== mb) return ma - mb;
      var na = (a.giay || 0) < 10 ? 1 : 0, nb = (b.giay || 0) < 10 ? 1 : 0;
      if (na !== nb) return na - nb;                       // clip 1 giay xuong cuoi
      return a.name.localeCompare(b.name, 'vi');
    });
    return ra;
  }

  if (currentSort === 'bpm-asc')       ra.sort(function (a, b) { return (a.bpm || 9999) - (b.bpm || 9999); });
  else if (currentSort === 'bpm-desc') ra.sort(function (a, b) { return (b.bpm || 0) - (a.bpm || 0); });
  else if (currentSort === 'key')      ra.sort(function (a, b) { return (a.key || 'zz').localeCompare(b.key || 'zz'); });
  else                                 ra.sort(function (a, b) { return a.name.localeCompare(b.name, 'vi'); });
  return ra;
}

/* ══════════════════════════════════════════
   THEM / BO THU MUC
══════════════════════════════════════════ */
function importFolder() {
  if (!coNode()) { toast2('Chỉ chạy được trong Premiere'); return; }
  var chon = null;
  try {
    chon = window.cep.fs.showOpenDialogEx(false, true, 'Chọn thư mục nhạc');
  } catch (e) {
    try { chon = window.cep.fs.showOpenDialog(false, true, 'Chọn thư mục nhạc', ''); }
    catch (e2) { toast2('Không mở được hộp thoại chọn thư mục'); return; }
  }
  if (!chon || !chon.data || !chon.data.length) return;   // nguoi dung bam Huy

  var duongDan = chon.data[0];
  for (var i = 0; i < KHO.thuMuc.length; i++) {
    if (KHO.thuMuc[i].duongDan === duongDan) { toast2('Thư mục này đã có rồi'); return; }
  }
  KHO.thuMuc.push({ duongDan: duongDan, soFile: 0 });
  luuKho();
  toast2('Đang quét thư mục...');
  setTimeout(quetLai, 50);
}

function xoaThuMuc(duongDan, ev) {
  if (ev) ev.stopPropagation();
  KHO.thuMuc = KHO.thuMuc.filter(function (t) { return t.duongDan !== duongDan; });
  luuKho();
  dungNgam = true;
  quetLai();
  toast2('Đã bỏ thư mục');
}

function veDanhSachThuMuc() {
  var l = document.getElementById('path-list');
  if (!l) return;
  l.innerHTML = '';
  if (!KHO.thuMuc.length) {
    l.innerHTML = '<div style="padding:10px;text-align:center;color:var(--t4);font-size:var(--fs-2xs)">Chưa có thư mục nào. Bấm nút bên dưới để thêm.</div>';
    return;
  }
  KHO.thuMuc.forEach(function (t) {
    var row = document.createElement('div');
    row.className = 'path-row';
    row.innerHTML =
      '<svg class="ic" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' +
      '<span class="path-name" title="' + t.duongDan + '">' + t.duongDan + '</span>' +
      '<span class="path-ct">' + (t.soFile || 0).toLocaleString('vi') + '</span>' +
      '<span class="path-del" title="Bỏ thư mục này">&times;</span>';
    row.querySelector('.path-del').onclick = function (e) { xoaThuMuc(t.duongDan, e); };
    l.appendChild(row);
  });
}

/* ══════════════════════════════════════════
   NGHE THU
══════════════════════════════════════════ */
var amThanh = null;
var idDangPhat = null;

function layAudio() {
  if (amThanh) return amThanh;
  amThanh = new Audio();
  amThanh.addEventListener('timeupdate', function () {
    if (!idDangPhat || !amThanh.duration) return;
    var w = document.getElementById('wave-' + idDangPhat);
    if (!w) return;
    var bars = w.querySelectorAll('.w-bar');
    var idx = Math.floor(amThanh.currentTime / amThanh.duration * bars.length);
    for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('played', i <= idx);
  });
  amThanh.addEventListener('ended', dungPhat);
  amThanh.addEventListener('error', function () { toast2('Không phát được file này'); dungPhat(); });
  return amThanh;
}

function dungPhat() {
  if (amThanh) { try { amThanh.pause(); } catch (e) {} }
  var cu = idDangPhat;
  idDangPhat = null; playingId = null;
  if (cu) {
    var row = document.getElementById('row-' + cu);
    if (row) {
      row.classList.remove('playing');
      var b = row.querySelector('.play-btn');
      if (b) b.innerHTML = '<svg viewBox="0 0 24 24" style="width:8px;height:8px;fill:#fff;stroke:none"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
  }
}

function togglePlay(id) {
  var t = TRACKS.find(function (x) { return x.id === id; });
  if (!t) return;
  if (idDangPhat === id) { dungPhat(); return; }
  dungPhat();

  if (!coNode() || !t.duongDan) { toast2('Chỉ nghe được trong Premiere'); return; }

  moMayChu().then(function (url) {
    if (!url) { toast2('Không mở được máy chủ phát nhạc'); return; }
    var a = layAudio();
    a.src = urlPhat(t.duongDan, t._canChuyen);
    return a.play().then(function () {
      idDangPhat = id; playingId = id;
      var row = document.getElementById('row-' + id);
      if (row) {
        row.classList.add('playing');
        var b = row.querySelector('.play-btn');
        if (b) b.innerHTML = '<svg viewBox="0 0 24 24" style="width:8px;height:8px;fill:#fff;stroke:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      }
      // Song am THAT — chi doc cho bai dang nghe (doc het 10.673 bai la treo)
      if (!t.song) {
        docSongAm(t.duongDan, 80).then(function (s) {
          if (!s) return;
          t.song = s;
          if (idDangPhat === id) veSongAm(id, s);
        });
      } else {
        veSongAm(id, t.song);
      }
    });
  }).catch(function () {
    // ☠️ Chromium tu choi file header hong (loi 4) du ffmpeg doc duoc.
    // Thu lai MOT LAN qua duong chuyen ma. Khong lap vo han.
    if (!t._canChuyen) {
      t._canChuyen = true;
      toast2('File này lạ định dạng — đang chuyển mã để nghe…');
      return togglePlay(id);
    }
    t._hong = true;
    danhDauHong(t);
    toast2('✗ Không phát được — file có thể đã hỏng');
  });
}

/** Danh dau hang la file hong, de nguoi dung biet ma bo qua / don kho. */
function danhDauHong(t) {
  var row = document.getElementById('row-' + t.id);
  if (!row) return;
  row.classList.add('hong');
  var ten = row.querySelector('.tr-name');
  if (ten && ten.innerText.indexOf('⚠') !== 0) ten.innerText = '⚠ ' + ten.innerText;
  row.title = 'File hỏng — không đọc được';
}

function seekWave(w, e) {
  var r = w.getBoundingClientRect();
  var pct = (e.clientX - r.left) / r.width;
  if (pct < 0) pct = 0; if (pct > 1) pct = 1;
  var bars = w.querySelectorAll('.w-bar');
  var idx = Math.floor(pct * bars.length);
  for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('played', i <= idx);
  var id = parseInt((w.id || '').replace('wave-', ''), 10);
  if (idDangPhat === id && amThanh && amThanh.duration) amThanh.currentTime = pct * amThanh.duration;
}

/* ══════════════════════════════════════════
   CHEN VAO TIMELINE
══════════════════════════════════════════ */
var trackDich = 1;   // 0=A1, 1=A2

function insertT(ten, id) {
  var t = null;
  if (id !== undefined) t = TRACKS.find(function (x) { return x.id === id; });
  if (!t && ten) t = TRACKS.find(function (x) { return x.name === ten; });
  if (!t) { toast2('Không tìm thấy bài này'); return; }
  if (!trongPremiere() || !t.duongDan) { toast2('Chỉ chèn được trong Premiere'); return; }

  var dp = String(t.duongDan).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  toast2('Đang chèn...');
  goiHost('mus_insertAudio("' + dp + '", ' + trackDich + ', ' + (t.giay || 0) + ')')
    .then(function (kq) {
      var r = tach(kq);
      toast2((r.ok ? '✓ ' : '✗ ') + r.dulieu);
    });
}

function pickTrack(el) {
  ddPick(el, 'dd-track-cur');
  var m = (el.innerText || '').match(/A(\d)/);
  trackDich = m ? (parseInt(m[1], 10) - 1) : 1;
  var badge = document.querySelector('.sb-item .sb-badge[style*="green"]');
  if (badge) badge.innerText = 'A' + (trackDich + 1);
  toast2('Track đích: ' + el.innerText);
}

/* ══════════════════════════════════════════
   PHAN TICH BPM / KEY — DO THEO YEU CAU
   Anh Tien chot 08/08: *"do theo yeu cau di em"*. Khong do ca kho 10.673 file
   (vua lau vua vo nghia — phan lon la sound effect).
══════════════════════════════════════════ */
function baiDangChon() {
  if (idDangPhat) {
    var t = TRACKS.find(function (x) { return x.id === idDangPhat; });
    if (t) return t;
  }
  return dsHienTai[0] || TRACKS[0] || null;
}

/* ☠️ NGUONG TIN CAY — chi nhan ket qua khi may DU CHAC.
   Do that 08/08 da thay may cham `city_traffic_3 -> Am 80%` trong khi nhac that
   "Get You The Moon" chi 47% — cong thuc tin cay Key dang cham nguoc. Dang co
   dot kiem dinh rieng de sua cong thuc; TRONG LUC DO dat nguong de it nhat
   khong do rac ra man hinh. Bo do nay se chinh lai theo ket qua kiem dinh. */
var NGUONG_KEY = 0.45;
var NGUONG_BPM = 0.25;

function apKetQuaPhanTich(t, kq) {
  // BPM chi co nghia voi bai du dai — tieng canh cua khong co nhip
  if (kq.bpm && laNhac(t) && (kq.tinCayBpm || 0) >= NGUONG_BPM) t.bpm = Math.round(kq.bpm);
  if (kq.key && (kq.tinCayKey || 0) >= NGUONG_KEY) t.key = kq.key;
  t.nguon = 'do-that';
  t.tinCayBpm = kq.tinCayBpm;
  t.tinCayKey = kq.tinCayKey;
  var row = document.getElementById('row-' + t.id);
  if (row) {
    var st = row.querySelector('.tr-stats');
    if (st) {
      var dur = st.querySelector('.sp-dur');
      st.innerHTML = badgeHtml(t) + (dur ? dur.outerHTML : '');
    }
  }
}

/* ══ TAB TIM KEY — cung khuon voi tab BPM ══ */
var nguonDoKey = 'kho';
var baiDoKey = null;
var keyDangCo = '';
var locHopHienTai = 'tatca';

function doiNguonDoKey(n) {
  nguonDoKey = n;
  var a = document.getElementById('dn-tab-kho-k'), b = document.getElementById('dn-tab-seq-k');
  if (a) a.classList.toggle('active', n === 'kho');
  if (b) b.classList.toggle('active', n === 'seq');
  capNhatNguonDoKey();
}

function capNhatNguonDoKey() {
  var ten = document.getElementById('dnk-ten');
  var phu = document.getElementById('dnk-phu');
  if (!ten) return;

  if (nguonDoKey === 'kho') {
    var t = idDangPhat ? TRACKS.find(function (x) { return x.id === idDangPhat; }) : null;
    if (!t) t = dsHienTai[0] || null;
    baiDoKey = t ? { duongDan: t.duongDan, name: t.name, giay: t.giay, track: t } : null;
    ten.innerText = t ? t.name : 'Chưa chọn bài nào';
    phu.innerText = t ? (t.dur + ' · ' + (t._nhanh || []).join(' / '))
                      : 'Bấm ▶ một bài ở tab Thư Viện để chọn';
    canhBaoNgan(t, document.getElementById('ks-canh'));
    return;
  }

  ten.innerText = 'Đang đọc clip trên timeline…';
  phu.innerText = '';
  baiDoKey = null;
  goiHost('mus_selectedClipPath()').then(function (kq) {
    var r = tach(kq);
    if (!r.ok) { ten.innerText = 'Chưa chọn clip nào'; phu.innerText = r.dulieu; return; }
    var p = r.dulieu.split('|');
    baiDoKey = { duongDan: p[0], name: p[2] || p[0].split(/[\\/]/).pop(), giay: parseFloat(p[1]) || 0 };
    ten.innerText = baiDoKey.name;
    phu.innerText = dinhDangPhut(baiDoKey.giay) + ' · clip trên timeline';
  });
}

/**
 * Ten tieng Viet cua giong — DE LEN bang tra cu trong index.html.
 * ☠️ Bang cu thieu gan het giong THU (Bbm, F#m, C#m... deu tra ve nguyen chuoi
 * goc) va dung dau GIANG (Db, Eb) trong khi bo do cua minh xuat dau THANG (C#,
 * D#) -> khong bao gio tra duoc. Nay sinh tu ten not nen phu het 24 giong.
 */
var TEN_NOT_VI = { C: 'Đô', D: 'Rê', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };

function keyVi(k) {
  if (!k) return '';
  var m = String(k).match(/^([A-G])([#b]?)(m?)$/);
  if (!m) return k;                       // Camelot (8A, 5B...) giu nguyen
  var goc = TEN_NOT_VI[m[1]];
  if (!goc) return k;
  var dau = m[2] === '#' ? ' thăng' : (m[2] === 'b' ? ' giáng' : '');
  return goc + dau + (m[3] === 'm' ? ' thứ' : ' trưởng');
}

/* ══ QUAN HE HOA AM
   Noi bang tieng Viet de hieu, khong dung "+1 tone / +2 tone" nhu ban cu —
   editor can biet "nghe co hop khong", khong can biet cach nhau may cung. */
var VONG5 = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

function tachKey(k) {
  if (!k) return null;
  var m = String(k).match(/^([A-G][#b]?)(m?)$/);
  if (!m) return null;
  var n = m[1].replace('Db', 'Db');
  return { not: n, thu: m[2] === 'm' };
}

function chiSoVong5(not) {
  var i = VONG5.indexOf(not);
  if (i >= 0) return i;
  var doi = { 'C#': 'Db', 'D#': 'Eb', 'G#': 'Ab', 'A#': 'Bb', 'Gb': 'F#', 'Cb': 'B' };
  return VONG5.indexOf(doi[not] !== undefined ? doi[not] : not);
}

/**
 * Quan he hoa am giua hai key. Tra ve {muc, ten} — muc 0 tot nhat, 3 = khong hop.
 * Dua tren vong quang 5 (Camelot wheel) — chuan ma DJ va nha soan nhac dung.
 */
function quanHeKey(a, b) {
  var A = tachKey(a), B = tachKey(b);
  if (!A || !B) return { muc: 4, ten: '' };
  if (A.not === B.not && A.thu === B.thu) return { muc: 0, ten: 'Cùng key' };

  var ia = chiSoVong5(A.not), ib = chiSoVong5(B.not);
  if (ia < 0 || ib < 0) return { muc: 4, ten: '' };

  // Song song: cung bo khoa (Am <-> C, Cm <-> Eb)
  // ☠️ Do that 08/08: ban dau em de NGUOC hai dieu kien nay -> Am → C bi cham
  // la "khong hop", trong khi day la cap hoa am co ban nhat. Tren vong quang 5,
  // giong thu nam SAU giong truong song song 3 buoc:
  //    truong -> thu song song : +3   (C[0] -> Am[3])
  //    thu    -> truong song song: +9  (Am[3] -> C[0], tuc -3)
  if (A.thu !== B.thu) {
    var lech = ((ib - ia) % 12 + 12) % 12;
    if ((A.thu && lech === 9) || (!A.thu && lech === 3)) return { muc: 1, ten: 'Song song' };
  }
  // Quang 5 len/xuong, cung dieu
  if (A.thu === B.thu) {
    var d = ((ib - ia) % 12 + 12) % 12;
    if (d === 1) return { muc: 2, ten: 'Quãng 5 lên' };
    if (d === 11) return { muc: 2, ten: 'Quãng 5 xuống' };
    if (d === 2 || d === 10) return { muc: 3, ten: 'Hơi xa' };
  }
  return { muc: 4, ten: '' };
}

/** Nut "Do Key". */
function analyzeKey() {
  if (!coNode()) { toast2('Chỉ đo được trong Premiere'); return; }
  if (nguonDoKey === 'kho') capNhatNguonDoKey();
  var t = baiDoKey;
  if (!t || !t.duongDan) { toast2('Chưa chọn bài nào để đo'); return; }

  var elKey = document.getElementById('ks-key-val');
  var elVi = document.getElementById('ks-mode');
  var elPct = document.getElementById('ks-conf-pct');
  var elFill = document.getElementById('ks-conf-fill');
  var elCanh = document.getElementById('ks-canh');
  var nut = document.getElementById('nut-do-key');

  if (elKey) { elKey.innerText = '…'; elKey.classList.add('trong'); }
  if (elVi) elVi.innerText = '';
  if (elPct) elPct.innerText = '—';
  if (elFill) elFill.style.width = '0%';
  if (elCanh) elCanh.innerText = '';
  if (nut) nut.disabled = true;

  var cu = layPhanTich(t.duongDan);
  var viec = cu ? Promise.resolve(cu) : phanTichNhac(t.duongDan, t.giay);

  viec.then(function (kq) {
    if (!cu) { luuPhanTich(t.duongDan, kq); luuDem(); }   // do le -> ghi dia ngay
    if (nut) nut.disabled = false;

    if (kq.loi || !kq.key) {
      if (elKey) { elKey.innerText = '—'; elKey.classList.add('trong'); }
      if (elCanh) elCanh.innerText = kq.loi || 'Không nghe ra cao độ rõ ràng trong tiếng này.';
      veNhacHop('');
      toast2('Không đo được key');
      return;
    }
    if (t.track) apKetQuaPhanTich(t.track, kq);

    var pct = Math.round((kq.tinCayKey || 0) * 100);
    keyDangCo = kq.key;
    if (elKey) { elKey.innerText = kq.key; elKey.classList.remove('trong'); }
    if (elVi) elVi.innerText = keyVi(kq.key);
    if (elPct) elPct.innerText = pct + '%';
    if (elFill) elFill.style.width = pct + '%';
    if (elCanh) {
      elCanh.innerText = pct < 50
        ? '⚠ Cao độ không rõ — thường gặp ở tiếng động, tiếng nền, hoặc nhạc gõ. Con số này chỉ nên tham khảo.'
        : '';
    }
    veNhacHop(kq.key);
    toast2('Key: ' + kq.key + ' (tin cậy ' + pct + '%)');
  });
}

function locHop(ch) {
  locHopHienTai = ch;
  ['tatca', 'chuan', 'nhip'].forEach(function (k) {
    var el = document.getElementById('loc-' + k);
    if (el) el.classList.toggle('active', k === ch);
  });
  veNhacHop(keyDangCo);
}

/**
 * Danh sach nhac HOP trong kho THAT.
 * ☠️ Ban cu chay tren 12 bai mau cua ban thiet ke — anh Tien nhin thay
 * "Epic Horizon Rising / Corporate Inspire" trong khi kho anh ay khong he co
 * bai nao ten vay. Nay lay tu TRACKS that va CHI lay bai da do duoc key.
 */
function veNhacHop(key) {
  var list = document.getElementById('hop-list');
  var tieu = document.getElementById('hop-tieu');
  if (!list) return;
  list.innerHTML = '';

  if (!key) {
    if (tieu) tieu.innerText = 'Nhạc hợp trong kho';
    list.innerHTML = '<div class="hop-trong">Bấm <b>Đo Key</b> ở trên để tìm nhạc hợp với bài này.</div>';
    return;
  }

  var goc = baiDoKey ? baiDoKey.duongDan : '';
  var bpmGoc = 0;
  if (baiDoKey && baiDoKey.track) bpmGoc = baiDoKey.track.bpm || 0;

  // ☠️ Loai CHINH BAI DANG DO. Khong the chi so duong dan: kho co ban sao cung
  // ten o thu muc khac, va do that da thay bai "_DRIP_TOO_HARD..." tu goi y
  // chinh no. So ca TEN cho chac.
  var tenGoc = (baiDoKey && baiDoKey.name ? baiDoKey.name : '').toLowerCase();

  var ds = [];
  for (var i = 0; i < TRACKS.length; i++) {
    var t = TRACKS[i];
    if (!t.key) continue;
    if (t.duongDan === goc) continue;
    if (tenGoc && t.name.toLowerCase() === tenGoc) continue;
    var qh = quanHeKey(key, t.key);
    if (qh.muc > 3) continue;
    if (locHopHienTai === 'chuan' && qh.muc > 1) continue;
    if (locHopHienTai === 'nhip') {
      if (!bpmGoc || !t.bpm) continue;
      // Hop nhip = lech duoi 8%, hoac gap doi / mot nua (van dem khop duoc)
      var r = t.bpm / bpmGoc;
      var hopNhip = Math.abs(r - 1) < 0.08 || Math.abs(r - 2) < 0.12 || Math.abs(r - 0.5) < 0.06;
      if (!hopNhip) continue;
    }
    ds.push({ t: t, qh: qh });
  }

  // ☠️ BO TRUNG — kho co nhieu ban sao cung ten o thu muc khac nhau
  // (do that: "Chalk_Alphabet_A" hien HAI LAN lien tiep trong goi y, nhin
  // nhu tool loi). Gom theo ten + thoi luong, giu ban dau tien.
  var daCo = {};
  ds = ds.filter(function (x) {
    var khoa = x.t.name.toLowerCase() + '|' + Math.round(x.t.giay || 0);
    if (daCo[khoa]) return false;
    daCo[khoa] = 1;
    return true;
  });

  // Uu tien bai o thu muc NHAC that. Do that: goi y "moscow_protest_2_c3_loop"
  // (loop trong kho SFX) cho mot bai trap — dung key nhung lac han the loai.
  function laKhoNhac(t) {
    return /General music|Deep music|Artlisst|Tonal Key|Sound BG|Cinematic Sound/i
      .test(t.duongDan) ? 0 : 1;
  }

  // Clip qua ngan (< 10s) khong phai "nhac hop" — day xuong cuoi.
  // Do that 09/08: "Vibes A" dai 0:01 duoc goi y lam nhac nen, vo ly.
  function quaNgan(t) { return (t.giay || 0) < 10 ? 1 : 0; }

  ds.sort(function (a, b) {
    var na = quaNgan(a.t), nb = quaNgan(b.t);
    if (na !== nb) return na - nb;                                    // du dai truoc
    if (a.qh.muc !== b.qh.muc) return a.qh.muc - b.qh.muc;           // hop hon truoc
    var ka = laKhoNhac(a.t), kb = laKhoNhac(b.t);
    if (ka !== kb) return ka - kb;                                    // nhac truoc SFX
    if (bpmGoc && a.t.bpm && b.t.bpm) {
      return Math.abs(a.t.bpm - bpmGoc) - Math.abs(b.t.bpm - bpmGoc); // gan nhip hon truoc
    }
    return a.t.name.localeCompare(b.t.name, 'vi');
  });

  if (tieu) tieu.innerText = 'Nhạc hợp với ' + key + ' · ' + ds.length.toLocaleString('vi') + ' bài';

  if (!ds.length) {
    var soDaDo = TRACKS.filter(function (t) { return t.key; }).length;
    list.innerHTML = '<div class="hop-trong">' +
      (soDaDo
        ? 'Không có bài nào hợp với <b>' + key + '</b> theo bộ lọc này.<br>Thử bấm “Tất cả”.'
        : 'Kho chưa đo key bài nào. Panel đang đo dần ở nền — đợi một lát rồi thử lại.') +
      '</div>';
    return;
  }

  var manh = document.createDocumentFragment();
  ds.slice(0, 60).forEach(function (x) {
    var t = x.t, qh = x.qh;
    var d = document.createElement('div');
    d.className = 'hop-hang';
    var phu = [];
    if (t.bpm) phu.push(t.bpm + ' BPM' + (bpmGoc ? ' (gốc ' + bpmGoc + ')' : ''));
    phu.push(t.dur);
    if (t._nhanh && t._nhanh.length) phu.push(t._nhanh.join(' / '));
    d.innerHTML =
      '<div class="hop-key q' + qh.muc + '">' + t.key + '</div>' +
      '<div class="hop-tt">' +
        '<div class="hop-ten" title="' + t.duongDan + '">' + t.name + '</div>' +
        '<div class="hop-phu">' + phu.join(' · ') + '</div>' +
      '</div>' +
      '<span class="hop-quan q' + qh.muc + '">' + qh.ten + '</span>' +
      '<button class="hop-nut-tron hop-nghe" title="Nghe thử">' +
        '<svg class="ic" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>' +
      '<button class="hop-nut-tron hop-chen" title="Chèn vào timeline">' +
        '<svg class="ic" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>';
    d.querySelector('.hop-nghe').onclick = function (e) { e.stopPropagation(); togglePlay(t.id); };
    d.querySelector('.hop-chen').onclick = function (e) { e.stopPropagation(); insertT('', t.id); };
    manh.appendChild(d);
  });
  list.appendChild(manh);
}

/* ══ TAB TIM BPM — ban gon (anh Tien chot 08/08)
   Chon nguon (thu vien / clip tren timeline) -> bam Do -> ra so that. Het. */
var nguonDo = 'kho';        // 'kho' | 'seq'
var baiDo = null;           // {duongDan, name, giay}

function doiNguonDo(n) {
  nguonDo = n;
  var a = document.getElementById('dn-tab-kho'), b = document.getElementById('dn-tab-seq');
  if (a) a.classList.toggle('active', n === 'kho');
  if (b) b.classList.toggle('active', n === 'seq');
  capNhatNguonDo();
}

/** Cap nhat dong "dang chon bai nao" theo nguon. */
function capNhatNguonDo() {
  var ten = document.getElementById('dn-ten');
  var phu = document.getElementById('dn-phu');
  if (!ten) return;

  if (nguonDo === 'kho') {
    var t = idDangPhat ? TRACKS.find(function (x) { return x.id === idDangPhat; }) : null;
    if (!t) t = dsHienTai[0] || null;
    baiDo = t ? { duongDan: t.duongDan, name: t.name, giay: t.giay, track: t } : null;
    ten.innerText = t ? t.name : 'Chưa chọn bài nào';
    phu.innerText = t
      ? (t.dur + ' · ' + (t._nhanh || []).join(' / '))
      : 'Bấm ▶ một bài ở tab Thư Viện để chọn';
    canhBaoNgan(t, document.getElementById('dk-canh'));
    return;
  }

  // Nguon = clip dang chon tren timeline
  ten.innerText = 'Đang đọc clip trên timeline…';
  phu.innerText = '';
  baiDo = null;
  goiHost('mus_selectedClipPath()').then(function (kq) {
    var r = tach(kq);
    if (!r.ok) {
      ten.innerText = 'Chưa chọn clip nào';
      phu.innerText = r.dulieu;
      return;
    }
    var p = r.dulieu.split('|');
    baiDo = { duongDan: p[0], name: p[2] || p[0].split(/[\\/]/).pop(), giay: parseFloat(p[1]) || 0 };
    ten.innerText = baiDo.name;
    phu.innerText = dinhDangPhut(baiDo.giay) + ' · clip trên timeline';
  });
}

/** Nut "Do BPM" — DE LEN ban gia. */
function analyzeBPM() {
  if (!coNode()) { toast2('Chỉ đo được trong Premiere'); return; }
  if (nguonDo === 'kho') capNhatNguonDo();
  var t = baiDo;
  if (!t || !t.duongDan) { toast2('Chưa chọn bài nào để đo'); return; }

  var elSo = document.getElementById('bpm-val');
  var elPct = document.getElementById('dk-tc-pct');
  var elThanh = document.getElementById('dk-tc-thanh');
  var elCanh = document.getElementById('dk-canh');
  var nut = document.getElementById('nut-do-bpm');

  if (elSo) { elSo.innerText = '…'; elSo.classList.add('trong'); }
  if (elPct) elPct.innerText = '—';
  if (elThanh) elThanh.style.width = '0%';
  if (elCanh) elCanh.innerText = '';
  if (nut) nut.disabled = true;

  var cu = layPhanTich(t.duongDan);
  var viec = cu ? Promise.resolve(cu) : phanTichNhac(t.duongDan, t.giay);

  viec.then(function (kq) {
    if (!cu) { luuPhanTich(t.duongDan, kq); luuDem(); }   // do le -> ghi dia ngay
    if (nut) nut.disabled = false;

    if (kq.loi || !kq.bpm) {
      if (elSo) { elSo.innerText = '—'; elSo.classList.add('trong'); }
      if (elCanh) elCanh.innerText = kq.loi || 'Không tìm thấy nhịp rõ ràng trong tiếng này.';
      toast2('Không đo được BPM');
      return;
    }
    if (t.track) apKetQuaPhanTich(t.track, kq);

    var pct = Math.round((kq.tinCayBpm || 0) * 100);
    if (elSo) { elSo.innerText = Math.round(kq.bpm); elSo.classList.remove('trong'); }
    if (elPct) elPct.innerText = pct + '%';
    if (elThanh) elThanh.style.width = pct + '%';
    // ☠️ Noi that khi may khong chac — dung de nguoi dung tuong so nao cung chac
    if (elCanh) {
      elCanh.innerText = pct < 50
        ? '⚠ Nhịp không rõ — con số này chỉ nên tham khảo. Thường gặp ở nhạc không có trống, tiếng nền, hoặc sound effect.'
        : '';
    }
    toast2('BPM: ' + Math.round(kq.bpm) + ' (tin cậy ' + pct + '%)');
  });
}

/* ══════════════════════════════════════════
   DO TU DONG CHAY NGAM cho bai DU DAI
   ☠️ Anh Tien: *"cho nay khong co thong tin ne em, toc do va keynote dau?"*.
   Cot BPM/Key de trong nhin nhu hong. Nhung do het 10.673 file cung sai:
   phan lon kho la SOUND EFFECT (Alarm 0:05, Ambience 0:19) — BPM/Key VO NGHIA
   voi tieng chuong bao, tieng gio.
   => Chi do tu dong cho bai **du dai de la nhac** (>= 30 giay). Bai ngan hon
   khong hien badge trong ma hien dau "·" mo, y la "khong ap dung".
══════════════════════════════════════════ */
var GIAY_COI_LA_NHAC = 30;   // du dai de BPM co nghia
var GIAY_DO_KEY = 2;         // du dai de nghe ra cao do
var dungDoNgam = false;
var doNgamChay = false;

function laNhac(t) { return t.giay >= GIAY_COI_LA_NHAC; }

/**
 * ☠️ Do KEY cho ca file NGAN (>= 2 giay), khong chi nhac.
 * Anh Tien 09/08: *"can thi cu tao file render cache de luu lai"* — tuc la
 * chap nhan cho tool lam nang mot lan roi nho lai. Va anh muon bam key ra
 * *"cac bai nhac VA SOUND tuong ung"* — ma sound thi phan lon duoi 30 giay
 * (tieng chuong, hit, riser deu co cao do that va rat hay dung cung tong).
 * BPM thi van chi tinh cho bai >= 30 giay: tieng canh cua khong co nhip.
 */
function coTheDoKey(t) { return t.giay >= GIAY_DO_KEY; }

function doTuDong() {
  if (doNgamChay || !coNode()) return;
  var canDo = TRACKS.filter(function (t) {
    return coTheDoKey(t) && !t.daDo && !layPhanTich(t.duongDan);
  });

  // Bai da co san ket qua trong bo nho dem -> ap vao ngay, khoi do lai
  TRACKS.forEach(function (t) {
    if (t.daDo) return;
    var cu = layPhanTich(t.duongDan);
    if (cu) { apKetQuaPhanTich(t, cu); t.daDo = true; }
  });

  if (!canDo.length) { capNhatTienTrinhDo(0, 0); return; }

  doNgamChay = true;
  dungDoNgam = false;
  var xong = 0, tong = canDo.length, viTri = 0, luuMoi = 0;
  capNhatTienTrinhDo(0, tong);

  function tiep() {
    if (dungDoNgam || viTri >= canDo.length) return Promise.resolve();
    var t = canDo[viTri++];
    return phanTichNhac(t.duongDan, t.giay).then(function (kq) {
      luuPhanTich(t.duongDan, kq);
      apKetQuaPhanTich(t, kq);
      t.daDo = true;
      xong++;
      if (xong % 10 === 0 || xong === tong) capNhatTienTrinhDo(xong, tong);
      if (++luuMoi >= 50) { luuMoi = 0; luuDem(); }
      return tiep();
    }).catch(function () { xong++; t.daDo = true; return tiep(); });
  }

  var chay = [];
  for (var i = 0; i < 4; i++) chay.push(tiep());   // 4 song song: FFT an CPU
  return Promise.all(chay).then(function () {
    doNgamChay = false;
    luuDem();
    capNhatTienTrinhDo(tong, tong);
    var n = TRACKS.filter(function (t) { return t.bpm > 0; }).length;
    toast2('Đo xong ' + tong.toLocaleString('vi') + ' bài · ' + n.toLocaleString('vi') + ' bài có BPM');
  });
}

function capNhatTienTrinhDo(xong, tong) {
  var el = document.getElementById('tien-trinh');
  var thanh = document.getElementById('tien-trinh-thanh');
  var chu = document.getElementById('tien-trinh-chu');
  if (!el) return;
  if (!tong || xong >= tong) { el.classList.remove('hien'); return; }
  el.classList.add('hien');
  if (thanh) thanh.style.width = Math.round(xong / tong * 100) + '%';
  if (chu) chu.innerText = 'Đang đo BPM/Key ' + xong.toLocaleString('vi') + '/' + tong.toLocaleString('vi');
}

/** DE LEN switchMode — doi tab thi cap nhat luon "dang chon bai nao". */
function switchMode(m) {
  document.querySelectorAll('.tb-tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.mode-pane').forEach(function (p) { p.classList.remove('active'); });
  var tab = document.getElementById('tab-' + m); if (tab) tab.classList.add('active');
  var pane = document.getElementById('mode-' + m); if (pane) pane.classList.add('active');

  // Thanh tim kiem + sap xep + dem bai chi thuoc ve tab Thu Vien.
  // De no o tab Do BPM/Key la rac: go vao khong anh huong gi den viec dang lam.
  var tb = document.querySelector('.toolbar');
  if (tb) tb.style.display = (m === 'lib') ? '' : 'none';

  if (m === 'bpm') capNhatNguonDo();
  if (m === 'key') { capNhatNguonDoKey(); veNhacHop(keyDangCo); }
}

/** Bai qua ngan thi bao truoc, dung de nguoi dung bam roi nhan con so vo nghia. */
function canhBaoNgan(t, elCanh) {
  if (!elCanh) return false;
  if (t && t.giay && t.giay < GIAY_COI_LA_NHAC) {
    elCanh.innerText = '⚠ Bài này chỉ ' + dinhDangPhut(t.giay) +
      ' — thường là sound effect. BPM/Key hầu như không có ý nghĩa với tiếng động ngắn.';
    return true;
  }
  elCanh.innerText = '';
  return false;
}

/* ══════════════════════════════════════════
   KHOI DONG
══════════════════════════════════════════ */
function khoiDongThat() {
  ganCuon();
  if (!coNode()) { TRACKS = []; renderTracks([]); veDanhSachThuMuc(); return; }
  napKho();
  napDem();
  veDanhSachThuMuc();
  moMayChu();
  if (KHO.thuMuc.length) quetLai();
  else { TRACKS = []; renderTracks([]); capNhatDemDanhMuc(); }
}

window.addEventListener('DOMContentLoaded', khoiDongThat);
