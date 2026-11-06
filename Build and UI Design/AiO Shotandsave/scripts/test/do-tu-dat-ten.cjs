'use strict'
/* BAI DO TU DAT TEN FILE THEO NOI DUNG (06/11/2026): `npm run test:tudatten`. Electron AN, thu muc tam, khong dung anh that.
   Phan 1: chon chu + che nhay cam + mau ten (ham thuan). Phan 2: 800 anh gia trong thu muc tam chay qua bo quan ly THAT
   (tu-dat-ten.js) noi voi kho.js THAT (daGiao, doiTenKhongDe, duongDanKeoAnToan = chinh duong keo ra ngoai), chi muc Tim anh THAT
   (tim-anh.taoChiMuc), so khay + anh ghim gia: ten doi dung, so khay / chi muc / anh ghim cap nhat khop 100%, khong mat / de file nao,
   khong dung vao file da keo / dang tren Canvas / vua bi sua. Phan 3: DOI CHUNG, cach lam hong phai bi bat.
   Ket qua: <thu muc tam>/aio-ra/do-tu-dat-ten.txt, ma thoat 0 = dat. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const RA_DIR = process.env.AIO_RA || path.join(os.tmpdir(), 'aio-ra')
fs.mkdirSync(RA_DIR, { recursive: true })
const RA = path.join(RA_DIR, 'do-tu-dat-ten.txt'), RA_LOI = path.join(RA_DIR, 'do-tu-dat-ten.loi.txt')
fs.writeFileSync(RA, '')
process.on('uncaughtException', (e) => { try { fs.appendFileSync(RA_LOI, String((e && e.stack) || e) + '\n') } catch (x) {} process.exit(2) })
const { app } = require('electron')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-do-ten-'))
app.setPath('userData', path.join(TMP, 'userData'))
let dat = 0, truot = 0
const ghi = (s) => fs.appendFileSync(RA, s + '\n')
function ok(ten, dk, gc) { if (dk) { dat++; ghi('  DAT   ' + ten + (gc ? '  [' + gc + ']' : '')) } else { truot++; ghi('  TRUOT ' + ten + (gc ? '  [' + gc + ']' : '')) } }
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex')
const AN_TOAN = /^[A-Za-z0-9 _.\-]+$/

app.whenReady().then(async () => {
  const kho = require('../../src/kho')
  const tdt = require('../../src/tu-dat-ten')
  const timAnh = require('../../src/tim-anh')

  /* ── 1. Chon chu, che nhay cam, mau ten ────────────────────────── */
  ghi('1. Chon chu + che nhay cam + mau')
  const c1 = tdt.chonNoiDung(['Báo giá khách ABC', 'Tổng cộng thanh toán', 'Liên hệ'])
  ok('1.1 bo dau tieng Viet, lay vai chu dau co nghia', c1.noiDung === 'Bao gia khach ABC', JSON.stringify(c1))
  const c2 = tdt.chonNoiDung(['lienhe@congty.vn', 'Gọi 0901 234 567', 'The 4111 1111 1111 1111', 'Báo giá thang muoi'])
  ok('1.2 dong co email / so dien thoai / so the bi che, lay dong sach con lai', c2.noiDung === 'Bao gia thang muoi' && c2.boQua === 3, JSON.stringify(c2))
  const c3 = tdt.chonNoiDung(['Mật khẩu: abc123', 'api_key sk-12345', 'https://abc.com/x'])
  ok('1.3 chi toan dong nhay cam (mat khau / key / link) -> khong dat ten (giu ten cu)', c3.noiDung === '', JSON.stringify(c3))
  const c4 = tdt.chonNoiDung(['|||', 'x', '- ~ _', 'a b'])
  ok('1.4 OCR rac -> khong dat ten', c4.noiDung === '', JSON.stringify(c4))
  ok('1.5 toi da 5 tu va 40 ky tu', tdt.chonNoiDung(['mot hai ba bon nam sau bay tam chin muoi']).noiDung.split(' ').length === 5 && tdt.chonNoiDung(['Abcdefghijklmnopqrs Abcdefghijklmnopqrs Abcdefghijklmnopqrs']).noiDung.length <= 40)
  ok('1.6 dong dau 1 tu -> noi them dong sau cho du ten', tdt.chonNoiDung(['Settings', 'Network proxy options']).noiDung === 'Settings Network proxy options')
  ok('1.7 "ID" dang ma khoa dai (chu + so tron) khong vao ten', !/AB12CD34EF/.test(tdt.chonNoiDung(['Don hang AB12CD34EF xong']).noiDung))
  ok('1.8 dongNhayCam: 7 chu so roi rac van bi che; nam 2024 thi khong', tdt.dongNhayCam('so 090 123 4567') && !tdt.dongNhayCam('Bao gia nam 2024'))
  const d0 = new Date(2026, 10, 6, 14, 32)
  ok('1.9 mau mac dinh "{noidung} {gio}" -> "Bao gia khach ABC 1432"', tdt.dungTen(tdt.MAU_MAC_DINH, { noiDung: 'Bao gia khach ABC', ngay: d0 }) === 'Bao gia khach ABC 1432')
  ok('1.10 mau {ngay} {gio} {app}', tdt.dungTen('{ngay} {gio} {app}', { app: 'Premiere Pro', ngay: d0 }) === '2026-11-06 1432 Premiere Pro')
  ok('1.11 ky tu la / & / dau cach thua bi bo', tdt.dungTen('{app}&{noidung}??', { app: 'A & B', noiDung: 'Hóa đơn', ngay: d0 }) === 'A B Hoa don', tdt.dungTen('{app}&{noidung}??', { app: 'A & B', noiDung: 'Hóa đơn', ngay: d0 }))
  ok('1.12 co {noidung} ma khong co chu -> null (giu ten cu)', tdt.dungTen('{noidung} {gio}', { noiDung: '', ngay: d0 }) === null)
  ok('1.13 ten rieng cua Windows (con, nul) khong dung', tdt.dungTen('{app}', { app: 'con', ngay: d0 }) === null && tdt.lamSachTen('NUL') === '')
  ok('1.14 mau khong co {noidung}: dat ten khong can doc chu', tdt.dungTen('{ngay} {gio}', { ngay: d0 }) === '2026-11-06 1432')
  ok('1.15 ten dai bi cat <= 80, khong con dau cham / cach cuoi', (() => { const t = tdt.lamSachTen('a'.repeat(100) + ' ...'); return t.length <= 80 && !/[. ]$/.test(t) })())
  ok('1.17 mau nguoi dung go: rong / chi toan ky tu bi bo -> mac dinh; dai thi cat 80; mau tot giu nguyen', tdt.mauHopLe('') === tdt.MAU_MAC_DINH && tdt.mauHopLe('&&& ???') === tdt.MAU_MAC_DINH && tdt.mauHopLe(null) === tdt.MAU_MAC_DINH && tdt.mauHopLe('x'.repeat(200)).length === 80 && tdt.mauHopLe('{ngay} {app}') === '{ngay} {app}')
  ok('1.16 chi file do app dat ten moi duoc xep hang', tdt.laTenApp('shotandsave-2026-11-06-143215-123.jpg') && tdt.laTenApp('X/shotandsave-2026-11-06-143215-123.webp') && !tdt.laTenApp('shotandsave-video-2026-11-06-143215-123.mp4') && !tdt.laTenApp('anh cua toi.png') && !tdt.laTenApp('shotandsave-lamdep-2026-11-06-143215-123-1.png'))

  /* ── 2. 800 anh qua bo quan ly that ───────────────────────────── */
  ghi('2. 800 anh gia trong thu muc tam, qua bo quan ly that')
  kho.ghiCauHinh({ thuMucAnh: path.join(TMP, 'anh') })
  const DIR = path.join(TMP, 'anh'); fs.mkdirSync(DIR, { recursive: true })
  const N = 800
  const files = []
  const tao = (i, duoi) => {
    const d = new Date(2026, 10, 6, 9, Math.floor(i / 60) % 60, i % 60, 100 + (i % 800))
    const p2 = (n, k) => String(n).padStart(k || 2, '0')
    const ten = 'shotandsave-' + d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '-' + p2(d.getMilliseconds(), 3) + duoi
    const f = path.join(DIR, ten)
    fs.writeFileSync(f, Buffer.from('anh-' + i + '-' + 'x'.repeat(50 + (i % 7))))
    const t = new Date(Date.now() - 120000 - (N - i) * 1000); fs.utimesSync(f, t, t)
    return f
  }
  for (let i = 0; i < N; i++) files.push(tao(i, i % 3 === 0 ? '.png' : i % 3 === 1 ? '.jpg' : '.webp'))
  // nhom dac biet: 0-39 da keo ra ngoai · 40-59 dang tren Canvas · 60-79 bi sua sau khi xep hang · 80-99 OCR loi · 100-119 chi toan chu nhay cam
  // 120-139 cung mot noi dung (kiem tra trung ten) · con lai doc chu binh thuong
  const hash0 = new Map(files.map((f) => [f, sha(f)]))
  const noiDungCua = (i) => {
    if (i >= 100 && i < 120) return ['lienhe' + i + '@mail.com', 'Gọi 0901 234 5' + (10 + i)]
    if (i >= 120 && i < 140) return ['Báo giá khách ABC']
    return ['Hóa đơn số ' + (i % 50 === 0 ? 'mot' : 'hai') + ' khách hàng ' + ['alpha', 'beta', 'gamma', 'delta'][i % 4], '0901 234 567 (lien he)', 'Dòng cuối']
  }
  const dsLog = []
  const shelf = new Map(); const pins = new Map()
  for (let i = 760; i < 800; i++) shelf.set(i, { id: i, filePath: files[i] })     // 40 anh nam trong khay
  for (let i = 780; i < 790; i++) pins.set(i, { filePath: files[i] })              // 10 anh dang ghim
  const canvasCo = new Set(files.slice(40, 60).map((f) => path.basename(f)))
  const luuGia = new Set()                                                         // khoa file da bi sua sau khi xep hang
  const chiMuc = timAnh.taoChiMuc({ thuMucDuLieu: path.join(TMP, 'chimuc'), layThuMucAnh: () => DIR, docAnh: async () => ({ ok: false, loi: 'khong-dung' }), nghiToiThieuMs: 0, nghiHeSo: 0 })
  chiMuc.quet()
  const truocQuet = chiMuc._muc.size
  let soDocChu = 0
  const tinh = (nhieuLoi) => tdt.taoTuDatTen({
    bat: () => true, mau: () => '{noidung} {gio}',
    docChu: async (f) => {
      soDocChu++
      const i = files.indexOf(f)
      if (i >= 80 && i < 100) return { ok: false, loi: 'ocr-hong' }
      return { ok: true, dong: noiDungCua(i) }
    },
    dangBan: () => false,
    daGiao: nhieuLoi ? () => false : (f) => kho.daGiao(f),
    coThamChieu: nhieuLoi ? () => false : (f) => canvasCo.has(path.basename(f)),
    doiTen: kho.doiTenKhongDe,
    apDung: (cu, moi, chu) => {
      for (const it of shelf.values()) if (it.filePath === cu) it.filePath = moi
      for (const p of pins.values()) if (p.filePath === cu) p.filePath = moi
      chiMuc.doiTen(cu, moi, chu)
    },
    ghiLog: (m) => dsLog.push(m), nghiMs: 0, tuoiToiThieuMs: 0,
  })
  const mgr = tinh(false)
  // 0-39: nguoi dung KEO RA NGOAI bang chinh ham ma moi duong keo (khay, ghim, Tim anh, Canvas) goi
  for (let i = 0; i < 40; i++) kho.duongDanKeoAnToan(files[i])
  ok('2.0 keo ra ngoai danh dau "da giao" (kho.daGiao) dung 40 file', files.filter((f) => kho.daGiao(f)).length === 40 && !kho.daGiao(files[40]))
  const t0 = Date.now()
  for (const f of files) mgr.xepHang(f, null)
  // 60-79: sua file sau khi xep hang (cung vi tri, doi dung luong)
  for (let i = 60; i < 80; i++) { fs.appendFileSync(files[i], 'SUA'); luuGia.add(files[i]) }
  while (mgr.hang() > 0 || mgr.dangChay()) await cho(20)
  const ms = Date.now() - t0
  ghi('   xu ly ' + N + ' anh trong ' + ms + ' ms, doc chu ' + soDocChu + ' lan, doi ' + mgr.thongKe.doi + ', giu ' + mgr.thongKe.giu + ' ' + JSON.stringify(mgr.thongKe.lyDo))
  const conLai = fs.readdirSync(DIR).filter((t) => !t.startsWith('.'))
  ok('2.1 van DUNG ' + N + ' file (khong mat, khong de)', conLai.length === N, conLai.length + ' file')
  const sauHash = new Map(); for (const t of conLai) sauHash.set(sha(path.join(DIR, t)), t)
  const mat = Array.from(hash0.entries()).filter(([f, h]) => !sauHash.has(h) && !luuGia.has(f))
  ok('2.2 noi dung tung file nguyen ven (sha1 khop, tru 20 file chu y sua)', mat.length === 0, mat.length + ' file doi noi dung')
  const doi = conLai.filter((t) => !/^shotandsave-/.test(t))
  ok('2.3 moi ten moi chi gom [A-Za-z0-9 _.-], khong "&", khong dau', doi.length > 0 && doi.every((t) => AN_TOAN.test(t)), doi.length + ' file da doi ten')
  const khongDoiDuoc = (a, b) => files.slice(a, b).every((f) => fs.existsSync(f))
  ok('2.4 40 file DA KEO RA NGOAI giu nguyen ten (bai 5bi)', khongDoiDuoc(0, 40))
  ok('2.5 20 file DANG TREN CANVAS giu nguyen ten', khongDoiDuoc(40, 60))
  ok('2.6 20 file bi SUA sau khi xep hang giu nguyen ten', khongDoiDuoc(60, 80))
  ok('2.7 20 file doc chu LOI giu nguyen ten', khongDoiDuoc(80, 100))
  ok('2.8 20 file chi toan email / so dien thoai giu nguyen ten (khong ro ri vao ten)', khongDoiDuoc(100, 120))
  const phanChu = (t) => t.replace(/\.[a-z]+$/i, '').replace(/ \d{4}( \d+)?$/, '') // bo duoi + gio (HHMM) + so thu tu trung ten: chi con phan NOI DUNG
  ok('2.9 khong ten nao chua email / so dien thoai / @ trong phan noi dung', !conLai.some((t) => /@|0901|234|mail|\d{3}/i.test(phanChu(t)) && !/^shotandsave-/.test(t)), conLai.filter((t) => !/^shotandsave-/.test(t) && /@|0901|234|mail|\d{3}/i.test(phanChu(t))).slice(0, 3).join(' | '))
  const doiXong = files.slice(140).filter((f) => !fs.existsSync(f)).length
  ok('2.10 660 file binh thuong deu da doi ten', doiXong === N - 140 && mgr.thongKe.doi >= N - 140, doiXong + '/' + (N - 140))
  const nhom = conLai.filter((t) => /^Bao gia khach ABC/.test(t)).sort()
  ok('2.11 20 file cung noi dung KHONG trung ten ("... 1432", "... 1432 2", ...)', nhom.length === 20 && new Set(nhom).size === 20, nhom.slice(0, 3).join(' | '))
  // so khay + anh ghim
  const khayLech = Array.from(shelf.values()).filter((it) => !fs.existsSync(it.filePath))
  ok('2.12 so KHAY: 40 muc deu tro toi file CON TON TAI (da cap nhat theo ten moi)', khayLech.length === 0, khayLech.length + ' muc tro vao file mat')
  const ghimLech = Array.from(pins.values()).filter((p) => !fs.existsSync(p.filePath))
  ok('2.13 ANH GHIM: 10 anh ghim van luu duoc ve dung file', ghimLech.length === 0)
  ok('2.14 co it nhat 1 muc khay + 1 anh ghim thuc su duoc DOI ten (khong phai deu giu nguyen)', Array.from(shelf.values()).some((it) => !/^shotandsave-/.test(path.basename(it.filePath))) && Array.from(pins.values()).some((p) => !/^shotandsave-/.test(path.basename(p.filePath))))
  // chi muc Tim anh
  const mucKeys = Array.from(chiMuc._muc.keys()).sort()
  const dongKeys = conLai.map((t) => path.join(DIR, t)).sort()
  ok('2.15 CHI MUC Tim anh: khoa == danh sach file tren dia (khong con muc ma, khong thieu)', JSON.stringify(mucKeys) === JSON.stringify(dongKeys), mucKeys.length + ' muc / ' + dongKeys.length + ' file (truoc quet ' + truocQuet + ')')
  const tuKhoa = chiMuc.tim({ chu: 'alpha hoa don' })
  ok('2.16 chi muc GIU chu da doc: tim "alpha hoa don" ra dung cac anh da doi ten, ten file la ten moi', tuKhoa.ds.length > 100 && tuKhoa.ds.every((d) => fs.existsSync(d.duong) && !/^shotandsave-/.test(d.ten)), tuKhoa.ds.length + ' ket qua')
  const chuKhong = chiMuc.tim({ chu: '234 567' })
  ok('2.17 so dien thoai CO trong chi muc de TIM (khong mat tinh nang tim, vi chi muc luu chu goc) nhung KHONG o ten file', chuKhong.ds.length > 100 && chuKhong.ds.every((d) => !/234 567/.test(d.ten)), chuKhong.ds.length + ' ket qua tim "234 567"')
  ok('2.18 khong doc chu 2 lan: chi muc da danh dau "da doc" cho file moi doi ten', Array.from(chiMuc._muc.values()).filter((m) => !/^shotandsave-/.test(m.ten)).every((m) => m.da && m.chu))
  ok('2.19 nhat ky: moi lan giu ten cu co ly do (da-giao, file-doi, ...)', ['da-giao', 'file-doi', 'khong-doc-duoc-chu', 'canvas-dang-dung', 'chi-con-chu-nhay-cam'].every((k) => (mgr.thongKe.lyDo[k] || 0) > 0), JSON.stringify(mgr.thongKe.lyDo))

  /* ── 3. DOI CHUNG: tat tung chot chan thi bai do phai TRUOT ─────── */
  ghi('3. Doi chung')
  const DIR2 = path.join(TMP, 'anh2'); fs.mkdirSync(DIR2)
  const mk2 = (i) => { const f = path.join(DIR2, 'shotandsave-2026-11-06-1000' + String(10 + i) + '-001.png'); fs.writeFileSync(f, 'x' + i); const t = new Date(Date.now() - 120000); fs.utimesSync(f, t, t); return f }
  const f2 = [mk2(0), mk2(1), mk2(2)]
  kho.duongDanKeoAnToan(f2[0])
  const mgr2 = tdt.taoTuDatTen({ bat: () => true, mau: () => '{noidung}', docChu: async () => ({ ok: true, dong: ['Mot hai ba'] }), dangBan: () => false, daGiao: () => false /* HONG: bo chot da giao */, coThamChieu: () => false, doiTen: kho.doiTenKhongDe, apDung() {}, ghiLog() {}, nghiMs: 0, tuoiToiThieuMs: 0 })
  for (const f of f2) mgr2.xepHang(f, null)
  while (mgr2.hang() > 0 || mgr2.dangChay()) await cho(20)
  ok('3.1 DOI CHUNG: bo chot "da giao" thi file da keo ra ngoai BI doi ten (bai 2.4 se bat duoc)', !fs.existsSync(f2[0]))
  ok('3.2 trung ten van khong de: 3 file cung noi dung -> 3 file khac ten', fs.readdirSync(DIR2).length === 3 && new Set(fs.readdirSync(DIR2)).size === 3, fs.readdirSync(DIR2).join(' | '))
  // doiTenKhongDe khong ghi de
  const a = path.join(DIR2, 'aa.txt'), b = path.join(DIR2, 'bb.txt'); fs.writeFileSync(a, 'AAA'); fs.writeFileSync(b, 'BBB')
  const r = kho.doiTenKhongDe(a, b)
  ok('3.3 doiTenKhongDe: ten dich da co -> tu choi, CA HAI file nguyen ven', !r.ok && fs.readFileSync(a, 'utf8') === 'AAA' && fs.readFileSync(b, 'utf8') === 'BBB', JSON.stringify(r))
  const c = path.join(DIR2, 'cc.txt'); const r2 = kho.doiTenKhongDe(a, c)
  ok('3.4 doiTenKhongDe: ten moi chua co -> doi duoc, ten cu bien mat, noi dung giu', r2.ok && !fs.existsSync(a) && fs.readFileSync(c, 'utf8') === 'AAA', JSON.stringify(r2))
  ok('3.5 tat tinh nang giua chung -> khong doi ten them', await (async () => {
    let bat = true
    const f = mk2(5)
    const m = tdt.taoTuDatTen({ bat: () => bat, mau: () => '{noidung}', docChu: async () => { bat = false; return { ok: true, dong: ['Xin chao ban'] } }, dangBan: () => false, daGiao: () => false, coThamChieu: () => false, doiTen: kho.doiTenKhongDe, apDung() {}, ghiLog() {}, nghiMs: 0, tuoiToiThieuMs: 0 })
    m.xepHang(f, null)
    while (m.hang() > 0 || m.dangChay()) await cho(20)
    return fs.existsSync(f)
  })())
  ok('3.6 tinh nang TAT: xepHang khong nhan file nao', (() => { const m = tdt.taoTuDatTen({ bat: () => false, mau: () => '', docChu: async () => ({ ok: true, dong: [] }), dangBan: () => false, daGiao: () => false, doiTen() {}, apDung() {}, ghiLog() {} }); return m.xepHang(mk2(6), null) === false })())

  ghi('\nTONG: ' + dat + ' dat, ' + truot + ' truot')
  try { chiMuc.dungHet() } catch (e) {}
  try { fs.rmSync(TMP, { recursive: true, force: true }) } catch (e) {}
  app.exit(truot ? 1 : 0)
})
