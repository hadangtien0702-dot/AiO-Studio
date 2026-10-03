'use strict'

/* =========================================================================
   banquyen.js — dung thu 14 ngay + ma ban quyen Polar (anh Tien chot 23/09)
   -------------------------------------------------------------------------
   KHONG require electron: moi thu (doc/ghi file, fetch, gio, ten may) tiem vao
   qua taoBanQuyen({...}) -> chay thu duoc bang node thuan (scripts/test/
   do-ban-quyen.mjs) voi fetch gia, khong can may Windows / mang Polar.

   Luat anh chot 23/09 (CLAUDE.md goc repo, muc 3):
     - Chua nhap ma = DUNG THU 14 NGAY du tinh nang; het han -> khoa CHUP,
       hien o nhap ma + nut Mua.
     - 1 ma = 2 MAY (Polar Limit Activations = 2) -> phai co nut HUY KICH HOAT
       de khach doi may.
     - Ma het han sau 1 nam = het QUYEN CAP NHAT, app VAN CHAY.
     - Mat mang van chay (khong khoa nguoi da tra tien vi Polar/mang loi).

   Polar (doc ma nguon server polarsource/polar 24/09 — polar.sh bi chan tu
   may dam may nen KHONG goi that duoc; so tra loi duoi day doc tu code):
     POST /v1/customer-portal/license-keys/activate  {key, organization_id, label, meta}
        200 -> { id: <activation_id>, license_key: { display_key, status, expires_at, ... } }
        403 "License key activation limit already reached"
        403 "License key has expired."
        403 "License key is no longer active. ..."   (hoan tien / khoa tay)
        404                                           (ma khong ton tai)
     POST .../validate {key, organization_id, activation_id}
        200 -> { status: 'granted', expires_at, activation: {...} }
        404 "License key is no longer active."   (bi thu hoi)
        404 "License key has expired."           (qua 1 nam)
        404 "Not found"                          (activation da bi go / ma doi)
     POST .../deactivate {key, organization_id, activation_id} -> 204 | 404
     Loi tra ve dang { error: 'NotPermitted', detail: '...' }.
   ========================================================================= */

const ORG_ID = '05f1edf9-2456-4d3f-8ff1-a824e433673e' // Polar org `aiostudio` (cong khai, 23/09)
const API = 'https://api.polar.sh/v1/customer-portal/license-keys'
const NGAY = 24 * 60 * 60 * 1000
const SO_NGAY_THU = 14
const KIEM_MOI = 3 * NGAY // hoi lai Polar toi da 3 ngay/lan (ma bi hoan tien se khoa trong <= 3 ngay)
const HET_GIO_MS = 15000

/* ANH CHOT A 24/09 ("Van cho dung"). Polar TU CHOI kich hoat ma da qua 1 nam (403 "expired") —
   tuc khach mua nam truoc, nam nay cai lai may / doi may thi KHONG kich hoat
   duoc, trai luat "het han van chay". true = nhan ma het han (Polar da xac nhan
   ma ton tai va tung hop le) thanh "dung vinh vien, khong co ban cap nhat" ma
   khong giu cho may nao — doi lai: ma het han co the chia se khong gioi han may.
   false = bat khach gia han $2 moi cai may moi duoc. */
const NHAN_MA_HET_HAN = true

