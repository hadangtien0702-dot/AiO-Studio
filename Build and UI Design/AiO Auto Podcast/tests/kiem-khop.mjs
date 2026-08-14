/**
 * kiem-khop.mjs — bộ tự kiểm của khop.js (nút "Tự khớp" / auto match).
 *
 * Chạy:  node tests/kiem-khop.mjs   — thoát mã 1 nếu bất kỳ phép kiểm nào TRƯỢT.
 * Không có ngẫu nhiên: toàn bộ đầu vào là TÊN FILE, kiểm được tất định.
 *
 * Liệu kiểm lấy từ TÊN THẬT trên ổ của anh Tiến (G:\Quay PV tuyen dung_DRT_0902)
 * và bộ liệu tổng hợp podcast-lieu — không bịa mẫu cho dễ đậu (bài học 5h).
 *
 * Kiểm cái gì:
 *  1. Hai buổi PV thật: đúng cặp, đúng tên người, nhận ra cam toàn cảnh,
 *     loại đúng 3 track tiếng đi kèm cam.
 *  2. camA/micA — tên chỉ khác nhau một CHỮ CÁI vẫn ghép đúng.
 *  3. Tên có dấu: giữ nguyên "Thiện"/"Trọng" khi đặt tên người.
 *  4. ☠️ "Cẩm" là TÊN NGƯỜI, không được coi là chữ "cam" vai trò.
 *  5. Tên không nói gì (C4026 / ZOOM0001) → phải nhận là ĐOÁN ('thu-tu'),
 *     không được giả vờ chắc.
 *  6. Bẫy token phổ biến: "Buoi1" không được kéo cam "Cam1_ToanCanh" đi.
 *  7. Cặp mơ hồ (hai người trùng tên, phân biệt bằng số) vẫn ghép đúng.
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const AiOKhop = require('../dist/khop.js')

let dat = 0, truot = 0
function cham(ten, ok, chiTiet) {
  console.log(`  ${ok ? 'DAT  ' : 'TRUOT'} ${ten}${chiTiet ? ' — ' + chiTiet : ''}`)
  if (ok) dat++; else truot++
}
/** Dựng đầu vào kiểu panel: cam trên V, tiếng cam + mic trên A. */
function dungVao(camTen, micTen, { tiengCam = true } = {}) {
  const cams = camTen.map((t, i) => ({ k: 'V' + i, ten: t, duong: 'X:/q/' + t }))
  const tiengs = []
  if (tiengCam) camTen.forEach((t, i) => tiengs.push({ k: 'A' + i, ten: t, duong: 'X:/q/' + t }))
  const d = tiengs.length
  micTen.forEach((t, i) => tiengs.push({ k: 'A' + (d + i), ten: t, duong: 'X:/a/' + t }))
  return { cams, tiengs }
}
function capCua(kq, camK) { return kq.cap.filter((c) => c.camK === camK)[0] || null }

console.log('── 1. LIEU THAT: hai buoi PV cua anh Tien ──')
{
  const b1 = dungVao(
    ['Cam1_ToanCanh_C4025.MP4', 'Cam2_Thien_C4233.MP4', 'Cam3_Trong_C4087.MP4'],
    ['Mic_Thien_Buoi1.mp3', 'Mic_Trong_Buoi1.mp3'])
  const k1 = AiOKhop.khopBanDo(b1.cams, b1.tiengs)
  cham('B1 loai dung 3 track tieng di kem cam', k1.tiengCam.length === 3, k1.tiengCam.join(','))
  cham('B1 nhan ra cam toan canh = V0', k1.camChung === 'V0', String(k1.camChung))
  const c2 = capCua(k1, 'V1'), c3 = capCua(k1, 'V2')
  cham('B1 Cam2_Thien -> Mic_Thien (A3), nguon=ten',
    c2 && c2.micK === 'A3' && c2.nguon === 'ten', c2 && `${c2.micK} ${c2.nguon} diem=${c2.diem.toFixed(2)} bien=${c2.bien.toFixed(2)}`)
  cham('B1 dat ten nguoi = "Thien"', c2 && c2.ten === 'Thien', c2 && c2.ten)
  cham('B1 Cam3_Trong -> Mic_Trong (A4), ten="Trong"',
    c3 && c3.micK === 'A4' && c3.ten === 'Trong' && c3.nguon === 'ten', c3 && `${c3.micK} ${c3.ten}`)

  const b2 = dungVao(
    ['Cam1_ToanCanh_C4026.MP4', 'Cam2_Trong_C4234.MP4', 'Cam3_Dilys_C4089.MP4'],
    ['Mic_Dilys_Buoi2.mp3', 'Mic_Trong_Buoi2.mp3'])
  const k2 = AiOKhop.khopBanDo(b2.cams, b2.tiengs)
  const d2 = capCua(k2, 'V1'), d3 = capCua(k2, 'V2')
  cham('B2 cam toan canh = V0', k2.camChung === 'V0', String(k2.camChung))
  cham('B2 Cam2_Trong -> Mic_Trong (A4) ten="Trong"',
    d2 && d2.micK === 'A4' && d2.ten === 'Trong', d2 && `${d2.micK} ${d2.ten}`)
  cham('B2 Cam3_Dilys -> Mic_Dilys (A3) ten="Dilys"',
    d3 && d3.micK === 'A3' && d3.ten === 'Dilys', d3 && `${d3.micK} ${d3.ten}`)
  cham('B2 khong con cam/mic thua', k2.camThua.length === 0 && k2.micThua.length === 0)
}

