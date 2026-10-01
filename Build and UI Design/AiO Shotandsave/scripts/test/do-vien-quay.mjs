/* =========================================================================
   Kiem hinh hoc VIEN QUAY 3 GIAY (src/vien-quay.js) — khong bat cua so, khong can Electron.
   Chay: node scripts/test/do-vien-quay.mjs
   Goc (29/09): Windows ep cua so >= ~30 px -> ban 0.7.4 (thanh 3 px) phinh 31 px, lan vao vung, lot vao 3/6 khung.
   5 dieu kien tren 2.000 vung ngau nhien + ca bien:
   (1) KHONG cua so nao cham vung dang quay, ke ca khi Windows ep cua so to len toi 40 px (phinh ra phia ngoai)
   (2) KHONG net nao cham vung
   (3) moi hinh (shape) nam gon trong cua so cua no
   (4) moi diem cua moi net deu duoc it nhat 1 cua so ve (khong hut net)
   (5) vien cach vung dung G px, day L px
   Doi chung: hinh hoc 0.7.4 (thanh 3 px bi ep 31 px) PHAI truot dieu kien (1).
   ========================================================================= */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const { tinhVienQuay, giao, THONG_SO } = require(path.join(ROOT, 'src', 'vien-quay.js'))

/* Windows ep cua so to toi day — phinh tu goc tren-trai ra phai/xuong. Muc ep tinh theo diem anh THAT (~57-58 px):
   150% -> 38 DIP (do 29/09) · 125% -> 46 DIP (do 01/10, run-log 12:56:23: xin 823x40 duoc 824x46) · 100% -> 58 DIP
   (suy ra, chua do). Thu o muc cao nhat. + cua so that to hon xin 1 px phai/duoi (40 -> 41, 823 -> 824). */
const EP = 58
const epCo = (b, ep = EP) => ({ x: b.x, y: b.y, width: Math.max(b.width + 1, ep), height: Math.max(b.height + 1, ep) })

function kiemMot(rect) {
  const v = tinhVienQuay(rect)
  const loi = []
  for (const c of v.canh) {
    const that = epCo(c.bounds)
    // cua so tren/duoi phinh XUONG khi bi ep thi se cham vung -> chi ep chieu RONG voi tren; tren da cao DAI nen khong bi ep cao
    if (c.ten === 'tren' && c.bounds.height < EP) loi.push('cua so tren thap hon muc ep')
    if (giao(c.bounds, v.vung)) loi.push('cua so ' + c.ten + ' cham vung')
    if (giao(that, v.vung)) loi.push('cua so ' + c.ten + ' bi ep ' + EP + 'px thi cham vung')
    for (const s of c.shapes) {
      if (s.x < 0 || s.y < 0 || s.x + s.width > c.bounds.width || s.y + s.height > c.bounds.height) loi.push('hinh tran cua so ' + c.ten)
    }
  }
  for (const n of v.netToanCuc) {
    if (giao(n, v.vung)) loi.push('net cham vung')
    // (4) lay mau 5x5 diem trong net, moi diem phai nam trong 1 hinh cua 1 cua so
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const px = n.x + (n.width - 0.01) * i / 4, py = n.y + (n.height - 0.01) * j / 4
      const co = v.canh.some((c) => c.shapes.some((s) => px >= c.bounds.x + s.x && px < c.bounds.x + s.x + s.width && py >= c.bounds.y + s.y && py < c.bounds.y + s.y + s.height))
      if (!co) { loi.push('hut net tai ' + px.toFixed(1) + ',' + py.toFixed(1)); i = j = 99 }
    }
  }
  const tren = v.netToanCuc[0]
  if (v.vung.y - (tren.y + tren.height) !== THONG_SO.G || tren.height !== THONG_SO.L) loi.push('khe/do day sai')
  return loi
}

