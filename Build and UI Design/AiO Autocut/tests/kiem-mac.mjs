/**
 * kiem-mac.mjs — kiem nhanh nhanh macOS cua panel, KHONG can Premiere.
 *
 * Chay:  node tests/kiem-mac.mjs      (chi chay tren Mac; may khac thi BO QUA)
 *
 * Dong goi THANG ma nguon that (`client/src/services/ffmpeg.ts`, `whisper.ts`,
 * `lib/cep.ts`) bang esbuild co san trong `client/node_modules`, gia lap
 * `window.cep_node` + `CSInterface.js` that cua panel, roi:
 *   1. hoi cac ham do tim (ffmpeg, whisper, thu muc extension) tra ve gi
 *   2. CHAY THAT ffmpeg + whisper-cli bang CHINH cac ham panel goi (cung tham so)
 *      tren vai giay tieng noi sinh bang lenh `say` cua macOS.
 * Thieu mo hinh turbo (hoac file chua tai xong) thi bo qua buoc 2 cua whisper
 * va NOI RO la da bo qua — khong im lang.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

if (process.platform !== 'darwin') {
  console.log('[BO QUA] khong phai macOS — kiem nay chi danh cho Mac.')
  process.exit(0)
}

const thuMuc = path.dirname(fileURLToPath(import.meta.url))
const goc = path.resolve(thuMuc, '..') // thu muc panel = "thu muc extension" gia lap
const client = path.join(goc, 'client')
const reqClient = createRequire(path.join(client, 'package.json'))
const esbuild = reqClient('esbuild')

let loi = 0
function check(ten, dieuKien, chiTiet) {
  if (dieuKien) console.log('  [OK]   ' + ten + (chiTiet !== undefined ? '  ' + chiTiet : ''))
  else { console.log('  [SAI]  ' + ten + '  ' + (chiTiet ?? '')); loi++ }
}

// ── Gia lap moi truong CEP ──────────────────────────────────────────────
const win = {
  cep_node: { require: createRequire(import.meta.url), process },
  // CEP tra duong dan dang URL: `file:///Users/...`, dau cach thanh %20.
  __adobe_cep__: { getSystemPath: () => 'file://' + encodeURI(goc) },
  navigator: { platform: 'MacIntel', userAgent: 'node' },
}
win.window = win
const csi = fs.readFileSync(path.join(client, 'public', 'CSInterface.js'), 'utf8')
vm.runInNewContext(csi + '\nwindow.CSInterface = CSInterface; window.SystemPath = SystemPath;', win)
globalThis.window = win
try { globalThis.localStorage = { getItem: () => null, setItem: () => {} } } catch {}

// ── Dong goi ma nguon that ──────────────────────────────────────────────
fs.mkdirSync(path.join(thuMuc, 'js'), { recursive: true })
const ra = path.join(thuMuc, 'js', 'kiem-mac.bundle.mjs')
const src = (p) => JSON.stringify(path.join(client, 'src', p))
await esbuild.build({
  stdin: {
    contents: `
      export { laMac } from ${src('lib/node.ts')}
      export { extensionPath } from ${src('lib/cep.ts')}
      export { getFFmpegPath, timCongCuMac, choChay, detectSilence } from ${src('services/ffmpeg.ts')}
      export { timBoMay, thieuGi, trichTieng, locDaiGiongNoi, nghe, donWav } from ${src('services/whisper.ts')}
    `,
    resolveDir: client,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', __VERSION__: '"kiem"' },
  outfile: ra,
  logLevel: 'error',
})
const m = await import(pathToFileURL(ra).href + '?t=' + Date.now())

const khoChung = path.join(os.homedir(), 'Library', 'Application Support', 'AiO-Studio')

console.log('=== 1. Nhan dien may + thu muc extension ===')
check('laMac() = true', m.laMac() === true)
const ext = m.extensionPath()
check('extensionPath() la duong TUYET DOI (co / dau)', ext.startsWith('/'), ext)
check('extensionPath() dung thu muc panel', path.resolve(ext) === goc)

console.log('=== 2. Tim cong cu theo thu tu chung cua Mac ===')
const ff = m.getFFmpegPath()
const coBinMacRieng = fs.existsSync(path.join(goc, 'bin', 'mac', 'ffmpeg'))
check('getFFmpegPath() tim thay', !!ff, ff)
check('ffmpeg khong co duoi .exe', !/\.exe$/i.test(ff))
check(
  coBinMacRieng ? 'uu tien bin/mac cua panel' : 'panel chua co bin/mac -> lay kho chung',
  ff === (coBinMacRieng ? path.join(goc, 'bin', 'mac', 'ffmpeg') : path.join(khoChung, 'bin', 'mac', 'ffmpeg')),
)
let chayDuoc = false
try { fs.accessSync(ff, fs.constants.X_OK); chayDuoc = true } catch {}
check('ffmpeg co quyen chay', chayDuoc)
check('timCongCuMac("ffprobe") tim thay', !!m.timCongCuMac('ffprobe'), m.timCongCuMac('ffprobe'))
check('cong cu khong co -> tra rong', m.timCongCuMac('khong-co-cong-cu-nay-xyz') === '')

// choChay: file mat bit x thi tu tra lai
const tam = path.join(os.tmpdir(), `aio-kiem-mac-${Date.now()}`)
fs.writeFileSync(tam, '#!/bin/sh\n')
fs.chmodSync(tam, 0o644)
m.choChay(tam)
check('choChay() tra lai bit x', (fs.statSync(tam).mode & 0o111) !== 0, (fs.statSync(tam).mode & 0o777).toString(8))
fs.unlinkSync(tam)

console.log('=== 3. Whisper ===')
const turbo = path.join(khoChung, 'whisper', 'models', 'ggml-large-v3-turbo.bin')
const coTurbo = fs.existsSync(turbo) && fs.statSync(turbo).size > 1.5e9
const bm = m.timBoMay('turbo')
if (coTurbo) {
  check('timBoMay(turbo) tim thay', !!bm)
  check('exe = <kho>/whisper/bin/whisper-cli', bm?.exe === path.join(khoChung, 'whisper', 'bin', 'whisper-cli'), bm?.exe)
  check('model = turbo', bm?.model === turbo)
  const bmV3 = m.timBoMay('v3')
  check('chon v3 ma may chi co turbo -> lui ve turbo', bmV3?.model === turbo || fs.existsSync(path.join(khoChung, 'whisper', 'models', 'ggml-large-v3.bin')))
  check('thieuGi() rong khi da cai du', m.thieuGi() === '', JSON.stringify(m.thieuGi()))
} else {
  console.log('  [BO QUA] chua co mo hinh turbo day du (~1,6 GB) — ' + turbo)
  check('thieuGi() chi dung duong Mac', m.thieuGi().includes(path.join(khoChung, 'whisper')), JSON.stringify(m.thieuGi()))
}

console.log('=== 4. Chay THAT bang chinh ham cua panel ===')
const aiff = path.join(os.tmpdir(), `aio-kiem-mac-${Date.now()}.aiff`)
let coTieng = false
try {
  execFileSync('/usr/bin/say', ['-o', aiff, 'Hello. This is a short test of the silence cutter.', '[[slnc 1500]]', 'And here is the second sentence after a pause.'])
  coTieng = fs.existsSync(aiff)
} catch (e) {
  console.log('  [BO QUA] lenh say hong: ' + e.message)
}
if (coTieng) {
  let t0 = Date.now()
  const tr = await m.trichTieng(aiff, () => {})
  check('trichTieng() ra WAV 16 kHz mono', fs.existsSync(tr.wav), `${tr.wav} · ${tr.duration.toFixed(2)}s · ${Date.now() - t0} ms`)
  const loc = await m.locDaiGiongNoi(tr.wav)
  check('locDaiGiongNoi() ra ban loc', !!loc && fs.existsSync(loc), loc)
  const ds = await m.detectSilence(loc || tr.wav, { noiseDb: -30, minSilence: 0.5 })
  check('detectSilence() thay khoang lang 1,5s o giua', ds.silences.some((s) => s.end - s.start > 1.0),
    JSON.stringify(ds.silences.map((s) => [+s.start.toFixed(2), +s.end.toFixed(2)])))
  if (coTurbo && bm) {
    t0 = Date.now()
    let pts = []
    const kq = await m.nghe(tr.wav, bm, (p) => pts.push(p))
    check('nghe() (whisper-cli that) ra cau', kq.cau.length > 0,
      `${kq.cau.length} cau · ${kq.tu.length} tu · ${((Date.now() - t0) / 1000).toFixed(1)}s · tien do ${JSON.stringify(pts.slice(-3))}`)
    for (const c of kq.cau) console.log(`         ${c.tu.toFixed(2)}-${c.den.toFixed(2)}  ${c.chu}`)
  } else {
    console.log('  [BO QUA] nghe(): chua co mo hinh turbo — CHUA CHAY whisper-cli. Khong coi la dat.')
  }
  m.donWav(tr.wav)
  if (loc) m.donWav(loc)
  fs.unlinkSync(aiff)
}

console.log(loi ? `\n${loi} PHEP KIEM SAI` : '\nTAT CA DAT')
process.exit(loi ? 1 : 0)
