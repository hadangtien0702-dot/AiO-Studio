/* =========================================================================
   NAP BAN MOI THANG VAO APP DANG CAI — ban MAC cua scripts/cai-tai-cho.mjs.
   Anh Tien chot 01/10/2026, nhac lai 04/10: "cai vao ban hien tai luon khong cai ban moi - khi nao anh keu cai ban moi
   cai nhe".
   Chay:  node scripts/cai-tai-cho-mac.mjs               (dung dist/mac roi nap)
          node scripts/cai-tai-cho-mac.mjs --chi-kiem    (chi bao ban dang cai, khong doi gi)
          node scripts/cai-tai-cho-mac.mjs --chi-dung    (chi dung, khong dung toi ban cai)
          node scripts/cai-tai-cho-mac.mjs --bo-qua-dung (nap ban da dung san trong dist/mac)
   Lam gi: electron-builder --mac --x64 --dir -> kiem ban cai cung phien ban Electron + khoa kiem ruot app dang TAT ->
   dem anh / dai / cau hinh cua nguoi dung -> tat app -> CAT ruot cu vao
   ~/Library/Application Support/AiO-Studio/ban-cai-truoc/shotandsave-ruot-<ngay-gio>/ (moi lan mot thu muc, KHONG xoa
   ban cat nao) -> chep ruot moi -> mo lai app -> doc dong `boot v...` + dong `LUONG:` trong run-log -> dem lai.

   VI SAO KHONG THAY CA .app: app ky ad-hoc nen macOS nhan app bang ma bam cua file chay chinh (CDHash). Thay ca .app la
   CDHash doi -> anh phai bat lai quyen Ghi man hinh (da xay ra 04/10 01:56 va 13:52). Chi thay RUOT (app.asar) thi file
   chay chinh + Info.plist + _CodeSignature KHONG doi -> CDHash giu nguyen. KHONG ky lai (ky lai la CDHash doi).
   He qua biet truoc: `codesign --verify` bao niem phong tai nguyen khong khop — binh thuong voi cach nap nay; ban phat
   hanh that van phai dung + ky day du. Info.plist van ghi so phien ban cu: kiem ban dang chay bang dong `boot v...`.
   Dieu kien: khoa EnableEmbeddedAsarIntegrityValidation cua ban cai phai TAT (bat thi doi ruot la app khong mo duoc).
   Chi dung toi 2 thu trong .app: Contents/Resources/app.asar va app.asar.unpacked (cai sau chi khi noi dung khac).
   Anh / cau hinh / ban quyen cua nguoi dung nam NGOAI .app; van dem truoc/sau cho chac. Chi macOS.
   ========================================================================= */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync, spawn, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHI_KIEM = process.argv.includes('--chi-kiem')
const CHI_DUNG = process.argv.includes('--chi-dung')
const BO_QUA_DUNG = process.argv.includes('--bo-qua-dung')
const TEN = 'AiO Shot & Save'
const CAI = path.join('/Applications', TEN + '.app')
const DUNG = path.join(ROOT, 'dist', 'mac', TEN + '.app')
const USERDATA = path.join(os.homedir(), 'Library', 'Application Support', TEN)
const RUN_LOG = path.join(USERDATA, 'run-log.txt')
const GOC_CAT = path.join(os.homedir(), 'Library', 'Application Support', 'AiO-Studio', 'ban-cai-truoc')
const banMoi = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version
const ruot = (app) => ({ asar: path.join(app, 'Contents', 'Resources', 'app.asar'), unp: path.join(app, 'Contents', 'Resources', 'app.asar.unpacked') })

