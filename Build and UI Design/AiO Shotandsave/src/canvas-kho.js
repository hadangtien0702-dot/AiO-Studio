'use strict'
/* =========================================================================
   CANVAS Y TUONG (12/10/2026) — phan THU MUC + SO BO CUC. Khong goi electron -> bai do an: npm run test:canvas.
   Anh Tien: "Canvas hinh anh thu thap va group o canvas, folder se group theo va dat ten y chang" · "canvas giong mirror
   (= app MIRO) - mot canvas tong hop y tuong" · "tat ca hinh anh chup - video - story se duoc mo trong canvas" · dong bo HAI chieu.

   NGUOI XAI: mot bang tu do bay moi anh / video / dai Storyboard da thu thap. Keo mot tam vao KHUNG la no thuoc khung do; moi khung
   la mot THU MUC CON cung ten trong thu muc anh. Doi ten khung = doi ten thu muc. Tao / doi ten / xoa thu muc trong Finder thi lan mo
   sau bang doi theo.

   LUAT AN TOAN (anh chua chot "chuyen han file hay de nguyen" -> chon cach KHONG pha gi):
   - Anh GOC luon nam yen o thu muc anh. Vao khung = tao BAN NOI (hard link) trong thu muc con: mo thu muc van thay anh that, khong
     ton them dia, anh da keo vao Premiere khong mat. O dia khong cho ban noi thi chep, va GHI SO ban chep do (`chep`).
   - Ra khoi khung = bo ban noi. CHI bo khi chac no la cua minh: cung ma file (inode) voi anh goc, hoac la ban chep da ghi so va
     con dung kich thuoc. File khac trung ten (nguoi dung tu bo vao) thi DE NGUYEN, tam anh nam lai trong khung.
   - Khong bao gio xoa thu muc, khong bao gio dung toi anh goc.
   - So bo cuc doc theo 3 nghia (so loi #16, #17): chua co -> mac dinh · khong doc duoc -> dung ban trong RAM, CAM ghi de ·
     hong -> cat sang bo-cuc.hong-<gio>.json roi moi dung mac dinh.

   SO: <userData>/canvas/bo-cuc.json
     { v: 1, khung: [{ id, ten, mau, x, y, w, h, ino }], vt: { "<khoa>": { x, y } }, thuoc: { "dai:<id>": "<id khung>" }, chep: { "<id khung>/<ten>": <byte> } }
   KHOA cua mot tam: "<ten file>" (anh / video o thu muc goc) · "k:<id khung>/<ten file>" (file CHI co trong thu muc con) · "dai:<id>".
   ========================================================================= */
const fs = require('fs')
const path = require('path')

let FILE = null
let ghiLog = () => {}
let ram = null       // ban bo cuc moi nhat doc / ghi duoc
let camGhi = false   // true = file co nhung KHONG doc duoc -> khong ghi de len no

const MAU = ['#f86820', '#2dd4bf', '#a78bfa', '#ffd65a', '#f472b6', '#4ade80']
const O = { W: 184, H: 150, WD: 372, KC: 22, LE: 26 }                 // kich thuoc mot tam + khoang cach (don vi bang)
const K0 = { W: 640, H: 400, X0: 40, Y0: 300, BX: 720, BY: 520, COT: 3, WMIN: 240, HMIN: 180 }
const COT_NGOAI = 8
const LA_ANH = /\.(png|jpe?g)$/i
const LA_VIDEO = /\.mp4$/i
const KY_TU_CAM = '\\/:*?"<>|'
const TEN_DANH_RIENG = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

const kieuCua = (t) => (LA_ANH.test(t) ? 'anh' : LA_VIDEO.test(t) ? 'video' : null)
const boQuaGoc = (t) => t.startsWith('.') || t.startsWith('shotandsave-storyboard-')
/* macOS co the tra ten thu muc o dang tach dau (NFD): "Tham khảo" doc ve khac byte voi chu nguoi dung go -> so bang NFC + chu thuong. */
const khoaTen = (s) => String(s).normalize('NFC').toLowerCase()
const macDinh = () => ({ v: 1, khung: [], vt: {}, thuoc: {}, chep: {} })

function khoiTao(thuMucUserData, log) {
  FILE = path.join(thuMucUserData, 'canvas', 'bo-cuc.json')
  ram = null; camGhi = false
  if (typeof log === 'function') ghiLog = log
}

