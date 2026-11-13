'use strict'
/* 12/11 HUT MAU: phuc vu DIEM ANH NGUYEN GOC cho man chup (aioshot://that/<gen>/<displayId>/<x>_<y>_<w>_<h>.bin).
   Vi sao can: xem dau file src/overlay/hut-ghep.js. Tom tat: tren Windows anh "raw" cua luot chup la khung video I420 cua
   luong chay san, mau lech 1-2 don vi (do 12/11: chi 14,9 % diem dung). desktopCapturer.getSources thi dung tung diem.
   Lam gi: lan DAU trang chup xin (nguoi dung mo cong cu Hut mau), chup MOT anh co native cua dung man do, giu cho ca luot
   chup (doi vung chon khong chup lai), cat vung gui ve dang BGRA tho: 8 byte dau = rong, cao (uint32 LE), sau do la diem anh.
   - Raw cua luot nay von da la anh getSources (Mac, hoac Windows luc luong chua san sang): tra 8 byte so 0 = "raw da dung
     san", KHONG chup them.
   - Khong chup duoc / sai kich thuoc: 404, trang chup giu mau cua luong va danh dau gan dung. Lan xin sau duoc thu lai.
   Man chup co setContentProtection(true) nen khong lot vao anh nay. Cho nao man hinh da doi tu luc bam phim (video, con tro)
   thi trang chup tu loai theo o 8x8 (hut-ghep.js), nen anh nay CHI dung de lay mau, khong dung de luu.
   getSources khoa luong chinh ~0,1-0,4 giay: chi goi khi nguoi dung mo Hut mau, khong goi luc bam phim chup (so loi #8, #9).
   Bai do: scripts/test/do-hut-that.cjs. */
function tao(o) {
  const desktopCapturer = o.desktopCapturer, screen = o.screen
  const ghiLog = o.ghiLog || (() => {})
  const kho = new Map()   // key 'gen/displayId' -> Promise<NativeImage | null>
  const nguon = new Map() // key -> 'luong' | 'grab'
  let soLanChup = 0

  function danhDau(key, n) { nguon.set(key, n === 'luong' ? 'luong' : 'grab') }
  function xoa() { kho.clear(); nguon.clear() }

  async function chup(displayId, w, h) {
    const t0 = Date.now()
    soLanChup++
    const ds = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: w, height: h }, fetchWindowIcons: false })
    let src = ds.find((x) => String(x.display_id) === String(displayId))
    if (!src) { const i = screen.getAllDisplays().findIndex((d) => String(d.id) === String(displayId)); src = i >= 0 ? ds[i] : null }
    if (!src || !src.thumbnail || src.thumbnail.isEmpty()) { ghiLog('hut-that: khong co nguon cho man ' + displayId); return null }
    const sz = src.thumbnail.getSize()
    if (sz.width !== w || sz.height !== h) { ghiLog('hut-that: anh ' + sz.width + 'x' + sz.height + ' khac raw ' + w + 'x' + h + ' -> bo'); return null }
    ghiLog('hut-that: chup nguyen goc man ' + displayId + ' ' + w + 'x' + h + ' ' + (Date.now() - t0) + 'ms')
    return src.thumbnail
  }

  /* raw = NativeImage dang nam trong rawStore cua key do (hoac undefined). Tra { status, body? }. */
  async function phucVu(key, displayId, x, y, w, h, raw) {
    if (!raw || raw.isEmpty()) return { status: 404 }
    // Chi khi BIET CHAC raw la anh getSources moi tra "da dung san". Khong ro nguon thi di duong chup + ghep: ghep anh dung voi anh dung
    // van ra anh dung, con nham nguoc lai la bao "dung" cho mau lech.
    if (nguon.get(key) === 'grab') return { status: 200, body: Buffer.alloc(8) }
    const sz = raw.getSize()
    let p = kho.get(key)
    if (!p) {
      p = chup(displayId, sz.width, sz.height).catch((e) => { ghiLog('hut-that LOI chup: ' + ((e && e.message) || e)); return null })
      kho.set(key, p)
      p.then((img) => { if (!img && kho.get(key) === p) kho.delete(key) }) // hong thi lan xin sau thu lai
    }
    const img = await p
    if (!img) return { status: 404 }
    x = Math.max(0, Math.min(x | 0, sz.width - 1)); y = Math.max(0, Math.min(y | 0, sz.height - 1))
    w = Math.max(1, Math.min(w | 0, sz.width - x)); h = Math.max(1, Math.min(h | 0, sz.height - y))
    const bmp = img.crop({ x, y, width: w, height: h }).toBitmap() // BGRA
    if (bmp.length !== w * h * 4) { ghiLog('hut-that: bitmap ' + bmp.length + ' byte khac ' + (w * h * 4) + ' -> bo'); return { status: 404 } }
    const body = Buffer.allocUnsafe(8 + bmp.length)
    body.writeUInt32LE(w, 0); body.writeUInt32LE(h, 4); bmp.copy(body, 8)
    return { status: 200, body }
  }

  return { danhDau, xoa, phucVu, soLanChup: () => soLanChup }
}

module.exports = { tao }
