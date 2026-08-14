/**
 * kiem-wer.mjs — BỘ TỰ KIỂM CHO CHÍNH CÂY THƯỚC.
 *
 * ☠️ Bài học 29/07 (nguyên tắc 5): **số đo vô lý thì nghi CÔNG CỤ ĐO trước.**
 * Cây thước này sắp được dùng để phán "mô hình A tốt hơn mô hình B". Nếu bản
 * thân nó sai thì mọi kết luận sau đều sai, mà không ai biết.
 *
 * Nên trước khi đem chấm ai, nó phải qua được các ca **đã biết trước đáp án**.
 *
 * Chạy:  node tests/kiem-wer.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import {
  boTiengViet,
  capNhamHayGap,
  danhSachSai,
  doCer,
  docSo,
  doWer,
  LOAI,
} from './wer.mjs'

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

function kiemGan(ten, thuc, mong, saiSo = 1e-9) {
  const ok = Math.abs(thuc - mong) <= saiSo
  if (ok) dat++
  else {
    hong++
    loi.push(`  ${ten}\n     mong doi: ${mong}\n     thuc te : ${thuc}`)
  }
}

function nhom(ten) {
  console.log(`\n=== ${ten} ===`)
}

/* ══════════════════════════════════════════════════════════════════════════
   1. CHUẨN HOÁ — chỗ dễ tạo ra con số DỐI nhất
   ══════════════════════════════════════════════════════════════════════════ */
nhom('1. Chuan hoa')

// ☠️ CA QUAN TRỌNG NHẤT: cùng một chữ, hai cách mã hoá Unicode.
// Không xử lý thì bản chép ĐÚNG HOÀN TOÀN vẫn ra WER gần 100%.
const nfc = 'kiến thức bảo hiểm nhân thọ'.normalize('NFC')
const nfd = 'kiến thức bảo hiểm nhân thọ'.normalize('NFD')
kiem('NFC va NFD khac nhau o muc byte (neu khong thi ca thu nay vo nghia)', nfc === nfd, false)
kiemGan('NFC vs NFD -> WER phai bang 0', doWer(nfc, nfd).wer, 0)

kiemGan('Dau cau khong tinh la loi', doWer('xin chào, anh Tiến!', 'xin chào anh Tiến').wer, 0)
kiemGan('Hoa thuong khong tinh la loi', doWer('Bảo Hiểm Nhân Thọ', 'bảo hiểm nhân thọ').wer, 0)
kiemGan('Nhieu khoang trang khong tinh la loi', doWer('a  b   c', 'a b c').wer, 0)

kiem('Bo am tiet dung', boTiengViet('Bảo hiểm, 2 người.'), [
  'bảo', 'hiểm', 'hai', 'người',
])
kiem('Tat soThanhChu thi giu nguyen so', boTiengViet('có 2 người', { soThanhChu: false }), [
  'có', '2', 'người',
])

/* ══════════════════════════════════════════════════════════════════════════
   2. ĐỌC SỐ — bảng ca đã biết đáp án
   ══════════════════════════════════════════════════════════════════════════ */
nhom('2. Doc so')

kiem('0', docSo('0'), 'không')
kiem('5', docSo('5'), 'năm')
kiem('10', docSo('10'), 'mười')
kiem('21', docSo('21'), 'hai mươi một')
kiem('24', docSo('24'), 'hai mươi bốn')
kiem('100', docSo('100'), 'một trăm')
kiem('105', docSo('105'), 'một trăm linh năm')
// ☠️ Ca bat loi that trong ban dau: `if (nhom[i] === 0 && i > 0) continue`
// lam 1000 ra "mot nghin KHONG TRAM".
kiem('1000 (ca bat loi that)', docSo('1000'), 'một nghìn')
kiem('1024', docSo('1024'), 'một nghìn không trăm hai mươi bốn')
kiem('2024', docSo('2024'), 'hai nghìn không trăm hai mươi bốn')
kiem('1000000', docSo('1000000'), 'một triệu')
kiem('So qua lon -> tra rong', docSo('99999999999999'), '')

// Cố ý KHÔNG xử lý biến thể đọc: "mười lăm"/"hai mươi mốt"/"hai mươi tư".
// Ép cứng một cách đọc còn sai hơn để lệch 1 âm tiết. Ghi ra đây cho rõ là BIẾT.
kiem('15 ra "muoi nam" chu khong phai "muoi lam" (co y)', docSo('15'), 'mười năm')
kiemGan(
  'So <-> chu quy ve mot moi',
  doWer('năm 2024 có ba người', 'năm hai nghìn không trăm hai mươi bốn có ba người').wer,
  0,
)

/* ══════════════════════════════════════════════════════════════════════════
   3. ĐẾM LỖI — ca đã biết trước đáp án
   ══════════════════════════════════════════════════════════════════════════ */
nhom('3. Dem loi')

const muoi = 'một hai ba bốn năm sáu bảy tám chín mười'

