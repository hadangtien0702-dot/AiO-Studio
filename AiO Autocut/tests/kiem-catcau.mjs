/**
 * kiem-catcau.mjs — kiem viec CAT CAU DAI + XUONG DONG cho phu de.
 *
 * Chay:  node tests/kiem-catcau.mjs      (sau khi `npm run kiem` da bien dich js/)
 *
 * Phan cuoi do tren DU LIEU THAT: file .srt 765 cau do chinh tool xuat ra tu
 * video 60 phut ngay 29/07. Neu khong tim thay file do thi bo qua phan ay va
 * NOI RO la da bo qua - khong im lang.
 */

import fs from 'node:fs'
import { catCauDai, xuongDong, sinhSrt, dungBangTuClip, GIOI_HAN_MAC_DINH } from './js/srt.js'

let loi = 0
function check(ten, dieuKien, chiTiet) {
  if (dieuKien) console.log('  [OK]   ' + ten)
  else { console.log('  [SAI]  ' + ten + '  ' + (chiTiet ?? '')); loi++ }
}

const GH = GIOI_HAN_MAC_DINH
const TRAN = GH.kyTuMoiDong * GH.soDongToiDa // 84

console.log('=== 1. Cau NGAN thi khong dung toi ===')
{
  const c = { tu: 0, den: 3, chu: 'Cau ngan gon.' }
  const r = catCauDai(c, GH)
  check('tra ve dung 1 khoi', r.length === 1, r.length)
  check('giu nguyen chu', r[0].chu === 'Cau ngan gon.')
  check('giu nguyen moc', r[0].tu === 0 && r[0].den === 3)
}

console.log('\n=== 2. Cau DAI bi cat, moc chia theo ti le chu ===')
{
  const chu =
    'Dieu dac biet o day la anh chi se co co hoi duoc dao tao truc tiep tu Leon, ' +
    'la CEO cua cong ty, va duoc thuc hanh ngay tren khach hang that trong vong 15 ngay.'
  const c = { tu: 10, den: 20, chu }
  const r = catCauDai(c, GH)
  console.log('  cat ra ' + r.length + ' khoi:')
  r.forEach((x, i) => console.log(`    ${i + 1}. [${x.tu.toFixed(2)}-${x.den.toFixed(2)}] ${x.chu.length} ky tu: ${x.chu}`))

  check('co cat ra nhieu khoi', r.length > 1, r.length)
  check('moi khoi <= ' + TRAN + ' ky tu', r.every((x) => x.chu.length <= TRAN),
    r.map((x) => x.chu.length).join(','))
  check('moc lien tuc, khong ho khong chong',
    r.every((x, i) => i === 0 || Math.abs(x.tu - r[i - 1].den) < 1e-9))
  check('khoi dau bat dau dung 10s', Math.abs(r[0].tu - 10) < 1e-9, r[0].tu)
  check('khoi cuoi ket thuc dung 20s', Math.abs(r[r.length - 1].den - 20) < 1e-9, r[r.length - 1].den)
  check('moi khoi co do dai duong', r.every((x) => x.den > x.tu))

  // KHONG DUOC MAT CHU: ghep lai phai ra dung cau goc (bo khoang trang thua)
  const ghepLai = r.map((x) => x.chu).join(' ').replace(/\s+/g, ' ').trim()
  check('GHEP LAI = CAU GOC, khong mat chu nao',
    ghepLai === chu.replace(/\s+/g, ' ').trim(),
    'ghep=' + ghepLai.length + ' goc=' + chu.length)
}

console.log('\n=== 3. Cat o DAU CAU truoc, roi moi den dau phay ===')
{
  const c = { tu: 0, den: 12, chu: 'Cau thu nhat ket thuc o day. Cau thu hai bat dau va cung kha dai de phai cat ra.' }
  const r = catCauDai(c, GH)
  check('khoi dau ket thuc bang dau cham', /\.$/.test(r[0].chu), r[0].chu)
}

console.log('\n=== 4. KHONG cat neu khoi con chop qua nhanh ===')
{
  // 200 ky tu trong 1 giay -> cat ra 3 khoi thi moi khoi 0,33s, ngan hon 1s
  const c = { tu: 0, den: 1, chu: 'x'.repeat(60) + ' ' + 'y'.repeat(60) + ' ' + 'z'.repeat(60) }
  const r = catCauDai(c, GH)
  check('de nguyen, khong cat thanh phu de chop', r.length === 1, r.length + ' khoi')
}

console.log('\n=== 5. Xuong dong CAN, toi da 2 dong ===')
{
  const s = 'Anh chi se duoc dao tao ky nang chot sale sac ben hoan toan mien phi'
  const d = xuongDong(s, GH)
  console.log('  ' + d.map((x, i) => `dong ${i + 1} (${x.length}): ${x}`).join('\n  '))
  check('toi da ' + GH.soDongToiDa + ' dong', d.length <= GH.soDongToiDa, d.length)
  check('moi dong <= ' + GH.kyTuMoiDong + ' ky tu', d.every((x) => x.length <= GH.kyTuMoiDong),
    d.map((x) => x.length).join(','))
  check('hai dong CAN nhau (lech < 60% dong)',
    d.length < 2 || Math.abs(d[0].length - d[1].length) < GH.kyTuMoiDong * 0.6,
    d.map((x) => x.length).join(' vs '))
  check('khong mat chu khi xuong dong',
    d.join(' ').replace(/\s+/g, ' ') === s.replace(/\s+/g, ' '))
  const ngan = xuongDong('Ngan gon.', GH)
  check('dong ngan thi KHONG xuong dong', ngan.length === 1 && ngan[0] === 'Ngan gon.',
    JSON.stringify(ngan))
}

