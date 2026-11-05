'use strict'
/* =========================================================================
   Do GOI VIEC NHO (05/11) — chay bang: npm run test:viecnho
   5 viec: [1] An / hien nut tren thanh cong cu (Cai dat -> cau hinh -> thanh) · [2] Kinh lup khi chon vung ·
           [3] Lam noi vung (spotlight) · [4] Doc ma QR · [5] Hen gio chup 3 / 5 / 10 giay.
   CHAY AN: chi cua so offscreen / show:false, khong bat cua so nao len man hinh, khong cuop chuot. Overlay + Cai dat nap THAT
   (src/overlay/index.html, src/settings/index.html, preload that); chuot / phim la su kien gia lap TRONG trang. Hen gio dung
   module that src/hen-gio.js voi cua so show:false.
   DOI CHUNG: moi viec co mot cach lam hong co y -> bai do PHAI bat duoc dung muc, roi tra lai.
   QR: Chromium 150 cua Electron 43 tren Windows KHONG co BarcodeDetector (do 05/11) -> phan QR do bang BarcodeDetector GIA
   (lop gia ghi lai dau vao); muc "that" chi kiem trang thai that cua may nay. Chua do Mac.
   Cach chay (ghi ra file, KHONG | head / | tail):  node scripts/test/do-viec-nho.cjs > ket-qua.txt 2>&1
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  process.stdout.on('error', () => {})
  process.stderr.on('error', () => {})
  const { spawnSync } = require('child_process')
  const electron = require('electron') // duong dan Electron cho dung he dieu hanh
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'viec-nho')
  fs.mkdirSync(RA, { recursive: true })
  const chay = (tiLe, hong) => {
    const r = spawnSync(electron, [__filename, RA, String(tiLe), ...(hong ? [hong] : [])], { env, encoding: 'utf8', timeout: 240000 })
    const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
    if (!dong) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 4).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
    return JSON.parse(dong.slice(3))
  }
  let tong = 0, dat = 0
  const in_ = (k, tieuDe) => {
    console.log('\n== ' + tieuDe + ' ==')
    if (k.loi) { console.log('  TRUOT chay duoc (' + k.loi + ')'); tong++; return }
    for (const c of k.kq) { tong++; if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }
    tong++
    if (k.loiTrang && k.loiTrang.length) console.log('  TRUOT loi console trong trang: ' + k.loiTrang.slice(0, 3).join(' | '))
    else { dat++; console.log('  DAT   khong co loi console trong trang overlay') }
    if (k.so) console.log('  [do] ' + JSON.stringify(k.so))
  }
  in_(chay(1), 'Man 100 %')
  in_(chay(1.5), 'Man 150 %')
  /* DOI CHUNG: [ten cach lam hong, regex ten muc PHAI truot] */
  const doiChung = [
    ['bomtoi', /Lam noi vung: ngoai khung/],
    ['khongkhoet', /Lam noi vung: trong khung/],
    ['bokhoilai', /Lam noi vung: Lam mo/],
    ['klDongBo', /Kinh lup: .*gop/],
    ['anNutHong', /An nut: /],
    ['qrMoLink', /Ma QR: .*khong tu mo/],
    ['henGioDong', /Hen gio: .*dong truoc/],
    ['henGioBoCP', /Hen gio: .*loai khoi anh chup/],
  ]
  let doiChungDat = 0
  console.log('\n== DOI CHUNG (co y lam hong, bai do PHAI truot) ==')
  for (const [hong, mau] of doiChung) {
    const k = chay(1, hong)
    const truot = k.loi ? [] : k.kq.filter((c) => !c.ok && mau.test(c.ten))
    const ok = truot.length > 0
    if (ok) doiChungDat++
    console.log((ok ? '  DAT   ' : '  TRUOT ') + 'lam hong "' + hong + '" -> bai do bat duoc ' + truot.length + ' muc' + (k.loi ? ' (loi chay: ' + k.loi + ')' : ''))
  }
  tong += doiChung.length; dat += doiChungDat
  console.log('\nTONG: ' + dat + '/' + tong + ' DAT')
  process.exit(dat === tong ? 0 : 1)
}

/* ───────────── PHAN ELECTRON ───────────── */
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
const { app, BrowserWindow, ipcMain, screen } = require('electron')
process.on('uncaughtException', (e) => { try { console.log('LOI=' + (e && e.stack || e)) } catch (x) {} app.exit(2) })
process.on('unhandledRejection', (e) => { try { console.log('LOI=' + (e && e.stack || e)) } catch (x) {} app.exit(2) })
const RA = path.resolve(process.argv[2])
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] || ''
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData-' + TI_LE + (HONG ? '-' + HONG : '')))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
setTimeout(() => { console.log('LOI=qua 200 giay'); app.exit(2) }, 200000)

const NHOM_CUA_HONG = { bomtoi: 'spot', khongkhoet: 'spot', bokhoilai: 'spot', klDongBo: 'kl', anNutHong: 'annut', qrMoLink: 'qr', henGioDong: 'hen', henGioBoCP: 'hen' }
const chayNhom = (n) => !HONG || NHOM_CUA_HONG[HONG] === n

let ngonNgu = 'vi'
const ghiNhan = { confirm: [], huy: 0, chep: [], anNutLuu: null, kinhLupLuu: null }
ipcMain.on('i18n:lang', (e) => { e.returnValue = ngonNgu })
ipcMain.on('overlay:cancel', () => { ghiNhan.huy++ })
ipcMain.on('overlay:confirm', (_e, p) => { ghiNhan.confirm.push(p) })
ipcMain.on('overlay:copy-text', (_e, s) => { ghiNhan.chep.push(s) })

const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
const loiTrang = []
const js = (w, s) => w.webContents.executeJavaScript(s, true)
const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => { if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2.*Content Security Policy/.test(msg || e.message || '')) loiTrang.push(ten + ': ' + (msg || e.message)) })
const gan = (a, b, sai = 3) => Math.abs(a - b) <= sai

