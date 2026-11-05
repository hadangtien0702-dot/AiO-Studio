/* =========================================================================
   Do NHIP KHUNG cua video quay (01/10) — chay: npm run test:nhipquay
   Vi sao co bai nay: anh Tien xem lai video trong khay thay "giut, nhu thieu fps". Bai test:quayvideo chi DEM so khung
   moi giay (ra 29-30 nen bao dat) — dem khong phai la kiem: file that cua anh co 10-26 khung bi hut va 2,5-10,4 %
   khung lap. Bai nay quay mot BANG DEM chay tren man hinh (so tang 1 moi lan man ve lai) roi DOC SO tren tung khung cua
   file: buoc nhay giua 2 khung lien tiep phai DEU (man 60 Hz quay 30 khung/giay -> moi khung nhay dung 2).
     buoc 0      = khung LAP (dung hinh)
     buoc qua lon = khung ROT (nhay coc)
   Thuoc ngoai: ffmpeg giai ma + ffprobe doc moc thoi gian. ☠️ HIEN bang dem 400x140 o goc tren-trai man chinh
   ~6 s moi luot -> anh dang ngoi may thi hoi truoc (so loi #12).
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'nhip-quay')
const bin = ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins'].map((p) => path.join(ROOT, '..', p, 'bin', 'win64')).find((d) => fs.existsSync(path.join(d, 'ffprobe.exe')))
if (!bin) { console.log('KHONG co ffmpeg/ffprobe -> khong do duoc'); process.exit(1) }

fs.rmSync(RA, { recursive: true, force: true }) // thu muc do bai nay tao
fs.mkdirSync(RA, { recursive: true })
const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe')
const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE
const chay = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'nhip-quay-main.cjs')], { env, encoding: 'utf8', timeout: 200000 })
if (chay.status !== 0) { console.log('Electron thoat ma ' + chay.status + ' ' + (chay.stderr || '').slice(0, 300)); process.exit(1) }
const r = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8'))
if (r.loi) { console.log('LOI: ' + r.loi); process.exit(1) }
console.log('Man chinh ' + r.man.w + 'x' + r.man.h + ' @' + r.man.sf + ' · ' + r.man.hz + ' Hz · bang dem xin ' + JSON.stringify(r.bang.xin) + ' duoc ' + JSON.stringify(r.bang.duoc))

/* Doc so dem tren TUNG khung: cat goc tren-trai (cho bang dem), thu ve 400x140 xam, lay diem giua 16 o. */
function docSo(l) {
  const k = l.batDau.w / l.rect.w // diem anh video / DIP
  const cw = Math.round(400 * k), ch = Math.round(140 * k)
  const raw = execFileSync(path.join(bin, 'ffmpeg.exe'), ['-v', 'error', '-i', l.file, '-an', '-vf', 'crop=' + cw + ':' + ch + ':0:0,scale=400:140', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 })
  const N = 400 * 140, so = []
  for (let f = 0; f + N <= raw.length; f += N) {
    let n = 0
    for (let i = 0; i < 16; i++) n = (n << 1) | (raw[f + 38 * 400 + 8 + i * 24 + 12] > 128 ? 1 : 0)
    so.push(n)
  }
  return so
}
function moc(l) {
  const p = execFileSync(path.join(bin, 'ffprobe.exe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', l.file], { encoding: 'utf8', maxBuffer: 1 << 26 })
  return p.split(/\r?\n/).filter((x) => x.trim()).map(Number).filter((x) => isFinite(x)).sort((a, b) => a - b)
}

