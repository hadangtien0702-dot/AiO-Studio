/**
 * phan-tich.js — DO BPM VA KEY THAT tu tieng nhac.
 *
 * ☠️ VI SAO PHAI TU VIET, KHONG DUNG THU VIEN:
 * Kho nhac that cua anh Tien (do 08/08, 10.673 file) **khong co file nao co
 * tag TBPM/TKEY**. Nen phai do that tu tin hieu. Ma hai thu vien pho bien deu
 * dinh giay phep doc:
 *    essentia = AGPL-3.0 · aubio = GPL-3.0
 * Dung chung la phai mo ma nguon CA BO — trong khi day la san pham de BAN.
 * Nen viet tay bang JS thuan: khong them phu thuoc, khong dinh giay phep nao.
 *
 * ☠️ DO THEO YEU CAU, KHONG DO CA KHO. Anh Tien chot 08/08. Kho 10.673 file
 * ma do het thi vua lau vua vo nghia — phan lon kho la SOUND EFFECT, BPM/Key
 * khong co y nghia gi voi tieng canh cua, tieng buoc chan.
 *
 * Cach lam:
 *   BPM — nang luong pho (spectral flux) -> tuong quan tu than (autocorrelation)
 *   KEY — chroma phan giai cao (cua so 8192) -> doi chieu bang mau Temperley (doi 27/09, xem khoi KEY)
 */

