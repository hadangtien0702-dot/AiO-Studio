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

const btnDragFile = document.getElementById('drag-file')

/* --- Keo di chuyen cua so ---
   ☠️ Gui delta TUYET DOI so voi diem bat dau keo. Cong don tung buoc lam cua
   so PHINH RA tren man hinh DPI khac 100% (vap 24/08, do duoc tren khay). */
let dragging = false
let goc = { x: 0, y: 0 }

// DI CHUYEN cua so: keo bat ky dau tren anh hoac khung (tru khi dang ve hoac bam nut)
frame.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (mode === 've') return // dang o che do ve thi chuot dung de ve
  if (e.target.closest('button') || e.target.closest('#toolbar') || e.target.closest('#drag-file')) return
  if (e.altKey) return // Alt+drag: de tha file ra ngoai app
  dragging = true
  goc = { x: e.screenX, y: e.screenY }
  window.pin.dragStart()
  frame.classList.add('grabbing')
  e.preventDefault()
})

// KEO FILE RA APP KHAC: keo nut #drag-file tren bar hoac giu Alt keo anh
if (btnDragFile) {
  btnDragFile.addEventListener('dragstart', (e) => {
    e.preventDefault()
    window.pin.startDrag()
  })
}
img.addEventListener('dragstart', (e) => {
  e.preventDefault()
  if (mode === 've') return
  window.pin.startDrag()
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
  // Xoa shape dang chon (Delete / Backspace)
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape && !oGoChu && mode === 've') {
    const idx = shapes.indexOf(selectedShape)
    if (idx >= 0) shapes.splice(idx, 1)
    selectedShape = null
    redraw()
    return
  }
  // Di chuyen shape bang phim mui ten (nudge)
  if (selectedShape && !oGoChu && mode === 've' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    if (selectedShape.type === 'text') {
      selectedShape.x += dx; selectedShape.y += dy
    } else {
      selectedShape.x1 += dx; selectedShape.x2 += dx
      selectedShape.y1 += dy; selectedShape.y2 += dy
    }
    redraw()
    return
  }
  if (e.key === 'Enter' && mode === 've') { luuVe(); return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { window.pin.copy(); return }
  // Phim V = Select tool, 1/2/3/4 = khung/mui ten/chu/blur (giong PR — anh Tien 27/09)
  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    const keyMap = {
      'v': 'select', 'V': 'select', 'KeyV': 'select',
      '1': 'rect', '2': 'arrow', '3': 'text', '4': 'blur',
      'b': 'blur', 'B': 'blur', 'KeyB': 'blur',
      'Digit1': 'rect', 'Digit2': 'arrow', 'Digit3': 'text', 'Digit4': 'blur',
      'Numpad1': 'rect', 'Numpad2': 'arrow', 'Numpad3': 'text', 'Numpad4': 'blur'
    }
    const t = keyMap[e.key] || keyMap[e.code]
    if (t) { if (mode !== 've') vaoCheDoVe(); chonCongCu(t) }
  }
})

/* --- Lan chuot = chinh do mo (giu Ctrl / ⌘ de khoi nham voi cuon) --- */
window.addEventListener('wheel', (e) => {
  if (!e.ctrlKey && !e.metaKey) return
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
let selectedShape = null
let dangKeoShape = false
let keoShapeStart = { x: 0, y: 0 }
let shapeBanDau = null

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
  selectedShape = null
  dangKeoShape = false
  shapeBanDau = null
  if (veCtx) veCtx.clearRect(0, 0, dip.w, dip.h)
  veEl.hidden = true
  chonCongCu('rect') // ve che do xem: 3 nut khong nut nao 'dang chon'
}

function chonMau(mau) {
  curColor = mau
  if (oGoChu) oGoChu.style.color = mau
  if (selectedShape && tool === 'select') {
    selectedShape.color = mau
    redraw()
  }
  toolbarEl.querySelectorAll('.mau').forEach((b) => {
    b.classList.toggle('chon', b.dataset.color.toLowerCase() === mau.toLowerCase())
  })
}

function chonCongCu(x) {
  if (x !== tool) chotOGoChu()
  tool = x
  if (tool !== 'select') {
    selectedShape = null
    veEl.style.cursor = 'crosshair'
  } else {
    veEl.style.cursor = 'default'
  }
  toolbarEl.querySelectorAll('.cong-cu[data-tool]').forEach((b) => {
    b.classList.toggle('chon', b.dataset.tool === x)
  })
  redraw()
}

function khoangCachDiemDoanThang(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function tinhHopBaoChu(s) {
  const size = s.size || CO_CHU
  const px = 4, py = 2, lh = size * 1.25
  let w = 0
  const dong = String(s.text).split('\n')
  if (veCtx) {
    veCtx.save()
    veCtx.font = '700 ' + size + 'px Inter, "Segoe UI", sans-serif'
    for (const d of dong) w = Math.max(w, veCtx.measureText(d).width)
    veCtx.restore()
  } else {
    w = (s.text.length || 1) * size * 0.6
  }
  return {
    x: s.x,
    y: s.y,
    w: w + px * 2,
    h: dong.length * lh + py * 2
  }
}

function layHopBaoShape(s) {
  if (s.type === 'rect' || s.type === 'blur') {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2)
    const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1)
    return { x: x - 4, y: y - 4, w: w + 8, h: h + 8 }
  }
  if (s.type === 'arrow') {
    const minX = Math.min(s.x1, s.x2), maxX = Math.max(s.x1, s.x2)
    const minY = Math.min(s.y1, s.y2), maxY = Math.max(s.y1, s.y2)
    return { x: minX - 6, y: minY - 6, w: (maxX - minX) + 12, h: (maxY - minY) + 12 }
  }
  if (s.type === 'text') {
    const b = tinhHopBaoChu(s)
    return { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 }
  }
  return null
}