/** Ten thu muc hop le tren ca Windows lan macOS, hoac null. */
function tenHopLe(s) {
  let t = [...String(s == null ? '' : s).normalize('NFC')].filter((c) => c.charCodeAt(0) >= 32 && !KY_TU_CAM.includes(c)).join('')
  t = t.split(' ').filter(Boolean).join(' ').slice(0, 60).trim()
  while (t.endsWith('.') || t.endsWith(' ')) t = t.slice(0, -1)
  if (!t || t.startsWith('.') || TEN_DANH_RIENG.test(t)) return null
  return t
}

function chuan(o) {
  const bc = macDinh()
  if (Array.isArray(o.khung)) {
    for (const k of o.khung) {
      if (!k || typeof k.id !== 'string' || typeof k.ten !== 'string') continue
      bc.khung.push({ id: k.id, ten: k.ten, mau: typeof k.mau === 'string' ? k.mau : MAU[bc.khung.length % MAU.length],
        x: Number(k.x) || 0, y: Number(k.y) || 0, w: Math.max(K0.WMIN, Number(k.w) || K0.W), h: Math.max(K0.HMIN, Number(k.h) || K0.H), ino: k.ino ? String(k.ino) : '' })
    }
  }
  for (const ten of ['vt', 'thuoc', 'chep']) if (o[ten] && typeof o[ten] === 'object' && !Array.isArray(o[ten])) bc[ten] = o[ten]
  return bc
}

/** Doc so. Tra { bc, loi }: loi = null (doc duoc / chua co) · 'doc' (khong doc duoc, CAM ghi de) · 'hong' (da cat file hong). */
function docBoCuc() {
  if (!FILE) return { bc: macDinh(), loi: 'chua-khoi-tao' }
  let s
  try { s = fs.readFileSync(FILE, 'utf8') } catch (e) {
    if (e && e.code === 'ENOENT') { camGhi = false; if (!ram) ram = macDinh(); return { bc: ram, loi: null } }
    camGhi = true
    ghiLog('canvas: KHONG doc duoc bo-cuc.json (' + (e && e.code) + ') -> dung ban trong RAM, khong ghi de')
    return { bc: ram || macDinh(), loi: 'doc' }
  }
  try {
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
    const o = JSON.parse(s)
    if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('khong phai doi tuong')
    camGhi = false; ram = chuan(o)
    return { bc: ram, loi: null }
  } catch (e) {
    const d = new Date(), p = (v) => String(v).padStart(2, '0')
    const cat = FILE.replace(/\.json$/, '.hong-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.json')
    try { fs.renameSync(FILE, cat); ghiLog('canvas: bo-cuc.json HONG (' + e.message + ') -> cat sang ' + path.basename(cat)) } catch (e2) {
      camGhi = true; ghiLog('canvas: bo-cuc.json hong va KHONG cat duoc (' + (e2 && e2.code) + ') -> khong ghi de')
      return { bc: ram || macDinh(), loi: 'doc' }
    }
    camGhi = false; ram = macDinh()
    return { bc: ram, loi: 'hong' }
  }
}

/** Ghi so (tmp + doi ten). Tra false neu khong ghi (dang cam ghi / loi) — ban trong RAM van giu. */
function ghiBoCuc(bc) {
  ram = bc
  if (!FILE || camGhi) return false
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    const tam = FILE + '.tmp'
    fs.writeFileSync(tam, JSON.stringify(bc))
    fs.renameSync(tam, FILE)
    return true
  } catch (e) { ghiLog('canvas: ghi bo-cuc.json LOI ' + (e && e.code)); return false }
}

function thongTin(p) {
  try {
    const s = fs.statSync(p, { bigint: true })
    return { ino: String(s.ino), laThuMuc: s.isDirectory(), laFile: s.isFile(), mtime: Number(s.mtimeMs), size: Number(s.size) }
  } catch (e) { return null }
}

