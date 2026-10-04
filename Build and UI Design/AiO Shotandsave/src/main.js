'use strict'

/* =========================================================================
   AiO Shot & Save — tien trinh chinh (main process)
   -------------------------------------------------------------------------
   v0.1.0 — CHI hai viec: (1) chup vung chon, (2) ghim noi sticky len man hinh.
   Luu thu muc + keo-tha ra app khac => ban sau.

   Luong chup:
     phim tat / bam tray
       -> grab anh full-res cua man hinh DANG co con tro (truoc khi hien overlay)
       -> mo overlay opaque phu kin man hinh do, ve lai anh dong bang
       -> nguoi dung keo chon vung -> tha
       -> crop anh goc -> tao cua so GHIM dung tai cho, alwaysOnTop
   ========================================================================= */

const {
  app, BrowserWindow, Tray, Menu, globalShortcut,
  ipcMain, screen, desktopCapturer, nativeImage, clipboard, shell, dialog,
  Notification, protocol, net, systemPreferences,
} = require('electron')
const path = require('path')
const fs = require('fs')
const kho = require('./kho')
const luong = require('./luong-chup') // 0.5.0: luong chup chay san
const i18n = require('./i18n')
const { taoKhayThu, giayHopLe } = require('./khay-thu') // 01/10: khay tu thu ve nut tron o goc
const { tinhVienQuay, giao: giaoHCN } = require('./vien-quay') // 29/09: vien quay 3 giay nam NGOAI vung
const khoDai = require('./kho-dai') // 29/09: dai Storyboard GIU LAI sau khi tat app, tach khoi khay anh thuong
const khoVideo = require('./kho-video') // 01/10: so ghi cac doan QUAY VIDEO (file MP4 nam trong thu muc anh)
const { taoBanKhongTieng, coDuongTieng } = require('./mp4-bo-tieng') // 01/10: ban Khong tieng cua video da quay (khong can FFmpeg)
const { pathToFileURL } = require('url')
const ocr = require('./ocr') // 29/09: doc chu trong vung khoanh (phim 5) bang bo doc CO SAN cua Windows / macOS
const os = require('os')
const { taoKiemQuyen } = require('./quyen-man-hinh') // 04/10: macOS thieu quyen Ghi man hinh -> hop thoai ro rang
const { taoMucKhay, anhMucKhay, apDungSuaVaoKhay } = require('./khay-muc') // 04/10: khay chi giu anh nho, khong giu anh goc
const { taoBanQuyen, taoKhoFile } = require('./banquyen') // 24/09: dung thu 14 ngay + ma Polar (xem dau src/banquyen.js)

/* ☠️ CHUP DUOC VIDEO DANG PHAT (vap 26/08 — anh Tien chup reference video/hinh).
   Video tang toc phan cung nam o lop OVERLAY ma bo chup cu (Desktop Duplication
   API) doc KHONG THAY -> vung video ra khung TRANG (giao dien tinh van chup duoc,
   nen loi tuong "thi thoang"). Ep Chromium dung WGC (Windows Graphics Capture) —
   bo chup moi nay CO doc lop overlay video. Phai goi TRUOC khi app ready.
   Windows 11 (>=22H2) khong con vien vang WGC. */
app.commandLine.appendSwitch(
  'enable-features',
  'AllowWgcScreenCapturer,AllowWgcWindowCapturer,AllowWgcZeroHz'
)

/* ☠️ 02/10 KHONG TAT co che "tinh cua so bi che" cua Chromium (CalculateNativeWinOcclusion) — da thu va SAI HUONG.
   10:44 em tat no vi run-log bao trang khay `an 1` moi khi anh dung Premiere, tuong Chromium tinh nham. Sau khi tat: log bao
   `an 0`, man trap du 24 khung (8/8 lan) NHUNG anh van thay khay "bi an o duoi" -> Chromium bao DUNG: cua so khay nam DUOI cua
   so cua Premiere that (khay-thu.js hien khay ma khong dua len tren). Tat co che do chi bit mat cai bao, khay van khuat.
   Sua goc o src/khay-thu.js `hien(khay, true)`. De co che nay BAT de so `an` trong dong `khay bung` con noi that: an 1 = khay
   dang bi cua so khac che. AIO_OCCLUSION=0 = tat (chi de doi chung). */
if (process.env.AIO_OCCLUSION === '0') app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

/* ☠️ ANH DONG BANG DI QUA aioshot:// CHU KHONG QUA IPC (may nha anh Tien 31/08
   "van giat y chang" du may cong ty da DAT): man 5120x2160 -> PNG base64
   ~15-25MB, gui 'overlay:frozen' la renderer DANG VE KHUNG THEO CHUOT phai
   nuot chuoi do tren main thread cua no -> nghen mot nhip = giat. Log that
   6/6 luot: drag-start roi dung 20-40ms sau grab-xong (bam chuot khi grab con
   chay, frozen do xuong giua luc keo). Man cong ty nho -> chuoi nho -> "het",
   ve nha man 5K2K -> y chang. Nay main giu buffer PNG, phuc vu qua protocol;
   IPC chi mang URL vai chuc byte, nap/decode anh chay o luong rieng cua
   Chromium. corsEnabled + ACAO de canvas ghep shape/vat-man KHONG bi taint
   (da do bang harness taint 31/08). Phai goi TRUOC app ready. */
protocol.registerSchemesAsPrivileged([
  { scheme: 'aioshot', privileges: { corsEnabled: true, supportFetchAPI: true, stream: true } },
])
const frozenStore = new Map() // 'gen/displayId' -> Buffer JPEG q92 (nen ANH DONG BANG chi de NHIN)
/* 'gen/displayId' -> NativeImage GOC (khong nen). 14/09 anh Tien: video Facebook den
   ~1,6s moi thay hinh. Do: toPNG 4K = 642ms/man tren luong chinh (getSources chi 420ms),
   toJPEG(92) = 37ms. Nen nen dong bang di JPEG (nhin), con anh co shape / vat 2 man thi
   luc bam Xong renderer xin cat DUNG VUNG tu anh goc qua aioshot://raw/... (PNG, vung
   nho -> vai chuc ms) -> file luu van lossless nhu truoc. */
const rawStore = new Map()
let grabGen = 0

const IS_DEV = process.argv.includes('--dev')
const IS_SELFTEST = process.argv.includes('--selftest')
const IS_DRAGTEST = process.argv.includes('--selftest-drag')
// --selftest-shelf [--khay=doc|ngang]: mo khay voi anh that (chi DOC tu 'Anh chup'),
// mo cong CDP 9333 de scripts/test/do-cuon-khay.mjs do muot; tu thoat sau 90s.
const IS_SHELFTEST = process.argv.includes('--selftest-shelf')
if (IS_SHELFTEST) app.commandLine.appendSwitch('remote-debugging-port', '9333')
/* [do] AIO_CDP=1: mo cong CDP 9333 ca khi --selftest (harness do-mo-dan.mjs quay overlay). */
if (process.env.AIO_CDP === '1') app.commandLine.appendSwitch('remote-debugging-port', '9333')
/* AIO_GRAB_TRE: ms cho tu luc overlay hien toi luc bat dau grab. Mac dinh 200 (0.4.9).
   ☠️ 14/09 anh Tien: "man toi di giat tu tu". Do bang screencast CDP (do-mo-dan.mjs,
   moc compositor dong dau): grab bat dau sau 40ms -> lop mo #dim (fade 150ms) chi ve
   duoc 3 khung roi DUNG 1.080ms (getSources + nen PNG 3,9MB chan) -> toi theo nac.
   Cho 200ms (fade xong + 3 khung du) -> 8 khung/102ms, muot. Doi lai: anh dong bang
   cu hon ~160ms. KHONG ha xuong duoi 170ms. */
const GRAB_TRE_MS = Number(process.env.AIO_GRAB_TRE) > 0 ? Number(process.env.AIO_GRAB_TRE) : 200

/* ☠️ Selftest phai CACH LY userData (vap 31/08 may nha): ban cai dang chay
   giu khoa single-instance (khoa theo userData) -> selftest boot xong TU THOAT
   (khong capture nao chay ma exit van 0 = XANH GIA, so #6), con ban cai thi
   nhan 'second-instance' -> BUNG overlay chup ngay tren man nguoi dung. */
if (IS_SELFTEST || IS_DRAGTEST || IS_SHELFTEST) {
  app.setPath('userData', path.join(__dirname, '..', '.selftest', 'userData'))
}
// [do] AIO_USERDATA=<thu muc>: chay ban nguon SONG SONG voi ban cai (khoa single-instance theo userData) de do CPU/GPU nam nen (0.5.0).
else if (process.env.AIO_USERDATA) app.setPath('userData', process.env.AIO_USERDATA)
// [do 29/09] --thu-ocr <anh> <ra.json>: doc chu 1 anh bang CA 2 cach roi THOAT. Khong cua so, khong tray, userData rieng
// (khoa single-instance rieng -> KHONG danh thuc ban dang chay, so loi #12). De do BAN DONG GOI (tesseract asarUnpack).
const iThuOcr = process.argv.indexOf('--thu-ocr')
const THU_OCR = iThuOcr > 0 ? { anh: process.argv[iThuOcr + 1], ra: process.argv[iThuOcr + 2] } : null
if (THU_OCR) app.setPath('userData', path.join(require('os').tmpdir(), 'aio-thu-ocr'))
async function thuOcr() {
  const kq = { ban: app.getVersion(), dongGoi: app.isPackaged }
  try {
    const buf = fs.readFileSync(THU_OCR.anh)
    for (const cach of ['tesseract', 'tesseract', 'he-thong', 'he-thong']) {
      const r = await ocr.docChu(buf, cach)
      kq[cach] = (kq[cach] || []).concat({ ok: r.ok, ms: r.ms, soDong: (r.dong || []).length, loi: r.loi || null, dong: r.dong })
    }
  } catch (e) { kq.loi = e.message }
  try { fs.writeFileSync(THU_OCR.ra, JSON.stringify(kq, null, 1)) } catch (e) {}
  ocr.tatHost()
  app.exit(0)
}
/* [do 01/10] --thu-quay <ra.json> [--tieng]: QUAY THU ~3 giay vung giua man chinh bang DUNG duong that cua app
   (batDauGhiHinh -> vien cam + dong ho -> bam nut Dung -> file MP4 -> so video -> Khay video) roi ghi ket qua + THOAT.
   Khong tray, khong phim tat, userData rieng (khoa single-instance rieng -> khong danh thuc ban dang chay).
   ☠️ CO hien vien cam + dong ho + Khay video len man hinh ~6 giay -> anh dang ngoi may thi HOI TRUOC (so loi #12).
   Chay qua scripts/test/do-quay-app.mjs (no dat thu muc luu rieng trong .selftest, khong dung toi anh cua nguoi dung). */
const iThuQuay = process.argv.indexOf('--thu-quay')
const THU_QUAY = iThuQuay > 0 ? { ra: process.argv[iThuQuay + 1], tieng: process.argv.includes('--tieng') } : null
if (THU_QUAY) app.setPath('userData', process.env.AIO_USERDATA || path.join(require('os').tmpdir(), 'aio-thu-quay'))
async function thuQuay() {
  const kq = { ban: app.getVersion(), dongGoi: app.isPackaged, xinTieng: THU_QUAY.tieng }
  const doi = async (dk, ms) => { const han = Date.now() + ms; while (!dk() && Date.now() < han) await cho(100); return dk() }
  const js = (w, code) => w.webContents.executeJavaScript(code).catch((e) => 'LOI: ' + e.message)
  try {
    khoVideo.khoiTao(app.getPath('userData'), ghiLog)
    lang = kho.docCauHinh().lang || 'vi'
    kq.thuMucLuu = kho.thuMucAnh()
    await luong.khoiDong({ ghiLog })
    kq.luongSanSang = await doi(() => luong.sanSang(), 15000)
    const d = screen.getPrimaryDisplay()
    const W = 640, H = 360
    const rect = { x: Math.round((d.bounds.width - W) / 2), y: Math.round((d.bounds.height - H) / 2), w: W, h: H }
    kq.man = { bounds: d.bounds, sf: d.scaleFactor }
    kq.rect = rect
    await batDauGhiHinh(d, rect, THU_QUAY.tieng)
    kq.dangQuay = !!ghiHinh
    kq.luot = ghiHinh ? { w: ghiHinh.w, h: ghiHinh.h, tieng: ghiHinh.tieng, coThuoc: ghiHinh.vien.coThuoc, tam: ghiHinh.tam } : null
    await cho(process.argv.includes('--tu-dung') ? 600 : 2600)
    // Cua so dang hien quanh vung: KHONG cai nao duoc cham vung dang quay
    const vung = { x: d.bounds.x + rect.x, y: d.bounds.y + rect.y, width: W, height: H }
    kq.cuaSo = BrowserWindow.getAllWindows().filter((w) => w.isVisible()).map((w) => {
      const b = w.getBounds()
      return { url: w.webContents.getURL().split('/src/')[1] || '?', b, chamVung: !!giaoHCN(b, vung) }
    })
    const thuoc = BrowserWindow.getAllWindows().find((w) => /dem\/quay\.html/.test(w.webContents.getURL()))
    if (process.argv.includes('--tu-dung')) kq.dongHo = 'tu-dung: khong bam, cho het tran ' + GHI_TOI_DA_MS + ' ms'
    else if (thuoc) {
      kq.dongHo = await js(thuoc, "JSON.stringify({ gio: document.getElementById('gio').textContent, chay: document.body.classList.contains('chay'), loa: getComputedStyle(document.getElementById('loa')).display, nut: document.getElementById('dung').textContent.trim(), coCau: typeof window.dem })")
      await js(thuoc, "document.getElementById('dung').click()") // dung bang DUNG nut that -> preload-dem -> 'quay:dung'
    } else { kq.dongHo = 'KHONG CO cua so dong ho'; dungGhiHinh('thu-quay') }
    kq.daDung = await doi(() => !ghiHinh, 8000)
    kq.conVien = BrowserWindow.getAllWindows().filter((w) => /dem\/(quay|vien)\.html/.test(w.webContents.getURL())).length
    kq.so = khoVideo.danhSach()
    kq.fileConTam = kq.luot ? fs.existsSync(kq.luot.tam) : null
    if (await doi(() => khayWin && !khayWin.isDestroyed() && !khayWin.webContents.isLoading(), 6000)) {
      await cho(1500)
      kq.khay = await js(khayWin, "JSON.stringify({ hang: [...document.querySelectorAll('.vd')].map(h => { const v = h.querySelector('video'); return { ten: h.querySelector('.dai-ten').textContent, meta: h.querySelector('.dai-meta').textContent, gio: h.querySelector('.vd-gio').textContent, ready: v.readyState, dur: v.duration, kich: v.videoWidth + 'x' + v.videoHeight, loi: v.error && v.error.code } }), dem: document.getElementById('dem-video').textContent, font: getComputedStyle(document.querySelector('.nut') || document.body).fontFamily.slice(0, 24) })")
      kq.iconKeo = videoIcon.size // khung dau da ve ra canvas va gui ve main (canvas khong bi "taint" voi file://)
      // 01/10 CHON TIENG trong khay: bam nut that "Khong tieng" roi "Co tieng", doc lai giao dien + so + file dang chon
      const docTieng = "JSON.stringify({ nut: [...document.querySelectorAll('.vd .chon-tieng .chon-nut')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '')), muted: document.querySelector('.vd video').muted, xoa: document.querySelector('.vd .dai-dau .nut.icon').title })"
      const bamTieng = (i) => "document.querySelectorAll('.vd .chon-tieng .chon-nut')[" + i + "].click()"
      kq.tieng0 = await js(khayWin, docTieng)
      if (kq.so[0] && kq.so[0].tieng) {
        await js(khayWin, bamTieng(1)); await cho(700)
        const m1 = khoVideo.tim(kq.so[0].id)
        kq.tieng1 = { giaoDien: await js(khayWin, docTieng), boTieng: m1.boTieng, fileKhongTieng: m1.fileKhongTieng, coFile: !!banKhongTieng(m1), keoSeLay: fileDangChon(m1) }
        await js(khayWin, bamTieng(0)); await cho(400)
        const m2 = khoVideo.tim(kq.so[0].id)
        kq.tieng2 = { giaoDien: await js(khayWin, docTieng), boTieng: m2.boTieng, conFileKhongTieng: !!banKhongTieng(m2), keoSeLay: fileDangChon(m2) }
      }
      if (process.argv.includes('--xoa') && kq.so[0]) {
        // Bam nut Xoa THAT 2 lan (lan 1 = hoi lai). File thu vao Thung rac cua may. Do: Windows co nha file dang mo khong.
        const bam = "document.querySelector('.vd .dai-dau .nut.icon').click()"
        await js(khayWin, bam)
        kq.xoaLan1 = { conFile: fs.existsSync(kq.so[0].file), chuNut: await js(khayWin, "document.querySelector('.vd .dai-dau .nut.icon').textContent") }
        await js(khayWin, bam)
        await doi(() => !fs.existsSync(kq.so[0].file), 5000)
        await cho(400)
        kq.xoaLan2 = { conFile: fs.existsSync(kq.so[0].file), conFileKhongTieng: !!(kq.tieng1 && kq.tieng1.fileKhongTieng && fs.existsSync(kq.tieng1.fileKhongTieng)), conTrongThuMuc: fs.readdirSync(kq.thuMucLuu).length, conTrongSo: khoVideo.danhSach().length, hang: await js(khayWin, "document.querySelectorAll('.vd').length"), toast: await js(khayWin, "document.getElementById('toast').textContent") }
      }
    } else kq.khay = 'KHONG mo duoc khay video'
  } catch (e) { kq.loi = String((e && e.stack) || e) }
  try { fs.writeFileSync(THU_QUAY.ra, JSON.stringify(kq, null, 1)) } catch (e) {}
  dangThoat = true
  app.exit(0)
}
const DEFAULT_HOTKEY = 'CommandOrControl+Shift+S'
let currentHotkey = DEFAULT_HOTKEY // nap tu config khi app ready
let lang = 'vi' // 'vi' | 'en' — nap tu config
const T = (key) => i18n.t(lang, key)

/* ── Ban quyen (24/09, anh chot 23/09 + A 24/09) ──────────────────────────
   File RIENG `ban-quyen.json` trong userData (khong chung cau-hinh.json: ghi atomic rieng,
   reset cai dat khong dung toi ban quyen). Selftest/harness bo qua kiem (khong khoa chup). */
const WEB_MUA = 'https://aio-shotsave.vercel.app/#checkout'
let bq = null
function khoiTaoBanQuyen() {
  const file = path.join(app.getPath('userData'), 'ban-quyen.json')
  /* 04/10: doc/ghi qua taoKhoFile (banquyen.js). Ban cu tra null cho MOI loi doc -> bo nao tuong "lan chay dau" roi
     ghi de, khach da tra tien mat ma (do: doc hong 1 lan la mat). Nay: chua co = null, khong doc duoc = nem loi
     (khong ghi de), file hong = cat sang ban-quyen.hong-<gio>.json + dong run-log. */
  const khoBq = taoKhoFile(file, { fs, path, log: ghiLog })
  bq = taoBanQuyen({
    doc: khoBq.doc,
    ghi: khoBq.ghi,
    fetch: (url, opt) => net.fetch(url, opt), // net.fetch = mang Chromium, theo proxy he thong (may cong ty)
    tenMay: os.hostname(),
    meta: { nen_tang: process.platform, ban: app.getVersion() },
  })
  const s = bq.trangThai()
  ghiLog('ban-quyen: ' + s.loai + (s.loai === 'da-kich-hoat' ? ' ' + s.maHienThi + (s.hetQuyenCapNhat ? ' het-cap-nhat' : '') : ' con ' + s.ngayConLai + ' ngay'))
}
const BO_QUA_BAN_QUYEN = IS_SELFTEST || IS_DRAGTEST || IS_SHELFTEST
async function kiemBanQuyenNen() {
  if (!bq) return
  try {
    const r = await bq.kiemTra()
    if (r.daHoi) ghiLog('ban-quyen kiem lai: ' + r.trangThai.loai + (r.trangThai.lyDoMatMa ? ' (' + r.trangThai.lyDoMatMa + ')' : ''))
    else if (r.loi) ghiLog('ban-quyen kiem lai: bo qua (' + r.loi + (r.maTraLoi ? ' ' + r.maTraLoi : '') + ')' + (r.loi === 'tra-loi-la' ? ', GIU ma' : ''))
  } catch (e) { ghiLog('ban-quyen kiem lai LOI: ' + e.message) }
  rebuildTrayMenu()
}

