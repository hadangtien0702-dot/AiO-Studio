'use strict'
/* =========================================================================
   Do QUAY VIDEO: MICRO + HIEN CU BAM CHUOT / PHIM (05/11) — chay: npm run test:quaymic
   Mot file, hai vai: chay bang node = NGUOI DO (soi file bang ffmpeg/ffprobe); chay trong Electron = QUAY.
   AN HOAN TOAN: khong cua so nao hien, khong phat tieng ra loa, khong dong vao chuot / phim cua nguoi dung.
   - MICRO GIA: nguon am tao NGAY TRONG TRANG luong (opts.micGia): bip 1 kHz theo mau KHONG deu, lap moi 2,4 s, di vao
     dung duong tron / tre / ghi nhu micro that. Cong tac Chromium --use-fake-device-for-media-stream khong dung duoc (no lam
     getDisplayMedia ra man gia 96x96). => getUserMedia + thiet bi that + quyen micro cua macOS KHONG duoc do o day.
   - SU KIEN CHUOT / PHIM GIA: src/nhap-quay.js co nguon gia (gia()), bai do bom vao dung duong ma hook that se bom,
     (phim di qua bo loc rieng tu y het). Hook that (uiohook-napi) KHONG duoc chay o day.
   - DOC NOI DUNG TUNG KHUNG: vong tron cam tim bang diem anh (R/G/B), the phim do bang vung diem anh thay doi o goc
     duoi-trai; DOI CHUNG: luot tat chuot nhung bat phim, luot khong micro, mau mic SAI, phim thuong 'A'.
   Thuoc ngoai: ffmpeg + ffprobe tren PATH (hoac kho chung cua AiO). Khong co thi bao khong do duoc.
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const GOC = path.resolve(__dirname, '..', '..')
const RA = path.join(GOC, '.selftest', 'quay-mic')
const SR = 48000, CHU_KY = 2.4
process.stdout.on('error', () => {}); process.stderr.on('error', () => {}) // dong ong dau ra khong duoc bat hop loi Electron len man
// mau bip (giay): [bat dau, ket thuc] trong 1 chu ky 2,4 s — KHONG deu, de tuong quan co the phan biet duoc do tre
const MAU = [[0.0, 0.3], [0.6, 0.8], [1.2, 1.7], [2.0, 2.1]]
const MAU_SAI = [[0.0, 0.1], [0.4, 0.9], [1.1, 1.2], [1.6, 2.2]] // cung do day xung, khac mau: dung lam DOI CHUNG

/* ───────────────────────── VAI QUAY (chay trong Electron) ───────────────────────── */
if (process.versions.electron) {
  const { app, screen } = require('electron')
  fs.mkdirSync(RA, { recursive: true })
  process.on('uncaughtException', (e) => { try { console.error(e) } catch (x) {} app.exit(1) })
  app.setName('aio-do-quay-mic')
  app.setPath('userData', path.join(GOC, '.selftest', 'userData-quay-mic'))
  const luong = require(path.join(GOC, 'src', 'luong-chup.js'))
  const cho = (ms) => new Promise((r) => setTimeout(r, ms))
  const nhatKy = []

  async function mot(display, ten, opts, ms, suKien) {
    const file = path.join(RA, 'do-' + ten + '.tam')
    const o = { ten, tieng: !!opts.tieng, mic: !!opts.mic, hienNhap: opts.hienNhap || null, file: null, bytes: 0, suKien: [] }
    const fd = fs.openSync(file, 'w')
    let xong
    const doiXong = new Promise((r) => { xong = r })
    const w = 640, h = 360
    const rect = { x: Math.round((display.bounds.width - w) / 2), y: Math.round((display.bounds.height - h) / 2), w, h }
    o.rect = rect
    const r = await luong.batDauQuay(display, rect, Object.assign({}, opts, { onKhuc: (b) => { fs.writeSync(fd, b); o.bytes += b.length }, onXong: (i) => xong(i) }))
    o.batDau = r
    if (!r.ok) { fs.closeSync(fd); o.loi = r.loi; return o }
    // bom su kien gia theo gio TUONG DOI so voi luc bat dau quay (r.t0Epoch)
    for (const sk of suKien || []) {
      setTimeout(() => {
        const t = Date.now()
        // toa do DIP toan cuc cua man hinh = goc man + goc vung + phan so * kich thuoc vung
        const e = sk.loai === 'chuot'
          ? { loai: 'chuot', x: display.bounds.x + rect.x + sk.fx * rect.w, y: display.bounds.y + rect.y + sk.fy * rect.h, t }
          : { loai: 'phim', mod: sk.mod, ten: sk.ten, t }
        const hien = luong.nhapQuay.gia(e)
        o.suKien.push(Object.assign({ batDauSau: t - r.t0Epoch, hien }, sk))
      }, Math.max(0, r.t0Epoch + sk.sau - Date.now()))
    }
    await cho(ms)
    luong.dungQuay()
    o.xong = await doiXong
    fs.closeSync(fd)
    const dich = path.join(RA, 'do-' + ten + '.' + (r.duoi || 'mp4'))
    fs.renameSync(file, dich); o.file = dich
    return o
  }

  app.whenReady().then(async () => {
    const kq = { electron: process.versions.electron, luot: [], nhatKy }
    try {
      const d = screen.getPrimaryDisplay()
      kq.man = { w: d.bounds.width, h: d.bounds.height, sf: d.scaleFactor }
      luong.nhapQuay.datNguonGia(true) // KHONG nap hook that
      await luong.khoiDong({ ghiLog: (m) => nhatKy.push(m) })
      const han = Date.now() + 15000
      while (!luong.sanSang() && Date.now() < han) await cho(100)
      kq.sanSang = luong.sanSang()
      if (kq.sanSang) {
        const SK = [
          { loai: 'chuot', sau: 1000, fx: 0.25, fy: 0.35 },
          { loai: 'phim', sau: 1800, mod: { ctrl: true }, ten: 'C' },                    // -> "Ctrl + C"
          { loai: 'chuot', sau: 2300, fx: 1.4, fy: 0.5 },                                // ngoai vung: khong ve
          { loai: 'phim', sau: 3500, mod: {}, ten: 'A' },                               // phim thuong: KHONG hien (rieng tu)
          { loai: 'chuot', sau: 3900, fx: 0.7, fy: 0.6 },
          { loai: 'phim', sau: 4800, mod: { ctrl: true, shift: true }, ten: 'Enter' },   // -> "Ctrl + Shift + Enter"
        ]
        const MIC = { micXuLy: false, micGia: { tanSo: 1000, chuKy: CHU_KY, mau: MAU } } // tat khu on / tu chinh am luong de so tin hieu bip nguyen ven
        kq.luot.push(await mot(d, 'mic', Object.assign({ tieng: false, mic: true }, MIC), 5000))
        kq.luot.push(await mot(d, 'khong-mic', { tieng: false, mic: false }, 3000))
        kq.luot.push(await mot(d, 'mic-may', Object.assign({ tieng: true, mic: true }, MIC), 5000))
        kq.luot.push(await mot(d, 'may', { tieng: true, mic: false }, 5000))
        kq.luot.push(await mot(d, 'nhap', { tieng: false, mic: false, hienNhap: { chuot: true, phim: true } }, 6800, SK))
        kq.luot.push(await mot(d, 'nhap-chi-phim', { tieng: false, mic: false, hienNhap: { chuot: false, phim: true } }, 6800, SK))
        kq.luot.push(await mot(d, 'nhap-tat', { tieng: false, mic: false }, 3500, SK))
      }
    } catch (e) { kq.loi = String(e && e.stack || e) }
    fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 1))
    app.exit(0)
  })
  setTimeout(() => { try { fs.writeFileSync(path.join(RA, 'HET-GIO.txt'), 'qua han') } catch (e) {} app.exit(2) }, 150000)
  return
}