kiemGan('Giong het -> WER 0', doWer(muoi, muoi).wer, 0)

// ☠️ Am tiet thay the phai la MOT am tiet, khong dau cau.
// Ban dau dung "MUOI_SAI": gach duoi nam trong bang dau cau nen bi tach thanh
// HAI am tiet -> ca thu bao [1,0,1] va WER 0,2. Bo do dung, CA THU sai.
// Dung bai hoc so 5: so do vo ly thi nghi CONG CU DO truoc.
const wThay = doWer(muoi, 'một hai ba bốn năm sáu bảy tám chín xyz')
kiem('Thay 1 tu: dem dung', [wThay.thay, wThay.xoa, wThay.them], [1, 0, 0])
kiemGan('Thay 1/10 -> WER 0,1', wThay.wer, 0.1)

const wXoa = doWer(muoi, 'một hai ba bốn năm sáu bảy tám chín')
kiem('Xoa 1 tu: dem dung', [wXoa.thay, wXoa.xoa, wXoa.them], [0, 1, 0])
kiemGan('Xoa 1/10 -> WER 0,1', wXoa.wer, 0.1)

// "mười một" la HAI am tiet trong tieng Viet, khong phai mot tu.
const wThem = doWer(muoi, muoi + ' xyz')
kiem('Them 1 tu: dem dung', [wThem.thay, wThem.xoa, wThem.them], [0, 0, 1])
kiemGan('Them 1/10 -> WER 0,1', wThem.wer, 0.1)

// Giu lai hai hanh vi vua phat hien, de sau nay ai doi bang dau cau thi biet ngay.
kiem('Gach duoi bi tach thanh hai am tiet', boTiengViet('MUOI_SAI'), ['muoi', 'sai'])
kiemGan('"muoi mot" la hai am tiet, khong phai mot', doWer(muoi, muoi + ' mười một').wer, 0.2)

// ☠️ WER VUOT 100% la CO THAT, khong phai loi tinh toan.
// Ngay 29/07 ban mac dinh bia 806 lan cung mot cau -> con so phai phan anh duoc.
const wBia = doWer('xin chào', 'xin chào ' + 'chú có quỷ đen không chú '.repeat(20))
kiem('May bia them -> WER phai vuot 100%', wBia.wer > 1, true)
kiemGan('Ban chuan van khop het (khong mat chu nao)', wBia.dung, 1)

kiem('Ca hai rong -> WER 0', doWer('', '').wer, 0)
kiem('Chuan rong ma may co chu -> Infinity', doWer('', 'abc').wer, Infinity)
kiemGan('May rong hoan toan -> WER 1 (mat sach)', doWer(muoi, '').wer, 1)

/* ══════════════════════════════════════════════════════════════════════════
   4. LẦN VẾT — con số tổng không đủ, phải ĐỌC ĐƯỢC BẰNG MẮT
   ══════════════════════════════════════════════════════════════════════════ */
nhom('4. Lan vet - doc duoc bang mat')

const wCho = doWer('quỹ bảo hiểm nhân thọ này', 'quỷ bảo hiểm nhân thọ này')
const sai = danhSachSai(wCho)
kiem('Chi ra dung 1 cho sai', sai.length, 1)
kiem('Chi dung cap chu bi nham', [sai[0].chuan, sai[0].may], ['quỹ', 'quỷ'])
kiem('Co chu quanh co de doc', sai[0].sau, 'bảo hiểm nhân')

// Số việc lần vết phải khớp với số đếm — nếu lệch là backtrace hỏng.
const tongDung = wCho.viec.filter((v) => v.loai === LOAI.DUNG).length
kiem(
  'Tong viec = dung + thay + xoa + them',
  wCho.viec.length,
  tongDung + wCho.thay + wCho.xoa + wCho.them,
)
kiem('Ghep lai phai ra dung ban chuan', wCho.viec.map((v) => v.chuan).filter(Boolean).join(' '), 'quỹ bảo hiểm nhân thọ này')
kiem('Ghep lai phai ra dung ban may', wCho.viec.map((v) => v.may).filter(Boolean).join(' '), 'quỷ bảo hiểm nhân thọ này')

// Cặp nhầm hay gặp — thứ đem nhét thẳng vào bảng "Sửa từ nghe nhầm" của panel.
const wLap = doWer(
  'quỹ này quỹ kia quỹ nọ và lợi suất cao',
  'quỷ này quỷ kia quỷ nọ và lợi suất cao',
)
const cap = capNhamHayGap(wLap)
kiem('Gom duoc cap nham hay gap', cap.length, 1)
kiem('Cap dung chieu: may nghe ra -> dung phai la', [cap[0].mayNgheRa, cap[0].dungPhaiLa, cap[0].soLan], ['quỷ', 'quỹ', 3])

/* ══════════════════════════════════════════════════════════════════════════
   5. CER — phân biệt SAI DẤU với NGHE HẲN RA CHỮ KHÁC
   ══════════════════════════════════════════════════════════════════════════ */
