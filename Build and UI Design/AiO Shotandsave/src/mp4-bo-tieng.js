'use strict'
/* TAO BAN KHONG TIENG tu file MP4 da quay (01/10 — anh chot: "mac dinh quay co tieng ... vao khay roi cho nguoi dung
   chon 2 nut nay phia trong"). KHONG can FFmpeg, khong nen lai hinh.

   File do app quay la MP4 PHAN MANH:  ftyp · moov(mvhd, trak hinh, trak tieng, mvex(trex, trex)) · [moof(mfhd, traf...)
   · mdat]... · [mfra]. Cach bo tieng: chep nguyen file roi DOI TEN cac hop cua duong tieng thanh 'free' (hop "bo
   trong", trinh phat bo qua):  trak tieng · trex tieng · moi traf tieng · tfra tieng.
   Vi KHONG doi kich thuoc hop nao nen moi vi tri du lieu (data_offset cua duong hinh) giu nguyen -> duong hinh con
   nguyen tung byte. Du lieu tieng van nam trong mdat nhung khong con ai tro toi (~20 KB moi giay, chap nhan).

   Chi dung fs cua Node -> kiem duoc bang node tran (scripts/test/do-mp4-bo-tieng.cjs, soi lai bang ffprobe). */
const fs = require('fs')

const FREE = Buffer.from('free', 'latin1')

/* Doc dau hop tai vi tri `pos` cua fd: { size, type, hdr } (hdr = 8 hoac 16 byte). null neu het file / hop hong. */
function dauHop(fd, pos, het) {
  if (pos + 8 > het) return null
  const b = Buffer.alloc(16)
  fs.readSync(fd, b, 0, 8, pos)
  let size = b.readUInt32BE(0)
  const type = b.toString('latin1', 4, 8)
  let hdr = 8
  if (size === 1) {
    if (pos + 16 > het) return null
    fs.readSync(fd, b, 8, 8, pos + 8)
    size = Number(b.readBigUInt64BE(8)); hdr = 16
  } else if (size === 0) size = het - pos
  if (size < hdr || pos + size > het) return null
  return { size, type, hdr }
}

/* Duyet cac hop con trong mot Buffer (hop cha da doc ca vao bo nho): goi f({ type, start, size, hdr }). */
function duyetCon(buf, tu, den, f) {
  let i = tu
  while (i + 8 <= den) {
    let size = buf.readUInt32BE(i)
    const type = buf.toString('latin1', i + 4, i + 8)
    let hdr = 8
    if (size === 1) { if (i + 16 > den) break; size = Number(buf.readBigUInt64BE(i + 8)); hdr = 16 } else if (size === 0) size = den - i
    if (size < hdr || i + size > den) break
    f({ type, start: i, size, hdr })
    i += size
  }
}
const timCon = (buf, tu, den, ten) => { let r = null; duyetCon(buf, tu, den, (h) => { if (!r && h.type === ten) r = h }); return r }

/* Tim track_ID cua duong TIENG trong moov + vi tri (trong buf moov) cua cac hop can doi ten. */
function phanTichMoov(moov) {
  const doi = [] // vi tri truong `type` (4 byte) can ghi 'free', tinh trong buf moov
  const tieng = []
  let soTrak = 0
  duyetCon(moov, 8, moov.length, (h) => {
    if (h.type !== 'trak') return
    soTrak++
    const tkhd = timCon(moov, h.start + h.hdr, h.start + h.size, 'tkhd')
    const mdia = timCon(moov, h.start + h.hdr, h.start + h.size, 'mdia')
    if (!tkhd || !mdia) return
    const hdlr = timCon(moov, mdia.start + mdia.hdr, mdia.start + mdia.size, 'hdlr')
    if (!hdlr) return
    // hdlr: FullBox(4) + pre_defined(4) + handler_type(4)
    const loai = moov.toString('latin1', hdlr.start + hdlr.hdr + 8, hdlr.start + hdlr.hdr + 12)
    if (loai !== 'soun') return
    // tkhd: FullBox(4) + [v0: creation(4) modification(4) | v1: 8 + 8] + track_ID(4)
    const v = moov.readUInt8(tkhd.start + tkhd.hdr)
    const id = moov.readUInt32BE(tkhd.start + tkhd.hdr + 4 + (v === 1 ? 16 : 8))
    tieng.push(id)
    doi.push(h.start + 4)
  })
  const mvex = timCon(moov, 8, moov.length, 'mvex')
  if (mvex) {
    duyetCon(moov, mvex.start + mvex.hdr, mvex.start + mvex.size, (h) => {
      // trex: FullBox(4) + track_ID(4)
      if (h.type === 'trex' && tieng.includes(moov.readUInt32BE(h.start + h.hdr + 4))) doi.push(h.start + 4)
    })
  }
  return { tieng, doi, soTrak, phanManh: !!mvex }
}

