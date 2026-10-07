'use strict'
/* =========================================================================
   Do BO GHEP cua CHUP CUON (src/chup-cuon.js) — 06/10 — chay bang: npm run test:chupcuon (node thuong, khong Electron)
   Dung mot TRANG GIA co noi dung biet truoc (dong chu, khoi anh, khoang trang, bang lap), cho "cua so" 600 px truot
   tren no theo cac buoc cuon khac nhau (nhanh, cham, dung, cuon nguoc), them nhieu +-3 moi kenh nhu anh JPEG, roi SO
   TUNG DIEM ANH cua anh dai ghep ra voi trang goc. Co phep do toc do o co that (2400 x 1300).
   DOI CHUNG: (1) anh ghep bi lech 1 hang -> thuoc so diem anh phai bat; (2) cuon vuot qua phan chong -> phai bao 'lac',
   khong noi bua; (3) trang khac han -> 'lac'.
   ========================================================================= */
const path = require('path')
const { taoBoGhep } = require(path.join(__dirname, '..', '..', 'src', 'chup-cuon.js'))

const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }
const ngauNhien = (hat) => () => { hat |= 0; hat = (hat + 0x6D2B79F5) | 0; let t = Math.imul(hat ^ (hat >>> 15), 1 | hat); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/* Trang gia W x H (BGRA): nen trang, cac doan "chu" (vach toi dai ngan khac nhau), khoi anh mau, 1 khoang trang 380 px,
   1 bang 8 hang GIONG HET nhau (hoa tiet lap). */
function taoTrang(W, H, hat) {
  const rnd = ngauNhien(hat)
  const b = Buffer.alloc(W * H * 4, 255)
  const to = (x, y, w, h, m) => { for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) { const i = (yy * W + xx) * 4; b[i] = m[2]; b[i + 1] = m[1]; b[i + 2] = m[0] } }
  let y = 20
  while (y < H - 40) {
    const loai = rnd()
    if (y > 1500 && y < 1520) { y += 380; continue }            // khoang trang phang 380 px
    if (y > 2600 && y < 2640) {                                  // bang 8 hang giong het nhau, moi hang 36 px
      for (let k = 0; k < 8; k++) { to(40, y, W - 80, 1, [200, 200, 200]); to(60, y + 12, 180, 10, [60, 60, 60]); to(300, y + 12, 90, 10, [60, 60, 60]); y += 36 }
      continue
    }
    if (loai < 0.72) {                                           // 1 dong chu: cac "tu" dai ngan
      let x = 40 + Math.floor(rnd() * 30)
      while (x < W - 80) { const dai = 12 + Math.floor(rnd() * 70); to(x, y, dai, 11, [30 + Math.floor(rnd() * 40), 30, 40]); x += dai + 8 + Math.floor(rnd() * 14) }
      y += 20 + Math.floor(rnd() * 8)
    } else {                                                     // khoi anh
      const hh = 60 + Math.floor(rnd() * 140), ww = 200 + Math.floor(rnd() * (W - 300))
      const m = [Math.floor(rnd() * 255), Math.floor(rnd() * 255), Math.floor(rnd() * 255)]
      for (let k = 0; k < hh; k += 6) to(60, y + k, ww, 6, [(m[0] + k) & 255, (m[1] + k * 2) & 255, m[2]])
      y += hh + 18
    }
  }
  return b
}
/* Khung nhin thay khi trang cuon toi hang `tu`: chep h hang + nhieu +-3. dinh > 0: `dinh` hang dau la thanh CO DINH. */
function khung(trang, W, H, h, tu, hat, dinh) {
  const rnd = ngauNhien(hat)
  const f = Buffer.from(trang.subarray(tu * W * 4, (tu + h) * W * 4))
  if (dinh) for (let i = 0; i < dinh * W * 4; i += 4) { f[i] = 60; f[i + 1] = 40; f[i + 2] = 30 }
  for (let i = 0; i < f.length; i += 4) { const n = Math.floor(rnd() * 7) - 3; f[i] = Math.max(0, Math.min(255, f[i] + n)); f[i + 1] = Math.max(0, Math.min(255, f[i + 1] + n)); f[i + 2] = Math.max(0, Math.min(255, f[i + 2] + n)) }
  return f
}
/* Lech trung binh moi kenh giua anh ghep (tu hang `tuAnh`) va trang goc (tu hang `tuTrang`), tren `soHang` hang */
function lech(anh, trang, W, tuAnh, tuTrang, soHang) {
  let s = 0
  const a0 = tuAnh * W * 4, t0 = tuTrang * W * 4, n = soHang * W * 4
  for (let i = 0; i < n; i += 4) s += Math.abs(anh[a0 + i] - trang[t0 + i]) + Math.abs(anh[a0 + i + 1] - trang[t0 + i + 1]) + Math.abs(anh[a0 + i + 2] - trang[t0 + i + 2])
  return s / (soHang * W * 3)
}
/* Chay mot kich ban: buoc = [do cuon tung khung]. Tra { bo, loai: [...], xaNhat, ms: [...] } */
function chay(trang, W, H, h, buoc, o) {
  const bo = taoBoGhep(W, h, o && o.tuyChon)
  let tu = 0, xa = 0
  const loai = [], ms = []
  const mot = (i) => { const f = khung(trang, W, H, h, tu, 1000 + i, o && o.dinh); const t0 = process.hrtime.bigint(); const r = bo.them(f); ms.push(Number(process.hrtime.bigint() - t0) / 1e6); loai.push(r.loai); return r }
  mot(0)
  buoc.forEach((d, i) => { tu = Math.max(0, Math.min(H - h, tu + d)); const r = mot(i + 1); if (r.loai !== 'lac' && tu > xa) xa = tu })
  return { bo, loai, xa, ms }
}
const dem = (ds, x) => ds.filter((v) => v === x).length

