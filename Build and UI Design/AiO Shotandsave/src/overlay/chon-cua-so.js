'use strict'

/* Chon dung CUA SO bang cach re chuot + bam (05/11/2026), va nho vung lan truoc.
   File nay la HAM THUAN (khong Electron, khong DOM) de bai do `do-chup-cua-so.cjs` kiem duoc.
   Dung o HAI noi: main.js (require) va overlay.js (the <script>, gan vao window.chonCuaSo).

   Quy uoc toa do: PIXEL VAT LY toan cuc (cung he voi raPhys() trong main.js), goc tren-trai man chinh,
   co the AM (man phu nam ben trai / phia tren). Cua so: { x, y, w, h }. Danh sach cua so xep tu TREN
   xuong DUOI theo thu tu z (cua so nam tren cung dung dau) — Windows EnumWindows va macOS
   CGWindowListCopyWindowInfo deu tra theo thu tu do.
   Man: { px, py, pw, ph, sf } = goc phys, kich thuoc phys, ti le (DPR). */

/** Ban kinh "bam" (DIP): chuot di khong qua nguong nay giua luc nhan va nha = BAM (chon cua so);
    vuot qua = KEO (khoanh vung nhu cu). */
const NGUONG_BAM = 4
const VUNG_TOI_THIEU = 8 // phys, cung nguong voi drag-end (vung < 8 la huy)

/** Cua so DAU TIEN (nam tren cung) chua diem p (phys). Khoang nua mo [x, x+w). */
function cuaSoTaiDiem(ds, p) {
  if (!Array.isArray(ds) || !p) return null
  for (const c of ds) {
    if (p.x >= c.x && p.x < c.x + c.w && p.y >= c.y && p.y < c.y + c.h) return c
  }
  return null
}

/** Ep rect vao hop bao cua cac man (cua so toi da / nua nam ngoai man khong ra vung ngoai man).
    Tra null neu rong hoac nho hon VUNG_TOI_THIEU. */
function kepVaoMan(rect, mans) {
  if (!rect || !mans || !mans.length) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const m of mans) {
    x0 = Math.min(x0, m.px); y0 = Math.min(y0, m.py)
    x1 = Math.max(x1, m.px + m.pw); y1 = Math.max(y1, m.py + m.ph)
  }
  const ax = Math.max(rect.x, x0), ay = Math.max(rect.y, y0)
  const bx = Math.min(rect.x + rect.w, x1), by = Math.min(rect.y + rect.h, y1)
  const w = Math.round(bx - ax), h = Math.round(by - ay)
  if (w < VUNG_TOI_THIEU || h < VUNG_TOI_THIEU) return null
  return { x: Math.round(ax), y: Math.round(ay), w, h }
}

/** DIP cuc bo cua mot man -> phys toan cuc. */
function cucBoSangPhys(p, man) {
  return { x: man.px + p.x * man.sf, y: man.py + p.y * man.sf }
}

/** rect phys toan cuc -> rect DIP cuc bo cua man, CAT theo man (W,H = kich thuoc DIP man). Null neu khong giao. */
function physSangCucBo(rect, man, W, H) {
  const x0 = (rect.x - man.px) / man.sf, y0 = (rect.y - man.py) / man.sf
  const x1 = (rect.x + rect.w - man.px) / man.sf, y1 = (rect.y + rect.h - man.py) / man.sf
  const ax = Math.max(0, x0), ay = Math.max(0, y0), bx = Math.min(W, x1), by = Math.min(H, y1)
  if (bx <= ax || by <= ay) return null
  return { x: ax, y: ay, w: bx - ax, h: by - ay }
}

/** BAM hay KEO: khoang cach (DIP) tu diem nhan toi diem hien tai. */
function laBam(a, b, nguong) {
  const n = typeof nguong === 'number' ? nguong : NGUONG_BAM
  return Math.hypot(b.x - a.x, b.y - a.y) <= n
}

/** Vung nho lan truoc con dung duoc khong: moi goc (tru 1 px) phai nam trong mot man dang co. */
function vungConHopLe(rect, mans) {
  if (!rect || !mans || !mans.length) return false
  if (![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite)) return false
  if (rect.w < VUNG_TOI_THIEU || rect.h < VUNG_TOI_THIEU) return false
  const trong = (px, py) => mans.some((m) => px >= m.px && px < m.px + m.pw && py >= m.py && py < m.py + m.ph)
  const e = 1
  return trong(rect.x, rect.y) && trong(rect.x + rect.w - e, rect.y) &&
    trong(rect.x, rect.y + rect.h - e) && trong(rect.x + rect.w - e, rect.y + rect.h - e)
}

/** Doc dau ra cua script lay cua so: moi dong "x y w h" (so nguyen, phys). Bo dong hong / nho hon 20 px. */
function docDanhSach(text) {
  const ds = []
  for (const dong of String(text || '').split(/\r?\n/)) {
    const m = /^\s*(-?\d+)\s+(-?\d+)\s+(\d+)\s+(\d+)\s*$/.exec(dong)
    if (!m) continue
    const c = { x: +m[1], y: +m[2], w: +m[3], h: +m[4] }
    if (c.w >= 20 && c.h >= 20) ds.push(c)
  }
  return ds
}

const api = { NGUONG_BAM, VUNG_TOI_THIEU, cuaSoTaiDiem, kepVaoMan, cucBoSangPhys, physSangCucBo, laBam, vungConHopLe, docDanhSach }
if (typeof module !== 'undefined' && module.exports) module.exports = api
else if (typeof window !== 'undefined') window.chonCuaSo = api
