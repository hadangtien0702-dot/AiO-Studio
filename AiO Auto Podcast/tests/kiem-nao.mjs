/**
 * kiem-nao.mjs — bộ tự kiểm của não "ai đang nói".
 *
 * Dựng lại liệu tổng hợp CÓ ĐÁP ÁN của spike 01/08/2026: hai giọng xen kẽ
 * 10 lượt theo kịch bản biết trước, trộn bleed giả mic thu chéo, thêm khoảng
 * nghỉ giữa lượt và MỘT câu chen ngang 0,6 s (phải bị nuốt).
 *
 * Chạy:  node tests/kiem-nao.mjs
 * Thoát mã 1 nếu bất kỳ phép kiểm nào TRƯỢT — gắn được vào CI/hook sau này.
 *
 * ⚠️ Ngẫu nhiên có SEED (mulberry32) — hai lần chạy ra đúng một kết quả,
 * trượt là trượt thật chứ không phải "hên xui".
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const AiONao = require('../dist/nao.js')

// ── PRNG có seed — kết quả lặp lại được ─────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SR = 16000
const NGHI = 0.4 // khoảng lặng giữa hai lượt (giây)

/** Kịch bản 10 lượt xen kẽ A(0)/B(1), dài 5–15 s — ĐÁP ÁN của bài kiểm. */
const KICH_BAN = [
  { nguoi: 0, dai: 8 }, { nguoi: 1, dai: 6 }, { nguoi: 0, dai: 12 },
  { nguoi: 1, dai: 9 }, { nguoi: 0, dai: 5 }, { nguoi: 1, dai: 14 },
  { nguoi: 0, dai: 7 }, { nguoi: 1, dai: 10 }, { nguoi: 0, dai: 6 },
  { nguoi: 1, dai: 8 },
]
// Câu chen ngang: A nói 0,6 s giữa lượt 6 (B đang nói) — não phải NUỐT.
const CHEN = { nguoi: 0, luot: 5, sauGiay: 5, dai: 0.6 }

/** Sinh nguồn giọng từng người + đáp án mốc lượt. */
function sinhNguon() {
  const rng = mulberry32(20260801)
  let tong = 0
  const moc = [] // {nguoi, tu, den} — mốc ĐÁP ÁN của từng lượt
  for (const l of KICH_BAN) {
    moc.push({ nguoi: l.nguoi, tu: tong, den: tong + l.dai })
    tong += l.dai + NGHI
  }
  const daiGiay = tong
  const soMau = Math.round(daiGiay * SR)
  const nguon = [new Float32Array(soMau), new Float32Array(soMau)]

  function ghiGiong(kenh, tuGiay, daiGiay2) {
    const tu = Math.round(tuGiay * SR)
    const den = Math.min(soMau, Math.round((tuGiay + daiGiay2) * SR))
    // Biên độ đổi theo "âm tiết" ~120 ms cho giống nói thật, quanh −20 dBFS.
    let amp = 0.1
    for (let i = tu; i < den; i++) {
      if ((i - tu) % Math.round(0.12 * SR) === 0) amp = 0.05 + rng() * 0.13
      nguon[kenh][i] = (rng() * 2 - 1) * amp
    }
  }
  for (const m of moc) ghiGiong(m.nguoi, m.tu, m.den - m.tu)
  ghiGiong(CHEN.nguoi, moc[CHEN.luot].tu + CHEN.sauGiay, CHEN.dai)
  return { nguon, moc, daiGiay, rng }
}

/** Trộn bleed + nền phòng, ra PCM Int16 từng mic. */
function tronMic(nguon, bleedDb, rng) {
  const k = Math.pow(10, bleedDb / 20)
  const soMau = nguon[0].length
  const mics = []
  for (let m = 0; m < nguon.length; m++) {
    const pcm = new Int16Array(soMau)
    for (let i = 0; i < soMau; i++) {
      let v = nguon[m][i]
      for (let kh = 0; kh < nguon.length; kh++) {
        if (kh !== m) v += nguon[kh][i] * k
      }
      v += (rng() * 2 - 1) * 0.0004 // nền phòng ~ −68 dBFS
      pcm[i] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)))
    }
    mics.push(pcm)
  }
  return mics
}

/** Đóng PCM thành file WAV 16-bit mono — để kiểm cả đường taiWav. */
function dongWav(pcm, sr) {
  const buf = new Uint8Array(44 + pcm.length * 2)
  const dv = new DataView(buf.buffer)
  const ghiChu = (p, s) => { for (let i = 0; i < s.length; i++) buf[p + i] = s.charCodeAt(i) }
  ghiChu(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); ghiChu(8, 'WAVE')
  ghiChu(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true)
  dv.setUint16(22, 1, true); dv.setUint32(24, sr, true)
  dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true)
  ghiChu(36, 'data'); dv.setUint32(40, pcm.length * 2, true)
  new Int16Array(buf.buffer, 44).set(pcm)
  return buf
}

// ── Bộ đếm kết quả ──────────────────────────────────────────────────────────
let datCa = true
function kiem(ten, dat, chiTiet) {
  console.log((dat ? '  DAT   ' : '  TRUOT ') + ten + (chiTiet ? ' — ' + chiTiet : ''))
  if (!dat) datCa = false
}

