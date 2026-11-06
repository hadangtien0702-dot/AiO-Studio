'use strict'
/* Do 8 LOI vung "ban quyen / cau hinh / keo-tha" (Codex soat 05/11, doc lai ma 06/11) — chay: npm run test:nguonngoai
   Khong bat cua so, khong can Electron (gia `electron.app.getPath`), khong goi mang (Polar GIA). Moi file nam trong os.tmpdir(),
   bai nay tao va tu xoa.
   DOI CHUNG: bai tu lay ban CU (commit ab2a311) cua banquyen.js / kho.js bang `git show` roi chay CUNG cac muc: ban cu phai TRUOT
   dung cac muc ghi "(cu truot)". Khong lay duoc ban cu (khong co git) thi bao thang va bo qua phan doi chung. */
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.log('LOI KHONG BAT: ' + (e && e.stack || e)) } catch (x) {} process.exit(2) })

const Module = require('module')
const fs = require('fs')
const os = require('os')
const path = require('path')
const cp = require('child_process')

const ROOT = path.resolve(__dirname, '..', '..')
const NGAY = 86400000
let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) } }
const tamDaTao = []
const mkTam = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-nn-' + t + '-')); tamDaTao.push(d); return d }
const loiHdh = (ma) => { const e = new Error(ma + ': gia loi he dieu hanh'); e.code = ma; return e }

/* ---- Ban cu tu git ---- */
const BAN_CU_COMMIT = 'ab2a311'
function layBanCu() {
  try {
    const dir = mkTam('cu'); fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
    const toanBo = cp.execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT, encoding: 'utf8' }).trim()
    const rel = path.relative(toanBo, ROOT).split(path.sep).join('/')
    for (const f of ['banquyen.js', 'kho.js', 'ghi-ben.js']) {
      const txt = cp.execFileSync('git', ['show', BAN_CU_COMMIT + ':' + rel + '/src/' + f], { cwd: ROOT, maxBuffer: 1 << 24 })
      fs.writeFileSync(path.join(dir, 'src', f), txt)
    }
    return dir
  } catch (e) { console.log('  (khong lay duoc ban cu tu git: ' + e.message.split('\n')[0] + ' -> bo qua doi chung)'); return null }
}
const CU = layBanCu()

/* ---- kho.js voi electron gia ---- */
let userData = ''
const napGoc = Module._load
Module._load = function (req) {
  if (req === 'electron') return { app: { getPath: () => userData, isPackaged: true } }
  return napGoc.apply(this, arguments)
}
function napKho(ban) {
  const f = path.join(ban === 'cu' ? CU : ROOT, 'src', 'kho.js')
  delete require.cache[require.resolve(f)]
  return require(f)
}
function napBq(ban) {
  const f = path.join(ban === 'cu' ? CU : ROOT, 'src', 'banquyen.js')
  delete require.cache[require.resolve(f)]
  return require(f)
}

