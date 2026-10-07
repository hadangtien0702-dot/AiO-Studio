'use strict'
/* Renderer cua LUONG CHUP CHAY SAN (xem src/luong-chup.js). Giu mot <video> cho moi man,
   nhan 'luong:lay' thi ve video len canvas -> gui JPEG (nhe, truoc) roi BGRA raw (sau). */

const vids = [] // { v, c }

window.batDauLuong = async function (cfg) {
  try {
    for (const c of cfg) {
      const st = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: { width: { ideal: c.w }, height: { ideal: c.h }, frameRate: { max: c.fps } },
      })
      const v = document.createElement('video')
      v.srcObject = st; v.muted = true
      await v.play()
      const track = st.getVideoTracks()[0]
      if (track) track.addEventListener('ended', () => window.luong.ketThuc(c.displayId))
      vids.push({ v, c })
    }
    window.luong.sanSang({ man: vids.length, kich: vids.map((x) => x.v.videoWidth + 'x' + x.v.videoHeight).join(' | ') })
  } catch (e) {
    window.luong.loi((e && e.name) + ': ' + (e && e.message))
  }
}

window.luong.onLay(async ({ gen, nhanh, gui }) => {
  // Dot 1: JPEG moi man (hien overlay). Dot 2: raw BGRA (cat luc Xong).
  // 07/10: bam gio tung buoc (ms) gui kem ve main de run-log noi duoc cham o DAU: cho lenh · ve · nen · doc diem · doi mau.
  const choLenh = gui ? Math.max(0, Date.now() - gui) : -1
  const tVe0 = performance.now()
  const khung = []
  for (const { v, c } of vids) {
    const w = v.videoWidth || c.w, h = v.videoHeight || c.h
    const cv = new OffscreenCanvas(w, h)
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(v, 0, 0, w, h)
    khung.push({ cv, ctx, w, h, c })
  }
  // Dot 0 (15/09): JPEG NHANH nua do phan giai, q0.8 (~20-40 ms/man) -> overlay co nen ngay,
  // het khoang trong suot nhin xuyen xuong video (MPO) ra DEN trong luc doi JPEG day du.
  for (const k of (nhanh ? khung : [])) {
    const nw = Math.max(1, Math.round(k.w / 2)), nh = Math.max(1, Math.round(k.h / 2))
    const cn = new OffscreenCanvas(nw, nh)
    cn.getContext('2d').drawImage(k.cv, 0, 0, nw, nh)
    const blob = await cn.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
    const buf = await blob.arrayBuffer()
    window.luong.guiKhung({ gen, displayId: k.c.displayId, loai: 'nhanh', buf })
  }
  const ve = Math.round(performance.now() - tVe0)
  for (const k of khung) {
    const tNen = performance.now()
    const blob = await k.cv.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
    const buf = await blob.arrayBuffer()
    window.luong.guiKhung({ gen, displayId: k.c.displayId, loai: 'jpg', buf, do: { cho: choLenh, ve, nen: Math.round(performance.now() - tNen) } })
  }
  for (const k of khung) {
    const tDoc = performance.now()
    const id = k.ctx.getImageData(0, 0, k.w, k.h)
    const doc = Math.round(performance.now() - tDoc)
    const tDoi = performance.now()
    // RGBA -> BGRA (nativeImage.createFromBitmap doc theo toBitmap = BGRA tren Windows).
    const u32 = new Uint32Array(id.data.buffer)
    for (let i = 0; i < u32.length; i++) {
      const p = u32[i] // little-endian: 0xAABBGGRR
      u32[i] = (p & 0xff00ff00) | ((p & 0x00ff0000) >>> 16) | ((p & 0x000000ff) << 16)
    }
    window.luong.guiKhung({ gen, displayId: k.c.displayId, loai: 'raw', w: k.w, h: k.h, buf: id.data.buffer, do: { doc, doi: Math.round(performance.now() - tDoi), luc: Date.now() } })
  }
})

/* 28/09 QUAY 3 GIAY (Multi-Shot Storyboard): cat DUNG vung khoanh tu video dang chay, tra JPEG q0.95.
   rect la DIP cuc bo cua man; dipW/dipH = kich thuoc DIP cua man -> quy doi theo co video THAT
   (video co the khong dung co native). Khong gui ca man raw nhu 'luong:lay' (4K ~33MB x 6 lan). */
