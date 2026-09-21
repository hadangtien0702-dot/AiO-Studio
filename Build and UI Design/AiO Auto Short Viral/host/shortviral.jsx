/**
 * shortviral.jsx — cầu nối ExtendScript của AiO Auto Short Viral (0.1.0, 19/09/2026).
 *
 * Panel lo phần NGHE và CHIA KHỐI hỏi–đáp ở phía React/Node. File này chỉ làm
 * những việc BẮT BUỘC phải đi qua Premiere:
 *   - đọc danh sách sequence, vùng In/Out, clip đang chọn, clip trong vùng
 *   - nhảy đầu đọc (playhead) tới một câu, đọc vị trí đầu đọc
 *   - đặt / đếm / xoá marker của CHÍNH panel (tiền tố tên 'SV ' + chữ ký cuối ghi chú)
 *   - dựng sequence MỚI từ các khối (mỗi khối một sequence, hoặc nối nhiều khối)
 *
 * ══════════════════════════════════════════════════════════════════════════
 * QUY ƯỚC
 * ══════════════════════════════════════════════════════════════════════════
 *  - Hàm công khai tiền tố `sv_`, hàm nội bộ `sv__`, biến toàn cục `SV_`.
 *    ☠️ Engine ExtendScript của Premiere DÙNG CHUNG cho MỌI panel đang mở. Đặt
 *    tên trùng panel anh em là đè lên hàm của nó (Autocut và Transcripts đã
 *    dính: chung tiền tố hàm, chung tiền tố marker 'AC ', xoá marker của nhau).
 *  - Trả 'OK:khoa=gia tri\n...' hoặc 'ERR:MA|chi tiet'. Host KHÔNG viết câu cho
 *    người dùng: panel dịch MÃ ra câu tiếng Việt (client/src/lib/cep.ts dichLoi).
 *  - ES3: chỉ `var`, vòng `for` trần, KHÔNG JSON, KHÔNG Array indexOf/forEach/
 *    map/filter, KHÔNG String trim, KHÔNG Date.now, KHÔNG khai báo hàm bên trong
 *    khối try/if. `node --check` KHÔNG bắt được mấy lỗi này (nó đọc ES2020) —
 *    script chết GIỮA CHỪNG và evalScript trả rỗng, không một lời.
 *  - Chuỗi trong mã (literal) chỉ dùng ASCII. Chú thích có dấu thì được: file
 *    host của Transcripts viết y như vậy (không BOM) và chạy thật từ bản 2.x.
 *  - Danh sách panel gửi sang: bản ghi ngăn bằng U+001E, trường ngăn bằng U+001F.
 *    Đây là cách Transcripts đã chạy thật khi đặt caption (chữ Việt có dấu, có
 *    dấu phẩy, dấu chấm phẩy trong câu). Panel thay sẵn hai ký tự này trong chữ
 *    bằng dấu cách trước khi gửi, nên chữ không bao giờ phá được khung.
 *  - Đường dẫn panel gửi sang dùng dấu `/` (skill adobe-cep-panel 6e: `\2` trong
 *    chuỗi ExtendScript là escape bát phân, nuốt mất dấu phân cách).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ NHỮNG THỨ CẤM TRONG FILE NÀY — đều đã trả giá ở panel anh em
 * ══════════════════════════════════════════════════════════════════════════
 *  - QE DOM (API nội bộ, kể cả lệnh cắt dao lam của nó): dò tham số QE đã làm
 *    SẬP Premiere 27/07/2026 khi người dùng đang ngồi dựng.
 *  - Cả họ API XUẤT file từ script (xuất thẳng một sequence ra file, đẩy hàng
 *    đợi AME): sập Premiere 31/07 và 01/08. Cần bản nháp thì FFmpeg cắt thẳng
 *    từ file gốc, không đụng Premiere.
 *  - `app.project.createNewSequence()` (không có FromClips): mở hộp thoại rồi
 *    TREO cả engine — mọi lệnh sau đó, kể cả ping(), cũng treo theo.
 *  - Hàm XOÁ điểm vào/ra của project item: xoá mất in/out người dùng đặt sẵn
 *    (bài 3a-bis 19/08). Ở đây CẤT giá trị cũ rồi TRẢ LẠI nguyên văn.
 *  - Dựa vào `app.project.activeSequence` để biết "làm ở đâu": nó TRÔI về tab
 *    Timeline đang có tiêu điểm (Transcripts 24/08: 37 clip caption rơi sang
 *    sequence khác mà panel báo thành công). Mọi hàm nhận idSeq và tự tìm
 *    sequence theo sequenceID. Hàm GHI thì mở sequence đó rồi ĐỌC LẠI ID ngay
 *    trong cùng lần gọi — lệch là dừng (ERR:MO_KHONG_AN).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CHƯA ĐO — viết theo tài liệu Adobe + mã đã chạy ở panel anh em, CHƯA chạy
 * trên Premiere lần nào (19/09 Premiere đang tắt). Lần cài đầu phải đo từng dòng:
 * ══════════════════════════════════════════════════════════════════════════
 *  1. setPlayerPosition (sv_nhay): repo chưa ai gọi. Hàm tự đọc lại vị trí thật.
 *  2. Marker có độ dài (mk.end): chưa ai đặt. Hàm thử, đọc lại, hỏng thì để
 *     marker điểm và đếm `soDiem`.
 *  3. Màu marker setColorByIndex(3): tài liệu Adobe ghi 3 = cam; chưa ai đọc
 *     lại màu (chú thích "2 = vàng" ở Transcripts nhiều khả năng sai — tài liệu
 *     ghi 2 = tím). Hàm trả `mauDoc` của marker đầu để lần chạy đầu tự trả lời.
 *  4. getSelection(): repo chỉ có mô tả, chưa có số đo.
 *  5. createNewSequenceFromClips vào BIN RIÊNG (không phải gốc project): chưa đo;
 *     lỗi thì tự làm lại ở gốc project (cách đã đo 27/08).
 *  6. Mở sequence rồi đọc lại ID trong CÙNG một lần gọi: chưa dựng lại bẫy
 *     hai-sequence của Transcripts 2.5.2 để kiểm.
 *  7. Thời gian gọi của sv_getRange (mục tiêu ~1 ms như hàm nhẹ của Autocut):
 *     có thêm getSelection mỗi giây — chưa đo.
 *  8. (thêm 19/09 sau soát) sv_getRangeClips gửi cả clip TIẾNG → chuỗi trả về
 *     dài gấp đôi; đo thời gian gọi trên sequence nhiều clip.
 *  9. Chữ ký marker ở dòng cuối ghi chú (`SV_CHU_KY`): đọc lại m.comments có giữ
 *     nguyên xuống dòng không; `lechDau` (mốc đầu marker đọc lại − mốc xin) trên
 *     sequence tự tạo có timecode bắt đầu 01:00:00:00.
 * 10. getInPoint/getOutPoint của project item CHƯA từng đánh dấu in/out: sv__catInOut
 *     nay từ chối số âm / ra ≤ vào — nếu Premiere trả số đánh dấu cho ca thường
 *     gặp này thì mọi lần dựng sẽ bị từ chối, phải đo ngay lần cài đầu.
 */

var SV_TICK = 254016000000;          // ticks mỗi giây của Premiere — Transcripts đặt caption bằng đúng hằng này
var SV_TIEN_TO = 'SV ';              // tiền tố tên marker do panel này đặt
var SV_CHU_KY = '[AiO SV]';          // chữ ký cuối ghi chú marker — xoá/đếm phải khớp CẢ tiền tố LẪN chữ ký
var SV_TEN_BIN = 'AiO Short Viral';  // bin chứa sequence mới dựng
var SV_RS = String.fromCharCode(30);                // ngăn bản ghi
var SV_US = String.fromCharCode(31);                // ngăn trường
var SV_DUNG_SAI_INOUT = 0.1;         // giây — xem sv__datInOut
var SV_TRAN_VONG = 100000;           // chặn vòng lặp marker chạy mãi nếu API trả vòng

/* ══════════════════════════════════════════════════════════════════════════
   TRỢ THỦ CHUNG
   ══════════════════════════════════════════════════════════════════════════ */

/** Bỏ xuống dòng / tab — tên và lỗi đi vào dòng "khoa=gia tri" không được làm vỡ dòng. */
function sv__sach(s) {
  var t = '';
  try { t = String(s); } catch (e) { t = ''; }
  return t.replace(/[\r\n\t]+/g, ' ');
}

/** Lỗi không lường trước: kèm tên hàm + số dòng để lần sau soi được ngay. */
function sv__loi(noi, e) {
  var dong = '';
  try { if (e && e.line) dong = ' @dong ' + e.line; } catch (x) {}
  return 'ERR:NGOAI_LE|' + noi + ': ' + sv__sach(e) + dong;
}

/** ID sequence đang mở trên Timeline — CHỈ để so, không để quyết định làm ở đâu. */
function sv__idDangMo() {
  try {
    var a = app.project.activeSequence;
    return a ? String(a.sequenceID) : '';
  } catch (e) {
    return '';
  }
}

/**
 * Tìm sequence theo sequenceID. Định danh bằng ID, KHÔNG bằng tên: Premiere cho
 * phép hai sequence trùng tên (skill 19e). Hỏi activeSequence trước chỉ để đi
 * tắt khi nó đúng là cái cần tìm — so bằng ID, không tin nó mù quáng.
 */
