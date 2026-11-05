/* =========================================================================
   Do CHUP DUNG CUA SO (re chuot + bam) va CHUP LAI VUNG LAN TRUOC (05/11/2026).
   Chay: npm run test:cuaso      (hoac node scripts/test/do-chup-cua-so.cjs)
   KHONG bat cua so len man hinh: phan B dung BrowserWindow `show:false` + thu muc userData tam.
   Khong dung overlay that, khong chup man, khong cham cau hinh / anh that cua anh Tien.

   [A] Ham thuan src/overlay/chon-cua-so.js: chon cua so theo toa do (man 150%, 2 man, toa do AM,
       cua so chong nhau, bien nua mo), bam/keo, ep vao man, vung cu con dung duoc khong, doc dau ra script.
   [B] Overlay that (an) + IPC: re chuot sang vien dung cua so; BAM chon dung khung; KEO van khoanh vung nhu cu;
       ngoai cua so / khi chua co danh sach cua so thi y nhu truoc; che do ve khong hien vien cua so;
       bam Xong thi bao vung cuoi (nho-vung).
   [C] Lay danh sach cua so THAT cua may nay (PowerShell/osascript co san): do thoi gian, loc cua so cua chinh app.
   DOI CHUNG: phan A chay lai tren ban cua `chon-cua-so.js` bi lam hong 4 kieu; phan B chay lai voi 3 kieu hong
   trong overlay — moi kieu PHAI lam bai truot, khong truot la thuoc mu.
   ========================================================================= */
const fs = require('fs'), os = require('os'), path = require('path')
const { spawnSync, spawn } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const MOD = path.join(ROOT, 'src', 'overlay', 'chon-cua-so.js')

