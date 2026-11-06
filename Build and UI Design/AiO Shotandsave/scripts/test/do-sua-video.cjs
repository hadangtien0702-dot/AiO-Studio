'use strict'
/* Do SUA VIDEO (06/11) — chay: npm run test:suavideo
   Chay CHINH src/sua-video.js + cua so AN src/sua-xuat (scripts/test/sua-video-main.cjs, khong mo cua so nao len man hinh),
   roi SOI FILE RA bang thuoc NGOAI (ffprobe / ffmpeg, khong cung vat lieu voi ma xuat): DOC NOI DUNG TUNG KHUNG (so loi #14),
   khong dem khung. Video thu co ma khung 16 bit tren cung + vung chop trang moi giay + tieng 1 kHz dung luc chop => do duoc:
   - cat dau cuoi: khung thu k cua file moi == khung thu j0 + k cua file goc (ma trung het), do dai dung
   - tieng con va DONG BO (hinh chop <-> tieng bip lech nhau khong qua 1 khung so voi file goc), goi AAC chep nguyen
   - tu phong to: ty le do/vang trong khung (4 goc mau), muot (dao ham bac 1, 2 bi chan)
   - nen + bo goc + bong: pixel goc, pixel sat canh, ma khung ben trong hop video
   - file goc khong doi (md5), xuat loi / huy thi khong de lai file nao
   - ban "Khong tieng" (mp4-bo-tieng.js): 0 byte tieng that
   DOI CHUNG nam trong tung muc (ghi "DOI CHUNG"). Can ffprobe + ffmpeg (PATH hoac bin/ cua panel khac). */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { console.log('LOI: ' + (e && e.stack)); process.exit(2) })
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawnSync, execFileSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.join(ROOT, '.selftest', 'sua-video')
const SuaRender = require(path.join(ROOT, 'src', 'sua-video', 'render.js'))
const { taoBanKhongTieng } = require(path.join(ROOT, 'src', 'mp4-bo-tieng.js'))

const kq = []
let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')); if (!ok) dat = false }
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')

function timCongCu(ten) {
  const exe = process.platform === 'win32' ? ten + '.exe' : ten
  const kiemTra = spawnSync(ten, ['-version'], { encoding: 'utf8' })
  if (!kiemTra.error && kiemTra.status === 0) return ten
  for (const p of ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins']) {
    const f = path.join(ROOT, '..', p, 'bin', 'win64', exe)
    if (fs.existsSync(f)) return f
  }
  return null
}
const FFPROBE = timCongCu('ffprobe'), FFMPEG = timCongCu('ffmpeg')
if (!FFPROBE || !FFMPEG) { console.log('KHONG co ffprobe / ffmpeg tren may -> khong do duoc (thuoc ngoai bat buoc)'); process.exit(1) }

