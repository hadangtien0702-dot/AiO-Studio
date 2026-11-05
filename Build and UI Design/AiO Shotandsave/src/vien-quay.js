'use strict'
/* VIEN QUAY 3 GIAY (29/09, kieu 1 anh chon: vien manh + 4 goc dam).

   ☠️ Windows KHONG cho cua so nho hon ~30 px (do 29/09 man 150%: xin 300x3 -> duoc 301x31; thu 7 cau hinh —
   thickFrame false, transparent, minWidth/minHeight 1, setMinimumSize(1,1), type toolbar — cai nao cung bi ep
   30-38 px). Ban 0.7.4 xin thanh 3 px -> thanh phinh 31 px, LAN VAO vung quay, 3/6 khung dinh cam 31 px.
   Cach dung: moi canh = 1 cua so DAI px (xem hang DAI ben duoi) nam HOAN TOAN NGOAI vung, roi setShape() chi giu lai net manh sat
   mep vung. Cua so co bi ep to hon thi chi phinh RA XA vung (neo o goc tren-trai, dai phia ngoai), khong lan vao.

   Ham nay chi tinh hinh hoc (khong dung Electron) -> kiem duoc bang node (scripts/test/do-vien-quay.mjs). */

const G = 3      // khe tu mep vung toi vien (DIP)
const L = 2      // do day vien
const CT = 4     // do day goc chu L
const ARM = 18   // do dai moi canh goc
/* ☠️ 01/10 (anh quay tren man phu 125%): xin cao 40 duoc 46 -> cua so "tren" lan 4 px vao vung -> bi huy, vien mat
   canh tren (run-log 12:56:23). Co toi thieu cua Windows tinh theo DIEM ANH THAT (~57-58 px), khong theo DIP:
   150% -> 38 DIP (do 29/09), 125% -> 46 DIP (do 01/10), suy ra 100% -> ~58 DIP (CHUA do tren man 100%).
   DAI phai >= muc cua man ti le THAP nhat. */
const DAI = 64   // be day cua so moi canh (>= co toi thieu Windows o moi ti le man: 58 DIP o 100%)
const KE = 2     // khe giua cua so va vung: man 150% Windows tra cua so TO THEM 1 px phai/duoi (do 29/09: 40 -> 41)

function giao(a, b) {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y)
  const r = Math.min(a.x + a.width, b.x + b.width), d = Math.min(a.y + a.height, b.y + b.height)
  return r > x && d > y ? { x, y, width: r - x, height: d - y } : null
}

/* rect = vung dang quay, toa do TOAN CUC DIP (da cong display.bounds). Tra ve:
   - canh: [{ ten, bounds, shapes }]  bounds = cua so (toan cuc), shapes = hinh can giu (toa do TRONG cua so)
   - netToanCuc: moi net (toan cuc) — de kiem
   - vungNgoai: khung bao ngoai cung cua vien (de dat thuoc dem nguoc sat ben tren/duoi) */
function tinhVienQuay(rect) {
  const gx = Math.round(rect.x), gy = Math.round(rect.y)
  const rw = Math.max(1, Math.round(rect.w)), rh = Math.max(1, Math.round(rect.h))
  const d = CT - L
  const x0 = gx - G - L, y0 = gy - G - L, x1 = gx + rw + G + L, y1 = gy + rh + G + L
  // vung sieu nho: canh goc khong dai qua nua khung (khong thi 2 goc chong nhau, tran khoi cua so)
  const armX = Math.min(ARM, Math.floor((x1 - x0 + 2 * d) / 2)), armY = Math.min(ARM, Math.floor((y1 - y0 + 2 * d) / 2))
  const net = [
    // vien manh 4 canh
    { x: x0, y: y0, width: x1 - x0, height: L },
    { x: x0, y: y1 - L, width: x1 - x0, height: L },
    { x: x0, y: y0, width: L, height: y1 - y0 },
    { x: x1 - L, y: y0, width: L, height: y1 - y0 },
    // 4 goc chu L: mep TRONG trung mep trong cua vien, dam them ra NGOAI
    { x: x0 - d, y: y0 - d, width: armX, height: CT }, { x: x0 - d, y: y0 - d, width: CT, height: armY },
    { x: x1 + d - armX, y: y0 - d, width: armX, height: CT }, { x: x1 + d - CT, y: y0 - d, width: CT, height: armY },
    { x: x0 - d, y: y1 + d - CT, width: armX, height: CT }, { x: x0 - d, y: y1 + d - armY, width: CT, height: armY },
    { x: x1 + d - armX, y: y1 + d - CT, width: armX, height: CT }, { x: x1 + d - CT, y: y1 + d - armY, width: CT, height: armY },
  ]
  const ngoai = { x: x0 - d, y: y0 - d, width: (x1 + d) - (x0 - d), height: (y1 + d) - (y0 - d) }
  // 4 cua so: tren/duoi phu ca goc; trai/phai chi dung canh vung. Tat ca nam NGOAI vung.
  const canh = [
    { ten: 'tren', bounds: { x: ngoai.x, y: gy - KE - DAI, width: ngoai.width, height: DAI } },
    { ten: 'duoi', bounds: { x: ngoai.x, y: gy + rh + KE, width: ngoai.width, height: DAI } },
    { ten: 'trai', bounds: { x: gx - KE - DAI, y: gy - KE, width: DAI, height: Math.max(DAI, rh + 2 * KE) } },
    { ten: 'phai', bounds: { x: gx + rw + KE, y: gy - KE, width: DAI, height: Math.max(DAI, rh + 2 * KE) } },
  ]
  for (const c of canh) {
    c.shapes = []
    for (const n of net) {
      const g = giao(n, c.bounds)
      // canh trai/phai cao >= DAI co the lo xuong duoi vung khi vung thap: bo phan nam duoi mep vung (da co canh duoi)
      if (g && (c.ten === 'trai' || c.ten === 'phai') && g.y >= gy + rh + KE) continue
      if (g) c.shapes.push({ x: g.x - c.bounds.x, y: g.y - c.bounds.y, width: g.width, height: g.height })
    }
  }
  return { canh, netToanCuc: net, vungNgoai: ngoai, vung: { x: gx, y: gy, width: rw, height: rh } }
}

module.exports = { tinhVienQuay, giao, THONG_SO: { G, L, CT, ARM, DAI, KE } }
