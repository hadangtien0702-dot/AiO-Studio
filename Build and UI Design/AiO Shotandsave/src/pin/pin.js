'use strict'

/* Cua so ghim (sticky): keo di chuyen, Copy, Dong, lan chuot chinh do mo,
   + VE khung/mui ten len anh (anh Tien 26/08 — "bam preview muon ve o/mui ten").
   Phan ve tai dung logic tu overlay.js (rect/arrow/7 mau/undo). */

const frame = document.getElementById('frame')
const img = document.getElementById('img')
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
const PLOG = (m) => { try { window.pin.log(m) } catch (e) {} }
let dip = { w: 0, h: 0 } // kich thuoc hien thi (DIP) tu main

window.pin.onData((data) => {
  img.src = data.dataUrl
  frame.style.width = data.w + 'px'
  frame.style.height = data.h + 'px'
  dip = { w: data.w, h: data.h }
  PLOG('data dip=' + data.w + 'x' + data.h + ' DPR=' + DPR + ' win=' + window.innerWidth + 'x' + window.innerHeight)
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
btnCopy.addEventListener('click', () => window.pin.copy())
btnClose.addEventListener('click', () => window.pin.close())
img.addEventListener('dblclick', () => window.pin.copy())

/* --- Ban phim --- */
window.addEventListener('keydown', (e) => {
  PLOG('key ' + e.key + ' mode=' + mode + ' tool=' + tool)
  if (e.key === 'Escape') {
    if (mode === 've') { thoatVe(); return } // dang ve: Esc chi bo ve, khong dong
    window.pin.close()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode === 've') {
    hoanTac(); return
  }
  if (e.key === 'Enter' && mode === 've') { luuVe(); return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { window.pin.copy(); return }
  // Phim 1 / 2 / 3 = vao che do ve voi khung / mui ten / chu (thay nut but chi — anh Tien 10/09)
  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    const t = { '1': 'rect', '2': 'arrow', '3': 'text' }[e.key]
    if (t) { if (mode !== 've') vaoCheDoVe(); chonCongCu(t) }
  }
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
  // ☠️ Kich thuoc CSS = DIP (khong dat la canvas to gap DPR lan -> ve lech, 10/09)
  veEl.style.width = dip.w + 'px'
  veEl.style.height = dip.h + 'px'
  veCtx = veEl.getContext('2d')
  veCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
  chonCongCu('rect')
  chonMau(curColor)
  const cs = getComputedStyle(veEl), r = veEl.getBoundingClientRect()
  PLOG('vao ve: canvas ' + veEl.width + 'x' + veEl.height + ' css=' + cs.width + 'x' + cs.height + ' display=' + cs.display + ' rect=' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' dip=' + dip.w + 'x' + dip.h)
}

function thoatVe() {
  huyOGoChu()
  mode = 'view'
  frame.classList.remove('dang-ve')
  shapes = []
  veStart = null
  if (veCtx) veCtx.clearRect(0, 0, dip.w, dip.h)
  veEl.hidden = true
  chonCongCu('rect') // ve che do xem: 3 nut khong nut nao 'dang chon'
}

function chonMau(mau) {
  curColor = mau
  if (oGoChu) oGoChu.style.color = mau
  toolbarEl.querySelectorAll('.mau').forEach((b) => {
    b.classList.toggle('chon', b.dataset.color.toLowerCase() === mau.toLowerCase())
  })
}

function chonCongCu(x) {
  if (x !== tool) chotOGoChu()
  tool = x
  toolbarEl.querySelectorAll('.cong-cu[data-tool]').forEach((b) => {
    b.classList.toggle('chon', b.dataset.tool === x)
  })
}

/* Ve tren canvas — toa do cuc bo trong anh. */
veEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || mode !== 've') return
  const r = veEl.getBoundingClientRect()
  const lx = e.clientX - r.left, ly = e.clientY - r.top
  e.preventDefault()
  if (tool === 'text') { moOGoChu(frame, lx, ly, veEl.offsetLeft, veEl.offsetTop); return }
  chotOGoChu()
  veStart = { x: lx, y: ly }
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
  if (oGoChu) { huyOGoChu(); return }
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
  } else if (s.type === 'text') {
    veChu(ctx, s, k)
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
  if (b.dataset.tool) { if (mode !== 've') vaoCheDoVe(); chonCongCu(b.dataset.tool) } // 14/09: bam chuot cung vao ve duoc
  else if (b.id === 'undo') hoanTac()
  else if (b.id === 'huy') thoatVe()
  else if (b.id === 'xong') luuVe()
})

