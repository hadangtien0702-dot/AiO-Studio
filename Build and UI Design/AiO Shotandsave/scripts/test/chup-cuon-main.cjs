'use strict'
/* Phan Electron cua bai do CHUP CUON (06/10, goi tu do-chup-cuon.cjs). Khong hien cua so nao, khong chay main.js cua app.
   A. Man chup that (src/overlay, offscreen): phim 9 va nut Chup cuon gui dung { rect, cuon: true } ve main.
   B. Duong ANH THAT cua app: khung di qua nativeImage -> JPEG q85 -> giai nen -> toBitmap (dung nhu luong chup tra ve),
      chay bang vong lap chayPhien() co nguoi "bam Xong", roi anh dai -> createFromBitmap -> PNG -> doc lai.
   Chay: electron scripts/test/chup-cuon-main.cjs <file-trang.bin> <W> <H> <h> */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron')
const path = require('path'), fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const [fTrang, W, H, h] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4]), Number(process.argv[5])]
app.setPath('userData', path.join(ROOT, '.selftest', 'chup-cuon', 'userData'))
app.on('window-all-closed', () => {})
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const chet = (e) => { console.log('LOI=' + (e && e.stack || e)); app.exit(2) }
process.on('uncaughtException', chet)
process.on('unhandledRejection', chet)
setTimeout(() => chet('qua 90 giay'), 90000)

const xacNhan = []
ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
ipcMain.on('overlay:confirm', (_e, p) => { xacNhan.push(p) })

