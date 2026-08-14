/**
 * nen.js — phan CHAY NGAM cua AiO Music: quet thu muc, doc metadata, phat nhac.
 *
 * Phong theo `AiO Asset Manager/client/src/services/` (scanner + probe +
 * mediaServer) nhung viet lai bang JS thuan de KHONG can buoc build —
 * cung khuon voi AiO Auto Guiline Frame.
 *
 * ☠️ BPM va KEY KHONG do bang DSP. Do THANG TU TAG ID3 cua file bang ffprobe.
 * Da do that 08/08: ffprobe `-show_format` tra ve nguyen ca cum tags
 *   { "TBPM": "128", "TKEY": "Cm", "genre": "Upbeat", "title": "..." }
 * Nhac thuong mai (Epidemic Sound, Artlist, Musicbed, Envato) deu nhung san.
 * Duong lui khi file khong co tag: doc tu TEN FILE (vd "Track_128BPM_Cm.mp3").
 * Nho vay: khong can thu vien phan tich am thanh nao -> khong dinh giay phep
 * AGPL/GPL (essentia la AGPL, aubio la GPL — dung duoc la phai mo ma nguon).
 */

/* ══════════════════════════════════════════
   DUONG DAN FFMPEG / FFPROBE
══════════════════════════════════════════ */
function timBin(ten) {
  var path = getPath(), fs = getFs();
  if (!path || !fs) return '';
  var ext = duongDanExt();
  if (!ext) return '';
  var ungVien = [
    path.join(ext, 'bin', 'win64', ten + '.exe'),
    path.join(ext, 'bin', ten + '.exe'),
    // Dung chung bin cua Asset Manager khi Music chua co ban rieng —
    // ca bo ban chung mot goi nen chac chan co.
    path.join(ext, '..', 'com.aiostudio.assetmanager', 'bin', 'win64', ten + '.exe')
  ];
  for (var i = 0; i < ungVien.length; i++) {
    try { if (fs.existsSync(ungVien[i])) return ungVien[i]; } catch (e) {}
  }
  return '';
}

function duongDanFFprobe() { return timBin('ffprobe'); }
function duongDanFFmpeg()  { return timBin('ffmpeg'); }

/** Chay mot lenh, tra ve Promise<{stdout, loi}> — stdout la CHUOI. */
function chayLenh(file, thamSo) {
  return new Promise(function (resolve) {
    var cp = getCP();
    if (!cp) { resolve({ stdout: '', loi: 'Khong dung duoc Node' }); return; }
    try {
      cp.execFile(file, thamSo, { maxBuffer: 8 * 1024 * 1024, windowsHide: true },
        function (err, stdout) {
          resolve({ stdout: String(stdout || ''), loi: err ? String(err.message) : '' });
        });
    } catch (e) {
      resolve({ stdout: '', loi: String(e) });
    }
  });
}

/**
 * Chay lenh lay dau ra NHI PHAN (Buffer).
 *
 * ☠️ DO THAT 08/08 — bay da vap: dung `chayLenh` (chuoi) de doc PCM thi Node
 * giai ma byte theo UTF-8, moi byte hong thanh ky tu thay the U+FFFD (65533).
 * Song am tinh ra bien do 510.98 thay vi 0-1, va UI ve ra MOT KHOI DAC ma
 * nhin qua van tuong la "co song am". Phai doc Buffer, khong doc chuoi.
 */
function chayLenhNhiPhan(file, thamSo) {
  return new Promise(function (resolve) {
    var cp = getCP();
    if (!cp) { resolve(null); return; }
    try {
      cp.execFile(file, thamSo,
        { maxBuffer: 64 * 1024 * 1024, windowsHide: true, encoding: 'buffer' },
        function (err, stdout) { resolve(err && !stdout ? null : stdout); });
    } catch (e) {
      resolve(null);
    }
  });
}

/* ══════════════════════════════════════════
   QUET THU MUC
══════════════════════════════════════════ */
var DUOI_AUDIO = ['mp3','wav','m4a','aac','flac','ogg','aif','aiff','wma','opus'];