/* ☠️ Khi chay dev/selftest, GHI LAI moi loi khong bat duoc ra file.
   Vap 24/08: selftest thoat app ngay sau khi ghim nen hop thoai loi bi nuot —
   bao "chay sach" trong khi app that su nem TypeError luc dong cua so ghim.
   Ban that KHONG dat handler nay: de Electron hien hop thoai, con hon loi im. */
if (IS_DEV || IS_SELFTEST) {
  process.on('uncaughtException', (err) => {
    console.error('[shotandsave] LOI KHONG BAT DUOC:', err)
    try {
      const dir = path.join(__dirname, '..', '.selftest')
      fs.mkdirSync(dir, { recursive: true })
      fs.appendFileSync(path.join(dir, 'errors.txt'), String((err && err.stack) || err) + '\n')
    } catch (e) {}
  })
}

/* Nhat ky chay nhe (LUON bat) — de nguoi dung gap loi la co dau vet ngay.
   File .run-log.txt canh ma nguon, da gitignore. Tu cat khi qua 300KB. */
// Ban dong goi: __dirname nam trong app.asar (CHI DOC) — ghi log phai ra userData.
const RUN_LOG = app.isPackaged
  ? path.join(app.getPath('userData'), 'run-log.txt')
  : path.join(__dirname, '..', '.run-log.txt')
function ghiLog(msg) {
  try {
    /* ☠️ Gio DIA PHUONG, khong toISOString (UTC): log tung lech -7h so voi
       ten file anh -> doc log tuong "chup tu trua" trong khi vua chup xong
       (vap that 31/08 luc truy vet may nha). */
    const d = new Date()
    const p2 = (n, k) => String(n).padStart(k || 2, '0')
    const dong = p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' +
      p2(d.getSeconds()) + '.' + p2(d.getMilliseconds(), 3) + ' ' + msg + '\n'
    try { if (fs.statSync(RUN_LOG).size > 300 * 1024) fs.writeFileSync(RUN_LOG, '') } catch (e) {}
    fs.appendFileSync(RUN_LOG, dong)
  } catch (e) {}
}
kho.noiNhatKy(ghiLog) // 04/10: cau-hinh.json khong doc / khong ghi duoc thi phai co dong trong run-log (truoc: im lang)
/* 04/10 macOS: chua co quyen Ghi man hinh thi hien HOP THOAI noi ro + nut mo dung trang quyen (anh bam chup 35 lan chi
   thay overlay chop roi mat; Notification khong hien tren may anh). Windows: khong lam gi. Xem src/quyen-man-hinh.js. */
const kiemQuyen = taoKiemQuyen({ systemPreferences, dialog, shell, T, ghiLog, app })

/** Con tro app: tray + cac cua so dang song. */
let tray = null
let overlayWins = [] // mot overlay MOI man hinh (moi man mot cua so)
const overlayShots = new Map() // wcId -> { image (full-res), sf } de cat sau
let shelfWin = null

/** Khay anh: id -> { id, filePath, image }. Anh THAT nam tren dia (kho.js). */
const shelfItems = new Map()
let shelfSeq = 0
/** Ghim tu khay xep chong nhe cho khoi de len nhau. */
let cascade = 0

/** Anh dang chup dở: { image: NativeImage full-res, display, scaleFactor }. */
let pending = null

/** Map webContents.id -> { image: NativeImage } cho tung cua so ghim (de Copy). */
const pins = new Map()

/* Chi chay mot ban. */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // 15/09: ghi lai de khoi doan — ban dong goi chay lan 2 (cung exe) la tu thoat o day, ban dang chay nhan 'second-instance' -> BUNG overlay.
  try { fs.appendFileSync(RUN_LOG, new Date().toLocaleTimeString('vi-VN', { hour12: false }) + ' boot: da co ban khac dang chay -> thoat (second-instance)\n') } catch (e) {}
  app.quit()
} else {
  app.on('second-instance', () => startCapture())
}

app.setName('AiO Shot & Save')
if (process.platform === 'win32') app.setAppUserModelId('com.aiostudio.shotandsave')

app.whenReady().then(() => {
  if (THU_OCR) { thuOcr(); return } // che do do: khong tray, khong phim tat, khong luong chup
  if (THU_QUAY) { thuQuay(); return } // che do do quay video: khong tray, khong phim tat
  // Phuc vu anh dong bang tu bo nho (xem chu thich aioshot o dau file).
  protocol.handle('aioshot', (req) => {
    const headers = {
      'Access-Control-Allow-Origin': '*', // canvas ghep can CORS sach (taint)
      'Cache-Control': 'max-age=60',      // background + Image cung URL dung chung cache
    }
    // aioshot://frozen/<gen>/<displayId>.jpg — anh dong bang (JPEG q92, chi de nhin)
    let m = /^aioshot:\/\/frozen\/(\d+\/[^/]+(?:\/nhanh)?)\.jpg$/.exec(req.url) // .../nhanh.jpg = ban nua do phan giai (0.5.2)
    if (m) {
      const buf = frozenStore.get(m[1])
      if (!buf) return new Response('', { status: 404 })
      return new Response(buf, { headers: Object.assign({ 'Content-Type': 'image/jpeg' }, headers) })
    }
    // aioshot://raw/<gen>/<displayId>/<x>_<y>_<w>_<h>.png — cat DUNG VUNG (px thiet bi)
    // tu anh GOC khong nen, PNG. Dung luc bam Xong co shape / ghep vat man (14/09).
    m = /^aioshot:\/\/raw\/(\d+\/[^/]+)\/(\d+)_(\d+)_(\d+)_(\d+)\.png$/.exec(req.url)
    if (m) {
      const img = rawStore.get(m[1])
      if (!img || img.isEmpty()) return new Response('', { status: 404 })
      const sz = img.getSize()
      const x = Math.min(+m[2], sz.width - 1), y = Math.min(+m[3], sz.height - 1)
      const w = Math.max(1, Math.min(+m[4], sz.width - x)), h = Math.max(1, Math.min(+m[5], sz.height - y))
      const _t = Date.now()
      const buf = img.crop({ x, y, width: w, height: h }).toPNG()
      ghiLog('raw crop ' + w + 'x' + h + ' png ' + Math.round(buf.length / 1024) + 'KB ' + (Date.now() - _t) + 'ms')
      return new Response(buf, { headers: Object.assign({ 'Content-Type': 'image/png' }, headers) })
    }
    // aioshot://dai/<id>/<seq>.jpg — khung cua dai Storyboard trong kho (29/09). Qua protocol (ACAO) de canvas
    // xuat dai khong bi "taint", va khong day hang chuc MB base64 qua IPC.
    m = /^aioshot:\/\/dai\/([^/]+)\/(\d{1,2})\.jpg$/.exec(req.url)
    if (m) {
      const f = khoDai.duongKhung(m[1], m[2])
      if (!f) return new Response('', { status: 404 })
      return new Response(fs.readFileSync(f), { headers: Object.assign({ 'Content-Type': 'image/jpeg' }, headers) })
    }
    return new Response('', { status: 404 })
  })

  khoDai.khoiTao(app.getPath('userData'))
  khoVideo.khoiTao(app.getPath('userData'), ghiLog)
  setTimeout(khoiPhucVideoDo, 5000) // 02/10: file quay do cua lan truoc (app bi tat giua luc quay) -> dua lai vao khay
  { // 04/10 (anh chot huong A): KHONG xoa sach .keo nua — file da dua cho Premiere bi mat sau khi mo lai app.
    // Chi bo lien ket ma anh goc da bi xoa han (xem kho.js donKeoAnToan).
    const k = kho.donKeoAnToan()
    // banChep: thu muc anh o O DIA KHAC nen "lien ket" la ban chep day du (ca video) — ton dia that, in ra de do.
    if (k.giu || k.bo || k.khongRo) ghiLog('keo: giu ' + k.giu + ', bo ' + k.bo + ' (anh goc da xoa), khong ro goc ' + k.khongRo +
      (k.banChep ? ', trong so giu co ' + k.banChep + ' BAN CHEP ' + (k.byteChep / 1048576).toFixed(1) + ' MB (thu muc anh khac o dia)' : ''))
  }
  const ch = kho.docCauHinh()
  currentHotkey = ch.hotkey || DEFAULT_HOTKEY
  lang = ch.lang || 'vi'
  khoiTaoBanQuyen()
  createTray()
  setTimeout(kiemBanQuyenNen, 15000)                    // hoi lai Polar sau khi boot yen (toi da 3 ngay/lan, xem banquyen.js)
  setInterval(kiemBanQuyenNen, 6 * 60 * 60 * 1000)
  const okPhim = registerHotkey()
  /* Nhat ky boot: sau nay ai bao "phim tat doi/khong an" la co dau vet ngay
     (truoc 31/08 log chi ghi thao tac chup — chuyen phim tat MU hoan toan). */
  ghiLog('boot v' + app.getVersion() + ' hotkey=' + currentHotkey +
    (ch.hotkey ? '(config)' : '(default)') + ' dang-ky=' + (okPhim ? 'OK' : 'FAIL') +
    ' lang=' + lang)
  /* Phim bi app khac giu -> bao HAN ra man hinh, dung chet im lang: nguoi
     dung bam khong an se tuong "phim tu doi" (chi bao khi THAT BAI). */
  if (!okPhim && Notification.isSupported()) {
    new Notification({
      title: 'AiO Shot & Save',
      body: T('app.phimBiGiu').replace('{phim}', formatAccel(currentHotkey)),
    }).show()
  }
  // Khong tu mo cua so nao — day la app song o khay he thong.

  // ☠️ HAM NONG duong chup (anh Tien 31/08 "chup video giat mot cai moi chup
  // duoc"): lan getSources DAU tien LANH ~454ms, lan sau AM ~390ms (do that);
  // va WGC phai khoi tao phien lan dau. Goi mot getSources 1x1 vo hai luc mo
  // app -> so khoi tao WGC/driver da tra truoc, lan chup THAT dau tien khong
  // con cong-tac lanh. Fire-and-forget, khong chan gi.
  desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 }, fetchWindowIcons: false })
    .then(() => ghiLog('ham-nong xong')).catch(() => {})
  // 0.5.0: LUONG CHUP CHAY SAN (xem src/luong-chup.js) — bam phim la co khung ngay.
  luong.theoDoiMoiTruong()
  lenLichPool(1500)
  for (const ev of ['display-added', 'display-removed', 'display-metrics-changed']) screen.on(ev, () => { huyPool(); lenLichPool(1500) })
  setTimeout(() => luong.khoiDong({ ghiLog }), 800)

  // ☠️ CHAN DOAN GPU (--gpucheck): kiem render con chay sau khi cat shader
  // WebGPU (dxcompiler/dxil, 0.3.14 giam dung luong). Ghi ket qua ra userData
  // roi thoat. Dung de VERIFY ban dong goi da cat DLL, khong tin build sach.
  if (process.argv.includes('--gpucheck')) { setTimeout(gpuCheck, 300); return }

  // Che do tu kiem: tu chup -> tu chon vung -> tu ghim (de verify pipeline).
  if (IS_SELFTEST) setTimeout(() => startCapture(), Number(process.env.AIO_SELFTEST_TRE) || 1200) // AIO_SELFTEST_TRE: cho luong san sang (0.5.0)

  // Do that viec KEO KHAY: kich thuoc co phinh ra khong (anh Tien bao loi 24/08).
  if (IS_DRAGTEST) setTimeout(() => doKeoKhay(), 1200)
  if (IS_SHELFTEST) setTimeout(() => moKhayDeDo(), 800)
})

/* [selftest-shelf] Nap toi da 20 anh that tu 'Anh chup' (CHI DOC) vao khay, kieu khay
   theo --khay=, roi de nguyen cho script CDP do. Khong ghi file nao. */
function moKhayDeDo() {
  const kieu = (process.argv.find((a) => a.startsWith('--khay=')) || '--khay=doc').slice(7)
  kho.ghiCauHinh({ khayKieu: kieu === 'ngang' ? 'ngang' : 'doc' })
  // AIO_TEST_ANH_DIR: thu muc BAN SAO de harness ve/ghi de khong dung anh that
  const dir = process.env.AIO_TEST_ANH_DIR || kho.thuMucAnh()
  let files = []
  daNapAnhGanNhat = true   // harness tu nap dung bo anh cua no — khong cho "anh gan nhat" (0.6.3) chen them (0.6.5)
  try { files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort().slice(0, 20) } catch (e) {}
  for (const f of files) {
    const img = nativeImage.createFromPath(path.join(dir, f))
    if (!img.isEmpty()) shelfAdd(img, path.join(dir, f))
  }
  showShelf()
  ghiLog('[selftest-shelf] kieu=' + kieuKhay() + ' anh=' + files.length + ' cdp=9333')
  setTimeout(() => forceQuit(), 90 * 1000)
}

/* Chan doan GPU/render: dung mot cua so an, VE canvas 2D roi capturePage —
   neu render chet vi thieu shader thi anh ra rong/den. Kem getGPUFeatureStatus.
   Ghi JSON ra userData\gpucheck.json va console, roi thoat. */
async function gpuCheck() {
  const kq = { boot: 'ok', ffmpeg: fs.existsSync(path.join(process.resourcesPath || '', '..', 'ffmpeg.dll')) }
  try { kq.gpuFeature = app.getGPUFeatureStatus() } catch (e) { kq.gpuFeature = 'ERR:' + e.message }
  try {
    const w = new BrowserWindow({ width: 200, height: 200, show: false,
      webPreferences: { offscreen: false } })
    await w.loadURL('data:text/html,' + encodeURIComponent(
      '<canvas id=c width=200 height=200></canvas><script>' +
      'var x=document.getElementById("c").getContext("2d");' +
      'x.fillStyle="#f86820";x.fillRect(0,0,200,200);' +
      'x.fillStyle="#fff";x.fillRect(50,50,100,100);</script>'))
    await new Promise((r) => setTimeout(r, 500))
    const img = await w.webContents.capturePage()
    const sz = img.getSize()
    const bmp = img.toBitmap() // BGRA
    // Do mau tam (100,100) phai TRANG (255,255,255) — chung minh canvas render THAT
    const i = (100 * sz.width + 100) * 4
    kq.render = { w: sz.width, h: sz.height, tamB: bmp[i], tamG: bmp[i + 1], tamR: bmp[i + 2],
      trang: bmp[i] > 240 && bmp[i + 1] > 240 && bmp[i + 2] > 240 }
    // Do goc (10,10) phai CAM (~248,104,32 R,G,B)
    const j = (10 * sz.width + 10) * 4
    kq.render.gocCam = bmp[j + 2] > 200 && bmp[j + 1] > 60 && bmp[j + 1] < 160 && bmp[j] < 90
    w.destroy()
  } catch (e) { kq.render = 'ERR:' + e.message }
  const p = path.join(app.getPath('userData'), 'gpucheck.json')
  try { fs.writeFileSync(p, JSON.stringify(kq, null, 2)) } catch (e) {}
  console.log('GPUCHECK=' + JSON.stringify(kq))
  app.exit(kq.render && kq.render.trang && kq.render.gocCam ? 0 : 1)
}

// App song o tray: dong het cua so KHONG thoat app.
app.on('window-all-closed', (e) => {
  // Khong lam gi — giu app song. Thoat chi qua menu tray.
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  ocr.tatHost() // tien trinh PowerShell doc chu (neu dang giu san)
  khayThu.dongHet() // nut tron + san dien cua khay
})

/* ---------------------------------------------------------------------- */
/* Tray + phim tat                                                         */
/* ---------------------------------------------------------------------- */

function trayIcon() {
  const p = path.join(__dirname, '..', 'assets', 'tray.png')
  const img = nativeImage.createFromPath(p)
  if (img.isEmpty()) return undefined
  // Logo AiO la 386x351 (KHONG vuong). Ep vao o vuong 18x18 la bop meo chu A —
  // chi ghim CHIEU CAO, de chieu rong tu theo ti le.
  const resized = img.resize({ height: 16, quality: 'best' })
  if (process.platform === 'darwin') resized.setTemplateImage(true)
  return resized
}

function createTray() {
  const icon = trayIcon()
  tray = new Tray(icon || nativeImage.createEmpty())
  tray.setToolTip('AiO Shot & Save')
  rebuildTrayMenu()
  // Bam trai vao tray = chup ngay.
  tray.on('click', () => startCapture())
}

function dongBanQuyenTray() {
  if (!bq) return []
  const s = bq.trangThai()
  if (s.loai === 'da-kich-hoat') return []
  const nhan = s.loai === 'dung-thu' ? T('bq.trayConNgay').replace('{n}', s.ngayConLai) : T('bq.trayHetHan')
  return [{ label: nhan, click: () => openSettings() }, { type: 'separator' }]
}

function rebuildTrayMenu() {
  if (!tray) return
  const menu = Menu.buildFromTemplate([
    ...dongBanQuyenTray(),
    // 01/10: dang quay video -> muc DAU la Dung quay (phim tat chup luc nay cung = dung, xem startCapture)
    ...(ghiHinh ? [{ label: T('tray.dungQuay'), accelerator: currentHotkey, click: () => dungGhiHinh('tray') }, { type: 'separator' }] : []),
    { label: T('tray.chup'), accelerator: ghiHinh ? undefined : currentHotkey, enabled: !ghiHinh, click: () => startCapture() },
    { type: 'separator' },
    { label: T('tray.khay'), click: () => showShelf() },
    { label: T('tray.storyboard'), click: () => openStoryboardWindow() }, // 29/09: bo "(phim S)" — S chi an trong khay
    { label: T('tray.video'), click: () => openVideoWindow() },
    { label: T('tray.moThuMuc'), click: () => shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh())) },
    { type: 'separator' },
    { label: T('tray.caiDat'), click: () => openSettings() },
    { type: 'separator' },
    /* ☠️ Menu Windows coi '&' la dau gach chan phim tat -> 'AiO Shot  Save' (anh
       thay 14/09 tren 0.4.6). Viet '&&' de ra dau '&' that. */
    { label: 'AiO Shot && Save  v' + app.getVersion(), enabled: false },
    { type: 'separator' },
    { label: T('tray.thoat'), click: () => { forceQuit() } },
  ])
  tray.setContextMenu(menu)
}

let dangThoat = false // 01/10: thoat giua luc quay video -> chot file nhung KHONG mo khay video nua
function forceQuit() {
  dangThoat = true
  for (const w of BrowserWindow.getAllWindows()) w.destroy()
  app.quit()
}

/** [selftest] Chup noi dung mot cua so ra file PNG trong .selftest/. */
async function saveCapture(win, name) {
  try {
    if (!win || win.isDestroyed()) return
    const img = await win.webContents.capturePage()
    const dir = path.join(__dirname, '..', '.selftest')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, name), img.toPNG())
    if (IS_DEV || IS_SELFTEST) console.log('[selftest] luu', name)
  } catch (err) {
    console.error('[selftest] loi chup', name, err)
  }
}

function registerHotkey() {
  let ok = false
  try { ok = globalShortcut.register(currentHotkey, () => startCapture()) }
  catch (e) { ok = false }
  if (!ok && IS_DEV) console.warn('[shotandsave] khong dang ky duoc phim tat', currentHotkey)
  return ok
}

/* Doi phim tat: thu dang ky phim moi. That bai (app khac dang giu) thi KHOI
   PHUC phim cu va bao that bai — khong de nguoi dung mat luon phim tat. */
function setHotkey(accel) {
  const old = currentHotkey
  globalShortcut.unregisterAll()
  let ok = false
  try { ok = globalShortcut.register(accel, () => startCapture()) } catch (e) { ok = false }
  if (!ok) {
    try { globalShortcut.register(old, () => startCapture()) } catch (e) {}
    ghiLog('doi phim ' + old + ' -> ' + accel + ' FAIL (bi giu), giu phim cu')
    return { ok: false, hotkey: old }
  }
  currentHotkey = accel
  kho.ghiCauHinh({ hotkey: accel })
  rebuildTrayMenu()
  ghiLog('doi phim ' + old + ' -> ' + accel + ' OK, da luu config')
  return { ok: true, hotkey: accel }
}