// ---------- chay tien trinh Electron ----------
fs.mkdirSync(RA, { recursive: true })
let electron
try { electron = require('electron') } catch (e) { electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron') }
const env = Object.assign({}, process.env, { AIO_SUA_RA: RA })
delete env.ELECTRON_RUN_AS_NODE
const chay = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'sua-video-main.cjs')], { env, encoding: 'utf8', timeout: 400000 })
kiem('Electron thu chay xong, ma thoat 0', chay.status === 0, 'status ' + chay.status)
let R = null
try { R = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8')) } catch (e) {}
kiem('Co ket-qua.json va khong co loi chung', !!R && !R.loi && R.cuoi === 'xong', R && R.loi ? String(R.loi).slice(0, 300) : '')
if (!R || R.loi) { console.log(kq.join('\n')); process.exit(1) }
const job = (ten) => R.job.find((j) => j.ten === ten)
const A = R.nguon.A, B = R.nguon.B, C = R.nguon.C

// ---------- cong cu soi ----------
function probe(f) {
  const o = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-count_packets', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_read_packets,duration,sample_rate,channels:format=duration', '-of', 'json', f], { encoding: 'utf8' }))
  const v = (o.streams || []).filter((s) => s.codec_type === 'video'), a = (o.streams || []).filter((s) => s.codec_type === 'audio')
  return { v: v[0], a: a[0], soV: v.length, soA: a.length, dur: Number(o.format.duration) }
}
function ptsKhung(f) {
  const s = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', f], { encoding: 'utf8', maxBuffer: 1 << 26 })
  return s.split(/\r?\n/).filter(Boolean).map((x) => Number(x.split(',')[0]))
}
/* Giai ma moi khung -> mang Buffer (w x h x kenh). */
function khungRaw(f, w, h, kieu, vf) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', f, '-an', '-vf', (vf ? vf + ',' : '') + 'scale=' + w + ':' + h, '-pix_fmt', kieu, '-fps_mode', 'passthrough', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 })
  if (r.status !== 0) throw new Error('ffmpeg: ' + String(r.stderr).slice(0, 200))
  const kenh = kieu === 'gray' ? 1 : 3, kich = w * h * kenh, ra = []
  for (let i = 0; i + kich <= r.stdout.length; i += kich) ra.push(r.stdout.subarray(i, i + kich))
  return ra
}
/* Ma khung (16 bit) + co "chop" tu khung xam 160x90 cua video thu kieu 'ma' (hang o ma nam tren cung, chop o giua). */
function maKhung(g, w) {
  const k = w / 640
  let ma = 0
  for (let i = 0; i < 16; i++) {
    const cx = Math.round((32 + 36 * i + 18) * k), cy = Math.round(28 * k)
    let s = 0, n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { s += g[(cy + dy) * w + cx + dx]; n++ }
    ma = (ma << 1) | (s / n > 128 ? 1 : 0)
  }
  let s = 0, n = 0
  for (let y = Math.round(150 * k); y < Math.round(270 * k); y++) for (let x = Math.round(60 * k); x < Math.round(580 * k); x++) { s += g[y * w + x]; n++ }
  return { ma, chop: s / n > 200 }
}
function phanTichMa(f) {
  const pts = ptsKhung(f), g = khungRaw(f, 160, 90, 'gray')
  return { pts, ma: g.map((x) => maKhung(x, 160)) }
}
/* Thoi diem bat dau cac loat bip (tieng 1 kHz): giai ma ra f32 mono 8 kHz, bao tong tung 5 ms. */
function bip(f) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', f, '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 })
  if (r.status !== 0 || !r.stdout.length) return { onset: [], pcm: new Float32Array(0) }
  const pcm = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 4))
  const W = 40 // 5 ms
  const on = []
  let dang = false, cuoiBip = -1
  for (let i = 0; i + W <= pcm.length; i += W) {
    let e = 0
    for (let j = 0; j < W; j++) e += Math.abs(pcm[i + j])
    e /= W
    const t = i / 8000
    if (!dang && e > 0.08 && t - cuoiBip > 0.5) { on.push(t); dang = true } else if (dang && e < 0.02) { dang = false; cuoiBip = t }
  }
  return { onset: on, pcm }
}
/* Moc chop: thoi diem khung dau tien cua moi loat khung "chop". */
function mocChop(pa) {
  const ra = []
  for (let i = 0; i < pa.ma.length; i++) if (pa.ma[i].chop && (i === 0 || !pa.ma[i - 1].chop)) ra.push(pa.pts[i])
  return ra
}
const gan = (a, b, tol) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= tol)
/* Giai ma het file (hinh + tieng), in moi canh bao / loi. `-fps_mode passthrough`: khong de ffmpeg tu doi nhip khung roi than phien "dts khong tang" (loi cua phep do, khong phai cua file). */
/* ☠️ Bo qua DUNG mot canh bao: "non monotonically increasing dts to muxer" cua muxer `null` — chinh FILE GOC cua MediaRecorder
   cung bi (do 06/11: nguon-ma.mp4 bao 3 lan, thoi gian khung lech nhau vai chuc micro giay so voi nhip ffmpeg quy ve); no la
   dac diem cua phep do, khong phai loi file. Moi dong khac (loi giai ma, file cut...) van tinh la loi. */
