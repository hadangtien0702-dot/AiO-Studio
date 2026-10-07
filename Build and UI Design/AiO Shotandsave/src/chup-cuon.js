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
const DUNG_YEN = 1.0   // moi dai lech trung binh < muc nay khi khong troi = trang dung yen (hai khung nhieu doc lap cho ~0,55)
const IT_NHAT_HANG = 10 // phan chong nhau phai co it nhat tung nay hang co noi dung
// Duong "BEN" (06/10 12:53, xem timLechBen): chi dung khi cach tinh trung binh o tren khong khop
const KHOP_HANG = 2.5   // mot hang "khop" khi lech trung binh moi dai <= muc nay (4 la qua long: khop nham, muc [12])
const CON_LAI_KHOP = 0.85 // bo khoi khong khop dai nhat ra, phan con lai phai khop >= 85 % so hang co noi dung
const BANG = 16         // mot bang = 16 hang lay mau (32 diem anh)
const BANG_IT_HANG = 4  // bang phai co it nhat tung nay hang co noi dung moi duoc xet
const BANG_TOT = 0.85   // bang "tot": >= 85 % hang co noi dung cua no khop
const IT_NHAT_BANG = 3  // can it nhat 3 bang tot ...
const IT_NHAT_KHOP = 24 // ... va tong 24 hang khop trong cac bang tot (~48 diem anh noi dung khop lien khoi)

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
function chiPhi(A, B, h, d, tot, dai, co1) {
  const r0 = d < 0 ? -d : 0, r1 = d > 0 ? h - d : h
  let s = 0, n = 0, co = 0
  const D = dai.length
  const tran = TRAN_HANG * D
  const nguongSom = tot === Infinity ? Infinity : tot * D * Math.ceil((r1 - r0) / BUOC_HANG) * 1.02
  for (let r = r0; r < r1; r += BUOC_HANG) {
    const a = (r + d) * K, b = r * K
    let t = 0
    for (let j = 0; j < D; j++) { const k = dai[j]; const e = A.f[a + k] - B.f[b + k]; t += e < 0 ? -e : e }
    s += t > tran ? tran : t
    n++
    if (co1[r]) co++
    if (s > nguongSom) return null // da te hon ung vien tot nhat
  }
  return n ? { cp: s / (n * D), co } : null
}

/* Duong "BEN". ☠️ 06/10 12:53, ca that cua anh ("scroll không được nữa"): vung khoanh la bai Facebook co VIDEO chiem ~75 %
   chieu cao. Video doi hinh khong theo do cuon (va den o khung dau vi cua so chup vua dong) -> chi phi TRUNG BINH ca khung
   vuot nguong voi MOI do lech -> 82 khung: 2 'dung', 79 'lac', khong noi hang nao; da 'lac' thi khung moc khong doi nen
   lac toi het phien. O day khong tinh trung binh: chia phan chong thanh cac BANG 32 diem anh, bang "tot" khi gan nhu moi
   hang co noi dung cua no khop (phan trang ngoai video khop LIEN KHOI; o do lech sai chi khop lac dac nen khong bang nao
   tot). Chon do lech co nhieu hang khop nhat trong cac bang tot. Tra { d, cp: 0, ben: true } hoac null. */
