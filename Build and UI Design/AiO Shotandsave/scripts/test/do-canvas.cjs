'use strict'
/* Do CANVAS Y TUONG — phan thu muc + so bo cuc (src/canvas-kho.js). Chay: npm run test:canvas
   Khong bat cua so, khong can Electron. Moi file nam trong MOT thu muc tam do bai nay tao (os.tmpdir()/aio-canvas-*) va tu xoa dung thu muc do.
   Dieu bai nay canh: (1) khung <-> thu muc con cung ten, hai chieu; (2) app KHONG BAO GIO dung toi anh goc va khong xoa file khong phai
   cua minh; (3) so bo cuc hong / khong doc duoc thi khong mat, khong ghi de; (4) 800 anh van chay nhanh.
   Dieu bai nay KHONG do: cua so that, keo bang chuot, anh nho, Windows (chua chay tren Windows lan nao). */
const fs = require('fs')
const os = require('os')
const path = require('path')
const ROOT = path.resolve(__dirname, '..', '..')
const K = require(path.join(ROOT, 'src', 'canvas-kho.js'))

let truot = 0
const kiem = (ten, ok, ct) => { if (!ok) truot++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-canvas-'))
const goc = path.join(TAM, 'anh'), ud = path.join(TAM, 'ud')
fs.mkdirSync(goc, { recursive: true })
const log = []
const viet = (p, s) => fs.writeFileSync(p, s)
const ino = (p) => String(fs.statSync(p, { bigint: true }).ino)
const co = (p) => fs.existsSync(p)
const TEN = ['a.jpg', 'b.jpg', 'c.png', 'd.jpg', 'e.jpg', 'f.jpg']
TEN.forEach((t, i) => { viet(path.join(goc, t), 'anh-' + t + '-' + 'x'.repeat(10 + i)); const g = new Date(Date.now() - (10 - i) * 60000); fs.utimesSync(path.join(goc, t), g, g) })
viet(path.join(goc, 'quay.mp4'), 'video-goc')
viet(path.join(goc, 'shotandsave-storyboard-1.png'), 'dai xuat ra, khong vao canvas')
viet(path.join(goc, 'ghi-chu.txt'), 'khong phai anh')
fs.mkdirSync(path.join(goc, '.keo')); viet(path.join(goc, '.keo', 'a.jpg'), 'ban keo tha')
const chupGoc = () => fs.readdirSync(goc).filter((t) => fs.statSync(path.join(goc, t)).isFile()).sort().map((t) => t + ':' + fs.readFileSync(path.join(goc, t), 'utf8')).join('|')
const GOC0 = chupGoc()
const DAI = [{ id: 'dai-20261012-101010-001', mtime: Date.now() - 5000, khung: [1, 2, 3, 4, 5, 6] }]
const giao = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const chong = (ds) => { let n = 0; for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) if (giao(ds[i], ds[j])) n++; return n }
const trong = (m, k) => m.x + m.w / 2 >= k.x && m.x + m.w / 2 <= k.x + k.w && m.y + m.h / 2 >= k.y && m.y + m.h / 2 <= k.y + k.h
const tim = (tt, khoa) => tt.muc.find((m) => m.khoa === khoa)

console.log('\n[1] Ten thu muc')
kiem('tenHopLe: bo ky tu cam, khoang trang thua, dau cham cuoi; tu choi rong / bat dau bang cham / ten danh rieng cua Windows',
  K.tenHopLe('  Tham  khảo: màu?  ') === 'Tham khảo màu' && K.tenHopLe('a/b\\c') === 'abc' && K.tenHopLe('ten.') === 'ten' && K.tenHopLe('') === null && K.tenHopLe('   ') === null && K.tenHopLe('.an') === null && K.tenHopLe('CON') === null && K.tenHopLe('x'.repeat(90)).length === 60)