const giaiMaSach = (f) => spawnSync(FFMPEG, ['-v', 'error', '-i', f, '-fps_mode', 'passthrough', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
  .split(/\r?\n/).filter((d) => d.trim() && !/non monotonically increasing dts to muxer|Last message repeated/.test(d)).join(' | ')
function thuTuHop(f) {
  const b = fs.readFileSync(f), ten = []
  let i = 0
  while (i + 8 <= b.length) { let n = b.readUInt32BE(i); if (n === 1) n = Number(b.readBigUInt64BE(i + 8)); if (n < 8) break; ten.push(b.toString('latin1', i + 4, i + 8)); i += n }
  return ten
}

// ---------- 0. file goc khong doi + khong con file do ----------
kiem('Tao du 3 video thu (co tieng, 4 goc mau, khong tieng)', fs.existsSync(A) && fs.existsSync(B) && fs.existsSync(C))
kiem('FILE GOC khong doi sau MOI lan xuat (md5) · ke ca lan loi / huy', R.job.every((j) => j.md5GocDoiKhong !== false) && md5(A) === R.nguon.md5.A && md5(B) === R.nguon.md5.B && md5(C) === R.nguon.md5.C, R.job.length + ' lan')
kiem('Xuat loi / huy KHONG de lai file .tam hay file dich do', ['e1-cat-dao-nguoc', 'e2-cat-qua-ngan', 'e3-zoom-khong-con-tro', 'e5-nguon-rac', 'x1-huy'].every((t) => { const j = job(t); return j && j.ket.ok === false && !j.conTam && !j.coDich }),
  ['e1-cat-dao-nguoc', 'e2-cat-qua-ngan', 'e3-zoom-khong-con-tro', 'e5-nguon-rac', 'x1-huy'].map((t) => t + ':' + JSON.stringify((job(t) || {}).ket && job(t).ket.loi)).join(' | '))
kiem('Huy giua chung: dang chay luc huy, bao da-huy, het ban sau huy', !!job('x1-huy') && job('x1-huy').dangBanTruocHuy === true && job('x1-huy').dangBanSauHuy === false && job('x1-huy').ket.loi === 'da-huy', JSON.stringify(job('x1-huy') && job('x1-huy').ket))
kiem('Dich da co san -> tu choi va NOI DUNG file cu giu nguyen', job('e4-dich-co-san').ket.ok === false && R.e4NoiDung === 'da co san', job('e4-dich-co-san').ket.loi)
kiem('Hai viec cung luc: viec dau xong, viec thu hai bi tu choi (dang-ban) va khong co file', job('x2-hai-viec').ket.ok === true && job('x2-hai-viec').ket2.ok === false && job('x2-hai-viec').ket2.loi === 'dang-ban' && !job('x2-hai-viec').coDich)
for (const [t, loi] of [['e1-cat-dao-nguoc', /qua ngan/], ['e3-zoom-khong-con-tro', /con tro/], ['e5-nguon-rac', /khong-ho-tro/]]) kiem('Loi ' + t + ' co ly do doc duoc', loi.test(String(job(t).ket.loi)), job(t).ket.loi)

// ---------- hinh: moi file xuat phai giai ma sach, moov truoc mdat, ban goc co 209 khung ----------
const outs = R.job.filter((j) => j.ket && j.ket.ok && j.ten !== 'x1-huy')
for (const j of outs) {
  const f = j.ket.file
  const loi = giaiMaSach(f)
  const hop = thuTuHop(f)
  kiem('[' + j.ten + '] giai ma het file khong loi, moov dung TRUOC mdat (mo ngay khi tai)', loi === '' && hop.indexOf('moov') >= 0 && hop.indexOf('moov') < hop.indexOf('mdat'), loi.slice(0, 120) + ' ' + hop.join(','))
}
{
  // DOI CHUNG: file xuat bi hong (ghi de 3000 byte giua mdat) thi phep "giai ma sach" phai bat duoc
  const hong = path.join(RA, 'hong.mp4'), b = Buffer.from(fs.readFileSync(job('s3-nguyen-doan').ket.file))
  b.fill(0xff, Math.floor(b.length * 0.6), Math.floor(b.length * 0.6) + 3000)
  fs.writeFileSync(hong, b)
  kiem('(DOI CHUNG) file xuat bi ghi de 3000 byte giua thi phep giai ma sach PHAI bao loi', giaiMaSach(hong) !== '', giaiMaSach(hong).slice(0, 100))
  kiem('(DOI CHUNG) file GOC cung qua phep giai ma sach (canh bao dts khong tinh)', giaiMaSach(A) === '', giaiMaSach(A).slice(0, 100))
}
const pG = probe(A)
const mA = phanTichMa(A) // goc
// khung dau tien cua MediaRecorder la khung TRANG (chua ve) = ma 65535: bo qua, tu khung 2 ma phai tang dan
kiem('Video goc thu: ma khung tang dan (thuoc doc ma dung)', mA.ma.every((x, i) => i <= 1 || x.ma >= mA.ma[i - 1].ma) && mA.ma[mA.ma.length - 1].ma > 150, 'ma dau ' + mA.ma[0].ma + ' / ' + mA.ma[1].ma + ' cuoi ' + mA.ma[mA.ma.length - 1].ma)

// ---------- S1: cat 1.5 - 4.5 s, giu tieng ----------
{
  const j = job('s1-cat'), f = j.ket.file, p = probe(f)
  kiem('S1 cat: dai 3,0 s (+-0,08), 1 hinh + 1 tieng AAC 48 kHz, 640x360', Math.abs(p.dur - 3) <= 0.08 && p.soV === 1 && p.soA === 1 && p.a.codec_name === 'aac' && p.v.width === 640 && p.v.height === 360 && Number(p.a.sample_rate) === 48000, 'dur ' + p.dur.toFixed(3))
  const mo = phanTichMa(f)
  const tu = 1.5
  const j0 = mA.pts.findIndex((t, i) => (mA.pts[i + 1] === undefined ? Infinity : mA.pts[i + 1]) > tu) // khung dang hien luc 1,5 s
  let khop = 0
  for (let k = 0; k < mo.ma.length; k++) if (mA.ma[j0 + k] && mA.ma[j0 + k].ma === mo.ma[k].ma) khop++
  kiem('S1 cat: NOI DUNG tung khung = khung goc tu ' + tu + ' s (>= 99% ma khung trung)', mo.ma.length === j.ket.khung && khop / mo.ma.length >= 0.99, khop + '/' + mo.ma.length + ', khung dau goc #' + j0 + ' ma ' + (mA.ma[j0] && mA.ma[j0].ma) + ' vs ' + mo.ma[0].ma)
  kiem('S1 cat: thoi gian khung giu nguyen so voi goc (khung k o ' + 'pts goc - 1,5 s, lech <= 1 ms)', mo.pts.every((t, k) => Math.abs(t - Math.max(0, mA.pts[j0 + k] - tu)) <= 0.001), 'k=0: ' + mo.pts[0] + ' k=cuoi: ' + mo.pts[mo.pts.length - 1].toFixed(3))
  const bA = bip(A), bO = bip(f)
  const trong = bA.onset.filter((t) => t >= tu && t < 4.5).map((t) => t - tu)
  kiem('S1 cat: bip trong doan = bip goc tru 1,5 s (lech <= 30 ms)', trong.length >= 2 && gan(trong, bO.onset, 0.03), 'goc ' + bA.onset.map((t) => t.toFixed(3)) + ' | moi ' + bO.onset.map((t) => t.toFixed(3)))
  // dong bo hinh - tieng: (bip - chop) cua file moi == cua file goc (1 khung ~ 33 ms)
  const cG = mocChop(mA), cO = mocChop(mo)
  const lechG = bA.onset.map((t) => { const c = cG.filter((x) => x <= t + 0.2).pop(); return t - c }), lechO = bO.onset.map((t) => { const c = cO.filter((x) => x <= t + 0.2).pop(); return t - c })
  const lechGTrong = bA.onset.map((t, i) => [t, lechG[i]]).filter(([t]) => t >= tu && t < 4.5).map((x) => x[1])
  kiem('S1 cat: DONG BO tieng - hinh giu nhu goc (lech bip-chop moi vs goc <= 20 ms)', lechGTrong.length >= 2 && lechGTrong.length === lechO.length && lechGTrong.every((x, i) => Math.abs(x - lechO[i]) <= 0.02), 'goc ' + lechGTrong.map((x) => (x * 1000).toFixed(0)) + ' ms · moi ' + lechO.map((x) => (x * 1000).toFixed(0)) + ' ms')
  // DOI CHUNG: tieng lech 100 ms thi phep do phai bat
  kiem('S1 (DOI CHUNG) neu tieng lech 100 ms thi phep do dong bo phai TRUOT', !lechGTrong.every((x, i) => Math.abs(x + 0.1 - lechO[i]) <= 0.02))
}
// ---------- S2: khong tieng ----------
{
  const j = job('s2-cat-khong-tieng'), p = probe(j.ket.file)
  kiem('S2 bo tieng: file moi KHONG co duong tieng, dai 3,0 s', p.soA === 0 && p.soV === 1 && Math.abs(p.dur - 3) <= 0.08, 'soA ' + p.soA + ' dur ' + p.dur.toFixed(3))
  const mo = phanTichMa(j.ket.file)
  let khop = 0
  for (let k = 0; k < mo.ma.length; k++) if (mA.ma[k] && mA.ma[k].ma === mo.ma[k].ma) khop++
  kiem('S2 bo tieng: hinh = goc tu 0 s (>= 99%)', khop / mo.ma.length >= 0.99, khop + '/' + mo.ma.length)
  kiem('S2 file khong con chuoi byte cua duong tieng (mp4a / esds / soun)', !['mp4a', 'esds', 'soun'].some((s) => fs.readFileSync(j.ket.file).includes(Buffer.from(s, 'latin1'))))
}
// ---------- S3: nguyen doan, tieng chep nguyen ----------
{
  const j = job('s3-nguyen-doan'), f = j.ket.file, p = probe(f)
  kiem('S3 nguyen doan: dai bang goc (+-0,1 s), so khung bang goc, co tieng', Math.abs(p.dur - pG.dur) <= 0.1 && j.ket.khung === Number(pG.v.nb_read_packets) && p.soA === 1, 'dur ' + p.dur.toFixed(3) + ' vs ' + pG.dur.toFixed(3) + ', khung ' + j.ket.khung + ' vs ' + pG.v.nb_read_packets)
  const mo = phanTichMa(f)
  kiem('S3 nguyen doan: ma tung khung trung khung goc (>= 99%)', mo.ma.filter((x, k) => x.ma === mA.ma[k].ma).length / mo.ma.length >= 0.99)
  const bA = bip(A), bO = bip(f)
  kiem('S3 nguyen doan: bip trung bip goc (+-30 ms)', gan(bA.onset, bO.onset, 0.03), bO.onset.length + ' bip')
  const n = Math.min(bA.pcm.length, bO.pcm.length)
  let lech = 0
  for (let i = 0; i < n; i++) if (Math.abs(bA.pcm[i] - bO.pcm[i]) > 0.02) lech++
  kiem('S3 nguyen doan: tieng giai ma ra GIONG goc (goi AAC chep nguyen): <= 1% mau lech > 0.02', lech / n <= 0.01 && Math.abs(bA.pcm.length - bO.pcm.length) <= 800, 'lech ' + lech + '/' + n + ', dai ' + bA.pcm.length + ' vs ' + bO.pcm.length)
}
// ---------- S4 / S7: tu phong to ----------
const mauRGB = (g, x, y, w) => { const o = (y * w + x) * 3; return [g[o], g[o + 1], g[o + 2]] }
function ti(g, w, h) { // ty le diem do, vang
  let d = 0, v = 0
  for (let i = 0; i < w * h; i++) {
    const r = g[i * 3], gr = g[i * 3 + 1], b = g[i * 3 + 2]
    if (r > 150 && gr < 90 && b < 90) d++
    else if (r > 150 && gr > 150 && b < 90) v++
  }
  return { d: d / (w * h), v: v / (w * h) }
}
{
  const j = job('s4-zoom'), f = j.ket.file, p = probe(f)
  kiem('S4 zoom: 640x360, dai bang goc, khong tieng', p.v.width === 640 && p.v.height === 360 && p.soA === 0 && Math.abs(p.dur - probe(B).dur) <= 0.1, 'dur ' + p.dur.toFixed(3))
  const fr = khungRaw(f, 160, 90, 'rgb24'), pts = ptsKhung(f)
  const tai = (s) => { const i = pts.findIndex((t) => t >= s); return ti(fr[i], 160, 90) }
  const a0 = tai(0.05), a1 = tai(2.5), a2 = tai(7.0)
  kiem('S4 zoom: dau video CHUA zoom (do ~25%)', a0.d > 0.2 && a0.d < 0.3, 'do ' + a0.d.toFixed(3))
  kiem('S4 zoom: luc con tro dung o goc tren-trai (2,5 s) da zoom (do ~81%)', a1.d > 0.7 && a1.d < 0.92, 'do ' + a1.d.toFixed(3))
  kiem('S4 zoom: luc con tro dung o goc duoi-phai (7,0 s) zoom sang vang (~81%)', a2.v > 0.7 && a2.v < 0.92, 'vang ' + a2.v.toFixed(3))
  const mauTam = (s) => { const i = pts.findIndex((t) => t >= s); return mauRGB(fr[i], 80, 45, 160) }
  const c1 = mauTam(2.5), c2 = mauTam(7.0)
  kiem('S4 zoom: diem GIUA khung 2,5 s la mau DO, 7,0 s la mau VANG (khung bam theo con tro)', c1[0] > 150 && c1[1] < 90 && c2[0] > 150 && c2[1] > 150 && c2[2] < 90, JSON.stringify(c1) + ' ' + JSON.stringify(c2))
  // muot: chuoi zoom thay qua ty le mau chu dao (do truoc 4,4 s, vang sau)
  const f1 = fr.map((g) => { const r = ti(g, 160, 90); return r.d + r.v }) // ty le "do + vang" ~ muc zoom (0,25 -> 0,81 -> ... -> 0,25)
  let d1 = 0, d2 = 0
  for (let i = 1; i < f1.length; i++) d1 = Math.max(d1, Math.abs(f1[i] - f1[i - 1]))
  for (let i = 2; i < f1.length; i++) d2 = Math.max(d2, Math.abs(f1[i] - 2 * f1[i - 1] + f1[i - 2]))
  kiem('S4 zoom: chuyen dong MUOT tren file xuat (buoc/khung <= 0,10 ; gia toc <= 0,06)', d1 <= 0.10 && d2 <= 0.06, 'buoc max ' + d1.toFixed(3) + ' gia toc max ' + d2.toFixed(3))
  // DOI CHUNG: chuoi nhay cap bac thi phai bi bat
  const nhay = f1.map((x, i) => (i < f1.length / 2 ? 0.25 : 0.81))
  let dn = 0
  for (let i = 1; i < nhay.length; i++) dn = Math.max(dn, Math.abs(nhay[i] - nhay[i - 1]))
  kiem('S4 (DOI CHUNG) chuoi nhay bac 0,25 -> 0,81 phai TRUOT thuoc muot', !(dn <= 0.10), 'buoc ' + dn.toFixed(2))
  // so voi cung video khong zoom (s3 la nguon A khac) -> dung bo nguon B khong zoom: tu chinh nguon B
  const g0 = khungRaw(B, 160, 90, 'rgb24'), ptsB = ptsKhung(B)
  const i0 = ptsB.findIndex((t) => t >= 2.5)
  kiem('S4 (DOI CHUNG) cung thoi diem 2,5 s o video GOC (khong zoom) chi do ~25%', ti(g0[i0], 160, 90).d < 0.3, 'do ' + ti(g0[i0], 160, 90).d.toFixed(3))
}
// ---------- S5 / S6: nen + bo goc + bong ----------
{
  const nen = { kieu: 'chuyen', gd: 1, le: 8, bo: 4, bong: 50 }
  const bc = SuaRender.boCuc(640, 360, nen)
  const j = job('s5-nen'), f = j.ket.file
  const fr = khungRaw(f, 640, 360, 'rgb24'), pts = ptsKhung(f)
  const i = pts.findIndex((t) => t >= 1.2), g = fr[i]
  const goc0 = mauRGB(g, 2, 2, 640)
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  kiem('S5 nen: pixel goc tren-trai (2,2) = dau chuyen sac #6a85f1 (+-16)', dist(goc0, [0x6a, 0x85, 0xf1]) <= 16, JSON.stringify(goc0))
  kiem('S5 nen: hop video thu nho vao giua (le 8%): ' + bc.w + 'x' + bc.h + ' tai (' + bc.x + ',' + bc.y + ')', bc.w < 640 && bc.x > 20 && bc.y > 20)
  // ma khung ben trong hop video (doc lai theo hop)
  let khop = 0, tong = 0
  for (let k = 0; k < fr.length; k += 3) {
    let ma = 0
    for (let c = 0; c < 16; c++) {
      const cx = Math.round(bc.x + (32 + 36 * c + 18) * bc.w / 640), cy = Math.round(bc.y + 28 * bc.h / 360)
      let s = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const m = mauRGB(fr[k], cx + dx, cy + dy, 640); s += (m[0] + m[1] + m[2]) / 3 }
      ma = (ma << 1) | (s / 9 > 128 ? 1 : 0)
    }
    tong++
    if (ma === mA.ma[k].ma) khop++
  }
  kiem('S5 nen: ma khung ben trong hop video van doc dung (>= 98%)', khop / tong >= 0.98, khop + '/' + tong)
  const goc = mauRGB(g, bc.x + 1, bc.y + 1, 640)
  kiem('S5 nen: GOC hop video duoc BO TRON (diem sat goc la mau nen, khong phai xam #808080 cua video)', Math.abs(goc[0] - 128) + Math.abs(goc[1] - 128) + Math.abs(goc[2] - 128) > 60, JSON.stringify(goc) + ' r=' + bc.r)
  const duoi = mauRGB(g, 320, bc.y + bc.h + 3, 640), xa = mauRGB(g, 320, bc.y + bc.h + 44, 640)
  const luma = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
  kiem('S5 nen: BONG o ngay duoi hop video toi hon cho xa (it nhat 6 muc sang)', luma(xa) - luma(duoi) >= 6, 'sat ' + luma(duoi).toFixed(0) + ' vs xa ' + luma(xa).toFixed(0))
  kiem('S5 nen: dai 3,0 s, co tieng giu nguyen (3 bip.. >= 2)', Math.abs(probe(f).dur - 3) <= 0.08 && probe(f).soA === 1 && bip(f).onset.length >= 2)
  // DOI CHUNG: neu hop video khong thu nho (le 0) thi pixel (le/2) khong phai mau nen => phep do phai khac
  const g3 = khungRaw(job('s3-nguyen-doan').ket.file, 640, 360, 'rgb24')[30]
  const goc3 = mauRGB(g3, 2, 2, 640)
  kiem('S5 (DOI CHUNG) video KHONG bat nen (S3): cung phep do pixel goc phai TRUOT (goc la xam #808080, khong phai mau nen)', dist(goc3, [0x6a, 0x85, 0xf1]) > 60 && Math.abs(goc3[0] - 128) < 12, JSON.stringify(goc3))
}
{
  const bc = SuaRender.boCuc(640, 360, { kieu: 'mo', le: 6, bo: 3, bong: 40 })
  const j = job('s6-nen-mo'), f = j.ket.file, p = probe(f)
  const fr = khungRaw(f, 640, 360, 'rgb24'), pts = ptsKhung(f)
  let khop = 0, tong = 0
  for (let k = 0; k < fr.length; k += 3) {
    let ma = 0
    for (let c = 0; c < 16; c++) {
      const cx = Math.round(bc.x + (32 + 36 * c + 18) * bc.w / 640), cy = Math.round(bc.y + 28 * bc.h / 360)
      let s = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const m = mauRGB(fr[k], cx + dx, cy + dy, 640); s += (m[0] + m[1] + m[2]) / 3 }
      ma = (ma << 1) | (s / 9 > 128 ? 1 : 0)
    }
    tong++; if (ma === mA.ma[k].ma) khop++
  }
  kiem('S6 nen mo: dai 2,0 s, ma khung trong hop doc dung (>= 98%)', Math.abs(p.dur - 2) <= 0.08 && khop / tong >= 0.98, khop + '/' + tong)
  // nen mo = lay mau tu chinh hinh: vung nen KHONG la mot mau phang
  const g = fr[20]
  const a = mauRGB(g, 5, 5, 640), b = mauRGB(g, 320, 4, 640)
  kiem('S6 nen mo: vung nen co mau (khong den thui / khong trong): luma 40..230', [a, b].every((c) => { const l = (c[0] + c[1] + c[2]) / 3; return l > 40 && l < 230 }), JSON.stringify(a) + JSON.stringify(b))
}
// ---------- S7: zoom + nen + cat ----------
{
  const j = job('s7-zoom-nen-cat'), f = j.ket.file, p = probe(f)
  const bc = SuaRender.boCuc(640, 360, { kieu: 'dac', mau: '#2563eb', le: 6, bo: 3, bong: 40 })
  const fr = khungRaw(f, 640, 360, 'rgb24'), pts = ptsKhung(f)
  const tai = (s) => fr[pts.findIndex((t) => t >= s)]
  const nen = mauRGB(tai(1), 3, 3, 640)
  kiem('S7 ket hop: dai 5,0 s, 640x360, nen mau dac #2563eb o goc', Math.abs(p.dur - 5) <= 0.08 && p.v.width === 640 && Math.abs(nen[0] - 0x25) <= 8 && Math.abs(nen[1] - 0x63) <= 8 && Math.abs(nen[2] - 0xeb) <= 8, JSON.stringify(nen) + ' dur ' + p.dur.toFixed(3))
  function mauMid(g) { return mauRGB(g, Math.round(bc.x + bc.w / 2), Math.round(bc.y + bc.h / 2), 640) }
  const m1 = mauMid(tai(0.6)), m2 = mauMid(tai(4.0))
  kiem('S7 ket hop: sau cat (2,0 s -> 7,0 s) tam hop video o 0,6 s la DO (dwell 1, zoom manh), o 4,0 s la VANG (dwell 2)', m1[0] > 150 && m1[1] < 90 && m2[0] > 150 && m2[1] > 150 && m2[2] < 90, JSON.stringify(m1) + ' ' + JSON.stringify(m2))
}
// ---------- S8 / S9: nguon khong tieng, nguon bi cut ----------
{
  const j = job('s8-nguon-khong-tieng'), p = probe(j.ket.file)
  kiem('S8 nguon KHONG tieng + xin giu tieng: xuat binh thuong, 0 duong tieng, dai 2,5 s', p.soA === 0 && Math.abs(p.dur - 2.5) <= 0.08 && j.ket.tieng === false, 'dur ' + p.dur.toFixed(3))
  const j9 = job('s9-nguon-bi-cut'), p9 = probe(j9.ket.file)
  const goc9 = probe(path.join(RA, 'nguon-cut.mp4'))
  kiem('S9 file goc BI CUT giua chung: xuat duoc phan con lai, hinh + tieng, giai ma sach', p9.soV === 1 && p9.soA === 1 && p9.dur > 2.5 && giaiMaSach(j9.ket.file) === '', 'dur ' + p9.dur.toFixed(2) + ' (goc cut ' + goc9.dur.toFixed(2) + ')')
}

