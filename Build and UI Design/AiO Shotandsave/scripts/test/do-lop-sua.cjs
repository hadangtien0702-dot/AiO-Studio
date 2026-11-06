'use strict'
/* =========================================================================
   Do LOP SUA + VE TAY + CAT BO KHUC GIUA (06/11/2026, ROADMAP 0k #2, #3, #9) — chay bang: npm run test:lopsua
   [S1] Kieu VE TAY: cong tac trong bang mau, net tay on dinh (ve lai khong rung, cung seed o hai ti le cho cung hinh), anh xuat
        giong thu nhin thay, nho lua chon (pin:data veTay).
   [S2] LOP SUA: ve + che tren anh, luu -> mo lai anh ghim vao ve: net cu hien lai sua duoc, NET CHE VAN CHE (nen la anh sach),
        keo net Che di cho khac thi cho cu hien lai noi dung that; anh doi ben ngoai thi bo qua; nut xoa ban sach; doi ty le dpr.
   [S3] CAT BO KHUC GIUA: keo dai ngang / doc, anh + cua so nho di dung, net dich theo, Hoan tac / Lam lai, mep cat ro, Esc tra ve.
   [S4] Man chup: payload Xong co lop sua (net + anh sach chua ve).
   [S5] Don dep lop sua (node, khong Electron): tran dung luong, qua han, anh bi xoa, anh doi ben ngoai.
   CHAY AN: cua so offscreen (show:false) nap THAT src/pin/index.html + src/overlay/index.html voi preload that. Chuot / phim =
   webContents.sendInputEvent. Doc diem anh cua canvas dang hien va cua ANH XUAT (pin:save-edit) o ti le man 100 / 125 / 150 %.
   userData + thu muc anh = thu muc tam trong .selftest/lop-sua. KHONG cham thu muc anh that / %APPDATA%.
   DOI CHUNG (cung bai chay tren ban co y lam hong phai TRUOT dung muc): tayTat · khongLop · lopKhongNap · catKhongDich ·
   catKhongHoanTac · overlayKhongLop.
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
/* 06/11 (soat dot 3): ten file lop sua gio gom ten + bam cua duong dan day du -> tim file .json cua mot anh bang cach doc truong `duong`. */
function fileLopJson(L, f) {
  try { for (const n of fs.readdirSync(L.dir)) { if (!n.endsWith('.json')) continue; try { if (JSON.parse(fs.readFileSync(path.join(L.dir, n), 'utf8')).duong === path.resolve(f)) return path.join(L.dir, n) } catch (e) {} } } catch (e) {}
  return null
}
const conFileSach = (L, ten) => { try { return fs.readdirSync(L.dir).some((n) => n.startsWith(ten) && n.endsWith('.sach.png')) } catch (e) { return false } }

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  const { spawnSync } = require('child_process')
  let electronDir = path.join(ROOT, 'node_modules', 'electron', 'dist')
  if (!fs.existsSync(electronDir) && process.env.NODE_PATH) {
    for (const p of process.env.NODE_PATH.split(path.delimiter)) { const d = path.join(p, 'electron', 'dist'); if (fs.existsSync(d)) { electronDir = d; break } }
  }
  const electron = path.join(electronDir, process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron') : 'electron')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'lop-sua')
  fs.rmSync(RA, { recursive: true, force: true })
  fs.mkdirSync(RA, { recursive: true })
  const chay = (tiLe, hong) => {
    for (let lan = 0; lan < 2; lan++) { // may ban (nhieu agent chay cung luc): truot do het gio thi thu lai MOT lan
      const r = spawnSync(electron, [__filename, RA, String(tiLe), hong || ''], { env, encoding: 'utf8', timeout: 420000 })
      const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
      if (dong) return JSON.parse(dong.slice(3))
      if (lan === 1) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 4).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
    }
  }
  let tong = 0, dat = 0
  const in_ = (k, tieuDe) => {
    console.log('\n== ' + tieuDe + ' ==')
    if (k.loi) { console.log('  TRUOT chay duoc (' + k.loi + ')'); tong++; return }
    for (const c of k.kq) { tong++; if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }
    tong++
    if (k.loiTrang && k.loiTrang.length) console.log('  TRUOT loi console trong trang: ' + k.loiTrang.slice(0, 3).join(' | '))
    else { dat++; console.log('  DAT   khong co loi console trong trang') }
  }
  in_(chay(1), 'Man 100 %')
  in_(chay(1.25), 'Man 125 %')
  in_(chay(1.5), 'Man 150 %')

  /* ── S5: don dep lop sua (node) ── */
  console.log('\n== S5 don dep lop sua (node) ==')
  {
    const { taoLopSua } = require(path.join(ROOT, 'src', 'lop-sua.js'))
    const kiem = (ten, ok, ct) => { tong++; if (ok) dat++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
    const goc = path.join(RA, 's5'); fs.mkdirSync(path.join(goc, 'anh'), { recursive: true })
    const png = Buffer.alloc(100 * 1024, 7)
    const taoAnh = (ten) => { const f = path.join(goc, 'anh', ten); fs.writeFileSync(f, Buffer.alloc(500, 1)); return f }
    const net = [{ type: 'rect', x1: 1, y1: 1, x2: 5, y2: 5, color: '#f86820' }]
    // tran dung luong: moi muc ~100 KB, tran 250 KB -> chi con 2 muc moi nhat
    const A = taoLopSua(path.join(goc, 'ud1'), () => {}, { tranByte: 250 * 1024 })
    const fs3 = ['a.png', 'b.png', 'c.png'].map(taoAnh)
    fs3.forEach((f, i) => { A.ghi(f, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png }); const j = fileLopJson(A, f); const b = JSON.parse(fs.readFileSync(j, 'utf8')); b.luc = Date.now() - (3 - i) * 1000; fs.writeFileSync(j, JSON.stringify(b)) })
    A.donDep()
    kiem('Qua tran dung luong: don muc CU NHAT truoc (con b, c; a bi go)', !A.doc(fs3[0]) && !!A.doc(fs3[1]) && !!A.doc(fs3[2]), 'tong ' + A.tongByte() + ' byte')
    kiem('Tong dung luong sau don <= tran (250 KB)', A.tongByte() <= 250 * 1024, A.tongByte() + ' byte')
    // anh bi xoa -> mo coi bi don; thu muc anh khong con (o dia roi) thi KHONG don
    const B = taoLopSua(path.join(goc, 'ud2'), () => {})
    const fb = taoAnh('mc.png'), fb2 = taoAnh('con.png')
    B.ghi(fb, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png }); B.ghi(fb2, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png })
    fs.unlinkSync(fb)
    const bangCuaOMat = path.join(B.dir, 'oroi.png.json'); fs.writeFileSync(bangCuaOMat, JSON.stringify({ v: 1, duong: path.join(goc, 'oroi-khong-co', 'x.png'), bytes: 1, luc: Date.now(), shapes: net })); fs.writeFileSync(path.join(B.dir, 'oroi.png.sach.png'), png)
    B.donDep()
    kiem('Anh da bi xoa: lop sua cua no bi don', !fileLopJson(B, fb) && !conFileSach(B, 'mc.png'))
    kiem('Anh con: lop sua giu nguyen', !!B.doc(fb2))
    kiem('Thu muc anh khong con (o dia roi / thu muc offline): KHONG coi la anh da xoa, giu lop sua', fs.existsSync(bangCuaOMat))
    // qua han
    const C = taoLopSua(path.join(goc, 'ud3'), () => {}, { hanNgay: 30 })
    const fc = taoAnh('cu.png'); C.ghi(fc, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png })
    C.donDep(Date.now() + 31 * 86400000)
    kiem('Qua 30 ngay: lop sua bi don', !C.doc(fc))
    // anh doi ben ngoai -> bo qua
    const D = taoLopSua(path.join(goc, 'ud4'), () => {})
    const fd = taoAnh('doi.png'); D.ghi(fd, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png })
    const truoc = !!D.doc(fd)
    fs.appendFileSync(fd, Buffer.from([1, 2, 3]))
    kiem('Anh bi sua ben ngoai app (dung luong doi): lop sua bi bo qua, khong ve net cu len anh khac', truoc && !D.doc(fd))
    // khong net -> xoa; tat luu -> xoa
    const fe = taoAnh('khong-net.png'); D.ghi(fe, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png })
    D.ghiTuLop(fe, { shapes: [], dpr: 1, dipW: 5, dipH: 5, sach: null }, true)
    kiem('Luu lai khong con net nao: lop sua bi xoa', !D.doc(fe))
    const ff = taoAnh('tat.png'); D.ghi(ff, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png })
    const r = D.ghiTuLop(ff, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: 'data:image/png;base64,' + png.toString('base64') }, false)
    kiem('Cai dat luuLopSua = false: khong luu, va go lop sua cu cua anh', r.daXoa === true && !D.doc(ff))
    // giu ban sach cu khi sach = null; khong co ban sach cu thi tu choi
    const fg = taoAnh('giu.png'); D.ghi(fg, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: png })
    const r2 = D.ghi(fg, { shapes: net.concat(net), dpr: 1, dipW: 5, dipH: 5, sach: null })
    const d2 = D.doc(fg)
    kiem('sach = null giu ban sach dang co, cap nhat net', r2.ok && d2 && d2.bang.shapes.length === 2 && d2.sach.length === png.length)
    const fh = taoAnh('khong-sach.png')
    kiem('sach = null ma chua co ban sach: tu choi (khong tao lop sua hong)', D.ghi(fh, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: null }).ok === false && !D.doc(fh))
    // anh sach qua lon bi tu choi (khong luu), khong de lai rac
    const fi = taoAnh('lon.png'); const lon = Buffer.alloc(61 * 1024 * 1024, 3)
    kiem('Anh sach > 60 MB: khong luu', D.ghi(fi, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: lon }).ok === false && !D.doc(fi))
  }

  /* ── DOI CHUNG ── */
  const doiChung = [
    ['tayTat', /ve tay|tay:|rung|giong thu nhin|seed/i, 'danh dau ve tay bi bo qua'],
    ['khongLop', /lop sua|mo lai|che|ban sach|sidecar|xoa ban sach|stale|doi ben ngoai|ty le/i, 'luu khong kem lop sua'],
    ['lopKhongNap', /mo lai|che|sua tiep|ban sach/i, 'anh ghim khong nap lop sua luc vao ve'],
    ['catKhongDich', /dich|net.*cat|cat.*net|lui/i, 'cat ma khong dich net'],
    ['catKhongHoanTac', /Hoan tac|Lam lai/i, 'cat ma khong ghi lich su'],
    ['overlayKhongLop', /man chup.*lop/i, 'man chup khong gui lop sua']
  ]
  console.log('\n== DOI CHUNG (co y lam hong, bai do PHAI truot) ==')
  let doiChungDat = 0
  for (const [hong, mau, mota] of doiChung) {
    const k = chay(1, hong)
    const truot = k.loi ? [] : k.kq.filter((c) => !c.ok && mau.test(c.ten))
    const ok = truot.length > 0
    if (ok) doiChungDat++
    console.log((ok ? '  DAT   ' : '  TRUOT ') + 'lam hong "' + hong + '" (' + mota + ') -> bai do bat duoc ' + truot.length + ' muc' + (k.loi ? ' (loi chay: ' + k.loi + ')' : ''))
  }
  tong += doiChung.length; dat += doiChungDat
  console.log('\nTONG: ' + dat + '/' + tong + ' DAT')
  process.exit(dat === tong ? 0 : 1)
}

