'use strict'

/* =========================================================================
   tai-lieu-main.js — XUAT TAI LIEU TUNG BUOC TU ANH TRONG KHAY (06/11/2026, ROADMAP 0k #7). Phan tien trinh chinh.
   Nut tren khay mo cua so rieng (src/tai-lieu/): chon anh trong khay (hoac them anh tu may), keo doi thu tu, go MOT dong mo ta moi
   buoc, roi xuat HTML (mot file, anh nhung ben trong) · Markdown (file .md + thu muc anh canh no) · PDF (printToPDF cua Chromium).
   Chua tung xuat anh CHUA luu (khay giu anh chi trong RAM) ra file that: luc xuat se ghi PNG tu RAM.
   LUAT: khong dung vao anh goc (chi DOC); file xuat do nguoi dung chon noi luu qua hop thoai; Markdown chi ghi buoc-NN.<duoi> vao
   thu muc anh cua chinh no. Ban nhap (tieu de, thu tu, mo ta) luu o userData/tai-lieu/nhap.json bang ghiBen.
   Doi chung / kiem tu dong: bien AIO_TAI_LIEU_DICH_THU (thu muc dich, bo hop thoai luu) va AIO_TAI_LIEU_CHON_THU (JSON mang duong dan,
   bo hop thoai chon anh) — CHI de bai do.
   ========================================================================= */

const path = require('path')
const fs = require('fs')
const os = require('os')
const { ghiBen } = require('./ghi-ben')
const xuatLib = require('./tai-lieu-xuat')

const MIME_TU_DUOI = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
const NGUONG_NHUNG = 1.2 * 1048576 // anh lon hon: thu nho ve rong <= 1600 va luu JPEG khi nhung vao HTML / PDF
const TOI_DA_BUOC = 200

/**
 * deps: { ipcMain, BrowserWindow, screen, dialog, shell, nativeImage, app, kho, ghiLog, icon, moiDesktop, lang: () => 'vi'|'en',
 *         layKhay: () => [{ id, filePath, thumb, w, h, image }], thuMucDuLieu, batDauKeo, keoDen, ketThucKeo, hien (mac dinh true) }
 * Tra { mo(), cuaSo(), xuat(d), lay(), _luuNhap }
 */