/* ---- Polar gia (2 ma, moi ma gioi han 2 may; co the GIU mot cau tra loi lai de mo phong "tra loi ve muon") ---- */
const ORG = '05f1edf9-2456-4d3f-8ff1-a824e433673e'
function polarGia(keys) {
  const p = { may: new Map(), giu: null, doTre: 0, goi: [] }
  let dem = 0
  const tra = (status, json) => ({ status, text: async () => (json == null ? '' : JSON.stringify(json)) })
  const loi = (status, detail) => tra(status, { error: status === 403 ? 'NotPermitted' : 'ResourceNotFound', detail })
  p.fetch = async (url, opt) => {
    const duong = url.split('/').pop(), b = JSON.parse(opt.body)
    p.goi.push(duong)
    if (p.doTre && duong === 'activate') await new Promise((r) => setTimeout(r, p.doTre))
    if (p.giu && p.giu.duong === duong && p.giu.act === b.activation_id) { // giu cau tra loi toi khi nha
      await new Promise((r) => { p.giu.nha = r })
      return p.giu.tra
    }
    if (b.organization_id !== ORG || !keys.includes(b.key)) return loi(404, 'Not found')
    const soMay = [...p.may.values()].filter((m) => m.key === b.key).length
    if (duong === 'activate') {
      if (soMay >= 2) return loi(403, 'License key activation limit already reached')
      const id = 'act-' + (++dem); p.may.set(id, { key: b.key })
      return tra(200, { id, license_key: { display_key: '****-' + b.key.slice(-4), expires_at: null } })
    }
    if (duong === 'validate') {
      if (b.activation_id && !p.may.has(b.activation_id)) return loi(404, 'Not found')
      return tra(200, { status: 'granted', expires_at: null })
    }
    if (duong === 'deactivate') {
      if (!p.may.has(b.activation_id)) return loi(404, 'Not found')
      p.may.delete(b.activation_id); return tra(204, null)
    }
    return loi(404, 'Not found')
  }
  return p
}
function mayMoi(ban, polar) {
  const { taoBanQuyen } = napBq(ban)
  let kho = null
  const dongHo = { t: 1700000000000 }
  const hong = { ghi: 0 }
  const bq = taoBanQuyen({
    doc: () => (kho ? JSON.parse(JSON.stringify(kho)) : kho),
    ghi: (s) => { if (hong.ghi) throw new Error('ENOSPC') ; kho = JSON.parse(JSON.stringify(s)) },
    fetch: polar.fetch, now: () => dongHo.t, tenMay: 'MAY-TEST',
  })
  return { bq, dongHo, hong, kho: () => kho }
}
const KEY_A = 'AIOSS-AAAA-1111-AAAA', KEY_B = 'AIOSS-BBBB-2222-BBBB'

