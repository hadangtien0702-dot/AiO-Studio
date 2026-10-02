'use strict'
/* Do SO VIDEO (src/kho-video.js) + day noi cua tinh nang QUAY VIDEO (01/10) — chay: npm run test:khovideo
   Khong bat cua so. Thu muc thu nam trong os.tmpdir() do bai nay tao va tu xoa (dung ten).
   02/10: them so hong / khoi phuc file quay do / doi chieu so voi dia (ECC soat nhom A). Phan "khay hien file quay do"
   chay Electron AN (scripts/test/khay-video-main.cjs) va can file mau .selftest/thu-quay/ (khong co thi bo qua, co in ra). */
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const doc = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }
const ngu = (ms) => { const het = Date.now() + ms; while (Date.now() < het) { /* cho id (theo mili giay) khac nhau */ } }

// ── [1] HANH VI cua so video ────────────────────────────────────────────
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-kho-video-'))
const kho = require(path.join(ROOT, 'src', 'kho-video.js'))
kiem('Chua khoiTao: them tra null, danhSach rong (khong nem loi)', kho.them({ file: 'x' }) === null && kho.danhSach().length === 0)
kho.khoiTao(tam)
const f1 = path.join(tam, 'a b & c.mp4'), f2 = path.join(tam, 'hai.mp4'), f3 = path.join(tam, 'ba.mp4')
for (const f of [f1, f2, f3]) fs.writeFileSync(f, 'x')
const m1 = kho.them({ file: f1, ms: 3210.6, w: 960, h: 540, tieng: 1, bytes: 12345 }); ngu(3)
const m2 = kho.them({ file: f2, ms: 500, w: 32, h: 22, tieng: false, bytes: 99 }); ngu(3)
const m3 = kho.them({ file: f3, ms: 60000, w: 2560, h: 1440, tieng: true, bytes: 5e6 })
kiem('them tra muc co id dung mau + du truong', !!m1 && kho.MAU_ID.test(m1.id) && m1.ms === 3211 && m1.tieng === true && m1.w === 960 && m1.bytes === 12345 && !!m1.taoLuc, JSON.stringify(m1))
kiem('3 lan them -> 3 id khac nhau', new Set([m1.id, m2.id, m3.id]).size === 3)
let ds = kho.danhSach()
kiem('danhSach: 3 muc, MOI NHAT truoc', ds.length === 3 && ds[0].id === m3.id && ds[2].id === m1.id, ds.map((x) => path.basename(x.file)).join(' > '))
kiem('Duong dan co dau cach + "&" giu nguyen', ds[2].file === f1)
fs.unlinkSync(f2)
ds = kho.danhSach()
kiem('File bi xoa ngoai app -> khay khong con hien muc do', ds.length === 2 && !ds.some((x) => x.id === m2.id))
kiem('tim() theo id', !!kho.tim(m1.id) && kho.tim(m1.id).file === f1 && kho.tim('vid-00000000-000000-000') === null)
kiem('tim()/bo() tu choi id sai mau (khong dung toi so)', kho.tim('../x') === null && kho.bo('../x') === false && kho.bo('') === false)
// 01/10 chon Co tieng / Khong tieng: sua() chi nhan 2 truong boTieng + fileKhongTieng, khong cho doi so do luc quay
const s1 = kho.sua(m1.id, { boTieng: 1, fileKhongTieng: f3, ms: 1, file: 'x', id: 'y' })
kiem('sua(): ghi boTieng + fileKhongTieng, KHONG doi ms / file / id', !!s1 && s1.boTieng === true && s1.fileKhongTieng === f3 && s1.ms === 3211 && s1.file === f1 && s1.id === m1.id && kho.tim(m1.id).boTieng === true, JSON.stringify(s1))
kiem('sua(): bat lai Co tieng giu nguyen duong dan ban khong tieng', kho.sua(m1.id, { boTieng: false }).fileKhongTieng === f3 && kho.tim(m1.id).boTieng === false)
kiem('sua(): id sai mau / id khong co -> null', kho.sua('../x', { boTieng: true }) === null && kho.sua('vid-00000000-000000-000', { boTieng: true }) === null)
kiem('bo() go dung 1 muc, KHONG xoa file', kho.bo(m1.id) === true && kho.danhSach().length === 1 && fs.existsSync(f1))
kiem('bo() lan 2 cung id -> false', kho.bo(m1.id) === false)
const fileSo = path.join(tam, 'video', 'danh-sach.json')
kiem('So ghi atomic: co danh-sach.json, khong con .tmp', fs.existsSync(fileSo) && !fs.existsSync(fileSo + '.tmp'))
/* ── 02/10 SO HONG KHONG DUOC LAM MAT VIDEO (ECC soat A1). Truoc do 3 muc o day KHOA CAI SAI: "so hong van them duoc
   muc moi (ghi de so hong)" — dung la kieu loi lam moi video cu bien khoi khay. ── */
