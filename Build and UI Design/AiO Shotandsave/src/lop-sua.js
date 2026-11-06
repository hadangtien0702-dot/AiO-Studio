'use strict'

/* LOP SUA CUA ANH (06/11/2026, ROADMAP 0k #3): luu kem anh cac net da ve de mo lai sua tiep.
   Moi anh co 2 file nho trong `<userData>/net-ve/` (KHONG nam trong thu muc anh cua nguoi dung):
     <ten anh>.json       cac net (khung, chu, mui ten, but, so, lam mo...) + thong so de dung lai
     <ten anh>.sach.png   ANH SACH: chinh anh do TRUOC khi ve net (chua che, chua ve gi)
   ☠️ RUI RO LO THONG TIN: anh luu ra thu muc anh la ban DA CHE. Rieng file `.sach.png` la ban CHUA che, de nut Che
   (to kin / lam mo / khap o) sua lai duoc. Vi vay: chi nam trong userData (khong keo-tha, khong vao khay, khong vao thu muc
   anh), tu xoa khi anh bi xoa / sau HAN_NGAY ngay / khi qua tran dung luong, nguoi dung xoa tay duoc (nut trong bang mau cua
   anh ghim), va tat han duoc bang `luuLopSua: false` trong cau-hinh.json.
   Khop voi anh bang DUONG DAN DAY DU (khoa ten file = ten + bam cua duong dan day du; trong .json con ghi `duong` va doc lai phai
   khop) + DUNG LUONG FILE luc ghi: anh bi sua / thay ben ngoai app (dung luong doi) thi lop sua bi bo qua, hai anh cung ten o hai
   thu muc (hoac ten chi khac dau cach / gach duoi) KHONG bao gio dung chung mot lop sua (06/11, soat dot 3 muc 3: truoc day khoa chi
   la ten file da lam sach -> mo anh B co the nap NEN cua anh A va bam Xong ghi noi dung A de len B).
   Ghi file dung `ghiBen` (fsync + doi ten). Khong phu thuoc Electron. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { ghiBen } = require('./ghi-ben')

const HAN_NGAY = 30            // lop sua cu hon so ngay nay bi don
const TRAN_BYTE = 300 * 1024 * 1024 // tong dung luong toi da cua thu muc net-ve
const TRAN_FILE_SACH = 60 * 1024 * 1024 // mot anh sach lon hon muc nay thi khong luu (anh 8K khong co ich)
const TRAN_SO_LUONG = 400

/* Khoa so sanh duong dan: Windows va macOS (mac dinh) khong phan biet hoa thuong. */
function khoaDuong(p) {
  const r = path.resolve(String(p || ''))
  return process.platform === 'win32' || process.platform === 'darwin' ? r.toLowerCase() : r
}
/* Ten goc cua cac file lop sua: ten file da lam sach (de nguoi doc nhin ra) + 12 ky tu bam CUA DUONG DAN DAY DU. */
function ten(filePath) {
  const goc = path.basename(String(filePath || '')).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80)
  return goc + '-' + crypto.createHash('sha1').update(khoaDuong(filePath)).digest('hex').slice(0, 12)
}

