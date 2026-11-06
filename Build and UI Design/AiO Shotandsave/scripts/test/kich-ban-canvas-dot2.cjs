'use strict'
/* Kich ban Canvas dot 2 (06/11) — main.js goi trong che do --thu-canvas khi co AIO_THU_KICHBAN (xem thuCanvas). Chay qua do-canvas-dot2.cjs.
   AIO_THU_PHA = 'trong'  : thu muc anh RONG -> man trong (the huong dan, tieu de to khong de len chu, nhan nut chup).
   AIO_THU_PHA = 'dung'   : co anh + khung -> loi 7 (anh sua ngoai app), loi 5 (xoa khung khong vao lich su), loi 4 (luu hong thi bao),
                            loi 3 (thu muc anh bien mat thi khong ghi de so, trang noi that). Cua so AN, userData rieng. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
const fs = require('fs')
const path = require('path')

module.exports = async ({ w, js, cho, kq, ra, anh }) => {
  const wc = w.webContents
  const { ipcMain } = require('electron')
  const kho = require('../../src/kho')
  const pha = process.env.AIO_THU_PHA || 'dung'
  const C = (kq.checks = [])
  const kiem = (ten, ok, ct) => C.push({ ten, ok: !!ok, ct: ct == null ? '' : String(ct).slice(0, 400) })
  const ev = (fn, ...a) => js('(' + fn.toString() + ')(' + a.map((x) => JSON.stringify(x === undefined ? null : x)).join(',') + ')')
  const SO = path.join(ra, 'userData', 'canvas', 'bo-cuc.json')
  const docSo = () => { try { return fs.readFileSync(SO, 'utf8') } catch (e) { return null } }
  const chuot = (type, x, y, mod) => wc.sendInputEvent({ type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1, modifiers: mod || [] })
  const bam = async (x, y) => { chuot('mouseMove', x, y); await cho(40); chuot('mouseDown', x, y); await cho(40); chuot('mouseUp', x, y); await cho(200) }
  const phim = async (keyCode, mod) => { wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mod || [] }); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mod || [] }); await cho(200) }
  await cho(1500)

  if (pha === 'trong') {
    // ---- man trong: the huong dan + nhan nut chup, o 3 be rong cua so ----
    const dem = { chup: 0 }
    ipcMain.on('canvas:chup', () => { dem.chup++ })
    const do1 = () => ev(() => {
      const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } }
      const hien = (e) => { if (!e || e.hidden) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01 && e.getBoundingClientRect().width > 0 }
      const q = (s) => document.querySelector(s)
      const giao = (a, b) => (a && b ? Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)) : 0)
      const the = r(q('#trong')), nhan = r(q('#chupNhan')), nut = r(q('.ntr')), tieu = r(q('#tieu'))
      const cacLop = ['.cong', '.ten', '.thanh', '.ntr']
      return {
        W: innerWidth, H: innerHeight,
        theHien: hien(q('#trong')), chu: q('#trongT').textContent + ' | ' + q('#trongM').textContent, nutTrong: q('#trongNut').textContent, nutTrongHien: hien(q('#trongNut')),
        tieuOpa: getComputedStyle(q('#tieu')).opacity, nhanChu: q('#chupNhan').textContent, nhanHien: hien(q('#chupNhan')),
        theTrongKhung: !!the && the.l >= 0 && the.t >= 0 && the.r <= innerWidth && the.b <= innerHeight,
        nhanTrongKhung: !!nhan && nhan.l >= 0 && nhan.t >= 0 && nhan.r <= innerWidth && nhan.b <= innerHeight,
        theChamLop: cacLop.map((s) => [s, Math.round(giao(the, r(q(s))))]).filter((x) => x[1] > 0),
        nhanChamLop: ['.cong', '.ten', '.thanh', '.ntr'].map((s) => [s, Math.round(giao(nhan, r(q(s))))]).filter((x) => x[1] > 0),
        tieuChamThe: Math.round(giao(tieu, the)),
      }
    })
    for (const [W, H] of [[1500, 900], [1280, 760], [1000, 700]]) {
      w.setContentSize(W, H); await cho(500)
      const m = await do1()
      const t = '[' + W + 'x' + H + '] '
      kiem(t + 'man trong: the huong dan hien, co tieu de + cau giai thich + nut "Chup mot tam"', m.theHien && m.chu.includes('Canvas đang trống') && m.nutTrongHien && m.nutTrong === 'Chụp một tấm', JSON.stringify(m.chu) + ' / ' + m.nutTrong)
      kiem(t + 'tieu de CHU TO tu an (khong de len chu huong dan)', m.tieuOpa === '0', 'opacity ' + m.tieuOpa)
      kiem(t + 'the huong dan nam tron trong cua so va khong cham thanh cong cu / tieu de / thanh nut / nut tron', m.theTrongKhung && m.theChamLop.length === 0, JSON.stringify(m.theChamLop))
      kiem(t + 'nut tron goc duoi-phai CO NHAN "Chup them", nam tron trong cua so, khong de len thanh nut / tieu de / thanh cong cu', m.nhanHien && m.nhanChu === 'Chụp thêm' && m.nhanTrongKhung && m.nhanChamLop.length === 0, JSON.stringify([m.nhanChu, m.nhanTrongKhung, m.nhanChamLop]))
    }
    if (process.env.AIO_DOT2_ANH_RA) { try { w.setContentSize(1500, 900); await cho(400); fs.writeFileSync(process.env.AIO_DOT2_ANH_RA, (await wc.capturePage()).toPNG()) } catch (e) { kq.loiChup = e.message } }   // chi de nguoi xem mat: AIO_DOT2_ANH_RA=<file.png>
    // doi chung: bo class "rong" (nhu truoc khi sua) -> tieu de to HIEN LAI va de len the => cai thuoc do co bat duoc dung loi trong anh chup
    await ev(() => { document.body.classList.remove('rong') }); await cho(200)
    const cu = await do1()
    kiem('DOI CHUNG: neu tieu de to van hien (nhu ban cu) thi no DE LEN the huong dan (do duoc > 0 px2)', cu.tieuOpa === '1' && cu.tieuChamThe > 0, 'opacity ' + cu.tieuOpa + ' giao ' + cu.tieuChamThe)
    await ev(() => { document.body.classList.add('rong') }); await cho(100)
    // bam that vao nut "Chup mot tam" va nut tron
    const toa = await ev(() => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } }; return { nut: r('#trongNut'), tron: r('#chup') } })
    await bam(toa.nut.x, toa.nut.y)
    kiem('Bam nut "Chup mot tam" trong the huong dan -> gui lenh chup (canvas:chup)', dem.chup === 1, 'dem ' + dem.chup)
    await bam(toa.tron.x, toa.tron.y)
    kiem('Bam nut tron goc duoi-phai -> cung gui lenh chup', dem.chup === 2, 'dem ' + dem.chup)
    return
  }

  // ======================= pha 'dung' =======================
  const st = () => ev(() => {
    const X = window.__cv.X, b = document.getElementById('bao'), t = document.getElementById('trong')
    return { khung: X.khung.map((k) => ({ id: k.id, ten: k.ten, x: k.x, y: k.y })), vat: X.vat.length, soLui: X.soLui(), bao: b.classList.contains('hien') ? b.textContent : '', trongHien: !t.hidden, trongChu: [...t.children].filter((c) => !c.hidden).map((c) => c.textContent).join(' | '),
      mucs: X.mucs.map((m) => m.khoa), src: Object.fromEntries([...document.querySelectorAll('.o[data-khoa] img.anh')].map((i) => [i.closest('.o').dataset.khoa, i.getAttribute('src')])) }
  })
  const lamMoi = async () => { await ev(() => window.__cv.X.lamMoiNgay()); await cho(500) }

  // ---- Loi 7: anh sua ngoai app -> phan tu dang co phai doi src va hien anh moi ----
  const ps = await st()
  /* mau that cua anh DANG hien tren bang: nap lai dung duong dan (src) ma phan tu dang dung, qua protocol co CORS, doc 1 diem */
  const pixel = (khoa) => ev((khoa) => new Promise((res) => {
    const goc = document.querySelector('.o[data-khoa="' + khoa + '"] img.anh'); if (!goc) return res(null)
    const im = new Image(); im.crossOrigin = 'anonymous'
    im.onload = () => { try { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 4, 4); const d = g.getImageData(2, 2, 1, 1).data; res([d[0], d[1], d[2]]) } catch (e) { res('loi ' + e.message) } }
    im.onerror = () => res('khong nap duoc')
    im.src = goc.getAttribute('src')
    setTimeout(() => res('het gio'), 4000)
  }), khoa)
  const cu = await pixel('c.png')
  const zlib = require('zlib')
  const crc = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return (b) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 } })()
  const png = (r, g, b) => { const W = 8, H = 6, hang = Buffer.alloc(1 + W * 3); for (let i = 0; i < W; i++) { hang[1 + i * 3] = r; hang[2 + i * 3] = g; hang[3 + i * 3] = b }
    const khoi = (ten, d) => { const dai = Buffer.alloc(4); dai.writeUInt32BE(d.length); const th = Buffer.concat([Buffer.from(ten), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(th)); return Buffer.concat([dai, th, c]) }
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), khoi('IHDR', ihdr), khoi('IDAT', zlib.deflateSync(Buffer.concat(Array(H).fill(hang)))), khoi('IEND', Buffer.alloc(0))]) }
  const fC = path.join(anh, 'c.png'), tam = fC + '.ngoai'
  fs.writeFileSync(tam, png(250, 30, 30)); fs.renameSync(tam, fC); const g = new Date(Date.now() + 20000); fs.utimesSync(fC, g, g)   // editor ngoai luu: file moi doi ten de len, doi gio
  await lamMoi(); await cho(500)
  const moi = await pixel('c.png'), ps2 = await st()
  kiem('Loi 7: anh c.png bi sua ngoai app -> duong dan anh tren bang DOI (kem gio moi)', ps.src['c.png'] && ps2.src['c.png'] && ps.src['c.png'] !== ps2.src['c.png'], ps.src['c.png'] + ' -> ' + ps2.src['c.png'])
  kiem('Loi 7: va tam anh tren bang HIEN MAU MOI (do + canvas), khong phai mau cu', Array.isArray(moi) && moi[0] > 190 && moi[1] < 90 && Array.isArray(cu) && !(cu[0] > 190 && cu[1] < 90), JSON.stringify(cu) + ' -> ' + JSON.stringify(moi))

  // ---- Loi 4: luu hong thi bao tren man + khong mat ghi chu ----
  const renameGoc = fs.renameSync
  fs.renameSync = (a, b) => { if (String(b).endsWith('bo-cuc.json')) { const e = new Error('ENOSPC gia lap'); e.code = 'ENOSPC'; throw e } return renameGoc(a, b) }
  try {
    await ev(() => { const X = window.__cv.X; document.getElementById('bao').classList.remove('hien'); X.vat = [{ id: 'gc1', loai: 'ghi', x: 5, y: 5, w: 160, h: 120, mau: '#ffe27a', chu: 'GHI CHU QUAN TRONG', tao: 1 }]; X.luuDoc() })
    await cho(600)
    const b1 = await st()
    kiem('Loi 4: luu hong (o day / mat quyen ghi) -> nguoi dung THAY thong bao tren man', /Chưa lưu được/.test(b1.bao), b1.bao)
    await lamMoi()
    const b2 = await st()
    kiem('Loi 4: lam moi trong luc o van loi -> ghi chu vua go KHONG bi doc lai tu so cu de mat', b2.vat === 1, 'vat ' + b2.vat)
  } finally { fs.renameSync = renameGoc }
  await lamMoi()
  let dia = null; try { dia = JSON.parse(docSo()) } catch (e) {}
  kiem('Loi 4: o het loi -> Canvas tu ghi lai, so tren dia co ghi chu', !!dia && dia.vat && dia.vat.length === 1 && dia.vat[0].chu === 'GHI CHU QUAN TRONG', dia && dia.vat && dia.vat.length)
  await ev(() => { const X = window.__cv.X; X.vat = []; X.luuDoc() }); await cho(300)

  // ---- Loi 3: thu muc anh bien mat -> khong ghi de so, trang khong noi "Canvas trong" ----
  const soTruoc = docSo(), kBefore = (await st()).khung
  kho.ghiCauHinh({ thuMucAnh: path.join(ra, 'o-bi-ngat') })
  await lamMoi()
  const m3 = await st()
  kiem('Loi 3: thu muc anh khong doc duoc -> so bo-cuc.json KHONG doi mot byte', docSo() === soTruoc && !!soTruoc)
  kiem('Loi 3: trang noi dung su that ("Khong doc duoc thu muc anh"), khong noi "Canvas dang trong"', m3.trongHien && /Không đọc được thư mục ảnh/.test(m3.trongChu) && !/Canvas đang trống/.test(m3.trongChu), m3.trongChu)
  kho.ghiCauHinh({ thuMucAnh: anh })
  await lamMoi()
  const m3b = await st()
  kiem('Loi 3: cam lai thu muc -> khung cu va anh tro lai dung cho', m3b.khung.length === kBefore.length && kBefore.every((k) => m3b.khung.some((x) => x.id === k.id && x.x === k.x && x.y === k.y)) && !m3b.trongHien, JSON.stringify(m3b.khung))

  // ---- Loi 5: xoa khung khong dua vao lich su; noi ro truoc + sau khi xoa ----
  const truocXoa = await st()
  const kh = truocXoa.khung.find((k) => k.ten === 'Nhóm sẵn')
  await ev((id) => { window.__cv.X.xoaKhung(id) }, kh.id); await cho(300)
  const b5 = await st()
  kiem('Loi 5: bam xoa lan 1 -> canh bao NOI RO khong hoan tac duoc, khung chua bi xoa', /KHÔNG hoàn tác được/.test(b5.bao) && b5.khung.some((k) => k.id === kh.id), b5.bao)
  await ev((id) => { window.__cv.X.xoaKhung(id) }, kh.id); await cho(900)
  const b6 = await st()
  kiem('Loi 5: bam lan 2 -> khung + thu muc mat, anh goc b.png con, so buoc hoan tac KHONG tang', !b6.khung.some((k) => k.id === kh.id) && !fs.existsSync(path.join(anh, 'Nhóm sẵn')) && fs.existsSync(path.join(anh, 'b.png')) && b6.soLui === truocXoa.soLui, 'soLui ' + truocXoa.soLui + ' -> ' + b6.soLui)
  kiem('Loi 5: sau khi xoa nguoi dung duoc bao "khong hoan tac duoc"', /Không hoàn tác được/.test(b6.bao), b6.bao)
  await phim('Z', ['control']); await cho(500)
  const b7 = await st()
  kiem('Loi 5: Ctrl+Z sau khi xoa khung -> khung KHONG hien lai nua voi (khong hua lan), khong loi', !b7.khung.some((k) => k.id === kh.id) && !fs.existsSync(path.join(anh, 'Nhóm sẵn')), JSON.stringify(b7.khung.map((k) => k.ten)))
}
