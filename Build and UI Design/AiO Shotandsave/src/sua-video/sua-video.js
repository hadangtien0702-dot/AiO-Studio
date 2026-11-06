'use strict'
/* =========================================================================
   AiO Shot & Save — MAN SUA VIDEO (06/11). Mo tu nut "Sua" tren hang video cua Khay video.
   Ba tinh nang lam chung MOT man, xuat ra file MOI (file goc khong bao gio bi dung toi):
   1. Cat dau cuoi: hai tay nam tren thanh thoi gian, xem truoc ngay tren khung, gui dung doan can.
   2. Tu phong to theo con tro: dung file phu ghi luc quay (<video>.contro.json); may quay = src/sua-video/may-quay.js.
   3. Nen va khung: nen chuyen sac / mau / mo, le, bo goc, bong (bo nen cua Lam dep).
   Xem truoc va xuat dung CHUNG ham ve (render.js) va may quay, nen hinh xem truoc la hinh se xuat ra.
   ========================================================================= */
;(() => {
const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k)
const $ = (id) => document.getElementById(id)
const MIN_MS = 500 // doan gui ngan nhat
const XEM_RONG_TOI_DA = 960

document.documentElement.lang = window.i18n && window.i18n.lang === 'en' ? 'en' : 'vi'
document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })
document.querySelectorAll('[data-i18n-title]').forEach((el) => { const s = t(el.getAttribute('data-i18n-title')); el.title = s; el.setAttribute('aria-label', s) })
$('tay-dau').setAttribute('aria-label', t('sv.cat') + ' (1)'); $('tay-cuoi').setAttribute('aria-label', t('sv.cat') + ' (2)')

const EN = window.i18n && window.i18n.lang === 'en'
const so = (x) => (EN ? String(x) : String(x).replace('.', ','))
const p2 = (v) => String(v).padStart(2, '0')
function gio(ms) { // 12345 ms -> "0:12.3"
  const s = Math.max(0, ms) / 1000
  return Math.floor(s / 60) + ':' + p2(Math.floor(s % 60)) + so('.' + Math.floor((s * 10) % 10))
}
function dungLuong(b) {
  if (b >= 1024 * 1024) return so((b / 1024 / 1024).toFixed(b >= 100 * 1024 * 1024 ? 0 : 1)) + ' MB'
  return Math.max(1, Math.round(b / 1024)) + ' KB'
}
let toastTimer = null
function showToast(msg) {
  const el = $('toast')
  if (toastTimer) clearTimeout(toastTimer)
  el.textContent = msg; el.classList.add('show')
  toastTimer = setTimeout(() => { el.classList.remove('show'); toastTimer = null }, 3200)
}

// ---- trang thai ----
let du = null              // { id, url, ms, w, h, coTieng, conTro } tu main
let dur = 0                // ms
let tu = 0, den = 0        // doan gui (ms)
let giuTieng = true
let zoomMuc = 'tat'        // 'tat' | 'nhe' | 'vua' | 'manh'
let nen = { kieu: 'khong', gd: 0, mau: '#ffffff', le: 6, bo: 3, bong: 40 }
let cam = null             // ket qua MayQuay.tinh
let bove = null            // SuaRender.taoVe
let dangXuat = false
let ketQuaFile = null
let can = false            // can ve lai khung

const v = document.createElement('video')
v.preload = 'auto'; v.playsInline = true
const cv = $('cv')
const ctx = cv.getContext('2d', { alpha: false })

// ---- ve ----
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
function datBoVe() {
  if (!(v.videoWidth > 0)) return
  const k = Math.min(1, XEM_RONG_TOI_DA / v.videoWidth)
  const W = Math.max(2, Math.floor((v.videoWidth * k) / 2) * 2), H = Math.max(2, Math.floor((v.videoHeight * k) / 2) * 2)
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
  bove = SuaRender.taoVe(W, H, nen, mkCanvas)
  can = true
}
function datMay() {
  cam = null
  if (zoomMuc !== 'tat' && du && du.conTro) {
    cam = MayQuay.tinh(du.conTro.mau, { tre: du.conTro.tre, thoiLuongMs: dur, muc: zoomMuc, w: du.conTro.w || v.videoWidth, h: du.conTro.h || v.videoHeight })
  }
  can = true
}
function veKhung() {
  if (!bove || !(v.videoWidth > 0) || v.readyState < 2) return
  bove.ve(ctx, v, v.videoWidth, v.videoHeight, cam ? cam.at(v.currentTime * 1000) : null)
}
function vong() {
  if (!v.paused) {
    if (v.currentTime * 1000 >= den - 20) { v.pause(); v.currentTime = den / 1000; capNhatNutPhat() }
    veKhung(); capNhatKim()
  } else if (can) { can = false; veKhung(); capNhatKim() }
  lenLich()
}
/* Cua so AN (bai do) / thu nho: rAF dung hoan toan (cung bay cua luong.js). Moi vong dat ca rAF lan hen gio du phong; cai nao toi
   truoc thi chay, cai con lai bo (so `gen`). Cua so hien: rAF toi truoc nen van muot nhu thuong. */
