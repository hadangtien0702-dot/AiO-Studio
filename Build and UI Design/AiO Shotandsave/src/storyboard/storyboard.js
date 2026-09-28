'use strict'

/* =========================================================================
   AiO Shot & Save — Multi-Shot Storyboard Strip
   Renderer Logic & Canvas 2D Engine
   ========================================================================= */

const t = (k, params) => window.i18n ? window.i18n.t(k, params) : k

const canvas = document.getElementById('main-canvas')
const ctx = canvas.getContext('2d', { alpha: false })
const overlaysEl = document.getElementById('shot-overlays')
const badgeCountEl = document.getElementById('shot-badge')
const toastEl = document.getElementById('toast')

const btnFilmstrip = document.getElementById('btn-filmstrip')
const btnGrid = document.getElementById('btn-grid')
const chkShotBadge = document.getElementById('chk-shot-badge')
const chkInfoBar = document.getElementById('chk-info-bar')

const btnCopy = document.getElementById('btn-copy')
const btnSave = document.getElementById('btn-save')
const btnClose = document.getElementById('btn-close')
const btnDrag = document.getElementById('btn-drag')
const canvasWrapper = document.getElementById('canvas-wrapper')

let rawItems = []
let activeItems = []
let currentLayout = 'filmstrip' // 'filmstrip' | 'grid'
let showShotBadge = true
let showInfoBar = true
let toastTimer = null
/* [ra 28/09] ti le chu/nhan theo co khung: 720px (dai) -> x2.4, 460px (luoi) -> x1.53.
   Truoc: badge 13px co dinh, dai 6.512px gui Zalo thu con ~1.000px -> nhan ~2px khong doc duoc. */
let tl = 1

// Chuyen doi chuoi i18n
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = t(el.getAttribute('data-i18n'))
})
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  const s = t(el.getAttribute('data-i18n-title'))
  el.title = s
  el.setAttribute('aria-label', s)
})

function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer)
  toastEl.textContent = msg
  toastEl.classList.add('show')
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show')
    toastTimer = null
  }, 2200)
}

/** Tải dữ liệu ban đầu từ main process */
async function init() {
  try {
    const data = await window.storyboard.getData()
    if (!data || !data.items || data.items.length === 0) {
      showToast(t('sb.chuaCoAnh'))
      return
    }

    rawItems = data.items
    activeItems = [...rawItems]

    // Tu dong chon bo cuc thong minh: <= 5 anh: Filmstrip, > 5 anh: Grid
    if (activeItems.length > 5) {
      currentLayout = 'grid'
      btnFilmstrip.classList.remove('active')
      btnGrid.classList.add('active')
    }

    updateShotBadgeCount()
    await loadAllImages()
    render()
  } catch (err) {
    console.error('Loi khoi tao Storyboard:', err)
  }
}

function updateShotBadgeCount() {
  const n = activeItems.length
  // Chi con so, giong #count cua khay anh; cau day du nam o tooltip.
  badgeCountEl.textContent = String(n)
  badgeCountEl.title = t('sb.shots', { n: String(n) })
}

/** Load song song toan bo image elements */
async function loadAllImages() {
  const promises = rawItems.map((item) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        item.imgEl = img
        resolve()
      }
      img.onerror = () => {
        console.error('Khong the load anh shot #' + item.seq)
        resolve()
      }
      img.src = item.dataUrl
    })
  })
  await Promise.all(promises)
}

/** Bo tron goc bang path tren Canvas 2D */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Ham render chinh cua Storyboard */
function render() {
  if (activeItems.length === 0) {
    canvas.width = 640
    canvas.height = 360
    // Man trong = mau khung app (tokens --bg-0 / --text-3), khong phai mau anh xuat.
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, 640, 360)
    ctx.fillStyle = '#8d8d95'
    ctx.font = '500 13px Inter, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(t('sb.chuaCoAnh'), 320, 180)
    overlaysEl.innerHTML = ''
    return
  }

  overlaysEl.innerHTML = ''
  if (currentLayout === 'filmstrip') {
    renderFilmstrip()
  } else {
    renderGrid()
  }
  nenSan()
}

