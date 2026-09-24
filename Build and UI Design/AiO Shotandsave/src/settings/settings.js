'use strict'

/* Man Cai dat — mot CTA chinh moi trang thai (bai hoc "4 nut lang nhang"):
   idle:      [keycaps hien tai]              [Doi phim…]
   recording: [Nhan to hop moi… (nhap nhay)]  [Huy]

   ☠️ 31/08: BO trang thai "pending + nut Luu". Anh Tien nhan to hop moi,
   man hinh hien keycaps MOI -> tuong xong, dong cua so — nhung phim chi nam
   trong bien `pending` cua renderer, CHUA he luu. Restart may xong mo ra
   thay "phim cu" -> anh bao "no tu doi phim". Nay nhan to hop la LUU NGAY. */

const t = (k) => window.i18n.t(k)

/* Keo cua so bang thanh tieu de (16/09): mousedown tren #tieu-de (tru vung nut .dieu-khien)
   -> gui delta TUYET DOI tu diem nhan (screenX/Y) -> main setBounds tu neo. */
;(() => {
  const bar = document.getElementById('tieu-de')
  if (!bar) return
  let keo = false, goc = { x: 0, y: 0 }
  bar.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.dieu-khien')) return
    keo = true; goc = { x: e.screenX, y: e.screenY }
    bar.style.cursor = 'grabbing'
    window.settings.dragStart()
    e.preventDefault()
  })
  window.addEventListener('mousemove', (e) => { if (keo) window.settings.dragTo(e.screenX - goc.x, e.screenY - goc.y) })
  window.addEventListener('mouseup', () => { if (!keo) return; keo = false; bar.style.cursor = ''; window.settings.dragEnd() })
})()

const keysEl = document.getElementById('keys')
const btnDoi = document.getElementById('doi')
const btnHuyGhi = document.getElementById('huy-ghi')
const btnReset = document.getElementById('reset')
const msg = document.getElementById('msg')
const folderTen = document.getElementById('folder-ten')
const folderPath = document.getElementById('folder-path')
const btnPick = document.getElementById('pick-folder')
const btnOpen = document.getElementById('open-folder')
const msgFolder = document.getElementById('msg-folder')
const langBox = document.getElementById('lang')
const btnClose = document.getElementById('close')
const khayBox = document.getElementById('khay-kieu')
const loaiBox = document.getElementById('anh-loai')
const clBox = document.getElementById('anh-chat-luong')
const hangCL = document.getElementById('hang-chat-luong')
const verEl = document.getElementById('ver')

let isMac = false
let hotkey = ''      // phim dang dung (accelerator)
let state = 'idle'   // 'idle' | 'recording' | 'saving'

function dichGiaoDien() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'))
  })
}

/* Tach accelerator thanh mang nhan phim de ve keycap. */
function tachPhim(accel) {
  if (!accel) return []
  return accel.split('+').map((x) => {
    if (x === 'CommandOrControl' || x === 'CmdOrCtrl') return isMac ? '⌘' : 'Ctrl'
    if (x === 'Cmd' || x === 'Command') return '⌘'
    if (x === 'Alt' || x === 'Option') return isMac ? '⌥' : 'Alt'
    if (x === 'Shift') return isMac ? '⇧' : 'Shift'
    if (x === 'Ctrl' || x === 'Control') return 'Ctrl'
    return x
  })
}

/* Ve khu keycaps theo trang thai. */
function veKeys() {
  keysEl.classList.toggle('ghi', state === 'recording')
  keysEl.textContent = ''
  if (state === 'recording') {
    keysEl.textContent = t('set.phim.nhanToHop')
    return
  }
  const phim = tachPhim(hotkey)
  phim.forEach((p, i) => {
    if (i > 0) {
      const cong = document.createElement('span')
      cong.className = 'keycap cong'
      cong.textContent = '+'
      keysEl.appendChild(cong)
    }
    const k = document.createElement('span')
    k.className = 'keycap'
    k.textContent = p
    keysEl.appendChild(k)
  })
}

function veNut() {
  btnDoi.hidden = state !== 'idle'
  btnHuyGhi.hidden = state !== 'recording'
}

function datTrangThai(s) {
  state = s
  veKeys()
  veNut()
}

function datFolder(p) {
  folderPath.textContent = p || '—'
  folderPath.title = p || ''
  const ten = (p || '').split(/[\\/]/).filter(Boolean).pop() || '—'
  folderTen.textContent = ten
}

/* Danh dau nut dang chon trong mot nhom pill. */
function chonPill(box, v) {
  box.querySelectorAll('.chon-nut').forEach((b) => b.classList.toggle('chon', b.dataset.v === v))
}