const logKho = []
kho.khoiTao(tam, (s) => logKho.push(s))
const banHong = () => fs.readdirSync(path.dirname(fileSo)).filter((t) => /^danh-sach\.hong-\d{8}-\d{6}\.json$/.test(t))
fs.writeFileSync(fileSo, '{hong json')
kiem('So hong (JSON loi) -> danhSach rong, khong nem loi, CHUA dung vao file', kho.danhSach().length === 0 && fs.readFileSync(fileSo, 'utf8') === '{hong json')
const m4 = kho.them({ file: f3, ms: 1000, w: 10, h: 10, bytes: 1, loi: 1 })
const hong1 = banHong()
kiem('So hong + them: ban hong duoc CAT RIENG nguyen noi dung, so moi co muc moi', !!m4 && kho.danhSach().length === 1 && hong1.length === 1 && fs.readFileSync(path.join(path.dirname(fileSo), hong1[0]), 'utf8') === '{hong json', hong1.join(', '))
kiem('So hong: co ghi log "SO HONG"', logKho.some((s) => s.includes('SO HONG')))
kiem('them({ loi }) -> muc co loi = true; khong truyen thi khong co truong loi', m4.loi === true && kho.tim(m4.id).loi === true && !('loi' in m3))
// So KHONG doc duoc (gia lap: duong dan so la mot THU MUC -> doc ra loi khac "khong co file") => cam ghi de
const noiDungTruoc = fs.readFileSync(fileSo, 'utf8')
fs.renameSync(fileSo, fileSo + '.giu')
fs.mkdirSync(fileSo)
const soLog = logKho.length
kiem('So KHONG doc duoc: them / sua / bo deu tu choi, khong ghi de', kho.them({ file: f3, ms: 1 }) === null && kho.sua(m4.id, { boTieng: true }) === null && kho.bo(m4.id) === false && fs.statSync(fileSo).isDirectory() && !fs.existsSync(fileSo + '.tmp'))
kiem('So KHONG doc duoc: co ghi log "KHONG doc duoc so"', logKho.slice(soLog).some((s) => s.includes('KHONG doc duoc so')))
fs.rmdirSync(fileSo)
fs.renameSync(fileSo + '.giu', fileSo)
kiem('So doc lai duoc: du lieu con nguyen', fs.readFileSync(fileSo, 'utf8') === noiDungTruoc && kho.danhSach().length === 1)
fs.writeFileSync(fileSo, String.fromCharCode(0xFEFF) + noiDungTruoc)
kiem('So co BOM o dau van doc duoc (BOM tung lam cau-hinh.json ve mac dinh)', kho.danhSach().length === 1 && banHong().length === 1)
fs.writeFileSync(fileSo, JSON.stringify([{ id: 'la', file: f3 }, null, { id: m4.id }, 5]))
kiem('Muc rac trong so (id sai / thieu file / null) bi bo qua', kho.danhSach().length === 0)
// chotQuay: doi ten file tam + ghi so; 2 kieu hong phai tra ve ro, khong bao gio ghi file .tam vao so
fs.writeFileSync(fileSo, '[]')
const tamQuay = path.join(tam, 'q1.mp4.tam'), dichQuay = path.join(tam, 'q1.mp4')
fs.writeFileSync(tamQuay, 'du lieu')
const c1 = kho.chotQuay({ tam: tamQuay, file: dichQuay, ms: 2000, w: 4, h: 4, bytes: 7 })
kiem('chotQuay binh thuong: file doi ten, vao so, hong = null', c1.hong === null && !!c1.m && !fs.existsSync(tamQuay) && fs.existsSync(dichQuay) && kho.tim(c1.m.id).file === dichQuay)
const tam2 = path.join(tam, 'q2.mp4.tam'), dich2 = path.join(tam, 'q2.mp4')
fs.writeFileSync(tam2, 'du lieu'); fs.mkdirSync(dich2) // dich la THU MUC -> doi ten that bai
const c2 = kho.chotQuay({ tam: tam2, file: dich2, ms: 2000, bytes: 7 })
kiem('chotQuay doi ten that bai: hong = doi-ten, file .tam CON NGUYEN, KHONG vao so', c2.hong === 'doi-ten' && c2.m === null && c2.file === tam2 && fs.readFileSync(tam2, 'utf8') === 'du lieu' && !kho.danhSach().some((x) => /\.tam$/.test(x.file)) && kho.danhSach().length === 1)
const tam3 = path.join(tam, 'q3.mp4.tam'), dich3 = path.join(tam, 'q3.mp4')
fs.writeFileSync(tam3, 'du lieu')
fs.renameSync(fileSo, fileSo + '.giu'); fs.mkdirSync(fileSo)
const c3 = kho.chotQuay({ tam: tam3, file: dich3, ms: 2000, bytes: 7 })
fs.rmdirSync(fileSo); fs.renameSync(fileSo + '.giu', fileSo)
kiem('chotQuay ghi so that bai: hong = ghi-so, file video da doi ten va CON tren dia', c3.hong === 'ghi-so' && c3.m === null && c3.file === dich3 && fs.readFileSync(dich3, 'utf8') === 'du lieu')

