'use strict'
/* Do CANVAS Y TUONG tren APP THAT o che do AN — chay: npm run test:canvasapp
   Chay main.js that + trang src/canvas that qua `electron . --thu-canvas <thu muc anh thu> <thu muc ra>`: cua so KHONG hien len man,
   userData rieng (khong danh thuc ban dang cai). Trang duoc bam / keo bang su kien con tro cua chinh no, roi bai nay doi chieu voi DIA.
   Moi thu nam trong mot thu muc tam do bai nay tao (os.tmpdir()/aio-canvasapp-*) va tu xoa dung thu muc do.
   Bai nay KHONG do: chuot that, cua so that tren man that, do muot, anh that kich thuoc lon, Windows (chua chay tren Windows lan nao). */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const ROOT = path.resolve(__dirname, '..', '..')

let truot = 0
const kiem = (ten, ok, ct) => { if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-canvasapp-'))
const goc = path.join(TAM, 'anh'), ra = path.join(TAM, 'ra')
fs.mkdirSync(goc); fs.mkdirSync(ra)
// anh PNG 8x6 that (nativeImage doc duoc): moi tam mot mau de nhin anh chup cua so phan biet duoc
const crc = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return (b) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 } })()
function png(r, g, b) {
  const zlib = require('zlib'), W = 8, H = 6, hang = Buffer.alloc(1 + W * 3)
  for (let i = 0; i < W; i++) { hang[1 + i * 3] = r; hang[2 + i * 3] = g; hang[3 + i * 3] = b }
  const khoi = (ten, d) => { const dai = Buffer.alloc(4); dai.writeUInt32BE(d.length); const th = Buffer.concat([Buffer.from(ten), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(th)); return Buffer.concat([dai, th, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi('IHDR', ihdr), khoi('IDAT', zlib.deflateSync(Buffer.concat(Array(H).fill(hang)))), khoi('IEND', Buffer.alloc(0))])
}
const MAU = [[248, 104, 32], [45, 212, 191], [167, 139, 250], [255, 214, 90], [244, 114, 182], [74, 222, 128]]
const TEN = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png']
TEN.forEach((t, i) => fs.writeFileSync(path.join(goc, t), png(...MAU[i])))
fs.mkdirSync(path.join(goc, 'Nhóm sẵn')); fs.linkSync(path.join(goc, 'b.png'), path.join(goc, 'Nhóm sẵn', 'b.png'))
const ino = (p) => String(fs.statSync(p, { bigint: true }).ino)
const co = (p) => fs.existsSync(p)
const chupGoc = () => TEN.map((t) => t + ':' + fs.statSync(path.join(goc, t)).size + ':' + (co(path.join(goc, t)) ? 1 : 0)).join('|')
const GOC0 = chupGoc()

console.log('\n[1] Chay app that o che do an (~6 giay)')
const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
const r = spawnSync(require('electron'), [ROOT, '--thu-canvas', goc, ra], { env, encoding: 'utf8', timeout: 90000 })
let kq = null
try { kq = JSON.parse(fs.readFileSync(path.join(ra, 'ket-qua.json'), 'utf8')) } catch (e) {}
kiem('App chay xong va tra ket qua', !!kq && !kq.loi, kq ? (kq.loi || 'ban ' + kq.ban) : 'ma thoat ' + r.status + ' ' + String(r.stderr || r.error || '').slice(-200))
if (kq && kq.buoc && kq.buoc.dau) {
  const b = kq.buoc, khoa = (tt, k) => (tt.muc.find((m) => m[0] === k) || [])[1]
  console.log('\n[2] Mo bang')
  kiem('6 tam anh + 1 khung co san tu thu muc "Nhóm sẵn" (dem tren tai = 1), b.png nam trong khung do', b.dau.o === 6 && b.dau.khung.length === 1 && b.dau.khung[0].ten === 'Nhóm sẵn' && b.dau.khung[0].n === 1 && khoa(b.dau, 'b.png') === b.dau.khung[0].id, JSON.stringify(b.dau.khung))
  kiem('Chu tren bang dung tieng Viet, dem dung; luot chia bai da xong (khong tam nao con treo giua duong)', b.dau.dem === '6 ý tưởng · 1 thư mục' && b.dau.tieu.startsWith('Mọi ý tưởng, một bảng.') && b.dau.conBay === 0, b.dau.dem + ' | con bay ' + b.dau.conBay)
  kiem('Anh nho tai duoc qua aioshot://cv (it nhat 1 tam; cua so an nen trinh duyet co the chua tai het)', b.dau.anhTong === 6 && b.dau.anhXong >= 1, b.dau.anhXong + '/' + b.dau.anhTong)
  console.log('\n[3] Thao tac bang su kien that cua trang, doi chieu voi dia')
  const moi = b.sauTao && b.sauTao.khung.find((k) => k.id === kq.idMoi)
  // dia duoc doc SAU khi app thoat: luc do thu muc da doi ten o buoc sau -> kiem ten luc tao o day, kiem thu muc o muc "doi ten" ben duoi
  kiem('Bam "Khung moi" -> co khung moi mang ten mac dinh, dem tren tai = 0', !!moi && moi.ten === 'Thư mục mới' && moi.n === 0, moi ? moi.ten + ' / ' + moi.n : 'khong co')
  if (moi && b.sauKeoRa) {
    const noi1 = path.join(goc, 'Ý tưởng Tết', 'a.png')
    kiem('Keo tam a.png tha vao khung -> trang thai: a.png thuoc khung, dem tren tai = 1', khoa(b.sauKeoVao, 'a.png') === moi.id && b.sauKeoVao.khung.find((k) => k.id === moi.id).n === 1 && !b.sauKeoVao.bao, JSON.stringify(b.sauKeoVao.khung.find((k) => k.id === moi.id)) + ' bao: ' + b.sauKeoVao.bao)
    kiem('Go ten moi tren tai -> khung doi ten, thu muc tren dia doi ten theo (thu muc cu khong con)', b.sauDoiTen.khung.find((k) => k.id === moi.id).ten === 'Ý tưởng Tết' && !co(path.join(goc, 'Thư mục mới')) && !b.sauDoiTen.bao, b.sauDoiTen.khung.map((k) => k.ten).join(', '))
    kiem('DOI CHUNG: go ten "///" -> bao loi cho nguoi dung, o ten tra ve ten cu, thu muc khong doi', b.sauTenSai.bao === 'Tên này không dùng được cho thư mục.' && b.sauTenSai.khung.find((k) => k.id === moi.id).o === 'Ý tưởng Tết', b.sauTenSai.bao)
    kiem('Keo goc thu nho khung -> a.png van thuoc khung (khong bi day ra)', khoa(b.sauDoiCo, 'a.png') === moi.id, String(khoa(b.sauDoiCo, 'a.png')))
    kiem('Keo a.png ra ngoai moi khung -> trang thai: khong con thuoc khung, dem = 0', khoa(b.sauKeoRa, 'a.png') === '' && b.sauKeoRa.khung.find((k) => k.id === moi.id).n === 0, JSON.stringify(b.sauKeoRa.khung))
    kiem('Dia sau cung: thu muc "Ý tưởng Tết" con, KHONG con ban noi a.png trong do; "Nhóm sẵn/b.png" van la ban noi cua anh goc', co(path.join(goc, 'Ý tưởng Tết')) && !co(noi1) && ino(path.join(goc, 'Nhóm sẵn', 'b.png')) === ino(path.join(goc, 'b.png')))
  } else kiem('Du cac buoc thao tac', false, 'thieu buoc: ' + Object.keys(b).join(','))
  console.log('\n[4] An toan')
  kiem('6 anh goc con nguyen (ten + kich thuoc)', chupGoc() === GOC0)
  kiem('Khong loi console tren trang', kq.loiTrang.length === 0, kq.loiTrang.join(' ; ').slice(0, 300))
  const so = path.join(ra, 'userData', 'canvas', 'bo-cuc.json')
  kiem('So bo cuc da ghi, co du 2 khung va vi tri 6 tam', co(so) && JSON.parse(fs.readFileSync(so, 'utf8')).khung.length === 2 && Object.keys(JSON.parse(fs.readFileSync(so, 'utf8')).vt).length === 6)
  const anh = path.join(ra, 'canvas.png')
  if (co(anh) && process.env.AIO_GIU_ANH) { fs.copyFileSync(anh, process.env.AIO_GIU_ANH); console.log('  anh chup cua so: ' + process.env.AIO_GIU_ANH) }
}
fs.rmSync(TAM, { recursive: true, force: true })
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
