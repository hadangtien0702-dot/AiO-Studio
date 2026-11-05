/* Bai do CHE THONG MINH (05/11/2026). Chay:  npm run test:chethongminh   (AN, ~1-2 phut, khong hien cua so nao len man).
   Tu mo Electron an (show:false); dau ra ghi vao FILE roi in lai (khong dung ong | de tranh EPIPE bat hop thoai loi len man).

   Do gi (anh tao san bang canvas, co email / so dien thoai Viet Nam + My / so the / link / chu tieng Viet):
   [1] THUAN (src/che-thong-minh.js): bang cau dung + SAI (ngay, gia 1.500.000, IP, ma don... KHONG duoc bat); cau khong co gi de che = 0.
   [2] DOC CHU THAT (src/che-tm-main.js -> ocr.docChuTu -> Tesseract) tren anh man 100% va 150%: dem muc tim ra = 6 (A) / 0 (B).
   [3] ANH GHIM THAT (src/pin/pin.js + che-tm-ui.js chay trong cua so an, man 100% va 150%): bam nut Che thong minh -> Tu che ->
       dem; TOA DO che phu HET pixel chu cua tung muc; Hoan tac / Lam lai = 1 buoc; bam chu = che, bam lai = bo; Che moi cho trung;
       che theo DONG; Xong -> anh XUAT: moi pixel chu cua muc nhay cam da DEN dac, dong khong nhay cam KHONG bi dung; DOC CHU LAI
       anh xuat: 0 email / so / link con doc duoc.
   [4] MAN CHUP THAT (src/overlay/overlay.js, khoanh vung gia lap, protocol aioshot gia): cung phep do o man 100% / 150%.
   [5] DOI CHUNG: che LECH 80 px -> phep phu PHAI truot va doc lai PHAI con thay email; thuoc phat hien khong nhay vao anh khong co gi. */
'use strict'
const path = require('path')
const os = require('os')
const fs = require('fs')
const { spawnSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')

/* ── Cha: mo Electron an, ghi ra file, in lai ───────────────────────────────────────────────── */
if (!process.versions.electron) {
  let electron
  try { electron = require('electron') } catch (e) {
    console.log('Khong tim thay electron. Chay: export NODE_PATH=<thu muc node_modules cua app> roi chay lai (hoac npm install).')
    process.exit(2)
  }
  let ma = 0
  for (const dpr of (process.env.AIO_ONLY_DPR ? [process.env.AIO_ONLY_DPR] : ['1', '1.5'])) {
    const ra = path.join(os.tmpdir(), 'aio-che-thong-minh-' + process.pid + '-' + dpr + '.txt')
    const fd = fs.openSync(ra, 'w')
    const env = { ...process.env, AIO_DPR: dpr }
    delete env.ELECTRON_RUN_AS_NODE
    // --force-device-scale-factor: cua so an chay DUNG ti le man 100% / 150% (window.devicePixelRatio that, khong gia lap)
    const r = spawnSync(electron, ['--force-device-scale-factor=' + dpr, __filename], { cwd: ROOT, stdio: ['ignore', fd, fd], env, timeout: 600000 })
    fs.closeSync(fd)
    console.log('\n########## MAN ' + Math.round(+dpr * 100) + '% ##########')
    console.log(fs.readFileSync(ra, 'utf8'))
    try { fs.unlinkSync(ra) } catch (e) {}
    if (r.status !== 0) ma = r.status === null ? 1 : (r.status || 1)
  }
  process.exit(ma)
}

/* ── Con: chay trong Electron ───────────────────────────────────────────────────────────────── */
require('module')._initPaths() // Electron main khong tu doc NODE_PATH
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
const { app, BrowserWindow, ipcMain, nativeImage, protocol } = require('electron')
process.on('uncaughtException', (e) => { try { console.error(e) } catch (x) {} app.exit(1) })
process.on('unhandledRejection', (e) => { try { console.error(e) } catch (x) {} app.exit(1) })

// Cua so an + khong chiem phim/man hinh cua anh
app.setPath('userData', path.join(os.tmpdir(), 'aio-che-thong-minh-userdata'))
const S = +process.env.AIO_DPR || 1 // ti le man cua luot chay nay (cha truyen vao)
app.commandLine.appendSwitch('force-device-scale-factor', String(S))
protocol.registerSchemesAsPrivileged([{ scheme: 'aioshot', privileges: { corsEnabled: true, supportFetchAPI: true, stream: true } }])

const CT = require(path.join(ROOT, 'src', 'che-thong-minh.js'))
const ocr = require(path.join(ROOT, 'src', 'ocr.js'))
const cheTMMain = require(path.join(ROOT, 'src', 'che-tm-main.js'))

let tong = 0, truot = 0
const kiem = (ten, ok, ct = '') => { tong++; if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct !== '' ? ' (' + ct + ')' : '')) }
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const doc = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8')

