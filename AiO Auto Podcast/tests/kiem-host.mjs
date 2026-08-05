/**
 * kiem-host.mjs — bộ kiểm cho HAI hàm nguy hiểm nhất trong host/podcast.jsx,
 * chạy được ngoài Premiere bằng cách dựng `app` giả (05/08/2026, v0.6.1).
 *
 * VÌ SAO CÓ FILE NÀY
 * ══════════════════
 * Soát mã 05/08 tìm ra hai lỗi có thể LÀM MẤT CLIP trên timeline thật:
 *
 *   1. `pc__item` khớp đường dẫn bằng CHUỖI CON HAI CHIỀU rồi trả về ứng viên
 *      GẶP ĐẦU TIÊN. Item tên "A.wav" ăn khớp vào ".../mic_data.wav" (vì
 *      "data.wav" chứa "a.wav") và thắng chỉ vì nó nằm trước trong bin.
 *
 *   2. `pc_sapXepClipsLenTrack` XOÁ SẠCH mọi clip trên mọi track TRƯỚC, rồi
 *      mới đi tìm project item để đặt lại. Tìm trượt cái nào thì clip đó bay
 *      luôn — không tự hoàn tác được.
 *
 * Cả bốn bộ kiểm cũ (kiem-nao 16, kiem-sync 9, kiem-khop 32, stress 12) đều
 * BÁO ĐẠT trong lúc hai lỗi này đang nằm trong sản phẩm — vì không bộ nào
 * chạm tới host. Đó chính là lỗ hổng file này bịt lại.
 *
 * Chạy:  node tests/kiem-host.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')

let dat = 0, truot = 0
function kiem(ten, dieuKien, chiTiet) {
  if (dieuKien) { dat++; console.log(`  DAT   ${ten}${chiTiet ? ' — ' + chiTiet : ''}`) }
  else { truot++; console.log(`  TRUOT ${ten}${chiTiet ? ' — ' + chiTiet : ''}`) }
}

// ═══ DỰNG PREMIERE GIẢ ════════════════════════════════════════════════════
// Chỉ dựng đúng phần host chạm tới: rootItem/children/numItems, getMediaPath,
// name, type; track có clips.numItems + remove(); overwriteClip().

function taoItem(ten, duong) {
  return {
    type: 1, name: ten,
    getMediaPath: () => duong,
    setInPoint() {}, setOutPoint() {}, clearInPoint() {}, clearOutPoint() {},
  }
}
function taoBin(ten, con) {
  return { type: 2, name: ten, children: { numItems: con.length, ...con } }
}
function taoTrack() {
  const daDat = []
  const tr = {
    daDat,
    clips: { numItems: 0 },
    overwriteClip(pi, giay) { daDat.push({ pi, giay }); return true },
  }
  return tr
}
/** Track có sẵn n clip — để đo xem hàm có xoá sạch hay không. */
function taoTrackCoClip(n) {
  const tr = taoTrack()
  const ds = []
  for (let i = 0; i < n; i++) ds.push({ remove() { tr.clips.numItems-- } })
  tr.clips = new Proxy({ numItems: n }, {
    get: (o, k) => (k === 'numItems' ? o.numItems : ds[k]),
    set: (o, k, v) => { o[k] = v; return true },
  })
  tr.__ds = ds
  return tr
}

function dungApp(dsCon, trackV = [], trackA = [], tenSeq = 'SEQ') {
  return {
    version: '26.5',
    project: {
      name: 'gia.prproj',
      save() {},
      rootItem: taoBin('root', dsCon),
      sequences: { numSequences: 1, 0: { name: tenSeq } },
      activeSequence: {
        name: tenSeq,
        getSettings: () => ({ videoFrameWidth: 1920, videoFrameHeight: 1080 }),
        videoTracks: { numTracks: trackV.length, ...trackV },
        audioTracks: { numTracks: trackA.length, ...trackA },
      },
    },
  }
}

/** Nạp host vào một sandbox có sẵn `app`, trả về các hàm pc_*. */
function napHost(app) {
  const ma = readFileSync(join(GOC, 'host', 'podcast.jsx'), 'utf8')
  const f = new Function('app', ma + '\n; return { pc__item, pc_sapXepClipsLenTrack, pc_phienBan,' +
    ' pc_veAmLuong, pc_xoaAmLuong, pc_docAmLuong, pc_datTrangThaiTieng, pc_doTrangThaiTieng,' +
    ' pc_datTrangThaiHinh, pc_doPhuHinh };')
  return f(app)
}

