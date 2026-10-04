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
const selStoryboardBtn = document.getElementById('sel-storyboard-btn')
const hintEl = document.getElementById('hint')
const veEl = document.getElementById('ve')
const toolbarEl = document.getElementById('toolbar')

let isStoryboardMode = false

function toggleStoryboardMode(force) {
  isStoryboardMode = typeof force === 'boolean' ? force : !isStoryboardMode
  // 29/09: animation bao dang o che do Storyboard (CSS #sel.sb). Go class + doc offsetWidth = chay lai tu dau moi lan bat.
  selEl.classList.remove('sb')
  if (isStoryboardMode) {
    void selEl.offsetWidth
    const r = typeof curRect !== 'undefined' && curRect ? curRect : null
    selEl.classList.toggle('sb-nho', !!r && (r.w < 240 || r.h < 70))
    selEl.classList.add('sb')
  }
  if (selStoryboardBtn) {
    selStoryboardBtn.classList.toggle('active', isStoryboardMode)
  }
  const sbBtn = toolbarEl.querySelector('.cong-cu[data-tool="storyboard"]')
  if (sbBtn) {
    sbBtn.classList.toggle('chon', isStoryboardMode)
  }
}

if (selStoryboardBtn) {
  selStoryboardBtn.addEventListener('mousedown', (e) => e.stopPropagation())
  selStoryboardBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    toggleStoryboardMode()
  })
}

const t = (k) => window.i18n.t(k)

// Dich text + tooltip.
document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  el.title = t(el.getAttribute('data-i18n-title')); el.setAttribute('aria-label', el.title)
})

const DPR = window.devicePixelRatio || 1
const MAU = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f86820'

let mode = 'select'       // 'select' | 'annotate'
let tool = 'rect'         // 'select' | 'rect' | 'arrow' | 'text' | 'blur' | 'so'
let curColor = '#f86820'  // mac dinh CAM (accent). Doi qua bang mau.
let curBlurType = 'mosaic' // 'mosaic' (Kham o) | 'blur' (Mo min) | 'kin' (To kin, 04/10)
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
let lanVeLocal = 0          // moc lan cuoi mousemove LOCAL ve khung (nhuong/gianh voi main)

/* ── Nhan tin tu main ─────────────────────────────────────────────────── */
let cheDoTest = {}
window.overlay.onInit((data) => {
  if (data && data.origin) origin = data.origin
  if (data && data.lamMoKieu) curBlurType = data.lamMoKieu
  if (data) cheDoTest = data
  if (data && data.selftest) setTimeout(autoSelftest, 1600)
})

/* ── 01/10 QUAY VIDEO: nut Quay / phim R = quay NGAY vung dang chon toi khi bam Dung ──────────────────────
   Net ve (neu co) khong ap len video dang chay -> chi gui vung. Main dong overlay, dung vien cam + dong ho + nut Dung
   NGOAI vung, quay MP4 LUON co tieng may, xong mo Khay video. Chon "Co tieng / Khong tieng" nam trong Khay video
   (anh chot 01/10 10:4x: bo nut loa tren thanh nay, "vao khay roi cho nguoi dung chon ... se do thao tac hon"). */
