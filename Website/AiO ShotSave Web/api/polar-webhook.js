/*
  polar-webhook.js - Polar bao "don da tra tien" (order.paid) -> gui THU CAM ON co ma ban quyen cho khach.
  Lap 16/10/2026 (anh Tien: thu "AiO Studio" co chuyen dong, KHONG dung n8n, gui qua Gmail + mat khau ung dung).

  Luong: Polar POST /api/polar-webhook -> kiem chu ky (Standard Webhooks) -> chi xu ly "order.paid"
         -> lay MA BAN QUYEN qua API Polar (ma khong nam trong su kien) -> dung mau thu (api/_mau-thu.js, sinh tu
         email/cam-on-mua.v3.*.html) -> gui qua smtp.gmail.com:465.
  Khong dung thu vien ngoai (de khong doi cach dung cua web tinh): tu noi SMTP bang node:tls.

  BIEN MOI TRUONG (dat trong Vercel, KHONG ghi vao repo):
    POLAR_WEBHOOK_SECRET   chuoi whsec_... Polar hien khi tao webhook
    POLAR_ACCESS_TOKEN     Organization Access Token, quyen license_keys:read
    GMAIL_USER             dia chi Gmail gui thu
    GMAIL_APP_PASSWORD     "mat khau ung dung" 16 ky tu cua Google (khong phai mat khau Gmail)
    MAIL_BCC               (tuy chon) dia chi nhan ban sao moi thu gui di, de anh tu theo doi
    DOWNLOAD_WIN_URL / DOWNLOAD_MAC_URL   (tuy chon) link nut Tai; mac dinh = cong khach cua Polar
    POLAR_ORG_ID           (tuy chon) mac dinh = to chuc aiostudio

  Ma tra ve: 200 xu ly xong hoac bo qua (khong phai order.paid); 401 sai chu ky; 405 khong phai POST;
  500 loi TAM THOI (chua thay ma, Gmail loi, thieu cau hinh) de Polar thu lai (toi da 10 lan, sau do tat endpoint).
  Polar cho toi da 10 giay -> ngan sach cho tim ma ~6 giay.
*/
'use strict'
const crypto = require('node:crypto')
const tls = require('node:tls')
const MAU = require('./_mau-thu.js')

const ORG_ID_MAC_DINH = '05f1edf9-2456-4d3f-8ff1-a824e433673e'
const ASSET_BASE = 'https://aio-shotsave.vercel.app/img/email'
const CONG_KHACH = 'https://polar.sh/aiostudio/portal'
const DA_GUI = new Set()   // webhook-id da gui (chi trong 1 phien chay cua ham, dung de chong gui trung khi Polar thu lai)

// ---------- chu ky (Standard Webhooks) ----------
// Webhook tao tu 08/09/2026: khoa = base64-giai-ma(phan sau "whsec_"). Webhook cu hon: khoa = byte UTF-8 cua ca chuoi. Thu ca hai.
function kiemChuKy(raw, h, secret, nowMs) {
  const id = h['webhook-id'], ts = h['webhook-timestamp'], sigs = h['webhook-signature']
  if (!id || !ts || !sigs || !secret) return false
  const t = Number(ts)
  if (!Number.isFinite(t) || Math.abs(nowMs / 1000 - t) > 300) return false
  const khoa = []
  if (secret.startsWith('whsec_')) khoa.push(Buffer.from(secret.slice(6), 'base64'))
  khoa.push(Buffer.from(secret, 'utf8'))
  const ky = Buffer.concat([Buffer.from(id + '.' + ts + '.', 'utf8'), raw])
  const ungVien = String(sigs).split(' ').map(s => s.split(',')).filter(p => p[0] === 'v1' && p[1]).map(p => Buffer.from(p[1], 'base64'))
  for (const k of khoa) {
    const mong = crypto.createHmac('sha256', k).update(ky).digest()
    for (const c of ungVien) if (c.length === mong.length && crypto.timingSafeEqual(c, mong)) return true
  }
  return false
}

// ---------- tim ma ban quyen qua API Polar ----------
async function timMa(order, d) {
  const url0 = new URL('https://api.polar.sh/v1/license-keys/')
  url0.searchParams.set('organization_id', d.env.POLAR_ORG_ID || ORG_ID_MAC_DINH)
  url0.searchParams.set('status', 'granted')
  url0.searchParams.set('limit', '100')
  const tuLuc = Date.parse(order.created_at) - 10 * 60 * 1000
  const het = d.now() + d.nganSachMs
  for (let lan = 0; ; lan++) {
    let trang = 1, maxTrang = 1
    do {
      url0.searchParams.set('page', String(trang))
      const r = await d.fetch(url0.toString(), { headers: { Authorization: 'Bearer ' + d.env.POLAR_ACCESS_TOKEN, Accept: 'application/json' } })
      if (!r.ok) throw new Error('Polar API ' + r.status)
      const j = await r.json()
      maxTrang = (j.pagination && j.pagination.max_page) || 1
      const ds = (j.items || []).filter(k => k.customer_id === order.customer_id && k.key && Date.parse(k.created_at) >= tuLuc)
      ds.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      if (ds.length) return ds[0].key
      trang++
    } while (trang <= maxTrang && trang <= 5)
    if (d.now() + d.choMs >= het) return null
    await d.sleep(d.choMs)
  }
}