const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')
const ngu = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
const dung = (ly) => { console.error('\nDUNG LAI: ' + ly); process.exit(1) }
/** Danh sach file (duong dan tuong doi + md5) cua mot thu muc, da sap xep -> so hai thu muc bang noi dung. */
function dsFile(d) {
  const kq = []
  const di = (x, rel) => {
    for (const e of fs.readdirSync(x, { withFileTypes: true })) {
      const p = path.join(x, e.name), r = rel ? rel + '/' + e.name : e.name
      if (e.isDirectory()) di(p, r); else if (e.isFile()) kq.push(r + ' ' + md5(p))
    }
  }
  if (fs.existsSync(d)) di(d, '')
  return kq.sort()
}
/** PID cua tien trinh CHINH cua ban cai (khong tinh cac Helper nam trong Contents/Frameworks). */
function dangChay() {
  try {
    return execFileSync('pgrep', ['-f', path.join(CAI, 'Contents', 'MacOS', TEN)], { encoding: 'utf8' })
      .split('\n').map((s) => parseInt(s, 10)).filter((n) => n > 0 && n !== process.pid)
  } catch (e) { return [] } // pgrep thoat 1 khi khong tim thay
}
const cdhash = (app) => {
  const r = spawnSync('codesign', ['-dvvv', app], { encoding: 'utf8' })
  const m = /CDHash=([0-9a-f]+)/.exec(String(r.stderr || '') + String(r.stdout || ''))
  return m ? m[1] : '(khong doc duoc)'
}
const plist = (file, khoa) => {
  try { return execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :' + khoa, file], { encoding: 'utf8' }).trim() } catch (e) { return '' }
}
const electronCua = (app) => plist(path.join(app, 'Contents', 'Frameworks', 'Electron Framework.framework', 'Versions', 'A', 'Resources', 'Info.plist'), 'CFBundleVersion')
/** Khoa kiem ruot app (EnableEmbeddedAsarIntegrityValidation): true = BAT, false = tat, null = khong doc duoc. */
async function khoaRuotBat(app) {
  try {
    const f = createRequire(import.meta.url)('@electron/fuses')
    const day = await f.getCurrentFuseWire(app)
    return day[f.FuseV1Options.EnableEmbeddedAsarIntegrityValidation] === 49 // 49 = '1' = bat, 48 = '0' = tat
  } catch (e) { return null }
}
const docLog = () => { try { return fs.readFileSync(RUN_LOG, 'utf8') } catch (e) { return '' } }
const bootCuoi = (s) => (s.split('\n').filter((l) => l.includes(' boot v')).pop() || '').trim()

if (process.platform !== 'darwin') dung('script nay chi cho macOS (Windows: node scripts/cai-tai-cho.mjs)')

if (CHI_KIEM) {
  const c = ruot(CAI), d = ruot(DUNG)
  console.log('Ban cai : ' + CAI + ' · app.asar md5 ' + (fs.existsSync(c.asar) ? md5(c.asar).slice(0, 8) : 'KHONG CO') + ' · CDHash ' + cdhash(CAI))
  console.log('Ban dung: ' + (fs.existsSync(d.asar) ? 'md5 ' + md5(d.asar).slice(0, 8) + (fs.existsSync(c.asar) && md5(c.asar) === md5(d.asar) ? ' = ban cai' : ' KHAC ban cai') : 'chua dung'))
  console.log('Electron: ban cai ' + electronCua(CAI) + ' · ban dung ' + (electronCua(DUNG) || '-') + ' · khoa kiem ruot app: ' + ((await khoaRuotBat(CAI)) === false ? 'tat' : 'BAT / khong doc duoc'))
  console.log('Dang chay: ' + dangChay().length + ' tien trinh chinh · boot cuoi: ' + (bootCuoi(docLog()) || '(chua co dong boot)'))
  console.log('Nhat ky doc tu: ' + RUN_LOG)
  process.exit(0)
}

// 1) DUNG ban dong goi (thu muc .app, khong tao dmg)
if (!BO_QUA_DUNG) {
  console.log('[1] Dung dist/mac (electron-builder --mac --x64 --dir) ...')
  const t0 = Date.now()
  const r = spawnSync(path.join(ROOT, 'node_modules', '.bin', 'electron-builder'), ['--mac', '--x64', '--dir', '--publish', 'never'], { cwd: ROOT, encoding: 'utf8' })
  if (r.status !== 0) dung('electron-builder loi:\n' + String(r.stdout || '').split('\n').slice(-12).join('\n') + '\n' + String(r.stderr || '').split('\n').slice(-12).join('\n'))
  console.log('    xong ' + Math.round((Date.now() - t0) / 1000) + ' s')
}
const moi = ruot(DUNG), cu = ruot(CAI)
if (!fs.existsSync(moi.asar)) dung('khong thay ' + moi.asar)
const dsMoi = dsFile(moi.unp)
console.log('    ban dung: v' + banMoi + ' · app.asar ' + Math.round(fs.statSync(moi.asar).size / 1024) + ' KB (md5 ' + md5(moi.asar).slice(0, 8) + ') · unpacked ' + dsMoi.length + ' file')
if (CHI_DUNG) { console.log('\n--chi-dung: KHONG dung toi ban cai.'); process.exit(0) }

// 2) Ban cai co that khong, cung bo may Electron khong, khoa kiem ruot app co tat khong
if (!fs.existsSync(cu.asar)) dung('khong thay ban cai o ' + CAI + ' (may nay chua cai app -> phai cai ca .app)')
const eCai = electronCua(CAI), eDung = electronCua(DUNG)
if (!eCai || eCai !== eDung) dung('Electron cua ban cai (' + (eCai || '?') + ') KHAC ban dung (' + (eDung || '?') + ') -> nap ruot khong du, phai cai ca .app')
const khoa = await khoaRuotBat(CAI)
if (khoa !== false) dung('khoa kiem ruot app cua ban cai ' + (khoa ? 'dang BAT' : 'khong doc duoc') + ' -> doi app.asar co the lam app khong mo duoc; phai cai ca .app')
const cdTruoc = cdhash(CAI)
console.log('[2] Ban cai: ' + CAI + ' · Electron ' + eCai + ' giong ban dung · khoa kiem ruot app tat · CDHash ' + cdTruoc)
if (md5(cu.asar) === md5(moi.asar)) console.log('    (!) app.asar cua ban cai DA giong ban dung — van lam tiep de mo lai app + kiem')

// 3) Dem do cua nguoi dung TRUOC (chi doc)
let cauHinh = {}
try { let t = fs.readFileSync(path.join(USERDATA, 'cau-hinh.json'), 'utf8'); if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1); cauHinh = JSON.parse(t) } catch (e) {}
const thuMucAnh = cauHinh.thuMucAnh || path.join(USERDATA, 'shotandsave')
const dem = () => ({
  anh: fs.existsSync(thuMucAnh) ? fs.readdirSync(thuMucAnh).filter((f) => /\.(png|jpe?g|mp4|webm)$/i.test(f)).length : -1,
  dai: fs.existsSync(path.join(USERDATA, 'storyboard')) ? fs.readdirSync(path.join(USERDATA, 'storyboard')).length : 0,
  cauHinh: fs.existsSync(path.join(USERDATA, 'cau-hinh.json')) ? md5(path.join(USERDATA, 'cau-hinh.json')).slice(0, 8) : '-',
  banQuyen: fs.existsSync(path.join(USERDATA, 'ban-quyen.json')),
})
const truoc = dem()
console.log('[3] Truoc: ' + truoc.anh + ' anh/video trong ' + thuMucAnh + ' · ' + truoc.dai + ' dai Storyboard · cau hinh ' + truoc.cauHinh)

