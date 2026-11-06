'use strict'
/* TAO BAN KHONG TIENG tu file MP4 da quay (01/10 — anh chot: "mac dinh quay co tieng ... vao khay roi cho nguoi dung
   chon 2 nut nay phia trong"). KHONG can FFmpeg, khong nen lai hinh.

   ☠️ 06/11 (Codex soat, loi 1): ban dau (01/10) chi DOI TEN cac hop cua duong tieng thanh 'free'. Trinh phat bo qua
   nhung DU LIEU tieng van nam nguyen trong mdat va cac hop mo ta (hdlr 'soun', mp4a, esds) van o do -> nguoi quay cuoc
   tro chuyen rieng, chon "Khong tieng", gui file di, nguoi nhan co the khoi phuc duong tieng. Nay bo THAT:

   File do app quay la MP4 PHAN MANH:  ftyp · moov(mvhd, trak hinh, trak tieng, mvex(trex, trex)) · [moof(mfhd, traf...)
   · mdat]... · [mfra]. Cach bo tieng (chep SANG file moi, khong dung toi file goc):
     - moov: bo trak tieng + trex tieng (khong con 'soun' / 'mp4a' / 'esds' / metadata cua duong tieng nao).
     - moi moof: bo traf tieng, ghi lai data_offset cua trun hinh; mdat moi chi chua byte cua cac khung HINH.
     - bo mfra / sidx (chua vi tri byte cu, khong con dung) va moi hop la khong biet.
   Khung hinh giu nguyen tung byte (chi doi vi tri trong file), tfdt (thoi diem) khong doi.
   Doi lai: file moi nho hon ban goc dung bang phan tieng (~20 KB / giay).

   Chi dung fs cua Node -> kiem duoc bang node tran (scripts/test/do-mp4-bo-tieng.cjs, soi lai bang ffprobe). */
const fs = require('fs')

const MAX_HOP_NHO = 64 * 1024 * 1024 // moov / moof khong bao gio to the (1 moof ~ 1 giay)

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

/* Dung mot hop tu cac manh con: [size 4][type 4][...manh] */
function dungHop(loai, manh) {
  let n = 8
  for (const m of manh) n += m.length
  const ra = Buffer.alloc(n)
  ra.writeUInt32BE(n, 0)
  ra.write(loai, 4, 'latin1')
  let o = 8
  for (const m of manh) { m.copy(ra, o); o += m.length }
  return ra
}

/* Phan tich moov: track_ID cua duong TIENG (hdlr 'soun'), cac trak tieng (de bo), co mvex khong, so trak. */
function phanTichMoov(moov) {
  const tieng = []      // track_ID cac duong tieng
  const trakTieng = []  // vi tri (start) cac hop trak tieng trong moov
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
    trakTieng.push(h.start)
  })
  const mvex = timCon(moov, 8, moov.length, 'mvex')
  return { tieng, trakTieng, soTrak, phanManh: !!mvex, mvex }
}

/* moov moi: bo trak tieng + trex tieng, moi thu khac giu nguyen byte. */
function moovKhongTieng(moov, p) {
  const manh = []
  duyetCon(moov, 8, moov.length, (h) => {
    const nguyen = moov.subarray(h.start, h.start + h.size)
    if (h.type === 'trak' && p.trakTieng.includes(h.start)) return
    if (h.type === 'mvex') {
      const con = []
      duyetCon(moov, h.start + h.hdr, h.start + h.size, (c) => {
        // trex: FullBox(4) + track_ID(4)
        if (c.type === 'trex' && p.tieng.includes(moov.readUInt32BE(c.start + c.hdr + 4))) return
        con.push(moov.subarray(c.start, c.start + c.size))
      })
      manh.push(dungHop('mvex', con))
      return
    }
    manh.push(nguyen)
  })
  return dungHop('moov', manh)
}

/* moof moi cho 1 doan: bo traf tieng. Tra { moof: Buffer, khoang: [{ tu, dai }] (byte HINH can chep, theo thu tu trun),
   viTriOffset: [vi tri trong moof moi cua cac truong data_offset can ghi lai], soTrafBo, byteTiengBo }.
   `viTri` = vi tri cua moof trong file nguon. Nem loi neu cau truc la (khong chac chep dung -> thoat, KHONG doan). */