// ── Clip AUDIO gia: co component Volume > Level nhu Premiere that ─────────
const LEVEL_MAC_DINH = 0.17782793939114   // = 0 dB tren thang Premiere
function taoClipAudio(start) {
  const st = { val: LEVEL_MAC_DINH, bien: false, keys: [] }
  const prop = {
    displayName: 'Level',
    getValue: () => st.val,
    setValue(v) { st.val = v },
    isTimeVarying: () => st.bien,
    setTimeVarying(b) { st.bien = b; if (!b) st.keys.length = 0 },
    addKey(t) { if (!st.keys.some((k) => k.t === t)) st.keys.push({ t, v: st.val }) },
    setValueAtKey(t, v) {
      const k = st.keys.find((x) => x.t === t)
      if (k) k.v = v; else st.keys.push({ t, v })
    },
    getKeys: () => st.keys.slice().sort((a, b) => a.t - b.t).map((k) => ({ seconds: k.t })),
    getValueAtKey: (k) => (st.keys.find((x) => x.t === (k && k.seconds !== undefined ? k.seconds : k)) || {}).v,
  }
  return {
    __st: st, disabled: false, name: 'mic.wav',
    start: { seconds: start }, end: { seconds: start + 1 },
    inPoint: { seconds: 0 }, outPoint: { seconds: 1 },
    projectItem: { name: 'mic.wav', getMediaPath: () => 'X:/a/mic.wav' },
    components: {
      numItems: 1,
      0: {
        displayName: 'Volume', matchName: 'Internal Volume Mono',
        properties: { numItems: 1, 0: prop },
      },
    },
  }
}
function taoTrackAudio(clips) {
  const o = { numItems: clips.length }
  clips.forEach((c, i) => { o[i] = c })
  return { clips: o, __clips: clips, name: 'Audio' }
}

// ═══ 1. pc__item — LỖI BẮT NHẦM CHUỖI CON ════════════════════════════════
console.log('\n── 1. pc__item: chuoi con khong duoc thang khop tuyet doi ──')

{
  // Bẫy thật: item "A.wav" nằm TRƯỚC trong bin, và "data.wav" CHỨA "a.wav".
  const app = dungApp([
    taoItem('A.wav', 'X:/au/A.wav'),
    taoItem('mic_data.wav', 'X:/au/mic_data.wav'),
  ])
  const { pc__item } = napHost(app)
  const ra = pc__item('X:/au/mic_data.wav')
  kiem('"mic_data.wav" khong bi "A.wav" an mat',
    ra && ra.name === 'mic_data.wav', 'ra=' + (ra ? ra.name : 'null'))
}

{
  // Đường dẫn tuyệt đối phải thắng, kể cả khi ứng viên yếu đứng trước.
  const app = dungApp([
    taoItem('Cam.mp4', 'X:/v/Cam.mp4'),
    taoItem('Cam2_Trong.mp4', 'X:/v/Cam2_Trong.mp4'),
  ])
  const { pc__item } = napHost(app)
  const ra = pc__item('X:/v/Cam2_Trong.mp4')
  kiem('duong dan tuyet doi thang', ra && ra.name === 'Cam2_Trong.mp4',
    'ra=' + (ra ? ra.name : 'null'))
}

{
  // Cùng tên file ở folder khác (media đã dời ổ) — vẫn phải nhận ra.
  const app = dungApp([taoItem('Mic_Trong.mp3', 'D:/moi/Mic_Trong.mp3')])
  const { pc__item } = napHost(app)
  const ra = pc__item('X:/cu/Mic_Trong.mp3')
  kiem('cung ten file o folder khac van nhan ra',
    ra && ra.name === 'Mic_Trong.mp3', 'ra=' + (ra ? ra.name : 'null'))
}

{
  // Item nằm sâu trong bin lồng nhau.
  const app = dungApp([
    taoBin('Audio', [taoBin('Buoi2', [taoItem('Mic_Dilys.mp3', 'X:/a/Mic_Dilys.mp3')])]),
  ])
  const { pc__item } = napHost(app)
  const ra = pc__item('X:/a/Mic_Dilys.mp3')
  kiem('tim duoc item trong bin long 2 cap', ra && ra.name === 'Mic_Dilys.mp3',
    'ra=' + (ra ? ra.name : 'null'))
}

