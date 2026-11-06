'use strict'

/* =========================================================================
   tu-dat-ten.js — TU DAT TEN FILE THEO NOI DUNG ANH (06/11/2026, ROADMAP 0k #1)
   -------------------------------------------------------------------------
   Nguoi xai: Cai dat > "Tu dat ten file theo noi dung" (MAC DINH TAT). Bat len thi sau khi luu anh, app doc chu trong anh o NEN
   (khi ranh) roi doi ten file thanh vai chu dau co nghia + gio, vi du `Bao gia khach ABC 1432.jpg` thay cho
   `shotandsave-2026-11-06-143215-123.jpg`. Mau ten tu dat dung {noidung} {ngay} {gio} {app}.
   Vi du doi thuong: ngan keo toan nhan "IMG_0001, IMG_0002"; bat tinh nang nay thi moi tam anh tu duoc dan nhan ghi ten no.

   LUAT AN TOAN (anh Tien, bai 5bi: file da giao cho anh la file anh DANG DUNG):
   - CHI doi ten file do chinh app dat (`shotandsave-YYYY-MM-DD-HHMMSS-mmm.ext`), khong dung vao anh khac / video / Storyboard / lam dep.
   - KHONG doi ten khi: file da tung duoc keo ra app khac (kho.daGiao) · file doi (gio sua / dung luong) tu luc xep hang ·
     ten file dang co mat trong so bo cuc Canvas (Canvas luu vi tri theo TEN) · tinh nang da tat · khong doc duoc chu.
   - KHONG BAO GIO ghi de: doi ten qua kho.doiTenKhongDe (lien ket cung / kiem ton tai), trung ten thi them " 2", " 3".
   - Ten chi gom [A-Za-z0-9 _.-], bo dau tieng Viet, bo "&" va moi ky tu la (so loi #11), toi da 80 ky tu.
   - CHE THONG MINH: dong chu co email, so dien thoai, so the, so dai (>= 5 chu so lien), duong link, tu khoa mat khau / token /
     ma OTP... BI BO CA DONG truoc khi chon chu cho ten; ten cuoi cung con bi kiem lai lan nua.
   Khong phu thuoc Electron (tiem docChu, doiTen, ...) -> do duoc bang node thuan: npm run test:tudatten.
   ========================================================================= */

const fs = require('fs')
const path = require('path')

const TEN_APP = /^shotandsave-\d{4}-\d{2}-\d{2}-\d{6}-\d{3}\.(png|jpe?g|webp)$/i
const TOI_DA_TU = 5
const TOI_DA_KY_TU = 40
const TOI_DA_TEN = 80
const MAU_MAC_DINH = '{noidung} {gio}'
const DAU_PHU = /[̀-ͯ]/g
const TEN_CAM = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

const RE_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
const RE_LINK = /(https?:\/\/|www\.|\.(com|net|org|vn|io|co)\b\/)/i
const RE_NHAY_CAM = /(password|passwd|mat khau|matkhau|token|secret|api[\s_-]?key|bearer|\botp\b|ma xac|cvv|cvc|iban|swift|card number|so the|so tai khoan|stk|private key|ssh-rsa|credential)/i

