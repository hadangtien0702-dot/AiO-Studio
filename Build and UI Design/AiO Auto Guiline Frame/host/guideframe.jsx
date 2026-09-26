/**
 * guideframe.jsx — logic host cua AiO Auto Guiline Frame (v0.3.1)
 *
 * Quy uoc tra ve: "OK:..." / "ERR:MA_LOI|chi tiet" — panel dich ra cau chu.
 * ASCII khong dau (ExtendScript ES3). KHONG dung JSON (host khong co).
 *
 * Nguyen tac an toan (tu skill adobe-cep-panel):
 *  - QE DOM chi dung DUNG MOT lenh, chu ky da co 3 panel khac dung
 *    (`addTracks(1, soTrack, 0, 0)` — them 1 track video len tren cung), goi
 *    xong DOC LAI so track. Khong do tham so khac (QE sai tham so la SAP Premiere).
 *    Doi 25/09/2026: truoc do het track trong thi chi bao loi bat nguoi dung
 *    them tay; anh Tien bao "add khong duoc" tren timeline 11 track day.
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

/** Track co trong trong khoang [tu, den) khong — hoi DUNG KHOANG, khong hoi
    "track rong hoan toan" (skill 6b: timeline dung that thi track nao cung co clip).
    Truoc 25/09/2026 hoi ca sequence [0, daiSeq) ke ca khi da khoanh In/Out. */
function gf_trackTrong_(track, tu, den) {
  for (var c = 0; c < track.clips.numItems; c++) {
    var cl = track.clips[c];
    if (cl.start.seconds < den && cl.end.seconds > tu) return false;
  }
  return true;
}

/**
 * Them MOT track video len TREN CUNG. QE DOM (khong chinh thuc) — dung DUNG chu ky
 * ma Asset Manager / Power Bins / Transcripts dang dung: `addTracks(1, soTrack, 0, 0)`
 * = 1 track video, chen tai chi so = so track hien co (tren cung), 0 track am thanh.
 * Goi xong DOC LAI so track — khong tin lenh. Tra chi so track moi, hoac -1.
 * ☠️ Chi goi DUNG MOT cach, khong do tham so khac (QE sai tham so la SAP Premiere).
 */