/* [ra 28/09] toBlob chay nen (khong chan giao dien nhu toDataURL), gui BYTE thang sang main. */
let banNen = null   // Promise<{ u8, icon }> cua lan ve moi nhat
function nenSan() {
  const ve = document.createElement('canvas')
  const hIcon = 80, wIcon = Math.max(1, Math.round(canvas.width * hIcon / canvas.height))
  ve.width = Math.min(wIcon, 480); ve.height = Math.round(ve.width * canvas.height / canvas.width)
  ve.getContext('2d').drawImage(canvas, 0, 0, ve.width, ve.height)
  const icon = ve.toDataURL('image/png')
  banNen = new Promise((res, rej) => canvas.toBlob((b) => b ? b.arrayBuffer().then((ab) => res({ u8: new Uint8Array(ab), icon }), rej) : rej(new Error('toBlob rong')), 'image/png'))
}
const layBanNen = () => banNen || (nenSan(), banNen)

/** 1. Bo cuc Cinema Filmstrip (Dai ngang lien mach) */
function renderFilmstrip() {
  const gap = 16
  const pad = 24
  /* [ra 28/09] tran be ngang 16.000 px: do 40 anh 16:9 o dang dai = 51.872 px, PNG 88 MB (khong gui/mo noi).
     Vuot tran thi khung thap xuong (toi thieu 160 px), chu/nhan thu theo (tl). */
  const TRAN_W = 16000
  const tongTiLe = activeItems.reduce((a, it) => a + ((it.imgEl && it.imgEl.naturalWidth) || it.w || 16) / ((it.imgEl && it.imgEl.naturalHeight) || it.h || 9), 0)
  const frameH = Math.max(160, Math.min(720, Math.floor((TRAN_W - pad * 2 - gap * (activeItems.length - 1)) / (tongTiLe || 1))))
  tl = frameH / 300
  const infoH = showInfoBar ? Math.round(46 * tl) : 0
  const extraBottom = showInfoBar ? 12 : 0

  // Tinh toan be rong moi shot theo ty le thuc te
  const frames = activeItems.map((it) => {
    const nw = (it.imgEl && it.imgEl.naturalWidth) || it.w || 16
    const nh = (it.imgEl && it.imgEl.naturalHeight) || it.h || 9
    const aspect = nw / nh
    const w = Math.round(frameH * aspect)
    return { item: it, w, h: frameH }
  })

  const sumFramesW = frames.reduce((acc, f) => acc + f.w, 0)
  const totalW = pad * 2 + sumFramesW + gap * (frames.length - 1)
  const totalH = pad * 2 + frameH + infoH + extraBottom

  canvas.width = totalW
  canvas.height = totalH

  // Background Studio Console
  ctx.fillStyle = '#090a0d'
  ctx.fillRect(0, 0, totalW, totalH)

  let curX = pad
  const curY = pad
  const boxes = []

  frames.forEach((f, idx) => {
    const { item, w, h } = f

    // Ve vien khung clip
    ctx.save()
    roundRect(ctx, curX, curY, w, h, 8)
    ctx.clip()

    if (item.imgEl && item.imgEl.complete) {
      ctx.drawImage(item.imgEl, curX, curY, w, h)
    }

    ctx.restore()

    // Vien 1.5px tinh te
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1.5
    roundRect(ctx, curX, curY, w, h, 8)
    ctx.stroke()
    ctx.restore()

    // Nhãn SHOT 01, SHOT 02...
    if (showShotBadge) {
      drawShotBadge(curX + Math.round(14 * tl), curY + Math.round(14 * tl), idx + 1)
    }

    // Luu toa do de tao overlay xoa shot
    boxes.push({ id: item.id, x: curX, y: curY, w, h })

    curX += w + gap
  })

  // Dòng ngày giờ & Watermark
  if (showInfoBar) {
    drawInfoBar(pad, totalH - pad - infoH + 8, totalW - pad * 2, infoH - 8)
  }

  // Tao overlay tuong tac cho DOM
  setupOverlays(boxes, totalW, totalH)
}

