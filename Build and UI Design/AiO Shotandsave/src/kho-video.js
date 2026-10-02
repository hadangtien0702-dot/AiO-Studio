'use strict'
/* KHO VIDEO (01/10, anh chot "khay rieng cho video"): SO GHI cac doan quay vung man hinh.
   File MP4 THAT nam trong thu muc anh cua nguoi dung (kho.thuMucAnh) — nguoi dung thay, keo, xoa nhu file thuong.
   O day chi giu so: <userData>/video/danh-sach.json = [{ id, file, ms, w, h, tieng, bytes, taoLuc, loi? }].
   - Vi sao can so: thoi luong + co tieng hay khong la so MAIN do luc quay; khay khong phai mo tung file ra doc.
   - danhSach() bo qua muc ma file da bi xoa/doi ten ngoai app (so khong noi doi ve thu khong con).
   - bo(id) CHI go khoi so. Xoa file la viec cua main (shell.trashItem -> Thung rac, lay lai duoc).
   ☠️ userData, KHONG phai thu muc cai (cai de NSIS xoa sach $INSTDIR — so loi #11).

   ☠️ 02/10 (ECC soat, muc A1 / A2 / A5 trong PROGRESS): SO HONG KHONG DUOC LAM MAT VIDEO.
   Truoc do doc() tra [] cho MOI loi (file bi khoa, JSON hong) va cac ham ghi cu the ghi de so tu danh sach rong do ->
   quay them 1 doan la moi video cu bien khoi khay. Nay:
   - docSo() phan biet 3 truong hop: doc duoc / KHONG doc duoc (tam thoi -> cam ghi de) / noi dung hong (cat ban hong
     sang `danh-sach.hong-<gio>.json` roi moi ghi so moi).
   - doiChieu(thuMuc): video do app quay dang nam tren dia ma khong co trong so -> them lai (so hong, ghi so that bai,
     file quay do vua duoc khoi phuc).
   - timTam() + khoiPhucTam(): file quay do `.mp4.tam` con lai sau khi app bi tat giua luc quay -> doi ten thanh video. */
const fs = require('fs')
const path = require('path')

let FILE = null
let ghiLog = () => {}
const MAU_ID = /^vid-\d{8}-\d{6}-\d{3}$/ // vid-YYYYMMDD-HHMMSS-mmm
/* Ten file do kho.duongVideoMoi() dat: shotandsave-video-YYYY-MM-DD-HHMMSS-mmm.mp4 (ban "-khong-tieng" KHONG khop). */
const MAU_FILE = /^shotandsave-video-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})-(\d{3})\.(mp4|webm)$/i
const MAU_TAM = /^shotandsave-video-\d{4}-\d{2}-\d{2}-\d{6}-\d{3}\.mp4\.tam$/i

function khoiTao(thuMucUserData, log) {
  FILE = path.join(thuMucUserData, 'video', 'danh-sach.json')
  if (typeof log === 'function') ghiLog = log
}

/* Doc so. Tra { ds, loi, ct }:
   loi = null   doc duoc, hoac CHUA CO file (lan dau)
   loi = 'doc'  file co nhung khong doc duoc (bi khoa, mat quyen) — tam thoi, KHONG duoc ghi de len no
   loi = 'hong' doc duoc nhung khong phai mang JSON */
function docSo() {
  if (!FILE) return { ds: [], loi: 'chua khoi tao', ct: '' }
  let s
  try { s = fs.readFileSync(FILE, 'utf8') } catch (e) {
    return e.code === 'ENOENT' ? { ds: [], loi: null, ct: '' } : { ds: [], loi: 'doc', ct: e.code || e.message }
  }
  try {
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1) // file co BOM tung lam JSON.parse chet (cau-hinh.json, 24/08)
    const d = JSON.parse(s)
    if (!Array.isArray(d)) throw new Error('khong phai mang')
    return { ds: d.filter((m) => m && MAU_ID.test(String(m.id)) && typeof m.file === 'string'), loi: null, ct: '' }
  } catch (e) { return { ds: [], loi: 'hong', ct: e.message } }
}
function doc() { return docSo().ds }
function ghi(ds) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(ds))
  fs.renameSync(FILE + '.tmp', FILE) // atomic nhu cau-hinh.json
}

const p = (v, k) => String(v).padStart(k || 2, '0')
const dauGio = (d) => d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())

/* Danh sach de GHI TIEP len. null = KHONG duoc ghi (so dang khong doc duoc / khong cat duoc ban hong) -> ben goi bao
   that bai, khong ghi de. So hong -> doi ten thanh ban luu (giu nguyen noi dung de con cuu duoc) roi bat dau tu rong. */
function layDeGhi() {
  const r = docSo()
  if (!r.loi) return r.ds
  if (r.loi === 'hong') {
    const luu = FILE.replace(/\.json$/, '') + '.hong-' + dauGio(new Date()) + '.json'
    try {
      fs.renameSync(FILE, luu)
      ghiLog('kho-video SO HONG (' + r.ct + ') -> cat sang ' + path.basename(luu) + ', lap so moi')
      return []
    } catch (e) { ghiLog('kho-video SO HONG nhung khong cat duoc ban hong (' + e.message + ') -> KHONG ghi de'); return null }
  }
  ghiLog('kho-video KHONG doc duoc so (' + r.ct + ') -> KHONG ghi de')
  return null
}

