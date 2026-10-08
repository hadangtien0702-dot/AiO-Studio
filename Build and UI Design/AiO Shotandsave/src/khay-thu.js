'use strict'
/* =========================================================================
   KHAY ANH TU THU VE NUT TRON O GOC MAN HINH (01/10/2026)
   Anh Tien: "khi khong dung toi chup anh, khay se tu thu ve thanh mot nut tron o goc man hinh de do ton dien tich ...
   animation phai dep" + chot trong bang hoi: XUAT HIEN kieu A (ong kinh), THU VE kieu B (xap anh), tu thu sau 5 giay
   (Cai dat chon 5 / 10 / 15 giay), mo lai bang BAM nut tron. Keo khay di dau thi nut van ve goc duoi-phai cua man
   khay dang nam; mo ra thi khay ve dung cho cu.

   BA CUA SO:
   - Khay anh (shelfWin, main.js): KHONG doi cach chay. Chi them 3 ham trong src/shelf/shelf.js:
     __khayThongTin() (o nao dang thay), __khayAn(bool) (an / hien noi dung), __khayBung() (man trap bung + nhay sang).
   - NUT TRON (src/nut): cua so 80x80 trong suot o goc, vong tron 52 px ben trong.
     ☠️ Windows khong cho cua so nho hon ~58 px diem anh that (so loi #13) -> cua so PHAI >= 64 DIP, vong tron ve ben trong.
   - SAN DIEN (src/dien): cua so trong suot phu workArea cua man do, bam xuyen qua, CHI hien trong luc chuyen dong
     (< 1 giay). Vi sao can: the anh phai bay RA NGOAI cua so khay, ong kinh phai luot tu goc toi khay — khong cua so
     nho nao chua duoc duong bay do; doi vi tri cua so tung khung thi giat (so loi #8, #9).

   THU VE (B): chup anh cua so khay (capturePage) -> san dien ve "bong" y het de len khay that -> khay that an noi dung
   -> tren san: bong mo dan, tung o anh (cat tu chinh anh chup) bay vao nut, nut dem len -> hien nut that -> an san.
   XUAT HIEN (A): san ve nut y het o goc -> an nut that -> ong kinh luot toi tam khay -> hien khay that voi man trap
   bung (clip-path trong chinh trang khay) + nhay sang -> ong kinh tan -> an san.

   Moi buoc deu co HEN GIO: san dien khong tra loi thi roi ve an / hien thang (khong bao gio de khay ket nua chung).
   File nay khong goi truc tiep electron (nhan qua deps) -> chay duoc trong bai do an: scripts/test/do-khay-nut.mjs.
   ========================================================================= */
const path = require('path')

const NUT = { CUA_SO: 80, TRON: 52, LE: 20 } // DIP: cua so nut, vong tron, khoang cach vong tron toi mep workArea
const GIAY = [5, 10, 15]
const giayHopLe = (v) => (GIAY.includes(Number(v)) ? Number(v) : GIAY[0])

/** O vong tron (toan cuc DIP) o goc duoi-phai workArea. */
function oTronNut(wa) {
  return { x: wa.x + wa.width - NUT.LE - NUT.TRON, y: wa.y + wa.height - NUT.LE - NUT.TRON, width: NUT.TRON, height: NUT.TRON }
}
/** O CUA SO chua nut (toan cuc DIP): vong tron nam chinh giua, le deu (CUA_SO - TRON) / 2 cho bong + so dem. */
function oCuaSoNut(wa) {
  const t = oTronNut(wa), le = (NUT.CUA_SO - NUT.TRON) / 2
  return { x: t.x - le, y: t.y - le, width: NUT.CUA_SO, height: NUT.CUA_SO }
}
/** Doi o toan cuc sang toa do trong san dien (goc san = goc workArea). */
const tuongDoi = (b, wa) => ({ x: b.x - wa.x, y: b.y - wa.y, w: b.width, h: b.height })
/** Chon toi da `toiDa` o anh de bay (o qua nho bo qua). Thu tu giu nguyen: moi nhat truoc. */
function chonO(os, toiDa = 7) {
  return (Array.isArray(os) ? os : []).filter((o) => o && o.w >= 8 && o.h >= 8).slice(0, toiDa)
    .map((o) => ({ x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.w), h: Math.round(o.h) }))
}
const trongO = (p, b, le = 0) => p.x >= b.x - le && p.x < b.x + b.width + le && p.y >= b.y - le && p.y < b.y + b.height + le
const khacO = (a, b) => a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height
/* Windows tra cua so TO THEM 1 px phai / duoi o mot so ti le man (so loi #13: 150% 40 -> 41; do 01/10 19:1x man 125%:
   xin 80 duoc 81). Dung goc, to hon toi da 1 px = coi nhu dung cho — khong dat lai, khong ghi CANH BAO (vong tron ve
   theo toa do trong cua so nen khong xe dich). */