function timLechBen(A, B, h, dai, co1, xa, khongBoDinh) {
  const D = dai.length, nguong = KHOP_HANG * D, buocBang = BANG * BUOC_HANG
  /* ☠️ 06/10 13:03, luot that thu hai cua anh sau ban 13:02 (chuoi `...d'T'dLT'LLLLLLLLLLLL`, 19 'lac' cuoi): vung khoanh co
     ca THANH MENU DINH tren dau trang (khong troi) lan video -> HAI khoi khong khop, luat "chi mot khoi" tu choi. Hang nao
     khop khi KHONG troi (d = 0) la hang DUNG YEN (thanh dinh): khi xet do lech khac 0 thi bo cac hang do ra, khong tinh la
     "khong khop". Co do lech khac 0 dat thi lay no (trang da cuon that); khong co moi xet "dung yen". */
  const yen = new Uint8Array(h)
  if (!khongBoDinh) {
    for (let r = 0; r < h; r++) {
      if (!co1[r]) continue
      const o = r * K
      let t = 0
      for (let j = 0; j < D && t <= nguong; j++) { const k = dai[j]; const e = A.f[o + k] - B.f[o + k]; t += e < 0 ? -e : e }
      if (t <= nguong) yen[r] = 1
    }
  }
  const ung = []
  let lon = 0, khong = null
  for (let d = -xa; d <= xa; d++) {
    const r0 = d < 0 ? -d : 0, r1 = d > 0 ? h - d : h
    let tot = 0, diem = 0, nCo = 0, nKhop = 0, bang = -1
    let bT = 0, tTong = 0, xT = 0, pT = 0, mT = 0 // sai so tung hang (hang khong khop tinh 2 x nguong): bang · tong · day xau · cho · day xau dai nhat
    let coTong = 0, khopTong = 0           // moi hang co noi dung trong phan chong
    let xCo = 0, xKhop = 0, coXau = false  // day bang XAU lien nhau dang di qua
    let pCo = 0, pKhop = 0                 // cac bang it noi dung nam ngay sau day xau (gop vao neu day xau con tiep)
    let mCo = 0, mKhop = 0                 // day bang xau DAI NHAT (= khoi video / hoat hinh)
    const dong = () => { // dong mot bang
      coTong += nCo; khopTong += nKhop; tTong += bT
      if (nCo < BANG_IT_HANG) { if (coXau) { pCo += nCo; pKhop += nKhop; pT += bT } return }
      if (nKhop >= nCo * BANG_TOT) { // bang tot: ket thuc day xau
        tot++; diem += nKhop
        if (xCo > mCo) { mCo = xCo; mKhop = xKhop; mT = xT }
        xCo = 0; xKhop = 0; xT = 0; pCo = 0; pKhop = 0; pT = 0; coXau = false
      } else { xCo += nCo + pCo; xKhop += nKhop + pKhop; xT += bT + pT; pCo = 0; pKhop = 0; pT = 0; coXau = true }
    }
    for (let r = r0; r < r1; r += BUOC_HANG) {
      const b = (r / buocBang) | 0
      if (b !== bang) { if (bang >= 0) dong(); bang = b; nCo = 0; nKhop = 0; bT = 0 }
      if (!co1[r] || (d !== 0 && yen[r])) continue
      nCo++
      const a = (r + d) * K, o = r * K
      let t = 0
      for (let j = 0; j < D && t <= nguong; j++) { const k = dai[j]; const e = A.f[a + k] - B.f[o + k]; t += e < 0 ? -e : e }
      if (t <= nguong) { nKhop++; bT += t } else bT += nguong * 2
    }
    if (bang >= 0) dong()
    if (xCo > mCo) { mCo = xCo; mKhop = xKhop; mT = xT }
    if (tot < IT_NHAT_BANG || diem < IT_NHAT_KHOP) continue
    /* ☠️ Chi "du 3 bang tot" la CHUA du (bai do muc [12] bat duoc): mot khoi anh chuyen mau cua trang KHAC tinh co khop 3
       bang -> noi bua. Luat: chi MOT khoi lien nhau duoc phep khong khop (video / hoat hinh); bo khoi do ra thi phan con
       lai phai khop gan het. */
    if (khopTong - mKhop < (coTong - mCo) * CON_LAI_KHOP) continue
    if (d === 0 && !khongBoDinh) { khong = { d: 0, cp: 0, ben: true }; continue }
    // Sai so tinh tren MOI hang ngoai khoi khong khop dai nhat (khong chi cac bang tot: bang hong vi lech 1 diem anh phai bi tinh)
    ung.push({ d, diem, cp: (tTong - mT) / (Math.max(1, coTong - mCo) * D) })
    if (diem > lon) lon = diem
  }
  if (!ung.length) return khong
  /* ☠️ Chon theo "nhieu hang khop nhat" la KHONG du chinh xac (muc [13] bat: anh dai thieu 2 hang / 1330): lech 1 diem anh
     thi phan lon hang nam giua mot net day van khop -> diem gan bang -> luat "troi it nhat" chon nham d - 1. Nhu duong
     chinh: trong cac ung vien du diem, lay SAI SO nho nhat; chi cac ung vien sai so gan bang (hoa tiet lap that) moi xet
     "troi it nhat". ☠️ Sai so phai tinh ca cac bang KHONG tot (tru khoi video): chi tinh bang tot thi d - 1 van hoa (do: 0,473 / 0,460). */
  let nho = Infinity
  for (const u of ung) if (u.diem >= lon * 0.8 && u.cp < nho) nho = u.cp
  let chon = null
  for (const u of ung) {
    if (u.diem < lon * 0.8 || u.cp > nho * 1.02 + 0.01) continue
    if (!chon || Math.abs(u.d) < Math.abs(chon.d)) chon = u
  }
  /* ☠️ SOI KY quanh do lech da chon (muc [13] bat: do 59 / that 60, 79 / that 80): vong tren chi so moi BUOC_HANG = 2 hang;
     khoi hinh co soc deu 6 diem anh thi lech DUNG 1 diem anh lot qua ke (hang le khong bao gio duoc so) -> hai ung vien
     hoa nhau. So lai TUNG hang cho 5 do lech d - 2 .. d + 2, lay cai sai so nho nhat (phai nho hon han 1 % moi doi). */
  const ky = (d) => {
    const r0 = d < 0 ? -d : 0, r1 = d > 0 ? h - d : h
    let s = 0, n = 0
    for (let r = r0; r < r1; r++) {
      if (!co1[r] || yen[r]) continue
      const a = (r + d) * K, o = r * K
      let t = 0
      for (let j = 0; j < D && t <= nguong; j++) { const k = dai[j]; const e = A.f[a + k] - B.f[o + k]; t += e < 0 ? -e : e }
      s += t <= nguong ? t : nguong * 2
      n++
    }
    return n ? s / n : Infinity
  }
  let dChon = chon.d, cpKy = ky(chon.d)
  for (let dd = chon.d - 2; dd <= chon.d + 2; dd++) {
    if (dd === chon.d || dd === 0 || dd < -xa || dd > xa) continue
    const c = ky(dd)
    if (c < cpKy * 0.99) { dChon = dd; cpKy = c }
  }
  return { d: dChon, cp: chon.cp, ben: true }
}