{
  const app = dungApp([taoItem('Cam1.mp4', 'X:/v/Cam1.mp4')])
  const { pc__item } = napHost(app)
  kiem('khong co thi tra null', pc__item('X:/v/KhongCo.mp4') === null ||
    pc__item('X:/v/KhongCo.mp4') === undefined)
  kiem('duong rong tra null', pc__item('') === null)
}

// ═══ 2. pc_sapXepClipsLenTrack — KHONG DUOC XOA KHI THIEU ITEM ═══════════
console.log('\n── 2. pc_sapXepClipsLenTrack: thieu item thi KHONG duoc dung timeline ──')

{
  // Lệnh trỏ tới một file KHÔNG có trong project (media offline).
  const v0 = taoTrackCoClip(3), a0 = taoTrackCoClip(2)
  const app = dungApp([taoItem('Cam1.mp4', 'X:/v/Cam1.mp4')], [v0], [a0])
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('SEQ',
    'V,0,X:/v/Cam1.mp4,0,10,0;V,0,X:/v/BIEN-MAT.mp4,0,10,10')

  kiem('bao dung ma loi THIEU_ITEM', ra.indexOf('ERR:THIEU_ITEM') === 0, ra)
  kiem('noi ro thieu file NAO', ra.indexOf('BIEN-MAT.mp4') >= 0, ra)
  kiem('☠️ TIMELINE KHONG BI XOA — video con nguyen 3 clip',
    v0.clips.numItems === 3, 'con=' + v0.clips.numItems)
  kiem('☠️ TIMELINE KHONG BI XOA — audio con nguyen 2 clip',
    a0.clips.numItems === 2, 'con=' + a0.clips.numItems)
  kiem('khong dat clip nao len track', v0.daDat.length === 0,
    'daDat=' + v0.daDat.length)
}

{
  // Ca thuận: đủ item → xoá sạch rồi đặt lại đúng số lượng.
  const v0 = taoTrackCoClip(5), v1 = taoTrackCoClip(0)
  const a0 = taoTrackCoClip(4), a1 = taoTrackCoClip(0)
  const app = dungApp([
    taoItem('Cam2_Trong.mp4', 'X:/v/Cam2_Trong.mp4'),
    taoItem('Cam3_Dilys.mp4', 'X:/v/Cam3_Dilys.mp4'),
    taoItem('Mic_Trong.mp3', 'X:/a/Mic_Trong.mp3'),
  ], [v0, v1], [a0, a1])
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('SEQ',
    'V,0,X:/v/Cam2_Trong.mp4,0,10,0;V,1,X:/v/Cam3_Dilys.mp4,0,10,0;' +
    'A,1,X:/a/Mic_Trong.mp3,0,30,0')

  kiem('du item thi bao OK', ra.indexOf('OK:') === 0, ra)
  kiem('soLoi = 0', /soLoi=0(\||$)/.test(ra), ra)
  kiem('daDat = 3', /daDat=3\|/.test(ra), ra)
  kiem('V0 nhan dung 1 clip', v0.daDat.length === 1, 'so=' + v0.daDat.length)
  kiem('V1 nhan dung 1 clip', v1.daDat.length === 1, 'so=' + v1.daDat.length)
  kiem('A1 nhan dung 1 clip', a1.daDat.length === 1, 'so=' + a1.daDat.length)
  kiem('track cu da duoc don sach', v0.clips.numItems === 0,
    'con=' + v0.clips.numItems)
}

{
  // Sequence đã bị đổi sang tab khác → phải dừng, không ghi bậy.
  const v0 = taoTrackCoClip(3)
  const app = dungApp([taoItem('Cam1.mp4', 'X:/v/Cam1.mp4')], [v0], [], 'SEQ-KHAC')
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('SEQ', 'V,0,X:/v/Cam1.mp4,0,10,0')
  kiem('doi sequence giua chung -> SEQ_DOI', ra.indexOf('ERR:SEQ_DOI') === 0, ra)
  kiem('va khong xoa gi', v0.clips.numItems === 3, 'con=' + v0.clips.numItems)
}

// ═══ 2a2. ☠️ THIEU TRACK — lenh tro vao track KHONG TON TAI ══════════════
// Ra soat 05/08 chi ra: v0.6.1 bit duong "thieu ITEM" nhung con nguyen duong
// "thieu TRACK". Ca that: keo 6 file cam vao mot sequence (clip don tren V0)
// roi bam Auto Match -> khop.js sinh V,0..V,5 theo SO NHOM TEN FILE, khong he
// doc so track that -> lenh V,3..V,5 roi vao khoang trang.
console.log('\n── 2a2. Track khong ton tai: KHONG duoc im lang nuot lenh ──')