const bang = []
for (const l of r.luot) {
  if (!l.batDau || !l.batDau.ok) { bang.push({ ten: l.ten, loi: (l.batDau && l.batDau.loi) || 'khong quay duoc' }); continue }
  const so = docSo(l), t = moc(l)
  // bo 10 khung dau + 5 khung cuoi (luc mo / dong luong)
  const s = so.slice(10, so.length - 5)
  const buoc = []
  for (let i = 1; i < s.length; i++) buoc.push((s[i] - s[i - 1] + 65536) % 65536)
  const mong = Math.max(1, Math.round(r.man.hz / l.fps))
  const dem = {}
  for (const b of buoc) dem[b] = (dem[b] || 0) + 1
  const dung = buoc.filter((b) => b === mong).length
  const lap = buoc.filter((b) => b === 0).length
  const rot = buoc.filter((b) => b >= mong * 2).length
  const lech = buoc.length - dung - lap - rot
  const kh = []
  for (let i = 1; i < t.length; i++) kh.push((t[i] - t[i - 1]) * 1000)
  const sx = [...kh].sort((a, b) => a - b)
  bang.push({
    ten: l.ten, co: l.batDau.w + 'x' + l.batDau.h, nhip: l.batDau.nhip, fps: l.fps,
    khung: so.length, fpsThat: +((t.length - 1) / (t[t.length - 1] - t[0])).toFixed(1), mb: +(l.bytes / 1048576).toFixed(2),
    buocMong: mong, dungNhip: +(dung / buoc.length * 100).toFixed(1), lap, rot, lech,
    phanBoBuoc: Object.keys(dem).sort((a, b) => a - b).map((b) => b + ':' + dem[b]).join(' '),
    khoangMs: sx.length ? sx[Math.floor(sx.length * 0.05)].toFixed(0) + '/' + sx[Math.floor(sx.length / 2)].toFixed(0) + '/' + sx[Math.floor(sx.length * 0.95)].toFixed(0) + '/' + sx[sx.length - 1].toFixed(0) : '',
    nguonHut: l.nguon.hut, nguonNhipMs: l.nguon.nhipMs, daVe: l.xong && l.xong.khung,
  })
}
console.log('\nten              | co        | khung | fps  | MB   | dung nhip | LAP | ROT | lech | khoang ms 5%/giua/95%/max | buoc (gia tri:so lan)        | nguon hut')
for (const b of bang) {
  if (b.loi) { console.log(b.ten.padEnd(16) + ' | LOI ' + b.loi); continue }
  console.log([b.ten.padEnd(16), b.co.padEnd(9), String(b.khung).padStart(5), String(b.fpsThat).padStart(4), String(b.mb).padStart(4), (b.dungNhip + '%').padStart(9), String(b.lap).padStart(3), String(b.rot).padStart(3), String(b.lech).padStart(4), b.khoangMs.padEnd(25), b.phanBoBuoc.padEnd(28), b.nguonHut + ' (nhip ' + b.nguonNhipMs + ' ms)'].join(' | '))
}
fs.writeFileSync(path.join(RA, 'bang.json'), JSON.stringify(bang, null, 1))

// Cham: cach MAC DINH cua app (khung-30) phai gan nhu khong lap / khong rot, ca vung nho lan vung lon
/* Nguong lay tu SO DA DO 01/10 (man 60 Hz, 11 luot): cach mac dinh ra 91-94 % khung dung nhip, lap 0-4 / ~175, rot 0.
   -> DAT khi: dung nhip >= 85 %, lap <= 3 %, rot <= 1 %. Cach cu (doi chung) do duoc 0 % dung nhip, 76 % khung lap. */
const macDinh = bang.filter((b) => !b.loi && (b.ten.startsWith('mac-dinh') || b.ten.startsWith('du-phong')))
let dat = macDinh.length > 0
for (const b of macDinh) {
  const tong = b.khung - 16
  const ok = b.lap <= Math.max(2, tong * 0.03) && b.rot <= Math.max(1, tong * 0.01) && b.dungNhip >= 85
  console.log((ok ? '  DAT  ' : '  TRUOT ') + b.ten + ': dung nhip ' + b.dungNhip + '% (can >= 85), lap ' + b.lap + ' (<= 3%), rot ' + b.rot + ' (<= 1%)')
  if (!ok) dat = false
}
// DOI CHUNG: cach cu (khong nang luong chay san) PHAI bi thuoc nay bat — khong thi thuoc mu.
// Luot nay chay SAU mot luot mac dinh nen con chung minh: quay xong luong chay san da duoc HA ve 5 khung/giay.
for (const b of bang.filter((x) => !x.loi && x.ten.startsWith('doi-chung'))) {
  const tong = b.khung - 16
  const ok = b.lap >= tong * 0.5 && b.dungNhip < 20
  console.log((ok ? '  DAT  ' : '  TRUOT ') + 'doi chung ' + b.ten + ': cach cu bi bat (lap ' + b.lap + '/' + tong + ', dung nhip ' + b.dungNhip + '%) -> thuoc nhin thay loi + luong chay san da ha ve 5 khung/giay')
  if (!ok) dat = false
}
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
