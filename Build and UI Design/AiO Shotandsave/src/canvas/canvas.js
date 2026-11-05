'use strict'
/* CANVAS Y TUONG (12/10) — trang ve, PHAN LOI. Su that ve "tam nao thuoc khung nao" nam o THU MUC (main: src/canvas-kho.js); trang nay
   chi ve trang thai main tra ve, va sau moi thao tac co doi thu muc (tha vao khung, doi ten, tao / xoa khung, doi co khung) thi lay
   trang thai MOI tu main roi ve lai. Vi tri (keo tam, keo khung) gui ve main de nho.
   Toa do: moi thu nam trong #the (toa do bang); goc nhin V = { x, y, s }: man hinh = bang * s + (x, y).

   12/10 chieu (anh: "mirro - figjam co gi lam tuong tu di em"): them chon nhieu, ghi chu dan / chu / hinh / link / mui ten / but ve,
   hoan tac, nhan doi, khoa, lop, can hang, xep gon, tim, ban do nho, xuat khung, dan + tha anh tu ngoai, keo ra app khac.
   Chia 3 file dung chung doi tuong window.CVX: canvas.js (loi: trang thai, chon, keo, hoan tac, phim) · canvas-vat.js (ghi chu / chu /
   hinh / link / mui ten / but ve) · canvas-tien.js (thanh ngu canh, can hang, tim, ban do, xuat, clipboard, tha file).
   Khoa: 'o:<khoa tam>' anh / video / dai · 'v:<id>' vat · 'c:<id>' mui ten · 's:<id>' net ve · 'f:<id>' khung. */
