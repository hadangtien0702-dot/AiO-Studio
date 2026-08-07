import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = normalize(join(fileURLToPath(import.meta.url), '..')) // AiO Auto Re-Frames root
const GOC_STUDIO = normalize(join(GOC, '..')) // AiO Studio root
const CONG = 8099

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
    let file

    if (duong === '/' || duong === '/index.html') {
      file = join(GOC, 'dist', 'index.html')
    } else if (duong === '/design' || duong === '/design.html' || duong === '/AiO Auto Re-Frames.html') {
      file = join(GOC_STUDIO, 'AiO Design System', 'AiO Auto Re-Frames.html')
      if (!existsSync(file)) {
        file = join(GOC_STUDIO, 'AiO Design System', 'AiO Auto Re-Frames', 'AiO Auto Re-Frames.html')
      }
    } else if (duong.startsWith('/fonts/')) {
      file = join(GOC_STUDIO, 'AiO Design System', duong)
    } else {
      file = normalize(join(GOC, 'dist', duong))
      if (!existsSync(file)) {
        file = normalize(join(GOC_STUDIO, 'AiO Design System', duong))
      }
    }

    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404)
      res.end('404 Not Found: ' + duong)
      return
    }

    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(readFileSync(file))
  } catch (e) {
    res.writeHead(500)
    res.end(String(e))
  }
}).listen(CONG, '0.0.0.0', () => {
  console.log('Server xem rieng Re-Frames: http://localhost:' + CONG)
})
