'use strict'

/* =========================================================================
   kho.js — noi anh SONG THAT tren dia + cau hinh nho vi tri khay.
   -------------------------------------------------------------------------
   Khay anh chi la CAI NHIN. File that nam trong thu muc nay — do la ly do
   dong cua so ghim / tat app khong lam mat anh, va la nen de sau nay
   keo-tha file ra Premiere / Zalo / Messenger.
   ========================================================================= */

const { app } = require('electron')
const path = require('path')
const fs = require('fs')

/**
 * Thu muc GOC cua tool (noi dat package.json / file .exe khi da dong goi).
 * Khi chua dong goi: `app.getAppPath()` = thu muc du an.
 * Khi da dong goi: ma nguon nam trong app.asar (KHONG ghi duoc) — phai lay
 * thu muc chua file .exe.
 */
function thuMucGoc() {
  return app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath()
}

/**
 * Thu muc luu anh. Mac dinh:
 *   - ban dong goi: %LOCALAPPDATA%/AiO Shot & Save/Anh chup (NGOAI thu muc cai)
 *   - chay tu nguon: <thu muc du an>/Anh chup
 *
 * ☠️ 14/09 MAT ANH THAT: mac dinh cu la <thu muc cai>/Anh chup. Bo cai NSIS
 * one-click khi CAI DE xoa sach thu muc cai roi moi chep ban moi -> 2 anh anh
 * Tien chup sang 14/09 bien mat (khong vao thung rac), phai cuu tu ban sao
 * harness. Moi lan cap nhat = mat het anh nguoi dung de mac dinh. Anh KHONG
 * duoc nam trong thu muc cai. Dung LOCALAPPDATA (khong roaming, khong OneDrive)
 * — cung thu muc ban Tauri tung dung, 75 anh cu van o do.
 *
 * ☠️ ANH TIEN NGHIEM CAM luu vao `Pictures` mac dinh cua may (24/08).
 * Ly do do duoc: may nay co `Pictures` bi OneDrive doi huong sang
 * `C:\Users\hadan\OneDrive\Pictures` — moi tam chup se tu dong bay len dam may.
 * ⇒ Anh phai nam TRONG thu muc cua tool. Dung `app.getPath('pictures')` o day.
 */
function thuMucAnh() {
  const c = docCauHinh()
  if (c.thuMucAnh) return c.thuMucAnh
  if (app.isPackaged) {
    /* ☠️ 14/09 (0.4.16): KHONG dau '&', KHONG dau cach trong duong dan mac dinh.
       Do that: cung file, cung vi tri AppData\Local, cung quyen — thu muc
       `AiO Shot & Save\Anh chup` keo vao Chrome/Messenger/Lark/Teams/Zalo web
       la file RONG (Chrome: size=0, lastMod=gio tha; Lark: -1 byte); doi sang
       `AiOTest` (khong &, khong cach) la nhan du 805.735 byte. Chromium cap
       quyen doc file tha theo chuoi duong dan, gap '&' la lech. Thu muc nguoi
       dung tu chon co '&' van se dinh — viec cho. */
    const goc = process.env.LOCALAPPDATA || app.getPath('userData')
    return path.join(goc, 'shotandsave') // 14/09 anh Tien: "doi ten folder, file thanh shotandsave"
  }
  return path.join(thuMucGoc(), 'Anh chup')
}

/* ── KEO-THA AN TOAN (14/09) ─────────────────────────────────────────────
   Anh Tien: "anh khong biet '&' la ky tu dac biet — em lam sao de khong loi ky tu
   do anh la duoc". Do that: duong dan co '&' (thu muc nguoi dung tu chon) -> app
   Chromium (Chrome/Lark/Teams/Zalo/Messenger) nhan file RONG. Cach: luc keo, neu
   duong dan co ky tu ngoai [A-Za-z0-9 _ - . : \ /] thi tao HARD LINK (tuc thi,
   khong ton dung luong; khac o dia thi copy) trong thu muc an toan
   %LOCALAPPDATA%/shotandsave/.keo/<ten file> va dua LIEN KET do cho app dich.
   Anh goc nam nguyen cho cu. ~~Thu muc .keo don sach moi lan mo app.~~ 04/10: KHONG don sach nua, xem ghi chu ngay duoi. */
