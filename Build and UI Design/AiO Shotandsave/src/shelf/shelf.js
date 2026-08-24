'use strict'

/* Khay anh: hien thumbnail moi lan chup, bam de ghim lai, keo de doi cho. */

const listEl = document.getElementById('list')
const countEl = document.getElementById('count')
const barEl = document.getElementById('bar')

/** Ve mot o anh vao dau day (moi nhat ben trai). */
function themO(item) {
  const el = document.createElement('div')
  el.className = 'item moi'
  el.setAttribute('role', 'listitem')
  el.dataset.id = String(item.id)
  el.title = 'Bấm để ghim lại lên màn hình'

  const img = document.createElement('img')
  img.src = item.thumb
  img.alt = ''
  img.draggable = false
  el.appendChild(img)

  const rm = document.createElement('button')
  rm.className = 'rm'
  rm.title = 'Bỏ khỏi khay (ảnh vẫn còn trong thư mục)'
  rm.setAttribute('aria-label', 'Bỏ khỏi khay')
  rm.innerHTML =
    '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor"' +
    ' stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  el.appendChild(rm)

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
  listEl.scrollLeft = 0
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

/* ── Nut tren thanh ──────────────────────────────────────────────────── */

document.getElementById('folder').addEventListener('click', () => window.shelf.openFolder())
document.getElementById('clear').addEventListener('click', () => window.shelf.clear())
document.getElementById('hide').addEventListener('click', () => window.shelf.hide())

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

capNhatSoLuong()
