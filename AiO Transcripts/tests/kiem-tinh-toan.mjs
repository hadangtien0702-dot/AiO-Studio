/**
 * kiem-tinh-toan.mjs — kiem phan TINH TOAN cua Autocut, chay ngoai Premiere.
 *
 * Chay:  cd client && npm run kiem
 *
 * Vi sao co file nay: phan "cat o dau" khong duoc phep sai, ma thu tren Premiere
 * thi cham va sua that vao du an. Hai module `silencelog.ts` va `plan.ts` co y
 * viet THUAN (khong dung Node, khong dung CEP) de kiem duoc bang so o day.
 *
 * LOG duoi day la KET QUA THAT cua FFmpeg 2026-07-28, do tren mot file tu tao:
 *   tieng 0-2s | lang 2-3s | tieng 3-6s | lang 6-7.5s | tieng 7.5-9.5s | lang 9.5-11s
 * Tao lai bang:
 *   ffmpeg -f lavfi -i "aevalsrc='sin(2*PI*440*t)*0.5*(lt(t,2)+between(t,3,6)+between(t,7.5,9.5))':d=11:s=44100" thu.wav
 *   ffmpeg -i thu.wav -vn -af silencedetect=noise=-30dB:d=0.5 -f null -
 */

import { parseSilenceLog, parseDuration } from './js/silencelog.js'
import { lapKeHoach, keepsToString, demCauBiNuot, chonNguong } from './js/plan.js'
import { dungBangQuyDoi, dungBangTuClip, doiMoc, quyDoiCau, suaTu, sinhSrt, mocSrt, chonChoSoat, THAY_TU_MAC_DINH } from './js/srt.js'
import { parseResult, parseKV } from './js/cep.js'

const LOG = `
  Duration: 00:00:11.00, bitrate: 705 kb/s
[silencedetect @ 00000234636fa680] silence_start: 1.99998
[silencedetect @ 00000234636fa680] silence_end: 3.00005 | silence_duration: 1.00007
[silencedetect @ 00000234636fa680] silence_start: 5.99998
[silencedetect @ 00000234636fa680] silence_end: 7.50005 | silence_duration: 1.50007
[silencedetect @ 00000234636fa680] silence_start: 9.49998
[silencedetect @ 00000234636fa680] silence_end: 11 | silence_duration: 1.50002
`

let loi = 0
function check(ten, dieuKien, chiTiet) {
  if (dieuKien) console.log('  [OK]   ' + ten)
  else {
    console.log('  [SAI]  ' + ten + '  ' + (chiTiet ?? ''))
    loi++
  }
}

console.log('=== 1. Doc log FFmpeg that ===')
const dur = parseDuration(LOG)
const sil = parseSilenceLog(LOG, dur)
console.log('  duration =', dur)
console.log('  silences =', JSON.stringify(sil))
check('doc dung thoi luong 11.00', Math.abs(dur - 11) < 0.01, dur)
check('tim dung 3 khoang lang', sil.length === 3, sil.length)
const mong = [[2, 3], [6, 7.5], [9.5, 11]]
sil.forEach((s, i) => {
  check(`khoang ${i + 1} khop moc dat truoc (${mong[i][0]}-${mong[i][1]})`,
    Math.abs(s.start - mong[i][0]) < 0.02 && Math.abs(s.end - mong[i][1]) < 0.02,
    JSON.stringify(s))
})

console.log('\n=== 2. Lang keo den HET FILE (khong co silence_end) ===')
const cut = LOG.split('silence_end: 11')[0]
check('biet thoi luong -> tu dong khoang lang cuoi',
  (() => { const r = parseSilenceLog(cut, 11); return r.length === 3 && Math.abs(r[2].end - 11) < 0.001 })())
check('khong biet thoi luong -> BO khoang do, khong bia so',
  parseSilenceLog(cut).length === 2)

console.log('\n=== 3. Lap ke hoach (srcIn=0 srcOut=11 fps=30 pad=0.12) ===')
const kh = lapKeHoach(sil, { srcIn: 0, srcOut: 11, pad: 0.12, minCut: 0.1, minKeep: 0.1, fps: 30 })
console.log('  keeps =', JSON.stringify(kh.keeps.map((k) => [+k.start.toFixed(4), +k.end.toFixed(4)])))
console.log('  cuts  =', JSON.stringify(kh.cuts.map((k) => [+k.start.toFixed(4), +k.end.toFixed(4)])))
console.log(`  truoc=${kh.truoc.toFixed(3)}  sau=${kh.sau.toFixed(3)}  tietKiem=${kh.tietKiem.toFixed(3)}`)

check('giu + bo = do dai goc', Math.abs(kh.sau + kh.tietKiem - kh.truoc) < 1e-9)
check('3 doan giu', kh.keeps.length === 3, kh.keeps.length)
check('3 doan bo', kh.cuts.length === 3, kh.cuts.length)

let tang = true, trong = true, duong = true, truocDo = -1
for (const k of kh.keeps) {
  if (k.start < truocDo - 1e-9) tang = false
  truocDo = k.end
  if (k.start < -1e-9 || k.end > 11 + 1e-9) trong = false
  if (k.end - k.start <= 0) duong = false
}
check('cac doan giu tang dan, khong chong nhau', tang)
check('cac doan giu nam gon trong [srcIn, srcOut]', trong)
check('khong co doan giu do dai <= 0', duong)
check('moi moc nam dung tren khung hinh 30fps', kh.keeps.every((k) =>
  Math.abs(k.start * 30 - Math.round(k.start * 30)) < 1e-6 &&
  Math.abs(k.end * 30 - Math.round(k.end * 30)) < 1e-6))

// Khoang lang cuoi CHAM day clip -> khong dem o dau do. Vay chi 5 dau duoc dem.
const tongLang = sil.reduce((t, s) => t + (s.end - s.start), 0)
const mongTietKiem = tongLang - 5 * 0.12
check(`tiet kiem ~ tong lang (${tongLang.toFixed(2)}) tru dem (0.60), sai so < 1 khung moi nhat cat`,
  Math.abs(kh.tietKiem - mongTietKiem) < 3 / 30,
  `${kh.tietKiem.toFixed(4)} vs ${mongTietKiem.toFixed(4)}`)
check('dead air cuoi file bi bo HET (khong de lai doan giu vun)',
  kh.keeps[kh.keeps.length - 1].end < 9.7, kh.keeps[kh.keeps.length - 1].end)

console.log('\n=== 4. Clip da bi TRIM DAU (srcIn=5, srcOut=10) ===')
const kh2 = lapKeHoach(sil, { srcIn: 5, srcOut: 10, pad: 0.12, minCut: 0.1, minKeep: 0.1, fps: 30 })
console.log('  keeps =', JSON.stringify(kh2.keeps.map((k) => [+k.start.toFixed(4), +k.end.toFixed(4)])))
check('khong doan nao ra ngoai [5, 10]',
  kh2.keeps.every((k) => k.start >= 5 - 1e-9 && k.end <= 10 + 1e-9), JSON.stringify(kh2.keeps))
check('truoc = 5 giay', Math.abs(kh2.truoc - 5) < 1e-9, kh2.truoc)
check('giu + bo = 5', Math.abs(kh2.sau + kh2.tietKiem - 5) < 1e-9)

console.log('\n=== 5. Dem NUOT HET khoang lang (pad 0.6 tren khoang 1.0s) ===')
const kh3 = lapKeHoach([{ start: 2, end: 3 }],
  { srcIn: 0, srcOut: 11, pad: 0.6, minCut: 0.1, minKeep: 0.1, fps: 30 })