// ---------- A1: ban "Khong tieng" that su khong con du lieu tieng ----------
{
  const dich = path.join(RA, 'a1-khong-tieng.mp4')
  try { fs.unlinkSync(dich) } catch (e) {}
  const goc = probe(A)
  const tieng = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'a', '-show_entries', 'packet=size', '-of', 'json', A], { encoding: 'utf8', maxBuffer: 1 << 26 })).packets.reduce((s, x) => s + Number(x.size), 0)
  const md5Truoc = md5(A)
  const r = taoBanKhongTieng(A, dich)
  kiem('A1 bo tieng: thanh cong', r.ok === true, JSON.stringify(r))
  if (r.ok) {
    const p = probe(dich), b = fs.readFileSync(dich)
    kiem('A1 file moi: 0 duong tieng, 1 hinh, cung so khung', p.soA === 0 && p.soV === 1 && p.v.nb_read_packets === goc.v.nb_read_packets, p.soA + ' tieng, ' + p.v.nb_read_packets + ' khung')
    kiem('A1 NHO HON goc dung phan tieng that (>= 99% byte tieng bien mat): goc ' + fs.statSync(A).size + ' -> ' + b.length + ', tieng ' + tieng, fs.statSync(A).size - b.length >= tieng * 0.99, 'giam ' + (fs.statSync(A).size - b.length))
    kiem('A1 khong con chuoi mo ta tieng trong file (soun / mp4a / esds / smhd)', !['soun', 'mp4a', 'esds', 'smhd'].some((s) => b.includes(Buffer.from(s, 'latin1'))))
    const hash = (f) => spawnSync(FFMPEG, ['-v', 'error', '-i', f, '-an', '-f', 'md5', '-'], { encoding: 'utf8' }).stdout.trim()
    kiem('A1 HINH giong goc tung diem anh (md5 khung da giai ma)', hash(A) === hash(dich) && hash(A).length > 10, hash(A))
    kiem('A1 giai ma sach + moov truoc mdat + khong con mfra', giaiMaSach(dich) === '' && !thuTuHop(dich).includes('mfra'), thuTuHop(dich).slice(0, 4).join(','))
    kiem('A1 file goc khong doi', md5(A) === md5Truoc)
    // DOI CHUNG: chay CHINH CAC phep do tren ma CU (commit ab2a311, chi doi ten hop thanh 'free') phai TRUOT
    try {
      const ma = spawnSync('git', ['show', 'ab2a311:Build and UI Design/AiO Shotandsave/src/mp4-bo-tieng.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24 })
      if (ma.status !== 0 || !ma.stdout) throw new Error('khong lay duoc ma cu: ' + String(ma.stderr).slice(0, 100))
      const fCu = path.join(RA, 'mp4-bo-tieng-cu.cjs'), dCu = path.join(RA, 'a1-cu.mp4')
      fs.writeFileSync(fCu, ma.stdout)
      const rCu = require(fCu).taoBanKhongTieng(A, dCu)
      const bCu = rCu.ok ? fs.readFileSync(dCu) : Buffer.alloc(0)
      const giamDu = fs.statSync(A).size - bCu.length >= tieng * 0.99
      const hetChuoi = !['soun', 'mp4a', 'esds', 'smhd'].some((s) => bCu.includes(Buffer.from(s, 'latin1')))
      kiem('A1 (DOI CHUNG) ma CU: phep do "giam byte tieng" va "het chuoi mo ta tieng" deu TRUOT (bat duoc loi cu)', rCu.ok && !giamDu && !hetChuoi, 'giam ' + (fs.statSync(A).size - bCu.length) + ' byte, con chuoi: ' + !hetChuoi)
    } catch (e) { kiem('A1 (DOI CHUNG) chay duoc ma cu', false, e.message) }
  }
  const rN = taoBanKhongTieng(B, path.join(RA, 'a1-x.mp4'))
  kiem('A1 file von khong co tieng -> tu choi, khong de lai file', rN.ok === false && !fs.existsSync(path.join(RA, 'a1-x.mp4')), JSON.stringify(rN))
  const cut = path.join(RA, 'nguon-cut.mp4')
  const rC = taoBanKhongTieng(cut, path.join(RA, 'a1-cut.mp4'))
  kiem('A1 file bi cut -> tu choi, khong de lai file dich hong', rC.ok === false && !fs.existsSync(path.join(RA, 'a1-cut.mp4')), JSON.stringify(rC))
  const rR = taoBanKhongTieng(path.join(RA, 'rac.mp4'), path.join(RA, 'a1-rac.mp4'))
  kiem('A1 file rac -> tu choi, khong de lai file', rR.ok === false && !fs.existsSync(path.join(RA, 'a1-rac.mp4')), JSON.stringify(rR))
  kiem('A1 nguon trung dich -> tu choi, KHONG xoa nguon', taoBanKhongTieng(A, A).ok === false && fs.existsSync(A))
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
