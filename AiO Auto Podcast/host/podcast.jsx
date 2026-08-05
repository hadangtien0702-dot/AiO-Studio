/**
 * AiO Auto Podcast - host ExtendScript.
 * File nay viet ASCII khong dau (quy uoc bo AiO: ExtendScript hay vo font).
 * Host tra MA + du lieu dong "khoa=gia tri"; panel viet cau tieng Viet.
 *
 * KIEN TRUC v0.2 - doi 01/08/2026 sau phan hoi anh Tien:
 *   "khi anh bam dung thi timeline cua anh phai duoc CAT theo ban dung —
 *    cam va voice nguoi nao noi thi cut do"
 *   (trung voi chuan nghe: AutoPod cat TAI CHO tren cau truc track xep chong,
 *    khong don phang ve mot track)
 *
 *   Duong dung moi:
 *     1. pc_nhanBan: NHAN BAN sequence nguon (clone — giu nguyen settings,
 *        so track, ten track) roi GO SACH clip tren ban sao. Ban goc nguyen.
 *     2. pc_datHinh: dat tung doan cam len DUNG TRACK GOC cua cam do, tai
 *        DUNG VI TRI thoi gian goc (khong don, khong doi nhip) — nhin nhu
 *        timeline bi cat: cam ai noi thi doan do con tren track nguoi do.
 *     3. pc_donTieng: go tieng cam bi keo theo overwriteClip.
 *     4. pc_datTieng: dat tieng mic tung doan len DUNG TRACK GOC cua mic.
 *     5. pc_doKetQua: DO LAI tung track, khong tin "khong bao loi".
 *
 * ☠️ DEM OUT +0.05s cho ca hinh lan tieng — do that 01/08: item luu in/out
 * HUT xuong luoi (WAV ~0.025s), dat len track tron XUONG khung -> hut 1
 * khung. Doan sau CUNG track dat theo thu tu tang se cat duoi dem cua doan
 * truoc; doan sau KHAC track thi duoi dem chi de lai overlap <=1 khung
 * (khong ho den — ho den lo ro hon nhieu so voi tre 1 khung).
 *
 * Cac ham pc_* goi theo LO nho tu panel de Premiere khong dung hinh va
 * panel bao duoc tien do. pc__c song giua cac evalScript; pc_nhanBan reset.
 */

function pc_err(where, e) {
  return 'ERR:NGOAI_LE|' + where + ': ' + e.toString();
}

/** TU LUU project truoc MOI thao tac ghi timeline (chuan bo AiO 01/08). */
function pc__luuTruoc() {
  try { app.project.save(); return true; } catch (e) { return false; }
}

/** Ten sequence khong duoc trung (bai hoc Re-Frames 31/07). */
function pc__tenKhongTrung(goc) {
  var co = {};
  for (var i = 0; i < app.project.sequences.numSequences; i++) {
    co[String(app.project.sequences[i].name)] = true;
  }
  if (!co[goc]) return goc;
  for (var n = 2; n < 99; n++) {
    var thu = goc + ' (' + n + ')';
    if (!co[thu]) return thu;
  }
  return goc + ' (' + new Date().getTime() + ')';
}

/**
 * Danh sach item DA DUNG trong lo hien tai — chi de don in/out sau lo.
 * ☠️ KHONG con CACHE tra cuu (bo 05/08/2026 theo lenh anh Tien "remove cache").
 * Cache cu ghim ket qua theo duong dan: bat nham MOT lan la nham SUOT PHIEN,
 * va moi lan goi sau deu tra ve dung cai sai do ma khong ai do lai duoc.
 */
var pc__c = {};

/**
 * Tim project item theo duong dan media (de quy moi cap folder/bin).
 *
 * ☠️☠️ CHI CHAP NHAN KHOP CHAC CHAN — do that 05/08/2026 tren project
 * "Quay PV tuyen dung_DRT_1002" cua anh Tien:
 *
 *   Ban cu con giu luat "chuoi con" (diem 1) lam phuong an cuoi. Nguoi dung
 *   dat ten SEQUENCE trung ten THU MUC quay ("Quay PV tuyen dung_DRT_1002"),
 *   ma ten thu muc do nam trong duong dan cua MOI file trong buoi quay. Nen
 *   moi file CHUA duoc nhap deu "khop" vao cai sequence do voi diem 1.
 *   Hau qua do duoc: pc_nhapMono tuong 2 file mic mono da co san -> khong
 *   nhap gi -> pc_datTieng dat CA MOT SEQUENCE 31 phut len A1/A2; vi no la
 *   clip co ca hinh, Premiere tha hinh xuong V1/V2 -> nuot 135/299 nhat cat.
 *
 * Ba luat cung tu day:
 *   1. Chi diem 4 (duong dan trung tuyet doi) va 3 (ten file trung tuyet doi)
 *      moi duoc tinh. BO HAN luat chuoi con — khop yeu thi tha tra null.
 *   2. Item KHONG CO duong dan media (sequence, bin, title, mau...) khong bao
 *      gio la ung vien khi dang do theo duong dan FILE.
 *   3. Khong cache — do lai moi lan (project chi vai chuc item, khong dang ke).
 */