function sv__timSeq(id) {
  if (!app.project) return null;
  var ma = String(id);
  if (!ma || ma === 'undefined' || ma === 'null') return null;
  try {
    var a = app.project.activeSequence;
    if (a && String(a.sequenceID) === ma) return a;
  } catch (e) {}
  var ds = app.project.sequences;
  for (var i = 0; i < ds.numSequences; i++) {
    var s = ds[i];
    if (s && String(s.sequenceID) === ma) return s;
  }
  return null;
}

/** Mở đầu chung của mọi hàm công khai: có project, có ID, tìm được sequence. */
function sv__batDau(idSeq) {
  if (!app.project) return { seq: null, loi: 'ERR:CHUA_MO_PROJECT|' };
  if (!idSeq) return { seq: null, loi: 'ERR:THIEU_ID|' };
  var s = sv__timSeq(idSeq);
  if (!s) return { seq: null, loi: 'ERR:KHONG_THAY_SEQUENCE|' + sv__sach(idSeq) };
  return { seq: s, loi: '' };
}

/**
 * MỞ sequence rồi ĐỌC LẠI ID — trả '' nếu đúng, 'MO_KHONG_AN|<id dang mo>' nếu lệch.
 *
 * Vì sao phải đọc lại trong CÙNG lần gọi: activeSequence bám theo tab có tiêu
 * điểm; giữa hai lần evalScript người dùng bấm sang tab khác là nó trôi. Mở +
 * kiểm + ghi trong một lần gọi thì khe hở ngắn nhất có thể.
 *
 * Hai cách mở đều là API chính thức: openSequence (Autocut, Guide Frame dùng) và
 * gán activeSequence (Transcripts 2.5.2 dùng, đo 82 caption vào đúng chỗ). Chưa
 * ai đo cách nào bền hơn nên thử openSequence trước, không ăn thì thử cách kia.
 */
function sv__mo(seq) {
  var ma = String(seq.sequenceID);
  if (sv__idDangMo() === ma) return '';
  try { app.project.openSequence(ma); } catch (e) {}
  if (sv__idDangMo() === ma) return '';
  try { app.project.activeSequence = seq; } catch (e2) {}
  if (sv__idDangMo() === ma) return '';
  return 'MO_KHONG_AN|' + sv__idDangMo();
}

/** Mở lại sequence của người dùng sau khi dựng — '1' nếu mở được, '0' nếu không. */
function sv__moLai(seq) {
  try { return sv__mo(seq) === '' ? '1' : '0'; } catch (e) { return '0'; }
}

/**
 * Điểm VÀO của vùng khoanh (giây). ☠️ Đo 27/08 trên Premiere 27 (Re-Frames):
 * CHƯA khoanh thì getInPointAsTime().seconds trả -400000, KHÔNG phải -1 và
 * không ném lỗi. Bên gọi kiểm '< 0' là bắt được cả hai.
 */
function sv__inSec(seq) {
  try {
    var t = seq.getInPointAsTime();
    if (t && typeof t.seconds === 'number') return t.seconds;
  } catch (e) {}
  try {
    var s = parseFloat(seq.getInPoint());
    if (!isNaN(s)) return s;
  } catch (e2) {}
  return -1;
}

function sv__outSec(seq) {
  try {
    var t = seq.getOutPointAsTime();
    if (t && typeof t.seconds === 'number') return t.seconds;
  } catch (e) {}
  try {
    var s = parseFloat(seq.getOutPoint());
    if (!isNaN(s)) return s;
  } catch (e2) {}
  return -1;
}

/** fps + khung hình của sequence. Không đọc được fps thì coi 30 (chỉ dùng cho sai số). */
function sv__thongSo(seq) {
  var kq = { fps: 30, w: 0, h: 0 };
  try {
    var st = seq.getSettings();
    var fr = st.videoFrameRate;
    if (fr && fr.seconds > 0) kq.fps = 1 / fr.seconds;
    kq.w = st.videoFrameWidth;
    kq.h = st.videoFrameHeight;
  } catch (e) {}
  return kq;
}

/** Đường dẫn file gốc của clip trên timeline, '' nếu không có (title, sequence lồng...). */
function sv__duongDan(clip) {
  try {
    var pi = clip.projectItem;
    if (!pi) return '';
    var p = pi.getMediaPath();
    return p ? String(p) : '';
  } catch (e) {
    return '';
  }
}

/** Chuẩn hoá đường dẫn để so: gạch xuôi + chữ thường (Windows không phân biệt hoa thường). */
function sv__chuan(p) {
  return String(p).replace(/\\/g, '/').toLowerCase();
}

/**
 * Clip caption MOGRT của Transcripts CÓ media path (chính file .mogrt) nhưng
 * không phải media: in/out của template (10 s) chia độ dài clip ra "tốc độ
 * 2083%" (skill 20.5). Bỏ ngay từ đầu.
 */
function sv__laCaption(clip, p) {
  if (/\.mogrt$/i.test(p)) return true;
  try { if (String(clip.name).indexOf('AiO Caption') === 0) return true; } catch (e) {}
  return false;
}

