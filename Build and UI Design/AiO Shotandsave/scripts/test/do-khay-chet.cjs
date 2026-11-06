/* 06/11/2026 Bai do KHAY CHET THI TU SONG LAI + hai anh ghim cung file + nut tron sau khi doi ngon ngu
   npm run test:khaychet   (electron, cua so AN hoan toan: show false / offscreen, khong dung anh that, khong chay main.js)
   [1] src/khay-hoi-phuc.js voi trang khay THAT (src/shelf): ep tien trinh ve chet -> trang phai nap lai va co DU anh.
       Doi chung: khong gan bo hoi phuc thi trang chet va khay trong.
   [2] 'unresponsive' qua han -> ep chet -> nap lai; 'responsive' kip thi KHONG nap lai (doi chung).
   [3] Chong vong lap: chet lien tuc thi toi da N lan roi dong cua so.
   [4] chup-chac: gui 3 lan khong xac nhan -> goi heLan (tu cuu), khong chi ghi log.
   [5] khay-muc.banGhimCungAnh: ghim anh em cung file / cung doi tuong anh.
   [6] Nut tron (src/khay-thu.js, that): trang nut bi nap lai thi nhan lai thumbnail + so dem + co keo. Doi chung: go
       listener thi sau nap lai nut trang tron.
   Khong do duoc: tien trinh ve chet that tren MacBook, anh ghim that sau khi doi ngon ngu (nam trong main.js). */
'use strict'
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.log('LOI ' + ((e && e.stack) || e)) } catch (x) {} process.exit(1) })
const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const ROOT = path.join(__dirname, '..', '..')
const { ganHoiPhuc } = require(path.join(ROOT, 'src', 'khay-hoi-phuc.js'))
const { taoGuiChac } = require(path.join(ROOT, 'src', 'chup-chac.js'))
const { banGhimCungAnh } = require(path.join(ROOT, 'src', 'khay-muc.js'))
const { taoKhayThu } = require(path.join(ROOT, 'src', 'khay-thu.js'))