/* Dinh dang luu anh tu config (anh Tien 26/08): mac dinh JPEG chat luong CAO. */
// Anh Tien 26/08: "basic nhat cung phai ~100KB" — nang toan bo thang chat luong.
// Do that vung 1200x700 man 4K: q95~101KB, nen thap=95, cao=98, sieu=100.
const CHAT_LUONG_Q = { thap: 95, cao: 98, sieu: 100 }
function layDinhDangAnh() {
  const c = kho.docCauHinh()
  const loai = c.anhLoai === 'png' ? 'png' : 'jpeg'
  const q = CHAT_LUONG_Q[c.anhChatLuong] || CHAT_LUONG_Q.cao
  return { loai, q }
}

/* --- Cua so Cai dat --- */
let settingsWin = null
function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return }
  settingsWin = new BrowserWindow({
    width: 440, height: 700, resizable: false, minimizable: false,
    maximizable: false, fullscreenable: false,
    frame: false, // header rieng co logo AiO (xem settings/index.html)
    title: 'AiO Shot & Save - Cai dat', backgroundColor: '#141414', show: false,
    icon: path.join(__dirname, '..', 'assets', 'app.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-settings.js'),
      contextIsolation: true, sandbox: false,
    },
  })
  settingsWin.loadFile(path.join(__dirname, 'settings', 'index.html'))
  settingsWin.once('ready-to-show', () => settingsWin.show())
  settingsWin.on('closed', () => { settingsWin = null })
}

/* --- Cua so KHAY GOP (01/10): MOT cua so, 2 the Storyboard | Video ---
   Anh Tien 01/10: "phan khay minh toi uu hoa thanh 1 khay". Truoc la 2 cua so (Storyboard 1080x700, Video 860x680)
   voi 2 trang + 2 preload rieng; nay 1 trang src/khay/index.html + preload-khay.js. `tab` = 'dai' | 'video': the mo dau.
   Mo lai khi cua so dang co = NAP LAI trang (co dai / video vua tao) va nhay dung the. Khay anh noi KHONG lien quan. */
let khayWin = null
function moKhay(tab) {
  const trang = path.join(__dirname, 'khay', 'index.html')
  ghiLog('khay mo the=' + tab + (khayWin && !khayWin.isDestroyed() ? ' (cua so dang co -> nap lai)' : ''))
  if (khayWin && !khayWin.isDestroyed()) {
    khayWin.loadFile(trang, { query: { tab } })
    khayWin.show()
    khayWin.focus()
    return
  }

  const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const wa = d.workArea
  const w = Math.min(1080, Math.round(wa.width * 0.88))
  const h = Math.min(700, Math.round(wa.height * 0.8))
  const x = wa.x + Math.round((wa.width - w) / 2)
  const y = wa.y + Math.round((wa.height - h) / 2)

  khayWin = new BrowserWindow({
    x, y, width: w, height: h,
    minWidth: 640, minHeight: 460,
    frame: false,
    title: 'AiO Shot & Save - Khay',
    backgroundColor: '#181818', // = --bg-2 cua tokens (khop khay anh)
    show: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'assets', 'app.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-khay.js'),
      contextIsolation: true, sandbox: false,
    },
  })

  // Trang hong (loi script / preload) thi cua so van mo nhung trong tron, khong ai biet -> ghi vao run-log.
  // Electron moi: su kien la 1 doi tuong { level, message }; ban cu: (e, level so, message) -> nhan ca hai.
  khayWin.webContents.on('console-message', (e, level, msg) => {
    const nang = typeof level === 'number' ? level >= 3 : e.level === 'error'
    if (nang) ghiLog('khay LOI trang: ' + String(msg || e.message).slice(0, 300))
  })
  khayWin.webContents.on('preload-error', (_e, p, err) => ghiLog('khay LOI preload ' + path.basename(p) + ': ' + (err && err.message)))
  khayWin.loadFile(trang, { query: { tab } })
  // che do do --thu-quay: hien nhung KHONG cuop tieu diem cua nguoi dang lam viec
  khayWin.once('ready-to-show', () => (THU_QUAY ? khayWin.showInactive() : khayWin.show()))
  khayWin.on('closed', () => { khayWin = null })
}
function openStoryboardWindow() { moKhay('dai') }

ipcMain.handle('settings:get', () => {
  const c = kho.docCauHinh()
  return {
    hotkey: currentHotkey, def: DEFAULT_HOTKEY, isMac: process.platform === 'darwin',
    saveFolder: kho.thuMucAnh(), lang, version: app.getVersion(),
    anhLoai: c.anhLoai === 'png' ? 'png' : 'jpeg',
    anhChatLuong: CHAT_LUONG_Q[c.anhChatLuong] ? c.anhChatLuong : 'cao',
    khayKieu: kieuKhay(),
    khaySoAnh: typeof c.khaySoAnh === 'number' ? c.khaySoAnh : 5,
    khayTuThu: giayHopLe(c.khayTuThu),
    lamMoKieu: c.lamMoKieu === 'blur' ? 'blur' : 'mosaic',
  }
})

ipcMain.handle('settings:set-lam-mo', (_e, kieu) => {
  const val = kieu === 'blur' ? 'blur' : 'mosaic'
  kho.ghiCauHinh({ lamMoKieu: val })
  ghiLog('doi kieu lam mo: ' + val)
  for (const w of overlayWins) {
    if (!w.isDestroyed()) w.webContents.send('overlay:update-config', { lamMoKieu: val })
  }
  for (const [, rec] of pins) {
    if (rec.win && !rec.win.isDestroyed()) {
      rec.win.webContents.send('pin:update-config', { lamMoKieu: val })
    }
  }
  return { lamMoKieu: val }
})

ipcMain.handle('settings:set-khay-so-anh', (_e, n) => {
  const so = Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
  kho.ghiCauHinh({ khaySoAnh: so })
  ghiLog('doi so anh tu dong vao khay: ' + so)
  return { khaySoAnh: so }
})

// 01/10: so giay khay cho roi tu thu ve nut tron o goc (anh chot 5 / 10 / 15, mac dinh 5)
ipcMain.handle('settings:set-khay-tu-thu', (_e, n) => {
  const g = giayHopLe(n)
  kho.ghiCauHinh({ khayTuThu: g })
  ghiLog('doi so giay khay tu thu: ' + g)
  return { khayTuThu: g }
})

/* Doi dinh dang / chat luong anh — ap dung ngay tu lan chup sau. */
ipcMain.handle('settings:set-anh', (_e, d) => {
  const patch = {}
  if (d && (d.anhLoai === 'png' || d.anhLoai === 'jpeg')) patch.anhLoai = d.anhLoai
  if (d && CHAT_LUONG_Q[d.anhChatLuong]) patch.anhChatLuong = d.anhChatLuong
  kho.ghiCauHinh(patch)
  ghiLog('doi dinh dang anh: ' + JSON.stringify(patch))
  return layDinhDangAnh()
})

// Preload nap lang DONG BO luc khoi tao renderer.
ipcMain.on('i18n:lang', (e) => { e.returnValue = lang })

/** Dinh dang phim tat cho de doc: CommandOrControl->Ctrl/⌘, ghep " + ". */
function formatAccel(accel) {
  const isMac = process.platform === 'darwin'
  return (accel || '').split('+').map((x) => {
    if (x === 'CommandOrControl' || x === 'CmdOrCtrl') return isMac ? '⌘' : 'Ctrl'
    if (x === 'Cmd' || x === 'Command') return '⌘'
    if (x === 'Alt' || x === 'Option') return isMac ? '⌥' : 'Alt'
    if (x === 'Shift') return isMac ? '⇧' : 'Shift'
    if (x === 'Ctrl' || x === 'Control') return 'Ctrl'
    return x
  }).join(' + ')
}
ipcMain.on('hotkey:display', (e) => { e.returnValue = formatAccel(currentHotkey) })
ipcMain.on('khay:kieu', (e) => { e.returnValue = kieuKhay() })

/* Doi kieu khay: luu config, dung lai cua so khay (dung co + layout moi) va
   VE LAI cac anh dang co tu shelfItems (nguon chan ly nam o main). */
ipcMain.handle('settings:set-khay', (_e, kieu) => {
  kho.ghiCauHinh({ khayKieu: kieu === 'doc' ? 'doc' : 'ngang' })
  ghiLog('doi kieu khay: ' + kieuKhay())
  if (shelfWin && !shelfWin.isDestroyed()) {
    shelfWin.destroy()
    shelfWin = null
    if (shelfItems.size) {
      const w = ensureShelf()
      w.webContents.once('did-finish-load', () => {
        for (const it of shelfItems.values()) {
          let kb = 0
          try { kb = Math.round(fs.statSync(it.filePath).size / 1024) } catch (e) {}
          w.webContents.send('shelf:add', { id: it.id, seq: it.seq || it.id, thumb: it.thumb, filePath: it.filePath, w: it.w, h: it.h, kb })
        }
        khayThu.hienThang(w) // 01/10: cua so khay dung lai -> hien thang, cat nut tron (neu dang la nut)
      })
    }
  }
  return { khayKieu: kieuKhay() }
})

/* Cua so nao DUOC nap lai khi doi ngon ngu. ☠️ 02/10 (ECC soat, muc A4): truoc do nap lai MOI cua so, gom ca cua so
   luong AN (src/luong: bo quay video + luong chup chay san), dong ho / vien quay (src/dem) va san dien cua khay
   (src/dien) -> doi ngon ngu luc dang quay la doan quay hong, dong ho ve 0:00; luong chup chay san cung chet theo.
   Ba loai cua so do khong co chu can dich lai (nut Dung tren dong ho giu ngon ngu cu toi luot quay sau). */
function duocNapLai(url) { return !/\/src\/(luong|dem|dien)\//.test(String(url || '').replace(/\\/g, '/')) }

// Doi ngon ngu: luu, cap nhat tray, NAP LAI cac cua so dang mo de dich lai.
ipcMain.handle('settings:set-lang', (_e, l) => {
  lang = (l === 'en') ? 'en' : 'vi'
  kho.ghiCauHinh({ lang })
  rebuildTrayMenu()
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed() && duocNapLai(w.webContents.getURL())) w.webContents.reload()
  }
  return { lang }
})

ipcMain.on('settings:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w && !w.isDestroyed()) w.close()
})
ipcMain.handle('settings:set-hotkey', (_e, accel) => setHotkey(accel))

/* Chon thu muc luu anh. Tra { folder } (thu muc moi) hoac { folder, huy:true }. */
ipcMain.handle('settings:pick-folder', async (e) => {
  const parent = BrowserWindow.fromWebContents(e.sender)
  const res = await dialog.showOpenDialog(parent, {
    title: 'Chon thu muc luu anh',
    defaultPath: kho.thuMucAnh(),
    properties: ['openDirectory', 'createDirectory'],
  })
  if (res.canceled || !res.filePaths.length) return { folder: kho.thuMucAnh(), huy: true }
  const folder = res.filePaths[0]
  kho.ghiCauHinh({ thuMucAnh: folder })
  return { folder }
})

/* Mo thu muc luu anh hien tai trong Explorer. */
ipcMain.handle('settings:open-folder', () => {
  shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh()))
})
ipcMain.handle('settings:reset', () => setHotkey(DEFAULT_HOTKEY))

/* Ban quyen: trang thai / nhap ma / huy kich hoat / mo trang mua */
ipcMain.handle('bq:get', () => (bq ? bq.trangThai() : null))
ipcMain.handle('bq:kich-hoat', async (_e, ma) => {
  const r = await bq.kichHoat(ma)
  ghiLog('ban-quyen kich hoat: ' + (r.ok ? 'OK ' + r.trangThai.maHienThi + (r.canhBao ? ' (' + r.canhBao + ')' : '') : 'LOI ' + r.loi))
  rebuildTrayMenu()
  return r
})
ipcMain.handle('bq:huy', async () => {
  const r = await bq.huyKichHoat()
  ghiLog('ban-quyen huy kich hoat: ' + (r.ok ? 'OK' : 'LOI ' + r.loi))
  rebuildTrayMenu()
  return r
})
ipcMain.handle('bq:mua', () => shell.openExternal(WEB_MUA))

/* ---------------------------------------------------------------------- */
/* Chup: grab man hinh duoi con tro -> overlay chon vung                   */
/* ---------------------------------------------------------------------- */

let grabPromise = null
let grabStarted = false
let nguonGrab = 'grab' // 'luong' (0.5.0) | 'grab' (getSources cu)
/* 14/09 GRAB TRUOC (AIO_GRAB_TRUOC, mac dinh 1): goi kickGrab NGAY luc bam phim,
   TRUOC khi tao overlay (kieu Lightshot). Do that (do-grab, video YouTube Shorts tren
   man LG): overlay trong suot phu len video >= ~0,5s la WGC tra VUNG VIDEO DEN (sang 0),
   <= 0,2s van co hinh (67-78). App cu: overlay hien -> cho 200ms -> getSources mo phien
   ~370ms -> khoanh khac chup roi vao ~600ms sau khi phu = DEN. Grab truoc: khoanh khac
   chup ~420ms sau phim, overlay hien ~200ms sau phim (sau khi WGC mo phien xong) ->
   phu moi ~200ms luc chup. Lop mo cung khong bi grab chan nua. */
const GRAB_TRUOC = process.env.AIO_GRAB_TRUOC !== '0'
let layersSanSang = null // layers cua the he hien tai — overlay nao nap xong SAU grab thi lay o day

async function startCapture() {
  // 01/10: dang QUAY VIDEO -> phim tat chup / bam tray = DUNG quay (duong dung luon co, ke ca khi vung kin man
  // khong con cho dat nut Dung). Khong mo overlay luc dang quay: anh dong bang se lot vao video.
  if (ghiHinh) { dungGhiHinh('phim tat'); return }
  if (overlayWins.length) return // dang chon vung, bo qua
  khayThu.huy() // 01/10: khay dang bay ve nut / bung ra thi go san dien ngay (cua so trong suot phu video lau = video den)
  // Het dung thu / ma bi thu hoi: KHOA chup, mo Cai dat o the Ban quyen (anh chot 23/09)
  if (bq && !BO_QUA_BAN_QUYEN && !bq.trangThai().choPhepChup) {
    ghiLog('capture: KHOA — het dung thu, chua co ma')
    if (Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('bq.baoKhoa') }).show()
    openSettings()
    return
  }
  // 04/10 macOS: quyen Ghi man hinh bi tu choi -> hop thoai + nut mo Cai dat he thong, KHONG mo overlay (se chi chop roi mat)
  if (!BO_QUA_BAN_QUYEN && kiemQuyen.chanTruocKhiChup()) return

  const displays = screen.getAllDisplays()
  if (!displays.length) return

  // Overlay hien NGAY (trong suot, thay man hinh THAT qua no) — tuc thi nhu
  // Lightshot. Grab bat dau SAU khi overlay da hien (kickGrab, goi tu overlay
  // dau tien) vi getSources CHAN luong chinh ~0,5s: goi truoc la overlay khong
  // kip hien.
  grabStarted = false
  grabPromise = null
  layersSanSang = null
  napManCache()
  ghiLog('capture-start displays=' + displays.length + ' ' +
    manCache.map((m) => m.px + ',' + m.py + ' ' + m.pw + 'x' + m.ph + '@' + m.sf).join(' | ') +
    (GRAB_TRUOC ? ' grab-truoc' : '') + (luong.sanSang() ? ' luong' : ''))
  if (GRAB_TRUOC) kickGrab() // xem chu thich GRAB_TRUOC
  openOverlays(displays)
}

/* Bat dau grab — goi SAU khi overlay dau tien da hien + paint. Chan luong ~0,5s
   (getSources + toJPEG) nhung overlay da hien roi nen chi "kho" mot chut, khong
   phai doi moi thay gi. Xong -> gui anh dong bang (freeze) + luu full-res. */
function kickGrab() {
  if (grabStarted) return
  grabStarted = true
  const _tg = Date.now() // TAM do gio
  nguonGrab = luong.sanSang() ? 'luong' : 'grab'
  if (nguonGrab === 'luong') {
    /* 0.5.0: khung tu LUONG CHAY SAN — JPEG ve truoc (hien overlay), raw ve sau (cat luc Xong).
       Truoc khi tin list: rong = luong hong -> roi ve grab cu ngay trong luot nay. */
    let daPhat = false
    grabPromise = luong.layKhung((listNhanh) => {
      // Dot 0 (0.5.2): nen NHANH nua do phan giai -> overlay co nen ngay, khong con nhin xuyen ra video den.
      daPhat = true
      ghiLog('nhanh-xong ' + (Date.now() - _tg) + 'ms nguon=luong layers=' + listNhanh.length + ' [' +
        listNhanh.map((x) => 'jpg ' + Math.round(x.jpgNhanh.length / 1024) + 'KB').join(' | ') + ']')
      phatFrozen(listNhanh, null, 'luong', true)
    }, (listJpg) => {
      ghiLog('grab-xong ' + (Date.now() - _tg) + 'ms nguon=luong layers=' + listJpg.length + ' [' +
        listJpg.map((x) => 'jpg ' + Math.round(x.jpg.length / 1024) + 'KB').join(' | ') + ']')
      if (daPhat) capNhatFrozenDayDu(listJpg)
      else { daPhat = true; phatFrozen(listJpg) }
    }).then((list) => {
      if (!list.length) {
        ghiLog('LUONG: khong ra khung -> roi ve grab cu')
        return grabDisplaysList().then((l2) => { phatFrozen(l2, _tg, 'grab'); return l2 })
      }
      if (!daPhat) { phatFrozen(list, _tg, 'luong'); return list }
      // Raw da ve: dien image cho overlay + rawStore (frozen key da phat)
      for (const x of list) {
        const key = grabGen + '/' + x.display.id
        if (rawStore.has(key) || frozenStore.has(key)) rawStore.set(key, x.image)
        for (const win of overlayWins) {
          if (win.isDestroyed() || win._displayId !== x.display.id) continue
          const rec = overlayShots.get(win.webContents.id)
          if (rec) { rec.image = x.image; rec.sf = x.sf }
        }
      }
      ghiLog('raw-xong ' + (Date.now() - _tg) + 'ms nguon=luong [' +
        list.map((x) => { const sz = x.image.getSize(); return sz.width + 'x' + sz.height }).join(' | ') + ']')
      return list
    }).catch((e) => { if (IS_DEV) console.error('[shotandsave] luong loi', e); return [] })
    return
  }
  grabPromise = grabDisplaysList().catch((e) => {
    if (IS_DEV) console.error('[shotandsave] grab loi', e)
    return []
  })
  grabPromise.then((list) => phatFrozen(list, _tg, 'grab'))
}

/* Phat anh dong bang cho moi overlay. list = [{display, image|null, jpg, sf}]. Goi 1 lan
   cho moi luot chup (grabGen++). image co the null (luong: raw ve sau). */
/* Sau khi da phat ban NHANH: thay bang JPEG day du (cung gen, cung key/raw), overlay nap lai anh net. */
function capNhatFrozenDayDu(list) {
  if (!overlayWins.length || !layersSanSang) return
  for (const x of list) frozenStore.set(grabGen + '/' + x.display.id, x.jpg)
  doSangTest(list) // [do] AIO_TEST_SANG tren JPEG day du
  const layers = layersSanSang.map((L) => Object.assign({}, L, { url: 'aioshot://frozen/' + L.key + '.jpg' }))
  layersSanSang = layers
  for (const win of overlayWins) { if (!win.isDestroyed()) win.webContents.send('overlay:frozen', { layers }) }
}

function doSangTest(list) {
  if (!process.env.AIO_TEST_SANG) return
  try {
    const [id, vung] = process.env.AIO_TEST_SANG.split(':')
    const [x, y, w, h] = vung.split(',').map(Number)
    const it = list.find((q) => String(q.display.id) === id)
    const src = it && (it.image || (it.jpg && nativeImage.createFromBuffer(it.jpg)))
    if (!src) { ghiLog('[do] sang: khong co man ' + id); return }
    const c = src.crop({ x, y, width: w, height: h }).resize({ width: 48, height: 48 }).toBitmap()
    let sum = 0, n = 0
    for (let i = 0; i < c.length; i += 4) { sum += (c[i] + c[i + 1] + c[i + 2]) / 3; n++ }
    ghiLog('[do] sang vung ' + id + ' ' + x + ',' + y + ' ' + w + 'x' + h + ' = ' + Math.round(sum / n))
  } catch (e) { ghiLog('[do] sang LOI ' + e.message) }
}