// ---------- mau thu ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function ngonNgu(order) {
  const q = order.billing_address && order.billing_address.country
  const q2 = order.customer && order.customer.billing_address && order.customer.billing_address.country
  return (q || q2) === 'VN' ? 'vi' : 'en'
}
function dinhDang(order, ng) {
  const so = (order.total_amount != null ? order.total_amount : order.net_amount || 0) / 100
  const gia = new Intl.NumberFormat('en-US', { style: 'currency', currency: String(order.currency || 'usd').toUpperCase() }).format(so)
  const ngay = ng === 'vi'
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(order.created_at))
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(order.created_at))
  return { gia, ngay }
}
function dungThu(order, ma, env) {
  const ng = ngonNgu(order)
  const { gia, ngay } = dinhDang(order, ng)
  const email = (order.customer && order.customer.email) || ''
  const win = env.DOWNLOAD_WIN_URL || CONG_KHACH, mac = env.DOWNLOAD_MAC_URL || CONG_KHACH
  const idNgan = String(order.id).replace(/-/g, '').slice(0, 8).toUpperCase()
  const dien = {
    asset_base: ASSET_BASE, customer_email: esc(email), license_key: esc(ma), order_id: esc(idNgan), order_date: esc(ngay),
    price: esc(gia), download_win: esc(win), download_mac: esc(mac)
  }
  let html = MAU[ng]
  for (const [k, v] of Object.entries(dien)) html = html.split('{{' + k + '}}').join(v)
  const chuaDien = html.match(/\{\{[a-z_]+\}\}/g)
  if (chuaDien) throw new Error('mau thu con o trong: ' + chuaDien.join(','))
  const L = ng === 'vi'
    ? { sub: 'Cảm ơn bạn! Mã bản quyền Shot & Save của bạn', t: ['Cảm ơn bạn đã mua Shot & Save.', 'Mã bản quyền của bạn:', 'Tải cho Windows:', 'Tải cho macOS:', 'Kích hoạt: mở app từ biểu tượng ở khay hệ thống, vào Cài đặt, thẻ Bản quyền, dán mã rồi bấm Kích hoạt.', 'Dùng trên 2 máy. Cập nhật miễn phí trọn đời. Hoàn tiền trong 14 ngày. Cần hỗ trợ, bạn cứ trả lời thư này.', 'Mã đơn'] }
    : { sub: 'Thank you! Your Shot & Save license key', t: ['Thank you for buying Shot & Save.', 'Your license key:', 'Download for Windows:', 'Download for macOS:', 'Activate: open the app from the system tray icon, go to Settings, the License tab, paste the key and click Activate.', 'Works on 2 computers. Free updates for life. 14-day refund. Need help? Just reply to this email.', 'Order'] }
  const text = [L.t[0], '', L.t[1], ma, '', L.t[2] + ' ' + win, L.t[3] + ' ' + mac, '', L.t[4], '', L.t[5], '', L.t[6] + ' ' + idNgan + ' · ' + ngay].join('\r\n')
  return { to: email, subject: L.sub, html, text }
}

