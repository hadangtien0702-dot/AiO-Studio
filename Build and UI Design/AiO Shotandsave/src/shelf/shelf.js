'use strict'

/* Khay anh: hien thumbnail moi lan chup, bam de ghim lai, keo de doi cho. */

const listEl = document.getElementById('list')
const countEl = document.getElementById('count')
const barEl = document.getElementById('bar')

const t = (k) => window.i18n.t(k)

// Kieu khay: 'doc' = anh to, cuon doc (chon trong Cai dat).
if (window.i18n.khayKieu === 'doc') document.body.classList.add('doc')

// Dich giao dien tinh: text + tooltip.
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = t(el.getAttribute('data-i18n'))
})
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  const s = t(el.getAttribute('data-i18n-title'))
  el.title = s
  el.setAttribute('aria-label', s)
})
// Dong "chua co anh" — hien PHIM TAT THAT (khong cung Ctrl+Shift+S nua).
const emptyEl = document.getElementById('empty')
if (emptyEl) {
  // Dung textContent cho phan chu (an toan) + chip phim rieng, cach ro rang.
  const txt1 = document.createElement('span')
  txt1.textContent = t('khay.trong')
  const chip = document.createElement('span')
  chip.className = 'phim-chip'
  chip.textContent = window.i18n.hotkey || ''
  const txt2 = document.createElement('span')
  txt2.textContent = t('khay.trong2')
  emptyEl.append(txt1, chip, txt2)
}

/** Ve mot o anh vao dau day (moi nhat ben trai). */
function themO(item) {
  if (listEl.querySelector(`.item[data-id="${item.id}"]`)) return
  const el = document.createElement('div')
  el.className = 'item moi'
  el.setAttribute('role', 'listitem')
  el.dataset.id = String(item.id)
  // 15/09 anh: "ảnh chụp dọc trong khay phải hiển thị dọc" — anh cao hon rong thi o cao len, khong cat.
  if (item.h > item.w) el.classList.add('doc-anh')
  // Tooltip: huong dan + kich thuoc + dung luong that cua file.
  const dungLuong = item.kb >= 1024 ? (item.kb / 1024).toFixed(1) + ' MB' : item.kb + ' KB'
  el.title = t('khay.oGhim') +
    (item.w ? '\n' + item.w + ' × ' + item.h + ' px · ' + dungLuong : '')

  const img = document.createElement('img')
  img.src = item.thumb
  img.alt = ''
  // Keo thumbnail ra ngoai = tha file .png that vao Premiere / Zalo / Mess...
  img.draggable = true
  img.addEventListener('dragstart', (e) => {
    e.preventDefault()
    window.shelf.startDrag(item.id)
  })
  el.appendChild(img)

  const rm = document.createElement('button')
  rm.className = 'rm'
  rm.title = t('khay.oXoa')
  rm.setAttribute('aria-label', t('khay.oXoa'))
  rm.innerHTML =
    '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"' +
    ' stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  el.appendChild(rm)

  // So thu tu be be o duoi anh (#1, #2...)
  const stt = document.createElement('span')
  stt.className = 'stt'
  stt.textContent = '#' + (item.seq || item.id || 1)
  el.appendChild(stt)

  // Bam vao anh = ghim lai. Bam vao X = bo khoi khay.
  el.addEventListener('click', (e) => {
    if (e.target.closest('.rm')) {
      window.shelf.remove(item.id)
      return
    }
    window.shelf.pin(item.id)
  })

  listEl.prepend(el)
  el.addEventListener('animationend', () => el.classList.remove('moi'), { once: true })
}

function capNhatSoLuong() {
  const n = listEl.children.length
  countEl.textContent = String(n)
  document.body.classList.toggle('trong', n === 0)
}

/* ── Nhan lenh tu tien trinh chinh ───────────────────────────────────── */

window.shelf.onAdd((item) => {
  themO(item)
  capNhatSoLuong()
  cuonDich = null; cuonDangChay = false
  listEl.scrollLeft = 0; listEl.scrollTop = 0
})