function pc__item(duong) {
  if (!duong) return null;
  var chuan = String(duong).replace(/\\/g, '/').toLowerCase();
  var tenChuan = chuan.replace(/^.*\//, '');
  if (!tenChuan) return null;

  /**
   * Cham diem mot ung vien, KHONG tra true/false.
   *   4 = duong dan media trung khop tuyet doi  (chac chan dung)
   *   3 = ten file trung khop tuyet doi         (media da doi o/thu muc)
   *   0 = khong lien quan
   */
  function cham(item) {
    try {
      if (!item) return 0;
      if (typeof item.getMediaPath !== 'function') return 0;
      var p = String(item.getMediaPath()).replace(/\\/g, '/').toLowerCase();
      if (!p) return 0;              // luat 2: khong co file thi khong xet
      if (p === chuan) return 4;
      if (p.replace(/^.*\//, '') === tenChuan) return 3;
    } catch (e) {}
    return 0;
  }

  var tot = null, diemTot = 0;
  function duyetBin(folder) {
    if (!folder || !folder.children) return;
    for (var k = 0; k < folder.children.numItems; k++) {
      var it = folder.children[k];
      var d = cham(it);
      if (d > diemTot) { diemTot = d; tot = it; if (d === 4) return; }
      if (it && it.children && it.children.numItems > 0) {
        duyetBin(it);
        if (diemTot === 4) return;
      }
    }
  }

  duyetBin(app.project.rootItem);
  if (tot) pc__c[chuan] = tot;       // chi de pc__donInOut don lai in/out
  return tot;
}

/** Lam sach chuoi de nhet vao dong du lieu co dau | phan cach. */
function pc__sach(s) {
  return String(s).replace(/\|/g, '/').replace(/[\r\n]/g, ' ');
}

/** Xoa het in/out tren cac item da dung — don sau moi lo. */
function pc__donInOut() {
  try {
    for (var k in pc__c) {
      if (pc__c.hasOwnProperty(k)) { pc__c[k].clearInPoint(); pc__c[k].clearOutPoint(); }
    }
  } catch (e) {}
}

/**
 * Sequence dang active phai DUNG la ban dang dung — nguoi dung bam sang
 * sequence khac giua chung la moi lenh ghi se pha nham cho. Kiem TEN
 * truoc moi lo; lech thi dung ngay, khong ghi them dong nao.
 */
/**
 * ☠️ SUA 05/08/2026 — chot cu GIET NUA CHUNG mot ban dung dung.
 * Ca that: anh Tien bam sang tab sequence khac trong luc panel dang dat clip
 * -> activeSequence doi -> moi lo sau tra ERR:SEQ_DOI -> bo lai mot sequence
 * dung do (260 clip hinh, chua don tieng cam, chua co mic).
 *
 * Chot ton tai de KHONG BAO GIO ghi nham vao sequence cua nguoi dung. Muc
 * tieu do van giu nguyen neu ta khoa theo TEN ban dung (ten do panel dat, tu
 * chong trung, duy nhat trong project): tim dung sequence mang ten do roi
 * GHIM LAI activeSequence. Chi bao loi khi khong con sequence nao mang ten ay
 * — luc do moi thuc su la "mat dich", va dung tay ngay.
 */
function pc__seqDangDung(tenSeq) {
  var seq = app.project.activeSequence;
  if (seq && String(seq.name) === String(tenSeq)) return seq;
  try {
    var n = app.project.sequences ? (app.project.sequences.numSequences || 0) : 0;
    for (var i = 0; i < n; i++) {
      if (String(app.project.sequences[i].name) === String(tenSeq)) {
        app.project.activeSequence = app.project.sequences[i];
        var lai = app.project.activeSequence;
        if (lai && String(lai.name) === String(tenSeq)) return lai;
        return app.project.sequences[i];
      }
    }
  } catch (e) {}
  return null;
}

/** Dem OUT chong hut khung — xem khoi ghi chu dau file. */
var PC_DEM = 0.05;

/**
 * Doc trang thai re — panel goi moi giay. CHI DOC.
 * Tra "OK:ver|project|seqName|WxH|soTrackV|soTrackA".
 */
function pc_trangThai() {
  try {
    var v = String(app.version);
    var p = (app.project && app.project.name) ? String(app.project.name) : '';
    var s = app.project ? app.project.activeSequence : null;
    // Truong thu 7: DANH SACH sequence trong project, cach nhau ';;'.
    // ☠️ Vi sao co - anh Tien 04/08: mo ca chuc sequence thi panel tu bam
    // activeSequence lam viec SAI CHO, "khong duoc chon dung sequence lam
    // viec cua minh". Panel dung danh sach nay ve o CHON sequence.
    var ds = [];
    try {
      var n = app.project.sequences ? (app.project.sequences.numSequences || 0) : 0;
      for (var i = 0; i < n; i++) {
        ds.push(pc__sach(String(app.project.sequences[i].name)));
      }
    } catch (e2) {}
    if (!s) return 'OK:' + v + '|' + p + '|||||' + ds.join(';;');
    var st = s.getSettings();
    return 'OK:' + v + '|' + pc__sach(p) + '|' + pc__sach(s.name) + '|' +
      st.videoFrameWidth + 'x' + st.videoFrameHeight + '|' +
      s.videoTracks.numTracks + '|' + s.audioTracks.numTracks + '|' +
      ds.join(';;');
  } catch (e) {
    return 'OK:||||||';
  }
}

/**
 * CHON sequence lam viec theo TEN — nguoi dung chon tren panel thay vi
 * tool tu bam activeSequence. Doi activeSequence de moi duong san co
 * (pc__seqDangDung, pc_thongTinSeq, chot SEQ_DOI) van dung nguyen.
 */
function pc_chonSeq(ten) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var n = app.project.sequences ? (app.project.sequences.numSequences || 0) : 0;
    for (var i = 0; i < n; i++) {
      if (pc__sach(String(app.project.sequences[i].name)) === String(ten)) {
        app.project.activeSequence = app.project.sequences[i];
        return 'OK:seq=' + pc__sach(String(app.project.activeSequence.name));
      }
    }
    return 'ERR:KHONG_THAY_SEQ|' + pc__sach(String(ten));
  } catch (e) {
    return pc_err('pc_chonSeq', e);
  }
}

/**
 * Liet ke track cua sequence dang mo — cho buoc GAN cam/mic. CHI DOC.
 * Moi track mot dong:
 *   V|chiSo|tenTrack|soClip|tenClipDau|duongMedia|batDauGiay|inPointGiay|ketThucGiay
 *   A|... (y het)
 * Track khong co clip thi 3 truong cuoi de trong.
 */
function pc_thongTinSeq() {
  try {
    var s = app.project.activeSequence;
    if (!s) return 'ERR:CHUA_MO_SEQUENCE|';
    var out = ['seq=' + pc__sach(s.name)];
    function taTrack(loai, tr, i) {
      var d = loai + '|' + i + '|' + pc__sach(tr.name) + '|' + tr.clips.numItems;
      if (tr.clips.numItems > 0) {
        var c = tr.clips[0];
        var duong = '';
        try { duong = String(c.projectItem.getMediaPath()); } catch (e1) {}
        d += '|' + pc__sach(c.name) + '|' + pc__sach(duong) +
          '|' + c.start.seconds.toFixed(4) +
          '|' + c.inPoint.seconds.toFixed(4) +
          '|' + c.end.seconds.toFixed(4);
      } else {
        d += '|||||';
      }
      return d;
    }
    for (var t = 0; t < s.videoTracks.numTracks; t++) out.push(taTrack('V', s.videoTracks[t], t));
    for (var a = 0; a < s.audioTracks.numTracks; a++) out.push(taTrack('A', s.audioTracks[a], a));
    return 'OK:' + out.join('\n');
  } catch (e) {
    return pc_err('pc_thongTinSeq', e);
  }
}

/**
 * Buoc 1: NHAN BAN sequence nguon roi GO SACH clip tren ban sao.
 * Ban sao giu nguyen settings + so track + ten track — nhin y het timeline
 * cua nguoi dung, chi khac la sap duoc "cat" theo nguoi noi.
 * @param tenGoc  ten sequence nguon (phai dang active — chot an toan)
 * @param tenMoi  ten ban dung, ASCII (se tu chong trung)
 * Tra "OK:seq=<ten that>|clipsGo=<so clip da go>".
 */
function pc_nhanBan(tenGoc, tenMoi) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var goc = pc__seqDangDung(tenGoc);
    if (!goc) return 'ERR:SEQ_DOI|';
    pc__c = {};
    pc__luuTruoc();

    // Nhan ban — tim ban sao bang HIEU so ID truoc/sau (duong Re-Frames).
    var idCu = {};
    var i;
    for (i = 0; i < app.project.sequences.numSequences; i++) {
      idCu[String(app.project.sequences[i].sequenceID)] = true;
    }
    try { goc.clone(); } catch (e) { return 'ERR:CLONE_LOI|' + e.toString(); }
    var ban = null;
    for (i = 0; i < app.project.sequences.numSequences; i++) {
      if (!idCu[String(app.project.sequences[i].sequenceID)]) { ban = app.project.sequences[i]; break; }
    }
    if (!ban) return 'ERR:CLONE_KHONG_RA_SEQ|';
    try { ban.name = pc__tenKhongTrung(String(tenMoi)); } catch (e2) {}
    app.project.activeSequence = ban;

    // Go sach clip — duyet NGUOC tung track (remove khong keo clip lien ket,
    // da do 01/08: go tieng 10->0 ma hinh nguyen 10/10).
    var daGo = 0, soLoi = 0, loiDau = '';
    function goTrack(tr) {
      for (var c = tr.clips.numItems - 1; c >= 0; c--) {
        try { tr.clips[c].remove(false, false); daGo++; }
        catch (e3) { soLoi++; if (!loiDau) loiDau = e3.toString(); }
      }
    }
    for (var t = 0; t < ban.videoTracks.numTracks; t++) goTrack(ban.videoTracks[t]);
    for (var a = 0; a < ban.audioTracks.numTracks; a++) goTrack(ban.audioTracks[a]);

    // DO LAI: ban sao phai TRONG TRON truoc khi dat lai.
    var con = 0;
    for (var t2 = 0; t2 < ban.videoTracks.numTracks; t2++) con += ban.videoTracks[t2].clips.numItems;
    for (var a2 = 0; a2 < ban.audioTracks.numTracks; a2++) con += ban.audioTracks[a2].clips.numItems;
    if (con > 0) return 'ERR:GO_KHONG_SACH|con=' + con + ' loiDau=' + loiDau;
    return 'OK:seq=' + ban.name + '|clipsGo=' + daGo;
  } catch (e) {
    return pc_err('pc_nhanBan', e);
  }
}

