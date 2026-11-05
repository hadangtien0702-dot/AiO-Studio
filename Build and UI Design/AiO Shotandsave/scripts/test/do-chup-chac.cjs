/* 05/11/2026 Bai do MOI LAN CHUP PHAI TOI KHAY (npm run test:chupchac). Chay an, khong cua so nao hien, khong dung anh that.
   Phan 1: src/chup-chac.js (thu lai grab, man chup ket, gui co xac nhan).
   Phan 2: trang khay THAT (src/shelf) trong cua so an, chup don dap: N anh trong mot nhip, voi va khong ham nen.
   Doi chung: lam rot lenh gui thi cach gui cu PHAI thieu anh, cach moi phai du. */
'use strict'
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { thuLai, overlayKet, taoGuiChac } = require('../../src/chup-chac')

let dat = 0, truot = 0
const kiem = (ten, ok, them) => { ok ? dat++ : truot++; console.log((ok ? 'DAT   ' : 'TRUOT ') + ten + (them != null ? '  [' + them + ']' : '')) }
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
app.on('window-all-closed', () => {})

async function phanThuLai() {
  let n = 0
  let k = await thuLai(async () => { n++; return n < 3 ? [] : ['a', 'b'] }, { tre: 1, du: (l) => l.length >= 2 })
  kiem('grab rong 2 lan, lan 3 duoc', k.length === 2 && n === 3, n + ' lan')
  n = 0
  k = await thuLai(async () => { n++; if (n === 1) throw new Error('Failed to get sources'); return ['a'] }, { tre: 1, du: (l) => l.length >= 1 })
  kiem('grab nem loi lan dau van ra anh', k.length === 1 && n === 2)
  n = 0
  k = await thuLai(async () => { n++; return ['a'] }, { tre: 1, du: (l) => l.length >= 2 })
  kiem('thieu 1 man ca 3 lan: van tra man con lai', k.length === 1 && n === 3)
  n = 0
  k = await thuLai(async () => { n++; return ['a', 'b'] }, { tre: 1, du: (l) => l.length >= 2 })
  kiem('lan dau du: khong thu them', n === 1)
  k = await thuLai(async () => { throw new Error('x') }, { lan: 2, tre: 1 })
  kiem('hong het: tra rong, khong nem', Array.isArray(k) && k.length === 0)
}

function phanOverlayKet() {
  const f = (o) => overlayKet(Object.assign({ coCuaSo: true, coTuongTac: false, moLuc: 0, bayGio: 5000 }, o))
  kiem('chua ai cham sau 5 s: ket', f({}) === true)
  kiem('dang keo chon: KHONG dong', f({ coTuongTac: true }) === false)
  kiem('bam dup phim sau 300 ms: khong dong', f({ bayGio: 300 }) === false)
  kiem('khong co man chup: khong ket', f({ coCuaSo: false }) === false)
}

function phanGuiChac() {
  // dong ho gia: chay tung hen bang tay
  const hen = []
  const moi = (gui) => taoGuiChac({ gui, henMs: 10, lan: 3, datHen: (fn) => { hen.push(fn); return hen.length }, huyHen: () => {} })
  const chay = () => { const ds = hen.splice(0); ds.forEach((fn) => fn()) }
  let so = 0
  let g = moi(() => { so++ })
  g.gui({ id: 1 })
  g.daNhan(1); chay()
  kiem('da nhan: khong gui lai', so === 1 && g.conCho() === 0, so)
  so = 0; const log = []
  g = taoGuiChac({ gui: () => { so++ }, ghiLog: (s) => log.push(s), henMs: 10, lan: 3, datHen: (fn) => { hen.push(fn); return 1 }, huyHen: () => {} })
  g.gui({ id: 2 }); chay(); chay(); chay()
  kiem('khong nhan: gui dung 3 lan roi ghi LOI', so === 3 && g.conCho() === 0 && log.some((s) => s.startsWith('LOI khay')), so)
  so = 0
  g = moi(() => { so++; if (so === 1) throw new Error('cua so dong') })
  g.gui({ id: 3 }); chay()
  kiem('gui nem loi lan dau: van gui lai', so === 2)
}