{
  const v0 = taoTrackCoClip(6)          // 6 clip cam dang nam don tren V0
  const app = dungApp([
    taoItem('Cam1.mp4', 'X:/v/Cam1.mp4'),
    taoItem('Cam2.mp4', 'X:/v/Cam2.mp4'),
  ], [v0], [])
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('SEQ',
    'V,0,X:/v/Cam1.mp4,0,10,0;V,5,X:/v/Cam2.mp4,0,10,0')

  kiem('☠️ lenh tro vao V5 tren sequence 1 track -> PHAI bao loi',
    ra.indexOf('OK:') !== 0 || !/soLoi=0(\||$)/.test(ra), ra)
  kiem('☠️ va KHONG duoc xoa sach timeline roi bo do',
    ra.indexOf('ERR:') === 0 ? v0.clips.numItems === 6 : v0.daDat.length === 2,
    'con=' + v0.clips.numItems + ' daDat=' + v0.daDat.length + ' | ' + ra)
}

{
  const a0 = taoTrackCoClip(4)
  const app = dungApp([taoItem('Mic.wav', 'X:/a/Mic.wav')], [taoTrackCoClip(0)], [a0])
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('SEQ', 'A,4,X:/a/Mic.wav,0,10,0')
  kiem('☠️ track AUDIO ngoai vung cung phai bao loi',
    ra.indexOf('OK:') !== 0 || !/soLoi=0(\||$)/.test(ra), ra)
  kiem('va timeline audio con nguyen', a0.clips.numItems === 4, 'con=' + a0.clips.numItems)
}

// ═══ 2a3. ☠️ setInPoint/setOutPoint HONG — khong duoc dat clip dai sai ════
console.log('\n── 2a3. Cat in/out hong thi KHONG duoc dat clip ──')

{
  // Item nay tu choi setOutPoint (mo phong out vuot do dai media).
  const xau = {
    type: 1, name: 'Xau.mp4', getMediaPath: () => 'X:/v/Xau.mp4',
    setInPoint() {}, setOutPoint() { throw new Error('out vuot do dai media') },
    clearInPoint() {}, clearOutPoint() {},
  }
  const v0 = taoTrackCoClip(0)
  const app = dungApp([taoItem('Tot.mp4', 'X:/v/Tot.mp4'), xau], [v0], [])
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('SEQ',
    'V,0,X:/v/Tot.mp4,0,30,0;V,0,X:/v/Xau.mp4,0,30,30')

  kiem('☠️ cat in/out hong -> PHAI dem vao soLoi', !/soLoi=0(\||$)/.test(ra), ra)
  kiem('☠️ va KHONG dat clip do len track (tranh clip dai sai de clip ben canh)',
    v0.daDat.length === 1, 'da dat ' + v0.daDat.length + ' clip')
}

// ═══ 2b. CA THAT 05/08: SEQUENCE TRUNG TEN THU MUC QUAY ══════════════════
// Anh Tien dat ten sequence = ten thu muc quay ("Quay PV tuyen dung_DRT_1002").
// Ten do nam trong duong dan cua MOI file trong buoi quay -> luat "chuoi con"
// cu cho no khop voi bat ky file nao chua duoc nhap. Hau qua do duoc tren
// timeline that: pc_nhapMono tuong da co san -> khong nhap -> pc_datTieng dat
// CA SEQUENCE 31 phut len A1/A2, keo hinh xuong V1/V2, nuot 135/299 nhat cat.
console.log('\n── 2b. Sequence/bin (khong co file) khong duoc an khop vao duong dan ──')

{
  const seqItem = { type: 1, name: 'Quay PV tuyen dung_DRT_1002', getMediaPath: () => '' }
  const seqWill = { type: 1, name: 'Will', getMediaPath: () => '' }
  const app = dungApp([
    seqItem,
    seqWill,
    taoItem('C4091.MP4', 'G:/Quay PV tuyen dung_DRT_1002/Video/Cam 2/C4091.mp4'),
  ])
  const { pc__item } = napHost(app)

  const mono = pc__item('G:/Quay PV tuyen dung_DRT_1002/Audio/102 Quay Phim Will (2).aio-mono.wav')
  kiem('☠️ file mono CHUA nhap -> tra null, KHONG bat vao sequence',
    mono === null || mono === undefined, 'ra=' + (mono ? mono.name : 'null'))

  const cam = pc__item('G:/Quay PV tuyen dung_DRT_1002/Video/Cam 2/C4091.mp4')
  kiem('cam co that van tim ra binh thuong', cam && cam.name === 'C4091.MP4',
    'ra=' + (cam ? cam.name : 'null'))

  const gan = pc__item('G:/Quay PV tuyen dung_DRT_1002/Video/Cam 2/KHONG-CO.mp4')
  kiem('file cung thu muc nhung khong ton tai -> null',
    gan === null || gan === undefined, 'ra=' + (gan ? gan.name : 'null'))
}

