'use strict'
/* =========================================================================
   Do DE DUNG CHO NGUOI MOI (06/11, dot 2) — chay bang: npm run test:dedung
   10 viec: [1] the lan chay dau · [2] ngon ngu mac dinh theo may moi · [3] tu chep vao clipboard khi bam Xong ·
            [4] goi y sau khi khoanh vung + tooltip nut Xong khi bat Storyboard + nhan kich thuoc · [5] cham nho + tooltip nut nhom ·
            [6] chu sai / chu co dinh doi sang i18n · [7] tooltip thung rac + chup lai vung · [8] menu khay + chup cuon ·
            [9] trang trong (Khay / Khay video / Tim anh) · [10] Cai dat doi phim Canvas + chup lai, Ctrl -> Cmd tren Mac.
   CHAY AN: chi cua so offscreen / show:false (the lan dau cung chay show:false, KHONG bao gio hien len man hinh anh dang dung),
   khong dang ky phim tat that, khong cham userData that. Trang that (overlay / Cai dat / khay / Tim anh / ghim / the lan dau /
   dong ho chup cuon) nap THAT voi preload that; chuot la sendInputEvent. Cac ham trong main.js (doi phim phu, menu khay, chup lai,
   dong chep clipboard, settings:get) duoc TRICH NGUYEN VAN tu main.js roi chay voi lop gia (cung cach do-viec-nho.cjs).
   DOI CHUNG: moi viec co mot cach lam hong co y -> bai do PHAI truot dung muc, roi tra lai.
   CHUA DO: Mac that (chi do ham doi Ctrl -> Cmd), man hinh that (the lan dau dat vi tri bang workArea gia), chuot that.
   Cach chay (ghi ra file, KHONG | head / | tail):  node scripts/test/do-de-dung.cjs > ket-qua.txt 2>&1
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  process.stdout.on('error', () => {})
  process.stderr.on('error', () => {})
  const { spawnSync } = require('child_process')
  const electron = require('electron') // duong dan Electron cho dung he dieu hanh (can NODE_PATH tro toi node_modules neu worktree khong co)
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'de-dung')
  fs.mkdirSync(RA, { recursive: true })
  const chay = (tiLe, hong) => {
    const r = spawnSync(electron, [__filename, RA, String(tiLe), ...(hong ? [hong] : [])], { env, encoding: 'utf8', timeout: 300000 })
    const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
    if (!dong) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 4).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
    return JSON.parse(dong.slice(3))
  }
  let tong = 0, dat = 0
  const in_ = (k, tieuDe) => {
    console.log('\n== ' + tieuDe + ' ==')
    if (k.loi) { console.log('  TRUOT chay duoc (' + k.loi + ')'); tong++; return }
    for (const c of k.kq) { tong++; if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }
    tong++
    if (k.loiTrang && k.loiTrang.length) console.log('  TRUOT loi console trong trang: ' + k.loiTrang.slice(0, 3).join(' | '))
    else { dat++; console.log('  DAT   khong co loi console trong cac trang da nap') }
  }
  in_(chay(1), 'Man 100 %')
  in_(chay(1.5), 'Man 150 %')
  /* DOI CHUNG: [ten cach lam hong, regex ten muc PHAI truot] */
  const doiChung = [
    ['tuchepHong', /Tu chep: /],
    ['langHong', /Ngon ngu may: /],
    ['macHong', /Mac: /],
    ['enHong', /i18n: .*(tieng Anh|dau tieng Viet)/],
    ['phimPhuHong', /Phim phu: .*trung/],
    ['trayHong', /Menu khay/],
    ['theHong', /The lan dau: /],
    ['hintHong', /Goi y sau khi khoanh vung/],
    ['nhomHong', /Nut nhom: /],
    ['ocrChipHong', /Cai dat: .*Doc chu/],
    ['trongHong', /Trang trong: /],
    ['cuonHong', /Chup cuon: /],
  ]
  let doiChungDat = 0
  console.log('\n== DOI CHUNG (co y lam hong, bai do PHAI truot) ==')
  for (const [hong, mau] of doiChung) {
    const k = chay(1, hong)
    const truot = k.loi ? [] : k.kq.filter((c) => !c.ok && mau.test(c.ten))
    const ok = truot.length > 0
    if (ok) doiChungDat++
    console.log((ok ? '  DAT   ' : '  TRUOT ') + 'lam hong "' + hong + '" -> bai do bat duoc ' + truot.length + ' muc' + (k.loi ? ' (loi chay: ' + k.loi + ')' : ''))
  }
  tong += doiChung.length; dat += doiChungDat
  console.log('\nTONG: ' + dat + '/' + tong + ' DAT')
  process.exit(dat === tong ? 0 : 1)
}

/* ───────────── PHAN ELECTRON ───────────── */
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
const { app, BrowserWindow, ipcMain } = require('electron')
process.on('uncaughtException', (e) => { try { console.log('LOI=' + (e && e.stack || e)) } catch (x) {} app.exit(2) })
process.on('unhandledRejection', (e) => { try { console.log('LOI=' + (e && e.stack || e)) } catch (x) {} app.exit(2) })
const RA = path.resolve(process.argv[2])
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] || ''
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData-' + TI_LE + (HONG ? '-' + HONG : '')))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
setTimeout(() => { console.log('LOI=qua 280 giay'); app.exit(2) }, 280000)

const NHOM_CUA_HONG = { tuchepHong: 'i18n', langHong: 'i18n', macHong: 'i18n', enHong: 'i18n', phimPhuHong: 'i18n', trayHong: 'i18n', theHong: 'the', hintHong: 'overlay', nhomHong: 'overlay', ocrChipHong: 'settings', trongHong: 'trong', cuonHong: 'cuon' }
const chayNhom = (n) => !HONG || NHOM_CUA_HONG[HONG] === n

let ngonNgu = 'vi'
const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
const loiTrang = []
const js = (w, s) => w.webContents.executeJavaScript(s, true)
const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => {
  if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2.*Content Security Policy/.test(msg || e.message || '')) loiTrang.push(ten + ': ' + String(msg || e.message).slice(0, 160))
})
const doc = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n')

/* ── ipc gia (main that khong chay) ── */
const ghiNhan = { phuDoi: [], tuChep: [], chupNgay: 0, lanDau: [], cao: [], conf: [] }
let cauHinhGia = {}
const MAC_DINH_SET = () => Object.assign({
  hotkey: 'Ctrl+Shift+S', def: 'Ctrl+Shift+S', isMac: false, saveFolder: 'C:\\Users\\ten\\Pictures\\shotandsave', lang: ngonNgu, version: '0.10.1',
  anhLoai: 'jpeg', anhChatLuong: 'cao', khayKieu: 'ngang', khaySoAnh: 5, khayTuThu: 5, lamMoKieu: 'mosaic',
  quayMic: true, quayHienChuot: false, quayHienPhim: false, anNut: [], kinhLup: true, tuChepXong: true,
  hotkeyLai: 'CommandOrControl+Shift+Alt+S', defLai: 'CommandOrControl+Shift+Alt+S', phimCanvas: 'CommandOrControl+Alt+Shift+C', defCanvas: 'CommandOrControl+Alt+Shift+C',
  moCung: { hoTro: false, bat: false, biChan: false },
}, cauHinhGia)
let traPhuKeTiep = null // ket qua cho lan setHotkeyPhu ke tiep (null = ok)
ipcMain.on('i18n:lang', (e) => { e.returnValue = ngonNgu })
ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Ctrl + Shift + S' })
ipcMain.on('khay:kieu', (e) => { e.returnValue = 'ngang' })
ipcMain.handle('hotkey:lay', () => { if (HONG === 'trongHong') throw new Error('hong co y'); return { chup: 'Ctrl + Shift + S' } })
ipcMain.on('chup-ngay', () => { ghiNhan.chupNgay++ })
ipcMain.handle('settings:get', () => MAC_DINH_SET())
ipcMain.handle('settings:set-tu-chep', (_e, bat) => { ghiNhan.tuChep.push(bat); cauHinhGia.tuChepXong = bat; return { tuChepXong: bat } })
ipcMain.handle('settings:set-hotkey-phu', (_e, loai, accel) => {
  ghiNhan.phuDoi.push([loai, accel])
  const r = traPhuKeTiep
  traPhuKeTiep = null
  if (r) return r
  cauHinhGia[loai === 'lai' ? 'hotkeyLai' : 'phimCanvas'] = accel
  return { ok: true, hotkey: accel }
})
ipcMain.handle('storyboard:get-data', () => ({ dais: [] }))
ipcMain.handle('video:get-data', () => ({ ds: [], gifToiDaMs: 60000 }))
ipcMain.on('storyboard:close', () => {}); ipcMain.on('video:close', () => {})
ipcMain.handle('bq:get', () => ({ loai: 'dung-thu', ngayConLai: 10, choPhepChup: true }))
ipcMain.handle('capnhat:get', () => ({ coBanMoi: false, hienTai: '0.10.1' }))
ipcMain.on('settings:drag-start', () => {}); ipcMain.on('settings:drag-to', () => {}); ipcMain.on('settings:drag-end', () => {}); ipcMain.on('settings:close', () => {})
ipcMain.on('overlay:confirm', (_e, p) => { ghiNhan.conf.push(p) })
ipcMain.on('overlay:cancel', () => {}); ipcMain.on('overlay:log', () => {})
for (const k of ['lan-dau:cao', 'lan-dau:dong', 'lan-dau:doi-phim']) void k

/* preload boc: dat BarcodeDetector GIA truoc khi trang chay (co / khong co), roi nap preload that */
const PRELOAD_QR = path.join(RA, 'preload-qr-gia.cjs')
fs.writeFileSync(PRELOAD_QR, `const { webFrame } = require('electron')
const real = process.env.AIO_TEST_PRELOAD_THAT
if (process.env.AIO_TEST_QR === '1') webFrame.executeJavaScript('window.BarcodeDetector = class { static async getSupportedFormats() { return ["qr_code"] } async detect() { return [] } }')
require(real)
`)
function taoCuaSo(W, H, preloadRel, { qr = false, nho = {} } = {}) {
  process.env.AIO_TEST_PRELOAD_THAT = path.join(ROOT, 'src', preloadRel)
  process.env.AIO_TEST_QR = qr ? '1' : '0'
  const w = new BrowserWindow(Object.assign({ x: 0, y: 0, width: W, height: H, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: PRELOAD_QR, contextIsolation: true, sandbox: false } }, nho))
  return w
}

