// Kiem bo nao ban quyen (src/banquyen.js) bang POLAR GIA — khong can Electron, khong can mang.
// Cau tra loi cua Polar gia chep dung kieu server polarsource/polar (license_key/service.py, doc 24/09):
//   activate  200 {id, license_key:{display_key, expires_at}} | 403 "activation limit" | 403 "expired" | 403 "no longer active" | 404
//   validate  200 {status:'granted', expires_at} | 404 "no longer active" | 404 "expired" | 404 "Not found"
//   deactivate 204 | 404
// Chay: node scripts/test/do-ban-quyen.mjs   (npm run test:banquyen)
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { taoBanQuyen, ORG_ID } = require('../../src/banquyen.js')

const NGAY = 86400000
let dat = 0, truot = 0
function kiem(ten, dung, chiTiet = '') {
  if (dung) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (chiTiet ? '  -> ' + chiTiet : '')) }
}

/* Polar gia: 1 ma, gioi han 2 may, co the dat het han / thu hoi / mat mang */
function polarGia({ han = Date.now() + 365 * NGAY } = {}) {
  const p = { key: 'AIOSS-1111-2222-3333-ABCD', han, trangThai: 'granted', may: new Map(), matMang: false, goi: [] }
  let dem = 0
  p.fetch = async (url, opt) => {
    const duong = url.split('/').pop(), b = JSON.parse(opt.body)
    p.goi.push(duong)
    if (p.matMang) throw new Error('getaddrinfo ENOTFOUND api.polar.sh')
    const tra = (status, json) => ({ status, text: async () => (json == null ? '' : JSON.stringify(json)) })
    const loi = (status, detail) => tra(status, { error: status === 403 ? 'NotPermitted' : 'ResourceNotFound', detail })
    if (b.organization_id !== ORG_ID) return loi(404, 'Not found')
    if (b.key !== p.key) return loi(404, 'Not found')
    const hetHan = p.han && Date.now() >= p.han
    if (duong === 'activate') {
      if (p.trangThai !== 'granted') return loi(403, 'License key is no longer active. This license key can not be activated.')
      if (hetHan) return loi(403, 'License key has expired.')
      if (p.may.size >= 2) return loi(403, 'License key activation limit already reached')
      const id = 'act-' + (++dem); p.may.set(id, b.label)
      return tra(200, { id, label: b.label, license_key: { display_key: '****-ABCD', status: 'granted', expires_at: new Date(p.han).toISOString() } })
    }
    if (duong === 'validate') {
      if (p.trangThai !== 'granted') return loi(404, 'License key is no longer active.')
      if (hetHan) return loi(404, 'License key has expired.')
      if (b.activation_id && !p.may.has(b.activation_id)) return loi(404, 'Not found')
      return tra(200, { status: 'granted', display_key: '****-ABCD', expires_at: new Date(p.han).toISOString() })
    }
    if (duong === 'deactivate') {
      if (!p.may.has(b.activation_id)) return loi(404, 'Not found')
      p.may.delete(b.activation_id); return tra(204, null)
    }
    return loi(404, 'Not found')
  }
  return p
}

function mayMoi(polar, { gio } = {}) {
  let kho = null
  const dongHo = { t: gio ?? Date.now() }
  const bq = taoBanQuyen({
    doc: () => kho, ghi: (s) => { kho = JSON.parse(JSON.stringify(s)) },
    fetch: polar.fetch, now: () => dongHo.t, tenMay: 'MAY-TEST',
  })
  return { bq, dongHo, kho: () => kho, datKho: (s) => { kho = s } }
}

console.log('\n[1] Dung thu 14 ngay')
{
  const p = polarGia(), m = mayMoi(p)
  let s = m.bq.trangThai()
  kiem('lan dau: dung thu, cho chup, con 14 ngay', s.loai === 'dung-thu' && s.choPhepChup && s.ngayConLai === 14, JSON.stringify(s))
  m.dongHo.t += 13 * NGAY + 3600000
  s = m.bq.trangThai()
  kiem('ngay 14: con 1 ngay, van chup', s.loai === 'dung-thu' && s.ngayConLai === 1 && s.choPhepChup, JSON.stringify(s))
  m.dongHo.t += NGAY
  s = m.bq.trangThai()
  kiem('qua 14 ngay: het han thu, KHOA chup', s.loai === 'het-han-thu' && !s.choPhepChup, JSON.stringify(s))
  m.dongHo.t -= 10 * NGAY
  s = m.bq.trangThai()
  kiem('van lui dong ho 10 ngay: VAN het han (chong gian lan)', s.loai === 'het-han-thu', JSON.stringify(s))
  kiem('dung thu khong goi mang', p.goi.length === 0)
}

console.log('\n[2] Kich hoat')
{
  const p = polarGia(), m = mayMoi(p)
  let r = await m.bq.kichHoat('  sai-ma  ')
  kiem('ma sai -> loi ma-sai, van dung thu', !r.ok && r.loi === 'ma-sai' && r.trangThai.loai === 'dung-thu', JSON.stringify(r))
  r = await m.bq.kichHoat('')
  kiem('o trong -> loi ma-trong, khong goi mang', !r.ok && r.loi === 'ma-trong' && p.goi.length === 1)
  r = await m.bq.kichHoat('  ' + p.key + '\n')
  kiem('ma dung (co dau cach thua) -> da kich hoat', r.ok && r.trangThai.loai === 'da-kich-hoat' && r.trangThai.choPhepChup, JSON.stringify(r))
  kiem('ma hien thi da che, khong lo ma day du', r.trangThai.maHienThi && !r.trangThai.maHienThi.includes('1111'), r.trangThai.maHienThi)
  kiem('kho khong luu... ma van co (can de huy/kiem)', m.kho().key === p.key && m.kho().activationId === 'act-1')
  kiem('Polar thay 1 may', p.may.size === 1)
  m.dongHo.t += 30 * NGAY
  kiem('30 ngay sau van chup duoc (khong con tinh dung thu)', m.bq.trangThai().choPhepChup)
  r = await m.bq.kichHoat(p.key)
  kiem('kich hoat lai cung ma: khong ton them cho', r.ok && p.may.size === 1)
}

