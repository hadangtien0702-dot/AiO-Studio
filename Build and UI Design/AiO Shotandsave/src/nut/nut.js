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
  })
  nut.addEventListener('click', () => window.nut.mo())
  an.addEventListener('click', (e) => { e.stopPropagation(); window.nut.an() })
})()
