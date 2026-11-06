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
// 06/11: chu trong menu xo (Lam mo, Che thong minh, But, Da quang) co data-i18n tu truoc nhung ghim chua dich -> ban EN van tieng Viet
document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = window.i18n.t(el.getAttribute('data-i18n')) })
// 06/11: ten mau + nhom mau doc theo ngon ngu (giong overlay.js)
document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
  const s = window.i18n.t(el.getAttribute('data-i18n-aria')); el.setAttribute('aria-label', s); if (el.classList.contains('mau')) el.title = s
})
/* 06/11 NUT NHOM (Lam mo, But): cham nho goc nut + tooltip "re chuot de xem them" (giong overlay.js, cung ten ham) */
function datTieuDeNhom(el) {
  if (!el) return
  const khoa = el.getAttribute('data-i18n-title')
  if (!khoa) return
  el.title = window.i18n.t(khoa) + '\n' + window.i18n.t('overlay.reThem'); el.setAttribute('aria-label', el.title)
}
function danhDauNhomXo(idNhom, idChinh) {
  const n = document.getElementById(idNhom)
  if (!n) return
  n.classList.add('co-xo')
  datTieuDeNhom(document.getElementById(idChinh))
}
danhDauNhomXo('lam-mo-nhom', 'lam-mo-chinh'); danhDauNhomXo('but-nhom', 'but-chinh')

let opacity = 1
const PLOG = (m) => { try { window.pin.log(m) } catch (e) {} }
let dip = { w: 0, h: 0 } // kich thuoc hien thi (DIP) tu main
let curBlurType = 'mosaic' // 'mosaic' (Kham o) | 'blur' (Mo min) | 'kin' (To kin, 04/10)

let anhDaLuu = '' // anh dang hien o che do xem (ban DA ve / da che): thoat ve khong luu thi tra ve dung ban nay
let luuLopSuaBat = true // 06/11: main bao co luu lop sua khong (luuLopSua trong cau-hinh.json)
window.pin.onData((data) => {
  /* 06/11 (soat dot 3, muc 2): main gui anh moi khi MOT ghim khac cung file vua luu (vi du da che). Phien ve/cat dang mo o day
     dang giu lich su Hoan tac tro ve NEN CU (chua che): Hoan tac se phuc hoi phan thong tin vua che, luu tiep se ghi de mat net che
     cua ghim kia. Nen bo han phien nay (ban chua luu), lay anh moi lam goc; net chua luu cua phien nay mat, con hon lo thong tin. */
  if (mode === 've') { PLOG('nhan anh moi tu ghim cung file luc dang ve: bo phien ve chua luu'); thoatVe(true) }
  img.src = data.dataUrl
  anhDaLuu = data.dataUrl
  frame.style.width = data.w + 'px'
  frame.style.height = data.h + 'px'
  vuaThanh()
  vuaBar()
  dip = { w: data.w, h: data.h }
  if (data && data.lamMoKieu) curBlurType = data.lamMoKieu
  if (typeof data.veTay === 'boolean') { NetTay.dat(data.veTay); capNhatNutTay() }
  if (typeof data.luuLopSua === 'boolean') luuLopSuaBat = data.luuLopSua
  lopTat = false
  layLopSua() // 06/11: anh nay co lop sua (cac net cu + anh sach) khong
  PLOG('data dip=' + data.w + 'x' + data.h + ' DPR=' + DPR + ' win=' + window.innerWidth + 'x' + window.innerHeight + ' blur=' + curBlurType)
})
if (window.pin.onUpdateConfig) {
  window.pin.onUpdateConfig((data) => {
    if (data && data.lamMoKieu) {
      curBlurType = data.lamMoKieu
      redraw()
    }
    if (data && typeof data.veTay === 'boolean') { NetTay.dat(data.veTay); capNhatNutTay() }
  })
}

/* ── 06/11 LOP SUA: lay (truoc) cac net da ve cua anh nay + anh sach tu main (userData). Co thi luc vao ve, cac net cu hien lai,
   chon sua duoc; nen la ANH SACH (chua che) nen net Che van che lai dung cho khi luu. Khong co / anh da doi ben ngoai: null. ── */
let lopTat = false     // nguoi dung vua xoa ban sach cua anh nay: luu tiep thi KHONG tao lai
let lopSan = null     // { lop, sachImg } da nap xong, hoac null
let lopLan = 0
function layLopSua() {
  const lan = ++lopLan
  lopSan = null
  hienNutXoaSach()
  if (!window.pin.lopDoc) return
  window.pin.lopDoc().then((lop) => {
    if (lan !== lopLan || !lop || !Array.isArray(lop.shapes) || !lop.shapes.length || !lop.sach) return
    const im = new Image()
    im.onload = () => { if (lan === lopLan) { lopSan = { lop, sachImg: im }; hienNutXoaSach(); PLOG('lop sua san sang: ' + lop.shapes.length + ' net') } }
    im.src = lop.sach
  }).catch((e) => PLOG('lop sua doc LOI ' + (e && e.message)))
}
function hienNutXoaSach() { const n = document.getElementById('lop-xoa'); if (n) n.hidden = !lopSan }

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
/* 05/11 soat: dang ve / che ma sao chep thi clipboard nhan anh GOC chua che. Gui anh da ghep kem lenh chep: main chep CHINH anh do,
   ghi file loi van chep dung ban da che. Ghep loi thi khong chep gi, con hon chep anh chua che. */
/* 06/11 (soat dot 3, muc 1): "co gi do da doi trong phien ve" = dung dieu kien cua luuVe (net, cat bo, hoac mo lai lop sua roi xoa het net).
   Truoc day chi xet shapes.length: cat bo dai chua thong tin rieng, KHONG them net nao, Ctrl+C -> clipboard van la anh GOC chua cat. */
function phienCoThayDoi() { return mode === 've' && (shapes.length > 0 || nenDoi || (nenTuLop && SuaNet.lichSu.length > 0)) }
function chepAnh() {
  if (phienCoThayDoi()) { luuVe(true); return }
  window.pin.copy()
}
btnCopy.addEventListener('click', chepAnh)
document.getElementById('lam-dep').addEventListener('click', () => window.pin.lamDep())
btnClose.addEventListener('click', () => window.pin.close())
img.addEventListener('dblclick', chepAnh)