check('khong cat gi ca, khong bao nham la co cat',
  kh3.cuts.length === 0 && kh3.keeps.length === 1 && Math.abs(kh3.tietKiem) < 1e-9, JSON.stringify(kh3))

console.log('\n=== 6. Chuoi gui sang ExtendScript ===')
const s = keepsToString(kh.keeps)
console.log('  ' + s)
check('dung dinh dang a,b;a,b', /^(\d+\.\d{4},\d+\.\d{4})(;\d+\.\d{4},\d+\.\d{4})*$/.test(s), s)
check('so cap = so doan giu', s.split(';').length === kh.keeps.length)

console.log('\n=== 7. Quy doi moc thoi gian cho PHU DE ===')
// Whisper nghe tren FILE GOC, phu de phai gan len SEQUENCE DA CAT — hai truc
// thoi gian khac nhau. Day la mat xich de sai nhat cua ca tinh nang.
// Doan giu [0,2] va [5,8] tren file goc -> tren sequence moi thanh [0,2] va [2,5].
const KEEPS = [{ start: 0, end: 2 }, { start: 5, end: 8 }]
const bang = dungBangQuyDoi(KEEPS)
console.log('  bang =', JSON.stringify(bang))
check('doan 1 dat tai 0', bang[0].seqTu === 0)
check('doan 2 dat tai 2 (KHONG phai 5)', bang[1].seqTu === 2, bang[1].seqTu)
check('moc 1.0s goc -> 1.0s seq', doiMoc(bang, 1) === 1)
check('moc 6.0s goc -> 3.0s seq', doiMoc(bang, 6) === 3, doiMoc(bang, 6))
check('moc 3.5s (nam trong doan da cat) -> -1', doiMoc(bang, 3.5) === -1)

const c1 = quyDoiCau(bang, { tu: 0.5, den: 1.5, chu: 'a' })
check('cau nam gon trong doan giu', c1 && c1.tu === 0.5 && c1.den === 1.5, JSON.stringify(c1))
const c2 = quyDoiCau(bang, { tu: 5.5, den: 7, chu: 'b' })
check('cau o doan 2 duoc keo ve dung cho (2.5 -> 4.0)',
  c2 && c2.tu === 2.5 && c2.den === 4, JSON.stringify(c2))
const c3 = quyDoiCau(bang, { tu: 3, den: 6, chu: 'c' })
check('dau cau roi vao vung DA CAT -> keo toi dau doan giu ke tiep',
  c3 && Math.abs(c3.tu - 2) < 1e-9 && Math.abs(c3.den - 3) < 1e-9, JSON.stringify(c3))
const c4 = quyDoiCau(bang, { tu: 3, den: 4, chu: 'd' })
check('cau nam TRON trong vung da cat -> bo han, khong bia moc', c4 === null, JSON.stringify(c4))

console.log('\n=== 8. Sua tu nghe nham ===')
check('sua duoc cum tu',
  suaTu('chi chia tre mot phan', [{ sai: 'chia tre', dung: 'chi tra' }]) === 'chi chi tra mot phan')
check('khong phan biet hoa thuong',
  suaTu('Chia Tre', [{ sai: 'chia tre', dung: 'chi tra' }]) === 'chi tra')
check('cap rong thi bo qua, khong lam hong cau', suaTu('abc', [{ sai: '', dung: 'x' }]) === 'abc')

// ☠️ [2.0.0] BANG MAC DINH PHAI RONG. Anh Tien bat loi 29/07: mo video tuyen
// dung ma panel bay ra "lai suat / quy du phong / chi tra" - thuat ngu bao hiem
// tu clip khac. Khach la mua ve cung se thay y het. Va "loi suat -> lai suat"
// con SUA BAY: "loi suat" (yield) la tu dung trong tai chinh.
check('bang mac dinh PHAI rong - khong nhet thuat ngu mot nganh vao san pham',
  Array.isArray(THAY_TU_MAC_DINH) && THAY_TU_MAC_DINH.length === 0,
  THAY_TU_MAC_DINH.length + ' cap')
check('bang rong thi KHONG doi chu nao', suaTu('loi suat cua quy du phong', THAY_TU_MAC_DINH) === 'loi suat cua quy du phong')

console.log('\n=== 9. Sinh file .srt ===')
const sr = sinhSrt(
  [
    { tu: 0.5, den: 1.5, chu: 'cau mot' },
    { tu: 3, den: 4, chu: 'cau nam tron trong doan bi cat' },
    { tu: 5.5, den: 7, chu: 'cau hai' },
  ],
  KEEPS,
  [],
)
console.log(sr.noiDung.split('\r\n').map((l) => '    ' + l).join('\n'))
check('giu 2 cau, bo 1 cau', sr.soCau === 2 && sr.soBo === 1, sr.soCau + '/' + sr.soBo)
check('danh so lai tu 1, lien tuc', sr.noiDung.indexOf('1\r\n00:00:00,500') === 0)
check('cau hai dung moc DA QUY DOI (2.5s, khong phai 5.5s)',
  sr.noiDung.indexOf('00:00:02,500 --> 00:00:04,000') > 0, sr.noiDung)
check('moc SRT dung dinh dang', mocSrt(3661.25) === '01:01:01,250', mocSrt(3661.25))

console.log('\n=== 9b. PHU DE TREN SEQUENCE NHIEU CLIP — du lieu THAT 29/07/2026 ===')
// Loi da tra gia: chay LAM PHU DE tren sequence 17 clip do Auto Cut sinh ra thi
// chi ra 1 cau / 136 byte, khong bao loi. Nguyen nhan: bang quy doi chi lay
// clips[0] -> [0 -> 3,36], 15/16 cau roi ra ngoai bang.
//
// So duoi day doc THANG tu Premiere (17 clip cua "Sequence 01 - autocut 1455")
// va tu bo dem nghe "final.autocut-nghe.json" (16 cau).
const CLIP_THAT = [
  [0.00, 3.36, 0.00, 3.36], [3.36, 8.80, 3.88, 9.32], [8.80, 14.92, 9.72, 15.84],
  [14.92, 15.96, 16.16, 17.20], [15.96, 21.80, 17.68, 23.52], [21.80, 26.84, 24.20, 29.24],
  [26.84, 33.20, 30.04, 36.40], [33.20, 37.28, 37.04, 41.12], [37.28, 39.80, 41.84, 44.36],
  [39.80, 40.60, 44.76, 45.56], [40.60, 43.96, 45.92, 49.28], [43.96, 45.40, 49.96, 51.40],
  [45.40, 53.20, 51.80, 59.60], [53.20, 59.56, 60.04, 66.40], [59.56, 62.80, 67.16, 70.40],
  [62.80, 68.36, 71.36, 76.92], [68.36, 72.08, 78.00, 81.72],
].map(([seqTu, , srcTu, srcDen]) => ({ seqTu, srcTu, srcDen }))

const CAU_THAT = [
  [0.00, 3.24], [3.94, 9.20], [9.78, 15.74], [16.22, 17.10], [17.52, 23.42], [24.28, 29.12],
  [30.12, 36.28], [37.16, 41.00], [41.90, 44.24], [44.58, 49.18], [50.04, 56.00], [56.50, 59.48],
  [60.14, 66.30], [67.24, 70.28], [71.16, 76.82], [78.08, 81.32],
].map(([tu, den], i) => ({ tu, den, chu: 'cau ' + (i + 1) }))

