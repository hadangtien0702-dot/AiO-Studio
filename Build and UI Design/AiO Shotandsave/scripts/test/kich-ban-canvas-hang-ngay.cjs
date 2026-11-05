'use strict'
/* Kich ban DO "Canvas dung duoc hang ngay" (nhom A, ROADMAP 0g) — main.js goi trong che do --thu-canvas khi co AIO_THU_KICHBAN.
   Moi thao tac di qua duong nhap lieu CUA CHROMIUM (wc.sendInputEvent: chuot, phim, lan), khong goi thang ham cua trang.
   Pha 1 (AIO_THU_PHA=1): thu muc anh 200 tam 2560x1440, userData MOI. Do mo bang, bam / chon nhieu / keo / Delete / Ctrl+Z / xoa khung.
   Pha 2 (AIO_THU_PHA=2): mo lai app tren CUNG userData (anh nho da co san). Ben chay bai: scripts/test/do-canvas-hang-ngay.cjs. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})   // EPIPE: khong de Electron hien hop loi len man
process.on('uncaughtException', (e) => { try { console.error(e) } catch (e2) {} try { require('electron').app.exit(1) } catch (e3) {} })
const fs = require('fs')
const path = require('path')

module.exports = async ({ w, js, cho, kq, tt, tTai, ra, anh, keoRa, phim }) => {
  const pha = process.env.AIO_THU_PHA || '1'
  const wc = w.webContents
  const MOD = process.platform === 'darwin' ? 'meta' : 'control'
  const chup = async (ten) => { try { fs.writeFileSync(path.join(ra, ten), (await wc.capturePage()).toPNG()) } catch (e) { kq.loiChup = e.message } }
  const chuot = (type, x, y, them) => wc.sendInputEvent(Object.assign({ type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 }, them))
  const bam = async (x, y, mods) => { chuot('mouseMove', x, y); await cho(40); chuot('mouseDown', x, y, mods ? { modifiers: mods } : null); await cho(40); chuot('mouseUp', x, y, mods ? { modifiers: mods } : null); await cho(120) }
  const keo = async (x0, y0, x1, y1) => {
    chuot('mouseMove', x0, y0); await cho(40); chuot('mouseDown', x0, y0); await cho(40)
    for (let i = 1; i <= 10; i++) { chuot('mouseMove', x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10, { modifiers: ['leftButtonDown'] }); await cho(25) }
    chuot('mouseUp', x1, y1); await cho(150)
  }
  const phimBam = async (keyCode, mods) => { wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: mods || [] }); wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: mods || [] }); await cho(150) }
  const tinhNo = (sel) => js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, l: r.left, t: r.top } })()`)
  const doc = () => js(`(() => { const V = window.__cv.V, W = innerWidth, H = innerHeight
    const anhs = [...document.querySelectorAll('img.anh')]
    let thay = 0, xong = 0, xongTong = 0
    for (const i of anhs) if (i.complete && i.naturalWidth > 0) xongTong++
    for (const e of document.querySelectorAll('.o')) { const r = e.getBoundingClientRect(); if (r.right > 0 && r.bottom > 0 && r.left < W && r.top < H) { thay++; const im = e.querySelector('img.anh'); if (!im || (im.complete && im.naturalWidth > 0)) xong++ } }
    return { s: +V.s.toFixed(3), thay, xong, xongTong, tong: anhs.length } })()`)
  const moiNhat = () => js(`(() => { const t = window.__cv.trangThai(); let m = t.mucs[0]; for (const x of t.mucs) if (x.mtime > m.mtime) m = x
    const e = document.querySelector('.o[data-khoa="' + m.khoa + '"]'), r = e.getBoundingClientRect()
    return { khoa: m.khoa, l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), trongMan: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, s: +window.__cv.V.s.toFixed(3) } })()`)
  const demNho = () => { try { return fs.readdirSync(path.join(ra, 'userData', 'canvas', 'anh-nho')).length } catch (e) { return 0 } }
  const trangThai = () => js(`(() => { const t = window.__cv.trangThai(); return { khung: t.khung.map((k) => ({ id: k.id, ten: k.ten })), mucs: t.mucs.map((m) => [m.khoa, m.khung || '']), sel: t.sel, bao: (() => { const b = document.getElementById('bao'); return b.classList.contains('hien') ? b.textContent : '' })() } })()`)
  const ino = (p) => { try { return String(fs.statSync(p, { bigint: true }).ino) } catch (e) { return null } }
  const doc2 = (p) => { try { return fs.readFileSync(p) } catch (e) { return null } }
  const cungByte = (a, b) => { const x = doc2(a), y = doc2(b); return !!x && !!y && x.equals(y) }

  /* ---------- 1. Mo bang ---------- */
  const moc = { tamDau: null, viewportDu: null, tong: 0 }
  for (;;) {
    const s = await doc(), t = Date.now() - tTai
    moc.tong = s.tong
    if (moc.tamDau == null && s.xongTong > 0) moc.tamDau = t
    if (s.thay > 0 && s.xong >= s.thay) { moc.viewportDu = t; moc.luc = s; break }
    if (t > 90000) { moc.dung = s; break }
    await cho(100)
  }
  kq.mo = moc
  /* cho luot tam bay vao xong (class .bay het + transition ve cho cu, ~3 s o cua so an) roi moi do cho dung cua tam */
  for (let i = 0; i < 100; i++) { const m = await moiNhat(); if (m.w >= 150 * m.s || (m.w >= 0.9 * 184 * m.s && m.w > 0)) break; await cho(100) }
  kq.moMan = await moiNhat()
  kq.moNhoLucDo = demNho()
  await chup(pha === '1' ? '1-mo.png' : 'pha2-mo.png')

  /* ---------- A1: phim tat + lenh mo Canvas (chay trong main) ---------- */
  if (phim && pha === '1') kq.phim = await phim()

  /* ---------- A6: anh nho tao san, khong can trang xin ---------- */
  const t0 = Date.now()
  let nho = demNho()
  while (Date.now() - t0 < (pha === '1' ? 40000 : 3000)) {
    nho = demNho()
    if (nho >= moc.tong) break
    await cho(500)
  }
  kq.nho = { sau: nho, ms: Date.now() - t0, tong: moc.tong }

  /* ---------- Vua man hinh: bao lau thi du het ---------- */
  const nutVua = await tinhNo('#vua')
  const tV = Date.now()
  await bam(nutVua.x, nutVua.y)
  for (;;) {
    const s = await doc()
    if (s.xongTong >= s.tong) { kq.vuaDay = { ms: Date.now() - tV, s: s.s, tong: s.tong }; break }
    if (Date.now() - tV > 60000) { kq.vuaDay = { ms: -1, dung: s }; break }
    await cho(100)
  }
  await chup(pha === '1' ? '2-vua.png' : 'pha2-vua.png')

  /* ---------- A5: nut Moi nhat ---------- */
  const nutMoi = await tinhNo('#moiNhat')
  await bam(nutMoi.x, nutMoi.y); await cho(600)
  kq.nutMoiNhat = await moiNhat()
  await chup(pha === '1' ? '3-moi-nhat.png' : 'pha2-moi-nhat.png')
  if (pha !== '1') return

  /* ---------- A3 / A2 / A4: thao tac that ---------- */
  const goc0 = {}   // tam nao co file that ben ngoai: de doi chieu o cuoi
  for (const t of fs.readdirSync(anh)) if (/\.png$/i.test(t)) goc0[t] = { ino: ino(path.join(anh, t)), size: fs.statSync(path.join(anh, t)).size }
  kq.goc0 = Object.keys(goc0).length

  // khung moi (bam nut that), dat ten bang phim that. Tao khung se DAY cac tam nam duoi no ra cho khac (hanh vi co san, ROADMAP 0g muc 4)
  const nutThem = await tinhNo('#them')
  await bam(nutThem.x, nutThem.y); await cho(700)
  await phimBam('Return'); await cho(1200)
  let st = await trangThai()
  const kA = st.khung[st.khung.length - 1]
  kq.khungA = kA
  const thuMucA = path.join(anh, kA.ten)
  kq.khungATrongBanDau = fs.existsSync(thuMucA) ? fs.readdirSync(thuMucA).length : -1
  const rK = await js('(() => { const q = document.querySelector(".khung[data-k=" + JSON.stringify(' + JSON.stringify(kA.id) + ') + "]").getBoundingClientRect(); return { l: q.left, t: q.top, w: q.width, h: q.height } })()')
  const tam = await js('(() => { const ds = []; for (const e of document.querySelectorAll(".o:not(.dai)")) { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) continue; const top = document.elementFromPoint(x, y); if (!top || top.closest(".o") !== e) continue; ds.push({ khoa: e.dataset.khoa, x, y }) } return ds })()')
  const ctr = { x: rK.l + rK.w / 2, y: rK.t + rK.h / 2 }
  const ngoai = tam.filter((u) => !(u.x > rK.l && u.x < rK.l + rK.w && u.y > rK.t && u.y < rK.t + rK.h)).sort((a, b) => Math.hypot(a.x - ctr.x, a.y - ctr.y) - Math.hypot(b.x - ctr.x, b.y - ctr.y))
  const T1 = ngoai[0]
  const dx = T1 ? ctr.x - T1.x : 0, dy = T1 ? ctr.y - T1.y : 0
  const T2 = ngoai.slice(1).find((u) => u.x + dx > rK.l + 50 && u.x + dx < rK.l + rK.w - 50 && u.y + dy > rK.t + 50 && u.y + dy < rK.t + rK.h - 50)
  const T3 = ngoai.slice(1).filter((u) => u !== T2).pop()   // tam xa nhat con thay duoc: KHONG di cung 2 tam kia
  kq.ung = [T1, T2, T3].map((u) => u && u.khoa)
  kq.khungRect = rK
  if (!T1 || !T2 || !T3) { kq.loi = 'khong chon duoc 3 tam cho bai do'; return }
  const pos = async (t) => js('(() => { const r = document.querySelector(".o[data-khoa=" + JSON.stringify(' + JSON.stringify(t.khoa) + ') + "]").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()')

  // A3: chon 2 tam (bam + Shift bam), keo ca hai vao giua khung
  await bam(T1.x, T1.y)
  await bam(T2.x, T2.y, ['shift'])
  st = await trangThai()
  kq.chonHai = st.sel.slice().sort()
  await keo(T1.x, T1.y, ctr.x, ctr.y); await cho(1000)
  st = await trangThai()
  const trong = (t) => (st.mucs.find((m) => m[0] === t.khoa) || [])[1]
  kq.sauKeo = { t1: trong(T1), t2: trong(T2), t3: trong(T3), thuMuc: fs.existsSync(thuMucA) ? fs.readdirSync(thuMucA).sort() : null }
  kq.sauKeo.banNoi = [T1, T2].map((t) => ino(path.join(thuMucA, t.khoa)) === goc0[t.khoa].ino)

  // A2: keo RA app khac: sau khi keo xong 2 tam van dang chon -> dragstart tren 1 tam -> main nhan DUNG ca hai file
  const nKeoRa0 = keoRa.length
  await js(`document.querySelector('.o[data-khoa=${JSON.stringify(T1.khoa)}]').dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true })); true`); await cho(500)
  kq.keoRaHai = keoRa.slice(nKeoRa0).map((fs0) => fs0.map((f) => ({ ten: path.basename(f), tonTai: fs.existsSync(f), giongGoc: goc0[path.basename(f)] ? cungByte(f, path.join(anh, path.basename(f))) : null })))
  // mot tam chua chon -> chi mot file
  await phimBam('Escape')
  const n2 = keoRa.length
  await js(`document.querySelector('.o[data-khoa=${JSON.stringify(T3.khoa)}]').dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true })); true`); await cho(400)
  kq.keoRaMot = keoRa.slice(n2).map((fs0) => fs0.map((f) => path.basename(f)))

  // A3: Delete -> bo 2 tam khoi khung, file goc con nguyen
  { const a = await pos(T1), b = await pos(T2); await bam(a.x, a.y); await bam(b.x, b.y, ['shift']) }
  await phimBam('Delete'); await cho(900)
  st = await trangThai()
  kq.sauDelete = { t1: (st.mucs.find((m) => m[0] === T1.khoa) || [])[1], t2: (st.mucs.find((m) => m[0] === T2.khoa) || [])[1], thuMuc: fs.readdirSync(thuMucA).sort(),
    goc: [T1, T2].map((t) => fs.existsSync(path.join(anh, t.khoa)) && ino(path.join(anh, t.khoa)) === goc0[t.khoa].ino), bao: st.bao }
  // Ctrl/Cmd+Z -> hai tam ve lai khung
  await phimBam('z', [MOD]); await cho(1100)
  st = await trangThai()
  kq.sauHoanTac = { t1: (st.mucs.find((m) => m[0] === T1.khoa) || [])[1], t2: (st.mucs.find((m) => m[0] === T2.khoa) || [])[1], thuMuc: fs.readdirSync(thuMucA).sort() }
  // Delete tren tam KHONG thuoc khung: khong xoa gi
  await phimBam('Escape')
  { const c = await pos(T3); await bam(c.x, c.y) }
  await phimBam('Delete'); await cho(500)
  st = await trangThai()
  kq.deleteTamRoi = { conFile: fs.existsSync(path.join(anh, T3.khoa)) && ino(path.join(anh, T3.khoa)) === goc0[T3.khoa].ino, conTrenBang: !!st.mucs.find((m) => m[0] === T3.khoa), bao: st.bao }
  // Ctrl+A chon het
  await phimBam('a', [MOD]); await cho(200)
  st = await trangThai()
  kq.chonHet = { sel: st.sel.length, mucs: st.mucs.length }
  await phimBam('Escape')

  // A4: xoa khung (chi con ban noi) — bam lan 1 chi nhac, lan 2 moi xoa
  const taiA = await js(`(() => { const e = document.querySelector('.khung[data-k=${JSON.stringify(kA.id)}] .tai svg'), r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
  await bam(taiA.x, taiA.y)
  st = await trangThai()
  kq.chonKhung = st.sel
  await phimBam('Delete'); await cho(500)
  st = await trangThai()
  kq.xoaKhungLan1 = { conKhung: st.khung.some((k) => k.id === kA.id), conThuMuc: fs.existsSync(thuMucA), bao: st.bao }
  await phimBam('Delete'); await cho(1000)
  st = await trangThai()
  kq.xoaKhungLan2 = { conKhung: st.khung.some((k) => k.id === kA.id), conThuMuc: fs.existsSync(thuMucA), t1: (st.mucs.find((m) => m[0] === T1.khoa) || [])[1], t2: (st.mucs.find((m) => m[0] === T2.khoa) || [])[1] }
  kq.sauXoaKhungGoc = [T1, T2].map((t) => fs.existsSync(path.join(anh, t.khoa)) && ino(path.join(anh, t.khoa)) === goc0[t.khoa].ino && fs.statSync(path.join(anh, t.khoa)).size === goc0[t.khoa].size)
  await chup('4-sau-xoa-khung.png')

  // khung co FILE RIENG cua nguoi dung: khong duoc xoa
  await bam(nutThem.x, nutThem.y); await cho(700)
  await phimBam('Return'); await cho(300)
  st = await trangThai()
  const kB = st.khung[st.khung.length - 1]
  const thuMucB = path.join(anh, kB.ten), rieng = path.join(thuMucB, 'cua-toi.txt')
  fs.writeFileSync(rieng, Buffer.from('file rieng cua nguoi dung'))
  const taiB = await js(`(() => { const e = document.querySelector('.khung[data-k=${JSON.stringify(kB.id)}] .tai svg'), r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
  await bam(taiB.x, taiB.y)
  await phimBam('Delete'); await cho(400)
  await phimBam('Delete'); await cho(1000)
  st = await trangThai()
  kq.xoaKhungCoFileRieng = { conKhung: st.khung.some((k) => k.id === kB.id), conThuMuc: fs.existsSync(thuMucB), conFile: fs.existsSync(rieng), noiDung: doc2(rieng) && doc2(rieng).toString(), bao: st.bao }
  await chup('5-cuoi.png')
}
