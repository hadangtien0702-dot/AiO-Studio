'use strict'
/* CHUP CUON TRANG DAI — BO GHEP (06/10/2026, tinh nang 3/3 cua luot anh chot: "Chụp cuộn trang dài").
   Nguoi dung khoanh vung, bam Chup cuon, roi TU LAN CHUOT cuon trang xuong (nhu CleanShot); app chup vung do lien tuc
   va dua tung khung vao day. Bo ghep tim xem noi dung da TROI bao nhieu hang so voi khung truoc roi noi dung phan MOI
   vao anh dai. Khong phu thuoc Electron (nhan mang BGRA) -> kiem duoc bang trang gia lap co dap an: npm run test:chupcuon.

   CACH TIM DO TROI: moi hang thu gon thanh K so (do sang trung binh cua K dai cot). Thu tung do lech d (am = cuon
   nguoc): chi phi = lech trung binh giua cac hang chong nhau. Chon d co chi phi nho nhat neu:
   - chi phi <= NGUONG (hai khung that su khop), va
   - phan chong nhau co du hang "co noi dung" (hang khac hang ke no) — vung trang phang khop voi moi d, khong tin duoc.
   Chi phi moi hang bi CHAN TRAN: vai hang khong troi theo (thanh dinh tren trang) khong pha duoc ket qua.
   Nhieu d gan bang nhau (hoa tiet lap) -> lay d co |d| NHO nhat (chup du day thi troi it la hop ly nhat).

   KET QUA cua them(): 'dau' (khung dau) · 'dung' (trang dung yen) · 'them' (da noi n hang) · 'lui' (cuon nguoc / chua
   vuot qua phan da co) · 'lac' (khong khop: cuon qua nhanh hoac noi dung doi han — KHONG cap nhat khung moc, cuon
   nguoc lai mot chut la bat lai duoc) · 'day' (cham tran chieu cao). */

const K = 12          // so dai cot moi hang
const BUOC_COT = 4    // lay mau moi 4 diem anh theo chieu ngang
const BUOC_HANG = 2   // so sanh moi 2 hang (du chinh xac, nhanh gap doi)
const TRAN_HANG = 10  // chan chi phi moi hang: toi da 10 don vi sang / dai
const NGUONG = 3.2    // chi phi trung binh / dai <= muc nay moi coi la khop (nhieu JPEG ~1)
const CO_NOI_DUNG = 24 // hang "co noi dung": tong lech K dai voi hang ke > muc nay. ☠️ 6 la SAI (do 06/10): nhieu +-3 cua
                       // anh JPEG tu no da cho ~6,4 -> trang trang phang bi coi la co noi dung va bo ghep BIA ra do cuon.
const KHAC_DAI = 10    // hang "co noi dung": dai sang nhat - dai toi nhat > muc nay (nhieu chi cho ~2)
const IT_NHAT_HANG = 10 // phan chong nhau phai co it nhat tung nay hang co noi dung

/* Moi hang -> K so do sang (0..255). bgra: Buffer / Uint8Array BGRA w x h. Tra { f: Uint8Array(h * K), co: Uint8Array(h) } */
function dacTrung(bgra, w, h) {
  const f = new Uint8Array(h * K)
  const bw = Math.max(1, Math.floor(w / K))
  for (let y = 0; y < h; y++) {
    const dong = y * w * 4
    for (let k = 0; k < K; k++) {
      let s = 0, n = 0
      const x1 = Math.min(w, (k + 1) * bw)
      for (let x = k * bw; x < x1; x += BUOC_COT) { const i = dong + x * 4; s += bgra[i] + (bgra[i + 1] << 1) + bgra[i + 2]; n++ }
      f[y * K + k] = n ? (s / n) >> 2 : 0
    }
  }
  /* Hang co noi dung = cac dai cua no KHAC nhau ro (co chu / hinh: lon nhat - nho nhat > KHAC_DAI), hoac no khac hang
     ngay duoi (mep cua mot khoi). ☠️ Chi xet "khac hang ke" la thieu (do 06/10): cac hang nam GIUA mot dong chu giong
     het hang ke nen bi coi la trong -> 12 / 42 khung bi tu choi oan. */
  const co = new Uint8Array(h)
  for (let y = 0; y < h; y++) {
    let lon = 0, nho = 255, s = 0
    for (let k = 0; k < K; k++) {
      const v = f[y * K + k]
      if (v > lon) lon = v
      if (v < nho) nho = v
      if (y + 1 < h) { const a = v - f[(y + 1) * K + k]; s += a < 0 ? -a : a }
    }
    co[y] = lon - nho > KHAC_DAI || s > CO_NOI_DUNG ? 1 : 0
  }
  return { f, co }
}