/* ──────────────────────────────── DRIVER (chay trong Electron) ──────────────────────────────── */
if (process.argv.includes('--driver')) {
  const { app, BrowserWindow, ipcMain } = require('electron')
  // Luat 05/11: dau ra bi dong (EPIPE) khong duoc bung hop loi Electron len man anh Tien
  process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
  process.on('uncaughtException', (e) => { try { console.error(e) } catch (x) {} app.exit(1) })
  const hong = (process.argv.find((a) => a.startsWith('--hong=')) || '').slice(7)
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-thu-cuaso-'))
  app.setPath('userData', tam)
  app.disableHardwareAcceleration()
  const ketQua = []
  const kiem = (ten, ok, ct) => ketQua.push({ ten, ok: !!ok, ct: ct || '' })
  let ipc = []
  for (const k of ['overlay:lock', 'overlay:drag-start', 'overlay:drag-end', 'overlay:chon-cua-so', 'overlay:nho-vung', 'overlay:confirm', 'overlay:log', 'overlay:cancel']) {
    ipcMain.on(k, (_e, ...a) => { ipc.push({ k: k.replace('overlay:', ''), a: a[0] }) })
  }
  ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
  const cho = (ms) => new Promise((r) => setTimeout(r, ms))
  const loai = (...ten) => ipc.filter((x) => x.k !== 'log' && (!ten.length || ten.includes(x.k))).map((x) => x.k)

  app.whenReady().then(async () => {
    const win = new BrowserWindow({
      width: 1280, height: 720, useContentSize: true, show: false, frame: false, transparent: true,
      webPreferences: { preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false },
    })
    const tai = async () => {
      const xong = new Promise((r) => win.webContents.once('did-finish-load', r))
      win.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
      await xong
      await cho(120)
      if (hong === 'laBam') await win.webContents.executeJavaScript('window.chonCuaSo.laBam = () => true; 0')
      if (hong === 'thuTu') await win.webContents.executeJavaScript('(() => { const g = window.chonCuaSo.cuaSoTaiDiem; window.chonCuaSo.cuaSoTaiDiem = (ds, p) => g(ds.slice().reverse(), p); return 0 })()')
      if (hong === 'tat') await win.webContents.executeJavaScript('window.chonCuaSo.cuaSoTaiDiem = () => null; 0')
      ipc = []
    }
    const gui = async (d) => { win.webContents.send('overlay:cua-so', d); await cho(80) }
    const ev = async (loaiSk, x, y) => {
      await win.webContents.executeJavaScript(
        'window.dispatchEvent(new MouseEvent(' + JSON.stringify(loaiSk) + ', { clientX: ' + x + ', clientY: ' + y + ', button: 0, bubbles: true }))')
      await cho(25)
    }
    const doiGuong = () => win.webContents.executeJavaScript(`(() => {
      const g = document.getElementById('guong'), k = document.getElementById('g-khung'), s = document.getElementById('g-size')
      return { hien: !g.hidden, l: parseFloat(k.style.left), t: parseFloat(k.style.top), w: parseFloat(k.style.width), h: parseFloat(k.style.height),
               size: s.hidden ? '' : s.textContent, hintCs: !document.getElementById('hint-cs').hidden }
    })()`)
    const bam = async (x, y, nhay = 0) => { await ev('mousedown', x, y); if (nhay) await ev('mousemove', x + nhay, y + nhay * 0.8); await ev('mouseup', x + nhay, y + nhay * 0.8); await cho(60) }

    /* man 150%: 1 phys = 1/1.5 DIP; cua so xep TREN CUNG truoc. A nam tren B; C nho ra ngoai man; D khong lien quan */
    const MAN1 = { px: 0, py: 0, pw: 3840, ph: 2160, sf: 1.5 }
    const A = { x: 300, y: 300, w: 600, h: 450 }, B = { x: 0, y: 0, w: 1800, h: 1000 }, C = { x: 1500, y: 900, w: 900, h: 600 }
    const DS1 = [A, C, B]

    await tai()
    const g0 = await doiGuong()
    kiem('B1 chua co danh sach cua so: chua hien dong goi y "bam chon cua so"', g0.hintCs === false)
    await ev('mousemove', 250, 250)
    kiem('B2 chua co danh sach: re chuot KHONG sang vien nao', (await doiGuong()).hien === false)
    await bam(250, 250)
    kiem('B3 chua co danh sach: bam = duong cu (drag-end), khong co chon-cua-so', loai('chon-cua-so').length === 0 && loai('drag-end').length === 1, loai().join(','))

    await tai(); await gui({ ds: DS1, man: MAN1 })
    kiem('B4 co danh sach: hien dong goi y "bam chon cua so"', (await doiGuong()).hintCs === true)
    await ev('mousemove', 250, 250)
    let g = await doiGuong()
    kiem('B5 re len A: vien dung khung A (DIP 200,200 398x298), nhan "600 x 450"',
      g.hien && g.l === 200 && g.t === 200 && g.w === 398 && g.h === 298 && g.size === '600 × 450', JSON.stringify(g))
    await ev('mousemove', 50, 50)
    g = await doiGuong()
    kiem('B6 re ra phan CHI B co: vien chuyen sang B (0,0), nhan "1800 x 1000"', g.hien && g.l === 0 && g.t === 0 && g.size === '1800 × 1000', JSON.stringify(g))
    await ev('mousemove', 1100, 650)
    g = await doiGuong()
    kiem('B7 C chong len B, nua nam ngoai man: C thang (z-order) va vien CAT theo man (1000..1280 = 278 rong)', g.hien && g.l === 1000 && g.w === 278 && g.size === '900 × 600', JSON.stringify(g))
    await ev('mousemove', 1270, 20)
    kiem('B8 re ra ngoai moi cua so: vien tat', (await doiGuong()).hien === false)

    ipc = []; await bam(250, 250)
    let kq = ipc.find((x) => x.k === 'chon-cua-so')
    kiem('B9 BAM len A: gui chon-cua-so dung rect A (phys 300,300 600x450), KHONG gui drag-end',
      kq && kq.a.x === 300 && kq.a.y === 300 && kq.a.w === 600 && kq.a.h === 450 && loai('drag-end').length === 0, JSON.stringify(kq))
    ipc = []; await bam(250, 250, 3)
    kiem('B10 BAM kem rung tay 3 DIP van la bam', loai('chon-cua-so').length === 1 && loai('drag-end').length === 0, loai().join(','))

    ipc = []; await ev('mousedown', 250, 250); await ev('mousemove', 260, 260); await ev('mousemove', 400, 400); await ev('mouseup', 400, 400); await cho(60)
    kiem('B11 KEO tu tren cua so: la khoanh vung (drag-end), KHONG chon cua so', loai('chon-cua-so').length === 0 && loai('drag-end').length === 1, loai().join(','))
    g = await doiGuong()
    kiem('B12 khi keo, khung ve theo chuot nhu cu (250,250 -> 400,400)', g.hien && g.l === 250 && g.t === 250 && g.w === 148 && g.h === 148, JSON.stringify(g))
    ipc = []; await bam(250, 250, 7)
    kiem('B13 keo ngan 7 DIP (qua nguong 4) van la KEO', loai('chon-cua-so').length === 0 && loai('drag-end').length === 1, loai().join(','))
    ipc = []; await ev('mousedown', 250, 250); await ev('mousemove', 300, 300); await ev('mousemove', 250, 250); await ev('mouseup', 250, 250); await cho(60)
    kiem('B14 keo ra xa roi quay ve diem dau: van la KEO, khong bien thanh bam', loai('chon-cua-so').length === 0 && loai('drag-end').length === 1, loai().join(','))
    ipc = []; await bam(1270, 20)
    kiem('B15 bam ra ngoai moi cua so: duong cu (drag-end)', loai('chon-cua-so').length === 0 && loai('drag-end').length === 1, loai().join(','))
    ipc = []; await ev('mousedown', 1270, 20); await ev('mousemove', 1200, 650); await ev('mousemove', 250, 250); await ev('mouseup', 250, 250); await cho(60)
    kiem('B16 bat dau keo o NGOAI cua so roi tha tren cua so: la keo, khong chon cua so', loai('chon-cua-so').length === 0 && loai('drag-end').length === 1, loai().join(','))

    /* man phu o toa do AM (nam tren man chinh), 100%: local (100,100) = phys (-2460,-1340) */
    const MAN2 = { px: -2560, py: -1440, pw: 2560, ph: 1440, sf: 1 }
    const E = { x: -2500, y: -1400, w: 800, h: 600 }
    await tai(); await gui({ ds: [E, { x: -2560, y: -1440, w: 2560, h: 1400 }], man: MAN2 })
    await ev('mousemove', 100, 100)
    g = await doiGuong()
    kiem('B17 man phu toa do AM: re len E hien vien dung (60,40) 798x598', g.hien && g.l === 60 && g.t === 40 && g.w === 798 && g.h === 598 && g.size === '800 × 600', JSON.stringify(g))
    ipc = []; await bam(100, 100)
    kq = ipc.find((x) => x.k === 'chon-cua-so')
    kiem('B18 man phu toa do AM: bam gui rect phys dung (-2500,-1400 800x600)', kq && kq.a.x === -2500 && kq.a.y === -1400 && kq.a.w === 800 && kq.a.h === 600, JSON.stringify(kq))

    /* che do ve: khong hien vien cua so; Xong -> nho-vung dung */
    await tai(); await gui({ ds: DS1, man: MAN1 })
    win.webContents.send('overlay:annotate', { x: 100, y: 100, w: 300, h: 200 }); await cho(120)
    await ev('mousemove', 250, 250)
    kiem('B19 dang o che do ve: re chuot KHONG sang vien cua so', (await doiGuong()).hien === false)
    ipc = []
    await win.webContents.executeJavaScript("document.getElementById('xong').click()"); await cho(120)
    const nv = ipc.find((x) => x.k === 'nho-vung')
    kiem('B20 bam Xong: bao vung cuoi (DIP cuc bo 100,100 300x200) truoc khi confirm',
      nv && nv.a.x === 100 && nv.a.y === 100 && nv.a.w === 300 && nv.a.h === 200 && loai('nho-vung', 'confirm').join(',') === 'nho-vung,confirm', JSON.stringify(ipc.map((x) => x.k)))

    process.stdout.write('KQ:' + JSON.stringify(ketQua) + '\n')
    try { fs.rmSync(tam, { recursive: true, force: true }) } catch (e) {}
    app.exit(0)
  }).catch((e) => { process.stdout.write('KQ:' + JSON.stringify([{ ten: 'driver LOI', ok: false, ct: String(e && e.stack || e) }]) + '\n'); app.exit(1) })
  return
}

