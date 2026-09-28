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
/* [28/09 Claude] Truoc: muc nay BAT storyboard.css tu khai #090a0d / #f86820 — chinh bo mau rieng do lam khay
   Storyboard lech khay anh (anh Tien: "dong bo va dep voi khay anh thuong"). Nay kiem dieu nguoc lai:
   dung CHUNG assets/tokens.css, khong tu khai token, va moi var(--x) dung toi PHAI co trong tokens.css
   (token khong ton tai -> trinh duyet bo ca khai bao, im lang — LESSONS 07/09 muc 4). */
const tokensCss = fs.readFileSync(path.join(ROOT, 'assets', 'tokens.css'), 'utf8')
const tokenCo = new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
const tuKhai = [...sbCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])
const dungToi = [...new Set([...sbCss.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
const thieuToken = dungToi.filter((v) => !tokenCo.has(v))
kiem('storyboard/index.html nap assets/tokens.css (chung khay anh)', sbHtml.includes('../../assets/tokens.css'))
kiem('storyboard.css KHONG tu khai token rieng (' + tuKhai.length + ')', tuKhai.length === 0, tuKhai.join(', '))
kiem('storyboard.css dung ' + dungToi.length + ' token - tat ca co trong tokens.css', dungToi.length > 10 && thieuToken.length === 0, 'THIEU: ' + thieuToken.join(', '))
kiem('Thanh tren storyboard cung khuon #bar cua khay anh (30px)', sbHtml.includes('id="bar"') && /#bar\s*\{[^}]*height:\s*30px/.test(sbCss))

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
