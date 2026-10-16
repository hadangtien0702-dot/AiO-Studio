'use strict'
/* Tien trinh Electron cua bai do QUAY VIDEO (goi tu do-quay-video.mjs). Chay CHINH src/luong-chup.js (cua so AN),
   quay vai doan ngan cua man chinh, ghi ra .selftest/quay-video/, in ket qua JSON roi thoat.
   KHONG tray, KHONG phim tat, KHONG overlay, KHONG xin single-instance lock, userData rieng -> khong danh thuc ban
   dang chay, khong bat cua so nao len man hinh (so loi #12). */
const { app, screen } = require('electron')
const path = require('path')
const fs = require('fs')

const GOC = path.resolve(__dirname, '..', '..')
const RA = path.join(GOC, '.selftest', 'quay-video')
app.setName('aio-do-quay-video')
app.setPath('userData', path.join(GOC, '.selftest', 'userData-quay'))

const luong = require(path.join(GOC, 'src', 'luong-chup.js'))
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const nhatKy = []

async function motLuot(display, ten, rect, ms, tieng) {
  const file = path.join(RA, 'do-' + ten + '.tam')
  const o = { ten, rect, xinMs: ms, tieng: !!tieng, file: null, bytes: 0, khuc: 0 }
  let fd = null
  try { fd = fs.openSync(file, 'w') } catch (e) { o.loi = 'khong mo duoc file: ' + e.message; return o }
  let xong
  const doiXong = new Promise((r) => { xong = r })
  const t0 = Date.now()
  const r = await luong.batDauQuay(display, rect, {
    tieng,
    onKhuc: (buf) => { fs.writeSync(fd, buf); o.bytes += buf.length; o.khuc++ },
    onXong: (info) => xong(info),
  })
  o.batDau = r
  if (!r.ok) { fs.closeSync(fd); try { fs.unlinkSync(file) } catch (e) {} o.loi = r.loi; return o }
  o.msMo = Date.now() - t0
  // Goi lan 2 khi dang quay -> phai bi tu choi, khong pha luot dang chay
  if (ten === 'thuong') {
    const r2 = await luong.batDauQuay(display, rect, { onKhuc: () => {}, onXong: () => {} })
    o.lan2 = r2
  }
  await cho(ms)
  const tDung = Date.now()
  luong.dungQuay()
  const info = await doiXong
  o.msDung = Date.now() - tDung
  o.xong = info
  fs.closeSync(fd)
  const dich = path.join(RA, 'do-' + ten + '.' + (r.duoi || 'mp4'))
  try { fs.renameSync(file, dich); o.file = dich } catch (e) { o.loi = 'doi ten hong: ' + e.message }
  return o
}

app.whenReady().then(async () => {
  const kq = { electron: process.versions.electron, luot: [], nhatKy }
  try {
    fs.mkdirSync(RA, { recursive: true })
    const d = screen.getPrimaryDisplay()
    kq.man = { w: d.bounds.width, h: d.bounds.height, sf: d.scaleFactor, soMan: screen.getAllDisplays().length }
    await luong.khoiDong({ ghiLog: (m) => nhatKy.push(m) })
    const han = Date.now() + 15000
    while (!luong.sanSang() && Date.now() < han) await cho(100)
    kq.sanSang = luong.sanSang()
    /* [do quy mo that] AIO_DO_DAI=<giay>: MOT luot quay dai (ca man chinh, co tieng), 10 s lay mau bo nho 1 lan.
       Tra loi: quay 5 phut thi RAM co phinh khong, so khung co tut khong, file co lon bat thuong khong. */
    const DAI = Number(process.env.AIO_DO_DAI) || 0
    if (kq.sanSang && DAI > 0) {
      const mau = []
      const lay = () => { const m = app.getAppMetrics(); mau.push({ s: Math.round((Date.now() - t0) / 1000), tongMB: Math.round(m.reduce((a, p) => a + p.memory.workingSetSize, 0) / 1024), toNhatMB: Math.round(Math.max(...m.map((p) => p.memory.workingSetSize)) / 1024), cpu: Math.round(m.reduce((a, p) => a + p.cpu.percentCPUUsage, 0)) }) }
      const t0 = Date.now()
      lay()
      const iv = setInterval(lay, 10000)
      const l = await motLuot(d, 'dai', { x: 0, y: 0, w: d.bounds.width, h: d.bounds.height }, DAI * 1000, true)
      clearInterval(iv); lay()
      l.mau = mau
      kq.luot.push(l)
    } else if (kq.sanSang) {
      const giua = (w, h) => ({ x: Math.round((d.bounds.width - w) / 2), y: Math.round((d.bounds.height - h) / 2), w, h })
      kq.luot.push(await motLuot(d, 'thuong', giua(640, 360), 3000, false))
      kq.luot.push(await motLuot(d, 'co-tieng', giua(640, 360), 3000, true))
      kq.luot.push(await motLuot(d, 'ca-man', { x: 0, y: 0, w: d.bounds.width, h: d.bounds.height }, 2500, false))
      kq.luot.push(await motLuot(d, 'sieu-nho', giua(21, 15), 2000, false))
      kq.luot.push(await motLuot(d, 'dung-ngay', giua(320, 200), 250, false))
      kq.luot.push(await motLuot(d, 'dai-12s', giua(800, 450), 12000, true))
    }
  } catch (e) { kq.loi = String(e && e.stack || e) }
  fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 1))
  app.exit(0)
})
// Chot an toan: qua han ma chua xong thi tu thoat (luot dai AIO_DO_DAI -> han = thoi gian quay + 60 s)
const HAN_MS = Math.max(120000, ((Number(process.env.AIO_DO_DAI) || 0) + 60) * 1000)
setTimeout(() => { try { fs.writeFileSync(path.join(RA, 'HET-GIO.txt'), 'qua ' + HAN_MS / 1000 + ' s') } catch (e) {} app.exit(2) }, HAN_MS)
