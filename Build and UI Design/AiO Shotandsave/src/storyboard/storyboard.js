'use strict'

/* =========================================================================
   AiO Shot & Save — KHAY STORYBOARD (29/09)
   Anh Tien: "moi mot shot stripe la mot hang va anh co the xoa di cac anh trong tung stripe" +
   "anh chup thuong chi view o khay anh thuong, khong cho vao khay stripe" (2 khay, 2 tac vu rieng).
   - Danh sach DAI trong kho (main: src/kho-dai.js, giu lai sau khi tat app), MOI NHAT o tren. Moi dai = 1 hang,
     khung trai deu be ngang; re chuot vao khung -> nut x bo khung (giu SO GOC SHOT, anh chon).
   - Moi hang: Keo · Luu PNG · Sao chep · Xoa dai (bam 2 lan). Anh xuat LUON dang LUOI (anh bo hang 'Xuat dang').
   - Anh XUAT van ve bang canvas (renderFilmstrip / renderGrid) — canvas chay AN, chi dung khi Luu/Sao chep/Keo.
     Khung nap qua aioshot://dai/... (main tra ACAO) + crossOrigin -> canvas khong bi taint.
   ========================================================================= */

const t = (k, params) => window.i18n ? window.i18n.t(k, params) : k

const canvas = document.getElementById('main-canvas')
const ctx = canvas.getContext('2d', { alpha: false })
const dsEl = document.getElementById('ds-dai')
const trongEl = document.getElementById('trong')
const badgeCountEl = document.getElementById('shot-badge')
const toastEl = document.getElementById('toast')

const btnClose = document.getElementById('btn-close')

let dais = []          // [{ id, taoLuc, khung: [{ seq, w, h, url, imgEl }] }]
let activeItems = []   // khung cua dai DANG XUAT (renderFilmstrip / renderGrid doc bien nay)
// 29/09 anh: XOA hang 'Xuat dang', anh xuat LUON la LUOI (renderFilmstrip giu lai, chua dung)
const currentLayout = 'grid'
const showShotBadge = true
const showInfoBar = false
let toastTimer = null
/* [ra 28/09] ti le chu/nhan theo co khung: 720px (dai) -> x2.4, 460px (luoi) -> x1.53. */
let tl = 1

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

const ICON = {
  xoa: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
}

/** Nap du lieu tu main: danh sach dai + dai vua quay (tu luu PNG dung 1 lan) */
async function init() {
  let data = null
  try {
    data = await window.storyboard.getData()
  } catch (err) {
    console.error('Loi khoi tao khay Storyboard:', err)
  }
  dais = (data && data.dais) || []
  await Promise.all(dais.flatMap((d) => d.khung.map(napAnh)))
  veDanhSach()
  if (dais[0]) chuanBiKeo(dais[0]) // dai moi nhat thuong la dai se gui di -> ve san ngay khi mo
  if (data && data.tuLuu && data.moiId) {
    const d = dais.find((x) => x.id === data.moiId)
    if (d && await xuatDai(d, 'luu', true)) showToast(t('sb.daLuuTu'))
  }
}

function napAnh(k) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // aioshot:// tra ACAO:* -> canvas xuat khong bi taint
    img.onload = () => { k.imgEl = img; resolve() }
    img.onerror = () => { console.error('Khong nap duoc khung ' + k.url); resolve() }
    img.src = k.url
  })
}

function capNhatDem() {
  badgeCountEl.textContent = String(dais.length)
  trongEl.hidden = dais.length > 0
}

function gio(iso) {
  const d = new Date(iso)
  const p = (v) => String(v).padStart(2, '0')
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ' · ' + p(d.getDate()) + '/' + p(d.getMonth() + 1)
}

/** Ve lai toan bo danh sach (moi dai 1 hang) */
function veDanhSach() {
  dsEl.textContent = ''
  dais.forEach((d, i) => dsEl.appendChild(taoHang(d, dais.length - i)))
  capNhatDem()
}

function nut(cls, chu, title) {
  const b = document.createElement('button')
  b.className = cls
  if (chu) b.textContent = chu
  if (title) { b.title = title; b.setAttribute('aria-label', title) }
  return b
}

