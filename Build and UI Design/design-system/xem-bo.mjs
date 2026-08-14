// Máy chủ tĩnh nhỏ: bày CẢ BỘ AiO cho trình duyệt soi UI — anh Tiến 01/08:
// "render các tool thành 1 localhost public để anh kiểm tra".
// Phục vụ thư mục AiO Studio; trang tổng /  = xem-bo.html.
// Bind 0.0.0.0 để mở được từ điện thoại cùng mạng LAN.
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = normalize(join(fileURLToPath(import.meta.url), '..', '..')) // AiO Studio
const CONG = 8095
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

createServer((req, res) => {
  try {
    let duong = decodeURIComponent((req.url || '/').split('?')[0])
    if (duong === '/') duong = '/design-system/xem-bo.html'
    const file = normalize(join(GOC, duong))
    // Chan thoat khoi thu muc goc
    if (!file.startsWith(GOC)) { res.writeHead(403); res.end('403'); return }
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end('404: ' + duong); return }
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(readFileSync(file))
  } catch (e) {
    res.writeHead(500); res.end(String(e))
  }
}).listen(CONG, '0.0.0.0', () => {
  console.log('Xem bo AiO: http://localhost:' + CONG + '  (LAN: cung cong tren IP may)')
})
