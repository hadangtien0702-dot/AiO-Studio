'use strict'
/* Do SO VIDEO (src/kho-video.js) + day noi cua tinh nang QUAY VIDEO (01/10) — chay: npm run test:khovideo
   Khong bat cua so, khong can Electron. Thu muc thu nam trong os.tmpdir() do bai nay tao va tu xoa (dung ten). */
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const doc = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }
const ngu = (ms) => { const het = Date.now() + ms; while (Date.now() < het) { /* cho id (theo mili giay) khac nhau */ } }

// ── [1] HANH VI cua so video ────────────────────────────────────────────
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-kho-video-'))
const kho = require(path.join(ROOT, 'src', 'kho-video.js'))
kiem('Chua khoiTao: them tra null, danhSach rong (khong nem loi)', kho.them({ file: 'x' }) === null && kho.danhSach().length === 0)
kho.khoiTao(tam)
const f1 = path.join(tam, 'a b & c.mp4'), f2 = path.join(tam, 'hai.mp4'), f3 = path.join(tam, 'ba.mp4')
for (const f of [f1, f2, f3]) fs.writeFileSync(f, 'x')
const m1 = kho.them({ file: f1, ms: 3210.6, w: 960, h: 540, tieng: 1, bytes: 12345 }); ngu(3)
const m2 = kho.them({ file: f2, ms: 500, w: 32, h: 22, tieng: false, bytes: 99 }); ngu(3)
const m3 = kho.them({ file: f3, ms: 60000, w: 2560, h: 1440, tieng: true, bytes: 5e6 })
kiem('them tra muc co id dung mau + du truong', !!m1 && kho.MAU_ID.test(m1.id) && m1.ms === 3211 && m1.tieng === true && m1.w === 960 && m1.bytes === 12345 && !!m1.taoLuc, JSON.stringify(m1))
kiem('3 lan them -> 3 id khac nhau', new Set([m1.id, m2.id, m3.id]).size === 3)
let ds = kho.danhSach()
kiem('danhSach: 3 muc, MOI NHAT truoc', ds.length === 3 && ds[0].id === m3.id && ds[2].id === m1.id, ds.map((x) => path.basename(x.file)).join(' > '))
kiem('Duong dan co dau cach + "&" giu nguyen', ds[2].file === f1)
fs.unlinkSync(f2)
ds = kho.danhSach()
kiem('File bi xoa ngoai app -> khay khong con hien muc do', ds.length === 2 && !ds.some((x) => x.id === m2.id))
kiem('tim() theo id', !!kho.tim(m1.id) && kho.tim(m1.id).file === f1 && kho.tim('vid-00000000-000000-000') === null)
kiem('tim()/bo() tu choi id sai mau (khong dung toi so)', kho.tim('../x') === null && kho.bo('../x') === false && kho.bo('') === false)
// 01/10 chon Co tieng / Khong tieng: sua() chi nhan 2 truong boTieng + fileKhongTieng, khong cho doi so do luc quay
const s1 = kho.sua(m1.id, { boTieng: 1, fileKhongTieng: f3, ms: 1, file: 'x', id: 'y' })
kiem('sua(): ghi boTieng + fileKhongTieng, KHONG doi ms / file / id', !!s1 && s1.boTieng === true && s1.fileKhongTieng === f3 && s1.ms === 3211 && s1.file === f1 && s1.id === m1.id && kho.tim(m1.id).boTieng === true, JSON.stringify(s1))
kiem('sua(): bat lai Co tieng giu nguyen duong dan ban khong tieng', kho.sua(m1.id, { boTieng: false }).fileKhongTieng === f3 && kho.tim(m1.id).boTieng === false)
kiem('sua(): id sai mau / id khong co -> null', kho.sua('../x', { boTieng: true }) === null && kho.sua('vid-00000000-000000-000', { boTieng: true }) === null)
kiem('bo() go dung 1 muc, KHONG xoa file', kho.bo(m1.id) === true && kho.danhSach().length === 1 && fs.existsSync(f1))
kiem('bo() lan 2 cung id -> false', kho.bo(m1.id) === false)
const fileSo = path.join(tam, 'video', 'danh-sach.json')
kiem('So ghi atomic: co danh-sach.json, khong con .tmp', fs.existsSync(fileSo) && !fs.existsSync(fileSo + '.tmp'))
fs.writeFileSync(fileSo, '{hong json')
kiem('So hong (JSON loi) -> danhSach rong, khong nem loi', kho.danhSach().length === 0)
const m4 = kho.them({ file: f3, ms: 1000, w: 10, h: 10, bytes: 1 })
kiem('So hong van them duoc muc moi (ghi de so hong)', !!m4 && kho.danhSach().length === 1)
fs.writeFileSync(fileSo, JSON.stringify([{ id: 'la', file: f3 }, null, { id: m4.id }, 5]))
kiem('Muc rac trong so (id sai / thieu file / null) bi bo qua', kho.danhSach().length === 0)
fs.rmSync(tam, { recursive: true, force: true })

