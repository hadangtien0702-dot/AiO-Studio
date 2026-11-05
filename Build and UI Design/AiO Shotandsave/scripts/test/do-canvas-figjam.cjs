'use strict'
/* Do CANVAS kieu FigJam / Miro tren APP THAT o che do AN — chay: npm run test:canvasfigjam
   Chay main.js that + trang src/canvas that qua `electron . --thu-canvas <thu muc anh thu> <thu muc ra>` voi kich ban
   scripts/test/kich-ban-canvas-figjam.cjs (bam / go / keo bang sendInputEvent). Hai pha tren CUNG userData: pha 1 thao tac, pha 2 mo lai.
   Moi thu nam trong thu muc tam (os.tmpdir()/aio-canvasfigjam-*) do bai nay tao va tu xoa. Cua so KHONG hien len man, khong danh thuc
   ban dang cai. KHONG do: chuot that (di chuot / bam tren man that), do muot, keo that ra app khac (chi do main nhan dung file), Windows. */
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { spawnSync } = require('child_process')
const ROOT = path.resolve(__dirname, '..', '..')

let truot = 0
const kiem = (ten, ok, ct) => { if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-canvasfigjam-'))
const goc = path.join(TAM, 'anh'), ra = path.join(TAM, 'ra')
fs.mkdirSync(goc); fs.mkdirSync(ra)
const crc = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return (b) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 } })()
function png(r, g, b) {
  const W = 8, H = 6, hang = Buffer.alloc(1 + W * 3)
  for (let i = 0; i < W; i++) { hang[1 + i * 3] = r; hang[2 + i * 3] = g; hang[3 + i * 3] = b }
  const khoi = (ten, d) => { const dai = Buffer.alloc(4); dai.writeUInt32BE(d.length); const th = Buffer.concat([Buffer.from(ten), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(th)); return Buffer.concat([dai, th, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi('IHDR', ihdr), khoi('IDAT', zlib.deflateSync(Buffer.concat(Array(H).fill(hang)))), khoi('IEND', Buffer.alloc(0))])
}
const MAU = [[248, 104, 32], [45, 212, 191], [167, 139, 250], [255, 214, 90], [244, 114, 182], [74, 222, 128]]
const TEN = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png']
TEN.forEach((t, i) => { const f = path.join(goc, t); fs.writeFileSync(f, png(...MAU[i])); const g = new Date(Date.now() - (6 - i) * 3600000); fs.utimesSync(f, g, g) })
fs.mkdirSync(path.join(goc, 'Nhóm sẵn')); fs.linkSync(path.join(goc, 'b.png'), path.join(goc, 'Nhóm sẵn', 'b.png'))
fs.mkdirSync(path.join(goc, 'Rieng')); fs.writeFileSync(path.join(goc, 'Rieng', 'cua-toi.png'), png(10, 10, 10))
const chupGoc = () => TEN.map((t) => t + ':' + fs.readFileSync(path.join(goc, t)).length).join('|')
const GOC0 = chupGoc()
const env0 = Object.assign({}, process.env); delete env0.ELECTRON_RUN_AS_NODE

function chay(pha) {
  const env = Object.assign({}, env0, { AIO_THU_KICHBAN: path.join(__dirname, 'kich-ban-canvas-figjam.cjs'), AIO_THU_PHA: String(pha), AIO_THU_HAN: '150000' })
  const t0 = Date.now()
  const r = spawnSync(require('electron'), [ROOT, '--thu-canvas', goc, ra], { env, encoding: 'utf8', timeout: 170000 })
  let kq = null
  try { kq = JSON.parse(fs.readFileSync(path.join(ra, 'ket-qua.json'), 'utf8')) } catch (e) {}
  console.log('  (pha ' + pha + ' chay ' + Math.round((Date.now() - t0) / 1000) + ' s, ma thoat ' + r.status + ')')
  if (!kq) console.log('  stderr: ' + String(r.stderr || r.error || '').slice(-400))
  return kq
}

console.log('\n[1] Pha 1: thao tac tren app that (an)')
fs.rmSync(path.join(ra, 'ket-qua.json'), { force: true })
const k1 = chay(1)
kiem('App chay xong va tra ket qua', !!k1 && !k1.loi, k1 ? (k1.loi || 'ban ' + k1.ban) : 'khong co ket qua')
for (const c of (k1 && k1.checks) || []) kiem(c.ten, c.ok, c.ok ? '' : c.ct)

console.log('\n[2] Pha 2: mo lai app, thu da luu con nguyen')
fs.rmSync(path.join(ra, 'ket-qua.json'), { force: true })
const k2 = chay(2)
kiem('App mo lai va tra ket qua', !!k2 && !k2.loi, k2 ? (k2.loi || '') : 'khong co ket qua')
for (const c of (k2 && k2.checks) || []) kiem(c.ten, c.ok, c.ok ? '' : c.ct)

console.log('\n[3] An toan sau ca hai pha')
kiem('6 anh goc con nguyen (ten + dung luong)', chupGoc() === GOC0)
kiem('Thu muc "Rieng" + file rieng cua nguoi dung con nguyen', fs.existsSync(path.join(goc, 'Rieng', 'cua-toi.png')))
for (const t of ['1-vat.png', '2-khung.png', '3-cuoi.png', 'pha2.png']) {
  const f = path.join(ra, t)
  if (fs.existsSync(f) && process.env.AIO_GIU_ANH) { const d = path.join(process.env.AIO_GIU_ANH, t); fs.mkdirSync(process.env.AIO_GIU_ANH, { recursive: true }); fs.copyFileSync(f, d); console.log('  anh chup cua so: ' + d) }
}
fs.rmSync(TAM, { recursive: true, force: true })
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
