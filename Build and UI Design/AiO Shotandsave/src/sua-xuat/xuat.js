'use strict'
/* =========================================================================
   AiO Shot & Save — BO MAY XUAT VIDEO DA SUA (06/11/2026), chay trong cua so AN (src/sua-video.js tao).
   Vao: file MP4 do app quay (H.264 [+ AAC/Opus], MP4 phan manh) + tuy chon cua man Sua video:
        { tuMs, denMs, giuTieng, zoom: { bat, muc }, nen: { kieu, gd, mau, le, bo, bong } } + file phu con tro.
   Ra: file MP4 MOI (moov dau file, khong phan manh) gui ve main theo tung khuc byte; file goc khong bao gio bi dung toi.

   Cach lam (VE LAI TUNG KHUNG qua canvas):
     1. Mp4Doc doc muc luc -> bang khung hinh + bang goi tieng theo thoi gian (us).
     2. VideoDecoder giai ma MOT LUOT tu khung khoa gan nhat truoc diem cat (khung truoc diem cat bo di).
     3. Moi khung: may quay (zoom theo con tro, MayQuay) + nen/bo goc/bong (SuaRender) ve len canvas -> VideoFrame ->
        VideoEncoder H.264 -> Mp4Muxer.
     4. TIENG: CHEP NGUYEN cac goi AAC/Opus nam trong [tuMs, denMs) sang file moi, thoi gian tru cung mot moc voi hinh
        -> khong nen lai tieng, khong lech.
   Thoi gian: khung hinh o thoi diem `ts` (file goc) nam o `ts - tu` trong file moi (khung dang hien luc `tu` nam o 0). Goi tieng
   dau tien la goi gan `tu` nhat va nam o 0, cac goi sau tru cung goi do (xem chu thich o `tA0`): sai lech tieng-hinh toi da ~11 ms
   so voi file goc (bo ghep MP4 khong giu duoc do lech dau cua tung duong).
   ========================================================================= */
