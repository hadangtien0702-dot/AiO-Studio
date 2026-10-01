/* =========================================================================
   NAP BAN MOI THANG VAO APP DANG CAI — khong tao bo cai (anh Tien chot 01/10/2026):
   "moi lan update em chi can cai vao ban hien tai, khong cai bo cai moi; khi nao test xong het thi em moi dong goi
    va push code len git va update tinh nang len website".
   Chay:  node scripts/cai-tai-cho.mjs            (dung dist/win-unpacked roi nap)
          node scripts/cai-tai-cho.mjs --chi-dung (chi dung, khong dung toi ban cai — de do ban dong goi truoc)
          node scripts/cai-tai-cho.mjs --bo-qua-dung (nap ban da dung san)
   Lam gi: electron-builder --win dir -> so bo may Electron cua ban dung voi ban cai (khac thi DUNG, phai cai bang bo
   cai) -> dem anh / dai / video cua nguoi dung -> tat app -> CAT ban cu (app.asar + app.asar.unpacked) vao
   .selftest/ban-cai-truoc/ -> chep ban moi -> mo lai app qua explorer.exe (ngoai container cua Claude) -> doc dong
   `boot v...` trong run-log -> dem lai anh / dai / video (phai bang truoc).
   ☠️ File .exe cua ban cai KHONG doi nen ProductVersion van la so cu — kiem bang dong boot / so tren menu khay.
   ☠️ Chi dung toi 2 thu trong thu muc cai: resources/app.asar va resources/app.asar.unpacked. Anh / cau hinh / ban
      quyen cua nguoi dung nam NGOAI thu muc cai (so loi #11) nen khong bi dung toi; van dem truoc/sau cho chac.
   Chi Windows.
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { spawnSync, spawn, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHI_DUNG = process.argv.includes('--chi-dung')
const BO_QUA_DUNG = process.argv.includes('--bo-qua-dung')
const TEN_EXE = 'AiO Shot & Save.exe'
const DUNG = path.join(ROOT, 'dist', 'win-unpacked')
const CAI = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'aio-shot-and-save')
/* ☠️ 01/10 THUOC MU (lan chay dau): script chay tu Claude nam trong container MSIX -> `%APPDATA%\AiO Shot & Save` la
   BAN AO cu tu 16/09 (run-log, cau-hinh.json cu de len ban that) -> bao "KHONG thay dong boot moi" va dem nham
   "88 anh trong Downloads" trong khi app that da boot v0.8.0 va thu muc anh that co 589 file. Duong
   `\\localhost\C$\...` di vong qua chia se mang nen doc duoc file THAT (do: ban ao sua 16/09 10:38, ban that 01/10
   10:07). Khong vao duoc chia se (may khong co quyen admin) thi roi ve duong thuong va NOI RA. */
const duongThat = (p) => {
  const m = /^([A-Za-z]):\\(.*)$/.exec(p)
  if (!m) return p
  const unc = '\\\\localhost\\' + m[1] + '$\\' + m[2]
  try { fs.accessSync(unc); return unc } catch (e) { return p }
}
const USERDATA_THUONG = path.join(process.env.APPDATA || '', 'AiO Shot & Save')
const USERDATA = duongThat(USERDATA_THUONG)
if (USERDATA === USERDATA_THUONG) console.log('(!) Khong doc duoc qua \\\\localhost — neu chay tu Claude thi nhat ky/cau hinh duoi day co the la BAN AO cu)')
const CHI_KIEM = process.argv.includes('--chi-kiem') // chi bao ban dang cai + dong boot cuoi, khong doi gi
const RUN_LOG = path.join(USERDATA, 'run-log.txt')
const CAT = path.join(ROOT, '.selftest', 'ban-cai-truoc')
const banMoi = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version

const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')
const demFile = (d) => { let n = 0; const di = (x) => { for (const e of fs.readdirSync(x, { withFileTypes: true })) { if (e.isDirectory()) di(path.join(x, e.name)); else n++ } }; if (fs.existsSync(d)) di(d); return n }
const ngu = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
const dung = (ly) => { console.error('\nDUNG LAI: ' + ly); process.exit(1) }
const dangChay = () => { try { return execFileSync('tasklist', ['/FI', 'IMAGENAME eq ' + TEN_EXE, '/FO', 'CSV', '/NH'], { encoding: 'utf8' }).split('\n').filter((l) => l.includes(TEN_EXE)).length } catch (e) { return 0 } }

