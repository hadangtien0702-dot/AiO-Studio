'use strict'
/* =========================================================================
   Do cac loi Codex bat duoc o luot soat sau gop dot 3 (06/11/2026), PHAN 2: doi ten · tai lieu · video — chay: npm run test:saugop2
   [D1] Doi ten file: lop sua (net ve + anh sach) di theo ten moi, mo sua tiep duoc, lan don khong xoa nham.
   [D2] Doi ten file: ban nhap tai lieu + anh them tu may + cua so dang cam duong dan cu (luu nhap / xuat / nap lai) khong rot buoc, khong mat mo ta.
   [D3] Xuat Markdown: KHONG ghi de file co san cua nguoi khac; xuat lai thi go anh do CHINH luot truoc ghi ra ma buoc moi khong dung nua.
   [D4] Ban "Khong tieng" cu (chi doi ten hop, du lieu tieng van nam trong file) khong duoc dung lai; main tao lai.
   [D5] Man Sua video tai lai giua luc xuat: nhan duoc ket qua, mo khoa lai (Electron AN, show:false).
   [D6] File xuat do \`-da-sua.mp4.tam\` duoc don luc mo app, chi dung ten do app dat, khong dung file moi / file la.
   CHAY AN. Khong dung thu muc anh that / %APPDATA% (thu muc tam trong .selftest/sau-gop-2). Phan D5 can ffmpeg tren may.
   DOI CHUNG: AIO_SRC=<thu muc src cua ma cu, vd git archive 41d6ae4 src> thi cung bai nay PHAI truot dung D1..D6.
   ========================================================================= */
process.stdout.on('error', () => {}); process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.log('LOI=' + String(e && e.stack).replace(/\n/g, ' | ')) } catch (x) {} process.exit(2) })
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '..', '..')
const SRC = process.env.AIO_SRC ? path.resolve(process.env.AIO_SRC) : path.join(ROOT, 'src')
const RA = path.join(ROOT, '.selftest', 'sau-gop-2')

/* ───────────── PHAN ELECTRON (D5) ───────────── */
if (process.versions.electron) {
  const { app, ipcMain } = require('electron')
  const dir = process.env.AIO_GOP2_RA
  app.setName('aio-do-sau-gop-2')
  app.setPath('userData', path.join(dir, 'userData'))
  app.on('window-all-closed', () => {})
  ipcMain.on('i18n:lang', (e) => { e.returnValue = 'vi' })
  const ra = { buoc: {}, nhatKy: [] }
  const suaVideo = require(path.join(SRC, 'sua-video.js'))
  const ID = 'vid-20260101-000000-001'
  const m = { id: ID, file: path.join(dir, 'gop2.mp4'), ms: 90000, w: 640, h: 360, tieng: false }
  suaVideo.khoiTao({ ghiLog: (x) => ra.nhatKy.push(String(x).slice(0, 200)), moiDesktop: () => {}, tim: (id) => (id === ID ? m : null), keoAnToan: (f) => f, chiAn: true })
  const cho = (ms) => new Promise((r) => setTimeout(r, ms))
  
  app.whenReady().then(async () => {
    try {
      suaVideo.moCuaSo(ID)
      const w = suaVideo.cuaSoHienTai()
      const js = (c) => w.webContents.executeJavaScript(c)
      const sanSang = async () => { const han = Date.now() + 20000; while (Date.now() < han) { if (await js('!!document.getElementById("ten-file") && document.getElementById("ten-file").textContent.length > 0 && !document.getElementById("nut-xuat").disabled').catch(() => false)) return true; await cho(150) } return false }
      const doc = () => js(`JSON.stringify({ xuatKhoa: document.getElementById('nut-xuat').disabled, huyHien: !document.getElementById('nut-huy').hidden, ketQua: !document.getElementById('ket-qua').hidden, ten: document.getElementById('kq-ten').textContent })`).then(JSON.parse)
      ra.buoc.mo = await sanSang()
      // bam Xuat bang chuot that
      const p = await js(`(() => { const r = document.getElementById('nut-xuat').getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }) })()`).then(JSON.parse)
      for (const type of ['mouseMove', 'mouseDown', 'mouseUp']) { w.webContents.sendInputEvent({ type, x: p.x, y: p.y, button: 'left', clickCount: 1 }); await cho(60) }
      const han = Date.now() + 15000
      while (Date.now() < han && !suaVideo.dangBan()) await cho(50)
      ra.buoc.dangBan = suaVideo.dangBan()
      // TAI LAI man giua luc xuat (bam Sua lan nua tren cung video)
      suaVideo.moCuaSo(ID)
      await cho(300)
      const han2 = Date.now() + 20000
      while (Date.now() < han2) { if (await js('!!document.getElementById("ten-file") && document.getElementById("ten-file").textContent.length > 0').catch(() => false)) break; await cho(100) }
      ra.buoc.saiTaiLai = await doc()
      ra.buoc.vanBan = suaVideo.dangBan() // true = tai lai dung luc dang xuat (neu false thi bai chua do duoc gi)
      // cho viec xuat xong
      const han3 = Date.now() + 120000
      while (Date.now() < han3 && suaVideo.dangBan()) await cho(100)
      await cho(1200)
      ra.buoc.sauXong = await doc()
      ra.file = fs.readdirSync(dir).filter((f) => /-da-sua/.test(f))
    } catch (e) { ra.loi = String(e && e.stack) }
    console.log('KQ=' + JSON.stringify(ra))
    app.exit(0)
  })
  return
}

