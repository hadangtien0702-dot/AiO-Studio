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
   - Khong bao gio dung toi anh goc. Chi xoa mot THU MUC khi nguoi dung bam "Xoa khung" VA trong do chi con ban noi / ban chep cua anh
     goc (xoaKhung, 12/10); con file khac thi tu choi. Nhan doi anh / dua file tu ngoai vao = CHEP, khong dung toi file goc.
   - So bo cuc doc theo 3 nghia (so loi #16, #17): chua co -> mac dinh · khong doc duoc -> dung ban trong RAM, CAM ghi de ·
     hong -> cat sang bo-cuc.hong-<gio>.json roi moi dung mac dinh.

   SO: <userData>/canvas/bo-cuc.json
     { v: 1, khung: [{ id, ten, mau, x, y, w, h, ino }], vt: { "<khoa>": { x, y } }, thuoc: { "dai:<id>": "<id khung>" }, chep: { "<id khung>/<ten>": <byte> } }
   KHOA cua mot tam: "<ten file>" (anh / video o thu muc goc) · "k:<id khung>/<ten file>" (file CHI co trong thu muc con) · "dai:<id>".
   ========================================================================= */
const fs = require('fs')
const { ghiBen } = require('./ghi-ben')
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
const macDinh = () => ({ v: 1, khung: [], vt: {}, thuoc: {}, chep: {}, ban: {}, vat: [], noi: [], net: [], z: {}, khoa: {} })
/* 06/11 (soat Codex, loi 1 / 2 / 6): app NHO ban noi / ban chep nao la CUA MINH bang `ban["<id khung>/<ten>"]` = { ino, size, mtime } cua file
   trong khung + { gIno, gSize, gMtime } cua anh goc luc do. Chi file con KHOP ba so dau moi coi la cua app (xoa duoc, coi la thanh vien).
   Truoc day chi so kich thuoc: nguoi dung thay ban chep bang anh khac cung so byte la app xoa nham anh moi. */
const mungLa = (a, b) => !!a && !!b && !!a.ino && a.ino !== '0' && a.ino === b.ino && a.dev === b.dev
const banMoi = (sp, sg) => ({ ino: sp.ino, size: sp.size, mtime: sp.mtime, gIno: sg.ino, gSize: sg.size, gMtime: sg.mtime })
const banKhop = (r, f) => !!r && !!f && r.ino === f.ino && r.size === f.size && r.mtime === Number(f.mtime)
let chuaGhi = false   // true = lan ghi gan nhat that bai: ban trong RAM MOI hon file tren dia -> khong duoc doc de len RAM

/* ---- 12/10 (anh: "mirro - figjam co gi lam tuong tu di em"): cac thu KHONG phai anh tren bang. Chi nam trong so bo cuc, KHONG
   tao file trong thu muc anh. Khoa trong z / khoa / diem noi: 'o:<khoa tam>' · 'v:<id vat>' · 's:<id net>' · 'f:<id khung>'. ---- */
const LOAI_VAT = ['ghi', 'chu', 'hinh', 'link']
const HINH_VAT = ['vuong', 'tron', 'thoi']
const MAU_HEX = /^#[0-9a-f]{6}$/i
const TRAN = { vat: 3000, noi: 3000, net: 2000, diem: 6000, chu: 2000, url: 600, khoa: 700 }
const RE_KHOA = /^[ovsf]:/
const lam1 = (v, a, b, mac) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, Math.round(v))) : mac }
const idHopLe = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(s)
const diemNoi = (p) => {
  if (!p || typeof p !== 'object') return null
  if (typeof p.k === 'string' && p.k.length <= TRAN.khoa && RE_KHOA.test(p.k)) return { k: p.k }
  const x = Number(p.x), y = Number(p.y)
  return Number.isFinite(x) && Number.isFinite(y) ? { x: Math.round(x), y: Math.round(y) } : null
}
function lamSachVat(ds) {
  const kq = [], thay = new Set()
  for (const v of (Array.isArray(ds) ? ds : []).slice(0, TRAN.vat)) {
    if (!v || !idHopLe(v.id) || thay.has(v.id) || !LOAI_VAT.includes(v.loai)) continue
    thay.add(v.id)
    const o = { id: v.id, loai: v.loai, x: lam1(v.x, -1e6, 1e6, 0), y: lam1(v.y, -1e6, 1e6, 0), w: lam1(v.w, 40, 2000, 160), h: lam1(v.h, 24, 2000, 120),
      mau: typeof v.mau === 'string' && MAU_HEX.test(v.mau) ? v.mau : '#ffe27a', chu: typeof v.chu === 'string' ? v.chu.slice(0, TRAN.chu) : '', tao: lam1(v.tao, 0, 9e15, 0) }
    if (v.loai === 'hinh') o.hinh = HINH_VAT.includes(v.hinh) ? v.hinh : 'vuong'
    if (v.loai === 'link') o.url = typeof v.url === 'string' ? v.url.slice(0, TRAN.url) : ''
    kq.push(o)
  }
  return kq
}
function lamSachNoi(ds) {
  const kq = [], thay = new Set()
  for (const n of (Array.isArray(ds) ? ds : []).slice(0, TRAN.noi)) {
    if (!n || !idHopLe(n.id) || thay.has(n.id)) continue
    const a = diemNoi(n.a), b = diemNoi(n.b); if (!a || !b) continue
    thay.add(n.id)
    kq.push({ id: n.id, a, b, mau: typeof n.mau === 'string' && MAU_HEX.test(n.mau) ? n.mau : '#f86820' })
  }
  return kq
}
function lamSachNet(ds) {
  const kq = [], thay = new Set()
  for (const n of (Array.isArray(ds) ? ds : []).slice(0, TRAN.net)) {
    if (!n || !idHopLe(n.id) || thay.has(n.id) || (n.loai !== 'but' && n.loai !== 'daquang') || !Array.isArray(n.pts)) continue
    const pts = []
    for (let i = 0; i + 1 < n.pts.length && pts.length < TRAN.diem * 2; i += 2) {
      const x = Number(n.pts[i]), y = Number(n.pts[i + 1])
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10)
    }
    if (pts.length < 2) continue
    thay.add(n.id)
    kq.push({ id: n.id, loai: n.loai, mau: typeof n.mau === 'string' && MAU_HEX.test(n.mau) ? n.mau : '#f86820', pts })
  }
  return kq
}
function lamSachBang(o, laKhoa) {
  const kq = {}
  if (!o || typeof o !== 'object' || Array.isArray(o)) return kq
  for (const k of Object.keys(o).slice(0, 20000)) {
    if (k.length > TRAN.khoa || !RE_KHOA.test(k)) continue
    if (laKhoa) { if (o[k]) kq[k] = true } else { const n = Number(o[k]); if (Number.isFinite(n)) kq[k] = Math.max(-1e6, Math.min(1e6, Math.round(n))) }
  }
  return kq
}

