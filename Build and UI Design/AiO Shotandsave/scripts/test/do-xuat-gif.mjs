/* =========================================================================
   Do XUAT GIF tu Khay video (06/10) — chay bang: npm run test:xuatgif
   Hai phan, ca hai chay trong Electron AN (khong bat cua so, khong danh thuc ban dang cai):
   A. BO MAY (scripts/test/xuat-gif-main.cjs): tu quay video mau co SO DEM nhi phan doi moi 200 ms + nua man dung yen,
      xuat GIF bang src/xuat-gif.js, roi DOC LAI file bang bo giai ma GIF cua Chromium (ImageDecoder): doc so dem tren
      TUNG khung (do video = doc noi dung, khong dem khung), thoi gian tung khung, nua dung yen co con nguyen khong.
      Kem di tung khoi cua file (cau truc) + ffprobe neu may co + cac duong loi.
      DOI CHUNG: (1) ep bo may khong cap nhat hinh -> thuoc so dem phai bat; (2) sua file GIF cho xoa hinh cu moi khung
      -> thuoc "nua dung yen" phai bat.
   B. GIAO DIEN (scripts/test/khay-gif-main.cjs): trang Khay video that, bam o GIF, VI + EN, 6 be rong cua so.
   ☠️ So do KHONG thay duoc viec mo anh ra nhin: ban dau (bang mau rieng tung khung) qua het cac phep dem ma hinh loang.
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'xuat-gif')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }

fs.mkdirSync(RA, { recursive: true })
for (const f of ['ket-qua.json', 'khay-vi.json', 'khay-en.json']) { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} } // xoa ket qua cu: script chet thi khong doc nham

const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron') : 'electron')
const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE // VS Code / Claude dat =1 -> electron chay nhu Node tran

// ───────────── A. BO MAY ─────────────
const chay = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'xuat-gif-main.cjs')], { env, encoding: 'utf8', timeout: 200000 })
kiem('[A] Electron thu chay xong, ma thoat 0', chay.status === 0, 'status ' + chay.status)
let r = null
try { r = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8')) } catch (e) {}
kiem('[A] Co ket-qua.json, chay het cac luot', !!r && r.xong === true && !r.loi, r && r.loi ? String(r.loi).slice(0, 200) : '')
const L = (ten) => ((r && r.luot) || []).find((x) => x.ten === ten) || {}

const ungVien = ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins', 'AiO Auto Short Viral'].map((p) => path.join(ROOT, '..', p, 'bin', 'win64', 'ffprobe.exe'))
// 07/10 Mac: file .exe khong chay duoc tren macOS -> dung ffprobe ban Mac o kho chung (neu co).
const ungVienMac = [path.join(process.env.HOME || '', 'Library', 'Application Support', 'AiO-Studio', 'bin', 'mac', 'ffprobe')]
const FFPROBE = (process.platform === 'win32' ? ungVien : process.platform === 'darwin' ? ungVienMac : []).find((f) => fs.existsSync(f)) || null
console.log(FFPROBE ? 'ffprobe: ' + FFPROBE : 'KHONG co ffprobe tren may -> bo qua phan doi chieu ffprobe')
const probe = (file) => {
  if (!FFPROBE) return null
  try {
    const o = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,nb_read_frames:format=duration', '-of', 'json', file], { encoding: 'utf8' }))
    return { codec: o.streams[0].codec_name, w: o.streams[0].width, h: o.streams[0].height, khung: Number(o.streams[0].nb_read_frames), giay: Number(o.format.duration) }
  } catch (e) { return { loi: String(e.message).slice(0, 120) } }
}

/* Thuoc SO DEM: moi khung doc ra thanh trang/den ro; so KHONG lui, khong nhay coc (moi buoc +0 hoac +1), bat dau <= 1,
   ket thuc >= soMong. Tra chuoi loi ('' = dat).
   Vi sao cho phep +0: bo nen H.264 lam net dan hinh sau moi lan doi (khung lap khong giong het tung bit, bai hoc 01/10)
   -> bo may ghi them vai khung NHO cho cung mot so. Thu nguoi xem thay la moi so hien bao lau: xem gopTheoSo(). */