/* ───────────────────────── VAI DO (chay bang node) ───────────────────────── */
const { spawnSync, execFileSync } = require('child_process')
const kq = []
let dat = true
const kiem = (ten, ok, ct = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')); if (!ok) dat = false }

const kho = process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support', 'AiO-Studio', 'bin', 'mac') : null
const tim = (ten) => { // ffmpeg / ffprobe: PATH truoc, roi kho chung
  const exe = ten + (process.platform === 'win32' ? '.exe' : '')
  try { execFileSync(exe, ['-version'], { stdio: 'ignore' }); return exe } catch (e) {}
  if (kho && fs.existsSync(path.join(kho, exe))) return path.join(kho, exe)
  return null
}
const FFMPEG = tim('ffmpeg'), FFPROBE = tim('ffprobe')
if (!FFMPEG || !FFPROBE) { console.log('KHONG co ffmpeg / ffprobe -> khong do duoc'); process.exit(1) }

function chay() {
  fs.mkdirSync(RA, { recursive: true })
  for (const f of fs.readdirSync(RA)) if (/^do-.*\.(mp4|webm|tam)$/.test(f) || f === 'ket-qua.json' || f === 'HET-GIO.txt') { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} } // file do chinh bai nay sinh ra, ten co dinh
  const electron = require('electron')
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
  const c = spawnSync(electron, [__filename], { env, encoding: 'utf8', timeout: 170000 })
  kiem('Electron do chay xong, ma thoat 0', c.status === 0, 'status ' + c.status + (c.stderr ? ' ' + c.stderr.slice(0, 150) : ''))
  try { return JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8')) } catch (e) { return null }
}

const probe = (f) => JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,channels,start_time,duration:format=duration', '-of', 'json', f], { encoding: 'utf8' }))
function envelope(f) { // RMS moi 10 ms cua rai tieng (mono 16 kHz)
  const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', f, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 })
  const n = Math.floor(raw.length / 4), W = 160, e = []
  for (let i = 0; i + W <= n; i += W) { let s = 0; for (let j = 0; j < W; j++) { const v = raw.readFloatLE((i + j) * 4); s += v * v } e.push(Math.sqrt(s / W)) }
  return e
}
function mauEnv(mau) { // envelope mong doi (10 ms) cua 1 chu ky
  const n = Math.round(CHU_KY * 100), e = new Array(n).fill(0)
  for (const [a, b] of mau) for (let i = Math.round(a * 100); i < Math.round(b * 100); i++) e[i] = 1
  return e
}
function tuongQuan(env, mau) { // Pearson cao nhat khi truot mau (lap) theo moi do tre trong 1 chu ky; bo 0,5 s dau
  const x = env.slice(50), m = mauEnv(mau), L = m.length
  let tot = -1, lag = 0
  const mx = x.reduce((a, b) => a + b, 0) / x.length
  for (let d = 0; d < L; d++) {
    const y = x.map((_, i) => m[(i + d) % L])
    const my = y.reduce((a, b) => a + b, 0) / y.length
    let sxy = 0, sxx = 0, syy = 0
    for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2 }
    const r = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0
    if (r > tot) { tot = r; lag = d }
  }
  return { r: tot, lagMs: lag * 10 }
}

