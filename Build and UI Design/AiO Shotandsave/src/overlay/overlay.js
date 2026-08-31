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
let frozenImg = null      // anh dong bang cua CHINH man nay (de ghep shape)
let origin = { x: 0, y: 0 } // goc DIP toan cuc cua man nay
let layers = []           // anh dong bang MOI man: { img, x, y, w, h, sf } (DIP toan cuc)
let layersReady = false
let pendingComposite = null // vung cho ghep neu grab chua xong
let biKhoa = false          // man KHAC dang keo -> man nay bo qua chuot
let soLanThuGhep = 0        // dem retry cho ghep xuyen man

/* ── Nhan tin tu main ─────────────────────────────────────────────────── */
window.overlay.onInit((data) => {
  if (data && data.origin) origin = data.origin
  if (data && data.selftest) setTimeout(autoSelftest, 1600)
})
// ☠️ DAO QUYET DINH 25/08 ("khong dan anh dong bang" vi lech/taskbar 2 lan):
// tu 31/08 PHAI DAN LAI anh cua CHINH man nay lam nen (freeze view). Ly do:
// video tang toc phan cung (YouTube/TikTok) nhin XUYEN cua so trong suot ra
// MANG DEN — lop video (MPO) khong duoc ve duoi cua so layered; anh Tien bao
// 31/08 "bam chup thi vung YouTube den, chup xong lai thay hinh". Anh WGC
// grab CO hinh video -> dan lam nen la vung do hien lai (dong bang tai thoi
// diem grab — dung nghia chup, nhu Snipping Tool). Bay cu "taskbar 2 lan"
// la do anh dan KHONG KHOP man; nay chi dan anh own (cung he quy chieu voi
// chinh cua so nay, phu inset:0, keo 100%/100%) — khong con nguon lech.
// Van nhan anh cua MOI man de ghep duoc vung VAT NGANG 2 man.
window.overlay.onFrozen((data) => {
  const list = (data && data.layers) || []
  if (!list.length) return
  let loaded = 0
  const news = []
  const xongTai = () => {
    loaded++
    if (loaded < list.length) return
    layers = news
    layersReady = true
    const own = layers.find((L) => L.x === origin.x && L.y === origin.y)
    frozenImg = own ? own.img : null
    /* decode() XONG roi moi dan + fade (.co-anh) — dan anh 4K chua giai nen
       la renderer khung mot nhip dung luc chuyen canh, cang them "giut". */
    if (own) {
      const dan = () => {
        /* Ve anh dung KICH THUOC MAN (anh that / sf), neo goc tren-trai —
           KHONG keo 100% theo cua so: cua so co the du 1-2px (setBounds tren
           man DPI le) ma anh thi phai khop MAN, khong la lech taskbar. Do
           anh THAT (naturalWidth) roi chia sf, khong tin pw/ph (bay cu). */
        shotEl.style.backgroundSize =
          (own.img.naturalWidth / own.sf) + 'px ' + (own.img.naturalHeight / own.sf) + 'px'
        shotEl.style.backgroundPosition = '0 0'
        shotEl.style.backgroundImage = "url('" + own.img.src + "')"
        requestAnimationFrame(() => shotEl.classList.add('co-anh'))
      }
      if (own.img.decode) own.img.decode().then(dan, dan)
      else dan()
    }
    if (pendingComposite) { const g = pendingComposite; pendingComposite = null; confirmComposite(g) }
  }
  for (const L of list) {
    const im = new Image()
    im.onload = xongTai
    im.onerror = xongTai
    im.src = L.dataUrl
    news.push({ img: im, x: L.x, y: L.y, w: L.w, h: L.h, sf: L.sf,
                px: L.px, py: L.py, pw: L.pw, ph: L.ph })
  }
})

window.overlay.onLocked(() => { biKhoa = true })