const TRO_GIUP = `
window.__t = {
  chuot: (kieu, x, y, dich) => (dich || window).dispatchEvent(new MouseEvent(kieu, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true })),
  phim: (key, code, them) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, code, bubbles: true, cancelable: true }, them || {}))),
  keo: (a, b) => { const r = veEl.getBoundingClientRect()
    __t.chuot('mousedown', r.left + a[0], r.top + a[1], veEl); __t.chuot('mousemove', r.left + (a[0] + b[0]) / 2, r.top + (a[1] + b[1]) / 2); __t.chuot('mousemove', r.left + b[0], r.top + b[1]); __t.chuot('mouseup', r.left + b[0], r.top + b[1]) },
  diem: (lx, ly) => { const d = veCtx.getImageData(Math.round(lx * DPR), Math.round(ly * DPR), 1, 1).data; return [d[0], d[1], d[2], d[3]] },
  hcn: (el) => { const r = (typeof el === 'string' ? document.querySelector(el) : el).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } },
  loai: () => shapes.map((s) => s.type).join(','),
  /* dung anh dong bang gia: 'trang' = trang tron; 'luoi' = diem (x,y) co mau (x%256, y%256, 128) theo PIXEL THAT */
  dungAnh: (kieu) => new Promise((res) => {
    const W = Math.round(innerWidth * DPR), H = Math.round(innerHeight * DPR)
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const x = c.getContext('2d')
    if (kieu === 'trang') { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H) }
    else { const d = x.createImageData(W, H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const o = (j * W + i) * 4; d.data[o] = i % 256; d.data[o + 1] = j % 256; d.data[o + 2] = 128; d.data[o + 3] = 255 } x.putImageData(d, 0, 0) }
    const im = new Image()
    im.onload = () => { im.style.width = (W / DPR) + 'px'; im.style.height = (H / DPR) + 'px'; frozenImg = im; res(true) }
    im.src = c.toDataURL('image/png')
  }),
}
true`

/* Lam hong co chu y (DOI CHUNG) */
const LAM_HONG = {
  bomtoi: 'taoLopToi = function () { return null }; true',
  khongkhoet: `taoLopToi = function (ds) { if (!ds.some((s) => s.type === 'spot')) return null; const w = Math.round(curRect.w * DPR), h = Math.round(curRect.h * DPR); if (!toiCv) toiCv = document.createElement('canvas'); toiCv.width = w; toiCv.height = h; const c = toiCv.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, w, h); return toiCv }; true`,
  bokhoilai: 'veToiLaiTrongVung = function () {}; true',
  klDongBo: 'klCapNhat = function (x, y) { klX = x; klY = y; klVe() }; true',
  anNutHong: 'capNhatAnNut = function () {}; true',
  qrMoLink: 'const _g = docMaQR; docMaQR = async function () { await _g(); for (const v of ocrDong) window.open(v) }; true',
}

async function moOverlay(W, H, { annotate = true, cfg = {}, lang = 'vi' } = {}) {
  ngonNgu = lang
  const ov = new BrowserWindow({ x: 0, y: 0, width: W, height: H, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  nghe(ov, 'overlay')
  ov.__moLink = []
  ov.webContents.setWindowOpenHandler(({ url }) => { ov.__moLink.push(url); return { action: 'deny' } })
  ov.webContents.on('will-navigate', (e, url) => { ov.__moLink.push(url); e.preventDefault() })
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', Object.assign({ origin: { x: 0, y: 0 }, lamMoKieu: 'mosaic', anNut: [], kinhLup: true }, cfg))
  if (annotate) ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 300 })
  await cho(350)
  await js(ov, TRO_GIUP)
  if (HONG && LAM_HONG[HONG]) await js(ov, LAM_HONG[HONG])
  return ov
}
const capCauHinh = async (ov, d) => { ov.webContents.send('overlay:update-config', d); await cho(150) }