function phatFrozen(list, _tg, nguon, nhanh) {
  // ☠️ 10/09: khong chup duoc man nao -> bao NGAY + dong overlay. Truoc day
  //    overlay van mo voi layers=0, nguoi dung khoanh vung xong Enter -> khong
  //    ra anh, khong bao gi (mat im lang, cung lop loi voi luu-anh 0.4.3).
  if (!list.length && overlayWins.length) {
    ghiLog('LOI grab: 0/' + screen.getAllDisplays().length + ' man chup duoc — dong overlay')
    closeOverlay()
    // 04/10 macOS thieu quyen: hop thoai (kiemQuyen); con lai (Windows, hoac co quyen ma van hong): thong bao nhu cu
    if (!kiemQuyen.baoKhiChupHong() && Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('app.khongChupDuoc') }).show()
    return
  }
  // Gui anh dong bang cua MOI man (kem toa do DIP toan cuc) cho TUNG overlay —
  // de renderer GHEP duoc vung chon VAT NGANG 2 man (anh Tien 25/08: khoanh
  // ca 2 man ma luu chi co 1 man). Anh di qua aioshot:// (buffer o main),
  // IPC chi mang URL — het nghen renderer giua luc keo (may nha 31/08).
  if (!overlayWins.length) return // da Esc/dong truoc khi grab xong — khong giu buffer
  grabGen++
  /* [do] AIO_TEST_SANG=<displayId>:<x>,<y>,<w>,<h> (px thiet bi): ghi do sang trung binh
     vung do vao run-log — bat "video den" bang so, khong bang mat (14/09). */
  if (process.env.AIO_TEST_SANG && !nhanh) {
    try {
      const [id, vung] = process.env.AIO_TEST_SANG.split(':')
      const [x, y, w, h] = vung.split(',').map(Number)
      const it = list.find((q) => String(q.display.id) === id)
      const src = it && (it.image || nativeImage.createFromBuffer(it.jpg || it.jpgNhanh))
      if (src) {
        const c = src.crop({ x, y, width: w, height: h }).resize({ width: 48, height: 48 }).toBitmap()
        let sum = 0, n = 0
        for (let i = 0; i < c.length; i += 4) { sum += (c[i] + c[i + 1] + c[i + 2]) / 3; n++ }
        ghiLog('[do] sang vung ' + id + ' ' + x + ',' + y + ' ' + w + 'x' + h + ' = ' + Math.round(sum / n))
      } else ghiLog('[do] sang: khong co man ' + id)
    } catch (e) { ghiLog('[do] sang LOI ' + e.message) }
  }
  frozenStore.clear(); rawStore.clear() // chi giu the he hien tai
  const layers = list.map((x) => {
    const m = manCache.find((mm) => mm.id === x.display.id) || {}
    const key = grabGen + '/' + x.display.id
    if (nhanh) frozenStore.set(key + '/nhanh', x.jpgNhanh); else frozenStore.set(key, x.jpg)
    if (x.image) rawStore.set(key, x.image)
    return {
      x: x.display.bounds.x, y: x.display.bounds.y,
      w: x.display.bounds.width, h: x.display.bounds.height,
      sf: x.sf, key, url: 'aioshot://frozen/' + key + (nhanh ? '/nhanh' : '') + '.jpg',
      px: m.px, py: m.py, pw: m.pw, ph: m.ph, // goc + co PHYS de ghep 1:1
    }
  })
  if (_tg) ghiLog('grab-xong ' + (Date.now() - _tg) + 'ms nguon=' + nguon + ' layers=' + layers.length + ' [' +
    list.map((x) => { const sz = x.image ? x.image.getSize() : { width: '?', height: '?' }; const m = manCache.find((mm) => mm.id === x.display.id) || {}; return 'anh ' + sz.width + 'x' + sz.height + ' / native ' + m.pw + 'x' + m.ph + ' / jpg ' + Math.round(x.jpg.length / 1024) + 'KB' }).join(' | ') + ']')
  for (const win of overlayWins) {
    if (win.isDestroyed()) continue
    const item = list.find((x) => x.display.id === win._displayId)
    if (item && item.image) {
      const rec = overlayShots.get(win.webContents.id)
      if (rec) { rec.image = item.image; rec.sf = item.sf }
    }
    win.webContents.send('overlay:frozen', { layers })
  }
  layersSanSang = layers // overlay nao did-finish-load SAU thoi diem nay thi tu lay
}

/* Khoa mot-nguoi-keo: overlay nao mousedown TRUOC thi giu quyen; cac overlay khac
   bo qua chuot (het canh 2 man cung chon -> 2 anh). Reset moi lan capture (cua so
   moi). Renderer cung gui log su kien qua day. */
ipcMain.on('overlay:lock', (e) => {
  for (const w of overlayWins) {
    if (!w.isDestroyed() && w.webContents.id !== e.sender.id) {
      w.webContents.send('overlay:locked')
    }
  }
})
ipcMain.on('overlay:log', (_e, msg) => ghiLog('[overlay] ' + msg))

/* ---------------------------------------------------------------------- */
/* KEO CHON do MAIN theo doi — screen.getCursorScreenPoint() tra DIP toan  */
/* cuc DUNG theo scale TUNG man (anh Tien 26/08: moi user mot cau hinh     */
/* man/scale khac nhau; clientX cua renderer chi dung khi 2 man CUNG scale)*/
/* ---------------------------------------------------------------------- */
let dragOwnerId = null
let dragAnchor = null
let dragTimer = null
let manCache = [] // {id, dip(bounds), sf, px, py, pw, ph} — phys tinh 1 lan/capture

/** DIP -> pixel VAT LY (Windows). May khac Windows: xap xi qua sf man chua diem. */
function raPhys(p) {
  try { return screen.dipToScreenPoint(p) } catch (e) {
    const d = screen.getDisplayNearestPoint(p)
    const sf = d.scaleFactor || 1
    return { x: Math.round(d.bounds.x * sf + (p.x - d.bounds.x) * sf),
             y: Math.round(d.bounds.y * sf + (p.y - d.bounds.y) * sf) }
  }
}

function napManCache() {
  manCache = screen.getAllDisplays().map((d) => {
    const goc = raPhys({ x: d.bounds.x, y: d.bounds.y })
    const sf = d.scaleFactor || 1
    return { id: d.id, dip: d.bounds, sf, px: goc.x, py: goc.y,
             pw: Math.round(d.bounds.width * sf), ph: Math.round(d.bounds.height * sf) }
  })
}

/* rect PHYS -> rect CUC BO (DIP) cua tung man de renderer ve.
   conTro (phys, tuy chon): con tro DANG NAM TRONG man chu thi BO QUA man chu —
   local thay chuot va tu ve (nguon duy nhat, het canh 2 nguon nhap nhay
   "15xx/1405" khi giu yen tay — may nha 31/08). Con tro RA NGOAI man chu
   (vat man) thi main van ve cho man chu (local mu, 0.3.17). */
function phatSelRect(rect, conTro) {
  for (const w of overlayWins) {
    if (w.isDestroyed()) continue
    if (rect === null) { w.webContents.send('overlay:sel-rect', null); continue }
    const m = manCache.find((x) => x.id === w._displayId)
    if (!m) continue
    const laChu = w.webContents.id === dragOwnerId
    if (laChu && conTro &&
        conTro.x >= m.px && conTro.x < m.px + m.pw &&
        conTro.y >= m.py && conTro.y < m.py + m.ph) continue
    w.webContents.send('overlay:sel-rect', {
      x: (rect.x - m.px) / m.sf, y: (rect.y - m.py) / m.sf,
      w: rect.w / m.sf, h: rect.h / m.sf,
      physW: rect.w, physH: rect.h,
      laChu,
    })
  }
}

function rectTuNeo(c) {
  const x = Math.min(dragAnchor.x, c.x), y = Math.min(dragAnchor.y, c.y)
  return { x, y, w: Math.abs(c.x - dragAnchor.x), h: Math.abs(c.y - dragAnchor.y) }
}

function rectHienTai() {
  return rectTuNeo(raPhys(screen.getCursorScreenPoint()))
}

ipcMain.on('overlay:drag-start', (e, diemNeo) => {
  dragOwnerId = e.sender.id
  const lucNhan = raPhys(screen.getCursorScreenPoint())
  /* ☠️ NEO = DIEM MOUSEDOWN renderer gui kem (global DIP -> phys), KHONG hoi
     con tro luc main nhan tin (may nha 31/08 "keo va giu no giat 15xx/1405"):
     bam chuot khi grab con chay -> main nghen ~880ms moi nhan drag-start,
     luc do tay da keo di 100-150px -> neo main LECH neo local tung ay ->
     giu yen tay la 2 nguon ve nhap nhay 2 kich thuoc khac nhau, va vung
     ANH LUU (chot bang neo main) cung lech theo. Log ca hai de doi chieu. */
  dragAnchor = (diemNeo && typeof diemNeo.x === 'number')
    ? raPhys({ x: diemNeo.x, y: diemNeo.y }) : lucNhan
  const lech = Math.round(Math.hypot(dragAnchor.x - lucNhan.x, dragAnchor.y - lucNhan.y))
  ghiLog('drag-start anchor=' + JSON.stringify(dragAnchor) +
    (lech > 2 ? ' (con tro luc main nhan da troi ' + lech + 'px)' : ''))
  if (dragTimer) clearInterval(dragTimer)
  dragTimer = setInterval(() => {
    const c = raPhys(screen.getCursorScreenPoint())
    phatSelRect(rectTuNeo(c), c)
  }, 16)
})

ipcMain.on('overlay:drag-end', (e) => {
  if (dragTimer) { clearInterval(dragTimer); dragTimer = null }
  if (!dragAnchor) return
  const rect = rectHienTai()
  dragAnchor = null
  ghiLog('drag-end rect=' + JSON.stringify(rect))
  if (rect.w < 8 || rect.h < 8) { ghiLog('huy (vung qua nho)'); closeOverlay(); return }
  // Nam TRON mot man? (so bang PIXEL VAT LY — dung moi scale/do phan giai)
  const chua = manCache.find((m) =>
    rect.x >= m.px && rect.y >= m.py &&
    rect.x + rect.w <= m.px + m.pw && rect.y + rect.h <= m.py + m.ph)
  phatSelRect(rect) // dong bang khung hien tai tren moi man
  if (chua) {
    const win = overlayWins.find((w) => !w.isDestroyed() && w._displayId === chua.id)
    if (win) {
      ghiLog('vao annotate tren display=' + chua.id)
      // rect CUC BO theo DIP man do (renderer lam viec bang CSS px)
      win.webContents.send('overlay:annotate', {
        x: (rect.x - chua.px) / chua.sf, y: (rect.y - chua.py) / chua.sf,
        w: rect.w / chua.sf, h: rect.h / chua.sf,
      })
      win.focus() // phim Enter/Ctrl+C phai roi vao dung man nay
      return
    }
  }
  // Vat ngang nhieu man -> chu ghep theo PIXEL VAT LY (1:1 tung man, khong meo)
  const owner = overlayWins.find((w) => !w.isDestroyed() && w.webContents.id === dragOwnerId)
  ghiLog('composite (vat ngang, phys)')
  if (owner) owner.webContents.send('overlay:composite', rect)
  else closeOverlay()
})


/**
 * Chup TUNG man hinh -> mang { display, dataUrl, sf }. Moi man se co MOT overlay
 * rieng phu dung man do -> khoanh vung o man nao cung duoc (tu nhien nhu
 * Lightshot, anh Tien 25/08). Lam RIENG moi man (khong mot cua so khong lo vat
 * ngang) vi cua so vat qua nhieu man 4K DPI khac nhau khong phu het -> vap
 * 25/08 tren may 4K + man phu cua anh Tien.
 */
async function grabDisplaysList() {
  const displays = screen.getAllDisplays()
  // ☠️ MOI man goi getSources RIENG voi thumbnailSize = NATIVE cua man do.
  // Mot size chung thi man nho bi UPSCALE (do that 26/08: 2560x1441 tra ve
  // 3840x2160 — mo + sai co luu). Grab chay NEN (overlay da hien) nen cham hon
  // mot chut khong sao. Promise.all cho chay song song.
  // ☠️ 10/09: allSettled thay Promise.all — mot man getSources NEM loi thi
  //    truoc day CA hai man ve rong (Promise.all roi -> catch -> []). Nay man
  //    loi bi loai rieng + ghi run-log, man lanh van chup duoc.
  //    Test: AIO_TEST_GRAB_LOI=<displayId|all> ep nem loi (chi khi --dev/--selftest).
  const ketQua = await Promise.allSettled(displays.map(async (d) => {
    const sf = d.scaleFactor || 1
    const w = Math.round(d.size.width * sf), h = Math.round(d.size.height * sf)
    if ((IS_DEV || IS_SELFTEST) && process.env.AIO_TEST_GRAB_LOI &&
        (process.env.AIO_TEST_GRAB_LOI === 'all' || process.env.AIO_TEST_GRAB_LOI === String(d.id))) {
      throw new Error('AIO_TEST_GRAB_LOI ep loi man ' + d.id)
    }
    const sources = await desktopCapturer.getSources({
      types: ['screen'], thumbnailSize: { width: w, height: h }, fetchWindowIcons: false,
    })
    let src = sources.find((x) => String(x.display_id) === String(d.id))
    if (!src) { const idx = displays.findIndex((x) => x.id === d.id); src = sources[idx] || sources[0] }
    if (!src || !src.thumbnail || src.thumbnail.isEmpty()) return null
    const img = src.thumbnail
    // 14/09: nen dong bang JPEG q92 (37ms) thay PNG (642ms 4K — do that, khong phai
    // ~250ms nhu ghi 26/08; toPNG chay TREN LUONG CHINH nen "grab chay nen" la sai:
    // no chan ca fade lop mo). Anh co shape / vat man: renderer xin cat vung tu
    // `image` GOC qua aioshot://raw (PNG) luc bam Xong -> file luu van lossless.
    return { display: d, image: img, jpg: img.toJPEG(92), sf }
  }))
  const boSung = []
  ketQua.forEach((r, i) => {
    if (r.status === 'fulfilled') { if (r.value) boSung.push(r.value); return }
    ghiLog('LOI grab man ' + displays[i].id + ' (' + displays[i].bounds.width + 'x' + displays[i].bounds.height + '): ' + (r.reason && r.reason.message || r.reason))
  })
  return boSung
}


/* 0.5.0 OVERLAY TAO SAN (pool): tao + nap trang overlay cua MOI man luc app ranh (sau boot,
   sau moi luot chup, sau khi doi man). Bam phim -> chi show() -> overlay hien ~30 ms thay vi
   ~80-100 ms tao moi (do 15/09; truoc 0.5.0 con phai doi grab 400 ms). Pool lech cau hinh
   man (id/bounds/sf) hoac chua nap xong -> roi ve tao moi nhu cu. */
let poolWins = []
let poolKey = ''
let poolTimer = null
function khoaMan(displays) {
  return displays.map((d) => d.id + ':' + d.bounds.x + ',' + d.bounds.y + ',' + d.bounds.width + 'x' + d.bounds.height + '@' + (d.scaleFactor || 1)).join('|')
}
function huyPool() {
  for (const w of poolWins) { if (!w.isDestroyed()) w.destroy() }
  poolWins = []; poolKey = ''
}
function lenLichPool(ms) {
  if (poolTimer) clearTimeout(poolTimer)
  poolTimer = setTimeout(() => { poolTimer = null; taoPool() }, ms)
}
function taoPool() {
  if (process.env.AIO_POOL === '0') return // [do] doi chung: khong tao san
  if (overlayWins.length) { lenLichPool(500); return } // dang chup — de sau
  if (poolWins.length) return
  const displays = screen.getAllDisplays()
  if (!displays.length) return
  poolKey = khoaMan(displays)
  displays.forEach((disp) => {
    const win = taoCuaSoOverlay(disp)
    win._poolReady = false
    win.webContents.once('did-finish-load', () => {
      win._poolReady = true
      // origin gui som de renderer co goc; luc kich hoat gui lai init day du.
      if (!win.isDestroyed()) win.webContents.send('overlay:init', { origin: { x: disp.bounds.x, y: disp.bounds.y }, lamMoKieu: kho.docCauHinh().lamMoKieu || 'mosaic' })
    })
    win.on('closed', () => { poolWins = poolWins.filter((w) => w !== win) })
    poolWins.push(win)
  })
}

/* Tao cua so overlay cho 1 man (chua show, chua init). Dung cho ca pool lan tao moi. */
function taoCuaSoOverlay(disp) {
  const b = disp.bounds
  const win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false, transparent: true, backgroundColor: '#00000000',
    alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    hasShadow: false, enableLargerThanScreen: true, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-overlay.js'),
      contextIsolation: true, sandbox: false, backgroundThrottling: false,
    },
  })
  win._displayId = disp.id
  win._disp = disp
  /* ☠️ Windows KEP cua so non-resizable vao workArea (tru taskbar) NGAY tu
     luc tao: xin 2560x1440 chi duoc 2560x1392 (do that 31/08 tren may 2
     man). Overlay hut 48px day -> anh dong bang (co taskbar) bi nen doc
     ~3% -> taskbar trong anh noi ngay TREN taskbar that = "DOUBLE TASKBAR"
     (anh Tien 31/08 — chinh la bay 25/08 ngay truoc). setBounds lai mot
     lan la thoat kep: man chinh khop tuyet doi, man phu co the DU 1-2px
     do lam tron DPI (du = tran ra ngoai mep, vo hai; HUT moi nen anh). */
  win.setBounds(b)
  win.setAlwaysOnTop(true, 'screen-saver')
  // ☠️ LOAI overlay khoi anh chup (WDA_EXCLUDEFROMCAPTURE): grab chay SAU khi
  // overlay da hien -> khong co dong nay thi LOP MO 42% bi nuong vao anh ->
  // "ket qua hinh bi toi" (anh Tien 26/08). Co dong nay grab ra man hinh SACH.
  win.setContentProtection(true)
  win.loadFile(path.join(__dirname, 'overlay', 'index.html'))
  return win
}

/* Dua cua so overlay (da nap xong) vao luot chup: init + show + kiem hut + selftest. */
function kichHoatOverlay(win, disp, idx, sanSang) {
  if (win.isDestroyed()) return
  const b = disp.bounds
  const wcId = win.webContents.id
  const laSelftest = IS_SELFTEST && idx === 0
  // origin = goc DIP toan cuc cua man nay — renderer quy doi toa do toan cuc.
  win.webContents.send('overlay:init', {
    selftest: laSelftest, origin: { x: b.x, y: b.y },
    // [do] 14/09: selftest co SHAPE (duong cat anh goc aioshot://raw) / VAT 2 MAN (composite raw)
    testShape: laSelftest && process.env.AIO_TEST_SHAPE === '1',
    testComposite: laSelftest && process.env.AIO_TEST_COMPOSITE === '1',
    lamMoKieu: kho.docCauHinh().lamMoKieu || 'mosaic',
  })
  // HIEN NGAY — cua so trong suot, thay man hinh that, lop mo fade vao (CSS).
  if (!win.isVisible()) { win.show(); win.focus() }
  ghiLog('overlay hien ' + disp.id + (sanSang ? ' (san)' : ''))
  // Grab da xong truoc khi overlay nay nap (GRAB_TRUOC) -> gui lai frozen cho no.
  if (layersSanSang) {
    const item = layersSanSang.find((L) => L.x === b.x && L.y === b.y)
    const rec = overlayShots.get(wcId)
    if (item && rec && !rec.image) { const raw = rawStore.get(item.key); if (raw) { rec.image = raw; rec.sf = item.sf } }
    win.webContents.send('overlay:frozen', { layers: layersSanSang })
  }
  // Che do cu (AIO_GRAB_TRUOC=0): grab SAU khi overlay hien + lop mo toi xong.
  if (!GRAB_TRUOC) setTimeout(kickGrab, GRAB_TRE_MS)
  /* CHOT CHAN (31/08, sau khi bay 25/08 TAI DIEN thanh "double taskbar"):
     cua so HUT so voi man = anh dong bang bi nen = taskbar doi. Do that
     MOI lan mo — hut la ghi CANH BAO vao run-log, khoi doan mo lan sau. */
  setTimeout(() => {
    if (win.isDestroyed()) return
    const wb = win.getBounds()
    if (wb.width < b.width || wb.height < b.height) {
      ghiLog('CANH BAO overlay HUT man ' + disp.id + ': xin ' +
        b.width + 'x' + b.height + ' duoc ' + wb.width + 'x' + wb.height)
    }
  }, 200)
  if (laSelftest) setTimeout(() => saveCapture(win, 'selftest-overlay.png'), 900)
}

