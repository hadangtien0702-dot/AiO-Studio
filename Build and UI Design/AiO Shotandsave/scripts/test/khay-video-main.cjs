'use strict'
/* Phan Electron cua bai do so video (goi tu do-kho-video.cjs). KHONG chay main.js cua app, KHONG hien cua so nao len
   man: 1 cua so offscreen nap THAT src/khay/index.html + preload-khay.js, main gia tra 2 video:
   [0] file mau binh thuong (co so do luc quay), [1] file bi CUT cuoi nhu file quay do (ms = w = h = 0, loi = true).
   Chay: electron scripts/test/khay-video-main.cjs <thu-muc-tam> <file-mau> <file-cut> */
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')
const ROOT = path.resolve(__dirname, '..', '..')
const TAM = path.resolve(process.argv[2]), MAU = path.resolve(process.argv[3]), CUT = path.resolve(process.argv[4])
app.setPath('userData', path.join(TAM, 'userData-khay'))
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + ((e && e.stack) || e)); app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 40 giay'), 40000)

ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.handle('storyboard:get-data', () => ({ dais: [], moiId: null, tuLuu: false, lang: 'vi' }))
ipcMain.handle('video:get-data', () => ({
  ds: [
    { id: 'vid-20261002-120000-001', ten: path.basename(MAU), url: pathToFileURL(MAU).href, ms: 3000, w: 640, h: 360, bytes: 150786, taoLuc: new Date(2026, 9, 2, 12, 0, 0).toISOString(), loi: false, coNutTieng: true, boTieng: false, bytesXoa: 150786 },
    { id: 'vid-20261002-120000-002', ten: path.basename(CUT), url: pathToFileURL(CUT).href, ms: 0, w: 0, h: 0, bytes: 90471, taoLuc: new Date(2026, 9, 2, 11, 0, 0).toISOString(), loi: true, coNutTieng: true, boTieng: false, bytesXoa: 90471 },
  ],
  moiId: null, lang: 'vi', dangQuay: false,
}))

app.whenReady().then(async () => {
  const loiTrang = []
  const w = new BrowserWindow({ x: 0, y: 0, width: 820, height: 900, show: false, frame: false,
    webPreferences: { offscreen: true, preload: path.join(ROOT, 'src', 'preload-khay.js'), contextIsolation: true, sandbox: false } })
  w.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') loiTrang.push(msg || e.message) })
  await w.loadFile(path.join(ROOT, 'src', 'khay', 'index.html'), { query: { tab: 'video' } })
  const doc = () => w.webContents.executeJavaScript(`[...document.querySelectorAll('#ds-video .vd')].map((h) => {
    const v = h.querySelector('video'), n = h.querySelector('.vd-bi-ngat'), g = h.querySelector('.vd-gio')
    return { nhan: n ? n.textContent : null, goiY: n ? n.title : null, meta: h.querySelector('.dai-meta').textContent,
      gio: g.textContent, gioAn: g.hidden, san: v.readyState, rong: v.videoWidth, cao: v.videoHeight,
      thoiLuong: isFinite(v.duration) ? v.duration : -1, loiPhat: v.error ? v.error.code + ' ' + v.error.message : null }
  })`, true)
  let hang = []
  for (let i = 0; i < 30; i++) { // cho toi 9 giay cho ca 2 video giai ma xong khung dau
    await cho(300)
    hang = await doc()
    if (hang.length === 2 && hang.every((h) => h.san >= 2 || h.loiPhat)) break
  }
  console.log('KQ=' + JSON.stringify({ hang, loiTrang }))
  app.exit(0)
})
