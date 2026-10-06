'use strict'
/* =========================================================================
   AiO Shot & Save — BO MAY XUAT GIF (06/10/2026), chay trong cua so AN (src/xuat-gif.js tao).
   Vao: file MP4 do app quay (H.264, MP4 PHAN MANH: ftyp + moov + [moof + mdat]...). Ra: cac khuc byte GIF gui ve main.

   VI SAO TU TACH HOP MP4 + WebCodecs chu khong tua <video> tung khung (do 06/10, cua so an, may cong ty):
   tua `currentTime` moi khung phai giai ma lai tu khung khoa gan nhat (khung khoa cach nhau ~100 khung = 3,3 giay):
   video 2404x1314 cua anh mat 92 ms / khung -> doan 17 giay mat ~20 giay, doan 5 phut ~6 phut. Giai ma MOT LUOT tu
   dau toi cuoi thi moi khung chi giai ma dung 1 lan.

   File app quay (soi 06/10): trun co thoi luong + kich thuoc TUNG khung (flags 0x305), khong co do lech hien thi
   (khong B-frame), khung dau moi moof la khung khoa, tfhd dung "goc = dau moof". Bo tach duoi day doc dung cac co do
   va van xu ly cac co con lai (mac dinh trong tfhd, goc tuyet doi, do lech cts) de file la khong lam sai lang le.

   CACH GHI GIF (doc video HAI luot):
   - Luot 1: lay mau mau suot ca doan (moi 300 ms mot hinh, moi hinh ~10.000 diem trai deu) -> MOT bang mau chung
     255 mau + 1 o trong suot cho ca file.
   - Luot 2: moi `buocMs` (100 ms = 10 hinh / giay, khop don vi 1/100 giay cua GIF) lay 1 hinh, doi sang chi so mau.
     Chi ghi DIEM ANH DA DOI (chi so mau khac hinh dang hien VA mau nguon lech qua `nguong` so voi luc diem do duoc
     ghi lan cuoi); cho con lai de TRONG SUOT, hinh cu giu nguyen. Quay man hinh phan lon dung yen nen file nho di rat
     nhieu. Hinh khong doi gi -> khong ghi khung moi, khung truoc dung lau hon.

   ☠️ DA THU VA BO (06/10): bang mau RIENG cho tung khung, tinh tu cac diem vua doi. So do dep (so khung, thoi luong
   dung, lech trung binh 2-8 don vi mau, 0 % diem lech nang) ma HINH LOANG LO: hai diem canh nhau cung mau nguon nhung
   duoc ghi o hai thoi diem thi ra hai mau lech 10-20 don vi (hai bang mau khac nhau) -> mang loang theo hinh vung
   thay doi, ro nhat tren nen toi min. Bat duoc nho MO ANH RA NHIN (3 tang cung thoi diem: khung giai ma sach, hinh ghep
   loang, hinh Chromium doc lai = hinh ghep). Bang mau chung: cung mau nguon luon ra cung mot mau.

   ☠️ Bay cua gifenc (doc ma 06/10): quantize() / applyPalette() doc CA vung nho goc (`new Uint32Array(rgba.buffer)`),
   bo qua byteOffset -> phai dua mang DUNG kich thuoc, khong dua subarray. Che do `auto` + reset() se ghi lai dau file
   moi khung -> dung `auto: false`, tu goi writeHeader() 1 lan va danh dau `first` cho khung dau.
   ========================================================================= */
;(() => {
const { GIFEncoder, quantize, applyPalette } = window.gifenc
const cau = window.cau

const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
const i32 = (b, i) => (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]
const u64 = (b, i) => u32(b, i) * 4294967296 + u32(b, i + 4)
const ten4 = (b, i) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3])
const hex2 = (v) => v.toString(16).padStart(2, '0')
const nghi = (ms) => new Promise((r) => setTimeout(r, ms))

/* Cac hop con nam trong [dau, cuoi) cua mang b -> [{ t, dau (sau phan dau hop), cuoi }] */
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

