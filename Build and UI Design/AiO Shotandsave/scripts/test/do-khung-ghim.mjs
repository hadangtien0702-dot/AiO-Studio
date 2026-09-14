/* Do DINH VI khung ve tren cua so GHIM: keo chuot tu (x1,y1) -> (x2,y2) CSS px,
   roi doc bbox pixel THAT tren canvas (quy ve CSS px) — lech phai 0.
   Chay: node scripts/test/do-khung-ghim.mjs <thu-muc-BAN-SAO-anh>
   (anh Tien 10/09: "chỗ anh cần vẽ thì nó lại nhảy xa ra một chỗ khác" —
   goc: canvas #ve khong co kich thuoc CSS -> to gap DPR lan tren man 150%). */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ANH_DIR = process.argv[2]
if (!ANH_DIR || !fs.existsSync(ANH_DIR)) { console.error('Can thu muc BAN SAO anh'); process.exit(2) }
const ELECTRON = createRequire(import.meta.url)('electron')
const app = spawn(ELECTRON, ['.', '--selftest-shelf', '--khay=doc'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, AIO_TEST_ANH_DIR: ANH_DIR } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (url) => new Promise((res, rej) => http.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej))
async function noi(url) {
  const ws = new WebSocket(url); await new Promise((r) => ws.onopen = r)
  let seq = 0; const pend = new Map()
  ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result) } }
  const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pend.set(id, { res, rej })) }
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value
  await send('Runtime.enable'); return { ws, send, ev }
}
async function timTarget(chua, lan = 40) {
  for (let i = 0; i < lan; i++) { await sleep(250); try { const t = (await getJson('http://127.0.0.1:9333/json')).find((x) => x.url.includes(chua)); if (t) return t } catch (e) {} }
  throw new Error('khong thay cua so ' + chua)
}
const chuot = (c, type, x, y) => c.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
let shelf, pin, dat = false
try {
  shelf = await noi((await timTarget('shelf/index.html')).webSocketDebuggerUrl); await sleep(800)
  const [sx, sy] = await shelf.ev("(() => { const r = document.querySelector('#list .item img').getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2] })()")
  await chuot(shelf, 'mousePressed', sx, sy); await chuot(shelf, 'mouseReleased', sx, sy)
  pin = await noi((await timTarget('pin/index.html')).webSocketDebuggerUrl); await sleep(700)
  await pin.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '1', code: 'Digit1', text: '1' }); await pin.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '1', code: 'Digit1' }); await sleep(150)
  const hh = await pin.ev("JSON.stringify((() => { const f = frame.getBoundingClientRect(), v = veEl.getBoundingClientRect(); return { DPR, dip, frame: [f.width, f.height], canvasCss: [v.width, v.height], canvasAttr: [veEl.width, veEl.height], tiLeCssTrenDip: +(v.width / dip.w).toFixed(3) } })())")
  console.log('hinh hoc:', hh)
  // Keo khung tu (60,50) -> (200,150) CSS px tinh tu goc canvas
  const [ox, oy] = await pin.ev("(() => { const r = veEl.getBoundingClientRect(); return [r.x, r.y] })()")
  const x1 = 60, y1 = 50, x2 = 200, y2 = 150
  await chuot(pin, 'mousePressed', ox + x1, oy + y1)
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: ox + 120, y: oy + 100, button: 'left' })
  await chuot(pin, 'mouseReleased', ox + x2, oy + y2); await sleep(150)
  const s = await pin.ev('JSON.stringify(shapes[0] || null)')
  // bbox pixel co alpha tren canvas (device px) -> quy ve CSS px theo ti le CSS/attr
  const bb = await pin.ev("JSON.stringify((() => { const w = veEl.width, h = veEl.height, d = veCtx.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y } } const r = veEl.getBoundingClientRect(); const k = r.width / w; return { device: [x0, y0, x1, y1], css: [x0 * k, y0 * k, x1 * k, y1 * k].map(v => +v.toFixed(1)) } })())")
  const b = JSON.parse(bb)
  // Net ve day 3px, mep ngoai lech ~1.5px so voi toa do chuot
  const lech = Math.max(Math.abs(b.css[0] - x1), Math.abs(b.css[1] - y1), Math.abs(b.css[2] - x2), Math.abs(b.css[3] - y2))
  console.log('shape:', s)
  console.log('khung ve ra (CSS px):', JSON.stringify(b.css), '· chuot:', JSON.stringify([x1, y1, x2, y2]), '· lech max:', lech.toFixed(1), 'px')
  dat = lech <= 3
  console.log(dat ? 'DAT — khung nam dung cho chuot' : 'TRUOT — khung lech ' + lech.toFixed(1) + 'px (gap ' + (b.css[2] / x2).toFixed(2) + ' lan)')
} catch (e) { console.log('LOI harness:', e.message) }
finally {
  process.exitCode = dat ? 0 : 1
  try { shelf && shelf.ws.close(); pin && pin.ws.close() } catch (e) {}
  try { spawn('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' }) } catch (e) {}
}