/* ═════════ [1] AN / HIEN NUT ═════════ */
async function phanAnNut() {
  const ov = await moOverlay(1280, 800)
  const o = (s) => js(ov, s)
  const hien = (k) => o(`(() => { const el = PT_NUT['${k}'](); const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })()`)
  const tatCa = ['rect', 'arrow', 'text', 'blur', 'ocr', 'so', 'but', 'cuon', 'storyboard', 'quay', 'do']
  const w0 = await o('toolbarEl.getBoundingClientRect().width')
  kiem('An nut: mac dinh hien du ca 11 nut, thanh khong rong hon 774 px (731 + nut Hut mau)', (await Promise.all(tatCa.map(hien))).every(Boolean) && w0 <= 774, 'rong ' + w0.toFixed(1) + ' px')
  // chong chong len nhau: nut chinh va menu xo khong lam thanh rong them (menu nam ngoai luong)
  kiem('An nut: 2 nhom xo moi nam TRONG thanh (nut chinh 40x40, menu an luc dau)', await o(`(() => ['blur', 'ocr'].every((k) => { const n = document.getElementById(k + '-chinh').getBoundingClientRect(); return Math.round(n.width) === 40 && Math.round(n.height) === 40 && document.getElementById(k + '-menu').hidden }))()`))

  await capCauHinh(ov, { anNut: ['ocr', 'cuon', 'quay'] })
  const sau = {}
  for (const k of tatCa) sau[k] = await hien(k)
  const w1 = await o('toolbarEl.getBoundingClientRect().width')
  kiem('An nut: an ocr / cuon / quay -> 3 nut do bien mat, 7 nut con lai van hien', !sau.ocr && !sau.cuon && !sau.quay && ['rect', 'arrow', 'text', 'blur', 'so', 'but', 'storyboard'].every((k) => sau[k]), JSON.stringify(sau))
  kiem('An nut: thanh THU HEP lai (khong bao gio rong hon luc dau)', w1 < w0 - 100 && w1 <= 774, w0.toFixed(0) + ' -> ' + w1.toFixed(0) + ' px')
  // phim tat van chay du nut bi an
  const n0 = ghiNhan.confirm.length
  await o('__t.phim("9", "Digit9")')
  await o('__t.phim("r", "KeyR")')
  const moi = ghiNhan.confirm.slice(n0)
  kiem('An nut: nut Chup cuon + Quay bi an nhung phim 9 va R VAN chay (gui dung yeu cau)', moi.length === 2 && moi[0].cuon === true && moi[1].quay === true, JSON.stringify(moi.map((m) => Object.keys(m).join('+'))))
  await o('__t.phim("5", "Digit5")')
  await cho(150)
  const bangMo = await o('!document.getElementById("ocr-bang").hidden')
  kiem('An nut: nut Doc chu bi an nhung phim 5 VAN mo bang chu', bangMo)
  await o('__t.phim("Escape", "Escape")')
  await cho(80)
  // an Lam mo (nhom): phim 4 va 0 van chon duoc cong cu
  await capCauHinh(ov, { anNut: ['blur', 'but'] })
  await o('__t.phim("4", "Digit4")'); const t4 = await o('tool')
  await o('__t.phim("0", "Digit0")'); const t0 = await o('tool')
  await o('__t.phim("7", "Digit7")'); const t7 = await o('tool')
  kiem('An nut: an nhom Lam mo + But -> nhom bien mat nhung phim 4 / 0 / 7 van chon dung cong cu', !(await hien('blur')) && !(await hien('but')) && t4 === 'blur' && t0 === 'spot' && t7 === 'but', [t4, t0, t7].join(','))
  // an het: vach ngan khong de thua
  await capCauHinh(ov, { anNut: tatCa })
  const chia = await o(`({ v: document.querySelector('.chia-v').hidden, chu: document.querySelector('.chia-chu').hidden, thanhRong: toolbarEl.getBoundingClientRect().width })`)
  kiem('An nut: an het 11 nut -> 2 vach ngan thua cung an, thanh con V + mau + hoan tac + huy + xong', chia.v === true && chia.chu === true && chia.thanhRong < 330, JSON.stringify(chia))
  // chi con nhom S R: van con vach sau V, khong con vach giua nhom
  await capCauHinh(ov, { anNut: tatCa.filter((k) => k !== 'quay') })
  const chia2 = await o(`({ v: document.querySelector('.chia-v').hidden, chu: document.querySelector('.chia-chu').hidden })`)
  kiem('An nut: chi con nut Quay -> con 1 vach sau V, khong vach giua', chia2.v === false && chia2.chu === true, JSON.stringify(chia2))
  // tra lai
  await capCauHinh(ov, { anNut: [] })
  const w2 = await o('toolbarEl.getBoundingClientRect().width')
  kiem('An nut: bo an het -> thanh tro lai dung be rong luc dau, nut hien du', (await Promise.all(tatCa.map(hien))).every(Boolean) && gan(w2, w0, 0.6), w2.toFixed(1) + ' vs ' + w0.toFixed(1))
  // thanh nam trong man khi an doi be rong luc dang hien
  await capCauHinh(ov, { anNut: ['rect'] })
  const b = await o('__t.hcn(toolbarEl)')
  kiem('An nut: doi nut an luc thanh dang hien -> thanh van nam tron trong man', b.l >= 0 && b.r <= 1280 && b.t >= 0 && b.b <= 800)
  ov.destroy()

  // ── nguon cau hinh o main.js: loc nut hop le + mac dinh
  const mainSrc = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8').replace(/\r\n/g, '\n')
  const lay = (re) => { const m = mainSrc.match(re); if (!m) throw new Error('khong thay trong main.js: ' + re); return m[0] }
  const khoiMa = lay(/const NUT_AN_DUOC = [^\n]+\n/) + lay(/function anNutHopLe\(v\)[^\n]+\n/) + lay(/function kieuLamMo\(v\)[^\n]+\n/) + lay(/function cauHinhOverlay\(\) \{[\s\S]*?\n\}\n/)
  const taoHam = (cauHinh) => new Function('kho', khoiMa + '; return { anNutHopLe, cauHinhOverlay }')({ docCauHinh: () => cauHinh })
  const mac = taoHam({}).cauHinhOverlay()
  const loc = taoHam({}).anNutHopLe(['ocr', 'khong-co', 'ocr', 'quay', 5, null, 'blur'])
  kiem('An nut: cau hinh trong -> mac dinh hien het (anNut rong), kinh lup bat', Array.isArray(mac.anNut) && mac.anNut.length === 0 && mac.kinhLup === true, JSON.stringify(mac))
  kiem('An nut: danh sach rac duoc loc (khoa la, trung lap, khong phai chuoi bi bo)', loc.length === 3 && loc.includes('ocr') && loc.includes('quay') && loc.includes('blur'), JSON.stringify(loc))
  const luu = taoHam({ anNut: ['but'], kinhLup: false }).cauHinhOverlay()
  kiem('An nut: cau hinh da luu duoc doc lai nguyen ven (anNut va kinhLup)', luu.anNut.join() === 'but' && luu.kinhLup === false, JSON.stringify(luu))
  kiem('An nut: main.js gui cau hinh cho man chup luc mo (overlay:init) va luc doi (overlay:update-config)', (mainSrc.match(/\.\.\.cauHinhOverlay\(\)/g) || []).length >= 2 && /phatCauHinhOverlay\(\{ anNut: val \}\)/.test(mainSrc) && /phatCauHinhOverlay\(\{ kinhLup: val \}\)/.test(mainSrc))
  // File cau hinh that: ghi qua kho roi doc lai
  const kho = require(path.join(ROOT, 'src', 'kho.js'))
  kho.ghiCauHinh({ anNut: ['cuon', 'quay'], kinhLup: false })
  const doc = kho.docCauHinh()
  kiem('An nut: cau hinh LUU THAT xuong tep (cau-hinh.json) va doc lai duoc', Array.isArray(doc.anNut) && doc.anNut.join() === 'cuon,quay' && doc.kinhLup === false, JSON.stringify([doc.anNut, doc.kinhLup]))
}

/* ═════════ CAI DAT (giao dien chon nut + kinh lup) ═════════ */
async function phanCaiDat() {
  ipcMain.handle('settings:get', () => ({ hotkey: 'CommandOrControl+Shift+S', def: 'CommandOrControl+Shift+S', isMac: false, saveFolder: 'C:\\thu-muc-gia', lang: ngonNgu, version: 'test',
    anhLoai: 'png', anhChatLuong: 'cao', khayKieu: 'ngang', khaySoAnh: 5, khayTuThu: 5, lamMoKieu: 'mosaic', anNut: ['ocr', 'quay'], kinhLup: false, moCung: { hoTro: false } }))
  ipcMain.handle('settings:set-an-nut', (_e, ds) => { ghiNhan.anNutLuu = ds; return { anNut: ds } })
  ipcMain.handle('settings:set-kinh-lup', (_e, b) => { ghiNhan.kinhLupLuu = b; return { kinhLup: b } })
  ipcMain.handle('bq:get', () => ({}))
  const mo = async (lang) => {
    ngonNgu = lang
    const w = new BrowserWindow({ width: 520, height: 900, show: false, webPreferences: { preload: path.join(ROOT, 'src', 'preload-settings.js'), contextIsolation: true, sandbox: false } })
    await w.loadFile(path.join(ROOT, 'src', 'settings', 'index.html'))
    await cho(400)
    return w
  }
  const w = await mo('vi')
  const o = (s) => js(w, s)
  const t0 = await o(`(() => { const ch = [...document.querySelectorAll('#thanh-nut .nut-chip')]; return { n: ch.length, tat: ch.filter((b) => !b.classList.contains('chon')).map((b) => b.dataset.k).sort(), ten: ch.map((b) => b.textContent.trim()).every(Boolean), kl: document.querySelector('#kinh-lup-bat .chon-nut.chon').dataset.v } })()`)
  kiem('Cai dat: nhom Thanh cong cu co 11 nut chon, hien dung trang thai luu (ocr + quay tat), kinh lup Tat', t0.n === 11 && t0.tat.join() === 'ocr,quay' && t0.ten && t0.kl === '0', JSON.stringify(t0))
  await o(`document.querySelector('#thanh-nut .nut-chip[data-k="rect"]').click()`)
  await cho(120)
  kiem('Cai dat: bam nut Khung -> luu danh sach an gom ca Khung (ocr, quay, rect)', ghiNhan.anNutLuu && [...ghiNhan.anNutLuu].sort().join() === 'ocr,quay,rect', JSON.stringify(ghiNhan.anNutLuu))
  await o(`document.querySelector('#thanh-nut .nut-chip[data-k="ocr"]').click()`)
  await cho(120)
  kiem('Cai dat: bam lai nut Doc chu -> bo khoi danh sach an (quay, rect)', [...ghiNhan.anNutLuu].sort().join() === 'quay,rect', JSON.stringify(ghiNhan.anNutLuu))
  await o(`document.querySelector('#kinh-lup-bat .chon-nut[data-v="1"]').click()`)
  await cho(120)
  kiem('Cai dat: bam Bat kinh lup -> luu true, nut Bat sang', ghiNhan.kinhLupLuu === true && (await o(`document.querySelector('#kinh-lup-bat .chon-nut.chon').dataset.v`)) === '1', String(ghiNhan.kinhLupLuu))
  const rong = await o(`document.documentElement.scrollWidth <= window.innerWidth + 1`)
  kiem('Cai dat: khong tran ngang o cua so 520 px', rong)
  w.destroy()
  const we = await mo('en')
  const ten = await js(we, `[...document.querySelectorAll('#thanh-nut .nut-chip span'), document.querySelector('[data-i18n="set.nhom.thanh"]'), document.querySelector('[data-i18n="set.kinhLup.nhan"]')].map((e) => e.textContent.trim())`)
  kiem('Cai dat: ban EN co du chu (khong con chu tieng Viet co dau)', ten.length === 13 && ten.every((s) => s && !/[\u00C0-\u1EF9]/.test(s)), ten.join(' | '))
  we.destroy()
}