/**
 * Dat mot LO doan HINH — moi doan len DUNG TRACK cua cam do, tai DUNG VI TRI
 * thoi gian goc (tuyet doi, khong don).
 * @param tenSeq  ten ban dung (chot SEQ_DOI)
 * @param dsStr   "trackV,duongCam,mediaTu,mediaDen,segTu;..."
 * Tra "OK:daDat=n|soLoi=k|loiDau=...".
 */
function pc_datHinh(tenSeq, dsStr) {
  try {
    var seq = pc__seqDangDung(tenSeq);
    if (!seq) return 'ERR:SEQ_DOI|';
    var daDat = 0, soLoi = 0, loiDau = '';
    var manh = String(dsStr).split(';');
    for (var i = 0; i < manh.length; i++) {
      if (!manh[i]) continue;
      var ph = manh[i].split(',');
      if (ph.length !== 5) { soLoi++; if (!loiDau) loiDau = 'dinh dang: ' + manh[i]; continue; }
      var tIdx = parseInt(ph[0], 10);
      if (!(tIdx >= 0)) { soLoi++; if (!loiDau) loiDau = 'track V' + ph[0]; continue; }
      var targetTrack = tIdx < seq.videoTracks.numTracks ? tIdx : (seq.videoTracks.numTracks - 1);
      var pi = pc__item(ph[1]);
      if (!pi) { soLoi++; if (!loiDau) loiDau = 'khong thay item: ' + ph[1]; continue; }
      try { pi.setInPoint(parseFloat(ph[2]), 4); pi.setOutPoint(parseFloat(ph[3]) + PC_DEM, 4); }
      catch (e1) { soLoi++; if (!loiDau) loiDau = 'setInOut: ' + e1; continue; }
      try { seq.videoTracks[targetTrack].overwriteClip(pi, parseFloat(ph[4])); daDat++; }
      catch (e2) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + e2; }
    }
    pc__donInOut();
    return 'OK:daDat=' + daDat + '|soLoi=' + soLoi + '|loiDau=' + loiDau;
  } catch (e) {
    return pc_err('pc_datHinh', e);
  }
}

