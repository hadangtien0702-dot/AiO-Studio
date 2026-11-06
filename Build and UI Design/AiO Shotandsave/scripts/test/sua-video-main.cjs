'use strict'
/* Tien trinh Electron cua bai do SUA VIDEO (goi tu do-sua-video.cjs). Chay CHINH src/sua-video.js + src/sua-xuat (cua so AN),
   khong tray, khong phim tat, khong overlay, KHONG mo cua so nao len man hinh (show: false), userData rieng.
   Buoc 1: tao video THU bang MediaRecorder (y nhu bo quay cua app: MP4 phan manh H.264 + AAC) trong cua so an.
   Buoc 2: chay cac kich ban xuat, ghi ket-qua.json. Viec soi file xuat (ffprobe / ffmpeg) la cua do-sua-video.cjs. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { require('fs').appendFileSync(process.env.AIO_SUA_RA + '/loi.txt', String(e && e.stack) + '\n') } catch (x) {} })
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const GOC = path.resolve(__dirname, '..', '..')
const RA = process.env.AIO_SUA_RA
app.setName('aio-do-sua-video')
app.setPath('userData', path.join(RA, 'userData'))
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.on('window-all-closed', () => {}) // dong het cua so giua cac buoc khong duoc lam app tu thoat

const suaVideo = require(path.join(GOC, 'src', 'sua-video.js'))
const conTroQuay = require(path.join(GOC, 'src', 'con-tro-quay.js'))
const nhatKy = []
suaVideo.khoiTao({ ghiLog: (m) => nhatKy.push(m), moiDesktop: () => {}, tim: () => null, keoAnToan: (f) => f })
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

let nopXong = null
ipcMain.on('nguon:nop', (_e, ab) => { if (nopXong) nopXong({ ok: true, buf: Buffer.from(ab) }) })
ipcMain.on('nguon:loi', (_e, s) => { if (nopXong) nopXong({ ok: false, loi: s }) })

async function taoNguon(ten, kieu, durMs, coTieng) {
  const win = new BrowserWindow({ show: false, width: 700, height: 420, webPreferences: { preload: path.join(__dirname, 'sua-video-preload.cjs'), contextIsolation: true, sandbox: false, backgroundThrottling: false } })
  const xong = new Promise((r) => { nopXong = r })
  const tai = () => win.loadFile(path.join(__dirname, 'sua-video-nguon.html'), { query: { kieu, dur: String(durMs), tieng: coTieng ? '1' : '0' } })
  try { await tai() } catch (e) { await cho(800); await tai() } // lan nap thu hai ngay sau khi huy cua so truoc co khi bao ERR_FAILED
  const r = await Promise.race([xong, cho(durMs + 15000).then(() => ({ ok: false, loi: 'het gio tao nguon' }))])
  nopXong = null
  win.destroy()
  if (!r.ok) throw new Error('tao nguon ' + ten + ': ' + r.loi)
  const f = path.join(RA, ten + '.mp4')
  fs.writeFileSync(f, r.buf)
  return f
}

const NEN_KHONG = { kieu: 'khong' }
const tuy = (o) => Object.assign({ tuMs: 0, denMs: 0, giuTieng: true, zoom: { bat: false, muc: 'vua' }, nen: NEN_KHONG }, o)

app.whenReady().then(async () => {
  const kq = { electron: process.versions.electron, nguon: {}, job: [], nhatKy }
  const chayJob = async (ten, nguon, o, conTro, dichTen) => {
    const dich = path.join(RA, (dichTen || ten) + '.mp4')
    const md5Truoc = md5(nguon)
    const t0 = Date.now()
    let tienDo = 0
    const r = await suaVideo.xuat(nguon, dich, suaVideo.chuanTuyChon(o, true), conTro || null, (p) => { tienDo = p })
    kq.job.push({ ten, nguon, dich, ket: r, ms: Date.now() - t0, tienDo, md5GocDoiKhong: md5(nguon) === md5Truoc, conTam: fs.existsSync(dich + '.tam'), coDich: fs.existsSync(dich) })
    return r
  }
  try {
    for (const f of fs.readdirSync(RA)) { if (/\.(mp4|tam|json|txt)$/.test(f) && f !== 'loi.txt') { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} } }
    // --- nguon ---
    const A = await taoNguon('nguon-ma', 'ma', 7000, true)
    const B = await taoNguon('nguon-quad', 'quad', 9000, false)
    const C = await taoNguon('nguon-ma-khong-tieng', 'ma', 4000, false)
    kq.nguon = { A, B, C, md5: { A: md5(A), B: md5(B), C: md5(C) } }
    // con tro gia cho B: dung o (0.2,0.2) tu 1,0 toi 3,8 s; di; dung o (0.8,0.8) tu 5,2 toi 8,2 s (mau thuoc chi con tro, tre 0)
    const mau = []
    const them = (t, x, y) => mau.push([t, x, y])
    for (let t = 0; t <= 9000; t += 33) {
      let x, y
      if (t < 800) { x = 0.2 + (0.5 - 0.2) * (1 - t / 800) * 0.5; y = 0.2 + (0.5 - 0.2) * (1 - t / 800) * 0.5 } // vao tu giua
      else if (t < 3800) { x = 0.2; y = 0.2 }
      else if (t < 5200) { const u = (t - 3800) / 1400; x = 0.2 + 0.6 * u; y = 0.2 + 0.6 * u }
      else { x = 0.8; y = 0.8 }
      them(t, x, y)
    }
    const duLieu = { v: 1, t0: Date.now(), tre: 0, w: 640, h: 360, mau }
    fs.writeFileSync(B.replace(/\.mp4$/, '') + '.contro.json', JSON.stringify(duLieu))
    const conTro = conTroQuay.doc(B)
    kq.conTroDoc = !!conTro && conTro.mau.length === mau.length

    // --- cac kich ban ---
    await chayJob('s1-cat', A, tuy({ tuMs: 1500, denMs: 4500 }))
    await chayJob('s2-cat-khong-tieng', A, tuy({ tuMs: 0, denMs: 3000, giuTieng: false }))
    await chayJob('s3-nguyen-doan', A, tuy({}))
    await chayJob('s4-zoom', B, tuy({ zoom: { bat: true, muc: 'vua' } }), conTro)
    await chayJob('s5-nen', A, tuy({ tuMs: 0, denMs: 3000, nen: { kieu: 'chuyen', gd: 1, le: 8, bo: 4, bong: 50 } }))
    await chayJob('s6-nen-mo', A, tuy({ tuMs: 0, denMs: 2000, nen: { kieu: 'mo', le: 6, bo: 3, bong: 40 } }))
    await chayJob('s7-zoom-nen-cat', B, tuy({ tuMs: 2000, denMs: 7000, zoom: { bat: true, muc: 'manh' }, nen: { kieu: 'dac', mau: '#2563eb', le: 6, bo: 3, bong: 40 } }), conTro)
    await chayJob('s8-nguon-khong-tieng', C, tuy({ tuMs: 500, denMs: 3000, giuTieng: true }))
    // loi: doan cat dao nguoc + doan qua ngan -> that bai, KHONG de lai file nao
    await chayJob('e1-cat-dao-nguoc', A, tuy({ tuMs: 4000, denMs: 2000 }))
    await chayJob('e2-cat-qua-ngan', A, tuy({ tuMs: 1000, denMs: 1050 }))
    // bat zoom ma khong co du lieu con tro -> that bai
    await chayJob('e3-zoom-khong-con-tro', A, tuy({ zoom: { bat: true, muc: 'vua' } }), null)
    // dich da co -> tu choi, file dich cu KHONG bi doi
    fs.writeFileSync(path.join(RA, 'e4-dich-co-san.mp4'), 'da co san')
    await chayJob('e4-dich-co-san', A, tuy({}), null, 'e4-dich-co-san')
    kq.e4NoiDung = fs.readFileSync(path.join(RA, 'e4-dich-co-san.mp4'), 'utf8')
    // nguon la file rac -> that bai
    const rac = path.join(RA, 'rac.mp4'); fs.writeFileSync(rac, crypto.randomBytes(5000))
    await chayJob('e5-nguon-rac', rac, tuy({}))
    // cut file giua chung (quay bi ngat): xuat duoc phan con lai
    const cut = path.join(RA, 'nguon-cut.mp4'); fs.writeFileSync(cut, fs.readFileSync(A).subarray(0, Math.floor(fs.statSync(A).size * 0.55)))
    await chayJob('s9-nguon-bi-cut', cut, tuy({}))
    // huy giua chung: bat dau xuat doan dai roi huy ngay -> khong de lai file tam / dich
    {
      const dich = path.join(RA, 'x1-huy.mp4')
      const p = suaVideo.xuat(A, dich, suaVideo.chuanTuyChon(tuy({}), true), null, () => {})
      await cho(150) // job ~0,5 s: huy khi dang chay giua chung
      const dangBan = suaVideo.dangBan()
      suaVideo.huy()
      const r = await p
      await cho(300)
      kq.job.push({ ten: 'x1-huy', ket: r, dangBanTruocHuy: dangBan, dangBanSauHuy: suaVideo.dangBan(), conTam: fs.existsSync(dich + '.tam'), coDich: fs.existsSync(dich), md5GocDoiKhong: true })
    }
    // hai viec cung luc: viec thu hai bi tu choi
    {
      const p1 = suaVideo.xuat(A, path.join(RA, 'x2-a.mp4'), suaVideo.chuanTuyChon(tuy({ tuMs: 0, denMs: 1500 }), true), null, () => {})
      const r2 = await suaVideo.xuat(A, path.join(RA, 'x2-b.mp4'), suaVideo.chuanTuyChon(tuy({}), true), null, () => {})
      const r1 = await p1
      kq.job.push({ ten: 'x2-hai-viec', ket: r1, ket2: r2, conTam: false, coDich: fs.existsSync(path.join(RA, 'x2-b.mp4')), md5GocDoiKhong: true })
    }
    kq.cuoi = 'xong'
  } catch (e) { kq.loi = String((e && e.stack) || e) }
  try { fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 1)) } catch (e) {}
  app.exit(0)
})
