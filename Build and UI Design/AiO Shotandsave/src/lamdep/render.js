'use strict'

/* LAM DEP ANH — phan TINH + VE, dung chung cho xem truoc va xuat file (05/11/2026).
   Mot ham ve duy nhat: xem truoc chi la cung ham chay o ti le nho, nen anh xem truoc
   va anh xuat ra khong the lech nhau.

   Quy uoc (bai do scripts/test/do-lam-dep.cjs do tung dieu duoi day):
   - Anh goc ve o ti le 1:1 (khong phong to, khong lam mo), dung GIUA khung; le chan/le duoc can
     de x, y luon la so nguyen, nen o giua anh goc giong tung diem anh voi file goc.
   - Khung xuat = anh + le hai ben; chon ti le thi mo rong chieu con thieu, KHONG cat anh.
   - Chi thu nho khi vuot tran 8192 px / 64 trieu diem anh (gioi han canvas cua Chromium). */

;(function (goc) {
  const TI_LE = { '1:1': [1, 1], '4:5': [4, 5], '9:16': [9, 16], '16:9': [16, 9] }
  const MAX_CANH = 8192
  const MAX_DIEN_TICH = 64e6

  /* 6 nen chuyen sac + 7 mau dac. Mau dac dau tien la trang. */
  const CHUYEN_SAC = [
    ['#ff9a5a', '#f2475d'],
    ['#6a85f1', '#b56cf0'],
    ['#43cea2', '#185a9d'],
    ['#f6d365', '#fda085'],
    ['#2a3447', '#0b0f1a'],
    ['#ee9ca7', '#ffdde1'],
  ]
  const MAU_DAC = ['#ffffff', '#f2eee6', '#cfd6e4', '#111111', '#f86820', '#2563eb', '#10b981']

  const MAC_DINH = { tiLe: 'free', nen: 'chuyen', mau: '#ffffff', gd: 0, le: 8, bo: 3, bong: 40 }

  /** Chuan hoa tuy chon (gioi han khoang, bo gia tri la). */
  function chuanHoa(o) {
    o = Object.assign({}, MAC_DINH, o || {})
    const kep = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0))
    o.tiLe = o.tiLe === 'free' || TI_LE[o.tiLe] ? o.tiLe : 'free'
    o.nen = ['dac', 'chuyen', 'mo', 'trong'].indexOf(o.nen) >= 0 ? o.nen : 'chuyen'
    o.gd = Math.round(kep(o.gd, 0, CHUYEN_SAC.length - 1))
    o.mau = /^#[0-9a-f]{6}$/i.test(o.mau) ? o.mau : '#ffffff'
    o.le = kep(o.le, 0, 30)
    o.bo = kep(o.bo, 0, 20)
    o.bong = kep(o.bong, 0, 100)
    return o
  }

  /** Tinh bo cuc cua khung xuat. w, h = kich thuoc anh goc (px). kep = ti le ep (xem truoc), bo trong = xuat that. */
  function tinhBoCuc(w, h, tuyChon, kep) {
    const o = chuanHoa(tuyChon)
    const le0 = Math.round((o.le / 100) * Math.max(w, h))
    let cw0 = w + 2 * le0
    let ch0 = h + 2 * le0
    if (o.tiLe !== 'free') {
      const [a, b] = TI_LE[o.tiLe]
      if (cw0 * b >= ch0 * a) ch0 = Math.round((cw0 * b) / a)
      else cw0 = Math.round((ch0 * a) / b)
    }
    let k = Math.min(1, (MAX_CANH - 1) / Math.max(cw0, ch0), Math.sqrt(MAX_DIEN_TICH / (cw0 * ch0)))
    const kTran = k
    if (kep != null) k = Math.min(kTran, kep)
    const iw = Math.max(1, Math.round(w * k))
    const ih = Math.max(1, Math.round(h * k))
    let cw = Math.max(iw, Math.round(cw0 * k))
    let ch = Math.max(ih, Math.round(ch0 * k))
    if ((cw - iw) % 2) cw++ // x, y nguyen: anh nam dung giua tung diem
    if ((ch - ih) % 2) ch++
    const r = Math.min(Math.round((o.bo / 100) * Math.min(iw, ih)), Math.floor(Math.min(iw, ih) / 2))
    return { cw, ch, cw0, ch0, k, kTran, iw, ih, x: (cw - iw) / 2, y: (ch - ih) / 2, r, o }
  }

  function duongBo(ctx, x, y, w, h, r) {
    ctx.beginPath()
    themDuong(ctx, x, y, w, h, r)
  }
  function themDuong(ctx, x, y, w, h, r) {
    if (r <= 0) { ctx.rect(x, y, w, h); return }
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  function veNen(ctx, nguon, bc) {
    const { cw, ch, o } = bc
    if (o.nen === 'trong') return
    if (o.nen === 'dac') { ctx.fillStyle = o.mau; ctx.fillRect(0, 0, cw, ch); return }
    if (o.nen === 'chuyen') {
      const g = ctx.createLinearGradient(0, 0, cw, ch)
      const m = CHUYEN_SAC[o.gd]
      g.addColorStop(0, m[0]); g.addColorStop(1, m[1])
      ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch)
      return
    }
    /* 'mo': chinh anh nay, phong to phu kin roi lam mo. Lam mo tren ban nho (<=192 px) roi keo len:
       nhanh ngay ca khi xuat anh 8000 px, ma nhin van nhu nhau vi nen von da mo. */
    const s = 192 / Math.max(cw, ch)
    const sw = Math.max(2, Math.round(cw * s)), sh = Math.max(2, Math.round(ch * s))
    const nho = goc.document.createElement('canvas')
    nho.width = sw; nho.height = sh
    const c = nho.getContext('2d')
    const wn = nguon.naturalWidth || nguon.width, hn = nguon.naturalHeight || nguon.height
    const p = Math.max(sw / wn, sh / hn) * 1.3 // phu thua de mep mo khong bi trong
    c.filter = 'blur(5px) saturate(1.25)'
    c.drawImage(nguon, (sw - wn * p) / 2, (sh - hn * p) / 2, wn * p, hn * p)
    c.filter = 'none'
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(nho, 0, 0, cw, ch)
    ctx.fillStyle = 'rgb(0 0 0 / 14%)'
    ctx.fillRect(0, 0, cw, ch)
  }

  /** Ve toan bo len ctx (canvas da dat kich thuoc cw x ch). nguon = ImageBitmap / canvas / img. */
  function ve(ctx, nguon, bc) {
    const { cw, ch, iw, ih, x, y, r, o, k } = bc
    ctx.clearRect(0, 0, cw, ch)
    veNen(ctx, nguon, bc)
    if (o.bong > 0) {
      const t = o.bong / 100
      const mo = t * 0.06 * Math.max(iw, ih)
      /* bong chi la hieu ung nen: chi ve ngoai khung anh, de anh co vung trong suot van thay nen da chon ben duoi.
         05/11 soat: truoc day ve roi xoa bang destination-out, xoa luon ca nen duoi anh. */
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, cw, ch)
      themDuong(ctx, x, y, iw, ih, r)
      ctx.clip('evenodd')
      ctx.shadowColor = 'rgb(0 0 0 / ' + Math.round(18 + 52 * t) + '%)'
      ctx.shadowBlur = mo
      ctx.shadowOffsetY = mo * 0.4
      ctx.fillStyle = '#000'
      duongBo(ctx, x, y, iw, ih, r)
      ctx.fill()
      ctx.restore()
    }
    ctx.save()
    duongBo(ctx, x, y, iw, ih, r)
    ctx.clip()
    ctx.imageSmoothingEnabled = k < 1
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(nguon, x, y, iw, ih)
    ctx.restore()
  }

  const api = { TI_LE, CHUYEN_SAC, MAU_DAC, MAC_DINH, MAX_CANH, MAX_DIEN_TICH, chuanHoa, tinhBoCuc, ve }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else goc.LamDep = api
})(typeof window !== 'undefined' ? window : globalThis)
