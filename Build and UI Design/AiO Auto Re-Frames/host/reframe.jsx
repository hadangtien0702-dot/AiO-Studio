/**
 * AiO Auto Re-Frames - host ExtendScript.
 * File nay viet ASCII khong dau (quy uoc bo AiO: ExtendScript hay vo font).
 * Host tra MA + du lieu dong "khoa=gia tri"; panel viet cau tieng Viet.
 *
 * KIEN TRUC - chot 2026-07-30 sau 5 spike do that tren Premiere Beta 26.5:
 *   Khong tu lam ML tracking. Dung chinh effect "Auto Reframe" (Sensei) cua
 *   Premiere: tao ban sao sequence -> doi khung 1080x1920 -> gan effect len
 *   tung clip video. Adobe tu phan tich chu the va keyframe Motion.
 *   - Motion keyframe ghi/doc duoc qua API chinh thuc (spike 2: ghi [0.3,0.5]
 *     tai 1s doc lai dung) -> de danh cho che do tinh chinh tay sau nay.
 *   - setSettings doi duoc khung 1920x1080 -> 1080x1920 (spike 3).
 *   - qe.project.getVideoEffectByName("Auto Reframe") tra effect THAT
 *     (name khac rong - ten bia tra object rong ten). addVideoEffect gan
 *     duoc: components 2 -> 3, matchName AE.ADBE AEFilterAutoFramer (spike 4).
 *   - seq.clone() chay duoc: so sequence tang 1 (spike 5).
 *
 * ☠️ LUAT QE (skill adobe-cep-panel): moi lenh QE chi thu DUNG MOT cach,
 * khong do tham so tren du an that. addVideoEffect da kiem chung 1 lan duy
 * nhat tren sequence rac truoc khi vao file nay.
 */

function rf_err(where, e) {
  return 'ERR:NGOAI_LE|' + where + ': ' + e.toString();
}

/**
 * TU LUU project truoc MOI thao tac ghi timeline — dai bao hiem cho khach.
 * Giao thuc nay da cuu chinh minh HAI lan (2 cu sap 31/07 + 01/08: project
 * deu da luu ngay truoc nen mat 0). May khach yeu hon may minh va khong ai
 * ngoi canh sua — sap luc nao khong biet, nen luu truoc la re nhat.
 * Luu loi (project chua tung save, o read-only...) thi KHONG chan viec chinh.
 */
function rf__luuTruoc() {
  try { app.project.save(); return true; } catch (e) { return false; }
}

/**
 * Thong tin de XUAT CHECK sequence dang mo — CHI DOC, khong goi API xuat nao.
 *
 * ☠️ VI SAO KHONG XUAT BANG API PREMIERE: hai lan sap app (31/07
 * exportAsMediaDirect, 01/08 app.encoder.encodeSequence — sap ngay buoc xep
 * hang, AME chua kip mo). Tren Beta 26.5 ho API xuat tu script la CAM.
 * Panel tu xuat bang FFmpeg tu FILE GOC theo moc doc duoc o day.
 */
function rf_thongTinXuat() {
  try {
    var s = app.project.activeSequence;
    if (!s) return 'ERR:CHUA_MO_SEQUENCE|';
    var clip = null;
    for (var t = 0; t < s.videoTracks.numTracks; t++) {
      if (s.videoTracks[t].clips.numItems > 0) { clip = s.videoTracks[t].clips[0]; break; }
    }
    if (!clip) return 'ERR:KHONG_CO_CLIP|';
    // V1 chi xuat sequence MOT clip (chinh la cac short) — nhieu clip thi noi
    // that, dung xuat thieu ma im.
    var tong = 0;
    for (var t2 = 0; t2 < s.videoTracks.numTracks; t2++) tong += s.videoTracks[t2].clips.numItems;
    if (tong > 1) return 'ERR:NHIEU_CLIP|' + tong;
    var st = s.getSettings();
    return 'OK:duong=' + clip.projectItem.getMediaPath() +
      '\ntuGiay=' + clip.inPoint.seconds.toFixed(3) +
      '\ndenGiay=' + clip.outPoint.seconds.toFixed(3) +
      '\nkhung=' + st.videoFrameWidth + 'x' + st.videoFrameHeight +
      '\nten=' + s.name;
  } catch (e) {
    return rf_err('rf_thongTinXuat', e);
  }
}

/** Duong dan media cua clip video dau tien tren sequence dang mo — de panel
 *  tim file dem nghe (.autocut-nghe.json) nam canh video. CHI DOC. */
