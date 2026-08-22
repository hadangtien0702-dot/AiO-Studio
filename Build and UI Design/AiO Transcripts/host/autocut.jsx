/**
 * autocut.jsx — cau noi ExtendScript cho AiO Autocut.
 *
 * GIAI DOAN 1 = SPIKE (tham do). Muc tieu DUY NHAT luc nay: tra loi cho chac
 * mot cau hoi truoc khi viet them bat cu dong nao —
 *
 *      Premiere co CHO cat (razor) va XOA DON (ripple delete) khong?
 *
 * Vi sao phai hoi truoc: ExtendScript cua Premiere KHONG co API cat chinh thuc.
 * Cach duy nhat la QE DOM — API noi bo Adobe khong ho tro, khac nhau giua cac
 * ban. Neu no khong chay tren may anh Tien thi CA KIEN TRUC phai doi (phai dung
 * lai clip bang overwriteClip voi in/out point). Biet som do mat cong.
 *
 * Du an anh em AiO Sub da chet dung o cho "ghi nguoc ve timeline khong on dinh"
 * — khong lap lai bang cach doan.
 *
 * Moi ham tra ve chuoi 'OK:...' hoac 'ERR:...' (ExtendScript khong co JSON).
 */

/** Bao loi kem ten ham de biet chet o dau. */
function ac_err(where, e) {
  return 'ERR:[' + where + '] ' + e.toString();
}

/**
 * BUOC 3 — LAP LO TRONG (dieu duy nhat con thieu, do 2026-07-27 15:00).
 *
 * Ket qua do that:
 *   - razor CHAY: cat dung tai IN va OUT bang chuoi timecode "00:00:10:00"
 *   - remove(true, false) CHAY nhung chi "NHAC DI" — de lai Empty 10 -> 20.03,
 *     phan sau KHONG nhich len.
 *
 * Nghia la tham so bat "don" chua dung cho. Ham nay thu ba cach de dong lo:
 *   1. remove(false, true)  — dao thu tu hai tham so
 *   2. remove(true, true)
 *   3. Goi remove() ngay tren CHINH CAI LO (Empty item) — giong thao tac tay
 *      trong Premiere: chon khoang trong roi bam Delete la no tu dong lai.
 *
 * Sau moi cach deu do lai: clip ke tiep co nhich ve dau lo khong.
 */
function ac_spikeCloseGap() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    app.enableQE();
    var qs = qe.project.getActiveSequence();
    if (!qs) return 'ERR:QE khong lay duoc sequence';

    var fr = seq.getSettings().videoFrameRate;
    var fps = fr.seconds > 0 ? (1 / fr.seconds) : 30;
    var saiSo = 2 / fps;

    // Tim track co LO TRONG nam GIUA hai clip (bo qua khoang trong o duoi cuoi).
    var tracks = ac_findTracksWithClips(qs, seq);
    var muc = null, lo = null;
    for (var t = 0; t < tracks.length && !lo; t++) {
      var its = tracks[t].items;
      for (var i = 0; i < its.length; i++) {
        if (!ac_laKhoangTrong(its[i])) continue;
        // Phai co clip THAT o ca hai ben thi moi la "lo" can lap.
        var coTruoc = false, coSau = false;
        for (var j = 0; j < its.length; j++) {
          if (ac_laKhoangTrong(its[j])) continue;
          if (its[j].end <= its[i].start + saiSo) coTruoc = true;
          if (its[j].start >= its[i].end - saiSo) coSau = true;
        }
        if (coTruoc && coSau) { muc = tracks[t]; lo = its[i]; break; }
      }
    }
    if (!lo) {
      return 'OK:Khong tim thay lo trong nao nam giua hai clip.\n' +
             'Hay chay nut 3 truoc (no cat + xoa va de lai mot lo), roi bam nut nay.';
    }

    var ten = muc.kind + (muc.idx + 1);
    function docLai() {
      var q = qe.project.getActiveSequence();
      return ac_readTrack(muc.kind === 'V' ? q.getVideoTrackAt(muc.idx) : q.getAudioTrackAt(muc.idx));
    }
    function trackHienTai() {
      var q = qe.project.getActiveSequence();
      return muc.kind === 'V' ? q.getVideoTrackAt(muc.idx) : q.getAudioTrackAt(muc.idx);
    }
    /** Clip that dau tien bat dau SAU moc x — de xem no co nhich len khong. */
    function clipSau(items, x) {
      for (var i = 0; i < items.length; i++) {
        if (!ac_laKhoangTrong(items[i]) && items[i].start >= x - saiSo) return items[i].start;
      }
      return -1;
    }

    var log = [];
    log.push('Track ' + ten + ' — lo trong tim duoc: ' +
             lo.start.toFixed(2) + ' -> ' + lo.end.toFixed(2) +
             '  (rong ' + (lo.end - lo.start).toFixed(2) + ' giay)');
    log.push('');
    log.push('TRUOC:');
    log.push(ac_formatTrack(muc.items));
    log.push('');

    var truocKhiLap = clipSau(muc.items, lo.end);
    log.push('Clip ke tiep dang bat dau tai: ' + truocKhiLap.toFixed(2));
    log.push('Neu lap duoc lo, no phai nhich ve ~' + lo.start.toFixed(2));
    log.push('');

    // Tim lai chi so cua lo (danh sach co the doi sau moi lan thu).
    function timLo() {
      var its = docLai();
      for (var i = 0; i < its.length; i++) {
        if (ac_laKhoangTrong(its[i]) && Math.abs(its[i].start - lo.start) < saiSo) return its[i].i;
      }
      return -1;
    }

    var cachThu = [
      { ten: 'remove(false, true)  — dao thu tu tham so', a: false, b: true },
      { ten: 'remove(true, true)', a: true, b: true },
      { ten: 'remove() khong tham so — nhu bam Delete tren lo', a: null, b: null }
    ];

    for (var c = 0; c < cachThu.length; c++) {
      var cach = cachThu[c];
      var idx = timLo();
      if (idx < 0) {
        log.push('=> Lo da bien mat truoc khi thu [' + cach.ten + '] — co ve cach truoc do da an.');
        break;
      }
      // [0.1.5] DA VO HIEU HOA. Doan nay lam Premiere SAP khi chay that.
      // Goi QE remove() voi tham so doan mo — nhat la goi KHONG THAM SO — du de
      // danh sap ca phan mem. Giu lai de biet cai gi da lam sap, KHONG chay lai.
      var loi = 'DA VO HIEU HOA - cach nay tung lam Premiere sap';
      break;

      var sau = docLai();
      var moc = clipSau(sau, lo.start);
      var lapDuoc = (moc >= 0 && Math.abs(moc - lo.start) < saiSo);

      log.push('- [' + cach.ten + ']: ' +
               (loi ? ('loi ' + loi)
                    : (lapDuoc ? 'LAP DUOC — clip ke tiep da nhich ve ' + moc.toFixed(2)
                               : 'chua lap duoc (clip ke tiep van o ' + moc.toFixed(2) + ')')));

      if (lapDuoc) {
        log.push('');
        log.push('SAU:');
        log.push(ac_formatTrack(sau));
        log.push('');
        log.push('=> TIM RA CACH DON. Kien truc Autocut DAY DU: cat + xoa + don.');
        return 'OK:' + log.join('\n');
      }
    }

    log.push('');
    log.push('SAU khi thu het:');
    log.push(ac_formatTrack(docLai()));
    log.push('');
    log.push('=> Ca ba cach deu khong lap duoc lo.');
    log.push('   Buoc tiep: tu day tung clip phia sau ve truoc bang qeTrackItem.move().');
    return 'OK:' + log.join('\n');
  } catch (e) {
    return ac_err('ac_spikeCloseGap', e);
  }
}

/**
 * Diem VAO cua sequence, tinh bang giay. Tra -1 neu chua khoanh vung.
 *
 * Doc bang 2 kieu API vi tuy phien ban Premiere: ban moi co
 * `getInPointAsTime()` tra ve Time, ban cu chi co `getInPoint()` tra ve chuoi giay.
 */