/* ── 02/10 DOI CHIEU so voi dia (A1 / A5): video do app quay nam tren dia ma khong co trong so -> dua lai ── */
const ud2 = path.join(tam, 'ud2'), anh = path.join(tam, 'anh')
fs.mkdirSync(anh)
kho.khoiTao(ud2, (s) => logKho.push(s))
const so2 = path.join(ud2, 'video', 'danh-sach.json')
const v1 = path.join(anh, 'shotandsave-video-2026-10-01-102524-470.mp4')
const v2 = path.join(anh, 'shotandsave-video-2026-10-02-090000-001.webm')
const v3 = path.join(anh, 'shotandsave-video-2026-10-02-093000-500.mp4')
for (const f of [v1, v2, v3]) fs.writeFileSync(f, 'video')
for (const t of ['shotandsave-video-2026-10-01-102524-470-khong-tieng.mp4', 'video-cua-toi.mp4', 'shotandsave-2026-10-02-090000-001.png', 'shotandsave-video-2026-10-02-110000-000.mp4.tam']) fs.writeFileSync(path.join(anh, t), 'x')
fs.writeFileSync(path.join(anh, 'shotandsave-video-2026-10-02-100000-000.mp4'), '') // 0 byte: bo qua
kiem('doiChieu: thu muc chua co -> khong loi, khong them', JSON.stringify(kho.doiChieu(path.join(tam, 'khong-co'))) === '{"them":0,"loi":null}')
const co3 = kho.them({ file: v3, ms: 5000, w: 640, h: 360, tieng: true, bytes: 5 })
const dc1 = kho.doiChieu(anh, { coTieng: (f) => /102524/.test(f), biNgat: [v2] })
const e1 = kho.danhSach().find((x) => x.file === v1), e2 = kho.danhSach().find((x) => x.file === v2)
kiem('doiChieu: them dung 2 video thieu (bo qua ban khong-tieng, file ten la, anh, .tam, file 0 byte)', dc1.them === 2 && dc1.loi === null && kho.danhSach().length === 3, JSON.stringify(dc1))
kiem('doiChieu: muc them lai co id + gio lay tu TEN file, ms = w = h = 0, tieng theo ham doc file', !!e1 && e1.id === 'vid-20261001-102524-470' && new Date(e1.taoLuc).getTime() === new Date(2026, 9, 1, 10, 25, 24, 470).getTime() && e1.ms === 0 && e1.w === 0 && e1.tieng === true && e1.bytes === 5 && !e1.loi, JSON.stringify(e1))
kiem('doiChieu: file trong danh sach biNgat duoc danh dau loi = true', !!e2 && e2.loi === true && e2.tieng === false)
kiem('doiChieu: muc DA CO trong so giu nguyen so do luc quay', kho.tim(co3.id).ms === 5000 && kho.tim(co3.id).w === 640)
const truocLan2 = fs.readFileSync(so2, 'utf8')
kiem('doiChieu lan 2: khong them gi, khong ghi lai so', kho.doiChieu(anh).them === 0 && fs.readFileSync(so2, 'utf8') === truocLan2)
fs.writeFileSync(so2, 'rac')
const dc3 = kho.doiChieu(anh, {})
kiem('doiChieu khi so HONG: cat ban hong + dung lai du 3 video tu dia', dc3.them === 3 && kho.danhSach().length === 3 && fs.readdirSync(path.dirname(so2)).some((t) => /^danh-sach\.hong-/.test(t)), JSON.stringify(dc3))

