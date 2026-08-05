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
  const f = new Function('app', ma + '\n; return { pc__item, pc_sapXepClipsLenTrack, pc_phienBan };')
  return f(app)
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