/** Khoá mốc của một clip: "startTicks|endTicks" — để dò lại item getSelection() trả về. */
function sv__mocKhoa(it) {
  try {
    return String(it.start.ticks) + '|' + String(it.end.ticks);
  } catch (e) {
    return '';
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   CLIP ĐANG CHỌN
   ══════════════════════════════════════════════════════════════════════════
   Premiere không cho kéo clip từ timeline thả vào panel (không có API drag-out,
   skill mục 7), nên "chọn clip" = người dùng chọn trên timeline, panel hỏi.

   getSelection() trả TrackItem nhưng KHÔNG cho biết clip nằm ở track nào, thứ
   tự mấy — mà host dựng sequence cần đúng (track, thứ tự) để lấy lại projectItem.
   Nên dò lại: khoá mốc (loại + startTicks + endTicks) của item được chọn, rồi
   quét track tìm clip cùng khoá. Hai clip cùng mốc trên hai track (multicam xếp
   chồng) thì khoá trùng — lúc đó mới hỏi isSelected() từng clip để phân xử.
   Không có getSelection (bản Premiere cũ) thì quét isSelected() mọi clip — cách
   dự phòng của Asset Manager (ppro_getSelectedClipPaths).
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Đọc clip đang chọn bằng getSelection().
 *   api   : 'getSelection' nếu gọi được, '' nếu không có hàm / ném lỗi
 *   n     : tổng số item (kể cả clip tắt, cả hình lẫn tiếng)
 *   soV/soA/soKhac : số item HÌNH / TIẾNG / không rõ loại, đã bỏ clip đang tắt
 *   khoa  : 'V|start|end' -> số item mang khoá đó ('?' khi không đọc được loại)
 * @param nhe  true = chỉ đếm (vòng thăm dò mỗi giây), không dựng khoá; chọn
 *             quá 50 item thì đếm thô bằng độ dài mảng (Ctrl+A trên timeline
 *             1.000 clip không được biến thành 4.000 lời gọi mỗi giây).
 */
function sv__docChon(seq, nhe) {
  var kq = { api: '', n: 0, soV: 0, soA: 0, soKhac: 0, uocLuong: false, khoa: {} };
  var sel = null;
  try {
    if (typeof seq.getSelection === 'function') {
      sel = seq.getSelection();
      kq.api = 'getSelection';
    }
  } catch (e) {
    kq.api = '';
    sel = null;
  }
  if (!sel) return kq;
  var n = 0;
  try { n = sel.length; } catch (e1) { n = 0; }
  if (!(n > 0)) return kq;
  kq.n = n;
  if (nhe && n > 50) {
    kq.soKhac = n;
    kq.uocLuong = true;
    return kq;
  }
  for (var i = 0; i < n; i++) {
    var it = sel[i];
    if (!it) continue;
    var tat = false;
    try { tat = !!it.disabled; } catch (e2) {}
    if (tat) continue;
    var loai = '?';
    try {
      var mt = String(it.mediaType);
      if (mt === 'Video') loai = 'V';
      else if (mt === 'Audio') loai = 'A';
    } catch (e3) {}
    if (loai === 'V') kq.soV++;
    else if (loai === 'A') kq.soA++;
    else kq.soKhac++;
    if (nhe) continue;
    var moc = sv__mocKhoa(it);
    if (!moc) continue;
    var k = loai + '|' + moc;
    kq.khoa[k] = (kq.khoa[k] || 0) + 1;
  }
  return kq;
}

/** Số item đang chọn mang khoá mốc này (tính cả item không rõ loại). */
function sv__soChonKhoa(chon, loai, moc) {
  return (chon.khoa[loai + '|' + moc] || 0) + (chon.khoa['?|' + moc] || 0);
}

/**
 * Quét MỘT loại track (V hoặc A), trả danh sách clip thoả chế độ.
 *   cheDo 'io'  : clip GIAO với vùng [a, b] — cắt mốc về trong vùng
 *   cheDo 'chon': clip đang chọn — lấy nguyên clip
 * dem.soTat / dem.soKhongFile đếm clip bị bỏ (để báo lỗi cho có số).
 *
 * ☠️ BỎ CLIP ĐANG TẮT (disabled). Bài 5u của Auto Podcast: multicam có MỌI cam
 * ở MỌI đoạn, cam không dùng bị TẮT chứ không bị xoá — đếm cả clip tắt là dựng
 * sai hình và sai độ dài gấp mấy lần.
 */
function sv__quet(seq, loai, cheDo, a, b, saiSo, chon, dem) {
  var ds = (loai === 'V') ? seq.videoTracks : seq.audioTracks;
  var soTrack = 0;
  try { soTrack = ds.numTracks; } catch (e) { soTrack = 0; }
  var thay = [];
  for (var i = 0; i < soTrack; i++) {
    var tr = null, n = 0;
    try { tr = ds[i]; n = tr.clips.numItems; } catch (e1) { continue; }
    for (var j = 0; j < n; j++) {
      var c = null, s = 0, e2 = 0;
      try { c = tr.clips[j]; s = c.start.seconds; e2 = c.end.seconds; } catch (e3) { continue; }
      if (!(e2 > s)) continue;
      var moc = '';
      if (cheDo === 'io') {
        if (e2 <= a + saiSo || s >= b - saiSo) continue;
      } else if (chon.api === 'getSelection') {
        moc = sv__mocKhoa(c);
        if (!moc || sv__soChonKhoa(chon, loai, moc) < 1) continue;
      } else {
        var coChon = false;
        try { coChon = (c.isSelected() === true); } catch (e4) { coChon = false; }
        if (!coChon) continue;
      }
      var tat = false;
      try { tat = !!c.disabled; } catch (e5) {}
      if (tat) { dem.soTat++; continue; }
      var p = sv__duongDan(c);
      if (!p) { dem.soKhongFile++; continue; }
      if (sv__laCaption(c, p)) continue;
      var si = 0, sr = 0;
      try { si = c.inPoint.seconds; sr = c.outPoint.seconds; } catch (e6) { continue; }
      var speed = (sr - si) / (e2 - s);
      var tu = s, den = e2;
      if (cheDo === 'io') {
        if (tu < a) tu = a;
        if (den > b) den = b;
      }
      thay.push({
        kind: loai, tr: i, cl: j,
        seqTu: tu, seqDen: den,
        srcTu: si + (tu - s) * speed,
        srcDen: si + (den - s) * speed,
        speed: speed, p: p, moc: moc, clip: c
      });
    }
  }
  return thay;
}

/**
 * Phân xử khoá mốc trùng: số clip mang một khoá NHIỀU HƠN số item đang chọn
 * mang khoá đó → hỏi isSelected() từng clip. isSelected không trả lời được thì
 * giữ cả và đếm `moHo` để panel báo, đừng đoán im.
 */
function sv__locMoHo(thay, loai, chon, dem) {
  var soUng = {};
  var k;
  for (k = 0; k < thay.length; k++) soUng[thay[k].moc] = (soUng[thay[k].moc] || 0) + 1;
  var ra = [];
  for (k = 0; k < thay.length; k++) {
    var d = thay[k];
    if (soUng[d.moc] <= sv__soChonKhoa(chon, loai, d.moc)) { ra.push(d); continue; }
    var co = null;
    try { co = d.clip.isSelected(); } catch (e) { co = null; }
    if (co === true) ra.push(d);
    else if (co !== false) { ra.push(d); dem.moHo++; }
  }
  return ra;
}

/**
 * Clip đang chọn: clip HÌNH lẫn clip TIẾNG (xem "GỬI CẢ TIẾNG" ở sv_getRangeClips).
 * Đếm tắt / không file của track TIẾNG chỉ khi không có clip hình nào: clip liên
 * kết bị tắt thì hình lẫn tiếng cùng tắt — cộng cả hai là số "clip đang tắt" gấp đôi.
 */
function sv__layChon(seq, chon, dem) {
  var v = sv__quet(seq, 'V', 'chon', 0, 0, 0, chon, dem);
  if (chon.api === 'getSelection') v = sv__locMoHo(v, 'V', chon, dem);
  var demA = { soTat: 0, soKhongFile: 0, moHo: 0 };
  var a = sv__quet(seq, 'A', 'chon', 0, 0, 0, chon, demA);
  if (chon.api === 'getSelection') a = sv__locMoHo(a, 'A', chon, demA);
  dem.moHo += demA.moHo;
  if (!v.length) {
    dem.soTat += demA.soTat;
    dem.soKhongFile += demA.soKhongFile;
  }
  return v.concat(a);
}

/* ══════════════════════════════════════════════════════════════════════════
   ĐỌC — danh sách sequence, vùng, clip
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Mọi sequence trong project + cái nào đang mở — cho ô chọn sequence.
 * Mỗi dòng: "seq=<id>\t<1|0 dang mo>\t<ten>". Tên để CUỐI vì nó chứa gì cũng được.
 */
function sv_dsSequence() {
  try {
    if (!app.project) return 'ERR:CHUA_MO_PROJECT|';
    var dang = sv__idDangMo();
    var out = [];
    var ds = app.project.sequences;
    for (var i = 0; i < ds.numSequences; i++) {
      var s = ds[i];
      if (!s) continue;
      var id = String(s.sequenceID);
      out.push('seq=' + id + '\t' + (id === dang ? '1' : '0') + '\t' + sv__sach(s.name));
    }
    return 'OK:' + out.join('\n');
  } catch (e) {
    return sv__loi('sv_dsSequence', e);
  }
}

/**
 * HÀM NHẸ cho vòng thăm dò mỗi giây: chỉ đọc in/out/fps/khung + số clip đang
 * chọn. KHÔNG duyệt track. KHÔNG báo lỗi khi chưa khoanh — trả nguyên số
 * (-400000) để panel tự kiểm '< 0'.
 *
 * Vì sao cần thăm dò: Adobe không bắn sự kiện nào sang panel khi người dùng bấm
 * I/O hay chọn clip trên timeline (skill 19a — Autocut hiện 47 s khi vùng thật
 * là 5,71 s). Hàm nặng sv_getRangeClips chỉ gọi khi mấy số ở đây ĐỔI.
 *
 * soChon: -1 = bản Premiere này không có getSelection (panel hiện "không rõ").
 * soChonUocLuong=1: chọn quá 50 item, số đếm gồm cả clip tiếng đi kèm.
 */
function sv_getRange(idSeq) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    var ts = sv__thongSo(seq);
    var chon = sv__docChon(seq, true);
    var soChon = -1;
    if (chon.api === 'getSelection') {
      soChon = (chon.soV + chon.soKhac > 0) ? (chon.soV + chon.soKhac) : chon.soA;
    }
    return 'OK:seqId=' + String(seq.sequenceID) +
      '\nseqName=' + sv__sach(seq.name) +
      '\nfps=' + ts.fps +
      '\nin=' + sv__inSec(seq) +
      '\nout=' + sv__outSec(seq) +
      '\nw=' + ts.w + '\nh=' + ts.h +
      '\nsoChon=' + soChon +
      '\nsoChonUocLuong=' + (chon.uocLuong ? '1' : '0') +
      '\ndangMo=' + (sv__idDangMo() === String(seq.sequenceID) ? '1' : '0');
  } catch (e) {
    return sv__loi('sv_getRange', e);
  }
}

/**
 * HÀM NẶNG: danh sách clip của vùng làm việc. Chép từ bộ đọc vùng của Re-Frames
 * (reframe.jsx, đo 27/08 trên Premiere 27: 4 clip / 2 file, dài thật 27.00 đúng
 * bằng mức cần 27.00, 0 khe hở), thêm chế độ "clip đang chọn".
 *
 * @param cheDo 'tudong' | 'chon' | 'io'
 *   tudong: có clip đang chọn thì theo clip đó, không thì theo vùng In/Out.
 *   Dòng `cheDo=` trả về là chế độ THẬT đã dùng ('chon' hoặc 'io').
 *
 * Mỗi clip một dòng: clip=V|A,track,thuTu,seqTu,seqDen,srcTu,srcDen,speed,duongDan
 * (đường dẫn để CUỐI vì nó có thể chứa dấu phẩy).
 *
 * ☠️ GỬI CẢ TIẾNG (sửa 19/09 sau soát, trước lần cài đầu). Bản đầu có clip HÌNH
 * thì bỏ hẳn track TIẾNG, nên panel nghe tiếng của file gắn với clip hình chứ
 * không nghe thứ người xem nghe. Hỏng im lặng ở hai ca hay gặp: B-roll cắt chèn
 * NGAY TRÊN V1 trong khi lời phỏng vấn ở A1 chạy liền bên dưới (đo trên đệm thật
 * C4091: mất 43/726 từ, và dựng short ra tiếng B-roll giữa câu trả lời), và
 * L-cut/J-cut (tiếng dài hơn hình). Nay gửi cả hai loại, đánh dấu V|A ở đầu dòng.
 * Panel (client/src/services/moc.ts `chonClipNghe`) tự ghép cặp hình–tiếng liên
 * kết để không nghe / dựng hai lần, và vẫn chọn LÀN theo clip hình như trước (nhạc
 * nền, mic rời chỉ-có-tiếng không được thắng làn).
 * `tiengKhacFile=` đếm clip tiếng từ file KHÁC mọi file hình (mic rời, nhạc).
 * CHƯA ĐO: chuỗi trả về dài gấp đôi (1.772 dòng ~ 265 KB với sequence 886 clip
 * nhảy kiểu sau Autocut) — lần cài đầu đo thời gian gọi.
 */
