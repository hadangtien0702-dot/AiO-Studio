'use strict'

/* CHE THONG MINH, phia MAIN (05/11/2026): cat vung tu anh goc, doc chu KEM TOA DO bang src/ocr.js (Tesseract), quy toa do
   ve PIXEL cua vung goc (khong phai cua anh da phong / dao mau). Dung chung cho overlay (vung khoanh) va anh ghim (ca anh).
   Tach rieng de bai do goi duoc dung duong nay ma khong can bat ca app.
   nativeImage truyen vao (de file nay khong require electron -> bai do va main dung cung mot ban). */

/* Nen TOI (chu sang) -> dao thanh chu toi nen sang: Tesseract doc tot hon va nhanh gap doi (y het main.js daoNeuNenToi). */
function daoNeuNenToi(nativeImage, img) {
  const s = img.getSize(), b = img.toBitmap() // BGRA
  let tong = 0, dem = 0
  for (let i = 0; i < b.length; i += 4 * 7) { tong += 0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2]; dem++ }
  if (!dem || tong / dem >= 128) return { img, dao: false }
  for (let i = 0; i < b.length; i += 4) {
    const y = 255 - Math.round(0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2])
    b[i] = b[i + 1] = b[i + 2] = y
  }
  return { img: nativeImage.createFromBitmap(b, { width: s.width, height: s.height }), dao: true }
}

/* q = { x, y, w, h (pixel thiet bi cua anh goc), sf (pixel thiet bi / DIP cua man) }.
   Tra { ok, dong (toa do pixel thiet bi, GOC = goc vung q), w, h (kich thuoc vung that), daoMau, ms, loi? }. */
async function docVungTu(nativeImage, ocr, img, q) {
  const t0 = Date.now()
  const sz = img.getSize()
  const x = Math.max(0, Math.min(Math.round(q.x), sz.width - 1)), y = Math.max(0, Math.min(Math.round(q.y), sz.height - 1))
  const w = Math.max(1, Math.min(Math.round(q.w), sz.width - x)), h = Math.max(1, Math.min(Math.round(q.h), sz.height - y))
  let vung = img.crop({ x, y, width: w, height: h })
  // Phong y het duong Tesseract cua phim 5: x1,5 chi khi man ~100% (chu nho), tran 4,5 trieu diem anh.
  let k = (q.sf || 1) < 1.2 ? 1.5 : 1
  k = Math.max(1, Math.min(k, 9000 / Math.max(w, h), Math.sqrt(4.5e6 / (w * h))))
  let rw = w, rh = h
  if (k > 1.05) { rw = Math.round(w * k); rh = Math.round(h * k); vung = vung.resize({ width: rw, height: rh, quality: 'best' }) }
  const d = daoNeuNenToi(nativeImage, vung)
  const kq = await ocr.docChuTu(d.img.toPNG())
  if (!kq.ok) return { ok: false, loi: kq.loi, ms: Date.now() - t0 }
  const kx = rw / w, ky = rh / h
  const lui = (v, kk, max) => Math.max(0, Math.min(max, v / kk))
  const dong = kq.dong.map((l) => ({
    text: l.text,
    x0: lui(l.x0, kx, w), y0: lui(l.y0, ky, h), x1: lui(l.x1, kx, w), y1: lui(l.y1, ky, h),
    tu: l.tu.map((t) => ({ t: t.t, conf: t.conf, x0: lui(t.x0, kx, w), y0: lui(t.y0, ky, h), x1: lui(t.x1, kx, w), y1: lui(t.y1, ky, h) })),
  }))
  return { ok: true, dong, w, h, phong: k, daoMau: d.dao, ms: Date.now() - t0 }
}

/* Anh ghim: doc CA ANH (pixel anh that). dipW = be rong hien thi (DIP) de suy he so man. */
function docAnhGhim(nativeImage, ocr, image, dipW) {
  const sz = image.getSize()
  return docVungTu(nativeImage, ocr, image, { x: 0, y: 0, w: sz.width, h: sz.height, sf: dipW ? sz.width / dipW : 1 })
}

module.exports = { docVungTu, docAnhGhim }
