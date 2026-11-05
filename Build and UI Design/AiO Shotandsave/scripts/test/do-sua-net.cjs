'use strict'
/* =========================================================================
   Do SUA NET DA VE (05/11/2026, ROADMAP 0i #8) — chay bang: npm run test:suanet
   Cong cu chon (phim V) tren MAN CHUP (overlay) va ANH GHIM (pin): bam vao khung / chu / so / net but / mui ten thi hien khung chon
   co tay nam; keo goc de co gian, keo tay xoay de xoay, keo tung dau mui ten; Delete xoa; Hoan tac / Lam lai ghi nhan TAT CA.
   CHAY AN: 2 cua so offscreen (show:false) nap THAT src/overlay/index.html + src/pin/index.html voi preload that. Chuot / phim la
   webContents.sendInputEvent (su kien input that cua Chromium, KHONG phai dispatchEvent). Khong cuop chuot cua nguoi dung,
   khong dung thu muc anh that / %APPDATA% (userData rieng trong .selftest/sua-net).
   Doc: mang shapes (JSON), diem anh tren canvas ve DANG HIEN, va diem anh cua ANH XUAT RA (man chup: overlay:confirm dataUrl;
   anh ghim: pin:save-edit) o ti le man 100 % va 150 % (force-device-scale-factor).
   DOI CHUNG: cuoc chay nao co y lam hong (keo khong lam gi / khong ghi lich su / ve bo qua goc xoay / xuat bo qua goc xoay) thi bai
   PHAI trượt dung muc tuong ung.
   Cach chay: node scripts/test/do-sua-net.cjs   (tu goi Electron; can NODE_PATH tro node_modules neu worktree khong co)
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')

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
  const RA = path.join(ROOT, '.selftest', 'sua-net')
  fs.mkdirSync(RA, { recursive: true })
  const chay = (tiLe, hong) => {
    for (let lan = 0; lan < 2; lan++) { // may ban (9 agent chay cung luc): truot do het gio / loi chay thi thu lai MOT lan
      const r = spawnSync(electron, [__filename, RA, String(tiLe), hong || ''], { env, encoding: 'utf8', timeout: 240000 })
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
  in_(chay(1), 'Man 100 % (man chup + anh ghim)')
  in_(chay(1.5), 'Man 150 % (man chup + anh ghim)')
  const doiChung = [
    ['keo', /co gian|xoay|dau mui ten|Doi chung/i, 'tay nam keo khong lam gi'],
    ['lichsu', /Hoan tac|Lam lai|lich su/i, 'khong ghi lich su cho thao tac sua'],
    ['xuat', /anh xuat/i, 'xuat anh ghim bo qua goc xoay (khac thu nhin thay)'],
    ['xoayve', /xoay/i, 've bo qua goc xoay']
  ]
  console.log('\n== DOI CHUNG (co y lam hong, bai do PHAI trượt) ==')
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
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData-' + TI_LE + (HONG ? '-' + HONG : '')))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
// Luat 05/11: dau ra bi dong (EPIPE) khong duoc bat hop loi Electron len man nguoi dung
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.error(e) } catch (_) {} app.exit(1) })
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 200 giay'), 200000)

let xacNhan = null, luuGhim = null
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('overlay:confirm', (_e, p) => { xacNhan = p })
ipcMain.on('pin:save-edit', (_e, d) => { luuGhim = d })

const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
const loiTrang = []
const js = (w, s) => w.webContents.executeJavaScript(s, true)
const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => { if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2.*Content Security Policy/.test(msg || e.message || '')) loiTrang.push(ten + ': ' + (msg || e.message)) })
const gan = (a, b, sai) => Math.abs(a - b) <= sai

/* Lam hong co chu y (DOI CHUNG) */
const LAM_HONG = {
  keo: 'SuaNet.keo = function () {}; true',
  lichsu: 'SuaNet.ghiSua = function () { return false }; true',
  xuat: 'veShape = (function (goc) { return function (ctx, s, k) { if (s.rot && k !== undefined && k !== 1) { s = Object.assign({}, s, { rot: 0 }) } return goc(ctx, s, k) } })(veShape); true',
  xoayve: 'veShape = (function (goc) { return function (ctx, s, k) { if (s.rot) { s = Object.assign({}, s, { rot: 0 }) } return goc(ctx, s, k) } })(veShape); true'
}

