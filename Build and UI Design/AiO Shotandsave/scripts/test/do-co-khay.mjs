/* Do DOI CO khay bang tay nam goc tren-trai (anh Tien 14/09 "keo cai khay to ra").
   Chay:  node scripts/test/do-co-khay.mjs [doc|ngang]   (mac dinh ngang)
   Mo app --selftest-shelf (userData cach ly, anh CHI DOC), noi CDP 9333, goi dung
   duong renderer dung (window.shelf.resizeStart/To/End) roi do:
     1. keo len-trai 120x80 -> cua so RONG them 120, CAO them 80 (innerWidth/Height)
     2. o anh (.item) cao theo khay (ngang) / rong theo khay (doc)
     3. keo xuong-phai 500x500 -> KEP o SAN (= co mac dinh), khong nho hon
     4. keo len-trai 9999 -> KEP o TRAN (<= 60% man hinh chinh)
     5. tha -> config .selftest/userData/cau-hinh.json co khayCo[kieu]
     6. tay nam #grip co ton tai, cursor nwse-resize
   Thoat !=0 neu co phep truot. */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'
import fs from 'node:fs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const KIEU = process.argv[2] === 'doc' ? 'doc' : 'ngang'
const { createRequire } = await import('node:module')
const ELECTRON = createRequire(import.meta.url)('electron')
const CFG = path.join(ROOT, '.selftest', 'userData', 'cau-hinh.json')
// Xoa co da luu (neu con tu lan chay truoc) de do tu SAN
try { const c = JSON.parse(fs.readFileSync(CFG, 'utf8')); delete c.khayCo; fs.writeFileSync(CFG, JSON.stringify(c)) } catch (e) {}

const app = spawn(ELECTRON, ['.', '--selftest-shelf', '--khay=' + KIEU], { cwd: ROOT, stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (url) => new Promise((res, rej) => http.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej))
let ws, seq = 0; const pend = new Map()
function send(method, params = {}) { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pend.set(id, { res, rej })) }
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value
/* ☠️ Thuoc: main dat bounds theo DIP, renderer doc innerWidth/Height — tren man 150% hai
   phia lam tron khac nhau 1-4px (do 14/09: 537 vs 536; luc tao 448 -> inner 452). So voi
   dung sai 4px, khong so bang. */
