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

window.luong.onLay(async ({ gen, nhanh }) => {
  // Dot 1: JPEG moi man (hien overlay). Dot 2: raw BGRA (cat luc Xong).
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
  for (const k of khung) {
    const blob = await k.cv.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
    const buf = await blob.arrayBuffer()
    window.luong.guiKhung({ gen, displayId: k.c.displayId, loai: 'jpg', buf })
  }
  for (const k of khung) {
    const id = k.ctx.getImageData(0, 0, k.w, k.h)
    // RGBA -> BGRA (nativeImage.createFromBitmap doc theo toBitmap = BGRA tren Windows).
    const u32 = new Uint32Array(id.data.buffer)
    for (let i = 0; i < u32.length; i++) {
      const p = u32[i] // little-endian: 0xAABBGGRR
      u32[i] = (p & 0xff00ff00) | ((p & 0x00ff0000) >>> 16) | ((p & 0x000000ff) << 16)
    }
    window.luong.guiKhung({ gen, displayId: k.c.displayId, loai: 'raw', w: k.w, h: k.h, buf: id.data.buffer })
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