/* Anh ghim vua duoc VE them -> thay thumbnail + tooltip cua dung o do. */
window.shelf.onUpdate((item) => {
  const el = listEl.querySelector(`.item[data-id="${item.id}"]`)
  if (!el) return
  const im = el.querySelector('img')
  if (im) im.src = item.thumb
  const dungLuong = item.kb >= 1024 ? (item.kb / 1024).toFixed(1) + ' MB' : item.kb + ' KB'
  el.title = t('khay.oGhim') +
    (item.w ? '\n' + item.w + ' × ' + item.h + ' px · ' + dungLuong : '')
})

window.shelf.onRemove((id) => {
  const el = listEl.querySelector(`.item[data-id="${id}"]`)
  if (el) el.remove()
  capNhatSoLuong()
})

window.shelf.onClear(() => {
  listEl.innerHTML = ''
  capNhatSoLuong()
})

/* ── Con lan chuot = cuon day anh ────────────────────────────────────── */

/* Khay NGANG chi co truc ngang de cuon, ma con lan gui deltaY (truc doc) —
   khong tu doi truc thi lan chuot khong lam gi ca (anh Tien bao 28/08).
   Bat tren window de tro chuot o dau tren khay cung lan duoc.

   ☠️ 10/09 anh Tien: "scroll trong khay chua muot". Do CDP (scripts/test/
   do-cuon-khay.mjs) TRUOC khi sua: moi nac con lan NHAY 100px tuc thi — doc
   50 buoc nhay, 19 khung/s; ngang 38 buoc nhay, 8 khung/s. Ca khay DOC (cuon
   native) cung nhay. Nay CA HAI kieu cuon bang mot vong rAF truot dan toi
   dich (lerp 0.22/khung ~ 120ms toi noi): nac nao cung cong vao DICH, khong
   dat thang vao scrollTop/Left. */
let cuonDich = null
let cuonDangChay = false
function cuonHienTai() { return document.body.classList.contains('doc') ? listEl.scrollTop : listEl.scrollLeft }
function cuonToiDa() {
  return document.body.classList.contains('doc')
    ? listEl.scrollHeight - listEl.clientHeight
    : listEl.scrollWidth - listEl.clientWidth
}
function datCuon(v) {
  if (document.body.classList.contains('doc')) listEl.scrollTop = v
  else listEl.scrollLeft = v
}
function buocCuon() {
  const cur = cuonHienTai()
  const d = cuonDich - cur
  if (Math.abs(d) < 0.5) { datCuon(cuonDich); cuonDangChay = false; cuonDich = null; return }
  datCuon(cur + d * 0.22)
  requestAnimationFrame(buocCuon)
}
window.addEventListener('wheel', (e) => {
  const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
  if (!delta) return
  e.preventDefault()
  // deltaMode 1 = theo DONG (mot so chuot/driver) -> quy ra px
  const px = e.deltaMode === 1 ? delta * 16 : delta
  if (cuonDich === null) cuonDich = cuonHienTai()
  cuonDich = Math.max(0, Math.min(cuonToiDa(), cuonDich + px))
  if (!cuonDangChay) { cuonDangChay = true; requestAnimationFrame(buocCuon) }
}, { passive: false })

/* ── Nut tren thanh ──────────────────────────────────────────────────── */

document.getElementById('storyboard')?.addEventListener('click', () => {
  if (listEl.children.length === 0) return
  window.shelf.openStoryboard()
})
// 01/10: mo Khay video (cac doan quay vung man hinh nam o khay rieng, khong chung khay anh)
document.getElementById('video')?.addEventListener('click', () => window.shelf.openVideo())
document.getElementById('folder').addEventListener('click', () => window.shelf.openFolder())
document.getElementById('clear').addEventListener('click', () => window.shelf.clear())
document.getElementById('hide').addEventListener('click', () => window.shelf.hide())

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, [contenteditable="true"]')) return
  if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (listEl.children.length === 0) return
    e.preventDefault()
    window.shelf.openStoryboard()
  }
})

/* ── Keo thanh tren de doi cho khay ──────────────────────────────────── */

/* ☠️ Gui delta TUYET DOI so voi diem bat dau keo, KHONG gui delta tung buoc.
   Cong don tung buoc lam khay phinh ra tren man hinh DPI 1.25 (vap 24/08). */
let dragging = false
let goc = { x: 0, y: 0 }

barEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (e.target.closest('button')) return
  dragging = true
  goc = { x: e.screenX, y: e.screenY }
  window.shelf.dragStart()
  barEl.classList.add('grabbing')
  e.preventDefault()
})