/* ═════════ [2] KINH LUP ═════════ */
async function phanKinhLup() {
  const ov = await moOverlay(1280, 800, { annotate: false })
  const o = (s) => js(ov, s)
  await o('__t.dungAnh("luoi")')
  const mm = (x, y) => o(`__t.chuot('mousemove', ${x}, ${y})`)
  await mm(400, 300)
  await cho(120)
  const a = await o(`(() => { const r = klEl.getBoundingClientRect(); const c = klCv.getContext('2d'); const m = Math.floor(klCv.width / 2) + 1; const d = c.getImageData(m, m, 1, 1).data
    return { hidden: klEl.hidden, chu: klTo.textContent, tx: Math.round(r.left), ty: Math.round(r.top), r: r.right, b: r.bottom, px: [d[0], d[1], d[2]], mode } })()`)
  const dpr = Number(TI_LE)
  const kyVongR = Math.floor(400 * dpr) % 256, kyVongG = Math.floor(300 * dpr) % 256
  kiem('Kinh lup: re chuot trong luc chon vung -> o phong to hien ra', a.hidden === false && a.mode === 'select', JSON.stringify({ hidden: a.hidden, mode: a.mode }))
  kiem('Kinh lup: toa do ghi dung px that (' + Math.round(400 * dpr) + ' , ' + Math.round(300 * dpr) + ')', a.chu === Math.round(400 * dpr) + ' , ' + Math.round(300 * dpr), a.chu)
  kiem('Kinh lup: diem ngay giua o phong to LA diem anh duoi con tro (mau doc tu anh dong bang)', a.px[0] === kyVongR && a.px[1] === kyVongG && a.px[2] === 128, 'doc ' + a.px.join(',') + ' / can ' + [kyVongR, kyVongG, 128].join(','))
  kiem('Kinh lup: o nam canh con tro (phai-duoi), khong de len diem dang tro', a.tx >= 400 && a.ty >= 300, a.tx + ',' + a.ty)
  // sat mep phai / duoi: lat sang trai / len tren, van nam tron trong man
  await mm(1270, 790)
  await cho(120)
  const e = await o(`(() => { const r = klEl.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom } })()`)
  kiem('Kinh lup: sat goc phai-duoi man hinh -> o lat sang trai-len tren, nam tron trong man', e.l >= 0 && e.t >= 0 && e.r <= 1280 && e.b <= 800 && e.r <= 1270 && e.b <= 790, JSON.stringify(e))
  // tha chuot / ra khoi man / che do ve -> an
  await mm(500, 400)
  await cho(100)
  await o(`__t.chuot('mousedown', 500, 400, window); __t.chuot('mousemove', 560, 440)`)
  await cho(100)
  const trongKeo = await o('!klEl.hidden')
  await o(`__t.chuot('mouseup', 560, 440)`)
  await cho(100)
  kiem('Kinh lup: van hien TRONG luc keo chon vung, an ngay khi tha chuot', trongKeo === true && (await o('klEl.hidden')) === true, 'trong keo hien=' + trongKeo)
  await mm(300, 300); await cho(100)
  await o(`document.documentElement.dispatchEvent(new MouseEvent('mouseleave'))`)
  kiem('Kinh lup: chuot ra khoi man nay -> an', (await o('klEl.hidden')) === true)
  // bat / tat theo Cai dat
  await capCauHinh(ov, { kinhLup: false })
  await mm(350, 350); await cho(120)
  const tat = await o('klEl.hidden')
  await capCauHinh(ov, { kinhLup: true })
  await mm(360, 360); await cho(120)
  const bat = await o('!klEl.hidden')
  kiem('Kinh lup: tat trong Cai dat -> khong hien du re chuot; bat lai -> hien lai', tat === true && bat === true, 'tat:' + tat + ' bat:' + bat)
  // gop khung: 600 su kien mousemove DON LIEN -> chi ve toi da vai lan (theo nhip khung hinh)
  await o('window.__klN = 0; { const _o = klVe; klVe = function () { __klN++; return _o.apply(this, arguments) } }; true')
  await o(`for (let i = 0; i < 600; i++) __t.chuot('mousemove', 200 + (i % 500), 200 + (i % 300))`)
  await cho(150)
  const nVe = await o('__klN')
  kiem('Kinh lup: 600 su kien chuot lien tiep chi ve ' + nVe + ' lan (gop theo khung hinh, khong ve moi su kien)', nVe >= 1 && nVe <= 4, 've ' + nVe + ' lan')
  if (HONG) { ov.destroy(); return {} }

  // ── NHIP KEO: keo chon vung co / khong kinh lup (xen ke, lay trung vi), do khoang cach giua cac khung hinh + chi phi moi su kien
  const doNhip = (bat) => o(`(async () => {
    kinhLupBat = ${bat}; if (!kinhLupBat) klAn()
    __t.chuot('mousemove', 300, 300)
    __t.chuot('mousedown', 300, 300, window)
    const gaps = []; let last = performance.now(); let dung = false
    const vong = () => { const n = performance.now(); gaps.push(n - last); last = n; if (!dung) requestAnimationFrame(vong) }
    requestAnimationFrame(vong)
    let i = 0
    await new Promise((res) => { const id = setInterval(() => { for (let k = 0; k < 4; k++) { i++; __t.chuot('mousemove', 300 + (i % 700), 300 + (i % 380)) } if (i >= 1200) { clearInterval(id); res() } }, 4) })
    dung = true
    const t0 = performance.now(); for (let j = 0; j < 3000; j++) __t.chuot('mousemove', 300 + (j % 700), 300 + (j % 380)); const chiPhi = (performance.now() - t0) / 3000
    __t.chuot('mouseup', 600, 500)
    gaps.shift(); gaps.sort((a, b) => a - b)
    const tb = gaps.reduce((s, v) => s + v, 0) / gaps.length
    return { tb, p95: gaps[Math.floor(gaps.length * 0.95)], max: gaps[gaps.length - 1], chiPhi, n: gaps.length }
  })()`)
  const trungVi = (ds, k) => ds.map((d) => d[k]).sort((a, b) => a - b)[Math.floor(ds.length / 2)]
  const dsTat = [], bat2 = []
  for (let l = 0; l < 3; l++) { dsTat.push(await doNhip(false)); await cho(100); bat2.push(await doNhip(true)); await cho(100) }
  const so = { tbTat: trungVi(dsTat, 'tb'), tbBat: trungVi(bat2, 'tb'), p95Tat: trungVi(dsTat, 'p95'), p95Bat: trungVi(bat2, 'p95'), chiPhiTat: trungVi(dsTat, 'chiPhi'), chiPhiBat: trungVi(bat2, 'chiPhi') }
  for (const k of Object.keys(so)) so[k] = Math.round(so[k] * 1000) / 1000
  kiem('Kinh lup: nhip keo KHONG te hon luc tat (khoang cach khung trung binh bat ' + so.tbBat + ' ms vs tat ' + so.tbTat + ' ms)', so.tbBat <= so.tbTat * 1.15 + 2, JSON.stringify(so))
  kiem('Kinh lup: khung cham nhat (p95) khong te hon luc tat qua 30 % (bat ' + so.p95Bat + ' vs tat ' + so.p95Tat + ' ms)', so.p95Bat <= so.p95Tat * 1.3 + 4, JSON.stringify(so))
  kiem('Kinh lup: chi phi dong bo moi su kien chuot them <= 0,03 ms (bat ' + so.chiPhiBat + ' vs tat ' + so.chiPhiTat + ' ms)', so.chiPhiBat - so.chiPhiTat <= 0.03, JSON.stringify(so))
  ov.destroy()
  return so
}

