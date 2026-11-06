'use strict'
/* Do CANVAS dot 2 (06/11) — chay: npm run test:canvasdot2
   Phan 1 (khong can Electron): 5 loi cua src/canvas-kho.js tu ban soat Codex (loi 1, 2, 3, 4, 6), moi loi chay HAI LAN: tren ma MOI
   (phai DAT) va tren ma CU o commit ab2a311 (phai TRUOT dung cac muc "doi chung" — khong truot nghia la bai do khong do gi).
   Phan 2 (Electron an): kich ban scripts/test/kich-ban-canvas-dot2.cjs (loi 3 / 4 / 5 / 7 tren trang that + man trong + nhan nut chup).
   Moi file nam trong thu muc tam (os.tmpdir()/aio-canvasdot2-*) do bai nay tao va tu xoa dung thu muc do. KHONG dung toi thu muc anh that.
   KHONG do: chuot that tren man that, Windows that (bai nay chay o dau thi o do), o dia khong ho tro hard link (gia lap bang linkSync nem loi). */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.log('  TRUOT ngoai le: ' + (e && e.message)) } catch (x) {} process.exit(1) })
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { execFileSync, spawnSync } = require('child_process')
const ROOT = path.resolve(__dirname, '..', '..')
const COMMIT_CU = 'ab2a311'