/* ───────────── PHAN ELECTRON ───────────── */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const RA = path.resolve(process.argv[2])
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] || ''
const GOC = path.join(RA, 'e-' + TI_LE + (HONG ? '-' + HONG : ''))
fs.mkdirSync(path.join(GOC, 'anh'), { recursive: true })
app.setPath('userData', path.join(GOC, 'userData'))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
app.on('window-all-closed', () => {})
const { taoLopSua } = require(path.join(ROOT, 'src', 'lop-sua.js'))
const lopSua = taoLopSua(path.join(GOC, 'ud'), () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.error(e) } catch (_) {} app.exit(1) })
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 400 giay'), 400000)

const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
const loiTrang = []
const js = (w, s) => w.webContents.executeJavaScript(s, true)
const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => { if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2.*Content Security Policy/.test(msg || e.message || '')) loiTrang.push(ten + ': ' + (msg || e.message)) })
const gan = (a, b, sai) => Math.abs(a - b) <= sai

/* ── IPC gia (cung hop dong voi main.js; ghi lop sua bang CHINH src/lop-sua.js) ── */
const fileCua = new Map() // webContents.id -> duong dan file anh
const luu = []            // moi lan pin:save-edit: { dataUrl, lop, id }
const doiCo = []          // moi lan pin:doi-co: [w, h]
const tay = []            // moi lan ve:dat-tay
let xacNhan = null
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('pin:log', () => {})
ipcMain.on('pin:doi-co', (e, w, h) => { doiCo.push([w, h]) })
ipcMain.on('ve:dat-tay', (e, b) => { tay.push(b) })
ipcMain.on('overlay:confirm', (_e, p) => { xacNhan = p })
ipcMain.handle('pin:lop-doc', (e) => {
  const f = fileCua.get(e.sender.id)
  const d = f && lopSua.doc(f)
  return d ? { shapes: d.bang.shapes, dpr: d.bang.dpr, dipW: d.bang.dipW, dipH: d.bang.dipH, sach: 'data:image/png;base64,' + d.sach.toString('base64') } : null
})
ipcMain.handle('pin:lop-xoa', (e) => { const f = fileCua.get(e.sender.id); return !!f && lopSua.xoa(f) > 0 })
ipcMain.on('pin:save-edit', (e, dataUrl, chep, lop) => {
  const f = fileCua.get(e.sender.id)
  luu.push({ dataUrl, lop, id: e.sender.id })
  if (!f) return
  fs.writeFileSync(f, nativeImage.createFromDataURL(dataUrl).toPNG())
  if (HONG === 'khongLop') lopSua.xoa(f)
  else if (lop && Array.isArray(lop.shapes)) lopSua.ghiTuLop(f, lop, true)
  else lopSua.xoa(f)
})