/**
 * Chep `nguon` -> `dich` roi bo duong tieng trong `dich`. Khong dung toi `nguon`.
 * Tra ve { ok: true, soTrakTieng, soTraf, soTfra } hoac { ok: false, loi } (va KHONG de lai file dich hong).
 */
function taoBanKhongTieng(nguon, dich) {
  let fd = null
  try {
    if (nguon === dich) return { ok: false, loi: 'nguon va dich trung nhau' }
    fs.copyFileSync(nguon, dich)
    fd = fs.openSync(dich, 'r+')
    const het = fs.fstatSync(fd).size
    const ghiFree = (pos) => fs.writeSync(fd, FREE, 0, 4, pos)
    let pos = 0, thayMoov = false, tieng = [], soTraf = 0, soTfra = 0, soTrakTieng = 0
    for (;;) {
      const h = dauHop(fd, pos, het)
      if (!h) break
      if (h.type === 'moov') {
        if (h.size > 64 * 1024 * 1024) throw new Error('moov qua lon')
        const moov = Buffer.alloc(h.size)
        fs.readSync(fd, moov, 0, h.size, pos)
        const p = phanTichMoov(moov)
        if (!p.phanManh) throw new Error('khong phai MP4 phan manh (khong co mvex)')
        if (p.soTrak - p.tieng.length < 1) throw new Error('khong co duong hinh')
        thayMoov = true; tieng = p.tieng; soTrakTieng = p.tieng.length
        for (const o of p.doi) ghiFree(pos + o)
      } else if (h.type === 'moof' && tieng.length) {
        if (h.size > 64 * 1024 * 1024) throw new Error('moof qua lon')
        const moof = Buffer.alloc(h.size)
        fs.readSync(fd, moof, 0, h.size, pos)
        duyetCon(moof, h.hdr, h.size, (c) => {
          if (c.type !== 'traf') return
          const tfhd = timCon(moof, c.start + c.hdr, c.start + c.size, 'tfhd')
          // tfhd: FullBox(4) + track_ID(4)
          if (tfhd && tieng.includes(moof.readUInt32BE(tfhd.start + tfhd.hdr + 4))) { ghiFree(pos + c.start + 4); soTraf++ }
        })
      } else if (h.type === 'mfra' && tieng.length) {
        const mfra = Buffer.alloc(h.size)
        fs.readSync(fd, mfra, 0, h.size, pos)
        duyetCon(mfra, h.hdr, h.size, (c) => {
          // tfra: FullBox(4) + track_ID(4)
          if (c.type === 'tfra' && tieng.includes(mfra.readUInt32BE(c.start + c.hdr + 4))) { ghiFree(pos + c.start + 4); soTfra++ }
        })
      }
      pos += h.size
    }
    fs.closeSync(fd); fd = null
    if (!thayMoov) throw new Error('khong thay hop moov')
    if (pos !== het) throw new Error('file ket thuc giua mot hop (doc toi ' + pos + '/' + het + ')')
    if (!soTrakTieng) throw new Error('file khong co duong tieng')
    return { ok: true, soTrakTieng, soTraf, soTfra }
  } catch (e) {
    if (fd != null) { try { fs.closeSync(fd) } catch (err) {} }
    try { fs.unlinkSync(dich) } catch (err) {} // file dich do chinh ham nay vua tao
    return { ok: false, loi: (e && e.message) || String(e) }
  }
}

/* 02/10: file MP4 co duong TIENG khong (doc hop moov o dau file). Dung khi dua lai vao so mot video khong con so do
   luc quay (kho-video.doiChieu). File cut cuoi (quay do) van doc duoc vi moov nam truoc. Loi / khong phai MP4 -> false. */
function coDuongTieng(file) {
  let fd = null
  try {
    fd = fs.openSync(file, 'r')
    const het = fs.fstatSync(fd).size
    let pos = 0
    for (;;) {
      const h = dauHop(fd, pos, het)
      if (!h) return false
      if (h.type === 'moov') {
        if (h.size > 64 * 1024 * 1024) return false
        const moov = Buffer.alloc(h.size)
        fs.readSync(fd, moov, 0, h.size, pos)
        return phanTichMoov(moov).tieng.length > 0
      }
      pos += h.size
    }
  } catch (e) { return false } finally { if (fd != null) { try { fs.closeSync(fd) } catch (err) {} } }
}

module.exports = { taoBanKhongTieng, coDuongTieng }