function chayCa(bleedDb, mongDoi) {
  console.log('\n── Bleed ' + bleedDb + ' dB ──')
  const { nguon, moc, daiGiay, rng } = sinhNguon()
  const mics = tronMic(nguon, bleedDb, rng)

  // Đi qua ĐÚNG đường thật của panel: PCM → WAV → taiWav → doDb → aiDangNoi.
  const dbs = mics.map((pcm) => {
    const wav = dongWav(pcm, SR)
    const doc = AiONao.taiWav(wav)
    if (!doc) throw new Error('taiWav tra null cho WAV vua dong')
    return { db: AiONao.doDb(doc.pcm, doc.sr), offset: 0 }
  })
  const kq = AiONao.aiDangNoi(dbs, daiGiay, {})

  if (mongDoi === 'GAY') {
    kiem('gãy an toàn (trả KHONG_PHAN_BIET, không đoán bậy)', kq.trangThai === 'KHONG_PHAN_BIET',
      'trangThai=' + kq.trangThai + ' · tyLeRo=' + (kq.thongKe ? kq.thongKe.tyLeRo.toFixed(3) : '?'))
    return
  }

  kiem('trạng thái OK', kq.trangThai === 'OK', 'trangThai=' + kq.trangThai)
  if (kq.trangThai !== 'OK') return

  kiem('đúng 10 lượt (câu chen 0,6s bị nuốt)', kq.doan.length === KICH_BAN.length,
    'ra ' + kq.doan.length + ' lượt')

  let thuTuDung = kq.doan.length === KICH_BAN.length
  for (let i = 0; i < Math.min(kq.doan.length, KICH_BAN.length); i++) {
    if (kq.doan[i].nguoi !== KICH_BAN[i].nguoi) thuTuDung = false
  }
  kiem('đúng thứ tự người nói', thuTuDung)

  // Ranh lượt i (i>0) phải sát mốc ĐÁP ÁN lượt i bắt đầu nói.
  let lechMax = 0
  for (let i = 1; i < Math.min(kq.doan.length, moc.length); i++) {
    lechMax = Math.max(lechMax, Math.abs(kq.doan[i].tu - moc[i].tu))
  }
  kiem('ranh lệch đáp án ≤ 60 ms', lechMax <= 0.06, 'lệch max ' + (lechMax * 1000).toFixed(0) + ' ms')

  // Phủ kín, không hở, không chồng — thứ sẽ thành hình trên timeline.
  let phuKin = kq.doan[0].tu === 0 && Math.abs(kq.doan[kq.doan.length - 1].den - daiGiay) < 1e-9
  for (let i = 1; i < kq.doan.length; i++) {
    if (Math.abs(kq.doan[i].tu - kq.doan[i - 1].den) > 1e-9) phuKin = false
  }
  kiem('phủ kín [0, ' + daiGiay.toFixed(1) + 's] không hở', phuKin)
}

// ── Ca 1+2: setup phòng tốt và mic gần nhau — phải ăn trọn ─────────────────
chayCa(-16, 'OK')
chayCa(-8, 'OK')
// ── Ca 3: bleed −5 dB dưới ngưỡng chênh 6 dB — phải GÃY AN TOÀN ────────────
chayCa(-5, 'GAY')

// ── Ca 4: ba người — não phải chạy với N mic, không đóng đinh 2 ────────────
{
  console.log('\n── Ba người, bleed −16 dB ──')
  const rng = mulberry32(778)
  const KB3 = [
    { nguoi: 0, dai: 6 }, { nguoi: 1, dai: 5 }, { nguoi: 2, dai: 7 },
    { nguoi: 0, dai: 4 }, { nguoi: 2, dai: 6 }, { nguoi: 1, dai: 5 },
  ]
  let tong = 0
  const moc3 = []
  for (const l of KB3) { moc3.push({ nguoi: l.nguoi, tu: tong, den: tong + l.dai }); tong += l.dai + NGHI }
  const soMau = Math.round(tong * SR)
  const nguon3 = [new Float32Array(soMau), new Float32Array(soMau), new Float32Array(soMau)]
  for (const m of moc3) {
    const tu = Math.round(m.tu * SR)
    const den = Math.round(m.den * SR)
    let amp = 0.1
    for (let i = tu; i < den; i++) {
      if ((i - tu) % Math.round(0.12 * SR) === 0) amp = 0.05 + rng() * 0.13
      nguon3[m.nguoi][i] = (rng() * 2 - 1) * amp
    }
  }
  const mics3 = tronMic(nguon3, -16, rng)
  const dbs3 = mics3.map((pcm) => ({ db: AiONao.doDb(pcm, SR), offset: 0 }))
  const kq3 = AiONao.aiDangNoi(dbs3, tong, {})
  kiem('3 mic: trạng thái OK', kq3.trangThai === 'OK', 'trangThai=' + kq3.trangThai)
  kiem('3 mic: đúng 6 lượt', kq3.doan.length === 6, 'ra ' + kq3.doan.length)
  let dung3 = kq3.doan.length === 6
  for (let i = 0; i < Math.min(6, kq3.doan.length); i++) {
    if (kq3.doan[i].nguoi !== KB3[i].nguoi) dung3 = false
  }
  kiem('3 mic: đúng thứ tự 0→1→2→0→2→1', dung3)
}

// ── Ca 5: taiWav phải chê file hỏng, không sập ──────────────────────────────
{
  console.log('\n── Đường đọc WAV ──')
  kiem('file rác → null', AiONao.taiWav(new Uint8Array(100)) === null)
  kiem('buffer rỗng → null', AiONao.taiWav(new Uint8Array(0)) === null)
  const wavChuan = dongWav(new Int16Array(SR), SR)
  const doc = AiONao.taiWav(wavChuan)
  kiem('WAV chuẩn 1s → 16000 mẫu, sr đúng', !!doc && doc.sr === SR && doc.pcm.length === SR,
    doc ? 'sr=' + doc.sr + ' mau=' + doc.pcm.length : 'null')
}

console.log('\n' + (datCa ? '>>> TAT CA DAT' : '>>> CO PHEP KIEM TRUOT'))
process.exit(datCa ? 0 : 1)
