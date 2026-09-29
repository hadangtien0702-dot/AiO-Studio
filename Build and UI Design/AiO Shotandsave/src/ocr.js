'use strict'
/* DOC CHU TRONG ANH (29/09, anh Tien chot: "uu tien nen tang Native - chinh xac - dung duoc tren Win va Mac").
   - Windows: Windows.Media.Ocr (co san trong Windows 10/11, 0 MB, khong can mang). Goi qua MOT tien trinh PowerShell
     GIU SAN: lan dau nap WinRT ~0,5-1 s, cac lan sau chi con thoi gian doc (do 29/09: anh 935x1670 doc 70 ms).
     Khong viet module native C++/Rust (anh cam 14/09 o viec chup) — chi goi API he dieu hanh bang script.
     ☠️ Windows KHONG CO bo doc tieng Viet (do 29/09: bang FOD chinh thuc cua Microsoft co 35 goi OCR, vi-vn chi co
     Basic + TextToSpeech, KHONG co OCR) -> cai them ngon ngu cung vo ich; tieng Viet mat dau ("Tra loi" -> "Trå Idi").
     Van hoi 'vi' truoc de neu Microsoft them sau nay thi tu dung.
   - macOS: Apple Vision (VNRecognizeTextRequest) qua osascript JXA — khong can bien dich. CHUA DO tren Mac that.
   Tien trinh PowerShell tu tat sau 10 phut khong dung (luat tai nguyen: chi chay khi nguoi dung bam). */
const { spawn, execFile } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const HOST_PS = [
  "$ErrorActionPreference='Stop'",
  '[Console]::InputEncoding=[Text.UTF8Encoding]::new($false)',
  '[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)',
  'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
  '$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]',
  '$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]',
  '$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]',
  "$asTask=([System.WindowsRuntimeSystemExtensions].GetMethods()|Where-Object{$_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'})[0]",
  'function Doi($op,[Type]$t){$k=$asTask.MakeGenericMethod($t).Invoke($null,@($op));$k.Wait(-1)|Out-Null;$k.Result}',
  '$ds=@([Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages|ForEach-Object{$_.LanguageTag})',
  '$cache=@{}',
  "function Engine($tag){$k=[string]$tag;if(-not $cache.ContainsKey($k)){$e=$null;if($tag){$e=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new($tag))};if(-not $e){$e=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()};$cache[$k]=$e};$cache[$k]}",
  '[Console]::Out.WriteLine((@{san=$true;ngonNgu=$ds}|ConvertTo-Json -Compress))',
  'while($null -ne ($dong=[Console]::In.ReadLine())){',
  '  $q=$null',
  '  try{',
  '    $q=$dong|ConvertFrom-Json',
  '    $tag=$null;foreach($l in $q.uuTien){$m=@($ds|Where-Object{$_ -eq $l -or $_ -like ($l+"-*")});if($m.Count){$tag=$m[0];break}}',
  '    $e=Engine $tag',
  '    $f=Doi ([Windows.Storage.StorageFile]::GetFileFromPathAsync($q.duong)) ([Windows.Storage.StorageFile])',
  '    $s=Doi ($f.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])',
  '    $d=Doi ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($s)) ([Windows.Graphics.Imaging.BitmapDecoder])',
  '    $b=Doi ($d.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])',
  '    $r=Doi ($e.RecognizeAsync($b)) ([Windows.Media.Ocr.OcrResult])',
  '    $s.Dispose()',
  '    $ls=@($r.Lines|ForEach-Object{$_.Text})',
  '    [Console]::Out.WriteLine((@{id=$q.id;ok=$true;dong=$ls;boDoc=$e.RecognizerLanguage.LanguageTag}|ConvertTo-Json -Compress))',
  '  }catch{',
  '    $id=0;if($q){$id=$q.id}',
  '    [Console]::Out.WriteLine((@{id=$id;ok=$false;loi=$_.Exception.Message}|ConvertTo-Json -Compress))',
  '  }',
  '}',
].join('\n')

/* JXA: Apple Vision. recognitionLevel 0 = accurate. Ngon ngu 'vi-VT' la ma Apple dung cho tieng Viet (macOS moi);
   may cu khong ho tro thi thu lai khong dat ngon ngu. */