async function chayBanQuyen(ban) {
  const nhan = ban === 'cu' ? ' (cu truot)' : ''
  console.log('\n=== Ban quyen · ' + (ban === 'cu' ? 'BAN CU ' + BAN_CU_COMMIT + ' (doi chung: cac muc danh dau phai TRUOT)' : 'BAN MOI') + ' ===')

  console.log('[1] Tra loi kiem tra cua ma CU ve muon khong duoc xoa ma MOI vua kich hoat')
  {
    const p = polarGia([KEY_A, KEY_B]), m = mayMoi(ban, p)
    await m.bq.kichHoat(KEY_A)
    const actA = m.kho().activationId
    p.giu = { duong: 'validate', act: actA, tra: { status: 404, text: async () => JSON.stringify({ error: 'ResourceNotFound', detail: 'Not found' }) } }
    const kt = m.bq.kiemTra(true)                 // Polar chua tra loi
    await new Promise((r) => setTimeout(r, 20))
    p.giu.tra = p.giu.tra                         // (giu nguyen)
    const huy = await m.bq.huyKichHoat()          // khach huy A (deactivate khong bi giu)
    const kh = await m.bq.kichHoat(KEY_B)         // roi kich hoat B
    p.giu.nha()                                   // gio moi cho tra loi 404 cua A ve
    await kt
    const s = m.bq.trangThai()
    kiem('huy A + kich hoat B truoc ' + 'luc cau tra loi cu ve: ca hai thanh cong', huy.ok && kh.ok, JSON.stringify({ huy: huy.ok, kh: kh.ok }))
    kiem('sau khi 404 cua A ve muon: B VAN dang kich hoat' + nhan, s.loai === 'da-kich-hoat' && m.kho().key === KEY_B && !!m.kho().activationId, JSON.stringify(s))
  }

  console.log('[2] Bam / giu Enter nhieu lan luc mang cham: chi MOT kich hoat tren Polar')
  {
    const p = polarGia([KEY_A]), m = mayMoi(ban, p)
    p.doTre = 40
    const kq = await Promise.all([1, 2, 3, 4, 5].map(() => m.bq.kichHoat(KEY_A)))
    kiem('5 lan bam cung luc -> Polar chi giu 1 may' + nhan, p.may.size === 1, 'Polar giu ' + p.may.size)
    kiem('ca 5 lan deu bao ok (cung ket qua), may nay dung ma' + nhan, kq.every((r) => r.ok) && m.kho().activationId === [...p.may.keys()][0], JSON.stringify(kq.map((r) => r.ok)))
    const khac = await Promise.all([m.bq.kichHoat(KEY_A), m.bq.kichHoat(KEY_B)])
    kiem('mot ma dang xu ly, ma khac vao cung luc -> ma khac nhan "dang-xu-ly"' + nhan, khac[1].ok === false && khac[1].loi === 'dang-xu-ly', JSON.stringify(khac.map((r) => r.loi || 'ok')))
  }

  console.log('[3] Ghi ma xuong dia hong luc kich hoat: noi THAT, khong bao thanh cong tron')
  {
    const p = polarGia([KEY_A]), m = mayMoi(ban, p)
    m.hong.ghi = 1
    const r = await m.bq.kichHoat(KEY_A)
    kiem('Polar da giu cho + chua ghi duoc dia -> ok nhung co co chuaLuu' + nhan, r.ok === true && r.chuaLuu === true, JSON.stringify(r))
    kiem('van dung duoc trong luot chay nay (cho chup)', r.trangThai.choPhepChup === true && r.trangThai.loai === 'da-kich-hoat')
    m.hong.ghi = 0
    m.bq.trangThai()
    kiem('het loi dia: lan doc sau tu ghi lai, dia co ma + activation', !!m.kho() && m.kho().key === KEY_A && !!m.kho().activationId, JSON.stringify(m.kho()))
    const r2 = await mayMoi(ban, polarGia([KEY_A])).bq.kichHoat(KEY_A)
    kiem('doi chung: ghi binh thuong thi KHONG co co chuaLuu', r2.ok && !r2.chuaLuu, JSON.stringify(r2))
  }

  console.log('[7] Dong ho: lui 30 ngay KHONG keo dung thu thanh 44 ngay')
  {
    const p = polarGia([KEY_A]), m = mayMoi(ban, p)
    m.bq.trangThai()
    m.dongHo.t -= 30 * NGAY                                // lui dong ho 30 ngay
    m.bq.trangThai()
    m.dongHo.t += 13 * NGAY
    let s = m.bq.trangThai()
    kiem('dung that 13 ngay sau khi lui dong ho: con ~1 ngay', s.loai === 'dung-thu' && s.ngayConLai === 1, JSON.stringify(s))
    m.dongHo.t += NGAY + 3600000
    s = m.bq.trangThai()
    kiem('dung that qua 14 ngay: HET han thu (khong keo thanh 44 ngay)' + nhan, s.loai === 'het-han-thu' && !s.choPhepChup, JSON.stringify(s))
    const p2 = polarGia([KEY_A]), m2 = mayMoi(ban, p2)
    m2.bq.trangThai(); m2.dongHo.t += 20 * NGAY
    kiem('doi chung: het thu thi van khoa', m2.bq.trangThai().loai === 'het-han-thu')
    m2.dongHo.t -= 10 * NGAY
    kiem('doi chung: da het roi lui dong ho 10 ngay van het (chong gian lan cu)', m2.bq.trangThai().loai === 'het-han-thu')
  }
  if (ban !== 'cu') {
    console.log('[7b] Ban luu CU (chi co batDauThu + gioLonNhat) duoc doi sang cach tinh moi, go phat nhay dong ho tien')
    const p = polarGia([KEY_A]), m = mayMoi(ban, p)
    const t0 = m.dongHo.t
    m.bq.trangThai()
    // Ban cu da bi "phat": dong ho tung nhay tien 30 ngay roi tra lai dung gio -> gioLonNhat = t0 + 30 ngay
    const luu = m.kho(); delete luu.daDungMs; delete luu.gioCuoi; luu.batDauThu = t0; luu.gioLonNhat = t0 + 30 * NGAY
    m.dongHo.t = t0 + 2 * NGAY
    const s = m.bq.trangThai()
    kiem('luu cu bi phat (gioLonNhat tuong lai) + dong ho dung: con dung thu, khong bi khoa oan', s.loai === 'dung-thu' && s.ngayConLai >= 12, JSON.stringify(s))
  }
}

