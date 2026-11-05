'use strict'
/* Cap nhat phan mem (05/11/2026, gop y #10): app tu hoi mot file JSON cong khai xem co ban moi khong.
   Anh chot: Mac KHONG tu cai (21/09, khong mua Apple Developer), khong mua chung chi ky so (14/08)
   => CHI bao co ban moi + nut Tai ve mo trinh duyet. Windows: chua tu cai o ban nay (chua co noi dat bo cai
   cong khai); thiet ke de sau gan duoc: JSON da co `linkWin`, trangThai() tra `tuCai: false` — ve sau chi them
   mot nhanh o main.js (tai bo cai vao thu muc tam + chay) roi doi co nay.

   ☠️ FILE JSON NAY CHUA CO TREN WEB (05/11/2026). Duong dan du kien `LINK_BAN_MOI` ben duoi: khi chua dang len
   thi may chu tra 404 => app im lang, chi ghi log (dung y dinh). Dang len = them file `ban-moi.json` vao
   `Website/AiO ShotSave Web/` roi deploy. Dinh dang:
     { "phienBan": "0.11.0",
       "linkWin": "https://.../AiO-Shot-and-Save-Setup-0.11.0.exe",
       "linkMac": "https://.../AiO-Shot-and-Save-0.11.0.dmg",
       "ghiChu": { "vi": "...", "en": "..." } }

   Luat: viec bao tri tu chay ngam, chi hien khi CO BAN MOI. Khong mang / JSON hong / 404 / het gio => im lang
   (ghi log), khong bao loi, khong treo app. Dang chup / dang quay => bo qua (thu lai sau 5 phut).
   Module thuan (khong require electron): moi thu bat ben ngoai qua tham so de bai do chay duoc voi may chu gia. */

const LINK_BAN_MOI = 'https://aio-shotsave.vercel.app/ban-moi.json'
const SAU_KHI_MO_MS = 30 * 1000          // mo app xong 30 giay moi hoi lan dau (khong tranh gianh luc khoi dong)
const CHU_KY_MS = 24 * 60 * 60 * 1000    // roi moi 24 gio
const THU_LAI_KHI_BAN_MS = 5 * 60 * 1000 // dang chup / quay thi hen lai 5 phut
const HET_GIO_MS = 10 * 1000
const TOI_DA_KY_TU = 64 * 1024           // JSON that chi vai tram byte; qua 64 KB la khong phai file cua minh

/** "0.10.1" -> [0,10,1]. Chap nhan "v" dau, toi da 4 so. Sai dinh dang -> null. */
function chuanPhienBan(s) {
  if (typeof s !== 'string') return null
  const m = /^v?(\d{1,6}(?:\.\d{1,6}){0,3})$/.exec(s.trim())
  return m ? m[1].split('.').map(Number) : null
}

/** So SO tung thanh phan (0.10.1 > 0.9.9; "0.10" = "0.10.0"). Tra -1 | 0 | 1, hoac null neu sai dinh dang. */
function soSanh(a, b) {
  const x = chuanPhienBan(a), y = chuanPhienBan(b)
  if (!x || !y) return null
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = x[i] || 0, q = y[i] || 0
    if (p !== q) return p > q ? 1 : -1
  }
  return 0
}

function linkHopLe(s, chapNhanHttp) {
  if (typeof s !== 'string' || s.length > 600) return null
  try {
    const u = new URL(s)
    if (u.protocol === 'https:' || (chapNhanHttp && u.protocol === 'http:')) return u.href
  } catch (e) {}
  return null
}

function chuGhiChu(s) { return typeof s === 'string' ? s.trim().slice(0, 600) : '' }