/**
 * DON het clip TIENG dang nam tren ban dung (tieng cam keo theo overwriteClip).
 * Do lai truoc/sau — ca so clip HINH nua, vi clip lien ket co the keo nhau.
 * Tra "OK:tiengTruoc=..|tiengSau=..|hinhTruoc=..|hinhSau=..|soLoi=..|loiDau=..".
 */
function pc_donTieng(tenSeq) {
  try {
    var seq = pc__seqDangDung(tenSeq);
    if (!seq) return 'ERR:SEQ_DOI|';
    function demTieng() {
      var n = 0;
      for (var a = 0; a < seq.audioTracks.numTracks; a++) n += seq.audioTracks[a].clips.numItems;
      return n;
    }
    function demHinh() {
      var n = 0;
      for (var t = 0; t < seq.videoTracks.numTracks; t++) n += seq.videoTracks[t].clips.numItems;
      return n;
    }
    var tiengTruoc = demTieng();
    var hinhTruoc = demHinh();
    var soLoi = 0, loiDau = '';
    for (var a2 = 0; a2 < seq.audioTracks.numTracks; a2++) {
      var tr = seq.audioTracks[a2];
      for (var c = tr.clips.numItems - 1; c >= 0; c--) {
        try { tr.clips[c].remove(false, false); }
        catch (e1) { soLoi++; if (!loiDau) loiDau = e1.toString(); }
      }
    }
    return 'OK:tiengTruoc=' + tiengTruoc + '|tiengSau=' + demTieng() +
      '|hinhTruoc=' + hinhTruoc + '|hinhSau=' + demHinh() +
      '|soLoi=' + soLoi + '|loiDau=' + loiDau;
  } catch (e) {
    return pc_err('pc_donTieng', e);
  }
}

