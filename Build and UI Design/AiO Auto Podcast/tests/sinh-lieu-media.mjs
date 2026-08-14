/**
 * sinh-lieu-media.mjs — sinh LIỆU MEDIA tổng hợp có đáp án cho spike #3
 * (đường dựng multicam trên Premiere thật) và cho anh Tiến bấm thử panel.
 *
 * Sinh vào "file pr for test/podcast-lieu/":
 *   micA.wav, micB.wav — 48 kHz mono, 10 lượt xen kẽ (cùng kịch bản với
 *                        tests/kiem-nao.mjs, bleed −16 dB) + 1 câu chen 0,6 s
 *   camA.mp4, camB.mp4 — màu đỏ / xanh + tone 300/600 Hz (tiếng cam PHẢI
 *                        BỊ THAY bằng tiếng mic — tone là để lộ nếu sót)
 *   dap-an.json        — đoạn não tính trên chính hai WAV này (đầu vào của
 *                        phần dựng) + kịch bản gốc
 *
 * Chạy:  node tests/sinh-lieu-media.mjs
 * Cần ffmpeg của panel anh em (Transcripts/Autocut) cho phần cam.
 */
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const AiONao = require('../dist/nao.js')

const goc = dirname(dirname(fileURLToPath(import.meta.url)))
const suite = dirname(goc)
const raDir = join(suite, 'file pr for test', 'podcast-lieu')
mkdirSync(raDir, { recursive: true })

// ── ffmpeg mượn của panel anh em ────────────────────────────────────────────
let ffmpeg = null
for (const p of ['AiO Transcripts', 'AiO Autocut']) {
  const c = join(suite, p, 'bin', 'win64', 'ffmpeg.exe')
  if (existsSync(c)) { ffmpeg = c; break }
}
if (!ffmpeg) { console.error('KHONG THAY ffmpeg o panel anh em'); process.exit(1) }

// ── Cùng kịch bản với kiem-nao.mjs — đây là ĐÁP ÁN ─────────────────────────
const SR = 48000
const NGHI = 0.4
const KICH_BAN = [
  { nguoi: 0, dai: 8 }, { nguoi: 1, dai: 6 }, { nguoi: 0, dai: 12 },
  { nguoi: 1, dai: 9 }, { nguoi: 0, dai: 5 }, { nguoi: 1, dai: 14 },
  { nguoi: 0, dai: 7 }, { nguoi: 1, dai: 10 }, { nguoi: 0, dai: 6 },
  { nguoi: 1, dai: 8 },
]
const CHEN = { nguoi: 0, luot: 5, sauGiay: 5, dai: 0.6 }

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20260801)

let tong = 0
const moc = []
for (const l of KICH_BAN) { moc.push({ nguoi: l.nguoi, tu: tong, den: tong + l.dai }); tong += l.dai + NGHI }
const daiGiay = tong
const soMau = Math.round(daiGiay * SR)
const nguon = [new Float32Array(soMau), new Float32Array(soMau)]

function ghiGiong(kenh, tuGiay, dai2) {
  const tu = Math.round(tuGiay * SR)
  const den = Math.min(soMau, Math.round((tuGiay + dai2) * SR))
  let amp = 0.1
  for (let i = tu; i < den; i++) {
    if ((i - tu) % Math.round(0.12 * SR) === 0) amp = 0.05 + rng() * 0.13
    nguon[kenh][i] = (rng() * 2 - 1) * amp
  }
}
for (const m of moc) ghiGiong(m.nguoi, m.tu, m.den - m.tu)
ghiGiong(CHEN.nguoi, moc[CHEN.luot].tu + CHEN.sauGiay, CHEN.dai)

const kBleed = Math.pow(10, -16 / 20)
const pcm = [new Int16Array(soMau), new Int16Array(soMau)]
for (let m = 0; m < 2; m++) {
  for (let i = 0; i < soMau; i++) {
    const v = nguon[m][i] + nguon[1 - m][i] * kBleed + (rng() * 2 - 1) * 0.0004
    pcm[m][i] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)))
  }
}

function dongWav(p) {
  const buf = Buffer.alloc(44 + p.length * 2)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + p.length * 2, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(p.length * 2, 40)
  for (let i = 0; i < p.length; i++) buf.writeInt16LE(p[i], 44 + i * 2)
  return buf
}
writeFileSync(join(raDir, 'micA.wav'), dongWav(pcm[0]))
writeFileSync(join(raDir, 'micB.wav'), dongWav(pcm[1]))
console.log('Da ghi micA.wav + micB.wav (' + daiGiay.toFixed(1) + 's, 48kHz)')

// ── Cam: màu + tone — tone 300/600 Hz là "bẫy": còn sót là nghe ra ngay ────
for (const [ten, mau, freq] of [['camA', 'red', 300], ['camB', 'blue', 600]]) {
  const ra = join(raDir, ten + '.mp4')
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi', '-i', `color=c=${mau}:s=1280x720:r=25`,
    '-f', 'lavfi', '-i', `sine=frequency=${freq}:sample_rate=48000`,
    '-t', daiGiay.toFixed(3),
    '-c:v', 'libopenh264', '-b:v', '1500k',
    '-c:a', 'aac', '-b:a', '96k',
    ra,
  ], { stdio: 'pipe' })
  console.log('Da ghi ' + ten + '.mp4 (' + mau + ', tone ' + freq + 'Hz)')
}

// ── Đáp án: não nghe chính hai WAV vừa ghi (đường thật của panel) ──────────
const dbs = pcm.map((p) => ({ db: AiONao.doDb(p, SR), offset: 0 }))
const kq = AiONao.aiDangNoi(dbs, daiGiay, {})
if (kq.trangThai !== 'OK') { console.error('NAO KHONG OK: ' + kq.trangThai); process.exit(1) }
writeFileSync(join(raDir, 'dap-an.json'), JSON.stringify({
  daiGiay, kichBan: moc, doan: kq.doan, thongKe: kq.thongKe,
}, null, 2))
console.log('Nao nghe ra ' + kq.doan.length + ' luot (ty le ro ' +
  (kq.thongKe.tyLeRo * 100).toFixed(1) + '%) -> dap-an.json')
