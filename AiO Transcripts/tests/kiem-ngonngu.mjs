/**
 * kiem-ngonngu.mjs — kiểm phần ĐA NGÔN NGỮ (bản 2.3.0).
 *
 * ☠️ Vì sao phải có bộ này: anh Tiến chốt 30/07 dùng `-l auto`, nên panel có thể
 * nhận về BẤT KỲ thứ tiếng nào trong 99 thứ Whisper nghe được. Ba thứ dễ hỏng
 * thầm mà chạy vẫn ra kết quả trông đúng:
 *
 *   1. Chữ Trung/Nhật/Hàn rộng **2,16×** Latin (đo trên DOM 30/07) — đếm ký tự
 *      thì dòng 42 "ký tự" tiếng Nhật rộng gấp đôi khung, tràn mép MẤT CHỮ.
 *   2. Tiếng Trung/Nhật **không có khoảng trắng giữa từ** — cả câu là MỘT "từ",
 *      nên hàm cắt-theo-từ nhận nguyên câu rồi để tràn toàn bộ.
 *   3. `tuToiDa` (trần từ cho video dọc) **vô nghĩa** với CJK: đếm "từ" ra đúng
 *      1, ràng buộc thành vô hiệu mà không ai thấy.
 *
 * Chạy:  node tests/kiem-ngonngu.mjs
 */

import { readFileSync, existsSync } from 'node:fs'

// ☠️ `new URL(..., import.meta.url)` ĐÃ là file URL và đã percent-encode dấu
// cách trong đường dẫn ("AiO Studio" -> "AiO%20Studio"). Đưa `.pathname` của nó
// qua `pathToFileURL` là **mã hoá lần thứ hai** -> `%2520` -> không tìm thấy
// file. Import thẳng bằng `.href`.
const GOC = new URL('./js/srt.js', import.meta.url)
if (!existsSync(GOC)) {
  console.error('Chua bien dich. Chay truoc: cd client && npm run kiem')
  process.exit(1)
}
const {
  doRong,
  nhomNgonNgu,
  gioiHanTheoKhung,
  GIOI_HAN_NGANG,
  GIOI_HAN_DOC,
  GIOI_HAN_CJK_NGANG,
  GIOI_HAN_CJK_DOC,
  catCauDai,
  xuongDong,
} = await import(GOC.href)

let dat = 0
let hong = 0
const loi = []

function kiem(ten, thuc, mong) {
  const ok = JSON.stringify(thuc) === JSON.stringify(mong)
  if (ok) dat++
  else {
    hong++
    loi.push(`  ${ten}\n     mong doi: ${JSON.stringify(mong)}\n     thuc te : ${JSON.stringify(thuc)}`)
  }
}
const nhom = (t) => console.log(`\n=== ${t} ===`)

/* ══════════════════════════════════════════════════════════════════════════
   1. ĐỘ RỘNG HIỂN THỊ
   ══════════════════════════════════════════════════════════════════════════ */
nhom('1. Do rong hien thi')

kiem('Latin: 1 don vi moi ky tu', doRong('abcde'), 5)
kiem('Viet co dau: van 1 don vi', doRong('nguyễn'), 6)
kiem('Trung: 2 don vi moi ky tu', doRong('中文字幕'), 8)
kiem('Nhat hiragana', doRong('これは'), 6)
kiem('Nhat kanji', doRong('日本語'), 6)
kiem('Han (Hangul)', doRong('한국어'), 6)
// "AI" = 2 ky tu (khong phai 3 — ca thu ban dau tinh sai, bo do dung).
kiem('Tron Latin + CJK', doRong('AI 字幕'), 2 + 1 + 4)
kiem('Chuoi rong', doRong(''), 0)
// Thai KHONG phai full-width — chu hep gan bang Latin (do duoc 0,94x)
kiem('Thai: 1 don vi (khong phai full-width)', doRong('ไทย'), 3)

/* ══════════════════════════════════════════════════════════════════════════
   2. NHÓM NGÔN NGỮ
   ══════════════════════════════════════════════════════════════════════════ */