/* --- Ban phim --- */
window.addEventListener('keydown', (e) => {
  PLOG('key ' + e.key + ' mode=' + mode + ' tool=' + tool)
  if (e.key === 'Escape') {
    if (bangMauMo() || menuButMo() || (cheMenu && cheMenu.dangMo())) { e.preventDefault(); dongPopups(); return } // Esc dong bang mau / menu but truoc
    if (cheTM && cheTM.xuLyPhim(e)) return // dang o che do Che thong minh: Esc chi dong che do do
    if (mode === 've') { thoatVe(); return } // dang ve: Esc chi bo ve, khong dong
    window.pin.close()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode === 've') {
    if (e.shiftKey) lamLai(); else hoanTac()
    return
  }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'y' && mode === 've') { e.preventDefault(); lamLai(); return }
  // Xoa shape dang chon (Delete / Backspace)
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape && !oGoChu && mode === 've') {
    const idx = shapes.indexOf(selectedShape)
    if (idx >= 0) { shapes.splice(idx, 1); SuaNet.ghi({ k: 'xoa', s: selectedShape, idx }) }
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
    const truocNudge = SuaNet.sao(selectedShape)
    if (selectedShape.pts) {
      dichNet(selectedShape, dx, dy)
    } else if (selectedShape.type === 'text' || selectedShape.type === 'so') {
      selectedShape.x += dx; selectedShape.y += dy
    } else {
      selectedShape.x1 += dx; selectedShape.x2 += dx
      selectedShape.y1 += dy; selectedShape.y2 += dy
    }
    SuaNet.ghiSua(selectedShape, truocNudge)
    redraw()
    return
  }
  if (e.key === 'Enter' && mode === 've') { luuVe(); return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { chepAnh(); return }
  // Phim V = Select tool, 1/2/3/4 = khung/mui ten/chu/blur (giong PR — anh Tien 27/09); 6 = danh so buoc (02/10)
  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    const keyMap = {
      'v': 'select', 'V': 'select', 'KeyV': 'select',
      'x': 'cat', 'X': 'cat', 'KeyX': 'cat', // 06/11 cat bo khuc giua anh
      '1': 'rect', '2': 'arrow', '3': 'text', '4': 'blur', '6': 'so', '7': 'but', '8': 'daquang',
      'b': 'blur', 'B': 'blur', 'KeyB': 'blur',
      'Digit1': 'rect', 'Digit2': 'arrow', 'Digit3': 'text', 'Digit4': 'blur', 'Digit6': 'so', 'Digit7': 'but', 'Digit8': 'daquang',
      'Numpad1': 'rect', 'Numpad2': 'arrow', 'Numpad3': 'text', 'Numpad4': 'blur', 'Numpad6': 'so', 'Numpad7': 'but', 'Numpad8': 'daquang'
    }
    const t = keyMap[e.key] || keyMap[e.code]
    if (t) { if (mode !== 've') vaoCheDoVe(); chonCongCu(t) }
    // Phim C = Che thong minh (05/11)
    else if (!oGoChu && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) { e.preventDefault(); chuyenChe() }
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
let cheTM = null           // 05/11 CHE THONG MINH (phim C): dieu khien tao o cuoi file
let cheMenu = null         // menu xo cua nut Lam mo (Lam mo | Che thong minh)

/* ── 12/11 BANG MAU XO + MENU BUT (nhom 7 / 8) + LAM LAI ─────────────────────────────────────────────
   Thanh chi con MOT cham mau; bam thi xo bang 7 mau xuong duoi, gan mep duoi thi xo len tren. Nut but gop but + da quang:
   re chuot vao xo menu doc 2 lua chon. Dong: chon xong / bam ra ngoai / Esc (Esc dong bang truoc, chua huy chup). */
const mauHienEl = document.getElementById('mau-hien')
const mauPopEl = document.getElementById('mau-pop')
const butNhomEl = document.getElementById('but-nhom')
const butChinhEl = document.getElementById('but-chinh')
const butMenuEl = document.getElementById('but-menu')
const nutRedoEl = document.getElementById('redo')
/* 04/11 Anh ghim NHO: thanh xuong hang cao hon anh thi nut nam ngoai khung, khong bam duoc (do 160x100: thanh cao 220 px).
   Thu nho ca thanh tung nac toi khi vua, san 0,5 (nut 20 px). Goi khi doi che do va khi co anh. */
function vuaThanh() {
  const caoKhung = frame.getBoundingClientRect().height - 12
  for (const z of [1, 0.85, 0.7, 0.6, 0.5]) {
    toolbarEl.style.zoom = z === 1 ? '' : String(z)
    if (toolbarEl.getBoundingClientRect().height <= caoKhung) return
  }
}
/* 05/11 Thanh tren-phai (#bar: keo file, Lam dep, Sao chep, Dong) them 1 nut nen rong ra ~30 px. Anh ghim NHO: thu nho tung nac
   cho vua be rong khung; nho toi muc 0,5 van khong vua thi giau rieng nut Lam dep (mo duoc o anh lon), khong de thanh tran khoi khung. */
function vuaBar() {
  const bar = document.getElementById('bar'), nut = document.getElementById('lam-dep')
  nut.style.display = ''
  const rong = frame.getBoundingClientRect().width - 12
  const vua = () => bar.getBoundingClientRect().width <= rong
  for (const z of [1, 0.85, 0.7, 0.6, 0.5]) {
    bar.style.zoom = z === 1 ? '' : String(z)
    if (vua()) return
  }
  nut.style.display = 'none'
  for (const z of [1, 0.85, 0.7, 0.6, 0.5]) {
    bar.style.zoom = z === 1 ? '' : String(z)
    if (vua()) return
  }
}
/* Pin: toolbar nam TRONG #frame (overflow: hidden) -> gioi han xo = khung anh, khong phai cua so. */
const gioiHanXo = () => { const r = frame.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
const LAM_LAI_DUOC = () => mode === 've'
/* Dat pop canh nut: xuong duoi neu du cho, khong thi len tren (cho nao rong hon); keo ngang cho khong tran gioi han. */
function xepXo(nut, pop) {
  const gh = gioiHanXo(), gap = 10
  pop.classList.remove('len', 'ngang'); pop.style.removeProperty('--dx')
  const r = nut.getBoundingClientRect()
  let cao = pop.offsetHeight
  let duoi = gh.bottom - r.bottom, tren = r.top - gh.top
  if (duoi < cao + gap && tren < cao + gap && pop.id === 'mau-pop') { // ca hai phia deu hep: bang mau xep ngang
    pop.classList.add('ngang'); cao = pop.offsetHeight
  }
  const xuong = duoi >= cao + gap || (tren < cao + gap && duoi >= tren)
  pop.classList.toggle('len', !xuong)
  const p = pop.getBoundingClientRect()
  let dx = 0
  if (p.left < gh.left + 4) dx = gh.left + 4 - p.left
  else if (p.right > gh.right - 4) dx = gh.right - 4 - p.right
  if (dx) pop.style.setProperty('--dx', Math.round(dx) + 'px')
}
function bangMauMo() { return !mauPopEl.hidden }
function menuButMo() { return !butMenuEl.hidden }
function dongBangMau() { if (mauPopEl.hidden) return; mauPopEl.hidden = true; mauHienEl.setAttribute('aria-expanded', 'false') }
function dongMenuBut() { clearTimeout(butDong); if (!butMenuEl.hidden) butMenuEl.hidden = true }
function dongPopups() { dongBangMau(); dongMenuBut(); if (cheMenu) cheMenu.dong() }
function moBangMau() { dongMenuBut(); if (cheMenu) cheMenu.dong(); mauPopEl.hidden = false; xepXo(mauHienEl, mauPopEl); mauHienEl.setAttribute('aria-expanded', 'true') }
function moMenuBut() { clearTimeout(butDong); if (!butMenuEl.hidden) return; dongBangMau(); if (cheMenu) cheMenu.dong(); butMenuEl.hidden = false; xepXo(butChinhEl, butMenuEl) }
let butDong = 0
butNhomEl.addEventListener('mouseenter', moMenuBut)
butNhomEl.addEventListener('mouseleave', () => { clearTimeout(butDong); butDong = setTimeout(dongMenuBut, 160) })
// bam ra ngoai bang mau = dong (bat o pha capture: thanh cong cu chan noi bot mousedown)
window.addEventListener('mousedown', (e) => {
  if (bangMauMo() && !mauHienEl.parentNode.contains(e.target)) dongBangMau()
  if (menuButMo() && !butNhomEl.contains(e.target)) dongMenuBut()
}, true)

/* Nut but hien icon + so phim + goi y cua loai dang dung (but = 7, da quang = 8). */
const LOAI_BUT = { but: { so: '7', khoa: 'overlay.but' }, daquang: { so: '8', khoa: 'overlay.daquang' } }
function capNhatNutBut(x) {
  const l = LOAI_BUT[x]
  if (l) {
    butChinhEl.dataset.tool = x; butChinhEl.dataset.so = l.so
    butChinhEl.setAttribute('data-i18n-title', l.khoa)
    datTieuDeNhom(butChinhEl)
    butNhomEl.classList.toggle('dq', x === 'daquang')
  }
  butMenuEl.querySelectorAll('.muc-xo').forEach((b) => b.classList.toggle('chon', b.dataset.tool === x))
}

/* LAM LAI: net bi hoan tac vao redoStack; ve net moi / doi vung = xoa hang doi. */
const redoStack = SuaNet.redo // mang DUNG CHUNG voi sua-net.js (lich su op: them / xoa / sua), chi doi do dai, khong gan lai
function capNhatRedo() { nutRedoEl.disabled = redoStack.length === 0 }
function themNet(s) { NetTay.danhDau(s); shapes.push(s); SuaNet.ghi({ k: 'them', s }) }
/* 06/11 KIEU VE TAY: giong man chup (overlay.js). Cong tac nam trong bang mau. */
const kieuTayEl = document.getElementById('kieu-tay')
function capNhatNutTay() { if (kieuTayEl) kieuTayEl.setAttribute('aria-pressed', NetTay.dangBat() ? 'true' : 'false') }
function bamKieuTay() {
  NetTay.dat(!NetTay.dangBat())
  capNhatNutTay()
  window.pin.datKieuTay(NetTay.dangBat())
  if (selectedShape && tool === 'select' && NetTay.duocPhep(selectedShape.type)) {
    const truoc = SuaNet.sao(selectedShape)
    if (NetTay.dangBat()) { selectedShape.tay = true; selectedShape.seed = selectedShape.seed || NetTay.taoSeed() } else { delete selectedShape.tay }
    SuaNet.ghiSua(selectedShape, truoc)
    redraw()
  }
}
/* Lop sua mo lai: net luu theo DIP luc ve; doi sang DIP cua anh ghim hien tai (he so f = dpr luc luu / pixel-tren-DIP hien tai). */
function doiTyLeNet(s, f) {
  if (Math.abs(f - 1) < 1e-6) return s
  for (const k of ['x1', 'y1', 'x2', 'y2', 'x', 'y', 'size']) if (typeof s[k] === 'number') s[k] *= f
  if (Array.isArray(s.pts)) s.pts = s.pts.map((v) => v * f)
  return s
}
function xoaRedo() { redoStack.length = 0; SuaNet.lichSu.length = 0; capNhatRedo() }
function lamLai() {
  if (!LAM_LAI_DUOC()) return
  if (oGoChu) return // dang go chu: bo qua (Ctrl+Z luc nay chi bo o go)
  soDangDat = null
  netDangVe = null
  if (!redoStack.length) return
  SuaNet.lamLai()
  if (selectedShape && !shapes.includes(selectedShape)) selectedShape = null
  danhSoLai() // so buoc luon lien nhau theo thu tu hien co
  capNhatRedo()
  redraw()
}
let veCtx = null
let veStart = null
let selectedShape = null
let dangKeoShape = false
let keoShapeStart = { x: 0, y: 0 }
let shapeBanDau = null
let suaDangKeo = null // dang keo MOT tay nam (co gian / xoay / dau mui ten) cua shape dang chon, xem sua-net.js

/* 06/11 Phien ve: luc vao ve ghi lai anh + kich thuoc dang hien de THOAT KHONG LUU thi tra ve dung nhu cu (da co the doi
   nen sang anh sach, hoac cat bot anh). `nenTuLop` = nen dang la anh sach cua lop sua (luu xong khong can gui anh sach lai).
   `nenDoi` = nen da bi cat (anh sach moi phai gui len main). */
let phien = null
let nenTuLop = false
let nenDoi = false
let nenHienTai = ''   // dataURL cua nen (anh CHUA ve net nao) dang dung trong phien
function vaoCheDoVe() {
  mode = 've'
  frame.classList.add('dang-ve')
  vuaThanh()
  shapes = []
  xoaRedo()
  dongPopups()
  phien = { src: anhDaLuu || img.src, w: dip.w, h: dip.h }
  nenTuLop = false; nenDoi = false; nenHienTai = phien.src
  if (lopSan && luuLopSuaBat) { // mo lai sua tiep: nen = anh sach, cac net cu hien lai
    const f = (lopSan.lop.dpr || 1) / ((lopSan.sachImg.naturalWidth || 1) / dip.w)
    shapes = lopSan.lop.shapes.map((x) => doiTyLeNet(JSON.parse(JSON.stringify(x)), f))
    nenHienTai = lopSan.lop.sach
    img.src = lopSan.lop.sach
    nenTuLop = true
    img.onload = () => { img.onload = null; redraw() }
    PLOG('mo lai lop sua: ' + shapes.length + ' net, he so ' + f.toFixed(4))
  }
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

/* giu = true khi vua LUU xong (anh dang hien la ban moi, khong tra ve ban cu). */
function thoatVe(giu) {
  huyOGoChu()
  if (cheTM) cheTM.dong()
  catXem = null; catDangKeo = null
  if (phien && giu !== true) { // huy ve: tra anh + kich thuoc ve nhu luc vao
    if (img.src !== phien.src) img.src = phien.src
    if (dip.w !== phien.w || dip.h !== phien.h) datCoAnh(phien.w, phien.h)
  }
  phien = null; nenTuLop = false; nenDoi = false
  mode = 'view'
  frame.classList.remove('dang-ve')
  vuaThanh()
  shapes = []
  xoaRedo()
  dongPopups()
  veStart = null
  soDangDat = null
  netDangVe = null
  selectedShape = null
  suaDangKeo = null
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
    const truocMau = SuaNet.sao(selectedShape)
    selectedShape.color = mau
    SuaNet.ghiSua(selectedShape, truocMau)
    redraw()
  }
  toolbarEl.querySelectorAll('.mau').forEach((b) => {
    b.classList.toggle('chon', b.dataset.color.toLowerCase() === mau.toLowerCase())
  })
  mauHienEl.firstElementChild.style.background = mau // cham mau tren thanh = mau dang chon
}

function chonCongCu(x) {
  // Doi cong cu giua luc keo: ghi cu keo vao lich su NGAY, truoc khi bo chon (khong thi khung Che bi keo di van tinh la dang che)
  if (suaDangKeo) { SuaNet.xong(suaDangKeo); suaDangKeo = null }
  if (dangKeoShape) { dangKeoShape = false; if (selectedShape && shapeBanDau) SuaNet.ghiSua(selectedShape, shapeBanDau); shapeBanDau = null }
  if (x !== tool) chotOGoChu()
  if (cheTM && cheTM.dangMo()) cheTM.dong()
  tool = x
  capNhatNutBut(x)
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
  if (s.type === 'so') {
    const r = R_SO + 4
    return { x: s.x - r, y: s.y - r, w: r * 2, h: r * 2 }
  }
  if (s.pts) return hopNet(s)
  return null
}

function timShapeTaiDiem(px, py) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i]
    const q = SuaNet.vaoKhung(s, px, py), lx = q.x, ly = q.y // shape da xoay: thu trung trong khung chua xoay cua no
    if (s.pts) {
      if (cachNet(s, lx, ly) <= doDayNet(s) / 2 + 6) return { shape: s, index: i }
    } else if (s.type === 'so') {
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
  SuaNet.ve(ctx, s) // khung chon + tay nam (co gian / xoay / dau mui ten): src/sua-net.js
}

/* Ve tren canvas — toa do cuc bo trong anh. */
veEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || mode !== 've') return
  const r = veEl.getBoundingClientRect()
  const lx = e.clientX - r.left, ly = e.clientY - r.top
  e.preventDefault()
  if (tool === 'select') {
    chotOGoChu()
    if (selectedShape) {
      const th = SuaNet.trungTay(selectedShape, lx, ly)
      if (th) { suaDangKeo = SuaNet.bat(selectedShape, th, lx, ly); return }
    }
    const hit = timShapeTaiDiem(lx, ly)
    if (hit) {
      selectedShape = hit.shape
      dangKeoShape = true
      keoShapeStart = { x: lx, y: ly }
      shapeBanDau = { ...hit.shape }
      if (hit.shape.pts) shapeBanDau.pts = hit.shape.pts.slice() // ban sao RIENG cua mang diem (khong thi keo la cong don)
    } else {
      selectedShape = null
    }
    redraw()
    return
  }
  if (tool === 'text') { moOGoChu(frame, lx, ly, veEl.offsetLeft, veEl.offsetTop); return }
  chotOGoChu()
  if (tool === 'cat') { catDangKeo = { x: lx, y: ly }; catXem = null; return } // 06/11 cat bo khuc giua
  if (tool === 'so') {
    // Bam = dong so ngay; con giu chuot thi keo chinh cho, tha ra la xong.
    soDangDat = { type: 'so', ...kepTamSo(lx, ly, dip.w, dip.h), color: curColor }
    themNet(soDangDat)
    redraw()
    return
  }
  if (tool === 'but' || tool === 'daquang') {
    // Giu chuot keo = ve net theo tay; giu Shift = duong THANG tu diem dau. Bam roi tha ngay = mot cham.
    netDangVe = { type: tool, pts: [lx, ly], color: curColor }
    themNet(netDangVe)
    redraw()
    return
  }
  veStart = { x: lx, y: ly }
})

