'use strict'
/* Phan Electron cua bai do GIAO DIEN xuat GIF trong Khay video (06/10, goi tu do-xuat-gif.mjs).
   KHONG chay main.js cua app, KHONG hien cua so nao: 1 cua so offscreen nap THAT src/khay/index.html + preload-khay.js;
   main gia tra 3 video (cung 1 file mau, chep ra 3 ban trong thu muc tam):
     [0] co tieng, 4 giay      -> cum [Co tieng | Khong tieng | GIF]
     [1] khong tieng, 4 giay   -> cum [Video | GIF]
     [2] 90 giay (qua tran 60) -> o GIF mo, co ly do
   Kenh 'video:chon-gif' chay BO MAY THAT (src/xuat-gif.js) nen file .gif la file that.
   Chay: electron scripts/test/khay-gif-main.cjs <thu-muc-tam> <file-mau.mp4> <vi|en> */
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path'), fs = require('fs')
const { pathToFileURL } = require('url')
const ROOT = path.resolve(__dirname, '..', '..')
const TAM = path.resolve(process.argv[2]), MAU = path.resolve(process.argv[3]), LANG = process.argv[4] === 'en' ? 'en' : 'vi'
app.setPath('userData', path.join(TAM, 'userData-khay-gif'))
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + ((e && e.stack) || e)); app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 90 giay'), 90000)

const xuatGif = require(path.join(ROOT, 'src', 'xuat-gif.js'))
const nhatKy = []
xuatGif.khoiTao((s) => nhatKy.push(s))

const ID = ['vid-20261006-120000-001', 'vid-20261006-120000-002', 'vid-20261006-120000-003']
const so = ID.map((id, i) => {
  const file = path.join(TAM, 'khay-' + LANG + '-' + (i + 1) + '.mp4')
  fs.copyFileSync(MAU, file)
  try { fs.unlinkSync(file.replace(/\.mp4$/, '.gif')) } catch (e) {}
  return { id, file, tieng: i === 0, ms: i === 2 ? 90000 : 4000, boTieng: false, chonGif: false, fileGif: null }
})
const tim = (id) => so.find((m) => m.id === id)
const bGif = (m) => { try { return m.fileGif ? fs.statSync(m.fileGif).size : 0 } catch (e) { return 0 } }
const tt = (m) => ({ ok: true, boTieng: m.boTieng, chonGif: m.chonGif, bytesGif: bGif(m), bytesXoa: fs.statSync(m.file).size + bGif(m) })
let soLanXuat = 0

ipcMain.on('i18n:lang', (e) => { e.returnValue = LANG })
ipcMain.handle('storyboard:get-data', () => ({ dais: [], moiId: null, tuLuu: false, lang: LANG }))
ipcMain.handle('video:get-data', () => ({
  ds: so.map((m) => ({ id: m.id, ten: path.basename(m.file), url: pathToFileURL(m.file).href, ms: m.ms, w: 1280, h: 720, bytes: fs.statSync(m.file).size,
    taoLuc: new Date(2026, 9, 6, 12, 0, 0).toISOString(), loi: false, coNutTieng: m.tieng, boTieng: m.boTieng, bytesXoa: fs.statSync(m.file).size,
    gifDuoc: true, chonGif: m.chonGif, bytesGif: bGif(m) })),
  moiId: null, lang: LANG, dangQuay: false, gifToiDaMs: xuatGif.MAC_DINH.toiDaMs,
}))
ipcMain.handle('video:chon-tieng', (_e, id, coTieng) => { const m = tim(id); m.boTieng = !coTieng; m.chonGif = false; return tt(m) })
ipcMain.handle('video:chon-gif', async (e, id, chon) => {
  const m = tim(id)
  if (!chon) { m.chonGif = false; return tt(m) }
  if (!bGif(m)) {
    soLanXuat++
    const f = m.file.replace(/\.mp4$/, '.gif')
    const r = await xuatGif.xuat(m.file, f, null, (p) => { if (!e.sender.isDestroyed()) e.sender.send('video:gif-tien-do', id, p) })
    if (!r.ok) return { ok: false, loi: r.loi }
    m.fileGif = f
  }
  m.chonGif = true
  return tt(m)
})

