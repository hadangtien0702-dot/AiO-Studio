'use strict'
/* Phan Electron cua bai do BUT VE TAY + BUT DA QUANG (06/10, goi tu do-but-ve.mjs). Khuon = so-buoc-main.cjs:
   KHONG chay main.js cua app, KHONG hien cua so nao: 2 cua so offscreen nap THAT src/overlay/index.html +
   src/pin/index.html voi preload that; chuot / phim la su kien gia lap trong trang.
   Chay: electron scripts/test/but-ve-main.cjs <thu-muc-ra> <ti-le-man> [hong] */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.resolve(process.argv[2] || path.join(ROOT, '.selftest', 'but-ve'))
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] === 'hong' // DOI CHUNG: lam hong 2 thu trong trang, bai cham phai bat duoc
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

/* Trong trang: chuot (co the kem Shift), phim, doc diem anh tren canvas ve (toa do DIP cuc bo), ve mot net qua cac diem. */
const TRO_GIUP = `
window.__t = {
  chuot: (kieu, x, y, dich, shift) => (dich || window).dispatchEvent(new MouseEvent(kieu, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true, shiftKey: !!shift })),
  phim: (key, code, them) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, code, bubbles: true, cancelable: true }, them || {}))),
  diem: (lx, ly) => { const d = veCtx.getImageData(Math.round(lx * DPR), Math.round(ly * DPR), 1, 1).data; return [d[0], d[1], d[2], d[3]] },
  /* Ve mot net: ds = [[x, y], ...] toa do CUC BO cua canvas ve; goc = toa do man cua goc canvas */
  net: (ds, shift) => { const r = veEl.getBoundingClientRect()
    __t.chuot('mousedown', r.left + ds[0][0], r.top + ds[0][1], veEl, shift)
    for (let i = 1; i < ds.length; i++) __t.chuot('mousemove', r.left + ds[i][0], r.top + ds[i][1], null, shift)
    const c = ds[ds.length - 1]; __t.chuot('mouseup', r.left + c[0], r.top + c[1], null, shift) },
  ds: () => shapes.map((s) => ({ type: s.type, n: s.pts ? s.pts.length / 2 : 0, pts: s.pts ? s.pts.slice() : null, color: s.color })),
  thanh: () => { const b = toolbarEl.getBoundingClientRect(); const nut = [...toolbarEl.querySelectorAll('.cong-cu[data-tool]')].map((x) => x.dataset.tool)
    return { trai: Math.round(b.left), phai: Math.round(b.right), rong: Math.round(b.width), cuaSo: innerWidth, nut } },
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
  const LAM_HONG = 'themDiemNet = function () {}; NET.daquang.mo = 1; true' // net khong dai ra + da quang thanh dac

  /* ════ A. MAN CHUP (overlay) ════ vung chon 600x400 tai (100,100) */
  const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  nghe(ov, 'overlay')
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
  ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
  await cho(300)
  await js(ov, TRO_GIUP)
  if (HONG) await js(ov, LAM_HONG)
  const o = (s) => js(ov, s)
  kq.dpr = await o('DPR')

  // A1 phim 7 / 8 chon dung cong cu, nut sang, co chu goi y
  await o('__t.phim("7", "Digit7")')
  kq.a1 = { but: await o('({ tool, chon: [...toolbarEl.querySelectorAll(".cong-cu.chon")].map((b) => b.dataset.tool), goiY: toolbarEl.querySelector(\'[data-tool="but"]\').title })') }
  await o('__t.phim("8", "Digit8")')
  kq.a1.daquang = await o('({ tool, chon: [...toolbarEl.querySelectorAll(".cong-cu.chon")].map((b) => b.dataset.tool), goiY: toolbarEl.querySelector(\'[data-tool="daquang"]\').title })')
  kq.thanhOv = await o('__t.thanh()')

  // A2 BUT (cam): net chu L (50,50) -> (250,50) -> (250,150)
  await o('__t.phim("7", "Digit7"); __t.net([[50,50],[100,50],[150,50],[200,50],[250,50],[250,100],[250,150]])')
  kq.a2 = { ds: await o('__t.ds()'), giua: await o('__t.diem(150, 50)'), lech5: await o('__t.diem(150, 56)'), doc: await o('__t.diem(250, 110)'), xa: await o('__t.diem(150, 150)') }
  // A3 DA QUANG (vang): net ngang (50,200) -> (350,200); roi mot net di RA roi QUAY LAI de len chinh no
  await o(`__t.phim("8", "Digit8"); toolbarEl.querySelector('.mau[data-color="#ffcc00"]').click(); __t.net([[50,200],[150,200],[250,200],[350,200]])`)
  await o('__t.net([[50,260],[150,260],[300,260],[200,260],[100,260]])')
  kq.a3 = { giua: await o('__t.diem(200, 200)'), mep6: await o('__t.diem(200, 206)'), ngoai11: await o('__t.diem(200, 211)'), chong: await o('__t.diem(200, 260)'), mot: await o('__t.diem(250, 260)') } // net lam tron goc nen chi vuon toi ~270, khong toi 300
  // A4 giu SHIFT: di ngoan ngoeo van ra duong THANG dau - cuoi
  await o(`toolbarEl.querySelector('.mau[data-color="#f86820"]').click(); __t.phim("7", "Digit7"); __t.net([[400,300],[430,340],[460,290],[500,300]], true)`)
  kq.a4 = { net: (await o('__t.ds()')).pop(), tren: await o('__t.diem(450, 300)'), choNgoan: await o('__t.diem(430, 340)') }
  // A5 bam roi tha ngay = mot cham; rung 1 px khong them diem
  await o('__t.net([[520,60]])')
  await o('__t.net([[540,100],[541,100],[541,101],[540,101]])')
  kq.a5 = { cham: (await o('__t.ds()')).slice(-2), diem: await o('__t.diem(520, 60)') }
  // A6 ve tran ra ngoai vung: diem bi kep trong [0,w] x [0,h]
  await o('__t.net([[560,380],[700,380],[700,500]])')
  kq.a6 = (await o('__t.ds()')).pop()
  // A7 Ctrl+Z bo net cuoi
  const truocZ = (await o('__t.ds()')).length
  await o('__t.phim("z", "KeyZ", { ctrlKey: true })')
  kq.a7 = { truoc: truocZ, sau: (await o('__t.ds()')).length }
  // A8 cong cu V: bam vao net chu L, keo (+40, +30); phim mui ten phai +1; Delete
  const netL = (await o('__t.ds()'))[0]
  await o(`__t.phim("v", "KeyV"); { const r = veEl.getBoundingClientRect(); __t.chuot('mousedown', r.left + 150, r.top + 51, veEl); __t.chuot('mousemove', r.left + 190, r.top + 81); __t.chuot('mouseup', r.left + 190, r.top + 81) }`)
  const sauKeo = (await o('__t.ds()'))[0]
  await o('__t.phim("ArrowRight", "ArrowRight")')
  const sauPhim = (await o('__t.ds()'))[0]
  kq.a8 = { chon: await o('selectedShape && selectedShape.type'), truoc: netL.pts, sauKeo: sauKeo.pts, sauPhim: sauPhim.pts, hop: await o('selectedShape ? layHopBaoShape(selectedShape) : null') } // ban hong: khong chon trung net -> null
  // A9 keo tay nam goc tren-trai cua khung (-30, -20): net phai DUNG YEN tren man (toa do cuc bo +30, +20)
  const t9 = await o('({ r: { ...curRect }, p: shapes[0].pts.slice(0, 2), dq: shapes[1].pts.slice(0, 2) })')
  await o(`{ const h = document.querySelector('.handle-nw'); __t.chuot('mousedown', curRect.x, curRect.y, h); __t.chuot('mousemove', curRect.x - 30, curRect.y - 20); __t.chuot('mouseup', curRect.x - 30, curRect.y - 20) }`)
  kq.a9 = { truoc: t9, sau: await o('({ r: { ...curRect }, p: shapes[0].pts.slice(0, 2), dq: shapes[1].pts.slice(0, 2) })') }
  // A10 cong cu so (phim 6) van chay canh net ve
  await o(`__t.phim("6", "Digit6"); { const r = veEl.getBoundingClientRect(); __t.chuot('mousedown', r.left + 80, r.top + 380, veEl); __t.chuot('mouseup', r.left + 80, r.top + 380) }`)
  kq.a10 = (await o('__t.ds()')).map((s) => s.type)
  // A11 Xong -> anh ghep gui ve main: net but + da quang nam dung cho
  const cuoi = await o('({ r: { ...curRect }, but: shapes[0].pts.slice(), dq: shapes[1].pts.slice() })')
  fs.writeFileSync(path.join(RA, 'overlay-' + TI_LE + '.png'), nativeImage.createFromDataURL(await o('veEl.toDataURL("image/png")')).toPNG())
  await o('document.getElementById("xong").click()')
  await cho(500)
  if (xacNhan && xacNhan.dataUrl) {
    const a = docAnh(xacNhan.dataUrl), d = kq.dpr
    kq.a11 = { rong: a.rong, cao: a.cao, canRong: Math.round(cuoi.r.w * d), canCao: Math.round(cuoi.r.h * d),
      but: a.diem((cuoi.but[0] + 60) * d, cuoi.but[1] * d), butLech: a.diem((cuoi.but[0] + 60) * d, (cuoi.but[1] + 7) * d),
      dq: a.diem((cuoi.dq[0] + 100) * d, cuoi.dq[1] * d) }
  } else kq.a11 = { loi: 'khong nhan duoc overlay:confirm co dataUrl' }
  ov.destroy()

  /* ════ B. ANH GHIM (pin) ════ anh that 900x600 nen xam 64, hien 600x400 -> he so xuat 1,5 */
  const NW = 900, NH = 600, DW = 600, DH = 400
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
  if (HONG) await js(pin, LAM_HONG)
  const p = (s) => js(pin, s)
  // B1 phim 7 khi dang xem -> vao che do ve voi cong cu but
  await p('__t.phim("7", "Digit7")')
  kq.b1 = await p('({ mode, tool, chon: [...toolbarEl.querySelectorAll(".cong-cu.chon")].map((b) => b.dataset.tool) })')
  kq.thanhPin = await p('__t.thanh()')
  // B2 net but ngang (100,100) -> (300,100); da quang vang (100,250) -> (400,250); V keo net but (+20, +10)
  await p('__t.net([[100,100],[200,100],[300,100]])')
  await p(`__t.phim("8", "Digit8"); toolbarEl.querySelector('.mau[data-color="#ffcc00"]').click(); __t.net([[100,250],[250,250],[400,250]])`)
  await p(`__t.phim("v", "KeyV"); { const r = veEl.getBoundingClientRect(); __t.chuot('mousedown', r.left + 200, r.top + 100, veEl); __t.chuot('mousemove', r.left + 220, r.top + 110); __t.chuot('mouseup', r.left + 220, r.top + 110) }`)
  kq.b2 = await p('__t.ds()')
  // B3 Enter = luu: anh that 900x600, net phong 1,5 lan dung cho; da quang tron voi nen xam
  await p('__t.phim("Enter", "Enter")')
  await cho(400)
  if (luuGhim) {
    const a = docAnh(luuGhim), k = NW / DW, b = kq.b2[0].pts, q = kq.b2[1].pts
    fs.writeFileSync(path.join(RA, 'pin-' + TI_LE + '.png'), nativeImage.createFromDataURL(luuGhim).toPNG())
    kq.b3 = { rong: a.rong, cao: a.cao, but: a.diem((b[0] + 100) * k, b[1] * k), butLech: a.diem((b[0] + 100) * k, (b[1] + 6) * k),
      dq: a.diem((q[0] + 150) * k, q[1] * k), dqMep: a.diem((q[0] + 150) * k, (q[1] + 6) * k), dqNgoai: a.diem((q[0] + 150) * k, (q[1] + 12) * k), nen: a.diem(500 * k, 50 * k) }
  } else kq.b3 = { loi: 'khong nhan duoc pin:save-edit' }
  pin.destroy()

  /* ════ C. ANH GHIM NHO 320 px: thanh cong cu co vuot khoi cua so khong (them 2 nut = +72 px) ════ */
  const nho = new BrowserWindow({ x: 0, y: 0, width: 320 + 24, height: 200 + 24, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false } })
  await nho.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
  nho.webContents.send('pin:data', { dataUrl: nen, pad: 12, w: 320, h: 200, lamMoKieu: 'mosaic' })
  await cho(400)
  await js(nho, TRO_GIUP)
  await js(nho, '__t.phim("7", "Digit7")')
  await cho(150)
  kq.thanhPinNho = await js(nho, '__t.thanh()')
  nho.destroy()

  kq.loiTrang = loiTrang
  fs.writeFileSync(path.join(RA, 'ket-qua-' + TI_LE + (HONG ? '-hong' : '') + '.json'), JSON.stringify(kq, null, 1))
  console.log('KQ=' + JSON.stringify(kq))
  app.exit(0)
})