window.addEventListener('mousemove', (e) => {
  if (mode !== 've') return
  const r = veEl.getBoundingClientRect()
  const lx = clamp(e.clientX - r.left, 0, dip.w)
  const ly = clamp(e.clientY - r.top, 0, dip.h)
  if (tool === 'select') {
    if (suaDangKeo) { SuaNet.keo(suaDangKeo, lx, ly, e.shiftKey); redraw(); return }
    if (dangKeoShape && selectedShape && shapeBanDau) {
      const dx = Math.round(lx - keoShapeStart.x)
      const dy = Math.round(ly - keoShapeStart.y)
      if (selectedShape.type === 'rect' || selectedShape.type === 'arrow' || selectedShape.type === 'blur') {
        selectedShape.x1 = shapeBanDau.x1 + dx
        selectedShape.y1 = shapeBanDau.y1 + dy
        selectedShape.x2 = shapeBanDau.x2 + dx
        selectedShape.y2 = shapeBanDau.y2 + dy
      } else if (selectedShape.type === 'text' || selectedShape.type === 'so') {
        selectedShape.x = shapeBanDau.x + dx
        selectedShape.y = shapeBanDau.y + dy
      } else if (selectedShape.pts && shapeBanDau.pts) {
        for (let i = 0; i < selectedShape.pts.length; i += 2) { selectedShape.pts[i] = shapeBanDau.pts[i] + dx; selectedShape.pts[i + 1] = shapeBanDau.pts[i + 1] + dy }
      }
      redraw()
    } else {
      const th = selectedShape ? SuaNet.trungTay(selectedShape, lx, ly) : null
      const hit = th ? null : timShapeTaiDiem(lx, ly)
      veEl.style.cursor = th ? SuaNet.conTro(th) : hit ? 'move' : 'default'
    }
    return
  }
  if (tool === 'cat') {
    if (catDangKeo) { catXem = catTinhDai(catDangKeo.x, catDangKeo.y, lx, ly); redraw() }
    return
  }
  if (soDangDat) {
    Object.assign(soDangDat, kepTamSo(lx, ly, dip.w, dip.h))
    redraw()
    return
  }
  if (netDangVe) {
    themDiemNet(netDangVe, lx, ly, e.shiftKey)
    redraw()
    return
  }
  if (!veStart) return
  redraw({ type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor, blurType: curBlurType })
})

