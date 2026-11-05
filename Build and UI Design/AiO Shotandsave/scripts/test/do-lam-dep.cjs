/* Do tinh nang LAM DEP ANH (src/lamdep/, src/lamdep-main.js). Chay AN: cua so show:false, thu muc tam, userData tam.
   Chay: npm run test:lamdep   (node scripts/test/do-lam-dep.cjs)
   Chay duoc ca khi khong co node_modules trong thu muc nay: export NODE_PATH=<thu muc app co node_modules>.

   Do HANH VI that qua cua so that (bam nut that trong trang, IPC that, file that):
   1. xuat dung kich thuoc theo tung ti le (tu do, 1:1, 4:5, 9:16, 16:9), khong cat anh, khong qua tran 8192
   2. anh goc nam dung GIUA: tung diem anh trong khung xuat = tung diem anh file goc (ti le 1:1)
   3. goc bo trong suot voi PNG (nen "Trong suot"), doi chung: bo 0 thi goc KHONG trong suot
   4. bon kieu nen + do bong; xem truoc cung kich thuoc xuat voi ban xuat
   5. md5 anh goc truoc = sau; file moi co ten rieng, luu 2 lan ra 2 file, khong ghi de; khay nap lai duoc (bo loc ten cua main)
   6. 2 ngon ngu khong tran chu o kich thuoc cua so nho nhat
   7. DOI CHUNG: tung bo do bi lam hong co tinh phai BAT DUOC. */
'use strict'
const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')

const ROOT = path.resolve(__dirname, '..', '..')

if (!process.versions.electron) {
  /* ---- Vai cha: bat Electron chay chinh file nay ---- */
  const { spawnSync } = require('child_process')
  const electron = require('electron')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE // VS Code dat =1 -> electron chay nhu Node tran
  const r = spawnSync(electron, [__filename], { env, stdio: 'inherit', timeout: 280000 })
  process.exit(r.status == null ? 2 : r.status)
}

/* ---- Vai Electron (main) ---- */
const { app, BrowserWindow, ipcMain, nativeImage, clipboard, screen } = require('electron')
const TAM = path.join(os.tmpdir(), 'aio-lamdep-do-' + process.pid)
const ANH = path.join(TAM, 'anh')
const MAU_DIR = process.env.AIO_MAU_DIR || path.join(TAM, 'mau')
fs.rmSync(TAM, { recursive: true, force: true })
fs.mkdirSync(ANH, { recursive: true })
app.setPath('userData', path.join(TAM, 'userData'))
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

let lang = 'vi'
ipcMain.on('i18n:lang', (e) => { e.returnValue = lang })

const kq = []
let dat = true
const kiem = (ten, ok, ct) => {
  kq.push((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? '  [' + ct + ']' : ''))
  if (!ok) dat = false
}
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')

/* ---------- anh mau ---------- */
function anhMau(w, h) {
  const b = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    b[i] = (x * 7 + y * 3) & 255 // B
    b[i + 1] = (y * 5 + (x >> 3)) & 255 // G
    b[i + 2] = ((x * y) >> 4) & 255 // R
    b[i + 3] = 255
  }
  return nativeImage.createFromBitmap(b, { width: w, height: h })
}
/* ghi ra file PNG roi doc lai: bitmap goc dung de so la bitmap SAU khi qua PNG (dung thu cua cua so) */
function taoAnhGoc(ten, w, h) {
  const f = path.join(ANH, ten)
  fs.writeFileSync(f, anhMau(w, h).toPNG())
  return f
}
const docBmp = (buf) => { const im = nativeImage.createFromBuffer(buf); return { w: im.getSize().width, h: im.getSize().height, bmp: im.toBitmap() } }

/* ---------- bo kiem (co doi chung) ---------- */
const px = (bmp, W, x, y) => { const i = (y * W + x) * 4; return { b: bmp[i], g: bmp[i + 1], r: bmp[i + 2], a: bmp[i + 3] } }

