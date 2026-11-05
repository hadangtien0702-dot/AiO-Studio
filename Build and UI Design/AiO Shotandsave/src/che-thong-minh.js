'use strict'

/* CHE THONG MINH (05/11/2026) - phan THUAN (khong DOM, khong electron): tim cho nhay cam trong chu da doc, doi toa do,
   dung shape che. Nap duoc ca o renderer (<script>, window.CheTM) lan o main / bai do (require).

   DU LIEU VAO: dong = [{ text, x0, y0, x1, y1, tu: [{ t, x0, y0, x1, y1, conf }] }]  (toa do PIXEL THIET BI cua vung doc,
   lay tu Tesseract qua src/ocr.js docChuTu - KHONG co bo doc moi).

   ☠️ CHON TO KIN, KHONG DUNG KHAM (so lo 27/09, AGENTS.md muc 4): khoi kham 8-15 px con KHOI PHUC duoc chu. Shape che nay
   la blurType 'kin': den #000 DUC 100% phu kin hop chu + le (ngang >= 5 px va 40% chieu cao chu, doc >= 4 px va 30%) -> pixel xuat ra khong con
   thong tin gi cua chu goc. Di qua DUNG duong shape 'blur' co san (them/xoa/hoan tac/keo/xuat anh nhu cac nhat lam mo khac). */

