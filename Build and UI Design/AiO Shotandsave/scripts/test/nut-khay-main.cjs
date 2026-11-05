'use strict'
/* Phan Electron cua `npm run test:nutkhay` (06/10): nap trang Khay anh THAT (src/shelf) trong cua so AN o vai kho,
   do tung nut tren #bar bi phan tu khac che bao nhieu diem + moi goc con nam duoc bao nhieu diem.
   Moi kho do 2 lan: ban THAT, va ban DOI CHUNG (go luat noi nut "–" len tren vung nam goc -> nut phai bi che lai).
   Khong danh thuc ban dang cai (userData rieng, khong lay khoa single-instance), khong hien gi len man hinh. */
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path'), fs = require('fs')

const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.join(ROOT, '.selftest', 'nut-khay')
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData'))

const KHO = [
  { w: 700, h: 150, lang: 'vi', kieu: 'ngang' },
  { w: 420, h: 110, lang: 'en', kieu: 'ngang' },
  { w: 252, h: 420, lang: 'en', kieu: 'doc' },
  { w: 252, h: 420, lang: 'vi', kieu: 'doc' },
]
let cfg = KHO[0]
ipcMain.on('i18n:lang', (e) => { e.returnValue = cfg.lang })
ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Ctrl+Shift+S' })
ipcMain.on('khay:kieu', (e) => { e.returnValue = cfg.kieu })

const DO = `(() => {
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } }
  const che = (e) => { const b = e.getBoundingClientRect(); let bi = 0, tong = 0; const ai = {}
    for (let x = b.left + 0.5; x < b.right; x += 1) for (let y = b.top + 0.5; y < b.bottom; y += 1) {
      tong++; const p = document.elementFromPoint(x, y)
      if (!(p === e || e.contains(p))) { bi++; const k = (p && (p.id || p.className)) || '?'; ai[k] = (ai[k] || 0) + 1 }
    }
    return { tong, bi, boiAi: ai } }
  const out = { cua: innerWidth + 'x' + innerHeight, doc: document.body.classList.contains('doc'), nut: {}, goc: {} }
  // Tieu de co bi bop khong (so dem 3 chu so = truong hop chat nhat). Do be rong CHU bang Range, khong dung scrollWidth
  // (phan tu co ellipsis thi scrollWidth = clientWidth voi moi chuoi).
  const dem = document.getElementById('count'); if (dem) dem.textContent = '888'
  const td = document.getElementById('title'); const rg = document.createRange(); rg.selectNodeContents(td)
  out.tieuDe = { chu: td.textContent, hop: +td.getBoundingClientRect().width.toFixed(1), can: +rg.getBoundingClientRect().width.toFixed(1) }
  const hide = document.getElementById('hide'); const sh = document.getElementById('shelf')
  if (hide && sh) out.khePhai = +(sh.getBoundingClientRect().right - hide.getBoundingClientRect().right).toFixed(1)
  document.querySelectorAll('#bar button').forEach((e) => { out.nut[e.id || '(khong id)'] = Object.assign(r(e), che(e)) })
  document.querySelectorAll('.grip-goc').forEach((g) => { const b = g.getBoundingClientRect(); let n = 0, tong = 0
    for (let x = b.left + 0.5; x < b.right; x += 1) for (let y = b.top + 0.5; y < b.bottom; y += 1) { tong++; if (document.elementFromPoint(x, y) === g) n++ }
    out.goc[g.id] = { tong, namDuoc: n } })
  return out })()`

app.on('window-all-closed', () => {}) // dong cua so cua kho truoc KHONG duoc lam app thoat giua chung
app.whenReady().then(async () => {
  const kq = []
  for (const k of KHO) {
    cfg = k
    const win = new BrowserWindow({
      width: k.w, height: k.h, show: false, frame: false, transparent: true,
      webPreferences: { preload: path.join(ROOT, 'src', 'preload-shelf.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false },
    })
    const muc = { cfg: k }
    try {
      await win.loadFile(path.join(ROOT, 'src', 'shelf', 'index.html'))
      await new Promise((r) => setTimeout(r, 600))
      muc.that = await win.webContents.executeJavaScript(DO, true)
      await win.webContents.insertCSS('#bar button { position: static !important; z-index: auto !important; }')
      await new Promise((r) => setTimeout(r, 150))
      muc.doiChung = await win.webContents.executeJavaScript(DO, true)
    } catch (e) { muc.loi = String(e && e.message || e) }
    kq.push(muc)
    win.destroy()
  }
  fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq))
  app.exit(0)
})
setTimeout(() => app.exit(2), 40000)