window.addEventListener('mouseup', (e) => {
  if (mode !== 've') return
  if (tool === 'select' || suaDangKeo || dangKeoShape) { // doi cong cu bang phim giua luc keo van phai ket thuc cu keo
    if (suaDangKeo) { SuaNet.xong(suaDangKeo); suaDangKeo = null; redraw(); return }
    if (dangKeoShape) {
      dangKeoShape = false
      if (selectedShape && shapeBanDau) SuaNet.ghiSua(selectedShape, shapeBanDau)
      shapeBanDau = null
      redraw()
    }
    return
  }
  if (catDangKeo) { // tha chuot: bo dai dang keo
    const lx = clamp(e.clientX - veEl.getBoundingClientRect().left, 0, dip.w), ly = clamp(e.clientY - veEl.getBoundingClientRect().top, 0, dip.h)
    const dai = catTinhDai(catDangKeo.x, catDangKeo.y, lx, ly)
    catDangKeo = null; catXem = null
    if (dai.b - dai.a >= 4) catAp(dai.ngang, dai.a, dai.b)
    redraw()
    return
  }
  if (soDangDat) { soDangDat = null; return }
  if (netDangVe) { netDangVe = null; redraw(); return }
  if (!veStart) return
  const r = veEl.getBoundingClientRect()
  const lx = clamp(e.clientX - r.left, 0, dip.w)
  const ly = clamp(e.clientY - r.top, 0, dip.h)
  const s = { type: tool, x1: veStart.x, y1: veStart.y, x2: lx, y2: ly, color: curColor, blurType: curBlurType }
  veStart = null
  if (Math.abs(s.x2 - s.x1) < 3 && Math.abs(s.y2 - s.y1) < 3) { redraw(); return }
  themNet(s)
  redraw()
})

