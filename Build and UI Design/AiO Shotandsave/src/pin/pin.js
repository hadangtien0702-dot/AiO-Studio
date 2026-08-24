'use strict'

/* Cua so ghim (sticky): keo di chuyen, Copy, Dong, lan chuot chinh do mo. */

const frame = document.getElementById('frame')
const img = document.getElementById('img')
const btnCopy = document.getElementById('copy')
const btnClose = document.getElementById('close')

let opacity = 1

window.pin.onData((data) => {
  img.src = data.dataUrl
  frame.style.width = data.w + 'px'
  frame.style.height = data.h + 'px'
})

/* --- Keo di chuyen cua so (dung toa do man hinh de on dinh) --- */
let dragging = false
let lastX = 0
let lastY = 0

frame.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (e.target.closest('#bar')) return // bam nut thi khong keo
  dragging = true
  lastX = e.screenX
  lastY = e.screenY
  frame.classList.add('grabbing')
  e.preventDefault()
})

window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  const dx = e.screenX - lastX
  const dy = e.screenY - lastY
  lastX = e.screenX
  lastY = e.screenY
  if (dx || dy) window.pin.move(dx, dy)
})

window.addEventListener('mouseup', () => {
  dragging = false
  frame.classList.remove('grabbing')
})

/* --- Nut --- */
btnCopy.addEventListener('click', () => window.pin.copy())
btnClose.addEventListener('click', () => window.pin.close())
img.addEventListener('dblclick', () => window.pin.copy())

/* --- Ban phim --- */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.pin.close()
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') window.pin.copy()
})

/* --- Lan chuot = chinh do mo (giu Ctrl de khoi nham voi cuon) --- */
window.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return
  e.preventDefault()
  opacity += e.deltaY < 0 ? 0.06 : -0.06
  opacity = Math.max(0.2, Math.min(1, opacity))
  window.pin.setOpacity(opacity)
}, { passive: false })
