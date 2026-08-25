'use strict'

/* Overlay chon vung + VE SHAPE (khung vuong / mui ten) truoc khi luu — nhu
   Lightshot. Moi man mot overlay rieng; cua so TRONG SUOT (thay man hinh that
   ngay), anh dong bang den sau (freeze). Chon vung xong -> hien thanh cong cu ve.
   Xong: co shape thi renderer GHEP (canvas) gui dataURL; khong shape thi gui rect
   de main cat full-res. */

const shotEl = document.getElementById('shot')
const dimEl = document.getElementById('dim')
const selEl = document.getElementById('sel')
const sizeEl = document.getElementById('size')
const hintEl = document.getElementById('hint')
const veEl = document.getElementById('ve')
const toolbarEl = document.getElementById('toolbar')

const t = (k) => window.i18n.t(k)

// Dich text + tooltip.
document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  el.title = t(el.getAttribute('data-i18n-title')); el.setAttribute('aria-label', el.title)
})

const DPR = window.devicePixelRatio || 1
const MAU = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f86820'

let mode = 'select'       // 'select' | 'annotate'
let tool = 'rect'         // 'rect' | 'arrow'
let curColor = '#f86820'  // mac dinh CAM (accent). Doi qua bang mau.
let dragging = false
let startX = 0, startY = 0
let curRect = { x: 0, y: 0, w: 0, h: 0 }
let shapes = []           // { type, x1, y1, x2, y2 } — toa do CUC BO trong vung chon
let veCtx = null
let frozenImg = null

/* ── Nhan tin tu main ─────────────────────────────────────────────────── */
window.overlay.onInit((data) => {
  if (data && data.selftest) setTimeout(autoSelftest, 1600)
})
window.overlay.onFrozen((data) => {
  shotEl.style.backgroundImage = `url(${data.dataUrl})`
  frozenImg = new Image()
  frozenImg.src = data.dataUrl
})

/* ── Chon vung ────────────────────────────────────────────────────────── */
function updateSel(x1, y1, x2, y2) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2)
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1)
  curRect = { x, y, w, h }
  selEl.style.left = x + 'px'; selEl.style.top = y + 'px'
  selEl.style.width = w + 'px'; selEl.style.height = h + 'px'
  sizeEl.textContent = `${w} × ${h}`
  sizeEl.classList.toggle('inside', y < 28)
}

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (mode === 'annotate') { batDauVe(e); return }
  dragging = true
  startX = e.clientX; startY = e.clientY
  dimEl.style.display = 'none'
  selEl.hidden = false
  hintEl.classList.add('hidden')
  updateSel(startX, startY, startX, startY)
})

window.addEventListener('mousemove', (e) => {
  if (mode === 'annotate') { veDangKeo(e); return }
  if (!dragging) return
  updateSel(startX, startY, e.clientX, e.clientY)
})

window.addEventListener('mouseup', (e) => {
  if (mode === 'annotate') { ketThucVe(e); return }
  if (!dragging) return
  dragging = false
  const r = curRect
  if (r.w < 8 || r.h < 8) { window.overlay.cancel(); return }
  vaoCheDoVe() // chon xong -> ve shape (Lightshot)
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { window.overlay.cancel(); return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { hoanTac(); return }
  // Ctrl+C: xong + COPY vao clipboard (them, khong bo Enter / nut check).
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && mode === 'annotate') {
    e.preventDefault(); xong(true); return
  }
  if (e.key === 'Enter' && mode === 'annotate') xong()
})

/* ── Vao che do VE ────────────────────────────────────────────────────── */
function vaoCheDoVe() {
  mode = 'annotate'
  // Canvas ve dat DUNG len vung chon, do phan giai THAT (device px) cho net.
  veEl.hidden = false
  veEl.style.left = curRect.x + 'px'
  veEl.style.top = curRect.y + 'px'
  veEl.style.width = curRect.w + 'px'
  veEl.style.height = curRect.h + 'px'
  veEl.width = Math.max(1, Math.round(curRect.w * DPR))
  veEl.height = Math.max(1, Math.round(curRect.h * DPR))
  veCtx = veEl.getContext('2d')
  veCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
  // Thanh cong cu: duoi vung chon, hoac tren neu khong du cho.
  toolbarEl.hidden = false
  datViTriThanhCongCu()
  chonCongCu('rect')
  chonMau(curColor) // danh dau mau dang chon (mac dinh cam)
}

function chonMau(mau) {
  curColor = mau
  toolbarEl.querySelectorAll('.mau').forEach((b) => {
    b.classList.toggle('chon', b.dataset.color.toLowerCase() === mau.toLowerCase())
  })
}