// (a) Tai hien LOI CU: chi lay clip dau lam ca bang quy doi
const bangCu = dungBangQuyDoi([{ start: CLIP_THAT[0].srcTu, end: CLIP_THAT[0].srcDen }])
const srCu = sinhSrt(CAU_THAT, [], [], bangCu)
check('tai hien duoc loi cu: chi ra 1 cau', srCu.soCau === 1, srCu.soCau + ' cau')

// (b) Ban SUA: dung bang tu TOAN BO 17 clip
const bangMoi = dungBangTuClip(CLIP_THAT, CLIP_THAT[0].seqTu)
check('bang moi co du 17 dong', bangMoi.length === 17, bangMoi.length)
check('dong 2 dat tai 3.36 tren sequence (KHONG cong don thanh 3.36-3.88)',
  Math.abs(bangMoi[1].seqTu - 3.36) < 1e-9, bangMoi[1].seqTu)

const srMoi = sinhSrt(CAU_THAT, [], [], bangMoi)
check('BAN SUA giu duoc ca 16 cau', srMoi.soCau === 16, srMoi.soCau + ' cau, bo ' + srMoi.soBo)

// Cau 2 phai roi dung vao clip 1: src 3.94 nam trong [3.88, 9.32] dat tai seq 3.36
// => 3.36 + (3.94 - 3.88) = 3.42
check('cau 2 quy doi ve 3.42s (truoc khi sua thi bi vut han)',
  Math.abs(doiMoc(bangMoi, 3.94) - 3.42) < 1e-9, doiMoc(bangMoi, 3.94))
// Cau cuoi: src 78.08 nam trong [78.00, 81.72] dat tai seq 68.36 => 68.44
check('cau cuoi quy doi ve 68.44s',
  Math.abs(doiMoc(bangMoi, 78.08) - 68.44) < 1e-9, doiMoc(bangMoi, 78.08))
// Moi cau phai nam TRONG vung I-O (0 -> 72.08), khong duoc tran ra ngoai
const mocCuoiSrt = bangMoi[bangMoi.length - 1].seqTu +
  (bangMoi[bangMoi.length - 1].srcDen - bangMoi[bangMoi.length - 1].srcTu)
check('phu de nam gon trong vung I-O (het o 72.08s)',
  Math.abs(mocCuoiSrt - 72.08) < 1e-9, mocCuoiSrt)

// (c) CLIP KHONG BAT DAU O GIAY 0 — loi chu du an chi ra tren anh chup 29/07:
//     clip nam o 38.53s ma phu de lai nam o 0s, lech dung 38.53 giay.
//     Host dat caption track cung tai giay 0, nen moc trong .srt PHAI la gio
//     TUYET DOI tren sequence. Do bang: gocSeq = 0, khong chuan hoa.
const CLIP_LECH = [{ seqTu: 38.53, srcTu: 38.53, srcDen: 120.23 }]
const bangLech = dungBangTuClip(CLIP_LECH, 0)
check('clip bat dau o 38.53s -> dong bang cung dat tai 38.53s (KHONG phai 0)',
  Math.abs(bangLech[0].seqTu - 38.53) < 1e-9, bangLech[0].seqTu)
check('cau o src 40.00s -> seq 40.00s (khop dung cho nguoi ta noi)',
  Math.abs(doiMoc(bangLech, 40) - 40) < 1e-9, doiMoc(bangLech, 40))
// Neu chuan hoa ve dau clip (loi cu) thi cau do se roi ve 1.47s -> lech 38.53s
const bangSaiCu = dungBangTuClip(CLIP_LECH, CLIP_LECH[0].seqTu)
check('tai hien duoc kieu lech cu: cung cau do roi ve 1.47s',
  Math.abs(doiMoc(bangSaiCu, 40) - 1.47) < 1e-9, doiMoc(bangSaiCu, 40))

console.log('\n=== 10. DU LIEU THAT — clip 82 giay (final.mp4) ===')
// 32 khoang lang FFmpeg do o -25dB/0.25s tren final.mp4 (81,77 giay), 2026-07-28.
const LANG_THAT = [
  [3.22921, 3.97977], [5.83754, 6.30156], [9.1669, 9.81527], [10.679, 10.9892],
  [12.3978, 12.8691], [15.7792, 16.2792], [17.137, 17.7699], [18.3691, 18.6873],
  [21.6411, 22.0876], [23.402, 24.3144], [26.9171, 27.4053], [29.1147, 30.1253],
  [34.4146, 34.871], [36.2854, 37.1629], [41.0132, 41.957], [44.2477, 44.9034],
  [45.4127, 46.0177], [47.2338, 47.5], [49.1755, 50.0906], [51.2314, 51.9253],
  [54.6911, 55.1176], [56.0053, 56.5272], [59.5089, 60.1741], [61.3719, 61.9186],
  [63.899, 64.3719], [66.2791, 67.2762], [68.5169, 68.7832], [70.2543, 71.4642],
  [73.7641, 74.0211], [76.802, 78.1254], [78.826, 79.2855], [81.3472, 81.7707],
].map(([start, end]) => ({ start, end }))

const chung = { srcIn: 0, srcOut: 81.77, pad: 0.05, minCut: 0.1, minKeep: 0.1, fps: 25 }
const moi = lapKeHoach(LANG_THAT, chung)

console.log(`  ${moi.cuts.length} nhat cat, bo ${moi.tietKiem.toFixed(2)}s, con ${moi.sau.toFixed(2)}s`)
console.log(`  bo qua ${moi.soBoViQuaNgan} khoang vi chua dem xong con ngan hon minCut`)

// Bo mat na Whisper (2026-07-28) thi phai cat duoc GAN HET so khoang lang tim duoc.
check('cat duoc >= 90% so khoang lang tim duoc',
  moi.cuts.length >= LANG_THAT.length * 0.9, `${moi.cuts.length}/${LANG_THAT.length}`)
check('rut duoc hon 12 giay (ban co mat na chi rut 9,2s)',
  moi.tietKiem > 12, moi.tietKiem.toFixed(2))
check('cac doan giu lien tuc, khong chong nhau', (() => {
  let t = -1
  for (const k of moi.keeps) { if (k.start < t - 1e-9) return false; t = k.end }
  return true
})())
check('moi mat noi con dung 2 x pad giay im lang', (() => {
  // Khoang lang o GIUA clip bi thu hai dau `pad`; chi mep dau/cuoi moi cat sat.
  for (const c of moi.cuts) {
    if (c.start < 0.1 || c.end > 81.6) continue
    const goc = LANG_THAT.find((s) => s.start < c.end && s.end > c.start)
    if (!goc) return false
    if (Math.abs(c.start - goc.start - chung.pad) > 1 / 25) return false
    if (Math.abs(goc.end - c.end - chung.pad) > 1 / 25) return false
  }
  return true
})())