/* quet chu sai ngon ngu: text node + title + aria-label + placeholder + document.title */
const QUET = `(() => {
  const ra = []
  const them = (loai, s, ctx) => { s = String(s || '').replace(/\\s+/g, ' ').trim(); if (s) ra.push({ loai, s, ctx }) }
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (tw.nextNode()) { const p = tw.currentNode.parentElement; if (p && !/^(SCRIPT|STYLE)$/.test(p.tagName)) them('text', tw.currentNode.nodeValue, p.id || p.className || p.tagName) }
  for (const el of document.querySelectorAll('*')) for (const a of ['title', 'aria-label', 'placeholder']) if (el.hasAttribute(a)) them(a, el.getAttribute(a), el.id || el.className || el.tagName)
  them('doc-title', document.title, 'title')
  return ra
})()`
const DAU = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i
const TU_ANH = /\b(the|and|click|drag|close|cancel|done|undo|redo|settings|shortcut|capture|folder|color|image|please|save|open)\b/i
// ten thuong hieu "AiO Shot & Save" khong tinh la tieng Anh
function chuSai(s, lang) { return lang === 'en' ? DAU.test(s) : (!DAU.test(s) && TU_ANH.test(s.replace(/AiO Shot ?(&|&amp;) ?Save/g, ''))) }
async function quetTrang(w, ten, lang, boQua) {
  const ds = await js(w, QUET)
  const sai = ds.filter((d) => chuSai(d.s, lang) && !(boQua && boQua.test(d.s)))
  kiem('Quet chu: ' + ten + ' (' + lang.toUpperCase() + ') ' + ds.length + ' chuoi (text + title + aria-label + placeholder) khong sai ngon ngu', sai.length === 0, sai.slice(0, 4).map((d) => d.loai + ':' + d.s.slice(0, 50)).join(' | '))
  const em = ds.filter((d) => /\u2014/.test(d.s))
  kiem('Quet chu: ' + ten + ' (' + lang.toUpperCase() + ') khong co gach ngang dai', em.length === 0, em.slice(0, 2).map((d) => d.s.slice(0, 40)).join(' | '))
  return ds
}
async function bam(w, sel) {
  const r = await js(w, `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })()`)
  if (!r) throw new Error('khong thay phan tu ' + sel)
  const x = Math.round(r.x), y = Math.round(r.y)
  w.webContents.sendInputEvent({ type: 'mouseMove', x, y })
  w.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 })
  w.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 })
  await cho(140)
}
async function phimThat(w, keyCode, modifiers) {
  w.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
  w.webContents.sendInputEvent({ type: 'char', keyCode, modifiers })
  w.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
  await cho(160)
}