/* ═════════ [3] LAM NOI VUNG ═════════ */
async function phanLamNoi() {
  const ov = await moOverlay(1280, 800)
  const o = (s) => js(ov, s)
  await o('__t.dungAnh("trang")')
  await o('__t.phim("0", "Digit0")')
  const sp = await o(`(() => { const b = document.getElementById('blur-chinh'); const hien = (s) => getComputedStyle(b.querySelector(s)).display !== 'none'
    return { tool, dt: b.dataset.tool, so: b.dataset.so, nhomSp: document.getElementById('blur-nhom').classList.contains('sp'), icSpot: hien('.ic-spot'), icBlur: hien('.ic-blur'), chon: b.classList.contains('chon'), tieuDe: b.title, soHienThi: getComputedStyle(b, '::after').content, mucChon: [...document.querySelectorAll('#blur-menu .muc-xo.chon')].map((x) => x.dataset.tool).join() } })()`)
  kiem('Lam noi vung: phim 0 chon cong cu, nut hien icon khung sang + so 0 + goi y, menu danh dau dung muc', sp.tool === 'spot' && sp.dt === 'spot' && sp.nhomSp && sp.icSpot && !sp.icBlur && sp.chon && /0/.test(sp.soHienThi) && sp.mucChon === 'spot' && /(n[ổo]i|nổi)/i.test(sp.tieuDe), JSON.stringify(sp))
  await o('__t.keo([100, 80], [300, 200])')
  const A = (x, y) => o(`__t.diem(${x}, ${y})`)
  const trong = await A(200, 140), ngoai = await A(550, 50)
  kiem('Lam noi vung: trong khung giu nguyen (trong suot, khong toi)', trong[3] === 0, trong.join(','))
  kiem('Lam noi vung: ngoai khung toi di (den 60 %)', ngoai[0] === 0 && gan(ngoai[3], 153, 3), ngoai.join(','))
  const vien = await A(100, 140)
  kiem('Lam noi vung: khung co vien mau dang chon (cam)', vien[3] > 200 && vien[0] > 200 && vien[2] < 100, vien.join(','))
  // hai khung gan nhau / de len nhau
  await o('__t.keo([250, 120], [450, 260])')
  const giao = await A(270, 150), chiKhung2 = await A(400, 240), ngoaiHet = await A(550, 50)
  kiem('Lam noi vung: hai khung de nhau -> phan giao va khung thu hai deu sang (khong dem hai lan)', giao[3] === 0 && chiKhung2[3] === 0 && gan(ngoaiHet[3], 153, 3), [giao[3], chiKhung2[3], ngoaiHet[3]].join('/'))
  // net khac ve ben ngoai khung KHONG bi toi
  await o('__t.phim("1", "Digit1"); __t.keo([480, 40], [560, 100])')
  const net = await A(520, 40)
  kiem('Lam noi vung: khung / mui ten / chu ve ben ngoai khung van ro, KHONG bi toi theo', net[3] === 255 && net[0] > 230 && net[2] < 60, net.join(','))
  // Lam mo nam ngoai khung phai toi cung (khong sang nhu nen)
  await o('__t.phim("4", "Digit4"); __t.keo([460, 150], [560, 230])')
  const mo = await A(510, 200)
  kiem('Lam noi vung: Lam mo nam ngoai khung cung toi nhu anh xung quanh (khong sang len)', mo[3] === 255 && mo[0] >= 90 && mo[0] <= 112, mo.join(','))
  // anh xuat = dung nhu thay
  const n0 = ghiNhan.confirm.length
  await o('xong(false)')
  await cho(500)
  const xuat = ghiNhan.confirm.slice(n0).find((p) => p && p.dataUrl)
  if (!xuat) kiem('Lam noi vung: xuat anh -> co anh ghep gui di', false, 'khong thay dataUrl')
  else {
    const doc = await o(`(async () => {
      const im = new Image(); await new Promise((r) => { im.onload = r; im.src = ${JSON.stringify(xuat.dataUrl)} })
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0)
      const lay = (lx, ly) => Array.from(x.getImageData(Math.round(lx * DPR), Math.round(ly * DPR), 1, 1).data)
      const du = (lx, ly) => { const v = __t.diem(lx, ly); const a = v[3] / 255; return [0, 1, 2].map((i) => Math.round(255 * (1 - a) + v[i] * a)) } // nen trang + net ve = ky vong
      const mau = [[200, 140], [550, 50], [270, 150], [520, 40], [510, 200], [100, 140], [400, 250], [30, 30]]
      return { rong: im.width, cao: im.height, canRong: Math.round(curRect.w * DPR), canCao: Math.round(curRect.h * DPR), so: mau.map(([lx, ly]) => ({ lx, ly, thay: du(lx, ly), xuat: lay(lx, ly).slice(0, 3) })) }
    })()`)
    const lech = Math.max(...doc.so.map((p) => Math.max(...p.thay.map((v, i) => Math.abs(v - p.xuat[i])))))
    kiem('Lam noi vung: anh xuat dung nhu thay (' + doc.so.length + ' diem mau lech toi da ' + lech + '/255 so voi tren man hinh)', doc.rong === doc.canRong && doc.cao === doc.canCao && lech <= 3, 'lech ' + lech + ' ' + doc.rong + 'x' + doc.cao)
    const trongXuat = doc.so[0].xuat, ngoaiXuat = doc.so[1].xuat
    kiem('Lam noi vung: trong anh xuat, trong khung TRANG nguyen ven, ngoai khung xam toi (~102)', trongXuat.every((v) => v >= 252) && ngoaiXuat.every((v) => gan(v, 102, 4)), 'trong ' + trongXuat.join(',') + ' ngoai ' + ngoaiXuat.join(','))
  }
  // chon + keo di chuyen khung
  await o('__t.phim("v", "KeyV")')
  const x1Truoc = await o('shapes[0].x1')
  await o('__t.keo([120, 100], [170, 100])')
  const x1Sau = await o('shapes[0].x1')
  const cu = await A(110, 140), moi = await A(330, 90)
  kiem('Lam noi vung: chon bang V roi keo -> khung di chuyen (x ' + x1Truoc + ' -> ' + x1Sau + '), lo sang di theo', x1Sau === x1Truoc + 50 && gan(cu[3], 153, 3) && moi[3] === 0, 'cu ' + cu.join(',') + ' moi ' + moi.join(','))
  // hoan tac / lam lai
  const loai0 = await o('__t.loai()')
  for (let i = 0; i < 8; i++) await o('__t.phim("z", "KeyZ", { ctrlKey: true })')
  const sauHoan = await A(550, 50)
  kiem('Lam noi vung: Ctrl+Z het cac net -> lop toi bien mat (' + loai0 + ')', (await o('shapes.length')) === 0 && sauHoan[3] === 0, sauHoan.join(','))
  await o('__t.phim("y", "KeyY", { ctrlKey: true })')
  const lamLai = await A(550, 50)
  kiem('Lam noi vung: Ctrl+Y -> khung quay lai, lop toi quay lai', (await o('__t.loai()')) === 'spot' && gan(lamLai[3], 153, 3), lamLai.join(','))
  // chon lai tu menu
  await o('document.getElementById("blur-nhom").dispatchEvent(new MouseEvent("mouseenter"))')
  await cho(260)
  const menu = await o(`(() => { const m = document.getElementById('blur-menu'); const r = __t.hcn(m); return { hidden: m.hidden, soMuc: m.querySelectorAll('.muc-xo').length, trongMan: r.l >= 0 && r.r <= innerWidth && r.b <= innerHeight } })()`)
  await o('document.querySelector("#blur-menu .muc-xo[data-tool=\\"blur\\"]").click()')
  const sauMenu = await o(`({ tool, dt: document.getElementById('blur-chinh').dataset.tool, so: document.getElementById('blur-chinh').dataset.so, menuAn: document.getElementById('blur-menu').hidden })`)
  kiem('Lam noi vung: re chuot vao nut Lam mo xo menu 3 muc, chon Lam mo -> nut doi lai icon + so 4, menu dong', !menu.hidden && menu.soMuc === 3 && menu.trongMan && sauMenu.tool === 'blur' && sauMenu.dt === 'blur' && sauMenu.so === '4' && sauMenu.menuAn, JSON.stringify([menu, sauMenu]))
  ov.destroy()
}