/** So hang cua vung anh goc KHAC anh nguon (0 = giong tung diem). Bo hang goc bo khi r>0. */
function lechVung(bmpC, CW, bmpS, w, h, x0, y0, r) {
  let lech = 0
  for (let y = 0; y < h; y++) {
    if (r > 0 && (y < r + 2 || y >= h - r - 2)) continue
    const a = bmpC.subarray(((y0 + y) * CW + x0) * 4, ((y0 + y) * CW + x0 + w) * 4)
    const s = bmpS.subarray(y * w * 4, (y + 1) * w * 4)
    if (!a.equals(s)) lech++
  }
  return lech
}
function kichThuocDung(cw, ch, w, h, tiLe, le) {
  const m = Math.round((le / 100) * Math.max(w, h))
  let ew = w + 2 * m, eh = h + 2 * m
  if (tiLe !== 'free') {
    const [a, b] = tiLe.split(':').map(Number)
    if (ew * b >= eh * a) eh = Math.round((ew * b) / a); else ew = Math.round((eh * a) / b)
  }
  const khongCat = cw >= w && ch >= h
  const vua = cw >= ew && cw <= ew + 1 && ch >= eh && ch <= eh + 1
  let tiLeDung = true
  if (tiLe !== 'free') { const [a, b] = tiLe.split(':').map(Number); tiLeDung = Math.abs(cw / ch - a / b) <= 2 / Math.min(cw, ch) + 0.002 }
  return khongCat && vua && tiLeDung
}
/* do tran chu: tra ve danh sach phan tu co chu nam ngoai hop cua no / ngoai cua so */
const JS_TRAN = `(() => {
  const loi = []
  const W = window.innerWidth, H = window.innerHeight
  const skip = new Set(['tt-ten'])
  for (const el of document.body.querySelectorAll('*')) {
    if (skip.has(el.id) || el.closest('#tt-ten')) continue
    const coChu = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!coChu) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const rg = document.createRange(); rg.selectNodeContents(el)
    const t = rg.getBoundingClientRect(), b = el.getBoundingClientRect()
    const ten = el.id || el.className || el.tagName
    if (t.right > b.right + 0.6 || t.left < b.left - 0.6) loi.push(ten + ': chu tran hop ngang ' + Math.round(t.right - b.right) + 'px')
    if (el.scrollWidth > el.clientWidth + 1 && cs.display !== 'inline') loi.push(ten + ': scrollWidth ' + el.scrollWidth + ' > ' + el.clientWidth)
    if (t.right > W + 0.5 || t.bottom > H + 0.5 || t.left < -0.5 || t.top < -0.5) loi.push(ten + ': chu ngoai cua so')
  }
  const cuon = document.getElementById('cuon')
  if (cuon.scrollHeight > cuon.clientHeight + 1) loi.push('bang dieu khien phai cuon doc (' + cuon.scrollHeight + ' > ' + cuon.clientHeight + ')')
  const tt = document.getElementById('tt'), chan = document.getElementById('chan')
  if (tt.scrollWidth > chan.clientWidth) loi.push('dong trang thai tran chan')
  const nl = document.getElementById('tt-nhan')
  if (nl.scrollWidth > nl.clientWidth + 1) loi.push('tt-nhan bi cat')
  return loi
})()`

/* ---------- dieu khien cua so ---------- */
const lamdepMain = require(path.join(ROOT, 'src', 'lamdep-main.js'))
const LD = require(path.join(ROOT, 'src', 'lamdep', 'render.js')) // chi dung hang so (ti le tran...), bo ve chay trong cua so
let ld
let luus = 0
const ev = (js) => ld.cuaSo().webContents.executeJavaScript(js)

async function moVaCho(filePath, image) {
  const dang = ld.cuaSo()
  const xong = dang ? new Promise((rs) => dang.webContents.once('did-finish-load', rs)) : null
  ld.mo({ image, filePath })
  const w = ld.cuaSo()
  if (xong) await xong
  for (let i = 0; i < 100; i++) {
    await cho(100)
    try { if (await w.webContents.executeJavaScript('document.body.dataset.san === "1"')) return w } catch (e) {}
  }
  throw new Error('cua so lam dep khong san sang')
}

