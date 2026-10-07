/* =========================================================================
   Do NUT TREN THANH KHAY ANH co bi vung nam goc che khong (06/10) — chay bang: npm run test:nutkhay
   Anh Tien 06/10: "cho nay bi trung hoi kho chiu" — nut "–" thu khay (them 01/10) nam duoi vung nam goc tren-phai
   (them 15/09), 57,8% dien tich nut bi che: re vao ra mui ten co gian, bam la keo co.
   Bai nay nap trang khay THAT trong Electron AN (khong bat cua so, khong danh thuc ban dang chay) o 4 kho x VI/EN x
   ngang/doc, quet tung diem anh cua moi nut bang elementFromPoint.
   DAT khi: moi nut bi .grip-goc che <= 2% va tong bi che <= 10% (4 goc bo tron); tieu de khay khong bi cat; nut "–"
   cach mep phai >= 14 px; moi goc con nam duoc >= 100 / 400 diem. DOI CHUNG: go luat noi nut len tren -> nut "–"
   PHAI bi goc che > 10% (thuoc biet do).
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RA = path.join(ROOT, '.selftest', 'nut-khay')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }

fs.mkdirSync(RA, { recursive: true })
try { fs.unlinkSync(path.join(RA, 'ket-qua.json')) } catch (e) {} // xoa ket qua cu: script chet thi khong doc nham

const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : process.platform === 'darwin' ? path.join('Electron.app', 'Contents', 'MacOS', 'Electron') : 'electron')
const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE // VS Code / Claude dat =1 -> electron chay nhu Node tran
const chay = spawnSync(electron, [path.join(ROOT, 'scripts', 'test', 'nut-khay-main.cjs')], { env, encoding: 'utf8', timeout: 60000 })
kiem('Electron thu chay xong, ma thoat 0', chay.status === 0, 'status ' + chay.status)

let r = null
try { r = JSON.parse(fs.readFileSync(path.join(RA, 'ket-qua.json'), 'utf8')) } catch (e) {}
kiem('Co file ket-qua.json', Array.isArray(r) && r.length > 0)

const boiGoc = (n) => Object.entries(n.boiAi || {}).filter(([k]) => /^grip/.test(k)).reduce((s, [, v]) => s + v, 0)
for (const m of r || []) {
  const nhan = '[' + m.cfg.w + 'x' + m.cfg.h + ' ' + m.cfg.lang + ' ' + m.cfg.kieu + '] '
  if (m.loi || !m.that) { kiem(nhan + 'nap duoc trang khay', false, m.loi || 'khong co so do'); continue }
  const nut = Object.entries(m.that.nut)
  kiem(nhan + 'co du 5 nut tren thanh khay', nut.length === 5, nut.map(([k]) => k).join(' '))
  for (const [id, n] of nut) {
    const pt = n.tong ? (n.bi * 100) / n.tong : 100
    // Goc che <= 2%: 4 diem o goc BO TRON cua nut roi xuong lop duoi (do 06/10: 4 / 441 diem), khong phai bi che that
    const ptGoc = n.tong ? (boiGoc(n) * 100) / n.tong : 100
    kiem(nhan + 'nut #' + id + ': goc che <= 2%, tong bi che <= 10%', ptGoc <= 2 && pt <= 10,
      'goc ' + ptGoc.toFixed(1) + '%, tong ' + pt.toFixed(1) + '% ' + JSON.stringify(n.boiAi))
  }
  const td = m.that.tieuDe
  kiem(nhan + 'tieu de khay khong bi cat (so dem 888)', !!td && td.can <= td.hop + 0.5, td ? '"' + td.chu + '" can ' + td.can + ' px, co ' + td.hop + ' px' : 'khong do duoc')
  kiem(nhan + 'nut "–" cach mep phai khay >= 14 px (anh: doi sang trai 5-10 px)', m.that.khePhai >= 14, m.that.khePhai + ' px')
  for (const [id, g] of Object.entries(m.that.goc)) {
    kiem(nhan + 'goc #' + id + ' con nam duoc >= 100 / 400 diem', g.namDuoc >= 100, g.namDuoc + '/' + g.tong)
  }
  const dc = m.doiChung && m.doiChung.nut && m.doiChung.nut.hide
  const ptDc = dc && dc.tong ? (boiGoc(dc) * 100) / dc.tong : 0
  // Sau khi doi hang nut 10 px (06/10) phan chong con lai la 18,1% (truoc khi doi: 57,8%)
  kiem(nhan + 'DOI CHUNG: go luat noi nut len tren thi nut "–" bi goc che > 10%', ptDc > 10, ptDc.toFixed(1) + '%')
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