console.log('\n=== 11. CHON CHO CAN SOAT (diem tin cay THAT cua Whisper) ===')
// Do that 2026-07-28 tren clip anh Tien, model large-v3-turbo.
// Nam tu duoi day DA XAC NHAN bang tai la nghe SAI.
const TU_THAT = [
  { chu: 'chị', giay: 0.1, p: 0.647 },
  { chu: 'chỉ', giay: 0.8, p: 0.997 },   // cho nay nghe DUNG
  { chu: 'bảo', giay: 3.9, p: 0.824 },
  { chu: 'chỉ', giay: 4.8, p: 0.384 },   // SAI (dang ra "chi")
  { chu: 'trả', giay: 5.0, p: 0.517 },   // SAI
  { chu: 'phần,', giay: 5.4, p: 0.545 },
  { chu: 'còn', giay: 5.8, p: 0.750 },
  { chu: 'IUL?', giay: 15.4, p: 0.674 },
  { chu: 'trả', giay: 21.8, p: 1.0 },    // cho nay nghe DUNG
  { chu: 'lợi', giay: 30.1, p: 0.999 },  // cho nay nghe DUNG
  { chu: 'hưu', giay: 33.3, p: 0.731 },
  { chu: 'lợi', giay: 34.0, p: 0.548 },  // SAI (dang ra "lai")
  { chu: 'suất', giay: 34.2, p: 0.671 }, // SAI
  { chu: 'lợi', giay: 37.2, p: 1.0 },    // cho nay nghe DUNG
  { chu: '8-10', giay: 42.2, p: 0.675 },
  { chu: 'quỷ', giay: 47.3, p: 0.480 },  // SAI (dang ra "quy")
  { chu: 'chỉ', giay: 56.9, p: 1.0 },    // cho nay nghe DUNG
  { chu: 'nỗi', giay: 60.1, p: 0.605 },
  { chu: 'Hưng.', giay: 78.1, p: 0.746 },
]
const GIU_HET = [{ start: 0, end: 81.77 }] // chua cat gi -> moc giu nguyen
const cho = chonChoSoat(TU_THAT, GIU_HET, 0.6)
console.log('  danh dau:', cho.map((c) => `${c.chu}(${c.p.toFixed(2)})`).join(' · '))

check('bat duoc "chỉ" sai (p=0.384)', cho.some((c) => Math.abs(c.giay - 4.8) < 0.01))
check('bat duoc "trả" sai (p=0.517)', cho.some((c) => Math.abs(c.giay - 5.0) < 0.01))
check('bat duoc "lợi" sai (p=0.548)', cho.some((c) => Math.abs(c.giay - 34.0) < 0.01))
check('bat duoc "quỷ" sai (p=0.480)', cho.some((c) => Math.abs(c.giay - 47.3) < 0.01))
check('KHONG danh dau cho nghe DUNG (p=1.0 tai 21.8s)', !cho.some((c) => Math.abs(c.giay - 21.8) < 0.01))
check('KHONG danh dau cho nghe DUNG (p=0.999 tai 30.1s)', !cho.some((c) => Math.abs(c.giay - 30.1) < 0.01))
check('sap xep theo THOI GIAN de di tuan tu', (() => {
  for (let i = 1; i < cho.length; i++) if (cho[i].giay < cho[i - 1].giay) return false
  return true
})())

console.log('\n  --- Sau khi CAT, moc phai duoc quy doi ---')
// Giu [0,4] va [40,50]: tu o 47.3s tren file goc -> 4 + (47.3-40) = 11.3s tren sequence
const cho2 = chonChoSoat(TU_THAT, [{ start: 0, end: 4 }, { start: 40, end: 50 }], 0.6)
console.log('  ', cho2.map((c) => `${c.chu}@${c.giay.toFixed(2)}s`).join(' · '))
check('"quỷ" o 47.3s goc -> 11.3s tren sequence da cat',
  cho2.some((c) => c.chu === 'quỷ' && Math.abs(c.giay - 11.3) < 0.01),
  JSON.stringify(cho2))
check('tu roi vao doan DA CAT BO thi khong danh dau',
  !cho2.some((c) => Math.abs(c.giay - 5.0) < 0.01 && c.chu === 'trả'))

check('tran so marker duoc ton trong', chonChoSoat(TU_THAT, GIU_HET, 1.1, 3).length === 3)

console.log('\n=== 12. QUY MO THAT — video 58 phut (IMG_3987.mov) ===')
// ☠️ MUC NAY SINH RA TU MOT LOI THAT, DUNG XOA.
//
// Ban 0.5.0 chay hoan hao tren clip 82 giay (16 cau) roi GAN NHU KHONG CAT GI
// tren video 58 phut (2.033 cau): tim 1.914 khoang lang, chi cat 14 cho, rut 9,8
// giay. Ca nho khong the lo ra vi 16 cau thi khong bao gio phu kin duoc 82 giay.
//
// Du lieu: 1.914 khoang lang THAT do bang FFmpeg -25dB/0.25s tren chinh file cua
// anh Tien (9,27 GB, 58:37,5), 2026-07-28. Xem tests/du-lieu/lang-58phut.json.
import { readFileSync } from 'node:fs'
const LANG_58 = JSON.parse(
  readFileSync(new URL('./du-lieu/lang-58phut.json', import.meta.url), 'utf8'),
).map(([start, end]) => ({ start, end }))

const DAI = 3517.5
check('doc du 1.914 khoang lang that', LANG_58.length === 1914, LANG_58.length)

const ph = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
console.log('  muc          | nhat cat | doan giu | rut ngan | con lai')
console.log('  -------------|----------|----------|----------|--------')
const KQ = {}
for (const [ten, minSil, pad] of [['Giu nhip', 0.6, 0.15], ['Vua', 0.4, 0.08], ['Cat sach', 0.25, 0.04]]) {
  // Loc theo minSilence giong FFmpeg lam: khoang ngan hon thi von khong duoc bao.
  const ds = LANG_58.filter((s) => s.end - s.start >= minSil)
  const k = lapKeHoach(ds, { srcIn: 0, srcOut: DAI, pad, minCut: 0.1, minKeep: 0.1, fps: 30 })
  KQ[ten] = k
  console.log(
    `  ${ten.padEnd(12)} | ${String(k.cuts.length).padStart(8)} | ${String(k.keeps.length).padStart(8)} | ` +
    `${ph(k.tietKiem).padStart(8)} | ${ph(k.sau)}`,
  )
}

// PHEP KIEM CHONG TAI PHAM: neu ai do lai dat mot lop "bao ve" phu kin timeline
// thi con so nay tut ngay lap tuc va muc kiem nay do.
check('muc Vua rut duoc hon 10 phut (ban hong chi rut 9,8 GIAY)',
  KQ['Vua'].tietKiem > 600, ph(KQ['Vua'].tietKiem))
check('muc Cat sach rut duoc hon 14 phut', KQ['Cat sach'].tietKiem > 840, ph(KQ['Cat sach'].tietKiem))
check('muc Giu nhip van rut duoc hon 8 phut', KQ['Giu nhip'].tietKiem > 480, ph(KQ['Giu nhip'].tietKiem))

// Ty le "cat duoc / tim duoc" — chinh la con so le ra phai bat duoc loi tu dau.
const dsVua = LANG_58.filter((s) => s.end - s.start >= 0.4)
const tyLe = KQ['Vua'].cuts.length / dsVua.length
console.log(`  muc Vua: cat ${KQ['Vua'].cuts.length}/${dsVua.length} khoang lang = ${(tyLe * 100).toFixed(1)}%`)
check('cat duoc >= 90% so khoang lang du dai (ban hong chi 0,7%)', tyLe >= 0.9, (tyLe * 100).toFixed(1) + '%')