function idMoi(d) {
  return 'vid-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + p(d.getMilliseconds(), 3)
}

/* rec: { file, ms, w, h, tieng, bytes, loi } -> muc da ghi (co id + taoLuc), hoac null neu ghi hong (ben goi phai kiem).
   loi = luot quay ket thuc vi loi giua chung (dia day, luong chet...) -> khay danh dau "Bi ngat". */
function them(rec) {
  if (!FILE || !rec || !rec.file) return null
  const d = new Date()
  const m = {
    id: idMoi(d), file: rec.file, ms: Math.max(0, Math.round(rec.ms || 0)),
    w: rec.w | 0, h: rec.h | 0, tieng: !!rec.tieng, bytes: rec.bytes | 0, taoLuc: d.toISOString(),
  }
  if (rec.loi) m.loi = true
  try {
    const co = layDeGhi()
    if (!co) return null
    const ds = co.filter((x) => x.id !== m.id)
    ds.push(m)
    ghi(ds)
    return m
  } catch (e) { ghiLog('kho-video them LOI: ' + e.message); return null }
}

/* CHOT mot luot quay vua xong: doi ten file tam (`rec.tam`) -> file video (`rec.file`) roi ghi vao so.
   Tra { m, file, hong }: hong = null (xong) | 'doi-ten' (file VAN la `.tam`, chua vao so — KHONG ghi file `.tam` vao
   so: khay se hien o den, keo ra la file `.tam`) | 'ghi-so' (file da doi ten nhung chua vao so). Hai truong hop hong:
   ben goi PHAI bao nguoi dung; file khong mat — khoiPhucTam() / doiChieu() dua lai vao khay o lan sau. */
function chotQuay(rec) {
  if (!rec || !rec.tam || !rec.file) return { m: null, file: null, hong: 'doi-ten' }
  try { fs.renameSync(rec.tam, rec.file) } catch (e) {
    ghiLog('kho-video LOI doi ten ' + rec.tam + ': ' + e.message + ' (de nguyen file .tam)')
    return { m: null, file: rec.tam, hong: 'doi-ten' }
  }
  const m = them(rec)
  if (!m) { ghiLog('kho-video LOI ghi so (file van nam o ' + rec.file + ')'); return { m: null, file: rec.file, hong: 'ghi-so' } }
  return { m, file: rec.file, hong: null }
}

/* Moi video con FILE tren dia, MOI NHAT truoc. */
function danhSach() {
  return doc().filter((m) => fs.existsSync(m.file)).sort((a, b) => (a.taoLuc < b.taoLuc ? 1 : -1))
}

function tim(id) {
  if (!MAU_ID.test(String(id))) return null
  return doc().find((m) => m.id === id) || null
}

/* Sua vai truong cua 1 muc (01/10: boTieng = nguoi dung chon ban Khong tieng; fileKhongTieng = duong dan ban do).
   Chi nhan 2 truong nay — id / file / ms... la so do luc quay, khong cho sua. Tra ve muc moi hoac null. */
function sua(id, patch) {
  if (!FILE || !MAU_ID.test(String(id)) || !patch) return null
  const ds = layDeGhi()
  if (!ds) return null
  const m = ds.find((x) => x.id === id)
  if (!m) return null
  if ('boTieng' in patch) m.boTieng = !!patch.boTieng
  if ('fileKhongTieng' in patch) m.fileKhongTieng = typeof patch.fileKhongTieng === 'string' ? patch.fileKhongTieng : null
  try { ghi(ds); return m } catch (e) { ghiLog('kho-video sua LOI: ' + e.message); return null }
}

/* Go 1 muc khoi so (KHONG dung toi file). Tra ve true neu co go. */
function bo(id) {
  if (!FILE || !MAU_ID.test(String(id))) return false
  const ds = layDeGhi()
  if (!ds) return false
  const con = ds.filter((m) => m.id !== id)
  if (con.length === ds.length) return false
  try { ghi(con); return true } catch (e) { ghiLog('kho-video bo LOI: ' + e.message); return false }
}

const khoa = (f) => { const r = path.resolve(f); return process.platform === 'win32' ? r.toLowerCase() : r }

/* DOI CHIEU so voi dia: video do app quay (dung mau ten) dang nam trong `thuMuc` ma KHONG co trong so -> them lai.
   Muc them lai khong co so do luc quay (ms = w = h = 0): khay tu doc tu chinh file video khi hien.
   opts.coTieng(file) -> true/false (main truyen ham doc hop moov); opts.biNgat = [duong dan] cac file vua khoi phuc tu
   `.tam` (danh dau loi = "Bi ngat"). Tra { them: so muc da them, loi: null | chuoi }. Khong co gi thieu thi KHONG ghi. */
