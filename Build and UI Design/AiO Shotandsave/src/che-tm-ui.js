'use strict'

/* CHE THONG MINH, phan GIAO DIEN dung chung cho overlay (vung khoanh) va anh ghim (05/11/2026).
   Doc chu cua vung -> hien KHUNG tung tu / tung dong tren vung; bam chu = che, bam lai = bo; "Tu che" tim email / so dien thoai /
   so the / duong link roi che het; "Che moi cho trung" che moi noi co cung chu voi chu vua che.
   Lop che la shape 'blur' kieu 'kin' (to kin #101010) di qua DUNG duong ve / hoan tac / xuat anh cua nhat lam mo co san: ben goi
   (overlay.js / pin.js) chi dua mang `shapes` + ham `veLai`. Phan thuan nam o che-thong-minh.js (window.CheTM).
   Ly do to kin thay vi kham: so lo 27/09 (khoi kham 8-15 px con khoi phuc duoc chu) - xem dau che-thong-minh.js. */

;(function () {
  const CT = window.CheTM

  /* opt = {
       goc: phan tu cha cua lop khung + thanh dieu khien,
       rect(): { x, y, w, h } vung (DIP) trong he toa do cua `goc`,
       heSo(): pixel thiet bi / DIP,
       shapes(): mang shape dang ve (SONG - cung mang voi ben goi),
       veLai(): ve lai canvas,
       doc(): Promise<{ ok, dong, w, h, loi }>  toa do PIXEL THIET BI cua vung,
       datThanh(strip): dat vi tri thanh dieu khien (khong co thi dung CSS),
       t(key), log(msg), nut: phan tu nut tren thanh cong cu (de bat sang) } */
  function tao(opt) {
    const t = opt.t
    let dangMo = false, luot = 0, kieu = 'tu'
    let tuList = [], dongList = [], auto = [], cuoi = null
    let hop = [] // [{ el, m }]
    let lop = null, strip = null, tt = null, nutTuChe = null, nutTrung = null, segTu = null, segDong = null, nutXong = null

    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e }
    const shapes = () => opt.shapes()

    function dung() {
      if (lop) return
      lop = el('div', 'che-lop'); lop.hidden = true
      strip = el('div', 'che-strip'); strip.hidden = true
      strip.setAttribute('role', 'group')
      tt = el('div', 'che-tt')
      const hang = el('div', 'che-hang')
      const seg = el('div', 'che-seg')
      segTu = el('button', 'che-segnut', t('che.tu')); segTu.type = 'button'
      segDong = el('button', 'che-segnut', t('che.dong')); segDong.type = 'button'
      seg.append(segTu, segDong)
      nutTuChe = el('button', 'che-nut', t('che.tuChe')); nutTuChe.type = 'button'
      nutTuChe.title = t('che.tuCheGoiY')
      nutTrung = el('button', 'che-nut', t('che.trung')); nutTrung.type = 'button'
      nutTrung.title = t('che.trungGoiY')
      nutXong = el('button', 'che-nut chinh', t('che.xong')); nutXong.type = 'button'
      hang.append(seg, nutTuChe, nutTrung, nutXong)
      strip.append(tt, hang)
      opt.goc.append(lop, strip)
      // Bam trong lop / thanh khong duoc ve / keo vung / keo cua so ben duoi
      for (const e of [lop, strip]) {
        e.addEventListener('mousedown', (ev) => { ev.stopPropagation() })
        e.addEventListener('dblclick', (ev) => { ev.stopPropagation() })
      }
      segTu.addEventListener('click', () => doiKieu('tu'))
      segDong.addEventListener('click', () => doiKieu('dong'))
      nutTuChe.addEventListener('click', tuChe)
      nutTrung.addEventListener('click', cheTrung)
      nutXong.addEventListener('click', dong)
    }

    function trangThai(ten, chu) {
      strip.dataset.trangThai = ten
      tt.textContent = chu
    }

    function datViTri() {
      const r = opt.rect()
      lop.style.left = r.x + 'px'; lop.style.top = r.y + 'px'
      lop.style.width = r.w + 'px'; lop.style.height = r.h + 'px'
      if (opt.datThanh) opt.datThanh(strip)
    }

    function veHop() {
      lop.textContent = ''
      hop = []
      const he = opt.heSo()
      const ds = kieu === 'tu' ? tuList : dongList
      for (const m of ds) {
        const e = el('div', 'che-hop')
        e.style.left = (m.x0 / he) + 'px'; e.style.top = (m.y0 / he) + 'px'
        e.style.width = Math.max(4, (m.x1 - m.x0) / he) + 'px'; e.style.height = Math.max(4, (m.y1 - m.y0) / he) + 'px'
        e.dataset.id = m.id; e.dataset.text = m.text; e.dataset.loai = m.loai
        e.addEventListener('click', (ev) => { ev.stopPropagation(); bam(m) })
        lop.appendChild(e)
        hop.push({ el: e, m })
      }
      lamMoi()
    }

    /* Goi lai moi khi mang shapes doi (ben goi goi trong redraw): cap nhat khung "da che" + nut. */
    function lamMoi() {
      if (!dangMo || !lop) return
      for (const h of hop) h.el.classList.toggle('da-che', CT.daChe(shapes(), h.m))
      const soChe = shapes().filter(CT.laShapeChe).length
      strip.dataset.daChe = String(soChe)
      nutTrung.disabled = !(cuoi && CT.daChe(shapes(), cuoi))
      segTu.classList.toggle('chon', kieu === 'tu'); segDong.classList.toggle('chon', kieu === 'dong')
    }

    /* Them mot loat muc che: moi lan bam = MOT buoc trong lich su Hoan tac / Lam lai (cung nhom) cua man chup. */
    let demNhom = 0
    function themDs(ms) {
      if (!ms.length) return
      const r = opt.rect(), he = opt.heSo()
      const nhom = 'che' + (++demNhom) + '_' + Date.now()
      opt.them(ms.map((m) => { const x = CT.taoShape(m, he, r.w * he, r.h * he); x.nhom = nhom; return x }))
    }
    /* Bo che bang cach bam lai: go khoi mang nen khong nam trong Hoan tac (Hoan tac chi lui cac lan che); hang doi Lam lai
       bi xoa de khong hien lai net cu tren cho vua bo. */
    function boDs(m) {
      const n = CT.boChe(shapes(), m)
      if (n && opt.xoaRedo) opt.xoaRedo()
      return n
    }

    function bam(m) {
      if (CT.daChe(shapes(), m)) { boDs(m); if (cuoi && cuoi.id === m.id) cuoi = null }
      else { themDs([m]); cuoi = m }
      opt.veLai()
      lamMoi()
      if (opt.log) opt.log('che bam ' + m.id + ' "' + m.text.slice(0, 20) + '" -> ' + (CT.daChe(shapes(), m) ? 'che' : 'bo'))
    }

    function doiKieu(k) { kieu = k; cuoi = null; veHop() }

    function moTa(dem) {
      const ten = { email: 'che.loai.email', dienthoai: 'che.loai.dienthoai', the: 'che.loai.the', link: 'che.loai.link' }
      return Object.keys(dem).map((k) => t(ten[k]) + ': ' + dem[k]).join(' · ')
    }

    function tuChe() {
      if (!auto.length) { trangThai('khong-thay', t('che.khongThay')); return }
      const dem = {}
      const moi = []
      for (const m of auto) {
        if (!CT.daChe(shapes(), m)) moi.push(m)
        dem[m.loai] = (dem[m.loai] || 0) + 1
        cuoi = m
      }
      themDs(moi)
      opt.veLai()
      lamMoi()
      trangThai('da-tu-che', t('che.daChe').replace('{n}', String(auto.length)).replace('{ds}', moTa(dem)))
      if (opt.log) opt.log('che tu-che ' + auto.length + ' muc: ' + moTa(dem))
    }

    function cheTrung() {
      if (!cuoi || !CT.daChe(shapes(), cuoi)) return
      const pool = auto.concat(kieu === 'tu' ? tuList : dongList)
      const moi = []
      for (const m of CT.mucTrung(cuoi, pool)) {
        if (m.id === cuoi.id || CT.daChe(shapes(), m)) continue
        // muc nam chong len muc da them trong CUNG luot (tu "an@x.com" va email an@x.com) thi khong che hai lan
        if (moi.some((q) => q.phu.some((k) => m.phu.indexOf(k) >= 0))) continue
        moi.push(m)
      }
      const them = moi.length
      themDs(moi)
      opt.veLai()
      lamMoi()
      trangThai('da-che-trung', them ? t('che.daTrung').replace('{n}', String(them)) : t('che.khongTrung'))
      if (opt.log) opt.log('che trung them ' + them)
    }

    async function mo() {
      dung()
      const l = ++luot
      dangMo = true; cuoi = null; tuList = []; dongList = []; auto = []; hop = []
      lop.textContent = ''
      lop.hidden = false; strip.hidden = false
      strip.dataset.soMuc = '0'; strip.dataset.daChe = String(shapes().filter(CT.laShapeChe).length)
      nutTuChe.disabled = true; nutTrung.disabled = true
      if (opt.nut) opt.nut.classList.add('chon')
      datViTri()
      trangThai('dang-doc', t('che.dangDoc'))
      let kq
      try { kq = await opt.doc() } catch (e) { kq = { ok: false, loi: e.message } }
      if (l !== luot || !dangMo) return
      if (!kq || !kq.ok) { if (opt.log) opt.log('che doc LOI: ' + (kq && kq.loi)); trangThai('loi', t('che.loi')); return }
      tuList = CT.cacTu(kq.dong); dongList = CT.cacDong(kq.dong); auto = CT.timMuc(kq.dong)
      strip.dataset.soMuc = String(auto.length)
      strip.dataset.soTu = String(tuList.length)
      if (!tuList.length) { trangThai('khong-chu', t('che.khongChu')); return }
      nutTuChe.disabled = false
      veHop()
      const dem = {}
      for (const m of auto) dem[m.loai] = (dem[m.loai] || 0) + 1
      trangThai('san-sang', auto.length ? t('che.thay').replace('{n}', String(auto.length)).replace('{ds}', moTa(dem)) : t('che.huongDan'))
      datViTri()
      if (opt.log) opt.log('che doc xong: ' + tuList.length + ' tu, ' + dongList.length + ' dong, ' + auto.length + ' muc nhay cam')
    }

    function dong() {
      luot++
      dangMo = false
      if (lop) { lop.hidden = true; lop.textContent = '' }
      if (strip) strip.hidden = true
      hop = []
      if (opt.nut) opt.nut.classList.remove('chon')
    }

    /* Phim khi dang mo: Esc chi dong che do che (khong huy ca man chup). Tra true neu da xu ly. */
    function xuLyPhim(e) {
      if (!dangMo) return false
      if (e.key === 'Escape') { e.preventDefault(); dong(); return true }
      return false
    }

    return { mo, dong, lamMoi, xuLyPhim, datViTri, dangMo: () => dangMo, doiKieu }
  }

  /* Menu xo (re chuot vao nut thi xo menu doc) - cung kieu menu but 7/8: nut chinh + .menu-xo. */
  function ganMenuXo(o) {
    let hen = 0
    const dong = () => { clearTimeout(hen); if (!o.menu.hidden) o.menu.hidden = true }
    const mo = () => { clearTimeout(hen); if (!o.menu.hidden) return; if (o.dongKhac) o.dongKhac(); o.menu.hidden = false; o.xep(o.chinh, o.menu) }
    o.nhom.addEventListener('mouseenter', mo)
    o.nhom.addEventListener('mouseleave', () => { clearTimeout(hen); hen = setTimeout(dong, 160) })
    window.addEventListener('mousedown', (e) => { if (!o.menu.hidden && !o.nhom.contains(e.target)) dong() }, true)
    return { dong, mo, dangMo: () => !o.menu.hidden }
  }

  window.CheTMUI = { tao, ganMenuXo }
})()