function sv_getRangeClips(idSeq, cheDo) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    var yeuCau = String(cheDo);
    if (yeuCau !== 'tudong' && yeuCau !== 'chon' && yeuCau !== 'io') {
      return 'ERR:CHE_DO_SAI|' + sv__sach(yeuCau);
    }

    var ts = sv__thongSo(seq);
    var saiSo = 0.5 / ts.fps;
    var a = sv__inSec(seq), b = sv__outSec(seq);
    var coVung = !(a < 0 || b < 0 || b <= a);
    var dem = { soTat: 0, soKhongFile: 0, moHo: 0 };
    var chon = { api: '', n: 0, soV: 0, soA: 0, soKhac: 0, uocLuong: false, khoa: {} };
    var thay = [];
    var dung = 'io';

    if (yeuCau !== 'io') {
      chon = sv__docChon(seq, false);
      var biet = (chon.api === 'getSelection');
      var coChon = biet && (chon.soV + chon.soA + chon.soKhac > 0);
      if (yeuCau === 'chon' || coChon || !biet) {
        // Không có getSelection thì phải quét isSelected mới biết có chọn gì không.
        thay = sv__layChon(seq, chon, dem);
        var thayGi = thay.length || dem.soTat || dem.soKhongFile;
        if (yeuCau === 'tudong' && !thayGi && !coChon) {
          dung = 'io';
        } else {
          dung = 'chon';
          // getSelection nói CÓ chọn mà quét track không dò ra clip nào: KHÔNG
          // lặng lẽ rơi về vùng In/Out — người dùng sẽ tưởng panel làm trên clip
          // họ chọn. Báo thẳng để lần đo đầu lộ ra khoá mốc lệch ở đâu.
          if (!thayGi) return coChon ? 'ERR:KHONG_DO_DUOC_CLIP_CHON|' + chon.n : 'ERR:CHUA_CHON_CLIP|';
        }
      }
    }

    if (dung === 'io') {
      if (!coVung) return (yeuCau === 'tudong') ? 'ERR:CHUA_CHON_GI|' : 'ERR:CHUA_KHOANH_VUNG|';
      dem = { soTat: 0, soKhongFile: 0, moHo: 0 };
      thay = sv__quet(seq, 'V', 'io', a, b, saiSo, chon, dem);
      // Gửi cả TIẾNG (xem "GỬI CẢ TIẾNG" ở đầu hàm). Đếm tắt / không file của
      // track tiếng chỉ khi không có hình — xem sv__layChon.
      var demTieng = { soTat: 0, soKhongFile: 0, moHo: 0 };
      var dsTieng = sv__quet(seq, 'A', 'io', a, b, saiSo, chon, demTieng);
      if (!thay.length) {
        dem.soTat += demTieng.soTat;
        dem.soKhongFile += demTieng.soKhongFile;
      }
      thay = thay.concat(dsTieng);
    }
    if (!thay.length) return 'ERR:VUNG_KHONG_CO_CLIP|' + dem.soTat + ',' + dem.soKhongFile;

    // Sắp theo mốc trên timeline (hoà thì hình trước tiếng, track thấp trước) — panel tự sắp lại, đây chỉ để dễ đọc.
    thay.sort(function (x, y) {
      return (x.seqTu - y.seqTu) || ((x.kind === y.kind) ? 0 : (x.kind === 'V' ? -1 : 1)) || (x.tr - y.tr);
    });

    var vungTu = a, vungDen = b;
    if (dung === 'chon') {
      vungTu = thay[0].seqTu;
      vungDen = thay[0].seqDen;
      for (var q = 1; q < thay.length; q++) {
        if (thay[q].seqTu < vungTu) vungTu = thay[q].seqTu;
        if (thay[q].seqDen > vungDen) vungDen = thay[q].seqDen;
      }
    }

    // ☠️ CHỒNG LẤN = KHÔNG DỰNG PHẲNG ĐƯỢC. Hai clip hình cùng bật, cùng lúc
    // (B-roll đè lên, multicam xếp chồng) mà xếp nối tiếp là sai cả độ dài lẫn
    // nội dung. Đếm ra để panel chọn track / báo thẳng, đừng dựng sai mà im.
    // Chỉ đếm trong MỘT loại (hình nếu có, không thì tiếng): cặp hình–tiếng liên
    // kết luôn "chồng" nhau, đếm lẫn là số này vô nghĩa.
    var coHinh = false;
    var k;
    for (k = 0; k < thay.length; k++) { if (thay[k].kind === 'V') { coHinh = true; break; } }
    var loaiChinh = coHinh ? 'V' : 'A';
    var chongLan = 0;
    var truoc = null;
    for (k = 0; k < thay.length; k++) {
      if (thay[k].kind !== loaiChinh) continue;
      if (truoc && thay[k].seqTu < truoc.seqDen - saiSo) chongLan++;
      truoc = thay[k];
    }

    // Tiếng từ file khác mọi file hình (mic rời, nhạc) — đếm để đo lần cài đầu.
    var tiengKhacFile = 0;
    if (coHinh) {
      var fileHinh = {};
      for (k = 0; k < thay.length; k++) if (thay[k].kind === 'V') fileHinh[sv__chuan(thay[k].p)] = true;
      for (k = 0; k < thay.length; k++) {
        if (thay[k].kind === 'A' && !fileHinh[sv__chuan(thay[k].p)]) tiengKhacFile++;
      }
    }

    var out = [];
    out.push('seqId=' + String(seq.sequenceID));
    out.push('seqName=' + sv__sach(seq.name));
    out.push('fps=' + ts.fps);
    out.push('w=' + ts.w);
    out.push('h=' + ts.h);
    out.push('cheDo=' + dung);
    out.push('in=' + vungTu);
    out.push('out=' + vungDen);
    out.push('ioTu=' + a);
    out.push('ioDen=' + b);
    out.push('soTat=' + dem.soTat);
    out.push('soKhongFile=' + dem.soKhongFile);
    out.push('chongLan=' + chongLan);
    out.push('moHo=' + dem.moHo);
    out.push('tiengKhacFile=' + tiengKhacFile);
    out.push('apiChon=' + chon.api);
    out.push('soClip=' + thay.length);
    for (k = 0; k < thay.length; k++) {
      var d = thay[k];
      out.push('clip=' + d.kind + ',' + d.tr + ',' + d.cl + ',' +
        d.seqTu + ',' + d.seqDen + ',' + d.srcTu + ',' + d.srcDen + ',' +
        d.speed + ',' + d.p);
    }
    return 'OK:' + out.join('\n');
  } catch (e) {
    return sv__loi('sv_getRangeClips', e);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   ĐẦU ĐỌC (playhead)
   ══════════════════════════════════════════════════════════════════════════ */

/** Vị trí đầu đọc (giây trên sequence) — để panel tô câu đang phát. CHỈ ĐỌC, không mở sequence. */
function sv_viTri(idSeq) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    var g;
    try { g = seq.getPlayerPosition().seconds; }
    catch (e1) { return 'ERR:KHONG_DOC_DUOC|getPlayerPosition ' + sv__sach(e1); }
    return 'OK:giay=' + g +
      '\ndangMo=' + (sv__idDangMo() === String(seq.sequenceID) ? '1' : '0');
  } catch (e) {
    return sv__loi('sv_viTri', e);
  }
}

/**
 * Nhảy đầu đọc tới `giay` (giây TUYỆT ĐỐI trên sequence) — người dùng bấm một
 * câu trong panel.
 *
 * ☠️ CHƯA ĐO. Trong repo chưa ai gọi setPlayerPosition. Tài liệu Adobe: tham số
 * là CHUỖI ticks (254016000000 ticks/giây — hằng Transcripts dùng thật với
 * importMGT), trả boolean. Giá trị trả về KHÔNG chứng minh đầu đọc đã dời (bài
 * 5l) → hàm ĐỌC LẠI getPlayerPosition và trả số THẬT; panel so với số yêu cầu,
 * lệch quá một khung là báo.
 * Math.round trên ticks chính xác tới ~9,8 giờ (giới hạn 2^53) — đủ cho podcast.
 */
