'use strict'

/* Cua so ghim (sticky): keo di chuyen, Copy, Dong, lan chuot chinh do mo. */

const frame = document.getElementById('frame')
const img = document.getElementById('img')
const btnCopy = document.getElementById('copy')
const btnClose = document.getElementById('close')

// Dich tooltip theo ngon ngu.
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  const s = window.i18n.t(el.getAttribute('data-i18n-title'))
  el.title = s
  el.setAttribute('aria-label', s)
})

let opacity = 1

window.pin.onData((data) => {
  img.src = data.dataUrl
  frame.style.width = data.w + 'px'
  frame.style.height = data.h + 'px'
})

/* --- Keo di chuyen cua so ---
   ☠️ Gui delta TUYET DOI so voi diem bat dau keo. Cong don tung buoc lam cua
   so PHINH RA tren man hinh DPI khac 100% (vap 24/08, do duoc tren khay). */
let dragging = false
let goc = { x: 0, y: 0 }

// DI CHUYEN cua so = keo THANH TREN (khong phai keo anh). Keo anh nay danh cho
// tha file ra app khac (dragstart ben duoi). Bam NUT thi khong di chuyen.
frame.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (!e.target.closest('#bar')) return       // chi keo khi bam vao thanh tren
  if (e.target.closest('button')) return      // tru cac nut
  dragging = true
  goc = { x: e.screenX, y: e.screenY }
  window.pin.dragStart()
  frame.classList.add('grabbing')
  e.preventDefault()
})

// KEO ANH RA APP KHAC: tha file .png that vao Premiere / Zalo / Messenger...
img.addEventListener('dragstart', (e) => {
  e.preventDefault()          // chan drag mac dinh cua trinh duyet (anh base64)
  window.pin.startDrag()      // main goi webContents.startDrag voi file that
})

window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  window.pin.dragTo(e.screenX - goc.x, e.screenY - goc.y)
})

window.addEventListener('mouseup', () => {
  if (!dragging) return
  dragging = false
  frame.classList.remove('grabbing')
  window.pin.dragEnd()
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