window.luong.onCat(async ({ id, displayId, rect, dipW, dipH }) => {
  try {
    const x = vids.find((o) => String(o.c.displayId) === String(displayId)) || vids[0]
    if (!x) { window.luong.guiCat({ id, loi: 'khong co luong' }); return }
    const v = x.v
    const vw = v.videoWidth || x.c.w, vh = v.videoHeight || x.c.h
    const kx = vw / dipW, ky = vh / dipH
    const sx = Math.max(0, Math.round(rect.x * kx)), sy = Math.max(0, Math.round(rect.y * ky))
    const sw = Math.max(1, Math.min(vw - sx, Math.round(rect.w * kx)))
    const sh = Math.max(1, Math.min(vh - sy, Math.round(rect.h * ky)))
    const cv = new OffscreenCanvas(sw, sh)
    cv.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, sw, sh)
    const blob = await cv.convertToBlob({ type: 'image/jpeg', quality: 0.95 })
    window.luong.guiCat({ id, buf: await blob.arrayBuffer(), w: sw, h: sh })
  } catch (e) {
    window.luong.guiCat({ id, loi: (e && e.message) || String(e) })
  }
})

/* ── 01/10 QUAY VIDEO vung man hinh ───────────────────────────────────────────────────────────────────
   Main goi window.batDauQuay(q) (executeJavaScript co user gesture). Mo THEM mot luong 30 fps cua dung man do
   (luong 5 fps o tren giu nguyen cho viec chup), cat vung -> canvas -> canvas.captureStream -> MediaRecorder.
   - Ve bang setInterval, KHONG requestAnimationFrame: cua so nay AN, rAF dung (do 01/10: setInterval 121 lan / 4 s).
   - Co canvas la so CHAN (H.264 yuv420); vung to hon tran thi thu nho giu ti le.
   - Khuc ~1 s gui ve main theo DUNG thu tu (hang doi promise) de main ghi noi vao file.
   q: { id, tieng, rect (DIP cuc bo), dipW, dipH, w, h (co man native), fps, toiDaW, toiDaH } */
let dangQuay = null
/* Muc lam tre tieng (ms) = TRE_TIENG_GOC + TRE_TIENG_MOI_MP x (trieu diem anh cua video ra). Dat 0/0 = khong lam tre.
   Can bang so do 01/10 (may cong ty, man 4K 60 Hz, bai test:dongbotieng): khong lam tre -> tieng di TRUOC hinh
   91-121 ms (vung 600x210) va 135-151 ms (vung 2400x1350). Bang do tu no co tieng ra loa cham ~20 ms so voi hinh, nen
   dich = so do +20 ms. ☠️ Do tre cua hinh phu thuoc MAY (bo chup + card man hinh) -> may khac co the lech ±50 ms. */
const TRE_TIENG_GOC = 105
const TRE_TIENG_MOI_MP = 12

