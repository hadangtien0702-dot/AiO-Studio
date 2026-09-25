// Chạy thử web Shot & Save TRÊN MÁY (anh Tiến 25/09: "tạm thời phát triển trên localhost").
// - Phục vụ tĩnh thư mục web (index.html, checkout-demo.html, img/…) ở http://localhost:3000
// - POST /api/gui-thu {email, lang} -> điền mẫu email/cam-on-mua.<lang>.html bằng số THỬ rồi gửi THẬT qua Gmail
//   (GMAIL_USER + GMAIL_APP_PASSWORD trong dev/.env). Chưa có .env thì LƯU thư vào dev/hop-thu/ để xem.
// Chỉ nghe 127.0.0.1, không lên Vercel (dev/ nằm trong .vercelignore). Mã trong thư là mã THỬ, không kích hoạt được.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DEV = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(DEV, '..');
const HOP_THU = path.join(DEV, 'hop-thu');
// Ảnh trong thư phải ở chỗ Gmail tải được -> dùng bản LIVE (img/email đã lên Vercel 25/09), không dùng localhost
const ASSET_BASE = 'https://aio-shotsave.vercel.app/img/email';
const TRANG = 'https://aio-shotsave.vercel.app/';

// .env tự đọc, không cần thư viện dotenv
function docEnv() {
  const f = path.join(DEV, '.env'), env = {};
  if (!fs.existsSync(f)) return env;
  for (const dong of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = dong.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}
const ENV = { ...docEnv(), ...process.env };
const PORT = Number(ENV.PORT) || 3000;
const COTHU = !!(ENV.GMAIL_USER && ENV.GMAIL_APP_PASSWORD);

const EMAIL_DUNG = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function maThu() {
  const k = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `AIOSS-TEST-${k()}-${k()}-DEMO`;
}
function ngay(d, lang) {
  return lang === 'vi'
    ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function taoThu(email, lang) {
  const l = lang === 'vi' ? 'vi' : 'en';
  const mau = fs.readFileSync(path.join(WEB, 'email', `cam-on-mua.${l}.html`), 'utf8');
  const bayGio = new Date(), namSau = new Date(bayGio); namSau.setFullYear(bayGio.getFullYear() + 1);
  const ma = maThu();
  const v = {
    asset_base: ASSET_BASE, customer_email: email, license_key: ma,
    order_id: '#TEST-' + crypto.randomBytes(2).toString('hex').toUpperCase(),
    order_date: ngay(bayGio, l), update_until: ngay(namSau, l), price: '$7.99',
    download_win: TRANG, download_mac: TRANG,
  };
  // bỏ khối ghi chú đầu file (có tên ô trống) rồi điền
  let html = '<!DOCTYPE html>' + mau.replace(/^<!DOCTYPE html>\s*<!--[\s\S]*?-->/, '');
  html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in v ? v[k] : m));
  const conTrong = html.match(/\{\{\w+\}\}/g);
  if (conTrong) throw new Error('Mau thu con o trong chua dien: ' + conTrong.join(', '));
  const tieuDe = l === 'vi' ? '[THỬ] Mã bản quyền Shot & Save của bạn' : '[TEST] Your Shot & Save license key';
  const chu = l === 'vi'
    ? `Cảm ơn bạn đã tin dùng Shot & Save!\n\nMã bản quyền (mã THỬ): ${ma}\nDùng trên 2 máy, cập nhật miễn phí đến ${v.update_until}.\n\n1. Cài app, mở từ biểu tượng ở khay hệ thống.\n2. Mở Cài đặt, thẻ Bản quyền ở trên cùng.\n3. Dán mã rồi bấm Kích hoạt.\n\nTải: ${TRANG}\nHoàn tiền trong 14 ngày. Cần hỗ trợ, bạn cứ trả lời thư này.`
    : `Thank you for buying Shot & Save!\n\nLicense key (TEST key): ${ma}\nWorks on 2 computers, free updates until ${v.update_until}.\n\n1. Install the app and open it from the tray icon.\n2. Open Settings. The License card is at the top.\n3. Paste the key and press Activate.\n\nDownload: ${TRANG}\n14-day refund. Need help? Just reply to this email.`;
  return { html, chu, tieuDe, ma };
}