const W = 900, H = 5200, h = 600
const trang = taoTrang(W, H, 7)

// ── 1. Cuon binh thuong: buoc nho / lon / dung / cuon nguoc, di het trang ──
{
  const buoc = []
  const mau = [37, 120, 5, 0, 0, 240, 333, 80, -150, 200, 410, 64, 0, 18, 290, -40, 130, 360, 75, 220]
  let tong = 0, i = 0
  while (tong < H - h + 300) { const d = mau[i++ % mau.length]; buoc.push(d); tong += d }
  const r = chay(trang, W, H, h, buoc)
  const a = r.bo.layAnh()
  const l = a.h <= H ? lech(a.buf, trang, W, 0, 0, a.h) : 999
  kiem('[1] cuon het trang (buoc 5..410 px, co dung va cuon nguoc): anh dai cao DUNG bang trang', a.h === H && a.w === W, 'cao ' + a.h + ' / ' + H + ', ' + buoc.length + ' khung')
  kiem('[1] tung diem anh khop trang goc (lech <= 2,5 / kenh, nhieu +-3)', l <= 2.5, 'lech ' + l.toFixed(2))
  kiem('[1] khong khung nao bi "lac"; co khung "dung" va "lui" dung nhu kich ban', dem(r.loai, 'lac') === 0 && dem(r.loai, 'dung') >= 3 && dem(r.loai, 'lui') >= 2, JSON.stringify(r.bo.dem))
  // DOI CHUNG cua THUOC: anh ghep lech 1 hang so voi trang -> phep so phai lon hon han
  const l1 = lech(a.buf, trang, W, 0, 1, a.h - 1)
  kiem('[DOI CHUNG thuoc] so anh ghep voi trang LECH 1 hang -> lech tang ro (> 3 lan)', l1 > l * 3 && l1 > 6, 'dung ' + l.toFixed(2) + ' -> lech 1 hang ' + l1.toFixed(2))
  const tb = r.ms.reduce((s, v) => s + v, 0) / r.ms.length
  console.log('  toc do 900x600: trung binh ' + tb.toFixed(1) + ' ms / khung, cham nhat ' + Math.max(...r.ms).toFixed(1) + ' ms')
}
// ── 2. Cuon QUA NHANH (vuot phan chong) roi cuon nguoc lai: khong noi bua, bat lai duoc ──
{
  const r = chay(trang, W, H, h, [100, 100, 590, 0, -480, 150, 200, 200])
  const a = r.bo.layAnh()
  kiem('[2] buoc 590 px (vuot phan chong 85 %) -> "lac", KHONG noi gi them', r.loai[3] === 'lac' && r.loai[4] === 'lac', r.loai.join(' '))
  kiem('[2] cuon nguoc lai vao vung da chup -> bat lai, anh cuoi van khop trang', r.loai[5] !== 'lac' && a.h === r.xa + h && lech(a.buf, trang, W, 0, 0, a.h) <= 2.5, 'cao ' + a.h + ' = ' + r.xa + ' + ' + h + ', lech ' + lech(a.buf, trang, W, 0, 0, a.h).toFixed(2))
}
// ── 3. Thanh CO DINH 50 px o dinh vung (khong troi theo trang) ──
{
  const buoc = Array.from({ length: 16 }, (_, i) => [90, 160, 40, 230][i % 4])
  const r = chay(trang, W, H, h, buoc, { dinh: 50 })
  const a = r.bo.layAnh()
  const l = lech(a.buf, trang, W, 50, 50, a.h - 50) // bo 50 hang dau (la thanh co dinh cua khung dau)
  kiem('[3] co thanh co dinh 50 px: van ghep dung chieu cao va noi dung', dem(r.loai, 'lac') === 0 && a.h === r.xa + h && l <= 2.5, 'cao ' + a.h + ', lech ' + l.toFixed(2) + ', ' + JSON.stringify(r.bo.dem))
}
// ── 4. Trang TRANG PHANG: khong duoc bia ra do cuon ──
{
  const phang = Buffer.alloc(W * 2000 * 4, 255)
  const r = chay(phang, W, 2000, h, [100, 200, 50, 300])
  kiem('[4] trang trang phang: khong noi them hang nao', r.bo.cao === h && dem(r.loai, 'them') === 0, r.loai.join(' '))
}
// ── 5. Tran chieu cao ──
{
  const r = chay(trang, W, H, h, [200, 200, 200, 200, 200, 200, 200], { tuyChon: { toiDaCao: 1500 } })
  const a = r.bo.layAnh()
  kiem('[5] tran 1500 px: dung DUNG o 1500, bao "day", phan da ghep van khop', a.h === 1500 && r.loai.includes('day') && lech(a.buf, trang, W, 0, 0, 1500) <= 2.5, 'cao ' + a.h + ' ' + r.loai.join(' '))
}
// ── 6. DOI CHUNG: dang cuon thi noi dung doi HAN (trang khac) -> 'lac', khong noi ──
{
  const bo = taoBoGhep(W, h)
  bo.them(khung(trang, W, H, h, 0, 1))
  bo.them(khung(trang, W, H, h, 150, 2))
  const khac = taoTrang(W, 1400, 99)
  const r = bo.them(khung(khac, W, 1400, h, 300, 3))
  kiem('[DOI CHUNG] khung cua mot trang KHAC -> "lac", chieu cao khong doi', r.loai === 'lac' && bo.cao === h + 150, r.loai + ' cao ' + bo.cao)
}
// ── 7. Co THAT 2400 x 1300 (man 4K 150 %): dung + toc do ──
{
  const W2 = 2400, H2 = 5200, h2 = 1300
  const t2 = taoTrang(W2, H2, 11)
  const r = chay(t2, W2, H2, h2, [180, 420, 0, 650, 900, -300, 500, 700, 380])
  const a = r.bo.layAnh()
  const tb = r.ms.reduce((s, v) => s + v, 0) / r.ms.length, max = Math.max(...r.ms)
  kiem('[7] co that 2400x1300: ghep dung (cao + noi dung), khong lac', dem(r.loai, 'lac') === 0 && a.h === r.xa + h2 && lech(a.buf, t2, W2, 0, 0, a.h) <= 2.5, 'cao ' + a.h + ', lech ' + lech(a.buf, t2, W2, 0, 0, a.h).toFixed(2))
  kiem('[7] toc do: moi khung <= 200 ms (app chup 5 khung / giay)', max <= 200, 'trung binh ' + tb.toFixed(0) + ' ms, cham nhat ' + max.toFixed(0) + ' ms')
}

