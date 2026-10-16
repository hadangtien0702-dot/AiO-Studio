'use strict'
/* Kich ban DO Canvas kieu FigJam / Miro (12/10) — main.js goi trong che do --thu-canvas khi co AIO_THU_KICHBAN (xem thuCanvas).
   Bam / go / keo bang sendInputEvent (di qua duong nhap lieu that cua Chromium), cua so AN, userData rieng. Ket qua nam trong kq.checks.
   Pha 1 (AIO_THU_PHA=1): thao tac. Pha 2 (AIO_THU_PHA=2): mo lai app tren CUNG userData, kiem tra thu da luu con nguyen. */
const fs = require('fs')
const path = require('path')

module.exports = async ({ w, js, cho, kq, ra, anh, keoRa }) => {
  const wc = w.webContents
  const { clipboard, nativeImage } = require('electron')
  const pha = process.env.AIO_THU_PHA || '1'
  const C = (kq.checks = [])
  const kiem = (ten, ok, ct) => C.push({ ten, ok: !!ok, ct: ct == null ? '' : String(ct).slice(0, 500) })
  const ev = (fn, ...a) => js('(' + fn.toString() + ')(' + a.map((x) => JSON.stringify(x === undefined ? null : x)).join(',') + ')')
  const SO = path.join(ra, 'userData', 'canvas', 'bo-cuc.json')
  const doc = () => { try { return JSON.parse(fs.readFileSync(SO, 'utf8')) } catch (e) { return null } }
  const chup = async (ten) => { try { fs.writeFileSync(path.join(ra, ten), (await wc.capturePage()).toPNG()) } catch (e) { kq.loiChup = e.message } }
  const chuot = (type, x, y, mod) => wc.sendInputEvent({ type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1, modifiers: mod || [] })
  const bam = async (x, y, mod) => { chuot('mouseMove', x, y, mod); await cho(30); chuot('mouseDown', x, y, mod); await cho(30); chuot('mouseUp', x, y, mod); await cho(140) }
  const keo = async (x0, y0, x1, y1, mod) => {
    chuot('mouseMove', x0, y0, mod); await cho(30); chuot('mouseDown', x0, y0, mod); await cho(30)
    for (let i = 1; i <= 8; i++) { chuot('mouseMove', x0 + (x1 - x0) * i / 8, y0 + (y1 - y0) * i / 8, ['leftButtonDown'].concat(mod || [])); await cho(22) }
    chuot('mouseUp', x1, y1, mod); await cho(260)
  }
  const phim = async (keyCode, mod) => { wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mod || [] }); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mod || [] }); await cho(140) }
  const go = async (s) => { for (const c of s) { wc.sendInputEvent({ type: 'char', keyCode: c }); await cho(12) } await cho(80) }
  const st = () => ev(() => {
    const X = window.__cv.X, b = document.getElementById('bao')
    return {
      tool: X.tool, V: { x: X.V.x, y: X.V.y, s: X.V.s }, sel: [...X.sel], z: X.z, khoa: X.khoaMap,
      vat: JSON.parse(JSON.stringify(X.vat)), noi: JSON.parse(JSON.stringify(X.noi)), net: X.net.map((n) => ({ id: n.id, loai: n.loai, n: n.pts.length, mau: n.mau })),
      khung: X.khung.map((k) => ({ id: k.id, ten: k.ten, x: k.x, y: k.y, w: k.w, h: k.h, mau: k.mau })),
      mucs: X.mucs.map((m) => ({ khoa: m.khoa, x: m.x, y: m.y, w: m.w, h: m.h, khung: m.khung, kieu: m.kieu, chiTrongKhung: !!m.chiTrongKhung })),
      sua: !!(document.activeElement && document.activeElement.isContentEditable), bao: b.classList.contains('hien') ? b.textContent : '',
      mo: document.querySelectorAll('.o.mo').length, oTong: document.querySelectorAll('.o').length, vMo: document.querySelectorAll('.v.mo').length,
      nguHien: !document.getElementById('ngu').hidden, banDoHien: !document.getElementById('banDoHop').hidden,
    }
  })
  const dat = (bx, by, sx, sy, s) => ev((bx, by, sx, sy, s) => { const X = window.__cv.X; X.V.s = s; X.V.x = sx - bx * s; X.V.y = sy - by * s; X.datNhin() }, bx, by, sx, sy, s || 1)
  const rectEl = (sel) => ev((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, t: r.top, w: r.width, h: r.height } }, sel)
  const manHinh = (s, r) => ({ x: s.V.x + (r.x + r.w / 2) * s.V.s, y: s.V.y + (r.y + r.h / 2) * s.V.s })
  const dsFile = () => fs.readdirSync(anh).filter((t) => fs.statSync(path.join(anh, t)).isFile()).sort()
  const pngNho = fs.readFileSync(path.join(anh, 'a.png'))
  const bamNut = async (a) => { const r = await rectEl('[data-a="' + a + '"]'); if (!r) return false; await bam(r.x, r.y); return true }

  await cho(1500)

  // ======================= PHA 2: mo lai =======================
  if (pha === '2') {
    const tuPha1 = JSON.parse(fs.readFileSync(path.join(ra, 'pha1.json'), 'utf8'))
    const s = await st()
    kiem('PHA 2 (mo lai app): ghi chu / chu / hinh / link con du, dung id + noi dung', JSON.stringify(s.vat.map((v) => [v.id, v.loai, v.chu, v.url || ''])) === JSON.stringify(tuPha1.vat), s.vat.length + ' vat')
    kiem('PHA 2: mui ten + net ve con du', s.noi.length === tuPha1.noi && s.net.length === tuPha1.net, s.noi.length + ' noi, ' + s.net.length + ' net')
    kiem('PHA 2: khoa + lop con nguyen', JSON.stringify(s.khoa) === JSON.stringify(tuPha1.khoa) && JSON.stringify(s.z) === JSON.stringify(tuPha1.z), JSON.stringify(s.khoa))
    kiem('PHA 2: mau khung da doi con nguyen', s.khung.find((k) => k.id === tuPha1.khungMau.id).mau === tuPha1.khungMau.mau, s.khung.map((k) => k.mau).join())
    const nDom = await ev(() => ({ v: document.querySelectorAll('.v').length, vId: [...document.querySelectorAll('.v')].map((e) => e.dataset.id), kich: innerWidth + 'x' + innerHeight }))
    kiem('PHA 2: so vat ve tren man hinh khop state', nDom.v === s.vat.length, 'dom ' + nDom.v + ' / state ' + s.vat.length + ' ' + nDom.kich)
    await chup('pha2.png')
    return
  }

  // ======================= PHA 1 =======================
  let s = await st()
  const anhGoc = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png']
  const goc0 = anhGoc.map((t) => t + ':' + fs.readFileSync(path.join(anh, t)).length).join('|')
  const b0 = await ev(() => { const X = window.__cv.X; return X.hopTong([...X.mucs, ...X.khung]) })
  const P0 = { x: b0.x + b0.w + 140, y: b0.y + 60 }          // vung trong ben phai moi thu
  await dat(P0.x, P0.y, 300, 200, 1)

  // --- 1. cong cu + phim tat ---
  await phim('n'); s = await st()
  kiem('Phim N chon cong cu Ghi chu (nut sang theo)', s.tool === 'ghi' && (await ev(() => document.querySelector('[data-cc="ghi"]').classList.contains('dang'))), s.tool)
  await bam(300, 200); s = await st()
  const ghi = s.vat[s.vat.length - 1]
  kiem('Bam vao bang trong -> ghi chu moi (168x168), vao thang che do go chu, cong cu tro ve Chon', !!ghi && ghi.loai === 'ghi' && ghi.w === 168 && s.sua && s.tool === 'chon', JSON.stringify(ghi))
  await go('Y tuong dau tien'); await phim('Escape'); s = await st()
  kiem('Go chu + Esc -> ghi chu luu chu, ghi ra so (bo-cuc.json)', s.vat.find((v) => v.id === ghi.id).chu === 'Y tuong dau tien' && (doc().vat.find((v) => v.id === ghi.id) || {}).chu === 'Y tuong dau tien', (doc().vat.find((v) => v.id === ghi.id) || {}).chu)
  await phim('n'); await bam(560, 200); await phim('Escape'); s = await st()
  kiem('Ghi chu bo trong (khong go gi) bi tu xoa, khong de rac', s.vat.length === 1, 'vat ' + s.vat.length)
  await phim('t'); await bam(560, 200); await go('Tieu de'); await phim('Escape'); s = await st()
  const chu = s.vat.find((v) => v.loai === 'chu')
  kiem('Cong cu Chu (T): bam + go -> o chu co noi dung', !!chu && chu.chu === 'Tieu de', JSON.stringify(chu))
  await phim('r'); await keo(300, 450, 460, 560); s = await st()
  const hv = s.vat.find((v) => v.loai === 'hinh')
  kiem('Cong cu Hinh vuong (R): keo khung 160x110 -> hinh dung kich thuoc', !!hv && hv.hinh === 'vuong' && Math.abs(hv.w - 160) <= 8 && Math.abs(hv.h - 110) <= 8, JSON.stringify(hv))
  await phim('o'); await bam(600, 500); await phim('d'); await bam(800, 500); s = await st()
  kiem('Hinh tron (O) va hinh thoi (D) tao duoc', s.vat.filter((v) => v.loai === 'hinh').map((v) => v.hinh).sort().join() === 'thoi,tron,vuong', s.vat.map((v) => v.hinh).join())
  await phim('k'); await bam(300, 650); await go('example.com/trang'); await phim('Escape'); s = await st()
  const lk = s.vat.find((v) => v.loai === 'link')
  kiem('The link (K): go "example.com/trang" -> tu them https://, luu url', !!lk && lk.url === 'https://example.com/trang', lk && lk.url)
  await phim('k'); await bam(700, 650); await go('khong phai link'); await phim('Escape'); s = await st()
  kiem('The link voi chuoi khong phai URL -> bi bo, khong tao the rac', s.vat.filter((v) => v.loai === 'link').length === 1)

  // --- 2. mui ten noi bam theo ---
  const pGhi = manHinh(s, s.vat.find((v) => v.id === ghi.id)), pHinh = manHinh(s, hv)
  await phim('a'); await keo(pGhi.x, pGhi.y, pHinh.x, pHinh.y); await phim('v'); s = await st()
  kiem('Cong cu Mui ten (A): keo tu ghi chu sang hinh -> mui ten noi 2 vat (a.k, b.k)', s.noi.length === 1 && s.noi[0].a.k === 'v:' + ghi.id && s.noi[0].b.k === 'v:' + hv.id, JSON.stringify(s.noi))
  const dNoi0 = await ev(() => document.querySelector('[data-c] path.vis').getAttribute('d'))
  await keo(pGhi.x, pGhi.y - 40, pGhi.x + 120, pGhi.y + 30); s = await st()
  const dNoi1 = await ev(() => document.querySelector('[data-c] path.vis').getAttribute('d'))
  kiem('Keo ghi chu di cho khac -> mui ten BAM THEO (duong thang doi), vat da di chuyen', dNoi0 !== dNoi1 && s.vat.find((v) => v.id === ghi.id).x !== ghi.x, dNoi0 + ' -> ' + dNoi1)
  kiem('Vi tri moi cua ghi chu da ghi ra so', (doc().vat.find((v) => v.id === ghi.id) || {}).x === s.vat.find((v) => v.id === ghi.id).x)
  await phim('a'); await keo(500, 700, 700, 760); await phim('v'); s = await st()
  kiem('Mui ten tu do (hai dau tren nen trong) tao duoc', s.noi.length === 2 && !s.noi[1].a.k && !s.noi[1].b.k)

  // --- 3. but ve + da quang ---
  await phim('p'); await keo(820, 620, 960, 700); await phim('l'); await keo(560, 620, 760, 630); await phim('v'); s = await st()
  kiem('But ve (P) + Da quang (L): 2 net, luu duoc, da quang la loai rieng', s.net.length === 2 && s.net[0].loai === 'but' && s.net[1].loai === 'daquang' && s.net[0].n >= 4, JSON.stringify(s.net))
  await chup('1-vat.png')

  // --- 4. chon nhieu ---
  const trong = s.vat.filter((v) => v.loai === 'ghi' || v.loai === 'chu')
  const hop = { x0: Math.min(...trong.map((v) => v.x)), y0: Math.min(...trong.map((v) => v.y)), x1: Math.max(...trong.map((v) => v.x + v.w)), y1: Math.max(...trong.map((v) => v.y + v.h)) }
  const A = { x: s.V.x + (hop.x0 - 14) * s.V.s, y: s.V.y + (hop.y0 - 14) * s.V.s }, B = { x: s.V.x + (hop.x1 + 14) * s.V.s, y: s.V.y + (hop.y1 + 14) * s.V.s }
  await keo(A.x, A.y, B.x, B.y); s = await st()
  kiem('Keo khoanh vung tren nen -> chon DUNG cac vat nam trong (ghi chu + chu), khong chon thu ngoai', trong.every((v) => s.sel.includes('v:' + v.id)) && !s.sel.includes('v:' + hv.id), JSON.stringify(s.sel))
  kiem('Co chon thi hien thanh ngu canh tren phan chon', s.nguHien)
  const pc = manHinh(s, trong[0])
  await bam(pc.x, pc.y, ['shift']); s = await st()
  kiem('Shift + bam mot vat dang chon -> bo vat do khoi tap chon', !s.sel.includes('v:' + trong[0].id) && s.sel.length === trong.length - 1, JSON.stringify(s.sel))
  await phim('a', ['meta']); s = await st()
  kiem('Cmd+A chon het (anh + vat + net + mui ten)', s.sel.length === s.mucs.length + s.vat.length + s.net.length + s.noi.length, s.sel.length + ' / ' + (s.mucs.length + s.vat.length + s.net.length + s.noi.length))
  await phim('Escape'); s = await st()
  kiem('Esc bo chon', s.sel.length === 0)

  // --- 5. xoa + hoan tac ---
  const nVat0 = s.vat.length, nNoi0 = s.noi.length
  const pG = manHinh(s, s.vat.find((v) => v.id === ghi.id))
  await bam(pG.x, pG.y); await phim('Delete'); s = await st()
  kiem('Chon ghi chu + Delete -> vat bien mat va mui ten noi vao no cung mat; ghi ra so', s.vat.length === nVat0 - 1 && s.noi.length === nNoi0 - 1 && doc().vat.length === nVat0 - 1, s.vat.length + ' vat, ' + s.noi.length + ' noi')
  await phim('z', ['meta']); await cho(300); s = await st()
  kiem('Cmd+Z -> ghi chu + mui ten quay lai (dung id, dung chu)', s.vat.length === nVat0 && s.noi.length === nNoi0 && s.vat.some((v) => v.id === ghi.id && v.chu === 'Y tuong dau tien'))
  await phim('z', ['meta', 'shift']); await cho(300); s = await st()
  kiem('Cmd+Shift+Z (lam lai) -> lai bien mat', s.vat.length === nVat0 - 1)
  await phim('z', ['meta']); await cho(300); s = await st()

  // --- 6. khoa + lop ---
  const gR = manHinh(s, s.vat.find((v) => v.id === ghi.id))
  await bam(gR.x, gR.y); await phim('l', ['meta']); s = await st()
  kiem('Cmd+L khoa vat; trang thai khoa ghi ra so', s.khoa['v:' + ghi.id] === true && doc().khoa['v:' + ghi.id] === true)
  const xK = s.vat.find((v) => v.id === ghi.id).x
  await keo(gR.x, gR.y, gR.x + 90, gR.y + 40); s = await st()
  kiem('Vat dang khoa KHONG keo di duoc, co bao "dang khoa"', s.vat.find((v) => v.id === ghi.id).x === xK && /khoá|locked/i.test(s.bao), s.bao)
  await phim('Delete'); s = await st()
  kiem('Vat dang khoa KHONG xoa duoc', s.vat.some((v) => v.id === ghi.id))
  await phim('l', ['meta']); s = await st()
  kiem('Cmd+L lan nua -> mo khoa', !s.khoa['v:' + ghi.id])
  await phim(']'); s = await st()
  const zCao = s.z['v:' + ghi.id]
  await phim('['); s = await st()
  kiem('Phim ] dua len tren, [ dua xuong duoi (lop z doi, ghi ra so)', zCao > 0 && s.z['v:' + ghi.id] < 0, zCao + ' -> ' + s.z['v:' + ghi.id])

  // --- 7. nhan doi + chep dan ---
  await phim('d', ['meta']); s = await st()
  const banNhan = s.vat.filter((v) => v.chu === 'Y tuong dau tien')
  kiem('Cmd+D nhan doi ghi chu: ra 1 ban moi, id khac, noi dung giong, lech 28', banNhan.length === 2 && banNhan[0].id !== banNhan[1].id && Math.abs(banNhan[1].x - banNhan[0].x) === 28, JSON.stringify(banNhan.map((v) => [v.id, v.x, v.y])))
  await phim('c', ['meta']); const cp = clipboard.readText()
  kiem('Cmd+C chep vat: clipboard he thong co goi AIOCANVAS1', cp.startsWith('AIOCANVAS1:'), cp.slice(0, 30))
  clipboard.writeText('Ghi chu tu ngoai'); chuot('mouseMove', 800, 300); await cho(60)
  const nV = (await st()).vat.length
  await phim('v', ['meta']); await cho(300); s = await st()
  kiem('Cmd+V voi chu thuong -> thanh ghi chu moi co noi dung do', s.vat.length === nV + 1 && s.vat[s.vat.length - 1].loai === 'ghi' && s.vat[s.vat.length - 1].chu === 'Ghi chu tu ngoai', JSON.stringify(s.vat[s.vat.length - 1]))
  clipboard.writeText('https://github.com/anthropics'); await phim('v', ['meta']); await cho(300); s = await st()
  kiem('Cmd+V voi URL -> the link', s.vat[s.vat.length - 1].loai === 'link' && s.vat[s.vat.length - 1].url === 'https://github.com/anthropics')
  const nFile0 = dsFile().length
  clipboard.writeImage(nativeImage.createFromBuffer(pngNho)); await phim('v', ['meta']); await cho(700); s = await st()
  const fMoi = dsFile().filter((t) => /^dan-/.test(t))
  kiem('Cmd+V voi ANH trong clipboard -> luu thanh file moi trong thu muc anh va hien tren bang', dsFile().length === nFile0 + 1 && fMoi.length === 1 && s.mucs.some((m) => m.khoa === fMoi[0]), fMoi.join())
  await phim('Escape')

  // --- 8. anh that: nhan doi / bo khoi khung / khong xoa file ---
  const kN = s.khung.find((k) => k.ten === 'Nhóm sẵn')
  const bM = s.mucs.find((m) => m.khoa === 'b.png')
  kiem('Dieu kien: b.png nam trong khung "Nhóm sẵn"', !!kN && bM.khung === kN.id)
  const bSize = fs.readFileSync(path.join(anh, 'b.png')).length
  await dat(bM.x + bM.w / 2, bM.y + bM.h / 2, 760, 460, 1)
  await bam(760, 460); await phim('d', ['meta']); await cho(900); s = await st()
  const b2 = s.mucs.find((m) => m.khoa === 'b (2).png')
  kiem('Cmd+D tren ANH -> chep file that "b (2).png" canh ban goc; ban goc nguyen', !!b2 && fs.existsSync(path.join(anh, 'b (2).png')) && fs.readFileSync(path.join(anh, 'b.png')).length === bSize, b2 ? 'co' : 'khong co')
  kiem('Ban nhan doi o CUNG khung voi ban goc, thu muc khung co ban noi cua no', !!b2 && b2.khung === kN.id && fs.existsSync(path.join(anh, 'Nhóm sẵn', 'b (2).png')))
  await phim('Delete'); await cho(700); s = await st()
  kiem('Delete tren anh DANG TRONG KHUNG -> chi bo khoi khung (file goc o thu muc anh con, ban noi trong khung mat)', fs.existsSync(path.join(anh, 'b (2).png')) && !fs.existsSync(path.join(anh, 'Nhóm sẵn', 'b (2).png')) && s.mucs.find((m) => m.khoa === 'b (2).png').khung === null)
  const eM = s.mucs.find((m) => m.khoa === 'e.png')
  await dat(eM.x + eM.w / 2, eM.y + eM.h / 2, 760, 460, 1)
  await bam(760, 460); await phim('Delete'); await cho(300); s = await st()
  kiem('DOI CHUNG: Delete tren anh KHONG o trong khung -> KHONG xoa file, co bao cho nguoi dung', fs.existsSync(path.join(anh, 'e.png')) && /không bị xoá|isn't deleted/i.test(s.bao), s.bao)

  // --- 9. chia deu / can hang ---
  await dat(P0.x, P0.y + 1000, 300, 200, 1)
  for (const [x, y] of [[300, 200], [420, 330], [900, 260]]) { await phim('n'); await bam(x, y); await go('x'); await phim('Escape') }
  s = await st()
  const ba = s.vat.slice(-3)
  await ev((ids) => window.__cv.X.chon(ids.map((i) => 'v:' + i)), ba.map((v) => v.id))
  await cho(100)
  await bamNut('chiaNgang'); s = await st()
  const vv = ba.map((v) => s.vat.find((x) => x.id === v.id)).sort((a, b) => a.x - b.x)
  const g1 = vv[1].x - (vv[0].x + vv[0].w), g2 = vv[2].x - (vv[1].x + vv[1].w)
  kiem('Chia deu ngang 3 ghi chu: hai khoang trong bang nhau (±1)', Math.abs(g1 - g2) <= 1, g1 + ' / ' + g2)
  await bamNut('canTrai'); s = await st()
  const xs = ba.map((v) => s.vat.find((x) => x.id === v.id).x)
  kiem('Nut "Can trai" tren thanh ngu canh: ca 3 cung x', new Set(xs).size === 1, xs.join())
  await bamNut('canTren'); s = await st()
  const ys = ba.map((v) => s.vat.find((x) => x.id === v.id).y)
  kiem('Nut "Can tren": ca 3 cung y', new Set(ys).size === 1, ys.join())
  kiem('Vi tri can hang da ghi ra so', ba.every((v) => doc().vat.find((x) => x.id === v.id).x === xs[0]))

  // --- 10. khung: doi mau, xep gon, xuat, xoa ---
  s = await st()
  const kk = s.khung.find((k) => k.ten === 'Nhóm sẵn')
  await dat(kk.x + kk.w / 2, kk.y - 20, 700, 200, 1)
  const tai = await rectEl('.khung[data-k="' + kk.id + '"] .tai b')
  await bam(tai.x, tai.y); s = await st()
  kiem('Bam vao tai khung -> chon khung, hien thanh ngu canh co PNG / PDF / Xoa khung', s.sel.join() === 'f:' + kk.id && (await ev(() => !!document.querySelector('[data-a="png"]') && !!document.querySelector('[data-a="pdf"]'))))
  const sw = await rectEl('.ngu .sw:nth-child(3)')
  await bam(sw.x, sw.y); s = await st()
  const mauMoi = s.khung.find((k) => k.id === kk.id).mau
  kiem('Doi mau khung bang o mau -> mau doi + ghi ra so', mauMoi === '#a78bfa' && doc().khung.find((k) => k.id === kk.id).mau === '#a78bfa', mauMoi)
  for (const t of ['c.png', 'd.png']) await ev((khoa, kid) => window.__cv.X.cv.xep([{ khoa, khung: kid }]), t, kk.id)
  await ev(async () => { const X = window.__cv.X; X.nhanKetQua(await X.cv.nap()) }); await cho(400)
  await bam(tai.x, tai.y)
  await bamNut('xepGon'); await cho(600); s = await st()
  const trongKhung = s.mucs.filter((m) => m.khung === kk.id)
  const kNew = s.khung.find((k) => k.id === kk.id)
  const chong = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  let nChong = 0; for (let i = 0; i < trongKhung.length; i++) for (let j = i + 1; j < trongKhung.length; j++) if (chong(trongKhung[i], trongKhung[j])) nChong++
  kiem('Xep gon khung: ' + trongKhung.length + ' tam xep luoi, khong de nhau, nam trong khung', trongKhung.length >= 3 && nChong === 0 && trongKhung.every((m) => m.x >= kNew.x && m.y >= kNew.y && m.x + m.w <= kNew.x + kNew.w && m.y + m.h <= kNew.y + kNew.h), nChong + ' chong, ' + trongKhung.length + ' tam')
  const rPng = await ev((id) => window.__cv.X.xuatKhung(id, 'png').then(() => true), kk.id)
  const fPng = path.join(ra, 'Nhóm sẵn canvas.png')
  let okPng = false, dims = ''
  try { const b = fs.readFileSync(fPng); okPng = b.slice(1, 4).toString() === 'PNG'; dims = b.readUInt32BE(16) + 'x' + b.readUInt32BE(20) } catch (e) {}
  kiem('Xuat khung ra PNG: file hop le, rong > 600 px', rPng && okPng && Number(dims.split('x')[0]) > 600, dims)
  await ev((id) => window.__cv.X.xuatKhung(id, 'pdf'), kk.id)
  let okPdf = false
  try { const b = fs.readFileSync(path.join(ra, 'Nhóm sẵn canvas.pdf')); okPdf = b.slice(0, 5).toString() === '%PDF-' && b.includes('/DCTDecode') && b.slice(-8).toString().includes('%%EOF') } catch (e) {}
  kiem('Xuat khung ra PDF: file la PDF (header %PDF, anh JPEG, ket thuc %%EOF)', okPdf)
  await chup('2-khung.png')

  await dat(P0.x, P0.y + 1800, 700, 300, 1)
  await ev(() => document.getElementById('them').click()); await cho(900)
  await ev(() => document.activeElement && document.activeElement.blur()); await cho(200)
  s = await st()
  const kRong = s.khung.find((k) => k.ten === 'Thư mục mới')
  await dat(kRong.x + kRong.w / 2, kRong.y, 700, 300, 1)
  const tR = await rectEl('.khung[data-k="' + kRong.id + '"] .tai b')
  await bam(tR.x, tR.y); await phim('Delete'); s = await st()
  kiem('Xoa khung can BAM HAI LAN: lan dau chi nhac, thu muc con nguyen', fs.existsSync(path.join(anh, 'Thư mục mới')) && s.khung.some((k) => k.id === kRong.id) && /xoá|delete/i.test(s.bao), s.bao)
  await phim('Delete'); await cho(700); s = await st()
  kiem('Lan hai: khung rong bi xoa (thu muc cung mat), khong anh nao mat', !fs.existsSync(path.join(anh, 'Thư mục mới')) && !s.khung.some((k) => k.id === kRong.id) && anhGoc.every((t) => fs.existsSync(path.join(anh, t))))
  const kRieng = s.khung.find((k) => k.ten === 'Rieng')
  await dat(kRieng.x + kRieng.w / 2, kRieng.y, 700, 300, 1)
  const tRi = await rectEl('.khung[data-k="' + kRieng.id + '"] .tai b')
  await bam(tRi.x, tRi.y); await phim('Delete'); await phim('Delete'); await cho(600); s = await st()
  kiem('DOI CHUNG: khung co FILE RIENG cua nguoi dung -> khong xoa duoc, co bao, file rieng con', fs.existsSync(path.join(anh, 'Rieng', 'cua-toi.png')) && s.khung.some((k) => k.id === kRieng.id) && /riêng|own/i.test(s.bao), s.bao)

  // --- 11. tha file tu ngoai + IPC nhap ---
  await dat(P0.x, P0.y, 300, 200, 1)
  const truocTha = dsFile().length
  await ev((bytes) => {
    const dt = new DataTransfer()
    dt.items.add(new File([new Uint8Array(bytes)], 'tha-vao.png', { type: 'image/png' }))
    document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: 900, clientY: 300, bubbles: true, cancelable: true }))
  }, [...pngNho])
  await cho(1200); s = await st()
  const mTha = s.mucs.find((m) => m.khoa === 'tha-vao.png')
  kiem('Tha anh tu trinh duyet (khong co duong dan) len bang -> thanh file moi trong thu muc anh, hien dung cho tha', !!mTha && dsFile().length === truocTha + 1 && Math.abs((mTha.x + mTha.w / 2) - (900 - s.V.x) / s.V.s) < 40, mTha ? JSON.stringify([mTha.x, mTha.y]) : 'khong co')
  const ngoai = path.join(ra, 'ngoai'); fs.mkdirSync(ngoai, { recursive: true })
  fs.writeFileSync(path.join(ngoai, 'tu-finder.png'), pngNho); fs.writeFileSync(path.join(ngoai, 'ghi.txt'), 'x')
  const rN = await ev((p1, p2) => window.cv.nhap([p1, p2]), path.join(ngoai, 'tu-finder.png'), path.join(ngoai, 'ghi.txt'))
  kiem('Nhap file tu Finder: PNG duoc chep vao, TXT bi tu choi, file goc o ngoai con nguyen', rN.kq.some((q) => q.ok && q.ten === 'tu-finder.png') && rN.kq.some((q) => q.loi === 'loai') && fs.existsSync(path.join(ngoai, 'tu-finder.png')) && fs.existsSync(path.join(anh, 'tu-finder.png')))
  await ev(async () => { const X = window.__cv.X; X.nhanKetQua(await X.cv.nap()) })

  // --- 12. keo ra app khac ---
  s = await st()
  const aM = s.mucs.find((m) => m.khoa === 'a.png')
  await dat(aM.x + aM.w / 2, aM.y + aM.h / 2, 760, 460, 1)
  await ev(() => { const e = document.querySelector('.o[data-khoa="a.png"] .rakeo'); e.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() })) })
  await cho(500)
  kiem('Nut keo-ra o goc tam anh -> main nhan DUNG duong dan file that cua a.png (de goi startDrag)', keoRa.length >= 1 && keoRa[keoRa.length - 1].length === 1 && path.basename(keoRa[keoRa.length - 1][0]) === 'a.png', JSON.stringify(keoRa))
  await ev(() => { const X = window.__cv.X; X.chon(['o:a.png', 'o:c.png']) })
  await ev(() => { const e = document.querySelector('.o[data-khoa="a.png"] .rakeo'); e.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() })) })
  await cho(500)
  kiem('Keo khi dang chon 2 anh -> gui CA 2 file', keoRa.length >= 2 && keoRa[keoRa.length - 1].map((f) => path.basename(f)).sort().join() === 'a.png,c.png', JSON.stringify(keoRa[keoRa.length - 1]))

  // --- 12b. xem nhanh bang Space ---
  await ev(() => window.__cv.X.chon(['o:a.png']))
  await phim('Space'); await cho(300)
  const xn1 = await ev(() => { const e = document.querySelector('.xn img'); return e ? { src: e.getAttribute('src'), ngang: e.getBoundingClientRect().width } : null })
  kiem('Chon tam anh + Space -> hien lop xem nhanh phong to dung file goc a.png', !!xn1 && /a\.png$/.test(xn1.src), JSON.stringify(xn1))
  await phim('Right'); await cho(250)
  const xn2 = await ev(() => { const e = document.querySelector('.xn img'); return e ? { src: e.getAttribute('src'), sel: [...window.__cv.X.sel], ten: document.querySelector('.xn .ten2').textContent } : null })
  kiem('Mui ten phai khi dang xem -> sang tam ke (khac tam truoc), tam do duoc chon, ten + so thu tu hien o duoi', !!xn2 && xn2.src !== xn1.src && xn2.sel.length === 1 && / \/ \d+/.test(xn2.ten), JSON.stringify(xn2))
  await phim('Left'); await cho(250)
  const xn3 = await ev(() => { const e = document.querySelector('.xn img'); return e ? e.getAttribute('src') : null })
  kiem('Mui ten trai -> quay lai tam dau', xn3 === xn1.src, xn3)
  await phim('Space'); await cho(150)
  kiem('Space lan nua dong lai', (await ev(() => !document.querySelector('.xn'))))
  await phim('Space'); await cho(200); await phim('Escape'); await cho(150)
  kiem('Mo lai roi Esc cung dong', (await ev(() => !document.querySelector('.xn'))))
  // Quick Look that (macOS): main chuyen phim trai / phai sang trang bang 'canvas:xem-tiep' -> trang chon tam ke + goi lai xemNhanh
  await ev(() => window.__cv.X.chon(['o:a.png']))
  await phim('Space'); await cho(200); await phim('Escape'); await cho(150)   // mo + dong de nap danh sach luot (xnDs)
  await ev(() => window.__cv.X.chon(['o:a.png']))
  const truocQL = (await st()).sel.join()
  wc.send('canvas:xem-tiep', 1); await cho(300)
  const sauQL = (await st()).sel.join()
  wc.send('canvas:xem-tiep', -1); await cho(300)
  const veQL = (await st()).sel.join()
  kiem('Phim mui ten tu Quick Look that (main -> trang): sang tam ke roi quay lai, tam duoc chon theo', sauQL !== truocQL && sauQL.startsWith('o:') && veQL === truocQL, truocQL + ' -> ' + sauQL + ' -> ' + veQL)
  await ev(() => window.__cv.X.boChon())
  wc.sendInputEvent({ type: 'keyDown', keyCode: 'Space' }); await cho(200)
  kiem('Khong chon tam nao: Space KHONG mo xem nhanh (van la giu de keo bang)', (await ev(() => !document.querySelector('.xn') && window.__cv.X.space === true)))
  wc.sendInputEvent({ type: 'keyUp', keyCode: 'Space' }); await cho(100)

  // --- 13. tim + loc + moi nhat + ban do ---
  await ev(() => window.__cv.X.boChon())
  await phim('f', ['meta']); await go('b.png'); await cho(200); s = await st()
  kiem('Cmd+F mo o tim; go "b.png" -> chi con tam khop sang, cac tam khac mo di', s.mo > 0 && s.oTong - s.mo >= 1 && s.oTong - s.mo <= 3, (s.oTong - s.mo) + ' sang / ' + s.oTong)
  await phim('Escape'); await phim('Escape'); s = await st()
  kiem('Esc dong o tim, bo loc: khong tam nao con mo', s.mo === 0 && s.vMo === 0, s.mo + '')
  await phim('f', ['meta']); await ev(() => document.querySelector('.cp[data-loai="ghi"]').click()); await cho(200); s = await st()
  kiem('Loc "Ghi chu": anh het sang, ghi chu con sang', s.mo === s.oTong && s.vMo < s.vat.length, s.mo + '/' + s.oTong + ' mo, ghi chu mo ' + s.vMo)
  await phim('Escape'); await phim('Escape')
  await ev(() => document.getElementById('moiNhat').click()); await cho(300); s = await st()
  const kM = await ev(() => { const X = window.__cv.X; let t = X.mucs[0]; for (const m of X.mucs) if (m.mtime > t.mtime) t = m; return 'o:' + t.khoa })
  kiem('Nut "Moi nhat" nhay toi tam moi nhat va chon no', s.sel.join() === kM, s.sel.join() + ' vs ' + kM)
  kiem('Ban do nho hien', s.banDoHien)
  const vx0 = s.V.x
  const bd = await rectEl('#banDo')
  await bam(bd.l + 10, bd.t + 10); s = await st()
  kiem('Bam len ban do nho -> goc nhin nhay toi cho do', s.V.x !== vx0, vx0 + ' -> ' + s.V.x)

  // --- 14. cac lop noi co de len nhau khong (anh bao 12/10: thanh nut giua de len ban do nho) ---
  await ev(() => { window.__cv.X.boChon(); window.__cv.X.vua() })
  const giaoNhau = (a, b) => a.l < b.l + b.w && b.l < a.l + a.w && a.t < b.t + b.h && b.t < a.t + a.h
  const lopNoi = ['.ten', '.cong', '.thanh', '#banDoHop', '.ntr', '#tim']
  const loiDe = []
  for (const rong of [1500, 1200, 1000, 900, 760]) {
    w.setSize(rong, 760); await cho(500)
    const rs = await ev((ds) => ds.map((sel) => { const e = document.querySelector(sel); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { sel, l: r.left, t: r.top, w: r.width, h: r.height } }), lopNoi)
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (rs[i] && rs[j] && giaoNhau(rs[i], rs[j])) loiDe.push(rong + 'px: ' + rs[i].sel + ' de len ' + rs[j].sel)
  }
  kiem('Cac lop noi (ten, cong cu trai, thanh nut giua, ban do nho, nut tron, o tim) KHONG de len nhau o bo rong 1500 / 1200 / 1000 / 900 / 760', loiDe.length === 0, loiDe.join(' ; '))
  // thanh ngu canh + thong bao + chip loc: khong de len cac lop noi o 5 vi tri cua vat dang chon, 2 bo rong cua so
  await phim('f', ['meta']); await cho(150)
  const idG = (await st()).vat.find((v) => v.loai === 'ghi')
  const loiNgu = []
  for (const rong of [1500, 1000]) {
    w.setSize(rong, 760); await cho(500)
    const IW = await ev(() => innerWidth), IH = await ev(() => innerHeight)
    for (const [sx, sy] of [[110, 120], [IW - 130, 120], [110, IH - 130], [IW - 170, IH - 220], [IW / 2, IH / 2]]) {
      await dat(idG.x + idG.w / 2, idG.y + idG.h / 2, sx, sy, 1)
      await ev((id) => { const X = window.__cv.X; X.chon(['v:' + id]); X.hienBao('Thong bao thu dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai dai') }, idG.id)
      await cho(120)
      const rs = await ev((ds) => ds.map((sel) => { const e = document.querySelector(sel); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { sel, l: r.left, t: r.top, w: r.width, h: r.height } }), ['#ngu', '.bao', '.cong', '.ten', '.thanh', '#banDoHop', '.ntr', '#tim', '#timChip'])
      const ngu = rs[0], bao = rs[1]
      if (!ngu) { loiNgu.push(rong + ' (' + sx + ',' + sy + '): khong co thanh ngu canh'); continue }
      for (const o of rs.slice(2)) if (o && giaoNhau(ngu, o)) loiNgu.push(rong + ' (' + Math.round(sx) + ',' + Math.round(sy) + '): thanh ngu canh de len ' + o.sel)
      if (bao) for (const o of rs.slice(2)) if (o && giaoNhau(bao, o)) loiNgu.push(rong + ': thong bao de len ' + o.sel)
    }
  }
  kiem('Thanh ngu canh (va thong bao) KHONG de len thanh cong cu / ban do / nut tron / o tim + chip loc o 5 vi tri cua vat chon, rong 1500 va 1000', loiNgu.length === 0, loiNgu.slice(0, 6).join(' ; '))
  await phim('Escape'); await phim('Escape')
  w.setSize(1500, 878); await cho(300)
  await ev(() => { window.__cv.X.boChon(); window.__cv.X.vua() }); await cho(500)
  await chup('3-cuoi.png')
  s = await st()
  const d = doc()
  fs.writeFileSync(path.join(ra, 'pha1.json'), JSON.stringify({
    vat: s.vat.map((v) => [v.id, v.loai, v.chu, v.url || '']), noi: s.noi.length, net: s.net.length, khoa: s.khoa, z: s.z,
    khungMau: { id: kk.id, mau: d.khung.find((k) => k.id === kk.id).mau },
  }))
  kiem('Cuoi pha 1: anh goc a..f con nguyen (ten + dung luong)', anhGoc.map((t) => t + ':' + fs.readFileSync(path.join(anh, t)).length).join('|') === goc0)
  kiem('Khong loi console tren trang', kq.loiTrang.length === 0, kq.loiTrang.join(' ; '))
}