;(() => {
  const cv = window.cv, T = cv.t
  const el = (id) => document.getElementById(id)
  const bang = el('bang'), the = el('the'), moc = el('moc'), nutChup = el('chup'), bao = el('bao')
  const X = window.CVX = {
    cv, T, el, bang, the, moc, nutChup,
    V: { x: 60, y: 40, s: 1 },
    khung: [], mucs: [], vat: [], noi: [], net: [], z: {}, khoaMap: {},
    mK: new Map(), mO: new Map(), mV: new Map(), mS: new Map(), mN: new Map(),
    elK: new Map(), elO: new Map(), elV: new Map(),
    sel: new Set(), tool: 'chon', dangCho: false, space: false,
  }
  const V = X.V
  const demCu = new Map()
  let keo = null, daBaoSo = false, henBao = null, henMo = null, daiKhungHoi = null

  document.documentElement.lang = cv.lang
  el('tieu').innerHTML = T('cv.tieu') + '<small></small>'
  el('tieu').querySelector('small').textContent = T('cv.phu')
  el('chuThem').textContent = T('cv.khungMoi'); el('chuMo').textContent = T('cv.moThuMuc'); el('chuVua').textContent = T('cv.vua')
  for (const [id, khoa] of [['them', 'cv.khungMoi'], ['moTM', 'cv.moThuMuc'], ['vua', 'cv.vua'], ['chup', 'cv.chup']]) { el(id).title = T(khoa); el(id).setAttribute('aria-label', T(khoa)) }

  const TM = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'
  const PHAT = '<span class="phat"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></span>'
  const RA = '<button class="rakeo" draggable="true" tabindex="-1" aria-label="" type="button"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></button>'
  const G4 = '<i class="g g1"></i><i class="g g2"></i><i class="g g3"></i><i class="g g4"></i>'
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const bam = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  const nghieng = (khoa) => ((bam(khoa) % 71) / 10 - 3.5).toFixed(1)
  const p2 = (v) => String(v).padStart(2, '0')
  const nhanNgay = (ms) => { const d = new Date(ms), n = new Date(); return d.toDateString() === n.toDateString() ? p2(d.getHours()) + ':' + p2(d.getMinutes()) : p2(d.getDate()) + '/' + p2(d.getMonth() + 1) }
  const tron = (n) => Math.round(n)
  Object.assign(X, { esc, TM, p2 })

  // ---------- hinh hoc ----------
  const tamTrong = (r, k) => { const cx = r.x + r.w / 2, cy = r.y + r.h / 2; return cx >= k.x && cx <= k.x + k.w && cy >= k.y && cy <= k.y + k.h }
  const cuaKhung = (r) => { let kq = null; for (const k of X.khung) if (tamTrong(r, k)) kq = k; return kq }
  function rectOf(key) {
    const t = key[0], id = key.slice(2)
    if (t === 'o') return X.mO.get(id) || null
    if (t === 'v') return X.mV.get(id) || null
    if (t === 'f') return X.mK.get(id) || null
    if (t === 's') { const n = X.mS.get(id); if (!n) return null; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < n.pts.length; i += 2) { x0 = Math.min(x0, n.pts[i]); x1 = Math.max(x1, n.pts[i]); y0 = Math.min(y0, n.pts[i + 1]); y1 = Math.max(y1, n.pts[i + 1]) } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } }
    return null
  }
  const elOf = (key) => { const t = key[0], id = key.slice(2); return t === 'o' ? X.elO.get(id) : t === 'v' ? X.elV.get(id) : t === 'f' ? X.elK.get(id) : null }
  const khoaCua = (k) => !!X.khoaMap[k]
  Object.assign(X, { tamTrong, cuaKhung, rectOf, elOf, khoaCua })
  const hopTong = (rs) => {
    const x0 = Math.min(...rs.map((a) => a.x)), y0 = Math.min(...rs.map((a) => a.y)), x1 = Math.max(...rs.map((a) => a.x + a.w)), y1 = Math.max(...rs.map((a) => a.y + a.h))
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }
  X.hopTong = hopTong

  function hienBao(s) { bao.textContent = s; bao.classList.add('hien'); clearTimeout(henBao); henBao = setTimeout(() => bao.classList.remove('hien'), 4500) }
  X.hienBao = hienBao
  let datNhinCho = false
  function datNhin() {
    the.style.transform = 'translate(' + V.x + 'px,' + V.y + 'px) scale(' + V.s + ')'
    const o = 26 * V.s; bang.style.backgroundSize = o + 'px ' + o + 'px'; bang.style.backgroundPosition = V.x + 'px ' + V.y + 'px'
    el('ti').textContent = Math.round(V.s * 100) + '%'
    if (!datNhinCho) { datNhinCho = true; requestAnimationFrame(() => { datNhinCho = false; if (X.capNhatNgu) X.capNhatNgu(); if (X.veBanDo) X.veBanDo() }) }
  }
  X.datNhin = datNhin

  // ---------- ve ----------
  function datKhung(k) {
    let e = X.elK.get(k.id)
    if (!e) {
      e = document.createElement('div'); e.className = 'khung'; e.dataset.k = k.id
      e.innerHTML = '<div class="tai">' + TM + '<input spellcheck="false" maxlength="60"><b></b></div><div class="goc" aria-hidden="true"></div>'
      const i = e.querySelector('input'); i.dataset.ten = k.id; i.setAttribute('aria-label', T('cv.tenKhung')); i.title = T('cv.tenKhung')
      the.insertBefore(e, moc); X.elK.set(k.id, e)
    }
    e.style.setProperty('--m', k.mau)
    e.style.left = k.x + 'px'; e.style.top = k.y + 'px'; e.style.width = k.w + 'px'; e.style.height = k.h + 'px'
    e.classList.toggle('khoa', khoaCua('f:' + k.id))
    const i = e.querySelector('input')
    if (document.activeElement !== i) { i.value = k.ten; i.style.width = Math.min(320, Math.max(60, Math.round([...k.ten].length * 8.6 + 16))) + 'px' }
    const n = X.mucs.filter((m) => m.khung === k.id).length, b = e.querySelector('b')
    b.textContent = n
    if (demCu.has(k.id) && demCu.get(k.id) !== n) { b.classList.remove('nay'); void b.offsetWidth; b.classList.add('nay') }
    demCu.set(k.id, n)
  }
  function dungO(m) {
    const e = document.createElement('div'); e.dataset.khoa = m.khoa; e.style.setProperty('--r', nghieng(m.khoa) + 'deg')
    const duoi = '<span class="ngay">' + nhanNgay(m.mtime) + '</span><span class="loai">' + esc(m.kieu === 'dai' ? T('cv.dai', { n: m.seq.length }) : T(m.kieu === 'video' ? 'cv.video' : 'cv.anh')) + '</span>' + G4
    const ra = m.kieu === 'dai' ? '' : RA
    if (m.kieu === 'dai') { e.className = 'o dai'; e.innerHTML = '<div class="dayk">' + m.anh.map((u) => '<img loading="lazy" decoding="async" draggable="false" alt="" src="' + esc(u) + '">').join('') + '</div>' + duoi }
    else if (m.kieu === 'video') { e.className = 'o video'; e.innerHTML = '<video muted playsinline preload="metadata" src="' + esc(m.video) + '#t=0.1"></video>' + PHAT + duoi + ra }
    else { e.className = 'o'; e.innerHTML = '<img class="anh" loading="lazy" decoding="async" draggable="false" alt="" src="' + esc(m.anh) + '">' + duoi + ra }
    const r = e.querySelector('.rakeo'); if (r) { r.title = T('cv.c.keoRa'); r.setAttribute('aria-label', T('cv.c.keoRa')) }
    if (m.ten) e.title = m.ten
    the.append(e); X.elO.set(m.khoa, e)
    return e
  }
  function datO(m, e) { e.style.left = m.x + 'px'; e.style.top = m.y + 'px'; e.style.width = m.w + 'px'; e.style.height = m.h + 'px' }
  X.datO = datO
  function bayTuNut(m, e, tre) {
    const r = nutChup.getBoundingClientRect(), nx = (r.left + r.width / 2 - V.x) / V.s, ny = (r.top + r.height / 2 - V.y) / V.s
    e.style.setProperty('--ix', (nx - (m.x + m.w / 2)) + 'px'); e.style.setProperty('--iy', (ny - (m.y + m.h / 2)) + 'px')
    e.classList.add('bay'); void e.offsetWidth; setTimeout(() => e.classList.remove('bay'), tre)
  }
  /** Thu tu chong (z): 'o:' va 'v:' xep theo X.z; khung luon nam duoi cung, mui ten / net ve nam tren cung. */
  function datLop() {
    const ds = []
    for (const [id, e] of X.elO) ds.push([e, X.z['o:' + id] || 0])
    for (const [id, e] of X.elV) ds.push([e, X.z['v:' + id] || 0])
    ds.sort((a, b) => a[1] - b[1])
    ds.forEach(([e], i) => { e.style.zIndex = String(10 + i) })
  }
  X.datLop = datLop
  function ve(tt, choBay) {
    X.khung = tt.khung; X.mucs = tt.muc
    X.vat = tt.vat || []; X.noi = tt.noi || []; X.net = tt.net || []; X.z = tt.z || {}; X.khoaMap = tt.khoa || {}
    X.mK = new Map(X.khung.map((k) => [k.id, k])); X.mO = new Map(X.mucs.map((m) => [m.khoa, m]))
    X.mV = new Map(X.vat.map((v) => [v.id, v])); X.mS = new Map(X.net.map((n) => [n.id, n])); X.mN = new Map(X.noi.map((n) => [n.id, n]))
    const conK = new Set(X.khung.map((k) => k.id)); for (const [id, e] of X.elK) if (!conK.has(id)) { e.remove(); X.elK.delete(id); demCu.delete(id) }
    const conO = new Set(X.mucs.map((m) => m.khoa)); for (const [kh, e] of X.elO) if (!conO.has(kh)) { e.remove(); X.elO.delete(kh) }
    for (const k of X.khung) datKhung(k)
    const moi = []
    for (const m of X.mucs) { let e = X.elO.get(m.khoa); if (!e) { e = dungO(m); moi.push([m, e]) } datO(m, e); e.classList.toggle('khoa', khoaCua('o:' + m.khoa)) }
    if (choBay && !matchMedia('(prefers-reduced-motion:reduce)').matches) moi.slice(-36).forEach(([m, e], i) => bayTuNut(m, e, 140 + i * 55))
    if (X.veVat) X.veVat()
    datLop()
    for (const k of [...X.sel]) if (!rectOf(k) && !X.mN.has(k.slice(2))) X.sel.delete(k)
    el('dem').textContent = T('cv.dem', { n: X.mucs.length, k: X.khung.length })
    el('soNut').textContent = X.mucs.length || ''
    const tr = el('trong'); const rong = X.mucs.length === 0 && X.khung.length === 0 && X.vat.length === 0 && X.net.length === 0
    tr.hidden = !rong; if (rong) tr.textContent = T('cv.trong')
    capNhatChon()
    if (X.timBieu) X.timBieu()
  }
  function nhanKetQua(r) {
    if (!r || !r.tt) return
    ve(r.tt, true)
    if ((r.loiSo === 'hong' || r.loiSo === 'doc') && !daBaoSo) { daBaoSo = true; hienBao(T('cv.loiSo')) }
  }
  X.nhanKetQua = nhanKetQua
  const LOI = { ten: 'cv.loiTen', trung: 'cv.loiTrung', 'chi-trong-thu-muc': 'cv.chiTrong' }
  const chuLoi = (loi) => T(LOI[loi] || 'cv.loiHeThong')
  X.chuLoi = chuLoi
  async function lamMoi() {
    if (keo || X.dangCho || (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.isContentEditable))) return
    X.dangCho = true
    try { nhanKetQua(await cv.nap()) } finally { X.dangCho = false }
  }
  async function lamMoiNgay() { X.dangCho = true; try { nhanKetQua(await cv.nap()) } finally { X.dangCho = false } }
  X.lamMoiNgay = lamMoiNgay

  /** Luu cac thu khong phai anh (vat, mui ten, net, lop, khoa) xuong may chu. */
  X.luuDoc = () => cv.luuVat({ vat: X.vat, noi: X.noi, net: X.net, z: X.z, khoa: X.khoaMap })

  // ---------- chon ----------
  function capNhatChon() {
    for (const [id, e] of X.elO) e.classList.toggle('chon', X.sel.has('o:' + id))
    for (const [id, e] of X.elV) e.classList.toggle('chon', X.sel.has('v:' + id))
    for (const [id, e] of X.elK) e.classList.toggle('chon', X.sel.has('f:' + id))
    if (X.veLopChon) X.veLopChon()
    if (X.capNhatNgu) X.capNhatNgu()
    if (X.veBanDo) X.veBanDo()
  }
  X.chon = (keys) => { X.sel = new Set(keys); capNhatChon() }
  X.themChon = (k) => { if (X.sel.has(k)) X.sel.delete(k); else X.sel.add(k); capNhatChon() }
  X.boChon = () => { if (X.sel.size) { X.sel = new Set(); capNhatChon() } }
  X.capNhatChon = capNhatChon
  X.doiCongCu = (t) => {
    X.tool = t
    bang.dataset.tool = t
    document.querySelectorAll('[data-cc]').forEach((b) => b.classList.toggle('dang', b.dataset.cc === t))
  }
  X.chonLaDon = () => (X.sel.size === 1 ? [...X.sel][0] : null)

  // ---------- hoan tac ----------
  const lui = [], tien = []
  const chup = () => ({
    vt: X.mucs.map((m) => [m.khoa, m.x, m.y, m.khung || null]),
    fr: X.khung.map((k) => [k.id, k.x, k.y, k.w, k.h, k.mau]),
    doc: JSON.stringify({ vat: X.vat, noi: X.noi, net: X.net, z: X.z, khoa: X.khoaMap }),
  })
  const khacNhau = (a, b) => a.doc !== b.doc || JSON.stringify(a.vt) !== JSON.stringify(b.vt) || JSON.stringify(a.fr) !== JSON.stringify(b.fr)
  X.chup = chup
  X.day = (truoc, sau) => { if (!khacNhau(truoc, sau)) return; lui.push({ truoc, sau }); if (lui.length > 100) lui.shift(); tien.length = 0 }
  async function apDung(s) {
    X.dangCho = true
    try {
      const doi = []
      for (const [khoa, , , kh] of s.vt) { const m = X.mO.get(khoa); if (m && !m.chiTrongKhung && (m.khung || null) !== kh) doi.push({ khoa, khung: kh }) }
      if (doi.length) await cv.xep(doi)
      const vt = {}; for (const [khoa, x, y] of s.vt) vt[khoa] = { x, y }
      cv.luu({ khung: s.fr.map(([id, x, y, w, h, mau]) => ({ id, x, y, w, h, mau })), vt })
      cv.luuVat(JSON.parse(s.doc))
      nhanKetQua(await cv.nap())
    } finally { X.dangCho = false }
  }
  X.hoanTac = async () => { if (X.dangCho || !lui.length) return; const b = lui.pop(); tien.push(b); await apDung(b.truoc) }
  X.lamLai = async () => { if (X.dangCho || !tien.length) return; const b = tien.pop(); lui.push(b); await apDung(b.sau) }
  X.soLui = () => lui.length

  /** Sau khi keo: tam nao co tam diem roi vao khung khac voi thu muc hien tai thi bao main xep lai (ban noi trong thu muc). */
  async function xepTheoViTri(ds0) {
    const ds = []
    for (const m of (ds0 || X.mucs)) {
      const k = cuaKhung(m), dich = k ? k.id : null
      if (dich === (m.khung || null)) continue
      if (m.chiTrongKhung) { if (ds0) hienBao(T('cv.chiTrong')); continue }
      ds.push({ khoa: m.khoa, khung: dich })
    }
    if (!ds.length) { if (ds0 && ds0.some((m) => m.chiTrongKhung)) await lamMoiNgay(); return }
    X.dangCho = true
    try {
      const r = await cv.xep(ds)
      if (r && Array.isArray(r.kq)) {
        const hong = r.kq.find((x) => !x.ok), giu = r.kq.find((x) => x.ok && x.giu > 0)
        if (hong) hienBao(chuLoi(hong.loi)); else if (giu) hienBao(T('cv.giu'))
      }
      nhanKetQua(r)
    } finally { X.dangCho = false }
  }
  X.xepTheoViTri = xepTheoViTri

  // ---------- doi ten khung = doi ten thu muc ----------
  document.addEventListener('change', async (e) => {
    const id = e.target.dataset && e.target.dataset.ten; if (!id) return
    const gt = e.target.value
    e.target.blur()
    X.dangCho = true
    try {
      const r = await cv.doiTen(id, gt)
      if (r && r.kq && !r.kq.ok) hienBao(chuLoi(r.kq.loi))
      nhanKetQua(r)
    } finally { X.dangCho = false }
  })
  document.addEventListener('keydown', (e) => {
    if (!(e.target.dataset && e.target.dataset.ten)) return
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') { const k = X.mK.get(e.target.dataset.ten); if (k) e.target.value = k.ten; e.target.blur() }
  })

  // ---------- keo ----------
  const dangGo = () => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable) }
  X.dangGo = dangGo
  const batDau = (e, loai, them) => { keo = Object.assign({ loai, x0: e.clientX, y0: e.clientY, dich: false, shift: e.shiftKey }, them); try { bang.setPointerCapture(e.pointerId) } catch (err) {} }
  const toaBang = (e) => ({ x: (e.clientX - V.x) / V.s, y: (e.clientY - V.y) / V.s })
  X.toaBang = toaBang

  /** Danh sach thu se di chuyen khi keo tap chon: khung keo theo moi thu nam trong no. */
  function dungMover(keys) {
    const ds = [], co = new Set()
    const them = (k) => {
      if (co.has(k) || khoaCua(k)) return
      const t = k[0], id = k.slice(2)
      if (t === 'o') { const m = X.mO.get(id); if (m) { co.add(k); ds.push({ t, k, ref: m, x0: m.x, y0: m.y }) } }
      else if (t === 'v') { const v = X.mV.get(id); if (v) { co.add(k); ds.push({ t, k, ref: v, x0: v.x, y0: v.y }) } }
      else if (t === 'f') { const f = X.mK.get(id); if (f) { co.add(k); ds.push({ t, k, ref: f, x0: f.x, y0: f.y }) } }
      else if (t === 's') { const n = X.mS.get(id); if (n) { co.add(k); ds.push({ t, k, ref: n, p0: n.pts.slice() }) } }
      else if (t === 'c') {
        const n = X.mN.get(id)
        if (n && (!n.a.k || !n.b.k)) { co.add(k); ds.push({ t, k, ref: n, a0: Object.assign({}, n.a), b0: Object.assign({}, n.b) }) }
      }
    }
    for (const k of keys) {
      if (k[0] !== 'f' || khoaCua(k)) continue
      them(k)
      const f = X.mK.get(k.slice(2))
      for (const m of X.mucs) if (tamTrong(m, f)) them('o:' + m.khoa)
      for (const v of X.vat) if (tamTrong(v, f)) them('v:' + v.id)
      for (const n of X.net) { const r = rectOf('s:' + n.id); if (r && tamTrong(r, f)) them('s:' + n.id) }
    }
    for (const k of keys) them(k)
    return ds
  }
  /** Cac duong gong (canh / tam cua thu khong di chuyen) de hut vao khi keo. */
  function duongGong(movers) {
    const di = new Set(movers.map((d) => d.k)), xs = [], ys = []
    const dua = (r) => { xs.push(r.x, r.x + r.w / 2, r.x + r.w); ys.push(r.y, r.y + r.h / 2, r.y + r.h) }
    for (const m of X.mucs) if (!di.has('o:' + m.khoa)) dua(m)
    for (const v of X.vat) if (!di.has('v:' + v.id)) dua(v)
    for (const k of X.khung) if (!di.has('f:' + k.id)) dua(k)
    return { xs, ys }
  }
  function veGong(sx, sy, hop) {
    const g = el('gong'); g.innerHTML = ''
    const them = (css) => { const i = document.createElement('i'); i.style.cssText = css; g.append(i) }
    if (sx != null) them('left:' + sx + 'px;top:' + (hop.y - 40) + 'px;width:1px;height:' + (hop.h + 80) + 'px')
    if (sy != null) them('top:' + sy + 'px;left:' + (hop.x - 40) + 'px;height:1px;width:' + (hop.w + 80) + 'px')
  }

  bang.addEventListener('pointerdown', (e) => {
    if (X.dangCho) return
    if (e.target.closest('input, textarea, [contenteditable="plaintext-only"], [contenteditable="true"]')) return
    if (e.target.closest('.rakeo')) return                                  // nut keo ra app khac: de trinh duyet tu bat dau keo
    if (dangGo()) { document.activeElement.blur(); if (X.chotSua) X.chotSua() }
    const pan = e.button === 1 || (e.button === 0 && (X.tool === 'tay' || X.space))
    if (pan) { bang.classList.add('keo'); batDau(e, 'nen', { gx: V.x, gy: V.y }); e.preventDefault(); return }
    if (e.button !== 0) return
    if (X.tool !== 'chon' && X.congCuXuong && X.congCuXuong(e)) { e.preventDefault(); return }
    // Alt + keo mot tam anh = keo RA app khac (HTML5 drag, main goi startDrag trong nhip dragstart)
    const oAlt = e.altKey && e.target.closest('.o:not(.dai)')
    if (oAlt) { oAlt.draggable = true; const nha = () => { oAlt.draggable = false; removeEventListener('pointerup', nha, true) }; addEventListener('pointerup', nha, true); return }
    const o = e.target.closest('.o'), v = e.target.closest('.v'), goc = e.target.closest('.goc'), tai = e.target.closest('.tai'), cc = e.target.closest('.cc')
    const hit = e.target.closest('[data-hk]')
    const kha = o ? 'o:' + o.dataset.khoa : v ? 'v:' + v.dataset.id : hit ? hit.dataset.hk : tai ? 'f:' + tai.parentElement.dataset.k : null
    if (cc && v) {
      const vv = X.mV.get(v.dataset.id)
      if (vv && !khoaCua('v:' + vv.id)) { X.chon(['v:' + vv.id]); batDau(e, 'covat', { v: vv, gw: vv.w, gh: vv.h, el: v, truoc: chup() }); e.preventDefault(); return }
    }
    if (goc) {
      const k = X.mK.get(goc.parentElement.dataset.k)
      if (k && !khoaCua('f:' + k.id)) { batDau(e, 'co', { k, gw: k.w, gh: k.h, el: goc.parentElement, truoc: chup() }); e.preventDefault(); return }
    }
    if (kha) {
      if (e.shiftKey) X.themChon(kha)
      else if (!X.sel.has(kha)) X.chon([kha])
      if (!X.sel.has(kha)) { e.preventDefault(); return }
      const movers = dungMover([...X.sel])
      if (!movers.length) {
        if (X.sel.size && [...X.sel].some(khoaCua)) hienBao(T('cv.dangKhoa'))
        e.preventDefault(); return
      }
      const rs = movers.filter((d) => d.t !== 's' && d.t !== 'c').map((d) => d.ref)
      const hop = rs.length ? hopTong(rs) : null
      batDau(e, 'dichChuyen', { movers, truoc: chup(), keyGoc: kha, hop, gong: hop ? duongGong(movers) : null, hop0: hop && Object.assign({}, hop) })
      e.preventDefault(); return
    }
    // nen: khoanh vung chon (hoac bam rong = bo chon)
    batDau(e, 'mq', { co: e.shiftKey ? new Set(X.sel) : new Set() })
    if (!e.shiftKey) X.boChon()
    e.preventDefault()
  })
  bang.addEventListener('pointermove', (e) => {
    if (!keo) return
    const dx = e.clientX - keo.x0, dy = e.clientY - keo.y0, s = V.s
    if (!keo.dich && Math.hypot(dx, dy) < 3) return
    if (!keo.dich) {
      keo.dich = true
      if (keo.loai === 'dichChuyen') for (const d of keo.movers) { const e2 = elOf(d.k); if (e2 && d.t === 'o') { the.append(e2); e2.classList.add('nang') } }
    }
    if (keo.loai === 'nen') { V.x = keo.gx + dx; V.y = keo.gy + dy; datNhin(); return }
    if (keo.loai === 'mq') {
      const m = el('mq'); m.hidden = false
      const l = Math.min(keo.x0, e.clientX), t = Math.min(keo.y0, e.clientY)
      m.style.left = l + 'px'; m.style.top = t + 'px'; m.style.width = Math.abs(dx) + 'px'; m.style.height = Math.abs(dy) + 'px'
      const a = { x: (l - V.x) / V.s, y: (t - V.y) / V.s, w: Math.abs(dx) / V.s, h: Math.abs(dy) / V.s }
      const trung = (r) => r.x < a.x + a.w && a.x < r.x + r.w && r.y < a.y + a.h && a.y < r.y + r.h
      const kq = new Set(keo.co)
      for (const m2 of X.mucs) if (trung(m2)) kq.add('o:' + m2.khoa)
      for (const v of X.vat) if (trung(v)) kq.add('v:' + v.id)
      for (const n of X.net) { const r = rectOf('s:' + n.id); if (r && trung(r)) kq.add('s:' + n.id) }
      for (const k of X.khung) if (k.x >= a.x && k.y >= a.y && k.x + k.w <= a.x + a.w && k.y + k.h <= a.y + a.h) kq.add('f:' + k.id)
      for (const n of X.noi) if (n.a.k && n.b.k && kq.has(n.a.k) && kq.has(n.b.k)) kq.add('c:' + n.id)
      X.sel = kq; capNhatChon()
      return
    }
    if (keo.loai === 'dichChuyen') {
      let ddx = dx / s, ddy = dy / s
      if (keo.hop && keo.gong && !(e.metaKey || e.ctrlKey)) {                  // hut vao duong gong
        const ng = 6 / s, h = keo.hop0
        let sx = null, sy = null, bx = ng + 1, by = ng + 1
        for (const gx of [h.x + ddx, h.x + h.w / 2 + ddx, h.x + h.w + ddx]) for (const t of keo.gong.xs) { const d = Math.abs(t - gx); if (d < bx && d <= ng) { bx = d; ddx += t - gx; sx = t } }
        for (const gy of [h.y + ddy, h.y + h.h / 2 + ddy, h.y + h.h + ddy]) for (const t of keo.gong.ys) { const d = Math.abs(t - gy); if (d < by && d <= ng) { by = d; ddy += t - gy; sy = t } }
        veGong(sx, sy, { x: h.x + ddx, y: h.y + ddy, w: h.w, h: h.h })
      }
      for (const d of keo.movers) {
        if (d.t === 'o') { d.ref.x = d.x0 + ddx; d.ref.y = d.y0 + ddy; const e2 = X.elO.get(d.ref.khoa); if (e2) datO(d.ref, e2) }
        else if (d.t === 'v') { d.ref.x = d.x0 + ddx; d.ref.y = d.y0 + ddy; if (X.datV) X.datV(d.ref) }
        else if (d.t === 'f') { d.ref.x = d.x0 + ddx; d.ref.y = d.y0 + ddy; const e2 = X.elK.get(d.ref.id); if (e2) { e2.style.left = d.ref.x + 'px'; e2.style.top = d.ref.y + 'px' } }
        else if (d.t === 's') { for (let i = 0; i < d.p0.length; i += 2) { d.ref.pts[i] = d.p0[i] + ddx; d.ref.pts[i + 1] = d.p0[i + 1] + ddy } }
        else if (d.t === 'c') { if (!d.a0.k) { d.ref.a.x = d.a0.x + ddx; d.ref.a.y = d.a0.y + ddy } if (!d.b0.k) { d.ref.b.x = d.b0.x + ddx; d.ref.b.y = d.b0.y + ddy } }
      }
      keo.ddx = ddx; keo.ddy = ddy
      if (X.veLop) X.veLop()
      const m = keo.movers.length === 1 && keo.movers[0].t === 'o' && !keo.movers[0].ref.chiTrongKhung ? keo.movers[0].ref : null
      const kv = m ? cuaKhung(m) : null
      X.elK.forEach((x, id) => x.classList.toggle('vao', !!kv && kv.id === id))
      if (X.capNhatNgu) X.capNhatNgu()
      if (X.veBanDo) X.veBanDo()
    } else if (keo.loai === 'co') {
      keo.k.w = Math.max(240, keo.gw + dx / s); keo.k.h = Math.max(180, keo.gh + dy / s); keo.el.style.width = keo.k.w + 'px'; keo.el.style.height = keo.k.h + 'px'
      if (X.capNhatNgu) X.capNhatNgu()
    } else if (keo.loai === 'covat') {
      keo.v.w = Math.max(60, keo.gw + dx / s); keo.v.h = Math.max(36, keo.gh + dy / s)
      if (X.datV) X.datV(keo.v)
      if (X.veLop) X.veLop()
      if (X.capNhatNgu) X.capNhatNgu()
    }
  })
  /** Luu sau khi mot nhom da di chuyen (keo hoac phim mui ten): lam tron, kiem tra tam "chi trong thu muc", gui main, xep khung, lich su. */
  async function luuMover(movers, truoc) {
    const vt = {}, kh = [], dsO = [], thayDoc = movers.some((d) => d.t === 'v' || d.t === 's' || d.t === 'c')
    let coKhung = false
    for (const d of movers) {
      if (d.t === 'o') {
        const m = d.ref; m.x = tron(m.x); m.y = tron(m.y)
        const k = cuaKhung(m)
        if (m.chiTrongKhung && (k ? k.id : null) !== m.khung) { m.x = d.x0; m.y = d.y0; const e2 = X.elO.get(m.khoa); if (e2) datO(m, e2); hienBao(T('cv.chiTrong')); continue }
        vt[m.khoa] = { x: m.x, y: m.y }; dsO.push(m)
      } else if (d.t === 'f') { coKhung = true; d.ref.x = tron(d.ref.x); d.ref.y = tron(d.ref.y); kh.push({ id: d.ref.id, x: d.ref.x, y: d.ref.y, w: d.ref.w, h: d.ref.h }) }
      else if (d.t === 'v') { d.ref.x = tron(d.ref.x); d.ref.y = tron(d.ref.y) }
      else if (d.t === 's') { for (let i = 0; i < d.ref.pts.length; i++) d.ref.pts[i] = Math.round(d.ref.pts[i] * 10) / 10 }
    }
    cv.luu({ khung: kh, vt })
    if (thayDoc) X.luuDoc()
    if (X.veLop) X.veLop()
    await xepTheoViTri(coKhung ? null : dsO)
    X.day(truoc, chup())
  }
  X.luuMover = luuMover
  X.dungMover = dungMover
  async function tha(e) {
    if (!keo) return
    const k0 = keo; keo = null
    bang.classList.remove('keo'); el('mq').hidden = true; el('gong').innerHTML = ''
    X.elK.forEach((x) => x.classList.remove('vao'))
    for (const e2 of X.elO.values()) e2.classList.remove('nang')
    if (k0.loai === 'nen') return
    if (k0.loai === 'mq') { if (!k0.dich && !k0.shift) X.boChon(); return }
    if (!k0.dich) {                                                         // chi bam, khong keo
      if (k0.loai === 'dichChuyen' && !k0.shift && X.sel.size > 1 && X.sel.has(k0.keyGoc)) X.chon([k0.keyGoc])
      return
    }
    if (k0.loai === 'dichChuyen') { await luuMover(k0.movers, k0.truoc); return }
    if (k0.loai === 'co') {
      const g = k0.k; g.x = tron(g.x); g.y = tron(g.y); g.w = tron(g.w); g.h = tron(g.h)
      cv.luu({ khung: [{ id: g.id, x: g.x, y: g.y, w: g.w, h: g.h }] })
      await xepTheoViTri(null)                                              // khung doi co co the om them tam, hoac bo lai tam
      X.day(k0.truoc, chup())
      return
    }
    if (k0.loai === 'covat') {
      const v = k0.v; v.w = tron(v.w); v.h = tron(v.h)
      if (X.datV) X.datV(v, true)
      X.luuDoc(); X.day(k0.truoc, chup())
    }
  }
  bang.addEventListener('pointerup', tha); bang.addEventListener('pointercancel', tha)

  bang.addEventListener('dblclick', (e) => {
    if (e.target.closest('input, [contenteditable]')) return
    const o = e.target.closest('.o'), tai = e.target.closest('.tai'), v = e.target.closest('.v')
    if (o) { if (!e.target.closest('.rakeo')) cv.mo(o.dataset.khoa) }
    else if (tai && !e.target.closest('input')) cv.moThuMuc(tai.parentElement.dataset.k)
    else if (v) { const vv = X.mV.get(v.dataset.id); if (vv && X.suaVat) X.suaVat(vv) }
    else if (!e.target.closest('.khung') && X.taoGhiTai) X.taoGhiTai(toaBang(e))
  })
  // keo RA app khac: nut o goc tam, hoac giu Alt roi keo ca tam
  bang.addEventListener('dragstart', (e) => {
    e.preventDefault()
    const o = e.target.closest ? e.target.closest('.o') : null
    if (!o) return
    const mot = 'o:' + o.dataset.khoa
    const keys = X.sel.has(mot) ? [...X.sel].filter((k) => k[0] === 'o').map((k) => k.slice(2)) : [o.dataset.khoa]
    const co = keys.filter((k) => !k.startsWith('dai:'))
    if (!co.length) { hienBao(T('cv.daiKhongKeo')); return }
    cv.keoRa(co)
  })

  // ---------- goc nhin ----------
  function phong(k, cx, cy) { const s2 = Math.min(3, Math.max(.05, V.s * k)); V.x = cx - (cx - V.x) * (s2 / V.s); V.y = cy - (cy - V.y) * (s2 / V.s); V.s = s2; datNhin() }
  X.phong = phong
  /* 12/10 bai thu dung do duoc: mot nac lan chuot (deltaY = 120) phong 0,87 -> 2,90 = 3,3 lan, vi cong thuc exp(-deltaY * 0,01) chi hop
     voi ban di chuot (chum hai ngon gui nhieu su kien delta nho). Chuot co nac (delta tu 50 tro len, hoac tinh theo dong): moi nac 15%. */
  bang.addEventListener('wheel', (e) => {
    if (e.target.closest && e.target.closest('[contenteditable]') && !e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      const d = e.deltaY, nac = e.deltaMode === 1 || Math.abs(d) >= 50
      phong(nac ? (d < 0 ? 1.15 : 1 / 1.15) : Math.exp(-d * .01), e.clientX, e.clientY)
    } else { V.x -= e.deltaX; V.y -= e.deltaY; datNhin() }
  }, { passive: false })
  /** Dua mot hinh chu nhat (toa do bang) vao giua man hinh, vua khit (toi da maxS). */
  function chieuVao(r, maxS) {
    const leX = 40, tren = 70, duoi = 84
    V.s = Math.min(maxS, Math.max(.05, Math.min((innerWidth - leX * 2) / Math.max(1, r.w), (innerHeight - tren - duoi) / Math.max(1, r.h))))
    V.x = (innerWidth - r.w * V.s) / 2 - r.x * V.s; V.y = tren + (innerHeight - tren - duoi - r.h * V.s) / 2 - r.y * V.s
    datNhin()
  }
  X.chieuVao = chieuVao
  function vua() {
    const tat = [{ x: 40, y: 60, w: 900, h: 180 }, ...X.khung.map((k) => ({ x: k.x, y: k.y - 36, w: k.w, h: k.h + 36 })), ...X.mucs, ...X.vat]
    chieuVao(hopTong(tat), 1.25)
  }
  X.vua = vua
  X.vuaChon = () => {
    const rs = [...X.sel].map(rectOf).filter(Boolean)
    if (rs.length) chieuVao(hopTong(rs), 1.6)
  }
  /** Nhay toi mot vat, chon no (dung cho Moi nhat va Tim). */
  X.nhayToi = (key) => {
    const r = rectOf(key); if (!r) return
    X.chon([key])
    V.s = Math.min(1.2, Math.max(V.s, .45))
    V.x = innerWidth / 2 - (r.x + r.w / 2) * V.s; V.y = innerHeight / 2 - (r.y + r.h / 2) * V.s
    datNhin()
    const e = elOf(key); if (e) { e.classList.remove('nhay'); void e.offsetWidth; e.classList.add('nhay') }
  }
  el('to').addEventListener('click', () => phong(1.25, innerWidth / 2, innerHeight / 2))
  el('nho').addEventListener('click', () => phong(.8, innerWidth / 2, innerHeight / 2))
  el('vua').addEventListener('click', vua)
  el('moTM').addEventListener('click', () => cv.moThuMuc(null))
  el('chup').addEventListener('click', () => cv.chup())
  el('moiNhat').addEventListener('click', () => {
    if (!X.mucs.length) return
    let t = X.mucs[0]; for (const m of X.mucs) if (m.mtime > t.mtime) t = m
    X.nhayToi('o:' + t.khoa)
  })
  async function taoKhungMoi() {
    if (X.dangCho) return
    X.dangCho = true
    try {
      const r = await cv.taoKhung(Math.round((innerWidth / 2 - V.x) / V.s - 320), Math.round((innerHeight / 2 - V.y) / V.s - 200))
      if (r && r.kq && !r.kq.ok) hienBao(chuLoi(r.kq.loi))
      nhanKetQua(r)
      const e = r && r.kq && r.kq.ok ? X.elK.get(r.kq.id) : null
      if (e) { const i = e.querySelector('input'); i.focus(); i.select() }
    } finally { X.dangCho = false }
  }
  el('them').addEventListener('click', taoKhungMoi)

  // ---------- xoa ----------
  /** Xoa khung can bam HAI lan (lan dau chi doi chu nut va nhac). Chi xoa duoc khi thu muc chi con ban noi cua anh goc. */
  async function xoaKhung(id) {
    if (daiKhungHoi !== id) { daiKhungHoi = id; clearTimeout(henMo); henMo = setTimeout(() => { daiKhungHoi = null; if (X.capNhatNgu) X.capNhatNgu() }, 3500); hienBao(T('cv.c.xoaKhungHoi')); if (X.capNhatNgu) X.capNhatNgu(); return }
    daiKhungHoi = null
    X.dangCho = true
    try {
      const truoc = chup()
      const r = await cv.xoaKhung(id)
      if (r && r.kq && !r.kq.ok) hienBao(r.kq.loi === 'chi-trong-thu-muc' ? T('cv.xoaKhungKhong', { n: r.kq.giu || 0 }) : chuLoi(r.kq.loi))
      nhanKetQua(r)
      if (r && r.kq && r.kq.ok) { X.sel.delete('f:' + id); capNhatChon(); X.day(truoc, chup()) }
    } finally { X.dangCho = false }
  }
  X.xoaKhung = xoaKhung
  X.dangHoiXoaKhung = (id) => daiKhungHoi === id
  /** Xoa phan dang chon: vat / net / mui ten bi xoa that; tam anh chi bi BO KHOI KHUNG (file khong dong toi). */
  async function xoaChon() {
    if (X.dangCho || !X.sel.size) return
    const truoc = chup(), xong = []
    let khoaSot = false, anhRoi = false
    const ra = []
    for (const k of [...X.sel]) {
      if (khoaCua(k)) { khoaSot = true; continue }
      const t = k[0], id = k.slice(2)
      if (t === 'v') { X.vat = X.vat.filter((v) => v.id !== id); xong.push(k) }
      else if (t === 's') { X.net = X.net.filter((n) => n.id !== id); xong.push(k) }
      else if (t === 'c') { X.noi = X.noi.filter((n) => n.id !== id); xong.push(k) }
      else if (t === 'o') { const m = X.mO.get(id); if (m && m.khung && !m.chiTrongKhung) ra.push({ khoa: id, khung: null }); else anhRoi = true }
      else if (t === 'f') { await xoaKhung(id); return }
    }
    if (xong.length) {
      const sv = new Set(xong.filter((k) => k[0] === 'v').map((k) => k.slice(2)))
      X.noi = X.noi.filter((n) => ![n.a, n.b].some((d) => d.k && d.k[0] === 'v' && sv.has(d.k.slice(2))))
      for (const k of xong) { delete X.z[k]; delete X.khoaMap[k]; X.sel.delete(k) }
      X.luuDoc()
      if (X.veVat) X.veVat()
      capNhatChon()
    }
    if (ra.length) {
      X.dangCho = true
      try { nhanKetQua(await cv.xep(ra)) } finally { X.dangCho = false }
    }
    if (khoaSot) hienBao(T('cv.dangKhoa')); else if (anhRoi && !xong.length && !ra.length) hienBao(T('cv.anhKhongXoa'))
    X.day(truoc, chup())
  }
  X.xoaChon = xoaChon

  // ---------- phim ----------
  addEventListener('keydown', async (e) => {
    const go = dangGo()
    if (X.xemDangMo && X.xemDangMo()) {                                      // dang xem nhanh
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); X.xemTiep(e.key === 'ArrowRight' ? 1 : -1); return }
      if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); X.dongXem(); return }
    }
    if (e.key === 'Escape') {
      if (go) { document.activeElement.blur(); if (X.chotSua) X.chotSua(); return }
      if (X.dongTim && X.dongTim()) return
      if (keo) return
      if (X.tool !== 'chon') X.doiCongCu('chon'); else X.boChon()
      return
    }
    if (go) return
    const mod = e.metaKey || e.ctrlKey
    // Space khi dang chon tam anh / video = XEM NHANH (nhu Quick Look cua Finder); khong chon tam nao thi Space van la giu de keo bang
    if (e.key === ' ' && !mod && X.xemNhanh && [...X.sel].some((k) => k[0] === 'o')) { e.preventDefault(); if (!e.repeat) X.xemNhanh(); return }
    if (e.key === ' ' && !mod) { if (!X.space) { X.space = true; bang.classList.add('tay') } e.preventDefault(); return }
    if (mod) {
      const k = e.key.toLowerCase()
      if (k === 'z') { e.preventDefault(); if (e.shiftKey) X.lamLai(); else X.hoanTac(); return }
      if (k === 'y') { e.preventDefault(); X.lamLai(); return }
      if (k === 'a') { e.preventDefault(); X.chon([...X.mucs.map((m) => 'o:' + m.khoa), ...X.vat.map((v) => 'v:' + v.id), ...X.net.map((n) => 's:' + n.id), ...X.noi.map((n) => 'c:' + n.id)]); return }
      if (k === 'c') { e.preventDefault(); if (X.chepChon) X.chepChon(); return }
      if (k === 'v') { e.preventDefault(); if (X.danVao) X.danVao(); return }
      if (k === 'd') { e.preventDefault(); if (X.nhanDoiChon) X.nhanDoiChon(); return }
      if (k === 'l') { e.preventDefault(); if (X.khoaChon) X.khoaChon(); return }
      if (k === 'f') { e.preventDefault(); if (X.moTim) X.moTim(); return }
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); xoaChon(); return }
    if (e.shiftKey && e.code === 'Digit1') { e.preventDefault(); vua(); return }
    if (e.shiftKey && e.code === 'Digit2') { e.preventDefault(); X.vuaChon(); return }
    if (e.key === '+' || e.key === '=') { phong(1.25, innerWidth / 2, innerHeight / 2); return }
    if (e.key === '-' || e.key === '_') { phong(.8, innerWidth / 2, innerHeight / 2); return }
    if (e.key === '[') { if (X.doiLop) X.doiLop(-1); return }
    if (e.key === ']') { if (X.doiLop) X.doiLop(1); return }
    if (e.key.startsWith('Arrow') && X.sel.size) {
      e.preventDefault()
      const b = e.shiftKey ? 10 : 1, dx = e.key === 'ArrowLeft' ? -b : e.key === 'ArrowRight' ? b : 0, dy = e.key === 'ArrowUp' ? -b : e.key === 'ArrowDown' ? b : 0
      if (X.nudge) X.nudge(dx, dy)
      return
    }
    const T2 = { v: 'chon', h: 'tay', n: 'ghi', t: 'chu', r: 'vuong', o: 'tron', d: 'thoi', a: 'noi', p: 'but', l: 'daquang', k: 'link' }
    const t = T2[e.key.toLowerCase()]
    if (t && !e.altKey) { X.doiCongCu(t); return }
    if (e.key.toLowerCase() === 'f' && !e.altKey) taoKhungMoi()
  })
  addEventListener('keyup', (e) => { if (e.key === ' ') { X.space = false; bang.classList.remove('tay') } })
  addEventListener('blur', () => { X.space = false; bang.classList.remove('tay') })

  // ---------- nap ----------
  addEventListener('focus', () => lamMoi())                 // quay lai cua so: thu muc co the da doi trong Finder
  cv.onLamMoi(() => setTimeout(lamMoi, 200))                 // vua chup xong mot tam
  window.__cv = { V, vua, trangThai: () => ({ khung: X.khung, mucs: X.mucs, vat: X.vat, noi: X.noi, net: X.net, sel: [...X.sel] }), X }  // cho bai do
  datNhin()
  X.doiCongCu('chon')
  /* Nap lan dau SAU khi moi script (canvas-vat.js, canvas-tien.js) da chay: du lieu tu main co the ve truoc khi hai file do kip nap,
     luc do ghi chu / mui ten khong duoc ve (do 12/10: mo lai app thay 0 vat tren man trong khi trang thai co 12). */
  const napLanDau = () => cv.nap().then((r) => {
    if (!r || !r.tt) return
    X.khung = r.tt.khung; X.mucs = r.tt.muc; X.vat = r.tt.vat || []; vua()   // dat goc nhin TRUOC khi ve de luot chia bai bay dung cho
    nhanKetQua(r)
    vua()
  })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', napLanDau); else napLanDau()
})()
