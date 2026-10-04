'use strict'
/* Do RAM cua KHAY ANH (src/khay-muc.js) — chay: npm run test:khayram   (Electron AN, khong mo cua so nao, ~15 giay)
   04/10 (ECC soat, DA DO): khay giu `image.crop()` cua moi lan chup = ghim ca khung man hinh ~32 MB/anh (20 anh = 705 MB;
   vu tien trinh chinh 1.168 MB sau 21 gio). Nay muc khay chi giu anh nho, anh goc doc lai tu file khi bam ghim.
   Thuoc co DOI CHUNG: kieu cu chay ngay trong bai nay phai lo ra con so lon, khong thi thuoc hong. */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const ROOT = path.resolve(__dirname, '..', '..')
let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) } }

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-khay-ram-'))
const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
const r = spawnSync(require('electron'), ['--js-flags=--expose-gc', path.join(ROOT, 'scripts', 'test', 'khay-ram-main.cjs'), tam], { env, encoding: 'utf8', timeout: 120000 })
const dong = (r.stdout || '').split('\n').find((l) => l.startsWith('KQ='))
if (!dong) {
  kiem('Electron an chay xong va tra ket qua', false, ((r.stdout || '') + (r.stderr || '')).slice(-400))
} else {
  const k = JSON.parse(dong.slice(3))
  const tangCu = k.kieuCu - k.nen, tangMoi = k.kieuMoi - k.sauKhiBo
  console.log(`  [so do] nen ${k.nen} MB · kieu cu giu ${k.n} manh cat: ${k.kieuCu} MB (+${tangCu}) · bo het: ${k.sauKhiBo} MB · kieu moi ${k.n} muc: ${k.kieuMoi} MB (+${tangMoi}) · anh nho ${k.kyTuAnhNho} ky tu`)
  kiem('bo don rac co bat (khong co thi so do vo nghia)', k.coGc === true)
  kiem('DOI CHUNG kieu cu: moi anh ghim >= 20 MB (thuoc bat duoc loi)', tangCu >= 20 * k.n, '+' + tangCu + ' MB cho ' + k.n + ' anh')
  kiem('DOI CHUNG: bo het thi RAM ve gan nen', k.sauKhiBo - k.nen <= 40, k.sauKhiBo + ' vs ' + k.nen)
  // RSS con dinh phan vun cua bo cap phat (bo het kieu cu van cao hon nen ~30 MB) nen nguong de rong: <= 8 MB/muc VA < 1/3 kieu cu
  kiem('KIEU MOI: ' + k.n + ' muc tang <= 8 MB moi muc va < 1/3 kieu cu', tangMoi <= 8 * k.n && tangMoi * 3 < tangCu, '+' + tangMoi + ' MB (kieu cu +' + tangCu + ')')
  kiem('muc co file KHONG giu anh goc trong RAM', k.mucKhongGiuAnh === true)
  kiem('muc du truong: kich thuoc, anh nho dang data:image, so thu tu', k.mucDuTruong === true)
  kiem('bam ghim: doc lai tu file ra dung kich thuoc 800x500', !!k.docLai && k.docLai.width === 800 && k.docLai.height === 500, JSON.stringify(k.docLai))
  kiem('bam ghim: dung diem anh cua anh do (khong lay nham anh khac)', k.diemAnhDung === true)
  kiem('file bi xoa ngoai app: tra null (ben goi bao + bo khoi khay)', k.fileMat === null)
  kiem('muc KHONG co file (luu hong): van giu anh trong RAM, ghim duoc', k.khongFileGiuAnh === true)
  kiem('sua anh ghim: muc cap nhat kich thuoc + anh nho, van khong giu anh goc', k.capNhat === true)
  kiem('muc rong: tra null, khong nem loi', k.anhMucRong === null)
}
try { fs.rmSync(tam, { recursive: true, force: true }) } catch (e) {}   // thu muc mkdtemp cua bai nay
console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
process.exit(truot ? 1 : 0)
