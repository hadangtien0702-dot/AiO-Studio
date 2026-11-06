'use strict'
/* BAI DO WebP (06/11/2026): `npm run test:webp`. Electron AN (khong cua so hien len, khong dung thu muc anh that).
   Do HANH VI cua moi duong doc / ghi anh sau khi them WebP: ma hoa, giai ma, luu bang luuAnhDoi, ghi de anh ghim, nap lai khay,
   Tim anh (thumbnail + ghim), chi muc Tim anh, Canvas (quet), + DOI CHUNG (cach cu phai THAT BAI) va bang so do nang / nhe so voi JPEG.
   Chay: electron scripts/test/do-webp.cjs  (ket qua ghi ra <thu muc tam>/aio-ra/do-webp.txt hoac $AIO_RA, ma thoat 0 = dat) */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { fs0.appendFileSync(RA_LOI, String((e && e.stack) || e) + '\n') } catch (x) {} process.exit(2) })
const fs0 = require('fs')
const path = require('path')
const os = require('os')
const RA_DIR = process.env.AIO_RA || path.join(os.tmpdir(), 'aio-ra') // ket qua ghi o thu muc tam, KHONG vao repo
fs0.mkdirSync(RA_DIR, { recursive: true })
const RA = path.join(RA_DIR, 'do-webp.txt'), RA_LOI = path.join(RA_DIR, 'do-webp.loi.txt')
fs0.writeFileSync(RA, '')
const { app, nativeImage, ipcMain, BrowserWindow } = require('electron')
const TMP = fs0.mkdtempSync(path.join(os.tmpdir(), 'aio-do-webp-'))
app.setPath('userData', path.join(TMP, 'userData'))
const ANH = path.join(TMP, 'anh')
fs0.mkdirSync(ANH, { recursive: true })

let dat = 0, truot = 0
const ghi = (s) => fs0.appendFileSync(RA, s + '\n')
function ok(ten, dieuKien, ghiChu) { if (dieuKien) { dat++; ghi('  DAT   ' + ten + (ghiChu ? '  [' + ghiChu + ']' : '')) } else { truot++; ghi('  TRUOT ' + ten + (ghiChu ? '  [' + ghiChu + ']' : '')) } }