let truot = 0
const kiem = (ten, ok, ct) => { if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-canvasdot2-'))
const viet = (p, s) => fs.writeFileSync(p, s)
const doc = (p) => { try { return fs.readFileSync(p, 'utf8') } catch (e) { return null } }
const co = (p) => fs.existsSync(p)
const sau = (p, ms) => { const g = new Date(Date.now() + ms); fs.utimesSync(p, g, g) }

function napMaCu() {
  const dir = path.join(TAM, 'ma-cu'); fs.mkdirSync(dir, { recursive: true })
  let ma = null
  try { ma = execFileSync('git', ['show', COMMIT_CU + ':./src/canvas-kho.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }) } catch (e) { return null }
  fs.writeFileSync(path.join(dir, 'canvas-kho.js'), ma)
  fs.copyFileSync(path.join(ROOT, 'src', 'ghi-ben.js'), path.join(dir, 'ghi-ben.js'))
  return require(path.join(dir, 'canvas-kho.js'))
}

/** Moi kich ban mot thu muc rieng. Tra mang { ten, ok, ct, doiChung }. */
function chayKho(K, nhan) {
  const kq = []
  const them = (ten, ok, ct) => kq.push({ ten, ok: !!ok, ct: ct == null ? '' : String(ct).slice(0, 300) })
  const moi = (t) => { const d = path.join(TAM, nhan + '-' + t), goc = path.join(d, 'anh'), ud = path.join(d, 'ud'); fs.mkdirSync(goc, { recursive: true }); K.khoiTao(ud, () => {}); return { goc, ud, so: path.join(ud, 'canvas', 'bo-cuc.json') } }

  { // ---- Loi 1: ban chep bi thay bang anh KHAC cung so byte -> khong duoc xoa ----
    const { goc } = moi('l1')
    viet(path.join(goc, 'a.png'), 'AAAA'); viet(path.join(goc, 'b.png'), 'CCCC'); viet(path.join(goc, 'c.png'), 'DDDD')
    const f1 = K.taoKhung(goc, 'F1', 10, 10).khung
    fs.copyFileSync(path.join(goc, 'a.png'), path.join(goc, 'F1', 'a.png'))
    let bc = K.boCucHienTai(); bc.chep[f1.id + '/a.png'] = 4; K.ghiBoCuc(bc)
    viet(path.join(goc, 'F1', 'a.png'), 'BBBB')                                // nguoi dung tu thay bang anh khac cung 4 byte
    const r1 = K.xoaKhung(goc, f1.id)
    them('L1a: ban chep (chi co kich thuoc) bi thay bang anh khac cung so byte -> Xoa khung TU CHOI, anh cua nguoi dung con', r1.ok === false && doc(path.join(goc, 'F1', 'a.png')) === 'BBBB' && doc(path.join(goc, 'a.png')) === 'AAAA', JSON.stringify(r1))
    const f2 = K.taoKhung(goc, 'F2', 700, 10).khung
    fs.copyFileSync(path.join(goc, 'b.png'), path.join(goc, 'F2', 'b.png'))
    bc = K.boCucHienTai(); bc.chep[f2.id + '/b.png'] = 4; K.ghiBoCuc(bc)
    const r2 = K.xoaKhung(goc, f2.id)
    them('L1b: ban chep GIONG HET noi dung anh goc -> van xoa duoc khung, anh goc con (khong lam khung vinh vien khong xoa duoc)', r2.ok === true && !co(path.join(goc, 'F2')) && doc(path.join(goc, 'b.png')) === 'CCCC', JSON.stringify(r2))
    const f3 = K.taoKhung(goc, 'F3', 10, 600).khung
    fs.copyFileSync(path.join(goc, 'c.png'), path.join(goc, 'F3', 'c.png'))
    bc = K.boCucHienTai(); bc.chep[f3.id + '/c.png'] = 4; K.ghiBoCuc(bc)
    K.nap(goc, [])                                                              // ma moi nhan ban chep nay vao so
    viet(path.join(goc, 'F3', 'c.png'), 'EEEE'); sau(path.join(goc, 'F3', 'c.png'), 5000)
    const r3 = K.xoaKhung(goc, f3.id)
    them('L1c: ban chep da ghi so roi bi nguoi dung thay (cung so byte, doi gio) -> khong xoa', r3.ok === false && doc(path.join(goc, 'F3', 'c.png')) === 'EEEE', JSON.stringify(r3))
  }

  { // ---- Loi 2: anh goc da bi GHI DE (che roi luu) -> ban noi trong khung phai theo ban moi ----
    const { goc } = moi('l2')
    const rename = (p, s) => { const t = p + '.tam'; viet(t, s); fs.renameSync(t, p) }   // giong kho.ghiDeAnh: ghi file tam roi doi ten de len
    viet(path.join(goc, 'm.png'), 'SECRET-ORIGINAL-1'); viet(path.join(goc, 'm2.png'), 'SECRET-ORIGINAL-2'); viet(path.join(goc, 'm3.png'), 'SECRET-ORIGINAL-3')
    viet(path.join(goc, 'u.png'), 'ROOT-U')
    const F = K.taoKhung(goc, 'Khung', 10, 10).khung
    for (const t of ['m.png', 'm2.png', 'm3.png']) K.datThanhVien(goc, t, F.id)
    viet(path.join(goc, 'Khung', 'u.png'), 'USERS-OWN')                          // anh nguoi dung tu bo vao khung, cung ten, KHAC noi dung
    K.nap(goc, [])
    // (a) qua moc cua main.js: truoc / sau khi ghi de
    if (K.truocGhiDe) K.truocGhiDe(goc, path.join(goc, 'm.png'))
    rename(path.join(goc, 'm.png'), 'MASKED-1')
    if (K.sauGhiDe) K.sauGhiDe(goc, path.join(goc, 'm.png'))
    them('L2a: che + luu de len anh goc -> ban noi trong thu muc khung CUNG LA ban da che (khong con noi dung cu)', doc(path.join(goc, 'Khung', 'm.png')) === 'MASKED-1' && doc(path.join(goc, 'm.png')) === 'MASKED-1', doc(path.join(goc, 'Khung', 'm.png')))
    // (b) khong qua moc: lan mo Canvas ke tiep phai tu lam moi
    rename(path.join(goc, 'm2.png'), 'MASKED-2')
    const r = K.nap(goc, [])
    them('L2b: de len anh goc ma khong qua moc -> lan mo Canvas ke tiep tu lam moi ban noi trong khung', doc(path.join(goc, 'Khung', 'm2.png')) === 'MASKED-2', doc(path.join(goc, 'Khung', 'm2.png')))
    const mm = r.tt.muc.find((x) => x.khoa === 'm2.png')
    them('L2c: sau khi lam moi, tam van la thanh vien cua khung', !!mm && mm.khung === F.id, mm && mm.khung)
    // (c) anh cua nguoi dung cung ten trong khung KHONG duoc dung toi
    rename(path.join(goc, 'u.png'), 'ROOT-U-DA-DOI')
    K.nap(goc, [])
    them('L2d: anh nguoi dung tu bo vao khung (khong phai ban noi cua app) -> de nguyen, khong bi thay', doc(path.join(goc, 'Khung', 'u.png')) === 'USERS-OWN')
    // (d) o dia khong tao duoc hard link -> app chep; chep cung phai duoc lam moi
    const linkGoc = fs.linkSync
    let c3
    try { fs.linkSync = () => { const e = new Error('EPERM gia lap'); e.code = 'EPERM'; throw e }; c3 = K.datThanhVien(goc, 'm3.png', K.taoKhung(goc, 'Khung chep', 700, 10).khung.id) } finally { fs.linkSync = linkGoc }
    const kc = path.join(goc, 'Khung chep', 'm3.png')
    them('L2e: (chuan bi) o dia khong cho ban noi -> app tao BAN CHEP trong khung', c3 && c3.ok && co(kc) && doc(kc) === 'SECRET-ORIGINAL-3')
    if (K.truocGhiDe) K.truocGhiDe(goc, path.join(goc, 'm3.png'))
    rename(path.join(goc, 'm3.png'), 'MASKED-3')
    if (K.sauGhiDe) K.sauGhiDe(goc, path.join(goc, 'm3.png'))
    them('L2f: ban CHEP trong khung cung duoc lam moi sau khi anh goc bi che', doc(kc) === 'MASKED-3', doc(kc))
  }

  { // ---- Loi 3: thu muc anh tam thoi khong doc duoc -> KHONG ghi de so bo cuc ----
    const { goc, so } = moi('l3')
    viet(path.join(goc, 'a.png'), 'AAAA')
    const F = K.taoKhung(goc, 'Rieng', 100, 200).khung
    K.datThanhVien(goc, 'a.png', F.id)
    K.nap(goc, [])
    const truoc = doc(so)
    const vang = K.nap(goc + '-khong-co', [])
    const khongPhaiThuMuc = path.join(TAM, nhan + '-l3', 'file-thuong'); viet(khongPhaiThuMuc, 'x')
    K.nap(khongPhaiThuMuc, [])
    them('L3a: thu muc anh bien mat / khong phai thu muc -> bo-cuc.json KHONG doi mot byte', doc(so) === truoc && !!truoc)
    them('L3b: trang duoc bao ro (tt.loiThuMuc) de khong hien "Canvas trong"', vang.tt && vang.tt.loiThuMuc === true, vang.tt && vang.tt.loiThuMuc)
    const lai = K.nap(goc, [])
    const k = lai.tt.khung.find((x) => x.ten === 'Rieng')
    them('L3c: cam lai o: khung "Rieng" con nguyen cho cu (100, 200), anh van thuoc khung', !!k && k.x === 100 && k.y === 200 && lai.tt.muc.some((m) => m.khoa === 'a.png' && m.khung === k.id), k && k.x + ',' + k.y)
  }

  { // ---- Loi 4: luu that bai -> bao + khong mat ban trong RAM ----
    const { goc, so } = moi('l4')
    viet(path.join(goc, 'a.png'), 'AAAA')
    K.nap(goc, [])
    const renameGoc = fs.renameSync
    const ghiChu = { id: 'g1', loai: 'ghi', x: 5, y: 5, w: 160, h: 120, mau: '#ffe27a', chu: 'GHI CHU QUAN TRONG', tao: 1 }
    let ok, bao, r, daLuu
    try {
      fs.renameSync = (a, b) => { if (String(b).endsWith('bo-cuc.json')) { const e = new Error('ENOSPC gia lap'); e.code = 'ENOSPC'; throw e } return renameGoc(a, b) }
      ok = K.luuVat({ vat: [ghiChu] })
      bao = typeof K.khongGhiDuoc === 'function' ? K.khongGhiDuoc() : undefined
      r = K.nap(goc, [])                                                         // mo lai / lam moi luc o dia van loi
    } finally { fs.renameSync = renameGoc }
    them('L4a: luu hong (o day) -> luuVat tra false VA co co bao "chua ghi duoc" cho trang (khongGhiDuoc)', ok === false && bao === true, 'ok=' + ok + ' bao=' + bao)
    them('L4b: lam moi trong luc o dia con loi -> ghi chu vua go KHONG bi doc lai tu so cu de mat', r && r.tt.vat.length === 1 && r.tt.vat[0].chu === 'GHI CHU QUAN TRONG', r && r.tt.vat.length)
    const r2 = K.nap(goc, [])
    let dia = null; try { dia = JSON.parse(doc(so)) } catch (e) {}
    them('L4c: o dia het loi -> lan lam moi ke tiep GHI LAI duoc, file chua ghi chu, co bao tat', !!dia && dia.vat && dia.vat.length === 1 && r2.loiGhi === false && (typeof K.khongGhiDuoc !== 'function' || K.khongGhiDuoc() === false), dia && dia.vat && dia.vat.length)
  }

  { // ---- Loi 6: hai anh khac noi dung trung ten khong duoc nhap lam mot ----
    const { goc } = moi('l6')
    viet(path.join(goc, 'p.png'), 'ONE')
    const F = K.taoKhung(goc, 'G', 10, 10).khung
    viet(path.join(goc, 'G', 'p.png'), 'TWO')
    const r = K.nap(goc, [])
    const goc1 = r.tt.muc.find((m) => m.khoa === 'p.png'), rieng = r.tt.muc.find((m) => m.khoa === 'k:' + F.id + '/p.png')
    them('L6a: anh khac noi dung cung ten trong khung -> anh goc KHONG bi coi la thanh vien khung', !!goc1 && goc1.khung === null, goc1 && goc1.khung)
    them('L6b: anh trong khung hien RIENG tren bang (khoa k:...), khong bi che mat', !!rieng && rieng.khung === F.id && rieng.chiTrongKhung === true)
    const d = K.datThanhVien(goc, 'p.png', F.id)
    them('L6c: keo anh goc vao khung dang giu anh khac cung ten -> tu choi ro rang (trung-ten), hai file giu nguyen', d.ok === false && d.loi === 'trung-ten' && doc(path.join(goc, 'G', 'p.png')) === 'TWO' && doc(path.join(goc, 'p.png')) === 'ONE', JSON.stringify(d))
  }
  return kq
}

console.log('\n[1] Phan thu muc / so bo cuc: MA MOI (phai DAT het)')
const Kmoi = require(path.join(ROOT, 'src', 'canvas-kho.js'))
const rm = chayKho(Kmoi, 'moi')
for (const x of rm) kiem(x.ten, x.ok, x.ok ? '' : x.ct)

console.log('\n[2] DOI CHUNG: cung bai tren MA CU ' + COMMIT_CU + ' (phai TRUOT nhung muc ve loi 1 / 2 / 3 / 4 / 6)')
const Kcu = napMaCu()
if (!Kcu) kiem('Lay duoc ma cu bang git show', false, 'khong co git hoac commit ' + COMMIT_CU)
else {
  const rc = chayKho(Kcu, 'cu')
  const cuTruot = rc.filter((x) => !x.ok).map((x) => x.ten.split(':')[0])
  for (const x of rm) { const c = rc.find((y) => y.ten === x.ten); console.log('  ' + (c && !c.ok ? 'BAT   ' : 'LOT   ') + 'ma cu o muc ' + x.ten.split(':')[0]) }
  for (const m of ['L1a', 'L1c', 'L2a', 'L2b', 'L2f', 'L3a', 'L4a', 'L4b', 'L6a']) kiem('Ma cu TRUOT muc ' + m + ' (bai do co bat duoc loi)', cuTruot.includes(m), '')
}

if (process.env.AIO_DOT2_CHI_KHO) { fs.rmSync(TAM, { recursive: true, force: true }); console.log('\nKet qua (chi phan 1-2): ' + (truot ? 'CO ' + truot + ' MUC TRUOT' : 'TAT CA DAT')); process.exit(truot ? 1 : 0) }
console.log('\n[3] Phan Electron an (loi 3 / 4 / 5 / 7 tren trang that, man trong, nhan nut chup)')
const crc = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return (b) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 } })()
function png(r, g, b) {
  const W = 8, H = 6, hang = Buffer.alloc(1 + W * 3)
  for (let i = 0; i < W; i++) { hang[1 + i * 3] = r; hang[2 + i * 3] = g; hang[3 + i * 3] = b }
  const khoi = (ten, d) => { const dai = Buffer.alloc(4); dai.writeUInt32BE(d.length); const th = Buffer.concat([Buffer.from(ten), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(th)); return Buffer.concat([dai, th, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi('IHDR', ihdr), khoi('IDAT', zlib.deflateSync(Buffer.concat(Array(H).fill(hang)))), khoi('IEND', Buffer.alloc(0))])
}
const env0 = Object.assign({}, process.env); delete env0.ELECTRON_RUN_AS_NODE
function chayApp(che, goc, ra) {
  fs.mkdirSync(ra, { recursive: true })
  const env = Object.assign({}, env0, { AIO_THU_KICHBAN: path.join(__dirname, 'kich-ban-canvas-dot2.cjs'), AIO_THU_PHA: che, AIO_THU_HAN: '120000', AIO_NHO_SAN: '0' })
  const r = spawnSync(require('electron'), [process.env.AIO_DOT2_GOC_APP || ROOT, '--thu-canvas', goc, ra], { env, encoding: 'utf8', timeout: 140000 })
  let kq = null
  try { kq = JSON.parse(fs.readFileSync(path.join(ra, 'ket-qua.json'), 'utf8')) } catch (e) {}
  if (!kq) console.log('  stderr: ' + String(r.stderr || r.error || '').slice(-400) + ' (ma thoat ' + r.status + ')')
  return kq
}
{ // man trong
  const goc = path.join(TAM, 'app-trong', 'anh'); fs.mkdirSync(goc, { recursive: true })
  const k = chayApp('trong', goc, path.join(TAM, 'app-trong', 'ra'))
  kiem('App (che do man trong) chay xong va tra ket qua', !!k && !k.loi, k ? (k.loi || '') : 'khong co ket qua')
  for (const c of (k && k.checks) || []) kiem(c.ten, c.ok, c.ok ? '' : c.ct)
}
{ // co anh + khung
  const goc = path.join(TAM, 'app-dung', 'anh'); fs.mkdirSync(goc, { recursive: true })
  const MAU = [[248, 104, 32], [45, 212, 191], [167, 139, 250], [255, 214, 90]]
  ;['a.png', 'b.png', 'c.png', 'd.png'].forEach((t, i) => { const f = path.join(goc, t); fs.writeFileSync(f, png(...MAU[i])); const g = new Date(Date.now() - (6 - i) * 3600000); fs.utimesSync(f, g, g) })
  fs.mkdirSync(path.join(goc, 'Nhóm sẵn')); fs.linkSync(path.join(goc, 'b.png'), path.join(goc, 'Nhóm sẵn', 'b.png'))
  const truoc = ['a.png', 'b.png', 'd.png'].map((t) => t + ':' + fs.readFileSync(path.join(goc, t)).length).join('|')
  const k = chayApp('dung', goc, path.join(TAM, 'app-dung', 'ra'))
  kiem('App (che do co anh) chay xong va tra ket qua', !!k && !k.loi, k ? (k.loi || '') : 'khong co ket qua')
  for (const c of (k && k.checks) || []) kiem(c.ten, c.ok, c.ok ? '' : c.ct)
  kiem('Anh goc a, b, d con nguyen sau cac thao tac xoa khung / ngat thu muc', ['a.png', 'b.png', 'd.png'].map((t) => t + ':' + fs.readFileSync(path.join(goc, t)).length).join('|') === truoc)
}

fs.rmSync(TAM, { recursive: true, force: true })
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