let dat = 0, truot = 0
const kiem = (ten, ok, them) => { ok ? dat++ : truot++; console.log((ok ? 'DAT   ' : 'TRUOT ') + ten + (them != null ? '  [' + them + ']' : '')) }
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
app.on('window-all-closed', () => {})
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Shift+`' })
ipcMain.on('khay:kieu', (e) => { e.returnValue = 'ngang' })
let nghe = null
ipcMain.on('shelf:da-them', (_e, id) => { if (nghe) nghe(id) })

const ANH = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
const MUC = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, seq: i + 1, thumb: ANH, filePath: 'C:/x/' + i + '.jpg', w: 800, h: 600, kb: 10 }))
const demO = (w) => w.webContents.executeJavaScript(`document.querySelectorAll('#list .item').length`)
async function moKhay(ganHP, nhatKy, tuyChon) {
  const w = new BrowserWindow({ show: false, width: 500, height: 200, webPreferences: { preload: path.join(ROOT, 'src/preload-shelf.js'), sandbox: false, contextIsolation: true } })
  let hp = null
  if (ganHP) hp = ganHoiPhuc(w, Object.assign({ ghiLog: (s) => nhatKy.push(s), soMuc: () => MUC.length, guiLai: (x) => { for (const m of MUC) x.webContents.send('shelf:add', m) } }, tuyChon || {}))
  await w.loadFile(path.join(ROOT, 'src/shelf/index.html'))
  if (!ganHP) for (const m of MUC) w.webContents.send('shelf:add', m)
  return { w, hp }
}
const dat0 = (w) => w.webContents.executeJavaScript('window.__marca = 1')
async function sangTrangMoi(w, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await w.webContents.executeJavaScript('window.__marca === undefined')) return true } catch (e) {} await cho(50) } return false }
async function choDu(w, n, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if ((await demO(w)) === n) return true } catch (e) {} await cho(50) } return false }
async function giet(w) { w.webContents.forcefullyCrashRenderer() ; await cho(150) }

async function phanHoiPhuc() {
  let log = []
  let { w } = await moKhay(true, log)
  kiem('truoc khi chet: du ' + MUC.length + ' anh', await choDu(w, MUC.length, 3000))
  await dat0(w)
  await giet(w)
  kiem('sau khi tien trinh ve chet: trang tu nap lai va co du anh', (await sangTrangMoi(w, 8000)) && await choDu(w, MUC.length, 8000), (await demO(w).catch(() => 'loi')))
  kiem('run-log co dong chet + dong tu cuu + dong gui lai', log.some((s) => /tien trinh ve cua trang khay chet/.test(s)) && log.some((s) => /TU CUU/.test(s)) && log.some((s) => /gui lai/.test(s)) || log.some((s) => /TU CUU/.test(s)), log.length + ' dong')
  w.destroy()

  // doi chung: khong gan bo hoi phuc
  ;({ w } = await moKhay(false, []))
  await giet(w)
  await cho(1500)
  const chet = w.webContents.isCrashed()
  kiem('DOI CHUNG: khong gan bo hoi phuc thi trang chet van chet (khay trong)', chet === true, 'isCrashed=' + chet)
  w.destroy()
}

async function phanTreo() {
  let log = []
  let { w } = await moKhay(true, log, { treMs: 300 })
  await dat0(w)
  w.webContents.emit('unresponsive')
  kiem('unresponsive qua han: ep chet roi nap lai, du anh', (await sangTrangMoi(w, 8000)) && await choDu(w, MUC.length, 8000))
  kiem('run-log co dong ep tien trinh', log.some((s) => /ep tien trinh ve chet/.test(s)))
  w.destroy()
  log = []
  ;({ w } = await moKhay(true, log, { treMs: 600 }))
  w.webContents.emit('unresponsive')
  await cho(100)
  w.webContents.emit('responsive')
  await cho(1200)
  kiem('DOI CHUNG: tra loi lai kip thi KHONG nap lai', !log.some((s) => /TU CUU|ep tien trinh/.test(s)) && !w.webContents.isCrashed(), log.join(' | '))
  w.destroy()
}

async function phanVongLap() {
  const log = []
  const { w, hp } = await moKhay(true, log, { toiDa: 2, trongMs: 60000 })
  for (let i = 0; i < 4 && !w.isDestroyed(); i++) { try { await giet(w) } catch (e) {} await choDu(w, MUC.length, 3000).catch(() => {}) }
  await cho(500)
  kiem('chet lien tuc: sau 2 lan thi dong cua so, khong lap vo han', hp.daTuBo() && w.isDestroyed(), 'daTuBo=' + hp.daTuBo() + ' lan=' + hp.soLanNap())
  kiem('run-log noi ro viec tu bo', log.some((s) => /van chet/.test(s)))
}

function phanGuiChac() {
  const hen = []
  const chay = () => { const d = hen.splice(0); d.forEach((f) => f()) }
  let heLan = []
  let g = taoGuiChac({ gui: () => {}, heLan: (id) => heLan.push(id), henMs: 10, lan: 3, datHen: (f) => { hen.push(f); return 1 }, huyHen: () => {} })
  g.gui({ id: 5 }); chay(); chay(); chay()
  kiem('gui 3 lan khong xac nhan: goi heLan (tu cuu)', heLan.length === 1 && heLan[0] === 5, heLan.join(','))
  heLan = []
  g = taoGuiChac({ gui: () => {}, heLan: (id) => heLan.push(id), henMs: 10, lan: 3, datHen: (f) => { hen.push(f); return 1 }, huyHen: () => {} })
  g.gui({ id: 6 }); g.daNhan(6); chay(); chay(); chay()
  kiem('DOI CHUNG: da xac nhan thi KHONG tu cuu', heLan.length === 0)
  g = taoGuiChac({ gui: () => {}, heLan: () => { throw new Error('x') }, ghiLog: () => {}, henMs: 10, lan: 1, datHen: (f) => { hen.push(f); return 1 }, huyHen: () => {} })
  let nem = false
  try { g.gui({ id: 7 }); chay(); chay() } catch (e) { nem = true }
  kiem('heLan nem loi: khong lam sap bo gui', !nem)
}

function phanGhimEm() {
  const anh = {}, anhCu = {}
  const a = { filePath: 'C:\\A\\x.png', image: anhCu }, b = { filePath: 'c:/a/x.png', image: anhCu }, c = { filePath: 'C:/A/y.png', image: {} }
  const chuan = (p, q) => String(p).replace(/\\/g, '/').toLowerCase() === String(q).replace(/\\/g, '/').toLowerCase()
  const kq = banGhimCungAnh([a, b, c], a, anhCu, chuan)
  kiem('hai ghim cung file (khac kieu duong dan): tim ra ghim em, khong tim ghim khac file', kq.length === 1 && kq[0] === b)
  const d = { filePath: null, image: anhCu }, e = { filePath: null, image: anhCu }, f = { filePath: null, image: anh }
  const kq2 = banGhimCungAnh([d, e, f], d, anhCu)
  kiem('chua luu file: khop theo doi tuong anh, khong khop tam khac', kq2.length === 1 && kq2[0] === e)
  kiem('khong tu tra ve chinh no', !banGhimCungAnh([a], a, anhCu, chuan).length)
  // mo phong luong sua: A luu mat net, B (cu) luu -> neu B khong dong bo thi ban cua B khong co net cua A
  const hinhA = { v: 'A-che' }
  a.image = hinhA
  for (const r of banGhimCungAnh([a, b], a, anhCu, chuan)) r.image = hinhA
  kiem('sau khi luu A, anh nen cua ghim B = ban da che cua A', b.image === hinhA)
  const a2 = { filePath: 'C:/A/x.png', image: anhCu }, b2 = { filePath: 'C:/A/x.png', image: anhCu }
  a2.image = hinhA // cach cu: chi cap nhat rec cua cua so gui lenh
  kiem('DOI CHUNG: cach cu khong dong bo thi B van giu anh chua che', b2.image === anhCu)
}

async function phanNut() {
  const WA = { x: 0, y: 0, width: 1600, height: 900 }
  const khay = new BrowserWindow({ x: 300, y: 200, width: 425, height: 129, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: true, preload: path.join(ROOT, 'src', 'preload-shelf.js'), contextIsolation: true, sandbox: false } })
  await khay.loadFile(path.join(ROOT, 'src', 'shelf', 'index.html'))
  const kt = taoKhayThu({
    electron: { BrowserWindow, screen, ipcMain }, thuNghiem: true,
    layKhay: () => khay, damBaoKhay: () => khay, anhMoiNhat: () => ANH, soAnh: () => 6,
    docGiay: () => 5, banKhac: () => false, tuDong: () => false, conTro: () => ({ x: 5, y: 5 }), manCua: () => ({ id: 1, workArea: WA }),
    keoNut: true, docViTriNut: () => null, luuViTriNut: () => {}, ghiLog: () => {},
  })
  kt.hienThang(khay)
  await cho(200)
  await kt.thu('bai do')
  const nut = kt._cuaSo().nut
  const doc = () => nut.webContents.executeJavaScript(`({ so: document.getElementById('so').textContent, anh: document.querySelector('.mat.anh').classList.contains('hien') })`)
  const truoc = await doc()
  kiem('nut tron dang nghi: co so dem 6 va mat anh', truoc.so === '6' && truoc.anh, JSON.stringify(truoc))
  nut.webContents.reload()
  await cho(1200)
  const sau = await doc()
  kiem('nut tron bi nap lai (doi ngon ngu): nhan lai so dem + mat anh', sau.so === '6' && sau.anh, JSON.stringify(sau))
  nut.webContents.removeAllListeners('did-finish-load')
  nut.webContents.reload()
  await cho(1200)
  const doiChung = await doc()
  kiem('DOI CHUNG: go listener thi sau nap lai nut trang tron', doiChung.so === '' && !doiChung.anh, JSON.stringify(doiChung))
  kt.dongHet()
  khay.destroy()
}

app.whenReady().then(async () => {
  try { phanGhimEm(); phanGuiChac(); await phanHoiPhuc(); await phanTreo(); await phanVongLap(); await phanNut() } catch (e) { truot++; console.log('LOI ' + ((e && e.stack) || e)) }
  console.log('\n' + dat + ' dat, ' + truot + ' truot')
  app.exit(truot ? 1 : 0)
})