/** Doc chuoi JSON may chu tra ve -> { ok, ban } | { ok:false, loi }. Chi lay dung truong can, bo phan thua. */
function docBanMoi(text, chapNhanHttp) {
  let j
  try { j = JSON.parse(text) } catch (e) { return { ok: false, loi: 'json-hong' } }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false, loi: 'json-sai-dang' }
  const v = chuanPhienBan(j.phienBan)
  if (!v) return { ok: false, loi: 'phien-ban-sai' }
  const gc = j.ghiChu && typeof j.ghiChu === 'object' ? j.ghiChu : {}
  return {
    ok: true,
    ban: {
      phienBan: v.join('.'),
      linkWin: linkHopLe(j.linkWin, chapNhanHttp),
      linkMac: linkHopLe(j.linkMac, chapNhanHttp),
      ghiChu: { vi: chuGhiChu(gc.vi), en: chuGhiChu(gc.en) },
    },
  }
}

/**
 * @param {object} o
 *  fetch(url, opt)   -> Response-like ({status, text()}); main.js truyen net.fetch
 *  now()             -> ms
 *  doc() / ghi(s)    -> doc / ghi trang thai ben vung {lanKiemCuoi, banMoi, daBao}
 *  phienBan          -> ban dang chay (app.getVersion())
 *  nenTang           -> 'win32' | 'darwin'
 *  link              -> mac dinh LINK_BAN_MOI
 *  dangBan()         -> true khi dang chup / quay (bo qua luot hoi)
 *  baoMot(ban)       -> hien thong bao he dieu hanh; goi DUNG MOT LAN cho moi phien ban
 *  khiDoi()          -> goi khi trang thai doi (dung de ve lai menu khay)
 *  hen(fn, ms)       -> setTimeout (de bai do thay bang gia)
 */