const GAN = (a, b) => Math.abs(a - b) <= 4
const kq = []; let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? 'DAT ' : 'TRUOT') + ' · ' + ten + (chiTiet ? ' · ' + chiTiet : '')); if (!ok) dat = false }

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
  ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result) } }
  await send('Runtime.enable')
  for (let i = 0; i < 30 && (await ev("document.querySelectorAll('#list .item').length")) < 1; i++) await sleep(200)

  const doCo = () => ev("JSON.stringify({ w: window.innerWidth, h: window.innerHeight, item: (() => { const r = document.querySelector('#list .item'); return r ? [Math.round(r.getBoundingClientRect().width), Math.round(r.getBoundingClientRect().height)] : null })(), n: document.querySelectorAll('#list .item').length })").then(JSON.parse)
  const keo = async (dx, dy) => { await ev('window.shelf.resizeStart()'); await sleep(60); await ev(`window.shelf.resizeTo(${dx}, ${dy})`); await sleep(120); await ev('window.shelf.resizeEnd()'); await sleep(200) }

  const c0 = await doCo()
  kiem('tay nam #grip ton tai, cursor nwse-resize', await ev("(() => { const g = document.getElementById('grip'); return !!g && getComputedStyle(g).cursor === 'nwse-resize' })()"))
  kiem('co ban dau = san (' + KIEU + ')', KIEU === 'doc' ? (GAN(c0.w, 252) && GAN(c0.h, 448)) : (GAN(c0.w, 380) && GAN(c0.h, 128)), c0.w + 'x' + c0.h)

  await keo(-120, -80)
  const c1 = await doCo()
  kiem('keo len-trai 120x80 -> rong +120, cao +80', GAN(c1.w, c0.w + 120) && GAN(c1.h, c0.h + 80), c0.w + 'x' + c0.h + ' -> ' + c1.w + 'x' + c1.h)
  /* 14/09 anh Tien: to ra = THAY NHIEU ANH HON, o anh GIU co. Ngang: so HANG tang; doc: so COT tang. */
  const hangCot = () => ev("JSON.stringify((() => { const its = [...document.querySelectorAll('#list .item')]; return { hang: new Set(its.map((e) => Math.round(e.getBoundingClientRect().top))).size, cot: new Set(its.map((e) => Math.round(e.getBoundingClientRect().left))).size } })())").then(JSON.parse)
  const hc0 = await hangCot(), hc1 = await hangCot()
  if (KIEU === 'ngang') kiem('o anh GIU co 64px, cao +80 -> them HANG', c1.item && c1.item[1] === c0.item[1] && hc1.hang >= 2, 'o ' + (c0.item || []).join('x') + ' -> ' + (c1.item || []).join('x') + ', hang=' + hc1.hang)
  else kiem('o anh GIU co, rong +120 -> them COT', c1.item && Math.abs(c1.item[1] - c0.item[1]) <= 60 && hc1.cot >= 2, 'o ' + (c0.item || []).join('x') + ' -> ' + (c1.item || []).join('x') + ', cot=' + hc1.cot)

  await keo(500, 500)
  const c2 = await doCo()
  kiem('keo xuong-phai 500 -> KEP o san, khong nho hon mac dinh', GAN(c2.w, c0.w) && GAN(c2.h, c0.h), c2.w + 'x' + c2.h)

  await keo(-9999, -9999)
  const c3 = await doCo()
  const trần = await ev("JSON.stringify([screen.availWidth, screen.availHeight])").then(JSON.parse)
  kiem('keo 9999 -> KEP o tran (<= 60% man chinh)', c3.w <= Math.round(trần[0] * 0.6) + 1 && c3.h <= Math.round(trần[1] * 0.6) + 1 && c3.w > c1.w, c3.w + 'x' + c3.h + ' (man ' + trần.join('x') + ')')

  /* 14/09 anh Tien "vao khay bi mo": o co lon nhat, anh NGUON phai >= diem anh thiet bi hien thi. */
  const net = await ev("(() => { const im = [...document.querySelectorAll('#list .item img')].sort((a, b) => b.naturalHeight - a.naturalHeight)[0]; /* anh LON nhat trong khay — anh goc nho thi khong the net hon goc */ const r = im.getBoundingClientRect(); return JSON.stringify({ nat: [im.naturalWidth, im.naturalHeight], hien: [Math.round(r.width * devicePixelRatio), Math.round(r.height * devicePixelRatio)], kb: Math.round(im.src.length * 3 / 4 / 1024) }) })()").then(JSON.parse)
  kiem('NET o co lon nhat: anh nguon >= diem anh hien thi', net.nat[1] >= Math.min(net.hien[1], 300) * 0.95 /* nguon nho hon 320 thi giu nguyen, khong phong */, 'nguon ' + net.nat.join('x') + ' vs hien ' + net.hien.join('x') + ' thiet bi, ' + net.kb + 'KB')
  await keo(400, 300)
  const c4 = await doCo()
  let cfg = {}
  try { cfg = JSON.parse(fs.readFileSync(CFG, 'utf8')) } catch (e) {}
  const luu = (cfg.khayCo || {})[KIEU]
  kiem('tha -> config khayCo[' + KIEU + '] = co hien tai', !!luu && GAN(luu.w, c4.w) && GAN(luu.h, c4.h), JSON.stringify(luu) + ' vs ' + c4.w + 'x' + c4.h)
} catch (e) { kiem('LOI harness: ' + e.message, false) }
finally {
  /* Don: xoa co da luu trong userData test — khong thi test:khay doc chay sau mo khay 1136px,
     7 cot, 20 anh vua khit -> cuon 0px (vap 14/09, xanh gia). */
  try { const c = JSON.parse(fs.readFileSync(CFG, 'utf8')); delete c.khayCo; fs.writeFileSync(CFG, JSON.stringify(c)) } catch (e) {}
  try { spawn('taskkill', ['/pid', String(app.pid), '/T', '/F'], { stdio: 'ignore' }) } catch (e) {}
  console.log(kq.join('\n')); console.log(dat ? 'DAT ' + kq.length + '/' + kq.length : 'TRUOT')
  process.exitCode = dat ? 0 : 1
}