function ac_seqInSec(seq) {
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

/** Diem RA cua sequence, tinh bang giay. Tra -1 neu chua khoanh vung. */
function ac_seqOutSec(seq) {
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

/**
 * BUOC 0 — Do moi truong. Khong doi gi tren timeline, chi doc va bao cao.
 *
 * Tra ve cac dong 'ten = gia tri' ngan cach bang \n de panel in ra man hinh.
 */
function ac_probe() {
  var out = [];

  function add(k, v) { out.push(k + ' = ' + v); }
  function tryAdd(k, fn) {
    try { add(k, fn()); } catch (e) { add(k, 'LOI: ' + e.toString()); }
  }

  tryAdd('premiere.version', function () { return app.version; });
  tryAdd('project', function () { return app.project ? app.project.name : '(chua mo)'; });

  var seq = null;
  try { seq = app.project ? app.project.activeSequence : null; } catch (e) {}
  if (!seq) {
    add('sequence', 'CHUA MO SEQUENCE NAO — hay mo mot sequence roi bam lai');
    return 'OK:' + out.join('\n');
  }

  add('sequence.name', seq.name);
  tryAdd('sequence.videoTracks', function () { return seq.videoTracks.numTracks; });
  tryAdd('sequence.audioTracks', function () { return seq.audioTracks.numTracks; });
  tryAdd('playhead.seconds', function () { return seq.getPlayerPosition().seconds; });
  tryAdd('playhead.ticks', function () { return seq.getPlayerPosition().ticks; });

  // Toc do khung hinh — can de doi giay sang timecode khi cat.
  tryAdd('frameRate.secondsPerFrame', function () {
    return seq.getSettings().videoFrameRate.seconds;
  });
  tryAdd('fps (tinh ra)', function () {
    var s = seq.getSettings().videoFrameRate.seconds;
    return s > 0 ? (1 / s) : 'khong tinh duoc';
  });

  // Timecode cua playhead theo dinh dang cua chinh Premiere — neu lay duoc thi
  // dung luon lam dau vao cho razor, khoi phai tu ghep chuoi (de sai drop-frame).
  tryAdd('playhead.timecode', function () {
    var t = seq.getPlayerPosition();
    var fr = seq.getSettings().videoFrameRate;
    return t.getFormatted(fr, seq.getSettings().videoDisplayFormat);
  });

  // ── Diem VAO / RA cua sequence (anh Tien tu khoanh vung) ──
  // Doc bang 2 kieu API vi tuy phien ban Premiere ma co cai nay khong co cai kia.
  tryAdd('in-point (giay)', function () { return ac_seqInSec(seq); });
  tryAdd('out-point (giay)', function () { return ac_seqOutSec(seq); });
  tryAdd('do dai vung chon', function () {
    var a = ac_seqInSec(seq), b = ac_seqOutSec(seq);
    if (a < 0 || b < 0 || b <= a) return 'CHUA KHOANH VUNG (hoac vung rong)';
    return (b - a).toFixed(2) + ' giay';
  });

  // ── QE DOM: thu vien noi bo, khong chinh thuc ──
  var qeOk = false;
  try {
    app.enableQE();
    qeOk = (typeof qe !== 'undefined' && qe !== null);
    add('QE DOM', qeOk ? 'NAP DUOC' : 'khong nap duoc');
  } catch (e) {
    add('QE DOM', 'LOI: ' + e.toString());
  }

  if (qeOk) {
    tryAdd('qe.sequence', function () {
      var qs = qe.project.getActiveSequence();
      return qs ? qs.name : '(null)';
    });
    tryAdd('qe.co ham razor?', function () {
      var qs = qe.project.getActiveSequence();
      return (typeof qs.razor === 'function') ? 'CO' : 'KHONG';
    });
    tryAdd('qe.co ham getVideoTrackAt?', function () {
      var qs = qe.project.getActiveSequence();
      return (typeof qs.getVideoTrackAt === 'function') ? 'CO' : 'KHONG';
    });
    tryAdd('qe.videoTrack[0].numItems', function () {
      return qe.project.getActiveSequence().getVideoTrackAt(0).numItems;
    });
    tryAdd('qe.item[0].co ham remove?', function () {
      var it = qe.project.getActiveSequence().getVideoTrackAt(0).getItemAt(0);
      return (typeof it.remove === 'function') ? 'CO' : 'KHONG';
    });
  }

  return 'OK:' + out.join('\n');
}

/** Doi giay -> chuoi timecode HH:MM:SS:FF theo fps cua sequence. */
function ac_secondsToTimecode(seconds, fps) {
  var f = Math.round(seconds * fps);
  var ff = f % Math.round(fps);
  var totalSec = Math.floor(f / fps);
  var ss = totalSec % 60;
  var mm = Math.floor(totalSec / 60) % 60;
  var hh = Math.floor(totalSec / 3600);
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return p(hh) + ':' + p(mm) + ':' + p(ss) + ':' + p(ff);
}

/**
 * Doc tung item tren mot track QE.
 *
 * [0.1.2] Can vi QE dem CA KHOANG TRONG la "item". Nhin moi `numItems` roi ket
 * luan "khong cat duoc" la sai — phai nhin type/start/end cua tung cai.
 */
function ac_readTrack(qTrack) {
  var items = [];
  var n = 0;
  try { n = qTrack.numItems; } catch (e) { return items; }
  for (var i = 0; i < n; i++) {
    var o = { i: i, type: '?', name: '?', start: -1, end: -1 };
    try {
      var it = qTrack.getItemAt(i);
      try { o.type = String(it.type); } catch (e) {}
      try { o.name = String(it.name); } catch (e) {}
      try { o.start = it.start.secs; } catch (e) {}
      try { o.end = it.end.secs; } catch (e) {}
    } catch (e) {}
    items.push(o);
  }
  return items;
}

/** Item nay co phai KHOANG TRONG khong. */
function ac_laKhoangTrong(o) {
  return String(o.type).toLowerCase().indexOf('empty') >= 0 || o.end <= o.start;
}

/**
 * Duyet MOI track (video lan audio) tim track co clip THAT.
 *
 * [0.1.4] Can vi ban truoc chi nhin V1. Anh Tien keo file vao thi clip nam o
 * A1, V1 trong tron — bo do bao "khong tim thay clip" trong khi timeline ro
 * rang co clip. Do sai, khong phai Premiere sai.
 *
 * Tra ve mang { kind:'V'|'A', idx, qTrack, items, soClip }.
 */
function ac_findTracksWithClips(qs, seq) {
  var out = [];
  var i, t, items, dem, j;

  var soV = 0, soA = 0;
  try { soV = seq.videoTracks.numTracks; } catch (e) {}
  try { soA = seq.audioTracks.numTracks; } catch (e) {}

  for (i = 0; i < soV; i++) {
    try {
      t = qs.getVideoTrackAt(i);
      items = ac_readTrack(t);
      dem = 0;
      for (j = 0; j < items.length; j++) { if (!ac_laKhoangTrong(items[j])) dem++; }
      if (dem > 0) out.push({ kind: 'V', idx: i, qTrack: t, items: items, soClip: dem });
    } catch (e) {}
  }
  for (i = 0; i < soA; i++) {
    try {
      t = qs.getAudioTrackAt(i);
      items = ac_readTrack(t);
      dem = 0;
      for (j = 0; j < items.length; j++) { if (!ac_laKhoangTrong(items[j])) dem++; }
      if (dem > 0) out.push({ kind: 'A', idx: i, qTrack: t, items: items, soClip: dem });
    } catch (e) {}
  }
  return out;
}

/** Danh sach cac moc bat dau/ket thuc dang co tren track (de so truoc/sau). */
function ac_bienGioi(items) {
  var b = [];
  for (var i = 0; i < items.length; i++) {
    b.push(items[i].start);
    b.push(items[i].end);
  }
  return b;
}

/** Moc `x` da co san trong danh sach chua (trong sai so cho phep). */
function ac_daCo(danhSach, x, saiSo) {
  for (var i = 0; i < danhSach.length; i++) {
    if (Math.abs(danhSach[i] - x) < saiSo) return true;
  }
  return false;
}

/** In danh sach item ra chuoi de doc tren panel. */
function ac_formatTrack(items) {
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var o = items[i];
    out.push('   [' + o.i + '] ' + o.type + ' "' + o.name + '"  ' + o.start + ' -> ' + o.end);
  }
  return out.length ? out.join('\n') : '   (khong co item nao)';
}

/**
 * BUOC 1 — Thu CAT.
 *
 * [0.1.2] SUA PHEP DO — ban 0.1.0 do SAI.
 * No cat tai PLAYHEAD, ma luc thu playhead dang o giay 0 = ngay dau clip, khong
 * co gi de tach. Premiere khong bao loi, cung khong cat, va ham ket luan nham
 * "khong cat duoc". Cong them viec chi dem `numItems` — ma QE dem ca khoang
 * trong — nen con so "2 -> 2" cung khong noi len dieu gi.
 *
 * Nay: TU TIM clip that dau tien tren V1 roi cat vao GIUA no; va bang chung la
 * "co ranh gioi item moi xuat hien dung tai diem cat", khong phai dem so luong.
 */
function ac_spikeRazorMiddle() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    app.enableQE();
    var qs = qe.project.getActiveSequence();
    if (!qs) return 'ERR:QE khong lay duoc sequence';

    // [0.1.6] Tim tren MOI track (clip co the nam o A1, khong chi V1).
    var tracks = ac_findTracksWithClips(qs, seq);
    if (!tracks.length) return 'ERR:Khong track nao co clip. Keo mot clip vao timeline roi thu lai.';

    var muc = null, target = null;
    for (var t = 0; t < tracks.length && !target; t++) {
      for (var i = 0; i < tracks[t].items.length; i++) {
        var o = tracks[t].items[i];
        if (!ac_laKhoangTrong(o) && (o.end - o.start) > 1) { muc = tracks[t]; target = o; break; }
      }
    }
    if (!target) return 'ERR:Khong tim thay clip nao dai hon 1 giay.';

    var tenTrack = muc.kind + (muc.idx + 1);
    var before = muc.items;

    var mid = target.start + (target.end - target.start) / 2;
    var fr = seq.getSettings().videoFrameRate;
    var fps = fr.seconds > 0 ? (1 / fr.seconds) : 30;

    var log = [];
    log.push('Track ' + tenTrack + ' TRUOC (' + before.length + ' item):');
    log.push(ac_formatTrack(before));
    log.push('');
    log.push('Clip chon: "' + target.name + '" (' + target.start + ' -> ' + target.end + ')');
    log.push('Cat tai GIUA clip: ' + mid.toFixed(2) + ' giay  ·  fps ~ ' + Math.round(fps));
    log.push('');

    var candidates = [
      { ten: 'timecode', giaTri: ac_secondsToTimecode(mid, fps) },
      { ten: 'so giay', giaTri: String(mid) },
      { ten: 'so khung', giaTri: String(Math.round(mid * fps)) }
    ];

    for (var k = 0; k < candidates.length; k++) {
      var c = candidates[k];
      var loi = '';
      try { qs.razor(c.giaTri); } catch (e) { loi = e.toString(); }

      var q = qe.project.getActiveSequence();
      var after = ac_readTrack(muc.kind === 'V' ? q.getVideoTrackAt(muc.idx) : q.getAudioTrackAt(muc.idx));
      var coRanhGioiMoi = false;
      for (var j = 0; j < after.length; j++) {
        if (Math.abs(after[j].start - mid) < (2 / fps)) { coRanhGioiMoi = true; break; }
      }

      if (coRanhGioiMoi) {
        log.push('=> CAT DUOC bang [' + c.ten + '] = "' + c.giaTri + '"');
        log.push('');
        log.push('Track ' + tenTrack + ' SAU (' + after.length + ' item):');
        log.push(ac_formatTrack(after));
        return 'OK:' + log.join('\n');
      }
      log.push('- [' + c.ten + '] "' + c.giaTri + '": ' +
               (loi ? ('loi ' + loi) : 'khong loi nhung khong co ranh gioi moi tai ' + mid.toFixed(2)));
    }

    var q2 = qe.project.getActiveSequence();
    var cuoi = ac_readTrack(muc.kind === 'V' ? q2.getVideoTrackAt(muc.idx) : q2.getAudioTrackAt(muc.idx));
    log.push('');
    log.push('Track ' + tenTrack + ' SAU khi thu het (' + cuoi.length + ' item):');
    log.push(ac_formatTrack(cuoi));
    log.push('');
    log.push('=> Ca 3 dinh dang deu khong cat duoc.');
    log.push('   Buoc tiep: bo razor, dung lai clip bang overwriteClip + in/out point.');
    return 'OK:' + log.join('\n');
  } catch (e) {
    return ac_err('ac_spikeRazorMiddle', e);
  }
}

/**
 * BUOC 2 — Thu DUNG THAO TAC CUA AUTOCUT tren vung anh Tien khoanh.
 *
 * [0.1.3] Anh Tien: "anh co the xac dinh cho em in-point va out-point luon".
 * Doi phep thu tu "xoa clip dau tien" (vo nghia) sang DUNG viec ma Autocut se
 * lam voi tung khoang lang:
 *
 *      cat tai IN  ->  cat tai OUT  ->  xoa doan giua  ->  don phan sau len
 *
 * Chay duoc cai nay nghia la CA KIEN TRUC chay duoc — chi con viec lap lai no
 * cho tung khoang lang ma FFmpeg do duoc.
 *
 * CANH BAO: SUA THAT vao timeline.
 */
