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
 *   KEY — vector chroma 12 cung -> doi chieu bang mau Krumhansl-Kessler
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
   KEY — chroma + bang mau Krumhansl-Kessler
══════════════════════════════════════════ */
var NOT = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// Bang mau cam nhan cung dieu (Krumhansl & Kessler 1982)
var MAU_TRUONG = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
var MAU_THU    = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

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

/* ══════════════════════════════════════════
   ☠️ VAN TAY CUA MAY DO — phai tru di, khong la sai het.
   Bin FFT cach deu theo TAN SO, con cung nhac chia theo hàm LOG. Nen so bin
   roi vao moi cung KHONG bang nhau. Do that (SR 22050, cua so 2048, dai
   65-2100 Hz): C va A moi cung hung **21 bin**, con C# chi **9 bin** —
   lech **2,33 lan**.
   Hau qua tren kho that cua anh Tien: **4.114/5.025 bai ra "Am" (82%)**.
   Tieng xe co, song bien, tieng gio... deu ra Am, vi pho bang rong thi cung
   nao hung nhieu bin hon se thang, ma A va C dung dau bang.
   Chua: chia moi cung cho SO BIN cua chinh no -> pho phang cho ra chroma phang
   -> khong khop bang mau nao -> tin cay thap -> bi loai dung.
══════════════════════════════════════════ */
/* Dai bin cua tung NOT ban cung — dung mot lan roi dung lai. */
var MIDI_DAU = 36, MIDI_CUOI = 96;    // C2 (65 Hz) .. C7 (2093 Hz)
var _daiNot = null;

function daiNot(soBin) {
  if (_daiNot) return _daiNot;
  var ds = [];
  for (var m = MIDI_DAU; m <= MIDI_CUOI; m++) {
    // Bien duoi/tren cua not: nua cung moi ben
    var fd = 440 * Math.pow(2, (m - 0.5 - 69) / 12);
    var fc = 440 * Math.pow(2, (m + 0.5 - 69) / 12);
    var kd = Math.max(1, Math.ceil(fd * CUA_SO / SR));
    var kc = Math.min(soBin - 1, Math.floor(fc * CUA_SO / SR));
    if (kc < kd) continue;             // not qua thap, chua du mot bin
    ds.push({ pc: ((m % 12) + 12) % 12, kd: kd, kc: kc, so: kc - kd + 1 });
  }
  _daiNot = ds;
  return ds;
}

