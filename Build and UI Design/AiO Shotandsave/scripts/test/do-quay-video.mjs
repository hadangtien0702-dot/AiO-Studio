/* =========================================================================
   Do QUAY VIDEO vung man hinh (01/10) — chay bang: npm run test:quayvideo
   Chay CHINH bo quay cua app (src/luong-chup.js + src/luong/luong.js) trong mot Electron AN: quay that vai doan
   ngan cua man chinh roi SOI FILE ra (hop MP4 + ffprobe neu may co). Khong bat cua so nao len man hinh, khong
   danh thuc ban dang chay. File thu nam trong .selftest/quay-video/ (gitignore), xoa DICH DANH truoc moi lan chay.
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'quay-video')
const TEN = ['thuong', 'co-tieng', 'ca-man', 'sieu-nho', 'dung-ngay', 'dai-12s']
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }

// Don DICH DANH file cua lan chay truoc (khong glob)
fs.mkdirSync(RA, { recursive: true })
for (const t of TEN) for (const d of ['mp4', 'webm', 'tam']) { try { fs.unlinkSync(path.join(RA, 'do-' + t + '.' + d)) } catch (e) {} }
for (const f of ['ket-qua.json', 'HET-GIO.txt']) { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} }

const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron')
const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE // VS Code / Claude dat =1 -> electron chay nhu Node tran
const chay = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'quay-video-main.cjs')], { env, encoding: 'utf8', timeout: 150000 })
kiem('Electron thu chay xong, ma thoat 0', chay.status === 0, 'status ' + chay.status + (chay.stderr ? ' ' + chay.stderr.slice(0, 200) : ''))

let r = null
try { r = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8')) } catch (e) {}
kiem('Co file ket-qua.json', !!r)
if (r) {
  console.log('Man chinh: ' + JSON.stringify(r.man) + ' · Electron ' + r.electron)
  kiem('Luong chup san sang (cua so an)', r.sanSang === true, (r.nhatKy || []).slice(-2).join(' | '))
  if (r.loi) kiem('Khong co loi nem ra', false, r.loi.slice(0, 200))
}

// ffprobe la thuoc NGOAI (khong cung vat lieu voi bo quay). May khong co thi chi soi hop MP4.
const ungVien = ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins', 'AiO Auto Short Viral']
  .map((p) => path.join(ROOT, '..', p, 'bin', 'win64', 'ffprobe.exe'))
const FFPROBE = ungVien.find((f) => fs.existsSync(f)) || null
console.log(FFPROBE ? 'ffprobe: ' + FFPROBE : 'KHONG co ffprobe tren may -> chi soi hop MP4, khong dem khung')

function hop(file) {
  const b = fs.readFileSync(file); let i = 0; const dem = {}
  while (i + 8 <= b.length) {
    let n = b.readUInt32BE(i); const t = b.toString('latin1', i + 4, i + 8)
    if (n === 1 && i + 16 <= b.length) n = Number(b.readBigUInt64BE(i + 8))
    if (n < 8) break
    dem[t] = (dem[t] || 0) + 1; i += n
  }
  return { dem, hetFile: i === b.length }
}
function soi(file) {
  if (!FFPROBE) return null
  try {
    const o = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-count_packets', '-show_entries',
      'stream=codec_type,codec_name,width,height,nb_read_packets,channels:format=duration', '-of', 'json', file], { encoding: 'utf8' }))
    const v = (o.streams || []).find((s) => s.codec_type === 'video'), a = (o.streams || []).find((s) => s.codec_type === 'audio')
    return { v, a, dur: Number(o.format && o.format.duration) }
  } catch (e) { return { loi: String(e.stderr || e.message).slice(0, 160) } }
}

const sf = r && r.man ? r.man.sf : 1
for (const l of (r && r.luot) || []) {
  const nhan = '[' + l.ten + '] '
  if (!l.batDau || !l.batDau.ok) { kiem(nhan + 'bat dau quay duoc', false, l.loi || JSON.stringify(l.batDau)); continue }
  const b = l.batDau
  kiem(nhan + 'bat dau quay duoc, ra MP4', b.ok && b.duoi === 'mp4', b.mime + ' ' + b.w + 'x' + b.h + ', mo luong ' + b.msMo + ' ms')
  kiem(nhan + 'co video ra la so CHAN va khong vuot tran 2560x1440', b.w % 2 === 0 && b.h % 2 === 0 && b.w <= 2560 && b.h <= 1440, b.w + 'x' + b.h)
  // Co ra phai khop vung xin (DIP x he so man), tru khi bi thu nho vi vuot tran
  const mongW = Math.round(l.rect.w * sf), mongH = Math.round(l.rect.h * sf)
  const tl = Math.min(1, 2560 / mongW, 1440 / mongH)
  kiem(nhan + 'co video khop vung khoanh', Math.abs(b.w - mongW * tl) <= 2 && Math.abs(b.h - mongH * tl) <= 2, 'mong ' + Math.round(mongW * tl) + 'x' + Math.round(mongH * tl) + ', ra ' + b.w + 'x' + b.h)
  kiem(nhan + 'tieng: ' + (l.tieng ? 'xin CO -> co track tieng' : 'xin KHONG -> khong co track tieng'), b.tieng === l.tieng)
  if (l.lan2) kiem(nhan + 'goi quay lan 2 khi dang quay bi TU CHOI', l.lan2.ok === false, JSON.stringify(l.lan2))
  kiem(nhan + 'renderer bao xong, khong loi', !!l.xong && !l.xong.loi, JSON.stringify(l.xong) + ', dung mat ' + l.msDung + ' ms')
  kiem(nhan + 'file co du lieu', !!l.file && l.bytes > 0, l.khuc + ' khuc, ' + Math.round(l.bytes / 1024) + ' KB')
  if (!l.file || !fs.existsSync(l.file)) continue
  kiem(nhan + 'kich thuoc file tren dia = tong byte da ghi', fs.statSync(l.file).size === l.bytes)
  const h = hop(l.file)
  kiem(nhan + 'cau truc MP4 lanh (ftyp + moov + moof, doc het file)', h.dem.ftyp === 1 && h.dem.moov === 1 && h.dem.moof >= 1 && h.hetFile, JSON.stringify(h.dem))
  const s = soi(l.file)
  if (s && !s.loi && s.v) {
    const giay = (l.xong && l.xong.ms ? l.xong.ms : l.xinMs) / 1000
    const fps = Number(s.v.nb_read_packets) / giay
    kiem(nhan + 'ffprobe: h264 dung co', s.v.codec_name === 'h264' && Number(s.v.width) === b.w && Number(s.v.height) === b.h, s.v.codec_name + ' ' + s.v.width + 'x' + s.v.height)
    kiem(nhan + 'ffprobe: thoi luong khop thoi gian quay (lech <= 0,6 s)', Math.abs(s.dur - giay) <= 0.6, 'file ' + s.dur.toFixed(2) + ' s, quay ' + giay.toFixed(2) + ' s')
    if (l.xinMs >= 2000) kiem(nhan + 'ffprobe: 24-31 khung/giay', fps >= 24 && fps <= 31, s.v.nb_read_packets + ' khung / ' + giay.toFixed(2) + ' s = ' + fps.toFixed(1))
    kiem(nhan + 'ffprobe: ' + (l.tieng ? 'co tieng AAC 2 kenh' : 'khong co tieng'), l.tieng ? (!!s.a && s.a.codec_name === 'aac' && Number(s.a.channels) === 2) : !s.a, s.a ? s.a.codec_name + ' ' + s.a.channels + ' kenh' : 'khong tieng')
  } else if (s && s.loi) kiem(nhan + 'ffprobe doc duoc file', false, s.loi)
}
kiem('Du ' + TEN.length + ' luot quay', ((r && r.luot) || []).length === TEN.length, 'co ' + ((r && r.luot) || []).length)

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