nhom('2. Nhom ngon ngu')

for (const ma of ['zh', 'ja', 'ko', 'yue']) kiem(`${ma} -> cjk`, nhomNgonNgu(ma), 'cjk')
for (const ma of ['vi', 'en', 'th', 'es', 'ar', 'id', ''])
  kiem(`${ma || '(rong)'} -> khac`, nhomNgonNgu(ma), 'khac')
kiem('Chu hoa van nhan ra', nhomNgonNgu('JA'), 'cjk')
kiem('Ma la -> khac (khong doan)', nhomNgonNgu('sw'), 'khac')

/* ══════════════════════════════════════════════════════════════════════════
   3. CHỌN BỘ GIỚI HẠN — 4 tổ hợp
   ══════════════════════════════════════════════════════════════════════════ */
nhom('3. Chon bo gioi han')

kiem('vi + ngang', gioiHanTheoKhung('ngang', 'vi'), GIOI_HAN_NGANG)
kiem('vi + doc', gioiHanTheoKhung('doc', 'vi'), GIOI_HAN_DOC)
kiem('ja + ngang', gioiHanTheoKhung('ngang', 'ja'), GIOI_HAN_CJK_NGANG)
kiem('ja + doc', gioiHanTheoKhung('doc', 'ja'), GIOI_HAN_CJK_DOC)
kiem('khong biet ngon ngu -> bo Latin', gioiHanTheoKhung('ngang', ''), GIOI_HAN_NGANG)
// CJK khong duoc dat tuToiDa: dem "tu" ra 1 nen rang buoc thanh vo hieu
kiem('CJK ngang KHONG co tuToiDa', GIOI_HAN_CJK_NGANG.tuToiDa, undefined)
kiem('CJK doc KHONG co tuToiDa', GIOI_HAN_CJK_DOC.tuToiDa, undefined)
kiem('Latin doc CO tuToiDa', GIOI_HAN_DOC.tuToiDa, 6)

/* ══════════════════════════════════════════════════════════════════════════
   4. ☠️ CÂU CJK DÀI, KHÔNG CÓ KHOẢNG TRẮNG — ca dễ hỏng nhất
   ══════════════════════════════════════════════════════════════════════════ */
nhom('4. Cau CJK dai khong co khoang trang')

// 40 ky tu Nhat = 80 don vi, gap 2,5 lan tran 32 -> BUOC phai cat ra
const nhatDai = 'これは日本語の字幕のテストです'.repeat(3) // 45 ky tu
const cauNhat = { tu: 0, den: 12, chu: nhatDai }

const raNhat = catCauDai(cauNhat, GIOI_HAN_CJK_NGANG)
kiem('Cat ra nhieu khoi (khong de nguyen 1 khoi)', raNhat.length > 1, true)

let vuotNhat = 0
let dongVuotNhat = 0
let rongNhat = 0
for (const k of raNhat) {
  const dong = xuongDong(k.chu, GIOI_HAN_CJK_NGANG)
  if (dong.length > GIOI_HAN_CJK_NGANG.soDongToiDa) dongVuotNhat++
  for (const d of dong) {
    const r = doRong(d)
    rongNhat = Math.max(rongNhat, r)
    if (r > GIOI_HAN_CJK_NGANG.kyTuMoiDong) vuotNhat++
  }
}
console.log(`  -> ${raNhat.length} khoi · dong rong nhat ${rongNhat}/32 don vi`)
kiem('KHONG dong nao vuot 32 don vi', vuotNhat, 0)
kiem('KHONG khoi nao vuot 2 dong', dongVuotNhat, 0)

// Khong mat chu
const ghepNhat = raNhat.map((k) => k.chu).join('')
kiem('KHONG MAT CHU (ghep lai bang goc)', ghepNhat.replace(/\s/g, ''), nhatDai.replace(/\s/g, ''))

/* ── Cùng câu đó nhưng dùng SAI bộ Latin -> phải thấy nó TRÀN ────────────
   Đây là phép đo chứng minh vì sao cần bộ CJK riêng. Nếu ca này KHÔNG tràn
   thì nghĩa là bộ CJK vô ích, và phải xem lại. */