function doiChieu(thuMuc, opts) {
  if (!FILE || !thuMuc) return { them: 0, loi: 'chua khoi tao' }
  let ten
  try { ten = fs.readdirSync(thuMuc) } catch (e) { return { them: 0, loi: null } } // chua co thu muc anh = chua quay gi
  const ung = ten.filter((t) => MAU_FILE.test(t))
  if (!ung.length) return { them: 0, loi: null }
  const r = docSo()
  if (r.loi === 'doc' || r.loi === 'chua khoi tao') return { them: 0, loi: 'so khong doc duoc (' + r.ct + ')' }
  const co = new Set(r.ds.map((m) => khoa(m.file)))
  const thieu = ung.filter((t) => !co.has(khoa(path.join(thuMuc, t))))
  if (!thieu.length) return { them: 0, loi: null }
  try {
    const ds = layDeGhi() // so hong -> cat ban hong, bat dau tu rong (thieu da tinh tu ds rong nen du)
    if (!ds) return { them: 0, loi: 'khong ghi duoc so' }
    const biNgat = new Set(((opts && opts.biNgat) || []).map(khoa))
    const idCo = new Set(ds.map((m) => m.id))
    let n = 0
    for (const t of thieu.sort()) {
      const file = path.join(thuMuc, t)
      let st
      try { st = fs.statSync(file) } catch (e) { continue }
      if (!st.isFile() || !st.size) continue
      const g = MAU_FILE.exec(t) // gio trong ten file = luc BAT DAU quay
      const d = new Date(+g[1], +g[2] - 1, +g[3], +g[4], +g[5], +g[6], +g[7])
      let id = idMoi(d)
      while (idCo.has(id)) { d.setMilliseconds(d.getMilliseconds() + 1); id = idMoi(d) }
      idCo.add(id)
      let tieng = false
      try { tieng = !!(opts && opts.coTieng && opts.coTieng(file)) } catch (e) {}
      const m = { id, file, ms: 0, w: 0, h: 0, tieng, bytes: st.size, taoLuc: d.toISOString() }
      if (biNgat.has(khoa(file))) m.loi = true
      ds.push(m); n++
    }
    if (n) ghi(ds)
    return { them: n, loi: null }
  } catch (e) { return { them: 0, loi: e.message } }
}

/* File quay DO: `shotandsave-video-*.mp4.tam` trong thu muc anh. Tra [{ file, bytes }] de ben goi cho vai giay roi
   moi goi khoiPhucTam (file con dang lon len = co ban app khac dang quay vao no -> khong dung). */
function timTam(thuMuc) {
  let ten
  try { ten = fs.readdirSync(thuMuc) } catch (e) { return [] }
  const kq = []
  for (const t of ten) {
    if (!MAU_TAM.test(t)) continue
    const file = path.join(thuMuc, t)
    try { const st = fs.statSync(file); if (st.isFile()) kq.push({ file, bytes: st.size }) } catch (e) {}
  }
  return kq
}

/* Khoi phuc cac file quay do tim duoc o timTam(). boQua = duong dan file `.tam` cua luot DANG quay (neu co).
   - 0 byte: xoa (file tam rong do app tao, dung mau ten, khong co du lieu nguoi dung).
   - co du lieu + dau file la MP4 ('ftyp') hoac WebM: doi ten bo duoi `.tam` (WebM thi doi `.mp4` -> `.webm`).
   - kich thuoc da doi so voi luc tim / khong phai video / da co file dich: DE NGUYEN.
   Tra { doi: [duong dan moi], bo: [ten], loi: [chuoi] }. */
function khoiPhucTam(ung, boQua) {
  const kq = { doi: [], bo: [], loi: [] }
  for (const u of ung || []) {
    const ten = path.basename(u.file)
    if (!MAU_TAM.test(ten)) continue
    if (boQua && khoa(u.file) === khoa(boQua)) continue
    try {
      const st = fs.statSync(u.file)
      if (st.size !== u.bytes) { kq.loi.push(ten + ': dang duoc ghi tiep'); continue }
      if (!st.size) { fs.unlinkSync(u.file); kq.bo.push(ten); continue }
      const dau = Buffer.alloc(12)
      const fd = fs.openSync(u.file, 'r')
      try { fs.readSync(fd, dau, 0, 12, 0) } finally { fs.closeSync(fd) }
      const laWebm = dau[0] === 0x1a && dau[1] === 0x45 && dau[2] === 0xdf && dau[3] === 0xa3
      const laMp4 = dau.toString('latin1', 4, 8) === 'ftyp'
      if (!laWebm && !laMp4) { kq.loi.push(ten + ': khong phai video'); continue }
      let dich = u.file.slice(0, -4) // bo '.tam'
      if (laWebm) dich = dich.replace(/\.mp4$/i, '.webm')
      if (fs.existsSync(dich)) { kq.loi.push(ten + ': da co ' + path.basename(dich)); continue }
      fs.renameSync(u.file, dich)
      kq.doi.push(dich)
    } catch (e) { kq.loi.push(ten + ': ' + e.message) }
  }
  return kq
}

module.exports = { khoiTao, them, chotQuay, danhSach, tim, sua, bo, doiChieu, timTam, khoiPhucTam, MAU_ID }