let guiThat = null;
async function layBoGui() {
  if (guiThat) return guiThat;
  let nodemailer;
  try { nodemailer = (await import('nodemailer')).default; }
  catch (e) { throw new Error('Chua cai nodemailer — chay "npm install" trong thu muc dev truoc'); }
  // SMTP_HOST/SMTP_PORT chỉ để phép thử (thu-server.mjs dựng máy chủ thư giả); bình thường đi thẳng Gmail
  const t = ENV.SMTP_HOST
    ? nodemailer.createTransport({ host: ENV.SMTP_HOST, port: Number(ENV.SMTP_PORT) || 2525, secure: false, ignoreTLS: true,
        auth: { user: ENV.GMAIL_USER, pass: ENV.GMAIL_APP_PASSWORD } })
    : nodemailer.createTransport({ service: 'gmail', auth: { user: ENV.GMAIL_USER, pass: ENV.GMAIL_APP_PASSWORD } });
  guiThat = async ({ to, tieuDe, html, chu }) =>
    t.sendMail({ from: `"AiO Shot & Save" <${ENV.GMAIL_USER}>`, to, subject: tieuDe, html, text: chu });
  return guiThat;
}

const lanGuiCuoi = new Map(); // email -> giờ gửi, chặn bấm liên tục (1 thư / 20 s / địa chỉ)

async function xuLyGuiThu(req, res) {
  let body = '';
  for await (const c of req) { body += c; if (body.length > 4096) return traJson(res, 413, { ok: false, loi: 'qua-dai' }); }
  let d; try { d = JSON.parse(body); } catch { return traJson(res, 400, { ok: false, loi: 'json-hong' }); }
  const email = String(d.email || '').trim();
  if (!EMAIL_DUNG.test(email)) return traJson(res, 400, { ok: false, loi: 'email-sai' });
  const truoc = lanGuiCuoi.get(email.toLowerCase());
  if (truoc && Date.now() - truoc < 20000) return traJson(res, 429, { ok: false, loi: 'gui-qua-nhanh', choGiay: Math.ceil((20000 - (Date.now() - truoc)) / 1000) });
  const thu = taoThu(email, d.lang);
  if (!COTHU) {
    fs.mkdirSync(HOP_THU, { recursive: true });
    const f = path.join(HOP_THU, `${new Date().toISOString().replace(/[:.]/g, '-')}-${email.replace(/[^\w.@-]/g, '_')}.html`);
    fs.writeFileSync(f, thu.html);
    lanGuiCuoi.set(email.toLowerCase(), Date.now());
    console.log(`[luu-file] chua co GMAIL_USER/GMAIL_APP_PASSWORD -> ${path.relative(WEB, f)}`);
    return traJson(res, 200, { ok: true, cheDo: 'luu-file', file: path.relative(WEB, f) });
  }
  try {
    const gui = await layBoGui();
    const kq = await gui({ to: email, ...thu });
    lanGuiCuoi.set(email.toLowerCase(), Date.now());
    console.log(`[gui-that] ${email} · ${thu.ma} · ${kq.messageId}`);
    return traJson(res, 200, { ok: true, cheDo: 'gui-that' });
  } catch (e) {
    console.error('[loi-gui]', e.message);
    const loi = /Invalid login|Username and Password not accepted|EAUTH/i.test(e.message) ? 'sai-mat-khau-ung-dung' : 'gui-that-bai';
    return traJson(res, 502, { ok: false, loi, chiTiet: e.message.slice(0, 200) });
  }
}

function traJson(res, ma, obj) {
  res.writeHead(ma, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const KIEU = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

function phucVuTinh(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const f = path.resolve(WEB, '.' + p);
  // chỉ trong thư mục web, không bao giờ trả dev/ (có .env) hay file ẩn
  if (!f.startsWith(WEB + path.sep) || f.startsWith(DEV + path.sep) || /[\\/]\./.test(path.relative(WEB, f))) {
    res.writeHead(404); return res.end('404');
  }
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'content-type': KIEU[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  });
}

export function taoServer() {
  return http.createServer((req, res) => {
    if (req.url === '/api/trang-thai') return traJson(res, 200, { ok: true, cheDo: COTHU ? 'gui-that' : 'luu-file', nguoiGui: COTHU ? ENV.GMAIL_USER : null });
    if (req.url === '/api/gui-thu' && req.method === 'POST') return xuLyGuiThu(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    phucVuTinh(req, res);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  taoServer().listen(PORT, '127.0.0.1', () => {
    console.log(`Shot & Save web chay thu: http://localhost:${PORT}/checkout-demo.html`);
    console.log(COTHU ? `Gui thu THAT qua Gmail: ${ENV.GMAIL_USER}` : 'Chua co dev/.env -> thu duoc LUU vao dev/hop-thu/ (xem README.md de gui that)');
  });
}