function rf_duongDanMedia() {
  try {
    var s = app.project.activeSequence;
    if (!s) return 'ERR:CHUA_MO_SEQUENCE|';
    for (var t = 0; t < s.videoTracks.numTracks; t++) {
      var track = s.videoTracks[t];
      if (track.clips.numItems > 0) {
        var pi = track.clips[0].projectItem;
        if (pi && typeof pi.getMediaPath === 'function') {
          return 'OK:' + pi.getMediaPath();
        }
      }
    }
    return 'ERR:KHONG_CO_CLIP|';
  } catch (e) {
    return rf_err('rf_duongDanMedia', e);
  }
}

/**
 * Ten sequence KHONG DUOC TRUNG — vap that 31/07: chay "ca sequence" hai lan
 * ra HAI ban cung ten "... - Doc 9-16", anh Tien tuong bi luu de va khong biet
 * cai nao la cai nao. Trung thi noi " (2)", " (3)"...
 */
function rf__tenKhongTrung(goc) {
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

/** Tim project item theo duong dan media (so KHONG phan biet hoa thuong,
 *  chuan hoa dau gach). Duyet root + vao bin mot cap. */
function rf__timItemTheoDuong(duong) {
  var chuan = String(duong).replace(/\\/g, '/').toLowerCase();
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
    if (so(it)) return it;
    if (it && it.type === 2 /* BIN */ && it.children) {
      for (var j = 0; j < it.children.numItems; j++) {
        if (so(it.children[j])) return it.children[j];
      }
    }
  }
  return null;
}

/** Gan Auto Reframe len moi clip video cua sequence dang active.
 *  Tra ve mang [daGan, daCo, soLoi, loiDau]. Dung chung cho ca hai duong. */
function rf__ganEffectLenSeq(seq, fx) {
  var qeSeq = qe.project.getActiveSequence();
  var daGan = 0, daCo = 0, soLoi = 0, loiDau = '';
  for (var t = 0; t < seq.videoTracks.numTracks; t++) {
    var track = seq.videoTracks[t];
    for (var c = 0; c < track.clips.numItems; c++) {
      var clip = track.clips[c];
      var coRoi = false;
      for (var k = 0; k < clip.components.numItems; k++) {
        if (clip.components[k].matchName === 'AE.ADBE AEFilterAutoFramer') { coRoi = true; break; }
      }
      if (coRoi) { daCo++; continue; }
      try {
        qeSeq.getVideoTrackAt(t).getItemAt(c).addVideoEffect(fx);
      } catch (e) {
        soLoi++;
        if (!loiDau) loiDau = e.toString();
        continue;
      }
      var coThat = false;
      for (var k2 = 0; k2 < clip.components.numItems; k2++) {
        if (clip.components[k2].matchName === 'AE.ADBE AEFilterAutoFramer') { coThat = true; break; }
      }
      if (coThat) daGan++;
      else { soLoi++; if (!loiDau) loiDau = 'component khong xuat hien (track ' + t + ' clip ' + c + ')'; }
    }
  }
  return [daGan, daCo, soLoi, loiDau];
}

/**
 * Ghep NHIEU doan cua mot file goc vao MOT sequence moi, lien mach.
 * Dung cho bai test 31/07 cua anh Tien: "cat toan bo doan co nguoi dua vao
 * mot sequence moi". Duong da chung minh o Autocut: doan dau bang
 * createNewSequenceFromClips (dat ca hinh + tieng), cac doan sau overwriteClip.
 *
 * @param duongDan  duong dan media file goc
 * @param dsStr     "a,b;a,b;..." — moc giay tren file goc, tang dan
 * @param ten       ten sequence (se tu chong trung)
 */