function openOverlays(displays) {
  const key = khoaMan(displays)
  const dungPool = poolWins.length === displays.length && poolKey === key &&
    poolWins.every((w) => !w.isDestroyed() && w._poolReady)
  if (!dungPool && poolWins.length) { ghiLog('pool overlay lech (' + (poolKey === key ? 'chua nap' : 'doi man') + ') -> tao moi'); huyPool() }
  displays.forEach((disp, idx) => {
    const win = dungPool ? poolWins.find((w) => w._displayId === disp.id) : taoCuaSoOverlay(disp)
    overlayWins.push(win)
    // ☠️ Nho wcId NGAY BAY GIO — 'closed' thi webContents da huy (vap 24-25/08).
    const wcId = win.webContents.id
    // image = null luc dau; grab xong (song song) moi dien vao de cat.
    overlayShots.set(wcId, { display: disp, sf: disp.scaleFactor || 1, image: null })
    win.on('closed', () => {
      overlayShots.delete(wcId)
      overlayWins = overlayWins.filter((w) => w !== win)
    })
    if (dungPool) kichHoatOverlay(win, disp, idx, true)
    else win.webContents.once('did-finish-load', () => kichHoatOverlay(win, disp, idx, false))
  })
  if (dungPool) { poolWins = []; poolKey = '' }
}

function closeOverlay() {
  // 04/10 (ECC soat): dong man chup GIUA luc dang keo (Esc khi con giu chuot) thi khong co 'overlay:drag-end' nao toi
  // -> hen gio 16 ms chay mai, va luot chup SAU nhan khung chon tinh tu diem neo CU truoc khi nguoi dung bam chuot.
  if (dragTimer) { clearInterval(dragTimer); dragTimer = null }
  dragAnchor = null
  dragOwnerId = null
  for (const w of overlayWins) { if (!w.isDestroyed()) w.close() }
  overlayWins = []
  pending = null
  frozenStore.clear(); rawStore.clear() // JPEG ~1MB + NativeImage goc ~32MB/man 4K — khong giu sau khi chup
  lenLichPool(400) // 0.5.0: tao san overlay cho luot sau
}

/* ---------------------------------------------------------------------- */
/* Overlay -> xac nhan vung chon -> tao cua so GHIM                        */
/* ---------------------------------------------------------------------- */

// Renderer gui { rect } (khong ve shape -> main cat full-res, net) HOAC
// { dataUrl } (co ve shape -> renderer da ghep san bang canvas).
/* 29/09 DOC CHU (phim 5 tren man khoanh vung): cat DUNG VUNG tu anh GOC (rawStore; raw chua ve thi cho toi 1,5 s roi
   dung JPEG dong bang), PHONG x2 khi man < 200% (do 29/09: anh thu 50% doc 51 dong, phong x2 doc 77 dong, "Offers and
   announcements" tu cut -> du), roi src/ocr.js. Ben goi (overlay) PHAI kiem ok. */
function daoNeuNenToi(img) {
  const s = img.getSize(), b = img.toBitmap() // BGRA
  let tong = 0, dem = 0
  for (let i = 0; i < b.length; i += 4 * 7) { tong += 0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2]; dem++ }
  if (!dem || tong / dem >= 128) return { img, dao: false }
  for (let i = 0; i < b.length; i += 4) {
    const y = 255 - Math.round(0.114 * b[i] + 0.587 * b[i + 1] + 0.299 * b[i + 2])
    b[i] = b[i + 1] = b[i + 2] = y
  }
  return { img: nativeImage.createFromBitmap(b, { width: s.width, height: s.height }), dao: true }
}
ipcMain.handle('overlay:ocr', async (_e, q) => {
  const t0 = Date.now()
  try {
    let img = rawStore.get(q.key)
    for (let i = 0; (!img || img.isEmpty()) && i < 15; i++) { await new Promise((r) => setTimeout(r, 100)); img = rawStore.get(q.key) }
    if ((!img || img.isEmpty()) && frozenStore.get(q.key)) img = nativeImage.createFromBuffer(frozenStore.get(q.key))
    if (!img || img.isEmpty()) return { ok: false, loi: 'chua co anh goc' }
    const sz = img.getSize()
    const x = Math.max(0, Math.min(Math.round(q.x), sz.width - 1)), y = Math.max(0, Math.min(Math.round(q.y), sz.height - 1))
    const w = Math.max(1, Math.min(Math.round(q.w), sz.width - x)), h = Math.max(1, Math.min(Math.round(q.h), sz.height - y))
    let vung = img.crop({ x, y, width: w, height: h })
    // Bo doc (anh chot lai 29/09 16:1x "luon Tesseract"): Windows -> LUON Tesseract. Ban dau chon theo ngon ngu app,
    // nhung anh de app tieng Anh ma doc noi dung tieng Viet -> 2 lan bam 5 deu ra bo doc Windows, mat dau. Do tren doan
    // chuan 1.226 ky tu (nen toi kieu khung chat): Windows sai ~20%, Tesseract sai 0,2-0,7%. Mac: Apple Vision.
    // q.cach = nguoi dung bam nut doi bo doc tren bang.
    const cach = q.cach === 'tesseract' || q.cach === 'he-thong' ? q.cach
      : (process.platform === 'win32' ? 'tesseract' : 'he-thong')
    // Phong: bo doc he thong x2 khi man < 200%. Tesseract x1,5 chi khi man ~100% (thoi gian tang theo so diem anh:
    // vung 1447x666 = 0,9 s), tran 4,5 trieu diem anh.
    let k = cach === 'tesseract' ? ((q.sf || 1) < 1.2 ? 1.5 : 1) : ((q.sf || 1) >= 2 ? 1 : 2)
    k = Math.max(1, Math.min(k, 9000 / Math.max(w, h), Math.sqrt(4.5e6 / (w * h))))
    if (k > 1.05) vung = vung.resize({ width: Math.round(w * k), height: Math.round(h * k), quality: 'best' })
    // Nen TOI (chu sang) + Tesseract -> dao thanh chu toi nen sang, thang xam. Do 29/09: cung do dung (sai 0,2-0,7%)
    // ma nhanh gap doi (2,2-3,0 s -> 1,2-1,5 s) vi Tesseract khong phai tu thu dao mau.
    let dao = false
    if (cach === 'tesseract') { const d = daoNeuNenToi(vung); vung = d.img; dao = d.dao }
    const kq = await ocr.docChu(vung.toPNG(), cach)
    kq.daoMau = dao
    kq.coTheDoi = process.platform === 'win32' // Mac: Apple Vision doc duoc tieng Viet, khong can doi
    ghiLog('ocr ' + w + 'x' + h + ' x' + k.toFixed(2) + ' ' + cach + (dao ? ' dao-mau' : '') + ': ' + (kq.ok ? kq.dong.length + ' dong' : 'LOI ' + kq.loi) +
      ' bo doc=' + (kq.boDoc || '?') + ' doc ' + kq.ms + ' ms, tong ' + (Date.now() - t0) + ' ms')
    return kq
  } catch (err) {
    ghiLog('ocr LOI: ' + err.message)
    return { ok: false, loi: err.message }
  }
})
ipcMain.on('overlay:copy-text', (_e, s) => { if (typeof s === 'string') clipboard.writeText(s) })

ipcMain.on('overlay:confirm', (e, payload) => {
  const shot = overlayShots.get(e.sender.id)
  ghiLog('confirm tu display=' + (shot && shot.display ? shot.display.id : '?') +
    ' kieu=' + (payload && payload.dataUrl ? 'dataUrl(' + payload.dataUrl.length + ')' : 'rect') +
    (payload && payload.rect ? ' rect=' + JSON.stringify(payload.rect) : ''))
  handleConfirm(e.sender.id, payload)
})

/* 04/10 (ECC soat): handleConfirm tung co 5 loi thoat IM LANG sau khi da dong man chup — nguoi dung bam Xong, man
   chup dong lai, khong co anh, khong log, khong thong bao. Nay moi loi thoat deu ghi log; 4 loi chac chan mat anh thi
   bao them "khong chup duoc". `chiGhiLog`: loi "khong con ban ghi cua man chup" KHONG bao — overlay.js khong chan gui
   Xong hai lan (Enter dup), lenh thu hai den sau khi luot dau da luu anh ma bao thi la BAO NHAM. */
function boLuotChup(lyDo, chiGhiLog) {
  ghiLog('LOI confirm: ' + lyDo + ' — bo luot chup')
  if (!chiGhiLog && Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('app.khongChupDuoc') }).show()
}

async function handleConfirm(wcId, payload) {
  const shot = overlayShots.get(wcId)
  const display = shot && shot.display
  const sf = shot ? shot.sf : 1
  closeOverlay()
  if (!display) { boLuotChup('khong con ban ghi cua man chup ' + wcId + ' (lenh Xong thu hai sau khi man chup da dong?)', true); return }
  if (!payload) { boLuotChup('khong co du lieu vung chon'); return }

  // 28/09: dang bat Multi-Shot Storyboard (nut/phim S tren khung chon) -> QUAY 3 GIAY vung nay thay vi chup 1 tam.
  if (payload.storyboard && payload.rect) { quay3Giay(display, sf, payload.rect); return }
  // 01/10: nut Quay / phim R tren khung chon -> QUAY VIDEO vung nay toi khi bam Dung (MP4, khay video rieng).
  // ☠️ Ham async goi khong await: loi nem ben trong KHONG len uncaughtException (quy tac 1 trong CLAUDE.md app) ->
  //    phai .catch, khong thi `ghiHinh` ket mai va phim tat chup chet toi khi mo lai app.
  //    01/10 10:4x anh chot: quay LUON co tieng may (tham so thu 3 = true); chon co / khong tieng nam trong Khay video.
  if (payload.quay && payload.rect) { batDauGhiHinh(display, payload.rect, true).catch(huyGhiHinhLoi); return }

  let cropped

  // Truong hop CO VE SHAPE: renderer da ghep (crop + shape) roi gui dataURL.
  if (payload.dataUrl) {
    try { cropped = nativeImage.createFromDataURL(payload.dataUrl) } catch (e) { cropped = null }
    if (!cropped || cropped.isEmpty()) { boLuotChup('anh da ve gui len bi rong (' + payload.dataUrl.length + ' ky tu)'); return }
  } else {
    // Khong ve shape: cat tu anh GOC full-res (net khong mat).
    const rect = payload.rect
    if (!rect) { boLuotChup('khong co vung chon lan anh da ve'); return }
    // Anh dong bang co the CHUA grab xong (chon nhanh hon ~0,5s). Cho.
    let image = shot.image
    if (!image) {
      if (!grabPromise) kickGrab()
      const list = grabPromise ? await grabPromise : []
      const item = list.find((x) => x.display.id === display.id)
      image = item && item.image
    }
    if (!image) {
      // ☠️ 10/09: man nay khong co anh (grab man do loi) -> bao, dung return trang.
      ghiLog('LOI confirm: man ' + display.id + ' khong co anh grab — bo luot chup')
      if (Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('app.khongChupDuoc') }).show()
      return
    }
    // ☠️ Quy doi theo kich thuoc anh THAT (desktopCapturer co the tra anh khong
    // dung co native) — k = anh-that / (DIP man * sf).
    const isz = image.getSize()
    const kx = isz.width / (display.bounds.width * sf)
    const ky = isz.height / (display.bounds.height * sf)
    const cx = Math.max(0, Math.round(rect.x * sf * kx))
    const cy = Math.max(0, Math.round(rect.y * sf * ky))
    const cw = Math.max(1, Math.round(rect.w * sf * kx))
    const ch = Math.max(1, Math.round(rect.h * sf * ky))
    try {
      cropped = image.crop({ x: cx, y: cy, width: cw, height: ch })
    } catch (err) {
      boLuotChup('cat vung ' + cw + 'x' + ch + ' tai ' + cx + ',' + cy + ' loi: ' + (err && err.message || err))
      return
    }
    if (!cropped || cropped.isEmpty()) { boLuotChup('vung cat ' + cw + 'x' + ch + ' tai ' + cx + ',' + cy + ' ra anh rong'); return }
  }

  // 0) Ctrl+C: copy vao clipboard luon (them, ngoai Enter/nut check) — anh Tien
  //    25/08. Van vao khay binh thuong o duoi.
  if (payload.copy) { try { clipboard.writeImage(cropped) } catch (e) {} }

  // 1) Luu file THAT tren dia truoc — tat app khong mat anh. Dinh dang theo
  //    cai dat nguoi dung (JPEG/PNG + chat luong).
  const filePath = kho.luuAnh(cropped, layDinhDangAnh())
  const _sz = cropped.getSize()
  if (!filePath) {
    // ☠️ 10/09: luuAnh tra null (o day / mat quyen / thu muc hong). Truoc day
    //    path.basename(null) nem TypeError trong ham async khong await ->
    //    unhandled rejection: main KHONG vang (do that Electron 43) nhung anh
    //    MAT IM LANG: khong vao khay, khong log, khong bao. Nay: bao han +
    //    giu anh trong clipboard + van vao khay (khay giu anh trong RAM, keo
    //    ra ngoai tu khoa vi khong co filePath).
    ghiLog('LOI luu anh: khong ghi duoc vao ' + kho.thuMucAnh() + ' ' + _sz.width + 'x' + _sz.height)
    try { clipboard.writeImage(cropped) } catch (e) {}
    if (Notification.isSupported()) {
      new Notification({ title: 'AiO Shot & Save', body: T('app.khongLuuDuoc').replace('{thuMuc}', kho.thuMucAnh()) }).show()
    }
  } else {
    ghiLog('luu ' + path.basename(filePath) + ' ' + _sz.width + 'x' + _sz.height)
  }
  // 2) Vao khay (cho gom moi tam da chup). Khay tu hien len.
  //    ☠️ Anh Tien chot 25/08: chup xong CHI vao khay, KHONG bung anh ghim noi.
  //    Muon ghim len man hinh thi bam thumbnail trong khay (shelf:pin van con).
  shelfAdd(cropped, filePath)

  // [selftest] Van chay duong GHIM de kiem (that: bam thumbnail se goi ham nay).
  // Khoi selftest o day cung lo chup selftest-pin/shelf.png + thoat app.
  if (IS_SELFTEST) {
    const sz = cropped.getSize()
    createPinWindow(cropped, 100, 100, sz.width, sz.height, filePath)
  }
}

ipcMain.on('overlay:cancel', () => { ghiLog('cancel'); closeOverlay() })

/* ---------------------------------------------------------------------- */
/* KEO CUA SO — dung chung cho khay va cua so ghim                         */
/* ---------------------------------------------------------------------- */

/* ☠️ VAP 24/08 — anh Tien: *"drag cai khay la cang keo no tu scale to ra"*.
   Do that (`--selftest-drag`): 380x128 -> 384x252, moi buoc keo CAO THEM 1px.

   Goc: man hinh chinh chay DPI 1.25. Cach cu moi buoc lai `getPosition()` roi
   `setPosition()` — moi vong la mot lan doi DIP <-> pixel that, va SAI SO LAM
   TRON CONG DON vao kich thuoc.

   Chua: NEO bounds MOT LAN luc bat dau keo. Moi buoc tinh vi tri TUYET DOI tu
   neo do va `setBounds` co khai bao width/height — sai so khong con cho de
   tich luy. Tuyet doi KHONG doc lai `getPosition()` giua chung. */

/** webContents.id -> bounds luc bat dau keo. */
const dragAnchors = new Map()

function batDauKeo(win, wcId) {
  if (!win || win.isDestroyed()) return
  dragAnchors.set(wcId, win.getBounds())
}

function keoDen(win, wcId, tongDx, tongDy) {
  if (!win || win.isDestroyed()) return
  const neo = dragAnchors.get(wcId)
  if (!neo) return
  win.setBounds({
    x: neo.x + Math.round(tongDx),
    y: neo.y + Math.round(tongDy),
    width: neo.width,   // khoa cung — khong cho phinh
    height: neo.height,
  })
}

function ketThucKeo(wcId) {
  dragAnchors.delete(wcId)
}

/* ---------------------------------------------------------------------- */
/* Cua so GHIM (sticky)                                                    */
/* ---------------------------------------------------------------------- */

const PIN_PAD = 12 // le trong suot quanh anh de co bong + goc bo tron

function createPinWindow(image, screenX, screenY, dipW, dipH, filePath) {
  const win = new BrowserWindow({
    x: screenX - PIN_PAD,
    y: screenY - PIN_PAD,
    width: dipW + PIN_PAD * 2,
    height: dipH + PIN_PAD * 2,
    frame: false, transparent: true, backgroundColor: '#00000000',
    alwaysOnTop: true, skipTaskbar: true, resizable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    hasShadow: false, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-pin.js'),
      contextIsolation: true, sandbox: false,
    },
  })
  win.setAlwaysOnTop(true, 'screen-saver')

  const dataUrl = image.toDataURL()

  // ☠️ Nho `id` NGAY BAY GIO. Trong handler 'closed', `win.webContents` da bi
  // huy — doc `.id` tu no nem "Object has been destroyed" (vap 24/08).
  const wcId = win.webContents.id
  pins.set(wcId, { image, filePath, win, dipW, dipH }) // dipW/dipH: de tra anh ghim ve ban cu khi luu sua hong (04/10)

  win.loadFile(path.join(__dirname, 'pin', 'index.html'))
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('pin:data', { dataUrl, pad: PIN_PAD, w: dipW, h: dipH, lamMoKieu: kho.docCauHinh().lamMoKieu || 'mosaic' })
    win.show()

    // Tu kiem: chup ghim + KHAY -> dong ghim (duong da lam sap app) -> thoat.
    if (IS_SELFTEST) {
      setTimeout(() => saveCapture(win, 'selftest-pin.png'), 1000)
      setTimeout(() => saveCapture(shelfWin, 'selftest-shelf.png'), 1300)
      setTimeout(() => { if (!win.isDestroyed()) win.close() }, 1700)
      setTimeout(() => forceQuit(), 2400)
    }
  })
  win.on('closed', () => { pins.delete(wcId) })
}

ipcMain.on('pin:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w) w.close()
})

ipcMain.on('pin:copy', (e) => {
  const rec = pins.get(e.sender.id)
  if (rec && rec.image) clipboard.writeImage(rec.image)
})

/* KEO-THA ra app khac: keo anh ghim -> tha file .png that vao Premiere / Zalo /
   Messenger... `startDrag` PHAI goi trong nhip dragstart that cua nguoi dung
   (renderer chan default roi goi sang day), va icon BAT BUOC khong rong. */
ipcMain.on('pin:start-drag', (e) => {
  const rec = pins.get(e.sender.id)
  if (!rec || !rec.filePath) return
  try {
    const duong = kho.duongDanKeoAnToan(rec.filePath)
    if (duong !== rec.filePath) ghiLog('keo qua lien ket an toan: ' + duong)
    e.sender.startDrag({ file: duong, icon: rec.image.resize({ height: 96 }) })
  } catch (err) { if (IS_DEV) console.error('[shotandsave] pin startDrag loi', err) }
})

/* VE khung/mui ten len anh ghim (anh Tien 26/08): renderer ghep xong gui dataURL
   do phan giai THAT -> ghi de file (dung dinh dang cua chinh file do) + cap nhat
   anh trong bo nho (copy/keo-tha dung ban moi) + lam moi thumbnail khay. */
/* 04/10 (ECC soat): ban cu doi anh trong bo nho + thumbnail khay TRUOC roi moi ghi file, ghi hong chi co 1 dong log ->
   anh ghim + khay hien ban DA lam mo / da ve trong khi file keo di van la ban CU (chua mo), khong ai biet. Ghi thang
   vao file that nen hong giua chung la file cut. Nay: GHI FILE TRUOC, atomic (kho.ghiDeAnh); thanh cong roi moi doi
   anh trong bo nho + khay + lam moi lien ket .keo. Hong: tra anh ghim ve ban dang co trong file + HOP THOAI noi ro
   -> hinh tren man luon giong file se gui di. */
function hoanTacSuaPin(rec, lyDo) {
  ghiLog('pin ve-xong LOI (' + lyDo + ') -> tra anh ghim ve ban dang co trong file')
  const win = rec.win
  if (!win || win.isDestroyed()) return
  try {
    win.webContents.send('pin:data', {
      dataUrl: rec.image.toDataURL(), pad: PIN_PAD, w: rec.dipW, h: rec.dipH,
      lamMoKieu: kho.docCauHinh().lamMoKieu || 'mosaic',
    })
  } catch (err) { ghiLog('pin hoan tac LOI: ' + err.message) }
  dialog.showMessageBox(win, {
    type: 'warning', title: 'AiO Shot & Save',
    message: T('pin.khongLuuSua'), detail: T('pin.khongLuuSuaCt'),
    buttons: [T('pin.daHieu')], defaultId: 0, noLink: true,
  }).catch((err) => ghiLog('pin hop thoai LOI: ' + err.message))
}

