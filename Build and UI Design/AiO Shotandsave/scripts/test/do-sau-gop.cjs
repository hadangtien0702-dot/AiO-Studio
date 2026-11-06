'use strict'
/* =========================================================================
   Do cac loi Codex bat duoc khi soat ban gop (06/11/2026, soat dot 3, agent 1) — chay bang: npm run test:saugop
   Muc: ra-h 1 (Ctrl+C sau khi cat), 2 (hai ghim cung file), 3 (lop sua theo duong dan day du), 4 (ghi de khi khong sao luu duoc),
        6 (xoa anh ngoai app -> ban sach chua che phai tu mat), 7 (Che thong minh doc dung nen sau khi cat), 8 (link ghim nhan WebP).
   CHAY AN: cua so offscreen (show:false) nap THAT src/pin/index.html voi preload that; chuot / phim = webContents.sendInputEvent.
   Khong dung thu muc anh that, %APPDATA%, khong bat cua so len man hinh.
   DOI CHUNG: cung bai nay chay tren ma TRUOC KHI SUA (commit 41d6ae4, lay bang git archive) — moi muc (tru "Giu nguyen") PHAI truot.
   Khong do duoc o day: main.js that (timer don mo coi, pin:ocr-tu o main, ghimFileTuLink) — chi kiem ma co mat + tung ham tach rieng.
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const BAN_CU = '41d6ae4'

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  const { spawnSync } = require('child_process')
  let electronDir = path.join(ROOT, 'node_modules', 'electron', 'dist')
  if (!fs.existsSync(electronDir) && process.env.NODE_PATH) {
    for (const p of process.env.NODE_PATH.split(path.delimiter)) { const d = path.join(p, 'electron', 'dist'); if (fs.existsSync(d)) { electronDir = d; break } }
  }
  const electron = path.join(electronDir, process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? 'Electron.app/Contents/MacOS/Electron' : 'electron')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'sau-gop')
  fs.rmSync(RA, { recursive: true, force: true })
  fs.mkdirSync(RA, { recursive: true })
  const Module = require('module')

  async function kiemNode(SRC, nhan) {
    const kq = []
    const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
    const thu = (ten, f) => { try { f() } catch (e) { kiem(ten, false, 'nem loi: ' + (e && e.message)) } }
    const goc = path.join(RA, 'node-' + nhan)
    fs.mkdirSync(path.join(goc, 'anh', 'A'), { recursive: true }); fs.mkdirSync(path.join(goc, 'anh', 'B'), { recursive: true })
    const net = [{ type: 'rect', x1: 1, y1: 1, x2: 5, y2: 5, color: '#f86820' }]
    const chiMot = (L, f) => { try { return fs.readdirSync(L.dir).filter((n) => n.endsWith('.json')).filter((n) => { try { return JSON.parse(fs.readFileSync(path.join(L.dir, n), 'utf8')).duong === path.resolve(f) } catch (e) { return false } }) } catch (e) { return [] } }

    // ── Muc 3: lop sua theo duong dan day du ──
    thu('Muc 3 (khoa duong dan day du)', () => {
      const { taoLopSua } = require(path.join(SRC, 'lop-sua.js'))
      const L = taoLopSua(path.join(goc, 'ud3'), () => {})
      const dA = path.join(goc, 'anh', 'A', 'x.png'), dB = path.join(goc, 'anh', 'B', 'x.png')
      fs.writeFileSync(dA, Buffer.alloc(500, 1)); fs.writeFileSync(dB, Buffer.alloc(500, 9)) // CUNG ten, CUNG so byte, noi dung khac
      L.ghi(dA, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: Buffer.alloc(100, 1) })
      kiem('Muc 3: anh B cung ten + cung so byte voi anh A (chi A co lop sua): mo B KHONG nap nen cua A', L.doc(dB) === null, L.doc(dB) ? 'nap nham: sach[0]=' + L.doc(dB).sach[0] : '')
      L.ghi(dB, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: Buffer.alloc(100, 2) })
      const a = L.doc(dA), b = L.doc(dB)
      kiem('Muc 3: luu ca hai anh: moi anh doc lai dung nen cua MINH (A=1, B=2), khong ghi de nhau', !!a && !!b && a.sach[0] === 1 && b.sach[0] === 2, (a ? a.sach[0] : 'x') + ',' + (b ? b.sach[0] : 'x'))
      const d1 = path.join(goc, 'anh', 'A', 'a b.png'), d2 = path.join(goc, 'anh', 'A', 'a_b.png')
      fs.writeFileSync(d1, Buffer.alloc(300, 1)); fs.writeFileSync(d2, Buffer.alloc(300, 1))
      L.ghi(d1, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: Buffer.alloc(50, 5) })
      kiem('Muc 3: "a b.png" va "a_b.png" cung thu muc (ten chi khac dau cach / gach duoi) khong dung chung lop sua', L.doc(d2) === null && !!L.doc(d1))
      // file .json mang lop sua cua DUONG DAN KHAC (bi chep / doi ten tay): phai bi tu choi
      const jB = chiMot(L, dB)[0]
      const bangB = JSON.parse(fs.readFileSync(path.join(L.dir, jB), 'utf8')); bangB.duong = path.resolve(dA)
      fs.writeFileSync(path.join(L.dir, jB), JSON.stringify(bangB))
      kiem('Muc 3: .json ghi duong dan cua anh khac: doc tra null (doi chieu bang.duong)', L.doc(dB) === null)
    })
    thu('Muc 3 (chuyen khi doi ten)', () => {
      const { taoLopSua } = require(path.join(SRC, 'lop-sua.js'))
      const L = taoLopSua(path.join(goc, 'ud3b'), () => {})
      const cu = path.join(goc, 'anh', 'A', 'shotandsave-cu.png'), moi = path.join(goc, 'anh', 'A', 'shotandsave-moi-ten.png')
      fs.writeFileSync(cu, Buffer.alloc(400, 3))
      L.ghi(cu, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: Buffer.alloc(70, 4) })
      fs.renameSync(cu, moi)
      const okChuyen = L.chuyen(cu, moi)
      const d = L.doc(moi)
      kiem('Muc 3: anh doi ten -> chuyen(cu, moi): lop sua mo duoc bang ten moi, giu net + nen', okChuyen === true && !!d && d.sach[0] === 4 && d.bang.shapes.length === 1)
      kiem('Muc 3: sau chuyen khong con file lop sua mang ten cu (2 file con lai = .json + .sach.png cua ten moi)', fs.readdirSync(L.dir).length === 2 && chiMot(L, cu).length === 0)
    })

    // ── Muc 6: anh bi xoa ngoai app ──
    thu('Muc 6 (don mo coi)', () => {
      const { taoLopSua } = require(path.join(SRC, 'lop-sua.js'))
      const ud = path.join(goc, 'ud6')
      const L = taoLopSua(ud, () => {})
      const f1 = path.join(goc, 'anh', 'A', 'xoa.png'), f2 = path.join(goc, 'anh', 'A', 'con.png')
      const roi = path.join(goc, 'anh', 'O-roi'); fs.mkdirSync(roi, { recursive: true }); const f3 = path.join(roi, 'o.png')
      for (const f of [f1, f2, f3]) { fs.writeFileSync(f, Buffer.alloc(200, 1)); L.ghi(f, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: Buffer.alloc(40, 7) }) }
      fs.unlinkSync(f1) // nguoi dung xoa bang Explorer / Finder, app van chay
      const n = L.donMoCoi()
      const conSach = fs.readdirSync(L.dir).filter((x) => x.startsWith('xoa.png') && x.endsWith('.sach.png'))
      kiem('Muc 6: anh bi xoa ngoai app: kiem dinh ky go luon ban sach CHUA CHE (khong cho toi lan khoi dong sau)', n === 1 && conSach.length === 0 && chiMot(L, f1).length === 0, 'go ' + n + ', con ' + conSach.join())
      kiem('Giu nguyen: anh con thi lop sua con', !!L.doc(f2))
      fs.rmSync(roi, { recursive: true, force: true }) // ca thu muc bien mat (o dia roi / thu muc offline): KHONG coi la anh da xoa
      L.donMoCoi()
      kiem('Giu nguyen: thu muc chua anh khong con (o dia roi): KHONG go lop sua', chiMot(L, f3).length === 1)
      // khoi dong lai (doi tuong moi, chua co chi muc trong bo nho): van go duoc
      const f4 = path.join(goc, 'anh', 'A', 'sau-khoi-dong.png'); fs.writeFileSync(f4, Buffer.alloc(200, 1)); L.ghi(f4, { shapes: net, dpr: 1, dipW: 5, dipH: 5, sach: Buffer.alloc(40, 7) })
      fs.unlinkSync(f4)
      const L2 = taoLopSua(ud, () => {})
      kiem('Muc 6: sau khi khoi dong lai app (doi tuong moi), anh bi xoa van duoc go', L2.donMoCoi() >= 1 && chiMot(L2, f4).length === 0)
    })

    // ── Muc 4: ghiDeAnh khi khong sao luu duoc anh goc ──
    thu('Muc 4 (ghiDeAnh)', () => {
      const ud = path.join(goc, 'ud4'); fs.mkdirSync(ud, { recursive: true })
      const tai = Module._load
      Module._load = function (req, ...r) { if (req === 'electron') return { app: { getPath: () => ud, isPackaged: false, getVersion: () => '0' } }; return tai.call(this, req, ...r) }
      let kho
      try { kho = require(path.join(SRC, 'kho.js')) } finally { Module._load = tai }
      const ren = fs.renameSync, cop = fs.copyFileSync
      const pid = process.pid
      const sauDoiTen = { dem: 0 }
      const chay = (ten, cheDo) => {
        const f = path.join(goc, 'anh', 'A', 'ghi-de-' + ten + '.png')
        if (cheDo !== 'mat-goc') fs.writeFileSync(f, Buffer.from('ANH-GOC-CUA-ANH-TIEN'))
        sauDoiTen.dem = 0
        fs.renameSync = function (a, b) { if (String(b) === f) { const e = new Error('EPERM: file dang bi app khac mo'); e.code = 'EPERM'; throw e } return ren.apply(fs, arguments) }
        fs.copyFileSync = function (a, b) {
          if (String(b) === f) sauDoiTen.dem++
          if (cheDo === 'het-dia' && String(b) === f + '.truoc-' + pid) { const e = new Error('ENOSPC: het dung luong'); e.code = 'ENOSPC'; throw e }
          return cop.apply(fs, arguments)
        }
        let r
        try { r = kho.ghiDeAnh(f, Buffer.from('BAN-SUA-MOI-DA-CHE')) } finally { fs.renameSync = ren; fs.copyFileSync = cop }
        let noiDung = null
        try { noiDung = fs.readFileSync(f, 'utf8') } catch (e) {}
        return { r, noiDung, f, soChepDe: sauDoiTen.dem }
      }
      const a = chay('het-dia', 'het-dia')
      kiem('Muc 4: doi ten bi tu choi (file dang mo) + KHONG sao luu duoc anh goc (het dung luong): KHONG chep de len anh goc', a.r.ok === false && a.soChepDe === 0 && a.noiDung === 'ANH-GOC-CUA-ANH-TIEN', 'ok=' + a.r.ok + ' chepDe=' + a.soChepDe + ' noiDung=' + a.noiDung)
      kiem('Muc 4: khong chep de thi ban sua hoan chinh duoc GIU (giuTam) de nguoi dung lay lai', !!a.r.giuTam && fs.existsSync(a.r.giuTam) && fs.readFileSync(a.r.giuTam, 'utf8') === 'BAN-SUA-MOI-DA-CHE', JSON.stringify(a.r))
      const b = chay('binh-thuong', 'binh-thuong')
      kiem('Giu nguyen: doi ten bi tu choi nhung sao luu duoc: van ghi thang, anh moi vao file, khong de rac', b.r.ok === true && b.r.cach === 'ghi-thang' && b.noiDung === 'BAN-SUA-MOI-DA-CHE' && !fs.existsSync(b.f + '.truoc-' + pid), JSON.stringify(b.r))
      const c = chay('mat-goc', 'mat-goc')
      kiem('Giu nguyen: file goc khong con (ENOENT): khong co gi de giu, van ghi duoc ban sua', c.r.ok === true && c.noiDung === 'BAN-SUA-MOI-DA-CHE', JSON.stringify(c.r))
    })

    // ── Muc 8: link ghim nhan WebP ──
    thu('Muc 8 (link ghim WebP)', () => {
      const { taoLienKet } = require(path.join(SRC, 'lien-ket.js'))
      const thuMuc = path.join(goc, 'anh', 'lk'); fs.mkdirSync(thuMuc, { recursive: true })
      const w = path.join(thuMuc, 'anh-app-luu.webp'), j = path.join(thuMuc, 'anh.jpg')
      fs.writeFileSync(w, Buffer.alloc(300, 1)); fs.writeFileSync(j, Buffer.alloc(300, 1))
      const goi = []
      let t = 1000
      const lk = taoLienKet({ thuMucAnh: () => thuMuc, lamViec: { chup() {}, chupLaiVung() {}, canvas() {}, khay() {}, tim() {}, ghim: (d) => goi.push(d) }, now: () => (t += 5000) })
      const r1 = lk.xuLy('aioshot://ghim?file=anh-app-luu.webp')
      kiem('Muc 8: aioshot://ghim?file=...webp (WebP do chinh app luu) duoc nhan va dua cho cua so ghim', r1.ok === true && goi.length === 1 && path.basename(goi[0]) === 'anh-app-luu.webp', JSON.stringify(r1))
      const r2 = lk.xuLy('aioshot://ghim?file=anh.jpg')
      kiem('Giu nguyen: .jpg van nhan', r2.ok === true && goi.length === 2)
      fs.writeFileSync(path.join(thuMuc, 'x.txt'), 'abc')
      const r3 = lk.xuLy('aioshot://ghim?file=x.txt')
      kiem('Giu nguyen: file khong phai anh van bi tu choi', r3.ok === false && r3.loi === 'khong-phai-anh', JSON.stringify(r3))
    })

    // ── Muc 7: kiem nen renderer gui len (helper o luat-main.js) ──
    thu('Muc 7 (pngTuDataUrl)', () => {
      const LM = require(path.join(SRC, 'luat-main.js'))
      const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)])
      const ok = LM.pngTuDataUrl('data:image/png;base64,' + png.toString('base64'))
      kiem('Muc 7: dataURL PNG hop le doc duoc', Buffer.isBuffer(ok) && ok.length === png.length)
      kiem('Muc 7: JPEG / rac / khong phai chuoi / PNG gia (khong dung dau PNG) bi tu choi', LM.pngTuDataUrl('data:image/jpeg;base64,AAAA') === null && LM.pngTuDataUrl('rac') === null && LM.pngTuDataUrl(null) === null && LM.pngTuDataUrl('data:image/png;base64,' + Buffer.alloc(60, 1).toString('base64')) === null)
    })
    // main.js: dung ham tren, tu choi khi nen gui len khong doc duoc, timer don mo coi (chi kiem co mat trong ma)
    const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8').replace(/\r\n/g, '\n')
    kiem('Muc 7: main.js pin:ocr-tu dung nen renderer gui, khong doc duoc thi tu choi (co mat trong ma)', /pin:ocr-tu', async \(e, nenDataUrl\)[\s\S]{0,900}pngTuDataUrl[\s\S]{0,400}return \{ ok: false/.test(main))
    kiem('Muc 6: main.js co timer lopSua.donMoCoi() (co mat trong ma)', /setInterval\(\(\) => \{ try \{ lopSua\.donMoCoi\(\)/.test(main))
    kiem('Muc 8: main.js ghimFileTuLink doc anh bang kho.docAnhFile (WebP) (co mat trong ma)', /async function ghimFileTuLink\(duong\) \{\n\s*const img = await kho\.docAnhFile\(duong\)/.test(main))
    return kq
  }

  function chayElectron(src, ten) {
    const r = spawnSync(electron, [__filename, RA, src, ten], { env, encoding: 'utf8', timeout: 240000 })
    const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
    if (dong) return JSON.parse(dong.slice(3))
    return { kq: [{ ten: 'Chay duoc Electron (' + ten + ')', ok: false, ct: 'ma ' + r.status + ' tin hieu ' + r.signal + ' loi ' + (r.error && r.error.message) + ' ' + ((r.stdout || '') + (r.stderr || '')).slice(0, 300) }], loiTrang: [] }
  }

  ;(async () => {
    const SRC = path.join(ROOT, 'src')
    const chayMoi = () => { let k = chayElectron(SRC, 'moi'); if (k.kq.some((c) => !c.ok)) k = chayElectron(SRC, 'moi2'); return k } // may ban: thu lai MOT lan
    const moi = (await kiemNode(SRC, 'moi')).concat(chayMoi().kq)
    console.log('== Ban hien tai ==')
    let dat = 0
    for (const c of moi) { if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }

    // Doi chung: ma truoc khi sua
    const cu = path.join(RA, 'ban-cu')
    fs.mkdirSync(cu, { recursive: true })
    const tar = path.join(RA, 'ban-cu.tar')
    const g = spawnSync('git', ['archive', '--format=tar', '-o', tar, BAN_CU, 'src'], { cwd: ROOT, encoding: 'utf8' })
    if (g.status !== 0) { console.log('  TRUOT khong lay duoc ban cu: ' + g.stderr); process.exit(1) }
    spawnSync('tar', ['-xf', 'ban-cu.tar', '-C', 'ban-cu'], { cwd: RA })
    const kqCu = (await kiemNode(path.join(cu, 'src'), 'cu')).concat(chayElectron(path.join(cu, 'src'), 'cu').kq)
    console.log('\n== DOI CHUNG: ma truoc khi sua (' + BAN_CU + ') phai truot dung tung muc ==')
    const canTruot = moi.map((c) => c.ten).filter((t) => !/^(Giu nguyen|Chay duoc|.*\(co mat trong ma\))/.test(t))
    let dc = 0
    for (const t of canTruot) {
      const c = kqCu.find((x) => x.ten === t)
      const ok = !c || !c.ok // khong co ket qua o ban cu (ham chua ton tai, nem loi) cung tinh la truot
      if (ok) dc++
      console.log((ok ? '  DAT   ban cu truot: ' : '  TRUOT ban cu KHONG truot: ') + t + (c && c.ct ? ' (' + c.ct + ')' : ''))
    }
    const tong = moi.length + canTruot.length
    console.log('\nTONG: ' + (dat + dc) + '/' + tong + ' DAT')
    process.exit(dat + dc === tong ? 0 : 1)
  })()
  return
}

/* ───────────── PHAN ELECTRON ───────────── */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const RA = path.resolve(process.argv[2])
const SRC = path.resolve(process.argv[3])
const NHAN = process.argv[4] || 'x'
const GOC = path.join(RA, 'e-' + NHAN)
fs.mkdirSync(path.join(GOC, 'anh'), { recursive: true })
app.setPath('userData', path.join(GOC, 'userData'))
app.commandLine.appendSwitch('force-device-scale-factor', '1')
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.error(e) } catch (_) {} app.exit(1) })
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 220 giay'), 220000)