function chonKieuQuay(coTieng, soDiem) {
  const cap = soDiem > 1920 * 1080 ? '640033' : '640028' // man lon can level 5.1
  const ds = coTieng
    ? ['video/mp4;codecs=avc1.' + cap + ',mp4a.40.2', 'video/mp4;codecs=avc1.' + cap + ',opus', 'video/webm;codecs=vp9,opus']
    : ['video/mp4;codecs=avc1.' + cap, 'video/mp4', 'video/webm;codecs=vp9']
  return ds.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

window.batDauQuay = async function (q) {
  if (dangQuay) return { ok: false, loi: 'dang quay' }
  const t0 = performance.now()
  let st = null
  /* ☠️ 01/10 anh xem lai video thay "giut, nhu thieu fps". Do: file ghi 30 khung/giay nhung HINH THAT chi doi 5 lan/giay
     (bang dem: so nhay moi 12 lan man ve lai; file that cua anh: hinh doi moi 6 khung, 13 % khung co hinh moi).
     Goc: luong chay san cua CUNG man hinh dang xin toi da 5 khung/giay, va Chromium chia chung mot bo chup cho moi
     luong cua cung man -> luong quay 30 fps mo them van chi nhan 5 hinh/giay. Sua (q.nang !== false): trong luc quay
     NANG gioi han cua luong chay san cua man do len bang q.fps, quay xong HA lai (`haNen`). Do bang bang dem (npm run test:nhipquay, man 60 Hz): truoc 0 % khung dung nhip + 76 % khung lap; sau 92-94 % dung nhip, 0 lap, 0 rot. 6-8 % con lai la khung lech 1 lan ve man (50 ms thay vi 33 ms): bo chup cua Chromium lay mau khong bam nhip man hinh. Da thu xin nguon 32 / 36 / 45 / 60 khung/giay: KHONG deu hon (36 -> 72 %, 45-60 -> 50 %, nguon thuc chi len ~40) -> giu 30. */
  let haNen = () => {}
  const nen = vids.find((o) => String(o.c.displayId) === String(q.displayId))
  const trackNen = nen && nen.v.srcObject && nen.v.srcObject.getVideoTracks()[0]
  if (trackNen && q.nang !== false) {
    try {
      await trackNen.applyConstraints({ frameRate: { max: q.fps } })
      haNen = () => { trackNen.applyConstraints({ frameRate: { max: nen.c.fps } }).catch(() => {}) }
    } catch (e) { /* khong nang duoc thi van quay, chi la hinh se thua khung */ }
  }
  try {
    st = await navigator.mediaDevices.getDisplayMedia({
      // Tieng may: tat xu ly giong noi (khu vang/khu on/tu chinh am luong) + xin 2 kenh — mac dinh ra MONO da xu ly (do 01/10)
      audio: q.tieng ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2 } : false,
      video: { width: { ideal: q.w }, height: { ideal: q.h }, frameRate: { ideal: q.fps, max: q.fps } },
    })
    const v = document.createElement('video')
    v.srcObject = st; v.muted = true
    await v.play()
    const vw = v.videoWidth || q.w, vh = v.videoHeight || q.h
    const kx = vw / q.dipW, ky = vh / q.dipH
    const sx = Math.max(0, Math.round(q.rect.x * kx)), sy = Math.max(0, Math.round(q.rect.y * ky))
    const sw = Math.max(2, Math.min(vw - sx, Math.round(q.rect.w * kx)))
    const sh = Math.max(2, Math.min(vh - sy, Math.round(q.rect.h * ky)))
    const tl = Math.min(1, q.toiDaW / sw, q.toiDaH / sh)
    const chan = (n) => Math.max(2, Math.floor(n / 2) * 2)
    const ow = chan(sw * tl), oh = chan(sh * tl)
    const cv = document.createElement('canvas')
    cv.width = ow; cv.height = oh
    const ctx = cv.getContext('2d', { alpha: false })
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, ow, oh)
    const at = st.getAudioTracks()
    /* NHIP VE (q.nhip): 'khung' = ve DUNG khi luong man hinh co khung moi (requestVideoFrameCallback) va tu day tung
       khung vao bo ghi (captureStream(0) + requestFrame) — 1 khung nguon = 1 khung ghi. 'dongho' = cach dau tien
       (setInterval + captureStream(fps)), giu lai lam DOI CHUNG. Vi sao doi: xem chu thich o cho dat o.iv ben duoi. */
    const theoKhung = q.nhip !== 'dongho' && typeof v.requestVideoFrameCallback === 'function'
    // Bo ghi TU bat khung moi lan canvas doi (tran 60/giay). KHONG dung captureStream(0) + requestFrame(): do 01/10 co
    // 2 / ~35 luot moi lan goi requestFrame ra HAI khung (ve 175 lan, file 353 khung, mot nua la khung lap).
    const trackCv = cv.captureStream(theoKhung ? 60 : q.fps).getVideoTracks()[0]
    /* LAM TRE TIENG cho khop hinh. Hinh di qua nhieu khau hon tieng (chup man -> trinh phat an -> canvas -> bo ghi) nen
       toi bo ghi TRE hon tieng; khong bu thi tieng di truoc hinh ("sai voice", anh bao 01/10). Do bang bang chop + bip
       (npm run test:dongbotieng): xem so trong PROGRESS. q.treTieng (ms) chi bai do truyen; app dung cong thuc TRE_*. */
    let trackTieng = at
    let acTre = null
    const treMs = !at.length ? 0 : (typeof q.treTieng === 'number' ? q.treTieng : Math.round(TRE_TIENG_GOC + TRE_TIENG_MOI_MP * ow * oh / 1e6))
    if (at.length && treMs > 0) {
      acTre = new AudioContext({ sampleRate: 48000 })
      const nguon = acTre.createMediaStreamSource(new MediaStream([at[0]]))
      const tre = acTre.createDelay(1)
      tre.delayTime.value = treMs / 1000
      const dich = acTre.createMediaStreamDestination()
      nguon.connect(tre); tre.connect(dich)
      trackTieng = dich.stream.getAudioTracks()
    }
    const tron = new MediaStream([trackCv, ...trackTieng])
    const mime = chonKieuQuay(at.length > 0, ow * oh)
    if (!mime) throw new Error('may khong co bo nen video nao dung duoc')
    // ~0,07 bit / diem anh / khung: 1280x720 ~1,9 Mbit/s, 1920x1080 ~4,4, 2560x1440 ~7,7 (noi dung man hinh nen rat tot)
    const bps = Math.max(1500000, Math.min(16000000, Math.round(ow * oh * q.fps * 0.07)))
    const rec = new MediaRecorder(tron, { mimeType: mime, videoBitsPerSecond: bps, audioBitsPerSecond: 160000 })
    const o = { id: q.id, st, rec, iv: null, soVe: 0, batDau: performance.now(), hang: Promise.resolve(), loi: null, tre: [], treTieng: treMs }
    rec.ondataavailable = (e) => {
      if (!e.data || !e.data.size) return
      o.hang = o.hang.then(() => e.data.arrayBuffer()).then((buf) => window.luong.guiKhucQuay({ id: q.id, buf })).catch((err) => { o.loi = String(err && err.message || err) })
    }
    rec.onerror = (e) => { o.loi = String((e && e.error && e.error.message) || 'MediaRecorder loi') }
    rec.onstop = () => {
      clearInterval(o.iv); clearTimeout(o.hen)
      const ms = Math.round(performance.now() - o.batDau)
      st.getTracks().forEach((t) => t.stop())
      haNen() // tra luong chay san ve 5 khung/giay (CPU nam nen)
      if (acTre) acTre.close().catch(() => {})
      const s = o.tre.slice().sort((a, b) => a - b)
      const tre = s.length ? { n: s.length, min: Math.round(s[0]), giua: Math.round(s[Math.floor(s.length / 2)]), p90: Math.round(s[Math.floor(s.length * 0.9)]), max: Math.round(s[s.length - 1]) } : null
      o.hang.then(() => { if (dangQuay === o) dangQuay = null; window.luong.quayXong({ id: q.id, loi: o.loi, ms, khung: o.soVe, tre, treTieng: o.treTieng || 0 }) })
    }
    // Man bi rut / luong bi cat giua chung -> dung cho sach (file da ghi toi khuc cuoi van phat duoc)
    const vt = st.getVideoTracks()[0]
    if (vt) vt.addEventListener('ended', () => { if (rec.state !== 'inactive') { o.loi = o.loi || 'luong man hinh ket thuc'; rec.stop() } })
    const ve = () => {
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, ow, oh); o.soVe++; o.veLuc = performance.now()
    }
    if (theoKhung && q.nhip !== 'khung' && typeof MediaStreamTrackProcessor === 'function' && vt) {
      /* MAC DINH ('xuly'): lay khung THANG tu luong man hinh (MediaStreamTrackProcessor), khong qua trinh phat <video>
         an. Do 01/10 so voi cach 'khung' (requestVideoFrameCallback): nhip khung nhu nhau (89-92 %), khoang cach giua
         cac khung deu hon (31/34/37 ms so voi 19/34/50), do lech tieng-hinh it dao dong hon (vung lon -147..-121 so voi
         -279..-135 ms). 'khung' giu lai lam duong du phong khi khong co MediaStreamTrackProcessor. */
      const rd = new MediaStreamTrackProcessor({ track: vt, maxBufferSize: 2 }).readable.getReader()
      // giu nhip khi man dung yen: ve lai chinh canvas len no (danh dau canvas "da doi" de bo ghi bat them 1 khung)
      const giuNhip = () => { if (rec.state === 'inactive') return; ctx.drawImage(cv, 0, 0); o.soVe++; o.hen = setTimeout(giuNhip, 1000 / q.fps) }
      ;(async () => {
        for (;;) {
          const { value: fr, done } = await rd.read()
          if (done) break
          if (rec.state === 'inactive') { fr.close(); rd.cancel().catch(() => {}); break }
          ctx.drawImage(fr, sx, sy, sw, sh, 0, 0, ow, oh); fr.close()
          o.soVe++
          clearTimeout(o.hen); o.hen = setTimeout(giuNhip, 1800 / q.fps)
        }
      })().catch((e) => {
        // 02/10 (ECC soat, muc A3): doc khung hong ma van ghi tiep = video DUNG HINH toi khi nguoi dung bam Dung.
        // Dung ngay bo ghi: phan da quay duoc luu, main danh dau "Bi ngat" + bao nguoi dung.
        o.loi = o.loi || 'doc khung loi: ' + (e && e.message)
        if (rec.state !== 'inactive') rec.stop()
      })
      o.hen = setTimeout(giuNhip, 1800 / q.fps)
    } else if (theoKhung) {
      /* GIU NHIP khi man dung yen: luong khong ra khung moi (WGC zero-hz) -> file se thua khung (Premiere khong ua).
         Sau MOI khung that hen 1,8 nhip (60 ms o 30 khung/giay: rong hon khoang 50 ms cua khung lech nhip nen luc co
         chuyen dong hen nay khong bao gio no); het hen ma chua co khung moi thi ve lai khung cu va lap lai moi nhip.
         ☠️ Ban dau dung setInterval kiem "qua 2 nhip thi ve": vung dung yen chi ra 10-21 khung/giay (do 01/10 11:08,
         test:quayapp truot 21,0 khung/giay) vi sau moi lan ve, nhip dong ho ke tiep luon chua du nguong. */
      const giuNhip = () => { if (rec.state === 'inactive') return; ve(); o.hen = setTimeout(giuNhip, 1000 / q.fps) }
      const lap = (_luc, meta) => {
        if (rec.state === 'inactive') return
        ve()
        // Do TRE cua hinh: tu luc man hinh duoc chup (captureTime) toi luc khung vao bo ghi (ngay sau ve). Bao ve main khi xong.
        if (meta && meta.captureTime && o.tre.length < 2000) o.tre.push(performance.now() - meta.captureTime)
        clearTimeout(o.hen); o.hen = setTimeout(giuNhip, 1800 / q.fps)
        v.requestVideoFrameCallback(lap)
      }
      v.requestVideoFrameCallback(lap)
      o.hen = setTimeout(giuNhip, 1800 / q.fps) // man dung yen ngay tu dau: khong co khung that nao de bat nhip
    } else {
      o.iv = setInterval(ve, 1000 / q.fps)
    }
    rec.start(1000)
    dangQuay = o
    return { ok: true, w: ow, h: oh, mime: rec.mimeType, duoi: /^video\/mp4/.test(rec.mimeType) ? 'mp4' : 'webm', tieng: at.length > 0, msMo: Math.round(performance.now() - t0), nhip: !theoKhung ? 'dongho' : (q.nhip !== 'khung' && typeof MediaStreamTrackProcessor === 'function' ? 'xuly' : 'khung'), fps: q.fps, treTieng: treMs }
  } catch (e) {
    if (st) st.getTracks().forEach((t) => t.stop())
    haNen()
    return { ok: false, loi: (e && e.name) + ': ' + (e && e.message) }
  }
}

window.luong.onDungQuay(({ id }) => {
  const o = dangQuay
  if (!o || o.id !== id) { window.luong.quayXong({ id, loi: 'khong co luot quay ' + id, ms: 0, khung: 0 }); return }
  if (o.rec.state !== 'inactive') o.rec.stop()
})