function taoHang(d, so) {
  const hang = document.createElement('section')
  hang.className = 'dai'
  hang.dataset.id = d.id

  const dau = document.createElement('div')
  dau.className = 'dai-dau'
  const ten = document.createElement('span')
  ten.className = 'dai-ten'
  ten.textContent = 'Storyboard ' + String(so).padStart(2, '0')
  const meta = document.createElement('span')
  meta.className = 'dai-meta'
  meta.textContent = gio(d.taoLuc) + ' · ' + t('sb.khungDem', { n: String(d.khung.length) })
  const spacer = document.createElement('span')
  spacer.className = 'spacer'

  /* 29/09 anh: "click and drag CA MOT CUON tha vao phan mem" -> CA HANG la nguon keo (nut Keo van giu, no nam
     trong hang nen keo tu nut cung chay). Anh xuat duoc VE SAN khi re chuot vao hang (chuanBiKeo) nen luc dragstart
     main goi startDrag NGAY — truoc day ve canvas + toBlob SAU dragstart, cu keo tre (goc "khong da"). */
  hang.draggable = true
  hang.addEventListener('pointerenter', () => chuanBiKeo(d))
  hang.addEventListener('dragstart', (e) => {
    e.preventDefault()
    hang.classList.add('dang-keo')
    setTimeout(() => hang.classList.remove('dang-keo'), 400)
    keoDai(d)
  })
  const bKeo = nut('nut', t('sb.keoNut'), t('sb.keo'))
  const bLuu = nut('nut', t('sb.luuNut'), t('sb.luu'))
  bLuu.addEventListener('click', async () => { if (await xuatDai(d, 'luu')) showToast(t('sb.luuThanhCong')) })
  const bChep = nut('nut chinh', t('sb.copyNut'), t('sb.copy'))
  bChep.addEventListener('click', async () => { if (await xuatDai(d, 'chep')) showToast(t('sb.copyThanhCong')) })
  const bXoa = nut('nut icon', '', t('sb.xoaDai'))
  bXoa.innerHTML = ICON.xoa
  // Xoa dai = bam 2 lan (lan 1 doi chu 3 giay) — viec kho dao nguoc, nut noi hau qua trong title
  let choXoa = null
  bXoa.addEventListener('click', async () => {
    if (!choXoa) {
      bXoa.classList.add('xac-nhan'); bXoa.textContent = t('sb.xoaDaiXacNhan')
      choXoa = setTimeout(() => { choXoa = null; bXoa.classList.remove('xac-nhan'); bXoa.innerHTML = ICON.xoa }, 3000)
      return
    }
    clearTimeout(choXoa); choXoa = null
    const r = await window.storyboard.xoaDai(d.id)
    if (r && r.ok) {
      dais = dais.filter((x) => x.id !== d.id)
      veDanhSach()
      showToast(t('sb.daXoaDai'))
    }
  })

  dau.append(ten, meta, spacer, bKeo, bLuu, bChep, bXoa)

  const luoi = document.createElement('div')
  luoi.className = 'khung6'
  luoi.title = t('sb.keoDai')
  luoi.style.setProperty('--cot', String(Math.max(6, d.khung.length)))
  d.khung.forEach((k) => {
    const o = document.createElement('div')
    o.className = 'k'
    if (k.w && k.h) o.style.aspectRatio = k.w + ' / ' + k.h
    const img = document.createElement('img')
    img.src = k.url
    img.alt = ''
    img.draggable = false
    const nhan = document.createElement('b')
    nhan.textContent = 'SHOT ' + String(k.seq).padStart(2, '0')
    const bo = nut('bo', '', t('sb.boShot'))
    bo.innerHTML = ICON.x
    bo.addEventListener('click', async (e) => {
      e.stopPropagation()
      const r = await window.storyboard.boKhung(d.id, k.seq)
      if (!r || !r.ok) return
      d.khung = d.khung.filter((x) => x.seq !== k.seq)
      if (!d.khung.length) dais = dais.filter((x) => x.id !== d.id) // main da xoa dai khi het khung
      veDanhSach()
    })
    o.append(img, nhan, bo)
    luoi.appendChild(o)
  })

  hang.append(dau, luoi)
  return hang
}

/* ── KEO CA DAI (29/09) ──────────────────────────────────────────────────────
   Electron startDrag phai goi trong NHIP dragstart that (xem main pin:start-drag). Ve canvas + toBlob mat hang
   tram ms, nen VE SAN: re chuot vao hang (va dai moi nhat luc mo) -> gui byte PNG sang main giu san. dragstart chi
   gui id -> main ghi file (neu chua co) + startDrag ngay. `ver` = danh sach seq: bo 1 khung la ve lai. */
const daVe = new Map()   // id -> { ver, xong: Promise<boolean> }
let hangDoiVe = Promise.resolve() // canvas + activeItems dung chung -> ve LAN LUOT
const verCua = (d) => d.khung.map((k) => k.seq).join('-')

function chuanBiKeo(d) {
  const ver = verCua(d)
  const cu = daVe.get(d.id)
  if (cu && cu.ver === ver) return cu.xong
  const xong = hangDoiVe = hangDoiVe.then(async () => {
    const t0 = performance.now()
    activeItems = d.khung.filter((k) => k.imgEl)
    if (!activeItems.length) return false
    render()
    const { u8, icon } = await layBanNen()
    const r = await window.storyboard.chuanBiKeo(d.id, ver, u8, icon, Math.round(performance.now() - t0))
    return !!(r && r.ok)
  }).catch((err) => { console.error('Loi ve san dai de keo:', err); return false })
  daVe.set(d.id, { ver, xong })
  return xong
}