/* Chi phi khi khung moi B lech d hang so voi khung moc A (d > 0: noi dung troi LEN d hang = da cuon xuong).
   B[r] ung voi A[r + d]. Tra { cp (trung binh / dai), co (so hang co noi dung trong phan chong) } hoac null neu vuot `tot`. */
function chiPhi(A, B, h, d, tot) {
  const r0 = d < 0 ? -d : 0, r1 = d > 0 ? h - d : h
  let s = 0, n = 0, co = 0
  const tran = TRAN_HANG * K
  const nguongSom = tot === Infinity ? Infinity : tot * K * Math.ceil((r1 - r0) / BUOC_HANG) * 1.02
  for (let r = r0; r < r1; r += BUOC_HANG) {
    const a = (r + d) * K, b = r * K
    let t = 0
    for (let k = 0; k < K; k++) { const e = A.f[a + k] - B.f[b + k]; t += e < 0 ? -e : e }
    s += t > tran ? tran : t
    n++
    if (B.co[r]) co++
    if (s > nguongSom) return null // da te hon ung vien tot nhat
  }
  return n ? { cp: s / (n * K), co } : null
}

/* Tim do troi cua B so voi A. Tra { d, cp } hoac null (khong khop). */
function timLech(A, B, h) {
  const xa = h - Math.max(24, Math.round(h * 0.15)) // phai con chong nhau it nhat 15 % chieu cao
  // Luot 1: gom moi ung vien dat nguong + tim chi phi NHO NHAT.
  // ☠️ 06/10 ban dau gop "chon nho nhat" voi "uu tien troi it" trong mot vong (cho lech 15 %): khi co thanh co dinh
  //    (chi phi nen cao len deu) thi ung vien d - 1 lot vao khoang 15 % va thang -> anh dai lech 1 hang. Phai tach 2 luot.
  const ung = []
  let nho = Infinity
  for (let d = -xa; d <= xa; d++) {
    const c = chiPhi(A, B, h, d, nho)
    if (!c || c.cp > NGUONG || c.co < IT_NHAT_HANG) continue
    ung.push({ d, cp: c.cp })
    if (c.cp < nho) nho = c.cp
  }
  if (!ung.length) return null
  // Luot 2: chi cac ung vien GAN BANG nho nhat (hoa tiet lap that su: lech <= 2 %) moi duoc xet "troi it hon"
  let tot = null
  for (const u of ung) {
    if (u.cp > nho * 1.02 + 0.01) continue
    if (!tot || Math.abs(u.d) < Math.abs(tot.d)) tot = u
  }
  return tot
}