function sv_nhay(idSeq, giay) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    var g = parseFloat(giay);
    if (isNaN(g) || g < 0) return 'ERR:GIAY_SAI|' + sv__sach(giay);
    var mo = sv__mo(seq);
    if (mo) return 'ERR:' + mo;
    try { seq.setPlayerPosition(String(Math.round(g * SV_TICK))); }
    catch (e1) { return 'ERR:NHAY_LOI|' + sv__sach(e1); }
    var that = -1;
    try { that = seq.getPlayerPosition().seconds; } catch (e2) { that = -1; }
    var ts = sv__thongSo(seq);
    return 'OK:giay=' + that + '\nyeuCau=' + g + '\nkhung=' + (1 / ts.fps);
  } catch (e) {
    return sv__loi('sv_nhay', e);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   MARKER — một khối hỏi–đáp một marker
   ══════════════════════════════════════════════════════════════════════════
   Khung chép từ hàm đặt marker của Autocut/Transcripts (Autocut PROGRESS: tạo
   marker bằng số giây "chạy tốt, đặt được tên + ghi chú + màu"; Transcripts đặt
   60, xoá 60 mà 3 marker của người dùng vẫn nguyên).
   ☠️ Tiền tố RIÊNG 'SV ': tiền tố 'AC ' đang dùng chung giữa Autocut và
   Transcripts nên hai panel xoá marker của nhau.
   ☠️ HAI DẤU, không một (sửa 19/09 sau soát): chỉ nhận theo tên bắt đầu bằng
   'SV ' là kiểu "xoá theo MẪU" mà brain bài 5am-ter cấm — marker người dùng tự
   đặt tên viết tắt "SV …", hoặc chép từ marker của panel rồi sửa, sẽ bị xoá khi
   đặt lại / bấm Xoá marker. Nay panel ghi thêm CHỮ KÝ `SV_CHU_KY` vào dòng cuối
   ghi chú; đếm và xoá phải khớp CẢ HAI. Người dùng xoá chữ ký khỏi ghi chú thì
   marker đó thành của họ — panel không đụng nữa (chiều an toàn).
   ══════════════════════════════════════════════════════════════════════════ */

/** Marker này do panel đặt: tên có tiền tố 'SV ' VÀ ghi chú mang chữ ký. */
function sv__laCuaPanel(m) {
  try {
    if (String(m.name).indexOf(SV_TIEN_TO) !== 0) return false;
    return String(m.comments).indexOf(SV_CHU_KY) >= 0;
  } catch (e) {
    return false;
  }
}

/** Đếm marker của panel và tổng số marker. */
function sv__demMk(seq) {
  var kq = { sv: 0, tong: 0 };
  var m = seq.markers.getFirstMarker();
  var vong = 0;
  while (m && vong < SV_TRAN_VONG) {
    vong++;
    kq.tong++;
    if (sv__laCuaPanel(m)) kq.sv++;
    m = seq.markers.getNextMarker(m);
  }
  return kq;
}

/** Xoá marker của panel. Lấy marker KẾ TIẾP trước khi xoá cái hiện tại (cách đã chạy ở Transcripts). */
function sv__xoaMk(seq) {
  var daXoa = 0;
  var m = seq.markers.getFirstMarker();
  var vong = 0;
  while (m && vong < SV_TRAN_VONG) {
    vong++;
    var ke = seq.markers.getNextMarker(m);
    if (sv__laCuaPanel(m)) {
      seq.markers.deleteMarker(m);
      daXoa++;
    }
    m = ke;
  }
  return daXoa;
}

/** Điểm cuối marker có khớp `den` trong một khung hình không. */
function sv__endKhop(mk, den, khung) {
  try { return Math.abs(mk.end.seconds - den) <= khung; } catch (e) { return false; }
}

/**
 * Đặt marker cho các khối. Xoá marker 'SV ' CŨ trên sequence đó rồi mới đặt,
 * để chạy lại không chồng marker lên nhau.
 *
 * @param dsStr  bản ghi "giay␟den␟ten␟ghiChu" ngăn bằng ␞ (U+001F / U+001E)
 *               giay, den: giây TUYỆT ĐỐI trên sequence
 *
 * ☠️ ĐỌC HẾT DANH SÁCH TRƯỚC KHI XOÁ (skill 18h: mọi điều kiện phải chặn TRƯỚC
 * dòng xoá đầu tiên). Danh sách rỗng/hỏng thì trả lỗi, marker cũ còn nguyên.
 *
 * CHƯA ĐO — marker có độ dài: gán mk.end bằng số giây (tài liệu Adobe), đọc lại;
 * không khớp thì thử một Time object; vẫn không thì để marker ĐIỂM, đếm soDiem.
 * Cách chạy được ở marker đầu dùng luôn cho các marker sau (`cachEnd`).
 * CHƯA ĐỌC LẠI MÀU — setColorByIndex(3), tài liệu Adobe: 0 xanh lá, 1 đỏ, 2 tím,
 * 3 cam, 4 vàng, 5 trắng, 6 xanh dương, 7 lam. `mauDoc` = màu đọc lại ở marker
 * đầu, để lần chạy thật đầu tiên tự trả lời bảng này.
 */
function sv_datMarker(idSeq, dsStr) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    if (!seq.markers || typeof seq.markers.createMarker !== 'function') {
      return 'ERR:THIEU_API|sequence.markers.createMarker';
    }

    // ── Đọc + kiểm danh sách TRƯỚC khi đụng vào marker nào ──
    var ds = [];
    var soBo = 0;
    var ban = String(dsStr).split(SV_RS);
    for (var i = 0; i < ban.length; i++) {
      if (!ban[i]) continue;
      var f = ban[i].split(SV_US);
      if (f.length < 4) { soBo++; continue; }
      var g = parseFloat(f[0]);
      var d = parseFloat(f[1]);
      if (isNaN(g) || g < 0) { soBo++; continue; }
      if (isNaN(d) || d < g) d = g;
      ds.push({ giay: g, den: d, ten: sv__sach(f[2]), ghiChu: String(f[3]) });
    }
    if (!ds.length) return 'ERR:DS_RONG|' + soBo;

    var mo = sv__mo(seq);
    if (mo) return 'ERR:' + mo;

    var khung = 1 / sv__thongSo(seq).fps;
    var daXoa = 0;
    try { daXoa = sv__xoaMk(seq); } catch (eX) { return 'ERR:XOA_MARKER_LOI|' + sv__sach(eX); }

    var dat = 0, soDiem = 0, loiDau = '';
    var cachEnd = '';      // '' chưa thử · 'so' · 'time' · 'khong'
    var mauDoc = '';
    var lechDau = '';      // mốc ĐẦU đọc lại của marker đầu − mốc xin (CHƯA ĐO với sequence có timecode bắt đầu ≠ 0)
    for (i = 0; i < ds.length; i++) {
      var m = ds[i];
      var mk = null;
      try {
        mk = seq.markers.createMarker(m.giay);
        mk.name = SV_TIEN_TO + m.ten;
        // Chữ ký ở DÒNG CUỐI ghi chú — xem sv__laCuaPanel.
        mk.comments = (m.ghiChu ? m.ghiChu + '\n' : '') + SV_CHU_KY;
        dat++;
      } catch (e1) {
        if (!loiDau) loiDau = sv__sach(e1);
        continue;
      }
      try { mk.setColorByIndex(3); } catch (e2) {}
      if (dat === 1) {
        try { mauDoc = String(mk.getColorByIndex()); } catch (e3) { mauDoc = 'khong doc duoc'; }
        // ☠️ Không tin "tạo không lỗi" (bài 5l): đọc lại mốc ĐẦU. Sequence dựng từ
        // multicam hay có timecode bắt đầu 01:00:00:00 — createMarker mà hiểu số
        // giây theo trục khác là marker nằm sai chỗ trong khi daDat vẫn đủ.
        try { lechDau = String(mk.start.seconds - m.giay); } catch (e3b) { lechDau = ''; }
      }
      if (m.den > m.giay + khung && cachEnd !== 'khong') {
        var khop = false;
        if (cachEnd === '' || cachEnd === 'so') {
          try { mk.end = m.den; } catch (e4) {}
          khop = sv__endKhop(mk, m.den, khung);
          if (khop) cachEnd = 'so';
        }
        if (!khop && (cachEnd === '' || cachEnd === 'time')) {
          try { var t = new Time(); t.seconds = m.den; mk.end = t; } catch (e5) {}
          khop = sv__endKhop(mk, m.den, khung);
          if (khop) cachEnd = 'time';
        }
        if (!khop) {
          if (cachEnd === '') cachEnd = 'khong';
          // Đưa về marker ĐIỂM cho sạch — đừng để một điểm cuối không rõ nghĩa.
          try { var t0 = new Time(); t0.seconds = m.giay; mk.end = t0; }
          catch (e6) { try { mk.end = m.giay; } catch (e7) {} }
          soDiem++;
        }
      } else if (m.den > m.giay + khung) {
        soDiem++;
      }
    }

    var tong = -1;
    try { tong = seq.markers.numMarkers; } catch (e8) {}
    return 'OK:daXoa=' + daXoa +
      '\ndaDat=' + dat +
      '\nsoDiem=' + soDiem +
      '\nsoBo=' + soBo +
      '\ncachEnd=' + cachEnd +
      '\nmauDoc=' + sv__sach(mauDoc) +
      '\nlechDau=' + lechDau +
      '\nkhung=' + khung +
      '\ntongMarker=' + tong +
      '\nloiDau=' + loiDau;
  } catch (e) {
    return sv__loi('sv_datMarker', e);
  }
}

/** Đếm marker của panel — để nút xoá / nút đặt nói HẬU QUẢ BẰNG SỐ trước khi bấm. CHỈ ĐỌC. */
function sv_demMarker(idSeq) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    if (!seq.markers) return 'ERR:THIEU_API|sequence.markers';
    var kq = sv__demMk(seq);
    return 'OK:soMarker=' + kq.sv + '\ntong=' + kq.tong;
  } catch (e) {
    return sv__loi('sv_demMarker', e);
  }
}

