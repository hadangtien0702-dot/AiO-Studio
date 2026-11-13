'use strict'
/* =========================================================================
   Bai do HUT MAU DUNG TUNG DIEM ANH (12/11) — chay bang: npm run test:hutthat
   CHAY AN: khong bat cua so nao, khong cuop chuot, khong cham clipboard. Phan 2 co CHUP man hinh that bang
   desktopCapturer (im lang, khong hien gi) de thu src/hut-that.js tren nguon that; CHI so sanh trong bo nho, khong ghi
   anh man hinh ra dia.
   Vi sao co bai nay: 12/11 anh Tien bao "pick mau chua dung". Do: tren Windows anh raw cua luot chup la khung video I420
   cua luong chay san -> chi 14,9 % diem dung mau. Bai test:hutmau cu dat 108/108 vi dich vu gia cua no phuc vu anh
   NGUYEN VEN (brain 5h). Sua: main chup mot anh nguyen goc khi mo Hut mau (src/hut-that.js), trang chup ghep theo o 8x8
   (src/overlay/hut-ghep.js).
   PHAN 1 (Node thuan): ham ghep voi khung I420 GIA LAP (da doi chieu 14 mau do tren man that), co doi chung:
     khong ghep -> mau sai; vung da doi noi dung (video den, doi sac, khoi mau khac, con tro) -> phai bi tu choi;
     bo nguong sac -> vung doi sac lot (chung minh chinh nguong do chan).
   PHAN 2 (Electron an): src/hut-that.js voi desktopCapturer THAT: dau 8 byte, cat dung vung, kep mep, chup 1 lan cho ca
     luot, raw da la anh goc thi khong chup, khong ro nguon thi di duong an toan, nguon sai co / nem loi -> 404 + thu lai;
     dau cuoi: khung I420 gia lap tu chinh man hinh that + anh hut-that tra ve -> ghep -> dung tung diem.
   Cach chay: node scripts/test/do-hut-that.cjs   (tu goi Electron)
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const { quaI420, CAP_DA_DO } = require('./gia-lap-i420.cjs')
const G = require(path.join(ROOT, 'src', 'overlay', 'hut-ghep.js'))
const hex = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).toUpperCase().padStart(2, '0')).join('')
const cat = (A, W, x0, y0, cw, ch) => { const B = new A.constructor(cw * ch * 4); for (let y = 0; y < ch; y++) B.set(A.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x0 + cw) * 4), y * cw * 4); return B }

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  let dat = 0, tong = 0
  const kiem = (ten, ok, ct) => { tong++; if (ok) dat++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
  const anh = (w, h, ve) => { const L = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = ve(x, y), i = (y * w + x) * 4; L[i] = c[2]; L[i + 1] = c[1]; L[i + 2] = c[0]; L[i + 3] = 255 } return L }

  /* Day noi: route trong main.js nam trong ham khoi dong cua app nen bai nay KHONG goi duoc no. Cac muc duoi chi kiem CHU trong ma
     (yeu hon kiem hanh vi): chan viec xoa nham day noi, khong chung minh no chay. Luot chay that: doc run-log, phai co dong
     "hut-that: chup nguyen goc man ..." va "hut mau nguon=raw-png ... that N/M o". */
  console.log('== 0. Day noi main.js / trang chup (kiem CHU trong ma) ==')
  {
    const doc = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
    const mainJs = doc('src', 'main.js'), html = doc('src', 'overlay', 'index.html'), ovJs = doc('src', 'overlay', 'overlay.js')
    kiem('main.js: route aioshot://that goi hutThat.phucVu voi raw cua DUNG key', mainJs.includes('hutThat.phucVu(m[1], m[2], +m[3], +m[4], +m[5], +m[6], rawStore.get(m[1]))') && mainJs.includes('that\\/(\\d+\\/([^/]+))\\/'))
    const dongXoa = mainJs.split(/\r?\n/).filter((l) => l.includes('rawStore.clear()'))
    kiem('main.js: moi cho xoa rawStore deu xoa luon anh nguyen goc (hutThat.xoa)', dongXoa.length >= 2 && dongXoa.every((l) => l.includes('hutThat.xoa()')), dongXoa.length + ' cho')
    kiem('main.js: phatFrozen danh dau nguon raw (luong / grab) cho tung man', mainJs.includes("hutThat.danhDau(key, (nguon || nguonGrab) === 'luong' ? 'luong' : 'grab')"))
    kiem('index.html: CSP cho phep fetch aioshot: va nap hut-ghep.js TRUOC overlay.js', html.includes('connect-src aioshot:') && html.indexOf('hut-ghep.js') > 0 && html.indexOf('hut-ghep.js') < html.indexOf('"overlay.js"'))
    kiem('overlay.js: Hut mau xin anh nguyen goc va ghep, kinh hien dau gan dung', ovJs.includes("fetch('aioshot://that/'") && ovJs.includes('window.HutGhep.ghep(') && ovJs.includes("(c.gan ? '≈ ' : '')"))
  }

  console.log('\n== 1. Bo gia lap I420 co ra dung mau DA DO tren man that (12/11) khong ==')
  let trung = 0
  for (const [that, doDuoc] of CAP_DA_DO) {
    const c = [1, 3, 5].map((k) => parseInt(that.slice(k, k + 2), 16))
    const S = quaI420(anh(8, 8, () => c), 8, 8, false)
    if (hex(S[0], S[1], S[2]) === doDuoc) trung++; else console.log('     ' + that + ' gia lap ra ' + hex(S[0], S[1], S[2]) + ', man that ra ' + doDuoc)
  }
  kiem('gia lap trung ' + trung + '/' + CAP_DA_DO.length + ' cap mau do tren man that', trung === CAP_DA_DO.length)

  /* Anh thu kieu giao dien: khoi mau phang, chu mau manh 1 px, mau bao hoa, dai chuyen mau, soc 2 px. */
  const W = 640, H = 360
  const veGoc = (x, y) => {
    if (y < 60) return [33, 37, 43]
    if (y < 120) return x % 7 === 0 || (x + y) % 11 === 0 ? [248, 104, 32] : [40, 44, 52]
    if (y < 180) return [[230, 57, 70], [46, 196, 110], [30, 100, 230], [250, 200, 20], [140, 60, 180]][Math.floor(x / 128)]
    if (y < 240) return [Math.round(x * 255 / (W - 1)), 96, 255 - Math.round(x * 255 / (W - 1))]
    if (y < 300) return (x >> 1) % 2 ? [255, 0, 0] : [0, 0, 255]
    return [243, 243, 243]
  }
  const L0 = anh(W, H, veGoc)
  const demSai = (S, L) => { let k = 0; for (let i = 0; i < S.length; i += 4) if (S[i] !== L[i + 2] || S[i + 1] !== L[i + 1] || S[i + 2] !== L[i]) k++; return k }

  for (const noiSuy of [false, true]) {
    console.log('\n== 2. Noi dung giong nhau, sac ' + (noiSuy ? 'noi suy' : 'lap lai theo o') + ' ==')
    const S = quaI420(L0, W, H, noiSuy)
    const truoc = demSai(S, L0)
    kiem('DOI CHUNG khong ghep: hon 30 % diem sai mau', truoc / (W * H) > 0.3, (100 * truoc / (W * H)).toFixed(1) + ' % diem sai')
    const kq = G.ghep(S, L0, W, H, 0, 0)
    let saiTrongOKhop = 0, diemGan = 0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, dung = S[i] === L0[i + 2] && S[i + 1] === L0[i + 1] && S[i + 2] === L0[i]
      if (G.laThat(kq, x, y)) { if (!dung) saiTrongOKhop++ } else diemGan++
    }
    kiem('diem duoc danh dau "that": 0 diem sai mau', saiTrongOKhop === 0, saiTrongOKhop + ' diem sai')
    kiem('it nhat 90 % o duoc nhan (soc do / xanh 2 px duoc phep roi ve "gan dung")', kq.soKhop / kq.soO >= 0.9, kq.soKhop + '/' + kq.soO + ' o, ' + diemGan + ' diem gan dung')
    const iNen = (30 * W + 300) * 4
    kiem('nen #21252B doc ra dung #21252B', hex(S[iNen], S[iNen + 1], S[iNen + 2]) === '#21252B' && G.laThat(kq, 300, 30), hex(S[iNen], S[iNen + 1], S[iNen + 2]))
    const iChu = (90 * W + 140) * 4
    kiem('chu cam manh 1 px doc ra dung #F86820', hex(S[iChu], S[iChu + 1], S[iChu + 2]) === '#F86820' && G.laThat(kq, 140, 90), hex(S[iChu], S[iChu + 1], S[iChu + 2]))
  }

  console.log('\n== 3. Vung da DOI noi dung phai bi tu choi (giu diem cua luong, danh dau gan dung) ==')
  {
    const S = quaI420(L0, W, H, true), Sgoc = S.slice()
    const L = L0.slice()
    const to = (x0, y0, x1, y1, f) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4, c = f(x, y, [L[i + 2], L[i + 1], L[i]]); L[i] = c[2]; L[i + 1] = c[1]; L[i + 2] = c[0] } }
    to(64, 16, 128, 48, () => [0, 0, 0])                                 // (a) video bi den khi co cua so phu len
    to(200, 16, 264, 48, (x, y, c) => [c[0] + 9, c[1] - 6, c[2] + 14])   // (b) doi sac, do sang gan nhu giu nguyen (lech 199/256 < 1)
    to(320, 130, 384, 170, () => [46, 196, 110])                         // (c) khoi mau khac han
    to(400, 310, 411, 326, (x, y) => (x - 400 <= y - 310 ? [255, 255, 255] : [243, 243, 243])) // (d) con tro chuot trang nho
    const kq = G.ghep(S, L, W, H, 0, 0)
    // chiDoi = chi dem diem ma man hinh THAT SU da doi; o canh do khong chua diem doi nao thi lay anh moi la dung
    const vung = (x0, y0, x1, y1, chiDoi) => { let that = 0, n = 0, doi = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4; if (chiDoi && L[i] === L0[i] && L[i + 1] === L0[i + 1] && L[i + 2] === L0[i + 2]) continue; n++; if (G.laThat(kq, x, y)) that++; if (S[i] !== Sgoc[i] || S[i + 1] !== Sgoc[i + 1] || S[i + 2] !== Sgoc[i + 2]) doi++ } return { that, n, doi } }
    let v = vung(64, 16, 128, 48); kiem('(a) vung video den: 0 diem lay tu anh moi', v.that === 0 && v.doi === 0, v.that + '/' + v.n)
    v = vung(200, 16, 264, 48); kiem('(b) vung doi sac giu do sang: 0 diem lay tu anh moi', v.that === 0 && v.doi === 0, v.that + '/' + v.n)
    v = vung(320, 130, 384, 170); kiem('(c) khoi mau khac: 0 diem lay tu anh moi', v.that === 0 && v.doi === 0, v.that + '/' + v.n)
    v = vung(400, 310, 411, 326, true); kiem('(d) con tro chuot: 0 diem cua con tro bi thay bang anh moi', v.n > 50 && v.that === 0 && v.doi === 0, v.that + '/' + v.n)
    v = vung(0, 0, 56, 56); kiem('vung khong doi canh do van duoc lay dung', v.that === v.n, v.that + '/' + v.n)
    const S2 = Sgoc.slice(), kq2 = G.ghep(S2, L, W, H, 0, 0, { tc: 255 })
    let lot = 0; for (let y = 16; y < 48; y++) for (let x = 200; x < 264; x++) if (G.laThat(kq2, x, y)) lot++
    kiem('DOI CHUNG bo nguong sac: vung (b) lot vao (bai do bat duoc)', lot > 0, lot + ' diem lot')
  }

  console.log('\n== 4. Vung chon bat dau o toa do le cua khung (luoi o van thang luoi cua khung) ==')
  for (const [ox, oy, cw, ch] of [[1, 1, 301, 201], [13, 7, 97, 55], [5, 122, 300, 100]]) {
    const S = cat(quaI420(L0, W, H, true), W, ox, oy, cw, ch), L = cat(L0, W, ox, oy, cw, ch)
    const kq = G.ghep(S, L, cw, ch, ox, oy)
    let sai = 0, that = 0
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { if (!G.laThat(kq, x, y)) continue; that++; const i = (y * cw + x) * 4; if (S[i] !== L[i + 2] || S[i + 1] !== L[i + 1] || S[i + 2] !== L[i]) sai++ }
    kiem('goc ' + ox + ',' + oy + ' co ' + cw + 'x' + ch + ': diem "that" dung tung diem, it nhat 70 % diem la that', sai === 0 && that / (cw * ch) >= 0.7, that + '/' + (cw * ch) + ' that, ' + sai + ' sai')
    kiem('goc ' + ox + ',' + oy + ': ngoai vung / khong co ket qua ghep = khong phai diem that', !G.laThat(kq, -1, 0) && !G.laThat(kq, cw, 0) && !G.laThat(kq, 0, ch) && !G.laThat(null, 0, 0))
  }

  /* PHAN 2: Electron an */
  console.log('\n== 5. src/hut-that.js voi man hinh THAT (Electron an, khong hien cua so) ==')
  const { spawnSync } = require('child_process')
  let electron
  try { electron = require('electron') } catch (e) {
    electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron') : 'electron')
  }
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'hut-that')
  fs.mkdirSync(RA, { recursive: true })
  const r = spawnSync(electron, [__filename, RA], { env, encoding: 'utf8', timeout: 120000 })
  const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
  if (!dong) kiem('phan Electron chay duoc', false, ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 3).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')')
  else for (const c of JSON.parse(dong.slice(3)).kq) kiem(c.ten, c.ok, c.ct)

  console.log('\nTONG: ' + dat + '/' + tong + ' DAT')
  process.exit(dat === tong ? 0 : 1)
}

