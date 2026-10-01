'use strict'

/* =========================================================================
   AiO Shot & Save — KHAY VIDEO (01/10)
   Anh Tien chot 01/10: video quay vung man hinh nam o KHAY RIENG (khong chung khay anh).
   - Danh sach lay tu so cua main (src/kho-video.js), MOI NHAT o tren. File MP4 that nam trong thu muc anh.
   - Moi doan 1 hang: bam vao video = phat / dung · CA HANG keo duoc (tha file MP4 vao Premiere / Zalo / Messenger)
     · Mo thu muc · Xoa (dua vao Thung rac, bam 2 lan, nut noi ro dung luong).
   - Khung dau cua video duoc ve ra canvas nho -> gui main lam ICON luc keo.
   ========================================================================= */

const t = (k, params) => window.i18n ? window.i18n.t(k, params) : k
const EN = !!window.i18n && window.i18n.lang === 'en'

const dsEl = document.getElementById('ds-video')
const trongEl = document.getElementById('trong')
const demEl = document.getElementById('shot-badge')
const toastEl = document.getElementById('toast')
let ds = []
let toastTimer = null

document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })
document.querySelectorAll('[data-i18n-title]').forEach((el) => {
  const s = t(el.getAttribute('data-i18n-title'))
  el.title = s
  el.setAttribute('aria-label', s)
})

function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer)
  toastEl.textContent = msg
  toastEl.classList.add('show')
  toastTimer = setTimeout(() => { toastEl.classList.remove('show'); toastTimer = null }, 2200)
}

const ICON = {
  xoa: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  phat: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
}

const p2 = (v) => String(v).padStart(2, '0')
function gio(iso) {
  const d = new Date(iso)
  return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ' · ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1)
}
/* 12.300 ms -> "0:12" (lam tron XUONG giay, toi thieu 0:01 cho doan duoi 1 giay) */
function thoiLuong(ms) {
  const s = Math.max(1, Math.floor((ms || 0) / 1000))
  return Math.floor(s / 60) + ':' + p2(s % 60)
}
/* byte -> "2,4 MB" (VI dung dau phay) / "2.4 MB" (EN); duoi 1 MB thi KB */
function dungLuong(b) {
  const so = (x) => (EN ? String(x) : String(x).replace('.', ','))
  if (b >= 1024 * 1024) return so((b / 1024 / 1024).toFixed(b >= 100 * 1024 * 1024 ? 0 : 1)) + ' MB'
  return Math.max(1, Math.round(b / 1024)) + ' KB'
}

function capNhatDem() {
  demEl.textContent = String(ds.length)
  trongEl.hidden = ds.length > 0
}

function nut(cls, chu, title) {
  const b = document.createElement('button')
  b.className = cls
  if (chu) b.textContent = chu
  if (title) { b.title = title; b.setAttribute('aria-label', title) }
  return b
}

function veDanhSach() {
  dsEl.textContent = ''
  ds.forEach((m, i) => dsEl.appendChild(taoHang(m, ds.length - i)))
  capNhatDem()
}