console.log('\n[2] Lan mo dau: bay moi thu ra bang')
K.khoiTao(ud, (s) => log.push(s))
let r = K.nap(goc, DAI)
kiem('7 file (6 anh + 1 video) + 1 dai = 8 tam; bo qua .keo, file dai xuat ra, file khong phai anh; chua co khung', r.tt.muc.length === 8 && r.tt.khung.length === 0 && r.loiSo === null, r.tt.muc.length + ' tam, ' + r.tt.khung.length + ' khung')
kiem('Khong tam nao de len nhau; dai rong gap doi; tam moi nhat nam cuoi', chong(r.tt.muc) === 0 && tim(r.tt, 'dai:' + DAI[0].id).w > tim(r.tt, 'a.jpg').w && r.tt.muc[0].khoa === 'a.jpg', 'chong ' + chong(r.tt.muc))
kiem('So bo cuc da ghi ra dia', co(path.join(ud, 'canvas', 'bo-cuc.json')))

console.log('\n[3] Khung = thu muc con cung ten')
const t1 = K.taoKhung(goc, 'Tham khảo màu', 100, 100)
kiem('Tao khung -> co thu muc con dung ten, rong', t1.ok && co(path.join(goc, 'Tham khảo màu')) && fs.readdirSync(path.join(goc, 'Tham khảo màu')).length === 0)
const t1b = K.taoKhung(goc, 'Tham khảo màu')
kiem('Tao khung trung ten -> tu them so, khong de len thu muc cu', t1b.ok && t1b.khung.ten === 'Tham khảo màu 2' && co(path.join(goc, 'Tham khảo màu 2')), t1b.khung && t1b.khung.ten)
const k1 = t1.khung.id
let d = K.datThanhVien(goc, 'a.jpg', k1)
const noi = path.join(goc, 'Tham khảo màu', 'a.jpg')
kiem('Keo anh vao khung -> thu muc co BAN NOI cung ma file voi anh goc; anh goc con nguyen', d.ok && co(noi) && ino(noi) === ino(path.join(goc, 'a.jpg')) && chupGoc() === GOC0)
r = K.nap(goc, DAI)
kiem('Mo lai: tam do thuoc khung, nam TRONG khung', tim(r.tt, 'a.jpg').khung === k1 && trong(tim(r.tt, 'a.jpg'), r.tt.khung.find((k) => k.id === k1)))
d = K.datThanhVien(goc, 'a.jpg', t1b.khung.id)
kiem('Keo sang khung khac -> ban noi doi thu muc (khong nam o ca hai)', d.ok && !co(noi) && co(path.join(goc, 'Tham khảo màu 2', 'a.jpg')) && chupGoc() === GOC0)
d = K.datThanhVien(goc, 'a.jpg', null)
kiem('Keo ra ngoai -> bo ban noi, anh goc con nguyen', d.ok && d.giu === 0 && !co(path.join(goc, 'Tham khảo màu 2', 'a.jpg')) && chupGoc() === GOC0)

console.log('\n[4] Khong xoa thu khong phai cua minh')
viet(path.join(goc, 'Tham khảo màu', 'rieng.jpg'), 'file nguoi dung tu bo vao thu muc')
viet(path.join(goc, 'Tham khảo màu', 'b.jpg'), 'ban KHAC trung ten b.jpg')
r = K.nap(goc, DAI)
const rieng = r.tt.muc.find((m) => m.chiTrongKhung)
kiem('File chi co trong thu muc con -> hien trong khung, danh dau "chi trong thu muc"', !!rieng && rieng.khung === k1 && rieng.tep.join('/') === 'Tham khảo màu/rieng.jpg', rieng && rieng.khoa)
d = K.datThanhVien(goc, rieng.khoa, null)
kiem('Keo file do ra ngoai -> tu choi, file con nguyen', d.ok === false && d.loi === 'chi-trong-thu-muc' && fs.readFileSync(path.join(goc, 'Tham khảo màu', 'rieng.jpg'), 'utf8').startsWith('file nguoi dung'))
kiem('File trung ten trong thu muc -> tam b.jpg duoc tinh la thuoc khung', tim(r.tt, 'b.jpg').khung === k1)
d = K.datThanhVien(goc, 'b.jpg', null)
kiem('DOI CHUNG: keo b.jpg ra ngoai -> KHONG xoa ban trung ten (khac ma file), bao giu = 1', d.ok && d.giu === 1 && fs.readFileSync(path.join(goc, 'Tham khảo màu', 'b.jpg'), 'utf8') === 'ban KHAC trung ten b.jpg' && chupGoc() === GOC0)
kiem('Duong dan la / khoa khong hop le bi tu choi', K.datThanhVien(goc, '../x.jpg', k1).ok === false && K.datThanhVien(goc, '.keo', k1).ok === false && K.datThanhVien(goc, 'khong-co.jpg', k1).loi === 'mat-goc' && K.datThanhVien(goc, 'a.jpg', 'khung-la').loi === 'khong-co-khung')