function keoDai(d) {
  // Da ve xong -> then chay ngay (vi nhiem) -> main startDrag trong vai ms. Chua xong (keo ngay khi vua re chuot
  // vao) -> cho ve xong roi moi keo: cham nhu cach cu nhung van chay (Windows con giu chuot thi van keo duoc).
  const ver = verCua(d)
  chuanBiKeo(d).then((ok) => { if (ok) window.storyboard.keoDai(d.id, ver) })
}

/** Xuat 1 dai: ve canvas an theo "Xuat dang" roi luu / chep. Tra ve true neu xong. */
function xuatDai(d, viec, im) {
  // Chung hang doi voi ve-san-de-keo: canvas + activeItems dung chung, ve chen nhau la xuat nham dai
  const xong = hangDoiVe.then(() => xuatDaiNgay(d, viec, im))
  hangDoiVe = xong.catch(() => false)
  return xong
}
async function xuatDaiNgay(d, viec, im) {
  activeItems = d.khung.filter((k) => k.imgEl)
  if (!activeItems.length) return false
  render()
  try {
    const { u8 } = await layBanNen()
    const res = viec === 'chep' ? await window.storyboard.copy(u8) : await window.storyboard.save(u8)
    return !!(res && res.ok)
  } catch (err) {
    if (!im) console.error('Loi xuat dai (' + viec + '):', err)
    return false
  }
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

/** Ve anh XUAT cua dai dang chon (activeItems) len canvas an */
function render() {
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
  const hIcon = 120, wIcon = Math.max(1, Math.round(canvas.width * hIcon / canvas.height))
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

  ctx.fillStyle = '#090a0d'
  ctx.fillRect(0, 0, totalW, totalH)

  let curX = pad
  const curY = pad

  frames.forEach((f) => {
    const { item, w, h } = f

    ctx.save()
    roundRect(ctx, curX, curY, w, h, 8)
    ctx.clip()
    if (item.imgEl && item.imgEl.complete) {
      ctx.drawImage(item.imgEl, curX, curY, w, h)
    }
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1.5
    roundRect(ctx, curX, curY, w, h, 8)
    ctx.stroke()
    ctx.restore()

    // Nhan SHOT theo SO GOC (29/09 anh chon "Giu so goc": bo SHOT 03 thi con 01, 02, 04...)
    if (showShotBadge) {
      drawShotBadge(curX + Math.round(14 * tl), curY + Math.round(14 * tl), item.seq)
    }

    curX += w + gap
  })

  if (showInfoBar) {
    drawInfoBar(pad, totalH - pad - infoH + 8, totalW - pad * 2, infoH - 8)
  }
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

  const cellW = Math.round(cellH * (16 / 9))

  const totalW = pad * 2 + cols * cellW + (cols - 1) * gap
  const totalH = pad * 2 + rows * cellH + (rows - 1) * gap + infoH + extraBottom

  canvas.width = totalW
  canvas.height = totalH

  ctx.fillStyle = '#090a0d'
  ctx.fillRect(0, 0, totalW, totalH)

  activeItems.forEach((item, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const curX = pad + col * (cellW + gap)
    const curY = pad + row * (cellH + gap)

    ctx.save()
    roundRect(ctx, curX, curY, cellW, cellH, 8)
    ctx.clip()

    if (item.imgEl && item.imgEl.complete) {
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

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1.5
    roundRect(ctx, curX, curY, cellW, cellH, 8)
    ctx.stroke()
    ctx.restore()

    if (showShotBadge) {
      drawShotBadge(curX + Math.round(14 * tl), curY + Math.round(14 * tl), item.seq)
    }
  })

  if (showInfoBar) {
    drawInfoBar(pad, totalH - pad - infoH + 8, totalW - pad * 2, infoH - 8)
  }
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  ctx.fillStyle = '#8b8e9f'
  ctx.font = '500 ' + Math.round(12 * tl) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('AiO STUDIO · STORYBOARD STRIP', x, y + h / 2)

  const d = new Date()
  const p = (v) => String(v).padStart(2, '0')
  const dateStr = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
  ctx.textAlign = 'right'
  ctx.fillText(dateStr, x + w, y + h / 2)
  ctx.restore()
}

/* ── Event Handlers ──────────────────────────────────────────────────── */

btnClose.addEventListener('click', () => window.storyboard.close())

// Phim tat: Esc dong · Ctrl+C / Ctrl+S = dai MOI NHAT
window.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    window.storyboard.close()
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault()
    if (dais[0] && await xuatDai(dais[0], 'chep')) showToast(t('sb.copyThanhCong'))
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    if (dais[0] && await xuatDai(dais[0], 'luu')) showToast(t('sb.luuThanhCong'))
  }
})

init()
