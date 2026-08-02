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

/** Cache project item theo duong dan — song giua cac lo trong mot lan dung. */
var pc__c = {};

/** Tim project item theo duong dan media (khong phan biet hoa thuong). */
function pc__item(duong) {
  var chuan = String(duong).replace(/\\/g, '/').toLowerCase();
  if (pc__c[chuan]) return pc__c[chuan];
  function so(item) {
    try {
      if (item && typeof item.getMediaPath === 'function') {
        var p = String(item.getMediaPath()).replace(/\\/g, '/').toLowerCase();
        if (p === chuan) return true;
      }
    } catch (e) {}
    return false;
  }
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    var it = root.children[i];
    if (so(it)) { pc__c[chuan] = it; return it; }
    if (it && it.type === 2 /* BIN */ && it.children) {
      for (var j = 0; j < it.children.numItems; j++) {
        if (so(it.children[j])) { pc__c[chuan] = it.children[j]; return it.children[j]; }
      }
    }
  }
  return null;
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
function pc__seqDangDung(tenSeq) {
  var seq = app.project.activeSequence;
  if (!seq) return null;
  if (String(seq.name) !== String(tenSeq)) return null;
  return seq;
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
    if (!s) return 'OK:' + v + '|' + p + '||||';
    var st = s.getSettings();
    return 'OK:' + v + '|' + pc__sach(p) + '|' + pc__sach(s.name) + '|' +
      st.videoFrameWidth + 'x' + st.videoFrameHeight + '|' +
      s.videoTracks.numTracks + '|' + s.audioTracks.numTracks;
  } catch (e) {
    return 'OK:|||||';
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
      if (!(tIdx >= 0) || tIdx >= seq.videoTracks.numTracks) {
        soLoi++; if (!loiDau) loiDau = 'track V' + ph[0] + ' / ' + seq.videoTracks.numTracks;
        continue;
      }
      var pi = pc__item(ph[1]);
      if (!pi) { soLoi++; if (!loiDau) loiDau = 'khong thay item: ' + ph[1]; continue; }
      try { pi.setInPoint(parseFloat(ph[2]), 4); pi.setOutPoint(parseFloat(ph[3]) + PC_DEM, 4); }
      catch (e1) { soLoi++; if (!loiDau) loiDau = 'setInOut: ' + e1; continue; }
      try { seq.videoTracks[tIdx].overwriteClip(pi, parseFloat(ph[4])); daDat++; }
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
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
      var trV = seq.videoTracks[t];
      out.push('V' + t + '=' + trV.clips.numItems);
      tongHinh += trV.clips.numItems;
      for (var c = 0; c < trV.clips.numItems; c++) {
        var e1 = trV.clips[c].end.seconds;
        if (e1 > cuoiHinh) cuoiHinh = e1;
      }
    }
    for (var a = 0; a < seq.audioTracks.numTracks; a++) {
      var trA = seq.audioTracks[a];
      out.push('A' + a + '=' + trA.clips.numItems);
      tongTieng += trA.clips.numItems;
      for (var c2 = 0; c2 < trA.clips.numItems; c2++) {
        var e2 = trA.clips[c2].end.seconds;
        if (e2 > cuoiTieng) cuoiTieng = e2;
      }
    }
    out.push('tongHinh=' + tongHinh);
    out.push('tongTieng=' + tongTieng);
    out.push('cuoiHinh=' + cuoiHinh.toFixed(3));
    out.push('cuoiTieng=' + cuoiTieng.toFixed(3));
    return 'OK:' + out.join('|');
  } catch (e) {
    return pc_err('pc_doKetQua', e);
  }
}

/**
 * Phien ban host — panel KIEM sau moi lan nap, khop moi duoc chay.
 * ☠️ Phai la ham CUOI FILE: evalFile co the nuot file GIUA CHUNG ma khong
 * bao loi (do that 01/08: nap xong pc_datTieng nhung pc_doKetQua van ban
 * cu). Ham cuoi file tra loi dung = ca file da nap tron ven.
 */
function pc_phienBan() {
  return 'v0.2.0';
}
