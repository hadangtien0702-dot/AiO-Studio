'use strict'
/* =========================================================================
   Do THANH CONG CU (12/11) — chay bang: npm run test:thanhcu
   5 viec: [1] vi tri thanh khi vung kin man hinh · [2] Lam lai (redo) · [3] chi con MOT cham mau, xo bang 7 mau ·
           [4] but + da quang gop MOT nut, re chuot xo menu · [5] nut 40 px / icon 20 px, bo hang tbH = 44.
   CHAY AN: khong bat cua so nao, khong cuop chuot. 2 cua so offscreen nap THAT src/overlay/index.html + src/pin/index.html
   voi preload that; chuot / phim la su kien gia lap trong trang (cung khuon but-ve-main.cjs). Rieng muc "re chuot" co them
   mot lan thu bang sendInputEvent (con tro ao cua cua so offscreen, khong dung con tro that cua nguoi dung).
   DOI CHUNG: lam hong tung hanh vi (redo, vi tri, dong bang mau) -> bai cham PHAI trượt dung muc, roi tra lai.
   Cach chay: node scripts/test/do-thanh-cong-cu.cjs   (tu goi Electron)
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')

/* ───────────── PHAN NODE: goi Electron nhieu luot, gom ket qua ───────────── */
if (!process.versions.electron) {
  const { spawnSync } = require('child_process')
  const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron') : 'electron')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'thanh-cong-cu')
  fs.mkdirSync(RA, { recursive: true })
  const chay = (tiLe, hong) => {
    const r = spawnSync(electron, [__filename, RA, String(tiLe), ...(hong ? [hong] : [])], { env, encoding: 'utf8', timeout: 180000 })
    const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
    if (!dong) return { loi: ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => l.startsWith('LOI=') || /Error/.test(l)).slice(0, 4).join(' | ') || 'khong co ket qua (ma thoat ' + r.status + ')' }
    return JSON.parse(dong.slice(3))
  }
  let tong = 0, dat = 0
  const in_ = (k, tieuDe) => {
    console.log('\n== ' + tieuDe + ' ==')
    if (k.loi) { console.log('  TRUOT chay duoc (' + k.loi + ')'); tong++; return }
    for (const c of k.kq) { tong++; if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }
    if (k.loiTrang && k.loiTrang.length) { tong++; console.log('  TRUOT loi console trong trang: ' + k.loiTrang.slice(0, 3).join(' | ')) } else { tong++; dat++; console.log('  DAT   khong co loi console trong trang') }
    if (k.rong) console.log('  [do] be rong thanh: ' + JSON.stringify(k.rong))
  }
  const lanDau = chay(1)
  in_(lanDau, 'Man 100 %')
  in_(chay(1.5), 'Man 150 %')
  /* DOI CHUNG: moi cach lam hong phai lam trượt it nhat 1 muc trong nhom ten tuong ung */
  const doiChung = [['redo', /Lam lai|redo/i], ['vitri', /Vi tri thanh/i], ['xo', /bang mau|ngoai/i]]
  let doiChungDat = 0
  console.log('\n== DOI CHUNG (cố ý làm hỏng, bài đo PHẢI trượt) ==')
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
const { app, BrowserWindow, ipcMain } = require('electron')
const RA = path.resolve(process.argv[2])
const TI_LE = process.argv[3] || '1'
const HONG = process.argv[4] || ''
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData-' + TI_LE + (HONG ? '-' + HONG : '')))
app.commandLine.appendSwitch('force-device-scale-factor', TI_LE)
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 120 giay'), 120000)

let ngonNgu = 'vi'
let soLanHuy = 0
ipcMain.on('i18n:lang', (e) => { e.returnValue = ngonNgu })
ipcMain.on('overlay:cancel', () => { soLanHuy++ })

const TRO_GIUP = `
window.__t = {
  chuot: (kieu, x, y, dich) => (dich || window).dispatchEvent(new MouseEvent(kieu, { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true })),
  phim: (key, code, them) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, code, bubbles: true, cancelable: true }, them || {}))),
  /* keo mot khung / mui ten / lam mo: ds = [[x,y],[x,y]] toa do CUC BO cua canvas ve */
  keo: (a, b) => { const r = veEl.getBoundingClientRect()
    __t.chuot('mousedown', r.left + a[0], r.top + a[1], veEl); __t.chuot('mousemove', r.left + (a[0] + b[0]) / 2, r.top + (a[1] + b[1]) / 2); __t.chuot('mousemove', r.left + b[0], r.top + b[1]); __t.chuot('mouseup', r.left + b[0], r.top + b[1]) },
  bam: (p) => { const r = veEl.getBoundingClientRect(); __t.chuot('mousedown', r.left + p[0], r.top + p[1], veEl); __t.chuot('mouseup', r.left + p[0], r.top + p[1]) },
  net: (ds) => __t.keo(ds[0], ds[ds.length - 1]),
  ds: () => JSON.stringify(shapes),
  loai: () => shapes.map((s) => s.type).join(','),
  anh: () => veEl.toDataURL('image/png'),
  hcn: (el) => { const r = (typeof el === 'string' ? document.querySelector(el) : el).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height } },
}
true`

const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
const loiTrang = []
const js = (w, s) => w.webContents.executeJavaScript(s, true)
const nghe = (w, ten) => w.webContents.on('console-message', (e, level, msg) => { if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2.*Content Security Policy/.test(msg || e.message || '')) loiTrang.push(ten + ': ' + (msg || e.message)) })
const gan = (a, b, sai = 1.5) => Math.abs(a - b) <= sai

/* Lam hong co chu y (DOI CHUNG) */
const LAM_HONG = {
  redo: 'lamLai = function () {}; true',
  vitri: `datViTriThanhCongCu = function () { const gap = 10, tbH = 44; let top = curRect.y + curRect.h + gap; if (top + tbH > window.innerHeight) top = Math.max(gap, curRect.y - tbH - gap); toolbarEl.style.top = top + 'px'; toolbarEl.style.left = Math.max(gap, Math.min(curRect.x, window.innerWidth - toolbarEl.offsetWidth - gap)) + 'px' }; true`,
  xo: 'dongBangMau = function () {}; true'
}

async function moOverlay(W, H, lang) {
  ngonNgu = lang || 'vi'
  const ov = new BrowserWindow({ x: 0, y: 0, width: W, height: H, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  nghe(ov, 'overlay')
  await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
  ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
  ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 300 })
  await cho(300)
  await js(ov, TRO_GIUP)
  if (HONG && LAM_HONG[HONG]) await js(ov, LAM_HONG[HONG])
  return ov
}
const datVung = async (ov, x, y, w, h) => { ov.webContents.send('overlay:annotate', { x, y, w, h }); await cho(250) }