{
  // Khong duoc cache ket qua roi tra lai lan sau: nhap xong phai thay ngay.
  const con = [{ type: 1, name: 'X', getMediaPath: () => '' }]
  const kho = { type: 2, name: 'root', children: { get numItems() { return con.length }, get 0() { return con[0] }, get 1() { return con[1] } } }
  const app = dungApp([])
  app.project.rootItem = kho
  const { pc__item } = napHost(app)
  kiem('truoc khi nhap: null', pc__item('X:/a/M.wav') === null)
  con.push(taoItem('M.wav', 'X:/a/M.wav'))
  const sau = pc__item('X:/a/M.wav')
  kiem('☠️ sau khi nhap: thay NGAY (khong bi cache ghim ket qua cu)',
    sau && sau.name === 'M.wav', 'ra=' + (sau ? sau.name : 'null'))
}

// ═══ 2c. SEQ_DOI — bam sang tab khac KHONG duoc giet ban dung ═════════════
console.log('\n── 2c. Doi tab giua chung: ghim lai dung ban dung, khong chet ──')

{
  const v0 = taoTrackCoClip(0)
  const banDung = {
    name: 'BAN-DUNG',
    getSettings: () => ({ videoFrameWidth: 1920, videoFrameHeight: 1080 }),
    videoTracks: { numTracks: 1, 0: v0 },
    audioTracks: { numTracks: 0 },
  }
  const tabKhac = { name: 'NGUOI-DUNG-DANG-XEM', videoTracks: { numTracks: 0 }, audioTracks: { numTracks: 0 } }
  const app = dungApp([taoItem('Cam1.mp4', 'X:/v/Cam1.mp4')])
  app.project.sequences = { numSequences: 2, 0: tabKhac, 1: banDung }
  app.project.activeSequence = tabKhac          // nguoi dung vua bam sang tab khac
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('BAN-DUNG', 'V,0,X:/v/Cam1.mp4,0,10,0')

  kiem('van dung viec, khong tra SEQ_DOI', ra.indexOf('OK:') === 0, ra)
  kiem('da ghim lai active ve ban dung',
    app.project.activeSequence && app.project.activeSequence.name === 'BAN-DUNG',
    'active=' + (app.project.activeSequence ? app.project.activeSequence.name : '?'))
  kiem('clip vao dung ban dung', v0.daDat.length === 1, 'so=' + v0.daDat.length)
}

{
  // Ban dung BIEN MAT that (bi xoa) -> van phai dung tay.
  const app = dungApp([taoItem('Cam1.mp4', 'X:/v/Cam1.mp4')])
  app.project.sequences = { numSequences: 1, 0: { name: 'CHI-CO-CAI-NAY' } }
  app.project.activeSequence = { name: 'CHI-CO-CAI-NAY', videoTracks: { numTracks: 0 }, audioTracks: { numTracks: 0 } }
  const { pc_sapXepClipsLenTrack } = napHost(app)
  const ra = pc_sapXepClipsLenTrack('BAN-DUNG-DA-XOA', 'V,0,X:/v/Cam1.mp4,0,10,0')
  kiem('mat han ban dung -> SEQ_DOI (dung tay)', ra.indexOf('ERR:SEQ_DOI') === 0, ra)
}

// ═══ 2d. DUONG AM LUONG (ducking bang keyframe) ══════════════════════════
console.log('\n── 2d. pc_veAmLuong: keyframe dat dung gia tri, go lai duoc ──')

