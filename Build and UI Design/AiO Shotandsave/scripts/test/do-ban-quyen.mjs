// Kiem bo nao ban quyen (src/banquyen.js) bang POLAR GIA — khong can Electron, khong can mang.
// Cau tra loi cua Polar gia chep dung kieu server polarsource/polar (license_key/service.py, doc 24/09):
//   activate  200 {id, license_key:{display_key, expires_at}} | 403 "activation limit" | 403 "expired" | 403 "no longer active" | 404
//   validate  200 {status:'granted', expires_at} | 404 "no longer active" | 404 "expired" | 404 "Not found"
//   deactivate 204 | 404
// Chay: node scripts/test/do-ban-quyen.mjs   (npm run test:banquyen)
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { taoBanQuyen, taoKhoFile, ORG_ID } = require('../../src/banquyen.js')
const fs = require('fs'), os = require('os'), path = require('path')

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
    if (p.ep && p.ep.duong === duong) return p.ep.tra   // [10] ep mot cau tra loi LA (proxy, tuong lua) cho 1 duong
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
      return tra(200, { id, label: b.label, license_key: { display_key: '****-ABCD', status: 'granted', expires_at: p.han ? new Date(p.han).toISOString() : null } })
    }
    if (duong === 'validate') {
      if (p.trangThai !== 'granted') return loi(404, 'License key is no longer active.')
      if (hetHan) return loi(404, 'License key has expired.')
      if (b.activation_id && !p.may.has(b.activation_id)) return loi(404, 'Not found')
      return tra(200, { status: 'granted', display_key: '****-ABCD', expires_at: p.han ? new Date(p.han).toISOString() : null })
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
  /* 04/10: dia gia tra BAN SAO (truoc tra chinh doi tuong `kho` nen bo nao sua thang vao "dia" ma khong can ghi —
     che mat loi ghi hong). hong.doc / hong.ghi = so lan doc / ghi KE TIEP se nem loi. */
  const hong = { doc: 0, ghi: 0 }
  const tao = () => taoBanQuyen({
    doc: () => { if (hong.doc > 0) { hong.doc--; throw new Error('EBUSY') } return kho ? JSON.parse(JSON.stringify(kho)) : kho },
    ghi: (s) => { if (hong.ghi > 0) { hong.ghi--; throw new Error('EPERM') } kho = JSON.parse(JSON.stringify(s)) },
    fetch: polar.fetch, now: () => dongHo.t, tenMay: 'MAY-TEST',
  })
  const m = { bq: tao(), dongHo, hong, kho: () => kho, datKho: (s) => { kho = s } }
  m.moLaiApp = () => { m.bq = tao() }   // tien trinh moi: mat het thu trong RAM, dia giu nguyen
  return m
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

/* ── 04/10 (ECC soat) ─────────────────────────────────────────────────────────────────────────────
   Do truoc khi sua: khach DA TRA TIEN mat ma khi (a) may chu tra 403 HTML / 407 / 401 / 400 / 200 khong phai JSON
   (5/5 ca), (b) file ban-quyen.json doc hong dung 1 lan. Cac muc duoi phai TRUOT tren ban cu. */
console.log('\n[10] May chu tra loi LA (proxy cong ty, tuong lua, API doi): khach da tra tien KHONG duoc mat ma')
{
  const html = (status) => ({ status, text: async () => '<html><body>Access denied</body></html>' })
  const json = (status, o) => ({ status, text: async () => JSON.stringify(o) })
  const ca = [
    ['403 trang chan HTML', html(403)],
    ['407 proxy doi dang nhap (than rong)', { status: 407, text: async () => '' }],
    ['401 JSON', json(401, { detail: 'Unauthorized' })],
    ['400 JSON', json(400, { detail: 'Bad request' })],
    ['422 JSON (detail la mang)', json(422, { detail: [{ msg: 'field required' }] })],
    ['200 nhung than la HTML', html(200)],
    ['404 HTML cua proxy', html(404)],
    ['404 JSON khong phai kieu Polar', json(404, { message: 'no route' })],
  ]
  for (const [ten, tra] of ca) {
    const p = polarGia(), m = mayMoi(p)
    await m.bq.kichHoat(p.key)
    const kiemTruoc = m.kho().kiemLanCuoi
    m.dongHo.t += 20 * NGAY                 // dung thu da het: mat ma = bi khoa chup
    p.ep = { duong: 'validate', tra }
    const r = await m.bq.kiemTra()
    kiem(ten + ': giu ma, van chup, bao tra-loi-la',
      m.kho().key === p.key && m.kho().activationId === 'act-1' && r.trangThai.loai === 'da-kich-hoat' && r.trangThai.choPhepChup && r.daHoi === false && r.loi === 'tra-loi-la',
      JSON.stringify({ loi: r.loi, daHoi: r.daHoi, loai: r.trangThai.loai, lyDo: r.trangThai.lyDoMatMa }))
    kiem(ten + ': khong ghi moc kiemLanCuoi (lan sau hoi lai)', m.kho().kiemLanCuoi === kiemTruoc)
    p.ep = null
    const r2 = await m.bq.kiemTra()
    kiem(ten + ': het tra loi la -> hoi lai Polar duoc, van da kich hoat', r2.daHoi === true && r2.trangThai.loai === 'da-kich-hoat', JSON.stringify({ daHoi: r2.daHoi, loai: r2.trangThai.loai }))
  }
}

console.log('\n[11] File ban quyen KHONG DOC DUOC / KHONG GHI DUOC: khong ghi de, khong mat ma')
{
  const p = polarGia(), m = mayMoi(p)
  await m.bq.kichHoat(p.key)
  m.dongHo.t += 20 * NGAY
  m.hong.doc = 1
  let s = m.bq.trangThai()
  kiem('dang chay, doc hong 1 lan: van da-kich-hoat (ban trong RAM)', s.loai === 'da-kich-hoat' && s.choPhepChup, JSON.stringify(s))
  kiem('dang chay, doc hong 1 lan: dia con ma + activation', m.kho().key === p.key && m.kho().activationId === 'act-1', JSON.stringify(m.kho()))
  m.moLaiApp(); m.hong.doc = 1
  s = m.bq.trangThai()
  kiem('vua mo app, doc hong: KHONG khoa chup (chua biet da tra tien chua)', s.choPhepChup === true, JSON.stringify(s))
  kiem('vua mo app, doc hong: dia KHONG bi ghi de (con ma + activation)', m.kho().key === p.key && m.kho().activationId === 'act-1', JSON.stringify(m.kho()))
  s = m.bq.trangThai()
  kiem('lan sau doc duoc: da-kich-hoat nhu cu, Polar van 1 may', s.loai === 'da-kich-hoat' && p.may.size === 1, JSON.stringify(s))
}
{
  // Het dung thu, chua mua: doc hong KHONG duoc thanh cach lam moi 14 ngay
  const p = polarGia(), m = mayMoi(p)
  m.bq.trangThai(); const batDau = m.kho().batDauThu
  m.dongHo.t += 30 * NGAY
  kiem('doi chung: het thu thi khoa', m.bq.trangThai().loai === 'het-han-thu')
  m.moLaiApp(); m.hong.doc = 1
  m.bq.trangThai()
  kiem('doc hong luc het thu: moc batDauThu tren dia KHONG doi', m.kho().batDauThu === batDau, m.kho().batDauThu + ' vs ' + batDau)
  kiem('lan sau doc duoc: van het-han-thu', m.bq.trangThai().loai === 'het-han-thu')
}
{
  // Kich hoat xong ma GHI file hong: khong duoc mat activation (da ton 1 cho tren Polar)
  const p = polarGia(), m = mayMoi(p)
  m.bq.trangThai()
  m.hong.ghi = 1                           // lan ghi cua kichHoat se hong
  const r = await m.bq.kichHoat(p.key)
  kiem('ghi hong luc kich hoat: van bao da kich hoat (giu trong RAM)', r.ok && r.trangThai.loai === 'da-kich-hoat', JSON.stringify(r))
  m.bq.trangThai()
  kiem('lan nap sau ghi lai duoc: dia co ma + activation, Polar 1 may', !!m.kho() && m.kho().key === p.key && m.kho().activationId === 'act-1' && p.may.size === 1, JSON.stringify(m.kho()))
}

console.log('\n[12] Doc / ghi FILE THAT (taoKhoFile) trong thu muc tam')
if (typeof taoKhoFile !== 'function') kiem('co ham taoKhoFile', false, 'ban cu khong co')
else {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-ban-quyen-'))
  const file = path.join(tam, 'ban-quyen.json'), nhatKy = []
  const k = taoKhoFile(file, { log: (x) => nhatKy.push(x) })
  kiem('chua co file: doc tra null (lan chay dau)', k.doc() === null)
  k.ghi({ batDauThu: 1, key: 'K' })
  kiem('ghi roi doc lai: dung noi dung, khong de lai file .tmp', k.doc().key === 'K' && !fs.existsSync(file + '.tmp'))
  fs.writeFileSync(file, String.fromCharCode(0xFEFF) + JSON.stringify({ batDauThu: 2, key: 'BOM' }))
  kiem('file co BOM (luu bang Notepad): van doc duoc', !!k.doc() && k.doc().key === 'BOM')
  for (const [ten, noiDung] of [['JSON cut', '{"key":"K","activationId":'], ['file rong', ''], ['mang', '[1,2]'], ['chuoi', '"x"']]) {
    fs.writeFileSync(file, noiDung)
    const truoc = nhatKy.length
    let r, nem = null
    try { r = k.doc() } catch (e) { nem = e.message }
    const cat = fs.readdirSync(tam).filter((f) => f.startsWith('ban-quyen.hong-') && f.endsWith('.json'))
    const conNguyen = cat.some((f) => fs.readFileSync(path.join(tam, f), 'utf8') === noiDung)
    kiem('file hong (' + ten + '): tra null, CAT ban hong sang ben (con nguyen noi dung), co ghi nhat ky',
      nem === null && r === null && !fs.existsSync(file) && conNguyen && nhatKy.length > truoc, JSON.stringify({ r, nem, cat, nhatKy: nhatKy.slice(truoc) }))
    for (const f of cat) fs.unlinkSync(path.join(tam, f))
  }
  k.ghi({ batDauThu: 3, key: 'K3', activationId: 'A3' })
  fs.chmodSync(file, 0o000)
  let docDuoc = true
  try { fs.readFileSync(file) } catch (e) { docDuoc = false }
  if (docDuoc) console.log('  BO QUA  ca "co file ma khong doc duoc" (he dieu hanh nay chmod khong chan duoc doc)')
  else {
    let nem = false
    try { k.doc() } catch (e) { nem = true }
    kiem('co file ma khong doc duoc: doc() NEM LOI (khong tra null = khong bi coi la lan chay dau)', nem)
    kiem('co file ma khong doc duoc: co ghi nhat ky', nhatKy.some((x) => x.includes('KHONG DOC DUOC')), JSON.stringify(nhatKy))
    const bq = taoBanQuyen({ doc: k.doc, ghi: k.ghi, fetch: async () => { throw new Error('x') }, tenMay: 'X' })
    const s = bq.trangThai()
    fs.chmodSync(file, 0o600)
    const sau = JSON.parse(fs.readFileSync(file, 'utf8'))
    kiem('bo nao + file that khong doc duoc: cho chup, file con nguyen ma + activation', s.choPhepChup && sau.key === 'K3' && sau.activationId === 'A3', JSON.stringify({ loai: s.loai, sau }))
  }
  try { fs.chmodSync(file, 0o600) } catch (e) {}
  fs.rmSync(tam, { recursive: true, force: true })   // thu muc do bai nay tao (mkdtemp)
}

// [07/10] Tu hom nay Polar phat ma KHONG co ngay het han (gia $14.99, cap nhat tron doi): Polar tra expires_at = null.
console.log('\n[13] Ma tron doi (Polar tra expires_at = null)')
{
  const p = polarGia({ han: null }), m = mayMoi(p)
  let r = await m.bq.kichHoat(p.key)
  kiem('kich hoat ma khong co han -> da kich hoat, cho chup', r.ok && r.trangThai.loai === 'da-kich-hoat' && r.trangThai.choPhepChup, JSON.stringify(r))
  kiem('khong co ngay het han, KHONG bao het quyen cap nhat', r.trangThai.hetHan === null && r.trangThai.hetQuyenCapNhat === false && !r.trangThai.khongGiuMay, JSON.stringify(r.trangThai))
  m.dongHo.t += 3 * 365 * NGAY
  await m.bq.kiemTra()
  const s = m.bq.trangThai()
  kiem('3 nam sau, kiem lai voi Polar: van kich hoat, van khong het quyen cap nhat', s.loai === 'da-kich-hoat' && s.choPhepChup && s.hetHan === null && s.hetQuyenCapNhat === false, JSON.stringify(s))
  kiem('van giu cho 1 may tren Polar (huy duoc de doi may)', p.may.size === 1 && !!m.kho().activationId)
  r = await m.bq.huyKichHoat()
  kiem('huy kich hoat: Polar con 0 may', p.may.size === 0, JSON.stringify(r))
}

console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
process.exit(truot ? 1 : 0)