/* ──────────────────────────────── BO KIEM (node thuong) ──────────────────────────────── */
function boKiemThuan(duongModul) {
  delete require.cache[require.resolve(duongModul)]
  const M = require(duongModul)
  const kq = []
  const kiem = (ten, ok) => kq.push({ ten, ok: !!ok })
  const man150 = { px: 0, py: 0, pw: 3840, ph: 2160, sf: 1.5 }
  const manTren = { px: -2560, py: -1440, pw: 2560, ph: 1440, sf: 1 }
  const A = { x: 300, y: 300, w: 600, h: 450 }, B = { x: 0, y: 0, w: 1800, h: 1000 }

  // man 150%: DIP -> phys
  let p = M.cucBoSangPhys({ x: 250, y: 250 }, man150)
  kiem('A1 man 150%: local 250,250 DIP = phys 375,375', p.x === 375 && p.y === 375)
  p = M.cucBoSangPhys({ x: 100, y: 100 }, manTren)
  kiem('A2 man phu toa do AM: local 100,100 = phys -2460,-1340', p.x === -2460 && p.y === -1340)
  // chong nhau: cai tren cung thang
  kiem('A3 cua so chong nhau: A (tren) thang B (duoi) o vung giao', M.cuaSoTaiDiem([A, B], { x: 375, y: 375 }) === A)
  kiem('A4 ngoai A thi roi xuong B', M.cuaSoTaiDiem([A, B], { x: 100, y: 100 }) === B)
  kiem('A5 danh sach dao thu tu thi ket qua doi (z-order co y nghia)', M.cuaSoTaiDiem([B, A], { x: 375, y: 375 }) === B)
  // bien nua mo
  kiem('A6 mep trai/tren THUOC cua so', M.cuaSoTaiDiem([A], { x: 300, y: 300 }) === A)
  kiem('A7 mep phai/duoi KHONG thuoc (x+w, y+h)', M.cuaSoTaiDiem([A], { x: 900, y: 500 }) === null && M.cuaSoTaiDiem([A], { x: 500, y: 750 }) === null)
  kiem('A8 diem cuoi cung ben trong (x+w-1, y+h-1) thuoc', M.cuaSoTaiDiem([A], { x: 899, y: 749 }) === A)
  kiem('A9 danh sach rong / khong phai mang -> null', M.cuaSoTaiDiem([], { x: 1, y: 1 }) === null && M.cuaSoTaiDiem(null, { x: 1, y: 1 }) === null)
  // cua so o toa do am
  const E = { x: -2500, y: -1400, w: 800, h: 600 }
  kiem('A10 cua so toa do am: tim dung', M.cuaSoTaiDiem([E], { x: -2460, y: -1340 }) === E && M.cuaSoTaiDiem([E], { x: -2501, y: -1340 }) === null)
  // phys -> local, cat theo man
  let L = M.physSangCucBo(A, man150, 1280, 720)
  kiem('A11 phys -> local man 150%: A = 200,200 400x300 DIP', L && L.x === 200 && L.y === 200 && L.w === 400 && L.h === 300)
  L = M.physSangCucBo({ x: 1500, y: 900, w: 900, h: 600 }, man150, 1280, 720)
  kiem('A12 cua so nua nam ngoai man bi cat: 1000..1280 DIP', L && L.x === 1000 && L.w === 280 && L.y === 600 && L.h === 120)
  kiem('A13 cua so hoan toan ngoai man -> null', M.physSangCucBo({ x: 5000, y: 5000, w: 100, h: 100 }, man150, 1280, 720) === null)
  L = M.physSangCucBo(E, manTren, 2560, 1440)
  kiem('A14 phys -> local man phu toa do am: E = 60,40 800x600', L && L.x === 60 && L.y === 40 && L.w === 800 && L.h === 600)
  // khu chuyen doi hai chieu (xoay vong) tren luoi toa do
  let loiXoay = 0
  for (const man of [man150, manTren, { px: 3840, py: 0, pw: 1920, ph: 1080, sf: 1.25 }]) {
    for (let x = 0; x < 300; x += 37) for (let y = 0; y < 200; y += 29) {
      const ph = M.cucBoSangPhys({ x, y }, man)
      const l = M.physSangCucBo({ x: ph.x, y: ph.y, w: 100, h: 100 }, man, 5000, 5000)
      if (!l || Math.abs(l.x - x) > 1e-9 || Math.abs(l.y - y) > 1e-9) loiXoay++
    }
  }
  kiem('A15 doi toa do 2 chieu khop tren 3 man (150%, toa do am, 125%)', loiXoay === 0)
  // bam / keo
  kiem('A16 bam: di <= 4 DIP', M.laBam({ x: 10, y: 10 }, { x: 13, y: 12 }) && M.laBam({ x: 10, y: 10 }, { x: 14, y: 10 }))
  kiem('A17 keo: di > 4 DIP', !M.laBam({ x: 10, y: 10 }, { x: 15, y: 10 }) && !M.laBam({ x: 10, y: 10 }, { x: 13, y: 14 }))
  // ep vao man
  const mans = [man150, manTren]
  let k = M.kepVaoMan({ x: -8, y: -8, w: 1920, h: 1080 }, [{ px: 0, py: 0, pw: 1904, ph: 1048, sf: 1 }])
  kiem('A18 cua so toi da tran 8 px ra ngoai man bi ep vao man', k && k.x === 0 && k.y === 0 && k.w === 1904 && k.h === 1048)
  kiem('A19 cua so nam ngoai moi man -> null', M.kepVaoMan({ x: 9000, y: 9000, w: 400, h: 400 }, mans) === null)
  kiem('A20 cua so qua nho (< 8 sau khi ep) -> null', M.kepVaoMan({ x: -100, y: 10, w: 104, h: 300 }, [{ px: 0, py: 0, pw: 800, ph: 600, sf: 1 }]) === null)
  k = M.kepVaoMan({ x: -2000, y: -1000, w: 3000, h: 2000 }, mans)
  kiem('A21 cua so vat qua 2 man giu nguyen kich thuoc (khong cat o ranh gioi)', k && k.x === -2000 && k.y === -1000 && k.w === 3000 && k.h === 2000)
  // vung lan truoc
  kiem('A22 vung cu con nam trong man -> dung duoc', M.vungConHopLe({ x: 100, y: 100, w: 500, h: 400 }, mans))
  kiem('A23 vung cu o man da thao ra -> khong dung', !M.vungConHopLe({ x: 5000, y: 100, w: 500, h: 400 }, mans))
  kiem('A24 vung cu tran mep man (man doi nho di) -> khong dung', !M.vungConHopLe({ x: 3500, y: 1900, w: 500, h: 400 }, [man150]))
  kiem('A25 vung hong (NaN / thieu) hoac nho < 8 px -> khong dung', !M.vungConHopLe({ x: NaN, y: 1, w: 50, h: 50 }, mans) && !M.vungConHopLe(undefined, mans) && !M.vungConHopLe({ x: 1, y: 1, w: 5, h: 50 }, mans))
  kiem('A26 vung cu vat ngang 2 man ke nhau van dung duoc (4 goc deu nam trong man)', M.vungConHopLe({ x: -100, y: 100, w: 200, h: 200 }, [{ px: -1920, py: 0, pw: 1920, ph: 1080, sf: 1 }, { px: 0, py: 0, pw: 1920, ph: 1080, sf: 1 }]))
  // doc dau ra
  const ds = M.docDanhSach('256 203 487 169\r\n-1440 -20 800 600\nrac ra day\n10 10 5 5\n  1310 -1440 1254 1372  \n\n3059 0 -5 100\n')
  kiem('A27 doc dau ra: 3 dong hop le, bo dong rac / nho / am', ds.length === 3 && ds[0].x === 256 && ds[1].x === -1440 && ds[2].y === -1440)
  return kq
}