const TRO_GIUP = `
window.__s = {
  ds: () => JSON.stringify(shapes),
  vt: () => { const r = veEl.getBoundingClientRect(); return { l: r.left, t: r.top } },
  tay: (i) => SuaNet.tay(shapes[i]),
  hop: (i) => SuaNet.hop(shapes[i]),
  chon: () => shapes.indexOf(selectedShape),
  px: (lx, ly, sc) => { const d = veCtx.getImageData(Math.floor(lx * sc), Math.floor(ly * sc), 1, 1).data; return [d[0], d[1], d[2], d[3]] },
  dai: () => ({ lichSu: SuaNet.lichSu.length, redo: SuaNet.redo.length, nutRedo: document.getElementById('redo').disabled })
}
true`

function docAnh(dataUrl) {
  const im = nativeImage.createFromDataURL(dataUrl), kt = im.getSize(), bmp = im.toBitmap()
  const diem = (x, y) => { const i = (Math.floor(y) * kt.width + Math.floor(x)) * 4; return [bmp[i + 2], bmp[i + 1], bmp[i], bmp[i + 3]] } // BGRA -> RGBA
  return { rong: kt.width, cao: kt.height, diem }
}

/* Kich ban dung chung cho 2 trang. `P` = { ten, win, anh (loai: 'overlay' | 'pin'), thuDat() lay anh xuat } */
async function chayKichBan(P) {
  const wc = P.win.webContents
  const o = (s) => js(P.win, s)
  const ten = (t) => P.ten + ': ' + t
  const T = [] // T[i] = trang thai shapes sau thao tac thu i (de duyet Hoan tac / Lam lai)
  const chup = async () => T.push(await o('__s.ds()'))
  let vt = await o('__s.vt()') // anh ghim: canvas ve chi hien sau khi vao che do ve -> do lai sau phim dau tien
  const trang = (lx, ly) => [Math.round(vt.l + lx), Math.round(vt.t + ly)] // toa do cuc bo canvas -> toa do trang
  const m = async (loai, x, y, shift) => { wc.sendInputEvent({ type: loai, x, y, button: 'left', clickCount: 1, modifiers: shift ? ['shift'] : [] }); await cho(22) }
  const keoTrang = async (a, b, shift) => { // keo chuot THAT: xuong -> vai buoc -> len
    await m('mouseMove', a[0], a[1], shift); await m('mouseDown', a[0], a[1], shift)
    for (let i = 1; i <= 4; i++) await m('mouseMove', Math.round(a[0] + (b[0] - a[0]) * i / 4), Math.round(a[1] + (b[1] - a[1]) * i / 4), shift)
    await m('mouseUp', b[0], b[1], shift)
  }
  const keo = (a, b, shift) => keoTrang(trang(a[0], a[1]), trang(b[0], b[1]), shift)
  const bamNut = async (lx, ly) => { const p = trang(lx, ly); await m('mouseMove', p[0], p[1]); await m('mouseDown', p[0], p[1]); await m('mouseUp', p[0], p[1]) }
  const phim = async (keyCode, mods) => { wc.focus(); wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mods || [] }); await cho(15); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mods || [] }); await cho(30) }
  const ctrl = process.platform === 'darwin' ? 'meta' : 'control'
  const tayCua = async (i, k) => (await o('__s.tay(' + i + ')')).find((t) => t.k === k)
  /* keo tay nam `k` cua shape i tu vi tri that cua no them (dx, dy) */
  const keoTay = async (i, k, dx, dy, shift) => {
    const t = await tayCua(i, k)
    if (!t) throw new Error('khong co tay ' + k + ' cua shape ' + i)
    const a = trang(t.x, t.y)
    await keoTrang(a, [a[0] + dx, a[1] + dy], shift)
  }
  /* keo tay xoay cua shape i toi vi tri man hinh (cuc bo) (lx, ly) */
  const xoayToi = async (i, lx, ly, shift) => {
    const t = await tayCua(i, 'xoay')
    await keoTrang(trang(t.x, t.y), trang(lx, ly), shift)
  }
  const chonBangChuot = async (lx, ly) => { await phim('V'); await bamNut(lx, ly) }

  // ── 1. VE 5 net bang chuot that: khung, chu, mui ten, but, so ──
  await phim('1'); await cho(150); vt = await o('__s.vt()')
  await keo([40, 40], [150, 100]); await chup()
  await phim('3'); await bamNut(260, 50)
  await o(`{ const ta = document.querySelector('.go-chu'); ta.value = 'Ghi chu'; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) }`)
  await cho(60); await chup()
  await phim('2'); await keo([40, 200], [200, 240]); await chup()
  await phim('7')
  { const a = trang(300, 150); await m('mouseMove', a[0], a[1]); await m('mouseDown', a[0], a[1])
    for (const p of [[340, 170], [380, 190], [420, 170], [460, 150], [520, 210]]) { const q = trang(p[0], p[1]); await m('mouseMove', q[0], q[1]) }
    const z = trang(520, 210); await m('mouseUp', z[0], z[1]) }
  await chup()
  await phim('6'); await bamNut(500, 40); await chup()
  const loai = await o('shapes.map((s) => s.type).join(",")')
  kiem(ten('ve 5 net bang chuot that: khung, chu, mui ten, but, so'), loai === 'rect,text,arrow,but,so', loai)

  // ── 2. KHUNG: chon, co gian goc se, xoay 90 do ──
  if (P.loai === 'pin') { const tb = await o('document.getElementById("toolbar").getBoundingClientRect().top'); kiem(ten('thanh cong cu nam duoi vung thu (y >= 262), khong chan chuot that'), tb - vt.t >= 262, 'top ' + Math.round(tb - vt.t)) }
  await chonBangChuot(100, 70)
  const dau = await o('__s.chon()'), tayKhung = await o('__s.tay(0)')
  kiem(ten('V + bam vao khung: chon duoc khung, hien 4 tay goc + 1 tay xoay'), dau === 0 && tayKhung.filter((t) => t.loai === 'goc').length === 4 && tayKhung.some((t) => t.loai === 'xoay'), 'chon ' + dau + ', tay ' + tayKhung.map((t) => t.k).join(','))
  const k0 = JSON.parse(T[0])[0]
  await keoTay(0, 'se', 50, 40); await chup()
  let r1 = (await o('JSON.parse(__s.ds())'))[0]
  kiem(ten('Co gian khung: keo goc se (+50, +40) thi goc duoi-phai doi dung (40..200 x 40..140), goc tren-trai dung yen'),
    gan(r1.x2, 200, 2) && gan(r1.y2, 140, 2) && gan(r1.x1, k0.x1, 0.5) && gan(r1.y1, k0.y1, 0.5), JSON.stringify([r1.x1, r1.y1, r1.x2, r1.y2]))
  await xoayToi(0, 240, 90); await chup()
  r1 = (await o('JSON.parse(__s.ds())'))[0]
  kiem(ten('Xoay khung: keo tay xoay sang ben phai tam thi goc = 90 do'), gan(r1.rot, Math.PI / 2, 0.02), 'rot ' + (r1.rot && r1.rot.toFixed(4)))

  // ── 3. CHU: co gian goc se, xoay co Shift nhay 15 do ──
  const chu0 = JSON.parse(await o('__s.ds()'))[1]
  await chonBangChuot(275, 62)
  kiem(ten('V + bam vao chu: chon duoc chu'), (await o('__s.chon()')) === 1)
  await keoTay(1, 'se', 40, 20); await chup()
  const chu1 = JSON.parse(await o('__s.ds()'))[1]
  kiem(ten('Co gian chu: keo goc se thi co chu to len (khong chi doi o chon)'), chu1.size > chu0.size * 1.2 && chu1.size < chu0.size * 3, 'size ' + chu0.size + ' -> ' + (chu1.size && chu1.size.toFixed(1)))
  kiem(ten('Co gian chu: goc tren-trai chu dung yen'), gan(chu1.x, chu0.x, 1.5) && gan(chu1.y, chu0.y, 1.5), JSON.stringify([chu0.x, chu0.y]) + ' -> ' + JSON.stringify([+chu1.x.toFixed(1), +chu1.y.toFixed(1)]))
  { const h = await o('__s.hop(1)'); const g = 47 * Math.PI / 180
    await xoayToi(1, h.cx + 100 * Math.sin(g), h.cy - 100 * Math.cos(g), true) }
  await chup()
  const chu2 = JSON.parse(await o('__s.ds()'))[1]
  kiem(ten('Xoay chu co giu Shift: 47 do nhay ve 45 do'), gan(chu2.rot, Math.PI / 4, 0.001), 'rot ' + (chu2.rot && (chu2.rot * 180 / Math.PI).toFixed(3)))

  // ── 4. SO: xoay ──
  await chonBangChuot(500, 40)
  const tayS = await o('__s.tay(4)')
  kiem(ten('V + bam vao so: chon duoc so; so chi co tay xoay (khong co tay goc)'), (await o('__s.chon()')) === 4 && tayS.map((t) => t.loai).join() === 'xoay')
  kiem(ten('So sat mep tren: tay xoay lat xuong DUOI so (khong bi cat ngoai canvas)'), tayS[0].y > 40 && tayS[0].y < 400, 'tay y ' + (tayS[0] && tayS[0].y))
  await xoayToi(4, 599, 40); await chup()
  const so1 = JSON.parse(await o('__s.ds()'))[4]
  kiem(ten('Xoay so: so xoay 90 do quanh tam, tam khong doi'), gan(Math.abs(so1.rot), Math.PI / 2, 0.02) && so1.x === 500 && gan(so1.y, 40, 1.5), 'rot ' + (so1.rot && so1.rot.toFixed(3)) + ' tam ' + so1.x + ',' + so1.y)

  // ── 5. MUI TEN: keo tung dau ──
  const a0 = JSON.parse(await o('__s.ds()'))[2]
  await chonBangChuot(120, 220)
  kiem(ten('V + bam vao mui ten: chon duoc, hien 2 tay o 2 dau'), (await o('__s.chon()')) === 2 && (await o('__s.tay(2)')).map((t) => t.k).join() === 'p1,p2')
  await keoTay(2, 'p2', 40, -60); await chup()
  let a1 = JSON.parse(await o('__s.ds()'))[2]
  kiem(ten('Keo dau mui ten (dau nhon): chi dau do di chuyen, dau kia dung yen'), gan(a1.x2, a0.x2 + 40, 1.5) && gan(a1.y2, a0.y2 - 60, 1.5) && a1.x1 === a0.x1 && a1.y1 === a0.y1, JSON.stringify([a1.x1, a1.y1, a1.x2, a1.y2]))
  await keoTay(2, 'p1', -20, 10); await chup()
  a1 = JSON.parse(await o('__s.ds()'))[2]
  kiem(ten('Keo dau con lai (duoi): dau nhon dung yen'), gan(a1.x1, a0.x1 - 20, 1.5) && gan(a1.y1, a0.y1 + 10, 1.5) && gan(a1.x2, a0.x2 + 40, 1.5) && gan(a1.y2, a0.y2 - 60, 1.5), JSON.stringify([a1.x1, a1.y1, a1.x2, a1.y2]))

  // ── 6. NET BUT: co gian, di chuyen, doi mau, phim mui ten ──
  const n0 = JSON.parse(await o('__s.ds()'))[3]
  const bb0 = (() => { const x = n0.pts.filter((_, i) => i % 2 === 0), y = n0.pts.filter((_, i) => i % 2 === 1); return { x0: Math.min(...x), x1: Math.max(...x), y0: Math.min(...y), y1: Math.max(...y) } })()
  await chonBangChuot(n0.pts[2], n0.pts[3])
  kiem(ten('V + bam vao net but: chon duoc net, hien 4 tay goc, khong co tay xoay'), (await o('__s.chon()')) === 3 && (await o('__s.tay(3)')).map((t) => t.loai).join() === 'goc,goc,goc,goc', 'tay ' + (await o('__s.tay(3)')).map((t) => t.loai).join())
  await keoTay(3, 'se', 50, 30); await chup()
  const n1 = JSON.parse(await o('__s.ds()'))[3]
  const bb1 = (() => { const x = n1.pts.filter((_, i) => i % 2 === 0), y = n1.pts.filter((_, i) => i % 2 === 1); return { x0: Math.min(...x), x1: Math.max(...x), y0: Math.min(...y), y1: Math.max(...y) } })()
  kiem(ten('Co gian net but: goc duoi-phai di (+50, +30), goc tren-trai dung yen, so diem khong doi'),
    gan(bb1.x1, bb0.x1 + 50, 2) && gan(bb1.y1, bb0.y1 + 30, 2) && gan(bb1.x0, bb0.x0, 0.5) && gan(bb1.y0, bb0.y0, 0.5) && n1.pts.length === n0.pts.length,
    JSON.stringify(bb0) + ' -> ' + JSON.stringify({ x1: +bb1.x1.toFixed(1), y1: +bb1.y1.toFixed(1) }))
  // keo than net (khong dung tay): lay trung diem giua diem 1 va 2 (nam tren duong cong)
  { const mid = [(n1.pts[2] + n1.pts[4]) / 2, (n1.pts[3] + n1.pts[5]) / 2]
    await phim('V'); await keo(mid, [mid[0] - 30, mid[1] - 20]); await chup() }
  const n2 = JSON.parse(await o('__s.ds()'))[3]
  kiem(ten('Keo than net (khong keo tay): ca net doi (-30, -20)'), gan(n2.pts[0], n1.pts[0] - 30, 1.5) && gan(n2.pts[1], n1.pts[1] - 20, 1.5) && gan(n2.pts[n2.pts.length - 1], n1.pts[n1.pts.length - 1] - 20, 1.5))
  await o(`toolbarEl.querySelector('.mau[data-color="#ffcc00"]').click()`); await chup()
  const n3 = JSON.parse(await o('__s.ds()'))[3]
  kiem(ten('Doi mau net dang chon sang vang'), n3.color === '#ffcc00', n3.color)
  await phim('Right'); await chup()
  const n4 = JSON.parse(await o('__s.ds()'))[3]
  kiem(ten('Phim mui ten phai doi net +1 px'), gan(n4.pts[0], n3.pts[0] + 1, 0.01), n3.pts[0] + ' -> ' + n4.pts[0])

  // ── 7. XOA ──
  await chonBangChuot(500, 40)
  const truocXoa = await o('shapes.length')
  await phim('Delete'); await chup()
  kiem(ten('Delete xoa dung so dang chon (con 4 net)'), truocXoa === 5 && (await o('shapes.length')) === 4 && (await o('shapes.map((s) => s.type).join()')) === 'rect,text,arrow,but')

  // ── 8. HOAN TAC / LAM LAI duyet TUNG buoc ──
  const SO_OP = T.length // 5 them + 12 thao tac (gom ca xoa)
  kiem(ten('Lich su: da ghi ' + SO_OP + ' thao tac (5 ve + 11 sua + 1 xoa)'), SO_OP === 17 && (await o('__s.dai().lichSu')) === 17, 'lichSu ' + (await o('__s.dai().lichSu')))
  let okUndo = true, chiTietUndo = ''
  for (let i = SO_OP - 1; i >= 0; i--) {
    await phim('Z', [ctrl])
    const mong = i === 0 ? '[]' : T[i - 1]
    const that = await o('__s.ds()')
    if (that !== mong) { okUndo = false; chiTietUndo += ' sau Ctrl+Z #' + (SO_OP - i) + ' (thao tac ' + (i + 1) + ') khac trang thai truoc do;'; break }
  }
  kiem(ten('Hoan tac (Ctrl+Z) lan luot ' + SO_OP + ' lan: moi buoc ve DUNG trang thai truoc thao tac do, het thi trong tron'), okUndo && (await o('shapes.length')) === 0, chiTietUndo)
  kiem(ten('Sau khi hoan tac het: nut Lam lai sang, lich su trong'), (await o('__s.dai().nutRedo')) === false && (await o('__s.dai().lichSu')) === 0)
  let okRedo = true, chiTietRedo = ''
  for (let i = 0; i < SO_OP; i++) {
    await phim('Z', [ctrl, 'shift'])
    const that = await o('__s.ds()')
    if (that !== T[i]) { okRedo = false; chiTietRedo += ' sau Lam lai #' + (i + 1) + ' khac trang thai thao tac do;'; break }
  }
  kiem(ten('Lam lai (Ctrl+Shift+Z) lan luot ' + SO_OP + ' lan: moi buoc ra DUNG trang thai thao tac do'), okRedo && (await o('__s.ds()')) === T[SO_OP - 1], chiTietRedo)
  await phim('Z', [ctrl]); await phim('Z', [ctrl]); await phim('Y', [ctrl])
  kiem(ten('Lam lai bang Ctrl+Y sau 2 lan hoan tac: ra dung trang thai thao tac #' + (SO_OP - 1)), (await o('__s.ds()')) === T[SO_OP - 2])
  await phim('Y', [ctrl])
  // Hoan tac roi ve MOT net moi thi hang doi lam lai bi xoa
  await phim('Z', [ctrl]); await phim('1'); await keo([300, 20], [380, 70])
  kiem(ten('Ve net moi sau khi hoan tac: nut Lam lai khoa lai (hang doi xoa)'), (await o('__s.dai().redo')) === 0 && (await o('__s.dai().nutRedo')) === true)
  await phim('Z', [ctrl])
  // dua ve trang thai cuoi: chon so roi Delete lai (thao tac moi, ket qua giong T[SO_OP-1])
  await chonBangChuot(500, 40); await phim('Delete')
  kiem(ten('Tro ve trang thai cuoi truoc khi xuat anh'), (await o('__s.ds()')) === T[SO_OP - 1])

  // ── 9. DIEM ANH: canvas DANG HIEN va ANH XUAT RA ──
  const fin = JSON.parse(await o('__s.ds()'))
  const hopChu = await o('__s.hop(1)')
  await o('selectedShape = null; redraw()') // bo khung chon truoc khi chup canvas / xuat
  const sc = await P.heSo() // so diem anh tren moi DIP cua anh xuat
  const mau = []
  for (let lx = 10; lx < 600; lx += 37) for (let ly = 10; ly < 400; ly += 29) mau.push([lx, ly])
  const live = await o('(() => { const sc = DPR, out = []; for (const [lx, ly] of ' + JSON.stringify(mau) + ') out.push(veCtx.getImageData(Math.floor(lx * sc), Math.floor(ly * sc), 1, 1).data[3]); return out })()')
  const xuat = await P.xuat()
  if (!xuat) { kiem(ten('Nhan duoc anh xuat'), false, 'khong nhan duoc'); return }
  const A = docAnh(xuat)
  const dienTich = 'anh xuat ' + A.rong + 'x' + A.cao
  const laNen = (px) => (P.loai === 'overlay' ? px[3] < 12 : Math.abs(px[0] - 64) + Math.abs(px[1] - 64) + Math.abs(px[2] - 64) <= 12)
  const khacNen = (px) => (P.loai === 'overlay' ? px[3] > 150 : Math.abs(px[0] - 64) + Math.abs(px[1] - 64) + Math.abs(px[2] - 64) > 40)
  const laCam = (px) => px[0] > 200 && px[1] > 70 && px[1] < 150 && px[2] < 90 && px[3] > 200
  const laVang = (px) => px[0] > 200 && px[1] > 150 && px[2] < 90 && px[3] > 200
  const xa = (lx, ly) => A.diem(lx * sc, ly * sc)
  kiem(ten('Anh xuat co kich thuoc dung (' + dienTich + ')'), P.loai === 'overlay' ? (A.rong === Math.round(600 * Number(TI_LE)) && A.cao === Math.round(400 * Number(TI_LE))) : (A.rong === 900 && A.cao === 600), dienTich)

  // khung (40,40)-(200,140) xoay 90 do quanh tam (120,90): nay chiem x 70..170, y 10..170
  kiem(ten('Anh xuat: khung da xoay 90 do: canh tren moi (120,10) la mau cam'), laCam(xa(120, 10)), JSON.stringify(xa(120, 10)))
  kiem(ten('Anh xuat: khung da xoay 90 do: canh phai moi (170,90) la mau cam'), laCam(xa(170, 90)), JSON.stringify(xa(170, 90)))
  kiem(ten('Anh xuat: cho canh tren CU (120,40) nay la ruot khung, khong con net'), laNen(xa(120, 40)), JSON.stringify(xa(120, 40)))
  kiem(ten('Anh xuat: cho canh phai CU (200,120) nay ngoai khung, khong con net'), laNen(xa(200, 120)), JSON.stringify(xa(200, 120)))
  kiem(ten('Anh xuat: goc tren-trai cu (40,40) trong'), laNen(xa(40, 40)), JSON.stringify(xa(40, 40)))
  // chu xoay 45
  { const g = Math.PI / 4, hw = hopChu.w / 2, hh = hopChu.h / 2
    const trongHopXoay = (x, y) => { const dx = x - hopChu.cx, dy = y - hopChu.cy; const u = dx * Math.cos(g) + dy * Math.sin(g), v = -dx * Math.sin(g) + dy * Math.cos(g); return Math.abs(u) <= hw && Math.abs(v) <= hh }
    const goc = [hopChu.cx + hw - 2, hopChu.cy - hh + 2] // goc tren-PHAI cua hop chua xoay
    const doc = [hopChu.cx + 0.707 * (hw - 10), hopChu.cy + 0.707 * (hw - 10)] // theo truc dai da xoay
    kiem(ten('Anh xuat: de bai co y nghia (goc hop chua xoay nam NGOAI hop da xoay 45 do, diem theo truc dai nam TRONG)'), !trongHopXoay(goc[0], goc[1]) && trongHopXoay(doc[0], doc[1]) && !(Math.abs(doc[1] - hopChu.cy) <= hh), 'hop ' + hw.toFixed(0) + 'x' + hh.toFixed(0))
    kiem(ten('Anh xuat: chu xoay 45 do: diem theo truc dai da xoay co nen chu'), khacNen(xa(doc[0], doc[1])), JSON.stringify(xa(doc[0], doc[1])))
    kiem(ten('Anh xuat: chu xoay 45 do: goc hop CU khong con nen chu'), laNen(xa(goc[0], goc[1])), JSON.stringify(xa(goc[0], goc[1]))) }
  kiem(ten('Anh xuat: tam chu co nen chu'), khacNen(xa(hopChu.cx, hopChu.cy)), JSON.stringify(xa(hopChu.cx, hopChu.cy)))
  // mui ten: p1 (20,210), p2 (240,180)
  { const a = fin[2]; const mx = (a.x1 + a.x2) / 2, my = (a.y1 + a.y2) / 2
    kiem(ten('Anh xuat: mui ten sau khi keo 2 dau: trung diem (' + Math.round(mx) + ',' + Math.round(my) + ') co net cam'), laCam(xa(mx, my)), JSON.stringify(xa(mx, my)))
    kiem(ten('Anh xuat: dau mui ten cu (200,240) khong con net'), laNen(xa(200, 240)), JSON.stringify(xa(200, 240))) }
  // net but vang sau co gian + keo + phim mui ten
  { const n = fin[3], mx = (n.pts[2] + n.pts[4]) / 2, my = (n.pts[3] + n.pts[5]) / 2
    kiem(ten('Anh xuat: net but sau co gian + keo + doi mau: diem tren duong cong co mau vang'), laVang(xa(mx, my)), JSON.stringify(xa(mx, my))) }
  // anh xuat = thu nhin thay (man chup: cung canvas; anh ghim: ve lai bang he so k)
  { let lech = 0
    for (let q = 0; q < mau.length; q++) {
      const daCoNet = live[q] > 150
      const xuatCoNet = !laNen(xa(mau[q][0], mau[q][1]))
      if (daCoNet !== xuatCoNet) lech++
    }
    kiem(ten('Anh xuat giong thu nhin thay: ' + mau.length + ' diem mau, co/khong co net khop o ' + (mau.length - lech) + ' diem'), lech <= Math.max(2, Math.round(mau.length * 0.012)), lech + ' diem lech')
  }
}

