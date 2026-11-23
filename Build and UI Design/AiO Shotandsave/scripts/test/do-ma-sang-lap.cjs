// Bai do MA NHA SANG LAP (23/11/2026). Ma KHONG nam trong repo cong khai: chay AIO_MA_SANG_LAP=<ma> node scripts/test/do-ma-sang-lap.cjs
const MA = (process.env.AIO_MA_SANG_LAP || '').trim()
if (!MA) { console.log('BO QUA: dat AIO_MA_SANG_LAP=<ma nha sang lap> de chay'); process.exit(0) }
const { taoBanQuyen } = require(require('path').join(__dirname, '../../src/banquyen.js'))
let ok = 0, sai = 0; const k = (t, d) => { d ? ok++ : (sai++, console.log('TRUOT', t)) }
let goiMang = []
const fetchGia = async (url, o) => { goiMang.push(url.split('/').pop()); const b = JSON.parse(o.body)
  if (url.endsWith('activate')) return { status: 200, text: async () => JSON.stringify({ id: 'act-1', license_key: { display_key: 'AIOSS-****-ABCD', expires_at: null } }) }
  if (url.endsWith('deactivate')) return { status: 204, text: async () => '' }
  return { status: 200, text: async () => '{}' } }
function moi(t0 = Date.now() + 30 * 864e5) { let disk = null; return { bq: taoBanQuyen({ doc: () => disk, ghi: (s) => { disk = JSON.parse(JSON.stringify(s)) }, fetch: fetchGia, now: () => t0 }), disk: () => disk } }
;(async () => {
  for (const ma of [MA.toUpperCase(), MA.toLowerCase(), '  ' + MA.toLowerCase() + '  ']) {
    goiMang = []; const { bq, disk } = moi()
    const r = await bq.kichHoat(ma)
    k(ma + ' ok', r.ok && r.trangThai.loai === 'da-kich-hoat' && r.trangThai.choPhepChup && r.trangThai.sangLap)
    k(ma + ' khong goi mang', goiMang.length === 0)
    k(ma + ' file khong chua chu that', !JSON.stringify(disk()).toLowerCase().includes(MA.toLowerCase()))
    k(ma + ' khongGiuMay false', r.trangThai.khongGiuMay === false && !r.trangThai.hetQuyenCapNhat)
    k(ma + ' maDangDung null', bq.maDangDung() === null)
    const kt = await bq.kiemTra(true); k(ma + ' kiemTra khong hoi', !kt.daHoi && goiMang.length === 0)
  }
  // doi chung: ma gan giong -> di Polar
  for (const ma of [MA.slice(0, -1), MA + '1', MA.slice(0, 4) + ' ' + MA.slice(4)]) { goiMang = []; const { bq } = moi(); await bq.kichHoat(ma); k(ma + ' di Polar', goiMang[0] === 'activate') }
  // dang co ma Polar -> nhap ma sang lap: tra cho Polar truoc
  { goiMang = []; const { bq, disk } = moi(); await bq.kichHoat('AIOSS-1111-2222-3333-ABCD'); const r = await bq.kichHoat(MA)
    k('tra cho Polar', goiMang.join(',') === 'activate,deactivate' && r.ok && disk().sangLap && !disk().activationId)
    // roi quay ve ma Polar: sangLap phai tat
    const r2 = await bq.kichHoat('AIOSS-1111-2222-3333-ABCD'); k('ma Polar sau sang lap: sangLap false', r2.ok && !r2.trangThai.sangLap && bq.maDangDung() && bq.maDangDung().activationId === 'act-1') }
  // huy: xoa o may, khong goi mang
  { goiMang = []; const { bq, disk } = moi(); await bq.kichHoat(MA); const h = await bq.huyKichHoat(); k('huy', h.ok && goiMang.length === 0 && !disk().key && !disk().sangLap && h.trangThai.loai !== 'da-kich-hoat') }
  // het dung thu van chup duoc
  { const t0 = Date.now(); let disk = { batDauThu: t0 - 30 * 864e5, daDungMs: 20 * 864e5, gioCuoi: t0 }; const bq = taoBanQuyen({ doc: () => disk, ghi: (s) => { disk = JSON.parse(JSON.stringify(s)) }, fetch: fetchGia, now: () => t0 }); k('het thu truoc', bq.trangThai().loai === 'het-han-thu'); await bq.kichHoat(MA); k('het thu + sang lap = chup', bq.trangThai().choPhepChup) }
  console.log('dat', ok, 'truot', sai); process.exit(sai ? 1 : 0)
})()