/* ── 02/10 KHOI PHUC FILE QUAY DO (A2): app bi tat giua luc quay de lai shotandsave-video-*.mp4.tam ── */
const anh2 = path.join(tam, 'anh2')
fs.mkdirSync(anh2)
const dauMp4 = Buffer.concat([Buffer.from([0, 0, 0, 28]), Buffer.from('ftypisom', 'latin1'), Buffer.alloc(40, 1)])
const dauWebm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(40, 2)])
const T = (gio) => path.join(anh2, 'shotandsave-video-2026-10-02-' + gio + '-000.mp4.tam')
fs.writeFileSync(T('110000'), dauMp4)          // -> .mp4
fs.writeFileSync(T('110100'), dauWebm)         // -> .webm
fs.writeFileSync(T('110200'), '')              // 0 byte -> xoa
fs.writeFileSync(T('110300'), 'khong phai video dau nhe') // de nguyen
fs.writeFileSync(T('110400'), dauMp4)          // se LON LEN giua chung -> de nguyen
fs.writeFileSync(T('110500'), dauMp4)          // luot DANG quay (boQua) -> de nguyen
fs.writeFileSync(T('110600'), dauMp4)          // da co file dich -> de nguyen
fs.writeFileSync(T('110600').slice(0, -4), 'da co san')
fs.writeFileSync(path.join(anh2, 'cua-nguoi-dung.mp4.tam'), dauMp4) // khong dung mau ten -> khong bao gio dung toi
const ung = kho.timTam(anh2)
kiem('timTam: thay dung 7 file quay do theo mau ten (bo qua file ten la)', ung.length === 7 && !ung.some((u) => /cua-nguoi-dung/.test(u.file)), String(ung.length))
fs.appendFileSync(T('110400'), 'them 1 khuc')
const kp = kho.khoiPhucTam(ung, T('110500'))
const con = (f) => fs.existsSync(f)
kiem('khoiPhucTam: MP4 -> doi thanh .mp4, WebM -> doi thanh .webm', kp.doi.length === 2 && con(T('110000').slice(0, -4)) && !con(T('110000')) && con(T('110100').slice(0, -8) + '.webm') && !con(T('110100')), kp.doi.map((f) => path.basename(f)).join(', '))
kiem('khoiPhucTam: file 0 byte bi xoa', kp.bo.length === 1 && !con(T('110200')))
kiem('khoiPhucTam: KHONG dung vao file khong phai video / dang lon len / da co file dich', kp.loi.length === 3 && con(T('110300')) && con(T('110400')) && con(T('110600')) && fs.readFileSync(T('110600').slice(0, -4), 'utf8') === 'da co san', kp.loi.join(' | '))
kiem('khoiPhucTam: KHONG dung vao file cua luot dang quay + file ten la', con(T('110500')) && con(path.join(anh2, 'cua-nguoi-dung.mp4.tam')))
kiem('khoiPhucTam: noi dung file sau doi ten giu nguyen tung byte', fs.readFileSync(T('110000').slice(0, -4)).equals(dauMp4))
const dc4 = kho.doiChieu(anh2, { biNgat: kp.doi })
const ngat = kho.danhSach().filter((x) => x.loi)
kiem('Sau khoi phuc: 2 doan quay do vao so, danh dau "Bi ngat"; file co san vao so KHONG danh dau', dc4.them === 3 && ngat.length === 2 && ngat.every((x) => kp.doi.includes(x.file)), JSON.stringify(dc4))

