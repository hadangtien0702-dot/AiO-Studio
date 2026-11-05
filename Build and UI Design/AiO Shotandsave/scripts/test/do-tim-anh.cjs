/* Do TIM LAI ANH CU (src/tim-anh.js, 05/11/2026). Chay: npm run test:timanh  (= electron scripts/test/do-tim-anh.cjs)
   AN HOAN TOAN: cua so show:false, thu muc anh + userData la thu muc TAM cua he thong, KHONG dung thu muc anh that.
   Anh thu tao bang canvas (chu tieng Viet co dau + tieng Anh, nen sang va nen toi), 200 anh + 12 dai Storyboard + 5 video gia.
   Do: tim ra dung anh · giay doc moi anh · ms tim trong chi muc · mo lai app chi muc con · anh bi xoa bien · anh moi tu vao chi muc
   (quet thu muc, khong gan vao luong chup) · tam dung khi dang chup · khong ghi vao thu muc anh · giao dien (go chu, loc, bam ghim,
   mo thu muc, keo) · uoc 778 anh. Co DOI CHUNG (chi muc rong phai TRUOT). Thoat != 0 neu co muc truot. */
const { app, BrowserWindow, nativeImage } = require('electron')
const fs = require('fs'), path = require('path'), os = require('os')

const ROOT = path.resolve(__dirname, '..', '..')
const TAM = path.join(os.tmpdir(), 'aio-do-tim-anh-' + process.pid)
const ANH = path.join(TAM, 'anh'), UD = path.join(TAM, 'userData')
fs.rmSync(TAM, { recursive: true, force: true }); fs.mkdirSync(ANH, { recursive: true }); fs.mkdirSync(UD, { recursive: true })
app.setPath('userData', UD)
app.on('window-all-closed', () => {})

const kq = []; let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? 'DAT   ' : 'TRUOT ') + ten + (ct ? ' · ' + ct : '')); if (!ok) dat = false; console.log(kq[kq.length - 1]) }
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))] }
async function cho(dk, ms, buoc) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await dk()) return true; await ngu(buoc || 100) } return false }

/* ---- Tu gia: tu khoa DUY NHAT moi anh (khong tu nao chua tu nao) ---- */
const HOA = ['b', 'c', 'd', 'đ', 'g', 'h', 'k', 'l', 'm', 'n', 'nh', 't', 'v', 'x']
const VAN = ['ạn', 'ốc', 'ềm', 'ữa', 'ặp', 'ỉnh', 'ướt', 'ấu', 'ẻo', 'ỳ', 'ơi', 'ắng', 'ọc', 'úm', 'ểu', 'ễn']
const AHEAD = ['bar', 'cor', 'dem', 'fil', 'gan', 'hol', 'jun', 'kep', 'lum', 'nov', 'pir', 'qua', 'ros', 'sed', 'tav', 'vel', 'wix', 'zor']
const ATAIL = ['ton', 'mex', 'dra', 'fix', 'lab', 'nor', 'pas', 'rix', 'sol', 'tek']
const { chuanHoa } = require(path.join(ROOT, 'src', 'tim-anh.js'))
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 }
function layTuDuyNhat(ds, soLuong, seed) {
  const r = rng(seed); const ra = []; const n = []
  const tho = ds.slice(); for (let i = tho.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [tho[i], tho[j]] = [tho[j], tho[i]] }
  for (const w of tho) {
    const k = chuanHoa(w)
    if (n.some((x) => x.includes(k) || k.includes(x))) continue
    n.push(k); ra.push(w); if (ra.length === soLuong) break
  }
  return ra
}
const dsVi = []; for (const a of HOA) for (const b of VAN) for (const c of ['b', 'm', 'l', 'k']) dsVi.push(a + b.slice(0, 1) + b.slice(1) + c + 'a'.repeat(0) + a + VAN[(a.length + b.length + c.length) % VAN.length].slice(0, 2))
const dsViDon = []; for (const a of HOA) for (const b of VAN) dsViDon.push(a + b)
const tuVi = []; { const t1 = layTuDuyNhat(dsViDon, 224, 7); for (let i = 0; i + 1 < t1.length; i += 2) tuVi.push(t1[i] + t1[i + 1]) }
const dsAnh = []; for (const a of AHEAD) for (const b of ATAIL) dsAnh.push(a + b)
const tuAnh = layTuDuyNhat(dsAnh, 110, 11)
const TU_VI = layTuDuyNhat(tuVi, 100, 3), TU_EN = tuAnh.slice(0, 100)

const SO_ANH = 200, SO_DAI = 12, SO_VIDEO = 5
const meta = [] // { ten, tu, ngonNgu, loai }