const lechDang = (duoc, xin) => khacO(duoc, xin) && !(duoc.x === xin.x && duoc.y === xin.y && duoc.width - xin.width >= 0 && duoc.width - xin.width <= 1 && duoc.height - xin.height >= 0 && duoc.height - xin.height <= 1)

/**
 * deps: {
 *   electron: { BrowserWindow, screen, ipcMain },
 *   layKhay(): cua so khay hoac null · damBaoKhay(): tao neu chua co, tra cua so
 *   anhMoiNhat(): dataURL anh moi nhat trong khay ('' neu khay trong) · soAnh(): so anh trong khay
 *   docGiay(): 5 | 10 | 15 · banKhac(): true khi dang keo / doi co / chup / quay (khong tu thu luc do)
 *   tuDong(): false = tat tu thu (che do tu kiem) · ghiLog(s)
 *   thuNghiem: true -> cua so offscreen, KHONG hien gi len man (bai do) · conTro(), manCua(b): thay cho screen khi do
 * }
 */
function taoKhayThu(deps) {
  const { BrowserWindow, screen, ipcMain } = deps.electron
  const TN = !!deps.thuNghiem
  const log = (s) => { try { deps.ghiLog(s) } catch (e) {} }
  const cho = (ms) => new Promise((r) => setTimeout(r, ms))

  /* 04/10 Mac — anh: "kha muot nhung van khung" SAU KHI so khung da du (4/4 lan 24-25 khung, ho max 17-18 ms).
     Bo dem khung chi thay nhip cua TRANG, khong thay luc nao cua so that su len man. Hai cho trong luot bung co lenh cua so
     roi dung vao giua chuyen dong:
       (1) luc ong kinh toi noi moi showInactive() + moveTop() cua so khay: man trap chay ngay (dau nhanh: sau 50 ms da mo ~40%)
           trong khi cua so vua goi hien — neu man hinh len cham vai khung thi mat doan dau, khay "bup" ra;
       (2) cua so san dien (phu ca man, trong suot) bi AN o khoang 300 ms, luc man trap (424 ms) con dang bung.
     hienSom: hien cua so khay NGAY TU DAU luot bung (noi dung dang tang hinh, body.an) -> luc ong kinh toi noi chi con chay
     man trap, khong con lenh cua so nao; va chi an san dien SAU khi man trap xong.
     ☠️ GIA THUYET, CHUA DO duoc tren man hinh (khong co thuoc nao nhin duoc man that) -> chi bat tren macOS, Windows giu
     nguyen duong anh da duyet. deps.hienSom = true / false de ep (bai do an). Thuoc: mat anh + dong `som N` cuoi run-log. */
  const HIEN_SOM = deps.hienSom != null ? !!deps.hienSom : (process.platform === 'darwin' && !TN)
  /* 08/10 Windows — anh: "khi khay thu ve vi tri o goc, bam no khong mo khay ra" (ban 0.9.1, 4/4 lan thu ve khong lan nao mo
     duoc bang nut; ban 06/10 bam van mo). Do: cua so nut tron DANG HIEN, nam tren cung, WindowFromPoint tai tam nut = chinh no,
     bam chuot gia lap dung tam -> run-log KHONG co dong nao (cu bam khong toi `nut:mo`). Khac biet duy nhat cua cua so nut so
     voi ban cu la `backgroundThrottling: false` (them 04/10 cho Mac). -> chi tat ham ve tren macOS; Windows giu mac dinh nhu
     ban anh da dung tu 01/10. deps.khongHam = true / false de ep (bai do). */
  const KHONG_HAM = deps.khongHam != null ? !!deps.khongHam : process.platform === 'darwin'

  let tt = 'mo'            // 'mo' = khay la khay · 'thu' = dang la nut tron · 'an' = nguoi dung an han nut
  let dangChay = false, viecMoi = false
  let anSan = false        // thu() da an NOI DUNG khay roi moi an cua so -> hien cua so khay som khong lo khay cu ra man
  let dien = null, nut = null
  let lanCuoi = Date.now(), truocHien = false

  // Che do do: cua so offscreen khong duoc show() that (se bat mot cua so len man anh) -> tu nho trang thai hien / an
  const hienGia = new WeakMap()
  const dangHien = (w) => !!w && !w.isDestroyed() && (TN ? !!hienGia.get(w) : w.isVisible())
  /* 02/10 13:3x — anh: "luc no bay ra thi no bi an o duoi" khi dang dung Premiere. showInactive() KHONG dua cua so len tren:
     no hien lai dung cho cu trong thu tu tren-duoi. Nut tron va san dien luon di kem moveTop() nen anh van thay / bam duoc
     nut; rieng KHAY truoc day hien bang hien(khay, false) -> nam duoi cua so cua Premiere (run-log 10:31-10:40: trang khay
     `an 1` 5/5 lan = bi che THAT). lenTren = khang dinh lai "noi tren cung" roi dua len dau; khong cuop tieu diem. */
  const hien = (w, lenTren) => {
    if (TN) { hienGia.set(w, true); return }
    w.showInactive()
    if (lenTren) { try { w.setAlwaysOnTop(true, 'screen-saver') } catch (e) {} w.moveTop() }
  }
  const an = (w) => { if (!w || w.isDestroyed()) return; if (TN) hienGia.set(w, false); else w.hide() }
  /** Chay JS trong trang, khong bao gio treo: trang an thi rAF dung (so loi "thuoc" 5ao) -> dua voi hen gio. */
  const js = (w, ma, ms = 1200) => Promise.race([
    w.webContents.executeJavaScript(ma, true).catch((e) => { log('khay-thu LOI js: ' + (e && e.message)); return null }),
    cho(ms).then(() => undefined),
  ])

  // San dien bao ve: 'san-sang' (da ve bong) · 'toi' (ong kinh toi tam khay) · 'xong' · 'sach' (da xoa het hinh)
  const doi = new Map()
  ipcMain.on('dien:bao', (e, ten, kem) => {
    if (!dien || dien.isDestroyed() || e.sender !== dien.webContents) return
    const ds = doi.get(ten)
    if (ds) { doi.delete(ten); ds.forEach((r) => r(kem && typeof kem === 'object' ? kem : true)) } // kem = so do cua chang do
  })
  const choBao = (ten, ms) => new Promise((res) => {
    if (!doi.has(ten)) doi.set(ten, [])
    doi.get(ten).push(res)
    setTimeout(() => res(false), ms)
  })
  ipcMain.on('nut:mo', (e) => { if (nut && !nut.isDestroyed() && e.sender === nut.webContents) bung('bam nut') })
  ipcMain.on('nut:an', (e) => { if (nut && !nut.isDestroyed() && e.sender === nut.webContents) anHan() })

  function datO(w, b, ten) {
    w.setBounds(b)
    if (TN) return
    let t = w.getBounds()
    if (lechDang(t, b)) { w.setBounds(b); t = w.getBounds() } // doi man khac ti le: lan dat dau co the lech (so loi #1)
    if (lechDang(t, b)) log('khay-thu CANH BAO cua so ' + ten + ' xin ' + JSON.stringify(b) + ' duoc ' + JSON.stringify(t))
  }
  function taoCuaSo(b, preload, trang, ten) {
    const w = new BrowserWindow({
      x: b.x, y: b.y, width: b.width, height: b.height,
      frame: false, transparent: true, backgroundColor: '#00000000', thickFrame: false, roundedCorners: false,
      resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
      focusable: false, skipTaskbar: true, hasShadow: false, show: false, enableLargerThanScreen: true,
      // 04/10 Mac: nut tron + san dien cung an / hien lien tuc -> khong de trang bi ham ve luc vua hien lai (xem ensureShelf)
      webPreferences: { preload: path.join(__dirname, preload), contextIsolation: true, sandbox: false, offscreen: TN, backgroundThrottling: KHONG_HAM ? false : true },
    })
    if (!TN) {
      w.setAlwaysOnTop(true, 'screen-saver')
      w.setContentProtection(true) // nut tron + san dien khong bao gio lot vao anh chup / video quay
    }
    datO(w, b, ten)
    w.webContents.on('console-message', (e, level, msg) => {
      const nang = typeof level === 'number' ? level >= 3 : e.level === 'error'
      if (nang) log('khay-thu LOI trang ' + ten + ': ' + String(msg || e.message).slice(0, 300))
    })
    w.webContents.on('preload-error', (_e, p, err) => log('khay-thu LOI preload ' + ten + ': ' + (err && err.message)))
    const xong = new Promise((r) => w.webContents.once('did-finish-load', () => r(true)))
    w.loadFile(path.join(__dirname, trang))
    w.__xong = Promise.race([xong, cho(4000).then(() => false)])
    return w
  }
  async function damBaoDien(wa) {
    const b = { x: wa.x, y: wa.y, width: wa.width, height: wa.height }
    if (!dien || dien.isDestroyed()) {
      dien = taoCuaSo(b, 'preload-dien.js', path.join('dien', 'index.html'), 'san dien')
      if (!TN) dien.setIgnoreMouseEvents(true)
      dien.on('closed', () => { dien = null })
    } else if (lechDang(dien.getBounds(), b)) datO(dien, b, 'san dien')
    if (!(await dien.__xong)) throw new Error('san dien khong nap xong')
    return dien
  }
  async function damBaoNut(wa) {
    const b = oCuaSoNut(wa)
    if (!nut || nut.isDestroyed()) {
      nut = taoCuaSo(b, 'preload-nut.js', path.join('nut', 'index.html'), 'nut tron')
      nut.on('closed', () => { nut = null })
    } else if (lechDang(nut.getBounds(), b)) datO(nut, b, 'nut tron')
    if (!(await nut.__xong)) throw new Error('nut tron khong nap xong')
    return nut
  }
  const goiNut = () => ({ mat: deps.anhMoiNhat() || '', so: deps.soAnh() || 0 })
  const manCua = (b) => (deps.manCua ? deps.manCua(b) : screen.getDisplayMatching(b))
  /** Xoa het hinh tren san roi moi an: lan hien sau khong lo khung cu (cua so an thi khong ve lai). */
  async function donDien() {
    if (!dien || dien.isDestroyed()) return
    const sach = choBao('sach', 300)
    dien.webContents.send('dien:lenh', { viec: 'don' })
    await sach
    an(dien)
  }

  /** Hien khay THANG (khong chuyen dong): dung khi khong co nut de bay ra, hoac khi san dien hong. */
  function hienThang(w) {
    w = w || deps.damBaoKhay()
    if (!w || w.isDestroyed()) return
    js(w, 'window.__khayAn && window.__khayAn(false)')
    an(nut)
    if (!dangHien(w)) hien(w, true)   // 02/10: dua len tren (truoc: false -> co the nam duoi cua so app khac)
    tt = 'mo'; lanCuoi = Date.now(); truocHien = true; anSan = false
  }

  /** THU khay ve nut tron (kieu B). Tra true neu da thu. */
  async function thu(lyDo) {
    const khay = deps.layKhay()
    if (tt !== 'mo' || dangChay || !dangHien(khay)) return false
    dangChay = true
    const t0 = Date.now()
    let soO = 0, wa = null
    try {
      const b = khay.getBounds()
      wa = manCua(b).workArea
      const tin = (await js(khay, 'window.__khayThongTin ? window.__khayThongTin() : null')) || { o: [] }
      const anh = await khay.webContents.capturePage()
      const [d] = await Promise.all([damBaoDien(wa), damBaoNut(wa)])
      const o = chonO(tin.o)
      soO = o.length
      const san = choBao('san-sang', 1800)
      hien(d, true)
      d.webContents.send('dien:lenh', Object.assign({ viec: 'thu', khay: tuongDoi(b, wa), anh: anh.toDataURL(), o, nut: tuongDoi(oTronNut(wa), wa) }, goiNut()))
      if (!(await san)) throw new Error('san dien khong san sang')
      const daAn = await js(khay, 'window.__khayAn && window.__khayAn(true)', 400) // bong da de len -> an noi dung khay that
      const xong = choBao('xong', 4000)
      d.webContents.send('dien:lenh', { viec: 'chay' })
      if (!(await xong)) log('khay-thu CANH BAO: san dien khong bao xong (thu)')
      nut.webContents.send('nut:cap-nhat', goiNut())
      hien(nut, true)
      await cho(TN ? 0 : 70)   // cho nut that ve xong roi moi go ban ve tren san (hai hinh trung nhau, khong nhay)
      an(khay)
      anSan = daAn === true // trang khay tu bao da ve khung trong -> lan bung sau duoc hien cua so khay som (hienSom)
      await donDien()
      tt = 'thu'
      log('khay thu (' + lyDo + '): ' + soO + ' o bay, ' + deps.soAnh() + ' anh, ' + (Date.now() - t0) + ' ms')
      return true
    } catch (err) {
      log('khay-thu LOI thu (' + lyDo + '): ' + (err && err.message) + ' -> an thang')
      anSan = false // khong chac noi dung khay da tang hinh -> lan bung sau di duong cu
      try {
        an(dien); an(khay)
        if (wa) { const n = await damBaoNut(wa); n.webContents.send('nut:cap-nhat', goiNut()); hien(n, true); tt = 'thu' } else tt = 'an'
      } catch (e2) { tt = 'an'; log('khay-thu LOI hien nut: ' + (e2 && e2.message)) }
      return tt === 'thu'
    } finally {
      dangChay = false
      if (viecMoi) { viecMoi = false; if (tt === 'thu') setTimeout(() => bung('co anh moi luc dang thu'), 0) }
    }
  }

  /* 02/10 SO DO TUNG CHANG cua lan bung (anh: "animation thuc te chua muot lam" — bai do an 30/30 dat ma man that van
     khung, vi cua so offscreen khong co do tre HIEN cua so that). Mot dong trong run-log, doc tu trai sang:
       cho N        = tu luc bam toi luc ong kinh bat dau bay (chuan bi + hien san dien + ve nut gia; ma / 2k = giai ma anh,
                      cho 2 khung) — trong luc nay nguoi dung KHONG thay gi chuyen dong
       bay N        = ong kinh bay (n khung, max = khoang cach lon nhat giua 2 khung; xa = quang duong px)
       noi +N/+N    = tu luc ong kinh TOI NOI toi luc trang khay bat dau chay / ve khung dau — ong kinh dung im trong luc nay
       bung N       = man trap cua khay bung ra (n khung, max)
       tan N        = ong kinh tan (n khung, max) · don N = xoa san dien
     ☠️ So khung do bang rAF: bat duoc khung rot cua luong chinh trang, KHONG thay do tre ghep hinh cua Windows. */
  function ghiDo(t0, m, kSan, kBay, kTan, kBung) {
    try {
      const o = (k) => (k && typeof k === 'object' ? k : null)
      const s = o(kSan), b = o(kBay), t = o(kTan), u = o(kBung)
      /* Do tre "noi" KHONG so dong ho cua 2 tien trinh (do 02/10: Date.now() cua trang va cua main lech nhau ~8 ms, ra so
         am). Tinh trong MOT dong ho: (main thay lenh bung di + ve mat bao lau) - (trang tu do no chay bao lau) = thoi gian
         lenh nam cho truoc khi trang bat dau chay; + dau = toi khung dau tien. */
      const tre = u && u.ms != null && m.bung ? Math.max(0, m.bung - m.hienKhay - u.ms) : null
      return ' | cho ' + (m.san - t0) + ' (chuan bi ' + (m.dien - t0) + ', hien san ' + (m.hienDien - m.dien) + (s ? ', ma ' + s.ma + ', 2k ' + s.khung : '') + ')'
        + ' | bay ' + (m.toi - m.san) + (b ? ' (' + b.n + ' khung, max ' + b.max + ', dau ' + b.dau + ', xa ' + b.xa + ')' : '')
        + ' | noi ' + (tre != null ? '+' + (m.hienKhay - m.toi + tre) + '/+' + (m.hienKhay - m.toi + tre + u.dau) : '?') + ' (hien khay ' + (m.hienKhay - m.toi) + ')'
        + ' | bung ' + (u && u.ms != null ? u.ms + ' (' + u.n + ' khung, max ' + u.max + ', hen ' + u.hen + ', an ' + u.an + ')' : '?')
        + ' | tan ' + (m.tan - m.hienKhay) + (t ? ' (' + t.n + ' khung, max ' + t.max + ', dau ' + t.dau + ', hen ' + t.hen + ', an ' + t.an + ')' : '')
        + ' | don ' + (m.don - (m.donTu || m.tan))
        // main = do nghen lon nhat cua luong chinh trong ca lan bung (hen 4 ms) · chuot = con tro co nam trong khay luc khay hien
        + ' | main ' + m.main + ' | chuot ' + (m.chuot == null ? '?' : m.chuot)
        // som N (04/10 Mac) = luot nay cua so khay duoc hien tu dau (hienSom), lenh hien mat N ms; khong co = duong cu
        + (m.som != null ? ' | som ' + m.som : '')
    } catch (e) { return '' }
  }

  /** XUAT HIEN khay tu nut tron (kieu A). Khong co nut (tt 'an' / chua tung thu) thi hien thang. */
  async function bung(lyDo) {
    if (dangChay) return false
    const khay = deps.damBaoKhay()
    if (!khay || khay.isDestroyed()) return false
    if (tt !== 'thu' || !dangHien(nut)) { hienThang(khay); return true }
    dangChay = true
    const t0 = Date.now()
    let henMain = null
    try {
      const b = khay.getBounds()
      const man = manCua(b), wa = man.workArea
      if (!TN && manCua(nut.getBounds()).id !== man.id) throw new Error('nut va khay khac man hinh')
      js(khay, 'window.__khayAn && window.__khayAn(true)') // khay dang an: dat san trang thai, khong cho (rAF dung)
      const d = await damBaoDien(wa)
      const m = { dien: Date.now(), main: 0 } // 02/10: moc gio tung chang, ghi vao run-log (xem ghiDo ben duoi)
      // do nghen cua luong chinh (main) suot lan bung: hen gio 4 ms, ghi khoang cach lon nhat
      let hTruoc = Date.now()
      henMain = setInterval(() => { const bay = Date.now(); m.main = Math.max(m.main, bay - hTruoc); hTruoc = bay }, 4)
      const san = choBao('san-sang', 1800)
      // hienSom (04/10 Mac): cua so khay len man TU BAY GIO, noi dung dang tang hinh; san dien hien sau nen nam TREN khay
      const somDuoc = HIEN_SOM && anSan
      if (somDuoc) { const tS = Date.now(); hien(khay, true); m.som = Date.now() - tS }
      hien(d, true)
      m.hienDien = Date.now()
      d.webContents.send('dien:lenh', Object.assign({ viec: 'mo', nut: tuongDoi(oTronNut(wa), wa), dich: { x: b.x - wa.x + b.width / 2, y: b.y - wa.y + b.height / 2 } }, goiNut()))
      const kSan = await san
      if (!kSan) throw new Error('san dien khong san sang')
      m.san = Date.now()
      an(nut)
      const toi = choBao('toi', 2500)
      d.webContents.send('dien:lenh', { viec: 'chay' })
      const kBay = await toi
      if (!kBay) log('khay-thu CANH BAO: san dien khong bao toi (bung)')
      m.toi = Date.now()
      try { m.chuot = trongO(deps.conTro ? deps.conTro() : screen.getCursorScreenPoint(), b, 8) ? 1 : 0 } catch (e) {}
      if (!somDuoc) hien(khay, true)    // 02/10: khay PHAI len tren cung luc hien (san dien duoc dua len tren khay ngay duoi day)
      m.hienKhay = Date.now()
      const bungXong = js(khay, 'window.__khayBung ? window.__khayBung() : (window.__khayAn && window.__khayAn(false))', 1500)
        .then((k) => { m.bung = Date.now(); return k })
      if (!TN && !somDuoc) d.moveTop() // ong kinh tan PHIA TREN khay vua hien (hienSom: san dien da nam tren khay tu dau)
      const xong = choBao('xong', 1500)
      d.webContents.send('dien:lenh', { viec: 'tan' })
      const kTan = await xong
      m.tan = Date.now()
      if (somDuoc) await bungXong // hienSom: khong an cua so san dien (phu ca man) khi man trap con dang bung
      m.donTu = Date.now()
      await donDien()
      m.don = Date.now()
      const kBung = await bungXong
      tt = 'mo'; lanCuoi = Date.now(); truocHien = true; anSan = false
      log('khay bung (' + lyDo + '): ' + (Date.now() - t0) + ' ms' + ghiDo(t0, m, kSan, kBay, kTan, kBung))
      return true
    } catch (err) {
      log('khay-thu LOI bung (' + lyDo + '): ' + (err && err.message) + ' -> hien thang')
      an(dien)
      hienThang(khay)
      return true
    } finally { dangChay = false; if (henMain) clearInterval(henMain) }
  }

  /** Nguoi dung bam x tren nut: an han nut. Lan chup sau / menu khay he thong se hien khay lai. */
  function anHan() {
    if (dangChay) return
    an(nut)
    tt = 'an'
    log('khay: an han nut tron')
  }

  /* TU THU: 0,4 giay hoi mot lan. Con tro nam trong khay / dang keo, doi co, chup -> tinh lai tu dau.
     Hoi con tro o main (khong nho su kien re chuot cua trang): keo anh ra app khac, tha chuot ngoai cua so... deu dung. */
  function nhip() {
    if (dangChay || tt !== 'mo' || (deps.tuDong && !deps.tuDong())) return
    const k = deps.layKhay()
    if (!dangHien(k)) { truocHien = false; return }
    const bay = Date.now()
    if (!truocHien) { truocHien = true; lanCuoi = bay }
    const p = deps.conTro ? deps.conTro() : screen.getCursorScreenPoint()
    if ((deps.banKhac && deps.banKhac()) || trongO(p, k.getBounds(), 8)) { lanCuoi = bay; return }
    const g = giayHopLe(deps.docGiay())
    if (bay - lanCuoi >= g * 1000) thu('tu dong sau ' + g + ' giay')
  }
  const henDo = setInterval(nhip, 400)
  if (henDo.unref) henDo.unref()

  return {
    thu, bung, anHan, hienThang,
    trangThai: () => tt,
    dangChay: () => dangChay,
    /** Vua co viec tren khay (them anh, tha keo...) -> tinh lai thoi gian cho. Neu khay DANG bay ve nut thi nho lai:
        thu xong se bung ra ngay (khong de anh vua chup nam khuat trong nut). */
    chamVao: () => { lanCuoi = Date.now(); if (dangChay) viecMoi = true },
    /** Sap chup man hinh: go san dien ngay (cua so trong suot phu len video lau la video den — so loi 0.4.15). */
    huy: () => { if (dangHien(dien)) an(dien) },
    /** So anh / anh moi nhat doi khi dang la nut tron. */
    capNhatNut: () => { if (dangHien(nut)) nut.webContents.send('nut:cap-nhat', goiNut()) },
    dongHet: () => { clearInterval(henDo); for (const w of [dien, nut]) { if (w && !w.isDestroyed()) w.destroy() } },
    _cuaSo: () => ({ dien, nut }),
    _nhip: nhip,
  }
}

module.exports = { taoKhayThu, NUT, GIAY, giayHopLe, oTronNut, oCuaSoNut, tuongDoi, chonO, trongO, lechDang }