/* ── Anh mau ── */
function taoAnhPng(file, w, h, mau) {
  const bmp = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = mau(x, y), i = (y * w + x) * 4; bmp[i] = c[2]; bmp[i + 1] = c[1]; bmp[i + 2] = c[0]; bmp[i + 3] = 255 }
  fs.writeFileSync(file, nativeImage.createFromBitmap(bmp, { width: w, height: h }).toPNG())
}
const XAM = [64, 64, 64]
const nenCheMau = (x, y) => (x >= 450 && x < 550 && y >= 300 && y < 400 ? [255, 255, 255] : XAM)       // khoi trang can che (DIP 300..367 x 200..267)
const nenKeMau = (x, y) => (y < 150 ? [200, 40, 40] : y < 300 ? [40, 170, 60] : y < 450 ? [40, 80, 200] : [210, 200, 40]) // 4 dai mau
const DO = [200, 40, 40], LUC = [40, 170, 60], XANH = [40, 80, 200], VANG = [210, 200, 40]
function docAnh(dataUrl) {
  const im = nativeImage.createFromDataURL(dataUrl), kt = im.getSize(), bmp = im.toBitmap()
  return { rong: kt.width, cao: kt.height, diem: (x, y) => { x = Math.max(0, Math.min(kt.width - 1, Math.floor(x))); y = Math.max(0, Math.min(kt.height - 1, Math.floor(y))); const i = (y * kt.width + x) * 4; return [bmp[i + 2], bmp[i + 1], bmp[i], bmp[i + 3]] } }
}
const gan3 = (p, c, sai = 14) => Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) + Math.abs(p[2] - c[2]) <= sai * 3
const laCam = (p) => p[0] > 200 && p[1] > 70 && p[1] < 150 && p[2] < 90 && p[3] > 200
const laDen = (p) => p[0] < 25 && p[1] < 25 && p[2] < 25 && p[3] > 200
const laTrang = (p) => p[0] > 235 && p[1] > 235 && p[2] > 235

const TRO_GIUP = `window.__s = { ds: () => JSON.stringify(shapes), vt: () => { const r = veEl.getBoundingClientRect(); return { l: r.left, t: r.top } },
  dai: () => ({ lichSu: SuaNet.lichSu.length, redo: SuaNet.redo.length, dip: { w: dip.w, h: dip.h }, nw: img.naturalWidth, nh: img.naturalHeight, mode, ok: img.complete }),
  px: (lx, ly) => { const d = veCtx.getImageData(Math.floor(lx * DPR), Math.floor(ly * DPR), 1, 1).data; return [d[0], d[1], d[2], d[3]] },
  bam: () => { const d = veCtx.getImageData(0, 0, veEl.width, veEl.height).data; let h = 2166136261; for (let i = 3; i < d.length; i += 4) { h = (h ^ d[i - 3] ^ (d[i] << 1) ^ d[i - 2]) >>> 0; h = Math.imul(h, 16777619) >>> 0 } return h } }
true`

/* Tao mot cua so anh ghim nap file `file` (hien dipW x dipH), tra { w, o, ... } kem ham tuong tac that. */
async function moPin(file, dipW, dipH, tuyChon = {}) {
  const win = new BrowserWindow({ x: 0, y: 0, width: dipW + 24, height: dipH + 24, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false } })
  fileCua.set(win.webContents.id, file)
  nghe(win, 'anh ghim')
  await win.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
  if (HONG === 'tayTat') await js(win, 'NetTay.danhDau = function (s) { return s }; true')
  if (HONG === 'lopKhongNap') await js(win, 'layLopSua = function () {}; true')
  if (HONG === 'catKhongDich') await js(win, 'catDichNet = function () { return true }; true')
  if (HONG === 'catKhongHoanTac') await js(win, 'SuaNet.ghi = (function (g) { return function (op) { if (op && op.k === "cat") return; return g(op) } })(SuaNet.ghi); true')
  const dataUrl = nativeImage.createFromPath(file).toDataURL()
  win.webContents.send('pin:data', { dataUrl, pad: 12, w: dipW, h: dipH, lamMoKieu: tuyChon.lamMoKieu || 'mosaic', veTay: !!tuyChon.veTay })
  await cho(450)
  await js(win, TRO_GIUP)
  const wc = win.webContents
  const o = (s) => js(win, s)
  let vt = { l: 0, t: 0 }
  const capVt = async () => { vt = await o('__s.vt()') }
  const trang = (lx, ly) => [Math.round(vt.l + lx), Math.round(vt.t + ly)]
  const m = async (loai, x, y) => { wc.sendInputEvent({ type: loai, x, y, button: 'left', clickCount: 1 }); await cho(22) }
  const keoTrang = async (a, b) => { await m('mouseMove', a[0], a[1]); await m('mouseDown', a[0], a[1]); for (let i = 1; i <= 4; i++) await m('mouseMove', Math.round(a[0] + (b[0] - a[0]) * i / 4), Math.round(a[1] + (b[1] - a[1]) * i / 4)); await m('mouseUp', b[0], b[1]) }
  const keo = (a, b) => keoTrang(trang(a[0], a[1]), trang(b[0], b[1]))
  const bamTai = async (lx, ly) => { const p = trang(lx, ly); await m('mouseMove', p[0], p[1]); await m('mouseDown', p[0], p[1]); await m('mouseUp', p[0], p[1]) }
  const phim = async (keyCode, mods) => { wc.focus(); wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mods || [] }); await cho(15); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mods || [] }); await cho(40) }
  const bamPT = async (sel) => { const r = await o('(() => { const e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } })()'); if (!r || !r.w) throw new Error('khong bam duoc ' + sel); const x = Math.round(r.x), y = Math.round(r.y); await m('mouseMove', x, y); await m('mouseDown', x, y); await m('mouseUp', x, y); await cho(40) }
  const chuDat = async (lx, ly, text) => { await bamTai(lx, ly); await o(`{ const ta = document.querySelector('.go-chu'); ta.value = ${JSON.stringify(text)}; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) }`); await cho(60) }
  const luuAnh = async () => { const n = luu.length; wc.focus(); await phim('Return'); for (let i = 0; i < 60 && luu.length === n; i++) await cho(50); return luu.length > n ? luu[luu.length - 1] : null }
  const choNap = async (nh) => { for (let i = 0; i < 80; i++) { const d = await o('__s.dai()'); if (d.ok && (!nh || d.nh === nh)) return d; await cho(50) } return o('__s.dai()') }
  const ctrl = process.platform === 'darwin' ? 'meta' : 'control'
  return { win, wc, o, capVt, trang, keo, bamTai, phim, bamPT, chuDat, luuAnh, choNap, ctrl, dong: () => { fileCua.delete(wc.id); win.destroy() } }
}

const KICH_BAN = {}