if (process.platform !== 'win32') dung('script nay chi cho Windows')

if (CHI_KIEM) {
  const a = path.join(CAI, 'resources', 'app.asar'), d = path.join(DUNG, 'resources', 'app.asar')
  let boot = '(khong doc duoc run-log)'
  try { boot = fs.readFileSync(RUN_LOG, 'utf8').split('\n').filter((l) => l.includes(' boot v')).pop() || '(chua co dong boot)' } catch (e) {}
  console.log('Ban cai : ' + CAI + ' · app.asar md5 ' + (fs.existsSync(a) ? md5(a).slice(0, 8) : 'KHONG CO'))
  console.log('Ban dung: ' + (fs.existsSync(d) ? 'md5 ' + md5(d).slice(0, 8) + (fs.existsSync(a) && md5(a) === md5(d) ? ' = ban cai' : ' KHAC ban cai') : 'chua dung'))
  console.log('Dang chay: ' + dangChay() + ' tien trinh · boot cuoi: ' + boot.trim())
  console.log('Nhat ky doc tu: ' + RUN_LOG)
  process.exit(0)
}

// 1) DUNG ban dong goi (thu muc, khong nen NSIS)
if (!BO_QUA_DUNG) {
  console.log('[1] Dung dist/win-unpacked (electron-builder --win dir) ...')
  const t0 = Date.now()
  const r = spawnSync('npx electron-builder --win dir', { cwd: ROOT, shell: true, encoding: 'utf8' })
  if (r.status !== 0) dung('electron-builder loi:\n' + String(r.stdout || '').split('\n').slice(-12).join('\n') + '\n' + String(r.stderr || '').split('\n').slice(-12).join('\n'))
  console.log('    xong ' + Math.round((Date.now() - t0) / 1000) + ' s')
}
const asarMoi = path.join(DUNG, 'resources', 'app.asar'), unpMoi = path.join(DUNG, 'resources', 'app.asar.unpacked')
if (!fs.existsSync(asarMoi)) dung('khong thay ' + asarMoi)
console.log('    ban dung: v' + banMoi + ' · app.asar ' + Math.round(fs.statSync(asarMoi).size / 1024) + ' KB (md5 ' + md5(asarMoi).slice(0, 8) + ') · unpacked ' + demFile(unpMoi) + ' file')
if (CHI_DUNG) { console.log('\n--chi-dung: KHONG dung toi ban cai. Do ban dong goi: AIO_THU_EXE="' + path.join(DUNG, TEN_EXE) + '" npm run test:quayapp'); process.exit(0) }

// 2) Ban cai co that khong, bo may Electron co GIONG khong
const asarCu = path.join(CAI, 'resources', 'app.asar'), unpCu = path.join(CAI, 'resources', 'app.asar.unpacked')
if (!fs.existsSync(asarCu)) dung('khong thay ban cai o ' + CAI + ' (may nay chua cai app -> dung bo cai)')
const lech = ['ffmpeg.dll', 'resources.pak', 'v8_context_snapshot.bin', 'libGLESv2.dll'].filter((f) => !fs.existsSync(path.join(CAI, f)) || md5(path.join(CAI, f)) !== md5(path.join(DUNG, f)))
if (lech.length) dung('bo may Electron cua ban cai KHAC ban dung (' + lech.join(', ') + ') -> nap app.asar khong du, phai cai bang bo cai (npm run dist)')
console.log('[2] Ban cai: ' + CAI + ' · bo may Electron giong ban dung (4/4 file khop)')

// 3) Dem do cua nguoi dung TRUOC (chi doc)
let cauHinh = {}
try { cauHinh = JSON.parse(fs.readFileSync(path.join(USERDATA, 'cau-hinh.json'), 'utf8')) } catch (e) {}
const thuMucAnh = cauHinh.thuMucAnh || path.join(process.env.LOCALAPPDATA || '', 'shotandsave')
const dem = () => ({
  anh: fs.existsSync(thuMucAnh) ? fs.readdirSync(thuMucAnh).filter((f) => /\.(png|jpe?g|mp4|webm)$/i.test(f)).length : -1,
  dai: fs.existsSync(path.join(USERDATA, 'storyboard')) ? fs.readdirSync(path.join(USERDATA, 'storyboard')).length : 0,
  cauHinh: fs.existsSync(path.join(USERDATA, 'cau-hinh.json')) ? md5(path.join(USERDATA, 'cau-hinh.json')).slice(0, 8) : '-',
  banQuyen: fs.existsSync(path.join(USERDATA, 'ban-quyen.json')),
})
const truoc = dem()
console.log('[3] Truoc: ' + truoc.anh + ' anh/video trong ' + thuMucAnh + ' · ' + truoc.dai + ' dai Storyboard · cau hinh ' + truoc.cauHinh)