const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
const loiTrang = []
const js = (w, s) => w.webContents.executeJavaScript(s, true)
const saves = []      // pin:save-edit: { dataUrl, chep, id }
let copies = 0        // pin:copy
const ocrArgs = []    // pin:ocr-tu: doi so renderer gui
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('pin:log', () => {})
ipcMain.on('pin:doi-co', () => {})
ipcMain.on('ve:dat-tay', () => {})
ipcMain.on('pin:copy', () => { copies++ })
ipcMain.on('pin:save-edit', (e, dataUrl, chep) => { saves.push({ dataUrl, chep, id: e.sender.id }) })
ipcMain.handle('pin:lop-doc', () => null)
ipcMain.handle('pin:lop-xoa', () => false)
ipcMain.handle('pin:ocr-tu', (e, nen) => { ocrArgs.push(nen); return { ok: false, loi: 'thu' } })

function taoAnhPng(file, w, h, mau) {
  const bmp = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = mau(x, y), i = (y * w + x) * 4; bmp[i] = c[2]; bmp[i + 1] = c[1]; bmp[i + 2] = c[0]; bmp[i + 3] = 255 }
  fs.writeFileSync(file, nativeImage.createFromBitmap(bmp, { width: w, height: h }).toPNG())
}
const XAM = [64, 64, 64]
const nenKe = (x, y) => (y < 150 ? [200, 40, 40] : y < 300 ? [40, 170, 60] : y < 450 ? [40, 80, 200] : [210, 200, 40])
const nenTrang = (x, y) => (x >= 450 && x < 550 && y >= 300 && y < 400 ? [255, 255, 255] : XAM) // khoi trang (nguoi dung se che)
const nenDaChe = (x, y) => (x >= 450 && x < 550 && y >= 300 && y < 400 ? [0, 0, 0] : XAM)       // cung anh, khoi do da bi che den
function docAnh(dataUrl) {
  const im = nativeImage.createFromDataURL(dataUrl), kt = im.getSize(), bmp = im.toBitmap()
  return { rong: kt.width, cao: kt.height, diem: (x, y) => { x = Math.max(0, Math.min(kt.width - 1, Math.floor(x))); y = Math.max(0, Math.min(kt.height - 1, Math.floor(y))); const i = (y * kt.width + x) * 4; return [bmp[i + 2], bmp[i + 1], bmp[i], bmp[i + 3]] } }
}
const laDen = (p) => p[0] < 25 && p[1] < 25 && p[2] < 25 && p[3] > 200
const laTrang = (p) => p[0] > 235 && p[1] > 235 && p[2] > 235

