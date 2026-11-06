'use strict'
/* "MAY QUAY" TU PHONG TO THEO CON TRO (06/11) — ham THUAN: vao la duong di con tro, ra la (zoom, tam) tai moi thoi diem.
   Xem truoc trong man Sua video va xuat file DUNG CHUNG ham nay nen hai ben khong the lech nhau. Khong phu thuoc trinh
   duyet / Electron (bai do chay bang node tran: scripts/test/do-may-quay.cjs).

   Cach lam (anh: "video tu zoom vao cho con tro dung lai, duong di muot, khong giat"):
   1. Doi mau con tro (ghi luc quay, con-tro-quay.js) sang THOI GIAN TRONG VIDEO: hinh toi bo ghi tre `tre` ms so voi man that.
   2. Tim cac doan con tro DUNG LAI (moi diem trong cua so DWELL_MS nam trong ban kinh R_DUNG quanh trung binh) -> noi lai
      thanh "doan dung". Doan dung lau qua MAX_GIU_MS thi thu ve (nguoi xem khong bi ket trong mot cu zoom mai).
   3. Moi doan -> muc tieu { zoom Z, tam = trung binh vi tri }. Truoc doan chen LEAD_MS de may bat dau chay NGAY khi chuot
      sap dung (biet truoc vi co ca duong di); sau doan giu HOLD_MS roi ve 1x. Hai doan gan nhau va doan sau nam trong
      khung dang zoom thi KHONG thu ve ma lia sang (khong nhay vao nhay ra).
   4. Muc tieu bay nhay tung nac -> lam muot bang HAI lo xo tới han noi tiep (gia toc cung lien tuc): khong co mot khung nao
      nhay, khong co canh nhay. Dat san bang 60 Hz roi noi suy.
   5. Khung cat luon nam TRONG hinh: tam bi kep theo he so zoom hien tai (kep sau khi lam muot nen van lien tuc). */