/* ───────────── PHAN ELECTRON ───────────── */
const { app, desktopCapturer, screen, nativeImage } = require('electron')
const RA = path.resolve(process.argv[2])
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData'))
app.on('window-all-closed', () => {})
process.stdout.on('error', () => {}) // dau ra bi dong (EPIPE) khong duoc bat hop thoai loi Electron len man
process.stderr.on('error', () => {})
const chet = (e) => { try { console.log('LOI=' + (e && e.stack || e)) } catch (x) {} app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 90 giay'), 90000)

app.whenReady().then(async () => {
  const kq = []
  const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
  const xong = () => { console.log('KQ=' + JSON.stringify({ kq })); app.exit(0) }
  const hutThat = require(path.join(ROOT, 'src', 'hut-that.js'))
  const d = screen.getPrimaryDisplay(), sf = d.scaleFactor || 1, W = Math.round(d.size.width * sf), H = Math.round(d.size.height * sf), id = String(d.id)
  const chuan = async () => {
    const s = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: W, height: H }, fetchWindowIcons: false })
    const x = s.find((q) => String(q.display_id) === id) || s[0]
    if (!x || x.thumbnail.isEmpty()) return null
    const sz = x.thumbnail.getSize()
    return sz.width === W && sz.height === H ? x.thumbnail.toBitmap() : null
  }
  const C1 = await chuan().catch(() => null)
  kiem('Tien de: chup duoc man hinh that co native ' + W + 'x' + H, !!C1)
  if (!C1) return xong()
  const raw = nativeImage.createFromBitmap(C1, { width: W, height: H })
  const nhatKy = []
  const T = hutThat.tao({ desktopCapturer, screen, ghiLog: (s) => nhatKy.push(s) })
  const key = '7/' + id
  T.danhDau(key, 'luong')
  const VX = Math.min(101, W - 9), VY = Math.min(57, H - 9), VW = Math.min(960, W - VX), VH = Math.min(540, H - VY)
  const r1 = await T.phucVu(key, id, VX, VY, VW, VH, raw)
  const C2 = await chuan().catch(() => null)
  kiem('Raw cua luong: tra 200, 8 byte dau = rong / cao, du so diem anh', r1.status === 200 && r1.body.readUInt32LE(0) === VW && r1.body.readUInt32LE(4) === VH && r1.body.length === 8 + VW * VH * 4, r1.status + ' ' + (r1.body ? r1.body.length : 0))
  kiem('Co dong nhat ky "chup nguyen goc", chup dung 1 lan', T.soLanChup() === 1 && nhatKy.some((l) => /chup nguyen goc man/.test(l)), nhatKy.join(' | ').slice(0, 160))
  // So voi chuan o nhung diem man hinh DUNG YEN suot bai (C1 = C2)
  if (r1.status === 200 && C2) {
    const L = r1.body.subarray(8), c1 = cat(C1, W, VX, VY, VW, VH), c2 = cat(C2, W, VX, VY, VW, VH)
    let tinh = 0, dung = 0
    for (let i = 0; i < L.length; i += 4) {
      if (c1[i] !== c2[i] || c1[i + 1] !== c2[i + 1] || c1[i + 2] !== c2[i + 2]) continue
      tinh++
      if (L[i] === c1[i] && L[i + 1] === c1[i + 1] && L[i + 2] === c1[i + 2]) dung++
    }
    kiem('Cat dung vung: diem dung yen cua man hinh giong het anh chuan (>= 99,5 %)', tinh > 1000 && dung / tinh >= 0.995, dung + '/' + tinh + ' diem dung yen')
    // DAU CUOI: khung I420 gia lap tu man hinh that + anh hut-that -> ghep
    const S = quaI420(c1, VW, VH, true)
    let truoc = 0; for (let i = 0; i < S.length; i += 4) if (S[i] === c1[i + 2] && S[i + 1] === c1[i + 1] && S[i + 2] === c1[i]) truoc++
    const kg = G.ghep(S, L, VW, VH, VX, VY)
    let that = 0, thatTinh = 0, thatDung = 0, sau = 0
    for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
      const i = (y * VW + x) * 4, ok = S[i] === c1[i + 2] && S[i + 1] === c1[i + 1] && S[i + 2] === c1[i]
      if (ok) sau++
      if (!G.laThat(kg, x, y)) continue
      that++
      if (c1[i] === c2[i] && c1[i + 1] === c2[i + 1] && c1[i + 2] === c2[i + 2]) { thatTinh++; if (ok) thatDung++ }
    }
    const n = VW * VH, pt = (v, t) => (100 * v / Math.max(1, t)).toFixed(1) + ' %'
    kiem('Dau cuoi tren man that: diem danh dau "that" o cho man dung yen dung tung diem (>= 99,5 %)', thatTinh > 1000 && thatDung / thatTinh >= 0.995, thatDung + '/' + thatTinh)
    kiem('Dau cuoi tren man that: sau khi ghep it nhat 85 % diem dung mau, va khong it hon truoc khi ghep', sau / n >= 0.85 && sau >= truoc, 'truoc ' + pt(truoc, n) + ', sau ' + pt(sau, n) + ', danh dau that ' + pt(that, n))
  } else kiem('Cat dung vung + dau cuoi', false, 'khong co anh de so')

  const r2 = await T.phucVu(key, id, 0, 0, 64, 64, raw)
  kiem('Doi vung chon: KHONG chup lai (dung anh da chup cua luot nay)', r2.status === 200 && r2.body.readUInt32LE(0) === 64 && T.soLanChup() === 1, 'so lan chup ' + T.soLanChup())
  const r3 = await T.phucVu(key, id, W - 10, H - 6, 100, 100, raw)
  kiem('Vung tran mep man: kep lai con 10 x 6', r3.status === 200 && r3.body.readUInt32LE(0) === 10 && r3.body.readUInt32LE(4) === 6 && r3.body.length === 8 + 10 * 6 * 4, r3.body ? r3.body.readUInt32LE(0) + 'x' + r3.body.readUInt32LE(4) : r3.status)
  T.danhDau('7/goc', 'grab')
  const r4 = await T.phucVu('7/goc', id, 0, 0, 10, 10, raw)
  kiem('Raw von la anh getSources (Mac, luong chua san sang): tra 8 byte so 0, KHONG chup them', r4.status === 200 && r4.body.length === 8 && r4.body.every((b) => b === 0) && T.soLanChup() === 1, 'so lan chup ' + T.soLanChup())
  const r5 = await T.phucVu(key, id, 0, 0, 10, 10, undefined)
  kiem('Khong con raw (luot chup da dong): 404', r5.status === 404)
  const r6 = await T.phucVu('9/' + id, id, 0, 0, 16, 16, raw)
  kiem('Khong ro nguon cua raw: di duong chup + ghep (chieu an toan), khong tra "da dung san"', r6.status === 200 && r6.body.length === 8 + 16 * 16 * 4 && T.soLanChup() === 2, r6.body ? r6.body.length : r6.status)
  T.xoa(); T.danhDau(key, 'luong')
  const r7 = await T.phucVu(key, id, 0, 0, 16, 16, raw)
  kiem('Luot chup moi (xoa): chup lai', r7.status === 200 && T.soLanChup() === 3, 'so lan chup ' + T.soLanChup())

  // Nguon gia: sai kich thuoc -> 404, lan sau thu lai
  const anhNho = nativeImage.createFromBitmap(Buffer.alloc(8 * 8 * 4, 200), { width: 8, height: 8 })
  const T2 = hutThat.tao({ desktopCapturer: { getSources: async () => [{ display_id: id, thumbnail: anhNho }] }, screen, ghiLog: (s) => nhatKy.push(s) })
  T2.danhDau('1/a', 'luong')
  const a1 = await T2.phucVu('1/a', id, 0, 0, 4, 4, raw), a2 = await T2.phucVu('1/a', id, 0, 0, 4, 4, raw)
  kiem('Anh chup sai kich thuoc so voi raw: 404 (khong ghep lech), lan xin sau thu lai', a1.status === 404 && a2.status === 404 && T2.soLanChup() === 2, a1.status + ' ' + a2.status + ', so lan chup ' + T2.soLanChup())
  // Nguon nem loi -> 404, khong vang
  const T3 = hutThat.tao({ desktopCapturer: { getSources: async () => { throw new Error('ep loi') } }, screen, ghiLog: (s) => nhatKy.push(s) })
  T3.danhDau('1/b', 'luong')
  let b1 = null, vang = null
  try { b1 = await T3.phucVu('1/b', id, 0, 0, 4, 4, raw) } catch (e) { vang = e }
  kiem('getSources nem loi: 404 + co dong nhat ky, khong vang', !vang && b1 && b1.status === 404 && nhatKy.some((l) => /hut-that LOI chup: ep loi/.test(l)))

  /* LUONG THAT cua app (src/luong-chup.js, cua so AN, dung cach app lay khung luc bam phim) -> hut-that -> ghep, so voi getSources.
     Day la ca duong du lieu that, chi thieu 5 dong day noi trong main.js (muc 0). Ti le "truoc" tuy noi dung man hinh (man toan
     xam thi khung video van dung), nen chi IN ra; dieu bat buoc: diem danh dau "that" phai dung, va sau khong kem truoc. */
  const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
  const luong = require(path.join(ROOT, 'src', 'luong-chup.js'))
  if (!luong.CHAY_SAN) kiem('Luong that cua app: may nay khong chay san luong (Mac), raw von la getSources -> bo qua', true)
  else {
    await luong.khoiDong({ ghiLog: (s) => nhatKy.push(s) })
    for (let i = 0; i < 100 && !luong.sanSang(); i++) await ngu(100)
    kiem('Luong that cua app: san sang trong 10 giay', luong.sanSang(), nhatKy.filter((l) => /LUONG/.test(l)).slice(-2).join(' | '))
    if (luong.sanSang()) {
      await ngu(800)
      const Ca = await chuan().catch(() => null)
      const list = await luong.layKhung(null, () => {})
      const it = list.find((q) => String(q.display.id) === id)
      const szL = it && it.image ? it.image.getSize() : null
      kiem('Luong that cua app: co khung raw co native cua man chinh', !!szL && szL.width === W && szL.height === H, szL ? szL.width + 'x' + szL.height : 'khong co khung')
      if (Ca && szL && szL.width === W && szL.height === H) {
        const T4 = hutThat.tao({ desktopCapturer, screen, ghiLog: (s) => nhatKy.push(s) })
        T4.danhDau('3/' + id, 'luong')
        const rr = await T4.phucVu('3/' + id, id, VX, VY, VW, VH, it.image)
        await ngu(400)
        const Cb = await chuan().catch(() => null)
        if (rr.status === 200 && Cb) {
          const sb = it.image.crop({ x: VX, y: VY, width: VW, height: VH }).toBitmap() // BGRA cua luong
          const S = new Uint8ClampedArray(sb.length)
          for (let i = 0; i < sb.length; i += 4) { S[i] = sb[i + 2]; S[i + 1] = sb[i + 1]; S[i + 2] = sb[i]; S[i + 3] = 255 }
          const ca = cat(Ca, W, VX, VY, VW, VH), cb = cat(Cb, W, VX, VY, VW, VH)
          const tinh = (i) => ca[i] === cb[i] && ca[i + 1] === cb[i + 1] && ca[i + 2] === cb[i + 2]
          const dungTai = (i) => S[i] === ca[i + 2] && S[i + 1] === ca[i + 1] && S[i + 2] === ca[i]
          let nTinh = 0, truoc = 0
          for (let i = 0; i < S.length; i += 4) if (tinh(i)) { nTinh++; if (dungTai(i)) truoc++ }
          const kg = G.ghep(S, rr.body.subarray(8), VW, VH, VX, VY)
          let sau = 0, that = 0, thatDung = 0
          for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
            const i = (y * VW + x) * 4
            if (!tinh(i)) continue
            const ok = dungTai(i)
            if (ok) sau++
            if (G.laThat(kg, x, y)) { that++; if (ok) thatDung++ }
          }
          const pt = (v, t) => (100 * v / Math.max(1, t)).toFixed(1) + ' %'
          kiem('Luong that cua app: diem danh dau "that" o cho man dung yen dung tung diem (>= 99,5 %)', that > 1000 && thatDung / that >= 0.995, thatDung + '/' + that)
          kiem('Luong that cua app: sau khi ghep it nhat 85 % diem dung yen dung mau, khong kem truoc khi ghep', sau / Math.max(1, nTinh) >= 0.85 && sau >= truoc, 'truoc ' + pt(truoc, nTinh) + ' -> sau ' + pt(sau, nTinh) + ' (' + nTinh + ' diem dung yen, ' + kg.soKhop + '/' + kg.soO + ' o)')
        } else kiem('Luong that cua app: lay duoc anh nguyen goc de ghep', false, 'status ' + rr.status)
      }
    }
  }
  xong()
})
