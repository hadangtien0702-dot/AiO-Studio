'use strict'

/* Cua so LAM DEP ANH: dat anh len nen, chinh le / bo goc / bong / ti le, xem truoc tuc thi,
   Luu BAN MOI (khong bao gio ghi de anh goc) hoac Sao chep. Tinh + ve nam o render.js. */

const LD = window.LamDep
const $ = (id) => document.getElementById(id)
const cv = $('cv')
const ctx = cv.getContext('2d')

document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = window.i18n.t(el.getAttribute('data-i18n')) })
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  const s = window.i18n.t(el.getAttribute('data-i18n-title'))
  el.title = s; el.setAttribute('aria-label', s)
})

const o = Object.assign({}, LD.MAC_DINH)
let nguon = null // ImageBitmap anh goc, kich thuoc that
let dangLam = false
let cho = 0

/* --- nut chon (pill) --- */
function nhomChon(id, khoa, sau) {
  const g = $(id)
  g.addEventListener('click', (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b) return
    o[khoa] = b.dataset.v
    dongBo(); sau && sau(); veLai()
  })
}
nhomChon('g-tile', 'tiLe')
nhomChon('g-nen', 'nen', capMau)

/* --- hang o mau: mau dac / chuyen sac --- */
function capMau() {
  const h = $('mau-hang')
  h.innerHTML = ''
  h.style.visibility = o.nen === 'dac' || o.nen === 'chuyen' ? 'visible' : 'hidden'
  if (o.nen === 'chuyen') {
    LD.CHUYEN_SAC.forEach((m, i) => {
      const b = document.createElement('button')
      b.className = 'o-mau' + (o.gd === i ? ' active' : '')
      b.style.background = 'linear-gradient(135deg,' + m[0] + ',' + m[1] + ')'
      b.setAttribute('aria-label', 'gradient ' + (i + 1))
      b.addEventListener('click', () => { o.gd = i; capMau(); veLai() })
      h.appendChild(b)
    })
  } else if (o.nen === 'dac') {
    LD.MAU_DAC.forEach((c) => {
      const b = document.createElement('button')
      b.className = 'o-mau' + (o.mau.toLowerCase() === c ? ' active' : '')
      b.style.background = c
      b.setAttribute('aria-label', c)
      b.addEventListener('click', () => { o.mau = c; capMau(); veLai() })
      h.appendChild(b)
    })
    const t = document.createElement('input')
    t.type = 'color'; t.id = 'o-mau-tu'; t.value = o.mau
    t.setAttribute('aria-label', window.i18n.t('ld.mauTu')); t.title = window.i18n.t('ld.mauTu')
    t.addEventListener('input', () => { o.mau = t.value; veLai() })
    h.appendChild(t)
  }
}

/* --- thanh truot --- */
const THANH = { le: ['s-le', 'o-le'], bo: ['s-bo', 'o-bo'], bong: ['s-bong', 'o-bong'] }
for (const k of Object.keys(THANH)) {
  $(THANH[k][0]).addEventListener('input', (e) => { o[k] = Number(e.target.value); dongBo(); veLai() })
}

function dongBo() {
  for (const b of document.querySelectorAll('#g-tile .chon-nut')) b.classList.toggle('active', b.dataset.v === o.tiLe)
  for (const b of document.querySelectorAll('#g-nen .chon-nut')) b.classList.toggle('active', b.dataset.v === o.nen)
  for (const k of Object.keys(THANH)) {
    $(THANH[k][0]).value = o[k]
    $(THANH[k][1]).textContent = o[k] + (k === 'bong' ? '' : '%')
  }
}

/* --- ve --- */
function khungXem() {
  const r = $('xem').getBoundingClientRect()
  return { w: Math.max(40, r.width - 34), h: Math.max(40, r.height - 34) }
}

function veXem() {
  cho = 0
  if (!nguon) return
  const w = nguon.width, h = nguon.height
  const bc = LD.tinhBoCuc(w, h, o)
  const kv = khungXem()
  const dpr = window.devicePixelRatio || 1
  const fit = Math.min(kv.w / bc.cw0, kv.h / bc.ch0) // CSS px / px goc
  const kXem = Math.min(bc.kTran, fit * dpr)
  const px = LD.tinhBoCuc(w, h, o, kXem)
  cv.width = px.cw; cv.height = px.ch
  cv.style.width = px.cw / dpr + 'px'; cv.style.height = px.ch / dpr + 'px'
  LD.ve(ctx, nguon, px)
  const tin = $('kich-thuoc')
  tin.textContent = bc.cw + ' × ' + bc.ch + ' px'
  tin.title = window.i18n.t('ld.kichThuoc')
  document.body.dataset.cw = bc.cw; document.body.dataset.ch = bc.ch
  document.body.dataset.xem = '1'
}
function veLai() { if (!cho) cho = requestAnimationFrame(veXem) }
window.addEventListener('resize', veLai)

/** Ve ban XUAT THAT (do phan giai goc) len canvas roi tra byte PNG. */
async function xuatPng() {
  const bc = LD.tinhBoCuc(nguon.width, nguon.height, o)
  const c = document.createElement('canvas')
  c.width = bc.cw; c.height = bc.ch
  LD.ve(c.getContext('2d'), nguon, bc)
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'))
  if (!blob) throw new Error('toBlob')
  return new Uint8Array(await blob.arrayBuffer())
}

function baoTin(nhan, ten, loi) {
  const n = $('tt-nhan'), t = $('tt-ten')
  n.textContent = nhan || ''; n.classList.toggle('loi', !!loi)
  t.textContent = ten || ''; t.title = ten || ''
  document.body.dataset.tt = loi ? 'loi' : (nhan ? 'ok' : '')
}

async function lam(loai) {
  if (dangLam || !nguon) return
  dangLam = true
  $('btn-luu').disabled = true; $('btn-chep').disabled = true
  try {
    const u8 = await xuatPng()
    const kq = await (loai === 'luu' ? window.lamdep.luu(u8) : window.lamdep.chep(u8))
    if (kq && kq.ok) {
      baoTin(window.i18n.t(loai === 'luu' ? 'ld.daLuu' : 'ld.daChep'), kq.ten || '')
      if (kq.ten) document.body.dataset.luu = kq.ten
    } else baoTin(window.i18n.t('ld.loi'), (kq && kq.error) || '', true)
  } catch (err) {
    baoTin(window.i18n.t('ld.loi'), String(err && err.message || err), true)
  }
  $('btn-luu').disabled = false; $('btn-chep').disabled = false
  dangLam = false
}
$('btn-luu').addEventListener('click', () => lam('luu'))
$('btn-chep').addEventListener('click', () => lam('chep'))
$('btn-close').addEventListener('click', () => window.lamdep.close())
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.lamdep.close() })

dongBo(); capMau()
window.lamdep.getData().then(async (d) => {
  if (!d || !d.png) return
  nguon = await createImageBitmap(new Blob([d.png], { type: 'image/png' }))
  document.body.dataset.goc = nguon.width + 'x' + nguon.height
  veXem()
  document.body.dataset.san = '1'
})