/* ══════════════════════════════════════════
   FFT — radix-2, tai cho
══════════════════════════════════════════ */
function fft(re, im) {
  var n = re.length, i, j, k, len, t;
  // Dao bit
  for (i = 1, j = 0; i < n; i++) {
    var bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (len = 2; len <= n; len <<= 1) {
    var goc = -2 * Math.PI / len;
    var wr = Math.cos(goc), wi = Math.sin(goc);
    var nua = len >> 1;
    for (i = 0; i < n; i += len) {
      var cr = 1, ci = 0;
      for (k = 0; k < nua; k++) {
        var ur = re[i + k], ui = im[i + k];
        var xr = re[i + k + nua], xi = im[i + k + nua];
        var vr = xr * cr - xi * ci;
        var vi = xr * ci + xi * cr;
        re[i + k] = ur + vr;       im[i + k] = ui + vi;
        re[i + k + nua] = ur - vr; im[i + k + nua] = ui - vi;
        var ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

/* ══════════════════════════════════════════
   GIAI MA TIENG — lay mot doan de do
══════════════════════════════════════════ */
var SR = 22050;          // du cho nhac: giu toi ~11 kHz
var GIAY_DO = 60;        // do 60 giay o GIUA bai

/**
 * Lay mau PCM float (-1..1) tu mot doan giua bai.
 * Lay o giua vi dau bai hay co intro im, cuoi bai hay fade out.
 */
function layMau(duongDan, tongGiay) {
  var ffmpeg = duongDanFFmpeg();
  if (!ffmpeg) return Promise.resolve(null);

  var batDau = 0;
  if (tongGiay && tongGiay > GIAY_DO + 4) {
    batDau = Math.floor((tongGiay - GIAY_DO) / 2);
  }

  var args = ['-v', 'quiet'];
  if (batDau > 0) args = args.concat(['-ss', String(batDau)]);
  args = args.concat([
    '-i', duongDan,
    '-t', String(GIAY_DO),
    '-ac', '1', '-ar', String(SR),
    '-f', 's16le', '-'
  ]);

  return chayLenhNhiPhan(ffmpeg, args).then(function (buf) {
    if (!buf || buf.length < 4096) return null;
    var n = buf.length >> 1;
    var x = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      // s16le little-endian, chuan hoa ve -1..1
      var v = buf[i * 2] | (buf[i * 2 + 1] << 8);
      if (v >= 32768) v -= 65536;
      x[i] = v / 32768;
    }
    return x;
  });
}

/* ══════════════════════════════════════════
   PHO — tinh bien do pho tung khung, dung lai cho ca BPM va KEY
══════════════════════════════════════════ */
var CUA_SO = 2048;
var BUOC = 512;

function tinhPho(x) {
  var soKhung = Math.floor((x.length - CUA_SO) / BUOC);
  if (soKhung < 8) return null;
  var soBin = CUA_SO >> 1;
  var pho = [];
  // Cua so Hann — giam ro ri pho
  var hann = new Float32Array(CUA_SO);
  for (var i = 0; i < CUA_SO; i++) hann[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (CUA_SO - 1)));

  var re = new Float64Array(CUA_SO), im = new Float64Array(CUA_SO);
  for (var f = 0; f < soKhung; f++) {
    var o = f * BUOC;
    for (var j = 0; j < CUA_SO; j++) { re[j] = x[o + j] * hann[j]; im[j] = 0; }
    fft(re, im);
    var mag = new Float32Array(soBin);
    for (var k = 0; k < soBin; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    pho.push(mag);
  }
  return pho;
}

/* ══════════════════════════════════════════
   BPM — spectral flux + tuong quan tu than
══════════════════════════════════════════ */
var BPM_MIN = 60, BPM_MAX = 200;

function doBPM(pho) {
  if (!pho || pho.length < 32) return { bpm: 0, tinCay: 0 };
  var soKhung = pho.length, soBin = pho[0].length;
  var tanSoKhung = SR / BUOC;             // ~43,07 khung/giay

  // 1) Spectral flux — chi lay phan TANG (nốt moi vao), bo phan giam
  var flux = new Float64Array(soKhung);
  for (var f = 1; f < soKhung; f++) {
    var s = 0;
    for (var k = 1; k < soBin; k++) {
      var d = pho[f][k] - pho[f - 1][k];
      if (d > 0) s += d;
    }
    flux[f] = s;
  }

  // 2) Bo duong nen (truot 1 giay) -> chi con dinh nhon
  var w = Math.round(tanSoKhung);
  var sach = new Float64Array(soKhung);
  for (var i = 0; i < soKhung; i++) {
    var a = Math.max(0, i - w), b = Math.min(soKhung - 1, i + w), t = 0;
    for (var j = a; j <= b; j++) t += flux[j];
    var tb = t / (b - a + 1);
    sach[i] = Math.max(0, flux[i] - tb);
  }

  // 3) Tuong quan tu than tren dai nhip 60..200 BPM
  var lagMin = Math.floor(60 * tanSoKhung / BPM_MAX);
  var lagMax = Math.ceil(60 * tanSoKhung / BPM_MIN);
  if (lagMax >= soKhung) lagMax = soKhung - 1;
  if (lagMin < 2 || lagMax <= lagMin) return { bpm: 0, tinCay: 0 };

  var acf = [], dinh = 0, lagDinh = 0;
  for (var lag = lagMin; lag <= lagMax; lag++) {
    var s2 = 0;
    for (var m = 0; m + lag < soKhung; m++) s2 += sach[m] * sach[m + lag];
    s2 /= (soKhung - lag);
    acf.push({ lag: lag, v: s2 });
    if (s2 > dinh) { dinh = s2; lagDinh = lag; }
  }
  if (!lagDinh || dinh <= 0) return { bpm: 0, tinCay: 0 };

  // 4) Noi suy parabol quanh dinh -> BPM min hon buoc luoi
  var idx = lagDinh - lagMin;
  var lagTinh = lagDinh;
  if (idx > 0 && idx < acf.length - 1) {
    var y0 = acf[idx - 1].v, y1 = acf[idx].v, y2 = acf[idx + 1].v;
    var mau = (y0 - 2 * y1 + y2);
    if (mau !== 0) lagTinh = lagDinh + 0.5 * (y0 - y2) / mau;
  }
  var bpm = 60 * tanSoKhung / lagTinh;

  // 5) Sua loi bat gap doi / mot nua — dua ve dai nghe hop ly 70..180
  while (bpm < 70)  bpm *= 2;
  while (bpm > 180) bpm /= 2;

  // 6) Do tin cay = dinh noi bat hon nen bao nhieu
  var tong = 0;
  for (var q = 0; q < acf.length; q++) tong += acf[q].v;
  var tbAcf = tong / acf.length;
  var tinCay = tbAcf > 0 ? Math.min(1, (dinh / tbAcf - 1) / 3) : 0;

  return { bpm: Math.round(bpm * 10) / 10, tinCay: tinCay };
}

/* ══════════════════════════════════════════
   KEY — chroma do phan giai cao + bang mau Temperley
   ☠️ VIET LAI 27/09/2026. Ban cu (cua so 2048 = 10,8 Hz/o) SAI HE THONG:
   duoi ~180 Hz hai not lien nhau cach nhau it hon mot o FFT, nen vung BASS —
   cho mang nhieu thong tin ve key nhat — bi dem theo kieu "trung o nao thi
   tinh o do". Do that bang phep NANG CAO DO (bai that nang k nua cung, key
   dung phai dich dung k): ban cu chi dich dung 22,4% (32/143), 54,5% ket qua
   ra F/C, va KHONG BAO GIO ra B. Hop am tong hop (110-330 Hz) van qua — nen
   bo kiem 09/08 khong bat duoc.
   Ban nay (do cung phep tren 12 bai that + 1 doi chung): dich dung 79,0%
   (113/143), F/C 19,9% (gan muc tu nhien ~16,7%), doi chung 11/11.
   Cach lam:
     - cua so RIENG cho key 8192 mau (2,7 Hz/o) -> tach not tu ~55 Hz
     - moi o FFT gan vao not gan nhat, trong so tam giac theo do lech
     - chia moi lop not cho TONG TRONG SO cua chinh no (not nhieu o khong thang)
     - bien do TUYEN TINH (nen log day nen tap am len -> lech ve G#m, da do)
     - chuan hoa tung khung, tru nen (min) roi so bang mau Temperley
   Lech con lai chu yeu la TRUONG <-> THU SONG SONG (Em <-> G): cung bo not,
   ghep voi nhau van hop — giao dien phai noi ro dieu nay.
══════════════════════════════════════════ */
var NOT = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// Bang mau Temperley (Kostka-Payne): do that 27/09 on dinh hon Krumhansl 1982
// (79,0% vs 73,4%) va Albrecht-Shanahan (74,8%) tren cung bo 12 bai.
var MAU_TRUONG = [5, 2, 3.5, 2, 4.5, 4, 2, 4.5, 2, 3.5, 1.5, 4];
var MAU_THU    = [5, 2, 3.5, 4.5, 2, 4, 2, 4.5, 3.5, 2, 1.5, 4];

var CUA_SO_KEY = 8192, BUOC_KEY = 4096;
var TAN_DUOI = 55, TAN_TREN = 2000;

function tuongQuan(a, b) {
  var n = a.length, sa = 0, sb = 0, i;
  for (i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
  var ma = sa / n, mb = sb / n, tu = 0, va = 0, vb = 0;
  for (i = 0; i < n; i++) {
    var da = a[i] - ma, db = b[i] - mb;
    tu += da * db; va += da * da; vb += db * db;
  }
  var mau = Math.sqrt(va * vb);
  return mau === 0 ? 0 : tu / mau;
}

/* O FFT -> (lop not, trong so) — dung mot lan roi dung lai. */
var _bangKey = null;
function bangKey() {
  if (_bangKey) return _bangKey;
  var ds = [], tongW = new Float64Array(12);
  for (var k = 1; k < CUA_SO_KEY / 2; k++) {
    var f = k * SR / CUA_SO_KEY;
    if (f < TAN_DUOI || f > TAN_TREN) continue;
    var midi = 69 + 12 * Math.log(f / 440) / Math.LN2;
    var gan = Math.round(midi);
    var w = 1 - Math.abs(midi - gan) / 0.5;      // dung tam not = 1, giua hai not = 0
    if (w <= 0) continue;
    var pc = ((gan % 12) + 12) % 12;
    ds.push({ k: k, pc: pc, w: w });
    tongW[pc] += w;
  }
  _bangKey = { ds: ds, tongW: tongW };
  return _bangKey;
}

function doKey(x) {
  if (!x || x.length < CUA_SO_KEY * 2) return { key: '', tinCay: 0 };
  var B = bangKey(), i, j;
  var hann = new Float64Array(CUA_SO_KEY);
  for (i = 0; i < CUA_SO_KEY; i++) hann[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (CUA_SO_KEY - 1)));
  var re = new Float64Array(CUA_SO_KEY), im = new Float64Array(CUA_SO_KEY);
  var chroma = new Float64Array(12), c = new Float64Array(12);

  for (var o = 0; o + CUA_SO_KEY <= x.length; o += BUOC_KEY) {
    for (i = 0; i < CUA_SO_KEY; i++) { re[i] = x[o + i] * hann[i]; im[i] = 0; }
    fft(re, im);
    for (i = 0; i < 12; i++) c[i] = 0;
    for (j = 0; j < B.ds.length; j++) {
      var b = B.ds[j];
      c[b.pc] += b.w * Math.sqrt(re[b.k] * re[b.k] + im[b.k] * im[b.k]);
    }
    var mx = 0;
    for (i = 0; i < 12; i++) { c[i] /= B.tongW[i]; if (c[i] > mx) mx = c[i]; }
    if (mx > 0) for (i = 0; i < 12; i++) chroma[i] += c[i] / mx;
  }
  var mn = Infinity;
  for (i = 0; i < 12; i++) if (chroma[i] < mn) mn = chroma[i];
  var tong = 0;
  for (i = 0; i < 12; i++) { chroma[i] -= mn; tong += chroma[i]; }
  if (tong <= 0) return { key: '', tinCay: 0 };
  for (i = 0; i < 12; i++) chroma[i] /= tong;

  var tot = -2, gocTot = 0, thuTot = false;
  for (var g = 0; g < 12; g++) {
    var xoay = new Float64Array(12);
    for (i = 0; i < 12; i++) xoay[i] = chroma[(g + i) % 12];
    var rT = tuongQuan(xoay, MAU_TRUONG), rt = tuongQuan(xoay, MAU_THU);
    if (rT > tot) { tot = rT; gocTot = g; thuTot = false; }
    if (rt > tot) { tot = rt; gocTot = g; thuTot = true; }
  }

  /* TIN CAY = do khop bang mau. Do that 27/09 (60 giay dau moi file):
       tap am (gio, xe co, song, tau dien)  khop 0,32-0,41 (rieng 1 tieng gio vu 0,61)
       nhac that                            khop 0,41-0,93, phan lon >= 0,53
     "Do nhon" dung cho ban cu KHONG con tach duoc (tap am 0,06-0,24 · nhac 0,07-0,32).
     Nguong 0,42 dat ngay tren tran cum tap am; 0,72 tro len coi la chac. */
  var tinCay = Math.max(0, Math.min(1, (tot - 0.42) / 0.30));

  return {
    key: NOT[gocTot] + (thuTot ? 'm' : ''), tinCay: tinCay, khop: tot,
    chroma: Array.prototype.slice.call(chroma)
  };
}

/* ══════════════════════════════════════════
   HAM CHINH — do ca BPM va KEY trong MOT lan giai ma
══════════════════════════════════════════ */
function phanTichNhac(duongDan, tongGiay) {
  return layMau(duongDan, tongGiay).then(function (x) {
    if (!x) return { bpm: 0, key: '', tinCayBpm: 0, tinCayKey: 0, loi: 'Khong giai ma duoc file' };
    var pho = tinhPho(x);
    if (!pho) return { bpm: 0, key: '', tinCayBpm: 0, tinCayKey: 0, loi: 'File qua ngan de do' };
    var b = doBPM(pho);
    var k = doKey(x);          // 27/09: key dung cua so rieng 8192, can mau goc
    return {
      bpm: b.bpm, tinCayBpm: b.tinCay,
      key: k.key, tinCayKey: k.tinCay,
      chroma: k.chroma, loi: ''
    };
  }).catch(function (e) {
    return { bpm: 0, key: '', tinCayBpm: 0, tinCayKey: 0, loi: String(e) };
  });
}