const AN_TOAN = /^[A-Za-z0-9_\-.:\\/]+$/
function thuMucKeo() {
  const goc = process.env.LOCALAPPDATA || app.getPath('userData')
  return path.join(goc, 'shotandsave', '.keo')
}
/* 04/10 (ECC soat, DA DO; anh chot huong A "giu file tam lai"): ban cu XOA SACH `.keo` moi lan mo app. Nguoi dung
   Windows co ten chua dau cach / dau tieng Viet thi thu muc anh MAC DINH (%LOCALAPPDATA%) da "khong an toan" -> moi lan
   keo deu di qua `.keo` -> keo anh vao Premiere, mo lai app la file do MAT (do: `Nguyen Van A` va `Tiến` mat, `DRT-G21`
   con). Nay:
     - KHONG xoa `.keo` luc mo app. So `.keo/.goc.json` ghi { <ten lien ket>: <duong dan file goc> }.
     - Luc mo app chi bo lien ket khi DU 3 dieu: file goc khong con o cho cu + thu muc cua no van con (khong phai o dia
       dang thao) + lien ket la ban DUY NHAT con lai cua du lieu (nlink 1: anh goc da bi xoa han, hoac day la ban chep
       sang o khac). Anh goc chi DOI CHO / dang nam trong Thung rac thi lien ket khong ton dia -> giu. Khong ro goc -> giu.
     - Hai file goc khac nhau trung ten sau khi lam sach -> lien ket thu hai them hau to -2, -3 (truoc: de len nhau). */
const TEN_SO_KEO = '.goc.json'
const khoaDuong = (p) => {
  const r = path.resolve(String(p || ''))
  return process.platform === 'win32' ? r.toLowerCase() : r
}
/** So lien ket. {} = chua co / hong (so chi la bo nho phu: mat thi chi la khong don duoc). null = co ma khong doc duoc. */
function docSoKeo() {
  let txt
  try { txt = fs.readFileSync(path.join(thuMucKeo(), TEN_SO_KEO), 'utf8') } catch (e) {
    return e && e.code === 'ENOENT' ? {} : null
  }
  try {
    const s = JSON.parse(txt)
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {}
  } catch (e) { return {} }
}
function ghiSoKeo(so) {
  try {
    const f = path.join(baoDamThuMuc(thuMucKeo()), TEN_SO_KEO)
    fs.writeFileSync(f + '.tmp', JSON.stringify(so, null, 1))
    fs.renameSync(f + '.tmp', f)
    return true
  } catch (e) {
    baoKho('keo: KHONG GHI DUOC so lien ket: ' + ((e && e.code) || e))
    return false
  }
}
function noiLienKet(filePath, dich) {
  try { fs.unlinkSync(dich) } catch (e) {}
  try { fs.linkSync(filePath, dich) } catch (e) { fs.copyFileSync(filePath, dich) } // khac o dia -> copy
}

function duongDanKeoAnToan(filePath) {
  if (!filePath) return filePath
  if (AN_TOAN.test(filePath)) return filePath
  try {
    const dir = baoDamThuMuc(thuMucKeo())
    const so = docSoKeo()
    // Ten file cung phai sach (thu muc nguoi dung co the dat ten anh co '&'/dau cach)
    const sach = path.basename(filePath).replace(/[^A-Za-z0-9_.-]/g, '-')
    let ten = sach
    if (so) {
      const duoi = path.extname(sach)
      const than = sach.slice(0, sach.length - duoi.length)
      // ten nay dang la lien ket cua mot file goc KHAC con ton tai -> lay ten khac, dung de len
      for (let i = 2; so[ten] && khoaDuong(so[ten]) !== khoaDuong(filePath) && fs.existsSync(so[ten]); i++) ten = than + '-' + i + duoi
    }
    const dich = path.join(dir, ten)
    let conMoi = false
    try {
      const a = fs.statSync(filePath), b = fs.statSync(dich)
      conMoi = a.size === b.size && a.mtimeMs <= b.mtimeMs // da co, con moi
    } catch (e) {}
    if (!conMoi) noiLienKet(filePath, dich)
    if (so && so[ten] !== filePath) { so[ten] = filePath; ghiSoKeo(so) }
    return dich
  } catch (e) { return filePath } // khong lam duoc thi keo duong cu, con hon khong keo
}

