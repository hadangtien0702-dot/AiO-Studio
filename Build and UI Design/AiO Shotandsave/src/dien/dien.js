'use strict'
/* =========================================================================
   SAN DIEN (01/10): chuyen dong khay <-> nut tron. Main: src/khay-thu.js (doc dau file do de biet vi sao co cua so nay).
   Lenh tu main (window.dien.onLenh):
     { viec: 'thu', khay: {x,y,w,h}, anh: dataURL anh chup cua so khay, o: [{x,y,w,h} trong khay], nut: {x,y}, mat, so }
        -> ve bong + cac o anh + nut, bao 'san-sang'; nhan 'chay' thi dien kieu B (xap anh), xong bao 'xong'.
     { viec: 'mo', nut: {x,y}, dich: {x,y} tam khay, mat, so }
        -> ve nut o goc, bao 'san-sang'; 'chay' = ong kinh luot toi tam khay roi bao 'toi'; 'tan' = ong kinh tan, bao 'xong'.
     { viec: 'don' } -> xoa het hinh, ve mot khung trong roi bao 'sach' (main moi an cua so).
   Moi toa do la DIP, goc (0,0) = goc tren-trai workArea cua man khay dang nam.
   Moi animation deu dua voi hen gio (trang chay nen thi `finished` khong toi) -> khong bao gio treo main.
   ========================================================================= */