function ac_spikeCutRange() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    var inSec = ac_seqInSec(seq);
    var outSec = ac_seqOutSec(seq);
    if (inSec < 0 || outSec < 0 || outSec <= inSec) {
      return 'ERR:Chua khoanh vung. Tren timeline dat diem VAO bang phim I va diem RA bang phim O, roi bam lai.';
    }

    app.enableQE();
    var qs = qe.project.getActiveSequence();
    if (!qs) return 'ERR:QE khong lay duoc sequence';

    var fr = seq.getSettings().videoFrameRate;
    var fps = fr.seconds > 0 ? (1 / fr.seconds) : 30;
    var saiSo = 2 / fps;

    var log = [];
    log.push('Vung chon: ' + inSec.toFixed(2) + ' -> ' + outSec.toFixed(2) +
             '  (dai ' + (outSec - inSec).toFixed(2) + ' giay)');
    log.push('');

    // ── 1. Tim track NAO dang co clip that ──
    var tracks = ac_findTracksWithClips(qs, seq);
    if (!tracks.length) {
      return 'OK:' + log.join('\n') +
        '\nKhong track nao co clip. Hay keo mot clip vao timeline roi thu lai.';
    }

    log.push('Track dang co clip:');
    for (var i = 0; i < tracks.length; i++) {
      log.push('   ' + tracks[i].kind + (tracks[i].idx + 1) + ': ' + tracks[i].soClip + ' clip');
    }

    // Chon track dau tien co clip PHU vao vung da khoanh.
    var muc = null;
    for (var t = 0; t < tracks.length && !muc; t++) {
      for (var k = 0; k < tracks[t].items.length; k++) {
        var it = tracks[t].items[k];
        if (!ac_laKhoangTrong(it) && it.start < outSec - saiSo && it.end > inSec + saiSo) {
          muc = tracks[t];
          break;
        }
      }
    }
    if (!muc) {
      log.push('');
      log.push('=> Vung khoanh khong trung voi clip nao. Doi vung I-O cho trum len clip.');
      return 'OK:' + log.join('\n');
    }

    var ten = muc.kind + (muc.idx + 1);
    log.push('');
    log.push('Lam viec tren track ' + ten + '. TRUOC khi cat:');
    log.push(ac_formatTrack(muc.items));

    function docLai() {
      var q = qe.project.getActiveSequence();
      return ac_readTrack(muc.kind === 'V' ? q.getVideoTrackAt(muc.idx) : q.getAudioTrackAt(muc.idx));
    }
    function trackHienTai() {
      var q = qe.project.getActiveSequence();
      return muc.kind === 'V' ? q.getVideoTrackAt(muc.idx) : q.getAudioTrackAt(muc.idx);
    }
    function doDaiCuoi(items) {
      var m = 0;
      for (var i = 0; i < items.length; i++) {
        if (!ac_laKhoangTrong(items[i]) && items[i].end > m) m = items[i].end;
      }
      return m;
    }

    var bienTruoc = ac_bienGioi(muc.items);
    var doDaiTruoc = doDaiCuoi(muc.items);

    // ── 2. Cat hai dau ──
    // Chi cat o diem NAM TRONG clip. Cat dung chan clip la vo nghia (khong co gi
    // de tach) — day chinh la cho ban truoc do sai va bao nham "cat duoc".
    var canCat = [];
    if (!ac_daCo(bienTruoc, inSec, saiSo)) canCat.push({ ten: 'IN', giay: inSec });
    if (!ac_daCo(bienTruoc, outSec, saiSo)) canCat.push({ ten: 'OUT', giay: outSec });

    log.push('');
    if (!canCat.length) {
      log.push('Ca hai moc IN/OUT deu TRUNG san ranh gioi clip -> khong can cat.');
    }
    for (var c = 0; c < canCat.length; c++) {
      var diem = canCat[c];
      var tc = ac_secondsToTimecode(diem.giay, fps);
      var loi = '';
      try { qs.razor(tc); } catch (e) { loi = e.toString(); }
      var bienSau = ac_bienGioi(docLai());
      var moi = ac_daCo(bienSau, diem.giay, saiSo) && !ac_daCo(bienTruoc, diem.giay, saiSo);
      log.push('Cat tai ' + diem.ten + ' (' + diem.giay.toFixed(2) + ' = ' + tc + '): ' +
               (moi ? 'DUOC — co ranh gioi MOI' : (loi ? ('loi ' + loi) : 'khong tao duoc ranh gioi moi')));
    }

    var sauCat = docLai();
    log.push('');
    log.push('Track ' + ten + ' SAU KHI CAT:');
    log.push(ac_formatTrack(sauCat));

    // ── 3. Tim doan nam GON trong vung khoanh roi xoa + don ──
    var chiSo = -1;
    for (var j = 0; j < sauCat.length; j++) {
      var o = sauCat[j];
      if (ac_laKhoangTrong(o)) continue;
      if (o.start >= inSec - saiSo && o.end <= outSec + saiSo) { chiSo = o.i; break; }
    }
    if (chiSo < 0) {
      log.push('');
      log.push('=> Khong tim thay doan nao nam gon trong vung ' +
               inSec.toFixed(2) + '-' + outSec.toFixed(2) + ' de xoa.');
      return 'OK:' + log.join('\n');
    }

    try {
      trackHienTai().getItemAt(chiSo).remove(true, false);
    } catch (e) {
      log.push('');
      log.push('=> Cat duoc nhung XOA loi: ' + e.toString());
      return 'OK:' + log.join('\n');
    }

    var sauXoa = docLai();
    var doDaiSau = doDaiCuoi(sauXoa);
    var canRut = outSec - inSec;
    var thucRut = doDaiTruoc - doDaiSau;

    log.push('');
    log.push('Track ' + ten + ' SAU KHI XOA + DON:');
    log.push(ac_formatTrack(sauXoa));
    log.push('');
    log.push('Do dai: ' + doDaiTruoc.toFixed(2) + ' -> ' + doDaiSau.toFixed(2) + ' giay');
    log.push('Rut ngan: ' + thucRut.toFixed(2) + ' giay   (dang le ' + canRut.toFixed(2) + ')');
    log.push('');
    if (Math.abs(thucRut - canRut) < 0.2) {
      log.push('=> CAT + XOA + DON CHAY DUNG. Kien truc Autocut DUNG DUOC.');
    } else if (thucRut > 0.2) {
      log.push('=> Co rut ngan nhung lech so — xem lai cach chon doan.');
    } else {
      log.push('=> Xoa duoc nhung KHONG DON (track khong ngan lai).');
    }
    return 'OK:' + log.join('\n');
  } catch (e) {
    return ac_err('ac_spikeCutRange', e);
  }
}


/* ══════════════════════════════════════════════════════════════════════════
   GIAI DOAN 2 — TINH NANG THAT
   ──────────────────────────────────────────────────────────────────────────
   Luong anh Tien chot 2026-07-28:
       "Viec cua anh la xac dinh doan can cat bang IN va OUT.
        Nhan 1 nut - em auto cut."

   Nghia la: KHONG nut thu cong, KHONG nhat bam xac nhan. MOT nut chay het.
   Khong phai hoi truoc vi ket qua ra mot sequence MOI — sequence goc con nguyen.

   Kien truc (chot sau giai doan 1, do that — xem PROGRESS.md 0.1.6):
   khong cat-xoa-don bang QE nua (remove() chi NHAC DI, do tham so thi LAM SAP
   Premiere), ma DUNG LAI cac doan CAN GIU bang `overwriteClip` — API CHINH THUC.

   Host chi tra DU LIEU (dong 'khoa=gia tri') va MA LOI. Moi cau chu cho nguoi
   doc do panel viet — vi file nay phai giu ASCII khong dau.
   ══════════════════════════════════════════════════════════════════════════ */

/** Duong dan file goc cua mot trackItem ('' neu khong doc duoc). */
function ac_mediaPath(clip) {
  try {
    var pi = clip.projectItem;
    if (!pi) return '';
    var p = pi.getMediaPath();
    return p ? String(p) : '';
  } catch (e) { return ''; }
}

/**
 * BUOC 1 — doc VUNG ANH KHOANH (in/out) va cac clip nam trong do. CHI DOC.
 *
 * Doi tuong lam viec la VUNG I-O, khong phai clip dang chon: anh Tien khoanh
 * bang phim I va O roi bam mot nut, khong phai di chon tung clip.
 *
 * Voi moi clip giao voi vung, tra ve ca thoi gian TREN SEQUENCE lan thoi gian
 * TREN FILE GOC. Hai cai do lech nhau khi clip da bi trim dau — dung cho du an
 * anh em AiO Sub da vap, nen quy doi ngay tai day roi tra ca hai ra.
 */
function ac_getRangeClips() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';

    var vungA = ac_seqInSec(seq);
    var vungB = ac_seqOutSec(seq);
    if (vungA < 0 || vungB < 0 || vungB <= vungA) return 'ERR:CHUA_KHOANH_VUNG|';

    var fr = seq.getSettings().videoFrameRate;
    var fps = (fr && fr.seconds > 0) ? (1 / fr.seconds) : 30;
    var saiSo = 0.5 / fps;

    var out = [];
    out.push('seqName=' + seq.name);
    out.push('fps=' + fps);
    out.push('in=' + vungA);
    out.push('out=' + vungB);

    var dem = 0;
    function quet(kind, ds, so) {
      for (var i = 0; i < so; i++) {
        var tr, n = 0;
        try { tr = ds[i]; n = tr.clips.numItems; } catch (e) { continue; }
        for (var j = 0; j < n; j++) {
          var c;
          try { c = tr.clips[j]; } catch (e) { continue; }
          var s, e2;
          try { s = c.start.seconds; e2 = c.end.seconds; } catch (e) { continue; }
          if (e2 <= vungA + saiSo || s >= vungB - saiSo) continue; // khong giao vung

          var p = ac_mediaPath(c);
          if (!p) continue; // title, mau, clip tong hop — khong do tieng duoc
          // [2.5.0] Clip caption MOGRT (do chinh panel dat, hoac bat ky .mogrt nao)
          // CO media path = duong dan file template, nhung khong phai media: no
          // khong co tieng, va in/out cua template (10s) chia cho do dai clip ra
          // "toc do" vo nghia (do 22/08: 23 caption -> "2083%" -> panel tu choi
          // chay lai tren vung da co caption). Bo qua nhu title/mau.
          if (/\.mogrt$/i.test(p) || String(c.name).indexOf(AC_CAPTION_TIEN_TO) === 0) continue;

          var si = c.inPoint.seconds, sr = c.outPoint.seconds;
          var speed = (e2 - s) > 0 ? ((sr - si) / (e2 - s)) : 1;
          var seqTu = s > vungA ? s : vungA;
          var seqDen = e2 < vungB ? e2 : vungB;
          var srcTu = si + (seqTu - s) * speed;
          var srcDen = si + (seqDen - s) * speed;

          // Duong dan de o CUOI dong vi no co the chua dau phay.
          out.push('clip=' + kind + ',' + i + ',' + j + ',' +
                   seqTu + ',' + seqDen + ',' + srcTu + ',' + srcDen + ',' + speed + ',' + p);
          dem++;
        }
      }
    }

    quet('V', seq.videoTracks, seq.videoTracks.numTracks);
    // Chi nhin audio khi vung khong co clip HINH nao — clip A/V lien ket thi dat
    // phan video se keo audio theo, dem ca hai se thanh cat hai lan.
    if (!dem) quet('A', seq.audioTracks, seq.audioTracks.numTracks);
    if (!dem) return 'ERR:VUNG_KHONG_CO_CLIP|';

    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_getRangeClips', e);
  }
}

/**
 * GAN PHU DE — nhap file .srt roi tao caption track tren sequence dang mo.
 *
 * ☠️ BA THU DA TRA GIA de co duoc ham nay (do that 2026-07-28):
 *
 * 1. **Duong dan PHAI dung dau `/`.** `\2` trong chuoi ExtendScript la escape
 *    BAT PHAN. Gui `E:\2025\T11\...` thi Premiere nhan `E:5T11Video...` roi bao
 *    loi lac de "header error" — di tim nham ca buoi. Panel doi sang `/` truoc
 *    khi goi, o day doi lai lan nua cho chac.
 *
 * 2. **File .srt phai nam NGOAI `%APPDATA%`.** Premiere Beta chay voi AppData bi
 *    ao hoa: thu muc tao SAU khi Premiere khoi dong thi ExtendScript khong thay,
 *    `new File(...).exists` tra false du file co that. Panel ghi .srt canh video
 *    goc cua nguoi dung.
 *
 * 3. **`suppressUI = true` KHONG chan duoc hop thoai LOI.** File hong hoac duong
 *    dan sai la bung "File Import Failure" roi treo ca ExtendScript engine. Vi
 *    the kiem `File.exists` TRUOC khi goi importFiles — chan tu goc.
 */