function quayVideo() {
  chotOGoChu()
  window.overlay.log('quay video ' + curRect.w + 'x' + curRect.h)
  window.overlay.confirm({ rect: curRect, quay: true })
}
if (window.overlay.onUpdateConfig) {
  window.overlay.onUpdateConfig((data) => {
    if (data && data.lamMoKieu) {
      curBlurType = data.lamMoKieu
      redraw()
    }
  })
}
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
           anh THAT (naturalWidth) roi chia sf, khong tin pw/ph (bay cu).
           Dan bang CHINH the <img> da decode (khong CSS background): background
           la request no-CORS — cache key KHAC voi Image crossOrigin -> tai +
           decode anh 5K2K lan HAI ngay giua luc keo (may nha 31/08). */
        own.img.style.width = (own.img.naturalWidth / own.sf) + 'px'
        own.img.style.height = (own.img.naturalHeight / own.sf) + 'px'
        shotEl.replaceChildren(own.img)
        requestAnimationFrame(() => shotEl.classList.add('co-anh'))
      }
      if (own.img.decode) own.img.decode().then(dan, dan)
      else dan()
    }
    if (pendingComposite) { const g = pendingComposite; pendingComposite = null; confirmComposite(g) }
  }
  for (const L of list) {
    const im = new Image()
    /* Anh nap tu aioshot:// (buffer o main) thay vi dataURL base64 ~15-25MB
       qua IPC — chinh chuoi do lam renderer nghen giua luc keo (may nha 31/08).
       crossOrigin + ACAO tu protocol de canvas ghep (xong/composite) khong
       bi taint -> toDataURL van chay. */
    im.crossOrigin = 'anonymous'
    im.draggable = false
    im.onload = xongTai
    im.onerror = xongTai
    im.src = L.url
    news.push({ img: im, key: L.key, x: L.x, y: L.y, w: L.w, h: L.h, sf: L.sf,
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
  const W = window.innerWidth, H = window.innerHeight
  if (!d) { xoaGuong(); hintEl.classList.remove('hidden'); return }
  hintEl.classList.add('hidden') // an hint NGAY (dung TRUOC early-return duoi)
  /* ☠️ RUNG KHI KEO (31/08 "lag vai"): man CHU dang keo thi khung do mousemove
     LOCAL ve (toa do TUOI); main ban sel-rect moi 16ms mang toa do CU 16ms —
     ve de len la khung giat toi-lui. -> local dang HOAT DONG thi bo goi main.
     ☠️ NHUNG chi "dragging" thoi KHONG du (31/08 lan 3 — anh Tien: "keo mot
     cho no NHAY mot cho"): chuot keo RA KHOI man nay (vat sang man kia) la
     mousemove NGUNG BAN (khong co pointer capture), local im — chan main luon
     thi khung DUNG HINH o vi tri cu roi NHAY khi chuot quay lai. Luat dung:
     local vua ve trong 50ms thi main nhuong; local im (chuot ngoai man) thi
     MAIN TIEP QUAN. */
  if (dragging && d.laChu && performance.now() - lanVeLocal < 50) return
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
  xoaGuong()
  dimEl.style.display = 'none'
  selEl.hidden = false
  capNhatGiaoDienKhung()
  vaoCheDoVe()
})

/* Vung vat ngang nhieu man -> ghep (rect DIP toan cuc tu main). */
window.overlay.onComposite((rect) => {
  soLanThuGhep = 0
  confirmComposite(rect)
})

/* ── Chinh sua co va vi tri khung da chon (8 tay nam + keo vien) ──────── */
let isAdjusting = false
let adjustType = null // 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'move'
let adjustStartMouse = { x: 0, y: 0 }
let adjustStartRect = { x: 0, y: 0, w: 0, h: 0 }

selEl.addEventListener('mousedown', (e) => {
  if (mode !== 'annotate') return
  if (e.button !== 0) return
  if (e.target.closest('#sel-storyboard-btn')) return
  const handle = e.target.closest('.sel-handle')
  const edge = e.target.closest('.sel-edge')
  const size = e.target.closest('#size')
  if (!handle && !edge && !size) return
  e.stopPropagation()
  e.preventDefault()
  chotOGoChu()
  isAdjusting = true
  if (handle) {
    adjustType = handle.dataset.handle
  } else if (edge) {
    adjustType = edge.dataset.edge
  } else {
    adjustType = 'move'
  }
  adjustStartMouse = { x: e.clientX, y: e.clientY }
  adjustStartRect = { ...curRect }
  toolbarEl.style.opacity = '0.3'
  toolbarEl.style.pointerEvents = 'none'
})

function capNhatGiaoDienKhung() {
  selEl.style.left = curRect.x + 'px'
  selEl.style.top = curRect.y + 'px'
  selEl.style.width = curRect.w + 'px'
  selEl.style.height = curRect.h + 'px'
  sizeEl.textContent = Math.round(curRect.w * DPR) + ' × ' + Math.round(curRect.h * DPR)
  sizeEl.classList.toggle('inside', curRect.y < 28)
  if (selStoryboardBtn) {
    selStoryboardBtn.classList.toggle('inside', curRect.y < 28)
    // Khung hep: nut chong len nhan kich thuoc (cung hang, left 0 / right 0). Do be rong THAT roi
    // bo chu (con icon + S), van chong thi an han (nut duoi toolbar + phim S van dung duoc).
    selStoryboardBtn.classList.remove('gon', 'an')
    const du = () => sizeEl.offsetWidth + selStoryboardBtn.offsetWidth + 8 <= curRect.w
    if (!du()) {
      selStoryboardBtn.classList.add('gon')
      if (!du()) selStoryboardBtn.classList.add('an')
    }
  }

  veEl.style.left = curRect.x + 'px'
  veEl.style.top = curRect.y + 'px'
  veEl.style.width = curRect.w + 'px'
  veEl.style.height = curRect.h + 'px'
  veEl.width = Math.max(1, Math.round(curRect.w * DPR))
  veEl.height = Math.max(1, Math.round(curRect.h * DPR))
  veCtx = veEl.getContext('2d')
  if (veCtx) {
    veCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
    redraw()
  }
  datViTriThanhCongCu()
}

function xuLyChinhKhung(e) {
  if (!isAdjusting) return
  e.preventDefault()
  const dx = e.clientX - adjustStartMouse.x
  const dy = e.clientY - adjustStartMouse.y
  const minW = 20, minH = 20
  const W = window.innerWidth, H = window.innerHeight

  let nx = adjustStartRect.x
  let ny = adjustStartRect.y
  let nw = adjustStartRect.w
  let nh = adjustStartRect.h

  if (adjustType === 'move') {
    nx = clamp(adjustStartRect.x + dx, 0, W - adjustStartRect.w)
    ny = clamp(adjustStartRect.y + dy, 0, H - adjustStartRect.h)
  } else {
    if (adjustType.includes('e')) {
      nw = Math.max(minW, Math.min(W - adjustStartRect.x, adjustStartRect.w + dx))
    }
    if (adjustType.includes('s')) {
      nh = Math.max(minH, Math.min(H - adjustStartRect.y, adjustStartRect.h + dy))
    }
    if (adjustType.includes('w')) {
      const right = adjustStartRect.x + adjustStartRect.w
      nx = Math.max(0, Math.min(right - minW, adjustStartRect.x + dx))
      nw = right - nx
    }
    if (adjustType.includes('n')) {
      const bottom = adjustStartRect.y + adjustStartRect.h
      ny = Math.max(0, Math.min(bottom - minH, adjustStartRect.y + dy))
      nh = bottom - ny
    }
  }

  nx = Math.round(nx); ny = Math.round(ny); nw = Math.round(nw); nh = Math.round(nh)

  if (shapes.length > 0 && (nx !== curRect.x || ny !== curRect.y)) {
    const shiftX = nx - curRect.x
    const shiftY = ny - curRect.y
    for (const s of shapes) {
      if (s.type === 'text' || s.type === 'so') {
        s.x -= shiftX
        s.y -= shiftY
      } else {
        s.x1 -= shiftX; s.x2 -= shiftX
        s.y1 -= shiftY; s.y2 -= shiftY
      }
    }
  }

  curRect = { x: nx, y: ny, w: nw, h: nh }
  capNhatGiaoDienKhung()
}

/* ── Thuoc do nhip keo (ghi run-log — doi chieu duoc tren may that, so #7).
   rAF do NGHEN MAIN THREAD renderer (frozen/decode do xuong giua luc keo).
   ☠️ Bay thuoc do 31/08: rAF vsync-MU voi lag compositor — thuoc nay CHI ket
   luan duoc ve nghen main thread, khong thay lag ghep man. */
let doKeo = null
function batDauDoKeo() {
  doKeo = { raf: 0, last: performance.now(), max: 0, n: 0 }
  const tick = () => {
    if (!doKeo) return
    const now = performance.now()
    const gap = now - doKeo.last
    if (gap > doKeo.max) doKeo.max = gap
    doKeo.last = now
    doKeo.n++
    doKeo.raf = requestAnimationFrame(tick)
  }
  doKeo.raf = requestAnimationFrame(tick)
}
function ketThucDoKeo() {
  if (!doKeo) return
  cancelAnimationFrame(doKeo.raf)
  window.overlay.log('keo ' + doKeo.n + ' khung, gap-max=' + Math.round(doKeo.max) + 'ms')
  doKeo = null
}

/* ── Chon vung ────────────────────────────────────────────────────────── */
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  if (biKhoa) return // man khac dang giu quyen keo
  window.overlay.lock()
  if (mode === 'annotate') { batDauVe(e); return }
  dragging = true
  startX = e.clientX; startY = e.clientY // neo local cho ve-ngay (31/08)
  hintEl.classList.add('hidden')
  batDauDoKeo()
  // MAIN theo doi chuot he thong (dung moi scale) va phat 'sel-rect' ve.
  // ☠️ Gui kem DIEM MOUSEDOWN (global DIP) lam neo: main nhan tin MUON khi
  // grab dang chan (~880ms) — hoi con tro luc do la neo lech 100-150px so
  // voi local -> "keo va giu no giat 15xx/1405" + vung LUU lech (31/08).
  window.overlay.dragStart({ x: origin.x + e.clientX, y: origin.y + e.clientY })
})

