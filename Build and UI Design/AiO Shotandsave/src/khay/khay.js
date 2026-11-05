'use strict'

/* =========================================================================
   AiO Shot & Save — KHAY GOP (01/10): MOT cua so, 2 the Storyboard | Video.
   Anh Tien 01/10: "phan khay minh toi uu hoa thanh 1 khay" -> gop 2 cua so rieng (Khay Storyboard, Khay video).
   File nay CHI lo viec doi the. Noi dung tung the van do src/storyboard/storyboard.js va src/video/video.js dung
   (ca hai nap ngay luc mo cua so, nen so dem tren 2 the luon dung va doi the la tuc thi, khong nap lai).
   The mo dau: main truyen qua ?tab=dai|video (bam nut nao tren Khay anh / vua quay xong cai gi thi mo the do).
   Phai nap TRUOC 2 file kia: chung doc document.body.dataset.tab.
   ========================================================================= */
;(() => {
  const nutThe = [...document.querySelectorAll('#tab .chon-nut')]
  const than = { dai: document.getElementById('tab-dai'), video: document.getElementById('tab-video') }
  const khungCuon = document.getElementById('viewport')
  const cuon = { dai: 0, video: 0 } // moi the nho cho cuon rieng (2 the chung mot khung cuon)

  function chonThe(ten) {
    if (!than[ten]) ten = 'dai'
    const cu = document.body.dataset.tab
    if (than[cu]) cuon[cu] = khungCuon.scrollTop
    document.body.dataset.tab = ten
    for (const k of Object.keys(than)) than[k].hidden = k !== ten
    nutThe.forEach((b) => {
      const mo = b.dataset.tab === ten
      b.classList.toggle('active', mo)
      b.setAttribute('aria-selected', String(mo))
    })
    // Roi the Video thi dung video dang phat (khong de tieng phat tiep sau lung the Storyboard)
    if (ten !== 'video') document.querySelectorAll('#ds-video video').forEach((v) => v.pause())
    khungCuon.scrollTop = cuon[ten] || 0
  }

  const dau = new URLSearchParams(location.search).get('tab')
  document.body.dataset.tab = '' // chua co the nao "cu" o lan chon dau
  chonThe(dau === 'video' ? 'video' : 'dai')
  nutThe.forEach((b) => b.addEventListener('click', () => chonThe(b.dataset.tab)))
})()