function ac_ganPhuDe(srtPath) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';

    var p = String(srtPath).replace(/\\/g, '/');

    // Kiem TRUOC khi nho Premiere nhap — de tranh hop thoai loi lam treo engine.
    var f = new File(p);
    if (!f.exists) return 'ERR:SRT_KHONG_DOC_DUOC|' + p;

    var truoc = app.project.rootItem.children.numItems;
    var ok = false;
    try {
      ok = app.project.importFiles([p], true, app.project.rootItem, false);
    } catch (e) {
      return 'ERR:NHAP_SRT_LOI|' + e.toString();
    }
    var sau = app.project.rootItem.children.numItems;
    if (sau <= truoc) return 'ERR:NHAP_SRT_LOI|importFiles tra ve ' + ok + ' nhung khong tao item nao';

    // Item vua nhap nam cuoi danh sach.
    var pi = app.project.rootItem.children[sau - 1];

    var kq = false;
    try {
      kq = seq.createCaptionTrack(pi, 0, Sequence.CAPTION_FORMAT_SUBTITLE);
    } catch (e) {
      return 'ERR:TAO_CAPTION_LOI|' + e.toString();
    }

    var out = [];
    out.push('seq=' + seq.name);
    out.push('srtItem=' + pi.name);
    out.push('taoTrack=' + kq);
    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_ganPhuDe', e);
  }
}

/**
 * Doc MOI moc I-O cua sequence dang mo, khong duyet clip. CHI DOC. (2.5.0, chep
 * tu Autocut 19/08) — cho vong tham do moi giay: nguoi dung bam I/O ben
 * Premiere thi panel khong he hay biet (Adobe khong ban su kien nao sang).
 */
function ac_getRange() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var vungA = ac_seqInSec(seq);
    var vungB = ac_seqOutSec(seq);
    if (vungA < 0 || vungB < 0 || vungB <= vungA) return 'ERR:CHUA_KHOANH_VUNG|';
    var fr = seq.getSettings().videoFrameRate;
    var fps = (fr && fr.seconds > 0) ? (1 / fr.seconds) : 30;
    // [2.5.0] Kem KICH THUOC KHUNG — panel tu nhan Ngang/Doc theo sequence thay
    // vi bat nguoi dung nho bam (22/08: reload panel -> ve "Ngang" tren sequence
    // 1080x1920 -> caption tran hai mep). Doc thuoc tinh, khong ton gi them.
    var w = 0, h = 0;
    try { w = seq.frameSizeHorizontal; h = seq.frameSizeVertical; } catch (e2) {}
    return 'OK:seqName=' + seq.name + '\nfps=' + fps + '\nin=' + vungA + '\nout=' + vungB +
           '\nw=' + w + '\nh=' + h;
  } catch (e) {
    return ac_err('ac_getRange', e);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CAPTION KIEU HIEU UNG (MOGRT) — 2.5.0, anh Tien chot 22/08/2026
   ═══════════════════════════════════════════════════════════════════════════
   Moi khoi caption = mot clip Motion Graphics Template dat bang `seq.importMGT`,
   chu + tham so ghi qua `trackItem.getMGTComponent()`. Tham so trong template
   (xem mogrt-src/build-mogrt.jsx): Text · Position Y (% chieu cao) · Highlight
   Word (stt tu, 0 = khong) · Highlight Color · Pop In · Word Timing (karaoke).

   ☠️ DO THAT 22/08 (Premiere Beta 27.0):
   - importMGT(path, ticksStr, vIdx, aIdx): lan dau ~2,5 s, sau ~100 ms/clip.
   - Slider dua len EG bi kep 0..100 -> Position Y la PHAN TRAM.
   - trackItem.end = Time la cach keo dai clip graphic (doc lai dung).
   - Text param: getValue() tra JSON co "textEditValue": ... -> thay bang regex,
     KHONG parse JSON (ES3 khong co JSON).
   - Khong JSON-escape chu la vo: dau " trong loi noi lam hong ca chuoi.
   ═══════════════════════════════════════════════════════════════════════════ */
var AC_CAPTION_TIEN_TO = 'AiO Caption';
var AC_TICK = 254016000000;   // ticks / giay cua Premiere

function ac_clipDeLen(c, start, end) {
  return c.start.seconds < end && c.end.seconds > start;
}

/** Track co trong suot [start,end) khong — hoi DUNG KHOANG, khong hoi "track rong". */
function ac_trackTrongTrong(track, start, end) {
  try {
    for (var i = 0; i < track.clips.numItems; i++) {
      if (ac_clipDeLen(track.clips[i], start, end)) return false;
    }
    return true;
  } catch (e) {
    return false; // khong doc duoc thi coi nhu ban — tuyet doi khong de len clip nguoi ta
  }
}

/** Them MOT track video (QE DOM, khong chinh thuc) — goi xong DOC LAI so track. */
function ac_themTrackVideo(seq) {
  try {
    var truoc = seq.videoTracks.numTracks;
    app.enableQE();
    var qs = qe.project.getActiveSequence();
    qs.addTracks(1, truoc, 0, 0);
    var sau = seq.videoTracks.numTracks;
    if (sau > truoc) return sau - 1;
  } catch (e) {}
  return -1;
}

/**
 * Go cac clip caption do CHINH AiO dat (ten bat dau "AiO Caption") de len
 * [tu,den] — de chay lai khong chong hai lop caption. Clip nguoi dung tu dat
 * ten khac thi khong dung toi. remove(false,false) = NHAC DI (khong ripple),
 * dung y cho track graphic.
 */
function ac_xoaCaptionAiO(tuStr, denStr) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var tu = parseFloat(tuStr), den = parseFloat(denStr);
    if (!(den > tu)) return 'ERR:VUNG_SAI|' + tuStr + '..' + denStr;
    var daXoa = 0, loiDau = '';
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
      var track = seq.videoTracks[t];
      // Duyet NGUOC: remove lam mang clips co lai.
      for (var i = track.clips.numItems - 1; i >= 0; i--) {
        var c = track.clips[i];
        if (String(c.name).indexOf(AC_CAPTION_TIEN_TO) !== 0) continue;
        if (!ac_clipDeLen(c, tu, den)) continue;
        try { c.remove(false, false); daXoa++; } catch (e) { if (!loiDau) loiDau = e.toString(); }
      }
    }
    return 'OK:daXoa=' + daXoa + (loiDau ? '\nloiDau=' + loiDau : '');
  } catch (e) {
    return ac_err('ac_xoaCaptionAiO', e);
  }
}

/**
 * Chon track video TRONG suot [tu,den] va NAM TREN moi clip hinh trong vung.
 *
 * BAY DA VAP (22/08): ban cu duyet t = 0 di len va lay track trong DAU TIEN.
 * Premiere ghep hinh TU DUOI LEN, nen neu V1 trong ma hinh o V2 (hay gap: keo
 * file vao thi clip xuong A1/V2, hoac cat xong don len track tren) thi caption
 * roi xuong V1, bi clip V2 che kin — dat xong hang tram caption ma KHONG THAY
 * CHU NAO, panel van bao "da dat". Hong IM LANG, khong bao loi.
 */
function ac_chonTrackCaption(tuStr, denStr) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var tu = parseFloat(tuStr), den = parseFloat(denStr);
    if (!(den > tu)) return 'ERR:VUNG_SAI|' + tuStr + '..' + denStr;
    var soTrack = seq.videoTracks.numTracks;

    // 1. Track hinh CAO NHAT co clip de len vung. Bo qua clip caption cua chinh
    //    AiO — chung se bi xoa truoc khi dat lai, khong tinh la "hinh".
    var tranHinh = -1;
    for (var t = 0; t < soTrack; t++) {
      var tr = seq.videoTracks[t];
      try {
        for (var i = 0; i < tr.clips.numItems; i++) {
          var c = tr.clips[i];
          if (String(c.name).indexOf(AC_CAPTION_TIEN_TO) === 0) continue;
          if (ac_clipDeLen(c, tu, den)) { tranHinh = t; break; }
        }
      } catch (e1) { tranHinh = t; }   // doc khong duoc thi coi nhu CO hinh
    }

    // 2. Track trong dau tien NAM TREN tran hinh do.
    var vIdx = -1;
    for (var t2 = tranHinh + 1; t2 < soTrack; t2++) {
      if (ac_trackTrongTrong(seq.videoTracks[t2], tu, den)) { vIdx = t2; break; }
    }
    var them = 0;
    if (vIdx < 0) { vIdx = ac_themTrackVideo(seq); them = 1; }
    if (vIdx < 0) return 'ERR:HET_TRACK|';
    // Track vua them nam TREN CUNG nen chac chan > tranHinh; kiem lai cho chac.
    if (vIdx <= tranHinh) return 'ERR:HET_TRACK|';
    return 'OK:vIdx=' + vIdx + '\nthem=' + them + '\nsoTrack=' + seq.videoTracks.numTracks;
  } catch (e) {
    return ac_err('ac_chonTrackCaption', e);
  }
}

/** JSON-escape mot chuoi (ES3 khong co JSON.stringify). */
function ac_jsonChuoi(s) {
  var r = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i), code = s.charCodeAt(i);
    if (ch === '"') r += '\\"';
    else if (ch === '\\') r += '\\\\';
    else if (ch === '\r') r += '\\r';
    else if (ch === '\n') r += '\\n';
    else if (ch === '\t') r += '\\t';
    else if (code < 32) r += '\\u' + ('000' + code.toString(16)).slice(-4);
    else r += ch;
  }
  return r;
}

function ac_thamSo(props, ten) {
  for (var p = 0; p < props.numItems; p++) {
    if (props[p].displayName === ten) return props[p];
  }
  return null;
}

/** Ghi chu vao tham so Text cua MOGRT: giu nguyen moi truong khac, chi thay textEditValue. */
function ac_datChuMogrt(prop, chu) {
  var cur = String(prop.getValue());
  var re = /"textEditValue"\s*:\s*"(?:[^"\\]|\\.)*"/;
  if (!re.test(cur)) return false;
  // `$` trong chuoi thay the la ky hieu cua replace() -> nhan doi truoc.
  var moi = cur.replace(re, '"textEditValue":"' + ac_jsonChuoi(chu).replace(/\$/g, '$$$$') + '"');
  return prop.setValue(moi, true);
}

/** Loi dau tien cua lan dat gan nhat — ac_datCaptionMogrt doc roi xoa. */
var ac_loiDatCaption = '';

/**
 * Dat MOT clip caption: importMGT -> keo dai -> ghi chu + tham so. Tra ve true
 * neu clip da nam tren track (tham so co the thieu, van tinh la dat duoc).
 */
function ac_datMotCaption(seq, p, vIdx, aIdx, tu, den, chu, hl, viTriY, co) {
  var ti = null;
  try { ti = seq.importMGT(p, String(Math.round(tu * AC_TICK)), vIdx, aIdx); }
  catch (e1) { if (!ac_loiDatCaption) ac_loiDatCaption = 'importMGT: ' + e1.toString(); return false; }
  if (!ti) { if (!ac_loiDatCaption) ac_loiDatCaption = 'importMGT tra null tai ' + tu; return false; }

  try { var tEnd = new Time(); tEnd.seconds = den; ti.end = tEnd; }
  catch (e2) { if (!ac_loiDatCaption) ac_loiDatCaption = 'end: ' + e2.toString(); }

  try {
    var comp = ti.getMGTComponent();
    if (comp) {
      var props = comp.properties;
      var pText = ac_thamSo(props, 'Text');
      if (!pText) {
        // Template khong co tham so "Text" -> clip nam tren timeline nhung hien
        // CHU MAU cua template. Truoc day im lang -> panel bao "da dat du".
        if (!ac_loiDatCaption) ac_loiDatCaption = 'template thieu tham so "Text" — clip hien chu mau, khong phai loi thoai';
      } else if (!ac_datChuMogrt(pText, chu)) {
        if (!ac_loiDatCaption) ac_loiDatCaption = 'khong ghi duoc chu vao tham so "Text" (textEditValue khong khop)';
      }
      var pHL = ac_thamSo(props, 'Highlight Word');
      if (pHL) pHL.setValue(hl, true);
      var pY = ac_thamSo(props, 'Position Y');
      if (pY && !isNaN(viTriY) && viTriY >= 0) pY.setValue(viTriY, true);
      // Co chu rieng khoi nay (tu Latin dai tran khung). Template khong co tham
      // so thi bo qua, khong loi.
      var pCo = ac_thamSo(props, 'Text Size');
      if (pCo && co < 100) pCo.setValue(co, true);
    } else if (!ac_loiDatCaption) ac_loiDatCaption = 'getMGTComponent null';
  } catch (e3) { if (!ac_loiDatCaption) ac_loiDatCaption = 'thamso: ' + e3.toString(); }
  return true;
}