;(() => {
const cau = window.cau
const nghi = (ms) => new Promise((r) => setTimeout(r, ms))

/* Chon ma hoa H.264 may nay ho tro (thu tu: cao -> thap). Level theo co khung. */
async function chonMaHoa(W, H, bps, fps) {
  const dienTich = W * H
  const ds = dienTich > 1920 * 1088
    ? ['avc1.640033', 'avc1.640032', 'avc1.64002A', 'avc1.4D0033']
    : ['avc1.64002A', 'avc1.640028', 'avc1.4D0028', 'avc1.42E01F']
  for (const codec of ds) {
    const cfg = { codec, width: W, height: H, bitrate: bps, framerate: fps, latencyMode: 'quality', avc: { format: 'avc' } }
    try { const r = await VideoEncoder.isConfigSupported(cfg); if (r && r.supported) return r.config } catch (e) {}
  }
  throw new Error('khong-ho-tro: may khong ma hoa duoc H.264 ' + W + 'x' + H)
}

async function chay() {
  const v = await cau.viec()
  if (!v) throw new Error('khong co viec')
  const o = v.tuyChon || {}
  const t0 = performance.now()
  const tep = Mp4Doc.doc({ kich: v.kich, doc: cau.doc })
  const { video, tieng, mauV, mauA } = tep
  const ts0 = mauV[0].ts
  const cuoiV = mauV[mauV.length - 1]
  const tongUs = cuoiV.ts + cuoiV.dur - ts0 // thoi luong video (us) tinh tu khung dau
  let tu = Math.max(0, Math.round((Number(o.tuMs) || 0) * 1000)) + ts0
  let den = o.denMs > 0 ? Math.min(Math.round(o.denMs * 1000) + ts0, ts0 + tongUs) : ts0 + tongUs
  if (!(den - tu >= 100000)) throw new Error('doan cat qua ngan (can it nhat 0,1 giay)')

  // --- khung can xuat: [iA, iB]; giai ma tu khung khoa iK <= iA ---
  let iA = mauV.findIndex((k) => k.ts + k.dur > tu)
  if (iA < 0) throw new Error('khong co khung nao trong doan cat')
  let iB = iA
  while (iB + 1 < mauV.length && mauV[iB + 1].ts < den) iB++
  let iK = iA
  while (iK > 0 && !mauV[iK].khoa) iK--
  if (!mauV[iK].khoa) throw new Error('khong tim thay khung khoa de bat dau giai ma')
  const soKhung = iB - iA + 1

  // --- tieng: cac goi nam trong [tu, den) ---
  const giuTieng = o.giuTieng !== false && !!tieng && mauA.length > 0
  /* Goi dau tien = goi co diem bat dau GAN tu NHAT (<= nua goi ~ 11 ms), gan thoi gian 0 cua file moi. ☠️ Bo ghep MP4 coi mau dau
     cua moi duong bat dau o 0 (khong co do lech dau): goi dau o 13,7 ms thi nguyen duong tieng bi keo SOM 13,7 ms so voi hinh
     (do 06/11: bip lech -15 ms so voi file goc). Chon goi gan nhat va tru theo CHINH goi do thi sai lech toi da chi ~11 ms. */
  let goiA = []
  let tA0 = tu
  if (giuTieng) {
    let i0 = 0
    for (let i = 0; i < mauA.length; i++) { if (Math.abs(mauA[i].ts - tu) < Math.abs(mauA[i0].ts - tu)) i0 = i }
    tA0 = mauA[i0].ts
    goiA = mauA.slice(i0).filter((a) => a.ts < den)
  }

  // --- kich thuoc khung ra: bang video goc, so chan ---
  const chan = (n) => Math.max(2, Math.floor(n / 2) * 2)
  const W = chan(video.w), H = chan(video.h)
  const moiGiay = soKhung / Math.max(0.1, (den - tu) / 1e6)
  const fps = Math.max(10, Math.min(60, Math.round(moiGiay)))
  const bps = Math.max(2000000, Math.min(24000000, Math.round(W * H * fps * 0.07 * 1.5)))
  const cfgMa = await chonMaHoa(W, H, bps, fps)

  // --- may quay (zoom theo con tro) ---
  let cam = null
  if (o.zoom && o.zoom.bat) {
    if (!v.conTro || !v.conTro.mau || v.conTro.mau.length < 2) throw new Error('khong co du lieu con tro de tu phong to')
    cam = MayQuay.tinh(v.conTro.mau, { tre: v.conTro.tre, thoiLuongMs: tongUs / 1000, muc: o.zoom.muc || 'vua', w: v.conTro.w || video.w, h: v.conTro.h || video.h })
    if (!cam) throw new Error('khong tinh duoc may quay tu du lieu con tro')
  }

  // --- canvas + bo ve ---
  const mk = (w, h) => new OffscreenCanvas(w, h)
  const cv = new OffscreenCanvas(W, H)
  const ctx = cv.getContext('2d', { alpha: false })
  const bove = SuaRender.taoVe(W, H, o.nen || { kieu: 'khong' }, mk)

  // --- ghep MP4 ---
  let tongByte = 0
  const target = new Mp4Muxer.StreamTarget({
    onData: (data, vt) => { cau.ghi(vt, data); if (vt + data.byteLength > tongByte) tongByte = vt + data.byteLength },
    chunked: true,
  })
  const muxCfg = {
    target,
    video: { codec: 'avc', width: W, height: H },
    fastStart: { expectedVideoChunks: soKhung + 2, expectedAudioChunks: goiA.length + 2 },
    firstTimestampBehavior: 'cross-track-offset',
  }
  if (giuTieng) muxCfg.audio = { codec: tieng.loai === 'opus' ? 'opus' : 'aac', numberOfChannels: tieng.kenh || 2, sampleRate: tieng.tanSo || 48000 }
  const mux = new Mp4Muxer.Muxer(muxCfg)

  let loi = null
  let daMa = 0
  let ai = 0 // goi tieng ke tiep can ghi
  let daGhiMetaA = false
  const ghiTieng = (denUs) => { // ghi cac goi tieng co thoi diem (trong file moi) <= denUs
    while (ai < goiA.length && goiA[ai].ts - tA0 <= denUs) {
      const a = goiA[ai++]
      const chunk = new EncodedAudioChunk({ type: 'key', timestamp: a.ts - tA0, duration: a.dur, data: cau.doc(a.vt, a.size) })
      if (!daGhiMetaA) {
        daGhiMetaA = true
        mux.addAudioChunk(chunk, { decoderConfig: { codec: tieng.codec, numberOfChannels: tieng.kenh || 2, sampleRate: tieng.tanSo || 48000, description: tieng.description || undefined } })
      } else mux.addAudioChunk(chunk)
    }
  }
  const enc = new VideoEncoder({
    output: (chunk, meta) => {
      try { mux.addVideoChunk(chunk, meta); daMa++; ghiTieng(chunk.timestamp) } catch (e) { loi = loi || e }
    },
    error: (e) => { loi = loi || e },
  })
  enc.configure(cfgMa)

  // --- giai ma + ve + ma hoa ---
  const cfgGm = { codec: video.codec, codedWidth: video.w, codedHeight: video.h, description: video.avcC }
  const ho = await VideoDecoder.isConfigSupported(cfgGm)
  if (!ho || !ho.supported) throw new Error('khong-ho-tro: may khong giai ma duoc ' + video.codec + ' ' + video.w + 'x' + video.h)
  const cho = [] // khung da giai ma, dang cho ve
  let daGm = 0
  const dec = new VideoDecoder({
    output: (f) => { cho.push(f) },
    error: (e) => { loi = loi || e },
  })
  dec.configure(cfgGm)

  let daVe = 0
  let daXl = 0 // so khung da xu ly xong (ke ca khung bo di truoc diem cat)
  const xuLy = async (f) => {
    try {
      const ts = f.timestamp
      if (ts + (f.duration || 0) <= tu && ts < tu) { return } // khung truoc diem cat (chi giai ma de co khung tham chieu)
      if (ts >= den) return
      const camT = cam ? cam.at((ts - ts0) / 1000) : null
      bove.ve(ctx, f, f.displayWidth, f.displayHeight, camT)
      const outTs = Math.max(0, ts - tu)
      const dur = Math.max(1000, Math.min((f.duration || 33333) - Math.max(0, tu - ts), den - Math.max(ts, tu)))
      const vf = new VideoFrame(cv, { timestamp: outTs, duration: dur })
      try { enc.encode(vf, { keyFrame: daVe % (fps * 2) === 0 }) } finally { vf.close() }
      daVe++
      while (enc.encodeQueueSize > 8 && !loi) await nghi(2)
    } finally { f.close(); daXl++ }
  }
  const rut = async () => { while (cho.length) await xuLy(cho.shift()) }

  for (let i = iK; i <= iB; i++) {
    if (loi) break
    const k = mauV[i]
    dec.decode(new EncodedVideoChunk({ type: k.khoa ? 'key' : 'delta', timestamp: k.ts, duration: k.dur, data: cau.doc(k.vt, k.size) }))
    daGm++
    // khong de qua nhieu khung da giai ma don lai (moi khung giu bo nho GPU)
    while ((daGm - daXl - cho.length > 20 || cho.length > 6) && !loi) { await rut(); await nghi(1) }
    await rut()
    if ((i - iK) % 8 === 0) cau.tienDo(Math.min(0.97, (i - iK + 1) / (iB - iK + 1)))
  }
  if (!loi) { await dec.flush(); await rut() }
  try { dec.close() } catch (e) {}
  if (loi) throw loi
  await enc.flush()
  try { enc.close() } catch (e) {}
  if (loi) throw loi
  if (daMa !== daVe) throw new Error('so khung ma hoa (' + daMa + ') khac so khung da ve (' + daVe + ')')
  if (daVe < 1) throw new Error('khong xuat duoc khung hinh nao')
  ghiTieng(Infinity)
  mux.finalize()
  cau.tienDo(1)
  cau.xong({ khung: daVe, khungDuKien: soKhung, w: W, h: H, ms: Math.round((den - tu) / 1000), bytes: tongByte, tieng: giuTieng, goiTieng: goiA.length, msLam: Math.round(performance.now() - t0), codec: cfgMa.codec })
}

chay().catch((e) => { cau.loi((e && e.message) || String(e)) })
})()
