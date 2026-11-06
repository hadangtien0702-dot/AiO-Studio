'use strict'
/* Cua so TAI LIEU TUNG BUOC — phan giao dien (06/11/2026). Du lieu va xuat file do main lo (src/tai-lieu-main.js).
   Keo doi thu tu bang SU KIEN CHUOT (mousedown / mousemove / mouseup), khong dung HTML5 drag-drop: bai do chay duoc bang sendInputEvent
   va khong bi bay "keo ra ngoai cua so". Co them nut Doi len / xuong cho nguoi dung ban phim. */

const t = (k, v) => {
  let s = window.i18n.t(k)
  if (v) for (const x of Object.keys(v)) s = s.split('{' + x + '}').join(String(v[x]))
  return s
}

const luoiKhay = document.getElementById('luoi-khay')
const khayTrong = document.getElementById('khay-trong')
const dsBuoc = document.getElementById('ds-buoc')
const buocTrong = document.getElementById('buoc-trong')
const demEl = document.getElementById('dem')
const tieuDoc = document.getElementById('tieu-doc')
const thongBao = document.getElementById('thong-bao')
const nutMoThuMuc = document.getElementById('mo-thu-muc')
const nutXuat = { html: document.getElementById('xuat-html'), md: document.getElementById('xuat-md'), pdf: document.getElementById('xuat-pdf') }

let khay = []        // [{ khoa, ten, thumb, w, h }]
let buoc = []        // [{ khoa, ten, thumb, moTa }]
let duongVuaXuat = ''
let dangXuat = false
let henLuu = null

function dich() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })
  tieuDoc.placeholder = t('tl.tieuDeMau')
  khayTrong.textContent = t('tl.khayTrong')
  buocTrong.textContent = t('tl.buocTrong')
  document.getElementById('close').title = t('tl.dong')
}

function thongBaoLoi(s) { thongBao.className = 'msg err'; thongBao.textContent = s || '' ; nutMoThuMuc.hidden = true }
function thongBaoOk(s) { thongBao.className = 'msg ok'; thongBao.textContent = s || '' }

const icon = (d) => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'
const ICON = {
  tay: '<svg viewBox="0 0 24 24" width="12" height="16" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  len: icon('<path d="m18 15-6-6-6 6"/>'),
  xuong: icon('<path d="m6 9 6 6 6-6"/>'),
  bo: icon('<path d="M18 6 6 18M6 6l12 12"/>'),
}

function veKhay() {
  luoiKhay.textContent = ''
  const da = new Set(buoc.map((b) => b.khoa))
  for (const k of khay) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'o-khay' + (da.has(k.khoa) ? ' da' : '')
    b.dataset.khoa = k.khoa
    b.title = k.ten + (k.w ? '\n' + k.w + ' × ' + k.h + ' px' : '')
    const im = document.createElement('img'); im.src = k.thumb; im.alt = ''
    const nd = document.createElement('span'); nd.className = 'nhan-da'; nd.textContent = t('tl.daThem')
    b.append(im, nd)
    luoiKhay.appendChild(b)
  }
  khayTrong.hidden = khay.length > 0
}

