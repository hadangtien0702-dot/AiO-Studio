'use strict'
/* Do KEO-THA AN TOAN (thu muc `.keo`) + GHI DE ANH (src/kho.js) — chay: npm run test:keo
   Khong bat cua so, khong can Electron (gia `electron.app.getPath`). Moi file nam trong os.tmpdir(), bai nay tao va tu xoa.
   04/10 (ECC soat, DA DO tren ban cu): nguoi dung Windows ten co dau cach / dau tieng Viet keo anh qua `.keo`, mo lai app
   la file da dua cho Premiere MAT (`.keo` bi xoa sach moi lan mo). Anh chot huong A: giu file tam, chi don khi anh goc
   da bi xoa. Cac muc [2] [3] [5] [6] phai TRUOT tren ban cu. */
const Module = require('module')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const KHO = path.join(ROOT, 'src', 'kho.js')
let userData = ''
const napGoc = Module._load
Module._load = function (req) {
  if (req === 'electron') return { app: { getPath: () => userData, isPackaged: true } }
  return napGoc.apply(this, arguments)
}
let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) } }
const co = (p) => fs.existsSync(p)
const tamDaTao = []
const DAU = 'Ti' + String.fromCharCode(0x1EBF) + 'n'      // "Tiến"

/** May gia: nguoi dung Windows ten `ten`; "mo lai app" = nap lai kho.js (mat het thu trong RAM) + goi donKeoAnToan. */
function may(ten) {
  const goc = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-keo-'))
  tamDaTao.push(goc)
  userData = path.join(goc, 'userData'); fs.mkdirSync(userData, { recursive: true })
  process.env.LOCALAPPDATA = path.join(goc, 'Users', ten, 'AppData', 'Local')
  const thuMucAnh = path.join(process.env.LOCALAPPDATA, 'shotandsave'); fs.mkdirSync(thuMucAnh, { recursive: true })
  const m = { goc, thuMucAnh, nhatKy: [] }
  m.nap = () => { delete require.cache[require.resolve(KHO)]; m.kho = require(KHO); if (m.kho.noiNhatKy) m.kho.noiNhatKy((x) => m.nhatKy.push(x)) }
  m.moLaiApp = () => { m.nap(); return m.kho.donKeoAnToan() }
  m.anh = (tenFile, noiDung) => { const f = path.join(thuMucAnh, tenFile); fs.writeFileSync(f, noiDung || 'ANH-' + tenFile); return f }
  m.nap()
  return m
}

console.log('\n[1] Doi chung: duong dan sach (ten nguoi dung khong dau cach) -> dua thang file goc')
{
  const m = may('DRT-G21'), f = m.anh('shotandsave-1.png')
  const keo = m.kho.duongDanKeoAnToan(f)
  kiem('khong qua .keo', keo === f)
  m.moLaiApp()
  kiem('mo lai app: file con', co(keo))
}

console.log('\n[2] Ten nguoi dung co DAU CACH / DAU TIENG VIET: file da keo phai CON sau khi mo lai app')
for (const ten of ['Nguyen Van A', DAU]) {
  const m = may(ten), f = m.anh('shotandsave-1.png', 'NOI-DUNG-1')
  const keo = m.kho.duongDanKeoAnToan(f)
  kiem(ten + ': keo qua .keo (hanh vi cu giu nguyen)', keo !== f && keo.includes('.keo'))
  m.moLaiApp(); m.moLaiApp()
  kiem(ten + ': mo lai app 2 lan -> file da dua cho Premiere CON, dung noi dung', co(keo) && fs.readFileSync(keo, 'utf8') === 'NOI-DUNG-1', co(keo) ? 'sai noi dung' : 'MAT')
  kiem(ten + ': anh goc con nguyen', co(f) && fs.readFileSync(f, 'utf8') === 'NOI-DUNG-1')
}

console.log('\n[3] Don dung thu can don: anh goc DA XOA thi lien ket moi bi bo; doi cho thi giu')
{
  const m = may('Nguyen Van A')
  const f1 = m.anh('shotandsave-1.png'), f2 = m.anh('shotandsave-2.png'), f3 = m.anh('shotandsave-3.png')
  const k1 = m.kho.duongDanKeoAnToan(f1), k2 = m.kho.duongDanKeoAnToan(f2), k3 = m.kho.duongDanKeoAnToan(f3)
  fs.unlinkSync(f2)                                                        // nguoi dung XOA han anh 2
  fs.mkdirSync(path.join(m.thuMucAnh, 'da-xep')); fs.renameSync(f3, path.join(m.thuMucAnh, 'da-xep', 'shotandsave-3.png'))   // DOI CHO anh 3
  const kq = m.moLaiApp()
  kiem('anh 1 (con nguyen): lien ket GIU', co(k1))
  kiem('anh 2 (da xoa han): lien ket bi BO', !co(k2), JSON.stringify(kq))
  kiem('anh 3 (chi doi cho, du lieu con): lien ket GIU', co(k3), JSON.stringify(kq))
  kiem('ham don tra so dem dung', !!kq && kq.bo === 1 && kq.giu + kq.khongRo === 2, JSON.stringify(kq))
}
{
  const m = may('DRT-G21')                                   // ten sach; thu muc anh do nguoi dung tu chon, co dau cach
  const ngoai = path.join(m.goc, 'O ngoai', 'Anh chup'); fs.mkdirSync(ngoai, { recursive: true })
  const f = path.join(ngoai, 'shotandsave-9.png'); fs.writeFileSync(f, 'ANH-O-NGOAI')
  const k = m.kho.duongDanKeoAnToan(f)
  const la = path.join(path.dirname(k), 'file-la-khong-co-trong-so.png'); fs.writeFileSync(la, 'x')
  fs.rmSync(path.join(m.goc, 'O ngoai'), { recursive: true, force: true })   // ca o dia / thu muc cua anh goc bien mat
  const kq = m.moLaiApp()
  kiem('thu muc anh goc khong thay (o dia thao): KHONG bo lien ket', k !== f && co(k), JSON.stringify(kq))
  kiem('file khong ro goc trong .keo: GIU', co(la), JSON.stringify(kq))
}