/** Goi 1 lan luc mo app. KHONG xoa sach nua (xem ghi chu 04/10 o tren). Tra { giu, bo, khongRo }. */
function donKeoAnToan() {
  /* 04/10 14:4x: banChep / byteChep = lien ket dang GIU ma la BAN CHEP day du (nlink 1 trong khi anh goc con): thu muc
     anh nam o o dia khac `.keo` nen khong noi cung duoc. Truoc huong A no bi don moi lan mo app; nay nam lai toi khi
     xoa file goc, ke ca VIDEO. Chua co cach bo ma khong lam file da dua cho Premiere mat lai -> dem de biet that. */
  const kq = { giu: 0, bo: 0, khongRo: 0, banChep: 0, byteChep: 0 }
  try {
    const dir = thuMucKeo()
    if (!fs.existsSync(dir)) return kq
    const ds = fs.readdirSync(dir).filter((t) => t !== TEN_SO_KEO && t !== TEN_SO_KEO + '.tmp')
    const so = docSoKeo()
    if (!so) { kq.khongRo = ds.length; return kq } // khong doc duoc so: giu het
    let doi = false
    for (const ten of ds) {
      const goc = so[ten]
      if (!goc) { kq.khongRo++; continue }                               // khong ro goc: GIU
      if (fs.existsSync(goc)) {                                           // anh goc con: GIU
        kq.giu++
        try { const s = fs.statSync(path.join(dir, ten)); if (s.nlink === 1) { kq.banChep++; kq.byteChep += s.size } } catch (e) {}
        continue
      }
      if (!fs.existsSync(path.dirname(goc))) { kq.khongRo++; continue }   // ca thu muc / o dia khong thay: khong ket luan
      const f = path.join(dir, ten)
      let nlink = 1
      try { nlink = fs.statSync(f).nlink } catch (e) {}
      if (nlink > 1) { kq.giu++; continue }                               // du lieu con o cho khac (doi cho / Thung rac): giu
      try { fs.unlinkSync(f); kq.bo++; delete so[ten]; doi = true } catch (e) { kq.khongRo++ }
    }
    for (const ten of Object.keys(so)) {
      if (!fs.existsSync(path.join(dir, ten))) { delete so[ten]; doi = true } // muc trong so ma lien ket khong con
    }
    if (doi) ghiSoKeo(so)
  } catch (e) {}
  return kq
}

/** File goc vua duoc GHI DE bang ghiDeAnh (file moi doi ten vao cho cu -> lien ket cung van tro ban CU): noi lai.
    Tra so lien ket da lam moi. */
function lamMoiKeo(filePath) {
  let n = 0
  try {
    const so = docSoKeo()
    if (!so) return 0
    for (const ten of Object.keys(so)) {
      if (khoaDuong(so[ten]) !== khoaDuong(filePath)) continue
      const dich = path.join(thuMucKeo(), ten)
      if (!fs.existsSync(dich)) continue
      noiLienKet(filePath, dich)
      n++
    }
  } catch (e) {}
  return n
}

/** Ghi de MOT file anh co san, ATOMIC: ghi sang file tam CUNG thu muc roi doi ten vao. Hong (file dang bi app khac
    giu, dia day, mat quyen) thi file cu con NGUYEN — truoc: writeFileSync thang vao file that, hong giua chung la file
    cut. Tra { ok, loi }. Ben goi PHAI kiem `ok` truoc khi coi nhu da luu (04/10, loi "lam mo ma file gui di chua mo"). */
/* 04/10 14:4x (soat commit 565b446): DOI TEN hong thi THU GHI THANG vao file dich mot lan, tu file tam da ghi du.
   Vi sao: tren Windows doi ten de len file dang bi app khac mo ma khong cho xoa la hong (EPERM / EBUSY), trong khi cach
   cu (ghi thang vao file) van ghi duoc neu app do cho ghi. Khong co duong lui thi ca TRUOC DAY ghi duoc bien thanh
   "khong luu duoc", va anh ghim bi tra ve ban cu = mat net vua ve. Ca hai cach deu hong moi tra ok=false.
   CHUA DO tren Windows that (bai kiem gia loi doi ten). Tra { ok, loi, cach: 'doi-ten' | 'ghi-thang', loiDoiTen }. */