/**
 * Dat mot LO tieng MIC — moi doan len DUNG TRACK cua mic do, vi tri tuyet doi.
 * @param tenSeq  ten ban dung (chot SEQ_DOI)
 * @param dsStr   "trackA,duongMic,mediaTu,mediaDen,segTu;..."
 * Tra "OK:daDat=n|soLoi=k|loiDau=...".
 */
function pc_datTieng(tenSeq, dsStr) {
  try {
    var seq = pc__seqDangDung(tenSeq);
    if (!seq) return 'ERR:SEQ_DOI|';
    var daDat = 0, soLoi = 0, loiDau = '';
    var manh = String(dsStr).split(';');
    for (var i = 0; i < manh.length; i++) {
      if (!manh[i]) continue;
      var ph = manh[i].split(',');
      if (ph.length !== 5) { soLoi++; if (!loiDau) loiDau = 'dinh dang: ' + manh[i]; continue; }
      var aIdx = parseInt(ph[0], 10);
      if (!(aIdx >= 0) || aIdx >= seq.audioTracks.numTracks) {
        soLoi++; if (!loiDau) loiDau = 'track A' + ph[0] + ' / ' + seq.audioTracks.numTracks;
        continue;
      }
      var pi = pc__item(ph[1]);
      if (!pi) { soLoi++; if (!loiDau) loiDau = 'khong thay item: ' + ph[1]; continue; }
      try { pi.setInPoint(parseFloat(ph[2]), 4); pi.setOutPoint(parseFloat(ph[3]) + PC_DEM, 4); }
      catch (e1) { soLoi++; if (!loiDau) loiDau = 'setInOut: ' + e1; continue; }
      try { seq.audioTracks[aIdx].overwriteClip(pi, parseFloat(ph[4])); daDat++; }
      catch (e2) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + e2; }
    }
    pc__donInOut();
    return 'OK:daDat=' + daDat + '|soLoi=' + soLoi + '|loiDau=' + loiDau;
  } catch (e) {
    return pc_err('pc_datTieng', e);
  }
}

/**
 * DO LAI ket qua — khong tin "khong bao loi" (bai hoc 5l).
 * Tra tung track: "OK:seq=..|V0=n|V1=n|..|A0=n|..|tongHinh=..|tongTieng=..
 *                  |cuoiHinh=..|cuoiTieng=.."
 */
