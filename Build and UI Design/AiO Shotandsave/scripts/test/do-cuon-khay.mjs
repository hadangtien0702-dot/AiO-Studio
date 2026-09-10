/* Do MUOT khi cuon khay bang CDP (Chrome DevTools Protocol) — khong tin cam giac.
   Cach chay:  npm run test:khay            (mac dinh: doc)
               npm run test:khay -- ngang
   Script tu mo app o che do --selftest-shelf (userData cach ly, anh CHI DOC tu
   'Anh chup'), noi CDP cong 9333, bat Page.screencast, ban bao wheel vao khay
   1,5s (mot tick moi 16ms), roi tinh:
     - fps screencast (khung THAT day ra man — rAF bi vsync khoa, mu voi lag compositor)
     - gap-max / gap-p95 giua 2 khung (ms) — so nguoi dung CAM THAY
     - so buoc nhay scroll (delta scrollTop/Left giua 2 mau rAF > 60px = giat)
   Thoat ma !=0 neu gap-p95 > 40ms hoac co buoc nhay. */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const KIEU = process.argv[2] === 'ngang' ? 'ngang' : 'doc'
// ☠️ Duong dan repo co DAU CACH — khong di qua shell (electron.cmd khong nhay se
//    khong chay). Lay thang duong exe tu goi electron.
const { createRequire } = await import('node:module')
const ELECTRON = createRequire(import.meta.url)('electron')

const app = spawn(ELECTRON, ['.', '--selftest-shelf', '--khay=' + KIEU], { cwd: ROOT, stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (url) => new Promise((res, rej) => http.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej))

let ws, seq = 0; const pend = new Map(); const evs = []
function send(method, params = {}, sessionId) {
  const id = ++seq
  ws.send(JSON.stringify({ id, method, params, sessionId }))
  return new Promise((res, rej) => pend.set(id, { res, rej }))
}

try {
  let targets = []
  for (let i = 0; i < 40 && !targets.some((t) => t.url.includes('shelf/index.html')); i++) {
    await sleep(250)
    try { targets = await getJson('http://127.0.0.1:9333/json') } catch (e) {}
  }
  const shelf = targets.find((t) => t.url.includes('shelf/index.html'))
  if (!shelf) throw new Error('khong thay cua so khay qua CDP')
  ws = new WebSocket(shelf.webSocketDebuggerUrl)
  await new Promise((r) => ws.onopen = r)
  ws.onmessage = (m) => {
    const j = JSON.parse(m.data)
    if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result) }
    else evs.push(j)
  }
  await send('Runtime.enable'); await send('Page.enable')
  await sleep(600) // anh nap + animation "moi" xong

  const { result: { value: info } } = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
    const l = document.getElementById('list'); const r = l.getBoundingClientRect()
    return { n: l.children.length, cx: r.x + r.width / 2, cy: r.y + r.height / 2, sw: l.scrollWidth, sh: l.scrollHeight, cw: l.clientWidth, ch: l.clientHeight, doc: document.body.classList.contains('doc') }
  })()` })
  if (info.n < 5) throw new Error('khay chi co ' + info.n + ' anh — can >=5 de cuon')

  // Bo lay mau trong trang: moi rAF ghi (t, scroll) de dem buoc NHAY
  await send('Runtime.evaluate', { expression: `window.__mau = []; (function tick(){ const l = document.getElementById('list'); window.__mau.push([performance.now(), ${info.doc ? 'l.scrollTop' : 'l.scrollLeft'}]); if (window.__mau.length < 400) requestAnimationFrame(tick) })()` })

  const frames = []
  ws.addEventListener('message', (m) => { const j = JSON.parse(m.data); if (j.method === 'Page.screencastFrame') { frames.push(Date.now()); send('Page.screencastFrameAck', { sessionId: j.params.sessionId }) } })
  await send('Page.startScreencast', { format: 'jpeg', quality: 40, maxWidth: 480, maxHeight: 480, everyNthFrame: 1 })
  await sleep(200); frames.length = 0

  // Bao wheel: 90 tick x 16ms, moi tick 100px (mot nac con lan chuot thuong), xuoi roi nguoc
  const t0 = Date.now()
  for (let i = 0; i < 90; i++) {
    const d = i < 60 ? 100 : -100
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: info.cx, y: info.cy, deltaX: 0, deltaY: d })
    await sleep(16)
  }
  await sleep(600)
  await send('Page.stopScreencast')
  const tong = Date.now() - t0

  const { result: { value: mau } } = await send('Runtime.evaluate', { returnByValue: true, expression: 'window.__mau' })
  const gaps = frames.slice(1).map((t, i) => t - frames[i]).sort((a, b) => a - b)
  const p = (q) => gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))] : -1
  const nhay = mau.slice(1).filter((m, i) => Math.abs(m[1] - mau[i][1]) > 60).length
  const dich = Math.max(...mau.map((m) => m[1])) - Math.min(...mau.map((m) => m[1]))
  const kq = { kieu: KIEU, anh: info.n, cuonDuoc: (info.doc ? info.sh - info.ch : info.sw - info.cw) + 'px', khungScreencast: frames.length, ms: tong, fps: +(frames.length / (tong / 1000)).toFixed(1), gapMax: gaps.at(-1), gapP95: p(0.95), gapP50: p(0.5), buocNhayTren60px: nhay, quangDuongCuon: dich + 'px', mauRAF: mau.length }
  console.log(JSON.stringify(kq))
  const dat = kq.gapP95 <= 40 && nhay === 0
  console.log(dat ? 'DAT' : 'TRUOT (gap-p95 > 40ms hoac co buoc nhay > 60px)')
  process.exitCode = dat ? 0 : 1
} catch (e) {
  console.error('LOI do:', e.message); process.exitCode = 2
} finally {
  try { ws && ws.close() } catch (e) {}
  try { process.platform === 'win32' ? spawn('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' }) : app.kill() } catch (e) {}
}
