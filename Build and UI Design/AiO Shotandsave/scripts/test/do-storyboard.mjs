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
kiem('Nut #storyboard su dung icon SVG inline (Luat 02)', shelfHtml.includes('<svg') && shelfHtml.includes('rect x="2" y="4"'))

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
kiem('preload-storyboard.js expose startDrag', pSb.includes('startDrag:'))
kiem('preload-storyboard.js expose close', pSb.includes('close:'))

const sbHtml = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'index.html'), 'utf8')
kiem('storyboard/index.html co title va main-canvas', sbHtml.includes('id="main-canvas"'))
kiem('storyboard/index.html co nut Copy Primary CTA', sbHtml.includes('id="btn-copy"'))
kiem('storyboard/index.html co nut Luu PNG', sbHtml.includes('id="btn-save"'))
kiem('storyboard/index.html co chuyen doi bo cuc filmstrip va grid', sbHtml.includes('id="btn-filmstrip"') && sbHtml.includes('id="btn-grid"'))

const sbCss = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.css'), 'utf8')
kiem('storyboard.css ap dung dung token mau Studio Console (--acc: #f86820, --bg-0: #090a0d)', sbCss.includes('#f86820') && sbCss.includes('#090a0d'))

const sbJs = fs.readFileSync(path.join(ROOT, 'src', 'storyboard', 'storyboard.js'), 'utf8')
kiem('storyboard.js co engine renderFilmstrip', sbJs.includes('function renderFilmstrip()'))
kiem('storyboard.js co engine renderGrid', sbJs.includes('function renderGrid()'))
kiem('storyboard.js co ham drawShotBadge', sbJs.includes('function drawShotBadge('))
kiem('storyboard.js co ham drawInfoBar footer', sbJs.includes('function drawInfoBar('))
kiem('storyboard.js ho tro bo bot shot truc tiep tren viewport (removeShot)', sbJs.includes('function removeShot('))
kiem('storyboard.js bat phim tat Ctrl+C, Ctrl+S va Esc', sbJs.includes("e.key === 'c'") && sbJs.includes("e.key === 's'") && sbJs.includes("'Escape'"))

console.log('\n[4] Kiem tra Main Process IPC')
const mainJs = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')
kiem('main.js co ham openStoryboardWindow', mainJs.includes('function openStoryboardWindow()'))
kiem('main.js lang nghe shelf:open-storyboard', mainJs.includes("'shelf:open-storyboard'"))
kiem('main.js xu ly storyboard:get-data', mainJs.includes("'storyboard:get-data'"))
kiem('main.js xu ly storyboard:copy', mainJs.includes("'storyboard:copy'"))
kiem('main.js xu ly storyboard:save', mainJs.includes("'storyboard:save'"))
kiem('main.js xu ly storyboard:start-drag', mainJs.includes("'storyboard:start-drag'"))
kiem('main.js xu ly storyboard:close', mainJs.includes("'storyboard:close'"))
kiem('Tray menu co lua chon tao storyboard', mainJs.includes("T('khay.storyboard')"))

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

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
