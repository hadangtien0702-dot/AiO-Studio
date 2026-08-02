/**
 * stress-phude.mjs — EP phan quy doi moc phu de o QUY MO THAT.
 *
 * Vi sao co file nay: luat du an ghi ro "chay dung tren mau nho KHONG chung minh
 * duoc gi ve mau lon". Toan bo phep do ngay 29/07 lam tren clip 82 giay / 16 cau
 * / 17 clip. Video 1 tieng cua anh Tien ra ~2.000 cau, va Autocut tren do sinh
 * ra HANG NGHIN clip. Phai ep truoc khi khach gap.
 *
 * Chay:  node tests/stress-phude.mjs      (sau khi `npm run kiem` da bien dich js/)
 */

import { dungBangTuClip, dungBangQuyDoi, doiMoc, quyDoiCau, sinhSrt } from './js/srt.js'

let loi = 0
function check(ten, dieuKien, chiTiet) {
  if (dieuKien) console.log('  [OK]   ' + ten)
  else { console.log('  [SAI]  ' + ten + '  ' + (chiTiet ?? '')); loi++ }
}
function do_(ten, fn) {
  const t0 = process.hrtime.bigint()
  const r = fn()
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  console.log(`  ${ten}: ${ms.toFixed(1)} ms`)
  return { r, ms }
}

/**
 * Dung mot sequence GIA giong het ket qua Autocut tren video dai:
 * N clip lien tiep, moi clip lay mot doan cua file goc, giua cac doan co KHE HO
 * (chinh la cho da bi cat bo).
 */
function dungCanh(soClip, doDaiClip, khe) {
  const clips = []
  let seq = 0
  let src = 0
  for (let i = 0; i < soClip; i++) {
    clips.push({ seqTu: seq, srcTu: src, srcDen: src + doDaiClip })
    seq += doDaiClip
    src += doDaiClip + khe
  }
  return clips
}

/** Cau noi rai deu tren file goc, moi cau nam gon trong mot clip. */
function dungCau(clips, cauMoiClip) {
  const cau = []
  for (const c of clips) {
    const dai = (c.srcDen - c.srcTu) / cauMoiClip
    for (let k = 0; k < cauMoiClip; k++) {
      cau.push({
        tu: c.srcTu + k * dai + 0.01,
        den: c.srcTu + (k + 1) * dai - 0.01,
        chu: `cau ${cau.length + 1}`,
      })
    }
  }
  return cau
}

console.log('=== STRESS 1. Video 1 TIENG da qua Autocut: 1.000 clip / 2.000 cau ===')
{
  const CLIP = dungCanh(1000, 3.6, 0.4) // 1.000 clip x 3,6s = 3.600s = 1 tieng
  const CAU = dungCau(CLIP, 2) // 2.000 cau
  console.log(`  canh: ${CLIP.length} clip, ${CAU.length} cau, sequence dai ${(CLIP.length * 3.6).toFixed(0)}s`)

  const b = do_('dungBangTuClip', () => dungBangTuClip(CLIP, 0))
  check('bang du 1.000 dong', b.r.length === 1000, b.r.length)
  check('dungBangTuClip duoi 50ms', b.ms < 50, b.ms.toFixed(1) + 'ms')

  const s = do_('sinhSrt', () => sinhSrt(CAU, [], [], b.r))
  check('giu DU 2.000 cau, khong bo cau nao', s.r.soCau === 2000, `${s.r.soCau} giu / ${s.r.soBo} bo`)
  check('sinhSrt duoi 3 giay', s.ms < 3000, s.ms.toFixed(0) + 'ms')

  // Moc phai TANG DAN, khong duoc nhay lui
  const moc = [...s.r.noiDung.matchAll(/(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)/g)]
    .map((m) => ({
      tu: +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000,
      den: +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000,
    }))
  let lui = 0, amEnd = 0
  for (let i = 0; i < moc.length; i++) {
    if (i > 0 && moc[i].tu < moc[i - 1].tu - 1e-6) lui++
    if (moc[i].den <= moc[i].tu) amEnd++
  }
  check('khong cau nao nhay LUI ve truoc', lui === 0, lui + ' cau')
  check('khong cau nao co ket thuc <= bat dau', amEnd === 0, amEnd + ' cau')
  check('cau cuoi khong tran ra ngoai sequence',
    moc[moc.length - 1].den <= CLIP.length * 3.6 + 1e-6,
    moc[moc.length - 1].den + ' vs ' + CLIP.length * 3.6)
}

