'use strict'
// Bai do HANH VI cho src/cap-nhat.js (05/11/2026). Chay AN: khong Electron, khong cua so, khong mang ngoai.
// May chu GIA nghe 127.0.0.1 (cong tu chon) tra cac kieu JSON/loi; thoi gian gia cho moc 24 gio.
// Chay: node scripts/test/do-cap-nhat.cjs   (npm run test:capnhat)
const http = require('http')
const path = require('path')
const { taoCapNhat, soSanh, CHU_KY_MS, SAU_KHI_MO_MS, THU_LAI_KHI_BAN_MS, LINK_BAN_MOI } = require('../../src/cap-nhat.js')
const i18n = require('../../src/i18n.js')

let dat = 0, truot = 0
function kiem(ten, dung, chiTiet) {
  if (dung) { dat++; console.log('  DAT   ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (chiTiet !== undefined ? '  -> ' + chiTiet : '')) }
}
let khongBatDuoc = 0
process.on('unhandledRejection', () => { khongBatDuoc++ })

const banJson = (v, extra = {}) => JSON.stringify(Object.assign({
  phienBan: v, linkWin: 'http://127.0.0.1/win-' + v + '.exe', linkMac: 'http://127.0.0.1/mac-' + v + '.dmg',
  ghiChu: { vi: 'Sua loi ' + v, en: 'Fixes ' + v },
}, extra))
const DUONG = {
  '/moi.json': () => [200, banJson('0.11.0')],
  '/moi-12.json': () => [200, banJson('0.12.0')],
  '/cung.json': () => [200, banJson('0.10.1')],
  '/cu.json': () => [200, banJson('0.5.0')],
  '/so-10.json': () => [200, banJson('0.10.10')],      // 0.10.10 > 0.10.1 (so SO, khong so chu)
  '/so-9.json': () => [200, banJson('0.9.9')],         // 0.9.9 < 0.10.1 (so chu se bao nguoc)
  '/hong.json': () => [200, '{"phienBan": "0.11.0", '],
  '/rac.json': () => [200, '<html>404 tu CDN</html>'],
  '/mang.json': () => [200, '[1,2,3]'],
  '/sai-ban.json': () => [200, banJson('abc')],
  '/khong-co': () => [404, 'Not found'],
  '/loi-may-chu': () => [500, 'boom'],
  '/cham.json': () => 'treo',
  '/to.json': () => [200, banJson('0.11.0', { ghiChu: { vi: 'x'.repeat(200000), en: '' } })],
  '/http-link.json': () => [200, banJson('0.11.0')],
}
let soGoi = {}
const maychu = http.createServer((req, res) => {
  soGoi[req.url] = (soGoi[req.url] || 0) + 1
  const r = (DUONG[req.url] || (() => [404, 'x']))()
  if (r === 'treo') return // khong tra loi: bai kiem het gio
  res.writeHead(r[0], { 'content-type': 'application/json' }); res.end(r[1])
})

/** May moi: kho trang thai trong bo nho (giu qua "khoi dong lai" bang cach truyen lai kho), dong ho gia. */
function may(o = {}) {
  const x = { kho: o.kho || { v: null }, gio: { t: o.gio != null ? o.gio : 1_700_000_000_000 }, bao: [], log: [], doi: 0, ban: false }
  const cn = taoCapNhat({
    fetch: (u, opt) => fetch(u, opt),
    now: () => x.gio.t,
    doc: o.khongLuu ? () => null : () => x.kho.v,
    ghi: o.khongLuu ? () => {} : (s) => { x.kho.v = JSON.parse(JSON.stringify(s)) },
    phienBan: o.phienBan || '0.10.1', nenTang: o.nenTang || 'win32',
    link: o.url ? 'http://127.0.0.1:' + x.cong + o.url : undefined,
    ghiLog: (m) => x.log.push(m),
    dangBan: () => x.ban,
    baoMot: (tt) => x.bao.push(tt.phienBan),
    khiDoi: () => { x.doi++ },
    hetGioMs: o.hetGioMs || 400, chapNhanHttp: o.chapNhanHttp !== false,
    hen: o.hen,
  })
  x.cn = cn
  return x
}
function mayVoi(cong, url, o = {}) {
  const x = may(Object.assign({}, o, { url: undefined }))
  // tao lai voi link that (cong chi biet sau khi listen)
  const cn = taoCapNhat({
    fetch: (u, opt) => fetch(u, opt), now: () => x.gio.t,
    doc: o.khongLuu ? () => null : () => x.kho.v, ghi: o.khongLuu ? () => {} : (s) => { x.kho.v = JSON.parse(JSON.stringify(s)) },
    phienBan: o.phienBan || '0.10.1', nenTang: o.nenTang || 'win32', link: 'http://127.0.0.1:' + cong + url,
    ghiLog: (m) => x.log.push(m), dangBan: () => x.ban, baoMot: (tt) => x.bao.push(tt.phienBan), khiDoi: () => { x.doi++ },
    hetGioMs: o.hetGioMs || 400, chapNhanHttp: o.chapNhanHttp !== false, hen: o.hen, huyHen: o.huyHen,
  })
  x.cn = cn
  return x
}

async function chay(cong) {
  const M = (url, o) => mayVoi(cong, url, o)

  console.log('\n[1] So phien ban: so SO tung thanh phan')
  kiem('0.10.10 > 0.10.1', soSanh('0.10.10', '0.10.1') === 1)
  kiem('0.9.9 < 0.10.1', soSanh('0.9.9', '0.10.1') === -1)
  kiem('0.10.1 = 0.10.1 = v0.10.1 = 0.10.1.0', soSanh('0.10.1', '0.10.1') === 0 && soSanh('v0.10.1', '0.10.1') === 0 && soSanh('0.10.1.0', '0.10.1') === 0)
  kiem('1.0.0 > 0.99.99', soSanh('1.0.0', '0.99.99') === 1)
  kiem('sai dinh dang -> null', soSanh('abc', '0.1.0') === null && soSanh('0.1.0-beta', '0.1.0') === null && soSanh(undefined, '1') === null)
  const soChu = (a, b) => (a > b ? 1 : a < b ? -1 : 0)
  kiem('DOI CHUNG: so CHU bao 0.9.9 > 0.10.1 (sai) — cho thay ca so 0.9.9 bat duoc loi so chu', soChu('0.9.9', '0.10.1') === 1 && soSanh('0.9.9', '0.10.1') === -1)
  kiem('hang so LINK_BAN_MOI tro web du kien', LINK_BAN_MOI === 'https://aio-shotsave.vercel.app/ban-moi.json')

  console.log('\n[2] Co ban moi')
  {
    const x = M('/moi.json')
    const r = await x.cn.kiemTra()
    kiem('ketQua moi', r.ketQua === 'moi', r.ketQua)
    const tt = x.cn.trangThai()
    kiem('trangThai: coBanMoi + 0.11.0 + link Windows', tt.coBanMoi && tt.phienBan === '0.11.0' && /win-0\.11\.0\.exe$/.test(tt.link), JSON.stringify(tt))
    kiem('ghi chu VI + EN', tt.ghiChu.vi === 'Sua loi 0.11.0' && tt.ghiChu.en === 'Fixes 0.11.0')
    kiem('chua tu cai (Windows: de sau)', tt.tuCai === false)
    kiem('thong bao he dieu hanh goi 1 lan', x.bao.length === 1 && x.bao[0] === '0.11.0', JSON.stringify(x.bao))
    kiem('khiDoi goi (ve lai menu khay)', x.doi >= 1)
    const m = M('/moi.json', { nenTang: 'darwin' }); await m.cn.kiemTra()
    kiem('Mac lay linkMac (dmg)', /mac-0\.11\.0\.dmg$/.test(m.cn.trangThai().link), m.cn.trangThai().link)
  }

  console.log('\n[3] Bao DUNG MOT LAN moi phien ban')
  {
    const x = M('/moi.json')
    await x.cn.kiemTra(); await x.cn.kiemTra({ ep: true }); await x.cn.kiemTra({ ep: true })
    kiem('3 lan kiem (2 lan ep) van bao 1 lan', x.bao.length === 1, JSON.stringify(x.bao))
    const x2 = M('/moi.json', { kho: x.kho }); await x2.cn.kiemTra({ ep: true })
    kiem('khoi dong lai app (cung kho) van khong bao lai', x2.bao.length === 0, JSON.stringify(x2.bao))
    kiem('...nhung muc menu / dong Cai dat van con', x2.cn.trangThai().coBanMoi)
    const x3 = M('/moi-12.json', { kho: x.kho }); await x3.cn.kiemTra({ ep: true })
    kiem('phien ban moi hon nua (0.12.0) -> bao lai 1 lan', x3.bao.length === 1 && x3.bao[0] === '0.12.0', JSON.stringify(x3.bao))
    const x4 = M('/moi.json', { khongLuu: true }); await x4.cn.kiemTra({ ep: true })
    const x4b = M('/moi.json', { khongLuu: true }); await x4b.cn.kiemTra({ ep: true })
    kiem('DOI CHUNG: neu khong luu "da bao" qua lan khoi dong thi bao lai (counter bai do song)', x4.bao.length + x4b.bao.length === 2, JSON.stringify([x4.bao, x4b.bao]))
    const x5 = M('/moi.json'); await x5.cn.kiemTra({ ep: true, imLang: true })
    kiem('Kiem tra tay (imLang): khong bung thong bao, nhung van danh dau da bao', x5.bao.length === 0 && x5.kho.v.daBao === '0.11.0')
  }

  console.log('\n[4] Cung ban / ban cu hon / so so')
  {
    for (const [url, ten] of [['/cung.json', 'cung ban 0.10.1'], ['/cu.json', 'ban cu 0.5.0'], ['/so-9.json', '0.9.9 so voi 0.10.1']]) {
      const x = M(url); const r = await x.cn.kiemTra()
      kiem(ten + ': khong co ban moi, khong bao', r.ketQua === 'moi-nhat' && !x.cn.trangThai().coBanMoi && x.bao.length === 0, r.ketQua)
    }
    const x = M('/so-10.json'); const r = await x.cn.kiemTra()
    kiem('0.10.10 so voi 0.10.1: CO ban moi', r.ketQua === 'moi' && x.cn.trangThai().phienBan === '0.10.10')
    const a = M('/moi.json', { phienBan: '0.11.0' }); const ra = await a.cn.kiemTra()
    kiem('app dang chay dung 0.11.0 thi json 0.11.0 khong phai ban moi', ra.ketQua === 'moi-nhat')
    // app vua duoc nang len: trang thai cu con ghi banMoi 0.11.0 -> phai tu het hieu luc
    const luu = M('/moi.json'); await luu.cn.kiemTra()
    const sau = M('/khong-co', { kho: luu.kho, phienBan: '0.11.0' })
    kiem('da nang len 0.11.0: muc "co ban moi" cu tu mat (khong can mang)', !sau.cn.trangThai().coBanMoi)
  }

  console.log('\n[5] Moc 24 gio')
  {
    const x = M('/moi.json'); const t0 = x.gio.t
    await x.cn.kiemTra()
    kiem('ghi moc lanKiemCuoi = gio luc kiem', x.kho.v.lanKiemCuoi === t0, String(x.kho.v.lanKiemCuoi))
    soGoi = {}
    kiem('goi lai ngay: chua den gio, KHONG hoi may chu', (await x.cn.kiemTra()).ketQua === 'chua-den-gio' && !soGoi['/moi.json'])
    x.gio.t = t0 + CHU_KY_MS - 1000
    kiem('23h59p59s: van chua den gio', (await x.cn.kiemTra()).ketQua === 'chua-den-gio' && !soGoi['/moi.json'])
    x.gio.t = t0 + CHU_KY_MS + 1000
    const r = await x.cn.kiemTra()
    kiem('qua 24 gio: hoi lai (1 goi)', r.ketQua !== 'chua-den-gio' && soGoi['/moi.json'] === 1, JSON.stringify(soGoi))
    kiem('moc duoc ghi lai theo gio moi', x.kho.v.lanKiemCuoi === x.gio.t)
    soGoi = {}; await x.cn.kiemTra({ ep: true })
    kiem('nut "Kiem tra ngay" (ep) bo qua moc 24 gio', soGoi['/moi.json'] === 1)
  }

  console.log('\n[6] Loi: im lang, khong bao, khong treo')
  {
    for (const [url, ten] of [['/hong.json', 'JSON hong'], ['/rac.json', 'tra HTML'], ['/mang.json', 'JSON la mang'], ['/sai-ban.json', 'phienBan sai'],
      ['/khong-co', '404'], ['/loi-may-chu', '500'], ['/to.json', 'phan hoi qua to']]) {
      const x = M(url); let nem = null, r
      try { r = await x.cn.kiemTra() } catch (e) { nem = e }
      kiem(ten + ': khong nem loi, ketQua loi, khong bao, khong co ban moi', !nem && r.ketQua === 'loi' && x.bao.length === 0 && !x.cn.trangThai().coBanMoi, nem ? String(nem) : r.ketQua)
      kiem(ten + ': co dong log', x.log.some((l) => /khong kiem tra duoc/.test(l)), JSON.stringify(x.log))
      kiem(ten + ': van ghi moc 24 gio (khong goi lai moi lan mo app)', x.kho.v && x.kho.v.lanKiemCuoi === x.gio.t)
    }
    // may chu tat han (cong dong) = mat mang
    const tat = http.createServer(); await new Promise((ok) => tat.listen(0, '127.0.0.1', ok)); const congChet = tat.address().port; await new Promise((ok) => tat.close(ok))
    const m = mayVoi(congChet, '/moi.json'); const rm = await m.cn.kiemTra()
    kiem('khong ket noi duoc (cong dong): loi im lang', rm.ketQua === 'loi' && m.bao.length === 0)
    // het gio
    const c = M('/cham.json', { hetGioMs: 300 }); const t = Date.now(); const rc = await c.cn.kiemTra(); const dt = Date.now() - t
    kiem('may chu treo: het gio sau ~0,3 s (khong treo app)', rc.ketQua === 'loi' && dt >= 250 && dt < 2000 && /het-gio/.test(rc.loi || ''), 'ketQua=' + rc.ketQua + ' ' + dt + 'ms ' + rc.loi)
    // da biet ban moi roi mang hong: muc menu khong nhap nhay mat
    const k = M('/moi.json'); await k.cn.kiemTra()
    const k2 = M('/khong-co', { kho: k.kho }); await k2.cn.kiemTra({ ep: true })
    kiem('da co ban moi, lan sau 404: van giu muc "co ban moi"', k2.cn.trangThai().coBanMoi && k2.bao.length === 0)
  }

  console.log('\n[7] Bo qua khi dang chup / quay')
  {
    const x = M('/moi.json'); x.ban = true; soGoi = {}
    const r = await x.cn.kiemTra({ ep: true })
    kiem('dang ban: ketQua ban, khong hoi may chu, khong ghi moc, khong bao', r.ketQua === 'ban' && !soGoi['/moi.json'] && !x.kho.v && x.bao.length === 0, JSON.stringify(soGoi))
    x.ban = false
    kiem('het ban: hoi binh thuong', (await x.cn.kiemTra()).ketQua === 'moi' && x.bao.length === 1)
  }

  console.log('\n[8] Lich: 30 giay sau khi mo, roi 24 gio; ban thi 5 phut')
  {
    const hen = { ds: [], hen(fn, ms) { const h = { fn, ms }; hen.ds.push(h); return h }, huy(h) { h.huy = true } }
    const mk = (o) => M('/cung.json', Object.assign({ hen: (fn, ms) => hen.hen(fn, ms), huyHen: (h) => hen.huy(h) }, o))
    let x = mk(); x.cn.batDau()
    kiem('lan dau: hen dung 30 giay', hen.ds.length === 1 && hen.ds[0].ms === SAU_KHI_MO_MS, JSON.stringify(hen.ds.map((h) => h.ms)))
    await hen.ds[0].fn()
    kiem('chay xong: hen tiep dung 24 gio', hen.ds.length === 2 && hen.ds[1].ms === CHU_KY_MS, JSON.stringify(hen.ds.map((h) => h.ms)))
    kiem('da hoi may chu 1 lan', x.kho.v && x.kho.v.lanKiemCuoi === x.gio.t)
    // mo lai app sau 20 gio: khong hoi som hon 24 gio ke tu moc
    hen.ds.length = 0
    x.gio.t += 20 * 3600 * 1000
    const y = mk({ kho: x.kho, gio: x.gio.t }); y.cn.batDau()
    kiem('mo lai sau 20 gio: hen ~4 gio (khong phai 30 giay)', Math.abs(hen.ds[0].ms - 4 * 3600 * 1000) < 2000, String(hen.ds[0].ms))
    hen.ds.length = 0
    const z = mk(); z.ban = true; z.cn.batDau(); await hen.ds[0].fn()
    kiem('dang ban: thu lai sau 5 phut', hen.ds.length === 2 && hen.ds[1].ms === THU_LAI_KHI_BAN_MS, JSON.stringify(hen.ds.map((h) => h.ms)))
    z.cn.dung()
    kiem('dung() huy hen', hen.ds[1].huy === true)
  }

  console.log('\n[9] Lien ket: chi https (ban that)')
  {
    const x = M('/http-link.json', { chapNhanHttp: false }); await x.cn.kiemTra()
    const tt = x.cn.trangThai()
    kiem('link http bi bo (khong mo trinh duyet vao http), van bao co ban moi', tt.coBanMoi && tt.link === null, JSON.stringify(tt.link))
  }

  console.log('\n[10] Hai ngon ngu')
  {
    const khoa = ['cn.dangDung', 'cn.coBanMoi', 'cn.taiVe', 'cn.kiemNgay', 'cn.dangKiem', 'cn.moiNhat', 'cn.khongKiem', 'cn.dangBan', 'cn.tray', 'cn.baoMoi', 'set.nhom.ungDung']
    for (const k of khoa) {
      const vi = i18n.t('vi', k), en = i18n.t('en', k)
      const ok = vi && en && vi !== k && en !== k && vi !== en && /\{v\}/.test(vi) === /\{v\}/.test(en)
      kiem(k + ': co VI + EN khac nhau, cung cho {v}', !!ok, vi + ' | ' + en)
    }
    kiem('khong dung gach ngang dai', khoa.every((k) => !/—/.test(i18n.t('vi', k) + i18n.t('en', k))))
    kiem('DOI CHUNG: khoa khong ton tai bi bat', i18n.t('vi', 'cn.khong-co-that') === 'cn.khong-co-that')
  }

  kiem('khong co unhandledRejection nao', khongBatDuoc === 0, String(khongBatDuoc))
}

maychu.listen(0, '127.0.0.1', async () => {
  const cong = maychu.address().port
  console.log('may chu gia 127.0.0.1:' + cong)
  try { await chay(cong) } catch (e) { truot++; console.log('  TRUOT ngoai le: ' + (e && e.stack || e)) }
  maychu.close()
  console.log('\nTong: ' + dat + ' dat, ' + truot + ' truot')
  process.exit(truot ? 1 : 0)
})