/* ════ S1: VE TAY ════ */
KICH_BAN.S1 = async () => {
  const T = (t) => '[S1] ' + t
  const f = path.join(GOC, 'anh', 's1.png'); taoAnhPng(f, 900, 600, () => XAM)
  const p = await moPin(f, 600, 400)
  await p.phim('1'); await cho(150); await p.capVt()
  kiem(T('luc dau cong tac ve tay TAT'), (await p.o('NetTay.dangBat()')) === false)
  await p.bamPT('#mau-hien')
  const popMo = await p.o('!document.getElementById("mau-pop").hidden')
  kiem(T('bang mau mo ra co cong tac ve tay'), popMo && (await p.o('!!document.getElementById("kieu-tay")')))
  const bo = await p.o('(() => { const P = document.getElementById("mau-pop").getBoundingClientRect(), F = document.getElementById("frame").getBoundingClientRect(); const trong = (r, B) => r.left >= B.left - 0.5 && r.right <= B.right + 0.5 && r.top >= B.top - 0.5 && r.bottom <= B.bottom + 0.5; const tuy = [...document.querySelectorAll("#mau-pop .tuy")].filter((e) => !e.hidden).map((e) => e.getBoundingClientRect()); const mau = [...document.querySelectorAll("#mau-pop .mau")].map((e) => e.getBoundingClientRect()); const chong = tuy.some((a) => mau.some((b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)); return { n: tuy.length, trongPop: tuy.every((r) => trong(r, P)), popTrongKhung: trong(P, F), chong, cao: Math.round(P.height) } })()')
  kiem(T('bang mau: nut tuy chon nam trong bang, khong de len 7 o mau, bang van nam trong khung anh, cao khong tang (<= 232 px)'), bo.n >= 2 && bo.trongPop && bo.popTrongKhung && !bo.chong && bo.cao <= 232, JSON.stringify(bo))
  await p.bamPT('#kieu-tay')
  kiem(T('bam cong tac (chuot that): ve tay BAT, nut sang, bang mau van mo, main duoc bao luu'), (await p.o('NetTay.dangBat()')) === true && (await p.o('document.getElementById("kieu-tay").getAttribute("aria-pressed")')) === 'true' && (await p.o('!document.getElementById("mau-pop").hidden')) && tay[tay.length - 1] === true, 'tay=' + JSON.stringify(tay))
  await p.phim('Escape')
  await p.keo([40, 40], [200, 120])
  await p.phim('2'); await p.keo([40, 150], [220, 200])
  await p.phim('3'); await p.chuDat(300, 60, 'Ghi chu tay')
  await p.phim('6'); await p.bamTai(500, 40)
  const ds = JSON.parse(await p.o('__s.ds()'))
  kiem(T('ve 4 net (khung, mui ten, chu, so) bang chuot that'), ds.map((s) => s.type).join() === 'rect,arrow,text,so', ds.map((s) => s.type).join())
  kiem(T('ca 4 net deu mang dau ve tay (tay: true) va seed nguyen duong'), ds.every((s) => s.tay === true && Number.isInteger(s.seed) && s.seed > 0), JSON.stringify(ds.map((s) => s.seed)))
  kiem(T('4 net co seed khac nhau (khong trung hinh)'), new Set(ds.map((s) => s.seed)).size === 4)
  await p.o('selectedShape = null; redraw(); redraw()'); await cho(600) // lan ve dau nap font: doi xong roi moi do
  await p.o('redraw()')
  await p.o('window.__a1 = veCtx.getImageData(0, 0, veEl.width, veEl.height).data.slice(); true')
  await p.o('redraw(); redraw()'); await cho(200)
  await p.o('redraw()')
  const khacLan = await p.o('(() => { const b = veCtx.getImageData(0, 0, veEl.width, veEl.height).data; let n = 0, tong = 0; for (let i = 3; i < b.length; i += 4) { if (b[i] > 0 || window.__a1[i] > 0) tong++; if (Math.abs(b[i] - window.__a1[i]) > 24) n++ } return { n, tong } })()')
  kiem(T('ve lai nhieu lan khong rung: anh canvas giong het (diem khac > 24/255 giua hai lan ve <= 0,1 % so diem co net)'), khacLan.tong > 5000 && khacLan.n <= khacLan.tong * 0.001, khacLan.n + '/' + khacLan.tong)
  // so voi ban ve thang cung hinh: ve tay phai KHAC ro (khong chi la mot net thang)
  const khac = await p.o(`(() => {
    const a = document.createElement('canvas'); a.width = 700; a.height = 500; const b = document.createElement('canvas'); b.width = 700; b.height = 500
    const ca = a.getContext('2d'), cb = b.getContext('2d')
    for (const c of [ca, cb]) { c.strokeStyle = '#f86820'; c.lineWidth = 3 }
    ca.strokeRect(40, 40, 160, 80)
    NetTay.khung(cb, 40, 40, 160, 80, 12345, 1)
    const da = ca.getImageData(0, 0, 700, 500).data, db = cb.getImageData(0, 0, 700, 500).data
    let diff = 0, ngoai = 0
    for (let y = 0; y < 500; y++) for (let x = 0; x < 700; x++) { const i = (y * 700 + x) * 4 + 3; if ((da[i] > 128) !== (db[i] > 128)) diff++; if (db[i] > 40 && (x < 28 || x > 212 || y < 28 || y > 132)) ngoai++ }
    return { diff, ngoai }
  })()`)
  kiem(T('khung ve tay khac ro khung thang (>= 150 diem anh khac) ma khong lech qua 12 px khoi hinh goc'), khac.diff >= 150 && khac.ngoai === 0, 'khac ' + khac.diff + ' diem, ngoai ' + khac.ngoai)
  // cung seed o hai ti le (k=1 va k=2): hinh nhu nhau, chi to hon
  const kt = await p.o(`(() => {
    const ve = (k) => { const c = document.createElement('canvas'); c.width = 300 * k; c.height = 200 * k; const x = c.getContext('2d'); x.strokeStyle = '#000'; x.lineWidth = 3 * k; NetTay.khung(x, 40 * k, 40 * k, 160 * k, 80 * k, 777, k); NetTay.muiTen(x, 30 * k, 150 * k, 250 * k, 180 * k, 99, k, 13 * k); return c }
    const a = ve(1), b = ve(2), t = document.createElement('canvas'); t.width = 300; t.height = 200; const tc = t.getContext('2d'); tc.drawImage(b, 0, 0, 300, 200)
    const da = a.getContext('2d').getImageData(0, 0, 300, 200).data, db = tc.getImageData(0, 0, 300, 200).data
    let co = 0, khop = 0
    for (let i = 3; i < da.length; i += 4) if (da[i] > 128) { co++; if (db[i] > 40) khop++ }
    return { co, khop }
  })()`)
  kiem(T('cung seed o 2 ti le (k=1, k=2) cho cung hinh: >= 92 % diem net khop'), kt.co > 400 && kt.khop / kt.co >= 0.92, kt.khop + '/' + kt.co)
  // mau canvas dang hien de so voi anh xuat
  const tung = await p.o('(() => { const out = {}; for (const s of shapes) { const hh = () => { const c = document.createElement("canvas"); c.width = 600; c.height = 400; const x = c.getContext("2d"); veShape(x, s, 1); const d = x.getImageData(0, 0, 600, 400).data; let h = 7; for (let i = 0; i < d.length; i += 4) h = (Math.imul(h, 31) + d[i] + d[i + 3]) >>> 0; return h }; out[s.type] = hh() === hh() }; return out })()')
  kiem(T('ve lai tung loai net hai lan cho cung hinh (ve tay khong dung so ngau nhien)'), Object.values(tung).every(Boolean) && Object.keys(tung).length === 4, JSON.stringify(tung))
  const mau = []
  for (let lx = 10; lx < 600; lx += 31) for (let ly = 10; ly < 400; ly += 23) mau.push([lx, ly])
  const live = await p.o('(() => { const out = []; for (const [lx, ly] of ' + JSON.stringify(mau) + ') out.push(__s.px(lx, ly)[3]); return out })()')
  const r = await p.luuAnh()
  if (!r) { kiem(T('nhan duoc anh xuat'), false); return }
  const A = docAnh(r.dataUrl), sc = 1.5
  kiem(T('anh xuat 900x600'), A.rong === 900 && A.cao === 600, A.rong + 'x' + A.cao)
  let lech = 0
  for (let q = 0; q < mau.length; q++) { const daCo = live[q] > 150, xuatCo = A.diem(mau[q][0] * sc, mau[q][1] * sc)[3] > 0 && !gan3(A.diem(mau[q][0] * sc, mau[q][1] * sc), XAM, 6); if (daCo !== xuatCo) lech++ }
  kiem(T('anh xuat giong thu nhin thay: ' + mau.length + ' diem mau, lech ' + lech), lech <= Math.max(3, Math.round(mau.length * 0.02)), lech + ' diem lech')
  // khung ve tay trong anh xuat: co diem cam doc theo canh tren (khong rong)
  let camTren = 0
  for (let x = 60; x < 300; x += 2) for (let y = 55; y < 70; y++) if (laCam(A.diem(x, y))) { camTren++; break }
  kiem(T('anh xuat: canh tren cua khung ve tay co net cam lien tuc (>= 85 % cot)'), camTren >= 0.85 * 120, camTren + '/120')
  p.dong()
  // Nho lua chon: cua so moi nhan veTay:true -> cong tac bat san, net moi co dau tay ma khong phai bam
  const f2 = path.join(GOC, 'anh', 's1b.png'); taoAnhPng(f2, 900, 600, () => XAM)
  const p2 = await moPin(f2, 600, 400, { veTay: true })
  await p2.phim('1'); await cho(120); await p2.capVt()
  kiem(T('nho lua chon: cua so moi (pin:data veTay) cong tac BAT san'), (await p2.o('NetTay.dangBat()')) === true && (await p2.o('document.getElementById("kieu-tay").getAttribute("aria-pressed")')) === 'true')
  await p2.keo([40, 40], [140, 100])
  kiem(T('nho lua chon: khung ve ngay sau khi mo la khung ve tay'), (await p2.o('shapes.length === 1 && shapes[0].tay === true')), await p2.o('__s.ds()'))
  // doi chon: tat cong tac -> net moi KHONG co tay; net dang chon (V) doi theo
  await p2.phim('V'); await p2.bamTai(90, 40) // chon khung (bam vao canh tren)
  await p2.bamPT('#mau-hien'); await p2.bamPT('#kieu-tay')
  kiem(T('tat cong tac khi dang chon mot khung (V): khung do doi sang net thang, la 1 buoc Hoan tac'), (await p2.o('shapes[0].tay')) === undefined && (await p2.o('__s.dai().lichSu')) === 2, 'lichSu ' + (await p2.o('__s.dai().lichSu')) + ' tay=' + JSON.stringify(tay))
  await p2.phim('Escape'); await p2.phim('1'); await p2.keo([200, 40], [300, 100])
  kiem(T('tat cong tac: khung moi la net thang (khong co dau tay)'), (await p2.o('shapes.length === 2 && shapes[1].tay === undefined && shapes[1].seed === undefined')))
  p2.dong()
}