function taoBanQuyen({ doc, ghi, fetch, now = () => Date.now(), tenMay = 'May', meta = {} }) {
  /* Gio "da thay" lon nhat: chong vặn lui dong ho de keo dai dung thu. */
  function gio(s) {
    const t = now()
    return Math.max(t, s.gioLonNhat || 0)
  }

  /* 04/10 (ECC soat, DA DO): ban cu coi MOI loi doc la "lan chay dau" roi GHI DE -> file co ma, doc hong dung 1 lan
     la mat `key` + `activationId` (khach da tra tien ve dung thu, nhap lai ma thi ton them 1 trong 2 cho tren Polar).
     Luat (so loi #16): ham DOC phan biet "chua co" voi "khong doc duoc"; ham GHI khong ghi de len thu vua doc that bai.
     Hop dong voi ben goi:  doc() tra object = trang thai · null = CHUA co file · NEM LOI = co file ma khong doc duoc.
       ram    = ban dung nhat ma tien trinh nay biet (doc duoc gan nhat, hoac vua ghi)
       choGhi = ram co thay doi CHUA xuong duoc dia (lan ghi truoc hong) -> lan nap sau ghi lai */
  let ram = null
  let choGhi = false
  const chep = (s) => JSON.parse(JSON.stringify(s))

  function napTrangThai() {
    let s = null
    let docDuoc = true
    try { s = doc() } catch (e) { docDuoc = false }
    if (docDuoc) {
      if (choGhi && ram) s = chep(ram)                      // dia cu hon RAM (lan ghi truoc hong)
      else if (!s || typeof s !== 'object') s = {}          // chua co file = lan chay dau
    } else if (ram) {
      s = chep(ram)                                         // dang chay: dung ban da doc duoc truoc do
    } else {
      /* Vua mo app + co file ma khong doc duoc: KHONG biet khach da kich hoat chua. Tra trang thai TAM
         (cho chup — khong khoa nguoi da tra tien), KHONG ghi, KHONG nho -> lan goi sau doc lai tu dia. */
      const t0 = now()
      return { batDauThu: t0, gioLonNhat: t0 }
    }
    let doi = choGhi
    if (!s.batDauThu) { s.batDauThu = now(); doi = true }
    const t = now()
    if (!s.gioLonNhat || t > s.gioLonNhat) { s.gioLonNhat = t; doi = true }
    if (doi) luu(s); else ram = chep(s)
    return s
  }

  function luu(s) {
    ram = chep(s)
    try { ghi(s); choGhi = false } catch (e) { choGhi = true } // ghi hong: giu trong RAM, lan nap sau ghi lai
  }

  /** Trang thai de UI + duong chup doc. Khong goi mang. */
  function trangThai() {
    const s = napTrangThai()
    const t = gio(s)
    const hetThu = s.batDauThu + SO_NGAY_THU * NGAY
    const conLaiMs = hetThu - t
    const ngayConLai = Math.max(0, Math.ceil(conLaiMs / NGAY))
    const coMa = !!(s.key && (s.activationId || s.vinhVienKhongMay))
    if (coMa && !s.thuHoi) {
      const hetHan = s.hetHan ? Date.parse(s.hetHan) : null
      return {
        loai: 'da-kich-hoat',
        choPhepChup: true,
        maHienThi: s.maHienThi || anMa(s.key),
        hetHan: s.hetHan || null,
        hetQuyenCapNhat: !!(hetHan && t >= hetHan),
        khongGiuMay: !!s.vinhVienKhongMay,
        kiemLanCuoi: s.kiemLanCuoi || null,
      }
    }
    return {
      loai: conLaiMs > 0 ? 'dung-thu' : 'het-han-thu',
      choPhepChup: conLaiMs > 0,
      ngayConLai,
      hetThu: new Date(hetThu).toISOString(),
      biThuHoi: !!s.thuHoi, // ma cu bi hoan tien / khoa -> UI noi ro ly do
      lyDoMatMa: s.lyDoMatMa || null,
    }
  }

  async function goi(duong, body) {
    let res
    try {
      res = await fetch(API + '/' + duong, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(Object.assign({ organization_id: ORG_ID }, body)),
        signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(HET_GIO_MS) : undefined,
      })
    } catch (e) {
      return { mang: false, loiMang: String(e && e.message || e) }
    }
    let json = null
    try { const txt = await res.text(); json = txt ? JSON.parse(txt) : null } catch (e) { json = null }
    const detail = json && typeof json.detail === 'string' ? json.detail : ''
    return { mang: true, status: res.status, json, detail }
  }

  function phanLoaiLoi(r) {
    if (!r.mang) return 'mat-mang'
    const d = (r.detail || '').toLowerCase()
    if (r.status >= 500 || r.status === 429) return 'may-chu'
    if (d.includes('activation limit')) return 'het-may'
    if (d.includes('expired')) return 'ma-het-han'
    if (d.includes('no longer active')) return 'ma-bi-khoa'
    return 'ma-sai' // 404 / 422 / 403 khac
  }

  /** Nhap ma -> kich hoat may nay. Tra { ok, loi?, trangThai }. */
  async function kichHoat(maNhap) {
    const key = String(maNhap || '').trim()
    if (!key) return { ok: false, loi: 'ma-trong', trangThai: trangThai() }
    const s = napTrangThai()
    if (s.key === key && s.activationId && !s.thuHoi) return { ok: true, trangThai: trangThai() }
    /* Dang giu ma KHAC tren may nay -> tra cho may cu truoc (khong thi mat 1 trong 2 cho). */
    if (s.key && s.activationId && s.key !== key) {
      const h = await huyKichHoat()
      if (!h.ok) return { ok: false, loi: h.loi, trangThai: trangThai() }
    }
    const r = await goi('activate', { key, label: String(tenMay).slice(0, 100), meta })
    if (r.mang && r.status >= 200 && r.status < 300 && r.json && r.json.id) {
      const lk = r.json.license_key || {}
      const moi = napTrangThai()
      Object.assign(moi, {
        key, activationId: r.json.id, maHienThi: lk.display_key || anMa(key),
        hetHan: lk.expires_at || null, kiemLanCuoi: now(), thuHoi: false, lyDoMatMa: null,
        vinhVienKhongMay: false,
      })
      luu(moi)
      return { ok: true, trangThai: trangThai() }
    }
    const loi = phanLoaiLoi(r)
    if (loi === 'ma-het-han' && NHAN_MA_HET_HAN) {
      const moi = napTrangThai()
      Object.assign(moi, {
        key, activationId: null, maHienThi: anMa(key), hetHan: null, kiemLanCuoi: now(),
        thuHoi: false, lyDoMatMa: null, vinhVienKhongMay: true,
      })
      luu(moi)
      return { ok: true, canhBao: 'ma-het-han', trangThai: trangThai() }
    }
    return { ok: false, loi, trangThai: trangThai() }
  }

  /** Go ma khoi may nay (tra cho cho may khac). */
  async function huyKichHoat() {
    const s = napTrangThai()
    if (!s.key) return { ok: true, trangThai: trangThai() }
    if (s.activationId) {
      const r = await goi('deactivate', { key: s.key, activation_id: s.activationId })
      const ok = r.mang && ((r.status >= 200 && r.status < 300) || r.status === 404)
      /* Mat mang: KHONG xoa o may — xoa ma cho van bi giu tren Polar = khach mat 1 may. */
      if (!ok) return { ok: false, loi: phanLoaiLoi(r), trangThai: trangThai() }
    }
    const moi = napTrangThai()
    for (const k of ['key', 'activationId', 'maHienThi', 'hetHan', 'kiemLanCuoi', 'vinhVienKhongMay', 'thuHoi', 'lyDoMatMa']) delete moi[k]
    luu(moi)
    return { ok: true, trangThai: trangThai() }
  }

  /** Hoi lai Polar (toi da 3 ngay/lan, ep = bo qua han). Mat mang = giu nguyen. */
  async function kiemTra(ep = false) {
    const s = napTrangThai()
    if (!s.key || !s.activationId || s.thuHoi) return { daHoi: false, trangThai: trangThai() }
    if (!ep && s.kiemLanCuoi && now() - s.kiemLanCuoi < KIEM_MOI && now() >= s.kiemLanCuoi) {
      return { daHoi: false, trangThai: trangThai() }
    }
    const r = await goi('validate', { key: s.key, activation_id: s.activationId })
    const moi = napTrangThai()
    if (r.mang && r.status >= 200 && r.status < 300 && r.json) {
      moi.kiemLanCuoi = now()
      if ('expires_at' in r.json) moi.hetHan = r.json.expires_at || null
      if (r.json.display_key) moi.maHienThi = r.json.display_key
      luu(moi)
      return { daHoi: true, trangThai: trangThai() }
    }
    const loi = phanLoaiLoi(r)
    if (loi === 'mat-mang' || loi === 'may-chu') return { daHoi: false, loi, trangThai: trangThai() }
    if (loi === 'ma-het-han') {
      /* Qua 1 nam: het quyen cap nhat, van chay. Polar khong con xac nhan activation
         nua nen tu nay khong hoi lai. */
      moi.kiemLanCuoi = now()
      if (!moi.hetHan) moi.hetHan = new Date(now()).toISOString()
      luu(moi)
      return { daHoi: true, trangThai: trangThai() }
    }
    if (loi === 'ma-bi-khoa') {
      moi.thuHoi = true
      moi.lyDoMatMa = 'ma-bi-khoa'
      luu(moi)
      return { daHoi: true, trangThai: trangThai() }
    }
    /* 04/10 (ECC soat, DA DO): ban cu coi MOI tra loi con lai la "may bi go" -> 403 trang chan cua proxy cong ty,
       407, 401, 400, 200 khong phai JSON deu XOA ma cua khach da tra tien (5/5 ca). Chi "404 + JSON loi cua Polar"
       moi la activation bi go. Tra loi la khac = KHONG BIET -> giu nguyen ma, khong ghi kiemLanCuoi (lan sau hoi lai). */
    const polar404 = r.status === 404 && r.json && typeof r.json === 'object' &&
      (typeof r.json.detail === 'string' || typeof r.json.error === 'string')
    if (!polar404) return { daHoi: false, loi: 'tra-loi-la', maTraLoi: r.status, trangThai: trangThai() }
    /* 404 cua Polar: activation bi go (khach go tu cong khach hang Polar) hoac ma bi doi
       -> may nay mat ma, quay ve che do dung thu (thuong da het). */
    for (const k of ['key', 'activationId', 'maHienThi', 'hetHan', 'kiemLanCuoi', 'vinhVienKhongMay']) delete moi[k]
    moi.lyDoMatMa = 'may-bi-go'
    luu(moi)
    return { daHoi: true, trangThai: trangThai() }
  }

  return { trangThai, kichHoat, huyKichHoat, kiemTra }
}