async function datTuyChon(o) {
  await ev(`(async () => {
    const o = ${JSON.stringify(o)}
    const bam = (sel) => { const b = document.querySelector(sel); if (!b) throw new Error('khong thay ' + sel); b.click() }
    if (o.tiLe) bam('#g-tile .chon-nut[data-v="' + o.tiLe + '"]')
    if (o.nen) bam('#g-nen .chon-nut[data-v="' + o.nen + '"]')
    if (o.gd != null) { const b = document.querySelectorAll('.o-mau')[o.gd]; if (b) b.click() }
    if (o.mau) { document.querySelectorAll('.o-mau').forEach((b) => { if (b.getAttribute('aria-label') === o.mau) b.click() }) }
    for (const [k, id] of [['le', 's-le'], ['bo', 's-bo'], ['bong', 's-bong']]) {
      if (o[k] == null) continue
      const s = document.getElementById(id); s.value = o[k]; s.dispatchEvent(new Event('input', { bubbles: true }))
    }
    veXem()
  })()`)
}

async function luuBangNut() {
  const truoc = new Set(fs.readdirSync(ANH))
  await ev('delete document.body.dataset.luu; document.getElementById("btn-luu").click(); 0')
  for (let i = 0; i < 200; i++) {
    await cho(100)
    const ten = await ev('document.body.dataset.luu || ""')
    if (ten) {
      const moi = fs.readdirSync(ANH).filter((f) => !truoc.has(f))
      luus++
      return { ten, moi, file: path.join(ANH, ten) }
    }
    const tt = await ev('document.body.dataset.tt || ""')
    if (tt === 'loi') return { ten: null, moi: [], loi: await ev('document.getElementById("tt-ten").textContent') }
  }
  return { ten: null, moi: [], loi: 'het gio' }
}