async function moKhay(ham) {
  const R = path.join(__dirname, '..', '..')
  const w = new BrowserWindow({ show: false, width: 500, height: 200, webPreferences: { preload: path.join(R, 'src/preload-shelf.js'), sandbox: false, contextIsolation: true, backgroundThrottling: ham } })
  await w.loadFile(path.join(R, 'src/shelf/index.html'))
  return w
}
const ANH = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
const muc = (id) => ({ id, seq: id, thumb: ANH, filePath: 'C:/x/' + id + '.jpg', w: 800, h: 600, kb: 10 })
const demO = (w) => w.webContents.executeJavaScript(`document.querySelectorAll('#list .item').length`)
const demIdKhac = (w) => w.webContents.executeJavaScript(`new Set([...document.querySelectorAll('#list .item')].map((e) => e.dataset.id)).size`)

async function phanKhayThat() {
  ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
  ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Shift+`' })
  ipcMain.on('khay:kieu', (e) => { e.returnValue = 'ngang' })
  let nghe = null
  ipcMain.on('shelf:da-them', (_e, id) => { if (nghe) nghe(id) })

  const N = 1000
  for (const ham of [true, false]) {
    const w = await moKhay(ham)
    const g = taoGuiChac({ gui: (m) => w.webContents.send('shelf:add', m), henMs: 1500 })
    nghe = (id) => g.daNhan(id)
    const t0 = Date.now()
    for (let i = 1; i <= N; i++) g.gui(muc(i))
    while (g.conCho() && Date.now() - t0 < 15000) await cho(20)
    const n = await demO(w)
    kiem(N + ' anh mot nhip, ham nen ' + (ham ? 'bat (Windows)' : 'tat (Mac)') + ': trang ve du, xac nhan du', n === N && g.conCho() === 0, n + ' o, ' + (Date.now() - t0) + ' ms')
    w.destroy()
  }

  // Doi chung: lenh gui rot 1/5. Cach cu (gui mot lan) PHAI thieu, cach moi PHAI du va khong trung.
  const M = 200
  let w = await moKhay(false)
  nghe = null
  for (let i = 1; i <= M; i++) if (i % 5) w.webContents.send('shelf:add', muc(i))
  await cho(500)
  const cu = await demO(w)
  kiem('doi chung: cach cu rot lenh thi thieu anh', cu === M - M / 5, cu + '/' + M)
  w.destroy()

  w = await moKhay(false)
  const daRot = new Set()
  const g = taoGuiChac({ gui: (m) => { if (m.id % 5 === 0 && !daRot.has(m.id)) { daRot.add(m.id); return } w.webContents.send('shelf:add', m) }, henMs: 100 })
  nghe = (id) => g.daNhan(id)
  for (let i = 1; i <= M; i++) g.gui(muc(i))
  const t0 = Date.now()
  while (g.conCho() && Date.now() - t0 < 5000) await cho(20)
  const moiN = await demO(w), khac = await demIdKhac(w)
  kiem('cach moi rot lenh: tu gui lai, du anh, khong trung', moiN === M && khac === M, moiN + '/' + M)
  w.destroy()

  // Gui lai mot anh da co: khong sinh o thu hai
  w = await moKhay(false)
  nghe = null
  for (let i = 0; i < 3; i++) w.webContents.send('shelf:add', muc(7))
  await cho(300)
  kiem('gui lai cung anh 3 lan: chi 1 o', (await demO(w)) === 1)
  w.destroy()
}

app.whenReady().then(async () => {
  try { await phanThuLai(); phanOverlayKet(); phanGuiChac(); await phanKhayThat() } catch (e) { truot++; console.log('LOI ' + ((e && e.stack) || e)) }
  console.log('\n' + dat + ' dat, ' + truot + ' truot')
  app.exit(truot ? 1 : 0)
})