function veBuoc() {
  dsBuoc.textContent = ''
  buoc.forEach((b, i) => {
    const r = document.createElement('div')
    r.className = 'buoc-hang'
    r.dataset.khoa = b.khoa
    r.innerHTML = '<div class="tay" title=""></div><span class="so-buoc"></span><img class="thu-buoc" alt=""><input class="bq-o mo-ta" type="text" maxlength="200" spellcheck="false" autocomplete="off">' +
      '<div class="nut-buoc"><button type="button" class="nut icon len"></button><button type="button" class="nut icon xuong"></button><button type="button" class="nut icon bo"></button></div>'
    r.querySelector('.tay').innerHTML = ICON.tay
    r.querySelector('.tay').title = t('tl.keo')
    r.querySelector('.so-buoc').textContent = String(i + 1)
    r.querySelector('.thu-buoc').src = b.thumb
    const mo = r.querySelector('.mo-ta')
    mo.value = b.moTa || ''
    mo.placeholder = t('tl.moTaMau')
    mo.setAttribute('aria-label', t('tl.buoc', { n: i + 1 }))
    mo.addEventListener('input', () => { b.moTa = mo.value; luuSau() })
    mo.addEventListener('blur', luuNgay)
    const len = r.querySelector('.len'), xuong = r.querySelector('.xuong'), bo = r.querySelector('.bo')
    len.innerHTML = ICON.len; len.title = t('tl.lenXuong'); len.disabled = i === 0
    xuong.innerHTML = ICON.xuong; xuong.title = t('tl.xuongXuong'); xuong.disabled = i === buoc.length - 1
    bo.innerHTML = ICON.bo; bo.title = t('tl.xoa')
    len.addEventListener('click', () => doiCho(i, i - 1))
    xuong.addEventListener('click', () => doiCho(i, i + 1))
    bo.addEventListener('click', () => { buoc.splice(i, 1); veAll(); luuNgay() })
    dsBuoc.appendChild(r)
  })
  demEl.textContent = buoc.length ? t('tl.soBuoc', { n: buoc.length }) : ''
  buocTrong.hidden = buoc.length > 0
  for (const k of Object.keys(nutXuat)) nutXuat[k].disabled = dangXuat || buoc.length === 0
}

function veAll() { veKhay(); veBuoc() }

function doiCho(tu, den) {
  if (den < 0 || den >= buoc.length || tu === den) return
  const [x] = buoc.splice(tu, 1)
  buoc.splice(den, 0, x)
  veAll(); luuNgay()
}

/* ── Luu ban nhap (tieu de, thu tu, mo ta) ───────────────────────────── */
function banNhap() { return { tieuDe: tieuDoc.value, buoc: buoc.map((b) => ({ khoa: b.khoa, moTa: b.moTa || '' })) } }
function luuNgay() { clearTimeout(henLuu); henLuu = null; window.taiLieu.luuNhap(banNhap()) }
function luuSau() { clearTimeout(henLuu); henLuu = setTimeout(luuNgay, 500) }
tieuDoc.addEventListener('input', luuSau)
tieuDoc.addEventListener('blur', luuNgay)

/* ── Bam anh trong khay = them mot buoc ──────────────────────────────── */
luoiKhay.addEventListener('click', (e) => {
  const o = e.target.closest('.o-khay')
  if (!o) return
  const k = khay.find((x) => x.khoa === o.dataset.khoa)
  if (!k || buoc.some((b) => b.khoa === k.khoa)) return
  buoc.push({ khoa: k.khoa, ten: k.ten, thumb: k.thumb, moTa: '' })
  veAll(); luuNgay()
  const hang = dsBuoc.lastElementChild
  if (hang) { hang.scrollIntoView({ block: 'nearest' }); const mo = hang.querySelector('.mo-ta'); if (mo) mo.focus() }
})

/* ── Keo doi thu tu bang chuot ───────────────────────────────────────── */
let keo = null // { khoa }
dsBuoc.addEventListener('mousedown', (e) => {
  const tay = e.target.closest('.tay')
  if (!tay || e.button !== 0) return
  const hang = tay.closest('.buoc-hang')
  keo = { khoa: hang.dataset.khoa }
  hang.classList.add('keo')
  e.preventDefault()
})
window.addEventListener('mousemove', (e) => {
  if (!keo) return
  const hangs = Array.from(dsBuoc.children)
  const tu = buoc.findIndex((b) => b.khoa === keo.khoa)
  if (tu < 0) return
  // vi tri moi = so hang KHAC co tam nam phia tren con tro (trong danh sach SAU khi rut phan tu dang keo)
  let moi = 0
  hangs.forEach((h, i) => { if (i !== tu && e.clientY > h.getBoundingClientRect().top + h.getBoundingClientRect().height / 2) moi++ })
  if (moi !== tu) {
    const [x] = buoc.splice(tu, 1)
    buoc.splice(moi, 0, x)
    veAll()
    const h = dsBuoc.querySelector('.buoc-hang[data-khoa="' + CSS.escape(keo.khoa) + '"]')
    if (h) h.classList.add('keo')
  }
})
window.addEventListener('mouseup', () => {
  if (!keo) return
  keo = null
  dsBuoc.querySelectorAll('.keo').forEach((h) => h.classList.remove('keo'))
  luuNgay()
})