// Cac phep kiem toan ven o quy mo lon — cho nay moi lo ra sai so don.
for (const ten of ['Giu nhip', 'Vua', 'Cat sach']) {
  const k = KQ[ten]
  check(`[${ten}] giu + bo = do dai goc`, Math.abs(k.sau + k.tietKiem - DAI) < 1e-6)
  check(`[${ten}] doan giu tang dan, khong chong nhau`, (() => {
    let t = -1
    for (const x of k.keeps) { if (x.start < t - 1e-9 || x.end <= x.start) return false; t = x.end }
    return true
  })())
  check(`[${ten}] moi moc nam dung tren khung 30fps`, k.keeps.every((x) =>
    Math.abs(x.start * 30 - Math.round(x.start * 30)) < 1e-6 &&
    Math.abs(x.end * 30 - Math.round(x.end * 30)) < 1e-6))
  check(`[${ten}] khong doan giu nao ra ngoai [0, ${DAI}]`,
    k.keeps.every((x) => x.start >= -1e-9 && x.end <= DAI + 1e-9))
}

console.log('\n=== 13. CHOT CHAN "KHONG NUOT TRON CAU NOI" + TU DO NGUONG ===')
// ☠️ MUC NAY SINH RA TU MOT LOI THAT, DUNG XOA.
//
// 2026-07-28 14:35, anh Tien chay muc "Cat sach" (nguong CUNG -22 dB) tren video
// 58 phut. Ket qua: 58:37 -> 24:41. Nghe thi tuong ngon, nhung do lai thay no
// **cat mat 249 cau noi = 5,7 phut loi**. Ly do: clip la HAI NGUOI noi chuyen,
// nguoi ngoi xa mic chi noi o -36 dB, ma nguong -22 dB NAM CAO HON CA GIONG HO.
//
// Nen ngưỡng cung khong dung duoc. Xem `chonNguong()` trong plan.ts.
const CAU_58 = JSON.parse(
  readFileSync(new URL('./du-lieu/cau-58phut.json', import.meta.url), 'utf8'),
).map(([tu, den]) => ({ tu, den }))
check('doc du 2.033 cau that', CAU_58.length === 2033, CAU_58.length)

const doc58 = (db) =>
  JSON.parse(readFileSync(new URL(`./du-lieu/lang-58phut-${db}db.json`, import.meta.url), 'utf8'))
    .map(([start, end]) => ({ start, end }))

console.log('  nguong | chot chan | nhat cat | rut ngan | cuu duoc | CAU BI NUOT TRON')
console.log('  -------|-----------|----------|----------|----------|------------------')
const BANG = {}
for (const [db, pad] of [[22, 0.04], [25, 0.08], [30, 0.15]]) {
  const lang = doc58(db)
  for (const bat of [false, true]) {
    const k = lapKeHoach(lang, {
      srcIn: 0, srcOut: DAI, pad, minCut: 0.1, minKeep: 0.1, fps: 30,
      cauNoi: bat ? CAU_58 : undefined,
    })
    const nuot = demCauBiNuot(k.cuts, CAU_58)
    BANG[`${db}-${bat}`] = { k, nuot }
    console.log(
      `   -${db}dB | ${(bat ? 'BAT ' : 'tat ').padEnd(9)} | ${String(k.cuts.length).padStart(8)} | ` +
      `${ph(k.tietKiem).padStart(8)} | ${String(k.soCuuBoiCauNoi).padStart(8)} | ${String(nuot).padStart(16)}`,
    )
  }
}

// Phep kiem QUAN TRONG NHAT cua muc nay.
for (const db of [22, 25, 30]) {
  check(`[-${db}dB] BAT chot chan -> KHONG cau nao bi nuot tron`,
    BANG[`${db}-true`].nuot === 0, BANG[`${db}-true`].nuot)
}
check('[-22dB] TAT chot chan thi that su co nuot cau (chung minh loi la that)',
  BANG['22-false'].nuot > 200, BANG['22-false'].nuot)
check('chot chan chi bo mot phan nho, van cat duoc dang ke',
  BANG['25-true'].tietKiem === undefined || BANG['25-true'].k.tietKiem > BANG['30-false'].k.tietKiem,
  `${ph(BANG['25-true'].k.tietKiem)} vs ${ph(BANG['30-false'].k.tietKiem)}`)

console.log('\n  --- chon nguong tu dong ---')
const daThu = [22, 25, 30].map((db) => {
  const k = lapKeHoach(doc58(db), { srcIn: 0, srcOut: DAI, pad: 0.08, minCut: 0.1, minKeep: 0.1, fps: 30 })
  return { noiseDb: -db, tietKiem: k.tietKiem, soCauBiNuot: demCauBiNuot(k.cuts, CAU_58) }
})
for (const t of daThu) console.log(`   ${t.noiseDb} dB -> rut ${ph(t.tietKiem)}, nuot ${t.soCauBiNuot} cau`)
// Ngan sach = 0,3% so cau (giong App.tsx). 2.033 cau -> 6.
const NGAN_SACH = Math.floor(CAU_58.length * 0.003)
const chon = chonNguong(daThu, NGAN_SACH)
console.log(`   ngan sach = ${NGAN_SACH} cau  =>  chon ${chon ? chon.noiseDb : '(khong co)'} dB`)
check('chon nguong KHONG lay -22dB (nuot hang tram cau)', chon && chon.noiseDb !== -22, chon && chon.noiseDb)
check('chon nguong KHONG lay -25dB (nuot 44 cau)', chon && chon.noiseDb !== -25, chon && chon.noiseDb)
check('chon nguong lay -30dB — muc duy nhat trong ngan sach',
  chon && chon.noiseDb === -30 && chon.soCauBiNuot <= NGAN_SACH,
  chon && `${chon.noiseDb}dB nuot ${chon.soCauBiNuot}`)
check('lay muc CAT DUOC NHIEU NHAT trong so muc dat, khong phai nguong cao nhat',
  (() => {
    const r = chonNguong([
      { noiseDb: -30, tietKiem: 500, soCauBiNuot: 0 },
      { noiseDb: -27, tietKiem: 900, soCauBiNuot: 0 },
      { noiseDb: -24, tietKiem: 700, soCauBiNuot: 0 }, // nguong cao hon ma cat it hon
    ], 0)
    return r && r.noiseDb === -27
  })())
check('khong muc nao dat -> lay muc nuot IT nhat, khong tra null',
  (() => {
    const r = chonNguong([
      { noiseDb: -22, tietKiem: 900, soCauBiNuot: 234 },
      { noiseDb: -25, tietKiem: 800, soCauBiNuot: 27 },
    ], 0)
    return r && r.noiseDb === -25
  })())
check('danh sach rong -> tra null', chonNguong([], 0) === null)

// Chot chan phai RE: chay bang con tro, khong long hai vong.
const tDem = Date.now()
for (let r = 0; r < 20; r++) demCauBiNuot(BANG['22-false'].k.cuts, CAU_58)
const msDem = (Date.now() - tDem) / 20
console.log(`  demCauBiNuot: ${BANG['22-false'].k.cuts.length} nhat x ${CAU_58.length} cau = ${msDem.toFixed(1)} ms/lan`)
check('demCauBiNuot chay duoi 50ms (khong long hai vong)', msDem < 50, msDem.toFixed(1) + 'ms')

console.log('\n=== 14. GIAO LOI NOI VOI NANG LUONG (thiet ke 1.0.0) ===')
// ☠️ MUC NAY SINH RA TU LOI ANH TIEN NGHE THAY, DUNG XOA.
//
// Ban 0.9.0 quyet dinh cat CHI bang nang luong, mot nguong cho ca file.
// Do that: **321 cau bi cat mat qua nua loi** — toan cua nguoi ngoi xa mic.
// Nguyen nhan: nen on dao dong 7,9 dB giua cac phut (anh Tien quay nhieu cam),
// mot con so cho ca file bat buoc phai sai o it nhat mot dau.
//
// Du lieu: muc am tung cua so 20 ms do tren WAV DA LOC dai giong noi (300-3400Hz)
// cua chinh hai file cua anh Tien, luu bang so nguyen 1/10 dB.
import { vungNoiThat, khoangKhongNoi, vungNgoNgo } from './js/amluong.js'

