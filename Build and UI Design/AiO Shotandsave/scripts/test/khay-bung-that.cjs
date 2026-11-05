'use strict'
/* DO THAT lan BUNG khay tu nut tron — cua so THAT, HIEN LEN MAN ~45 giay (02/10/2026).
   CANH BAO (so loi #12): bai nay bat mot cai khay gia + nut tron len man hinh. Anh dang ngoi may thi XIN GIO truoc.

   Vi sao co bai nay: anh bao "animation thuc te chua muot lam" roi "mat luon hieu ung". Dong ho trong app (run-log
   08:11:09) ghi: man trap cua khay chi ve duoc 6 khung trong 430 ms, co mot khoang 333 ms khong khung nao; ong kinh
   tan cung chi 3 khung. Bai an (offscreen) khong thay vi khong co buoc HIEN cua so that. Bai nay tach tung nghi pham:
     lanh      : khay AN (hide) vai giay -> hien -> bung ngay            (dung cach app dang lam, khong co san dien)
     am        : khay van HIEN, chi an noi dung -> bung                   (khong co buoc hien cua so)
     lanh-cho  : khay an -> hien -> cho 500 ms -> bung                    (hien truoc, dien sau)
     day-du    : thu ve + bung bang dung src/khay-thu.js (co san dien, nut tron, ong kinh)
   Moi kieu 3 lan. Do: so khung + khoang cach lon nhat giua 2 khung cua man trap (trang khay tu dem) + do nghen cua
   luong chinh (main) trong luc do.
   Chay: electron scripts/test/khay-bung-that.cjs <thu-muc-ra> [chinh|phu]   (phu = man co ti le khac man chinh) */
const { app, BrowserWindow, ipcMain, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
/* 02/10 lan chay dau: truyen duong dan TUONG DOI -> app.setPath nem "Path must be absolute" -> Electron bat HOP BAO LOI len
   man anh va treo o do. Nay: luon doi ra duong dan tuyet doi; moi loi khong bat duoc thi IN ra + thoat (khong hop thoai);
   qua 150 giay tu thoat. */
process.on('uncaughtException', (e) => { console.log('LOI=' + (e && e.stack || e)); process.exit(1) })
process.on('unhandledRejection', (e) => { console.log('LOI=' + (e && e.stack || e)); process.exit(1) })
setTimeout(() => { console.log('LOI=qua 150 giay, tu thoat'); process.exit(1) }, 150000).unref()
const RA = path.resolve(process.argv[2] || path.join(ROOT, '.selftest', 'khay-bung-that'))
const MAN = process.argv[3] || 'phu'
const KIEU = (process.env.AIO_KIEU || 'lanh,am,lanh-cho,day-du').split(',')
const LAN = Number(process.env.AIO_LAN || 3)
const NGHI = Number(process.env.AIO_NGHI || 2500)
fs.mkdirSync(RA, { recursive: true })
app.setPath('userData', path.join(RA, 'userData'))
app.on('window-all-closed', () => {})
// cung cong tac voi src/main.js (luong chup dung WGC)
app.commandLine.appendSwitch('enable-features', 'AllowWgcScreenCapturer,AllowWgcWindowCapturer,AllowWgcZeroHz')
const { taoKhayThu } = require(path.join(ROOT, 'src', 'khay-thu.js'))
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

ipcMain.on('i18n:lang', (e) => { e.returnValue = 'en' })
ipcMain.on('hotkey:display', (e) => { e.returnValue = 'Shift + `' })
ipcMain.on('khay:kieu', (e) => { e.returnValue = 'ngang' })

/** 6 thumbnail JPEG that (cung cach main.js thumbKhay lam): doc 6 anh moi nhat trong thu muc anh cua nguoi dung, CHI DOC. */
function thumbThat() {
  const dir = path.join(process.env.LOCALAPPDATA || '', 'shotandsave')
  let ten = []
  try { ten = fs.readdirSync(dir).filter((f) => /^shotandsave-\d.*[.](jpg|png)$/i.test(f)) } catch (e) {}
  ten = ten.map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t).slice(0, 6).map((x) => x.f)
  const ra = []
  for (const f of ten) {
    const img = nativeImage.createFromPath(path.join(dir, f))
    const sz = img.getSize()
    if (!sz.width) continue
    const h = Math.min(sz.height > sz.width ? 640 : 320, sz.height)
    ra.push({ thumb: 'data:image/jpeg;base64,' + img.resize({ height: h, quality: 'best' }).toJPEG(88).toString('base64'), w: sz.width, h: sz.height })
  }
  return ra
}