/* moov -> duong HINH H.264 dau tien: { id, nhip (timescale), w, h, avcC, codec } hoac null */
function docMoov(b, dau, cuoi) {
  for (const trak of hopCon(b, dau, cuoi)) {
    if (trak.t !== 'trak') continue
    const tkhd = tim(b, trak, 'tkhd'), mdia = tim(b, trak, 'mdia')
    const hdlr = tim(b, mdia, 'hdlr'), mdhd = tim(b, mdia, 'mdhd')
    if (!tkhd || !hdlr || !mdhd || ten4(b, hdlr.dau + 8) !== 'vide') continue
    const stsd = tim(b, tim(b, tim(b, mdia, 'minf'), 'stbl'), 'stsd')
    if (!stsd) continue
    const e = stsd.dau + 8 // muc mo ta dau tien: [kich 4][loai 4]...
    const loai = ten4(b, e + 4)
    if (loai !== 'avc1' && loai !== 'avc3') continue
    const avcC = hopCon(b, e + 86, e + u32(b, e)).find((x) => x.t === 'avcC')
    if (!avcC) continue
    return {
      id: u32(b, tkhd.dau + (b[tkhd.dau] ? 20 : 12)),
      nhip: u32(b, mdhd.dau + (b[mdhd.dau] ? 20 : 12)) || 30000,
      w: (b[e + 32] << 8) | b[e + 33], h: (b[e + 34] << 8) | b[e + 35],
      avcC: b.slice(avcC.dau, avcC.cuoi),
      codec: 'avc1.' + hex2(b[avcC.dau + 1]) + hex2(b[avcC.dau + 2]) + hex2(b[avcC.dau + 3]),
    }
  }
  return null
}

/* moof (b = ca hop, bat dau tu byte dau cua hop; viTri = vi tri cua no trong file) -> cac khung cua duong `id`:
   [{ vt (vi tri trong file), size, t (don vi nhip), dur, cts, khoa }]. tChay = thoi diem noi tiep neu khong co tfdt. */