/**
 * DAT MOT LO caption MOGRT len track vIdx.
 *
 * @param mogrtPath duong dan .mogrt (dau `/`)
 * @param vIdxStr   chi so track video (lay tu ac_chonTrackCaption)
 * @param viTriYStr % chieu cao comp (doc ~75, ngang ~70); < 0 = giu mac dinh template
 * @param duLieu    "tu␟den␟chu␟hl␟moc␞tu␟den␟..."  (U+001F giua truong, U+001E giua khoi)
 *
 * Panel gui theo LO (~25 khoi) de cap nhat tien do va khong giu ExtendScript
 * qua lau (Premiere mot luong — dang goi la UI dung im).
 */
function ac_datCaptionMogrt(mogrtPath, vIdxStr, viTriYStr, duLieu) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var vIdx = parseInt(vIdxStr, 10);
    if (isNaN(vIdx) || vIdx < 0 || vIdx >= seq.videoTracks.numTracks) return 'ERR:TRACK_SAI|' + vIdxStr;
    var viTriY = parseFloat(viTriYStr);
    var p = String(mogrtPath).replace(/\\/g, '/');
    if (!new File(p).exists) return 'ERR:MOGRT_KHONG_CO|' + p;
    var aIdx = seq.audioTracks.numTracks > 0 ? seq.audioTracks.numTracks - 1 : 0;

    var khoi = String(duLieu).split('\u001E');
    ac_loiDatCaption = '';
    var daDat = 0, loiDau = '', msDau = -1;
    var t0 = new Date().getTime();
    for (var i = 0; i < khoi.length; i++) {
      if (!khoi[i]) continue;
      var f = khoi[i].split('\u001F');
      if (f.length < 5) { if (!loiDau) loiDau = 'khoi ' + i + ' thieu truong (' + f.length + ')'; continue; }
      var tu = parseFloat(f[0]), den = parseFloat(f[1]), chu = f[2];
      var hl = parseInt(f[3], 10); if (isNaN(hl)) hl = 0;
      var moc = f[4] || '';
      var co = f.length > 5 ? parseFloat(f[5]) : 100; if (isNaN(co) || co <= 0) co = 100;
      if (!(den > tu)) continue;

      // ☠️ KARAOKE = CLIP CON THEO TUNG TU. Premiere khong chay expression nhieu
      // dong trong MOGRT va keyframe tham so qua API khong doi hinh (do 22/08),
      // nen "tu dang noi sang len" lam bang cach: moi tu mot clip, cung chu cua
      // khoi, chi khac Highlight Word. Nhieu clip hon (~1 clip/tu) nhung chac.
      var mocArr = [];
      if (moc) {
        var phanMoc = moc.split(',');
        for (var m = 0; m < phanMoc.length; m++) { var v = parseFloat(phanMoc[m]); if (!isNaN(v)) mocArr.push(v); }
      }
      if (mocArr.length > 1) {
        for (var k2 = 0; k2 < mocArr.length; k2++) {
          var a2 = tu + mocArr[k2];
          var b2 = (k2 + 1 < mocArr.length) ? tu + mocArr[k2 + 1] : den;
          if (b2 > den) b2 = den;
          if (!(b2 > a2 + 0.02)) continue;   // hai tu cung moc -> bo, tu sau se hien
          if (ac_datMotCaption(seq, p, vIdx, aIdx, a2, b2, chu, k2 + 1, viTriY, co)) daDat++;
        }
      } else {
        if (ac_datMotCaption(seq, p, vIdx, aIdx, tu, den, chu, hl, viTriY, co)) daDat++;
      }
      if (msDau < 0) msDau = new Date().getTime() - t0;
    }
    if (!loiDau && ac_loiDatCaption) loiDau = ac_loiDatCaption;
    return 'OK:daDat=' + daDat + '\nmsDau=' + msDau + '\nmsTong=' + (new Date().getTime() - t0) +
           (loiDau ? '\nloiDau=' + loiDau : '');
  } catch (e) {
    return ac_err('ac_datCaptionMogrt', e);
  }
}

/** Dem clip caption AiO dang nam tren sequence dang mo (cho nut go / bien lai). */
function ac_demCaptionAiO() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    var n = 0;
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
      var track = seq.videoTracks[t];
      for (var i = 0; i < track.clips.numItems; i++) {
        if (String(track.clips[i].name).indexOf(AC_CAPTION_TIEN_TO) === 0) n++;
      }
    }
    return 'OK:caption=' + n;
  } catch (e) {
    return ac_err('ac_demCaptionAiO', e);
  }
}

/**
 * DAT MARKER tai nhung cho may nghe khong chac — de anh Tien bam M di tuan tu
 * ma soat, khoi phai nghe lai ca video.
 *
 * @param dsStr "giay|tu|diem;giay|tu|diem;..."  giay tinh tren SEQUENCE DA CAT
 *
 * Xoa marker cu do CHINH Autocut dat truoc khi dat moi (nhan biet bang tien to
 * trong ten), de chay lai lan hai khong chong marker len nhau. Marker do nguoi
 * dung tu dat thi khong dung toi.
 */
function ac_datMarker(dsStr) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    if (!seq.markers || typeof seq.markers.createMarker !== 'function') {
      return 'ERR:THIEU_API|sequence.markers.createMarker';
    }

    var TIEN_TO = 'AC ';

    // ── Don marker cu cua Autocut ──
    var daXoa = 0;
    try {
      var m = seq.markers.getFirstMarker();
      while (m) {
        var ke = seq.markers.getNextMarker(m);
        if (String(m.name).indexOf(TIEN_TO) === 0) { seq.markers.deleteMarker(m); daXoa++; }
        m = ke;
      }
    } catch (e) {}

    // ── Dat marker moi ──
    //
    // Dinh dang moi cho: "giay|ten|so|loai"
    //   loai = 'tu'  -> cho Whisper nghe khong chac  (mau DO)
    //   loai = 'ngo' -> cho MAY KHONG CHAC: nang luong bao co tieng ma Whisper
    //                   khong dat chu nao vao. Hai nguon khong dong y nen may
    //                   GIU LAI va nho nguoi nghe quyet.  (mau VANG)
    // Nhin mau la biet loai, khoi doc chu.
    var phan = String(dsStr).split(';');
    var dat = 0, loiDau = '';
    for (var i = 0; i < phan.length; i++) {
      if (!phan[i]) continue;
      var o = phan[i].split('|');
      if (o.length < 3) continue;
      var giay = parseFloat(o[0]);
      if (isNaN(giay) || giay < 0) continue;
      var loai = (o.length > 3) ? o[3] : 'tu';
      try {
        var mk = seq.markers.createMarker(giay);
        mk.name = TIEN_TO + o[1];
        if (loai === 'ngo') {
          mk.comments = 'Autocut GIU LAI ' + parseFloat(o[2]).toFixed(2) +
            ' giay: nghe co tieng nhung khong ra chu. Nghe roi tu quyet cat hay giu.';
          try { mk.setColorByIndex(2); } catch (e) {}
        } else {
          mk.comments = 'Autocut: may chi tin ' + Math.round(parseFloat(o[2]) * 100) + '% vao tu nay';
          try { mk.setColorByIndex(1); } catch (e) {}
        }
        dat++;
      } catch (e) {
        if (!loiDau) loiDau = e.toString();
      }
    }

    var out = [];
    out.push('daXoa=' + daXoa);
    out.push('daDat=' + dat);
    out.push('tongMarker=' + seq.markers.numMarkers);
    out.push('loiDau=' + loiDau);
    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_datMarker', e);
  }
}

/** Kiem cac ham can dung co ton tai tren ban Premiere nay khong. Chi DOC. */
function ac_probeBuildApi() {
  var out = [];
  function co(ten, fn) {
    var r;
    try { r = fn(); } catch (e) { r = 'LOI: ' + e.toString(); }
    out.push(ten + ' = ' + r);
  }
  co('project.createNewSequence', function () {
    return (typeof app.project.createNewSequence === 'function') ? 'CO' : 'KHONG';
  });
  var seq = null;
  try { seq = app.project.activeSequence; } catch (e) {}
  if (!seq) { out.push('sequence = CHUA MO'); return 'OK:' + out.join('\n'); }
  co('sequence.getSettings', function () { return (typeof seq.getSettings === 'function') ? 'CO' : 'KHONG'; });
  co('sequence.setSettings', function () { return (typeof seq.setSettings === 'function') ? 'CO' : 'KHONG'; });
  co('videoTrack.overwriteClip', function () {
    if (seq.videoTracks.numTracks < 1) return 'khong co video track';
    return (typeof seq.videoTracks[0].overwriteClip === 'function') ? 'CO' : 'KHONG';
  });
  co('audioTrack.overwriteClip', function () {
    if (seq.audioTracks.numTracks < 1) return 'khong co audio track';
    return (typeof seq.audioTracks[0].overwriteClip === 'function') ? 'CO' : 'KHONG';
  });
  return 'OK:' + out.join('\n');
}

/** Dat in/out cho projectItem. Thu kieu co mediaType truoc, khong duoc thi kieu cu. */
function ac_datInOut(pi, a, b) {
  try { pi.setInPoint(a, 4); pi.setOutPoint(b, 4); return ''; } catch (e) {}
  try { pi.setInPoint(a); pi.setOutPoint(b); return ''; } catch (e2) { return e2.toString(); }
}

/** Dat clip len track tai moc `giay`. Thu so giay truoc, khong duoc thi Time. */
function ac_datClip(track, pi, giay) {
  var loi1 = '';
  try { track.overwriteClip(pi, giay); return ''; } catch (e) { loi1 = e.toString(); }
  try {
    var t = new Time();
    t.seconds = giay;
    track.overwriteClip(pi, t);
    return '';
  } catch (e2) { return loi1 + ' | ' + e2.toString(); }
}

/** Danh sach clip that tren mot track (API chinh thuc, khong dung QE). */
function ac_docTrack(track) {
  var ds = [];
  var n = 0;
  try { n = track.clips.numItems; } catch (e) { return ds; }
  for (var i = 0; i < n; i++) {
    try {
      var c = track.clips[i];
      ds.push({ start: c.start.seconds, end: c.end.seconds });
    } catch (e) {}
  }
  return ds;
}

/**
 * Diem KET THUC THAT cua clip cuoi cung tren track.
 *
 * Dung lam moc dat clip ke tiep. Vi sao khong cong don so tu tinh: Premiere lam
 * tron vi tri clip ve luoi khung hinh cua sequence, nen do dai THAT co the lech
 * cua minh vai phan nghin giay. Cong don 32 doan la du de ho mot khung hinh.
 * `duPhong` dung khi khong doc duoc (track rong, loi API).
 */
function ac_mocCuoi(track, duPhong) {
  try {
    var n = track.clips.numItems;
    if (n > 0) return track.clips[n - 1].end.seconds;
  } catch (e) {}
  return duPhong;
}