function ghiDeAnh(filePath, buf) {
  const tam = filePath + '.tam-' + process.pid
  const ma = (e) => (e && e.code) || (e && e.message) || 'loi'
  try { fs.writeFileSync(tam, buf) } catch (e) {
    try { fs.unlinkSync(tam) } catch (e2) {} // file tam do chinh lan goi nay tao, dung ten
    return { ok: false, loi: ma(e) }
  }
  try {
    fs.renameSync(tam, filePath)
    return { ok: true, loi: null, cach: 'doi-ten' }
  } catch (e) {
    let kq
    try {
      fs.copyFileSync(tam, filePath)
      kq = { ok: true, loi: null, cach: 'ghi-thang', loiDoiTen: ma(e) }
    } catch (e2) { kq = { ok: false, loi: ma(e) + ' / ' + ma(e2) } }
    try { fs.unlinkSync(tam) } catch (e3) {}
    return kq
  }
}

function baoDamThuMuc(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** Ten file theo thoi diem chup: AiO-2026-08-24-231530.png */
/* Ten file: 'shotandsave-YYYY-MM-DD-HHMMSS-mmm.ext' (14/09, truoc 'AiO-'). */
function tenTheoGio(d, duoi) {
  const p = (n, k) => String(n).padStart(k || 2, '0')
  return (
    'shotandsave-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) +
    '-' + p(d.getMilliseconds(), 3) + '.' + (duoi || 'png')
  )
}

/**
 * Ghi mot NativeImage ra file PNG. Tra ve duong dan, hoac null neu that bai
 * (khong nem — mat anh tren dia thi van con anh ghim, dung lam sap app).
 */
/**
 * Luu anh theo dinh dang nguoi dung chon (anh Tien 26/08):
 * dd = { loai: 'jpeg' | 'png', q: 60|85|95 }. Mac dinh jpeg q85 ("cao").
 * PNG luon lossless (q khong ap dung).
 */
function luuAnh(image, dd) {
  try {
    const loai = (dd && dd.loai) === 'png' ? 'png' : 'jpeg'
    const q = (dd && dd.q) || 85
    const dir = baoDamThuMuc(thuMucAnh())
    const file = path.join(dir, tenTheoGio(new Date(), loai === 'png' ? 'png' : 'jpg'))
    fs.writeFileSync(file, loai === 'png' ? image.toPNG() : image.toJPEG(q))
    return file
  } catch (err) {
    console.error('[kho] khong luu duoc anh:', err)
    return null
  }
}

/* 01/10 QUAY VIDEO: duong dan file video MOI trong thu muc anh — 'shotandsave-video-YYYY-MM-DD-HHMMSS-mmm.<duoi>'.
   Tien to 'shotandsave-video-' de khay anh thuong khong nham (khay anh chi nap .png/.jpg). Tra null neu khong tao
   duoc thu muc (ben goi phai kiem). */
function duongVideoMoi(duoi) {
  try {
    const dir = baoDamThuMuc(thuMucAnh())
    return path.join(dir, tenTheoGio(new Date(), duoi || 'mp4').replace('shotandsave-', 'shotandsave-video-'))
  } catch (err) {
    console.error('[kho] khong tao duoc duong dan video:', err)
    return null
  }
}

/* ── Cau hinh (vi tri khay, thu muc anh) ─────────────────────────────────
   Nam trong userData, KHONG nam canh ma nguon — de ban cai dat sau nay
   khong ghi de len cau hinh cua nguoi dung. */

function duongDanCauHinh() {
  return path.join(app.getPath('userData'), 'cau-hinh.json')
}

/* 04/10 (ECC soat, DA DO): ban cu `docCauHinh` tra {} cho MOI loi, `ghiCauHinh` ghi de tu {} do -> file co BOM
   (mo bang Notepad) doc ra 0 muc, keo khay 1 lan la file chi con `viTriKhay`: mat phim tat + ngon ngu + thu muc anh.
   Luat (so loi #16): ham DOC phan biet "chua co" voi "khong doc duoc"; ham GHI khong ghi de len thu vua doc that bai.
     nhoCauHinh = ban doc duoc / ghi duoc gan nhat (RAM) -> file tam thoi khong doc duoc thi app van dung dung
                  thu muc anh + phim tat cua nguoi dung, khong roi ve mac dinh.
   That bai KHONG im lang: main.js noi `ghiLog` vao qua noiNhatKy(). */
let nhoCauHinh = null
let ghiNhatKy = null
let loiDocCu = ''
function noiNhatKy(fn) { ghiNhatKy = typeof fn === 'function' ? fn : null }
function baoKho(msg) {
  try { if (ghiNhatKy) ghiNhatKy(msg); else console.error('[kho] ' + msg) } catch (e) {}
}

/** -> { tt: 'co' | 'chua-co' | 'khong-doc-duoc', c } — c luon la object dung duoc ngay. */
function docCauHinhThat() {
  const file = duongDanCauHinh()
  const tuRam = () => (nhoCauHinh ? JSON.parse(nhoCauHinh) : {}) // nho dang CHU: moi lan tra mot ban rieng
  let txt
  try { txt = fs.readFileSync(file, 'utf8') } catch (e) {
    if (e && e.code === 'ENOENT') { loiDocCu = ''; return { tt: 'chua-co', c: {} } }
    const ma = (e && e.code) || 'loi-doc'
    if (ma !== loiDocCu) { loiDocCu = ma; baoKho('cau-hinh: KHONG DOC DUOC (' + ma + '), dung ban trong RAM, khong ghi de') }
    return { tt: 'khong-doc-duoc', c: tuRam() }
  }
  loiDocCu = ''
  try {
    if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1) // BOM tung lam JSON.parse chet (24/08)
    const c = JSON.parse(txt)
    if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('khong phai object')
    nhoCauHinh = txt
    return { tt: 'co', c }
  } catch (e) {
    /* Hong that: CAT ban hong sang ben (lay lai tay duoc) roi dung ban trong RAM neu co, khong thi ve mac dinh. */
    const d = new Date()
    const p2 = (n) => String(n).padStart(2, '0')
    const dich = file.replace(/\.json$/i, '') + '.hong-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) +
      '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.json'
    try { fs.renameSync(file, dich) } catch (e2) {
      baoKho('cau-hinh: file HONG (' + e.message + ') ma khong cat duoc (' + ((e2 && e2.code) || 'loi') + '), khong ghi de')
      return { tt: 'khong-doc-duoc', c: tuRam() }
    }
    baoKho('cau-hinh: file HONG (' + e.message + '), da cat sang ' + path.basename(dich) +
      (nhoCauHinh ? ', dung ban trong RAM' : ', ve mac dinh'))
    return { tt: 'chua-co', c: tuRam() }
  }
}