async function taoAnh() {
  const w = new BrowserWindow({ show: false, width: 1100, height: 700, webPreferences: { offscreen: false } })
  await w.loadURL('data:text/html,<meta charset=utf-8><body></body>')
  const lo = []
  for (let i = 0; i < SO_ANH + SO_DAI; i++) {
    const vi = i % 2 === 0
    const tu = vi ? TU_VI[(i / 2) % TU_VI.length | 0] : TU_EN[((i - 1) / 2) % TU_EN.length | 0]
    const dai = i >= SO_ANH
    lo.push({ i, tu, vi, toi: i % 3 === 0, dai })
  }
  for (let a = 0; a < lo.length; a += 20) {
    const url = await w.webContents.executeJavaScript(`(async (ds) => {
      const out = []
      for (const o of ds) {
        const c = document.createElement('canvas'); c.width = 1000; c.height = 560
        const x = c.getContext('2d')
        x.fillStyle = o.toi ? '#16181d' : '#f4f1ea'; x.fillRect(0, 0, 1000, 560)
        x.fillStyle = o.toi ? '#e9e9ee' : '#1b1b1f'
        x.font = '30px Arial'
        x.fillText(o.vi ? 'Ghi ch\\u00FA cu\\u1ED9c h\\u1ECDp kh\\u00E1ch h\\u00E0ng' : 'Meeting notes for the client', 50, 80)
        x.font = 'bold 64px Arial'
        x.fillText(o.tu, 50, 250)
        x.font = '30px Arial'
        x.fillText(o.vi ? 'B\\u00E1o gi\\u00E1 th\\u00E1ng m\\u01B0\\u1EDDi m\\u1ED9t, ch\\u1EDD x\\u00E1c nh\\u1EADn' : 'Quote for November, waiting for approval', 50, 380)
        x.fillText('#' + o.i, 50, 470)
        out.push(c.toDataURL('image/png'))
      }
      return out
    })(${JSON.stringify(lo.slice(a, a + 20))})`)
    url.forEach((d, k) => {
      const o = lo[a + k]
      const gio = Date.now() - (o.i % 40 + 1) * 86400000 - o.i * 61000 // trai 40 ngay
      const ten = o.dai ? `shotandsave-storyboard-${o.i}.png` : `shotandsave-t${String(o.i).padStart(3, '0')}.png`
      const f = path.join(ANH, ten)
      fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'))
      fs.utimesSync(f, new Date(gio), new Date(gio))
      meta.push({ ten, tu: o.tu, vi: o.vi, loai: o.dai ? 'dai' : 'anh', mt: gio })
    })
  }
  for (let v = 0; v < SO_VIDEO; v++) {
    const ten = `shotandsave-quay-${v}.mp4`; const f = path.join(ANH, ten); fs.writeFileSync(f, Buffer.from('khong-phai-video-that-' + v))
    const gio = Date.now() - (v + 1) * 5 * 86400000; fs.utimesSync(f, new Date(gio), new Date(gio))
    meta.push({ ten, tu: null, loai: 'video', mt: gio })
  }
  w.destroy()
}

function chupDanhSach(dir) { return fs.readdirSync(dir).sort().map((f) => { const s = fs.statSync(path.join(dir, f)); return f + '|' + s.size + '|' + Math.round(s.mtimeMs) }) }
// Ban sao daoNeuNenToi cua main.js (de bai do doc anh nen toi giong ban that)
function daoNeuNenToi(img) {
  const s = img.getSize(), b = img.toBitmap()
  let tong = 0, dem = 0
  for (let i = 0; i < b.length; i += 4 * 7) { tong += 0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2]; dem++ }
  if (!dem || tong / dem >= 128) return { img, dao: false }
  for (let i = 0; i < b.length; i += 4) { const y = 255 - Math.round(0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2]); b[i] = b[i + 1] = b[i + 2] = y }
  return { img: nativeImage.createFromBitmap(b, { width: s.width, height: s.height }), dao: true }
}

