/**
 * guideframe.jsx — logic host cua AiO Auto Guiline Frame (v0.3.0)
 *
 * Quy uoc tra ve: "OK:..." / "ERR:MA_LOI|chi tiet" — panel dich ra cau chu.
 * ASCII khong dau (ExtendScript ES3). KHONG dung JSON (host khong co).
 *
 * Nguyen tac an toan (tu skill adobe-cep-panel):
 *  - KHONG dung QE DOM trong ban nay (sai tham so la SAP Premiere).
 *    Track ban thi tra ERR de panel huong dan them track — KHONG tu them.
 *  - KHONG de clip guide len track dang co clip cua nguoi dung.
 *  - Moi thao tac xoa deu duyet NGUOC va dem truoc/sau.
 */

var GF_TIEN_TO = 'AIO_GUIDE'; // ten file PNG bat dau bang chuoi nay -> nhan dien clip guide

function gf_layDuAn_() {
  if (!app.project) return null;
  return app.project;
}

function gf_laySeq_() {
  var p = gf_layDuAn_();
  if (!p) return null;
  return p.activeSequence || null;
}

/** Diem VAO nguoi dung khoanh (I) tren timeline, tinh bang giay. -1 = khong doc duoc.
    Cung bai voi ac_seqInSec cua Autocut (da do that 19/08/2026). */
function gf_inSec_(seq) {
  try { var t = seq.getInPointAsTime(); if (t && typeof t.seconds === 'number') return t.seconds; } catch (e) {}
  try { var s = parseFloat(seq.getInPoint()); if (!isNaN(s)) return s; } catch (e2) {}
  return -1;
}

/** Diem RA (O), tinh bang giay. -1 = khong doc duoc. */
function gf_outSec_(seq) {
  try { var t = seq.getOutPointAsTime(); if (t && typeof t.seconds === 'number') return t.seconds; } catch (e) {}
  try { var s = parseFloat(seq.getOutPoint()); if (!isNaN(s)) return s; } catch (e2) {}
  return -1;
}

/** Kich thuoc + do dai + vung In/Out cua sequence dang mo: "OK:w|h|daiGiay|ten|in|out" */
function gf_thongTinSeq() {
  var seq = gf_laySeq_();
  if (!seq) return 'ERR:CHUA_MO_SEQ|';
  var w = 0, h = 0;
  try {
    var st = seq.getSettings();
    if (st) {
      w = parseInt(st.videoFrameWidth, 10);
      h = parseInt(st.videoFrameHeight, 10);
    }
  } catch (e1) {}
  if (!w || !h) {
    try { w = parseInt(seq.frameSizeHorizontal, 10); h = parseInt(seq.frameSizeVertical, 10); } catch (e2) {}
  }
  if (!w || !h) return 'ERR:KHONG_DOC_DUOC_KHUNG|' + w + 'x' + h;
  var dai = 0;
  try {
    dai = parseFloat(seq.end) / 254016000000;
  } catch (e3) {}
  if (!dai || dai <= 0) {
    try {
      for (var t = 0; t < seq.videoTracks.numTracks; t++) {
        var tr = seq.videoTracks[t];
        for (var c = 0; c < tr.clips.numItems; c++) {
          var cu = tr.clips[c].end.seconds;
          if (cu > dai) dai = cu;
        }
      }
    } catch (e4) {}
  }
  var ten = '';
  // '|' la ky tu ngan cach cua giao thuc — ten chua no thi cac truong sau lech het
  try { ten = String(seq.name).replace(/\|/g, ' '); } catch (e5) {}
  // Ghep In/Out vao cau tra loi SAN CO: vong tham do 1,5s cua panel biet vung
  // chon ma khong ton them luot evalScript nao (luat "tool phai dong hanh" 19/08/2026).
  return 'OK:' + w + '|' + h + '|' + dai + '|' + ten + '|' + gf_inSec_(seq) + '|' + gf_outSec_(seq);
}

/**
 * Danh sach sequence CO THAT trong project — de panel bay ra o o chon.
 * Tra: "OK:<idDangMo>|<id>\t<ten>|<id>\t<ten>|..."
 * Chi DOC, khong sua gi.
 */