console.log('\n=== 6. sinhSrt: dat gioi han thi moi DONG deu <= 42 ===')
{
  const CAU = [
    { tu: 0, den: 10, chu: 'Dieu dac biet o day la anh chi se co co hoi duoc dao tao truc tiep tu Leon la CEO cua Think Small Insurance va con nhieu thu khac nua.' },
    { tu: 10, den: 13, chu: 'Cau ngan.' },
  ]
  const bang = dungBangTuClip([{ seqTu: 0, srcTu: 0, srcDen: 13 }], 0)

  const cu = sinhSrt(CAU, [], [], bang, null) // khong cat - kieu cu
  const moi = sinhSrt(CAU, [], [], bang) // co cat - mac dinh

  const dongCu = cu.noiDung.split('\r\n').filter((l) => l && !/^\d+$/.test(l) && !l.includes('-->'))
  const dongMoi = moi.noiDung.split('\r\n').filter((l) => l && !/^\d+$/.test(l) && !l.includes('-->'))

  console.log(`  kieu cu : ${cu.soCau} khoi, dong dai nhat ${Math.max(...dongCu.map((x) => x.length))} ky tu`)
  console.log(`  co cat  : ${moi.soCau} khoi, dong dai nhat ${Math.max(...dongMoi.map((x) => x.length))} ky tu, cat them ${moi.soCatRa}`)

  check('kieu cu VUOT chuan (tai hien duoc van de)', Math.max(...dongCu.map((x) => x.length)) > GH.kyTuMoiDong)
  check('co cat: MOI DONG <= 42 ky tu', dongMoi.every((x) => x.length <= GH.kyTuMoiDong),
    Math.max(...dongMoi.map((x) => x.length)))
  check('khong mat cau nao', moi.soBo === 0)
  check('dat gioi han = null thi giu nguyen nhu cu', cu.soCau === CAU.length, cu.soCau)
}

console.log('\n=== 7. DU LIEU THAT — 765 cau tu video 60 phut ===')
{
  const F = 'E:/2026/Thinksmart/Video/Resize/Agent/STRESS-1tieng-autocut-165228.srt'
  if (!fs.existsSync(F)) {
    console.log('  [BO QUA] khong thay ' + F)
    console.log('           -> phan do tren du lieu that CHUA CHAY. Khong coi la dat.')
  } else {
    const t = fs.readFileSync(F, 'utf8')
    const khoi = t.split('\r\n\r\n').filter((x) => x.trim())
    const cau = khoi.map((k) => {
      const d = k.split('\r\n')
      const m = d[1].match(/(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)/)
      const gio = (a, b, c, ms) => +a * 3600 + +b * 60 + +c + +ms / 1000
      return {
        tu: gio(m[1], m[2], m[3], m[4]),
        den: gio(m[5], m[6], m[7], m[8]),
        chu: d.slice(2).join(' ').trim(),
      }
    })
    console.log(`  doc duoc ${cau.length} cau tu file that`)

    // Ap dung cat + xuong dong, roi do lai
    const sau = []
    for (const c of cau) for (const k of catCauDai(c, GH)) sau.push({ ...k, dong: xuongDong(k.chu, GH) })

    const dongTruoc = cau.map((c) => c.chu.length)
    const dongSau = sau.flatMap((c) => c.dong.map((x) => x.length))
    const quaTruoc = dongTruoc.filter((x) => x > GH.kyTuMoiDong).length
    const quaSau = dongSau.filter((x) => x > GH.kyTuMoiDong).length

    console.log(`  TRUOC: ${cau.length} khoi, dong dai nhat ${Math.max(...dongTruoc)}, qua 42 ky tu: ${(quaTruoc / dongTruoc.length * 100).toFixed(1)}%`)
    console.log(`  SAU  : ${sau.length} khoi, dong dai nhat ${Math.max(...dongSau)}, qua 42 ky tu: ${(quaSau / dongSau.length * 100).toFixed(1)}%`)

    check('SAU khi cat: KHONG dong nao qua 42 ky tu', quaSau === 0, quaSau + ' dong')
    check('SAU khi cat: khong khoi nao qua 2 dong',
      sau.every((c) => c.dong.length <= GH.soDongToiDa))
    check('KHONG MAT CHU: ghep lai phai bang chu goc',
      sau.map((c) => c.dong.join(' ')).join(' ').replace(/\s+/g, ' ').trim() ===
        cau.map((c) => c.chu).join(' ').replace(/\s+/g, ' ').trim())
    check('moc van tang dan, khong nhay lui',
      sau.every((c, i) => i === 0 || c.tu >= sau[i - 1].tu - 1e-6))
    check('khoi cuoi khong tran ra ngoai file goc',
      Math.abs(sau[sau.length - 1].den - cau[cau.length - 1].den) < 1e-6)
  }
}

console.log('')
if (loi === 0) console.log('TAT CA DAT')
else { console.log(`CO ${loi} PHEP DO SAI`); process.exitCode = 1 }
