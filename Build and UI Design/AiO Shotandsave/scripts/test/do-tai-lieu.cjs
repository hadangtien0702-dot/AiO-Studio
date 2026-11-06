'use strict'
/* BAI DO XUAT TAI LIEU TUNG BUOC (06/11/2026): `npm run test:tailieu`. Electron AN (cua so show:false, KHONG hien len man hinh),
   thu muc tam, khong dung anh that. Cua so tai lieu THAT (src/tai-lieu/) dieu khien bang SU KIEN CHUOT / BAN PHIM THAT cua Chromium
   (webContents.sendInputEvent): bam anh trong khay de them buoc, go mo ta, KEO tay nam doi thu tu, bam Xuat HTML / Markdown / PDF,
   roi doc file ra dia kiem noi dung. Co phan do thanh tren cua khay (them nut thu 6 co lam tieu de bi cat khong), va DOI CHUNG.
   Ket qua: <thu muc tam>/aio-ra/do-tai-lieu.txt (+ anh chup 2 cua so de nhin), ma thoat 0 = dat. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const RA_DIR = process.env.AIO_RA || path.join(os.tmpdir(), 'aio-ra')
fs.mkdirSync(RA_DIR, { recursive: true })
const RA = path.join(RA_DIR, 'do-tai-lieu.txt'), RA_LOI = path.join(RA_DIR, 'do-tai-lieu.loi.txt')
fs.writeFileSync(RA, '')
process.on('uncaughtException', (e) => { try { fs.appendFileSync(RA_LOI, String((e && e.stack) || e) + '\n') } catch (x) {} process.exit(2) })
const { app, BrowserWindow, ipcMain, nativeImage, screen } = require('electron')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-do-tl-'))
app.setPath('userData', path.join(TMP, 'userData'))
const OUT = path.join(TMP, 'xuat'); fs.mkdirSync(OUT)
process.env.AIO_TAI_LIEU_DICH_THU = OUT
let dat = 0, truot = 0
const ghi = (s) => fs.appendFileSync(RA, s + '\n')
function ok(ten, dk, gc) { if (dk) { dat++; ghi('  DAT   ' + ten + (gc ? '  [' + gc + ']' : '')) } else { truot++; ghi('  TRUOT ' + ten + (gc ? '  [' + gc + ']' : '')) } }
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex')

function taoAnh(w, h, mau) {
  const b = Buffer.alloc(w * h * 4)
  let s = 777 + mau
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const n = (s & 15)
    b[i] = (40 + mau * 40 + x / 6 + n) & 255; b[i + 1] = (90 + y / 4 + n) & 255; b[i + 2] = (160 - mau * 20 + (x + y) / 9 + n) & 255; b[i + 3] = 255
  }
  return nativeImage.createFromBitmap(b, { width: w, height: h })
}

app.on('window-all-closed', () => {}) // dong het cua so giua chung KHONG duoc thoat bai do
app.whenReady().then(async () => {
  const kho = require('../../src/kho')
  const webp = require('../../src/webp')
  const xuatLib = require('../../src/tai-lieu-xuat')
  const taiLieuMain = require('../../src/tai-lieu-main')
  kho.ghiCauHinh({ thuMucAnh: path.join(TMP, 'anh') })

  /* ── 1. Ham thuan: dung HTML / Markdown, thoat ky tu ─────────────── */
  ghi('1. Ham dung noi dung')
  const doc = '<b>dam</b> & "trich" <script>alert(1)</script>'
  const html = xuatLib.taoHtml({ tieuDe: 'Tiêu đề <i>x</i>', lang: 'vi', ngay: new Date(2026, 10, 6), buoc: [{ moTa: doc, mime: 'image/png', base64: 'AAAA' }, { moTa: '', mime: 'image/webp', base64: 'BBBB' }] })
  ok('1.1 HTML: mo ta nguoi dung go bi THOAT (khong con the <script> / <b> that)', !/<script>alert/.test(html) && !html.includes('<b>dam</b>') && html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && html.includes('&amp;'))
  const naive = '<h2>' + doc + '</h2>'
  ok('1.2 DOI CHUNG: cach viet tho (khong thoat) THI co the <script> that -> phep kiem 1.1 bat duoc', /<script>alert/.test(naive))
  ok('1.3 HTML: tieu de thoat, ngay 06/11/2026, buoc khong mo ta duoc ghi "Buoc 2", webp giu mime image/webp', html.includes('<title>Tiêu đề &lt;i&gt;x&lt;/i&gt;</title>') && html.includes('06/11/2026') && html.includes('Bước 2') && html.includes('data:image/webp;base64,BBBB'))
  const md = xuatLib.taoMarkdown({ tieuDe: '# Hướng dẫn *đậm*', lang: 'vi', ngay: new Date(2026, 10, 6), thuMucAnh: 'Huong dan_anh', buoc: [{ moTa: '# tieu de gia\n- danh sach [link](http://x) `ma`', mime: 'image/png' }, { moTa: '1. so thu tu', mime: 'image/jpeg' }, { moTa: 'x', mime: 'image/webp' }] })
  ok('1.4 Markdown: dau dinh dang trong mo ta bi thoat, khong thanh tieu de / danh sach / link', !/^## .*\n# tieu/m.test(md.md) && md.md.includes('\\# tieu de gia') && md.md.includes('\\[link\\]') && !md.md.includes('\n- danh sach'))
  ok('1.5 Markdown: anh dat ten buoc-NN.<duoi> dung duoi png / jpg / webp, duong dan ma hoa dau cach', md.tenAnh.join() === 'buoc-01.png,buoc-02.jpg,buoc-03.webp' && md.md.includes('![Bước 1](Huong%20dan_anh/buoc-01.png)'))
  ok('1.6 ten file tu tieu de: bo dau, ky tu la; rong thi mac dinh', xuatLib.tenFileTuTieuDe('Cách xuất bản dựng!') === 'Cach-xuat-ban-dung' && xuatLib.tenFileTuTieuDe('???', 'tai-lieu') === 'tai-lieu')

  /* ── 2. Dung 6 anh gia: 3 PNG, 1 WebP, 1 JPEG LON, 1 anh chi trong RAM ─ */
  const dirAnh = path.join(TMP, 'anh'); fs.mkdirSync(dirAnh, { recursive: true })
  const nguon = []
  const png = [0, 1, 2].map((i) => { const f = path.join(dirAnh, 'p' + i + '.png'); fs.writeFileSync(f, taoAnh(320, 200, i).toPNG()); return f })
  const fWebp = path.join(dirAnh, 'w.webp'); fs.writeFileSync(fWebp, await webp.ma(taoAnh(400, 250, 4), 0.9))
  const fLon = path.join(dirAnh, 'lon.jpg'); fs.writeFileSync(fLon, taoAnh(2600, 1800, 5).toJPEG(100))
  const ram = taoAnh(300, 180, 6)
  const thumb = (img) => 'data:image/jpeg;base64,' + img.resize({ height: 60 }).toJPEG(80).toString('base64')
  const khayItems = [
    { id: 1, filePath: png[0], thumb: thumb(taoAnh(320, 200, 0)), w: 320, h: 200, image: null },
    { id: 2, filePath: png[1], thumb: thumb(taoAnh(320, 200, 1)), w: 320, h: 200, image: null },
    { id: 3, filePath: png[2], thumb: thumb(taoAnh(320, 200, 2)), w: 320, h: 200, image: null },
    { id: 4, filePath: fWebp, thumb: thumb(taoAnh(400, 250, 4)), w: 400, h: 250, image: null },
    { id: 5, filePath: fLon, thumb: thumb(taoAnh(260, 180, 5)), w: 2600, h: 1800, image: null },
    { id: 6, filePath: null, thumb: thumb(ram), w: 300, h: 180, image: ram },
  ]
  ghi('   file lon: ' + (fs.statSync(fLon).size / 1048576).toFixed(2) + ' MB (JPEG q100 2600x1800)')

  ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
  const tl = taiLieuMain.khoiTao({
    ipcMain, BrowserWindow, screen, dialog: null, shell: { showItemInFolder() {} }, nativeImage, app, kho,
    ghiLog: (m) => ghi('    log: ' + m), icon: undefined, moiDesktop: null, lang: () => 'vi',
    layKhay: () => khayItems, thuMucDuLieu: path.join(TMP, 'userData', 'tai-lieu'), hien: false,
  })
  const win = tl.mo()
  const wc = win.webContents
  const js = (s) => wc.executeJavaScript(s)
  const doiDen = async (bt, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 8000)) { try { if (await js(bt)) return true } catch (e) {} await cho(60) } return false }
  const toaDo = (sel) => js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'nearest'}); const r = e.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2), r.width, r.height] })()`)
  async function bam(sel) {
    const p = await toaDo(sel); if (!p) throw new Error('khong thay ' + sel)
    wc.sendInputEvent({ type: 'mouseMove', x: p[0], y: p[1] })
    wc.sendInputEvent({ type: 'mouseDown', x: p[0], y: p[1], button: 'left', clickCount: 1 })
    wc.sendInputEvent({ type: 'mouseUp', x: p[0], y: p[1], button: 'left', clickCount: 1 })
    await cho(120)
  }
  async function go(sel, chu) {
    await bam(sel)
    for (const ch of chu) { wc.sendInputEvent({ type: 'char', keyCode: ch }); }
    await cho(120)
  }

  ghi('2. Cua so tai lieu (chuot + ban phim that)')
  ok('2.1 cua so mo ra, cot khay co du 6 anh (5 co file + 1 anh chi trong RAM)', await doiDen("document.querySelectorAll('.o-khay').length === 6"))
  ok('2.2 chua co buoc nao: 3 nut xuat deu bi KHOA (khong cho xuat tai lieu rong)', await js("['xuat-html','xuat-md','xuat-pdf'].every(i => document.getElementById(i).disabled)"))
  const rongXuat = await js("window.taiLieu.xuat({ kieu: 'html', tieuDe: 'x', buoc: [] })")
  ok('2.3 goi thang xuat khong co buoc -> bao loi ro, KHONG ghi file', rongXuat.ok === false && fs.readdirSync(OUT).length === 0, JSON.stringify(rongXuat))

  // them buoc: bam anh theo thu tu khay p0, p1, w(webp), lon, ram, p2
  const thuTu = ['.o-khay:nth-child(1)', '.o-khay:nth-child(2)', '.o-khay:nth-child(4)', '.o-khay:nth-child(5)', '.o-khay:nth-child(6)', '.o-khay:nth-child(3)']
  for (const s of thuTu) await bam(s)
  ok('2.4 bam 6 anh -> 6 buoc, anh trong khay chuyen mo + nhan "Da them"', await js("document.querySelectorAll('.buoc-hang').length === 6 && document.querySelectorAll('.o-khay.da').length === 6"))
  await bam('.o-khay:nth-child(1)')
  ok('2.5 bam LAI anh da them khong tao buoc trung', await js("document.querySelectorAll('.buoc-hang').length === 6"))
  // go tieu de + mo ta bang ban phim that
  await go('#tieu-doc', 'Huong dan cai dat')
  const moTa = ['Mo Cai dat', 'Bam <Luu> & dong', 'Chon "Xuat WebP"', 'Anh lon', 'Anh trong RAM', 'Xong']
  for (let i = 0; i < 6; i++) await go('.buoc-hang:nth-child(' + (i + 1) + ') .mo-ta', moTa[i])
  const gtri = await js("Array.from(document.querySelectorAll('.mo-ta')).map(e => e.value)")
  ok('2.6 go bang ban phim that: 6 dong mo ta vao dung o', JSON.stringify(gtri) === JSON.stringify(moTa), JSON.stringify(gtri))
  ok('2.7 tieu de go vao o tieu de', (await js("document.getElementById('tieu-doc').value")) === 'Huong dan cai dat')

  // KEO tay nam: buoc 1 xuong cho buoc 3
  const dauThuTu = await js("Array.from(document.querySelectorAll('.buoc-hang')).map(e => e.dataset.khoa)")
  const tay = await toaDo('.buoc-hang:nth-child(1) .tay')
  const dich3 = await toaDo('.buoc-hang:nth-child(3)')
  wc.sendInputEvent({ type: 'mouseMove', x: tay[0], y: tay[1] })
  wc.sendInputEvent({ type: 'mouseDown', x: tay[0], y: tay[1], button: 'left', clickCount: 1 })
  for (let k = 1; k <= 12; k++) { wc.sendInputEvent({ type: 'mouseMove', x: tay[0], y: Math.round(tay[1] + (dich3[1] + 10 - tay[1]) * k / 12), button: 'left' }); await cho(25) }
  const dangKeo = await js("!!document.querySelector('.buoc-hang.keo')")
  wc.sendInputEvent({ type: 'mouseUp', x: tay[0], y: dich3[1] + 10, button: 'left', clickCount: 1 })
  await cho(200)
  const sauThuTu = await js("Array.from(document.querySelectorAll('.buoc-hang')).map(e => e.dataset.khoa)")
  ok('2.8 KEO tay nam buoc 1 xuong ngang buoc 3: thu tu doi (1 -> vi tri 3), dang keo co hang noi bat', dangKeo && sauThuTu[2] === dauThuTu[0] && sauThuTu[0] === dauThuTu[1] && sauThuTu[1] === dauThuTu[2], sauThuTu.map((k) => path.basename(k)).join(' > '))
  ok('2.9 mo ta DI THEO anh khi keo (o mo ta cua anh p0 van la "Mo Cai dat")', await js(`(() => { const k = ${JSON.stringify(dauThuTu[0])}; const h = Array.from(document.querySelectorAll('.buoc-hang')).find((e) => e.dataset.khoa === k); return !!h && h.querySelector('.mo-ta').value === 'Mo Cai dat' })()`))
  // nut Doi len: dua buoc 3 (vua keo) len 1 vi tri
  await bam('.buoc-hang:nth-child(3) .len')
  const sau2 = await js("Array.from(document.querySelectorAll('.buoc-hang')).map(e => e.dataset.khoa)")
  ok('2.10 nut "Doi len" bang chuot: buoc 3 len vi tri 2', sau2[1] === dauThuTu[0] && sau2[2] === dauThuTu[2], sau2.map((k) => path.basename(k)).join(' > '))
  ok('2.11 hang dau khong doi len duoc (nut khoa), hang cuoi khong doi xuong duoc', await js("document.querySelector('.buoc-hang:first-child .len').disabled && document.querySelector('.buoc-hang:last-child .xuong').disabled"))
  // bo buoc cuoi (anh p2, mo ta "Xong"); con lai 5 buoc gom ca anh lon va anh chi trong RAM
  await bam('.buoc-hang:nth-child(6) .bo')
  ok('2.12 nut bo buoc: con 5 buoc, anh do tro lai binh thuong trong khay', await js("document.querySelectorAll('.buoc-hang').length === 5 && document.querySelectorAll('.o-khay.da').length === 5"))
  const so = await js("Array.from(document.querySelectorAll('.so-buoc')).map(e => e.textContent).join()")
  ok('2.13 so thu tu buoc danh lai 1..5 sau khi doi / bo', so === '1,2,3,4,5', so)

  // ban nhap luu o dia
  await cho(900)
  const nhapFile = path.join(TMP, 'userData', 'tai-lieu', 'nhap.json')
  const nhap = JSON.parse(fs.readFileSync(nhapFile, 'utf8'))
  ok('2.14 ban nhap luu o userData: tieu de + thu tu + mo ta; anh chi trong RAM KHONG ghi nho qua lan mo app', nhap.tieuDe === 'Huong dan cai dat' && nhap.buoc.length === 4 && nhap.buoc.every((b) => !b.khoa.startsWith('ram:')), JSON.stringify(nhap.buoc.map((b) => path.basename(b.khoa) + ':' + b.moTa)))

  // ── Xuat that ──
  const thuTuHienTai = await js("Array.from(document.querySelectorAll('.buoc-hang')).map(e => ({ k: e.dataset.khoa, m: e.querySelector('.mo-ta').value }))")
  async function xuatBam(id) {
    const truoc = new Set(fs.readdirSync(OUT))
    await bam('#' + id)
    const t0 = Date.now()
    while (Date.now() - t0 < 30000) {
      const tb = await js("document.getElementById('thong-bao').textContent")
      if (/Đã xuất|Không xuất/.test(tb)) return { tb, moi: fs.readdirSync(OUT).filter((f) => !truoc.has(f)) }
      await cho(100)
    }
    return { tb: 'het gio', moi: [] }
  }
  const xh = await xuatBam('xuat-html')
  ok('2.15 bam Xuat HTML: ra 1 file Huong-dan-cai-dat.html, thanh bao "Da xuat"', xh.moi.join() === 'Huong-dan-cai-dat.html' && /Đã xuất: Huong-dan-cai-dat.html/.test(xh.tb), xh.tb + ' / ' + xh.moi.join())
  const H = fs.readFileSync(path.join(OUT, 'Huong-dan-cai-dat.html'), 'utf8')
  const sect = H.split('<section class="buoc">').slice(1)
  ok('2.16 HTML co dung 5 buoc, DUNG THU TU sau khi keo, kem mo ta (da thoat ky tu)', sect.length === 5 && thuTuHienTai.every((b, i) => sect[i].includes('<span>' + xuatLib.thoatHtml(b.m) + '</span>')), sect.length + ' buoc')
  ok('2.17 mo ta co ky tu < > & " bi thoat trong HTML (khong the HTML that)', H.includes('Bam &lt;Luu&gt; &amp; dong') && !H.includes('<Luu>') && H.includes('&quot;Xuat WebP&quot;'))
  const nhungB64 = (i) => /base64,([A-Za-z0-9+/=]+)"/.exec(sect[i])[1]
  const idxP0 = thuTuHienTai.findIndex((b) => b.k === png[0])
  ok('2.18 anh PNG nho nhung NGUYEN byte (sha1 khop file goc)', sha(Buffer.from(nhungB64(idxP0), 'base64')) === sha(fs.readFileSync(png[0])))
  const idxW = thuTuHienTai.findIndex((b) => b.k === fWebp)
  ok('2.19 anh WebP nhung dung mime image/webp, nguyen byte', /data:image\/webp;base64/.test(sect[idxW]) && sha(Buffer.from(nhungB64(idxW), 'base64')) === sha(fs.readFileSync(fWebp)))
  const idxL = thuTuHienTai.findIndex((b) => b.k === fLon)
  const lonNhung = Buffer.from(nhungB64(idxL), 'base64')
  const szLon = nativeImage.createFromBuffer(lonNhung).getSize()
  ok('2.20 anh JPEG lon (' + (fs.statSync(fLon).size / 1048576).toFixed(1) + ' MB) duoc thu nho khi nhung: rong <= 1600, nhe hon goc it nhat 3 lan', szLon.width <= 1600 && szLon.width > 800 && lonNhung.length * 3 < fs.statSync(fLon).size, szLon.width + 'x' + szLon.height + ', ' + (lonNhung.length / 1024 | 0) + ' KB')
  ok('2.21 HTML la MOT file doc lap: khong link ngoai, khong script', !/src="(https?:|file:|\.)/.test(H) && !/<script/i.test(H) && !/<link /i.test(H))

  const xm = await xuatBam('xuat-md')
  const mdFile = path.join(OUT, 'Huong-dan-cai-dat.md')
  const M = fs.existsSync(mdFile) ? fs.readFileSync(mdFile, 'utf8') : ''
  ok('2.22 bam Markdown: ra .md + thu muc anh canh no', xm.moi.sort().join() === 'Huong-dan-cai-dat.md,Huong-dan-cai-dat_anh', xm.moi.join() + ' / ' + xm.tb)
  const dirMd = path.join(OUT, 'Huong-dan-cai-dat_anh')
  const dsMd = fs.existsSync(dirMd) ? fs.readdirSync(dirMd).sort() : []
  ok('2.23 thu muc anh co 5 file buoc-01..05 dung duoi (png / webp / jpg)', dsMd.length === 5 && dsMd.every((f, i) => f.startsWith('buoc-0' + (i + 1))) && dsMd.some((f) => f.endsWith('.webp')) && dsMd.some((f) => f.endsWith('.jpg')), dsMd.join())
  ok('2.24 anh trong thu muc nguyen byte so voi file goc (sha1); anh chi trong RAM duoc ghi ra PNG that 300x180', thuTuHienTai.every((b, i) => {
    const f = path.join(dirMd, dsMd[i]); if (!fs.existsSync(f)) return false
    if (b.k.startsWith('ram:')) { const s = nativeImage.createFromPath(f).getSize(); return /\.png$/.test(f) && s.width === 300 && s.height === 180 }
    return sha(fs.readFileSync(f)) === sha(fs.readFileSync(b.k))
  }), dsMd.join())
  ok('2.25 .md co 5 muc "## Buoc n", moi muc 1 anh tro dung thu muc, thu tu dung', (M.match(/^## Bước \d+/gm) || []).length === 5 && (M.match(/!\[Bước \d\]\(Huong-dan-cai-dat_anh\/buoc-0\d\.\w+\)/g) || []).length === 5 && thuTuHienTai.every((b, i) => M.includes('## Bước ' + (i + 1) + ': ' + xuatLib.thoatMd(b.m))), M.split('\n').slice(0, 6).join(' | '))

  const xp = await xuatBam('xuat-pdf')
  const pdfFile = path.join(OUT, 'Huong-dan-cai-dat.pdf')
  const P = fs.existsSync(pdfFile) ? fs.readFileSync(pdfFile) : Buffer.alloc(0)
  const trang = (P.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
  ok('2.26 bam PDF: ra file .pdf that (dau %PDF, du lon, ket thuc %%EOF)', P.length > 20000 && P.subarray(0, 5).toString() === '%PDF-' && /%%EOF\s*$/.test(P.toString('latin1').slice(-30)), P.length + ' byte, ' + xp.tb)
  ok('2.27 PDF co it nhat 2 trang (5 anh khong the nam trong 1 trang A4)', trang >= 2, trang + ' trang')
  ok('2.28 sau khi xuat: nut xuat mo lai, co duong "Mo thu muc"', await js("!document.getElementById('xuat-html').disabled && !document.getElementById('mo-thu-muc').hidden"))
  ok('2.29 file tam cua PDF da don (khong de rac trong thu muc tam he thong)', fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('aio-tailieu-' + process.pid + '-')).length === 0)

  // ── Dong / mo lai: khoi phuc ban nhap ──
  ghi('3. Dong roi mo lai')
  const tuaDe = await js("document.getElementById('tieu-doc').value")
  win.close(); await cho(400)
  fs.unlinkSync(png[1]) // mot file bien mat luc cua so dong
  const win2 = tl.mo()
  const wc2 = win2.webContents
  const js2 = (s) => wc2.executeJavaScript(s)
  const sanSang = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 8000) { try { if (await js2("document.querySelectorAll('.o-khay').length > 0")) return true } catch (e) {} await cho(80) } return false })()
  ok('3.1 mo lai: cua so len duoc', sanSang)
  await cho(800)
  const lai = await js2("({ tieuDe: document.getElementById('tieu-doc').value, buoc: Array.from(document.querySelectorAll('.buoc-hang')).map(e => ({ k: e.dataset.khoa, m: e.querySelector('.mo-ta').value })), tb: document.getElementById('thong-bao').textContent })")
  const ky = thuTuHienTai.filter((b) => !b.k.startsWith('ram:') && b.k !== png[1])
  ok('3.2 ban nhap khoi phuc: tieu de + thu tu + mo ta cua cac anh con (anh RAM va anh da xoa tu bo)', lai.tieuDe === tuaDe && JSON.stringify(lai.buoc) === JSON.stringify(ky), lai.buoc.length + ' buoc, ' + ky.length + ' mong doi')
  ok('3.3 file bien mat: co thong bao "1 anh khong con tren dia"', /1 ảnh không còn/.test(lai.tb), lai.tb)

  // ── Chuan giao dien (giong man Cai dat) ──
  ghi('4. Chuan giao dien')
  const css = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'tai-lieu', 'tai-lieu.css'), 'utf8')
  ok('4.1 CSS rieng khong khai :root (bo qua chu thich)', !/:root/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')))
  const kieu = await js2(`(() => { const cs = (e) => getComputedStyle(document.querySelector(e)); return {
    headerH: document.getElementById('tieu-de').getBoundingClientRect().height, body: cs('body').fontFamily, nut: cs('#xuat-html').fontFamily, o: cs('#tieu-doc').fontFamily,
    chinh: document.querySelectorAll('.nut.chinh').length, nutH: document.getElementById('xuat-md').getBoundingClientRect().height, bg: cs('#xuat-html').backgroundColor, bgMd: cs('#xuat-md').backgroundColor } })()`)
  ok('4.2 header cao 46px nhu man Cai dat', Math.round(kieu.headerH) === 46, kieu.headerH + 'px')
  ok('4.3 nut + o nhap ke thua font cua trang (khong bi Arial)', kieu.nut === kieu.body && kieu.o === kieu.body, kieu.nut)
  ok('4.4 chi MOT nut chinh (cam): Xuat HTML; hai nut kia khong cam', kieu.chinh === 1 && kieu.bg !== kieu.bgMd, kieu.bg + ' vs ' + kieu.bgMd)
  const tran = await js2("({ ngang: document.documentElement.scrollWidth <= window.innerWidth, doc: document.documentElement.scrollHeight <= window.innerHeight + 1 })")
  ok('4.5 khong tran trang (khong thanh cuon cua ca trang)', tran.ngang && tran.doc, JSON.stringify(tran))
  try { fs.writeFileSync(path.join(RA_DIR, 'do-tai-lieu-cuaso.png'), (await wc2.capturePage()).toPNG()) } catch (e) {}

  /* ── 5. Thanh tren cua khay co them nut thu 6 ────────────────────── */
  ghi('5. Khay: nut "Xuat tai lieu" va tieu de khay doc (252 px)')
  ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Ctrl+Shift+S' })
  ipcMain.on('khay:kieu', (e) => { e.returnValue = 'doc' })
  const shelfWin = new BrowserWindow({ show: false, width: 252, height: 448, frame: false, webPreferences: { preload: path.join(__dirname, '..', '..', 'src', 'preload-shelf.js'), contextIsolation: true, sandbox: false } })
  await shelfWin.loadFile(path.join(__dirname, '..', '..', 'src', 'shelf', 'index.html'))
  await cho(500)
  const dem = []
  ipcMain.on('shelf:open-tai-lieu', () => dem.push(1))
  const swc = shelfWin.webContents
  const dem1 = await swc.executeJavaScript(`(() => { const t = document.getElementById('title'); const bar = document.getElementById('bar').getBoundingClientRect(); const bs = Array.from(document.querySelectorAll('#bar button')).map(b => b.getBoundingClientRect());
    return { tieuDe: t.textContent, tw: t.getBoundingClientRect().width, scroll: t.scrollWidth, client: t.clientWidth, nut: bs.length, phaiNhat: Math.max(...bs.map(r => r.right)), barRight: bar.right, trai: Math.min(...bs.map(r => r.left)), tieuDePhai: t.getBoundingClientRect().right, body: document.body.className, tip: document.getElementById('tai-lieu') && document.getElementById('tai-lieu').title } })()`)
  ok('5.1 co nut #tai-lieu va tooltip dich duoc', dem1.nut >= 6 && /tài liệu/i.test(dem1.tip || ''), JSON.stringify({ nut: dem1.nut, tip: dem1.tip }))
  ok('5.2 khay doc 252 px: tieu de "' + dem1.tieuDe + '" KHONG bi cat (scrollWidth <= clientWidth), khong de len nut', dem1.scroll <= dem1.client + 1 && dem1.tieuDePhai <= dem1.trai + 1, 'rong ' + Math.round(dem1.tw) + ' px, chu ' + dem1.scroll + ' px')
  ok('5.3 hang nut nam tron trong thanh tren (khong tran ra phai)', dem1.phaiNhat <= dem1.barRight + 1, Math.round(dem1.phaiNhat) + ' <= ' + Math.round(dem1.barRight))
  // bam that bang chuot: nut tai-lieu gui lenh sang main
  const pn = await swc.executeJavaScript("(() => { const r = document.getElementById('tai-lieu').getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)] })()")
  swc.sendInputEvent({ type: 'mouseMove', x: pn[0], y: pn[1] })
  swc.sendInputEvent({ type: 'mouseDown', x: pn[0], y: pn[1], button: 'left', clickCount: 1 })
  swc.sendInputEvent({ type: 'mouseUp', x: pn[0], y: pn[1], button: 'left', clickCount: 1 })
  await cho(300)
  ok('5.4 bam chuot that vao nut: main nhan DUNG 1 lenh shelf:open-tai-lieu', dem.length === 1, 'nhan ' + dem.length)
  // doi chung: bo nut thi tieu de rong hon (chung to nut co anh huong that)
  const rongHon = await swc.executeJavaScript(`(() => { const t = document.getElementById('title'); const a = t.getBoundingClientRect().right; document.getElementById('tai-lieu').style.display = 'none'; const b = Array.from(document.querySelectorAll('#bar button')).filter(x => x.style.display !== 'none').map(x => x.getBoundingClientRect().left); return { truoc: a, trai: Math.min(...b) } })()`)
  ok('5.5 DOI CHUNG: phep do chi huong vao khoang giua tieu de va nut (an nut thi khoang cach tang)', rongHon.trai > dem1.trai, Math.round(dem1.trai) + ' -> ' + Math.round(rongHon.trai))
  try { fs.writeFileSync(path.join(RA_DIR, 'do-tai-lieu-khay.png'), (await swc.capturePage()).toPNG()) } catch (e) {}
  shelfWin.destroy()

  webp.tat()
  ghi('\nTONG: ' + dat + ' dat, ' + truot + ' truot')
  try { win2.destroy() } catch (e) {}
  try { fs.rmSync(TMP, { recursive: true, force: true }) } catch (e) {}
  app.exit(truot ? 1 : 0)
})