/* ---------- chinh ---------- */
async function chay() {
  ld = lamdepMain.khoiTao({
    ipcMain, BrowserWindow, nativeImage, clipboard, screen,
    thuMucAnh: () => path.join(TAM, 'anh-mac-dinh'),
    ghiLog: () => {}, hien: false,
  })
  const clipText = clipboard.readText(); const clipImg = clipboard.readImage()

  const W = 640, H = 400
  const goc = taoAnhGoc('shotandsave-2026-11-05-100000-000.png', W, H)
  const md5Truoc = md5(goc)
  const nguon = docBmp(fs.readFileSync(goc))
  const imgGoc = nativeImage.createFromPath(goc)
  kiem('anh mau doc lai dung kich thuoc', nguon.w === W && nguon.h === H)

  console.log('\n[1] Kich thuoc xuat theo tung ti le + anh goc nam dung giua (nen dac, bo 0, bong 0)')
  await moVaCho(goc, imgGoc)
  const gocWin = await ev('document.body.dataset.goc')
  kiem('cua so nhan dung anh goc', gocWin === W + 'x' + H, gocWin)
  const dsFile = []
  for (const tl of ['free', '1:1', '4:5', '9:16', '16:9']) {
    for (const le of [0, 10]) {
      await datTuyChon({ tiLe: tl, nen: 'dac', mau: '#f2eee6', le, bo: 0, bong: 0 })
      const r = await luuBangNut()
      if (!r.ten) { kiem('luu ' + tl + ' le ' + le, false, r.loi); continue }
      dsFile.push(r.file)
      const o = docBmp(fs.readFileSync(r.file))
      const ok = kichThuocDung(o.w, o.h, W, H, tl, le)
      kiem('ti le ' + tl + ', le ' + le + '%: ' + o.w + 'x' + o.h, ok)
      const x0 = (o.w - W) / 2, y0 = (o.h - H) / 2
      const nguyen = Number.isInteger(x0) && Number.isInteger(y0)
      const lech = nguyen ? lechVung(o.bmp, o.w, nguon.bmp, W, H, x0, y0, 0) : -1
      kiem('  anh goc nam GIUA (' + x0 + ',' + y0 + '), tung diem giong file goc', nguyen && lech === 0, 'hang lech ' + lech)
      const nen = o.w > W ? px(o.bmp, o.w, 1, 1) : null
      if (nen) kiem('  nen dac dung mau #f2eee6', nen.r === 0xf2 && nen.g === 0xee && nen.b === 0xe6 && nen.a === 255)
      const xem = await ev('[document.body.dataset.cw, document.body.dataset.ch].join("x")')
      kiem('  xem truoc bao cung kich thuoc xuat', xem === o.w + 'x' + o.h, xem)
    }
  }

  console.log('\n[2] Goc bo trong suot (PNG), nen Trong suot')
  await datTuyChon({ tiLe: 'free', nen: 'trong', le: 10, bo: 20, bong: 0 })
  let r = await luuBangNut()
  let o = docBmp(fs.readFileSync(r.file))
  const m10 = Math.round(0.1 * Math.max(W, H))
  let x0 = (o.w - W) / 2, y0 = (o.h - H) / 2
  const gocAnh = px(o.bmp, o.w, x0, y0), gocKhung = px(o.bmp, o.w, 0, 0)
  const giuaCanh = px(o.bmp, o.w, x0 + (W >> 1), y0), giuaAnh = px(o.bmp, o.w, x0 + (W >> 1), y0 + (H >> 1))
  const giuaNguon = px(nguon.bmp, W, W >> 1, H >> 1)
  kiem('goc anh bo tron TRONG SUOT (alpha ' + gocAnh.a + ')', gocAnh.a === 0)
  kiem('goc khung trong suot (nen Trong suot, alpha ' + gocKhung.a + ')', gocKhung.a === 0)
  kiem('giua canh tren cua anh con DAC (alpha ' + giuaCanh.a + ')', giuaCanh.a === 255)
  kiem('diem giua anh giong file goc', giuaAnh.r === giuaNguon.r && giuaAnh.g === giuaNguon.g && giuaAnh.b === giuaNguon.b && giuaAnh.a === 255)
  const lechBo = lechVung(o.bmp, o.w, nguon.bmp, W, H, x0, y0, Math.round(0.2 * Math.min(W, H)))
  kiem('cac hang giua anh (tru hang goc) giong file goc khi bo 20%', lechBo === 0, 'hang lech ' + lechBo)
  kiem('le ' + m10 + ' px quanh anh trong suot (alpha ' + px(o.bmp, o.w, 5, o.h >> 1).a + ')', px(o.bmp, o.w, 5, o.h >> 1).a === 0)
  const goc20Alpha = gocAnh.a
  const goc20Mau = px(o.bmp, o.w, x0 + 1, y0 + 1)
  kiem('diem sat goc (x0+1,y0+1) cung trong suot', goc20Mau.a === 0)

  console.log('\n[3] Bon kieu nen + bong + gioi han 8192')
  await datTuyChon({ tiLe: 'free', nen: 'dac', mau: '#ffffff', le: 15, bo: 5, bong: 100 })
  r = await luuBangNut(); o = docBmp(fs.readFileSync(r.file))
  x0 = (o.w - W) / 2; y0 = (o.h - H) / 2
  const duoiAnh = px(o.bmp, o.w, o.w >> 1, y0 + H + 6), xaGoc = px(o.bmp, o.w, 2, 2)
  kiem('do bong 100: sat duoi anh toi hon nen (' + duoiAnh.r + ' < 250)', duoiAnh.r < 250)
  kiem('xa anh, nen van trang tinh (' + xaGoc.r + ',' + xaGoc.g + ',' + xaGoc.b + ')', xaGoc.r === 255 && xaGoc.g === 255 && xaGoc.b === 255)
  await datTuyChon({ nen: 'dac', mau: '#ffffff', bong: 0 })
  r = await luuBangNut(); o = docBmp(fs.readFileSync(r.file))
  kiem('doi chung: bong 0 thi sat duoi anh khong toi hon nen', px(o.bmp, o.w, o.w >> 1, (o.h - H) / 2 + H + 6).r === 255)

  await datTuyChon({ nen: 'chuyen', gd: 1, bong: 0, bo: 0, le: 15 })
  r = await luuBangNut(); o = docBmp(fs.readFileSync(r.file))
  const tl = px(o.bmp, o.w, 1, 1), br = px(o.bmp, o.w, o.w - 2, o.h - 2)
  const gd = LD.CHUYEN_SAC[1]
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  const gan = (p, c) => Math.abs(p.r - c[0]) < 14 && Math.abs(p.g - c[1]) < 14 && Math.abs(p.b - c[2]) < 14
  kiem('chuyen sac: goc tren-trai ~ mau dau, goc duoi-phai ~ mau cuoi', gan(tl, hex(gd[0])) && gan(br, hex(gd[1])), `tl ${tl.r},${tl.g},${tl.b} br ${br.r},${br.g},${br.b}`)
  kiem('chuyen sac: hai goc khac nhau', Math.abs(tl.r - br.r) + Math.abs(tl.g - br.g) > 40)

  await datTuyChon({ nen: 'mo', bong: 0, bo: 0, le: 15 })
  r = await luuBangNut(); o = docBmp(fs.readFileSync(r.file))
  x0 = (o.w - W) / 2; y0 = (o.h - H) / 2
  kiem('anh mo: nen dac kin (alpha 255) va anh goc van nguyen',
    px(o.bmp, o.w, 1, 1).a === 255 && px(o.bmp, o.w, o.w - 2, o.h - 2).a === 255 && lechVung(o.bmp, o.w, nguon.bmp, W, H, x0, y0, 0) === 0)
  const khacNen = (() => { const a = px(o.bmp, o.w, 1, 1), c = px(o.bmp, o.w, o.w - 2, 1); return Math.abs(a.r - c.r) + Math.abs(a.g - c.g) + Math.abs(a.b - c.b) })()
  kiem('anh mo: nen lay mau tu chinh anh (khong phang, 2 goc khac nhau ' + khacNen + ')', khacNen > 6)

  // tran 8192: anh 4000x2400 o 9:16 -> 8249 > 8192 -> phai thu nho
  const lon = taoAnhGoc('shotandsave-2026-11-05-100001-000.png', 4000, 2400)
  await moVaCho(lon, nativeImage.createFromPath(lon))
  await datTuyChon({ tiLe: '9:16', nen: 'dac', mau: '#111111', le: 8, bo: 3, bong: 40 })
  const t0 = Date.now(); await ev('veXem()'); const msXem = Date.now() - t0
  r = await luuBangNut(); o = docBmp(fs.readFileSync(r.file))
  kiem('anh lon 4000x2400 o 9:16: canh dai nhat <= 8192 (' + o.w + 'x' + o.h + ')', Math.max(o.w, o.h) <= 8192 && Math.max(o.w, o.h) > 8000)
  kiem('  ti le van 9:16', Math.abs(o.w / o.h - 9 / 16) < 0.002)
  kiem('  xem truoc tren anh lon ' + msXem + ' ms (< 600)', msXem < 600)

  console.log('\n[4] Anh goc khong bi dung toi; file moi; khay nap lai duoc')
  const sauMd5 = md5(goc)
  kiem('md5 anh goc truoc = sau (' + md5Truoc.slice(0, 8) + ')', md5Truoc === sauMd5)
  const tatCa = fs.readdirSync(ANH)
  const moiFile = tatCa.filter((f) => f.startsWith('shotandsave-lamdep-'))
  kiem('so file moi = so lan luu (' + moiFile.length + ')', moiFile.length === luus)
  kiem('ten file moi khac nhau het', new Set(moiFile).size === moiFile.length)
  kiem('moi file moi la PNG hop le', moiFile.every((f) => { const b = fs.readFileSync(path.join(ANH, f)); return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) }))
  // bo loc khay: copy dung bieu thuc trong main.js layDanhSachAnhGanNhat
  const mainSrc = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8').replace(/
