'use strict'
/* The lan chay dau (06/11): dich chu, ve phim thanh keycap, bao main chieu cao that de main dat cua so + hien. */
const t = (k, p) => window.i18n.t(k, p)
const q = new URLSearchParams(location.search)
const phim = q.get('phim') || ''
const laMac = q.get('mac') === '1'
document.title = 'AiO Shot & Save'
document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')) })

// "Bam {phim} de chup ..." -> phim ve thanh keycap, chu xung quanh giu nguyen
;(() => {
  const el = document.getElementById('chup')
  const mau = t('lan.chup', { phim: '\u0001' })
  const [truoc, sau] = mau.split('\u0001')
  el.append(document.createTextNode(truoc))
  const ds = phim.split('+').map((s) => s.trim()).filter(Boolean)
  ds.forEach((k, i) => {
    if (i > 0) el.append(document.createTextNode(' + '))
    const c = document.createElement('span'); c.className = 'keycap'; c.textContent = k; el.append(c)
  })
  el.append(document.createTextNode(sau || ''))
})()
document.getElementById('bieu-tuong').textContent = t(laMac ? 'lan.bieuTuongMac' : 'lan.bieuTuongWin')

document.getElementById('da-hieu').addEventListener('click', () => window.lanDau.dong())
document.getElementById('doi-phim').addEventListener('click', () => window.lanDau.doiPhim())
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.lanDau.dong() })

// Chieu cao that cua the (+ le bong 14 px moi ben) -> main dat cua so cho vua khit roi moi hien
// (khong dung requestAnimationFrame: cua so con an thi rAF khong chay, the khong bao gio hien)
const baoCao = () => {
  const the = document.getElementById('the').getBoundingClientRect()
  window.lanDau.cao(Math.ceil(the.height) + 28)
}
Promise.resolve(document.fonts && document.fonts.ready).catch(() => {}).then(() => setTimeout(baoCao, 30))