console.log('\n[4] Keo lai cung anh: dung lai lien ket, khong tao ban moi')
{
  const m = may('Nguyen Van A'), f = m.anh('shotandsave-1.png')
  const k1 = m.kho.duongDanKeoAnToan(f), k2 = m.kho.duongDanKeoAnToan(f)
  m.moLaiApp()
  const k3 = m.kho.duongDanKeoAnToan(f)
  const soFile = fs.readdirSync(path.dirname(k1)).filter((t) => t.endsWith('.png')).length
  kiem('3 lan keo (co mo lai app o giua) -> 1 duong dan, 1 file', k1 === k2 && k2 === k3 && soFile === 1, JSON.stringify({ k1, k3, soFile }))
}

console.log('\n[5] Hai anh goc KHAC nhau trung ten sau khi lam sach: khong de len nhau')
{
  const m = may('Nguyen Van A')
  const a = m.anh('anh & 1.png', 'AAA'), b = m.anh('anh # 1.png', 'BBBB')
  const ka = m.kho.duongDanKeoAnToan(a), kb = m.kho.duongDanKeoAnToan(b)
  kiem('2 lien ket khac nhau', ka !== kb, ka + ' | ' + kb)
  kiem('lien ket cua anh A van la noi dung A sau khi keo anh B', fs.readFileSync(ka, 'utf8') === 'AAA' && fs.readFileSync(kb, 'utf8') === 'BBBB')
}

console.log('\n[6] GHI DE anh (sua / lam mo anh ghim): atomic, hong thi file cu con nguyen, lien ket duoc lam moi')
{
  const m = may('Nguyen Van A'), f = m.anh('shotandsave-1.png', 'BAN-CU-CHUA-MO')
  const k = m.kho.duongDanKeoAnToan(f)
  const coHam = typeof m.kho.ghiDeAnh === 'function' && typeof m.kho.lamMoiKeo === 'function'
  kiem('co ham ghiDeAnh + lamMoiKeo', coHam)
  if (coHam) {
    const r = m.kho.ghiDeAnh(f, Buffer.from('BAN-MOI-DA-LAM-MO'))
    kiem('ghi de thanh cong: tra ok, file la ban moi, khong de lai file tam', r.ok === true && fs.readFileSync(f, 'utf8') === 'BAN-MOI-DA-LAM-MO' && fs.readdirSync(m.thuMucAnh).filter((t) => t.includes('.tam')).length === 0, JSON.stringify(r))
    const n = m.kho.lamMoiKeo(f)
    kiem('lien ket da dua cho app khac cung thanh ban moi (khong con ban chua mo)', n === 1 && fs.readFileSync(k, 'utf8') === 'BAN-MOI-DA-LAM-MO', 'n=' + n + ' noi dung=' + fs.readFileSync(k, 'utf8'))
    fs.chmodSync(m.thuMucAnh, 0o555)                                           // thu muc khong ghi duoc = ghi de phai hong
    let ghiDuoc = true
    try { fs.writeFileSync(path.join(m.thuMucAnh, 'thu.txt'), 'x') } catch (e) { ghiDuoc = false }
    if (ghiDuoc) { console.log('  BO QUA  ca ghi hong (he dieu hanh nay chmod khong chan duoc ghi)'); try { fs.unlinkSync(path.join(m.thuMucAnh, 'thu.txt')) } catch (e) {} }
    else {
      const r2 = m.kho.ghiDeAnh(f, Buffer.from('BAN-THU-3'))
      fs.chmodSync(m.thuMucAnh, 0o755)
      kiem('ghi de HONG: tra ok=false kem ly do', r2.ok === false && !!r2.loi, JSON.stringify(r2))
      kiem('ghi de HONG: file cu con NGUYEN (khong bi cut, khong thanh ban thu 3)', fs.readFileSync(f, 'utf8') === 'BAN-MOI-DA-LAM-MO')
    }
    try { fs.chmodSync(m.thuMucAnh, 0o755) } catch (e) {}
  }
}

for (const d of tamDaTao) { try { fs.rmSync(d, { recursive: true, force: true }) } catch (e) {} }   // chi thu muc mkdtemp cua bai nay
console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
process.exit(truot ? 1 : 0)
