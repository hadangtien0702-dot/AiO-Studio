// Bai do nut "Cap nhat ngay" (src/cap-nhat-tai.js + phan tuCai cua src/cap-nhat.js), 23/11/2026.
// Chay an, khong Electron: may chu gia (http 127.0.0.1) dong vai cong aio-mail + kho S3 cua Polar, bo cai gia = 3 MB ngau nhien.
// KHONG chay bo cai that, KHONG thoat app: chayBoCai / thoat chi ghi lai lan goi. Chay: npm run test:capnhattai
'use strict'
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto')
const { taoTaiBanMoi } = require('../../src/cap-nhat-tai')
const { taoCapNhat } = require('../../src/cap-nhat')

let dat = 0, truot = 0
const kiem = (ten, dk, ct) => { if (dk) dat++; else { truot++; console.log('TRUOT', ten, ct === undefined ? '' : JSON.stringify(ct)) } }

const BO_CAI = crypto.randomBytes(3 * 1024 * 1024 + 123)
const SHA = crypto.createHash('sha256').update(BO_CAI).digest('hex')
const BAN = '0.11.2'

async function mayChu(kieu) {
  const dem = { cong: 0, tai: 0, body: null }
  const sv = http.createServer((req, res) => {
    if (req.url === '/cong') {
      dem.cong++
      let b = ''; req.on('data', (x) => { b += x }); req.on('end', () => {
        dem.body = JSON.parse(b)
        if (kieu.cong403) { res.writeHead(403); return res.end(JSON.stringify({ loi: 'ma-khong-hop-le' })) }
        if (kieu.cong500) { res.writeHead(502); return res.end(JSON.stringify({ loi: 'polar-loi' })) }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ten: kieu.ten || 'AiO-Shot-and-Save-Setup-' + BAN + '.exe', kichThuoc: BO_CAI.length, sha256: kieu.shaCong || SHA, url: 'https://gia/tai' }))
      })
      return
    }
    if (req.url === '/tai') {
      dem.tai++
      const du = kieu.hong ? Buffer.concat([BO_CAI.subarray(0, 1000), Buffer.from('X'), BO_CAI.subarray(1001)]) : BO_CAI
      res.writeHead(200, { 'content-length': du.length })
      if (kieu.treo) { res.write(du.subarray(0, 500000)); return } // gui mot nua roi im
      let i = 0
      const day = () => { if (i >= du.length) return res.end(); res.write(du.subarray(i, i + 256 * 1024)); i += 256 * 1024; setTimeout(day, 2) }
      return day()
    }
    res.writeHead(404); res.end()
  })
  await new Promise((r) => sv.listen(0, '127.0.0.1', r))
  return { sv, dem, goc: 'http://127.0.0.1:' + sv.address().port }
}

async function chay(kieu = {}) {
  const m = await mayChu(kieu)
  const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-capnhat-'))
  const goi = { cai: [], thoat: 0, buoc: [] }
  // fetch boc: "https://gia/tai" (link Polar ky) -> may chu gia
  const f = (url, opt) => fetch(url === 'https://gia/tai' ? m.goc + '/tai' : url, opt)
  const tai = taoTaiBanMoi({
    fetch: f, cong: m.goc + '/cong', thuMuc, fs, path, crypto, hetGioNhanMs: 800, hetGioCongMs: 3000,
    layMa: () => (kieu.khongMa ? null : { key: 'AIOSS-THU', activationId: 'act-1' }),
    banMoi: () => (kieu.khongSha ? { phienBan: BAN } : { phienBan: BAN, sha256Win: SHA }),
    chayBoCai: (file) => goi.cai.push(file), thoat: () => { goi.thoat++ },
    tienDo: (st) => goi.buoc.push(st.buoc + ':' + st.phanTram),
  })
  const p1 = tai.capNhatNgay()
  const p2 = kieu.haiLan ? tai.capNhatNgay() : null
  const kq = await p1
  if (p2) kiem('bam 2 lan = cung mot luot', (await p2) === kq && m.dem.tai <= 1, m.dem)
  m.sv.close()
  const tep = fs.readdirSync(thuMuc)
  return { kq, goi, dem: m.dem, tep, thuMuc, tai }
}

