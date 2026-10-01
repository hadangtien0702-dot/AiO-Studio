'use strict'
/* Do BO TIENG khoi MP4 (src/mp4-bo-tieng.js) — chay: npm run test:botieng
   Dung cac file do `npm run test:quayvideo` vua quay (.selftest/quay-video/). Thuoc NGOAI: ffprobe + ffmpeg (khong
   cung vat lieu voi ma bo tieng). Khong bat cua so. File ra nam trong .selftest/bo-tieng/ (xoa dung ten truoc khi chay). */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFileSync, spawnSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const { taoBanKhongTieng } = require(path.join(ROOT, 'src', 'mp4-bo-tieng.js'))
const VAO = path.join(ROOT, '.selftest', 'quay-video')
const RA = path.join(ROOT, '.selftest', 'bo-tieng')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')

const bin = ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins'].map((p) => path.join(ROOT, '..', p, 'bin', 'win64')).find((d) => fs.existsSync(path.join(d, 'ffprobe.exe')))
if (!bin) { console.log('KHONG co ffprobe/ffmpeg tren may -> khong do duoc (thuoc ngoai bat buoc)'); process.exit(1) }
const soi = (f) => {
  const o = JSON.parse(execFileSync(path.join(bin, 'ffprobe.exe'), ['-v', 'error', '-count_packets', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_read_packets:format=duration', '-of', 'json', f], { encoding: 'utf8' }))
  const v = o.streams.filter((s) => s.codec_type === 'video'), a = o.streams.filter((s) => s.codec_type === 'audio')
  return { v: v[0], soV: v.length, soA: a.length, dur: Number(o.format.duration) }
}
// md5 cua TOAN BO khung hinh da giai ma (ffmpeg framemd5 gop) -> hinh ban khong tieng phai giong ban goc tung diem anh
const md5Hinh = (f) => {
  const r = spawnSync(path.join(bin, 'ffmpeg.exe'), ['-v', 'error', '-i', f, '-an', '-f', 'md5', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 })
  return { md5: (r.stdout || '').trim(), loi: (r.stderr || '').trim() }
}

fs.mkdirSync(RA, { recursive: true })
const MAU = ['do-co-tieng.mp4', 'do-dai-12s.mp4', 'do-dai.mp4'].filter((f) => fs.existsSync(path.join(VAO, f)))
kiem('Co it nhat 2 file mau CO TIENG tu test:quayvideo', MAU.length >= 2, MAU.join(', ') || 'chay npm run test:quayvideo truoc')

for (const ten of MAU) {
  const nguon = path.join(VAO, ten), dich = path.join(RA, ten.replace('.mp4', '-khong-tieng.mp4'))
  try { fs.unlinkSync(dich) } catch (e) {}
  const goc = soi(nguon), md5Goc = md5(nguon)
  const t0 = Date.now()
  const r = taoBanKhongTieng(nguon, dich)
  const ms = Date.now() - t0
  const nhan = '[' + ten + ' ' + (fs.statSync(nguon).size / 1048576).toFixed(1) + ' MB] '
  kiem(nhan + 'bo tieng xong', r.ok === true, JSON.stringify(r) + ', ' + ms + ' ms')
  if (!r.ok) continue
  kiem(nhan + 'file GOC khong bi dung toi (md5 nhu cu)', md5(nguon) === md5Goc)
  kiem(nhan + 'ban goc co 1 hinh + 1 tieng', goc.soV === 1 && goc.soA === 1)
  const moi = soi(dich)
  kiem(nhan + 'ffprobe ban moi: con 1 duong hinh, 0 duong tieng', moi.soV === 1 && moi.soA === 0, 'hinh ' + moi.soV + ', tieng ' + moi.soA)
  kiem(nhan + 'so khung + co hinh + thoi luong giu nguyen', moi.v.nb_read_packets === goc.v.nb_read_packets && moi.v.width === goc.v.width && Math.abs(moi.dur - goc.dur) <= 0.1, moi.v.nb_read_packets + ' khung, ' + moi.dur.toFixed(2) + ' s (goc ' + goc.v.nb_read_packets + ', ' + goc.dur.toFixed(2) + ' s)')
  const a = md5Hinh(nguon), b = md5Hinh(dich)
  kiem(nhan + 'giai ma het file khong loi', b.loi === '', b.loi.slice(0, 160))
  kiem(nhan + 'HINH giong ban goc tung diem anh (md5 khung da giai ma)', !!a.md5 && a.md5 === b.md5, a.md5 + ' vs ' + b.md5)
  kiem(nhan + 'dung luong = ban goc (chi doi ten hop, khong doi vi tri)', fs.statSync(dich).size === fs.statSync(nguon).size)
}

// Doi chung + duong LOI: file khong co tieng / khong phai MP4 / file cut -> tu choi va KHONG de lai file dich
const khongTieng = path.join(VAO, 'do-thuong.mp4')
if (fs.existsSync(khongTieng)) {
  const d = path.join(RA, 'x-khong-co-tieng.mp4')
  const r = taoBanKhongTieng(khongTieng, d)
  kiem('File von KHONG co tieng -> tu choi, khong de lai file', r.ok === false && !fs.existsSync(d), JSON.stringify(r))
}
const rac = path.join(RA, 'rac.bin'), dRac = path.join(RA, 'x-rac.mp4')
fs.writeFileSync(rac, crypto.randomBytes(5000))
const r2 = taoBanKhongTieng(rac, dRac)
kiem('File rac (khong phai MP4) -> tu choi, khong de lai file', r2.ok === false && !fs.existsSync(dRac), JSON.stringify(r2))
if (MAU[0]) {
  const cut = path.join(RA, 'cut.mp4'), dCut = path.join(RA, 'x-cut.mp4')
  const b = fs.readFileSync(path.join(VAO, MAU[0]))
  fs.writeFileSync(cut, b.subarray(0, Math.floor(b.length * 0.6)))
  const r3 = taoBanKhongTieng(cut, dCut)
  kiem('File bi cut giua chung -> tu choi, khong de lai file', r3.ok === false && !fs.existsSync(dCut), JSON.stringify(r3))
  const r4 = taoBanKhongTieng(cut, cut)
  kiem('Nguon trung dich -> tu choi, KHONG xoa file nguon', r4.ok === false && fs.existsSync(cut), JSON.stringify(r4))
  fs.unlinkSync(cut)
}
fs.unlinkSync(rac)

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
