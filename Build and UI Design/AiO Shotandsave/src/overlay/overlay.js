'use strict'

/* Overlay chon vung. Toa do lam viec = CSS px, goc = goc man hinh dang chon. */

const shotEl = document.getElementById('shot')
const dimEl = document.getElementById('dim')
const selEl = document.getElementById('sel')
const sizeEl = document.getElementById('size')
const hintEl = document.getElementById('hint')

let dragging = false
let startX = 0
let startY = 0
let curRect = { x: 0, y: 0, w: 0, h: 0 }

window.overlay.onShot((data) => {
  shotEl.style.backgroundImage = `url(${data.dataUrl})`
})

function updateSel(x1, y1, x2, y2) {
  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  const w = Math.abs(x2 - x1)
  const h = Math.abs(y2 - y1)
  curRect = { x, y, w, h }
  selEl.style.left = x + 'px'
  selEl.style.top = y + 'px'
  selEl.style.width = w + 'px'
  selEl.style.height = h + 'px'
  sizeEl.textContent = `${w} × ${h}`
  // Neu qua sat mep tren thi day nhan vao trong khung.
  sizeEl.classList.toggle('inside', y < 28)
}

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  dragging = true
  startX = e.clientX
  startY = e.clientY
  dimEl.style.display = 'none' // tu day bong do do #sel lo
  selEl.hidden = false
  hintEl.classList.add('hidden')
  updateSel(startX, startY, startX, startY)
})

window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  updateSel(startX, startY, e.clientX, e.clientY)
})

window.addEventListener('mouseup', (e) => {
  if (!dragging) return
  dragging = false
  const r = curRect
  // Keo qua nho => coi nhu huy.
  if (r.w < 4 || r.h < 4) {
    window.overlay.cancel()
    return
  }
  window.overlay.confirm(r)
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.overlay.cancel()
})
