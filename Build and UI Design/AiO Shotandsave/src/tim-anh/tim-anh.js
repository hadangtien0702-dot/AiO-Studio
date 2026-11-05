'use strict'
/* Tim lai anh cu: giao dien. Go chu -> main.tim (chi muc chu trong userData). Thumbnail nap luoi (IntersectionObserver). */
const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k)
const $ = (id) => document.getElementById(id)
const luoi = $('luoi'), trong = $('trong'), oTim = $('o-tim'), demKq = $('dem-kq'), ttChu = $('tt-chu'), nutTD = $('nut-tam-dung')

document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })
document.querySelectorAll('[data-i18n-title]').forEach((el) => { const s = t(el.getAttribute('data-i18n-title')); el.title = s; el.setAttribute('aria-label', s) })
document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')) })
document.documentElement.lang = window.i18n ? window.i18n.lang : 'vi'

let loai = 'tat-ca', ngay = 'moi', henTim = null, soLanTim = 0, trangThai = null
const urls = new Map() // duong -> blob url (thumbnail da nap)

function khoangNgay() {
  const now = new Date()
  const dauNgay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (ngay === 'homnay') return { tu: dauNgay }
  if (ngay === '7') return { tu: dauNgay - 6 * 86400000 }
  if (ngay === '30') return { tu: dauNgay - 29 * 86400000 }
  if (ngay === 'chon') {
    const a = $('ngay-tu').value, b = $('ngay-den').value
    const o = {}
    if (a) o.tu = new Date(a + 'T00:00:00').getTime()
    if (b) o.den = new Date(b + 'T23:59:59.999').getTime()
    return o
  }
  return {}
}

const io = new IntersectionObserver((es) => {
  for (const e of es) {
    if (!e.isIntersecting) continue
    io.unobserve(e.target)
    napThumb(e.target)
  }
}, { root: $('viewport'), rootMargin: '300px' })

async function napThumb(the) {
  const duong = the.dataset.duong
  const img = the.querySelector('img')
  let url = urls.get(duong)
  if (!url) {
    const u8 = await window.timAnh.thumb(duong)
    if (!u8) { the.classList.add('khong-anh'); return }
    url = URL.createObjectURL(new Blob([u8], { type: 'image/jpeg' }))
    urls.set(duong, url)
  }
  img.src = url
}