function docMoof(b, dauCon, viTri, id, tChay) {
  const ra = []
  for (const traf of hopCon(b, dauCon, b.length)) {
    if (traf.t !== 'traf') continue
    const tfhd = tim(b, traf, 'tfhd')
    if (!tfhd || u32(b, tfhd.dau + 4) !== id) continue
    const fl = u32(b, tfhd.dau) & 0xffffff
    let q = tfhd.dau + 8
    let goc = viTri // "goc = dau moof" (0x20000) va ca khi khong ghi gi: tinh tu dau moof
    if (fl & 0x1) { goc = u64(b, q); q += 8 }
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
      if (f & 0x1) { vt = goc + i32(b, p); p += 4 } else if (vt === null) vt = goc
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

async function chay() {
  const v = await cau.viec()
  if (!v) throw new Error('khong co viec')
  const BUOC = v.buocMs > 0 ? v.buocMs : 100
  const TOI_DA = v.toiDaMs > 0 ? v.toiDaMs : Infinity
  const NGUONG = v.nguong >= 0 ? v.nguong : 6 // tong lech 3 kenh mau <= NGUONG thi coi la KHONG doi (nhieu cua bo nen video)

  // --- Doc muc luc file: moov (1 lan) + vi tri cac moof ---
  let moov = null
  const moofs = []
  for (let vt = 0; vt + 8 <= v.kich;) {
    const hd = cau.doc(vt, 16)
    if (hd.length < 8) break
    let n = u32(hd, 0), dauCon = 8
    const t = ten4(hd, 4)
    if (n === 1 && hd.length >= 16) { n = u64(hd, 8); dauCon = 16 } else if (n === 0) n = v.kich - vt
    if (n < dauCon) break
    if (t === 'moov' && !moov) { const b = cau.doc(vt, n); moov = docMoov(b, dauCon, b.length) } else if (t === 'moof') moofs.push({ vt, n, dauCon })
    vt += n
  }
  if (!moov) throw new Error('khong-ho-tro: file khong co duong hinh H.264')
  if (!moofs.length) throw new Error('khong-ho-tro: file khong phai MP4 phan manh')
  const cfg = { codec: moov.codec, codedWidth: moov.w, codedHeight: moov.h, description: moov.avcC }
  const ho = await VideoDecoder.isConfigSupported(cfg)
  if (!ho || !ho.supported) throw new Error('khong-ho-tro: may khong giai ma duoc ' + moov.codec + ' ' + moov.w + 'x' + moov.h)

  /* Giai ma ca file MOT luot, goi nhan(frame, tt ms tinh tu khung dau, thoi luong ms) theo thu tu hien.
     nhan tra false = du roi, dung som. baoTienDo(0..1) theo so byte da di qua. */
  async function duyet(nhan, baoTienDo) {
    let loi = null, dung = false, daGui = 0, daNhan = 0, t0 = null
    const dec = new VideoDecoder({
      output: (frame) => {
        daNhan++
        try {
          if (dung) return
          const t = frame.timestamp / 1000
          if (t0 === null) t0 = t
          if (nhan(frame, t - t0, (frame.duration || 0) / 1000) === false) dung = true
        } catch (e) { loi = e; dung = true } finally { frame.close() }
      },
      error: (e) => { loi = e; dung = true },
    })
    dec.configure(cfg)
    let tChay = 0, coKhoa = false
    for (let so = 0; so < moofs.length; so++) {
      const m = moofs[so]
      if (dung) break
      const b = cau.doc(m.vt, m.n)
      let ks = docMoof(b, m.dauCon, m.vt, moov.id, tChay)
      /* File bi CUT cuoi (doan quay "Bi ngat": app bi tat giua luc quay) -> khung nam ngoai file. Lay cac khung con du
         du lieu (chung lien nhau tu dau doan) roi dung o day: van ra GIF cua phan con xem duoc, khong bao loi. */
      const du = ks.findIndex((k) => k.vt + k.size > v.kich)
      const cutCuoi = du >= 0
      if (cutCuoi) ks = ks.slice(0, du)
      if (ks.length) {
        const k9 = ks[ks.length - 1]
        tChay = k9.t + k9.dur
        let lo = Infinity, hi = 0
        for (const k of ks) { if (k.vt < lo) lo = k.vt; if (k.vt + k.size > hi) hi = k.vt + k.size }
        const data = hi - lo <= 96 * 1024 * 1024 ? cau.doc(lo, hi - lo) : null // 1 moof ~ 3 giay; qua lon thi doc tung khung
        for (const k of ks) {
          if (dung) break
          if (!coKhoa && !k.khoa) continue // bo doan dau chua co khung khoa
          coKhoa = true
          dec.decode(new EncodedVideoChunk({
            type: k.khoa ? 'key' : 'delta',
            timestamp: Math.round((k.t + k.cts) * 1e6 / moov.nhip),
            duration: Math.round(k.dur * 1e6 / moov.nhip),
            data: data ? data.subarray(k.vt - lo, k.vt - lo + k.size) : cau.doc(k.vt, k.size),
          }))
          daGui++
          while (daGui - daNhan > 24 && !dung) await nghi(1) // khong de khung da giai ma don dong (moi khung giu bo nho GPU)
        }
      }
      if (cutCuoi) { baoTienDo(1); break }
      baoTienDo((so + 1) / moofs.length) // theo SO DOAN, khong theo vi tri byte: sau moof cuoi con ca khoi du lieu nen ti le byte khong toi 1 (do 06/10: dung o 83 %)
    }
    if (loi) throw loi
    if (!dung) await dec.flush()
    try { dec.close() } catch (e) {}
    if (loi) throw loi
  }

  let w = 0, h = 0, N = 0, cx = null
  const veRa = (frame) => { // ve khung ra canvas co GIF, tra mang RGBA cua no (ImageData: vung nho rieng, dung kich thuoc)
    if (!cx) {
      const tl = Math.min(1, v.canhDai / Math.max(frame.displayWidth, frame.displayHeight))
      w = Math.max(1, Math.round(frame.displayWidth * tl)); h = Math.max(1, Math.round(frame.displayHeight * tl)); N = w * h
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h
      cx = cv.getContext('2d', { willReadFrequently: true })
      cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'
    }
    cx.drawImage(frame, 0, 0, w, h)
    return cx.getImageData(0, 0, w, h).data
  }

  // --- LUOT 1: lay mau mau suot ca doan -> bang mau chung ---
  const mau = []
  let mauTiep = 0, soMau = 0
  await duyet((frame, tt) => {
    if (tt >= TOI_DA) return false
    if (tt < mauTiep) return
    mauTiep = tt + 300
    const d = veRa(frame)
    const px = new Uint32Array(d.buffer, d.byteOffset, N)
    const buoc = Math.max(1, Math.floor(N / 10000))
    const lech = soMau % buoc // moi hinh lech mot nhip de khong lay mai cung mot cot diem
    const m = new Uint32Array(Math.ceil((N - lech) / buoc))
    let j = 0
    for (let i = lech; i < N; i += buoc) m[j++] = px[i]
    mau.push(j === m.length ? m : m.subarray(0, j)); soMau++
  }, (p) => cau.tienDo(p * 0.3))
  if (!mau.length) throw new Error('video khong co khung hinh nao')
  let tong = 0
  for (const m of mau) tong += m.length
  const tat = new Uint32Array(tong) // mang DUNG kich thuoc (bay gifenc)
  for (let k = 0, o = 0; k < mau.length; k++) { tat.set(mau[k], o); o += mau[k].length }
  const bangThat = quantize(new Uint8Array(tat.buffer), 255, { format: 'rgb565' }) // chi cac mau THAT: dung de doi mau
  const TRONG = bangThat.length // o trong suot nam sau cac mau that
  const bang = bangThat.concat([[0, 0, 0]]) // bang ghi vao file = mau that + o trong suot
  const bang32 = bang.map((m) => (255 << 24 | m[2] << 16 | m[1] << 8 | m[0]) >>> 0)

  // --- LUOT 2: ghi GIF ---
  const gif = GIFEncoder({ auto: false, initialCapacity: 1 << 20 })
  gif.writeHeader()
  const goc = new Uint32Array(N)  // mau nguon cua tung diem luc diem do duoc ghi lan cuoi (RGBA 32 bit)
  const hien = new Uint8Array(N)  // chi so mau dang HIEN o tung diem (dung cai trinh xem GIF se thay)
  let cho = null       // khung dang cho ghi (thoi gian cua no chi biet khi co hinh moi / het doan)
  let tiep = 0         // moc thoi gian (ms) cua hinh GIF ke tiep
  let cuoiMs = 0       // thoi diem ket thuc cua khung nguon cuoi cung da thay
  let soKhung = 0, tongMs = 0, tongByte = 0, cat = false
  const tk = v.tuKiem ? { so: 0, tong: 0, max: 0, mocMax: 0, xauMax: 0, mocXau: 0 } : null

  const guiByte = () => { const b = gif.bytes(); gif.reset(); if (b.length) { tongByte += b.length; cau.khuc(b) } }
  const ghi = (c) => {
    gif.writeFrame(c.index, w, h, {
      first: soKhung === 0, palette: soKhung === 0 ? bang : null, delay: c.delay, repeat: 0,
      transparent: !c.dau, transparentIndex: TRONG, dispose: 1, // 1 = giu nguyen hinh cu
    })
    soKhung++; tongMs += c.delay
    guiByte()
  }

  /* moc = moc thoi gian (ms, boi cua BUOC) ma hinh nay bat dau hien. Thoi gian cua khung TRUOC = moc - moc cua no:
     tinh tu MOC chu khong cong don tung buoc (cong don de lech khi hinh khong doi xen ke voi moc bi nhay). */
  function xuLy(frame, moc) {
    const d = veRa(frame)
    const px = new Uint32Array(d.buffer, d.byteOffset, N)
    const idx = applyPalette(d, bangThat, 'rgb565') // KHONG dua o trong suot vao day: diem den that se bi doi thanh "trong suot"
    if (!cho) { // hinh dau: ghi tron
      hien.set(idx); goc.set(px)
      cho = { index: idx, delay: BUOC, dau: true, luc: moc }
      if (tk) tuKiem(px, moc)
      return
    }
    const ra = new Uint8Array(N).fill(TRONG)
    let n = 0
    for (let i = 0; i < N; i++) {
      const k = idx[i]
      if (k === hien[i]) continue
      const a = px[i], b = goc[i]
      let e = (a & 255) - (b & 255); let s = e < 0 ? -e : e
      e = ((a >>> 8) & 255) - ((b >>> 8) & 255); s += e < 0 ? -e : e
      e = ((a >>> 16) & 255) - ((b >>> 16) & 255); s += e < 0 ? -e : e
      if (s <= NGUONG) continue // chi so doi nhung mau nguon gan nhu dung yen (nhieu cua bo nen): khong ghi, khoi nhap nhay
      ra[i] = k; hien[i] = k; goc[i] = a; n++
    }
    if (tk) tuKiem(px, moc)
    if (n === 0) return // hinh khong doi: khung truoc cu dung tiep
    cho.delay = Math.max(BUOC, moc - cho.luc)
    ghi(cho)
    cho = { index: ra, delay: BUOC, dau: false, luc: moc }
  }

  /* TU KIEM (chi khi bai do bat `tuKiem`): hinh ma trinh xem GIF se hien = bang mau[hien[i]]; so voi hinh nguon cua moc
     do. lech trung binh moi kenh mau + ti le diem lech nang (tong 3 kenh > 90). `soiMoc` = xin 2 anh cua dung moc do.
     KHONG thay cho viec doc lai file GIF bang bo giai ma ngoai va MO ANH RA NHIN (so nay tung dep trong khi hinh loang). */
  function tuKiem(px, moc) {
    let s = 0, xau = 0
    for (let i = 0; i < N; i++) {
      const a = px[i], b = bang32[hien[i]]
      let k = (a & 255) - (b & 255); let e = k < 0 ? -k : k
      k = ((a >>> 8) & 255) - ((b >>> 8) & 255); e += k < 0 ? -k : k
      k = ((a >>> 16) & 255) - ((b >>> 16) & 255); e += k < 0 ? -k : k
      s += e; if (e > 90) xau++
    }
    if (v.soiMoc === moc) {
      tk.anhNguon = cx.canvas.toDataURL('image/png')
      const g = new Uint32Array(N)
      for (let i = 0; i < N; i++) g[i] = bang32[hien[i]]
      const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h
      cv2.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(g.buffer), w, h), 0, 0)
      tk.anhGhep = cv2.toDataURL('image/png')
    }
    const tb = s / (N * 3), ptXau = xau * 100 / N
    tk.so++; tk.tong += tb
    if (tb > tk.max) { tk.max = tb; tk.mocMax = moc }
    if (ptXau > tk.xauMax) { tk.xauMax = ptXau; tk.mocXau = moc }
  }

  await duyet((frame, tt, dai) => {
    if (tt + dai > cuoiMs) cuoiMs = tt + dai
    if (tt >= TOI_DA) { cat = true; return false }
    if (tt < tiep - 0.5) return // chua toi moc lay hinh
    // moc gan nhat <= tt (cac moc bi nhay qua: hinh truoc dung them). ☠️ max(0): khung den som 0,5 ms (tt hoi nho hon
    // tiep) cho floor = -1 -> moc lui 1 buoc, `tiep` dung yen -> ra THUA khung (do 06/10: 99 khung cho doan 9,61 giay).
    const moc = tiep + Math.max(0, Math.floor((tt - tiep) / BUOC + 1e-6)) * BUOC
    tiep = moc + BUOC
    xuLy(frame, moc)
  }, (p) => cau.tienDo(0.3 + p * 0.69))
  if (!cho) throw new Error('video khong co khung hinh nao')
  // Khung cuoi dung toi het doan (hoac toi tran)
  const het = Math.min(cuoiMs, TOI_DA)
  cho.delay = Math.max(BUOC, Math.round((het - cho.luc) / BUOC) * BUOC)
  ghi(cho)
  gif.finish()
  guiByte()
  const tt = { khung: soKhung, w, h, ms: tongMs, bytes: tongByte, cat, nguonMs: Math.round(cuoiMs), soMau: TRONG }
  if (tk) tt.tuKiem = { soHinh: tk.so, lechTB: +(tk.tong / Math.max(1, tk.so)).toFixed(2), lechMax: +tk.max.toFixed(2), mocMax: tk.mocMax, ptDiemXauMax: +tk.xauMax.toFixed(2), mocXau: tk.mocXau, anhNguon: tk.anhNguon, anhGhep: tk.anhGhep }
  cau.xong(tt)
}

chay().catch((e) => cau.loi((e && e.message) || e))
})()