/* ── coDuongTieng: doc hop moov cua file MP4 that (file mau trong .selftest, khong co thi bo qua) ── */
const { coDuongTieng, taoBanKhongTieng } = require(path.join(ROOT, 'src', 'mp4-bo-tieng.js'))
const mauTieng = path.join(ROOT, '.selftest', 'thu-quay', 'mau-quay-thu-720p-co-tieng.mp4')
const cut = path.join(tam, 'shotandsave-video-2026-10-02-120000-000.mp4')
let coMau = fs.existsSync(mauTieng)
if (coMau) {
  const goc = fs.readFileSync(mauTieng)
  fs.writeFileSync(cut, goc.subarray(0, Math.floor(goc.length * 0.6))) // cut giua chung nhu file quay do
  const kt = path.join(tam, 'khong-tieng.mp4')
  const r = taoBanKhongTieng(mauTieng, kt)
  kiem('coDuongTieng: file mau co tieng = true; ban khong tieng = false; file chu = false', coDuongTieng(mauTieng) === true && r.ok && coDuongTieng(kt) === false && coDuongTieng(fileSo) === false && coDuongTieng(path.join(tam, 'khong-co.mp4')) === false)
  kiem('coDuongTieng: file bi CUT 40% cuoi (quay do) van doc ra co tieng', coDuongTieng(cut) === true)
} else kq.push('  BO QUA coDuongTieng + khay hien file quay do: khong co file mau ' + mauTieng)

/* ── 02/10 (A4) doi ngon ngu KHONG nap lai cua so quay: chay chinh ham duocNapLai lay tu main.js ── */
const mainJs = doc('src', 'main.js')
const hamNap = (/function duocNapLai\(url\) \{[^\n]*\}/.exec(mainJs) || [])[0]
const duocNapLai = hamNap ? new Function(hamNap + '; return duocNapLai')() : null
const goc = 'file:///C:/Users/x/AppData/Local/Programs/aio-shot-and-save/resources/app.asar/src/'
kiem('duocNapLai: KHONG nap lai cua so luong (bo quay) / dem (dong ho, vien quay) / dien (san dien)', !!duocNapLai && ['luong/index.html', 'dem/quay.html', 'dem/vien.html', 'dem/index.html', 'dien/index.html'].every((t) => duocNapLai(goc + t) === false))
kiem('duocNapLai: cac cua so co chu van nap lai (khay, cai dat, khay gop, ghim, man chup, nut tron)', !!duocNapLai && ['shelf/index.html', 'settings/index.html', 'khay/index.html?tab=video', 'pin/index.html', 'overlay/index.html', 'nut/index.html'].every((t) => duocNapLai(goc + t) === true) && duocNapLai('file:///D:/luong-cua-toi/src/shelf/index.html') === true)
kiem('Lenh doi ngon ngu DUNG ham do (khong con nap lai moi cua so)', /if \(!w\.isDestroyed\(\) && duocNapLai\(w\.webContents\.getURL\(\)\)\) w\.webContents\.reload\(\)/.test(mainJs) && !/if \(!w\.isDestroyed\(\)\) w\.webContents\.reload\(\)/.test(mainJs))
kiem('ketThucGhiHinh di qua chotQuay, bao nguoi dung o ca 2 kieu hong + khi luot quay bi ngat', /khoVideo\.chotQuay\(\{[^}]*loi: !!loiQuay \}\)/.test(mainJs) && /if \(c\.hong\) \{ baoVideo\('quay\.ngoaiKhay', c\.file\); return \}/.test(mainJs) && /if \(loiQuay\) baoVideo\('quay\.biNgat', null\)/.test(mainJs) && !/file = g\.tam/.test(mainJs))