console.log('\n[5] Doi ten: tu app va tu Finder')
let dt = K.doiTenKhung(goc, k1, 'Bảng màu phim Tết')
kiem('Doi ten khung -> thu muc doi ten theo, file ben trong con du', dt.ok && co(path.join(goc, 'Bảng màu phim Tết', 'rieng.jpg')) && !co(path.join(goc, 'Tham khảo màu')))
kiem('Ten khong hop le / trung thu muc khac -> tu choi, khong doi gi', K.doiTenKhung(goc, k1, '///').loi === 'ten' && K.doiTenKhung(goc, k1, 'tham khảo màu 2').loi === 'trung' && co(path.join(goc, 'Bảng màu phim Tết')))
K.luuViTri({ khung: [{ id: k1, x: 1500, y: 900, w: 700, h: 500 }] })
fs.renameSync(path.join(goc, 'Bảng màu phim Tết'), path.join(goc, 'Doi ten trong Finder'))
r = K.nap(goc, DAI)
const kf = r.tt.khung.find((k) => k.id === k1)
kiem('Doi ten thu muc trong Finder -> VAN la khung do (nhan ra bang ma thu muc), ten moi, giu cho + co', !!kf && kf.ten === 'Doi ten trong Finder' && kf.x === 1500 && kf.w === 700, kf ? kf.ten + ' @' + kf.x : 'mat khung')
fs.mkdirSync(path.join(goc, 'Tao tay')); fs.linkSync(path.join(goc, 'c.png'), path.join(goc, 'Tao tay', 'c.png'))
r = K.nap(goc, DAI)
const kt = r.tt.khung.find((k) => k.ten === 'Tao tay')
kiem('Tao thu muc trong Finder + bo anh vao -> co khung moi cung ten, anh nam trong khung, khong de len khung khac', !!kt && tim(r.tt, 'c.png').khung === kt.id && trong(tim(r.tt, 'c.png'), kt) && r.tt.khung.every((o) => o === kt || !giao({ x: o.x, y: o.y, w: o.w, h: o.h }, { x: kt.x, y: kt.y, w: kt.w, h: kt.h })))
fs.unlinkSync(path.join(goc, 'Tao tay', 'c.png')); fs.rmdirSync(path.join(goc, 'Tao tay'))
r = K.nap(goc, DAI)
kiem('Xoa thu muc trong Finder -> khung mat theo, anh ve ngoai, anh goc con nguyen', !r.tt.khung.some((k) => k.ten === 'Tao tay') && tim(r.tt, 'c.png').khung === null && chupGoc() === GOC0)

console.log('\n[6] Vi tri + dai Storyboard')
K.luuViTri({ vt: { 'd.jpg': { x: 5000, y: 4000 }, 'khong-co': { x: 1, y: 1 } } })
K.khoiTao(ud, (s) => log.push(s))                       // gia lap tat app mo lai
r = K.nap(goc, DAI)
kiem('Keo tam di cho khac -> tat app mo lai van o do; khoa la khong lot vao so', tim(r.tt, 'd.jpg').x === 5000 && tim(r.tt, 'd.jpg').y === 4000 && !JSON.parse(fs.readFileSync(path.join(ud, 'canvas', 'bo-cuc.json'), 'utf8')).vt['khong-co'])
K.luuViTri({ vt: { 'e.jpg': { x: kf.x + 40, y: kf.y + 40 } } })   // so noi "trong khung" nhung thu muc khong co e.jpg
r = K.nap(goc, DAI)
kiem('DOI CHUNG: so lech voi thu muc -> THU MUC thang (tam e.jpg bi dua ra ngoai khung)', tim(r.tt, 'e.jpg').khung === null && !trong(tim(r.tt, 'e.jpg'), r.tt.khung.find((k) => k.id === k1)))
d = K.datThanhVien(goc, 'dai:' + DAI[0].id, k1)
r = K.nap(goc, DAI)
kiem('Dai Storyboard vao khung (ghi trong so, khong tao file)', d.ok && tim(r.tt, 'dai:' + DAI[0].id).khung === k1 && trong(tim(r.tt, 'dai:' + DAI[0].id), r.tt.khung.find((k) => k.id === k1)))

