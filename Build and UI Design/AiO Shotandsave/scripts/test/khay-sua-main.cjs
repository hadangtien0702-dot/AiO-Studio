'use strict'
/* Phan Electron cua bai do NUT "SUA" tren hang video cua Khay video (goi tu do-sua-video-ui.cjs). KHONG chay main.js, KHONG hien
   cua so nao: 1 cua so offscreen nap THAT src/khay/index.html + preload-khay.js; main gia tra 2 video (mp4 / webm), nghe 'sua:mo'.
   Do o nhieu be rong cua so, ca VI lan EN: nut Sua co mat, cac nut cung hang cao bang nhau, khong tran ngang; bam Sua that -> 'sua:mo'. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const ROOT = path.resolve(__dirname, '..', '..')
const RA = process.env.AIO_KHAY_RA
const MAU = process.env.AIO_KHAY_MAU
const LANG = process.env.AIO_LANG === 'en' ? 'en' : 'vi'
app.setPath('userData', path.join(RA, 'userData-khay-' + LANG))
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const nhan = []
ipcMain.on('i18n:lang', (e) => { e.returnValue = LANG })
ipcMain.handle('storyboard:get-data', () => ({ dais: [], moiId: null, tuLuu: false, lang: LANG }))
ipcMain.on('sua:mo', (_e, id) => nhan.push(id))
ipcMain.handle('video:get-data', () => ({
  ds: [
    { id: 'vid-20261106-120000-001', ten: path.basename(MAU), url: pathToFileURL(MAU).href, ms: 7000, w: 640, h: 360, bytes: 150786, taoLuc: new Date(2026, 10, 6, 12, 0, 0).toISOString(), loi: false, coNutTieng: true, boTieng: false, bytesXoa: 150786, gifDuoc: true, chonGif: false, bytesGif: 0 },
    { id: 'vid-20261106-110000-002', ten: 'x.webm', url: pathToFileURL(MAU).href, ms: 7000, w: 640, h: 360, bytes: 150786, taoLuc: new Date(2026, 10, 6, 11, 0, 0).toISOString(), loi: false, coNutTieng: false, boTieng: false, bytesXoa: 150786, gifDuoc: false, chonGif: false, bytesGif: 0 },
  ],
  moiId: null, lang: LANG, dangQuay: false, gifToiDaMs: 60000,
}))

app.whenReady().then(async () => {
  const kq = { lang: LANG, rong: {}, loi: [] }
  try {
    const w = new BrowserWindow({ x: 0, y: 0, width: 820, height: 900, show: false, frame: false,
      webPreferences: { offscreen: true, preload: path.join(ROOT, 'src', 'preload-khay.js'), contextIsolation: true, sandbox: false } })
    w.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') kq.loi.push(String(msg || e.message).slice(0, 200)) })
    await w.loadFile(path.join(ROOT, 'src', 'khay', 'index.html'), { query: { tab: 'video' } })
    await cho(800)
    const js = (c) => w.webContents.executeJavaScript(c, true)
    for (const W of [640, 760, 900, 1080]) {
      w.setContentSize(W, 700); await cho(400)
      kq.rong[W] = JSON.parse(await js(`JSON.stringify([...document.querySelectorAll('#ds-video .vd')].map((h) => {
        const dau = h.querySelector('.dai-dau'), dr = dau.getBoundingClientRect()
        const ctr = [...dau.querySelectorAll('.nut, .chon-nhom')].map((e) => { const r = e.getBoundingClientRect(); return { ten: e.textContent.trim().slice(0, 12), h: Math.round(r.height), r: Math.round(r.right), t: Math.round(r.top) } })
        const sua = [...dau.querySelectorAll('.nut')].find((b) => b.textContent.trim() === ${JSON.stringify(LANG === 'en' ? 'Edit' : 'Sửa')})
        return { co: !!sua, khoa: sua ? sua.disabled : null, title: sua ? sua.title : null, dauRight: Math.round(dr.right), ngoai: ctr.filter((c) => c.r > dr.right + 1).map((c) => c.ten), cao: ctr.map((c) => c.h), tren: ctr.map((c) => c.t), tran: dau.scrollWidth > dau.clientWidth + 1, trang: document.documentElement.scrollWidth > window.innerWidth + 1 }
      }))`))
    }
    w.setContentSize(900, 700); await cho(300)
    await js(`(() => { const b = [...document.querySelectorAll('#ds-video .vd')[0].querySelectorAll('.dai-dau .nut')].find((x) => x.title && x.disabled === false && x.textContent.trim() === ${JSON.stringify(LANG === 'en' ? 'Edit' : 'Sửa')}); b.click(); return true })()`)
    const b2 = await js(`(() => { const b = [...document.querySelectorAll('#ds-video .vd')[1].querySelectorAll('.dai-dau .nut')].find((x) => x.textContent.trim() === ${JSON.stringify(LANG === 'en' ? 'Edit' : 'Sửa')}); if (!b.disabled) b.click(); return b.disabled })()`)
    await cho(300)
    kq.bamMp4 = nhan.slice(); kq.webmKhoa = b2; kq.sauWebm = nhan.slice()
  } catch (e) { kq.loiChung = String((e && e.stack) || e) }
  fs.writeFileSync(path.join(RA, 'khay-sua-' + LANG + '.json'), JSON.stringify(kq))
  app.exit(0)
})