function datAnh(loai, chatLuong) {
  chonPill(loaiBox, loai)
  chonPill(clBox, chatLuong)
  // PNG luon lossless -> lam mo hang chat luong (khong ap dung)
  hangCL.classList.toggle('mo', loai === 'png')
}

async function load() {
  dichGiaoDien()
  const s = await window.settings.get()
  isMac = s.isMac
  hotkey = s.hotkey
  datFolder(s.saveFolder)
  datAnh(s.anhLoai, s.anhChatLuong)
  chonPill(khayBox, s.khayKieu)
  if (s.version && verEl) verEl.textContent = 'AiO Shot & Save · v' + s.version
  langBox.querySelectorAll('.lang-nut').forEach((b) => {
    b.classList.toggle('chon', b.dataset.lang === s.lang)
  })
  datTrangThai('idle')
}
load()

/* ── Ngon ngu + dong ──────────────────────────────────────────────────── */
langBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.lang-nut')
  if (!b || b.classList.contains('chon')) return
  await window.settings.setLang(b.dataset.lang) // main reload cua so -> load() lai
})
btnClose.addEventListener('click', () => window.settings.close())

/* ── Dinh dang / chat luong anh ───────────────────────────────────────── */
loaiBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  const cl = clBox.querySelector('.chon-nut.chon')
  datAnh(b.dataset.v, cl ? cl.dataset.v : 'cao')
  await window.settings.setAnh({ anhLoai: b.dataset.v })
})
clBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  chonPill(clBox, b.dataset.v)
  await window.settings.setAnh({ anhChatLuong: b.dataset.v })
})

/* ── Kieu khay ────────────────────────────────────────────────────────── */
khayBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  chonPill(khayBox, b.dataset.v)
  await window.settings.setKhay(b.dataset.v)
})

/* ── Ghi phim ─────────────────────────────────────────────────────────── */
const CODE_PUNCT = {
  Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
  Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
}
function mainKey(e) {
  const c = e.code
  let m
  if ((m = /^Key([A-Z])$/.exec(c))) return m[1]
  if ((m = /^Digit([0-9])$/.exec(c))) return m[1]
  if ((m = /^Numpad([0-9])$/.exec(c))) return 'num' + m[1]
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(c)) return c
  if (c === 'Space') return 'Space'
  if (c === 'PrintScreen') return 'PrintScreen'
  if (CODE_PUNCT[c]) return CODE_PUNCT[c]
  return null
}

btnDoi.addEventListener('click', () => {
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('recording')
})

btnHuyGhi.addEventListener('click', () => {
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('idle')
})

/* Nhan to hop hop le la LUU NGAY — khong co buoc "Luu" de quen (vap 31/08). */
window.addEventListener('keydown', async (e) => {
  if (state !== 'recording') return
  e.preventDefault()
  const mods = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.metaKey && isMac) mods.push('Cmd')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  const key = mainKey(e)
  if (!key) return // moi bam modifier — doi phim chinh
  if (mods.length === 0) {
    msg.textContent = isMac ? t('set.phim.canModifierMac') : t('set.phim.canModifier')
    msg.className = 'msg err'
    return
  }
  datTrangThai('saving') // chan keydown tiep theo trong luc cho main tra loi
  const r = await window.settings.setHotkey(mods.concat(key).join('+'))
  hotkey = r.hotkey
  datTrangThai('idle')
  baoKetQua(r.ok)
})

btnReset.addEventListener('click', async () => {
  const r = await window.settings.reset()
  hotkey = r.hotkey
  datTrangThai('idle')
  baoKetQua(r.ok)
})

/* Thanh cong thi IM LANG bang chu — keycaps moi da hien roi, chi nhay XANH
   mot nhip cho nhin mau la biet (anh Tien 31/08: bo dong "Saved — ready to
   use"). Chu chi danh cho THAT BAI (phim bi app khac giu). */
function baoKetQua(ok) {
  if (ok) {
    msg.textContent = ''
    msg.className = 'msg'
    keysEl.classList.remove('vua-luu')
    void keysEl.offsetWidth // reset animation neu luu hai lan lien tiep
    keysEl.classList.add('vua-luu')
  } else {
    msg.textContent = t('set.phim.biGiu')
    msg.className = 'msg err'
  }
}

/* ── Thu muc ──────────────────────────────────────────────────────────── */
btnPick.addEventListener('click', async () => {
  const r = await window.settings.pickFolder()
  datFolder(r.folder)
  if (!r.huy) {
    msgFolder.textContent = t('set.thuMuc.daDoi')
    msgFolder.className = 'msg ok'
    msgFolder.style.textAlign = 'left'
  }
})
btnOpen.addEventListener('click', () => window.settings.openFolder())