function gf_themTrackVideo_(seq) {
  var truoc = -1;
  try { truoc = seq.videoTracks.numTracks; } catch (e1) { return -1; }
  var qs = null;
  try { app.enableQE(); qs = qe.project.getActiveSequence(); } catch (e2) { return -1; }
  if (!qs) return -1;
  // QE lam viec tren sequence DANG HIEN — phai dung la cai minh sap dat guide.
  // (1) So ten bang "xuong ASCII" (bo ky tu ngoai 0x20-0x7E): ten tieng Viet co dau
  //     ("Tap 2") ma QE va DOM ma hoa khac nhau thi van khop; ten khac han van bat duoc.
  // (2) So them SO TRACK video (QE khong lo ID sequence; hai sequence trung ten ma
  //     khac so track thi bat duoc — Codex 25/09). Chi DOC thuoc tinh, khong goi ham.
  try {
    var tenQe = String(qs.name || '').replace(/[^\x20-\x7e]/g, '');
    var tenSeq = String(seq.name || '').replace(/[^\x20-\x7e]/g, '');
    if (tenQe && tenSeq && tenQe !== tenSeq) return -1;
    var nvQe = qs.numVideoTracks;
    if (typeof nvQe === 'number' && nvQe !== truoc) return -1;
  } catch (e0) {}
  // Goi DUNG MOT lenh. Lenh nem loi hay khong deu KHONG tin — doc lai so track
  // ben duoi (QE co the da them xong roi moi nem loi luc tra ve — Codex 25/09).
  try { qs.addTracks(1, truoc, 0, 0); } catch (e3) {}
  var sau = -1;
  try { sau = (gf_laySeq_() || seq).videoTracks.numTracks; } catch (e4) {}
  if (sau < 0) { try { sau = seq.videoTracks.numTracks; } catch (e5) {} }
  if (sau > truoc) return sau - 1;
  return -1;
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
 * Xoa projectItem VUA IMPORT khi dat guide that bai — khong de rac trong bin
 * (Codex bat 25/09/2026). ProjectItem khong co ham xoa truc tiep; duong da do
 * (Transcripts 30/07): bin tam -> moveBin -> deleteBin. Bin guide chi con dung
 * item nay thi xoa ca bin (deleteBin tren bin da do 06/08).
 */
function gf_xoaItemMoi_(bin, item) {
  try {
    if (bin.children.numItems <= 1) { bin.deleteBin(); return true; }
    var tam = app.project.rootItem.createBin('__aio_gf_xoa__');
    item.moveBin(tam);
    tam.deleteBin();
    return true;
  } catch (e) { return false; }
}

/** Don rac that bai thi NOI RA trong chi tiet loi, khong nuot (Codex vong 2, 25/09). */
function gf_ghiDon_(ok) {
  return ok ? '' : ' (khong don duoc anh guide trong bin AiO Guide Frame)';
}

/**
 * Tap ten clip guide (AIO_GUIDE*) dang nam tren MOI sequence cua project — khong
 * chi sequence dang mo. Object dung lam set (ES3 khong co Set). Nhan dien theo TEN
 * clip (= ten item PNG) — cung quy uoc gf_tatOverlay dang dung; clip guide bi doi
 * ten thi tool von da khong nhin thay.
 * ☠️ 25/09/2026: ban cu chi dem sequence DANG MO roi xoa CA BIN -> item cua guide o
 * sequence KHAC mat, clip bien mat. Da xay ra that tren "Tap 2" cua anh Tien
 * (11 -> 10 clip, 13 -> 12 item) khi bai test go guide tren sequence rieng.
 */
function gf_tenGuideDangDung_() {
  var tap = {};
  try {
    var p = app.project;
    for (var i = 0; i < p.sequences.numSequences; i++) {
      var s = p.sequences[i];
      for (var t = 0; t < s.videoTracks.numTracks; t++) {
        var tr = s.videoTracks[t];
        for (var c = 0; c < tr.clips.numItems; c++) {
          var ten = '';
          try { ten = String(tr.clips[c].name); } catch (e1) {}
          if (ten.indexOf(GF_TIEN_TO) === 0) tap[ten] = true;
        }
      }
    }
  } catch (e) {}
  return tap;
}

/**
 * Don bin 'AiO Guide Frame': xoa item KHONG con clip nao tham chieu (o bat ky
 * sequence nao) + xoa file PNG cua item do tren dia; bin rong thi xoa bin.
 * Item dang duoc dung o sequence khac thi GIU. Goi luc go guide va luc bat dau
 * dat guide (don item mo coi do nguoi dung xoa clip bang tay).
 * Tra "xoaItem=K|giuItem=J|xoaFile=F".
 */
var GF_FILE_CHO = []; // file PNG cua item da xoa ma Premiere con giu -> thu xoa lai lan don sau

function gf_donBinGuide_() {
  var xoaItem = 0, giuItem = 0, xoaFile = 0;
  try {
    var root = app.project.rootItem, bin = null;
    for (var i = 0; i < root.children.numItems; i++) {
      var it = root.children[i];
      if (it.name === 'AiO Guide Frame' && it.type === ProjectItemType.BIN) { bin = it; break; }
    }
    if (bin) {
      var dangDung = gf_tenGuideDangDung_();
      var tam = null;
      for (var j = bin.children.numItems - 1; j >= 0; j--) { // duyet NGUOC khi xoa
        var item = bin.children[j];
        var ten = '';
        try { ten = String(item.name); } catch (e1) {}
        if (dangDung[ten]) { giuItem++; continue; }
        var duong = '';
        try { duong = String(item.getMediaPath() || ''); } catch (e2) {}
        try {
          if (!tam) tam = root.createBin('__aio_gf_xoa__');
          item.moveBin(tam);
          xoaItem++;
        } catch (e3) { continue; }
        if (duong) GF_FILE_CHO.push(duong);
      }
      // Xoa bin tam TRUOC roi moi xoa file: item con ton tai (du o bin tam) thi Premiere
      // van giu file -> remove() tra false (do 25/09 15:5x: xoaFile=0 khi xoa truoc).
      if (tam) { try { tam.deleteBin(); } catch (e5) {} }
      if (bin.children.numItems === 0) { try { bin.deleteBin(); } catch (e6) {} }
    }
    // File tren dia cua moi item da xoa (lan nay + lan truoc con giu): xoa duoc thi
    // bo khoi danh sach, khong thi giu lai thu lan sau. Chi trong phien Premiere nay.
    var conCho = [];
    for (var k = 0; k < GF_FILE_CHO.length; k++) {
      var f = null, xong = false;
      try { f = new File(GF_FILE_CHO[k]); if (!f.exists || f.remove()) { xong = true; if (f.exists === false) xoaFile++; } } catch (e4) {}
      if (!xong) conCho.push(GF_FILE_CHO[k]);
    }
    GF_FILE_CHO = conCho;
  } catch (e) {}
  return 'xoaItem=' + xoaItem + '|giuItem=' + giuItem + '|xoaFile=' + xoaFile + '|fileCho=' + GF_FILE_CHO.length;
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

  // 0) Don item mo coi trong bin guide (clip bi xoa tay o sequence nao do) — chi xoa
  //    item KHONG con sequence nao dung, kem file PNG cua no.
  gf_donBinGuide_();

  // 1) Import PNG vao bin rieng TRUOC (doi thu tu 25/09 theo Codex): them track
  //    chi khi chac da co anh — import hong thi chua dung gi toi timeline. Moi loi
  //    tu day tro di phai XOA item vua import (gf_xoaItemMoi_) roi moi tra loi.
  var bin = gf_binGuide_();
  var truoc = bin.children.numItems;
  var loiImport = '';
  try {
    app.project.importFiles([duongDanPng], true, bin, false);
  } catch (e) { loiImport = String(e); }
  var soCon = truoc;
  try { soCon = bin.children.numItems; } catch (eC) {}
  if (loiImport || soCon <= truoc) {
    // Import hong / khong vao: importFiles co the DA dua item vao roi moi nem loi
    // (Codex vong 2) -> don cai lo vao; bin vua tao ma rong thi xoa luon.
    var don0 = true;
    try {
      if (soCon > truoc) don0 = gf_xoaItemMoi_(bin, bin.children[soCon - 1]);
      else if (soCon === 0) bin.deleteBin();
    } catch (e0b) {}
    return (loiImport ? 'ERR:IMPORT_HONG|' + loiImport : 'ERR:IMPORT_KHONG_VAO|' + soCon) + gf_ghiDon_(don0);
  }
  var item = bin.children[soCon - 1];

  // 2) Tim track TREN CUNG dang trong TRONG VUNG [a, b). Chi nhan track trong
  //    LIEN TIEP tren cung (guide phai nam TREN moi clip, khong bi clip che).
  //    Het track thi THEM MOT track moi len tren cung (doi 25/09/2026); them
  //    khong duoc (doc lai so track khong tang) thi moi bao HET_TRACK.
  var soTrack = seq.videoTracks.numTracks;
  var trackDich = -1;
  for (var t = soTrack - 1; t >= 0; t--) {
    if (gf_trackTrong_(seq.videoTracks[t], a, b)) { trackDich = t; }
    else break; // gap track co clip trong vung thi dung
  }
  var themTrack = 0, audioTruoc = 0, audioSau = 0;
  if (trackDich < 0) {
    try { audioTruoc = seq.audioTracks.numTracks; } catch (eA) {}
    if (gf_themTrackVideo_(seq) < 0) { return 'ERR:HET_TRACK|' + soTrack + gf_ghiDon_(gf_xoaItemMoi_(bin, item)); }
    themTrack = 1;
    seq = gf_laySeq_() || seq; // doc lai doi tuong sequence sau khi them track
    try { audioSau = seq.audioTracks.numTracks; } catch (eB) {}
    // KHONG tin "track moi nam tren cung" — TIM LAI track trong tu tren xuong.
    // QE ma chen o cho khac (dau/giua) thi track tren cung van la track co clip
    // cua nguoi dung -> tuyet doi khong de len; tra ma loi rieng de panel noi that.
    // (Track da them thi khong go lai duoc: khong co API chinh thuc, QE khong do —
    // thua mot track trong, khong hai.)
    soTrack = seq.videoTracks.numTracks;
    trackDich = -1;
    for (var t2 = soTrack - 1; t2 >= 0; t2--) {
      if (gf_trackTrong_(seq.videoTracks[t2], a, b)) { trackDich = t2; }
      else break;
    }
    if (trackDich < 0) { return 'ERR:TRACK_MOI_KHONG_TREN_CUNG|' + soTrack + gf_ghiDon_(gf_xoaItemMoi_(bin, item)); }
  }

  // 3) Keo dai muc tieu: dat out point cua projectItem = do dai VUNG can phu
  //    (anh tinh mac dinh chi ~5s). Roi DOC LAI do dai that cua item — khong tin
  //    setOutPoint. Khong doc duoc thi coi nhu dai bang ca sequence (gia dinh xau nhat).
  try { item.setOutPoint(daiVung, 4); } catch (e2) {}
  var daiItem = -1;
  try {
    var oi = item.getOutPoint(4), ii = item.getInPoint(4);
    var oS = (oi && typeof oi.seconds === 'number') ? oi.seconds : -1;
    var iS = (ii && typeof ii.seconds === 'number') ? ii.seconds : 0;
    if (oS > 0) daiItem = oS - iS;
  } catch (e2b) {}
  if (!(daiItem > 0)) daiItem = daiSeq;

  // 3b) Clip se chiem [a, a + daiItem). Dai hon vung [a,b) thi track PHAI trong toi
  //     do — khong thi overwriteClip DE MAT clip cua nguoi dung ngay sau b, vi buoc 2
  //     chi kiem [a,b) (Codex bat 25/09). Khong trong thi KHONG dat, tra loi that.
  var track = seq.videoTracks[trackDich];
  if (daiItem > daiVung + 0.05 && !gf_trackTrong_(track, a, a + daiItem)) {
    var don1 = gf_xoaItemMoi_(bin, item);
    return 'ERR:DAT_HONG|anh dai ' + daiItem.toFixed(2) + 's > vung ' + daiVung.toFixed(2) +
           's ma track V' + (trackDich + 1) + ' co clip ngay sau vung' + gf_ghiDon_(don1);
  }

  // 4) Dat len track tai diem dau vung chon. Thu so giay truoc, khong an thi
  //    Time object (bai ac_datClip cua Autocut).
  var demTruoc = track.clips.numItems;
  var datOk = false, loiDat = '';
  try { track.overwriteClip(item, a); datOk = true; } catch (e3) { loiDat = String(e3); }
  if (!datOk) {
    try {
      var tA = new Time();
      tA.seconds = a;
      track.overwriteClip(item, tA);
      datOk = true;
    } catch (e3b) { return 'ERR:DAT_HONG|' + loiDat + ' | ' + e3b + gf_ghiDon_(gf_xoaItemMoi_(bin, item)); }
  }
  if (track.clips.numItems <= demTruoc) { return 'ERR:DAT_KHONG_VAO|' + gf_ghiDon_(gf_xoaItemMoi_(bin, item)); }
  var clip = track.clips[track.clips.numItems - 1];

  // 5) Doc lai do dai clip da dat. Ngan hon vung thi thu keo dai; DAI hon vung
  //    (setOutPoint khong an) thi cat ve b. Doc lai lan nua xem co an khong.
  //    Clip DA nam tren timeline: doc hong thi KHONG xoa item (clip dang tham chieu),
  //    coi nhu dai bang vung va van tra OK (Codex vong 2).
  var daiThuc = daiVung;
  try { daiThuc = clip.end.seconds - clip.start.seconds; } catch (e4a) {}
  if (daiThuc < daiVung - 0.01 || daiThuc > daiVung + 0.05) {
    try {
      var tEnd = new Time();
      tEnd.seconds = b;
      clip.end = tEnd;
    } catch (e4) {}
    try { daiThuc = clip.end.seconds - clip.start.seconds; } catch (e5) {}
  }

  // themTrack=1: panel bao "da them track"; themAudio: QE co lo them track tieng
  // khong (chu ky nay khong them, nhung doc lai de chac — khong tin lenh).
  return 'OK:track=' + (trackDich + 1) + '|batDau=' + a.toFixed(2) + '|ketThuc=' + b.toFixed(2) +
         '|daiThuc=' + daiThuc.toFixed(2) + '|daiSeq=' + daiSeq.toFixed(2) +
         '|themTrack=' + themTrack + '|themAudio=' + (audioSau - audioTruoc) +
         '|daiItem=' + daiItem.toFixed(2);
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
  // Don item PNG: CHI item khong con clip nao o BAT KY sequence nao tham chieu.
  // ☠️ Ban truoc 25/09: conLai (sequence DANG MO) == 0 thi xoa CA BIN -> guide cua
  // sequence khac mat item + clip. Xem gf_tenGuideDangDung_.
  var don = gf_donBinGuide_();
  return 'OK:xoa=' + xoa + '|conLai=' + conLai + '|' + don;
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
  return '0.3.1';
}
