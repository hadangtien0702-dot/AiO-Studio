'use strict'
/* THOAT AN TOAN KHI DANG QUAY VIDEO (06/11, Codex soat loi 2).
   Truoc day "Thoat" tren menu khay destroy MOI cua so ngay, ke ca cua so luong AN dang giu bo ghi: khuc cuoi cua doan quay
   (toi 1 giay du lieu, hoac TOAN BO neu bam trong giay dau vi khuc dau chua gui) chua kip ve main -> mat. Nay: bao dung,
   DOI bo ghi gui khuc cuoi + main chot file, roi moi huy cua so.

   Tach thanh ham thuan (khong phu thuoc Electron) de bai do (scripts/test/do-sua-video.cjs) thu duoc voi ban gia. */

/**
 * Dung luot quay dang chay va doi no ket thuc, toi da `toiDaMs`.
 * opts: { dangQuay: () => bool, dung: () => void, toiDaMs, nhip (ms, mac dinh 50), ghiLog }
 * Tra { dungKip: bool, ms, coQuay: bool } — dungKip = false nghia la het gio van chua xong (ben goi van phai thoat).
 */
async function doiQuayXong(opts) {
  const nhip = opts.nhip > 0 ? opts.nhip : 50
  const toiDa = opts.toiDaMs > 0 ? opts.toiDaMs : 8000
  const log = opts.ghiLog || (() => {})
  if (!opts.dangQuay()) return { dungKip: true, ms: 0, coQuay: false }
  const t0 = Date.now()
  log('thoat: dang quay video -> dung bo ghi, doi chot file (toi da ' + toiDa + ' ms)')
  try { opts.dung() } catch (e) { log('thoat: dung quay LOI ' + e.message) }
  while (opts.dangQuay() && Date.now() - t0 < toiDa) await new Promise((r) => setTimeout(r, nhip))
  const dungKip = !opts.dangQuay()
  log('thoat: ' + (dungKip ? 'da chot file sau ' : 'HET GIO, van chua chot sau ') + (Date.now() - t0) + ' ms')
  return { dungKip, ms: Date.now() - t0, coQuay: true }
}

module.exports = { doiQuayXong }