function hoanTac() {
  if (oGoChu) { huyOGoChu(); return }
  soDangDat = null
  netDangVe = null
  SuaNet.hoanTac()
  if (selectedShape && !shapes.includes(selectedShape)) selectedShape = null
  capNhatRedo()
  redraw()
}

/* ── 06/11 CAT BO KHUC GIUA ANH (phim X, ROADMAP 0k #2) ─────────────────────────────────────────────────────────────
   Keo mot dai NGANG (keo doc nhieu hon) hoac DOC (keo ngang nhieu hon) day tu mep nay sang mep kia, tha ra la BO dai do:
   hai phan con lai dinh vao nhau, anh va cua so nho di dung bang dai da bo. Cac net dang co dich theo (net nam han trong dai
   thi bi bo, net lo mot phan thi bi kep vao dung cho noi). "Mep cat ro" (bang mau, tuy chon) ve duong rang cua vao CHINH ANH
   tai cho noi. Moi lan cat la MOT buoc Hoan tac / Lam lai (op 'cat' trong sua-net.js: luu ca anh nen + kich thuoc + vi tri net
   truoc va sau). Anh luu ra dung kich thuoc moi. */
let catDangKeo = null   // diem bam dau cua dai dang keo (DIP cuc bo)
let catXem = null       // { ngang, a, b } dai dang keo, de ve xem truoc
let catMepBat = false   // ve duong rang cua o cho noi
function catTinhDai(x0, y0, x1, y1) {
  const ngang = Math.abs(y1 - y0) >= Math.abs(x1 - x0)
  const lo = ngang ? Math.min(y0, y1) : Math.min(x0, x1), hi = ngang ? Math.max(y0, y1) : Math.max(x0, x1)
  const tran = ngang ? dip.h : dip.w
  return { ngang, a: clamp(lo, 0, tran), b: clamp(hi, 0, tran) }
}
function veCatXem(ctx, d) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4])
  if (d.ngang) { ctx.fillRect(0, d.a, dip.w, d.b - d.a); ctx.beginPath(); ctx.moveTo(0, d.a); ctx.lineTo(dip.w, d.a); ctx.moveTo(0, d.b); ctx.lineTo(dip.w, d.b); ctx.stroke() }
  else { ctx.fillRect(d.a, 0, d.b - d.a, dip.h); ctx.beginPath(); ctx.moveTo(d.a, 0); ctx.lineTo(d.a, dip.h); ctx.moveTo(d.b, 0); ctx.lineTo(d.b, dip.h); ctx.stroke() }
  ctx.restore()
}
/* Doi kich thuoc anh ghim (DIP): khung, cua so (main), canvas ve. */
function datCoAnh(w, h) {
  dip = { w, h }
  frame.style.width = w + 'px'
  frame.style.height = h + 'px'
  window.pin.doiCo(w, h)
  if (veCtx) {
    veEl.width = Math.max(1, Math.round(w * DPR)); veEl.height = Math.max(1, Math.round(h * DPR))
    veEl.style.width = w + 'px'; veEl.style.height = h + 'px'
    veCtx = veEl.getContext('2d'); veCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
  }
  vuaThanh(); vuaBar()
}
/* Dat lai TRON trang thai (anh nen + kich thuoc + vi tri tung net) cua mot buoc cat — dung cho Hoan tac / Lam lai (sua-net.js). */
function catDatTrangThai(st) {
  img.src = st.src
  img.onload = () => { img.onload = null; redraw() }
  nenHienTai = st.src; nenDoi = st.nenDoi
  datCoAnh(st.w, st.h)
  shapes.length = 0
  for (const x of st.ds) { SuaNet.datLai(x.s, x.c); shapes.push(x.s) }
  selectedShape = null
  redraw()
}
/* Toa do mot net sau khi bo dai [a, b] (DIP) theo truc `t`: truoc dai giu nguyen, sau dai lui `len`, trong dai kep vao cho noi. */
const catMap = (v, a, b) => (v <= a ? v : v >= b ? v - (b - a) : a)
function catDichNet(s, ngang, a, b) {
  const X = ngang ? 'y' : 'x'
  if (s.pts) {
    let tat = true
    for (let i = ngang ? 1 : 0; i < s.pts.length; i += 2) if (s.pts[i] < a || s.pts[i] > b) tat = false
    if (tat) return false
    for (let i = ngang ? 1 : 0; i < s.pts.length; i += 2) s.pts[i] = catMap(s.pts[i], a, b)
    return true
  }
  if (s.type === 'text') { s[X] = catMap(s[X], a, b); return true }
  if (s.type === 'so') { if (s[X] > a && s[X] < b) return false; s[X] = catMap(s[X], a, b); return true }
  const k1 = X + '1', k2 = X + '2'
  if (s[k1] === undefined) return true
  const lo = Math.min(s[k1], s[k2]), hi = Math.max(s[k1], s[k2])
  if (lo >= a && hi <= b) return false
  s[k1] = catMap(s[k1], a, b); s[k2] = catMap(s[k2], a, b)
  return true
}
function catAp(ngang, a, b) {
  const nw = img.naturalWidth, nh = img.naturalHeight
  if (!nw || !nh || !img.complete) return false
  const kx = nw / dip.w, ky = nh / dip.h, k = ngang ? ky : kx
  const p0 = Math.round(a * k), p1 = Math.round(b * k)
  const lenPx = p1 - p0, tong = ngang ? nh : nw
  if (lenPx < 2 || tong - lenPx < 8) return false // phai con lai it nhat 8 px
  const ow = ngang ? nw : nw - lenPx, oh = ngang ? nh - lenPx : nh
  const out = document.createElement('canvas')
  out.width = ow; out.height = oh
  const c = out.getContext('2d')
  if (ngang) { c.drawImage(img, 0, 0, nw, p0, 0, 0, nw, p0); c.drawImage(img, 0, p1, nw, nh - p1, 0, p0, nw, nh - p1) }
  else { c.drawImage(img, 0, 0, p0, nh, 0, 0, p0, nh); c.drawImage(img, p1, 0, nw - p1, nh, p0, 0, nw - p1, nh) }
  if (catMepBat) veMepCat(c, ngang, p0, ngang ? ow : oh, k)
  const dataUrl = out.toDataURL('image/png')
  const ds0 = shapes.map((s) => ({ s, c: SuaNet.sao(s) }))
  const truoc = { src: nenHienTai, w: dip.w, h: dip.h, ds: ds0, nenDoi }
  const dipMoi = ngang ? { w: dip.w, h: Math.max(8, Math.round(oh / ky)) } : { w: Math.max(8, Math.round(ow / kx)), h: dip.h }
  const aD = p0 / k, bD = p1 / k
  const giu = []
  for (const s of shapes) if (catDichNet(s, ngang, aD, bD)) giu.push(s)
  const sau = { src: dataUrl, w: dipMoi.w, h: dipMoi.h, ds: giu.map((s) => ({ s, c: SuaNet.sao(s) })), nenDoi: true }
  catDatTrangThai(sau)
  SuaNet.ghi({ k: 'cat', ap: catDatTrangThai, truoc, sau })
  PLOG('cat ' + (ngang ? 'ngang' : 'doc') + ' ' + p0 + '..' + p1 + ' px: anh ' + nw + 'x' + nh + ' -> ' + ow + 'x' + oh + ', net ' + ds0.length + ' -> ' + giu.length)
  return true
}
/* Duong rang cua o cho noi (vao anh nen): vien toi mo + net trang, de nhin ra cho da cat. p = vi tri noi (px anh), dai = chieu dai duong, k = px/DIP. */
function veMepCat(c, ngang, p, dai, k) {
  const buoc = 9 * k, bien = 3 * k
  c.save()
  c.lineJoin = 'miter'; c.lineCap = 'butt'
  for (const [w, mau] of [[4.5 * k, 'rgba(0,0,0,0.45)'], [2 * k, '#ffffff']]) {
    c.lineWidth = w; c.strokeStyle = mau
    c.beginPath()
    for (let t = 0, i = 0; t <= dai + buoc; t += buoc / 2, i++) {
      const o = (i % 2 ? bien : -bien), tt = Math.min(t, dai)
      if (ngang) { if (i === 0) c.moveTo(tt, p + o); else c.lineTo(tt, p + o) }
      else { if (i === 0) c.moveTo(p + o, tt); else c.lineTo(p + o, tt) }
    }
    c.stroke()
  }
  c.restore()
}