async function chayTaoKhoFile(ban) {
  const nhan = ban === 'cu' ? ' (cu truot)' : ''
  const { taoKhoFile, taoBanQuyen } = napBq(ban)
  console.log('[4] File ban quyen hong / mat: khach da tra tien khong mat kich hoat (' + (ban === 'cu' ? 'cu' : 'moi') + ')')
  const dir = mkTam('bq4'), file = path.join(dir, 'ban-quyen.json'), nhatKy = []
  const k = taoKhoFile(file, { log: (x) => nhatKy.push(x) })
  const trangThai = { batDauThu: 1700000000000, key: KEY_A, activationId: 'act-9', maHienThi: 'AIOSS-****-AAAA', hetHan: null, kiemLanCuoi: 1700000001000, daDungMs: 5 }
  k.ghi(trangThai)
  const day = fs.readFileSync(file, 'utf8')
  // (a) file cat cut giua chung, KHONG co ban du phong: van con ma + activation o dau file
  fs.rmSync(file + '.bak', { force: true })
  fs.writeFileSync(file, day.slice(0, day.indexOf('"hetHan"')))
  let r = null, nem = null
  try { r = k.doc() } catch (e) { nem = e.message }
  kiem('(a) file cat cut sau activationId, khong co .bak: lay lai ma + activation tu doan chu' + nhan, nem === null && !!r && r.key === KEY_A && r.activationId === 'act-9', JSON.stringify({ r, nem }))
  kiem('(a) ban hong van duoc cat sang ben (lay lai tay duoc)', fs.readdirSync(dir).some((f) => /^ban-quyen\.hong-/.test(f)))
  // (b) file BIEN MAT nhung ban du phong con
  k.ghi(trangThai)
  fs.rmSync(file, { force: true })
  r = null; nem = null
  try { r = k.doc() } catch (e) { nem = e.message }
  kiem('(b) file mat, .bak con: lay lai tu ban du phong' + nhan, nem === null && !!r && r.key === KEY_A && r.activationId === 'act-9', JSON.stringify({ r, nem }))
  // (c) hong het (toan so 0): khong cuu duoc -> null, khong nem, ban hong con nguyen de lay tay
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { force: true })
  fs.writeFileSync(file, Buffer.alloc(325, 0))
  r = undefined
  try { r = k.doc() } catch (e) { r = 'NEM' }
  kiem('(c) file toan so 0 va khong co ban nao khac: tra null (khong nem), ban hong con nguyen', r === null && fs.readdirSync(dir).some((f) => /^ban-quyen\.hong-/.test(f)), JSON.stringify(r))
  // (d) doi chung: file chua co that su -> null
  const k2 = taoKhoFile(path.join(mkTam('bq4d'), 'ban-quyen.json'), { log: () => {} })
  kiem('(d) doi chung: chua co file va chua co .bak -> null (lan chay dau)', k2.doc() === null)
}