let gen = 0
function lenLich() {
  const g = ++gen
  const chay = () => { if (g === gen) vong() }
  if (document.hidden) setTimeout(chay, 33)
  else { requestAnimationFrame(chay); setTimeout(chay, 120) }
}

// ---- thanh thoi gian ----
const tl = $('tl')
const pc = (ms) => (dur > 0 ? (ms / dur) * 100 : 0)
function veThanh() {
  $('tay-dau').style.left = pc(tu) + '%'; $('tay-cuoi').style.left = pc(den) + '%'
  const ch = $('tl-chon'); ch.style.left = pc(tu) + '%'; ch.style.width = (pc(den) - pc(tu)) + '%'
  $('moc-tu').textContent = gio(tu); $('moc-den').textContent = gio(den)
  $('nhan-doan').textContent = t('sv.doanGui') + ' ' + t('sv.giay', { s: so(((den - tu) / 1000).toFixed(1)) })
  $('tay-dau').setAttribute('aria-valuenow', String(Math.round(tu))); $('tay-cuoi').setAttribute('aria-valuenow', String(Math.round(den)))
  capNhatKim()
}
function capNhatKim() {
  const ms = v.currentTime * 1000
  $('tl-kim').style.left = pc(Math.min(dur, Math.max(0, ms))) + '%'
  $('gio-hien').textContent = gio(Math.max(0, ms - tu)) + ' / ' + gio(den - tu)
}
function msTuChuot(e) {
  const r = tl.getBoundingClientRect()
  return Math.min(dur, Math.max(0, ((e.clientX - r.left) / r.width) * dur))
}
function seek(ms) { try { v.currentTime = Math.min(dur, Math.max(0, ms)) / 1000 } catch (e) {} can = true }
function datTu(ms) { tu = Math.min(Math.max(0, ms), den - MIN_MS); veThanh() }
function datDen(ms) { den = Math.max(Math.min(dur, ms), tu + MIN_MS); veThanh() }

let keo = null // 'tu' | 'den' | 'kim'
tl.addEventListener('pointerdown', (e) => {
  if (dangXuat || !dur) return
  const ms = msTuChuot(e)
  if (e.target.id === 'tay-dau') keo = 'tu'
  else if (e.target.id === 'tay-cuoi') keo = 'den'
  else { // bam vao ray: tay nam gan hon di toi do neu bam ngoai doan, con lai thi dat kim
    if (ms < tu - 30 || ms > den + 30) keo = Math.abs(ms - tu) <= Math.abs(ms - den) ? 'tu' : 'den'
    else keo = 'kim'
  }
  tl.setPointerCapture(e.pointerId)
  if (keo === 'tu' || keo === 'den') (keo === 'tu' ? $('tay-dau') : $('tay-cuoi')).classList.add('keo')
  tl.dispatchEvent(new PointerEvent('pointermove', e))
})
tl.addEventListener('pointermove', (e) => {
  if (!keo) return
  const ms = msTuChuot(e)
  if (keo === 'tu') { datTu(ms); seek(tu) }
  else if (keo === 'den') { datDen(ms); seek(Math.max(tu, den - 40)) }
  else seek(Math.min(den, Math.max(tu, ms)))
})
const nha = () => { keo = null; $('tay-dau').classList.remove('keo'); $('tay-cuoi').classList.remove('keo') }
tl.addEventListener('pointerup', nha); tl.addEventListener('pointercancel', nha)
for (const [id, f] of [['tay-dau', (d) => { datTu(tu + d); seek(tu) }], ['tay-cuoi', (d) => { datDen(den + d); seek(Math.max(tu, den - 40)) }]]) {
  $(id).addEventListener('keydown', (e) => {
    if (dangXuat || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault(); e.stopPropagation()
    f((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1000 : 100))
  })
}

// ---- phat ----
function capNhatNutPhat() { $('nut-phat').textContent = v.paused ? t('sv.phat') : t('sv.tamDung') }
function phatTamDung() {
  if (!dur) return
  if (v.paused) {
    const ms = v.currentTime * 1000
    if (ms < tu || ms >= den - 60) seek(tu)
    v.play().catch(() => {})
  } else v.pause()
  capNhatNutPhat()
}
$('nut-phat').addEventListener('click', phatTamDung)
v.addEventListener('play', capNhatNutPhat); v.addEventListener('pause', capNhatNutPhat)
v.addEventListener('seeked', () => { can = true })
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!dangXuat) window.sua.dong(); return }
  if (e.code === 'Space' && !/^(INPUT|BUTTON)$/.test(document.activeElement && document.activeElement.tagName)) { e.preventDefault(); phatTamDung() }
})
$('btn-close').addEventListener('click', () => window.sua.dong())

