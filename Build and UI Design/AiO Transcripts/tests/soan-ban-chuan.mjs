/**
 * soan-ban-chuan.mjs — soạn BẢN NHÁP để anh Tiến soát bằng tai.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO KHÔNG LẤY THẲNG BẢN MÁY LÀM CHUẨN
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Lấy bản Whisper chép làm "bản chuẩn" rồi đem chấm chính Whisper là đúng cái
 * bẫy 5d: **thước làm bằng cùng vật liệu với cái nó đo**. Nó sẽ luôn ra 100%.
 *
 * Nên file này KHÔNG sinh ra bản chuẩn. Nó sinh ra bản NHÁP + chỉ đúng những
 * chỗ đáng nghe lại, để rút công soát từ "nghe hết" xuống "nghe vài chỗ".
 * Bản chuẩn chỉ thành chuẩn **sau khi tai người đã duyệt**.
 *
 * Hai tín hiệu chỉ chỗ đáng ngờ, và chúng ĐỘC LẬP nhau:
 *   1. Hai mô hình chép KHÁC nhau  -> mô hình kia không tham gia quyết định
 *      của mô hình này, nên đây là tín hiệu từ ngoài.
 *   2. Điểm tin cậy thấp           -> máy tự khai, tín hiệu từ trong.
 * Chỗ dính CẢ HAI là chỗ gần như chắc chắn có vấn đề.
 *
 * Chạy:  node tests/soan-ban-chuan.mjs <ten>
 *        (đọc tests/du-lieu/chuan/<ten>.turbo.json và <ten>.v3.json)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { boTiengViet, danhSachSai, doWer } from './wer.mjs'

const ten = process.argv[2]
if (!ten) {
  console.error('Thieu ten. Vi du: node tests/soan-ban-chuan.mjs tin5')
  process.exit(1)
}

const THU_MUC = new URL('./du-lieu/chuan/', import.meta.url)
const duong = (h) => new URL(`${ten}.${h}`, THU_MUC)

/** Đọc JSON đầy đủ của whisper.cpp thành câu + từ kèm điểm tin cậy. */
function docJson(p) {
  const j = JSON.parse(readFileSync(p, 'utf8'))
  const cau = []
  const tu = []
  for (const seg of j?.transcription ?? []) {
    const tuGiay = (seg?.offsets?.from ?? 0) / 1000
    const denGiay = (seg?.offsets?.to ?? 0) / 1000
    const chu = String(seg?.text ?? '').trim()
    if (chu && denGiay > tuGiay) cau.push({ tu: tuGiay, den: denGiay, chu })
    let cur = null
    for (const t of seg?.tokens ?? []) {
      const s = String(t?.text ?? '')
      if (!s || s.startsWith('[_')) continue
      const p_ = typeof t?.p === 'number' ? t.p : 1
      if (s.startsWith(' ') || !cur) {
        if (cur) tu.push(cur)
        cur = { chu: s.trim(), giay: (t?.offsets?.from ?? 0) / 1000, p: p_ }
      } else {
        cur.chu += s
        cur.p = Math.min(cur.p, p_)
      }
    }
    if (cur) tu.push(cur)
  }
  return { cau, tu }
}

const fTurbo = duong('turbo.json')
const fV3 = duong('v3.json')
for (const f of [fTurbo, fV3]) {
  if (!existsSync(f)) {
    console.error(`Khong thay ${f.pathname}`)
    process.exit(1)
  }
}

const turbo = docJson(fTurbo)
const v3 = docJson(fV3)

const chuTurbo = turbo.cau.map((c) => c.chu).join(' ')
const chuV3 = v3.cau.map((c) => c.chu).join(' ')

/* ── 1. HAI MÔ HÌNH KHÁC NHAU BAO NHIÊU ────────────────────────────────── */
// ⚠️ Con số này KHÔNG phải độ chính xác. Nó chỉ nói hai mô hình bất đồng bao
// nhiêu. Cả hai cùng sai một chỗ thì con số này vẫn đẹp.
const kq = doWer(chuV3, chuTurbo)
const amV3 = boTiengViet(chuV3).length
const amTurbo = boTiengViet(chuTurbo).length

console.log(`\n=== ${ten} ===`)
console.log(`  large-v3 : ${v3.cau.length} cau, ${amV3} am tiet`)
console.log(`  turbo    : ${turbo.cau.length} cau, ${amTurbo} am tiet`)
console.log(`  Hai mo hinh bat dong: ${(kq.wer * 100).toFixed(1)}% am tiet`)
console.log(`     thay ${kq.thay} - v3 co ma turbo mat ${kq.xoa} - turbo them ${kq.them}`)

