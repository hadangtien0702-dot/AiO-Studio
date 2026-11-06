'use strict'

/* =========================================================================
   lien-ket.js — DIEU KHIEN APP TU NGOAI BANG LINK  aioshot://<lenh>  (06/11/2026)
   -------------------------------------------------------------------------
   Nguoi xai: dan dev / nguoi hay viet script bam mot link (hoac go mot dong lenh) la app chup, mo Canvas, mo khay, tim
   anh cu, ghim mot anh — khong phai di tay qua tray. Vi du doi thuong: nut "Chup" trong mot trang ghi chu cua team, hoac
   phim tat cua Stream Deck goi `aioshot://chup`.

   ☠️ LINK CO THE DO MOT TRANG WEB BAT KY MO RA (trinh duyet chi hoi "Mo AiO Shot & Save?" mot lan). Nen module nay la HANG
   RAO, khong phai tien ich:
     - Chi 6 lenh trong danh sach trang: chup · chup-lai-vung · canvas · khay · tim?chu=… · ghim?file=…
       Khong co lenh nao XOA, GHI DE, GUI DI, SUA CAI DAT hay DOC file. Lenh la -> bo.
     - Tham so la tham so: moi khoa la ngoai danh sach -> bo CA LENH (khong "bo qua tham so la roi van chay").
     - `ghim?file=` CHI nhan file anh (.png .jpg .jpeg) NAM TRONG THU MUC ANH: kiem tu dang chu (khong goi he thong tep) roi
       kiem lai sau khi giai lien ket (thu muc "junction" / symlink tro ra ngoai bi chan). Duong dan UNC (`\\may\\thu-muc`,
       `//may/...`) bi chan truoc khi cham vao dia: mo duong dan mang la lo ma bam NTLM cho may la.
     - Gioi han tan suat: cach nhau >= 700 ms, toi da 10 lenh / 60 giay. Goi don dap -> bo, khong xep hang.
     - Khong tra loi gi ve cho trang goi (khong co kenh tra ve): trang khong do duoc thu muc anh co file nao.
   `aioshot://` cung la ten giao thuc NOI BO ma app dung de phuc vu anh dong bang (protocol.handle trong main.js: frozen,
   raw, dai, cv). Hai viec KHONG dung nhau: protocol.handle chi bat yeu cau do chinh cua so cua app tao ra, con link tu he
   dieu hanh di qua `open-url` / `second-instance`. Nhung de khoi nham, ten `frozen / raw / dai / cv` bi tu choi ro rang.

   KHONG require electron: moi thu tiem vao qua taoLienKet({...}) -> do bang node thuan (scripts/test/do-lien-ket.cjs).
   ========================================================================= */

const nodeFs = require('fs')
const nodePath = require('path')

const GIAO_THUC = 'aioshot'
const TOI_DA_DO_DAI = 2000
const TOI_DA_CHU_TIM = 120
const TOI_DA_DUONG_DAN = 1024
const KHOANG_TOI_THIEU_MS = 700
const CUA_SO_MS = 60 * 1000
const TOI_DA_TRONG_CUA_SO = 10
const DUOI_ANH = new Set(['.png', '.jpg', '.jpeg'])
const TOI_DA_BYTE_ANH = 300 * 1024 * 1024
const KY_TU_DIEU_KHIEN = new RegExp('[\u0000-\u001f\u007f-\u009f' + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + ']')

/* Lenh -> cac khoa tham so DUOC PHEP. Khoa khac = tu choi ca lenh. */
const LENH = {
  'chup': [],
  'chup-lai-vung': [],
  'canvas': [],
  'khay': [],
  'tim': ['chu'],
  'ghim': ['file'],
}