// 4) Tat app dang chay
const soTruoc = dangChay()
if (soTruoc) {
  try { execFileSync('taskkill', ['/IM', TEN_EXE, '/F', '/T'], { stdio: 'ignore' }) } catch (e) {}
  for (let i = 0; i < 40 && dangChay(); i++) ngu(250)
  if (dangChay()) dung('khong tat duoc app dang chay')
}
console.log('[4] Da tat app (' + soTruoc + ' tien trinh)')

// 5) Cat ban cu (chi giu 1 ban cat gan nhat) roi chep ban moi. Hong giua chung -> tra ban cu ve.
fs.rmSync(CAT, { recursive: true, force: true })
fs.mkdirSync(CAT, { recursive: true })
fs.copyFileSync(asarCu, path.join(CAT, 'app.asar'))
fs.cpSync(unpCu, path.join(CAT, 'app.asar.unpacked'), { recursive: true })
const md5Cu = md5(asarCu)
console.log('[5] Da cat ban cu vao ' + CAT + ' (app.asar md5 ' + md5Cu.slice(0, 8) + ', ' + demFile(path.join(CAT, 'app.asar.unpacked')) + ' file unpacked)')
try {
  fs.copyFileSync(asarMoi, asarCu)
  fs.rmSync(unpCu, { recursive: true, force: true })
  fs.cpSync(unpMoi, unpCu, { recursive: true })
  if (md5(asarCu) !== md5(asarMoi) || demFile(unpCu) !== demFile(unpMoi)) throw new Error('chep xong nhung khong khop ban dung')
} catch (e) {
  console.error('    LOI khi chep: ' + e.message + ' -> tra ban cu ve')
  fs.copyFileSync(path.join(CAT, 'app.asar'), asarCu)
  fs.rmSync(unpCu, { recursive: true, force: true })
  fs.cpSync(path.join(CAT, 'app.asar.unpacked'), unpCu, { recursive: true })
  dung('da tra ban cu ve (md5 ' + md5(asarCu).slice(0, 8) + '), app chua doi')
}
console.log('    Da nap: app.asar md5 ' + md5(asarCu).slice(0, 8) + ' = ban dung · unpacked ' + demFile(unpCu) + ' file')

// 6) Mo lai app qua explorer.exe (ngoai container MSIX cua Claude) + doc dong boot
let coLog = 0
try { coLog = fs.statSync(RUN_LOG).size } catch (e) {}
spawn('explorer.exe', [path.join(CAI, TEN_EXE)], { detached: true, stdio: 'ignore' }).unref()
let boot = ''
for (let i = 0; i < 80 && !boot; i++) {
  ngu(250)
  try {
    const s = fs.readFileSync(RUN_LOG, 'utf8')
    // file co the vua bi cat (qua 300 KB) -> doc ca file neu ngan hon moc cu
    const moi = s.length >= coLog ? s.slice(coLog) : s
    const m = moi.split('\n').filter((l) => l.includes(' boot v')).pop()
    if (m) boot = m.trim()
  } catch (e) {}
}
console.log('[6] Mo lai app: ' + dangChay() + ' tien trinh · ' + (boot || 'KHONG thay dong boot moi trong ' + RUN_LOG))

// 7) Dem lai do cua nguoi dung
const sau = dem()
const giong = truoc.anh === sau.anh && truoc.dai === sau.dai && truoc.cauHinh === sau.cauHinh && truoc.banQuyen === sau.banQuyen
console.log('[7] Sau:   ' + sau.anh + ' anh/video · ' + sau.dai + ' dai · cau hinh ' + sau.cauHinh + ' -> ' + (giong ? 'GIONG truoc' : 'KHAC TRUOC'))

const dat = boot.includes('boot v' + banMoi + ' ') && boot.includes('dang-ky=OK') && giong && dangChay() > 0
console.log('\n' + (dat ? 'XONG: app dang chay ban v' + banMoi + ' (nap tai cho, khong tao bo cai).' : 'CHUA DAT — xem cac dong tren. Tra ban cu: chep ' + CAT + '\\app.asar + app.asar.unpacked ve ' + path.join(CAI, 'resources')))
if (!dat) process.exit(1)