function taoHang(m, so) {
  const hang = document.createElement('section')
  hang.className = 'dai vd'
  hang.dataset.id = m.id

  const dau = document.createElement('div')
  dau.className = 'dai-dau'
  const ten = document.createElement('span')
  ten.className = 'dai-ten'
  ten.textContent = t('vd.ten', { n: p2(so) })
  const meta = document.createElement('span')
  meta.className = 'dai-meta'
  meta.textContent = [gio(m.taoLuc), thoiLuong(m.ms), m.w + '×' + m.h, dungLuong(m.bytes)].join(' · ')
  meta.title = m.ten
  const spacer = document.createElement('span')
  spacer.className = 'spacer'

  /* 01/10 anh chot: quay LUON co tieng, vao khay moi chon. Cum 2 nut (khuon .chon-nhom cua man Cai dat): ban dang chon
     = ban duoc PHAT o day va ban duoc KEO THA / Mo thu muc. Lan dau chon "Khong tieng" main tao file "-khong-tieng.mp4"
     canh ban goc (khong nen lai hinh). Video quay khong co tieng thi khong co cum nay. */
  let nhomTieng = null
  if (m.coNutTieng) {
    nhomTieng = document.createElement('div')
    nhomTieng.className = 'chon-nhom chon-tieng'
    nhomTieng.setAttribute('role', 'group')
    nhomTieng.title = t('vd.chonTieng')
    const bCo = nut('chon-nut', t('vd.coTiengNut'))
    const bKhong = nut('chon-nut', t('vd.khongTieng'))
    const ve = () => {
      bCo.classList.toggle('active', !m.boTieng); bKhong.classList.toggle('active', !!m.boTieng)
      bCo.setAttribute('aria-pressed', String(!m.boTieng)); bKhong.setAttribute('aria-pressed', String(!!m.boTieng))
      v.muted = !!m.boTieng
    }
    const chon = async (coTieng) => {
      if (!!m.boTieng === !coTieng) return
      bCo.disabled = bKhong.disabled = true
      let r = null
      try { r = await window.video.chonTieng(m.id, coTieng) } catch (e) {}
      bCo.disabled = bKhong.disabled = false
      if (!r || !r.ok) { showToast(t('vd.khongBoDuocTieng')); return }
      m.boTieng = !!r.boTieng
      if (r.bytesXoa) { m.bytesXoa = r.bytesXoa; datTieuDeXoa() }
      ve()
    }
    bCo.addEventListener('click', () => chon(true))
    bKhong.addEventListener('click', () => chon(false))
    nhomTieng.append(bCo, bKhong)
    nhomTieng.ve = ve
  }

  const bKeo = nut('nut', t('vd.keoNut'), t('vd.keo'))
  const bMo = nut('nut', t('vd.moThuMuc'))
  bMo.addEventListener('click', () => window.video.moThuMuc(m.id))
  const bXoa = nut('nut icon', '', '')
  // Nut xoa noi dung luong THAT se vao Thung rac (ban goc + ban khong tieng neu da tao)
  const datTieuDeXoa = () => { const s = t('vd.xoa', { mb: dungLuong(m.bytesXoa || m.bytes) }); bXoa.title = s; bXoa.setAttribute('aria-label', s) }
  datTieuDeXoa()
  bXoa.innerHTML = ICON.xoa
  // Xoa = bam 2 lan (lan 1 doi chu 3 giay). File vao Thung rac (lay lai duoc); nut noi ro dung luong.
  let choXoa = null
  bXoa.addEventListener('click', async () => {
    if (!choXoa) {
      bXoa.classList.add('xac-nhan'); bXoa.textContent = t('vd.xoaXacNhan')
      choXoa = setTimeout(() => { choXoa = null; bXoa.classList.remove('xac-nhan'); bXoa.innerHTML = ICON.xoa }, 3000)
      return
    }
    clearTimeout(choXoa); choXoa = null
    v.pause(); v.removeAttribute('src'); v.load() // nha file truoc khi dua vao Thung rac (Windows khoa file dang mo)
    const r = await window.video.xoa(m.id)
    if (r && r.ok) {
      ds = ds.filter((x) => x.id !== m.id)
      veDanhSach()
      showToast(t('vd.daXoa'))
    } else {
      bXoa.classList.remove('xac-nhan'); bXoa.innerHTML = ICON.xoa
      datTieuDeXoa()
      v.src = m.url
      showToast(t('vd.khongXoaDuoc'))
    }
  })
  dau.append(ten, meta, spacer, ...(nhomTieng ? [nhomTieng] : []), bKeo, bMo, bXoa)

  const khung = document.createElement('div')
  khung.className = 'vd-khung'
  khung.title = t('vd.phat')
  const v = document.createElement('video')
  v.preload = 'metadata'
  v.playsInline = true
  v.draggable = false
  v.src = m.url
  if (m.w && m.h) v.style.aspectRatio = m.w + ' / ' + m.h // giu dung ti le truoc khi nap xong
  if (nhomTieng) nhomTieng.ve() // to nut dang chon + tat tieng trinh phat neu dang chon ban Khong tieng
  const phat = document.createElement('span')
  phat.className = 'vd-phat'
  phat.innerHTML = ICON.phat
  const nhanGio = document.createElement('span')
  nhanGio.className = 'vd-gio'
  nhanGio.textContent = thoiLuong(m.ms)
  const thanh = document.createElement('span')
  thanh.className = 'vd-thanh'
  const vach = document.createElement('i')
  thanh.appendChild(vach)
  khung.append(v, phat, nhanGio, thanh)

  // Khung dau: tua nhe de trinh duyet giai ma 1 khung (preload=metadata chua chac da ve), roi ve icon keo
  let daIcon = false
  v.addEventListener('loadedmetadata', () => { try { v.currentTime = Math.min(0.1, (v.duration || 1) / 2) } catch (e) {} })
  v.addEventListener('seeked', () => {
    if (daIcon) return
    daIcon = true
    try {
      const cv = document.createElement('canvas')
      const w = 160, h = Math.max(1, Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16)))
      cv.width = w; cv.height = Math.min(h, 240)
      cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height)
      window.video.icon(m.id, cv.toDataURL('image/png'))
    } catch (e) { /* khong ve duoc icon -> main dung logo app */ }
  })
  v.addEventListener('play', () => hang.classList.add('dang-phat'))
  v.addEventListener('pause', () => hang.classList.remove('dang-phat'))
  v.addEventListener('ended', () => { hang.classList.remove('dang-phat'); vach.style.width = '0' })
  v.addEventListener('timeupdate', () => {
    const d = isFinite(v.duration) && v.duration > 0 ? v.duration : (m.ms || 0) / 1000
    vach.style.width = d ? Math.min(100, (v.currentTime / d) * 100) + '%' : '0'
  })
  khung.addEventListener('click', () => {
    if (v.paused) {
      // Mot luc chi mot video phat
      document.querySelectorAll('#ds-video video').forEach((x) => { if (x !== v) x.pause() })
      if (v.ended) v.currentTime = 0
      v.play().catch(() => {})
    } else v.pause()
  })

  /* CA HANG la mon keo duoc (nut Keo nam trong hang nen keo tu nut cung chay). startDrag phai goi trong nhip
     dragstart that -> chi gui id, main da co san duong dan file + icon. */
  hang.draggable = true
  hang.addEventListener('dragstart', (e) => {
    e.preventDefault()
    v.pause()
    hang.classList.add('dang-keo')
    setTimeout(() => hang.classList.remove('dang-keo'), 400)
    window.video.keo(m.id)
  })

  hang.append(dau, khung)
  return hang
}

async function init() {
  let data = null
  try { data = await window.video.getData() } catch (err) { console.error('Loi nap khay video:', err) }
  ds = (data && data.ds) || []
  veDanhSach()
}

document.getElementById('btn-close').addEventListener('click', () => window.video.close())
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); window.video.close() }
})

init()
