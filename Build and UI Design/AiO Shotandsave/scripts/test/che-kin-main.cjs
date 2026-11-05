'use strict'
/* Phan Electron cua bai do kieu lam mo "TO KIN" (goi tu do-che-kin.mjs). KHONG chay main.js cua app, KHONG hien cua so
   nao len man: 2 cua so offscreen nap THAT src/overlay/index.html + src/pin/index.html voi preload that (cung khuon voi
   so-buoc-main.cjs). Net lam mo duoc dua thang vao `shapes` roi goi `redraw()` — do DUONG VE + DUONG XUAT ANH, khong do chuot.
   Chay: electron scripts/test/che-kin-main.cjs <thu-muc-ra> <ti-le-man> [hong]
   hong = DOI CHUNG: thay veCheKin bang ham rong -> bai cham PHAI bat duoc. */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.resolve(process.argv[2] || path.join(ROOT, '.selftest', 'che-kin'))
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] === 'hong'
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData'))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 60 giay'), 60000)

let xacNhan = null, luuGhim = null
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('overlay:confirm', (_e, p) => { xacNhan = p })
ipcMain.on('pin:save-edit', (_e, d) => { luuGhim = d })

// Vung lam mo trong bai (DIP cuc bo cua canvas ve): 100,80 -> 300,180. "Phan trong" = lui vao 3 DIP de ne net vien mo.
const V = { x1: 100, y1: 80, x2: 300, y2: 180 }
const NET = (kieu) => `shapes.length = 0; shapes.push({ type: 'blur', x1: ${V.x1}, y1: ${V.y1}, x2: ${V.x2}, y2: ${V.y2}, color: curColor, blurType: ${kieu} }); redraw(); true`
const DIEM = `((lx, ly) => { const d = veCtx.getImageData(Math.round(lx * DPR), Math.round(ly * DPR), 1, 1).data; return [d[0], d[1], d[2], d[3]] })`
// dem diem KHONG phai den dac trong phan trong cua vung, tren canvas ve
const QUET = `(() => { const x0 = Math.round(${V.x1 + 3} * DPR), y0 = Math.round(${V.y1 + 3} * DPR), w = Math.round(${V.x2 - V.x1 - 6} * DPR), h = Math.round(${V.y2 - V.y1 - 6} * DPR)
  const d = veCtx.getImageData(x0, y0, w, h).data; let khac = 0
  for (let i = 0; i < d.length; i += 4) if (d[i] || d[i + 1] || d[i + 2] || d[i + 3] !== 255) khac++
  return { tong: w * h, khac } })()`
const PHIM = (key, code) => `window.dispatchEvent(new KeyboardEvent('keydown', { key: '${key}', code: '${code}', bubbles: true, cancelable: true })); true`

/** Anh luu ra -> { rong, cao, bmp (BGRA) } */
function docAnh(dataUrl) {
  const im = nativeImage.createFromDataURL(dataUrl), kt = im.getSize()
  return { rong: kt.width, cao: kt.height, bmp: im.toBitmap(), kieu: String(dataUrl).slice(0, 22) }
}
/** Dem diem khong den dac trong o (px anh that). */
function quetAnh(a, x0, y0, w, h) {
  let khac = 0
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = (y * a.rong + x) * 4
    if (a.bmp[i] || a.bmp[i + 1] || a.bmp[i + 2] || a.bmp[i + 3] !== 255) khac++
  }
  return { tong: w * h, khac }
}

