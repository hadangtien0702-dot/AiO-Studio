'use strict'
/* Do CANVAS "dung duoc hang ngay" (ROADMAP 0g nhom A) tren APP THAT, cua so AN — chay: npm run test:canvashangngay [so anh, mac dinh 200]
   Tao N anh PNG 2560x1440 trong thu muc tam (os.tmpdir()/aio-canvashn-*), mo `electron . --thu-canvas` voi userData rieng, kich ban
   scripts/test/kich-ban-canvas-hang-ngay.cjs thao tac bang sendInputEvent (chuot / phim / lan). Hai pha tren CUNG userData:
   pha 1 mo lan dau (anh nho CHUA co) + thao tac, pha 2 mo lai (anh nho da co). Dem anh goc TRUOC = SAU (ten, dung luong, ma file).
   DOI CHUNG: (1) muc [3] tu lam hong 1 anh goc roi so lai, phep dem PHAI bat duoc; (2) chay bai tren ma TRUOC khi sua thi A5 / A6 / A1 phai truot.
   KHONG do: chuot that tren man that, keo that ra app khac (chi do main nhan dung file), Windows/Mac khac may nay. Cua so khong hien. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})   // dau ra bi dong (EPIPE) thi im lang, khong hien hop loi
process.on('uncaughtException', (e) => { try { console.error(e) } catch (e2) {} process.exit(1) })
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { spawnSync } = require('child_process')
const ROOT = path.resolve(__dirname, '..', '..')
const N = Math.max(8, Number(process.argv[2]) || 200)
const W = 2560, H = 1440
const SO_CU_MS = 13300   // ROADMAP 0g: 200 anh mo xong het sau 13,3 s

let truot = 0
const kiem = (ten, ok, ct) => { if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct != null && ct !== '' ? ' (' + ct + ')' : '')) }
const crcBang = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcBang[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function png(hat) {
  const raw = Buffer.alloc(H * (1 + W * 3))
  const cs = [[20, 24, 40], [245, 245, 247], [248, 104, 32], [45, 212, 191], [167, 139, 250], [255, 214, 90]]
  const c0 = cs[hat % cs.length], c1 = cs[(hat + 2) % cs.length]
  for (let y = 0; y < H; y++) {
    const d = y * (1 + W * 3) + 1, ty = y / H
    for (let x = 0; x < W; x++) {
      const tx = x / W, q = d + x * 3
      let r = c0[0] * (1 - tx) + c1[0] * tx * ty, g = c0[1] * (1 - ty) + c1[1] * tx, b = c0[2] * (1 - tx * ty) + c1[2] * ty
      const trongCuaSo = x > 300 + hat * 40 && x < 1700 + hat * 40 && y > 180 && y < 1150
      if (trongCuaSo) { r = 250; g = 249; b = 246; if (y < 230) { r = 230; g = 228; b = 224 } else if (((y - 260) % 46) < 14 && x < 500 + ((y * 37 + hat * 91) % 900) + hat * 40 && x > 360 + hat * 40) { r = 60; g = 56; b = 52 } }
      raw[q] = r; raw[q + 1] = g; raw[q + 2] = b
    }
  }
  const khoi = (ten, d) => { const dai = Buffer.alloc(4); dai.writeUInt32BE(d.length); const th = Buffer.concat([Buffer.from(ten), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(th)); return Buffer.concat([dai, th, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi('IHDR', ihdr), khoi('IDAT', zlib.deflateSync(raw, { level: 1 })), khoi('IEND', Buffer.alloc(0))])
}

const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-canvashn-'))
const goc = path.join(TAM, 'anh'), ra = path.join(TAM, 'ra')
fs.mkdirSync(goc); fs.mkdirSync(ra)
const mau = [0, 1, 2, 3, 4, 5].map(png)
for (let i = 0; i < N; i++) {
  const f = path.join(goc, 'AiO-2026-10-12-09' + String(i).padStart(4, '0') + '.png')
  fs.writeFileSync(f, Buffer.concat([mau[i % mau.length], Buffer.from([i & 255])]))   // 1 byte duoi PNG de moi file mot noi dung rieng
  const t = new Date(Date.now() - (N - i) * 60000); fs.utimesSync(f, t, t)
}
const chupGoc = () => {
  const o = {}
  for (const t of fs.readdirSync(goc)) { const p = path.join(goc, t); const st = fs.statSync(p, { bigint: true }); if (st.isFile()) o[t] = [String(st.ino), String(st.size), String(st.mtimeMs), require('crypto').createHash('md5').update(fs.readFileSync(p)).digest('hex')].join('|') }
  return o
}
const GOC0 = chupGoc()
console.log('Tao ' + N + ' anh ' + W + 'x' + H + ' trong ' + TAM)
const env0 = Object.assign({}, process.env); delete env0.ELECTRON_RUN_AS_NODE

function chay(pha) {
  const env = Object.assign({}, env0, { AIO_THU_KICHBAN: path.join(__dirname, 'kich-ban-canvas-hang-ngay.cjs'), AIO_THU_PHA: String(pha), AIO_THU_HAN: '280000', AIO_THU_CHO: '100' })
  const t0 = Date.now()
  const r = spawnSync(require('electron'), [ROOT, '--thu-canvas', goc, ra], { env, encoding: 'utf8', timeout: 300000 })
  let kq = null
  try { kq = JSON.parse(fs.readFileSync(path.join(ra, 'ket-qua.json'), 'utf8')) } catch (e) {}
  console.log('  (pha ' + pha + ' chay ' + Math.round((Date.now() - t0) / 1000) + ' s, ma thoat ' + r.status + ')')
  if (!kq) console.log('  stderr: ' + String(r.stderr || r.error || '').slice(-400))
  return kq
}
const so = (v) => JSON.stringify(v)

console.log('\n[1] Pha 1: mo lan dau (anh nho chua co) + thao tac that')
fs.rmSync(path.join(ra, 'ket-qua.json'), { force: true })
const k1 = chay(1)
kiem('App chay xong va tra ket qua, trang khong bao loi', !!k1 && !k1.loi && !(k1.loiTrang || []).length, k1 ? (k1.loi || (k1.loiTrang || [])[0] || 'ban ' + k1.ban) : 'khong co ket qua')
if (k1) {
  console.log('  SO DO mo lan dau: tam dau ' + k1.mo.tamDau + ' ms · man hinh nhin thay du anh sau ' + k1.mo.viewportDu + ' ms (so cu ROADMAP: du het ' + SO_CU_MS + ' ms) · phong ' + k1.moMan.s + ' · tam moi nhat rong ' + k1.moMan.w + ' px')
  console.log('  SO DO anh nho tao san: ' + k1.nho.sau + '/' + k1.nho.tong + ' sau ' + k1.nho.ms + ' ms (luc vua mo xong: ' + k1.moNhoLucDo + ') · bam Vua man hinh -> du ' + k1.vuaDay.tong + ' anh sau ' + k1.vuaDay.ms + ' ms')

  console.log('\n  --- A5: mo ra dung o tam moi nhat, co doc duoc ---')
  kiem('Luc mo, tam moi nhat nam TRON trong man hinh', k1.moMan.trongMan, so(k1.moMan))
  kiem('Luc mo, tam moi nhat rong >= 150 px tren man hinh (doc duoc)', k1.moMan.w >= 150, k1.moMan.w + ' px, phong ' + k1.moMan.s)
  kiem('Mo xong, man hinh nhin thay du anh trong ' + (SO_CU_MS / 1000) + ' s chia 4 (< ' + Math.round(SO_CU_MS / 4) + ' ms)', k1.mo.viewportDu != null && k1.mo.viewportDu < SO_CU_MS / 4, k1.mo.viewportDu + ' ms')
  kiem('Nut "Moi nhat" (bam that) dua tam moi nhat vao man, rong >= 150 px', k1.nutMoiNhat.trongMan && k1.nutMoiNhat.w >= 150, so(k1.nutMoiNhat))
  kiem('Moi nhat = tam co ten cuoi cung (so ' + (N - 1) + ')', String(k1.nutMoiNhat.khoa).includes(String(N - 1).padStart(4, '0')), k1.nutMoiNhat.khoa)

  console.log('\n  --- A6: anh nho tao san ---')
  kiem('Anh nho cua CA ' + N + ' tam da co tren dia (khong doi trang xin het)', k1.nho.sau >= N, k1.nho.sau + '/' + N)
  kiem('Anh nho duoc tao SAN, khong chi theo trang xin: luc mo xong tren dia co nhieu anh nho hon so anh trang da xin', k1.moNhoLucDo > k1.mo.luc.xongTong, 'tren dia ' + k1.moNhoLucDo + ' > trang xin ' + k1.mo.luc.xongTong)
  kiem('Sau do bam "Vua man hinh": du ' + N + ' anh trong < 3000 ms (so cu ' + SO_CU_MS + ')', k1.vuaDay.ms >= 0 && k1.vuaDay.ms < 3000, k1.vuaDay.ms + ' ms')

  console.log('\n  --- A1: phim tat + lenh mo Canvas ---')
  const p = k1.phim
  kiem('Co phim tat mo Canvas dang ky duoc (mac dinh)', !!p && p.macDinhDangKy === true, p ? p.accel : 'khong co ham do phim')
  kiem('Sau khi doi phim chup (unregisterAll), phim Canvas duoc dang ky lai', !!p && p.sauDoiPhimChup === true)
  kiem('Cau hinh phimCanvas = "" thi TAT phim Canvas (khong dang ky)', !!p && p.tat === false)
  kiem('Lenh "--mo-canvas" cua ban chay lan 2 -> mo Canvas; khong co lenh -> chup nhu cu', !!p && p.lenhCanvas === 'canvas' && p.lenhThuong === 'chup', p ? so([p.lenhCanvas, p.lenhThuong]) : '')
  kiem('Menu khay co ghi phim tat canh dong "Mo Canvas"', !!p && p.nhanMenuCoPhim === true, p ? p.nhanMenu : '')

  if (process.env.AIO_DBG) console.log('  dbg ' + JSON.stringify(k1.dbg) + ' bay ' + JSON.stringify(k1.dbgZ))
  console.log('\n  --- A3: chon nhieu, Delete, Ctrl/Cmd+Z ---')
  kiem('Bam 1 tam + Shift bam tam thu hai -> dang chon 2 tam', !!k1.chonHai && k1.chonHai.length === 2, so(k1.chonHai))
  kiem('Khung moi luc dau trong (0 file)', k1.khungATrongBanDau === 0, k1.khungATrongBanDau)
  kiem('Keo 2 tam dang chon cung luc vao khung -> ca hai co ban noi trong thu muc khung', !!k1.sauKeo && k1.sauKeo.thuMuc && k1.sauKeo.thuMuc.length === 2 && k1.sauKeo.t1 === k1.khungA.id && k1.sauKeo.t2 === k1.khungA.id, so(k1.sauKeo))
  kiem('Ban noi la CUNG file voi anh goc (cung ma file, khong chep them)', !!k1.sauKeo && (k1.sauKeo.banNoi || []).every(Boolean), so(k1.sauKeo && k1.sauKeo.banNoi))
  kiem('Delete 2 tam dang chon -> ca hai ra khoi khung, thu muc khung het file', !!k1.sauDelete && !k1.sauDelete.t1 && !k1.sauDelete.t2 && k1.sauDelete.thuMuc.length === 0, so(k1.sauDelete))
  kiem('... va ANH GOC cua hai tam con nguyen (cung ma file)', !!k1.sauDelete && k1.sauDelete.goc.every(Boolean))
  kiem('Ctrl/Cmd+Z -> hai tam ve lai khung, thu muc co lai 2 file', !!k1.sauHoanTac && k1.sauHoanTac.t1 === k1.khungA.id && k1.sauHoanTac.t2 === k1.khungA.id && k1.sauHoanTac.thuMuc.length === 2, so(k1.sauHoanTac))
  kiem('Delete tren tam KHONG thuoc khung: khong xoa gi (file goc + tam van con) va co thong bao', !!k1.deleteTamRoi && k1.deleteTamRoi.conFile && k1.deleteTamRoi.conTrenBang && !!k1.deleteTamRoi.bao, so(k1.deleteTamRoi))
  kiem('Ctrl/Cmd+A chon het ' + N + ' tam', !!k1.chonHet && k1.chonHet.sel >= k1.chonHet.mucs && k1.chonHet.mucs >= N, so(k1.chonHet))

  console.log('\n  --- A2: keo tam RA app khac ---')
  const kr = k1.keoRaHai || []
  kiem('Dang chon 2 tam, keo 1 tam ra -> main nhan DUNG 2 file that, noi dung giong anh goc', kr.length === 1 && kr[0].length === 2 && kr[0].every((f) => f.tonTai && f.giongGoc !== false), so(kr))
  kiem('Keo mot tam chua chon -> chi 1 file', (k1.keoRaMot || []).length === 1 && k1.keoRaMot[0].length === 1, so(k1.keoRaMot))

  console.log('\n  --- A4: xoa khung ---')
  kiem('Bam vao tai khung chon khung', !!k1.chonKhung && k1.chonKhung.length === 1 && k1.chonKhung[0] === 'f:' + k1.khungA.id, so(k1.chonKhung))
  kiem('Delete lan 1: chi nhac, khung + thu muc con nguyen', !!k1.xoaKhungLan1 && k1.xoaKhungLan1.conKhung && k1.xoaKhungLan1.conThuMuc && !!k1.xoaKhungLan1.bao, so(k1.xoaKhungLan1))
  kiem('Delete lan 2: thu muc chi con ban noi -> khung + thu muc bi xoa, 2 tam ve ngoai khung', !!k1.xoaKhungLan2 && !k1.xoaKhungLan2.conKhung && !k1.xoaKhungLan2.conThuMuc && !k1.xoaKhungLan2.t1 && !k1.xoaKhungLan2.t2, so(k1.xoaKhungLan2))
  kiem('... ANH GOC cua 2 tam con nguyen (cung ma file, cung dung luong)', (k1.sauXoaKhungGoc || []).length === 2 && k1.sauXoaKhungGoc.every(Boolean))
  kiem('Khung co FILE RIENG cua nguoi dung: Delete hai lan van KHONG xoa (khung, thu muc, file rieng con, co thong bao)', !!k1.xoaKhungCoFileRieng && k1.xoaKhungCoFileRieng.conKhung && k1.xoaKhungCoFileRieng.conThuMuc && k1.xoaKhungCoFileRieng.conFile && k1.xoaKhungCoFileRieng.noiDung === 'file rieng cua nguoi dung' && !!k1.xoaKhungCoFileRieng.bao, so(k1.xoaKhungCoFileRieng))
}

console.log('\n[2] Pha 2: mo lai app (anh nho da co san tren dia)')
fs.rmSync(path.join(ra, 'ket-qua.json'), { force: true })
const nhoTruoc2 = (() => { try { return fs.readdirSync(path.join(ra, 'userData', 'canvas', 'anh-nho')).length } catch (e) { return 0 } })()
const k2 = chay(2)
kiem('App mo lai va tra ket qua, trang khong bao loi', !!k2 && !k2.loi && !(k2.loiTrang || []).length, k2 ? (k2.loi || (k2.loiTrang || [])[0] || '') : 'khong co ket qua')
if (k2) {
  console.log('  SO DO mo lai: tam dau ' + k2.mo.tamDau + ' ms · man hinh du anh sau ' + k2.mo.viewportDu + ' ms · bam Vua man hinh -> du ' + k2.vuaDay.tong + ' anh sau ' + k2.vuaDay.ms + ' ms')
  kiem('Mo lai: man hinh nhin thay du anh < 1500 ms', k2.mo.viewportDu != null && k2.mo.viewportDu < 1500, k2.mo.viewportDu + ' ms')
  kiem('Mo lai: tam moi nhat tron trong man, rong >= 150 px', k2.moMan.trongMan && k2.moMan.w >= 150, so(k2.moMan))
  kiem('Mo lai + Vua man hinh: du ' + N + ' anh < 3000 ms (so cu ' + SO_CU_MS + ')', k2.vuaDay.ms >= 0 && k2.vuaDay.ms < 3000, k2.vuaDay.ms + ' ms')
}

console.log('\n[3] An toan sau ca hai pha')
const GOC1 = chupGoc()
const mat = Object.keys(GOC0).filter((t) => GOC1[t] !== GOC0[t])
const them = Object.keys(GOC1).filter((t) => !(t in GOC0))
kiem('Dem anh goc: ' + Object.keys(GOC0).length + ' truoc = ' + Object.keys(GOC1).length + ' sau, ten + ma file + dung luong + md5 y nguyen', mat.length === 0 && them.length === 0, mat.length ? 'LECH: ' + mat.slice(0, 3).join(',') : them.length ? 'THUA: ' + them.slice(0, 3).join(',') : '')
{ // doi chung: lam hong dung 1 anh goc -> phep dem phai chi ra dung anh do
  const t0 = Object.keys(GOC0)[3]
  fs.appendFileSync(path.join(goc, t0), 'x')
  const sau = chupGoc(), lech = Object.keys(GOC0).filter((t) => sau[t] !== GOC0[t])
  kiem('DOI CHUNG: lam hong 1 anh goc thi phep dem anh goc PHAI bat duoc dung anh do', lech.length === 1 && lech[0] === t0, lech.join(','))
}
fs.rmSync(TAM, { recursive: true, force: true })
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