const raSai = catCauDai(cauNhat, GIOI_HAN_NGANG)
let rongSai = 0
for (const k of raSai) for (const d of xuongDong(k.chu, GIOI_HAN_NGANG)) rongSai = Math.max(rongSai, doRong(d))
console.log(`  -> dung SAI bo Latin: dong rong nhat ${rongSai} don vi (tran khung 42)`)
kiem('Dung bo Latin cho tieng Nhat -> dong rong hon bo CJK', rongSai > rongNhat, true)

/* ══════════════════════════════════════════════════════════════════════════
   5. KHUNG DỌC + CJK
   ══════════════════════════════════════════════════════════════════════════ */
nhom('5. Khung doc + CJK')

const raNhatDoc = catCauDai(cauNhat, GIOI_HAN_CJK_DOC)
let vuotDoc = 0
let rongDoc = 0
for (const k of raNhatDoc) {
  const dong = xuongDong(k.chu, GIOI_HAN_CJK_DOC)
  for (const d of dong) {
    rongDoc = Math.max(rongDoc, doRong(d))
    if (doRong(d) > GIOI_HAN_CJK_DOC.kyTuMoiDong) vuotDoc++
  }
}
console.log(`  -> ${raNhatDoc.length} khoi · dong rong nhat ${rongDoc}/16 don vi`)
kiem('Doc + CJK: khong vuot 16 don vi', vuotDoc, 0)
kiem('Doc chia nhieu khoi hon ngang', raNhatDoc.length >= raNhat.length, true)

/* ══════════════════════════════════════════════════════════════════════════
   6. TIẾNG VIỆT KHÔNG BỊ ẢNH HƯỞNG — do tren du lieu THAT
   ══════════════════════════════════════════════════════════════════════════
   Bai hoc 5h: phep do phai chay tren du lieu THAT do chinh san pham sinh ra. */
nhom('6. Tieng Viet KHONG bi anh huong (du lieu that)')

const SRT = 'E:/2026/Thinksmart/Video/Resize/Agent/STRESS-1tieng-autocut-200314.srt'
if (existsSync(SRT)) {
  const cau = []
  for (const k of readFileSync(SRT, 'utf8').replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const d = k.split('\n').filter((x) => x.trim())
    if (d.length < 2) continue
    const m = /(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)/.exec(d[1] ?? '')
    if (!m) continue
    const g = (h, p, s, ms) => +h * 3600 + +p * 60 + +s + +ms / 1000
    const chu = d.slice(2).join(' ').trim()
    if (chu) cau.push({ tu: g(m[1], m[2], m[3], m[4]), den: g(m[5], m[6], m[7], m[8]), chu })
  }
  const goc = cau.map((c) => c.chu).join(' ').replace(/\s/g, '').length
  const ra = []
  for (const c of cau) ra.push(...catCauDai(c, GIOI_HAN_NGANG))
  let vuot = 0
  let dai = 0
  for (const k of ra)
    for (const d of xuongDong(k.chu, GIOI_HAN_NGANG)) {
      dai = Math.max(dai, doRong(d))
      if (doRong(d) > 42) vuot++
    }
  const sau = ra.map((k) => k.chu).join(' ').replace(/\s/g, '').length
  console.log(`  -> ${cau.length} khoi that -> ${ra.length} khoi · dong rong nhat ${dai}/42`)
  kiem('Tieng Viet: 0 dong vuot 42', vuot, 0)
  kiem('Tieng Viet: 0 mat chu', goc - sau, 0)
} else {
  console.log(`  (bo qua: khong thay ${SRT})`)
}

/* ══════════════════════════════════════════════════════════════════════════ */
console.log(`\n${'='.repeat(60)}`)
if (hong) {
  console.log(`KET QUA: ${dat} DAT / ${hong} HONG\n`)
  console.log(loi.join('\n'))
  process.exit(1)
} else {
  console.log(`KET QUA: ${dat}/${dat} DAT`)
}