/** Quet thu muc anh: file o goc + thu muc con (mot tang). Bo qua moi thu bat dau bang dau cham (.keo, .DS_Store...). */
function quet(goc) {
  const kq = { file: [], con: [] }
  let ds
  try { ds = fs.readdirSync(goc, { withFileTypes: true }) } catch (e) { return kq }
  for (const d of ds) {
    const t = d.name
    if (t.startsWith('.')) continue
    const p = path.join(goc, t)
    if (d.isDirectory()) {
      const st = thongTin(p); if (!st) continue
      const c = { ten: t, ino: st.ino, file: [] }
      let trong = []
      try { trong = fs.readdirSync(p, { withFileTypes: true }) } catch (e) {}
      for (const f of trong) {
        if (!f.isFile() || f.name.startsWith('.')) continue
        const k = kieuCua(f.name); if (!k) continue
        const s2 = thongTin(path.join(p, f.name))
        if (s2) c.file.push({ ten: f.name, kieu: k, ino: s2.ino, mtime: s2.mtime })
      }
      kq.con.push(c)
    } else if (d.isFile()) {
      if (boQuaGoc(t)) continue
      const k = kieuCua(t); if (!k) continue
      const st = thongTin(p)
      if (st) kq.file.push({ ten: t, kieu: k, ino: st.ino, mtime: st.mtime })
    }
  }
  kq.con.sort((a, b) => (khoaTen(a.ten) < khoaTen(b.ten) ? -1 : 1))
  return kq
}

const giao = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const kichMuc = (kieu) => ({ w: kieu === 'dai' ? O.WD : O.W, h: O.H })
/** Khung chua diem (tam cua mot tam anh). Khung sau de len khung truoc -> lay khung cuoi. */
function khungChua(khung, cx, cy) {
  let kq = null
  for (const k of khung) if (cx >= k.x && cx <= k.x + k.w && cy >= k.y && cy <= k.y + k.h) kq = k
  return kq
}
let demId = 0
function khungMoi(khung, ten, ino, x, y) {
  const k = { id: 'k' + Date.now().toString(36) + (demId++).toString(36), ten, mau: MAU[khung.length % MAU.length], x: 0, y: 0, w: K0.W, h: K0.H, ino: ino ? String(ino) : '' }
  if (Number.isFinite(x) && Number.isFinite(y)) { k.x = Math.round(x); k.y = Math.round(y); return k }
  for (let i = 0; i < 400; i++) { // o trong dau tien khong de len khung nao
    k.x = K0.X0 + (i % K0.COT) * K0.BX; k.y = K0.Y0 + Math.floor(i / K0.COT) * K0.BY
    if (!khung.some((o) => giao({ x: k.x, y: k.y - 40, w: k.w, h: k.h + 40 }, { x: o.x, y: o.y - 40, w: o.w, h: o.h + 40 }))) break
  }
  return k
}

/**
 * Khop SO voi DIA: thu muc la su that ve "tam nao thuoc khung nao", so chi giu vi tri + mau.
 * dais: [{ id, mtime, khung: [seq...] }] (dai Storyboard, khong nam trong thu muc anh).
 * Tra { bc (ban moi), doi (co phai ghi lai), tt (trang thai cho trang ve) }.
 */
