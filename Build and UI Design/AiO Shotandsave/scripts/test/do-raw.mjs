/* Do duong CAT ANH GOC (aioshot://raw, 14/09) — anh dong bang di JPEG chi de nhin,
   luc Xong co shape / vat 2 man phai cat tu anh goc PNG.
   Chay:  node scripts/test/do-raw.mjs
   Hai luot `--selftest --dev`:
     1. AIO_TEST_SHAPE=1     -> run-log co 'raw crop', 'xong shape nen=raw-png';
                                file luu co diem CAM (khung ve) + kich thuoc = vung chon.
     2. AIO_TEST_COMPOSITE=1 -> run-log co 'composite OK ... nen=raw-png', >=2 'raw crop';
                                file luu rong 600 cao 300 (phys). May 1 man: bo qua.
   File anh test: lay ten tu dong `luu` run-log, doc xong XOA DICH DANH (so loi #4).
   Thoat !=0 neu truot. */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ELECTRON = createRequire(import.meta.url)('electron')
const LOG = path.join(ROOT, '.run-log.txt')
const ANH = path.join(ROOT, 'Anh chup')
const kq = []; let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? 'DAT ' : 'TRUOT') + ' · ' + ten + (chiTiet ? ' · ' + chiTiet : '')); if (!ok) dat = false }

function chay(env) {
  return new Promise((res) => {
    const p = spawn(ELECTRON, ['.', '--selftest', '--dev'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, ...env } })
    const tm = setTimeout(() => { try { spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' }) } catch (e) {} res('TREO') }, 25000)
    p.on('exit', (c) => { clearTimeout(tm); res(c) })
  })
}
// PNG/JPEG -> dem diem cam + kich thuoc bang PowerShell (System.Drawing), khong them dependency.
function doAnh(file) {
  const ps = `Add-Type -AssemblyName System.Drawing; $b=[System.Drawing.Bitmap]::FromFile('${file.replace(/'/g, "''")}'); $n=0; for($y=0;$y -lt $b.Height;$y+=2){for($x=0;$x -lt $b.Width;$x+=2){$c=$b.GetPixel($x,$y); if($c.R -gt 200 -and $c.G -gt 70 -and $c.G -lt 140 -and $c.B -lt 80){$n++}}}; "$($b.Width) $($b.Height) $n"; $b.Dispose()`
  const r = spawnSyncPs(ps)
  const [w, h, cam] = r.trim().split(/\s+/).map(Number)
  return { w, h, cam }
}
import { spawnSync } from 'node:child_process'
function spawnSyncPs(script) { return spawnSync('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' }).stdout }

function logMoi(tuDong) { return fs.readFileSync(LOG, 'utf8').split('\n').slice(tuDong) }
function soDong() { try { return fs.readFileSync(LOG, 'utf8').split('\n').length } catch (e) { return 0 } }

async function luot(ten, env, kiemLuot) {
  const truoc = new Set(fs.existsSync(ANH) ? fs.readdirSync(ANH) : [])
  const d0 = soDong()
  const exit = await chay(env)
  const log = logMoi(d0)
  const luu = log.map((l) => /luu (\S+) (\d+)x(\d+)/.exec(l)).find(Boolean)
  const ten_file = luu && luu[1]
  const file = ten_file && !truoc.has(ten_file) ? path.join(ANH, ten_file) : null
  kiem(ten + ': app thoat sach', exit === 0, 'exit=' + exit)
  kiem(ten + ': co file luu moi', !!file && fs.existsSync(file), ten_file || 'khong co dong luu')
  try { kiemLuot(log, file, luu) } catch (e) { kiem(ten + ': LOI kiem ' + e.message, false) }
  if (file && fs.existsSync(file)) { fs.unlinkSync(file); kq.push('     (da xoa dich danh ' + ten_file + ')') }
}

await luot('SHAPE', { AIO_TEST_SHAPE: '1' }, (log, file, luu) => {
  kiem('SHAPE: run-log co raw crop', log.some((l) => /raw crop \d+x\d+ png/.test(l)), log.filter((l) => /raw crop/.test(l)).join(' | '))
  kiem('SHAPE: xong dung nen raw-png (khong roi ve jpeg)', log.some((l) => /xong shape nen=raw-png/.test(l)), log.filter((l) => /xong shape/.test(l)).join(' | '))
  if (file) {
    const a = doAnh(file)
    kiem('SHAPE: file co diem CAM (khung da ve)', a.cam > 200, a.w + 'x' + a.h + ' cam=' + a.cam)
    kiem('SHAPE: kich thuoc file = vung luu', a.w === +luu[2] && a.h === +luu[3], a.w + 'x' + a.h + ' vs ' + luu[2] + 'x' + luu[3])
  }
})
await luot('COMPOSITE', { AIO_TEST_COMPOSITE: '1' }, (log, file, luu) => {
  const motMan = log.some((l) => /composite: chi 1 man/.test(l))
  if (motMan) { kq.push('     (may 1 man -> bo qua composite)'); return }
  kiem('COMPOSITE: ghep tu raw-png', log.some((l) => /composite OK .*nen=raw-png/.test(l)), log.filter((l) => /composite/.test(l)).join(' | '))
  kiem('COMPOSITE: >=2 raw crop', log.filter((l) => /raw crop/.test(l)).length >= 2, log.filter((l) => /raw crop/.test(l)).join(' | '))
  if (file) {
    const a = doAnh(file)
    kiem('COMPOSITE: file 600x300 phys', a.w === 600 && a.h === 300, a.w + 'x' + a.h)
  }
})
console.log(kq.join('\n')); console.log(dat ? 'DAT' : 'TRUOT')
process.exitCode = dat ? 0 : 1