/* ═════════ [4] MA QR ═════════ */
async function phanQR() {
  const ov = await moOverlay(1280, 800)
  const o = (s) => js(ov, s)
  await o('__t.dungAnh("trang")')
  const that = await o(`({ coApi: typeof BarcodeDetector !== 'undefined', coQR: CO_QR })`)
  if (!HONG) {
    kiem('Ma QR (may nay, THAT): trang thai BarcodeDetector cua Chromium ' + process.versions.chrome + ' = ' + (that.coApi ? 'co' : 'KHONG co'), that.coApi ? true : that.coQR === false, JSON.stringify(that))
    if (!that.coQR) {
      await o('__t.phim("q", "KeyQ")'); await cho(100)
      const dong = await o('document.getElementById("ocr-bang").hidden')
      await o('document.getElementById("ocr-nhom").dispatchEvent(new MouseEvent("mouseenter"))'); await cho(300)
      const menuAn = await o('document.getElementById("ocr-menu").hidden')
      kiem('Ma QR (may nay): khong co BarcodeDetector -> phim Q va menu QR tu tat, Doc chu chay nhu cu', dong === true && menuAn === true)
      await o('document.getElementById("ocr-nhom").dispatchEvent(new MouseEvent("mouseleave"))'); await cho(250)
      await o('document.getElementById("ocr-chinh").click()'); await cho(150)
      kiem('Ma QR (may nay): bam nut Doc chu van mo bang chu (khong bi menu QR chan)', (await o('!document.getElementById("ocr-bang").hidden')) === true)
      await o('__t.phim("Escape", "Escape")'); await cho(80)
    }
  }
  // ── BarcodeDetector GIA: ghi lai dau vao, tra ma da dinh
  await o(`window.__qr = { vao: [], tra: ['https://vi-du.com/a?x=1', 'Wi-Fi: mat-khau-123', 'https://vi-du.com/a?x=1'], loi: false }
    window.BarcodeDetector = class { constructor(o) { __qr.opt = o } async detect(nguon) { __qr.vao.push({ ten: nguon && nguon.constructor && nguon.constructor.name, w: nguon.width, h: nguon.height }); if (__qr.loi) throw new Error('hong'); return __qr.tra.map((v) => ({ rawValue: v, format: 'qr_code' })) } }
    CO_QR = true; true`)
  await o('__t.phim("q", "KeyQ")')
  await cho(250)
  const p = await o(`(() => ({ mo: !document.getElementById('ocr-bang').hidden, tieuDe: document.getElementById('ocr-tieu-de').textContent, dem: document.getElementById('ocr-dem').textContent, dong: [...document.querySelectorAll('#ocr-ds .dong')].map((d) => d.textContent), neo: document.querySelectorAll('#ocr-bang a, #ocr-bang [href]').length, chepOn: !document.getElementById('ocr-chep').disabled, ghiChu: document.getElementById('ocr-ghichu').hidden ? '' : document.getElementById('ocr-ghichu').textContent, vao: __qr.vao, opt: __qr.opt, doi: document.getElementById('ocr-doi').hidden }))()`)
  const dpr = Number(TI_LE)
  kiem('Ma QR: phim Q mo bang, tieu de "Ma QR trong vung chon", moi ma mot dong (trung lap gop con 2), dem 2 ma', p.mo && /QR/.test(p.tieuDe) && p.dong.length === 2 && p.dong[0] === 'https://vi-du.com/a?x=1' && p.dong[1] === 'Wi-Fi: mat-khau-123' && /2/.test(p.dem), JSON.stringify(p))
  kiem('Ma QR: bo doc nhan DUNG vung chon (' + Math.round(600 * dpr) + 'x' + Math.round(300 * dpr) + ' px that), chi tim qr_code', p.vao.length === 1 && p.vao[0].w === Math.round(600 * dpr) && p.vao[0].h === Math.round(300 * dpr) && p.opt && p.opt.formats.join() === 'qr_code', JSON.stringify(p.vao))
  kiem('Ma QR: nut Sao chep sang, ghi chu "app khong tu mo lien ket", khong co nut doc lai kieu Doc chu', p.chepOn && /(không tự mở|never opens)/i.test(p.ghiChu) && p.doi === true, p.ghiChu)
  kiem('Ma QR: khong tu mo -> bang khong chua lien ket bam duoc, trinh duyet khong bi goi mo cua so / chuyen trang', p.neo === 0 && ov.__moLink.length === 0, 'neo=' + p.neo + ' moLink=' + ov.__moLink.length)
  // bam vao dong chua URL cung khong mo gi
  await o(`document.querySelector('#ocr-ds .dong').click(); document.querySelector('#ocr-ds .dong').dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); true`)
  await cho(150)
  kiem('Ma QR: bam / bam doi vao dong URL cung khong mo gi (khong tu mo lien ket)', ov.__moLink.length === 0, 'moLink=' + ov.__moLink.length)
  const c0 = ghiNhan.chep.length
  await o('document.getElementById("ocr-chep").click()')
  await cho(100)
  kiem('Ma QR: Sao chep -> chep dung 2 dong vao clipboard (qua main)', ghiNhan.chep.length === c0 + 1 && ghiNhan.chep[c0] === 'https://vi-du.com/a?x=1\nWi-Fi: mat-khau-123', JSON.stringify(ghiNhan.chep[c0]))
  ov.destroy()

  // khong thay ma / loi / menu
  const ov2 = await moOverlay(1280, 800)
  const q = (s) => js(ov2, s)
  await q('__t.dungAnh("trang")')
  await q(`window.__qr = { vao: [], tra: [], loi: false }; window.BarcodeDetector = class { constructor(o) {} async detect(n) { __qr.vao.push(1); if (__qr.loi) throw new Error('hong'); return __qr.tra } }; CO_QR = true; true`)
  await q('__t.phim("q", "KeyQ")'); await cho(200)
  const rong = await q(`document.querySelector('#ocr-ds .rong') ? document.querySelector('#ocr-ds .rong').textContent : ''`)
  kiem('Ma QR: vung khong co ma -> bao "Khong thay ma QR", nut Sao chep khoa', /Không thấy mã QR/.test(rong) && (await q('document.getElementById("ocr-chep").disabled')) === true, rong)
  await q('__t.phim("Escape", "Escape")'); await cho(80)
  await q('__qr.loi = true; __t.phim("q", "KeyQ")'); await cho(200)
  const loi = await q(`document.querySelector('#ocr-ds .rong') ? document.querySelector('#ocr-ds .rong').textContent : ''`)
  kiem('Ma QR: bo doc nem loi -> bao loi ro rang, bang khong treo o "Dang tim"', /Không đọc được mã QR/.test(loi), loi)
  await q('__t.phim("Escape", "Escape")'); await cho(80)
  // menu xo
  await q('document.getElementById("ocr-nhom").dispatchEvent(new MouseEvent("mouseenter"))'); await cho(300)
  const menu = await q(`(() => { const m = document.getElementById('ocr-menu'); const r = __t.hcn(m); return { hidden: m.hidden, soMuc: m.querySelectorAll('.muc-xo').length, trongMan: r.l >= 0 && r.r <= innerWidth && r.b <= innerHeight, rongThanh: toolbarEl.getBoundingClientRect().width } })()`)
  await q('__qr.loi = false; __qr.tra = [{ rawValue: "abc" }]; document.querySelector("#ocr-menu .muc-xo[data-tool=\\"qr\\"]").click()'); await cho(250)
  const sauMenu = await q(`({ bang: !document.getElementById('ocr-bang').hidden, menuAn: document.getElementById('ocr-menu').hidden, dong: [...document.querySelectorAll('#ocr-ds .dong')].map((d) => d.textContent).join() })`)
  kiem('Ma QR: re chuot vao nut Doc chu xo menu 2 muc (Doc chu / Doc ma QR), bam muc QR mo bang, menu dong', !menu.hidden && menu.soMuc === 2 && menu.trongMan && menu.rongThanh <= 774 && sauMenu.bang && sauMenu.menuAn && sauMenu.dong === 'abc', JSON.stringify([menu, sauMenu]))
  ov2.destroy()
}