/* ── Anh thu: ve bang canvas trong cua so an ─────────────────────────────────────────────────── */
const DONG_A = [
  { pre: 'Họ và tên: Nguyễn Văn An', nhay: '' },
  { pre: 'Email: ', nhay: 'nguyen.van.an@gmail.com', loai: 'email' },
  { pre: 'Điện thoại: ', nhay: '0912 345 678', loai: 'dienthoai' },
  { pre: 'Phone (US): ', nhay: '(415) 555-0132', loai: 'dienthoai' },
  { pre: 'Thẻ: ', nhay: '4111 1111 1111 1111', loai: 'the' },
  { pre: 'Web: ', nhay: 'https://example.com/ho-so/an', loai: 'link' },
  { pre: 'Bản sao gửi: ', nhay: 'nguyen.van.an@gmail.com', loai: 'email' },
  { pre: 'Ngày 05/11/2026 giá 1.500.000 đồng', nhay: '' },
]
const DONG_B = [
  { pre: 'Hôm nay trời đẹp, chúng ta đi chơi lúc 8 giờ 30', nhay: '' },
  { pre: 'Ngày 05/11/2026 giá 1.500.000 đồng, đơn số 123456', nhay: '' },
  { pre: 'Máy chủ 192.168.1.10 phiên bản 2.4.1 hoạt động tốt', nhay: '' },
]
let winVe = null
async function veAnh(dong, s) { // s = he so man (1 hoac 1.5): anh that = (900x...) * s
  if (!winVe) { winVe = new BrowserWindow({ show: false }); await winVe.loadURL('about:blank') }
  const js = `(() => {
    const s = ${s}, L = ${JSON.stringify(dong)}, W = 900, H = 14 + L.length * 42 + 10
    const c = document.createElement('canvas'); c.width = Math.round(W * s); c.height = Math.round(H * s)
    const x = c.getContext('2d'); x.scale(s, s); x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.fillStyle = '#222222'
    x.font = '26px Arial'; x.textBaseline = 'top'
    const gt = []
    L.forEach((l, i) => {
      const y = 14 + i * 42
      x.fillText(l.pre + l.nhay, 20, y)
      if (l.nhay) {
        const x0 = 20 + x.measureText(l.pre).width, x1 = x0 + x.measureText(l.nhay).width
        gt.push({ loai: l.loai, text: l.nhay, dong: i, x0: Math.floor(x0 * s) - 1, x1: Math.ceil(x1 * s) + 1, y0: Math.floor(y * s) - 2, y1: Math.ceil((y + 32) * s) + 2 })
      }
    })
    return { url: c.toDataURL('image/png'), gt, w: c.width, h: c.height }
  })()`
  const r = await winVe.webContents.executeJavaScript(js)
  return { img: nativeImage.createFromDataURL(r.url), gt: r.gt, w: r.w, h: r.h, s }
}

/* ── Do diem anh ─────────────────────────────────────────────────────────────────────────────── */
function bitmap(img) { const sz = img.getSize(); return { b: img.toBitmap(), w: sz.width, h: sz.height } } // BGRA
const lum = (bm, x, y) => { const i = (y * bm.w + x) * 4; return 0.114 * bm.b[i] + 0.587 * bm.b[i + 1] + 0.299 * bm.b[i + 2] }
const tren = (rects, x, y) => rects.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1)

/* Moi pixel CHU (toi hon 200) trong vung chu nhay cam cua anh GOC: bao nhieu diem, bao nhieu diem NAM TRONG o che. */
function phuChu(bmGoc, gt, rects) {
  let ink = 0, trong = 0
  for (let y = Math.max(0, gt.y0); y < Math.min(bmGoc.h, gt.y1); y++) {
    for (let x = Math.max(0, gt.x0); x < Math.min(bmGoc.w, gt.x1); x++) {
      if (lum(bmGoc, x, y) < 200) { ink++; if (tren(rects, x, y)) trong++ }
    }
  }
  return { ink, trong }
}
/* Anh XUAT: moi pixel chu goc phai DEN DAC (<= 24) - chu da mat. */
function denDac(bmGoc, bmRa, gt) {
  let ink = 0, con = 0
  const vet = []
  for (let y = Math.max(0, gt.y0); y < Math.min(bmGoc.h, gt.y1); y++) {
    for (let x = Math.max(0, gt.x0); x < Math.min(bmGoc.w, gt.x1); x++) {
      if (lum(bmGoc, x, y) < 200) { ink++; if (lum(bmRa, x, y) > 24) { con++; if (vet.length < 6) vet.push(x + ',' + y + '=' + Math.round(lum(bmRa, x, y))) } }
    }
  }
  return { ink, con, vet }
}
/* Dong KHONG nhay cam (dong 0 va dong cuoi) phai y nguyen sau khi che. */
function doiDong(bmGoc, bmRa, s, dong) {
  const y0 = Math.floor((14 + dong * 42) * s) - 2, y1 = Math.ceil((14 + dong * 42 + 32) * s) + 2
  let lech = 0
  for (let y = Math.max(0, y0); y < Math.min(bmGoc.h, y1); y++) for (let x = 0; x < bmGoc.w; x++) {
    if (Math.abs(lum(bmGoc, x, y) - lum(bmRa, x, y)) > 8) lech++
  }
  return lech
}
const dem = (ds, loai) => ds.filter((m) => m.loai === loai).length