// ── [2] DAY NOI: preload goi kenh nao thi main phai nghe kenh do ─────────
const main = doc('src', 'main.js') + '\n' + doc('src', 'luong-chup.js')
const nghe = new Set([...main.matchAll(/ipcMain\.(?:on|handle)\('([^']+)'/g)].map((m) => m[1]))
// main gui xuong trang bang 2 kieu: win.webContents.send(...) va e.sender.send(...) (lan dau chi do kieu 1 -> bao oan
// 'shelf:removed' / 'shelf:cleared' la khong ai gui)
const gui = new Set([...main.matchAll(/(?:webContents|sender)\.send\('([^']+)'/g)].map((m) => m[1]))
for (const pre of ['preload-video.js', 'preload-dem.js', 'preload-luong.js', 'preload-shelf.js']) {
  const s = doc('src', pre)
  const goi = [...new Set([...s.matchAll(/ipcRenderer\.(?:send|sendSync|invoke)\('([^']+)'/g)].map((m) => m[1]))]
  const thieu = goi.filter((k) => !nghe.has(k))
  kiem(pre + ': ' + goi.length + ' kenh goi len main deu co nguoi nghe', goi.length > 0 && thieu.length === 0, thieu.length ? 'THIEU: ' + thieu.join(', ') : '')
  const nhan = [...new Set([...s.matchAll(/ipcRenderer\.on\('([^']+)'/g)].map((m) => m[1]))]
  const thieu2 = nhan.filter((k) => !gui.has(k))
  kiem(pre + ': ' + nhan.length + ' kenh nhan tu main deu co nguoi gui', thieu2.length === 0, thieu2.length ? 'THIEU: ' + thieu2.join(', ') : '')
}
// Trang goi ham nao cua cau noi thi preload phai mo ham do
const cau = (pre, ten) => { const s = doc('src', pre); const i = s.indexOf("exposeInMainWorld('" + ten + "'"); return new Set([...s.slice(i).matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1])) }
for (const [trang, pre, ten] of [[['video', 'video.js'], 'preload-video.js', 'video'], [['dem', 'quay.js'], 'preload-dem.js', 'dem'], [['luong', 'luong.js'], 'preload-luong.js', 'luong'], [['shelf', 'shelf.js'], 'preload-shelf.js', 'shelf']]) {
  const co = cau(pre, ten)
  const dung = [...new Set([...doc('src', ...trang).matchAll(new RegExp('window\\.' + ten + '\\.(\\w+)', 'g'))].map((m) => m[1]))]
  const thieu = dung.filter((f) => !co.has(f))
  kiem(trang.join('/') + ' goi ' + dung.length + ' ham window.' + ten + '.* - preload deu mo', dung.length > 0 && thieu.length === 0, thieu.length ? 'THIEU: ' + thieu.join(', ') : '')
}
// main goi ham nao cua kho / khoVideo / luong thi module phai export ham do
for (const [bien, file] of [['kho', 'kho.js'], ['khoVideo', 'kho-video.js'], ['luong', 'luong-chup.js']]) {
  const exp = new Set(((doc('src', file).match(/module\.exports\s*=\s*\{([\s\S]*?)\}/) || [])[1] || '').split(/[\s,]+/).filter(Boolean))
  const goi = [...new Set([...doc('src', 'main.js').matchAll(new RegExp('\\b' + bien + '\\.([A-Za-z_]\\w*)\\s*\\(', 'g'))].map((m) => m[1]))]
  const thieu = goi.filter((f) => !exp.has(f))
  kiem('main.js goi ' + goi.length + ' ham ' + bien + '.* - deu duoc export', goi.length > 0 && thieu.length === 0, thieu.length ? 'THIEU: ' + thieu.join(', ') : '')
}

// ── [3] CHU: moi khoa dung toi phai co du VI + EN, khong gach ngang dai ──
const { DICH } = require(path.join(ROOT, 'src', 'i18n.js'))
const khoa = new Set()
for (const p of [['video', 'video.js'], ['overlay', 'overlay.js']]) for (const m of doc('src', ...p).matchAll(/\bt\(\s*(?:\w+\s*\?\s*)?'((?:vd|overlay\.quay)[\w.]*)'(?:\s*:\s*'((?:vd|overlay\.quay)[\w.]*)')?/g)) { khoa.add(m[1]); if (m[2]) khoa.add(m[2]) }
for (const p of [['video', 'index.html'], ['overlay', 'index.html'], ['shelf', 'index.html']]) for (const m of doc('src', ...p).matchAll(/data-i18n(?:-title)?="((?:vd\.|overlay\.quay|khay\.video)[\w.]*)"/g)) khoa.add(m[1])
for (const m of doc('src', 'main.js').matchAll(/T\('((?:quay|tray\.video|tray\.dungQuay|app\.khongQuay)[\w.]*)'\)/g)) khoa.add(m[1])
const ds2 = [...khoa]
const thieuVi = ds2.filter((k) => !(k in DICH.vi)), thieuEn = ds2.filter((k) => !(k in DICH.en))
kiem(ds2.length + ' khoa chu cua tinh nang quay deu co VI', ds2.length >= 20 && thieuVi.length === 0, thieuVi.join(', '))
kiem(ds2.length + ' khoa chu cua tinh nang quay deu co EN', thieuEn.length === 0, thieuEn.join(', '))
const gach = ds2.filter((k) => /[—–]/.test((DICH.vi[k] || '') + (DICH.en[k] || '')))
kiem('Khong dung gach ngang dai trong chu nguoi dung thay', gach.length === 0, gach.join(', '))
const tham = (s) => (s.match(/\{\w+\}/g) || []).sort().join()
const lechThamSo = ds2.filter((k) => tham(DICH.vi[k] || '') !== tham(DICH.en[k] || ''))
kiem('Tham so {..} trong chuoi VI va EN khop nhau', lechThamSo.length === 0, lechThamSo.join(', '))

// ── [4] GIAO DIEN: khay video dung chung khuon khay Storyboard, khong tu khai token ──
const css = doc('src', 'video', 'video.css')
const token = new Set([...doc('assets', 'tokens.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
const tuKhai = [...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])
const dungToi = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
kiem('video.css KHONG tu khai token rieng', tuKhai.length === 0, tuKhai.join(', '))
kiem('video.css dung ' + dungToi.length + ' token - deu co trong tokens.css', dungToi.length >= 5 && dungToi.every((v) => token.has(v)), dungToi.filter((v) => !token.has(v)).join(', '))
const html = doc('src', 'video', 'index.html')
kiem('Khay video nap tokens.css + storyboard.css (cung khuon man Cai dat) + video.css', html.includes('../../assets/tokens.css') && html.includes('../storyboard/storyboard.css') && html.includes('video.css'))
kiem('CSP khay video cho phep phat file:// va KHONG mo mang', /media-src file:/.test(html) && /default-src 'none'/.test(html) && !/https?:/.test(html.replace(/<!--[\s\S]*?-->/g, '')))
const emoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
const coEmoji = [['video', 'index.html'], ['video', 'video.js'], ['video', 'video.css'], ['dem', 'quay.html'], ['dem', 'quay.js']].filter((p) => emoji.test(doc('src', ...p)))
kiem('Khong emoji trong giao dien moi', coEmoji.length === 0, coEmoji.map((p) => p.join('/')).join(', '))

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