function napMucAm(ten) {
  const a = JSON.parse(readFileSync(new URL(`./du-lieu/muc-cua-${ten}.json`, import.meta.url), 'utf8'))
  const cua = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) cua[i] = a[i] / 10
  // nen cuc bo: phan vi 20% moi khoi 30 giay — giong het `tinhNenCucBo`
  const khoi = Math.round(30 / 0.02)
  const nen = new Float32Array(a.length)
  for (let k = 0; k < a.length; k += khoi) {
    const het = Math.min(a.length, k + khoi)
    const lat = Array.from(cua.slice(k, het)).sort((x, y) => x - y)
    const p20 = lat[Math.floor(lat.length * 0.2)] ?? -90
    for (let i = k; i < het; i++) nen[i] = p20
  }
  return { soCua: a.length, nguongOtsu: -30, nenOn: -38, mucGiong: -29, tyLeIm: 0.5,
           cua, nenCucBo: nen, buocGiay: 0.02 }
}
const napCau = (ten) =>
  JSON.parse(readFileSync(new URL(`./du-lieu/cau-${ten}.json`, import.meta.url), 'utf8'))
    .map(([tu, den]) => ({ tu, den }))

const CO = [
  { ten: '58phut', dai: 3517.5, fps: 30, cau: napCau('58phut') },
  { ten: '82giay', dai: 81.77, fps: 25, cau: napCau('82giay') },
]
const MUC14 = [
  ['Giu nhip', 2, 0.6, 0.15],
  ['Vua', 2, 0.3, 0.10],
  ['Cat sach', 3, 0.2, 0.06],
]

for (const co of CO) {
  const m = napMucAm(co.ten)
  console.log(`\n  --- ${co.ten}: ${m.soCua} cua so, ${co.cau.length} cau ---`)
  console.log('  Muc       | bien | vung noi | nhat cat | rut ngan | cau hong')
  console.log('  ----------|------|----------|----------|----------|----------')
  // "Tieng noi that" lam CHUAN CHAM DIEM: bien +2 (rong nhat -> phep thu kho nhat)
  const chuan = vungNoiThat(m, co.cau, 2)
  for (const [ten, bien, minS, pad] of MUC14) {
    const vung = vungNoiThat(m, co.cau, bien)
    const lang = khoangKhongNoi(vung, co.dai)
    const k = lapKeHoach(lang, {
      srcIn: 0, srcOut: co.dai, pad, minCut: minS, minKeep: 0.1, fps: co.fps, cauNoi: co.cau,
    })
    // Dem cau bi cat mat > 50% tieng noi that
    let hong = 0
    for (const c of co.cau) {
      const phan = chuan.filter((v) => v.tu < c.den && v.den > c.tu)
      const tong = phan.reduce((t, v) => t + (Math.min(v.den, c.den) - Math.max(v.tu, c.tu)), 0)
      if (tong <= 0) continue
      let mat = 0
      for (const v of phan) for (const x of k.cuts) {
        const a = Math.max(x.start, v.tu, c.tu), b = Math.min(x.end, v.den, c.den)
        if (b > a) mat += b - a
      }
      if (mat / tong > 0.5) hong++
    }
    const phuTram = (vung.reduce((t, v) => t + (v.den - v.tu), 0) / co.dai) * 100
    console.log(
      `  ${ten.padEnd(9)} |  +${bien}  | ${phuTram.toFixed(1).padStart(7)}% | ` +
      `${String(k.cuts.length).padStart(8)} | ${ph(k.tietKiem).padStart(8)} | ${hong}`,
    )
    check(`[${co.ten}/${ten}] cau bi cat mat >50% loi <= 5 (ban 0.9.0: 321)`, hong <= 5, hong)
    check(`[${co.ten}/${ten}] doan giu tang dan, khong chong nhau`, (() => {
      let t = -1
      for (const x of k.keeps) { if (x.start < t - 1e-9 || x.end <= x.start) return false; t = x.end }
      return true
    })())
    check(`[${co.ten}/${ten}] giu + bo = do dai goc`, Math.abs(k.sau + k.tietKiem - co.dai) < 1e-6)
  }
}

console.log('\n=== 15. CHO MAY KHONG CHAC -> GIU LAI + DAT MARKER ===')
// ☠️ SINH RA TU MOT CA THAT, DUNG XOA.
//
// Anh Tien chi doan goc 4,93-6,20s tren video 58 phut, bao le ra phai cat.
// Do ky thi KHONG PHAN GIAI DUOC bang du lieu dang co:
//   - cao hon nen cuc bo 11-15 dB -> nang luong noi "co tin hieu that"
//   - lech chuan muc am 5,15 dB, o **phan vi 40%** cua 1.773 cau Whisper nghe ro
//     -> co nhip GIONG HET tieng noi (da thu gia thuyet "tieng dong deu" -> BAC BO)
//   - nhung Whisper chep ra chu lon xon -> khong dung lam bang chung duoc
// => May phai noi "toi khong chac": GIU lai va dat marker cho nguoi nghe quyet.
{
  const m = napMucAm('58phut')
  const cau = napCau('58phut')
  const vung = vungNoiThat(m, cau, 2)
  // moc bat dau cua tung tu, lay tu chinh ban nghe cua anh Tien
  const mocTu = JSON.parse(
    readFileSync(new URL('./du-lieu/moc-tu-58phut.json', import.meta.url), 'utf8'),
  )
  check('doc du 13.563 moc tu', mocTu.length === 13563, mocTu.length)

  console.log('  dai toi thieu | so cho | tong giay | co doan anh Tien chi')
  const soLuong = {}
  for (const minDai of [0.5, 0.8, 1.0, 1.5]) {
    const ds = vungNgoNgo(vung, mocTu, minDai)
    const co = ds.some((v) => v.tu < 6.2 && v.den > 4.93)
    soLuong[minDai] = ds.length
    console.log(
      `     ${minDai.toFixed(1)}s      | ${String(ds.length).padStart(6)} | ` +
      `${ds.reduce((t, v) => t + (v.den - v.tu), 0).toFixed(0).padStart(9)}s | ${co ? 'CO' : 'khong'}`,
    )
  }
  const macDinh = vungNgoNgo(vung, mocTu)
  check('muc mac dinh 0,8s BAT DUNG doan anh Tien chi (4,93-6,20s)',
    macDinh.some((v) => v.tu < 6.2 && v.den > 4.93),
    JSON.stringify(macDinh.map((v) => [+v.tu.toFixed(2), +v.den.toFixed(2)])))
  check('muc mac dinh ra it cho, marker khong rai kin timeline',
    macDinh.length > 0 && macDinh.length <= 20, macDinh.length)
  check('cang doi dai cang it cho', soLuong[0.5] >= soLuong[0.8] && soLuong[0.8] >= soLuong[1.5])
  check('moi cho deu dai hon nguong', macDinh.every((v) => v.den - v.tu >= 0.8))
}

check('vungNgoNgo: co chu trong vung -> KHONG danh dau',
  vungNgoNgo([{ tu: 0, den: 5 }], [2.5], 0.8).length === 0)
check('vungNgoNgo: khong co chu -> danh dau',
  vungNgoNgo([{ tu: 0, den: 5 }], [9], 0.8).length === 1)