function rf_ghepDoan(duongDan, dsStr, ten) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var pi = rf__timItemTheoDuong(duongDan);
    if (!pi) return 'ERR:KHONG_THAY_ITEM|' + duongDan;
    rf__luuTruoc();

    var ds = [];
    var manh = String(dsStr).split(';');
    for (var i = 0; i < manh.length; i++) {
      var ab = manh[i].split(',');
      if (ab.length !== 2) continue;
      ds.push([parseFloat(ab[0]), parseFloat(ab[1])]);
    }
    if (!ds.length) return 'ERR:DS_RONG|';

    // ── Doan DAU: tao sequence (dat ca hinh lan tieng cung luc) ──
    try { pi.setInPoint(ds[0][0], 4); pi.setOutPoint(ds[0][1], 4); }
    catch (e) { return 'ERR:INOUT|' + e.toString(); }
    var tenSach = rf__tenKhongTrung(String(ten));
    try { app.project.createNewSequenceFromClips(tenSach, [pi], app.project.rootItem); }
    catch (e2) { return 'ERR:TAO_SEQ|' + e2.toString(); }
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:SEQ_KHONG_ACTIVE|';
    var trackV = seq.videoTracks.numTracks ? seq.videoTracks[0] : null;
    var trackA = seq.audioTracks.numTracks ? seq.audioTracks[0] : null;
    if (!trackV) return 'ERR:KHONG_CO_TRACK_V|';

    // ── Cac doan SAU: overwriteClip noi tiep. Moc dat = cuoi clip truoc
    //    (doc lai tu track, khong cong don chay — bai hoc lam tron fps). ──
    var soLoi = 0, loiDau = '';
    for (i = 1; i < ds.length; i++) {
      try { pi.setInPoint(ds[i][0], 4); pi.setOutPoint(ds[i][1], 4); }
      catch (e3) { soLoi++; if (!loiDau) loiDau = 'setInOut: ' + e3; continue; }
      var moc = 0;
      try { moc = trackV.clips[trackV.clips.numItems - 1].end.seconds; } catch (e4) {}
      try { trackV.overwriteClip(pi, moc); }
      catch (e5) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + e5; continue; }
    }
    try { pi.clearInPoint(); pi.clearOutPoint(); } catch (e6) {}

    // ── DO LAI, khong tin "khong bao loi" ──
    var soClipV = trackV.clips.numItems;
    var soClipA = trackA ? trackA.clips.numItems : 0;
    var cuoi = 0;
    try { cuoi = trackV.clips[soClipV - 1].end.seconds; } catch (e7) {}
    var mongMuon = 0;
    for (i = 0; i < ds.length; i++) mongMuon += ds[i][1] - ds[i][0];
    return 'OK:seqMoi=' + seq.name +
      '\nsoDoanYeuCau=' + ds.length +
      '\nsoClipHinh=' + soClipV + '\nsoClipTieng=' + soClipA +
      '\ndaiThat=' + cuoi.toFixed(2) + '\ndaiMongMuon=' + mongMuon.toFixed(2) +
      '\nsoLoi=' + soLoi + '\nloiDau=' + loiDau;
  } catch (e) {
    return rf_err('rf_ghepDoan', e);
  }
}

/**
 * MVP 31/07 — cat MOT doan noi dung thanh sequence khung dich bam chu the.
 * Panel goi lap cho tung doan (nao chia doan nam o panel, doc tu dem nghe).
 *
 * @param duongDan  duong dan media file goc (tu rf_duongDanMedia)
 * @param inS/outS  moc giay tren FILE GOC — ranh gioi cau, panel dam bao
 * @param rong/cao  khung dich
 * @param ten       ten sequence, ASCII
 */
function rf_catShort(duongDan, inS, outS, rong, cao, ten) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    app.enableQE();
    var fx = null;
    try { fx = qe.project.getVideoEffectByName('Auto Reframe'); } catch (e) {}
    if (!fx || fx.name !== 'Auto Reframe') return 'ERR:THIEU_AUTO_REFRAME|';

    var pi = rf__timItemTheoDuong(duongDan);
    if (!pi) return 'ERR:KHONG_THAY_ITEM|' + duongDan;
    rf__luuTruoc();

    try { pi.setInPoint(inS, 4); pi.setOutPoint(outS, 4); }
    catch (e) { return 'ERR:INOUT_LOI|' + e.toString(); }
    var tenSach = rf__tenKhongTrung(String(ten));
    try { app.project.createNewSequenceFromClips(tenSach, [pi], app.project.rootItem); }
    catch (e2) {
      try { pi.clearInPoint(); pi.clearOutPoint(); } catch (e3) {}
      return 'ERR:TAO_SEQ_LOI|' + e2.toString();
    }
    try { pi.clearInPoint(); pi.clearOutPoint(); } catch (e4) {}

    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:SEQ_KHONG_ACTIVE|';

    var st;
    try {
      st = seq.getSettings();
      st.videoFrameWidth = rong;
      st.videoFrameHeight = cao;
      seq.setSettings(st);
    } catch (e5) { return 'ERR:DOI_KHUNG_LOI|' + e5.toString(); }
    var st2 = seq.getSettings();
    if (st2.videoFrameWidth !== rong || st2.videoFrameHeight !== cao) {
      return 'ERR:KHUNG_KHONG_DOI|' + st2.videoFrameWidth + 'x' + st2.videoFrameHeight;
    }

    var kq = rf__ganEffectLenSeq(seq, fx);
    var dai = 0;
    try { dai = seq.videoTracks[0].clips[0].end.seconds - seq.videoTracks[0].clips[0].start.seconds; } catch (e6) {}
    return 'OK:seqMoi=' + seq.name +
      '\nkhung=' + st2.videoFrameWidth + 'x' + st2.videoFrameHeight +
      '\ndaiGiay=' + dai.toFixed(2) +
      '\ndaGan=' + kq[0] + '\ndaCoSan=' + kq[1] +
      '\nsoLoi=' + kq[2] + '\nloiDau=' + kq[3];
  } catch (e) {
    return rf_err('rf_catShort', e);
  }
}