console.log('\n[7] So bo cuc hong / khong doc duoc')
const SO = path.join(ud, 'canvas', 'bo-cuc.json')
viet(SO, '{ hong giua chung')
K.khoiTao(ud, (s) => log.push(s))
r = K.nap(goc, DAI)
const catHong = fs.readdirSync(path.dirname(SO)).filter((t) => t.includes('.hong-'))
kiem('So hong -> cat sang bo-cuc.hong-<gio>.json, bang dung lai tu thu muc (khung van du vi thu muc con con)', r.loiSo === 'hong' && catHong.length === 1 && r.tt.khung.length === 2 && r.tt.muc.length >= 8, catHong.join(','))
fs.unlinkSync(SO); fs.mkdirSync(SO)                         // file so thanh thu muc = doc KHONG duoc (khong phai "chua co")
K.khoiTao(ud, (s) => log.push(s))
r = K.nap(goc, DAI)
kiem('DOI CHUNG: so khong doc duoc -> bao loi "doc", KHONG ghi de (thu muc gia van con), bang van hien', r.loiSo === 'doc' && fs.statSync(SO).isDirectory() && r.tt.muc.length >= 8 && K.luuViTri({ vt: { 'a.jpg': { x: 1, y: 2 } } }) === false)
fs.rmdirSync(SO)

console.log('\n[8] Quy mo that: 800 anh, 5 thu muc x 40 anh')
const goc2 = path.join(TAM, 'anh800'), ud2 = path.join(TAM, 'ud800')
fs.mkdirSync(goc2)
for (let i = 0; i < 800; i++) viet(path.join(goc2, 'shot-' + String(i).padStart(4, '0') + '.jpg'), 'x' + i)
for (let j = 0; j < 5; j++) { const dj = path.join(goc2, 'Nhom ' + (j + 1)); fs.mkdirSync(dj); for (let i = 0; i < 40; i++) { const t = 'shot-' + String(j * 40 + i).padStart(4, '0') + '.jpg'; fs.linkSync(path.join(goc2, t), path.join(dj, t)) } }
K.khoiTao(ud2, () => {})
let t0 = Date.now(); r = K.nap(goc2, []); const msDau = Date.now() - t0
t0 = Date.now(); const r2 = K.nap(goc2, []); const msSau = Date.now() - t0
const ngoai = r.tt.muc.filter((m) => !m.khung)
kiem('800 tam, 5 khung: lan dau duoi 3 giay, lan sau duoi 1 giay', r.tt.muc.length === 800 && r.tt.khung.length === 5 && msDau < 3000 && msSau < 1000, 'lan dau ' + msDau + ' ms, lan sau ' + msSau + ' ms')
kiem('200 tam trong khung deu nam TRONG khung cua no; 600 tam ngoai khong de nhau, khong lot vao khung nao', r.tt.muc.filter((m) => m.khung).length === 200 && r.tt.muc.filter((m) => m.khung).every((m) => trong(m, r.tt.khung.find((k) => k.id === m.khung))) && chong(ngoai) === 0 && ngoai.every((m) => !r.tt.khung.some((k) => trong(m, k))), 'chong ' + chong(ngoai))
kiem('Lan mo thu hai khong xe dich tam nao', JSON.stringify(r.tt.muc.map((m) => [m.khoa, m.x, m.y])) === JSON.stringify(r2.tt.muc.map((m) => [m.khoa, m.x, m.y])))

