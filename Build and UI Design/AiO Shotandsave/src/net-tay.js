'use strict'

/* KIEU VE TAY (06/11/2026, ROADMAP 0k #9): khung, mui ten, o chu, huy hieu so ve nhu phac bang tay.
   Dung CHUNG cho man chup (overlay.js) va anh ghim (pin.js), script thuong nhu sua-net.js.

   On dinh (khong rung khi ve lai, anh xuat giong thu nhin thay): moi net co `seed` (so nguyen) chot LUC TAO, luu cung net.
   Moi ham ve lay toa do theo PIXEL da nhan he so phong k, nhung so luong diem va thu tu boc so ngau nhien chi phu thuoc
   vao seed + HINH DANG tinh theo DIP (do dai / k), khong phu thuoc k: cung mot net ve o k = 1 va k = 1,5 cho cung hinh,
   chi to hon. Bien do lech tinh theo DIP * k. KHONG goi Math.random trong ham ve (chi `taoSeed` khi tao net). */
const NetTay = (() => {
  let bat = false
  const LOAI = { rect: 1, arrow: 1, text: 1, so: 1 } // loai net duoc ve tay (lam mo / net but / lam noi khong doi)
  const rng = (seed) => {
    let a = (seed >>> 0) || 1
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  }
  const sol = (r) => r() * 2 - 1
  const taoSeed = () => 1 + Math.floor(Math.random() * 2147483646)

  /* Them mot canh gap ghenh vao duong ve hien tai (khong beginPath/stroke): tu (x0,y0) toi (x1,y1), ke ca vuot ra hai dau. */
  function canh(ctx, r, x0, y0, x1, y1, k, vuot) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux
    const dip = L / k
    const n = Math.max(2, Math.min(12, Math.round(dip / 30)))
    const A = 1.5 * k
    const v0 = vuot ? (1 + r() * 3) * k : 0, v1 = vuot ? (1 + r() * 3) * k : 0
    const px = [], py = []
    for (let i = 0; i <= n; i++) {
      const t = i / n
      let along = (t * L) - v0 * (1 - t) + v1 * t
      const off = (i === 0 || i === n ? 0.8 : 1) * sol(r) * A
      px.push(x0 + ux * along + nx * off)
      py.push(y0 + uy * along + ny * off)
    }
    ctx.moveTo(px[0], py[0])
    for (let i = 1; i < n; i++) ctx.quadraticCurveTo(px[i], py[i], (px[i] + px[i + 1]) / 2, (py[i] + py[i + 1]) / 2)
    ctx.lineTo(px[n], py[n])
  }

  /* Khung chu nhat x, y, w, h (px) nhin nhu phac: hai luot net, goc hoi vuot, canh hoi cong. Ve bang strokeStyle / lineWidth hien co. */
  function khung(ctx, x, y, w, h, seed, k) {
    const r = rng(seed)
    ctx.save()
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    for (let pass = 0; pass < 2; pass++) {
      const j = () => sol(r) * 1.6 * k
      const a = [x + j(), y + j()], b = [x + w + j(), y + j()], c = [x + w + j(), y + h + j()], d = [x + j(), y + h + j()]
      ctx.beginPath()
      canh(ctx, r, a[0], a[1], b[0], b[1], k, true)
      canh(ctx, r, b[0], b[1], c[0], c[1], k, true)
      canh(ctx, r, c[0], c[1], d[0], d[1], k, true)
      canh(ctx, r, d[0], d[1], a[0], a[1], k, true)
      ctx.stroke()
    }
    ctx.restore()
  }

  /* Mui ten: than gap ghenh + dau hai net (khong to kin). canhDau = do dai canh dau mui ten (px). */
  function muiTen(ctx, x1, y1, x2, y2, seed, k, canhDau) {
    const r = rng(seed)
    const goc = Math.atan2(y2 - y1, x2 - x1)
    ctx.save()
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.beginPath()
    canh(ctx, r, x1, y1, x2, y2, k, true)
    ctx.stroke()
    ctx.beginPath()
    for (const d of [-1, 1]) {
      const ag = goc + Math.PI + d * (Math.PI / 6 + sol(r) * 0.12)
      const len = canhDau * (1 + sol(r) * 0.12)
      canh(ctx, r, x2, y2, x2 + len * Math.cos(ag), y2 + len * Math.sin(ag), k, false)
    }
    ctx.stroke()
    ctx.restore()
  }

  /* Duong khep kin gap ghenh cua hinh elip (huy hieu so). Chi tao duong, ben goi tu fill / stroke. */
  function duongBlob(ctx, r, cx, cy, rx, ry, k) {
    const n = 14, A = 0.07
    const ph = r() * Math.PI * 2
    const px = [], py = []
    for (let i = 0; i < n; i++) {
      const t = ph + (i / n) * Math.PI * 2
      const m = 1 + sol(r) * A
      px.push(cx + Math.cos(t) * rx * m); py.push(cy + Math.sin(t) * ry * m)
    }
    ctx.moveTo((px[n - 1] + px[0]) / 2, (py[n - 1] + py[0]) / 2)
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; ctx.quadraticCurveTo(px[i], py[i], (px[i] + px[j]) / 2, (py[i] + py[j]) / 2) }
    ctx.closePath()
  }
  /* Huy hieu tron: dien mau + vien mot net (vien khong khep dung, vuot nhe). Dung fillStyle / strokeStyle / lineWidth hien co. */
  function huyHieu(ctx, cx, cy, rad, seed, k) {
    const r = rng(seed)
    ctx.beginPath(); duongBlob(ctx, r, cx, cy, rad * (1 + sol(r) * 0.04), rad * (1 + sol(r) * 0.04), k); ctx.fill()
    ctx.shadowColor = 'transparent' // bong chi cho phan dien, khong cho vien
    ctx.beginPath(); duongBlob(ctx, r, cx, cy, rad * 0.93, rad * 0.93, k); ctx.stroke()
  }

  /* O nen cua chu: dien nen (fillStyle hien co) hinh chu nhat goc le + vien tay mot luot bang mau vienMau. */
  function nenChu(ctx, x, y, w, h, seed, k, vienMau) {
    const r = rng(seed)
    const j = () => sol(r) * 1.4 * k
    const c = [[x + j(), y + j()], [x + w + j(), y + j()], [x + w + j(), y + h + j()], [x + j(), y + h + j()]]
    ctx.beginPath()
    ctx.moveTo(c[0][0], c[0][1])
    for (let i = 1; i < 4; i++) ctx.lineTo(c[i][0], c[i][1])
    ctx.closePath(); ctx.fill()
    if (vienMau) {
      ctx.save(); ctx.strokeStyle = vienMau; ctx.lineWidth = 1.6 * k
      ctx.beginPath()
      for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; canh(ctx, r, a[0], a[1], b[0], b[1], k, true) }
      ctx.stroke(); ctx.restore()
    }
  }

  const duocPhep = (type) => !!LOAI[type]
  /* Gan dau hieu ve tay cho net moi neu cong tac dang bat. */
  function danhDau(s) { if (bat && duocPhep(s.type)) { s.tay = true; s.seed = taoSeed() } return s }
  return { khung, muiTen, huyHieu, nenChu, duocPhep, danhDau, taoSeed, dat: (b) => { bat = !!b }, dangBat: () => bat }
})()
