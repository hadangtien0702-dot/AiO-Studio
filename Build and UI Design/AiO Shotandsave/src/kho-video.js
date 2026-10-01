'use strict'
/* KHO VIDEO (01/10, anh chot "khay rieng cho video"): SO GHI cac doan quay vung man hinh.
   File MP4 THAT nam trong thu muc anh cua nguoi dung (kho.thuMucAnh) — nguoi dung thay, keo, xoa nhu file thuong.
   O day chi giu so: <userData>/video/danh-sach.json = [{ id, file, ms, w, h, tieng, bytes, taoLuc }].
   - Vi sao can so: thoi luong + co tieng hay khong la so MAIN do luc quay; khay khong phai mo tung file ra doc.
   - danhSach() bo qua muc ma file da bi xoa/doi ten ngoai app (so khong noi doi ve thu khong con).
   - bo(id) CHI go khoi so. Xoa file la viec cua main (shell.trashItem -> Thung rac, lay lai duoc).
   ☠️ userData, KHONG phai thu muc cai (cai de NSIS xoa sach $INSTDIR — so loi #11). */
const fs = require('fs')
const path = require('path')

let FILE = null
const MAU_ID = /^vid-\d{8}-\d{6}-\d{3}$/ // vid-YYYYMMDD-HHMMSS-mmm

function khoiTao(thuMucUserData) { FILE = path.join(thuMucUserData, 'video', 'danh-sach.json') }

function doc() {
  if (!FILE) return []
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return Array.isArray(d) ? d.filter((m) => m && MAU_ID.test(String(m.id)) && typeof m.file === 'string') : []
  } catch (e) { return [] }
}
function ghi(ds) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(ds))
  fs.renameSync(FILE + '.tmp', FILE) // atomic nhu cau-hinh.json
}

function idMoi(d) {
  const p = (v, k) => String(v).padStart(k || 2, '0')
  return 'vid-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + p(d.getMilliseconds(), 3)
}

/* rec: { file, ms, w, h, tieng, bytes } -> muc da ghi (co id + taoLuc), hoac null neu ghi hong (ben goi phai kiem). */
function them(rec) {
  if (!FILE || !rec || !rec.file) return null
  const d = new Date()
  const m = {
    id: idMoi(d), file: rec.file, ms: Math.max(0, Math.round(rec.ms || 0)),
    w: rec.w | 0, h: rec.h | 0, tieng: !!rec.tieng, bytes: rec.bytes | 0, taoLuc: d.toISOString(),
  }
  try {
    const ds = doc().filter((x) => x.id !== m.id)
    ds.push(m)
    ghi(ds)
    return m
  } catch (e) { return null }
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
  const ds = doc()
  const m = ds.find((x) => x.id === id)
  if (!m) return null
  if ('boTieng' in patch) m.boTieng = !!patch.boTieng
  if ('fileKhongTieng' in patch) m.fileKhongTieng = typeof patch.fileKhongTieng === 'string' ? patch.fileKhongTieng : null
  try { ghi(ds); return m } catch (e) { return null }
}

/* Go 1 muc khoi so (KHONG dung toi file). Tra ve true neu co go. */
function bo(id) {
  if (!FILE || !MAU_ID.test(String(id))) return false
  const ds = doc()
  const con = ds.filter((m) => m.id !== id)
  if (con.length === ds.length) return false
  try { ghi(con); return true } catch (e) { return false }
}

module.exports = { khoiTao, them, danhSach, tim, sua, bo, MAU_ID }