function pc_doKetQua(tenSeq) {
  try {
    var seq = pc__seqDangDung(tenSeq);
    if (!seq) return 'ERR:SEQ_DOI|';
    var out = ['seq=' + pc__sach(seq.name)];
    var tongHinh = 0, tongTieng = 0, cuoiHinh = 0, cuoiTieng = 0;
    // ☠️ DEM KHONG PHAI LA KIEM (bai hoc 5k) — ban cu chi dem so clip nen
    // bao "tieng 2/2 dat" trong khi CA HAI clip tieng deu la mot sequence
    // lang nhang bi dat nham. Nay dem them clip KHONG CO FILE MEDIA: mot
    // ban dung dung thi con so nay phai bang 0.
    var hinhLa = 0, tiengLa = 0, tenLa = '';
    function laKhongFile(cl) {
      try {
        var p = String(cl.projectItem.getMediaPath());
        if (!p) { if (!tenLa) tenLa = pc__sach(String(cl.projectItem.name)); return true; }
      } catch (e) { if (!tenLa) tenLa = '(khong doc duoc)'; return true; }
      return false;
    }
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
      var trV = seq.videoTracks[t];
      out.push('V' + t + '=' + trV.clips.numItems);
      tongHinh += trV.clips.numItems;
      for (var c = 0; c < trV.clips.numItems; c++) {
        var e1 = trV.clips[c].end.seconds;
        if (e1 > cuoiHinh) cuoiHinh = e1;
        if (laKhongFile(trV.clips[c])) hinhLa++;
      }
    }
    for (var a = 0; a < seq.audioTracks.numTracks; a++) {
      var trA = seq.audioTracks[a];
      out.push('A' + a + '=' + trA.clips.numItems);
      tongTieng += trA.clips.numItems;
      for (var c2 = 0; c2 < trA.clips.numItems; c2++) {
        var e2 = trA.clips[c2].end.seconds;
        if (e2 > cuoiTieng) cuoiTieng = e2;
        if (laKhongFile(trA.clips[c2])) tiengLa++;
      }
    }
    out.push('tongHinh=' + tongHinh);
    out.push('tongTieng=' + tongTieng);
    out.push('cuoiHinh=' + cuoiHinh.toFixed(3));
    out.push('cuoiTieng=' + cuoiTieng.toFixed(3));
    out.push('hinhLa=' + hinhLa);
    out.push('tiengLa=' + tiengLa);
    out.push('tenLa=' + tenLa);
    return 'OK:' + out.join('|');
  } catch (e) {
    return pc_err('pc_doKetQua', e);
  }
}

/**
 * NHAP cac file tieng MONO vao project, tra ve so item tim thay.
 *
 * ☠️ VI SAO PHAI CO — do that 04/08/2026.
 * File mic cua nguoi dung thuong la STEREO (mp3 dual-mono: L va R giong
 * het nhau, do duoc ca hai deu -50,6 dB). Dat mot clip STEREO len track
 * audio thi Premiere TACH 2 KENH ra 2 TRACK lien tiep:
 *
 *     Mic-Trong  -> A1 + A2       (A1 kenh L, A2 kenh R)
 *     Mic-Dilys  -> A2 + A3
 *     => A2 chua CA HAI nguoi, va Premiere de ra them track A4
 *
 * Do bang thuc nghiem tren sequence THU rieng:
 *     dat mp3 STEREO vao A1  -> clip = [1, 1]   <- TRAN sang A2
 *     dat WAV MONO  vao A2   -> clip = [1, 2]   <- nam gon 1 track
 *
 * `getAudioChannelMapping()` KHONG ton tai trong Premiere Beta 26.5 (da
 * thu, tra ReferenceError) nen khong ep kieu kenh bang API duoc. Duong
 * con lai: panel tach san file MONO bang FFmpeg roi nhap file do.
 *
 * Dung ban chat: mic cai ao VON LA MONO, cai vo stereo chi la tieng nhan
 * doi. Chuyen ve mono khong mat gi.
 *
 * @param dsStr  duong dan cach nhau bang ';'
 */
function pc_nhapMono(dsStr) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var duong = String(dsStr).split(';');
    var canNhap = [];
    var i;
    // Chi nhap file CHUA co trong project — nhap lai la de ra item trung.
    for (i = 0; i < duong.length; i++) {
      if (!duong[i]) continue;
      if (!pc__item(duong[i])) canNhap.push(duong[i]);
    }
    if (canNhap.length) {
      var bin = null;
      try {
        var root = app.project.rootItem;
        for (var b = 0; b < root.children.numItems; b++) {
          if (String(root.children[b].name) === 'AiO Podcast - tieng mono') {
            bin = root.children[b]; break;
          }
        }
        if (!bin) bin = root.createBin('AiO Podcast - tieng mono');
      } catch (e) { bin = app.project.rootItem; }
      try { app.project.importFiles(canNhap, true, bin, false); }
      catch (e2) { return 'ERR:NHAP_LOI|' + e2.toString(); }
    }
    // DO LAI — khong tin "khong bao loi" la da nhap (bai hoc 5l).
    pc__c = {};
    var thay = 0, thieu = '';
    for (i = 0; i < duong.length; i++) {
      if (!duong[i]) continue;
      if (pc__item(duong[i])) thay++;
      else if (!thieu) thieu = duong[i];
    }
    return 'OK:daNhap=' + canNhap.length + '|thay=' + thay + '|thieu=' + thieu;
  } catch (e) {
    return pc_err('pc_nhapMono', e);
  }
}