function taoLopSua(thuMucDuLieu, ghiLog, opts) {
  const hanNgay = (opts && opts.hanNgay) || HAN_NGAY, tranByte = (opts && opts.tranByte) || TRAN_BYTE, tranSoLuong = (opts && opts.tranSoLuong) || TRAN_SO_LUONG
  const dir = path.join(thuMucDuLieu, 'net-ve')
  const log = typeof ghiLog === 'function' ? ghiLog : () => {}
  const fJson = (filePath) => path.join(dir, ten(filePath) + '.json')
  const fSach = (filePath) => path.join(dir, ten(filePath) + '.sach.png')
  const baoDam = () => fs.mkdirSync(dir, { recursive: true })

  /* lop = { shapes (mang JSON-sach), dpr, dipW, dipH, sach: Buffer | null (null = giu ban sach dang co) }.
     Tra { ok, loi }. shapes rong => xoa lop sua (khong con gi de sua). */
  function ghi(filePath, lop) {
    try {
      if (!filePath || !lop || !Array.isArray(lop.shapes)) return { ok: false, loi: 'thieu du lieu' }
      if (!lop.shapes.length) { xoa(filePath); return { ok: true, loi: null, daXoa: true } }
      baoDam()
      const st = fs.statSync(filePath)
      const coSach = Buffer.isBuffer(lop.sach) && lop.sach.length > 0
      if (coSach && lop.sach.length > TRAN_FILE_SACH) { xoa(filePath); return { ok: false, loi: 'anh sach qua lon (' + lop.sach.length + ' byte)' } }
      if (!coSach && !fs.existsSync(fSach(filePath))) return { ok: false, loi: 'khong co anh sach de giu' }
      if (coSach) ghiBen(fSach(filePath), lop.sach)
      const bang = { v: 1, duong: path.resolve(filePath), bytes: st.size, dpr: Number(lop.dpr) || 1, dipW: Number(lop.dipW) || 0, dipH: Number(lop.dipH) || 0, luc: Date.now(), shapes: lop.shapes }
      ghiBen(fJson(filePath), Buffer.from(JSON.stringify(bang), 'utf8'))
      if (chiMuc) chiMuc.set(ten(filePath), bang.duong)
      donDep()
      return { ok: true, loi: null }
    } catch (e) {
      log('lop-sua ghi LOI ' + path.basename(String(filePath)) + ': ' + (e && e.message))
      return { ok: false, loi: (e && e.message) || 'loi' }
    }
  }

  /* Doc lop sua cua anh. Tra null neu khong co / anh da doi / file hong. { bang, sach: Buffer } neu dung. */
  function doc(filePath) {
    try {
      if (!filePath || !fs.existsSync(fJson(filePath)) || !fs.existsSync(fSach(filePath))) return null
      const bang = JSON.parse(fs.readFileSync(fJson(filePath), 'utf8'))
      if (!bang || bang.v !== 1 || !Array.isArray(bang.shapes)) return null
      /* Phai CHINH la lop sua cua duong dan nay (khoa ten file la bam, nhung van doi chieu duong dan day du de khong bao gio nap nham). */
      if (!bang.duong || khoaDuong(bang.duong) !== khoaDuong(filePath)) { log('lop-sua: ' + path.basename(filePath) + ' co lop sua cua duong dan khac (' + path.basename(String(bang.duong || '')) + '), bo qua'); return null }
      const st = fs.statSync(filePath)
      if (st.size !== bang.bytes) { log('lop-sua: ' + path.basename(filePath) + ' da doi ben ngoai app (' + st.size + ' != ' + bang.bytes + '), bo qua lop sua'); return null }
      return { bang, sach: fs.readFileSync(fSach(filePath)) }
    } catch (e) {
      log('lop-sua doc LOI ' + path.basename(String(filePath)) + ': ' + (e && e.message))
      return null
    }
  }

  function xoa(filePath) {
    let n = 0
    for (const f of [fJson(filePath), fSach(filePath), fJson(filePath) + '.tmp', fSach(filePath) + '.tmp']) { try { fs.unlinkSync(f); n++ } catch (e) {} }
    if (chiMuc) chiMuc.delete(ten(filePath))
    return n
  }

  /* Anh vua DOI TEN / chuyen cho (tu dat ten): doi theo lop sua sang khoa moi, neu khong lop sua mang ten cu va khong ai mo lai duoc
     (lan don sau con xoa luon vi duong dan cu khong con). Giu nguyen `bytes` cu: anh bi sua ben ngoai thi van bi bo qua. Tra true neu da chuyen. */
  function chuyen(cu, moi) {
    try {
      if (!cu || !moi) return false
      if (khoaDuong(cu) === khoaDuong(moi)) return true
      if (!fs.existsSync(fJson(cu)) || !fs.existsSync(fSach(cu))) return false
      const bang = JSON.parse(fs.readFileSync(fJson(cu), 'utf8'))
      if (!bang || bang.v !== 1 || !bang.duong || khoaDuong(bang.duong) !== khoaDuong(cu)) return false
      baoDam()
      bang.duong = path.resolve(moi)
      ghiBen(fSach(moi), fs.readFileSync(fSach(cu)))
      ghiBen(fJson(moi), Buffer.from(JSON.stringify(bang), 'utf8'))
      xoa(cu)
      if (chiMuc) chiMuc.set(ten(moi), bang.duong)
      return true
    } catch (e) {
      log('lop-sua chuyen LOI: ' + (e && e.message))
      return false
    }
  }

  /* 06/11 (soat dot 3 muc 6): chi muc nho trong bo nho { ten goc -> duong dan anh } de kiem NHANH xem anh con khong (khong doc lai
     hang tram file .json moi lan). Nap mot lan tu thu muc net-ve, sau do ghi / xoa / chuyen cap nhat theo. */
  let chiMuc = null
  function napChiMuc() {
    if (chiMuc) return chiMuc
    chiMuc = new Map()
    try {
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.json')) continue
        try { const b = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (b && b.duong) chiMuc.set(f.slice(0, -5), b.duong) } catch (e) {}
      }
    } catch (e) {}
    return chiMuc
  }
  /* Go ngay lop sua cua anh DA BI XOA (xoa qua Explorer / Finder khi app van chay): ban .sach.png la ban CHUA CHE nen khong de nam lai.
     Thu muc chua anh khong con (o dia roi / thu muc offline) thi KHONG coi la anh da xoa. Tra so lop sua da go. Rat re: chi existsSync. */
  function donMoCoi() {
    let go = 0
    try {
      for (const [goc, duong] of Array.from(napChiMuc())) {
        if (fs.existsSync(duong) || !fs.existsSync(path.dirname(duong))) continue
        for (const p of [path.join(dir, goc + '.json'), path.join(dir, goc + '.sach.png'), path.join(dir, goc + '.json.tmp'), path.join(dir, goc + '.sach.png.tmp')]) { try { fs.unlinkSync(p) } catch (e) {} }
        chiMuc.delete(goc)
        go++
      }
    } catch (e) { log('lop-sua donMoCoi LOI: ' + (e && e.message)) }
    if (go) log('lop-sua: anh da bi xoa, go ' + go + ' lop sua (ban sach)')
    return go
  }

  /* Goi tu apDungDoiTen: anh khong co lop sua thi van la ok. */
  function doiTen(cu, moi) {
    if (!cu || !moi) return { ok: false, loi: 'thieu duong dan' }
    if (!fs.existsSync(fJson(cu))) return { ok: true, khongCo: true }
    return { ok: chuyen(cu, moi) }
  }

  /* Don: mo coi (anh da bi xoa), qua han, qua tran. Tra so file da go. Thu muc anh chua gan (o dia roi) thi KHONG coi la anh da xoa. */
  function donDep(now) {
    let go = 0
    try {
      if (!fs.existsSync(dir)) return 0
      const mon = []
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.json')) continue
        const goc = f.slice(0, -5)
        let bang = null
        try { bang = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch (e) {}
        const sach = path.join(dir, goc + '.sach.png')
        let to = 0
        try { to += fs.statSync(path.join(dir, f)).size } catch (e) {}
        try { to += fs.statSync(sach).size } catch (e) {}
        mon.push({ f, goc, sach, bang, byte: to })
      }
      const xoaMon = (m) => { for (const p of [path.join(dir, m.f), m.sach]) { try { fs.unlinkSync(p); go++ } catch (e) {} } }
      const t = now || Date.now()
      const con = []
      for (const m of mon) {
        const b = m.bang
        if (!b || !b.duong) { xoaMon(m); continue }
        if (t - (b.luc || 0) > hanNgay * 86400000) { xoaMon(m); continue }
        if (!fs.existsSync(b.duong) && fs.existsSync(path.dirname(b.duong))) { xoaMon(m); continue }
        con.push(m)
      }
      con.sort((a, b) => (a.bang.luc || 0) - (b.bang.luc || 0)) // cu truoc
      let tong = con.reduce((n, m) => n + m.byte, 0)
      while (con.length && (tong > tranByte || con.length > tranSoLuong)) { const m = con.shift(); tong -= m.byte; xoaMon(m) }
      // file .sach.png khong co .json di kem
      for (const f of fs.readdirSync(dir)) {
        if (f.endsWith('.sach.png') && !fs.existsSync(path.join(dir, f.slice(0, -9) + '.json'))) { try { fs.unlinkSync(path.join(dir, f)); go++ } catch (e) {} }
      }
    } catch (e) { log('lop-sua don LOI: ' + (e && e.message)) }
    chiMuc = null // da go file: lan sau nap lai chi muc tu dia
    if (go) log('lop-sua: don ' + go + ' file')
    return go
  }

  function tongByte() {
    let n = 0
    try { for (const f of fs.readdirSync(dir)) { try { n += fs.statSync(path.join(dir, f)).size } catch (e) {} } } catch (e) {}
    return n
  }

  /* Duong cua main.js: lop do renderer gui (sach la dataURL PNG | null). bat = cai dat luuLopSua. Tra { ok, daXoa, loi }. */
  function ghiTuLop(filePath, lop, bat) {
    if (!filePath || !lop || !Array.isArray(lop.shapes)) return { ok: false, loi: 'thieu du lieu' }
    if (!bat) { xoa(filePath); return { ok: true, daXoa: true } }
    return ghi(filePath, { shapes: lop.shapes, dpr: lop.dpr, dipW: lop.dipW, dipH: lop.dipH, sach: lop.sach ? bufferTuDataUrl(lop.sach) : null })
  }

  return { dir, ghi, ghiTuLop, doc, xoa, chuyen, doiTen, donDep, donMoCoi, tongByte }
}

/* Chuyen dataURL PNG ve Buffer (hoac null). */
function bufferTuDataUrl(s) {
  const m = /^data:image\/png;base64,(.+)$/.exec(String(s || ''))
  return m ? Buffer.from(m[1], 'base64') : null
}

module.exports = { taoLopSua, bufferTuDataUrl, HAN_NGAY, TRAN_BYTE }
