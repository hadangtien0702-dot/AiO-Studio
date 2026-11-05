'use strict'

/* =========================================================================
   AiO Shot & Save — TIM LAI ANH CU (05/11/2026, ROADMAP 0d "Tim lai y tuong")
   Anh Tien: anh chup da hang tram tam, "y tuong hay roi di dau mat". Cua so rieng mo tu menu khay he thong:
   o tim + luoi anh, go chu thi ra anh co chu do (chu doc DUOC TRONG ANH bang src/ocr.js), loc theo ngay va loai
   (anh / video / dai Storyboard), bam mot anh = ghim, nut "Mo thu muc", keo ra app khac nhu khay.

   Co 2 phan:
   (1) taoChiMuc(): chi muc chu — KHONG phu thuoc Electron, do duoc bang node thuan.
       - Luu o userData/tim-anh/chi-muc.json. KHONG ghi gi vao thu muc anh cua nguoi dung.
       - Quet thu muc theo thoi gian (readdir + stat): file moi -> them vao hang doi doc chu; file doi gio sua/dung luong
         -> doc lai; file bi xoa -> BIEN KHOI chi muc. KHONG gan vao shelfAdd / handleConfirm (luat 05/11).
       - Doc chu NEN, TUNG ANH MOT, MOI NHAT TRUOC. Nghi giua 2 anh bang ~1 lan thoi gian doc (toi da ~50% mot nhan CPU,
         duoi tran 70% cua CLAUDE.md muc 4c), dung han khi dangBan() (dang chup / dang quay Storyboard).
       - Tim: bo dau tieng Viet + khong phan biet hoa thuong; moi tu go vao phai co trong chu cua anh (AND).
   (2) dangKy(ctx): cua so + IPC + thumbnail (can Electron).
   ========================================================================= */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DUOI_ANH = /\.(png|jpe?g|gif)$/i
const DUOI_VIDEO = /\.(mp4|webm|mov|m4v)$/i
const TIEN_TO_DAI = 'shotandsave-storyboard-'
const TUOI_TOI_THIEU_MS = 3000 // file vua ghi < 3 s: de yen, tranh doc nua chung
const TRAN_DIEM_ANH = 3.5e6    // thu nho ve <= 3,5 trieu diem truoc khi doc chu (Tesseract ti le theo so diem)
const GIOI_HAN_KQ = 600
const DAU_PHU = /[̀-ͯ]/g

/* ---- Chuan hoa chu: bo dau + thuong hoa, MOI KY TU -> DUNG 1 KY TU (de vi tri trong ban chuan hoa trung vi tri trong
   ban goc, dung cat doan trich). ---- */
const nhoKyTu = new Map()
function chuanHoaKyTu(c) {
  let r = nhoKyTu.get(c)
  if (r !== undefined) return r
  r = c.toLowerCase().normalize('NFD').replace(DAU_PHU, '')
  r = r.length ? r[0] : ' '
  if (r === 'đ') r = 'd' // d gach
  if (/\s/.test(r)) r = ' '
  if (nhoKyTu.size < 5000) nhoKyTu.set(c, r)
  return r
}
function chuanHoa(s) {
  s = String(s == null ? '' : s)
  let o = ''
  for (let i = 0; i < s.length; i++) o += chuanHoaKyTu(s[i])
  return o
}
function tachTu(q) { return chuanHoa(q).split(' ').filter(Boolean) }

function loaiCuaFile(ten) {
  if (DUOI_VIDEO.test(ten) || ten.startsWith('shotandsave-video-')) return 'video' // gom ca GIF xuat tu video (shotandsave-video-*.gif)
  if (ten.startsWith(TIEN_TO_DAI)) return 'dai'
  return 'anh'
}

/* opts: { thuMucDuLieu, layThuMucAnh: () => dir, docAnh: async (file, loai) => { ok, chu?, loi? }, dangBan?: () => bool,
           ghiLog?, nghiHeSo? (mac dinh 1), nghiToiThieuMs? (mac dinh 250), tienDo?: (trangThai) => void,
           docTamDung?: () => bool, luuTamDung?: (bool) => void } */
