'use strict'
/* Do 4 LUAT NHO tach tu main.js (src/luat-main.js) — chay: npm run test:luatmain. Node tran, khong cua so.
   Moi muc co DOI CHUNG: dung lai y nguyen cach lam CU (commit ab2a311) va cho thay no TRUOT cung phep do. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { console.log('LOI: ' + (e && e.stack)); process.exit(2) })
const path = require('path')
const ROOT = path.resolve(__dirname, '..', '..')
const L = require(path.join(ROOT, 'src', 'luat-main.js'))
const kq = []
let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')); if (!ok) dat = false }

// ---- Loi 4: doi ngon ngu khong duoc nap lai cua so AN xuat GIF / xuat video sua ----
const duocNapLaiCu = (url) => !/\/src\/(luong|dem|dien)\//.test(String(url || '').replace(/\\/g, '/'))
const U = (x) => 'file:///D:/Production/AiO%20Studio/Build%20and%20UI%20Design/AiO%20Shotandsave/src/' + x
const an = ['luong/index.html', 'dem/quay.html', 'dem/vien.html', 'dien/index.html', 'gif/index.html', 'sua-xuat/index.html']
const hien = ['khay/index.html', 'settings/index.html', 'shelf/index.html', 'pin/index.html', 'sua-video/index.html', 'canvas/index.html', 'overlay/index.html']
kiem('L4 cua so AN khong nap lai: luong, dem, dien, GIF, xuat video sua (6/6)', an.every((x) => L.duocNapLai(U(x)) === false), an.filter((x) => L.duocNapLai(U(x))).join(','))
kiem('L4 cua so co chu van nap lai de doi ngon ngu (7/7)', hien.every((x) => L.duocNapLai(U(x)) === true), hien.filter((x) => !L.duocNapLai(U(x))).join(','))
kiem('L4 duong dan Windows (gach nguoc) cung nhan ra', L.duocNapLai('file:///D:\\x\\src\\gif\\index.html') === false)
kiem('L4 (DOI CHUNG) luat CU nap lai cua so GIF + xuat video sua (loi that)', duocNapLaiCu(U('gif/index.html')) === true && duocNapLaiCu(U('sua-xuat/index.html')) === true)

// ---- Loi 5: phim chup khi dang quay Storyboard 3 giay ----
const qdCu = (t) => (t.ghiHinh ? 'dung-quay' : t.cuon ? 'dung-cuon' : 'tiep')
const bang = [
  [{ ghiHinh: true }, 'dung-quay'], [{ cuon: true }, 'dung-cuon'], [{ dangQuay: true }, 'bo-qua-quay3s'], [{}, 'tiep'],
  [{ ghiHinh: true, dangQuay: true }, 'dung-quay'], [{ cuon: true, dangQuay: true }, 'dung-cuon'], [{ ghiHinh: true, cuon: true }, 'dung-quay'],
]
kiem('L5 bang quyet dinh phim chup: dang quay video > chup cuon > quay 3 giay > chup binh thuong (7 to hop)', bang.every(([t, kv]) => L.quyetDinhPhimChup(t) === kv), bang.map(([t, kv]) => JSON.stringify(t) + '->' + L.quyetDinhPhimChup(t)).join(' '))
kiem('L5 (DOI CHUNG) luat CU: dang quay Storyboard 3 giay van cho chup ("tiep" = mo overlay phu len vung dang lay mau)', qdCu({ dangQuay: true }) === 'tiep')

// ---- Loi 6: dai bi loai khoi bo nho ve san, giao dien phai quen no ----
{
  const sim = (apDung) => { // mo phong giao thuc: giao dien gui chuan-bi cho tung dai, main tra boDi, giao dien (neu apDung) quen id da loai
    const main = L.taoBoVeSan(6), daVe = new Set()
    const ids = []
    for (let i = 1; i <= 8; i++) { const id = 'dai-' + i; ids.push(id); const boDi = main.them(id, { ver: 'v' + i }); daVe.add(id); if (apDung) for (const k of boDi) if (k !== id) daVe.delete(k) }
    // dai dau tien: giao dien nghi da ve san (daVe co) ma main khong con -> keo bi bo qua im lang
    const loi = ids.filter((id) => daVe.has(id) && !main.lay(id))
    return { loi, main, daVe, ids }
  }
  const m = sim(true)
  kiem('L6 giao dien va main luon KHOP: khong dai nao "da ve san" ma main khong con (8 dai, bo nho 6)', m.loi.length === 0 && m.main.size() === 6 && m.daVe.size === 6, 'daVe ' + [...m.daVe].join(','))
  kiem('L6 main loai DUNG dai cu nhat (dai-1, dai-2), giu 6 dai moi', !m.main.lay('dai-1') && !m.main.lay('dai-2') && m.ids.slice(2).every((id) => m.main.lay(id)))
  const b = L.taoBoVeSan(2)
  b.them('a', 1); b.them('b', 2)
  kiem('L6 ve lai dai CU (cung id) khong loai dai nao, chi lam no thanh moi nhat', b.them('a', 3).length === 0 && b.size() === 2 && b.them('c', 4).join() === 'b')
  const cu = sim(false)
  kiem('L6 (DOI CHUNG) cach CU (giao dien khong nghe boDi): dai-1 va dai-2 "da ve san" nhung main khong con', cu.loi.join() === 'dai-1,dai-2', 'loi ' + cu.loi.join())
}

// ---- Loi 7: yeu cau GIF thu hai khong duoc xoa co "da chon ban khac" ----
{
  const kichBan = (co) => { // 1) bat dau tao GIF  2) nguoi dung chon "Khong tieng" (chon ban khac)  3) bam GIF lan nua  4) lan dau xong
    const r = {}
    r.lan1 = co.batDau('v1')
    co.chonBanKhac('v1')
    r.lan2 = co.batDau('v1')
    r.boChon = co.ketThuc('v1')
    return r
  }
  const r = kichBan(L.taoCoGif())
  kiem('L7 yeu cau GIF thu hai bi tu choi NGAY (dang-ban) va lua chon "Khong tieng" cua nguoi dung duoc giu khi GIF xong', r.lan1 === true && r.lan2 === false && r.boChon === true, JSON.stringify(r))
  const co = L.taoCoGif()
  co.batDau('v1'); co.ketThuc('v1')
  kiem('L7 sau khi GIF xong, bam GIF lai duoc nhu thuong; GIF xong khong ai chon ban khac -> boChon = false', co.batDau('v1') === true && co.ketThuc('v1') === false)
  const hai = L.taoCoGif()
  hai.batDau('v1'); hai.chonBanKhac('v2')
  kiem('L7 co cua video nay khong dinh den video khac (v2 khong dang tao -> chonBanKhac khong dat co)', hai.ketThuc('v1') === false && hai.dangTao('v1') === false)
  // CU: yeu cau thu hai van dat co va XOA co boChon cua lan dau
  const cuCo = { dang: new Set(), boChon: new Set() }
  const cu = {}
  cuCo.dang.add('v1'); cuCo.boChon.delete('v1')            // lan 1
  if (cuCo.dang.has('v1')) cuCo.boChon.add('v1')            // chon Khong tieng
  cuCo.dang.add('v1'); cuCo.boChon.delete('v1')            // lan 2 (cu): xoa co
  cuCo.dang.delete('v1'); cu.boChon = cuCo.boChon.delete('v1') // lan 1 xong
  kiem('L7 (DOI CHUNG) cach CU: lan hai xoa mat co -> GIF xong tu chon lai GIF (boChon = false, loi that)', cu.boChon === false)
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