console.log('\n=== STRESS 2. So sanh voi CACH CU (chi lay clip[0]) ===')
{
  const CLIP = dungCanh(1000, 3.6, 0.4)
  const CAU = dungCau(CLIP, 2)
  const bangCu = dungBangQuyDoi([{ start: CLIP[0].srcTu, end: CLIP[0].srcDen }])
  const cu = sinhSrt(CAU, [], [], bangCu)
  const bangMoi = dungBangTuClip(CLIP, 0)
  const moi = sinhSrt(CAU, [], [], bangMoi)
  console.log(`  cach CU : ${cu.soCau} cau  (bo ${cu.soBo})`)
  console.log(`  cach MOI: ${moi.soCau} cau  (bo ${moi.soBo})`)
  check('cach cu chi ra 2 cau (tai hien duoc loi tren quy mo lon)', cu.soCau === 2, cu.soCau)
  check('cach moi cuu duoc 1.998 cau', moi.soCau - cu.soCau === 1998, moi.soCau - cu.soCau)
}

console.log('\n=== STRESS 3. Clip KHONG deu + khe ho khong deu (giong doi that) ===')
{
  const clips = []
  let seq = 0, src = 0
  for (let i = 0; i < 500; i++) {
    const dai = 0.5 + ((i * 7919) % 100) / 20 // 0,5 - 5,5s
    const khe = 0.1 + ((i * 104729) % 50) / 50 // 0,1 - 1,1s
    clips.push({ seqTu: seq, srcTu: src, srcDen: src + dai })
    seq += dai
    src += dai + khe
  }
  const bang = dungBangTuClip(clips, 0)
  let tang = true
  for (let i = 1; i < bang.length; i++) if (bang[i].seqTu < bang[i - 1].seqTu) tang = false
  check('bang xep tang dan theo vi tri tren sequence', tang)

  // Moc roi vao KHE HO phai tra -1, khong duoc bia
  const giuaKhe = clips[10].srcDen + 0.05
  check('moc roi vao khe ho -> -1, khong bia moc', doiMoc(bang, giuaKhe) === -1, doiMoc(bang, giuaKhe))

  // Cau nam TRON trong khe ho phai bi bo
  const c = quyDoiCau(bang, { tu: clips[10].srcDen + 0.02, den: clips[11].srcTu - 0.02, chu: 'x' })
  check('cau nam TRON trong khe ho -> bo han', c === null, JSON.stringify(c))
}

console.log('\n=== STRESS 4. Clip dua vao KHONG theo thu tu (Premiere doc lung tung) ===')
{
  const goc = dungCanh(200, 2, 0.3)
  const xao = goc.slice().sort(() => 0.5 - ((Date.now() % 3) - 1)) // dao tron on dinh
  const bangGoc = dungBangTuClip(goc, 0)
  const bangXao = dungBangTuClip(xao, 0)
  check('dua vao lung tung van ra bang GIONG HET (ham tu sap xep)',
    JSON.stringify(bangGoc) === JSON.stringify(bangXao))
}

console.log('\n=== STRESS 5. Truong hop bien ===')
{
  check('0 clip -> bang rong, khong sap', dungBangTuClip([], 0).length === 0)
  check('1 clip -> 1 dong', dungBangTuClip([{ seqTu: 5, srcTu: 10, srcDen: 20 }], 0).length === 1)
  const b1 = dungBangTuClip([{ seqTu: 5, srcTu: 10, srcDen: 20 }], 0)
  check('gocSeq=0 giu nguyen vi tri that (5s)', b1[0].seqTu === 5, b1[0].seqTu)
  const s0 = sinhSrt([], [], [], b1)
  check('0 cau -> soCau=0, khong nem loi', s0.soCau === 0)
}

console.log('')
if (loi === 0) console.log('TAT CA DAT')
else { console.log(`CO ${loi} PHEP DO SAI`); process.exitCode = 1 }