function taoChiMuc(opts) {
  const log = opts.ghiLog || (() => {})
  const dangBan = opts.dangBan || (() => false)
  const heSo = opts.nghiHeSo == null ? 1 : opts.nghiHeSo
  const nghiMin = opts.nghiToiThieuMs == null ? 250 : opts.nghiToiThieuMs
  const fileChiMuc = path.join(opts.thuMucDuLieu, 'chi-muc.json')

  let goc = ''                     // thu muc anh dang theo doi
  const muc = new Map()            // duong -> { ten, mt, kt, loai, da, chu, n, thu, sauLuc, loi }
  let bẩn = false
  let henLuu = null
  let tamDungTay = opts.docTamDung ? !!opts.docTamDung() : false
  let dangVong = false
  let dung = false
  let hen = null
  const thongKe = { daDoc: 0, tongMs: 0, loi: 0 }
  let lanTienDo = 0

  function nap() {
    try {
      const j = JSON.parse(fs.readFileSync(fileChiMuc, 'utf8'))
      if (!j || j.v !== 1 || !Array.isArray(j.muc)) return
      goc = j.goc || ''
      for (const r of j.muc) {
        if (!r || !r.d) continue
        const duong = path.join(goc, r.d)
        muc.set(duong, { ten: r.d, mt: r.mt, kt: r.kt, loai: loaiCuaFile(r.d), da: !!r.da, chu: r.chu || '', n: chuanHoa(r.chu || ''), thu: r.thu || 0, sauLuc: 0, loi: r.loi || '' })
      }
    } catch (e) { /* chua co / hong: bat dau lai tu dau */ }
  }

  function luu() {
    clearTimeout(henLuu); henLuu = null
    if (!bẩn) return
    try {
      fs.mkdirSync(opts.thuMucDuLieu, { recursive: true })
      const ds = []
      for (const m of muc.values()) ds.push({ d: m.ten, mt: m.mt, kt: m.kt, da: m.da ? 1 : 0, chu: m.chu, thu: m.thu || undefined, loi: m.loi || undefined })
      const tam = fileChiMuc + '.tmp'
      fs.writeFileSync(tam, JSON.stringify({ v: 1, goc, muc: ds }))
      fs.renameSync(tam, fileChiMuc)
      bẩn = false
    } catch (e) { log('tim-anh luu chi muc LOI: ' + e.message) }
  }
  function luuSau() {
    bẩn = true
    if (henLuu) return
    henLuu = setTimeout(luu, 4000)
    if (henLuu.unref) henLuu.unref()
  }

  /* Quet thu muc anh. Tra ve { them, doiLai, bo, ms }. */
  function quet() {
    const t0 = Date.now()
    const dir = opts.layThuMucAnh()
    let them = 0, doiLai = 0, bo = 0
    if (dir !== goc) { // doi thu muc anh: chi muc cu khong con dung
      if (muc.size) { muc.clear(); bẩn = true }
      goc = dir
    }
    let files = []
    try { files = fs.readdirSync(dir) } catch (e) { files = [] }
    const thay = new Set()
    for (const f of files) {
      if (f.startsWith('.')) continue
      if (!DUOI_ANH.test(f) && !DUOI_VIDEO.test(f)) continue
      const full = path.join(dir, f)
      let st
      try { st = fs.statSync(full) } catch (e) { continue }
      if (!st.isFile()) continue
      thay.add(full)
      const mt = Math.round(st.mtimeMs)
      const m = muc.get(full)
      if (!m) {
        muc.set(full, { ten: f, mt, kt: st.size, loai: loaiCuaFile(f), da: false, chu: '', n: '', thu: 0, sauLuc: 0, loi: '' })
        them++
      } else if (m.mt !== mt || m.kt !== st.size) {
        m.mt = mt; m.kt = st.size; m.da = false; m.chu = ''; m.n = ''; m.thu = 0; m.sauLuc = 0; m.loi = ''
        doiLai++
      }
    }
    for (const k of Array.from(muc.keys())) if (!thay.has(k)) { muc.delete(k); bo++ }
    if (them || doiLai || bo) luuSau()
    return { them, doiLai, bo, ms: Date.now() - t0 }
  }

  function trangThai() {
    let tong = 0, da = 0
    for (const m of muc.values()) { tong++; if (m.da) da++ }
    return { tong, daDoc: da, choDoc: tong - da, tamDung: tamDungTay, dangDoc: dangVong, dangBan: dangBan() }
  }
  function baoTienDo(ep) {
    if (!opts.tienDo) return
    const now = Date.now()
    if (!ep && now - lanTienDo < 700) return
    lanTienDo = now
    try { opts.tienDo(trangThai()) } catch (e) {}
  }

  const ngu = (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (t.unref) t.unref() })

  function chonTiep() {
    const now = Date.now()
    let tot = null
    for (const m of muc.values()) {
      if (m.da || m.sauLuc > now || now - m.mt < TUOI_TOI_THIEU_MS) continue
      if (!tot || m.mt > tot.mt) tot = m // moi nhat truoc
    }
    return tot
  }

  /* Vong doc nen. Goi nhieu lan an toan (chay dung 1 vong). */
  async function vong() {
    if (dangVong) return
    dangVong = true
    baoTienDo(true)
    try {
      while (!dung && !tamDungTay) {
        if (dangBan()) { await ngu(800); continue }
        const m = chonTiep()
        if (!m) break
        const duong = path.join(goc, m.ten)
        if (m.loai === 'video') { m.da = true; m.chu = ''; m.n = ''; luuSau(); continue } // video: chua doc chu (chi loc theo ngay / loai)
        const t0 = Date.now(), mt0 = m.mt, kt0 = m.kt
        let kq
        try { kq = await opts.docAnh(duong, m.loai) } catch (e) { kq = { ok: false, loi: e.message } }
        const ms = Date.now() - t0
        if (dung) break
        if (!muc.has(duong)) continue // bi xoa luc dang doc
        if (m.mt !== mt0 || m.kt !== kt0) continue // file doi luc dang doc: chu vua doc la cua ban cu, de luot sau doc lai
        if (kq && kq.ok) {
          m.da = true; m.chu = String(kq.chu || '').replace(/\s+/g, ' ').trim(); m.n = chuanHoa(m.chu); m.loi = ''
          thongKe.daDoc++; thongKe.tongMs += ms
        } else {
          m.thu++
          m.loi = (kq && kq.loi) || 'loi la'
          thongKe.loi++
          if (m.thu >= 2) m.da = true; else m.sauLuc = Date.now() + 60000
          log('tim-anh doc chu LOI ' + m.ten + ': ' + m.loi)
        }
        luuSau()
        baoTienDo(false)
        await ngu(Math.max(nghiMin, ms * heSo))
      }
    } finally {
      dangVong = false
      baoTienDo(true)
    }
  }

  function batDau() {
    quet()
    vong()
    if (!hen) {
      hen = setInterval(() => { quet(); if (!tamDungTay) vong() }, 60000)
      if (hen.unref) hen.unref()
    }
  }

  function datTamDung(b) {
    tamDungTay = !!b
    if (opts.luuTamDung) { try { opts.luuTamDung(tamDungTay) } catch (e) {} }
    if (!tamDungTay) vong()
    baoTienDo(true)
  }

  /* ---- Tim ----
     q: { chu, tu?, den?, loai? ('tat-ca' | 'anh' | 'video' | 'dai'), gioiHan? } */
  function tim(q) {
    q = q || {}
    const t0 = Date.now()
    const tu = tachTu(q.chu)
    const loai = q.loai && q.loai !== 'tat-ca' ? q.loai : null
    const gioiHan = q.gioiHan || GIOI_HAN_KQ
    const ok = []
    for (const m of muc.values()) {
      if (loai && m.loai !== loai) continue
      if (q.tu != null && m.mt < q.tu) continue
      if (q.den != null && m.mt > q.den) continue
      let diem = 0
      if (tu.length) {
        if (!m.n) continue
        let het = true
        for (const t of tu) {
          const i = m.n.indexOf(t)
          if (i < 0) { het = false; break }
          // nguyen tu (dung ranh gioi tu) cao diem hon khop mot phan
          diem += (i === 0 || m.n[i - 1] === ' ') ? 2 : 1
        }
        if (!het) continue
      }
      ok.push({ m, diem })
    }
    ok.sort((a, b) => b.diem - a.diem || b.m.mt - a.m.mt)
    const ds = []
    let bo = 0, i = 0
    for (; i < ok.length && ds.length < gioiHan; i++) {
      const m = ok[i].m
      const duong = path.join(goc, m.ten)
      if (!fs.existsSync(duong)) { muc.delete(duong); bo++; continue } // anh bi xoa: bien khoi ket qua + chi muc
      let doan = null
      if (tu.length && m.chu) {
        const j = m.n.indexOf(tu[0])
        if (j >= 0) {
          const a = Math.max(0, j - 28), b = Math.min(m.chu.length, j + tu[0].length + 56)
          doan = [(a > 0 ? '...' : '') + m.chu.slice(a, j), m.chu.slice(j, j + tu[0].length), m.chu.slice(j + tu[0].length, b) + (b < m.chu.length ? '...' : '')]
        }
      }
      ds.push({ duong, ten: m.ten, mt: m.mt, loai: m.loai, daDoc: m.da, doan })
    }
    if (bo) luuSau()
    return { ds, tong: ok.length - bo, ms: Date.now() - t0, daCat: i < ok.length }
  }

  function lay(duong) { return muc.get(duong) || null }

  function dungHet() {
    dung = true
    clearInterval(hen); hen = null
    luu()
  }

  function demChu() { let n = 0; for (const m of muc.values()) n += (m.chu || '').length; return n }

  nap()
  return { quet, batDau, vong, tim, lay, luu, trangThai, datTamDung, dungHet, thongKe, demChu,
    _muc: muc, _fileChiMuc: fileChiMuc, goc: () => goc }
}