function moofKhongTieng(moof, viTri, tiengIds) {
  const traf = [] // cac traf giu lai (Buffer ban sao) + thong tin trun
  let soTrafBo = 0, byteTiengBo = 0
  let mfhd = null
  duyetCon(moof, 8, moof.length, (c) => {
    if (c.type === 'mfhd') { mfhd = moof.subarray(c.start, c.start + c.size); return }
    if (c.type !== 'traf') return
    const tfhd = timCon(moof, c.start + c.hdr, c.start + c.size, 'tfhd')
    if (!tfhd) throw new Error('traf khong co tfhd')
    const fl = moof.readUInt32BE(tfhd.start + tfhd.hdr) & 0xffffff
    const id = moof.readUInt32BE(tfhd.start + tfhd.hdr + 4)
    let q = tfhd.start + tfhd.hdr + 8
    let goc = viTri // "goc = dau moof" (0x20000) va ca khi khong ghi gi
    if (fl & 0x1) { goc = Number(moof.readBigUInt64BE(q)); q += 8 }
    if (fl & 0x2) q += 4
    let mSize = 0
    if (fl & 0x8) q += 4
    if (fl & 0x10) { mSize = moof.readUInt32BE(q); q += 4 }
    const laTieng = tiengIds.includes(id)
    const trun = []
    duyetCon(moof, c.start + c.hdr, c.start + c.size, (t) => {
      if (t.type !== 'trun') return
      const f = moof.readUInt32BE(t.start + t.hdr) & 0xffffff
      const n = moof.readUInt32BE(t.start + t.hdr + 4)
      let p = t.start + t.hdr + 8
      if (!(f & 0x1)) throw new Error('trun khong co data_offset (khong ho tro)')
      const offViTri = p // vi tri truong data_offset trong moof nguon
      const off = moof.readInt32BE(p); p += 4
      if (f & 0x4) p += 4
      let tong = 0
      for (let k = 0; k < n; k++) {
        if (f & 0x100) p += 4
        if (f & 0x200) { tong += moof.readUInt32BE(p); p += 4 } else tong += mSize
        if (f & 0x400) p += 4
        if (f & 0x800) p += 4
      }
      trun.push({ offViTri, tu: goc + off, dai: tong })
    })
    if (laTieng) {
      soTrafBo++
      for (const t of trun) byteTiengBo += t.dai
      return
    }
    traf.push({ start: c.start, size: c.size, trun })
  })
  if (!mfhd) throw new Error('moof khong co mfhd')
  // moof moi = header + mfhd + cac traf hinh
  const manh = [Buffer.from(mfhd)]
  const khoang = []
  const viTriOffset = []
  let dai = 8 + mfhd.length
  const bao = [] // { bufTraf, trun }
  for (const t of traf) {
    const b = Buffer.from(moof.subarray(t.start, t.start + t.size))
    bao.push({ b, t, goc: dai })
    manh.push(b)
    dai += b.length
  }
  const moofMoi = dungHop('moof', manh)
  // ghi lai data_offset: mdat moi nam NGAY SAU moof moi: [size 4]['mdat'][...]; offset tinh tu dau moof
  let cong = moofMoi.length + 8
  for (const x of bao) {
    for (const tr of x.t.trun) {
      const vtTrongMoi = x.goc + (tr.offViTri - x.t.start)
      moofMoi.writeInt32BE(cong, vtTrongMoi)
      viTriOffset.push(vtTrongMoi)
      khoang.push({ tu: tr.tu, dai: tr.dai })
      cong += tr.dai
    }
  }
  return { moof: moofMoi, khoang, viTriOffset, soTrafBo, byteTiengBo, tongHinh: cong - moofMoi.length - 8 }
}

/**
 * Chep `nguon` -> `dich` KHONG con duong tieng nao. Khong dung toi `nguon`.
 * Tra ve { ok: true, soTrakTieng, soTraf, soTfra, byteTiengBo } hoac { ok: false, loi } (va KHONG de lai file dich hong).
 */