// ---- cac cum lua chon ----
function chonCum(nhomId, giaTri, khiDoi) {
  const nhom = $(nhomId)
  const dat = (val) => nhom.querySelectorAll('.chon-nut').forEach((b) => { const bat = b.dataset.v === val; b.classList.toggle('active', bat); b.setAttribute('aria-pressed', String(bat)) })
  dat(giaTri)
  nhom.addEventListener('click', (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.disabled || dangXuat) return
    dat(b.dataset.v); khiDoi(b.dataset.v)
  })
  return dat
}
let datTieng, datZoom, datNen
datTieng = chonCum('nhom-tieng', 'co', (val) => { giuTieng = val === 'co'; v.muted = !giuTieng })
datZoom = chonCum('nhom-zoom', 'tat', (val) => { zoomMuc = val; datMay() })
datNen = chonCum('nhom-nen', 'khong', (val) => {
  nen.kieu = val
  if (val !== 'khong' && nen.le === 0) nen.le = 6
  veMauChon(); capNhatThanhNen(); datBoVe()
})

function veMauChon() {
  const el = $('mau-chon')
  el.textContent = ''
  const them = (nenCss, active, khiBam, ten) => {
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'o-mau' + (active ? ' active' : ''); b.style.background = nenCss; b.setAttribute('aria-label', ten)
    b.addEventListener('click', () => { if (!dangXuat) { khiBam(); veMauChon(); datBoVe() } })
    el.appendChild(b)
  }
  if (nen.kieu === 'chuyen') SuaRender.CHUYEN_SAC.forEach((m, i) => them('linear-gradient(135deg,' + m[0] + ',' + m[1] + ')', nen.gd === i, () => { nen.gd = i }, t('sv.nenChuyen') + ' ' + (i + 1)))
  else if (nen.kieu === 'dac') SuaRender.MAU_DAC.forEach((m) => them(m, nen.mau.toLowerCase() === m, () => { nen.mau = m }, m))
  el.hidden = !(nen.kieu === 'chuyen' || nen.kieu === 'dac')
}
function capNhatThanhNen() {
  $('thanh-nen').hidden = nen.kieu === 'khong'
  $('r-le').value = nen.le; $('v-le').textContent = nen.le + '%'
  $('r-bo').value = nen.bo; $('v-bo').textContent = nen.bo + '%'
  $('r-bong').value = nen.bong; $('v-bong').textContent = nen.bong
}
for (const [id, k, vid] of [['r-le', 'le', 'v-le'], ['r-bo', 'bo', 'v-bo'], ['r-bong', 'bong', 'v-bong']]) {
  $(id).addEventListener('input', () => { nen[k] = Number($(id).value); $(vid).textContent = nen[k] + (k === 'bong' ? '' : '%'); datBoVe() })
}

// ---- xuat ----
function khoaGiaoDien(k) {
  dangXuat = k
  document.querySelectorAll('.muc .chon-nut, .muc input, .o-mau, #nut-phat, .tay').forEach((el) => { el.disabled = k || (el.dataset && el.dataset.khoaCung === '1') })
  $('nut-xuat').disabled = k
  $('nut-huy').hidden = !k
  $('tien-do').hidden = !k
  if (k) v.pause()
  if (!k) khoiPhucTrangThaiNut()
}
function khoiPhucTrangThaiNut() {
  // cac nut bi khoa cung (khong co tieng / khong co con tro) giu nguyen
  document.querySelectorAll('[data-khoa-cung="1"]').forEach((el) => { el.disabled = true })
}
$('nut-xuat').addEventListener('click', async () => {
  if (dangXuat || !du) return
  v.pause()
  ketQuaFile = null; $('ket-qua').hidden = true
  khoaGiaoDien(true)
  $('tien-vach').style.width = '0'
  $('trang-thai').textContent = t('sv.dangXuat', { p: 0 })
  let r = null
  try {
    r = await window.sua.xuat(du.id, { tuMs: tu, denMs: den, giuTieng: giuTieng && du.coTieng, zoom: { bat: zoomMuc !== 'tat', muc: zoomMuc === 'tat' ? 'vua' : zoomMuc }, nen })
  } catch (e) { r = { ok: false, loi: String(e && e.message || e) } }
  xongViec(r)
})
/* Ket thuc viec xuat. Co hai nguon: loi tra ve cua `sua.xuat()` va su kien main gui thang (`onKetThuc`, cho truong hop trang nay duoc
   nap lai giua luc xuat nen khong co loi goi nao de cho). Nguon den truoc thang; nguon den sau bi bo (da het khoa). */
