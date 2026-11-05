'use strict'
/* Tien trinh Electron cua bai do NHIP QUAY (goi tu do-nhip-quay.mjs). Hien mot BANG DEM nho 400x140 o goc tren-trai man
   chinh (khong cuop tieu diem), quay lai bang chinh bo quay cua app (src/luong-chup.js) theo tung cach, ghi file ra
   .selftest/nhip-quay/ + ket-qua.json roi thoat. Khong tray, khong phim tat, userData rieng.
   ☠️ CO hien bang dem len man hinh trong luc do (~6 s moi luot) -> anh dang ngoi may thi hoi truoc (so loi #12). */
const { app, screen, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const GOC = path.resolve(__dirname, '..', '..')
const RA = path.join(GOC, '.selftest', 'nhip-quay')
app.setName('aio-do-nhip-quay')
app.setPath('userData', path.join(GOC, '.selftest', 'userData-nhip'))

const luong = require(path.join(GOC, 'src', 'luong-chup.js'))
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const GIAY = Number(process.env.AIO_NHIP_GIAY) || 6
/* AIO_NHIP_LUOT="ten:nhip:fps:lon:nang,..." — lon = 1: quay vung 1600x900 CHUA bang dem (bo nen phai lam viec that);
   nang = 0: KHONG nang luong chay san (cach cu, loi). Mac dinh 4 luot:
   mac-dinh / mac-dinh-lon = cach app dang dung · doi-chung-cu = cach cu, chay SAU de (1) chung minh thuoc bat duoc loi
   va (2) chung minh sau luot truoc luong chay san da duoc HA ve 5 khung/giay · mac-dinh-lai = nang lai lan nua van an. */
const LUOT = (process.env.AIO_NHIP_LUOT || 'mac-dinh:xuly:30:0,mac-dinh-lon:xuly:30:1,doi-chung-cu:dongho:30:0:0,mac-dinh-lai:xuly:30:0,du-phong-khung:khung:30:0')
  .split(',').map((s) => { const [ten, nhip, fps, lon, nang, tre] = s.split(':'); return { ten, nhip, fps: Number(fps), lon: lon === '1', nang: nang !== '0', treTieng: tre === undefined || tre === '' ? undefined : Number(tre) } })

app.whenReady().then(async () => {
  const kq = { luot: [], nhatKy: [] }
  let bang = null
  try {
    fs.mkdirSync(RA, { recursive: true })
    const d = screen.getPrimaryDisplay()
    kq.man = { w: d.bounds.width, h: d.bounds.height, sf: d.scaleFactor, hz: d.displayFrequency }
    const B = { x: 40, y: 40, w: 400, h: 140 } // vi tri bang dem trong man chinh (DIP)
    bang = new BrowserWindow({
      x: d.bounds.x + B.x, y: d.bounds.y + B.y, width: B.w, height: B.h, useContentSize: true,
      frame: false, resizable: false, movable: false, focusable: false, skipTaskbar: true, hasShadow: false, show: false,
      alwaysOnTop: true, backgroundColor: '#000000', webPreferences: { backgroundThrottling: false },
    })
    bang.setAlwaysOnTop(true, 'screen-saver')
    // AIO_NHIP_BIP=1: bang dem them chop sang + tieng bip moi giay (bai do-dong-bo-tieng.mjs do lech tieng-hinh)
    await bang.loadFile(path.join(__dirname, 'bang-dem.html'), process.env.AIO_NHIP_BIP === '1' ? { query: { bip: '1' } } : {})
    bang.showInactive()
    kq.bang = { xin: B, duoc: bang.getContentBounds() }
    await luong.khoiDong({ ghiLog: (m) => kq.nhatKy.push(m) })
    const han = Date.now() + 15000
    while (!luong.sanSang() && Date.now() < han) await cho(100)
    kq.sanSang = luong.sanSang()
    await cho(800)
    for (const l of (kq.sanSang ? LUOT : [])) {
      const rect = l.lon ? { x: B.x, y: B.y, w: Math.min(1600, d.bounds.width - B.x), h: Math.min(900, d.bounds.height - B.y) } : { x: B.x, y: B.y, w: B.w, h: B.h }
      const file = path.join(RA, 'nhip-' + l.ten + '.mp4')
      const o = Object.assign({ file, rect, bytes: 0 }, l)
      const fd = fs.openSync(file, 'w')
      let xong
      const doi = new Promise((r) => { xong = r })
      await bang.webContents.executeJavaScript('window.datLai()')
      const r = await luong.batDauQuay(d, rect, { tieng: true, fps: l.fps, nhip: l.nhip, nang: l.nang, treTieng: l.treTieng, onKhuc: (b) => { fs.writeSync(fd, b); o.bytes += b.length }, onXong: xong })
      o.batDau = r
      if (r.ok) {
        await cho(GIAY * 1000)
        luong.dungQuay()
        o.xong = await doi
      }
      fs.closeSync(fd)
      o.nguon = await bang.webContents.executeJavaScript('window.thongKe()')
      o.treTieng = await bang.webContents.executeJavaScript('window.treTieng()')
      kq.luot.push(o)
      await cho(500)
    }
  } catch (e) { kq.loi = String((e && e.stack) || e) }
  if (bang && !bang.isDestroyed()) bang.destroy()
  fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 1))
  app.exit(0)
})
setTimeout(() => app.exit(2), 180000)