/** Tach chuoi link thanh { lenh, tham } hoac { loi }. KHONG cham vao dia. */
function phanTich(chuoi) {
  if (typeof chuoi !== 'string') return { loi: 'khong-phai-chuoi' }
  if (chuoi.length === 0 || chuoi.length > TOI_DA_DO_DAI) return { loi: 'do-dai' }
  if (KY_TU_DIEU_KHIEN.test(chuoi)) return { loi: 'ky-tu-dieu-khien' }
  if (!/^aioshot:/i.test(chuoi)) return { loi: 'sai-giao-thuc' }
  let u
  try { u = new URL(chuoi) } catch (e) { return { loi: 'khong-parse-duoc' } }
  if (u.protocol.toLowerCase() !== GIAO_THUC + ':') return { loi: 'sai-giao-thuc' }
  if (u.username || u.password) return { loi: 'co-tai-khoan' }
  if (chuoi.indexOf('#') >= 0) return { loi: 'co-fragment' }
  if (u.port) return { loi: 'co-cong' }
  /* aioshot://chup · aioshot://chup/ · aioshot:chup · aioshot:///chup (mot so he dieu hanh/trinh duyet doi dang) */
  const tho = u.hostname || String(u.pathname || '').replace(/^\/+|\/+$/g, '')
  if (u.hostname && String(u.pathname || '').replace(/^\/+|\/+$/g, '')) return { loi: 'duong-dan-thua' }
  const lenh = String(tho).toLowerCase()
  if (!Object.prototype.hasOwnProperty.call(LENH, lenh)) return { loi: 'lenh-la' }
  const duocPhep = LENH[lenh]
  const tham = {}
  for (const khoa of new Set(u.searchParams.keys())) {
    if (!duocPhep.includes(khoa)) return { loi: 'tham-so-la' }
    const gt = u.searchParams.getAll(khoa)
    if (gt.length !== 1) return { loi: 'tham-so-lap' }
    tham[khoa] = gt[0]
  }
  return { lenh, tham }
}

/** Khoa so sanh duong dan: Windows khong phan biet hoa thuong. */
const khoa = (p, nenTang) => (nenTang === 'win32' ? String(p).toLowerCase() : String(p))

function laDuongDanMang(s) {
  return /^[\\/]{2}/.test(s) || /^[\\/]+\?[\\/]/.test(s) || /^\\\\\?\\/.test(s)
}

/**
 * Kiem `file` co phai mot file anh NAM TRONG thu muc anh khong. Tra { duong } (duong dan that, da giai lien ket) hoac { loi }.
 * Thu tu co y: (1) kiem CHU, chua cham dia · (2) moi realpath/stat.
 */
function kiemFileAnh(file, { thuMucAnh, fs, path, nenTang }) {
  if (typeof file !== 'string' || !file.trim()) return { loi: 'thieu-file' }
  if (file.length > TOI_DA_DUONG_DAN) return { loi: 'file-qua-dai' }
  if (KY_TU_DIEU_KHIEN.test(file)) return { loi: 'ky-tu-dieu-khien' } // sau khi giai ma %xx moi thay duoc
  if (laDuongDanMang(file)) return { loi: 'duong-dan-mang' }
  const goc = thuMucAnh()
  if (typeof goc !== 'string' || !goc) return { loi: 'khong-co-thu-muc-anh' }
  if (nenTang === 'win32') {
    /* Dau hai cham chi hop le sau chu o dia ("C:"); o cho khac la luong du lieu phu (anh.png:luong) hoac ten thiet bi. */
    const sauODia = /^[A-Za-z]:/.test(file) ? file.slice(2) : file
    if (sauODia.indexOf(':') >= 0) return { loi: 'duong-dan-la' }
  }
  const ung = path.isAbsolute(file) ? path.resolve(file) : path.resolve(goc, file)
  const duoi = path.extname(ung).toLowerCase()
  if (!DUOI_ANH.has(duoi)) return { loi: 'khong-phai-anh' }
  const trongThuMuc = (cha, con) => {
    const rel = path.relative(cha, con)
    return !!rel && rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel)
  }
  /*KIEM-CHA-CHU*/ if (!trongThuMuc(path.resolve(goc), ung)) return { loi: 'ngoai-thu-muc-anh' }
  let that, gocThat
  try {
    gocThat = fs.realpathSync(goc)
    that = fs.realpathSync(ung)
  } catch (e) { return { loi: 'khong-thay-file' } }
  /*KIEM-CHA-THAT*/ if (!trongThuMuc(gocThat, that)) return { loi: 'ngoai-thu-muc-anh' }
  let st
  try { st = fs.statSync(that) } catch (e) { return { loi: 'khong-thay-file' } }
  if (!st.isFile()) return { loi: 'khong-phai-file' }
  if (st.size <= 0 || st.size > TOI_DA_BYTE_ANH) return { loi: 'kich-thuoc' }
  if (!DUOI_ANH.has(path.extname(that).toLowerCase())) return { loi: 'khong-phai-anh' }
  return { duong: that }
}

/** Lay cac link / co dong lenh trong argv, doi het ve dang link roi cho qua CUNG hang rao. */
function tuArgv(argv) {
  const ra = []
  for (const a of Array.isArray(argv) ? argv : []) {
    if (typeof a !== 'string') continue
    if (/^aioshot:/i.test(a)) { ra.push(a); continue }
    const m = /^--(chup|chup-lai-vung|canvas|khay|tim|ghim)(?:=([\s\S]*))?$/.exec(a)
    if (!m) continue
    const lenh = m[1]
    if (lenh === 'tim') ra.push(GIAO_THUC + '://tim' + (m[2] ? '?chu=' + encodeURIComponent(m[2]) : ''))
    else if (lenh === 'ghim') ra.push(GIAO_THUC + '://ghim?file=' + encodeURIComponent(m[2] || ''))
    else if (m[2] === undefined) ra.push(GIAO_THUC + '://' + lenh)
  }
  return ra
}