function soDem(s, soMong) {
  if (!s || !s.khung || !s.khung.length) return 'khong doc duoc khung nao'
  const ban = s.khung.filter((k) => !k.sach).length
  if (ban) return ban + ' khung co thanh khong ro trang/den'
  const so = s.khung.map((k) => k.so)
  if (so[0] > 1) return 'khung dau la so ' + so[0]
  for (let i = 1; i < so.length; i++) if (so[i] !== so[i - 1] && so[i] !== so[i - 1] + 1) return 'khung ' + i + ': so ' + so[i - 1] + ' -> ' + so[i]
  if (so[so.length - 1] < soMong) return 'so cuoi ' + so[so.length - 1] + ' < ' + soMong
  return ''
}
/* Tong thoi gian HIEN cua tung so dem (gop cac khung lien nhau cung so) -> [{ so, ms }] */
function gopTheoSo(s) {
  const ra = []
  for (const k of (s && s.khung) || []) { const c = ra[ra.length - 1]; if (c && c.so === k.so) c.ms += k.ms; else ra.push({ so: k.so, ms: k.ms }) }
  return ra
}

if (r && r.mau) {
  console.log('Video mau tu quay: ' + r.mau.mime + ', ' + Math.round(r.mau.bytes / 1024) + ' KB, so dem cuoi ' + r.mau.soCuoi)
  const m = L('mau'), g = m.r || {}, s = m.soi || {}, h = m.hop || {}
  kiem('[mau] xuat duoc', g.ok === true, g.ok ? g.w + 'x' + g.h + ', ' + g.khung + ' khung, ' + g.ms + ' ms (nguon ' + g.nguonMs + '), ' + Math.round(g.bytes / 1024) + ' KB, lam ' + g.msLam + ' ms' : String(g.loi))
  if (g.ok) {
    kiem('[mau] co GIF 640x360 (khong phong to video nho hon 800)', g.w === 640 && g.h === 360 && s.w === 640 && s.h === 360, g.w + 'x' + g.h)
    const e = soDem(s, r.mau.soCuoi - 1)
    kiem('[mau] SO DEM tren tung khung: khong lui, khong nhay coc, du tu dau toi cuoi', e === '', e || s.khung.map((k) => k.so).join(' '))
    const gop = gopTheoSo(s)
    const n200 = gop.filter((k) => k.ms === 200).length
    kiem('[mau] moi so HIEN dung 200 ms (so dau / cuoi duoc lech; con lai lech toi da 1 moc 100 ms o <= 2 so)', n200 >= gop.length - 4 && gop.slice(1, -1).every((k) => k.ms >= 100 && k.ms <= 300), gop.map((k) => k.so + ':' + k.ms).join(' '))
    kiem('[mau] tong thoi gian GIF = video nguon (lech <= 150 ms)', Math.abs(s.tongMs - g.nguonMs) <= 150 && s.tongMs === g.ms, 'GIF ' + s.tongMs + ' ms, nguon ' + g.nguonMs + ' ms')
    kiem('[mau] nua DUNG YEN con nguyen o khung cuoi (lech <= 8 / kenh)', s.lechNen <= 8 && s.lechNenDau <= 8, 'dau ' + s.lechNenDau + ', cuoi ' + s.lechNen)
    kiem('[mau] so khung: bo may = Chromium = cau truc file', g.khung === s.soKhung && g.khung === h.soKhung, g.khung + ' / ' + s.soKhung + ' / ' + h.soKhung)
    kiem('[mau] cau truc: GIF89a, lap vo han, ket thuc dung, moi khung giu hinh cu, 1 bang mau chung', h.dau === 'GIF89a' && h.lap === 0 && h.hetDung && h.cachBo.join() === '1' && h.bangRieng === 0 && h.khungDau.trong === 0, JSON.stringify({ lap: h.lap, het: h.hetDung, cachBo: h.cachBo, bangRieng: h.bangRieng }))
    kiem('[mau] tu kiem cua bo may: lech TB <= 6, diem lech nang <= 1 %', g.tuKiem && g.tuKiem.lechTB <= 6 && g.tuKiem.ptDiemXauMax <= 1, JSON.stringify(g.tuKiem))
    kiem('[mau] tien do khong lui, ket thuc >= 0,9', m.tienDo.giam === 0 && m.tienDo.cuoi >= 0.9, JSON.stringify(m.tienDo))
    kiem('[mau] khong con file .tam', m.coFile && !m.conTam)
    const p = probe(path.join(RA, 'mau.gif'))
    if (p && !p.loi) kiem('[mau] ffprobe: gif, dung co, dung so khung, dung thoi luong', p.codec === 'gif' && p.w === g.w && p.h === g.h && p.khung === g.khung && Math.abs(p.giay * 1000 - g.ms) <= 20, JSON.stringify(p))
    else if (p) kiem('[mau] ffprobe doc duoc file', false, p.loi)
  }
  // Doi chung
  const dc = L('dc-khong-cap-nhat')
  const eDc = dc.soi ? soDem(dc.soi, r.mau.soCuoi - 1) : 'khong soi duoc'
  kiem('[DOI CHUNG 1] bo may khong cap nhat hinh -> thuoc so dem BAT duoc', dc.r && dc.r.ok && eDc !== '', eDc)
  const dc2 = r.dcBoHinh || {}
  kiem('[DOI CHUNG 2] file GIF bi sua thanh "xoa hinh cu" -> thuoc nua dung yen BAT duoc (lech > 30)', dc2.lechNen > 30, 'lech ' + dc2.lechNen + (dc2.loi ? ' ' + dc2.loi : ''))

  const t = L('tran-1s')
  kiem('[tran 1 giay] cat dung o tran, GIF dai dung 1000 ms', t.r && t.r.ok && t.r.cat === true && t.r.ms === 1000 && t.soi && t.soi.tongMs === 1000, t.r ? JSON.stringify({ cat: t.r.cat, ms: t.r.ms, soi: t.soi && t.soi.tongMs }) : '')
  const nh = L('nho-320')
  kiem('[canh dai 320] ra 320x180, so dem van dung', nh.r && nh.r.ok && nh.r.w === 320 && nh.r.h === 180 && soDem(nh.soi, r.mau.soCuoi - 1) === '', nh.r ? nh.r.w + 'x' + nh.r.h + ' ' + soDem(nh.soi, r.mau.soCuoi - 1) : '')

  for (const ten of ['that-720p-co-tieng', 'that-4k']) {
    const x = L(ten)
    if (x.boQua) { console.log('BO QUA [' + ten + ']: ' + x.boQua); continue }
    const g2 = x.r || {}
    kiem('[' + ten + '] file app quay that: xuat duoc, canh dai <= 800, thoi luong khop (<= 150 ms), so khung khop cau truc', g2.ok && Math.max(g2.w, g2.h) <= 800 && Math.abs(g2.ms - g2.nguonMs) <= 150 && x.hop.soKhung === g2.khung && x.hop.hetDung,
      g2.ok ? g2.w + 'x' + g2.h + ', ' + g2.khung + ' khung, ' + g2.ms + ' / ' + g2.nguonMs + ' ms, ' + Math.round(g2.bytes / 1024) + ' KB, lam ' + g2.msLam + ' ms' : String(g2.loi))
    if (g2.ok) kiem('[' + ten + '] tu kiem: lech TB <= 6, diem lech nang <= 1 %', g2.tuKiem.lechTB <= 6 && g2.tuKiem.ptDiemXauMax <= 1, JSON.stringify(g2.tuKiem))
  }

  const rac = L('rac')
  kiem('[file khong phai video] bao "khong-ho-tro", khong de lai .gif / .tam', rac.r && rac.r.ok === false && /^khong-ho-tro/.test(rac.r.loi) && !rac.coFile && !rac.conTam, rac.r ? String(rac.r.loi) : '')
  const cut = L('cut')
  kiem('[file bi cut 40 % cuoi] khong treo, khong de lai .tam; ra GIF thi GIF lanh va ngan hon', cut.r && !cut.conTam && (cut.r.ok ? (cut.hop.hetDung && cut.r.ms < (L('mau').r || {}).ms && cut.soi && cut.soi.soKhung === cut.r.khung) : !cut.coFile),
    cut.r ? (cut.r.ok ? 'ra GIF ' + cut.r.ms + ' ms, ' + cut.r.khung + ' khung' : 'bao loi: ' + cut.r.loi) : '')
  const kc = L('khong-co')
  kiem('[file khong ton tai] bao loi, khong tao gi', kc.r && kc.r.ok === false && !kc.coFile && !kc.conTam, kc.r ? String(kc.r.loi) : '')
  const ss = r.songSong || {}
  kiem('[2 viec cung luc] viec 1 xong, viec 2 bi tu choi "dang-ban", khong de lai file', ss.s1 && ss.s1.ok && ss.s2 && ss.s2.ok === false && ss.s2.loi === 'dang-ban' && !ss.file2 && !ss.tam2, JSON.stringify(ss))
}

