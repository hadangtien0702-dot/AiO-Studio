'use strict'

/* Man Cai dat — mot CTA chinh moi trang thai (bai hoc "4 nut lang nhang"):
   idle:      [keycaps hien tai]              [Doi phim…]
   recording: [Nhan to hop moi… (nhap nhay)]  [Huy]
   pending:   [keycaps MOI]                   [Luu] [Huy]                     */

const t = (k) => window.i18n.t(k)

const keysEl = document.getElementById('keys')
const btnDoi = document.getElementById('doi')
const btnSave = document.getElementById('save')
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
const loaiBox = document.getElementById('anh-loai')
const clBox = document.getElementById('anh-chat-luong')
const hangCL = document.getElementById('hang-chat-luong')
const verEl = document.getElementById('ver')

let isMac = false
let hotkey = ''      // phim dang dung (accelerator)
let pending = null   // phim vua ghi, cho Luu
let state = 'idle'   // 'idle' | 'recording' | 'pending'

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
  const accel = state === 'pending' ? pending : hotkey
  const phim = tachPhim(accel)
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
  btnSave.hidden = state !== 'pending'
  btnHuyGhi.hidden = state === 'idle'
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
  pending = null
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('recording')
})

btnHuyGhi.addEventListener('click', () => {
  pending = null
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('idle')
})

window.addEventListener('keydown', (e) => {
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
  pending = mods.concat(key).join('+')
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('pending')
})

btnSave.addEventListener('click', async () => {
  if (!pending) return
  const r = await window.settings.setHotkey(pending)
  hotkey = r.hotkey
  if (r.ok) {
    msg.textContent = t('set.phim.daLuu')
    msg.className = 'msg ok'
  } else {
    msg.textContent = t('set.phim.biGiu')
    msg.className = 'msg err'
  }
  pending = null
  datTrangThai('idle')
})

btnReset.addEventListener('click', async () => {
  const r = await window.settings.reset()
  hotkey = r.hotkey
  pending = null
  msg.textContent = r.ok ? t('set.phim.veMacDinh') : t('set.phim.veMacDinhLoi')
  msg.className = r.ok ? 'msg ok' : 'msg err'
  datTrangThai('idle')
})

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