/* ── BUT VE TAY (phim 7) + BUT DA QUANG (phim 8) — 06/10. CUNG ham voi overlay.js (xem ghi chu day du o do):
   6 ham + hang NET duoi day phai GIONG HET hai file, bai do `npm run test:butve` so tung ky tu. */
const NET = { but: { day: 3, mo: 1 }, daquang: { day: 16, mo: 0.4 } }
let netDangVe = null // net dang ve do (chuot con giu)
function doDayNet(s) { return (NET[s.type] || NET.but).day }
/* k = he so phong (1 khi ve tren man; anh that / kich thuoc hien thi khi xuat). */
function veNet(ctx, s, k) {
  const p = s.pts, n = p.length >> 1
  if (!n) return
  const c = NET[s.type] || NET.but
  ctx.save()
  ctx.globalAlpha = c.mo
  ctx.strokeStyle = s.color; ctx.fillStyle = s.color
  ctx.lineWidth = c.day * k; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.beginPath()
  if (n === 1) { // bam roi tha ngay: mot cham tron
    ctx.arc(p[0] * k, p[1] * k, c.day * k / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return
  }
  ctx.moveTo(p[0] * k, p[1] * k)
  for (let i = 1; i < n - 1; i++) {
    ctx.quadraticCurveTo(p[i * 2] * k, p[i * 2 + 1] * k, (p[i * 2] + p[i * 2 + 2]) / 2 * k, (p[i * 2 + 1] + p[i * 2 + 3]) / 2 * k)
  }
  ctx.lineTo(p[n * 2 - 2] * k, p[n * 2 - 1] * k)
  ctx.stroke()
  ctx.restore()
}
/* Hop bao (da tinh do day net + 3 px le) — khung chon cua cong cu V */
function hopNet(s) {
  const p = s.pts
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1] }
  const le = doDayNet(s) / 2 + 3
  return { x: x0 - le, y: y0 - le, w: x1 - x0 + le * 2, h: y1 - y0 + le * 2 }
}
/* Khoang cach tu diem (lx, ly) toi net (gan nhat trong cac doan) */
function cachNet(s, lx, ly) {
  const p = s.pts
  if (p.length === 2) return Math.hypot(lx - p[0], ly - p[1])
  let tot = Infinity
  for (let i = 0; i + 3 < p.length; i += 2) {
    const dx = p[i + 2] - p[i], dy = p[i + 3] - p[i + 1], l2 = dx * dx + dy * dy
    let t = l2 ? ((lx - p[i]) * dx + (ly - p[i + 1]) * dy) / l2 : 0
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const d = Math.hypot(lx - (p[i] + t * dx), ly - (p[i + 1] + t * dy))
    if (d < tot) tot = d
  }
  return tot
}
function dichNet(s, dx, dy) { for (let i = 0; i < s.pts.length; i += 2) { s.pts[i] += dx; s.pts[i + 1] += dy } }
/* Them diem luc dang ve. thang = dang giu Shift: net chi con 2 diem dau - cuoi. Bo diem cach diem truoc duoi 2 px
   (chuot rung) de net khong nang va khong rang cua. */
function themDiemNet(s, x, y, thang) {
  const p = s.pts
  if (thang) { s.pts = [p[0], p[1], x, y]; return }
  const n = p.length
  if (Math.hypot(x - p[n - 2], y - p[n - 1]) < 2) return
  p.push(x, y)
}

/* ── Cong cu DANH SO BUOC (phim 6, 02/10) — CUNG ham voi overlay.js, sua ben nay thi sua ca ben do ─────────
   Bam len anh = huy hieu tron co so, bam tiep la 2, 3, 4... Shape {type:'so', x, y (TAM, DIP), n, color}. So dem lai
   theo thu tu trong shapes moi lan ve -> hoan tac / xoa mot so o giua thi cac so con lai tu don lai lien nhau.
   ☠️ Dem lai tu 1 moi lan VAO che do ve: so da luu vao anh o luot truoc la diem anh, app khong con biet. */
