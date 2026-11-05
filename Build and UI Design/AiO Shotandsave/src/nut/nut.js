'use strict'
/* NUT TRON cua khay (01/10). Main (src/khay-thu.js) gui { mat: dataURL anh moi nhat | '', so: so anh trong khay }.
   Co anh thi mat nut la tam anh moi nhat, khay trong thi la logo. */
;(() => {
  const nut = document.getElementById('nut'), an = document.getElementById('an')
  const anh = document.getElementById('anh'), so = document.getElementById('so')
  const matLogo = nut.querySelector('.mat.logo'), matAnh = nut.querySelector('.mat.anh')
  const chu = (window.nut && window.nut.chu) || {}
  for (const [el, s] of [[nut, chu.mo], [an, chu.an]]) { if (s) { el.title = s; el.setAttribute('aria-label', s) } }

  window.nut.onCapNhat((g) => {
    const coAnh = !!(g && g.mat)
    if (coAnh) anh.src = g.mat
    matAnh.classList.toggle('hien', coAnh)
    matLogo.classList.toggle('hien', !coAnh)
    so.textContent = g && g.so > 0 ? String(g.so) : ''
    keoDuoc = !!(g && g.keo)
  })

  /* 12/10 KEO nut (anh: "khi khay thu ve anh muon di chuyen duoc cai icon do nua"): giu chuot tren nut roi keo qua 5 px =
     KEO (cua so di theo, main kep trong man); tha ra thi nam lai. Nhich duoi 5 px roi tha = BAM, van mo khay nhu cu.
     Gui TONG do lech tu diem bam theo toa do man hinh (khong cong don). keoDuoc do main bao (hien chi bat tren macOS). */
  const NGUONG = 5
  let keoDuoc = false, goc = null, dangKeo = false, vuaKeo = false
  nut.addEventListener('pointerdown', (e) => {
    vuaKeo = false
    if (!keoDuoc || e.button !== 0) return
    goc = { x: e.screenX, y: e.screenY }
    dangKeo = false
    try { nut.setPointerCapture(e.pointerId) } catch (err) {}
  })
  nut.addEventListener('pointermove', (e) => {
    if (!goc) return
    const dx = e.screenX - goc.x, dy = e.screenY - goc.y
    if (!dangKeo) {
      if (Math.hypot(dx, dy) < NGUONG) return
      dangKeo = true
      document.body.classList.add('keo')
      window.nut.keoBatDau()
    }
    window.nut.keoDen(dx, dy)
  })
  const tha = () => {
    if (!goc) return
    goc = null
    if (!dangKeo) return
    dangKeo = false
    vuaKeo = true // cu "click" di lien sau lan tha nay la cua luot keo, khong phai bam mo khay
    document.body.classList.remove('keo')
    window.nut.keoXong()
  }
  nut.addEventListener('pointerup', tha)
  nut.addEventListener('pointercancel', tha)
  nut.addEventListener('click', () => { if (vuaKeo) { vuaKeo = false; return } window.nut.mo() })
  an.addEventListener('click', (e) => { e.stopPropagation(); window.nut.an() })
})()