app.whenReady().then(async () => {
  const rong = {}

  /* ═════════ A. MAN CHUP 1280 x 800 ═════════ */
  const W = 1280, H = 800
  const ov = await moOverlay(W, H)
  const o = (s) => js(ov, s)

  // ── [5] Kich thuoc: nut 40 px, icon 20 px, thanh vua man 1280 ──
  {
    const k = await o(`(() => { const nut = [...toolbarEl.querySelectorAll('.cong-cu')]; const b = __t.hcn(toolbarEl)
      return { soNut: nut.length, nutRong: [...new Set(nut.map((x) => Math.round(x.getBoundingClientRect().width)))], nutCao: [...new Set(nut.map((x) => Math.round(x.getBoundingClientRect().height)))],
        icon: [...new Set([...toolbarEl.querySelectorAll('.cong-cu svg')].filter((s) => s.getBoundingClientRect().width).map((s) => Math.round(s.getBoundingClientRect().width) + 'x' + Math.round(s.getBoundingClientRect().height)))],
        rongThanh: b.w, caoThanh: b.h, trai: b.l, phai: b.r, offH: toolbarEl.offsetHeight } })()`)
    rong['1280'] = Math.round(k.rongThanh)
    kiem('Kich thuoc: moi nut 40x40 px', k.nutRong.length === 1 && k.nutRong[0] === 40 && k.nutCao.length === 1 && k.nutCao[0] === 40, 'rong ' + k.nutRong + ' cao ' + k.nutCao + ', ' + k.soNut + ' nut')
    kiem('Kich thuoc: moi icon 20x20 px', k.icon.length === 1 && k.icon[0] === '20x20', k.icon.join(' '))
    kiem('Kich thuoc: thanh nam gon trong man 1280 (rong ' + Math.round(k.rongThanh) + ' px)', k.trai >= 0 && k.phai <= 1280 && k.rongThanh <= 1280 - 20, 'trai ' + Math.round(k.trai) + ' phai ' + Math.round(k.phai))
    kiem('Kich thuoc: chieu cao thanh doc tu offsetHeight, khong con hang 44', k.offH === Math.round(k.caoThanh) && k.offH > 44, 'cao that ' + k.offH)
  }
  {
    const src = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'overlay.js'), 'utf8')
    kiem('Kich thuoc: overlay.js khong con "const tbH = 44"', !/const tbH = 44/.test(src))
  }

  // ── [1] Vi tri thanh ──
  const viTri = async (x, y, w, h) => { await datVung(ov, x, y, w, h); return o('(() => { const b = __t.hcn(toolbarEl); return { ...b, W: innerWidth, H: innerHeight, cr: { ...curRect } } })()') }
  const trongMan = (b) => b.l >= -0.5 && b.t >= -0.5 && b.r <= b.W + 0.5 && b.b <= b.H + 0.5
  {
    const a = await viTri(0, 0, W, H) // KIN MAN HINH
    kiem('Vi tri thanh: vung kin man hinh -> thanh o GIUA theo chieu ngang', gan((a.l + a.r) / 2, W / 2, 2), 'tam ' + ((a.l + a.r) / 2).toFixed(1) + ' / ' + (W / 2))
    kiem('Vi tri thanh: vung kin man hinh -> sat day BEN TRONG vung (cach day ~10 px), khong dat goc tren-trai', gan(a.b, H - 10, 2) && a.t > H / 2, 'top ' + a.t.toFixed(1) + ' day ' + a.b.toFixed(1))
    kiem('Vi tri thanh: vung kin man hinh -> khong tran khoi man', trongMan(a))
    const b = await viTri(200, 120, 600, 300) // con cho DUOI
    kiem('Vi tri thanh: con cho duoi vung -> nam duoi vung (cach 10 px), canh trai = trai vung (giu nhu cu)', gan(b.t, 120 + 300 + 10) && gan(b.l, 200) && trongMan(b), 'top ' + b.t.toFixed(1) + ' trai ' + b.l.toFixed(1))
    const c = await viTri(150, H - 220, 500, 210) // het cho duoi, con cho TREN
    kiem('Vi tri thanh: het cho duoi, con cho tren -> nam tren vung (cach 10 px)', gan(c.b, H - 220 - 10) && gan(c.l, 150) && trongMan(c), 'bottom ' + c.b.toFixed(1) + ' / ' + (H - 220 - 10))
    const d = await viTri(W - 300, 0, 300, H - 20) // hep, sat phai, het cho tren + duoi
    kiem('Vi tri thanh: vung hep sat mep phai, kin chieu cao -> khong tran khoi man', trongMan(d), 'l ' + d.l.toFixed(0) + ' r ' + d.r.toFixed(0) + ' t ' + d.t.toFixed(0) + ' b ' + d.b.toFixed(0))
    const e = await viTri(0, 0, W, H - 40) // khoang trong duoi < chieu cao thanh
    kiem('Vi tri thanh: duoi con 40 px (thieu cho), tren khong co -> nam trong vung, khong tran', e.b <= H - 40 + 0.5 && trongMan(e) && gan((e.l + e.r) / 2, W / 2, 2), 'b ' + e.b.toFixed(1))
  }

  // ── [2] LAM LAI ──
  await datVung(ov, 100, 100, 600, 400)
  {
    const kD = await o('({ dis: document.getElementById("redo").disabled, ten: document.getElementById("redo").title })')
    kiem('Lam lai: co nut Lam lai, luc dau bi khoa (chua co gi de lam lai)', kD.dis === true && kD.ten.length > 0, kD.ten)
    // ve du 7 loai net (rect, arrow, text, blur, so, but, daquang)
    await o('__t.phim("1","Digit1"); __t.keo([40,40],[200,120])')
    await o('__t.phim("2","Digit2"); __t.keo([250,60],[420,160])')
    await o('__t.phim("3","Digit3"); __t.bam([60,220])')
    await o('{ const ta = document.querySelector(".go-chu"); ta.value = "abc"; ta.dispatchEvent(new Event("input")); ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })) }')
    await o('__t.phim("4","Digit4"); __t.keo([300,220],[420,320])')
    await o('__t.phim("6","Digit6"); __t.bam([500,60])')
    await o('__t.phim("7","Digit7"); __t.keo([40,340],[220,340])')
    await o('__t.phim("8","Digit8"); __t.keo([260,340],[460,340])')
    const loai = await o('__t.loai()')
    const full = await o('__t.ds()'), anhDay = await o('__t.anh()')
    const nutTrangThai = await o('document.getElementById("redo").disabled')
    kiem('Lam lai: ve 7 loai net (khung, mui ten, chu, lam mo, so, but, da quang)', loai === 'rect,arrow,text,blur,so,but,daquang', loai)
    kiem('Lam lai: ve net moi thi hang doi trong -> nut Lam lai khoa', nutTrangThai === true)

    // hoan tac TUNG net: bang phim, mat di dung net cuoi
    const dsLoai = loai.split(',')
    const snap = [full] // snap[i] = trang thai khi con (7 - i) net → luu theo thu tu hoan tac
    let okUndo = true, chiTietUndo = ''
    const cacTrangThai = []
    for (let i = 6; i >= 0; i--) {
      cacTrangThai.unshift(await o('__t.ds()')) // cacTrangThai[i] = trang thai khi co (i+1) net
      await o('__t.phim("z","KeyZ",{ ctrlKey: true })')
      const sau = await o('__t.loai()')
      if (sau !== dsLoai.slice(0, i).join(',')) { okUndo = false; chiTietUndo += ' sau undo net ' + (i + 1) + ' (' + dsLoai[i] + ') con "' + sau + '";' }
    }
    cacTrangThai.unshift('[]')
    kiem('Hoan tac: Ctrl+Z bo dung net cuoi, lan luot het 7 loai net', okUndo && (await o('shapes.length')) === 0, chiTietUndo)
    kiem('Lam lai: sau khi hoan tac, nut Lam lai sang (het khoa)', (await o('document.getElementById("redo").disabled')) === false)

    // lam lai TUNG net: xen ba cach (Ctrl+Y, Ctrl+Shift+Z, nut) — moi buoc phai khop trang thai luc truoc do
    const cach = ['Ctrl+Y', 'Ctrl+Shift+Z', 'nut', 'Ctrl+Y', 'Ctrl+Shift+Z', 'nut', 'Ctrl+Y']
    let okRedo = true, chiTietRedo = ''
    for (let i = 0; i < 7; i++) {
      if (cach[i] === 'Ctrl+Y') await o('__t.phim("y","KeyY",{ ctrlKey: true })')
      else if (cach[i] === 'Ctrl+Shift+Z') await o('__t.phim("Z","KeyZ",{ ctrlKey: true, shiftKey: true })')
      else await o('document.getElementById("redo").click()')
      const sau = await o('__t.ds()')
      if (sau !== cacTrangThai[i + 1]) { okRedo = false; chiTietRedo += ' buoc ' + (i + 1) + ' (' + cach[i] + ', ' + dsLoai[i] + ') lech;' }
    }
    kiem('Lam lai: Ctrl+Y, Ctrl+Shift+Z va nut khoi phuc DUNG tung net (so lieu moi net giong het truoc khi hoan tac)', okRedo, chiTietRedo)
    kiem('Lam lai: lam lai het 7 net -> bang ve giong het luc chua hoan tac (so sanh tung diem anh)', (await o('__t.anh()')) === anhDay && (await o('__t.ds()')) === full)
    kiem('Lam lai: het hang doi -> nut Lam lai khoa lai, bam them khong doi gi', (await o('document.getElementById("redo").disabled')) === true && (await o('(() => { lamLai(); return __t.ds() })()')) === full)

    // ve net moi -> xoa hang doi
    await o('__t.phim("z","KeyZ",{ ctrlKey: true }); __t.phim("z","KeyZ",{ ctrlKey: true })')
    const truocMoi = { redo: await o('document.getElementById("redo").disabled'), n: await o('shapes.length') }
    await o('__t.phim("1","Digit1"); __t.keo([300,100],[380,160])')
    const sauMoi = { redo: await o('document.getElementById("redo").disabled'), n: await o('shapes.length') }
    await o('__t.phim("y","KeyY",{ ctrlKey: true }); document.getElementById("redo").click()')
    kiem('Lam lai: ve net moi thi hang doi bi xoa (nut khoa, Ctrl+Y va nut khong khoi phuc net cu)', truocMoi.redo === false && sauMoi.redo === true && (await o('shapes.length')) === sauMoi.n && sauMoi.n === truocMoi.n + 1, 'truoc ' + truocMoi.n + ' sau ve ' + sauMoi.n + ' sau Ctrl+Y ' + (await o('shapes.length')))

    // o go chu dang mo
    await o('__t.phim("z","KeyZ",{ ctrlKey: true })') // bo khung vua ve → redo = 1
    const nTruoc = await o('shapes.length')
    await o('__t.phim("3","Digit3"); __t.bam([300,400])')
    const moO = await o('!!document.querySelector(".go-chu")')
    await o('__t.phim("y","KeyY",{ ctrlKey: true }); document.getElementById("redo").click()')
    const sauRedoKhiGo = { n: await o('shapes.length'), o: await o('!!document.querySelector(".go-chu")') }
    kiem('Lam lai: dang go chu thi Lam lai bi bo qua (khong chen net, khong lam mat o go)', moO && sauRedoKhiGo.n === nTruoc && sauRedoKhiGo.o, 'net ' + nTruoc + ' -> ' + sauRedoKhiGo.n)
    await o('__t.phim("z","KeyZ",{ ctrlKey: true })') // Ctrl+Z khi dang go = bo o go (giu nhu cu)
    const saubo = { n: await o('shapes.length'), o: await o('!!document.querySelector(".go-chu")') }
    kiem('Hoan tac: dang go chu thi Ctrl+Z chi bo o go (giu nhu cu), khong xoa net khac', saubo.n === nTruoc && !saubo.o)
    await o('document.getElementById("redo").click()')
    kiem('Lam lai: sau khi bo o go, Lam lai chay lai binh thuong', (await o('shapes.length')) === nTruoc + 1)
    // doi cong cu / doi vung cung xoa
    await o('__t.phim("z","KeyZ",{ ctrlKey: true })')
    await datVung(ov, 100, 100, 600, 400)
    kiem('Lam lai: vao vung moi thi hang doi lam lai bi xoa (nut khoa)', (await o('document.getElementById("redo").disabled')) === true)
  }

  // ── [3] BANG MAU ──
  {
    const k0 = await o('(() => { const h = document.getElementById("mau-hien"), p = document.getElementById("mau-pop"); return { hidden: p.hidden, cham: getComputedStyle(h.firstElementChild).backgroundColor, soMauNgoai: [...toolbarEl.querySelectorAll(".mau")].filter((m) => !p.contains(m)).length, soMau: p.querySelectorAll(".mau").length, ten: h.title } })()')
    kiem('Bang mau: thanh chi con MOT cham mau (bang 7 mau dong, khong con mau nao nam ngoai bang)', k0.hidden === true && k0.soMauNgoai === 0 && k0.soMau === 7, '7 mau trong bang: ' + k0.soMau)
    kiem('Bang mau: cham hien mau dang chon (cam mac dinh)', k0.cham === 'rgb(248, 104, 32)', k0.cham)

    await datVung(ov, 100, 100, 600, 300) // thanh duoi vung, con rat nhieu cho phia duoi
    await o('document.getElementById("mau-hien").click()')
    const k1 = await o('(() => { const p = document.getElementById("mau-pop"), h = __t.hcn("#mau-hien"), r = __t.hcn(p); return { hidden: p.hidden, len: p.classList.contains("len"), top: r.t, bottom: r.b, l: r.l, rr: r.r, hb: h.b, ht: h.t, H: innerHeight, W: innerWidth, aria: document.getElementById("mau-hien").getAttribute("aria-expanded"), hien: [...p.querySelectorAll(".mau")].every((m) => m.getBoundingClientRect().width > 0) } })()')
    kiem('Bang mau: bam cham mau thi xo bang 7 mau XUONG DUOI nut', !k1.hidden && !k1.len && k1.top >= k1.hb && k1.bottom <= k1.H && k1.hien && k1.aria === 'true', 'bang ' + Math.round(k1.top) + '..' + Math.round(k1.bottom) + ' nut.bottom ' + Math.round(k1.hb))
    kiem('Bang mau: bang nam gon trong man (khong bi cat)', k1.l >= 0 && k1.rr <= k1.W && k1.bottom <= k1.H)
    await o('document.querySelector("#mau-pop .mau[data-color=\\"#ff3b30\\"]").click()')
    const k2 = await o('({ hidden: document.getElementById("mau-pop").hidden, mau: curColor, cham: getComputedStyle(document.getElementById("mau-hien").firstElementChild).backgroundColor, chon: document.querySelector("#mau-pop .mau.chon").dataset.color })')
    kiem('Bang mau: chon mau do thi bang dong, mau ve + cham doi theo', k2.hidden && k2.mau === '#ff3b30' && k2.cham === 'rgb(255, 59, 48)' && k2.chon === '#ff3b30', k2.mau + ' ' + k2.cham)
    // mau moi dung de ve
    await o('__t.phim("1","Digit1"); __t.keo([20,20],[100,80])')
    kiem('Bang mau: net ve sau do mang mau vua chon', (await o('shapes[shapes.length - 1].color')) === '#ff3b30')
    // bam ra ngoai
    await o('document.getElementById("mau-hien").click()')
    const moRa = await o('document.getElementById("mau-pop").hidden')
    await o('__t.chuot("mousedown", 650, 380, veEl); __t.chuot("mouseup", 650, 380)')
    kiem('Bang mau: bam ra ngoai (len vung ve) thi dong bang', moRa === false && (await o('document.getElementById("mau-pop").hidden')) === true)
    await o('document.getElementById("mau-hien").click()')
    await o('__t.chuot("mousedown", 5, 5, document.body)')
    kiem('Bang mau: bam ra ngoai (len nen) cung dong bang', (await o('document.getElementById("mau-pop").hidden')) === true)
    // bam lai chinh cham = dong
    await o('document.getElementById("mau-hien").click()')
    await o('document.getElementById("mau-hien").click()')
    kiem('Bang mau: bam cham mau lan nua thi dong', (await o('document.getElementById("mau-pop").hidden')) === true)
    // Esc dong bang truoc, KHONG huy chup
    soLanHuy = 0
    await o('document.getElementById("mau-hien").click()')
    await o('__t.phim("Escape","Escape")')
    const sauEsc1 = { dong: await o('document.getElementById("mau-pop").hidden') }
    const huyLan1 = soLanHuy
    await o('__t.phim("Escape","Escape")')
    await cho(100)
    kiem('Bang mau: Esc dong bang truoc, KHONG huy chup; Esc lan hai moi huy chup', sauEsc1.dong === true && huyLan1 === 0 && soLanHuy === 1, 'huy sau Esc 1 = ' + huyLan1 + ', sau Esc 2 = ' + soLanHuy)

    // gan mep duoi: vung cho thanh nam sat day, bang phai xo LEN
    await datVung(ov, 100, 100, 600, 400)
    const tbH = await o('toolbarEl.offsetHeight')
    // dat vung de thanh vua nam duoi vung voi day thanh cach day man ~16 px (thieu cho cho bang 7 mau)
    const hVung = H - 16 - tbH - 10 - 100
    await datVung(ov, 100, 100, 600, hVung)
    await o('document.getElementById("mau-hien").click()')
    const k3 = await o('(() => { const p = document.getElementById("mau-pop"), h = __t.hcn("#mau-hien"), r = __t.hcn(p), tb = __t.hcn(toolbarEl); return { len: p.classList.contains("len"), t: r.t, b: r.b, hT: h.t, hB: h.b, H: innerHeight, tbB: tb.b } })()')
    kiem('Bang mau: thanh sat day man hinh -> bang xo LEN tren, nam tron trong man, khong chong len nut', k3.len && k3.t >= 0 && k3.b <= k3.hT + 0.5 && k3.tbB > H - 40, 'thanh.bottom ' + Math.round(k3.tbB) + ' bang ' + Math.round(k3.t) + '..' + Math.round(k3.b))
    await o('__t.phim("Escape","Escape")')
    // vung kin man hinh (thanh o day vung) cung xo len
    await datVung(ov, 0, 0, W, H)
    await o('document.getElementById("mau-hien").click()')
    const k4 = await o('(() => { const p = document.getElementById("mau-pop"), r = __t.hcn(p); return { len: p.classList.contains("len"), t: r.t, b: r.b, H: innerHeight } })()')
    kiem('Bang mau: vung kin man hinh (thanh o day) -> bang xo len, khong bi cat', k4.len && k4.t >= 0 && k4.b <= k4.H, 'bang ' + Math.round(k4.t) + '..' + Math.round(k4.b))
    await o('__t.phim("Escape","Escape")')
  }

  // ── [4] NUT BUT GOP ──
  await datVung(ov, 100, 100, 600, 300)
  {
    const k0 = await o('(() => { const nhom = document.getElementById("but-nhom"); return { soNut: document.querySelectorAll("#but-nhom > .cong-cu").length, toanThanh7va8: [...toolbarEl.querySelectorAll(".cong-cu")].filter((b) => b.querySelector(".so") && /^[78]$/.test(b.querySelector(".so").textContent)).length, menuAn: document.getElementById("but-menu").hidden, soMuc: document.querySelectorAll("#but-menu .muc-xo").length, so: document.getElementById("but-chinh").dataset.so, tool: document.getElementById("but-chinh").dataset.tool } })()')
    kiem('Nut but: but + da quang gop thanh MOT nut tren thanh (menu dong luc dau, 2 lua chon)', k0.soNut === 1 && k0.toanThanh7va8 === 0 && k0.menuAn && k0.soMuc === 2, JSON.stringify(k0))
    // re chuot vao
    await o('document.getElementById("but-nhom").dispatchEvent(new MouseEvent("mouseenter"))')
    const k1 = await o('(() => { const m = document.getElementById("but-menu"), r = __t.hcn(m), b = __t.hcn("#but-chinh"); return { hidden: m.hidden, len: m.classList.contains("len"), t: r.t, b: r.b, l: r.l, rr: r.r, bB: b.b, W: innerWidth, H: innerHeight, muc: [...m.querySelectorAll(".muc-xo")].map((x) => x.getBoundingClientRect().height > 0).every(Boolean) } })()')
    kiem('Nut but: re chuot vao thi xo menu doc 2 lua chon, ben duoi nut, khong bi cat', !k1.hidden && !k1.len && k1.t >= k1.bB && k1.b <= k1.H && k1.l >= 0 && k1.rr <= k1.W && k1.muc, 'menu ' + Math.round(k1.t) + '..' + Math.round(k1.b))
    // cau noi: moi diem trong khoang tu nut xuong menu van thuoc nhom (re chuot xuong menu khong lam menu dong)
    const cau = await o(`(() => { const b = __t.hcn("#but-chinh"), m = __t.hcn("#but-menu"); const x = Math.round((b.l + b.r) / 2); const res = []
      for (let y = Math.floor(b.b) - 1; y <= Math.ceil(m.t) + 1; y++) { const el = document.elementFromPoint(x, y); res.push(!!(el && el.closest('#but-nhom'))) }
      return { n: res.length, hong: res.filter((v) => !v).length } })()`)
    kiem('Nut but: tu nut re xuong menu khong co khe ho (moi diem o giua van thuoc nhom nen menu khong dong)', cau.n > 3 && cau.hong === 0, cau.n + ' diem, ' + cau.hong + ' diem ngoai nhom')
    // chon da quang tu menu
    await o('document.querySelector("#but-menu .muc-xo[data-tool=\\"daquang\\"]").click()')
    const k2 = await o(`(() => { const b = document.getElementById("but-chinh"); const hien = (s) => getComputedStyle(b.querySelector(s)).display !== 'none'
      return { tool, nhomDq: document.getElementById('but-nhom').classList.contains('dq'), dt: b.dataset.tool, so: b.dataset.so, tieuDe: b.title, icDq: hien('.ic-dq'), icBut: hien('.ic-but'), chon: b.classList.contains('chon'), menuAn: document.getElementById('but-menu').hidden,
        soHienThi: getComputedStyle(b, '::after').content, mucChon: [...document.querySelectorAll('#but-menu .muc-xo.chon')].map((x) => x.dataset.tool).join() } })()`)
    kiem('Nut but: chon Da quang trong menu -> cong cu doi, nut hien icon da quang + so 8 + goi y, menu dong', k2.tool === 'daquang' && k2.nhomDq && k2.dt === 'daquang' && k2.so === '8' && k2.icDq && !k2.icBut && k2.chon && k2.menuAn && k2.mucChon === 'daquang' && /8/.test(k2.soHienThi) && /dạ quang/i.test(k2.tieuDe), JSON.stringify(k2))
    // phim 7 / 8 chay nhu cu va doi icon
    await o('__t.phim("7","Digit7")')
    const p7 = await o(`(() => { const b = document.getElementById('but-chinh'); return { tool, so: b.dataset.so, icBut: getComputedStyle(b.querySelector('.ic-but')).display !== 'none', icDq: getComputedStyle(b.querySelector('.ic-dq')).display !== 'none', chon: b.classList.contains('chon') } })()`)
    await o('__t.phim("8","Digit8")')
    const p8 = await o(`(() => { const b = document.getElementById('but-chinh'); return { tool, so: b.dataset.so, icBut: getComputedStyle(b.querySelector('.ic-but')).display !== 'none', icDq: getComputedStyle(b.querySelector('.ic-dq')).display !== 'none', chon: b.classList.contains('chon') } })()`)
    kiem('Nut but: phim 7 -> but (icon but, so 7); phim 8 -> da quang (icon da quang, so 8)', p7.tool === 'but' && p7.so === '7' && p7.icBut && !p7.icDq && p7.chon && p8.tool === 'daquang' && p8.so === '8' && p8.icDq && !p8.icBut && p8.chon, JSON.stringify([p7, p8]))
    // ve bang tung loai van ra net dung
    await o('__t.phim("7","Digit7"); __t.net([[40,200],[240,200]]); __t.phim("8","Digit8"); __t.net([[40,240],[240,240]])')
    kiem('Nut but: ve bang phim 7 / 8 van ra net but + da quang', (await o('__t.loai()')).endsWith('but,daquang'))
    // bam nut chinh = chon loai dang dung
    await o('__t.phim("1","Digit1"); document.getElementById("but-chinh").click()')
    kiem('Nut but: doi sang cong cu khac roi bam nut but -> tro lai loai but vua dung', (await o('tool')) === 'daquang' && (await o('document.getElementById("but-chinh").classList.contains("chon")')))
    await o('__t.phim("1","Digit1")')
    kiem('Nut but: doi sang khung thi nut but het sang nhung giu icon loai cuoi', (await o('document.getElementById("but-chinh").classList.contains("chon")')) === false && (await o('document.getElementById("but-chinh").dataset.tool')) === 'daquang')
    // roi chuot
    await o('document.getElementById("but-nhom").dispatchEvent(new MouseEvent("mouseenter"))')
    const moLai = await o('document.getElementById("but-menu").hidden')
    await o('document.getElementById("but-nhom").dispatchEvent(new MouseEvent("mouseleave"))')
    await cho(400)
    kiem('Nut but: chuot roi nhom thi menu dong', moLai === false && (await o('document.getElementById("but-menu").hidden')) === true)
    // chuot that (sendInputEvent): tu ngoai → nut → khe → muc menu → ra ngoai
    const tam = await o(`(() => { const b = __t.hcn("#but-chinh"); return { x: Math.round((b.l + b.r) / 2), y: Math.round((b.t + b.b) / 2), bB: Math.round(b.b) } })()`)
    const wc = ov.webContents
    const dichChuot = (x, y) => wc.sendInputEvent({ type: 'mouseMove', x, y })
    dichChuot(5, 5); await cho(200)
    dichChuot(tam.x, tam.y); await cho(250)
    const sendMo = await o('document.getElementById("but-menu").hidden')
    dichChuot(tam.x, tam.bB + 8); await cho(400) // dung giua khe
    const giuaKhe = await o('document.getElementById("but-menu").hidden')
    const mr = await o('__t.hcn("#but-menu")')
    dichChuot(Math.round(mr.l + 40), Math.round(mr.t + 15)); await cho(400)
    const trenMuc = await o('document.getElementById("but-menu").hidden')
    dichChuot(5, 5); await cho(450)
    const raNgoai = await o('document.getElementById("but-menu").hidden')
    kiem('Nut but: chuot that (sendInputEvent): vao nut -> menu mo; re qua khe xuong menu -> van mo; ra ngoai -> dong', sendMo === false && giuaKhe === false && trenMuc === false && raNgoai === true, [sendMo, giuaKhe, trenMuc, raNgoai].map((v) => (v ? 'an' : 'hien')).join(' > '))
    // menu o sat day man hinh
    await datVung(ov, 0, 0, W, H)
    await o('document.getElementById("but-nhom").dispatchEvent(new MouseEvent("mouseenter"))')
    const k5 = await o('(() => { const m = document.getElementById("but-menu"), r = __t.hcn(m); return { len: m.classList.contains("len"), t: r.t, b: r.b, H: innerHeight } })()')
    kiem('Nut but: thanh o day man hinh -> menu xo LEN tren, khong bi cat', k5.len && k5.t >= 0 && k5.b <= k5.H, Math.round(k5.t) + '..' + Math.round(k5.b))
    await o('__t.phim("Escape","Escape")')
    kiem('Nut but: Esc dong menu but truoc, khong huy chup', (await o('document.getElementById("but-menu").hidden')) === true)
  }

  // ── Thu tu thanh + 2 ngon ngu (chuoi DOM) ──
  {
    const html = fs.readFileSync(path.join(ROOT, 'src', 'overlay', 'index.html'), 'utf8')
    const thanh = html.slice(html.indexOf('id="toolbar"'))
    const day = [...thanh.matchAll(/<i class="so">([^<]+)<\/i>|<span class="(chia[^"]*)">|id="(mau-nhom|undo|redo|huy|xong)"/g)].map((m) => m[1] || (m[2] ? '|' : m[3]))
    const chuoi = day.slice(0, day.indexOf('xong') + 1).join(' ')
    kiem('Thu tu thanh: V | 1..9 | S R | mau | undo redo | huy, xong', chuoi === 'V | 1 2 3 4 5 6 7 8 9 | S R | | mau-nhom | undo redo | huy xong'.replace('| | mau-nhom |', '| mau-nhom |') || true, chuoi)
    const okThuTu = /^V \| 1 2 3 4 5 6 7 8 9 \| S R I M \| mau-nhom \| undo redo \| huy xong$/.test(chuoi.replace(/ \| \|/g, ' |')) || /^V \| 1 2 3 4 5 6 7 8 9 \| S R I M \| mau-nhom \| undo redo \| huy xong$/.test(chuoi)
    kq.pop(); kiem('Thu tu thanh: V | 1..9 | S R | mau | undo redo | huy, xong', okThuTu, chuoi)
  }
  { // 04/11 nguoi soat bat: net cho Lam lai phai dich theo khi doi khung, khong thi hien lai lech cho
    await datVung(ov, 100, 100, 600, 300)
    await o('shapes.length = 0; xoaRedo(); redraw(); true')
    await o('__t.phim("1","Digit1"); __t.keo([40,40],[200,120])')
    const dau = JSON.parse(await o('JSON.stringify(shapes[0])'))
    const man0 = await o('({ x: curRect.x + shapes[0].x1, y: curRect.y + shapes[0].y1 })')
    await o('__t.phim("z","KeyZ",{ctrlKey:true})')
    await o(`(() => { const s = document.getElementById('size'), r = s.getBoundingClientRect(), x = r.left + 3, y = r.top + 3; s.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true })); __t.chuot('mousemove', x + 50, y + 30); __t.chuot('mouseup', x + 50, y + 30) })()`)
    const k = await o('({ ...curRect })')
    await o('__t.phim("y","KeyY",{ctrlKey:true})')
    const man1 = await o('shapes[0] ? ({ x: curRect.x + shapes[0].x1, y: curRect.y + shapes[0].y1 }) : ({ x: null, y: null })')
    kiem('Lam lai sau khi doi khung: khung that da doi', k.x === 150 && k.y === 130, k.x + ',' + k.y)
    kiem('Lam lai sau khi doi khung: net hien lai dung cho tren man', man1.x === man0.x && man1.y === man0.y, man0.x + ',' + man0.y + ' -> ' + man1.x + ',' + man1.y + ' (toa do trong khung dau ' + dau.x1 + ')')
    await o('shapes.length = 0; xoaRedo(); redraw(); true')
  }

  ov.destroy()

  // ═════════ A2. TIENG ANH + 1920 ═════════
  {
    const en = await moOverlay(1920, 1080, 'en')
    const e = (s) => js(en, s)
    const t = await e(`({ redo: document.getElementById('redo').title, undo: document.getElementById('undo').title, mau: document.getElementById('mau-hien').title, but: document.getElementById('but-chinh').title,
      menu: [...document.querySelectorAll('#but-menu .muc-xo span')].map((x) => x.textContent).join('/'), mucTitle: [...document.querySelectorAll('#but-menu .muc-xo')].map((x) => x.title).join(' | ') })`)
    kiem('Tieng Anh: nut Lam lai, bang mau, nut but, menu but deu co chu EN', /^Redo/.test(t.redo) && /^Undo/.test(t.undo) && /color/i.test(t.mau) && /Pen/.test(t.but) && t.menu === 'Pen/Highlighter' && /Highlighter/.test(t.mucTitle), JSON.stringify(t))
    await e('__t.phim("8","Digit8")')
    kiem('Tieng Anh: phim 8 -> goi y nut but doi sang Highlighter', /Highlighter/.test(await e('document.getElementById("but-chinh").title')))
    const khongViet = await e(`[...document.querySelectorAll('#redo, #mau-hien, #but-chinh, #but-menu *')].map((x) => (x.title || '') + (x.children.length ? '' : x.textContent)).join('').match(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi) || []`)
    kiem('Tieng Anh: khong lot chu tieng Viet o cac thanh phan moi', khongViet.length === 0, khongViet.join(''))
    // 1920: thanh vua man + vi tri
    const k = await e('(() => { const b = __t.hcn(toolbarEl); return { ...b, W: innerWidth, H: innerHeight } })()')
    rong['1920'] = Math.round(k.w)
    kiem('Kich thuoc: thanh nam gon trong man 1920 (rong ' + Math.round(k.w) + ' px)', k.l >= 0 && k.r <= k.W && k.b <= k.H)
    ov2Datvung: {
      const wh = await e('({ w: innerWidth, h: innerHeight })'); en.webContents.send('overlay:annotate', { x: 0, y: 0, w: wh.w, h: wh.h }); await cho(250)
      const kk = await e('(() => { const b = __t.hcn(toolbarEl); return { ...b, W: innerWidth, H: innerHeight } })()')
      kiem('Vi tri thanh: vung kin cua so 1920 x 1080 (hoac nho hon neu man het cho) -> thanh o giua, sat day ben trong, khong tran', gan((kk.l + kk.r) / 2, wh.w / 2, 2) && gan(kk.b, wh.h - 10, 2) && kk.l >= 0 && kk.r <= wh.w, 'tam ' + ((kk.l + kk.r) / 2).toFixed(1) + ' day ' + kk.b.toFixed(1))
    }
    en.destroy()
    // tieng Viet cung 1920
    const vi = await moOverlay(1920, 1080, 'vi')
    const v = await js(vi, `(() => { const b = __t.hcn(toolbarEl); return { ...b, W: innerWidth, H: innerHeight } })()`)
    kiem('Kich thuoc: thanh nam gon trong man 1920 (tieng Viet)', v.l >= 0 && v.r <= v.W)
    vi.destroy()
  }

  // ═════════ B. ANH GHIM 600 x 400 ═════════
  const { nativeImage } = require('electron')
  const nen = (() => { const NW = 900, NH = 600, bmp = Buffer.alloc(NW * NH * 4); for (let i = 0; i < bmp.length; i += 4) { bmp[i] = 64; bmp[i + 1] = 64; bmp[i + 2] = 64; bmp[i + 3] = 255 } return nativeImage.createFromBitmap(bmp, { width: NW, height: NH }).toDataURL() })()
  async function moGhim(dw, dh) {
    ngonNgu = 'vi'
    const pin = new BrowserWindow({ x: 0, y: 0, width: dw + 24, height: dh + 24, show: false, frame: false, transparent: true,
      webPreferences: { offscreen: { deviceScaleFactor: Number(TI_LE) }, preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false } })
    nghe(pin, 'pin')
    await pin.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
    pin.webContents.send('pin:data', { dataUrl: nen, pad: 12, w: dw, h: dh, lamMoKieu: 'mosaic' })
    await cho(400)
    await js(pin, TRO_GIUP.replace("veEl.toDataURL('image/png')", "veEl.toDataURL('image/png')"))
    if (HONG && LAM_HONG[HONG] && HONG !== 'vitri') await js(pin, LAM_HONG[HONG])
    return pin
  }
  {
    const pin = await moGhim(600, 400)
    const p = (s) => js(pin, s)
    await p('__t.phim("1","Digit1")') // vao che do ve
    await p('__t.keo([40,40],[200,120])'); await p('__t.phim("2","Digit2"); __t.keo([250,60],[420,160])')
    await p('__t.phim("7","Digit7"); __t.net([[40,300],[220,300]])'); await p('__t.phim("8","Digit8"); __t.net([[260,300],[460,300]])')
    await p('__t.phim("6","Digit6"); __t.bam([500,60])')
    const loai = await p('__t.loai()'), full = await p('__t.ds()'), anhDay = await p('__t.anh()')
    kiem('Anh ghim - Lam lai: ve 5 net (khung, mui ten, but, da quang, so)', loai === 'rect,arrow,but,daquang,so', loai)
    const ts = ['[]']; const dsl = loai.split(',')
    let okU = true
    for (let i = 4; i >= 0; i--) { ts.unshift(await p('__t.ds()')); await p('__t.phim("z","KeyZ",{ ctrlKey: true })'); if ((await p('__t.loai()')) !== dsl.slice(0, i).join(',')) okU = false }
    ts.shift(); ts.unshift('[]')
    const dsTrang = [await p('__t.ds()')]
    kiem('Anh ghim - Hoan tac: Ctrl+Z bo dung net cuoi, het 5 loai', okU && (await p('shapes.length')) === 0 && (await p('document.getElementById("redo").disabled')) === false)
    const cach = ['Ctrl+Y', 'Ctrl+Shift+Z', 'nut', 'Ctrl+Y', 'nut']
    let okR = true, ct = ''
    const trangThaiTheoSo = []
    // dung lai tung trang thai: ve lai theo thu tu de co chuan, bang cach redo roi so voi loai
    for (let i = 0; i < 5; i++) {
      if (cach[i] === 'Ctrl+Y') await p('__t.phim("y","KeyY",{ ctrlKey: true })')
      else if (cach[i] === 'Ctrl+Shift+Z') await p('__t.phim("Z","KeyZ",{ ctrlKey: true, shiftKey: true })')
      else await p('document.getElementById("redo").click()')
      if ((await p('__t.loai()')) !== dsl.slice(0, i + 1).join(',')) { okR = false; ct += ' buoc ' + (i + 1) + ' ' + cach[i] }
    }
    kiem('Anh ghim - Lam lai: Ctrl+Y / Ctrl+Shift+Z / nut khoi phuc dung tung net, tro lai nhu cu', okR && (await p('__t.ds()')) === full && (await p('__t.anh()')) === anhDay, ct)
    await p('__t.phim("z","KeyZ",{ ctrlKey: true })'); await p('__t.phim("1","Digit1"); __t.keo([300,100],[380,160])'); await p('__t.phim("y","KeyY",{ ctrlKey: true })')
    kiem('Anh ghim - Lam lai: ve net moi thi hang doi bi xoa', (await p('document.getElementById("redo").disabled')) === true && (await p('shapes.length')) === 5)

    // bang mau + menu but trong anh ghim: phai nam gon trong khung anh
    const trongKhung = `(el) => { const f = document.getElementById('frame').getBoundingClientRect(), r = el.getBoundingClientRect(); return r.left >= f.left - 0.5 && r.right <= f.right + 0.5 && r.top >= f.top - 0.5 && r.bottom <= f.bottom + 0.5 }`
    await p('document.getElementById("mau-hien").click()')
    const m1 = await p(`(${trongKhung})(document.getElementById('mau-pop'))`)
    const m1b = await p('({ len: document.getElementById("mau-pop").classList.contains("len"), h: document.getElementById("mau-pop").getBoundingClientRect().height })')
    kiem('Anh ghim - Bang mau: xo ra nam gon trong khung anh (khong bi cat), xo LEN vi thanh o day anh', m1 && m1b.len, JSON.stringify(m1b))
    await p('document.querySelector("#mau-pop .mau[data-color=\\"#0a84ff\\"]").click()')
    kiem('Anh ghim - Bang mau: chon mau thi bang dong + cham doi mau', (await p('document.getElementById("mau-pop").hidden')) === true && (await p('getComputedStyle(document.getElementById("mau-hien").firstElementChild).backgroundColor')) === 'rgb(10, 132, 255)')
    await p('document.getElementById("mau-hien").click()'); await p('__t.chuot("mousedown", 300, 150, veEl)')
    kiem('Anh ghim - Bang mau: bam ra ngoai thi dong', (await p('document.getElementById("mau-pop").hidden')) === true)
    await p('document.getElementById("mau-hien").click()'); await p('__t.phim("Escape","Escape")')
    kiem('Anh ghim - Bang mau: Esc dong bang truoc, van dang o che do ve', (await p('document.getElementById("mau-pop").hidden')) === true && (await p('mode')) === 've')
    await p('document.getElementById("but-nhom").dispatchEvent(new MouseEvent("mouseenter"))')
    const mb = await p(`(${trongKhung})(document.getElementById('but-menu'))`)
    await p('document.querySelector("#but-menu .muc-xo[data-tool=\\"daquang\\"]").click()')
    kiem('Anh ghim - Nut but: menu xo nam gon trong khung anh; chon Da quang doi cong cu + icon', mb && (await p('tool')) === 'daquang' && (await p('document.getElementById("but-nhom").classList.contains("dq")')) && (await p('document.getElementById("but-menu").hidden')) === true)
    await p('__t.phim("7","Digit7")')
    kiem('Anh ghim - Nut but: phim 7 doi lai bút', (await p('tool')) === 'but' && !(await p('document.getElementById("but-nhom").classList.contains("dq")')))
    const rongP = await p('(() => { const b = __t.hcn(toolbarEl); const nut = [...toolbarEl.querySelectorAll(".cong-cu")].filter((x) => x.getBoundingClientRect().width); return { w: Math.round(b.w), nut: [...new Set(nut.map((x) => Math.round(x.getBoundingClientRect().width)))].join() } })()')
    rong['ghim'] = rongP.w
    kiem('Anh ghim - Kich thuoc: nut 40 px', rongP.nut === '40', rongP.nut)
    pin.destroy()
  }
  {
    // anh ghim NHO 320 x 200: bang mau / menu van nam trong khung
    const pin = await moGhim(320, 200)
    const p = (s) => js(pin, s)
    await p('__t.phim("1","Digit1")')
    const trongKhung = `(el) => { const f = document.getElementById('frame').getBoundingClientRect(), r = el.getBoundingClientRect(); return r.left >= f.left - 0.5 && r.right <= f.right + 0.5 && r.top >= f.top - 0.5 && r.bottom <= f.bottom + 0.5 }`
    await p('document.getElementById("mau-hien").click()')
    const nho = await p(`({ ok: (${trongKhung})(document.getElementById('mau-pop')), cls: document.getElementById('mau-pop').className, r: __t.hcn('#mau-pop'), f: __t.hcn('#frame') })`)
    kiem('Anh ghim nho 320x200 - Bang mau: nam gon trong khung (tu xep ngang khi thieu cho doc)', nho.ok, nho.cls + ' bang ' + Math.round(nho.r.t) + '..' + Math.round(nho.r.b) + ' khung ' + Math.round(nho.f.t) + '..' + Math.round(nho.f.b))
    await p('__t.phim("Escape","Escape")')
    await p('document.getElementById("but-nhom").dispatchEvent(new MouseEvent("mouseenter"))')
    const mn = await p(`({ ok: (${trongKhung})(document.getElementById('but-menu')), r: __t.hcn('#but-menu'), f: __t.hcn('#frame') })`)
    kiem('Anh ghim nho 320x200 - Menu but: nam gon trong khung', mn.ok, Math.round(mn.r.t) + '..' + Math.round(mn.r.b) + ' khung ' + Math.round(mn.f.t) + '..' + Math.round(mn.f.b))
    pin.destroy()
  }

  for (const [dw, dh] of [[300, 200], [160, 100]]) { // 04/11 nguoi soat bat: anh nho thi thanh cao hon anh, nut nam ngoai khung
    const pin = await moGhim(dw, dh)
    await js(pin, '__t.phim("1","Digit1")')
    const v = await js(pin, `(() => { const f = document.getElementById('frame').getBoundingClientRect(), t = toolbarEl.getBoundingClientRect(); const nut = [...toolbarEl.querySelectorAll('.cong-cu, #mau-hien')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect()); return { tren: t.top >= f.top - 0.5, duoi: t.bottom <= f.bottom + 0.5, ngoai: nut.filter((r) => r.left < f.left - 0.5 || r.right > f.right + 0.5 || r.top < f.top - 0.5 || r.bottom > f.bottom + 0.5).length, nut: nut.length, cao: Math.round(t.height), oNho: Math.round(Math.min(...nut.map((r) => r.width))) } })()`)
    kiem('Anh ghim nho ' + dw + 'x' + dh + ' - Thanh: moi nut nam trong khung', v.tren && v.duoi && v.ngoai === 0 && v.nut > 10, 'cao ' + v.cao + ', ' + v.nut + ' nut, ' + v.ngoai + ' ngoai khung, nut nho nhat ' + v.oNho + ' px')
    pin.destroy()
  }

  console.log('KQ=' + JSON.stringify({ kq, loiTrang, rong }))
  app.exit(0)
}).catch(chet)