ipcMain.on('pin:save-edit', (e, dataUrl) => {
  const rec = pins.get(e.sender.id)
  if (!rec || !dataUrl) return
  let daVe = null
  try { daVe = nativeImage.createFromDataURL(dataUrl) } catch (err) { daVe = null }
  if (!daVe || daVe.isEmpty()) { hoanTacSuaPin(rec, 'anh ve rong'); return }

  // Ghi de DUNG file cu, giu dinh dang theo duoi file (.png / .jpg). GHI TRUOC — thanh cong moi doi trang thai.
  if (rec.filePath) {
    let buf = null
    try {
      const laPng = /\.png$/i.test(rec.filePath)
      const dd = layDinhDangAnh()
      buf = laPng ? daVe.toPNG() : daVe.toJPEG((dd && dd.q) || 85)
    } catch (err) { buf = null }
    const r = buf && buf.length ? kho.ghiDeAnh(rec.filePath, buf) : { ok: false, loi: 'khong ma hoa duoc anh' }
    if (!r.ok) { hoanTacSuaPin(rec, 'ghi file ' + path.basename(rec.filePath) + ': ' + r.loi); return }
    const n = kho.lamMoiKeo(rec.filePath) // file moi doi ten vao cho cu -> lien ket .keo (neu co) phai noi lai
    ghiLog('pin ve-xong ghi de ' + path.basename(rec.filePath) +
      (r.cach === 'ghi-thang' ? ' (GHI THANG vi khong doi ten duoc: ' + r.loiDoiTen + ')' : '') +
      (n ? ' (lam moi ' + n + ' lien ket keo)' : ''))
  }

  // Doi anh trong bo nho cua anh ghim + cap nhat DUNG muc khay cua no (thumbnail + dung luong). 04/10: anh chua luu
  // duoc (filePath null) khop theo doi tuong anh; truoc day "null === null" khop moi muc chua luu (src/khay-muc.js).
  for (const it of apDungSuaVaoKhay(shelfItems.values(), rec, daVe, thumbKhay)) {
    let kb = 0
    try { kb = Math.round(fs.statSync(it.filePath).size / 1024) } catch (err) {}
    if (shelfWin && !shelfWin.isDestroyed()) {
      shelfWin.webContents.send('shelf:update', { id: it.id, thumb: it.thumb, w: it.w, h: it.h, kb })
    }
  }
})

ipcMain.on('pin:opacity', (e, value) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w) w.setOpacity(Math.max(0.2, Math.min(1, value)))
})

ipcMain.on('pin:drag-start', (e) => {
  batDauKeo(BrowserWindow.fromWebContents(e.sender), e.sender.id)
})
ipcMain.on('pin:drag-to', (e, tongDx, tongDy) => {
  keoDen(BrowserWindow.fromWebContents(e.sender), e.sender.id, tongDx, tongDy)
})
ipcMain.on('pin:drag-end', (e) => ketThucKeo(e.sender.id))
/* 14/09: chan doan "khong ve duoc tren anh ghim" — renderer pin gui tung buoc
   (phim / vao che do ve / chuot bam roi vao dau) de doc run-log thay vi doan. */
ipcMain.on('pin:log', (e, m) => ghiLog('[pin ' + e.sender.id + '] ' + m))

/* ---------------------------------------------------------------------- */
/* KHAY ANH — cho gom moi tam da chup                                      */
/* ---------------------------------------------------------------------- */

const SHELF_W = 380
/* Thumbnail gui sang khay (14/09): o anh CO DINH (khay to = them hang/cot), JPEG q88
   320px cao (~30-60KB/anh). Truoc 128px PNG: mo khi o dọc rong. Anh nho hon thi giu nguyen. */
const THUMB_H = 320 /* o co dinh: ngang 64 DIP (96px thiet bi), doc cot toi da ~324 DIP -> 320 cao du net */
function thumbKhay(img) {
  const sz = img.getSize()
  // Anh DOC hien cao toi 340 DIP trong khay doc (15/09) -> thumb cao hon cho net (x1.5 DPR = 510px).
  const tran = sz.height > sz.width ? THUMB_H * 2 : THUMB_H
  const h = Math.min(tran, sz.height || tran)
  return 'data:image/jpeg;base64,' + img.resize({ height: h, quality: 'best' }).toJPEG(88).toString('base64')
}
const SHELF_H = 128
// Khay DOC (anh Tien 26/08): anh to hon (chiem ca be ngang), nhieu anh cuon DOC.
const SHELF_DOC_W = 252
const SHELF_DOC_H = 448

function kieuKhay() { return kho.docCauHinh().khayKieu === 'doc' ? 'doc' : 'ngang' }
/* Co NHO NHAT (san) cua khay = co mac dinh cu — anh Tien 14/09: "mac dinh nho
   hien tai on roi, khoa lai". */
function coKhayMin() {
  return kieuKhay() === 'doc' ? { w: SHELF_DOC_W, h: SHELF_DOC_H } : { w: SHELF_W, h: SHELF_H }
}
/* Co LON NHAT (tran) = 60% workArea cua MAN DANG CHUA KHAY (khong phai man chinh:
   may anh Tien man phu 2048x1152 logical nho hon man chinh 2560x1440, lay theo man
   chinh la khay tran khoi man phu — harness do-co-khay bat duoc 14/09). */
function coKhayMax() {
  const d = (shelfWin && !shelfWin.isDestroyed())
    ? screen.getDisplayMatching(shelfWin.getBounds())
    : screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const wa = d.workArea
  return { w: Math.round(wa.width * 0.6), h: Math.round(wa.height * 0.6) }
}
/* Co khay dang dung: lay tu config `khayCo[kieu]` (nguoi dung da keo to), kep
   trong [san, tran]; chua co thi = san. Luu RIENG tung kieu doc/ngang. */
function coKhay() {
  const min = coKhayMin(), max = coKhayMax()
  const luu = (kho.docCauHinh().khayCo || {})[kieuKhay()]
  const kep = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)))
  if (luu && Number.isFinite(luu.w) && Number.isFinite(luu.h)) {
    return { w: kep(luu.w, min.w, max.w), h: kep(luu.h, min.h, max.h) }
  }
  return { w: min.w, h: min.h }
}
const SHELF_MARGIN = 16 // cach mep man hinh khi lan dau

/** Vi tri mo khay: lay tu cau hinh, khong co thi goc phai duoi man hinh chinh. */
function viTriKhay() {
  const luu = kho.docCauHinh().viTriKhay
  if (luu && Number.isFinite(luu.x) && Number.isFinite(luu.y) && trongManHinh(luu)) {
    return luu
  }
  const wa = screen.getPrimaryDisplay().workArea
  return {
    x: wa.x + wa.width - coKhay().w - SHELF_MARGIN,
    y: wa.y + wa.height - coKhay().h - SHELF_MARGIN,
  }
}

/** Vi tri da luu co con nam tren mot man hinh nao khong (thao man hinh phu). */
function trongManHinh(p) {
  return screen.getAllDisplays().some((d) => {
    const b = d.workArea
    return p.x < b.x + b.width && p.x + coKhay().w > b.x &&
           p.y < b.y + b.height && p.y + coKhay().h > b.y
  })
}

let daNapAnhGanNhat = false

function layDanhSachAnhGanNhat(soLuong) {
  if (!soLuong || soLuong <= 0) return []
  try {
    const dir = kho.thuMucAnh()
    if (!fs.existsSync(dir)) return []
    const files = fs.readdirSync(dir)
      // 29/09 anh chot "tach han": file dai Storyboard KHONG vao khay anh thuong (dai nam o khay Storyboard)
      .filter((f) => /\.(png|jpe?g)$/i.test(f) && !f.startsWith('.') && !f.startsWith('shotandsave-storyboard-'))
      .map((f) => {
        const full = path.join(dir, f)
        let mtime = 0
        try { mtime = fs.statSync(full).mtimeMs } catch (e) {}
        return { name: f, path: full, mtime }
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, soLuong)
    return files
  } catch (err) {
    ghiLog('layDanhSachAnhGanNhat loi: ' + err.message)
    return []
  }
}

/* ☠️ 27/09 (0.6.5, Claude ra soat ban Gemini): lan chup DAU sau khi mo app, shelfAdd() goi
   ensureShelf() -> ham nay quet thu muc SAU khi anh moi da luu -> nap luon anh do, roi shelfAdd
   them no lan nua = anh vua chup hien 2 lan trong khay. Nay shelfAdd goi truoc voi `boQua` =
   file vua luu; so khop theo duong dan chuan hoa (Windows khong phan biet hoa thuong). */
const khoaDuongDan = (p) => {
  const r = path.resolve(String(p || ''))
  return process.platform === 'win32' ? r.toLowerCase() : r
}
function napAnhGanNhatVaoKhay(boQua) {
  if (daNapAnhGanNhat) return
  daNapAnhGanNhat = true
  const c = kho.docCauHinh()
  const soLuong = typeof c.khaySoAnh === 'number' ? c.khaySoAnh : 5
  if (soLuong <= 0) return

  const khoaBoQua = boQua ? khoaDuongDan(boQua) : ''
  const files = layDanhSachAnhGanNhat(soLuong + (khoaBoQua ? 1 : 0))
    .filter((f) => !khoaBoQua || khoaDuongDan(f.path) !== khoaBoQua)
    .slice(0, soLuong)
  if (!files.length) return

  // Xep theo thu tu thoi gian cu truoc -> moi sau de gan so thu tu #1, #2...
  const filesChrono = files.reverse()
  for (const f of filesChrono) {
    let img
    try { img = nativeImage.createFromPath(f.path) } catch (e) {}
    if (!img || img.isEmpty()) continue
    const id = ++shelfSeq
    shelfItems.set(id, taoMucKhay(id, img, f.path, thumbKhay)) // 04/10: chi giu anh nho, anh goc doc lai tu file khi ghim
  }
  ghiLog('tu dong nap ' + shelfItems.size + ' anh gan nhat vao khay')
}

function ensureShelf() {
  napAnhGanNhatVaoKhay()
  if (shelfWin && !shelfWin.isDestroyed()) return shelfWin

  const pos = viTriKhay()
  const co = coKhay()
  shelfWin = new BrowserWindow({
    x: pos.x, y: pos.y, width: co.w, height: co.h,
    frame: false, transparent: true, backgroundColor: '#00000000',
    alwaysOnTop: true, skipTaskbar: true, resizable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    hasShadow: false, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-shelf.js'),
      contextIsolation: true, sandbox: false,
      /* 04/10 Mac (anh: "animation o goc khi bam mo ra bi giat, khong muot nhu ban Windows"): cua so khay vua duoc HIEN lai
         sau khi an thi trang bi ham ve — do bang khay-bung-that.cjs: hien roi bung ngay = 3 / 6 / 13 khung trong ~0,5 giay;
         cua so van hien = 25 / 25 / 24; tat ham = 24 / 23 / 24 / 24. Trang khay khong co vong ve nao chay lien tuc nen
         tat ham khong ton CPU luc khay an. */
      backgroundThrottling: false,
    },
  })
  shelfWin.setAlwaysOnTop(true, 'screen-saver')
  shelfWin.loadFile(path.join(__dirname, 'shelf', 'index.html'))
  shelfWin.webContents.once('did-finish-load', () => {
    if (shelfItems.size && shelfWin && !shelfWin.isDestroyed()) {
      for (const it of shelfItems.values()) {
        let kb = 0
        try { kb = Math.round(fs.statSync(it.filePath).size / 1024) } catch (e) {}
        shelfWin.webContents.send('shelf:add', {
          id: it.id, seq: it.seq || it.id, thumb: it.thumb, filePath: it.filePath,
          w: it.w, h: it.h, kb,
        })
      }
    }
  })
  shelfWin.on('closed', () => { shelfWin = null })
  return shelfWin
}

/**
 * Hien khay MA KHONG cuop focus — nguoi dung dang dung Premiere, keo focus
 * sang khay la lam gian doan viec cua ho.
 */
function showShelf() {
  const w = ensureShelf()
  // 01/10: khay dang la NUT TRON o goc -> bung ra kieu "ong kinh" (src/khay-thu.js); khong thi hien thang nhu cu
  if (khayThu.trangThai() === 'thu') { khayThu.bung('hien khay'); return }
  if (!w.isVisible()) khayThu.hienThang(w)
  khayThu.chamVao()
}

/** Them mot anh vao khay (goi sau khi da luu file). */
function shelfAdd(image, filePath) {
  napAnhGanNhatVaoKhay(filePath)   // truoc ensureShelf: nap anh cu, TRU anh vua chup (0.6.5)
  const w = ensureShelf()
  const id = ++shelfSeq
  /* 04/10 (ECC soat, DA DO): khay KHONG giu anh goc nua. `image` la manh cat cua khung man hinh; giu no la ghim ca
     khung ~32 MB (20 anh trong khay = 705 MB RAM). Muc chi giu anh nho + kich thuoc; bam ghim thi doc lai tu file.
     Luu hong (filePath null) thi muc van giu anh trong RAM. Xem src/khay-muc.js. */
  const muc = taoMucKhay(id, image, filePath, thumbKhay)
  shelfItems.set(id, muc)

  // Thumbnail nho de gui qua IPC cho nhe.
  const thumb = muc.thumb
  // Kem kich thuoc + dung luong de khay hien cho nguoi dung (anh Tien 26/08).
  const sz = { width: muc.w, height: muc.h }
  let kb = 0
  try { kb = Math.round(fs.statSync(filePath).size / 1024) } catch (e) {}

  const send = () => w.webContents.send('shelf:add', { id, seq: id, thumb, filePath, w: sz.width, h: sz.height, kb })
  if (w.webContents.isLoading()) {
    w.webContents.once('did-finish-load', send)
  } else {
    send()
  }
  showShelf()
}

ipcMain.on('shelf:pin', (e, id) => {
  const it = shelfItems.get(id)
  if (!it) return
  const anh = anhMucKhay(it, nativeImage) // 04/10: khay chi giu anh nho -> doc lai anh goc tu file
  if (!anh) {
    // File da bi xoa / doi cho ngoai app -> khong ghim duoc. Bo muc khoi khay + BAO, khong im lang.
    ghiLog('khay: KHONG doc duoc anh de ghim ' + path.basename(it.filePath || '(khong co file)') + ' -> bo khoi khay')
    shelfItems.delete(id)
    if (shelfItems.size === 0) shelfSeq = 0
    try { e.sender.send('shelf:removed', id) } catch (err) {}
    if (Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('khay.anhKhongCon') }).show()
    return
  }
  // Dat gan giua man hinh dang co con tro, xep chong nhe cho de nhin.
  const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const size = anh.getSize()
  const scale = d.scaleFactor || 1
  const dipW = Math.round(size.width / scale)
  const dipH = Math.round(size.height / scale)
  const off = (cascade++ % 6) * 24
  const x = d.workArea.x + Math.round((d.workArea.width - dipW) / 2) + off
  const y = d.workArea.y + Math.round((d.workArea.height - dipH) / 2) + off
  createPinWindow(anh, x, y, dipW, dipH, it.filePath)
})

/* KEO-THA tu KHAY ra app khac. Cung `startDrag` nhu pin, nguon la item khay. */
ipcMain.on('shelf:start-drag', (e, id) => {
  const it = shelfItems.get(id)
  if (!it || !it.filePath) return
  try {
    const duong = kho.duongDanKeoAnToan(it.filePath)
    if (duong !== it.filePath) ghiLog('keo qua lien ket an toan: ' + duong)
    // 04/10: bieu tuong keo lay tu anh nho cua khay (khay khong con giu anh goc); anh nho hong thi doc lai tu file
    let icon = null
    try { icon = nativeImage.createFromDataURL(it.thumb) } catch (err) { icon = null }
    if (!icon || icon.isEmpty()) icon = anhMucKhay(it, nativeImage)
    if (!icon || icon.isEmpty()) { ghiLog('khay keo LOI: khong tao duoc bieu tuong cho ' + path.basename(it.filePath)); return }
    e.sender.startDrag({ file: duong, icon: icon.resize({ height: 96 }) })
  } catch (err) { ghiLog('khay keo LOI: ' + err.message) }
})

ipcMain.on('shelf:remove', (e, id) => {
  // CHI bo khoi khay — file tren dia GIU NGUYEN (xoa file cua nguoi dung phai
  // do chinh ho quyet dinh, khong phai mot cu bam nham trong khay).
  shelfItems.delete(id)
  if (shelfItems.size === 0) shelfSeq = 0
  e.sender.send('shelf:removed', id)
})

ipcMain.on('shelf:clear', (e) => {
  shelfItems.clear()
  shelfSeq = 0
  e.sender.send('shelf:cleared')
})

ipcMain.on('shelf:open-folder', () => {
  try {
    shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh()))
  } catch (err) {
    console.error('[shotandsave] khong mo duoc thu muc:', err)
  }
})

/* 01/10 KHAY TU THU VE NUT TRON O GOC (anh chot: xuat hien kieu ong kinh, thu ve kieu xap anh, tu thu sau 5 / 10 / 15 giay,
   bam nut de mo). Toan bo dieu phoi o src/khay-thu.js; o day chi dua cho no thu no can. Che do tu kiem thi KHONG tu thu
   (cac bai do khay mo khay ca phut). */
const khayThu = taoKhayThu({
  electron: { BrowserWindow, screen, ipcMain },
  layKhay: () => (shelfWin && !shelfWin.isDestroyed() ? shelfWin : null),
  damBaoKhay: () => ensureShelf(),
  anhMoiNhat: () => { const it = [...shelfItems.values()].pop(); return (it && it.thumb) || '' }, // 04/10: anh nho da tao san
  soAnh: () => shelfItems.size,
  docGiay: () => giayHopLe(kho.docCauHinh().khayTuThu),
  // dang keo / doi co khay, dang chon vung, dang quay video, dang quay Storyboard 3 giay: KHONG thu (san dien la cua so
  // trong suot phu ca man ~1 giay; phu len video luc dang quay la khung video den — so loi 0.4.15)
  banKhac: () => dragAnchors.size > 0 || resizeAnchors.size > 0 || overlayWins.length > 0 || !!ghiHinh || dangQuay,
  tuDong: () => !(IS_SELFTEST || IS_DRAGTEST || IS_SHELFTEST || THU_QUAY || THU_OCR),
  ghiLog,
})
// Nut "–" tren khay: truoc 01/10 la an han khay; nay la thu ve nut tron (an han = nut x tren nut tron)
ipcMain.on('shelf:hide', () => { khayThu.thu('nut tru') })

ipcMain.on('shelf:drag-start', (e) => {
  batDauKeo(BrowserWindow.fromWebContents(e.sender), e.sender.id)
})
ipcMain.on('shelf:drag-to', (e, tongDx, tongDy) => {
  keoDen(BrowserWindow.fromWebContents(e.sender), e.sender.id, tongDx, tongDy)
})
ipcMain.on('shelf:drag-end', (e) => ketThucKeo(e.sender.id))
// Cai dat: keo qua IPC (16/09 — app-region drag native bi nhay tren Windows, anh bao)
ipcMain.on('settings:drag-start', (e) => batDauKeo(BrowserWindow.fromWebContents(e.sender), e.sender.id))
ipcMain.on('settings:drag-to', (e, tongDx, tongDy) => keoDen(BrowserWindow.fromWebContents(e.sender), e.sender.id, tongDx, tongDy))
ipcMain.on('settings:drag-end', (e) => ketThucKeo(e.sender.id))

/* ── QUAY 3 GIAY -> dai phan canh (28/09) ─────────────────────────────
   Anh Tien: "khi chon Multi-Shot Storyboard Strip minh khoanh vung thi app se tu dong luu lai hinh anh voi 3s
   va chuyen thanh dai hinh anh". Chot trong bang hoi 28/09: khoanh 1 lan -> quay 3 giay -> 6 khung (0,5 s/khung)
   -> 1 dai; trong luc quay: vien cam + dem 3-2-1; bo dai ngay gio.
   - Khung lay tu LUONG CHUP CHAY SAN (luong.catVung: renderer cat DUNG vung, JPEG) — 5 fps nen 0,5 s luon la
     khung moi. Luong chua san sang -> grabDisplaysList (~0,4 s/lan, van kip 0,5 s).
   - ☠️ KHONG cua so trong suot nao phu len vung: vien = 4 thanh DAC nam ngoai vung, dong ho nam tren/duoi vung.
     (So loi: cua so trong suot phu len video tang toc phan cung -> video DEN trong anh chup.)
   - 6 khung KHONG vao khay (tranh ngap khay); cua so Storyboard mo voi 6 khung va TU LUU dai (dai vao khay). */
