/**
 * kiem-caption-kieu.mjs — kiem phan TINH TOAN cua caption kieu hieu ung
 * (Hormozi / Beast / Karaoke / Boxed / Clean), chay NGOAI Premiere.
 *
 * Chay:  cd client && npm run kiem:caption
 *
 * DU LIEU THAT, khong bia: bo dem nghe `.autocut-nghe.json` do chinh panel sinh
 * ra canh video (tieng Viet 1 phut + 60 phut, tieng Anh 26/39/55 phut). Chi DOC.
 * File nao khong con tren o thi bao "bo qua" chu khong bia.
 *
 * Kiem cai gi (moi kieu x hai khung):
 *   1. KHONG MAT CHU: ghep chu moi khoi lai = ghep cau goc (so khong phan biet hoa)
 *   2. MOI DONG <= tran ky tu (don vi do rong) · moi khoi <= so dong · <= tu toi da
 *   3. `hl` trong [0, so tu] · kieu noi bat thi hl>0 o da so khoi
 *   4. karaoke: so moc = so tu, moc dau = 0, khong giam
 *   5. khoi khong de nhau, den > tu
 *   6. ma hoa -> tach lai ra dung so khoi, chu khong chua ky tu ngan cach
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

// tsc bien dich `import ... from './srt'` (khong duoi) -> Node ESM khong tim thay.
// Va them duoi ngay trong file da bien dich, khong dung vao ma nguon.
const fCk = path.join(here, 'js', 'caption-kieu.js')
fs.writeFileSync(fCk, fs.readFileSync(fCk, 'utf8').replace(/from '\.\/srt'/g, "from './srt.js'"))

const { KIEU_CAPTION, dungKhoiCaption, maHoaKhoi, chonTuNoiBat, mocKaraoke, PHAN_CACH_KHOI, PHAN_CACH_TRUONG } =
  await import('./js/caption-kieu.js')
const { dungBangQuyDoi, doRong } = await import('./js/srt.js')

const NGUON = [
  ['VI 1 phut (Heygen)', 'E:/2026/Thinksmart/Video/1808-S-Phoebe-Kinn Chi phí y tế/Source/Source Heygen Chi phí y tế_1080p.autocut-nghe.json'],
  ['VI 60 phut (STRESS)', 'E:/2026/Thinksmart/Video/Resize/Agent/STRESS-1tieng.autocut-nghe.json'],
  ['EN 26 phut', 'E:/2026/Test/YTDown.com_YouTube_Insane-Conspiracy-Theories-That-Turned-O_Media_bdK96-iKQMg_001_1080p.autocut-nghe.json'],
  ['EN 55 phut', 'E:/2026/Test/YTDown.com_YouTube_The-World-s-Most-Important-Machine_Media_MiUHjLxm3V0_001_1080p.autocut-nghe.json'],
]

let loi = 0
function check(ten, dk, chiTiet) {
  if (dk) console.log('  [OK]   ' + ten)
  else { console.log('  [SAI]  ' + ten + '  ' + (chiTiet ?? '')); loi++ }
}
const chuan = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()

console.log('=== 0. Ham nho ===')
check('chonTuNoiBat: tu dai nhat, hoa thi lay SAU', chonTuNoiBat(['make', 'more', 'money']) === 3)
check('chonTuNoiBat: toan tu ngan -> 0', chonTuNoiBat(['la', 'va', 'de']) === 0)
check('chonTuNoiBat: bo dau cau khi do', chonTuNoiBat(['hi,', 'wonderful!']) === 2)
check('mocKaraoke: du moc that -> dung moc, dau = 0',
  mocKaraoke(3, 10, 12, [{ giay: 10.05 }, { giay: 10.6 }, { giay: 11.4 }]) === '0.00,0.60,1.40')
check('mocKaraoke: thieu moc -> chia deu', mocKaraoke(4, 0, 2) === '0.00,0.50,1.00,1.50')
check('mocKaraoke: moc lui -> khong giam',
  mocKaraoke(3, 0, 3, [{ giay: 0 }, { giay: 2 }, { giay: 1 }]) === '0.00,2.00,2.00')

const bang1 = dungBangQuyDoi([{ start: 0, end: 1e7 }])
for (const [nhan, duong] of NGUON) {
  if (!fs.existsSync(duong)) { console.log(`\n=== ${nhan}: BO QUA (khong con file) ===`); continue }
  const j = JSON.parse(fs.readFileSync(duong, 'utf8'))
  const cau = j.cau ?? j.ket?.cau ?? []
  const tu = j.tu ?? j.ket?.tu ?? []
  console.log(`\n=== ${nhan}: ${cau.length} cau · ${tu.length} tu · ngon ngu ${j.ngonNgu ?? '?'} ===`)
  if (!cau.length) { check('co cau de thu', false, 'file khong co truong cau'); continue }
  const chuGoc = chuan(cau.map((c) => c.chu).join(' '))

  for (const kieu of KIEU_CAPTION) {
    if (!kieu.mogrt) continue
    for (const khung of ['ngang', 'doc']) {
      const gh = kieu.gioiHan[khung]
      const t0 = Date.now()
      const khoi = dungKhoiCaption(cau, bang1, [], kieu, khung, tu)
      const ms = Date.now() - t0
      const ten = `${kieu.ten.padEnd(8)} ${khung.padEnd(5)}`
      if (!khoi.length) { check(ten + ' ra khoi', false, '0 khoi'); continue }

      // 1. khong mat chu
      const chuRa = chuan(khoi.map((k) => k.chu.replace(/\r/g, ' ')).join(' '))
      const matChu = chuRa !== chuGoc
      // 2. tran dong / so dong / so tu
      let vuotDong = 0, vuotSoDong = 0, vuotTu = 0, maxDong = 0
      // 3-5
      let hlSai = 0, hlCo = 0, mocSai = 0, deNhau = 0, denSai = 0, ngan = 0, tuDai = 0
      const mauLoi = [] // in vai khoi vi pham ra doc — dem thoi thi khong biet SAI KIEU GI
      for (let i = 0; i < khoi.length; i++) {
        const k = khoi[i]
        const dong = k.chu.split('\r')
        if (dong.length > gh.soDongToiDa) { vuotSoDong++; if (mauLoi.length < 4) mauLoi.push('SO_DONG ' + JSON.stringify(k.chu)) }
        for (const d of dong) {
          const r = doRong(d); maxDong = Math.max(maxDong, r)
          // Dong MOT TU Latin dai hon tran la co y (khong be tu): `coChu` do bang
          // PIXEL uoc luong va chi ha co khi that su tran khung (tran don vi ky tu
          // chat hon tran pixel — "PSEUDO-MEDICAL" 14 don vi Bangers = 980 px,
          // van lot 1080). Chi phat dong NHIEU TU ma tran; dong mot tu thi dem.
          const motTu = !d.includes(' ')
          if (r > gh.kyTuMoiDong && !motTu) { vuotDong++; if (mauLoi.length < 4) mauLoi.push('TRAN_DONG co=' + k.co + ' ' + JSON.stringify(k.chu)) }
          if (r > gh.kyTuMoiDong && motTu) tuDai++
        }
        const soTu = k.chu.replace(/\r/g, ' ').split(' ').filter(Boolean).length
        if (gh.tuToiDa && soTu > gh.tuToiDa) { vuotTu++; if (mauLoi.length < 4) mauLoi.push('SO_TU ' + JSON.stringify(k.chu)) }
        if (k.hl < 0 || k.hl > soTu) hlSai++
        if (k.hl > 0) hlCo++
        if (kieu.karaoke) {
          const m = k.moc.split(',').map(Number)
          if (m.length !== soTu || m[0] !== 0 || m.some((x, q) => q > 0 && x < m[q - 1])) mocSai++
        } else if (k.moc !== '') mocSai++
        if (!(k.den > k.tu)) denSai++
        if (i > 0 && k.tu < khoi[i - 1].den - 1e-9) deNhau++
        if (k.den - k.tu < 0.5) ngan++
      }
      // 6. ma hoa
      const ma = maHoaKhoi(khoi)
      const tach = ma.split(PHAN_CACH_KHOI)
      const maOk = tach.length === khoi.length && tach.every((x) => x.split(PHAN_CACH_TRUONG).length === 6) &&
        !khoi.some((k) => k.chu.includes(PHAN_CACH_KHOI) || k.chu.includes(PHAN_CACH_TRUONG))

      const soCo = khoi.filter((k) => k.co < 100).length
      const tom = `${String(khoi.length).padStart(5)} khoi · dong dai nhat ${maxDong}/${gh.kyTuMoiDong} · dong 1 tu vuot tran ${tuDai} (co chu ${soCo}) · ngan<0.5s ${(ngan / khoi.length * 100).toFixed(1)}% · ${ms}ms`
      if (matChu && mauLoi.length < 6) {
        // Tim cho lech dau tien giua hai chuoi de chi dung cho mat chu
        let q = 0
        while (q < chuRa.length && q < chuGoc.length && chuRa[q] === chuGoc[q]) q++
        mauLoi.push(`MAT_CHU tai ${q}: goc="…${chuGoc.slice(Math.max(0, q - 25), q + 25)}…" ra="…${chuRa.slice(Math.max(0, q - 25), q + 25)}…"`)
      }
      check(`${ten} ${tom}`,
        !matChu && !vuotDong && !vuotSoDong && !vuotTu && !hlSai && !mocSai && !deNhau && !denSai && maOk,
        `matChu=${matChu} vuotDong=${vuotDong} vuotSoDong=${vuotSoDong} vuotTu=${vuotTu} hlSai=${hlSai} mocSai=${mocSai} deNhau=${deNhau} denSai=${denSai} maOk=${maOk}`)
      for (const m of mauLoi) console.log('         ↳ ' + m)
      if (kieu.noiBat) check(`${ten} co tu noi bat o da so khoi (${hlCo}/${khoi.length})`, hlCo / khoi.length > 0.8)
      if (kieu.inHoa) check(`${ten} chu IN HOA`, khoi.every((k) => k.chu === k.chu.toUpperCase()))
    }
  }
  // In 3 khoi dau cua Hormozi doc ra doc bang mat (bai hoc 5e: mo mau ra doc)
  const mau = dungKhoiCaption(cau, bang1, [], KIEU_CAPTION.find((k) => k.ma === 'hormozi'), 'doc', tu).slice(0, 4)
  console.log('  mau Hormozi doc: ' + mau.map((k) => `[${k.tu.toFixed(2)}-${k.den.toFixed(2)} hl=${k.hl}] ${JSON.stringify(k.chu)}`).join(' | '))
  const mauK = dungKhoiCaption(cau, bang1, [], KIEU_CAPTION.find((k) => k.ma === 'karaoke'), 'doc', tu).slice(0, 2)
  console.log('  mau Karaoke doc: ' + mauK.map((k) => `[${k.tu.toFixed(2)}-${k.den.toFixed(2)} moc=${k.moc}] ${JSON.stringify(k.chu)}`).join(' | '))
}

console.log(loi ? `\nTONG: ${loi} phep SAI` : '\nTONG: tat ca dat')
process.exit(loi ? 1 : 0)
