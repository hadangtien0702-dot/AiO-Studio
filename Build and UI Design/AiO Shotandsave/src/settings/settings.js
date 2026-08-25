'use strict'

const t = (k) => window.i18n.t(k)

const disp = document.getElementById('disp')
const btnRecord = document.getElementById('record')
const btnSave = document.getElementById('save')
const btnReset = document.getElementById('reset')
const msg = document.getElementById('msg')
const folderEl = document.getElementById('folder')
const btnPick = document.getElementById('pick-folder')
const btnOpen = document.getElementById('open-folder')
const msgFolder = document.getElementById('msg-folder')
const langBox = document.getElementById('lang')
const btnClose = document.getElementById('close')

let isMac = false
let pending = null
let recording = false

/* Dich moi phan tu co data-i18n. */
function dichGiaoDien() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'))
  })
}

/* Hien phim tat cho de doc: CommandOrControl -> Ctrl/⌘, ghep bang " + ". */
function fmt(accel) {
  if (!accel) return '—'
  return accel.split('+').map((x) => {
    if (x === 'CommandOrControl' || x === 'CmdOrCtrl') return isMac ? '⌘' : 'Ctrl'
    if (x === 'Cmd' || x === 'Command') return '⌘'
    if (x === 'Alt' || x === 'Option') return isMac ? '⌥' : 'Alt'
    if (x === 'Shift') return isMac ? '⇧' : 'Shift'
    if (x === 'Ctrl' || x === 'Control') return 'Ctrl'
    return x
  }).join(' + ')
}

function datFolder(p) {
  folderEl.textContent = p || '—'
  folderEl.title = p || ''
}

async function load() {
  dichGiaoDien()
  const s = await window.settings.get()
  isMac = s.isMac
  disp.textContent = fmt(s.hotkey)
  datFolder(s.saveFolder)
  // danh dau nut ngon ngu dang chon
  langBox.querySelectorAll('.lang-nut').forEach((b) => {
    b.classList.toggle('chon', b.dataset.lang === s.lang)
  })
}
load()

/* ── Doi ngon ngu ─────────────────────────────────────────────────────── */
langBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.lang-nut')
  if (!b || b.classList.contains('chon')) return
  await window.settings.setLang(b.dataset.lang) // main nap lai cua so -> load() lai
})

btnClose.addEventListener('click', () => window.settings.close())

/* ── Phim tat ─────────────────────────────────────────────────────────── */
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

btnRecord.addEventListener('click', () => {
  recording = true
  pending = null
  disp.textContent = t('set.phim.dangGhi')
  disp.classList.add('ghi')
  msg.textContent = ''
  msg.className = 'msg'
  btnSave.disabled = true
})

window.addEventListener('keydown', (e) => {
  if (!recording) return
  e.preventDefault()
  const mods = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.metaKey && isMac) mods.push('Cmd')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  const key = mainKey(e)
  if (!key) return
  if (mods.length === 0) {
    msg.textContent = isMac ? t('set.phim.canModifierMac') : t('set.phim.canModifier')
    msg.className = 'msg err'
    return
  }
  pending = mods.concat(key).join('+')
  recording = false
  disp.classList.remove('ghi')
  disp.textContent = fmt(pending)
  msg.textContent = ''
  msg.className = 'msg'
  btnSave.disabled = false
})

btnSave.addEventListener('click', async () => {
  if (!pending) return
  const r = await window.settings.setHotkey(pending)
  if (r.ok) {
    msg.textContent = t('set.phim.daLuu')
    msg.className = 'msg ok'
  } else {
    msg.textContent = t('set.phim.biGiu')
    msg.className = 'msg err'
    disp.textContent = fmt(r.hotkey)
  }
  pending = null
  btnSave.disabled = true
})

btnReset.addEventListener('click', async () => {
  const r = await window.settings.reset()
  disp.textContent = fmt(r.hotkey)
  disp.classList.remove('ghi')
  pending = null
  btnSave.disabled = true
  msg.textContent = r.ok ? t('set.phim.veMacDinh') : t('set.phim.veMacDinhLoi')
  msg.className = r.ok ? 'msg ok' : 'msg err'
})

/* ── Thu muc luu anh ──────────────────────────────────────────────────── */
btnPick.addEventListener('click', async () => {
  const r = await window.settings.pickFolder()
  datFolder(r.folder)
  if (!r.huy) {
    msgFolder.textContent = t('set.thuMuc.daDoi')
    msgFolder.className = 'msg ok'
  }
})

btnOpen.addEventListener('click', () => window.settings.openFolder())