/* ═════════ [i18n + logic thuan] viec 1 (ham), 2, 3, 7, 8, 10 (ham) ═════════ */
async function phanI18n() {
  const i18n = require(path.join(ROOT, 'src', 'i18n'))
  const lanDau = require(path.join(ROOT, 'src', 'lan-dau'))
  const tuChep = require(path.join(ROOT, 'src', 'tu-chep'))
  const khayThu = require(path.join(ROOT, 'src', 'khay-thu'))
  if (HONG === 'langHong') i18n.ngonNguTuMay = () => 'vi'
  if (HONG === 'macHong') i18n.chuanHoaMay = (s) => s
  if (HONG === 'tuchepHong') tuChep.nenChep = (p) => !!(p && p.copy)
  if (HONG === 'enHong') { i18n.DICH.en['lan.khay'] = 'Chụp xong, ảnh nằm trong khay'; i18n.DICH.en['overlay.hintXong'] = 'Enter = lưu · Esc = huỷ' }

  // ── i18n: du khoa hai ben, du tham so, EN khong con dau tieng Viet, khoa trong HTML ton tai
  const vi = Object.keys(i18n.DICH.vi), en = Object.keys(i18n.DICH.en)
  kiem('i18n: VI va EN co cung bo khoa (' + vi.length + ' khoa)', vi.length === en.length && vi.every((k) => k in i18n.DICH.en), 'thieu EN: ' + vi.filter((k) => !(k in i18n.DICH.en)).slice(0, 4).join(','))
  const tham = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',')
  const lechTham = vi.filter((k) => tham(i18n.DICH.vi[k]) !== tham(i18n.DICH.en[k]))
  kiem('i18n: moi khoa co dung cac tham so {..} giong nhau o VI va EN', lechTham.length === 0, lechTham.slice(0, 4).join(','))
  const enDau = en.filter((k) => DAU.test(i18n.DICH.en[k]))
  kiem('i18n: khong khoa EN nao con dau tieng Viet (tieng Anh sach)', enDau.length === 0, enDau.slice(0, 4).join(','))
  const khoaMoi = vi.filter((k) => /^(lan\.|win\.|mau\.|overlay\.(hintXong|hintXongSb|doneSb|keoDoiKhung|keoDoiCo|reThem|mauNhom)|set\.(phim\.(chup|lai|canvas|tat|dangTat|trung)|tuChep|nut\.ocrChi|ngonNgu|dong)|cuon\.goiY|chup\.ngay|phim\.chungChung|tray\.khayKhac|khay\.logoTitle)/.test(k))
  const em = khoaMoi.filter((k) => /\u2014/.test(i18n.DICH.vi[k]) || /\u2014/.test(i18n.DICH.en[k]))
  kiem('i18n: ' + khoaMoi.length + ' khoa moi khong co gach ngang dai, khong emoji', em.length === 0 && !khoaMoi.some((k) => /[\u{1F300}-\u{1FAFF}]/u.test(i18n.DICH.vi[k] + i18n.DICH.en[k])), em.slice(0, 3).join(','))
  const xungAnh = vi.filter((k) => /^(set\.|bq\.|lan\.|cn\.|ta\.)/.test(k) && /(^|[\s“"(])anh([\s,.”")]|$)/i.test(i18n.DICH.vi[k]) && !/ảnh/.test(i18n.DICH.vi[k].match(/(^|[\s“"(])anh([\s,.”")]|$)/i)[0]))
  kiem('i18n: Cai dat / ban quyen / the dau khong xung "anh" voi nguoi dung', xungAnh.length === 0, xungAnh.slice(0, 3).join(','))
  const ga = (rel) => { const m = []; const re = /data-i18n(?:-title|-aria|-placeholder)?="([^"]+)"/g; let x; const s = doc(rel); while ((x = re.exec(s))) m.push(x[1]); return m }
  const htmls = []
  const duyet = (d) => { for (const f of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const r = d + '/' + f.name; if (f.isDirectory()) duyet(r); else if (/\.html$/.test(f.name)) htmls.push(r) } }
  duyet('src')
  const thieuKhoa = []
  for (const h of htmls) for (const k of ga(h)) if (!(k in i18n.DICH.vi) || !(k in i18n.DICH.en)) thieuKhoa.push(h.replace('src/', '') + ':' + k)
  kiem('i18n: moi khoa data-i18n* trong ' + htmls.length + ' trang HTML co du ca VI lan EN', thieuKhoa.length === 0, thieuKhoa.slice(0, 4).join(','))
  const coDinh = []
  for (const h of ['src/overlay/index.html', 'src/shelf/index.html', 'src/settings/index.html']) {
    const s = doc(h).replace(/<!--[\s\S]*?-->/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '')
    const m = s.match(/\b(title|aria-label|placeholder)="([^"]*[\u00C0-\u1EF9][^"]*)"/g) || []
    for (const x of m) coDinh.push(h.replace('src/', '') + ' ' + x)
    const t2 = s.match(/<title>([^<]*[\u00C0-\u1EF9][^<]*)<\/title>/g) || []
    for (const x of t2) coDinh.push(h.replace('src/', '') + ' ' + x)
  }
  kiem('i18n: overlay.html / shelf.html / settings.html khong con title, aria-label, <title> tieng Viet co dinh', coDinh.length === 0, coDinh.slice(0, 3).join(' | '))

  // ── Mac: Ctrl -> Cmd
  const mauMac = [
    ['Hoàn tác (Ctrl+Z)', 'Hoàn tác (⌘+Z)'], ['Làm lại (Ctrl+Y · Ctrl+Shift+Z)', 'Làm lại (⌘+Y · ⌘+Shift+Z)'],
    ['Xong (Enter · Ctrl+C = sao chép)', 'Xong (Enter · ⌘+C = sao chép)'], ['Ctrl + lăn chuột = độ trong suốt', '⌘ + lăn chuột = độ trong suốt'],
    ['Cần ít nhất một phím Ctrl / Alt / Shift', 'Cần ít nhất một phím Ctrl / Alt / Shift'], ['Search the board (Cmd/Ctrl + F)', 'Search the board (Cmd/Ctrl + F)'],
  ]
  const lechMac = mauMac.filter(([a, b]) => i18n.chuanHoaMay(a, true) !== b)
  const khongDoiWin = mauMac.filter(([a]) => i18n.chuanHoaMay(a, false) !== a)
  kiem('Mac: tooltip Ctrl+X doi thanh ⌘+X (6 mau, danh sach "Ctrl / Alt / Shift" va "Cmd/Ctrl" giu nguyen)', lechMac.length === 0, lechMac.slice(0, 2).map((x) => x[0]).join(' | '))
  kiem('Mac: tren Windows chuoi khong doi (6 mau)', khongDoiWin.length === 0)
  const tren = process.platform === 'darwin'
  kiem('Mac: i18n.t() tren may nay (' + process.platform + ') ' + (tren ? 'doi' : 'giu') + ' Ctrl', tren ? i18n.t('vi', 'overlay.undo') === 'Hoàn tác (⌘+Z)' : i18n.t('vi', 'overlay.undo') === 'Hoàn tác (Ctrl+Z)', i18n.t('vi', 'overlay.undo'))

  // ── viec 2: ngon ngu mac dinh
  const bangNN = [['vi', 'vi'], ['vi-VN', 'vi'], ['VI_vn', 'vi'], ['en-US', 'en'], ['fr', 'en'], ['de-DE', 'en'], ['', 'en'], [undefined, 'en'], ['vin', 'en'], ['ja-JP', 'en']]
  const lechNN = bangNN.filter(([a, b]) => i18n.ngonNguTuMay(a) !== b)
  kiem('Ngon ngu may: he thong vi* -> VI, con lai (en, fr, de, ja, rong, khong ro) -> EN (' + bangNN.length + ' mau)', lechNN.length === 0, lechNN.map((x) => JSON.stringify(x[0])).join(','))
  const mainSrc = doc('src/main.js')
  const iNN = mainSrc.indexOf("lang = i18n.ngonNguTuMay(app.getLocale())")
  const khoiNN = mainSrc.slice(mainSrc.lastIndexOf("if (!ch.lang && mayMoi)", iNN), iNN + 200)
  kiem('Ngon ngu may: main.js chi doi ngon ngu khi may MOI + chua chon (may da co cau hinh khong bi dong vao)', iNN > 0 && /if \(!ch\.lang && mayMoi\)/.test(khoiNN) && /kho\.ghiCauHinh\(\{ lang \}\)/.test(khoiNN))
  const iDau = mainSrc.indexOf('docDauHieuMayMoi(fs, app.getPath')
  const iGhiDau = Math.min(...['khoDai.khoiTao(', 'khoVideo.khoiTao(', 'canvasKho.khoiTao(', 'kho.donKeoAnToan()', 'khoiTaoBanQuyen()'].map((k) => mainSrc.indexOf(k, iDau)).filter((i) => i > 0))
  kiem('Ngon ngu may: dau hieu may moi doc TRUOC moi buoc ghi vao userData (khoi tao kho / ban quyen)', iDau > 0 && iDau < iGhiDau, iDau + ' < ' + iGhiDau)

  // ── viec 3: tu chep khi bam Xong (mac dinh BAT cho nguoi cu va moi)
  const bangChep = [
    [{}, {}, true, 'khong co khoa tuChepXong (nguoi moi) -> chep'],
    [{}, { hotkey: 'Ctrl+Shift+S', lang: 'vi', khayKieu: 'ngang', khaySoAnh: 5 }, true, 'cau hinh cu khong co khoa nay (nguoi cu) -> chep'],
    [{}, { tuChepXong: true }, true, 'bat -> chep'],
    [{}, { tuChepXong: false }, false, 'tat trong Cai dat -> khong chep'],
    [{ copy: true }, { tuChepXong: false }, true, 'Ctrl+C van luon chep du da tat'],
    [{ copy: true }, {}, true, 'Ctrl+C mac dinh chep'],
    [{}, { tuChepXong: '0' }, true, 'gia tri la (khong phai boolean) -> mac dinh BAT'],
    [null, null, true, 'khong co du lieu -> mac dinh BAT'],
  ]
  const lechChep = bangChep.filter(([p, c, mong]) => tuChep.nenChep(p, c) !== mong)
  kiem('Tu chep: bang ' + bangChep.length + ' to hop (cu / moi / tat / Ctrl+C / gia tri la) ra dung', lechChep.length === 0, lechChep.map((x) => x[3]).slice(0, 3).join(' | '))
  kiem('Tu chep: mac dinh doi o MOT cho (hang TU_CHEP_MAC_DINH = ' + tuChep.TU_CHEP_MAC_DINH + ')', tuChep.TU_CHEP_MAC_DINH === true && (doc('src/tu-chep.js').match(/TU_CHEP_MAC_DINH = /g) || []).length === 1)
  // dong that trong handleConfirm: chay voi clipboard gia
  const dong = mainSrc.match(/  if \(tuChepMod\.nenChep\(payload, kho\.docCauHinh\(\)\)\) \{ try \{ clipboard\.writeImage\(cropped\) \} catch \(e\) \{\} \}/)
  kiem('Tu chep: handleConfirm goi nenChep truoc khi luu anh (cung duong Xong va Ctrl+C)', !!dong && mainSrc.indexOf(dong[0]) < mainSrc.indexOf('const filePath = await kho.luuAnhDoi(cropped'))
  if (dong) {
    const chayDong = (payload, cfg) => { const ds = []; new Function('tuChepMod', 'kho', 'clipboard', 'payload', 'cropped', dong[0])(tuChep, { docCauHinh: () => cfg }, { writeImage: (x) => ds.push(x) }, payload, 'ANH'); return ds.length }
    kiem('Tu chep: chay dong THAT cua handleConfirm: bam Xong (khong Ctrl+C) -> chep 1 lan; tat -> 0 lan; Ctrl+C -> 1 lan',
      chayDong({ rect: 1 }, {}) === 1 && chayDong({ rect: 1 }, { tuChepXong: false }) === 0 && chayDong({ rect: 1, copy: true }, { tuChepXong: false }) === 1, '')
  }
  kiem('Tu chep: Cai dat luu qua kenh settings:set-tu-chep va settings:get tra tuChepXong', /ipcMain\.handle\('settings:set-tu-chep'[\s\S]*?ghiCauHinh\(\{ tuChepXong: val \}\)/.test(mainSrc) && /tuChepXong: tuChepMod\.tuChepKhiXong\(c\)/.test(mainSrc))

  // ── viec 1 (ham thuan): the lan chay dau
  const bangThe = [
    [{}, true], [{ coCauHinh: true }, false], [{ coBanQuyen: true }, false], [{ coFileHong: true }, false], [{ daHien: true }, false], [{ dangDo: true }, false],
    [{ coCauHinh: true, coBanQuyen: true }, false], [undefined, true],
  ]
  const lechThe = bangThe.filter(([o, mong]) => lanDau.nenHienThe(o) !== mong)
  kiem('The lan dau: chi hien khi may MOI (khong cau hinh, ban quyen, file hong, chua tung hien, khong dang do) (' + bangThe.length + ' to hop)', lechThe.length === 0, JSON.stringify(lechThe.map((x) => x[0])))
  const tmp = fs.mkdtempSync(path.join(RA, 'dau-hieu-'))
  const dh = (...ten) => { const d = fs.mkdtempSync(path.join(tmp, 'm-')); for (const t of ten) fs.writeFileSync(path.join(d, t), '{}'); return lanDau.docDauHieuMayMoi(fs, d) }
  const d0 = dh(), d1 = dh('cau-hinh.json'), d2 = dh('ban-quyen.json'), d3 = dh('cau-hinh.hong-20261105-101010.json'), d4 = dh('ban-quyen.hong-1.json'), d5 = dh('shotandsave.log', 'tim-anh')
  const khongThuMuc = lanDau.docDauHieuMayMoi(fs, path.join(tmp, 'khong-co'))
  kiem('The lan dau: doc thu muc du lieu — trong = may moi; cau-hinh.json / ban-quyen.json / file .hong-* = may cu',
    !d0.coCauHinh && !d0.coBanQuyen && !d0.coFileHong && d1.coCauHinh && d2.coBanQuyen && d3.coFileHong && d4.coFileHong && !d5.coCauHinh && !khongThuMuc.coCauHinh,
    JSON.stringify([d0, d1, d2, d3].map((x) => Number(x.coCauHinh) + '' + Number(x.coBanQuyen) + Number(x.coFileHong))))
  kiem('The lan dau: nenHienThe(docDauHieu) -> may moi hien, may anh Tien (co cau hinh) KHONG', lanDau.nenHienThe(d0) === true && lanDau.nenHienThe(d1) === false && lanDau.nenHienThe(Object.assign({}, d0, { daHien: true })) === false)
  kiem('The lan dau: main.js coi bat ky bien AIO_* / --dev / --selftest la "dang do" (khong hien khi do)', /Object\.keys\(process\.env\)\.some\(\(k\) => k\.indexOf\('AIO_'\) === 0\)/.test(mainSrc) && /const dangDo = IS_DEV \|\| IS_SELFTEST/.test(mainSrc))
  kiem('The lan dau: ghi co NGAY LUC HIEN (khong hien lai du tat app giua chung) + dong khi nguoi dung chup lan dau', /ghiCo: \(\) => kho\.ghiCauHinh\(\{ lanDauDaHien: true \}\)/.test(mainSrc) && /if \(theLanDau\) theLanDau\.dong\('nguoi dung chup'\)/.test(mainSrc))
  // vi tri: nam trong workArea va khong de len vung nut tron cua khay (Win) / duoi thanh menu (Mac)
  const WA = [{ x: 0, y: 0, width: 1920, height: 1040 }, { x: -1920, y: 0, width: 1920, height: 1080 }, { x: 0, y: 25, width: 1440, height: 850 }, { x: 0, y: 0, width: 800, height: 560 }, { x: 2560, y: -200, width: 2048, height: 1112 }]
  const hong = []
  for (const nt of ['win32', 'darwin']) for (const wa of WA) {
    const b = lanDau.tinhViTri(wa, lanDau.THE.RONG, 320, nt)
    const trongWa = b.x >= wa.x && b.y >= wa.y && b.x + b.width <= wa.x + wa.width && b.y + b.height <= wa.y + wa.height
    const nut = khayThu.oCuaSoNut(wa)
    const chong = !(b.x + b.width <= nut.x || b.x >= nut.x + nut.width || b.y + b.height <= nut.y || b.y >= nut.y + nut.height)
    if (!trongWa || chong) hong.push(nt + ' ' + JSON.stringify(wa) + (trongWa ? '' : ' RA NGOAI') + (chong ? ' DE LEN NUT TRON' : ''))
  }
  kiem('The lan dau: ' + (WA.length * 2) + ' to hop (Win/Mac x 5 man, gom man phu lech am, man 800x560) the nam trong vung lam viec va KHONG de len nut tron khay', hong.length === 0, hong.slice(0, 2).join(' | '))

  // ── viec 10 + 7 (ham): setHotkeyPhu / registerHotkeyLai trich nguyen van tu main.js
  const lay = (re, ten) => { const m = mainSrc.match(re); if (!m) throw new Error('khong thay trong main.js: ' + ten); return m[0] }
  const maPhim = [
    lay(/const DEFAULT_HOTKEY_LAI = [^\n]+\n/, 'DEFAULT_HOTKEY_LAI'), lay(/const PHIM_CANVAS_MAC_DINH = [^\n]+\n/, 'PHIM_CANVAS_MAC_DINH'),
    lay(/function chuanPhim\(a\) \{[\s\S]*?\n\}\n/, 'chuanPhim'), lay(/const cungPhim = [^\n]+\n/, 'cungPhim'),
    lay(/function phimLaiCauHinh\(\) [^\n]+\n/, 'phimLaiCauHinh'), lay(/function phimCanvasCauHinh\(\) [^\n]+\n/, 'phimCanvasCauHinh'),
    lay(/function registerHotkeyLai\(\) \{[\s\S]*?\n\}\n/, 'registerHotkeyLai'), lay(/function dangKyPhimCanvas\(accel\) \{[\s\S]*?\n\}\n/, 'dangKyPhimCanvas'),
    lay(/function setHotkeyPhu\(loai, accel\) \{[\s\S]*?\n\}\n/, 'setHotkeyPhu'),
  ]
  let maPhimDung = maPhim.join('\n')
  if (HONG === 'phimPhuHong') maPhimDung = maPhimDung.replace('cungPhim(a, currentHotkey) ||', 'false ||')
  const taoPhim = (cfg, giu = []) => {
    const dk = new Map(); const log = []; let tray = 0
    const gs = { register: (a, f) => { if (giu.includes(a) || [...dk.keys()].some((k) => k.toLowerCase() === a.toLowerCase())) return false; dk.set(a, f); return true }, unregister: (a) => { dk.delete(a) } }
    const khoGia = { docCauHinh: () => Object.assign({}, cfg), ghiCauHinh: (p) => { Object.assign(cfg, p); return cfg } }
    const f = new Function('globalShortcut', 'kho', 'ghiLog', 'rebuildTrayMenu', 'chupLaiVungCuoi', 'openCanvasWindow', `
      let currentHotkey = 'CommandOrControl+Shift+S', phimLaiDangKy = '', phimCanvasDangKy = ''
      ${maPhimDung}
      return { setHotkeyPhu, registerHotkeyLai, dangKyPhimCanvas, lai: () => phimLaiDangKy, canvas: () => phimCanvasDangKy }`)
    const o = f(gs, khoGia, (m) => log.push(m), () => { tray++ }, () => {}, () => {})
    return Object.assign(o, { dk, log, cfg, tray: () => tray })
  }
  const A = taoPhim({}); A.registerHotkeyLai(); A.dangKyPhimCanvas()
  kiem('Phim phu: mac dinh dang ky 2 phim (chup lai Ctrl+Shift+Alt+S, Canvas Ctrl+Alt+Shift+C)', A.lai() === 'CommandOrControl+Shift+Alt+S' && A.canvas() === 'CommandOrControl+Alt+Shift+C', A.lai() + ' | ' + A.canvas())
  const r1 = A.setHotkeyPhu('lai', 'CommandOrControl+Alt+K')
  kiem('Phim phu: doi phim chup lai sang Ctrl+Alt+K -> dang ky phim moi, go phim cu, luu cau hinh, dung menu khay lai', r1.ok === true && A.lai() === 'CommandOrControl+Alt+K' && !A.dk.has('CommandOrControl+Shift+Alt+S') && A.dk.has('CommandOrControl+Alt+K') && A.cfg.hotkeyLai === 'CommandOrControl+Alt+K' && A.tray() === 1, JSON.stringify(r1))
  const r2 = A.setHotkeyPhu('canvas', 'CommandOrControl+Shift+S')
  kiem('Phim phu: trung phim CHUP chinh -> bi tu choi (lyDo trung), giu phim Canvas cu, khong ghi cau hinh', r2.ok === false && r2.lyDo === 'trung' && A.canvas() === 'CommandOrControl+Alt+Shift+C' && A.cfg.phimCanvas === undefined && A.dk.has('CommandOrControl+Alt+Shift+C'), JSON.stringify(r2))
  const r3 = A.setHotkeyPhu('canvas', 'Ctrl+Alt+K')
  kiem('Phim phu: trung phim phu kia (Ctrl+Alt+K viet kieu khac) -> bi tu choi, Canvas giu nguyen', r3.ok === false && r3.lyDo === 'trung' && A.canvas() === 'CommandOrControl+Alt+Shift+C', JSON.stringify(r3))
  const B = taoPhim({}, ['CommandOrControl+Alt+J']); B.registerHotkeyLai(); B.dangKyPhimCanvas()
  const r4 = B.setHotkeyPhu('lai', 'CommandOrControl+Alt+J')
  kiem('Phim phu: app khac dang giu phim -> that bai, KHOI PHUC phim chup lai cu (khong mat phim), lyDo bi-giu', r4.ok === false && r4.lyDo === 'bi-giu' && B.lai() === 'CommandOrControl+Shift+Alt+S' && B.dk.has('CommandOrControl+Shift+Alt+S') && B.cfg.hotkeyLai === undefined, JSON.stringify(r4) + ' lai=' + B.lai())
  const r4b = B.setHotkeyPhu('canvas', 'CommandOrControl+Alt+J')
  kiem('Phim phu: Canvas bi giu phim -> that bai, khoi phuc phim Canvas cu', r4b.ok === false && B.canvas() === 'CommandOrControl+Alt+Shift+C' && B.dk.has('CommandOrControl+Alt+Shift+C'), JSON.stringify(r4b) + ' canvas=' + B.canvas())
  const r5 = A.setHotkeyPhu('lai', '')
  kiem('Phim phu: tat phim (rong) -> go dang ky, luu "" (lan sau khoi dong van tat)', r5.ok === true && A.lai() === '' && !A.dk.has('CommandOrControl+Alt+K') && A.cfg.hotkeyLai === '', JSON.stringify(r5))
  const C = taoPhim({ hotkeyLai: '' }); C.registerHotkeyLai()
  kiem('Phim phu: cau hinh "" -> lan khoi dong sau KHONG dang ky phim chup lai', C.lai() === '' && C.dk.size === 0)
  const r6 = A.setHotkeyPhu('khac', 'Ctrl+K')
  kiem('Phim phu: loai la (khong phai lai/canvas) bi tu choi', r6.ok === false)

  // ── viec 7: chup lai vung lan truoc — bo cau bao thua khi man chon vung da mo
  const maChupLai = lay(/function chupLaiVungCuoi\(\) \{[\s\S]*?\n\}\n/, 'chupLaiVungCuoi')
  const chupLai = (vung, hopLe) => {
    let thongBao = 0, batDau = []
    class Notif { constructor() { thongBao++ } show() {} static isSupported() { return true } }
    new Function('overlayWins', 'ghiHinh', 'cuon', 'napManCache', 'manCache', 'kho', 'chonCuaSo', 'ghiLog', 'Notification', 'T', 'startCapture', `${maChupLai}; chupLaiVungCuoi()`)(
      [], false, null, () => {}, [], { docCauHinh: () => ({ vungCuoi: vung }) }, { vungConHopLe: () => hopLe }, () => {}, Notif, (k) => k, (o) => batDau.push(o))
    return { thongBao, batDau }
  }
  const cl0 = chupLai(null, false), cl1 = chupLai({ x: 1, y: 2, w: 30, h: 40 }, true)
  kiem('Chup lai vung: chua co vung cu -> man chon vung mo luon, KHONG them thong bao (0 thong bao, 1 lan mo)', cl0.thongBao === 0 && cl0.batDau.length === 1 && cl0.batDau[0] === undefined, JSON.stringify(cl0))
  kiem('Chup lai vung: co vung cu -> chup dung vung do (1 lan, khong thong bao)', cl1.thongBao === 0 && cl1.batDau.length === 1 && cl1.batDau[0] && cl1.batDau[0].vung && cl1.batDau[0].vung.w === 30, JSON.stringify(cl1))

  // ── viec 7 + 8: menu khay he thong
  const maTray0 = lay(/function rebuildTrayMenu\(\) \{[\s\S]*?\n\}\n/, 'rebuildTrayMenu')
  const maTray = HONG === 'trayHong' ? maTray0.replace("    { label: T('tray.khayAnh'), click: () => showShelf() },\n", '').replace("    { label: T('tray.khayStory')", "    { label: T('tray.khayAnh'), click: () => showShelf() },\n    { label: T('tray.khayStory')") : maTray0
  const dungMenu = (lang, { ghiHinh = false, phimLai = 'CommandOrControl+Shift+Alt+S' } = {}) => {
    let mau = null
    const Menu = { buildFromTemplate: (m) => { mau = m; return m } }
    const tray = { setContextMenu: () => {} }
    const henGio = { dangDem: () => false, huy() {} }
    const T = (k) => i18n.t(lang, k)
    new Function('tray', 'Menu', 'dongBanQuyenTray', 'dongCapNhatTray', 'ghiHinh', 'T', 'currentHotkey', 'startCapture', 'chupLaiVungCuoi', 'phimLaiDangKy', 'henGio', 'batDauHenGio', 'showShelf', 'openStoryboardWindow', 'openVideoWindow', 'timAnh', 'phimCanvasDangKy', 'formatAccel', 'openCanvasWindow', 'shell', 'kho', 'openSettings', 'app', 'forceQuit', 'dungGhiHinh',
      `${maTray}; rebuildTrayMenu()`)(tray, Menu, () => [], () => [], ghiHinh, T, 'CommandOrControl+Shift+S', () => {}, () => {}, phimLai, henGio, () => {}, () => {}, () => {}, () => {}, null, 'CommandOrControl+Alt+Shift+C', (a) => String(a).replace('CommandOrControl', 'Ctrl'), () => {}, { openPath() {} }, { baoDamThuMuc: (x) => x, thuMucAnh: () => 'x' }, () => {}, { getVersion: () => '0.10.1' }, () => {}, () => {})
    return mau
  }
  for (const lang of ['vi', 'en']) {
    const m = dungMenu(lang)
    const nhan = m.filter((x) => x.label).map((x) => x.label)
    const iChup = nhan.indexOf(i18n.t(lang, 'tray.chup')), iKhayAnh = nhan.indexOf(i18n.t(lang, 'tray.khayAnh'))
    const trongCon = m.filter((x) => x.submenu).some((x) => x.submenu.some((s) => s.label === i18n.t(lang, 'tray.khayAnh')))
    const sub = m.find((x) => x.submenu && x.label === i18n.t(lang, 'tray.khayKhac'))
    kiem('Menu khay (' + lang.toUpperCase() + '): "' + i18n.t(lang, 'tray.khayAnh') + '" nam NGOAI CUNG ngay duoi muc Chup (khong con trong muc con)', iChup >= 0 && iKhayAnh === iChup + 1 && !trongCon, nhan.slice(0, 4).join(' > '))
    kiem('Menu khay (' + lang.toUpperCase() + '): muc con chi con Storyboard + video', !!sub && sub.submenu.length === 2 && sub.submenu[0].label === i18n.t(lang, 'tray.khayStory') && sub.submenu[1].label === i18n.t(lang, 'tray.khayVideo'), sub ? sub.submenu.map((s) => s.label).join(' | ') : 'khong co muc con')
    const lai = m.find((x) => x.label === i18n.t(lang, 'tray.chupLai'))
    kiem('Menu khay (' + lang.toUpperCase() + '): "' + i18n.t(lang, 'tray.chupLai') + '" hien phim da dang ky (accelerator)', !!lai && lai.accelerator === 'CommandOrControl+Shift+Alt+S', lai ? String(lai.accelerator) : 'khong co muc')
  }
  const tat = dungMenu('vi', { phimLai: '' }).find((x) => x.label === i18n.t('vi', 'tray.chupLai'))
  const dangQuay = dungMenu('vi', { ghiHinh: true }).find((x) => x.label === i18n.t('vi', 'tray.chupLai'))
  kiem('Menu khay: phim chup lai da TAT hoac dang quay video -> khong hien phim', !!tat && tat.accelerator === undefined && !!dangQuay && dangQuay.accelerator === undefined)
  kiem('Menu khay: main.js dung lai menu sau khi dang ky phim luc khoi dong (phim hien dung ngay lan dau)', /rebuildTrayMenu\(\) \/\/ 06\/11: phim chup-lai-vung \+ Canvas dang ky xong/.test(mainSrc))

  // ── viec 8: chup cuon — dong huong dan (nguon main.js; trang that o phan 'cuon')
  kiem('Chup cuon: main.js truyen dong huong dan chi cho chup cuon va mo rong cua so nut Xong', /goiY: laCuon \? T\('cuon\.goiY'\) : ''/.test(mainSrc) && /laCuon \? 460 : 240/.test(mainSrc))

  // ── viec 10: settings:get tra phim phu + tu chep (chay nguyen van voi lop gia)
  const maGet = lay(/ipcMain\.handle\('settings:get', \(\) => \{[\s\S]*?\n\}\)\n/, 'settings:get')
  let got = null
  const stub = {
    ipcMain: { handle: (n, f) => { if (n === 'settings:get') got = f } },
    kho: { docCauHinh: () => ({ hotkeyLai: '', phimCanvas: 'CommandOrControl+Alt+K', tuChepXong: false }), thuMucAnh: () => 'x' },
    app: { getVersion: () => '0.10.1' },
  }
  new Function('thongTinTen', 'ipcMain', 'kho', 'app', 'currentHotkey', 'DEFAULT_HOTKEY', 'lang', 'CHAT_LUONG_Q', 'kieuKhay', 'giayHopLe', 'kieuLamMo', 'anNutHopLe', 'moCungMay', 'tuChepMod', 'phimLaiCauHinh', 'DEFAULT_HOTKEY_LAI', 'phimCanvasCauHinh', 'PHIM_CANVAS_MAC_DINH',
    maGet)(() => ({}), stub.ipcMain, stub.kho, stub.app, 'A', 'B', 'vi', { cao: 98 }, () => 'ngang', (x) => x, (x) => x, (x) => x || [], { trangThai: () => ({}) }, tuChep,
    () => stub.kho.docCauHinh().hotkeyLai, 'DEF-LAI', () => stub.kho.docCauHinh().phimCanvas, 'DEF-CANVAS')
  const g = got ? got() : {}
  kiem('Phim phu: settings:get tra hotkeyLai (rong = tat), phimCanvas, 2 phim mac dinh va tuChepXong (tat -> false)', g.hotkeyLai === '' && g.phimCanvas === 'CommandOrControl+Alt+K' && g.defLai === 'DEF-LAI' && g.defCanvas === 'DEF-CANVAS' && g.tuChepXong === false, JSON.stringify([g.hotkeyLai, g.phimCanvas, g.defLai, g.defCanvas, g.tuChepXong]))
}