console.log('\n[10] Vat tren bang (ghi chu, chu, mui ten, net ve) — chi nam trong so, khong tao file')
{
  const goc3 = path.join(TAM, 'anh-vat'), ud3 = path.join(TAM, 'ud-vat')
  fs.mkdirSync(goc3); viet(path.join(goc3, 'p.png'), 'png-p'); viet(path.join(goc3, 'q.png'), 'png-q')
  K.khoiTao(ud3, (s) => log.push(s))
  let r3 = K.nap(goc3, [])
  const truocFile = fs.readdirSync(goc3).sort().join('|')
  const ok = K.luuVat({
    vat: [{ id: 'v1', loai: 'ghi', x: 10.4, y: 20, w: 168, h: 168, mau: '#ffe27a', chu: 'y tuong A', tao: 1 }, { id: 'v2', loai: 'link', x: 300, y: 20, w: 290, h: 84, mau: '#f86820', chu: '', url: 'https://example.com', tao: 2 },
      { id: 'v3', loai: 'khong-biet', x: 0, y: 0 }, { id: '../x', loai: 'ghi' }, { loai: 'ghi' }, { id: 'v1', loai: 'chu' }],
    noi: [{ id: 'c1', a: { k: 'v:v1' }, b: { k: 'o:p.png' }, mau: '#f86820' }, { id: 'c2', a: { k: 'v:v1' }, b: { k: 'o:khong-co.png' }, mau: '#2dd4bf' }, { id: 'c3', a: { x: 1, y: 2 }, b: { k: 'x:sai' } }],
    net: [{ id: 's1', loai: 'but', mau: '#f86820', pts: [0, 0, 10, 10, 20.26, 5] }, { id: 's2', loai: 'but', pts: [1] }, { id: 's3', loai: 'cay-viet', pts: [0, 0, 1, 1] }],
    z: { 'o:p.png': 3, 'v:v1': -2, 'rac': 9, 'o:khong-co.png': 4 }, khoa: { 'v:v1': true, 'f:khong-co': true, 'rac': true },
  })
  const doc = JSON.parse(fs.readFileSync(path.join(ud3, 'canvas', 'bo-cuc.json'), 'utf8'))
  kiem('luuVat: giu 2 vat hop le (bo loai la, id sai, id thieu, id trung), lam tron toa do, 1 ghi chu + 1 the link', ok && doc.vat.length === 2 && doc.vat[0].x === 10 && doc.vat[1].url === 'https://example.com', JSON.stringify(doc.vat.map((v) => v.id)))
  kiem('luuVat: mui ten giu lai nhung khong dung do loi khoa; net sai (1 so, loai la) bi bo, toa do net lam tron 0,1', doc.noi.length === 2 && doc.net.length === 1 && doc.net[0].pts[4] === 20.3, 'noi ' + doc.noi.length + ' net ' + doc.net.length)
  kiem('luuVat: lop / khoa chi nhan khoa dung dang (o: v: s: f:)', Object.keys(doc.z).sort().join() === 'o:khong-co.png,o:p.png,v:v1' && Object.keys(doc.khoa).sort().join() === 'f:khong-co,v:v1')
  kiem('Luu vat KHONG tao file nao trong thu muc anh', fs.readdirSync(goc3).sort().join('|') === truocFile)
  K.khoiTao(ud3, (s) => log.push(s))
  r3 = K.nap(goc3, [])
  kiem('Mo lai: vat + net con nguyen; mui ten tro vao anh KHONG TON TAI bi bo, mui ten tro vao anh ton tai con; lop + khoa cua thu da mat bi bo',
    r3.tt.vat.length === 2 && r3.tt.net.length === 1 && r3.tt.noi.length === 1 && r3.tt.noi[0].id === 'c1' && !('o:khong-co.png' in r3.tt.z) && !('f:khong-co' in r3.tt.khoa) && r3.tt.khoa['v:v1'] === true,
    'noi ' + JSON.stringify(r3.tt.noi.map((n) => n.id)) + ' z ' + JSON.stringify(r3.tt.z))
  fs.unlinkSync(path.join(goc3, 'p.png'))
  r3 = K.nap(goc3, [])
  kiem('Xoa anh p.png ngoai Finder -> mui ten noi vao no mat theo, ghi chu v1 van con', r3.tt.noi.length === 0 && r3.tt.vat.some((v) => v.id === 'v1'))
  kiem('luuVat chi thay truong duoc gui: gui rieng { khoa: {} } khong xoa vat', K.luuVat({ khoa: {} }) && K.nap(goc3, []).tt.vat.length === 2)
  const tk = K.taoKhung(goc3, 'Mau', 0, 0)
  K.luuViTri({ khung: [{ id: tk.khung.id, x: 0, y: 0, w: 640, h: 400, mau: '#2dd4bf' }] })
  const mauKhung = () => K.nap(goc3, []).tt.khung.find((k) => k.id === tk.khung.id).mau
  const mau1 = mauKhung()
  K.luuViTri({ khung: [{ id: tk.khung.id, x: 0, y: 0, w: 640, h: 400, mau: 'red; x' }] })
  kiem('luuViTri: doi mau khung hop le luu duoc, mau sai (khong phai #rrggbb) bi bo', mau1 === '#2dd4bf' && mauKhung() === '#2dd4bf', mau1 + ' / ' + mauKhung())
}

