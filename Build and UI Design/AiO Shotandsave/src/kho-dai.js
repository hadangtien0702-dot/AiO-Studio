'use strict'
/* KHO DAI STORYBOARD (29/09, anh chot): moi luot QUAY 3 GIAY = 1 dai, GIU LAI sau khi tat app, tach han khoi khay
   anh thuong. Moi dai = 1 thu muc <userData>/storyboard/<id>/ gom khung-<seq>.jpg (JPEG q92, cao toi da 1080 px) +
   dai.json { id, taoLuc, khung: [{ seq, w, h }] }. Xoa khung = xoa DUNG file khung + bo khoi dai.json (giu SO GOC —
   anh chon "Giu so goc"). Xoa dai = xoa DUNG thu muc dai do (ten = id do app tao, khong bao gio xoa theo mau).
   ☠️ userData, KHONG phai thu muc cai (cai de NSIS xoa sach $INSTDIR — so loi #11). */
const fs = require('fs')
const path = require('path')

let GOC = null
const MAU_ID = /^dai-\d{8}-\d{6}-\d{3}$/ // dai-YYYYMMDD-HHMMSS-mmm: chi dung dung ten do app tao

function khoiTao(thuMucUserData) { GOC = path.join(thuMucUserData, 'storyboard') }
function thuMuc(id) {
  if (!GOC || !MAU_ID.test(String(id))) return null
  return path.join(GOC, id)
}

/* khung: [{ seq, image (NativeImage) }] -> id dai moi, hoac null neu ghi hong (ben goi phai kiem). */
function luuDai(khung) {
  if (!GOC || !khung || !khung.length) return null
  const d = new Date()
  const p = (v, k) => String(v).padStart(k || 2, '0')
  const id = 'dai-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + p(d.getMilliseconds(), 3)
  const dir = path.join(GOC, id)
  try {
    fs.mkdirSync(dir, { recursive: true })
    const ghi = []
    for (const k of khung) {
      const sz = k.image.getSize()
      const img = sz.height > 1080 ? k.image.resize({ height: 1080, quality: 'best' }) : k.image
      const s2 = img.getSize()
      fs.writeFileSync(path.join(dir, 'khung-' + k.seq + '.jpg'), img.toJPEG(92))
      ghi.push({ seq: k.seq, w: s2.width, h: s2.height })
    }
    ghiMeta(dir, { id, taoLuc: d.toISOString(), khung: ghi })
    return id
  } catch (e) {
    return null
  }
}

function ghiMeta(dir, meta) {
  const f = path.join(dir, 'dai.json')
  fs.writeFileSync(f + '.tmp', JSON.stringify(meta))
  fs.renameSync(f + '.tmp', f) // atomic nhu cau-hinh.json
}
function docMeta(id) {
  const dir = thuMuc(id)
  if (!dir) return null
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'dai.json'), 'utf8')) } catch (e) { return null }
}

/* Moi dai con khung, MOI NHAT truoc. */
function danhSach() {
  if (!GOC || !fs.existsSync(GOC)) return []
  const ds = []
  for (const ten of fs.readdirSync(GOC)) {
    if (!MAU_ID.test(ten)) continue
    const m = docMeta(ten)
    if (m && m.khung && m.khung.length) ds.push(m)
  }
  return ds.sort((a, b) => (a.taoLuc < b.taoLuc ? 1 : -1))
}

function duongKhung(id, seq) {
  const dir = thuMuc(id)
  if (!dir || !/^\d{1,2}$/.test(String(seq))) return null
  const f = path.join(dir, 'khung-' + seq + '.jpg')
  return fs.existsSync(f) ? f : null
}

/* Bo 1 khung. Het khung -> xoa ca dai. Tra ve meta moi (null = dai da het/khong co). */
function boKhung(id, seq) {
  const m = docMeta(id)
  if (!m) return null
  const f = duongKhung(id, seq)
  m.khung = m.khung.filter((k) => k.seq !== Number(seq))
  if (!m.khung.length) { xoaDai(id); return null }
  ghiMeta(thuMuc(id), m)
  if (f) { try { fs.unlinkSync(f) } catch (e) {} }
  return m
}

function xoaDai(id) {
  const dir = thuMuc(id)
  if (!dir || !fs.existsSync(dir)) return false
  fs.rmSync(dir, { recursive: true, force: true })
  return true
}

module.exports = { khoiTao, luuDai, danhSach, duongKhung, boKhung, xoaDai, MAU_ID }