function khoiTao(deps) {
  const { ipcMain, BrowserWindow, screen, dialog, shell, nativeImage } = deps
  const log = deps.ghiLog || (() => {})
  const T = (k) => require('./i18n').t(deps.lang(), k)
  let win = null
  const rieng = new Map() // khoa -> { khoa, ten, thumb, w, h } cho anh them tu may
  const fileNhap = () => path.join(deps.thuMucDuLieu, 'nhap.json')
  const khoaDuong = (p) => { const x = path.resolve(String(p)); return process.platform === 'win32' ? x.toLowerCase() : x }
  /* 06/11 (Codex soat dot 3): anh vua doi ten (tu dat ten) — ban nhap + cua so dang mo van co the cam duong dan CU. doiKhoa nho "cu -> moi"
     trong phien nay de luu nhap / xuat / nap lai luon dung ten moi (khong rot buoc, khong mat mo ta). */
  const doiKhoa = new Map()
  const giaiKhoa = (khoa) => {
    if (typeof khoa !== 'string' || khoa.startsWith('ram:')) return khoa
    let k = khoa
    for (let n = 0; n < 20; n++) { const m = doiKhoa.get(khoaDuong(k)); if (!m || khoaDuong(m) === khoaDuong(k)) break; k = m }
    return k
  }

  const laCuaSoNay = (e) => win && !win.isDestroyed() && e.sender.id === win.webContents.id

  /* ── ban nhap ── */
  function docNhap() {
    try {
      const j = JSON.parse(fs.readFileSync(fileNhap(), 'utf8'))
      return {
        tieuDe: typeof j.tieuDe === 'string' ? j.tieuDe.slice(0, 120) : '',
        buoc: (Array.isArray(j.buoc) ? j.buoc : []).slice(0, TOI_DA_BUOC).filter((b) => b && typeof b.khoa === 'string').map((b) => ({ khoa: giaiKhoa(b.khoa.slice(0, 1000)), moTa: typeof b.moTa === 'string' ? b.moTa.slice(0, 200) : '' })),
      }
    } catch (e) { return { tieuDe: '', buoc: [] } }
  }
  function luuNhap(d) {
    try {
      const tieuDe = d && typeof d.tieuDe === 'string' ? d.tieuDe.slice(0, 120) : ''
      const buoc = (d && Array.isArray(d.buoc) ? d.buoc : []).slice(0, TOI_DA_BUOC).filter((b) => b && typeof b.khoa === 'string' && !b.khoa.startsWith('ram:'))
        .map((b) => ({ khoa: giaiKhoa(b.khoa.slice(0, 1000)), moTa: typeof b.moTa === 'string' ? b.moTa.slice(0, 200) : '' })) // anh chua luu (ram:) khong ghi nho qua lan mo app
      fs.mkdirSync(deps.thuMucDuLieu, { recursive: true })
      ghiBen(fileNhap(), JSON.stringify({ v: 1, tieuDe, buoc }))
      return true
    } catch (e) { log('tai-lieu: KHONG GHI DUOC ban nhap ' + ((e && e.code) || e)); return false }
  }

  /* ── anh ── */
  const khoaCua = (it) => (it.filePath || 'ram:' + it.id)
  const tenCua = (khoa) => (khoa.startsWith('ram:') ? 'anh-' + khoa.slice(4) : path.basename(khoa))
  function muckhay() {
    const kq = []
    for (const it of deps.layKhay()) {
      if (it.filePath && !fs.existsSync(it.filePath)) continue // file da xoa / dời di ngoai app: khong cho chon (khong xuat duoc)
      kq.push({ khoa: khoaCua(it), ten: tenCua(khoaCua(it)), thumb: it.thumb, w: it.w, h: it.h })
    }
    for (const k of rieng.values()) if (!kq.some((x) => x.khoa === k.khoa)) kq.push(k)
    return kq
  }
  async function thuNhoFile(khoa) {
    const img = await deps.kho.docAnhFile(khoa)
    if (!img) return null
    const sz = img.getSize()
    const nho = img.resize({ height: Math.min(sz.height, 128), quality: 'good' })
    return { khoa, ten: path.basename(khoa), thumb: 'data:image/jpeg;base64,' + nho.toJPEG(82).toString('base64'), w: sz.width, h: sz.height }
  }
  /** Byte that cua mot anh de xuat: { buf, mime, ext } hoac null. */
  function docByte(khoa) {
    try {
      if (khoa.startsWith('ram:')) {
        const it = deps.layKhay().find((x) => String(x.id) === khoa.slice(4))
        if (!it || !it.image || it.image.isEmpty()) return null
        return { buf: it.image.toPNG(), mime: 'image/png', ext: 'png' }
      }
      const ext = path.extname(khoa).toLowerCase()
      const mime = MIME_TU_DUOI[ext]
      if (!mime) return null
      return { buf: fs.readFileSync(khoa), mime, ext: ext === '.jpeg' ? 'jpg' : ext.slice(1) }
    } catch (e) { return null }
  }
  /** Ban de NHUNG vao HTML / PDF: anh lon thi thu nho + JPEG. */
  async function banNhung(b) {
    if (b.buf.length <= NGUONG_NHUNG) return { mime: b.mime, base64: b.buf.toString('base64') }
    try {
      const goc = b.mime === 'image/webp' ? await require('./webp').giaiMa(b.buf) : nativeImage.createFromBuffer(b.buf)
      if (goc && !goc.isEmpty()) {
        const sz = goc.getSize()
        const nho = sz.width > 1600 ? goc.resize({ width: 1600, quality: 'good' }) : goc
        return { mime: 'image/jpeg', base64: nho.toJPEG(85).toString('base64') }
      }
    } catch (e) {}
    return { mime: b.mime, base64: b.buf.toString('base64') }
  }

  /* ── du lieu cho cua so ── */
  async function lay() {
    const nhap = docNhap()
    const ds = muckhay()
    const theoKhoa = new Map(ds.map((k) => [k.khoa, k]))
    const buoc = []
    let mat = 0
    for (const b of nhap.buoc) {
      let k = theoKhoa.get(b.khoa)
      if (!k && !b.khoa.startsWith('ram:')) {
        if (fs.existsSync(b.khoa)) {
          k = rieng.get(b.khoa) || await thuNhoFile(b.khoa)
          if (k) { rieng.set(b.khoa, k); theoKhoa.set(b.khoa, k); ds.push(k) }
        }
      }
      if (k && !b.khoa.startsWith('ram:') && !fs.existsSync(b.khoa)) k = null // anh da xoa sau khi luu ban nhap
      if (!k) { mat++; continue }
      buoc.push({ khoa: k.khoa, ten: k.ten, thumb: k.thumb, moTa: b.moTa })
    }
    if (mat) luuNhap({ tieuDe: nhap.tieuDe, buoc: buoc.map((x) => ({ khoa: x.khoa, moTa: x.moTa })) })
    return { tieuDe: nhap.tieuDe, khay: ds, buoc, anhMat: mat }
  }

  /* ── xuat ── */
  const DUOI = { html: 'html', md: 'md', pdf: 'pdf' }
  async function chonDich(kieu, ten) {
    const thu = process.env.AIO_TAI_LIEU_DICH_THU
    if (thu) return path.join(thu, ten + '.' + DUOI[kieu])
    const ts = { html: 'tl.hopThoaiHtml', md: 'tl.hopThoaiMd', pdf: 'tl.hopThoaiPdf' }
    const r = await dialog.showSaveDialog(win && !win.isDestroyed() ? win : undefined, {
      title: T(ts[kieu]),
      defaultPath: path.join(deps.app.getPath('documents'), ten + '.' + DUOI[kieu]),
      filters: [{ name: DUOI[kieu].toUpperCase(), extensions: [DUOI[kieu]] }],
    })
    return r.canceled || !r.filePath ? null : r.filePath
  }
  async function ghiPdf(html, dich) {
    const tam = path.join(os.tmpdir(), 'aio-tailieu-' + process.pid + '-' + Date.now() + '.html')
    fs.writeFileSync(tam, html)
    const w = new BrowserWindow({ show: false, width: 900, height: 1200, webPreferences: { sandbox: true, contextIsolation: true, javascript: false } })
    try {
      await w.loadFile(tam)
      const pdf = await w.webContents.printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'default' } })
      ghiBen(dich, pdf)
      return pdf.length
    } finally {
      try { w.destroy() } catch (e) {}
      try { fs.unlinkSync(tam) } catch (e) {}
    }
  }

  /* ── xuat Markdown: anh nam trong thu muc `<ten>_anh` canh file .md ──
     06/11 (Codex soat dot 3): (1) KHONG BAO GIO ghi de file khong phai cua minh: gap ten anh da co (anh nguon vua nhap, tai lieu khac)
     thi doi sang thu muc `<ten>_anh_2`, `_3`... (2) xuat lai cung file .md: anh do CHINH luot truoc ghi ra (xuat-md.json) ma buoc moi
     khong dung nua thi bi go — khong de anh da bo (co the chua thong tin rieng) nam lai trong thu muc dem gui di. */
  const fileXuatMd = () => path.join(deps.thuMucDuLieu, 'xuat-md.json')
  function docXuatMd() {
    try { const j = JSON.parse(fs.readFileSync(fileXuatMd(), 'utf8')); return j && j.v === 1 && j.ds && typeof j.ds === 'object' ? j.ds : {} } catch (e) { return {} }
  }
  function luuXuatMd(ds) {
    const khoa = Object.keys(ds)
    if (khoa.length > 60) for (const k of khoa.slice(0, khoa.length - 60)) delete ds[k]
    fs.mkdirSync(deps.thuMucDuLieu, { recursive: true })
    ghiBen(fileXuatMd(), JSON.stringify({ v: 1, ds }))
  }
  function ghiMarkdown(dich, tieuDe, lang, dau) {
    const ten = path.basename(dich, path.extname(dich))
    const dirMd = path.dirname(dich)
    const ds = docXuatMd()
    const kd = khoaDuong(dich)
    const truoc = Array.isArray(ds[kd]) ? ds[kd].filter((x) => typeof x === 'string') : []
    const cuaTruoc = new Set(truoc.map(khoaDuong))
    const buocMd = dau.map((x) => ({ moTa: x.moTa, mime: x.mime }))
    let thuMucAnh = ten + '_anh', dirAnh = null, res = null
    for (let lan = 1; lan < 100; lan++) {
      if (lan > 1) thuMucAnh = ten + '_anh_' + lan
      res = xuatLib.taoMarkdown({ tieuDe, lang, thuMucAnh, buoc: buocMd })
      dirAnh = path.join(dirMd, thuMucAnh)
      const dung = res.tenAnh.some((n) => { const f = path.join(dirAnh, n); return fs.existsSync(f) && !cuaTruoc.has(khoaDuong(f)) })
      if (!dung) break
      res = null
    }
    if (!res) throw new Error('khong tim duoc thu muc anh trong de ghi')
    const moi = res.tenAnh.map((n) => path.join(dirAnh, n))
    const setMoi = new Set(moi.map(khoaDuong))
    ds[kd] = Array.from(new Set(truoc.concat(moi))) // ghi danh sach TRUOC khi ghi anh: tat dien giua chung van biet file nao la cua minh
    luuXuatMd(ds)
    fs.mkdirSync(dirAnh, { recursive: true })
    dau.forEach((x, i) => { fs.writeFileSync(moi[i], x.buf) })
    ghiBen(dich, res.md)
    for (const f of truoc) {
      if (setMoi.has(khoaDuong(f))) continue
      try { fs.unlinkSync(f) } catch (e) { if (e && e.code !== 'ENOENT') log('tai-lieu: KHONG go duoc anh cu ' + path.basename(f) + ': ' + e.code) }
      try { fs.rmdirSync(path.dirname(f)) } catch (e) {} // chi go duoc khi thu muc da RONG
    }
    ds[kd] = moi
    luuXuatMd(ds)
    return Buffer.byteLength(res.md)
  }

  /** d = { kieu, tieuDe, buoc: [{ khoa, moTa }] } -> { ok, duong, ten, soBuoc } | { huy: true } | { ok: false, loi } */
  async function xuat(d) {
    try {
      const kieu = d && DUOI[d.kieu] ? d.kieu : null
      if (!kieu) return { ok: false, loi: 'kieu-khong-ho-tro' }
      const dau = []
      let khongDoc = 0
      for (const b of (Array.isArray(d.buoc) ? d.buoc : []).slice(0, TOI_DA_BUOC)) {
        if (!b || typeof b.khoa !== 'string') continue
        const x = docByte(giaiKhoa(b.khoa))
        if (x) dau.push(Object.assign({ moTa: String(b.moTa == null ? '' : b.moTa).slice(0, 200) }, x)); else khongDoc++
      }
      if (!dau.length && !khongDoc) return { ok: false, loi: T('tl.thieuBuoc') }
      // Co buoc ma anh khong doc duoc (file bi xoa / dời): KHONG xuat tai lieu thieu buoc trong im lang
      if (khongDoc) return { ok: false, loi: T('tl.anhMat').replace('{n}', String(khongDoc)) }
      const lang = deps.lang()
      const tieuDe = String(d.tieuDe == null ? '' : d.tieuDe).slice(0, 120)
      const base = xuatLib.tenFileTuTieuDe(tieuDe, 'tai-lieu')
      const dich = await chonDich(kieu, base)
      if (!dich) return { huy: true }
      fs.mkdirSync(path.dirname(dich), { recursive: true })
      let ghi = 0
      if (kieu === 'md') {
        ghi = ghiMarkdown(dich, tieuDe, lang, dau)
      } else {
        const nhung = []
        for (const x of dau) { const n = await banNhung(x); nhung.push({ moTa: x.moTa, mime: n.mime, base64: n.base64 }) }
        const html = xuatLib.taoHtml({ tieuDe, lang, buoc: nhung })
        if (kieu === 'html') { ghiBen(dich, html); ghi = Buffer.byteLength(html) } else ghi = await ghiPdf(html, dich)
      }
      log('tai-lieu: xuat ' + kieu + ' ' + dau.length + ' buoc -> ' + path.basename(dich) + ' (' + ghi + ' byte)')
      return { ok: true, duong: dich, ten: path.basename(dich), soBuoc: dau.length, byte: ghi }
    } catch (e) {
      log('tai-lieu: xuat LOI ' + ((e && e.stack) || e))
      return { ok: false, loi: (e && e.message) || String(e) }
    }
  }

  /** File anh vua doi ten (cu -> moi): ban nhap, anh them tu may, cua so dang mo. Tra so buoc ban nhap da doi. */
  function doiTen(cu, moi) {
    if (typeof cu !== 'string' || typeof moi !== 'string' || !cu || !moi) return 0
    const kc = khoaDuong(cu)
    if (kc === khoaDuong(moi)) return 0
    let doi = 0
    try {
      const nhap = docNhap() // doc TRUOC khi nho "cu -> moi": docNhap tu giai khoa nen neu nho truoc se khong thay buoc nao can ghi lai
      const buoc = nhap.buoc.map((b) => {
        if (!b.khoa.startsWith('ram:') && khoaDuong(b.khoa) === kc) { doi++; return { khoa: moi, moTa: b.moTa } }
        return b
      })
      doiKhoa.set(kc, moi)
      if (doi) luuNhap({ tieuDe: nhap.tieuDe, buoc })
    } catch (e) { doiKhoa.set(kc, moi); log('tai-lieu: doiTen LOI ' + ((e && e.message) || e)) }
    for (const [k, v] of Array.from(rieng.entries())) {
      if (khoaDuong(k) !== kc) continue
      rieng.delete(k); rieng.set(moi, Object.assign({}, v, { khoa: moi, ten: path.basename(moi) }))
    }
    if (win && !win.isDestroyed()) { try { win.webContents.send('tl:doi-khoa', cu, moi) } catch (e) {} }
    return doi
  }

  /* ── IPC ── */
  ipcMain.handle('tl:lay', async (e) => (laCuaSoNay(e) ? lay() : null))
  ipcMain.handle('tl:luu-nhap', (e, d) => (laCuaSoNay(e) ? luuNhap(d) : false))
  ipcMain.handle('tl:xuat', async (e, d) => (laCuaSoNay(e) ? xuat(d) : { ok: false, loi: 'sender' }))
  ipcMain.handle('tl:them-file', async (e) => {
    if (!laCuaSoNay(e)) return null
    let ds = null
    if (process.env.AIO_TAI_LIEU_CHON_THU) { try { ds = JSON.parse(process.env.AIO_TAI_LIEU_CHON_THU) } catch (err) { ds = null } }
    else {
      const r = await dialog.showOpenDialog(win, { title: T('tl.hopThoaiAnh'), properties: ['openFile', 'multiSelections'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] })
      ds = r.canceled ? [] : r.filePaths
    }
    const kq = []
    for (const f of (Array.isArray(ds) ? ds : []).slice(0, 50)) {
      if (typeof f !== 'string' || !MIME_TU_DUOI[path.extname(f).toLowerCase()] || !fs.existsSync(f)) continue
      const k = rieng.get(f) || await thuNhoFile(f)
      if (k) { rieng.set(f, k); kq.push(k) }
    }
    return { ds: kq }
  })
  ipcMain.on('tl:mo-thu-muc', (e, p) => { if (laCuaSoNay(e) && typeof p === 'string' && fs.existsSync(p)) shell.showItemInFolder(p) })
  ipcMain.on('tl:close', (e) => { if (laCuaSoNay(e)) win.close() })
  ipcMain.on('tl:drag-start', (e) => { if (laCuaSoNay(e) && deps.batDauKeo) deps.batDauKeo(win, e.sender.id) })
  ipcMain.on('tl:drag-to', (e, dx, dy) => { if (laCuaSoNay(e) && deps.keoDen) deps.keoDen(win, e.sender.id, dx, dy) })
  ipcMain.on('tl:drag-end', (e) => { if (deps.ketThucKeo) deps.ketThucKeo(e.sender.id) })

  function mo() {
    if (win && !win.isDestroyed()) {
      if (deps.hien !== false) { win.show(); win.focus() }
      win.webContents.send('tl:lam-moi')
      return win
    }
    const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    const w = Math.min(980, Math.round(wa.width * 0.9))
    const h = Math.min(660, Math.round(wa.height * 0.85))
    win = new BrowserWindow({
      x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2),
      width: w, height: h, minWidth: 760, minHeight: 520,
      frame: false, show: false, title: 'AiO Shot & Save', backgroundColor: '#181818', icon: deps.icon,
      webPreferences: { preload: path.join(__dirname, 'preload-tai-lieu.js'), contextIsolation: true, sandbox: false },
    })
    win.setAlwaysOnTop(true, 'screen-saver') // anh ghim nam o cap 'screen-saver': cua so nay phai noi tren no
    if (deps.moiDesktop) deps.moiDesktop(win, 'tai lieu')
    win.loadFile(path.join(__dirname, 'tai-lieu', 'index.html'))
    win.once('ready-to-show', () => { if (deps.hien !== false && win) win.show() })
    win.on('focus', () => { try { win.webContents.send('tl:lam-moi') } catch (e) {} })
    win.on('closed', () => { win = null })
    return win
  }

  return { mo, cuaSo: () => win, xuat, lay, luuNhap, docByte, doiTen }
}

module.exports = { khoiTao }