function taoCapNhat(o) {
  const now = o.now || Date.now
  const link = o.link || LINK_BAN_MOI
  const hetGioMs = o.hetGioMs || HET_GIO_MS
  const nenTang = o.nenTang || process.platform
  const hen = o.hen || ((fn, ms) => setTimeout(fn, ms))
  const huyHen = o.huyHen || ((h) => clearTimeout(h))
  const log = (m) => { try { o.ghiLog && o.ghiLog('cap-nhat: ' + m) } catch (e) {} }

  let st = null
  function nap() {
    if (st) return st
    let s = null
    try { s = o.doc && o.doc() } catch (e) {}
    st = {
      lanKiemCuoi: s && Number.isFinite(s.lanKiemCuoi) ? s.lanKiemCuoi : 0,
      banMoi: s && s.banMoi && chuanPhienBan(s.banMoi.phienBan) ? s.banMoi : null,
      daBao: s && typeof s.daBao === 'string' ? s.daBao : null,
    }
    return st
  }
  function luu() {
    try { o.ghi && o.ghi(JSON.parse(JSON.stringify(nap()))) } catch (e) { log('khong ghi duoc trang thai: ' + e.message) }
  }
  function doi() { try { o.khiDoi && o.khiDoi() } catch (e) {} }

  /** Ban moi con hieu luc (bo qua neu app da len bang / hon ban do roi). */
  function banConHieuLuc() {
    const b = nap().banMoi
    return b && soSanh(b.phienBan, o.phienBan) === 1 ? b : null
  }

  function trangThai() {
    const b = banConHieuLuc()
    return {
      hienTai: o.phienBan,
      coBanMoi: !!b,
      phienBan: b ? b.phienBan : null,
      ghiChu: b ? b.ghiChu : { vi: '', en: '' },
      link: b ? (nenTang === 'darwin' ? b.linkMac : b.linkWin) : null,
      tuCai: false, // Windows tu cai: chua lam (xem dau file). Mac: khong bao gio (quyet dinh 21/09).
      lanKiemCuoi: nap().lanKiemCuoi,
    }
  }

  async function layJson() {
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
    let timer
    const hetGio = new Promise((_, rj) => { timer = setTimeout(() => { try { ac && ac.abort() } catch (e) {} rj(new Error('het-gio')) }, hetGioMs) })
    hetGio.catch(() => {})
    try {
      const res = await Promise.race([o.fetch(link, { signal: ac ? ac.signal : undefined, headers: { accept: 'application/json' }, cache: 'no-store' }), hetGio])
      if (!res || res.status !== 200) throw new Error('http-' + (res && res.status))
      const text = await Promise.race([res.text(), hetGio])
      if (typeof text !== 'string' || text.length > TOI_DA_KY_TU) throw new Error('phan-hoi-qua-to')
      return text
    } finally { clearTimeout(timer) }
  }

  let dangChay = null
  /**
   * @param {{ep?:boolean, imLang?:boolean}} opt  ep = bo qua moc 24 gio (nut "Kiem tra ngay"); imLang = khong hien thong bao he dieu hanh
   * @returns {Promise<{ketQua:'moi'|'moi-nhat'|'loi'|'ban'|'chua-den-gio', loi?:string, trangThai:object}>}
   */
  function kiemTra(opt = {}) {
    if (dangChay) return dangChay
    dangChay = (async () => {
      const s = nap()
      if (!opt.ep && s.lanKiemCuoi && now() - s.lanKiemCuoi < CHU_KY_MS) return { ketQua: 'chua-den-gio', trangThai: trangThai() }
      let busy = false
      try { busy = !!(o.dangBan && o.dangBan()) } catch (e) {}
      if (busy) { log('bo qua: dang chup / quay'); return { ketQua: 'ban', trangThai: trangThai() } }
      let ketQua, loi
      try {
        const r = docBanMoi(await layJson(), !!o.chapNhanHttp)
        if (!r.ok) throw new Error(r.loi)
        const cmp = soSanh(r.ban.phienBan, o.phienBan)
        if (cmp === 1) {
          s.banMoi = r.ban
          ketQua = 'moi'
          log('co ban moi ' + r.ban.phienBan + ' (dang chay ' + o.phienBan + ')')
          if (s.daBao !== r.ban.phienBan) {
            s.daBao = r.ban.phienBan // danh dau TRUOC khi bao: bao loi cung khong bao lai
            if (!opt.imLang) { try { o.baoMot && o.baoMot(trangThai()) } catch (e) { log('bao loi: ' + e.message) } }
          }
        } else {
          s.banMoi = null
          ketQua = 'moi-nhat'
          log('khong co ban moi (json ' + r.ban.phienBan + ', dang chay ' + o.phienBan + ')')
        }
      } catch (e) {
        ketQua = 'loi'; loi = e && e.message || String(e)
        log('khong kiem tra duoc: ' + loi) // im lang voi nguoi dung: chi ghi log
      }
      s.lanKiemCuoi = now() // ghi moc ca khi that bai: khong mang thi cung khong goi lai moi lan mo app
      luu(); doi()
      return { ketQua, loi, trangThai: trangThai() }
    })().finally(() => { dangChay = null })
    return dangChay
  }

  let hanHen = null
  function lenLich(ms) {
    if (hanHen) huyHen(hanHen)
    hanHen = hen(async () => {
      hanHen = null
      let kq
      try { kq = await kiemTra() } catch (e) { kq = { ketQua: 'loi' } }
      lenLich(kq.ketQua === 'ban' ? THU_LAI_KHI_BAN_MS : CHU_KY_MS)
    }, ms)
    if (hanHen && hanHen.unref) hanHen.unref() // hen gio khong giu app song
  }
  /** Mo app: hoi sau 30 giay (hoac dung gio neu moc 24h chua toi), roi moi 24 gio. */
  function batDau() {
    const con = nap().lanKiemCuoi ? nap().lanKiemCuoi + CHU_KY_MS - now() : 0
    lenLich(Math.max(SAU_KHI_MO_MS, con))
  }
  function dung() { if (hanHen) { huyHen(hanHen); hanHen = null } }

  return { kiemTra, trangThai, batDau, dung, nap }
}

module.exports = { taoCapNhat, soSanh, chuanPhienBan, docBanMoi, LINK_BAN_MOI, SAU_KHI_MO_MS, CHU_KY_MS, THU_LAI_KHI_BAN_MS, HET_GIO_MS }