function gf_dsSequence() {
  var p = gf_layDuAn_();
  if (!p) return 'ERR:CHUA_MO_DU_AN|';
  var hienId = '';
  try { if (p.activeSequence) hienId = String(p.activeSequence.sequenceID); } catch (e) {}
  var ra = [];
  try {
    for (var i = 0; i < p.sequences.numSequences; i++) {
      var s = p.sequences[i];
      var ten = '';
      try { ten = String(s.name); } catch (e1) {}
      // '|' va tab la ky tu ngan cach cua giao thuc nay — thay bang dau cach
      ten = ten.replace(/\|/g, ' ').replace(/\t/g, ' ');
      ra.push(String(s.sequenceID) + '\t' + ten);
    }
  } catch (e2) {
    return 'ERR:DOC_DS_HONG|' + e2;
  }
  return 'OK:' + hienId + '|' + ra.join('|');
}

/**
 * Mo mot sequence theo sequenceID. Doc lai de chac Premiere DA chuyen that,
 * khong tin gia tri tra ve cua openSequence. "OK:<ten>"
 */
function gf_moSequence(id) {
  var p = gf_layDuAn_();
  if (!p) return 'ERR:CHUA_MO_DU_AN|';
  try { p.openSequence(String(id)); } catch (e) { return 'ERR:MO_HONG|' + e; }
  var s = null;
  try { s = p.activeSequence; } catch (e1) {}
  if (!s) return 'ERR:MO_KHONG_AN|';
  if (String(s.sequenceID) !== String(id)) return 'ERR:MO_KHONG_AN|' + s.sequenceID;
  return 'OK:' + s.name;
}

/** Track co trong trong khoang [0, daiGiay) khong */
function gf_trackTrong_(track, daiGiay) {
  for (var c = 0; c < track.clips.numItems; c++) {
    var cl = track.clips[c];
    if (cl.start.seconds < daiGiay && cl.end.seconds > 0) return false;
  }
  return true;
}

/** Tim bin 'AiO Guide Frame' o goc project, chua co thi tao */
function gf_binGuide_() {
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    var it = root.children[i];
    if (it.name === 'AiO Guide Frame' && it.type === ProjectItemType.BIN) return it;
  }
  return root.createBin('AiO Guide Frame');
}

/**
 * Dat overlay guide len sequence.
 * duongDanPng: duong dan file PNG (GACH XUOI /), ten file bat dau AIO_GUIDE.
 * batDau/ketThuc (giay, tuy chon): vung In/Out nguoi dung khoanh — guide chi
 * phu dung vung do. Thieu hoac vo ly (ketThuc <= batDau) thi phu ca sequence.
 * Tra: "OK:track=N|batDau=X|ketThuc=Y|daiThuc=Z|daiSeq=T"
 */
function gf_datOverlay(duongDanPng, batDau, ketThuc) {
  var seq = gf_laySeq_();
  if (!seq) return 'ERR:CHUA_MO_SEQ|';

  var f = new File(duongDanPng);
  if (!f.exists) return 'ERR:KHONG_THAY_FILE|' + duongDanPng;

  var tt = gf_thongTinSeq();
  if (tt.indexOf('OK:') !== 0) return tt;
  var daiSeq = parseFloat(tt.split('|')[2]) || 0;
  if (daiSeq <= 0) return 'ERR:SEQ_TRONG|sequence chua co clip nao';

  // Vung chon: kep ve [0, daiSeq]; so vo ly thi roi ve ca sequence (an toan hon bao loi)
  var a = parseFloat(batDau), b = parseFloat(ketThuc);
  if (isNaN(a) || a < 0) a = 0;
  if (isNaN(b) || b > daiSeq) b = daiSeq;
  if (b <= a + 0.01 || a >= daiSeq) { a = 0; b = daiSeq; }
  var daiVung = b - a;

  // 1) Tim track TREN CUNG dang trong. Khong tu them track (QE nguy hiem) —
  //    khong co track trong thi tra ma loi de panel huong dan.
  var soTrack = seq.videoTracks.numTracks;
  var trackDich = -1;
  for (var t = soTrack - 1; t >= 0; t--) {
    if (gf_trackTrong_(seq.videoTracks[t], daiSeq)) { trackDich = t; }
    else break; // gap track co clip thi dung — chi nhan track trong LIEN TIEP tren cung
  }
  if (trackDich < 0) return 'ERR:HET_TRACK|' + soTrack;

  // 2) Import PNG vao bin rieng
  var bin = gf_binGuide_();
  var truoc = bin.children.numItems;
  try {
    app.project.importFiles([duongDanPng], true, bin, false);
  } catch (e) {
    return 'ERR:IMPORT_HONG|' + e;
  }
  if (bin.children.numItems <= truoc) return 'ERR:IMPORT_KHONG_VAO|' + bin.children.numItems;
  var item = bin.children[bin.children.numItems - 1];

  // 3) Keo dai muc tieu: dat out point cua projectItem = do dai VUNG can phu
  //    (anh tinh mac dinh chi ~5s). Khong duoc thi thoi — se bao daiThuc that.
  try { item.setOutPoint(daiVung, 4); } catch (e2) {}

  // 4) Dat len track tai diem dau vung chon. Thu so giay truoc, khong an thi
  //    Time object (bai ac_datClip cua Autocut).
  var track = seq.videoTracks[trackDich];
  var demTruoc = track.clips.numItems;
  var datOk = false, loiDat = '';
  try { track.overwriteClip(item, a); datOk = true; } catch (e3) { loiDat = String(e3); }
  if (!datOk) {
    try {
      var tA = new Time();
      tA.seconds = a;
      track.overwriteClip(item, tA);
      datOk = true;
    } catch (e3b) { return 'ERR:DAT_HONG|' + loiDat + ' | ' + e3b; }
  }
  if (track.clips.numItems <= demTruoc) return 'ERR:DAT_KHONG_VAO|';
  var clip = track.clips[track.clips.numItems - 1];

  // 5) Thu keo dai clip toi het vung chon roi DOC LAI xem co an khong
  var daiThuc = clip.end.seconds - clip.start.seconds;
  if (daiThuc < daiVung - 0.01) {
    try {
      var tEnd = new Time();
      tEnd.seconds = b;
      clip.end = tEnd;
    } catch (e4) {}
    try { daiThuc = clip.end.seconds - clip.start.seconds; } catch (e5) {}
  }

  return 'OK:track=' + (trackDich + 1) + '|batDau=' + a.toFixed(2) + '|ketThuc=' + b.toFixed(2) +
         '|daiThuc=' + daiThuc.toFixed(2) + '|daiSeq=' + daiSeq.toFixed(2);
}

