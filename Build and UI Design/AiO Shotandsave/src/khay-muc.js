'use strict'

/* =========================================================================
   khay-muc.js — MOT MUC trong khay anh (04/10, ECC soat + DA DO)
   -------------------------------------------------------------------------
   Truoc: khay giu `image` (NativeImage) cua MOI lan chup cho toi khi nguoi dung bam x. Anh do la `image.crop()` cua
   khung man hinh goc, ma manh cat DUNG CHUNG vung nho voi ca khung -> moi anh nam trong khay ghim nguyen mot khung
   ~32 MB (man 4K). Do Electron 43.4.1 (scripts/test/do-khay-ram.cjs): nen 71 MB · giu 20 manh cat 800x500 = 705 MB ·
   chi giu anh nho = 75 MB. Day la goc vu tien trinh chinh 1.168 MB sau ~21 gio (01/10).
   Nay: muc chi giu anh NHO (chuoi JPEG da tao san cho khay) + kich thuoc. Anh goc doc lai tu FILE khi can (bam ghim).
   Muc KHONG co file (luu hong) thi van giu anh trong RAM — khong con cho nao khac de lay.

   KHONG require electron: `nativeImage` + ham tao anh nho tiem vao -> do duoc bang Electron an.
   ========================================================================= */

/** Tao muc khay cho mot anh vua chup / vua nap tu dia. `taoAnhNho(image)` -> chuoi data:image (thumbKhay cua main). */
function taoMucKhay(id, image, filePath, taoAnhNho) {
  const sz = image.getSize()
  return {
    id, seq: id, filePath: filePath || null,
    w: sz.width, h: sz.height,
    thumb: taoAnhNho(image),
    image: filePath ? null : image, // co file thi KHONG giu anh goc trong RAM
  }
}

/** Anh goc cua mot muc: tu RAM (muc khong co file) hoac doc lai tu dia.
    null = file khong con / khong doc duoc -> ben goi PHAI xu ly (bo muc khoi khay + bao), khong duoc im lang. */
function anhMucKhay(it, nativeImage) {
  if (!it) return null
  if (it.image) return it.image
  if (!it.filePath) return null
  try {
    const img = nativeImage.createFromPath(it.filePath)
    return img && !img.isEmpty() ? img : null
  } catch (e) { return null }
}

/** Sau khi ve / lam mo anh ghim: cap nhat muc khay tro cung file (anh nho + kich thuoc). */
function capNhatMucKhay(it, image, taoAnhNho) {
  const sz = image.getSize()
  it.w = sz.width
  it.h = sz.height
  it.thumb = taoAnhNho(image)
  it.image = it.filePath ? null : image
  return it
}

module.exports = { taoMucKhay, anhMucKhay, capNhatMucKhay }