function docCauHinh() {
  return docCauHinhThat().c
}

function ghiCauHinh(patch) {
  const r = docCauHinhThat()
  if (r.tt === 'khong-doc-duoc' && !nhoCauHinh) {
    /* Co file ma khong doc duoc + chua doc duoc lan nao: ghi luc nay = xoa moi cai dat khac. Tra ban ghep cho
       lan nay (app chay tiep), KHONG dung vao dia. */
    baoKho('cau-hinh: BO QUA lan ghi [' + Object.keys(patch || {}).join(',') + '] vi chua doc duoc file')
    return Object.assign({}, r.c, patch)
  }
  try {
    const cur = r.c
    const next = Object.assign({}, cur, patch)
    fs.mkdirSync(path.dirname(duongDanCauHinh()), { recursive: true })
    /* Ghi ATOMIC (tmp + rename): file nay duoc ghi RAT thuong xuyen (moi lan
       keo khay la savePos). May sap/restart giua writeFileSync thang vao file
       that -> JSON hong -> docCauHinh tra {} -> MOI cai dat ve mac dinh
       (phim tat, ngon ngu, kieu khay) ma khong ai biet vi sao (31/08). */
    const tmp = duongDanCauHinh() + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2))
    fs.renameSync(tmp, duongDanCauHinh())
    nhoCauHinh = JSON.stringify(next)
    return next
  } catch (err) {
    baoKho('cau-hinh: KHONG GHI DUOC [' + Object.keys(patch || {}).join(',') + ']: ' + ((err && err.code) || (err && err.message) || err))
    return docCauHinh()
  }
}

module.exports = {
  thuMucGoc, thuMucAnh, baoDamThuMuc, luuAnh, duongDanKeoAnToan, donKeoAnToan, lamMoiKeo, ghiDeAnh, thuMucKeo,
  duongVideoMoi, docCauHinh, ghiCauHinh, noiNhatKy,
}