/* ═════════ [the] viec 1: the lan chay dau, cua so THAT (an) ═════════ */
async function phanThe() {
  const lanDau = require(path.join(ROOT, 'src', 'lan-dau'))
  const khayThu = require(path.join(ROOT, 'src', 'khay-thu'))
  if (HONG === 'theHong') lanDau.THE.NUT_TRON = 0 // the dat sat day, de len vung nut tron
  const { screen } = require('electron')
  for (const lang of ['vi', 'en']) for (const nt of ['win32', 'darwin']) {
    ngonNgu = lang
    const WA = { x: 0, y: 0, width: 1920, height: 1040 }
    const gia = { getDisplayNearestPoint: () => ({ workArea: WA }), getCursorScreenPoint: () => ({ x: 10, y: 10 }) }
    const log = []
    let moPhim = 0, ghiCo = 0
    class BW extends BrowserWindow {
      constructor(o) { o.show = false; o.webPreferences = Object.assign({}, o.webPreferences, { offscreen: { deviceScaleFactor: Number(TI_LE) } }); super(o) }
    }
    const the = lanDau.taoTheLanDau({ electron: { BrowserWindow: BW, screen: gia, ipcMain }, ghiLog: (m) => log.push(m), moiDesktop: () => {}, phim: () => 'Ctrl + Shift + S', lang: () => lang,
      nenTang: nt, doiPhim: () => { moPhim++ }, ghiCo: () => { ghiCo++ }, hienThat: false })
    const w = the.mo()
    nghe(w, 'the-lan-dau')
    const cho30 = Date.now()
    while (!log.some((m) => /^the lan dau: hien /.test(m)) && Date.now() - cho30 < 8000) await cho(60)
    const b = w.getBounds()
    const id = lang.toUpperCase() + '/' + (nt === 'darwin' ? 'Mac' : 'Win')
    kiem('The lan dau: ' + id + ' ghi co ngay luc mo (1 lan) va tu bao chieu cao that roi moi dat cua so', ghiCo === 1 && log.some((m) => /^the lan dau: hien /.test(m)), log.join(' | ').slice(0, 120))
    const nut = khayThu.oCuaSoNut(WA)
    const chong = !(b.x + b.width <= nut.x || b.x >= nut.x + nut.width || b.y + b.height <= nut.y || b.y >= nut.y + nut.height)
    kiem('The lan dau: ' + id + ' nam trong vung lam viec (' + b.x + ',' + b.y + ' ' + b.width + 'x' + b.height + ') va KHONG de len nut tron khay', b.x >= WA.x && b.y >= WA.y && b.x + b.width <= WA.x + WA.width && b.y + b.height <= WA.y + WA.height && !chong, chong ? 'DE LEN nut tron ' + JSON.stringify(nut) : '')
    await cho(350) // cho cua so doi co xong roi moi do (innerHeight cap nhat tre mot nhip trong cua so offscreen)
    const dt = await js(w, `(() => {
      const the = document.getElementById('the').getBoundingClientRect()
      const nut = [...document.querySelectorAll('button')].map((x) => { const r = x.getBoundingClientRect(); return { id: x.id, l: r.left, t: r.top, r: r.right, b: r.bottom, h: r.height } })
      const keys = [...document.querySelectorAll('.keycap')].map((x) => x.textContent)
      const ps = [...document.querySelectorAll('p')].map((x) => x.textContent)
      return { the: { l: the.left, t: the.top, r: the.right, b: the.bottom, w: the.width, h: the.height }, nut, keys, ps, scrollOk: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 1, vw: innerWidth, vh: innerHeight,
        tieuDe: document.getElementById('tieu-de').textContent, trong: ps.some((s) => !s.trim()) }
    })()`)
    kiem('The lan dau: ' + id + ' noi dung vua cua so, 2 nut nam tron trong the, khong cuon / tran (the ' + Math.round(dt.the.w) + 'x' + Math.round(dt.the.h) + ')', dt.scrollOk && dt.nut.length === 2 && dt.nut.every((n) => n.l >= dt.the.l && n.r <= dt.the.r && n.t >= dt.the.t && n.b <= dt.the.b && n.h >= 28) && dt.the.b <= dt.vh && dt.the.r <= dt.vw, JSON.stringify(dt.nut.map((n) => [n.id, Math.round(n.l), Math.round(n.r)])))
    kiem('The lan dau: ' + id + ' noi phim chup that (3 keycap Ctrl / Shift / S), co 4 doan giai thich + tieu de, khong con {phim}', dt.keys.join(',') === 'Ctrl,Shift,S' && dt.ps.length === 4 && !dt.trong && dt.ps.every((s) => !/\{phim\}/.test(s)) && dt.tieuDe.length > 5, dt.keys.join(',') + ' | ' + dt.ps.length)
    const ps = dt.ps.join(' ')
    // 07/11 anh chot: giu phim mac dinh, chi huong dan khach tu doi. Doan nay phai nam ngay duoi phim chup va goi dung ten nut Doi phim tren the.
    const nutDoi = await js(w, `document.getElementById('doi-phim').textContent`)
    kiem('The lan dau: ' + id + ' bao phim trung Luu thanh cua Premiere va chi dung nut "' + nutDoi + '" de doi', /Premiere/.test(dt.ps[1] || '') && /Lưu thành|Save As/.test(dt.ps[1] || '') && !!nutDoi && (dt.ps[1] || '').includes(nutDoi), dt.ps[1])
    kiem('The lan dau: ' + id + ' noi dung dung he dieu hanh (' + (nt === 'darwin' ? 'thanh menu tren cung' : 'khay he thong goc duoi phai') + ') va noi khay se tu thu ve nut tron',
      (nt === 'darwin' ? /menu bar|thanh menu/i.test(ps) && !/system tray|khay hệ thống/i.test(ps) : /system tray|khay hệ thống/i.test(ps)) && /round button|nút tròn/i.test(ps), ps.slice(0, 80))
    if (nt === 'win32') await quetTrang(w, 'the lan dau', lang)
    if (lang === 'vi' && nt === 'win32') {
      // bam Doi phim bang chuot that: mo Cai dat (1 lan) + dong the; the khac: Da hieu dong the, khong mo gi
      await bam(w, '#doi-phim')
      kiem('The lan dau: bam "Doi phim" -> mo Cai dat 1 lan va dong the', moPhim === 1 && !the.dangMo(), 'moPhim=' + moPhim + ' dangMo=' + the.dangMo())
      const w2 = the.mo(); nghe(w2, 'the-lan-dau-2')
      const t0 = Date.now(); while (!log.filter((m) => /^the lan dau: hien /.test(m)).length > 1 && Date.now() - t0 < 8000) await cho(60)
      await bam(w2, '#da-hieu')
      kiem('The lan dau: bam "Da hieu" -> dong the, khong mo Cai dat (them lan nao)', !the.dangMo() && moPhim === 1)
      const w3 = the.mo(); const t1 = Date.now(); while (log.filter((m) => /^the lan dau: hien /.test(m)).length < 3 && Date.now() - t1 < 8000) await cho(60)
      const dong = the.dong('thu')
      kiem('The lan dau: dong tu ben ngoai (nguoi dung chup lan dau) -> the bien mat', dong === true && !the.dangMo())
      void w3
    }
    the.dong('het'); the.go()
  }
}

