/**
 * music.jsx — phan noi voi Premiere cua AiO Music.
 *
 * Phong theo `AiO Asset Manager/host/ppro.jsx` (da chay that tren ~28.900 file).
 * Khac mot diem QUAN TRONG: Asset Manager tu chon track trong dau tien, con
 * Music cho nguoi dung CHON TRACK DICH (A2 nhac nen / A3 SFX / A4 ambience) —
 * dung thoi quen dung phim: nhac nen luon nam mot track co dinh.
 *
 * ☠️ Moi ham tra ve CHUOI 'OK:...' hoac 'ERR:...'. Khong throw, vi
 * evalScript nuot exception thanh chuoi "EvalScript error." khong doc duoc.
 */

/** Vi tri con tro thoi gian (CTI) tinh bang giay. */
function mus_playerPosition() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';
    return 'OK:' + seq.getPlayerPosition().seconds;
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Thong tin sequence dang mo — de panel hien ten + so track am thanh
 * (khong the cho chon A4 neu sequence chi co 2 track).
 * Tra ve 'OK:<ten>|<so track audio>|<fps>'
 */
function mus_sequenceInfo() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';
    var n = 0;
    try { n = seq.audioTracks.numTracks; } catch (e) {}
    var fps = 0;
    try {
      // timebase la ticks/frame; 254016000000 ticks = 1 giay
      fps = Math.round(254016000000 / parseFloat(seq.timebase));
    } catch (e) {}
    return 'OK:' + seq.name + '|' + n + '|' + fps;
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Tim projectItem theo duong dan file — de KHONG import trung mot bai
 * nhieu lan khi nguoi dung chen di chen lai.
 * Duyet de quy vi bin long nhau.
 */
function mus_findItemByPath(filePath) {
  function walk(bin) {
    for (var i = 0; i < bin.children.numItems; i++) {
      var it = bin.children[i];
      try {
        if (it.type === ProjectItemType.BIN) {
          var found = walk(it);
          if (found) return found;
        } else if (it.getMediaPath && it.getMediaPath() === filePath) {
          return it;
        }
      } catch (e) {}
    }
    return null;
  }
  try {
    return walk(app.project.rootItem);
  } catch (e) {
    return null;
  }
}

/** Import file vao project (dung lai neu da co). */
function mus_importItem(filePath) {
  var existing = mus_findItemByPath(filePath);
  if (existing) return existing;
  try {
    app.project.importFiles([filePath], true, app.project.rootItem, false);
  } catch (e) {
    return null;
  }
  return mus_findItemByPath(filePath);
}

/** Track co trong trong khoang [start,end) khong. */
function mus_trackFree(track, start, end) {
  try {
    for (var i = 0; i < track.clips.numItems; i++) {
      var c = track.clips[i];
      var s = c.start.seconds, e = c.end.seconds;
      // Chong lan nhau: khong chong khi ket thuc truoc hoac bat dau sau
      if (!(e <= start || s >= end)) return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * CHEN NHAC VAO TIMELINE tai CTI, tren TRACK DICH nguoi dung chon.
 *
 * @param filePath    duong dan file nhac
 * @param trackIndex  track am thanh, dem tu 0 (A1=0, A2=1, A3=2, A4=3)
 * @param durationSec thoi luong bai — de biet co de len clip cu khong
 *
 * ☠️ KHONG dung `overwriteClip` mu quang: neu track dich da co clip tai cho do
 * thi de len = xoa nhac cu cua nguoi dung. Truong hop do BAO LOI va de nguoi
 * dung tu quyet, dung im lang ghi de.
 */
function mus_insertAudio(filePath, trackIndex, durationSec) {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    var idx = parseInt(trackIndex, 10);
    if (isNaN(idx) || idx < 0) idx = 1; // mac dinh A2

    var tracks = seq.audioTracks;
    if (idx >= tracks.numTracks) {
      return 'ERR:Sequence chi co ' + tracks.numTracks +
             ' track am thanh, khong co A' + (idx + 1) + '. Them track roi thu lai.';
    }

    var item = mus_importItem(filePath);
    if (!item) return 'ERR:Import that bai — kiem tra file con o duong dan cu khong';

    var start = seq.getPlayerPosition().seconds;
    var dur = parseFloat(durationSec);
    if (!dur || dur <= 0) dur = 5;
    var end = start + dur;

    if (!mus_trackFree(tracks[idx], start, end)) {
      return 'ERR:Track A' + (idx + 1) + ' da co clip tai vi tri nay. ' +
             'Doi CTI hoac chon track khac de khong de len nhac cu.';
    }

    tracks[idx].overwriteClip(item, start);
    return 'OK:Da chen vao A' + (idx + 1) + ' tai ' + start.toFixed(2) + 's';
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Lay file goc cua CLIP DANG CHON tren timeline — de do BPM/Key cho chinh
 * doan nhac dang dung trong du an.
 *
 * ☠️ Premiere KHONG cho keo clip tu timeline tha vao panel CEP (khong co API
 * drag-out). Cach chay duoc: nguoi dung chon clip roi bam nut trong panel.
 *
 * Bo qua clip khong co file goc tren dia (title, color matte, adjustment
 * layer, nested sequence) — chung khong co getMediaPath.
 * Tra ve 'OK:<duongDan>|<thoiLuongGiay>|<ten>'
 */
function mus_selectedClipPath() {
  try {
    if (!app.project) return 'ERR:Chua mo project';
    var seq = app.project.activeSequence;
    if (!seq) return 'ERR:Chua mo sequence nao';

    function quet(tracks) {
      for (var i = 0; i < tracks.numTracks; i++) {
        var t = tracks[i];
        for (var j = 0; j < t.clips.numItems; j++) {
          var c = t.clips[j];
          if (!c.isSelected()) continue;
          try {
            if (!c.projectItem || !c.projectItem.getMediaPath) continue;
            var p = c.projectItem.getMediaPath();
            if (!p) continue;
            var dai = c.end.seconds - c.start.seconds;
            return p + '|' + dai + '|' + c.name;
          } catch (e) {}
        }
      }
      return '';
    }

    // Uu tien track am thanh; khong thay thi tim o track hinh (video co tieng)
    var kq = quet(seq.audioTracks);
    if (!kq) kq = quet(seq.videoTracks);
    if (!kq) return 'ERR:Chua chon clip nao co file goc tren timeline';
    return 'OK:' + kq;
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}

/**
 * Mo bai nhac trong Source Monitor de nghe thu bang chinh Premiere.
 * Duong lui khi khong dung duoc <audio> cua panel.
 */
function mus_previewInSource(filePath) {
  try {
    var item = mus_importItem(filePath);
    if (!item) return 'ERR:Import that bai';
    app.sourceMonitor.openProjectItem(item);
    return 'OK:Da mo trong Source Monitor';
  } catch (e) {
    return 'ERR:' + e.toString();
  }
}