/* VE VUNG CHON — thong nhat cho MOI man, du lieu tu MAIN ('overlay:sel-rect',
   DIP toan cuc, dung moi scale/DPI). Man co phan giao: khung cam + 4 tam mo;
   khong giao: dim thuong. laChu: hien nhan kich thuoc. ☠️ KHONG dung box-shadow
   duc lo (100vmax hut giua man -> vet sang/toi, vap 25/08). */
const guongEl = document.getElementById('guong')
const gT = document.getElementById('g-t'), gB = document.getElementById('g-b')
const gL = document.getElementById('g-l'), gR = document.getElementById('g-r')
const gKhung = document.getElementById('g-khung')
const gSize = document.getElementById('g-size')

function datPx(el, x, y, w, h) {
  el.style.left = x + 'px'; el.style.top = y + 'px'
  el.style.width = Math.max(0, w) + 'px'; el.style.height = Math.max(0, h) + 'px'
}

function xoaGuong() {
  guongEl.hidden = true
  gSize.hidden = true
  dimEl.style.display = ''
}

/* Ve khung + 4 tam mo cho vung [ix,iy]..[ix2,iy2] (DIP cuc bo, DA clamp). */
function veGuongKhung(ix, iy, ix2, iy2) {
  const W = window.innerWidth, H = window.innerHeight
  dimEl.style.display = 'none'
  guongEl.hidden = false
  datPx(gT, 0, 0, W, iy)
  datPx(gB, 0, iy2, W, H - iy2)
  datPx(gL, 0, iy, ix, iy2 - iy)
  datPx(gR, ix2, iy, W - ix2, iy2 - iy)
  datPx(gKhung, ix, iy, Math.max(0, ix2 - ix - 2), Math.max(0, iy2 - iy - 2))
}

window.overlay.onSelRect((d) => {
  if (mode === 'annotate') return // dang ve thi giu nguyen khung annotate
  /* ☠️ RUNG KHI KEO (anh Tien 31/08 "lag vai"): man CHU dang keo thi khung do
     mousemove LOCAL ve (toa do TUOI). Main ban sel-rect moi 16ms mang toa do
     chuot CU toi 16ms -> ve de len lam khung giat toi-lui. Bo redraw tu main
     cho man chu khi dang keo — local lo het (frame + nhan kich thuoc). Cac man
     KHAC (mirror) van dung main vi khong co chuot local. */
  if (dragging && d && d.laChu) return
  const W = window.innerWidth, H = window.innerHeight
  if (!d) { xoaGuong(); hintEl.classList.remove('hidden'); return }
  hintEl.classList.add('hidden')
  // d.x/y/w/h da la CUC BO (DIP man nay) do main quy doi tu PIXEL VAT LY.
  const ix = Math.max(0, d.x), iy = Math.max(0, d.y)
  const ix2 = Math.min(W, d.x + d.w), iy2 = Math.min(H, d.y + d.h)
  if (ix2 <= ix || iy2 <= iy) { xoaGuong(); return } // khong giao: dim thuong
  veGuongKhung(ix, iy, ix2, iy2)
  if (d.laChu) {
    gSize.hidden = false
    // hien kich thuoc theo PIXEL VAT LY — dung voi thu se luu ra file
    gSize.textContent = Math.round(d.physW) + ' × ' + Math.round(d.physH)
    gSize.style.left = ix + 'px'
    gSize.style.top = (iy >= 26 ? iy - 24 : iy + 4) + 'px'
  } else {
    gSize.hidden = true
  }
})

/* Vung nam tron man nay -> vao che do VE (rect cuc bo tu main). */
window.overlay.onAnnotate((rect) => {
  curRect = { x: Math.round(rect.x), y: Math.round(rect.y),
              w: Math.round(rect.w), h: Math.round(rect.h) }
  rect = curRect
  xoaGuong()
  dimEl.style.display = 'none'
  selEl.hidden = false
  selEl.style.left = rect.x + 'px'; selEl.style.top = rect.y + 'px'
  selEl.style.width = rect.w + 'px'; selEl.style.height = rect.h + 'px'
  sizeEl.textContent = rect.w + ' × ' + rect.h
  sizeEl.classList.toggle('inside', rect.y < 28)
  vaoCheDoVe()
})