/* Tim do troi cua B so voi A. Tra { d, cp, doi?, ben? } hoac null (khong khop). doi = noi dung co doi (khong phai dung yen
   that); ben = tim ra bang duong "ben". khongBen (chi bai do dung): tat duong "ben" de doi chung cach cu. */
function timLech(A, B, h, khongBen) {
  /* ☠️ 06/10 11:28, luot dau tien cua anh tren man that: vung khoanh la app co 2 khung canh nhau + thanh ben, lan chuot
     chi cuon MOT cot -> phan lon be rong DUNG YEN -> so ca chieu ngang thi d = 0 luon re nhat: 27 khung, 26 'dung', khong noi
     hang nao (bai do luc do chi co trang cuon HET be rong). Nay: tim cac DAI COT dang chuyen dong (khac nhau khi khong
     troi) va chi dung cac dai do de tinh do troi; khong dai nao doi = trang dung yen that. */
  const e = new Float64Array(K)
  let soHang = 0
  for (let r = 0; r < h; r += BUOC_HANG) { const o = r * K; for (let k = 0; k < K; k++) { const v = A.f[o + k] - B.f[o + k]; e[k] += v < 0 ? -v : v } soHang++ }
  let lon = 0
  for (let k = 0; k < K; k++) { e[k] /= soHang; if (e[k] > lon) lon = e[k] }
  if (lon < DUNG_YEN) return { d: 0, cp: lon }
  const dai = []
  for (let k = 0; k < K; k++) if (e[k] >= Math.max(DUNG_YEN, lon * 0.3)) dai.push(k)
  // Hang "co noi dung" xet RIENG tren cac dai dang chuyen dong (thanh ben day chu khong duoc tinh ho cho cot cuon)
  const D = dai.length, co1 = new Uint8Array(h)
  for (let y = 0; y < h; y++) {
    let to = 0, nho = 255, s = 0
    for (let j = 0; j < D; j++) {
      const v = B.f[y * K + dai[j]]
      if (v > to) to = v
      if (v < nho) nho = v
      if (y + 1 < h) { const a = v - B.f[(y + 1) * K + dai[j]]; s += a < 0 ? -a : a }
    }
    co1[y] = to - nho > KHAC_DAI || s > Math.max(6, 2 * D) ? 1 : 0
  }
  const xa = h - Math.max(24, Math.round(h * 0.15)) // phai con chong nhau it nhat 15 % chieu cao
  // Luot 1: gom moi ung vien dat nguong + tim chi phi NHO NHAT.
  // ☠️ 06/10 ban dau gop "chon nho nhat" voi "uu tien troi it" trong mot vong (cho lech 15 %): khi co thanh co dinh
  //    (chi phi nen cao len deu) thi ung vien d - 1 lot vao khoang 15 % va thang -> anh dai lech 1 hang. Phai tach 2 luot.
  const ung = []
  let nho = Infinity
  for (let d = -xa; d <= xa; d++) {
    const c = chiPhi(A, B, h, d, nho, dai, co1)
    if (!c || c.cp > NGUONG || c.co < IT_NHAT_HANG) continue
    ung.push({ d, cp: c.cp })
    if (c.cp < nho) nho = c.cp
  }
  if (!ung.length) return khongBen === true ? null : timLechBen(A, B, h, dai, co1, xa, khongBen === 'khong-bo-dinh')
  // Luot 2: chi cac ung vien GAN BANG nho nhat (hoa tiet lap that su: lech <= 2 %) moi duoc xet "troi it hon"
  let tot = null
  for (const u of ung) {
    if (u.cp > nho * 1.02 + 0.01) continue
    if (!tot || Math.abs(u.d) < Math.abs(tot.d)) tot = u
  }
  return { d: tot.d, cp: tot.cp, doi: true }
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
  // ben = so khung phai dung duong "ben"; chuoi = 80 khung dau, moi khung 1 chu (d dung · T them · u lui · L lac, chu HOA
  // cuoi cung them dau ' = duong ben) -> run-log doc lai duoc phien hong o khung nao, khong phai doan
  const dem = { khung: 0, them: 0, dung: 0, lui: 0, lac: 0, ben: 0, chuoi: '' }
  const khongBen = (tuyChon && tuyChon.khongBen) || false // chi bai do dung: true = tat duong ben · 'khong-bo-dinh' = ben ban 13:02
  const ghi = (c, ben) => { if (dem.chuoi.length < 80) dem.chuoi += c + (ben ? "'" : '') }

  function them(bgra) {
    if (!bgra || bgra.length < w * h * 4) return { loai: 'lac', cao, lacLien }
    dem.khung++
    const B = dacTrung(bgra, w, h)
    if (!moc) {
      manh.push(Buffer.from(bgra.subarray(0, h * hang)))
      cao = h; y = 0; moc = B
      return { loai: 'dau', cao, lacLien: 0 }
    }
    const r = timLech(moc, B, h, khongBen)
    if (!r) { dem.lac++; lacLien++; ghi('L'); return { loai: 'lac', cao, lacLien } }
    lacLien = 0
    if (r.ben) dem.ben++
    if (r.d === 0) {
      dem.dung++; ghi('d', r.ben)
      /* Trang chua cuon ma noi dung DOI (video vua co hinh lai sau khi cua so chup dong, video dang chay): CHUA noi hang nao
         thi thay luon khung dau bang khung nay -> phan dau anh dai la hinh MOI NHAT truoc khi cuon, khong phai o video den. */
      if ((r.doi || r.ben) && manh.length === 1 && cao === h) { manh[0] = Buffer.from(bgra.subarray(0, h * hang)); moc = B }
      return { loai: 'dung', cao, lacLien }
    }
    y += r.d; moc = B
    let n = y + h - cao // so hang MOI nam duoi day anh dai
    if (n <= 0) { dem.lui++; ghi('u', r.ben); return { loai: 'lui', d: r.d, cao, lacLien } }
    let day = false
    if (cao + n > toiDaCao) { n = toiDaCao - cao; day = true }
    if (n > 0) {
      // Khung dang phu cac hang [y, y + h) cua anh dai; anh dai da co [0, cao) -> phan moi bat dau o hang (cao - y) cua khung
      const batDau = cao - y
      manh.push(Buffer.from(bgra.subarray(batDau * hang, (batDau + n) * hang)))
      cao += n
    }
    dem.them++; ghi('T', r.ben)
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
  /* 06/10 ECC soat: (1) da co anh roi ma nguon khung CHET (luong chup mat) thi vong lap cu chay du 3 phut moi dung, nguoi dung
     khong biet -> `toiDaHong` lan LIEN TIEP khong co khung dung duoc la dung, ly do 'mat-nguon', van tra phan da ghep;
     (2) khung DOI CO giua phien (doi do phan giai / ti le man) truoc day van dua vao bo ghep -> doc sai be rong, ra hang rac
     ma khong bao 'lac' -> nay bo qua khung khac co voi khung dau. */
  let bo = null, lyDo = 'dung', hong = 0, w0 = 0, h0 = 0
  const toiDaHong = o.toiDaHong || 50
  while (!o.coDung()) {
    if (Date.now() - t0 >= (o.toiDaMs || 180000)) { lyDo = 'het-gio'; break }
    let k = null
    try { k = await o.layKhung() } catch (e) { k = null }
    const dung = !!(k && k.buf && k.w > 0 && k.h > 0 && k.w * k.h * 4 <= k.buf.length && (!bo || (k.w === w0 && k.h === h0)))
    if (!dung) {
      hong++
      if (!bo && hong >= 20) { lyDo = 'khong-co-khung'; break } // 20 lan lien khong co khung nao tu dau: bo
      if (bo && hong >= toiDaHong) { lyDo = 'mat-nguon'; break }
      await nghi(o.nghiMs || 90); continue
    }
    hong = 0
    if (!bo) { bo = taoBoGhep(k.w, k.h, { toiDaCao: o.toiDaCao }); w0 = k.w; h0 = k.h }
    const r = bo.them(k.buf)
    if (o.baoTrangThai) { try { o.baoTrangThai(r) } catch (e) {} }
    if (r.loai === 'day') { lyDo = 'day'; break }
    await nghi(o.nghiMs || 90)
  }
  return { anh: bo && bo.cao > 0 ? bo.layAnh() : null, dem: bo ? bo.dem : null, lyDo, ms: Date.now() - t0 }
}

module.exports = { taoBoGhep, chayPhien, dacTrung, timLech }
