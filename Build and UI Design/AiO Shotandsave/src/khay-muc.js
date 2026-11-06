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

/** Cac muc khay ung voi MOT anh ghim.
    Co file: cung duong dan. KHONG co file (luu hong, anh chi con trong RAM): khop theo DOI TUONG anh — anh ghim mo tu
    khay dung chinh `it.image` (anhMucKhay tra thang no).
    04/10 (soat commit 565b446): ban cu so `it.filePath !== rec.filePath`. Hai ben cung null thi khop MOI muc chua luu
    -> sua anh ghim cua tam nay la de luon cac tam chua luu khac, ma cac tam do chi con trong RAM (mat han). */
function mucCuaAnhGhim(cacMuc, filePath, anhTruocKhiSua) {
  const kq = []
  for (const it of cacMuc) {
    if (filePath) { if (it.filePath === filePath) kq.push(it) }
    else if (!it.filePath && it.image && it.image === anhTruocKhiSua) kq.push(it)
  }
  return kq
}

/** Anh ghim vua luu ban sua xong: doi anh trong bo nho cua anh ghim + cap nhat DUNG cac muc khay cua no.
    Tra cac muc da cap nhat (ben goi gui 'shelf:update' cho tung muc). */
function apDungSuaVaoKhay(cacMuc, rec, daVe, taoAnhNho) {
  const anhCu = rec.image
  rec.image = daVe // copy / keo-tha tu cua so ghim dung ban da ve
  const kq = mucCuaAnhGhim(cacMuc, rec.filePath, anhCu)
  for (const it of kq) capNhatMucKhay(it, daVe, taoAnhNho)
  return kq
}

/** 06/11 NAP LAI ANH CU VAO KHAY, CO WebP. files: [{ path }] theo thu tu CU -> MOI (de so thu tu khay dung thoi gian).
    nativeImage KHONG doc duoc WebP (do 06/11) nen file .webp duoc giu CHO ngay (co so thu tu, kich thuoc doc tu dau file, thumbnail xam),
    giai ma qua cua so an roi thay thumbnail. ctx: { nativeImage, layId: () => id moi, themMuc(muc), taoAnhNho(img) -> dataURL, thumbCho,
    kichThuocWebp(path) -> {w,h}|null, docAnhFile(path) -> Promise<NativeImage|null>, khiXong(muc), khiLoi(muc) }.
    Tra Promise xong khi moi WebP da giai ma (that bai thi khiLoi, muc DA bi go khoi khay boi ben goi). */
function napDanhSach(files, ctx) {
  const cho = []
  for (const f of files) {
    let img = null
    try { img = ctx.nativeImage.createFromPath(f.path) } catch (e) {}
    if (img && !img.isEmpty()) { const id = ctx.layId(); ctx.themMuc(taoMucKhay(id, img, f.path, ctx.taoAnhNho)); continue }
    if (!/\.webp$/i.test(f.path)) continue
    const kt = ctx.kichThuocWebp(f.path)
    if (!kt) continue
    const id = ctx.layId()
    const muc = { id, seq: id, filePath: f.path, w: kt.w, h: kt.h, thumb: ctx.thumbCho, image: null }
    ctx.themMuc(muc)
    cho.push(ctx.docAnhFile(f.path).then((anh) => {
      if (!anh) { ctx.khiLoi(muc); return }
      const m2 = taoMucKhay(id, anh, f.path, ctx.taoAnhNho)
      muc.thumb = m2.thumb; muc.w = m2.w; muc.h = m2.h
      ctx.khiXong(muc)
    }).catch(() => { try { ctx.khiLoi(muc) } catch (e) {} }))
  }
  return Promise.all(cho)
}

module.exports = { taoMucKhay, anhMucKhay, capNhatMucKhay, mucCuaAnhGhim, apDungSuaVaoKhay, napDanhSach }
