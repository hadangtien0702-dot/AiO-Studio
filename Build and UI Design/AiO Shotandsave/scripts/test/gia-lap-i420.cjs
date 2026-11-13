'use strict'
/* GIA LAP khung video I420 cua luong chup chay san (12/11) — dung chung cho bai do Hut mau.
   Vi sao co file nay: bai do cu phuc vu aioshot://raw bang ANH NGUYEN VEN nen dat 108/108 trong khi app that doc mau sai
   (raw that la khung video I420). Dich vu gia phai sai GIONG dich vu that thi bai do moi co nghia (brain 5h).
   Cong thuc: BT.601 dai gioi han, do sang tung diem, 2 kenh sac lay trung binh o 2x2 (luoi chan cua khung), giai nguoc
   bang so thuc. DA DOI CHIEU voi man that 12/11: 14/14 mau phang ra dung ma app doc duoc (vd #21252B -> #1F252A).
   vao: Buffer / Uint8Array BGRA (nhu NativeImage.toBitmap). ra: Uint8ClampedArray RGBA (nhu getImageData cua luong).
   noiSuy = true: 2 kenh sac duoc noi suy tuyen tinh khi phong len (mep mau nhoe them 1 diem), false: lap lai theo o. */
function quaI420(L, w, h, noiSuy) {
  const Y = new Uint8Array(w * h), cw = (w + 1) >> 1, ch = (h + 1) >> 1, U = new Uint8Array(cw * ch), V = new Uint8Array(cw * ch)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) Y[p] = (66 * L[i + 2] + 129 * L[i + 1] + 25 * L[i] + 0x1080) >> 8
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let r = 0, g = 0, b = 0
    for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) {
      const x = Math.min(w - 1, cx * 2 + xx), y = Math.min(h - 1, cy * 2 + yy), i = (y * w + x) * 4
      b += L[i]; g += L[i + 1]; r += L[i + 2]
    }
    r = (r + 2) >> 2; g = (g + 2) >> 2; b = (b + 2) >> 2
    U[cy * cw + cx] = (112 * b - 74 * g - 38 * r + 0x8000) >> 8
    V[cy * cw + cx] = (112 * r - 94 * g - 18 * b + 0x8000) >> 8
  }
  const S = new Uint8ClampedArray(w * h * 4)
  const kep = (v) => v < 0 ? 0 : v > 255 ? 255 : Math.round(v)
  const lay = (P, cx, cy) => P[Math.max(0, Math.min(ch - 1, cy)) * cw + Math.max(0, Math.min(cw - 1, cx))]
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let u, v
    if (noiSuy) {
      const fx = (x - 0.5) / 2, fy = (y - 0.5) / 2, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0
      const tron = (P) => (lay(P, x0, y0) * (1 - ax) + lay(P, x0 + 1, y0) * ax) * (1 - ay) + (lay(P, x0, y0 + 1) * (1 - ax) + lay(P, x0 + 1, y0 + 1) * ax) * ay
      u = tron(U); v = tron(V)
    } else { u = lay(U, x >> 1, y >> 1); v = lay(V, x >> 1, y >> 1) }
    const c = 1.164383 * (Y[y * w + x] - 16), d = u - 128, e = v - 128, i = (y * w + x) * 4
    S[i] = kep(c + 1.596027 * e); S[i + 1] = kep(c - 0.391762 * d - 0.812968 * e); S[i + 2] = kep(c + 2.017232 * d); S[i + 3] = 255
  }
  return S
}

/* 14 cap [mau that tren man, mau app doc duoc qua luong] do 12/11 tren may anh Tien (man 2560x1440, Electron 43.4.1). */
const CAP_DA_DO = [['#21252B', '#1F252A'], ['#282C34', '#272D34'], ['#1D1D1D', '#1D1D1D'], ['#1D1F23', '#1C2023'], ['#303030', '#303030'], ['#2C313C', '#2C313B'], ['#282C32', '#262C31'], ['#313A53', '#313A52'], ['#0E0E0E', '#0E0E0E'], ['#20242A', '#1E2429'], ['#24292F', '#242A2F'], ['#1C1C1C', '#1C1C1C'], ['#F3F3F3', '#F3F3F3'], ['#2B2E32', '#2A2E31']]

module.exports = { quaI420, CAP_DA_DO }
