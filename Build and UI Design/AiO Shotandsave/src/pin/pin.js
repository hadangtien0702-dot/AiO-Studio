'use strict'

/* Cua so ghim (sticky): keo di chuyen, Copy, Dong, lan chuot chinh do mo,
   + VE khung/mui ten len anh (anh Tien 26/08 — "bam preview muon ve o/mui ten").
   Phan ve tai dung logic tu overlay.js (rect/arrow/7 mau/undo). */

const frame = document.getElementById('frame')
const img = document.getElementById('img')
const btnEdit = document.getElementById('edit')
const btnCopy = document.getElementById('copy')
const btnClose = document.getElementById('close')
const veEl = document.getElementById('ve')
const toolbarEl = document.getElementById('toolbar')

// Dich tooltip theo ngon ngu.
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  const s = window.i18n.t(el.getAttribute('data-i18n-title'))
  el.title = s
  el.setAttribute('aria-label', s)
})

let opacity = 1
let dip = { w: 0, h: 0 } // kich thuoc hien thi (DIP) tu main

window.pin.onData((data) => {
  img.src = data.dataUrl
  frame.style.width = data.w + 'px'
  frame.style.height = data.h + 'px'
  dip = { w: data.w, h: data.h }
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
  if (mode === 've') return   // dang ve thi khong keo file
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
btnEdit.addEventListener('click', () => vaoCheDoVe())
btnCopy.addEventListener('click', () => window.pin.copy())
btnClose.addEventListener('click', () => window.pin.close())
img.addEventListener('dblclick', () => window.pin.copy())

/* --- Ban phim --- */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (mode === 've') { thoatVe(); return } // dang ve: Esc chi bo ve, khong dong
    window.pin.close()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode === 've') {
    hoanTac(); return
  }
  if (e.key === 'Enter' && mode === 've') { luuVe(); return }
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

/* ====================================================================== */
/* CHE DO VE — khung vuong / mui ten / 7 mau, nhu luc chup                 */
/* ====================================================================== */

const DPR = window.devicePixelRatio || 1
let mode = 'view'          // 'view' | 've'
let tool = 'rect'
let curColor = '#f86820'   // mac dinh CAM (accent)
let shapes = []            // { type, x1, y1, x2, y2, color } — toa do DIP cuc bo
let veCtx = null
let veStart = null

function vaoCheDoVe() {
  mode = 've'
  frame.classList.add('dang-ve')
  shapes = []
  veEl.hidden = false
  // Canvas do phan giai THAT (device px) cho net, ve bang toa do DIP.
  veEl.width = Math.max(1, Math.round(dip.w * DPR))
  veEl.height = Math.max(1, Math.round(dip.h * DPR))
  veCtx = veEl.getContext('2d')
  veCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
  toolbarEl.hidden = false
  chonCongCu('rect')
  chonMau(curColor)
}

function thoatVe() {
  mode = 'view'
  frame.classList.remove('dang-ve')
  shapes = []
  veStart = null
  if (veCtx) veCtx.clearRect(0, 0, dip.w, dip.h)
  veEl.hidden = true
  toolbarEl.hidden = true
}

function chonMau(mau) {
  curColor = mau
  toolbarEl.querySelectorAll('.mau').forEach((b) => {
    b.classList.toggle('chon', b.dataset.color.toLowerCase() === mau.toLowerCase())
  })
}

function chonCongCu(x) {
  tool = x
  toolbarEl.querySelectorAll('.cong-cu[data-tool]').forEach((b) => {
    b.classList.toggle('chon', b.dataset.tool === x)
  })
}

/* Ve tren canvas — toa do cuc bo trong anh. */
veEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || mode !== 've') return
  const r = veEl.getBoundingClientRect()
  veStart = { x: e.clientX - r.left, y: e.clientY - r.top }
  e.preventDefault()
})

window.addEventListener('mousemove', (e) => {
  if (mode !== 've' || !veStart) return
  const r = veEl.getBoundingClientRect()
  const lx = clamp(e.clientX - r.left, 0, dip.w)
  const ly = clamp(e.clientY - r.top, 0, dip.h)
  redraw({ type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor })
})

window.addEventListener('mouseup', (e) => {
  if (mode !== 've' || !veStart) return
  const r = veEl.getBoundingClientRect()
  const lx = clamp(e.clientX - r.left, 0, dip.w)
  const ly = clamp(e.clientY - r.top, 0, dip.h)
  const s = { type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor }
  veStart = null
  if (Math.abs(s.x2 - s.x1) < 3 && Math.abs(s.y2 - s.y1) < 3) { redraw(); return }
  shapes.push(s)
  redraw()
})

function hoanTac() {
  shapes.pop()
  redraw()
}

function redraw(preview) {
  if (!veCtx) return
  veCtx.clearRect(0, 0, dip.w, dip.h)
  const ds = preview ? shapes.concat(preview) : shapes
  for (const s of ds) veShape(veCtx, s, 1)
}

/* k = he so phong (1 khi xem truoc; naturalW/dipW khi xuat ra anh that). */
function veShape(ctx, s, k) {
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = 3 * k
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (s.type === 'rect') {
    const x = Math.min(s.x1, s.x2) * k, y = Math.min(s.y1, s.y2) * k
    ctx.strokeRect(x, y, Math.abs(s.x2 - s.x1) * k, Math.abs(s.y2 - s.y1) * k)
  } else if (s.type === 'arrow') {
    veMuiTen(ctx, s.x1 * k, s.y1 * k, s.x2 * k, s.y2 * k, 13 * k)
  }
}

function veMuiTen(ctx, x1, y1, x2, y2, canh) {
  const goc2 = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - canh * Math.cos(goc2 - Math.PI / 6), y2 - canh * Math.sin(goc2 - Math.PI / 6))
  ctx.lineTo(x2 - canh * Math.cos(goc2 + Math.PI / 6), y2 - canh * Math.sin(goc2 + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

/* Thanh cong cu */
toolbarEl.addEventListener('mousedown', (e) => e.stopPropagation())
toolbarEl.addEventListener('click', (e) => {
  const mau = e.target.closest('.mau')
  if (mau) { chonMau(mau.dataset.color); return }
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.tool) chonCongCu(b.dataset.tool)
  else if (b.id === 'undo') hoanTac()
  else if (b.id === 'huy') thoatVe()
  else if (b.id === 'xong') luuVe()
})

/* Luu: ghep anh goc (do phan giai THAT cua anh) + shape phong theo ty le,
   hien ngay tren cua so ghim + gui main ghi de file + cap nhat khay. */
function luuVe() {
  if (!shapes.length) { thoatVe(); return }
  try {
    const nw = img.naturalWidth, nh = img.naturalHeight
    if (!nw || !nh) { thoatVe(); return }
    const k = nw / dip.w // anh that / kich thuoc hien thi (thuong = scaleFactor)
    const out = document.createElement('canvas')
    out.width = nw
    out.height = nh
    const ctx = out.getContext('2d')
    ctx.drawImage(img, 0, 0, nw, nh)
    for (const s of shapes) veShape(ctx, s, k)
    const dataUrl = out.toDataURL('image/png')
    img.src = dataUrl            // cua so ghim hien ban da ve ngay
    window.pin.saveEdit(dataUrl) // main: ghi de file + cap nhat thumbnail khay
  } catch (err) { /* ghep loi thi giu nguyen anh cu */ }
  thoatVe()
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
