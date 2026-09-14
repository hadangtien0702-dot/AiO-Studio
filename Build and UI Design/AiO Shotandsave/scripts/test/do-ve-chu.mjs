/* Do cong cu CHU (phim 3) + phim 1/2/3 + bo but chi tren cua so GHIM, qua CDP.
   Chay:  node scripts/test/do-ve-chu.mjs <thu-muc-BAN-SAO-anh>
   ☠️ Phai dua thu muc BAN SAO: buoc luu se GHI DE file anh (dung nhu that).
   Cac buoc: mo app --selftest-shelf (AIO_TEST_ANH_DIR) -> bam anh dau khay ->
   cua so ghim -> kiem #edit KHONG con -> phim 3 -> bam giua anh -> go chu ->
   Enter (chot) -> dem pixel mau tren canvas -> Enter (luu) -> file doi -> phim 1
   tu che do xem vao thang che do ve khung. Thoat !=0 neu bat ky buoc nao sai. */
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
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value
  await send('Runtime.enable')
  return { ws, send, ev }
}
async function timTarget(chua, lan = 40) {
  for (let i = 0; i < lan; i++) { await sleep(250); try { const t = (await getJson('http://127.0.0.1:9333/json')).find((x) => x.url.includes(chua)); if (t) return t } catch (e) {} }
  throw new Error('khong thay cua so ' + chua)
}
const kq = []; let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? 'DAT ' : 'TRUOT') + ' · ' + ten + (chiTiet ? ' · ' + chiTiet : '')); if (!ok) dat = false }
const phim = (c, key, extra = {}) => c.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: extra.code || 'Digit' + key, ...(key.length === 1 ? { text: key } : key === 'Enter' ? { text: String.fromCharCode(13) } : {}), ...extra }).then(() => c.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: extra.code || 'Digit' + key, ...extra }))

