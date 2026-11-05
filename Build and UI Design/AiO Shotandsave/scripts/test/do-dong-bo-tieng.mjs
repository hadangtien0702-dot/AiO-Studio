/* =========================================================================
   Do DO LECH TIENG - HINH cua video quay (01/10) — chay: npm run test:dongbotieng
   Vi sao: anh Tien xem lai video: "bi sai voice". Bang dem (scripts/test/bang-dem.html?bip=1) cu moi giay CHOP mot o
   trang va cung luc do keu BIP 3 kHz. Quay lai bang chinh bo quay cua app roi so:
     luc o chop sang lan dau trong HINH (moc thoi gian cua khung)  voi  luc bip bat dau trong TIENG (mau am thanh).
   lech > 0 = tieng DEN SAU hinh; lech < 0 = tieng den truoc hinh. Tai nguoi bat dau thay lech moi khoang ±80-100 ms.
   Thuoc ngoai: ffmpeg giai ma hinh + tieng. Do phan giai: 1 khung hinh = 33 ms.
   ☠️ HIEN bang dem 400x140 o goc tren-trai man chinh va PHAT tieng bip nho ra loa ~8 s moi luot -> hoi anh truoc.
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'nhip-quay')
const bin = ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins'].map((p) => path.join(ROOT, '..', p, 'bin', 'win64')).find((d) => fs.existsSync(path.join(d, 'ffprobe.exe')))
if (!bin) { console.log('KHONG co ffmpeg/ffprobe -> khong do duoc'); process.exit(1) }

fs.rmSync(RA, { recursive: true, force: true })
fs.mkdirSync(RA, { recursive: true })
const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe')
const env = Object.assign({}, process.env, {
  AIO_NHIP_BIP: '1', AIO_NHIP_GIAY: process.env.AIO_NHIP_GIAY || '9',
  // mac-dinh* = cach app dang dung (co lam tre tieng theo cong thuc). doi-chung-khong-tre = cung cach nhung treTieng = 0:
  // phai LECH ro (tieng di truoc hinh) -> chung minh thuoc bat duoc loi va viec lam tre tieng co tac dung.
  AIO_NHIP_LUOT: process.env.AIO_NHIP_LUOT || 'mac-dinh:xuly:30:0,mac-dinh-lon:xuly:30:1,doi-chung-khong-tre:xuly:30:1:1:0,mac-dinh-lai:xuly:30:0',
})
delete env.ELECTRON_RUN_AS_NODE
const chay = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'nhip-quay-main.cjs')], { env, encoding: 'utf8', timeout: 200000 })
if (chay.status !== 0) { console.log('Electron thoat ma ' + chay.status); process.exit(1) }
const r = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8'))
if (r.loi) { console.log('LOI: ' + r.loi); process.exit(1) }
console.log('Man chinh ' + r.man.hz + ' Hz, he so ' + r.man.sf)

function chopTrongHinh(l) {
  const k = l.batDau.w / l.rect.w
  const cw = Math.round(400 * k), ch = Math.round(140 * k)
  const raw = execFileSync(path.join(bin, 'ffmpeg.exe'), ['-v', 'error', '-i', l.file, '-an', '-vf', 'crop=' + cw + ':' + ch + ':0:0,scale=400:140', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 })
  const t = execFileSync(path.join(bin, 'ffprobe.exe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', l.file], { encoding: 'utf8', maxBuffer: 1 << 26 })
    .split(/\r?\n/).filter((x) => x.trim()).map(Number).filter((x) => isFinite(x)).sort((a, b) => a - b)
  const N = 400 * 140, luc = []
  let truoc = false
  for (let f = 0, i = 0; f + N <= raw.length; f += N, i++) {
    const sang = raw[f + 106 * 400 + 320] > 128 // giua o chop (250..390, 80..132)
    if (sang && !truoc && i < t.length) luc.push(t[i])
    truoc = sang
  }
  return luc
}
function bipTrongTieng(l) {
  const HZ = 48000
  const raw = execFileSync(path.join(bin, 'ffmpeg.exe'), ['-v', 'error', '-i', l.file, '-vn', '-ac', '1', '-ar', String(HZ), '-f', 's16le', '-'], { maxBuffer: 1 << 30 })
  const n = Math.floor(raw.length / 2)
  /* ☠️ Lan dau do bang BIEN DO (vuot 25 % dinh): may anh dang phat am thanh khac to hon tieng bip -> chi bat 2-5 / 9
     tieng, so lech nhay lung tung (-487 .. +30 ms). Nay LOC DUNG TAN SO cua tieng bip (Goertzel 3 kHz, cua so 4 ms,
     buoc 1 ms): "co bip" = hon nua nang luong cua cua so nam o 3 kHz VA bien do thanh phan do > 250. Am thanh khac
     dang phat khong lam sai nua. */
  const F = 3000, N = 192, BUOC = 48
  const x = new Float64Array(n)
  for (let i = 0; i < n; i++) x[i] = raw.readInt16LE(i * 2)
  const w = 2 * Math.PI * F / HZ, cw = 2 * Math.cos(w)
  const luc = []
  let yen = 1000, dinh = 0
  for (let i = 0; i + N <= n; i += BUOC) {
    let s0 = 0, s1 = 0, s2 = 0, tong = 0
    for (let j = 0; j < N; j++) { const v = x[i + j]; s0 = v + cw * s1 - s2; s2 = s1; s1 = s0; tong += v * v }
    const p = s1 * s1 + s2 * s2 - cw * s1 * s2 // |X|^2 tai F
    const bienDo = 2 * Math.sqrt(Math.max(0, p)) / N
    const tiLe = tong > 0 ? p / (N / 2 * tong) : 0
    if (bienDo > dinh) dinh = Math.round(bienDo)
    if (tiLe > 0.5 && bienDo > 250) { if (yen >= 300) luc.push(i / HZ); yen = 0 } else yen++
  }
  return { luc, dinh, giay: n / HZ }
}