function dongBo(bc0, q, dais) {
  const bc = chuan(JSON.parse(JSON.stringify(bc0 || macDinh())))
  let doi = false
  // --- 1. khung <-> thu muc con: khop theo MA THU MUC truoc (doi ten trong Finder van nhan ra), roi moi theo ten ---
  const daDung = new Set(), khop = new Map()
  for (const k of bc.khung) { const c = k.ino ? q.con.find((x) => x.ino === k.ino && !daDung.has(x)) : null; if (c) { khop.set(k, c); daDung.add(c) } }
  for (const k of bc.khung) { if (khop.has(k)) continue; const c = q.con.find((x) => khoaTen(x.ten) === khoaTen(k.ten) && !daDung.has(x)); if (c) { khop.set(k, c); daDung.add(c) } }
  const khung = []
  for (const k of bc.khung) {
    const c = khop.get(k)
    if (!c) { doi = true; continue }                       // thu muc da bi xoa ngoai Finder -> khung di theo
    if (k.ten !== c.ten || k.ino !== c.ino) { k.ten = c.ten; k.ino = c.ino; doi = true }
    khung.push(k)
  }
  for (const c of q.con) if (!daDung.has(c)) {
    const k = khungMoi(khung, c.ten, c.ino)
    const cot = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(c.file.length))))   // thu muc nhieu anh thi khung rong hon, khong dai le the
    k.w = Math.max(K0.W, cot * (O.W + O.KC) - O.KC + 2 * O.LE)
    khung.push(k); doi = true
  }
  bc.khung = khung
  const theoId = new Map(khung.map((k) => [k.id, k])), theoTen = new Map(khung.map((k) => [khoaTen(k.ten), k]))
  // --- 2. cac tam ---
  const coGoc = new Set(q.file.map((f) => f.ten)), thanhVien = new Map(), mucs = []
  for (const c of q.con) {
    const k = theoTen.get(khoaTen(c.ten)); if (!k) continue
    for (const f of c.file) {
      if (coGoc.has(f.ten)) { if (!thanhVien.has(f.ten)) thanhVien.set(f.ten, k.id) }
      else mucs.push({ khoa: 'k:' + k.id + '/' + f.ten, kieu: f.kieu, tep: [c.ten, f.ten], mtime: f.mtime, khung: k.id, chiTrongKhung: true })
    }
  }
  for (const f of q.file) mucs.push({ khoa: f.ten, kieu: f.kieu, tep: [f.ten], mtime: f.mtime, khung: thanhVien.get(f.ten) || null })
  for (const d of dais || []) {
    const khoa = 'dai:' + d.id
    let kid = bc.thuoc[khoa] || null
    if (kid && !theoId.has(kid)) { kid = null; delete bc.thuoc[khoa]; doi = true }
    mucs.push({ khoa, kieu: 'dai', dai: d.id, seq: d.khung || [], mtime: d.mtime || 0, khung: kid })
  }
  mucs.sort((a, b) => a.mtime - b.mtime || (a.khoa < b.khoa ? -1 : 1))
  // --- 3. vi tri: giu cho cu neu con KHOP voi thu muc; khong thi xep vao o trong ---
  const canDat = []
  for (const m of mucs) {
    const v = bc.vt[m.khoa], kz = kichMuc(m.kieu)
    let ok = !!v && Number.isFinite(v.x) && Number.isFinite(v.y)
    if (ok) { const o = khungChua(khung, v.x + kz.w / 2, v.y + kz.h / 2); ok = (o ? o.id : null) === m.khung }
    if (ok) { m.x = v.x; m.y = v.y } else canDat.push(m)
  }
  /* Thu tu xep (bai do 800 anh bat duoc 12/10: khung 40 anh tu cao len roi DE len khung duoi -> moi lan mo lai xep lai):
     (a) tam TRONG khung truoc, khung no ra cho du · (b) day cac khung khoi nhau · (c) soat lai tam ngoai vua bi khung phu len
     · (d) tam NGOAI xep duoi day cua moi khung. */
  const hinh = (m) => Object.assign({ x: m.x, y: m.y }, kichMuc(m.kieu))
  function datVao(m, x0, y0, cot, cung) {
    const kz = kichMuc(m.kieu)
    for (let i = 0; i < 40000; i++) {
      const o = { x: x0 + (i % cot) * (O.W + O.KC), y: y0 + Math.floor(i / cot) * (O.H + O.KC), w: kz.w, h: kz.h }
      if (kz.w > O.W && (i % cot) === cot - 1 && cot > 1) continue          // dai rong 2 o: khong dat o cot cuoi
      if (cung.some((c) => giao(o, c))) continue
      m.x = o.x; m.y = o.y; cung.push(o); return
    }
    m.x = x0; m.y = y0
  }
  // (a)
  for (const k of khung) {
    const can = canDat.filter((m) => m.khung === k.id); if (!can.length) continue
    const cung = mucs.filter((o) => o.x != null && o.khung === k.id).map(hinh)
    const cot = Math.max(1, Math.floor((k.w - 2 * O.LE + O.KC) / (O.W + O.KC)))
    for (const m of can) {
      datVao(m, k.x + O.LE, k.y + O.LE, cot, cung)
      const kz = kichMuc(m.kieu)
      k.w = Math.max(k.w, m.x + kz.w + O.LE - k.x); k.h = Math.max(k.h, m.y + kz.h + O.LE - k.y)   // khung chi no ra, khong tu thu nho
    }
    doi = true
  }
  // (b) khung sau trong danh sach nhuong khung truoc: tut xuong duoi, mang theo cac tam cua no
  const vung = (k) => ({ x: k.x - 12, y: k.y - 46, w: k.w + 24, h: k.h + 58 })
  for (let lap = 0; lap < 300; lap++) {
    let dich = false
    for (let i = 1; i < khung.length; i++) for (let j = 0; j < i; j++) {
      if (!giao(vung(khung[i]), vung(khung[j]))) continue
      const dy = khung[j].y + khung[j].h + 80 - khung[i].y
      if (dy <= 0) continue
      khung[i].y += dy
      for (const m of mucs) if (m.khung === khung[i].id && m.y != null) m.y += dy
      dich = true; doi = true
    }
    if (!dich) break
  }
  // (c)
  for (const m of mucs) {
    if (m.khung || m.x == null) continue
    const kz = kichMuc(m.kieu)
    if (khungChua(khung, m.x + kz.w / 2, m.y + kz.h / 2)) { m.x = null; m.y = null; canDat.push(m) }
  }
  // (d)
  const ngoai = canDat.filter((m) => !m.khung)
  if (ngoai.length) {
    const day = khung.reduce((a, k) => Math.max(a, k.y + k.h), K0.Y0 - 190) + 120
    const cung = mucs.filter((o) => o.x != null && !o.khung).map(hinh)
    for (const m of ngoai) datVao(m, K0.X0, day, COT_NGOAI, cung)
    doi = true
  }
  const vt = {}
  for (const m of mucs) vt[m.khoa] = { x: Math.round(m.x), y: Math.round(m.y) }
  if (Object.keys(bc.vt).length !== Object.keys(vt).length) doi = true
  bc.vt = vt
  for (const kh of Object.keys(bc.chep)) { const id = kh.slice(0, kh.indexOf('/')); if (!theoId.has(id)) { delete bc.chep[kh]; doi = true } }
  const tt = {
    khung: khung.map((k) => ({ id: k.id, ten: k.ten, mau: k.mau, x: k.x, y: k.y, w: k.w, h: k.h })),
    muc: mucs.map((m) => Object.assign({ khoa: m.khoa, kieu: m.kieu, x: vt[m.khoa].x, y: vt[m.khoa].y, khung: m.khung, mtime: m.mtime }, kichMuc(m.kieu),
      m.kieu === 'dai' ? { dai: m.dai, seq: m.seq } : { tep: m.tep }, m.chiTrongKhung ? { chiTrongKhung: true } : null)),
  }
  return { bc, doi, tt }
}

