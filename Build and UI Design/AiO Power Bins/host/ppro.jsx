/**
 * Premiere Pro - logic rieng (LAM TRUOC theo PLAN.md).
 * Phase 5: import file / MOGRT vao project va chen vao timeline tai playhead.
 *
 * Moi ham tra ve chuoi dang "OK:<thong diep>" hoac "ERR:<thong diep>"
 * de panel de phan tich (khong phu thuoc JSON trong ExtendScript).
 */

/**
 * Kiem tra nhanh moi truong Premiere.
 */
function ppro_check() {
  try {
    if (app && app.project) {
      var name = app.project.name ? app.project.name : '(untitled)';
      return 'OK:' + name;
    }
    return 'OK:(chua mo project)';
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * So sequence trong project.
 */
function ppro_sequenceCount() {
  try {
    if (app.project && app.project.sequences) {
      return String(app.project.sequences.numSequences);
    }
  } catch (e) {}
  return '0';
}

/**
 * Vi tri playhead cua sequence dang mo, dang chuoi ticks.
 *
 * Panel goi ham nay hai lan cach nhau ~1.5 giay: vi tri DOI nghia la timeline
 * dang phat/tua/render -> hang doi nen tam dung de nhuong may cho Premiere
 * (OPTIMIZE B3). Tra ve '' khi chua mo sequence hoac co loi.
 */
function ppro_playerPosition() {
  try {
    var seq = app.project ? app.project.activeSequence : null;
    if (!seq) return '';
    var t = seq.getPlayerPosition();
    if (!t) return '';
    return String(t.ticks);
  } catch (e) {
    return '';
  }
}

/**
 * Tim projectItem theo duong dan file trong project (de tranh import trung).
 */
function ppro_findItemByPath(root, filePath) {
  try {
    for (var i = 0; i < root.children.numItems; i++) {
      var item = root.children[i];
      if (item.type === ProjectItemType.BIN) {
        var found = ppro_findItemByPath(item, filePath);
        if (found) return found;
      } else {
        try {
          if (item.getMediaPath && item.getMediaPath() === filePath) return item;
        } catch (e) {}
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Import file vao project (neu chua co). Tra ve projectItem hoac null.
 */
function ppro_importItem(filePath) {
  var root = app.project.rootItem;
  var existing = ppro_findItemByPath(root, filePath);
  if (existing) return existing;

  app.project.importFiles([filePath], true, root, false);
  return ppro_findItemByPath(root, filePath);
}

/**
 * Chi import file vao Project panel (khong chen timeline).
 */
function ppro_importToProject(filePath) {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var item = ppro_importItem(filePath);
    if (!item) return 'ERR:Import that bai';
    return 'OK:Da import vao project';
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Track nay co TRONG trong khoang [start, end) khong.
 *
 * [1.0.3] SUA LOI GOC: ban 1.0.2 di tim track RONG HOAN TOAN. Timeline dung
 * that thi track nao cung da co clip -> khong tim duoc -> roi ve mac dinh track
 * dau tien va GHI DE len clip cua nguoi dung. Cai can tim khong phai "track
 * rong" ma la "track trong DUNG CHO minh sap dat vao".
 */
function ppro_trackFreeAt(track, start, end) {
  try {
    for (var i = 0; i < track.clips.numItems; i++) {
      var c = track.clips[i];
      // Chong lan khi: clip bat dau TRUOC khi minh ket thuc, va ket thuc SAU
      // khi minh bat dau. Cham dau-duoi nhau (bang nhau) thi khong tinh la de.
      if (c.start.seconds < end && c.end.seconds > start) { return false; }
    }
    return true;
  } catch (e) {
    return false; // khong doc duoc thi coi nhu ban, tuyet doi khong lieu de len
  }
}

/** Track dau tien trong o khoang [start,end). Tra ve -1 neu khong con cho nao. */
function ppro_pickFreeTrack(tracks, start, end) {
  try {
    for (var i = 0; i < tracks.numTracks; i++) {
      if (ppro_trackFreeAt(tracks[i], start, end)) { return i; }
    }
  } catch (e) {}
  return -1;
}

/**
 * Het cho thi THEM track moi. Dung QE DOM (khong chinh thuc nhung moi panel deu
 * dung). Tra ve chi so track vua them, hoac -1 neu khong them duoc.
 *
 * Khong dam bao chay tren moi phien ban Premiere, nen luon KIEM TRA LAI so track
 * sau khi goi thay vi tin la da them duoc.
 */
function ppro_addTrack(seq, isAudio) {
  try {
    var before = isAudio ? seq.audioTracks.numTracks : seq.videoTracks.numTracks;
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    if (isAudio) { qeSeq.addTracks(0, 0, 1, before); }
    else { qeSeq.addTracks(1, before, 0, 0); }
    var after = isAudio ? seq.audioTracks.numTracks : seq.videoTracks.numTracks;
    if (after > before) { return after - 1; }
  } catch (e) {}
  return -1;
}

/**
 * Import va chen file vao sequence dang mo, tai vi tri playhead.
 *
 * [1.0.2] SUA LOI: ban cu LUON chen len track VIDEO, ke ca file chi co am thanh
 * (.wav/.mp3) — sai track, va tuy phien ban Premiere co the bao loi hoac khong
 * chen duoc gi. Nay panel gui kem LOAI asset:
 *    'audio'  -> track am thanh trong dau tien
 *    con lai  -> track video trong dau tien
 * Video co san am thanh thi Premiere tu dat phan tieng xuong track am thanh
 * tuong ung (clip lien ket), khong can lam gi them.
 *
 * @param filePath duong dan file
 * @param kind     'audio' | 'video' | 'image' | ... (khong truyen = coi nhu video)
 */
function ppro_importToTimeline(filePath, kind, durationSec) {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    var item = ppro_importItem(filePath);
    if (!item) return 'ERR:Import that bai';

    var time = seq.getPlayerPosition();
    var start = time.seconds;
    // Panel gui kem thoi luong. Khong biet thi lay 5 giay cho rong tay — tha
    // tim track thoat hon con hon de len clip cua nguoi dung.
    var dur = parseFloat(durationSec);
    if (!dur || dur <= 0) { dur = 5; }
    var end = start + dur;

    var isAudio = (kind === 'audio');
    var tracks = isAudio ? seq.audioTracks : seq.videoTracks;
    var label = isAudio ? 'A' : 'V';

    var idx = ppro_pickFreeTrack(tracks, start, end);
    if (idx < 0) {
      // Het cho -> them track moi thay vi de len clip dang co.
      idx = ppro_addTrack(seq, isAudio);
      if (idx < 0) {
        return 'ERR:Moi track ' + (isAudio ? 'am thanh' : 'video') +
               ' deu co clip tai vi tri nay, va khong them duoc track moi. ' +
               'Hay them mot track trong roi thu lai.';
      }
      tracks = isAudio ? seq.audioTracks : seq.videoTracks;
    }

    tracks[idx].overwriteClip(item, start);
    return 'OK:Da chen vao timeline (track ' + label + (idx + 1) + ')';
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Lay duong dan file goc cua cac clip DANG CHON tren timeline.
 *
 * Vi sao can: Premiere KHONG cho keo clip tu timeline tha vao panel CEP (khong
 * co API drag-out). Cach chay duoc la: nguoi dung chon clip tren timeline roi
 * bam nut trong panel, panel goi ham nay de lay duong dan file that.
 *
 * Tra ve 'OK:' + cac duong dan noi bang ky tu | (rong neu khong chon gi).
 * Bo qua clip khong co file goc tren dia (title, color matte, adjustment layer,
 * nested sequence) — chung khong co getMediaPath.
 */
function ppro_getSelectedClipPaths() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    var paths = [];
    var seenPaths = {};

    function collect(clip) {
      try {
        if (!clip || !clip.projectItem) return;
        var p = clip.projectItem.getMediaPath ? clip.projectItem.getMediaPath() : '';
        if (!p) return;
        if (seenPaths[p]) return; // cung 1 file dung nhieu lan -> chi lay 1 lan
        seenPaths[p] = true;
        paths.push(p);
      } catch (e) {}
    }

    // Cach 1: API getSelection() (ban Premiere moi). Nhanh va dung nhat.
    var used = false;
    try {
      if (typeof seq.getSelection === 'function') {
        var sel = seq.getSelection();
        if (sel && sel.length) {
          for (var s = 0; s < sel.length; s++) collect(sel[s]);
          used = true;
        }
      }
    } catch (e) {}

    // Cach 2 (du phong): quet moi track, doc co isSelected cua tung clip.
    if (!used) {
      var groups = [seq.videoTracks, seq.audioTracks];
      for (var g = 0; g < groups.length; g++) {
        var tracks = groups[g];
        if (!tracks) continue;
        for (var t = 0; t < tracks.numTracks; t++) {
          var clips = tracks[t].clips;
          for (var c = 0; c < clips.numItems; c++) {
            var clip = clips[c];
            var isSel = false;
            try { isSel = clip.isSelected(); } catch (e) {}
            if (isSel) collect(clip);
          }
        }
      }
    }

    return 'OK:' + paths.join('|');
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Chen Motion Graphics Template (.mogrt) vao sequence tai playhead.
 * Dung API rieng importMGT cua Premiere.
 */
function ppro_importMogrt(filePath) {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    var time = seq.getPlayerPosition();
    var start = time.seconds;
    // MOGRT mac dinh khoang 5 giay; lay rong tay mot chut cho chac.
    var end = start + 5;

    // [1.0.2] SUA LOI: ban cu truyen cung 0, 0 -> MOGRT LUON de len V1/A1 va
    // GHI DE len clip dang co o do.
    // [1.0.3] Tim theo "track TRONG TAI VI TRI NAY", khong phai "track rong
    // hoan toan" — timeline dung that thi khong track nao rong ca.
    var vIdx = ppro_pickFreeTrack(seq.videoTracks, start, end);
    if (vIdx < 0) { vIdx = ppro_addTrack(seq, false); }
    if (vIdx < 0) {
      return 'ERR:Moi track video deu co clip tai vi tri nay, va khong them ' +
             'duoc track moi. Hay them mot track video trong roi thu lai.';
    }

    var aIdx = ppro_pickFreeTrack(seq.audioTracks, start, end);
    if (aIdx < 0) { aIdx = seq.audioTracks.numTracks - 1; } // MOGRT thuong khong co tieng

    // importMGT(path, timeInTicks, videoTrackOffset, audioTrackOffset)
    var comp = seq.importMGT(filePath, time.ticks, vIdx, aIdx);
    if (!comp) return 'ERR:Chen MOGRT that bai';
    return 'OK:Da chen MOGRT vao timeline (track V' + (vIdx + 1) + ')';
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}
