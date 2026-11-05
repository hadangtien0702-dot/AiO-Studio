'use strict'
/* CANVAS (12/10) — VAT TU DO tren bang: ghi chu dan, chu, hinh, the link, mui ten noi, but ve / da quang. Chi nam trong so bo cuc
   (src/canvas-kho.js luuVat), KHONG tao file trong thu muc anh. Dung chung doi tuong window.CVX voi canvas.js. */
;(() => {
  const X = window.CVX
  if (!X) return
  const { cv, T, the, bang } = X
  const NS = 'http://www.w3.org/2000/svg'
  const MAU_GHI = ['#ffe27a', '#ffb067', '#ff9ec7', '#8ee2a0', '#8cc8ff', '#c4b0ff']
  const MAU_NET = ['#f86820', '#2dd4bf', '#a78bfa', '#ffd65a', '#f472b6', '#4ade80', '#ffffff']
  X.MAU_GHI = MAU_GHI; X.MAU_NET = MAU_NET
  const KICH = { ghi: [168, 168], chu: [240, 40], vuong: [180, 120], tron: [150, 150], thoi: [170, 130], link: [290, 84] }
  let dem = 0
  const moiId = (p) => p + Date.now().toString(36) + (dem++).toString(36) + Math.floor(Math.random() * 46656).toString(36)
  X.moiId = moiId
  let mauGhi = MAU_GHI[0], mauNet = MAU_NET[0], mauChu = '#ffffff', mauNoi = MAU_NET[0], mauHinh = MAU_NET[1]
  X.datMauMacDinh = (loai, m) => { if (loai === 'ghi') mauGhi = m; else if (loai === 'chu') mauChu = m; else if (loai === 'hinh') mauHinh = m; else if (loai === 'noi') mauNoi = m; else mauNet = m }

  // ---------- lop SVG: mui ten + net ve ----------
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'lop'); svg.setAttribute('width', '1'); svg.setAttribute('height', '1')
  svg.innerHTML = '<g id="gNet"></g><g id="gNoi"></g><g id="gTam"></g>'
  the.insertBefore(svg, X.moc)
  const gNet = svg.querySelector('#gNet'), gNoi = svg.querySelector('#gNoi'), gTam = svg.querySelector('#gTam')

  const f1 = (n) => Math.round(n * 10) / 10
  function duongNet(pts) {
    if (pts.length <= 2) return 'M' + f1(pts[0]) + ' ' + f1(pts[1]) + 'l0.01 0'
    let d = 'M' + f1(pts[0]) + ' ' + f1(pts[1])
    for (let i = 2; i + 3 < pts.length; i += 2) {
      const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2
      d += 'Q' + f1(pts[i]) + ' ' + f1(pts[i + 1]) + ' ' + f1(mx) + ' ' + f1(my)
    }
    return d + 'L' + f1(pts[pts.length - 2]) + ' ' + f1(pts[pts.length - 1])
  }
  X.duongNet = duongNet
  const chuY = (n) => (n.loai === 'daquang' ? { w: 22, o: 0.38 } : { w: 4, o: 1 })
  function canh(r, tx, ty) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dx = tx - cx, dy = ty - cy
    if (!dx && !dy) return { x: cx, y: cy }
    const s = Math.min(dx ? (r.w / 2) / Math.abs(dx) : 1e9, dy ? (r.h / 2) / Math.abs(dy) : 1e9)
    return { x: cx + dx * s, y: cy + dy * s }
  }
  function diemNoi(d) {
    if (d.k) { const r = X.rectOf(d.k); return r ? { r, cx: r.x + r.w / 2, cy: r.y + r.h / 2 } : null }
    return { r: null, cx: d.x, cy: d.y }
  }
  /** Hinh hoc mot mui ten: hai dau + dau mui. null neu mot dau mat thu no bam vao. */
  function hinhNoi(a, b) {
    const A = diemNoi(a), B = diemNoi(b)
    if (!A || !B) return null
    let p = A.r ? canh(A.r, B.cx, B.cy) : { x: A.cx, y: A.cy }
    let q = B.r ? canh(B.r, A.cx, A.cy) : { x: B.cx, y: B.cy }
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L
    if (A.r) p = { x: p.x + ux * 5, y: p.y + uy * 5 }
    if (B.r) q = { x: q.x - ux * 5, y: q.y - uy * 5 }
    const nx = -uy, ny = ux, hd = 16, hr = 7
    const bx = q.x - ux * hd, by = q.y - uy * hd
    return { p, q, mui: [q.x, q.y, bx + nx * hr, by + ny * hr, bx - nx * hr, by - ny * hr].map(f1).join(' ') }
  }
  X.hinhNoi = hinhNoi
  const elLop = new Map()
  function veLop() {
    X.mS = new Map(X.net.map((n) => [n.id, n])); X.mN = new Map(X.noi.map((n) => [n.id, n]))
    const sel = X.sel
    const cung = new Set()
    for (const n of X.net) {
      cung.add('s:' + n.id)
      let g = elLop.get('s:' + n.id)
      const y = chuY(n)
      if (!g) {
        g = document.createElementNS(NS, 'g'); g.dataset.s = n.id
        g.innerHTML = '<path class="hit" fill="none" stroke="transparent" stroke-linecap="round" stroke-linejoin="round"></path><path class="vis" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>'
        g.firstChild.dataset.hk = 's:' + n.id
        gNet.append(g); elLop.set('s:' + n.id, g)
      }
      const d = duongNet(n.pts)
      const hit = g.firstChild, vis = g.lastChild
      hit.setAttribute('d', d); hit.setAttribute('stroke-width', String(Math.max(14, y.w + 8)))
      vis.setAttribute('d', d); vis.setAttribute('stroke', n.mau); vis.setAttribute('stroke-width', String(y.w)); vis.setAttribute('stroke-opacity', String(y.o))
      g.classList.toggle('chon', sel.has('s:' + n.id)); g.classList.toggle('khoa', X.khoaCua('s:' + n.id))
    }
    for (const n of X.noi) {
      const k = 'c:' + n.id
      const h = hinhNoi(n.a, n.b)
      let g = elLop.get(k)
      if (!h) { if (g) { g.remove(); elLop.delete(k) } continue }
      cung.add(k)
      if (!g) {
        g = document.createElementNS(NS, 'g'); g.dataset.c = n.id
        g.innerHTML = '<path class="hit" fill="none" stroke="transparent" stroke-width="16" stroke-linecap="round"></path><path class="vis" fill="none" stroke-width="3" stroke-linecap="round"></path><polygon class="mui"></polygon>'
        g.firstChild.dataset.hk = k
        gNoi.append(g); elLop.set(k, g)
      }
      const d = 'M' + f1(h.p.x) + ' ' + f1(h.p.y) + 'L' + f1(h.q.x) + ' ' + f1(h.q.y)
      g.firstChild.setAttribute('d', d)
      const vis = g.children[1]; vis.setAttribute('d', d); vis.setAttribute('stroke', n.mau)
      const mui = g.children[2]; mui.setAttribute('points', h.mui); mui.setAttribute('fill', n.mau)
      g.classList.toggle('chon', sel.has(k))
    }
    for (const [k, g] of elLop) if (!cung.has(k)) { g.remove(); elLop.delete(k) }
  }
  X.veLop = veLop
  X.veLopChon = () => { for (const [k, g] of elLop) g.classList.toggle('chon', X.sel.has(k)) }

  // ---------- vat ----------
  const SVG_WEB = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/></svg>'
  function chuLink(v) {
    if (!v.url) return { host: '', url: '' }
    let h = v.url
    try { h = new URL(v.url).hostname.replace(/^www\./, '') } catch (e) {}
    return { host: h, url: v.url }
  }
  function coChu(n) { return n <= 30 ? 22 : n <= 80 ? 18 : n <= 160 ? 15 : 13 }
  function dungV(v) {
    const e = document.createElement('div'); e.dataset.id = v.id
    e.className = 'v v-' + v.loai
    if (v.loai === 'link') e.innerHTML = '<div class="lk">' + SVG_WEB + '<div class="lk-t"><b class="lk-h"></b><span class="lk-u"></span></div></div><div class="tx" contenteditable="false" spellcheck="false"></div><div class="cc"></div>'
    else e.innerHTML = '<div class="tx" contenteditable="false" spellcheck="false"></div><div class="cc"></div>'
    const tx = e.querySelector('.tx'); tx.dataset.vid = v.id
    // blur do CUA SO mat tieu diem (chuyen app khac) khong phai la "bam ra ngoai": giu nguyen che do go, quay lai go tiep (do 12/10 voi cua so co tieu diem that)
    tx.addEventListener('blur', () => { if (document.hasFocus()) ketThucSua(v.id) })
    tx.addEventListener('input', () => { const w = X.mV.get(v.id); if (w && w.loai === 'ghi') tx.style.fontSize = coChu(tx.innerText.length) + 'px' })
    the.append(e); X.elV.set(v.id, e)
    return e
  }
  function datV(v, doDo) {
    const e = X.elV.get(v.id); if (!e) return
    e.style.left = v.x + 'px'; e.style.top = v.y + 'px'; e.style.width = v.w + 'px'
    if (v.loai === 'chu') e.style.minHeight = v.h + 'px'; else e.style.height = v.h + 'px'
    e.style.setProperty('--m', v.mau)
    e.classList.toggle('khoa', X.khoaCua('v:' + v.id))
    if (v.loai === 'hinh') { e.classList.remove('h-vuong', 'h-tron', 'h-thoi'); e.classList.add('h-' + (v.hinh || 'vuong')) }
    const tx = e.querySelector('.tx')
    if (document.activeElement !== tx) {
      tx.textContent = v.loai === 'link' ? v.url : v.chu
      if (v.loai === 'ghi') tx.style.fontSize = coChu(v.chu.length) + 'px'
      if (!v.chu && (v.loai === 'ghi' || v.loai === 'chu')) tx.dataset.ph = T(v.loai === 'chu' ? 'cv.chuMau' : 'cv.ghiMau'); else delete tx.dataset.ph
    }
    if (v.loai === 'link') { const c = chuLink(v); e.querySelector('.lk-h').textContent = c.host || T('cv.linkMau'); e.querySelector('.lk-u').textContent = c.url }
    if (doDo && v.loai === 'chu') { const h = Math.max(24, Math.round(e.offsetHeight)); if (h !== v.h) v.h = h }
  }
  X.datV = datV
  function veVat() {
    X.mV = new Map(X.vat.map((v) => [v.id, v]))
    const co = new Set(X.vat.map((v) => v.id))
    for (const [id, e] of X.elV) if (!co.has(id)) { e.remove(); X.elV.delete(id) }
    for (const v of X.vat) { if (!X.elV.has(v.id)) dungV(v); datV(v) }
    veLop()
  }
  X.veVat = veVat

  // ---------- sua chu ----------
  let dangSua = null
  function suaVat(v, ep) {
    if (X.khoaCua('v:' + v.id)) { X.hienBao(T('cv.dangKhoa')); return }
    if (v.loai === 'link' && v.url && !ep) { cv.moLink(v.url); return }
    const e = X.elV.get(v.id); if (!e) return
    const tx = e.querySelector('.tx')
    dangSua = { id: v.id, truoc: X.chup(), cu: v.loai === 'link' ? v.url : v.chu }
    e.classList.add('sua')
    tx.setAttribute('contenteditable', 'plaintext-only')
    tx.textContent = dangSua.cu
    tx.focus()
    const r = document.createRange(); r.selectNodeContents(tx); const s = getSelection(); s.removeAllRanges(); s.addRange(r)
  }
  X.suaVat = suaVat
  X.dangSuaVat = () => !!dangSua
  /** Chot chu dang go. Goi tuong minh (Esc, bam ra ngoai) vi cua so khong co tieu diem (do an / chua nhan phim) khong phat su kien blur. */
  X.chotSua = () => { if (dangSua) ketThucSua(dangSua.id) }
  function ketThucSua(id) {
    if (!dangSua || dangSua.id !== id) return
    const d = dangSua; dangSua = null
    const v = X.mV.get(id), e = X.elV.get(id); if (!v || !e) return
    const tx = e.querySelector('.tx')
    const t = tx.innerText.replace(/\r/g, '').replace(/\n+$/, '').slice(0, 2000)
    tx.setAttribute('contenteditable', 'false'); e.classList.remove('sua')
    if (v.loai === 'link') {
      let u = t.trim()
      if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u
      try { const p = new URL(u); if (!/^https?:$/.test(p.protocol) || !p.hostname.includes('.')) u = '' } catch (err) { u = '' }
      if (!u && !d.cu) { X.vat = X.vat.filter((x) => x.id !== id); X.luuDoc(); X.veVat(); X.boChon(); return }
      if (u) v.url = u.slice(0, 600)
    } else {
      if (!t.trim() && !d.cu) { X.vat = X.vat.filter((x) => x.id !== id); X.luuDoc(); X.veVat(); X.boChon(); return }
      v.chu = t
    }
    datV(v, true)
    X.luuDoc(); veLop(); X.day(d.truoc, X.chup())
    if (X.capNhatNgu) X.capNhatNgu()
  }

  // ---------- tao ----------
  function taoVat(loai, r, extra, vaoSua) {
    const truoc = X.chup()
    const v = Object.assign({ id: moiId('v'), loai: loai === 'vuong' || loai === 'tron' || loai === 'thoi' ? 'hinh' : loai, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h), chu: '', tao: Date.now() }, extra)
    if (v.loai === 'ghi') v.mau = mauGhi
    else if (v.loai === 'chu') v.mau = mauChu
    else if (v.loai === 'hinh') { v.mau = mauHinh; v.hinh = loai === 'tron' ? 'tron' : loai === 'thoi' ? 'thoi' : 'vuong' }
    else v.mau = '#f86820'
    X.vat.push(v)
    X.veVat(); X.luuDoc(); X.chon(['v:' + v.id]); X.day(truoc, X.chup())
    if (vaoSua) suaVat(v, true)
    return v
  }
  X.taoVat = taoVat
  X.taoGhiTai = (p) => { const k = KICH.ghi; X.doiCongCu('chon'); taoVat('ghi', { x: p.x - k[0] / 2, y: p.y - k[1] / 2, w: k[0], h: k[1] }, null, true) }
  /** Tao vat co san chu (dan tu clipboard): ghi chu (chu thuong) hoac the link (la URL). */
  X.taoTuChu = (text, p) => {
    const t = String(text || '').trim(); if (!t) return null
    if (/^https?:\/\/\S+$/i.test(t)) { const k = KICH.link; return taoVat('link', { x: p.x - k[0] / 2, y: p.y - k[1] / 2, w: k[0], h: k[1] }, { url: t.slice(0, 600) }, false) }
    const k = KICH.ghi
    return taoVat('ghi', { x: p.x - k[0] / 2, y: p.y - k[1] / 2, w: k[0], h: k[1] }, { chu: t.slice(0, 2000) }, false)
  }

  // ---------- cong cu: tao bang chuot ----------
  function pointerGhi(e, chay) {
    let xong = false
    const mv = (ev) => { if (!xong) chay.move(ev) }
    const up = (ev) => { if (xong) return; xong = true; bang.removeEventListener('pointermove', mv); bang.removeEventListener('pointerup', up); bang.removeEventListener('pointercancel', up); try { bang.releasePointerCapture(e.pointerId) } catch (err) {} chay.up(ev) }
    bang.addEventListener('pointermove', mv); bang.addEventListener('pointerup', up); bang.addEventListener('pointercancel', up)
    try { bang.setPointerCapture(e.pointerId) } catch (err) {}
  }
  const xem = () => document.getElementById('xem')
  function batDauTao(e, loai, p) {
    const k = KICH[loai], x0 = e.clientX, y0 = e.clientY
    pointerGhi(e, {
      move(ev) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return
        const q = X.toaBang(ev), m = xem(); m.hidden = false
        m.style.left = Math.min(p.x, q.x) + 'px'; m.style.top = Math.min(p.y, q.y) + 'px'; m.style.width = Math.abs(q.x - p.x) + 'px'; m.style.height = Math.abs(q.y - p.y) + 'px'
      },
      up(ev) {
        xem().hidden = true
        const q = X.toaBang(ev), keo = Math.hypot(ev.clientX - x0, ev.clientY - y0) >= 6
        let r
        if (keo) r = { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), w: Math.max(60, Math.abs(q.x - p.x)), h: Math.max(loai === 'chu' ? 32 : 60, Math.abs(q.y - p.y)) }
        else r = { x: p.x - k[0] / 2, y: p.y - k[1] / 2, w: k[0], h: k[1] }
        if (loai === 'chu' && keo) r.h = k[1]
        X.doiCongCu('chon')
        taoVat(loai, r, null, loai === 'ghi' || loai === 'chu' || loai === 'link')
      },
    })
  }

  // ---------- cong cu: mui ten ----------
  function batDauNoi(e) {
    const dau = (ev) => {
      const t = document.elementFromPoint(ev.clientX, ev.clientY), o = t && t.closest ? t.closest('.o, .v') : null
      if (o && o.classList.contains('o')) return { k: 'o:' + o.dataset.khoa }
      if (o) return { k: 'v:' + o.dataset.id }
      const q = X.toaBang(ev); return { x: Math.round(q.x), y: Math.round(q.y) }
    }
    const a = dau(e)
    const hn = document.createElementNS(NS, 'path'); hn.setAttribute('fill', 'none'); hn.setAttribute('stroke', mauNoi); hn.setAttribute('stroke-width', '3'); hn.setAttribute('stroke-dasharray', '8 6'); hn.setAttribute('stroke-linecap', 'round')
    gTam.append(hn)
    let xa = null
    pointerGhi(e, {
      move(ev) {
        const A = diemNoi(a), q = X.toaBang(ev); if (!A) return
        const t = document.elementFromPoint(ev.clientX, ev.clientY), o = t && t.closest ? t.closest('.o, .v') : null
        if (xa && xa !== o) xa.classList.remove('nhan'); xa = o; if (o) o.classList.add('nhan')
        const p0 = A.r ? canh(A.r, q.x, q.y) : { x: A.cx, y: A.cy }
        hn.setAttribute('d', 'M' + f1(p0.x) + ' ' + f1(p0.y) + 'L' + f1(q.x) + ' ' + f1(q.y))
      },
      up(ev) {
        hn.remove(); if (xa) xa.classList.remove('nhan')
        const b = dau(ev)
        const giong = a.k && b.k && a.k === b.k
        const gan = Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 8
        if (giong || gan) return
        const truoc = X.chup()
        X.noi.push({ id: moiId('c'), a, b, mau: mauNoi })
        X.luuDoc(); veLop(); X.day(truoc, X.chup())
      },
    })
  }

  // ---------- cong cu: but ve / da quang ----------
  function batDauBut(e, loai) {
    const p = X.toaBang(e), pts = [p.x, p.y]
    const hn = document.createElementNS(NS, 'path'); hn.setAttribute('fill', 'none'); hn.setAttribute('stroke', mauNet); hn.setAttribute('stroke-linecap', 'round'); hn.setAttribute('stroke-linejoin', 'round')
    const y = chuY({ loai }); hn.setAttribute('stroke-width', String(y.w)); hn.setAttribute('stroke-opacity', String(y.o))
    gTam.append(hn)
    hn.setAttribute('d', duongNet(pts))
    pointerGhi(e, {
      move(ev) {
        const q = X.toaBang(ev), n = pts.length
        if (ev.shiftKey) { pts.length = 2; pts.push(q.x, q.y) }
        else if (Math.hypot(q.x - pts[n - 2], q.y - pts[n - 1]) >= 1.5 / X.V.s && pts.length < 11800) pts.push(q.x, q.y)
        hn.setAttribute('d', duongNet(pts))
      },
      up(ev) {
        hn.remove()
        const q = X.toaBang(ev)
        if (ev.shiftKey) { pts.length = 2; pts.push(q.x, q.y) }
        const truoc = X.chup()
        X.net.push({ id: moiId('s'), loai, mau: mauNet, pts: pts.map(f1) })
        X.luuDoc(); veLop(); X.day(truoc, X.chup())
      },
    })
  }

  X.congCuXuong = (e) => {
    const t = X.tool, p = X.toaBang(e)
    if (t === 'ghi' || t === 'chu' || t === 'vuong' || t === 'tron' || t === 'thoi' || t === 'link') { batDauTao(e, t, p); return true }
    if (t === 'noi') { batDauNoi(e); return true }
    if (t === 'but' || t === 'daquang') { batDauBut(e, t); return true }
    return false
  }
})()