const TRO_GIUP = `window.__s = { ds: () => JSON.stringify(shapes), vt: () => { const r = veEl.getBoundingClientRect(); return { l: r.left, t: r.top } },
  dai: () => ({ lichSu: SuaNet.lichSu.length, dip: { w: dip.w, h: dip.h }, nw: img.naturalWidth, nh: img.naturalHeight, mode, ok: img.complete, nenDoi }) }
true`

async function moPin(file, dipW, dipH) {
  const win = new BrowserWindow({ x: 0, y: 0, width: dipW + 24, height: dipH + 24, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: 1 }, preload: path.join(SRC, 'preload-pin.js'), contextIsolation: true, sandbox: false } })
  win.webContents.on('console-message', (e, level, msg) => { if ((typeof level === 'number' ? level >= 3 : e.level === 'error') && !/Inter.woff2.*Content Security Policy/.test(msg || e.message || '')) loiTrang.push(msg || e.message) })
  await win.loadFile(path.join(SRC, 'pin', 'index.html'))
  const dataUrl = nativeImage.createFromPath(file).toDataURL()
  win.webContents.send('pin:data', { dataUrl, pad: 12, w: dipW, h: dipH, lamMoKieu: 'mosaic', veTay: false, luuLopSua: true })
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
  const phim = async (keyCode, mods) => { wc.focus(); wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mods || [] }); await cho(15); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mods || [] }); await cho(40) }
  const choNap = async (nh) => { for (let i = 0; i < 80; i++) { const d = await o('__s.dai()'); if (d.ok && (!nh || d.nh === nh)) return d; await cho(50) } return o('__s.dai()') }
  const ctrl = process.platform === 'darwin' ? 'meta' : 'control'
  return { win, wc, o, capVt, keo, phim, choNap, ctrl, dong: () => win.destroy() }
}