console.log('── 2. camA/micA — khac nhau DUNG mot chu cai ──')
{
  const v = dungVao(['camA.mp4', 'camB.mp4'], ['micA.wav', 'micB.wav'])
  const k = AiOKhop.khopBanDo(v.cams, v.tiengs)
  const a = capCua(k, 'V0'), b = capCua(k, 'V1')
  cham('camA -> micA (A2), nguon=ten', a && a.micK === 'A2' && a.nguon === 'ten',
    a && `${a.micK} diem=${a.diem.toFixed(2)} bien=${a.bien.toFixed(2)}`)
  cham('camB -> micB (A3)', b && b.micK === 'A3', b && b.micK)
  cham('ten nguoi = "A" / "B"', a && b && a.ten === 'A' && b.ten === 'B', a && b && `${a.ten}/${b.ten}`)
}

console.log('── 3. Ten CO DAU giu nguyen khi dat ten nguoi ──')
{
  const v = dungVao(['Cam_Thiện.mp4', 'Cam_Trọng.mp4'], ['Mic_Thiện.wav', 'Mic_Trọng.wav'])
  const k = AiOKhop.khopBanDo(v.cams, v.tiengs)
  const a = capCua(k, 'V0'), b = capCua(k, 'V1')
  cham('ghep dung cap', a && b && a.micK === 'A2' && b.micK === 'A3', a && b && `${a.micK}/${b.micK}`)
  cham('ten giu dau: "Thiện" / "Trọng"', a && b && a.ten === 'Thiện' && b.ten === 'Trọng',
    a && b && `${a.ten}/${b.ten}`)
}

console.log('── 4. ☠️ "Cẩm" la TEN NGUOI, khong phai chu "cam" vai tro ──')
{
  const v = dungVao(['Cam_Cẩm.mp4', 'Cam_Dũng.mp4'], ['Mic_Cẩm.wav', 'Mic_Dũng.wav'])
  const k = AiOKhop.khopBanDo(v.cams, v.tiengs)
  const a = capCua(k, 'V0'), b = capCua(k, 'V1')
  cham('Cam_Cẩm -> Mic_Cẩm, ten="Cẩm"', a && a.micK === 'A2' && a.ten === 'Cẩm' && a.nguon === 'ten',
    a && `${a.micK} ${a.ten} ${a.nguon}`)
  cham('Cam_Dũng -> Mic_Dũng, ten="Dũng"', b && b.micK === 'A3' && b.ten === 'Dũng',
    b && `${b.micK} ${b.ten}`)
}

console.log('── 5. Ten KHONG noi gi -> phai bao la DOAN, khong gia vo chac ──')
{
  const v = dungVao(['C4026.MP4', 'C4234.MP4'], ['ZOOM0001.WAV', 'ZOOM0002.WAV'])
  const k = AiOKhop.khopBanDo(v.cams, v.tiengs)
  cham('ca hai cap deu nguon="thu-tu"', k.cap.length === 2 && k.cap.every((c) => c.nguon === 'thu-tu'),
    k.cap.map((c) => `${c.camK}->${c.micK}:${c.nguon}`).join(' '))
  cham('van ghep theo thu tu track (V0->A2, V1->A3)',
    k.cap[0].micK === 'A2' && k.cap[1].micK === 'A3')
  // Ten con lai chi la SO ("0001") thi tra rong de panel danh "Nguoi 1" —
  // do tren panel 05/08: de nguyen thi hang track hien ten nguoi la "0001".
  cham('ten nguoi de RONG khi token rieng chi la so',
    k.cap.every((c) => c.ten === ''), k.cap.map((c) => `"${c.ten}"`).join(' '))
}