/** Xoá marker của panel (tên 'SV ' + chữ ký). Marker người dùng tự đặt KHÔNG bị chạm. */
function sv_xoaMarker(idSeq) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var seq = bd.seq;
    if (!seq.markers) return 'ERR:THIEU_API|sequence.markers';
    var mo = sv__mo(seq);
    if (mo) return 'ERR:' + mo;
    var truoc = -1;
    try { truoc = seq.markers.numMarkers; } catch (e1) {}
    var daXoa = sv__xoaMk(seq);
    var conLai = -1;
    try { conLai = seq.markers.numMarkers; } catch (e2) {}
    return 'OK:daXoa=' + daXoa + '\ntruoc=' + truoc + '\nconLai=' + conLai;
  } catch (e) {
    return sv__loi('sv_xoaMarker', e);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   DỰNG SEQUENCE MỚI TỪ CÁC KHỐI
   ══════════════════════════════════════════════════════════════════════════
   Khuôn: hàm cắt vùng của Re-Frames (reframe.jsx, đo 27/08 trên Premiere 27:
   15.00/15.00 ; 4 clip / 2 file 27.00/27.00, 0 khe hở ; in/out gốc của hai
   file trả về 0.000 → 89.000 như trước). Sửa bốn chỗ so với khuôn:
    1. BỎ hẳn phần QE / Auto Reframe (máy thiếu effect đó sẽ chết ngay dòng đầu).
    2. Lấy projectItem từ CHÍNH clip trên timeline (track.clips[thuTu].projectItem)
       rồi so đường dẫn — không dò lại theo đường dẫn (bộ dò cũ chỉ tìm gốc +
       một tầng bin, item nằm sâu hơn là báo không thấy).
    3. Biến cất in/out ở phạm vi NGOÀI try — nhánh lỗi bất ngờ cũng trả lại
       được (khuôn cũ: nhánh catch ngoài cùng KHÔNG trả).
    4. Tìm sequence mới bằng HIỆU SỐ sequenceID trước/sau — không tin
       activeSequence (nó trôi), không đoán theo tên.
   ══════════════════════════════════════════════════════════════════════════ */

/** Tập ID sequence hiện có. */
function sv__tapId() {
  var co = {};
  var ds = app.project.sequences;
  for (var i = 0; i < ds.numSequences; i++) co[String(ds[i].sequenceID)] = true;
  return co;
}

/** Sequence có ID không nằm trong tập cũ — chính là cái vừa tạo. */
function sv__seqMoi(idCu) {
  var ds = app.project.sequences;
  for (var i = 0; i < ds.numSequences; i++) {
    if (!idCu[String(ds[i].sequenceID)]) return ds[i];
  }
  return null;
}

/**
 * Tên sequence KHÔNG ĐƯỢC TRÙNG — Re-Frames vấp 31/07: chạy hai lần ra hai bản
 * cùng tên, anh Tiến tưởng bị lưu đè. Trùng thì nối " (2)", " (3)"...
 */
function sv__tenKhongTrung(goc) {
  var co = {};
  var ds = app.project.sequences;
  for (var i = 0; i < ds.numSequences; i++) co[String(ds[i].name)] = true;
  if (!co[goc]) return goc;
  for (var n = 2; n < 999; n++) {
    var thu = goc + ' (' + n + ')';
    if (!co[thu]) return thu;
  }
  return goc + ' (' + new Date().getTime() + ')';
}

/** Bin "AiO Short Viral" ở gốc project, chưa có thì tạo. Lỗi thì trả null (dùng gốc). */
function sv__layBin() {
  try {
    var root = app.project.rootItem;
    for (var i = 0; i < root.children.numItems; i++) {
      var c = root.children[i];
      // type 2 = BIN (ProjectItemType.BIN)
      if (c && c.type === 2 && String(c.name) === SV_TEN_BIN) return c;
    }
    return root.createBin(SV_TEN_BIN);
  } catch (e) {
    return null;
  }
}

/**
 * TỰ LƯU project trước khi dựng — đai bảo hiểm của Re-Frames: hai cú sập 31/07
 * và 01/08 đều mất 0 vì project vừa được lưu ngay trước.
 * ☠️ Chỉ lưu khi project ĐÃ CÓ FILE trên đĩa: project chưa từng lưu thì save()
 * có thể mở hộp thoại "Save As" — hộp thoại modal treo cả engine (skill 6f).
 * ☠️ save() kéo activeSequence về tab đang mở (skill mục "Ba cái bẫy" 04/08) —
 * vô hại ở đây vì hàm dựng không dựa vào activeSequence, và cuối cùng mở lại
 * sequence người dùng theo ID.
 */
function sv__luuTruoc() {
  try {
    var p = app.project.path;
    if (!p) return '0';
    if (!new File(p).exists) return '0';
    app.project.save();
    return '1';
  } catch (e) {
    return '0';
  }
}

/** Khoá phân biệt project item (nodeId). Không đọc được thì '' — khi đó không gộp trùng. */
function sv__khoaItem(pi) {
  try {
    var k = String(pi.nodeId);
    if (k && k !== 'undefined' && k !== 'null') return k;
  } catch (e) {}
  return '';
}

/**
 * Đặt in/out lên project item rồi ĐỌC LẠI. Trả '' nếu nhận, chuỗi lỗi nếu không.
 *
 * Thứ tự vào → ra → vào lần nữa: đặt vào trước khi ra cũ còn ở phía trước (vào
 * mới > ra cũ) thì Premiere có thể từ chối lần đầu; lần đặt thứ ba gỡ ca đó mà
 * không cần biết giá trị đang có.
 * ☠️ Đọc lại bắt buộc (skill 18h): in/out hỏng mà vẫn đặt clip thì item còn mang
 * in/out CŨ → clip dài sai đè chết clip bên cạnh, mà không ai báo lỗi.
 * Dung sai 0,1 s: item WAV lưu in/out theo lưới ~0,025 s (skill 16), video bắt
 * theo khung — lệch cỡ đó là bình thường; lệch cả giây mới là hỏng.
 */
function sv__datInOut(pi, a, b) {
  var loi = '';
  try {
    pi.setInPoint(a, 4);
    pi.setOutPoint(b, 4);
    pi.setInPoint(a, 4);
  } catch (e) {
    loi = sv__sach(e);
    try {
      pi.setInPoint(a);
      pi.setOutPoint(b);
      pi.setInPoint(a);
      loi = '';
    } catch (e2) {
      return loi + ' | ' + sv__sach(e2);
    }
  }
  var v = -1, r = -1;
  try { v = pi.getInPoint().seconds; r = pi.getOutPoint().seconds; }
  catch (e3) { return 'khong doc lai duoc in/out'; }
  if (Math.abs(v - a) > SV_DUNG_SAI_INOUT || Math.abs(r - b) > SV_DUNG_SAI_INOUT) {
    return 'doc lai lech ' + v + '-' + r + ' (can ' + a + '-' + b + ')';
  }
  return '';
}

/**
 * ☠️ CẤT in/out GỐC của MỌI project item sẽ bị ghi đè — luật 3a-bis. Đặt in/out
 * lên project item là ghi vào DỮ LIỆU CỦA NGƯỜI DÙNG. Phải đọc và cất giá trị cũ
 * NGAY LẦN CHẠY NÀY rồi trả lại nguyên văn — tính lại bằng công thức thì công
 * thức ăn đúng cái vừa bị làm hỏng (Autocut 19/08: hỏng in/out ba clip).
 * Đọc hỏng item nào thì trả lỗi → bên gọi KHÔNG được ghi: không có giá trị cũ
 * thì không trả lại được.
 */
function sv__catInOut(muc, goc) {
  var daCat = {};
  for (var i = 0; i < muc.length; i++) {
    var pi = muc[i].pi;
    var khoa = sv__khoaItem(pi);
    if (khoa && daCat[khoa]) continue;
    var vao, ra;
    try {
      vao = pi.getInPoint().seconds;
      ra = pi.getOutPoint().seconds;
    } catch (e) {
      return sv__sach(muc[i].p) + ': ' + sv__sach(e);
    }
    if (typeof vao !== 'number' || typeof ra !== 'number' || isNaN(vao) || isNaN(ra)) {
      return sv__sach(muc[i].p);
    }
    // ☠️ Là SỐ chưa đủ — phải là in/out DÙNG ĐƯỢC (sửa 19/09 sau soát). Sequence
    // chưa khoanh thì Premiere trả -400000 thay cho "chưa đặt" (đo 27/08, xem
    // sv__inSec); project item mà cũng trả một số đánh dấu kiểu đó thì cất nó rồi
    // "trả lại" sẽ không đặt lại được → item kẹt ở in/out của đoạn cuối, panel chỉ
    // biết SAU khi đã hỏng (bài 3a-bis). Bất thường thì dừng TRƯỚC khi ghi gì.
    // CHƯA ĐO: getInPoint/getOutPoint của item CHƯA từng đánh dấu — lần cài đầu
    // đo trên project item tự tạo.
    if (vao < 0 || !(ra > vao)) {
      return sv__sach(muc[i].p) + ': in/out goc bat thuong ' + vao + '-' + ra;
    }
    goc.push({ pi: pi, vao: vao, ra: ra });
    if (khoa) daCat[khoa] = true;
  }
  return '';
}

/**
 * Trả in/out gốc. Trả về số item KHÔNG trả lại được (0 là sạch).
 * ⚠️ CHƯA ĐO: item vốn KHÔNG có in/out thì "trả lại" thành đặt rõ 0 → hết độ
 * dài — dùng như cũ, nhưng Source Monitor có thể hiện dấu in/out. Không có cách
 * "xoá dấu" nào an toàn (hàm xoá in/out là thứ bị cấm ở đầu file).
 */
function sv__traInOut(goc) {
  var hong = 0;
  for (var z = 0; z < goc.length; z++) {
    if (sv__datInOut(goc[z].pi, goc[z].vao, goc[z].ra)) hong++;
  }
  return hong;
}

/** Đặt clip lên track tại `giay` — thử số giây trước, không ăn thì Time object (khuôn Autocut). */
function sv__datClip(track, pi, giay) {
  var loi1 = '';
  try { track.overwriteClip(pi, giay); return ''; } catch (e) { loi1 = sv__sach(e); }
  try {
    var t = new Time();
    t.seconds = giay;
    track.overwriteClip(pi, t);
    return '';
  } catch (e2) {
    return loi1 + ' | ' + sv__sach(e2);
  }
}

function sv__demClip(track) {
  try { return track ? track.clips.numItems : 0; } catch (e) { return 0; }
}

/** Mốc cuối của clip cuối trên track — ĐỌC LẠI, không cộng dồn. */
function sv__mocCuoi(track, duPhong) {
  try {
    var n = track.clips.numItems;
    if (n > 0) return track.clips[n - 1].end.seconds;
  } catch (e) {}
  return duPhong;
}

/** Mốc cuối xa nhất trên MỌI track của sequence. */
function sv__cuoiMoiTrack(seq) {
  var xa = 0;
  var nhom = [seq.videoTracks, seq.audioTracks];
  for (var g = 0; g < nhom.length; g++) {
    var ds = nhom[g];
    var so = 0;
    try { so = ds.numTracks; } catch (e) { so = 0; }
    for (var t = 0; t < so; t++) {
      var e2 = sv__mocCuoi(ds[t], 0);
      if (e2 > xa) xa = e2;
    }
  }
  return xa;
}

/** Tổng khe hở (giây) giữa các clip liền nhau trên track, tính từ clip `tu`-1. */
function sv__demKhe(track, tu, nguong) {
  var khe = 0;
  try {
    var n = track.clips.numItems;
    var truoc = -1;
    for (var k = (tu > 0 ? tu - 1 : 0); k < n; k++) {
      var c = track.clips[k];
      var s = c.start.seconds;
      if (truoc >= 0 && s - truoc > nguong) khe += (s - truoc);
      truoc = c.end.seconds;
    }
  } catch (e) {}
  return khe;
}

/** Có mốc nào trong mảng cách `x` không quá `nguong` không. */
function sv__coGan(mang, x, nguong) {
  for (var i = 0; i < mang.length; i++) {
    if (Math.abs(mang[i] - x) <= nguong) return true;
  }
  return false;
}

/**
 * Đọc danh sách đoạn panel gửi và KIỂM từng đoạn với timeline HIỆN TẠI.
 * Bản ghi: "kind␟trackIdx␟clipOrd␟srcTu␟srcDen␟duongDan" ngăn bằng ␞.
 *
 * ☠️ (track, thứ tự) là số của LÚC PANEL ĐỌC. Người dùng cắt/xoá/chèn clip sau đó
 * là thứ tự trượt → lấy nhầm clip khác. Nên so đường dẫn file của clip hiện nằm
 * ở đó với đường dẫn panel ghi; lệch là dừng (CLIP_DA_DOI), không đoán.
 * ☠️ Clip không có file gốc (sequence lồng, title) KHÔNG BAO GIỜ được làm ứng
 * viên (skill 18g: đặt nhầm một sequence lên track đã phủ 31 phút, giết 135/299
 * nhát cắt).
 */
function sv__docDoan(seqGoc, dsStr) {
  var ra = [];
  var ban = String(dsStr).split(SV_RS);
  var loaiDau = '';
  for (var i = 0; i < ban.length; i++) {
    if (!ban[i]) continue;
    var f = ban[i].split(SV_US);
    if (f.length < 6) return { loi: 'DOAN_SAI|ban ghi ' + i + ' thieu truong', ds: ra };
    var kind = f[0] === 'V' ? 'V' : (f[0] === 'A' ? 'A' : '');
    var tIdx = parseInt(f[1], 10), cOrd = parseInt(f[2], 10);
    var a = parseFloat(f[3]), b = parseFloat(f[4]);
    var p = f.slice(5).join(SV_US);
    if (!kind || isNaN(tIdx) || isNaN(cOrd) || isNaN(a) || isNaN(b) || a < 0 || !(b > a)) {
      return { loi: 'DOAN_SAI|ban ghi ' + i, ds: ra };
    }
    if (!loaiDau) loaiDau = kind;
    if (kind !== loaiDau) return { loi: 'DOAN_TRON_LOAI|', ds: ra };
    var tracks = (kind === 'V') ? seqGoc.videoTracks : seqGoc.audioTracks;
    var c = null;
    try {
      if (tIdx < 0 || tIdx >= tracks.numTracks) return { loi: 'CLIP_DA_DOI|' + kind + tIdx, ds: ra };
      var tr = tracks[tIdx];
      if (cOrd < 0 || cOrd >= tr.clips.numItems) return { loi: 'CLIP_DA_DOI|' + kind + tIdx + '#' + cOrd, ds: ra };
      c = tr.clips[cOrd];
    } catch (e) {
      return { loi: 'CLIP_DA_DOI|' + sv__sach(e), ds: ra };
    }
    var pthat = sv__duongDan(c);
    if (!pthat) return { loi: 'KHONG_CO_FILE_GOC|' + kind + tIdx + '#' + cOrd, ds: ra };
    if (sv__chuan(pthat) !== sv__chuan(p)) return { loi: 'CLIP_DA_DOI|' + kind + tIdx + '#' + cOrd, ds: ra };
    var pi = null;
    try { pi = c.projectItem; } catch (e2) { pi = null; }
    if (!pi) return { loi: 'KHONG_CO_FILE_GOC|' + kind + tIdx + '#' + cOrd, ds: ra };
    ra.push({ kind: kind, pi: pi, a: a, b: b, p: pthat });
  }
  if (!ra.length) return { loi: 'DS_RONG|', ds: ra };
  return { loi: '', ds: ra };
}

/**
 * Tạo sequence mới từ MỘT project item đã đặt in/out. createNewSequenceFromClips
 * (skill 6c: không mở hộp thoại, tôn trọng in/out, đặt cả hình lẫn tiếng).
 * Thử bin "AiO Short Viral" trước (CHƯA ĐO với bin riêng); ném lỗi mà chưa có
 * sequence mới thì làm lại ở gốc project — cách đã đo ở Re-Frames. Có sequence
 * mới rồi thì KHÔNG làm lại, dù có lỗi (tránh ra hai bản).
 */
function sv__taoSeqMoi(ten, pi, idCu) {
  var root = app.project.rootItem;
  var bin = sv__layBin();
  var loi = '';
  try { app.project.createNewSequenceFromClips(ten, [pi], bin ? bin : root); }
  catch (e) { loi = sv__sach(e); }
  var moi = sv__seqMoi(idCu);
  if (!moi && bin && loi) {
    try { app.project.createNewSequenceFromClips(ten, [pi], root); loi = ''; }
    catch (e2) { loi = loi + ' | ' + sv__sach(e2); }
    moi = sv__seqMoi(idCu);
  }
  return { seq: moi, loi: loi };
}

/**
 * LÕI DỰNG — dùng chung cho sv_taoSequence (dich = null: tạo mới) và sv_noiTiep
 * (dich = sequence đã tạo: nối thêm vào cuối).
 * Đoạn đặt NỐI TIẾP nhau, không chừa khe; mốc đặt ĐỌC LẠI từ clip cuối (Premiere
 * làm tròn vị trí về lưới khung hình — cộng dồn thì lệch dần: Autocut đo hở 1
 * khung sau 32 đoạn; đọc lại thì 0).
 */
function sv__dung(seqGoc, dich, ten, dsStr, coLuu) {
  var goc = [];   // in/out gốc đã cất — ở NGOÀI try để nhánh lỗi bất ngờ cũng trả lại
  var i;
  try {
    var doc = sv__docDoan(seqGoc, dsStr);
    if (doc.loi) return 'ERR:' + doc.loi;
    var muc = doc.ds;
    var loai = muc[0].kind;

    var eCat = sv__catInOut(muc, goc);
    if (eCat) return 'ERR:KHONG_DOC_DUOC_INOUT|' + eCat;

    // Lưu project CHỈ ở lần gọi đầu của một lượt (panel truyền coLuu = '1'). Bản
    // đầu lưu ở MỌI lần gọi: 65 khối = 65 lần ghi đè file .prproj của người dùng
    // trong một lượt (soát 19/09), mỗi lần còn ăn vào giờ chờ của panel. Một lần
    // lưu trước khi dựng đã đủ làm đai bảo hiểm: các lần gọi sau chỉ thêm sequence
    // do chính panel tạo. '-' = lần này không xin lưu.
    var luu = (String(coLuu) === '1') ? sv__luuTruoc() : '-';
    var batDau = 0;          // đoạn đầu tiên phải đặt bằng overwriteClip
    var soTruoc = 0;         // số clip trên track chính TRƯỚC lần dựng này
    var cuoiTruoc = 0;       // mốc cuối TRƯỚC lần dựng này

    if (!dich) {
      var e1 = sv__datInOut(muc[0].pi, muc[0].a, muc[0].b);
      if (e1) { sv__traInOut(goc); sv__moLai(seqGoc); return 'ERR:INOUT_LOI|' + e1; }
      var tenSach = sv__tenKhongTrung(sv__sach(ten) || SV_TEN_BIN);
      var tao = sv__taoSeqMoi(tenSach, muc[0].pi, sv__tapId());
      if (!tao.seq) {
        sv__traInOut(goc);
        sv__moLai(seqGoc);
        return 'ERR:TAO_SEQ_LOI|' + tao.loi;
      }
      dich = tao.seq;
      batDau = 1;
    } else {
      var mo = sv__mo(dich);
      if (mo) { sv__traInOut(goc); sv__moLai(seqGoc); return 'ERR:' + mo; }
    }

    var track = null, trackA = null;
    try {
      if (loai === 'V') {
        if (dich.videoTracks.numTracks) track = dich.videoTracks[0];
        if (dich.audioTracks.numTracks) trackA = dich.audioTracks[0];
      } else if (dich.audioTracks.numTracks) {
        track = dich.audioTracks[0];
      }
    } catch (eT) {}
    if (!track) { sv__traInOut(goc); sv__moLai(seqGoc); return 'ERR:KHONG_CO_TRACK|' + loai; }

    var ts = sv__thongSo(dich);
    var khung = 1 / ts.fps;

    if (batDau === 0) {
      soTruoc = sv__demClip(track);
      cuoiTruoc = sv__mocCuoi(track, 0);
      // ☠️ Nối vào cuối track chính chỉ an toàn khi KHÔNG track nào có clip nằm
      // sau mốc đó — nếu có (người dùng đã tự thêm nhạc, B-roll...) thì đặt đè
      // lên là xoá mất. Từ chối, đừng đè.
      if (sv__cuoiMoiTrack(dich) > cuoiTruoc + khung / 2) {
        sv__traInOut(goc);
        sv__moLai(seqGoc);
        return 'ERR:DICH_KHONG_AN_TOAN|' + cuoiTruoc;
      }
    }

    // ── Đặt các đoạn còn lại, nối tiếp ──
    var soLoi = 0, loiDau = '';
    var moc = (batDau === 1) ? sv__mocCuoi(track, muc[0].b - muc[0].a) : cuoiTruoc;
    for (i = batDau; i < muc.length; i++) {
      var eA = sv__datInOut(muc[i].pi, muc[i].a, muc[i].b);
      if (eA) { soLoi++; if (!loiDau) loiDau = 'inout doan ' + i + ': ' + eA; continue; }
      var eB = sv__datClip(track, muc[i].pi, moc);
      if (eB) { soLoi++; if (!loiDau) loiDau = 'dat clip doan ' + i + ': ' + eB; continue; }
      moc = sv__mocCuoi(track, moc + (muc[i].b - muc[i].a));
    }

    // ── TIẾNG phải đi theo HÌNH ──
    // Đoạn đầu (tạo từ clip) chắc có tiếng; các đoạn sau "thường" kéo tiếng theo
    // — "thường" không phải "chắc", nên ĐẾM rồi bù. Bù đặt đúng mốc ĐẦU của clip
    // hình tương ứng (đọc lại), không cộng dồn: đặt item có hình lên track tiếng
    // thì Premiere thả cả hình xuống track hình (skill 18g) — đặt đúng chỗ thì nó
    // đè lên chính đoạn hình giống hệt, không phủ lên đoạn khác.
    // Chỉ bù khi MỌI đoạn đã đặt được (ánh xạ clip thứ k ↔ đoạn thứ k mới đúng).
    var soV = sv__demClip(track) - soTruoc;
    var thieuTieng = 0, conThieuTieng = 0;
    if (loai === 'V' && trackA) {
      var dauA = [], dauV = [];
      var k;
      try {
        for (k = 0; k < trackA.clips.numItems; k++) dauA.push(trackA.clips[k].start.seconds);
        for (k = soTruoc; k < soTruoc + soV; k++) dauV.push(track.clips[k].start.seconds);
      } catch (eD) {}
      var nua = khung / 2;
      for (k = 0; k < dauV.length; k++) {
        if (sv__coGan(dauA, dauV[k], nua)) continue;
        thieuTieng++;
        if (soLoi === 0 && soV === muc.length) {
          if (!sv__datInOut(muc[k].pi, muc[k].a, muc[k].b)) sv__datClip(trackA, muc[k].pi, dauV[k]);
        }
      }
      if (thieuTieng) {
        dauA = [];
        try { for (k = 0; k < trackA.clips.numItems; k++) dauA.push(trackA.clips[k].start.seconds); } catch (eD2) {}
        for (k = 0; k < dauV.length; k++) if (!sv__coGan(dauA, dauV[k], nua)) conThieuTieng++;
      }
    }

    var traHong = sv__traInOut(goc);
    goc = [];

    // ── ĐO LẠI kết quả thật, không tin "không báo lỗi" ──
    var mongMuon = 0;
    for (i = 0; i < muc.length; i++) mongMuon += (muc[i].b - muc[i].a);
    var cuoi = sv__mocCuoi(track, cuoiTruoc);
    var khe = sv__demKhe(track, soTruoc, khung / 2);
    var ketQua = 'OK:id=' + String(dich.sequenceID) +
      '\nten=' + sv__sach(dich.name) +
      '\ndai=' + (cuoi - cuoiTruoc) +
      '\nmongMuon=' + mongMuon +
      '\nsoDoan=' + muc.length +
      '\nsoClip=' + (sv__demClip(track) - soTruoc) +
      '\nsoClipTieng=' + (trackA ? sv__demClip(trackA) : 0) +
      '\nthieuTieng=' + thieuTieng +
      '\nconThieuTieng=' + conThieuTieng +
      '\nkhe=' + khe +
      '\nkhung=' + khung +
      '\nsoLoi=' + soLoi +
      '\nloiDau=' + sv__sach(loiDau) +
      '\ntraInOutHong=' + traHong +
      '\nluu=' + luu;
    ketQua += '\nmoLai=' + sv__moLai(seqGoc);
    return ketQua;
  } catch (e) {
    sv__traInOut(goc);
    try { sv__moLai(seqGoc); } catch (e9) {}
    return sv__loi('sv__dung', e);
  }
}

/**
 * Dựng MỘT sequence mới từ danh sách đoạn (một khối, hoặc nhiều khối gộp).
 * @param idSeq  sequence NGUỒN của người dùng (đoạn lấy clip từ đây)
 * @param ten    tên mong muốn — tự nối " (2)" nếu trùng
 * @param dsStr  xem sv__docDoan
 * Tạo xong Premiere tự nhảy Timeline sang sequence mới; hàm MỞ LẠI sequence
 * người dùng theo ID (moLai=1/0).
 *
 * ⚠️ Không lấy theo: hiệu ứng, chỉnh màu, tốc độ, keyframe trên clip gốc — sequence
 * mới dựng từ FILE GỐC ở tốc độ 100%. Clip gốc chạy nhanh/chậm thì bản mới khác.
 * ⚠️ Chạy MỘT lèo trong một lần gọi — ExtendScript một luồng, không dừng giữa
 * chừng được. Nhiều đoạn thì panel nên tạo bằng đoạn đầu rồi sv_noiTiep từng lô
 * để có tiến độ và đường dừng (overwriteClip ~0,3 s/clip, chậm dần — skill 18f).
 * @param coLuu  '1' = lưu project trước khi dựng (chỉ lần gọi ĐẦU của một lượt).
 */
function sv_taoSequence(idSeq, ten, dsStr, coLuu) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var mo = sv__mo(bd.seq);
    if (mo) return 'ERR:' + mo;
    return sv__dung(bd.seq, null, ten, dsStr, coLuu);
  } catch (e) {
    return sv__loi('sv_taoSequence', e);
  }
}