app.whenReady().then(async () => {
  const loiTrang = []
  const w = new BrowserWindow({ x: 0, y: 0, width: 820, height: 900, show: false, frame: false,
    webPreferences: { offscreen: true, preload: path.join(ROOT, 'src', 'preload-khay.js'), contextIsolation: true, sandbox: false } })
  w.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') loiTrang.push(msg || e.message) })
  await w.loadFile(path.join(ROOT, 'src', 'khay', 'index.html'), { query: { tab: 'video' } })
  const js = (code) => w.webContents.executeJavaScript(code, true)
  const docHang = () => js(`[...document.querySelectorAll('#ds-video .vd')].map((h) => {
    const nut = [...h.querySelectorAll('.chon-tieng .chon-nut')]
    return { nut: nut.map((b) => ({ chu: b.textContent, bat: b.classList.contains('active'), mo: b.disabled, goiY: b.title, cao: b.getBoundingClientRect().height })),
      meta: h.querySelector('.dai-meta').textContent, tat: h.querySelector('video').muted, xoa: h.querySelector('.nut.icon').title,
      nhomCao: h.querySelector('.chon-tieng') ? h.querySelector('.chon-tieng').getBoundingClientRect().height : 0 }
  })`)
  for (let i = 0; i < 30; i++) { await cho(200); if ((await docHang()).length === 3) break }
  const kq = { lang: LANG, dau: await docHang() }

  // Bam GIF o hang 1, ghi lai chu tren o GIF trong luc tao
  await js(`window.__chu = []; window.__ham = setInterval(() => { const b = document.querySelector('#ds-video .vd .chon-gif'); window.__chu.push(b.textContent + (b.classList.contains('dang-tao') ? '|tao' : '')) }, 15); document.querySelector('#ds-video .vd .chon-gif').click()`)
  for (let i = 0; i < 300; i++) { await cho(100); const h = await docHang(); if (h[0].nut[2].bat || (i > 5 && !(await js(`document.querySelector('#ds-video .vd .chon-gif').classList.contains('dang-tao')`)))) break }
  await cho(150)
  kq.chuLucTao = [...new Set(await js(`clearInterval(window.__ham); window.__chu`))]
  kq.sauGif = await docHang()
  kq.fileGif = { co: fs.existsSync(so[0].file.replace(/\.mp4$/, '.gif')), bytes: bGif(so[0]), conTam: fs.existsSync(so[0].file.replace(/\.mp4$/, '.gif') + '.tam') }
  kq.toast1 = await js(`document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').textContent : ''`)

  // Doi ve "Co tieng" roi bam GIF lan nua: phai dung lai file cu (khong tao lai)
  await js(`document.querySelector('#ds-video .vd .chon-tieng .chon-nut').click()`); await cho(300)
  kq.veCoTieng = await docHang()
  await js(`document.querySelector('#ds-video .vd .chon-gif').click()`); await cho(500)
  kq.gifLan2 = await docHang()
  kq.soLanXuat = soLanXuat

  // Hang 2 (khong tieng): bam GIF roi bam Video
  await js(`document.querySelectorAll('#ds-video .vd')[1].querySelector('.chon-gif').click()`)
  for (let i = 0; i < 300; i++) { await cho(100); if ((await docHang())[1].nut[1].bat) break }
  kq.hang2Gif = (await docHang())[1]
  await js(`document.querySelectorAll('#ds-video .vd')[1].querySelector('.chon-tieng .chon-nut').click()`); await cho(300)
  kq.hang2Video = (await docHang())[1]

  // Bo cuc hang dau o vai be rong cua so (hang 1 dang chon GIF = dong thong tin dai nhat)
  kq.boCuc = []
  for (const rong of [560, 640, 720, 760, 860, 1080]) {
    w.setContentSize(rong, 900); await cho(250)
    kq.boCuc.push(await js(`(() => { const ra = { rong: innerWidth, hang: [] }
      document.querySelectorAll('#ds-video .vd .dai-dau').forEach((d) => {
        const b = d.getBoundingClientRect(); let tran = 0, de = 0; const con = [...d.children].filter((c) => c.getBoundingClientRect().width > 0 && !c.classList.contains('spacer'))
        con.forEach((c) => { const r = c.getBoundingClientRect(); if (r.right > b.right + 0.5 || r.left < b.left - 0.5) tran++ })
        for (let i = 0; i < con.length; i++) for (let j = i + 1; j < con.length; j++) { const a = con[i].getBoundingClientRect(), c = con[j].getBoundingClientRect()
          if (a.left < c.right - 0.5 && c.left < a.right - 0.5 && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5) de++ }
        const meta = d.querySelector('.dai-meta'); const rg = document.createRange(); rg.selectNodeContents(meta)
        ra.hang.push({ tran, de, cao: Math.round(b.height), metaHop: +meta.getBoundingClientRect().width.toFixed(1), metaCan: +rg.getBoundingClientRect().width.toFixed(1), trangTran: document.documentElement.scrollWidth > innerWidth }) })
      return ra })()`))
  }
  kq.loiTrang = loiTrang; kq.nhatKy = nhatKy
  console.log('KQ=' + JSON.stringify(kq))
  app.exit(0)
})