{
  const cl = taoClipAudio(0)
  const a0 = taoTrackAudio([cl])
  const app = dungApp([], [], [a0])
  const { pc_veAmLuong, pc_xoaAmLuong, pc_docAmLuong } = napHost(app)

  const DUCK = Math.pow(10, -15 / 20)      // 0.177828 — he so, KHONG phai dB
  const ra = pc_veAmLuong('SEQ', 0, '7.007,1;10.5,1;10.65,' + DUCK + ';20,' + DUCK,
    LEVEL_MAC_DINH)
  kiem('bao OK', ra.indexOf('OK:') === 0, ra)
  kiem('dat du 4 keyframe', /daDat=4\|/.test(ra) && /soKey=4\|/.test(ra), ra)
  kiem('soLoi = 0', /soLoi=0\|/.test(ra), ra)
  kiem('da bat che do keyframe', cl.__st.bien === true)

  const keys = cl.__st.keys.slice().sort((a, b) => a.t - b.t)
  kiem('☠️ he so 1 -> giu NGUYEN gia tri goc (khong tu y doi gain)',
    Math.abs(keys[0].v - LEVEL_MAC_DINH) < 1e-12, 'ra=' + keys[0].v)
  const mongDoi = LEVEL_MAC_DINH * DUCK
  kiem('☠️ he so 0,1778 -> dung -15 dB so voi goc',
    Math.abs(keys[2].v - mongDoi) < 1e-12,
    'ra=' + keys[2].v + ' mong doi=' + mongDoi)
  const db = 20 * Math.log10(keys[2].v / keys[0].v)
  kiem('doi chieu lai bang dB', Math.abs(db + 15) < 0.001, 'chenh=' + db.toFixed(4) + ' dB')

  const rd = pc_docAmLuong('SEQ')
  kiem('pc_docAmLuong bao dung so key', /\|true\|4\|/.test(rd), rd.replace(/\n/g, ' '))

  const rx = pc_xoaAmLuong('SEQ', 0)
  kiem('go duong -> het keyframe', rx.indexOf('OK:') === 0 && cl.__st.keys.length === 0, rx)
  kiem('go duong -> tat che do keyframe', cl.__st.bien === false)
}

{
  // Goc la 0 / am -> tu choi, khong ghi bua (chia cho 0 la mat tieng).
  const a0 = taoTrackAudio([taoClipAudio(0)])
  const { pc_veAmLuong } = napHost(dungApp([], [], [a0]))
  kiem('goc = 0 -> ERR_GOC_LA', pc_veAmLuong('SEQ', 0, '1,1', 0).indexOf('ERR:GOC_LA') === 0)
  kiem('track khong ton tai -> ERR_TRACK_LA',
    pc_veAmLuong('SEQ', 9, '1,1', 0.1).indexOf('ERR:TRACK_LA') === 0)
}

// ═══ 2e. CAT ROI + BAT/TAT CLIP (anh Tien de xuat 05/08) ══════════════════
console.log('\n── 2e. pc_datTrangThaiTieng: khop clip theo start, tat dung cai ──')

{
  //  doan:      0-1 (Will noi)   1-2 (Trong noi)   2-3 (Will noi)
  //  track A0 = mic Will: bat, TAT, bat
  const c0 = taoClipAudio(0), c1 = taoClipAudio(1), c2 = taoClipAudio(2)
  const a0 = taoTrackAudio([c0, c1, c2])
  const { pc_datTrangThaiTieng, pc_doTrangThaiTieng } = napHost(dungApp([], [], [a0]))
  const DUCK = Math.pow(10, -15 / 20)

  const ra = pc_datTrangThaiTieng('SEQ', 0,
    '0,0,1;1,1,' + DUCK + ';2,0,1', LEVEL_MAC_DINH)
  kiem('bao OK, dat du 3', ra.indexOf('OK:') === 0 && /daDat=3\|/.test(ra), ra)
  kiem('khong sot clip nao', /khongThayClip=0\|/.test(ra), ra)
  kiem('☠️ TAT dung clip giua', c0.disabled === false && c1.disabled === true && c2.disabled === false,
    [c0.disabled, c1.disabled, c2.disabled].join(','))
  kiem('clip bat giu nguyen muc goc',
    Math.abs(c0.__st.val - LEVEL_MAC_DINH) < 1e-12 && Math.abs(c2.__st.val - LEVEL_MAC_DINH) < 1e-12)

  const rd = pc_doTrangThaiTieng('SEQ')
  kiem('do lai: 3 clip, 1 tat, 2 bat', /A0\|3\|1\|2\|/.test(rd), rd.replace(/\n/g, ' '))
}