const RW = 640, RH = 360
function khungHinh(f) { // moi khung scale ve 640x360 RGB + gio (giay) cua tung khung
  const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', f, '-an', '-fps_mode', 'passthrough', '-vf', 'scale=' + RW + ':' + RH, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] })
  const pts = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', f], { encoding: 'utf8', maxBuffer: 1 << 26 })
    .split(/\r?\n/).filter((x) => x.trim()).map(Number).filter((x) => isFinite(x)).sort((a, b) => a - b)
  const N = RW * RH * 3, ds = []
  for (let o = 0; o + N <= raw.length; o += N) ds.push(raw.subarray(o, o + N))
  return { ds, pts: pts.slice(0, ds.length) }
}
const laCam = (r, g, b) => r > 200 && g > 70 && g < 150 && b < 100 && r - b > 140
function demCam(fr, cx, cy, ban) { // diem cam trong o vuong quanh (cx, cy)
  let n = 0, sx = 0, sy = 0
  for (let y = Math.max(0, cy - ban); y < Math.min(RH, cy + ban); y++) for (let x = Math.max(0, cx - ban); x < Math.min(RW, cx + ban); x++) {
    const i = (y * RW + x) * 3
    if (laCam(fr[i], fr[i + 1], fr[i + 2])) { n++; sx += x; sy += y }
  }
  return { n, x: n ? sx / n : 0, y: n ? sy / n : 0 }
}
function khacGoc(fr, goc, x0, y0, x1, y1) { // hop bao cac diem thay doi so voi khung goc trong 1 vung
  let n = 0, mnx = 1e9, mxx = -1, mny = 1e9, mxy = -1
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * RW + x) * 3
    if (Math.abs(fr[i] - goc[i]) + Math.abs(fr[i + 1] - goc[i + 1]) + Math.abs(fr[i + 2] - goc[i + 2]) > 90) { n++; if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y }
  }
  return { n, rong: mxx >= 0 ? mxx - mnx + 1 : 0 }
}
const gan = (pts, t) => { let b = 0; for (let i = 0; i < pts.length; i++) if (Math.abs(pts[i] - t) < Math.abs(pts[b] - t)) b = i; return b }