console.log('\n[3] Gioi han 2 may + huy kich hoat de doi may')
{
  const p = polarGia(), a = mayMoi(p), b = mayMoi(p), c = mayMoi(p)
  await a.bq.kichHoat(p.key); await b.bq.kichHoat(p.key)
  let r = await c.bq.kichHoat(p.key)
  kiem('may thu 3 -> het-may', !r.ok && r.loi === 'het-may', JSON.stringify(r))
  r = await a.bq.huyKichHoat()
  kiem('may A huy -> tra cho, A ve dung thu', r.ok && p.may.size === 1 && r.trangThai.loai !== 'da-kich-hoat', JSON.stringify(r))
  r = await c.bq.kichHoat(p.key)
  kiem('may C vao duoc cho vua tra', r.ok && p.may.size === 2)
}

console.log('\n[4] Mat mang')
{
  const p = polarGia(), m = mayMoi(p)
  await m.bq.kichHoat(p.key)
  p.matMang = true
  m.dongHo.t += 5 * NGAY
  let r = await m.bq.kiemTra()
  kiem('kiem lai luc mat mang: van chay, khong khoa', r.trangThai.choPhepChup && r.trangThai.loai === 'da-kich-hoat', JSON.stringify(r))
  r = await m.bq.huyKichHoat()
  kiem('huy luc mat mang: bao loi, KHONG xoa ma (khong mat cho tren Polar)', !r.ok && r.loi === 'mat-mang' && m.kho().activationId, JSON.stringify(r))
  const m2 = mayMoi(p)
  r = await m2.bq.kichHoat(p.key)
  kiem('nhap ma luc mat mang: bao mat-mang', !r.ok && r.loi === 'mat-mang', JSON.stringify(r))
}

console.log('\n[5] Kiem lai dinh ky')
{
  const p = polarGia(), m = mayMoi(p)
  await m.bq.kichHoat(p.key)
  const truoc = p.goi.length
  await m.bq.kiemTra()
  kiem('vua kich hoat: khong hoi lai Polar (toi da 3 ngay/lan)', p.goi.length === truoc)
  m.dongHo.t += 4 * NGAY
  await m.bq.kiemTra()
  kiem('sau 4 ngay: hoi lai Polar', p.goi.length === truoc + 1 && p.goi.at(-1) === 'validate')
}

console.log('\n[6] Hoan tien / thu hoi')
{
  const p = polarGia(), m = mayMoi(p)
  await m.bq.kichHoat(p.key)
  p.trangThai = 'revoked'
  m.dongHo.t += 14 * NGAY + 1   // dung thu cung da het
  const r = await m.bq.kiemTra()
  kiem('ma bi thu hoi -> khoa chup, bao ly do', !r.trangThai.choPhepChup && r.trangThai.biThuHoi, JSON.stringify(r))
}

console.log('\n[7] Khach go may tu cong khach hang Polar')
{
  const p = polarGia(), m = mayMoi(p)
  await m.bq.kichHoat(p.key)
  p.may.clear()
  m.dongHo.t += 20 * NGAY
  const r = await m.bq.kiemTra()
  kiem('activation mat -> may nay mat ma, ve dung thu (da het), bao may-bi-go', r.trangThai.loai === 'het-han-thu' && r.trangThai.lyDoMatMa === 'may-bi-go', JSON.stringify(r))
}

console.log('\n[8] Qua 1 nam (anh chot A 24/09: van dung, chi het cap nhat)')
{
  const p = polarGia({ han: Date.now() + 365 * NGAY }), m = mayMoi(p)
  await m.bq.kichHoat(p.key)
  p.han = Date.now() - 1     // Polar coi la het han
  m.dongHo.t += 400 * NGAY
  let r = await m.bq.kiemTra()
  kiem('may dang chay qua 1 nam: van chup, hetQuyenCapNhat', r.trangThai.choPhepChup && r.trangThai.hetQuyenCapNhat, JSON.stringify(r))
  const m2 = mayMoi(p, { gio: m.dongHo.t })
  r = await m2.bq.kichHoat(p.key)
  kiem('cai lai may moi voi ma het han: VAN kich hoat duoc (khong giu cho)', r.ok && r.trangThai.choPhepChup && r.trangThai.khongGiuMay, JSON.stringify(r))
  const m3 = mayMoi(p); p.trangThai = 'revoked'
  r = await m3.bq.kichHoat(p.key)
  kiem('ma bi thu hoi thi KHONG nhan (khac voi het han)', !r.ok && r.loi === 'ma-bi-khoa', JSON.stringify(r))
}

console.log('\n[9] File hong')
{
  const p = polarGia()
  const bq = taoBanQuyen({ doc: () => { throw new Error('JSON hong') }, ghi: () => { throw new Error('dia day') }, fetch: p.fetch, tenMay: 'X' })
  const s = bq.trangThai()
  kiem('doc/ghi loi: khong vang, van dung thu', s.loai === 'dung-thu' && s.choPhepChup, JSON.stringify(s))
}

console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
process.exit(truot ? 1 : 0)
