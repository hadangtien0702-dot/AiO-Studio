// Bai thu cua api/polar-webhook.js. Khong mang, khong Gmail that: Polar + Gmail deu gia. Chay: node test-webhook.cjs
// Doi chung chu ky bang thu vien CHUAN "standardwebhooks" (cai o scratchpad/sw-check neu co; khong co thi bo qua muc doi chung).
const path = require('path'), crypto = require('crypto'), tls = require('tls'), fs = require('fs'), cp = require('child_process'), os = require('os')
const { Readable } = require('stream')
const hook = require(path.join(__dirname, '..', '..', 'aio-mail', 'api', 'polar-webhook.js'))
let dat = 0, hong = 0
const t = (ten, dk, ct) => { if (dk) { dat++; console.log('  DAT   ' + ten) } else { hong++; console.log('  HONG  ' + ten + (ct ? '  -> ' + ct : '')) } }

let SW = null
for (const p of [process.env.SW_LIB, 'C:/Users/hadan/AppData/Local/Temp/claude/D--Production-AiO-Studio/6f9562f2-a023-4de3-aead-8f5e0d584969/scratchpad/sw-check/node_modules/standardwebhooks']) {
  if (!p) continue
  try { SW = require(p).Webhook; break } catch (_) {}
}

const KHOA = 'AIOSS-7K2P-9QM4-X8TD-3WNB'
const bay = () => Math.floor(Date.now() / 1000)
function ky(secret, id, ts, body) {
  const k = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret, 'utf8')
  return 'v1,' + crypto.createHmac('sha256', k).update(id + '.' + ts + '.' + body).digest('base64')
}
function order(tuy = {}) {
  return Object.assign({
    id: '7f1c2a9e-0000-4000-8000-123456789abc', created_at: new Date().toISOString(), customer_id: 'cus-1',
    customer: { email: 'khach@example.com', name: 'Khach' }, total_amount: 1499, net_amount: 1499, currency: 'usd',
    billing_address: { country: 'VN' }
  }, tuy)
}
function req(body, h, method = 'POST') { const r = Readable.from([Buffer.from(body)]); r.method = method; r.headers = h; return r }
function res() { return { statusCode: 0, h: {}, body: '', setHeader(k, v) { this.h[k] = v }, end(b) { this.body = b } } }
function ghep(secret, ev, id, ts) {
  const body = JSON.stringify(ev)
  return { body, h: { 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': ky(secret, id, ts, body) } }
}
function khoKey(items) { return async () => ({ ok: true, json: async () => ({ items, pagination: { max_page: 1 } }) }) }
const mauMa = (o = {}) => Object.assign({ customer_id: 'cus-1', key: KHOA, status: 'granted', created_at: new Date().toISOString() }, o)

;(async () => {
  const SEC = 'whsec_' + crypto.randomBytes(32).toString('base64')
  const ENV = { POLAR_WEBHOOK_SECRET: SEC, POLAR_ACCESS_TOKEN: 'oat_test', GMAIL_USER: 'gui@example.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop', MAIL_BCC: 'toi@example.com' }
  let n = 0

  console.log('1. Chu ky')
  const b1 = JSON.stringify({ a: 1 }), id1 = 'msg_1', ts1 = bay()
  t('chu ky dung (cach moi) duoc nhan', hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': ky(SEC, id1, ts1, b1) }, SEC, Date.now()))
  t('chu ky sai bi tu choi', !hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': ky(SEC, id1, ts1, b1 + 'x') }, SEC, Date.now()))
  t('noi dung bi sua 1 ky tu bi tu choi', !hook.kiemChuKy(Buffer.from(b1 + ' '), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': ky(SEC, id1, ts1, b1) }, SEC, Date.now()))
  t('moc thoi gian cu 10 phut bi tu choi', !hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1 - 600), 'webhook-signature': ky(SEC, id1, ts1 - 600, b1) }, SEC, Date.now()))
  t('thieu header bi tu choi', !hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1 }, SEC, Date.now()))
  t('nhieu chu ky (v1,a v1,b) chi can 1 dung', hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': 'v1,AAAA ' + ky(SEC, id1, ts1, b1) }, SEC, Date.now()))
  const SEC_CU = 'whsec_' + crypto.randomBytes(16).toString('hex')   // webhook cu: khoa = byte UTF-8 cua ca chuoi
  t('webhook cu (khoa UTF-8 ca chuoi) van duoc nhan', hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': ky(SEC_CU, id1, ts1, b1) }, SEC_CU, Date.now()))
  if (SW) {
    const w = new SW(SEC), sig = w.sign(id1, new Date(ts1 * 1000), b1)
    t('DOI CHUNG: chu ky do thu vien chuan ky thi ham cua minh nhan', hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': sig }, SEC, Date.now()))
    let thuVienNhan = true
    try { w.verify(b1, { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': ky(SEC, id1, ts1, b1) }) } catch (e) { thuVienNhan = false }
    t('DOI CHUNG: thu vien chuan nhan chu ky do ham cua minh tinh', thuVienNhan)
    const wCu = new SW(Buffer.from(SEC_CU, 'utf8').toString('base64')), sigCu = wCu.sign(id1, new Date(ts1 * 1000), b1)
    t('DOI CHUNG: cach cu theo tai lieu Polar (base64 ca chuoi) cung nhan', hook.kiemChuKy(Buffer.from(b1), { 'webhook-id': id1, 'webhook-timestamp': String(ts1), 'webhook-signature': sigCu }, SEC_CU, Date.now()))
  } else console.log('  (bo qua doi chung: khong co thu vien standardwebhooks)')

  console.log('2. Xu ly don hang')
  async function chay(ev, tuy = {}, wid) {
    const gui = []; let lanFetch = 0
    const id = wid || ('msg_' + (++n)), ts = bay()
    const { body, h } = ghep(tuy.secret || SEC, ev, id, ts)
    const d = Object.assign({
      env: ENV, now: () => Date.now(), sleep: ms => new Promise(r => setTimeout(r, ms)), nganSachMs: 300, choMs: 10,
      fetch: async (u, o) => { lanFetch++; return (tuy.fetch || khoKey([mauMa()]))(u, o) },
      guiSmtp: async (cfg, thu) => { if (tuy.smtpLoi) throw new Error('SMTP 535 gia'); gui.push({ cfg, thu }) }
    }, tuy.d || {})
    const r = res(); await hook.taoXuLy(d)(req(body, h, tuy.method || 'POST'), r)
    return { r, gui, lanFetch, code: r.statusCode }
  }
  let k = await chay({ type: 'order.paid', data: order() })
  t('don hop le -> 200 + gui dung 1 thu', k.code === 200 && k.gui.length === 1, k.code + ' ' + k.r.body)
  const th = k.gui[0] && k.gui[0].thu
  t('thu gui dung dia chi khach', th && th.to === 'khach@example.com')
  t('khach o Viet Nam -> thu tieng Viet', th && /^Cảm ơn bạn/.test(th.subject), th && th.subject)
  t('ma ban quyen nam trong thu (HTML)', th && th.html.includes(KHOA))
  t('ma ban quyen nam trong thu (ban chu)', th && th.text.includes(KHOA))
  t('thu khong con o trong {{...}}', th && !/\{\{[a-z_]+\}\}/.test(th.html))
  t('anh tro toi dia chi cong khai tren web', th && th.html.includes('https://aio-shotsave.vercel.app/img/email/hero-stack.gif') && th.html.includes('https://aio-shotsave.vercel.app/img/email/kich-hoat-vi.gif'))
  t('gia hien $14.99', th && th.html.includes('$14.99'))
  t('ngay don theo gio Viet Nam dd/mm/yyyy', th && /\d{2}\/\d{2}\/\d{4}/.test(th.html.slice(th.html.indexOf('Mã đơn'))), '')
  t('nut tai tro toi cong khach Polar mac dinh', th && th.html.includes('href="https://polar.sh/aiostudio/portal"'))
  t('ban chep (BCC) truyen cho tang gui', k.gui[0] && k.gui[0].cfg.bcc === 'toi@example.com')
  k = await chay({ type: 'order.paid', data: order({ billing_address: { country: 'US' }, total_amount: 0, net_amount: 0 }) })
  t('khach nuoc ngoai -> thu tieng Anh + anh kich hoat ban en', k.gui[0] && /^Thank you!/.test(k.gui[0].thu.subject) && k.gui[0].thu.html.includes('kich-hoat-en.gif'), k.gui[0] && k.gui[0].thu.subject)
  t('don 0 dong hien $0.00', k.gui[0] && k.gui[0].thu.html.includes('$0.00'))
  k = await chay({ type: 'order.paid', data: order({ customer: { email: 'a"<b>@x.com' } }) })
  t('email la co dau nhay / < > duoc thoat trong HTML', k.gui[0] && !k.gui[0].thu.html.includes('a"<b>@x.com') && k.gui[0].thu.html.includes('a&quot;&lt;b&gt;@x.com'))

  k = await chay({ type: 'order.paid', data: order({ product: { name: 'AiO Shot & Save Tester' } }) })
  t('don san pham Tester -> thu ghi 1 may (HTML + ban chu), khong con 2 may', k.gui[0] && k.gui[0].thu.html.includes('Dùng trên 1 máy') && !k.gui[0].thu.html.includes('2 máy') && k.gui[0].thu.text.includes('1 máy') && !k.gui[0].thu.text.includes('2 máy'))
  k = await chay({ type: 'order.paid', data: order({ product: { name: 'AiO Shot & Save' }, billing_address: { country: 'US' } }) })
  t('don san pham ban that -> van ghi 2 may', k.gui[0] && k.gui[0].thu.html.includes('Works on 2 computers') && !k.gui[0].thu.html.includes('1 computer'))
  k = await chay({ type: 'order.paid', data: order({ product: { name: 'aio shot & save TESTER' }, billing_address: { country: 'US' } }) })
  t('Tester tieng Anh -> Works on 1 computer', k.gui[0] && k.gui[0].thu.html.includes('Works on 1 computer') && !k.gui[0].thu.html.includes('2 computers'))
  k = await chay({ type: 'order.created', data: order() })
  t('su kien khac order.paid -> 200, khong goi API, khong gui', k.code === 200 && k.gui.length === 0 && k.lanFetch === 0)
  k = await chay({ type: 'order.paid', data: order() }, { secret: 'whsec_' + crypto.randomBytes(32).toString('base64') })
  t('sai chu ky -> 401, khong goi API, khong gui', k.code === 401 && k.gui.length === 0 && k.lanFetch === 0)
  k = await chay({ type: 'order.paid', data: order() }, { method: 'GET' })
  t('khong phai POST -> 405', k.code === 405)
  k = await chay({ type: 'order.paid', data: order({ customer: { email: null } }) })
  t('don khong co email -> 200, khong gui, khong ket Polar thu lai', k.code === 200 && k.gui.length === 0)

  let lan = 0
  k = await chay({ type: 'order.paid', data: order() }, { fetch: async () => ({ ok: true, json: async () => ({ items: ++lan < 3 ? [] : [mauMa()], pagination: { max_page: 1 } }) }), d: { nganSachMs: 2000 } })
  t('ma tao cham (xuat hien o lan thu 3) van lay duoc va gui', k.code === 200 && k.gui.length === 1 && lan === 3, 'code=' + k.code + ' lan=' + lan)
  k = await chay({ type: 'order.paid', data: order() }, { fetch: khoKey([]) })
  t('khong bao gio thay ma -> 500 (de Polar thu lai), khong gui', k.code === 500 && k.gui.length === 0)
  k = await chay({ type: 'order.paid', data: order() }, { fetch: khoKey([mauMa({ customer_id: 'cus-KHAC' })]) })
  t('chi co ma cua KHACH KHAC -> khong gui nham, 500', k.code === 500 && k.gui.length === 0)
  k = await chay({ type: 'order.paid', data: order() }, { fetch: khoKey([mauMa({ created_at: new Date(Date.now() - 3600e3).toISOString() })]) })
  t('ma cu hon don 1 gio (cua lan mua truoc) khong lay nham, 500', k.code === 500 && k.gui.length === 0)
  k = await chay({ type: 'order.paid', data: order() }, { fetch: khoKey([mauMa({ key: 'AIOSS-CU', created_at: new Date(Date.now() - 60e3).toISOString() }), mauMa({ key: 'AIOSS-MOI' })]) })
  t('co nhieu ma cua khach -> lay ma MOI nhat', k.gui[0] && k.gui[0].thu.html.includes('AIOSS-MOI') && !k.gui[0].thu.html.includes('AIOSS-CU'))
  k = await chay({ type: 'order.paid', data: order() }, { fetch: async () => ({ ok: false, status: 401, json: async () => ({}) }) })
  t('Polar tu choi token (401) -> 500, khong gui', k.code === 500 && k.gui.length === 0)
  k = await chay({ type: 'order.paid', data: order() }, { smtpLoi: true })
  t('Gmail loi -> 500 (Polar thu lai), khong bao da gui', k.code === 500)
  const k1 = await chay({ type: 'order.paid', data: order() }, {}, 'msg_trung')
  const k2 = await chay({ type: 'order.paid', data: order() }, {}, 'msg_trung')
  t('Polar gui lai cung webhook-id -> chi gui 1 thu', k1.gui.length === 1 && k2.gui.length === 0 && k2.code === 200)
  for (const thieu of ['POLAR_ACCESS_TOKEN', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']) {
    const e2 = Object.assign({}, ENV); delete e2[thieu]
    k = await chay({ type: 'order.paid', data: order() }, { d: { env: e2 } })
    t('thieu ' + thieu + ' -> 500, khong gui, khong goi API', k.code === 500 && k.gui.length === 0 && k.lanFetch === 0)
  }

  console.log('3. Noi SMTP that voi may chu gia co TLS')
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'smtp-'))
  cp.execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(tam, 'k.pem'), '-out', path.join(tam, 'c.pem'), '-days', '1', '-subj', '/CN=127.0.0.1'], { stdio: 'ignore' })
  const nhat = []
  const srv = tls.createServer({ key: fs.readFileSync(path.join(tam, 'k.pem')), cert: fs.readFileSync(path.join(tam, 'c.pem')) }, s => {
    let buf = '', data = null
    s.write('220 gia ESMTP\r\n')
    s.on('data', d => {
      buf += d.toString('utf8')
      for (;;) {
        if (data !== null) { const i = buf.indexOf('\r\n.\r\n'); if (i < 0) return; nhat.push(['NOIDUNG', buf.slice(0, i)]); buf = buf.slice(i + 5); data = null; s.write('250 OK queued\r\n'); continue }
        const i = buf.indexOf('\r\n'); if (i < 0) return
        const l = buf.slice(0, i); buf = buf.slice(i + 2); nhat.push([l.split(' ')[0], l])
        if (/^EHLO/.test(l)) s.write('250-gia\r\n250 AUTH PLAIN\r\n')
        else if (/^AUTH/.test(l)) s.write('235 2.7.0 OK\r\n')
        else if (/^MAIL|^RCPT/.test(l)) s.write('250 OK\r\n')
        else if (/^DATA/.test(l)) { s.write('354 go\r\n'); data = '' }
        else if (/^QUIT/.test(l)) { s.write('221 bye\r\n'); s.end() }
      }
    })
  })
  await new Promise(r => srv.listen(0, '127.0.0.1', r))
  const cong = srv.address().port
  const cfg = { host: '127.0.0.1', port: cong, user: 'gui@example.com', pass: 'mat khau 16 ky tu', ten: 'AiO Studio', bcc: 'toi@example.com', tls: { rejectUnauthorized: false } }
  const dd = hook.dungThu(order(), KHOA, {})
  await hook.guiSmtp(cfg, dd)
  await new Promise(r => setTimeout(r, 150))   // QUIT con tren duong toi may chu gia khi ham vua tra ve
  const lenh = nhat.map(x => x[0])
  t('thu tu lenh SMTP dung (EHLO, AUTH, MAIL, RCPT x2, DATA, noi dung, QUIT)', lenh.join(',') === 'EHLO,AUTH,MAIL,RCPT,RCPT,DATA,NOIDUNG,QUIT', lenh.join(','))
  const auth = nhat.find(x => x[0] === 'AUTH')[1].split(' ')[2]
  t('AUTH PLAIN mang dung tai khoan + mat khau', Buffer.from(auth, 'base64').toString('utf8') === '\u0000gui@example.com\u0000mat khau 16 ky tu')
  t('RCPT: khach va ban sao', nhat.filter(x => x[0] === 'RCPT').map(x => x[1]).join('|') === 'RCPT TO:<khach@example.com>|RCPT TO:<toi@example.com>')
  const nd = nhat.find(x => x[0] === 'NOIDUNG')[1]
  const dongDai = Math.max(...nd.split('\r\n').map(x => x.length))
  t('moi dong thu <= 998 ky tu (chuan RFC)', dongDai <= 998, 'dai nhat ' + dongDai)
  t('From mang ten AiO Studio', /From: "AiO Studio" <gui@example\.com>/.test(nd))
  t('BCC khong lo trong dau thu', !/toi@example\.com/.test(nd.split('\r\n\r\n')[0]))
  const sub = nd.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/)
  t('tieu de tieng Viet ma hoa dung', sub && Buffer.from(sub[1], 'base64').toString('utf8') === dd.subject, sub && Buffer.from(sub[1], 'base64').toString('utf8'))
  const phan = nd.split(/--=_aio_[0-9a-f]+/).slice(1, 3).map(p => Buffer.from(p.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8'))
  t('phan chu mang ma ban quyen', phan[0] && phan[0].includes(KHOA))
  t('phan HTML giai ma ra dung nguyen ban (tieng Viet khong hong)', phan[1] === dd.html, phan[1] && ('lech o ky tu ' + [...phan[1]].findIndex((c, i) => c !== dd.html[i])))
  await new Promise(r => srv.close(r))
  let loiDuoc = false
  try { await hook.guiSmtp(Object.assign({}, cfg, { port: cong }), dd, { timeoutMs: 800 }) } catch (e) { loiDuoc = true }
  t('may chu tat -> bao loi (khong treo)', loiDuoc)
  fs.rmSync(tam, { recursive: true, force: true })

  console.log('\nKET QUA: ' + dat + ' DAT / ' + hong + ' HONG')
  process.exit(hong ? 1 : 0)
})().catch(e => { console.error('BAI THU CHET:', e); process.exit(2) })