async function chinh() {
  const timAnh = require(path.join(ROOT, 'src', 'tim-anh.js'))
  const ocr = require(path.join(ROOT, 'src', 'ocr.js'))
  const { ipcMain, screen, shell } = require('electron')

  // ---------- A. tao anh ----------
  let t0 = Date.now()
  await taoAnh()
  const nAnh = meta.filter((m) => m.loai === 'anh').length
  console.log(`[A] tao ${meta.length} file (${nAnh} anh, ${SO_DAI} dai, ${SO_VIDEO} video) trong ${Date.now() - t0} ms; tu khoa: ${TU_VI.length} Viet + ${TU_EN.length} Anh`)
  kiem('A. 200 anh + 12 dai + 5 video, tu khoa duy nhat', nAnh === SO_ANH && TU_VI.length >= 100 && TU_EN.length >= 100)
  const truocTat = chupDanhSach(ANH)

  // ---------- B. ctx gia, dang ky that ----------
  const cfg = {}
  let dangBan = false
  const ghim = [], mo = [], keo = [], pinCtx = []
  const ctx = {
    app, ipcMain, BrowserWindow, screen, nativeImage, ocr, daoNeuNenToi,
    shell: { showItemInFolder: (p) => mo.push(p) },
    createPinWindow: (img, x, y, w, h, f) => pinCtx.push({ f, w, h }),
    batDauKeo: (_s, o) => keo.push(o.file),
    ghiLog: (s) => console.log('   [log] ' + s),
    thuMucDuLieu: path.join(UD, 'tim-anh'),
    dangBan: () => dangBan,
    nghiHeSo: 0, nghiToiThieuMs: 0, // do tho toc do doc; luat nghi kiem rieng o muc B2
    tieuDe: 'Tim lai anh cu',
    kho: { thuMucAnh: () => ANH, duongDanKeoAnToan: (p) => p, docCauHinh: () => cfg, ghiCauHinh: (p) => Object.assign(cfg, p) },
  }
  const tim = timAnh.dangKy(ctx)
  const cm = tim.chiMuc

  // B1. dang chup -> khong doc
  dangBan = true
  cm.batDau()
  await ngu(3500)
  let st = cm.trangThai()
  kiem('B1. dang chup (dangBan) thi KHONG doc chu ảnh nao trong 3,5 giay', st.daDoc === SO_VIDEO && st.tong === meta.length, `daDoc=${st.daDoc} (chi ${SO_VIDEO} video, khong can doc), tong=${st.tong}`)
  dangBan = false
  const tDoc0 = Date.now()
  const hetHan = Date.now() + 15 * 60 * 1000
  let lanIn = 0
  while (Date.now() < hetHan) {
    st = cm.trangThai(); if (st.choDoc === 0) break
    if (Date.now() - lanIn > 20000) { lanIn = Date.now(); console.log(`   doc chu ${st.daDoc}/${st.tong} sau ${Math.round((Date.now() - tDoc0) / 1000)} s`) }
    await ngu(500)
  }
  const tongDoc = Date.now() - tDoc0
  st = cm.trangThai()
  kiem('B2. doc chu xong het', st.choDoc === 0, `${st.daDoc}/${st.tong} trong ${Math.round(tongDoc / 1000)} s`)
  const nDoc = cm.thongKe.daDoc
  const msMoiAnh = cm.thongKe.tongMs / Math.max(1, nDoc)
  kiem('B3. so anh doc loi = 0', cm.thongKe.loi === 0, `loi=${cm.thongKe.loi}`)
  console.log(`   >>> THOI GIAN DOC: ${msMoiAnh.toFixed(0)} ms / anh (${nDoc} anh, 1000x560, trong luc may ban); ${(tongDoc / Math.max(1, nDoc)).toFixed(0)} ms / anh tinh ca cho`)

  // ---------- C. tim ra dung anh ----------
  const cacAnh = meta.filter((m) => m.loai === 'anh' || m.loai === 'dai')
  let tronVen = 0, dung = 0, dungKoDau = 0, dungTop3 = 0, tongKq = 0
  const msTim = []
  const sai = []
  for (const m of cacAnh) {
    const duong = path.join(ANH, m.ten)
    const a = cm.tim({ chu: m.tu }); msTim.push(a.ms)
    const co = a.ds.findIndex((r) => r.duong === duong)
    if (co >= 0) dung++; else sai.push(m.ten + ' (' + m.tu + ')')
    if (co >= 0 && co < 3) dungTop3++
    tongKq += a.ds.length
    const b = cm.tim({ chu: chuanHoa(m.tu) }); // go khong dau
    if (b.ds.some((r) => r.duong === duong)) dungKoDau++
    const c = cm.tim({ chu: m.tu.toUpperCase() })
    if (c.ds.some((r) => r.duong === duong)) tronVen++
  }
  const tl = (n) => (100 * n / cacAnh.length).toFixed(1) + '% (' + n + '/' + cacAnh.length + ')'
  kiem('C1. go tu khoa (co dau) -> anh dung co trong ket qua >= 95%', dung / cacAnh.length >= 0.95, tl(dung) + (sai.length ? ' sai: ' + sai.slice(0, 6).join(', ') : ''))
  kiem('C2. go KHONG dau van ra dung anh >= 95%', dungKoDau / cacAnh.length >= 0.95, tl(dungKoDau))
  kiem('C3. go CHU HOA van ra dung anh >= 95%', tronVen / cacAnh.length >= 0.95, tl(tronVen))
  kiem('C4. ket qua gon: trung binh <= 3 anh moi lan tim, anh dung nam top 3 >= 90%', tongKq / cacAnh.length <= 3 && dungTop3 / cacAnh.length >= 0.9, `TB ${(tongKq / cacAnh.length).toFixed(2)} ket qua; top3 ${tl(dungTop3)}`)
  console.log(`   >>> TIM TRONG CHI MUC (${meta.length} muc): p50 ${pct(msTim, 0.5)} ms, p95 ${pct(msTim, 0.95)} ms, max ${Math.max(...msTim)} ms (${msTim.length} lan tim)`)
  kiem('C5. tim trong chi muc p95 <= 50 ms', pct(msTim, 0.95) <= 50)
  const hai = cm.tim({ chu: meta[0].tu + ' ' + meta[2].tu })
  kiem('C6. hai tu thuoc HAI anh khac nhau -> 0 ket qua (phai khop ca hai)', hai.ds.length === 0)

  // ---------- D. doi chung ----------
  kiem('D1. tu khong co anh nao -> 0 ket qua', cm.tim({ chu: 'qzxwvutsr' }).ds.length === 0)
  // chi muc "mu": bo doc tra rong -> tim phai TRUOT (bai do biet bat loi)
  const udMu = path.join(TAM, 'ud-mu'); fs.mkdirSync(udMu)
  const cmMu = timAnh.taoChiMuc({ thuMucDuLieu: udMu, layThuMucAnh: () => ANH, docAnh: async () => ({ ok: true, chu: '' }), nghiHeSo: 0, nghiToiThieuMs: 0 })
  cmMu.batDau(); await cho(() => cmMu.trangThai().choDoc === 0, 60000, 100)
  let dungMu = 0; for (const m of cacAnh.slice(0, 50)) if (cmMu.tim({ chu: m.tu }).ds.some((r) => r.duong === path.join(ANH, m.ten))) dungMu++
  kiem('D2. DOI CHUNG: chi muc khong co chu -> tim ra 0/50 (bai do bat duoc chi muc hong)', dungMu === 0, `ra ${dungMu}/50`)
  cmMu.dungHet()

  // ---------- E. loc ----------
  const dem = (f) => meta.filter(f).length
  kiem('E1. loc loai: dai = ' + SO_DAI, cm.tim({ chu: '', loai: 'dai' }).tong === SO_DAI, 'ra ' + cm.tim({ chu: '', loai: 'dai' }).tong)
  kiem('E2. loc loai: video = ' + SO_VIDEO, cm.tim({ chu: '', loai: 'video' }).tong === SO_VIDEO)
  kiem('E3. loc loai: anh = ' + SO_ANH, cm.tim({ chu: '', loai: 'anh' }).tong === SO_ANH)
  const tu7 = Date.now() - 7 * 86400000
  const mong7 = dem((m) => m.mt >= tu7)
  kiem('E4. loc 7 ngay gan day khop so file that', cm.tim({ chu: '', tu: tu7 }).tong === mong7, `ra ${cm.tim({ chu: '', tu: tu7 }).tong}, mong ${mong7}`)
  const tuA = Date.now() - 20 * 86400000, denA = Date.now() - 10 * 86400000
  const mongKhoang = dem((m) => m.mt >= tuA && m.mt <= denA)
  kiem('E5. loc khoang ngay (tu - den) khop', cm.tim({ chu: '', tu: tuA, den: denA }).tong === mongKhoang, `ra ${cm.tim({ chu: '', tu: tuA, den: denA }).tong}, mong ${mongKhoang}`)
  const m1 = meta.find((m) => m.loai === 'anh' && m.mt >= tu7)
  kiem('E6. chu + loc ngay + loai ket hop: anh trong 7 ngay ra, ngoai khoang thi khong', cm.tim({ chu: m1.tu, tu: tu7, loai: 'anh' }).ds.some((r) => r.ten === m1.ten) && cm.tim({ chu: m1.tu, den: m1.mt - 86400000 }).ds.length === 0)

  // ---------- F. anh bi xoa ----------
  const xoa = meta.filter((m) => m.loai === 'anh').slice(10, 15)
  for (const m of xoa) fs.unlinkSync(path.join(ANH, m.ten))
  const conThay = xoa.filter((m) => cm.tim({ chu: m.tu }).ds.some((r) => r.ten === m.ten))
  kiem('F1. xoa 5 anh -> tim tu khoa cua chung KHONG con ra (ngay ca truoc khi quet lai)', conThay.length === 0, `con thay ${conThay.length}/5`)
  const q = cm.quet()
  kiem('F2. quet lai: bo 0 (da tu bo khi tim) hoac 5 khoi chi muc, tong muc giam dung 5', cm.trangThai().tong === meta.length - 5, `tong ${cm.trangThai().tong}, quet bo ${q.bo}, ${q.ms} ms`)

  // ---------- G. anh moi tu vao chi muc (quet theo thoi gian, khong hook luong chup) ----------
  const nguon = path.join(ANH, meta.find((m) => m.loai === 'anh' && m.vi).ten)
  const moi = path.join(ANH, 'shotandsave-moi-sau-khi-chay.png')
  const bytesMoi = nativeImage.createFromPath(nguon).toPNG()
  // doi chu: ve tay 1 anh co tu moi
  const wv = new BrowserWindow({ show: false, width: 800, height: 600 }); await wv.loadURL('data:text/html,<meta charset=utf-8><body></body>')
  const tuMoi = 'kornexta'
  const d = await wv.webContents.executeJavaScript(`(() => { const c = document.createElement('canvas'); c.width = 900; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,900,400); x.fillStyle = '#111'; x.font = 'bold 72px Arial'; x.fillText('${tuMoi} baogia', 40, 200); return c.toDataURL('image/png') })()`)
  wv.destroy()
  fs.writeFileSync(moi, Buffer.from(d.split(',')[1], 'base64'))
  const tM = Date.now()
  cm.quet(); cm.vong()
  const thay0 = cm.tim({ chu: tuMoi }).ds.length
  await ngu(1500) // file con < 3 s tuoi: de yen
  const daThay = await cho(() => { cm.quet(); cm.vong(); return cm.tim({ chu: tuMoi }).ds.some((r) => r.duong === moi) }, 30000, 500)
  kiem('G1. anh moi luu vao thu muc (khong qua shelfAdd) -> tu vao chi muc va tim ra', daThay && thay0 === 0, `sau ${Date.now() - tM} ms (gom ${'>'}3 s de yen cho file ghi xong)`)

  // ---------- H. mo lai app: chi muc con ----------
  cm.luu()
  const fileCm = path.join(UD, 'tim-anh', 'chi-muc.json')
  const kich = fs.statSync(fileCm).size
  let lanDoc = 0
  const cm2 = timAnh.taoChiMuc({ thuMucDuLieu: path.join(UD, 'tim-anh'), layThuMucAnh: () => ANH, docAnh: async () => { lanDoc++; return { ok: true, chu: '' } }, nghiHeSo: 0, nghiToiThieuMs: 0 })
  const tNap = Date.now(); cm2.quet(); const msNap = Date.now() - tNap
  const s2 = cm2.trangThai(), s1 = cm.trangThai()
  await cho(() => false, 800)
  cm2.vong(); await ngu(500)
  const m5 = meta.filter((m) => m.loai === 'anh')[30]
  kiem('H1. mo lai (chi muc nap tu dia): so muc va so muc DA DOC giong ban truoc', s2.tong === s1.tong && s2.daDoc === s1.daDoc, `${s2.daDoc}/${s2.tong} vs ${s1.daDoc}/${s1.tong}`)
  kiem('H2. mo lai: KHONG doc lai anh nao (0 lan goi bo doc chu)', lanDoc === 0, `${lanDoc} lan`)
  kiem('H3. mo lai: tim van ra dung anh', cm2.tim({ chu: m5.tu }).ds.some((r) => r.ten === m5.ten))
  console.log(`   chi-muc.json ${(kich / 1024).toFixed(0)} KB cho ${s1.tong} muc; nap + quet lai ${msNap} ms`)
  fs.writeFileSync(path.join(ANH, 'dung-doi-gio.txt'), 'x'); fs.unlinkSync(path.join(ANH, 'dung-doi-gio.txt'))
  // anh bi SUA (doi gio/dung luong) thi doc lai
  const suaF = path.join(ANH, meta.find((m) => m.loai === 'anh' && m.vi && !xoa.includes(m) && m !== m5).ten)
  const bSua = fs.readFileSync(suaF); fs.appendFileSync(suaF, Buffer.alloc(16))
  cm2.quet(); const choSau = cm2.trangThai().choDoc
  kiem('H4. anh bi sua (dung luong doi) -> chuyen ve cho doc lai', choSau === 1, `choDoc=${choSau}`)
  fs.writeFileSync(suaF, bSua)
  cm2.dungHet()

  // ---------- B2. nghi giua 2 anh theo luat (mac dinh) ----------
  const udN = path.join(TAM, 'ud-nghi'); fs.mkdirSync(udN)
  const dirN = path.join(TAM, 'anh-nghi'); fs.mkdirSync(dirN)
  for (const m of meta.filter((x) => x.loai === 'anh').slice(0, 4)) { fs.copyFileSync(path.join(ANH, m.ten), path.join(dirN, m.ten)); const o = new Date(Date.now() - 86400000); fs.utimesSync(path.join(dirN, m.ten), o, o) }
  const msDoc = []
  const cmN = timAnh.taoChiMuc({ thuMucDuLieu: udN, layThuMucAnh: () => dirN, docAnh: async (f) => { const a = Date.now(); const r = await ctx.docAnh_that(f); msDoc.push(Date.now() - a); return r }, nghiToiThieuMs: 250 })
  ctx.docAnh_that = async (f) => { // cung doc nhu ban that
    let img = nativeImage.createFromPath(f); img = daoNeuNenToi(img).img; const k = await ocr.docChu(img.toPNG(), process.platform === 'win32' ? 'tesseract' : 'he-thong'); return { ok: k.ok, chu: (k.dong || []).join(' ') }
  }
  const tN = Date.now(); cmN.batDau(); await cho(() => cmN.trangThai().choDoc === 0, 60000, 100)
  const tongN = Date.now() - tN
  const tongDocN = msDoc.reduce((a, b) => a + b, 0)
  kiem('B4. luat nghi: 4 anh mat nhieu hon tong thoi gian doc (nghi ~ bang thoi gian doc, toi thieu 250 ms) -> CPU nen <= ~50%', tongN >= tongDocN + 3 * 250 - 50, `tong ${tongN} ms, rieng doc ${tongDocN} ms, duty ${(100 * tongDocN / tongN).toFixed(0)}%`)
  cmN.dungHet()

  // ---------- J. uoc 778 anh ----------
  const dir778 = path.join(TAM, 'anh-778'); fs.mkdirSync(dir778)
  const mauPng = fs.readFileSync(path.join(ANH, meta.find((m) => m.loai === 'anh').ten))
  const udJ = path.join(TAM, 'ud-778'); fs.mkdirSync(udJ)
  const dsDoc = Array.from(cm._muc.values()).filter((m) => m.chu)
  const records = []
  for (let i = 0; i < 778; i++) {
    const ten = `shotandsave-778-${i}.png`; fs.writeFileSync(path.join(dir778, ten), mauPng.slice(0, 2000))
    const src = dsDoc[i % dsDoc.length]; const mt = Date.now() - 86400000 * (1 + (i % 60))
    fs.utimesSync(path.join(dir778, ten), new Date(mt), new Date(mt))
    records.push({ d: ten, mt: Math.round(fs.statSync(path.join(dir778, ten)).mtimeMs), kt: fs.statSync(path.join(dir778, ten)).size, da: 1, chu: src.chu })
  }
  fs.writeFileSync(path.join(udJ, 'chi-muc.json'), JSON.stringify({ v: 1, goc: dir778, muc: records }))
  const tn = Date.now()
  const cmJ = timAnh.taoChiMuc({ thuMucDuLieu: udJ, layThuMucAnh: () => dir778, docAnh: async () => ({ ok: true, chu: '' }) })
  const msNapJ = Date.now() - tn
  const qJ = cmJ.quet()
  const msJ = []; for (let i = 0; i < 300; i++) msJ.push(cmJ.tim({ chu: meta[i % 150].tu || 'a' }).ms)
  const msJ2 = []; for (let i = 0; i < 100; i++) msJ2.push(cmJ.tim({ chu: '' }).ms)
  const luuJ = (() => { cmJ.quet(); const a = Date.now(); fs.writeFileSync(path.join(udJ, 'x.tmp'), '1'); cmJ._muc.get(path.join(dir778, records[0].d)).chu += ' '; cmJ.luu(); return Date.now() - a })()
  kiem('J1. 778 muc: nap chi muc ' + msNapJ + ' ms, quet thu muc (778 stat) ' + qJ.ms + ' ms, tim p95 ' + pct(msJ, 0.95) + ' ms, liet ke tat ca p95 ' + pct(msJ2, 0.95) + ' ms', msNapJ < 300 && qJ.ms < 500 && pct(msJ, 0.95) < 50)
  const kichJ = fs.statSync(path.join(udJ, 'chi-muc.json')).size
  const moiAnhS = msDoc.length ? 0 : 0
  console.log(`   >>> UOC 778 ANH: doc chu lan dau = 778 x ${msMoiAnh.toFixed(0)} ms = ${(778 * msMoiAnh / 60000).toFixed(1)} phut CPU (1 luong), kem nghi theo luat (duty ~50%) ~ ${(778 * msMoiAnh * 2 / 60000).toFixed(1)} phut tren dong ho; anh chup that to hon (3,5 trieu diem tran) co the cham gap 2-4 lan. chi-muc.json ~ ${(kichJ / 1024).toFixed(0)} KB; quet ${qJ.ms} ms; tim ${pct(msJ, 0.95)} ms`)
  cmJ.dungHet()

  // ---------- K. giao dien ----------
  const win = tim.moCuaSo({ an: true, khongDoc: true })
  await new Promise((r) => win.webContents.once('did-finish-load', r))
  const ev = (code) => win.webContents.executeJavaScript(code)
  const gõ = async (s) => { await ev(`(() => { const o = document.getElementById('o-tim'); o.value = ${JSON.stringify(s)}; o.dispatchEvent(new Event('input', { bubbles: true })) })()`); await ngu(450) }
  kiem('K0. cua so an (show:false), khong hien len man hinh', !win.isVisible())
  await cho(async () => (await ev(`document.querySelectorAll('.the').length`)) > 0, 8000)
  const tong0 = await ev(`document.querySelectorAll('.the').length`)
  kiem('K1. mo cua so: liet ke anh (khong go gi)', tong0 > 100, 'the ' + tong0 + ', ' + (await ev(`document.getElementById('dem-kq').textContent`)))
  const mk = meta.filter((m) => m.loai === 'anh' && !xoa.includes(m))[41]
  await gõ(chuanHoa(mk.tu))
  const the1 = await ev(`Array.from(document.querySelectorAll('.the')).map((e) => e.dataset.duong)`)
  kiem('K2. go tu khoa vao o tim -> luoi con dung anh do', the1.includes(path.join(ANH, mk.ten)) && the1.length <= 3, 'the ' + the1.length)
  const hl = await ev(`(document.querySelector('.the mark') || {}).textContent || ''`)
  kiem('K3. doan chu khop duoc to sang (mark)', chuanHoa(hl).length > 2, '"' + hl + '"')
  const thumbOk = await cho(async () => (await ev(`(() => { const i = document.querySelector('.the img'); return !!(i && i.naturalWidth > 0) })()`)), 10000)
  kiem('K4. thumbnail hien that (img.naturalWidth > 0)', thumbOk)
  await gõ('qzxwvutsr')
  kiem('K5. DOI CHUNG: tu khong co -> 0 the va hien cau "khong co anh nao khop"', (await ev(`document.querySelectorAll('.the').length`)) === 0 && (await ev(`!document.getElementById('trong').hidden`)))
  await gõ('')
  await ev(`document.querySelector('#nhom-loai [data-loai=dai]').click()`); await ngu(450)
  const loaiDai = await ev(`Array.from(document.querySelectorAll('.the')).map((e) => e.dataset.loai)`)
  kiem('K6. bam loc "Dai Storyboard" -> chi con dai (' + SO_DAI + ')', loaiDai.length === SO_DAI && loaiDai.every((x) => x === 'dai'), 'the ' + loaiDai.length)
  await ev(`document.querySelector('#nhom-loai [data-loai=video]').click()`); await ngu(450)
  const theVideo = await ev(`Array.from(document.querySelectorAll('.the')).map((e) => e.dataset.duong)`)
  kiem('K7. loc Video -> ' + SO_VIDEO + ' the', theVideo.length === SO_VIDEO)
  await ev(`document.querySelector('.the').click()`); await ngu(200)
  kiem('K8. bam video -> mo thu muc chua file (khong ghim)', mo.length === 1 && mo[0] === theVideo[0] && ghim.length === 0 && pinCtx.length === 0)
  await ev(`document.querySelector('#nhom-loai [data-loai=tat-ca]').click()`); await gõ(chuanHoa(mk.tu))
  await ev(`document.querySelector('.the').click()`); await ngu(400)
  kiem('K9. bam mot anh -> GHIM dung file (createPinWindow nhan duong dan, kich thuoc > 0)', pinCtx.length === 1 && pinCtx[0].f === path.join(ANH, mk.ten) && pinCtx[0].w > 100, JSON.stringify(pinCtx[0]))
  await ev(`document.querySelector('.the [data-hd=mo]').click()`); await ngu(200)
  kiem('K10. nut "Mo thu muc" -> showItemInFolder dung file, khong ghim them', mo.length === 2 && mo[1] === path.join(ANH, mk.ten) && pinCtx.length === 1)
  await ev(`(() => { const e = new Event('dragstart', { bubbles: true, cancelable: true }); document.querySelector('.the').dispatchEvent(e) })()`); await ngu(600)
  kiem('K11. keo anh ra app khac -> startDrag voi dung file', keo.length === 1 && keo[0] === path.join(ANH, mk.ten))
  // loc ngay trong giao dien
  await gõ('')
  await ev(`document.querySelector('#nhom-ngay [data-ngay="7"]').click()`); await ngu(450)
  const so7 = await ev(`document.querySelectorAll('.the').length`)
  kiem('K12. bam loc "7 ngay" -> so the = so file that trong 7 ngay', so7 === cm.tim({ chu: '', tu: (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() - 6 * 86400000 })() }).ds.length, 'the ' + so7)
  // tam dung
  await ev(`document.getElementById('nut-tam-dung').hidden = false; document.getElementById('nut-tam-dung').click()`); await ngu(300)
  kiem('K13. nut Tam dung luu vao cau hinh (timAnhTamDung=true) va chi muc ngung doc', cfg.timAnhTamDung === true && cm.trangThai().tamDung === true)
  cm.datTamDung(false)
  // i18n
  const i18n = require(path.join(ROOT, 'src', 'i18n.js'))
  const khoa = ['tray.timAnh', 'ta.tieuDe', 'ta.dong', 'ta.timGoiY', 'ta.loaiTatCa', 'ta.loaiAnh', 'ta.loaiVideo', 'ta.loaiDai', 'ta.ngayMoi', 'ta.ngayHomNay', 'ta.ngay7', 'ta.ngay30', 'ta.ngayChon', 'ta.tu', 'ta.den', 'ta.ghim', 'ta.moThuMuc', 'ta.choDoc', 'ta.dangDoc', 'ta.daDocXong', 'ta.dangTamDung', 'ta.tamDung', 'ta.tiepTuc', 'ta.chuaCo', 'ta.trongKho', 'ta.conNhieu']
  const thieu = khoa.filter((k) => i18n.t('vi', k) === k || i18n.t('en', k) === k)
  const gach = khoa.filter((k) => /—/.test(i18n.t('vi', k) + i18n.t('en', k)))
  kiem('K14. chu giao dien du VI + EN, khong gach ngang dai', thieu.length === 0 && gach.length === 0, thieu.concat(gach).join(','))
  const cssTxt = fs.readFileSync(path.join(ROOT, 'src', 'tim-anh', 'tim-anh.css'), 'utf8')
  kiem('K15. CSS khong khai :root rieng', !/:root/.test(cssTxt))

  // ---------- I. khong ghi vao thu muc anh ----------
  win.destroy(); cm.dungHet()
  fs.unlinkSync(moi)
  fs.writeFileSync(suaF, bSua)
  const sau = chupDanhSach(ANH)
  const mat = truocTat.filter((x) => !sau.includes(x)).map((x) => x.split('|')[0])
  const thua = sau.filter((x) => !truocTat.includes(x)).map((x) => x.split('|')[0])
  const matNgoaiXoa = mat.filter((n) => !xoa.some((m) => m.ten === n) && n !== path.basename(suaF))
  kiem('I1. thu muc anh: ngoai 5 file tu xoa + 1 file thu sua, khong file nao doi/them/mat', matNgoaiXoa.length === 0 && thua.filter((n) => n !== path.basename(suaF)).length === 0, `mat ${mat.length - 6 < 0 ? 0 : matNgoaiXoa.length} thua ${thua.length}`)
  kiem('I2. chi muc + thumbnail nam trong userData/tim-anh', fs.existsSync(fileCm) && fs.existsSync(path.join(UD, 'tim-anh', 'thumb')))
  const ghiNgoai = fs.readdirSync(ANH).filter((f) => /chi-muc|thumb|\.json$/i.test(f))
  kiem('I3. khong co file chi muc / json / thumb trong thu muc anh', ghiNgoai.length === 0)

  console.log('\n' + kq.join('\n'))
  console.log(dat ? `\nKet qua: TAT CA DAT (${kq.length}/${kq.length})` : '\nKet qua: CO MUC TRUOT')
  ocr.tatHost()
  fs.rmSync(TAM, { recursive: true, force: true })
  app.exit(dat ? 0 : 1)
}

app.whenReady().then(() => chinh().catch((e) => { console.error('LOI BAI DO', e); try { fs.rmSync(TAM, { recursive: true, force: true }) } catch (x) {} app.exit(2) }))
