'use strict'
/* SUA VIDEO (06/11, anh giao 3 tinh nang lam chung MOT man): mo tu the video trong Khay video.
   1. Cat dau cuoi (hai tay nam tren thanh thoi gian, xem truoc, gui dung doan can).
   2. Tu phong to theo con tro (file phu `<video>.contro.json` ghi luc quay, src/con-tro-quay.js; may quay src/sua-video/may-quay.js).
   3. Nen va khung (nen chuyen sac / mau / mo, le, bo goc, bong; bo nen cua Lam dep).
   Xuat ra file MOI canh video goc (`<ten>-da-sua.mp4`, khong bao gio de len file nao); file goc KHONG bi dung toi.

   Phan nay la phan cua MAIN (giong src/xuat-gif.js): cua so Sua video (src/sua-video/, nhin thay) + cua so AN xuat
   (src/sua-xuat/) ve lai TUNG KHUNG qua canvas, gui byte file moi ve day -> ghi vao `<dich>.tam` (ghi theo VI TRI vi bo ghep
   MP4 quay lai sua dau hop) -> kiem cau truc -> moi doi ten thanh `<dich>`. Hong / huy thi xoa file tam: khong bao gio de lai
   mot file do mang ten that. Mot luc chi MOT viec xuat. */
const { BrowserWindow, ipcMain, screen, shell, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const conTroQuay = require('./con-tro-quay')
const SuaRender = require('./sua-video/render')

const HET_GIO_MS = 30 * 60 * 1000
const MUC = ['nhe', 'vua', 'manh']
let ch = { ghiLog: () => {}, moiDesktop: () => {}, tim: () => null, keoAnToan: (f) => f, thuMuc: () => '', trangChu: null }
let viec = null // { nguon, dich, tam, fd, win, max, tuyChon, conTro, tienDo, ketThuc, hen, t0, idVideo, sender }
let cuaSo = null // { win, id }
const daXuat = new Set() // file moi do phien nay tao (chi nhung file nay moi duoc keo / mo thu muc tu man Sua video)

/* opts: { ghiLog, moiDesktop(win, ten), tim(id) -> muc cua kho-video | null, keoAnToan(file) -> duong dan keo duoc } */
function khoiTao(opts) { ch = Object.assign(ch, opts || {}) }
function dangBan() { return !!viec }

/* ---------- cua so AN xuat ---------- */
ipcMain.handle('sua:viec', (e) => {
  if (!viec || !viec.win || viec.win.isDestroyed() || e.sender !== viec.win.webContents) return null
  return { nguon: viec.nguon, tuyChon: viec.tuyChon, conTro: viec.conTro }
})
const cuaViec = (e) => viec && viec.win && !viec.win.isDestroyed() && e.sender === viec.win.webContents
ipcMain.on('sua:ghi', (e, viTri, u8) => {
  if (!cuaViec(e) || viec.hong) return
  try {
    if (!Number.isInteger(viTri) || viTri < 0) throw new Error('vi tri ghi khong hop le')
    const b = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
    fs.writeSync(viec.fd, b, 0, b.length, viTri)
    if (viTri + b.length > viec.max) viec.max = viTri + b.length
  } catch (err) { viec.hong = 'ghi file: ' + err.message; ket({ ok: false, loi: viec.hong }) }
})
ipcMain.on('sua:tien-do', (e, p) => { if (cuaViec(e) && viec.tienDo) { try { viec.tienDo(Math.max(0, Math.min(1, Number(p) || 0))) } catch (err) {} } })
ipcMain.on('sua:xong', (e, tt) => { if (cuaViec(e)) ket({ ok: true, tt: tt || {} }) })
ipcMain.on('sua:loi', (e, chuoi) => { if (cuaViec(e)) ket({ ok: false, loi: String(chuoi) }) })

/* File MP4 moi phai co du ftyp + moov + mdat, cac hop noi tiep dung het file (ghi theo vi tri thi de co lo hong). */
function kiemCauTruc(file) {
  const fd = fs.openSync(file, 'r')
  try {
    const het = fs.fstatSync(fd).size
    const co = {}
    let pos = 0
    const b = Buffer.alloc(16)
    while (pos + 8 <= het) {
      fs.readSync(fd, b, 0, 16, pos)
      let n = b.readUInt32BE(0)
      const t = b.toString('latin1', 4, 8)
      if (n === 1) n = Number(b.readBigUInt64BE(8))
      if (n < 8 || pos + n > het) throw new Error('hop ' + t + ' o ' + pos + ' dai ' + n + ' vuot file ' + het)
      co[t] = (co[t] || 0) + 1
      pos += n
    }
    if (pos !== het) throw new Error('cac hop khong phu het file (' + pos + '/' + het + ')')
    if (!co.ftyp || !co.moov || !co.mdat) throw new Error('thieu hop: ' + ['ftyp', 'moov', 'mdat'].filter((k) => !co[k]).join(','))
    return co
  } finally { fs.closeSync(fd) }
}

function ket(kq) {
  const v = viec
  if (!v) return
  viec = null
  clearTimeout(v.hen)
  try { fs.closeSync(v.fd) } catch (e) {}
  if (v.win && !v.win.isDestroyed()) v.win.destroy()
  let ra
  if (kq.ok) {
    try {
      const st = fs.statSync(v.tam)
      if (!st.size || st.size !== v.max || st.size !== (kq.tt.bytes || 0)) throw new Error('so byte lech: file ' + st.size + ', ghi toi ' + v.max + ', trang bao ' + kq.tt.bytes)
      kiemCauTruc(v.tam)
      if (fs.existsSync(v.dich)) throw new Error('file dich da ton tai (khong de len): ' + v.dich)
      fs.renameSync(v.tam, v.dich)
      daXuat.add(v.dich)
      ra = { ok: true, file: v.dich, ten: path.basename(v.dich), bytes: st.size, khung: kq.tt.khung | 0, khungDuKien: kq.tt.khungDuKien | 0, w: kq.tt.w | 0, h: kq.tt.h | 0, ms: kq.tt.ms | 0, tieng: !!kq.tt.tieng, goiTieng: kq.tt.goiTieng | 0, codec: kq.tt.codec || '', msLam: Date.now() - v.t0 }
    } catch (e) { ra = { ok: false, loi: 'chot file: ' + e.message } }
  } else ra = { ok: false, loi: kq.loi || 'khong ro' }
  if (!ra.ok) { try { fs.unlinkSync(v.tam) } catch (e) {} }
  ch.ghiLog('sua-video ' + path.basename(v.nguon) + ': ' + (ra.ok
    ? 'xong ' + ra.msLam + ' ms, ' + ra.khung + ' khung ' + ra.w + 'x' + ra.h + ', ' + Math.round(ra.bytes / 1024) + ' KB' + (ra.tieng ? ' +tieng(' + ra.goiTieng + ' goi)' : '') + ' -> ' + path.basename(v.dich)
    : 'LOI ' + ra.loi))
  v.ketThuc(ra)
}

/* Chuan hoa tuy chon tu man Sua video (khong tin so lieu tu trang). */
function chuanTuyChon(t, coTieng) {
  t = t || {}
  const so = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0)
  const z = t.zoom || {}
  return {
    tuMs: Math.max(0, so(t.tuMs)), denMs: Math.max(0, so(t.denMs)),
    giuTieng: coTieng && t.giuTieng !== false,
    zoom: { bat: !!z.bat, muc: MUC.indexOf(z.muc) >= 0 ? z.muc : 'vua' },
    nen: SuaRender.chuanHoa(t.nen),
  }
}

