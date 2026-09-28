/* Test kiem tra tinh nang Tuy chon kieu lam mo (Mosaic / Blur).
   Chay bang: node scripts/test/do-kieu-lam-mo.mjs
   Khong bat cua so, khong can thiep man hinh. */
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
const keys = ['set.lamMo.tieuDe', 'set.lamMo.moTa', 'set.lamMo.kieu', 'set.lamMo.mosaic', 'set.lamMo.blur']
for (const k of keys) {
  const count = (i18nContent.match(new RegExp("'" + k + "':", 'g')) || []).length
  kiem('Khoa ' + k + ' co du ca 2 ngon ngu (VI + EN)', count === 2, 'tim thay ' + count + ' lan')
}

// Kiem tra khong dung gach ngang dai "—" trong cac chuoi nguoi dung moi
const lines = i18nContent.split('\n')
const lamMoLines = lines.filter((l) => l.includes('set.lamMo.'))
const coGachNgangDai = lamMoLines.some((l) => l.includes('—'))
kiem('Khong dung gach ngang dai "—" trong chuoi i18n moi (Luat muc 5)', !coGachNgangDai)

console.log('\n[2] Kiem tra Settings UI & Logic')
const html = fs.readFileSync(path.join(ROOT, 'src', 'settings', 'index.html'), 'utf8')
kiem('The #lam-mo-kieu ton tai trong settings/index.html', html.includes('id="lam-mo-kieu"'))
kiem('Nut mosaic co san', html.includes('data-v="mosaic"'))
kiem('Nut blur co san', html.includes('data-v="blur"'))

// Kiem tra cam emoji (Luat 01)
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
const lamMoSection = html.slice(html.indexOf('id="lam-mo-kieu"') - 300, html.indexOf('id="lam-mo-kieu"') + 300)
kiem('Khong chua emoji trong block cai dat lam mo (Luat 01)', !emojiRegex.test(lamMoSection))

const settingsJs = fs.readFileSync(path.join(ROOT, 'src', 'settings', 'settings.js'), 'utf8')
kiem('settings.js lang nghe click tren lamMoBox', settingsJs.includes('lamMoBox.addEventListener'))
kiem('settings.js goi window.settings.setLamMo', settingsJs.includes('window.settings.setLamMo'))

console.log('\n[3] Kiem tra Preload Bridges')
const pSet = fs.readFileSync(path.join(ROOT, 'src', 'preload-settings.js'), 'utf8')
kiem('preload-settings.js expose setLamMo', pSet.includes('setLamMo:'))

const pOver = fs.readFileSync(path.join(ROOT, 'src', 'preload-overlay.js'), 'utf8')
kiem('preload-overlay.js expose onUpdateConfig', pOver.includes('onUpdateConfig:'))

const pPin = fs.readFileSync(path.join(ROOT, 'src', 'preload-pin.js'), 'utf8')
kiem('preload-pin.js expose onUpdateConfig', pPin.includes('onUpdateConfig:'))

console.log('\n[4] Kiem tra Main IPC')
const mainJs = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')
kiem('main.js ho tro settings:set-lam-mo', mainJs.includes("'settings:set-lam-mo'"))
kiem('main.js tra lamMoKieu trong settings:get', mainJs.includes('lamMoKieu:'))
kiem('main.js truyen lamMoKieu vao overlay:init', mainJs.includes("lamMoKieu: kho.docCauHinh().lamMoKieu || 'mosaic'"))
kiem('main.js truyen lamMoKieu vao pin:data', mainJs.includes("lamMoKieu: kho.docCauHinh().lamMoKieu || 'mosaic'"))

console.log('\n[5] Kiem tra Renderer Drawing: overlay.js va pin.js')
const overlayJs = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'overlay.js'), 'utf8')
kiem('overlay.js co ham veBlurSmooth', overlayJs.includes('function veBlurSmooth('))
kiem('overlay.js re nhanh giua veBlurSmooth va veBlurPixelate', overlayJs.includes('veBlurSmooth') && overlayJs.includes('veBlurPixelate'))
kiem('overlay.js luu blurType tren shape preview & chot', overlayJs.includes('blurType: curBlurType'))

const pinJs = fs.readFileSync(path.join(ROOT, 'src', 'pin', 'pin.js'), 'utf8')
kiem('pin.js co ham veBlurSmooth', pinJs.includes('function veBlurSmooth('))
kiem('pin.js re nhanh giua veBlurSmooth va veBlurPixelate', pinJs.includes('veBlurSmooth') && pinJs.includes('veBlurPixelate'))
kiem('pin.js luu blurType tren shape preview & chot', pinJs.includes('blurType: curBlurType'))

console.log('\n' + kq.join('\n'))
const datDem = kq.filter((l) => l.includes('DAT')).length
const truotDem = kq.filter((l) => l.includes('TRUOT')).length
console.log(`\nKET QUA: ${datDem} DAT / ${truotDem} TRUOT`)
if (!dat) process.exit(1)