/* ═════════ [5] HEN GIO ═════════ */
function napModuleHong(hong) {
  const dich = path.join(ROOT, 'src', 'hen-gio.js')
  let src = fs.readFileSync(dich, 'utf8').replace(/\r\n/g, '\n')
  if (hong === 'henGioDong') {
    const cu = '    try { if (p.win && !p.win.isDestroyed()) p.win.destroy() } catch (e) {}\n    p.win = null\n'
    if (!src.includes(cu)) throw new Error('khong thay doan dong cua so het gio trong hen-gio.js')
    src = src.replace(cu, '    p.win = null\n')
  } else if (hong === 'henGioBoCP') {
    if (!src.includes('win.setContentProtection(true)')) throw new Error('khong thay setContentProtection')
    src = src.replace('win.setContentProtection(true)', '')
  }
  const M = require('module')
  const m = new M(dich, module)
  m.filename = dich
  m.paths = M._nodeModulePaths(path.dirname(dich))
  m._compile(src, dich)
  return m.exports
}
function taoBW(rec) {
  return class extends BrowserWindow {
    constructor(o) { super(o); rec.wins.push(this); rec.opts = o }
    setContentProtection(b) { rec.cp = b; return super.setContentProtection(b) }
    destroy() { if (!rec.tDestroy) rec.tDestroy = Date.now(); return super.destroy() }
  }
}
async function phanHenGio() {
  const hg = HONG ? napModuleHong(HONG) : require(path.join(ROOT, 'src', 'hen-gio.js'))
  const chayMot = async (giay, tuy = {}) => {
    const rec = { wins: [], cp: null, tDestroy: 0 }
    const chuoi = [], chup = []
    const t0 = Date.now()
    let daDongKhiChup = null, khoangSauDong = null
    hg.batDau(giay, Object.assign({ BrowserWindow: taoBW(rec), screen, an: true, ghiLog: () => {}, quanSat: (n) => chuoi.push(n),
      chup: () => { chup.push(Date.now()); daDongKhiChup = !rec.wins.length || rec.wins[0].isDestroyed(); khoangSauDong = rec.tDestroy ? Date.now() - rec.tDestroy : null } }, tuy))
    const mauDom = []
    return { rec, chuoi, chup, t0, mauDom, doi: async (ms) => { await cho(ms) }, daDong: () => daDongKhiChup, khoang: () => khoangSauDong }
  }
  // 1) chay that 3 giay: do thoi gian THAT, so tren cua so, thu tu dong / chup
  {
    const r = await chayMot(3)
    const dom = []
    const lay = setInterval(() => { const w = r.rec.wins[0]; if (w && !w.isDestroyed()) w.webContents.executeJavaScript(`document.getElementById('n').textContent`).then((v) => { if (dom[dom.length - 1] !== v) dom.push(v) }).catch(() => {}) }, 150)
    await cho(4200)
    clearInterval(lay)
    const dt = r.chup.length ? r.chup[0] - r.t0 : -1
    kiem('Hen gio: hen 3 giay -> chup dung 1 lan sau ' + dt + ' ms (3000 - 3600)', r.chup.length === 1 && dt >= 3000 && dt <= 3600, 'dt=' + dt + ' chup=' + r.chup.length)
    kiem('Hen gio: so dem nguoc 3 -> 2 -> 1 -> 0 (lan luot, moi giay mot so)', r.chuoi.join() === '3,2,1,0', r.chuoi.join())
    kiem('Hen gio: so tren cua so dem doi theo 3 -> 2 -> 1 (doc tu trang that)', dom.join('>') === '3>2>1', dom.join('>'))
    kiem('Hen gio: cua so dem duoc loai khoi anh chup (setContentProtection true)', r.rec.cp === true, String(r.rec.cp))
    kiem('Hen gio: cua so dem dong truoc khi chup (luc chup cua so da bi huy)', r.daDong() === true, String(r.daDong()))
    kiem('Hen gio: doi >= 150 ms sau khi dong cua so moi chup (he dieu hanh kip go khoi man hinh)', r.khoang() !== null && r.khoang() >= 150, String(r.khoang()) + ' ms')
    kiem('Hen gio: cua so dem hien o dau man hinh, khong cuop tieu diem / khong bam duoc (focusable false)', r.rec.opts && r.rec.opts.focusable === false && r.rec.opts.alwaysOnTop === true && r.rec.opts.skipTaskbar === true, JSON.stringify(r.rec.opts && { f: r.rec.opts.focusable, t: r.rec.opts.alwaysOnTop }))
    kiem('Hen gio: xong thi het trang thai dem (dangDem false)', hg.dangDem() === false)
  }
  // 2) nhip nhanh: cac moc 5 / 10 giay, gia tri la -> 5
  for (const [giay, kyVong] of [[5, 5], [10, 10], [7, 5]]) {
    const r = await chayMot(giay, { nhip: 20, nhipSauDong: 30 })
    await cho(giay * 20 + 400)
    kiem('Hen gio: chon ' + giay + ' giay -> bat dau tu ' + kyVong + (giay === 7 ? ' (gia tri la quay ve 5)' : '') + ', chup 1 lan, so ' + kyVong + '..0', r.chuoi[0] === kyVong && r.chuoi[r.chuoi.length - 1] === 0 && r.chuoi.length === kyVong + 1 && r.chup.length === 1, r.chuoi.join())
  }
  // 3) huy giua chung
  {
    const r = await chayMot(5, { nhip: 100, nhipSauDong: 30 })
    await cho(250)
    const dangDem = hg.dangDem()
    hg.huy()
    await cho(900)
    kiem('Hen gio: huy giua chung -> khong bao gio chup, cua so dem dong, het trang thai dem', dangDem === true && r.chup.length === 0 && r.rec.wins[0].isDestroyed() && hg.dangDem() === false, 'chup=' + r.chup.length)
  }
  // 4) hen lai de len hen cu
  {
    const a = await chayMot(5, { nhip: 100, nhipSauDong: 30 })
    await cho(150)
    const b = await chayMot(3, { nhip: 100, nhipSauDong: 30 })
    await cho(900)
    kiem('Hen gio: hen lan nua luc dang dem -> chi lan sau chay (1 lan chup, lan cu bi huy)', a.chup.length === 0 && b.chup.length === 1 && a.rec.wins[0].isDestroyed(), 'a=' + a.chup.length + ' b=' + b.chup.length)
  }
  // 5) menu khay + chu
  const mainSrc = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8').replace(/\r\n/g, '\n')
  const i18n = require(path.join(ROOT, 'src', 'i18n.js'))
  const khoa = ['tray.henGio', 'tray.henGiay', 'tray.huyHen']
  const coChu = ['vi', 'en'].every((l) => khoa.every((k) => i18n.t(l, k) && i18n.t(l, k) !== k))
  kiem('Hen gio: menu khay co muc Hen gio chup > 3 / 5 / 10 giay + Huy hen gio; chu VI + EN day du, khong gach dai', /submenu: \[3, 5, 10\]\.map/.test(mainSrc) && /henGio\.huy\(\)/.test(mainSrc) && coChu && ['vi', 'en'].every((l) => khoa.every((k) => !/\u2014/.test(i18n.t(l, k)))), '')
  kiem('Hen gio: bam phim tat chup luc dang hen -> bo hen (startCapture huy hen truoc)', /chupChac\.overlayKet[\s\S]{0,400}?closeOverlay\(\)\s*\}\s*henGio\.huy\(\)/.test(mainSrc))
}

app.whenReady().then(async () => {
  let so = null
  if (chayNhom('annut')) { await phanAnNut(); if (!HONG) await phanCaiDat() }
  if (chayNhom('kl')) so = await phanKinhLup()
  if (chayNhom('spot')) await phanLamNoi()
  if (chayNhom('qr')) await phanQR()
  if (chayNhom('hen')) await phanHenGio()
  console.log('KQ=' + JSON.stringify({ kq, loiTrang, so }))
  app.exit(0)
}).catch((e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) })