/* ───────────── PHAN NODE ───────────── */
const kq = []
let dat = true
const kiem = (ten, ok, ct) => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (ct ? ' (' + String(ct).slice(0, 220) + ')' : '')); if (!ok) dat = false }
const thuLai = (f) => { try { return f() } catch (e) { return { loi: String(e && e.message) } } }
fs.rmSync(RA, { recursive: true, force: true })
fs.mkdirSync(RA, { recursive: true })
const tam = (ten) => { const d = path.join(RA, ten); fs.mkdirSync(d, { recursive: true }); return d }
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(60, 7)])

;(async () => {
  // ---------- D1 lop sua theo ten moi ----------
  {
    const { taoLopSua } = require(path.join(SRC, 'lop-sua.js'))
    const ud = tam('d1-ud'), anh = tam('d1-anh')
    const ls = taoLopSua(ud, () => {})
    const a = path.join(anh, 'chup-1.png'), b = path.join(anh, 'Gmail - Hop thu.png')
    fs.writeFileSync(a, png)
    const sach = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(40, 9)])
    const g = ls.ghi(a, { shapes: [{ kind: 'khung', x: 1, y: 2 }], dpr: 1, dipW: 10, dipH: 10, sach })
    kiem('D1 co lop sua cua anh cu truoc khi doi ten', g.ok === true && !!ls.doc(a))
    fs.renameSync(a, b) // tu dat ten doi ten file that
    kiem('D1 ham doiTen cua lop sua ton tai', typeof ls.doiTen === 'function')
    const r = typeof ls.doiTen === 'function' ? thuLai(() => ls.doiTen(a, b)) : { loi: 'khong co ham' }
    kiem('D1 doiTen(cu, moi) ok', r.ok === true, JSON.stringify(r))
    const d = ls.doc(b)
    kiem('D1 mo sua tiep anh TEN MOI duoc: con net ve + anh sach', !!d && d.bang.shapes.length === 1 && d.sach.equals(sach), d ? 'duong ' + path.basename(d.bang.duong) : 'null')
    kiem('D1 bang ghi duong dan anh MOI (khong con tro ten cu)', !!d && path.basename(d.bang.duong) === path.basename(b))
    kiem('D1 lop sua ten cu khong con nam lai (khong mo coi)', !ls.doc(a) && fs.readdirSync(ls.dir).length === 2, fs.readdirSync(ls.dir).join(','))
    ls.donDep()
    kiem('D1 don dep khong xoa lop sua cua anh ten moi', !!ls.doc(b))
    // anh bi sua ben ngoai luc doi ten van bi nhan ra (dung luong khong duoc "giat" lai)
    fs.writeFileSync(b, Buffer.concat([png, Buffer.from('them')]))
    kiem('D1 anh doi noi dung sau do: lop sua bi bo qua (khong ve net cu len anh khac)', ls.doc(b) === null)
  }

  // ---------- D2 tai lieu theo ten moi ----------
  {
    const taiLieuMod = require(path.join(SRC, 'tai-lieu-main.js'))
    const ud = tam('d2-ud'), anh = tam('d2-anh'), dich = tam('d2-dich')
    process.env.AIO_TAI_LIEU_DICH_THU = dich
    const a = path.join(anh, 'chup-1.png'), b = path.join(anh, 'Dang nhap - Admin.png')
    fs.writeFileSync(a, png)
    const hinh = { getSize: () => ({ width: 10, height: 10 }), resize() { return this }, toJPEG: () => Buffer.from('jpg'), isEmpty: () => false }
    const tl = taiLieuMod.khoiTao({
      ipcMain: { handle() {}, on() {} }, BrowserWindow: function () {}, screen: {}, dialog: {}, shell: {}, nativeImage: {}, app: { getPath: () => anh },
      kho: { docAnhFile: async () => hinh }, ghiLog: () => {}, icon: '', moiDesktop: () => {}, lang: () => 'vi', layKhay: () => [],
      thuMucDuLieu: path.join(ud, 'tai-lieu'),
    })
    tl.luuNhap({ tieuDe: 'Huong dan', buoc: [{ khoa: a, moTa: 'Buoc dang nhap' }] })
    fs.renameSync(a, b)
    kiem('D2 tai lieu co ham doiTen', typeof tl.doiTen === 'function')
    if (typeof tl.doiTen === 'function') tl.doiTen(a, b)
    // cua so dang mo van cam khoa CU: luu nhap + xuat bang khoa cu
    tl.luuNhap({ tieuDe: 'Huong dan', buoc: [{ khoa: a, moTa: 'Buoc dang nhap' }] })
    const nhap = JSON.parse(fs.readFileSync(path.join(ud, 'tai-lieu', 'nhap.json'), 'utf8'))
    kiem('D2 ban nhap ghi duong dan ANH MOI (khong rot khi luu bang khoa cu cua cua so)', nhap.buoc.length === 1 && nhap.buoc[0].khoa === b && nhap.buoc[0].moTa === 'Buoc dang nhap', JSON.stringify(nhap.buoc))
    const x = await tl.xuat({ kieu: 'html', tieuDe: 'Huong dan', buoc: [{ khoa: a, moTa: 'Buoc dang nhap' }] })
    kiem('D2 xuat bang khoa cu van ra tai lieu (khong bao anh mat)', x.ok === true && x.soBuoc === 1, JSON.stringify(x).slice(0, 160))
    const l = await tl.lay()
    kiem('D2 mo lai cua so: buoc + mo ta con nguyen', l.buoc.length === 1 && l.buoc[0].moTa === 'Buoc dang nhap' && l.buoc[0].khoa === b && l.anhMat === 0, JSON.stringify({ n: l.buoc.length, mat: l.anhMat }))
    // anh them tu may (chua nam trong ban nhap) cung doi theo
    const c = path.join(anh, 'tu-may.png'), d = path.join(anh, 'tu-may-moi.png')
    fs.writeFileSync(c, png)
    await tl.lay() // khong thay doi; nap anh rieng bang luu nhap + lay
    tl.luuNhap({ tieuDe: 'T', buoc: [{ khoa: c, moTa: '1' }] })
    await tl.lay()
    fs.renameSync(c, d)
    if (typeof tl.doiTen === 'function') tl.doiTen(c, d)
    const l2 = await tl.lay()
    kiem('D2 anh them tu may: doi ten xong van con 1 buoc, khoa moi', l2.buoc.length === 1 && l2.buoc[0].khoa === d && l2.anhMat === 0, JSON.stringify({ n: l2.buoc.length, mat: l2.anhMat }))
    delete process.env.AIO_TAI_LIEU_DICH_THU
  }

  // ---------- D3 Markdown ----------
  {
    const taiLieuMod = require(path.join(SRC, 'tai-lieu-main.js'))
    const xuatLib = require(path.join(SRC, 'tai-lieu-xuat.js'))
    const ud = tam('d3-ud'), anh = tam('d3-anh'), dich = tam('d3-dich')
    process.env.AIO_TAI_LIEU_DICH_THU = dich
    const tl = taiLieuMod.khoiTao({
      ipcMain: { handle() {}, on() {} }, BrowserWindow: function () {}, screen: {}, dialog: {}, shell: {}, nativeImage: {}, app: { getPath: () => anh },
      kho: { docAnhFile: async () => null }, ghiLog: () => {}, icon: '', moiDesktop: () => {}, lang: () => 'vi', layKhay: () => [],
      thuMucDuLieu: path.join(ud, 'tai-lieu'),
    })
    const buocTu = (n) => { const ds = []; for (let i = 1; i <= n; i++) { const f = path.join(anh, 'b' + i + '.png'); fs.writeFileSync(f, Buffer.concat([png, Buffer.from('buoc' + i)])); ds.push({ khoa: f, moTa: 'Buoc ' + i }) } return ds }
    const ten = xuatLib.tenFileTuTieuDe('Huong dan', 'tai-lieu')
    // (a) thu muc anh da co file ten buoc-01.png cua NGUOI KHAC
    const dirNguoi = path.join(dich, ten + '_anh')
    fs.mkdirSync(dirNguoi, { recursive: true })
    const cuaNguoi = Buffer.from('ANH NGUON CUA NGUOI KHAC')
    fs.writeFileSync(path.join(dirNguoi, 'buoc-01.png'), cuaNguoi)
    const x1 = await tl.xuat({ kieu: 'md', tieuDe: 'Huong dan', buoc: buocTu(2) })
    kiem('D3a xuat Markdown ok', x1.ok === true, JSON.stringify(x1).slice(0, 160))
    kiem('D3a file co san cua nguoi khac KHONG bi ghi de', fs.readFileSync(path.join(dirNguoi, 'buoc-01.png')).equals(cuaNguoi))
    const md1 = x1.ok ? fs.readFileSync(x1.duong, 'utf8') : ''
    const m1 = /\]\(([^)]+)\/buoc-01\.png\)/.exec(md1)
    const dirMoi = m1 ? path.join(dich, decodeURIComponent(m1[1])) : ''
    kiem('D3a anh nam o thu muc khac va .md tro dung thu muc do', !!m1 && dirMoi !== dirNguoi && fs.existsSync(path.join(dirMoi, 'buoc-01.png')) && fs.existsSync(path.join(dirMoi, 'buoc-02.png')), m1 ? m1[1] : 'khong thay lien ket')
    // (b) xuat lai cung ten, it buoc hon: anh luot truoc khong con dung phai bi go, file la trong thu muc giu nguyen
    const tieuB = 'Tai lieu B'
    const tenB = xuatLib.tenFileTuTieuDe(tieuB, 'tai-lieu')
    const y1 = await tl.xuat({ kieu: 'md', tieuDe: tieuB, buoc: buocTu(3) })
    const dirB = path.join(dich, tenB + '_anh')
    kiem('D3b xuat lan 1 (3 buoc): du 3 anh', y1.ok === true && ['buoc-01.png', 'buoc-02.png', 'buoc-03.png'].every((f) => fs.existsSync(path.join(dirB, f))), JSON.stringify(y1).slice(0, 120))
    fs.writeFileSync(path.join(dirB, 'ghi-chu.txt'), 'file cua nguoi dung')
    const y2 = await tl.xuat({ kieu: 'md', tieuDe: tieuB, buoc: buocTu(2) })
    kiem('D3b xuat lai (bo buoc 3): anh buoc-03 da bo KHONG nam lai trong thu muc gui di', y2.ok === true && !fs.existsSync(path.join(dirB, 'buoc-03.png')), fs.readdirSync(dirB).join(','))
    kiem('D3b anh con dung van con + file la cua nguoi dung khong bi go', fs.existsSync(path.join(dirB, 'buoc-01.png')) && fs.existsSync(path.join(dirB, 'buoc-02.png')) && fs.existsSync(path.join(dirB, 'ghi-chu.txt')), fs.readdirSync(dirB).join(','))
    const y3 = await tl.xuat({ kieu: 'md', tieuDe: tieuB, buoc: buocTu(1) })
    kiem('D3b xuat lan 3 (1 buoc): chi con buoc-01 + file la', y3.ok === true && fs.readdirSync(dirB).sort().join(',') === 'buoc-01.png,ghi-chu.txt', fs.readdirSync(dirB).join(','))
    delete process.env.AIO_TAI_LIEU_DICH_THU
  }

  // ---------- D4 ban Khong tieng cu ----------
  {
    const boTieng = require(path.join(SRC, 'mp4-bo-tieng.js'))
    const hop = (loai, noiDung) => { const b = Buffer.alloc(8 + noiDung.length); b.writeUInt32BE(b.length, 0); b.write(loai, 4, 'latin1'); noiDung.copy(b, 8); return b }
    const ftyp = hop('ftyp', Buffer.from('isom\0\0\0\0isomiso2', 'latin1'))
    // ban CU: trak tieng chi bi doi ten thanh 'free', bo mo ta (hdlr 'soun', mp4a, esds) van nam trong do
    const trakTiengCu = hop('free', Buffer.concat([hop('hdlr', Buffer.from('\0\0\0\0\0\0\0\0soun', 'latin1')), hop('mp4a', Buffer.alloc(12)), hop('esds', Buffer.alloc(8))]))
    const trakHinh = hop('trak', hop('mdia', hop('hdlr', Buffer.from('\0\0\0\0\0\0\0\0vide', 'latin1'))))
    const fCu = path.join(tam('d4'), 'cu-khong-tieng.mp4'), fMoi = path.join(tam('d4'), 'moi-khong-tieng.mp4')
    fs.writeFileSync(fCu, Buffer.concat([ftyp, hop('moov', Buffer.concat([hop('mvhd', Buffer.alloc(20)), trakHinh, trakTiengCu])), hop('mdat', Buffer.alloc(32))]))
    fs.writeFileSync(fMoi, Buffer.concat([ftyp, hop('moov', Buffer.concat([hop('mvhd', Buffer.alloc(20)), trakHinh])), hop('mdat', Buffer.alloc(32))]))
    kiem('D4 co ham sachTieng', typeof boTieng.sachTieng === 'function')
    if (typeof boTieng.sachTieng === 'function') {
      kiem('D4 ban cu (chi doi ten hop) KHONG duoc coi la khong tieng', boTieng.sachTieng(fCu) === false)
      kiem('D4 ban that su bo tieng duoc coi la sach', boTieng.sachTieng(fMoi) === true)
      kiem('D4 file khong doc duoc / khong phai MP4 -> khong sach', boTieng.sachTieng(path.join(RA, 'khong-co.mp4')) === false)
    }
    // main.js: ham banKhongTieng that su dung ket qua do (trich ham tu ma that, chay voi file that)
    const ms = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8').replace(/\r\n/g, '\n')
    const lay = (ten) => { const i = ms.indexOf('function ' + ten + '('); return i < 0 ? '' : ms.slice(i, ms.indexOf('\n', i)) }
    const ma = ['banKhongTiengCo', 'banKhongTieng'].map(lay).filter(Boolean).join('\n')
    const mk = new Function('fs', 'sachTieng', ma + '\nreturn { banKhongTieng: typeof banKhongTieng === "function" ? banKhongTieng : null, banKhongTiengCo: typeof banKhongTiengCo === "function" ? banKhongTiengCo : null }')
    const h = mk(fs, boTieng.sachTieng || (() => true))
    kiem('D4 main: video co ban Khong tieng CU -> banKhongTieng tra null (de tao lai), khong dung lai', !!h.banKhongTieng && h.banKhongTieng({ fileKhongTieng: fCu }) === null)
    kiem('D4 main: ban moi sach -> dung', !!h.banKhongTieng && h.banKhongTieng({ fileKhongTieng: fMoi }) === fMoi)
    kiem('D4 main: file cu van "con tren dia" de xoa / ghi de (khong bi bo roi)', !!h.banKhongTiengCo && h.banKhongTiengCo({ fileKhongTieng: fCu }) === fCu)
    kiem('D4 main: chon "Khong tieng" ghi de len chinh file cu thay vi dung lai', /f = banKhongTiengCo\(m\) \|\|/.test(ms))
  }

  // ---------- D6 file xuat do .tam ----------
  {
    const khoVideo = require(path.join(SRC, 'kho-video.js'))
    const d = tam('d6')
    const cu = (ten, phutTruoc) => { const f = path.join(d, ten); fs.writeFileSync(f, 'do'); const t = new Date(Date.now() - phutTruoc * 60000); fs.utimesSync(f, t, t); return f }
    const doA = cu('shotandsave-video-2026-11-06-101010-123-da-sua.mp4.tam', 5)
    const doB = cu('shotandsave-video-2026-11-06-101010-123-da-sua-2.mp4.tam', 5)
    const moi = cu('shotandsave-video-2026-11-06-111111-456-da-sua.mp4.tam', 0) // dang ghi (vua tao)
    const dangChay = cu('shotandsave-video-2026-11-06-121212-789-da-sua.mp4.tam', 5)
    const la = cu('bai-cua-toi-da-sua.mp4.tam', 5) // khong phai ten do app dat
    const video = cu('shotandsave-video-2026-11-06-101010-123-da-sua.mp4', 5) // video that, khong phai .tam
    kiem('D6 co ham donTamSua', typeof khoVideo.donTamSua === 'function')
    if (typeof khoVideo.donTamSua === 'function') {
      const r = khoVideo.donTamSua(d, { boQua: dangChay })
      kiem('D6 go dung 2 file xuat do cu', r.go.length === 2 && !fs.existsSync(doA) && !fs.existsSync(doB), JSON.stringify(r))
      kiem('D6 KHONG dung vao file dang ghi (moi), file cua luot xuat dang chay, file ten la, video that', [moi, dangChay, la, video].every((f) => fs.existsSync(f)))
    }
    kiem('D6 khoi phuc quay do (timTam) van KHONG nhat file xuat do len thanh video', khoVideo.timTam(d).length === 0)
  }

  // ---------- D5 man Sua video tai lai giua luc xuat ----------
  {
    const { spawnSync } = require('child_process')
    const ff = spawnSync('ffmpeg', ['-version'])
    if (ff.error || ff.status !== 0) kiem('D5 can ffmpeg tren may de tao video thu', false, 'khong co ffmpeg')
    else {
      const dir = tam('d5')
      const v = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', '90', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', 'frag_keyframe+empty_moov+default_base_moof', path.join(dir, 'gop2.mp4')], { encoding: 'utf8' })
      if (v.status !== 0) kiem('D5 tao video thu bang ffmpeg', false, (v.stderr || '').slice(0, 120))
      else {
        let electron
        try { electron = require('electron') } catch (e) { electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron') }
        const env = Object.assign({}, process.env, { AIO_GOP2_RA: dir, AIO_SRC: SRC })
        delete env.ELECTRON_RUN_AS_NODE
        let K = null, nhanXet = ''
        for (let lan = 0; lan < 2 && !(K && !K.loi && K.buoc.vanBan); lan++) { // may ban / xuat nhanh hon tai lai: thu lai MOT lan
          for (const f of fs.readdirSync(dir)) if (/-da-sua|\.tam$/.test(f)) { try { fs.unlinkSync(path.join(dir, f)) } catch (e) {} }
          const r = spawnSync(electron, [__filename], { env, encoding: 'utf8', timeout: 240000 })
          const dong = (r.stdout || '').split(/\r?\n/).find((l) => l.startsWith('KQ='))
          K = dong ? JSON.parse(dong.slice(3)) : null
          nhanXet = K ? '' : ((r.stdout || '') + (r.stderr || '')).slice(-200)
        }
        kiem('D5 chay duoc Electron an', !!K && !K.loi, nhanXet || (K && (K.loi || (K.nhatKy || []).join(' | '))))
        if (K && !K.loi) {
          kiem('D5 tai lai DUNG luc dang xuat (khong phai xuat xong roi moi tai lai)', K.buoc.dangBan === true && K.buoc.vanBan === true, JSON.stringify([K.buoc.dangBan, K.buoc.vanBan]))
          kiem('D5 trang tai lai khoa giao dien vi viec van chay (nut xuat khoa, co nut Huy)', K.buoc.saiTaiLai.xuatKhoa === true && K.buoc.saiTaiLai.huyHien === true, JSON.stringify(K.buoc.saiTaiLai))
          kiem('D5 xuat xong: trang MOI nhan ket qua, mo khoa lai, hien ten file', K.buoc.sauXong.xuatKhoa === false && K.buoc.sauXong.huyHien === false && K.buoc.sauXong.ketQua === true && /gop2-da-sua\.mp4/.test(K.buoc.sauXong.ten), JSON.stringify(K.buoc.sauXong))
          kiem('D5 file xuat co that, khong con .tam', K.file.join(',') === 'gop2-da-sua.mp4', K.file.join(','))
        }
      }
    }
  }

  console.log((dat ? 'TAT CA DAT' : 'CO MUC TRUOT') + (process.env.AIO_SRC ? '  [chay tren ma: ' + SRC + ']' : ''))
  console.log(kq.join('\n'))
  process.exit(dat ? 0 : 1)
})().catch((e) => { console.log('LOI: ' + (e && e.stack)); process.exit(2) })