/* ── 2. ĐIỂM TIN CẬY THẤP ──────────────────────────────────────────────── */
const NGUONG = 0.6
const tuNgo = turbo.tu.filter((t) => t.p < NGUONG)
console.log(`  Turbo tu khai khong chac: ${tuNgo.length}/${turbo.tu.length} tu (${((tuNgo.length / turbo.tu.length) * 100).toFixed(1)}%)`)

/* ── 3. SOẠN BẢN NHÁP ĐỂ SOÁT ──────────────────────────────────────────── */
// Đánh dấu ngay trên dòng: [?] = có từ máy tự khai không chắc.
// Anh Tiến sửa THẲNG vào cột chữ, không cần đụng mốc thời gian.
const mmss = (g) => {
  const p = Math.floor(g / 60)
  const s = g - p * 60
  return `${String(p).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`
}

const dong = []
dong.push('# BAN NHAP CHO SOAT - ' + ten)
dong.push('#')
dong.push('# CACH SOAT:')
dong.push('#   1. Mo file WAV cung ten, nghe theo moc thoi gian.')
dong.push('#   2. Sua THANG vao phan chu sau dau "|". Dung doi moc thoi gian.')
dong.push('#   3. Dong bat dau bang [?] la cho may TU KHAI khong chac - nghe ky.')
dong.push('#   4. Dong bat dau bang [!] la cho HAI MO HINH chep khac nhau - nghe ky hon.')
dong.push('#   5. Nghe ra gi thi ghi nay - ke ca noi lap, noi vap. Day la ban CHUAN.')
dong.push('#   6. Doan im lang hoac khong ro tieng nguoi noi: xoa han dong do.')
dong.push('#')
dong.push('# Luu lai thanh: ' + ten + '.chuan.txt')
dong.push('')

// Chỗ hai mô hình bất đồng, quy về mốc thời gian của turbo.
const capKhac = new Set()
for (const s of danhSachSai(kq)) {
  for (const w of boTiengViet(s.may)) capKhac.add(w)
}

let soNgo = 0
let soKhac = 0
for (const c of turbo.cau) {
  const tuTrong = turbo.tu.filter((t) => t.giay >= c.tu && t.giay < c.den)
  const coNgo = tuTrong.some((t) => t.p < NGUONG)
  const coKhac = boTiengViet(c.chu).some((w) => capKhac.has(w))
  if (coNgo) soNgo++
  if (coKhac) soKhac++
  const co = coKhac ? '[!]' : coNgo ? '[?]' : '   '
  dong.push(`${co} ${mmss(c.tu)} | ${c.chu}`)
}

const raNhap = new URL(`${ten}.nhap.txt`, THU_MUC)
writeFileSync(raNhap, dong.join('\r\n'), 'utf8')

/* ── 4. BẢN CHÉP CỦA v3 ĐỂ ĐỐI CHIẾU KHI SOÁT ──────────────────────────── */
const dongV3 = ['# Ban chep cua large-v3 - CHI DE DOI CHIEU khi phan van.', '']
for (const c of v3.cau) dongV3.push(`${mmss(c.tu)} | ${c.chu}`)
writeFileSync(new URL(`${ten}.v3.txt`, THU_MUC), dongV3.join('\r\n'), 'utf8')

console.log(`\n  Da soan: ${ten}.nhap.txt`)
console.log(`     ${turbo.cau.length} dong, trong do ${soKhac} dong [!] va ${soNgo} dong [?]`)
console.log(`     -> chi phai nghe ky ${new Set([soKhac, soNgo]).size ? soKhac + soNgo : 0} dong thay vi ca ${turbo.cau.length}`)
console.log(`  Doi chieu : ${ten}.v3.txt`)

/* ── 5. IN VÀI CHỖ BẤT ĐỒNG ĐỂ ĐỌC NGAY BẰNG MẮT ───────────────────────── */
// Bài học 5e: con số tổng che mất chuyện thật. Phải mở ra đọc.
const sai = danhSachSai(kq)
console.log(`\n  ${sai.length} cho hai mo hinh khac nhau. Muoi cho dau:`)
for (const s of sai.slice(0, 10)) {
  console.log(`     ...${s.truoc}  [ v3: "${s.chuan || '(khong co)'}"  |  turbo: "${s.may || '(bo mat)'}" ]  ${s.sau}...`)
}