/g, '
')
  const locKhay = (f) => /\.(png|jpe?g)$/i.test(f) && !f.startsWith('.') && !f.startsWith('shotandsave-storyboard-')
  kiem('main.js van dung bo loc nay (tranh do bang ban sao cu)', mainSrc.includes("/\\.(png|jpe?g)$/i.test(f) && !f.startsWith('.') && !f.startsWith('shotandsave-storyboard-')"))
  kiem('khay nap lai duoc moi file moi', moiFile.every(locKhay))
  kiem('shelfAdd va handleConfirm khong bi sua (khong co tu lamdep trong 2 ham)', (() => {
    const m1 = mainSrc.match(/function shelfAdd[\s\S]*?\n}\n/), m2 = mainSrc.match(/function handleConfirm[\s\S]*?\n}\n/)
    return !!m1 && !!m2 && !/lamdep|lamDep/i.test(m1[0] + m2[0])
  })())
  // luu file moi nhanh lien tiep, 40 lan: tat ca khac nhau
  const dirNhanh = path.join(TAM, 'nhanh')
  const png = anhMau(8, 8).toPNG()
  const tenNhanh = new Set()
  for (let i = 0; i < 40; i++) { const k = lamdepMain.luuFileMoi(dirNhanh, png); if (k.ok) tenNhanh.add(k.ten) }
  kiem('luu nhanh 40 lan ra 40 file khac nhau, dem lai dung', tenNhanh.size === 40 && fs.readdirSync(dirNhanh).length === 40)
  kiem('khong phai PNG thi tu choi, khong tao file', lamdepMain.luuFileMoi(dirNhanh, Buffer.from('khong phai png do dai du dai')).ok === false && fs.readdirSync(dirNhanh).length === 40)
  // ten da co thi KHONG ghi de (co wx)
  const daCo = path.join(dirNhanh, 'da-co.png'); fs.writeFileSync(daCo, 'CU')
  let loiWx = null; try { fs.writeFileSync(daCo, 'MOI', { flag: 'wx' }) } catch (e) { loiWx = e.code }
  kiem('co "wx": ghi vao ten da co bi tu choi (' + loiWx + '), noi dung cu con', loiWx === 'EEXIST' && fs.readFileSync(daCo, 'utf8') === 'CU')
  // doi chung md5: neu anh goc bi sua 1 byte thi md5 phai doi
  const ban = path.join(TAM, 'ban-sao.png'); fs.copyFileSync(goc, ban); const m0 = md5(ban)
  fs.appendFileSync(ban, Buffer.from([0])); kiem('doi chung: sua 1 byte -> md5 doi', md5(ban) !== m0)

  console.log('\n[5] Sao chep vao clipboard')
  await moVaCho(goc, imgGoc)
  await datTuyChon({ tiLe: '1:1', nen: 'dac', mau: '#111111', le: 10, bo: 4, bong: 30 })
  const sizeXem = (await ev('[document.body.dataset.cw, document.body.dataset.ch].join("x")')).split('x').map(Number)
  clipboard.clear()
  await ev('document.getElementById("btn-chep").click(); 0')
  let cb = null
  for (let i = 0; i < 80; i++) { await cho(100); const im = clipboard.readImage(); if (!im.isEmpty()) { cb = im.getSize(); break } }
  kiem('clipboard co anh dung kich thuoc xuat (' + (cb ? cb.width + 'x' + cb.height : 'rong') + ')', !!cb && cb.width === sizeXem[0] && cb.height === sizeXem[1])
  kiem('sao chep khong tao file moi', fs.readdirSync(ANH).filter((f) => f.startsWith('shotandsave-lamdep-')).length === moiFile.length)

  console.log('\n[6] Chu khong tran o cua so nho nhat, 2 ngon ngu')
  for (const lg of ['vi', 'en']) {
    lang = lg
    const w = await moVaCho(goc, imgGoc)
    const [mw, mh] = w.getMinimumSize()
    w.setSize(mw, mh)
    await cho(400)
    const dang = w.getContentSize()
    const loi0 = await ev(JS_TRAN)
    kiem(lg + ': cua so nho nhat ' + mw + 'x' + mh + ' (noi dung ' + dang[0] + 'x' + dang[1] + '), 0 cho tran chu', loi0.length === 0, loi0.join(' | '))
    const ten = await ev('document.getElementById("title").textContent')
    kiem(lg + ': tieu de dung ngon ngu (' + ten + ')', lg === 'vi' ? ten === 'Làm đẹp ảnh' : ten === 'Beautify image')
    // chuyen sang nen dac de hien hang mau tu chon + luu 1 lan de co dong trang thai
    await datTuyChon({ nen: 'dac' })
    const rl = await luuBangNut()
    await cho(150)
    const loi1 = await ev(JS_TRAN)
    kiem(lg + ': sau khi luu (dong trang thai co ten file dai), 0 cho tran', loi1.length === 0, loi1.join(' | '))
    const nhan = await ev('document.getElementById("tt-nhan").textContent')
    kiem(lg + ': nhan trang thai "' + nhan + '"', lg === 'vi' ? nhan === 'Đã lưu bản mới' : nhan === 'Saved as new file')
    kiem(lg + ': khong con chuoi thieu dich (khoa tran ra man hinh)', !(await ev('/\\bld\\.[a-zA-Z]+\\b|ghim\\.[a-zA-Z]+/.test(document.body.innerText)')))
    kiem(lg + ': luu duoc ' + (rl.ten || rl.loi), !!rl.ten)
  }
  lang = 'vi'
  // DOI CHUNG bo do tran: ep nut chinh dai 3 lan -> phai bi bat
  await moVaCho(goc, imgGoc)
  ld.cuaSo().setSize(...ld.cuaSo().getMinimumSize()); await cho(300)
  await ev('document.getElementById("btn-luu").textContent = "Luu ban moi cua toi rat rat rat dai dong"; 0')
  const loiEp = await ev(JS_TRAN)
  kiem('doi chung: ep nut dai ra thi bo do BAT duoc (' + loiEp.length + ' cho)', loiEp.length > 0)
  await ev('document.getElementById("btn-luu").textContent = "Lưu bản mới"; document.getElementById("g-tile").style.width = "60px"; 0')
  const loiEp2 = await ev(JS_TRAN)
  kiem('doi chung: ep nhom ti le hep lai thi bi bat (' + loiEp2.length + ' cho)', loiEp2.length > 0)

  console.log('\n[7] Doi chung bo kiem kich thuoc / giua / goc')
  const o1 = docBmp(fs.readFileSync(dsFile[0]))
  const m1 = (o1.w - W) / 2
  kiem('doi chung: kichThuocDung tu choi kich thuoc sai (+5) va ti le sai', !kichThuocDung(o1.w + 5, o1.h, W, H, 'free', 0) && !kichThuocDung(1000, 1000, W, H, '9:16', 0) && !kichThuocDung(W - 1, H, W, H, 'free', 0))
  void m1
  const o2 = docBmp(fs.readFileSync(dsFile[1])) // free, le 10: co le
  kiem('doi chung: lechVung bat anh dich 1 diem (le 10%)', lechVung(o2.bmp, o2.w, nguon.bmp, W, H, (o2.w - W) / 2 + 1, (o2.h - H) / 2, 0) > 0)
  kiem('doi chung: lechVung = 0 khi dung cho', lechVung(o2.bmp, o2.w, nguon.bmp, W, H, (o2.w - W) / 2, (o2.h - H) / 2, 0) === 0)
  kiem('doi chung: bo 0 thi goc anh KHONG trong suot (alpha ' + px(o2.bmp, o2.w, (o2.w - W) / 2, (o2.h - H) / 2).a + ')', px(o2.bmp, o2.w, (o2.w - W) / 2, (o2.h - H) / 2).a === 255 && goc20Alpha === 0)

  console.log('\n[8] Mau xuat de nhin bang mat')
  try {
    const ds = await xuatMau()
    for (const f of ds) console.log('   mau: ' + f)
    kiem('xuat ' + ds.length + ' anh mau ra ' + MAU_DIR, ds.length === 5)
  } catch (e) { kiem('xuat anh mau', false, e.message) }

  // dong cua so, tra clipboard
  try { if (ld.cuaSo()) ld.cuaSo().destroy() } catch (e) {}
  if (clipText) clipboard.writeText(clipText); else if (!clipImg.isEmpty()) clipboard.writeImage(clipImg); else clipboard.clear()
}