/** Do moi truong - CHI DOC. */
function rf_probe() {
  var out = [];
  try { out.push('premiere=' + app.version); } catch (e) { out.push('premiere=?'); }
  try {
    var s = app.project.activeSequence;
    out.push('seq=' + (s ? s.name : 'KHONG'));
    if (s) {
      var st = s.getSettings();
      out.push('khung=' + st.videoFrameWidth + 'x' + st.videoFrameHeight);
      out.push('clone=' + (typeof s.clone));
    }
    app.enableQE();
    var fx = qe.project.getVideoEffectByName('Auto Reframe');
    // Ten bia van tra ve object nhung name RONG - phai kiem name (spike 4).
    out.push('autoReframe=' + (fx && fx.name === 'Auto Reframe' ? 'CO' : 'KHONG'));
  } catch (e) { out.push('probe_loi=' + e); }
  return 'OK:' + out.join('\n');
}

/**
 * Doc ten + khung cua sequence dang mo - cho dong trang thai cua panel.
 * CHI DOC, goi moi giay mot lan nen phai re.
 */
function rf_trangThai() {
  try {
    var s = app.project.activeSequence;
    if (!s) return 'OK:';
    var st = s.getSettings();
    return 'OK:' + s.name + '|' + st.videoFrameWidth + 'x' + st.videoFrameHeight;
  } catch (e) {
    return 'OK:';
  }
}

/**
 * Viec chinh: tu sequence dang mo, tao BAN SAO theo khung dich (mac dinh
 * doc 9:16) va gan Auto Reframe (Sensei) len moi clip video.
 *
 * @param rong  be rong khung dich (mac dinh 1080)
 * @param cao   be cao khung dich (mac dinh 1920)
 * @param nhan  hau to ten sequence, ASCII (mac dinh "Doc 9-16")
 *
 * KHONG dung vao sequence goc - luat "thu tinh nang PHA tren ban sao"
 * ap dung cho ca nguoi dung: ho luon giu duoc ban ngang nguyen ven.
 */