/** Tong do dai, diem cuoi va so luong cua mot danh sach clip. */
function ac_tong(ds) {
  var tong = 0, cuoi = 0;
  for (var i = 0; i < ds.length; i++) {
    tong += (ds[i].end - ds[i].start);
    if (ds[i].end > cuoi) cuoi = ds[i].end;
  }
  return { tong: tong, cuoi: cuoi, so: ds.length };
}

/**
 * BUOC 2 — DUNG SEQUENCE MOI chi gom cac doan can giu.
 *
 * @param keepsStr  "kind,trackIdx,clipOrd,srcTu,srcDen;..." — srcTu/srcDen tinh
 *                  bang GIAY TREN FILE GOC (panel da quy doi san)
 * @param tenSeq    ten sequence moi
 *
 * Ghep lien tiep CHINH LA don (ripple) — khong bao gio de lai lo trong.
 * Sequence goc KHONG bi dung toi.
 */
function ac_buildKeep(keepsStr, tenSeq, taoMoi) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';

    // ── Chia LO: video vai tieng ra hang nghin doan ──
    // Goi mot lenh evalScript voi 1.400 doan la chuoi ~42.000 ky tu — qua dai va
    // khong biet ExtendScript nuot duoc bao nhieu. Nen panel chia thanh nhieu lo:
    //   lo dau (taoMoi=1): tao sequence moi, dat lo dau
    //   lo sau (taoMoi=0): dat TIEP vao sequence vua tao, moc doc lai tu clip cuoi
    var laLoDau = (String(taoMoi) !== '0');
    var seqGoc;
    if (laLoDau) {
      seqGoc = app.project.activeSequence;
      if (!seqGoc) return 'ERR:CHUA_MO_SEQUENCE|';
      $.global.__acSeqGoc = seqGoc; // lo sau con dung, luc do activeSequence da doi
    } else {
      seqGoc = $.global.__acSeqGoc;
      if (!seqGoc) return 'ERR:MAT_SEQUENCE_GOC|';
    }

    // ── 1. Tach danh sach doan can giu ──
    var muc = [];
    var phan = String(keepsStr).split(';');
    var i;
    for (i = 0; i < phan.length; i++) {
      if (!phan[i]) continue;
      var f = phan[i].split(',');
      if (f.length < 5) continue;
      var a = parseFloat(f[3]), b = parseFloat(f[4]);
      if (isNaN(a) || isNaN(b) || b <= a) continue;
      muc.push({ kind: f[0], ti: parseInt(f[1], 10), co: parseInt(f[2], 10), a: a, b: b });
    }
    if (!muc.length) return 'ERR:KHONG_CO_DOAN_GIU|';

    // ── 2. Lay projectItem TRUOC khi tao sequence moi ──
    // Tao sequence moi xong thi no thanh activeSequence; giu san tham chieu cho
    // chac. Tien the doi chieu luon: doan can giu phai nam trong pham vi clip do
    // — lech la timeline da bi doi giua chung.
    var coVideo = false;
    for (i = 0; i < muc.length; i++) {
      var tr, c;
      try {
        tr = (muc[i].kind === 'V') ? seqGoc.videoTracks[muc[i].ti] : seqGoc.audioTracks[muc[i].ti];
        c = tr.clips[muc[i].co];
      } catch (e) { return 'ERR:CLIP_DA_DOI|khong tim thay clip so ' + muc[i].co; }
      if (!c || !c.projectItem) return 'ERR:CLIP_DA_DOI|clip so ' + muc[i].co + ' khong con';
      var ci = c.inPoint.seconds, cr = c.outPoint.seconds;
      if (muc[i].a < ci - 0.05 || muc[i].b > cr + 0.05) {
        return 'ERR:CLIP_DA_DOI|doan ' + muc[i].a.toFixed(2) + '-' + muc[i].b.toFixed(2) +
               ' nam ngoai clip (' + ci.toFixed(2) + '-' + cr.toFixed(2) + ')';
      }
      muc[i].pi = c.projectItem;
      if (muc[i].kind === 'V') coVideo = true;
    }

    // ── 3. Tao sequence MOI ──
    //
    // ☠️ KHONG dung `app.project.createNewSequence` — do that 2026-07-28 tren
    // Beta 26.5: no MO HOP THOAI "New Sequence" roi DUNG CHO nguoi bam, nen
    // ExtendScript treo vo han va panel ket o "dang dung...". Tai lieu Adobe
    // khong he noi dieu do.
    //
    // `createNewSequenceFromClips` thi chay thang, khong hoi gi. Do duoc them
    // hai dieu quan trong:
    //   1. No TON TRONG in/out cua projectItem  -> dat in/out = doan giu dau
    //      tien la sequence moi ra dung doan do, khong phai ca clip.
    //   2. No dat CA HINH LAN TIENG (V1 + A1 cung mot luc) -> dung yeu cau cua
    //      anh Tien: "cat la phai cat ca audio va video cung cho".
    if (typeof app.project.createNewSequenceFromClips !== 'function') {
      return 'ERR:THIEU_API|app.project.createNewSequenceFromClips';
    }

    var inGoc = null, outGoc = null;
    try { inGoc = muc[0].pi.getInPoint(); outGoc = muc[0].pi.getOutPoint(); } catch (e) {}

    var soLoi = 0, loiDau = '';
    var seqMoi = null, tenThat = '', batDau = 0;

    if (laLoDau) {
      var eDau = ac_datInOut(muc[0].pi, muc[0].a, muc[0].b);
      if (eDau) return 'ERR:TAO_SEQ_LOI|khong dat duoc in/out cho doan dau: ' + eDau;
      try {
        app.project.createNewSequenceFromClips(tenSeq, [muc[0].pi], app.project.rootItem);
        seqMoi = app.project.activeSequence;
      } catch (e) { return 'ERR:TAO_SEQ_LOI|' + e.toString(); }
      if (!seqMoi) return 'ERR:TAO_SEQ_LOI|goi xong nhung khong co sequence nao duoc kich hoat';
      $.global.__acSeqMoi = seqMoi;
      batDau = 1; // doan dau da nam trong sequence roi
    } else {
      seqMoi = $.global.__acSeqMoi;
      if (!seqMoi) return 'ERR:MAT_SEQUENCE_MOI|';
      batDau = 0; // lo sau: dat het, khong bo doan nao
    }
    // Premiere co the doi ten neu trung — lay ten THAT chu dung tin ten minh dat.
    tenThat = String(seqMoi.name);

    var trackV = (seqMoi.videoTracks.numTracks > 0) ? seqMoi.videoTracks[0] : null;
    var trackA = (seqMoi.audioTracks.numTracks > 0) ? seqMoi.audioTracks[0] : null;
    if (coVideo && !trackV) return 'ERR:SEQ_MOI_KHONG_CO_TRACK|video';
    if (!trackA && !coVideo) return 'ERR:SEQ_MOI_KHONG_CO_TRACK|audio';

    // Thong so lay theo CLIP GOC (do createNewSequenceFromClips tu chon) — dung
    // hon la ep theo sequence goc, vi khong co kéo/co dan hinh.
    // fps cua sequence MOI — vua de bao cao, vua de lam tron moc dat clip.
    var fpsMoi = 0;
    try { fpsMoi = 1 / seqMoi.getSettings().videoFrameRate.seconds; } catch (e) {}
    var thongSo = (fpsMoi > 0) ? ('theo-clip-goc ' + fpsMoi.toFixed(2) + 'fps') : 'theo-clip-goc';

    // ── 4. Dat cac doan CON LAI, noi lien tiep vao sau doan dau ──
    //
    // Moc dat clip ke tiep phai DOC LAI tu clip vua dat, KHONG cong don so minh
    // tu tinh. Premiere lam tron vi tri ve luoi khung hinh cua sequence; cong don
    // so tinh duoc thi lech dan va de lai khe ho. Do that: cong don -> ho 1 khung
    // (0,0400s); doc lai -> 0.
    // Moc luon DOC LAI tu clip cuoi cung dang co tren track — nho vay lo sau tu
    // biet dat tiep vao dau, khong can panel truyen sang.
    //
    // ☠️ DA THU BO `ac_mocCuoi()` DI CHO NHANH — HONG. DUNG THU LAI.
    //
    //   Ban 0.8.0 doan rang `ac_mocCuoi()` goi sau moi doan la thu pham lam cham,
    //   vi `track.clips.numItems` bat Premiere dung lai ca danh sach clip. Duong
    //   cong do duoc rat giong N^2 (video 58 phut, 1.741 doan):
    //       doan thu 900 -> 0,50 giay | 1.350 -> 0,75 | 1.650 -> 0,92
    //
    //   Da doi sang tu cong don, cu 25 doan moi doc lai mot lan. KET QUA:
    //     - KHONG nhanh hon. Do lai tren 588 doan: 0,28 -> 0,42 -> 0,52 giay/doan,
    //       do doc 0,00082 — gan y HET ban cu (0,00083).
    //     - Lai lam HO 0,367 giay tren 588 doan (cong don co lam tron van truot).
    //
    //   Roi do THANG chinh cai ham bi nghi oan, tren track 588 clip:
    //       ac_mocCuoi        = 0,2 ms/lan
    //       doc numItems      = 0 ms
    //       doc clips[n-1].end = 0,15 ms
    //
    //   0,2 mili giay, trong khi moi doan ton 400-500 mili giay. **No khong bao
    //   gio la thu pham.** Cho cham nam trong chinh `overwriteClip` cua Adobe —
    //   khong sua duoc tu script.
    //
    //   Bai hoc: nhin duong cong roi doan ra thu pham, ma KHONG do chinh cai
    //   minh dinh sua. Do truoc, sua sau.
    //
    //   Duong di that neu muon nhanh: **xuat FCPXML/EDL roi import mot lan**,
    //   bo han vong lap ExtendScript nay.
    //
    // Vi sao doc lai chu khong cong don: Premiere lam tron vi tri clip ve luoi
    // khung hinh cua sequence, nen cong don so tu tinh se lech dan va de lai khe
    // ho. Do that: cong don -> ho 1 khung (0,0400s) sau 32 doan; doc lai -> 0.
    var tDich = coVideo ? trackV : trackA;
    var moc = ac_mocCuoi(tDich, laLoDau ? (muc[0].b - muc[0].a) : 0);
    for (i = batDau; i < muc.length; i++) {
      var e1 = ac_datInOut(muc[i].pi, muc[i].a, muc[i].b);
      if (e1) { soLoi++; if (!loiDau) loiDau = 'setInPoint: ' + e1; continue; }
      var e2 = ac_datClip(tDich, muc[i].pi, moc);
      if (e2) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + e2; continue; }
      moc = ac_mocCuoi(tDich, moc + (muc[i].b - muc[i].a));
    }

    // ── 5. TIENG phai di theo HINH ──
    // Doan DAU chac chan co tieng (createNewSequenceFromClips dat ca hai). Cac
    // doan sau dat bang overwriteClip thi "thuong" keo audio theo — "thuong"
    // khong phai "chac", nen DEM lai: thieu bao nhieu thi dat rieng bay nhieu.
    var dsV = trackV ? ac_docTrack(trackV) : [];
    var dsA = trackA ? ac_docTrack(trackA) : [];
    var tiengTuTheo = (dsA.length >= dsV.length && dsA.length > 0) ? 1 : 0;
    if (coVideo && trackA && dsA.length < dsV.length) {
      // Doc lai moc that sau moi doan — cung ly do nhu buoc 4.
      var moc2 = 0;
      for (i = 0; i < muc.length; i++) {
        ac_datInOut(muc[i].pi, muc[i].a, muc[i].b);
        ac_datClip(trackA, muc[i].pi, moc2);
        moc2 = ac_mocCuoi(trackA, moc2 + (muc[i].b - muc[i].a));
      }
      dsA = ac_docTrack(trackA);
    }

    // Tra in/out cua master clip ve nhu cu — dung de lai dau vet trong Project panel.
    if (inGoc !== null) {
      try {
        muc[0].pi.setInPoint(inGoc.seconds, 4);
        muc[0].pi.setOutPoint(outGoc.seconds, 4);
      } catch (e) {}
    }

    // ── 6. DO LAI ket qua that, khong tin "khong bao loi" ──
    var yeuCau = 0;
    for (i = 0; i < muc.length; i++) yeuCau += (muc[i].b - muc[i].a);
    var tv = ac_tong(trackV ? ac_docTrack(trackV) : []);
    var ta = ac_tong(dsA);

    var out = [];
    out.push('seqMoi=' + tenThat);
    out.push('seqGoc=' + seqGoc.name);
    out.push('thongSo=' + thongSo);
    out.push('yeuCauDoan=' + muc.length);
    out.push('yeuCauGiay=' + yeuCau);
    out.push('hinhClip=' + tv.so);
    out.push('hinhGiay=' + tv.tong);
    out.push('hinhCuoi=' + tv.cuoi);
    out.push('tiengClip=' + ta.so);
    out.push('tiengGiay=' + ta.tong);
    out.push('tiengCuoi=' + ta.cuoi);
    out.push('tiengTuTheo=' + tiengTuTheo);
    out.push('soLoi=' + soLoi);
    out.push('loiDau=' + loiDau);
    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_buildKeep', e);
  }
}

