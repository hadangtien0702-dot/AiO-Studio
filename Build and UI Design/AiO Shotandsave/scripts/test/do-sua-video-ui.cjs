'use strict'
/* Do MAN SUA VIDEO (giao dien, 06/11) — chay: npm run test:suavideoui
   Mo CHINH man src/sua-video trong cua so AN, thao tac bang SU KIEN THAT cua Chromium (chuot / phim qua sendInputEvent), doc lai
   giao dien + canvas xem truoc; roi soi file xuat bang ffprobe / ffmpeg (thuoc ngoai). Chay CA tieng Viet lan tieng Anh.
   Dung video thu cua test:suavideo (tu tao neu chua co). Khong hien cua so nao len man hinh. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { console.log('LOI: ' + (e && e.stack)); process.exit(2) })
const fs = require('fs')
const path = require('path')
const { spawnSync, execFileSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const NGUON = path.join(ROOT, '.selftest', 'sua-video')
const i18n = require(path.join(ROOT, 'src', 'i18n.js'))
const kq = []
let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')); if (!ok) dat = false }
const congCu = (ten) => { const r = spawnSync(ten, ['-version']); return !r.error && r.status === 0 ? ten : null }
const FFPROBE = congCu('ffprobe'), FFMPEG = congCu('ffmpeg')
if (!FFPROBE || !FFMPEG) { console.log('KHONG co ffprobe / ffmpeg tren may'); process.exit(1) }

let electron
try { electron = require('electron') } catch (e) { electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron') }
const envGoc = Object.assign({}, process.env)
delete envGoc.ELECTRON_RUN_AS_NODE

// video thu: dung lai cua test:suavideo, thieu thi tao
if (!['nguon-ma.mp4', 'nguon-quad.mp4', 'nguon-quad.contro.json'].every((f) => fs.existsSync(path.join(NGUON, f)))) {
  fs.mkdirSync(NGUON, { recursive: true })
  const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'sua-video-main.cjs')], { env: Object.assign({}, envGoc, { AIO_SUA_RA: NGUON }), encoding: 'utf8', timeout: 400000 })
  kiem('Tao video thu (test:suavideo) khi chua co', r.status === 0 && fs.existsSync(path.join(NGUON, 'nguon-ma.mp4')))
}

const probe = (f) => {
  const o = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', f], { encoding: 'utf8' }))
  return { soV: o.streams.filter((s) => s.codec_type === 'video').length, soA: o.streams.filter((s) => s.codec_type === 'audio').length, w: o.streams[0].width, dur: Number(o.format.duration) }
}
const pixel = (f, giay, x, y) => {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-ss', String(giay), '-i', f, '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 })
  const o = (y * 640 + x) * 3
  return [r.stdout[o], r.stdout[o + 1], r.stdout[o + 2]]
}
const gan = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol)
const so = (lang, x) => (lang === 'en' ? String(x) : String(x).replace('.', ','))

for (const LANG of ['vi', 'en']) {
  const T = (k, p) => { let s = i18n.t(LANG, k); for (const [a, b] of Object.entries(p || {})) s = s.split('{' + a + '}').join(String(b)); return s }
  const RA = path.join(ROOT, '.selftest', 'sua-video-ui-' + LANG)
  fs.mkdirSync(RA, { recursive: true })
  try { fs.unlinkSync(path.join(RA, 'ket-qua.json')) } catch (e) {}
  const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'sua-video-ui-main.cjs')], { env: Object.assign({}, envGoc, { AIO_UI_RA: RA, AIO_UI_NGUON: NGUON, AIO_LANG: LANG }), encoding: 'utf8', timeout: 300000 })
  let K = null
  try { K = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8')) } catch (e) {}
  const L = '[' + LANG + '] '
  kiem(L + 'Electron thu chay xong, co ket qua, khong loi', r.status === 0 && !!K && !K.loi && K.cuoi === 'xong', 'status ' + r.status + (K && K.loi ? ' ' + String(K.loi).slice(0, 250) : ''))
  if (!K || K.loi) continue
  const b = K.buoc

  // --- mo man: video co tieng, chua co file phu con tro ---
  kiem(L + 'A mo man: tieu de, ten file, canvas 640x360, doan gui = ca video (7,0 s), tay nam o 0% va 100%', b.A0.tieuDe === T('sv.tieuDe') && b.A0.ten === 'ui-ma.mp4' && b.A0.cv[0] === 640 && b.A0.cv[1] === 360 && b.A0.nhanDoan === T('sv.doanGui') + ' ' + T('sv.giay', { s: so(LANG, '7.0') }) && b.A0.tayDau === '0%' && b.A0.tayCuoi === '100%', JSON.stringify([b.A0.tieuDe, b.A0.nhanDoan, b.A0.tayDau, b.A0.tayCuoi]))
  kiem(L + 'A: video co tieng -> hien muc Tieng, mac dinh "' + T('sv.coTieng') + '"', b.A0.mucTieng === true && b.A0.tieng[0] === T('sv.coTieng') + '*', b.A0.tieng.join(' | '))
  kiem(L + 'A: video CU khong co file phu con tro -> nut zoom (tru "Tat") bi mo kem LY DO', b.A0.zoom.length === 4 && b.A0.zoom.slice(1).every((x) => /\(khoa\)$/.test(x)) && b.A0.zoom[0].endsWith('*') && b.A0.ghiZoom === T('sv.khongCoConTro'), b.A0.zoom.join(' | '))
  kiem(L + 'A: nut xuat ghi "' + T('sv.xuat') + '", chua khoa', b.A0.nutXuat === T('sv.xuat') && b.A0.nutXuatKhoa === false)

  // --- bo cuc o 3 co cua so + khi bat nen ---
  for (const [k, v] of Object.entries(K.boCuc)) kiem(L + 'Bo cuc ' + k + ': khong tran ngang, khong cai nao ra ngoai cua so, nut khong de len nhau', v.rongTrang <= v.rong && v.ngoai.length === 0 && v.chongNut === 0, JSON.stringify(v))
  const tp = K.tuongPhan
  kiem(L + 'Tuong phan chu (WCAG): chu thuong >= 4,5 ; nut chinh chu trang tren cam dam 13 px >= 3,0 (luat du an)', Object.entries(tp).every(([k, v]) => (k === 'nutXuat' ? v >= 3 : v >= 4.5)), JSON.stringify(tp))

  // --- keo tay nam bang chuot that ---
  const tp1 = parseFloat(b.A1.tayDau), tp2 = parseFloat(b.A2.tayCuoi)
  kiem(L + 'Keo tay dau bang chuot THAT toi 25% (+-2%), tay cuoi van o 100%', Math.abs(tp1 - 25) <= 2 && b.A1.tayCuoi === '100%', b.A1.tayDau + ' / ' + b.A1.tayCuoi + ' · moc ' + b.A1.mocTu)
  kiem(L + 'Keo tay cuoi toi 75% (+-2%): doan gui ~ 3,5 s', Math.abs(tp2 - 75) <= 2 && b.A2.nhanDoan === T('sv.doanGui') + ' ' + T('sv.giay', { s: so(LANG, '3.5') }), b.A2.tayCuoi + ' · ' + b.A2.nhanDoan)
  kiem(L + 'Keo tay dau VUOT qua tay cuoi -> bi kep, doan gui toi thieu 0,5 s (khong dao nguoc)', b.A3.nhanDoan === T('sv.doanGui') + ' ' + T('sv.giay', { s: so(LANG, '0.5') }) && parseFloat(b.A3.tayDau) < parseFloat(b.A3.tayCuoi), b.A3.nhanDoan + ' · ' + b.A3.tayDau + ' < ' + b.A3.tayCuoi)

  // --- nen: canvas xem truoc doi that ---
  kiem(L + 'Nen "Khong": goc canvas la xam video (128); bam "Chuyen sac": goc thanh mau nen #ff9a5a (+-12)', gan(b.nenTruoc, [128, 128, 128], 10) && gan(b.nenSau, [0xff, 0x9a, 0x5a], 12), JSON.stringify(b.nenTruoc) + ' -> ' + JSON.stringify(b.nenSau))
  kiem(L + 'Bat nen: hien 6 o chon chuyen sac + 3 thanh truot; chon o thu 2 -> goc canvas #6a85f1 (+-12)', b.nenPanel.mau && b.nenPanel.soMau === 6 && b.nenPanel.thanh && gan(b.nenGd2, [0x6a, 0x85, 0xf1], 12), JSON.stringify(b.nenPanel) + ' ' + JSON.stringify(b.nenGd2))
  kiem(L + 'Bo cuc khi bat nen o co 980x760: van khong tran, nut khong de nhau', K.boCuc.cungNen.rongTrang <= K.boCuc.cungNen.rong && K.boCuc.cungNen.chongNut === 0 && K.boCuc.cungNen.ngoai.length === 0)
  kiem(L + 'Bam "' + T('sv.khongTieng') + '" -> nut doi trang thai', b.tiengKhong.nut[1] === T('sv.khongTieng') + '*', b.tiengKhong.nut.join(' | '))

  // --- xuat bang nut that ---
  kiem(L + 'Dang xuat: khoa het (nut xuat, cum chon, tay nam), hien nut Huy + thanh tien do + "' + T('sv.dangXuat', { p: 0 }).replace('0', 'N') + '"', b.dangXuat.xuatKhoa && b.dangXuat.huyHien && b.dangXuat.tienDo && b.dangXuat.chonKhoa && b.dangXuat.tayKhoa && /\d+%/.test(b.dangXuat.trangThai), JSON.stringify(b.dangXuat))
  kiem(L + 'Xuat xong: hien ket qua (ten file moi, thoi luong, dung luong), mo khoa lai, nut Huy an', b.ketQua.hien && /^ui-ma-da-sua\.mp4 · /.test(b.ketQua.ten) && b.ketQua.chu === T('sv.daLuu') && !b.ketQua.xuatKhoa && !b.ketQua.huyHien && b.ketQua.keoNhan === T('sv.keoFile'), b.ketQua.ten)
  kiem(L + 'Bam Huy giua chung: bao "' + T('sv.daHuy') + '", mo khoa lai, KHONG co file moi, khong con .tam', b.huyDangXuat === true && b.huy.toast === T('sv.daHuy') && !b.huy.xuatKhoa && !b.huy.huyHien && b.huyFile.truoc === b.huyFile.sau && b.huyFile.tam.length === 0, JSON.stringify(b.huy) + ' ' + JSON.stringify(b.huyFile))

  // --- B: video khong tieng, co file phu con tro ---
  kiem(L + 'B: video khong tieng -> KHONG hien muc Tieng ; co file con tro -> 4 nut zoom bam duoc, ghi chu goi y', b.B0.mucTieng === false && b.B0.zoom.every((x) => !/\(khoa\)/.test(x)) && b.B0.ghiZoom === T('sv.zoomGoiY'), b.B0.zoom.join(' | '))
  kiem(L + 'B: o 2,5 s, KHONG zoom: diem goc tren-phai canvas la XANH LA (goc ti le video)', b.zoomTatDiem[1] > 150 && b.zoomTatDiem[0] < 90, JSON.stringify(b.zoomTatDiem))
  kiem(L + 'B: bam zoom "' + T('sv.zoomVua') + '": cung diem do chuyen DO (khung phong to vao goc tren-trai, noi con tro dung)', b.zoomVuaDiem[0] > 150 && b.zoomVuaDiem[1] < 90, JSON.stringify(b.zoomVuaDiem) + ' · ' + b.B1.zoom.join('|'))
  kiem(L + 'B: bam lai "' + T('sv.zoomTat') + '": diem do tro ve XANH LA (DOI CHUNG: zoom that su dieu khien canvas)', b.zoomLaiTat[1] > 150 && b.zoomLaiTat[0] < 90, JSON.stringify(b.zoomLaiTat))
  kiem(L + 'B: o 7,0 s zoom manh: tam canvas la VANG (con tro dung o goc duoi-phai)', b.zoomManhVang[0] > 150 && b.zoomManhVang[1] > 150 && b.zoomManhVang[2] < 90, JSON.stringify(b.zoomManhVang))

  // --- soi file xuat bang thuoc ngoai ---
  const fA = path.join(RA, 'ui-ma-da-sua.mp4'), fB = path.join(RA, 'ui-quad-da-sua.mp4')
  kiem(L + 'File xuat ton tai canh video goc, KHONG co file nao khac (.tam, ban huy)', fs.existsSync(fA) && fs.existsSync(fB) && b.fileMoi.join(',') === 'ui-ma-da-sua.mp4' && b.fileMoiB.join(',') === 'ui-quad-da-sua.mp4' && fs.readdirSync(RA).every((f) => !/\.tam$/.test(f)), b.fileMoi.join(',') + ' ' + b.fileMoiB.join(','))
  const pa = probe(fA)
  kiem(L + 'A xuat: dai 3,5 s (+-0,1) = doan keo tren thanh, 640x360, KHONG co tieng (da chon Khong tieng)', Math.abs(pa.dur - 3.5) <= 0.1 && pa.w === 640 && pa.soV === 1 && pa.soA === 0, 'dur ' + pa.dur.toFixed(3) + ' soA ' + pa.soA)
  const pb = probe(fB)
  kiem(L + 'B xuat (zoom manh): dai ~ 9,0 s, 640x360', Math.abs(pb.dur - 9) <= 0.1 && pb.w === 640, 'dur ' + pb.dur.toFixed(3))
  const g25 = pixel(fB, 2.5, 320, 180), g70 = pixel(fB, 7.0, 320, 180)
  kiem(L + 'B xuat: o 2,5 s tam khung la DO, o 7,0 s tam khung la VANG (file ra DUNG nhu xem truoc)', g25[0] > 150 && g25[1] < 90 && g70[0] > 150 && g70[1] > 150 && g70[2] < 90, JSON.stringify(g25) + ' ' + JSON.stringify(g70))
  const md5 = (f) => require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex')
  kiem(L + 'FILE GOC khong doi (md5 truoc = sau) sau tat ca thao tac, ke ca huy', JSON.stringify(K.md5Truoc) === JSON.stringify(K.md5Sau), JSON.stringify(K.md5Sau))
}

// ---------- nut "Sua" tren hang video cua Khay video (khay that, offscreen, 2 ngon ngu, 4 be rong) ----------
for (const LANG of ['vi', 'en']) {
  const RA = path.join(ROOT, '.selftest', 'sua-video-khay')
  fs.mkdirSync(RA, { recursive: true })
  try { fs.unlinkSync(path.join(RA, 'khay-sua-' + LANG + '.json')) } catch (e) {}
  const r = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'khay-sua-main.cjs')], { env: Object.assign({}, envGoc, { AIO_KHAY_RA: RA, AIO_KHAY_MAU: path.join(NGUON, 'nguon-ma.mp4'), AIO_LANG: LANG }), encoding: 'utf8', timeout: 90000 })
  let K = null
  try { K = JSON.parse(fs.readFileSync(path.join(RA, 'khay-sua-' + LANG + '.json'), 'utf8')) } catch (e) {}
  const L = '[khay ' + LANG + '] '
  kiem(L + 'Khay video nap duoc, khong loi trang', r.status === 0 && !!K && !K.loiChung && K.loi.length === 0, K && (K.loiChung || K.loi.join('|')))
  if (!K || K.loiChung) continue
  for (const [W, hang] of Object.entries(K.rong)) {
    const mp4 = hang[0], webm = hang[1]
    kiem(L + 'Be rong ' + W + ': hang mp4 co nut Sua BAM DUOC (goi y: ' + i18n.t(LANG, 'sv.nutSuaGoiY').slice(0, 24) + '...), hang webm co nut nhung MO', mp4.co && mp4.khoa === false && mp4.title === i18n.t(LANG, 'sv.nutSuaGoiY') && webm.co && webm.khoa === true, JSON.stringify([mp4.khoa, webm.khoa]))
    const roi = hang.every((h) => h.ngoai.length === 0 && !h.trang)
    kiem(L + 'Be rong ' + W + ': khong nut nao tran khoi hang, trang khong tran ngang', roi, hang.map((h) => 'ngoai=' + h.ngoai.join(',') + ' trang=' + h.trang).join(' | '))
    // cac nut cung mot dong (cung top) cao bang nhau; khi be rong hep co the xuong dong rieng nhung tung dong phai dong deu
    const dong = {}
    mp4.cao.forEach((c, i) => { (dong[mp4.tren[i]] = dong[mp4.tren[i]] || []).push(c) })
    kiem(L + 'Be rong ' + W + ': cac nut tren cung mot dong cao bang nhau (+-1 px)', Object.values(dong).every((cs) => Math.max(...cs) - Math.min(...cs) <= 1), JSON.stringify(dong))
  }
  kiem(L + 'Bam nut Sua that tren hang mp4 -> main nhan "sua:mo" dung id; hang webm khong bam duoc', K.bamMp4.length === 1 && K.bamMp4[0] === 'vid-20261106-120000-001' && K.webmKhoa === true && K.sauWebm.length === 1, JSON.stringify(K.sauWebm))
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