const tomTat = []
let tongTruot = 0
function inKq(nhan, kq) {
  const truot = kq.filter((x) => !x.ok)
  console.log('\n' + nhan + ': ' + (kq.length - truot.length) + '/' + kq.length + ' dat')
  for (const x of kq) console.log('  ' + (x.ok ? 'DAT   ' : 'TRUOT ') + x.ten + (x.ct && !x.ok ? '  <- ' + x.ct : ''))
  return truot.length
}

// [A] ham thuan
tongTruot += inKq('[A] Ham thuan chon-cua-so.js', boKiemThuan(MOD))

// [A-doi chung] 4 ban hong cua module: moi ban PHAI lam bo A truot
const goc = fs.readFileSync(MOD, 'utf8')
const tamDC = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-thu-cuaso-dc-'))
const bienThe = [
  ['dung nguong bam qua lon (400 thay vi 4)', (s) => s.replace('const NGUONG_BAM = 4', 'const NGUONG_BAM = 400')],
  ['tim cua so tu DUOI len (bo qua z-order)', (s) => s.replace('for (const c of ds) {', 'for (const c of ds.slice().reverse()) {')],
  ['bien phai/duoi tinh la thuoc (<=)', (s) => s.replace('p.x < c.x + c.w && p.y >= c.y && p.y < c.y + c.h', 'p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h')],
  ['quen nhan ti le man khi doi toa do', (s) => s.replace('x: man.px + p.x * man.sf, y: man.py + p.y * man.sf', 'x: man.px + p.x, y: man.py + p.y')],
]
let doiChungDat = 0
for (const [ten, bien] of bienThe) {
  const f = path.join(tamDC, 'chon-cua-so-hong.js')
  const noiDung = bien(goc)
  if (noiDung === goc) { console.log('\n[A-doi chung] LOI: mau thay the khong khop, bien the "' + ten + '" khong duoc tao'); tongTruot++; continue }
  fs.writeFileSync(f, noiDung)
  const t = boKiemThuan(f).filter((x) => !x.ok).length
  const ok = t > 0
  if (ok) doiChungDat++; else tongTruot++
  console.log('[A-doi chung] ' + (ok ? 'DAT   ' : 'TRUOT ') + 'ban hong "' + ten + '": bo A bat duoc ' + t + ' muc truot')
}
fs.rmSync(tamDC, { recursive: true, force: true })

