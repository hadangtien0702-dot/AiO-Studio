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

console.log('\n[9] Tong ket an toan')
kiem('Anh goc trong thu muc anh: ten + noi dung y nguyen tu dau toi cuoi bai', chupGoc() === GOC0)
kiem('Khong co dong loi la trong nhat ky (chi cac dong cua 2 doi chung so hong / khong doc duoc)', log.every((l) => /HONG|KHONG doc duoc/.test(l)), log.filter((l) => !/HONG|KHONG doc duoc/.test(l)).join(' | ').slice(0, 200))

fs.rmSync(TAM, { recursive: true, force: true })
console.log('\n' + '='.repeat(60) + '\nKet qua: ' + (truot ? 'CO ' + truot + ' MUC TRUOT (FAIL)' : 'TAT CA DAT (PASS)'))
process.exit(truot ? 1 : 0)