const JXA_MAC = [
  "ObjC.import('Vision');",
  'function doc(url, langs) {',
  '  const req = $.VNRecognizeTextRequest.alloc.init;',
  '  req.recognitionLevel = 0; req.usesLanguageCorrection = true;',
  '  if (langs) req.recognitionLanguages = $(langs);',
  '  const h = $.VNImageRequestHandler.alloc.initWithURLOptions(url, $({}));',
  '  const err = Ref();',
  '  if (!h.performRequestsError($([req]), err)) return null;',
  '  const res = req.results, out = [];',
  '  for (let i = 0; i < res.count; i++) { const c = res.objectAtIndex(i).topCandidates(1); if (c.count) out.push(ObjC.unwrap(c.objectAtIndex(0).string)); }',
  '  return out;',
  '}',
  'function run(argv) {',
  '  const url = $.NSURL.fileURLWithPath(argv[0]);',
  "  let d = null, bo = 'vi-VT,en-US';",
  "  try { d = doc(url, ['vi-VT', 'en-US']); } catch (e) { d = null; }",
  "  if (!d) { bo = 'mac-dinh'; d = doc(url, null) || []; }",
  '  return JSON.stringify({ ok: true, dong: d, boDoc: bo });',
  '}',
].join('\n')

let host = null // { proc, cho: Map<id, {res, timer}>, dem, san: Promise, ngonNgu, tatHen }
const NGU_MS = 10 * 60 * 1000

function tatHost() {
  if (!host) return
  const h = host; host = null
  clearTimeout(h.tatHen)
  for (const c of h.cho.values()) { clearTimeout(c.timer); c.res({ ok: false, loi: 'bo doc chu da tat' }) }
  try { h.proc.kill() } catch (e) {}
}

function moHost() {
  if (host) return host
  const b64 = Buffer.from(HOST_PS, 'utf16le').toString('base64')
  const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', b64],
    { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
  const h = { proc, cho: new Map(), dem: 0, ngonNgu: [], tatHen: null }
  let du = ''
  let baoSan
  h.san = new Promise((res) => { baoSan = res })
  proc.stdout.setEncoding('utf8')
  proc.stdout.on('data', (s) => {
    du += s
    let i
    while ((i = du.indexOf('\n')) >= 0) {
      const dong = du.slice(0, i).trim(); du = du.slice(i + 1)
      if (!dong) continue
      let m = null
      try { m = JSON.parse(dong) } catch (e) { continue }
      if (m.san) { h.ngonNgu = [].concat(m.ngonNgu || []); baoSan(true); continue }
      const c = h.cho.get(m.id)
      if (c) { h.cho.delete(m.id); clearTimeout(c.timer); c.res(m) }
    }
  })
  proc.stderr.on('data', () => {})
  proc.on('exit', () => { baoSan(false); if (host === h) tatHost() })
  proc.on('error', () => { baoSan(false); if (host === h) tatHost() })
  host = h
  return h
}

async function docWin(duong, uuTien) {
  const h = moHost()
  clearTimeout(h.tatHen)
  h.tatHen = setTimeout(tatHost, NGU_MS)
  const san = await Promise.race([h.san, new Promise((r) => setTimeout(() => r(false), 15000))])
  if (!san) { tatHost(); return { ok: false, loi: 'khong mo duoc bo doc chu Windows' } }
  const id = ++h.dem
  const kq = await new Promise((res) => {
    const timer = setTimeout(() => { h.cho.delete(id); res({ ok: false, loi: 'doc chu qua 15 giay' }) }, 15000)
    h.cho.set(id, { res, timer })
    h.proc.stdin.write(JSON.stringify({ id, duong, uuTien }) + '\n')
  })
  kq.ngonNguMay = h.ngonNgu
  return kq
}

function docMac(duong) {
  return new Promise((res) => {
    execFile('osascript', ['-l', 'JavaScript', '-e', JXA_MAC, duong], { timeout: 15000, maxBuffer: 8 * 1024 * 1024 }, (err, out) => {
      if (err) { res({ ok: false, loi: err.message }); return }
      try { res(JSON.parse(String(out).trim())) } catch (e) { res({ ok: false, loi: 'ket qua Vision khong doc duoc' }) }
    })
  })
}

/* TESSERACT (29/09, anh chot "theo ngon ngu app"): Windows khong co bo doc tieng Viet -> app dang TIENG VIET thi doc
   bang Tesseract vie+eng (tesseract.js 5.1.1, WASM trong worker thread — khong khoa luong chinh, khong module native).
   Du lieu best_int dong goi san trong assets/ocr (vie 1,7 MB + eng 5,2 MB, da giai nen), KHONG tai tu mang, KHONG ghi.
   Do 29/09 vung chat 1447x666: 0,8-0,9 s/lan + nap 1,1 s lan dau; 3/4 cau tieng Viet khop tung chu (Windows: 0/4). */
let tess = null // { w: Promise<Worker>, tatHen }
// Ban dong goi: tesseract.js chay trong worker_threads -> luong phu phai nap file THAT tren dia (package.json asarUnpack
// node_modules/** + assets/ocr/**), khong nap tu ben trong app.asar.
const moAsar = (p) => p.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep)
function thuMucDuLieu() { return moAsar(path.join(__dirname, '..', 'assets', 'ocr')) }
function duongWorker() {
  return moAsar(path.join(path.dirname(require.resolve('tesseract.js/package.json')), 'src', 'worker-script', 'node', 'index.js'))
}
function tatTess() {
  if (!tess) return
  const t = tess; tess = null
  clearTimeout(t.tatHen)
  t.w.then((w) => w.terminate()).catch(() => {})
}
function layTess() {
  if (!tess) {
    const { createWorker } = require('tesseract.js')
    // ☠️ 2 bay da do 29/09 (Node tran chay dung, Electron hong):
    //  (1) langPath: trong Electron thu vien tu nhan "electron" -> fetch(duong dan) -> "Only absolute URLs are supported".
    //  (2) langs dang { code, data }: tesseract.js 5.1.1 ghep nham l.data thay l.code khi Init -> "initialization failed".
    // Duong chay dung: doc qua BO DEM (fs.readFile, truoc moi nhanh fetch), che do chi doc, tro vao assets/ocr
    // (vie.traineddata + eng.traineddata da giai nen).
    const w = createWorker(['vie', 'eng'], 1, { cachePath: thuMucDuLieu(), cacheMethod: 'readOnly', workerPath: duongWorker() })
    tess = { w, tatHen: null }
    w.catch(() => { if (tess && tess.w === w) tess = null })
  }
  clearTimeout(tess.tatHen)
  tess.tatHen = setTimeout(tatTess, NGU_MS)
  return tess.w
}
async function docTess(png) {
  const w = await layTess()
  const { data } = await w.recognize(png)
  return { ok: true, dong: String(data.text || '').split('\n'), boDoc: 'tesseract' }
}