{
  // Duong "cat-chim": khong tat clip nao, chi ha Level.
  const c0 = taoClipAudio(0), c1 = taoClipAudio(1)
  const a0 = taoTrackAudio([c0, c1])
  const { pc_datTrangThaiTieng } = napHost(dungApp([], [], [a0]))
  const DUCK = Math.pow(10, -15 / 20)
  pc_datTrangThaiTieng('SEQ', 0, '0,0,1;1,0,' + DUCK, LEVEL_MAC_DINH)
  kiem('khong tat clip nao', c0.disabled === false && c1.disabled === false)
  kiem('clip nguoi khong noi ha dung -15 dB',
    Math.abs(20 * Math.log10(c1.__st.val / c0.__st.val) + 15) < 0.001,
    'chenh=' + (20 * Math.log10(c1.__st.val / c0.__st.val)).toFixed(4) + ' dB')
}

{
  // ☠️ CA THAT 05/08: panel gui 2.3000, clip that nam o 2.2940 (overwriteClip
  // dat theo LUOI KHUNG HINH). Ban khop bang toFixed(2) truot 14/20 lenh dau.
  const c0 = taoClipAudio(2.2940), c1 = taoClipAudio(10.6356), c2 = taoClipAudio(25.6089)
  const a0 = taoTrackAudio([c0, c1, c2])
  const { pc_datTrangThaiTieng } = napHost(dungApp([], [], [a0]))
  const ra = pc_datTrangThaiTieng('SEQ', 0, '2.3000,1,1;10.6400,0,1;25.6000,1,1', LEVEL_MAC_DINH)
  kiem('☠️ moc lech vai ms (luoi khung) VAN khop dung clip',
    /daDat=3\|/.test(ra) && /khongThayClip=0\|/.test(ra), ra)
  kiem('va tat dung hai clip duoc yeu cau',
    c0.disabled === true && c1.disabled === false && c2.disabled === true,
    [c0.disabled, c1.disabled, c2.disabled].join(','))
}

{
  // Nhung lech NHIEU thi van phai truot — dung sai khong duoc nong den muc
  // bat nham sang doan ben canh (bai hoc 5j: dung noi nguong cho no qua).
  const c0 = taoClipAudio(0)
  const a0 = taoTrackAudio([c0])
  const { pc_datTrangThaiTieng } = napHost(dungApp([], [], [a0]))
  const ra = pc_datTrangThaiTieng('SEQ', 0, '0.5,1,1', LEVEL_MAC_DINH)
  kiem('lech 500 ms -> KHONG duoc khop bua', /khongThayClip=1\|/.test(ra), ra)
  kiem('va khong tat nham clip do', c0.disabled === false)
}

{
  // Hai clip sat nhau: phai chon cai GAN NHAT, khong phai cai gap truoc.
  const c0 = taoClipAudio(1.00), c1 = taoClipAudio(1.05)
  const a0 = taoTrackAudio([c0, c1])
  const { pc_datTrangThaiTieng } = napHost(dungApp([], [], [a0]))
  pc_datTrangThaiTieng('SEQ', 0, '1.04,1,1', LEVEL_MAC_DINH)
  kiem('chon clip GAN NHAT (1.05) chu khong phai cai gap truoc (1.00)',
    c0.disabled === false && c1.disabled === true,
    [c0.disabled, c1.disabled].join(','))
}

{
  // Lenh tro toi mot moc KHONG co clip -> phai bao, khong duoc im lang bo qua.
  const c0 = taoClipAudio(0)
  const a0 = taoTrackAudio([c0])
  const { pc_datTrangThaiTieng } = napHost(dungApp([], [], [a0]))
  const ra = pc_datTrangThaiTieng('SEQ', 0, '0,0,1;99,1,1', LEVEL_MAC_DINH)
  kiem('☠️ moc khong co clip -> dem vao khongThayClip', /khongThayClip=1\|/.test(ra), ra)
  kiem('va van dat duoc cai co that', /daDat=1\|/.test(ra), ra)
  kiem('khong tat nham clip khac', c0.disabled === false)
}

// ═══ 2f. HINH: DU CAM + BAT/TAT (anh Tien 05/08) ═════════════════════════
console.log('\n── 2f. pc_datTrangThaiHinh + pc_doPhuHinh: moi moc DUNG 1 cam bat ──')