/**
 * taoLienKet({ thuMucAnh, lamViec, ghiLog, now, fs, path, nenTang })
 *   lamViec = { chup(), chupLaiVung(), canvas(), khay(), tim(chu), ghim(duongThat) }  (main.js noi vao)
 * -> { xuLy(chuoi) -> { ok, lenh?, loi? }, tuArgv(argv) -> [chuoi link] }
 */
function taoLienKet({ thuMucAnh, lamViec, ghiLog = () => {}, now = () => Date.now(), fs = nodeFs, path = nodePath, nenTang = process.platform }) {
  const daNhan = [] // thoi diem cac lenh DA NHAN trong cua so
  let lanCuoi = 0

  function xuLy(chuoi) {
    const p = phanTich(chuoi)
    if (p.loi) { ghiLog('lien-ket: BO (' + p.loi + ')'); return { ok: false, loi: p.loi } }
    const t = now()
    while (daNhan.length && t - daNhan[0] > CUA_SO_MS) daNhan.shift()
    if (lanCuoi && t - lanCuoi < KHOANG_TOI_THIEU_MS && t >= lanCuoi) { ghiLog('lien-ket: BO ' + p.lenh + ' (qua nhanh)'); return { ok: false, lenh: p.lenh, loi: 'qua-nhanh' } }
    if (daNhan.length >= TOI_DA_TRONG_CUA_SO) { ghiLog('lien-ket: BO ' + p.lenh + ' (qua nhieu trong 60 giay)'); return { ok: false, lenh: p.lenh, loi: 'qua-nhieu' } }
    let tuyen = null
    if (p.lenh === 'tim') {
      let chu = String(p.tham.chu == null ? '' : p.tham.chu).trim()
      if (chu.length > TOI_DA_CHU_TIM) return bo(p.lenh, 'chu-qua-dai')
      if (KY_TU_DIEU_KHIEN.test(chu)) return bo(p.lenh, 'ky-tu-dieu-khien')
      tuyen = chu
    } else if (p.lenh === 'ghim') {
      const k = kiemFileAnh(p.tham.file, { thuMucAnh, fs, path, nenTang })
      if (k.loi) return bo(p.lenh, k.loi)
      tuyen = k.duong
    }
    lanCuoi = t
    daNhan.push(t)
    try {
      if (p.lenh === 'chup') lamViec.chup()
      else if (p.lenh === 'chup-lai-vung') lamViec.chupLaiVung()
      else if (p.lenh === 'canvas') lamViec.canvas()
      else if (p.lenh === 'khay') lamViec.khay()
      else if (p.lenh === 'tim') lamViec.tim(tuyen)
      else if (p.lenh === 'ghim') lamViec.ghim(tuyen)
    } catch (e) {
      ghiLog('lien-ket: ' + p.lenh + ' LOI khi chay: ' + (e && e.message))
      return { ok: false, lenh: p.lenh, loi: 'loi-khi-chay' }
    }
    ghiLog('lien-ket: ' + p.lenh + ' OK' + (p.lenh === 'ghim' ? ' ' + path.basename(tuyen) : ''))
    return { ok: true, lenh: p.lenh }
  }
  function bo(lenh, loi) { ghiLog('lien-ket: BO ' + lenh + ' (' + loi + ')'); return { ok: false, lenh, loi } }

  return { xuLy, tuArgv }
}

/** Cac link de hien trong Cai dat cho dan dev sao chep (chuoi that, khong dich). */
const MAU_LIEN_KET = [
  { lenh: 'aioshot://chup', cflag: '--chup' },
  { lenh: 'aioshot://chup-lai-vung', cflag: '--chup-lai-vung' },
  { lenh: 'aioshot://canvas', cflag: '--canvas' },
  { lenh: 'aioshot://khay', cflag: '--khay' },
  { lenh: 'aioshot://tim?chu=hoa%20don', cflag: '--tim=hoa don' },
  { lenh: 'aioshot://ghim?file=ten-anh.png', cflag: '--ghim=ten-anh.png' },
]

module.exports = { taoLienKet, tuArgv, phanTich, kiemFileAnh, GIAO_THUC, LENH, MAU_LIEN_KET, KHOANG_TOI_THIEU_MS, TOI_DA_TRONG_CUA_SO }