let demFile = 0
/* png: Buffer PNG vung da cat. cach: 'tesseract' | 'he-thong' (bo doc cua Windows / Apple Vision).
   Tra ve { ok, dong: [chuoi], boDoc, cach, ngonNguMay?, ms, loi? } — ben goi PHAI kiem ok. */
async function docChu(png, cach) {
  const t0 = Date.now()
  if (process.platform !== 'win32' && process.platform !== 'darwin') return { ok: false, loi: 'he dieu hanh chua ho tro' }
  if (cach === 'tesseract') {
    try {
      const kq = await docTess(png)
      kq.cach = 'tesseract'
      kq.dong = kq.dong.map((s) => s.trim()).filter(Boolean)
      kq.ms = Date.now() - t0
      return kq
    } catch (e) {
      tatTess()
      return { ok: false, cach: 'tesseract', loi: 'tesseract: ' + (e && e.message ? e.message : e), ms: Date.now() - t0 }
    }
  }
  const duong = path.join(os.tmpdir(), 'aio-ocr-' + process.pid + '-' + (++demFile) + '.png')
  try {
    fs.writeFileSync(duong, png)
    const kq = process.platform === 'win32' ? await docWin(duong, ['vi']) : await docMac(duong)
    kq.cach = 'he-thong'
    kq.dong = [].concat(kq.dong || []).map((s) => String(s)).filter((s) => s.trim())
    kq.ms = Date.now() - t0
    return kq
  } catch (e) {
    return { ok: false, cach: 'he-thong', loi: e.message, ms: Date.now() - t0 }
  } finally {
    try { fs.unlinkSync(duong) } catch (e) {}
  }
}

function tatHet() { tatHost(); tatTess() }

module.exports = { docChu, tatHost: tatHet }