/* ── Ban quyen (24/09) ────────────────────────────────────────────────────
   Chua kich hoat: o nhap ma + Kich hoat + Mua. Da kich hoat: ma da che + han cap nhat + Huy (bam 2 lan).
   Het dung thu: the vien cam, mo Cai dat la thay ngay (main mo cua so khi bam chup bi khoa). */
;(() => {
  const the = document.getElementById('the-bq')
  const moTa = document.getElementById('bq-mo-ta'), tieuDe = document.getElementById('bq-tieu-de')
  const khoiNhap = document.getElementById('bq-nhap'), khoiCo = document.getElementById('bq-co')
  const o = document.getElementById('bq-ma'), nutKH = document.getElementById('bq-kich-hoat')
  const nutMua = document.getElementById('bq-mua'), nutHuy = document.getElementById('bq-huy'), msg = document.getElementById('bq-msg')
  if (!the || !window.banQuyen) return
  o.placeholder = t(o.dataset.i18nPh)
  const ngay = (iso) => new Date(iso).toLocaleDateString(window.i18n.lang === 'en' ? 'en-US' : 'vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
  const bao = (chu, kieu) => { msg.textContent = chu || ''; msg.className = 'msg' + (kieu ? ' ' + kieu : '') }

  function ve(s) {
    if (!s) { the.hidden = true; return }
    const co = s.loai === 'da-kich-hoat'
    khoiNhap.hidden = co; khoiCo.hidden = !co
    the.classList.toggle('het', s.loai === 'het-han-thu')
    if (co) {
      tieuDe.textContent = t('bq.daKichHoat') + ' · ' + s.maHienThi
      moTa.textContent = s.hetQuyenCapNhat || s.khongGiuMay || !s.hetHan ? t('bq.hetCapNhat') : t('bq.capNhatDen').replace('{ngay}', ngay(s.hetHan))
      nutHuy.hidden = !!s.khongGiuMay            // ma het han khong giu cho may nao -> khong co gi de huy
    } else if (s.biThuHoi) {
      tieuDe.textContent = t('bq.thuHoi'); moTa.textContent = t('bq.thuHoiMoTa')
    } else if (s.lyDoMatMa === 'may-bi-go') {
      tieuDe.textContent = t('bq.biGo'); moTa.textContent = t('bq.biGoMoTa')
    } else if (s.loai === 'dung-thu') {
      tieuDe.textContent = t('bq.dungThu').replace('{n}', s.ngayConLai); moTa.textContent = t('bq.dungThuMoTa')
    } else {
      tieuDe.textContent = t('bq.hetThu'); moTa.textContent = t('bq.hetThuMoTa')
    }
  }

  async function kichHoat() {
    nutKH.disabled = true; nutKH.textContent = t('bq.dangKichHoat'); bao('')
    try {
      const r = await window.banQuyen.kichHoat(o.value)
      ve(r.trangThai)
      if (r.ok) { o.value = ''; bao(r.canhBao === 'ma-het-han' ? t('bq.okHetHan') : t('bq.ok'), 'ok') }
      else bao(t('bq.loi.' + r.loi), 'err')
    } catch (e) { bao(t('bq.loi.mat-mang'), 'err') }
    nutKH.disabled = false; nutKH.textContent = t('bq.kichHoat')
  }
  nutKH.addEventListener('click', kichHoat)
  o.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); kichHoat() } })
  nutMua.addEventListener('click', () => window.banQuyen.mua())

  // Huy: bam lan 1 doi chu "Bam lan nua de huy" 3 giay (khong hop thoai), bam lan 2 moi huy that
  let choXacNhan = null
  nutHuy.addEventListener('click', async () => {
    if (!choXacNhan) {
      nutHuy.textContent = t('bq.huyXacNhan'); nutHuy.classList.remove('phu')
      choXacNhan = setTimeout(() => { choXacNhan = null; nutHuy.textContent = t('bq.huy'); nutHuy.classList.add('phu') }, 3000)
      return
    }
    clearTimeout(choXacNhan); choXacNhan = null
    nutHuy.disabled = true; nutHuy.textContent = t('bq.dangHuy'); bao('')
    try {
      const r = await window.banQuyen.huy()
      ve(r.trangThai)
      bao(r.ok ? t('bq.daHuy') : t('bq.loi.' + r.loi), r.ok ? 'ok' : 'err')
    } catch (e) { bao(t('bq.loi.mat-mang'), 'err') }
    nutHuy.disabled = false; nutHuy.textContent = t('bq.huy'); nutHuy.classList.add('phu')
  })

  window.banQuyen.get().then((s) => {
    ve(s)
    if (s && s.loai === 'het-han-thu') o.focus()   // vua bi khoa chup -> dat con tro san vao o nhap ma
  })
})()