function datViTriThanhCongCu() {
  const gap = 10
  const tbH = 44
  let top = curRect.y + curRect.h + gap
  if (top + tbH > window.innerHeight) top = Math.max(gap, curRect.y - tbH - gap)
  toolbarEl.style.top = top + 'px'
  let left = curRect.x
  left = Math.max(gap, Math.min(left, window.innerWidth - toolbarEl.offsetWidth - gap))
  toolbarEl.style.left = left + 'px'
}

function chonCongCu(x) {
  tool = x
  toolbarEl.querySelectorAll('.cong-cu[data-tool]').forEach((b) => {
    b.classList.toggle('chon', b.dataset.tool === x)
  })
}

/* ── Ve shape ─────────────────────────────────────────────────────────── */
let veStart = null
function batDauVe(e) {
  // chi ve khi con tro nam TRONG vung chon
  const lx = e.clientX - curRect.x, ly = e.clientY - curRect.y
  if (lx < 0 || ly < 0 || lx > curRect.w || ly > curRect.h) return
  veStart = { x: lx, y: ly }
}
function veDangKeo(e) {
  if (!veStart) return
  const lx = clamp(e.clientX - curRect.x, 0, curRect.w)
  const ly = clamp(e.clientY - curRect.y, 0, curRect.h)
  redraw({ type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor }) // xem truoc
}
function ketThucVe(e) {
  if (!veStart) return
  const lx = clamp(e.clientX - curRect.x, 0, curRect.w)
  const ly = clamp(e.clientY - curRect.y, 0, curRect.h)
  const s = { type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor }
  veStart = null
  // bo qua neu qua nho (bam nham)
  if (Math.abs(s.x2 - s.x1) < 3 && Math.abs(s.y2 - s.y1) < 3) { redraw(); return }
  shapes.push(s)
  redraw()
}

function redraw(preview) {
  if (!veCtx) return
  veCtx.clearRect(0, 0, curRect.w, curRect.h)
  const ds = preview ? shapes.concat(preview) : shapes
  for (const s of ds) veShape(veCtx, s)
}

function veShape(ctx, s) {
  const mau = s.color || MAU
  ctx.strokeStyle = mau
  ctx.fillStyle = mau
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (s.type === 'rect') {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2)
    ctx.strokeRect(x, y, Math.abs(s.x2 - s.x1), Math.abs(s.y2 - s.y1))
  } else if (s.type === 'arrow') {
    veMuiTen(ctx, s.x1, s.y1, s.x2, s.y2)
  }
}

function veMuiTen(ctx, x1, y1, x2, y2) {
  const goc = Math.atan2(y2 - y1, x2 - x1)
  const canh = 13
  ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - canh * Math.cos(goc - Math.PI / 6), y2 - canh * Math.sin(goc - Math.PI / 6))
  ctx.lineTo(x2 - canh * Math.cos(goc + Math.PI / 6), y2 - canh * Math.sin(goc + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function hoanTac() {
  if (mode !== 'annotate') return
  shapes.pop()
  redraw()
}

/* ── Thanh cong cu ────────────────────────────────────────────────────── */
toolbarEl.addEventListener('mousedown', (e) => e.stopPropagation()) // khoi ve khi bam nut
toolbarEl.addEventListener('click', (e) => {
  const mau = e.target.closest('.mau')
  if (mau) { chonMau(mau.dataset.color); return }
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.tool) chonCongCu(b.dataset.tool)
  else if (b.id === 'undo') hoanTac()
  else if (b.id === 'huy') window.overlay.cancel()
  else if (b.id === 'xong') xong()
})

/* ── Xong: ghep anh + shape roi gui ───────────────────────────────────── */
function xong(copy) {
  if (!shapes.length) { window.overlay.confirm({ rect: curRect, copy: !!copy }); return }
  // Co shape: ghep frozen (device res) + shape roi gui dataURL.
  try {
    const out = document.createElement('canvas')
    out.width = Math.max(1, Math.round(curRect.w * DPR))
    out.height = Math.max(1, Math.round(curRect.h * DPR))
    const ctx = out.getContext('2d')
    if (frozenImg && frozenImg.complete && frozenImg.naturalWidth) {
      ctx.drawImage(frozenImg,
        curRect.x * DPR, curRect.y * DPR, curRect.w * DPR, curRect.h * DPR,
        0, 0, out.width, out.height)
    }
    ctx.drawImage(veEl, 0, 0) // shape da o device res
    window.overlay.confirm({ dataUrl: out.toDataURL('image/png'), copy: !!copy })
  } catch (err) {
    window.overlay.confirm({ rect: curRect, copy: !!copy }) // ghep loi thi cat thuong
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

/* [selftest] tu khoanh giua + xong (khong ve shape). */
function autoSelftest() {
  const W = window.innerWidth, H = window.innerHeight
  const w = Math.min(640, Math.round(W * 0.4)), h = Math.min(420, Math.round(H * 0.4))
  const x = Math.round((W - w) / 2), y = Math.round((H - h) / 2)
  curRect = { x, y, w, h }
  window.overlay.confirm({ rect: curRect })
}