function taoBanKhongTieng(nguon, dich) {
  let fdVao = null, fdRa = null
  try {
    if (nguon === dich) return { ok: false, loi: 'nguon va dich trung nhau' }
    fdVao = fs.openSync(nguon, 'r')
    const het = fs.fstatSync(fdVao).size
    fdRa = fs.openSync(dich, 'w')
    let ghi = 0
    const viet = (b) => { fs.writeSync(fdRa, b, 0, b.length); ghi += b.length }
    let pos = 0, coMoov = false, tieng = [], soTraf = 0, soTrakTieng = 0, byteTiengBo = 0
    for (;;) {
      const h = dauHop(fdVao, pos, het)
      if (!h) break
      if (h.type === 'ftyp') {
        const b = Buffer.alloc(h.size); fs.readSync(fdVao, b, 0, h.size, pos); viet(b)
      } else if (h.type === 'moov') {
        if (h.size > MAX_HOP_NHO) throw new Error('moov qua lon')
        if (coMoov) throw new Error('file co hai moov')
        const moov = Buffer.alloc(h.size)
        fs.readSync(fdVao, moov, 0, h.size, pos)
        const p = phanTichMoov(moov)
        if (!p.phanManh) throw new Error('khong phai MP4 phan manh (khong co mvex)')
        if (p.soTrak - p.tieng.length < 1) throw new Error('khong co duong hinh')
        if (!p.tieng.length) throw new Error('file khong co duong tieng')
        coMoov = true; tieng = p.tieng; soTrakTieng = p.tieng.length
        viet(moovKhongTieng(moov, p))
      } else if (h.type === 'moof') {
        if (!coMoov) throw new Error('moof dung truoc moov')
        if (h.size > MAX_HOP_NHO) throw new Error('moof qua lon')
        const moof = Buffer.alloc(h.size)
        fs.readSync(fdVao, moof, 0, h.size, pos)
        const r = moofKhongTieng(moof, pos, tieng)
        for (const k of r.khoang) if (k.tu < 0 || k.tu + k.dai > het) throw new Error('khung hinh nam ngoai file (file bi cut?)')
        soTraf += r.soTrafBo; byteTiengBo += r.byteTiengBo
        viet(r.moof)
        const mdat = Buffer.alloc(8)
        mdat.writeUInt32BE(8 + r.tongHinh, 0); mdat.write('mdat', 4, 'latin1')
        viet(mdat)
        for (const k of r.khoang) {
          // chep theo manh <= 4 MB de khong giu ca khung trong RAM
          let c = 0
          while (c < k.dai) {
            const n = Math.min(4 * 1024 * 1024, k.dai - c)
            const b = Buffer.alloc(n)
            fs.readSync(fdVao, b, 0, n, k.tu + c)
            viet(b); c += n
          }
        }
      }
      // mdat cu (da chep phan hinh theo offset), mfra, sidx, free, hop la: BO
      pos += h.size
    }
    fs.closeSync(fdVao); fdVao = null
    fs.closeSync(fdRa); fdRa = null
    if (!coMoov) throw new Error('khong thay hop moov')
    if (pos !== het) throw new Error('file ket thuc giua mot hop (doc toi ' + pos + '/' + het + ')')
    return { ok: true, soTrakTieng, soTraf, soTfra: 0, byteTiengBo, bytes: ghi }
  } catch (e) {
    if (fdVao != null) { try { fs.closeSync(fdVao) } catch (err) {} }
    if (fdRa != null) { try { fs.closeSync(fdRa) } catch (err) {} }
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
        if (h.size > MAX_HOP_NHO) return false
        const moov = Buffer.alloc(h.size)
        fs.readSync(fd, moov, 0, h.size, pos)
        return phanTichMoov(moov).tieng.length > 0
      }
      pos += h.size
    }
  } catch (e) { return false } finally { if (fd != null) { try { fs.closeSync(fd) } catch (err) {} } }
}

module.exports = { taoBanKhongTieng, coDuongTieng }
