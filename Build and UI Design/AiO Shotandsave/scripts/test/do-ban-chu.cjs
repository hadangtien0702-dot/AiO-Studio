'use strict'
/* Bai do BAN CHU (13/11) — chay bang: npm run test:banchu   (Node thuan, khong Electron, khong cua so)
   Gac hai dieu: (1) may chu chup khong can ma CHI khi ban dong goi mang dau van tay cua dung may do;
   (2) ma nguon + lenh dong goi phat hanh KHONG co gi bo khoa (khach mua van phai nhap ma).
   Khong do duoc o day: ban dong goi that co mang truong aioBanChu khong -> script cai-tai-cho.mjs --ban-chu tu kiem bang dong
   "ban-chu: may nay la may chu" trong run-log that sau khi nap. */
const fs = require('fs')
const path = require('path')
const ROOT = path.resolve(__dirname, '..', '..')
const { maMay, laBanChu } = require(path.join(ROOT, 'src', 'ban-chu.js'))
let dat = 0, tong = 0
const kiem = (ten, ok, ct) => { tong++; if (ok) dat++; console.log((ok ? '  DAT   ' : '  TRUOT ') + ten + (ct ? ' (' + ct + ')' : '')) }
const mayGia = (ten, nguoi) => ({ hostname: () => ten, userInfo: () => ({ username: nguoi }), homedir: () => 'C:/Users/' + nguoi, platform: () => 'win32', arch: () => 'x64' })

console.log('== 1. Dau van tay may ==')
const A = mayGia('MAY-A', 'tien'), B = mayGia('MAY-B', 'tien'), A2 = mayGia('MAY-A', 'khach')
kiem('dau van tay 32 ky tu hex, on dinh giua hai lan goi', /^[0-9a-f]{32}$/.test(maMay(A)) && maMay(A) === maMay(A))
kiem('may khac ten -> dau van tay khac', maMay(A) !== maMay(B))
kiem('cung ten may, khac tai khoan Windows -> dau van tay khac', maMay(A) !== maMay(A2))
kiem('userInfo nem loi khong lam vang', (() => { try { return /^[0-9a-f]{32}$/.test(maMay(Object.assign({}, A, { userInfo: () => { throw new Error('x') } }))) } catch (e) { return false } })())

console.log('\n== 2. Khi nao app coi la may chu ==')
kiem('goi mang dau van tay cua DUNG may dang chay -> la may chu', laBanChu({ aioBanChu: maMay(A) }, A) === true)
kiem('DOI CHUNG: chep ban do sang may khac -> KHONG phai may chu (van hoi ma)', laBanChu({ aioBanChu: maMay(A) }, B) === false)
kiem('goi khong co truong aioBanChu (bo cai ban cho khach) -> khong phai may chu', laBanChu({ name: 'aio-shot-and-save' }, A) === false && laBanChu(null, A) === false && laBanChu(undefined, A) === false)
kiem('gia tri la true / 1 / chuoi rong / chuoi sai do dai -> khong phai may chu', [true, 1, '', 'x', maMay(A).slice(0, 31), maMay(A) + '0'].every((v) => laBanChu({ aioBanChu: v }, A) === false))

console.log('\n== 3. Ma nguon va lenh phat hanh khong co gi bo khoa ==')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
kiem('package.json cua repo KHONG co truong aioBanChu', !('aioBanChu' in pkg) && !JSON.stringify(pkg.build || {}).includes('aioBanChu'))
const lenhPhatHanh = Object.entries(pkg.scripts).filter(([k]) => /^dist/.test(k))
kiem('lenh dong goi phat hanh (dist, dist:mac) khong them aioBanChu / extraMetadata', lenhPhatHanh.length >= 2 && lenhPhatHanh.every(([, v]) => !/aioBanChu|extraMetadata/.test(v)), lenhPhatHanh.map(([k]) => k).join(', '))
const wfDir = path.resolve(ROOT, '..', '..', '.github', 'workflows')
const wf = fs.existsSync(wfDir) ? fs.readdirSync(wfDir).map((f) => fs.readFileSync(path.join(wfDir, f), 'utf8')).join('\n') : ''
kiem('quy trinh dung tren GitHub khong nhac toi aioBanChu / --ban-chu', !/aioBanChu|--ban-chu/.test(wf), fs.existsSync(wfDir) ? 'da doc ' + fs.readdirSync(wfDir).length + ' file' : 'khong co thu muc workflows')
const mainJs = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')
kiem('main.js: BAN_CHU chi bat o ban DONG GOI va chi qua laBanChu(package.json)', mainJs.includes("const BAN_CHU = app.isPackaged && require('./ban-chu').laBanChu(require('../package.json'))"))
kiem('main.js: khoa chup xet BAN_CHU; kiem quyen man hinh macOS KHONG bi bo qua theo BAN_CHU', mainJs.includes('if (bq && !BO_QUA_BAN_QUYEN && !BAN_CHU && !bq.trangThai().choPhepChup) {') && mainJs.includes('if (!BO_QUA_BAN_QUYEN && kiemQuyen.chanTruocKhiChup()) return'))
kiem('main.js: BAN_CHU chi xuat hien o 4 cho da biet (khai bao, khoa chup, dong menu khay, dong nhat ky)', (mainJs.match(/\bBAN_CHU\b/g) || []).length === 4, (mainJs.match(/\bBAN_CHU\b/g) || []).length + ' cho')
const script = fs.readFileSync(path.join(ROOT, 'scripts', 'cai-tai-cho.mjs'), 'utf8')
kiem('cai-tai-cho.mjs: chi them dau van tay khi co co --ban-chu', script.includes("(BAN_CHU ? ' -c.extraMetadata.aioBanChu=' + banChu.maMay() : '')") && script.includes("process.argv.includes('--ban-chu')"))

console.log('\nTONG: ' + dat + '/' + tong + ' DAT')
process.exit(dat === tong ? 0 : 1)