/* ═════════ [overlay] viec 4, 5, 6 ═════════ */
async function phanOverlay() {
  for (const lang of ['vi', 'en']) {
    ngonNgu = lang
    const T = (k) => require(path.join(ROOT, 'src', 'i18n')).t(lang, k)
    const W = 1280, H = 800
    const ov = taoCuaSo(W, H, 'preload-overlay.js')
    nghe(ov, 'overlay')
    await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
    ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 }, lamMoKieu: 'mosaic', anNut: [], kinhLup: true })
    await cho(350)
    const o = (s) => js(ov, s)
    const L = lang.toUpperCase()
    const truoc = await o(`({ chon: document.getElementById('hint-chon').textContent.replace(/\\s+/g, ' ').trim(), xong: document.getElementById('hint-xong').hidden, an: document.getElementById('hint').classList.contains('hidden') })`)
    kiem('Goi y: ' + L + ' truoc khi khoanh vung van la "' + T('overlay.hint') + '" (khong doi)', truoc.chon.startsWith(T('overlay.hint')) && truoc.xong === true && truoc.an === false, JSON.stringify(truoc))
    if (HONG === 'hintHong') await o('hienHintXong = function () {}; true')
    ov.webContents.send('overlay:annotate', { x: 300, y: 140, w: 640, h: 380 })
    await cho(400)
    const sau = await o(`({ chonAn: document.getElementById('hint-chon').hidden, xong: document.getElementById('hint-xong').textContent, xongHien: !document.getElementById('hint-xong').hidden, hintAn: document.getElementById('hint').classList.contains('hidden'),
      tx: document.getElementById('xong').title, mode })`)
    kiem('Goi y sau khi khoanh vung: ' + L + ' dong goi y doi thanh "' + T('overlay.hintXong') + '" va hien (khong chong vung chon)', sau.mode === 'annotate' && sau.chonAn && sau.xongHien && sau.xong === T('overlay.hintXong') && sau.hintAn === false, JSON.stringify(sau))
    kiem('Goi y sau khi khoanh vung: ' + L + ' tooltip nut Xong luc thuong la "' + T('overlay.done') + '"', sau.tx === T('overlay.done'), sau.tx)
    // bat Storyboard bang phim S that
    await phimThat(ov, 'S')
    const sb = await o(`({ bat: isStoryboardMode, tx: document.getElementById('xong').title, xong: document.getElementById('hint-xong').textContent })`)
    kiem('Goi y sau khi khoanh vung: ' + L + ' bat Storyboard (phim S) -> nut Xong "' + T('overlay.doneSb') + '" va goi y "' + T('overlay.hintXongSb') + '"', sb.bat === true && sb.tx === T('overlay.doneSb') && sb.xong === T('overlay.hintXongSb'), JSON.stringify(sb))
    await phimThat(ov, 'S')
    const sb2 = await o(`({ bat: isStoryboardMode, tx: document.getElementById('xong').title, xong: document.getElementById('hint-xong').textContent })`)
    kiem('Goi y sau khi khoanh vung: ' + L + ' tat Storyboard -> tooltip Xong va goi y tro lai nhu thuong', sb2.bat === false && sb2.tx === T('overlay.done') && sb2.xong === T('overlay.hintXong'), JSON.stringify(sb2))
    // nhan kich thuoc + tay nam
    const nk = await o(`({ size: document.getElementById('size').title, tay: [...document.querySelectorAll('.sel-handle, .sel-edge')].map((e) => e.title), aria: document.getElementById('size').getAttribute('aria-label'), cur: getComputedStyle(document.getElementById('size')).cursor })`)
    kiem('Goi y: ' + L + ' nhan kich thuoc ghi "' + T('overlay.keoDoiKhung') + '" (con tro move), 12 tay nam / canh ghi "' + T('overlay.keoDoiCo') + '"', nk.size === T('overlay.keoDoiKhung') && nk.cur === 'move' && nk.tay.length === 12 && nk.tay.every((x) => x === T('overlay.keoDoiCo')) && nk.aria === nk.size, JSON.stringify([nk.size, nk.tay.length]))
    // mau: ten doc theo ngon ngu
    const mau = await o(`({ ten: [...document.querySelectorAll('#mau-pop .mau')].map((e) => e.getAttribute('aria-label')), nhom: document.getElementById('mau-nhom').getAttribute('aria-label'), titles: [...document.querySelectorAll('#mau-pop .mau')].map((e) => e.title) })`)
    const mong = ['mau.cam', 'mau.do', 'mau.vang', 'mau.xanhLa', 'mau.xanhDuong', 'mau.trang', 'mau.den'].map(T)
    kiem('Chu sai: ' + L + ' 7 mau co ten doc + tooltip theo ngon ngu (' + mong.slice(0, 3).join('/') + '...), nhom mau "' + T('overlay.mauNhom') + '"', JSON.stringify(mau.ten) === JSON.stringify(mong) && JSON.stringify(mau.titles) === JSON.stringify(mong) && mau.nhom === T('overlay.mauNhom'), JSON.stringify(mau.ten))
    // nut nhom: cham + tooltip
    if (HONG === 'nhomHong') await o(`document.querySelectorAll('.co-xo').forEach((n) => n.classList.remove('co-xo')); true`)
    const nhom = await o(`(() => {
      const r = {}
      for (const [n, c] of [['blur-nhom', 'blur-chinh'], ['but-nhom', 'but-chinh'], ['do-nhom', 'do-chinh'], ['ocr-nhom', 'ocr-chinh']]) {
        const g = document.getElementById(n), b = document.getElementById(c)
        const cs = getComputedStyle(b, '::before')
        r[n] = { co: g.classList.contains('co-xo'), content: cs.content, w: cs.width, pos: cs.position, title: b.title }
      }
      return r })()`)
    const reThem = T('overlay.reThem')
    const tt = (k) => nhom[k].title.split('\n')
    const dotOk = (k) => nhom[k].co && nhom[k].content !== 'none' && nhom[k].content !== 'normal' && nhom[k].w === '5px' && nhom[k].pos === 'absolute'
    const dotTat = (k) => !nhom[k].co && (nhom[k].content === 'none' || nhom[k].content === 'normal') && tt(k).length === 1
    kiem('Nut nhom: ' + L + ' Lam mo / But / Hut mau co cham 5 px o goc + tooltip hai dong ghi "' + reThem + '"', ['blur-nhom', 'but-nhom', 'do-nhom'].every((k) => dotOk(k) && tt(k)[1] === reThem), JSON.stringify(['blur-nhom', 'but-nhom', 'do-nhom'].map((k) => [dotOk(k), tt(k)[1]])))
    kiem('Nut nhom: ' + L + ' Doc chu KHONG cham, khong ghi "re chuot" khi may khong co BarcodeDetector (menu QR khong mo duoc)', dotTat('ocr-nhom'), JSON.stringify(nhom['ocr-nhom']))
    // doi loai nut thi tooltip van giu dong "re chuot"
    await phimThat(ov, '8')
    const sauBut = await o(`document.getElementById('but-chinh').title`)
    kiem('Nut nhom: ' + L + ' doi But -> Da quang (phim 8) tooltip van co dong "' + reThem + '"', sauBut.split('\n')[0] === T('overlay.daquang') && sauBut.split('\n')[1] === reThem, JSON.stringify(sauBut))
    await quetTrang(ov, 'overlay (da khoanh vung)', lang)
    ov.destroy()

    // vung khoanh de len cho dong goi y -> goi y KHONG hien (khong chong len vung)
    const ov2 = taoCuaSo(W, H, 'preload-overlay.js'); nghe(ov2, 'overlay2')
    await ov2.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
    ov2.webContents.send('overlay:init', { origin: { x: 0, y: 0 }, lamMoKieu: 'mosaic', anNut: [], kinhLup: true })
    await cho(300)
    ov2.webContents.send('overlay:annotate', { x: 400, y: 4, w: 480, h: 300 })
    await cho(400)
    const chong = await js(ov2, `({ an: document.getElementById('hint').classList.contains('hidden') })`)
    kiem('Goi y sau khi khoanh vung: ' + L + ' vung khoanh chong len cho goi y (sat mep tren giua man) -> goi y tu an, khong de len vung', chong.an === true, JSON.stringify(chong))
    ov2.destroy()

    // nhom Doc chu CO BarcodeDetector -> cham + tooltip
    const ov3 = taoCuaSo(W, H, 'preload-overlay.js', { qr: true }); nghe(ov3, 'overlay3')
    await ov3.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
    ov3.webContents.send('overlay:init', { origin: { x: 0, y: 0 }, lamMoKieu: 'mosaic', anNut: [], kinhLup: true })
    await cho(500)
    const qr = await js(ov3, `(() => { const b = document.getElementById('ocr-chinh'); const cs = getComputedStyle(b, '::before'); return { co: document.getElementById('ocr-nhom').classList.contains('co-xo'), w: cs.width, title: b.title } })()`)
    kiem('Nut nhom: ' + L + ' may CO BarcodeDetector (gia) -> nhom Doc chu co cham + tooltip "' + reThem + '"', qr.co && qr.w === '5px' && qr.title.split('\n')[1] === reThem, JSON.stringify(qr))
    ov3.destroy()
  }
}