const R_SO = 13 // ban kinh huy hieu, px DIP
let soDangDat = null // huy hieu vua bam, con dang giu chuot de chinh cho
function danhSoLai() { let n = 0; for (const s of shapes) if (s.type === 'so') s.n = ++n }
function kepTamSo(lx, ly, w, h) {
  const le = R_SO + 3
  return {
    x: w > le * 2 ? clamp(Math.round(lx), le, w - le) : Math.round(w / 2),
    y: h > le * 2 ? clamp(Math.round(ly), le, h - le) : Math.round(h / 2)
  }
}
/* Mau chu so: trang, tru khi nen sang (vang, xanh la, trang) thi den — do tuong phan WCAG voi chu trang, nguong 2,6. */
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
  if (s.rot) { ctx.translate(cx, cy); ctx.rotate(s.rot); ctx.translate(-cx, -cy) }
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 4 * kb; ctx.shadowOffsetY = 1 * kb
  ctx.fillStyle = s.color; ctx.lineWidth = 2 * k; ctx.strokeStyle = chu
  if (s.tay) NetTay.huyHieu(ctx, cx, cy, r, s.seed, k) // 06/11 ve tay: vien khong tron dung
  else { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke() }
  ctx.shadowColor = 'transparent'
  ctx.font = '700 ' + ((so.length > 2 ? 10 : so.length > 1 ? 12 : 14) * k) + 'px Inter, "Segoe UI", sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(so)
  ctx.fillStyle = chu
  ctx.fillText(so, cx + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2) // can theo NET chu, khong theo o chu
  ctx.restore()
}

function redraw(preview) {
  if (!veCtx) return
  veCtx.clearRect(0, 0, dip.w, dip.h)
  danhSoLai()
  const ds = preview ? shapes.concat(preview) : shapes
  for (const s of ds) veShape(veCtx, s, 1)
  if (selectedShape && tool === 'select') {
    veKhungChonShape(veCtx, selectedShape)
  }
  if (catXem) veCatXem(veCtx, catXem)
  if (cheTM) cheTM.lamMoi() // Hoan tac / Lam lai / xoa net: khung "da che" theo kip
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

let offscreenLotMo = null
function veBlurSmooth(ctx, x, y, w, h, k) {
  if (w <= 0 || h <= 0) return
  if (!img || !img.naturalWidth) return
  const kScale = img.naturalWidth / dip.w
  const sx = x * kScale
  const sy = y * kScale
  const sw = w * kScale
  const sh = h * kScale

  const pad = Math.round(20 * kScale)
  const sxPad = Math.max(0, sx - pad)
  const syPad = Math.max(0, sy - pad)
  const swPad = Math.min(img.naturalWidth - sxPad, sw + (sx - sxPad) + pad)
  const shPad = Math.min(img.naturalHeight - syPad, sh + (sy - syPad) + pad)

  const dx = (x * k) - ((sx - sxPad) / kScale) * k
  const dy = (y * k) - ((sy - syPad) / kScale) * k
  const dw = (swPad / kScale) * k
  const dh = (shPad / kScale) * k

  const blurRadius = Math.max(4, Math.round(10 * k))

  // [do 28/09 Claude ra soat] sat mep ANH GHIM, blur lay mau ra ngoai = trong suot ->
  // lo chu goc khi luu (do: lop ve chi 89-104/255). Lot 1 lop DUC thu nho ~40 DIP/diem.
  const lw = Math.max(1, Math.round(w / 40)), lh = Math.max(1, Math.round(h / 40))
  if (!offscreenLotMo) offscreenLotMo = document.createElement('canvas')
  offscreenLotMo.width = lw
  offscreenLotMo.height = lh
  const lotCtx = offscreenLotMo.getContext('2d')
  lotCtx.imageSmoothingEnabled = true
  lotCtx.imageSmoothingQuality = 'high'
  lotCtx.drawImage(img, sx, sy, sw, sh, 0, 0, lw, lh)

  ctx.save()
  ctx.beginPath()
  ctx.rect(x * k, y * k, w * k, h * k)
  ctx.clip()
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(offscreenLotMo, 0, 0, lw, lh, x * k, y * k, w * k, h * k)
  ctx.filter = 'blur(' + blurRadius + 'px)'
  ctx.drawImage(img, sxPad, syPad, swPad, shPad, dx, dy, dw, dh)
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1 * k
  ctx.strokeRect(x * k, y * k, w * k, h * k)
  ctx.restore()
}

/* k = he so phong (1 khi xem truoc; naturalW/dipW khi xuat ra anh that). */
/* 04/10 KIEU THU BA "TO KIN": thanh DAC che han, khong lay diem anh nao cua anh goc (xem src/overlay/overlay.js veCheKin).
   Cung cach ve voi ban ben do, chi khac he so k (anh ghim xuat ra co to hon co hien). Bai do: npm run test:chekin. */
function veCheKin(ctx, x, y, w, h, k) {
  if (w <= 0 || h <= 0) return
  ctx.save()
  ctx.globalAlpha = 1
  ctx.filter = 'none'
  ctx.fillStyle = '#000'
  ctx.fillRect(x * k, y * k, w * k, h * k)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1 * k
  ctx.strokeRect(x * k, y * k, w * k, h * k)
  ctx.restore()
}

function veShape(ctx, s, k) {
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = 3 * k
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (s.type === 'rect') {
    const x = Math.min(s.x1, s.x2) * k, y = Math.min(s.y1, s.y2) * k, w = Math.abs(s.x2 - s.x1) * k, h = Math.abs(s.y2 - s.y1) * k
    if (s.tay) { ctx.save(); if (s.rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(s.rot); NetTay.khung(ctx, -w / 2, -h / 2, w, h, s.seed, k) } else NetTay.khung(ctx, x, y, w, h, s.seed, k); ctx.restore() }
    else if (s.rot) { ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(s.rot); ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.restore() }
    else ctx.strokeRect(x, y, w, h)
  } else if (s.type === 'arrow') {
    if (s.tay) NetTay.muiTen(ctx, s.x1 * k, s.y1 * k, s.x2 * k, s.y2 * k, s.seed, k, 13 * k)
    else veMuiTen(ctx, s.x1 * k, s.y1 * k, s.x2 * k, s.y2 * k, 13 * k)
  } else if (s.type === 'text') {
    veChu(ctx, s, k)
  } else if (s.type === 'so') {
    veSo(ctx, s, k)
  } else if (s.pts) {
    veNet(ctx, s, k)
  } else if (s.type === 'blur') {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2)
    const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1)
    const bType = s.blurType || curBlurType
    if (bType === 'blur') {
      veBlurSmooth(ctx, x, y, w, h, k)
    } else if (bType === 'kin') {
      veCheKin(ctx, x, y, w, h, k)
    } else {
      veBlurPixelate(ctx, x, y, w, h, k)
    }
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
  if (mau) { chonMau(mau.dataset.color); dongBangMau(); return }
  if (e.target.closest('#mau-hien')) { if (bangMauMo()) dongBangMau(); else moBangMau(); return }
  if (e.target.closest('#kieu-tay')) { bamKieuTay(); return } // 06/11: cong tac nam trong bang mau, giu bang mo
  if (e.target.closest('#cat-mep')) { catMepBat = !catMepBat; document.getElementById('cat-mep').setAttribute('aria-pressed', catMepBat ? 'true' : 'false'); return }
  if (e.target.closest('#lop-xoa')) { // xoa ban sach: sau do khong sua lai duoc cac net cu cua anh nay
    window.pin.lopXoa().then(() => { lopLan++; lopSan = null; lopTat = true; nenTuLop = false; hienNutXoaSach(); PLOG('da xoa lop sua') })
    dongBangMau(); return
  }
  const b = e.target.closest('button')
  if (!b) return
  dongPopups() // bam bat cu nut nao khac = dong bang mau / menu but
  if (b.dataset.tool === 'che') { chuyenChe(); return }
  if (b.dataset.tool) { if (mode !== 've') vaoCheDoVe(); chonCongCu(b.dataset.tool) } // 14/09: bam chuot cung vao ve duoc
  else if (b.id === 'undo') hoanTac()
  else if (b.id === 'redo') lamLai()
  else if (b.id === 'huy') thoatVe()
  else if (b.id === 'xong') luuVe()
})