let ketQuaSom = null // ket qua ve luc trang moi nap, chua kip khoa giao dien (init con dang cho nap video)
function xongViec(r) {
  if (!dangXuat) { ketQuaSom = r; return }
  khoaGiaoDien(false)
  $('trang-thai').textContent = ''
  if (!r || !r.ok) {
    const loi = r && r.loi
    showToast(loi === 'da-huy' ? t('sv.daHuy') : loi === 'dang-ban' ? t('sv.dangBan') : t('sv.loi') + (loi ? ': ' + String(loi).slice(0, 80) : ''))
    return
  }
  ketQuaFile = r.file
  $('kq-chu').textContent = t('sv.daLuu')
  $('kq-ten').textContent = r.ten + ' · ' + t('sv.giay', { s: so((r.ms / 1000).toFixed(1)) }) + ' · ' + dungLuong(r.bytes)
  $('kq-ten').title = r.file
  $('ket-qua').hidden = false
}
window.sua.onKetThuc((r) => xongViec(r))
window.sua.onTienDo((p) => {
  $('tien-vach').style.width = Math.round(p * 100) + '%'
  $('trang-thai').textContent = t('sv.dangXuat', { p: Math.round(p * 100) })
})
$('nut-huy').addEventListener('click', () => window.sua.huy())
$('kq-mo').addEventListener('click', () => { if (ketQuaFile) window.sua.moThuMuc(ketQuaFile) })
$('kq-keo').addEventListener('dragstart', (e) => { e.preventDefault(); if (ketQuaFile) window.sua.keo(ketQuaFile) })
$('ket-qua').addEventListener('dragstart', (e) => { e.preventDefault(); if (ketQuaFile) window.sua.keo(ketQuaFile) })
$('nut-xuat').textContent = t('sv.xuat')
$('nut-huy').textContent = t('sv.huy')
$('kq-keo').textContent = t('sv.keoFile'); $('kq-keo').title = t('sv.keoFileGoiY')
$('kq-mo').textContent = t('sv.moThuMuc')

// ---- khoi dong ----
async function lamRoThoiLuong() {
  if (isFinite(v.duration) && v.duration > 0) return Math.round(v.duration * 1000)
  // MP4 phan manh co the khai thoi luong vo han: tua toi cuoi de trinh phat tinh ra
  await new Promise((res) => {
    const xong = () => { if (isFinite(v.duration) && v.duration > 0) { v.removeEventListener('durationchange', xong); res() } }
    v.addEventListener('durationchange', xong); v.currentTime = 1e7; setTimeout(res, 4000)
  })
  const ms = isFinite(v.duration) && v.duration > 0 ? Math.round(v.duration * 1000) : 0
  v.currentTime = 0
  return ms
}
async function init() {
  capNhatNutPhat()
  let data = null
  try { data = await window.sua.getData() } catch (e) { console.error('Loi nap man Sua video:', e) }
  if (!data) { showToast(t('sv.khongMo')); $('nut-xuat').disabled = true; return }
  du = data
  $('ten-file').textContent = data.ten
  v.src = data.url
  await new Promise((res) => { v.addEventListener('loadeddata', res, { once: true }); v.addEventListener('error', res, { once: true }) })
  if (v.error || !(v.videoWidth > 0)) { showToast(t('sv.khongMo')); $('nut-xuat').disabled = true; return }
  dur = (await lamRoThoiLuong()) || data.ms || 0
  tu = 0; den = dur
  datBoVe(); veThanh(); seek(0)
  // Tieng: video khong co tieng thi an muc
  if (data.coTieng) {
    $('muc-tieng').hidden = false
    giuTieng = !data.daBoTieng
    datTieng(giuTieng ? 'co' : 'khong'); v.muted = !giuTieng
  } else { giuTieng = false; v.muted = true }
  // Tu phong to: can file phu con tro; video cu khong co thi mo nut va noi ly do
  if (!data.conTro) {
    document.querySelectorAll('#nhom-zoom .chon-nut').forEach((b) => { if (b.dataset.v !== 'tat') { b.disabled = true; b.dataset.khoaCung = '1' } })
    const g = $('ghi-zoom'); g.textContent = t('sv.khongCoConTro'); g.classList.add('canh-bao')
  }
  capNhatThanhNen(); veMauChon()
  if (data.dangXuat) {
    khoaGiaoDien(true); $('trang-thai').textContent = t('sv.dangXuat', { p: 0 })
    if (ketQuaSom) { const r = ketQuaSom; ketQuaSom = null; xongViec(r) }
  }
  vong()
}
init()
})()