;(async () => {
  // 1. Duong dung
  let r = await chay({ haiLan: true })
  kiem('dung: ok', r.kq.ok === true, r.kq)
  kiem('dung: chay bo cai 1 lan', r.goi.cai.length === 1 && path.basename(r.goi.cai[0]) === 'AiO-Shot-and-Save-Setup-' + BAN + '.exe', r.goi.cai)
  kiem('dung: file tren dia dung tung byte', r.goi.cai[0] && crypto.createHash('sha256').update(fs.readFileSync(r.goi.cai[0])).digest('hex') === SHA)
  kiem('dung: thoat app 1 lan', r.goi.thoat === 1)
  kiem('dung: khong de lai .dang-tai', r.tep.length === 1, r.tep)
  kiem('dung: gui ma + activation cho cong', r.dem.body && r.dem.body.key === 'AIOSS-THU' && r.dem.body.activation_id === 'act-1', r.dem.body)
  const pt = r.goi.buoc.filter((x) => x.startsWith('tai:')).map((x) => +x.split(':')[1])
  kiem('dung: % tang dan, nhieu buoc', pt.length >= 5 && pt.every((v, i) => i === 0 || v >= pt[i - 1]) && pt[pt.length - 1] >= 90, pt)
  kiem('dung: thu tu buoc', ['xin-link', 'tai', 'kiem', 'cai'].every((b) => r.goi.buoc.some((x) => x.startsWith(b + ':'))), r.goi.buoc.slice(-4))

  // 2. Doi chung: file bi sua 1 byte -> KHONG cai, xoa file
  r = await chay({ hong: true })
  kiem('hong: bao file-hong', r.kq.loi === 'file-hong', r.kq)
  kiem('hong: KHONG chay bo cai, KHONG thoat', r.goi.cai.length === 0 && r.goi.thoat === 0)
  kiem('hong: khong de file nao', r.tep.length === 0, r.tep)

  // 3. Khong co ma / json thieu sha -> khong goi mang
  r = await chay({ khongMa: true }); kiem('khong ma: chua-co-ma, 0 goi mang', r.kq.loi === 'chua-co-ma' && r.dem.cong === 0)
  r = await chay({ khongSha: true }); kiem('json thieu sha: khong-tu-cai, 0 goi mang', r.kq.loi === 'khong-tu-cai' && r.dem.cong === 0)
  // 4. Cong tu choi / loi
  r = await chay({ cong403: true }); kiem('ma bi tu choi: ma-khong-hop-le, 0 tai', r.kq.loi === 'ma-khong-hop-le' && r.dem.tai === 0)
  r = await chay({ cong500: true }); kiem('cong loi: cong-502, 0 tai', /^cong-502/.test(r.kq.loi) && r.dem.tai === 0, r.kq)
  // 5. Polar chua co file ban moi (con ban cu) / sha cong lech web
  r = await chay({ ten: 'AiO-Shot-and-Save-Setup-0.11.1.exe' }); kiem('Polar con ban cu: lech-ban, 0 tai', r.kq.loi === 'lech-ban' && r.dem.tai === 0)
  r = await chay({ shaCong: 'ab'.repeat(32) }); kiem('sha Polar lech web: lech-ban, 0 tai', r.kq.loi === 'lech-ban' && r.dem.tai === 0)
  // 6. Tai bi treo giua chung -> dung, khong cai
  r = await chay({ treo: true })
  kiem('treo: tai-dung-giua-chung, khong cai', r.kq.loi === 'tai-dung-giua-chung' && r.goi.cai.length === 0, r.kq)
  kiem('treo: trang thai loi', r.tai.trangThai().buoc === 'loi')

  // 7. cap-nhat.js: tuCai chi bat khi Windows + json co sha256Win + co ma
  const json = (o) => JSON.stringify(Object.assign({ phienBan: BAN, linkWin: 'https://polar.sh/aiostudio/portal' }, o))
  async function tt(o, nenTang, coMa) {
    const cn = taoCapNhat({ fetch: async () => ({ status: 200, text: async () => json(o) }), phienBan: '0.11.1', nenTang, doc: () => null, ghi: () => {}, tuCai: () => coMa })
    await cn.kiemTra({ ep: true, imLang: true }); return cn.trangThai()
  }
  kiem('tuCai: win + sha + ma = true', (await tt({ sha256Win: SHA }, 'win32', true)).tuCai === true)
  kiem('tuCai: khong ma = false', (await tt({ sha256Win: SHA }, 'win32', false)).tuCai === false)
  kiem('tuCai: json khong sha = false', (await tt({}, 'win32', true)).tuCai === false)
  kiem('tuCai: sha sai dinh dang = false', (await tt({ sha256Win: 'xyz' }, 'win32', true)).tuCai === false)
  kiem('tuCai: Mac = false', (await tt({ sha256Win: SHA }, 'darwin', true)).tuCai === false)
  kiem('sha viet HOA van nhan (chuan thuong)', (await (async () => { const cn = taoCapNhat({ fetch: async () => ({ status: 200, text: async () => json({ sha256Win: SHA.toUpperCase() }) }), phienBan: '0.11.1', doc: () => null, ghi: () => {} }); await cn.kiemTra({ ep: true, imLang: true }); return cn.banHieuLuc().sha256Win })()) === SHA)

  console.log('cap-nhat-tai: dat ' + dat + ', truot ' + truot)
  process.exit(truot ? 1 : 0)
})().catch((e) => { console.error('LOI BAI DO', e); process.exit(2) })