function rf_lamDoc(rong, cao, nhan) {
  var W = (typeof rong === 'number' && rong > 0) ? rong : 1080;
  var H = (typeof cao === 'number' && cao > 0) ? cao : 1920;
  var NHAN = (typeof nhan === 'string' && nhan) ? nhan : 'Doc 9-16';
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var goc = app.project.activeSequence;
    if (!goc) return 'ERR:CHUA_MO_SEQUENCE|';

    // ☠️ Chan chay tren sequence KHONG PHAI BAN NGANG — vap that 30/07 ngay
    // lan test dau: nguoi dung dang mo ban doc vua tao roi bam lai -> ra
    // "... - Doc 9-16 - Doc 9-16", bien lai "0 clip" khong loi giai thich.
    // Moi khung dich (9:16 / 1:1 / 4:5) deu cat tu nguon NGANG.
    var stGoc = goc.getSettings();
    if (stGoc.videoFrameHeight >= stGoc.videoFrameWidth) {
      return 'ERR:DA_LA_BAN_DOC|' + stGoc.videoFrameWidth + 'x' + stGoc.videoFrameHeight;
    }
    rf__luuTruoc();

    // Effect phai co that truoc khi dong den bat cu thu gi.
    app.enableQE();
    var fx = null;
    try { fx = qe.project.getVideoEffectByName('Auto Reframe'); } catch (e) {}
    if (!fx || fx.name !== 'Auto Reframe') return 'ERR:THIEU_AUTO_REFRAME|';

    // ── 1. NHAN BAN sequence - tim ban sao bang HIEU so ID truoc/sau,
    //       khong doan ten (clone dat ten theo ngon ngu giao dien).
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

    // ── 2. Ten ro rang, KHONG TRUNG + doi khung sang khung dich.
    try { ban.name = rf__tenKhongTrung(goc.name + ' - ' + NHAN); } catch (e) {}
    var st;
    try {
      st = ban.getSettings();
      st.videoFrameWidth = W;
      st.videoFrameHeight = H;
      ban.setSettings(st);
    } catch (e) { return 'ERR:DOI_KHUNG_LOI|' + e.toString(); }
    var st2 = ban.getSettings();
    if (st2.videoFrameWidth !== W || st2.videoFrameHeight !== H) {
      return 'ERR:KHUNG_KHONG_DOI|' + st2.videoFrameWidth + 'x' + st2.videoFrameHeight;
    }

    // ── 3. Gan Auto Reframe len TUNG clip video cua ban sao.
    //       Phai kich hoat ban sao vi QE lam viec qua getActiveSequence.
    //       (Vong gan dung chung rf__ganEffectLenSeq voi duong cat short.)
    app.project.activeSequence = ban;
    var kq = rf__ganEffectLenSeq(ban, fx);
    var tongClip = 0;
    for (var t = 0; t < ban.videoTracks.numTracks; t++) tongClip += ban.videoTracks[t].clips.numItems;

    return 'OK:seqMoi=' + ban.name +
      '\nkhung=' + st2.videoFrameWidth + 'x' + st2.videoFrameHeight +
      '\ntongClip=' + tongClip +
      '\ndaGan=' + kq[0] +
      '\ndaCoSan=' + kq[1] +
      '\nsoLoi=' + kq[2] +
      '\nloiDau=' + kq[3];
  } catch (e) {
    return rf_err('rf_lamDoc', e);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   VUNG I-O — "anh xac dinh doan can lam bang phim I va O, em tracking doan do"
   (anh Tien chot 2026-08-27)
   ──────────────────────────────────────────────────────────────────────────
   Doi tuong lam viec la VUNG KHOANH tren timeline, khong phai clip dang chon.
   Bo ham duoi day la cung mot bo voi ac_getRange / ac_getRangeClips ben
   Autocut — bo do da chay that tu 18/08, chep sang de khong phai do lai.

   ☠️ DO THAT 27/08 tren Premiere 27.0.0 (panel 8092):
      CHUA khoanh vung thi getInPointAsTime().seconds tra **-400000**,
      KHONG phai -1 va KHONG nem loi. Kiem "< 0" moi bat duoc.

   ☠️ KHONG DUNG RAZOR. Autocut da do 27/07: qe razor cat duoc nhung
   remove() chi NHAC DI (khong don lo), va do tham so thi LAM SAP Premiere.
   Kien truc chot: DUNG LAI doan can giu bang overwriteClip — API chinh thuc.
   ══════════════════════════════════════════════════════════════════════════ */

function rf__inSec(seq) {
  try {
    var t = seq.getInPointAsTime();
    if (t && typeof t.seconds === 'number') return t.seconds;
  } catch (e) {}
  try {
    var s = parseFloat(seq.getInPoint());
    if (!isNaN(s)) return s;
  } catch (e) {}
  return -1;
}
function rf__outSec(seq) {
  try {
    var t = seq.getOutPointAsTime();
    if (t && typeof t.seconds === 'number') return t.seconds;
  } catch (e) {}
  try {
    var s = parseFloat(seq.getOutPoint());
    if (!isNaN(s)) return s;
  } catch (e) {}
  return -1;
}
function rf__mediaPath(clip) {
  try {
    var pi = clip.projectItem;
    if (!pi) return '';
    var p = pi.getMediaPath();
    return p ? String(p) : '';
  } catch (e) { return ''; }
}

/**
 * DOC MOC I-O THOI — khong duyet clip. Panel goi ham nay MOI GIAY.
 * Phai re: chi doc 4 con so. Ham nang (rf_getRangeClips) chi goi khi moc DOI.
 */
function rf_getRange() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var a = rf__inSec(seq), b = rf__outSec(seq);
    if (a < 0 || b < 0 || b <= a) return 'ERR:CHUA_KHOANH_VUNG|';
    var st = seq.getSettings();
    var fr = st.videoFrameRate;
    var fps = (fr && fr.seconds > 0) ? (1 / fr.seconds) : 30;
    return 'OK:seqName=' + seq.name + '\nfps=' + fps +
           '\nin=' + a + '\nout=' + b +
           '\nkhung=' + st.videoFrameWidth + 'x' + st.videoFrameHeight;
  } catch (e) {
    return rf_err('rf_getRange', e);
  }
}