/* ---- kho.js ---- */
async function chayKho(ban) {
  const nhan = ban === 'cu' ? ' (cu truot)' : ''
  console.log('\n=== kho.js · ' + (ban === 'cu' ? 'BAN CU ' + BAN_CU_COMMIT : 'BAN MOI') + ' ===')

  console.log('[5] ghiDeAnh: doi ten hong + copy de hong giua chung -> anh goc / ban sua khong mat')
  {
    userData = mkTam('u5'); process.env.LOCALAPPDATA = mkTam('l5')
    const kho = napKho(ban)
    const dir = mkTam('a5'), f = path.join(dir, 'anh.png')
    const cung = (a, b) => path.resolve(String(a)).toLowerCase() === path.resolve(String(b)).toLowerCase()
    const ren = fs.renameSync, copy = fs.copyFileSync
    const soTam = () => fs.readdirSync(dir).filter((t) => t.includes('.tam-')).length
    try {
      // (a) loi nhat thoi: lan copy DAU de len file dich hong giua chung (de lai 2 byte), lan sau (tra lai) duoc
      fs.writeFileSync(f, 'ANH-GOC-NGUYEN-VEN')
      let lan = 0
      fs.renameSync = (a, b) => { if (cung(b, f)) throw loiHdh('EPERM'); return ren(a, b) }
      fs.copyFileSync = (a, b, c) => { if (cung(b, f) && ++lan === 1) { fs.writeFileSync(b, 'XX'); throw loiHdh('EIO') } return copy(a, b, c) }
      const r = kho.ghiDeAnh(f, Buffer.from('BAN-SUA-HOAN-CHINH'))
      kiem('(a) copy hong giua chung: bao ok=false', r.ok === false, JSON.stringify(r))
      kiem('(a) ANH GOC con nguyen, khong bi cut con 2 byte' + nhan, fs.readFileSync(f, 'utf8') === 'ANH-GOC-NGUYEN-VEN', fs.readFileSync(f, 'utf8'))
      // (b) loi dai: moi lan ghi len file dich deu hong -> ban sua hoan chinh PHAI con o file tam
      fs.writeFileSync(f, 'ANH-GOC-NGUYEN-VEN')
      for (const t of fs.readdirSync(dir)) if (t !== 'anh.png') fs.rmSync(path.join(dir, t), { force: true })
      fs.copyFileSync = (a, b, c) => { if (cung(b, f)) { try { fs.writeFileSync(b, 'XX') } catch (e) {} throw loiHdh('EIO') } return copy(a, b, c) }
      const r2 = kho.ghiDeAnh(f, Buffer.from('BAN-SUA-HOAN-CHINH-2'))
      const conBanSua = fs.readdirSync(dir).filter((t) => t.includes('.tam-')).some((t) => fs.readFileSync(path.join(dir, t), 'utf8') === 'BAN-SUA-HOAN-CHINH-2')
      const conGoc = fs.readdirSync(dir).filter((t) => t !== 'anh.png').some((t) => fs.readFileSync(path.join(dir, t), 'utf8') === 'ANH-GOC-NGUYEN-VEN')
      kiem('(b) ghi len file dich hong han: ban sua hoan chinh con o file tam' + nhan, r2.ok === false && conBanSua, JSON.stringify({ r2, ds: fs.readdirSync(dir) }))
      kiem('(b) ...va anh goc con ban du phong de lay lai' + nhan, conGoc, JSON.stringify(fs.readdirSync(dir)))
    } finally { fs.renameSync = ren; fs.copyFileSync = copy }
    // (c) doi chung duong binh thuong
    fs.writeFileSync(f, 'CU'); for (const t of fs.readdirSync(dir)) if (t !== 'anh.png') fs.rmSync(path.join(dir, t), { force: true })
    const r3 = kho.ghiDeAnh(f, Buffer.from('MOI'))
    kiem('(c) doi chung: ghi binh thuong thi doi ten duoc, khong de lai gi', r3.ok === true && fs.readFileSync(f, 'utf8') === 'MOI' && fs.readdirSync(dir).length === 1, JSON.stringify(r3))
  }

  console.log('[6] Keo-tha: hai anh khac trung ten sau khi lam sach khong de len lien ket da dua cho Premiere')
  {
    userData = mkTam('u6'); const goc = mkTam('l6')
    process.env.LOCALAPPDATA = path.join(goc, 'Nguyen Van A', 'AppData', 'Local'); fs.mkdirSync(process.env.LOCALAPPDATA, { recursive: true })
    const kho = napKho(ban)
    const thu = path.join(process.env.LOCALAPPDATA, 'shotandsave'); fs.mkdirSync(thu, { recursive: true })
    const f1 = path.join(thu, 'A B.jpg'), f2 = path.join(thu, 'A&B.jpg'), khac = mkTam('d6')
    fs.writeFileSync(f1, 'ANH-MOT-DA-DUA-CHO-PREMIERE')
    const keo1 = kho.duongDanKeoAnToan(f1)
    fs.renameSync(f1, path.join(khac, 'A B.jpg'))                    // chuyen anh goc sang thu muc khac
    fs.writeFileSync(f2, 'ANH-HAI-KICH-THUOC-KHAC-HAN')
    const keo2 = kho.duongDanKeoAnToan(f2)
    kiem('hai anh khac nhau -> hai duong lien ket khac nhau' + nhan, keo1 !== keo2, keo1 + ' = ' + keo2)
    kiem('lien ket da dua cho Premiere van tro ANH MOT, khong bi thay' + nhan, fs.existsSync(keo1) && fs.readFileSync(keo1, 'utf8') === 'ANH-MOT-DA-DUA-CHO-PREMIERE', fs.existsSync(keo1) ? fs.readFileSync(keo1, 'utf8') : 'MAT')
    kiem('lien ket thu hai la ANH HAI', fs.readFileSync(keo2, 'utf8') === 'ANH-HAI-KICH-THUOC-KHAC-HAN')
    const lai = kho.duongDanKeoAnToan(f2)
    kiem('doi chung: keo lai CUNG anh hai -> dung lai lien ket cu, khong de ra ban thu ba', lai === keo2 && fs.readdirSync(path.dirname(keo2)).filter((t) => t !== '.goc.json').length === 2, lai)
  }

  console.log('[8] Doi thu muc anh ma khong ghi duoc cau hinh: phai biet la THAT BAI')
  {
    userData = mkTam('u8'); process.env.LOCALAPPDATA = mkTam('l8')
    const kho = napKho(ban)
    if (typeof kho.ghiCauHinhChac !== 'function') {
      kiem('co ham ghiCauHinhChac (cho biet ghi duoc hay khong)' + nhan, false, 'ban cu khong co')
    } else {
      kho.ghiCauHinh({ thuMucAnh: 'D:/Anh-Cu' })
      const ren = fs.renameSync
      try {
        fs.renameSync = (a, b) => { if (/cau-hinh\.json$/.test(String(b))) throw loiHdh('EPERM'); return ren(a, b) }
        const r = kho.ghiCauHinhChac({ thuMucAnh: 'D:/Anh-Moi' })
        kiem('ghi cau hinh hong -> ok=false', r.ok === false, JSON.stringify(r))
        kiem('thu muc anh van la cho cu (khong tu nhien thanh moi)', kho.docCauHinh().thuMucAnh === 'D:/Anh-Cu', kho.docCauHinh().thuMucAnh)
      } finally { fs.renameSync = ren }
      const r2 = kho.ghiCauHinhChac({ thuMucAnh: 'D:/Anh-Moi' })
      kiem('doi chung: ghi binh thuong -> ok=true, thu muc moi', r2.ok === true && kho.docCauHinh().thuMucAnh === 'D:/Anh-Moi', JSON.stringify(r2))
    }
    const main = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')
    const i = main.indexOf("ipcMain.handle('settings:pick-folder'")
    const khoi = main.slice(i, i + 900)
    kiem('(chi kiem chu, nhan la vay) main.js dung ghiCauHinhChac va tra loi cho giao dien', ban === 'cu' || (/ghiCauHinhChac\(\{ thuMucAnh/.test(khoi) && /loi: 'khong-luu-duoc'/.test(khoi)))
  }
}

;(async () => {
  await chayBanQuyen('moi'); await chayTaoKhoFile('moi'); await chayKho('moi')
  if (CU) {
    const truotMoi = truot
    // Ban cu: chi can chay duoc, ket qua TRUOT la dung. Dem rieng.
    const datTruoc = dat, truotTruoc = truot
    await chayBanQuyen('cu'); await chayTaoKhoFile('cu'); await chayKho('cu')
    const truotCu = truot - truotTruoc
    // Tru phan ban cu DAT ra khoi tong va doi ten muc: ban cu truot nhieu muc la dung
    dat = datTruoc; truot = truotMoi
    const MUC_PHAI_TRUOT = 9
    kiem('DOI CHUNG: ban cu truot it nhat ' + MUC_PHAI_TRUOT + ' muc ( ' + truotCu + ' muc)', truotCu >= MUC_PHAI_TRUOT, 'chi truot ' + truotCu)
  }
  for (const d of tamDaTao) { try { fs.rmSync(d, { recursive: true, force: true }) } catch (e) {} }
  console.log('\nKET QUA: ' + dat + ' DAT / ' + truot + ' TRUOT')
  process.exit(truot ? 1 : 0)
})()