/**
 * ac_hoanTacTaiCho — DUNG LAI vung vua bi cat tai cho, ve dung nhu truoc.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ VI SAO PHAI TU LAM, KHONG DUA VAO Ctrl+Z
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Cat tai cho chen N doan = **N buoc undo rieng**. Bam Ctrl+Z mot lan chi go
 * mot doan. Muon ve nguyen phai bam dung N lan: thieu thi con do dang, thua thi
 * lui QUA ca trang thai goc.
 *
 * Do that 2026-07-29: anh Tien cat 17 doan roi bam Ctrl+Z — sequence con lai
 * **1 clip 3,27 giay**. Truoc do chinh toi cung vap: goi undo 40+ lan trong
 * vong lap, sequence thanh **0 clip, trong tron**, redo khong cuu duoc.
 *
 * Da do API gop undo tren Premiere Beta 26.5:
 *      app.beginUndoGroup     -> undefined
 *      qe.project.beginUndoGroup -> undefined
 * Khong co. Nen khong the lam "mot buoc undo duy nhat".
 *
 * Cach chay duoc: panel NHO san mo ta cac clip goc (duong dan + in/out + vi tri
 * tren timeline) tu luc doc vung, roi dung lai tu do. Khong phu thuoc undo
 * history — chac chan hon nhieu.
 *
 * @param clipsStr "kind,ti,seqTu,seqDen,srcTu,srcDen,path;..." (path o CUOI vi
 *   no co the chua dau phay)
 */
function ac_hoanTacTaiCho(clipsStr) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';

    // ── 1. Tach mo ta clip goc ──
    var ds = [], i;
    var phan = String(clipsStr).split(';');
    for (i = 0; i < phan.length; i++) {
      if (!phan[i]) continue;
      var f = phan[i].split(',');
      if (f.length < 7) continue;
      // Duong dan nam o cuoi va co the chua dau phay -> ghep lai tu phan tu 6
      var p = f.slice(6).join(',');
      ds.push({
        kind: f[0], ti: parseInt(f[1], 10),
        seqTu: parseFloat(f[2]), seqDen: parseFloat(f[3]),
        srcTu: parseFloat(f[4]), srcDen: parseFloat(f[5]),
        path: p
      });
    }
    if (!ds.length) return 'ERR:KHONG_CO_MO_TA|';

    // ── 2. Tim projectItem theo duong dan file ──
    // Duyet ca cay Project. So sanh bang duong dan chu khong bang ten: hai file
    // cung ten o hai thu muc khac nhau la chuyen thuong trong du an that.
    function chuanHoa(s) { return String(s).replace(/\\/g, '/').toLowerCase(); }
    var kho = {};
    function quet(it) {
      var n = 0;
      try { n = it.children.numItems; } catch (e) { return; }
      for (var k = 0; k < n; k++) {
        var c;
        try { c = it.children[k]; } catch (e) { continue; }
        if (c.type === 2) { quet(c); continue; }
        try {
          var mp = chuanHoa(c.getMediaPath());
          if (mp && !kho[mp]) kho[mp] = c;
        } catch (e) {}
      }
    }
    quet(app.project.rootItem);

    for (i = 0; i < ds.length; i++) {
      var pi = kho[chuanHoa(ds[i].path)];
      if (!pi) return 'ERR:KHONG_THAY_FILE|' + ds[i].path;
      ds[i].pi = pi;
    }

    // ── 3. Xoa sach vung roi chen lai clip goc ──
    var vungA = ds[0].seqTu, vungB = ds[0].seqDen;
    for (i = 1; i < ds.length; i++) {
      if (ds[i].seqTu < vungA) vungA = ds[i].seqTu;
      if (ds[i].seqDen > vungB) vungB = ds[i].seqDen;
    }
    var fps = 30;
    try { fps = 1 / seq.getSettings().videoFrameRate.seconds; } catch (e) {}
    var saiSo = 0.5 / fps;

    var soXoa = 0;
    function xoaTrong(dsTrack, so) {
      var d = 0;
      for (var k = 0; k < so; k++) {
        var t, n = 0;
        try { t = dsTrack[k]; n = t.clips.numItems; } catch (e) { continue; }
        // Duyet NGUOC: xoa tu dau thi chi so tut xuong, vong lap nhay coc.
        for (var m = n - 1; m >= 0; m--) {
          try {
            var c = t.clips[m];
            if (c.end.seconds <= vungA + saiSo) continue;
            if (c.start.seconds >= vungB - saiSo) continue;
            c.remove(false, false);
            d++;
          } catch (e) {}
        }
      }
      return d;
    }
    soXoa = xoaTrong(seq.videoTracks, seq.videoTracks.numTracks) +
            xoaTrong(seq.audioTracks, seq.audioTracks.numTracks);

    var soLoi = 0, loiDau = '';
    for (i = 0; i < ds.length; i++) {
      var tr;
      try {
        tr = (ds[i].kind === 'V') ? seq.videoTracks[ds[i].ti] : seq.audioTracks[ds[i].ti];
      } catch (e) { soLoi++; continue; }
      if (!tr) { soLoi++; continue; }
      var e1 = ac_datInOut(ds[i].pi, ds[i].srcTu, ds[i].srcDen);
      if (e1) { soLoi++; if (!loiDau) loiDau = 'setInPoint: ' + e1; continue; }
      var e2 = ac_datClip(tr, ds[i].pi, ds[i].seqTu);
      if (e2) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + e2; continue; }
    }

    // ── 4. DO LAI, khong tin "khong bao loi" ──
    var tv = ac_tong(seq.videoTracks.numTracks > 0 ? ac_docTrack(seq.videoTracks[0]) : []);
    var ta = ac_tong(seq.audioTracks.numTracks > 0 ? ac_docTrack(seq.audioTracks[0]) : []);
    var out = [];
    out.push('daXoa=' + soXoa);
    out.push('daChen=' + (ds.length - soLoi));
    out.push('hinhClip=' + tv.so);
    out.push('hinhGiay=' + tv.tong);
    out.push('hinhCuoi=' + tv.cuoi);
    out.push('tiengClip=' + ta.so);
    out.push('tiengGiay=' + ta.tong);
    out.push('soLoi=' + soLoi);
    out.push('loiDau=' + loiDau);
    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_hoanTacTaiCho', e);
  }
}

/**
 * ac_catTaiCho — CAT NGAY TREN SEQUENCE DANG MO, khong tao sequence moi.
 *
 * Anh Tien 2026-07-29: *"co 2 option cho editor lua em: mot la import vao
 * sequence do luon, hai la tao sequence moi"*.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ VI SAO PHAI XOA ROI CHEN LAI, KHONG PHAI "CAT VA DON"
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Premiere KHONG cho panel CEP lam ripple delete. Do that 2026-07-27 (xem
 * `ac_spikeCloseGap` dau file nay):
 *   - razor CHAY (cat duoc tai IN/OUT bang chuoi timecode)
 *   - `remove(true, false)` chi NHAC CLIP DI, de lai lo trong; phan sau KHONG
 *     nhich len
 *   - Da thu BA cach dong lo, ca ba deu khong duoc
 *
 * Nen cach duy nhat chay duoc: **xoa sach vung roi chen lai cac doan giu tu
 * diem IN**. Ket qua giong het ripple delete, ma khong dung QE DOM (thu do
 * lam SAP Premiere neu goi sai tham so).
 *
 * ⚠️ GIOI HAN CO Y: chi nhan khi vung khoanh chay TOI HET timeline. Con clip
 * phia sau vung thi tu choi ngay tu dau — vi chen doan giu (ngan hon vung goc)
 * xong thi giua no va phan sau se ho mot khoang, ma khong don len duoc. Tha
 * bao thang con hon de lai lo am tham roi anh Tien phat hien sau.
 *
 * @param keepsStr Cung dinh dang voi `ac_buildKeep`: "kind,ti,co,a,b;..."
 * @param laLoDau '1' = lo dau (xoa vung roi chen), '0' = chen tiep
 */