/* nguon: .mp4 do app quay · dich: duong dan se tao (KHONG duoc ton tai) · tuyChon: xem chuanTuyChon · conTro: doi tuong cua
   con-tro-quay.doc() hoac null · tienDo(0..1). Tra Promise<{ ok: true, file, bytes, khung, w, h, ms, ... } | { ok: false, loi }>, khong nem. */
function xuat(nguon, dich, tuyChon, conTro, tienDo) {
  return new Promise((ketThuc) => {
    if (viec) { ketThuc({ ok: false, loi: 'dang-ban' }); return }
    if (!nguon || !dich || !fs.existsSync(nguon)) { ketThuc({ ok: false, loi: 'khong co file nguon' }); return }
    if (path.resolve(nguon) === path.resolve(dich)) { ketThuc({ ok: false, loi: 'file dich trung file nguon' }); return }
    if (fs.existsSync(dich) || fs.existsSync(dich + '.tam')) { ketThuc({ ok: false, loi: 'file dich da ton tai' }); return }
    const tam = dich + '.tam'
    let fd
    try { fd = fs.openSync(tam, 'wx') } catch (e) { ketThuc({ ok: false, loi: 'khong tao duoc file: ' + e.message }); return }
    const win = new BrowserWindow({
      width: 320, height: 200, show: false, skipTaskbar: true,
      webPreferences: { preload: path.join(__dirname, 'preload-sua-xuat.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false },
    })
    viec = { nguon, dich, tam, fd, win, max: 0, tuyChon, conTro: conTro || null, tienDo, ketThuc, t0: Date.now(), hen: null }
    const v = viec
    v.hen = setTimeout(() => { if (viec === v) ket({ ok: false, loi: 'het gio' }) }, HET_GIO_MS)
    win.webContents.on('render-process-gone', (_e, d) => { if (viec === v) ket({ ok: false, loi: 'cua so xuat chet (' + (d && d.reason) + ')' }) })
    win.on('closed', () => { if (viec === v) ket({ ok: false, loi: 'cua so xuat dong som' }) })
    win.webContents.on('console-message', (e, level, msg) => {
      const nang = typeof level === 'number' ? level >= 3 : e.level === 'error'
      if (nang) ch.ghiLog('sua-video LOI trang: ' + String(msg || e.message).slice(0, 300))
    })
    win.loadFile(path.join(__dirname, 'sua-xuat', 'index.html')).catch((e) => { if (viec === v) ket({ ok: false, loi: 'khong nap duoc trang: ' + e.message }) })
  })
}
function huy() { if (viec) ket({ ok: false, loi: 'da-huy' }) }

/* ---------- man Sua video (nhin thay) ---------- */
function duongDich(nguon) {
  const goc = nguon.replace(/\.mp4$/i, '')
  for (let k = 1; k < 1000; k++) {
    const d = goc + '-da-sua' + (k > 1 ? '-' + k : '') + '.mp4'
    if (!fs.existsSync(d) && !fs.existsSync(d + '.tam')) return d
  }
  return null
}

function moCuaSo(id) {
  const m = ch.tim(id)
  if (!m || !fs.existsSync(m.file) || !/\.mp4$/i.test(m.file)) { ch.ghiLog('sua-video mo ' + id + ': khong co file mp4'); return false }
  const trang = path.join(__dirname, 'sua-video', 'index.html')
  if (cuaSo && cuaSo.win && !cuaSo.win.isDestroyed()) {
    if (cuaSo.id !== id && viec) { cuaSo.win.show(); cuaSo.win.focus(); return true } // dang xuat video khac: khong doi
    cuaSo.id = id
    cuaSo.win.loadFile(trang, { query: { id } })
    cuaSo.win.show(); cuaSo.win.focus()
    return true
  }
  const wa = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  const w = Math.min(980, Math.round(wa.width * 0.92)), h = Math.min(780, Math.round(wa.height * 0.92))
  const win = new BrowserWindow({
    x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2), width: w, height: h,
    minWidth: 720, minHeight: 560,
    frame: false, title: 'AiO Shot & Save - Sua video', backgroundColor: '#181818', show: false, alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'assets', 'app.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload-sua-video.js'), contextIsolation: true, sandbox: false },
  })
  cuaSo = { win, id }
  const wcId = win.webContents.id // doc `webContents.id` SAU khi 'closed' la crash -> cache ngay luc tao
  ch.moiDesktop(win, 'cua so Sua video')
  win.webContents.on('console-message', (e, level, msg) => {
    const nang = typeof level === 'number' ? level >= 3 : e.level === 'error'
    if (nang) ch.ghiLog('sua-video LOI man hinh: ' + String(msg || e.message).slice(0, 300))
  })
  win.webContents.on('preload-error', (_e, p, err) => ch.ghiLog('sua-video LOI preload ' + path.basename(p) + ': ' + (err && err.message)))
  win.loadFile(trang, { query: { id } })
  win.once('ready-to-show', () => { if (!ch.chiAn) win.show() }) // chiAn: chi bai do dat, giu cua so AN (khong hien len man hinh)
  win.on('closed', () => {
    if (cuaSo && cuaSo.win === win) cuaSo = null
    if (viec && viec.sender && viec.sender === wcId) huy() // dong man Sua video giua luc xuat = huy, khong de lai file do
  })
  return true
}

