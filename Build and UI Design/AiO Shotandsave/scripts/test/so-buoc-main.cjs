'use strict'
/* Phan Electron cua bai do "danh so buoc" (goi tu do-so-buoc.mjs). KHONG chay main.js cua app, KHONG hien cua so nao
   len man: 2 cua so offscreen nap THAT src/overlay/index.html + src/pin/index.html voi preload that. Chuot / phim la
   su kien gia lap trong trang (cac trinh nghe cua app khong xet isTrusted).
   Chay: electron scripts/test/so-buoc-main.cjs <thu-muc-ra> <ti-le-man> */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.resolve(process.argv[2] || path.join(ROOT, '.selftest', 'so-buoc'))
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] === 'hong' // DOI CHUNG: lam hong 2 ham trong trang, bai cham phai bat duoc
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

/* Ham dung chung trong trang: bam chuot, bam phim, doc diem anh tren canvas ve (toa do DIP cuc bo cua canvas). */
const TRO_GIUP = `
window.__t = {
  chuot: (kieu, x, y, dich) => (dich || window).dispatchEvent(new MouseEvent(kieu, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true })),
  phim: (key, code, them) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, code, bubbles: true, cancelable: true }, them || {}))),
  diem: (lx, ly) => { const d = veCtx.getImageData(Math.round(lx * DPR), Math.round(ly * DPR), 1, 1).data; return [d[0], d[1], d[2], d[3]] },
  /* Chu so trong huy hieu: quet hinh tron ban kinh 9 DIP quanh tam (ne vien o 13), gom diem "trang" hoac "den". */
  chuSo: (cx, cy) => {
    const R = Math.round(9 * DPR), x0 = Math.round(cx * DPR), y0 = Math.round(cy * DPR)
    const d = veCtx.getImageData(x0 - R, y0 - R, R * 2 + 1, R * 2 + 1).data, W = R * 2 + 1
    let trang = 0, den = 0, x1 = 1e9, x2 = -1e9, y1 = 1e9, y2 = -1e9; const mat = []
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (Math.hypot(x - R, y - R) > R) { mat.push(0); continue }
      const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2]
      const laTrang = r > 215 && g > 215 && b > 215, laDen = r < 70 && g < 70 && b < 70 && d[i + 3] > 200
      if (laTrang) trang++; if (laDen) den++
      mat.push(laTrang || laDen ? 1 : 0)
      if (laTrang || laDen) { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); y2 = Math.max(y2, y) }
    }
    return { trang, den, lechX: ((x1 + x2 + 1) / 2 - R) / DPR, lechY: ((y1 + y2 + 1) / 2 - R) / DPR, mat: mat.join('') }
  },
  so: () => shapes.filter((s) => s.type === 'so').map((s) => ({ n: s.n, x: s.x, y: s.y, color: s.color })),
}
true`

function docAnh(dataUrl) {
  const im = nativeImage.createFromDataURL(dataUrl), kt = im.getSize(), bmp = im.toBitmap()
  const diem = (x, y) => { const i = (Math.round(y) * kt.width + Math.round(x)) * 4; return [bmp[i + 2], bmp[i + 1], bmp[i], bmp[i + 3]] } // BGRA -> RGBA
  return { rong: kt.width, cao: kt.height, diem }
}

