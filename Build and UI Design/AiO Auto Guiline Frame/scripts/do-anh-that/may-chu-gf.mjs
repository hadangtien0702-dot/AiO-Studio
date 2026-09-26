// May chu tinh: /dist/* = dist cua Guide Frame, /<file> = scratchpad (harness ve-shorts.html)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const DIST = 'E:/2026/Production/AiO Studio/Build and UI Design/AiO Auto Guiline Frame/dist';
const SC = '<thu-muc-lam-viec>';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  // POST /luu?ten=<file>.png  body = dataURL -> ghi PNG vao scratchpad (trang harness gui anh canvas ve)
  if (req.method === 'POST' && u === '/luu') {
    const ten = new URL(req.url, 'http://x').searchParams.get('ten') || 'ra.png';
    let body = ''; req.on('data', d => { body += d; });
    req.on('end', () => {
      const b64 = body.replace(/^data:image\/png;base64,/, '');
      const f = path.join(SC, path.basename(ten));
      fs.writeFileSync(f, Buffer.from(b64, 'base64'));
      res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('OK ' + f + ' ' + fs.statSync(f).size);
    });
    return;
  }
  const f = u.startsWith('/dist/') ? path.join(DIST, u.slice(6)) : path.join(SC, u.slice(1));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404 ' + u); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(8125, '127.0.0.1', () => console.log('http://127.0.0.1:8125/ve-shorts.html'));