/* ── 02/10 KHAY hien file quay do (Electron an, khong hien cua so): file bi cut van PHAT duoc, co nhan "Bi ngat" ── */
if (coMau) {
  const { spawnSync } = require('child_process')
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE
  const r = spawnSync(require('electron'), [path.join(ROOT, 'scripts', 'test', 'khay-video-main.cjs'), tam, mauTieng, cut], { env, encoding: 'utf8', timeout: 60000 })
  const dong = (r.stdout || '').split('\n').find((l) => l.startsWith('KQ='))
  if (!dong) kiem('Khay video (Electron an) chay duoc', false, ((r.stdout || '') + (r.stderr || '')).split('\n').filter((l) => /LOI=|Error/.test(l)).slice(0, 2).join(' | ') || 'ma thoat ' + r.status)
  else {
    const k = JSON.parse(dong.slice(3)), a = k.hang[0], b = k.hang[1]
    kiem('Khay: 2 hang, chi hang quay do co nhan "Bi ngat" + goi y', k.hang.length === 2 && a.nhan === null && b.nhan === 'Bị ngắt' && /thiếu phần cuối/.test(b.goiY || ''), JSON.stringify([a.nhan, b.nhan]))
    kiem('Khay: file bi CUT van mo duoc, co hinh, khong loi trinh phat', b.loiPhat === null && b.san >= 2 && b.rong > 0 && b.cao > 0, 'readyState ' + b.san + ', ' + b.rong + 'x' + b.cao + ', loi ' + b.loiPhat)
    kiem('Khay: muc khong co so do -> dong thong tin tu lay co that tu video, khong ghi "0×0"', new RegExp(b.rong + '×' + b.cao).test(b.meta) && !/0×0/.test(b.meta), b.meta)
    kiem('Khay: muc khong co thoi luong -> an nhan hoac hien thoi luong that (khong ghi "0:01" bua)', b.gioAn === true || (b.thoiLuong > 0 && b.gio !== '0:01'), 'an ' + b.gioAn + ', nhan ' + b.gio + ', duration ' + b.thoiLuong)
    kiem('Khay: hang binh thuong giu nguyen (thoi luong 0:03, co ' + a.rong + '×' + a.cao + ')', a.gio === '0:03' && a.gioAn === false && a.loiPhat === null && /640×360/.test(a.meta), a.gio + ' | ' + a.meta)
    kiem('Khay: khong co loi trong trang', k.loiTrang.length === 0, k.loiTrang.join(' | ').slice(0, 200))
  }
}
fs.rmSync(tam, { recursive: true, force: true })