function timShapeTaiDiem(lx, ly) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i]
    if (s.type === 'rect' || s.type === 'blur') {
      const minX = Math.min(s.x1, s.x2), maxX = Math.max(s.x1, s.x2)
      const minY = Math.min(s.y1, s.y2), maxY = Math.max(s.y1, s.y2)
      const pad = 6
      if (lx >= minX - pad && lx <= maxX + pad && ly >= minY - pad && ly <= maxY + pad) {
        return { shape: s, index: i }
      }
    } else if (s.type === 'arrow') {
      const pad = 9
      if (khoangCachDiemDoanThang(lx, ly, s.x1, s.y1, s.x2, s.y2) <= pad) {
        return { shape: s, index: i }
      }
    } else if (s.type === 'text') {
      const hop = tinhHopBaoChu(s)
      if (lx >= hop.x && lx <= hop.x + hop.w && ly >= hop.y && ly <= hop.y + hop.h) {
        return { shape: s, index: i }
      }
    }
  }
  return null
}

function veKhungChonShape(ctx, s) {
  const b = layHopBaoShape(s)
  if (!b) return
  ctx.save()
  ctx.strokeStyle = '#00e5ff'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.strokeRect(b.x, b.y, b.w, b.h)
  ctx.setLineDash([])
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#00e5ff'
  ctx.lineWidth = 1.5
  const r = 3
  const corners = [
    [b.x, b.y],
    [b.x + b.w, b.y],
    [b.x + b.w, b.y + b.h],
    [b.x, b.y + b.h]
  ]
  for (const [cx, cy] of corners) {
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.strokeRect(cx - r, cy - r, r * 2, r * 2)
  }
  ctx.restore()
}

/* Ve tren canvas — toa do cuc bo trong anh. */
veEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || mode !== 've') return
  const r = veEl.getBoundingClientRect()
  const lx = e.clientX - r.left, ly = e.clientY - r.top
  e.preventDefault()
  if (tool === 'select') {
    chotOGoChu()
    const hit = timShapeTaiDiem(lx, ly)
    if (hit) {
      selectedShape = hit.shape
      dangKeoShape = true
      keoShapeStart = { x: lx, y: ly }
      shapeBanDau = { ...hit.shape }
    } else {
      selectedShape = null
    }
    redraw()
    return
  }
  if (tool === 'text') { moOGoChu(frame, lx, ly, veEl.offsetLeft, veEl.offsetTop); return }
  chotOGoChu()
  veStart = { x: lx, y: ly }
})

window.addEventListener('mousemove', (e) => {
  if (mode !== 've') return
  const r = veEl.getBoundingClientRect()
  const lx = clamp(e.clientX - r.left, 0, dip.w)
  const ly = clamp(e.clientY - r.top, 0, dip.h)
  if (tool === 'select') {
    if (dangKeoShape && selectedShape && shapeBanDau) {
      const dx = Math.round(lx - keoShapeStart.x)
      const dy = Math.round(ly - keoShapeStart.y)
      if (selectedShape.type === 'rect' || selectedShape.type === 'arrow') {
        selectedShape.x1 = shapeBanDau.x1 + dx
        selectedShape.y1 = shapeBanDau.y1 + dy
        selectedShape.x2 = shapeBanDau.x2 + dx
        selectedShape.y2 = shapeBanDau.y2 + dy
      } else if (selectedShape.type === 'text') {
        selectedShape.x = shapeBanDau.x + dx
        selectedShape.y = shapeBanDau.y + dy
      }
      redraw()
    } else {
      const hit = timShapeTaiDiem(lx, ly)
      veEl.style.cursor = hit ? 'move' : 'default'
    }
    return
  }
  if (!veStart) return
  redraw({ type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor })
})

window.addEventListener('mouseup', (e) => {
  if (mode !== 've') return
  if (tool === 'select') {
    if (dangKeoShape) {
      dangKeoShape = false
      shapeBanDau = null
      redraw()
    }
    return
  }
  if (!veStart) return
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
  if (selectedShape && tool === 'select') {
    veKhungChonShape(veCtx, selectedShape)
  }
}

let offscreenBlurCanvas = null
function veBlurPixelate(ctx, x, y, w, h, k) {
  if (w <= 0 || h <= 0) return
  if (!img || !img.naturalWidth) return
  const kScale = img.naturalWidth / dip.w
  const sx = x * kScale
  const sy = y * kScale
  const sw = w * kScale
  const sh = h * kScale

  const blockSize = Math.max(8, Math.round(10 * kScale))
  const bw = Math.max(1, Math.round(sw / blockSize))
  const bh = Math.max(1, Math.round(sh / blockSize))

  if (!offscreenBlurCanvas) offscreenBlurCanvas = document.createElement('canvas')
  offscreenBlurCanvas.width = bw
  offscreenBlurCanvas.height = bh
  const offCtx = offscreenBlurCanvas.getContext('2d')
  offCtx.imageSmoothingEnabled = true
  offCtx.clearRect(0, 0, bw, bh)

  offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, bw, bh)

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(offscreenBlurCanvas, 0, 0, bw, bh, x * k, y * k, w * k, h * k)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1 * k
  ctx.strokeRect(x * k, y * k, w * k, h * k)
  ctx.restore()
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
  } else if (s.type === 'blur') {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2)
    veBlurPixelate(ctx, x, y, Math.abs(s.x2 - s.x1), Math.abs(s.y2 - s.y1), k)
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