/* Vung vat ngang nhieu man -> ghep (rect DIP toan cuc tu main). */
window.overlay.onComposite((rect) => {
  soLanThuGhep = 0
  confirmComposite(rect)
})

/* ── Chon vung ────────────────────────────────────────────────────────── */
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (biKhoa) return // man khac dang giu quyen keo
  window.overlay.lock()
  if (mode === 'annotate') { batDauVe(e); return }
  dragging = true
  startX = e.clientX; startY = e.clientY // neo local cho ve-ngay (31/08)
  hintEl.classList.add('hidden')
  // MAIN theo doi chuot he thong (dung moi scale) va phat 'sel-rect' ve.
  window.overlay.dragStart()
})

window.addEventListener('mousemove', (e) => {
  if (mode === 'annotate') { veDangKeo(e); return }
  /* ☠️ MAN CHU ve khung NGAY tai day, khong doi vong chuot->main->IPC->ve.
     Truoc 31/08 khung CHI ve khi main phat 'sel-rect' (interval 16ms) — ma
     main hay ban (getSources chan ~1s ngay luc moi mo overlay, dung luc
     nguoi dung bat dau keo) nen khung dung hinh tung nhip, anh Tien ta
     "giat nhu game drop fps". Toa do local (clientX, DIP man nay) voi diem
     chuot tren CHINH man nay trung khop so cua main quy doi, nen hai nguon
     ve de len nhau khong lech; main van lo nhan kich thuoc phys + guong
     sang man kia + CHOT vung luc tha (logic luu anh khong doi). */
  if (dragging) {
    const x1 = Math.max(0, Math.min(startX, e.clientX))
    const y1 = Math.max(0, Math.min(startY, e.clientY))
    const x2 = Math.min(window.innerWidth, Math.max(startX, e.clientX))
    const y2 = Math.min(window.innerHeight, Math.max(startY, e.clientY))
    veGuongKhung(x1, y1, x2, y2)
    // Nhan kich thuoc LOCAL luon (phys = DIP × DPR) — man chu single-source,
    // khong doi main gui (het rung). Man chinh sf 1.5 -> DPR 1.5, khop phys main.
    gSize.hidden = false
    gSize.textContent = Math.round((x2 - x1) * DPR) + ' × ' + Math.round((y2 - y1) * DPR)
    gSize.style.left = x1 + 'px'
    gSize.style.top = (y1 >= 26 ? y1 - 24 : y1 + 4) + 'px'
  }
})

