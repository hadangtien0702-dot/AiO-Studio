'use strict'

/* =========================================================================
   AiO Shot & Save — KHAY VIDEO (01/10)
   Anh Tien chot 01/10: video quay vung man hinh nam o KHAY RIENG (khong chung khay anh).
   - Danh sach lay tu so cua main (src/kho-video.js), MOI NHAT o tren. File MP4 that nam trong thu muc anh.
   - Moi doan 1 hang: bam vao video = phat / dung · CA HANG keo duoc (tha file MP4 vao Premiere / Zalo / Messenger)
     · Mo thu muc · Xoa (dua vao Thung rac, bam 2 lan, nut noi ro dung luong).
   - Khung dau cua video duoc ve ra canvas nho -> gui main lam ICON luc keo.
   ========================================================================= */

/* 01/10 GOP KHAY: chung trang voi src/storyboard/storyboard.js (src/khay/index.html, 2 the) -> boc trong ham de ten
   bien khong dung nhau. Nut dong + phim Esc do storyboard.js lo cho ca cua so. */
;(() => {
const t = (k, params) => window.i18n ? window.i18n.t(k, params) : k
const EN = !!window.i18n && window.i18n.lang === 'en'

const dsEl = document.getElementById('ds-video')
const trongEl = document.getElementById('trong-video')
const demEl = document.getElementById('dem-video') // so video, nam tren the Video
const toastEl = document.getElementById('toast')
let ds = []
let toastTimer = null
let gifToiDaMs = 60000        // tran thoi luong tao GIF (main gui trong getData)
const tienDoGif = new Map()   // id video dang tao GIF -> ham nhan tien do 0..1

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
  // 01/10 (anh: "dong bo font / text"): thoi luong da nam tren khung video (.vd-gio) -> khong noi lai o day (mot thong diep mot noi)
  // 02/10: muc duoc dua lai vao so (so hong / file quay do) khong co so do luc quay (w = h = ms = 0) -> doc tu chinh video
  // 06/10: dang chon ban GIF thi dong nay noi ve FILE GIF (thu se duoc keo di): "GIF · 2,0 MB" thay cho co + dung luong video
  const veMeta = () => {
    meta.textContent = (m.chonGif
      ? [gio(m.taoLuc), 'GIF', dungLuong(m.bytesGif || 0)]
      : [gio(m.taoLuc), ...(m.w && m.h ? [m.w + '×' + m.h] : []), dungLuong(m.bytes)]).join(' · ')
  }
  veMeta()
  meta.title = m.ten
  /* 02/10 (ECC soat, muc A3): luot quay ket thuc vi loi giua chung / app bi tat giua luc quay -> noi ro tren hang,
     khong de nguoi dung tuong la doan quay du. */
  let nhanLoi = null
  if (m.loi) {
    nhanLoi = document.createElement('span')
    nhanLoi.className = 'vd-bi-ngat'
    nhanLoi.textContent = t('vd.biNgat')
    nhanLoi.title = t('vd.biNgatGoiY')
  }
  const spacer = document.createElement('span')
  spacer.className = 'spacer'

  /* 01/10 anh chot: quay LUON co tieng, vao khay moi chon. Cum 2 nut (khuon .chon-nhom cua man Cai dat): ban dang chon
     = ban duoc PHAT o day va ban duoc KEO THA / Mo thu muc. Lan dau chon "Khong tieng" main tao file "-khong-tieng.mp4"
     canh ban goc (khong nen lai hinh). Video quay khong co tieng thi khong co cum nay. */
  /* 06/10 them o GIF vao CUNG cum do (mot mo hinh: chon ben nao thi ben do duoc keo tha). Video co tieng:
     [Co tieng | Khong tieng | GIF]; video khong tieng: [Video | GIF]. Lan dau chon GIF main tao file ".gif" canh video,
     o GIF hien "GIF 42%" trong luc tao (khong lo quy trinh, chi so %). GIF khong co tieng -> trinh phat tat tieng. */
  let nhomTieng = null
  if (m.coNutTieng || m.gifDuoc || m.chonGif) {
    nhomTieng = document.createElement('div')
    nhomTieng.className = 'chon-nhom chon-tieng'
    nhomTieng.setAttribute('role', 'group')
    nhomTieng.title = t('vd.chonTieng')
    const bCo = m.coNutTieng ? nut('chon-nut', t('vd.coTiengNut')) : nut('chon-nut', t('vd.videoNut'))
    const bKhong = m.coNutTieng ? nut('chon-nut', t('vd.khongTieng')) : null
    const bGif = nut('chon-nut chon-gif', t('vd.gifNut'))
    const cac = [bCo, bKhong, bGif].filter(Boolean)
    let dangTao = false
    const dat = (b, bat) => { b.classList.toggle('active', bat); b.setAttribute('aria-pressed', String(bat)) }
    const ve = () => {
      dat(bCo, !m.chonGif && !m.boTieng)
      if (bKhong) dat(bKhong, !m.chonGif && !!m.boTieng)
      dat(bGif, !!m.chonGif)
      // Qua tran thoi luong / khong phai MP4: o GIF mo va noi ro ly do (tru khi ban GIF da co san)
      const quaDai = !m.chonGif && m.ms > gifToiDaMs
      const khongDuoc = !m.gifDuoc && !m.chonGif
      if (!dangTao) bGif.disabled = quaDai || khongDuoc
      bGif.title = khongDuoc ? t('vd.gifKhongHoTro') : quaDai ? t('vd.gifQuaDai', { s: Math.round(gifToiDaMs / 1000) }) : t('vd.gifGoiY')
      v.muted = !!m.boTieng || !!m.chonGif
    }
    const nhan = (r) => { // trang thai main tra ve sau moi lan doi ban
      m.boTieng = !!r.boTieng; m.chonGif = !!r.chonGif
      if (r.bytesGif) m.bytesGif = r.bytesGif
      if (r.bytesXoa) { m.bytesXoa = r.bytesXoa; datTieuDeXoa() }
      ve(); veMeta()
    }
    const khoa = (k) => { cac.forEach((b) => { b.disabled = k }); bXoa.disabled = k; if (!k) ve() }
    const chon = async (coTieng) => {
      if (dangTao || (!m.chonGif && !!m.boTieng === !coTieng)) return
      khoa(true)
      let r = null
      try { r = m.coNutTieng ? await window.video.chonTieng(m.id, coTieng) : await window.video.chonGif(m.id, false) } catch (e) {}
      khoa(false)
      if (!r || !r.ok) { showToast(t('vd.khongBoDuocTieng')); return }
      nhan(r)
    }
    const chonGif = async () => {
      if (dangTao || m.chonGif) return
      dangTao = true
      khoa(true)
      bGif.classList.add('dang-tao')
      const hienPt = (p) => { bGif.textContent = t('vd.gifNut') + ' ' + Math.max(0, Math.min(99, Math.floor(p * 100))) + '%' }
      if (!m.bytesGif) hienPt(0) // ban GIF da co san thi main tra ngay, khong can hien %
      tienDoGif.set(m.id, hienPt)
      let r = null
      try { r = await window.video.chonGif(m.id, true) } catch (e) {}
      tienDoGif.delete(m.id)
      dangTao = false
      bGif.classList.remove('dang-tao')
      bGif.textContent = t('vd.gifNut')
      khoa(false)
      if (!r || !r.ok) {
        const loi = r && r.loi
        showToast(t(loi === 'dang-ban' ? 'vd.gifDangBan' : /^khong-ho-tro/.test(String(loi)) ? 'vd.gifKhongHoTro' : 'vd.gifLoi'))
        return
      }
      nhan(r)
      if (r.cat) showToast(t('vd.gifCat', { s: Math.round(gifToiDaMs / 1000) }))
    }
    bCo.addEventListener('click', () => chon(true))
    if (bKhong) bKhong.addEventListener('click', () => chon(false))
    bGif.addEventListener('click', chonGif)
    nhomTieng.append(...cac)
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
  dau.append(ten, ...(nhanLoi ? [nhanLoi] : []), meta, spacer, ...(nhomTieng ? [nhomTieng] : []), bKeo, bMo, bXoa)

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
  nhanGio.hidden = !m.ms // chua biet thoi luong (muc dua lai vao so): an nhan, khong ghi "0:01" sai
  const thanh = document.createElement('span')
  thanh.className = 'vd-thanh'
  const vach = document.createElement('i')
  thanh.appendChild(vach)
  khung.append(v, phat, nhanGio, thanh)

  // Khung dau: tua nhe de trinh duyet giai ma 1 khung (preload=metadata chua chac da ve), roi ve icon keo
  let daIcon = false
  v.addEventListener('loadedmetadata', () => {
    // So khong co co / thoi luong -> lay tu chinh file (thoi luong cua MP4 phan manh co the la vo han: khi do van an nhan)
    if (!(m.w && m.h) && v.videoWidth && v.videoHeight) { m.w = v.videoWidth; m.h = v.videoHeight; v.style.aspectRatio = m.w + ' / ' + m.h; veMeta() }
    if (!m.ms && isFinite(v.duration) && v.duration > 0) {
      m.ms = Math.round(v.duration * 1000); nhanGio.textContent = thoiLuong(m.ms); nhanGio.hidden = false
      if (nhomTieng) nhomTieng.ve() // vua biet thoi luong: xet lai o GIF (qua tran thi mo di)
    }
    try { v.currentTime = Math.min(0.1, (v.duration || 1) / 2) } catch (e) {}
  })
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
  if (data && data.gifToiDaMs > 0) gifToiDaMs = data.gifToiDaMs
  if (window.video.onGifTienDo) window.video.onGifTienDo((id, p) => { const f = tienDoGif.get(id); if (f) f(p) })
  veDanhSach()
}

init()
})()
