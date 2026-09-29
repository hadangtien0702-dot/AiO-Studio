// Phép thử dev/server.mjs (npm test): KHÔNG gửi thư ra ngoài — dựng máy chủ thư GIẢ ở 127.0.0.1 rồi đo.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';

const DEV = path.dirname(fileURLToPath(import.meta.url));
let dat = 0, truot = 0;
const kiem = (ten, ok, ct = '') => { ok ? dat++ : truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ok || !ct ? '' : '  -> ' + ct)); };
const ngu = ms => new Promise(r => setTimeout(r, ms));

async function chayServer(port, env) {
  const p = spawn(process.execPath, [path.join(DEV, 'server.mjs')], { env: { PATH: process.env.PATH, PORT: String(port), ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; p.stdout.on('data', d => log += d); p.stderr.on('data', d => log += d);
  for (let i = 0; i < 50 && !log.includes('chay thu'); i++) await ngu(100);
  return { p, log: () => log };
}
const post = (port, body) => fetch(`http://127.0.0.1:${port}/api/gui-thu`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  .then(async r => ({ status: r.status, d: await r.json() }));

// Máy chủ thư giả: nhận thư, từ chối mật khẩu 'sai'
const hop = [];
const smtp = new SMTPServer({
  authOptional: false, disabledCommands: ['STARTTLS'], allowInsecureAuth: true,
  onAuth(a, s, cb) { a.password === 'sai' ? cb(new Error('Invalid login: 535 Username and Password not accepted')) : cb(null, { user: a.username }); },
  onData(stream, s, cb) { simpleParser(stream).then(m => { hop.push(m); cb(); }).catch(cb); },
});
await new Promise(r => smtp.listen(2526, '127.0.0.1', r));

console.log('\n[1] Chua co .env -> luu file');
{
  const s = await chayServer(3911, {});
  const r = await post(3911, { email: 'khach@example.com', lang: 'vi' });
  kiem('tra ok + cheDo luu-file', r.status === 200 && r.d.cheDo === 'luu-file', JSON.stringify(r));
  const f = r.d.file && path.join(DEV, '..', r.d.file);
  const html = f && fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  kiem('file thu co ma AIOSS-TEST, khong con o trong {{', /AIOSS-TEST-[0-9A-F]{4}-[0-9A-F]{4}-DEMO/.test(html) && !html.includes('{{'), f);
  kiem('anh tro ban LIVE vercel', html.includes('https://aio-shotsave.vercel.app/img/email/hero.png'));
  if (f) fs.unlinkSync(f);
  const sai = await post(3911, { email: 'khong-phai-email', lang: 'vi' });
  kiem('email sai -> 400 email-sai', sai.status === 400 && sai.d.loi === 'email-sai', JSON.stringify(sai));
  const tinh = await fetch('http://127.0.0.1:3911/checkout-demo.html');
  kiem('trang checkout-demo 200', tinh.status === 200);
  const env = await fetch('http://127.0.0.1:3911/dev/.env.example');
  const pkg = await fetch('http://127.0.0.1:3911/dev/server.mjs');
  const leo = await fetch('http://127.0.0.1:3911/..%2f..%2fCLAUDE.md');
  kiem('KHONG phuc vu dev/ va khong leo ra ngoai thu muc web', env.status === 404 && pkg.status === 404 && leo.status === 404, `${env.status} ${pkg.status} ${leo.status}`);
  s.p.kill();
}

console.log('\n[2] Co tai khoan -> gui that (may chu thu gia)');
{
  const s = await chayServer(3912, { GMAIL_USER: 'shop@example.com', GMAIL_APP_PASSWORD: 'dung', SMTP_HOST: '127.0.0.1', SMTP_PORT: '2526' });
  const r = await post(3912, { email: 'hadangtien0702@gmail.com', lang: 'vi' });
  kiem('tra ok + cheDo gui-that', r.status === 200 && r.d.cheDo === 'gui-that', JSON.stringify(r) + s.log());
  await ngu(300);
  const m = hop.at(-1);
  kiem('thu toi dung nguoi nhan', m && m.to.text === 'hadangtien0702@gmail.com', m && m.to.text);
  kiem('tieu de + nguoi gui dung', m && m.subject.includes('Mã bản quyền Shot & Save') && m.from.text.includes('shop@example.com'), m && m.subject + ' | ' + m.from.text);
  kiem('HTML: "Cảm ơn bạn." + ma thu + khong con {{', m && m.html.includes('Cảm ơn bạn.') && /AIOSS-TEST-/.test(m.html) && !m.html.includes('{{'));
  kiem('co ban chu thuong (text) kem theo', m && /AIOSS-TEST-/.test(m.text || ''));
  const lai = await post(3912, { email: 'hadangtien0702@gmail.com', lang: 'vi' });
  kiem('bam gui lai ngay -> 429 gui-qua-nhanh', lai.status === 429 && lai.d.loi === 'gui-qua-nhanh', JSON.stringify(lai));
  const en = await post(3912, { email: 'buyer@example.com', lang: 'en' });
  await ngu(300);
  kiem('ban tieng Anh: "Thank you."', en.d.ok && hop.at(-1).html.includes('Thank you.') && hop.at(-1).subject.includes('[TEST]'));
  s.p.kill();
}

console.log('\n[3] Sai mat khau ung dung');
{
  const s = await chayServer(3913, { GMAIL_USER: 'shop@example.com', GMAIL_APP_PASSWORD: 'sai', SMTP_HOST: '127.0.0.1', SMTP_PORT: '2526' });
  const r = await post(3913, { email: 'khach@example.com', lang: 'vi' });
  kiem('502 + loi sai-mat-khau-ung-dung', r.status === 502 && r.d.loi === 'sai-mat-khau-ung-dung', JSON.stringify(r));
  s.p.kill();
}

smtp.close();
console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`);
process.exit(truot ? 1 : 0);