window.addEventListener('mousemove', (e) => {
  if (isAdjusting) { xuLyChinhKhung(e); return }
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
    lanVeLocal = performance.now() // local dang song — main nhuong khung nay
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
  if (isAdjusting) {
    isAdjusting = false
    adjustType = null
    toolbarEl.style.opacity = '1'
    toolbarEl.style.pointerEvents = 'auto'
    datViTriThanhCongCu()
    return
  }
  if (mode === 'annotate') { ketThucVe(e); return }
  if (!dragging) return
  dragging = false
  ketThucDoKeo()
  window.overlay.dragEnd() // main chot vung + dieu phoi (annotate/composite/huy)
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { window.overlay.cancel(); return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { hoanTac(); return }
  // Xoa shape dang chon (Delete / Backspace)
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape && !oGoChu && mode === 'annotate') {
    const idx = shapes.indexOf(selectedShape)
    if (idx >= 0) shapes.splice(idx, 1)
    selectedShape = null
    redraw()
    return
  }
  // Di chuyen shape bang phim mui ten (nudge nhu PR / AI)
  if (selectedShape && !oGoChu && mode === 'annotate' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    if (selectedShape.type === 'text' || selectedShape.type === 'so') {
      selectedShape.x += dx; selectedShape.y += dy
    } else {
      selectedShape.x1 += dx; selectedShape.x2 += dx
      selectedShape.y1 += dy; selectedShape.y2 += dy
    }
    redraw()
    return
  }
  // Ctrl+C: xong + COPY vao clipboard (them, khong bo Enter / nut check).
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && mode === 'annotate') {
    e.preventDefault(); xong(true); return
  }
  // Phim S = bat/tat Storyboard Strip
  if (mode === 'annotate' && !e.ctrlKey && !e.altKey && !e.metaKey && !oGoChu) {
    if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
      toggleStoryboardMode()
      return
    }
  }
  // Phim R = quay video vung dang chon (01/10)
  if (mode === 'annotate' && !e.ctrlKey && !e.altKey && !e.metaKey && !oGoChu &&
      (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) {
    e.preventDefault(); quayVideo(); return
  }
  // Phim 5 = doc chu trong vung (29/09 anh Tien) — mo bang chu, khong phai cong cu ve
  if (mode === 'annotate' && !e.ctrlKey && !e.altKey && !e.metaKey && !oGoChu &&
      (e.key === '5' || e.code === 'Digit5' || e.code === 'Numpad5')) {
    e.preventDefault(); docChuVung(); return
  }
  // Phim V = Select tool, 1/2/3/4 = khung/mui ten/chu/blur (giong PR — anh Tien 27/09); 6 = danh so buoc (02/10)
  if (mode === 'annotate' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const keyMap = {
      'v': 'select', 'V': 'select', 'KeyV': 'select',
      '1': 'rect', '2': 'arrow', '3': 'text', '4': 'blur', '6': 'so',
      'b': 'blur', 'B': 'blur', 'KeyB': 'blur',
      'Digit1': 'rect', 'Digit2': 'arrow', 'Digit3': 'text', 'Digit4': 'blur', 'Digit6': 'so',
      'Numpad1': 'rect', 'Numpad2': 'arrow', 'Numpad3': 'text', 'Numpad4': 'blur', 'Numpad6': 'so'
    }
    const t = keyMap[e.key] || keyMap[e.code]
    if (t) chonCongCu(t)
  }
})

/* ── Vao che do VE ────────────────────────────────────────────────────── */
function vaoCheDoVe() {
  mode = 'annotate'
  veEl.hidden = false
  capNhatGiaoDienKhung()
  // Thanh cong cu: duoi vung chon, hoac tren neu khong du cho.
  toolbarEl.hidden = false
  datViTriThanhCongCu()
  chonCongCu('rect')
  chonMau(curColor) // danh dau mau dang chon (mac dinh cam)
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
  if (x !== tool) chotOGoChu()
  tool = x
  if (tool !== 'select') {
    selectedShape = null
    veEl.style.cursor = 'crosshair'
  } else {
    veEl.style.cursor = 'default'
  }
  toolbarEl.querySelectorAll('.cong-cu[data-tool]').forEach((b) => {
    // Storyboard la cong tac bat/tat rieng, khong phai cong cu ve — dung dong den cua no.
    if (b.dataset.tool === 'storyboard') return
    b.classList.toggle('chon', b.dataset.tool === x)
  })
  redraw()
}