/* w, h: co khung (diem anh that). tuyChon.toiDaCao: tran chieu cao anh dai (mac dinh 16.000). */
function taoBoGhep(w, h, tuyChon) {
  const toiDaCao = Math.max(h, (tuyChon && tuyChon.toiDaCao) || 16000)
  const hang = w * 4
  const manh = []      // cac manh da noi (Buffer), theo thu tu tu tren xuong
  let cao = 0          // chieu cao anh dai hien tai
  let y = 0            // vi tri dinh cua khung MOC trong anh dai
  let moc = null       // dac trung cua khung moc (khung khop gan nhat)
  let lacLien = 0      // so khung "lac" lien tiep
  const dem = { khung: 0, them: 0, dung: 0, lui: 0, lac: 0 }

  function them(bgra) {
    if (!bgra || bgra.length < w * h * 4) return { loai: 'lac', cao, lacLien }
    dem.khung++
    const B = dacTrung(bgra, w, h)
    if (!moc) {
      manh.push(Buffer.from(bgra.subarray(0, h * hang)))
      cao = h; y = 0; moc = B
      return { loai: 'dau', cao, lacLien: 0 }
    }
    const r = timLech(moc, B, h)
    if (!r) { dem.lac++; lacLien++; return { loai: 'lac', cao, lacLien } }
    lacLien = 0
    if (r.d === 0) { dem.dung++; return { loai: 'dung', cao, lacLien } }
    y += r.d; moc = B
    let n = y + h - cao // so hang MOI nam duoi day anh dai
    if (n <= 0) { dem.lui++; return { loai: 'lui', d: r.d, cao, lacLien } }
    let day = false
    if (cao + n > toiDaCao) { n = toiDaCao - cao; day = true }
    if (n > 0) {
      // Khung dang phu cac hang [y, y + h) cua anh dai; anh dai da co [0, cao) -> phan moi bat dau o hang (cao - y) cua khung
      const batDau = cao - y
      manh.push(Buffer.from(bgra.subarray(batDau * hang, (batDau + n) * hang)))
      cao += n
    }
    dem.them++
    return { loai: day ? 'day' : 'them', d: r.d, n, cao, lacLien }
  }

  /* Anh dai BGRA: { buf, w, h } */
  function layAnh() { return { buf: Buffer.concat(manh, cao * hang), w, h: cao } }

  return { them, layAnh, get cao() { return cao }, get dem() { return Object.assign({}, dem) } }
}

/* MOT PHIEN chup cuon: lap lai "lay khung -> dua vao bo ghep" toi khi nguoi dung bam Xong / het gio / cham tran.
   o.layKhung(): async -> { buf (BGRA), w, h } | null (khong lay duoc khung luc nay)
   o.coDung(): true khi nguoi dung bam Xong · o.nghiMs: nghi giua 2 lan lay · o.toiDaMs · o.toiDaCao
   o.baoTrangThai({ loai, cao, lacLien }): goi sau moi khung (de giao dien nhac "cuon cham lai")
   Tra { anh: { buf, w, h } | null, dem, lyDo: 'dung' | 'het-gio' | 'day' | 'khong-co-khung', ms }. Khong nem. */
async function chayPhien(o) {
  const nghi = (ms) => new Promise((r) => setTimeout(r, ms))
  const t0 = Date.now()
  let bo = null, lyDo = 'dung', hong = 0
  while (!o.coDung()) {
    if (Date.now() - t0 >= (o.toiDaMs || 180000)) { lyDo = 'het-gio'; break }
    let k = null
    try { k = await o.layKhung() } catch (e) { k = null }
    if (!k || !k.buf || !(k.w > 0) || !(k.h > 0)) {
      if (++hong >= 20 && !bo) { lyDo = 'khong-co-khung'; break } // 20 lan lien khong co khung nao tu dau: bo
      await nghi(o.nghiMs || 90); continue
    }
    if (!bo) bo = taoBoGhep(k.w, k.h, { toiDaCao: o.toiDaCao })
    if (k.w * k.h * 4 > k.buf.length) { await nghi(o.nghiMs || 90); continue } // khung thieu du lieu: bo qua
    const r = bo.them(k.buf)
    if (o.baoTrangThai) { try { o.baoTrangThai(r) } catch (e) {} }
    if (r.loai === 'day') { lyDo = 'day'; break }
    await nghi(o.nghiMs || 90)
  }
  return { anh: bo && bo.cao > 0 ? bo.layAnh() : null, dem: bo ? bo.dem : null, lyDo, ms: Date.now() - t0 }
}

module.exports = { taoBoGhep, chayPhien, dacTrung, timLech }