;(() => {
  const san = document.getElementById('san')
  const cho = (ms) => new Promise((r) => setTimeout(r, ms))
  const haiKhung = () => Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), cho(140)])
  function chay(el, kf, o) {
    const a = el.animate(kf, { duration: o.duration, delay: o.delay || 0, easing: o.easing || 'linear', fill: 'both' })
    return Promise.race([a.finished.catch(() => {}), cho(o.duration + (o.delay || 0) + 150)])
  }
  /* 02/10 DO DO MUOT (anh: "animation thuc te chua muot lam"): dem khung trong luc mot chang dien. Goi doKhung() luc bat dau,
     goi ham tra ve luc xong -> { ms: chang dai bao lau, n: so khung, max: khoang cach lon nhat giua 2 khung, dau: khung dau
     toi sau bao lau }. Gui kem theo bao() ve main de ghi run-log. CANH BAO: rAF chi thay nhip cua luong chinh trang nay, KHONG
     thay do tre ghep hinh cua Windows (bai hoc 5ao) -> so nay bat duoc khung rot / dung hinh, khong chung minh duoc "muot". */
  /* Lan 2 (02/10 08:3x): them `hen` = khoang cach lon nhat giua 2 lan hen gio 8 ms, `an` = so lan trang bi coi la AN
     (visibilityState hidden) trong chang. De phan biet: hen cung tre -> luong chinh cua trang nay ban; hen dung gio ma
     khong co khung -> khong ai phat khung cho trang (GPU / Windows / trang bi coi la bi che). */
  function doKhung() {
    const t0 = performance.now()
    let truoc = 0, n = 0, max = 0, dau = -1, dung = false
    let hTruoc = t0, hen = 0, an = document.hidden ? 1 : 0
    const buoc = (t) => {
      if (dung) return
      if (truoc) max = Math.max(max, t - truoc); else dau = performance.now() - t0
      truoc = t; n++
      requestAnimationFrame(buoc)
    }
    requestAnimationFrame(buoc)
    const dem = setInterval(() => { const b = performance.now(); hen = Math.max(hen, b - hTruoc); hTruoc = b }, 8)
    const khiAn = () => { if (document.hidden) an++ }
    document.addEventListener('visibilitychange', khiAn)
    return () => {
      dung = true; clearInterval(dem); document.removeEventListener('visibilitychange', khiAn)
      return { ms: Math.round(performance.now() - t0), n, max: Math.round(max), dau: Math.round(dau), hen: Math.round(hen), an }
    }
  }
  const eIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const eLo = (t) => 1 - Math.exp(-6.5 * t) * Math.cos(9.5 * t) // lo xo: vuot ~6% roi ve
  const cssLo = 'linear(' + Array.from({ length: 41 }, (_, i) => (i === 40 ? 1 : eLo(i / 40)).toFixed(4)).join(',') + ')'
  /** Duong bay cong tu do lech `tu` toi `den` (px), "nang" = do vong len; them(q, p) = phan transform noi them. */
  function duong(tu, den, nang, e, them) {
    const kf = [], n = 24
    for (let i = 0; i <= n; i++) {
      const p = i / n, q = e(p)
      const x = tu.x + (den.x - tu.x) * q, y = tu.y + (den.y - tu.y) * q - nang * Math.sin(Math.PI * q)
      kf.push({ offset: p, transform: 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)' + (them ? them(q, p) : '') })
    }
    return kf
  }
  const LOGO = '<svg viewBox="0 0 385.89 351.31" width="21" height="19" aria-hidden="true"><path fill="currentColor" d="M71.66,232.56h61.05v46.15c0,39.55-32.11,71.66-71.66,71.66H0v-46.15C0,264.67,32.11,232.56,71.66,232.56Z"/><path fill="currentColor" d="M385.89,351.31h-53.03c-96.53-2.15-100.18,5.1-136.92-40.6l-116.4-144.82c-36.73-45.7-28.47-110.09,16.24-149.27L116.47,0l269.42,351.31Z"/></svg>'
  const ONG = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/></svg>'
  const dat = (el, o) => { el.style.left = o.x + 'px'; el.style.top = o.y + 'px'; if (o.w != null) { el.style.width = o.w + 'px'; el.style.height = o.h + 'px' } return el }
  const tao = (lop) => { const d = document.createElement('div'); d.className = lop; return d }
  /** Nut tron: cung khuon voi cua so nut that (src/nut/index.html + nut.css). */
  function taoNut(g) {
    const n = dat(tao('nut'), g.nut)
    n.style.zIndex = 50
    n.innerHTML = '<span class="mat logo">' + LOGO + '</span><span class="mat ong">' + ONG + '</span><span class="mat anh"><img alt=""></span><i class="so"></i>'
    const p = { nut: n, logo: n.querySelector('.logo'), ong: n.querySelector('.ong'), anh: n.querySelector('.anh'), so: n.querySelector('.so') }
    if (g.mat) p.anh.firstElementChild.src = g.mat
    return p
  }
  const giaiMa = (url) => { if (!url) return Promise.resolve(); const im = new Image(); im.src = url; return Promise.race([im.decode().catch(() => {}), cho(500)]) }
  function lanSong(g) {
    const s = dat(tao('song'), g.nut); san.appendChild(s)
    chay(s, [{ opacity: .8, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.9)' }], { duration: 480, easing: 'cubic-bezier(.2,.7,.2,1)' })
  }
  const gocO = (i) => [9, -7, 5, -11, 8, -6, 10][i % 7]

  let viec = null // { chay(), tan() } cua lenh dang dung

  /* ── THU VE · kieu B "xap anh" ─────────────────────────────────────────── */
  async function dungThu(g) {
    san.textContent = ''
    const anhNen = 'url("' + g.anh + '")', co = g.khay.w + 'px ' + g.khay.h + 'px'
    const bong = dat(tao('bong'), g.khay)
    bong.style.backgroundImage = anhNen; bong.style.backgroundSize = co
    const os = (g.o || []).map((o) => {
      const c = dat(tao('o'), { x: g.khay.x + o.x, y: g.khay.y + o.y, w: o.w, h: o.h })
      c.style.backgroundImage = anhNen; c.style.backgroundSize = co
      c.style.backgroundPosition = (-o.x) + 'px ' + (-o.y) + 'px'
      return c
    })
    const p = taoNut(g)
    p.nut.style.transform = 'scale(0)'
    p.logo.classList.add('hien') // luc dang don anh: nut la "tui" co logo; don xong moi hien tam moi nhat
    let dem = Math.max(0, (g.so || 0) - os.length)
    p.so.textContent = dem || ''
    san.append(bong, ...os, p.nut)
    await Promise.all([giaiMa(g.anh), giaiMa(g.mat)])
    await haiKhung()
    window.dien.bao('san-sang')

    viec = { chay: async () => {
      const tam = { x: g.nut.x + 26, y: g.nut.y + 26 }
      const nhun = () => chay(p.nut, [{ transform: 'scale(1)' }, { transform: 'scale(1.13)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' })
      chay(p.nut, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 340, easing: cssLo })
      chay(bong, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: 40 })
      const n = os.length
      await Promise.all(os.map((c, i) => {
        const o = g.o[i], thu = n - 1 - i // tam cu nhat bay truoc, tam moi nhat vao sau cung
        const d = { x: tam.x - (g.khay.x + o.x + o.w / 2), y: tam.y - (g.khay.y + o.y + o.h / 2) }
        const s = Math.min(40 / o.w, 40 / o.h)
        c.style.zIndex = 10 + thu
        return chay(c, duong({ x: 0, y: 0 }, d, 40 + thu * 5, eIO, (q) => ' rotate(' + (gocO(i) * q * 2).toFixed(2) + 'deg) scale(' + (1 + (s - 1) * q).toFixed(3) + ')'), { duration: 360, delay: 60 + thu * 40 })
          .then(() => { c.style.opacity = 0; dem++; p.so.textContent = dem; nhun() })
      }))
      if (!n) await cho(300)
      p.so.textContent = g.so > 0 ? g.so : ''
      lanSong(g)
      if (g.mat) {
        chay(p.logo, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 })
        await chay(p.anh, [{ opacity: 0, transform: 'scale(.3) rotate(-25deg)' }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }], { duration: 260, easing: cssLo })
      } else await cho(120)
      window.dien.bao('xong')
    } }
  }

  /* ── XUAT HIEN · kieu A "ong kinh" ─────────────────────────────────────── */
  async function dungMo(g) {
    san.textContent = ''
    const p = taoNut(g)
    const matNghi = g.mat ? p.anh : p.logo
    matNghi.classList.add('hien')
    p.so.textContent = g.so > 0 ? g.so : ''
    san.append(p.nut)
    const tA = performance.now()
    await giaiMa(g.mat)
    const tB = performance.now()
    await haiKhung()
    window.dien.bao('san-sang', { ma: Math.round(tB - tA), khung: Math.round(performance.now() - tB) })

    const tam = { x: g.nut.x + 26, y: g.nut.y + 26 }
    const lech = { x: g.dich.x - tam.x, y: g.dich.y - tam.y }, xa = Math.hypot(lech.x, lech.y)
    viec = {
      chay: async () => {
        const xongDo = doKhung()
        chay(matNghi, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 })
        chay(p.so, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 })
        chay(p.ong, [{ opacity: 0, transform: 'rotate(90deg) scale(.5)' }, { opacity: 1, transform: 'rotate(0deg) scale(1)' }], { duration: 180 })
        await chay(p.nut, duong({ x: 0, y: 0 }, lech, Math.min(70, xa * .2), eIO, (q, pp) => ' scale(' + (1 - .14 * Math.sin(Math.PI * pp)).toFixed(3) + ')'), { duration: 240 + Math.min(200, xa * .35) })
        window.dien.bao('toi', Object.assign(xongDo(), { xa: Math.round(xa) }))
      },
      tan: async () => {
        const xongDo = doKhung()
        chay(p.ong.firstElementChild, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(150deg)' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' })
        const cho_ = 'translate(' + lech.x.toFixed(2) + 'px,' + lech.y.toFixed(2) + 'px)'
        await chay(p.nut, [{ opacity: 1, transform: cho_ + ' scale(1)' }, { opacity: 0, transform: cho_ + ' scale(2.2)' }], { duration: 240, easing: 'ease-out' })
        window.dien.bao('xong', xongDo())
      },
    }
  }

  window.dien.onLenh(async (g) => {
    try {
      if (g.viec === 'thu') await dungThu(g)
      else if (g.viec === 'mo') await dungMo(g)
      else if (g.viec === 'chay' && viec) await viec.chay()
      else if (g.viec === 'tan' && viec && viec.tan) await viec.tan()
      else if (g.viec === 'don') { viec = null; san.textContent = ''; await haiKhung(); window.dien.bao('sach') }
    } catch (err) {
      console.error('san dien loi (' + g.viec + '): ' + (err && err.message))
      window.dien.bao(g.viec === 'thu' || g.viec === 'mo' ? 'san-sang' : 'xong') // khong de main cho het gio
    }
  })
})()