const files0 = Object.fromEntries(fs.readdirSync(ANH_DIR).map((f) => [f, fs.statSync(path.join(ANH_DIR, f)).size]))
let shelf, pin
try {
  shelf = await noi((await timTarget('shelf/index.html')).webSocketDebuggerUrl)
  /* Cho toi khi khay CO o (toi da 6s) — 14/09: 2 JPEG 3015px giai ma cham hon
     800ms, thuoc voi bao "0 anh" trong khi run-log da ghi anh=2 (bai 5f). */
  let n = 0
  for (let i = 0; i < 30 && n < 1; i++) { await sleep(200); n = await shelf.ev("document.querySelectorAll('#list .item').length") }
  kiem('khay co anh', n >= 1, n + ' anh')
  // bam thumbnail dau (goi window.shelf.pin qua click that)
  await shelf.ev("(() => { const el = document.querySelector('#list .item img'); const r = el.getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2] })()").then(async ([x, y]) => {
    await shelf.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await shelf.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  })
  pin = await noi((await timTarget('pin/index.html')).webSocketDebuggerUrl)
  await sleep(700)
  kiem('nut but chi #edit da bo', await pin.ev("document.getElementById('edit') === null"))
  kiem('3 nut cong cu co so 1/2/3', await pin.ev("[...document.querySelectorAll('.cong-cu[data-tool] .so')].map(e => e.textContent).join('')") === '123')
  const soCss = await pin.ev("(() => { const e = document.querySelector('.cong-cu .so'); const c = getComputedStyle(e); return c.fontSize + '/' + c.position })()")
  kiem('so nho 8px, absolute', soCss === '8px/absolute', soCss)
  kiem('che do xem ban dau', await pin.ev('mode') === 'view')

  await phim(pin, '3'); await sleep(150)
  kiem('phim 3 -> che do ve, cong cu text', await pin.ev("mode + '/' + tool + '/' + (getComputedStyle(toolbarEl).pointerEvents === 'none' ? 'an' : 'hien') + '/' + document.querySelector('.cong-cu.chon')?.dataset.tool") === 've/text/hien/text')
  const [cx, cy] = await pin.ev("(() => { const r = veEl.getBoundingClientRect(); return [r.x + r.width * 0.3, r.y + r.height * 0.4] })()")
  await pin.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 })
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 })
  await sleep(120)
  kiem('bam anh -> o go chu hien + focus', await pin.ev("!!oGoChu && document.activeElement === oGoChu"))
  await pin.send('Input.insertText', { text: 'AiO test' })
  await sleep(80)
  kiem('go chu vao o', await pin.ev('oGoChu.value') === 'AiO test')
  await phim(pin, 'Enter', { code: 'Enter', windowsVirtualKeyCode: 13 }); await sleep(150)
  const sauEnter = await pin.ev("JSON.stringify({ o: !!oGoChu, n: shapes.length, t: shapes[0] && shapes[0].type, txt: shapes[0] && shapes[0].text, mode })")
  kiem('Enter -> chot shape text, van o che do ve', sauEnter === JSON.stringify({ o: false, n: 1, t: 'text', txt: 'AiO test', mode: 've' }), sauEnter)
  const px = await pin.ev("(() => { const d = veCtx.getImageData(0, 0, veEl.width, veEl.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n })()")
  kiem('canvas co pixel chu ve ra', px > 200, px + ' px')
  const nen = await pin.ev("(() => { const d = veCtx.getImageData(0, 0, veEl.width, veEl.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 150 && d[i] < 40 && d[i+1] < 40 && d[i+2] < 40) n++; return n })()")
  kiem('co HOP NEN toi sau chu (14/09)', nen > px * 0.5 && nen > 500, nen + ' px toi / ' + px + ' px co alpha')
  const truocSrc = await pin.ev('img.src.length')
  await phim(pin, 'Enter', { code: 'Enter', windowsVirtualKeyCode: 13 }); await sleep(900)
  kiem('Enter lan 2 -> luu, ve che do xem, anh doi', await pin.ev("mode === 'view' && img.src.startsWith('data:') && img.src.length !== " + truocSrc))
  const files1 = Object.fromEntries(fs.readdirSync(ANH_DIR).map((f) => [f, fs.statSync(path.join(ANH_DIR, f)).size]))
  const doi = Object.keys(files1).filter((f) => files0[f] !== files1[f])
  kiem('dung 1 file ban sao bi ghi de', doi.length === 1, doi.join(',') + ' (' + Object.keys(files1).length + ' file, khong them file moi: ' + (Object.keys(files1).length === Object.keys(files0).length) + ')')

  await phim(pin, '1'); await sleep(120)
  kiem('phim 1 tu che do xem -> ve khung', await pin.ev("mode + '/' + tool") === 've/rect')
  /* 14/09 anh Tien: bam CHUOT vao nut tren thanh cong cu cua anh ghim khong an, phim 1/2/3 an. */
  const [bx, by] = await pin.ev("(() => { const r = document.querySelector('.cong-cu[data-tool=\"arrow\"]').getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2] })()")
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bx, y: by })
  await pin.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bx, y: by, button: 'left', clickCount: 1 })
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bx, y: by, button: 'left', clickCount: 1 })
  await sleep(120)
  const topEl = await pin.ev("(() => { const e = document.elementFromPoint(" + bx + "," + by + "); return e ? (e.id || e.tagName + '.' + e.className) : 'null' })()")
  kiem('BAM CHUOT nut mui ten -> tool=arrow (14/09)', await pin.ev('tool') === 'arrow', 'tool=' + await pin.ev('tool') + ' phan tu tren cung tai nut=' + topEl)
  await phim(pin, 'Escape', { code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(120)
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 }); await sleep(300) // dua chuot ra ngoai anh
  const xem1 = await pin.ev("mode + '/' + getComputedStyle(toolbarEl).pointerEvents + '/' + getComputedStyle(toolbarEl).opacity")
  kiem('che do XEM: toolbar khong nhan chuot khi chua re', xem1 === 'view/none/0', xem1)
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bx, y: by }); await sleep(250)
  const xem2 = await pin.ev("getComputedStyle(toolbarEl).opacity + '/' + getComputedStyle(toolbarEl).pointerEvents + '/' + [...toolbarEl.querySelectorAll('button')].filter(b => b.getClientRects().length > 0).length")
  kiem('che do XEM: re chuot -> toolbar hien, chi 3 nut', xem2 === '1/auto/3', xem2)
  const [cx2, cy2] = await pin.ev("(() => { const r = document.querySelector('.cong-cu[data-tool=\"arrow\"]').getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2] })()") // thanh co lai o che do xem -> lay lai toa do
  await pin.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx2, y: cy2, button: 'left', clickCount: 1 })
  await pin.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx2, y: cy2, button: 'left', clickCount: 1 }); await sleep(120)
  const xem3 = await pin.ev("mode + '/' + tool + '/' + [...toolbarEl.querySelectorAll('button')].filter(b => b.getClientRects().length > 0).length")
  kiem('che do XEM: BAM CHUOT nut mui ten -> vao ve, tool=arrow', xem3 === 've/arrow/13', xem3)
  await phim(pin, '1'); await sleep(60)
  await phim(pin, '2'); await sleep(80)
  kiem('phim 2 -> mui ten', await pin.ev('tool') === 'arrow')
  await phim(pin, 'Escape', { code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(120)
  kiem('Esc -> thoat ve, cua so con', await pin.ev("mode === 'view'"))
} catch (e) { kiem('LOI harness: ' + e.message, false) }
finally {
  console.log(kq.join('\n')); console.log(dat ? 'DAT ' + kq.length + '/' + kq.length : 'TRUOT')
  process.exitCode = dat ? 0 : 1
  try { shelf && shelf.ws.close(); pin && pin.ws.close() } catch (e) {}
  try { spawn('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' }) } catch (e) {}
}