/**
 * Duyet MOI clip tren MOI track, lay clip GIAO voi vung I-O.
 * Nang tren sequence nhieu clip — panel chi goi khi moc I-O da doi.
 *
 * ☠️ BO QUA CLIP DANG TAT (`clip.disabled`). Bai hoc 5u cua Auto Podcast:
 * sequence multicam co MOI cam tren MOI doan, cam khong dung bi TAT chu khong
 * bi xoa. Dem ca clip tat la dung so gap vai lan va dung nham hinh.
 *
 * ☠️ BO QUA .mogrt / "AiO Caption": clip caption cua Transcripts CO media path
 * nhung khong phai media (in/out template 10s chia do dai ra "toc do 2083%").
 */
function rf_getRangeClips() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var vungA = rf__inSec(seq), vungB = rf__outSec(seq);
    if (vungA < 0 || vungB < 0 || vungB <= vungA) return 'ERR:CHUA_KHOANH_VUNG|';

    var st = seq.getSettings();
    var fr = st.videoFrameRate;
    var fps = (fr && fr.seconds > 0) ? (1 / fr.seconds) : 30;
    var saiSo = 0.5 / fps;

    var out = [];
    out.push('seqName=' + seq.name);
    out.push('fps=' + fps);
    out.push('in=' + vungA);
    out.push('out=' + vungB);
    out.push('khung=' + st.videoFrameWidth + 'x' + st.videoFrameHeight);

    var thay = [];
    var soTat = 0;
    function quet(kind, ds, so) {
      for (var i = 0; i < so; i++) {
        var tr, n = 0;
        try { tr = ds[i]; n = tr.clips.numItems; } catch (e) { continue; }
        for (var j = 0; j < n; j++) {
          var c;
          try { c = tr.clips[j]; } catch (e) { continue; }
          var s, e2;
          try { s = c.start.seconds; e2 = c.end.seconds; } catch (e) { continue; }
          if (e2 <= vungA + saiSo || s >= vungB - saiSo) continue;
          try { if (c.disabled) { soTat++; continue; } } catch (e) {}

          var p = rf__mediaPath(c);
          if (!p) continue;
          if (/\.mogrt$/i.test(p) || String(c.name).indexOf('AiO Caption') === 0) continue;

          var si = c.inPoint.seconds, sr = c.outPoint.seconds;
          var speed = (e2 - s) > 0 ? ((sr - si) / (e2 - s)) : 1;
          var seqTu = s > vungA ? s : vungA;
          var seqDen = e2 < vungB ? e2 : vungB;
          thay.push({
            kind: kind, tr: i, cl: j,
            seqTu: seqTu, seqDen: seqDen,
            srcTu: si + (seqTu - s) * speed,
            srcDen: si + (seqDen - s) * speed,
            speed: speed, p: p
          });
        }
      }
    }
    quet('V', seq.videoTracks, seq.videoTracks.numTracks);
    // Chi nhin audio khi vung khong co clip HINH nao — clip A/V lien ket thi
    // dat phan video se keo audio theo, dem ca hai la dung hai lan.
    if (!thay.length) quet('A', seq.audioTracks, seq.audioTracks.numTracks);
    if (!thay.length) return 'ERR:VUNG_KHONG_CO_CLIP|' + soTat;

    // Sap theo moc tren timeline — thu tu dung lai chinh la thu tu nay.
    thay.sort(function (x, y) { return x.seqTu - y.seqTu; });

    // ☠️ CHONG LAN = KHONG DUNG LAI PHANG DUOC. Hai clip HINH cung bat, cung
    // luc (B-roll de len) thi xep noi tiep se ra sai ca do dai lan noi dung.
    // Tha bao thang con hon dung ra mot ban sai ma im.
    var chongLan = 0;
    for (var k = 1; k < thay.length; k++) {
      if (thay[k].seqTu < thay[k - 1].seqDen - saiSo) chongLan++;
    }
    out.push('soTat=' + soTat);
    out.push('chongLan=' + chongLan);
    for (k = 0; k < thay.length; k++) {
      var d = thay[k];
      // Duong dan de o CUOI dong vi no co the chua dau phay.
      out.push('clip=' + d.kind + ',' + d.tr + ',' + d.cl + ',' +
               d.seqTu + ',' + d.seqDen + ',' + d.srcTu + ',' + d.srcDen + ',' +
               d.speed + ',' + d.p);
    }
    return 'OK:' + out.join('\n');
  } catch (e) {
    return rf_err('rf_getRangeClips', e);
  }
}