console.log('── 6. Bay token pho bien: "Buoi1" khong duoc keo "Cam1_ToanCanh" ──')
{
  // Neu khong co trong so IDF, token "1" se ghep Cam1 voi Mic..Buoi1
  const v = dungVao(['Cam1_ToanCanh.mp4', 'Cam2_Thien.mp4'], ['Mic_Thien_Buoi1.wav'])
  const k = AiOKhop.khopBanDo(v.cams, v.tiengs)
  const c1 = capCua(k, 'V0'), c2 = capCua(k, 'V1')
  cham('Cam2_Thien lay mic (khong phai Cam1)', c2 && c2.micK === 'A2' && c2.nguon === 'ten',
    c2 && `${c2.micK} ${c2.nguon}`)
  cham('Cam1_ToanCanh -> cam chung, khong ghep mic', k.camChung === 'V0' && !c1,
    `camChung=${k.camChung} cap1=${c1 ? c1.micK : 'khong'}`)
}

console.log('── 7. Trung ten, phan biet bang so ──')
{
  const v = dungVao(['Cam_Trong_1.mp4', 'Cam_Trong_2.mp4'], ['Mic_Trong_1.wav', 'Mic_Trong_2.wav'])
  const k = AiOKhop.khopBanDo(v.cams, v.tiengs)
  const a = capCua(k, 'V0'), b = capCua(k, 'V1')
  cham('ghep dung theo so', a && b && a.micK === 'A2' && b.micK === 'A3' &&
    a.nguon === 'ten' && b.nguon === 'ten', a && b && `${a.micK}/${b.micK}`)
}

console.log('── 8. tachToken / laCamChung ──')
{
  const t = AiOKhop.tachToken('Cam2_Thiện_C4233.MP4')
  cham('tach "Cam2_Thiện_C4233.MP4"', t.ds.join('|') === 'cam|2|thien|c|4233', t.ds.join('|'))
  cham('goc giu dau', t.goc.join('|') === 'Cam|2|Thiện|C|4233', t.goc.join('|'))
  cham('bo duoi .aio-mono.wav', AiOKhop.tachToken('micA.aio-mono.wav').ds.join('|') === 'mic|a',
    AiOKhop.tachToken('micA.aio-mono.wav').ds.join('|'))
  cham('nhan duong dan day du', AiOKhop.tachToken('G:/q/Cam1_Wide.MP4').ds.join('|') === 'cam|1|wide')
  cham('laCamChung("Cam1_ToanCanh_C4025.MP4")', AiOKhop.laCamChung('Cam1_ToanCanh_C4025.MP4') === 'toancanh')
  cham('laCamChung("Cam2_Thien.mp4") = rong', AiOKhop.laCamChung('Cam2_Thien.mp4') === '')
}

console.log('── 9. phanNhomVaSapXepTrack — keo don clip tren V0/A0 ──')
{
  const testInput = {
    video: [
      { trackIdx: 0, clipIdx: 0, ten: 'Cam1_ToanCanh_C4089.mp4', duong: 'X:/q/Cam1_ToanCanh_C4089.mp4', batDau: 0, inPoint: 0, ketThuc: 10 },
      { trackIdx: 0, clipIdx: 1, ten: 'Cam2_Trong_C4234.mp4', duong: 'X:/q/Cam2_Trong_C4234.mp4', batDau: 10, inPoint: 0, ketThuc: 10 },
      { trackIdx: 0, clipIdx: 2, ten: 'Cam3_Dilys_C4090.mp4', duong: 'X:/q/Cam3_Dilys_C4090.mp4', batDau: 20, inPoint: 0, ketThuc: 10 }
    ],
    audio: [
      { trackIdx: 0, clipIdx: 0, ten: 'Cam1_ToanCanh_C4089.mp4', duong: 'X:/q/Cam1_ToanCanh_C4089.mp4', batDau: 0, inPoint: 0, ketThuc: 10 },
      { trackIdx: 0, clipIdx: 1, ten: 'Mic_Dilys_Buoi2.mp3', duong: 'X:/a/Mic_Dilys_Buoi2.mp3', batDau: 0, inPoint: 0, ketThuc: 30 },
      { trackIdx: 0, clipIdx: 2, ten: 'Mic_Trong_Buoi2.mp3', duong: 'X:/a/Mic_Trong_Buoi2.mp3', batDau: 0, inPoint: 0, ketThuc: 30 }
    ]
  }
  const res = AiOKhop.phanNhomVaSapXepTrack(testInput)
  cham('Nhan dien dung 3 nhom cam', res.dsCamKeys.length === 3, res.dsCamKeys.join(','))
  cham('Wide nam cuoi nhom cam', res.dsCamKeys[2] === 'wide', res.dsCamKeys[2])
  cham('Nhan dien dung 2 mic roi', res.dsMicKeys.length === 2, res.dsMicKeys.join(','))
  cham('Chuoi lenh xep khong rong', res.lenhXepStr.length > 0, res.lenhXepStr)
}

console.log(`\n>>> ${truot === 0 ? 'TAT CA DAT' : 'CO PHEP KIEM TRUOT'} (${dat} dat / ${truot} truot)`)
process.exit(truot === 0 ? 0 : 1)