// 4) Tat app dang chay (SIGTERM tien trinh chinh; khong tat duoc thi DUNG, khong ep)
const pidTruoc = dangChay()
for (const p of pidTruoc) { try { process.kill(p, 'SIGTERM') } catch (e) {} }
for (let i = 0; i < 40 && dangChay().length; i++) ngu(250)
if (dangChay().length) dung('khong tat duoc app dang chay (pid ' + dangChay().join(', ') + ') -> anh thoat app tu bieu tuong khay roi chay lai script')
console.log('[4] Da tat app (' + pidTruoc.length + ' tien trinh chinh)')

// 5) Cat ruot cu (moi lan mot thu muc, khong xoa gi) roi chep ruot moi. Hong giua chung -> tra ruot cu ve.
const d = new Date(), p2 = (n) => String(n).padStart(2, '0')
const CAT = path.join(GOC_CAT, 'shotandsave-ruot-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()))
fs.mkdirSync(CAT, { recursive: true })
fs.copyFileSync(cu.asar, path.join(CAT, 'app.asar'))
const md5Cu = md5(cu.asar)
const unpKhac = dsFile(cu.unp).join('\n') !== dsMoi.join('\n')
let daDoiUnp = false
console.log('[5] Da cat app.asar cu (md5 ' + md5Cu.slice(0, 8) + ') vao ' + CAT + ' · app.asar.unpacked ' + (unpKhac ? 'KHAC ban dung -> cung thay' : 'giong ban dung -> de nguyen'))
try {
  if (unpKhac) {
    fs.renameSync(cu.unp, path.join(CAT, 'app.asar.unpacked')) // DOI CHO ban cu sang thu muc cat (cung o dia), khong xoa
    daDoiUnp = true
    fs.cpSync(moi.unp, cu.unp, { recursive: true })
    if (dsFile(cu.unp).join('\n') !== dsMoi.join('\n')) throw new Error('app.asar.unpacked chep xong nhung khong khop ban dung')
  }
  fs.copyFileSync(moi.asar, cu.asar)
  if (md5(cu.asar) !== md5(moi.asar)) throw new Error('app.asar chep xong nhung khong khop ban dung')
} catch (e) {
  console.error('    LOI khi chep: ' + e.message + ' -> tra ruot cu ve')
  traRuotCu()
  dung('da tra ruot cu ve (app.asar md5 ' + md5(cu.asar).slice(0, 8) + '), app chua doi')
}
console.log('    Da nap: app.asar md5 ' + md5(cu.asar).slice(0, 8) + ' = ban dung')
function traRuotCu() {
  fs.copyFileSync(path.join(CAT, 'app.asar'), cu.asar)
  if (daDoiUnp) {
    if (fs.existsSync(cu.unp)) fs.renameSync(cu.unp, path.join(CAT, 'app.asar.unpacked.ban-moi-chep-do'))
    fs.renameSync(path.join(CAT, 'app.asar.unpacked'), cu.unp)
  }
}

// 6) Mo lai app + doc dong boot + xem luong chup co len khong (= quyen Ghi man hinh con)
function moApp() {
  const coLog = docLog().length
  spawn('open', ['-a', CAI], { detached: true, stdio: 'ignore' }).unref()
  let boot = ''
  for (let i = 0; i < 80 && !boot; i++) { ngu(250); const s = docLog(); boot = bootCuoi(s.length >= coLog ? s.slice(coLog) : s) }
  let quyen = 'chua ro (chua thay dong LUONG nao trong 20 giay)'
  for (let i = 0; boot && i < 80; i++) {
    const s = docLog(), sau = s.length >= coLog ? s.slice(coLog) : s
    if (/LUONG: san sang/.test(sau)) { quyen = 'CON (luong chup da san sang)'; break }
    if (/Failed to get sources|LUONG LOI/.test(sau)) { quyen = 'MAT (' + (sau.split('\n').filter((l) => /Failed to get sources|LUONG LOI/.test(l)).pop() || '').trim().slice(0, 90) + ')'; break }
    ngu(250)
  }
  return { boot, quyen }
}
let mo = moApp()
if (!mo.boot) {
  console.error('[6] KHONG thay dong boot moi trong 20 giay -> tat app, tra ruot cu ve, mo lai')
  for (const p of dangChay()) { try { process.kill(p, 'SIGTERM') } catch (e) {} }
  for (let i = 0; i < 40 && dangChay().length; i++) ngu(250)
  traRuotCu()
  mo = moApp()
  dung('ban moi khong khoi dong duoc; da tra ruot cu (md5 ' + md5(cu.asar).slice(0, 8) + '), boot: ' + (mo.boot || 'KHONG THAY'))
}
const cdSau = cdhash(CAI)
console.log('[6] Mo lai app: ' + dangChay().length + ' tien trinh chinh · ' + mo.boot)
console.log('    Quyen Ghi man hinh: ' + mo.quyen + ' · CDHash ' + cdSau + (cdSau === cdTruoc ? ' (KHONG doi)' : ' (DA DOI — truoc ' + cdTruoc + ')'))

// 7) Dem lai do cua nguoi dung
const sau = dem()
const giong = truoc.anh === sau.anh && truoc.dai === sau.dai && truoc.cauHinh === sau.cauHinh && truoc.banQuyen === sau.banQuyen
console.log('[7] Sau:   ' + sau.anh + ' anh/video · ' + sau.dai + ' dai · cau hinh ' + sau.cauHinh + ' -> ' + (giong ? 'GIONG truoc' : 'KHAC TRUOC'))

const dat = mo.boot.includes('boot v' + banMoi + ' ') && giong && dangChay().length > 0 && cdSau === cdTruoc
console.log('\n' + (dat ? 'XONG: app dang chay ban v' + banMoi + ' (nap tai cho, khong thay .app, khong ky lai).' : 'CHUA DAT — xem cac dong tren.') +
  '\nTra ruot cu: thoat app, chep "' + path.join(CAT, 'app.asar') + '" de len "' + cu.asar + '"' + (daDoiUnp ? ' va doi thu muc app.asar.unpacked trong do ve cho cu' : '') + ', mo lai app.')
if (!dat) process.exit(1)