/** Xoa moi clip guide (ten bat dau AIO_GUIDE) khoi moi track video. "OK:xoa=N|conLai=M" */
function gf_tatOverlay() {
  var seq = gf_laySeq_();
  if (!seq) return 'ERR:CHUA_MO_SEQ|';
  var xoa = 0;
  for (var t = 0; t < seq.videoTracks.numTracks; t++) {
    var tr = seq.videoTracks[t];
    for (var c = tr.clips.numItems - 1; c >= 0; c--) { // duyet NGUOC khi xoa
      var cl = tr.clips[c];
      var ten = '';
      try { ten = cl.name; } catch (e) {}
      if (ten.indexOf(GF_TIEN_TO) === 0) {
        try { cl.remove(false, false); xoa++; } catch (e2) {}
      }
    }
  }
  var conLai = gf_demOverlay_();
  // Don projectItem PNG trong bin (sau khi khong con clip nao tham chieu)
  if (conLai === 0) {
    try {
      var root = app.project.rootItem;
      for (var i = root.children.numItems - 1; i >= 0; i--) {
        var it = root.children[i];
        if (it.name === 'AiO Guide Frame' && it.type === ProjectItemType.BIN) {
          it.deleteBin(); // deleteBin hoat dong tren BIN (da do o AiO Transcripts 30/07)
        }
      }
    } catch (e3) {}
  }
  return 'OK:xoa=' + xoa + '|conLai=' + conLai;
}

function gf_demOverlay_() {
  var seq = gf_laySeq_();
  if (!seq) return 0;
  var dem = 0;
  for (var t = 0; t < seq.videoTracks.numTracks; t++) {
    var tr = seq.videoTracks[t];
    for (var c = 0; c < tr.clips.numItems; c++) {
      var ten = '';
      try { ten = tr.clips[c].name; } catch (e) {}
      if (ten.indexOf(GF_TIEN_TO) === 0) dem++;
    }
  }
  return dem;
}

/** Dem clip guide con tren sequence — de panel canh bao truoc khi xuat. "OK:N" */
function gf_demOverlay() {
  var seq = gf_laySeq_();
  if (!seq) return 'ERR:CHUA_MO_SEQ|';
  return 'OK:' + gf_demOverlay_();
}

/**
 * ☠️ Ham nay phai nam CUOI FILE — panel goi sau moi lan $.evalFile de chac
 * ca file da nap tron ven (bai hoc "evalFile nuot file giua chung" 01/08/2026).
 */
function gf_phienBan() {
  return '0.3.0';
}