/* ═════════ [settings] viec 3 (cai dat), 6, 10 ═════════ */
async function phanCaiDat() {
  for (const lang of ['vi', 'en']) {
    ngonNgu = lang
    const T = (k) => require(path.join(ROOT, 'src', 'i18n')).t(lang, k)
    const L = lang.toUpperCase()
    ghiNhan.phuDoi.length = 0; ghiNhan.tuChep.length = 0; cauHinhGia = {}
    const w = taoCuaSo(440, 1700, 'preload-settings.js'); nghe(w, 'settings')
    await w.loadFile(path.join(ROOT, 'src', 'settings', 'index.html'))
    await cho(500)
    const o = (s) => js(w, s)
    const gia = await o(`(() => ({
      tuChep: [...document.querySelectorAll('#tu-chep .chon-nut')].map((b) => b.dataset.v + (b.classList.contains('chon') ? '*' : '')).join(','),
      hang: ['keys-lai', 'keys-canvas', 'keys'].map((i) => [...document.getElementById(i).querySelectorAll('.keycap:not(.cong)')].map((k) => k.textContent).join('+')),
      nhan: [...document.querySelectorAll('.nhan-chon')].map((e) => e.textContent), ocr: document.getElementById('chip-ocr-nhan').textContent,
      aria: [document.getElementById('lang').getAttribute('aria-label'), document.getElementById('close').getAttribute('aria-label')], tieuDe: document.title,
      chonTuChepGoiY: document.querySelector('#tu-chep').closest('.hang').querySelector('.goi-y').textContent }))()`)
    kiem('Cai dat: ' + L + ' o "' + T('set.tuChep') + '" mac dinh BAT (nguoi cu / moi) + dong giai thich', gia.tuChep === '1*,0' && gia.chonTuChepGoiY === T('set.tuChep.goiY') && gia.nhan.includes(T('set.tuChep')), JSON.stringify([gia.tuChep, gia.chonTuChepGoiY.slice(0, 30)]))
    kiem('Cai dat: ' + L + ' co hang phim "' + T('set.phim.chup') + '", "' + T('set.phim.lai') + '", "' + T('set.phim.canvas') + '" voi keycap dung (Ctrl+Shift+Alt+S / Ctrl+Alt+Shift+C)', gia.nhan.includes(T('set.phim.chup')) && gia.nhan.includes(T('set.phim.lai')) && gia.nhan.includes(T('set.phim.canvas')) && gia.hang[0] === 'Ctrl+Shift+Alt+S' && gia.hang[1] === 'Ctrl+Alt+Shift+C' && gia.hang[2] === 'Ctrl+Shift+S', JSON.stringify(gia.hang))
    kiem('Cai dat: ' + L + ' nhan doc cho trinh doc man hinh + tieu de cua so lay tu i18n ("' + T('set.ngonNgu') + '" / "' + T('set.dong') + '")', gia.aria[0] === T('set.ngonNgu') && gia.aria[1] === T('set.dong') && gia.tieuDe === T('win.caiDat'), JSON.stringify(gia.aria) + ' ' + gia.tieuDe)
    kiem('Cai dat: ' + L + ' nhan nut Doc chu = "' + T('set.nut.ocrChi') + '" khi may khong co BarcodeDetector (khong ghi QR)', (HONG === 'ocrChipHong' ? false : gia.ocr === T('set.nut.ocrChi')), gia.ocr)
    // bam tu chep: tat -> luu false; reload thi nho
    await bam(w, '#tu-chep .chon-nut[data-v="0"]')
    kiem('Cai dat: ' + L + ' bam "' + T('set.tat2') + '" o tu chep (chuot that) -> luu false, nut doi dang chon', ghiNhan.tuChep[ghiNhan.tuChep.length - 1] === false && (await o(`document.querySelector('#tu-chep .chon-nut.chon').dataset.v`)) === '0', JSON.stringify(ghiNhan.tuChep))
    await w.reload(); await cho(500)
    kiem('Cai dat: ' + L + ' mo lai Cai dat -> tu chep van TAT (da luu), bat lai duoc', (await o(`document.querySelector('#tu-chep .chon-nut.chon').dataset.v`)) === '0')
    await bam(w, '#tu-chep .chon-nut[data-v="1"]')
    kiem('Cai dat: ' + L + ' bat lai -> luu true', ghiNhan.tuChep[ghiNhan.tuChep.length - 1] === true)

    // ghi phim chup lai bang ban phim that
    await bam(w, '#doi-lai')
    const dangGhi = await o(`({ ghi: document.getElementById('keys-lai').classList.contains('ghi'), txt: document.getElementById('keys-lai').textContent, huy: !document.getElementById('huy-lai').hidden, doi: document.getElementById('doi-lai').hidden })`)
    kiem('Phim phu: ' + L + ' bam "' + T('set.phim.doiPhim') + '" o hang chup lai -> hien "' + T('set.phim.nhanToHop') + '", nut Huy thay nut Doi', dangGhi.ghi && dangGhi.txt === T('set.phim.nhanToHop') && dangGhi.huy && dangGhi.doi, JSON.stringify(dangGhi))
    await phimThat(w, 'K', ['control', 'alt'])
    const lai1 = ghiNhan.phuDoi[ghiNhan.phuDoi.length - 1]
    const kcLai = await o(`[...document.getElementById('keys-lai').querySelectorAll('.keycap:not(.cong)')].map((k) => k.textContent).join('+')`)
    kiem('Phim phu: ' + L + ' nhan Ctrl+Alt+K (ban phim that) -> luu ngay (loai lai, Ctrl+Alt+K), hang hien keycap moi', JSON.stringify(lai1) === JSON.stringify(['lai', 'Ctrl+Alt+K']) && kcLai === 'Ctrl+Alt+K', JSON.stringify(lai1) + ' ' + kcLai)
    // nhan phim khong co modifier -> bao loi, chua luu
    await bam(w, '#doi-canvas')
    const n0 = ghiNhan.phuDoi.length
    await phimThat(w, 'K', [])
    const loiMod = await o(`document.getElementById('msg-canvas').textContent`)
    kiem('Phim phu: ' + L + ' phim KHONG co Ctrl/Alt/Shift -> bao "' + T('set.phim.canModifier') + '", chua luu gi', ghiNhan.phuDoi.length === n0 && loiMod === T('set.phim.canModifier'), loiMod)
    // trung -> loi
    traPhuKeTiep = { ok: false, lyDo: 'trung', hotkey: 'CommandOrControl+Alt+Shift+C' }
    await phimThat(w, 'S', ['control', 'shift'])
    const loiTrung = await o(`({ msg: document.getElementById('msg-canvas').textContent, cls: document.getElementById('msg-canvas').className, keys: [...document.getElementById('keys-canvas').querySelectorAll('.keycap:not(.cong)')].map((k) => k.textContent).join('+') })`)
    kiem('Phim phu: ' + L + ' phim bi tu choi (trung) -> hien "' + T('set.phim.trung').slice(0, 30) + '...", giu keycap cu Ctrl+Alt+Shift+C', loiTrung.msg === T('set.phim.trung') && /err/.test(loiTrung.cls) && loiTrung.keys === 'Ctrl+Alt+Shift+C', JSON.stringify(loiTrung))
    // app khac giu
    await bam(w, '#doi-canvas')
    traPhuKeTiep = { ok: false, lyDo: 'bi-giu', hotkey: 'CommandOrControl+Alt+Shift+C' }
    await phimThat(w, 'J', ['control', 'alt'])
    const loiGiu = await o(`document.getElementById('msg-canvas').textContent`)
    kiem('Phim phu: ' + L + ' phim bi app khac giu -> hien "' + T('set.phim.biGiu').slice(0, 30) + '..."', loiGiu === T('set.phim.biGiu'), loiGiu)
    // tat + ve mac dinh
    await bam(w, '#tat-lai')
    const tatLai = await o(`({ txt: document.getElementById('keys-lai').textContent, tat: document.getElementById('tat-lai').hidden })`)
    kiem('Phim phu: ' + L + ' bam "' + T('set.phim.tat') + '" -> luu rong, hang hien "' + T('set.phim.dangTat') + '", nut Tat an', JSON.stringify(ghiNhan.phuDoi[ghiNhan.phuDoi.length - 1]) === JSON.stringify(['lai', '']) && tatLai.txt === T('set.phim.dangTat') && tatLai.tat === true, JSON.stringify(tatLai))
    await bam(w, '#reset-lai')
    const veMd = await o(`[...document.getElementById('keys-lai').querySelectorAll('.keycap:not(.cong)')].map((k) => k.textContent).join('+')`)
    kiem('Phim phu: ' + L + ' bam ve mac dinh -> gui phim mac dinh cua main (Ctrl+Shift+Alt+S) va hien lai keycap', JSON.stringify(ghiNhan.phuDoi[ghiNhan.phuDoi.length - 1]) === JSON.stringify(['lai', 'CommandOrControl+Shift+Alt+S']) && veMd === 'Ctrl+Shift+Alt+S', JSON.stringify(ghiNhan.phuDoi[ghiNhan.phuDoi.length - 1]) + ' ' + veMd)
    // chi mot hang ghi cung luc
    await bam(w, '#doi-lai'); await bam(w, '#doi-canvas')
    const hai = await o(`({ lai: document.getElementById('keys-lai').classList.contains('ghi'), canvas: document.getElementById('keys-canvas').classList.contains('ghi') })`)
    kiem('Phim phu: ' + L + ' bam Doi o hang thu hai -> hang thu nhat thoat che do ghi (chi MOT hang ghi cung luc)', hai.lai === false && hai.canvas === true, JSON.stringify(hai))
    await bam(w, '#huy-canvas')
    await quetTrang(w, 'Cai dat', lang)
    w.destroy()

    // co BarcodeDetector -> nhan "Doc chu / QR"
    const wq = taoCuaSo(440, 1700, 'preload-settings.js', { qr: true }); nghe(wq, 'settings-qr')
    await wq.loadFile(path.join(ROOT, 'src', 'settings', 'index.html'))
    await cho(600)
    const ocr2 = await js(wq, `({ t: document.getElementById('chip-ocr-nhan').textContent, tip: document.getElementById('chip-ocr-nhan').parentNode.title })`)
    kiem('Cai dat: ' + L + ' may CO BarcodeDetector (gia) -> nhan nut "' + T('set.nut.ocr') + '" (co QR)', ocr2.t === T('set.nut.ocr') && ocr2.tip === T('set.nut.ocr'), JSON.stringify(ocr2))
    wq.destroy()
  }
}