ipcMain.on('sua:mo', (_e, id) => { moCuaSo(String(id)) })
ipcMain.handle('sua:get-data', (e) => {
  if (!cuaSo || !cuaSo.win || cuaSo.win.isDestroyed() || e.sender !== cuaSo.win.webContents) return null
  const m = ch.tim(cuaSo.id)
  if (!m || !fs.existsSync(m.file)) return null
  const ct = conTroQuay.doc(m.file)
  return {
    id: m.id, ten: path.basename(m.file), url: pathToFileURL(m.file).href,
    ms: m.ms || 0, w: m.w || 0, h: m.h || 0,
    coTieng: !!m.tieng, daBoTieng: !!m.boTieng,
    conTro: ct ? { mau: ct.mau, tre: ct.tre, w: ct.w, h: ct.h } : null,
    dangXuat: !!viec && viec.idVideo === m.id,
  }
})
ipcMain.handle('sua:xuat', async (e, id, tuyChon) => {
  if (!cuaSo || !cuaSo.win || cuaSo.win.isDestroyed() || e.sender !== cuaSo.win.webContents) return { ok: false, loi: 'khong ro cua so' }
  const m = ch.tim(String(id))
  if (!m || !fs.existsSync(m.file) || !/\.mp4$/i.test(m.file)) return { ok: false, loi: 'khong co video' }
  if (viec) return { ok: false, loi: 'dang-ban' }
  const t = chuanTuyChon(tuyChon, !!m.tieng)
  const ct = t.zoom.bat ? conTroQuay.doc(m.file) : null
  if (t.zoom.bat && !ct) return { ok: false, loi: 'khong-co-con-tro' }
  const dich = duongDich(m.file)
  if (!dich) return { ok: false, loi: 'khong dat duoc ten file moi' }
  const sender = e.sender
  const p = xuat(m.file, dich, t, ct, (x) => { try { if (!sender.isDestroyed()) sender.send('sua:tien-do-ui', x) } catch (err) {} })
  if (viec) { viec.idVideo = m.id; viec.sender = sender.id }
  const kq = await p
  /* 06/11 (Codex soat dot 3): trang Sua video tai lai giua luc xuat (bam Sua lan nua / doi ngon ngu) -> loi goi `sua.xuat()` cua trang cu
     khong con ai nhan; trang moi khoa giao dien vi viec con chay. Bao ket qua THANG cho trang dang mo; trang tu bo qua neu da nhan roi. */
  try { if (cuaSo && cuaSo.win && !cuaSo.win.isDestroyed() && cuaSo.id === m.id) cuaSo.win.webContents.send('sua:ket-thuc-ui', kq) } catch (err) {}
  return kq
})
ipcMain.on('sua:huy', (e) => { if (cuaSo && cuaSo.win && e.sender === cuaSo.win.webContents) huy() })
ipcMain.on('sua:keo', (e, file) => {
  if (!daXuat.has(file) || !fs.existsSync(file)) { ch.ghiLog('sua-video keo: file khong phai ban vua xuat / da mat'); return }
  try {
    const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray.png')).resize({ height: 64, quality: 'best' })
    e.sender.startDrag({ file: ch.keoAnToan(file), icon })
  } catch (err) { ch.ghiLog('sua-video keo LOI: ' + err.message) }
})
ipcMain.on('sua:mo-thu-muc', (_e, file) => { if (daXuat.has(file) && fs.existsSync(file)) shell.showItemInFolder(file) })
ipcMain.on('sua:dong', (e) => { if (cuaSo && cuaSo.win && e.sender === cuaSo.win.webContents) cuaSo.win.close() })

module.exports = { khoiTao, xuat, huy, dangBan, moCuaSo, duongDich, kiemCauTruc, chuanTuyChon, cuaSoHienTai: () => (cuaSo && cuaSo.win && !cuaSo.win.isDestroyed() ? cuaSo.win : null) }
