'use strict'
// Bai do GIAO DIEN cap nhat trong man Cai dat (05/11/2026): mo CUA SO AN (show:false) nap that settings/index.html +
// preload-settings.js, IPC gia o main. Doc DOM + bam nut that. 2 ngon ngu. Khong man hinh, khong cua so hien.
// Chay: node scripts/test/do-cap-nhat-giao-dien.cjs   (tu goi electron; can NODE_PATH toi node_modules co electron)
const path = require('path')
if (!process.versions.electron) {
  const { spawnSync } = require('child_process')
  const exe = require('electron') // ngoai electron, require('electron') tra duong dan exe
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
  const r = spawnSync(exe, [__filename], { env, stdio: 'inherit', timeout: 90000 })
  process.exit(r.status == null ? 1 : r.status)
}

const { app, BrowserWindow, ipcMain } = require('electron')
const os = require('os')
app.setPath('userData', path.join(os.tmpdir(), 'aio-thu-cn-gd-' + process.pid))
app.on('window-all-closed', () => {}) // dong het cua so khong duoc thoat app giua bai do
let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT   ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct !== undefined ? '  -> ' + ct : '')) } }
const doi = (ms) => new Promise((r) => setTimeout(r, ms))

let lang = 'vi'
let tt = { hienTai: '0.10.1', coBanMoi: false, phienBan: null, ghiChu: { vi: '', en: '' }, link: null }
let kqKiem = null
let daMoLink = 0
const mac = (o) => Object.assign({ hienTai: '0.10.1', coBanMoi: false, phienBan: null, ghiChu: { vi: '', en: '' }, link: null }, o)

ipcMain.on('i18n:lang', (e) => { e.returnValue = lang })
ipcMain.handle('settings:get', () => ({ hotkey: 'CommandOrControl+Shift+S', def: 'CommandOrControl+Shift+S', isMac: false, saveFolder: os.tmpdir(), lang, version: '0.10.1',
  anhLoai: 'jpeg', anhChatLuong: 'cao', khayKieu: 'ngang', khaySoAnh: 5, lamMoKieu: 'mosaic' }))
ipcMain.handle('bq:get', () => null)
ipcMain.handle('capnhat:get', () => tt)
ipcMain.handle('capnhat:kiem-ngay', async () => { await doi(120); return kqKiem })
ipcMain.handle('capnhat:tai', () => { daMoLink++ })

async function mo() {
  const w = new BrowserWindow({ width: 440, height: 700, show: false, webPreferences: { preload: path.join(__dirname, '..', '..', 'src', 'preload-settings.js'), contextIsolation: true, sandbox: false } })
  await w.loadFile(path.join(__dirname, '..', '..', 'src', 'settings', 'index.html'))
  await doi(300)
  const js = (code) => w.webContents.executeJavaScript(code)
  const doc = () => js(`({ dong: document.getElementById('cn-dong').textContent, ghi: document.getElementById('cn-ghi-chu').textContent,
    tai: !document.getElementById('cn-tai').hidden, taiNhan: document.getElementById('cn-tai').textContent, kiemNhan: document.getElementById('cn-kiem').textContent,
    kiemTat: document.getElementById('cn-kiem').disabled, nhom: [...document.querySelectorAll('.nhom-ten')].map(e => e.textContent) })`)
  return { w, js, doc }
}

