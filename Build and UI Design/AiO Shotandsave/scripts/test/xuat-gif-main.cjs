'use strict'
/* Phan Electron cua `npm run test:xuatgif` (06/10): chay BO MAY XUAT GIF that (src/xuat-gif.js + src/gif) trong Electron
   AN tren video mau TU QUAY co noi dung biet truoc (scripts/test/xuat-gif-trang.html), roi doc lai file GIF bang bo giai
   ma cua Chromium + di tung khoi cua file. Khong hien cua so nao, khong danh thuc ban dang cai.
   Ket qua: .selftest/xuat-gif/ket-qua.json. Cham diem o do-xuat-gif.mjs. */
const { app, BrowserWindow } = require('electron')
const path = require('path'), fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const RA = path.join(ROOT, '.selftest', 'xuat-gif')
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData'))
app.on('window-all-closed', () => {})
const kq = { luot: [] }
const luu = () => fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq))
const chet = (e) => { kq.loi = String((e && e.stack) || e); luu(); app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 150 giay'), 150000)

/* Di tung khoi cua file GIF (thuoc cau truc, khong giai nen hinh): { w, h, lap, hetDung, khung: [{ viTriGoi, cachBo,
   trong, cs, w, h, bangRieng }] }. viTriGoi = vi tri byte "goi" cua khoi dieu khien (de bai doi chung sua cach bo hinh). */
function diGif(b) {
  const ra = { dau: b.toString('latin1', 0, 6), w: b.readUInt16LE(6), h: b.readUInt16LE(8), lap: null, hetDung: false, khung: [] }
  let i = 13
  if (b[10] & 0x80) i += 3 * (1 << ((b[10] & 7) + 1))
  let gce = null
  const quaKhoiCon = () => { while (i < b.length && b[i] !== 0) i += b[i] + 1; i++ }
  while (i < b.length) {
    const t = b[i++]
    if (t === 0x3b) { ra.hetDung = i === b.length; break }
    if (t === 0x21) {
      const nhan = b[i++]
      if (nhan === 0xf9) { gce = { viTriGoi: i + 1, cachBo: (b[i + 1] >> 2) & 7, trong: b[i + 1] & 1, cs: b.readUInt16LE(i + 2) }; i += 6 } else {
        if (nhan === 0xff && b.toString('latin1', i + 1, i + 12) === 'NETSCAPE2.0') ra.lap = b.readUInt16LE(i + 14)
        quaKhoiCon()
      }
    } else if (t === 0x2c) {
      const k = Object.assign({ w: b.readUInt16LE(i + 4), h: b.readUInt16LE(i + 6), bangRieng: !!(b[i + 8] & 0x80) }, gce || {})
      const goi = b[i + 8]; i += 9
      if (goi & 0x80) i += 3 * (1 << ((goi & 7) + 1))
      i++ // kich ma LZW nho nhat
      quaKhoiCon()
      ra.khung.push(k); gce = null
    } else break
  }
  return ra
}

app.whenReady().then(async () => {
  const xg = require(path.join(ROOT, 'src', 'xuat-gif.js'))
  kq.nhatKy = []
  xg.khoiTao((s) => kq.nhatKy.push(s))
  const win = new BrowserWindow({ width: 320, height: 200, show: false, webPreferences: { contextIsolation: true, sandbox: false, backgroundThrottling: false } })
  await win.loadFile(path.join(__dirname, 'xuat-gif-trang.html'))
  const js = (c) => win.webContents.executeJavaScript(c, true)

  // 1. Tu quay video mau 4 giay (cung duong ghi cua app: canvas -> captureStream -> MediaRecorder MP4)
  const MAU = path.join(RA, 'mau.mp4')
  const m = await js('window.taoMau(4)')
  if (m.loi) { kq.loi = m.loi; luu(); app.exit(0); return }
  fs.writeFileSync(MAU, Buffer.from(m.b64, 'base64'))
  kq.mau = { mime: m.mime, bytes: m.bytes, soCuoi: m.soCuoi }

  const soi = async (file) => js('window.soiGif(' + JSON.stringify(fs.readFileSync(file).toString('base64')) + ')')
  const chay = async (ten, nguon, tuyChon, coSoi) => {
    const dich = path.join(RA, ten + '.gif')
    for (const f of [dich, dich + '.tam']) { try { fs.unlinkSync(f) } catch (e) {} }
    const td = []
    const r = await xg.xuat(nguon, dich, Object.assign({ tuKiem: true }, tuyChon || {}), (p) => td.push(p))
    if (r.tuKiem) { delete r.tuKiem.anhNguon; delete r.tuKiem.anhGhep }
    let giam = 0
    for (let i = 1; i < td.length; i++) if (td[i] < td[i - 1]) giam++
    const muc = { ten, r, tienDo: { so: td.length, giam, cuoi: td.length ? td[td.length - 1] : 0 }, coFile: fs.existsSync(dich), conTam: fs.existsSync(dich + '.tam') }
    if (r.ok) {
      const b = fs.readFileSync(dich)
      muc.hop = diGif(b); muc.hop.soKhung = muc.hop.khung.length
      muc.hop.tongCs = muc.hop.khung.reduce((s, k) => s + (k.cs || 0), 0)
      muc.hop.cachBo = [...new Set(muc.hop.khung.map((k) => k.cachBo))]
      muc.hop.bangRieng = muc.hop.khung.filter((k) => k.bangRieng).length
      muc.hop.khungDau = muc.hop.khung[0]; muc.hop.khung = undefined
      if (coSoi) { try { muc.soi = await soi(dich) } catch (e) { muc.soi = { loi: String(e && e.message || e) } } }
    }
    kq.luot.push(muc); luu()
    return muc
  }

  await chay('mau', MAU, null, true)
  // DOI CHUNG 1: nguong cuc lon -> khong diem nao duoc coi la "da doi" -> GIF chi co 1 khung -> thuoc so dem PHAI bat
  await chay('dc-khong-cap-nhat', MAU, { nguong: 100000 }, true)
  // DOI CHUNG 2: sua file GIF dung: moi khoi dieu khien doi cach bo hinh 1 (giu) -> 2 (xoa ve nen) -> nua dung yen PHAI hong
  try {
    const b = Buffer.from(fs.readFileSync(path.join(RA, 'mau.gif')))
    const h = diGif(b)
    for (const k of h.khung) if (k.viTriGoi) b[k.viTriGoi] = (b[k.viTriGoi] & ~0x1c) | (2 << 2)
    fs.writeFileSync(path.join(RA, 'dc-bo-hinh.gif'), b)
    kq.dcBoHinh = await soi(path.join(RA, 'dc-bo-hinh.gif'))
  } catch (e) { kq.dcBoHinh = { loi: String(e && e.message || e) } }
  await chay('tran-1s', MAU, { toiDaMs: 1000 }, true)
  await chay('nho-320', MAU, { canhDai: 320 }, true)

  // File THAT do app quay (neu may co): 720p co 2 duong (tieng dung truoc hinh), 4K
  for (const [ten, f] of [['that-720p-co-tieng', 'mau-quay-thu-720p-co-tieng.mp4'], ['that-4k', 'mau-quay-thu-4k.mp4']]) {
    const p = path.join(ROOT, '.selftest', 'thu-quay', f)
    if (fs.existsSync(p)) await chay(ten, p, null, false); else kq.luot.push({ ten, boQua: 'khong co file mau ' + f })
  }

  // Duong LOI: khong phai video · file bi cut giua chung · khong ton tai · 2 viec cung luc
  const RAC = path.join(RA, 'rac.mp4'); fs.writeFileSync(RAC, Buffer.alloc(5000, 'day khong phai video '))
  await chay('rac', RAC, null, false)
  const CUT = path.join(RA, 'cut.mp4'); const goc = fs.readFileSync(MAU); fs.writeFileSync(CUT, goc.subarray(0, Math.floor(goc.length * 0.6)))
  await chay('cut', CUT, null, true)
  await chay('khong-co', path.join(RA, 'khong-co-file-nay.mp4'), null, false)
  for (const f of ['song-1.gif', 'song-2.gif']) { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} }
  const [s1, s2] = await Promise.all([xg.xuat(MAU, path.join(RA, 'song-1.gif')), xg.xuat(MAU, path.join(RA, 'song-2.gif'))])
  kq.songSong = { s1: { ok: s1.ok, loi: s1.loi }, s2: { ok: s2.ok, loi: s2.loi }, file2: fs.existsSync(path.join(RA, 'song-2.gif')), tam2: fs.existsSync(path.join(RA, 'song-2.gif.tam')) }
  kq.xong = true
  luu()
  app.exit(0)
})