function taoAnh(kieu, w, h, mau) {
  const b = Buffer.alloc(w * h * 4)
  let s = 12345 + (mau || 0)
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    let r, g, bl
    if (kieu === 'anh') {
      const n = (rnd() & 31) - 16
      r = 100 + 80 * Math.sin(x / 90 + y / 200) + n; g = 120 + 70 * Math.sin(y / 60 + x / 300) + n; bl = 140 + 60 * Math.cos((x + y) / 110) + n
      if (((x >> 5) + (y >> 5)) % 7 === 0) { r += 40; g -= 20 }
    } else {
      r = g = bl = 245
      if (((y % 22) > 6 && (y % 22) < 15) && ((x % 9) < 6) && (((x / 9) | 0) * 7 + ((y / 22) | 0) * 13) % 5 !== 0 && x > 30 && x < w - 200) { r = g = bl = 40 }
      if (y < 60) { r = 30; g = 60; bl = 120 }
    }
    b[i] = Math.max(0, Math.min(255, bl)); b[i + 1] = Math.max(0, Math.min(255, g)); b[i + 2] = Math.max(0, Math.min(255, r)); b[i + 3] = 255
  }
  return nativeImage.createFromBitmap(b, { width: w, height: h })
}
function psnr(a, b) {
  const x = a.toBitmap(), y = b.toBitmap(); let se = 0, n = 0
  for (let i = 0; i < x.length; i += 4) for (let k = 0; k < 3; k++) { const d = x[i + k] - y[i + k]; se += d * d; n++ }
  return se === 0 ? 99 : 10 * Math.log10(255 * 255 / (se / n))
}
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const kho = require('../../src/kho')
  const webp = require('../../src/webp')
  const khayMuc = require('../../src/khay-muc')
  const canvasKho = require('../../src/canvas-kho')
  const timAnh = require('../../src/tim-anh')
  webp.noiLog((m) => ghi('    log: ' + m))
  kho.ghiCauHinh({ thuMucAnh: ANH })

  /* ── A. Bo ma hoa / giai ma ───────────────────────────────────────── */
  ghi('A. Bo ma hoa / giai ma')
  const goc = taoAnh('anh', 640, 400)
  const b95 = await webp.ma(goc, 0.95)
  ok('A1 ma hoa ra RIFF/WEBP', !!b95 && webp.laWebp(b95), b95 ? b95.length + ' byte' : 'null')
  const kt = b95 && webp.docKichThuoc(b95)
  ok('A2 doc kich thuoc tu dau file = 640x400', !!kt && kt.w === 640 && kt.h === 400, JSON.stringify(kt))
  const lai = await webp.giaiMa(b95)
  ok('A3 giai ma ra dung 640x400', !!lai && lai.getSize().width === 640 && lai.getSize().height === 400)
  const ps = lai ? psnr(goc, lai) : 0
  ok('A4 chat luong 0,95: PSNR >= 38 dB', ps >= 38, ps.toFixed(1) + ' dB')
  const bLL = await webp.ma(goc, 1)
  const laiLL = await webp.giaiMa(bLL)
  ok('A5 chat luong 1 = LOSSLESS (khong sai mot diem anh)', !!laiLL && psnr(goc, laiLL) === 99, bLL ? bLL.length + ' byte' : '')
  const bUi = await webp.ma(taoAnh('ui', 800, 500), 1)
  ok('A5b lossless anh giao dien: kich thuoc dung', !!bUi && webp.docKichThuoc(bUi).w === 800)
  ok('A6 DOI CHUNG: nativeImage.createFromBuffer KHONG doc duoc WebP (ly do phai co bo giai ma rieng)', nativeImage.createFromBuffer(b95).isEmpty())
  ok('A7 anh qua lon (16384 px) tra null, khong nem', (await webp.ma(taoAnh('ui', 16384, 4), 0.9)) === null)
  ok('A8 buffer rac khong phai WebP -> giaiMa null', (await webp.giaiMa(Buffer.from('khong phai anh'))) === null)
  const rac = Buffer.from(b95); rac.fill(0, 40, 200)
  ok('A9 file WebP hong giua chung -> giai ma khong treo, ra anh hoac null', await Promise.race([webp.giaiMa(rac).then(() => true), cho(8000).then(() => false)]))
  const dongThoi = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => webp.ma(taoAnh('anh', 200, 150, i), 0.8)))
  ok('A10 6 lenh ma hoa CUNG LUC deu ra ket qua dung', dongThoi.every((b) => b && webp.laWebp(b) && webp.docKichThuoc(b).w === 200))

  /* ── B. Luu anh (luuAnhDoi) ───────────────────────────────────────── */
  ghi('B. Luu anh bang kho.luuAnhDoi')
  const f1 = await kho.luuAnhDoi(goc, { loai: 'webp', q: 98, qWebp: 0.9 })
  ok('B1 luu WebP: file .webp, dung RIFF', !!f1 && /\.webp$/.test(f1) && webp.laWebp(fs0.readFileSync(f1)), f1 && path.basename(f1))
  ok('B2 ten file theo mau shotandsave-<gio>.webp', !!f1 && /^shotandsave-\d{4}-\d{2}-\d{2}-\d{6}-\d{3}\.webp$/.test(path.basename(f1)))
  const f2 = await kho.luuAnhDoi(goc, { loai: 'jpeg', q: 98 })
  ok('B3 JPEG van luu dung (khong dung toi WebP)', !!f2 && /\.jpg$/.test(f2) && fs0.readFileSync(f2)[0] === 0xff)
  const f3 = await kho.luuAnhDoi(goc, { loai: 'png' })
  ok('B4 PNG van luu dung', !!f3 && /\.png$/.test(f3) && fs0.readFileSync(f3)[1] === 0x50)
  const dai = taoAnh('ui', 16400, 6)
  const f4 = await kho.luuAnhDoi(dai, { loai: 'webp', qWebp: 0.9 })
  ok('B5 anh cao/rong > 16383 px: KHONG mat anh, tu luu JPEG, ghi ly do', !!f4 && /\.jpg$/.test(f4) && /webp/.test(kho.lanCuoi().lui), kho.lanCuoi().lui)
  const anhDoc = await kho.docAnhFile(f1)
  ok('B6 kho.docAnhFile doc lai WebP dung 640x400', !!anhDoc && anhDoc.getSize().width === 640)
  ok('B6b DOI CHUNG: nativeImage.createFromPath(WebP) rong', nativeImage.createFromPath(f1).isEmpty())
  const kt6 = kho.kichThuocWebp(f1)
  ok('B7 kho.kichThuocWebp doc tu dau file', !!kt6 && kt6.w === 640 && kt6.h === 400)
  ok('B8 kho.laFileAnh nhan .webp, .WEBP, .png, .jpeg; tu choi .gif .txt', ['a.webp', 'A.WEBP', 'a.png', 'a.jpeg'].every(kho.laFileAnh) && !kho.laFileAnh('a.gif') && !kho.laFileAnh('a.txt'))

  /* ── C. Ghi de anh ghim da sua (maHoaTheoDuoi + ghiDeAnh) ──────────── */
  ghi('C. Ghi de khi sua anh ghim')
  const sua = nativeImage.createFromBitmap((() => { const b = Buffer.from(goc.toBitmap()); for (let i = 0; i < 4 * 640 * 20; i += 4) { b[i] = 0; b[i + 1] = 0; b[i + 2] = 255 } return b })(), { width: 640, height: 400 })
  const bufW = await kho.maHoaTheoDuoi(f1, sua, { q: 98, qWebp: 1 })
  ok('C1 ghi de file .webp bang WebP (khong phai JPEG)', !!bufW && webp.laWebp(bufW))
  const r = kho.ghiDeAnh(f1, bufW)
  const docLai = await kho.docAnhFile(f1)
  const px = docLai ? docLai.toBitmap() : null
  ok('C2 ghi de OK va doc lai thay net vua sua (dong dau do)', r.ok && !!px && px[2] === 255 && px[1] === 0 && px[0] === 0, JSON.stringify({ ok: r.ok, cach: r.cach }))
  const bJpgTrongTenWebp = await kho.maHoaTheoDuoi('x.jpg', sua, { q: 90 })
  ok('C3 DOI CHUNG: cach cu (luon JPEG cho moi file khong phai png) ghi vao .webp se ra byte JPEG, KHONG phai RIFF', bJpgTrongTenWebp[0] === 0xff && !webp.laWebp(bJpgTrongTenWebp))
  const hong = await kho.maHoaTheoDuoi(f1, taoAnh('ui', 16400, 4), { qWebp: 0.9 })
  ok('C4 anh qua lon khong ma hoa duoc -> tra null (ben goi hoan tac, khong ghi file hong)', hong === null)

  /* ── D. Nap lai khay luc mo app ─────────────────────────────────── */
  ghi('D. Nap lai khay (khay-muc.napDanhSach)')
  const dirKhay = path.join(TMP, 'khay'); fs0.mkdirSync(dirKhay)
  const ds = []
  for (let i = 0; i < 5; i++) {
    const w = 300 + i * 20, h = 200
    const img = taoAnh(i % 2 ? 'anh' : 'ui', w, h, i)
    const f = path.join(dirKhay, 'a' + i + (i === 1 || i === 3 ? '.webp' : i === 2 ? '.jpg' : '.png'))
    const duoi = path.extname(f)
    if (duoi === '.webp') fs0.writeFileSync(f, await webp.ma(img, 0.9)); else if (duoi === '.jpg') fs0.writeFileSync(f, img.toJPEG(90)); else fs0.writeFileSync(f, img.toPNG())
    ds.push({ path: f })
  }
  const hong2 = path.join(dirKhay, 'hong.webp'); fs0.writeFileSync(hong2, Buffer.concat([Buffer.from('RIFF\x10\x00\x00\x00WEBPVP8 ', 'latin1'), Buffer.alloc(40)]))
  ds.push({ path: hong2 })
  const THUMB_CHO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  ok('D0 anh giu cho 1x1 la PNG hop le', !nativeImage.createFromDataURL(THUMB_CHO).isEmpty())
  const items = new Map(); let seq = 0; const xong = [], loi = []
  const thumbKhay = (img) => 'data:image/jpeg;base64,' + img.resize({ height: Math.min(40, img.getSize().height) }).toJPEG(80).toString('base64')
  const chay = (xongCb) => khayMuc.napDanhSach(ds, {
    nativeImage, taoAnhNho: thumbKhay, thumbCho: THUMB_CHO, layId: () => ++seq, themMuc: (m) => items.set(m.id, m),
    kichThuocWebp: (p) => kho.kichThuocWebp(p), docAnhFile: xongCb || ((p) => kho.docAnhFile(p)),
    khiXong: (m) => xong.push(m.id), khiLoi: (m) => { loi.push(m.id); items.delete(m.id) },
  })
  const hoanTat = chay()
  const truocKhiXong = Array.from(items.values()).map((m) => ({ id: m.id, thumb: m.thumb, w: m.w, h: m.h, f: path.basename(m.filePath) }))
  ok('D1 TUC THI co du 6 muc theo dung thu tu 1..6 (WebP giu cho, khong mat so thu tu)', truocKhiXong.map((m) => m.id).join() === '1,2,3,4,5,6' && truocKhiXong.map((m) => m.f).join() === 'a0.png,a1.webp,a2.jpg,a3.webp,a4.png,hong.webp', truocKhiXong.map((m) => m.f).join())
  ok('D2 muc WebP luc dau dung thumbnail giu cho + kich thuoc doc tu dau file', truocKhiXong[1].thumb === THUMB_CHO && truocKhiXong[1].w === 320 && truocKhiXong[1].h === 200)
  await hoanTat
  const sau = Array.from(items.values())
  ok('D3 sau khi giai ma: 2 muc WebP co thumbnail that (khong con giu cho), kich thuoc dung', sau.filter((m) => /\.webp$/.test(m.filePath) && m.thumb !== THUMB_CHO).length === 2 && sau.find((m) => /a3/.test(m.filePath)).w === 360)
  ok('D4 file WebP hong: bao loi dung 1 lan va bi go khoi khay (id 6), 5 muc con lai', loi.join() === '6' && sau.length === 5 && !items.has(6), 'xong=' + xong.join() + ' loi=' + loi.join())
  ok('D5 muc PNG/JPEG khong di qua nhanh WebP (thumbnail that ngay tu dau)', truocKhiXong[0].thumb !== THUMB_CHO && truocKhiXong[2].thumb !== THUMB_CHO)
  // doi chung: khong co bo giai ma -> WebP khong the hien (cach cu bo qua file .webp)
  const items2 = new Map(); let seq2 = 0
  await khayMuc.napDanhSach(ds.slice(0, 4), { nativeImage, taoAnhNho: thumbKhay, thumbCho: THUMB_CHO, layId: () => ++seq2, themMuc: (m) => items2.set(m.id, m), kichThuocWebp: () => null, docAnhFile: async () => null, khiXong() {}, khiLoi() {} })
  ok('D6 DOI CHUNG (cach cu, chi createFromPath): 2 anh WebP BIEN MAT khoi khay', items2.size === 2, 'con ' + items2.size + '/4')

  /* ── E. Tim anh: chi muc + thumbnail + ghim ────────────────────── */
  ghi('E. Tim anh')
  const dirTim = path.join(TMP, 'timanh'); fs0.mkdirSync(dirTim)
  const wf = path.join(dirTim, 'shotandsave-2026-11-06-100000-001.webp'); fs0.writeFileSync(wf, await webp.ma(taoAnh('ui', 500, 300), 0.9))
  const pf = path.join(dirTim, 'shotandsave-2026-11-06-100001-001.png'); fs0.writeFileSync(pf, taoAnh('ui', 500, 300).toPNG())
  const cu = new Date(Date.now() - 60000); fs0.utimesSync(wf, cu, cu); fs0.utimesSync(pf, cu, cu) // chi muc bo qua file moi < 3 giay
  const cm = timAnh.taoChiMuc({ thuMucDuLieu: path.join(TMP, 'chimuc'), layThuMucAnh: () => dirTim, docAnh: async (f) => ({ ok: true, chu: 'Bao gia ' + path.basename(f) }), nghiToiThieuMs: 0, nghiHeSo: 0 })
  cm.quet()
  const quet = cm.tim({ chu: '' })
  ok('E1 chi muc Tim anh quet duoc ca file .webp', quet.ds.length === 2 && quet.ds.some((d) => /\.webp$/.test(d.ten)), quet.ds.map((d) => d.ten).join())
  const tre = require('../../src/tim-anh')
  // dang ky that voi ctx toi thieu de goi dung handler 'tim-anh:thumb' va 'tim-anh:ghim'
  const daGhim = []
  const reg = tre.dangKy({
    app, ipcMain, BrowserWindow, screen: require('electron').screen, shell: { showItemInFolder() {} }, nativeImage,
    ocr: { docChu: async () => ({ ok: true, dong: ['Bao gia khach ABC'] }) }, daoNeuNenToi: (i) => ({ img: i }),
    createPinWindow: (img, x, y, w, h, f) => daGhim.push({ w: img.getSize().width, h: img.getSize().height, f }),
    dangBan: () => false, ghiLog: () => {}, kho: { thuMucAnh: () => dirTim, docCauHinh: () => ({}), ghiCauHinh: () => ({}), duongDanKeoAnToan: (p) => p, docAnhFile: kho.docAnhFile },
    thuMucDuLieu: path.join(TMP, 'tim-dl'), tieuDe: 'x', nghiHeSo: 0, nghiToiThieuMs: 0,
  })
  reg.chiMuc.quet()
  const hThumb = ipcMain._invokeHandlers && ipcMain._invokeHandlers.get('tim-anh:thumb')
  if (hThumb) {
    const tb = await hThumb({}, wf)
    const img = tb ? nativeImage.createFromBuffer(Buffer.from(tb)) : null
    ok('E2 thumbnail Tim anh cua file .webp ra anh that (JPEG giai ma duoc)', !!img && !img.isEmpty() && img.getSize().width > 0, img ? JSON.stringify(img.getSize()) : 'null')
  } else ok('E2 (khong lay duoc handler tim-anh:thumb tu ipcMain)', false)
  const lsn = ipcMain.listeners('tim-anh:ghim')
  if (lsn.length) { await lsn[lsn.length - 1]({}, wf); await cho(300) }
  ok('E3 bam GHIM file .webp: cua so ghim nhan anh 500x300', daGhim.length === 1 && daGhim[0].w === 500 && daGhim[0].h === 300 && daGhim[0].f === wf, JSON.stringify(daGhim))
  // OCR cua Tim anh doc anh WebP (docAnhThat chay that, ocr gia tra dong chu)
  const cm2 = reg.chiMuc
  cm2.vong && await cm2.vong()
  await cho(1200)
  const mw = cm2.lay(wf)
  ok('E4 doc chu nen cua Tim anh xu ly duoc file .webp (da doc, co chu)', !!mw && mw.da && /ABC/.test(mw.chu), mw ? JSON.stringify({ da: mw.da, chu: mw.chu, loi: mw.loi }) : 'khong co muc')

  /* ── F. Canvas ─────────────────────────────────────────────────── */
  ghi('F. Canvas')
  const dirCv = path.join(TMP, 'canvas'); fs0.mkdirSync(path.join(dirCv, 'Khung A'), { recursive: true })
  fs0.copyFileSync(wf, path.join(dirCv, 'x1.webp')); fs0.copyFileSync(pf, path.join(dirCv, 'x2.png')); fs0.copyFileSync(wf, path.join(dirCv, 'Khung A', 'trong.webp'))
  const q = canvasKho.quet(dirCv)
  ok('F1 Canvas quet thay .webp o thu muc goc (kieu anh) va trong khung', q.file.some((f) => f.ten === 'x1.webp' && f.kieu === 'anh') && q.con[0].file.some((f) => f.ten === 'trong.webp'), JSON.stringify(q.file.map((f) => f.ten)))
  const nd = canvasKho.nhanDoiAnh(dirCv, 'x1.webp')
  ok('F2 nhan doi tam .webp: ra x1 (2).webp that', nd.ok && fs0.existsSync(path.join(dirCv, 'x1 (2).webp')), JSON.stringify(nd))
  ok('F3 canvasKho.kieuCua(.gif) van null (khong mo rong qua tay)', canvasKho.kieuCua('a.gif') === null)

  /* ── G. So do: nang / nhe so voi JPEG ──────────────────────────── */
  ghi('G. So do (Electron 43, may nay): kich thuoc va thoi gian, WebP vs JPEG')
  const bang = []
  for (const [kieu, w, h] of [['anh', 1280, 720], ['anh', 3840, 2160], ['ui', 1280, 720], ['ui', 3840, 2160]]) {
    const img = taoAnh(kieu, w, h)
    const d = { kieu, w, h }
    for (const q of [95, 98, 100]) { const t0 = Date.now(); const j = img.toJPEG(q); d['jpg' + q] = j.length / 1024 | 0; d['jpg' + q + 'ms'] = Date.now() - t0 }
    for (const [ten, q] of [['thap0.85', 0.85], ['cao0.95', 0.95], ['sieu1', 1]]) { const t0 = Date.now(); const wb = await webp.ma(img, q); d[ten] = wb ? wb.length / 1024 | 0 : -1; d[ten + 'ms'] = Date.now() - t0 }
    const t0 = Date.now(); d.png = img.toPNG().length / 1024 | 0; d.pngms = Date.now() - t0
    bang.push(d)
    ghi('   ' + kieu + ' ' + w + 'x' + h + '  JPEG q95/98/100 = ' + d.jpg95 + '/' + d.jpg98 + '/' + d.jpg100 + ' KB (' + d.jpg98ms + ' ms)  WebP 0,85/0,95/lossless = ' + d['thap0.85'] + '/' + d['cao0.95'] + '/' + d.sieu1 + ' KB (' + d['cao0.95ms'] + '/' + d.sieu1ms + ' ms)  PNG ' + d.png + ' KB (' + d.pngms + ' ms)')
  }
  ok('G1 anh nhieu hat: WebP "cao" nhe hon JPEG "cao" (q98) it nhat 2 lan', bang.filter((d) => d.kieu === 'anh').every((d) => d['cao0.95'] * 2 <= d.jpg98), bang.filter((d) => d.kieu === 'anh').map((d) => d['cao0.95'] + ' vs ' + d.jpg98 + ' KB').join(' | '))
  ok('G2 anh giao dien: WebP lossless nhe hon JPEG q100 it nhat 5 lan', bang.filter((d) => d.kieu === 'ui').every((d) => d.sieu1 * 5 <= d.jpg100), bang.filter((d) => d.kieu === 'ui').map((d) => d.sieu1 + ' vs ' + d.jpg100 + ' KB').join(' | '))
  ok('G3 vung chup thuong (1280x720) ma hoa WebP "cao" duoi 400 ms', bang.filter((d) => d.w === 1280).every((d) => d['cao0.95ms'] < 400), bang.filter((d) => d.w === 1280).map((d) => d['cao0.95ms'] + ' ms').join(' | '))

  webp.tat()
  ghi('\nTONG: ' + dat + ' dat, ' + truot + ' truot')
  try { fs0.rmSync(TMP, { recursive: true, force: true }) } catch (e) {}
  app.exit(truot ? 1 : 0)
})