/* ── Ve shape & Select tool (phim V) ─────────────────────────────────── */
let veStart = null
let selectedShape = null
let dangKeoShape = false
let keoShapeStart = { x: 0, y: 0 }
let shapeBanDau = null

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
  if (s.type === 'so') {
    const r = R_SO + 4
    return { x: s.x - r, y: s.y - r, w: r * 2, h: r * 2 }
  }
  return null
}

function timShapeTaiDiem(lx, ly) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i]
    if (s.type === 'so') {
      if (Math.hypot(lx - s.x, ly - s.y) <= R_SO + 4) return { shape: s, index: i }
    } else if (s.type === 'rect' || s.type === 'blur') {
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

function batDauVe(e) {
  const lx = e.clientX - curRect.x, ly = e.clientY - curRect.y
  if (lx < 0 || ly < 0 || lx > curRect.w || ly > curRect.h) {
    // Bam RA NGOAI vung = bo vung cu, quet vung MOI ngay (nhu Lightshot —
    // anh Tien 25/08). Trong vung thi ve shape nhu thuong.
    chonLaiTuDau(e)
    return
  }
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
  if (tool === 'text') { moOGoChu(document.body, lx, ly, curRect.x, curRect.y); return }
  chotOGoChu() // bam ve khung/mui ten khi dang go chu -> chot chu truoc
  if (tool === 'so') {
    // Bam = dong so ngay; con giu chuot thi keo chinh cho, tha ra la xong.
    soDangDat = { type: 'so', ...kepTamSo(lx, ly, curRect.w, curRect.h), color: curColor }
    shapes.push(soDangDat)
    redraw()
    return
  }
  veStart = { x: lx, y: ly }
}

/* Bo vung chon + shape dang co, quay ve che do quet vung — bat dau keo ngay. */
function chonLaiTuDau(e) {
  huyOGoChu()
  selectedShape = null
  dangKeoShape = false
  mode = 'select'
  shapes = []
  veStart = null
  soDangDat = null
  isAdjusting = false
  adjustType = null
  toolbarEl.style.opacity = '1'
  toolbarEl.style.pointerEvents = 'auto'
  if (veCtx) veCtx.clearRect(0, 0, curRect.w, curRect.h)
  veEl.hidden = true
  toolbarEl.hidden = true
  selEl.hidden = true
  toggleStoryboardMode(false)
  dragging = true
  startX = e.clientX; startY = e.clientY // neo local cho ve-ngay (31/08)
  batDauDoKeo()
  // Neo = diem mousedown that (nhu tren) — khong de main tu hoi con tro.
  window.overlay.dragStart({ x: origin.x + e.clientX, y: origin.y + e.clientY })
}

function veDangKeo(e) {
  if (tool === 'select') {
    const lx = e.clientX - curRect.x, ly = e.clientY - curRect.y
    if (dangKeoShape && selectedShape && shapeBanDau) {
      const dx = Math.round(lx - keoShapeStart.x)
      const dy = Math.round(ly - keoShapeStart.y)
      if (selectedShape.type === 'rect' || selectedShape.type === 'arrow') {
        selectedShape.x1 = shapeBanDau.x1 + dx
        selectedShape.y1 = shapeBanDau.y1 + dy
        selectedShape.x2 = shapeBanDau.x2 + dx
        selectedShape.y2 = shapeBanDau.y2 + dy
      } else if (selectedShape.type === 'text' || selectedShape.type === 'so') {
        selectedShape.x = shapeBanDau.x + dx
        selectedShape.y = shapeBanDau.y + dy
      }
      redraw()
    } else if (lx >= 0 && ly >= 0 && lx <= curRect.w && ly <= curRect.h) {
      const hit = timShapeTaiDiem(lx, ly)
      veEl.style.cursor = hit ? 'move' : 'default'
    }
    return
  }
  if (soDangDat) {
    Object.assign(soDangDat, kepTamSo(e.clientX - curRect.x, e.clientY - curRect.y, curRect.w, curRect.h))
    redraw()
    return
  }
  if (!veStart) return
  const lx = clamp(e.clientX - curRect.x, 0, curRect.w)
  const ly = clamp(e.clientY - curRect.y, 0, curRect.h)
  redraw({ type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor, blurType: curBlurType }) // xem truoc
}

function ketThucVe(e) {
  if (tool === 'select') {
    if (dangKeoShape) {
      dangKeoShape = false
      shapeBanDau = null
      redraw()
    }
    return
  }
  if (soDangDat) { soDangDat = null; return }
  if (!veStart) return
  const lx = clamp(e.clientX - curRect.x, 0, curRect.w)
  const ly = clamp(e.clientY - curRect.y, 0, curRect.h)
  const s = { type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor, blurType: curBlurType }
  veStart = null
  // bo qua neu qua nho (bam nham)
  if (Math.abs(s.x2 - s.x1) < 3 && Math.abs(s.y2 - s.y1) < 3) { redraw(); return }
  shapes.push(s)
  redraw()
}

function redraw(preview) {
  if (!veCtx) return
  veCtx.clearRect(0, 0, curRect.w, curRect.h)
  danhSoLai()
  const ds = preview ? shapes.concat(preview) : shapes
  for (const s of ds) veShape(veCtx, s)
  if (selectedShape && tool === 'select') {
    veKhungChonShape(veCtx, selectedShape)
  }
}

let offscreenBlurCanvas = null
function veBlurPixelate(ctx, x, y, w, h) {
  if (w <= 0 || h <= 0) return
  const sx = (curRect.x + x) * DPR
  const sy = (curRect.y + y) * DPR
  const sw = w * DPR
  const sh = h * DPR

  if (frozenImg && frozenImg.naturalWidth > 0) {
    const blockSize = Math.max(8, Math.round(10 * DPR))
    const bw = Math.max(1, Math.round(sw / blockSize))
    const bh = Math.max(1, Math.round(sh / blockSize))

    if (!offscreenBlurCanvas) offscreenBlurCanvas = document.createElement('canvas')
    offscreenBlurCanvas.width = bw
    offscreenBlurCanvas.height = bh
    const offCtx = offscreenBlurCanvas.getContext('2d')
    offCtx.imageSmoothingEnabled = true
    offCtx.clearRect(0, 0, bw, bh)
    offCtx.drawImage(frozenImg, sx, sy, sw, sh, 0, 0, bw, bh)

    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(offscreenBlurCanvas, 0, 0, bw, bh, x, y, w, h)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
  } else {
    ctx.save()
    ctx.fillStyle = 'rgba(25, 25, 25, 0.92)'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
  }
}

let offscreenLotMo = null
function veBlurSmooth(ctx, x, y, w, h) {
  if (w <= 0 || h <= 0) return
  if (frozenImg && frozenImg.naturalWidth > 0) {
    const sx = (curRect.x + x) * DPR
    const sy = (curRect.y + y) * DPR
    const sw = w * DPR
    const sh = h * DPR

    const pad = Math.round(20 * DPR)
    const sxPad = Math.max(0, sx - pad)
    const syPad = Math.max(0, sy - pad)
    const swPad = Math.min(frozenImg.naturalWidth - sxPad, sw + (sx - sxPad) + pad)
    const shPad = Math.min(frozenImg.naturalHeight - syPad, sh + (sy - syPad) + pad)

    const dx = x - (sx - sxPad) / DPR
    const dy = y - (sy - syPad) / DPR
    const dw = swPad / DPR
    const dh = shPad / DPR

    // [do 28/09 Claude ra soat] blur lay mau ra ngoai anh (sat mep man / pad hut) la
    // TRONG SUOT -> file ghep lo chu goc (do: sat mep tren, lop ve chi 89-106/255, doc
    // duoc so tai khoan). Lot truoc 1 lop DUC thu nho ~40 DIP/diem (khong con net chu).
    const lw = Math.max(1, Math.round(w / 40)), lh = Math.max(1, Math.round(h / 40))
    if (!offscreenLotMo) offscreenLotMo = document.createElement('canvas')
    offscreenLotMo.width = lw
    offscreenLotMo.height = lh
    const lotCtx = offscreenLotMo.getContext('2d')
    lotCtx.imageSmoothingEnabled = true
    lotCtx.imageSmoothingQuality = 'high'
    lotCtx.drawImage(frozenImg, sx, sy, sw, sh, 0, 0, lw, lh)

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(offscreenLotMo, 0, 0, lw, lh, x, y, w, h)
    ctx.filter = 'blur(10px)'
    ctx.drawImage(frozenImg, sxPad, syPad, swPad, shPad, dx, dy, dw, dh)
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
  } else {
    ctx.save()
    ctx.fillStyle = 'rgba(25, 25, 25, 0.92)'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
  }
}

/* 04/10 KIEU THU BA "TO KIN" (anh: "them kieu lam mo"): mot thanh DAC che han vung chon. Khac Kham o / Mo min o cho no
   KHONG lay diem anh nao cua anh goc -> khong con gi de khoi phuc (kham 8-15 px voi chu nho con doan lai duoc, AGENTS.md
   27/09). Vien mo de luc dang keo tren nen toi van thay khung. Ham nay phai cung cach ve voi ban trong src/pin/pin.js
   (ben do nhan them he so k); bai do: npm run test:chekin. */
function veCheKin(ctx, x, y, w, h) {
  if (w <= 0 || h <= 0) return
  ctx.save()
  ctx.globalAlpha = 1
  ctx.filter = 'none'
  ctx.fillStyle = '#000'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
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
  } else if (s.type === 'text') {
    veChu(ctx, s, 1)
  } else if (s.type === 'so') {
    veSo(ctx, s, 1)
  } else if (s.type === 'blur') {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2)
    const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1)
    const bType = s.blurType || curBlurType
    if (bType === 'blur') {
      veBlurSmooth(ctx, x, y, w, h)
    } else if (bType === 'kin') {
      veCheKin(ctx, x, y, w, h)
    } else {
      veBlurPixelate(ctx, x, y, w, h)
    }
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
  if (oGoChu) { huyOGoChu(); return } // dang go thi Ctrl+Z = bo o go
  soDangDat = null
  shapes.pop()
  redraw()
}