// ───────────── B. GIAO DIEN ─────────────
const MAU_UI = path.join(RA, 'mau.mp4')
for (const lang of ['vi', 'en']) {
  if (!fs.existsSync(MAU_UI)) { kiem('[B ' + lang + '] co video mau de thu giao dien', false); continue }
  const c = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'khay-gif-main.cjs'), RA, MAU_UI, lang], { env, encoding: 'utf8', timeout: 120000 })
  const dong = (c.stdout || '').split(/\r?\n/).find((d) => d.startsWith('KQ='))
  let u = null
  try { u = JSON.parse(dong.slice(3)) } catch (e) {}
  kiem('[B ' + lang + '] trang khay chay xong', c.status === 0 && !!u, 'status ' + c.status + ' ' + ((c.stdout || '').split(/\r?\n/).find((d) => d.startsWith('LOI=')) || '').slice(0, 200))
  if (!u) continue
  const N = lang === 'vi' ? ['Có tiếng', 'Không tiếng', 'GIF'] : ['With sound', 'No sound', 'GIF']
  const chu = (x) => x.nut.map((b) => b.chu).join('|'), bat = (x) => x.nut.map((b) => (b.bat ? 1 : 0)).join('')
  kiem('[B ' + lang + '] 3 cum nut dung: co tieng 3 o, khong tieng [Video|GIF], qua 60 giay thi o GIF mo + noi ly do',
    chu(u.dau[0]) === N.join('|') && bat(u.dau[0]) === '100' && chu(u.dau[1]) === 'Video|GIF' && bat(u.dau[1]) === '10' && u.dau[2].nut[1].mo === true && /60/.test(u.dau[2].nut[1].goiY),
    u.dau.map((x) => chu(x) + ' ' + bat(x)).join(' ; ') + ' ; ' + u.dau[2].nut[1].goiY)
  const pt = u.chuLucTao.filter((s) => /^GIF \d+%\|tao$/.test(s))
  kiem('[B ' + lang + '] luc tao o GIF hien phan tram (khong lo ten buoc), xong tro lai "GIF"', pt.length >= 1 && u.chuLucTao[u.chuLucTao.length - 1] === 'GIF' && u.chuLucTao.every((s) => /^GIF( \d+%)?(\|tao)?$/.test(s)), u.chuLucTao.join(' , '))
  kiem('[B ' + lang + '] xong: o GIF sang, 2 o kia tat, trinh phat tat tieng, dong thong tin noi ve file GIF', bat(u.sauGif[0]) === '001' && u.sauGif[0].tat === true && / · GIF · \d/.test(u.sauGif[0].meta), bat(u.sauGif[0]) + ' ' + u.sauGif[0].meta)
  kiem('[B ' + lang + '] file .gif co that, khong con .tam, thanh cong thi KHONG hien thong bao', u.fileGif.co && u.fileGif.bytes > 1000 && !u.fileGif.conTam && u.toast1 === '', JSON.stringify(u.fileGif) + ' toast "' + u.toast1 + '"')
  kiem('[B ' + lang + '] nut Xoa noi tong dung luong CO ca file GIF', u.sauGif[0].xoa !== u.dau[0].xoa, u.dau[0].xoa + ' -> ' + u.sauGif[0].xoa)
  kiem('[B ' + lang + '] bam lai "' + N[0] + '": tra ve video, bat tieng lai; bam GIF lan 2 KHONG tao lai file', bat(u.veCoTieng[0]) === '100' && u.veCoTieng[0].tat === false && !/GIF/.test(u.veCoTieng[0].meta) && bat(u.gifLan2[0]) === '001' && u.soLanXuat === 1, 'so lan tao ' + u.soLanXuat)
  kiem('[B ' + lang + '] video khong tieng: [Video|GIF] doi qua lai dung', bat(u.hang2Gif) === '01' && bat(u.hang2Video) === '10' && /GIF/.test(u.hang2Gif.meta) && !/GIF/.test(u.hang2Video.meta))
  const cao = new Set(u.dau.flatMap((x) => x.nut.map((b) => b.cao))), nhom = new Set(u.dau.map((x) => x.nhomCao))
  kiem('[B ' + lang + '] moi o cao 20 px, cum cao 26 px (bang cac nut cung hang)', cao.size === 1 && cao.has(20) && nhom.size === 1 && nhom.has(26), [...cao].join(',') + ' / ' + [...nhom].join(','))
  for (const b of u.boCuc) {
    const xau = b.hang.filter((x) => x.tran || x.de || x.trangTran || x.metaCan > x.metaHop + 0.5)
    kiem('[B ' + lang + '] cua so rong ' + b.rong + ' px: khong tran, khong de nhau, dong thong tin khong bi cat', xau.length === 0, b.hang.map((x) => 'tran ' + x.tran + ' de ' + x.de + ' meta ' + x.metaCan + '/' + x.metaHop).join(' | '))
  }
  kiem('[B ' + lang + '] trang khong co loi console', u.loiTrang.length === 0, u.loiTrang.join(' | ').slice(0, 200))
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
