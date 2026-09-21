/**
 * kiem-byte.mjs — CHOT CHAN: khong de BYTE DIEU KHIEN nao nam tran trong ma
 * nguon hoac trong ban da dong goi.
 *
 * Vi sao co file nay (do 21/09/2026, bay da can 5 lan — brain 5ax):
 *   `client/src/services/xuat.ts` dong 199 co MOT byte NUL (0x00) + mot byte
 *   0x1F nam tran (viet `\x00-\x1f` trong regex, vo lenh gop mat mot tang thoat).
 *   Regex van CHAY DUNG nen `tsc` sach, `vite build` sach, `npm run kiem` 189/0.
 *   Cai vo la o CHO KHAC:
 *     1. Vite goi ca bo ma vao MOT khoi <script> noi tuyen trong dist/index.html.
 *        Bo doc HTML o trang thai "script data" DOI U+0000 thanh U+FFFD, lop ky tu
 *        thanh [<fffd>-<1f>] = KHOANG NGUOC -> ca bo ma chet ngay dong dau.
 *        Do that bang Chrome tren dist da build: "Uncaught SyntaxError: Invalid
 *        regular expression ... Range out of order in character class", <div
 *        id="root"></div> RONG -> panel mo ra TRANG TRON, khong phai hong rieng
 *        phan xuat file. `vite dev` khong lo vi file duoc phuc vu dang .js.
 *     2. git xep file co NUL trong 8000 byte dau vao loai NHI PHAN -> `git diff`
 *        in "Binary files differ", `git blame` mat tung dong, va ripgrep (thuoc
 *        `Grep`) BO QUA file -> hai phep kiem bat buoc cua du an (`git grep` ten/
 *        ID/cong panel khuon, grep ma mau cung) cho AM TINH GIA.
 *
 * Chay rieng:  node tests/kiem-byte.mjs          (quet client/src + dist/index.html)
 * Trong build: client/package.json -> "build": "... && node ../tests/kiem-byte.mjs"
 * Trong kiem:  tests/kiem-hoidap.mjs muc (7i) — co ca PHEP DOI CHUNG (co tinh
 *              chen mot byte NUL thi thuoc phai BAO DO; khong do thi thuoc chua
 *              chung minh duoc no biet do la gi — luat 5aj).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const THU_MUC = path.dirname(fileURLToPath(import.meta.url))
export const GOC = path.dirname(THU_MUC)

/** Byte duoc phep duoi 0x20: TAB (9), LF (10), CR (13). */
function xauTrongByte(d) {
  const ra = []
  for (let i = 0; i < d.length; i++) {
    const b = d[i]
    if (b < 0x20 && b !== 9 && b !== 10 && b !== 13) ra.push({ viTri: i, byte: '0x' + b.toString(16) })
  }
  return ra
}

/** Quet MOT file. Tra mang rong = sach. */
export function quetFile(duong) {
  return xauTrongByte(fs.readFileSync(duong))
}

const DUOI = new Set(['.ts', '.tsx', '.css', '.html', '.json', '.jsx', '.js', '.mjs', '.md'])
const BO_QUA = new Set(['node_modules', 'dist', 'build', 'bin', 'certs', '.git', 'js'])

/** Quet de quy mot thu muc. Tra mang { duong, xau[] } cua nhung file CO byte tran. */
export function quetThuMuc(goc) {
  const hong = []
  const di = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (BO_QUA.has(e.name)) continue
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        di(p)
        continue
      }
      if (!DUOI.has(path.extname(e.name))) continue
      const xau = quetFile(p)
      if (xau.length) hong.push({ duong: p, xau })
    }
  }
  di(goc)
  return hong
}

/**
 * Quet ban da dong goi. ☠️ O day CHI byte NUL la chet: bo doc HTML doi U+0000
 * thanh U+FFFD trong "script data"; byte dieu khien khac di qua nguyen ven.
 *
 * DOI CHUNG (do 21/09, khong phai suy): ban dang CAI va CHAY THAT trong Premiere
 * hom nay (build 19/09, dist/index.html 545.031 byte) co **NUL 0 · 2 byte dieu
 * khien khac** — do la `const as="\x1f", ss="\x1e"` cua chinh React trong ban
 * rut gon. Neu bat ca hai loai o day thi chot chan bao do mot ban DANG CHAY TOT
 * (am tinh gia nguoc) — chinh la loi "thuoc lay danh sach do minh tu doan"
 * (brain 5as). Nen: ma nguon CUA MINH = bat het; ban dong goi = bat NUL.
 */
export function quetBanGoi(duong) {
  const d = fs.readFileSync(duong)
  const ra = []
  for (let i = 0; i < d.length; i++) if (d[i] === 0) ra.push({ viTri: i, byte: '0x0' })
  return ra
}

/** Chay rieng / trong `npm run build`. */
export function chayChotChan() {
  const muc = [path.join(GOC, 'client', 'src'), path.join(GOC, 'host'), path.join(GOC, 'tests')]
  let hong = []
  let soFile = 0
  for (const m of muc) {
    if (!fs.existsSync(m)) continue
    hong = hong.concat(quetThuMuc(m))
    soFile++
  }
  const dist = path.join(GOC, 'dist', 'index.html')
  if (fs.existsSync(dist)) {
    const xau = quetBanGoi(dist)
    if (xau.length) hong.push({ duong: dist, xau })
  }
  if (hong.length) {
    console.log('HONG: byte dieu khien nam tran (panel se mo ra TRANG khi da dong goi):')
    for (const h of hong) {
      console.log('  ' + path.relative(GOC, h.duong) + ' -> ' + JSON.stringify(h.xau.slice(0, 8)))
    }
    console.log('Sua: dung chuoi thoat 4 ky tu ASCII, hoac String.fromCharCode(...) nhu ui/chung.tsx.')
    return false
  }
  console.log(`kiem-byte: sach (${soFile} thu muc ma nguon` + (fs.existsSync(dist) ? ' + dist/index.html)' : ')'))
  return true
}

const chayTrucTiep = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (chayTrucTiep) process.exit(chayChotChan() ? 0 : 1)
