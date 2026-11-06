'use strict'

/* SUA NET DA VE (05/11/2026, ROADMAP 0i #8): cong cu chon (phim V) tren man chup (overlay.js) VA tren anh ghim (pin.js).
   Truoc day V chi keo duoc va Delete xoa; Ctrl+Z chi bo net CUOI nen keo net / doi mau / xoa khong co lich su.
   Nay: bam vao khung / chu / so / net but / mui ten thi hien khung chon co TAY NAM:
     - 4 goc: co gian (khung, lam mo, chu doi co chu, net but nhan toa do diem);
     - tay XOAY phia tren (khung, chu, so): kich chuot keo de xoay quanh tam, giu Shift = nhay 15 do;
     - mui ten: 2 dau keo duoc rieng tung dau.
   Moi thao tac (them, xoa, keo, co gian, xoay, doi mau, nudge bang phim) la mot OP trong lich su: Ctrl+Z / Ctrl+Shift+Z / nut
   Hoan tac - Lam lai di theo dung thu tu da lam.
   Shape luu goc xoay o thuoc tinh `rot` (radian, quanh TAM); veShape trong overlay.js / pin.js ve co xoay nen anh XUAT ra
   (man chup: veEl; anh ghim: luuVe) giong het thu nhin thay.
   Tep nay dung CHUNG cho hai trang (script thuong, khong module): doc cac bien / ham toan cuc cua trang chu (shapes, R_SO, CO_CHU,
   tinhHopBaoChu, doDayNet, kichThuocVe, capNhatRedo) luc GOI, khong luc nap. */