window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  window.shelf.dragTo(e.screenX - goc.x, e.screenY - goc.y)
})

window.addEventListener('mouseup', () => {
  if (!dragging) return
  dragging = false
  barEl.classList.remove('grabbing')
  window.shelf.dragEnd()
  window.shelf.savePos() // nho cho vua tha
})

/* ── Tay nam goc tren-trai: DOI CO khay (14/09) ──────────────────────────
   Cung luat delta TUYET DOI nhu keo di chuyen. Main kep [san, tran] va giu goc
   duoi-phai. */
let resizing = false
let gocCo = { x: 0, y: 0 }
let gripDangKeo = null
for (const g of document.querySelectorAll('.grip-goc')) {
  g.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    resizing = true
    gripDangKeo = g
    gocCo = { x: e.screenX, y: e.screenY }
    g.classList.add('dang-keo')
    window.shelf.resizeStart(g.dataset.goc || 'tl') // goc dang keo: tl | tr | bl | br (15/09)
    e.preventDefault(); e.stopPropagation()
  })
}
window.addEventListener('mousemove', (e) => {
  if (!resizing) return
  window.shelf.resizeTo(e.screenX - gocCo.x, e.screenY - gocCo.y)
})
window.addEventListener('mouseup', () => {
  if (!resizing) return
  resizing = false
  if (gripDangKeo) gripDangKeo.classList.remove('dang-keo')
  gripDangKeo = null
  window.shelf.resizeEnd()
})

/* ── 01/10 KHAY THU VE NUT TRON (main: src/khay-thu.js) ───────────────────────
   Main goi 3 ham nay bang executeJavaScript (khong them kenh IPC):
   - __khayThongTin(): cac o anh DANG THAY (toa do DIP trong cua so) de san dien cat tu anh chup cua so ma cho bay.
   - __khayAn(true|false): an / hien noi dung khay (cua so van o do). Luc thu ve: "bong" tren san dien da de len roi
     moi an, nen khong thay nhay. Cho 2 khung de khung TRONG kip ve truoc khi main an cua so (cua so an thi khong ve
     lai -> lan hien sau khong lo khay cu).
   - __khayBung(): xuat hien kieu "ong kinh": man trap bung tu tam ra + mot nhay sang.
   Moi cho doi deu dua voi hen gio: cua so dang an thi requestAnimationFrame dung, khong duoc treo main. */
const choNgan = (ms) => new Promise((r) => setTimeout(r, ms))
window.__khayThongTin = () => {
  const kv = listEl.getBoundingClientRect()
  const o = []
  for (const el of listEl.children) {
    const r = el.getBoundingClientRect()
    const x0 = Math.max(r.left, kv.left), y0 = Math.max(r.top, kv.top)
    const w = Math.min(r.right, kv.right) - x0, h = Math.min(r.bottom, kv.bottom) - y0
    // chi lay o con thay it nhat mot nua (khay cuon / nhieu hang); o lo ra mot phan thi chi lay phan dang thay
    if (w < r.width * .5 || h < r.height * .5) continue
    o.push({ x: Math.round(x0), y: Math.round(y0), w: Math.round(w), h: Math.round(h) })
  }
  return { o, tong: listEl.children.length, w: window.innerWidth, h: window.innerHeight }
}
window.__khayAn = (an) => {
  document.body.classList.toggle('an', !!an)
  return Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))), choNgan(120).then(() => true)])
}
window.__khayBung = () => {
  const khay = document.getElementById('shelf'), chop = document.getElementById('chop')
  const r = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 6
  const chay = (el, kf, o) => {
    const a = el.animate(kf, Object.assign({ fill: 'both' }, o))
    return Promise.race([a.finished.catch(() => {}), choNgan(o.duration + (o.delay || 0) + 150)]).then(() => { a.cancel(); return true })
  }
  document.body.classList.remove('an')
  if (chop) chay(chop, [{ opacity: .5 }, { opacity: 0 }], { duration: 300, delay: 40, easing: 'ease-out' })
  chay(listEl, [{ filter: 'brightness(.35)' }, { filter: 'brightness(1)' }], { duration: 280 })
  return chay(khay, [{ clipPath: 'circle(26px at 50% 50%)' }, { clipPath: 'circle(' + r.toFixed(1) + 'px at 50% 50%)' }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' })
}

capNhatSoLuong()