/**
 * To NHAN MAU cho projectItem theo duong dan — cam + mic cua CUNG MOT NGUOI
 * cung mot mau, timeline tu ke chuyen "doan nay cua ai". Anh Tien 04/08:
 * "track audio va video deu mau nhau, anh nhin vao khong biet duoc ai het".
 * To o muc PROJECT ITEM: moi clip cat ra tu file do (o moi sequence) deu
 * mang mau nguoi do — 103 nhat cat chi ton vai cu goi.
 * @param dsStr "duong,label;duong,label;..."  (label 0-15 cua Premiere)
 * Tra "OK:daTo=n|khongThay=k|hoTro=0/1" — hoTro=0 la Premiere khong co API.
 */
function pc_toMau(dsStr) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var manh = String(dsStr).split(';');
    var daTo = 0, khongThay = 0, hoTro = -1;
    for (var i = 0; i < manh.length; i++) {
      if (!manh[i]) continue;
      var ph = manh[i].split(',');
      if (ph.length !== 2) continue;
      var pi = pc__item(ph[0]);
      if (!pi) { khongThay++; continue; }
      if (hoTro === -1) hoTro = (typeof pi.setColorLabel === 'function') ? 1 : 0;
      if (hoTro !== 1) continue;
      try { pi.setColorLabel(parseInt(ph[1], 10)); daTo++; } catch (e1) {}
    }
    return 'OK:daTo=' + daTo + '|khongThay=' + khongThay + '|hoTro=' + (hoTro === 1 ? 1 : 0);
  } catch (e) {
    return pc_err('pc_toMau', e);
  }
}

/**
 * Doc TAT CA clip tren moi track V va A cua sequence.
 */
function pc_docChiTietClips() {
  try {
    var s = app.project.activeSequence;
    if (!s) return 'ERR:CHUA_MO_SEQUENCE|';
    var out = ['seq=' + pc__sach(s.name)];
    var t, c, tr, cl, duong;
    for (t = 0; t < s.videoTracks.numTracks; t++) {
      tr = s.videoTracks[t];
      for (c = 0; c < tr.clips.numItems; c++) {
        cl = tr.clips[c];
        duong = '';
        try { duong = String(cl.projectItem.getMediaPath()); } catch (e1) {}
        out.push('V|' + t + '|' + c + '|' + pc__sach(cl.name) + '|' + pc__sach(duong) +
          '|' + cl.start.seconds.toFixed(4) +
          '|' + cl.inPoint.seconds.toFixed(4) +
          '|' + cl.end.seconds.toFixed(4));
      }
    }
    for (t = 0; t < s.audioTracks.numTracks; t++) {
      tr = s.audioTracks[t];
      for (c = 0; c < tr.clips.numItems; c++) {
        cl = tr.clips[c];
        duong = '';
        try { duong = String(cl.projectItem.getMediaPath()); } catch (e2) {}
        out.push('A|' + t + '|' + c + '|' + pc__sach(cl.name) + '|' + pc__sach(duong) +
          '|' + cl.start.seconds.toFixed(4) +
          '|' + cl.inPoint.seconds.toFixed(4) +
          '|' + cl.end.seconds.toFixed(4));
      }
    }
    return 'OK:' + out.join('\n');
  } catch (e) {
    return pc_err('pc_docChiTietClips', e);
  }
}

/**
 * Sap xep clips len tracks.
 */
