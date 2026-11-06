'use strict'
/* Tien trinh Electron cua bai do MAN SUA VIDEO (goi tu do-sua-video-ui.cjs). Mo CHINH man src/sua-video (cua so AN: chiAn = true,
   KHONG hien len man hinh), dung video thu da tao boi test:suavideo (copy sang thu muc rieng vi file xuat nam canh nguon),
   thao tac bang SU KIEN THAT cua Chromium (sendInputEvent: chuot / phim), doc lai giao dien + canvas bang JS. Ghi ket-qua.json. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { require('fs').appendFileSync(process.env.AIO_UI_RA + '/loi.txt', String(e && e.stack) + '\n') } catch (x) {} })
const { app, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const GOC = path.resolve(__dirname, '..', '..')
const RA = process.env.AIO_UI_RA
const NGUON = process.env.AIO_UI_NGUON
const LANG = process.env.AIO_LANG === 'en' ? 'en' : 'vi'
app.setName('aio-do-sua-video-ui')
app.setPath('userData', path.join(RA, 'userData'))
app.on('window-all-closed', () => {})
ipcMain.on('i18n:lang', (e) => { e.returnValue = LANG })

const suaVideo = require(path.join(GOC, 'src', 'sua-video.js'))
const nhatKy = []
const IDA = 'vid-20260101-000000-001', IDB = 'vid-20260101-000000-002'
const ban = {
  [IDA]: { id: IDA, file: path.join(RA, 'ui-ma.mp4'), ms: 0, w: 640, h: 360, tieng: true },
  [IDB]: { id: IDB, file: path.join(RA, 'ui-quad.mp4'), ms: 0, w: 640, h: 360, tieng: false },
}
suaVideo.khoiTao({ ghiLog: (m) => nhatKy.push(m), moiDesktop: () => {}, tim: (id) => ban[id] || null, keoAnToan: (f) => f, chiAn: true })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  const kq = { lang: LANG, electron: process.versions.electron, nhatKy, buoc: {} }
  try {
    for (const f of fs.readdirSync(RA)) { if (/\.(mp4|tam|json)$/.test(f) && f !== 'ket-qua.json') { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} } }
    fs.copyFileSync(path.join(NGUON, 'nguon-ma.mp4'), ban[IDA].file)
    fs.copyFileSync(path.join(NGUON, 'nguon-quad.mp4'), ban[IDB].file)
    fs.copyFileSync(path.join(NGUON, 'nguon-quad.contro.json'), path.join(RA, 'ui-quad.contro.json'))
    const crypto = require('crypto')
    const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')
    kq.md5Truoc = { 'ui-ma.mp4': md5(ban[IDA].file), 'ui-quad.mp4': md5(ban[IDB].file) }

    const moVaDoi = async (id) => {
      suaVideo.moCuaSo(id)
      const w = suaVideo.cuaSoHienTai()
      if (!w) throw new Error('khong mo duoc cua so')
      const js = (code) => w.webContents.executeJavaScript(code)
      const han = Date.now() + 15000
      while (Date.now() < han) { if (await js('!!document.getElementById("ten-file") && document.getElementById("ten-file").textContent.length > 0 && !!document.getElementById("cv") && document.getElementById("cv").width > 2').catch(() => false)) break; await cho(150) }
      await cho(400)
      return { w, js }
    }

    // ---------- A: video co tieng, KHONG co file phu con tro ----------
    let { w, js } = await moVaDoi(IDA)
    const doc = (js) => js(`(() => { const g = (id) => document.getElementById(id); const hien = (id) => !g(id).hidden;
      return JSON.stringify({ tieuDe: g('title').textContent, ten: g('ten-file').textContent, cv: [g('cv').width, g('cv').height],
        nhanDoan: g('nhan-doan').textContent, mocTu: g('moc-tu').textContent, mocDen: g('moc-den').textContent, gioHien: g('gio-hien').textContent,
        tayDau: g('tay-dau').style.left, tayCuoi: g('tay-cuoi').style.left,
        mucTieng: hien('muc-tieng'), tieng: [...document.querySelectorAll('#nhom-tieng .chon-nut')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '')),
        zoom: [...document.querySelectorAll('#nhom-zoom .chon-nut')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '') + (b.disabled ? '(khoa)' : '')),
        ghiZoom: g('ghi-zoom').textContent, nutXuat: g('nut-xuat').textContent, nutXuatKhoa: g('nut-xuat').disabled, nutPhat: g('nut-phat').textContent }) })()`).then(JSON.parse)
    kq.buoc.A0 = await doc(js)

    // bo cuc o nhieu co cua so: khong tran ngang, moi nut/the nam trong cua so
    const boCuc = (js) => js(`(() => { const rs = [];
      for (const sel of ['#tieu-de', '#xem', '#phat-hang', '#tl', '#tl-moc', '#cot-chon', '.muc:not([hidden])', '#chan', '#nut-xuat', '#nut-phat', '.chon-nut', '.tay']) for (const el of document.querySelectorAll(sel)) { const r = el.getBoundingClientRect(); if (r.width === 0) continue; rs.push({ sel, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), cuon: el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' }) }
      return JSON.stringify({ rongTrang: document.documentElement.scrollWidth, rong: window.innerWidth, cao: window.innerHeight, ngoai: rs.filter(x => x.l < -1 || x.r > window.innerWidth + 1).map(x => x.sel + ':' + x.l + '-' + x.r), chongNut: (() => { const bs = [...document.querySelectorAll('.nut,.chon-nut')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()); let n = 0; for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) n++ } return n })() }) })()`).then(JSON.parse)
    kq.boCuc = {}
    for (const [W, H] of [[720, 560], [900, 700], [1100, 780]]) {
      w.setContentSize(W, H); await cho(500)
      kq.boCuc[W + 'x' + H] = await boCuc(js)
    }
    w.setContentSize(980, 760); await cho(500)

    // tuong phan chu (WCAG) cho cac loai chu chinh
    kq.tuongPhan = await js(`(() => {
      const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]) }
      const nen = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) return c } return 'rgb(24,24,24)' }
      const tp = (el) => { const a = lum(getComputedStyle(el).color), b = lum(nen(el)); return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2) }
      const o = {}
      for (const [k, sel] of Object.entries({ tieuDe: '#title', tenFile: '#ten-file', gioHien: '#gio-hien', nhanDoan: '#nhan-doan', mocTu: '#moc-tu', goiYCat: '#goi-y-cat', mucDau: '.muc-dau', chonNutThuong: '#nhom-zoom .chon-nut:not(.active)', chonNutChon: '#nhom-zoom .chon-nut.active', ghiChu: '#ghi-zoom', nutXuat: '#nut-xuat', nutPhat: '#nut-phat' })) { const el = document.querySelector(sel); if (el) o[k] = tp(el) }
      return JSON.stringify(o) })()`).then(JSON.parse)

    // keo tay nam BANG CHUOT THAT: tay dau -> 25%, tay cuoi -> 75%
    const toaDo = (sel) => js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }) })()`).then(JSON.parse)
    const rayTl = await js(`(() => { const r = document.getElementById('tl').getBoundingClientRect(); return JSON.stringify({ l: r.left, w: r.width, y: r.top + r.height / 2 }) })()`).then(JSON.parse)
    const chuot = async (type, x, y) => { w.webContents.sendInputEvent({ type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 }); await cho(40) }
    const keoTay = async (sel, phanTram) => {
      const p = await toaDo(sel)
      await chuot('mouseMove', p.x, p.y); await chuot('mouseDown', p.x, p.y)
      const dich = rayTl.l + rayTl.w * phanTram
      for (let i = 1; i <= 8; i++) await chuot('mouseMove', p.x + (dich - p.x) * i / 8, p.y)
      await chuot('mouseUp', dich, p.y); await cho(300)
    }
    w.webContents.focus()
    await keoTay('#tay-dau', 0.25)
    kq.buoc.A1 = await doc(js)
    await keoTay('#tay-cuoi', 0.75)
    kq.buoc.A2 = await doc(js)
    // keo tay dau vuot qua tay cuoi: bi kep (doan >= 0,5 s)
    await keoTay('#tay-dau', 0.95)
    kq.buoc.A3 = await doc(js)
    await keoTay('#tay-dau', 0.25)
    // nen: bam 'Chuyen sac' roi doc diem goc cua canvas xem truoc (goc tren-trai = dau chuyen sac)
    const bamNut = async (sel) => { const p = await toaDo(sel); await chuot('mouseMove', p.x, p.y); await chuot('mouseDown', p.x, p.y); await chuot('mouseUp', p.x, p.y); await cho(400) }
    const bamNhanh = async (sel) => { const p = await toaDo(sel); await chuot('mouseMove', p.x, p.y); await chuot('mouseDown', p.x, p.y); await chuot('mouseUp', p.x, p.y) }
    const diem = (x, y) => js(`(() => { const c = document.getElementById('cv'); const d = c.getContext('2d').getImageData(${x}, ${y}, 1, 1).data; return JSON.stringify([d[0], d[1], d[2]]) })()`).then(JSON.parse)
    kq.buoc.nenTruoc = await diem(2, 2)
    await bamNut('#nhom-nen .chon-nut[data-v="chuyen"]')
    kq.buoc.nenSau = await diem(2, 2)
    kq.buoc.nenNut = await js(`[...document.querySelectorAll('#nhom-nen .chon-nut')].map((b) => b.textContent + (b.classList.contains('active') ? '*' : '')).join(' | ')`)
    kq.buoc.nenPanel = await js(`JSON.stringify({ mau: !document.getElementById('mau-chon').hidden, soMau: document.querySelectorAll('#mau-chon .o-mau').length, thanh: !document.getElementById('thanh-nen').hidden })`).then(JSON.parse)
    kq.boCuc.cungNen = await boCuc(js)
    const pMau = await toaDo('#mau-chon .o-mau:nth-child(2)')
    kq.buoc.mauPhanTu = await js(`(() => { const e = document.elementFromPoint(${pMau.x}, ${pMau.y}); return e ? e.className + '|' + e.tagName + '|' + e.disabled : 'null' })()`)
    await bamNut('#mau-chon .o-mau:nth-child(2)')
    kq.buoc.mauActive = await js(`[...document.querySelectorAll('#mau-chon .o-mau')].map((b) => b.classList.contains('active') ? 1 : 0).join('')`)
    kq.buoc.nenGd2 = await diem(2, 2)
    try { fs.writeFileSync(path.join(RA, 'anh-man-nen.png'), (await w.webContents.capturePage()).toPNG()) } catch (e) {}
    // tieng: bam Khong tieng
    await bamNut('#nhom-tieng .chon-nut[data-v="khong"]')
    kq.buoc.tiengKhong = await js(`JSON.stringify({ muted: false, nut: [...document.querySelectorAll('#nhom-tieng .chon-nut')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '')) })`).then(JSON.parse)

    // xuat BANG NUT THAT: tien do + khoa giao dien + ket qua. A co tieng nhung chon Khong tieng
    await bamNhanh('#nut-xuat')
    await cho(60)
    kq.buoc.dangXuat = await js(`JSON.stringify({ xuatKhoa: document.getElementById('nut-xuat').disabled, huyHien: !document.getElementById('nut-huy').hidden, tienDo: !document.getElementById('tien-do').hidden, chonKhoa: [...document.querySelectorAll('.muc .chon-nut')].every(b => b.disabled), tayKhoa: [...document.querySelectorAll('.tay')].every(b => b.disabled), trangThai: document.getElementById('trang-thai').textContent })`).then(JSON.parse)
    const han = Date.now() + 40000
    while (Date.now() < han && await js('document.getElementById("ket-qua").hidden')) await cho(200)
    kq.buoc.ketQua = await js(`JSON.stringify({ hien: !document.getElementById('ket-qua').hidden, ten: document.getElementById('kq-ten').textContent, chu: document.getElementById('kq-chu').textContent, xuatKhoa: document.getElementById('nut-xuat').disabled, huyHien: !document.getElementById('nut-huy').hidden, keoNhan: document.getElementById('kq-keo').textContent })`).then(JSON.parse)
    kq.buoc.fileMoi = fs.readdirSync(RA).filter((f) => /da-sua/.test(f))

    // huy giua chung: xuat lan 2 roi bam HUY that -> khong co file moi, giao dien mo lai
    const truoc = fs.readdirSync(RA).filter((f) => /da-sua/.test(f)).length
    await bamNhanh('#nut-xuat'); await cho(60)
    kq.buoc.huyDangXuat = await js(`!document.getElementById('nut-huy').hidden`)
    await bamNhanh('#nut-huy'); await cho(1200)
    kq.buoc.huy = await js(`JSON.stringify({ xuatKhoa: document.getElementById('nut-xuat').disabled, huyHien: !document.getElementById('nut-huy').hidden, toast: document.getElementById('toast').textContent, trangThai: document.getElementById('trang-thai').textContent })`).then(JSON.parse)
    kq.buoc.huyFile = { truoc, sau: fs.readdirSync(RA).filter((f) => /da-sua/.test(f)).length, tam: fs.readdirSync(RA).filter((f) => /\.tam$/.test(f)) }

    // ---------- B: video khong tieng, CO file phu con tro: tu phong to ----------
    ;({ w, js } = await moVaDoi(IDB))
    w.webContents.focus()
    kq.buoc.B0 = await doc(js)
    const toaDoB = async (sel) => { const r = await js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }) })()`); return JSON.parse(r) }
    const bamB = async (sel) => { const p = await toaDoB(sel); w.webContents.sendInputEvent({ type: 'mouseMove', x: p.x, y: p.y }); await cho(40); for (const type of ['mouseDown', 'mouseUp']) { w.webContents.sendInputEvent({ type, x: p.x, y: p.y, button: 'left', clickCount: 1 }); await cho(40) } await cho(400) }
    const tlBam = async (giay, dur) => {
      const r = await js(`(() => { const r = document.getElementById('tl').getBoundingClientRect(); return JSON.stringify({ l: r.left, w: r.width, y: r.top + r.height / 2 }) })()`).then(JSON.parse)
      const x = r.l + r.w * (giay / dur)
      w.webContents.sendInputEvent({ type: 'mouseMove', x: Math.round(x), y: Math.round(r.y) }); await cho(30)
      w.webContents.sendInputEvent({ type: 'mouseDown', x: Math.round(x), y: Math.round(r.y), button: 'left', clickCount: 1 }); await cho(30)
      w.webContents.sendInputEvent({ type: 'mouseUp', x: Math.round(x), y: Math.round(r.y), button: 'left', clickCount: 1 }); await cho(500)
    }
    const durB = kq.buoc.B0.mocDen // "0:09.0"
    const m = /^(\d+):(\d+)[.,](\d)$/.exec(durB); const giayB = +m[1] * 60 + +m[2] + (+m[3]) / 10
    kq.giayB = giayB
    const dPx = (c) => (c[0] > 150 && c[1] < 90 && c[2] < 90 ? 'do' : c[1] > 150 && c[0] < 90 && c[2] < 90 ? 'xanh la' : c[2] > 150 && c[0] < 90 ? 'xanh duong' : c[0] > 150 && c[1] > 150 ? 'vang' : '?')
    const cvW = kq.buoc.B0.cv[0], cvH = kq.buoc.B0.cv[1]
    await tlBam(2.5, giayB)
    kq.buoc.zoomTatDiem = await diem(Math.round(cvW * 0.7), Math.round(cvH * 0.3)) // goc tren-phai khi KHONG zoom = xanh la
    await bamB('#nhom-zoom .chon-nut[data-v="vua"]')
    kq.buoc.zoomVuaDiem = await diem(Math.round(cvW * 0.7), Math.round(cvH * 0.3)) // khi zoom vao goc tren-trai: diem do duoc keo vao = do
    kq.buoc.B1 = await doc(js)
    await bamB('#nhom-zoom .chon-nut[data-v="tat"]')
    kq.buoc.zoomLaiTat = await diem(Math.round(cvW * 0.7), Math.round(cvH * 0.3))
    await bamB('#nhom-zoom .chon-nut[data-v="manh"]')
    await tlBam(7.0, giayB)
    kq.buoc.zoomManhVang = await diem(Math.round(cvW * 0.5), Math.round(cvH * 0.5))
    try { fs.writeFileSync(path.join(RA, 'anh-man-zoom.png'), (await w.webContents.capturePage()).toPNG()) } catch (e) {}
    // xuat B co zoom manh, cat 1 - 8 s: kiem file bang ffprobe o phia driver
    await tlBam(0.2, giayB)
    await bamB('#nut-xuat')
    const han2 = Date.now() + 40000
    while (Date.now() < han2 && await js('document.getElementById("ket-qua").hidden')) await cho(200)
    kq.buoc.ketQuaB = await js(`JSON.stringify({ hien: !document.getElementById('ket-qua').hidden, ten: document.getElementById('kq-ten').textContent })`).then(JSON.parse)
    kq.buoc.fileMoiB = fs.readdirSync(RA).filter((f) => /ui-quad-da-sua/.test(f))
    kq.md5Sau = { 'ui-ma.mp4': md5(ban[IDA].file), 'ui-quad.mp4': md5(ban[IDB].file) }
    kq.cuoi = 'xong'
  } catch (e) { kq.loi = String((e && e.stack) || e) }
  try { fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 1)) } catch (e) {}
  app.exit(0)
})