;(function (goc, tao) {
  const m = tao()
  if (typeof module === 'object' && module.exports) module.exports = m
  else goc.CheTM = m
})(typeof self !== 'undefined' ? self : this, function () {
  const MAU_KIN = '#000000'

  /* ── Nhan dien ──────────────────────────────────────────────────────── */
  const RE_EMAIL = /[A-Za-z0-9][A-Za-z0-9._%+\-]*@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}/g
  const RE_LINK_RO = /(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi
  const RE_LINK_TRAN = /[A-Za-z0-9][A-Za-z0-9\-]*(?:\.[A-Za-z0-9\-]+)*\.(?:com|net|org|vn|io|app|dev|me|co|info|biz|edu|gov|ly|xyz)(?:\/[^\s<>"')\]]*)?/gi
  // chuoi chu so co the la dien thoai / the: bat dau bang so hoac +, ( ; chua so, khoang trang, ( ) . -
  const RE_SO = /(?<![\w@./\-])(?:\+\s?)?\(?\d[\d\s().\-]{6,60}\d(?![\w@])/g

  function luhn(d) {
    let s = 0, dao = false
    for (let i = d.length - 1; i >= 0; i--) {
      let n = d.charCodeAt(i) - 48
      if (dao) { n *= 2; if (n > 9) n -= 9 }
      s += n; dao = !dao
    }
    return s % 10 === 0
  }

  /* Chuoi so -> 'the' | 'dienthoai' | null. Chu y KHONG bat: ngay (05/11/2026), gia (1.500.000), IP (192.168.1.1), ma don. */
  function phanLoaiSo(raw) {
    const s = String(raw).trim()
    const d = s.replace(/\D/g, '')
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(s)) return null // IPv4
    if (/^\d{1,3}(?:\.\d{3}){2,}$/.test(s)) return null  // 1.500.000 / 2.500.000.000
    if (/^\d{1,3}(?:,\d{3}){2,}$/.test(s)) return null
    // the: 13-19 chu so, hoac nhom 4-4-4-4 / amex 4-6-5
    if (d.length >= 13 && d.length <= 19 &&
        (luhn(d) || /^\d{4}(?:[\s\-]\d{4}){3}$/.test(s) || /^\d{4}[\s\-]\d{6}[\s\-]\d{5}$/.test(s))) return 'the'
    // Viet Nam: 0xxxxxxxxx (10), 0 + vung (11), +84 / 84 xxxxxxxxx
    if (/^0\d{9,10}$/.test(d)) return 'dienthoai'
    if (/^\+?\s?84\d{9,10}$/.test(s.replace(/[\s().\-]/g, '')) && (/^\+/.test(s) || d.length === 11)) return 'dienthoai'
    // My / Canada: (415) 555-0132, 415-555-0132, +1 415 555 0132 (phai co dau phan cach / ngoac / +, tranh so tran)
    const coPhanCach = /[\s().\-+]/.test(s)
    if (coPhanCach && /^1?[2-9]\d{2}[2-9]\d{6}$/.test(d) && (d.length === 10 || /^\+?\s?1/.test(s))) return 'dienthoai'
    // quoc te: +CC ... 8-15 chu so
    if (/^\+/.test(s) && d.length >= 9 && d.length <= 15) return 'dienthoai'
    return null
  }

  /* Chuoi 1 dong -> [{ loai, s, e }] (chi so ky tu). Thu tu uu tien: email, link, the, dien thoai; khong chong nhau. */
  function quetChuoi(str) {
    const kq = []
    const chiem = new Array(str.length).fill(false)
    const dat = (loai, s, e) => {
      for (let i = s; i < e; i++) if (chiem[i]) return false
      for (let i = s; i < e; i++) chiem[i] = true
      kq.push({ loai, s, e })
      return true
    }
    const cat = (s, e) => { // bo dau cau cuoi (. , ; : ! ? ) ]) khoi link
      while (e > s && /[.,;:!?)\]]/.test(str[e - 1])) e--
      return e
    }
    /* Chuoi so khong nhan duoc thi xet tung cum cach nhau boi khoang trang, gop dan tu cum dau toi khi ra mot so (so viet tach "0912 345 678"). */
    const tachCum = (s, e) => {
      const cum = []
      const re = /\S+/g
      let c
      const doan = str.slice(s, e)
      while ((c = re.exec(doan))) cum.push({ s: s + c.index, e: s + c.index + c[0].length })
      for (let i = 0; i < cum.length;) {
        let het = 0
        for (let j = i + 1; j <= Math.min(cum.length, i + 6); j++) {
          const loai = phanLoaiSo(str.slice(cum[i].s, cum[j - 1].e))
          if (loai) { dat(loai, cum[i].s, cum[j - 1].e); het = j; break }
        }
        i = het || i + 1
      }
    }
    let m
    RE_EMAIL.lastIndex = 0
    while ((m = RE_EMAIL.exec(str))) dat('email', m.index, cat(m.index, m.index + m[0].length))
    RE_LINK_RO.lastIndex = 0
    while ((m = RE_LINK_RO.exec(str))) dat('link', m.index, cat(m.index, m.index + m[0].length))
    RE_LINK_TRAN.lastIndex = 0
    while ((m = RE_LINK_TRAN.exec(str))) {
      if (m.index > 0 && str[m.index - 1] === '@') continue
      dat('link', m.index, cat(m.index, m.index + m[0].length))
    }
    RE_SO.lastIndex = 0
    while ((m = RE_SO.exec(str))) {
      const s = m.index
      const e = s + m[0].replace(/[\s.\-]+$/, '').length
      const loai = phanLoaiSo(str.slice(s, e))
      if (loai) dat(loai, s, e)
      else tachCum(s, e) // 05/11 soat: "0912345678 0987654321" dinh thanh mot chuoi 20 so, khong loai nao nhan
    }
    kq.sort((a, b) => a.s - b.s)
    return kq
  }

  /* Phan loai nguyen mot chuoi (dung cho bai do don vi): tra loai neu CA chuoi la mot muc nhay cam, khong thi null. */
  function phanLoaiChuoi(str) {
    const s = String(str).trim()
    const q = quetChuoi(s)
    return q.length === 1 && q[0].s === 0 && q[0].e === s.length ? q[0].loai : null
  }

  /* ── Khoa so sanh "trung" ─────────────────────────────────────────── */
  function chuanHoaTu(t) {
    return String(t).normalize('NFC').toLowerCase().replace(/^[\s.,;:!?()\[\]{}"'<>*]+|[\s.,;:!?()\[\]{}"'<>*]+$/g, '')
  }
  function khoaMuc(loai, s) {
    if (loai === 'dienthoai' || loai === 'the') return loai + ':' + String(s).replace(/\D/g, '')
    if (loai === 'link') return 'link:' + String(s).toLowerCase().replace(/\/+$/, '')
    return loai + ':' + String(s).toLowerCase()
  }

  /* ── Muc che ───────────────────────────────────────────────────────── */
  const hopTu = (ts) => ({
    x0: Math.min.apply(null, ts.map((t) => t.x0)), y0: Math.min.apply(null, ts.map((t) => t.y0)),
    x1: Math.max.apply(null, ts.map((t) => t.x1)), y1: Math.max.apply(null, ts.map((t) => t.y1)),
  })

  /* Tung TU: bam chu nao che chu do. Bo tu rong / do tin cay qua thap (rac cua anh do hoa). */
  function cacTu(dong) {
    const kq = []
    dong.forEach((d, li) => {
      ;(d.tu || []).forEach((w, wi) => {
        const t = String(w.t || '').trim()
        if (!t || (typeof w.conf === 'number' && w.conf < 10)) return
        kq.push({ id: 't' + li + '_' + wi, loai: 'tu', text: t, khoa: 'tu:' + chuanHoaTu(t), phu: [li + ':' + wi],
                  x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1 })
      })
    })
    return kq
  }

  /* Tung DONG: bam 1 lan che ca dong. */
  function cacDong(dong) {
    const kq = []
    dong.forEach((d, li) => {
      const ts = (d.tu || []).map((w, wi) => ({ w, wi })).filter((q) => String(q.w.t || '').trim())
      if (!ts.length) return
      const b = hopTu(ts.map((q) => q.w))
      kq.push({ id: 'd' + li, loai: 'dong', text: ts.map((q) => q.w.t).join(' '), khoa: 'dong:' + chuanHoaTu(ts.map((q) => q.w.t).join(' ')),
                phu: ts.map((q) => li + ':' + q.wi), x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })
    })
    return kq
  }

  /* Tim MUC NHAY CAM tren moi dong: email, link, so the, so dien thoai. Moi muc = mot hoac nhieu tu (hop hop nhat). */
  function timMuc(dong) {
    const kq = []
    let n = 0
    dong.forEach((d, li) => {
      const ws = (d.tu || []).map((w, wi) => ({ w, wi })).filter((q) => String(q.w.t || '').trim())
      if (!ws.length) return
      let chuoi = '', pos = []
      for (const q of ws) {
        if (chuoi) chuoi += ' '
        pos.push({ s: chuoi.length, e: chuoi.length + String(q.w.t).trim().length, q })
        chuoi += String(q.w.t).trim()
      }
      for (const x of quetChuoi(chuoi)) {
        const cham = pos.filter((p) => p.s < x.e && p.e > x.s)
        if (!cham.length) continue
        const b = hopTu(cham.map((p) => p.q.w))
        const text = chuoi.slice(x.s, x.e)
        kq.push({ id: 'a' + (n++), loai: x.loai, text, khoa: khoaMuc(x.loai, text), phu: cham.map((p) => li + ':' + p.q.wi),
                  x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })
      }
    })
    return kq
  }

  /* Cac muc co CUNG khoa voi muc `m` trong danh sach `ds` (ke ca chinh no). Tu thuong: trung chu da chuan hoa;
     email/link: trung chuoi; so: trung day chu so (0912 345 678 = 0912.345.678). */
  function mucTrung(m, ds) {
    const c = chuanHoaTu(m.text)
    return ds.filter((x) => x.khoa === m.khoa || chuanHoaTu(x.text) === c)
  }

  /* ── Shape che ────────────────────────────────────────────────────── */
  /* heSo = pixel thiet bi tren 1 DIP (overlay: DPR; ghim: anh that / kich thuoc hien thi). rong/cao = vung (pixel thiet bi). */
  function taoShape(m, heSo, rong, cao) {
    const h = Math.max(1, m.y1 - m.y0)
    // Le rong vi toa do OCR LECH that: do 05/11 man 150%, o chu so the bbox cua Tesseract cat mat ~5 px ben trai chu dau (le 3 px cu de lot net chu)
    const px = Math.max(5, Math.round(h * 0.4)), py = Math.max(4, Math.round(h * 0.3))
    const x0 = Math.max(0, m.x0 - px), y0 = Math.max(0, m.y0 - py)
    const x1 = Math.min(rong, m.x1 + px), y1 = Math.min(cao, m.y1 + py)
    return { type: 'blur', blurType: 'kin', che: true, muc: m.id, phu: m.phu.slice(), khoa: m.khoa, color: MAU_KIN,
             x1: x0 / heSo, y1: y0 / heSo, x2: x1 / heSo, y2: y1 / heSo }
  }

  const laShapeChe = (s) => !!(s && s.che)
  const phuBoi = (shapes, key) => shapes.filter((s) => laShapeChe(s) && s.phu.indexOf(key) >= 0)
  /* Muc `m` da duoc che chua: moi tu cua no deu nam trong it nhat 1 shape che. */
  const daChe = (shapes, m) => m.phu.every((k) => phuBoi(shapes, k).length > 0)
  /* Go MOI shape che dang phu bat ky tu nao cua `m` (in-place). Tra so shape da go. */
  function boChe(shapes, m) {
    let n = 0
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i]
      if (laShapeChe(s) && s.phu.some((k) => m.phu.indexOf(k) >= 0)) { shapes.splice(i, 1); n++ }
    }
    return n
  }

  return { MAU_KIN, quetChuoi, phanLoaiChuoi, phanLoaiSo, chuanHoaTu, khoaMuc, cacTu, cacDong, timMuc, mucTrung,
           taoShape, laShapeChe, phuBoi, daChe, boChe }
})
