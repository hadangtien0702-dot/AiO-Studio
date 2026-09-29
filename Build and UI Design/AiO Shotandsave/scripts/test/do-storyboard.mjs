/* =========================================================================
   Test kiem tra tinh nang Multi-Shot Storyboard Strip (AiO Shot & Save).
   Chay bang: node scripts/test/do-storyboard.mjs
   Khong bat cua so, khong can thiep man hinh.
   ========================================================================= */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => {
  kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : ''))
  if (!ok) dat = false
}

console.log('\n[1] Kiem tra Da ngon ngu (i18n.js)')
const i18nContent = fs.readFileSync(path.join(ROOT, 'src', 'i18n.js'), 'utf8')
const keys = [
  'khay.storyboard',
  'sb.tieuDe',
  'sb.shots',
  'sb.copy',
  'sb.copyThanhCong',
  'sb.luu',
  'sb.luuThanhCong',
  'sb.dong',
  'sb.keo',
  'sb.boCuc',
  'sb.ngang',
  'sb.luoi',
  'sb.nhanShot',
  'sb.thongTin',
  'sb.chuaCoAnh',
  'sb.boShot',
  'overlay.storyboard',
  'overlay.storyboard_btn',
  'overlay.storyboard_chip',
]
for (const k of keys) {
  const count = (i18nContent.match(new RegExp("'" + k + "':", 'g')) || []).length
  kiem('Khoa ' + k + ' co du ca 2 ngon ngu (VI + EN)', count === 2, 'tim thay ' + count + ' lan')
}

// Kiem tra khong dung gach ngang dai "—" trong cac chuoi storyboard moi
const lines = i18nContent.split('\n')
const sbLines = lines.filter((l) => l.includes("'sb.") || l.includes("'khay.storyboard'"))
const coGachNgangDai = sbLines.some((l) => l.includes('—'))
kiem('Khong dung gach ngang dai "—" trong chuoi i18n Storyboard (Luat muc 5)', !coGachNgangDai)

console.log('\n[2] Kiem tra Khay anh (Shelf UI & Keybindings)')
const shelfHtml = fs.readFileSync(path.join(ROOT, 'src', 'shelf', 'index.html'), 'utf8')
kiem('Nut #storyboard co mat tren thanh bar khay anh', shelfHtml.includes('id="storyboard"'))
// 29/09: muc cu doi `rect x="2" y="4"` = KHOA hinh o luoi # anh che "gom qua". Nay kiem LUAT ICON AiO (MASTER.md
// Luat 02) + khay dung CUNG hinh voi 2 nut Storyboard o overlay (mot khai niem, mot icon).
const svgCua = (html, mo) => { const i = html.indexOf(mo); const j = html.indexOf('</svg>', i); return i < 0 || j < 0 ? '' : html.slice(html.indexOf('<svg', i), j) }
const netVe = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('|')
const icKhay = svgCua(shelfHtml, 'id="storyboard"')
const luat02 = ['viewBox="0 0 24 24"', 'fill="none"', 'stroke="currentColor"', 'stroke-width="1.9"', 'stroke-linecap="round"', 'stroke-linejoin="round"']
const thieuLuat = luat02.filter((a) => !icKhay.includes(a))
kiem('Nut #storyboard dung icon SVG inline dung Luat 02 AiO', icKhay !== '' && thieuLuat.length === 0, thieuLuat.join(', '))
const overlayHtmlIc = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'index.html'), 'utf8')
const netOverlay = [netVe(svgCua(overlayHtmlIc, 'id="sel-storyboard-btn"')), netVe(svgCua(overlayHtmlIc, 'data-tool="storyboard"'))]
kiem('Icon Storyboard khay = khung chon = thanh ve (cung net ve)', netVe(icKhay) !== '' && netOverlay.every((n) => n === netVe(icKhay)))

const shelfCss = fs.readFileSync(path.join(ROOT, 'src', 'shelf', 'shelf.css'), 'utf8')
kiem('shelf.css co style hover mau cam neon cho #storyboard', shelfCss.includes('#bar #storyboard:hover'))

const shelfJs = fs.readFileSync(path.join(ROOT, 'src', 'shelf', 'shelf.js'), 'utf8')
kiem('shelf.js lang nghe click tren #storyboard', shelfJs.includes("getElementById('storyboard')") && shelfJs.includes('openStoryboard'))
kiem('shelf.js lang nghe phim tat nhanh S', shelfJs.includes("e.key === 's'") || shelfJs.includes('e.key === "s"'))