const SuaNet = (() => {
  const BK_TAY = 9        // ban kinh bat tay nam, DIP
  const KC_XOAY = 24      // tay xoay cach canh khung chon
  const lichSu = []       // cac op da lam
  const redo = []         // cac op da hoan tac
  const sao = (s) => { const c = Object.assign({}, s); if (s.pts) c.pts = s.pts.slice(); return c }
  const khac = (a, b) => JSON.stringify(a) !== JSON.stringify(b)
  const kep = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const capNhat = () => { if (typeof capNhatRedo === 'function') capNhatRedo() }
  function datLai(s, snap) { for (const k of Object.keys(s)) delete s[k]; Object.assign(s, sao(snap)) }

  /* ── Lich su ── */
  function ghi(op) { lichSu.push(op); redo.length = 0; capNhat() }
  /* Da doi `s` so voi anh chup `truoc` thi ghi op "sua". Tra true neu co doi. */
  function ghiSua(s, truoc) {
    if (!khac(truoc, s)) return false
    // Khung Che da bi nguoi dung keo / doi: no khong con chac phu chu cu. Bo danh dau de "Tu che" che lai cho do, khong coi la da che.
    if (s.che && s.phu && s.phu.length) s.phu = []
    ghi({ k: 'sua', s, truoc: sao(truoc), sau: sao(s) })
    return true
  }
  /* 05/11: shape co `nhom` (Che thong minh: "Tu che", "Che moi cho trung") = MOT buoc Hoan tac / Lam lai cho ca nhom. */
  /* Nhom la cua MOT thao tac: "them" gop theo nhom cua lan them; xoa / sua chi gop khi chinh op do mang nhom (mot lan bam bo che).
     Xoa mot khung trong nhom roi Ctrl+Z la tra dung khung do, khong go ca nhom da them truoc do. */
  const nhomCua = (op) => (op && (op.nhom || (op.k === 'them' && op.s && op.s.nhom))) || null
  function hoanTac() {
    const op = luiMot()
    if (!op) return false
    const nhom = nhomCua(op)
    if (nhom) while (nhomCua(lichSu[lichSu.length - 1]) === nhom) luiMot()
    capNhat()
    return true
  }
  function luiMot() {
    let op = lichSu.pop()
    if (!op) { // shape them bang duong khac (khong ghi op): van bo duoc net cuoi nhu cu
      const s = shapes[shapes.length - 1]
      if (!s) return null
      op = { k: 'them', s }
    }
    if (op.k === 'them') { op.idx = shapes.indexOf(op.s); if (op.idx >= 0) shapes.splice(op.idx, 1) }
    else if (op.k === 'xoa') shapes.splice(Math.min(op.idx, shapes.length), 0, op.s)
    else if (op.k === 'sua') datLai(op.s, op.truoc)
    else if (op.k === 'cat') op.ap(op.truoc) // 06/11 cat bo khuc giua anh (pin.js): tra ca anh nen + kich thuoc + vi tri net
    redo.push(op)
    return op
  }
  function lamLai() {
    const op = toiMot()
    if (!op) return false
    const nhom = nhomCua(op)
    if (nhom) while (nhomCua(redo[redo.length - 1]) === nhom) toiMot()
    capNhat()
    return true
  }
  function toiMot() {
    const op = redo.pop()
    if (!op) return null
    if (op.k === 'them') shapes.splice(op.idx >= 0 ? Math.min(op.idx, shapes.length) : shapes.length, 0, op.s)
    else if (op.k === 'xoa') { const i = shapes.indexOf(op.s); if (i >= 0) shapes.splice(i, 1) }
    else if (op.k === 'sua') datLai(op.s, op.sau)
    else if (op.k === 'cat') op.ap(op.sau)
    lichSu.push(op)
    return op
  }

  /* Moi doi tuong mang toa do can dich khi nguoi dung doi vi tri khung chon: shape dang co + shape / anh chup trong lich su
     va hang doi lam lai (khong thi hoan tac / lam lai ra net lech cho). */
  function moiToaDo(ds) {
    const tap = new Set(ds)
    for (const op of lichSu.concat(redo)) { if (op.s) tap.add(op.s); if (op.truoc) tap.add(op.truoc); if (op.sau) tap.add(op.sau) }
    return [...tap]
  }

  /* ── Hinh hoc ── */
  /* Hop HINH HOC (chua tinh le) cua shape: tam, rong, cao, goc xoay, le (khoang hien khung chon cach hinh). */
  function hop(s) {
    if (s.pts) {
      const p = s.pts
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1] }
      return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, rot: 0, le: doDayNet(s) / 2 + 3, x0, y0, x1, y1 }
    }
    if (s.type === 'rect' || s.type === 'blur' || s.type === 'spot') {
      const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2), w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1)
      return { cx: x + w / 2, cy: y + h / 2, w, h, rot: s.type === 'rect' ? (s.rot || 0) : 0, le: 4 }
    }
    if (s.type === 'text') {
      const b = tinhHopBaoChu(s)
      return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, w: b.w, h: b.h, rot: s.rot || 0, le: 2 }
    }
    if (s.type === 'so') return { cx: s.x, cy: s.y, w: R_SO * 2, h: R_SO * 2, rot: s.rot || 0, le: 4 }
    return null
  }
  const ra = (h, lx, ly) => { const c = Math.cos(h.rot), s = Math.sin(h.rot); return { x: h.cx + lx * c - ly * s, y: h.cy + lx * s + ly * c } }
  const xoayVec = (rot, vx, vy) => { const c = Math.cos(rot), s = Math.sin(rot); return { x: vx * c - vy * s, y: vx * s + vy * c } }
  const vaoCuc = (rot, vx, vy) => { const c = Math.cos(rot), s = Math.sin(rot); return { x: vx * c + vy * s, y: -vx * s + vy * c } }

  /* Dua diem man hinh ve khung toa do CUA SHAPE chua xoay (de thu trung bang hop thang). */
  function vaoKhung(s, x, y) {
    if (!s.rot || s.pts || s.type === 'arrow' || s.type === 'blur' || s.type === 'spot') return { x, y }
    const h = hop(s)
    if (!h) return { x, y }
    const q = vaoCuc(h.rot, x - h.cx, y - h.cy)
    return { x: h.cx + q.x, y: h.cy + q.y }
  }

  /* Danh sach tay nam cua shape (toa do man hinh ve). loai: 'goc' | 'xoay' | 'dau'. */
  function tay(s) {
    if (s.type === 'arrow') return [{ k: 'p1', loai: 'dau', x: s.x1, y: s.y1 }, { k: 'p2', loai: 'dau', x: s.x2, y: s.y2 }]
    const h = hop(s)
    if (!h) return []
    const hw = h.w / 2 + h.le, hh = h.h / 2 + h.le
    const out = []
    if (s.type !== 'so') {
      for (const [k, sx, sy] of [['nw', -1, -1], ['ne', 1, -1], ['se', 1, 1], ['sw', -1, 1]]) out.push(Object.assign({ k, loai: 'goc', sx, sy }, ra(h, sx * hw, sy * hh)))
    }
    if (s.type !== 'blur' && s.type !== 'spot' && !s.pts) {
      let dir = -1
      if (ra(h, 0, -hh - KC_XOAY).y < 12) dir = 1 // sat mep tren cua canvas: dat tay xoay phia DUOI
      out.push(Object.assign({ k: 'xoay', loai: 'xoay', dir }, ra(h, 0, dir * (hh + KC_XOAY))))
    }
    return out
  }
  function trungTay(s, x, y) {
    let tot = null, kc = BK_TAY
    for (const t of tay(s)) { const d = Math.hypot(x - t.x, y - t.y); if (d <= kc) { kc = d; tot = t } }
    return tot
  }
  const conTro = (t) => (t.loai === 'xoay' ? 'grab' : t.loai === 'dau' ? 'crosshair' : (t.k === 'nw' || t.k === 'se') ? 'nwse-resize' : 'nesw-resize')

  /* ── Keo tay nam ── */
  function bat(s, t, x, y) {
    const st = { s, t, snap: sao(s), h: hop(s), moff: { x: x - t.x, y: y - t.y } }
    if (t.loai === 'goc') {
      st.sx = t.sx; st.sy = t.sy
      const h = st.h
      if (s.pts) {
        st.F = { x: t.sx < 0 ? h.x1 : h.x0, y: t.sy < 0 ? h.y1 : h.y0 }
        st.M0 = { x: t.sx < 0 ? h.x0 : h.x1, y: t.sy < 0 ? h.y0 : h.y1 }
      } else {
        st.F = ra(h, -t.sx * h.w / 2, -t.sy * h.h / 2)
      }
    }
    return st
  }
  function keo(st, x, y, shift) {
    const s = st.s, h = st.h, t = st.t
    if (t.loai === 'dau') {
      const sz = kichThuocVe()
      const nx = kep(x - st.moff.x, 0, sz.w), ny = kep(y - st.moff.y, 0, sz.h)
      if (t.k === 'p1') { s.x1 = Math.round(nx); s.y1 = Math.round(ny) } else { s.x2 = Math.round(nx); s.y2 = Math.round(ny) }
      return
    }
    if (t.loai === 'xoay') {
      let a = Math.atan2(y - h.cy, x - h.cx) + Math.PI / 2
      if (t.dir === 1) a += Math.PI // tay xoay dat phia duoi: huong ngoai la +y
      if (shift) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12)
      a = Math.atan2(Math.sin(a), Math.cos(a)) // dua ve (-pi, pi]
      s.rot = Math.abs(a) < 1e-9 ? 0 : a
      return
    }
    // goc: diem hinh hoc cua goc dang keo = chuot - lech luc bat - phan le cua khung chon
    const le = h.le, rot = h.rot
    const lv = xoayVec(rot, st.sx * le, st.sy * le)
    const Mg = { x: x - st.moff.x - lv.x, y: y - st.moff.y - lv.y }
    const F = st.F
    const d = vaoCuc(rot, Mg.x - F.x, Mg.y - F.y)
    if (s.pts) {
      const sp = st.snap.pts
      const dx0 = st.M0.x - F.x, dy0 = st.M0.y - F.y
      let kx = Math.abs(dx0) > 0.5 ? (Mg.x - F.x) / dx0 : 1
      let ky = Math.abs(dy0) > 0.5 ? (Mg.y - F.y) / dy0 : 1
      if (Math.abs(kx) < 0.05) kx = 0.05 * (kx < 0 ? -1 : 1)
      if (Math.abs(ky) < 0.05) ky = 0.05 * (ky < 0 ? -1 : 1)
      for (let i = 0; i < sp.length; i += 2) { s.pts[i] = F.x + (sp[i] - F.x) * kx; s.pts[i + 1] = F.y + (sp[i + 1] - F.y) * ky }
      return
    }
    if (s.type === 'text') {
      const d0x = st.sx * h.w, d0y = st.sy * h.h
      const f = kep((d.x * d0x + d.y * d0y) / (d0x * d0x + d0y * d0y), 0.3, 10)
      const size = kep((st.snap.size || CO_CHU) * f, 8, 200)
      const b = tinhHopBaoChu(Object.assign({}, st.snap, { size }))
      const off = xoayVec(rot, -st.sx * b.w / 2, -st.sy * b.h / 2)
      const C = { x: F.x - off.x, y: F.y - off.y }
      s.size = size
      s.x = C.x - b.w / 2
      s.y = C.y - b.h / 2
      return
    }
    // khung / lam mo
    const w = Math.max(4, Math.abs(d.x)), hh = Math.max(4, Math.abs(d.y))
    const sgx = d.x < 0 ? -1 : d.x > 0 ? 1 : st.sx, sgy = d.y < 0 ? -1 : d.y > 0 ? 1 : st.sy
    const dv = xoayVec(rot, sgx * w / 2, sgy * hh / 2)
    const C = { x: F.x + dv.x, y: F.y + dv.y }
    s.x1 = C.x - w / 2; s.x2 = C.x + w / 2; s.y1 = C.y - hh / 2; s.y2 = C.y + hh / 2
  }
  /* Tha chuot: ghi vao lich su neu shape that su doi. */
  function xong(st) { return ghiSua(st.s, st.snap) }

  /* ── Ve khung chon + tay nam (thay veKhungChonShape cu) ── */
  function ve(ctx, s) {
    const hs = tay(s)
    ctx.save()
    ctx.strokeStyle = '#00e5ff'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    if (s.type === 'arrow') {
      const x0 = Math.min(s.x1, s.x2), y0 = Math.min(s.y1, s.y2)
      ctx.strokeRect(x0 - 6, y0 - 6, Math.abs(s.x2 - s.x1) + 12, Math.abs(s.y2 - s.y1) + 12)
    } else {
      const h = hop(s)
      if (!h) { ctx.restore(); return }
      const hw = h.w / 2 + h.le, hh = h.h / 2 + h.le
      ctx.translate(h.cx, h.cy); ctx.rotate(h.rot)
      ctx.strokeRect(-hw, -hh, hw * 2, hh * 2)
    }
    ctx.restore()
    ctx.save()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#00e5ff'
    ctx.fillStyle = '#ffffff'
    for (const t of hs) {
      if (t.loai === 'goc') { ctx.fillRect(t.x - 4, t.y - 4, 8, 8); ctx.strokeRect(t.x - 4, t.y - 4, 8, 8) }
      else {
        if (t.loai === 'xoay') { // day noi tay xoay voi canh khung
          const h = hop(s), hh = h.h / 2 + h.le, c = ra(h, 0, t.dir * hh)
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(t.x, t.y); ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(t.x, t.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      }
    }
    ctx.restore()
  }

  return { moiToaDo, lichSu, redo, ghi, ghiSua, hoanTac, lamLai, sao, datLai, hop, tay, trungTay, conTro, vaoKhung, bat, keo, xong, ve }
})()