function phanTichNhap(l, tenSK) { // tra { vong: [{...}], pill: [{...}] } doc tu NOI DUNG khung
  const { ds, pts } = khungHinh(l.file)
  const t0 = l.batDau.t0Epoch, tre = l.batDau.treHinh
  const goc = ds[gan(pts, 0.5)] // khung "man sach" truoc moi su kien (su kien dau o 1,0 s + tre)
  const ketQua = { khung: ds.length, vong: [], pill: [], tre }
  const chuot = l.suKien.filter((s) => s.loai === 'chuot' && s.fx <= 1)
  for (const s of chuot) {
    const cx = Math.round(s.fx * RW), cy = Math.round(s.fy * RH)
    const nen = demCam(goc, cx, cy, 70).n
    const dem = ds.map((f) => demCam(f, cx, cy, 70))
    // khung dau tien (trong cua so [su kien - 0,3 s, su kien + 1,2 s]) co so diem cam vuot nen ro ret
    const tMong = (s.batDauSau + tre) / 1000
    let dau = -1
    for (let i = 0; i < ds.length; i++) if (pts[i] >= tMong - 0.4 && pts[i] <= tMong + 1.2 && dem[i].n > nen + 40) { dau = i; break }
    const o = { fx: s.fx, fy: s.fy, nen, tMong: +tMong.toFixed(3), tThay: dau >= 0 ? +pts[dau].toFixed(3) : null }
    if (dau >= 0) { o.cuc = Math.max(...dem.slice(dau, dau + 15).map((d) => d.n)); const t = dem[Math.min(ds.length - 1, dau + 2)]; o.lechTam = +Math.hypot(t.x - cx, t.y - cy).toFixed(1) }
    // cuoi cua so (> 0,9 s sau khi thay) vong phai tat
    const cuoi = ds.findIndex((_, i) => pts[i] >= (o.tThay || tMong) + 0.9)
    o.sauTat = cuoi >= 0 ? dem[cuoi].n <= nen + 40 : null
    ketQua.vong.push(o)
  }
  // the phim: vung goc duoi-trai 0..330 x 290..350
  const phimSK = l.suKien.filter((s) => s.loai === 'phim')
  for (const s of phimSK) {
    const tMong = (s.batDauSau + tre) / 1000
    // khung goc rieng cho the phim: khung ngay truoc su kien (0,3 s) neu khong co vong tron dang toa o day (vong nam xa goc)
    const gocP = goc
    const i1 = gan(pts, tMong + 0.35), i2 = gan(pts, tMong + 1.0) // giua luc the hien
    const a = khacGoc(ds[i1], gocP, 0, 290, 400, 350)
    ketQua.pill.push({ ten: s.ten, mod: s.hien ? Object.keys(s.mod || {}).join('+') : '', hien: s.hien, tMong: +tMong.toFixed(3), diem: a.n, rong: a.rong, diem2: khacGoc(ds[i2], gocP, 0, 290, 400, 350).n })
  }
  // sau khi the cuoi het han (> 1,7 s) phai sach
  return ketQua
}