/* ── Cong cu DANH SO BUOC (phim 6, 02/10 — ROADMAP muc 0 so 1) ───────────
   Bam len anh = dong mot huy hieu tron co so; bam tiep la 2, 3, 4... Nguoi dung: ghi chu sua cho khach ("1 doi mau,
   2 cat ngan"), lam huong dan tung buoc. Shape {type:'so', x, y (TAM, DIP cuc bo), n, color}. So KHONG luu co dinh:
   danhSoLai() dem lai theo thu tu trong shapes moi lan ve -> hoan tac / xoa mot so o giua thi cac so con lai tu don
   lai lien nhau (khong bao gio co 1, 3, 4). Cung ham nay nam trong pin.js — sua o day thi sua ca ben do. */
const R_SO = 13 // ban kinh huy hieu, px DIP
let soDangDat = null // huy hieu vua bam, con dang giu chuot de chinh cho
function danhSoLai() { let n = 0; for (const s of shapes) if (s.type === 'so') s.n = ++n }
/* Tam huy hieu phai cach mep vung du de ca vong tron + vien nam trong anh. */
function kepTamSo(lx, ly, w, h) {
  const le = R_SO + 3
  return {
    x: w > le * 2 ? clamp(Math.round(lx), le, w - le) : Math.round(w / 2),
    y: h > le * 2 ? clamp(Math.round(ly), le, h - le) : Math.round(h / 2)
  }
}
/* Mau chu so: trang, tru khi nen sang (vang, xanh la, trang) thi den — tinh bang do tuong phan WCAG voi chu trang,
   nguong 2,6 (cam 3,0 · do 3,6 · xanh duong 3,7 -> chu trang; xanh la 2,2 · vang 1,5 -> chu den). */