;(async () => {
  await app.whenReady()
  const t0 = Date.now()

  /* ── [1] THUAN ─────────────────────────────────────────────────────────────────────────── */
  if (S === 1) { // phan thuan khong phu thuoc man: chi chay 1 lan
  console.log('\n[1] Phan thuan: nhan dien theo chuoi')
  const DUNG = [
    ['nguyen.van.an@gmail.com', 'email'], ['a_b+tag@sub.example.co.uk', 'email'], ['0912 345 678', 'dienthoai'], ['0912.345.678', 'dienthoai'],
    ['0912345678', 'dienthoai'], ['+84 912 345 678', 'dienthoai'], ['(415) 555-0132', 'dienthoai'], ['415-555-0132', 'dienthoai'],
    ['+1 415 555 0132', 'dienthoai'], ['02438251234', 'dienthoai'], ['4111 1111 1111 1111', 'the'], ['4111-1111-1111-1111', 'the'],
    ['4111111111111111', 'the'], ['378282246310005', 'the'], ['https://example.com/ho-so/an', 'link'], ['www.example.com', 'link'],
    ['example.vn/trang', 'link'],
  ]
  for (const [c, loai] of DUNG) kiem('nhan ra ' + loai + ': ' + c, CT.phanLoaiChuoi(c) === loai, CT.phanLoaiChuoi(c))
  const SAI = ['05/11/2026', '2026-11-05', '1.500.000', '2.500.000.000', '192.168.1.10', '123456', 'v2.4.1', 'Nguyễn Văn An', 'ai cũng biết', '8 giờ 30',
    'Hôm nay trời đẹp', '12 Đường Lê Lợi, Quận 1', '3,5 triệu', '1234567890123456789012', 'mã đơn #123456789', '10:30:45']
  for (const c of SAI) kiem('KHONG nhay vao: ' + c, CT.phanLoaiChuoi(c) === null, CT.phanLoaiChuoi(c))
  const nhieu = CT.quetChuoi('Lien he an@x.com hoac 0912 345 678, xem https://a.com/b.')
  kiem('mot cau co 3 muc: email + dien thoai + link', nhieu.map((m) => m.loai).join() === 'email,dienthoai,link', nhieu.map((m) => m.loai).join())
  kiem('cau khong co gi de che ra 0 muc', CT.quetChuoi('Hôm nay trời đẹp, ngày 05/11/2026 giá 1.500.000 đồng').length === 0)
  const sh = CT.taoShape({ id: 'x', phu: ['0:0'], khoa: 'k', x0: 100, y0: 50, x1: 200, y1: 70 }, 1.5, 300, 150)
  kiem('shape che: kieu blur / kin, de len du chu + le', sh.type === 'blur' && sh.blurType === 'kin' && sh.x1 < 100 / 1.5 && sh.x2 > 200 / 1.5 && sh.y1 < 50 / 1.5 && sh.y2 > 70 / 1.5,
    JSON.stringify([sh.x1.toFixed(1), sh.y1.toFixed(1), sh.x2.toFixed(1), sh.y2.toFixed(1)]))
  const sh2 = CT.taoShape({ id: 'y', phu: ['0:0'], khoa: 'k', x0: 0, y0: 0, x1: 300, y1: 150 }, 1, 300, 150)
  kiem('shape che khong tran ra ngoai vung', sh2.x1 >= 0 && sh2.y1 >= 0 && sh2.x2 <= 300 && sh2.y2 <= 150)
  }

  /* ── [2] DOC CHU THAT ──────────────────────────────────────────────────────────────────── */
  console.log('\n[2] Doc chu that (Tesseract) kem toa do, anh man 100% va 150%')
  const kho = {}
  for (const s of [S]) {
    const A = await veAnh(DONG_A, s), B = await veAnh(DONG_B, s)
    kho[s] = { A, B }
    const kqA = await cheTMMain.docVungTu(nativeImage, ocr, A.img, { x: 0, y: 0, w: A.w, h: A.h, sf: s })
    const kqB = await cheTMMain.docVungTu(nativeImage, ocr, B.img, { x: 0, y: 0, w: B.w, h: B.h, sf: s })
    kiem('man ' + s * 100 + '%: doc chu anh A OK', kqA.ok, kqA.ok ? kqA.dong.length + ' dong, ' + kqA.ms + ' ms' : kqA.loi)
    if (!kqA.ok || !kqB.ok) continue
    const muc = CT.timMuc(kqA.dong), mucB = CT.timMuc(kqB.dong)
    kiem('man ' + s * 100 + '%: anh A tim ra DUNG 6 muc (2 email, 2 so dien thoai, 1 so the, 1 link)', muc.length === 6 && dem(muc, 'email') === 2 && dem(muc, 'dienthoai') === 2 && dem(muc, 'the') === 1 && dem(muc, 'link') === 1,
      muc.map((m) => m.loai + ':' + m.text).join(' | '))
    kiem('man ' + s * 100 + '%: anh B (chu thuong, ngay, gia, IP, phien ban) tim ra 0 muc', mucB.length === 0, mucB.map((m) => m.loai + ':' + m.text).join(' | ') || 'khong co')
    kiem('man ' + s * 100 + '%: toa do tu nam trong anh', kqA.dong.every((l) => l.tu.every((t) => t.x0 >= 0 && t.y0 >= 0 && t.x1 <= A.w && t.y1 <= A.h && t.x1 > t.x0)))
    kho[s].kqA = kqA
  }

  /* ── cua so gia lap: IPC + moi truong ─────────────────────────────────────────────────────── */
  const anhTheoWc = new Map(), luuTheoWc = new Map(), fillTheoWc = new Map()
  ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
  for (const k of ['pin:log', 'overlay:log']) ipcMain.on(k, () => {})
  ipcMain.on('overlay:lock', () => {})
  ipcMain.handle('pin:ocr-tu', async (e) => { const a = anhTheoWc.get(e.sender.id); return cheTMMain.docAnhGhim(nativeImage, ocr, a.img, a.w / a.s) })
  ipcMain.on('pin:save-edit', (e, url) => { luuTheoWc.set(e.sender.id, url) })
  ipcMain.on('overlay:confirm', (e, p) => { luuTheoWc.set(e.sender.id, p) })
  // man chup: ocr-tu goi dung ham cua main voi "anh goc" (rawStore gia)
  ipcMain.handle('overlay:ocr-tu', async (e, q) => cheTMMain.docVungTu(nativeImage, ocr, fillTheoWc.get(e.sender.id).img, q))
  protocol.handle('aioshot', (req) => {
    const h = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }
    for (const [, v] of fillTheoWc) {
      let m = /^aioshot:\/\/frozen\//.exec(req.url)
      if (m) return new Response(v.img.toJPEG(92), { headers: Object.assign({ 'Content-Type': 'image/jpeg' }, h) })
      m = /^aioshot:\/\/raw\/[^/]+\/[^/]+\/(\d+)_(\d+)_(\d+)_(\d+)\.png$/.exec(req.url)
      if (m) {
        const sz = v.img.getSize(), x = Math.min(+m[1], sz.width - 1), y = Math.min(+m[2], sz.height - 1)
        const w = Math.max(1, Math.min(+m[3], sz.width - x)), hh = Math.max(1, Math.min(+m[4], sz.height - y))
        return new Response(v.img.crop({ x, y, width: w, height: hh }).toPNG(), { headers: Object.assign({ 'Content-Type': 'image/png' }, h) })
      }
    }
    return new Response('', { status: 404 })
  })

  const chay = (win, js) => win.webContents.executeJavaScript(js)
  async function cho(win, bieuThuc, ms = 25000) {
    const d = Date.now()
    while (Date.now() - d < ms) {
      let ok = false
      try { ok = await chay(win, '!!(' + bieuThuc + ')') } catch (e) {}
      if (ok) return true
      await ngu(120)
    }
    return false
  }
  
  /* mo cua so ghim an voi anh X o man dpr */
  async function moGhim(X) {
    const W = Math.ceil(X.w / X.s) + 40, H = Math.ceil(X.h / X.s) + 40
    const win = new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, frame: false, transparent: true,
      webPreferences: { preload: path.join(ROOT, 'src', 'preload-pin.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false } })
    anhTheoWc.set(win.webContents.id, X)
    await win.loadFile(path.join(ROOT, 'src', 'pin', 'index.html'))
    win.webContents.send('pin:data', { dataUrl: X.img.toDataURL(), pad: 12, w: X.w / X.s, h: X.h / X.s, lamMoKieu: 'mosaic' })
    await cho(win, `document.getElementById('img').naturalWidth > 0`)
    return win
  }
  const maskRects = (win, k) => chay(win, `shapes.filter(CheTM.laShapeChe).map((s) => ({ x0: Math.min(s.x1, s.x2) * ${k}, y0: Math.min(s.y1, s.y2) * ${k}, x1: Math.max(s.x1, s.x2) * ${k}, y1: Math.max(s.y1, s.y2) * ${k} }))`)
  const soChe = (win) => chay(win, `shapes.filter(CheTM.laShapeChe).length`)
  const click = (win, sel) => chay(win, `document.querySelector(${JSON.stringify(sel)}).click()`)
  const trangThai = (win) => chay(win, `document.querySelector('.che-strip').dataset.trangThai`)

  /* ── [3] ANH GHIM THAT ─────────────────────────────────────────────────────────────────── */
  for (const s of [S]) {
    const X = kho[s].A
    console.log('\n[3] Anh ghim that (pin.js + che-tm-ui.js), man ' + s * 100 + '%')
    const win = await moGhim(X)
    const dprTrang = await chay(win, 'window.devicePixelRatio')
    kiem('trang thay dung ti le man', Math.abs(dprTrang - s) < 0.01, 'DPR=' + dprTrang)
    kiem('thanh cong cu: nut Che thong minh nam trong MENU XO cua nut Lam mo (khong them nut ra thanh)',
      await chay(win, `!!document.querySelector('#lam-mo-nhom #lam-mo-menu #che-muc') && document.querySelectorAll('#toolbar > .cong-cu[data-tool="che"]').length === 0`))
    await click(win, '#che-muc')
    kiem('bam nut: doc chu xong, thanh dieu khien hien (san-sang)', await cho(win, `document.querySelector('.che-strip').dataset.trangThai === 'san-sang'`, 40000), await trangThai(win))
    const soMuc = +(await chay(win, `document.querySelector('.che-strip').dataset.soMuc`))
    kiem('thanh bao tim thay 6 muc', soMuc === 6, soMuc)
    const soHop = await chay(win, `document.querySelectorAll('.che-hop').length`)
    const soTu = +(await chay(win, `document.querySelector('.che-strip').dataset.soTu`))
    kiem('hien khung tung tu (moi tu doc ra co 1 khung)', soTu >= 20 && soHop === soTu, soHop + ' khung / ' + soTu + ' tu')
    kiem('chua che gi: 0 shape che', (await soChe(win)) === 0)

    // bam chu = che, bam lai = bo
    const idTu = await chay(win, `(() => { const e = [...document.querySelectorAll('.che-hop')].find((q) => q.dataset.text === 'Văn'); if (!e) return null; e.click(); return e.dataset.id })()`)
    kiem('bam mot chu: che 1 cho', idTu !== null && (await soChe(win)) === 1, idTu)
    kiem('khung do doi sang "da che"', await chay(win, `document.querySelector('.che-hop.da-che') !== null`))
    await chay(win, `document.querySelector('.che-hop.da-che').click()`)
    kiem('bam lai: bo che (0 shape)', (await soChe(win)) === 0)

    // 05/11 soat: bo che = mot buoc trong lich su, khong xoa cac thao tac truoc do
    await chay(win, `(() => { themNet({ type: 'rect', x1: 5, y1: 5, x2: 40, y2: 30, color: '#f00' }); const s = shapes[shapes.length - 1], t = SuaNet.sao(s); s.x1 += 20; s.x2 += 20; SuaNet.ghiSua(s, t); redraw(); return true })()`)
    await chay(win, `[...document.querySelectorAll('.che-hop')].find((q) => q.dataset.text === 'Văn').click()`)
    await chay(win, `document.querySelector('.che-hop.da-che').click()`)
    await chay(win, `hoanTac(); true`)
    kiem('bo che roi Ctrl+Z: che lai dung cho do', (await soChe(win)) === 1)
    await chay(win, `hoanTac(); true`)
    await chay(win, `hoanTac(); true`)
    kiem('Ctrl+Z tiep: lui tung buoc toi lan keo khung ve truoc, khung khong bi mat', await chay(win, `shapes.length === 1 && shapes[0].x1 === 5`), await chay(win, `JSON.stringify(shapes)`))
    await chay(win, `shapes.length = 0; SuaNet.lichSu.length = 0; SuaNet.redo.length = 0; redraw(); lamMoiCheThu && 0; true`.replace(' lamMoiCheThu && 0;', ''))

    // Tu che
    await click(win, '.che-hang > .che-nut:nth-of-type(1)')
    await ngu(150)
    kiem('Tu che: che du 6 cho', (await soChe(win)) === 6, await soChe(win))
    kiem('thanh bao "Da che 6 cho" (da-tu-che)', (await trangThai(win)) === 'da-tu-che', await chay(win, `document.querySelector('.che-tt').textContent`))
    const rects = await maskRects(win, s) // DIP -> pixel anh that: he so = anh that / DIP = s
    const bmGoc = bitmap(X.img)
    const pad = X.gt.map((g) => phuChu(bmGoc, g, rects))
    pad.forEach((p, i) => kiem('toa do che phu HET chu: ' + X.gt[i].loai + ' "' + X.gt[i].text + '"', p.ink > 80 && p.trong === p.ink, p.trong + '/' + p.ink + ' diem chu'))

    // Hoan tac / Lam lai = 1 buoc cho ca nhom
    await click(win, '#undo'); await ngu(80)
    kiem('Hoan tac 1 lan go CA nhom Tu che (0 shape), nut Lam lai sang', (await soChe(win)) === 0 && (await chay(win, `!document.getElementById('redo').disabled`)))
    await click(win, '#redo'); await ngu(80)
    kiem('Lam lai 1 lan dua ca 6 cho ve', (await soChe(win)) === 6)
    // Che moi cho trung: go het, bam email dong 2, bam "Che moi cho trung"
    await click(win, '#undo'); await ngu(80)
    await chay(win, `[...document.querySelectorAll('.che-hop')].find((q) => q.dataset.text === 'nguyen.van.an@gmail.com').click()`)
    kiem('bam 1 email: che 1 cho, nut "Che moi cho trung" sang', (await soChe(win)) === 1 && (await chay(win, `!document.querySelector('.che-hang > .che-nut:nth-of-type(2)').disabled`)))
    await click(win, '.che-hang > .che-nut:nth-of-type(2)'); await ngu(100)
    kiem('Che moi cho trung: che them 1 cho (email lap o dong 7)', (await soChe(win)) === 2 && (await trangThai(win)) === 'da-che-trung', await soChe(win))
    await click(win, '.che-hang > .che-nut:nth-of-type(2)'); await ngu(100)
    kiem('bam lan nua: khong con cho trung nao, khong che them', (await soChe(win)) === 2 && (await chay(win, `document.querySelector('.che-tt').textContent`)).length > 0)
    // Che theo DONG
    await click(win, '#undo'); await ngu(60); await click(win, '#undo'); await ngu(60)
    await chay(win, `document.querySelectorAll('.che-segnut')[1].click()`); await ngu(80)
    const soDong = await chay(win, `document.querySelectorAll('.che-hop').length`)
    kiem('che do Dong: khung theo dong (8 dong)', soDong === 8, soDong)
    await chay(win, `document.querySelectorAll('.che-hop')[1].click()`); await ngu(80)
    const dongRect = await maskRects(win, s)
    const gt2 = X.gt.find((g) => g.dong === 1)
    kiem('che ca dong 2: phu het chu email o dong do', phuChu(bmGoc, gt2, dongRect).trong === phuChu(bmGoc, gt2, dongRect).ink && (await soChe(win)) === 1)
    await click(win, '#undo'); await ngu(60)
    await chay(win, `document.querySelectorAll('.che-segnut')[0].click()`); await ngu(60)
    await click(win, '.che-hang > .che-nut:nth-of-type(1)'); await ngu(150)
    kiem('Tu che lai: du 6 cho', (await soChe(win)) === 6)

    // XONG -> anh xuat
    luuTheoWc.delete(win.webContents.id)
    await click(win, '.che-hang > .che-nut.chinh') // Xong (dong che do che)
    kiem('bam Xong cua thanh che chi dong che do, chua luu anh', !luuTheoWc.has(win.webContents.id))
    await click(win, '#xong')
    const luu = await cho(win, `true`) && await (async () => { for (let i = 0; i < 100 && !luuTheoWc.has(win.webContents.id); i++) await ngu(100); return luuTheoWc.get(win.webContents.id) })()
    kiem('luu anh: ghim gui anh da che ve main', !!luu)
    if (luu) {
      const ra = nativeImage.createFromDataURL(luu)
      const bmRa = bitmap(ra)
      kiem('anh xuat cung kich thuoc anh goc', bmRa.w === X.w && bmRa.h === X.h, bmRa.w + 'x' + bmRa.h)
      X.gt.forEach((g) => { const d = denDac(bmGoc, bmRa, g); kiem('anh XUAT: chu da mat (den dac): ' + g.loai + ' "' + g.text + '"', d.ink > 80 && d.con === 0, d.con + '/' + d.ink + ' diem chu con lai' + (d.con ? ' vet ' + d.vet.join(' ') + ' vung ' + [g.x0, g.y0, g.x1, g.y1] : '')) })
      const l0 = doiDong(bmGoc, bmRa, s, 0), l7 = doiDong(bmGoc, bmRa, s, 7)
      kiem('dong KHONG nhay cam (dong 1 va 8) y nguyen', l0 === 0 && l7 === 0, 'lech ' + l0 + ' + ' + l7 + ' diem')
      // doc chu LAI tren anh xuat
      const lai = await cheTMMain.docVungTu(nativeImage, ocr, ra, { x: 0, y: 0, w: bmRa.w, h: bmRa.h, sf: s })
      const conLai = lai.ok ? CT.timMuc(lai.dong) : null
      const vanBan = lai.ok ? lai.dong.map((l) => l.text).join('\n') : ''
      kiem('doc chu LAI anh xuat: 0 email / so dien thoai / so the / link', lai.ok && conLai.length === 0, lai.ok ? conLai.length + ' muc' : lai.loi)
      kiem('doc lai: khong con "gmail", "0912", "555", "4111", "example.com"', !/gmail|0912|555|4111|example\.com/i.test(vanBan), vanBan.replace(/\n/g, ' / ').slice(0, 160))
      kiem('doc lai: chu thuong van doc duoc (khong che nham)', /Nguy/.test(vanBan) && /2026/.test(vanBan))
    }
    win.destroy()
  }

  /* ── anh khong co gi de che ─────────────────────────────────────────────────────────────── */
  {
    console.log('\n[3b] Anh khong co gi de che (cau B): Tu che phai ra 0')
    const X = kho[S].B
    const win = await moGhim(X)
    await click(win, '#che-muc')
    await cho(win, `document.querySelector('.che-strip').dataset.trangThai === 'san-sang'`, 40000)
    kiem('thanh bao 0 muc', (await chay(win, `document.querySelector('.che-strip').dataset.soMuc`)) === '0', await chay(win, `document.querySelector('.che-tt').textContent`))
    await click(win, '.che-hang > .che-nut:nth-of-type(1)'); await ngu(120)
    kiem('bam Tu che: khong che gi, bao "khong thay" (khong-thay)', (await soChe(win)) === 0 && (await trangThai(win)) === 'khong-thay', await chay(win, `document.querySelector('.che-tt').textContent`))
    win.destroy()
  }

  /* ── [5] DOI CHUNG: che LECH ──────────────────────────────────────────────────────────────── */
  {
    console.log('\n[5] Doi chung: che lech 480 px (ra ngoai chu) thi phep do PHAI bat duoc')
    const X = kho[S].A
    const win = await moGhim(X)
    await click(win, '#che-muc')
    await cho(win, `document.querySelector('.che-strip').dataset.trangThai === 'san-sang'`, 40000)
    await click(win, '.che-hang > .che-nut:nth-of-type(1)'); await ngu(150)
    await chay(win, `shapes.forEach((s) => { if (s.che) { s.x1 += 480; s.x2 += 480 } })`)
    const rects = await maskRects(win, S)
    const bmGoc = bitmap(X.img)
    const pad = X.gt.map((g) => phuChu(bmGoc, g, rects))
    kiem('phep PHU bat duoc che lech (ca 6/6 muc truot)', pad.filter((p) => p.trong < p.ink).length === 6, pad.map((p) => p.trong + '/' + p.ink).join(' '))
    luuTheoWc.delete(win.webContents.id)
    await click(win, '#xong')
    for (let i = 0; i < 100 && !luuTheoWc.has(win.webContents.id); i++) await ngu(100)
    const ra = nativeImage.createFromDataURL(luuTheoWc.get(win.webContents.id))
    const bmRa = bitmap(ra)
    const con = X.gt.map((g) => denDac(bmGoc, bmRa, g).con)
    kiem('phep DEN DAC bat duoc che lech (ca 6/6 muc con chu)', con.filter((c) => c > 0).length === 6, con.join(' '))
    const lai = await cheTMMain.docVungTu(nativeImage, ocr, ra, { x: 0, y: 0, w: bmRa.w, h: bmRa.h, sf: S })
    const conLai = lai.ok ? CT.timMuc(lai.dong) : []
    kiem('phep DOC LAI bat duoc che lech (van doc ra >= 4 muc nhay cam)', conLai.length >= 4, conLai.length + ' muc')
    win.destroy()
  }

  /* ── [4] MAN CHUP THAT (overlay.js) ──────────────────────────────────────────────────────── */
  for (const s of [S]) {
    console.log('\n[4] Man chup that (overlay.js, khoanh vung gia lap), man ' + s * 100 + '%')
    const X = kho[s].A
    const W = Math.ceil(X.w / s) + 160, H = Math.ceil(X.h / s) + 160 // "man hinh": anh nam o (60,40) DIP
    const man = await (async () => { // ve ra "man hinh" co nen trang va anh X o lech (60,40)
      const c = await veAnh(DONG_A, s) // ve lai de co canvas moi, lay bitmap roi dan vao man
      const wr = new BrowserWindow({ show: false }); await wr.loadURL('about:blank')
      const url = await wr.webContents.executeJavaScript(`new Promise((res) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = Math.round(${W} * ${s}); c.height = Math.round(${H} * ${s}); const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, Math.round(60 * ${s}), Math.round(40 * ${s})); res(c.toDataURL('image/png')) }; im.src = ${JSON.stringify(c.img.toDataURL())} })`)
      wr.destroy()
      return nativeImage.createFromDataURL(url)
    })()
    const ox = Math.round(60 * s), oy = Math.round(40 * s)
    const win = new BrowserWindow({ show: false, width: W, height: H, useContentSize: true, frame: false, transparent: true,
      webPreferences: { preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false, backgroundThrottling: false } })
    fillTheoWc.set(win.webContents.id, { img: man })
    await win.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
    const sz = man.getSize()
    win.webContents.send('overlay:init', { origin: { x: 0, y: 0 }, lamMoKieu: 'mosaic' })
    win.webContents.send('overlay:frozen', { layers: [{ x: 0, y: 0, w: W, h: H, sf: s, key: '1/1', url: 'aioshot://frozen/1/1.jpg', px: 0, py: 0, pw: sz.width, ph: sz.height }] })
    await cho(win, `layersReady && frozenImg && frozenImg.naturalWidth > 0`)
    win.webContents.send('overlay:annotate', { x: 60, y: 40, w: X.w / s, h: X.h / s })
    await cho(win, `mode === 'annotate'`)
    kiem('man chup: thanh cong cu hien, nut Che thong minh trong menu xo cua nut Lam mo',
      await chay(win, `!!document.querySelector('#blur-nhom #blur-menu #che-muc') && document.querySelectorAll('#toolbar > .cong-cu[data-tool="che"]').length === 0`))
    await click(win, '#che-muc')
    kiem('bam nut: doc chu vung khoanh xong (san-sang)', await cho(win, `document.querySelector('.che-strip').dataset.trangThai === 'san-sang'`, 40000), await trangThai(win))
    kiem('thanh bao tim thay 6 muc', (await chay(win, `document.querySelector('.che-strip').dataset.soMuc`)) === '6')
    kiem('thanh dieu khien nam TRONG man hinh', await chay(win, `(() => { const r = document.querySelector('.che-strip').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight })()`))
    await click(win, '.che-hang > .che-nut:nth-of-type(1)'); await ngu(150)
    kiem('Tu che: che du 6 cho', (await soChe(win)) === 6)
    // toa do che (DIP cuc bo vung) -> pixel anh X
    const rects = await maskRects(win, s)
    const bmGoc = bitmap(X.img)
    X.gt.forEach((g, i) => { const p = phuChu(bmGoc, g, rects); kiem('man chup: toa do che phu HET chu ' + g.loai + ' "' + g.text + '"', p.ink > 80 && p.trong === p.ink, p.trong + '/' + p.ink) })
    await click(win, '#undo'); await ngu(80)
    const a = await soChe(win)
    await click(win, '#redo'); await ngu(80)
    kiem('man chup: Hoan tac 1 lan go ca nhom, Lam lai dua ve', a === 0 && (await soChe(win)) === 6)
    // Esc chi dong che do che
    await chay(win, `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`); await ngu(100)
    kiem('Esc: dong che do che, shape che con nguyen, man chup chua huy', (await chay(win, `document.querySelector('.che-strip').hidden`)) && (await soChe(win)) === 6)
    luuTheoWc.delete(win.webContents.id)
    await click(win, '#xong')
    for (let i = 0; i < 150 && !luuTheoWc.has(win.webContents.id); i++) await ngu(100)
    const p = luuTheoWc.get(win.webContents.id)
    kiem('Xong: man chup gui anh (dataUrl) da ghep lop che', !!(p && p.dataUrl), p && p.dataUrl ? 'dataUrl' : JSON.stringify(p || null).slice(0, 80))
    if (p && p.dataUrl) {
      const ra = nativeImage.createFromDataURL(p.dataUrl)
      const bmRa = bitmap(ra)
      kiem('anh xuat dung kich thuoc vung khoanh', Math.abs(bmRa.w - X.w) <= 1 && Math.abs(bmRa.h - X.h) <= 1, bmRa.w + 'x' + bmRa.h + ' / ' + X.w + 'x' + X.h)
      X.gt.forEach((g) => { const d = denDac(bmGoc, bmRa, g); kiem('man chup anh XUAT: chu da mat: ' + g.loai + ' "' + g.text + '"', d.ink > 80 && d.con === 0, d.con + '/' + d.ink) })
      kiem('man chup: dong 1 va 8 y nguyen', doiDong(bmGoc, bmRa, s, 0) === 0 && doiDong(bmGoc, bmRa, s, 7) === 0)
      const lai = await cheTMMain.docVungTu(nativeImage, ocr, ra, { x: 0, y: 0, w: bmRa.w, h: bmRa.h, sf: s })
      const conLai = lai.ok ? CT.timMuc(lai.dong) : null
      kiem('man chup: doc chu LAI anh xuat: 0 email / so dien thoai / so the / link', lai.ok && conLai.length === 0, lai.ok ? conLai.length + ' muc' : lai.loi)
      kiem('man chup: doc lai khong con gmail / 0912 / 4111', !/gmail|0912|4111/i.test(lai.dong.map((l) => l.text).join(' ')))
    }
    win.destroy()
  }

  /* ── ket qua ──────────────────────────────────────────────────────────────────────────────── */
  console.log('\nKET QUA: ' + (tong - truot) + ' DAT / ' + truot + ' TRUOT (' + tong + ' phep, ' + Math.round((Date.now() - t0) / 1000) + ' s)')
  ocr.tatHost()
  app.exit(truot ? 1 : 0)
})().catch((e) => { console.error('LOI bai do:', e); try { ocr.tatHost() } catch (x) {} app.exit(1) })