window.addEventListener('mouseup', (e) => {
  if (mode === 'annotate') { ketThucVe(e); return }
  if (!dragging) return
  dragging = false
  window.overlay.dragEnd() // main chot vung + dieu phoi (annotate/composite/huy)
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
  const lx = e.clientX - curRect.x, ly = e.clientY - curRect.y
  if (lx < 0 || ly < 0 || lx > curRect.w || ly > curRect.h) {
    // Bam RA NGOAI vung = bo vung cu, quet vung MOI ngay (nhu Lightshot —
    // anh Tien 25/08). Trong vung thi ve shape nhu thuong.
    chonLaiTuDau(e)
    return
  }
  veStart = { x: lx, y: ly }
}

/* Bo vung chon + shape dang co, quay ve che do quet vung — bat dau keo ngay. */
function chonLaiTuDau(e) {
  mode = 'select'
  shapes = []
  veStart = null
  if (veCtx) veCtx.clearRect(0, 0, curRect.w, curRect.h)
  veEl.hidden = true
  toolbarEl.hidden = true
  selEl.hidden = true
  dragging = true
  startX = e.clientX; startY = e.clientY // neo local cho ve-ngay (31/08)
  window.overlay.dragStart() // main theo doi tu vi tri chuot hien tai
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

/* GHEP vung chon (DIP toan cuc) tu anh dong bang cua CAC man giao voi no.
   Thang do dau ra = sf LON NHAT trong cac man giao (giu net man 4K). */
function confirmComposite(g) {
  // ☠️ Chi ghep khi anh cua MOI man giao da NAP XONG THAT (complete +
  // naturalWidth>0). Truoc day chi cho layersReady — anh hong/chua nap van
  // "xong" (onerror cung dem) -> drawImage im lang khong ve gi -> anh TRANG
  // TRON 590 byte (anh Tien 26/08). Chua san sang: thu lai 200ms, toi da 15 lan.
  const giao = layers.filter((L) => giaoNhau(g, { x: L.px, y: L.py, w: L.pw, h: L.ph }))
  const sanSang = layersReady && giao.length > 0 &&
    giao.every((L) => L.img && L.img.complete && L.img.naturalWidth > 0)
  if (!sanSang) {
    if (!layersReady) { pendingComposite = g; window.overlay.log('composite CHO grab'); return }
    if (soLanThuGhep < 15) {
      soLanThuGhep++
      window.overlay.log('composite thu lai lan ' + soLanThuGhep + ' (ready=' + layersReady + ' giao=' + giao.length + ')')
      setTimeout(() => confirmComposite(g), 200)
      return
    }
    // Het duong: cat phan nam trong MAN NAY (con hon tra anh trang).
    // g la PHYS -> quy ve DIP cuc bo bang DPR cua chinh man nay.
    window.overlay.log('composite FALLBACK ve rect man nay')
    const own = layers.find((L) => L.x === origin.x && L.y === origin.y)
    const opx = own ? own.px : 0, opy = own ? own.py : 0
    const lx = Math.max(0, (g.x - opx) / DPR), ly = Math.max(0, (g.y - opy) / DPR)
    const lw = Math.min(window.innerWidth, (g.x + g.w - opx) / DPR) - lx
    const lh = Math.min(window.innerHeight, (g.y + g.h - opy) / DPR) - ly
    window.overlay.confirm({ rect: { x: lx, y: ly, w: Math.max(1, lw), h: Math.max(1, lh) } })
    return
  }
  try {
    // ☠️ GHEP THEO PIXEL VAT LY, moi man dan 1:1 anh goc (nhu Snipping Tool).
    // Truoc ghep theo DIP: 2 man khac scale (150%/125%) la mot ben bi phong to
    // -> "chua dung ti le" (anh Tien 26/08). g o day la rect PHYS tu main.
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.round(g.w))
    cv.height = Math.max(1, Math.round(g.h))
    const ctx = cv.getContext('2d')
    ctx.imageSmoothingEnabled = false
    for (const L of giao) {
      const ix = Math.max(g.x, L.px), iy = Math.max(g.y, L.py)
      const ix2 = Math.min(g.x + g.w, L.px + L.pw), iy2 = Math.min(g.y + g.h, L.py + L.ph)
      if (ix2 <= ix || iy2 <= iy) continue
      // ☠️ desktopCapturer co the tra anh KHONG dung co native (scale theo
      // thumbnailSize) — do anh THAT roi quy doi, dung gia dinh.
      const kx = L.img.naturalWidth / L.pw, ky = L.img.naturalHeight / L.ph
      ctx.drawImage(L.img,
        (ix - L.px) * kx, (iy - L.py) * ky, (ix2 - ix) * kx, (iy2 - iy) * ky,
        ix - g.x, iy - g.y, ix2 - ix, iy2 - iy)
    }
    window.overlay.log('composite OK ' + cv.width + 'x' + cv.height + ' (phys 1:1) tu ' + giao.length + ' man')
    window.overlay.confirm({ dataUrl: cv.toDataURL('image/png') })
  } catch (err) {
    window.overlay.log('composite LOI: ' + err.message)
    window.overlay.cancel()
  }
}

function giaoNhau(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
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