/* anh mau "giong man hinh that": cua so ung dung gia, ve bang canvas trong mot trang an */
async function veAnhGia() {
  const w = new BrowserWindow({ show: false, width: 800, height: 600, webPreferences: { backgroundThrottling: false } })
  await w.loadURL('data:text/html,<html></html>')
  const dataUrl = await w.webContents.executeJavaScript(`(() => {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 800
    const x = c.getContext('2d')
    x.fillStyle = '#1b1c22'; x.fillRect(0, 0, 1280, 800)
    x.fillStyle = '#2a2c35'; x.fillRect(0, 0, 1280, 44)
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((k, i) => { x.fillStyle = k; x.beginPath(); x.arc(24 + i * 24, 22, 7, 0, 7); x.fill() })
    x.fillStyle = '#d7d9e0'; x.font = '600 15px Segoe UI, Arial'; x.fillText('Bao cao doanh thu quy 3', 560, 27)
    x.fillStyle = '#23252d'; x.fillRect(0, 44, 220, 756)
    for (let i = 0; i < 8; i++) { x.fillStyle = i === 2 ? '#f86820' : '#3a3d49'; x.fillRect(20, 72 + i * 44, i === 2 ? 170 : 140 - (i % 3) * 20, 14) }
    x.fillStyle = '#f2f3f7'; x.font = '700 30px Segoe UI, Arial'; x.fillText('Tong quan', 260, 100)
    const the = [['Doanh thu', '$128.4k', '#4ec98a'], ['Don hang', '3.912', '#729acc'], ['Ty le chot', '18,6%', '#f86820']]
    the.forEach((t, i) => { const px0 = 260 + i * 320; x.fillStyle = '#262833'; x.beginPath(); x.roundRect(px0, 130, 296, 120, 14); x.fill()
      x.fillStyle = '#9b9ba3'; x.font = '600 14px Segoe UI, Arial'; x.fillText(t[0], px0 + 20, 164)
      x.fillStyle = t[2]; x.font = '700 34px Segoe UI, Arial'; x.fillText(t[1], px0 + 20, 214) })
    x.fillStyle = '#262833'; x.beginPath(); x.roundRect(260, 280, 960, 470, 14); x.fill()
    for (let i = 0; i < 12; i++) { const h = 60 + ((i * 53) % 210); x.fillStyle = i % 4 === 3 ? '#f86820' : '#5b7ea8'; x.beginPath(); x.roundRect(300 + i * 74, 700 - h, 46, h, 6); x.fill() }
    x.strokeStyle = '#3a3d49'; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(290, 700 - i * 80); x.lineTo(1190, 700 - i * 80); x.stroke() }
    return c.toDataURL('image/png')
  })()`)
  w.destroy()
  return nativeImage.createFromDataURL(dataUrl)
}