function doKey(pho) {
  if (!pho || pho.length < 8) return { key: '', tinCay: 0 };
  var soBin = pho[0].length;
  var chroma = new Float64Array(12);
  var ds = daiNot(soBin);
  if (!ds.length) return { key: '', tinCay: 0 };

  /* ☠️ LAY TRUNG BINH THEO TUNG NOT, KHONG CONG DON THEO BIN.
     Ban dau em cong thang bien do cua moi bin vao cung tuong ung. Sai, vi bin
     FFT cach deu theo TAN SO con not nhac chia theo LOG: not cao trum nhieu bin
     hon not thap. Do that: cung C va A moi cung hung 21 bin, C# chi 9 — lech
     2,33 lan. Ket qua tren kho that: **4.114/5.025 bai ra "Am" (82%)**, ke ca
     tieng xe co va song bien.
     Thu chia cho so bin CUA CA CUNG cung khong xong: lam vay lai phat oan tin
     hieu CO TONG (hop am C bi doan thanh Em).
     Cach dung: moi NOT BAN CUNG lay TRUNG BINH bien do trong dai cua no, roi
     moi cong vao cung. Nho vay:
       - pho phang (tap am) -> moi not trung binh nhu nhau -> chroma PHANG
       - co not that       -> not do troi han -> chroma NHON dung cho */
  for (var f = 0; f < pho.length; f++) {
    var mag = pho[f];
    for (var i = 0; i < ds.length; i++) {
      var n = ds[i], s = 0;
      for (var k = n.kd; k <= n.kc; k++) s += mag[k];
      chroma[n.pc] += s / n.so;        // TRUNG BINH, khong phai tong
    }
  }

  var tong = 0;
  for (i = 0; i < 12; i++) tong += chroma[i];
  if (tong <= 0) return { key: '', tinCay: 0 };
  for (i = 0; i < 12; i++) chroma[i] /= tong;

  // Thu ca 12 cung x 2 dieu, lay cai khop nhat
  var tot = -2, gocTot = 0, thuTot = false, nhi = -2;
  for (var g = 0; g < 12; g++) {
    var xoay = new Float64Array(12);
    for (i = 0; i < 12; i++) xoay[i] = chroma[(g + i) % 12];
    var rT = tuongQuan(xoay, MAU_TRUONG);
    var rt = tuongQuan(xoay, MAU_THU);
    if (rT > tot) { nhi = tot; tot = rT; gocTot = g; thuTot = false; }
    else if (rT > nhi) nhi = rT;
    if (rt > tot) { nhi = tot; tot = rt; gocTot = g; thuTot = true; }
    else if (rt > nhi) nhi = rt;
  }

  var ten = NOT[gocTot] + (thuTot ? 'm' : '');

  /* ══════════════════════════════════════════
     ☠️ TIN CAY — VIET LAI HOAN TOAN 09/08.
     Cong thuc cu: `tot*0.6 + (tot-nhi)*2` — BI NGUOC.
     No do KHOANG CACH giua hang nhat va hang nhi, chu khong do CO TONG HAY
     KHONG. Hai bang mau Krumhansl co trong so chu am gan y het nhau (truong
     6,35 · thu 6,33), nen tieng cang THUAN MOT CAO DO thi truong va thu cang
     cham diem bang nhau -> (tot-nhi) sup ve 0 -> tin cay TUT.
     Bang chung do that:
       - chuong `bell_notification_3` (ro cao do nhat, nhon 0,091) -> chi 41%
       - tieng `power down` pho phang                              -> 81%
       - nhieu trang/xanh/hong/nau deu ra "Am" 51-78%, chroma trung nhau tung so
     Tren ca kho anh Tien: **4.114/5.025 bai ra "Am" (82%)**.

     Cong thuc moi dua vao **DO NHON cua chroma** (1 - entropy chuan hoa).
     Do that de hieu chinh (nhom mau tach bach):
       tap am  : nhon 0,006-0,022   tuong quan 0,78-0,80
       nhac    : nhon 0,022-0,108   tuong quan 0,39-0,88
       hop am  : nhon 0,249-0,452   tuong quan 0,82-0,92
     => TUONG QUAN KHONG TACH DUOC (tap am con cao hon nhac). Chi DO NHON tach
     duoc. Nen do nhon lam CONG CHINH, tuong quan chi lam he so phu.
  ══════════════════════════════════════════ */
  var H = 0;
  for (i = 0; i < 12; i++) if (chroma[i] > 0) H -= chroma[i] * Math.log(chroma[i]);
  var nhon = 1 - H / Math.log(12);            // 0 = phang tit, 1 = don mot cung

  // Nguong lay tu so do o tren: 0,018 = tran cua tap am, 0,063 = nhac ro tong
  var cong = Math.max(0, Math.min(1, (nhon - 0.018) / 0.045));
  // Bang mau co that su khop khong — chi lam he so phu, khong quyet dinh
  var khop = Math.max(0, Math.min(1, (tot - 0.5) / 0.35));
  var tinCay = cong * (0.55 + 0.45 * khop);

  return {
    key: ten, tinCay: tinCay, nhon: nhon, khop: tot,
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
    var k = doKey(pho);
    return {
      bpm: b.bpm, tinCayBpm: b.tinCay,
      key: k.key, tinCayKey: k.tinCay,
      chroma: k.chroma, loi: ''
    };
  }).catch(function (e) {
    return { bpm: 0, key: '', tinCayBpm: 0, tinCayKey: 0, loi: String(e) };
  });
}
