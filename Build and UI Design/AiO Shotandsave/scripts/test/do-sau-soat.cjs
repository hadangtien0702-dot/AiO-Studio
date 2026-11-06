'use strict'
/* =========================================================================
   Do cac loi Codex bat duoc khi soat doc lap ban gop 10 muc (05/11/2026) — chay bang: npm run test:sausoat
   CHAY AN: cua so offscreen (show:false) nap THAT src/overlay/index.html + src/pin/index.html, chuot / phim la sendInputEvent.
   Khong dung thu muc anh that, khong bat cua so len man nguoi dung.
   DOI CHUNG: cung bai nay chay tren ma TRUOC KHI SUA (commit 0bc625b, lay bang git archive) PHAI truot dung tung ma loi.
   Duong trong main.js (A2 luot cu, A4 khay nap lai, A6 tieu diem, A7 cua so Mac) chua dung lai duoc o day: chi kiem ma co mat.
   ========================================================================= */
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const BAN_CU = '0bc625b'

/* ───────────── PHAN NODE ───────────── */
if (!process.versions.electron) {
  const { spawnSync } = require('child_process')
  const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? 'Electron.app/Contents/MacOS/Electron' : 'electron')
  const env = Object.assign({}, process.env)
  delete env.ELECTRON_RUN_AS_NODE
  const RA = path.join(ROOT, '.selftest', 'sau-soat')
  fs.mkdirSync(RA, { recursive: true })

  async function kiemNode(SRC) {
    const kq = []
    const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })
    const doc = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n')

    // B3 so dinh lien nhau
    const CT = require(path.join(SRC, 'che-thong-minh.js'))
    const ra = (s) => CT.quetChuoi(s).map((q) => q.loai + ':' + s.slice(q.s, q.e)).join(' | ')
    kiem('B3 hai so dien thoai canh nhau: che ca hai', ra('0912345678 0987654321') === 'dienthoai:0912345678 | dienthoai:0987654321', ra('0912345678 0987654321'))
    kiem('B3 hai so viet tach cum: che ca hai', ra('0912 345 678 0987 654 321') === 'dienthoai:0912 345 678 | dienthoai:0987 654 321', ra('0912 345 678 0987 654 321'))
    kiem('Giu nguyen: the + dien thoai tren mot dong van che ca hai', ra('4111 1111 1111 1111 0912345678') === 'the:4111 1111 1111 1111 | dienthoai:0912345678', ra('4111 1111 1111 1111 0912345678'))
    kiem('Giu nguyen: 84 khong dau + van nhan la dau so', ra('84 912 345 678 0912345678') === 'dienthoai:84 912 345 678 | dienthoai:0912345678', ra('84 912 345 678 0912345678'))
    kiem('Giu nguyen: hang so thu tu "01 02 03 04 05 06 07" khong bi che nham', ra('01 02 03 04 05 06 07') === '', ra('01 02 03 04 05 06 07'))
    kiem('Giu nguyen: ma don 8 so khong bi che, ngay khong bi che', ra('don 12345678 90123456') === '' && ra('05/11/2026') === '', ra('don 12345678 90123456'))

    // C3 file doi luc dang doc
    const dir = path.join(RA, 'tim-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)), anh = path.join(dir, 'anh'), ud = path.join(dir, 'ud')
    fs.mkdirSync(anh, { recursive: true }); fs.mkdirSync(ud, { recursive: true })
    const f = path.join(anh, 'a.png')
    fs.writeFileSync(f, 'ban cu')
    const qua = (n) => new Date(Date.now() - n * 60000)
    fs.utimesSync(f, qua(50), qua(50))
    const { taoChiMuc } = require(path.join(SRC, 'tim-anh.js'))
    let lan = 0, cm = null
    cm = taoChiMuc({ thuMucDuLieu: ud, layThuMucAnh: () => anh, nghiHeSo: 0, nghiToiThieuMs: 0, docAnh: async () => {
      lan++
      if (lan === 1) { fs.writeFileSync(f, 'ban moi da che'); fs.utimesSync(f, qua(40), qua(40)); cm.quet(); return { ok: true, chu: 'chucu' } }
      return { ok: true, chu: 'chumoi' }
    } })
    cm.quet(); cm.vong()
    for (let i = 0; i < 40 && (cm.trangThai().choDoc > 0 || lan === 0); i++) await new Promise((r) => setTimeout(r, 50))
    kiem('C3 anh sua luc dang doc chu: chi muc giu chu ban MOI, khong giu chu ban cu', cm.tim({ chu: 'chumoi' }).tong === 1 && cm.tim({ chu: 'chucu' }).tong === 0, 'doc ' + lan + ' lan, chu moi ' + cm.tim({ chu: 'chumoi' }).tong + ', chu cu ' + cm.tim({ chu: 'chucu' }).tong)
    cm.dungHet()

    // Ban quyen: may sap nguon lam file thanh toan so 0 (do that tren may nha 06/11: 325 byte so 0, khach mat ma)
    const { taoKhoFile } = require(path.join(SRC, 'banquyen.js'))
    const fq = path.join(dir, 'ban-quyen.json')
    let soFsync = 0
    const fsDem = Object.assign({}, fs, { fsyncSync: (fd) => { soFsync++; return fs.fsyncSync(fd) } })
    const kq1 = taoKhoFile(fq, { fs: fsDem, path })
    kq1.ghi({ key: 'AIOSS-THU', activationId: 'a1', batDauThu: 5 })
    kiem('Ban quyen: ghi file co ep xuong dia (fsync) truoc khi doi ten', soFsync >= 1, soFsync + ' lan')
    fs.writeFileSync(fq, Buffer.alloc(325))
    let lai = null
    try { lai = taoKhoFile(fq, { path }).doc() } catch (e) { lai = 'nem loi ' + e.message }
    kiem('Ban quyen: file thanh toan so 0 sau sap nguon: lay lai duoc ma tu ban du phong', lai && lai.key === 'AIOSS-THU', JSON.stringify(lai))
    kiem('Ban quyen: lay lai xong file chinh doc duoc binh thuong', (() => { try { return JSON.parse(fs.readFileSync(fq, 'utf8')).key === 'AIOSS-THU' } catch (e) { return false } })())

    // A5 phim trung
    const main = doc('main.js')
    const m = /function chuanPhim[\s\S]*?\n}\n/.exec(main)
    let chuan = () => { throw new Error('khong co') }
    if (m) chuan = new Function(m[0] + '; return chuanPhim')()
    let ok5 = false, ct5 = 'khong co ham chuanPhim'
    if (m) {
      const laMac = process.platform === 'darwin'
      ok5 = (laMac || chuan('Ctrl+Alt+Shift+C') === chuan('CommandOrControl+Alt+Shift+C')) && chuan('CommandOrControl+Shift+Alt+S') === chuan('CmdOrCtrl+Alt+Shift+S') && chuan('Ctrl+Shift+S') !== chuan('Ctrl+Alt+S')
      ct5 = chuan('Ctrl+Alt+Shift+C') + ' / ' + chuan('CommandOrControl+Alt+Shift+C')
    }
    kiem('A5 phim chup trung phim Canvas viet khac chu: nhan ra la mot to hop', ok5, ct5)
    kiem('A5 doi phim chup: quen ten phim Canvas da go (khong go nham phim chup vua dang ky)', /globalShortcut\.unregisterAll\(\)\n\s*phimCanvasDangKy = ''/.test(main))
    // Co mat trong ma (chua dung lai duoc o day)
    kiem('A2 khung cua luot cu bi bo o ca 4 cho (co mat trong ma)', (main.match(/if \(!?cu\(\)\)/g) || []).length === 4)
    kiem('A4 khay gui lai danh sach moi lan nap trang (co mat trong ma)', /shelfWin\.webContents\.on\('did-finish-load'/.test(main))
    kiem('A6 overlay hien sau khong cuop phim cua man co vung (co mat trong ma)', /winGiuFocus && !winGiuFocus\.isDestroyed\(\) \? winGiuFocus : win/.test(main))
    kiem('Mac: khong xin micro khi Info.plist chua khai bao (co mat trong ma)', /coKhaiBaoMic\(\)/.test(doc('luong-chup.js')))
    // B4 + C5 + C6
    kiem('B4 run-log khong ghi chu nguoi dung vua che', !/opt\.log\([^\n]*m\.text/.test(doc('che-tm-ui.js')))
    const { DICH } = require(path.join(SRC, 'i18n.js'))
    let dai = 0
    for (const l of Object.keys(DICH)) for (const v of Object.values(DICH[l])) if (String(v).includes('—')) dai++
    kiem('C6 chu nguoi dung thay: 0 gach ngang dai', dai === 0, dai + ' chuoi')
    kiem('C5 tu choi micro: khong noi "chi co tieng may" (Mac khong thu tieng may)', !/chỉ có tiếng máy/.test(DICH.vi['quay.micQuyen']) && !/only has system sound/.test(DICH.en['quay.micQuyen']))
    kiem('A3 chu bao thieu man co du 2 ngon ngu', !!DICH.vi['app.thieuMan'] && !!DICH.en['app.thieuMan'])
    return kq
  }

  function chayElectron(src, ten) {
    const r = spawnSync(electron, [__filename, RA, src, ten], { env, encoding: 'utf8', timeout: 180000 })
    const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
    if (dong) return JSON.parse(dong.slice(3))
    return { kq: [{ ten: 'Chay duoc Electron', ok: false, ct: ((r.stdout || '') + (r.stderr || '')).slice(0, 300) }], loiTrang: [] }
  }

  ;(async () => {
    const SRC = path.join(ROOT, 'src')
    const moi = (await kiemNode(SRC)).concat(chayElectron(SRC, 'moi').kq)
    console.log('== Ban hien tai ==')
    let dat = 0
    for (const c of moi) { if (c.ok) dat++; console.log((c.ok ? '  DAT   ' : '  TRUOT ') + c.ten + (c.ct ? ' (' + c.ct + ')' : '')) }

    // Doi chung: ma truoc khi sua
    const cu = path.join(RA, 'ban-cu')
    fs.rmSync(cu, { recursive: true, force: true }); fs.mkdirSync(cu, { recursive: true })
    const tar = path.join(RA, 'ban-cu.tar')
    const g = spawnSync('git', ['archive', '--format=tar', '-o', tar, BAN_CU, 'src'], { cwd: ROOT, encoding: 'utf8' })
    if (g.status !== 0) { console.log('  TRUOT khong lay duoc ban cu: ' + g.stderr); process.exit(1) }
    spawnSync('tar', ['-xf', 'ban-cu.tar', '-C', 'ban-cu'], { cwd: RA })
    const kqCu = (await kiemNode(path.join(cu, 'src'))).concat(chayElectron(path.join(cu, 'src'), 'cu').kq)
    console.log('\n== DOI CHUNG: ma truoc khi sua (' + BAN_CU + ') phai truot dung tung loi ==')
    const canTruot = moi.map((c) => c.ten).filter((t) => !/^(Giu nguyen|A3 chu bao|Chay duoc)/.test(t))
    let dc = 0
    for (const t of canTruot) {
      const c = kqCu.find((x) => x.ten === t)
      const ok = c && !c.ok
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
app.setPath('userData', path.join(RA, 'userData-' + (process.argv[4] || 'x')))
app.commandLine.appendSwitch('force-device-scale-factor', '1')
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.error(e) } catch (_) {} app.exit(1) })
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 150 giay'), 150000)

let xacNhan = null
const thuTu = []
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('overlay:confirm', (_e, p) => { xacNhan = p })
ipcMain.on('pin:save-edit', (_e, _d, chep) => { thuTu.push(chep ? 'luu-kem-chep' : 'luu') })
ipcMain.on('pin:copy', () => { thuTu.push('chep') })

const kq = []
const kiem = (ten, ok, ct = '') => kq.push({ ten, ok: !!ok, ct: String(ct) })

const moManChup = async () => {
  const w = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
    webPreferences: { offscreen: { deviceScaleFactor: 1 }, preload: path.join(SRC, 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
  await w.loadFile(path.join(SRC, 'overlay', 'index.html'))
  w.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
  w.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
  await cho(350)
  xacNhan = null
  return w
}
const dieuKhien = (w) => {
  const wc = w.webContents
  const m = async (loai, x, y) => { wc.sendInputEvent({ type: loai, x, y, button: 'left', clickCount: 1 }); await cho(22) }
  const keo = async (a, b, tha = true) => {
    await m('mouseMove', a[0], a[1]); await m('mouseDown', a[0], a[1])
    for (let i = 1; i <= 4; i++) await m('mouseMove', Math.round(a[0] + (b[0] - a[0]) * i / 4), Math.round(a[1] + (b[1] - a[1]) * i / 4))
    if (tha) await m('mouseUp', b[0], b[1])
  }
  const phim = async (keyCode, mods) => { wc.focus(); wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mods || [] }); await cho(15); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mods || [] }); await cho(30) }
  return { m, keo, phim, o: (s) => wc.executeJavaScript(s, true) }
}
const NEN_XAM = `(async () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 800; const x = c.getContext('2d'); x.fillStyle = 'rgb(40,90,200)'; x.fillRect(0, 0, 1200, 800)
  const im = new Image(); im.src = c.toDataURL(); await im.decode(); frozenImg = im; return true })()`