// ── 10. CA THAT 06/10 11:28 (anh: "chụp cuộn không hoạt động"): vung khoanh la app co 2 khung canh nhau + thanh ben, nen
//        TOI; lan chuot chi cuon MOT cot (53 % be rong), phan con lai DUNG YEN. Run-log that: 27 khung, 26 'dung', them = 0. ──
{
  const x0 = 80, x1 = 560 // cot cuon
  const toi = (b) => { for (let i = 0; i < b.length; i += 4) { b[i] = 28 + ((255 - b[i]) >> 2); b[i + 1] = 28 + ((255 - b[i + 1]) >> 2); b[i + 2] = 30 + ((255 - b[i + 2]) >> 2) } return b }
  const nen = taoTrang(W, h, 23) // phan dung yen: mot man hinh co chu / khoi (thanh ben + khung thu hai)
  const kh = (tu, hat) => {
    const f = khung(nen, W, h, h, 0, hat), p = khung(trang, W, H, h, tu, hat + 1)
    for (let y = 0; y < h; y++) p.copy(f, (y * W + x0) * 4, (y * W + x0) * 4, (y * W + x1) * 4)
    return toi(f)
  }
  const bo = taoBoGhep(W, h)
  let tu = 0
  const loai = [bo.them(kh(0, 500)).loai]
  ;[60, 140, 0, 220, 90, 300, 180, 40, 260].forEach((d, i) => { tu += d; loai.push(bo.them(kh(tu, 510 + i * 2)).loai) })
  const a = bo.layAnh()
  // So RIENG cot cuon cua anh ghep voi trang goc (da doi sang nen toi)
  const goc = toi(Buffer.from(trang.subarray(0, Math.min(H, a.h) * W * 4)))
  let s = 0, n = 0
  for (let y = 0; y < Math.min(H, a.h); y++) for (let x = x0 + 4; x < x1 - 4; x++) { const i = (y * W + x) * 4; s += Math.abs(a.buf[i] - goc[i]) + Math.abs(a.buf[i + 1] - goc[i + 1]) + Math.abs(a.buf[i + 2] - goc[i + 2]); n += 3 }
  kiem('[10] chi MOT cot cuon, phan con lai dung yen, nen toi: van noi dung chieu cao (khong coi la "dung")', a.h === tu + h && loai.filter((v) => v === 'them').length === 8 && loai[3] === 'dung', 'cao ' + a.h + ' / ' + (tu + h) + ' ' + loai.join(' '))
  kiem('[10] cot cuon trong anh ghep khop trang goc (lech <= 2,5 / kenh)', a.h === tu + h && s / n <= 2.5, 'lech ' + (s / Math.max(1, n)).toFixed(2))
}
// ── 11. CA THAT 06/10 12:53 (anh: "scroll không được nữa rồi em"): vung khoanh la bai Facebook co VIDEO chiem ~75 % chieu
//        cao. Anh luu ra: video DEN o khung dau (cua so chup vua dong). Run-log that: 82 khung, dung = 2, lac = 79, them = 0.
//        Video nam TREN trang (troi theo trang), 3 khung dau den, tu khung thu 4 co hinh va DOI HINH moi khung. ──
{
  const vY0 = 130, vY1 = 560, vX0 = 40, vX1 = 860 // video tren trang: 430 / 600 hang = 72 % chieu cao, 91 % be rong
  const khV = (tu, hat, i) => {
    const f = khung(trang, W, H, h, tu, hat)
    const rnd = ngauNhien(9000 + i * 31)
    const o = []
    for (let k = 0; k < 400; k++) o.push(i < 3 ? 0 : 30 + Math.floor(rnd() * 200)) // moi khung mot bo o sang toi khac han
    for (let y = 0; y < h; y++) {
      const yP = y + tu
      if (yP < vY0 || yP >= vY1) continue
      for (let x = vX0; x < vX1; x++) { const v = o[(((yP - vY0) / 30) | 0) * 21 + (((x - vX0) / 40) | 0)]; const j = (y * W + x) * 4; f[j] = v; f[j + 1] = v; f[j + 2] = v }
    }
    return f
  }
  const buoc = [0, 0, 0, 80, 120, 0, 200, 150, 90, 260, 180, 0, 140, 220]
  const chayV = (tuyChon) => {
    const bo = taoBoGhep(W, h, tuyChon)
    let tu = 0
    const loai = [bo.them(khV(0, 700, 0)).loai]
    buoc.forEach((d, i) => { tu += d; loai.push(bo.them(khV(tu, 702 + i * 2, i + 1)).loai) })
    return { bo, loai, tu }
  }
  const r = chayV()
  const a = r.bo.layAnh()
  const dungCao = a.h === r.tu + h
  const lTren = dungCao ? lech(a.buf, trang, W, 0, 0, vY0) : 999, lDuoi = dungCao ? lech(a.buf, trang, W, vY1, vY1, a.h - vY1) : 999
  kiem('[11] video 72 % chieu cao, den 3 khung dau roi doi hinh moi khung: van noi DUNG chieu cao, khong khung nao "lac"', dungCao && dem(r.loai, 'lac') === 0 && dem(r.loai, 'them') === buoc.filter((d) => d > 0).length, 'cao ' + a.h + ' / ' + (r.tu + h) + ' ' + r.loai.join(' ') + ' ' + JSON.stringify(r.bo.dem))
  kiem('[11] phan NGOAI video (tren + duoi) khop trang goc (lech <= 2,5 / kenh)', lTren <= 2.5 && lDuoi <= 2.5, 'tren ' + lTren.toFixed(2) + ', duoi ' + lDuoi.toFixed(2))
  let sang = 0, nS = 0
  if (dungCao) for (let y = vY0 + 10; y < vY1 - 10; y += 7) for (let x = vX0 + 10; x < vX1 - 10; x += 9) { sang += a.buf[(y * W + x) * 4 + 1]; nS++ }
  kiem('[11] khung dau duoc thay bang khung moi nhat TRUOC khi cuon: o video trong anh dai khong con den', nS > 0 && sang / nS > 60, 'do sang o video ' + (nS ? (sang / nS).toFixed(0) : '?') + ' (den = 0)')
  // DOI CHUNG: tat duong "ben" -> phai ra DUNG chuoi cua run-log that: dau, dung, dung, roi lac het, khong noi hang nao
  const c = chayV({ khongBen: true })
  kiem('[DOI CHUNG 11] bo ghep CU (khong co duong "ben"): dau, dung, dung roi "lac" het, them = 0 (dung nhu run-log 12:53)', c.loai[1] === 'dung' && c.loai[2] === 'dung' && c.loai.slice(3).every((v) => v === 'lac') && c.bo.cao === h, c.loai.join(' '))
}
// ── 12. Duong "ben" KHONG duoc noi bua: cuon vuot phan chong tren trang co video van phai "lac" ──
{
  const bo = taoBoGhep(W, h)
  bo.them(khung(trang, W, H, h, 3300, 1)) // cho nay khong co bang lap (bang lap nam o hang ~2600: hoa tiet lap + cuon vuot
  bo.them(khung(trang, W, H, h, 3400, 2)) // phan chong thi KHONG cach nao phan biet duoc, ke ca duong chinh)
  const r1 = bo.them(khung(trang, W, H, h, 3400 + 590, 3)) // vuot 85 %
  const r2 = bo.them(khung(taoTrang(W, 1400, 123), W, 1400, h, 500, 4)) // trang khac han
  kiem('[12] co duong "ben": cuon vuot phan chong va trang khac han van "lac", chieu cao khong doi', r1.loai === 'lac' && r2.loai === 'lac' && bo.cao === h + 100, r1.loai + ' ' + r2.loai + ' cao ' + bo.cao)
}
// ── 13. CA THAT 06/10 13:03 (luot thu hai cua anh sau ban 13:02; chuoi `...d'T'dLT'LLLLLLLLLLLL`, 19 'lac' cuoi): vung co
//        THANH MENU DINH co noi dung o tren dau (khong troi) LAN video -> hai khoi khong khop. ──
{
  const DINH = 90, vY0 = 230, vY1 = 500, vX0 = 40, vX1 = 860
  const khD = (tu, hat, i) => {
    const f = khung(trang, W, H, h, tu, hat)
    const rnd = ngauNhien(4000 + i * 17)
    const o = []
    for (let k = 0; k < 400; k++) o.push(i < 3 ? 0 : 30 + Math.floor(rnd() * 200))
    const dat = (x, y, v) => { const j = (y * W + x) * 4; f[j] = v; f[j + 1] = v; f[j + 2] = v }
    for (let y = DINH; y < h; y++) { // video (troi theo trang)
      const yP = y + tu
      if (yP < vY0 || yP >= vY1) continue
      for (let x = vX0; x < vX1; x++) dat(x, y, o[(((yP - vY0) / 30) | 0) * 21 + (((x - vX0) / 40) | 0)])
    }
    for (let y = 0; y < DINH; y++) for (let x = 0; x < W; x++) { // thanh menu dinh: 6 bieu tuong + hang nhan + vien duoi
      const bt = y >= 10 && y < 54 && (x % 150) >= 50 && (x % 150) < 94, nhan = y >= 62 && y < 74 && (x % 150) >= 30 && (x % 150) < 30 + 40 + ((x / 150) | 0) * 9
      dat(x, y, bt ? 40 : nhan ? 90 : y >= 87 ? 200 : 245)
    }
    return f
  }
  const buoc = [0, 0, 0, 60, 80, 0, 70, 90, 60, 100, 80, 90, 100]
  const chayD = (tuyChon) => {
    const bo = taoBoGhep(W, h, tuyChon)
    let tu = 0
    const loai = [bo.them(khD(0, 800, 0)).loai], sai = []
    buoc.forEach((d, i) => { tu += d; const k = bo.them(khD(tu, 802 + i * 2, i + 1)); loai.push(k.loai); if (k.loai === 'them' && k.d !== d) sai.push('khung ' + (i + 1) + ': do ' + k.d + ' / that ' + d) })
    return { bo, loai, tu, sai }
  }
  const r = chayD()
  if (r.sai.length) console.log('  [13] do lech do SAI: ' + r.sai.join(' · '))
  const a = r.bo.layAnh()
  const dungCao = a.h === r.tu + h
  const l1 = dungCao ? lech(a.buf, trang, W, DINH, DINH, vY0 - DINH) : 999, l2 = dungCao ? lech(a.buf, trang, W, vY1, vY1, a.h - vY1) : 999
  kiem('[13] thanh menu DINH co noi dung + video: van noi DUNG chieu cao, khong khung nao "lac"', dungCao && dem(r.loai, 'lac') === 0 && dem(r.loai, 'them') === buoc.filter((d) => d > 0).length, 'cao ' + a.h + ' / ' + (r.tu + h) + ' ' + JSON.stringify(r.bo.dem))
  kiem('[13] phan ngoai thanh dinh va ngoai video khop trang goc (lech <= 2,5 / kenh)', l1 <= 2.5 && l2 <= 2.5, 'giua ' + l1.toFixed(2) + ', duoi ' + l2.toFixed(2))
  const c = chayD({ khongBen: 'khong-bo-dinh' })
  kiem('[DOI CHUNG 13] duong ben ban 13:02 (khong bo hang dung yen): co khung "lac" ngay khi bat dau cuon (nhu luot that 13:03)', dem(c.loai, 'lac') > 0 && c.loai[4] === 'lac', c.bo.dem.chuoi + ' cao ' + c.bo.cao + ' / ' + (r.tu + h))
}
// ── 14. ECC soat 06/10: vong lap mot phien (chayPhien) khi nguon khung co van de ──
const cho14 = (async () => {
  const { chayPhien } = require(path.join(__dirname, '..', '..', 'src', 'chup-cuon.js'))
  // (a) khung DOI CO giua phien: phai bi bo qua, anh ghep van dung tung diem anh
  const buoc = [0, 120, 200, 90, 260, 150]
  let i = 0, tu = 0, soLay = 0
  const r = await chayPhien({
    layKhung: async () => {
      soLay++
      if (soLay === 3 || soLay === 5) return { buf: khung(trang, W - 100, H, h, 0, 77), w: W - 100, h } // khung hep hon 100 px: co khac
      if (i < buoc.length) tu += buoc[i++]
      return { buf: khung(trang, W, H, h, tu, 900 + i), w: W, h }
    },
    coDung: () => i >= buoc.length && soLay > buoc.length + 3, nghiMs: 1, toiDaMs: 20000,
  })
  const a = r.anh
  kiem('[14] khung doi co giua phien bi BO QUA: anh van cao dung va khop trang goc', !!a && a.w === W && a.h === tu + h && lech(a.buf, trang, W, 0, 0, a.h) <= 2.5 && r.dem.lac === 0, a ? 'cao ' + a.h + ' / ' + (tu + h) + ', lech ' + lech(a.buf, trang, W, 0, 0, Math.min(a.h, H)).toFixed(2) + ' ' + JSON.stringify(r.dem).slice(0, 70) : 'khong co anh')
  // (b) da co anh roi nguon CHET: phai dung som voi ly do 'mat-nguon', van tra phan da ghep
  let n = 0, tu2 = 0
  const t0 = Date.now()
  const r2 = await chayPhien({
    layKhung: async () => { n++; if (n > 4) return null; tu2 += n > 1 ? 100 : 0; return { buf: khung(trang, W, H, h, tu2, 950 + n), w: W, h } },
    coDung: () => false, nghiMs: 2, toiDaMs: 20000, toiDaHong: 15,
  })
  kiem('[14] nguon khung chet sau 4 khung: dung som "mat-nguon" (khong cho het gio), van tra anh da ghep', r2.lyDo === 'mat-nguon' && Date.now() - t0 < 3000 && !!r2.anh && r2.anh.h === tu2 + h, r2.lyDo + ' sau ' + (Date.now() - t0) + ' ms, cao ' + (r2.anh && r2.anh.h) + ' / ' + (tu2 + h))
  // (c) vai lan mat khung LE TE roi co lai: khong duoc dung
  let m = 0, tu3 = 0
  const r3 = await chayPhien({
    layKhung: async () => { m++; if (m % 3 === 0) return null; tu3 += m > 1 ? 60 : 0; return { buf: khung(trang, W, H, h, tu3, 980 + m), w: W, h } },
    coDung: () => m >= 30, nghiMs: 1, toiDaMs: 20000, toiDaHong: 5,
  })
  kiem('[14] mat khung le te (1 / 3 lan) roi co lai: KHONG dung som, ghep du', r3.lyDo === 'dung' && !!r3.anh && r3.anh.h === tu3 + h, r3.lyDo + ' cao ' + (r3.anh && r3.anh.h) + ' / ' + (tu3 + h))
})()
// ── 8. Day noi trong app (doc ma) ──
{
  const fs = require('fs')
  const doc = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8')
  const main = doc('src/main.js'), ov = doc('src/overlay/overlay.js'), html = doc('src/overlay/index.html'), i18n = doc('src/i18n.js')
  kiem('[8] man chup: co nut Chup cuon (so 9), phim 9 va nut deu goi chupCuon()', /data-tool="cuon"[\s\S]*?<i class="so">9<\/i>/.test(html) && /e\.key === '9'[\s\S]{0,120}chupCuon\(\)/.test(ov) && /dataset\.tool === 'cuon'\) \{ chupCuon\(\)/.test(ov))
  kiem('[8] main: nhan { cuon } tu man chup; nut Xong va phim tat chup deu dung duoc phien cuon', /payload\.cuon && payload\.rect/.test(main) && /'quay:dung', \(\) => \{ if \(cuon\) \{ cuon\.dung = true/.test(main) && /if \(cuon\) \{ cuon\.dung = true; return \}/.test(main))
  const khoa = ['overlay.cuon', 'cuon.xong', 'cuon.xongTitle', 'cuon.khongGhep', 'cuon.chamTran', 'cuon.matNguon']
  const thieu = khoa.filter((k) => i18n.split('\n').filter((l) => l.includes("'" + k + "'")).length !== 2)
  kiem('[8] main: chup cuon loi thi BAO nguoi dung (khong chi ghi log); mat nguon hinh co thong bao rieng', /chup-cuon LOI: [\s\S]{0,260}new Notification/.test(main) && /kq\.lyDo === 'mat-nguon' \? 'cuon\.matNguon'/.test(main))
  kiem('[8] 6 khoa chu cua chup cuon co du 2 ngon ngu, khong gach ngang dai', thieu.length === 0 && !i18n.split('\n').filter((l) => /'(overlay\.cuon|cuon\.)/.test(l)).some((l) => l.includes('—')), thieu.join(', '))
}
// ── 9. Trong Electron AN: man chup that gui dung lenh + duong ANH THAT (JPEG cua Electron) + vong lap mot phien ──
{
  const fs = require('fs')
  const { spawnSync } = require('child_process')
  const ROOT = path.join(__dirname, '..', '..')
  const RA = path.join(ROOT, '.selftest', 'chup-cuon')
  fs.mkdirSync(RA, { recursive: true })
  const fTrang = path.join(RA, 'trang.bin')
  fs.writeFileSync(fTrang, trang)
  const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const c = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'chup-cuon-main.cjs'), fTrang, String(W), String(H), String(h)], { env, encoding: 'utf8', timeout: 120000 })
  const dong = (c.stdout || '').split(/\r?\n/).find((d) => d.startsWith('KQ='))
  let u = null
  try { u = JSON.parse(dong.slice(3)) } catch (e) {}
  kiem('[9] Electron thu chay xong', c.status === 0 && !!u, 'status ' + c.status + ' ' + ((c.stdout || '').split(/\r?\n/).find((d) => d.startsWith('LOI=')) || '').slice(0, 200))
  if (u) {
    const dung = (ds) => ds.length === 1 && ds[0].cuon === true && ds[0].rect && ds[0].rect.w === 600 && ds[0].rect.h === 400
    kiem('[9] man chup that: nut co chu goi y + so 9, thanh cong cu nam tron trong man', !!u.nut && /9/.test(u.nut.goiY) && u.nut.so === '9' && u.nut.trai >= 0 && u.nut.phai <= u.nut.cuaSo, u.nut ? u.nut.trai + '..' + u.nut.phai + ' / ' + u.nut.cuaSo : 'khong co nut')
    kiem('[9] phim 9 gui dung 1 lenh { rect 600x400, cuon: true }; bam nut cung vay', dung(u.phim9) && dung(u.bamNut), JSON.stringify(u.phim9).slice(0, 120))
    const p = u.phien
    kiem('[9] duong anh THAT (JPEG q85 cua Electron): ghep dung chieu cao, khong lac', p.lyDo === 'dung' && p.h === p.canCao && p.w === W && p.dem.lac === 0, 'cao ' + p.h + ' / ' + p.canCao + ' ' + JSON.stringify(p.dem))
    kiem('[9] noi dung khop trang goc qua nen JPEG (lech <= 4 / kenh)', p.lech <= 4, 'lech ' + p.lech)
    kiem('[9] anh dai dung duoc thanh anh that va ghi ra PNG / JPEG dung co', u.anh && !u.anh.rong && u.anh.w === W && u.anh.h === p.h && u.anh.png > 1000 && u.anh.jpg > 1000, JSON.stringify(u.anh))
    const v = u.video || {}
    kiem('[9] ca video 12:53 qua JPEG q85 THAT: noi dung chieu cao, khong lac, phan ngoai video khop trang goc (lech <= 4)', v.lyDo === 'dung' && v.h === v.canCao && v.dem && v.dem.lac === 0 && v.dem.them === 9 && v.lech <= 4, 'cao ' + v.h + ' / ' + v.canCao + ', lech ' + v.lech + ' ' + JSON.stringify(v.dem))
    kiem('[9] khong ai bam Xong -> phien tu dung o tran thoi gian (400 ms), van tra anh', u.hetGio.lyDo === 'het-gio' && u.hetGio.ms >= 380 && u.hetGio.ms < 1500 && u.hetGio.cao === h, JSON.stringify(u.hetGio))
    kiem('[9] luong chup khong tra khung nao -> bo, khong treo, khong co anh', u.khongKhung.lyDo === 'khong-co-khung' && u.khongKhung.anh === false, JSON.stringify(u.khongKhung))
  }
}

// muc [14] chay khong dong bo -> cho no xong roi moi in ket qua (loi trong do cung phai lam bai do TRUOT)
cho14.catch((e) => kiem('[14] bai do vong lap mot phien chay duoc', false, String((e && e.stack) || e).slice(0, 200))).then(() => {
  console.log('\n' + '='.repeat(60))
  console.log(kq.join('\n'))
  console.log('='.repeat(60))
  console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
  if (!dat) process.exit(1)
})
