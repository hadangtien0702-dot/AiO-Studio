'use strict'
/* Do "MAY QUAY" tu phong to theo con tro (src/sua-video/may-quay.js) — chay: npm run test:mayquay
   Ham thuan, node tran, khong cua so. Co DOI CHUNG: cung bai do chay tren ban "khong lam muot" (OMEGA rat lon) phai TRUOT. */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { console.log('LOI: ' + (e && e.stack)); process.exit(2) })
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '..', '..')
const FILE = path.join(ROOT, 'src', 'sua-video', 'may-quay.js')
const kq = []
let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')); if (!ok) dat = false }

function nap(src) { const m = { exports: {} }; new Function('module', 'exports', src)(m, m.exports); return m.exports }
const MQ = nap(fs.readFileSync(FILE, 'utf8'))

/* Tao duong di: danh sach doan { tu, den (ms), tu: [x,y] ... } -> mau 30 Hz. kieu 'dung' x,y | 'di' tu->den tuyen tinh. */
function duong(doan) {
  const mau = []
  let t = 0
  for (const d of doan) {
    const buoc = Math.round(d.ms / 33)
    for (let i = 0; i < buoc; i++) {
      const u = i / Math.max(1, buoc)
      const x = d.den ? d.tu[0] + (d.den[0] - d.tu[0]) * u : d.tu[0]
      const y = d.den ? d.tu[1] + (d.den[1] - d.tu[1]) * u : d.tu[1]
      mau.push([t, x, y]); t += 33
    }
  }
  return { mau, ms: t }
}
const traiTrenXuong = (ms, tu, den) => ({ ms, tu, den })