/** Doc / ghi file ban-quyen.json cho taoBanQuyen (04/10). Tach khoi main.js de do duoc bang node thuan.
    doc(): object = trang thai · null = CHUA co file · NEM LOI = co file ma khong doc duoc (ben goi khong duoc ghi de).
    File HONG (khong phai JSON object): CAT sang `ban-quyen.hong-<gio>.json` (con nguyen de lay lai ma bang tay) roi
    coi nhu chua co. BOM dau file (Notepad) duoc bo qua. ghi(): atomic (tmp + rename). */
function taoKhoFile(file, { fs = require('fs'), path = require('path'), log = () => {}, now = () => Date.now() } = {}) {
  let loiCu = ''
  const bao = (ma) => { // chi ghi nhat ky khi DOI trang thai (ham nay duoc goi moi lan chup)
    if (ma === loiCu) return
    loiCu = ma
    if (ma) log('ban-quyen: KHONG DOC DUOC file (' + ma + '), giu nguyen, khong ghi de')
  }
  function doc() {
    let txt
    try { txt = fs.readFileSync(file, 'utf8') } catch (e) {
      if (e && e.code === 'ENOENT') { bao(''); return null }
      bao((e && e.code) || 'loi-doc')
      throw e
    }
    try {
      if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1)
      const s = JSON.parse(txt)
      if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('khong phai object')
      bao('')
      return s
    } catch (e) {
      const d = new Date(now())
      const p2 = (n) => String(n).padStart(2, '0')
      const dich = file.replace(/\.json$/i, '') + '.hong-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) +
        '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.json'
      try { fs.renameSync(file, dich) } catch (e2) {
        bao('hong, khong cat duoc: ' + ((e2 && e2.code) || 'loi'))
        throw e2 // khong cat duoc ban hong thi coi la "khong doc duoc": KHONG ghi de len no
      }
      loiCu = ''
      log('ban-quyen: file HONG (' + e.message + '), da cat sang ' + path.basename(dich) + ', bat dau lai')
      return null
    }
  }
  function ghi(s) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file + '.tmp', JSON.stringify(s, null, 2))
    fs.renameSync(file + '.tmp', file)
  }
  return { doc, ghi }
}

/** AIOSS-1234-ABCD-...-WXYZ -> AIOSS-****-WXYZ (khong dua ma day du ra log/UI). */
function anMa(key) {
  const k = String(key || '')
  if (k.length <= 8) return '****'
  const dau = k.split('-')[0]
  return dau + '-****-' + k.slice(-4)
}

module.exports = { taoBanQuyen, taoKhoFile, anMa, ORG_ID, SO_NGAY_THU, NHAN_MA_HET_HAN }
