'use strict'
/* DOC MUC LUC FILE MP4 DO APP QUAY (06/11) — dung cho xuat video da sua (src/sua-xuat/xuat.js).
   Khuon = phan tach hop cua src/gif/gif.js (06/10), mo rong: doc CA duong hinh (H.264) LAN duong tieng (AAC / Opus) va tra
   bang khung theo thoi gian (micro giay) de cat dau cuoi + chep nguyen tieng sang file moi.

   Vao: `cau` = { kich (byte), doc(viTri, dai) -> Uint8Array }  (preload-sua-xuat.js; bai do gia tao bang Buffer).
   File: MP4 PHAN MANH (ftyp + moov + [moof + mdat]...) — tfhd goc = dau moof, trun co kich thuoc tung khung (flags 0x305),
   khong B-frame. Van xu ly cac co con lai (mac dinh trong tfhd, goc tuyet doi, do lech cts) de file la khong lam sai lang le.
   File CUT cuoi (doan quay "Bi ngat") -> bo cac khung nam ngoai file, phan con lai van dung duoc. */
;(function (goc) {
  const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
  const i32 = (b, i) => (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]
  const u64 = (b, i) => u32(b, i) * 4294967296 + u32(b, i + 4)
  const u16 = (b, i) => (b[i] << 8) | b[i + 1]
  const ten4 = (b, i) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3])
  const hex2 = (v) => v.toString(16).padStart(2, '0')

  function hopCon(b, dau, cuoi) {
    const ra = []
    let i = dau
    while (i + 8 <= cuoi) {
      let n = u32(b, i), hd = 8
      const t = ten4(b, i + 4)
      if (n === 1) { if (i + 16 > cuoi) break; n = u64(b, i + 8); hd = 16 } else if (n === 0) n = cuoi - i
      if (n < hd || i + n > cuoi) break
      ra.push({ t, dau: i + hd, cuoi: i + n })
      i += n
    }
    return ra
  }
  const tim = (b, h, t) => (h ? hopCon(b, h.dau, h.cuoi).find((x) => x.t === t) : null) || null

  /* esds -> AudioSpecificConfig (Uint8Array) hoac null. */
  function docEsds(b, dau, cuoi) {
    let i = dau + 4 // FullBox
    const docDai = () => { let n = 0; for (let k = 0; k < 4 && i < cuoi; k++) { const c = b[i++]; n = (n << 7) | (c & 0x7f); if (!(c & 0x80)) break } return n }
    while (i < cuoi) {
      const tag = b[i++]
      const dai = docDai()
      if (tag === 0x03) { // ES_Descriptor: ES_ID(2) co(1) [...]
        const co = b[i + 2]
        i += 3
        if (co & 0x80) i += 2
        if (co & 0x40) i += 1 + b[i]
        if (co & 0x20) i += 2
      } else if (tag === 0x04) { i += 13 } // DecoderConfigDescriptor co dinh 13 byte
      else if (tag === 0x05) return b.slice(i, i + dai)
      else i += dai
    }
    return null
  }

  function docMoov(b, dau, cuoi) {
    const ra = { video: null, tieng: null }
    for (const trak of hopCon(b, dau, cuoi)) {
      if (trak.t !== 'trak') continue
      const tkhd = tim(b, trak, 'tkhd'), mdia = tim(b, trak, 'mdia')
      const hdlr = tim(b, mdia, 'hdlr'), mdhd = tim(b, mdia, 'mdhd')
      if (!tkhd || !hdlr || !mdhd) continue
      const loai = ten4(b, hdlr.dau + 8)
      const id = u32(b, tkhd.dau + (b[tkhd.dau] ? 20 : 12))
      const nhip = u32(b, mdhd.dau + (b[mdhd.dau] ? 20 : 12)) || 30000
      const stsd = tim(b, tim(b, tim(b, mdia, 'minf'), 'stbl'), 'stsd')
      if (!stsd) continue
      const e = stsd.dau + 8 // muc mo ta dau tien: [kich 4][loai 4]...
      const eLoai = ten4(b, e + 4), eCuoi = e + u32(b, e)
      if (loai === 'vide' && !ra.video && (eLoai === 'avc1' || eLoai === 'avc3')) {
        const avcC = hopCon(b, e + 86, eCuoi).find((x) => x.t === 'avcC')
        if (!avcC) continue
        ra.video = {
          id, nhip, w: u16(b, e + 32), h: u16(b, e + 34),
          avcC: b.slice(avcC.dau, avcC.cuoi),
          codec: 'avc1.' + hex2(b[avcC.dau + 1]) + hex2(b[avcC.dau + 2]) + hex2(b[avcC.dau + 3]),
        }
      } else if (loai === 'soun' && !ra.tieng) {
        const kenh = u16(b, e + 24), tanSo = u16(b, e + 32)
        if (eLoai === 'mp4a') {
          const esds = hopCon(b, e + 36, eCuoi).find((x) => x.t === 'esds')
          const asc = esds ? docEsds(b, esds.dau, esds.cuoi) : null
          if (!asc || !asc.length) continue
          const obj = (asc[0] >> 3) & 0x1f
          ra.tieng = { id, nhip, kenh, tanSo, loai: 'aac', codec: 'mp4a.40.' + (obj || 2), description: asc }
        } else if (eLoai === 'Opus') {
          ra.tieng = { id, nhip, kenh, tanSo: 48000, loai: 'opus', codec: 'opus', description: null }
        }
      }
    }
    return ra
  }

  /* moof -> khung cua duong `id`: [{ vt, size, t (nhip), dur, cts, khoa }] */
  function docMoof(b, dauCon, viTri, id, tChay) {
    const ra = []
    for (const traf of hopCon(b, dauCon, b.length)) {
      if (traf.t !== 'traf') continue
      const tfhd = tim(b, traf, 'tfhd')
      if (!tfhd || u32(b, tfhd.dau + 4) !== id) continue
      const fl = u32(b, tfhd.dau) & 0xffffff
      let q = tfhd.dau + 8
      let g = viTri
      if (fl & 0x1) { g = u64(b, q); q += 8 }
      if (fl & 0x2) q += 4
      let mDur = 0, mSize = 0, mCo = 0
      if (fl & 0x8) { mDur = u32(b, q); q += 4 }
      if (fl & 0x10) { mSize = u32(b, q); q += 4 }
      if (fl & 0x20) { mCo = u32(b, q); q += 4 }
      const tfdt = tim(b, traf, 'tfdt')
      let t = tfdt ? (b[tfdt.dau] ? u64(b, tfdt.dau + 4) : u32(b, tfdt.dau + 4)) : tChay
      let vt = null
      for (const trun of hopCon(b, traf.dau, traf.cuoi)) {
        if (trun.t !== 'trun') continue
        const ver = b[trun.dau], f = u32(b, trun.dau) & 0xffffff, n = u32(b, trun.dau + 4)
        let p = trun.dau + 8
        if (f & 0x1) { vt = g + i32(b, p); p += 4 } else if (vt === null) vt = g
        let coDau = null
        if (f & 0x4) { coDau = u32(b, p); p += 4 }
        for (let k = 0; k < n; k++) {
          let dur = mDur, size = mSize, co = mCo, cts = 0
          if (f & 0x100) { dur = u32(b, p); p += 4 }
          if (f & 0x200) { size = u32(b, p); p += 4 }
          if (f & 0x400) { co = u32(b, p); p += 4 }
          if (f & 0x800) { cts = ver ? i32(b, p) : u32(b, p); p += 4 }
          if (k === 0 && coDau !== null) co = coDau
          ra.push({ vt, size, t, dur, cts, khoa: !((co >> 16) & 1) })
          vt += size; t += dur
        }
      }
    }
    return ra
  }

  /**
   * Doc muc luc. Tra { video, tieng, mauV, mauA }:
   *   video = { id, nhip, w, h, avcC, codec } · tieng = { id, nhip, kenh, tanSo, loai, codec, description } | null
   *   mauV / mauA = [{ vt, size, ts (us), dur (us), khoa }] theo thu tu trong file (ts da cong cts).
   * Nem Error('khong-ho-tro: ...') neu khong phai file nay.
   */
  function doc(cau) {
    let moov = null
    const moofs = []
    for (let vt = 0; vt + 8 <= cau.kich;) {
      const hd = cau.doc(vt, 16)
      if (hd.length < 8) break
      let n = u32(hd, 0), dauCon = 8
      const t = ten4(hd, 4)
      if (n === 1 && hd.length >= 16) { n = u64(hd, 8); dauCon = 16 } else if (n === 0) n = cau.kich - vt
      if (n < dauCon) break
      if (t === 'moov' && !moov) { const b = cau.doc(vt, n); moov = docMoov(b, dauCon, b.length) } else if (t === 'moof') moofs.push({ vt, n, dauCon })
      vt += n
    }
    if (!moov || !moov.video) throw new Error('khong-ho-tro: file khong co duong hinh H.264')
    if (!moofs.length) throw new Error('khong-ho-tro: file khong phai MP4 phan manh')
    const mauV = [], mauA = []
    let tV = 0, tA = 0
    const ra = (ks, trak, dich, tChay) => {
      const cut = ks.findIndex((k) => k.vt + k.size > cau.kich)
      if (cut >= 0) ks = ks.slice(0, cut)
      for (const k of ks) {
        dich.push({ vt: k.vt, size: k.size, ts: Math.round((k.t + k.cts) * 1e6 / trak.nhip), dur: Math.round(k.dur * 1e6 / trak.nhip), khoa: k.khoa })
      }
      if (ks.length) { const l = ks[ks.length - 1]; return l.t + l.dur }
      return tChay
    }
    for (const m of moofs) {
      const b = cau.doc(m.vt, m.n)
      tV = ra(docMoof(b, m.dauCon, m.vt, moov.video.id, tV), moov.video, mauV, tV)
      if (moov.tieng) tA = ra(docMoof(b, m.dauCon, m.vt, moov.tieng.id, tA), moov.tieng, mauA, tA)
    }
    if (!mauV.length) throw new Error('khong-ho-tro: video khong co khung hinh nao')
    return { video: moov.video, tieng: moov.tieng, mauV, mauA }
  }

  const api = { doc, hopCon, docMoov }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else goc.Mp4Doc = api
})(typeof window !== 'undefined' ? window : globalThis)
