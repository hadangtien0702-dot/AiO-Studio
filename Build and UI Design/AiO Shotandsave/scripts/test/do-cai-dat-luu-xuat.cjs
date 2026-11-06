'use strict'
/* BAI DO MAN CAI DAT: muc WebP + muc "Ten file tu dat" (06/11/2026): `npm run test:caidatluuxuat`. Electron AN (show:false).
   Nap THAT src/settings/index.html + settings.js + preload-settings.js; main chi la cac handler GIA ghi lai lenh nhan duoc. Chuot / ban phim la
   su kien that cua Chromium (sendInputEvent). Do ca VI lan EN, o rong 440 px (cua so Cai dat that). Co DOI CHUNG.
   Ket qua: <thu muc tam>/aio-ra/do-cai-dat-luu-xuat.txt (+ anh chup), ma thoat 0 = dat. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
const fs = require('fs')
const path = require('path')
const os = require('os')
const RA_DIR = process.env.AIO_RA || path.join(os.tmpdir(), 'aio-ra')
fs.mkdirSync(RA_DIR, { recursive: true })
const RA = path.join(RA_DIR, 'do-cai-dat-luu-xuat.txt')
fs.writeFileSync(RA, '')
process.on('uncaughtException', (e) => { try { fs.appendFileSync(RA + '.loi', String((e && e.stack) || e) + '\n') } catch (x) {} process.exit(2) })
const { app, BrowserWindow, ipcMain } = require('electron')
let dat = 0, truot = 0
const ghi = (s) => fs.appendFileSync(RA, s + '\n')
function ok(ten, dk, gc) { if (dk) { dat++; ghi('  DAT   ' + ten + (gc ? '  [' + gc + ']' : '')) } else { truot++; ghi('  TRUOT ' + ten + (gc ? '  [' + gc + ']' : '')) } }
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const ROOT = path.join(__dirname, '..', '..')

app.on('window-all-closed', () => {}) // dong het cua so giua chung KHONG duoc thoat bai do
app.whenReady().then(async () => {
  const tdt = require('../../src/tu-dat-ten')
  const hop = { nhan: [], set: [], ten: [], lang: 'vi', state: { anhLoai: 'jpeg', anhChatLuong: 'cao', tuDatTen: false, tenMau: tdt.MAU_MAC_DINH } }
  const viDu = (m) => { const v = tdt.dungTen(tdt.mauHopLe(m), { noiDung: 'Bao gia khach ABC', app: 'Chrome', ngay: new Date(2026, 10, 6, 14, 32) }); return v ? v + '.jpg' : '' }
  const trangThai = () => Object.assign({ hotkey: 'CommandOrControl+Shift+S', def: 'CommandOrControl+Shift+S', isMac: false, saveFolder: 'C:\\thu-muc-gia', lang: hop.lang, version: 'test', khayKieu: 'ngang', khaySoAnh: 5, khayTuThu: 5, lamMoKieu: 'mosaic', anNut: [], kinhLup: true, moCung: { hoTro: false }, tenViDu: viDu(hop.state.tenMau) }, hop.state)
  ipcMain.on('i18n:lang', (e) => { e.returnValue = hop.lang })
  ipcMain.handle('settings:get', () => trangThai())
  ipcMain.handle('settings:set-anh', (_e, d) => { hop.set.push(d); Object.assign(hop.state, d); return d })
  ipcMain.handle('settings:set-ten', (_e, d) => {
    hop.ten.push(d)
    if (typeof d.tuDatTen === 'boolean') hop.state.tuDatTen = d.tuDatTen
    if (typeof d.tenMau === 'string') hop.state.tenMau = tdt.mauHopLe(d.tenMau)
    return { tuDatTen: hop.state.tuDatTen, tenMau: hop.state.tenMau, tenViDu: viDu(hop.state.tenMau) }
  })
  ipcMain.handle('bq:get', () => ({}))
  ipcMain.handle('capnhat:get', () => ({}))

  async function mo(lang, anhLoai) {
    hop.lang = lang; hop.state.anhLoai = anhLoai || 'jpeg'; hop.state.tuDatTen = false; hop.state.tenMau = tdt.MAU_MAC_DINH; hop.set.length = 0; hop.ten.length = 0
    const w = new BrowserWindow({ width: 440, height: 1100, show: false, webPreferences: { preload: path.join(ROOT, 'src', 'preload-settings.js'), contextIsolation: true, sandbox: false } })
    await w.loadFile(path.join(ROOT, 'src', 'settings', 'index.html'))
    await cho(500)
    return w
  }
  const js = (w, s) => w.webContents.executeJavaScript(s)
  async function bam(w, sel) {
    const p = await js(w, `(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)] })()`)
    w.webContents.sendInputEvent({ type: 'mouseMove', x: p[0], y: p[1] })
    w.webContents.sendInputEvent({ type: 'mouseDown', x: p[0], y: p[1], button: 'left', clickCount: 1 })
    w.webContents.sendInputEvent({ type: 'mouseUp', x: p[0], y: p[1], button: 'left', clickCount: 1 })
    await cho(250)
  }

  ghi('1. Tieng Viet, mo bang JPEG')
  let w = await mo('vi', 'jpeg')
  const d1 = await js(w, `({ nut: Array.from(document.querySelectorAll('#anh-loai .chon-nut')).map(b => b.textContent.trim() + (b.classList.contains('chon') ? '*' : '')), nhan: document.getElementById('nhan-chat-luong').textContent, mo: document.getElementById('hang-chat-luong').classList.contains('mo'),
    tuDat: document.querySelector('#ten-tu-dat .chon-nut.chon').dataset.v, hangMo: document.getElementById('hang-ten-mau').classList.contains('mo'), mau: document.getElementById('ten-mau').value, viDu: document.getElementById('ten-vi-du').textContent })`)
  ok('1.1 nhom Dinh dang co 3 nut JPEG / PNG / WebP, JPEG dang chon', d1.nut.join() === 'JPEG*,PNG,WebP', d1.nut.join())
  ok('1.2 nhan hang chat luong = "Chất lượng JPEG" khi dang JPEG, hang khong bi lam mo', d1.nhan === 'Chất lượng JPEG' && !d1.mo, d1.nhan)
  ok('1.3 "Tu dat ten" MAC DINH TAT: nut Tat dang chon, hang mau ten bi lam mo', d1.tuDat === '0' && d1.hangMo, JSON.stringify({ tuDat: d1.tuDat, hangMo: d1.hangMo }))
  ok('1.4 o mau ten hien mau mac dinh + dong vi du "Bao gia khach ABC 1432.jpg"', d1.mau === '{noidung} {gio}' && /Ví dụ: Bao gia khach ABC 1432\.jpg/.test(d1.viDu), d1.viDu)

  await bam(w, '#anh-loai .chon-nut[data-v="webp"]')
  const d2 = await js(w, `({ chon: document.querySelector('#anh-loai .chon-nut.chon').dataset.v, nhan: document.getElementById('nhan-chat-luong').textContent, mo: document.getElementById('hang-chat-luong').classList.contains('mo'), tip: document.getElementById('hang-chat-luong').title })`)
  ok('1.5 bam WebP bang chuot that: main nhan { anhLoai: "webp" } dung 1 lan', hop.set.length === 1 && hop.set[0].anhLoai === 'webp', JSON.stringify(hop.set))
  ok('1.6 sau khi chon WebP: nut WebP sang, nhan thanh "Chat luong WebP", hang chat luong van bam duoc, co ghi chu', d2.chon === 'webp' && d2.nhan === 'Chất lượng WebP' && !d2.mo && /lossless|16383/.test(d2.tip), JSON.stringify(d2))
  await bam(w, '#anh-chat-luong .chon-nut[data-v="sieu"]')
  ok('1.7 chon "Toi da" (= lossless) khi dang WebP: main nhan anhChatLuong = sieu', hop.set.some((d) => d.anhChatLuong === 'sieu'))
  await bam(w, '#anh-loai .chon-nut[data-v="png"]')
  const d3 = await js(w, `({ nhan: document.getElementById('nhan-chat-luong').textContent, mo: document.getElementById('hang-chat-luong').classList.contains('mo') })`)
  ok('1.8 doi sang PNG: hang chat luong lam mo (PNG luon lossless), nhan tro lai JPEG', d3.mo && d3.nhan === 'Chất lượng JPEG', JSON.stringify(d3))

  // tu dat ten: bat, go mau, enter
  await bam(w, '#ten-tu-dat .chon-nut[data-v="1"]')
  const d4 = await js(w, `({ tuDat: document.querySelector('#ten-tu-dat .chon-nut.chon').dataset.v, hangMo: document.getElementById('hang-ten-mau').classList.contains('mo') })`)
  ok('1.9 bam Bat: main nhan { tuDatTen: true }, hang mau ten het mo', hop.ten.some((d) => d.tuDatTen === true) && d4.tuDat === '1' && !d4.hangMo, JSON.stringify(hop.ten))
  await bam(w, '#ten-mau')
  const o = w.webContents
  o.sendInputEvent({ type: 'keyDown', keyCode: 'A', modifiers: ['control'] }); o.sendInputEvent({ type: 'keyUp', keyCode: 'A', modifiers: ['control'] })
  for (const k of ['Backspace']) { o.sendInputEvent({ type: 'keyDown', keyCode: k }); o.sendInputEvent({ type: 'keyUp', keyCode: k }) }
  for (const ch of '{ngay} {app}') o.sendInputEvent({ type: 'char', keyCode: ch })
  o.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); o.sendInputEvent({ type: 'keyUp', keyCode: 'Return' })
  await cho(300)
  const d5 = await js(w, `({ mau: document.getElementById('ten-mau').value, viDu: document.getElementById('ten-vi-du').textContent, focus: document.activeElement === document.getElementById('ten-mau') })`)
  ok('1.10 go mau "{ngay} {app}" roi Enter: main nhan dung mau, o nhap roi tieu diem', hop.ten.some((d) => d.tenMau === '{ngay} {app}') && d5.mau === '{ngay} {app}' && !d5.focus, JSON.stringify(hop.ten) + ' ' + d5.mau)
  ok('1.11 dong vi du doi theo mau: "2026-11-06 Chrome.jpg"', /2026-11-06 Chrome\.jpg/.test(d5.viDu), d5.viDu)
  await bam(w, '#ten-mau-mac-dinh')
  const d6 = await js(w, `document.getElementById('ten-mau').value`)
  ok('1.12 nut "Ve mau mac dinh": o nhap tro lai {noidung} {gio}', d6 === '{noidung} {gio}', d6)
  const bo = await js(w, `({ ngang: document.documentElement.scrollWidth <= window.innerWidth + 1, oRong: document.getElementById('ten-mau').getBoundingClientRect().width, nutPhai: document.getElementById('ten-mau-mac-dinh').getBoundingClientRect().right, trang: window.innerWidth })`)
  ok('1.13 cua so 440 px: khong tran ngang, o mau ten rong >= 200 px, nut ve mac dinh nam trong khung', bo.ngang && bo.oRong >= 200 && bo.nutPhai <= bo.trang, JSON.stringify(bo))
  try { fs.writeFileSync(path.join(RA_DIR, 'do-cai-dat-luu-xuat.png'), (await w.webContents.capturePage()).toPNG()) } catch (e) {}
  w.destroy()

  ghi('2. Mo bang WebP + English')
  w = await mo('en', 'webp')
  const e1 = await js(w, `({ chon: document.querySelector('#anh-loai .chon-nut.chon').dataset.v, nhan: document.getElementById('nhan-chat-luong').textContent,
    chu: [document.querySelector('[data-i18n="set.ten.tieuDe"]'), document.querySelector('[data-i18n="set.ten.tuDat"]'), document.querySelector('[data-i18n="set.ten.mau"]'), document.querySelector('#hang-ten-mau [data-i18n="set.ten.goiY"]'), document.getElementById('ten-vi-du'), document.getElementById('ten-mau-mac-dinh')].map(e => (e.textContent || e.title || '').trim()) })`)
  ok('2.1 mo san o WebP: nut WebP dang chon, nhan "WebP quality"', e1.chon === 'webp' && e1.nhan === 'WebP quality', e1.nhan)
  ok('2.2 ban EN: moi chu cua muc Ten file day du va KHONG con chu tieng Viet co dau', e1.chu.length === 6 && e1.chu.every((s) => s) && e1.chu.every((s) => !/[\u00C0-\u1EF9]/.test(s)), e1.chu.join(' | ').slice(0, 200))
  const e2 = await js(w, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  ok('2.3 ban EN o 440 px khong tran ngang', e2)
  w.destroy()

  ghi('3. DOI CHUNG')
  const src = fs.readFileSync(path.join(ROOT, 'src', 'settings', 'settings.js'), 'utf8')
  ok('3.1 phep do nhan hang chat luong: neu doi gia tri that "set.anh.chatLuongWebp" thanh JPEG thi 1.6 phai TRUOT (kiem noi dung that trong ma)', /loai === 'webp' \? 'set\.anh\.chatLuongWebp' : 'set\.anh\.chatLuong'/.test(src))
  const ten = require('../../src/tu-dat-ten')
  ok('3.2 mau "{noidung}" rong khi khong co chu van giu ten cu (khong tu dat ten vo nghia)', ten.dungTen('{noidung}', { noiDung: '' }) === null)

  ghi('\nTONG: ' + dat + ' dat, ' + truot + ' truot')
  app.exit(truot ? 1 : 0)
})