console.log('\n[11] Xoa khung: chi khi trong thu muc chi con ban noi cua anh goc')
{
  const goc4 = path.join(TAM, 'anh-xoa'), ud4 = path.join(TAM, 'ud-xoa')
  fs.mkdirSync(goc4); viet(path.join(goc4, 'a.png'), 'A'); viet(path.join(goc4, 'b.png'), 'B'); viet(path.join(goc4, 'c.png'), 'C')
  K.khoiTao(ud4, (s) => log.push(s))
  K.nap(goc4, [])
  const k1 = K.taoKhung(goc4, 'Chi ban noi', 10, 10).khung.id, k2 = K.taoKhung(goc4, 'Co file rieng', 800, 10).khung.id
  K.datThanhVien(goc4, 'a.png', k1); K.datThanhVien(goc4, 'b.png', k2)
  viet(path.join(goc4, 'Co file rieng', 'cua-toi.png'), 'file nguoi dung')
  const chup = () => ['a.png', 'b.png', 'c.png'].map((t) => t + ':' + fs.readFileSync(path.join(goc4, t), 'utf8')).join('|')
  const g0 = chup()
  let x = K.xoaKhung(goc4, k2)
  kiem('Khung con file rieng -> TU CHOI, thu muc + file rieng + ban noi con nguyen, anh goc con nguyen', x.ok === false && x.loi === 'chi-trong-thu-muc' && x.giu === 1 && co(path.join(goc4, 'Co file rieng', 'cua-toi.png')) && co(path.join(goc4, 'Co file rieng', 'b.png')) && chup() === g0, JSON.stringify(x))
  viet(path.join(goc4, 'Chi ban noi', '.DS_Store'), 'rac')
  x = K.xoaKhung(goc4, k1)
  kiem('Khung chi con ban noi (+ .DS_Store) -> xoa thu muc, bo khung; anh goc a.png con nguyen', x.ok === true && !co(path.join(goc4, 'Chi ban noi')) && co(path.join(goc4, 'a.png')) && chup() === g0 && !K.nap(goc4, []).tt.khung.some((k) => k.id === k1), JSON.stringify(x))
  kiem('Anh a.png tro ve nam ngoai, khong con thuoc khung nao', K.nap(goc4, []).tt.muc.find((m) => m.khoa === 'a.png').khung === null)
  kiem('Xoa khung khong ton tai -> loi, khong nem', K.xoaKhung(goc4, 'khong-co').loi === 'khong-co-khung')
  // ban noi bi nguoi dung thay bang file KHAC cung ten -> khong phai cua minh -> tu choi
  const k3 = K.taoKhung(goc4, 'Thay file', 10, 600).khung.id
  K.datThanhVien(goc4, 'c.png', k3)
  fs.unlinkSync(path.join(goc4, 'Thay file', 'c.png')); viet(path.join(goc4, 'Thay file', 'c.png'), 'ban khac hoan toan, dai hon nhieu')
  x = K.xoaKhung(goc4, k3)
  kiem('DOI CHUNG: ban noi bi thay bang file khac cung ten -> khong xoa', x.ok === false && x.loi === 'chi-trong-thu-muc' && fs.readFileSync(path.join(goc4, 'Thay file', 'c.png'), 'utf8').startsWith('ban khac'))
}

