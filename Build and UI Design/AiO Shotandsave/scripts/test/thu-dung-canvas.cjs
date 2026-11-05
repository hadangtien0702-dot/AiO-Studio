'use strict'
/* THU DUNG Canvas tren APP THAT o che do AN voi anh co MAN HINH THAT — chay: node scripts/test/thu-dung-canvas.cjs [so anh, mac dinh 17]
   Tao N anh PNG 2560x1440 trong thu muc tam, mo app (`electron . --thu-canvas`, cua so khong hien, userData rieng), chay kich ban
   scripts/test/kich-ban-thu-dung-canvas.cjs (bam, go, keo, lan bang sendInputEvent) roi in ra so do. Bai nay GHI NHAN, khong cham dat / truot.
   AIO_GIU=<thu muc>: giu lai anh chup cua so + ket-qua.json o do. Thu muc tam (os.tmpdir()/aio-thudung-*) tu xoa.
   KHONG do: cua so that tren man that, ban di chuot, do muot khi keo, video, Windows. */
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')
const { spawnSync } = require('child_process')
const ROOT = path.resolve(__dirname, '..', '..')
const N = Math.max(1, Number(process.argv[2]) || 17)
const W = 2560, H = 1440

const crcBang = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcBang[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
// mot "anh chup man hinh": nen chuyen mau + vai cua so + cac dong chu gia (co chi tiet, khong phai mau phang)
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

const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-thudung-'))
const goc = path.join(TAM, 'anh'), ra = path.join(TAM, 'ra')
fs.mkdirSync(goc); fs.mkdirSync(ra)
const t0 = Date.now()
const mau = [0, 1, 2, 3, 4, 5].map(png)
let tongByte = 0
for (let i = 0; i < N; i++) {
  const f = path.join(goc, 'AiO-2026-10-12-09' + String(i).padStart(4, '0') + '.png')
  fs.writeFileSync(f, mau[i % mau.length]); tongByte += mau[i % mau.length].length
  const t = new Date(Date.now() - (N - i) * 60000); fs.utimesSync(f, t, t)
}
console.log('Tao ' + N + ' anh ' + W + 'x' + H + ' (' + (tongByte / 1048576).toFixed(1) + ' MB) trong ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s')

const env = Object.assign({}, process.env, { AIO_THU_KICHBAN: path.join(__dirname, 'kich-ban-thu-dung-canvas.cjs'), AIO_THU_HAN: '300000' }); delete env.ELECTRON_RUN_AS_NODE
const t1 = Date.now()
const r = spawnSync(require('electron'), [ROOT, '--thu-canvas', goc, ra], { env, encoding: 'utf8', timeout: 330000 })
console.log('App chay ' + ((Date.now() - t1) / 1000).toFixed(1) + ' s, ma thoat ' + r.status)
let kq = null
try { kq = JSON.parse(fs.readFileSync(path.join(ra, 'ket-qua.json'), 'utf8')) } catch (e) { console.log('KHONG co ket-qua.json: ' + String(r.stderr || r.error || '').slice(-300)) }
if (kq) {
  const dn = path.join(ra, 'userData', 'canvas', 'anh-nho')
  let soNho = 0, byteNho = 0
  try { for (const f of fs.readdirSync(dn)) { soNho++; byteNho += fs.statSync(path.join(dn, f)).size } } catch (e) {}
  kq.anhNhoTrenDia = { so: soNho, kb: Math.round(byteNho / 1024) }
  kq.anhGocConDu = fs.readdirSync(goc).filter((f) => f.endsWith('.png')).length + '/' + N
  console.log(JSON.stringify(kq, null, 1))
}
if (process.env.AIO_GIU) {
  fs.mkdirSync(process.env.AIO_GIU, { recursive: true })
  for (const f of fs.readdirSync(ra)) if (f.endsWith('.png') || f.endsWith('.json')) fs.copyFileSync(path.join(ra, f), path.join(process.env.AIO_GIU, 'n' + N + '-' + f))
}
fs.rmSync(TAM, { recursive: true, force: true })