/* Luu: ghep anh goc (do phan giai THAT cua anh) + shape phong theo ty le,
   hien ngay tren cua so ghim + gui main ghi de file + cap nhat khay. */
function luuVe() {
  chotOGoChu()
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

/* ── Cong cu CHU (phim 3, anh Tien 10/09) ──────────────────────────────
   Bam vao anh -> hien o go (textarea trong suot) dung cho do; Enter = chot
   thanh shape {type:'text'}; Shift+Enter xuong dong; Esc = bo o go (KHONG
   thoat che do). Bam cho khac / doi cong cu / Xong = tu chot o dang go. */
const CO_CHU = 18 // px DIP, chu dam; xuat ra anh that thi nhan he so k
let oGoChu = null
function moOGoChu(parent, lx, ly, ox, oy) {
  chotOGoChu()
  const ta = document.createElement('textarea')
  ta.className = 'go-chu'
  ta.rows = 1
  ta.spellcheck = false
  ta.style.left = (ox + lx) + 'px'
  ta.style.top = (oy + ly) + 'px'
  ta.style.color = curColor
  ta.dataset.lx = lx; ta.dataset.ly = ly
  ta.addEventListener('mousedown', (e) => e.stopPropagation())
  ta.addEventListener('keydown', (e) => {
    e.stopPropagation() // Enter/Esc/1-2-3 cua o go KHONG chay lenh toan cuc
    if (e.key === 'Escape') { e.preventDefault(); huyOGoChu(); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chotOGoChu(); return }
  })
  ta.addEventListener('input', () => tuCoOGoChu(ta))
  parent.appendChild(ta)
  oGoChu = ta
  tuCoOGoChu(ta)
  ta.focus()
}
function tuCoOGoChu(ta) {
  const dong = ta.value.split('\n')
  ta.rows = Math.max(1, dong.length)
  ta.style.width = 'auto'
  ta.style.width = Math.max(40, ta.scrollWidth + 2) + 'px'
}
function huyOGoChu() { if (oGoChu) { oGoChu.remove(); oGoChu = null } }
function chotOGoChu() {
  if (!oGoChu) return
  const text = oGoChu.value.replace(/\s+$/, '')
  const s = { type: 'text', x: +oGoChu.dataset.lx, y: +oGoChu.dataset.ly, text, color: oGoChu.style.color || curColor, size: CO_CHU }
  huyOGoChu()
  if (!text) return
  shapes.push(s)
  redraw()
}
/* Ve chu: dam, tren HOP NEN toi bo goc (anh Tien 14/09: "cần thêm nền chữ" —
   chu cam de len anh sang la chim; vien chu 0.6 truoc do khong du). Hop = nen
   #181818 ~82%, padding 4/2 DIP, bo goc 4 DIP; o go (.go-chu) dung cung so
   de WYSIWYG. k = he so phong. */
const NEN_CHU = 'rgba(24,24,24,0.82)'
function veChu(ctx, s, k) {
  const size = (s.size || CO_CHU) * k
  const px = 4 * k, py = 2 * k, r = 4 * k, lh = size * 1.25
  ctx.font = '700 ' + size + 'px Inter, "Segoe UI", sans-serif'
  ctx.textBaseline = 'top'
  const dong = String(s.text).split('\n')
  let w = 0
  for (const d of dong) w = Math.max(w, ctx.measureText(d).width)
  const bx = s.x * k, by = s.y * k, bw = w + px * 2, bh = dong.length * lh + py * 2
  ctx.fillStyle = NEN_CHU
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, r); else ctx.rect(bx, by, bw, bh)
  ctx.fill()
  ctx.fillStyle = s.color
  for (let i = 0; i < dong.length; i++) {
    ctx.fillText(dong[i], bx + px, by + py + i * lh)
  }
}