;(function (goc) {
  const BUOC_MS = 1000 / 60
  const DWELL_MS = 450          // con tro nam trong ban kinh R_DUNG it nhat chung nay thi coi la "dung lai"
  const R_DUNG = 0.055          // ban kinh (don vi: chieu rong vung quay)
  const LEAD_MS = 220           // bat dau chay som hon luc chuot dung
  const HOLD_MS = 450           // giu them sau khi chuot roi di
  const MAX_GIU_MS = 4200       // dung yen qua lau thi thu ve
  const GAP_GIU_MS = 1300       // hai doan cach nhau it hon nay (va gan nhau) thi lia chu khong thu ve
  const GAP_XA_MS = 1200        // hai doan XA nhau cach it hon nay: khong giu / khong bat som, de zoom ra giua chung
  const LE_AN_TOAN = 0.06       // doan sau phai nam trong khung dang zoom cach mep it nhat chung nay
  const MUC = { nhe: 1.4, vua: 1.8, manh: 2.4 }
  const OMEGA_ZOOM = 9, OMEGA_TAM = 7 // rad / giay; hai lo xo noi tiep

  const kep = (v, a, b) => (v < a ? a : v > b ? b : v)

  /* Noi suy tuyen tinh vi tri con tro tai moi nac luoi. pts da sap theo t tang dan. */
  function laySau(pts, n) {
    const ra = new Float64Array(n * 2)
    let k = 0
    for (let i = 0; i < n; i++) {
      const t = i * BUOC_MS
      while (k + 1 < pts.length && pts[k + 1][0] <= t) k++
      let x, y
      if (t <= pts[0][0]) { x = pts[0][1]; y = pts[0][2] }
      else if (k + 1 >= pts.length) { x = pts[pts.length - 1][1]; y = pts[pts.length - 1][2] }
      else {
        const a = pts[k], b = pts[k + 1], u = (t - a[0]) / Math.max(1, b[0] - a[0])
        x = a[1] + (b[1] - a[1]) * u; y = a[2] + (b[2] - a[2]) * u
      }
      ra[i * 2] = kep(x, 0, 1); ra[i * 2 + 1] = kep(y, 0, 1)
    }
    return ra
  }

  /* Cac doan dung lai: [{ a, b (chi so luoi), x, y }] */
  function timDoanDung(c, n, tiLeCao, iDau, iCuoi) {
    const W = Math.max(2, Math.round(DWELL_MS / BUOC_MS))
    const dung = new Uint8Array(n)
    // cua so truot: trung binh + khoang cach xa nhat (don vi chieu rong, y nhan ti le khung)
    for (let i = Math.max(0, iDau); i + W <= Math.min(n, iCuoi + 1); i += 1) {
      let mx = 0, my = 0
      for (let j = i; j < i + W; j++) { mx += c[j * 2]; my += c[j * 2 + 1] }
      mx /= W; my /= W
      let xa = 0
      for (let j = i; j < i + W; j++) {
        const dx = c[j * 2] - mx, dy = (c[j * 2 + 1] - my) * tiLeCao
        const d = dx * dx + dy * dy
        if (d > xa) xa = d
      }
      if (xa <= R_DUNG * R_DUNG) for (let j = i; j < i + W; j++) dung[j] = 1
    }
    const ra = []
    let i = 0
    while (i < n) {
      if (!dung[i]) { i++; continue }
      let j = i
      while (j + 1 < n && dung[j + 1]) j++
      ra.push({ a: i, b: j })
      i = j + 1
    }
    // gop cac doan dinh nhau (khoang ho < 150 ms) roi tinh tam
    const gop = []
    const hoMax = Math.round(150 / BUOC_MS)
    for (const d of ra) {
      const cuoi = gop[gop.length - 1]
      if (cuoi && d.a - cuoi.b <= hoMax) cuoi.b = d.b; else gop.push({ a: d.a, b: d.b })
    }
    for (const d of gop) {
      let mx = 0, my = 0
      for (let j = d.a; j <= d.b; j++) { mx += c[j * 2]; my += c[j * 2 + 1] }
      d.x = mx / (d.b - d.a + 1); d.y = my / (d.b - d.a + 1)
    }
    return gop
  }

  /**
   * Tinh may quay. mau = [[dt ms, fx, fy]...] (con-tro-quay.js). opts: { tre (ms), thoiLuongMs, muc ('nhe'|'vua'|'manh' hoac so), w, h }
   * Tra { at(tMs) -> { z, cx, cy }, doan: [{ tu, den (ms), x, y }], z, thoiLuongMs } hoac null neu khong du du lieu.
   */
  function tinh(mau, opts) {
    opts = opts || {}
    if (!Array.isArray(mau) || mau.length < 2) return null
    const tre = Number(opts.tre) || 0
    const Z = typeof opts.muc === 'number' ? kep(opts.muc, 1.05, 4) : (MUC[opts.muc] || MUC.vua)
    const tiLeCao = opts.w > 0 && opts.h > 0 ? opts.h / opts.w : 9 / 16
    const pts = mau.map((m) => [m[0] + tre, m[1], m[2]]).sort((a, b) => a[0] - b[0])
    const thoiLuong = Math.max(1000, Number(opts.thoiLuongMs) || pts[pts.length - 1][0] + 500)
    const n = Math.ceil(thoiLuong / BUOC_MS) + 1
    const c = laySau(pts, n)
    const doan = timDoanDung(c, n, tiLeCao, Math.ceil(pts[0][0] / BUOC_MS), Math.floor(pts[pts.length - 1][0] / BUOC_MS))

    // --- muc tieu theo luoi ---
    const tz = new Float64Array(n).fill(1)
    const tx = new Float64Array(n), ty = new Float64Array(n)
    const lead = Math.round(LEAD_MS / BUOC_MS), giu = Math.round(HOLD_MS / BUOC_MS), toiDa = Math.round(MAX_GIU_MS / BUOC_MS)
    const khoang = doan.map((d) => ({ a0: d.a, b0: Math.min(d.b, d.a + toiDa), x: d.x, y: d.y, lead, giu }))
    /* Hai doan lien tiep: GAN (doan sau nam trong khung dang zoom) -> lia sang, khong thu ve; XA ma khoang cach ngan -> bo
       LEAD / HOLD de zoom ra NGAY trong luc chuot di (khong thi may giu zoom ma chuot bay ra khoi khung). */
    const nuaRong = 0.5 / Z - LE_AN_TOAN
    const lia = []
    for (let k = 0; k + 1 < khoang.length; k++) {
      const p = khoang[k], q = khoang[k + 1]
      const ho = (q.a0 - p.b0) * BUOC_MS
      const gan = Math.abs(q.x - p.x) <= nuaRong && Math.abs(q.y - p.y) <= nuaRong
      if (ho < GAP_GIU_MS && gan) lia[k] = true
      else if (ho < GAP_XA_MS) { p.giu = 0; q.lead = 0 }
    }
    for (let k = 0; k < khoang.length; k++) {
      const d = khoang[k]
      d.a = Math.max(0, d.a0 - d.lead); d.b = Math.min(n - 1, d.b0 + d.giu)
    }
    for (let k = 0; k + 1 < khoang.length; k++) if (lia[k]) khoang[k].b = Math.max(khoang[k].b, khoang[k + 1].a - 1)
    // khoang chong nhau (do LEAD / HOLD): doan sau thang
    for (let k = 0; k + 1 < khoang.length; k++) if (khoang[k].b >= khoang[k + 1].a) khoang[k].b = khoang[k + 1].a - 1
    let cx0 = khoang.length ? khoang[0].x : 0.5, cy0 = khoang.length ? khoang[0].y : 0.5
    let ki = 0
    for (let i = 0; i < n; i++) {
      while (ki < khoang.length && i > khoang[ki].b) ki++
      if (ki < khoang.length && i >= khoang[ki].a) { tz[i] = Z; cx0 = khoang[ki].x; cy0 = khoang[ki].y }
      tx[i] = cx0; ty[i] = cy0
    }

    // --- lam muot: 2 lo xo toi han noi tiep, 4 buoc con moi nac luoi ---
    const z = new Float64Array(n), px = new Float64Array(n), py = new Float64Array(n)
    const lx = (omega) => ({ w: omega, p1: 0, v1: 0, p2: 0, v2: 0 })
    const buocLx = (s, muc, dt) => { // moi lo xo: gia toc = w^2 (muc tieu - p) - 2 w v
      s.v1 += (s.w * s.w * (muc - s.p1) - 2 * s.w * s.v1) * dt; s.p1 += s.v1 * dt
      s.v2 += (s.w * s.w * (s.p1 - s.p2) - 2 * s.w * s.v2) * dt; s.p2 += s.v2 * dt
    }
    const sz = lx(OMEGA_ZOOM), sx = lx(OMEGA_TAM), sy = lx(OMEGA_TAM)
    sz.p1 = sz.p2 = 1; sx.p1 = sx.p2 = tx[0]; sy.p1 = sy.p2 = ty[0]
    const CON = 4, dt = (BUOC_MS / 1000) / CON
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < CON; k++) { buocLx(sz, tz[i], dt); buocLx(sx, tx[i], dt); buocLx(sy, ty[i], dt) }
      z[i] = Math.max(1, sz.p2); px[i] = sx.p2; py[i] = sy.p2
    }

    const at = (tMs) => {
      const f = kep(tMs / BUOC_MS, 0, n - 1), i = Math.floor(f), u = f - i, j = Math.min(n - 1, i + 1)
      const zz = z[i] + (z[j] - z[i]) * u
      const nua = 0.5 / zz
      return { z: zz, cx: kep(px[i] + (px[j] - px[i]) * u, nua, 1 - nua), cy: kep(py[i] + (py[j] - py[i]) * u, nua, 1 - nua) }
    }
    return {
      at, z: Z, thoiLuongMs: thoiLuong,
      doan: khoang.map((d) => ({ tu: d.a * BUOC_MS, den: d.b * BUOC_MS, x: d.x, y: d.y })),
      conTroTai: (tMs) => { // vi tri con tro (0..1) tai thoi diem video, de bai do hoi "con tro co nam trong khung khong"
        const f = kep(tMs / BUOC_MS, 0, n - 1), i = Math.floor(f), u = f - i, j = Math.min(n - 1, i + 1)
        return [c[i * 2] + (c[j * 2] - c[i * 2]) * u, c[i * 2 + 1] + (c[j * 2 + 1] - c[i * 2 + 1]) * u]
      },
    }
  }

  const api = { tinh, MUC, BUOC_MS, DWELL_MS, R_DUNG, LEAD_MS, HOLD_MS, MAX_GIU_MS }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else goc.MayQuay = api
})(typeof window !== 'undefined' ? window : globalThis)
