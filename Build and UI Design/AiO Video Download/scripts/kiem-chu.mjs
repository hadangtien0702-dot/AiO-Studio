// kiem-chu.mjs — mọi câu đưa qua t( / tp( / dich( trong client/src phải có trong chu.ts.
// Thiếu thì bản EN hiện chữ Việt lạc giữa màn hình (bài Autocut 19/08). Thoát mã 1 nếu thiếu.
//   node scripts/kiem-chu.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'src')
const tatCa = []
const di = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) di(p)
    else if (/\.tsx?$/.test(f) && f !== 'chu.ts' && f !== 'ngonngu.tsx') tatCa.push(p)
  }
}
di(SRC)

const chu = readFileSync(join(SRC, 'chu.ts'), 'utf8')
const coKhoa = (k) => chu.includes(JSON.stringify(k).slice(0, -1) + '"') || chu.includes("'" + k.replace(/'/g, "\\'") + "'")

const dung = new Map()
const RE = /\b(?:t|tp|dich)\(\s*(['"])((?:\\.|(?!\1).)*)\1/g
for (const f of tatCa) {
  const s = readFileSync(f, 'utf8')
  let m
  while ((m = RE.exec(s))) {
    const k = m[2].replace(/\\(['"\\])/g, '$1')
    if (!dung.has(k)) dung.set(k, f.slice(SRC.length + 1))
  }
}
// Nhãn lấy từ mảng (t(c.nhan)) — liệt kê tay.
for (const k of ['Tốt nhất', 'MP3', 'Không', 'Edge', 'Chrome', 'Firefox']) dung.set(k, 'App.tsx (mảng)')

const thieu = [...dung].filter(([k]) => !coKhoa(k))
console.log(`Khoá đang dùng: ${dung.size} · thiếu trong chu.ts: ${thieu.length}`)
for (const [k, f] of thieu) console.log(`  THIẾU  ${f}: ${k}`)
process.exit(thieu.length ? 1 : 0)