async function xuatMau() {
  fs.mkdirSync(path.join(MAU_DIR, 'anh'), { recursive: true })
  const gia = path.join(MAU_DIR, 'anh', 'shotandsave-2026-11-05-120000-000.png')
  fs.writeFileSync(gia, (await veAnhGia()).toPNG())
  // luu vao thu muc MAU_DIR/anh: doi thu muc luu cua cua so qua duong dan anh goc
  await moVaCho(gia, nativeImage.createFromPath(gia))
  const cau = [
    { tiLe: 'free', nen: 'chuyen', gd: 0, le: 10, bo: 4, bong: 55 },
    { tiLe: '9:16', nen: 'mo', le: 8, bo: 4, bong: 60 },
    { tiLe: '1:1', nen: 'dac', mau: '#111111', le: 10, bo: 3, bong: 70 },
    { tiLe: '4:5', nen: 'chuyen', gd: 1, le: 9, bo: 5, bong: 50 },
    { tiLe: '16:9', nen: 'trong', le: 6, bo: 6, bong: 50 },
  ]
  const ds = []
  for (const c of cau) {
    await datTuyChon(c)
    const truoc = new Set(fs.readdirSync(path.join(MAU_DIR, 'anh')))
    await ev('delete document.body.dataset.luu; document.getElementById("btn-luu").click(); 0')
    for (let i = 0; i < 200; i++) { await cho(100); const t = await ev('document.body.dataset.luu || ""'); if (t) { ds.push(path.join(MAU_DIR, 'anh', t)); break } }
    void truoc
  }
  return ds
}

app.whenReady().then(async () => {
  const kt = setTimeout(() => { console.log('HET GIO'); app.exit(2) }, 240000)
  try { await chay() } catch (e) { kiem('chay bai do khong loi: ' + e.message, false); console.log(e.stack) }
  clearTimeout(kt)
  console.log('\n' + kq.join('\n'))
  const nDat = kq.filter((x) => x.startsWith('  DAT')).length
  console.log('\nKet qua: ' + (dat ? 'TAT CA DAT' : 'CO MUC TRUOT') + ' (' + nDat + '/' + kq.length + ')')
  if (!process.env.AIO_MAU_DIR) fs.rmSync(TAM, { recursive: true, force: true })
  else { try { fs.rmSync(ANH, { recursive: true, force: true }); fs.rmSync(path.join(TAM, 'userData'), { recursive: true, force: true }) } catch (e) {} }
  app.exit(dat ? 0 : 1)
})