// ── [2] DAY NOI: preload goi kenh nao thi main phai nghe kenh do ─────────
const main = doc('src', 'main.js') + '\n' + doc('src', 'luong-chup.js')
const nghe = new Set([...main.matchAll(/ipcMain\.(?:on|handle)\('([^']+)'/g)].map((m) => m[1]))
// main gui xuong trang bang 2 kieu: win.webContents.send(...) va e.sender.send(...) (lan dau chi do kieu 1 -> bao oan
// 'shelf:removed' / 'shelf:cleared' la khong ai gui)
const gui = new Set([...main.matchAll(/(?:webContents|sender)\.send\('([^']+)'/g)].map((m) => m[1]))
for (const pre of ['preload-video.js', 'preload-dem.js', 'preload-luong.js', 'preload-shelf.js']) {
  const s = doc('src', pre)
  const goi = [...new Set([...s.matchAll(/ipcRenderer\.(?:send|sendSync|invoke)\('([^']+)'/g)].map((m) => m[1]))]
  const thieu = goi.filter((k) => !nghe.has(k))
  kiem(pre + ': ' + goi.length + ' kenh goi len main deu co nguoi nghe', goi.length > 0 && thieu.length === 0, thieu.length ? 'THIEU: ' + thieu.join(', ') : '')
  const nhan = [...new Set([...s.matchAll(/ipcRenderer\.on\('([^']+)'/g)].map((m) => m[1]))]
  const thieu2 = nhan.filter((k) => !gui.has(k))
  kiem(pre + ': ' + nhan.length + ' kenh nhan tu main deu co nguoi gui', thieu2.length === 0, thieu2.length ? 'THIEU: ' + thieu2.join(', ') : '')
}
// Trang goi ham nao cua cau noi thi preload phai mo ham do
const cau = (pre, ten) => { const s = doc('src', pre); const i = s.indexOf("exposeInMainWorld('" + ten + "'"); return new Set([...s.slice(i).matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1])) }
for (const [trang, pre, ten] of [[['video', 'video.js'], 'preload-video.js', 'video'], [['dem', 'quay.js'], 'preload-dem.js', 'dem'], [['luong', 'luong.js'], 'preload-luong.js', 'luong'], [['shelf', 'shelf.js'], 'preload-shelf.js', 'shelf']]) {
  const co = cau(pre, ten)
  const dung = [...new Set([...doc('src', ...trang).matchAll(new RegExp('window\\.' + ten + '\\.(\\w+)', 'g'))].map((m) => m[1]))]
  const thieu = dung.filter((f) => !co.has(f))
  kiem(trang.join('/') + ' goi ' + dung.length + ' ham window.' + ten + '.* - preload deu mo', dung.length > 0 && thieu.length === 0, thieu.length ? 'THIEU: ' + thieu.join(', ') : '')
}
// main goi ham nao cua kho / khoVideo / luong thi module phai export ham do
for (const [bien, file] of [['kho', 'kho.js'], ['khoVideo', 'kho-video.js'], ['luong', 'luong-chup.js']]) {
  const exp = new Set(((doc('src', file).match(/module\.exports\s*=\s*\{([\s\S]*?)\}/) || [])[1] || '').split(/[\s,]+/).filter(Boolean))
  const goi = [...new Set([...doc('src', 'main.js').matchAll(new RegExp('\\b' + bien + '\\.([A-Za-z_]\\w*)\\s*\\(', 'g'))].map((m) => m[1]))]
  const thieu = goi.filter((f) => !exp.has(f))
  kiem('main.js goi ' + goi.length + ' ham ' + bien + '.* - deu duoc export', goi.length > 0 && thieu.length === 0, thieu.length ? 'THIEU: ' + thieu.join(', ') : '')
}

// ── [3] CHU: moi khoa dung toi phai co du VI + EN, khong gach ngang dai ──
const { DICH } = require(path.join(ROOT, 'src', 'i18n.js'))
const khoa = new Set()
for (const p of [['video', 'video.js'], ['overlay', 'overlay.js']]) for (const m of doc('src', ...p).matchAll(/\bt\(\s*(?:\w+\s*\?\s*)?'((?:vd|overlay\.quay)[\w.]*)'(?:\s*:\s*'((?:vd|overlay\.quay)[\w.]*)')?/g)) { khoa.add(m[1]); if (m[2]) khoa.add(m[2]) }
for (const p of [['khay', 'index.html'], ['overlay', 'index.html'], ['shelf', 'index.html']]) for (const m of doc('src', ...p).matchAll(/data-i18n(?:-title)?="((?:vd\.|overlay\.quay|khay\.video)[\w.]*)"/g)) khoa.add(m[1])
for (const m of doc('src', 'main.js').matchAll(/T\('((?:quay|tray\.video|tray\.dungQuay|app\.khongQuay)[\w.]*)'\)/g)) khoa.add(m[1])
const ds2 = [...khoa]
const thieuVi = ds2.filter((k) => !(k in DICH.vi)), thieuEn = ds2.filter((k) => !(k in DICH.en))
kiem(ds2.length + ' khoa chu cua tinh nang quay deu co VI', ds2.length >= 20 && thieuVi.length === 0, thieuVi.join(', '))
kiem(ds2.length + ' khoa chu cua tinh nang quay deu co EN', thieuEn.length === 0, thieuEn.join(', '))
const gach = ds2.filter((k) => /[—–]/.test((DICH.vi[k] || '') + (DICH.en[k] || '')))
kiem('Khong dung gach ngang dai trong chu nguoi dung thay', gach.length === 0, gach.join(', '))
const tham = (s) => (s.match(/\{\w+\}/g) || []).sort().join()
const lechThamSo = ds2.filter((k) => tham(DICH.vi[k] || '') !== tham(DICH.en[k] || ''))
kiem('Tham so {..} trong chuoi VI va EN khop nhau', lechThamSo.length === 0, lechThamSo.join(', '))

// ── [4] GIAO DIEN: khay video dung chung khuon khay Storyboard, khong tu khai token ──
const css = doc('src', 'video', 'video.css')
const token = new Set([...doc('assets', 'tokens.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))
const tuKhai = [...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])
const dungToi = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
kiem('video.css KHONG tu khai token rieng', tuKhai.length === 0, tuKhai.join(', '))
kiem('video.css dung ' + dungToi.length + ' token - deu co trong tokens.css', dungToi.length >= 5 && dungToi.every((v) => token.has(v)), dungToi.filter((v) => !token.has(v)).join(', '))
const html = doc('src', 'khay', 'index.html')
kiem('Khay video nap tokens.css + storyboard.css (cung khuon man Cai dat) + video.css', html.includes('../../assets/tokens.css') && html.includes('../storyboard/storyboard.css') && html.includes('video.css'))
kiem('CSP khay video cho phep phat file:// va KHONG mo mang', /media-src file:/.test(html) && /default-src 'none'/.test(html) && !/https?:/.test(html.replace(/<!--[\s\S]*?-->/g, '')))
const emoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
const coEmoji = [['khay', 'index.html'], ['video', 'video.js'], ['video', 'video.css'], ['dem', 'quay.html'], ['dem', 'quay.js']].filter((p) => emoji.test(doc('src', ...p)))
kiem('Khong emoji trong giao dien moi', coEmoji.length === 0, coEmoji.map((p) => p.join('/')).join(', '))

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log('Ket qua: ' + (dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'))
if (!dat) process.exit(1)