/* Luu: ghep anh goc (do phan giai THAT cua anh) + shape phong theo ty le,
   hien ngay tren cua so ghim + gui main ghi de file + cap nhat khay. */
function luuVe(chep, lanCho) {
  chotOGoChu()
  // 06/11: co thay doi nao khong? (net, cat bo, hoac mo lai lop sua roi xoa het net) — khong thi thoat, tra anh ve nhu cu
  if (!phienCoThayDoi()) { thoatVe(); return }
  if ((!img.complete || !img.naturalWidth) && (lanCho || 0) < 50) { setTimeout(() => luuVe(chep, (lanCho || 0) + 1), 40); return } // nen moi (anh sach / sau cat) chua nap xong
  let daLuu = false
  try {
    const nw = img.naturalWidth, nh = img.naturalHeight
    if (!nw || !nh) { thoatVe(); return }
    const k = nw / dip.w // anh that / kich thuoc hien thi (thuong = scaleFactor)
    const out = document.createElement('canvas')
    out.width = nw
    out.height = nh
    const ctx = out.getContext('2d')
    ctx.drawImage(img, 0, 0, nw, nh)
    danhSoLai()
    for (const s of shapes) veShape(ctx, s, k)
    const dataUrl = out.toDataURL('image/png')
    /* 06/11 LOP SUA: gui kem cac net + anh sach (nen chua ve). Nen van la anh sach cua lop sua cu thi gui null (main giu ban dang co). */
    let lop = null
    if (luuLopSuaBat) {
      try { lop = { shapes: lopTat ? [] : JSON.parse(JSON.stringify(shapes)), dpr: k, dipW: dip.w, dipH: dip.h, sach: (nenTuLop && !nenDoi) ? null : nenHienTai } } catch (err) { lop = null }
    }
    img.src = dataUrl            // cua so ghim hien ban da ve ngay
    anhDaLuu = dataUrl
    window.pin.saveEdit(dataUrl, chep === true, lop) // main: ghi de file + cap nhat thumbnail khay + luu lop sua
    daLuu = true
  } catch (err) { /* ghep loi thi giu nguyen anh cu */ }
  thoatVe(daLuu)
  if (daLuu) setTimeout(layLopSua, 200) // lay lai lop sua vua luu (lan sau vao ve thi mo lai duoc)
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
function kichThuocVe() { return { w: dip.w, h: dip.h } } // cho sua-net.js: gioi han keo dau mui ten

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
  themNet(s)
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
  ctx.save()
  if (s.rot) { ctx.translate(bx + bw / 2, by + bh / 2); ctx.rotate(s.rot); ctx.translate(-(bx + bw / 2), -(by + bh / 2)) }
  ctx.fillStyle = NEN_CHU
  if (s.tay) NetTay.nenChu(ctx, bx, by, bw, bh, s.seed, k, s.color) // 06/11 ve tay: nen + vien goc le
  else {
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, r); else ctx.rect(bx, by, bw, bh)
    ctx.fill()
  }
  ctx.fillStyle = s.color
  for (let i = 0; i < dong.length; i++) {
    ctx.fillText(dong[i], bx + px, by + py + i * lh)
  }
  ctx.restore()
}

/* ── 05/11 CHE THONG MINH (phim C, menu xo cua nut Lam mo) ─────────────────────────────────────────────
   Giong man chup (overlay.js): doc chu CA ANH ghim bang Tesseract (main: pin:ocr-tu, kem toa do), hien khung tung tu / dong;
   bam chu = che (to kin, blurType 'kin'), Tu che = email / so dien thoai / so the / link, Che moi cho trung.
   Khi bam Xong, luuVe() ghep lop che len anh THAT (veShape voi he so k) roi ghi de file. Logic: src/che-thong-minh.js. */
/* 06/11 (soat dot 3, muc 7): da cat bo (hoac mo lai lop sua) thi nen dang hien KHAC rec.image o main -> gui chinh nen dang hien, khong
   de main doc anh cu (khung nhan dien + phan che se lech dung so pixel da cat). Chua doi gi thi null: main dung anh ghim nhu cu. */
function nenChoOcr() { return mode === 've' && (nenDoi || nenTuLop) && nenHienTai ? nenHienTai : null }
const heSoAnh = () => ((img.naturalWidth || dip.w * DPR) / dip.w) // pixel anh that / DIP hien thi
function themNhomChe(ds) {
  for (const x of ds) themNet(x) // 05/11: ghi vao lich su; cung `nhom` = mot buoc Hoan tac (src/sua-net.js)
  redraw()
}
function datThanhChe(strip) {
  strip.style.position = ''; strip.style.left = ''; strip.style.top = ''; strip.style.transform = ''; strip.style.bottom = ''
  // thanh dieu khien nam ngay tren thanh cong cu (CSS .che-strip bottom 50px); anh qua be thi CSS cho cuon ngang
}
function chuyenChe() {
  if (cheTM.dangMo()) { cheTM.dong(); return }
  if (mode !== 've') vaoCheDoVe()
  chotOGoChu()
  cheTM.mo()
}
cheTM = window.CheTMUI.tao({
  goc: frame, rect: () => ({ x: 0, y: 0, w: dip.w, h: dip.h }), heSo: heSoAnh, shapes: () => shapes, veLai: () => redraw(),
  them: themNhomChe, daBo: (ds) => { for (const x of ds) SuaNet.ghi({ k: 'xoa', s: x.s, idx: x.idx, nhom: x.nhom }) }, doc: () => window.pin.ocrTu(nenChoOcr()), datThanh: datThanhChe, t: (k) => window.i18n.t(k), log: PLOG,
  nut: document.getElementById('che-muc'),
})
cheMenu = window.CheTMUI.ganMenuXo({
  nhom: document.getElementById('lam-mo-nhom'), chinh: document.getElementById('lam-mo-chinh'), menu: document.getElementById('lam-mo-menu'),
  xep: xepXo, dongKhac: () => { dongBangMau(); dongMenuBut() },
})