/* ════ S2: LOP SUA ════ */
KICH_BAN.S2 = async () => {
  const T = (t) => '[S2] ' + t
  const f = path.join(GOC, 'anh', 's2.png'); taoAnhPng(f, 900, 600, nenCheMau)
  const p = await moPin(f, 600, 400, { lamMoKieu: 'kin' })
  await p.phim('1'); await cho(150); await p.capVt()
  await p.keo([30, 30], [150, 90])
  await p.phim('3'); await p.chuDat(200, 40, 'Ghi chu')
  await p.phim('2'); await p.keo([40, 110], [200, 160])
  await p.phim('4'); await p.keo([290, 190], [380, 280])
  const ds0 = JSON.parse(await p.o('__s.ds()'))
  kiem(T('ve 4 net: khung, chu, mui ten, che (to kin)'), ds0.map((s) => s.type).join() === 'rect,text,arrow,blur' && ds0[3].blurType === 'kin', ds0.map((s) => s.type + (s.blurType ? ':' + s.blurType : '')).join())
  const r = await p.luuAnh()
  if (!r) { kiem(T('luu duoc (nhan pin:save-edit)'), false); return }
  const A = docAnh(r.dataUrl)
  kiem(T('anh luu: khoi trang bi CHE den (anh file la ban DA CHE)'), laDen(A.diem(500, 350)) && laDen(A.diem(460, 310)), JSON.stringify(A.diem(500, 350)))
  kiem(T('luu kem lop sua: 4 net + anh sach, ti le dpr = 1,5 va co dip'), !!r.lop && r.lop.shapes.length === 4 && typeof r.lop.sach === 'string' && r.lop.sach.startsWith('data:image/png') && gan(r.lop.dpr, 1.5, 0.001) && r.lop.dipW === 600 && r.lop.dipH === 400, r.lop ? r.lop.shapes.length + ' net, dpr ' + r.lop.dpr : 'khong co lop')
  const d0 = lopSua.doc(f)
  kiem(T('lop sua nam trong userData (khong phai thu muc anh): co .json + .sach.png, thu muc anh chi co anh'), !!d0 && !!fileLopJson(lopSua, f) && fs.readdirSync(path.join(GOC, 'anh')).every((n) => /^s[0-9a-z]+.png$/.test(n)), fs.readdirSync(path.join(GOC, 'anh')).join())
  if (d0) {
    const S = docAnh('data:image/png;base64,' + d0.sach.toString('base64'))
    kiem(T('ban sach luu CHUA che: khoi trang con nguyen trong ban sach (3 diem), khong co net cam nao'), S.rong === 900 && laTrang(S.diem(500, 350)) && laTrang(S.diem(460, 310)) && laTrang(S.diem(540, 390)) && !laCam(S.diem(60, 45)), JSON.stringify(S.diem(500, 350)))
  }
  const hashSach0 = d0 ? require('crypto').createHash('md5').update(d0.sach).digest('hex') : ''
  p.dong()

  // ── mo lai: ghim chinh anh da luu (ban DA CHE) roi vao ve ──
  const p2 = await moPin(f, 600, 400, { lamMoKieu: 'kin' })
  await cho(200)
  kiem(T('ghim lai anh da luu: nut xoa ban sach co mat trong bang mau (hien khi co lop sua)'), (await p2.o('lopSan !== null')) === true && (await p2.o('document.getElementById("lop-xoa").hidden')) === false)
  await p2.phim('1'); await cho(250); await p2.capVt()
  const dsMo = JSON.parse(await p2.o('__s.ds()'))
  kiem(T('vao ve: 4 net cu hien lai (khung, chu, mui ten, che), chon sua duoc'), dsMo.map((s) => s.type).join() === 'rect,text,arrow,blur', dsMo.map((s) => s.type).join())
  kiem(T('toa do net cu khop luc luu (khung 30,30 -> 150,90)'), dsMo.length > 0 && gan(dsMo[0].x1, 30, 0.6) && gan(dsMo[0].y2, 90, 0.6), JSON.stringify(dsMo[0] && [dsMo[0].x1, dsMo[0].y1, dsMo[0].x2, dsMo[0].y2]))
  await p2.o('selectedShape = null; redraw()')
  const live = await p2.o('[__s.px(330, 230), __s.px(300, 200)]')
  kiem(T('net CHE van che khi mo lai: o khoi trang canvas hien den'), laDen(live[0]) && laDen(live[1]), JSON.stringify(live[0]))
  // dich khung bang chuot that (V + keo than), giu nguyen net Che
  await p2.phim('V'); await p2.keo([90, 30], [110, 60]) // keo canh tren cua khung (+20,+30)
  const dsSua = JSON.parse(await p2.o('__s.ds()'))
  kiem(T('sua tiep: keo khung cu bang V thi khung doi cho (net moi sua duoc)'), gan(dsSua[0].x1, 50, 1) && gan(dsSua[0].y1, 60, 1), JSON.stringify([dsSua[0].x1, dsSua[0].y1]))
  const r2 = await p2.luuAnh()
  if (!r2) { kiem(T('luu lan 2'), false); p2.dong(); return }
  const A2 = docAnh(r2.dataUrl)
  kiem(T('luu lan 2: net Che CHUA dung toi van che (khoi trang van den)'), laDen(A2.diem(500, 350)), JSON.stringify(A2.diem(500, 350)))
  kiem(T('luu lan 2: khung da dich (cho cu 30,30 het net, cho moi 50,60 co net cam)'), laCam(A2.diem(105, 90)) && laCam(A2.diem(75, 120)) && !laCam(A2.diem(60, 45)) && !laCam(A2.diem(150, 45)), JSON.stringify([A2.diem(105, 90), A2.diem(75, 120), A2.diem(60, 45)]))
  kiem(T('luu lan 2 khong gui lai anh sach (sach = null), ban sach tren dia KHONG doi'), r2.lop && r2.lop.sach === null && (lopSua.doc(f) ? require('crypto').createHash('md5').update(lopSua.doc(f).sach).digest('hex') : 'x') === hashSach0)
  p2.dong()

  // ── keo net Che sang cho khac: cho cu phai LO RA noi dung that (chung to dung ban sach, khong phai ban da che) ──
  const p3 = await moPin(f, 600, 400, { lamMoKieu: 'kin' })
  await cho(200); await p3.phim('1'); await cho(250); await p3.capVt()
  await p3.phim('V'); await p3.keo([335, 235], [135, 235]) // keo tam khoi Che sang trai 200 px
  const dsChe = JSON.parse(await p3.o('__s.ds()'))
  const r3 = await p3.luuAnh()
  if (!r3) { kiem(T('luu lan 3'), false); p3.dong(); return }
  const A3 = docAnh(r3.dataUrl)
  kiem(T('keo net Che sang cho khac: khoi trang cu LO RA (noi dung that, la ban sach) - neu nen la anh da che thi van den'), laTrang(A3.diem(500, 350)) && laTrang(A3.diem(460, 310)), JSON.stringify(A3.diem(500, 350)) + ' che x1=' + (dsChe[3] && dsChe[3].x1))
  kiem(T('keo net Che sang cho khac: cho moi (tam 135,235 DIP) bi che den'), laDen(A3.diem(135 * 1.5, 235 * 1.5)), JSON.stringify(A3.diem(202, 352)))
  p3.dong()

  // ── Esc thoat khong luu: anh + cua so tra ve nhu cu ──
  const f2 = path.join(GOC, 'anh', 's2b.png'); fs.copyFileSync(f, f2)
  lopSua.ghi(f2, { shapes: dsSua, dpr: 1.5, dipW: 600, dipH: 400, sach: lopSua.doc(f).sach })
  const p4 = await moPin(f2, 600, 400)
  await cho(200); await p4.phim('1'); await cho(250)
  const truocEsc = await p4.o('document.getElementById("img").src.length')
  const srcTrongVe = await p4.o('document.getElementById("img").src.length')
  await p4.phim('Escape'); await cho(120)
  const sau = await p4.o('({ mode, src: document.getElementById("img").src.length, n: shapes.length })')
  kiem(T('vao ve roi Esc (khong luu): ve che do xem, anh nen tra ve ban DA CHE dang luu, khong con net trong bo nho'), sau.mode === 'view' && sau.n === 0, JSON.stringify(sau))
  kiem(T('Esc khong sua file anh tren dia'), require('crypto').createHash('md5').update(fs.readFileSync(f2)).digest('hex') === require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex'))
  p4.dong()

  // ── anh bi sua ben ngoai: lop sua khong ap ──
  fs.appendFileSync(f2, Buffer.from([0, 0, 0, 0]))
  const p5 = await moPin(f2, 600, 400)
  await cho(200); await p5.phim('1'); await cho(200)
  kiem(T('anh da bi sua ben ngoai app: vao ve KHONG co net cu, nut xoa ban sach an'), (await p5.o('shapes.length')) === 0 && (await p5.o('document.getElementById("lop-xoa").hidden')) === true)
  p5.dong()

  // ── nut xoa ban sach ──
  const f3 = path.join(GOC, 'anh', 's2c.png'); taoAnhPng(f3, 900, 600, nenCheMau)
  const p6 = await moPin(f3, 600, 400)
  await p6.phim('1'); await cho(120); await p6.capVt(); await p6.keo([30, 30], [150, 90]); const rr = await p6.luuAnh()
  const coTruoc = !!lopSua.doc(f3)
  p6.dong()
  const p7 = await moPin(f3, 600, 400)
  await cho(250); await p7.phim('1'); await cho(200)
  await p7.bamPT('#mau-hien'); await p7.bamPT('#lop-xoa'); await cho(200)
  kiem(T('bam nut xoa ban sach (chuot that): lop sua + anh sach tren dia bi go, anh trong thu muc anh con nguyen'), rr && coTruoc && !lopSua.doc(f3) && !conFileSach(lopSua, 's2c.png') && fs.existsSync(f3))
  kiem(T('sau khi xoa: nut xoa an'), (await p7.o('document.getElementById("lop-xoa").hidden')) === true)
  await cho(100); await p7.capVt(); await p7.keo([200, 200], [300, 260]); await p7.luuAnh()
  kiem(T('luu tiep sau khi xoa ban sach: KHONG tao lai lop sua'), !lopSua.doc(f3) && !conFileSach(lopSua, 's2c.png'))
  p7.dong()

  // ── doi ty le: luu o dpr 2 (man 200 %), ghim o he so 1,25 ──
  const f4 = path.join(GOC, 'anh', 's2d.png'); taoAnhPng(f4, 600, 400, () => XAM)
  const sachBuf = fs.readFileSync(f4)
  lopSua.ghi(f4, { shapes: [{ type: 'rect', x1: 50, y1: 50, x2: 100, y2: 100, color: '#f86820' }, { type: 'text', x: 20, y: 20, text: 'a', color: '#ffffff', size: 18 }], dpr: 2, dipW: 300, dipH: 200, sach: sachBuf })
  const p8 = await moPin(f4, 480, 320)
  await cho(250); await p8.phim('1'); await cho(200)
  const d8 = JSON.parse(await p8.o('__s.ds()'))
  kiem(T('doi ty le (luu dpr 2, ghim he so 1,25): net cu dat dung cho tren anh (50 DIP @2 -> 80 DIP @1,25), co chu doi theo'), d8.length === 2 && gan(d8[0].x1, 80, 0.01) && gan(d8[0].x2, 160, 0.01) && gan(d8[1].size, 28.8, 0.01), JSON.stringify(d8.map((s) => [s.x1, s.x2, s.size])))
  p8.dong()
}

/* ════ S3: CAT BO KHUC GIUA ════ */
KICH_BAN.S3 = async () => {
  const T = (t) => '[S3] ' + t
  const f = path.join(GOC, 'anh', 's3.png'); taoAnhPng(f, 900, 600, nenKeMau)
  const p = await moPin(f, 600, 400)
  await p.phim('1'); await cho(150); await p.capVt()
  await p.keo([40, 40], [140, 100])    // A: o dai do, truoc dai cat
  await p.keo([200, 220], [300, 260])  // B: sau dai cat
  await p.keo([300, 150], [380, 250])  // C: vat ngang qua dai cat (y 100..200)
  await p.keo([20, 120], [100, 180])   // D: nam han trong dai cat
  const truoc = await p.o('__s.ds()')
  kiem(T('ve 4 khung A B C D'), JSON.parse(truoc).length === 4)
  kiem(T('nut cat co mat tren thanh cong cu anh ghim (phim X)'), (await p.o('!!document.querySelector(\'.cong-cu[data-tool="cat"]\')')) === true)
  await p.phim('x'); await cho(60)
  kiem(T('phim X chon cong cu cat'), (await p.o('tool')) === 'cat', await p.o('tool'))
  await p.keo([10, 100], [10, 200]) // keo doc 100 DIP -> dai NGANG y 100..200 (= 150..300 px)
  let d = await p.choNap(450)
  kiem(T('cat dai ngang: anh con 900x450 va kich thuoc hien 600x300'), d.nw === 900 && d.nh === 450 && d.dip.w === 600 && d.dip.h === 300, JSON.stringify(d))
  kiem(T('cat dai ngang: cua so duoc bao doi kich thuoc (pin:doi-co) 600x300'), doiCo.length > 0 && doiCo[doiCo.length - 1][0] === 600 && doiCo[doiCo.length - 1][1] === 300, JSON.stringify(doiCo[doiCo.length - 1]))
  const sau = JSON.parse(await p.o('__s.ds()'))
  kiem(T('net nam han trong dai (D) bi bo: con 3 net'), sau.length === 3, sau.length)
  kiem(T('net truoc dai (A) dung yen; net sau dai (B) lui dung 100 DIP; net vat qua dai (C) kep vao cho noi'),
    sau[0].y1 === 40 && sau[0].y2 === 100 && gan(sau[1].y1, 120, 0.01) && gan(sau[1].y2, 160, 0.01) && gan(sau[2].y1, 100, 0.01) && gan(sau[2].y2, 150, 0.01) && sau[1].x1 === 200, JSON.stringify(sau.map((s) => [s.y1, s.y2])))
  const trongCat = await p.o('JSON.stringify(shapes)')
  await p.phim('Z', [p.ctrl]); await cho(60); d = await p.choNap(600)
  const hoan = await p.o('__s.ds()')
  kiem(T('Hoan tac (Ctrl+Z): anh tro ve 900x600, hien 600x400, cua so ve 600x400'), d.nw === 900 && d.nh === 600 && d.dip.h === 400 && doiCo[doiCo.length - 1][1] === 400, JSON.stringify(d) + ' ' + JSON.stringify(doiCo[doiCo.length - 1]))
  kiem(T('Hoan tac: ca 4 net tro ve DUNG vi tri cu (ke ca net D da bi bo)'), hoan === truoc)
  await p.phim('Z', [p.ctrl, 'shift']); await cho(60); d = await p.choNap(450)
  kiem(T('Lam lai (Ctrl+Shift+Z): cat lai, anh 900x450, net dung nhu sau cat'), d.nh === 450 && d.dip.h === 300 && (await p.o('__s.ds()')) === trongCat, JSON.stringify(d))
  const r = await p.luuAnh()
  if (!r) { kiem(T('luu duoc'), false); return }
  const A = docAnh(r.dataUrl)
  kiem(T('anh luu ra DUNG kich thuoc moi 900x450'), A.rong === 900 && A.cao === 450, A.rong + 'x' + A.cao)
  kiem(T('anh luu: dai do con nguyen o tren (px y=75), dai luc bi bo, dai xanh dinh ngay duoi (px y=200), dai vang o cuoi (px y=400)'), gan3(A.diem(750, 75), DO) && gan3(A.diem(750, 200), XANH) && gan3(A.diem(750, 400), VANG) && !gan3(A.diem(750, 200), LUC), JSON.stringify([A.diem(750, 75), A.diem(750, 200), A.diem(750, 400)]))
  kiem(T('anh luu: net B dich theo (canh trai cua B o DIP x=200, y=140 -> px 300,210) van mau cam'), laCam(A.diem(300, 210)), JSON.stringify(A.diem(300, 210)))
  kiem(T('anh luu: cho cu cua B (px y=330..390) khong con net (da dich)'), !laCam(A.diem(300, 360)), JSON.stringify(A.diem(300, 360)))
  kiem(T('luu kem lop sua theo kich thuoc moi: dip 600x300, anh sach la ban DA CAT 900x450'), r.lop && r.lop.dipW === 600 && r.lop.dipH === 300 && typeof r.lop.sach === 'string' && docAnh(r.lop.sach).cao === 450 && gan3(docAnh(r.lop.sach).diem(750, 200), XANH))
  const dsLuu = lopSua.doc(f)
  kiem(T('lop sua tren dia: 3 net, dipH 300'), !!dsLuu && dsLuu.bang.shapes.length === 3 && dsLuu.bang.dipH === 300)
  p.dong()

  // mo lai anh da cat: net B o dung cho tren anh moi
  const pb = await moPin(f, 600, 300)
  await cho(250); await pb.phim('1'); await cho(250); await pb.capVt()
  const dsb = JSON.parse(await pb.o('__s.ds()'))
  kiem(T('mo lai anh da cat: 3 net cu o cho moi (B: y 120..160)'), dsb.length === 3 && gan(dsb[1].y1, 120, 0.5) && gan(dsb[1].y2, 160, 0.5), JSON.stringify(dsb.map((s) => [s.y1, s.y2])))
  pb.dong()

  // cat dai DOC (keo ngang nhieu hon)
  const f2 = path.join(GOC, 'anh', 's3b.png'); taoAnhPng(f2, 900, 600, nenKeMau)
  const pc = await moPin(f2, 600, 400)
  await pc.phim('1'); await cho(150); await pc.capVt()
  await pc.keo([400, 50], [500, 100]) // khung E sau dai doc
  await pc.phim('X'); await pc.keo([150, 30], [250, 34])   // keo ngang 100, doc 4 -> dai DOC x 150..250
  d = await pc.choNap(0); for (let i = 0; i < 60 && d.nw !== 750; i++) { await cho(50); d = await pc.o('__s.dai()') }
  const dse = JSON.parse(await pc.o('__s.ds()'))
  kiem(T('cat dai doc: anh 750x600, hien 500x400, cua so 500x400'), d.nw === 750 && d.nh === 600 && d.dip.w === 500 && d.dip.h === 400 && doiCo[doiCo.length - 1][0] === 500, JSON.stringify(d))
  kiem(T('cat dai doc: net sau dai lui 100 DIP theo chieu ngang (300..400)'), dse.length === 1 && gan(dse[0].x1, 300, 0.01) && gan(dse[0].x2, 400, 0.01) && dse[0].y1 === 50, JSON.stringify(dse.map((s) => [s.x1, s.x2])))
  // cat qua tay: khong duoc de lai < 8 px; keo qua ngan (< 4 DIP) khong cat
  await pc.keo([10, 1], [10, 399]); await cho(100)
  const d2 = await pc.o('__s.dai()')
  kiem(T('keo dai gan het chieu cao (con lai < 8 px): KHONG cat'), d2.nh === 600 && d2.dip.h === 400, JSON.stringify(d2.dip))
  await pc.keo([10, 100], [10, 102]); await cho(80)
  kiem(T('keo qua ngan (2 DIP): KHONG cat'), (await pc.o('__s.dai().nh')) === 600)
  // Esc: tra ve het
  await pc.phim('Escape'); await cho(100)
  d = await pc.choNap(0)
  for (let i = 0; i < 60 && d.nw !== 900; i++) { await cho(50); d = await pc.o('__s.dai()') }
  kiem(T('Esc sau khi cat (khong luu): anh 900x600 nhu cu, hien 600x400, cua so tra ve 600x400'), d.nw === 900 && d.nh === 600 && d.dip.w === 600 && d.dip.h === 400 && doiCo[doiCo.length - 1][0] === 600 && doiCo[doiCo.length - 1][1] === 400 && d.mode === 'view', JSON.stringify(d) + ' ' + JSON.stringify(doiCo[doiCo.length - 1]))
  pc.dong()

  // mep cat ro
  const dem = async (A, y0, y1) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = 0; x < A.rong; x += 3) if (laTrang(A.diem(x, y))) n++; return n }
  for (const mep of [false, true]) {
    const fm = path.join(GOC, 'anh', 's3m' + (mep ? 'a' : 'b') + '.png'); taoAnhPng(fm, 900, 600, nenKeMau)
    const pm = await moPin(fm, 600, 400)
    await pm.phim('X'); await cho(150); await pm.capVt()
    if (mep) { await pm.bamPT('#mau-hien'); await pm.bamPT('#cat-mep'); await pm.phim('Escape') }
    await pm.keo([10, 100], [10, 200])
    await pm.choNap(450)
    const rm = await pm.luuAnh()
    const Am = rm && docAnh(rm.dataUrl)
    if (!Am) { kiem(T('luu duoc (mep ' + mep + ')'), false); pm.dong(); continue }
    const trang = await dem(Am, 140, 160)
    if (mep) kiem(T('mep cat ro BAT: co duong rang cua trang o cho noi (px y=150), >= 60 diem trang'), trang >= 60 && Am.cao === 450, 'diem trang ' + trang)
    else kiem(T('mep cat ro TAT: cho noi sach, khong co diem trang'), trang === 0 && Am.cao === 450, 'diem trang ' + trang)
    pm.dong()
  }
}