check('vungNgoNgo: vung ngan hon nguong -> bo qua',
  vungNgoNgo([{ tu: 0, den: 0.5 }], [9], 0.8).length === 0)
check('vungNgoNgo: chu nam DUNG mep dau -> tinh la co chu',
  vungNgoNgo([{ tu: 1, den: 3 }], [1], 0.8).length === 0)
check('vungNgoNgo: chu nam dung mep cuoi -> KHONG tinh (nua khoang mo)',
  vungNgoNgo([{ tu: 1, den: 3 }], [3], 0.8).length === 1)

console.log('\n=== 16. VA LO HONG: CHO CO TIENG MA WHISPER BO SOT HAN ===')
// ☠️ SINH RA TU KIEM TRA CHEO HAI MO HINH (28/07 19:02), DUNG XOA.
//
// `vungNoiThat` truoc day chi bao ve phan nam TRONG mot cau. Neu Whisper bo sot
// han mot tieng de thi vung nang luong ay khong ai bao ve -> bi cat lang le.
// Do duoc: 17 vung / 8,5 giay tren video 58 phut, xap xi dung tong do dai
// 9 cau bi mat ma mo hinh KIA phat hien duoc.
{
  // Dung mot MucAm gia, de kiem dung phan logic chu khong phu thuoc file that.
  const n = 500 // 500 cua so x 0,02s = 10 giay
  const cua = new Float32Array(n).fill(-60)
  const nenCucBo = new Float32Array(n).fill(-60)
  // To o hai cho: 1,0-1,6s (TRONG cau) va 5,0-5,8s (NGOAI moi cau)
  for (let i = 50; i < 80; i++) cua[i] = -40
  for (let i = 250; i < 290; i++) cua[i] = -40
  const m = { soCua: n, nguongOtsu: -50, nenOn: -60, mucGiong: -40, tyLeIm: 0.5,
              cua, nenCucBo, buocGiay: 0.02 }
  const cau = [{ tu: 0.8, den: 2.0 }] // chi co cau o cho dau

  const co = vungNoiThat(m, cau, 2)
  const khong = vungNoiThat(m, cau, 2, 0) // tat phan va, de doi chieu

  check('TAT phan va -> chi giu duoc cho NAM TRONG cau', khong.length === 1,
    JSON.stringify(khong))
  check('BAT phan va -> giu duoc CA cho Whisper bo sot', co.length === 2,
    JSON.stringify(co))
  check('cho duoc cuu dung mocs 5,0-5,8s',
    co.some((v) => Math.abs(v.tu - 5.0) < 0.05 && Math.abs(v.den - 5.8) < 0.05),
    JSON.stringify(co))
  check('vung NGAN hon nguong thi KHONG cuu (tranh cuu ca tieng lach cach)', (() => {
    const c2 = new Float32Array(n).fill(-60)
    for (let i = 250; i < 258; i++) c2[i] = -40 // 0,16 giay
    return vungNoiThat({ ...m, cua: c2 }, cau, 2).length === 0
  })())
  check('khong co cau nao -> khong cuu gi (tranh cat het thanh giu het)',
    vungNoiThat(m, [], 2).length === 0)
}

// Phep kiem cua rieng `khoangKhongNoi` — phan bu phai kin va khong chong
check('khoangKhongNoi: phan bu dung', (() => {
  const v = [{ tu: 1, den: 2 }, { tu: 5, den: 7 }]
  const r = khoangKhongNoi(v, 10)
  return r.length === 3 && r[0].start === 0 && r[0].end === 1 &&
         r[1].start === 2 && r[1].end === 5 && r[2].start === 7 && r[2].end === 10
})())
check('khoangKhongNoi: vung phu kin -> khong con cho nao cat', khoangKhongNoi([{ tu: 0, den: 10 }], 10).length === 0)
check('khoangKhongNoi: khong co vung noi -> cat het', (() => {
  const r = khoangKhongNoi([], 10)
  return r.length === 1 && r[0].start === 0 && r[0].end === 10
})())

console.log('\n=== 17. DAI SONG XEM TRUOC: `uocVungCat` co NOI DUNG SU THAT khong ===')
// ☠️ MUC NAY SINH RA TU MOT CAU SUYT VIET SAI LEN GIAO DIEN (29/07/2026).
//
// Dai song ve o buoc xem truoc, TRUOC khi Whisper chay. Toi dinh ghi len man
// hinh: "day la muc bo TOI DA, buoc nghe hieu se giu lai bot nen thuc te bo it
// hon". Nghe rat hop ly — va co the SAI HOAN TOAN.
//
// Vi: `vungNoiThat` = (trong cau Whisper VA nang luong manh) + (va lo hong:
// nang luong manh ngoai cau). CA HAI ve deu doi NANG LUONG MANH. Nen
//        vungNoiThat  ⊆  {nang luong manh}
//   =>   cho KHONG noi  ⊇  {nang luong yeu}  =  thu `uocVungCat` tra ve
//   =>   may that co the cat NHIEU HON hinh ve, khong phai it hon.
//
// Bao cho nguoi dung "thuc te bo it hon" ma su that la bo nhieu hon la noi doi
// theo huong NGUY HIEM: ho tuong an toan hon thuc te. Do that roi moi viet chu.
import { uocVungCat } from './js/amluong.js'

for (const bo of CO) {
  const m = napMucAm(bo.ten)
  console.log(`  -- ${bo.ten} (${bo.dai}s) --`)
  console.log('  muc         | uoc: so cho / giay | that: so cho / giay | uoc <= that?')
  let truocGiay = -1
  for (const [ten, bien, minSil, pad] of MUC14) {
    const uoc = uocVungCat(m, bien, minSil, pad)
    let uocGiay = 0
    for (const c of uoc) uocGiay += c.den - c.tu

    // Vung cat THAT: giao hai nguon -> phan bu -> QUA `lapKeHoach` y het luong
    // chay that. ☠️ Phai loc SAU khi tru dem (`minCut`), khong phai truoc:
    // do that 29/07 tren Sequence 01, ban loc-truoc lam muc "Giu nhip" ve 6,0s
    // trong khi may cat 3,8s — dai song noi doi 58%.
    const vung = vungNoiThat(m, bo.cau, bien)
    const that = khoangKhongNoi(vung, bo.dai)
      .filter((x) => x.end - x.start - pad * 2 >= minSil)
    let thatGiay = 0
    for (const c of that) thatGiay += Math.max(0, c.end - c.start - pad * 2)

    console.log(
      `  ${ten.padEnd(11)} | ${String(uoc.length).padStart(5)} / ${uocGiay.toFixed(1).padStart(7)}s` +
      ` | ${String(that.length).padStart(5)} / ${thatGiay.toFixed(1).padStart(7)}s` +
      ` | ${uocGiay <= thatGiay + 0.5 ? 'CO' : 'KHONG'}`,
    )

    check(`${bo.ten}/${ten}: uoc luong KHONG duoc nhieu hon thuc te`,
      uocGiay <= thatGiay + 0.5,
      `uoc ${uocGiay.toFixed(1)}s vs that ${thatGiay.toFixed(1)}s`)

    // Moi khoang phai du dai va khong chong nhau — neu khong thi hinh ve sai
    let hopLe = true
    let mocCuoi = -1
    for (const c of uoc) {
      if (c.den - c.tu <= 0) hopLe = false
      if (c.tu < mocCuoi) hopLe = false
      mocCuoi = c.den
    }
    check(`${bo.ten}/${ten}: cac khoang tang dan, khong chong nhau`, hopLe)

    // Ba muc PHAI khac nhau — neu giong het thi dai song vo nghia, nguoi dung
    // bam qua lai ma khong thay gi doi.
    if (truocGiay >= 0) {
      check(`${bo.ten}/${ten}: bo NHIEU hon muc truoc`, uocGiay > truocGiay,
        `${uocGiay.toFixed(1)}s so voi ${truocGiay.toFixed(1)}s`)
    }
    truocGiay = uocGiay
  }
}