;(function chinh() {
  const r = chay()
  kiem('Co file ket-qua.json', !!r)
  if (!r) return
  kiem('Luong chup san sang (cua so an)', r.sanSang === true, (r.nhatKy || []).slice(-2).join(' | '))
  if (r.loi) { kiem('Khong co loi nem ra', false, r.loi.slice(0, 200)); return }
  const L = (ten) => r.luot.find((x) => x.ten === ten)
  console.log('Man chinh: ' + JSON.stringify(r.man) + ' · Electron ' + r.electron)
  for (const l of r.luot) {
    kiem('[' + l.ten + '] quay duoc, ra MP4, khong loi', !!l.batDau && l.batDau.ok && l.batDau.duoi === 'mp4' && !!l.xong && !l.xong.loi && !!l.file && l.bytes > 0, l.loi || JSON.stringify(l.xong).slice(0, 120))
  }
  const phi = {}
  for (const l of r.luot) if (l.file && fs.existsSync(l.file)) phi[l.ten] = probe(l.file)
  const rai = (p, kieu) => ((p && p.streams) || []).filter((s) => s.codec_type === kieu)

  // ── (a) MICRO ──
  const mic = L('mic'), khong = L('khong-mic'), micMay = L('mic-may'), may = L('may')
  if (mic && phi.mic) {
    kiem('[mic] micro nhan duoc (khong loi quyen)', mic.batDau.mic === true && !mic.batDau.micLoi, 'micLoi=' + mic.batDau.micLoi)
    kiem('[mic] file CO rai tieng (AAC)', rai(phi.mic, 'audio').length === 1 && rai(phi.mic, 'audio')[0].codec_name === 'aac', JSON.stringify(rai(phi.mic, 'audio')[0] || null))
    const env = envelope(mic.file)
    const dung = tuongQuan(env, MAU), sai = tuongQuan(env, MAU_SAI)
    kiem('[mic] tieng trong file TUONG QUAN voi nguon am gia (r >= 0,8)', dung.r >= 0.8, 'r=' + dung.r.toFixed(3) + ', do tre ' + dung.lagMs + ' ms')
    kiem('[mic] DOI CHUNG: so voi mau SAI tuong quan thap hon ro ret (cach >= 0,25)', dung.r - sai.r >= 0.25, 'mau dung ' + dung.r.toFixed(3) + ' · mau sai ' + sai.r.toFixed(3))
    const e = env.slice(50); const dinh = Math.max(...e), yen = e.filter((v) => v < 0.02).length / e.length
    kiem('[mic] co khoang LANG that (bip khong phu kin) va bien do thay duoc', yen > 0.25 && dinh > 0.05, 'dinh ' + dinh.toFixed(3) + ', ti le yen ' + yen.toFixed(2))
    const a = rai(phi.mic, 'audio')[0], v = rai(phi.mic, 'video')[0]
    kiem('[mic] thoi luong tieng khop thoi luong hinh (<= 150 ms)', Math.abs(Number(a.duration) - Number(v.duration)) <= 0.15, 'tieng ' + a.duration + ' s · hinh ' + v.duration + ' s')
  }
  if (khong && phi['khong-mic']) kiem('[khong-mic] DOI CHUNG: tat micro + khong tieng may -> KHONG co rai tieng', rai(phi['khong-mic'], 'audio').length === 0)
  if (micMay && phi['mic-may']) {
    kiem('[mic-may] tron tieng may + micro -> van MOT rai tieng', rai(phi['mic-may'], 'audio').length === 1)
    if (process.platform === 'win32') {
      const dung = tuongQuan(envelope(micMay.file), MAU)
      kiem('[mic-may] bip micro van thay duoc trong ban tron (r >= 0,5; tieng may that cua nguoi dung co the xen vao)', dung.r >= 0.5, 'r=' + dung.r.toFixed(3))
    }
  }
  // dong bo: rai tieng so voi rai hinh trong file — mic KHONG te hon duong tieng may cu (cung DelayNode)
  if (mic && may && phi.mic && phi.may) {
    const lech = (p) => Number(rai(p, 'audio')[0].start_time) - Number(rai(p, 'video')[0].start_time)
    const dm = lech(phi.mic) * 1000, dy = lech(phi.may) * 1000
    kiem('[dong bo] lech goc rai tieng - rai hinh cua file mic KHONG te hon duong tieng may cu qua 80 ms', Math.abs(dm) - Math.abs(dy) <= 80, 'mic ' + Math.round(dm) + ' ms · may ' + Math.round(dy) + ' ms · treTieng ' + mic.xong.treTieng + ' ms')
  }
  if (mic) kiem('[dong bo] mic di qua DelayNode cung muc voi hinh (treTieng = ' + mic.xong.treTieng + ' ms, tre hinh ' + mic.batDau.treHinh + ' ms)', mic.xong.treTieng === mic.batDau.treHinh)

  // ── (b) CHUOT / PHIM VE VAO KHUNG HINH ──
  const nhap = L('nhap'), chiPhim = L('nhap-chi-phim'), tat = L('nhap-tat')
  if (nhap && nhap.file) {
    kiem('[nhap] su kien gia da toi bo ghi (hien=true cho chuot va phim co lenh; phim thuong A = false)',
      nhap.suKien.length === 6 && nhap.suKien.filter((s) => s.hien === false).length === 1 && nhap.suKien.find((s) => s.ten === 'A').hien === false, nhap.suKien.map((s) => (s.ten || 'chuot') + ':' + s.hien).join(' '))
    kiem('[nhap] nguon nghe bat duoc (gia)', nhap.batDau.nhap && nhap.batDau.nhap.ok && nhap.batDau.nhap.nguon === 'gia', JSON.stringify(nhap.batDau.nhap))
    const p = phanTichNhap(nhap)
    console.log('  [nhap] ' + JSON.stringify(p))
    p.vong.forEach((v, i) => {
      kiem('[nhap] vong tron ' + (i + 1) + ' XUAT HIEN trong khung hinh', v.tThay !== null, 'cuc ' + v.cuc + ' diem cam, nen ' + v.nen)
      if (v.tThay !== null) {
        kiem('[nhap] vong tron ' + (i + 1) + ' dung CHO bam (lech tam <= 12 px tren khung 640x360)', v.lechTam <= 12, v.lechTam + ' px')
        kiem('[nhap] vong tron ' + (i + 1) + ' xuat hien DUNG LUC (<= 100 ms so voi gio bam + tre hinh)', Math.abs(v.tThay - v.tMong) <= 0.1, 'thay ' + v.tThay + ' s · mong ' + v.tMong + ' s')
        kiem('[nhap] vong tron ' + (i + 1) + ' TAT sau ~0,5 s (khong dinh vinh vien)', v.sauTat === true)
      }
    })
    if (p.vong.length === 2 && p.vong.every((v) => v.tThay !== null)) {
      const dGio = (p.vong[1].tThay - p.vong[0].tThay) * 1000, dSK = (nhap.suKien.filter((s) => s.loai === 'chuot' && s.fx <= 1)[1].batDauSau - nhap.suKien.filter((s) => s.loai === 'chuot' && s.fx <= 1)[0].batDauSau)
      kiem('[nhap] khoang cach giua 2 vong tron trong FILE khop khoang cach 2 lan bam (<= 80 ms)', Math.abs(dGio - dSK) <= 80, 'file ' + Math.round(dGio) + ' ms · bam ' + Math.round(dSK) + ' ms')
      console.log('  (do tre tuyet doi: vong 1 hien tre ' + Math.round((p.vong[0].tThay - p.vong[0].tMong) * 1000) + ' ms so voi mong doi)')
    }
    const pc = p.pill.find((x) => x.ten === 'C'), pe = p.pill.find((x) => x.ten === 'Enter'), pa = p.pill.find((x) => x.ten === 'A')
    kiem('[nhap] the "Ctrl + C" HIEN o goc duoi-trai (>= 150 diem thay doi)', pc.diem >= 150, pc.diem + ' diem, rong ' + pc.rong + ' px')
    kiem('[nhap] the "Ctrl + Shift + Enter" HIEN va RONG HON the "Ctrl + C" (>= 1,3 lan)', pe.diem >= 150 && pe.rong >= 1.3 * pc.rong, 'rong ' + pe.rong + ' px so voi ' + pc.rong + ' px')
    kiem('[nhap] RIENG TU: phim thuong "A" KHONG ve gi len khung (< 60 diem thay doi)', pa.diem < 60, pa.diem + ' diem')
  }
  if (chiPhim && chiPhim.file) {
    const p = phanTichNhap(chiPhim)
    kiem('[nhap-chi-phim] DOI CHUNG: tat chuot -> khong vong tron nao (0/2)', p.vong.every((v) => v.tThay === null), JSON.stringify(p.vong.map((v) => v.tThay)))
    const pc = p.pill.find((x) => x.ten === 'C')
    kiem('[nhap-chi-phim] bat phim -> the "Ctrl + C" van hien', pc.diem >= 150, pc.diem + ' diem')
  }
  if (tat && tat.file) {
    const p = phanTichNhap(tat)
    kiem('[nhap-tat] DOI CHUNG: tat ca tuy chon -> khong vong tron, khong the phim (cung su kien gia)', p.vong.every((v) => v.tThay === null) && p.pill.every((x) => x.diem < 60), 'vong ' + JSON.stringify(p.vong.map((v) => v.tThay)) + ' · the ' + JSON.stringify(p.pill.map((x) => x.diem)))
    kiem('[nhap-tat] su kien gia KHONG toi duoc bo ghi (khong ai nghe)', tat.suKien.every((s) => s.hien === false), tat.suKien.map((s) => s.hien).join(','))
  }
  // vong tron phai khong lam hong nhip hinh: so khung / giay
  if (nhap && nhap.file && phi.nhap) {
    const v = rai(phi.nhap, 'video')[0]
    const kh = khungHinh(nhap.file).ds.length, giay = Number(v.duration)
    kiem('[nhap] nhip khung hinh khi co lop phu >= 24 khung/giay (khong te di)', kh / giay >= 24, (kh / giay).toFixed(1) + ' khung/giay')
  }
})()

console.log(kq.join('\n'))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