nhom('5. CER - phan biet loai loi')

const saiDau = doCer('quỹ', 'quỷ')
const saiHan = doCer('quỹ', 'nghiệp')
kiem('Sai dau: CER nho hon WER', saiDau.cer < doWer('quỹ', 'quỷ').wer, true)
kiem('Nghe han ra chu khac: CER lon hon sai dau', saiHan.cer > saiDau.cer, true)

/* ══════════════════════════════════════════════════════════════════════════
   6. QUY MÔ THẬT — mẫu nhỏ giấu lỗi rất giỏi (nguyên tắc 2b)
   ══════════════════════════════════════════════════════════════════════════

   5 phút  ~  1.500 am tiet ->   2,2 MB
   60 phút ~ 18.000 am tiet -> 324 MB   <- do that o day
*/
nhom('6. Quy mo that')

const VON = 'anh chị bảo hiểm nhân thọ quyền lợi hợp đồng khách hàng tư vấn'.split(' ')
function sinh(n, hat) {
  const ra = []
  let x = hat
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    ra.push(VON[x % VON.length])
  }
  return ra.join(' ')
}

const N_LON = 18000
const banLon = sinh(N_LON, 7)
// Bản "máy chép": sai khoảng 8% - giống mức một mô hình thật.
const boLon = banLon.split(' ')
for (let i = 0; i < boLon.length; i += 12) boLon[i] = 'SAI'
const banLonMay = boLon.join(' ')

const ram0 = process.memoryUsage().heapUsed
const t0 = Date.now()
const wLon = doWer(banLon, banLonMay, { soThanhChu: false })
const giay = (Date.now() - t0) / 1000
const ramMB = (process.memoryUsage().heapUsed - ram0) / 1048576

kiem(`${N_LON} am tiet: dem dung so cho da doi`, wLon.thay, Math.ceil(N_LON / 12))
kiemGan(`${N_LON} am tiet: WER dung`, wLon.wer, Math.ceil(N_LON / 12) / N_LON, 1e-9)
console.log(`  -> 18.000 am tiet (~60 phut): ${giay.toFixed(1)}s, RAM +${ramMB.toFixed(0)} MB`)
kiem('Chay duoi 60 giay', giay < 60, true)

// Vượt trần thì phải BÁO RÕ, không để Node chết câm vì hết bộ nhớ.
let baoLoi = ''
try {
  doWer(sinh(25000, 1), sinh(25000, 2), { soThanhChu: false })
} catch (e) {
  baoLoi = String(e.message)
}
kiem('Vuot tran -> bao loi ro rang', /qua dai|quá dài/i.test(baoLoi), true)

/* ══════════════════════════════════════════════════════════════════════════
   7. DỮ LIỆU THẬT — do chinh tool sinh ra, khong phai mau tu nghi
   ══════════════════════════════════════════════════════════════════════════

   Bài học 5h: **phép đo phải chạy trên dữ liệu THẬT do chính sản phẩm sinh
   ra**. Mẫu tự nghĩ chỉ chứng minh được cái mình đã nghĩ tới.
*/
nhom('7. Du lieu that')

function docSrt(noiDung) {
  const ra = []
  for (const k of noiDung.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const d = k.split('\n').filter((x) => x.trim() !== '')
    if (d.length < 2 || !/-->/.test(d[1] ?? '')) continue
    const chu = d.slice(2).join(' ').trim()
    if (chu) ra.push(chu)
  }
  return ra
}

const SRT_THAT = 'E:/2026/Thinksmart/Video/Resize/Agent/STRESS-1tieng-autocut-200314.srt'
if (existsSync(SRT_THAT)) {
  const cau = docSrt(readFileSync(SRT_THAT, 'utf8'))
  const chu = cau.join(' ')
  const am = boTiengViet(chu)
  console.log(`  -> file that: ${cau.length} khoi, ${am.length} am tiet`)
  kiem('File that co noi dung', cau.length > 0, true)
  kiemGan('Tu so voi chinh no -> WER 0', doWer(chu, chu).wer, 0)

  // Bỏ 1 trong 50 âm tiết -> WER phải đúng bằng tỉ lệ đã bỏ.
  const bo = am.filter((_, i) => i % 50 !== 0)
  const soBo = am.length - bo.length
  kiemGan('Bo 1/50 am tiet -> WER dung bang ti le da bo', doWer(chu, bo.join(' ')).wer, soBo / am.length, 1e-9)
} else {
  console.log(`  (bo qua: khong thay ${SRT_THAT})`)
}

/* ══════════════════════════════════════════════════════════════════════════ */
console.log(`\n${'='.repeat(60)}`)
if (hong) {
  console.log(`KET QUA: ${dat} DAT / ${hong} HONG\n`)
  console.log(loi.join('\n'))
  process.exit(1)
} else {
  console.log(`KET QUA: ${dat}/${dat} DAT - cay thuoc dung duoc`)
}
