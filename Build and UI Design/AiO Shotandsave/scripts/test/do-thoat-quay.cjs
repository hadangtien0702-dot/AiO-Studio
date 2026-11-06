'use strict'
/* Do THOAT GIUA LUC QUAY VIDEO + LUONG NEN KET THUC LUC DANG QUAY (06/11, Codex soat loi 2 va 3) — chay: npm run test:thoatquay
   Quay THAT vung giua man chinh bang CHINH bo quay cua app (src/luong-chup.js, cua so AN, khong hien gi len man hinh), roi:
   T1  bam Thoat sau 0,4 s (chua toi giay dau, khuc dau chua gui): ban moi dung + doi -> co file phat duoc; ban CU (commit ab2a311,
       destroy het cua so ngay) -> mat doan quay. Cung phep do chay tren CA HAI: ban cu PHAI truot.
   T2  luong NEN cua man khac ket thuc luc dang quay: ban moi quay du 3,8 s va luong chay lai SAU khi quay xong; ban cu bi huy cua so.
   Them: thoat-an-toan.js voi ban gia (het gio van tra ve). Chua do tren Mac (CHAY_SAN = false o do, nhanh dong luong khi that bai). */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { console.log('LOI: ' + (e && e.stack)); process.exit(2) })
const fs = require('fs')
const path = require('path')
const { spawnSync, execFileSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.join(ROOT, '.selftest', 'thoat-quay')
const kq = []
let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')); if (!ok) dat = false }

const ffprobe = (() => { const r = spawnSync('ffprobe', ['-version']); return !r.error && r.status === 0 ? 'ffprobe' : null })()
const dai = (f) => {
  if (!ffprobe || !fs.existsSync(f) || !fs.statSync(f).size) return 0
  try { return Number(JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', f], { encoding: 'utf8' })).format.duration) || 0 } catch (e) { return 0 }
}

fs.mkdirSync(RA, { recursive: true })
let electron
try { electron = require('electron') } catch (e) { electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron') }
const env = Object.assign({}, process.env, { AIO_RA: RA })
delete env.ELECTRON_RUN_AS_NODE

// ban cu cua luong-chup.js (commit ab2a311) de DOI CHUNG, chep vao src/ (can duong dan tuong doi) roi XOA DUNG TEN sau khi chay
const fCu = path.join(ROOT, 'src', 'luong-chup-cu-tam.js')
const ma = spawnSync('git', ['show', 'ab2a311:Build and UI Design/AiO Shotandsave/src/luong-chup.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24 })
const coBanCu = ma.status === 0 && !!ma.stdout
if (coBanCu) fs.writeFileSync(fCu, ma.stdout)
const ketQua = {}
try {
  for (const bt of coBanCu ? ['moi', 'cu'] : ['moi']) {
    const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'luong-quay-main.cjs')], { env: Object.assign({}, env, { AIO_BIEN_THE: bt }), encoding: 'utf8', timeout: 120000 })
    let j = null
    try { j = JSON.parse(fs.readFileSync(path.join(RA, bt + '-ket-qua.json'), 'utf8')) } catch (e) {}
    ketQua[bt] = j
    kiem('[' + bt + '] Electron thu chay xong, co ket qua, khong loi chung', r.status === 0 && !!j && !j.loi, 'status ' + r.status + (j && j.loi ? ' ' + String(j.loi).slice(0, 200) : ''))
  }
} finally { try { fs.unlinkSync(fCu) } catch (e) {} }
kiem('Lay duoc ban cu cua luong-chup.js tu git de DOI CHUNG', coBanCu)
if (!ffprobe) console.log('KHONG co ffprobe -> khong do duoc do dai file (thuoc ngoai)')

const M = ketQua.moi, C = ketQua.cu
if (M && !M.loi) {
  const d1 = dai(M.t1.file)
  kiem('T1 [moi] Thoat sau 0,4 s: co byte video (khuc cuoi da ve) va onXong goi dung 1 lan', M.t1.bytes > 5000 && M.t1.xong === true, M.t1.bytes + ' byte, ' + M.t1.khuc + ' khuc, loi=' + (M.t1.info && M.t1.info.loi))
  kiem('T1 [moi] thoat-an-toan: dung kip (khong het gio), < 3 s', M.t1Doi && M.t1Doi.dungKip === true && M.t1Doi.ms < 3000, JSON.stringify(M.t1Doi))
  kiem('T1 [moi] file phat duoc, dai ~0,4 s (0,2 - 1,5 s)', d1 > 0.2 && d1 < 1.5, 'dai ' + d1.toFixed(2) + ' s')
  const d2 = dai(M.t2.file)
  kiem('T2 [moi] luong nen ket thuc luc dang quay: van quay du ~3,8 s (>= 3,3 s) khong loi', d2 >= 3.3 && !(M.t2.info && M.t2.info.loi), 'dai ' + d2.toFixed(2) + ' s, loi=' + (M.t2.info && M.t2.info.loi))
  kiem('T2 [moi] cua so luong khong bi huy luc dang quay, sau quay xong luong CHAY LAI (yeu cau bi hoan van duoc thuc hien)', M.t2SongSau === true && M.sanSang3 === true, 'songSau=' + M.t2SongSau + ' sanSang3=' + M.sanSang3)
  kiem('T2 [moi] run-log ghi "hoan toi khi quay xong"', M.nhatKy.some((s) => /hoan toi khi quay xong/.test(s)))
  // T3: quay THAT + con tro THAT -> Sua video chay tren chinh file app quay
  const t3 = M.t3, x = M.t3Xuat, x0 = M.t3XuatKhongZoom
  kiem('T3 [moi] quay that 3,5 s co tieng may: co file + ghi duoc vi tri con tro that (>= 5 mau) + doc lai duoc', !!t3 && t3.xong === true && t3.bytes > 10000 && t3.soMauConTro >= 5 && t3.luuConTro === true && t3.docConTro === true, t3 && (t3.bytes + ' byte, ' + t3.soMauConTro + ' mau con tro, tieng=' + (t3.batDau && t3.batDau.tieng) + ' loi=' + (t3.loi || (t3.info && t3.info.loi))))
  if (t3 && x) {
    kiem('T3 [moi] Sua video tren file QUAY THAT (cat 0,4 - 3,2 s + zoom manh + nen chuyen sac): xuat thanh cong', x.ok === true, JSON.stringify(x).slice(0, 220))
    if (x.ok) {
      const pn = (f) => { const o = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration', '-of', 'json', f], { encoding: 'utf8' })); return { soV: o.streams.filter((s) => s.codec_type === 'video').length, soA: o.streams.filter((s) => s.codec_type === 'audio').length, a: o.streams.find((s) => s.codec_type === 'audio'), w: o.streams[0].width, h: o.streams[0].height, dur: Number(o.format.duration) } }
      const g = pn(t3.file), p = pn(x.file)
      const sach = spawnSync('ffmpeg', ['-v', 'error', '-i', x.file, '-fps_mode', 'passthrough', '-f', 'null', '-'], { encoding: 'utf8' }).stderr.split(/\r?\n/).filter((l) => l.trim() && !/non monotonically increasing dts to muxer|Last message repeated/.test(l)).join(' | ')
      kiem('T3 [moi] file xuat: dai ~2,8 s (+-0,12), cung co khung voi file goc, tieng giu neu goc co tieng, giai ma sach', Math.abs(p.dur - 2.8) <= 0.12 && p.w === g.w && p.h === g.h && p.soV === 1 && p.soA === g.soA && sach === '', 'dur ' + p.dur.toFixed(3) + ' ' + p.w + 'x' + p.h + ' tieng ' + p.soA + '/' + g.soA + ' ' + sach.slice(0, 100))
      // zoom + nen that su doi hinh: khung giua cua ban xuat khac ban xuat khong zoom/khong nen
      const khung = (f, giay) => spawnSync('ffmpeg', ['-v', 'error', '-ss', String(giay), '-i', f, '-frames:v', '1', '-vf', 'scale=96:54', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 24 }).stdout
      const a = khung(x.file, 1.5), b = khung(x0.file, 1.5)
      let lech = 0
      for (let i = 0; i < a.length && i < b.length; i++) lech += Math.abs(a[i] - b[i])
      kiem('T3 [moi] ban co nen + zoom KHAC ban chi cat (DOI CHUNG: khung o 1,5 s lech trung binh >= 3 / 255)', x0.ok === true && a.length === b.length && a.length > 0 && lech / a.length >= 3, 'lech tb ' + (lech / Math.max(1, a.length)).toFixed(1))
    }
  }
}
if (C && !C.loi) {
  const d1c = dai(C.t1.file)
  kiem('T1 (DOI CHUNG ban CU) Thoat sau 0,4 s: MAT doan quay (khong co file phat duoc >= 0,2 s)', d1c < 0.2, C.t1.bytes + ' byte, dai ' + d1c.toFixed(2) + ' s, loi=' + (C.t1.info && C.t1.info.loi))
  const d2c = C.t2 ? dai(C.t2.file) : 0
  kiem('T2 (DOI CHUNG ban CU) luong nen ket thuc luc dang quay: doan quay bi cat som (< 3,3 s) hoac bao loi', !C.t2 || d2c < 3.3 || !!(C.t2.info && C.t2.info.loi), 'dai ' + d2c.toFixed(2) + ' s, loi=' + (C.t2 && C.t2.info && C.t2.info.loi))
}

// ---- thoat-an-toan.js voi ban gia ----
;(async () => {
  const { doiQuayXong } = require(path.join(ROOT, 'src', 'thoat-an-toan.js'))
  let quayDang = true, daDung = 0
  const t0 = Date.now()
  const r1 = await doiQuayXong({ dangQuay: () => quayDang, dung: () => { daDung++; setTimeout(() => { quayDang = false }, 350) }, toiDaMs: 3000, nhip: 20 })
  kiem('thoat-an-toan: dang quay -> goi dung 1 lan, doi toi khi xong (~350 ms), dungKip', r1.dungKip === true && r1.coQuay === true && daDung === 1 && r1.ms >= 300 && r1.ms < 1500, JSON.stringify(r1))
  const r2 = await doiQuayXong({ dangQuay: () => false, dung: () => { daDung++ }, toiDaMs: 3000 })
  kiem('thoat-an-toan: KHONG quay -> khong goi dung, tra ngay', r2.coQuay === false && daDung === 1 && r2.ms === 0, JSON.stringify(r2))
  const r3 = await doiQuayXong({ dangQuay: () => true, dung: () => {}, toiDaMs: 400, nhip: 20 })
  kiem('thoat-an-toan: renderer treo -> het gio van tra ve (dungKip = false, ~400 ms), khong ket mai', r3.dungKip === false && r3.ms >= 380 && r3.ms < 1500, JSON.stringify(r3))
  const r4 = await doiQuayXong({ dangQuay: () => true, dung: () => { throw new Error('hong') }, toiDaMs: 200, nhip: 20 })
  kiem('thoat-an-toan: dung() nem loi -> khong lam hong viec thoat', r4.dungKip === false && r4.coQuay === true)

  console.log('\n' + '='.repeat(60))
  console.log(kq.join('\n'))
  console.log('='.repeat(60))
  console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
  if (!dat) process.exit(1)
})()