app.whenReady().then(async () => {
  const kq = {}
  // ── A. Man chup ──
  const mo = async () => {
    const ov = new BrowserWindow({ x: 0, y: 0, width: 1200, height: 800, show: false, frame: false, transparent: true,
      webPreferences: { offscreen: true, preload: path.join(ROOT, 'src', 'preload-overlay.js'), contextIsolation: true, sandbox: false } })
    await ov.loadFile(path.join(ROOT, 'src', 'overlay', 'index.html'))
    ov.webContents.send('overlay:init', { origin: { x: 0, y: 0 } })
    ov.webContents.send('overlay:annotate', { x: 100, y: 100, w: 600, h: 400 })
    await cho(300)
    return ov
  }
  let ov = await mo()
  kq.nut = await ov.webContents.executeJavaScript(`(() => { const b = toolbarEl.querySelector('[data-tool="cuon"]'); const t = toolbarEl.getBoundingClientRect(); return b ? { goiY: b.title, so: b.querySelector('.so').textContent, trai: Math.round(t.left), phai: Math.round(t.right), cuaSo: innerWidth } : null })()`, true)
  await ov.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: '9', code: 'Digit9', bubbles: true, cancelable: true })); true`, true)
  await cho(200)
  kq.phim9 = xacNhan.slice()
  ov.destroy(); xacNhan.length = 0
  ov = await mo()
  await ov.webContents.executeJavaScript(`toolbarEl.querySelector('[data-tool="cuon"]').click(); true`, true)
  await cho(200)
  kq.bamNut = xacNhan.slice()
  ov.destroy()

  // ── B. Duong anh that + vong lap mot phien ──
  const { chayPhien } = require(path.join(ROOT, 'src', 'chup-cuon.js'))
  const trang = fs.readFileSync(fTrang)
  const buoc = [0, 140, 260, 0, 90, 330, 410, -120, 200, 380, 0, 150, 300, 220, 60, 0]
  let i = 0, tu = 0, xa = 0, soLay = 0
  const t0 = Date.now()
  const r = await chayPhien({
    layKhung: async () => {
      soLay++
      if (soLay === 3) return null // mot lan luong chup khong tra khung: phien phai bo qua va di tiep
      if (i < buoc.length) { tu = Math.max(0, Math.min(H - h, tu + buoc[i++])); if (tu > xa) xa = tu }
      const goc = nativeImage.createFromBitmap(Buffer.from(trang.subarray(tu * W * 4, (tu + h) * W * 4)), { width: W, height: h })
      const im = nativeImage.createFromBuffer(goc.toJPEG(85)) // dung nhu luong chup: JPEG roi moi ve main
      const s = im.getSize()
      return { buf: im.toBitmap(), w: s.width, h: s.height }
    },
    coDung: () => i >= buoc.length && soLay > buoc.length + 3, // "nguoi dung bam Xong" sau khi cuon het kich ban
    nghiMs: 5, toiDaMs: 60000, toiDaCao: 16000,
  })
  kq.phien = { lyDo: r.lyDo, ms: Date.now() - t0, dem: r.dem, w: r.anh && r.anh.w, h: r.anh && r.anh.h, xa, canCao: xa + h, soLay }
  if (r.anh) {
    let s = 0
    const n = Math.min(r.anh.h, H) * W * 4
    for (let k = 0; k < n; k += 4) s += Math.abs(r.anh.buf[k] - trang[k]) + Math.abs(r.anh.buf[k + 1] - trang[k + 1]) + Math.abs(r.anh.buf[k + 2] - trang[k + 2])
    kq.phien.lech = +(s / (n / 4 * 3)).toFixed(2)
    // Dung anh nhu main: createFromBitmap -> PNG -> doc lai
    const anh = nativeImage.createFromBitmap(r.anh.buf, { width: r.anh.w, height: r.anh.h })
    const png = anh.toPNG()
    const lai = nativeImage.createFromBuffer(png).getSize()
    kq.anh = { rong: anh.isEmpty(), png: png.length, w: lai.width, h: lai.height, jpg: anh.toJPEG(85).length }
  }
  // ── C. CA THAT 06/10 12:53: vung co VIDEO 72 % chieu cao (den 3 khung dau, roi doi hinh moi khung), qua JPEG q85 that ──
  {
    const vY0 = 130, vY1 = 560, vX0 = 40, vX1 = 860
    const bV = [0, 0, 0, 80, 120, 0, 200, 150, 90, 260, 180, 0, 140, 220, 0]
    let j = 0, tuV = 0, hat = 77
    const rnd = () => { hat = (hat * 1103515245 + 12345) & 0x7fffffff; return hat / 0x7fffffff }
    const rV = await chayPhien({
      layKhung: async () => {
        if (j < bV.length) tuV += bV[j]
        const f = Buffer.from(trang.subarray(tuV * W * 4, (tuV + h) * W * 4))
        const o = []
        for (let k = 0; k < 400; k++) o.push(j < 3 ? 0 : 30 + Math.floor(rnd() * 200))
        for (let y = 0; y < h; y++) {
          const yP = y + tuV
          if (yP < vY0 || yP >= vY1) continue
          for (let x = vX0; x < vX1; x++) { const v = o[(((yP - vY0) / 30) | 0) * 21 + (((x - vX0) / 40) | 0)]; const p = (y * W + x) * 4; f[p] = v; f[p + 1] = v; f[p + 2] = v }
        }
        j++
        const im = nativeImage.createFromBuffer(nativeImage.createFromBitmap(f, { width: W, height: h }).toJPEG(85))
        return { buf: im.toBitmap(), w: W, h }
      },
      coDung: () => j > bV.length + 2, nghiMs: 5, toiDaMs: 60000, toiDaCao: 16000,
    })
    kq.video = { lyDo: rV.lyDo, dem: rV.dem, h: rV.anh && rV.anh.h, canCao: tuV + h }
    if (rV.anh && rV.anh.h === tuV + h) { // so phan NGOAI video voi trang goc
      let s = 0, n = 0
      for (let y = 0; y < rV.anh.h; y++) {
        if (y >= vY0 - 8 && y < vY1 + 8) continue // chua 8 hang quanh mep video: JPEG lem mau qua mep
        const o = y * W * 4
        for (let k = o; k < o + W * 4; k += 4) { s += Math.abs(rV.anh.buf[k] - trang[k]) + Math.abs(rV.anh.buf[k + 1] - trang[k + 1]) + Math.abs(rV.anh.buf[k + 2] - trang[k + 2]); n += 3 }
      }
      kq.video.lech = +(s / n).toFixed(2)
    }
  }
  // Het gio: nguon khung dung yen mai, khong ai bam Xong -> phien phai tu dung o toiDaMs
  const t1 = Date.now()
  const r2 = await chayPhien({ layKhung: async () => ({ buf: Buffer.from(trang.subarray(0, h * W * 4)), w: W, h }), coDung: () => false, nghiMs: 20, toiDaMs: 400 })
  kq.hetGio = { lyDo: r2.lyDo, ms: Date.now() - t1, cao: r2.anh && r2.anh.h }
  // Khong bao gio co khung -> bo, khong treo
  const r3 = await chayPhien({ layKhung: async () => null, coDung: () => false, nghiMs: 2, toiDaMs: 5000 })
  kq.khongKhung = { lyDo: r3.lyDo, anh: !!r3.anh }
  console.log('KQ=' + JSON.stringify(kq))
  app.exit(0)
})
