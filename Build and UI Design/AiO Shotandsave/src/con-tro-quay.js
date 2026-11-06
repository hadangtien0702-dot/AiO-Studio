'use strict'
/* GHI VI TRI CON TRO LUC QUAY VIDEO (06/11) — nguyen lieu cho "Tu phong to theo con tro" cua man Sua video.
   Khong hook native (anh chot): chi hoi screen.getCursorScreenPoint() khoang 30 lan / giay trong luc quay, doi ra toa do
   0..1 TRONG VUNG QUAY, ghi vao file phu canh video: <ten video>.contro.json.

   Dinh dang: { v: 1, t0: epoch ms luc bo ghi bat dau, tre: ms hinh toi bo ghi tre so voi man that, w, h: co video,
                mau: [[dt ms ke tu t0, fx, fy], ...] }  (fx, fy = 0..1 trong vung quay, co the ngoai khoang khi chuot ra ngoai vung)
   Thoi gian trong video t (ms) tuong ung mau tai dt = t - tre (hinh tren man luc dt chi toi bo ghi sau `tre` ms) — may-quay.js lo.

   File phu nho (5 phut ~ 9.000 mau ~ 130 KB). Hong / khong co thi man Sua video chi la khong tu phong to duoc, khong mat gi khac. */
const fs = require('fs')
const { ghiBen } = require('./ghi-ben')

const NHIP_MS = 33
const TOI_DA_MAU = 20000
const DUOI_VIDEO = /\.(mp4|webm)$/i

/* Duong dan file phu cua mot video: bo duoi .mp4 / .webm, them .contro.json */
function duongPhu(fileVideo) { return String(fileVideo).replace(DUOI_VIDEO, '') + '.contro.json' }

/* Toa do con tro (DIP, toan desktop) -> 0..1 trong vung quay (rect DIP cuc bo cua man `bounds`). */
function vaoVung(p, bounds, rect) {
  return [(p.x - bounds.x - rect.x) / rect.w, (p.y - bounds.y - rect.y) / rect.h]
}

/**
 * Bat dau ghi. opts: { bounds (DIP man), rect (DIP cuc bo), t0 (epoch ms), tre (ms), w, h, docChuot (mac dinh screen.getCursorScreenPoint), nhip }
 * Tra { dung() -> doi tuong de ghi, soMau() }.
 */
function bat(opts) {
  const doc = opts.docChuot || (() => require('electron').screen.getCursorScreenPoint())
  const mau = []
  let cuoi = null // [dt, fx, fy] mau cuoi da ghi
  const lay = () => {
    let p
    try { p = doc() } catch (e) { return }
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return
    const dt = Math.max(0, Date.now() - opts.t0)
    const [fx, fy] = vaoVung(p, opts.bounds, opts.rect)
    const x = Math.round(fx * 10000) / 10000, y = Math.round(fy * 10000) / 10000
    // chuot dung yen: chi ghi lai moi 250 ms (du de may-quay.js biet "dang dung yen" ma file khong phinh)
    if (cuoi && Math.abs(cuoi[1] - x) < 0.0005 && Math.abs(cuoi[2] - y) < 0.0005 && dt - cuoi[0] < 250) return
    if (mau.length >= TOI_DA_MAU) return
    cuoi = [dt, x, y]
    mau.push(cuoi)
  }
  lay()
  const iv = setInterval(lay, opts.nhip > 0 ? opts.nhip : NHIP_MS)
  let xong = false
  return {
    dung() {
      if (!xong) { xong = true; clearInterval(iv); lay() }
      return { v: 1, t0: opts.t0, tre: opts.tre | 0, w: opts.w | 0, h: opts.h | 0, mau }
    },
    soMau: () => mau.length,
  }
}

/* Ghi file phu (nguyen tu qua ghiBen). Tra true / false, khong nem. Khong du mau (< 2) thi khong ghi. */
function luu(fileVideo, du) {
  try {
    if (!du || !Array.isArray(du.mau) || du.mau.length < 2) return false
    ghiBen(duongPhu(fileVideo), JSON.stringify(du))
    return true
  } catch (e) { return false }
}

/* Doc file phu. Tra doi tuong da kiem hop le, hoac null (khong co / hong / sai dinh dang). */
function doc(fileVideo) {
  try {
    let s = fs.readFileSync(duongPhu(fileVideo), 'utf8')
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
    const d = JSON.parse(s)
    if (!d || d.v !== 1 || !Array.isArray(d.mau) || d.mau.length < 2) return null
    const mau = d.mau.filter((m) => Array.isArray(m) && m.length === 3 && m.every(Number.isFinite))
    if (mau.length < 2) return null
    return { v: 1, t0: Number(d.t0) || 0, tre: Number(d.tre) || 0, w: d.w | 0, h: d.h | 0, mau }
  } catch (e) { return null }
}

module.exports = { bat, luu, doc, duongPhu, vaoVung, NHIP_MS }