/* =========================================================================
   (2) CUA SO + IPC (can Electron)
   ctx: { app, ipcMain, BrowserWindow, screen, shell, nativeImage, ocr, daoNeuNenToi, createPinWindow(image,x,y,w,h,file),
          dangBan(), ghiLog, kho: { thuMucAnh, duongDanKeoAnToan, docCauHinh, ghiCauHinh }, thuMucDuLieu,
          batDauKeo?(sender, {file, icon}), anCuaSo? }
   ========================================================================= */
function dangKy(ctx) {
  const { ipcMain, BrowserWindow, screen, nativeImage } = ctx
  const log = ctx.ghiLog || (() => {})
  const thuMucDL = ctx.thuMucDuLieu
  const thuMucThumb = path.join(thuMucDL, 'thumb')
  let win = null

  async function docAnhThat(file) {
    let img = nativeImage.createFromPath(file)
    if (img.isEmpty()) return { ok: false, loi: 'khong mo duoc anh' }
    const s = img.getSize()
    const k = Math.min(1, Math.sqrt(TRAN_DIEM_ANH / Math.max(1, s.width * s.height)))
    if (k < 1) img = img.resize({ width: Math.max(1, Math.round(s.width * k)), height: Math.max(1, Math.round(s.height * k)), quality: 'good' })
    const cach = process.platform === 'win32' ? 'tesseract' : 'he-thong' // y het overlay:ocr
    if (cach === 'tesseract' && ctx.daoNeuNenToi) img = ctx.daoNeuNenToi(img).img
    const kq = await ctx.ocr.docChu(img.toPNG(), cach)
    return kq.ok ? { ok: true, chu: (kq.dong || []).join(' ') } : { ok: false, loi: kq.loi || 'doc chu loi' }
  }

  const chiMuc = taoChiMuc({
    thuMucDuLieu: thuMucDL,
    layThuMucAnh: () => ctx.kho.thuMucAnh(),
    docAnh: ctx.docAnh || docAnhThat,
    dangBan: ctx.dangBan,
    ghiLog: log,
    nghiHeSo: ctx.nghiHeSo,
    nghiToiThieuMs: ctx.nghiToiThieuMs,
    docTamDung: () => !!ctx.kho.docCauHinh().timAnhTamDung,
    luuTamDung: (b) => ctx.kho.ghiCauHinh({ timAnhTamDung: b }),
    tienDo: (st) => { if (win && !win.isDestroyed()) win.webContents.send('tim-anh:tien-do', st) },
  })

  /* ---- Thumbnail: ban dung san trong userData/tim-anh/thumb (khong dung vao thu muc anh) ---- */
  function khoaThumb(duong, m) {
    return crypto.createHash('sha1').update(duong + '|' + m.mt + '|' + m.kt).digest('hex').slice(0, 24)
  }
  let dangLamThumb = 0
  const hangThumb = []
  function chayThumb() {
    while (dangLamThumb < 3 && hangThumb.length) {
      const viec = hangThumb.shift()
      dangLamThumb++
      viec().finally(() => { dangLamThumb--; chayThumb() })
    }
  }
  function layThumb(duong) {
    return new Promise((res) => {
      hangThumb.push(async () => {
        try { res(await lamThumb(duong)) } catch (e) { res(null) }
      })
      chayThumb()
    })
  }
  async function lamThumb(duong) {
    const m = chiMuc.lay(duong)
    if (!m) return null
    const f = path.join(thuMucThumb, khoaThumb(duong, m) + '.jpg')
    try { return fs.readFileSync(f) } catch (e) {}
    while (ctx.dangBan && ctx.dangBan()) await new Promise((r) => setTimeout(r, 500)) // dang chup: nhuong
    let img = null
    try { img = await nativeImage.createThumbnailFromPath(duong, { width: 360, height: 240 }) } catch (e) { img = null }
    if (!img || img.isEmpty()) {
      if (m.loai === 'video') return null
      const g = nativeImage.createFromPath(duong)
      if (g.isEmpty()) return null
      img = g.resize({ height: 240, quality: 'good' })
    }
    const buf = img.toJPEG(78)
    try { fs.mkdirSync(thuMucThumb, { recursive: true }); fs.writeFileSync(f, buf) } catch (e) {}
    return buf
  }
  let lanDonThumb = 0
  function donThumbMoCoi() { // thumbnail cua anh da xoa / da doi: bo (toi da 10 phut / lan)
    const now = Date.now()
    if (now - lanDonThumb < 600000) return
    lanDonThumb = now
    try {
      const dung = new Set()
      for (const [d, m] of chiMuc._muc) dung.add(khoaThumb(d, m) + '.jpg')
      for (const f of fs.readdirSync(thuMucThumb)) if (/^[0-9a-f]{24}\.jpg$/.test(f) && !dung.has(f)) { try { fs.unlinkSync(path.join(thuMucThumb, f)) } catch (e) {} }
    } catch (e) {}
  }

  /* ---- Cua so ---- */
  let lanLamMoi = 0
  function moCuaSo(o) {
    o = o || {}
    chiMuc.quet()
    if (!o.khongDoc) chiMuc.vong()
    donThumbMoCoi()
    if (win && !win.isDestroyed()) {
      if (!o.an) { win.show(); win.focus() }
      win.webContents.send('tim-anh:lam-moi')
      return win
    }
    const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    const wa = d.workArea
    const w = Math.min(1100, Math.round(wa.width * 0.88))
    const h = Math.min(760, Math.round(wa.height * 0.86))
    win = new BrowserWindow({
      x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2),
      width: w, height: h, minWidth: 640, minHeight: 460,
      frame: false, show: false,
      title: 'AiO Shot & Save - ' + (ctx.tieuDe || 'Find past shots'),
      backgroundColor: '#181818',
      icon: path.join(__dirname, '..', 'assets', 'app.ico'),
      webPreferences: { preload: path.join(__dirname, 'preload-tim-anh.js'), contextIsolation: true, sandbox: false },
    })
    win.loadFile(path.join(__dirname, 'tim-anh', 'index.html'))
    win.once('ready-to-show', () => { if (!o.an) win.show() })
    win.on('focus', () => {
      const now = Date.now()
      if (now - lanLamMoi < 3000) return
      lanLamMoi = now
      chiMuc.quet()
      if (win && !win.isDestroyed()) win.webContents.send('tim-anh:lam-moi')
    })
    win.on('closed', () => { win = null })
    return win
  }

  let cascade = 0
  const ghimDuoc = (duong) => { const m = chiMuc.lay(duong); return m && m.loai !== 'video' ? m : null }
  ipcMain.handle('tim-anh:tim', (_e, q) => {
    const kq = chiMuc.tim(q)
    kq.trangThai = chiMuc.trangThai()
    return kq
  })
  ipcMain.handle('tim-anh:thumb', async (_e, duong) => {
    const b = await layThumb(duong)
    return b ? new Uint8Array(b) : null
  })
  ipcMain.handle('tim-anh:trang-thai', () => chiMuc.trangThai())
  ipcMain.handle('tim-anh:tam-dung', (_e, b) => { chiMuc.datTamDung(b); return chiMuc.trangThai() })
  ipcMain.handle('tim-anh:lam-moi', () => { chiMuc.quet(); chiMuc.vong(); return chiMuc.trangThai() })
  ipcMain.on('tim-anh:ghim', (_e, duong) => {
    if (!ghimDuoc(duong) || !fs.existsSync(duong)) return
    const img = nativeImage.createFromPath(duong)
    if (img.isEmpty()) return
    const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    const sc = d.scaleFactor || 1
    const size = img.getSize()
    let dipW = Math.round(size.width / sc), dipH = Math.round(size.height / sc)
    const k = Math.min(1, (d.workArea.width * 0.9) / dipW, (d.workArea.height * 0.9) / dipH) // anh lon hon man: vua man
    if (k < 1) { dipW = Math.round(dipW * k); dipH = Math.round(dipH * k) }
    const off = (cascade++ % 6) * 24
    const x = d.workArea.x + Math.round((d.workArea.width - dipW) / 2) + off
    const y = d.workArea.y + Math.round((d.workArea.height - dipH) / 2) + off
    ctx.createPinWindow(img, x, y, dipW, dipH, duong)
  })
  ipcMain.on('tim-anh:mo-thu-muc', (_e, duong) => {
    if (!chiMuc.lay(duong)) return
    ctx.shell.showItemInFolder(duong)
  })
  ipcMain.on('tim-anh:keo', async (e, duong) => {
    const m = chiMuc.lay(duong)
    if (!m || !fs.existsSync(duong)) return
    try {
      let icon = null
      const tb = await layThumb(duong)
      if (tb) icon = nativeImage.createFromBuffer(Buffer.from(tb)).resize({ height: 96 })
      if (!icon || icon.isEmpty()) icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray.png'))
      const file = ctx.kho.duongDanKeoAnToan(duong)
      if (ctx.batDauKeo) ctx.batDauKeo(e.sender, { file, icon })
      else e.sender.startDrag({ file, icon })
    } catch (err) { log('tim-anh keo LOI: ' + err.message) }
  })
  ipcMain.on('tim-anh:close', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (w) w.close()
  })

  return { moCuaSo, batDau: () => chiMuc.batDau(), luuVaDung: () => chiMuc.dungHet(), chiMuc, layThumb, cuaSo: () => win }
}

module.exports = { taoChiMuc, dangKy, chuanHoa, tachTu, loaiCuaFile }