async function chonDoiSauCat(p) { // vao ve, chon cong cu cat, keo dai ngang 100..200 DIP (= 150..300 px): anh 900x600 -> 900x450
  await p.phim('1'); await cho(150); await p.capVt()
  await p.phim('x'); await cho(60)
  await p.keo([10, 100], [10, 200])
  return p.choNap(450)
}

app.whenReady().then(async () => {
  try {
    // ── Muc 1: Ctrl+C sau khi cat (khong them net nao) ──
    {
      const f = path.join(GOC, 'anh', 'm1.png'); taoAnhPng(f, 900, 600, nenKe)
      const p = await moPin(f, 600, 400)
      const d = await chonDoiSauCat(p)
      kiem('Giu nguyen (chuan bi) Muc 1: da cat 900x450, chua co net nao', d.nh === 450 && (await p.o('shapes.length')) === 0 && d.nenDoi === true, JSON.stringify(d))
      const c0 = copies, s0 = saves.length
      await p.phim('C', [p.ctrl])
      for (let i = 0; i < 40 && saves.length === s0; i++) await cho(50)
      const luu = saves.length > s0 ? saves[saves.length - 1] : null
      kiem('Muc 1: Ctrl+C sau khi cat bo (khong them net): chep ANH DA CAT (gui lenh luu kem chep), khong chep anh goc cu', !!luu && luu.chep === true && copies === c0, 'luu=' + !!luu + ' chep=' + (luu && luu.chep) + ' copy goc=' + (copies - c0))
      kiem('Muc 1: anh gui di cao 450 (da cat), khong phai 600', !!luu && docAnh(luu.dataUrl).cao === 450, luu ? docAnh(luu.dataUrl).cao : 'khong luu')
      p.dong()
      const f2 = path.join(GOC, 'anh', 'm1b.png'); taoAnhPng(f2, 900, 600, nenKe)
      const p2 = await moPin(f2, 600, 400)
      const c1 = copies, s1 = saves.length
      await p2.phim('C', [p2.ctrl]); await cho(150)
      kiem('Giu nguyen: o che do xem (khong ve) Ctrl+C chep anh ghim nhu cu, khong luu', copies === c1 + 1 && saves.length === s1, 'copy ' + (copies - c1) + ', luu ' + (saves.length - s1))
      await p2.phim('1'); await cho(120)
      const c2 = copies, s2 = saves.length
      await p2.phim('C', [p2.ctrl]); await cho(150)
      kiem('Giu nguyen: vao ve nhung chua thay doi gi: Ctrl+C van chep anh ghim hien co, khong luu', copies === c2 + 1 && saves.length === s2, 'copy ' + (copies - c2) + ', luu ' + (saves.length - s2))
      p2.dong()
    }

    // ── Muc 2: ghim kia luu (da che) trong luc ghim nay dang cat ──
    {
      const f = path.join(GOC, 'anh', 'm2.png'); taoAnhPng(f, 900, 600, nenTrang)
      const fm = path.join(GOC, 'anh', 'm2-che.png'); taoAnhPng(fm, 900, 600, nenDaChe)
      const daChe = nativeImage.createFromPath(fm).toDataURL()
      const p = await moPin(f, 600, 400)
      const d = await chonDoiSauCat(p)
      kiem('Giu nguyen (chuan bi) Muc 2: ghim B dang cat, co lich su Hoan tac', d.nh === 450 && d.lichSu >= 1, JSON.stringify(d))
      // main gui anh moi cho ghim anh em (ghim A da che roi luu)
      p.win.webContents.send('pin:data', { dataUrl: daChe, pad: 12, w: 600, h: 400, lamMoKieu: 'mosaic', veTay: false, luuLopSua: true })
      await cho(350)
      const st = await p.o('({ mode, lichSu: SuaNet.lichSu.length, dung: document.getElementById("img").src === ' + JSON.stringify(daChe) + ' })')
      kiem('Muc 2: nhan anh moi tu ghim cung file luc dang cat: bo phien cat chua luu (che do xem, lich su Hoan tac trong, hien anh moi)', st.mode === 'view' && st.lichSu === 0 && st.dung, JSON.stringify(st))
      await p.phim('Z', [p.ctrl]); await cho(200)
      const sau = await p.o('document.getElementById("img").src === ' + JSON.stringify(daChe))
      kiem('Muc 2: Ctrl+Z sau do KHONG phuc hoi nen chua che (van la anh da che)', sau === true)
      await p.phim('1'); await cho(150); await p.capVt()
      await p.keo([30, 30], [120, 90])
      const s0 = saves.length
      await p.phim('Return')
      for (let i = 0; i < 40 && saves.length === s0; i++) await cho(50)
      const luu = saves.length > s0 ? saves[saves.length - 1] : null
      const A = luu ? docAnh(luu.dataUrl) : null
      kiem('Muc 2: ve them net roi luu: anh ghi ra GIU net che cua ghim kia (khoi den), khong ghi de bang nen chua che', !!A && A.rong === 900 && A.cao === 600 && laDen(A.diem(500, 350)) && !laTrang(A.diem(500, 350)), A ? JSON.stringify(A.diem(500, 350)) : 'khong luu')
      p.dong()
    }

    // ── Muc 7: Che thong minh sau khi cat doc dung nen dang hien ──
    {
      const f = path.join(GOC, 'anh', 'm7.png'); taoAnhPng(f, 900, 600, nenKe)
      const p = await moPin(f, 600, 400)
      const d = await chonDoiSauCat(p)
      const n0 = ocrArgs.length
      await p.phim('C'); for (let i = 0; i < 40 && ocrArgs.length === n0; i++) await cho(50)
      const arg = ocrArgs[n0]
      const cao = typeof arg === 'string' && arg.startsWith('data:image/png') ? docAnh(arg).cao : -1
      kiem('Muc 7: da cat roi bat Che thong minh: renderer gui NEN DANG HIEN (PNG cao 450) cho main doc chu, khong de main doc anh cu', d.nh === 450 && cao === 450, 'arg=' + (typeof arg === 'string' ? arg.slice(0, 22) + ' cao ' + cao : String(arg)))
      p.dong()
      const f2 = path.join(GOC, 'anh', 'm7b.png'); taoAnhPng(f2, 900, 600, nenKe)
      const p2 = await moPin(f2, 600, 400)
      const n1 = ocrArgs.length
      await p2.phim('C'); for (let i = 0; i < 40 && ocrArgs.length === n1; i++) await cho(50)
      kiem('Giu nguyen: chua cat gi: gui null (main doc anh ghim nhu cu, khong chuyen anh qua IPC)', ocrArgs.length > n1 && ocrArgs[n1] === null, String(ocrArgs[n1]).slice(0, 30))
      p2.dong()
    }
    kiem('Giu nguyen: khong co loi console trong trang', loiTrang.length === 0, loiTrang.slice(0, 2).join(' | '))
  } catch (e) {
    kiem('Chay kich ban khong nem loi', false, e && e.stack)
  }
  console.log('KQ=' + JSON.stringify({ kq, loiTrang }))
  app.exit(0)
})