/** 2. Bo cuc Grid (Luoi 2x2, 3x2, 4x2...) */
function renderGrid() {
  const n = activeItems.length
  let cols = 3
  if (n <= 4) cols = 2
  else if (n > 6) cols = 4

  const rows = Math.ceil(n / cols)
  const cellH = 460
  tl = cellH / 300
  const gap = 16
  const pad = 24
  const infoH = showInfoBar ? Math.round(46 * tl) : 0
  const extraBottom = showInfoBar ? 12 : 0

  // Tinh be rong chuan theo 16:9 trung binh
  const cellW = Math.round(cellH * (16 / 9))

  const totalW = pad * 2 + cols * cellW + (cols - 1) * gap
  const totalH = pad * 2 + rows * cellH + (rows - 1) * gap + infoH + extraBottom

  canvas.width = totalW
  canvas.height = totalH

  ctx.fillStyle = '#090a0d'
  ctx.fillRect(0, 0, totalW, totalH)

  const boxes = []

  activeItems.forEach((item, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const curX = pad + col * (cellW + gap)
    const curY = pad + row * (cellH + gap)

    ctx.save()
    roundRect(ctx, curX, curY, cellW, cellH, 8)
    ctx.clip()

    if (item.imgEl && item.imgEl.complete) {
      // Fit letterbox hoac fill bao dam giu ty le
      const nw = item.imgEl.naturalWidth || 16
      const nh = item.imgEl.naturalHeight || 9
      const aspect = nw / nh
      let drawW = cellW
      let drawH = cellH
      let offX = curX
      let offY = curY

      if (aspect > (cellW / cellH)) {
        drawW = cellW
        drawH = Math.round(cellW / aspect)
        offY = curY + Math.round((cellH - drawH) / 2)
      } else {
        drawH = cellH
        drawW = Math.round(cellH * aspect)
        offX = curX + Math.round((cellW - drawW) / 2)
      }

      ctx.fillStyle = '#050608'
      ctx.fillRect(curX, curY, cellW, cellH)
      ctx.drawImage(item.imgEl, offX, offY, drawW, drawH)
    }

    ctx.restore()

    // Vien
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1.5
    roundRect(ctx, curX, curY, cellW, cellH, 8)
    ctx.stroke()
    ctx.restore()

    // Badge
    if (showShotBadge) {
      drawShotBadge(curX + Math.round(14 * tl), curY + Math.round(14 * tl), idx + 1)
    }

    boxes.push({ id: item.id, x: curX, y: curY, w: cellW, h: cellH })
  })

  // Dòng thông tin footer
  if (showInfoBar) {
    drawInfoBar(pad, totalH - pad - infoH + 8, totalW - pad * 2, infoH - 8)
  }

  setupOverlays(boxes, totalW, totalH)
}

/** Ve badge SHOT 01, SHOT 02... */
function drawShotBadge(x, y, num) {
  const padH = 10 * tl
  const txt = 'SHOT ' + String(num).padStart(2, '0')

  ctx.save()
  ctx.font = 'bold ' + Math.round(13 * tl) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const tw = ctx.measureText(txt).width
  const bw = tw + padH * 2
  const bh = Math.round(24 * tl)

  ctx.fillStyle = 'rgba(9, 10, 13, 0.88)'
  roundRect(ctx, x, y, bw, bh, 5 * tl)
  ctx.fill()

  ctx.strokeStyle = 'rgba(248, 104, 32, 0.5)'
  ctx.lineWidth = 1.2 * tl
  roundRect(ctx, x, y, bw, bh, 5 * tl)
  ctx.stroke()

  ctx.fillStyle = '#f86820'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(txt, x + padH, y + bh / 2 + 0.5)

  ctx.restore()
}