function chuTrenMau(mau) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(mau || ''))
  if (!m) return '#ffffff'
  const k = [1, 2, 3].map((i) => { const v = parseInt(m[i], 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
  const L = 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]
  return 1.05 / (L + 0.05) >= 2.6 ? '#ffffff' : '#111111'
}
/* k = he so phong (1 khi ve tren man; anh that / kich thuoc hien thi khi xuat). */
function veSo(ctx, s, k) {
  const cx = s.x * k, cy = s.y * k, r = R_SO * k
  const chu = chuTrenMau(s.color)
  const so = String(s.n || 1)
  const kb = k * (ctx.getTransform ? ctx.getTransform().a : 1) // bong do KHONG theo he so phong cua canvas
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 4 * kb; ctx.shadowOffsetY = 1 * kb
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = s.color; ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 2 * k; ctx.strokeStyle = chu; ctx.stroke()
  ctx.font = '700 ' + ((so.length > 2 ? 10 : so.length > 1 ? 12 : 14) * k) + 'px Inter, "Segoe UI", sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(so)
  ctx.fillStyle = chu
  ctx.fillText(so, cx + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2) // can theo NET chu, khong theo o chu
  ctx.restore()
}

/* ── Thanh cong cu ────────────────────────────────────────────────────── */
toolbarEl.addEventListener('mousedown', (e) => e.stopPropagation()) // khoi ve khi bam nut
toolbarEl.addEventListener('click', (e) => {
  const mau = e.target.closest('.mau')
  if (mau) { chonMau(mau.dataset.color); return }
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.tool) {
    if (b.dataset.tool === 'storyboard') {
      toggleStoryboardMode()
      return
    }
    if (b.dataset.tool === 'ocr') { if (ocrMo()) dongBangChu(); else docChuVung(); return }
    if (b.dataset.tool === 'quay') { quayVideo(); return }
    chonCongCu(b.dataset.tool)
  }  else if (b.id === 'undo') hoanTac()
  else if (b.id === 'huy') window.overlay.cancel()
  else if (b.id === 'xong') xong()
})

/* ── Anh GOC khong nen, cat dung vung (14/09) ─────────────────────────────
   Anh dong bang (layers[].img) tu 14/09 la JPEG chi de NHIN. Luc bam Xong co
   shape / ghep vat man, xin main cat vung can thiet tu anh goc qua
   aioshot://raw/<key>/<x>_<y>_<w>_<h>.png (px thiet bi cua man do) -> file luu
   van lossless. Nap loi -> roi ve JPEG (con hon mat anh). */
function urlRaw(key, x, y, w, h) {
  return 'aioshot://raw/' + key + '/' + [x, y, w, h].map((v) => Math.max(0, Math.round(v))).join('_') + '.png'
}
function napAnh(url) {
  return new Promise((res, rej) => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => res(im)
    im.onerror = () => rej(new Error('nap loi ' + url))
    im.src = url
  })
}

/* ── Xong: ghep anh + shape roi gui ───────────────────────────────────── */
function xong(copy) {
  chotOGoChu()
  // 28/09: dang bat Multi-Shot Storyboard -> main QUAY 3 GIAY dung vung nay (6 khung) roi ghep dai.
  // Net ve (neu co) khong ap len khung video dang chay -> chi gui vung.
  if (isStoryboardMode) {
    window.overlay.log('xong storyboard: quay 3s ' + curRect.w + 'x' + curRect.h)
    window.overlay.confirm({ rect: curRect, storyboard: true })
    return
  }
  selectedShape = null
  redraw()
  if (!shapes.length) { window.overlay.confirm({ rect: curRect, copy: !!copy }); return }
  // Co shape: ghep anh GOC (cat dung vung, PNG) + shape roi gui dataURL.
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(curRect.w * DPR))
  out.height = Math.max(1, Math.round(curRect.h * DPR))
  const ctx = out.getContext('2d')
  const ghepVaGui = (nen, nguon) => {
    if (nen) ctx.drawImage(nen, 0, 0, out.width, out.height)
    ctx.drawImage(veEl, 0, 0) // shape da o device res
    window.overlay.log('xong shape nen=' + nguon + ' ' + out.width + 'x' + out.height)
    window.overlay.confirm({ dataUrl: out.toDataURL('image/png'), copy: !!copy })
  }
  const roiVeJpeg = (ly) => {
    try {
      if (frozenImg && frozenImg.complete && frozenImg.naturalWidth) {
        ctx.drawImage(frozenImg,
          curRect.x * DPR, curRect.y * DPR, curRect.w * DPR, curRect.h * DPR,
          0, 0, out.width, out.height)
        ghepVaGui(null, 'jpeg-du-phong(' + ly + ')')
      } else ghepVaGui(null, 'khong-nen(' + ly + ')')
    } catch (err) {
      window.overlay.confirm({ rect: curRect, copy: !!copy }) // ghep loi thi cat thuong
    }
  }
  const own = layers.find((L) => L.x === origin.x && L.y === origin.y)
  if (!own || !own.key) { roiVeJpeg('khong co key'); return }
  napAnh(urlRaw(own.key, curRect.x * DPR, curRect.y * DPR, curRect.w * DPR, curRect.h * DPR))
    .then((im) => ghepVaGui(im, 'raw-png'))
    .catch((e) => roiVeJpeg(e.message))
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
  // ☠️ GHEP THEO PIXEL VAT LY, moi man dan 1:1 anh goc (nhu Snipping Tool).
  // Truoc ghep theo DIP: 2 man khac scale (150%/125%) la mot ben bi phong to
  // -> "chua dung ti le" (anh Tien 26/08). g o day la rect PHYS tu main.
  // 14/09: tung manh giao xin cat tu anh GOC (aioshot://raw, PNG); nap loi thi
  // roi ve lop JPEG (chi de nhin) — con hon tra anh trang.
  const manh = []
  for (const L of giao) {
    const ix = Math.max(g.x, L.px), iy = Math.max(g.y, L.py)
    const ix2 = Math.min(g.x + g.w, L.px + L.pw), iy2 = Math.min(g.y + g.h, L.py + L.ph)
    if (ix2 <= ix || iy2 <= iy) continue
    // ☠️ desktopCapturer co the tra anh KHONG dung co native (scale theo
    // thumbnailSize) — do anh THAT roi quy doi, dung gia dinh.
    const kx = L.img.naturalWidth / L.pw, ky = L.img.naturalHeight / L.ph
    manh.push({ L, sx: (ix - L.px) * kx, sy: (iy - L.py) * ky, sw: (ix2 - ix) * kx, sh: (iy2 - iy) * ky,
                dx: ix - g.x, dy: iy - g.y, dw: ix2 - ix, dh: iy2 - iy })
  }
  const ghep = (nguonRaw) => {
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.round(g.w))
    cv.height = Math.max(1, Math.round(g.h))
    const ctx = cv.getContext('2d')
    ctx.imageSmoothingEnabled = false
    for (const m of manh) {
      if (nguonRaw && m.raw) ctx.drawImage(m.raw, 0, 0, m.raw.naturalWidth, m.raw.naturalHeight, m.dx, m.dy, m.dw, m.dh)
      else ctx.drawImage(m.L.img, m.sx, m.sy, m.sw, m.sh, m.dx, m.dy, m.dw, m.dh)
    }
    window.overlay.log('composite OK ' + cv.width + 'x' + cv.height + ' (phys 1:1) tu ' + manh.length + ' man, nen=' + (nguonRaw ? 'raw-png' : 'jpeg-du-phong'))
    window.overlay.confirm({ dataUrl: cv.toDataURL('image/png') })
  }
  Promise.all(manh.map((m) => m.L.key
    ? napAnh(urlRaw(m.L.key, m.sx, m.sy, m.sw, m.sh)).then((im) => { m.raw = im })
    : Promise.reject(new Error('khong co key'))))
    .then(() => { try { ghep(true) } catch (err) { window.overlay.log('composite LOI: ' + err.message); window.overlay.cancel() } })
    .catch((e) => {
      window.overlay.log('composite raw loi (' + e.message + ') -> jpeg')
      try { ghep(false) } catch (err) { window.overlay.log('composite LOI: ' + err.message); window.overlay.cancel() }
    })
}