function khoiTao(thuMucUserData, log) {
  FILE = path.join(thuMucUserData, 'canvas', 'bo-cuc.json')
  ram = null; camGhi = false; chuaGhi = false
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
  for (const ten of ['vt', 'thuoc', 'chep', 'ban']) if (o[ten] && typeof o[ten] === 'object' && !Array.isArray(o[ten])) bc[ten] = o[ten]
  bc.vat = lamSachVat(o.vat); bc.noi = lamSachNoi(o.noi); bc.net = lamSachNet(o.net)
  bc.z = lamSachBang(o.z, false); bc.khoa = lamSachBang(o.khoa, true)
  return bc
}

/** Doc so. Tra { bc, loi }: loi = null (doc duoc / chua co) · 'doc' (khong doc duoc, CAM ghi de) · 'hong' (da cat file hong). */
function docBoCuc() {
  if (!FILE) return { bc: macDinh(), loi: 'chua-khoi-tao' }
  if (chuaGhi && ram) return { bc: ram, loi: null }   // loi 4: lan luu truoc that bai -> ban RAM moi hon dia, KHONG doc dia de len no
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
    ghiBen(FILE, JSON.stringify(bc)) // tmp + ep xuong dia + doi ten, xem ghi-ben.js
    chuaGhi = false
    return true
  } catch (e) { chuaGhi = true; ghiLog('canvas: ghi bo-cuc.json LOI ' + (e && e.code)); return false }
}
/** true = thay doi gan nhat CHUA xuong dia (o day day, mat quyen ghi, hoac so dang bi cam ghi de) -> trang phai bao nguoi dung. */
const khongGhiDuoc = () => chuaGhi || camGhi