// ---------- SMTP toi thieu (TLS ngam dinh, cong 465) ----------
function mimeThu({ from, to, replyTo, subject, html, text, ten }) {
  const bien = '=_aio_' + crypto.randomBytes(12).toString('hex')
  const b64 = s => Buffer.from(s, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n')
  const tieuDe = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?='
  const dau = [
    'From: "' + ten + '" <' + from + '>', 'To: <' + to + '>', 'Reply-To: <' + (replyTo || from) + '>',
    'Subject: ' + tieuDe, 'Date: ' + new Date().toUTCString(), 'Message-ID: <' + crypto.randomBytes(12).toString('hex') + '@' + from.split('@')[1] + '>',
    'MIME-Version: 1.0', 'Content-Type: multipart/alternative; boundary="' + bien + '"'
  ].join('\r\n')
  const phan = t => '--' + bien + '\r\nContent-Type: ' + t[0] + '; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n' + b64(t[1]) + '\r\n'
  return dau + '\r\n\r\n' + phan(['text/plain', text]) + phan(['text/html', html]) + '--' + bien + '--\r\n'
}
function guiSmtp(cfg, thu, tuy = {}) {
  const connect = tuy.connect || tls.connect
  const msg = mimeThu({ from: cfg.user, to: thu.to, replyTo: cfg.replyTo, subject: thu.subject, html: thu.html, text: thu.text, ten: cfg.ten })
  const nguoiNhan = [thu.to].concat(cfg.bcc ? [cfg.bcc] : [])
  return new Promise((resolve, reject) => {
    const sock = connect(Object.assign({ host: cfg.host, port: cfg.port, servername: cfg.host }, cfg.tls || {}))
    let buf = '', cur = [], xong = false
    const hang = [], cho = []
    const chet = e => { if (!xong) { xong = true; try { sock.destroy() } catch (_) {} reject(e) } }
    sock.setTimeout(tuy.timeoutMs || 8000, () => chet(new Error('SMTP het gio')))
    sock.on('error', chet)
    sock.on('close', () => { if (!xong) chet(new Error('SMTP dong ket noi som')) })
    sock.on('data', d => {
      buf += d.toString('utf8')
      let i
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const dong = buf.slice(0, i); buf = buf.slice(i + 2); cur.push(dong)
        if (/^\d{3} /.test(dong) || /^\d{3}$/.test(dong)) {
          const r = { code: Number(dong.slice(0, 3)), text: cur.join('\n') }; cur = []
          if (cho.length) cho.shift()(r); else hang.push(r)
        }
      }
    })
    const doc = () => new Promise(r => { if (hang.length) r(hang.shift()); else cho.push(r) })
    const lenh = async (l, ok) => {
      if (l !== null) sock.write(l + '\r\n')
      const r = await doc()
      if (!ok.includes(r.code)) throw new Error('SMTP ' + r.code + ' ' + r.text.slice(0, 160))
      return r
    }
    ;(async () => {
      await lenh(null, [220])
      await lenh('EHLO aio-shotsave.vercel.app', [250])
      await lenh('AUTH PLAIN ' + Buffer.from('\u0000' + cfg.user + '\u0000' + cfg.pass, 'utf8').toString('base64'), [235])
      await lenh('MAIL FROM:<' + cfg.user + '>', [250])
      for (const n of nguoiNhan) await lenh('RCPT TO:<' + n + '>', [250, 251])
      await lenh('DATA', [354])
      await lenh(msg.replace(/\r\n\./g, '\r\n..') + '\r\n.', [250])
      try { sock.write('QUIT\r\n') } catch (_) {}
      xong = true; sock.end(); resolve()
    })().catch(chet)
  })
}

// ---------- xu ly ----------
function doc(req) {
  return new Promise((resolve, reject) => { const c = []; req.on('data', x => c.push(x)); req.on('end', () => resolve(Buffer.concat(c))); req.on('error', reject) })
}
function tra(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)) }

function taoXuLy(tuy = {}) {
  const d = Object.assign({
    env: process.env, fetch: (...a) => fetch(...a), now: () => Date.now(), sleep: ms => new Promise(r => setTimeout(r, ms)),
    nganSachMs: 6000, choMs: 1500, guiSmtp
  }, tuy)
  return async function xuLy(req, res) {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return tra(res, 405, { loi: 'chi nhan POST' }) }
    const raw = await doc(req)
    const e = d.env
    if (!kiemChuKy(raw, req.headers, e.POLAR_WEBHOOK_SECRET || '', d.now())) return tra(res, 401, { loi: 'sai chu ky' })
    let ev
    try { ev = JSON.parse(raw.toString('utf8')) } catch (_) { return tra(res, 400, { loi: 'khong doc duoc JSON' }) }
    if (ev.type !== 'order.paid') return tra(res, 200, { boQua: ev.type })
    const wid = req.headers['webhook-id']
    if (DA_GUI.has(wid)) return tra(res, 200, { trung: true })
    const order = ev.data || {}
    const email = order.customer && order.customer.email
    if (!email) { console.log('order.paid ' + order.id + ' khong co email khach, bo qua'); return tra(res, 200, { boQua: 'khong co email' }) }
    for (const k of ['POLAR_ACCESS_TOKEN', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']) {
      if (!e[k]) { console.error('thieu bien moi truong ' + k); return tra(res, 500, { loi: 'thieu cau hinh' }) }
    }
    try {
      const ma = await timMa(order, d)
      if (!ma) { console.error('order ' + order.id + ': chua thay ma ban quyen, de Polar thu lai'); return tra(res, 500, { loi: 'chua co ma' }) }
      const thu = dungThu(order, ma, e)
      await d.guiSmtp({ host: 'smtp.gmail.com', port: 465, user: e.GMAIL_USER, pass: e.GMAIL_APP_PASSWORD, ten: e.MAIL_FROM_NAME || 'AiO Studio', bcc: e.MAIL_BCC, replyTo: e.REPLY_TO }, thu)
      DA_GUI.add(wid)
      console.log('order ' + order.id + ': da gui thu (' + ngonNgu(order) + ')')
      return tra(res, 200, { daGui: true })
    } catch (err) {
      console.error('order ' + order.id + ': loi ' + (err && err.message))
      return tra(res, 500, { loi: 'tam thoi' })
    }
  }
}

module.exports = taoXuLy()
module.exports.taoXuLy = taoXuLy
module.exports.kiemChuKy = kiemChuKy
module.exports.guiSmtp = guiSmtp
module.exports.dungThu = dungThu
module.exports.mimeThu = mimeThu
