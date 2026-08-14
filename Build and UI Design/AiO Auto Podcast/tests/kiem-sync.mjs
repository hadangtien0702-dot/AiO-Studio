/**
 * kiem-sync.mjs — bộ tự kiểm của sync.js (tự sync mic).
 *
 * Chạy:  node tests/kiem-sync.mjs   — thoát mã 1 nếu bất kỳ phép kiểm nào TRƯỢT.
 * Ngẫu nhiên có SEED — hai lần chạy ra đúng một kết quả.
 *
 * Kiểm cái gì:
 *  1. Offset dương/âm/0 được tìm lại đúng ±1 cửa sổ (20ms) trên liệu tổng
 *     hợp giống-tiếng-nói (bursts + im lặng) có nhiễu và gain khác nhau.
 *  2. Hai tín hiệu KHÔNG liên quan → tinCay=false (chốt hai-nửa bắt được),
 *     KHÔNG trả mốc bậy.
 *  3. viTriDat: đủ 3 ca — đặt thẳng, cắt đầu, cam có inPoint.
 *  4. Quy ước dấu khớp ca THẬT 04/08: cam đặt 0, mic bấm ghi trước 1,168s
 *     → phải ra catDau=1,168 (đúng bài đã vấp).
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const AiOSync = require('../dist/sync.js')

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CUA = 0.02
let dat = 0, truot = 0
function cham(ten, ok, chiTiet) {
  console.log(`  ${ok ? 'DAT  ' : 'TRUOT'} ${ten}${chiTiet ? ' — ' + chiTiet : ''}`)
  if (ok) dat++; else truot++
}

/**
 * Sinh đường bao dB giống tiếng nói: các "câu" 1–4s xen im lặng 0,5–2s.
 * Trả Float32Array dB theo cửa sổ 20ms, dài `giay` giây.
 */
function sinhTiengNoi(rng, giay) {
  const n = Math.round(giay / CUA)
  const db = new Float32Array(n).fill(-65)
  let i = 0
  while (i < n) {
    const nghi = Math.round((0.5 + rng() * 1.5) / CUA)
    i += nghi
    const cau = Math.round((1 + rng() * 3) / CUA)
    for (let j = 0; j < cau && i + j < n; j++) {
      // âm tiết nhấp nhô quanh -35, đáy -50
      db[i + j] = -35 + Math.sin(j * 0.9 + rng() * 3) * 8 - rng() * 7
    }
    i += cau
  }
  return db
}

/** Lấy "bản thu" từ nguồn: dịch offsetGiay theo quy ước mic = cam + L, thêm nhiễu + gain. */
function banThu(rng, nguon, offsetGiay, gainDb, nhieuDb, daiGiay) {
  const lech = Math.round(offsetGiay / CUA)
  const n = Math.round(daiGiay / CUA)
  const ra = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    // mic_file_time = cam_file_time + L → mẫu i của mic ứng mẫu (i − lech) của nguồn
    const g = i - lech
    const goc = g >= 0 && g < nguon.length ? nguon[g] : -65
    ra[i] = goc + gainDb + (rng() * 2 - 1) * nhieuDb
  }
  return ra
}

console.log('── 1. Tim lai offset da biet (lieu giong tieng noi, nhieu + gain khac) ──')
{
  const rng = mulberry32(20260804)
  const nguon = sinhTiengNoi(rng, 300) // 5 phút
  for (const L of [58.34, -12.02, 0, 1.168]) {
    const cam = banThu(rng, nguon, 0, 0, 1.5, 300)
    const mic = banThu(rng, nguon, L, -9, 2.5, 300)
    const kq = AiOSync.timOffset(cam, mic, { quetGiay: 120 })
    const lech = Math.abs(kq.offsetGiay - L)
    cham(`L=${L}s -> do ra ${kq.offsetGiay.toFixed(3)}s (r=${kq.r.toFixed(3)})`,
      kq.tinCay && lech <= CUA + 1e-9, `lech ${lech.toFixed(4)}s`)
  }
}

console.log('── 2. Khong lien quan -> phai TU CHOI, khong doan bay ──')
{
  const rngA = mulberry32(111)
  const rngB = mulberry32(999)
  const cam = sinhTiengNoi(rngA, 300)
  const mic = sinhTiengNoi(rngB, 300)
  const kq = AiOSync.timOffset(cam, mic, { quetGiay: 120 })
  cham(`hai nguon doc lap -> tinCay=false (viSao=${kq.viSao || 'rong'})`, !kq.tinCay)
}

console.log('── 3. viTriDat — toan dat/cat dau ──')
{
  const a = AiOSync.viTriDat(5, 0, 2)      // moc 5-0-2 = 3 -> dat tai 3
  cham('S=5 I=0 L=2 -> dat 3.0, khong cat', a.viTriGiay === 3 && a.catDauGiay === 0)
  const b = AiOSync.viTriDat(0, 0, 1.168)  // ca THAT 04/08
  cham('ca that: S=0 I=0 L=1.168 -> dat 0, CAT DAU 1.168',
    b.viTriGiay === 0 && Math.abs(b.catDauGiay - 1.168) < 1e-9)
  const c = AiOSync.viTriDat(10, 4, 2)     // cam co inPoint: 10-4-2 = 4
  cham('S=10 I=4 L=2 -> dat 4.0', c.viTriGiay === 4 && c.catDauGiay === 0)
}

console.log('── 4. p50 chon cam moc — loai cam cam ──')
{
  const rng = mulberry32(7)
  const khoe = sinhTiengNoi(rng, 120)
  const cam = new Float32Array(khoe.length).fill(-76) // cam chet kieu C4234
  const ok = AiOSync.p50(khoe) > -60 && AiOSync.p50(cam) < -70
  cham(`p50 khoe=${AiOSync.p50(khoe).toFixed(1)} vs chet=${AiOSync.p50(cam).toFixed(1)}`, ok)
}

console.log(`\n>>> ${truot === 0 ? 'TAT CA DAT' : 'CO PHEP KIEM TRUOT'} (${dat} dat / ${truot} truot)`)
process.exit(truot === 0 ? 0 : 1)