// `vungConLai` — phan bu, dung ve DAI SAU CAT. Sai cho nay thi hai dai khong
// so duoc voi nhau bang mat, ma do la ca diem cua tinh nang.
import { vungConLai } from './js/amluong.js'

check('vungConLai: phan bu dung', (() => {
  const r = vungConLai([{ tu: 1, den: 2 }, { tu: 5, den: 7 }], 10)
  return r.length === 3 &&
         r[0].tu === 0 && r[0].den === 1 &&
         r[1].tu === 2 && r[1].den === 5 &&
         r[2].tu === 7 && r[2].den === 10
})())
check('vungConLai: khong cat gi -> giu nguyen ca doan', (() => {
  const r = vungConLai([], 10)
  return r.length === 1 && r[0].tu === 0 && r[0].den === 10
})())
check('vungConLai: cat het -> khong con gi', vungConLai([{ tu: 0, den: 10 }], 10).length === 0)
check('vungConLai: cat CHONG NHAU van ra dung', (() => {
  // Khong duoc de khoang am hay doan trung: uocVungCat tra ve day tang dan,
  // nhung ham nay phai chiu duoc ca truong hop xau.
  const r = vungConLai([{ tu: 1, den: 5 }, { tu: 3, den: 7 }], 10)
  return r.length === 2 && r[0].den === 1 && r[1].tu === 7
})())
check('vungConLai: cat vuot qua thoi luong -> khong tran', (() => {
  const r = vungConLai([{ tu: 8, den: 20 }], 10)
  return r.length === 1 && r[0].tu === 0 && r[0].den === 8
})())

// Tong hai phan phai bang tron thoi luong — kiem tren DU LIEU THAT ca ba muc
for (const bo of CO) {
  const m = napMucAm(bo.ten)
  for (const [ten, bien, minSil, pad] of MUC14) {
    const cat = uocVungCat(m, bien, minSil, pad)
    const con = vungConLai(cat, m.cua.length * m.buocGiay)
    let a = 0, b2 = 0
    for (const x of cat) a += x.den - x.tu
    for (const x of con) b2 += x.den - x.tu
    const tong = m.cua.length * m.buocGiay
    check(`${bo.ten}/${ten}: cat + con lai = tron thoi luong`,
      Math.abs(a + b2 - tong) < 0.05,
      `${a.toFixed(2)} + ${b2.toFixed(2)} = ${(a + b2).toFixed(2)} so voi ${tong.toFixed(2)}`)
  }
}

// Vien: khong co cua so nao -> khong co gi de cat
check('uocVungCat: file rong -> khong cat gi', (() => {
  const m = { soCua: 0, nguongOtsu: -30, nenOn: -38, mucGiong: -29, tyLeIm: 0,
              cua: new Float32Array(0), nenCucBo: new Float32Array(0), buocGiay: 0.02 }
  return uocVungCat(m, 2, 0.3, 0.1).length === 0
})())

// Vien: dem an het khoang -> bo qua, khong duoc tra ve khoang am
check('uocVungCat: pad an het khoang -> bo qua', (() => {
  const n = 20 // 0,4 giay im
  const m = { soCua: n, nguongOtsu: -30, nenOn: -38, mucGiong: -29, tyLeIm: 1,
              cua: new Float32Array(n).fill(-60), nenCucBo: new Float32Array(n).fill(-40),
              buocGiay: 0.02 }
  return uocVungCat(m, 2, 0.3, 0.25).length === 0
})())

// ══════════════════════════════════════════════════════════════════════════
console.log('\n=== 18. DOC KET QUA HOST — chuoi THAT do tren Premiere 30/07 ===')
// ☠️ Bay da tra gia 30/07/2026, chu du an bat duoc: nut "Xoa N phu de" /
// "Xoa N marker" KHONG BAO GIO HIEN du sequence co san 60 marker va 4 item .srt.
//
// Host tra ve dung. Panel doc ra 0. Ba ham cua khoi don dep dung regex dung
// bang template literal voi lop ky tu "\d" — trong chuoi JS do khong phai
// escape hop le nen dau gach cheo rung mat, pattern thanh "(-?d+)" tuc la di
// tim chu "d" nghia den. Khong nem loi, khong log gi: HONG CAM.
//
// Do that qua cong 8091 truoc khi sua: host marker=60 itemSrt=4 | panel 0 va 0.
const HOST_DEM = 'OK:marker=60\nitemSrt=4'

const rDem = parseResult(HOST_DEM)
check('parseResult: nhan dang tien to OK:', rDem.ok === true)

const kvDem = parseKV(rDem.message)
check('doc dung marker=60 (truoc khi sua: 0)', parseInt(kvDem.marker, 10) === 60, kvDem.marker)
check('doc dung itemSrt=4 (truoc khi sua: 0)', parseInt(kvDem.itemSrt, 10) === 4, kvDem.itemSrt)

// Chinh dieu kien hien nut trong App.tsx — day moi la thu chu du an nhin thay.
const so = (k) => parseInt(parseKV(rDem.message)[k] ?? '0', 10) || 0
check('dieu kien hien khoi don: marker>0 || itemSrt>0',
  so('marker') > 0 || so('itemSrt') > 0)
check('nhan nut noi HAU QUA bang so that',
  `Xoa ${so('itemSrt')} phu de` === 'Xoa 4 phu de' && `Xoa ${so('marker')} marker` === 'Xoa 60 marker')

// Tai hien loi cu — phep do phai BAT DUOC no, khong thi phep do vo dung.
check('tai hien duoc loi cu: regex template literal doc ra 0', (() => {
  const cu = (k) => {
    const m = new RegExp(`${k}=(-?\d+)`).exec(rDem.message)
    return m ? parseInt(m[1], 10) : 0
  }
  return cu('marker') === 0 && cu('itemSrt') === 0
})())

// Ket qua that cua ac_xoaMarker / ac_xoaPhuDe — dung dinh dang, co dong rong.
const rXoa = parseResult('OK:daXoa=60\ntruoc=60\nconLai=0')
const kvXoa = parseKV(rXoa.message)
check('doc ket qua xoa marker: daXoa=60 conLai=0',
  parseInt(kvXoa.daXoa, 10) === 60 && parseInt(kvXoa.conLai, 10) === 0)

// So 0 la so THAT, khong duoc lan voi "khong doc duoc".
check('conLai=0 doc ra dung so 0', parseInt(parseKV('daXoa=4\nconLai=0').conLai, 10) === 0)

// Host chay tren Windows co the tra ve CRLF.
check('chiu duoc xuong dong CRLF', parseInt(parseKV('marker=7\r\nitemSrt=2').marker, 10) === 7)

// Loi cua host phai KHONG bi doc nham thanh so.
const rLoi = parseResult('ERR:CHUA_MO_SEQUENCE|')
check('host bao loi -> ok=false, khong bia so ra',
  rLoi.ok === false && (parseInt(parseKV(rLoi.message).marker ?? '0', 10) || 0) === 0)

console.log('\n' + (loi === 0 ? 'TAT CA DAT' : loi + ' PHEP KIEM SAI'))
process.exit(loi === 0 ? 0 : 1)