/* Anh vua doi ten (tu dat ten): buoc dang giu duong dan cu doi sang moi; neu duong moi da co trong danh sach thi bo ban trung. */
window.taiLieu.onDoiKhoa((cu, moi) => {
  let co = false
  buoc = buoc.filter((b) => { if (b.khoa === moi) { if (co) return false; co = true } return true })
  for (const b of buoc) if (b.khoa === cu) { b.khoa = moi; b.ten = moi.split(/[\\/]/).pop() }
  for (const k of khay) if (k.khoa === cu) k.khoa = moi
  veAll(); luuNgay()
})

/* ── Nap du lieu tu main ─────────────────────────────────────────────── */
async function nap() {
  const d = await window.taiLieu.lay()
  khay = d.khay || []
  if (!buoc.length || d.lanDau) {
    buoc = (d.buoc || []).map((b) => ({ khoa: b.khoa, ten: b.ten, thumb: b.thumb, moTa: b.moTa || '' }))
    if (d.tieuDe != null && !tieuDoc.value) tieuDoc.value = d.tieuDe
  }
  if (d.anhMat) thongBaoLoi(t('tl.anhMat', { n: d.anhMat }))
  veAll()
}

document.getElementById('them-may').addEventListener('click', async () => {
  const r = await window.taiLieu.themFile()
  if (!r || !r.ds) return
  for (const k of r.ds) {
    if (!khay.some((x) => x.khoa === k.khoa)) khay.push(k)
    if (!buoc.some((b) => b.khoa === k.khoa)) buoc.push({ khoa: k.khoa, ten: k.ten, thumb: k.thumb, moTa: '' })
  }
  veAll(); luuNgay()
})

/* ── Xuat ────────────────────────────────────────────────────────────── */
async function xuat(kieu) {
  if (dangXuat || !buoc.length) { if (!buoc.length) thongBaoLoi(t('tl.thieuBuoc')); return }
  luuNgay()
  dangXuat = true; veBuoc()
  thongBao.className = 'msg'; thongBao.textContent = t('tl.dangXuat'); nutMoThuMuc.hidden = true
  let r
  try { r = await window.taiLieu.xuat({ kieu, tieuDe: tieuDoc.value, buoc: buoc.map((b) => ({ khoa: b.khoa, moTa: b.moTa || '' })) }) } catch (e) { r = { ok: false, loi: String(e && e.message) } }
  dangXuat = false; veBuoc()
  if (r && r.ok) { duongVuaXuat = r.duong; thongBaoOk(t('tl.xuatXong', { ten: r.ten })); nutMoThuMuc.hidden = false }
  else if (r && r.huy) { thongBao.className = 'msg'; thongBao.textContent = t('tl.huy') }
  else thongBaoLoi(t('tl.loiXuat', { loi: (r && r.loi) || '?' }))
}
nutXuat.html.addEventListener('click', () => xuat('html'))
nutXuat.md.addEventListener('click', () => xuat('md'))
nutXuat.pdf.addEventListener('click', () => xuat('pdf'))
nutMoThuMuc.addEventListener('click', () => { if (duongVuaXuat) window.taiLieu.moThuMuc(duongVuaXuat) })
document.getElementById('close').addEventListener('click', () => window.taiLieu.close())

/* Keo cua so bang thanh tieu de (cung cach man Cai dat: delta tuyet doi tu diem nhan) */
;(() => {
  const bar = document.getElementById('tieu-de')
  let k = false, goc = { x: 0, y: 0 }
  bar.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.dieu-khien')) return
    k = true; goc = { x: e.screenX, y: e.screenY }; window.taiLieu.dragStart(); e.preventDefault()
  })
  window.addEventListener('mousemove', (e) => { if (k) window.taiLieu.dragTo(e.screenX - goc.x, e.screenY - goc.y) })
  window.addEventListener('mouseup', () => { if (!k) return; k = false; window.taiLieu.dragEnd() })
})()

window.taiLieu.onLamMoi(() => { nap() })
dich()
nap()
