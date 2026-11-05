/* 04/11/2026 Bai do MO CUNG WINDOWS (npm run test:mocungmay). Chi Windows. Chay an, khong cua so nao hien.
   Phan 1: ghi THAT vao HKCU\...\Run bang mot TEN THU rieng (khong dung dong cua app), doc lai bang reg.exe (duong khac voi API
   da ghi, luat 5l), don dung ten do. Phan 2: mo man Cai dat that voi IPC gia, bam cong tac, do chu + tran o hai ngon ngu.
   Doi chung: chua goi gi thi registry phai KHONG co dong; ban chay tu nguon phai khong ghi gi. */
'use strict'
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { execFileSync } = require('child_process')
const mc = require('../../src/mo-cung-may')
const i18n = require('../../src/i18n')

const TEN = 'AiO-thu-mo-cung-' + process.pid
const RUN = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const DUYET = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
const O = { ten: TEN, duong: process.execPath }
app.setAppUserModelId(TEN) // Electron chi doc dong mang ten AppUserModelID, giong app that
app.on('window-all-closed', () => {}) // khong thi dong cua so dau tien la app tu thoat giua bai
let dat = 0, truot = 0
const kiem = (ten, ok, them) => { ok ? dat++ : truot++; console.log((ok ? 'DAT   ' : 'TRUOT ') + ten + (them ? '  [' + them + ']' : '')) }
const reg = (a) => { try { return execFileSync('reg.exe', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch (e) { return '' } }
const dong = (khoa) => reg(['query', khoa, '/v', TEN])
const don = () => { reg(['delete', RUN, '/v', TEN, '/f']); reg(['delete', DUYET, '/v', TEN, '/f']) }

// app gia: API that cua Electron, chi noi la ban dong goi va dem so lan ghi
function appThu(isPackaged) {
  const a = { isPackaged, ghi: 0,
    getLoginItemSettings: (o) => app.getLoginItemSettings(o),
    setLoginItemSettings: (o) => { a.ghi++; app.setLoginItemSettings(o) } }
  return a
}
function khoThu(c) { return { c, docCauHinh() { return this.c }, ghiCauHinh(p) { this.c = Object.assign({}, this.c, p) } } }
const log = []
const ghiLog = (s) => log.push(s)

async function phanRegistry() {
  don()
  const a = appThu(true), kho = khoThu({})
  kiem('doi chung: chua goi gi thi Run khong co dong', dong(RUN) === '')
  kiem('doi chung: trang thai bao chua bat', mc.trangThai(a, O).bat === false)

  mc.khoiDong(a, kho, ghiLog, O)
  const d1 = dong(RUN)
  kiem('lan dau: Run co dong', d1.includes(TEN))
  kiem('lan dau: dong tro dung file exe, co dau nhay', d1.includes('"' + process.execPath + '"'), d1.trim().split('\n').pop().trim())
  kiem('lan dau: cau hinh ghi true', kho.c.moCungMay === true)
  kiem('lan dau: ghi dung 1 lan', a.ghi === 1)

  a.ghi = 0
  mc.khoiDong(a, kho, ghiLog, O)
  kiem('boot lan 2: khong ghi lai', a.ghi === 0)

  // Nguoi dung tat trong Task Manager: Run con dong, StartupApproved byte dau = 03
  reg(['add', DUYET, '/v', TEN, '/t', 'REG_BINARY', '/d', '030000000000000000000000', '/f'])
  kiem('doi chung: da ghi duoc dong chan', dong(DUYET).includes('0300'))
  const t = mc.trangThai(a, O)
  kiem('Task Manager tat: bao bi chan', t.bat === true && t.biChan === true, JSON.stringify(t))
  a.ghi = 0
  mc.khoiDong(a, kho, ghiLog, O)
  kiem('Task Manager tat: boot KHONG de len', a.ghi === 0 && dong(DUYET).includes('0300'))
  reg(['add', DUYET, '/v', TEN, '/t', 'REG_BINARY', '/d', '020000000000000000000000', '/f'])
  kiem('byte chan 02 (dang cho chay): khong bao bi chan', mc.trangThai(a, O).biChan === false)
  reg(['add', DUYET, '/v', TEN, '/t', 'REG_BINARY', '/d', '030000000000000000000000', '/f'])
  const t2 = mc.dat(a, kho, ghiLog, true, O)
  kiem('bam Bat trong Cai dat: het bi chan', t2.bat === true && t2.biChan === false, JSON.stringify(t2))

  const t3 = mc.dat(a, kho, ghiLog, false, O)
  kiem('bam Tat: Run het dong', dong(RUN) === '' && t3.bat === false)
  kiem('bam Tat: cau hinh ghi false', kho.c.moCungMay === false)
  a.ghi = 0
  mc.khoiDong(a, kho, ghiLog, O)
  kiem('da Tat: boot khong tu bat lai', a.ghi === 0 && dong(RUN) === '')

  mc.dat(a, kho, ghiLog, true, O)
  kiem('bam Bat lai: Run co dong', dong(RUN).includes(TEN))
  reg(['delete', RUN, '/v', TEN, '/f'])
  a.ghi = 0
  mc.khoiDong(a, kho, ghiLog, O)
  kiem('dong bi mat ma chua tat: boot tu ghi lai', a.ghi === 1 && dong(RUN).includes(TEN))
  don()

  const nguon = appThu(false), kn = khoThu({})
  mc.khoiDong(nguon, kn, ghiLog, O)
  kiem('ban chay tu nguon: khong ghi gi', nguon.ghi === 0 && dong(RUN) === '' && kn.c.moCungMay === undefined)
  const mac = appThu(true), km = khoThu({})
  mc.khoiDong(mac, km, ghiLog, Object.assign({ nen: 'darwin' }, O))
  kiem('macOS: khong ghi gi', mac.ghi === 0 && mc.trangThai(mac, Object.assign({ nen: 'darwin' }, O)).hoTro === false)
}

async function phanGiaoDien() {
  const R = path.join(__dirname, '..', '..')
  const dir = process.env.AIO_ANH_RA || ''
  let lang = 'vi', moCung = { hoTro: true, bat: true, biChan: false }, lanGoi = []
  ipcMain.on('i18n:lang', (e) => { e.returnValue = lang })
  ipcMain.handle('settings:get', () => ({ hotkey: 'CommandOrControl+Shift+S', def: 'CommandOrControl+Shift+S', isMac: false, saveFolder: 'C:\\Users\\a\\AnhChup',
    lang, version: '0.10.1', anhLoai: 'jpeg', anhChatLuong: 'cao', khayKieu: 'ngang', khaySoAnh: 5, khayTuThu: 5, lamMoKieu: 'mosaic', moCung }))
  ipcMain.handle('settings:set-mo-cung', (_e, b) => { lanGoi.push(b); moCung = { hoTro: true, bat: b, biChan: false }; return moCung })
  ipcMain.handle('bq:get', () => ({ trangThai: 'dung-thu', conLai: 5, tong: 14 }))

  async function mo(rong) {
    const w = new BrowserWindow({ show: false, width: rong, height: 900, webPreferences: { preload: path.join(R, 'src/preload-settings.js'), sandbox: false, contextIsolation: true } })
    await w.loadFile(path.join(R, 'src/settings/index.html'))
    await new Promise((r) => setTimeout(r, 300))
    return w
  }
  const doc = (w) => w.webContents.executeJavaScript(`(() => {
    const n = document.getElementById('nhom-ung-dung'), t = document.getElementById('nhom-ung-dung-ten'), box = document.getElementById('mo-cung')
    const c = box.querySelector('.chon-nut.chon'), nhan = n.querySelector('.nhan-chon')
    const hang = n.querySelector('.hang').getBoundingClientRect(), hb = box.getBoundingClientRect(), hn = nhan.getBoundingClientRect()
    return { an: n.hidden, anTen: t.hidden, tieuDe: t.textContent, nhan: nhan.textContent, chon: c ? c.dataset.v : null,
      nut: [...box.querySelectorAll('.chon-nut')].map((b) => b.textContent), msg: document.getElementById('msg-mo-cung').textContent,
      cao: Math.round(n.getBoundingClientRect().height), tran: hb.right > hang.right + 0.5, de: hn.right > hb.left, tranTrang: document.documentElement.scrollWidth > innerWidth }
  })()`)

  for (const l of ['vi', 'en']) {
    lang = l
    moCung = { hoTro: true, bat: true, biChan: false }
    const w = await mo(420)
    const d = await doc(w)
    const T = (k) => i18n.t(l, k)
    kiem(l + ': nhom hien, chu dung', !d.an && !d.anTen && d.tieuDe === T('set.nhom.ungDung') && d.nhan === T('set.moCung.tieuDe'), d.nhan)
    kiem(l + ': hai nut co chu, dang chon Bat', d.nut.join('|') === T('set.moCung.bat') + '|' + T('set.moCung.tat') && d.chon === '1', d.nut.join('|'))
    kiem(l + ': khong tran, khong de', !d.tran && !d.de && !d.tranTrang)
    if (l === 'vi') {
      lanGoi = []
      await w.webContents.executeJavaScript(`document.querySelector('#mo-cung [data-v="0"]').click()`)
      await new Promise((r) => setTimeout(r, 150))
      const d2 = await doc(w)
      kiem('bam Tat: goi main dung 1 lan, nut doi', lanGoi.length === 1 && lanGoi[0] === false && d2.chon === '0')
      await w.webContents.executeJavaScript(`document.querySelector('#mo-cung [data-v="0"]').click()`)
      await new Promise((r) => setTimeout(r, 150))
      kiem('bam lai nut dang chon: khong goi them', lanGoi.length === 1)
      if (dir) { await w.webContents.executeJavaScript(`document.getElementById('nhom-ung-dung').scrollIntoView()`); await new Promise((r) => setTimeout(r, 200)) }
    }
    w.destroy()
  }
  lang = 'vi'
  moCung = { hoTro: true, bat: true, biChan: true }
  let w = await mo(420)
  let d = await doc(w)
  kiem('bi chan: hien loi nhac, nut o Tat', d.msg === i18n.t('vi', 'set.moCung.biChan') && d.chon === '0', d.msg)
  if (dir) {
    await w.webContents.executeJavaScript(`document.getElementById('nhom-ung-dung').scrollIntoView({block:'end'})`)
    await new Promise((r) => setTimeout(r, 200))
    fs.writeFileSync(path.join(dir, 'cai-dat-mo-cung.png'), (await w.webContents.capturePage()).toPNG())
  }
  w.destroy()
  moCung = { hoTro: false, bat: false, biChan: false }
  w = await mo(420)
  d = await doc(w)
  kiem('khong ho tro: an ca nhom', d.an && d.anTen)
  w.destroy()
}

app.whenReady().then(async () => {
  if (process.platform !== 'win32') { console.log('Chi chay tren Windows'); app.exit(0); return }
  try { await phanRegistry(); await phanGiaoDien() } catch (e) { truot++; console.log('LOI ' + (e && e.stack || e)) }
  don()
  kiem('don xong: registry khong con ten thu', dong(RUN) === '' && dong(DUYET) === '')
  console.log('\n' + dat + ' dat, ' + truot + ' truot')
  app.exit(truot ? 1 : 0)
})