app.whenReady().then(async () => {
  const kq = { tiLe: TI_LE, hong: HONG }
  const loiTrang = []
  const js = (w, s) => w.webContents.executeJavaScript(s, true)
  const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') loiTrang.push(ten + ': ' + (msg || e.message)) })

  /* ════ A. MAN CHUP (overlay) ════ */
  const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  nghe(ov, 'overlay')
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 }, lamMoKieu: 'mosaic' })
  ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
  await cho(300)
  if (HONG) await js(ov, 'veCheKin = function () {}; true')
  const o = (s) => js(ov, s)
  kq.dpr = await o('DPR')
  kq.a0 = await o('curBlurType') // mo voi Kham o
  // A1 doi kieu trong Cai dat luc man chup dang mo -> trang nhan 'kin'
  ov.webContents.send('overlay:update-config', { lamMoKieu: 'kin' })
  await cho(150)
  kq.a1 = await o('curBlurType')
  // A2 ve vung "To kin": giua + 2 goc trong la den dac, ngoai vung khong bi dung
  await o(NET('curBlurType'))
  kq.a2 = { giua: await o(DIEM + '(200, 130)'), gocTren: await o(DIEM + '(104, 84)'), gocDuoi: await o(DIEM + '(296, 176)'), ngoai: await o(DIEM + '(350, 250)') }
  kq.a3 = await o(QUET)
  // A4 DOI CHUNG: cung vung, kieu Kham o -> KHONG duoc la den dac (thuoc phai phan biet duoc 2 kieu)
  await o(NET("'mosaic'"))
  kq.a4 = { giua: await o(DIEM + '(200, 130)'), quet: await o(QUET) }
  // A5 net ghi 'kin' thi van To kin du Cai dat da doi lai Kham o (kieu di theo NET, khong theo cai dat luc sau)
  ov.webContents.send('overlay:update-config', { lamMoKieu: 'mosaic' })
  await cho(150)
  await o(NET("'kin'"))
  kq.a5 = { kieuHienTai: await o('curBlurType'), quet: await o(QUET) }
  // A6 bam Xong -> anh ghep gui ve main: vung do den dac trong ANH XUAT
  await o('document.getElementById("xong").click()')
  await cho(500)
  if (xacNhan && xacNhan.dataUrl) {
    const a = docAnh(xacNhan.dataUrl), d = kq.dpr
    kq.a6 = { rong: a.rong, cao: a.cao, kieu: a.kieu,
      quet: quetAnh(a, Math.round((V.x1 + 3) * d), Math.round((V.y1 + 3) * d), Math.round((V.x2 - V.x1 - 6) * d), Math.round((V.y2 - V.y1 - 6) * d)) }
    fs.writeFileSync(path.join(RA, 'overlay-' + TI_LE + '.png'), nativeImage.createFromDataURL(xacNhan.dataUrl).toPNG())
  } else kq.a6 = { loi: 'khong nhan duoc overlay:confirm co dataUrl', nhan: xacNhan && Object.keys(xacNhan) }
  ov.destroy()

  /* ════ B. ANH GHIM (pin) — anh NHIEU: moi diem mot mau, khong diem nao den (kenh nho nhat = 40) ════ */
  const NW = 900, NH = 600, DW = 600, DH = 400 // anh that 900x600 hien 600x400 -> he so xuat 1,5
  const goc = Buffer.alloc(NW * NH * 4)
  for (let i = 0, n = 0; i < goc.length; i += 4, n++) { goc[i] = 40 + (n * 7) % 200; goc[i + 1] = 40 + (n * 13) % 200; goc[i + 2] = 40 + (n * 29) % 200; goc[i + 3] = 255 }
  const nen = nativeImage.createFromBitmap(goc, { width: NW, height: NH }).toDataURL()
  const pin = new BrowserWindow({ x: 0, y: 0, width: DW + 24, height: DH + 24, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false } })
  nghe(pin, 'pin')
  await pin.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
  pin.webContents.send('pin:data', { dataUrl: nen, pad: 12, w: DW, h: DH, lamMoKieu: 'kin' })
  await cho(400)
  if (HONG) await js(pin, 'veCheKin = function () {}; true')
  const p = (s) => js(pin, s)
  // B1 phim 4 luc dang xem -> vao ve voi cong cu lam mo, kieu lay tu pin:data
  await p(PHIM('4', 'Digit4'))
  await cho(150)
  kq.b1 = await p('({ mode, tool, kieu: curBlurType })')
  // B2 DOI CHUNG truoc: Kham o tren anh nhieu -> phan trong KHONG den
  await p(NET("'mosaic'"))
  kq.b2 = await p(QUET)
  // B3 To kin: phan trong den dac tung diem
  await p(NET('curBlurType'))
  kq.b3 = await p(QUET)
  // B4 Enter = luu: trong ANH LUU (900x600) vung do den dac; ngoai vung KHONG co diem den nao va khong bi doi
  await p(PHIM('Enter', 'Enter'))
  await cho(500)
  if (luuGhim) {
    const a = docAnh(luuGhim), k = NW / DW
    fs.writeFileSync(path.join(RA, 'pin-' + TI_LE + '.png'), nativeImage.createFromDataURL(luuGhim).toPNG())
    const trong = quetAnh(a, Math.round((V.x1 + 3) * k), Math.round((V.y1 + 3) * k), Math.round((V.x2 - V.x1 - 6) * k), Math.round((V.y2 - V.y1 - 6) * k))
    // ngoai vung: 4 o 60x60 px o 4 goc anh — dem diem den dac + dem diem khac anh goc
    let den = 0, doi = 0, tong = 0
    for (const [x0, y0] of [[10, 10], [NW - 70, 10], [10, NH - 70], [NW - 70, NH - 70]]) {
      for (let y = y0; y < y0 + 60; y++) for (let x = x0; x < x0 + 60; x++) {
        const i = (y * a.rong + x) * 4; tong++
        if (!a.bmp[i] && !a.bmp[i + 1] && !a.bmp[i + 2]) den++
        if (a.bmp[i] !== goc[i] || a.bmp[i + 1] !== goc[i + 1] || a.bmp[i + 2] !== goc[i + 2]) doi++
      }
    }
    kq.b4 = { rong: a.rong, cao: a.cao, kieu: a.kieu, trong, ngoai: { tong, den, doi } }
  } else kq.b4 = { loi: 'khong nhan duoc pin:save-edit' }
  pin.destroy()

  kq.loiTrang = loiTrang
  fs.writeFileSync(path.join(RA, 'ket-qua-' + TI_LE + (HONG ? '-hong' : '') + '.json'), JSON.stringify(kq, null, 1))
  console.log('KQ=' + JSON.stringify(kq))
  app.exit(0)
})
