/* Do MUOT luc man TOI DAN sau phim tat (anh Tien 14/09: "no giat tu tu moi toi").
   Chay:  node scripts/test/do-mo-dan.mjs [grab-tre-ms]   (mac dinh 200 = ban 0.4.9; 40 = ban cu de doi chung)
   Mo app --selftest --dev (tu chup sau 1,2s), noi CDP 9333, bam target overlay
   NGAY khi xuat hien, bat Page.screencast, ghi moc thoi gian tung khung trong
   1,2s dau -> gap-max / gap-p95 / so gap > 33ms trong 500ms dau (luc lop mo
   dang tối dần 150ms + anh dong bang fade 160ms). So sanh cac gia tri grab-tre. */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'
import fs from 'node:fs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const TRE = process.argv[2] || '200'
const { createRequire } = await import('node:module')
const ELECTRON = createRequire(import.meta.url)('electron')
const app = spawn(ELECTRON, ['.', '--selftest', '--dev'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, AIO_CDP: '1', AIO_GRAB_TRE: TRE } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (url) => new Promise((res, rej) => http.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej))
let ws, seq = 0; const pend = new Map()
function send(method, params = {}, sessionId) { const id = ++seq; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise((res, rej) => pend.set(id, { res, rej })) }
const frames = []
let ovSession = null, tAttach = 0
try {
  /* Bam o TANG TRINH DUYET + tu dong attach moi target moi -> bat screencast
     overlay NGAY luc no duoc tao (truoc khi hien). Lan 1 (poll /json) bam muon
     613ms, lo mat 150ms lop mo -> so vo nghia. */
  let ver = null
  for (let i = 0; i < 200 && !ver; i++) { await sleep(50); try { ver = await getJson('http://127.0.0.1:9333/json/version') } catch (e) {} }
  if (!ver) throw new Error('khong noi duoc CDP 9333')
  ws = new WebSocket(ver.webSocketDebuggerUrl)
  await new Promise((r) => ws.onopen = r)
  ws.onmessage = (m) => {
    const j = JSON.parse(m.data)
    if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result); return }
    if (j.method === 'Target.attachedToTarget') {
      const { sessionId, targetInfo } = j.params
      if (targetInfo.type === 'page' && !ovSession && (targetInfo.url.includes('overlay') || targetInfo.url === '' || targetInfo.url === 'about:blank')) {
        // overlay dau tien: url co the con rong luc vua tao -> bat screencast ngay, loc sau
        ovSession = sessionId; tAttach = Date.now()
        send('Page.enable', {}, sessionId).catch(() => {})
        send('Page.startScreencast', { format: 'jpeg', quality: 30, maxWidth: 480, maxHeight: 270, everyNthFrame: 1 }, sessionId).catch(() => {})
      }
      send('Runtime.runIfWaitingForDebugger', {}, sessionId).catch(() => {})
    } else if (j.method === 'Page.screencastFrame' && j.sessionId === ovSession) {
      frames.push([Date.now(), j.params.metadata.timestamp]); send('Page.screencastFrameAck', { sessionId: j.params.sessionId }, ovSession).catch(() => {})
    } else if (j.method === 'Target.targetInfoChanged' && ovSession && j.params.targetInfo.url && !j.params.targetInfo.url.includes('overlay') && j.params.targetInfo.url !== 'about:blank') {
      // target da attach khong phai overlay (vd shelf) -> bo, cho cai khac
    }
  }
  await send('Target.setDiscoverTargets', { discover: true })
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true })
  await sleep(3200) // selftest bat dau chup sau 1,2s; quay 2s
  if (!ovSession) throw new Error('khong attach duoc overlay')
  try { await send('Page.stopScreencast', {}, ovSession) } catch (e) {}
  if (frames.length < 2) throw new Error('chi ' + frames.length + ' khung')
  const ts = frames.map((f) => f[0]); const t0 = ts[0]
  const gaps = []; for (let i = 1; i < ts.length; i++) gaps.push(ts[i] - ts[i - 1])
  const dau = ts.filter((t) => t - t0 <= 600)
  const gapsDau = []; for (let i = 1; i < dau.length; i++) gapsDau.push(dau[i] - dau[i - 1])
  const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] }
  console.log(`grab-tre=${TRE}ms · khung tong=${ts.length} trong ${ts[ts.length - 1] - t0}ms · attach->khung dau ${t0 - tAttach}ms`)
  console.log(`600ms DAU: ${dau.length} khung · gap-max ${Math.max(...gapsDau)}ms · gap-p95 ${p95(gapsDau)}ms · so gap>33ms: ${gapsDau.filter((g) => g > 33).length}`)
  console.log(`  chuoi gap (ms): ${gapsDau.join(' ')}`)
  console.log(`  moc khung (ms tu khung dau): ${ts.map((t) => t - t0).join(' ')}`)
  const mt = frames.map((f) => Math.round((f[1] - frames[0][1]) * 1000))
  console.log(`  moc COMPOSITOR dong dau (ms tu khung dau, khong qua duong truyen): ${mt.join(' ')}`)
  const log = fs.readFileSync(path.join(ROOT, '.run-log.txt'), 'utf8').trim().split('\n').filter((l) => /grab-xong|capture-start/.test(l)).slice(-2)
  console.log('  run-log: ' + log.join(' | '))
} catch (e) { console.error('LOI', e.message); process.exitCode = 2 }
finally { try { spawn('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' }) } catch (e) {} }