app.whenReady().then(async () => {
  try {
    /* ════ A. MAN CHUP (overlay) ════ vung chon 600x400 tai (100,100) */
    const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
      webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
    nghe(ov, 'man chup')
    await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
    ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
    ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
    await cho(400)
    await js(ov, TRO_GIUP)
    if (HONG && LAM_HONG[HONG]) await js(ov, LAM_HONG[HONG])
    kiem('Man chup: nap duoc sua-net.js (SuaNet co mat trong trang)', await js(ov, 'typeof SuaNet === "object" && typeof SuaNet.tay === "function"'))
    await chayKichBan({
      ten: 'man chup', loai: 'overlay', win: ov,
      heSo: () => js(ov, 'DPR'),
      xuat: async () => { xacNhan = null; await js(ov, `(async () => { const c = document.createElement('canvas'); c.width = Math.round(innerWidth * DPR); c.height = Math.round(innerHeight * DPR); const im = new Image(); im.src = c.toDataURL(); await im.decode(); frozenImg = im; return true })()`); await js(ov, 'document.getElementById("xong").click()'); for (let i = 0; i < 40 && !xacNhan; i++) await cho(50); return xacNhan && xacNhan.dataUrl }
    })
    ov.destroy()

    /* ════ B. ANH GHIM (pin) ════ anh that 900x600 nen xam 64, hien 600x400 -> he so xuat 1,5 */
    const NW = 900, NH = 600, DW = 600, DH = 400
    const bmp = Buffer.alloc(NW * NH * 4)
    for (let i = 0; i < bmp.length; i += 4) { bmp[i] = 64; bmp[i + 1] = 64; bmp[i + 2] = 64; bmp[i + 3] = 255 }
    const nen = nativeImage.createFromBitmap(bmp, { width: NW, height: NH }).toDataURL()
    const pin = new BrowserWindow({ x: 0, y: 0, width: DW + 24, height: DH + 24, show: false, frame: false, transparent: true,
      webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false } })
    nghe(pin, 'anh ghim')
    await pin.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
    pin.webContents.send('pin:data', { dataUrl: nen, pad: 12, w: DW, h: DH, lamMoKieu: 'mosaic' })
    await cho(500)
    await js(pin, TRO_GIUP)
    if (HONG && LAM_HONG[HONG]) await js(pin, LAM_HONG[HONG])
    await chayKichBan({
      ten: 'anh ghim', loai: 'pin', win: pin,
      heSo: async () => NW / DW,
      xuat: async () => { luuGhim = null; pin.webContents.focus(); pin.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); pin.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' }); for (let i = 0; i < 40 && !luuGhim; i++) await cho(50); return luuGhim }
    })
    pin.destroy()
  } catch (e) {
    kiem('Chay kich ban khong nem loi', false, e && e.message)
  }
  console.log('KQ=' + JSON.stringify({ kq, loiTrang }))
  app.exit(0)
})
