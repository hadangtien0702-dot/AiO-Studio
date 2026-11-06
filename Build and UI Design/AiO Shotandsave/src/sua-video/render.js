'use strict'
/* VE MOT KHUNG HINH CUA VIDEO DA SUA (06/11) — MOT ham ve dung chung cho xem truoc (man Sua video) va xuat file
   (cua so an src/sua-xuat), nen hai ben khong the lech nhau (cung nguyen tac src/lamdep/render.js).

   Mot khung = [nen] + [bong] + [video cat theo may quay, bo goc]. Nen lay lai bo cua Lam dep (src/lamdep/render.js:
   6 nen chuyen sac, 7 mau dac, nen mo tu chinh hinh); khong co `LamDep` (node tran) thi dung ban sao cung gia tri.
   Hai lop TINH (nen dac / chuyen sac, bong) ve SAN mot lan vao canvas rieng; moi khung chi con: dan 2 lop do + ve video.
   Nen "mo" doi theo noi dung nen ve lai moi khung tu ban thu nho 192 px. */

;(function (goc) {
  const CHUYEN_SAC = (goc.LamDep && goc.LamDep.CHUYEN_SAC) || [
    ['#ff9a5a', '#f2475d'], ['#6a85f1', '#b56cf0'], ['#43cea2', '#185a9d'], ['#f6d365', '#fda085'], ['#2a3447', '#0b0f1a'], ['#ee9ca7', '#ffdde1'],
  ]
  const MAU_DAC = (goc.LamDep && goc.LamDep.MAU_DAC) || ['#ffffff', '#f2eee6', '#cfd6e4', '#111111', '#f86820', '#2563eb', '#10b981']
  const KIEU = ['khong', 'chuyen', 'dac', 'mo']
  const MAC_DINH = { kieu: 'khong', gd: 0, mau: '#ffffff', le: 6, bo: 3, bong: 40 }
  const kep = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0))

  function chuanHoa(o) {
    o = Object.assign({}, MAC_DINH, o || {})
    o.kieu = KIEU.indexOf(o.kieu) >= 0 ? o.kieu : 'khong'
    o.gd = Math.round(kep(o.gd, 0, CHUYEN_SAC.length - 1))
    o.mau = /^#[0-9a-f]{6}$/i.test(o.mau) ? o.mau : '#ffffff'
    o.le = kep(o.le, 0, 30)
    o.bo = kep(o.bo, 0, 20)
    o.bong = kep(o.bong, 0, 100)
    return o
  }

  /* Hop chua video trong khung W x H (cung ti le khung goc): { x, y, w, h, r } */
  function boCuc(W, H, nen) {
    const o = chuanHoa(nen)
    if (o.kieu === 'khong') return { x: 0, y: 0, w: W, h: H, r: 0, o }
    const pad = Math.round((o.le / 100) * Math.max(W, H))
    const s = Math.max(0.05, Math.min((W - 2 * pad) / W, (H - 2 * pad) / H))
    const w = Math.round(W * s), h = Math.round(H * s)
    const x = Math.round((W - w) / 2), y = Math.round((H - h) / 2)
    const r = Math.min(Math.round((o.bo / 100) * Math.min(w, h)), Math.floor(Math.min(w, h) / 2))
    return { x, y, w, h, r, o }
  }

  function duongBo(ctx, x, y, w, h, r) {
    if (r <= 0) { ctx.rect(x, y, w, h); return }
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  /* Cat theo may quay: cam = { z, cx, cy } (cx, cy = tam 0..1) -> hinh chu nhat nguon [sx, sy, sw, sh] */
  function catNguon(nw, nh, cam) {
    const z = cam && cam.z > 1 ? cam.z : 1
    const sw = nw / z, sh = nh / z
    const cx = cam && Number.isFinite(cam.cx) ? cam.cx : 0.5, cy = cam && Number.isFinite(cam.cy) ? cam.cy : 0.5
    const sx = Math.min(nw - sw, Math.max(0, cx * nw - sw / 2)), sy = Math.min(nh - sh, Math.max(0, cy * nh - sh / 2))
    return [sx, sy, sw, sh]
  }

  /**
   * Tao bo ve cho khung W x H. mk(w, h) -> canvas (OffscreenCanvas hoac <canvas>). Tra { ve(ctx, nguon, nw, nh, cam), bc }.
   * nguon = VideoFrame / <video> / canvas co kich thuoc nw x nh.
   */
  function taoVe(W, H, nen, mk) {
    const bc = boCuc(W, H, nen)
    const o = bc.o
    let lopNen = null, lopBong = null, nho = null
    if (o.kieu === 'chuyen' || o.kieu === 'dac') {
      lopNen = mk(W, H)
      const c = lopNen.getContext('2d')
      if (o.kieu === 'dac') c.fillStyle = o.mau
      else {
        const g = c.createLinearGradient(0, 0, W, H)
        const m = CHUYEN_SAC[o.gd]
        g.addColorStop(0, m[0]); g.addColorStop(1, m[1])
        c.fillStyle = g
      }
      c.fillRect(0, 0, W, H)
    }
    if (o.kieu !== 'khong' && o.bong > 0) { // bong chi o NGOAI hop video (cung cach voi Lam dep)
      lopBong = mk(W, H)
      const c = lopBong.getContext('2d')
      const t = o.bong / 100, mo = t * 0.06 * Math.max(bc.w, bc.h)
      c.save()
      c.beginPath(); c.rect(0, 0, W, H); duongBo(c, bc.x, bc.y, bc.w, bc.h, bc.r)
      c.clip('evenodd')
      c.shadowColor = 'rgb(0 0 0 / ' + Math.round(18 + 52 * t) + '%)'
      c.shadowBlur = mo; c.shadowOffsetY = mo * 0.4
      c.fillStyle = '#000'
      c.beginPath(); duongBo(c, bc.x, bc.y, bc.w, bc.h, bc.r); c.fill()
      c.restore()
    }
    if (o.kieu === 'mo') nho = mk(192, Math.max(2, Math.round(192 * H / W)))

    function ve(ctx, nguon, nw, nh, cam) {
      const [sx, sy, sw, sh] = catNguon(nw, nh, cam)
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
      if (o.kieu === 'khong') { ctx.drawImage(nguon, sx, sy, sw, sh, 0, 0, W, H); return }
      ctx.clearRect(0, 0, W, H)
      if (lopNen) ctx.drawImage(lopNen, 0, 0)
      else { // 'mo': phong to phu kin roi lam mo tren ban nho 192 px, keo len (nen von da mo)
        const c = nho.getContext('2d'), a = nho.width, b = nho.height
        const p = Math.max(a / nw, b / nh) * 1.3
        c.filter = 'blur(5px) saturate(1.25)'
        c.drawImage(nguon, (a - nw * p) / 2, (b - nh * p) / 2, nw * p, nh * p)
        c.filter = 'none'
        ctx.drawImage(nho, 0, 0, W, H)
        ctx.fillStyle = 'rgb(0 0 0 / 14%)'; ctx.fillRect(0, 0, W, H)
      }
      if (lopBong) ctx.drawImage(lopBong, 0, 0)
      ctx.save()
      ctx.beginPath(); duongBo(ctx, bc.x, bc.y, bc.w, bc.h, bc.r); ctx.clip()
      ctx.drawImage(nguon, sx, sy, sw, sh, bc.x, bc.y, bc.w, bc.h)
      ctx.restore()
    }
    return { ve, bc }
  }

  const api = { CHUYEN_SAC, MAU_DAC, KIEU, MAC_DINH, chuanHoa, boCuc, catNguon, taoVe }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else goc.SuaRender = api
})(typeof window !== 'undefined' ? window : globalThis)