const boDau = (s) => String(s == null ? '' : s).normalize('NFD').replace(DAU_PHU, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

/** Dong chu nay co dung toi thong tin nhay cam khong? (email / so dien thoai / so the / so dai / link / tu khoa mat khau) */
function dongNhayCam(dong) {
  const s = String(dong || '')
  const khongDau = boDau(s).toLowerCase()
  if (RE_EMAIL.test(s) || RE_LINK.test(s) || RE_NHAY_CAM.test(khongDau)) return true
  const soChuSo = (s.match(/\d/g) || []).length
  if (soChuSo >= 7) return true // so dien thoai, so the, ma so (ke ca tach bang dau cach / dau gach)
  if (/\d{5,}/.test(s)) return true
  return false
}

/** Mot "tu" dung duoc trong ten: chu la, khong tron chu-so dai (ma khoa / ID), khong qua dai. */
function tuDung(t) {
  if (t.length < 2 || t.length > 20) return false
  const chu = (t.match(/[A-Za-z]/g) || []).length
  const so = (t.match(/\d/g) || []).length
  if (chu < 2) return false
  if (so > 0 && t.length >= 7) return false // dang ma khoa / ID
  if (so > 3) return false
  if (chu >= 3 && !/[aeiouyAEIOUY]/.test(t) && !(t === t.toUpperCase() && t.length <= 5)) return false // OCR vo nghia kieu "xkq"
  return true
}

/**
 * Chon vai chu co nghia tu cac dong OCR (tren xuong duoi). Tra { noiDung: 'Bao gia khach ABC' | '', boQua: so dong bi che }.
 */
function chonNoiDung(dong) {
  let boQua = 0
  const ds = []
  for (const raw of (Array.isArray(dong) ? dong : [])) {
    if (dongNhayCam(raw)) { boQua++; continue }
    const tu = boDau(raw).replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
    const tot = tu.filter(tuDung)
    if (tot.length >= 1 && tot.length >= Math.ceil(tu.length * 0.5)) ds.push(tot) // dong phan lon la rac thi bo
  }
  const lay = []
  let ky = 0
  const them = (tu) => {
    for (const t of tu) {
      if (lay.length >= TOI_DA_TU) return
      if (ky + t.length + (lay.length ? 1 : 0) > TOI_DA_KY_TU) return
      lay.push(t); ky += t.length + (lay.length > 1 ? 1 : 0)
    }
  }
  // lay theo thu tu tren xuong; chua du 3 tu thi noi them NGUYEN dong ke tiep (toi da 5 tu)
  for (const t of ds) {
    if (lay.length >= 3) break
    them(t)
  }
  const noiDung = lay.join(' ')
  // kiem lai lan cuoi: ten khong duoc con dang nhay cam
  if (!noiDung || dongNhayCam(noiDung)) return { noiDung: '', boQua }
  return { noiDung, boQua }
}

/** Lam sach thanh ten file an toan (khong phan duoi). */
function lamSachTen(s) {
  let t = boDau(s).replace(/[^A-Za-z0-9 _.\-]+/g, ' ').replace(/\s+/g, ' ').trim()
  t = t.replace(/^[.\s]+|[.\s]+$/g, '')
  if (t.length > TOI_DA_TEN) t = t.slice(0, TOI_DA_TEN).replace(/\s+\S*$/, '').trim() || t.slice(0, TOI_DA_TEN)
  t = t.replace(/[.\s]+$/g, '')
  if (!t || TEN_CAM.test(t)) return ''
  return t
}

const p2 = (n) => String(n).padStart(2, '0')

/** Ap mau ten. Dung {noidung} ma khong co noi dung -> null (giu ten cu). */
function dungTen(mau, ctx) {
  const m = String(mau || MAU_MAC_DINH)
  const d = ctx.ngay || new Date()
  if (/\{noidung\}/i.test(m) && !ctx.noiDung) return null
  const t = m
    .replace(/\{noidung\}/gi, ctx.noiDung || '')
    .replace(/\{ngay\}/gi, d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()))
    .replace(/\{gio\}/gi, p2(d.getHours()) + p2(d.getMinutes()))
    .replace(/\{app\}/gi, lamSachTen(ctx.app || ''))
  return lamSachTen(t) || null
}

/** Mau nguoi dung go: cat 80 ky tu, rong / chi toan ky tu bi bo (khong ra duoc ten) -> mau mac dinh. */
function mauHopLe(mau) {
  const m = String(mau == null ? '' : mau).slice(0, 80).trim()
  return m && dungTen(m, { noiDung: 'Mau', app: 'App', ngay: new Date(2026, 10, 6, 14, 32) }) ? m : MAU_MAC_DINH
}

/** Ten chua dung trong `dir`: `ten.ext`, `ten 2.ext`, ... */
function tenChuaDung(dir, ten, duoi, existsSync) {
  const ex = existsSync || fs.existsSync
  for (let i = 1; i < 100; i++) {
    const t = ten + (i === 1 ? '' : ' ' + i) + duoi
    if (!ex(path.join(dir, t))) return t
  }
  return null
}

const laTenApp = (f) => TEN_APP.test(path.basename(String(f || '')))

/** Doc gio chup tu ten file `shotandsave-2026-11-06-143215-123.jpg` (de {ngay} {gio} dung gio CHUP, khong phai gio doi ten). */
function gioTuTenFile(f) {
  const m = /^shotandsave-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})-/.exec(path.basename(String(f || '')))
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : new Date()
}

/**
 * opts: {
 *   bat: () => bool            tinh nang dang bat?
 *   mau: () => string          mau ten
 *   docChu: async (file) => { ok, dong: [chuoi], loi? }
 *   dangBan: () => bool        dang chup / quay: nhuong
 *   daGiao: (file) => bool     da keo ra ngoai?
 *   coThamChieu: (file) => bool  Canvas dang tro toi ten file nay?
 *   doiTen: (cu, moi) => { ok, loi? }
 *   apDung: (cu, moi, chu) => void   cap nhat MOI so (khay, anh ghim, chi muc tim anh, Canvas)
 *   layApp: async (file, info) => string   (tuy chon) ten ung dung nguon, chi goi khi mau co {app}
 *   ghiLog, nghiMs (mac dinh 400), tuoiToiThieuMs (mac dinh 1200), hetHanMs (mac dinh 10 phut) }
 */