app.whenReady().then(async () => {
  try {
    { // A8 Enter
      const w = await moManChup(), d = dieuKhien(w)
      await d.phim('Return'); await cho(200)
      kiem('A8 Enter = Xong (nhu chu tren nut): gui vung di', xacNhan && xacNhan.rect, JSON.stringify(xacNhan))
      w.destroy()
    }
    { // A1 bam Xong truoc khi co anh nen
      let w = await moManChup(), d = dieuKhien(w)
      await d.phim('1'); await cho(120)
      await d.keo([200, 200], [320, 280])
      await d.o('document.getElementById("xong").click()')
      await cho(300)
      const som = xacNhan
      await cho(3300)
      kiem('A1 chua co anh nen: khong gui anh chi co net ve, cung khong cat thuong lam mat net (bo luot + bao)', !som && xacNhan && xacNhan.khongCoNen && !xacNhan.rect && !xacNhan.dataUrl, 'luc 0,3 s: ' + (som ? Object.keys(som) : 'cho') + '; cuoi: ' + (xacNhan ? Object.keys(xacNhan) : 'khong'))
      w.destroy()
      w = await moManChup(); d = dieuKhien(w)
      await d.phim('1'); await cho(120)
      await d.keo([200, 200], [320, 280])
      await d.o('document.getElementById("xong").click()')
      await cho(500)
      await d.o(NEN_XAM)
      for (let i = 0; i < 30 && !xacNhan; i++) await cho(50)
      let diem = null
      if (xacNhan && xacNhan.dataUrl) { const im = nativeImage.createFromDataURL(xacNhan.dataUrl), b = im.toBitmap(), kt = im.getSize(), i = (300 * kt.width + 500) * 4; diem = [b[i + 2], b[i + 1], b[i]] }
      kiem('A1 chon lai trong luc cho anh nen: khong tu luu khung cu', await (async () => {
        const w2 = await moManChup(), d2 = dieuKhien(w2)
        await d2.phim('1'); await cho(120); await d2.keo([200, 200], [320, 280])
        await d2.o('document.getElementById("xong").click(); chonLaiTuDau({ clientX: 10, clientY: 10, button: 0, preventDefault() {} }); true').catch(() => {})
        const giu = xacNhan; xacNhan = null
        await d2.o(NEN_XAM); await cho(500)
        const ok = !giu && !xacNhan; xacNhan = giu; w2.destroy(); return ok
      })())
      kiem('A1 chon lai khi anh goc dang nap: khong gui vung cu mat net Che', await (async () => {
        const w2 = await moManChup(), d2 = dieuKhien(w2)
        await d2.phim('1'); await cho(120); await d2.keo([200, 200], [320, 280])
        await d2.o(`layers = [{ x: 0, y: 0, px: 0, py: 0, pw: 1200, ph: 800, key: 'k' }]; true`)
        const giu = xacNhan; xacNhan = null
        await d2.o('document.getElementById("xong").click(); chonLaiTuDau({ clientX: 10, clientY: 10, button: 0, preventDefault() {} }); true').catch(() => {})
        await cho(600)
        const ok = !xacNhan; xacNhan = giu; w2.destroy(); return ok
      })())
      kiem('A1 anh nen ve trong luc cho: anh luu co DU nen + net ve', diem && diem[0] === 40 && diem[1] === 90 && diem[2] === 200, 'diem nen ' + diem)
      w.destroy()
    }
    { // A3 thieu man
      const w = await moManChup(), d = dieuKhien(w)
      await d.o(`(async () => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; c.getContext('2d').fillRect(0, 0, 300, 200); const im = new Image(); im.src = c.toDataURL(); await im.decode()
        layers = [{ img: im, x: 0, y: 0, px: 0, py: 0, pw: 300, ph: 200, key: null }]; layersReady = true; return true })()`)
      w.webContents.send('overlay:composite', { x: 100, y: 50, w: 400, h: 100, manGiao: 2 })
      await cho(3500)
      kiem('A3 vung vat 2 man ma thieu anh mot man: bao thieu, khong luu anh co khoang trong', xacNhan && xacNhan.thieuMan && xacNhan.rect, xacNhan ? Object.keys(xacNhan) : 'khong')
      xacNhan = null
      w.webContents.send('overlay:composite', { x: 10, y: 10, w: 100, h: 80, manGiao: 1 })
      await cho(400)
      kiem('Giu nguyen: du anh thi ghep binh thuong', xacNhan && xacNhan.dataUrl, xacNhan ? Object.keys(xacNhan) : 'khong')
      w.destroy()
    }
    { // B7 + B8
      const w = await moManChup(), d = dieuKhien(w)
      await d.phim('1'); await cho(120)
      await d.keo([200, 200], [320, 280])
      const goc = (await d.o('JSON.stringify(shapes[0])'))
      await d.phim('V')
      await d.m('mouseMove', 260, 240); await d.m('mouseDown', 260, 240); await d.m('mouseUp', 260, 240)
      await d.phim('Delete')
      await d.o(`isAdjusting = true; adjustType = 'move'; adjustStartMouse = { x: 0, y: 0 }; adjustStartRect = { ...curRect }; true`)
      await d.m('mouseMove', 50, 0)
      await d.o('isAdjusting = false; hoanTac(); true')
      const s = await d.o('shapes.length ? JSON.stringify(shapes[0]) : "null"')
      const a = JSON.parse(goc), b = JSON.parse(s)
      kiem('B7 xoa net, dich vung chup, Ctrl+Z: net quay lai dung cho tren anh', b && Math.abs(b.x1 - (a.x1 - 50)) < 1, 'x1 ' + a.x1 + ' -> ' + (b && b.x1))
      w.destroy()
    }
    {
      const w = await moManChup(), d = dieuKhien(w)
      await d.phim('1'); await cho(120)
      await d.keo([200, 200], [320, 280])
      await d.phim('V')
      await d.m('mouseMove', 260, 240); await d.m('mouseDown', 260, 240); await d.m('mouseUp', 260, 240)
      const t = await d.o(`SuaNet.tay(shapes[0]).find((x) => x.k === 'se')`)
      const vt = await d.o(`(() => { const r = veEl.getBoundingClientRect(); return { l: r.left, t: r.top } })()`)
      const p = [Math.round(vt.l + t.x), Math.round(vt.t + t.y)]
      await d.m('mouseMove', p[0], p[1]); await d.m('mouseDown', p[0], p[1]); await d.m('mouseMove', p[0] + 20, p[1] + 20)
      await d.phim('I')
      await d.m('mouseUp', p[0] + 20, p[1] + 20)
      await d.phim('V')
      const truoc = await d.o('JSON.stringify(shapes[0])')
      await d.m('mouseMove', p[0] + 120, p[1] + 90)
      const sau = await d.o('JSON.stringify(shapes[0])')
      kiem('B8 doi cong cu giua luc keo roi tha chuot: net khong chay theo chuot nua', truoc === sau, truoc === sau ? '' : 'net van doi')
      w.destroy()
    }
    { // B2 keo than khung Che, nhan phim doi cong cu truoc khi tha
      const w = await moManChup(), d = dieuKhien(w)
      await d.o(`themNet({ type: 'blur', blurType: 'kin', che: true, phu: ['a'], color: '#000', x1: 100, y1: 100, x2: 220, y2: 160 }); redraw(); true`)
      await d.phim('V')
      const vt = await d.o(`(() => { const r = veEl.getBoundingClientRect(); return { l: r.left, t: r.top } })()`)
      const p = [Math.round(vt.l + 160), Math.round(vt.t + 130)]
      await d.m('mouseMove', p[0], p[1]); await d.m('mouseDown', p[0], p[1]); await d.m('mouseUp', p[0], p[1])
      await d.m('mouseMove', p[0], p[1]); await d.m('mouseDown', p[0], p[1]); await d.m('mouseMove', p[0] + 150, p[1] + 90)
      await d.phim('1')
      await d.m('mouseUp', p[0] + 150, p[1] + 90)
      const r = await d.o('({ x1: shapes[0].x1, phu: shapes[0].phu.length, ls: SuaNet.lichSu.length })')
      kiem('B2 keo khung Che roi doi cong cu truoc khi tha: van ghi la da roi cho cu', r.x1 > 150 && r.phu === 0, JSON.stringify(r))
      w.destroy()
    }
    { // B5 + B2
      const w = await moManChup(), d = dieuKhien(w)
      const r = await d.o(`(() => {
        const mau = (phu, x) => ({ type: 'blur', blurType: 'kin', che: true, phu, nhom: 'n1', color: CheTM.MAU_KIN, x1: x, y1: 10, x2: x + 50, y2: 30 })
        themNhomChe([mau(['a'], 10), mau(['b'], 100)])
        const s = shapes[0]; shapes.splice(0, 1); SuaNet.ghi({ k: 'xoa', s, idx: 0 })
        hoanTac()
        const b5 = shapes.length
        hoanTac()
        const b5b = shapes.length
        SuaNet.lamLai()
        if (shapes.length < 2) return { b5, b5b, b5c: -1 }
        const a0 = shapes[0], a1 = shapes[1]
        shapes.splice(1, 1); SuaNet.ghi({ k: 'xoa', s: a1, idx: 1, nhom: 'bo1' })
        shapes.splice(0, 1); SuaNet.ghi({ k: 'xoa', s: a0, idx: 0, nhom: 'bo2' })
        hoanTac()
        const b5c = shapes.length
        hoanTac()
        if (!shapes[0]) return { b5, b5b, b5c }
        const s0 = shapes[0], t = SuaNet.sao(s0); s0.x1 += 300; s0.x2 += 300; SuaNet.ghiSua(s0, t)
        const b2 = CheTM.daChe(shapes, { phu: ['a'] })
        hoanTac()
        const b2b = CheTM.daChe(shapes, { phu: ['a'] })
        return { b5, b5b, b5c, b2, b2b }
      })()`)
      kiem('B5 xoa mot khung che roi Ctrl+Z: tra dung khung do, khong go ca nhom', r.b5 === 2 && r.b5b === 0, JSON.stringify(r))
      kiem('B5 bo che hai lan rieng: Ctrl+Z tra tung lan, khong tra ca hai', r.b5c === 1, JSON.stringify(r))
      kiem('B2 keo khung che ra cho khac: chu cu khong con tinh la da che; Ctrl+Z thi tinh lai', r.b2 === false && r.b2b === true, JSON.stringify(r))
      w.destroy()
    }
    { // C4
      const w = await moManChup()
      await w.webContents.executeJavaScript(fs.readFileSync(path.join(SRC, 'lamdep', 'render.js'), 'utf8'), true)
      const r = await w.webContents.executeJavaScript(`(() => {
        const nguon = document.createElement('canvas'); nguon.width = 200; nguon.height = 200
        const bc = LamDep.tinhBoCuc(200, 200, { nen: 'dac', mau: '#ff0000', le: 20, bo: 0, bong: 60 })
        const c = document.createElement('canvas'); c.width = bc.cw; c.height = bc.ch
        const x = c.getContext('2d'); LamDep.ve(x, nguon, bc)
        const d = (a, b) => Array.from(x.getImageData(a, b, 1, 1).data)
        return { giua: d(Math.round(bc.cw / 2), Math.round(bc.ch / 2)), bong: d(Math.round(bc.cw / 2), Math.round(bc.y + bc.ih + 3)) }
      })()`, true)
      kiem('C4 PNG trong suot + bong: duoi anh van la mau nen da chon', r.giua[0] === 255 && r.giua[1] === 0 && r.giua[3] === 255, 'giua ' + r.giua)
      kiem('Giu nguyen: bong van hien ngoai khung anh', r.bong[0] < 250, 'canh duoi ' + r.bong)
      w.destroy()
    }
    { // B1 anh ghim
      const NW = 300, NH = 200, bmp = Buffer.alloc(NW * NH * 4, 200)
      const nen = nativeImage.createFromBitmap(bmp, { width: NW, height: NH }).toDataURL()
      const pin = new BrowserWindow({ x: 0, y: 0, width: 700, height: 500, show: false, frame: false, transparent: true,
        webPreferences: { offscreen: { deviceScaleFactor: 1 }, preload: path.join(SRC, 'preload-pin.js'), contextIsolation: true, sandbox: false } })
      await pin.loadFile(path.join(SRC, 'pin', 'index.html'))
      pin.webContents.send('pin:data', { dataUrl: nen, pad: 12, w: 600, h: 400, lamMoKieu: 'mosaic' })
      await cho(500)
      const d = dieuKhien(pin)
      await d.phim('1'); await cho(200)
      await d.o(`themNet({ type: 'blur', blurType: 'kin', che: true, phu: ['a'], color: '#000', x1: 10, y1: 10, x2: 200, y2: 100 }); redraw(); true`)
      await d.phim('C', [process.platform === 'darwin' ? 'meta' : 'control']); await cho(300)
      kiem('B1 anh ghim dang che ma Ctrl+C: chep CHINH anh da ve, khong chep anh trong bo nho', thuTu.join(',') === 'luu-kem-chep', thuTu.join(','))
      pin.destroy()
    }
  } catch (e) {
    kiem('Chay kich ban khong nem loi', false, e && e.message)
  }
  console.log('KQ=' + JSON.stringify({ kq, loiTrang: [] }))
  app.exit(0)
})