let dat = true
const bang = []
for (const l of r.luot) {
  if (!l.batDau || !l.batDau.ok) { console.log(l.ten + ': KHONG quay duoc ' + JSON.stringify(l.batDau)); dat = false; continue }
  const hinh = chopTrongHinh(l), tieng = bipTrongTieng(l)
  // ghep moi lan chop voi tieng bip gan nhat (trong ±0,5 s)
  const lech = []
  for (const th of hinh) {
    let gan = null
    for (const tt of tieng.luc) if (gan == null || Math.abs(tt - th) < Math.abs(gan - th)) gan = tt
    if (gan != null && Math.abs(gan - th) < 0.5) lech.push((gan - th) * 1000)
  }
  const s = [...lech].sort((a, b) => a - b)
  const o = {
    ten: l.ten, co: l.batDau.w + 'x' + l.batDau.h, soChop: hinh.length, soBip: tieng.luc.length, ghep: lech.length,
    lechGiua: s.length ? Math.round(s[Math.floor(s.length / 2)]) : null, lechMin: s.length ? Math.round(s[0]) : null, lechMax: s.length ? Math.round(s[s.length - 1]) : null,
    dinhTieng: tieng.dinh, treLoa: l.treTieng,
    treHinh: l.xong && l.xong.tre, treTiengDat: l.xong && l.xong.treTieng, // bo quay tu do: tre cua hinh + muc lam tre tieng da dat
  }
  bang.push(o)
  console.log(o.ten.padEnd(14) + ' | ' + o.co.padEnd(9) + ' | chop ' + o.soChop + ', bip ' + o.soBip + ', ghep ' + o.ghep + ' | lech tieng-hinh: giua ' + o.lechGiua + ' ms (tu ' + o.lechMin + ' toi ' + o.lechMax + ') | tre hinh bo quay tu do ' + JSON.stringify(o.treHinh) + ' | lam tre tieng ' + o.treTiengDat + ' ms | bip 3 kHz dinh ' + o.dinhTieng + ' | tre loa nguon ' + (o.treLoa ? Math.round(o.treLoa.ra * 1000) : '?') + ' ms')
}
fs.writeFileSync(path.join(RA, 'dong-bo.json'), JSON.stringify(bang, null, 1))
for (const b of bang.filter((x) => x.ten.startsWith('mac-dinh'))) {
  // Bang do tu no lech +20 ms (loa cham hon hinh) -> dich la +20; cho phep -40 .. +80 (tai nguoi chiu tieng CHAM tot hon tieng SOM)
  const ok = b.ghep >= 4 && b.lechGiua >= -40 && b.lechGiua <= 80 && (b.lechMax - b.lechMin) <= 120
  console.log((ok ? '  DAT  ' : '  TRUOT ') + b.ten + ': lech giua ' + b.lechGiua + ' ms (can -40 .. +80), dao dong ' + (b.lechMax - b.lechMin) + ' ms (<= 120), ghep duoc ' + b.ghep + ' cap (>= 4)')
  if (!ok) dat = false
}
// DOI CHUNG: khong lam tre tieng thi tieng PHAI di truoc hinh ro rang — khong thi thuoc mu / viec lam tre vo tac dung
for (const b of bang.filter((x) => x.ten.startsWith('doi-chung'))) {
  const ok = b.ghep >= 4 && b.lechGiua <= -80
  console.log((ok ? '  DAT  ' : '  TRUOT ') + 'doi chung ' + b.ten + ': khong lam tre -> lech ' + b.lechGiua + ' ms (phai <= -80)')
  if (!ok) dat = false
}
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