function thongTin(p) {
  try {
    const s = fs.statSync(p, { bigint: true })
    return { ino: String(s.ino), dev: String(s.dev), laThuMuc: s.isDirectory(), laFile: s.isFile(), mtime: Number(s.mtimeMs), size: Number(s.size) }
  } catch (e) { return null }
}

/** Quet thu muc anh: file o goc + thu muc con (mot tang). Bo qua moi thu bat dau bang dau cham (.keo, .DS_Store...). */
function quet(goc) {
  const kq = { file: [], con: [] }
  let ds
  try { ds = fs.readdirSync(goc, { withFileTypes: true }) } catch (e) { kq.loi = (e && e.code) || 'loi'; return kq }   // loi 3: KHONG duoc coi la "thu muc rong"
  for (const d of ds) {
    const t = d.name
    if (t.startsWith('.')) continue
    const p = path.join(goc, t)
    if (d.isDirectory()) {
      const st = thongTin(p); if (!st) continue
      const c = { ten: t, ino: st.ino, file: [] }
      let trong = []
      try { trong = fs.readdirSync(p, { withFileTypes: true }) } catch (e) { kq.loi = (e && e.code) || 'loi' }
      for (const f of trong) {
        if (!f.isFile() || f.name.startsWith('.')) continue
        const k = kieuCua(f.name); if (!k) continue
        const s2 = thongTin(path.join(p, f.name))
        if (s2) c.file.push({ ten: f.name, kieu: k, ino: s2.ino, dev: s2.dev, size: s2.size, mtime: s2.mtime })
      }
      kq.con.push(c)
    } else if (d.isFile()) {
      if (boQuaGoc(t)) continue
      const k = kieuCua(t); if (!k) continue
      const st = thongTin(p)
      if (st) kq.file.push({ ten: t, kieu: k, ino: st.ino, dev: st.dev, size: st.size, mtime: st.mtime })
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
  const gocTheoTen = new Map(q.file.map((f) => [f.ten, f])), thanhVien = new Map(), mucs = []
  for (const c of q.con) {
    const k = theoTen.get(khoaTen(c.ten)); if (!k) continue
    for (const f of c.file) {
      const g = gocTheoTen.get(f.ten)
      /* loi 6 (06/11): trung TEN chua du de coi la thanh vien. Phai la ban noi cung ma file voi anh goc, hoac ban app da ghi so (`ban`) va
         con nguyen; anh KHAC noi dung cung ten thi hien rieng trong khung (khoa 'k:...'), khong bi nhap lam mot voi anh goc. */
      if (g && (mungLa(f, g) || banKhop(bc.ban[k.id + '/' + f.ten], f))) { if (!thanhVien.has(f.ten)) thanhVien.set(f.ten, k.id) }
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
  for (const ten of ['chep', 'ban']) for (const kh of Object.keys(bc[ten])) { const id = kh.slice(0, kh.indexOf('/')); if (!theoId.has(id)) { delete bc[ten][kh]; doi = true } }
  // --- 4. vat / mui ten / net: bo thu da mat cho (anh bi xoa ngoai Finder, khung di theo thu muc...) ---
  const co = new Set()
  for (const m of mucs) co.add('o:' + m.khoa)
  for (const v of bc.vat) co.add('v:' + v.id)
  for (const n of bc.net) co.add('s:' + n.id)
  for (const k of khung) co.add('f:' + k.id)
  const noiSong = bc.noi.filter((n) => [n.a, n.b].every((d) => !d.k || co.has(d.k)))
  if (noiSong.length !== bc.noi.length) { bc.noi = noiSong; doi = true }
  for (const ten of ['z', 'khoa']) for (const k of Object.keys(bc[ten])) if (!co.has(k)) { delete bc[ten][k]; doi = true }
  const tt = {
    vat: bc.vat, noi: bc.noi, net: bc.net, z: bc.z, khoa: bc.khoa,
    khung: khung.map((k) => ({ id: k.id, ten: k.ten, mau: k.mau, x: k.x, y: k.y, w: k.w, h: k.h })),
    muc: mucs.map((m) => Object.assign({ khoa: m.khoa, kieu: m.kieu, x: vt[m.khoa].x, y: vt[m.khoa].y, khung: m.khung, mtime: m.mtime }, kichMuc(m.kieu),
      m.kieu === 'dai' ? { dai: m.dai, seq: m.seq } : { tep: m.tep }, m.chiTrongKhung ? { chiTrongKhung: true } : null)),
  }
  return { bc, doi, tt }
}

/** Doc so + quet dia + khop. Ghi lai so neu co gi doi. */
function nap(goc, dais) {
  if (chuaGhi && ram) ghiBoCuc(ram)             // loi 4: lan luu truoc that bai -> thu ghi lai ban RAM (moi hon dia) truoc khi lam gi khac
  const d = docBoCuc()
  let q = quet(goc)
  const soTrong = !d.bc.khung.length && !Object.keys(d.bc.vt).length
  if (q.loi && !(q.loi === 'ENOENT' && soTrong)) {
    /* loi 3 (06/11): thu muc anh tam thoi khong doc duoc (USB / o mang ngat). Chi ve de nguoi dung thay, TUYET DOI khong ghi de so bo cuc
       va khong thay ban RAM: dongBo tren danh sach rong se coi moi khung la "da bi xoa". */
    if (!napLoiThuMuc) ghiLog('canvas: KHONG doc duoc thu muc anh (' + q.loi + ') -> khong dong bo, khong ghi de bo-cuc.json')
    napLoiThuMuc = true
    const r = dongBo(d.bc, { file: [], con: [] }, dais)
    r.tt.loiThuMuc = true
    return { tt: r.tt, loiSo: d.loi, loiGhi: khongGhiDuoc() }
  }
  napLoiThuMuc = false
  const bc = d.bc
  const dd = baoDamBanNoi(goc, bc, q)
  if (dd.laiQuet) q = quet(goc)
  const r = dongBo(bc, q, dais)
  if (r.doi || dd.doi) ghiBoCuc(r.bc); else ram = r.bc
  return { tt: r.tt, loiSo: d.loi, loiGhi: khongGhiDuoc() }
}
let napLoiThuMuc = false

/** So sanh noi dung hai file theo tung khoi 1 MB (dung som khi khac). */
function giongNoiDung(a, b) {
  let fa = null, fb = null
  try {
    fa = fs.openSync(a, 'r'); fb = fs.openSync(b, 'r')
    const ba = Buffer.alloc(1 << 20), bb = Buffer.alloc(1 << 20)
    for (;;) {
      const na = fs.readSync(fa, ba, 0, ba.length, null), nb = fs.readSync(fb, bb, 0, bb.length, null)
      if (na !== nb) return false
      if (na === 0) return true
      if (ba.compare(bb, 0, nb, 0, na) !== 0) return false
    }
  } catch (e) { return false } finally { for (const f of [fa, fb]) if (f != null) { try { fs.closeSync(f) } catch (e) {} } }
}

/** Dua ban noi / ban chep trong khung ve dung anh goc HIEN TAI (loi 2): link moi / chep moi ra ten tam roi doi ten de len file cu. */
function thayBanNoi(bc, kh, gocF, p) {
  const tam = p + '.aio-moi-' + process.pid
  let chep = false
  try {
    try { fs.linkSync(gocF, tam) } catch (e) { fs.copyFileSync(gocF, tam, fs.constants.COPYFILE_EXCL); chep = true }
    fs.renameSync(tam, p)
  } catch (e) {
    try { fs.unlinkSync(tam) } catch (e2) {}
    // khong thay duoc: BO ban cu cua app (anh goc con nguyen) con hon de ban chua che nam lai trong thu muc khung
    try { fs.unlinkSync(p); delete bc.ban[kh]; delete bc.chep[kh]; ghiLog('canvas: khong thay duoc ban noi cu (' + (e && e.code) + ') -> da bo ban cu trong khung: ' + kh) } catch (e3) { ghiLog('canvas: KHONG thay va KHONG bo duoc ban noi cu ' + kh + ' (' + (e3 && e3.code) + ')') }
    return false
  }
  const sp = thongTin(p), sg = thongTin(gocF)
  if (sp && sg) bc.ban[kh] = banMoi(sp, sg)
  if (chep && sp) bc.chep[kh] = sp.size; else delete bc.chep[kh]
  ghiLog('canvas: anh goc da doi -> lam moi ban trong khung ' + kh)
  return true
}
const goiDoi = (r, g) => r.gIno !== g.ino || r.gSize !== g.size || r.gMtime !== Number(g.mtime)

/**
 * Doi chieu cac ban noi trong khung voi anh goc: (a) ban noi cung ma file -> ghi so; (b) ban chep cu chi co kich thuoc -> nhan khi
 * giong HET noi dung anh goc; (c) ban cua app con nguyen nhung anh goc da bi DOI (vd: Che xong luu de len anh goc) -> lam moi,
 * khong de ban CU chua che nam trong thu muc khung (loi 2). Tra { doi, laiQuet }.
 */
function baoDamBanNoi(goc, bc, q) {
  const kq = { doi: false, laiQuet: false }
  const gocTheoTen = new Map(q.file.map((f) => [f.ten, f]))
  const dung = new Set()
  for (const k of bc.khung) {
    let c = k.ino ? q.con.find((x) => x.ino === k.ino && !dung.has(x)) : null
    if (!c) c = q.con.find((x) => khoaTen(x.ten) === khoaTen(k.ten) && !dung.has(x))
    if (!c) continue
    dung.add(c)
    for (const f of c.file) {
      const g = gocTheoTen.get(f.ten); if (!g) continue
      const kh = k.id + '/' + f.ten, r = bc.ban[kh]
      if (mungLa(f, g)) { if (!r || r.ino !== f.ino || r.gIno !== g.ino || r.gMtime !== Number(g.mtime) || r.gSize !== g.size || r.mtime !== Number(f.mtime)) { bc.ban[kh] = banMoi(f, g); kq.doi = true } continue }
      if (banKhop(r, f)) {
        if (goiDoi(r, g) && thayBanNoi(bc, kh, path.join(goc, f.ten), path.join(goc, c.ten, f.ten))) { kq.doi = true; kq.laiQuet = true }
        else if (goiDoi(r, g)) { kq.doi = true; kq.laiQuet = true }   // khong thay duoc -> da bo ban cu
        continue
      }
      if (!r && bc.chep[kh] != null && bc.chep[kh] === f.size && f.size === g.size && giongNoiDung(path.join(goc, c.ten, f.ten), path.join(goc, f.ten))) { bc.ban[kh] = banMoi(f, g); kq.doi = true }
    }
  }
  return kq
}

/** Moc cho main.js: TRUOC va SAU khi kho.ghiDeAnh ghi de mot anh o thu muc goc (vd: Che / ve len anh ghim roi luu). Khong sua kho.js. */
function laAnhGoc(goc, filePath) { try { return path.dirname(path.resolve(filePath)) === path.resolve(goc) } catch (e) { return false } }
function truocGhiDe(goc, filePath) {
  try {
    if (!laAnhGoc(goc, filePath)) return 0
    const ten = path.basename(filePath), bc = boCucHienTai(), sg = thongTin(filePath)
    if (!sg || !sg.laFile) return 0
    let n = 0
    for (const k of bc.khung) {
      const sp = thongTin(path.join(goc, k.ten, ten)); if (!sp || !mungLa(sp, sg)) continue
      bc.ban[k.id + '/' + ten] = banMoi(sp, sg); n++
    }
    if (n) ghiBoCuc(bc)
    return n
  } catch (e) { ghiLog('canvas: truocGhiDe LOI ' + (e && e.message)); return 0 }
}
function sauGhiDe(goc, filePath) {
  try {
    if (!laAnhGoc(goc, filePath)) return 0
    const ten = path.basename(filePath), bc = boCucHienTai(), gocF = path.join(goc, ten), sg = thongTin(gocF)
    if (!sg || !sg.laFile) return 0
    let n = 0
    for (const k of bc.khung) {
      const kh = k.id + '/' + ten, p = path.join(goc, k.ten, ten), sp = thongTin(p), r = bc.ban[kh]
      if (!sp || !banKhop(r, sp) || mungLa(sp, sg) || !goiDoi(r, sg)) continue
      thayBanNoi(bc, kh, gocF, p); n++
    }
    if (n) ghiBoCuc(bc)
    return n
  } catch (e) { ghiLog('canvas: sauGhiDe LOI ' + (e && e.message)); return 0 }
}
const boCucHienTai = () => ram || docBoCuc().bc

/** Trang gui vi tri moi sau khi keo: { khung: [{ id, x, y, w, h }], vt: { khoa: { x, y } } }. Chi nhan thu da co trong so. */
function luuViTri(p) {
  const bc = boCucHienTai()
  if (!p || typeof p !== 'object') return false
  for (const g of Array.isArray(p.khung) ? p.khung : []) {
    const k = bc.khung.find((x) => x.id === (g && g.id)); if (!k) continue
    if ([g.x, g.y, g.w, g.h].every(Number.isFinite)) { k.x = Math.round(g.x); k.y = Math.round(g.y); k.w = Math.max(K0.WMIN, Math.round(g.w)); k.h = Math.max(K0.HMIN, Math.round(g.h)) }
    if (typeof g.mau === 'string' && MAU_HEX.test(g.mau)) k.mau = g.mau.toLowerCase()
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

/** File `p` trong khung co phai ban noi / ban chep CUA APP (xoa duoc) khong? Cung ma file voi anh goc, hoac con khop so `ban`, hoac ban chep cu
    chi co kich thuoc nhung giong HET noi dung (loi 1: truoc chi so kich thuoc nen anh khac cung so byte bi xoa nham). */
function laCuaApp(bc, kh, sp, sg, p, gocF) {
  if (!sp || !sg) return false
  if (mungLa(sp, sg)) return true
  if (banKhop(bc.ban[kh], sp)) return true
  return bc.chep[kh] != null && bc.chep[kh] === sp.size && sp.size === sg.size && giongNoiDung(p, gocF)
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
  if (dich) {   // loi 6: khung dich da co mot file KHAC cung ten -> tu choi truoc khi dung toi bat ky khung nao
    const p = path.join(goc, dich.ten, khoa), sp = thongTin(p)
    if (sp && !laCuaApp(bc, dich.id + '/' + khoa, sp, sg, p, gocF)) return { ok: false, loi: 'trung-ten' }
  }
  for (const k of bc.khung) {
    const p = path.join(goc, k.ten, khoa), sp = thongTin(p), kh = k.id + '/' + khoa
    if (dich && k.id === dich.id) {
      if (sp) continue                                       // da co san trong thu muc do (da kiem la cua app o tren)
      let chep = false
      try { fs.linkSync(gocF, p) } catch (e) {
        try { fs.copyFileSync(gocF, p, fs.constants.COPYFILE_EXCL); chep = true; bc.chep[kh] = sg.size; ghiLog('canvas: o dia khong cho ban noi (' + (e && e.code) + ') -> chep ' + khoa) }
        catch (e2) { ghiLog('canvas: dua vao thu muc LOI ' + (e2 && e2.code)); ghiBoCuc(bc); return { ok: false, loi: 'he-thong', ct: e2 && e2.code } }
      }
      const s2 = thongTin(p); if (s2) bc.ban[kh] = banMoi(s2, sg)
      if (!chep) delete bc.chep[kh]
    } else if (sp) {
      if (!laCuaApp(bc, kh, sp, sg, p, gocF)) { giu++; continue }   // file KHAC trung ten: khong phai cua app -> de nguyen
      try { fs.unlinkSync(p); delete bc.chep[kh]; delete bc.ban[kh] } catch (e) { giu++; ghiLog('canvas: bo ban noi LOI ' + (e && e.code)) }
    }
  }
  ghiBoCuc(bc)
  return { ok: true, giu }
}

/** Thay cac thu KHONG phai anh tren bang (ghi chu, chu, hinh, link, mui ten, net ve, lop, khoa). Truong nao khong gui thi giu nguyen. */
function luuVat(p) {
  if (!p || typeof p !== 'object') return false
  const bc = boCucHienTai()
  if ('vat' in p) bc.vat = lamSachVat(p.vat)
  if ('noi' in p) bc.noi = lamSachNoi(p.noi)
  if ('net' in p) bc.net = lamSachNet(p.net)
  if ('z' in p) bc.z = lamSachBang(p.z, false)
  if ('khoa' in p) bc.khoa = lamSachBang(p.khoa, true)
  return ghiBoCuc(bc)
}

const TEN_RAC = /^(\.ds_store|thumbs\.db|desktop\.ini)$/i
/**
 * Xoa khung = xoa thu muc con CUA KHUNG DO, nhung CHI khi trong do chi con ban noi / ban chep cua anh goc (hoac rac he thong).
 * Con file khac -> tu choi, khong dung toi gi (loi 'chi-trong-thu-muc'). Anh goc khong bao gio bi dung toi.
 * rmdir chi xoa duoc thu muc RONG nen neu co gi lot qua, no se loi chu khong xoa nham.
 */
function xoaKhung(goc, id) {
  const bc = boCucHienTai(), k = bc.khung.find((x) => x.id === id)
  if (!k) return { ok: false, loi: 'khong-co-khung' }
  const dir = path.join(goc, k.ten), sd = thongTin(dir)
  const cuaMinh = []
  if (sd && sd.laThuMuc) {
    let ds
    try { ds = fs.readdirSync(dir, { withFileTypes: true }) } catch (e) { return { ok: false, loi: 'he-thong', ct: e && e.code } }
    const la = []
    for (const d of ds) {
      const p = path.join(dir, d.name)
      if (TEN_RAC.test(d.name)) { cuaMinh.push(p); continue }
      if (!d.isFile() || d.name.startsWith('.')) { la.push(d.name); continue }
      const sp = thongTin(p), sg = thongTin(path.join(goc, d.name)), kh = k.id + '/' + d.name
      const ok = sp && sg && sg.laFile && laCuaApp(bc, kh, sp, sg, p, path.join(goc, d.name))   // loi 1: noi dung / so `ban`, khong chi kich thuoc
      if (ok) cuaMinh.push(p); else la.push(d.name)
    }
    if (la.length) return { ok: false, loi: 'chi-trong-thu-muc', giu: la.length }
    for (const p of cuaMinh) { try { fs.unlinkSync(p) } catch (e) { return { ok: false, loi: 'he-thong', ct: e && e.code } } }
    try { fs.rmdirSync(dir) } catch (e) { ghiLog('canvas: xoa thu muc khung LOI ' + (e && e.code)); return { ok: false, loi: 'he-thong', ct: e && e.code } }
  }
  bc.khung = bc.khung.filter((x) => x !== k)
  for (const kh of Object.keys(bc.thuoc)) if (bc.thuoc[kh] === id) delete bc.thuoc[kh]
  for (const ten of ['chep', 'ban']) for (const kh of Object.keys(bc[ten])) if (kh.startsWith(id + '/')) delete bc[ten][kh]
  delete bc.z['f:' + id]; delete bc.khoa['f:' + id]
  ghiBoCuc(bc)
  return { ok: true, don: cuaMinh.length }
}

const GIOI_NHAP = 1.5 * 1024 * 1024 * 1024
function tenChua(goc, ten) {
  const ext = path.extname(ten), base = path.basename(ten, ext)
  let t = ten
  for (let n = 2; n < 1000 && fs.existsSync(path.join(goc, t)); n++) t = base + ' ' + n + ext
  return t
}
/** Dua file tu NGOAI vao thu muc anh (CHEP, file goc cua nguoi dung khong bi dung toi). Tra [{ nguon, ok, ten | loi }]. */
function nhapFile(goc, nguon) {
  const kq = [], gocR = path.resolve(goc)
  try { fs.mkdirSync(goc, { recursive: true }) } catch (e) { return [{ ok: false, loi: 'he-thong', ct: e && e.code }] }
  for (const p0 of (Array.isArray(nguon) ? nguon : []).slice(0, 200)) {
    if (typeof p0 !== 'string' || !p0) continue
    const p = path.resolve(p0), t = path.basename(p)
    if (!kieuCua(t)) { kq.push({ nguon: p0, ok: false, loi: 'loai' }); continue }
    const st = thongTin(p)
    if (!st || !st.laFile) { kq.push({ nguon: p0, ok: false, loi: 'mat' }); continue }
    if (st.size > GIOI_NHAP) { kq.push({ nguon: p0, ok: false, loi: 'qua-lon' }); continue }
    if (path.dirname(p) === gocR) { kq.push({ nguon: p0, ok: true, ten: t, daCo: true }); continue }
    if (p.startsWith(gocR + path.sep)) { kq.push({ nguon: p0, ok: true, ten: null, daCo: true }); continue }
    let ten = t.replace(/^\.+/, '')
    if (!ten || boQuaGoc(ten)) ten = 'nhap-' + (ten || t)
    ten = tenChua(goc, ten)
    try { fs.copyFileSync(p, path.join(goc, ten), fs.constants.COPYFILE_EXCL); kq.push({ nguon: p0, ok: true, ten }) } catch (e) {
      ghiLog('canvas: nhap file LOI ' + (e && e.code)); kq.push({ nguon: p0, ok: false, loi: 'he-thong', ct: e && e.code })
    }
  }
  return kq
}
/** Anh dan tu clipboard / keo tu trinh duyet (khong co duong dan): ghi buf ra file moi. ext: 'png' | 'jpg'. */
function nhapBuf(goc, ten, buf) {
  try {
    fs.mkdirSync(goc, { recursive: true })
    let t = tenHopLe(String(ten || 'anh').replace(/\.[a-z0-9]{1,5}$/i, '')) || 'anh'
    const ext = /\.jpe?g$/i.test(String(ten || '')) ? 'jpg' : 'png'
    t = tenChua(goc, t + '.' + ext)
    fs.writeFileSync(path.join(goc, t), buf, { flag: 'wx' })
    return { ok: true, ten: t }
  } catch (e) { ghiLog('canvas: nhap anh dan LOI ' + (e && e.code)); return { ok: false, loi: 'he-thong', ct: e && e.code } }
}
/** Nhan doi mot tam anh = CHEP file that canh ban goc ("a (2).png"). Chi anh / video o thu muc goc. */
function nhanDoiAnh(goc, khoa) {
  khoa = String(khoa || '')
  if (!khoa || khoa !== path.basename(khoa) || khoa.startsWith('.') || !kieuCua(khoa)) return { ok: false, loi: 'ten' }
  const nguon = path.join(goc, khoa), s = thongTin(nguon)
  if (!s || !s.laFile) return { ok: false, loi: 'mat-goc' }
  const ext = path.extname(khoa), base = path.basename(khoa, ext)
  let ten = null
  for (let n = 2; n < 1000; n++) { const t = base + ' (' + n + ')' + ext; if (!fs.existsSync(path.join(goc, t))) { ten = t; break } }
  if (!ten) return { ok: false, loi: 'ten' }
  try { fs.copyFileSync(nguon, path.join(goc, ten), fs.constants.COPYFILE_EXCL) } catch (e) { return { ok: false, loi: 'he-thong', ct: e && e.code } }
  return { ok: true, khoa: ten }
}

module.exports = { truocGhiDe, sauGhiDe, khongGhiDuoc, khoiTao,tenHopLe, docBoCuc, ghiBoCuc, quet, dongBo, nap, boCucHienTai, luuViTri, luuVat, taoKhung, doiTenKhung, datThanhVien, xoaKhung, nhapFile, nhapBuf, nhanDoiAnh, khungChua, O, K0, MAU, kieuCua }