app.whenReady().then(async () => {
  const log = []
  const kq = { man: MAN, kieu: {}, log }
  const chinh = screen.getPrimaryDisplay()
  const man = MAN === 'phu' ? (screen.getAllDisplays().find((d) => d.id !== chinh.id) || chinh) : chinh
  const wa = man.workArea
  kq.manHinh = { id: man.id, scale: man.scaleFactor, wa }
  const KHAY = { x: wa.x + Math.round(wa.width * .45), y: wa.y + Math.round(wa.height * .55), width: 551, height: 129 }

  // cua so khay: CUNG tuy chon voi ensureShelf() trong src/main.js
  const khay = new BrowserWindow({
    x: KHAY.x, y: KHAY.y, width: KHAY.width, height: KHAY.height,
    frame: false, transparent: true, backgroundColor: '#00000000', alwaysOnTop: true, skipTaskbar: true, resizable: false,
    minimizable: false, maximizable: false, fullscreenable: false, hasShadow: false, show: false, focusable: false,
    // 04/10 (Mac): AIO_BT=1 -> thu `backgroundThrottling: false` cho cua so khay (trang khong bi ham khi cua so an)
    webPreferences: { preload: path.join(ROOT, 'src', 'preload-shelf.js'), contextIsolation: true, sandbox: false, backgroundThrottling: process.env.AIO_BT === '1' ? false : true },
  })
  khay.setAlwaysOnTop(true, 'screen-saver')
  khay.setBounds(KHAY)
  const loiTrang = []
  khay.webContents.on('console-message', (e, level, msg) => { if (typeof level === 'number' ? level >= 3 : e.level === 'error') loiTrang.push(String(msg || e.message).slice(0, 200)) })
  await khay.loadFile(path.join(ROOT, 'src', 'shelf', 'index.html'))
  const thumb = thumbThat()
  kq.soAnh = thumb.length
  thumb.forEach((t, i) => khay.webContents.send('shelf:add', { id: i + 1, seq: i + 1, thumb: t.thumb, filePath: 'x' + i, w: t.w, h: t.h, kb: 100 }))
  const js = (w, s) => w.webContents.executeJavaScript(s, true)

  // do nghen luong chinh: hen gio 4 ms, ghi khoang cach lon nhat
  let nghenMax = 0, nghenTruoc = 0
  const henNghen = setInterval(() => { const b = Date.now(); if (nghenTruoc) nghenMax = Math.max(nghenMax, b - nghenTruoc); nghenTruoc = b }, 4)
  const batNghen = () => { nghenMax = 0; nghenTruoc = 0 }

  const kt = taoKhayThu({
    electron: { BrowserWindow, screen, ipcMain },
    layKhay: () => khay, damBaoKhay: () => khay,
    anhMoiNhat: () => (thumb.length ? thumb[thumb.length - 1].thumb : ''), soAnh: () => thumb.length,
    docGiay: () => 5, banKhac: () => false, tuDong: () => false,
    ghiLog: (s) => log.push(s),
  })

  khay.showInactive()
  await cho(900)

  /* Lan 2 (02/10 08:3x): 4 kieu dau deu MUOT (24-25 khung, max 17) trong khi app that khung -> thu pham la thu chi app
     that co. Them 2 thu:
       'luong' (khong phai kieu do, la LENH): tu day tro di bat LUONG CHUP CHAY SAN cua app (src/luong-chup.js, 5 khung/giay
               moi man) ngay trong tien trinh nay -> cac kieu dung SAU no la "co luong", dung TRUOC la "khong luong".
       'bam'  : thu ve roi BAM vao nut tron (su kien chuot gui vao trang nut) -> di dung duong `nut:mo` nhu nguoi dung.
     Vi du: AIO_KIEU=day-du,bam,luong,day-du,bam */
  /* Lan 3 (02/10 13:1x): anh bao "luc no bay ra thi no bi an o duoi" khi dung Premiere. Them LENH:
       'che'      : dung mot cua so THUONG (khong noi tren cung, nen xam) phu len cho khay, dong vai Premiere. Hien khong
                    cuop tieu diem. Cac kieu dung SAU no la "co cua so che".
       'che-chon' : nhu 'che' nhung KICH HOAT cua so che truoc moi lan bung (giong nguoi dung bam vao Premiere) — CUOP tieu diem.
     Thuoc: `an` trong dong `khay bung` (bai nay de nguyen co che tinh cua so bi che cua Chromium): an 1 = khay bi che that. */
  let coLuong = false, thuTu = 0, che = null, cheChon = false
  for (const k of KIEU) {
    if (k === 'che' || k === 'che-chon') {
      cheChon = k === 'che-chon'
      if (!che) {
        che = new BrowserWindow({ x: KHAY.x - 150, y: KHAY.y - 150, width: KHAY.width + 300, height: KHAY.height + 300, frame: true, show: false, backgroundColor: '#3a3a3a', title: 'cua so che (bai do Shot & Save)', skipTaskbar: true, minimizable: false })
        che.setMenuBarVisibility(false)
        await che.loadURL('data:text/html,<body style="background:%233a3a3a;color:%23aaa;font:14px sans-serif;padding:20px">cua so che (bai do, tu tat)</body>')
        che.showInactive()
        await cho(600)
      }
      continue
    }
    if (k === 'luong') {
      const luong = require(path.join(ROOT, 'src', 'luong-chup.js'))
      await luong.khoiDong({ ghiLog: (s) => log.push(s) })
      const t0 = Date.now()
      while (!luong.sanSang() && Date.now() - t0 < 6000) await cho(100)
      coLuong = luong.sanSang()
      kq.luong = { sanSang: coLuong, ms: Date.now() - t0, fps: luong.LUONG_FPS }
      await cho(1500)
      continue
    }
    const ten = (++thuTu) + '. ' + k + (coLuong ? ' + luong' : '') + (che ? (cheChon ? ' + CHE co kich hoat' : ' + CHE') : '')
    kq.kieu[ten] = []
    for (let i = 0; i < LAN; i++) {
      let r = null
      if (k === 'day-du' || k === 'bam') {
        await kt.thu('do that')
        await cho(NGHI)
        if (che) { if (cheChon) che.focus(); else che.moveTop(); await cho(300) }   // "nguoi dung dang lam viec trong app kia"
        batNghen()
        const t0 = Date.now()
        if (k === 'bam') {
          const truoc = log.length, n = kt._cuaSo().nut
          for (const type of ['mouseMove', 'mouseDown', 'mouseUp']) n.webContents.sendInputEvent({ type, x: 40, y: 40, button: 'left', clickCount: 1 })
          while (!log.slice(truoc).some((l) => l.startsWith('khay bung')) && Date.now() - t0 < 4000) await cho(20)
        } else await kt.bung('do that')
        r = { tong: Date.now() - t0, nghenMain: nghenMax, dong: log.filter((l) => l.startsWith('khay bung')).pop() }
      } else {
        await js(khay, 'window.__khayAn(true)')
        await cho(120)
        if (k !== 'am') khay.hide()
        await cho(NGHI)
        batNghen()
        const t0 = Date.now()
        if (k !== 'am') khay.showInactive()
        const tHien = Date.now() - t0
        if (k === 'lanh-cho') await cho(Number(process.env.AIO_CHO || 500)) // 04/10: AIO_CHO=ms de do can cho bao lau sau khi hien
        const u = await js(khay, 'window.__khayBung()')
        r = Object.assign({ hien: tHien, nghenMain: nghenMax }, u)
      }
      kq.kieu[ten].push(r)
      await cho(700)
    }
  }
  clearInterval(henNghen)
  kq.loiTrang = loiTrang
  fs.writeFileSync(path.join(RA, 'ket-qua.json'), JSON.stringify(kq, null, 2))
  console.log('KQ=' + JSON.stringify(kq))
  kt.dongHet()
  khay.destroy()
  for (const w of BrowserWindow.getAllWindows()) { try { w.destroy() } catch (e) {} } // ca cua so an cua luong chup
  app.quit()
})
