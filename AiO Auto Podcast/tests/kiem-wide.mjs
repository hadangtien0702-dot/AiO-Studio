/**
 * kiem-wide.mjs — bộ tự kiểm cho CAM CHUNG (coWide) trong nao.js.
 *
 * Anh Tiến 04/08/2026: quay thật có "1 cam chung giữa 2 người nhưng khi anh
 * chọn thì lại không sử dụng được". Luật wide: im quá 2 giây → về cam chung;
 * đoạn dẫn chưa ai nói → cam chung. TẮT mặc định — kiểm cả điều đó.
 *
 * Chạy:  node tests/kiem-wide.mjs   (thoát mã 1 nếu trượt)
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const AiONao = require('../dist/nao.js')

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

/**
 * Kịch bản có KHOẢNG IM DÀI — đáp án biết trước:
 *   0-3s im (dẫn) · 3-11s A nói · 11-19s IM DÀI 8s · 19-27s B nói ·
 *   27-28s im · 28-36s A nói
 */
const KICH_BAN = [
  { nguoi: 0, tu: 3, den: 11 },
  { nguoi: 1, tu: 19, den: 27 },
  { nguoi: 0, tu: 28, den: 36 },
]
const DAI = 36

function sinhMics(bleedDb) {
  const rng = mulberry32(20260804)
  const soMau = Math.round(DAI * SR)
  const nguon = [new Float32Array(soMau), new Float32Array(soMau)]
  for (const m of KICH_BAN) {
    const tu = Math.round(m.tu * SR), den = Math.round(m.den * SR)
    let amp = 0.1
    for (let i = tu; i < den; i++) {
      if ((i - tu) % Math.round(0.12 * SR) === 0) amp = 0.05 + rng() * 0.13
      nguon[m.nguoi][i] = (rng() * 2 - 1) * amp
    }
  }
  const k = Math.pow(10, bleedDb / 20)
  return nguon.map((_, mi) => {
    const pcm = new Int16Array(soMau)
    for (let i = 0; i < soMau; i++) {
      let v = nguon[mi][i] + nguon[1 - mi][i] * k + (rng() * 2 - 1) * 0.0004
      pcm[i] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)))
    }
    return { db: AiONao.doDb(pcm, SR), offset: 0 }
  })
}

let datCa = true
function kiem(ten, dat, chiTiet) {
  console.log((dat ? '  DAT   ' : '  TRUOT ') + ten + (chiTiet ? ' — ' + chiTiet : ''))
  if (!dat) datCa = false
}
function gan(a, b, saiSo = 0.35) { return Math.abs(a - b) <= saiSo }

const mics = sinhMics(-16)

// ═══ 1. TẮT coWide: hành vi CŨ — không có đoạn nguoi < 0 ═══
{
  const kq = AiONao.aiDangNoi(mics, DAI, {})
  kiem('tắt coWide: trạng thái OK', kq.trangThai === 'OK', kq.trangThai)
  kiem('tắt coWide: KHÔNG có đoạn wide (giữ hành vi cũ)',
    kq.doan.every((d) => d.nguoi >= 0),
    kq.doan.map((d) => d.nguoi).join(','))
}

// ═══ 2. BẬT coWide ═══
{
  const kq = AiONao.aiDangNoi(mics, DAI, { coWide: true })
  kiem('bật coWide: trạng thái OK', kq.trangThai === 'OK', kq.trangThai)
  const wide = kq.doan.filter((d) => d.nguoi === -1)
  kiem('có đoạn CAM CHUNG', wide.length >= 2, wide.length + ' đoạn wide')

  kiem('đoạn DẪN (0-3s chưa ai nói) là cam chung',
    kq.doan.length > 0 && kq.doan[0].nguoi === -1 && kq.doan[0].tu === 0,
    'đoạn đầu: nguoi=' + kq.doan[0].nguoi + ' tu=' + kq.doan[0].tu.toFixed(2))

  // Khoảng im 11-19s: giữ A thêm ~2s (nán lại) rồi về wide đến khi B nói.
  const wideGiua = kq.doan.find((d) => d.nguoi === -1 && d.tu > 11 && d.tu < 15)
  kiem('im dài 8s ở giữa → về cam chung SAU ~2s nán lại',
    !!wideGiua && gan(wideGiua.tu, 13, 0.6),
    wideGiua ? 'wide tu=' + wideGiua.tu.toFixed(2) + ' (mong ~13)' : 'KHONG THAY')
  kiem('cam chung kết thúc khi B bắt đầu nói (~19s)',
    !!wideGiua && gan(wideGiua.den, 19, 0.6),
    wideGiua ? 'den=' + wideGiua.den.toFixed(2) + ' (mong ~19)' : '')

  // Im NGẮN 1s (27-28s) KHÔNG được về wide — nuốt như cũ, A vẫn liền mạch.
  const wideNgan = kq.doan.find((d) => d.nguoi === -1 && d.tu > 26.5 && d.tu < 28.5)
  kiem('im ngắn 1s KHÔNG về wide (2s nán lại nuốt trọn)', !wideNgan,
    wideNgan ? 'bi wide oan tai ' + wideNgan.tu.toFixed(2) : 'dung')

  // Ranh lượt NÓI không suy suyển: A vào 3s, B vào 19s, A vào 28s.
  const ranhNoi = kq.doan.filter((d) => d.nguoi >= 0).map((d) => d.tu)
  const mong = [3, 19, 28]
  let ranhDung = ranhNoi.length === 3
  for (let i = 0; i < Math.min(ranhNoi.length, 3); i++) {
    if (!gan(ranhNoi[i], mong[i], 0.25)) ranhDung = false
  }
  kiem('ranh vào lượt NÓI không suy suyển (3s · 19s · 28s)', ranhDung,
    ranhNoi.map((x) => x.toFixed(2)).join(', '))

  // Phủ kín, không hở
  let kin = kq.doan.length > 0 && kq.doan[0].tu === 0 &&
    Math.abs(kq.doan[kq.doan.length - 1].den - DAI) < 0.001
  for (let i = 1; i < kq.doan.length; i++) {
    if (Math.abs(kq.doan[i].tu - kq.doan[i - 1].den) > 0.001) kin = false
  }
  kiem('phủ kín [0, ' + DAI + 's] không hở', kin)
}

// ═══ 3. Chỉnh được ngưỡng nán lại ═══
{
  const kq = AiONao.aiDangNoi(mics, DAI, { coWide: true, wideSauGiay: 4 })
  const wideGiua = kq.doan.find((d) => d.nguoi === -1 && d.tu > 11 && d.tu < 17)
  kiem('wideSauGiay=4 → về wide muộn hơn (~15s)',
    !!wideGiua && gan(wideGiua.tu, 15, 0.6),
    wideGiua ? 'tu=' + wideGiua.tu.toFixed(2) + ' (mong ~15)' : 'KHONG THAY')
}

console.log('')
console.log(datCa ? '>>> TAT CA DAT' : '>>> CO PHEP KIEM TRUOT')
process.exit(datCa ? 0 : 1)
