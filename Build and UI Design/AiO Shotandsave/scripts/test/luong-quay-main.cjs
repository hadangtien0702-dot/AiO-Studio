'use strict'
/* Tien trinh Electron cua bai do THOAT GIUA LUC QUAY + LUONG NEN KET THUC (goi tu do-thoat-quay.cjs).
   Chay CHINH src/luong-chup.js (cua so AN; AIO_BIEN_THE=cu thi chay ban cu `src/luong-chup-cu-tam.js` do bai do chep tu commit ab2a311
   de DOI CHUNG), quay vung giua man chinh vai giay, KHONG mo cua so nao len man hinh, userData rieng. Ghi ket-qua.json. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { require('fs').appendFileSync(process.env.AIO_RA + '/loi-' + process.env.AIO_BIEN_THE + '.txt', String(e && e.stack) + '\n') } catch (x) {} })
const { app, screen, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const GOC = path.resolve(__dirname, '..', '..')
const RA = process.env.AIO_RA
const BIEN_THE = process.env.AIO_BIEN_THE === 'cu' ? 'cu' : 'moi'
app.setName('aio-do-thoat-quay')
app.setPath('userData', path.join(RA, 'userData-' + BIEN_THE))
app.on('window-all-closed', () => {})

const luong = require(path.join(GOC, 'src', BIEN_THE === 'cu' ? 'luong-chup-cu-tam.js' : 'luong-chup.js'))
const thoatAnToan = require(path.join(GOC, 'src', 'thoat-an-toan.js'))
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const nhatKy = []
const ghiLog = (m) => nhatKy.push(m)

async function sanSang() {
  if (!luong.sanSang()) await luong.khoiDong({ ghiLog })
  const han = Date.now() + 15000
  while (!luong.sanSang() && Date.now() < han) await cho(100)
  return luong.sanSang()
}

async function quay(ten, rect, dung) {
  const file = path.join(RA, BIEN_THE + '-' + ten + '.mp4')
  const fd = fs.openSync(file, 'w')
  const o = { ten, file, bytes: 0, khuc: 0, xong: false, info: null }
  const r = await luong.batDauQuay(screen.getPrimaryDisplay(), rect, {
    tieng: false,
    onKhuc: (buf) => { try { fs.writeSync(fd, buf); o.bytes += buf.length; o.khuc++ } catch (e) {} },
    onXong: (info) => { o.xong = true; o.info = info },
  })
  o.batDau = r
  if (!r.ok) { fs.closeSync(fd); o.loi = r.loi; return o }
  await dung(o)
  // doi toi da 6 s cho onXong (ban cu: cua so bi huy -> ketQuay('cua so luong dong') goi ngay)
  const han = Date.now() + 6000
  while (!o.xong && Date.now() < han) await cho(50)
  fs.closeSync(fd)
  return o
}

app.whenReady().then(async () => {
  const kq = { bienThe: BIEN_THE, electron: process.versions.electron, nhatKy }
  try {
    fs.mkdirSync(RA, { recursive: true })
    for (const f of fs.readdirSync(RA)) if (f.startsWith(BIEN_THE + '-') && /\.(mp4|json)$/.test(f)) { try { fs.unlinkSync(path.join(RA, f)) } catch (e) {} }
    const d = screen.getPrimaryDisplay()
    const rect = { x: Math.round(d.bounds.width / 2 - 200), y: Math.round(d.bounds.height / 2 - 150), w: 400, h: 300 }
    kq.sanSang1 = await sanSang()

    // T1: "Thoat" sau 0,4 s quay (CHUA qua giay dau: khuc dau chua gui) — ban moi dung + doi, ban cu huy cua so ngay
    kq.t1 = await quay('t1-thoat', rect, async (o) => {
      await cho(400)
      if (BIEN_THE === 'moi') {
        kq.t1Doi = await thoatAnToan.doiQuayXong({ dangQuay: () => !o.xong, dung: () => luong.dungQuay(), toiDaMs: 8000, ghiLog })
      } else {
        for (const w of BrowserWindow.getAllWindows()) w.destroy() // hanh vi cu cua forceQuit
        await cho(1500)
      }
    })

    // T2: luong NEN cua mot man khac ket thuc luc dang quay 3 s (gia lap: renderer luong bao 'luong:ket-thuc')
    kq.sanSang2 = await sanSang()
    if (kq.sanSang2) {
      kq.t2 = await quay('t2-luong-nen-ket', rect, async (o) => {
        await cho(1000)
        const w = BrowserWindow.getAllWindows().find((x) => !x.isDestroyed() && /\/luong\/index\.html/.test(x.webContents.getURL().replace(/\\/g, '/')))
        kq.t2Tim = !!w
        if (w) await w.webContents.executeJavaScript("window.luong.ketThuc('999999')")
        await cho(2800) // qua han 1,5 s cua yeu cau khoi dong lai: ban cu da huy cua so luc nay
        kq.t2SongSau = !!BrowserWindow.getAllWindows().find((x) => !x.isDestroyed() && /\/luong\/index\.html/.test(x.webContents.getURL().replace(/\\/g, '/')))
        luong.dungQuay()
      })
      // sau khi quay xong, yeu cau khoi dong lai bi hoan phai duoc thuc hien (ban moi): luong van san sang lai
      // 07/11: luong khoi dong mat 1,5-3,7 s tuy may (do: "chuan bi 3695ms"), cho cung 3,5 s la truot oan. Cho toi 15 s, ghi so giay that.
      const t3 = Date.now()
      while (!luong.sanSang() && Date.now() - t3 < 15000) await cho(100)
      kq.sanSang3 = luong.sanSang(); kq.msSanSang3 = Date.now() - t3
    }
    // T3 (chi ban moi): quay THAT 3,5 s co tieng may (Windows: loopback) + ghi vi tri con tro THAT, roi chay Sua video tren chinh file do
    if (BIEN_THE === 'moi' && kq.sanSang3) {
      const suaVideo = require(path.join(GOC, 'src', 'sua-video.js'))
      const conTroQuay = require(path.join(GOC, 'src', 'con-tro-quay.js'))
      suaVideo.khoiTao({ ghiLog, moiDesktop: () => {}, tim: () => null, keoAnToan: (f) => f })
      const rect3 = { x: Math.round(d.bounds.width / 2 - 240), y: Math.round(d.bounds.height / 2 - 135), w: 480, h: 270 }
      let ghiCt = null
      const file3 = path.join(RA, 'moi-t3-sua.mp4')
      kq.t3 = await (async () => {
        const fd = fs.openSync(file3, 'w')
        const o = { file: file3, bytes: 0, khuc: 0, xong: false, info: null }
        const r = await luong.batDauQuay(d, rect3, {
          tieng: process.platform === 'win32', // loopback: tieng dang phat tren may (co the la im lang nhung van co duong tieng)
          onKhuc: (buf) => { try { fs.writeSync(fd, buf); o.bytes += buf.length; o.khuc++ } catch (e) {} },
          onXong: (info) => { o.xong = true; o.info = info },
        })
        o.batDau = r
        if (!r.ok) { fs.closeSync(fd); o.loi = r.loi; return o }
        ghiCt = conTroQuay.bat({ bounds: d.bounds, rect: rect3, t0: r.t0Epoch, tre: r.treHinh || 0, w: r.w, h: r.h }) // con tro THAT (doc bang screen.getCursorScreenPoint)
        await cho(3500)
        const du = ghiCt.dung()
        luong.dungQuay()
        const han = Date.now() + 6000
        while (!o.xong && Date.now() < han) await cho(50)
        fs.closeSync(fd)
        o.soMauConTro = du.mau.length
        o.luuConTro = conTroQuay.luu(file3, du)
        o.docConTro = !!conTroQuay.doc(file3)
        return o
      })()
      if (kq.t3.xong) {
        const dich = path.join(RA, 'moi-t3-sua-da-sua.mp4')
        kq.t3Xuat = await suaVideo.xuat(file3, dich, suaVideo.chuanTuyChon({ tuMs: 400, denMs: 3200, giuTieng: true, zoom: { bat: true, muc: 'manh' }, nen: { kieu: 'chuyen', gd: 2, le: 6, bo: 3, bong: 40 } }, true), conTroQuay.doc(file3), () => {})
        kq.t3XuatKhongZoom = await suaVideo.xuat(file3, path.join(RA, 'moi-t3-sua-khong-zoom.mp4'), suaVideo.chuanTuyChon({ tuMs: 400, denMs: 3200, giuTieng: true }, true), null, () => {})
      }
    }
    kq.cuoi = 'xong'
  } catch (e) { kq.loi = String((e && e.stack) || e) }
  try { fs.writeFileSync(path.join(RA, BIEN_THE + '-ket-qua.json'), JSON.stringify(kq, null, 1)) } catch (e) {}
  app.exit(0)
})