let tong = 0, truot = 0, viDu = []
const vungThu = [
  { x: 100, y: 100, w: 1278, h: 742 }, { x: 0, y: 0, w: 5, h: 5 }, { x: 10, y: 10, w: 1, h: 1 }, { x: 300, y: 200, w: 20, h: 900 },
  { x: -1626, y: 1162, w: 1597, h: 928 }, { x: 747.4, y: 360.6, w: 1278.2, h: 741.7 },
]
let s = 29092026
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
for (let i = 0; i < 2000; i++) vungThu.push({ x: rnd() * 3000 - 1500, y: rnd() * 2000, w: 1 + rnd() * 1500, h: 1 + rnd() * 900 })
for (const r of vungThu) {
  tong++
  const l = kiemMot(r)
  if (l.length) { truot++; if (viDu.length < 3) viDu.push(JSON.stringify(r) + ' -> ' + l.slice(0, 2).join('; ')) }
}
console.log('\n[1] Hinh hoc vien moi (' + tong + ' vung)')
console.log(truot === 0 ? '  DAT  5 dieu kien tren ' + tong + '/' + tong + ' vung' : '  TRUOT ' + truot + '/' + tong + ' vung\n   ' + viDu.join('\n   '))

// Doi chung: hinh hoc 0.7.4 (moVienQuay cu: khe 3, thanh 3 px) — Windows ep thanh 31 px -> PHAI cham vung
function hinhCu(r) {
  const G = 3, T = 3, n = G + T, gx = Math.round(r.x), gy = Math.round(r.y), rw = Math.round(r.w), rh = Math.round(r.h)
  return [{ x: gx - n, y: gy - n, width: rw + 2 * n, height: T }, { x: gx - n, y: gy + rh + G, width: rw + 2 * n, height: T },
    { x: gx - n, y: gy - G, width: T, height: rh + 2 * G }, { x: gx + rw + G, y: gy - G, width: T, height: rh + 2 * G }]
}
const r0 = { x: 747, y: 360, w: 1278, h: 742 }
const chamCu = hinhCu(r0).map((b) => ({ x: b.x, y: b.y, width: Math.max(b.width, 31), height: Math.max(b.height, 31) }))
  .filter((b) => giao(b, { x: r0.x, y: r0.y, width: r0.w, height: r0.h })).length
console.log('\n[2] Doi chung: hinh hoc 0.7.4 voi thanh bi ep 31 px (so do that 29/09)')
console.log(chamCu === 2 ? '  DAT  doi chung TRUOT dung: 2/4 thanh (tren, trai) lan vao vung — khop anh 08:09 (cam canh tren + trai)' : '  TRUOT doi chung khong bat duoc loi cu (' + chamCu + ' thanh cham)')

// Doi chung 2 (01/10): dung so do THAT tren man 125% — cua so "tren" cao 40 bi ep 46 PHAI cham vung; cao DAI moi thi khong
const vungThat = { x: -1352, y: 560, width: 809, height: 1013 } // vung anh quay 12:56 (toan cuc DIP): xin tren y=518 cao 40
const trenCu = { x: -1359, y: 518, width: 824, height: 46 } // dung so run-log "duoc"
const vMoi = tinhVienQuay({ x: vungThat.x, y: vungThat.y, w: vungThat.width, h: vungThat.height })
const trenMoi = epCo(vMoi.canh.find((c) => c.ten === 'tren').bounds, 46)
const dc2 = !!giao(trenCu, vungThat) && !giao(trenMoi, vMoi.vung) && vMoi.canh.every((c) => !giao(epCo(c.bounds, 46), vMoi.vung))
console.log('\n[3] Doi chung: man 125% ep cua so 46 px (so do that 01/10 12:56)')
console.log(dc2 ? '  DAT  cua so cu (cao 40 -> 46) cham vung ' + giao(trenCu, vungThat).height + ' px; cua so moi (cao ' + THONG_SO.DAI + ') khong cham' : '  TRUOT')

const dat = truot === 0 && chamCu === 2 && dc2
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
process.exit(dat ? 0 : 1)