app.whenReady().then(async () => {
  const kq = { tiLe: TI_LE }
  const loiTrang = []
  const js = (w, s) => w.webContents.executeJavaScript(s, true)
  const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') loiTrang.push(ten + ': ' + (msg || e.message)) })

  /* ════ A. MAN CHUP (overlay) ════ */
  const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  nghe(ov, 'overlay')
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
  ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
  await cho(300)
  await js(ov, TRO_GIUP)
  if (HONG) await js(ov, 'danhSoLai = function () {}; kepTamSo = function (lx, ly) { return { x: lx, y: ly } }; true')
  const o = (s) => js(ov, s)
  kq.dpr = await o('DPR')
  kq.vaoVe = await o('({ mode, tool, rong: veEl.width, cao: veEl.height })')

  // A1 phim 6
  await o('__t.phim("6", "Digit6")')
  kq.a1 = await o('({ tool, chon: [...toolbarEl.querySelectorAll(".cong-cu.chon")].map((b) => b.dataset.tool), nhan: toolbarEl.querySelector(\'[data-tool="so"]\').title })')
  // A2 bam 3 diem (toa do man = vung 100,100 + cuc bo)
  const P = [[80, 60], [300, 200], [500, 330]]
  for (const [x, y] of P) await o(`__t.chuot('mousedown', ${100 + x}, ${100 + y}, veEl); __t.chuot('mouseup', ${100 + x}, ${100 + y})`)
  kq.a2 = await o('__t.so()')
  // A3 diem anh: trong vong tron la mau cam, ngoai xa la trong suot
  kq.a3 = await o(`(${JSON.stringify(P)}).map(([x, y]) => ({ trong: __t.diem(x - 10, y), ngoai: __t.diem(x + 25, y - 25) }))`)
  // A4 chu so tung huy hieu
  kq.a4 = await o(`(${JSON.stringify(P)}).map(([x, y]) => __t.chuSo(x, y))`)
  // A5 hoan tac roi bam lai
  await o('__t.phim("z", "KeyZ", { ctrlKey: true })')
  kq.a5a = await o('__t.so()')
  await o(`__t.chuot('mousedown', 600, 430, veEl); __t.chuot('mouseup', 600, 430)`)
  kq.a5b = await o('__t.so()')
  // A6 ve mot khung xen giua roi danh so tiep: khung khong an mat so
  await o(`__t.phim("1", "Digit1"); __t.chuot('mousedown', 250, 320, veEl); __t.chuot('mousemove', 330, 380); __t.chuot('mouseup', 330, 380)`)
  await o(`__t.phim("6", "Digit6"); __t.chuot('mousedown', 520, 160, veEl); __t.chuot('mouseup', 520, 160)`)
  kq.a6 = { so: await o('__t.so()'), loai: await o('shapes.map((s) => s.type)') }
  // A7 cong cu V: keo huy hieu so 2 di (+40, +30), so van la 2
  await o(`__t.phim("v", "KeyV"); __t.chuot('mousedown', 400, 300, veEl); __t.chuot('mousemove', 440, 330); __t.chuot('mouseup', 440, 330)`)
  kq.a7 = { so: await o('__t.so()'), chon: await o('selectedShape && selectedShape.type') }
  // A8 xoa huy hieu dang chon -> cac so con lai don lai lien nhau
  await o('__t.phim("Delete", "Delete")')
  kq.a8 = await o('__t.so()')
  // A9 mau vang -> chu so den
  await o(`__t.phim("6", "Digit6"); toolbarEl.querySelector('.mau[data-color="#ffcc00"]').click(); __t.chuot('mousedown', 300, 420, veEl); __t.chuot('mouseup', 300, 420)`)
  kq.a9 = { so: (await o('__t.so()')).pop(), chu: await o('__t.chuSo(200, 320)') }
  // A10 bam sat mep: tam bi day vao trong, vong tron nam tron trong vung
  await o(`toolbarEl.querySelector('.mau[data-color="#f86820"]').click(); __t.chuot('mousedown', 102, 103, veEl); __t.chuot('mouseup', 102, 103); __t.chuot('mousedown', 699, 499, veEl); __t.chuot('mouseup', 699, 499)`)
  kq.a10 = { so: (await o('__t.so()')).slice(-2), mepTrai: await o('__t.diem(4, 16)'), mepPhai: await o('__t.diem(596, 384)') }
  // A10b bam va GIU roi keo: huy hieu di theo chuot, tha ra moi chot (van chi 1 huy hieu)
  await o(`__t.chuot('mousedown', 350, 180, veEl); __t.chuot('mousemove', 380, 220)`)
  const giua = await o('__t.so()')
  await o(`__t.chuot('mouseup', 380, 220); __t.chuot('mousemove', 500, 400)`)
  kq.a10b = { truoc: giua.length, sau: (await o('__t.so()')).length, cuoi: (await o('__t.so()')).pop() }
  // A11 keo tay nam goc tren-trai cua khung (-30, -20): huy hieu phai DUNG YEN tren man
  const truoc = await o('({ r: { ...curRect }, s: __t.so()[0] })')
  await o(`{ const h = document.querySelector('.handle-nw'); __t.chuot('mousedown', curRect.x, curRect.y, h); __t.chuot('mousemove', curRect.x - 30, curRect.y - 20); __t.chuot('mouseup', curRect.x - 30, curRect.y - 20) }`)
  const sau = await o('({ r: { ...curRect }, s: __t.so()[0] })')
  kq.a11 = { truoc, sau }
  // A12 bam Xong -> anh ghep gui ve main
  const anhCanvas = await o('veEl.toDataURL("image/png")')
  fs.writeFileSync(path.join(RA, 'overlay-' + TI_LE + '.png'), nativeImage.createFromDataURL(anhCanvas).toPNG())
  const s1 = sau.s
  await o('document.getElementById("xong").click()')
  await cho(500)
  if (xacNhan && xacNhan.dataUrl) {
    const a = docAnh(xacNhan.dataUrl)
    kq.a12 = { rong: a.rong, cao: a.cao, canRong: Math.round(sau.r.w * kq.dpr), canCao: Math.round(sau.r.h * kq.dpr),
      trong: a.diem((s1.x - 10) * kq.dpr, s1.y * kq.dpr), ngoai: a.diem((s1.x + 25) * kq.dpr, (s1.y - 25) * kq.dpr) }
  } else kq.a12 = { loi: 'khong nhan duoc overlay:confirm co dataUrl', nhan: xacNhan && Object.keys(xacNhan) }
  ov.destroy()

  /* ════ B. ANH GHIM (pin) ════ */
  const NW = 900, NH = 600, DW = 600, DH = 400 // anh that 900x600 hien 600x400 -> he so xuat 1,5
  const bmp = Buffer.alloc(NW * NH * 4)
  for (let i = 0; i < bmp.length; i += 4) { bmp[i] = 64; bmp[i + 1] = 64; bmp[i + 2] = 64; bmp[i + 3] = 255 }
  const nen = nativeImage.createFromBitmap(bmp, { width: NW, height: NH }).toDataURL()
  const pin = new BrowserWindow({ x: 0, y: 0, width: DW + 24, height: DH + 24, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false } })
  nghe(pin, 'pin')
  await pin.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
  pin.webContents.send('pin:data', { dataUrl: nen, pad: 12, w: DW, h: DH, lamMoKieu: 'mosaic' })
  await cho(400)
  await js(pin, TRO_GIUP)
  const p = (s) => js(pin, s)
  // B1 phim 6 khi dang xem -> vao che do ve voi cong cu so
  await p('__t.phim("6", "Digit6")')
  kq.b1 = await p('({ mode, tool, chon: [...toolbarEl.querySelectorAll(".cong-cu.chon")].map((b) => b.dataset.tool), nut: !!toolbarEl.querySelector(\'[data-tool="so"]\') })')
  // B2 bam 2 diem + 1 lan bam-giu-keo
  const bam = (lx, ly) => p(`{ const r = veEl.getBoundingClientRect(); __t.chuot('mousedown', r.left + ${lx}, r.top + ${ly}, veEl); __t.chuot('mouseup', r.left + ${lx}, r.top + ${ly}) }`)
  await bam(100, 80); await bam(400, 300)
  await p(`{ const r = veEl.getBoundingClientRect(); __t.chuot('mousedown', r.left + 200, r.top + 200, veEl); __t.chuot('mousemove', r.left + 240, r.top + 260); __t.chuot('mouseup', r.left + 240, r.top + 260) }`)
  kq.b2 = await p('__t.so()')
  // Toa do THAT cua tung huy hieu (o man 125% su kien chuot la so nguyen con mep canvas le -> lech toi 1 DIP)
  kq.b2chu = await p('__t.so().map((s) => __t.chuSo(s.x, s.y))')
  // B3 Enter = luu: anh that 900x600, huy hieu phong 1,5 lan dung cho
  await p('__t.phim("Enter", "Enter")')
  await cho(400)
  if (luuGhim) {
    const a = docAnh(luuGhim), k = NW / DW, h1 = kq.b2[0], h2 = kq.b2[1]
    fs.writeFileSync(path.join(RA, 'pin-' + TI_LE + '.png'), nativeImage.createFromDataURL(luuGhim).toPNG())
    kq.b3 = { rong: a.rong, cao: a.cao,
      trong: a.diem((h1.x - 10) * k, h1.y * k), sat: a.diem((h1.x + 11) * k, h1.y * k), ngoai: a.diem((h1.x + 25) * k, (h1.y - 25) * k),
      trong2: a.diem((h2.x - 10) * k, h2.y * k), khongBam: a.diem(500 * k, 100 * k) }
  } else kq.b3 = { loi: 'khong nhan duoc pin:save-edit' }
  // B4 vao ve lai: dem lai tu 1 (so da luu la diem anh)
  kq.b4truoc = await p('mode')
  await p('__t.phim("6", "Digit6")'); await bam(300, 100)
  kq.b4 = await p('__t.so()')
  pin.destroy()

  kq.loiTrang = loiTrang
  fs.writeFileSync(path.join(RA, 'ket-qua-' + TI_LE + (HONG ? '-hong' : '') + '.json'), JSON.stringify(kq, null, 1))
  console.log('KQ=' + JSON.stringify(kq))
  app.exit(0)
})