/** Doc so + quet dia + khop. Ghi lai so neu co gi doi. */
function nap(goc, dais) {
  const d = docBoCuc()
  const r = dongBo(d.bc, quet(goc), dais)
  if (r.doi) ghiBoCuc(r.bc); else ram = r.bc
  return { tt: r.tt, loiSo: d.loi }
}
const boCucHienTai = () => ram || docBoCuc().bc

/** Trang gui vi tri moi sau khi keo: { khung: [{ id, x, y, w, h }], vt: { khoa: { x, y } } }. Chi nhan thu da co trong so. */
function luuViTri(p) {
  const bc = boCucHienTai()
  if (!p || typeof p !== 'object') return false
  for (const g of Array.isArray(p.khung) ? p.khung : []) {
    const k = bc.khung.find((x) => x.id === (g && g.id)); if (!k) continue
    if ([g.x, g.y, g.w, g.h].every(Number.isFinite)) { k.x = Math.round(g.x); k.y = Math.round(g.y); k.w = Math.max(K0.WMIN, Math.round(g.w)); k.h = Math.max(K0.HMIN, Math.round(g.h)) }
  }
  if (p.vt && typeof p.vt === 'object') for (const khoa of Object.keys(p.vt)) {
    const v = p.vt[khoa]
    if (bc.vt[khoa] && v && Number.isFinite(v.x) && Number.isFinite(v.y)) bc.vt[khoa] = { x: Math.round(v.x), y: Math.round(v.y) }
  }
  return ghiBoCuc(bc)
}

/** Tao khung = tao thu muc con. Ten trung thi them so. Tra { ok, khung } | { ok: false, loi }. */
function taoKhung(goc, tenGoiY, x, y) {
  const bc = boCucHienTai()
  const goc0 = tenHopLe(tenGoiY) || 'Thu muc moi'
  let ten = goc0
  for (let n = 2; n < 500 && (fs.existsSync(path.join(goc, ten)) || bc.khung.some((k) => khoaTen(k.ten) === khoaTen(ten))); n++) ten = goc0 + ' ' + n
  const dir = path.join(goc, ten)
  try { fs.mkdirSync(goc, { recursive: true }); fs.mkdirSync(dir) } catch (e) { ghiLog('canvas: tao thu muc LOI ' + (e && e.code)); return { ok: false, loi: 'he-thong', ct: e && e.code } }
  const st = thongTin(dir)
  const k = khungMoi(bc.khung, ten, st && st.ino, x, y)
  bc.khung.push(k); ghiBoCuc(bc)
  return { ok: true, khung: k }
}

