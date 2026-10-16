'use strict'
/* CANVAS (12/10) — TIEN ICH quanh bang: thanh ngu canh tren phan dang chon (mau, can hang, xep gon, lop, khoa, nhan doi, xoa, xuat),
   clipboard (chep / dan / nhan doi), tha file + anh tu ngoai vao, tim + loc, ban do nho, xuat khung ra PNG / PDF.
   Dung chung window.CVX voi canvas.js va canvas-vat.js. */
;(() => {
  const X = window.CVX
  if (!X) return
  const { cv, T, el, bang, esc } = X
  const V = X.V
  const IC = (d) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'
  const P = {
    canTrai: 'M4 4v16M8 7h12M8 13h8', canGiua: 'M12 4v16M6 7h12M8 13h8', canPhai: 'M20 4v16M4 7h12M8 13h8',
    canTren: 'M4 4h16M7 8v12M13 8v8', canNgang: 'M4 12h16M7 6v12M13 8v8', canDuoi: 'M4 20h16M7 4v12M13 8v8',
    chiaNgang: 'M4 4v16M20 4v16M9 8h6v8H9z', chiaDoc: 'M4 4h16M4 20h16M8 9h8v6H8z', xepGon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    len: 'M9 9h11v11H9zM4 15V4h11', xuong: 'M4 4h11v11H4zM9 9h11v11H9z', khoa: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3', mo: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 7-2.6',
    nhan: 'M8 8h11v11H8zM5 16V5h11', xoa: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13', boKhung: 'M4 5h16v14H4zM9 12h8M13 8l4 4-4 4',
    moLink: 'M9 15 15 9M10 6h-1a4 4 0 0 0 0 8h1M14 18h1a4 4 0 0 0 0-8h-1', thuMuc: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    vuong: 'M5 6h14v12H5z', tron: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', thoi: 'M12 3l9 9-9 9-9-9z',
  }
  const NHAN = { canTrai: 'cv.c.canTrai', canGiua: 'cv.c.canGiua', canPhai: 'cv.c.canPhai', canTren: 'cv.c.canTren', canNgang: 'cv.c.canNgang', canDuoi: 'cv.c.canDuoi',
    chiaNgang: 'cv.c.chiaNgang', chiaDoc: 'cv.c.chiaDoc', xepGon: 'cv.c.xepGon', len: 'cv.c.len', xuong: 'cv.c.xuong', nhan: 'cv.c.nhan', xoa: 'cv.c.xoa', boKhung: 'cv.c.boKhung',
    moLink: 'cv.c.moLink', thuMuc: 'cv.moThuMuc', vuong: 'cv.t.vuong', tron: 'cv.t.tron', thoi: 'cv.t.thoi' }

  // ---------- thanh cong cu ben trai + tieu de + tim ----------
  document.querySelectorAll('[data-cc]').forEach((b) => {
    const t = T('cv.t.' + b.dataset.cc); b.title = t; b.setAttribute('aria-label', t)
    b.addEventListener('click', () => X.doiCongCu(b.dataset.cc))
  })
  for (const [id, k] of [['moiNhat', 'cv.moiNhatTip'], ['timNut', 'cv.tim']]) { const b = el(id); if (b) { b.title = T(k); b.setAttribute('aria-label', T(k)) } }
  el('chuMoiNhat').textContent = T('cv.moiNhat')

  // ---------- chon: mot so ham dung chung ----------
  const dsChon = () => [...X.sel]
  const duocDoi = (k) => !X.khoaCua(k)
  /** Cac muc tren bang co the can hang / xep: tam anh, vat, net (khong khoa). */
  function mucDoi() {
    return dsChon().filter((k) => 'ovs'.includes(k[0]) && duocDoi(k) && X.rectOf(k)).map((k) => ({ k, r: Object.assign({}, X.rectOf(k)) }))
  }
  /** Ap vi tri moi (top-left) cho cac muc roi luu + xep khung + lich su. */
  async function apViTri(map, doiKhung) {
    const truoc = X.chup()
    const vt = {}, dsO = [], kh = []
    let thayDoc = false
    for (const [k, p] of map) {
      const t = k[0], id = k.slice(2)
      if (t === 'o') { const m = X.mO.get(id); if (!m) continue; m.x = Math.round(p.x); m.y = Math.round(p.y); const e = X.elO.get(id); if (e) X.datO(m, e); vt[id] = { x: m.x, y: m.y }; dsO.push(m) }
      else if (t === 'v') { const v = X.mV.get(id); if (!v) continue; v.x = Math.round(p.x); v.y = Math.round(p.y); X.datV(v); thayDoc = true }
      else if (t === 's') {
        const n = X.mS.get(id), r = X.rectOf(k); if (!n || !r) continue
        const dx = p.x - r.x, dy = p.y - r.y
        for (let i = 0; i < n.pts.length; i += 2) { n.pts[i] = Math.round((n.pts[i] + dx) * 10) / 10; n.pts[i + 1] = Math.round((n.pts[i + 1] + dy) * 10) / 10 }
        thayDoc = true
      }
    }
    if (doiKhung) for (const g of doiKhung) { const f = X.mK.get(g.id); if (f) { Object.assign(f, g); kh.push({ id: f.id, x: f.x, y: f.y, w: f.w, h: f.h }) } }
    cv.luu({ vt, khung: kh })
    if (thayDoc) X.luuDoc()
    for (const g of kh) { const e = X.elK.get(g.id); if (e) { e.style.width = g.w + 'px'; e.style.height = g.h + 'px' } }
    X.veLop()
    await X.xepTheoViTri(dsO)
    X.day(truoc, X.chup())
  }
  function can(kieu) {
    const ds = mucDoi(); if (ds.length < 2) return
    const x0 = Math.min(...ds.map((a) => a.r.x)), x1 = Math.max(...ds.map((a) => a.r.x + a.r.w)), y0 = Math.min(...ds.map((a) => a.r.y)), y1 = Math.max(...ds.map((a) => a.r.y + a.r.h))
    const map = new Map()
    for (const a of ds) {
      const p = { x: a.r.x, y: a.r.y }
      if (kieu === 'canTrai') p.x = x0
      else if (kieu === 'canPhai') p.x = x1 - a.r.w
      else if (kieu === 'canGiua') p.x = (x0 + x1) / 2 - a.r.w / 2
      else if (kieu === 'canTren') p.y = y0
      else if (kieu === 'canDuoi') p.y = y1 - a.r.h
      else if (kieu === 'canNgang') p.y = (y0 + y1) / 2 - a.r.h / 2
      map.set(a.k, p)
    }
    apViTri(map)
  }
  function chia(ngang) {
    const ds = mucDoi(); if (ds.length < 3) return
    const t = ngang ? 'x' : 'y', c = ngang ? 'w' : 'h'
    ds.sort((a, b) => a.r[t] - b.r[t])
    const dau = ds[0].r[t], cuoi = Math.max(...ds.map((a) => a.r[t] + a.r[c]))
    const tong = ds.reduce((s, a) => s + a.r[c], 0), kc = (cuoi - dau - tong) / (ds.length - 1)
    let cur = dau
    const map = new Map()
    for (const a of ds) { map.set(a.k, ngang ? { x: cur, y: a.r.y } : { x: a.r.x, y: cur }); cur += a.r[c] + kc }
    apViTri(map)
  }
  /** Xep gon thanh luoi: dang chon 1 khung -> xep cac tam + vat TRONG khung, khung no ra neu can; con lai -> luoi tai goc trai-tren cua phan chon. */
  function xepGon() {
    const kd = X.chonLaDon()
    let ds, ox, oy, khung = null
    if (kd && kd[0] === 'f') {
      khung = X.mK.get(kd.slice(2)); if (!khung || X.khoaCua(kd)) return
      ds = []
      for (const m of X.mucs) if (X.tamTrong(m, khung) && duocDoi('o:' + m.khoa)) ds.push({ k: 'o:' + m.khoa, r: Object.assign({}, m), t: m.mtime })
      for (const v of X.vat) if (X.tamTrong(v, khung) && duocDoi('v:' + v.id)) ds.push({ k: 'v:' + v.id, r: Object.assign({}, v), t: v.tao || 0 })
      ox = khung.x + 26; oy = khung.y + 26
    } else {
      ds = mucDoi().filter((a) => a.k[0] !== 's')
      for (const a of ds) a.t = a.k[0] === 'o' ? (X.mO.get(a.k.slice(2)).mtime) : (X.mV.get(a.k.slice(2)).tao || 0)
      if (!ds.length) return
      ox = Math.min(...ds.map((a) => a.r.x)); oy = Math.min(...ds.map((a) => a.r.y))
    }
    if (ds.length < (khung ? 1 : 2)) return
    ds.sort((a, b) => a.t - b.t || (a.k < b.k ? -1 : 1))
    const cw = Math.max(...ds.map((a) => a.r.w)) + 22, ch = Math.max(...ds.map((a) => a.r.h)) + 22
    const cot = Math.max(1, khung ? Math.floor((khung.w - 52 + 22) / cw) : Math.round(Math.sqrt(ds.length)))
    const map = new Map()
    ds.forEach((a, i) => { map.set(a.k, { x: ox + (i % cot) * cw + (cw - 22 - a.r.w) / 2, y: oy + Math.floor(i / cot) * ch + (ch - 22 - a.r.h) / 2 }) })
    const hang = Math.ceil(ds.length / cot)
    apViTri(map, khung ? [{ id: khung.id, x: khung.x, y: khung.y, w: Math.max(khung.w, cot * cw - 22 + 52), h: Math.max(khung.h, hang * ch - 22 + 52) }] : null)
  }
  X.nudge = async (dx, dy) => {
    const movers = X.dungMover(dsChon()); if (!movers.length) return
    const truoc = X.chup()
    for (const d of movers) {
      if (d.t === 'o') { d.ref.x += dx; d.ref.y += dy; const e = X.elO.get(d.ref.khoa); if (e) X.datO(d.ref, e) }
      else if (d.t === 'v') { d.ref.x += dx; d.ref.y += dy; X.datV(d.ref) }
      else if (d.t === 'f') { d.ref.x += dx; d.ref.y += dy; const e = X.elK.get(d.ref.id); if (e) { e.style.left = d.ref.x + 'px'; e.style.top = d.ref.y + 'px' } }
      else if (d.t === 's') { for (let i = 0; i < d.ref.pts.length; i += 2) { d.ref.pts[i] += dx; d.ref.pts[i + 1] += dy } }
      else if (d.t === 'c') { if (!d.ref.a.k) { d.ref.a.x += dx; d.ref.a.y += dy } if (!d.ref.b.k) { d.ref.b.x += dx; d.ref.b.y += dy } }
    }
    await X.luuMover(movers, truoc, true)
  }
  X.doiLop = (huong) => {
    const ks = dsChon().filter((k) => 'ov'.includes(k[0]) && duocDoi(k)); if (!ks.length) return
    const truoc = X.chup()
    const tat = [...X.mucs.map((m) => 'o:' + m.khoa), ...X.vat.map((v) => 'v:' + v.id)]
    const z = (k) => X.z[k] || 0
    let top = Math.max(0, ...tat.map(z)), bot = Math.min(0, ...tat.map(z))
    for (const k of ks) X.z[k] = huong > 0 ? ++top : --bot
    X.datLop(); X.luuDoc(); X.day(truoc, X.chup())
  }
  X.khoaChon = () => {
    const ks = dsChon().filter((k) => 'ovsf'.includes(k[0])); if (!ks.length) return
    const truoc = X.chup(), moKhoa = ks.every((k) => X.khoaCua(k))
    for (const k of ks) { if (moKhoa) delete X.khoaMap[k]; else X.khoaMap[k] = true }
    X.luuDoc()
    X.nhanKetQua({ tt: { khung: X.khung, muc: X.mucs, vat: X.vat, noi: X.noi, net: X.net, z: X.z, khoa: X.khoaMap } })
    X.day(truoc, X.chup())
  }
  function datMau(mau) {
    const truoc = X.chup(), kh = []
    for (const k of dsChon()) {
      const t = k[0], id = k.slice(2)
      if (t === 'v') { const v = X.mV.get(id); if (v && duocDoi(k)) { v.mau = mau; X.datMauMacDinh(v.loai, mau) } }
      else if (t === 'c') { const n = X.mN.get(id); if (n) { n.mau = mau; X.datMauMacDinh('noi', mau) } }
      else if (t === 's') { const n = X.mS.get(id); if (n && duocDoi(k)) { n.mau = mau; X.datMauMacDinh('but', mau) } }
      else if (t === 'f') { const f = X.mK.get(id); if (f && duocDoi(k)) { f.mau = mau; kh.push({ id, x: f.x, y: f.y, w: f.w, h: f.h, mau }) } }
    }
    if (kh.length) { cv.luu({ khung: kh }); for (const g of kh) { const e = X.elK.get(g.id); if (e) e.style.setProperty('--m', g.mau) } }
    X.luuDoc(); X.veVat(); X.day(truoc, X.chup()); capNhatNgu(true)
  }
  function doiHinh(h) {
    const truoc = X.chup()
    for (const k of dsChon()) { const v = k[0] === 'v' ? X.mV.get(k.slice(2)) : null; if (v && v.loai === 'hinh' && duocDoi(k)) v.hinh = h }
    X.luuDoc(); X.veVat(); X.day(truoc, X.chup()); capNhatNgu(true)
  }
  async function boKhoiKhung() {
    const ra = dsChon().filter((k) => k[0] === 'o').map((k) => X.mO.get(k.slice(2))).filter((m) => m && m.khung && !m.chiTrongKhung && duocDoi('o:' + m.khoa))
    if (!ra.length) return
    const truoc = X.chup()
    X.dangCho = true
    try { X.nhanKetQua(await cv.xep(ra.map((m) => ({ khoa: m.khoa, khung: null })))) } finally { X.dangCho = false }
    X.day(truoc, X.chup())
  }

  // ---------- thanh ngu canh ----------
  const ngu = el('ngu')
  let chuKyNgu = ''
  function bbox(keys) {
    const rs = []
    for (const k of keys) {
      const r = X.rectOf(k)
      if (r) rs.push(r)
      else if (k[0] === 'c') { const n = X.mN.get(k.slice(2)); const h = n && X.hinhNoi(n.a, n.b); if (h) rs.push({ x: Math.min(h.p.x, h.q.x), y: Math.min(h.p.y, h.q.y), w: Math.abs(h.q.x - h.p.x), h: Math.abs(h.q.y - h.p.y) }) }
    }
    return rs.length ? X.hopTong(rs) : null
  }
  const matCua = (k) => { const x = k[0] === 'v' ? X.mV.get(k.slice(2)) : k[0] === 'f' ? X.mK.get(k.slice(2)) : k[0] === 'c' ? X.mN.get(k.slice(2)) : k[0] === 's' ? X.mS.get(k.slice(2)) : null; return x ? x.mau : '' }
  function dungNgu(keys) {
    const loai = (t) => keys.filter((k) => k[0] === t)
    const o = loai('o'), v = loai('v'), c = loai('c'), s = loai('s'), f = loai('f')
    const hinh = v.filter((k) => (X.mV.get(k.slice(2)) || {}).loai === 'hinh')
    const lienKet = v.length === 1 && o.length + c.length + s.length + f.length === 0 && (X.mV.get(v[0].slice(2)) || {}).loai === 'link'
    const doiDuoc = keys.filter((k) => 'ovs'.includes(k[0]) && duocDoi(k))
    const khoaHet = keys.every((k) => X.khoaCua(k))
    let h = ''
    const nut = (a, ten, noiDung, them) => '<button class="ni' + (them || '') + '" data-a="' + a + '" title="' + esc(T(NHAN[ten] || ten)) + '" aria-label="' + esc(T(NHAN[ten] || ten)) + '">' + noiDung + '</button>'
    const mau = (palette, cur) => '<span class="mau">' + palette.map((m) => '<i class="sw' + (cur === m ? ' dang' : '') + '" data-mau="' + m + '" style="--c:' + m + '" title="' + esc(T('cv.c.mau')) + '"></i>').join('') + '</span>'
    if (v.length + c.length + s.length + f.length > 0) {
      const chiGhi = v.length > 0 && v.every((k) => (X.mV.get(k.slice(2)) || {}).loai === 'ghi') && c.length + s.length + f.length === 0
      h += mau(chiGhi ? X.MAU_GHI : X.MAU_NET, keys.length === 1 ? matCua(keys[0]) : '')
    }
    if (hinh.length) h += '<span class="vach"></span>' + ['vuong', 'tron', 'thoi'].map((x) => nut('hinh:' + x, x, IC('<path d="' + P[x] + '"/>'))).join('')
    if (doiDuoc.length >= 2) {
      h += '<span class="vach"></span>' + ['canTrai', 'canGiua', 'canPhai', 'canTren', 'canNgang', 'canDuoi'].map((x) => nut(x, x, IC('<path d="' + P[x] + '"/>'))).join('')
      if (doiDuoc.length >= 3) h += nut('chiaNgang', 'chiaNgang', IC('<path d="' + P.chiaNgang + '"/>')) + nut('chiaDoc', 'chiaDoc', IC('<path d="' + P.chiaDoc + '"/>'))
    }
    if ((doiDuoc.length >= 2 && doiDuoc.some((k) => k[0] !== 's')) || (f.length === 1 && keys.length === 1)) h += nut('xepGon', 'xepGon', IC('<path d="' + P.xepGon + '"/>'))
    if (o.length + v.length > 0) h += '<span class="vach"></span>' + nut('len', 'len', IC('<path d="' + P.len + '"/>')) + nut('xuong', 'xuong', IC('<path d="' + P.xuong + '"/>'))
    h += '<span class="vach"></span>' + nut('khoa', khoaHet ? 'cv.c.mo' : 'cv.c.khoa', IC('<path d="' + (khoaHet ? P.mo : P.khoa) + '"/>'), khoaHet ? ' dang' : '')
    if (o.length + v.length + s.length + c.length > 0) h += nut('nhan', 'nhan', IC('<path d="' + P.nhan + '"/>'))
    if (o.some((k) => { const m = X.mO.get(k.slice(2)); return m && m.khung && !m.chiTrongKhung })) h += nut('boKhung', 'boKhung', IC('<path d="' + P.boKhung + '"/>'))
    if (lienKet) h += nut('moLink', 'moLink', IC('<path d="' + P.moLink + '"/>'))
    const moKhung = f.length === 1 && keys.length === 1
    if (moKhung) {
      h += '<span class="vach"></span>' + nut('thuMuc', 'thuMuc', IC('<path d="' + P.thuMuc + '"/>'))
      h += '<button class="ni chu" data-a="png" title="' + esc(T('cv.c.png')) + '">PNG</button><button class="ni chu" data-a="pdf" title="' + esc(T('cv.c.pdf')) + '">PDF</button>'
    }
    const hoi = moKhung && X.dangHoiXoaKhung(f[0].slice(2))
    h += '<span class="vach"></span>'
    h += moKhung
      ? '<button class="ni' + (hoi ? ' do' : '') + '" data-a="xoa" title="' + esc(T(hoi ? 'cv.c.xoaKhungHoi' : 'cv.c.xoaKhung')) + '">' + IC('<path d="' + P.xoa + '"/>') + (hoi ? '<span class="chu2">' + esc(T('cv.c.xoaKhungHoi')) + '</span>' : '') + '</button>'
      : nut('xoa', 'xoa', IC('<path d="' + P.xoa + '"/>'))
    return h
  }
  function capNhatNgu(ep) {
    if (!ngu) return
    const keys = dsChon()
    const bb = keys.length && !X.dangSuaVat() ? bbox(keys) : null
    if (!bb) { ngu.hidden = true; chuKyNgu = ''; return }
    const ky = keys.slice().sort().join('|') + '#' + keys.map((k) => (X.khoaCua(k) ? 1 : 0) + ((X.mV.get(k.slice(2)) || {}).hinh || '') + matCua(k) + (X.mO.has(k.slice(2)) && X.mO.get(k.slice(2)).khung ? 'k' : '')).join('') +
      (keys.length === 1 && keys[0][0] === 'f' && X.dangHoiXoaKhung(keys[0].slice(2)) ? 'H' : '')
    if (ep || ky !== chuKyNgu) { ngu.innerHTML = dungNgu(keys); chuKyNgu = ky }
    ngu.hidden = false
    const sx = V.x + bb.x * V.s, sy = V.y + bb.y * V.s, sw = bb.w * V.s, sh = bb.h * V.s
    const w = ngu.offsetWidth, h = ngu.offsetHeight
    /* Chon vi tri khong cham cac lop noi khac (thanh cong cu trai, tieu de, thanh nut giua, ban do nho, nut tron, o tim + chip loc).
       Thu lan luot: tren, duoi, ben phai, ben trai cua phan chon, roi tam man hinh; vi tri nao khong cham gi thi lay. */
    const vat = []
    for (const sel of ['.cong', '.ten', '.thanh', '#banDoHop', '.ntr', '#tim', '#timChip']) {
      const e = document.querySelector(sel); if (!e || e.hidden) continue
      const cs = getComputedStyle(e); if (cs.display === 'none') continue
      const r = e.getBoundingClientRect(); if (r.width && r.height) vat.push({ l: r.left - 6, t: r.top - 6, r: r.right + 6, b: r.bottom + 6 })
    }
    const kep = (l, t) => [Math.max(8, Math.min(innerWidth - w - 8, l)), Math.max(60, Math.min(innerHeight - h - 8, t))]
    const cham = (l, t) => vat.filter((o) => l < o.r && l + w > o.l && t < o.b && t + h > o.t).length
    const tren = keys.length === 1 && keys[0][0] === 'f' ? sy - h - 44 : sy - h - 16
    const ungVien = [[sx + sw / 2 - w / 2, tren], [sx + sw / 2 - w / 2, sy + sh + 16], [sx + sw + 16, sy], [sx - w - 16, sy],
      [sx + sw / 2 - w / 2, sy + 16], [(innerWidth - w) / 2, 70], [(innerWidth - w) / 2, innerHeight - h - 100]]
    let kq = null, it = 1e9
    for (const [l0, t0] of ungVien) { const [l, t] = kep(l0, t0); const n = cham(l, t); if (n < it) { it = n; kq = [l, t] } if (n === 0) break }
    ngu.style.left = Math.round(kq[0]) + 'px'; ngu.style.top = Math.round(kq[1]) + 'px'
  }
  X.capNhatNgu = capNhatNgu
  ngu.addEventListener('pointerdown', (e) => e.stopPropagation())
  ngu.addEventListener('click', (e) => {
    const sw = e.target.closest('.sw'); if (sw) { datMau(sw.dataset.mau); return }
    const b = e.target.closest('[data-a]'); if (!b) return
    const a = b.dataset.a
    if (a.startsWith('hinh:')) doiHinh(a.slice(5))
    else if (a === 'xoa') X.xoaChon()
    else if (['canTrai', 'canGiua', 'canPhai', 'canTren', 'canNgang', 'canDuoi'].includes(a)) can(a)
    else if (a === 'chiaNgang') chia(true)
    else if (a === 'chiaDoc') chia(false)
    else if (a === 'xepGon') xepGon()
    else if (a === 'len') X.doiLop(1)
    else if (a === 'xuong') X.doiLop(-1)
    else if (a === 'khoa') X.khoaChon()
    else if (a === 'nhan') X.nhanDoiChon()
    else if (a === 'boKhung') boKhoiKhung()
    else if (a === 'moLink') { const v = X.mV.get(X.chonLaDon().slice(2)); if (v && v.url) cv.moLink(v.url) }
    else if (a === 'thuMuc') cv.moThuMuc(X.chonLaDon().slice(2))
    else if (a === 'png' || a === 'pdf') xuatKhung(X.chonLaDon().slice(2), a)
  })
  addEventListener('resize', () => capNhatNgu())

  // ---------- nhan doi / chep / dan ----------
  let diemTro = null
  bang.addEventListener('pointermove', (e) => { diemTro = X.toaBang(e) })
  const diemDat = () => diemTro || { x: (innerWidth / 2 - V.x) / V.s, y: (innerHeight / 2 - V.y) / V.s }
  /** Sao chep vat / net / mui ten tu mau, id moi, lech (dx, dy). Tra danh sach khoa moi. */
  function nhanBan(mau, dx, dy) {
    const idMoi = new Map(), kq = []
    for (const v of mau.v || []) { const id = X.moiId('v'); idMoi.set('v:' + v.id, 'v:' + id); X.vat.push(Object.assign({}, v, { id, x: Math.round(v.x + dx), y: Math.round(v.y + dy), tao: Date.now() })); kq.push('v:' + id) }
    for (const n of mau.s || []) { const id = X.moiId('s'); idMoi.set('s:' + n.id, 's:' + id); X.net.push(Object.assign({}, n, { id, pts: n.pts.map((p, i) => Math.round((p + (i % 2 ? dy : dx)) * 10) / 10) })); kq.push('s:' + id) }
    for (const n of mau.c || []) {
      const dd = (d) => { if (d.k) return idMoi.has(d.k) ? { k: idMoi.get(d.k) } : (X.rectOf(d.k) ? { k: d.k } : null); return { x: Math.round(d.x + dx), y: Math.round(d.y + dy) } }
      const a = dd(n.a), b = dd(n.b); if (!a || !b) continue
      const id = X.moiId('c'); X.noi.push({ id, a, b, mau: n.mau }); kq.push('c:' + id)
    }
    return kq
  }
  const lay = (k) => (k[0] === 'v' ? X.mV.get(k.slice(2)) : k[0] === 's' ? X.mS.get(k.slice(2)) : k[0] === 'c' ? X.mN.get(k.slice(2)) : null)
  function giuMau(keys) {
    const q = { v: [], s: [], c: [], o: [] }
    for (const k of keys) {
      const t = k[0], x = lay(k)
      if (t === 'o') { const m = X.mO.get(k.slice(2)); if (m) q.o.push(m.khoa) }
      else if (x) q[t].push(JSON.parse(JSON.stringify(x)))
    }
    return q
  }
  /** Nhan doi cac tam anh that (chep file canh ban goc) -> mang khoa moi, giu khung cua ban goc. */
  async function nhanAnh(khoas, dx, dy) {
    if (!khoas.length) return []
    const sinh = []
    X.dangCho = true
    try {
      const tu = new Map(khoas.map((k) => [k, Object.assign({}, X.mO.get(k))]))
      const r = await cv.nhanDoi(khoas)
      if (r && r.kq) {
        X.nhanKetQua(r)
        const vt = {}, xep = []
        for (const q of r.kq) {
          if (!q.ok) continue
          const g = tu.get(q.tu), m = X.mO.get(q.khoa)
          if (!g || !m) continue
          vt[q.khoa] = { x: Math.round(g.x + dx), y: Math.round(g.y + dy) }
          sinh.push(q.khoa)
          if (g.khung && !g.chiTrongKhung) xep.push({ khoa: q.khoa, khung: g.khung })
        }
        if (xep.length) X.nhanKetQua(await cv.xep(xep))
        cv.luu({ vt })
        X.nhanKetQua(await cv.nap())
        if (r.kq.some((q) => !q.ok)) X.hienBao(T('cv.nhanDoiLoi'))
      }
    } finally { X.dangCho = false }
    return sinh
  }
  X.nhanDoiChon = async () => {
    if (X.dangCho) return
    const keys = dsChon(); if (!keys.length) return
    const truoc = X.chup()
    const moi = nhanBan(giuMau(keys.filter((k) => k[0] !== 'o')), 28, 28)
    const daiKeys = keys.filter((k) => k.startsWith('o:dai:'))
    const anh = keys.filter((k) => k[0] === 'o' && !k.startsWith('o:dai:')).map((k) => k.slice(2))
    if (moi.length) { X.luuDoc(); X.veVat() }
    const sinh = anh.length ? await nhanAnh(anh, 28, 28) : []
    if (daiKeys.length) X.hienBao(T('cv.nhanDoiLoi'))
    else if (sinh.length) X.hienBao(T('cv.daNhan', { n: sinh.length }))
    X.chon([...moi, ...sinh.map((k) => 'o:' + k)])
    X.day(truoc, X.chup())
  }
  const TIEN_TO = 'AIOCANVAS1:'
  X.chepChon = () => {
    const keys = dsChon(); if (!keys.length) return
    const q = giuMau(keys)
    if (q.v.length + q.s.length + q.c.length > 0 || q.o.length > 1) cv.chep({ text: TIEN_TO + JSON.stringify(q) })
    else if (q.o.length === 1) cv.chep({ anh: q.o[0] })
  }
  /** Dat cac tam moi (vua nhap tu ngoai) quanh diem p theo luoi nho; vao khung neu p nam trong khung. */
  async function datTaiDiem(khoas, p) {
    if (!khoas.length) return
    const vt = {}
    khoas.forEach((k, i) => { const m = X.mO.get(k); if (!m) return; m.x = Math.round(p.x - m.w / 2 + (i % 4) * (m.w + 20)); m.y = Math.round(p.y - m.h / 2 + Math.floor(i / 4) * (m.h + 20)); vt[k] = { x: m.x, y: m.y }; const e = X.elO.get(k); if (e) X.datO(m, e) })
    cv.luu({ vt })
    X.chon(khoas.map((k) => 'o:' + k))
    await X.xepTheoViTri(khoas.map((k) => X.mO.get(k)).filter(Boolean))
  }
  X.danVao = async () => {
    if (X.dangCho) return
    const truoc = X.chup()
    const r = await cv.dan()
    if (!r) return
    const p = diemDat()
    if (r.kieu === 'anh') {
      X.nhanKetQua(r)
      const moi = (r.kq || []).filter((q) => q.ok && q.ten).map((q) => q.ten)
      if (!moi.length) { X.hienBao(T('cv.nhapLoi', { n: 1 })); return }
      await datTaiDiem(moi, p); X.day(truoc, X.chup())
      return
    }
    const text = r.text || ''
    if (text.startsWith(TIEN_TO)) {
      let q = null
      try { q = JSON.parse(text.slice(TIEN_TO.length)) } catch (e) { q = null }
      if (q && typeof q === 'object') {
        const xs = [], ys = []
        for (const v of q.v || []) { xs.push(v.x); ys.push(v.y) }
        for (const n of q.s || []) for (let i = 0; i + 1 < n.pts.length; i += 2) { xs.push(n.pts[i]); ys.push(n.pts[i + 1]) }
        const dx = xs.length ? p.x - Math.min(...xs) : 28, dy = ys.length ? p.y - Math.min(...ys) : 28
        const moi = nhanBan(q, dx, dy)
        if (moi.length) { X.luuDoc(); X.veVat() }
        const sinh = await nhanAnh((Array.isArray(q.o) ? q.o : []).filter((k) => typeof k === 'string' && X.mO.has(k)), 28, 28)
        X.chon([...moi, ...sinh.map((k) => 'o:' + k)])
        X.day(truoc, X.chup())
        return
      }
    }
    if (text.trim()) { X.taoTuChu(text, p); return }
    X.hienBao(T('cv.danKhong'))
  }

  // ---------- tha file / anh tu ngoai ----------
  const coFile = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')
  addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = coFile(e) || [...(e.dataTransfer.types || [])].includes('text/uri-list') ? 'copy' : 'none' })
  addEventListener('drop', async (e) => {
    e.preventDefault()
    const dt = e.dataTransfer; if (!dt || X.dangCho) return
    const p = X.toaBang(e), truoc = X.chup()
    const files = [...(dt.files || [])]
    if (files.length) {
      const nguon = [], buf = []
      for (const f of files.slice(0, 60)) {
        const d = cv.duongDan(f)
        if (d) nguon.push(d)
        else if (/^image\/(png|jpeg)$/.test(f.type) && f.size < 40 * 1048576) buf.push({ ten: f.name || 'anh', bytes: await f.arrayBuffer() })
      }
      if (!nguon.length && !buf.length) { X.hienBao(T('cv.nhapSai')); return }
      X.dangCho = true
      let r
      try { r = await cv.nhap(nguon, buf); X.nhanKetQua(r) } finally { X.dangCho = false }
      const ok = ((r && r.kq) || []).filter((q) => q.ok && q.ten).map((q) => q.ten)
      const hong = ((r && r.kq) || []).filter((q) => !q.ok)
      if (hong.length) X.hienBao(hong.every((q) => q.loi === 'loai') ? T('cv.nhapSai') : T('cv.nhapLoi', { n: hong.length }))
      await datTaiDiem(ok, p)
      X.day(truoc, X.chup())
      return
    }
    const url = (dt.getData('text/uri-list') || dt.getData('text/plain') || '').split('\n')[0].trim()
    if (/^https?:\/\/\S+$/i.test(url)) X.taoTuChu(url, p)
  })

  // ---------- phim Enter: sua vat dang chon ----------
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || X.dangGo() || e.metaKey || e.ctrlKey) return
    const k = X.chonLaDon(); if (!k || k[0] !== 'v') return
    const v = X.mV.get(k.slice(2)); if (!v) return
    e.preventDefault(); X.suaVat(v, true)
  })

  // ---------- tim + loc ----------
  const tim = { q: '', loai: 'tatca', ngay: 'tatca', mo: false }
  const timHop = el('tim'), timO = el('timO'), timDem = el('timDem'), timChip = el('timChip')
  const DAY = 86400000
  const chuNhan = (s) => String(s || '').normalize('NFC').toLowerCase()
  function khopKhoa(k) {
    const t = k[0], id = k.slice(2)
    const q = chuNhan(tim.q)
    let ten = '', loai = '', ms = 0
    if (t === 'o') {
      const m = X.mO.get(id); if (!m) return false
      loai = m.kieu === 'dai' ? 'dai' : m.kieu === 'video' ? 'video' : 'anh'; ms = m.mtime || 0
      const kh = m.khung ? X.mK.get(m.khung) : null
      ten = (m.ten || m.khoa) + ' ' + (kh ? kh.ten : '') + ' ' + (m.kieu === 'dai' ? 'storyboard' : '')
    } else if (t === 'v') {
      const v = X.mV.get(id); if (!v) return false
      loai = 'ghi'; ms = v.tao || 0; ten = (v.chu || '') + ' ' + (v.url || '')
    } else return true
    if (tim.loai !== 'tatca' && loai !== tim.loai) return false
    if (tim.ngay !== 'tatca') {
      const gioiHan = tim.ngay === 'hom' ? new Date(new Date().toDateString()).getTime() : Date.now() - (tim.ngay === '7' ? 7 : 30) * DAY
      if (ms < gioiHan) return false
    }
    return !q || chuNhan(ten).includes(q)
  }
  const dangLoc = () => !!tim.q || tim.loai !== 'tatca' || tim.ngay !== 'tatca'
  let khopDs = [], viTriKhop = -1
  X.timBieu = () => {
    const loc = dangLoc()
    khopDs = []
    for (const [id, e] of X.elO) { const ok = !loc || khopKhoa('o:' + id); e.classList.toggle('mo', !ok); if (loc && ok) khopDs.push('o:' + id) }
    for (const [id, e] of X.elV) { const ok = !loc || khopKhoa('v:' + id); e.classList.toggle('mo', !ok); if (loc && ok) khopDs.push('v:' + id) }
    const q = chuNhan(tim.q)
    for (const [id, e] of X.elK) { const ok = !q || chuNhan((X.mK.get(id) || {}).ten).includes(q); e.classList.toggle('mo', !ok) }
    timDem.textContent = !loc ? '' : khopDs.length ? T('cv.timKq', { n: khopDs.length }) : T('cv.timKhong')
    timDem.classList.toggle('khong', loc && !khopDs.length)
    if (X.veBanDo) X.veBanDo()
  }
  function dungChip() {
    const nhom = (ten, ds, cur) => '<span class="nhom">' + ds.map(([v, k]) => '<button class="cp' + (cur === v ? ' dang' : '') + '" data-' + ten + '="' + v + '">' + esc(T(k)) + '</button>').join('') + '</span>'
    timChip.innerHTML = nhom('loai', [['tatca', 'cv.loc.tatca'], ['anh', 'cv.loc.anh'], ['video', 'cv.loc.video'], ['dai', 'cv.loc.dai'], ['ghi', 'cv.loc.ghi']], tim.loai) +
      nhom('ngay', [['tatca', 'cv.ngay.tatca'], ['hom', 'cv.ngay.hom'], ['7', 'cv.ngay.7'], ['30', 'cv.ngay.30']], tim.ngay)
  }
  function moTim() { tim.mo = true; timHop.classList.add('mo'); dungChip(); timO.focus(); timO.select() }
  X.moTim = moTim
  X.dongTim = () => {
    if (!tim.mo && !dangLoc()) return false
    tim.mo = false; tim.q = ''; tim.loai = 'tatca'; tim.ngay = 'tatca'; timO.value = ''; timO.blur()
    timHop.classList.remove('mo'); X.timBieu()
    return true
  }
  timO.placeholder = T('cv.timMau')
  el('timNut').addEventListener('click', () => { if (tim.mo) X.dongTim(); else moTim() })
  timO.addEventListener('input', () => { tim.q = timO.value; viTriKhop = -1; X.timBieu() })
  timO.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && khopDs.length) {
      e.preventDefault()
      viTriKhop = (viTriKhop + (e.shiftKey ? -1 : 1) + khopDs.length) % khopDs.length
      X.nhayToi(khopDs[viTriKhop])
    }
  })
  timChip.addEventListener('click', (e) => {
    const b = e.target.closest('.cp'); if (!b) return
    if (b.dataset.loai) tim.loai = b.dataset.loai
    if (b.dataset.ngay) tim.ngay = b.dataset.ngay
    viTriKhop = -1; dungChip(); X.timBieu()
  })

  // ---------- ban do nho ----------
  const bd = el('banDo'), bdc = bd.getContext('2d')
  let bdCho = false, bdKhung = null
  X.veBanDo = () => { if (bdCho) return; bdCho = true; requestAnimationFrame(veBanDo) }
  function veBanDo() {
    bdCho = false
    const W = bd.width, H = bd.height
    const hop = el('banDoHop')
    if (!X.mucs.length && !X.vat.length && !X.khung.length) { hop.hidden = true; return }
    hop.hidden = false
    const vp = { x: -V.x / V.s, y: -V.y / V.s, w: innerWidth / V.s, h: innerHeight / V.s }
    const b = X.hopTong([...X.mucs, ...X.vat, ...X.khung, vp].map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h })))
    const pad = 8, s = Math.min((W - pad * 2) / b.w, (H - pad * 2) / b.h)
    const ox = (W - b.w * s) / 2 - b.x * s, oy = (H - b.h * s) / 2 - b.y * s
    bdKhung = { s, ox, oy }
    bdc.clearRect(0, 0, W, H)
    const mo = (e) => !!(e && e.classList.contains('mo'))
    for (const k of X.khung) { bdc.globalAlpha = .8; bdc.strokeStyle = k.mau; bdc.lineWidth = 1; bdc.strokeRect(k.x * s + ox, k.y * s + oy, k.w * s, k.h * s) }
    for (const m of X.mucs) {
      bdc.globalAlpha = mo(X.elO.get(m.khoa)) ? .15 : .85
      bdc.fillStyle = X.sel.has('o:' + m.khoa) ? '#f86820' : '#d8d3c8'
      bdc.fillRect(m.x * s + ox, m.y * s + oy, Math.max(1.5, m.w * s), Math.max(1.5, m.h * s))
    }
    for (const v of X.vat) { bdc.globalAlpha = mo(X.elV.get(v.id)) ? .15 : .9; bdc.fillStyle = X.sel.has('v:' + v.id) ? '#f86820' : v.mau; bdc.fillRect(v.x * s + ox, v.y * s + oy, Math.max(1.5, v.w * s), Math.max(1.5, v.h * s)) }
    bdc.globalAlpha = 1; bdc.strokeStyle = '#f86820'; bdc.lineWidth = 1.5
    bdc.strokeRect(vp.x * s + ox, vp.y * s + oy, vp.w * s, vp.h * s)
  }
  let keoBd = false
  const diBd = (e) => {
    if (!bdKhung) return
    const r = bd.getBoundingClientRect()
    const px = (e.clientX - r.left) * (bd.width / r.width), py = (e.clientY - r.top) * (bd.height / r.height)
    V.x = innerWidth / 2 - ((px - bdKhung.ox) / bdKhung.s) * V.s; V.y = innerHeight / 2 - ((py - bdKhung.oy) / bdKhung.s) * V.s
    X.datNhin()
  }
  bd.addEventListener('pointerdown', (e) => { keoBd = true; try { bd.setPointerCapture(e.pointerId) } catch (err) {} diBd(e); e.stopPropagation() })
  bd.addEventListener('pointermove', (e) => { if (keoBd) diBd(e) })
  bd.addEventListener('pointerup', () => { keoBd = false })

  // ---------- xuat khung ra PNG / PDF ----------
  const carga = (u) => new Promise((res) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = u })
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')' }
  function hcn(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() }
  function veChu(c, text, x, y, w, lh, toiDa) {
    const dong = []
    for (const doan of String(text).split('\n')) {
      let cur = ''
      for (const tu of doan.split(' ')) {
        const th = cur ? cur + ' ' + tu : tu
        if (c.measureText(th).width > w && cur) { dong.push(cur); cur = tu } else cur = th
      }
      dong.push(cur)
    }
    dong.slice(0, toiDa || 99).forEach((d, i) => c.fillText(d, x, y + i * lh))
  }
  async function xuatKhung(id, loai) {
    const k = X.mK.get(id); if (!k) return
    const PAD = 36, TIEU = 44
    const W = Math.round(k.w + PAD * 2), H = Math.round(k.h + PAD * 2 + TIEU)
    let sc = 2; while ((W * sc > 7000 || H * sc > 7000) && sc > .5) sc -= .25
    const cvs = document.createElement('canvas'); cvs.width = Math.round(W * sc); cvs.height = Math.round(H * sc)
    const c = cvs.getContext('2d'); c.scale(sc, sc)
    c.fillStyle = '#0c0c0d'; c.fillRect(0, 0, W, H)
    const ox = PAD - k.x, oy = PAD + TIEU - k.y
    c.fillStyle = hexA(k.mau, .08); hcn(c, PAD, PAD + TIEU, k.w, k.h, 18); c.fill()
    c.strokeStyle = hexA(k.mau, .6); c.lineWidth = 1.5; c.stroke()
    c.fillStyle = k.mau; c.font = '800 22px Inter, sans-serif'; c.textBaseline = 'alphabetic'; c.fillText(k.ten, PAD, PAD + 26)
    const os = X.mucs.filter((m) => X.tamTrong(m, k)), vs = X.vat.filter((v) => X.tamTrong(v, k))
    const ss = X.net.filter((n) => { const r = X.rectOf('s:' + n.id); return r && X.tamTrong(r, k) })
    const hinhAnh = new Map(), dai = new Map()
    await Promise.all([
      ...os.filter((m) => m.kieu === 'anh').map(async (m) => hinhAnh.set(m.khoa, await carga(m.anh))),
      ...os.filter((m) => m.kieu === 'dai').map(async (m) => dai.set(m.khoa, await Promise.all(m.anh.slice(0, 6).map(carga)))),
    ])
    const phu = (img, x, y, w, h) => {              // object-fit: cover, canh tren
      if (!img) { c.fillStyle = '#1b1b1f'; c.fillRect(x, y, w, h); return }
      const r = Math.max(w / img.width, h / img.height)
      c.drawImage(img, 0, 0, w / r, h / r, x, y, w, h)
    }
    for (const m of os) {
      const x = m.x + ox, y = m.y + oy
      c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 10; c.shadowOffsetY = 3
      c.fillStyle = m.kieu === 'anh' ? '#f4f1ea' : '#16161a'; hcn(c, x, y, m.w, m.h, 4); c.fill(); c.restore()
      if (m.kieu === 'anh') phu(hinhAnh.get(m.khoa), x + 6, y + 6, m.w - 12, m.h - 28)
      else if (m.kieu === 'dai') { const ds = dai.get(m.khoa) || []; const cw = (m.w - 12 - 15) / 6; ds.forEach((im, i) => phu(im, x + 6 + i * (cw + 3), y + 6, cw, m.h - 28)) }
      else { c.fillStyle = '#1b1b1f'; c.fillRect(x + 6, y + 14, m.w - 12, m.h - 36); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(x + m.w / 2 - 8, y + m.h / 2 - 14); c.lineTo(x + m.w / 2 + 12, y + m.h / 2 - 3); c.lineTo(x + m.w / 2 - 8, y + m.h / 2 + 8); c.closePath(); c.fill() }
      c.fillStyle = m.kieu === 'anh' ? '#3a342b' : '#f4f1ea'; c.font = '600 12px Inter, sans-serif'
      const d = new Date(m.mtime); c.fillText(d.getDate() + '/' + (d.getMonth() + 1) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), x + 8, y + m.h - 8)
    }
    for (const v of vs) {
      const x = v.x + ox, y = v.y + oy
      if (v.loai === 'ghi') {
        c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8; c.shadowOffsetY = 3; c.fillStyle = v.mau; hcn(c, x, y, v.w, v.h, 6); c.fill(); c.restore()
        const fs = v.chu.length <= 30 ? 22 : v.chu.length <= 80 ? 18 : v.chu.length <= 160 ? 15 : 13
        c.fillStyle = '#1b1710'; c.font = '600 ' + fs + 'px Inter, sans-serif'; c.textBaseline = 'top'
        veChu(c, v.chu, x + 12, y + 12, v.w - 24, fs * 1.3, Math.max(1, Math.floor((v.h - 24) / (fs * 1.3)))); c.textBaseline = 'alphabetic'
      } else if (v.loai === 'chu') {
        c.fillStyle = v.mau; c.font = '700 28px Inter, sans-serif'; c.textBaseline = 'top'; veChu(c, v.chu, x, y, v.w, 36); c.textBaseline = 'alphabetic'
      } else if (v.loai === 'hinh') {
        c.fillStyle = hexA(v.mau, .22); c.strokeStyle = v.mau; c.lineWidth = 2
        c.beginPath()
        if (v.hinh === 'tron') c.ellipse(x + v.w / 2, y + v.h / 2, v.w / 2, v.h / 2, 0, 0, Math.PI * 2)
        else if (v.hinh === 'thoi') { c.moveTo(x + v.w / 2, y); c.lineTo(x + v.w, y + v.h / 2); c.lineTo(x + v.w / 2, y + v.h); c.lineTo(x, y + v.h / 2); c.closePath() }
        else hcn(c, x, y, v.w, v.h, 10)
        c.fill(); c.stroke()
        if (v.chu) { c.fillStyle = '#fff'; c.font = '700 18px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(v.chu.split('\n')[0].slice(0, 60), x + v.w / 2, y + v.h / 2, v.w - 16); c.textAlign = 'left'; c.textBaseline = 'alphabetic' }
      } else if (v.loai === 'link') {
        c.fillStyle = '#1f1f24'; c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; hcn(c, x, y, v.w, v.h, 12); c.fill(); c.stroke()
        let host = v.url; try { host = new URL(v.url).hostname.replace(/^www\./, '') } catch (e) {}
        c.fillStyle = '#fff'; c.font = '800 16px Inter, sans-serif'; c.fillText(host, x + 16, y + 34, v.w - 32)
        c.fillStyle = '#9a9aa3'; c.font = '500 12px Inter, sans-serif'; c.fillText(v.url, x + 16, y + 58, v.w - 32)
      }
    }
    c.save(); c.translate(ox, oy); c.lineCap = 'round'; c.lineJoin = 'round'
    for (const n of ss) { c.strokeStyle = n.mau; c.lineWidth = n.loai === 'daquang' ? 22 : 4; c.globalAlpha = n.loai === 'daquang' ? .38 : 1; c.stroke(new Path2D(X.duongNet(n.pts))) }
    c.globalAlpha = 1
    const trongKhung = (d) => { if (d.k) { const r = X.rectOf(d.k); return !!r && X.tamTrong(r, k) } return d.x >= k.x && d.x <= k.x + k.w && d.y >= k.y && d.y <= k.y + k.h }
    for (const n of X.noi) {
      if (!trongKhung(n.a) || !trongKhung(n.b)) continue
      const h = X.hinhNoi(n.a, n.b); if (!h) continue
      c.strokeStyle = n.mau; c.lineWidth = 3; c.beginPath(); c.moveTo(h.p.x, h.p.y); c.lineTo(h.q.x, h.q.y); c.stroke()
      const m = h.mui.split(' ').map(Number); c.fillStyle = n.mau; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[2], m[3]); c.lineTo(m[4], m[5]); c.closePath(); c.fill()
    }
    c.restore()
    const blob = await new Promise((res) => cvs.toBlob(res, loai === 'pdf' ? 'image/jpeg' : 'image/png', 0.92))
    if (!blob) { X.hienBao(T('cv.xuatLoi')); return }
    const r = await cv.xuat(loai, await blob.arrayBuffer(), k.ten, cvs.width, cvs.height)
    if (r && r.ok) X.hienBao(T('cv.daXuat', { ten: r.ten }))
    else if (!(r && r.huy)) X.hienBao(T('cv.xuatLoi'))
  }
  X.xuatKhung = xuatKhung

  // ---------- xem nhanh (Space) ----------
  let xn = null
  X.dongXem = () => { if (!xn) return false; const v = xn.querySelector('video'); if (v) { try { v.pause() } catch (e) {} } xn.remove(); xn = null; return true }
  /** Tam duoc xem: tam duoi con tro neu no dang duoc chon, khong thi tam dang chon dau tien. */
  function tamXem() {
    const chon = [...X.sel].filter((k) => k[0] === 'o')
    if (!chon.length) return null
    const duoi = document.querySelector('.o:hover')
    if (duoi && X.sel.has('o:' + duoi.dataset.khoa)) return X.mO.get(duoi.dataset.khoa)
    return X.mO.get(chon[0].slice(2))
  }
  let xnDs = [], xnI = 0
  X.xemDangMo = () => !!xn
  function veXem(m) {
    if (xn) { const v = xn.querySelector('video'); if (v) { try { v.pause() } catch (e) {} } xn.remove() }
    xn = document.createElement('div'); xn.className = 'xn'; xn.setAttribute('role', 'dialog')
    let h
    if (m.kieu === 'dai') h = '<div class="dai6">' + m.anh.map((u) => '<img alt="" src="' + esc(u) + '">').join('') + '</div>'
    else if (m.kieu === 'video') h = '<video controls autoplay muted playsinline src="' + esc(m.video) + '"></video>'
    else h = '<img alt="" src="' + esc(m.goc || m.anh) + '" data-nho="' + esc(m.anh) + '">'
    xn.innerHTML = h + '<div class="ten2">' + esc(m.ten || m.khoa) + (xnDs.length > 1 ? '  ·  ' + (xnI + 1) + ' / ' + xnDs.length : '') + '</div>'
    const im = xn.querySelector('img[data-nho]'); if (im) im.addEventListener('error', () => { im.src = im.dataset.nho }, { once: true })
    xn.addEventListener('click', () => X.dongXem())
    document.body.append(xn)
  }
  /** Mui ten trai / phai khi dang xem: sang tam ke (dang chon nhieu tam thi trong phan chon, khong thi theo thu tu thoi gian cua ca bang). */
  X.xemTiep = (huong) => {
    if (!xn || xnDs.length < 2) return
    xnI = (xnI + huong + xnDs.length) % xnDs.length
    const m = X.mO.get(xnDs[xnI]); if (m) { X.chon(['o:' + m.khoa]); veXem(m) }
  }
  // macOS: Quick Look that dang mo, main chuyen phim trai / phai sang day -> doi sang tam ke (bo qua dai Storyboard vi khong co file)
  cv.onXemTiep((h) => {
    if (!xnDs.length) return
    let i = xnI
    for (let n = 0; n < xnDs.length; n++) {
      i = (i + h + xnDs.length) % xnDs.length
      const m = X.mO.get(xnDs[i])
      if (m && m.kieu !== 'dai') { xnI = i; X.chon(['o:' + m.khoa]); cv.xemNhanh(m.khoa); return }
    }
  })
  X.xemNhanh = async () => {
    if (X.dongXem()) return
    const m = tamXem(); if (!m) return
    const chon = [...X.sel].filter((k) => k[0] === 'o').map((k) => k.slice(2))
    xnDs = chon.length > 1 ? chon.sort((a, b) => X.mO.get(a).mtime - X.mO.get(b).mtime) : X.mucs.slice().sort((a, b) => a.mtime - b.mtime || (a.khoa < b.khoa ? -1 : 1)).map((o) => o.khoa)
    xnI = Math.max(0, xnDs.indexOf(m.khoa))
    if (m.kieu !== 'dai') {
      const r = await cv.xemNhanh(m.khoa)
      if (r && r.native) return                              // macOS: Quick Look that, tu dong khi bam Space lan nua
    }
    veXem(m)
  }

  // ---------- khoi dau ----------
  capNhatNgu()
  X.veBanDo()
})()