function taoTuDatTen(opts) {
  const log = opts.ghiLog || (() => {})
  const nghiMs = opts.nghiMs == null ? 400 : opts.nghiMs
  const tuoiMin = opts.tuoiToiThieuMs == null ? 1200 : opts.tuoiToiThieuMs
  const hetHan = opts.hetHanMs == null ? 10 * 60 * 1000 : opts.hetHanMs
  const hang = []
  let chay = false
  const thongKe = { doi: 0, giu: 0, loi: 0, lyDo: {} }
  const ngu = (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (t.unref) t.unref() })
  const dau = (st) => (st ? st.size + ':' + Math.round(st.mtimeMs) : '')
  const bo = (lyDo, file) => { thongKe.giu++; thongKe.lyDo[lyDo] = (thongKe.lyDo[lyDo] || 0) + 1; log('tu-dat-ten GIU ten cu (' + lyDo + ') ' + path.basename(file)) }

  async function xuLy(m) {
    const file = m.file
    if (!opts.bat()) return bo('da-tat', file)
    if (Date.now() - m.xep > hetHan) return bo('qua-han', file)
    let st
    try { st = fs.statSync(file) } catch (e) { return bo('file-mat', file) }
    if (dau(st) !== m.dau) return bo('file-doi', file)
    if (opts.daGiao(file)) return bo('da-giao', file)
    const mauNay = String(opts.mau() || MAU_MAC_DINH)
    const canChu = /\{noidung\}/i.test(mauNay)
    let dong = [], chu = ''
    if (canChu) {
      let kq
      try { kq = await opts.docChu(file) } catch (e) { kq = { ok: false, loi: e && e.message } }
      if (!kq || !kq.ok || !(kq.dong || []).length) { thongKe.loi++; return bo('khong-doc-duoc-chu', file) }
      dong = kq.dong
      chu = dong.join(' ')
    }
    let app = ''
    if (/\{app\}/i.test(mauNay) && opts.layApp) { try { app = (await Promise.race([opts.layApp(file, m.info), ngu(5000).then(() => '')])) || '' } catch (e) { app = '' } }
    const nd = canChu ? chonNoiDung(dong) : { noiDung: '' }
    if (canChu && !nd.noiDung) return bo(nd.boQua ? 'chi-con-chu-nhay-cam' : 'khong-co-chu-co-nghia', file)
    const ten = dungTen(mauNay, { noiDung: nd.noiDung, app, ngay: m.gio })
    if (!ten) return bo('ten-rong', file)
    // kiem lai moi dieu kien SAU khi doc chu (luc doc, nguoi dung co the keo / ghim / mo Canvas)
    if (!opts.bat()) return bo('da-tat', file)
    let st2
    try { st2 = fs.statSync(file) } catch (e) { return bo('file-mat', file) }
    if (dau(st2) !== m.dau) return bo('file-doi', file)
    if (opts.daGiao(file)) return bo('da-giao', file)
    if (opts.coThamChieu && opts.coThamChieu(file)) return bo('canvas-dang-dung', file)
    const dir = path.dirname(file)
    const duoi = path.extname(file).toLowerCase()
    const tenFile = tenChuaDung(dir, ten, duoi, (p) => fs.existsSync(p))
    if (!tenFile) return bo('het-ten', file)
    const moi = path.join(dir, tenFile)
    const r = opts.doiTen(file, moi)
    if (!r || !r.ok) { thongKe.loi++; return bo('doi-ten-loi:' + ((r && r.loi) || '?'), file) }
    thongKe.doi++
    try { opts.apDung(file, moi, chu) } catch (e) { log('tu-dat-ten apDung LOI ' + (e && e.message)) }
    log('tu-dat-ten ' + path.basename(file) + ' -> ' + tenFile + (nd.boQua ? ' (che ' + nd.boQua + ' dong nhay cam)' : ''))
  }

  async function vong() {
    if (chay) return
    chay = true
    try {
      while (hang.length) {
        if (opts.dangBan()) { await ngu(800); continue }
        const m = hang[0]
        const tuoi = Date.now() - m.xep
        if (tuoi < tuoiMin) { await ngu(tuoiMin - tuoi); continue }
        hang.shift()
        const t0 = Date.now()
        try { await xuLy(m) } catch (e) { thongKe.loi++; log('tu-dat-ten LOI ' + (e && e.stack || e)) }
        await ngu(Math.max(nghiMs, (Date.now() - t0) * 1)) // nghi bang thoi gian vua lam: toi da ~50% mot nhan
      }
    } finally { chay = false }
  }

  /** Xep hang mot file vua luu. info (tuy chon): { tam: {x,y} } cho {app}. Tra true neu da nhan. */
  function xepHang(file, info) {
    try {
      if (!opts.bat() || !laTenApp(file)) return false
      const st = fs.statSync(file)
      hang.push({ file, dau: dau(st), xep: Date.now(), gio: gioTuTenFile(file), info: info || null })
      vong()
      return true
    } catch (e) { return false }
  }

  return { xepHang, vong, thongKe, hang: () => hang.length, dangChay: () => chay }
}

module.exports = {
  taoTuDatTen, chonNoiDung, dongNhayCam, dungTen, mauHopLe, lamSachTen, tenChuaDung, laTenApp, gioTuTenFile, boDau, MAU_MAC_DINH, TEN_APP,
}
