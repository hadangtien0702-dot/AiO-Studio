// Chot chan PHIEN BAN (21/09/2026): 5 cho ghi so phien ban phai BANG NHAU.
// Vi sao: 21/09 bump 0.1.2 o manifest + package.json + host nhung sot
// PHIEN_BAN_HOST trong client/src/lib/cep.ts (van 0.1.0) -> panel bao
// "Phan chay trong Premiere dang la ban 0.1.2, khong khop giao dien" va CHAN
// nut Doc noi dung. tsc / vite / kiem-byte deu xanh vi khong ai so hai so nay.
// Doi chung: `node tests/kiem-phien-ban.mjs --doi-chung` gia lap cep.ts lech -> phai do.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const goc = join(dirname(fileURLToPath(import.meta.url)), '..')
const doc = (p) => readFileSync(join(goc, p), 'utf8')
const lay = (ten, p, re) => {
  const m = doc(p).match(re)
  return { ten, gia: m ? m[1] : 'KHONG TIM THAY' }
}

const cho = [
  lay('manifest ExtensionBundleVersion', 'CSXS/manifest.xml', /ExtensionBundleVersion="([^"]+)"/),
  lay('manifest Extension Version', 'CSXS/manifest.xml', /<Extension Id="[^"]+" Version="([^"]+)"/),
  lay('client/package.json', 'client/package.json', /"version":\s*"([^"]+)"/),
  lay('host sv_phienBan()', 'host/shortviral.jsx', /function sv_phienBan\(\)\s*\{\s*return '([^']+)'/),
  lay('cep.ts PHIEN_BAN_HOST', 'client/src/lib/cep.ts', /export const PHIEN_BAN_HOST = '([^']+)'/),
]
if (process.argv.includes('--doi-chung')) cho[4].gia = '0.0.0-doi-chung'

const cac = new Set(cho.map((c) => c.gia))
for (const c of cho) console.log(`  ${c.gia.padEnd(16)} ${c.ten}`)
if (cac.size !== 1 || cac.has('KHONG TIM THAY')) {
  console.error('HONG: so phien ban LECH nhau -> panel se tu chan khi chay. Sua cho bang nhau roi build lai.')
  process.exit(1)
}
console.log(`DAT: 5/5 cho cung phien ban ${[...cac][0]}`)