function laAudio(ten) {
  var i = ten.lastIndexOf('.');
  if (i < 0) return false;
  return DUOI_AUDIO.indexOf(ten.slice(i + 1).toLowerCase()) >= 0;
}

/**
 * Quet de quy mot thu muc, tra ve mang duong dan file audio.
 * @param sauNhat gioi han do sau de khong treo o thu muc long qua nhieu tang
 */
function quetThuMuc(goc, sauNhat) {
  var fs = getFs(), path = getPath();
  if (!fs || !path) return [];
  if (sauNhat === undefined) sauNhat = 8;

  var ketQua = [];
  function di(thuMuc, sau) {
    if (sau > sauNhat) return;
    var muc;
    try { muc = fs.readdirSync(thuMuc, { withFileTypes: true }); } catch (e) { return; }
    for (var i = 0; i < muc.length; i++) {
      var m = muc[i];
      var ten = m.name;
      if (ten.charAt(0) === '.') continue;            // file an
      if (ten === '__MACOSX' || ten === 'node_modules') continue;
      var day = path.join(thuMuc, ten);
      try {
        if (m.isDirectory()) { di(day, sau + 1); }
        else if (laAudio(ten)) { ketQua.push(day); }
      } catch (e) {}
    }
  }
  di(goc, 0);
  return ketQua;
}

/* ══════════════════════════════════════════
   DOC METADATA — BPM / KEY / THOI LUONG
══════════════════════════════════════════ */

