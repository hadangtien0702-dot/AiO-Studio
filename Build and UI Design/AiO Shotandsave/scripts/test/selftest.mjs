/* `npm test` — chay selftest cua app roi TU CHAM bang ma thoat, khong doc mat.
   Chay tai MAY THAT (can man hinh + desktopCapturer); KHONG chay duoc tren CI
   headless — o do se do gia (so loi #6: xanh gia).

   DAT khi du 5 dieu:
     1. app tu thoat trong 45s (treo = loi duong chup, vd grab 0 man)
     2. .selftest/errors.txt KHONG sinh ra (uncaughtException)
     3. run-log co dong `luu <file> WxH` (da qua kho.luuAnh)
     4. run-log KHONG co `CANH BAO` (overlay hut, so loi #1) va KHONG co `LOI `
     5. du 3 anh .selftest/selftest-{overlay,pin,shelf}.png, moi anh > 5KB
   Sau do XOA DICH DANH file anh ma selftest vua tao: ten lay tu dong `luu` cua
   run-log VA moi xuat hien trong 'Anh chup' (so loi #4: cam glob / loc gio).

   Doi chung (phai DO): `AIO_TEST_GRAB_LOI=all npm test` -> phai TRUOT o dieu 1. */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ELECTRON = createRequire(import.meta.url)('electron')
const ANH = path.join(ROOT, 'Anh chup')
const ST = path.join(ROOT, '.selftest')
const RUN_LOG = path.join(ROOT, '.run-log.txt')
const HET_GIO = 45000

const lsAnh = () => { try { return new Set(fs.readdirSync(ANH)) } catch (e) { return new Set() } }
const truoc = lsAnh()
try { fs.unlinkSync(path.join(ST, 'errors.txt')) } catch (e) {}
for (const f of ['selftest-overlay.png', 'selftest-pin.png', 'selftest-shelf.png']) { try { fs.unlinkSync(path.join(ST, f)) } catch (e) {} }
fs.writeFileSync(RUN_LOG, '')

const t0 = Date.now()
const app = spawn(ELECTRON, ['.', '--selftest', '--dev'], { cwd: ROOT, stdio: 'ignore' })
const ketThuc = await new Promise((res) => {
  const tm = setTimeout(() => { res('TREO') }, HET_GIO)
  app.on('exit', (code) => { clearTimeout(tm); res(code) })
})
if (ketThuc === 'TREO') { try { spawn('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' }) } catch (e) {} }
const ms = Date.now() - t0

const log = (() => { try { return fs.readFileSync(RUN_LOG, 'utf8') } catch (e) { return '' } })()
const loi = []
if (ketThuc === 'TREO') loi.push(`app khong tu thoat sau ${HET_GIO / 1000}s`)
else if (ketThuc !== 0) loi.push(`app thoat ma ${ketThuc}`)
if (fs.existsSync(path.join(ST, 'errors.txt'))) loi.push('co .selftest/errors.txt: ' + fs.readFileSync(path.join(ST, 'errors.txt'), 'utf8').split('\n')[0])
if (!/^\S+ luu \S+ \d+x\d+/m.test(log)) loi.push('run-log khong co dong `luu <file> WxH`')
for (const l of log.split('\n')) if (/CANH BAO|\bLOI /.test(l)) loi.push('run-log: ' + l.trim())
for (const f of ['selftest-overlay.png', 'selftest-pin.png', 'selftest-shelf.png']) {
  let kb = 0; try { kb = fs.statSync(path.join(ST, f)).size / 1024 } catch (e) {}
  if (kb < 5) loi.push(`${f}: ${kb ? Math.round(kb) + 'KB' : 'KHONG CO'}`)
}

// Don: xoa DICH DANH file ma CHINH selftest ghi (ten trong dong `luu <file>` cua
// run-log) VA moi xuat hien — chenh lech truoc/sau thoi chua du: nguoi dung chup
// bang ban khac dung luc test chay thi file do cung "moi" (so loi #4).
const tenTuLog = new Set([...log.matchAll(/^\S+ luu (\S+) \d+x\d+/gm)].map((m) => m[1]))
const moi = [...lsAnh()].filter((f) => !truoc.has(f) && tenTuLog.has(f))
for (const f of moi) { try { fs.unlinkSync(path.join(ANH, f)) } catch (e) {} }

console.log(`selftest ${ms}ms · anh test sinh/xoa: ${moi.length} (${moi.join(', ') || '-'})`)
if (loi.length) { console.log('TRUOT:'); for (const l of loi) console.log('  - ' + l); process.exitCode = 1 }
else console.log('DAT — 5/5 dieu kien')
