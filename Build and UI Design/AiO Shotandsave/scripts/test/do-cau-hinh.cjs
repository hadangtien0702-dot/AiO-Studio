'use strict'
/* Do DOC / GHI cau-hinh.json (src/kho.js) — chay: npm run test:cauhinh
   Khong bat cua so, khong can Electron (gia `electron.app.getPath`). Thu muc thu nam trong os.tmpdir(), bai nay
   tao (mkdtemp) va tu xoa.
   04/10 (ECC soat, da do tren ban cu): cau-hinh.json co BOM doc ra 0 muc -> keo khay 1 lan la file chi con `viTriKhay`,
   mat hotkey + lang + thuMucAnh + khayCo. Luat (so loi #16): ham DOC phan biet "chua co" voi "khong doc duoc"; ham GHI
   khong ghi de len thu no vua doc that bai. Cac muc [3]-[7] phai TRUOT tren ban cu. */
const Module = require('module')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const KHO = path.join(ROOT, 'src', 'kho.js')
let userData = ''
const napGoc = Module._load
Module._load = function (req) {
  if (req === 'electron') return { app: { getPath: () => userData, isPackaged: true } }
  return napGoc.apply(this, arguments)
}

let dat = 0, truot = 0
const kiem = (ten, ok, ct) => {
  if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) }
}
const BOM = String.fromCharCode(0xFEFF)
const DAY = { hotkey: 'Alt+1', lang: 'vi', thuMucAnh: 'D:/Anh', khayCo: { ngang: 300 }, viTriKhay: { x: 1, y: 2 } }
const DU_5 = Object.keys(DAY).sort().join(',')
const PATCH = { viTriKhay: { x: 9, y: 9 } }          // dung viec app lam moi lan keo khay (savePos)
const tamDaTao = []

/** "Tien trinh moi": userData rieng + nap lai kho.js (mat het thu trong RAM). */
function moi(ten) {
  userData = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-cau-hinh-' + ten + '-'))
  tamDaTao.push(userData)
  delete require.cache[require.resolve(KHO)]
  const kho = require(KHO)
  const nhatKy = []
  if (typeof kho.noiNhatKy === 'function') kho.noiNhatKy((x) => nhatKy.push(x))
  return { kho, nhatKy, dir: userData, file: path.join(userData, 'cau-hinh.json') }
}
const mucTrenDia = (file) => {
  let s = fs.readFileSync(file, 'utf8')
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
  return Object.keys(JSON.parse(s)).sort().join(',')
}
const banHong = (dir) => fs.readdirSync(dir).filter((f) => f.startsWith('cau-hinh.hong-') && f.endsWith('.json'))
/** chmod 000 co chan duoc doc khong (Windows: khong) */
function chanDoc(file) {
  fs.chmodSync(file, 0o000)
  try { fs.readFileSync(file); return false } catch (e) { return true }
}

console.log('\n[1] Chua co file (lan chay dau)')
{
  const m = moi('moi')
  kiem('doc ra {} (khong nem loi)', JSON.stringify(m.kho.docCauHinh()) === '{}')
  const r = m.kho.ghiCauHinh({ lang: 'en' })
  kiem('ghi tao file moi, dung noi dung, khong de lai .tmp', r.lang === 'en' && mucTrenDia(m.file) === 'lang' && !fs.existsSync(m.file + '.tmp'))
}

console.log('\n[2] Doi chung: file sach')
{
  const m = moi('sach')
  fs.writeFileSync(m.file, JSON.stringify(DAY))
  kiem('doc ra du 5 muc', Object.keys(m.kho.docCauHinh()).sort().join(',') === DU_5)
  m.kho.ghiCauHinh(PATCH)
  kiem('keo khay 1 lan: van du 5 muc, viTriKhay da doi', mucTrenDia(m.file) === DU_5 && m.kho.docCauHinh().viTriKhay.x === 9, mucTrenDia(m.file))
}

console.log('\n[3] File co BOM (mo bang Notepad roi luu)')
{
  const m = moi('bom')
  fs.writeFileSync(m.file, BOM + JSON.stringify(DAY))
  const c = m.kho.docCauHinh()
  kiem('doc ra du 5 muc (truoc: 0 muc)', Object.keys(c).sort().join(',') === DU_5, Object.keys(c).join(',') || '(rong)')
  m.kho.ghiCauHinh(PATCH)
  kiem('keo khay 1 lan: van du 5 muc (truoc: chi con viTriKhay)', mucTrenDia(m.file) === DU_5, mucTrenDia(m.file))
  kiem('phim tat + thu muc anh con nguyen', m.kho.docCauHinh().hotkey === 'Alt+1' && m.kho.docCauHinh().thuMucAnh === 'D:/Anh')
}