/** Chuan hoa ten key: "Cmin"/"C minor"/"Cm" -> "Cm"; "C major"/"Cmaj" -> "C". */
function chuanHoaKey(raw) {
  if (!raw) return '';
  var s = String(raw).trim();
  // Camelot (8A, 5B...) — giu nguyen, dan dung DJ quen doc
  if (/^\d{1,2}[AB]$/i.test(s)) return s.toUpperCase();
  var m = s.match(/^([A-Ga-g])\s*([#b♯♭]?)\s*(.*)$/);
  if (!m) return s;
  var nốt = m[1].toUpperCase();
  var dau = m[2].replace('♯', '#').replace('♭', 'b');
  var con = (m[3] || '').toLowerCase().replace(/[\s._-]/g, '');
  var thu = (con.indexOf('min') === 0 || con === 'm');
  return nốt + dau + (thu ? 'm' : '');
}

/** Doc BPM/Key tu TEN FILE khi file khong co tag. */
function doanTuTenFile(ten) {
  var kq = { bpm: 0, key: '' };
  // BPM: "128bpm", "128_BPM", "bpm-128"... — cho phep ca dau _ . - o giua
  var b = ten.match(/(\d{2,3})[\s._-]*bpm/i) || ten.match(/bpm[\s._-]*(\d{2,3})/i);
  // Khong co chu "bpm" thi van nhan SO TRAN nam gon giua hai dau ngan, mien la
  // roi vao dai nhip nghe duoc (nguoi lam nhac hay dat "Deep_House_124_Bb").
  // \d{2,3} co dau ngan hai ben nen "2024" khong lot (4 chu so), va gioi han
  // 60-200 loai not nam ("_2019_") lan so thu tu ("_01_").
  if (!b) {
    var m2 = ten.match(/[\s._-](\d{2,3})[\s._-]/);
    if (m2) { var v2 = parseInt(m2[1], 10); if (v2 >= 60 && v2 <= 200) b = m2; }
  }
  if (b) { var v = parseInt(b[1], 10); if (v >= 40 && v <= 300) kq.bpm = v; }
  /* Key trong ten file: "_Cm_", "-F#m-", "_Amin_", "_Bb_".
     ☠️ BAT BUOC phai co DAU HOA (#/b) hoac DUOI DIEU (m/min/maj).
     Do that 09/08: ban cu nhan ca chu cai DON, nen bat nham hang loat:
       "Chalk_Alphabet_A"          -> tuong key A   (thuc ra la chu cai A)
       "Tone A" / "Tone B"         -> tuong key A/B (thuc ra la BIEN THE A, B)
       "Money_coin_spin_light_B"   -> tuong key B   (thuc ra la ban B)
     Mot chu cai don giua ten file gan nhu KHONG BAO GIO la tong — nguoi lam
     nhac ghi tong thi ghi "Am", "F#m", "Bb", chu khong ghi tron "A". */
  var k = ten.match(/[\s._-]([A-G](?:#|b)?(?:m|min|maj)|[A-G](?:#|b))[\s._-]/);
  if (k) kq.key = chuanHoaKey(k[1]);
  return kq;
}

/**
 * Doc metadata mot file nhac.
 * Tra ve Promise<{duration, bpm, key, title, genre, artist}>
 */
function docMetadata(duongDan) {
  var ffprobe = duongDanFFprobe();
  var path = getPath();
  var tenFile = path ? path.basename(duongDan) : duongDan;

  if (!ffprobe) {
    var doan0 = doanTuTenFile(tenFile);
    return Promise.resolve({
      duration: 0, bpm: doan0.bpm, key: doan0.key,
      title: '', genre: '', artist: '', nguon: 'ten-file'
    });
  }

  return chayLenh(ffprobe, [
    '-v', 'quiet', '-print_format', 'json',
    '-show_format', '-show_streams',
    '-select_streams', 'a:0',
    duongDan
  ]).then(function (r) {
    var out = { duration: 0, bpm: 0, key: '', title: '', genre: '', artist: '', nguon: '' };
    var j = null;
    try { j = JSON.parse(r.stdout); } catch (e) {}
    if (!j) {
      var d1 = doanTuTenFile(tenFile);
      out.bpm = d1.bpm; out.key = d1.key; out.nguon = 'ten-file';
      return out;
    }

    var f = j.format || {};
    out.duration = parseFloat(f.duration) || 0;

    // Gom tag tu ca format va stream, khong phan biet hoa thuong
    var tags = {};
    function gom(o) {
      if (!o) return;
      for (var k in o) { if (o.hasOwnProperty(k)) tags[k.toLowerCase()] = o[k]; }
    }
    gom(f.tags);
    if (j.streams && j.streams[0]) gom(j.streams[0].tags);

    // BPM: ID3v2 la TBPM; mot so kho ghi 'bpm' hoac 'tempo'
    var rawBpm = tags['tbpm'] || tags['bpm'] || tags['tempo'] || '';
    var nBpm = parseFloat(rawBpm);
    if (nBpm >= 40 && nBpm <= 300) { out.bpm = Math.round(nBpm); out.nguon = 'tag'; }

    // KEY: ID3v2 la TKEY; Serato/Mixed In Key ghi 'initialkey' hoac 'initial_key'
    var rawKey = tags['tkey'] || tags['initialkey'] || tags['initial_key'] || tags['key'] || '';
    if (rawKey) { out.key = chuanHoaKey(rawKey); out.nguon = 'tag'; }

    out.title  = tags['title']  || '';
    out.genre  = tags['genre']  || '';
    out.artist = tags['artist'] || '';

    // Thieu gi thi doan not tu ten file
    if (!out.bpm || !out.key) {
      var d2 = doanTuTenFile(tenFile);
      if (!out.bpm && d2.bpm) { out.bpm = d2.bpm; out.nguon = out.nguon || 'ten-file'; }
      if (!out.key && d2.key) { out.key = d2.key; out.nguon = out.nguon || 'ten-file'; }
    }
    return out;
  });
}

/* ══════════════════════════════════════════
   BO NHO DEM METADATA
   ☠️ Do that 08/08 tren kho nhac that cua anh Tien: **10.673 file**.
   Goi ffprobe cho tung file = 10-20 phut. Khong the bat nguoi dung doi
   moi lan mo panel. Nen phai nho lai ket qua ra dia.
   Khoa theo duong dan; het han khi mtime hoac size doi (file bi sua/thay).
══════════════════════════════════════════ */
var DEM = { du: {}, banRoi: false };

function fileDem() {
  var path = getPath(), kho = duongDanKho();
  if (!path || !kho) return '';
  return path.join(kho, 'dem-metadata.json');
}

function napDem() {
  var fs = getFs(), f = fileDem();
  if (!fs || !f) return;
  try {
    if (!fs.existsSync(f)) return;
    DEM.du = JSON.parse(fs.readFileSync(f, 'utf8')) || {};
  } catch (e) { DEM.du = {}; }
}

function luuDem() {
  var fs = getFs(), path = getPath(), f = fileDem();
  if (!fs || !f || !DEM.banRoi) return;
  try {
    var cha = path.dirname(f);
    if (!fs.existsSync(cha)) fs.mkdirSync(cha, { recursive: true });
    fs.writeFileSync(f, JSON.stringify(DEM.du), 'utf8');
    DEM.banRoi = false;
  } catch (e) {}
}

/** Dau van tay cua file — doi la coi nhu file khac. */
function vanTay(duongDan) {
  var fs = getFs();
  if (!fs) return '';
  try {
    var st = fs.statSync(duongDan);
    return st.size + '_' + Math.round(st.mtimeMs);
  } catch (e) { return ''; }
}

/** Doc metadata CO DUNG BO NHO DEM — chi goi ffprobe khi that su can. */
function docMetadataCoDem(duongDan) {
  var vt = vanTay(duongDan);
  var cu = DEM.du[duongDan];
  if (cu && cu.vt === vt) return Promise.resolve(cu.m);
  return docMetadata(duongDan).then(function (m) {
    DEM.du[duongDan] = { vt: vt, m: m };
    DEM.banRoi = true;
    return m;
  });
}

/** Song am CO DUNG BO NHO DEM — nho lai de cuon qua cuon lai khong doc lai. */
function docSongAmCoDem(duongDan, soVach) {
  var vt = vanTay(duongDan);
  var cu = DEM.du[duongDan];
  if (cu && cu.vt === vt && cu.s) return Promise.resolve(cu.s);
  return docSongAm(duongDan, soVach).then(function (s) {
    if (!s) return null;
    // Lam tron 2 chu so — file dem nho di gan mot nua ma mat thuong khong thay
    var gon = s.map(function (v) { return Math.round(v * 100) / 100; });
    if (!DEM.du[duongDan]) DEM.du[duongDan] = { vt: vt, m: {} };
    DEM.du[duongDan].vt = vt;
    DEM.du[duongDan].s = gon;
    DEM.banRoi = true;
    return gon;
  });
}

/**
 * Ket qua PHAN TICH BPM/Key — nho vao bo dem.
 *
 * ☠️ GIU CA VECTOR CHROMA. Ly do: cong thuc do tin cay Key con dang duoc kiem
 * dinh (do that 08/08 cho thay no cham tap am CAO HON nhac that). Khi doi cong
 * thuc, neu chi nho moi "key + tinCay" thi phai DO LAI ca 10.673 file — mat
 * hang chuc phut. Giu chroma (12 so) thi tinh lai tin cay chi mat vai giay.
 * Tra gia: file dem to them ~1 MB cho ca kho. Rat dang.
 */
function luuPhanTich(duongDan, kq) {
  var vt = vanTay(duongDan);
  if (!DEM.du[duongDan]) DEM.du[duongDan] = { vt: vt, m: {} };
  DEM.du[duongDan].vt = vt;
  DEM.du[duongDan].pt = {
    bpm: kq.bpm, key: kq.key,
    tinCayBpm: kq.tinCayBpm, tinCayKey: kq.tinCayKey,
    loi: kq.loi || '',
    // Lam tron 4 chu so — du chinh xac de tinh lai, ma nho file di mot nua
    chroma: kq.chroma ? kq.chroma.map(function (v) { return Math.round(v * 10000) / 10000; }) : null
  };
  DEM.banRoi = true;
}
function layPhanTich(duongDan) {
  var cu = DEM.du[duongDan];
  if (cu && cu.vt === vanTay(duongDan) && cu.pt) return cu.pt;
  return null;
}

/* ══════════════════════════════════════════
   MAY CHU PHAT NHAC (127.0.0.1)
   ☠️ Vi sao BAT BUOC: Premiere nap panel qua file://, Chromium chan trang
   file:// doc file khac tren dia -> <audio src="D:/nhac.mp3"> CAM TIT.
   Phuc vu qua HTTP localhost thi bo qua duoc han che do, va co Range request
   nen tua duoc giua bai. Chi nghe tren 127.0.0.1 + doi token ngau nhien nen
   tien trinh khac tren may khong do duoc duong dan file.
══════════════════════════════════════════ */
var mayChu = { url: '', token: '', dangChay: false };

var MIME = {
  mp3:'audio/mpeg', wav:'audio/wav', m4a:'audio/mp4', aac:'audio/aac',
  flac:'audio/flac', ogg:'audio/ogg', opus:'audio/ogg',
  aif:'audio/aiff', aiff:'audio/aiff', wma:'audio/x-ms-wma'
};

function moMayChu() {
  return new Promise(function (resolve) {
    if (mayChu.dangChay) { resolve(mayChu.url); return; }
    var http = nodeRequire('http'), fs = getFs(), url = nodeRequire('url'), crypto = nodeRequire('crypto');
    if (!http || !fs) { resolve(''); return; }

    try {
      mayChu.token = crypto
        ? crypto.randomBytes(16).toString('hex')
        : String(Math.random()).slice(2) + String(Math.random()).slice(2);
    } catch (e) {
      mayChu.token = String(Math.random()).slice(2);
    }

    var sv = http.createServer(function (req, res) {
      var q;
      try { q = url.parse(req.url, true).query; } catch (e) { q = {}; }
      if (q.t !== mayChu.token) { res.writeHead(403); res.end('cam'); return; }

      var f = q.f ? decodeURIComponent(q.f) : '';

      // ☠️ DUONG LUI CHUYEN MA — do that 09/08 tren kho anh Tien.
      // Chromium KHAT KHE HON ffmpeg. File
      //   General music/_DRIP_TOO_HARD..._140.mp3
      // bat dau bang byte rac (66 e2 db 82...) chu khong phai header MP3 hop le.
      // ffmpeg de tinh, quet toi khi gap khung hop le nen van doc duoc (do ra
      // 76 BPM binh thuong); con the <audio> tra thang MEDIA_ERR_SRC_NOT_SUPPORTED
      // (loi 4) va CAM TIT. Nguoi dung chi thay "bam khong keu" — khong hieu vi sao.
      // Chua: chuyen ma MOT LAN sang MP3 sach roi nho lai, sau do phuc vu binh
      // thuong (van co Range nen van tua duoc).
      // libmp3lame trong ban bundle la LGPL, khong dinh GPL.
      if (q.tc === '1') {
        var dich = duongDanChuyenMa(f);
        if (!dich) { res.writeHead(500); res.end('khong tao duoc thu muc dem'); return; }
        if (fs.existsSync(dich)) { f = dich; }
        else {
          chuyenMa(f, dich).then(function (ok) {
            if (!ok) { res.writeHead(415); res.end('khong chuyen ma duoc'); return; }
            phucVu(dich, req, res);
          });
          return;
        }
      }

      phucVu(f, req, res);
    });

    function phucVu(f, req, res) {
      var st;
      try { st = fs.statSync(f); } catch (e) { res.writeHead(404); res.end('khong thay'); return; }

      var duoi = f.slice(f.lastIndexOf('.') + 1).toLowerCase();
      var kieu = MIME[duoi] || 'application/octet-stream';
      var range = req.headers.range;

      if (range) {
        // Range request — de tua giua bai ma khong phai tai ca file
        var m = /bytes=(\d*)-(\d*)/.exec(range) || [];
        var dau = m[1] ? parseInt(m[1], 10) : 0;
        var cuoi = m[2] ? parseInt(m[2], 10) : st.size - 1;
        if (cuoi >= st.size) cuoi = st.size - 1;
        res.writeHead(206, {
          'Content-Type': kieu,
          'Content-Length': (cuoi - dau + 1),
          'Content-Range': 'bytes ' + dau + '-' + cuoi + '/' + st.size,
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(f, { start: dau, end: cuoi }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Type': kieu,
          'Content-Length': st.size,
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(f).pipe(res);
      }
    }

    sv.on('error', function () { resolve(''); });
    // Cong 0 = de he dieu hanh tu chon cong con trong, khong dung cong debug
    sv.listen(0, '127.0.0.1', function () {
      mayChu.url = 'http://127.0.0.1:' + sv.address().port;
      mayChu.dangChay = true;
      resolve(mayChu.url);
    });
  });
}

/** Duong dan HTTP de <audio> phat duoc file tren dia. */
function urlPhat(duongDanFile, chuyen) {
  if (!mayChu.dangChay) return '';
  return mayChu.url + '/?t=' + mayChu.token +
         '&f=' + encodeURIComponent(duongDanFile) +
         (chuyen ? '&tc=1' : '');
}

/* ══════════════════════════════════════════
   CHUYEN MA — chua file Chromium khong doc noi
══════════════════════════════════════════ */
function thuMucChuyenMa() {
  var fs = getFs(), path = getPath(), kho = duongDanKho();
  if (!fs || !path || !kho) return '';
  var d = path.join(kho, 'chuyen-ma');
  try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch (e) { return ''; }
  return d;
}

/** Ten file dem: bam tu duong dan + van tay, de file doi thi chuyen lai. */
function duongDanChuyenMa(nguon) {
  var path = getPath(), d = thuMucChuyenMa();
  if (!d || !path) return '';
  var khoa = nguon + '|' + vanTay(nguon);
  var bam = 0;
  for (var i = 0; i < khoa.length; i++) { bam = ((bam << 5) - bam + khoa.charCodeAt(i)) | 0; }
  return path.join(d, 'tc_' + (bam >>> 0).toString(36) + '.mp3');
}

/**
 * Chuyen sang MP3 sach. Dung libmp3lame — LGPL, khong dinh GPL.
 * 128 kbps la du de NGHE THU; muc dich chi de chon bai, khong phai de dung.
 */
function chuyenMa(nguon, dich) {
  var ffmpeg = duongDanFFmpeg();
  if (!ffmpeg) return Promise.resolve(false);
  return chayLenh(ffmpeg, [
    '-v', 'error', '-y',
    '-err_detect', 'ignore_err',      // de tinh voi file header hong
    '-i', nguon,
    '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    dich
  ]).then(function () {
    var fs = getFs();
    try { return fs.existsSync(dich) && fs.statSync(dich).size > 1024; }
    catch (e) { return false; }
  });
}

/* ══════════════════════════════════════════
   SONG AM THAT — doc bien do tu file bang ffmpeg
   Truoc day song am la Math.random(), khong lien quan gi den bai nhac.
══════════════════════════════════════════ */
function docSongAm(duongDan, soVach) {
  var ffmpeg = duongDanFFmpeg();
  if (!ffmpeg) return Promise.resolve(null);
  if (!soVach) soVach = 80;

  // Giai ma ra PCM 8-bit mono. Chi can HINH DANG song, khong can chat luong nghe.
  // ☠️ Phai doc NHI PHAN. Doc chuoi la hong (xem chu thich o chayLenhNhiPhan).
  // ☠️ 8000 Hz chu KHONG phai 1000 Hz: do that 08/08, de 1000 Hz thi Nyquist
  // chi con 500 Hz, bo loc chong rang cua cat gan het tieng -> sine 440 Hz ra
  // bien do 0,13 thay vi ~1, va nhac that thi mat sach phan treble, song am
  // gan nhu phang. 8000 Hz giu duoc toi 4 kHz, du cho hinh dang.
  // 10 phut nhac = 4,8 MB, thoai mai trong gioi han 64 MB.
  return chayLenhNhiPhan(ffmpeg, [
    '-v', 'quiet', '-i', duongDan,
    '-ac', '1', '-ar', '8000', '-f', 'u8', '-'
  ]).then(function (buf) {
    if (!buf || !buf.length) return null;
    var n = buf.length, buoc = Math.floor(n / soVach) || 1, vach = [];
    for (var i = 0; i < soVach; i++) {
      var dinh = 0;
      for (var j = i * buoc; j < (i + 1) * buoc && j < n; j++) {
        // u8: 128 la im lang, lech khoi 128 la bien do
        var v = Math.abs(buf[j] - 128);
        if (v > dinh) dinh = v;
      }
      vach.push(dinh / 128);   // 0..1
    }
    return vach;
  });
}