/**
 * Nối thêm đoạn vào CUỐI một sequence panel vừa tạo (gộp nhiều khối theo lô,
 * có đường dừng giữa các lô).
 * ☠️ Cấm nối vào chính sequence nguồn, và cấm khi sequence đích có clip nằm sau
 * mốc nối (DICH_KHONG_AN_TOAN) — đặt đè là xoá đồ của người dùng.
 * Mỗi lần gọi mở sequence đích rồi mở lại sequence người dùng: Timeline nhảy qua
 * lại một lần mỗi lô.
 */
function sv_noiTiep(idSeq, idSeqMoi, dsStr, coLuu) {
  try {
    var bd = sv__batDau(idSeq);
    if (bd.loi) return bd.loi;
    var dich = sv__timSeq(idSeqMoi);
    if (!dich) return 'ERR:KHONG_THAY_SEQ_MOI|' + sv__sach(idSeqMoi);
    if (String(dich.sequenceID) === String(bd.seq.sequenceID)) return 'ERR:DICH_TRUNG_GOC|';
    return sv__dung(bd.seq, dich, '', dsStr, coLuu);
  } catch (e) {
    return sv__loi('sv_noiTiep', e);
  }
}

/**
 * Phiên bản host — panel KIỂM sau mỗi lần nạp, khớp mới chạy.
 * ☠️ PHẢI LÀ HÀM CUỐI FILE: $.evalFile có thể NUỐT FILE GIỮA CHỪNG mà không báo
 * lỗi (Auto Podcast đo 01/08: hàm trước điểm đứt là bản mới, hàm sau vẫn bản cũ).
 * Hàm cuối file trả đúng số = cả file đã nạp trọn vẹn.
 */
function sv_phienBan() {
  return '0.1.2';
}