const QUAY_SO_KHUNG = 6
const QUAY_BUOC_MS = 500
const QUAY_CHO_MS = 350 // overlay (anh dong bang) vua dong -> doi luong 5 fps ve lai man that
let dangQuay = false
let daiQuay = null // { items: [{ id, seq, image }], tuLuu } -> storyboard:get-data doc thay khay

const cho = (ms) => new Promise((r) => setTimeout(r, ms))

/* 29/09 VIEN MOI (kieu 1 anh chon): vien cam 2 px + 4 goc chu L, thuoc toi "● 3 giay | 6 o khung".
   ☠️ 0.7.4 xin thanh 3 px nhung Windows ep >= ~30 px -> thanh 31 px lan vao vung, dinh vao 3/6 khung (do anh 08:09).
   Nay hinh hoc o src/vien-quay.js: 4 cua so >= 40 px nam HOAN TOAN NGOAI vung + setShape() chi giu net manh.
   Them 2 lop chot: setContentProtection (vien khong bao gio vao anh chup) + do getBounds sau khi hien, cua so nao
   cham vung (Windows kep vao workArea — so loi #1) thi HUY ngay va ghi run-log. */
function moVienQuay(display, rect, kieu) {
  const laVideo = kieu === 'video' // 01/10: quay video -> thuoc la DONG HO dem len + nut Dung (bam duoc)
  const b = display.bounds
  const v = tinhVienQuay({ x: b.x + rect.x, y: b.y + rect.y, w: rect.w, h: rect.h })
  const wins = []
  for (const c of v.canh) {
    if (!c.shapes.length) continue
    // ☠️ 0.7.8 (29/09 anh: "vua vien cam mong vua vien trang"): cua so DAC + setShape -> Windows van ve phan ngoai hinh
    //    mau TRANG (do tren nen #202020: dai 40 px trang f3f3f3, chi net 2 px cam; kieu co khung con lan trang 3 px vao
    //    vung). Nay: cua so TRONG SUOT, khong khung, net ve bang src/dem/vien.html — do cung cach: chi con net cam.
    const w = new BrowserWindow({
      x: c.bounds.x, y: c.bounds.y, width: c.bounds.width, height: c.bounds.height,
      frame: false, transparent: true, backgroundColor: '#00000000', thickFrame: false, roundedCorners: false,
      resizable: false, movable: false, focusable: false, skipTaskbar: true,
      hasShadow: false, show: false, enableLargerThanScreen: true,
      webPreferences: { sandbox: true, contextIsolation: true },
    })
    w.setBounds(c.bounds) // thoat kep workArea luc tao (so loi #1)
    w.setContentProtection(true)
    w.setAlwaysOnTop(true, 'screen-saver')
    w.setIgnoreMouseEvents(true)
    w.loadFile(path.join(__dirname, 'dem', 'vien.html'), { query: { s: JSON.stringify(c.shapes.map((s) => [s.x, s.y, s.width, s.height])) } })
    w.once('ready-to-show', () => { if (!w.isDestroyed()) w.showInactive() })
    const that = w.getBounds()
    if (giaoHCN(that, v.vung)) {
      ghiLog('quay3s CANH BAO vien ' + c.ten + ' cham vung (xin ' + JSON.stringify(c.bounds) + ' duoc ' + JSON.stringify(that) + ') -> huy')
      w.destroy(); continue
    }
    wins.push(w)
  }
  // Thuoc dem nguoc: sat TREN khung vien neu con cho trong man, khong thi sat DUOI; het cho -> khong hien.
  const TH_W = laVideo ? 240 : 200, TH_H = 40 // cua so trong suot; vien thuoc 28 px nam trong, chua 6 px cho bong
  const n = v.vungNgoai
  let thY = null
  if (n.y - TH_H >= b.y) thY = n.y - TH_H
  else if (n.y + n.height + TH_H <= b.y + b.height) thY = n.y + n.height
  let thuoc = null
  if (thY != null) {
    // Thuoc khong tran khoi man (vung sat mep phai): kep x trong man
    const thX = Math.max(b.x, Math.min(n.x - 6, b.x + b.width - TH_W))
    thuoc = new BrowserWindow({
      x: thX, y: thY, width: TH_W, height: TH_H,
      frame: false, transparent: true, backgroundColor: '#00000000', resizable: false, movable: false,
      focusable: false, skipTaskbar: true, hasShadow: false, show: false,
      webPreferences: laVideo
        ? { preload: path.join(__dirname, 'preload-dem.js'), contextIsolation: true, sandbox: false }
        : { sandbox: true, contextIsolation: true },
    })
    thuoc.setContentProtection(true)
    thuoc.setAlwaysOnTop(true, 'screen-saver')
    if (!laVideo) thuoc.setIgnoreMouseEvents(true) // quay video: nut Dung phai bam duoc (cua so nam NGOAI vung)
    thuoc.loadFile(path.join(__dirname, 'dem', laVideo ? 'quay.html' : 'index.html'), {
      query: laVideo ? { lang, dung: T('quay.dung'), dungTitle: T('quay.dungTitle') } : { lang, vi: thY < n.y ? 'tren' : 'duoi' },
    })
    thuoc.once('ready-to-show', () => { if (!thuoc.isDestroyed()) thuoc.showInactive() })
    wins.push(thuoc)
  } else ghiLog((laVideo ? 'quay-video' : 'quay3s') + ': khong co cho dat thuoc dem (vung sat ca mep tren lan duoi)')
  const goi = (js) => {
    if (!thuoc || thuoc.isDestroyed()) return
    const chay = () => { if (!thuoc.isDestroyed()) thuoc.webContents.executeJavaScript(js).catch(() => {}) }
    // Trang chua nap xong ma goi thi lenh roi mat (dong ho quay video se dung o 0:00) -> doi nap xong
    if (thuoc.webContents.isLoading()) thuoc.webContents.once('did-finish-load', chay); else chay()
  }
  return {
    coThuoc: !!thuoc,
    datSo: (s) => goi('window.datSo && window.datSo(' + s + ')'),
    datKhung: (k) => goi('window.datKhung && window.datKhung(' + k + ')'),
    batDau: (o) => goi('window.batDau && window.batDau(' + JSON.stringify(o || {}) + ')'),
    dong: () => { for (const w of wins) if (!w.isDestroyed()) w.destroy() },
  }
}

async function layKhungVung(display, sf, rect) {
  const r = await luong.catVung(display, rect)
  if (r) return { image: nativeImage.createFromBuffer(r.buf), nguon: 'luong' }
  const list = await grabDisplaysList()
  const item = list.find((x) => x.display.id === display.id)
  if (!item || !item.image) return null
  const isz = item.image.getSize()
  const kx = isz.width / (display.bounds.width * sf), ky = isz.height / (display.bounds.height * sf)
  try {
    return { image: item.image.crop({
      x: Math.max(0, Math.round(rect.x * sf * kx)), y: Math.max(0, Math.round(rect.y * sf * ky)),
      width: Math.max(1, Math.round(rect.w * sf * kx)), height: Math.max(1, Math.round(rect.h * sf * ky)),
    }), nguon: 'grab' }
  } catch (e) { return null }
}

async function quay3Giay(display, sf, rect) {
  if (dangQuay) return
  dangQuay = true
  let vien = null
  const khung = []
  const nhatKy = []
  try {
    await cho(QUAY_CHO_MS)
    const batDau = Date.now()
    for (let i = 0; i < QUAY_SO_KHUNG; i++) {
      const tre = batDau + i * QUAY_BUOC_MS - Date.now()
      if (tre > 0) await cho(tre)
    // 04/10 (ECC soat): mo vien TRONG try. Truoc day nam ngoai: nem loi la `dangQuay` ket o true toi khi tat app
    // (Storyboard khong quay nua, khay khong tu thu) ma khong co dong log nao (ham async goi khong await).
    vien = moVienQuay(display, rect)
      vien.datSo(Math.max(1, 3 - Math.floor((Date.now() - batDau) / 1000)))
      const t = Date.now() - batDau
      const k = await layKhungVung(display, sf, rect)
      if (k && k.image && !k.image.isEmpty()) {
        khung.push({ id: i + 1, seq: i + 1, image: k.image })
        vien.datKhung(khung.length) // thuoc: to cam them 1 o (6 o = 6 khung)
        nhatKy.push(t + 'ms/' + k.nguon + '/' + (Date.now() - batDau - t) + 'ms')
      } else nhatKy.push(t + 'ms/LOI')
    }
    const conLai = batDau + QUAY_SO_KHUNG * QUAY_BUOC_MS - Date.now()
    if (conLai > 0) await cho(conLai)
  } catch (e) {
    ghiLog('quay3s LOI: ' + (e && e.message || e))
  } finally {
    try { if (vien) vien.dong() } catch (e) { ghiLog('quay3s LOI dong vien: ' + (e && e.message || e)) }
    dangQuay = false
  }
  ghiLog('quay3s ' + khung.length + '/' + QUAY_SO_KHUNG + ' khung [' + nhatKy.join(' ') + ']')
  if (!khung.length) {
    if (Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('app.khongChupDuoc') }).show()
    return
  }
  // 29/09: luu dai vao kho (giu lai sau khi tat app); khay Storyboard mo ra voi dai moi o tren cung + tu luu PNG 1 lan
  const idDai = khoDai.luuDai(khung)
  if (!idDai) {
    ghiLog('quay3s LOI luu dai vao kho')
    if (Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('app.khongChupDuoc') }).show()
    return
  }
  ghiLog('quay3s luu dai ' + idDai + ' (' + khung.length + ' khung)')
  daiQuay = { moiId: idDai, tuLuu: true }
  openStoryboardWindow()
}

/* ── QUAY VIDEO vung man hinh (01/10) ─────────────────────────────────────────────────────────────────
   Anh chot 01/10 (bang hoi): quay toi khi BAM DUNG (tran 5 phut) · co nut bat TIENG MAY (mac dinh tat) · video nam
   o KHAY RIENG · MP4 truoc, GIF lam sau.
   Nguoi dung: khoanh vung -> bam nut Quay (hoac phim R) -> vien cam + dong ho dem len + nut Dung nam NGOAI vung
   -> bam Dung (hoac bam lai phim tat chup / bam tray) -> file MP4 vao thu muc anh, Khay video mo ra.
   - Bo quay nam trong cua so luong AN (src/luong-chup.js batDauQuay): khuc MP4 ve toi dau ghi NOI vao dia toi do
     (file `.tam`), xong moi doi ten -> khong giu ca doan trong RAM, tat app giua chung van con file phat duoc.
   - ☠️ Nhu quay 3 giay: KHONG cua so nao de len vung dang quay (vien + dong ho deu nam ngoai). Vung kin ca chieu cao
     man -> khong co cho dat dong ho: bao bang thong bao he thong, dung bang phim tat chup / tray.
   - Vung vat 2 man: khong co nut Quay (duong ghep 2 man luu thang, khong qua thanh cong cu). */
const GHI_TOI_DA_MS = Number(process.env.AIO_QUAY_TOI_DA_MS) > 0 ? Number(process.env.AIO_QUAY_TOI_DA_MS) : 5 * 60 * 1000 // [do] AIO_QUAY_TOI_DA_MS: ha tran de do duong tu dung
let ghiHinh = null // luot dang quay: { fd, tam, duong, bytes, khuc, batDau, vien, hetGio, w, h, tieng, dangDung, loiGhi }
let videoMoi = null // id video vua quay xong -> khay video danh dau + phat ngay

function baoKhongQuayDuoc(ly) {
  ghiLog('quay-video LOI: ' + ly)
  if (Notification.isSupported()) new Notification({ title: 'AiO Shot & Save', body: T('app.khongQuayDuoc') }).show()
}

async function batDauGhiHinh(display, rect, tieng) {
  if (ghiHinh || dangQuay) return
  const duong = kho.duongVideoMoi('mp4')
  if (!duong) { baoKhongQuayDuoc('khong tao duoc thu muc ' + kho.thuMucAnh()); return }
  const tam = duong + '.tam'
  let fd
  try { fd = fs.openSync(tam, 'w') } catch (e) { baoKhongQuayDuoc('khong mo duoc ' + tam + ': ' + e.message); return }
  const g = { fd, tam, duong, bytes: 0, khuc: 0, batDau: 0, vien: null, hetGio: null, w: 0, h: 0, tieng: false, dangDung: false, loiGhi: null }
  ghiHinh = g // dat SOM: chan bam lan 2, va phim tat chup tu luc nay = dung
  rebuildTrayMenu()
  g.vien = moVienQuay(display, rect, 'video')
  await cho(QUAY_CHO_MS) // overlay (anh dong bang) vua dong -> doi man that hien lai
  const r = await luong.batDauQuay(display, rect, {
    tieng,
    onKhuc: (buf) => {
      try { fs.writeSync(g.fd, buf); g.bytes += buf.length; g.khuc++ } catch (e) {
        // O day day / mat quyen giua chung: dung ngay, giu phan da ghi
        if (!g.loiGhi) { g.loiGhi = e.message; ghiLog('quay-video LOI ghi dia: ' + e.message); dungGhiHinh('loi ghi dia') }
      }
    },
    onXong: (info) => ketThucGhiHinh(g, info),
  })
  if (!r.ok) {
    g.vien.dong()
    try { fs.closeSync(fd) } catch (e) {}
    try { fs.unlinkSync(tam) } catch (e) {} // file .tam do chinh luot nay tao, dung ten
    ghiHinh = null
    rebuildTrayMenu()
    baoKhongQuayDuoc(r.loi)
    return
  }
  g.batDau = Date.now(); g.w = r.w; g.h = r.h; g.tieng = !!r.tieng
  if (r.duoi && r.duoi !== 'mp4') g.duong = g.duong.replace(/\.mp4$/, '.' + r.duoi) // may khong co H.264 -> webm
  ghiLog('quay-video bat dau ' + r.w + 'x' + r.h + ' ' + r.mime + (g.tieng ? ' +tieng' : '') + ' (mo luong ' + r.msMo + ' ms) rect=' + JSON.stringify(rect))
  g.vien.batDau({ tieng: g.tieng })
  if (tray) tray.setToolTip('AiO Shot & Save · ' + T('tray.dungQuay'))
  if (!g.vien.coThuoc && Notification.isSupported()) {
    new Notification({ title: 'AiO Shot & Save', body: T('quay.dungBangPhim').replace('{phim}', formatAccel(currentHotkey)) }).show()
  }
  g.hetGio = setTimeout(() => dungGhiHinh('het tran ' + Math.round(GHI_TOI_DA_MS / 1000) + ' s'), GHI_TOI_DA_MS)
  if (g.dangDung) luong.dungQuay() // nguoi dung da bam dung trong luc luong dang mo
}

/* batDauGhiHinh nem loi giua chung (tao cua so vien hong, ...): tra app ve trang thai KHONG quay, bao nguoi dung.
   Khong co ham nay thi `ghiHinh` ket -> moi lan bam phim tat chup deu thanh "dung quay" va khong chup duoc nua. */
function huyGhiHinhLoi(e) {
  const g = ghiHinh
  ghiHinh = null
  if (g) {
    clearTimeout(g.hetGio)
    try { if (g.vien) g.vien.dong() } catch (err) {}
    if (g.batDau) luong.dungQuay()
    try { fs.closeSync(g.fd) } catch (err) {}
    if (!g.bytes) { try { fs.unlinkSync(g.tam) } catch (err) {} } // file .tam RONG do chinh luot nay tao
  }
  if (tray) tray.setToolTip('AiO Shot & Save')
  rebuildTrayMenu()
  baoKhongQuayDuoc('nem loi: ' + ((e && e.stack) || e))
}

function dungGhiHinh(lyDo) {
  const g = ghiHinh
  if (!g || g.dangDung) return
  g.dangDung = true
  ghiLog('quay-video dung (' + lyDo + ')')
  if (g.batDau) luong.dungQuay() // chua bat dau xong -> batDauGhiHinh tu goi dungQuay khi luong mo xong
}

function ketThucGhiHinh(g, info) {
  if (ghiHinh !== g) return
  ghiHinh = null
  clearTimeout(g.hetGio)
  g.vien.dong()
  try { fs.closeSync(g.fd) } catch (e) {}
  if (tray) tray.setToolTip('AiO Shot & Save')
  rebuildTrayMenu()
  const ms = (info && info.ms) || (g.batDau ? Date.now() - g.batDau : 0)
  ghiLog('quay-video xong ' + Math.round(ms / 100) / 10 + ' s, ' + g.khuc + ' khuc, ' + Math.round(g.bytes / 1024) + ' KB, ' +
    ((info && info.khung) || 0) + ' khung' + (info && info.loi ? ' LOI=' + info.loi : '') + (g.loiGhi ? ' LOI-GHI=' + g.loiGhi : ''))
  if (!g.bytes) {
    try { fs.unlinkSync(g.tam) } catch (e) {} // 0 byte: bo file .tam cua chinh luot nay
    baoKhongQuayDuoc((info && info.loi) || 'khong co du lieu')
    return
  }
  /* 02/10 (ECC soat, muc A3 / A5): that bai KHONG duoc im lang.
     - Khong doi ten duoc `.tam`: KHONG ghi file `.tam` vao so (khay hien o den, keo ra la file `.tam`). De nguyen file,
       bao nguoi dung; lan mo app sau khoiPhucVideoDo() doi ten + dua vao khay.
     - Ghi so that bai: file van tren dia -> bao + mo dung thu muc khi nguoi dung bam thong bao; lan mo khay sau
       khoVideo.doiChieu() tu dua lai vao so.
     - Luot quay ket thuc vi LOI giua chung (dia day, luong man hinh chet, het 4 giay cho dung): van luu, nhung ghi
       `loi` vao so (khay danh dau "Bi ngat") + thong bao. Truoc do loi chi nam trong log, video thieu trong nhu du. */
  const loiQuay = (info && info.loi) || g.loiGhi || null
  const c = khoVideo.chotQuay({ tam: g.tam, file: g.duong, ms, w: g.w, h: g.h, tieng: g.tieng, bytes: g.bytes, loi: !!loiQuay })
  if (c.hong) { baoVideo('quay.ngoaiKhay', c.file); return } // chotQuay da ghi log ly do
  videoMoi = c.m.id
  if (loiQuay) baoVideo('quay.biNgat', null)
  if (!dangThoat) openVideoWindow()
}

/* Thong bao he thong ve mot video. file != null: bam thong bao = mo thu muc co file do; file == null: mo Khay video.
   Giu tham chieu toi thong bao (khong giu thi bi don rac, bam vao khong con ai nghe). */
const thongBaoVideo = new Set()
function baoVideo(khoaChu, file, thamSo) {
  if (dangThoat || !Notification.isSupported()) return
  let body = T(khoaChu)
  for (const [k, v] of Object.entries(thamSo || {})) body = body.split('{' + k + '}').join(String(v))
  const n = new Notification({ title: 'AiO Shot & Save', body })
  thongBaoVideo.add(n)
  if (thongBaoVideo.size > 8) thongBaoVideo.delete(thongBaoVideo.values().next().value)
  n.on('click', () => { if (file) shell.showItemInFolder(file); else openVideoWindow() })
  n.on('close', () => thongBaoVideo.delete(n))
  n.show()
}

/* 02/10 (ECC soat, muc A2): app bi tat dot ngot giua luc quay (mat dien, treo may, bo cai tat app) -> doan dang quay
   nam lai thanh `shotandsave-video-*.mp4.tam`, khong vao so, khong ai don. Luc mo app: doi ten thanh video + dua vao
   khay, danh dau "Bi ngat". File quay la MP4 phan manh nen cut o dau cung van phat duoc toi khuc cuoi da ghi.
   ☠️ Cho 4 giay roi moi dung vao: file con dang lon len = co ban app KHAC (AIO_USERDATA, cung thu muc anh) dang quay
   vao no (bo quay ghi 1 khuc moi giay). Ham nay TU bat loi: goi tu setTimeout, loi nem ra se khong ai thay. */
