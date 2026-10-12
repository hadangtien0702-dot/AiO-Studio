'use strict'
/* Kich ban THU DUNG Canvas (12/10) — main.js goi trong che do --thu-canvas khi co bien AIO_THU_KICHBAN (xem thuCanvas).
   Khac bai test:canvasapp: o day bam / go / keo / lan bang sendInputEvent (di qua duong nhap lieu cua Chromium, khong goi thang ham
   cua trang), anh co kich thuoc man hinh that, va ghi lai THOI GIAN + nhung cho nguoi dung se vap. Bai nay ghi nhan, khong cham dat/truot.
   KHONG bam dup vao tam hay tai khung: hai thao tac do mo app khac (Preview, Finder) len man hinh that. */
const fs = require('fs')
const path = require('path')

module.exports = async ({ w, js, cho, kq, tt, tTai, ra, anh }) => {
  const wc = w.webContents
  const chup = async (ten) => { try { fs.writeFileSync(path.join(ra, ten), (await wc.capturePage()).toPNG()) } catch (e) { kq.loiChup = e.message } }
  const chuot = (type, x, y, them) => wc.sendInputEvent(Object.assign({ type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 }, them))
  const bam = async (x, y) => { chuot('mouseMove', x, y); await cho(40); chuot('mouseDown', x, y); await cho(40); chuot('mouseUp', x, y); await cho(80) }
  const keo = async (x0, y0, x1, y1) => {
    chuot('mouseMove', x0, y0); await cho(40); chuot('mouseDown', x0, y0); await cho(40)
    for (let i = 1; i <= 10; i++) { chuot('mouseMove', x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10, { modifiers: ['leftButtonDown'] }); await cho(25) }
    chuot('mouseUp', x1, y1); await cho(120)
  }
  const o = (sel) => js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, l: r.left, t: r.top } })()`)
  const nhin = () => js(`(() => { const V = window.__cv.V; return { s: +V.s.toFixed(3), x: Math.round(V.x), y: Math.round(V.y), cua: innerWidth + 'x' + innerHeight } })()`)
  const tomTat = async () => { const t = await tt(); return { o: t.o, khung: t.khung.map((k) => k.ten + ':' + k.n), bao: t.bao, dem: t.dem } }

  // 1. Mo bang: bao lau thi thay anh
  const moc = { tamDau: null, xong: null, tong: 0 }
  for (;;) {
    const s = await js(`(() => { const q = [...document.querySelectorAll('img.anh')]; return [q.filter((i) => i.complete && i.naturalWidth > 0).length, q.length] })()`)
    const t = Date.now() - tTai
    moc.tong = s[1]
    if (moc.tamDau == null && s[0] > 0) moc.tamDau = t
    if (s[0] >= s[1]) { moc.xong = t; break }
    if (t > (Number(process.env.AIO_THU_HAN) || 60000) - 30000) { moc.dung = s[0]; break }
    await cho(200)
  }
  kq.mo = moc
  const v0 = await nhin()
  kq.nhin = Object.assign({ rongTamTrenMan: Math.round(184 * v0.s) }, v0)
  kq.dau = await tomTat()
  await chup('1-mo.png')

  // 2. Bam that vao "Khung moi": khung roi vao dau, co de len tam nao khong, o ten co san sang de go khong
  const nutThem = await o('#them')
  await bam(nutThem.x, nutThem.y); await cho(700)
  kq.khungMoi = await js(`(() => { const t = window.__cv.trangThai(), k = t.khung[t.khung.length - 1], a = document.activeElement
    const duoi = t.mucs.filter((m) => { const cx = m.x + m.w / 2, cy = m.y + m.h / 2; return cx >= k.x && cx <= k.x + k.w && cy >= k.y && cy <= k.y + k.h })
    const cham = t.mucs.filter((m) => m.x < k.x + k.w && m.x + m.w > k.x && m.y < k.y + k.h && m.y + m.h > k.y)
    return { ten: k.ten, soKhung: t.khung.length, tamCoTamDiemTrongKhung: duoi.length, trongDoKhongThuoc: duoi.filter((m) => m.khung !== k.id).length, tamBiKhungDe: cham.length,
      oTenDangNhan: !!(a && a.dataset && a.dataset.ten === k.id), chonHetChu: !!(a && a.selectionStart === 0 && a.selectionEnd === a.value.length) } })()`)
  await chup('2-khung-moi.png')

  // 3. Go ten bang ban phim that roi Enter: thu muc tren dia co doi ten theo khong
  const TEN = 'Y tuong Tet'
  for (const c of TEN) { wc.sendInputEvent({ type: 'char', keyCode: c }); await cho(25) }
  wc.sendInputEvent({ type: 'keyDown', keyCode: 'Return' }); wc.sendInputEvent({ type: 'char', keyCode: String.fromCharCode(13) }); wc.sendInputEvent({ type: 'keyUp', keyCode: 'Return' })
  await cho(900)
  const sauGo = await tomTat()
  kq.goTen = { khung: sauGo.khung, thuMucCoTrenDia: fs.existsSync(path.join(anh, TEN)), conThuMucTenCu: fs.existsSync(path.join(anh, kq.khungMoi.ten)), bao: sauGo.bao }

  // 4. Keo that mot tam roi vao khung vua tao
  const roi = await js(`(() => { const t = window.__cv.trangThai(), k = t.khung[t.khung.length - 1]; const m = t.mucs.filter((x) => !x.khung && x.kieu !== 'dai').sort((a, b) => Math.hypot(a.x - k.x, a.y - k.y) - Math.hypot(b.x - k.x, b.y - k.y)).find((x) => { const cx = x.x + x.w / 2, cy = x.y + x.h / 2; return !(cx >= k.x && cx <= k.x + k.w && cy >= k.y && cy <= k.y + k.h) }); return m ? { khoa: m.khoa, id: k.id } : null })()`)
  if (roi) {
    const a = await o('.o[data-khoa="' + roi.khoa + '"]'), b = await o('.khung[data-k="' + roi.id + '"]')
    await keo(a.x, a.y, b.x, b.y + b.h * .25); await cho(900)
    const s = await tomTat()
    const tenFile = roi.khoa
    let cungFile = false
    try { cungFile = String(fs.statSync(path.join(anh, tenFile), { bigint: true }).ino) === String(fs.statSync(path.join(anh, TEN, tenFile), { bigint: true }).ino) } catch (e) {}
    kq.keoVao = { tam: roi.khoa, khung: s.khung, fileCoTrongThuMuc: fs.existsSync(path.join(anh, TEN, tenFile)), laBanNoiCuaAnhGoc: cungFile, anhGocCon: fs.existsSync(path.join(anh, tenFile)), bao: s.bao }
  } else kq.keoVao = { boQua: 'khong con tam roi nao nam ngoai khung moi' }
  await chup('3-sau-keo.png')

  // 5. Lan chuot: co Ctrl thi phong, khong Ctrl thi truot
  const giua = await js('({ x: innerWidth / 2, y: innerHeight / 2 })')
  const v1 = await nhin()
  wc.sendInputEvent({ type: 'mouseWheel', x: giua.x, y: giua.y, deltaX: 0, deltaY: 120, canScroll: true, modifiers: ['control'] }); await cho(250)
  const v2 = await nhin()
  wc.sendInputEvent({ type: 'mouseWheel', x: giua.x, y: giua.y, deltaX: 0, deltaY: -120, canScroll: true }); await cho(250)
  const v3 = await nhin()
  kq.lan = { truoc: v1, sauCtrlLan: v2, sauLanThuong: v3 }

  // 6. Nhung phim nguoi dung se thu theo thoi quen (Miro, Finder): bam xong bang co doi gi khong
  const tr = JSON.stringify(await tomTat())
  const mot = await js(`(() => { const e = document.querySelector('.o'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
  await bam(mot.x, mot.y)
  const coChon = await js(`document.querySelectorAll('.o.chon, .o[aria-selected="true"]').length`)
  const phim = []
  for (const [ten, kc, mod] of [['Backspace', 'Backspace'], ['Delete', 'Delete'], ['Cmd+Z', 'z', ['meta']], ['Cmd+A', 'a', ['meta']], ['Space', 'Space'], ['Escape', 'Escape']]) {
    wc.sendInputEvent({ type: 'keyDown', keyCode: kc, modifiers: mod || [] }); wc.sendInputEvent({ type: 'keyUp', keyCode: kc, modifiers: mod || [] }); await cho(120)
    phim.push(ten + ':' + (JSON.stringify(await tomTat()) === tr ? 'khong lam gi' : 'CO DOI'))
  }
  kq.thoiQuen = { bamMotTamCoDanhDauChon: coChon, phim,
    keoRaAppKhac: await js(`(() => { const e = document.querySelector('.o'); return { draggable: e.draggable, anhDraggable: (e.querySelector('img') || {}).draggable === true } })()`),
    menuChuotPhai: await js(`typeof window.oncontextmenu === 'function'`) }

  await js('window.__cv.vua(); true'); await cho(400)
  await chup('4-vua.png')
  kq.cuoi = await tomTat()
}
