'use strict'
/* CANVAS Y TUONG (12/10) — trang ve. Su that ve "tam nao thuoc khung nao" nam o THU MUC (main: src/canvas-kho.js); trang nay
   chi ve trang thai main tra ve, va sau moi thao tac co doi thu muc (tha vao khung, doi ten, tao khung, doi co khung) thi lay
   trang thai MOI tu main roi ve lai. Vi tri (keo tam, keo khung) gui ve main de nho.
   Toa do: moi thu nam trong #the (toa do bang); goc nhin V = { x, y, s }: man hinh = bang * s + (x, y). */
;(() => {
  const cv = window.cv, T = cv.t
  const el = (id) => document.getElementById(id)
  const bang = el('bang'), the = el('the'), moc = el('moc'), nutChup = el('chup'), bao = el('bao')
  const V = { x: 60, y: 40, s: 1 }
  let khung = [], mucs = []
  const elK = new Map(), elO = new Map(), demCu = new Map()
  let keo = null, dangCho = false, daBaoSo = false, henBao = null

  document.documentElement.lang = cv.lang
  el('tieu').innerHTML = T('cv.tieu') + '<small></small>'
  el('tieu').querySelector('small').textContent = T('cv.phu')
  el('chuThem').textContent = T('cv.khungMoi'); el('chuMo').textContent = T('cv.moThuMuc'); el('chuVua').textContent = T('cv.vua')
  for (const [id, khoa] of [['them', 'cv.khungMoi'], ['moTM', 'cv.moThuMuc'], ['vua', 'cv.vua'], ['chup', 'cv.chup']]) { el(id).title = T(khoa); el(id).setAttribute('aria-label', T(khoa)) }

  const TM = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
  const PHAT = '<span class="phat"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></span>'
  const G4 = '<i class="g g1"></i><i class="g g2"></i><i class="g g3"></i><i class="g g4"></i>'
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const bam = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  const nghieng = (khoa) => ((bam(khoa) % 71) / 10 - 3.5).toFixed(1)
  const p2 = (v) => String(v).padStart(2, '0')
  const nhanNgay = (ms) => { const d = new Date(ms), n = new Date(); return d.toDateString() === n.toDateString() ? p2(d.getHours()) + ':' + p2(d.getMinutes()) : p2(d.getDate()) + '/' + p2(d.getMonth() + 1) }
  const cuaKhung = (m) => { let kq = null; const cx = m.x + m.w / 2, cy = m.y + m.h / 2; for (const k of khung) if (cx >= k.x && cx <= k.x + k.w && cy >= k.y && cy <= k.y + k.h) kq = k; return kq }

  function hienBao(s) { bao.textContent = s; bao.classList.add('hien'); clearTimeout(henBao); henBao = setTimeout(() => bao.classList.remove('hien'), 4500) }
  function datNhin() {
    the.style.transform = 'translate(' + V.x + 'px,' + V.y + 'px) scale(' + V.s + ')'
    const o = 26 * V.s; bang.style.backgroundSize = o + 'px ' + o + 'px'; bang.style.backgroundPosition = V.x + 'px ' + V.y + 'px'
    el('ti').textContent = Math.round(V.s * 100) + '%'
  }

  // ---------- ve ----------
  function datKhung(k) {
    let e = elK.get(k.id)
    if (!e) {
      e = document.createElement('div'); e.className = 'khung'; e.dataset.k = k.id
      e.innerHTML = '<div class="tai">' + TM + '<input spellcheck="false" maxlength="60"><b></b></div><div class="goc" aria-hidden="true"></div>'
      const i = e.querySelector('input'); i.dataset.ten = k.id; i.setAttribute('aria-label', T('cv.tenKhung')); i.title = T('cv.tenKhung')
      the.insertBefore(e, moc); elK.set(k.id, e)
    }
    e.style.setProperty('--m', k.mau)
    e.style.left = k.x + 'px'; e.style.top = k.y + 'px'; e.style.width = k.w + 'px'; e.style.height = k.h + 'px'
    const i = e.querySelector('input')
    if (document.activeElement !== i) { i.value = k.ten; i.style.width = Math.min(320, Math.max(60, Math.round([...k.ten].length * 8.6 + 16))) + 'px' }
    const n = mucs.filter((m) => m.khung === k.id).length, b = e.querySelector('b')
    b.textContent = n
    if (demCu.has(k.id) && demCu.get(k.id) !== n) { b.classList.remove('nay'); void b.offsetWidth; b.classList.add('nay') }
    demCu.set(k.id, n)
  }
  function dungO(m) {
    const e = document.createElement('div'); e.dataset.khoa = m.khoa; e.style.setProperty('--r', nghieng(m.khoa) + 'deg')
    const duoi = '<span class="ngay">' + nhanNgay(m.mtime) + '</span><span class="loai">' + esc(m.kieu === 'dai' ? T('cv.dai', { n: m.seq.length }) : T(m.kieu === 'video' ? 'cv.video' : 'cv.anh')) + '</span>' + G4
    if (m.kieu === 'dai') { e.className = 'o dai'; e.innerHTML = '<div class="dayk">' + m.anh.map((u) => '<img loading="lazy" decoding="async" draggable="false" alt="" src="' + esc(u) + '">').join('') + '</div>' + duoi }
    else if (m.kieu === 'video') { e.className = 'o video'; e.innerHTML = '<video muted playsinline preload="metadata" src="' + esc(m.video) + '#t=0.1"></video>' + PHAT + duoi }
    else { e.className = 'o'; e.innerHTML = '<img class="anh" loading="lazy" decoding="async" draggable="false" alt="" src="' + esc(m.anh) + '">' + duoi }
    if (m.ten) e.title = m.ten
    the.append(e); elO.set(m.khoa, e)
    return e
  }
  function datO(m, e) { e.style.left = m.x + 'px'; e.style.top = m.y + 'px'; e.style.width = m.w + 'px'; e.style.height = m.h + 'px' }
  function bayTuNut(m, e, tre) {
    const r = nutChup.getBoundingClientRect(), nx = (r.left + r.width / 2 - V.x) / V.s, ny = (r.top + r.height / 2 - V.y) / V.s
    e.style.setProperty('--ix', (nx - (m.x + m.w / 2)) + 'px'); e.style.setProperty('--iy', (ny - (m.y + m.h / 2)) + 'px')
    e.classList.add('bay'); void e.offsetWidth; setTimeout(() => e.classList.remove('bay'), tre)
  }
  /** Ve trang thai main tra ve. Giu lai phan tu cua tam con ton tai (khong nap lai anh). Tam MOI xuat hien thi bay ra tu nut tron. */
  function ve(tt, choBay) {
    khung = tt.khung; mucs = tt.muc
    const conK = new Set(khung.map((k) => k.id)); for (const [id, e] of elK) if (!conK.has(id)) { e.remove(); elK.delete(id); demCu.delete(id) }
    const conO = new Set(mucs.map((m) => m.khoa)); for (const [kh, e] of elO) if (!conO.has(kh)) { e.remove(); elO.delete(kh) }
    for (const k of khung) datKhung(k)
    const moi = []
    for (const m of mucs) { let e = elO.get(m.khoa); if (!e) { e = dungO(m); moi.push([m, e]) } datO(m, e) }
    if (choBay && !matchMedia('(prefers-reduced-motion:reduce)').matches) moi.slice(-36).forEach(([m, e], i) => bayTuNut(m, e, 140 + i * 55))
    el('dem').textContent = T('cv.dem', { n: mucs.length, k: khung.length })
    el('soNut').textContent = mucs.length || ''
    const tr = el('trong'); tr.hidden = mucs.length > 0 || khung.length > 0; if (!tr.hidden) tr.textContent = T('cv.trong')
  }
  function nhanKetQua(r) {
    if (!r || !r.tt) return
    ve(r.tt, true)
    if ((r.loiSo === 'hong' || r.loiSo === 'doc') && !daBaoSo) { daBaoSo = true; hienBao(T('cv.loiSo')) }
  }
  const LOI = { ten: 'cv.loiTen', trung: 'cv.loiTrung', 'chi-trong-thu-muc': 'cv.chiTrong' }
  const chuLoi = (loi) => T(LOI[loi] || 'cv.loiHeThong')
  async function lamMoi() {
    if (keo || dangCho || (document.activeElement && document.activeElement.tagName === 'INPUT')) return
    dangCho = true
    try { nhanKetQua(await cv.nap()) } finally { dangCho = false }
  }
  /** Sau khi keo: tam nao co tam diem roi vao khung khac voi thu muc hien tai thi bao main xep lai (ban noi trong thu muc). */
  async function xepTheoViTri(chiTam) {
    const ds = []
    for (const m of (chiTam ? [chiTam] : mucs)) {
      const k = cuaKhung(m), dich = k ? k.id : null
      if (dich === m.khung) continue
      if (m.chiTrongKhung) { if (chiTam) hienBao(T('cv.chiTrong')); continue }
      ds.push({ khoa: m.khoa, khung: dich })
    }
    if (!ds.length) { if (chiTam && chiTam.chiTrongKhung) lamMoiNgay(); return }
    dangCho = true
    try {
      const r = await cv.xep(ds)
      if (r && Array.isArray(r.kq)) {
        const hong = r.kq.find((x) => !x.ok), giu = r.kq.find((x) => x.ok && x.giu > 0)
        if (hong) hienBao(chuLoi(hong.loi)); else if (giu) hienBao(T('cv.giu'))
      }
      nhanKetQua(r)
    } finally { dangCho = false }
  }
  async function lamMoiNgay() { dangCho = true; try { nhanKetQua(await cv.nap()) } finally { dangCho = false } }

  // ---------- doi ten khung = doi ten thu muc ----------
  document.addEventListener('change', async (e) => {
    const id = e.target.dataset && e.target.dataset.ten; if (!id) return
    const gt = e.target.value
    e.target.blur()
    dangCho = true
    try {
      const r = await cv.doiTen(id, gt)
      if (r && r.kq && !r.kq.ok) hienBao(chuLoi(r.kq.loi))
      nhanKetQua(r)
    } finally { dangCho = false }
  })
  document.addEventListener('keydown', (e) => {
    if (!(e.target.dataset && e.target.dataset.ten)) return
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') { const k = khung.find((x) => x.id === e.target.dataset.ten); if (k) e.target.value = k.ten; e.target.blur() }
  })

  // ---------- keo: tam / khung / goc khung / nen ----------
  const batDau = (e, loai, them) => { keo = Object.assign({ loai, x0: e.clientX, y0: e.clientY, dich: false }, them); try { bang.setPointerCapture(e.pointerId) } catch (err) {} }
  bang.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('input') || dangCho) return
    if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur()
    const o = e.target.closest('.o'), goc = e.target.closest('.goc'), tai = e.target.closest('.tai')
    if (o) { const m = mucs.find((x) => x.khoa === o.dataset.khoa); if (!m) return; batDau(e, 'o', { m, gx: m.x, gy: m.y, el: o }) }
    else if (goc) { const k = khung.find((x) => x.id === goc.parentElement.dataset.k); batDau(e, 'co', { k, gw: k.w, gh: k.h, el: goc.parentElement }) }
    else if (tai) { const k = khung.find((x) => x.id === tai.parentElement.dataset.k); batDau(e, 'khung', { k, gx: k.x, gy: k.y, el: tai.parentElement, trong: mucs.filter((m) => m.khung === k.id).map((m) => ({ m, x: m.x, y: m.y, el: elO.get(m.khoa) })) }) }
    else { bang.classList.add('keo'); batDau(e, 'nen', { gx: V.x, gy: V.y }) }
    e.preventDefault()
  })
  bang.addEventListener('pointermove', (e) => {
    if (!keo) return
    const dx = e.clientX - keo.x0, dy = e.clientY - keo.y0, s = V.s
    if (!keo.dich && Math.hypot(dx, dy) < 3) return
    if (!keo.dich) { keo.dich = true; if (keo.loai === 'o') { the.append(keo.el); keo.el.classList.add('nang') } }
    if (keo.loai === 'nen') { V.x = keo.gx + dx; V.y = keo.gy + dy; datNhin(); return }
    if (keo.loai === 'o') {
      keo.m.x = keo.gx + dx / s; keo.m.y = keo.gy + dy / s; datO(keo.m, keo.el)
      const k = keo.m.chiTrongKhung ? null : cuaKhung(keo.m); elK.forEach((x, id) => x.classList.toggle('vao', !!k && k.id === id))
    } else if (keo.loai === 'khung') {
      keo.k.x = keo.gx + dx / s; keo.k.y = keo.gy + dy / s; keo.el.style.left = keo.k.x + 'px'; keo.el.style.top = keo.k.y + 'px'
      for (const t of keo.trong) { t.m.x = t.x + dx / s; t.m.y = t.y + dy / s; if (t.el) datO(t.m, t.el) }
    } else if (keo.loai === 'co') {
      keo.k.w = Math.max(240, keo.gw + dx / s); keo.k.h = Math.max(180, keo.gh + dy / s); keo.el.style.width = keo.k.w + 'px'; keo.el.style.height = keo.k.h + 'px'
    }
  })
  const tron = (m) => ({ x: Math.round(m.x), y: Math.round(m.y) })
  function tha() {
    if (!keo) return
    const k0 = keo; keo = null
    bang.classList.remove('keo'); elK.forEach((x) => x.classList.remove('vao'))
    if (k0.el) k0.el.classList.remove('nang')
    if (!k0.dich || k0.loai === 'nen') return
    if (k0.loai === 'o') {
      const m = k0.m; m.x = Math.round(m.x); m.y = Math.round(m.y)
      const k = cuaKhung(m)
      if (m.chiTrongKhung && (k ? k.id : null) !== m.khung) { m.x = k0.gx; m.y = k0.gy; datO(m, k0.el); hienBao(T('cv.chiTrong')); return }
      cv.luu({ vt: { [m.khoa]: tron(m) } })
      xepTheoViTri(m)
      return
    }
    const g = k0.k; g.x = Math.round(g.x); g.y = Math.round(g.y); g.w = Math.round(g.w); g.h = Math.round(g.h)
    const vt = {}
    if (k0.trong) for (const t of k0.trong) vt[t.m.khoa] = tron(t.m)
    cv.luu({ khung: [{ id: g.id, x: g.x, y: g.y, w: g.w, h: g.h }], vt })
    xepTheoViTri(null)    // khung vua doi cho / doi co co the om them tam, hoac bo lai tam
  }
  bang.addEventListener('pointerup', tha); bang.addEventListener('pointercancel', tha)
  bang.addEventListener('dblclick', (e) => {
    const o = e.target.closest('.o'), tai = e.target.closest('.tai')
    if (o) cv.mo(o.dataset.khoa)
    else if (tai && !e.target.closest('input')) cv.moThuMuc(tai.parentElement.dataset.k)
  })

  // ---------- goc nhin ----------
  function phong(k, cx, cy) { const s2 = Math.min(3, Math.max(.08, V.s * k)); V.x = cx - (cx - V.x) * (s2 / V.s); V.y = cy - (cy - V.y) * (s2 / V.s); V.s = s2; datNhin() }
  bang.addEventListener('wheel', (e) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) phong(Math.exp(-e.deltaY * .01), e.clientX, e.clientY); else { V.x -= e.deltaX; V.y -= e.deltaY; datNhin() } }, { passive: false })
  function vua() {
    const tat = [{ x: 40, y: 60, w: 900, h: 180 }, ...khung.map((k) => ({ x: k.x, y: k.y - 36, w: k.w, h: k.h + 36 })), ...mucs]
    const x0 = Math.min(...tat.map((a) => a.x)), y0 = Math.min(...tat.map((a) => a.y)), x1 = Math.max(...tat.map((a) => a.x + a.w)), y1 = Math.max(...tat.map((a) => a.y + a.h))
    const leX = 40, tren = 70, duoi = 84
    V.s = Math.min(1.25, Math.max(.08, Math.min((innerWidth - leX * 2) / (x1 - x0), (innerHeight - tren - duoi) / (y1 - y0))))
    V.x = (innerWidth - (x1 - x0) * V.s) / 2 - x0 * V.s; V.y = tren + (innerHeight - tren - duoi - (y1 - y0) * V.s) / 2 - y0 * V.s
    datNhin()
  }
  el('to').addEventListener('click', () => phong(1.25, innerWidth / 2, innerHeight / 2))
  el('nho').addEventListener('click', () => phong(.8, innerWidth / 2, innerHeight / 2))
  el('vua').addEventListener('click', vua)
  el('moTM').addEventListener('click', () => cv.moThuMuc(null))
  el('chup').addEventListener('click', () => cv.chup())
  el('them').addEventListener('click', async () => {
    if (dangCho) return
    dangCho = true
    try {
      const r = await cv.taoKhung(Math.round((innerWidth / 2 - V.x) / V.s - 320), Math.round((innerHeight / 2 - V.y) / V.s - 200))
      if (r && r.kq && !r.kq.ok) hienBao(chuLoi(r.kq.loi))
      nhanKetQua(r)
      const e = r && r.kq && r.kq.ok ? elK.get(r.kq.id) : null
      if (e) { const i = e.querySelector('input'); i.focus(); i.select() }
    } finally { dangCho = false }
  })

  // ---------- nap ----------
  addEventListener('focus', () => lamMoi())                 // quay lai cua so: thu muc co the da doi trong Finder
  cv.onLamMoi(() => setTimeout(lamMoi, 200))                 // vua chup xong mot tam
  window.__cv = { V, vua, trangThai: () => ({ khung, mucs }) }  // cho bai do
  datNhin()
  cv.nap().then((r) => {
    if (!r || !r.tt) return
    khung = r.tt.khung; mucs = r.tt.muc; vua()               // dat goc nhin TRUOC khi ve de luot chia bai bay dung cho
    nhanKetQua(r)
  })
})()