/** Ve thanh thong tin footer */
function drawInfoBar(x, y, w, h) {
  ctx.save()

  // Duong ngan cach phia tren
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  ctx.fillStyle = '#8b8e9f'
  ctx.font = '500 ' + Math.round(12 * tl) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textBaseline = 'middle'

  // Ben trai: AiO Studio Storyboard
  ctx.textAlign = 'left'
  ctx.fillText('AiO STUDIO · STORYBOARD STRIP', x, y + h / 2)

  // Ben phai: Thoi gian xuat
  const d = new Date()
  const p = (v) => String(v).padStart(2, '0')
  const dateStr = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())

  ctx.textAlign = 'right'
  ctx.fillText(dateStr, x + w, y + h / 2)

  ctx.restore()
}

/** Tao overlay cac nut bo shot truc tiep tren viewport */
function setupOverlays(boxes, canvasW, canvasH) {
  overlaysEl.innerHTML = ''
  boxes.forEach((b) => {
    const boxEl = document.createElement('div')
    boxEl.className = 'shot-target-box'
    boxEl.style.left = (b.x / canvasW * 100) + '%'
    boxEl.style.top = (b.y / canvasH * 100) + '%'
    boxEl.style.width = (b.w / canvasW * 100) + '%'
    boxEl.style.height = (b.h / canvasH * 100) + '%'

    const rmBtn = document.createElement('button')
    rmBtn.className = 'shot-remove-btn'
    rmBtn.title = t('sb.boShot')
    rmBtn.innerHTML = '<svg class="ic ic-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'

    rmBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      removeShot(b.id)
    })

    boxEl.appendChild(rmBtn)
    overlaysEl.appendChild(boxEl)
  })
}

/** Bỏ 1 shot khỏi dải ghép */
function removeShot(id) {
  activeItems = activeItems.filter((it) => it.id !== id)
  updateShotBadgeCount()
  render()
}

/* ── Xuat anh ────────────────────────────────────────────────────────── */

async function doCopy() {
  if (activeItems.length === 0) return
  try {
    const { u8 } = await layBanNen()
    const res = await window.storyboard.copy(u8)
    if (res && res.ok) showToast(t('sb.copyThanhCong'))
  } catch (err) {
    console.error('Loi copy:', err)
  }
}

async function doSave() {
  if (activeItems.length === 0) return
  try {
    const { u8 } = await layBanNen()
    const res = await window.storyboard.save(u8)
    if (res && res.ok) {
      showToast(t('sb.luuThanhCong'))
    }
  } catch (err) {
    console.error('Loi save:', err)
  }
}

async function doStartDrag() {
  if (activeItems.length === 0) return
  try {
    const { u8, icon } = await layBanNen()
    window.storyboard.startDrag(u8, icon)
  } catch (err) {
    console.error('Loi drag:', err)
  }
}

/* ── Event Handlers ──────────────────────────────────────────────────── */

btnCopy.addEventListener('click', doCopy)
btnSave.addEventListener('click', doSave)
btnClose.addEventListener('click', () => window.storyboard.close())

// Keo tha ra ngoai
btnDrag.addEventListener('dragstart', (e) => {
  e.preventDefault()
  doStartDrag()
})

canvasWrapper.draggable = true
canvasWrapper.addEventListener('dragstart', (e) => {
  e.preventDefault()
  if (e.target.closest && e.target.closest('.shot-remove-btn')) return
  doStartDrag()
})

// Chuyen layout
btnFilmstrip.addEventListener('click', () => {
  if (currentLayout === 'filmstrip') return
  currentLayout = 'filmstrip'
  btnFilmstrip.classList.add('active')
  btnGrid.classList.remove('active')
  render()
})

btnGrid.addEventListener('click', () => {
  if (currentLayout === 'grid') return
  currentLayout = 'grid'
  btnGrid.classList.add('active')
  btnFilmstrip.classList.remove('active')
  render()
})

// Toggles
chkShotBadge.addEventListener('change', (e) => {
  showShotBadge = e.target.checked
  render()
})

chkInfoBar.addEventListener('change', (e) => {
  showInfoBar = e.target.checked
  render()
})

// Phim tat
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    window.storyboard.close()
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault()
    doCopy()
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    doSave()
  } else if (e.key === '1') {
    btnFilmstrip.click()
  } else if (e.key === '2') {
    btnGrid.click()
  }
})

// Khoi chay
init()
