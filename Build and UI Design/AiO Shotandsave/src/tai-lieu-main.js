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

  const laCuaSoNay = (e) => win && !win.isDestroyed() && e.sender.id === win.webContents.id

  /* ── ban nhap ── */
  function docNhap() {
    try {
      const j = JSON.parse(fs.readFileSync(fileNhap(), 'utf8'))
      return {
        tieuDe: typeof j.tieuDe === 'string' ? j.tieuDe.slice(0, 120) : '',
        buoc: (Array.isArray(j.buoc) ? j.buoc : []).slice(0, TOI_DA_BUOC).filter((b) => b && typeof b.khoa === 'string').map((b) => ({ khoa: b.khoa.slice(0, 1000), moTa: typeof b.moTa === 'string' ? b.moTa.slice(0, 200) : '' })),
      }
    } catch (e) { return { tieuDe: '', buoc: [] } }
  }
  function luuNhap(d) {
    try {
      const tieuDe = d && typeof d.tieuDe === 'string' ? d.tieuDe.slice(0, 120) : ''
      const buoc = (d && Array.isArray(d.buoc) ? d.buoc : []).slice(0, TOI_DA_BUOC).filter((b) => b && typeof b.khoa === 'string' && !b.khoa.startsWith('ram:'))
        .map((b) => ({ khoa: b.khoa.slice(0, 1000), moTa: typeof b.moTa === 'string' ? b.moTa.slice(0, 200) : '' })) // anh chua luu (ram:) khong ghi nho qua lan mo app
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

  /** d = { kieu, tieuDe, buoc: [{ khoa, moTa }] } -> { ok, duong, ten, soBuoc } | { huy: true } | { ok: false, loi } */
  async function xuat(d) {
    try {
      const kieu = d && DUOI[d.kieu] ? d.kieu : null
      if (!kieu) return { ok: false, loi: 'kieu-khong-ho-tro' }
      const dau = []
      let khongDoc = 0
      for (const b of (Array.isArray(d.buoc) ? d.buoc : []).slice(0, TOI_DA_BUOC)) {
        if (!b || typeof b.khoa !== 'string') continue
        const x = docByte(b.khoa)
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
        const ten = path.basename(dich, path.extname(dich))
        const thuMucAnh = ten + '_anh'
        const { md, tenAnh } = xuatLib.taoMarkdown({ tieuDe, lang, thuMucAnh, buoc: dau.map((x) => ({ moTa: x.moTa, mime: x.mime })) })
        const dirAnh = path.join(path.dirname(dich), thuMucAnh)
        fs.mkdirSync(dirAnh, { recursive: true })
        dau.forEach((x, i) => { fs.writeFileSync(path.join(dirAnh, tenAnh[i]), x.buf) })
        ghiBen(dich, md)
        ghi = Buffer.byteLength(md)
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

  return { mo, cuaSo: () => win, xuat, lay, luuNhap, docByte }
}

module.exports = { khoiTao }
