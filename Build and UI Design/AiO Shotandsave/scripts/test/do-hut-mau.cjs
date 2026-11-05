'use strict'
/* =========================================================================
   Bai do HUT MAU + THUOC DO tren man chup (05/11) — chay bang: npm run test:hutmau
   CHAY AN: khong bat cua so nao, khong cuop chuot, KHONG cham clipboard that (lenh chep di qua IPC 'overlay:copy-text'
   va bai tu hung). 1 cua so offscreen nap THAT src/overlay/index.html voi preload that; chuot / phim la su kien gia lap.
   Dung giao thuc aioshot:// GIA (dang ky trong bai nay) phuc vu nhu main.js: anh dong bang = JPEG chat luong thap (de
   lo ra neu code doc mau tu JPEG), cat vung aioshot://raw = PNG nguyen ven.
   Anh thu TAO SAN, biet truoc tung diem anh: 5 dai mau (rong 240/152/88/72/48 DIP trong vung chon 600 x 300), nen xam
   ngoai vung, MOT diem anh don mau xanh la sang giua dai 1. Dap an mau lay tu BO DEM diem anh cua chinh bai nay (khong
   tu code app). Chay o ti le man 100 / 125 / 150 %.
   DOI CHUNG: [jpeg] ep doc mau tu anh JPEG -> mau tai mep dai va diem don phai SAI; [css] thuoc do dung diem CSS thay vi
   diem anh that -> so pixel phai SAI o 150 %; [mau] bang 5 mau chu dao sai -> phai bi bat.
   Cach chay: node scripts/test/do-hut-mau.cjs   (tu goi Electron)
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  const { spawnSync } = require('child_process')
  let electron
  try { electron = require('electron') } catch (e) {
    electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron') : 'electron')
  }
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'hut-mau')
  fs.mkdirSync(RA, { recursive: true })
  const chay = (tiLe, hong) => {
    const r = spawnSync(electron, [__filename, RA, String(tiLe), ...(hong ? [hong] : [])], { env, encoding: 'utf8', timeout: 150000 })
    const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
    if (!dong) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 4).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
    return JSON.parse(dong.slice(3))
  }
  let tong = 0, dat = 0
  const in_ = (k, tieuDe) => {
    console.log('\n== ' + tieuDe + ' ==')
    if (k.loi) { console.log('  TRUOT chay duoc (' + k.loi + ')'); tong++; return }
    for (const c of k.kq) { tong++; if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }
  }
  for (const tl of [1, 1.25, 1.5]) in_(chay(tl), 'Man ' + Math.round(tl * 100) + ' %')
  const doiChung = [['jpeg', 1.25, /Hut mau: (diem sat mep|diem anh don|kinh)/], ['css', 1.5, /^Thuoc do: /], ['mau', 1, /^Mau chu dao: /]]
  let doiChungDat = 0
  console.log('\n== DOI CHUNG (co y lam hong, bai do PHAI truot) ==')
  for (const [hong, tl, mau] of doiChung) {
    const k = chay(tl, hong)
    const truot = k.loi ? [] : k.kq.filter((c) => !c.ok && mau.test(c.ten))
    const ok = truot.length > 0
    if (ok) doiChungDat++
    console.log((ok ? '  DAT   ' : '  TRUOT ') + 'lam hong "' + hong + '" (man ' + Math.round(tl * 100) + '%) -> bai do bat duoc ' + truot.length + ' muc' + (k.loi ? ' (loi chay: ' + k.loi + ')' : ''))
  }
  tong += doiChung.length; dat += doiChungDat
  console.log('\nTONG: ' + dat + '/' + tong + ' DAT')
  process.exit(dat === tong ? 0 : 1)
}

/* ───────────── PHAN ELECTRON ───────────── */
const { app, BrowserWindow, ipcMain, nativeImage, protocol } = require('electron')
const RA = path.resolve(process.argv[2])
const TI_LE = process.argv[3] || '1'
const S = Number(TI_LE)
const HONG = process.argv[4] || ''
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData-' + TI_LE + (HONG ? '-' + HONG : '')))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
protocol.registerSchemesAsPrivileged([{ scheme: 'aioshot', privileges: { corsEnabled: true, supportFetchAPI: true, stream: true } }])
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
process.stdout.on('error', () => {}) // dau ra bi dong (EPIPE) khong duoc bat hop thoai loi Electron len man
process.stderr.on('error', () => {})
const chet = (e) => { try { console.log('LOI=' + (e && e.stack || e)) } catch (x) {} app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 120 giay'), 120000)

const copied = [], nhatKy = [], xacNhan = []
let soLanHuy = 0
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('overlay:cancel', () => { soLanHuy++ })
ipcMain.on('overlay:copy-text', (_e, s) => { copied.push(s) })
ipcMain.on('overlay:log', (_e, m) => { nhatKy.push(String(m)) })
ipcMain.on('overlay:confirm', (_e, p) => { xacNhan.push(p) })

/* ── Anh thu: 1200 x 800 DIP -> (1200 x ti le) x (800 x ti le) diem anh ── */
const W = Math.round(1200 * S), H = Math.round(800 * S)
const buf = Buffer.alloc(W * H * 4)
const dev = (css) => Math.floor(css * S + 1e-6)
const dat = (x, y, c) => { const i = (y * W + x) * 4; buf[i] = c[2]; buf[i + 1] = c[1]; buf[i + 2] = c[0]; buf[i + 3] = 255 }
const doc = (x, y) => { const i = (y * W + x) * 4; return [buf[i + 2], buf[i + 1], buf[i]] }
const hex = (c) => '#' + c.map((v) => v.toString(16).toUpperCase().padStart(2, '0')).join('')
const to = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) dat(x, y, c) }
const NEN = [120, 130, 140]
const DAI = [[230, 57, 70], [46, 196, 110], [30, 100, 230], [250, 200, 20], [140, 60, 180]] // #E63946 #2EC46E #1E64E6 #FAC814 #8C3CB4
const DAI_HEX = DAI.map(hex)
const RONG_DAI = [240, 152, 88, 72, 48] // DIP, tong 600 = be rong vung chon
const DIEM_DON = [7, 253, 9]
const VUNG = { x: 100, y: 100, w: 600, h: 300 } // DIP
const BIEN = [100] // moc dai (DIP)
{
  to(0, 0, W, H, NEN)
  let x = VUNG.x
  for (let i = 0; i < 5; i++) { BIEN.push(x + RONG_DAI[i]); to(Math.round(x * S), Math.round(VUNG.y * S), Math.round((x + RONG_DAI[i]) * S), Math.round((VUNG.y + VUNG.h) * S), DAI[i]); x += RONG_DAI[i] }
  dat(dev(130), dev(150), DIEM_DON)
}
const anhGoc = nativeImage.createFromBitmap(buf, { width: W, height: H })
const jpegDongBang = anhGoc.toJPEG(55)
/* Dap an "mau chu dao" tu bo dem diem anh: tat ca diem trong vung (DIP) -> top 5 theo so diem. */
function demMau(v) {
  const m = new Map()
  for (let y = Math.round(v.y * S); y < Math.round((v.y + v.h) * S); y++) for (let x = Math.round(v.x * S); x < Math.round((v.x + v.w) * S); x++) { const h = hex(doc(x, y)); m.set(h, (m.get(h) || 0) + 1) }
  const tong = [...m.values()].reduce((a, b) => a + b, 0)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([h, n]) => ({ hex: h, pct: n / tong }))
}