/* ── Ba tro thu nho, chep tu bo da chay that cua Autocut ── */
function rf__datInOut(pi, a, b) {
  try { pi.setInPoint(a, 4); pi.setOutPoint(b, 4); return ''; } catch (e) {}
  try { pi.setInPoint(a); pi.setOutPoint(b); return ''; } catch (e2) { return e2.toString(); }
}
function rf__datClip(track, pi, giay) {
  var loi1 = '';
  try { track.overwriteClip(pi, giay); return ''; } catch (e) { loi1 = e.toString(); }
  try {
    var t = new Time();
    t.seconds = giay;
    track.overwriteClip(pi, t);
    return '';
  } catch (e2) { return loi1 + ' | ' + e2.toString(); }
}
function rf__mocCuoi(track, duPhong) {
  try {
    var n = track.clips.numItems;
    if (n > 0) return track.clips[n - 1].end.seconds;
  } catch (e) {}
  return duPhong;
}
function rf__demClip(track) {
  try { return track ? track.clips.numItems : 0; } catch (e) { return 0; }
}

/**
 * VIEC CHINH CUA VUNG I-O: dung lai dung doan anh khoanh thanh mot sequence
 * khung dich, roi gan Auto Reframe len tung clip cua no.
 *
 * Vi sao DUNG LAI chu khong nhan ban ca sequence: Sensei phan tich TOAN BO
 * clip no duoc gan len. Gan len clip 1 tieng de lay 2 phut la bat nguoi dung
 * ngoi cho phan tich ca tieng. Dung lai dung doan -> Sensei chi nhin doan do.
 *
 * @param dsStr    "srcTu,srcDen,idxDuong;..." — moc giay TREN FILE GOC
 * @param duongStr "d1|~|d2|~|..." — bang duong dan, tach rieng vi duong co
 *                 the chua ca dau phay lan cham phay
 * @param rong/cao khung dich
 * @param ten      ten sequence (tu chong trung)
 */
