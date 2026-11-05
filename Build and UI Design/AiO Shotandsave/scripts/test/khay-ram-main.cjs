'use strict'
/* Phan Electron cua bai do RAM khay (goi tu do-khay-ram.cjs). KHONG chay main.js cua app, KHONG mo cua so nao.
   Dung THAT src/khay-muc.js + nativeImage that. Chay: electron --js-flags=--expose-gc scripts/test/khay-ram-main.cjs <thu-muc-tam> */
const { app, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '..', '..')
const TAM = path.resolve(process.argv[process.argv.length - 1])
const { taoMucKhay, anhMucKhay, capNhatMucKhay } = require(path.join(ROOT, 'src', 'khay-muc.js'))
if (app.dock) app.dock.hide()
app.setPath('userData', path.join(TAM, 'userData-ram'))
const chet = (e) => { console.log('LOI=' + ((e && e.stack) || e)); app.exit(2) }
process.on('uncaughtException', chet)

app.whenReady().then(async () => {
  const W = 3840, H = 2160, N = 12
  const rss = () => Math.round(process.memoryUsage().rss / 1048576)
  const gc = async () => { for (let i = 0; i < 6; i++) { if (global.gc) global.gc(); await new Promise((r) => setTimeout(r, 200)) } }
  const khung = (mau) => nativeImage.createFromBitmap(Buffer.alloc(W * H * 4, mau), { width: W, height: H }) // khung man 4K
  const cat = (raw) => raw.crop({ x: 100, y: 100, width: 800, height: 500 })                                // vung nguoi dung khoanh
  const anhNho = (img) => 'data:image/jpeg;base64,' + img.resize({ height: 170, quality: 'best' }).toJPEG(88).toString('base64')
  const kq = { coGc: !!global.gc, n: N }
  await gc(); kq.nen = rss()

  // DOI CHUNG — kieu cu: khay giu manh cat
  let cu = []
  for (let i = 0; i < N; i++) { const c = cat(khung(100 + i)); cu.push({ id: i, image: c, filePath: 'x' }) }
  await gc(); kq.kieuCu = rss()
  cu = []; await gc(); kq.sauKhiBo = rss()

  // KIEU MOI — taoMucKhay voi file that
  const ds = []
  for (let i = 0; i < N; i++) {
    const c = cat(khung(100 + i))
    const f = path.join(TAM, 'anh-' + i + '.png'); fs.writeFileSync(f, c.toPNG())
    ds.push(taoMucKhay(i + 1, c, f, anhNho))
  }
  await gc(); kq.kieuMoi = rss()
  kq.mucKhongGiuAnh = ds.every((m) => m.image === null)
  kq.mucDuTruong = ds.every((m) => m.w === 800 && m.h === 500 && typeof m.thumb === 'string' && m.thumb.startsWith('data:image/jpeg;base64,') && m.seq === m.id)
  kq.kyTuAnhNho = ds[0].thumb.length

  // Bam ghim: doc lai anh goc tu file
  const a = anhMucKhay(ds[3], nativeImage)
  kq.docLai = a ? a.getSize() : null
  const p0 = c0(a), p1 = c0(cat(khung(103)))
  function c0(img) { const b = img.toBitmap(); return [b[0], b[1], b[2]].join(',') }
  kq.diemAnhDung = p0 === p1
  // File bi xoa ngoai app -> null (ben goi phai bao)
  fs.unlinkSync(ds[5].filePath); kq.fileMat = anhMucKhay(ds[5], nativeImage)
  // Muc KHONG co file (luu hong) -> giu anh trong RAM
  const c = cat(khung(50)); const m0 = taoMucKhay(99, c, null, anhNho)
  kq.khongFileGiuAnh = m0.image === c && anhMucKhay(m0, nativeImage) === c && m0.filePath === null
  // Sua anh ghim: cap nhat muc (kich thuoc moi), van khong giu anh goc
  const moi = nativeImage.createFromBitmap(Buffer.alloc(400 * 300 * 4, 9), { width: 400, height: 300 })
  const truoc = ds[1].thumb; capNhatMucKhay(ds[1], moi, anhNho)
  kq.capNhat = ds[1].w === 400 && ds[1].h === 300 && ds[1].thumb !== truoc && ds[1].image === null
  kq.anhMucRong = anhMucKhay(null, nativeImage)
  console.log('KQ=' + JSON.stringify(kq))
  app.exit(0)
}).catch(chet)