async function chayNgonNgu(l) {
  lang = l; const vi = l === 'vi'
  console.log('\n--- ngon ngu ' + l + ' ---')
  // A: khong co ban moi
  tt = mac({})
  let m = await mo(); let d = await m.doc()
  kiem(l + ': nhom "' + (vi ? 'Ung dung' : 'App') + '" co trong Cai dat', d.nhom.includes(vi ? 'Ứng dụng' : 'App'), JSON.stringify(d.nhom))
  kiem(l + ': khong ban moi -> dong "dang dung 0.10.1", khong nut Tai ve', d.dong === (vi ? 'Bạn đang dùng bản 0.10.1.' : 'You are on version 0.10.1.') && !d.tai && d.ghi === '', JSON.stringify(d))
  kiem(l + ': nut Kiem tra ngay dung ngon ngu', d.kiemNhan === (vi ? 'Kiểm tra ngay' : 'Check now'), d.kiemNhan)
  // bam kiem tra: moi nhat
  kqKiem = { ketQua: 'moi-nhat', trangThai: mac({}) }
  await m.js(`document.getElementById('cn-kiem').click()`); await doi(30)
  d = await m.doc()
  kiem(l + ': dang kiem: nut khoa + chu "Dang kiem tra"', d.kiemTat && /(Đang kiểm tra|Checking)/.test(d.dong), JSON.stringify(d))
  await doi(300); d = await m.doc()
  kiem(l + ': moi nhat', !d.kiemTat && d.dong === (vi ? 'Bạn đang dùng bản mới nhất (0.10.1).' : 'You have the latest version (0.10.1).'), d.dong)
  // loi im lang: chi noi nhe "chua kiem tra duoc", khong ma loi
  kqKiem = { ketQua: 'loi', trangThai: mac({}) }
  await m.js(`document.getElementById('cn-kiem').click()`); await doi(400); d = await m.doc()
  kiem(l + ': loi mang -> cau nhe, khong lo ma loi', d.dong === (vi ? 'Chưa kiểm tra được lúc này.' : 'Could not check right now.') && !/http|json|ENOTFOUND|het-gio/i.test(d.dong), d.dong)
  kqKiem = { ketQua: 'ban', trangThai: mac({}) }
  await m.js(`document.getElementById('cn-kiem').click()`); await doi(400); d = await m.doc()
  kiem(l + ': dang chup/quay -> cau rieng', d.dong === (vi ? 'Đang chụp hoặc quay, thử lại sau.' : 'Capturing or recording, try again later.'), d.dong)
  // co ban moi qua nut
  kqKiem = { ketQua: 'moi', trangThai: mac({ coBanMoi: true, phienBan: '0.11.0', ghiChu: { vi: 'Sua loi chup', en: 'Capture fixes' }, link: 'https://x.test/a.exe' }) }
  await m.js(`document.getElementById('cn-kiem').click()`); await doi(400); d = await m.doc()
  kiem(l + ': co ban moi -> dong + ghi chu dung ngon ngu + nut Tai ve', d.dong === (vi ? 'Có bản mới 0.11.0' : 'New version 0.11.0 available') && d.ghi === (vi ? 'Sua loi chup' : 'Capture fixes') && d.tai && d.taiNhan === (vi ? 'Tải về' : 'Download'), JSON.stringify(d))
  const truoc = daMoLink
  await m.js(`document.getElementById('cn-tai').click()`); await doi(100)
  kiem(l + ': bam Tai ve -> main nhan lenh mo trang', daMoLink === truoc + 1, String(daMoLink))
  m.w.destroy(); await doi(300)
  // B: mo cua so khi da co ban moi san (ghi chu thieu ngon ngu -> lay ngon ngu kia)
  tt = mac({ coBanMoi: true, phienBan: '0.12.0', ghiChu: { vi: vi ? '' : 'Chi co tieng Viet', en: vi ? 'Only English' : '' }, link: null })
  m = await mo(); d = await m.doc()
  kiem(l + ': mo san co ban moi: hien ghi chu (roi ve ngon ngu con lai), khong link -> an nut Tai ve', d.dong.includes('0.12.0') && d.ghi === (vi ? 'Only English' : 'Chi co tieng Viet') && !d.tai, JSON.stringify(d))
  m.w.destroy(); await doi(300)
  // DOI CHUNG: neu doi tt ve "khong ban moi" thi dong Tai ve phai mat
  tt = mac({}); m = await mo(); d = await m.doc()
  kiem(l + ': DOI CHUNG: khong ban moi thi nut Tai ve an', !d.tai && !/0\.12\.0/.test(d.dong), JSON.stringify(d))
  m.w.destroy(); await doi(300)
}

app.whenReady().then(async () => {
  try { await chayNgonNgu('vi'); await chayNgonNgu('en') } catch (e) { truot++; console.log('  TRUOT ngoai le: ' + (e && e.stack || e)) }
  console.log('\nTong: ' + dat + ' dat, ' + truot + ' truot')
  app.exit(truot ? 1 : 0)
})