function rf_catVung(dsStr, duongStr, rong, cao, ten) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    app.enableQE();
    var fx = null;
    try { fx = qe.project.getVideoEffectByName('Auto Reframe'); } catch (e) {}
    if (!fx || fx.name !== 'Auto Reframe') return 'ERR:THIEU_AUTO_REFRAME|';

    // ── Bang duong dan -> project item (tim MOT lan cho moi duong) ──
    var duong = String(duongStr).split('|~|');
    var pis = [];
    var i;
    for (i = 0; i < duong.length; i++) {
      var pi = rf__timItemTheoDuong(duong[i]);
      if (!pi) return 'ERR:KHONG_THAY_ITEM|' + duong[i];
      pis.push(pi);
    }

    // ── Danh sach doan ──
    var muc = [];
    var manh = String(dsStr).split(';');
    for (i = 0; i < manh.length; i++) {
      var ph = manh[i].split(',');
      if (ph.length !== 3) continue;
      var idx = parseInt(ph[2], 10);
      if (isNaN(idx) || idx < 0 || idx >= pis.length) continue;
      muc.push({ a: parseFloat(ph[0]), b: parseFloat(ph[1]), pi: pis[idx] });
    }
    if (!muc.length) return 'ERR:DS_RONG|';

    rf__luuTruoc();

    // ══════════════════════════════════════════════════════════════════════
    // ☠️ CAT IN/OUT GOC CUA MOI PROJECT ITEM SE BI GHI DE — luat 3a-bis.
    // Dat in/out len project item la ghi vao DU LIEU CUA NGUOI DUNG. Phai doc
    // va cat gia tri cu NGAY LAN CHAY NAY roi tra lai nguyen van; tinh lai
    // bang cong thuc thi cong thuc an chinh cai vua bi lam hong.
    // ══════════════════════════════════════════════════════════════════════
    var goc = [];
    for (i = 0; i < pis.length; i++) {
      var g = null;
      try { g = { pi: pis[i], vao: pis[i].getInPoint(), ra: pis[i].getOutPoint() }; } catch (e) {}
      goc.push(g);
    }
    function traLaiInOut() {
      for (var z = 0; z < goc.length; z++) {
        if (!goc[z]) continue;
        try {
          goc[z].pi.setInPoint(goc[z].vao.seconds, 4);
          goc[z].pi.setOutPoint(goc[z].ra.seconds, 4);
        } catch (e) {}
      }
    }

    // ── 1. Doan DAU: tao sequence (dat ca hinh lan tieng cung luc) ──
    var e1 = rf__datInOut(muc[0].pi, muc[0].a, muc[0].b);
    if (e1) { traLaiInOut(); return 'ERR:INOUT_LOI|' + e1; }
    var tenSach = rf__tenKhongTrung(String(ten));
    try { app.project.createNewSequenceFromClips(tenSach, [muc[0].pi], app.project.rootItem); }
    catch (e2) { traLaiInOut(); return 'ERR:TAO_SEQ_LOI|' + e2.toString(); }
    var seq = app.project.activeSequence;
    if (!seq) { traLaiInOut(); return 'ERR:SEQ_KHONG_ACTIVE|'; }
    var trackV = seq.videoTracks.numTracks ? seq.videoTracks[0] : null;
    var trackA = seq.audioTracks.numTracks ? seq.audioTracks[0] : null;
    if (!trackV) { traLaiInOut(); return 'ERR:KHONG_CO_TRACK_V|'; }

    // ── 2. Doi khung dich, DOC LAI kiem ──
    var st;
    try {
      st = seq.getSettings();
      st.videoFrameWidth = rong;
      st.videoFrameHeight = cao;
      seq.setSettings(st);
    } catch (e3) { traLaiInOut(); return 'ERR:DOI_KHUNG_LOI|' + e3.toString(); }
    var st2 = seq.getSettings();
    if (st2.videoFrameWidth !== rong || st2.videoFrameHeight !== cao) {
      traLaiInOut();
      return 'ERR:KHUNG_KHONG_DOI|' + st2.videoFrameWidth + 'x' + st2.videoFrameHeight;
    }

    // ── 3. Cac doan SAU: noi tiep bang overwriteClip ──
    // Moc DOC LAI tu clip vua dat, KHONG cong don: Premiere lam tron vi tri ve
    // luoi khung hinh, cong don thi lech dan va de lai khe ho (Autocut do that:
    // cong don -> ho 1 khung sau 32 doan; doc lai -> 0).
    var soLoi = 0, loiDau = '';
    var moc = rf__mocCuoi(trackV, muc[0].b - muc[0].a);
    for (i = 1; i < muc.length; i++) {
      var eA = rf__datInOut(muc[i].pi, muc[i].a, muc[i].b);
      if (eA) { soLoi++; if (!loiDau) loiDau = 'setInPoint: ' + eA; continue; }
      var eB = rf__datClip(trackV, muc[i].pi, moc);
      if (eB) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + eB; continue; }
      moc = rf__mocCuoi(trackV, moc + (muc[i].b - muc[i].a));
    }

    // ── 4. TIENG phai di theo HINH ──
    // Doan dau chac chan co tieng. Cac doan sau "thuong" keo audio theo —
    // "thuong" khong phai "chac", nen DEM lai va bu neu thieu.
    var soV = rf__demClip(trackV);
    var soA = rf__demClip(trackA);
    if (trackA && soA < soV) {
      var moc2 = 0;
      for (i = 0; i < muc.length; i++) {
        rf__datInOut(muc[i].pi, muc[i].a, muc[i].b);
        rf__datClip(trackA, muc[i].pi, moc2);
        moc2 = rf__mocCuoi(trackA, moc2 + (muc[i].b - muc[i].a));
      }
      soA = rf__demClip(trackA);
    }

    traLaiInOut();

    // ── 5. Gan Auto Reframe len tung clip cua sequence vua dung ──
    var kq = rf__ganEffectLenSeq(seq, fx);

    // ── 6. DO LAI ket qua that, khong tin "khong bao loi" ──
    var mongMuon = 0;
    for (i = 0; i < muc.length; i++) mongMuon += (muc[i].b - muc[i].a);
    var daiThat = 0;
    try { daiThat = trackV.clips[trackV.clips.numItems - 1].end.seconds; } catch (e4) {}

    return 'OK:seqMoi=' + seq.name +
      '\nkhung=' + st2.videoFrameWidth + 'x' + st2.videoFrameHeight +
      '\nsoDoanYeuCau=' + muc.length +
      '\nsoClipHinh=' + soV + '\nsoClipTieng=' + soA +
      '\ndaiThat=' + daiThat.toFixed(2) + '\ndaiMongMuon=' + mongMuon.toFixed(2) +
      '\ndaGan=' + kq[0] + '\ndaCoSan=' + kq[1] +
      '\nsoLoi=' + (soLoi + kq[2]) + '\nloiDau=' + (loiDau || kq[3]);
  } catch (e) {
    return rf_err('rf_catVung', e);
  }
}