/* ════ S4: MAN CHUP gui lop sua ════ */
KICH_BAN.S4 = async () => {
  const T = (t) => '[S4] man chup: ' + t
  const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  nghe(ov, 'man chup')
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 }, veTay: true })
  ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
  await cho(450)
  if (HONG === 'overlayKhongLop') await js(ov, 'luuLopSuaBat = false; true')
  const wc = ov.webContents
  const m = async (loai, x, y) => { wc.sendInputEvent({ type: loai, x, y, button: 'left', clickCount: 1 }); await cho(22) }
  const phim = async (k) => { wc.focus(); wc.sendInputEvent({ type: 'keyDown', keyCode: k }); await cho(15); wc.sendInputEvent({ type: 'keyUp', keyCode: k }); await cho(40) }
  const vt = await js(ov, '(() => { const r = veEl.getBoundingClientRect(); return { l: r.left, t: r.top } })()')
  kiem(T('lop sua: nho veTay tu cau hinh: cong tac bat san'), (await js(ov, 'NetTay.dangBat()')) === true && (await js(ov, 'document.getElementById("kieu-tay").getAttribute("aria-pressed")')) === 'true')
  await phim('1'); await cho(120)
  const a = [Math.round(vt.l + 60), Math.round(vt.t + 60)], b = [Math.round(vt.l + 260), Math.round(vt.t + 160)]
  await m('mouseMove', a[0], a[1]); await m('mouseDown', a[0], a[1]); for (let i = 1; i <= 4; i++) await m('mouseMove', Math.round(a[0] + (b[0] - a[0]) * i / 4), Math.round(a[1] + (b[1] - a[1]) * i / 4)); await m('mouseUp', b[0], b[1])
  kiem(T('lop sua: khung ve tay (tay: true) tren man chup'), (await js(ov, 'shapes.length === 1 && shapes[0].tay === true && shapes[0].seed > 0')) === true)
  xacNhan = null
  await js(ov, `(async () => { const c = document.createElement('canvas'); c.width = Math.round(innerWidth * DPR); c.height = Math.round(innerHeight * DPR); const x = c.getContext('2d'); x.fillStyle = 'rgb(64,64,64)'; x.fillRect(0, 0, c.width, c.height); const im = new Image(); im.src = c.toDataURL(); await im.decode(); frozenImg = im; return true })()`)
  await js(ov, 'document.getElementById("xong").click()')
  for (let i = 0; i < 60 && !xacNhan; i++) await cho(50)
  const pl = xacNhan
  if (!pl || !pl.dataUrl) { kiem(T('lop sua: nhan duoc payload Xong'), false); return }
  const lop = pl.lop
  kiem(T('lop sua: payload co lop sua: 1 net + anh sach + dpr ' + TI_LE + ' + dip 600x400'), !!lop && lop.shapes.length === 1 && lop.shapes[0].tay === true && gan(lop.dpr, Number(TI_LE), 0.001) && lop.dipW === 600 && lop.dipH === 400 && typeof lop.sach === 'string' && lop.sach.startsWith('data:image/png'), lop ? lop.shapes.length + ' net dpr ' + lop.dpr : 'khong co lop')
  if (lop) {
    const Ax = docAnh(pl.dataUrl), S = docAnh(lop.sach), sc = Number(TI_LE)
    kiem(T('lop sua: anh sach cung kich thuoc anh luu va CHUA co net (canh tren khung la nen xam)'), S.rong === Ax.rong && S.cao === Ax.cao && gan3(S.diem(160 * sc, 60 * sc), XAM, 6) && gan3(S.diem(160 * sc, 61 * sc), XAM, 6), JSON.stringify(S.diem(160 * sc, 60 * sc)))
    let camAnh = 0, camSach = 0
    for (let x = 70; x < 250; x += 2) for (let y = 55; y < 66; y++) { if (laCam(Ax.diem(x * sc, y * sc))) { camAnh++; break } }
    for (let x = 70; x < 250; x += 2) for (let y = 55; y < 66; y++) { if (laCam(S.diem(x * sc, y * sc))) { camSach++; break } }
    kiem(T('lop sua: anh luu CO net cam o canh tren, anh sach KHONG co'), camAnh >= 70 && camSach === 0, 'anh ' + camAnh + ' sach ' + camSach)
  }
  ov.destroy()
}

app.whenReady().then(async () => {
  try {
    const muon = { tayTat: ['S1'], khongLop: ['S2'], lopKhongNap: ['S2'], catKhongDich: ['S3'], catKhongHoanTac: ['S3'], overlayKhongLop: ['S4'] }[HONG] || (process.env.AIO_KB ? process.env.AIO_KB.split(',') : ['S1', 'S2', 'S3', 'S4'])
    for (const k of muon) {
      try { await KICH_BAN[k]() } catch (e) { kiem('Kich ban ' + k + ' chay khong nem loi', false, e && e.message) }
    }
  } catch (e) {
    kiem('Chay kich ban khong nem loi', false, e && e.message)
  }
  console.log('KQ=' + JSON.stringify({ kq, loiTrang }))
  app.exit(0)
})