/* ═════════ [trong] viec 9 + 6 + 7: khay, khay video, tim anh, ghim ═════════ */
const THUMB = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
async function phanTrong() {
  for (const lang of ['vi', 'en']) {
    ngonNgu = lang
    const i18n = require(path.join(ROOT, 'src', 'i18n'))
    const T = (k) => i18n.t(lang, k)
    const L = lang.toUpperCase()
    // khay anh noi (shelf): trong va co anh
    for (const kieu of ['ngang', 'doc']) {
      const [W, H] = kieu === 'doc' ? [252, 448] : [380, 128]
      const w = taoCuaSo(W, H, 'preload-shelf.js'); nghe(w, 'khay-' + kieu)
      await w.loadFile(path.join(ROOT, 'src', 'shelf', 'index.html'))
      if (kieu === 'doc') await js(w, `document.body.classList.add('doc'); true`)
      await cho(350)
      const d = await js(w, `(() => { const e = document.getElementById('empty'); const r = e.getBoundingClientRect(); const b = e.querySelector('.chup-ngay'); const br = b.getBoundingClientRect(); const bar = document.getElementById('bar').getBoundingClientRect(); const chip = e.querySelector('.phim-chip')
        return { hien: getComputedStyle(e).display !== 'none', btnTxt: b.textContent, chip: chip.textContent, dong: e.querySelector('.dong-chu').textContent, bt: br.top, bb: br.bottom, bl: br.left, brr: br.right, et: r.top, eb: r.bottom, vw: innerWidth, vh: innerHeight, barB: bar.bottom, title: document.title, logo: document.getElementById('logo').title, don: document.getElementById('clear').title } })()`)
      kiem('Trang trong: ' + L + ' khay anh (' + kieu + ') hien dung phim chup dang dat "Ctrl + Shift + S" va nut "' + T('chup.ngay') + '"', d.hien && d.chip === 'Ctrl + Shift + S' && d.btnTxt === T('chup.ngay') && d.dong.includes(T('khay.trong')) && d.dong.includes('Ctrl + Shift + S'), d.dong)
      kiem('Trang trong: ' + L + ' khay anh (' + kieu + ') nut nam tron trong khay, duoi thanh tren (nut ' + Math.round(d.bl) + '-' + Math.round(d.brr) + ' / ' + Math.round(d.bt) + '-' + Math.round(d.bb) + ', khay ' + d.vw + 'x' + d.vh + ')', d.bl >= 0 && d.brr <= d.vw && d.bt >= d.barB && d.bb <= d.vh && d.bb - d.bt >= 24, '')
      kiem('Tooltip khay: ' + L + ' thung rac "' + T('khay.don') + '" ghi ro anh van trong thu muc; logo / tieu de cua so lay tu i18n', d.don === T('khay.don') && /thư mục|folder/.test(d.don) && d.logo === T('khay.logoTitle') && d.title === T('win.khay'), d.don)
      if (kieu === 'ngang') {
        const n0 = ghiNhan.chupNgay
        await bam(w, '#empty .chup-ngay')
        kiem('Trang trong: ' + L + ' bam "' + T('chup.ngay') + '" o khay anh (chuot that) -> gui lenh chup ngay (1 lan)', ghiNhan.chupNgay === n0 + 1, String(ghiNhan.chupNgay - n0))
        // co anh: tooltip o anh nhac nut Lam dep
        w.webContents.send('shelf:add', { id: 1, seq: 1, thumb: THUMB, filePath: 'x.png', w: 100, h: 60, kb: 3 })
        await cho(300)
        const tip = await js(w, `document.querySelector('.item').title`)
        kiem('Tooltip khay: ' + L + ' o anh ghi "bam de ghim" va nhac co nut Lam dep sau khi ghim', tip.split('\n')[0] === T('khay.oGhim') && /Làm đẹp|Beautify/.test(tip), tip)
        await quetTrang(w, 'khay anh', lang)
      }
      w.destroy()
    }
    // khay gop: Storyboard | Video (trong)
    const wk = taoCuaSo(1000, 700, 'preload-khay.js'); nghe(wk, 'khay-gop')
    await wk.loadFile(path.join(ROOT, 'src', 'khay', 'index.html'), { query: { tab: 'dai' } })
    await cho(500)
    const kg = await js(wk, `(() => {
      const lay = (id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return { hien: !e.hidden && r.height > 0, p: e.querySelector('p').textContent, nut: e.querySelector('.chup-ngay').textContent } }
      return { dai: lay('trong-dai'), video: (document.querySelector('#tab button[data-tab=video]').click(), lay('trong-video')), title: document.title } })()`)
    const phimLay = 'Ctrl + Shift + S'
    kiem('Trang trong: ' + L + ' khay Storyboard trong dung THU TU "chup, khoanh vung, bam S, bam Xong" va ghi phim chup dang dat', kg.dai.hien && kg.dai.p.includes(phimLay) && kg.dai.p === T('sb.chuaCoDai').replace('{phim}', phimLay) && kg.dai.nut === T('chup.ngay'), kg.dai.p)
    kiem('Trang trong: ' + L + ' khay video trong ghi phim chup dang dat + nut "' + T('chup.ngay') + '"', kg.video.hien && kg.video.p.includes(phimLay) && kg.video.p === T('vd.chuaCo').replace('{phim}', phimLay) && kg.video.nut === T('chup.ngay'), kg.video.p)
    const idx = (s, a) => s.indexOf(a)
    const dd = kg.dai.p
    const viTri = lang === 'vi' ? ['chụp', 'khoanh vùng', 'bấm S', 'bấm Xong'] : ['capture', 'select an area', 'press S', 'click Done']
    const vt = viTri.map((x) => idx(dd, x))
    kiem('Trang trong: ' + L + ' thu tu cac buoc trong cau Storyboard dung (' + viTri.join(' < ') + ')', vt.every((x) => x >= 0) && vt.every((x, i) => i === 0 || x > vt[i - 1]), vt.join(','))
    const n1 = ghiNhan.chupNgay
    await bam(wk, '#trong-video .chup-ngay')
    kiem('Trang trong: ' + L + ' bam "' + T('chup.ngay') + '" o khay video (chuot that) -> gui lenh chup ngay', ghiNhan.chupNgay === n1 + 1)
    kiem('Trang trong: ' + L + ' tieu de cua so khay lay tu i18n', kg.title === T('win.khayGop'), kg.title)
    await quetTrang(wk, 'khay Storyboard / Video', lang)
    wk.destroy()
    // tim anh: kho trong va khong khop
    const ta = { tong: 0 }
    ipcMain.removeHandler('tim-anh:tim'); ipcMain.removeHandler('tim-anh:trang-thai'); ipcMain.removeHandler('tim-anh:thumb')
    ipcMain.handle('tim-anh:tim', () => ({ ds: [], tong: 0, ms: 1, trangThai: { tong: ta.tong, daDoc: ta.tong, choDoc: 0, tamDung: false } }))
    ipcMain.handle('tim-anh:trang-thai', () => ({ tong: ta.tong, daDoc: ta.tong, choDoc: 0, tamDung: false }))
    ipcMain.handle('tim-anh:thumb', () => null)
    ipcMain.on('tim-anh:close', () => {})
    const wt = taoCuaSo(960, 640, 'preload-tim-anh.js'); nghe(wt, 'tim-anh')
    await wt.loadFile(path.join(ROOT, 'src', 'tim-anh', 'index.html'))
    await cho(600)
    const t1 = await js(wt, `(() => { const p = document.getElementById('trong'), b = document.getElementById('chup-ngay-ta'); const r = b.getBoundingClientRect(); return { p: p.textContent, ph: p.hidden, bh: b.hidden, btn: b.textContent, trong: r.top > 0 && r.bottom < innerHeight && r.right < innerWidth, title: document.title } })()`)
    kiem('Trang trong: ' + L + ' Tim anh khi kho trong ghi phim chup dang dat + nut "' + T('chup.ngay') + '" nam trong cua so', !t1.ph && !t1.bh && t1.p === T('ta.trongKho').replace('{phim}', 'Ctrl + Shift + S') && t1.btn === T('chup.ngay') && t1.trong, t1.p)
    const n2 = ghiNhan.chupNgay
    await bam(wt, '#chup-ngay-ta')
    kiem('Trang trong: ' + L + ' bam "' + T('chup.ngay') + '" o Tim anh (chuot that) -> gui lenh chup ngay', ghiNhan.chupNgay === n2 + 1)
    ta.tong = 5
    await js(wt, `document.getElementById('o-tim').value = 'zzz'; document.getElementById('o-tim').dispatchEvent(new Event('input')); true`)
    await cho(500)
    const t2 = await js(wt, `({ p: document.getElementById('trong').textContent, bh: document.getElementById('chup-ngay-ta').hidden })`)
    kiem('Trang trong: ' + L + ' Tim anh khong khop (kho co anh) -> noi ro anh moi duoc doc chu dan trong nen, KHONG co nut Chup ngay', t2.p === T('ta.chuaCo') && /(trong nền|in the background)/.test(t2.p) && t2.bh === true, t2.p)
    await quetTrang(wt, 'Tim anh', lang)
    wt.destroy()
    // anh ghim: tooltip + nhan
    const wp = taoCuaSo(260, 200, 'preload-pin.js'); nghe(wp, 'pin')
    await wp.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
    wp.webContents.send('pin:data', { dataUrl: THUMB, pad: 12, w: 236, h: 176, lamMoKieu: 'mosaic' })
    await cho(500)
    const pg = await js(wp, `({ img: document.getElementById('img').title, lamDep: document.getElementById('lam-dep').title, mau: [...document.querySelectorAll('#mau-pop .mau')].map((e) => e.getAttribute('aria-label')), nhom: ['lam-mo-nhom', 'but-nhom'].map((n) => document.getElementById(n).classList.contains('co-xo')), lamMoTip: document.getElementById('lam-mo-chinh').title })`)
    kiem('Tooltip ghim: ' + L + ' do trong suot (Ctrl + lan chuot) ghi "' + (lang === 'vi' ? 'độ trong suốt' : 'transparency') + '", khong con "' + (lang === 'vi' ? 'độ mờ' : 'opacity') + '"', pg.img === T('ghim.goiY') && (lang === 'vi' ? /độ trong suốt/.test(pg.img) && !/độ mờ/.test(pg.img) : /transparency/.test(pg.img) && !/opacity/.test(pg.img)), pg.img)
    kiem('Tooltip ghim: ' + L + ' nut Lam dep ghi ro "' + (lang === 'vi' ? 'nền màu, bo góc, đổ bóng' : 'colored background') + '"', pg.lamDep === T('ghim.lamDep') && (lang === 'vi' ? /nền màu, bo góc, đổ bóng/.test(pg.lamDep) : /colored background, rounded corners and shadow/.test(pg.lamDep)), pg.lamDep)
    kiem('Nut nhom: ' + L + ' thanh ve cua anh ghim cung co cham + tooltip "' + T('overlay.reThem') + '" (Lam mo, But)', pg.nhom.every(Boolean) && pg.lamMoTip.split('\n')[1] === T('overlay.reThem'), JSON.stringify(pg.nhom))
    await quetTrang(wp, 'anh ghim', lang, /^(\d+ ?[×x] ?\d+)$/)
    wp.destroy()
  }
}

