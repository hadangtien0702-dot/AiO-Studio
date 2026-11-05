'use strict'
/* Do MUC KHAY khi SUA ANH GHIM (src/khay-muc.js: mucCuaAnhGhim + apDungSuaVaoKhay) — chay: npm run test:khaymuc
   Khong can Electron, khong mo cua so: anh la doi tuong gia co getSize().
   04/10 (soat commit 565b446): vong lap cu trong `pin:save-edit` so `it.filePath !== rec.filePath`. Anh KHONG luu duoc
   co filePath null -> hai ben cung null -> sua anh ghim cua tam nay DE luon moi tam chua luu khac trong khay, ma cac
   tam do chi con trong RAM. Muc [1] co DOI CHUNG: chay dung kich ban do bang cach cu, phai thay tam 2 bi de. */
const path = require('path')
const M = require(path.resolve(__dirname, '..', '..', 'src', 'khay-muc.js'))

let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) } }
const anh = (ten, w, h) => ({ ten, getSize: () => ({ width: w || 800, height: h || 500 }) })
const anhNho = (img) => 'nho:' + img.ten

/** Khay gia: Map id -> muc, tao bang taoMucKhay THAT. file = null nghia la tam do KHONG luu duoc (o day / mat quyen). */
function khay(ds) {
  const k = new Map()
  ds.forEach((x, i) => k.set(i + 1, M.taoMucKhay(i + 1, x.anh, x.file, anhNho)))
  return k
}
/** Anh ghim mo tu mot muc khay, nhu `shelf:pin` cua main.js: muc khong file dung chinh `it.image`, co file thi doc lai. */
const ghim = (it, anhDocTuFile) => ({ image: it.image || anhDocTuFile, filePath: it.filePath })
/** Cach CU (main.js truoc lan sua nay), chi de doi chung. */
function cachCu(k, rec, daVe) {
  rec.image = daVe
  const kq = []
  for (const [, it] of k) { if (it.filePath !== rec.filePath) continue; M.capNhatMucKhay(it, daVe, anhNho); kq.push(it) }
  return kq
}
const coHam = typeof M.apDungSuaVaoKhay === 'function' && typeof M.mucCuaAnhGhim === 'function'
kiem('co ham mucCuaAnhGhim + apDungSuaVaoKhay', coHam)
if (!coHam) { console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`); process.exit(1) }

console.log('\n[1] Hai tam KHONG luu duoc + mot tam co file: sua anh ghim cua tam 1 chi doi tam 1')
{
  const a1 = anh('a1'), a2 = anh('a2'), a3 = anh('a3')
  const k = khay([{ anh: a1, file: null }, { anh: a2, file: null }, { anh: a3, file: '/x/3.jpg' }])
  const rec = ghim(k.get(1)), daVe = anh('a1-da-ve', 640, 400)
  const kq = M.apDungSuaVaoKhay(k.values(), rec, daVe, anhNho)
  kiem('chi 1 muc duoc cap nhat, dung muc 1', kq.length === 1 && kq[0].id === 1, 'so muc ' + kq.length)
  kiem('muc 1: anh + anh nho + kich thuoc la ban da ve', k.get(1).image === daVe && k.get(1).thumb === 'nho:a1-da-ve' && k.get(1).w === 640 && k.get(1).h === 400)
  kiem('muc 2 (tam chua luu KHAC): anh trong RAM con NGUYEN', k.get(2).image === a2 && k.get(2).thumb === 'nho:a2', 'anh nho ' + k.get(2).thumb)
  kiem('muc 3 (co file khac): khong doi', k.get(3).thumb === 'nho:a3' && k.get(3).image === null)
  kiem('anh ghim giu ban da ve (Ctrl+C / keo dung ban moi)', rec.image === daVe)

  // DOI CHUNG: dung kich ban do, cach cu -> tam 2 bi de mat
  const b1 = anh('a1'), b2 = anh('a2')
  const kCu = khay([{ anh: b1, file: null }, { anh: b2, file: null }, { anh: anh('a3'), file: '/x/3.jpg' }])
  const recCu = ghim(kCu.get(1)), daVeCu = anh('a1-da-ve')
  const kqCu = cachCu(kCu, recCu, daVeCu)
  kiem('doi chung: cach cu DE luon tam 2 (2 muc bi cap nhat, anh tam 2 mat)', kqCu.length === 2 && kCu.get(2).image === daVeCu && kCu.get(2).image !== b2, 'so muc ' + kqCu.length)

  // Sua LAN 2 tren cung anh ghim chua luu: van chi muc 1
  const daVe2 = anh('a1-da-ve-2')
  const kq2 = M.apDungSuaVaoKhay(k.values(), rec, daVe2, anhNho)
  kiem('sua lan 2: van chi muc 1, tam 2 con nguyen', kq2.length === 1 && kq2[0].id === 1 && k.get(1).image === daVe2 && k.get(2).image === a2, 'so muc ' + kq2.length)
}

console.log('\n[2] Anh CO FILE: khop theo duong dan, muc khay khong giu anh goc')
{
  const a3 = anh('a3')
  const k = khay([{ anh: anh('f1'), file: '/x/1.jpg' }, { anh: anh('f2'), file: '/x/2.jpg' }, { anh: a3, file: null }])
  const rec = ghim(k.get(1), anh('f1-doc-tu-file')), daVe = anh('f1-da-ve', 300, 200)
  const kq = M.apDungSuaVaoKhay(k.values(), rec, daVe, anhNho)
  kiem('chi muc cung file duoc cap nhat', kq.length === 1 && kq[0].id === 1, 'so muc ' + kq.length)
  kiem('muc 1: anh nho + kich thuoc moi, KHONG giu anh goc trong RAM', k.get(1).thumb === 'nho:f1-da-ve' && k.get(1).w === 300 && k.get(1).image === null)
  kiem('muc 2 (file khac) + muc 3 (chua luu): khong doi', k.get(2).thumb === 'nho:f2' && k.get(3).image === a3 && k.get(3).thumb === 'nho:a3')
}

console.log('\n[3] Muc khay cua anh ghim da bi bo khoi khay: khong dung muc nao, khong nem loi')
{
  const a2 = anh('a2')
  const k = khay([{ anh: anh('a1'), file: null }, { anh: a2, file: null }])
  const rec = ghim(k.get(1))
  k.delete(1)                                                  // nguoi dung bam x tren muc 1
  let kq = null, loi = ''
  try { kq = M.apDungSuaVaoKhay(k.values(), rec, anh('a1-da-ve'), anhNho) } catch (e) { loi = e.message }
  kiem('0 muc, khong loi', !loi && kq && kq.length === 0, loi || ('so muc ' + (kq && kq.length)))
  kiem('tam chua luu con lai khong bi de', k.get(2).image === a2)
}

console.log('\n[4] Anh ghim khong co file va khong ro anh cu: khong khop muc nao')
{
  const a1 = anh('a1')
  const k = khay([{ anh: a1, file: null }])
  kiem('anh cu undefined -> 0 muc', M.mucCuaAnhGhim(k.values(), null, undefined).length === 0)
  kiem('anh cu la doi tuong khac -> 0 muc', M.mucCuaAnhGhim(k.values(), null, anh('la')).length === 0)
  kiem('anh cu dung doi tuong -> 1 muc', M.mucCuaAnhGhim(k.values(), null, a1).length === 1)
}

console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
process.exit(truot ? 1 : 0)