// ---- A. dung yen 6 s -> zoom vao, cat chua con tro
{
  const d = duong([{ ms: 6000, tu: [0.3, 0.4] }])
  const m = MQ.tinh(d.mau, { tre: 100, thoiLuongMs: d.ms, muc: 'vua', w: 1280, h: 720 })
  const a = m.at(2500)
  kiem('A. dung yen: sau ~2,5 s da zoom gan muc 1.8', a.z > 1.7 && a.z <= 1.801, 'z=' + a.z.toFixed(3))
  const nua = 0.5 / a.z
  kiem('A. khung cat chua con tro (0.3, 0.4)', Math.abs(a.cx - 0.3) < nua && Math.abs(a.cy - 0.4) < nua, 'cx=' + a.cx.toFixed(3) + ' cy=' + a.cy.toFixed(3))
  kiem('A. dau video (0 s) chua zoom', m.at(0).z < 1.02, 'z=' + m.at(0).z.toFixed(3))
}
// ---- B. chuot quet nhanh khap man -> khong zoom
{
  const d = duong([traiTrenXuong(1200, [0.05, 0.1], [0.95, 0.2]), traiTrenXuong(1200, [0.95, 0.2], [0.05, 0.6]), traiTrenXuong(1200, [0.05, 0.6], [0.9, 0.9]), traiTrenXuong(1200, [0.9, 0.9], [0.1, 0.1])])
  const m = MQ.tinh(d.mau, { tre: 0, thoiLuongMs: d.ms, muc: 'vua', w: 1280, h: 720 })
  let zMax = 1
  for (let t = 0; t <= d.ms; t += 16) zMax = Math.max(zMax, m.at(t).z)
  kiem('B. chuot di lien tuc khong dung -> khong zoom', zMax < 1.05 && m.doan.length === 0, 'zMax=' + zMax.toFixed(3) + ', doan=' + m.doan.length)
}
// ---- C. di - dung P1 - di gan P2 - dung - di xa P3 - dung
const C = duong([
  traiTrenXuong(900, [0.1, 0.1], [0.4, 0.4]), { ms: 1600, tu: [0.4, 0.4] },
  traiTrenXuong(500, [0.4, 0.4], [0.55, 0.45]), { ms: 1600, tu: [0.55, 0.45] },
  traiTrenXuong(700, [0.55, 0.45], [0.92, 0.9]), { ms: 1800, tu: [0.92, 0.9] },
  traiTrenXuong(700, [0.92, 0.9], [0.5, 0.5]),
])
const mC = MQ.tinh(C.mau, { tre: 120, thoiLuongMs: C.ms + 500, muc: 'vua', w: 1280, h: 720 })
{
  kiem('C. nhan ra it nhat 2 doan dung (P1+P2 lia lien nhau, P3 rieng)', mC.doan.length >= 2, 'doan=' + mC.doan.length + ' ' + mC.doan.map((d) => Math.round(d.tu) + '-' + Math.round(d.den)).join(' | '))
  // trong moi doan (da on dinh 0,9 s sau khi bat dau) con tro nam trong khung cat
  const tt = (ms) => 900 + ms
  let ok = true, ct = []
  for (const d of mC.doan) {
    for (let t = d.tu + 900; t < d.den - 200; t += 50) {
      const a = mC.at(t), c = mC.conTroTai(t), nua = 0.5 / a.z
      if (Math.abs(c[0] - a.cx) > nua || Math.abs(c[1] - a.cy) > nua) { ok = false; ct.push(Math.round(t)); break }
    }
  }
  kiem('C. trong cac doan dung con tro luon nam trong khung cat', ok, ct.join(','))
  // P1 (video 1020-2620) -> P2 (3120-4720) gan nhau (nam trong khung dang zoom): khong thu ve 1x o giua
  let zMin = 9
  for (let t = 2700; t <= 3300; t += 16) zMin = Math.min(zMin, mC.at(t).z)
  kiem('C. P1 -> P2 gan nhau: lia sang, khong thu ve 1x', zMin > 1.5, 'zMin=' + zMin.toFixed(3))
  // P2 -> P3 xa nhau: co thu ve
  let zMin2 = 9
  for (let t = 4720; t <= 5420; t += 16) zMin2 = Math.min(zMin2, mC.at(t).z)
  kiem('C. P2 -> P3 xa nhau: zoom ra giua chung', zMin2 < 1.6, 'zMin=' + zMin2.toFixed(3))
}
// ---- D. muot: dao ham bac 1 va bac 2 bi chan (khong nhay, khong giat); DOI CHUNG ban khong lam muot phai truot
function doMuot(m, ms) {
  let dz = 0, dcx = 0, dcy = 0, a2z = 0, a2cx = 0
  const B = 1000 / 30
  let p = null, pp = null
  for (let t = 0; t <= ms; t += B) {
    const a = m.at(t)
    if (p) {
      dz = Math.max(dz, Math.abs(a.z - p.z)); dcx = Math.max(dcx, Math.abs(a.cx - p.cx)); dcy = Math.max(dcy, Math.abs(a.cy - p.cy))
      if (pp) { a2z = Math.max(a2z, Math.abs(a.z - 2 * p.z + pp.z)); a2cx = Math.max(a2cx, Math.abs(a.cx - 2 * p.cx + pp.cx)) }
    }
    pp = p; p = a
  }
  return { dz, dcx, dcy, a2z, a2cx }
}
const dM = doMuot(mC, C.ms)
const muotDat = (x) => x.dz <= 0.06 && x.dcx <= 0.035 && x.dcy <= 0.035 && x.a2z <= 0.015 && x.a2cx <= 0.02
kiem('D. duong di muot (buoc/khung: dz<=0.06, dcx<=0.035; gia toc zoom <=0.015, tam <=0.02)', muotDat(dM), JSON.stringify(Object.fromEntries(Object.entries(dM).map(([k, v]) => [k, +v.toFixed(4)]))))
{
  const srcNhay = fs.readFileSync(FILE, 'utf8').replace('const OMEGA_ZOOM = 9, OMEGA_TAM = 7', 'const OMEGA_ZOOM = 40, OMEGA_TAM = 40')
  kiem('D. (doi chung) sua duoc ma nguon thanh ban khong lam muot', srcNhay.includes('OMEGA_ZOOM = 40,'))
  const mN = nap(srcNhay).tinh(C.mau, { tre: 120, thoiLuongMs: C.ms + 500, muc: 'vua', w: 1280, h: 720 })
  const dN = doMuot(mN, C.ms)
  kiem('D. (doi chung) ban khong lam muot PHAI TRUOT bai do muot', !muotDat(dN), JSON.stringify(Object.fromEntries(Object.entries(dN).map(([k, v]) => [k, +v.toFixed(3)]))))
}
// ---- E. thieu du lieu
kiem('E. khong co mau -> null', MQ.tinh([], {}) === null && MQ.tinh(null, {}) === null && MQ.tinh([[0, 0.5, 0.5]], {}) === null)
// ---- F. tre cua hinh: doan dung bat dau 2000 ms (luc con tro) + tre 300 -> doan trong video lui ve sau
{
  const d = duong([traiTrenXuong(2000, [0.1, 0.1], [0.6, 0.6]), { ms: 2500, tu: [0.6, 0.6] }])
  const m0 = MQ.tinh(d.mau, { tre: 0, thoiLuongMs: d.ms, muc: 'vua', w: 1280, h: 720 })
  const m3 = MQ.tinh(d.mau, { tre: 300, thoiLuongMs: d.ms + 300, muc: 'vua', w: 1280, h: 720 })
  const lech = m3.doan[0].tu - m0.doan[0].tu
  kiem('F. tre 300 ms dich doan dung ve sau dung 300 ms (+-35)', Math.abs(lech - 300) <= 35, 'lech=' + Math.round(lech))
}
// ---- G. dung qua lau -> thu ve
{
  const d = duong([{ ms: 11000, tu: [0.5, 0.5] }])
  const m = MQ.tinh(d.mau, { tre: 0, thoiLuongMs: d.ms, muc: 'vua', w: 1280, h: 720 })
  kiem('G. dung yen 11 s: giua doan da zoom, cuoi doan thu ve gan 1x', m.at(2500).z > 1.7 && m.at(9500).z < 1.15, 'z(2,5s)=' + m.at(2500).z.toFixed(2) + ' z(9,5s)=' + m.at(9500).z.toFixed(2))
}
// ---- H. con tro o goc: khung cat khong bao gio ra ngoai hinh
{
  const d = duong([{ ms: 5000, tu: [0.01, 0.02] }, { ms: 5000, tu: [0.99, 0.98] }])
  const m = MQ.tinh(d.mau, { tre: 0, thoiLuongMs: d.ms, muc: 'manh', w: 1280, h: 720 })
  let ra = 0
  for (let t = 0; t <= d.ms; t += 10) { const a = m.at(t), n = 0.5 / a.z; if (a.cx - n < -1e-9 || a.cx + n > 1 + 1e-9 || a.cy - n < -1e-9 || a.cy + n > 1 + 1e-9) ra++ }
  kiem('H. con tro o goc, muc manh: khung cat luon nam trong hinh', ra === 0 && m.at(3000).z > 2.2, 'so lan ra ngoai=' + ra + ' z=' + m.at(3000).z.toFixed(2))
}
// ---- I. 3 muc manh yeu khac nhau
{
  const d = duong([{ ms: 4000, tu: [0.5, 0.5] }])
  const z = ['nhe', 'vua', 'manh'].map((u) => MQ.tinh(d.mau, { tre: 0, thoiLuongMs: d.ms, muc: u, w: 1280, h: 720 }).at(3000).z)
  kiem('I. 3 muc nhe < vua < manh', z[0] < z[1] && z[1] < z[2] && z[0] > 1.3, z.map((v) => v.toFixed(2)).join(' < '))
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