const pShelf = fs.readFileSync(path.join(ROOT, 'src', 'preload-shelf.js'), 'utf8')
kiem('preload-shelf.js expose openStoryboard qua IPC', pShelf.includes('openStoryboard:'))

console.log('\n[3] Kiem tra Storyboard Preload & Window files')
const pSb = fs.readFileSync(path.join(ROOT, 'src', 'preload-storyboard.js'), 'utf8')
kiem('preload-storyboard.js expose getData', pSb.includes('getData:'))
kiem('preload-storyboard.js expose copy', pSb.includes('copy:'))
kiem('preload-storyboard.js expose save', pSb.includes('save:'))
// 29/09 keo CA DAI: startDrag cu (gui byte SAU dragstart) doi thanh chuanBiKeo (ve san) + keoDai (chi gui id)
kiem('preload-storyboard.js expose chuanBiKeo + keoDai (keo ca dai ve san)', pSb.includes('chuanBiKeo:') && pSb.includes('keoDai:'))
kiem('preload-storyboard.js expose close', pSb.includes('close:'))

const sbHtml = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'index.html'), 'utf8')
kiem('storyboard/index.html co title va main-canvas', sbHtml.includes('id="main-canvas"'))
// 29/09 khay Storyboard = danh sach dai: nut Luu / Sao chep / Xoa dai nam TREN MOI HANG (storyboard.js tao), khong con nut chung
const sbJsSom = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.js'), 'utf8')
kiem('moi hang dai co nut Sao chep (nut chinh)', sbJsSom.includes("nut('nut chinh', t('sb.copyNut')"))
kiem('moi hang dai co nut Luu PNG + Xoa dai (bam 2 lan)', sbJsSom.includes("t('sb.luuNut')") && sbJsSom.includes('window.storyboard.xoaDai(') && sbJsSom.includes('xac-nhan'))
// 29/09 anh: XOA hang "Xuat dang" — anh xuat luon la LUOI (khong con nut doi bo cuc)
kiem('KHONG con hang "Xuat dang", anh xuat co dinh LUOI', !sbHtml.includes('id="btn-filmstrip"') && !sbHtml.includes('id="toolbar"') && /const currentLayout = 'grid'/.test(fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.js'), 'utf8')))

const sbCss = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.css'), 'utf8')
/* [28/09 Claude] Truoc: muc nay BAT storyboard.css tu khai #090a0d / #f86820 — chinh bo mau rieng do lam khay
   Storyboard lech khay anh (anh Tien: "dong bo va dep voi khay anh thuong"). Nay kiem dieu nguoc lai:
   dung CHUNG assets/tokens.css, khong tu khai token, va moi var(--x) dung toi PHAI co trong tokens.css
   (token khong ton tai -> trinh duyet bo ca khai bao, im lang — LESSONS 07/09 muc 4). */
const tokensCss = fs.readFileSync(path.join(ROOT, 'assets', 'tokens.css'), 'utf8')
const tokenCo = new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
const tuKhai = [...sbCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])
const dungToi = [...new Set([...sbCss.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
const tuDat = new Set([...sbJsSom.matchAll(/setProperty\('(--[\w-]+)'/g)].map((m) => m[1])) // bien cuc bo storyboard.js tu dat (vd --cot)
const thieuToken = dungToi.filter((v) => !tokenCo.has(v) && !tuDat.has(v))
kiem('storyboard/index.html nap assets/tokens.css (chung khay anh)', sbHtml.includes('../../assets/tokens.css'))
kiem('storyboard.css KHONG tu khai token rieng (' + tuKhai.length + ')', tuKhai.length === 0, tuKhai.join(', '))
kiem('storyboard.css dung ' + dungToi.length + ' token - tat ca co trong tokens.css', dungToi.length > 10 && thieuToken.length === 0, 'THIEU: ' + thieuToken.join(', '))
// Chuan giao dien = man Cai dat (anh Tien 28/09: "font chu - pill - cach em sap xep"): header 46px + cum pill + nut vien thuoc.
const setCss = fs.readFileSync(path.join(ROOT, 'src', 'settings', 'settings.css'), 'utf8')
const khoi = (css, sel) => { const m = css.match(new RegExp('\\n' + sel.replace(/[.#]/g, '\\$&') + '\\s*\\{([^}]*)\\}')); return m ? m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim() : null }
const giongCaiDat = ['.chon-nhom', '.chon-nut', '.chon-nut:hover', '.nut', '.nut.chinh', '.nhan-chon', '.dong']
  .filter((s) => khoi(setCss, s) !== khoi(sbCss, s))
kiem('Header storyboard cung khuon #tieu-de cua Cai dat (46px)', sbHtml.includes('id="tieu-de"') && /#tieu-de\s*\{[^}]*height:\s*46px/.test(sbCss))
kiem('Pill + nut + nhan storyboard CHEP NGUYEN tu settings.css (7 khoi)', giongCaiDat.length === 0, 'LECH: ' + giongCaiDat.join(', '))

const sbJs = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.js'), 'utf8')
kiem('storyboard.js co engine renderFilmstrip', sbJs.includes('function renderFilmstrip()'))
kiem('storyboard.js co engine renderGrid', sbJs.includes('function renderGrid()'))
kiem('storyboard.js co ham drawShotBadge', sbJs.includes('function drawShotBadge('))
kiem('storyboard.js co ham drawInfoBar footer', sbJs.includes('function drawInfoBar('))
kiem('nut x tren tung khung goi storyboard:bo-khung (preload + main)', sbJs.includes('window.storyboard.boKhung(') && fs.readFileSync(path.join(ROOT, 'src', 'preload-storyboard.js'), 'utf8').includes("'storyboard:bo-khung'") && fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8').includes("ipcMain.handle('storyboard:bo-khung'"))
// 29/09 tach han 2 khay: khay anh BO QUA file dai; Luu dai KHONG shelfAdd; get-data KHONG doc shelfItems
const mainSom = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')
const khoiGet = mainSom.slice(mainSom.indexOf("ipcMain.handle('storyboard:get-data'"), mainSom.indexOf("ipcMain.handle('storyboard:bo-khung'"))
const khoiSave = mainSom.slice(mainSom.indexOf("ipcMain.handle('storyboard:save'"), mainSom.indexOf("ipcMain.handle('storyboard:chuan-bi-keo'"))
kiem('khay Storyboard KHONG lay anh chup thuong (get-data khong doc shelfItems)', khoiGet.length > 50 && !khoiGet.includes('shelfItems'))
kiem('Luu dai KHONG dua vao khay anh thuong (khong shelfAdd)', khoiSave.length > 50 && !/shelfAdd\(/.test(khoiSave))
kiem('Khay anh thuong bo qua file shotandsave-storyboard-*', mainSom.includes("!f.startsWith('shotandsave-storyboard-')"))
kiem('storyboard.js bat phim tat Ctrl+C, Ctrl+S va Esc', sbJs.includes("e.key === 'c'") && sbJs.includes("e.key === 's'") && sbJs.includes("'Escape'"))

console.log('\n[4] Kiem tra Main Process IPC')
const mainJs = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')
kiem('main.js co ham openStoryboardWindow', mainJs.includes('function openStoryboardWindow()'))
kiem('main.js lang nghe shelf:open-storyboard', mainJs.includes("'shelf:open-storyboard'"))
kiem('main.js xu ly storyboard:get-data', mainJs.includes("'storyboard:get-data'"))
kiem('main.js xu ly storyboard:copy', mainJs.includes("'storyboard:copy'"))
kiem('main.js xu ly storyboard:save', mainJs.includes("'storyboard:save'"))
// 29/09 anh: "click and drag CA MOT CUON" + "khong da". Kiem 3 dieu lam nen cam giac:
// (a) CA HANG la nguon keo; (b) dragstart KHONG ve canvas/toBlob (ve luc do = tre); (c) main keo-dai KHONG nhan byte
const sbJsKeo = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.js'), 'utf8')
kiem('CA HANG dai la nguon keo (hang.draggable + dragstart tren hang)', sbJsKeo.includes('hang.draggable = true') && sbJsKeo.includes("hang.addEventListener('dragstart'"))
const khoiDrag = sbJsKeo.slice(sbJsKeo.indexOf("hang.addEventListener('dragstart'"), sbJsKeo.indexOf("const bKeo"))
const thanKeoDai = sbJsKeo.slice(sbJsKeo.indexOf('function keoDai('), sbJsKeo.indexOf('function xuatDai('))
kiem('dragstart KHONG tu ve canvas/toBlob (goi keoDai, anh ve san luc re chuot)', khoiDrag.includes('keoDai(d)') && !/render\(|toBlob|layBanNen/.test(khoiDrag + thanKeoDai) && sbJsKeo.includes("hang.addEventListener('pointerenter', () => chuanBiKeo(d))"))
const khoiKeoMain = mainJs.slice(mainJs.indexOf("ipcMain.on('storyboard:keo-dai'"), mainJs.indexOf("ipcMain.on('storyboard:close'"))
kiem('main storyboard:keo-dai startDrag tu byte VE SAN (khong nhan byte luc keo)', khoiKeoMain.includes('sbVeSan.get(id)') && khoiKeoMain.includes('startDrag(') && !khoiKeoMain.includes('layBuf('))
kiem('file keo dai ten shotandsave-storyboard-* (khay anh thuong bo qua)', khoiKeoMain.includes("'shotandsave-' + String(id).replace('dai-', 'storyboard-')"))
kiem('main.js xu ly storyboard:close', mainJs.includes("'storyboard:close'"))
// 29/09: kiem HANH VI (muc menu mo cua so Storyboard), khong kiem ten khoa chu (menu doi sang 'tray.storyboard', bo "(phim S)")
kiem('Tray menu co lua chon tao storyboard', /label:\s*T\('tray\.storyboard'\),\s*click:\s*\(\)\s*=>\s*openStoryboardWindow\(\)/.test(mainJs))

console.log('\n[5] Kiem tra Cam tuyet doi Emoji trong UI (Luat 01)')
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
const filesToCheck = [
  path.join(ROOT, 'src', 'shelf', 'index.html'),
  path.join(ROOT, 'src', 'storyboard', 'index.html'),
  path.join(ROOT, 'src', 'storyboard', 'storyboard.css'),
  path.join(ROOT, 'src', 'storyboard', 'storyboard.js'),
]
for (const f of filesToCheck) {
  const content = fs.readFileSync(f, 'utf8')
  kiem('Khong co emoji trong ' + path.basename(f), !emojiRegex.test(content))
}

/* [ra 28/09 Claude] Grep "co ham" khong bat duoc goi ham KHONG TON TAI: ban 0.6.8 goi kho.thuMucKeo()
   ma kho.js khong export -> keo dai Storyboard chet im lang, 51/51 van DAT. Kiem that: moi kho.X ma
   main.js goi phai co trong module.exports cua kho.js. */
console.log('\n[6] Kiem tra ham kho.* ma main.js goi deu ton tai')
const khoSrc = fs.readFileSync(path.join(ROOT, 'src', 'kho.js'), 'utf8')
const khoExp = new Set(((khoSrc.match(/module\.exports\s*=\s*\{([\s\S]*?)\}/) || [])[1] || '').split(/[\s,]+/).filter(Boolean))
const khoGoi = [...new Set([...mainJs.matchAll(/\bkho\.([A-Za-z_]\w*)\s*\(/g)].map((m) => m[1]))]
const khoThieu = khoGoi.filter((f) => !khoExp.has(f))
kiem('main.js goi ' + khoGoi.length + ' ham kho.* - tat ca deu duoc export', khoGoi.length > 0 && khoThieu.length === 0, khoThieu.length ? 'THIEU: ' + khoThieu.join(', ') : '')

console.log('\n[7] Kiem tra Storyboard tren Overlay (Selection Box & Toolbar)')
const overlayHtml = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'index.html'), 'utf8')
const overlayCss = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'overlay.css'), 'utf8')
const overlayJs = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'overlay.js'), 'utf8')

kiem('Overlay HTML co nut #sel-storyboard-btn tren khung chon', overlayHtml.includes('id="sel-storyboard-btn"'))
kiem('Overlay HTML co nut data-tool="storyboard" tren toolbar', overlayHtml.includes('data-tool="storyboard"'))
kiem('Nut Storyboard tren Overlay dung icon SVG inline (viewBox 24 24)', overlayHtml.includes('viewBox="0 0 24 24"'))
kiem('Overlay CSS co style cho .sel-opt-chip', overlayCss.includes('.sel-opt-chip'))
kiem('Overlay CSS co style .sel-opt-chip.active voi accent cam', overlayCss.includes('.sel-opt-chip.active') && overlayCss.includes('var(--accent)'))
kiem('Overlay JS co toggleStoryboardMode', overlayJs.includes('toggleStoryboardMode'))
kiem('Overlay JS ho tro phim tat S', overlayJs.includes("'KeyS'") || overlayJs.includes("'s'"))

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