{
  //  doan:      0-1 (nguoi 0)   1-2 (nguoi 1)   2-3 (nguoi 0)
  //  V0 = cam nguoi 0 : bat, TAT, bat
  //  V1 = cam nguoi 1 : TAT, bat, TAT
  const v00 = taoClipAudio(0), v01 = taoClipAudio(1), v02 = taoClipAudio(2)
  const v10 = taoClipAudio(0), v11 = taoClipAudio(1), v12 = taoClipAudio(2)
  const v0 = taoTrackAudio([v00, v01, v02])
  const v1 = taoTrackAudio([v10, v11, v12])
  const app = dungApp([], [v0, v1], [])
  const { pc_datTrangThaiHinh, pc_doPhuHinh } = napHost(app)

  const r0 = pc_datTrangThaiHinh('SEQ', 0, '0,0;1,1;2,0')
  const r1 = pc_datTrangThaiHinh('SEQ', 1, '0,1;1,0;2,1')
  kiem('V0 dat du 3, khong sot', /daDat=3\|/.test(r0) && /khongThayClip=0\|/.test(r0), r0)
  kiem('V1 dat du 3, khong sot', /daDat=3\|/.test(r1) && /khongThayClip=0\|/.test(r1), r1)
  kiem('V0 bat-TAT-bat', [v00.disabled, v01.disabled, v02.disabled].join(',') === 'false,true,false',
    [v00.disabled, v01.disabled, v02.disabled].join(','))
  kiem('V1 TAT-bat-TAT', [v10.disabled, v11.disabled, v12.disabled].join(',') === 'true,false,true',
    [v10.disabled, v11.disabled, v12.disabled].join(','))

  const rp = pc_doPhuHinh('SEQ')
  kiem('☠️ moi moc DUNG 1 cam bat', /soMoc=3\|motBat=3\|khongBat=0\|nhieuBat=0\|/.test(rp), rp)
}

{
  // Hai cam cung BAT o mot moc -> track tren che track duoi, phai bao.
  const v00 = taoClipAudio(0), v10 = taoClipAudio(0)
  const app = dungApp([], [taoTrackAudio([v00]), taoTrackAudio([v10])], [])
  const { pc_datTrangThaiHinh, pc_doPhuHinh } = napHost(app)
  pc_datTrangThaiHinh('SEQ', 0, '0,0')
  pc_datTrangThaiHinh('SEQ', 1, '0,0')
  const rp = pc_doPhuHinh('SEQ')
  kiem('☠️ hai cam cung bat -> BAO nhieuBat', /nhieuBat=1\|/.test(rp), rp)
  kiem('va noi ro moc nao', /cam cung bat @/.test(rp), rp)
}

{
  // Khong cam nao bat o mot moc -> man hinh den, phai bao.
  const v00 = taoClipAudio(0), v10 = taoClipAudio(0)
  const app = dungApp([], [taoTrackAudio([v00]), taoTrackAudio([v10])], [])
  const { pc_datTrangThaiHinh, pc_doPhuHinh } = napHost(app)
  pc_datTrangThaiHinh('SEQ', 0, '0,1')
  pc_datTrangThaiHinh('SEQ', 1, '0,1')
  const rp = pc_doPhuHinh('SEQ')
  kiem('☠️ khong cam nao bat -> BAO khongBat', /khongBat=1\|/.test(rp), rp)
}

{
  // Moc lech theo luoi khung hinh van phai khop (giong duong tieng).
  const v00 = taoClipAudio(2.2940)
  const app = dungApp([], [taoTrackAudio([v00])], [])
  const { pc_datTrangThaiHinh } = napHost(app)
  const ra = pc_datTrangThaiHinh('SEQ', 0, '2.3000,1')
  kiem('moc lech 6 ms van khop', /daDat=1\|/.test(ra) && /khongThayClip=0\|/.test(ra), ra)
  kiem('va tat dung clip do', v00.disabled === true)
}

// ═══ 3. PHIEN BAN HOST ═══════════════════════════════════════════════════
console.log('\n── 3. Phien ban host khop voi cho panel kiem ──')
{
  const { pc_phienBan } = napHost(dungApp([]))
  const ver = pc_phienBan()
  const html = readFileSync(join(GOC, 'dist', 'index.html'), 'utf8')
  const soCho = (html.match(/pb !== '([^']+)'/g) || [])
  kiem('panel kiem it nhat 2 cho', soCho.length >= 2, soCho.join(' '))
  kiem('moi cho panel kiem deu khop host',
    soCho.every((s) => s.indexOf("'" + ver + "'") >= 0),
    'host=' + ver + ' panel=' + soCho.join(' '))
}

console.log(`\n>>> ${truot === 0 ? 'TAT CA DAT' : 'CO TRUOT'} (${dat} dat / ${truot} truot)`)
process.exit(truot === 0 ? 0 : 1)