function giaoNhau(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
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

/* [selftest] tu khoanh giua + xong (khong ve shape). */
function autoSelftest() {
  const W = window.innerWidth, H = window.innerHeight
  const w = Math.min(640, Math.round(W * 0.4)), h = Math.min(420, Math.round(H * 0.4))
  const x = Math.round((W - w) / 2), y = Math.round((H - h) / 2)
  curRect = { x, y, w, h }
  /* [do] 14/09 AIO_TEST_SHAPE=1: vao che do ve, ve 1 khung cam roi Xong -> di duong
     aioshot://raw (cat anh goc PNG + shape). File luu phai co diem cam. */
  if (cheDoTest.testShape) {
    vaoCheDoVe()
    shapes.push({ type: 'rect', x1: 20, y1: 20, x2: w - 20, y2: h - 20, color: '#f86820' })
    redraw()
    window.overlay.log('[selftest] shape rect ' + w + 'x' + h)
    setTimeout(() => xong(false), 150)
    return
  }
  /* [do] 14/09 AIO_TEST_COMPOSITE=1: vung VAT NGANG 2 man (phys) -> confirmComposite
     -> tung manh cat tu anh goc. Can >=2 man; 1 man thi roi ve rect thuong. */
  if (cheDoTest.testComposite) {
    const thu = (lan) => {
      if (!layersReady || layers.length < 2) {
        if (layers.length < 2 && layersReady) { window.overlay.log('[selftest] composite: chi ' + layers.length + ' man -> rect thuong'); window.overlay.confirm({ rect: curRect }); return }
        if (lan < 20) { setTimeout(() => thu(lan + 1), 250); return }
        window.overlay.confirm({ rect: curRect }); return
      }
      const sx = [...layers].sort((a, b) => a.px - b.px)
      const A = sx[0], B = sx[1]
      const g = { x: A.px + A.pw - 300, y: Math.max(A.py, B.py) + 100, w: 600, h: 300 }
      window.overlay.log('[selftest] composite g=' + JSON.stringify(g))
      confirmComposite(g)
    }
    thu(0)
    return
  }
  window.overlay.confirm({ rect: curRect })
}

/* ── 29/09 DOC CHU (phim 5 / nut "Lay chu") ─────────────────────────────────
   Anh Tien: "khoanh vung, bam phim so 5, sinh ra bang cac dong text va nut copy". Main cat DUNG VUNG tu anh GOC +
   doc bang bo doc co san cua he dieu hanh (src/ocr.js). Sao chep = chep het (hoac phan dang boi den) roi dong man chup. */
const ocrBang = document.getElementById('ocr-bang')
const ocrDs = document.getElementById('ocr-ds')
const ocrDem = document.getElementById('ocr-dem')
const ocrGhichu = document.getElementById('ocr-ghichu')
const ocrChep = document.getElementById('ocr-chep')
const ocrChepChu = ocrChep.querySelector('span')
let ocrDong = []
let ocrLuot = 0
const ocrMo = () => !ocrBang.hidden
const nutOcr = () => toolbarEl.querySelector('.cong-cu[data-tool="ocr"]')

function datViTriBangChu() {
  const gap = 12, rong = ocrBang.offsetWidth || 340, cao = ocrBang.offsetHeight || 200
  let x = curRect.x + curRect.w + gap
  if (x + rong > window.innerWidth - gap) x = curRect.x - gap - rong
  if (x < gap) x = Math.max(gap, Math.min(curRect.x, window.innerWidth - rong - gap))
  let y = Math.max(gap, Math.min(curRect.y, window.innerHeight - cao - gap))
  // Khong de bang de len thanh cong cu khi phai dat trong/sat vung
  const tb = toolbarEl.hidden ? null : toolbarEl.getBoundingClientRect()
  if (tb && x < tb.right && x + rong > tb.left && y < tb.bottom && y + cao > tb.top) y = Math.max(gap, tb.top - cao - gap)
  ocrBang.style.left = Math.round(x) + 'px'
  ocrBang.style.top = Math.round(y) + 'px'
}

function veBangChu(kieu, chu) {
  ocrDs.textContent = ''
  ocrDs.classList.toggle('dang-doc', kieu === 'dang-doc')
  if (kieu !== 'dong') {
    const p = document.createElement('div'); p.className = 'rong'; p.textContent = chu; ocrDs.appendChild(p)
    return
  }
  for (const s of ocrDong) { const d = document.createElement('div'); d.className = 'dong'; d.textContent = s; ocrDs.appendChild(d) }
}

/* cach: undefined = main chon theo ngon ngu app (Windows + tieng Viet -> Tesseract); 'tesseract' | 'he-thong' = nguoi
   dung bam "doc lai bang bo kia" tren bang. */
const ocrDoi = document.getElementById('ocr-doi')
let ocrCachVua = null
async function docChuVung(cach) {
  if (mode !== 'annotate' || !curRect.w || !curRect.h) return
  chotOGoChu()
  const luot = ++ocrLuot
  ocrDong = []
  ocrDem.textContent = ''
  ocrGhichu.hidden = true
  ocrDoi.hidden = true
  ocrChep.disabled = true; ocrChep.classList.remove('xong'); ocrChepChu.textContent = t('ocr.chep')
  veBangChu('dang-doc', t('ocr.dangDoc'))
  ocrBang.hidden = false
  const nb = nutOcr(); if (nb) nb.classList.add('chon')
  datViTriBangChu()
  const own = layers.find((L) => L.x === origin.x && L.y === origin.y)
  let kq = null
  if (own && own.key) {
    try {
      kq = await window.overlay.ocr({ key: own.key, x: curRect.x * DPR, y: curRect.y * DPR, w: curRect.w * DPR, h: curRect.h * DPR, sf: DPR, cach })
    } catch (e) { kq = { ok: false, loi: e.message } }
  } else kq = { ok: false, loi: 'chua co anh (grab chua xong)' }
  if (luot !== ocrLuot || !ocrMo()) return // da dong / doc lai
  if (!kq || !kq.ok) {
    window.overlay.log('ocr LOI: ' + (kq && kq.loi))
    veBangChu('rong', t('ocr.loi'))
  } else if (!kq.dong.length) {
    veBangChu('rong', t('ocr.khongCo'))
  } else {
    ocrDong = kq.dong
    veBangChu('dong')
    ocrDem.textContent = '· ' + t('ocr.dem').replace('{n}', String(ocrDong.length))
    ocrChep.disabled = false
    ocrDs.focus()
  }
  // Dang dung bo doc Windows + app tieng Viet -> noi ro chu co dau se sai (Windows KHONG co bo doc tieng Viet)
  const may = kq && kq.ngonNguMay
  if (kq && kq.cach === 'he-thong' && window.i18n.lang === 'vi' && Array.isArray(may) && !may.some((x) => /^vi/i.test(x))) {
    ocrGhichu.textContent = t('ocr.thieuVi'); ocrGhichu.hidden = false
  }
  // Nut doc lai bang bo KIA (chi Windows): dang Tesseract -> "Doc bang bo doc Windows"; dang Windows -> "Doc lai tieng Viet"
  ocrCachVua = kq && kq.cach
  if (kq && kq.coTheDoi && ocrCachVua) {
    ocrDoi.textContent = t(ocrCachVua === 'tesseract' ? 'ocr.docHeThong' : 'ocr.docTiengViet')
    ocrDoi.hidden = false
  }
  datViTriBangChu()
}
ocrDoi.addEventListener('click', () => docChuVung(ocrCachVua === 'tesseract' ? 'he-thong' : 'tesseract'))

function dongBangChu() {
  ocrLuot++
  ocrBang.hidden = true
  const nb = nutOcr(); if (nb) nb.classList.remove('chon')
}

function chepChu(chuoi) {
  if (!chuoi || !chuoi.trim()) return
  window.overlay.copyText(chuoi)
  window.overlay.log('ocr chep ' + chuoi.length + ' ky tu')
  ocrChep.classList.add('xong'); ocrChepChu.textContent = t('ocr.daChep'); ocrChep.disabled = true
  setTimeout(() => window.overlay.cancel(), 450) // chep xong = xong viec, dong man chup
}

ocrChep.addEventListener('click', () => chepChu(ocrDong.join('\n')))
document.getElementById('ocr-dong').addEventListener('click', dongBangChu)
ocrBang.addEventListener('mousedown', (e) => e.stopPropagation()) // khong ve / khong keo vung khi bam trong bang
// Bam ra ngoai bang (khong phai thanh cong cu) = dong bang, quay ve ve binh thuong
window.addEventListener('mousedown', (e) => {
  if (ocrMo() && !ocrBang.contains(e.target) && !toolbarEl.contains(e.target)) dongBangChu()
}, true)
// Phim khi bang dang mo: CHAN het phim ve (1-5, V, S, Ctrl+C = xong...) truoc handler chinh (capture)
window.addEventListener('keydown', (e) => {
  if (!ocrMo()) return
  e.stopImmediatePropagation()
  const k = e.key.toLowerCase()
  if (e.key === 'Escape') { e.preventDefault(); dongBangChu(); return }
  if (e.key === 'Enter') { e.preventDefault(); if (!ocrChep.disabled) chepChu(ocrDong.join('\n')); return }
  if ((e.ctrlKey || e.metaKey) && k === 'c') {
    e.preventDefault()
    const sel = String(window.getSelection() || '')
    chepChu(sel.trim() ? sel : ocrDong.join('\n'))
    return
  }
  if ((e.ctrlKey || e.metaKey) && k === 'a') {
    e.preventDefault()
    const r = document.createRange(); r.selectNodeContents(ocrDs)
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r)
  }
}, true)