/** Doi ten khung = doi ten thu muc. loi: 'ten' (khong hop le) · 'trung' (da co thu muc ten do) · 'he-thong'. */
function doiTenKhung(goc, id, tenMoi) {
  const bc = boCucHienTai(), k = bc.khung.find((x) => x.id === id)
  if (!k) return { ok: false, loi: 'khong-co-khung' }
  const t = tenHopLe(tenMoi)
  if (!t) return { ok: false, loi: 'ten' }
  if (t === k.ten) return { ok: true, ten: t }
  const cu = path.join(goc, k.ten), moi = path.join(goc, t)
  const sc = thongTin(cu), sm = thongTin(moi)
  if (!sc) return { ok: false, loi: 'he-thong', ct: 'mat-thu-muc' }
  if (sm && sm.ino !== sc.ino) return { ok: false, loi: 'trung' }     // cung ma = chi doi hoa / thuong tren o khong phan biet hoa thuong
  if (bc.khung.some((x) => x !== k && khoaTen(x.ten) === khoaTen(t))) return { ok: false, loi: 'trung' }
  try { fs.renameSync(cu, moi) } catch (e) { ghiLog('canvas: doi ten thu muc LOI ' + (e && e.code)); return { ok: false, loi: 'he-thong', ct: e && e.code } }
  k.ten = t; ghiBoCuc(bc)
  return { ok: true, ten: t }
}

/**
 * Dat mot tam vao khung (khungId) hoac ra ngoai moi khung (null).
 * Tra { ok, giu } — giu > 0: con ban trung ten o khung khac ma app KHONG duoc xoa (khong phai ban noi cua anh goc).
 */
function datThanhVien(goc, khoa, khungId) {
  const bc = boCucHienTai()
  khoa = String(khoa || '')
  const dich = khungId ? bc.khung.find((k) => k.id === khungId) : null
  if (khungId && !dich) return { ok: false, loi: 'khong-co-khung' }
  if (khoa.startsWith('dai:')) { if (dich) bc.thuoc[khoa] = dich.id; else delete bc.thuoc[khoa]; ghiBoCuc(bc); return { ok: true, giu: 0 } }
  if (khoa.startsWith('k:')) return { ok: false, loi: 'chi-trong-thu-muc' }
  if (!khoa || khoa !== path.basename(khoa) || khoa.startsWith('.') || !kieuCua(khoa)) return { ok: false, loi: 'ten' }
  const gocF = path.join(goc, khoa), sg = thongTin(gocF)
  if (!sg || !sg.laFile) return { ok: false, loi: 'mat-goc' }
  let giu = 0
  for (const k of bc.khung) {
    const p = path.join(goc, k.ten, khoa), sp = thongTin(p), kh = k.id + '/' + khoa
    if (dich && k.id === dich.id) {
      if (sp) continue                                       // da co san trong thu muc do
      try { fs.linkSync(gocF, p) } catch (e) {
        try { fs.copyFileSync(gocF, p, fs.constants.COPYFILE_EXCL); bc.chep[kh] = sg.size; ghiLog('canvas: o dia khong cho ban noi (' + (e && e.code) + ') -> chep ' + khoa) }
        catch (e2) { ghiLog('canvas: dua vao thu muc LOI ' + (e2 && e2.code)); ghiBoCuc(bc); return { ok: false, loi: 'he-thong', ct: e2 && e2.code } }
      }
    } else if (sp) {
      const cuaMinh = sp.ino === sg.ino || (bc.chep[kh] != null && bc.chep[kh] === sp.size && sp.size === sg.size)
      if (!cuaMinh) { giu++; continue }                      // file KHAC trung ten: khong phai cua app -> de nguyen
      try { fs.unlinkSync(p); delete bc.chep[kh] } catch (e) { giu++; ghiLog('canvas: bo ban noi LOI ' + (e && e.code)) }
    }
  }
  ghiBoCuc(bc)
  return { ok: true, giu }
}

module.exports = { khoiTao, tenHopLe, docBoCuc, ghiBoCuc, quet, dongBo, nap, boCucHienTai, luuViTri, taoKhung, doiTenKhung, datThanhVien, khungChua, O, K0, MAU }