console.log('\n[12] Dua file tu ngoai vao + nhan doi anh')
{
  const goc5 = path.join(TAM, 'anh-nhap'), ngoai5 = path.join(TAM, 'ngoai')
  fs.mkdirSync(goc5); fs.mkdirSync(ngoai5); fs.mkdirSync(path.join(goc5, 'Khung'))
  viet(path.join(ngoai5, 'tha.png'), 'tu-ngoai'); viet(path.join(ngoai5, 'ghi.txt'), 'khong phai anh'); viet(path.join(ngoai5, 'v.mp4'), 'video')
  viet(path.join(goc5, 'co-san.png'), 'da-co'); viet(path.join(goc5, 'Khung', 'trong.png'), 'trong-khung')
  K.khoiTao(path.join(TAM, 'ud-nhap'), (s) => log.push(s))
  const r5 = K.nhapFile(goc5, [path.join(ngoai5, 'tha.png'), path.join(ngoai5, 'ghi.txt'), path.join(ngoai5, 'v.mp4'), path.join(goc5, 'co-san.png'), path.join(goc5, 'Khung', 'trong.png'), path.join(ngoai5, 'khong-ton-tai.png'), 12345])
  kiem('nhapFile: chep png + mp4 vao thu muc anh; txt bi tu choi (loai); file da o goc khong chep lai; file trong thu muc con khong chep; file khong ton tai bi tu choi',
    r5.filter((q) => q.ok && q.ten).map((q) => q.ten).sort().join() === 'co-san.png,tha.png,v.mp4' && r5.find((q) => q.nguon.endsWith('ghi.txt')).loi === 'loai' && r5.filter((q) => q.daCo).length === 2 && r5.find((q) => q.nguon.endsWith('khong-ton-tai.png')).loi === 'mat' && !co(path.join(goc5, 'ghi.txt')),
    JSON.stringify(r5.map((q) => [q.ten, q.loi])))
  kiem('File goc o ngoai con nguyen (chep, khong dua di)', co(path.join(ngoai5, 'tha.png')) && fs.readFileSync(path.join(ngoai5, 'tha.png'), 'utf8') === 'tu-ngoai')
  const r5b = K.nhapFile(goc5, [path.join(ngoai5, 'tha.png')])
  kiem('Nhap lan hai cung ten -> ten moi "tha 2.png", khong de len file cu', r5b[0].ok && r5b[0].ten === 'tha 2.png' && fs.readFileSync(path.join(goc5, 'tha.png'), 'utf8') === 'tu-ngoai')
  const b = K.nhapBuf(goc5, 'anh dan.png', Buffer.from('bytes'))
  kiem('nhapBuf: anh dan tu clipboard thanh file moi, khong de len', b.ok && fs.readFileSync(path.join(goc5, b.ten), 'utf8') === 'bytes' && K.nhapBuf(goc5, 'anh dan.png', Buffer.from('lan 2')).ten !== b.ten)
  const n1 = K.nhanDoiAnh(goc5, 'co-san.png'), n2 = K.nhanDoiAnh(goc5, 'co-san.png')
  kiem('nhanDoiAnh: chep file that canh ban goc ("co-san (2).png", roi "(3)"), noi dung giong, ban goc con nguyen',
    n1.ok && n1.khoa === 'co-san (2).png' && n2.khoa === 'co-san (3).png' && fs.readFileSync(path.join(goc5, n1.khoa), 'utf8') === 'da-co' && fs.readFileSync(path.join(goc5, 'co-san.png'), 'utf8') === 'da-co')
  kiem('nhanDoiAnh tu choi ten co duong dan / khong ton tai / khong phai anh', K.nhanDoiAnh(goc5, '../x.png').ok === false && K.nhanDoiAnh(goc5, 'khong-co.png').loi === 'mat-goc' && K.nhanDoiAnh(goc5, 'x.txt').ok === false)
}

console.log('\n[9] Tong ket an toan')
kiem('Anh goc trong thu muc anh: ten + noi dung y nguyen tu dau toi cuoi bai', chupGoc() === GOC0)
kiem('Khong co dong loi la trong nhat ky (chi cac dong cua 2 doi chung so hong / khong doc duoc)', log.every((l) => /HONG|KHONG doc duoc/.test(l)), log.filter((l) => !/HONG|KHONG doc duoc/.test(l)).join(' | ').slice(0, 200))

fs.rmSync(TAM, { recursive: true, force: true })
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