// [B] overlay that, an
const electronExe = (() => { try { return require(path.join(ROOT, '..', '..', 'node_modules', 'electron')) } catch (e) { return null } })() || (() => { try { return require('electron') } catch (e) { return null } })()
function chayDriver(hong) {
  return new Promise((xong) => {
    const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
    const args = [__filename, '--driver'].concat(hong ? ['--hong=' + hong] : [])
    const p = spawn(electronExe, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = '', err = ''
    const tm = setTimeout(() => { try { p.kill() } catch (e) {} }, 90000)
    p.stdout.on('data', (d) => { out += d }); p.stderr.on('data', (d) => { err += d })
    p.on('close', () => {
      clearTimeout(tm)
      const dong = out.split(/\r?\n/).find((l) => l.startsWith('KQ:'))
      if (!dong) return xong({ loi: 'driver khong tra ket qua. stderr: ' + err.slice(-600), kq: [] })
      xong({ kq: JSON.parse(dong.slice(3)) })
    })
  })
}

;(async () => {
  if (!electronExe) {
    console.log('\n[B] BO QUA: khong tim thay electron (export NODE_PATH=<thu muc app>/node_modules roi chay lai)')
    tongTruot++
  } else {
    const r = await chayDriver('')
    if (r.loi) { console.log('\n[B] LOI: ' + r.loi); tongTruot++ }
    else tongTruot += inKq('[B] Overlay that (an) + IPC', r.kq)
    // doi chung B: 3 kieu hong trong overlay, moi kieu PHAI lam B truot
    for (const [hong, ten] of [['laBam', 'moi lan nhan deu coi la BAM (khong phan biet keo)'], ['thuTu', 'tim cua so tu duoi len'], ['tat', 'tinh nang tat (khong tim thay cua so nao)']]) {
      const h = await chayDriver(hong)
      const t = h.kq.filter((x) => !x.ok)
      const ok = t.length > 0
      if (!ok) tongTruot++
      console.log('[B-doi chung] ' + (ok ? 'DAT   ' : 'TRUOT ') + 'ban hong "' + ten + '": bo B bat duoc ' + t.length + ' muc (' + t.slice(0, 3).map((x) => x.ten.split(' ')[0]).join(' ') + ')')
    }
  }

  // [C] lay danh sach cua so that
  console.log('\n[C] Lay danh sach cua so THAT tren may nay (' + process.platform + ')')
  const lay = require(path.join(ROOT, 'src', 'lay-cua-so.js'))
  const M = require(MOD)
  const lan = []
  let ds = []
  for (let i = 0; i < 5; i++) {
    const r = await lay.layDanhSach({ pid: 0 })
    lan.push(r.ms)
    if (i === 0) ds = M.docDanhSach(r.text)
    if (!r.ok && process.platform === 'win32') { console.log('  TRUOT lan ' + i + ' khong chay duoc'); tongTruot++ }
  }
  lan.sort((a, b) => a - b)
  const trungVi = lan[Math.floor(lan.length / 2)]
  console.log('  thoi gian 5 lan (ms): ' + lan.join(', ') + ' | trung vi ' + trungVi + ' ms | so cua so: ' + ds.length)
  if (process.platform === 'win32') {
    const dat = (ten, ok, ct) => { console.log('  ' + (ok ? 'DAT   ' : 'TRUOT ') + ten + (ct ? '  (' + ct + ')' : '')); if (!ok) tongTruot++ }
    dat('C1 lay duoc it nhat 1 cua so, moi cua so >= 20 px', ds.length >= 1 && ds.every((c) => c.w >= 20 && c.h >= 20))
    dat('C2 thoi gian trung vi duoi 1500 ms (chay nen, khong chan viec hien overlay)', trungVi < 1500, trungVi + ' ms')
    // doi chung loc cua so cua chinh app: tim mot PID ma bo qua no lam danh sach NGAN di (PID co cua so that trong danh sach)
    const pidR = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '(Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle } | Select-Object -First 12).Id -join ","'], { encoding: 'utf8', windowsHide: true })
    const pids = String(pidR.stdout).trim().split(',').map((x) => parseInt(x, 10)).filter((x) => x > 0)
    const co = M.docDanhSach((await lay.layDanhSach({ pid: 0 })).text).length
    let thay = null
    for (const pid of pids) {
      const loc = M.docDanhSach((await lay.layDanhSach({ pid })).text).length
      if (loc < co) { thay = pid + ': ' + co + ' -> ' + loc; break }
    }
    dat('C3 doi chung: bo qua PID cua mot tien trinh dang co cua so thi danh sach ngan di', !!thay, thay || ('khong PID nao trong ' + pids.length + ' lam danh sach doi (' + co + ')'))
  } else {
    console.log('  chua do tren ' + process.platform + ' (script osascript chua co may Mac de chay thu)')
  }

  console.log('\n=> ' + (tongTruot === 0 ? 'DAT TAT CA' : 'CO ' + tongTruot + ' MUC TRUOT'))
  process.exit(tongTruot === 0 ? 0 : 1)
})()