function ac_catTaiCho(keepsStr, laLoDau) {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var loDau = (String(laLoDau) !== '0');
    var seq = loDau ? app.project.activeSequence : $.global.__acSeqTaiCho;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    if (loDau) $.global.__acSeqTaiCho = seq;

    var vungA = ac_seqInSec(seq), vungB = ac_seqOutSec(seq);
    if (loDau && (vungA < 0 || vungB < 0 || vungB <= vungA)) return 'ERR:CHUA_KHOANH_VUNG|';

    var fps = 30;
    try { fps = 1 / seq.getSettings().videoFrameRate.seconds; } catch (e) {}
    var saiSo = 0.5 / fps;

    // ── 1. Tach danh sach doan can giu ──
    var muc = [], i, j;
    var phan = String(keepsStr).split(';');
    for (i = 0; i < phan.length; i++) {
      if (!phan[i]) continue;
      var f = phan[i].split(',');
      if (f.length < 5) continue;
      var a = parseFloat(f[3]), b = parseFloat(f[4]);
      if (isNaN(a) || isNaN(b) || b <= a) continue;
      muc.push({ kind: f[0], ti: parseInt(f[1], 10), co: parseInt(f[2], 10), a: a, b: b });
    }
    if (!muc.length) return 'ERR:KHONG_CO_DOAN_GIU|';

    // ── 2. Giu projectItem TRUOC khi xoa ──
    // Xoa xong thi chi so clip khong con dung nua, nen phai lay het tu bay gio.
    var coVideo = false;
    for (i = 0; i < muc.length; i++) {
      var tr0, c0;
      try {
        tr0 = (muc[i].kind === 'V') ? seq.videoTracks[muc[i].ti] : seq.audioTracks[muc[i].ti];
        c0 = tr0.clips[muc[i].co];
      } catch (e) { return 'ERR:CLIP_DA_DOI|khong tim thay clip so ' + muc[i].co; }
      if (!c0 || !c0.projectItem) return 'ERR:CLIP_DA_DOI|clip so ' + muc[i].co + ' khong con';
      muc[i].pi = c0.projectItem;
      if (muc[i].kind === 'V') coVideo = true;
    }

    var trackV = (seq.videoTracks.numTracks > 0) ? seq.videoTracks[0] : null;
    var trackA = (seq.audioTracks.numTracks > 0) ? seq.audioTracks[0] : null;
    var tDich = coVideo ? trackV : trackA;
    if (!tDich) return 'ERR:KHONG_CO_TRACK|';

    var soXoa = 0;
    if (loDau) {
      // ── 3. TU CHOI neu con clip phia SAU vung ──
      // Chen doan giu xong se ngan hon vung goc; phan sau khong don len duoc.
      var coClipSau = 0;
      function demSau(ds, so) {
        var d = 0;
        for (var k = 0; k < so; k++) {
          var t, n = 0;
          try { t = ds[k]; n = t.clips.numItems; } catch (e) { continue; }
          for (var m = 0; m < n; m++) {
            try { if (t.clips[m].start.seconds >= vungB - saiSo) d++; } catch (e) {}
          }
        }
        return d;
      }
      coClipSau = demSau(seq.videoTracks, seq.videoTracks.numTracks) +
                  demSau(seq.audioTracks, seq.audioTracks.numTracks);
      if (coClipSau > 0) {
        return 'ERR:CON_CLIP_SAU_VUNG|' + coClipSau;
      }

      // ── 4. XOA sach clip trong vung ──
      // Duyet NGUOC (cuoi -> dau): xoa tu dau thi chi so cac clip sau tut xuong,
      // vong lap se nhay coc va bo sot.
      function xoaTrong(ds, so) {
        var d = 0;
        for (var k = 0; k < so; k++) {
          var t, n = 0;
          try { t = ds[k]; n = t.clips.numItems; } catch (e) { continue; }
          for (var m = n - 1; m >= 0; m--) {
            try {
              var c = t.clips[m];
              if (c.end.seconds <= vungA + saiSo) continue;
              if (c.start.seconds >= vungB - saiSo) continue;
              c.remove(false, false);
              d++;
            } catch (e) {}
          }
        }
        return d;
      }
      soXoa = xoaTrong(seq.videoTracks, seq.videoTracks.numTracks) +
              xoaTrong(seq.audioTracks, seq.audioTracks.numTracks);
    }

    // ── 5. Chen cac doan giu, bat dau tu diem IN ──
    // Doc lai moc that sau moi doan, KHONG cong don — Premiere lam tron vi tri
    // ve luoi khung hinh, cong don la ho dan. Xem khoi chu thich o `ac_buildKeep`.
    var moc = ac_mocCuoi(tDich, loDau ? vungA : 0);
    if (loDau && moc < vungA) moc = vungA;
    var soLoi = 0, loiDau = '';
    for (i = 0; i < muc.length; i++) {
      var e1 = ac_datInOut(muc[i].pi, muc[i].a, muc[i].b);
      if (e1) { soLoi++; if (!loiDau) loiDau = 'setInPoint: ' + e1; continue; }
      var e2 = ac_datClip(tDich, muc[i].pi, moc);
      if (e2) { soLoi++; if (!loiDau) loiDau = 'overwriteClip: ' + e2; continue; }
      moc = ac_mocCuoi(tDich, moc + (muc[i].b - muc[i].a));
    }

    // ── 6. TIENG phai di theo HINH — dem lai, thieu bao nhieu dat rieng bay nhieu ──
    var dsV = trackV ? ac_docTrack(trackV) : [];
    var dsA = trackA ? ac_docTrack(trackA) : [];
    var tiengTuTheo = (dsA.length >= dsV.length && dsA.length > 0) ? 1 : 0;
    if (coVideo && trackA && dsA.length < dsV.length) {
      var moc2 = ac_mocCuoi(trackA, vungA);
      if (moc2 < vungA) moc2 = vungA;
      for (i = 0; i < muc.length; i++) {
        ac_datInOut(muc[i].pi, muc[i].a, muc[i].b);
        ac_datClip(trackA, muc[i].pi, moc2);
        moc2 = ac_mocCuoi(trackA, moc2 + (muc[i].b - muc[i].a));
      }
      dsA = ac_docTrack(trackA);
    }

    // ── 7. DO LAI ket qua that ──
    var yeuCau = 0;
    for (i = 0; i < muc.length; i++) yeuCau += (muc[i].b - muc[i].a);
    var tv2 = ac_tong(trackV ? ac_docTrack(trackV) : []);
    var ta2 = ac_tong(dsA);

    var out = [];
    out.push('seqMoi=' + String(seq.name));
    out.push('seqGoc=' + String(seq.name));
    out.push('thongSo=cat tai cho ' + fps.toFixed(2) + 'fps');
    out.push('daXoa=' + soXoa);
    out.push('yeuCauDoan=' + muc.length);
    out.push('yeuCauGiay=' + yeuCau);
    out.push('hinhClip=' + tv2.so);
    out.push('hinhGiay=' + tv2.tong);
    out.push('hinhCuoi=' + tv2.cuoi);
    out.push('tiengClip=' + ta2.so);
    out.push('tiengGiay=' + ta2.tong);
    out.push('tiengCuoi=' + ta2.cuoi);
    out.push('tiengTuTheo=' + tiengTuTheo);
    out.push('soLoi=' + soLoi);
    out.push('loiDau=' + loiDau);
    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_catTaiCho', e);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   ĐƯỜNG RA — xoá phụ đề và marker do panel tạo
   ══════════════════════════════════════════════════════════════════════════

   Anh Tiến 30/07: *"thêm nút xoá scripts và xoá marker trong transcripts nữa"*.
   Đây là luật đã chốt từ lâu: **có đường VÀO thì phải có đường RA**.

   Và nó giải quyết luôn chuyện tích tụ đo được cùng ngày: mỗi lần chạy thêm
   một item `.srt` vào project (đo: 2 -> 3) và một caption track trên sequence.
   Marker thì đã tự dọn (nhận biết bằng tiền tố 'AC ').

   ☠️ CHỈ ĐỤNG THỨ DO PANEL TẠO. Marker nhận bằng tiền tố; item `.srt` nhận
   bằng tên có '-autocut-'. Phụ đề người dùng tự làm thì không được chạm. */

/** Dò xem bản Premiere này cho làm gì với caption track. CHỈ ĐỌC, không sửa. */
function ac_probeCaption() {
  var out = [];
  function thu(ten, fn) {
    var r;
    try { r = fn(); } catch (e) { r = 'LOI: ' + e.toString(); }
    out.push(ten + ' = ' + r);
  }
  try {
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    thu('seq.captionTracks', function () { return typeof seq.captionTracks; });
    thu('seq.captionTracks.numTracks', function () { return seq.captionTracks.numTracks; });
    thu('seq.videoTracks.numTracks', function () { return seq.videoTracks.numTracks; });
    thu('projectItem.deleteClip', function () {
      return typeof app.project.rootItem.children[0].deleteClip;
    });
    thu('project.deleteSequence', function () { return typeof app.project.deleteSequence; });
    // Dem item .srt do panel tao
    var n = 0, ten = [];
    for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
      var it = app.project.rootItem.children[i];
      if (it && it.name && /-autocut-.*\.srt$/i.test(it.name)) { n++; if (ten.length < 3) ten.push(it.name); }
    }
    out.push('itemSrtCuaPanel = ' + n);
    out.push('viDu = ' + ten.join(' | '));
    return 'OK:' + out.join('\n');
  } catch (e) {
    return ac_err('ac_probeCaption', e);
  }
}

/** Đếm thứ panel đã tạo — để nút xoá nói HẬU QUẢ BẰNG SỐ THẬT trước khi bấm. */
function ac_demDoPanelTao() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';

    var soMarker = 0;
    try {
      var m = seq.markers.getFirstMarker();
      while (m) {
        if (String(m.name).indexOf('AC ') === 0) soMarker++;
        m = seq.markers.getNextMarker(m);
      }
    } catch (e) {}

    var soSrt = 0;
    for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
      var it = app.project.rootItem.children[i];
      if (it && it.name && /-autocut-.*\.srt$/i.test(it.name)) soSrt++;
    }
    return 'OK:marker=' + soMarker + '\nitemSrt=' + soSrt;
  } catch (e) {
    return ac_err('ac_demDoPanelTao', e);
  }
}

/** Xoá marker do panel đặt. Marker người dùng tự đặt KHÔNG bị chạm. */
function ac_xoaMarker() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:CHUA_MO_SEQUENCE|';
    if (!seq.markers) return 'ERR:THIEU_API|sequence.markers';

    var truoc = seq.markers.numMarkers;
    var daXoa = 0;
    var m = seq.markers.getFirstMarker();
    while (m) {
      var ke = seq.markers.getNextMarker(m);
      if (String(m.name).indexOf('AC ') === 0) { seq.markers.deleteMarker(m); daXoa++; }
      m = ke;
    }
    return 'OK:daXoa=' + daXoa + '\ntruoc=' + truoc + '\nconLai=' + seq.markers.numMarkers;
  } catch (e) {
    return ac_err('ac_xoaMarker', e);
  }
}

/**
 * Xoá phụ đề do panel tạo: gỡ item `.srt` khỏi project.
 *
 * ⚠️ File `.srt` TRÊN ĐĨA thì GIỮ NGUYÊN — cố ý. Người dùng có thể đã sửa tay,
 * và xoá file của người ta là việc không được tự làm. Muốn dọn đĩa thì họ tự vào
 * thư mục xoá, ở đó họ thấy rõ mình đang xoá gì.
 *
 * ☠️ Vấp 30/07/2026 — do thật khi chạy nút này lần đầu trên Premiere: bản đầu
 * gọi `it.deleteClip()`, hàm KHÔNG TỒN TẠI trên ProjectItem (`ReferenceError`),
 * nên `daXoa` luôn ra 0. Đổi sang `it.deleteBin()` cũng KHÔNG XONG — gọi trả về
 * `true`, không ném lỗi, nhưng item vẫn còn nguyên (đo cả sau 500ms chờ, loại
 * trừ khả năng do thời gian). Tra tài liệu chính thức thì `deleteBin()`
 * **CHỈ hoạt động trên bin (thư mục)**, không có API nào xoá thẳng một clip
 * item riêng lẻ. Đường vòng CHÍNH THỐNG (toàn API tài liệu hoá, không đụng QE
 * DOM): tạo bin tạm -> `moveBin()` item vào đó -> `deleteBin()` cả bin. Đo thật:
 * 15 item -> 14, bin tạm cũng biến mất, không để lại rác.
 */
function ac_xoaPhuDe() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var root = app.project.rootItem;
    var truoc = root.children.numItems;

    // Duyet NGUOC: xoa phan tu lam mang co lai, duyet xuoi la bo sot.
    var daXoa = 0, loiDau = '';
    var binTam = null;
    for (var i = root.children.numItems - 1; i >= 0; i--) {
      var it = root.children[i];
      if (!it || !it.name || !/-autocut-.*\.srt$/i.test(it.name)) continue;
      try {
        if (!binTam) binTam = root.createBin('__aio_xoa_tam__');
        it.moveBin(binTam);
        daXoa++;
      } catch (e) {
        if (!loiDau) loiDau = e.toString();
      }
    }
    if (binTam) {
      try { binTam.deleteBin(); } catch (e) {
        if (!loiDau) loiDau = 'deleteBin bin tam: ' + e.toString();
      }
    }
    return 'OK:daXoa=' + daXoa + '\ntruoc=' + truoc +
           '\nconLai=' + root.children.numItems + '\nloiDau=' + loiDau;
  } catch (e) {
    return ac_err('ac_xoaPhuDe', e);
  }
}