function nhanLoai(l) { return l === 'video' ? 'VIDEO' : l === 'dai' ? 'STORYBOARD' : '' }
function dinhDangGio(ms) {
  const d = new Date(ms)
  return d.toLocaleString(window.i18n && window.i18n.lang === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function veThe(r) {
  const the = document.createElement('div')
  the.className = 'the'; the.tabIndex = 0; the.draggable = true
  the.dataset.duong = r.duong; the.dataset.loai = r.loai
  const anh = document.createElement('div'); anh.className = 'anh'
  const img = document.createElement('img'); img.alt = ''
  anh.appendChild(img)
  if (nhanLoai(r.loai)) { const l = document.createElement('span'); l.className = 'loai'; l.textContent = nhanLoai(r.loai); anh.appendChild(l) }
  const nt = document.createElement('div'); nt.className = 'nut-the'
  if (r.loai !== 'video') {
    const g = document.createElement('button'); g.className = 'nut chinh nho'; g.textContent = t('ta.ghim'); g.dataset.hd = 'ghim'; nt.appendChild(g)
  }
  const m = document.createElement('button'); m.className = 'nut nho'; m.textContent = t('ta.moThuMuc'); m.dataset.hd = 'mo'; nt.appendChild(m)
  anh.appendChild(nt)
  const tin = document.createElement('div'); tin.className = 'tin'
  const gio = document.createElement('div'); gio.className = 'gio'; gio.textContent = dinhDangGio(r.mt)
  if (!r.daDoc && r.loai !== 'video') { const c = document.createElement('span'); c.className = 'cho-doc'; c.textContent = t('ta.choDoc'); gio.appendChild(c) }
  tin.appendChild(gio)
  if (r.doan) {
    const d = document.createElement('div'); d.className = 'doan'
    d.appendChild(document.createTextNode(r.doan[0]))
    const mk = document.createElement('mark'); mk.textContent = r.doan[1]; d.appendChild(mk)
    d.appendChild(document.createTextNode(r.doan[2]))
    tin.appendChild(d)
  }
  the.appendChild(anh); the.appendChild(tin)
  return the
}

async function tim() {
  const lan = ++soLanTim
  const q = Object.assign({ chu: oTim.value, loai }, khoangNgay())
  const kq = await window.timAnh.tim(q)
  if (lan !== soLanTim) return // co lan go moi hon
  trangThai = kq.trangThai
  luoi.textContent = ''
  io.disconnect()
  const frag = document.createDocumentFragment()
  for (const r of kq.ds) frag.appendChild(veThe(r))
  luoi.appendChild(frag)
  for (const the of luoi.children) io.observe(the)
  demKq.textContent = String(kq.tong)
  demKq.title = kq.ms + ' ms'
  if (!kq.ds.length) {
    trong.hidden = false
    trong.textContent = trangThai && trangThai.tong === 0 ? t('ta.trongKho') : t('ta.chuaCo')
  } else trong.hidden = true
  if (kq.daCat) { trong.hidden = false; trong.textContent = t('ta.conNhieu', { n: kq.ds.length }) }
  hienTrangThai()
}

function hienTrangThai() {
  const s = trangThai
  if (!s) return
  let chu
  if (s.tamDung) chu = t('ta.dangTamDung', { a: s.daDoc, b: s.tong })
  else if (s.choDoc > 0) chu = t('ta.dangDoc', { a: s.daDoc, b: s.tong })
  else chu = t('ta.daDocXong', { b: s.tong })
  ttChu.textContent = chu
  nutTD.textContent = s.tamDung ? t('ta.tiepTuc') : t('ta.tamDung')
  nutTD.hidden = s.choDoc === 0 && !s.tamDung
}

function hoanTim(ms) { clearTimeout(henTim); henTim = setTimeout(tim, ms == null ? 120 : ms) }

oTim.addEventListener('input', () => hoanTim())
$('nhom-loai').addEventListener('click', (e) => {
  const b = e.target.closest('[data-loai]'); if (!b) return
  loai = b.dataset.loai
  document.querySelectorAll('#nhom-loai .chon-nut').forEach((x) => x.classList.toggle('active', x === b))
  hoanTim(0)
})
$('nhom-ngay').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ngay]'); if (!b) return
  ngay = b.dataset.ngay
  document.querySelectorAll('#nhom-ngay .chon-nut').forEach((x) => x.classList.toggle('active', x === b))
  $('khoang-ngay').hidden = ngay !== 'chon'
  hoanTim(0)
})
$('ngay-tu').addEventListener('change', () => hoanTim(0))
$('ngay-den').addEventListener('change', () => hoanTim(0))

luoi.addEventListener('click', (e) => {
  const the = e.target.closest('.the'); if (!the) return
  const duong = the.dataset.duong
  const hd = e.target.closest('[data-hd]')
  if (hd && hd.dataset.hd === 'mo') { window.timAnh.moThuMuc(duong); return }
  if (the.dataset.loai === 'video') { window.timAnh.moThuMuc(duong); return } // video khong ghim duoc: mo thu muc
  window.timAnh.ghim(duong)
})
luoi.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return
  const the = e.target.closest('.the'); if (!the) return
  if (the.dataset.loai === 'video') window.timAnh.moThuMuc(the.dataset.duong); else window.timAnh.ghim(the.dataset.duong)
})
luoi.addEventListener('dragstart', (e) => {
  const the = e.target.closest('.the'); if (!the) return
  e.preventDefault()
  window.timAnh.keo(the.dataset.duong)
})

nutTD.addEventListener('click', async () => {
  trangThai = await window.timAnh.tamDung(!(trangThai && trangThai.tamDung))
  hienTrangThai()
})
$('btn-close').addEventListener('click', () => window.timAnh.close())
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.timAnh.close() })

let lanTD = 0
window.timAnh.onTienDo((s) => {
  trangThai = s; hienTrangThai()
  // doc them duoc anh: lam moi ket qua khi dang tim chu (toi da 1 lan / 3 giay, de khong nhay luoi)
  const now = Date.now()
  if (oTim.value.trim() && now - lanTD > 3000) { lanTD = now; hoanTim(0) }
})
window.timAnh.onLamMoi(() => hoanTim(0))

oTim.focus()
tim()