async function khoiPhucVideoDo() {
  try {
    const thuMuc = kho.thuMucAnh()
    let doi = []
    const ung = khoVideo.timTam(thuMuc)
    if (ung.length) {
      await cho(4000)
      const kq = khoVideo.khoiPhucTam(ung, ghiHinh ? ghiHinh.tam : null)
      doi = kq.doi
      ghiLog('video khoi phuc file quay do: doi ten ' + kq.doi.length + ', bo file rong ' + kq.bo.length +
        (kq.loi.length ? ', KHONG dung vao ' + kq.loi.length + ' (' + kq.loi.join('; ') + ')' : ''))
    }
    const r = khoVideo.doiChieu(thuMuc, { coTieng: coDuongTieng, biNgat: doi })
    if (r.them || r.loi) ghiLog('video doi chieu so voi dia: them ' + r.them + ' muc' + (r.loi ? ', LOI ' + r.loi : ''))
    if (doi.length) baoVideo('quay.daKhoiPhuc', null, { n: doi.length })
  } catch (e) { ghiLog('video khoi phuc LOI: ' + ((e && e.stack) || e)) }
}

ipcMain.on('quay:dung', () => dungGhiHinh('nut Dung'))

/* --- KHAY VIDEO (01/10) = the "Video" cua cua so khay gop (moKhay o tren). Moi doan quay 1 hang. --- */
function openVideoWindow() { moKhay('video') }
ipcMain.on('shelf:open-video', () => openVideoWindow())

/* 01/10 10:4x anh chot: quay LUON co tieng; vao khay moi chon "Co tieng / Khong tieng" cho tung video.
   Ban KHONG TIENG = file rieng nam canh ban goc, ten them "-khong-tieng" (src/mp4-bo-tieng.js: chep + doi ten hop
   tieng thanh 'free', khong nen lai hinh, 90 MB = 27 ms). Tao 1 lan khi nguoi dung chon, GIU tren dia (Premiere noi
   file theo duong dan — xoa di la mat lien ket). Lua chon ghi vao so (boTieng) nen mo lai khay van nho. */
function banKhongTieng(m) { return m && m.fileKhongTieng && fs.existsSync(m.fileKhongTieng) ? m.fileKhongTieng : null }
/* File nguoi dung DANG CHON cua 1 video: dung khi keo tha ra ngoai va khi bam Mo thu muc. */
function fileDangChon(m) { return (m.boTieng && banKhongTieng(m)) || m.file }
function bytesSeXoa(m) { const k = banKhongTieng(m); let b = m.bytes; if (k) { try { b += fs.statSync(k).size } catch (e) {} } return b }

ipcMain.handle('video:get-data', () => {
  const moiId = videoMoi
  videoMoi = null // chi danh dau "moi" dung 1 lan (mo lai / reload khong tu phat nua)
  // 02/10: video do app quay nam tren dia ma khong co trong so (so hong, ghi so that bai) -> dua lai truoc khi hien
  try {
    const r = khoVideo.doiChieu(kho.thuMucAnh(), { coTieng: coDuongTieng })
    if (r.them || r.loi) ghiLog('video doi chieu so voi dia: them ' + r.them + ' muc' + (r.loi ? ', LOI ' + r.loi : ''))
  } catch (e) { ghiLog('video doi chieu LOI: ' + e.message) }
  const ds = khoVideo.danhSach().map((m) => ({
    id: m.id, ten: path.basename(m.file), url: pathToFileURL(m.file).href,
    ms: m.ms, w: m.w, h: m.h, bytes: m.bytes, taoLuc: m.taoLuc, loi: !!m.loi,
    coNutTieng: !!m.tieng && /\.mp4$/i.test(m.file), // video quay khong tieng (mac) / webm: khong co gi de chon
    boTieng: !!(m.boTieng && banKhongTieng(m)),
    bytesXoa: bytesSeXoa(m),
  }))
  return { ds, moiId, lang, dangQuay: !!ghiHinh }
})

ipcMain.handle('video:chon-tieng', (_e, id, coTieng) => {
  const m = khoVideo.tim(id)
  if (!m || !m.tieng || !fs.existsSync(m.file)) return { ok: false, loi: 'khong co video / video khong co tieng' }
  if (coTieng) {
    const m2 = khoVideo.sua(id, { boTieng: false })
    return m2 ? { ok: true, boTieng: false, bytesXoa: bytesSeXoa(m2) } : { ok: false, loi: 'khong ghi duoc so' }
  }
  let f = banKhongTieng(m)
  if (!f) {
    f = m.file.replace(/\.mp4$/i, '') + '-khong-tieng.mp4'
    const t0 = Date.now()
    const r = taoBanKhongTieng(m.file, f)
    ghiLog('video bo tieng ' + id + ': ' + (r.ok ? 'xong ' + (Date.now() - t0) + ' ms, ' + r.soTraf + ' doan -> ' + f : 'LOI ' + r.loi))
    if (!r.ok) return { ok: false, loi: r.loi }
  }
  const m2 = khoVideo.sua(id, { boTieng: true, fileKhongTieng: f })
  return m2 ? { ok: true, boTieng: true, bytesXoa: bytesSeXoa(m2) } : { ok: false, loi: 'khong ghi duoc so' }
})

/* Anh nho lam ICON luc keo (renderer ve khung dau cua video ra canvas). Giu toi da 40. */
const videoIcon = new Map() // id -> NativeImage
ipcMain.on('video:icon', (_e, id, dataUrl) => {
  if (!khoVideo.MAU_ID.test(String(id)) || typeof dataUrl !== 'string') return
  try {
    const img = nativeImage.createFromDataURL(dataUrl)
    if (img.isEmpty()) return
    videoIcon.delete(id); videoIcon.set(id, img)
    while (videoIcon.size > 40) videoIcon.delete(videoIcon.keys().next().value)
  } catch (e) {}
})
ipcMain.on('video:keo', (e, id) => {
  const m = khoVideo.tim(id)
  if (!m || !fs.existsSync(m.file)) { ghiLog('video keo ' + id + ': khong con file'); return }
  try {
    const duong = kho.duongDanKeoAnToan(fileDangChon(m)) // ban Co tieng / Khong tieng theo nut dang chon tren khay
    let icon = videoIcon.get(id)
    if (!icon || icon.isEmpty()) icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray.png')).resize({ height: 64, quality: 'best' })
    const t0 = Date.now()
    e.sender.startDrag({ file: duong, icon }) // ☠️ Windows: chan toi khi THA chuot -> so duoi la thoi gian tay keo
    ghiLog('video keo ' + id + ': tay keo ' + (Date.now() - t0) + ' ms -> ' + duong)
  } catch (err) { ghiLog('video keo LOI: ' + err.message) }
})
ipcMain.on('video:mo-thu-muc', (_e, id) => {
  const m = khoVideo.tim(id)
  if (m && fs.existsSync(m.file)) shell.showItemInFolder(fileDangChon(m))
  else shell.openPath(kho.baoDamThuMuc(kho.thuMucAnh()))
})
/* Xoa = dua file vao THUNG RAC (lay lai duoc) roi go khoi so. Nut tren khay noi ro dung luong + bam 2 lan. */
ipcMain.handle('video:xoa', async (_e, id) => {
  const m = khoVideo.tim(id)
  if (!m) return { ok: false }
  try {
    if (fs.existsSync(m.file)) await shell.trashItem(m.file)
    const k = banKhongTieng(m) // ban khong tieng (neu da tao) di cung ban goc: nut Xoa ghi tong dung luong ca hai
    if (k) await shell.trashItem(k)
  } catch (err) {
    ghiLog('video xoa ' + id + ' LOI dua vao thung rac: ' + err.message)
    return { ok: false, loi: err.message }
  }
  khoVideo.bo(id)
  videoIcon.delete(id)
  ghiLog('video xoa ' + id + ' -> thung rac: ' + m.file)
  return { ok: true }
})

/* ── Storyboard Strip IPC ────────────────────────────────────────────── */
ipcMain.on('shelf:open-storyboard', () => { daiQuay = null; openStoryboardWindow() })

/* 29/09 KHAY STORYBOARD = danh sach DAI trong kho (moi dai 1 hang), KHONG lay anh chup thuong cua khay nua
   (anh chot "2 khay cho 2 tac vu rieng"). Khung di qua aioshot://dai/<id>/<seq>.jpg. Mo tu QUAY 3 GIAY: dai moi
   (moiId) tu luu PNG dung MOT lan (mo lai / reload khong luu nua). */
ipcMain.handle('storyboard:get-data', () => {
  let moiId = null, tuLuu = false
  if (daiQuay) { moiId = daiQuay.moiId; tuLuu = !!daiQuay.tuLuu; daiQuay.tuLuu = false }
  const dais = khoDai.danhSach().map((m) => ({
    id: m.id, taoLuc: m.taoLuc,
    khung: m.khung.map((k) => ({ seq: k.seq, w: k.w, h: k.h, url: 'aioshot://dai/' + m.id + '/' + k.seq + '.jpg' })),
  }))
  return { dais, moiId, tuLuu, lang }
})
ipcMain.handle('storyboard:bo-khung', (_e, id, seq) => {
  const m = khoDai.boKhung(id, seq)
  ghiLog('storyboard bo khung ' + seq + ' cua ' + id + (m ? ' (con ' + m.khung.length + ')' : ' (het khung -> xoa dai)'))
  return { ok: true, conLai: m ? m.khung.length : 0 }
})
ipcMain.handle('storyboard:xoa-dai', (_e, id) => {
  const ok = khoDai.xoaDai(id)
  ghiLog('storyboard xoa dai ' + id + ': ' + (ok ? 'OK' : 'khong co'))
  return { ok }
})

/* [ra 28/09 Claude] Renderer gui THANG byte PNG (Uint8Array), khong qua base64 dataURL (+33%) va main
   KHONG giai ma roi nen PNG lai lan nua (ban dau: createFromDataURL -> toPNG). Do ban dau (anh nhieu chu):
   3 anh 10,2 MB / 5 anh 15,1 MB / 20 anh 25,8 MB chuoi base64 qua IPC.
   Dai KEO ra ngoai = FILE THAT trong thu muc anh, ten duy nhat. Ban dau ghi .keo/storyboard-strip.png:
   (1) kho.thuMucKeo KHONG duoc export -> TypeError -> keo khong bao gio chay; (2) .keo bi xoa moi lan mo
   app -> Premiere mat media; (3) cung mot ten -> lan keo sau ghi de dai Premiere da nhan. */
let sbDemTen = 0
function luuFileStoryboard(buf) {
  const dir = kho.baoDamThuMuc(kho.thuMucAnh())
  const d = new Date()
  const p = (v, k) => String(v).padStart(k || 2, '0')
  const tenFile = 'shotandsave-storyboard-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + p(d.getMilliseconds(), 3) + '-' + (++sbDemTen) + '.png'
  const filePath = path.join(dir, tenFile)
  fs.writeFileSync(filePath, buf)
  return filePath
}
const layBuf = (u8) => (u8 && u8.byteLength ? Buffer.from(u8.buffer ? u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) : u8) : null)

ipcMain.handle('storyboard:copy', (_e, u8) => {
  const buf = layBuf(u8)
  if (!buf) return { ok: false }
  try {
    const img = nativeImage.createFromBuffer(buf)
    if (img.isEmpty()) throw new Error('anh rong')
    clipboard.writeImage(img)
    ghiLog('storyboard chep vao clipboard: OK ' + Math.round(buf.length / 1024) + ' KB')
    return { ok: true }
  } catch (err) {
    ghiLog('storyboard copy LOI: ' + err.message)
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('storyboard:save', (_e, u8) => {
  const buf = layBuf(u8)
  if (!buf) return { ok: false }
  try {
    const filePath = luuFileStoryboard(buf)
    ghiLog('storyboard luu file: ' + filePath)
    // 29/09 anh chot "tach han": dai KHONG vao khay anh thuong nua (truoc: shelfAdd)
    return { ok: true, filePath }
  } catch (err) {
    ghiLog('storyboard save LOI: ' + err.message)
    return { ok: false, error: err.message }
  }
})

/* 29/09 KEO CA DAI (anh: "click and drag ca mot cuon tha vao phan mem"). Truoc day renderer ve canvas + toBlob
   SAU dragstart roi moi gui byte sang day -> startDrag tre so voi tay (anh: "khong da"). Nay renderer VE SAN khi re
   chuot vao hang, byte PNG giu o day (toi da 6 dai, bo dai cu nhat); dragstart chi gui id -> ghi file (neu chua co)
   + startDrag ngay. File: thu muc anh, ten theo id + danh sach khung (ver) -> keo lai cung dai KHONG ghi them file
   moi, bo 1 khung la ten moi (khong ghi de file Premiere da nhan — ly do o chu thich luuFileStoryboard). */
const sbVeSan = new Map() // id -> { ver, buf, icon, file }
const MAU_VER = /^[0-9-]{1,40}$/
ipcMain.handle('storyboard:chuan-bi-keo', (_e, id, ver, u8, iconDataUrl, msVe) => {
  const buf = layBuf(u8)
  if (!khoDai.MAU_ID.test(String(id)) || !MAU_VER.test(String(ver)) || !buf) return { ok: false }
  let icon = iconDataUrl ? nativeImage.createFromDataURL(iconDataUrl) : null
  if (!icon || icon.isEmpty()) icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'icon.png')).resize({ height: 64 })
  sbVeSan.delete(id)
  sbVeSan.set(id, { ver, buf, icon, file: null })
  while (sbVeSan.size > 6) sbVeSan.delete(sbVeSan.keys().next().value)
  ghiLog('storyboard ve san ' + id + ' v' + ver + ': ' + (msVe | 0) + ' ms, ' + Math.round(buf.length / 1024) + ' KB')
  return { ok: true }
})
ipcMain.on('storyboard:keo-dai', (e, id, ver) => {
  const t0 = Date.now()
  const rec = sbVeSan.get(id)
  if (!rec || rec.ver !== ver) { ghiLog('storyboard keo ' + id + ': CHUA ve san (bo qua)'); return }
  try {
    if (!rec.file || !fs.existsSync(rec.file)) {
      const dir = kho.baoDamThuMuc(kho.thuMucAnh())
      const ten = 'shotandsave-' + String(id).replace('dai-', 'storyboard-') + '-shot' + ver + '.png'
      const f = path.join(dir, ten)
      if (!fs.existsSync(f)) fs.writeFileSync(f, rec.buf)
      rec.file = f
    }
    const duong = kho.duongDanKeoAnToan(rec.file)
    const msChuanBi = Date.now() - t0
    // ☠️ startDrag tren Windows CHAN toi khi THA chuot -> do quanh no la do thoi gian tay keo, KHONG phai do tre
    // (29/09 ban dau ghi "startDrag sau 2520 ms" — do la anh dang keo). Tach 2 so.
    e.sender.startDrag({ file: duong, icon: rec.icon })
    ghiLog('storyboard keo ' + id + ': chuan bi ' + msChuanBi + ' ms (tre truoc khi keo), tay keo ' + (Date.now() - t0 - msChuanBi) + ' ms -> ' + duong)
  } catch (err) {
    ghiLog('storyboard keo LOI: ' + err.message)
  }
})

ipcMain.on('storyboard:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w && !w.isDestroyed()) w.close()
})

/* ── DOI CO khay bang tay nam goc TREN-TRAI (anh Tien 14/09 "keo cai khay to ra") ──
   Cung luat voi keo di chuyen: neo bounds mot lan, renderer gui delta TUYET DOI,
   main tinh co moi = neo - delta (keo len/trai = to ra), kep [san, tran], GIU
   NGUYEN goc DUOI-PHAI (khay thuong dat goc phai duoi man hinh -> to ra phia
   trong man). Tha chuot -> luu `khayCo[kieu]` + vi tri. */
const resizeAnchors = new Map()
ipcMain.on('shelf:resize-start', (e, goc) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (w && !w.isDestroyed()) resizeAnchors.set(e.sender.id, Object.assign(w.getBounds(), { goc: goc || 'tl' }))
})
ipcMain.on('shelf:resize-to', (e, tongDx, tongDy) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  const neo = resizeAnchors.get(e.sender.id)
  if (!w || w.isDestroyed() || !neo) return
  const min = coKhayMin(), max = coKhayMax()
  const kep = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)))
  /* 15/09 anh xin keo CA 4 GOC: goc dang keo di theo chuot, goc DOI DIEN dung yen.
     trai (tl/bl): keo trai = to ra, x doi; phai (tr/br): keo phai = to ra, x giu.
     tren (tl/tr): keo len = to ra, y doi; duoi (bl/br): keo xuong = to ra, y giu. */
  const goc = neo.goc || 'tl'
  const trai = goc === 'tl' || goc === 'bl', tren = goc === 'tl' || goc === 'tr'
  const nw = kep(neo.width + (trai ? -tongDx : tongDx), min.w, max.w)
  const nh = kep(neo.height + (tren ? -tongDy : tongDy), min.h, max.h)
  w.setBounds({ x: trai ? neo.x + neo.width - nw : neo.x, y: tren ? neo.y + neo.height - nh : neo.y, width: nw, height: nh })
})
ipcMain.on('shelf:resize-end', (e) => {
  resizeAnchors.delete(e.sender.id)
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w || w.isDestroyed()) return
  const b = w.getBounds()
  const khayCo = Object.assign({}, kho.docCauHinh().khayCo || {}, { [kieuKhay()]: { w: b.width, h: b.height } })
  kho.ghiCauHinh({ khayCo, viTriKhay: { x: b.x, y: b.y } })
  ghiLog('khay doi co ' + kieuKhay() + ' ' + b.width + 'x' + b.height)
})

/* ── [do that] Keo khay co lam no phinh ra khong? ────────────────────────
   Anh Tien 24/08: *"drag cai khay la cang nay no tu scale to ra"*. Khong doan
   nguyen nhan — mo phong dung duong ma renderer goi (`shelf:move` tung buoc
   nho), ghi lai kich thuoc sau moi buoc, keo QUA CA man hinh thu hai vi may
   anh Tien co 2 man khac DPI. */
function doKeoKhay() {
  const dong = []
  const w = ensureShelf()
  w.showInactive()

  const ghi = (nhan) => {
    const b = w.getBounds()
    dong.push(`${nhan}\tx=${b.x}\ty=${b.y}\tw=${b.width}\th=${b.height}`)
  }

  dong.push('=== MAN HINH ===')
  for (const d of screen.getAllDisplays()) {
    dong.push(`display ${d.id}\tscale=${d.scaleFactor}\tbounds=${JSON.stringify(d.bounds)}`)
  }
  dong.push(`=== KHAY: kich thuoc khai bao ${SHELF_W}x${SHELF_H} ===`)

  /* ☠️ Moc so sanh la bounds NGAY TRUOC KHI KEO, khong phai hang SHELF_W/H.
     Cua so tao ra o DPI 1.25 bao ve 382x130 du xin 380x128 — do la quy doi
     DIP, khong phai phinh. So voi hang so thi phep do bao dong gia. */
  const truoc = w.getBounds()
  ghi('truoc-khi-keo')

  // Keo 120 buoc x 12px sang trai -> di qua man hinh khac (neu co).
  // Di dung duong THAT ma renderer goi: neo mot lan, roi gui delta TUYET DOI.
  const wcId = w.webContents.id
  batDauKeo(w, wcId)
  let buoc = 0
  const timer = setInterval(() => {
    buoc++
    keoDen(w, wcId, -12 * buoc, 0)
    if (buoc % 20 === 0) ghi(`sau-${buoc}-buoc`)
    if (buoc >= 120) {
      clearInterval(timer)
      ketThucKeo(wcId)
      ghi('ket-thuc')
      const b = w.getBounds()
      const phinh = b.width !== truoc.width || b.height !== truoc.height
      dong.push(phinh
        ? `KET LUAN: KHAY DA PHINH khi keo — ${truoc.width}x${truoc.height} -> ${b.width}x${b.height}`
        : `KET LUAN: OK — giu nguyen ${b.width}x${b.height} sau 120 buoc keo`)
      try {
        const dir = path.join(__dirname, '..', '.selftest')
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'drag.txt'), dong.join('\n') + '\n')
      } catch (err) { console.error(err) }
      console.log(dong.join('\n'))
      setTimeout(() => forceQuit(), 400)
    }
  }, 16)
}

ipcMain.on('shelf:save-pos', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender)
  if (!w || w.isDestroyed()) return
  const [x, y] = w.getPosition()
  kho.ghiCauHinh({ viTriKhay: { x, y } })
})