console.log('\n[4] File HONG that (JSON cut giua chung)')
{
  const m = moi('hong')
  const noiDung = '{"hotkey":"Alt+1","lang":'
  fs.writeFileSync(m.file, noiDung)
  const c = m.kho.docCauHinh()
  const cat = banHong(m.dir)
  kiem('doc ra {} (ve mac dinh), khong nem loi', JSON.stringify(c) === '{}')
  kiem('ban hong duoc CAT sang ben, con nguyen noi dung (lay lai tay duoc)', cat.length === 1 && fs.readFileSync(path.join(m.dir, cat[0]), 'utf8') === noiDung, JSON.stringify(cat))
  kiem('co ghi nhat ky (khong im lang)', m.nhatKy.some((x) => x.includes('HONG')), JSON.stringify(m.nhatKy))
  m.kho.ghiCauHinh(PATCH)
  kiem('ghi tiep duoc, ban hong van nam do', mucTrenDia(m.file) === 'viTriKhay' && banHong(m.dir).length === 1)
}

console.log('\n[5] File khong phai object (mang / chuoi / null)')
for (const [ten, noiDung] of [['mang', '[1,2]'], ['chuoi', '"x"'], ['null', 'null'], ['rong', '']]) {
  const m = moi('kieu')
  fs.writeFileSync(m.file, noiDung)
  const c = m.kho.docCauHinh()
  kiem(ten + ': doc ra {} + cat ban hong + ghi nhat ky', JSON.stringify(c) === '{}' && banHong(m.dir).length === 1 && m.nhatKy.length > 0, JSON.stringify({ c, cat: banHong(m.dir), nk: m.nhatKy }))
}

console.log('\n[6] Co file ma KHONG DOC DUOC, tien trinh vua mo (chua doc duoc lan nao)')
{
  const m = moi('khoa')
  fs.writeFileSync(m.file, JSON.stringify(DAY))
  if (!chanDoc(m.file)) console.log('  BO QUA  (he dieu hanh nay chmod khong chan duoc doc)')
  else {
    kiem('doc ra {} tam thoi, khong nem loi', JSON.stringify(m.kho.docCauHinh()) === '{}')
    const r = m.kho.ghiCauHinh(PATCH)
    kiem('ham ghi van tra ban ghep cho lan nay (app chay tiep)', !!r && !!r.viTriKhay && r.viTriKhay.x === 9)
    fs.chmodSync(m.file, 0o600)
    kiem('file tren dia KHONG bi ghi de: con du 5 muc, viTriKhay cu (truoc: chi con viTriKhay)', mucTrenDia(m.file) === DU_5 && JSON.parse(fs.readFileSync(m.file, 'utf8')).viTriKhay.x === 1, mucTrenDia(m.file))
    kiem('co ghi nhat ky KHONG DOC DUOC + BO QUA lan ghi', m.nhatKy.some((x) => x.includes('KHONG DOC DUOC')) && m.nhatKy.some((x) => x.includes('BO QUA')), JSON.stringify(m.nhatKy))
    kiem('doc lai duoc roi: du 5 muc', Object.keys(m.kho.docCauHinh()).sort().join(',') === DU_5)
  }
  try { fs.chmodSync(m.file, 0o600) } catch (e) {}
}

console.log('\n[7] Dang chay (da doc duoc 1 lan) roi file KHONG DOC DUOC')
{
  const m = moi('ram')
  fs.writeFileSync(m.file, JSON.stringify(DAY))
  m.kho.docCauHinh()                                   // lan doc tot -> co ban trong RAM
  if (!chanDoc(m.file)) console.log('  BO QUA  (he dieu hanh nay chmod khong chan duoc doc)')
  else {
    const c = m.kho.docCauHinh()
    kiem('doc tra ban trong RAM: thu muc anh + phim tat KHONG roi ve mac dinh (truoc: {})', c.thuMucAnh === 'D:/Anh' && c.hotkey === 'Alt+1', JSON.stringify(c))
    m.kho.ghiCauHinh(PATCH)
    try { fs.chmodSync(m.file, 0o600) } catch (e) {}
    kiem('ghi tu ban trong RAM: dia van du 5 muc', mucTrenDia(m.file) === DU_5, mucTrenDia(m.file))
  }
  try { fs.chmodSync(m.file, 0o600) } catch (e) {}
}

for (const d of tamDaTao) { try { fs.rmSync(d, { recursive: true, force: true }) } catch (e) {} }   // chi thu muc mkdtemp cua bai nay
console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
process.exit(truot ? 1 : 0)