/* ═════════ [cuon] viec 8: dong ho chup cuon co dong huong dan ═════════ */
async function phanCuon() {
  for (const lang of ['vi', 'en']) {
    ngonNgu = lang
    const i18n = require(path.join(ROOT, 'src', 'i18n'))
    const T = (k) => i18n.t(lang, k)
    const L = lang.toUpperCase()
    const rongCuaSo = 460, caoCuaSo = 40
    const w = taoCuaSo(rongCuaSo, caoCuaSo, 'preload-dem.js'); nghe(w, 'quay')
    await w.loadFile(path.join(ROOT, 'src', 'dem', 'quay.html'), { query: { lang, dung: T('cuon.xong'), dungTitle: T('cuon.xongTitle'), goiY: HONG === 'cuonHong' ? '' : T('cuon.goiY') } })
    await js(w, `window.batDau && window.batDau({}); window.datChu && window.datChu('1.240 px'); true`)
    await cho(300)
    const d = await js(w, `(() => { const t = document.getElementById('thuoc').getBoundingClientRect(); const g = document.getElementById('goi-y'); const gr = g.getBoundingClientRect(); const b = document.getElementById('dung').getBoundingClientRect()
      return { goiY: g.textContent, gHien: getComputedStyle(g).display !== 'none' && gr.width > 0, tr: t.right, tl: t.left, th: t.height, gr: gr.right, gl: gr.left, bl: b.left, br: b.right, vw: innerWidth, gio: document.getElementById('gio').textContent, nut: document.getElementById('dung-chu').textContent } })()`)
    kiem('Chup cuon: ' + L + ' vien thuoc co dong "' + T('cuon.goiY') + '", van co so chieu cao va nut "' + T('cuon.xong') + '"', d.goiY === T('cuon.goiY') && d.gHien && d.gio === '1.240 px' && d.nut === T('cuon.xong'), JSON.stringify([d.goiY, d.gio, d.nut]))
    kiem('Chup cuon: ' + L + ' vien thuoc vua cua so ' + rongCuaSo + ' px (khong bi cat: thuoc phai ' + Math.round(d.tr) + ' <= ' + rongCuaSo + '), dong huong dan nam truoc nut Xong, khong de len nhau', d.tr <= rongCuaSo - 4 && d.gr <= d.bl && d.gl >= d.tl && d.br <= d.tr, JSON.stringify([d.tr, d.gr, d.bl]))
    await quetTrang(w, 'dong ho chup cuon', lang)
    w.destroy()
  }
  // dong ho QUAY VIDEO thuong (khong co goiY) khong bi them dong thua
  ngonNgu = 'vi'
  const w2 = taoCuaSo(240, 40, 'preload-dem.js')
  await w2.loadFile(path.join(ROOT, 'src', 'dem', 'quay.html'), { query: { lang: 'vi', dung: 'Dừng', dungTitle: 'Dừng quay video và lưu video' } })
  await js(w2, `window.batDau({}); true`)
  await cho(250)
  const v = await js(w2, `(() => { const t = document.getElementById('thuoc').getBoundingClientRect(); return { gHien: getComputedStyle(document.getElementById('goi-y')).display !== 'none', tr: t.right, vw: innerWidth } })()`)
  kiem('Chup cuon: dong ho quay video thuong KHONG co dong huong dan, van vua cua so 240 px (thuoc phai ' + Math.round(v.tr) + ')', v.gHien === false && v.tr <= 240, JSON.stringify(v))
  w2.destroy()
}

;(async () => {
  await app.whenReady()
  const ds = [['i18n', phanI18n], ['the', phanThe], ['overlay', phanOverlay], ['settings', phanCaiDat], ['trong', phanTrong], ['cuon', phanCuon]]
  for (const [ten, f] of ds) {
    if (!chayNhom(ten)) continue
    try { await f() } catch (e) { kiem('CHAY DUOC: phan ' + ten, false, (e && e.stack || e).toString().split('\n').slice(0, 3).join(' / ')) }
  }
  console.log('KQ=' + JSON.stringify({ kq, loiTrang }))
  app.exit(0)
})()
