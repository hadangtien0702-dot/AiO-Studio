'use strict'
/* Dong ho QUAY VIDEO (01/10). Main goi window.batDau({ tieng }) khi bo quay da chay that -> dem len tu 0:00.
   Bam Dung -> window.dem.dung() (preload-dem.js) -> main dung quay; nut mo di de khong bam 2 lan.
   Chu tren nut do main dich san (src/i18n.js quay.dung / quay.dungTitle) roi dua qua query ?dung=...&dungTitle=... */
const q = new URLSearchParams(location.search)
const gioEl = document.getElementById('gio')
const nut = document.getElementById('dung')
document.getElementById('dung-chu').textContent = q.get('dung') || 'Stop'
nut.title = q.get('dungTitle') || q.get('dung') || 'Stop'
nut.setAttribute('aria-label', nut.title)

let t0 = 0
let iv = null
function ve() {
  const s = Math.floor((Date.now() - t0) / 1000)
  gioEl.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}
window.batDau = (o) => {
  t0 = Date.now()
  document.body.classList.add('chay')
  document.body.classList.toggle('tieng', !!(o && o.tieng))
  ve()
  if (iv) clearInterval(iv)
  iv = setInterval(ve, 250)
}
/* 06/10 CHUP CUON dung chung thuoc nay: main goi datChu('1.240 px') moi khi noi them hang -> thay dong ho bang chieu cao
   da ghep (nguoi dung thay so tang la biet app dang ghep). */
window.datChu = (s) => {
  if (iv) { clearInterval(iv); iv = null }
  gioEl.textContent = String(s)
}
nut.addEventListener('click', () => {
  nut.disabled = true
  if (window.dem) window.dem.dung()
})