function pc_sapXepClipsLenTrack(tenSeq, lenhXepStr) {
  try {
    var seq = pc__seqDangDung(tenSeq);
    if (!seq) return 'ERR:SEQ_DOI|';
    pc__luuTruoc();

    var manh = String(lenhXepStr).split(';');
    var vLenh = [], aLenh = [];
    var i, ph;

    for (i = 0; i < manh.length; i++) {
      if (!manh[i]) continue;
      ph = manh[i].split(',');
      if (ph.length !== 6) continue;
      if (ph[0] === 'V') vLenh.push(ph);
      else if (ph[0] === 'A') aLenh.push(ph);
    }

    // ☠️ TIM DU ITEM TRUOC KHI XOA BAT CU THU GI.
    // Ban truoc 05/08 xoa sach moi clip tren moi track ROI moi di tim project
    // item de dat lai — tim truot cai nao (media offline, ten file co ky tu la
    // kieu U+F022 tu Mac) thi clip do BAY LUON khoi timeline that cua nguoi
    // dung, khong tu hoan tac duoc. Nay quet kho truoc: thieu mot item la
    // tra loi ngay, timeline khong bi dung toi mot dong nao.
    var kho = {}, thieu = [];
    for (i = 0; i < manh.length; i++) {
      if (!manh[i]) continue;
      ph = manh[i].split(',');
      if (ph.length !== 6) continue;
      if (kho[ph[2]] !== undefined) continue;
      var piTim = pc__item(ph[2]);
      kho[ph[2]] = piTim || null;
      if (!piTim) thieu.push(String(ph[2]).replace(/^.*[\\\/]/, ''));
    }
    if (thieu.length) {
      return 'ERR:THIEU_ITEM|so=' + thieu.length + '|ds=' + pc__sach(thieu.join(', '));
    }

    var t, c, tr;
    for (t = 0; t < seq.videoTracks.numTracks; t++) {
      tr = seq.videoTracks[t];
      for (c = tr.clips.numItems - 1; c >= 0; c--) {
        try { tr.clips[c].remove(false, false); } catch (e1) {}
      }
    }
    for (t = 0; t < seq.audioTracks.numTracks; t++) {
      tr = seq.audioTracks[t];
      for (c = tr.clips.numItems - 1; c >= 0; c--) {
        try { tr.clips[c].remove(false, false); } catch (e2) {}
      }
    }

    var daDat = 0, soLoi = 0, loiDau = '';
    var pi, tIdx, inPt, outPt, startSec;

    for (i = 0; i < vLenh.length; i++) {
      ph = vLenh[i];
      tIdx = parseInt(ph[1], 10);
      pi = kho[ph[2]];
      if (!pi) { soLoi++; if (!loiDau) loiDau = 'khong thay pi: ' + ph[2]; continue; }
      inPt = parseFloat(ph[3]); outPt = parseFloat(ph[4]); startSec = parseFloat(ph[5]);
      try { pi.setInPoint(inPt, 4); pi.setOutPoint(outPt + PC_DEM, 4); } catch (e3) {}
      if (tIdx >= 0 && tIdx < seq.videoTracks.numTracks) {
        try { seq.videoTracks[tIdx].overwriteClip(pi, startSec); daDat++; }
        catch (e4) { soLoi++; if (!loiDau) loiDau = e4.toString(); }
      }
    }

    for (t = 0; t < seq.audioTracks.numTracks; t++) {
      tr = seq.audioTracks[t];
      for (c = tr.clips.numItems - 1; c >= 0; c--) {
        try { tr.clips[c].remove(false, false); } catch (e5) {}
      }
    }

    for (i = 0; i < aLenh.length; i++) {
      ph = aLenh[i];
      tIdx = parseInt(ph[1], 10);
      pi = kho[ph[2]];
      if (!pi) { soLoi++; if (!loiDau) loiDau = 'khong thay pi: ' + ph[2]; continue; }
      inPt = parseFloat(ph[3]); outPt = parseFloat(ph[4]); startSec = parseFloat(ph[5]);
      try { pi.setInPoint(inPt, 4); pi.setOutPoint(outPt + PC_DEM, 4); } catch (e6) {}
      if (tIdx >= 0 && tIdx < seq.audioTracks.numTracks) {
        try { seq.audioTracks[tIdx].overwriteClip(pi, startSec); daDat++; }
        catch (e7) { soLoi++; if (!loiDau) loiDau = e7.toString(); }
      }
    }

    pc__donInOut();
    return 'OK:daDat=' + daDat + '|soLoi=' + soLoi + '|loiDau=' + loiDau;
  } catch (e) {
    return pc_err('pc_sapXepClipsLenTrack', e);
  }
}

/**
 * Tim file mic roi trong Project Bin.
 */
function pc_timFileMic() {
  try {
    var root = app.project.rootItem;
    var found = [];
    function scan(item) {
      if (!item) return;
      if (item.type === 1) {
        try {
          var p = String(item.getMediaPath());
          var pl = p.toLowerCase();
          var fn = item.name ? item.name.toLowerCase() : "";
          if (pl.indexOf("video") >= 0 || fn.indexOf("cam") === 0 || fn.indexOf("c40") === 0 || fn.indexOf("c42") === 0) return;
          if (pl.indexOf("audio") >= 0 || fn.indexOf("mic") >= 0) {
            if (pl.indexOf(".mp3") >= 0 || pl.indexOf(".wav") >= 0 || pl.indexOf(".m4a") >= 0) {
              found.push(p);
            }
          }
        } catch(e) {}
      } else if (item.children) {
        for (var i = 0; i < item.children.numItems; i++) scan(item.children[i]);
      }
    }
    scan(root);
    return "OK:" + found.join(";");
  } catch (e) {
    return pc_err("pc_timFileMic", e);
  }
}

/**
 * Phien ban host — panel KIEM sau moi lan nap, khop moi duoc chay.
 * ☠️ Phai la ham CUOI FILE: evalFile co the nuot file GIUA CHUNG ma khong
 * bao loi (do that 01/08: nap xong pc_datTieng nhung pc_doKetQua van ban
 * cu). Ham cuoi file tra loi dung = ca file da nap tron ven.
 */
function pc_phienBan() {
  return 'v0.4.3';
}