app.whenReady().then(async () => {
  protocol.handle('aioshot', (req) => {
    const hd = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
    if (/^aioshot:\/\/frozen\/7\/d1\.jpg$/.test(req.url)) return new Response(jpegDongBang, { headers: Object.assign({ 'Content-Type': 'image/jpeg' }, hd) })
    const m = /^aioshot:\/\/raw\/(\d+\/[^/]+)\/(\d+)_(\d+)_(\d+)_(\d+)\.png$/.exec(req.url)
    if (m && m[1] === '7/d1') {
      const buf2 = anhGoc.crop({ x: +m[2], y: +m[3], width: Math.min(+m[4], W - +m[2]), height: Math.min(+m[5], H - +m[3]) }).toPNG()
      return new Response(buf2, { headers: Object.assign({ 'Content-Type': 'image/png' }, hd) })
    }
    return new Response('', { status: 404 })
  })
  const kq = [], loiTrang = []
  const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
  const js = (w, s) => w.webContents.executeJavaScript(s, true)
  const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: S }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  ov.webContents.on('console-message', (e, level, msg) => { if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2/.test(msg || e.message || '')) loiTrang.push(msg || e.message) })
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
  ov.webContents.send('overlay:frozen', { layers: [{ x: 0, y: 0, w: 1200, h: 800, sf: S, key: '7/d1', url: 'aioshot://frozen/7/d1.jpg', px: 0, py: 0, pw: W, ph: H }] })
  ov.webContents.send('overlay:annotate', VUNG)
  await cho(900)
  await js(ov, `window.__t = {
    chuot: (kieu, x, y, dich, them) => (dich || window).dispatchEvent(new MouseEvent(kieu, Object.assign({ clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true }, them || {}))),
    phim: (key, code, them) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, code, bubbles: true, cancelable: true }, them || {}))),
    di: (x, y, them) => __t.chuot('mousemove', x, y, veEl, them),
    bam: (x, y) => { __t.chuot('mousedown', x, y, veEl); __t.chuot('mouseup', x, y, veEl) },
    keo: (a, b, them) => { __t.chuot('mousedown', a[0], a[1], veEl); __t.chuot('mousemove', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, veEl, them); __t.chuot('mousemove', b[0], b[1], veEl, them); __t.chuot('mouseup', b[0], b[1], veEl, them) },
    diemKinh: (x, y) => { const d = document.getElementById('hut-cv').getContext('2d').getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]] },
  }; true`)
  if (HONG === 'jpeg') await js(ov, 'napAnh = function () { return Promise.reject(new Error("ep jpeg")) }; true')
  if (HONG === 'css') await js(ov, 'thuocDiem = function (e) { return { x: Math.round(e.clientX), y: Math.round(e.clientY) } }; true')
  if (HONG === 'mau') await js(ov, 'mauChuDao = function (n) { return [{ hex: "#000000", pct: 1 }] }; true')
  const o = (s) => js(ov, s)
  const cho_ = async (dk, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await o(dk)) return true; await cho(80) } return false }
  const hexTai = (cx, cy) => hex(doc(dev(cx), dev(cy)))

  /* ── 0. Nen ── */
  const k0 = await o('({ dpr: DPR, mode, rong: window.innerWidth, anh: !!(frozenImg && frozenImg.naturalWidth), nw: frozenImg && frozenImg.naturalWidth })')
  kiem('Man gia lap dung ti le ' + TI_LE + ', anh dong bang nap xong', k0.dpr === S && k0.mode === 'annotate' && k0.anh && k0.nw === W, 'DPR ' + k0.dpr + ', anh ' + k0.nw + ' / ' + W)
  const jpegLech = await o(`(() => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); let t = 0
    for (const [x, y] of [[${dev(130)}, ${dev(150)}], [${Math.round(340 * S)}, ${Math.round(200 * S)}]]) { g.drawImage(frozenImg, x, y, 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; t = Math.max(t, Math.abs(d[0] - 7) , 0) ; window.__jpg = (window.__jpg || []).concat([[d[0], d[1], d[2]]]) }
    return window.__jpg })()`)
  const lechMax = Math.max(Math.abs(jpegLech[0][0] - DIEM_DON[0]), Math.abs(jpegLech[0][1] - DIEM_DON[1]), Math.abs(jpegLech[0][2] - DIEM_DON[2]), Math.abs(jpegLech[1][0] - DAI[1][0]), Math.abs(jpegLech[1][1] - DAI[1][1]), Math.abs(jpegLech[1][2] - DAI[1][2]))
  kiem('Tien de: anh dong bang (JPEG) KHAC anh goc o diem don / mep dai (bai do co kha nang phan biet)', lechMax >= 6, 'lech lon nhat ' + lechMax + '/255')

  /* ── 1. Nut gop + phim ── */
  {
    const a = await o(`({ co: !!document.getElementById('do-chinh'), moTruoc: !document.getElementById('do-menu').hidden, so: document.getElementById('do-chinh').dataset.so, nut: document.getElementById('do-chinh').dataset.tool })`)
    kiem('Nut gop tren thanh: co 1 nut, menu dong, mac dinh Hut mau (phim I)', a.co && !a.moTruoc && a.so === 'I' && a.nut === 'hut', JSON.stringify(a))
    await o(`document.getElementById('do-nhom').dispatchEvent(new MouseEvent('mouseenter')); true`)
    const b = await o(`({ mo: !document.getElementById('do-menu').hidden, muc: [...document.querySelectorAll('#do-menu .muc-xo')].map((m) => m.dataset.tool + ':' + m.querySelector('.so').textContent) })`)
    kiem('Re chuot vao nut: xo menu 2 muc (Hut mau I, Thuoc do M)', b.mo && b.muc.join() === 'hut:I,thuoc:M', b.muc.join())
    await o(`__t.phim('Escape', 'Escape'); true`)
    const c = await o(`({ mo: !document.getElementById('do-menu').hidden })`)
    kiem('Esc dong menu, KHONG huy ca lan chup', !c.mo && soLanHuy === 0, 'huy ' + soLanHuy)
    await o(`document.querySelector('#do-menu [data-tool="thuoc"]').click(); true`)
    const d = await o(`({ tool, nut: document.getElementById('do-chinh').dataset.tool, so: document.getElementById('do-chinh').dataset.so, dm: document.getElementById('do-nhom').classList.contains('dm'), chon: document.getElementById('do-chinh').classList.contains('chon'), hienThuoc: getComputedStyle(document.querySelector('#do-chinh .ic-thuoc')).display, anHut: getComputedStyle(document.querySelector('#do-chinh .ic-hut')).display })`)
    kiem('Chon Thuoc do tu menu: nut doi icon + so phim M, sang den', d.tool === 'thuoc' && d.nut === 'thuoc' && d.so === 'M' && d.dm && d.chon && d.hienThuoc !== 'none' && d.anHut === 'none', JSON.stringify(d))
    await o(`__t.phim('i', 'KeyI'); true`)
    const e1 = await o(`({ tool, so: document.getElementById('do-chinh').dataset.so })`)
    await o(`__t.phim('m', 'KeyM'); true`)
    const e2 = await o(`({ tool })`)
    await o(`__t.phim('1', 'Digit1'); true`)
    const e3 = await o(`({ tool, chon: document.getElementById('do-chinh').classList.contains('chon') })`)
    kiem('Phim I -> Hut mau, M -> Thuoc do, 1 -> ve khung (phim cu van dung, nut gop tat den)', e1.tool === 'hut' && e1.so === 'I' && e2.tool === 'thuoc' && e3.tool === 'rect' && !e3.chon, JSON.stringify([e1.tool, e2.tool, e3.tool]))
    const tb = await o(`(() => { const r = toolbarEl.getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth } })()`)
    kiem('Thanh cong cu khong tran khoi man', tb.l >= 0 && tb.r <= tb.w, Math.round(tb.l) + '..' + Math.round(tb.r) + ' / ' + tb.w)
  }

  /* ── 2. Hut mau ── */
  await o(`__t.phim('i', 'KeyI'); true`)
  const sanSang = await cho_('!!hutMauDao && hutDsEl.querySelectorAll(".hang").length > 0 && !!hutNguon')
  const nguon = await o('hutNguon && hutNguon.nguon')
  kiem('Hut mau: nap xong pixel vung chon, nguon la ' + (HONG === 'jpeg' ? 'JPEG (do co y ep)' : 'PNG goc (raw)'), sanSang && nguon === (HONG === 'jpeg' ? 'jpeg' : 'raw-png'), 'nguon ' + nguon)
  const diemThu = [
    ['giua dai 1', 200, 200], ['giua dai 2', 416, 200], ['giua dai 3', 536, 260], ['giua dai 4', 616, 300], ['giua dai 5', 676, 380],
    ['goc tren-trai vung', 100, 100], ['goc duoi-phai vung', 699, 399],
    ['sat mep dai 1 | 2, ben trai (1 diem anh)', 339, 200], ['sat mep dai 1 | 2, ben phai (1 diem anh)', 340, 200],
    ['sat mep dai 4 | 5, ben trai', 651, 250], ['sat mep dai 4 | 5, ben phai', 652, 250],
  ]
  const sai = []
  for (const [ten, cx, cy] of diemThu) {
    await o(`__t.di(${cx}, ${cy}); true`)
    const gi = await o(`({ hex: hutHexEl.textContent, hien: !hutKinhEl.hidden, giua: __t.diemKinh(60, 60) })`)
    const dung = hexTai(cx, cy)
    const giuaHex = hex(gi.giua)
    if (gi.hex !== dung || !gi.hien || giuaHex !== dung) sai.push(ten + ' (doc ' + gi.hex + ', kinh ' + giuaHex + ', dung ' + dung + ')')
  }
  const sapSat = sai.filter((x) => /sat mep/.test(x))
  kiem('Hut mau: mau dung tai 5 giua dai + 2 goc vung (ma HEX va o giua kinh)', sai.filter((x) => !/sat mep/.test(x)).length === 0, sai.filter((x) => !/sat mep/.test(x)).join(' | '))
  kiem('Hut mau: diem sat mep dai (cap 1 diem anh khac mau) dung tung diem anh', sapSat.length === 0, sapSat.join(' | '))
  await o(`__t.di(130, 150); true`)
  const don = await o(`({ hex: hutHexEl.textContent, giua: __t.diemKinh(60, 60), trai: __t.diemKinh(49, 60) })`)
  await o(`__t.di(131, 150); true`)
  const canh = await o(`({ hex: hutHexEl.textContent })`)
  kiem('Hut mau: diem anh don mau xanh la sang doc dung #07FD09, diem ke ben la mau dai (khong lem)', don.hex === hex(DIEM_DON) && hex(don.giua) === hex(DIEM_DON) && canh.hex === hexTai(131, 150) && canh.hex !== don.hex, don.hex + ' / ben ' + canh.hex)
  await o(`__t.di(340, 200); true`)
  const kinhMep = await o(`({ trai: __t.diemKinh(49, 60), giua: __t.diemKinh(60, 60) })`)
  kiem('Hut mau: kinh phong to cho thay dai 1 ben trai, dai 2 o giua tai mep', hex(kinhMep.trai) === hex(DAI[0]) && hex(kinhMep.giua) === hex(DAI[1]), hex(kinhMep.trai) + ' | ' + hex(kinhMep.giua))
  await o(`__t.di(50, 50); true`)
  const ngoai = await o('hutKinhEl.hidden')
  await o(`__t.chuot('mousemove', 300, 200, toolbarEl); true`)
  const tren = await o('hutKinhEl.hidden')
  kiem('Hut mau: ra ngoai vung chon hoac re len thanh cong cu thi kinh an', ngoai === true && tren === true)

  /* bam = chep + dong bao */
  copied.length = 0
  const chep = []
  for (const [ten, cx, cy] of [['giua dai 3', 536, 260], ['sat mep dai 2 | 3', 491, 200], ['diem don', 130, 150]]) {
    await o(`__t.di(${cx}, ${cy}); __t.bam(${cx}, ${cy}); true`)
    await cho(250)
    const bao = await o(`({ hien: !hutBaoEl.hidden, chu: hutBaoChuEl.textContent })`)
    const dung = hexTai(cx, cy)
    chep.push({ ten, dung, daChep: copied[copied.length - 1], bao })
  }
  const saiChep = chep.filter((c) => c.daChep !== c.dung || !c.bao.hien || !c.bao.chu.includes(c.dung))
  kiem('Hut mau: bam = chep dung ma vao clipboard + hien dong "Da chep #..."', saiChep.length === 0 && copied.length === 3, saiChep.length ? saiChep.map((c) => c.ten + ' chep ' + c.daChep + ' dung ' + c.dung).join(' | ') : copied.join(' '))
  const daVe = await o('shapes.length')
  kiem('Hut mau: bam khong de lai net ve nao tren anh', daVe === 0, daVe + ' net')
  await cho(2000)
  kiem('Hut mau: dong bao tu tat sau ~2 giay', (await o('hutBaoEl.hidden')) === true)

  /* ── 3. Mau chu dao ── */
  {
    const bang = await o(`({ hien: !hutBangEl.hidden, ds: [...hutDsEl.querySelectorAll('.hang')].map((h) => ({ hex: h.dataset.hex, p: h.querySelector('.p').textContent })) })`)
    const dap = demMau(VUNG).slice(0, 5)
    const hexBang = bang.ds.map((d) => d.hex), hexDap = dap.map((d) => d.hex)
    kiem('Mau chu dao: bang hien, dung 5 mau dai theo thu tu dien tich giam dan', bang.hien && hexBang.join() === DAI_HEX.join() && hexDap.join() === DAI_HEX.join(), hexBang.join(' '))
    const pctSai = bang.ds.filter((d, i) => Math.abs(parseInt(d.p, 10) - Math.round(dap[i].pct * 100)) > 1)
    kiem('Mau chu dao: ti le % khop bo dem diem anh (+-1)', pctSai.length === 0, bang.ds.map((d) => d.p).join(' ') + ' | dap an ' + dap.map((d) => Math.round(d.pct * 100) + '%').join(' '))
    kiem('Mau chu dao: khong lan mau nen xam NGOAI vung chon', !hexBang.includes(hex(NEN)), hex(NEN))
    copied.length = 0
    await o(`const h3 = hutDsEl.querySelectorAll('.hang')[2]; if (h3) h3.click(); true`)
    await cho(150)
    const b2 = await o(`({ chu: hutBaoChuEl.textContent, hien: !hutBaoEl.hidden })`)
    kiem('Mau chu dao: bam dong thu 3 chep dung ma + dong bao', copied[0] === DAI_HEX[2] && b2.hien && b2.chu.includes(DAI_HEX[2]), copied[0] + ' | ' + b2.chu)
    const vtri = await o(`(() => { const r = hutBangEl.getBoundingClientRect(), v = curRect, t = toolbarEl.getBoundingClientRect(); return { trongMan: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, deThanh: r.left < t.right && r.right > t.left && r.top < t.bottom && r.bottom > t.top, deVung: r.left < v.x + v.w && r.right > v.x && r.top < v.y + v.h && r.bottom > v.y } })()`)
    kiem('Mau chu dao: bang nam trong man, khong de len thanh cong cu / vung chon', vtri.trongMan && !vtri.deThanh && !vtri.deVung, JSON.stringify(vtri))
    /* doi vung chon -> bang tinh lai theo vung moi */
    const V2 = { x: 200, y: 150, w: 300, h: 200 }
    ov.webContents.send('overlay:annotate', V2)
    await cho(300)
    await o(`__t.phim('i', 'KeyI'); true`)
    await cho_('!!hutMauDao && hutMauDao.k === hutKhoa() && hutDsEl.querySelectorAll(".hang").length > 0')
    const bang2 = await o(`[...hutDsEl.querySelectorAll('.hang')].map((h) => h.dataset.hex)`)
    const dap2 = demMau(V2).map((d) => d.hex)
    kiem('Mau chu dao: doi vung chon thi tinh lai (vung 2 chi con dai 2, 1, 3 theo thu tu dien tich)', bang2.join() === dap2.join() && bang2.length === 3 && bang2[0] === DAI_HEX[1], bang2.join(' ') + ' | dap an ' + dap2.join(' '))
    /* tra ve vung 1 */
    ov.webContents.send('overlay:annotate', VUNG)
    await cho(300)
  }

  /* ── 4. Thuoc do ── */
  await o(`__t.phim('m', 'KeyM'); true`)
  const fmt = (v) => String(Math.round(v * 10) / 10)
  const nhan = async () => o(`({ so: thuocSoEl.textContent, kt: thuocKtEl.textContent, hien: !thuocLopEl.hidden })`)
  /* Dap an be rong dai 1 doc tu bo dem diem anh: so diem anh lien tiep mau dai 1 tren mot hang */
  let demNgang = 0; { const y = dev(110); for (let x = Math.round(VUNG.x * S); x < W && hex(doc(x, y)) === DAI_HEX[0]; x++) demNgang++ }
  let demDoc = 0; { const x = dev(110); for (let y = Math.round(VUNG.y * S); y < H && hex(doc(x, y)) === DAI_HEX[0]; y++) demDoc++ }
  await o('__t.keo([100, 105], [340, 105]); true')
  const n1 = await nhan()
  kiem('Thuoc do: keo qua dai 1 (240 DIP) hien dung so diem anh cua dai: ' + demNgang + ' px', n1.hien && n1.so === demNgang + ' px' && n1.kt === '', n1.so + ' (dap an ' + demNgang + ')')
  kiem('Thuoc do: so pixel = DIP x ti le man (khong phai so DIP)', demNgang === Math.round(240 * S) && (S === 1 || n1.so !== '240 px'), 'ti le ' + S + ' -> ' + n1.so)
  await o('__t.keo([105, 100], [105, 400]); true')
  const n2 = await nhan()
  kiem('Thuoc do: keo doc 300 DIP hien ' + Math.round(300 * S) + ' px', n2.so === Math.round(300 * S) + ' px' && n2.kt === '', n2.so)
  kiem('Thuoc do: be cao dai 1 doc tu anh (' + demDoc + ' diem) khop so do keo tu mep tren toi mep duoi vung', demDoc === Math.round(300 * S) && n2.so === demDoc + ' px', n2.so + ' / ' + demDoc)
  await o('__t.keo([100, 100], [340, 220]); true')
  const n3 = await nhan()
  const dx = Math.round(240 * S), dy = Math.round(120 * S)
  kiem('Thuoc do: keo cheo hien duong cheo + "rong x cao" theo diem anh', n3.so === fmt(Math.hypot(dx, dy)) + ' px' && n3.kt === dx + ' × ' + dy, n3.so + ' | ' + n3.kt + ' (dap an ' + fmt(Math.hypot(dx, dy)) + ' | ' + dx + ' × ' + dy + ')')
  await o('__t.keo([100, 100], [340, 150], { shiftKey: true }); true')
  const n4 = await nhan()
  kiem('Thuoc do: giu Shift thi do thang (bo do lech doc)', n4.so === dx + ' px' && n4.kt === '', n4.so)
  await o('__t.keo([200, 200], [900, 200]); true')
  const n5 = await nhan()
  kiem('Thuoc do: keo ra ngoai vung bi giu trong vung (toi da toi mep phai vung)', n5.so === Math.round(500 * S) + ' px', n5.so + ' (dap an ' + Math.round(500 * S) + ')')
  await o('__t.keo([300, 300], [150, 250]); true')
  const hh = await o(`({ x1: +thuocDuongEl.getAttribute('x1'), x2: +thuocDuongEl.getAttribute('x2'), y1: +thuocDuongEl.getAttribute('y1'), y2: +thuocDuongEl.getAttribute('y2'), nhan: thuocNhanEl.getBoundingClientRect().toJSON(), w: innerWidth, h: innerHeight })`)
  kiem('Thuoc do: duong ve nam dung toa do keo (300,300) -> (150,250) (lech toi da nua diem anh vi hit vach luoi), nhan nam trong man', [hh.x1 - 300, hh.x2 - 150, hh.y1 - 300, hh.y2 - 250].every((d) => Math.abs(d) <= 0.5 / S + 0.02) && hh.nhan.left >= 0 && hh.nhan.right <= hh.w && hh.nhan.top >= 0 && hh.nhan.bottom <= hh.h, JSON.stringify([hh.x1, hh.y1, hh.x2, hh.y2]))
  await o('__t.bam(250, 250); true')
  kiem('Thuoc do: chi bam khong keo thi khong de lai duong do', (await o('thuocLopEl.hidden')) === true)
  await o('__t.keo([100, 105], [340, 105]); true')
  const truocXong = await o('({ netVe: shapes.length, dang: !thuocLopEl.hidden })')
  await o(`document.getElementById('xong').click(); true`)
  await cho(250)
  const gui = xacNhan[xacNhan.length - 1]
  kiem('Thuoc do: duong do KHONG vao anh xuat (khong net ve, bam Xong gui vung thuong, khong dataUrl)', truocXong.netVe === 0 && truocXong.dang && gui && !gui.dataUrl && gui.rect, JSON.stringify(gui && Object.keys(gui)))
  await o(`__t.phim('v', 'KeyV'); true`)
  kiem('Thuoc do: doi cong cu thi duong do bien mat', (await o('thuocLopEl.hidden')) === true)

  const la = loiTrang.filter((l) => !l.includes('Inter.woff2'))
  kiem('Khong co loi console trong trang', la.length === 0, la.slice(0, 3).join(' | '))
  console.log('KQ=' + JSON.stringify({ kq, nhatKy: nhatKy.slice(0, 6) }))
  app.exit(0)
})
