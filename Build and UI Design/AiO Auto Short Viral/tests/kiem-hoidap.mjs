/**
 * kiem-hoidap.mjs — kiem NAO thuan cua Short Viral (moc.ts + hoidap.ts), chay ngoai Premiere.
 *
 * Chay:  cd client && npm run kiem
 *   ("kiem": tsc src/services/kieu.ts src/services/moc.ts src/services/hoidap.ts
 *            --target es2020 --module es2020 --skipLibCheck --outDir ../tests/js
 *            && node ../tests/kiem-hoidap.mjs)
 *
 * Chi DOC cac file dem `.autocut-nghe.json` — khong ghi gi canh video.
 * KHONG doc E:/IMG_0287* (du an rieng tu cua anh Tien).
 *
 * Cac phan:
 *  (1) HOI QUY tren dem that (vung 1 clip phu ca file): so v0 do 18/09 phai giu nguyen.
 *  (2) Quy mo that (luat 2b): 5 dem tieng Viet tren G: + du lieu nhan 10 lan.
 *  (3) Quy doi moc tren sequence nhieu clip GIA (khe ho, clip 2 o 38,53 s, multicam, doi toc).
 *  (4) Sua tay: gop / tach / doi ten / bo — bat bien, gop roi tach ve dung cu.
 *  (5) danhDauBia: bat du cau bia da biet, khong danh dau nham file sach.
 *  (6) RANH GIOI tung nguong (du lieu GIA) — nguong nao cung co mot phep dat sat mep.
 *  (7) Tab "Toan bo loi" (them 21/09): soLieuLoi · tung tu cua cau · mocSrt ·
 *      xuatSrt / xuatTxt (phan tich lai file da sinh) · tenFileSach · quy mo 2.000 cau.
 *  (7i) CHOT CHAN byte dieu khien nam tran trong ma nguon (`tests/kiem-byte.mjs`),
 *      co doi chung hai chieu — them 21/09 sau khi mot byte NUL o xuat.ts lam ban
 *      da dong goi mo ra TRANG mà build + bo kiem deu sach.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as nodeModule from 'node:module'

const THU_MUC = path.dirname(fileURLToPath(import.meta.url))
const JS = path.join(THU_MUC, 'js')

// tsc (module es2020) giu nguyen `from './hoidap'` — Node ESM khong tu them duoi
// .js. Moc resolve NGAY TRONG bo kiem (khong sua ma nguon cho vua Node):
// chi ap cho duong dan tuong doi khong co duoi, trong tests/js.
for (const f of ['moc.js', 'hoidap.js', 'xuat.js']) {
  if (!fs.existsSync(path.join(JS, f))) {
    console.log(`Chua co tests/js/${f} — chay tu client: npm run kiem (tsc bien dich truoc)`)
    process.exit(1)
  }
}
fs.writeFileSync(path.join(JS, 'package.json'), '{"type":"module"}\n')
if (typeof nodeModule.registerHooks !== 'function') {
  console.log(`Node ${process.version} chua co module.registerHooks (can Node >= 22.15 / 23.5)`)
  process.exit(1)
}
nodeModule.registerHooks({
  resolve(spec, ctx, next) {
    if (/^\.\.?\//.test(spec) && !path.extname(spec)) return next(spec + '.js', ctx)
    return next(spec, ctx)
  },
})
const moc = await import(pathToFileURL(path.join(JS, 'moc.js')).href)
const hd = await import(pathToFileURL(path.join(JS, 'hoidap.js')).href)
const xu = await import(pathToFileURL(path.join(JS, 'xuat.js')).href)

// ─────────────────────────── tien ich ───────────────────────────
let dat = 0
let hong = 0
function kiem(ten, dk, chiTiet) {
  if (dk) {
    dat++
    console.log('  [DAT]  ' + ten)
  } else {
    hong++
    console.log('  [HONG] ' + ten + (chiTiet !== undefined ? '  -> ' + chiTiet : ''))
  }
}
const f1 = (x) => (x == null || Number.isNaN(x) ? '-' : x.toFixed(1))
const trungVi = (a) => {
  if (!a.length) return NaN
  const s = [...a].sort((x, y) => x - y)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
const r1 = (x) => Math.round(x * 10) / 10
const ms = (t0) => performance.now() - t0

const E = {
  Heygen: 'E:/2025/T11/Video/Heygen/final.autocut-nghe.json',
  Conspiracy: 'E:/2026/Test/YTDown.com_YouTube_Insane-Conspiracy-Theories-That-Turned-O_Media_bdK96-iKQMg_001_1080p.autocut-nghe.json',
  Gnostic: 'E:/2026/Test/YTDown.com_YouTube_The-Gnostic-Gospels-The-Forbidden-Teachi_Media_B2gqnjfzcTY_001_1080p.autocut-nghe.json',
  Machine: 'E:/2026/Test/YTDown.com_YouTube_The-World-s-Most-Important-Machine_Media_MiUHjLxm3V0_001_1080p.autocut-nghe.json',
}
const G = {
  Cam1_ToanCanh: 'G:/Quay PV tuyển dụng_DRT_0902/01_Buoi1_PV_Thien_va_Trong/Video/Cam1_ToanCanh_C4025.autocut-nghe.json',
  Cam2_Thien: 'G:/Quay PV tuyển dụng_DRT_0902/01_Buoi1_PV_Thien_va_Trong/Video/Cam2_Thien_C4233.autocut-nghe.json',
  Cam3_Trong: 'G:/Quay PV tuyển dụng_DRT_0902/01_Buoi1_PV_Thien_va_Trong/Video/Cam3_Trong_C4087.autocut-nghe.json',
  C4085: 'G:/Quay PV tuyển dụng_DRT_0502/Video/Cam 1/C4085.autocut-nghe.json',
  C4091: 'G:/Quay PV tuyển dụng_DRT_1002/Video/Cam 2/C4091.autocut-nghe.json',
}

/** Doc dem thanh BanNghe. `path` = duong dan file dem (du lam khoa so khop voi clip gia). */
function docDem(f) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'))
  return {
    path: f.replace(/\\/g, '/'),
    ket: { cau: j.cau, tu: j.tu, ngonNgu: j.ngonNgu },
    nguon: j.phienBan === 2 ? 'dem-v2' : 'dem-v1',
    moHinh: j.moHinh || 'turbo',
  }
}
const tongGiay = (ban) => ban.ket.cau[ban.ket.cau.length - 1].den

function clip(p, o) {
  return { kind: 'A', trackIdx: 0, clipOrd: 0, speed: 1, path: p, ...o }
}
function vung(clips, fps = 25) {
  const tu = Math.min(...clips.map((c) => c.seqTu))
  const den = Math.max(...clips.map((c) => c.seqDen))
  return { seqId: 'thu', seqName: 'thu', fps, cheDo: 'io', vungTu: tu, vungDen: den, clips, soTat: 0, chongLan: 0 }
}
/** Vung dong nhat: MOT clip phu ca file, seq = src. */
function vungMot(ban) {
  const t = tongGiay(ban)
  return vung([clip(ban.path, { seqTu: 0, seqDen: t, srcTu: 0, srcDen: t })])
}

/**
 * Thong ke khoi theo HAI thuoc:
 *  - `tu`  : moc = gio bat dau TU dau khoi (dung cach v0 do 18/09 -> doi chieu so cu)
 *  - `cat` : moc = Khoi.tu/den (moc CAT that: dau cau Whisper neu khoi bat dau o dau cau)
 * Khoi 'mo-dau' tach rieng (v0 bao "N khoi + mo dau").
 */
function thongKe(nd, chia, tc) {
  const K = hd.lamKhoi(nd, chia, tc)
  const tEnd = Math.max(...nd.cau.map((c) => c.den))
  const moDau = K.find((k) => k.co.includes('mo-dau'))
  const hoi = K.filter((k) => !k.co.includes('mo-dau'))
  const daiTu = hoi.map((k) => {
    const i = K.indexOf(k)
    const den = i + 1 < K.length ? nd.tu[K[i + 1].dau].tu : tEnd
    return den - nd.tu[k.dau].tu
  })
  const daiCat = hoi.map((k) => k.den - k.tu)
  const moDauTu = moDau ? (K.length > 1 ? nd.tu[K[1].dau].tu : tEnd) : 0
  return {
    K,
    so: hoi.length,
    tu: { min: Math.min(...daiTu), tv: trungVi(daiTu), max: Math.max(...daiTu), duoi10: daiTu.filter((x) => x < 10).length, tren180: daiTu.filter((x) => x > 180).length },
    cat: { min: Math.min(...daiCat), tv: trungVi(daiCat), max: Math.max(...daiCat), duoi10: daiCat.filter((x) => x < 10).length, tren180: daiCat.filter((x) => x > 180).length },
    moDauTu,
    moDauCat: moDau ? moDau.den - moDau.tu : 0,
    daiTu,
    daiCat,
  }
}
const inTk = (t) => `${t.so} khoi · min ${f1(t.min)} · trung vi ${f1(t.tv)} · max ${f1(t.max)} · <10s ${t.duoi10} · >180s ${t.tren180}`
const demCo = (K, co) => K.filter((k) => k.co.includes(co)).length

function coFile(f) {
  try {
    return fs.statSync(f).isFile()
  } catch {
    return false
  }
}

// ═══════════════════════ (1) HOI QUY tren dem that ═══════════════════════
console.log('\n=== (1) HOI QUY v0 tren dem that — vung 1 clip phu ca file ===')
const V0 = { keoGach: false } // dung y thuat toan da do 18/09
const nap = {}
for (const [ten, f] of Object.entries(E)) {
  const ban = docDem(f)
  const nd = moc.dungNoiDung(vungMot(ban), [ban])
  nap[ten] = { ban, nd }
}

{
  const { nd } = nap.Machine
  const chia = hd.timKhoi(nd, V0)
  const t = thongKe(nd, chia, V0)
  const cd = hd.chanDoanKhoi(nd, V0)
  console.log(`  Machine v0 (thuoc tu): ${inTk({ so: t.so, ...t.tu })} · mo dau ${f1(t.moDauTu)}s`)
  console.log(`  Machine chan doan: ${JSON.stringify(cd)}`)
  kiem('Machine: 19 khoi', t.so === 19, t.so)
  kiem('Machine: khoi ngan nhat 15,4 s', r1(t.tu.min) === 15.4, f1(t.tu.min))
  kiem('Machine: trung vi 77,2 s', r1(t.tu.tv) === 77.2, f1(t.tu.tv))
  kiem('Machine: dai nhat 759,5 s', r1(t.tu.max) === 759.5, f1(t.tu.max))
  kiem('Machine: 0 khoi < 10 s', t.tu.duoi10 === 0, t.tu.duoi10)
  kiem('Machine: mo dau 125,3 s', r1(t.moDauTu) === 125.3, f1(t.moDauTu))
  kiem('Machine: 28 dau "?" · loai ngan 2 · duoi 3 · trich 1', cd.hoi === 28 && cd.ngan === 2 && cd.duoi === 3 && cd.trich === 1, JSON.stringify(cd))
  kiem('Machine: 3 nhom hoi don (>1 cau)', cd.nhomNhieuHoi === 3, cd.nhomNhieuHoi)
  kiem('Machine: 5 khoi > 180 s', t.tu.tren180 === 5, t.tu.tren180)
  kiem('Machine: 2 cau hoi cham tran 30 tu', hd.timCauHoi(nd, V0).filter((q) => q.tran).length === 2, hd.timCauHoi(nd, V0).filter((q) => q.tran).length)
}
{
  const { nd } = nap.Gnostic
  const chia = hd.timKhoi(nd, V0)
  const t = thongKe(nd, chia, V0)
  const cd = hd.chanDoanKhoi(nd, V0)
  console.log(`  Gnostic v0 (thuoc tu): ${inTk({ so: t.so, ...t.tu })} · mo dau ${f1(t.moDauTu)}s · ${JSON.stringify(cd)}`)
  kiem('Gnostic: 14 khoi', t.so === 14, t.so)
  kiem('Gnostic: min / trung vi / max = 13,1 / 150,3 / 394,5 s', r1(t.tu.min) === 13.1 && r1(t.tu.tv) === 150.3 && r1(t.tu.max) === 394.5, `${f1(t.tu.min)}/${f1(t.tu.tv)}/${f1(t.tu.max)}`)
  kiem('Gnostic: 21 dau "?" · trich 2 · 5 nhom hoi don', cd.hoi === 21 && cd.trich === 2 && cd.nhomNhieuHoi === 5, JSON.stringify(cd))
}
{
  const { nd } = nap.Heygen
  const chia = hd.timKhoi(nd, V0)
  const t = thongKe(nd, chia, V0)
  console.log(`  Heygen v0 (thuoc tu): ${inTk({ so: t.so, ...t.tu })} · mo dau ${f1(t.moDauTu)}s`)
  kiem('Heygen: 1 khoi 71,5 s + mo dau 9,8 s', t.so === 1 && r1(t.tu.max) === 71.5 && r1(t.moDauTu) === 9.8, `${t.so} khoi ${f1(t.tu.max)}s, mo dau ${f1(t.moDauTu)}s`)
  kiem('Heygen: khoi 0 co co "mo-dau", tieu de "Mở đầu"', t.K[0].co.includes('mo-dau') && t.K[0].tieuDe === 'Mở đầu', JSON.stringify(t.K[0].co))
}
{
  // Conspiracy: dem v1 (-l vi) tren video TIENG ANH = noi dung rac (93/363 cau Viet bia).
  // 18/09 do khi CHUA loc cau bia: 3 khoi 51,0 / 71,8 / 410,0 s, mo dau 1.042,5 s.
  const { nd } = nap.Conspiracy
  const t = thongKe(nd, hd.timKhoi(nd, V0), V0)
  const cd = hd.chanDoanKhoi(nd, V0)
  console.log(`  [THONG TIN] Conspiracy (dem v1 tren video tieng Anh): ${inTk({ so: t.so, ...t.tu })} · mo dau ${f1(t.moDauTu)}s · cau bia ${nd.cau.filter((c) => c.bia).length}/${nd.cau.length} · ${JSON.stringify(cd)}`)
  console.log(`  [THONG TIN] Conspiracy ${t.so === 3 && r1(t.moDauTu) === 1042.5 ? 'KHOP' : 'LECH'} so 18/09 (3 khoi, mo dau 1042,5 s)`)
}

console.log('\n  -- Ban GIAO (keoGach bat) so voi v0: so khoi phai y het, moc chi xe dich trong khoang dau "-"')
for (const ten of ['Machine', 'Gnostic', 'Heygen']) {
  const { nd } = nap[ten]
  const a = thongKe(nd, hd.timKhoi(nd, V0), V0)
  const b = thongKe(nd, hd.timKhoi(nd))
  let lechMax = 0
  const n = Math.min(a.daiCat.length, b.daiCat.length)
  for (let i = 0; i < n; i++) lechMax = Math.max(lechMax, Math.abs(a.daiCat[i] - b.daiCat[i]))
  console.log(`  ${ten}: v0 thuoc CAT ${inTk({ so: a.so, ...a.cat })} | giao thuoc CAT ${inTk({ so: b.so, ...b.cat })} · mo dau ${f1(b.moDauCat)}s · lech do dai lon nhat ${lechMax.toFixed(2)}s`)
  console.log(`     ranh-gioi-can-nghe: v0 ${demCo(a.K, 'ranh-gioi-can-nghe')} -> giao ${demCo(b.K, 'ranh-gioi-can-nghe')} · khong-ro-dau-cau ${demCo(b.K, 'khong-ro-dau-cau')} · dai ${demCo(b.K, 'dai')} · sua-tay ${demCo(b.K, 'sua-tay')}`)
  kiem(`${ten}: keoGach KHONG doi so khoi (${a.so} = ${b.so})`, a.so === b.so)
  kiem(`${ten}: khoi ban giao khong co co "sua-tay"`, demCo(b.K, 'sua-tay') === 0)
  kiem(`${ten}: cac khoi noi lien nhau (den khoi k = tu khoi k+1)`, b.K.every((k, i) => i === 0 || Math.abs(b.K[i - 1].den - k.tu) < 1e-9))
  kiem(`${ten}: moi khoi hoi (tru mo dau) co cauHoi chua "?"`, b.K.filter((k) => !k.co.includes('mo-dau')).every((k) => k.cauHoi.includes('?')))
}
{
  const { nd } = nap.Machine
  const K = hd.lamKhoi(nd, hd.timKhoi(nd))
  console.log('\n  Machine — 10 khoi dau ban giao (HOI -> TRA LOI DAU), doc bang mat:')
  K.slice(0, 11).forEach((k, i) => console.log(`   #${i} ${hd.mocHienThi(k.tu)}-${hd.mocHienThi(k.den)} (${f1(k.den - k.tu)}s) [${k.co.join(',')}]\n       HOI: ${k.tieuDe.slice(0, 150)}\n       TL : ${k.traLoiDau.slice(0, 150)}`))
}

// ═══════════════════════ (2) QUY MO THAT ═══════════════════════
console.log('\n=== (2) QUY MO THAT — dem tieng Viet tren G: (luat 2b) ===')
let banLon = null
for (const [ten, f] of Object.entries(G)) {
  if (!coFile(f)) {
    console.log(`  [SKIP] ${ten}: khong co ${f}`)
    continue
  }
  const ban = docDem(f)
  const vg = vungMot(ban)
  let t0 = performance.now()
  const nd = moc.dungNoiDung(vg, [ban])
  const tDung = ms(t0)
  t0 = performance.now()
  const chia = hd.timKhoi(nd)
  const tTim = ms(t0)
  t0 = performance.now()
  const K = hd.lamKhoi(nd, chia)
  const tLam1 = ms(t0)
  t0 = performance.now()
  for (let i = 0; i < 20; i++) hd.lamKhoi(nd, hd.tachTai(chia, 1000 + i))
  const tLam = ms(t0) / 20
  const t = thongKe(nd, chia)
  const cd = hd.chanDoanKhoi(nd)
  console.log(`  ${ten} (${nd.ngonNgu}, ${ban.nguon}, ${hd.mocHienThi(tongGiay(ban))}): ${nd.cau.length} cau · ${nd.tu.length} tu · bia ${nd.cau.filter((c) => c.bia).length} · tin cay thap ${nd.cau.filter((c) => c.tinCayThap).length}`)
  console.log(`     khoi: ${inTk({ so: t.so, ...t.cat })} · mo dau ${f1(t.moDauCat)}s · co: ranh-gioi-can-nghe ${demCo(K, 'ranh-gioi-can-nghe')}, khong-ro-dau-cau ${demCo(K, 'khong-ro-dau-cau')}, dai ${demCo(K, 'dai')}`)
  console.log(`     "?": ${cd.hoi} · ngan ${cd.ngan} · duoi ${cd.duoi} · trich ${cd.trich} · trong cau bia ${cd.bia} · nhom ${cd.nhom} (don ${cd.nhomNhieuHoi}) · gop <10s ${cd.gopNgan}`)
  console.log(`     thoi gian: dungNoiDung ${tDung.toFixed(1)} ms · timKhoi ${tTim.toFixed(1)} ms · lamKhoi lan dau ${tLam1.toFixed(1)} ms · lamKhoi sau 1 cu tach (tb 20 lan) ${tLam.toFixed(2)} ms`)
  kiem(`${ten}: moi khoi noi lien, khong khoi rong`, K.every((k, i) => k.cuoi > k.dau && (i === 0 || Math.abs(K[i - 1].den - k.tu) < 1e-9)))
  // 50 ms = mot khung hinh o 20 hinh/giay: sua tay ma cham hon muc nay la thay "i"
  kiem(`${ten}: lamKhoi sau 1 cu sua < 50 ms (${tLam.toFixed(2)} ms)`, tLam < 50)
  if (ten === 'C4091') banLon = ban
  if (ten === 'C4085') {
    console.log('\n     C4085 — 12 khoi dau (HOI -> TRA LOI DAU), doc bang mat:')
    K.slice(0, 12).forEach((k, i) => console.log(`      #${i} ${hd.mocHienThi(k.tu)}-${hd.mocHienThi(k.den)} (${f1(k.den - k.tu)}s) [${k.co.join(',')}]\n          HOI: ${k.tieuDe.slice(0, 140)}\n          TL : ${k.traLoiDau.slice(0, 140)}`))
  }
}
{
  // Nhan 10 lan: 10 clip noi nhau cung mot file dai nhat co san (~10 gio).
  const ban = banLon || nap.Machine.ban
  const T = tongGiay(ban)
  const clips = Array.from({ length: 10 }, (_, i) => clip(ban.path, { clipOrd: i, seqTu: i * T, seqDen: (i + 1) * T, srcTu: 0, srcDen: T }))
  const vg = vung(clips)
  let t0 = performance.now()
  const nd = moc.dungNoiDung(vg, [ban])
  const tDung = ms(t0)
  t0 = performance.now()
  const chia = hd.timKhoi(nd)
  const tTim = ms(t0)
  t0 = performance.now()
  const K = hd.lamKhoi(nd, chia)
  const tLam = ms(t0)
  t0 = performance.now()
  const K2 = hd.lamKhoi(nd, hd.tachTai(chia, 5000))
  const tLam2 = ms(t0)
  t0 = performance.now()
  const tim = hd.timChu(nd, 'khong')
  const tTimChu = ms(t0)
  const nd1 = moc.dungNoiDung(vungMot(ban), [ban])
  const k1 = hd.lamKhoi(nd1, hd.timKhoi(nd1)).length
  console.log(`  NHAN 10 LAN (${path.basename(ban.path)} x10 = ${hd.mocHienThi(10 * T)}): ${nd.cau.length} cau · ${nd.tu.length} tu · ${K.length} khoi (1 lan: ${k1})`)
  console.log(`     thoi gian: dungNoiDung ${tDung.toFixed(1)} ms · timKhoi ${tTim.toFixed(1)} ms · lamKhoi ${tLam.toFixed(1)} ms · lamKhoi sau tach ${tLam2.toFixed(1)} ms · timChu ${tTimChu.toFixed(1)} ms (${tim.length} cau)`)
  kiem('Nhan 10: so tu = 10 x ban goc', nd.tu.length === 10 * nd1.tu.length, `${nd.tu.length} vs ${10 * nd1.tu.length}`)
  kiem('Nhan 10: so khoi xap xi 10 x (+-10, noi 2 clip co the gop/tach khoi mep)', Math.abs(K.length - 10 * k1) <= 10, `${K.length} vs ${10 * k1}`)
  kiem('Nhan 10: tu sap tang dan theo seq', nd.tu.every((w, i) => i === 0 || w.tu >= nd.tu[i - 1].tu - 1e-9))
  kiem(`Nhan 10: lamKhoi sau 1 cu sua < 50 ms (${tLam2.toFixed(1)} ms)`, tLam2 < 50)
  void K2
}

// ═══════════════════════ (3) QUY DOI MOC — sequence nhieu clip GIA ═══════════════════════
console.log('\n=== (3) QUY DOI MOC tren sequence nhieu clip GIA ===')
{
  const ban = nap.Heygen.ban
  const P = ban.path
  const T = tongGiay(ban)
  // 3 clip cat tu 1 file, co khe ho. Clip 2 bat dau o 38,53 s (so le, khong tron khung).
  const doanClip = [
    { srcTu: 0, srcDen: 20, seqTu: 0 },
    { srcTu: 35, srcDen: 60, seqTu: 38.53 },
    { srcTu: 70, srcDen: T, seqTu: 70 },
  ]
  const clipsV = doanClip.map((d, i) => clip(P, { kind: 'V', trackIdx: 0, clipOrd: i, srcTu: d.srcTu, srcDen: d.srcDen, seqTu: d.seqTu, seqDen: d.seqTu + (d.srcDen - d.srcTu) }))
  // Clip A lien ket (cung file, cung do lech) — la cung loi noi, KHONG duoc tinh la chong.
  const clipsA = clipsV.map((c) => ({ ...c, kind: 'A' }))
  const vg = vung([...clipsV, ...clipsA])
  const nd = moc.dungNoiDung(vg, [ban])

  // Ky vong tinh DOC LAP tu file tho: tu o src trong clip nao thi seq = src + lech cua clip do.
  const tho = ban.ket.tu
  const kyVong = []
  let bo = 0
  for (const w of tho) {
    const d = doanClip.find((x) => w.giay >= x.srcTu && w.giay < x.srcDen)
    if (!d) {
      bo++
      continue
    }
    kyVong.push({ chu: w.chu, seq: d.seqTu + (w.giay - d.srcTu), src: w.giay })
  }
  kyVong.sort((a, b) => a.seq - b.seq)
  console.log(`  Heygen ${tho.length} tu · giu ${kyVong.length} · roi vao doan bo ${bo} · NoiDung: ${nd.cau.length} cau, ${nd.tu.length} tu, soClipBoQua ${nd.soClipBoQua}`)
  kiem('So tu giu = so tu co src nam trong 3 clip (tinh doc lap)', nd.tu.length === kyVong.length, `${nd.tu.length} vs ${kyVong.length}`)
  let sai = 0
  nd.tu.forEach((w, i) => {
    const k = kyVong[i]
    if (!k || k.chu !== w.chu || Math.abs(k.seq - w.tu) > 1e-9) sai++
  })
  kiem('Moc tung tu tren seq = seqTu + (src - srcTu) cua DUNG clip chua no', sai === 0, `${sai} tu sai`)
  kiem('Clip A lien ket khong bi dem la chong (soClipBoQua 0)', nd.soClipBoQua === 0, nd.soClipBoQua)
  kiem('Khong tu nao nam trong khe ho seq (20..38,53) va (63,53..70)', nd.tu.every((w) => !(w.tu >= 20 && w.tu < 38.53) && !(w.tu >= 63.53 && w.tu < 70)))
  kiem('Tu dau clip 2 nam tu 38,53 s tro di', nd.tu.filter((w) => w.tu >= 38.53 && w.tu < 63.53).every((w) => w.tu >= 38.53))
  kiem('Moc cuoi tu khong vuot mep clip chua no', nd.tu.every((w) => {
    const c = doanClip.find((d) => w.tu >= d.seqTu - 1e-9 && w.tu < d.seqTu + (d.srcDen - d.srcTu))
    return c && w.den <= c.seqTu + (c.srcDen - c.srcTu) + 1e-9 && w.den >= w.tu
  }))
  kiem('Cau sap tang theo seq, id = chi so', nd.cau.every((c, i) => c.id === i && (i === 0 || c.tu >= nd.cau[i - 1].tu)))
  kiem('tuDau/tuCuoi cua cau khop TuSeq.cau', nd.cau.every((c) => nd.tu.slice(c.tuDau, c.tuCuoi).every((w) => w.cau === c.id)) && nd.cau.reduce((s, c) => s + (c.tuCuoi - c.tuDau), 0) === nd.tu.length)
  // Cau cham mep clip 1 (src 20): phai bi cat THEO TU.
  const cauMep = ban.ket.cau.find((c) => c.tu < 20 && c.den > 20)
  if (cauMep) {
    const manh = nd.cau.find((c) => c.srcTu < 20 && c.srcTu >= cauMep.tu - 1 && c.den <= 20 + 1e-9 && c.tu < 20)
    const tokGoc = cauMep.chu.trim().split(/\s+/).length
    const tokManh = manh ? manh.chu.split(' ').length : -1
    console.log(`  Cau cham mep 20 s: goc "${cauMep.chu.trim().slice(0, 80)}" (${tokGoc} tu) -> manh "${manh ? manh.chu.slice(0, 80) : '-'}" (${tokManh} tu, den ${manh ? manh.den.toFixed(2) : '-'})`)
    kiem('Cau cham mep bi cat theo tu (it tu hon, ket thuc <= 20 s)', manh && tokManh < tokGoc && manh.den <= 20 + 1e-9)
  } else console.log('  [THONG TIN] Heygen khong co cau cat ngang 20 s')

  // doanNguon nguoc lai: moi tu -> doan goc chua MOC DAU cua no phai tra dung src.
  // ☠️ 19/09 thuoc cu hoi [w.tu, w.den) va bao "17 tu sai": ca 17 la tu DO DAI 0 —
  // Whisper cho 2 tu lien nhau CUNG moc dau (Heygen goc 24 cap), nen moc cuoi tu
  // (= moc dau tu ke) trung moc dau. Khoang rong tra [] la DUNG; thuoc sai, sua thuoc:
  // hoi mot doan 1 ms bat dau tai moc dau tu.
  let saiNguoc = 0
  let soDoan = 0
  const tuRong = nd.tu.filter((w) => w.den - w.tu <= 1e-6).length
  nd.tu.forEach((w, i) => {
    const ds = moc.doanNguon(vg, w.tu, w.tu + 1e-3)
    soDoan += ds.length
    if (!ds.length || ds.some((d) => Math.abs(d.srcTu - kyVong[i].src) > 1e-6)) saiNguoc++
  })
  console.log(`  Tu do dai 0 (Whisper cho 2 tu cung moc dau): ${tuRong}/${nd.tu.length} — doanNguon(tu, den) cua chung = [] la dung`)
  kiem('doanNguon tren khoang rong -> []', nd.tu.filter((w) => w.den - w.tu <= 1e-6).every((w) => moc.doanNguon(vg, w.tu, w.den).length === 0))
  kiem('doanNguon tai moc dau moi tu tra dung src goc cua tu do', saiNguoc === 0, `${saiNguoc} tu sai`)
  kiem('doanNguon ra 2 doan / tu (V + A lien ket — ham TRA NGUOC, khong dua host dung)', soDoan === 2 * nd.tu.length, `${soDoan} vs ${2 * nd.tu.length}`)
  const qua = moc.doanNguon(vg, 15, 45)
  console.log(`  doanNguon(15, 45): ${qua.map((d) => `${d.kind}${d.trackIdx}#${d.clipOrd} seq ${d.seqTu.toFixed(2)}-${d.seqDen.toFixed(2)} src ${d.srcTu.toFixed(2)}-${d.srcDen.toFixed(2)}`).join(' | ')}`)
  kiem('doanNguon(15,45) = clip1 [15,20) + clip2 [38,53,45), dung thu tu, V truoc A', qua.length === 4 &&
    qua[0].kind === 'V' && qua[0].clipOrd === 0 && Math.abs(qua[0].srcTu - 15) < 1e-9 && Math.abs(qua[0].srcDen - 20) < 1e-9 &&
    qua[1].kind === 'A' && qua[2].kind === 'V' && qua[2].clipOrd === 1 && Math.abs(qua[2].srcTu - 35) < 1e-9 && Math.abs(qua[2].srcDen - 41.47) < 1e-9)
  kiem('doanNguon trong khe ho (22..36) = rong', moc.doanNguon(vg, 22, 36).length === 0)

  // Chong lan 2 track: V2 file khac phu len [40,50] -> bi bo (lan A0 dai hon).
  const vChong = vung([...clipsV, ...clipsA, clip('E:/khac/broll.mp4', { kind: 'V', trackIdx: 1, seqTu: 40, seqDen: 50, srcTu: 0, srcDen: 10 })])
  const c1 = moc.chonClipNghe(vChong)
  kiem('B-roll V2 chong len -> boQuaChong 1, giu 3 clip A', c1.boQuaChong === 1 && c1.boQuaToc === 0 && c1.boQua === 1 && c1.clips.length === 3 && c1.clips.every((c) => c.kind === 'A'), JSON.stringify({ ...c1, clips: c1.clips.length }))
  // B-roll QUAY CHAM bi phu: dem vao chong, KHONG dem vao toc (khong duoc lam ca vung bi tu choi oan).
  // (19/09 sau soat: fixture doi tu "chi clipsA" sang clipsV + clipsA — host nay gui CA hinh lan
  // tieng, nen loi phong van tren timeline that luon co cap V+A. Ca "chi tieng + 1 clip hinh"
  // la gioi han da biet, co phep kiem rieng o muc (3b).)
  const vChongCham = vung([...clipsV, ...clipsA, clip('E:/khac/broll.mp4', { kind: 'V', trackIdx: 1, seqTu: 40, seqDen: 50, srcTu: 0, srcDen: 5, speed: 0.5 })])
  const c1b = moc.chonClipNghe(vChongCham)
  kiem('B-roll quay cham bi phu -> dem chong, khong dem toc', c1b.boQuaChong === 1 && c1b.boQuaToc === 0, JSON.stringify({ ...c1b, clips: c1b.clips.length }))
  // Clip doi toc dung rieng -> boQuaToc.
  const vToc = vung([...clipsA, clip('E:/khac/nhanh.mp4', { trackIdx: 0, clipOrd: 9, seqTu: 90, seqDen: 100, srcTu: 0, srcDen: 15, speed: 1.5 })])
  const c2 = moc.chonClipNghe(vToc)
  const nd2 = moc.dungNoiDung(vToc, [ban])
  kiem('Clip speed 1,5 -> boQuaToc 1, NoiDung.soClipBoQua 1', c2.boQuaToc === 1 && c2.boQua === 1 && nd2.soClipBoQua === 1, JSON.stringify({ ...c2, clips: c2.clips.length }))
  kiem('Clip speed 1,005 (lech <= 0,01) van quy doi', moc.chonClipNghe(vung([clip(P, { seqTu: 0, seqDen: 10, srcTu: 0, srcDen: 10.05, speed: 1.005 })])).boQuaToc === 0)
  // Multicam xep chong: A0 cam1 60 s, A1 cam2 70 s -> giu cam2.
  const vMc = vung([clip('E:/cam1.mp4', { trackIdx: 0, seqTu: 0, seqDen: 60, srcTu: 0, srcDen: 60 }), clip('E:/cam2.mp4', { trackIdx: 1, seqTu: 0, seqDen: 70, srcTu: 7, srcDen: 77 })])
  const c3 = moc.chonClipNghe(vMc)
  kiem('Multicam: giu track tong dai hon (cam2 70 s), bo 1', c3.clips.length === 1 && c3.clips[0].path === 'E:/cam2.mp4' && c3.boQuaChong === 1)
  const vHoa = vung([clip('E:/cam1.mp4', { trackIdx: 1, seqTu: 0, seqDen: 60, srcTu: 0, srcDen: 60 }), clip('E:/cam2.mp4', { trackIdx: 0, seqTu: 0, seqDen: 60, srcTu: 0, srcDen: 60 })])
  kiem('Multicam hoa: track thap (A0) thang', moc.chonClipNghe(vHoa).clips[0].path === 'E:/cam2.mp4')
  // Hai clip cham mep (khong chong) tren 2 track -> khong bo gi.
  const vCham = vung([clip('E:/a.mp4', { trackIdx: 0, seqTu: 0, seqDen: 10, srcTu: 0, srcDen: 10 }), clip('E:/b.mp4', { trackIdx: 1, seqTu: 10, seqDen: 20, srcTu: 0, srcDen: 10 })])
  kiem('Hai clip cham mep tren 2 track -> khong bo', moc.chonClipNghe(vCham).boQua === 0)
  // Duong dan khac hoa thuong / dau \ van khop ban nghe.
  const tenHoa = P.toUpperCase().split('/').join(String.fromCharCode(92))
  const nd3 = moc.dungNoiDung(vung([clip(tenHoa, { seqTu: 0, seqDen: T, srcTu: 0, srcDen: T })]), [ban])
  kiem('Duong dan HOA + dau \\ van khop ban nghe', nd3.tu.length === tho.length, nd3.tu.length)
  // Ban nghe lech so tu -> nem loi ro rang.
  const banHong = { ...ban, ket: { ...ban.ket, tu: ban.ket.tu.slice(1) } }
  let loi = null
  try {
    moc.dungNoiDung(vungMot(ban), [banHong])
  } catch (e) {
    loi = e
  }
  console.log(`  Loi khi lech so tu: ${loi && loi.message}`)
  kiem('Ban nghe lech so tu -> nem LoiNoiDung co khoa dich + so', loi instanceof moc.LoiNoiDung && loi.khoa === moc.LOI_LECH_TU && loi.thay.a === tho.length && loi.thay.b === tho.length - 1)
  // Clip khong co ban nghe -> khong co chu, khong loi.
  const nd4 = moc.dungNoiDung(vung([clip('E:/chua-nghe.mp4', { seqTu: 0, seqDen: 10, srcTu: 0, srcDen: 10 })]), [ban])
  kiem('Clip chua co ban nghe -> NoiDung rong, khong loi', nd4.cau.length === 0 && nd4.tu.length === 0)

  // ── doanDung: danh sach doan dua HOST dung sequence moi (them luc ghep 19/09) ──
  // ☠️ Host (sv__dung) dat cac doan NOI TIEP nhau tren MOT track, khong xep lop.
  // Ban ghep dau dua doanNguon (moi lan) cho host -> B-roll bi NOI VAO SAU loi noi,
  // va phep kiem do dai cua host van DAT vi mongMuon cong ca hai. Thuoc o day:
  // tong do dai cac doan phai = do dai khoi (tru khe that), mot loai, khong chong.
  const tongDoan = (ds) => ds.reduce((s, d) => s + (d.srcDen - d.srcTu), 0)
  const khongChong = (ds) => ds.every((d, i) => i === 0 || d.seqTu >= ds[i - 1].seqDen - 1e-9)
  const motLoai = (ds) => ds.every((d) => d.kind === ds[0].kind)
  // (a) Du lieu kieu host DOI DAU (chi gui clip V khi vung co hinh) — V0 A-roll + B-roll V1 phu [40,50].
  const vHostThat = vung([...clipsV, clip('E:/khac/broll.mp4', { kind: 'V', trackIdx: 1, seqTu: 40, seqDen: 50, srcTu: 0, srcDen: 10 })])
  const dd1 = moc.doanDung(vHostThat, 38.53, 55)
  const cu1 = moc.doanNguon(vHostThat, 38.53, 55)
  console.log(`  Khoi [38,53..55) co B-roll phu: doanNguon ${cu1.length} doan, tong ${tongDoan(cu1).toFixed(2)} s (host se noi duoi) · doanDung ${dd1.length} doan, tong ${tongDoan(dd1).toFixed(2)} s`)
  kiem('Doi chung: doanNguon dua ca B-roll (2 doan, tong 26,47 s > khoi 16,47 s) — thuoc biet do', cu1.length === 2 && Math.abs(tongDoan(cu1) - 26.47) < 1e-6)
  kiem('doanDung khoi co B-roll phu: 1 doan lan V0, KHONG co broll, tong = khoi 16,47 s', dd1.length === 1 && dd1[0].path === P && dd1[0].trackIdx === 0 && dd1[0].clipOrd === 1 && Math.abs(tongDoan(dd1) - 16.47) < 1e-6, JSON.stringify(dd1))
  // (b) Du lieu co CA V lan A lien ket (host tu 19/09 gui dung kieu nay): chi V, khong lan loai.
  const dd2 = moc.doanDung(vg, 15, 45)
  console.log(`  doanDung(15, 45) tren V+A lien ket: ${dd2.map((d) => `${d.kind}${d.trackIdx}#${d.clipOrd} src ${d.srcTu.toFixed(2)}-${d.srcDen.toFixed(2)}`).join(' | ')}`)
  kiem('doanDung V+A lien ket -> chi V (host tu choi lan V/A), clip1 [15,20) + clip2 src [35,41,47)', dd2.length === 2 && dd2.every((d) => d.kind === 'V') &&
    dd2[0].clipOrd === 0 && Math.abs(dd2[0].srcTu - 15) < 1e-9 && Math.abs(dd2[0].srcDen - 20) < 1e-9 &&
    dd2[1].clipOrd === 1 && Math.abs(dd2[1].srcTu - 35) < 1e-9 && Math.abs(dd2[1].srcDen - 41.47) < 1e-9)
  // (c) Multicam xep chong (chi tieng): dung dung lan da nghe (cam2), 1 doan.
  const dd3 = moc.doanDung(vMc, 0, 60)
  kiem('doanDung multicam -> chi cam2 (lan da nghe), 1 doan 60 s', dd3.length === 1 && dd3[0].path === 'E:/cam2.mp4' && Math.abs(tongDoan(dd3) - 60) < 1e-9, JSON.stringify(dd3))
  // (d) Tinh chat tren nhieu cua so truot, vung co V + A + B-roll.
  let saiTC = 0
  for (let a = 0; a < T; a += 3.7) {
    const ds = moc.doanDung(vChong, a, a + 11.3)
    if (!khongChong(ds) || !motLoai(ds) || ds.some((d) => d.path.indexOf('broll') >= 0)) saiTC++
  }
  kiem('doanDung moi cua so: khong chong, mot loai, khong B-roll', saiTC === 0, `${saiTC} cua so sai`)
  // (e) Du lieu THAT: moi khoi Machine tren vung 1 clip -> dung 1 doan, dai = khoi.
  {
    const Km = hd.lamKhoi(nap.Machine.nd, hd.timKhoi(nap.Machine.nd))
    const vm = vungMot(nap.Machine.ban)
    const lech = Km.filter((k) => {
      const ds = moc.doanDung(vm, k.tu, k.den)
      return ds.length !== 1 || Math.abs(tongDoan(ds) - (k.den - k.tu)) > 1e-6
    }).length
    kiem(`doanDung ${Km.length} khoi Machine that: moi khoi 1 doan, tong = do dai khoi`, lech === 0, `${lech} khoi lech`)
  }
  kiem('Dem v1 -> coDemV1 true, ngonNgu "vi"', nd.coDemV1 === true && nd.ngonNgu === 'vi', `${nd.coDemV1} ${nd.ngonNgu}`)
  kiem('Dem v2 tieng Anh -> ngonNgu "en", coDemV1 false', nap.Machine.nd.ngonNgu === 'en' && nap.Machine.nd.coDemV1 === false)
}

// ═══════════════════════ (3b) HOST GUI CA HINH LAN TIENG (soat 19/09) ═══════════════════════
// Loi chan cua dot soat: host doi dau co clip HINH thi KHONG gui clip TIENG -> panel nghe
// tieng cua file gan voi clip hinh, khong nghe thu nguoi xem nghe. Moi ca duoi day co DOI
// CHUNG (du lieu kieu host doi dau, hoac hinh hoc y het ma doi duoi file) de thuoc khong mu.
console.log('\n=== (3b) HOST GUI CA HINH LAN TIENG — cat chen, L/J-cut, logo, nhac, mic, tach tieng, vung io ===')
{
  const ban = nap.Heygen.ban
  const P = ban.path
  const T = tongGiay(ban)
  const tho = ban.ket.tu
  const tongDoan = (ds) => ds.reduce((s, d) => s + (d.srcDen - d.srcTu), 0)
  const khongChong = (ds) => ds.every((d, i) => i === 0 || d.seqTu >= ds[i - 1].seqDen - 1e-9)
  const motLoai = (ds) => ds.every((d) => d.kind === ds[0].kind)
  const demSrc = (a, b) => tho.filter((w) => w.giay >= a && w.giay < b).length
  const ten = (p) => p.split('/').pop()
  const inDs = (ds) => ds.map((d) => `${d.kind}${d.trackIdx}#${d.clipOrd} ${ten(d.path)} src ${d.srcTu.toFixed(2)}-${d.srcDen.toFixed(2)}`).join(' | ')
  const BR = 'E:/khac/broll-cat-chen.mp4'
  const X = 'E:/khac/canh-sau.mp4'

  // (1) CAT CHEN: B-roll ngay tren V1 [30,40), loi phong van o A1 chay LIEN ben duoi.
  const V1 = [
    clip(P, { kind: 'V', clipOrd: 0, seqTu: 0, seqDen: 30, srcTu: 0, srcDen: 30 }),
    clip(BR, { kind: 'V', clipOrd: 1, seqTu: 30, seqDen: 40, srcTu: 5, srcDen: 15 }),
    clip(P, { kind: 'V', clipOrd: 2, seqTu: 40, seqDen: T, srcTu: 40, srcDen: T }),
  ]
  const A1 = [clip(P, { kind: 'A', clipOrd: 0, seqTu: 0, seqDen: T, srcTu: 0, srcDen: T })]
  const vCat = vung([...V1, ...A1])
  const ndDu = moc.dungNoiDung(vCat, [ban])
  const ndCu = moc.dungNoiDung(vung(V1), [ban])
  const mat = demSrc(30, 40)
  console.log(`  Cat chen: nguoi xem nghe ${tho.length} tu · duoi B-roll ${mat} tu · host gui ca tieng: doc ${ndDu.tu.length} · chi hinh (doi chung): doc ${ndCu.tu.length}`)
  kiem('Doi chung: du lieu chi hinh (host doi dau) MAT dung so tu duoi B-roll — thuoc biet do', mat > 0 && ndCu.tu.length === tho.length - mat, `${ndCu.tu.length} vs ${tho.length - mat}`)
  kiem('Cat chen: host gui ca tieng -> doc DU moi tu nguoi xem nghe', ndDu.tu.length === tho.length, `${ndDu.tu.length} vs ${tho.length}`)
  kiem('Cat chen: B-roll nam tron duoi tieng phong van -> dem boQuaChong 1', ndDu.soClipBoQua === 1, ndDu.soClipBoQua)
  const ddDu = moc.doanDung(vCat, 20, 50)
  const ddCu = moc.doanDung(vung(V1), 20, 50)
  console.log(`  doanDung(20, 50): ca tieng -> ${inDs(ddDu)} · chi hinh -> ${inDs(ddCu)}`)
  kiem('Doi chung: chi hinh -> host dung CA doan B-roll giua cau tra loi', ddCu.some((d) => d.path === BR))
  kiem('Cat chen: doanDung = 1 doan HINH phong van src 20-50, khong B-roll', ddDu.length === 1 && ddDu[0].kind === 'V' && ddDu[0].path === P && [0, 2].includes(ddDu[0].clipOrd) && Math.abs(ddDu[0].srcTu - 20) < 1e-9 && Math.abs(ddDu[0].srcDen - 50) < 1e-9, JSON.stringify(ddDu))
  if (coFile(G.C4091)) {
    // Dung ca nguoi soat do tren dem that (bao cao: nguoi xem nghe 726, host doi dau doc 683, mat 43).
    const bc = docDem(G.C4091)
    const Pc = bc.path
    const Vc = [
      clip(Pc, { kind: 'V', clipOrd: 0, seqTu: 0, seqDen: 120, srcTu: 600, srcDen: 720 }),
      clip(BR, { kind: 'V', clipOrd: 1, seqTu: 120, seqDen: 132, srcTu: 5, srcDen: 17 }),
      clip(Pc, { kind: 'V', clipOrd: 2, seqTu: 132, seqDen: 240, srcTu: 732, srcDen: 840 }),
    ]
    const Ac = [clip(Pc, { kind: 'A', clipOrd: 0, seqTu: 0, seqDen: 240, srcTu: 600, srcDen: 840 })]
    const nghe = bc.ket.tu.filter((w) => w.giay >= 600 && w.giay < 840).length
    const a = moc.dungNoiDung(vung([...Vc, ...Ac]), [bc]).tu.length
    const b = moc.dungNoiDung(vung(Vc), [bc]).tu.length
    console.log(`  C4091 that: nguoi xem nghe ${nghe} · host gui ca tieng doc ${a} · chi hinh doc ${b} (mat ${nghe - b})`)
    kiem('C4091 that: gui ca tieng -> doc du so tu nguoi xem nghe; doi chung chi hinh mat > 0', a === nghe && b < nghe, `${a}/${b}/${nghe}`)
  } else console.log('  [THONG TIN] khong thay dem C4091 tren G: — bo qua ca that')

  // (2) L-CUT: tieng file phong van keo dai hon hinh 5 s (tieng [0,35), hinh [0,30)).
  const Vl = [
    clip(P, { kind: 'V', clipOrd: 0, seqTu: 0, seqDen: 30, srcTu: 0, srcDen: 30 }),
    clip(X, { kind: 'V', clipOrd: 1, seqTu: 30, seqDen: 60, srcTu: 100, srcDen: 130 }),
  ]
  const Al = [
    clip(P, { kind: 'A', clipOrd: 0, seqTu: 0, seqDen: 35, srcTu: 0, srcDen: 35 }),
    clip(X, { kind: 'A', clipOrd: 1, seqTu: 35, seqDen: 60, srcTu: 105, srcDen: 130 }),
  ]
  const ndL = moc.dungNoiDung(vung([...Vl, ...Al]), [ban])
  const ndL0 = moc.dungNoiDung(vung(Vl), [ban])
  console.log(`  L-cut: tu src [0,35) = ${demSrc(0, 35)} · [0,30) = ${demSrc(0, 30)} · ca tieng doc ${ndL.tu.length} · chi hinh doc ${ndL0.tu.length}`)
  kiem('L-cut: nghe theo TIENG — doc du tu src [0,35) (doi chung chi hinh: chi [0,30), khac nhau)', ndL.tu.length === demSrc(0, 35) && ndL0.tu.length === demSrc(0, 30) && demSrc(30, 35) > 0)
  const ddL = moc.doanDung(vung([...Vl, ...Al]), 0, 60)
  console.log(`  L-cut doanDung(0, 60): ${inDs(ddL)}`)
  kiem('L-cut: dung 2 doan HINH khong chong, P src 0-35 + canh sau src 105-130, tong 60 s', ddL.length === 2 && motLoai(ddL) && ddL[0].kind === 'V' && khongChong(ddL) && Math.abs(ddL[0].srcDen - 35) < 1e-9 && ddL[1].path === X && ddL[1].clipOrd === 1 && Math.abs(ddL[1].srcTu - 105) < 1e-9 && Math.abs(tongDoan(ddL) - 60) < 1e-9, JSON.stringify(ddL))

  // (3) J-CUT tieng canh sau lan 3 s vao canh truoc, nam o TRACK TIENG KHAC -> cat phan lan.
  const Vj = [
    clip(P, { kind: 'V', clipOrd: 0, seqTu: 0, seqDen: 30, srcTu: 0, srcDen: 30 }),
    clip(X, { kind: 'V', clipOrd: 1, seqTu: 30, seqDen: 60, srcTu: 100, srcDen: 130 }),
  ]
  const Aj = [
    clip(P, { kind: 'A', trackIdx: 0, clipOrd: 0, seqTu: 0, seqDen: 30, srcTu: 0, srcDen: 30 }),
    clip(X, { kind: 'A', trackIdx: 1, clipOrd: 0, seqTu: 27, seqDen: 60, srcTu: 97, srcDen: 130 }),
  ]
  const ddJ = moc.doanDung(vung([...Vj, ...Aj]), 0, 60)
  console.log(`  J-cut doanDung(0, 60): ${inDs(ddJ)}`)
  kiem('J-cut 2 track tieng: dung khong chong, tong 60 s (phan lan 3 s bi cat, khong lap)', ddJ.length === 2 && khongChong(ddJ) && motLoai(ddJ) && Math.abs(tongDoan(ddJ) - 60) < 1e-9 && Math.abs(ddJ[1].srcTu - 100) < 1e-9, JSON.stringify(ddJ))

  // (4) LOGO / ANH (nguoi soat do tren moc.js: A logo thang, B logo dai hon 1 khung thang, D nen hoa thang).
  const C = 'E:/pv/C4091.MP4'
  const pv = (o) => clip(C, { kind: 'V', ...o })
  const kiemAnh = (nhan, clips, duoi) => {
    const v = vung(clips.map((c) => (c.path.endsWith('.png') && duoi ? { ...c, path: c.path.replace('.png', duoi) } : c)))
    return moc.chonClipNghe(v)
  }
  const caA = [pv({ clipOrd: 0, seqTu: 0, seqDen: 1800, srcTu: 0, srcDen: 1800 }), pv({ clipOrd: 1, seqTu: 1800, seqDen: 3540, srcTu: 1810, srcDen: 3550 }), clip('E:/pv/logo.png', { kind: 'V', trackIdx: 2, seqTu: 0, seqDen: 3600, srcTu: 0, srcDen: 3600 })]
  const caB = [pv({ seqTu: 0, seqDen: 3540, srcTu: 0, srcDen: 3540 }), clip('E:/pv/logo.png', { kind: 'V', trackIdx: 2, seqTu: 0, seqDen: 3540.04, srcTu: 0, srcDen: 3540.04 })]
  const caD = [clip('E:/pv/nen.png', { kind: 'V', trackIdx: 0, seqTu: 0, seqDen: 3540, srcTu: 0, srcDen: 3540 }), pv({ trackIdx: 1, seqTu: 0, seqDen: 3540, srcTu: 0, srcDen: 3540 })]
  for (const [nhan, ca] of [['A logo phu ca bai (dai hon 60 s)', caA], ['B logo dai hon 1 khung', caB], ['D anh nen V1 = nguoi noi V2 (hoa)', caD]]) {
    const r = kiemAnh(nhan, ca)
    const r0 = kiemAnh(nhan, ca, '.mp4') // doi chung: CUNG hinh hoc, doi duoi thanh video -> luat thoi luong cu
    const giuPv = r.clips.length > 0 && r.clips.every((c) => c.path === C)
    kiem(`Anh ${nhan}: nghe phong van, anh dem boQuaChong 1 (doi chung .mp4: lop phu thang = ${!r0.clips.every((c) => c.path === C)})`, giuPv && r.boQuaChong === 1 && !r0.clips.every((c) => c.path === C), JSON.stringify({ giu: r.clips.map((c) => ten(c.path)), bo: r.boQuaChong }))
  }
  kiem('Anh A: doanDung(100,160) = 1 doan phong van, khong logo', (() => {
    const d = moc.doanDung(vung(caA), 100, 160)
    return d.length === 1 && d[0].path === C && Math.abs(tongDoan(d) - 60) < 1e-9
  })())
  // Podcast CHI TIENG + anh bia tinh: anh khong nghe duoc -> nghe tieng (host doi dau: nghe file anh, rong).
  const rBia = moc.chonClipNghe(vung([clip(P, { seqTu: 0, seqDen: T, srcTu: 0, srcDen: T }), clip('E:/pv/bia.jpg', { kind: 'V', seqTu: 0, seqDen: T, srcTu: 0, srcDen: T })]))
  kiem('Podcast chi tieng + anh bia .jpg: nghe tieng, anh dem boQuaChong 1', rBia.clips.length === 1 && rBia.clips[0].path === P && rBia.boQuaChong === 1, JSON.stringify({ giu: rBia.clips.map((c) => ten(c.path)), bo: rBia.boQuaChong }))

  // (5) NHAC NEN dai hon nguoi noi — chi-co-tieng KHONG duoc thang lan khi vung co hinh.
  const vNhac = vung([clip(P, { kind: 'V', seqTu: 0, seqDen: T, srcTu: 0, srcDen: T }), clip(P, { kind: 'A', seqTu: 0, seqDen: T, srcTu: 0, srcDen: T }), clip('E:/nhac/nen.mp3', { kind: 'A', trackIdx: 1, seqTu: 0, seqDen: T + 5, srcTu: 0, srcDen: T + 5 })])
  const rNhac = moc.chonClipNghe(vNhac)
  const rNhac0 = moc.chonClipNghe(vung(vNhac.clips.filter((c) => c.kind === 'A'))) // doi chung: bo hinh -> luat thoi luong -> nhac thang
  kiem(`Nhac nen dai hon: nghe phong van, nhac dem boQuaChong 1 (doi chung chi tieng: nhac thang = ${rNhac0.clips[0].path.endsWith('.mp3')})`, rNhac.clips.length === 1 && rNhac.clips[0].path === P && rNhac.boQuaChong === 1 && rNhac0.clips[0].path.endsWith('.mp3'))
  // Hai mic roi + tieng camera: nghe tieng camera (luat cu), 2 mic dem ra de giao dien noi.
  const rMic = moc.chonClipNghe(vung([clip(P, { kind: 'V', seqTu: 0, seqDen: T, srcTu: 0, srcDen: T }), clip(P, { kind: 'A', seqTu: 0, seqDen: T, srcTu: 0, srcDen: T }), clip('E:/mic/mic1.wav', { kind: 'A', trackIdx: 1, seqTu: 0, seqDen: T, srcTu: 3, srcDen: T + 3 }), clip('E:/mic/mic2.wav', { kind: 'A', trackIdx: 2, seqTu: 0, seqDen: T, srcTu: 3, srcDen: T + 3 })]))
  kiem('Hai mic roi + tieng camera: nghe tieng camera, 2 mic dem boQuaChong 2 (khong bo im lang)', rMic.clips.length === 1 && rMic.clips[0].path === P && rMic.boQuaChong === 2, JSON.stringify({ giu: rMic.clips.map((c) => ten(c.path)), bo: rMic.boQuaChong }))

  // (6) TIENG CAT LAM 2 MANH duoi 1 clip hinh (chinh am luong mot doan) — khong duoc mat manh nao.
  const vTach = vung([clip(P, { kind: 'V', seqTu: 0, seqDen: 60, srcTu: 0, srcDen: 60 }), clip(P, { kind: 'A', clipOrd: 0, seqTu: 0, seqDen: 30, srcTu: 0, srcDen: 30 }), clip(P, { kind: 'A', clipOrd: 1, seqTu: 30, seqDen: 60, srcTu: 30, srcDen: 60 })])
  const ndTach = moc.dungNoiDung(vTach, [ban])
  const ddTach = moc.doanDung(vTach, 0, 60)
  kiem('Tieng 2 manh duoi 1 hinh: doc du tu src [0,60), dung 2 doan hinh lien nhau tong 60 s', ndTach.tu.length === demSrc(0, 60) && ddTach.length === 2 && motLoai(ddTach) && ddTach[0].kind === 'V' && khongChong(ddTach) && Math.abs(tongDoan(ddTach) - 60) < 1e-9, `${ndTach.tu.length}/${demSrc(0, 60)} ${inDs(ddTach)}`)

  // (7) MULTICAM DUNG TAY: tieng cam chinh chay lien, hinh cat qua lai cam 2 (cam 2 khong co tieng).
  const vMcTay = vung([
    clip(P, { kind: 'V', clipOrd: 0, seqTu: 0, seqDen: 20, srcTu: 0, srcDen: 20 }),
    clip('E:/cam2.mp4', { kind: 'V', clipOrd: 1, seqTu: 20, seqDen: 40, srcTu: 500, srcDen: 520 }),
    clip(P, { kind: 'V', clipOrd: 2, seqTu: 40, seqDen: 60, srcTu: 40, srcDen: 60 }),
    clip(P, { kind: 'A', clipOrd: 0, seqTu: 0, seqDen: 60, srcTu: 0, srcDen: 60 }),
  ])
  const ndMc = moc.dungNoiDung(vMcTay, [ban])
  const ddMc = moc.doanDung(vMcTay, 0, 60)
  kiem('Multicam dung tay: doc du tieng cam chinh [0,60), cam 2 dem boQuaChong 1, dung 1 doan cam chinh 60 s', ndMc.tu.length === demSrc(0, 60) && ndMc.soClipBoQua === 1 && ddMc.length === 1 && ddMc[0].path === P && Math.abs(tongDoan(ddMc) - 60) < 1e-9, `${ndMc.tu.length} ${ndMc.soClipBoQua} ${inDs(ddMc)}`)

  // (8) GIOI HAN DA BIET (ghi o moc.ts): podcast CHI TIENG + 1 clip HINH co that (visualizer) ->
  // lan hinh thang nhu luat cu. Phep kiem nay chi chot: tieng podcast bi DEM ra, khong bo im lang.
  const rGh = moc.chonClipNghe(vung([clip(P, { seqTu: 0, seqDen: T, srcTu: 0, srcDen: T }), clip('E:/khac/visualizer.mp4', { kind: 'V', seqTu: 0, seqDen: T, srcTu: 0, srcDen: T })]))
  kiem('Gioi han da biet: chi tieng + 1 hinh -> hinh thang (nhu cu), tieng podcast DEM boQuaChong 1', rGh.clips.length === 1 && ten(rGh.clips[0].path) === 'visualizer.mp4' && rGh.boQuaChong === 1, JSON.stringify({ giu: rGh.clips.map((c) => ten(c.path)), bo: rGh.boQuaChong }))

  // (9) VUNG IO KHONG BAT DAU TU 0 — chot chan loi 2 Transcripts (moc tinh tu dau vung In/Out).
  // Nguoi soat 19/09: moi fixture cu co vungTu = 0 nen sua code thanh "tru vungTu" van 114 DAT.
  const vIo = { ...vung([clip(P, { seqTu: 20, seqDen: 50, srcTu: 5, srcDen: 35 })]), vungTu: 12.5, vungDen: 60 }
  const ndIo = moc.dungNoiDung(vIo, [ban])
  const kyIo = tho.filter((w) => w.giay >= 5 && w.giay < 35).map((w) => 20 + (w.giay - 5))
  kiem('Vung io bat dau 12,5 s: moc tu = seqTu + (src - srcTu) tuyet doi, KHONG tru vungTu', kyIo.length > 0 && ndIo.tu.length === kyIo.length && ndIo.tu.every((w, i) => Math.abs(w.tu - kyIo[i]) < 1e-9) && ndIo.tu[0].tu >= 20 - 1e-9, `${ndIo.tu.length}/${kyIo.length} dau ${ndIo.tu.length ? ndIo.tu[0].tu.toFixed(2) : '-'}`)

  // (10) QUY MO (luat 2b): sequence 886 clip nhay kieu sau Autocut, V + A lien ket, 65 khoi.
  // Nguoi soat 19/09: doanDung cho 65 khoi tren V+A 1772 clip = 11,2 giay (O(n^2) + tinh lai lan cho tung khoi).
  {
    const clipsQ = []
    let src = 0
    let seq = 0
    let ord = 0
    while (ord < 886) {
      for (const kind of ['V', 'A']) clipsQ.push(clip('E:/pv/C4091.MP4', { kind, clipOrd: ord, seqTu: seq, seqDen: seq + 3.6, srcTu: src, srcDen: src + 3.6 }))
      ord++
      seq += 3.6
      src += 4.0
    }
    const vQ = vung(clipsQ)
    const K = []
    for (let i = 0; i < 65; i++) K.push([(seq / 65) * i, (seq / 65) * (i + 1)])
    let t0 = performance.now()
    const lanQ = moc.lanDung(vQ)
    let sai = 0
    for (const [a, b] of K) {
      const d = moc.doanDung(vQ, a, b, lanQ)
      if (!khongChong(d) || !motLoai(d) || d[0].kind !== 'V' || Math.abs(tongDoan(d) - (b - a)) > 1e-6) sai++
    }
    const msTruoc = ms(t0)
    t0 = performance.now()
    for (const [a, b] of K) moc.doanDung(vQ, a, b)
    const msMoiKhoi = ms(t0)
    console.log(`  Quy mo 886 clip x2 (V+A), 65 khoi: lan tinh san ${msTruoc.toFixed(1)} ms · tinh lai moi khoi ${msMoiKhoi.toFixed(1)} ms (nguoi soat do ban cu: 11.202-11.541 ms)`)
    kiem('Quy mo 886 clip V+A: 65 khoi deu khong chong, mot loai (V), tong = do dai khoi', sai === 0, `${sai} khoi sai`)
  }
}

// ═══════════════════════ (4) SUA TAY ═══════════════════════
console.log('\n=== (4) SUA TAY: gop / tach / doi ten / bo — bat bien ===')
{
  const { nd } = nap.Machine
  const dongBang = (o) => {
    Object.freeze(o.ranhGioi)
    Object.freeze(o.tieuDeTay)
    Object.freeze(o.boTay)
    return Object.freeze(o)
  }
  const goc = dongBang(hd.timKhoi(nd))
  const anh = JSON.stringify(goc)
  const b = goc.ranhGioi[3]
  let loiBatBien = null
  let g, t, d, x
  try {
    g = hd.gopVoiTruoc(goc, b)
    t = hd.tachTai(g, b)
    d = hd.doiTieuDe(goc, b, '  Ten tu dat  ')
    x = hd.batBo(goc, b)
  } catch (e) {
    loiBatBien = e
  }
  kiem('Khong ham nao sua dau vao (doi tuong dong bang khong nem loi)', !loiBatBien, loiBatBien && loiBatBien.message)
  kiem('Dau vao y nguyen sau 4 ham', JSON.stringify(goc) === anh)
  kiem('gopVoiTruoc bo dung 1 ranh gioi', g && g.ranhGioi.length === goc.ranhGioi.length - 1 && !g.ranhGioi.includes(b) && g !== goc)
  kiem('Gop roi tach lai = dung ranh gioi cu', t && JSON.stringify(t.ranhGioi) === JSON.stringify(goc.ranhGioi))
  kiem('Khong doi gi -> tra CHINH doi tuong cu (khoi day buoc hoan tac rong)',
    hd.gopVoiTruoc(goc, 0) === goc && hd.gopVoiTruoc(goc, b + 1) === goc && hd.tachTai(goc, b) === goc && hd.tachTai(goc, -3) === goc && hd.tachTai(goc, 2.5) === goc &&
    hd.doiTieuDe(goc, b + 1, 'x') === goc && hd.doiTieuDe(goc, b, '') === goc && hd.batBo(goc, b + 1) === goc)
  const Kd = hd.lamKhoi(nd, d)
  const kd = Kd.find((k) => k.dau === b)
  kiem('doiTieuDe: cat khoang trang, lamKhoi hien ten tay + co "sua-tay"', d.tieuDeTay[b] === 'Ten tu dat' && kd.tieuDe === 'Ten tu dat' && kd.co.includes('sua-tay'))
  kiem('doiTieuDe rong -> ve ten may dat, het "sua-tay"', (() => {
    const v = hd.doiTieuDe(d, b, '   ')
    const k = hd.lamKhoi(nd, v).find((y) => y.dau === b)
    return !(b in v.tieuDeTay) && k.tieuDe === k.cauHoi && !k.co.includes('sua-tay')
  })())
  kiem('batBo bat roi tat', hd.lamKhoi(nd, x).find((k) => k.dau === b).bo === true && hd.lamKhoi(nd, hd.batBo(x, b)).find((k) => k.dau === b).bo === false)
  // Tach giua khoi: khoi moi + khoi cha deu "sua-tay"; tach trong khoi da bo -> nua moi cung bo.
  const K0 = hd.lamKhoi(nd, goc)
  const kCha = K0[5]
  const giua = Math.floor((kCha.dau + kCha.cuoi) / 2)
  const tg = hd.tachTai(goc, giua)
  const Kt = hd.lamKhoi(nd, tg)
  const kMoi = Kt.find((k) => k.dau === giua)
  const kCha2 = Kt.find((k) => k.dau === kCha.dau)
  kiem('Tach giua khoi -> khoi moi + khoi cha deu co "sua-tay", tieu de khoi moi la trich doan (khong phai "Mở đầu")', kMoi && kMoi.co.includes('sua-tay') && kCha2.co.includes('sua-tay') && kMoi.tieuDe !== 'Mở đầu' && kMoi.tieuDe.length > 0, kMoi && kMoi.tieuDe)
  kiem('Cac khoi khac khong bi "sua-tay" oan', Kt.filter((k) => k.dau !== giua && k.dau !== kCha.dau).every((k) => !k.co.includes('sua-tay')))
  const boCha = hd.batBo(goc, kCha.dau)
  const tachBo = hd.tachTai(boCha, giua)
  kiem('Tach trong khoi da bo -> nua moi cung bo', hd.lamKhoi(nd, tachBo).find((k) => k.dau === giua).bo === true)
  // Gop roi tach lai o dung cho cu -> lay lai cau hoi + het "sua-tay".
  const gt = hd.tachTai(hd.gopVoiTruoc(goc, b), b)
  kiem('Gop roi tach lai -> khoi lay lai cau hoi goc, khong con "sua-tay"', JSON.stringify(hd.lamKhoi(nd, gt)) === JSON.stringify(K0))
  // Ngan xep hoan tac: 6 buoc roi lui het -> ve dung ban dau.
  // Moi trang thai chup JSON LUC DAY vao; buoc sau ma sua nham trang thai cu
  // thi luc lui ve se khac anh chup -> hoan tac hong.
  const ngan = [{ o: goc, anh }]
  let cur = goc
  for (const buoc of [(c) => hd.gopVoiTruoc(c, c.ranhGioi[2]), (c) => hd.tachTai(c, 3000), (c) => hd.doiTieuDe(c, c.ranhGioi[1], 'A'), (c) => hd.batBo(c, c.ranhGioi[4]), (c) => hd.gopVoiTruoc(c, c.ranhGioi[6]), (c) => hd.tachTai(c, 777)]) {
    const moi = buoc(cur)
    if (moi !== cur) ngan.push({ o: moi, anh: JSON.stringify(moi) })
    cur = moi
  }
  const soBuoc = ngan.length - 1
  let lechAnh = 0
  while (ngan.length) {
    const s = ngan.pop()
    if (JSON.stringify(s.o) !== s.anh) lechAnh++
  }
  kiem(`Ngan xep hoan tac ${soBuoc} buoc: lui tung buoc, moi trang thai y nhu luc day vao`, soBuoc === 6 && lechAnh === 0, `${soBuoc} buoc, ${lechAnh} trang thai bi sua`)
  // lamKhoi chiu duoc ranh gioi rac (trung, vuot cuoi, am, khong nguyen).
  const rac = { ranhGioi: [5, 0, 5, -1, 1e9, 3.3], tieuDeTay: {}, boTay: {} }
  const Kr = hd.lamKhoi(nd, rac)
  kiem('lamKhoi loc ranh gioi rac -> [0, 5]', Kr.length === 2 && Kr[0].dau === 0 && Kr[1].dau === 5 && Kr[1].cuoi === nd.tu.length)
  kiem('NoiDung rong -> lamKhoi [] , timKhoi [0]', hd.lamKhoi({ cau: [], tu: [], ngonNgu: 'vi', coDemV1: false, soClipBoQua: 0 }, { ranhGioi: [0], tieuDeTay: {}, boTay: {} }).length === 0 &&
    JSON.stringify(hd.timKhoi({ cau: [], tu: [], ngonNgu: 'vi', coDemV1: false, soClipBoQua: 0 }).ranhGioi) === '[0]')
}

// ═══════════════════════ (5) CAU BIA ═══════════════════════
console.log('\n=== (5) danhDauBia ===')
{
  const BIA_BIET = /subscribe|đã theo dõi/i // thuoc cua bao cao lieu-thu 18/09
  const kiemBia = (ten, f, kyVong) => {
    if (!coFile(f)) {
      console.log(`  [SKIP] ${ten}: khong co file`)
      return
    }
    const j = JSON.parse(fs.readFileSync(f, 'utf8'))
    const chus = j.cau.map((c) => c.chu)
    const co = hd.danhDauBia(chus)
    const biet = chus.map((c, i) => (BIA_BIET.test(c) ? i : -1)).filter((i) => i >= 0)
    const them = co.map((b, i) => (b && !BIA_BIET.test(chus[i]) ? i : -1)).filter((i) => i >= 0)
    console.log(`  ${ten}: bia danh dau ${co.filter(Boolean).length} · cau chua "subscribe/da theo doi" ${biet.length} · danh dau THEM (khong chua 2 cum do) ${them.length}${them.length ? ': ' + them.map((i) => `${hd.mocHienThi(j.cau[i].tu)} "${chus[i].trim().slice(0, 50)}"`).join(' | ') : ''}`)
    if (kyVong.biet !== undefined) kiem(`${ten}: bat du ${kyVong.biet} cau subscribe / "da theo doi"`, biet.length === kyVong.biet && biet.every((i) => co[i]), `${biet.filter((i) => co[i]).length}/${biet.length}`)
    if (kyVong.tong !== undefined) kiem(`${ten}: tong ${kyVong.tong} cau bi danh dau (file sach)`, co.filter(Boolean).length === kyVong.tong, co.filter(Boolean).length)
  }
  kiemBia('Cam2_Thien', G.Cam2_Thien, { biet: 11 })
  kiemBia('Cam1_ToanCanh', G.Cam1_ToanCanh, { biet: 4 })
  kiemBia('C4085', G.C4085, { biet: 4 })
  kiemBia('Cam3_Trong', G.Cam3_Trong, {})
  kiemBia('C4091', G.C4091, {})
  // File SACH: Heygen (doc thoai), Machine, Gnostic (cuoi Gnostic co loi THAT "thanks for watching... why not subscribe?")
  kiemBia('Heygen (sach)', E.Heygen, { tong: 0 })
  kiemBia('Machine (sach)', E.Machine, { tong: 0 })
  kiemBia('Gnostic (sach, co loi moi subscribe THAT)', E.Gnostic, { tong: 0 })
  const dd = hd.danhDauBia
  kiem('"Thank you." mot lan = loi that, hai lan lien = bia', JSON.stringify(dd(['Thank you.'])) === '[false]' && JSON.stringify(dd(['Thank you.', 'thank you'])) === '[true,true]')
  kiem('"Dạ." lap 2 lan KHONG bia, cau bat ky lap 3 lan = bia', JSON.stringify(dd(['Dạ.', 'Dạ.'])) === '[false,false]' && JSON.stringify(dd(['A b c', 'a b c.', 'A  b c', 'x'])) === '[true,true,true,false]')
  kiem('Khong loc theo do dai: cau subscribe ngan van bia', dd(['Hãy subscribe cho kênh Ghiền Mì Gõ'])[0] === true)
  if (coFile(G.Cam2_Thien)) {
    const ban = docDem(G.Cam2_Thien)
    const nd = moc.dungNoiDung(vungMot(ban), [ban])
    kiem('Cam2_Thien qua dungNoiDung: CauSeq.bia >= 11', nd.cau.filter((c) => c.bia).length >= 11, nd.cau.filter((c) => c.bia).length)
  }
}

// ═══════════════════════ (6) RANH GIOI tung luat — du lieu GIA ═══════════════════════
// ☠️ Vi sao co phan nay (19/09): doi chung "CHUOI_HOI_GIAY 4 -> 6" chay qua (1)-(5)
// van 96 DAT / 0 HONG — 3 file hoi quy khong co cap cau hoi nao cach 4..6 s, nen
// so cu MU voi nguong do. Moi nguong phai co mot phep dat NGAY TAI ranh gioi.
console.log('\n=== (6) RANH GIOI tung luat tren du lieu GIA ===')
{
  const r3 = (x) => Math.round(x * 1000) / 1000
  /** ds: [giayDau, 'chu', buocGiuaTu?] — moi tu cach nhau `buoc` giay. */
  function ndGia(ds, buoc = 0.3) {
    const cau = []
    const tu = []
    for (const [t0, chu, b] of ds) {
      const tok = chu.split(/\s+/)
      const s = b ?? buoc
      tok.forEach((w, i) => tu.push({ chu: w, giay: r3(t0 + i * s), p: 0.9 }))
      cau.push({ tu: t0, den: r3(t0 + tok.length * s), chu })
    }
    const ban = { path: 'E:/gia.mp4', ket: { cau, tu, ngonNgu: 'vi' }, nguon: 'dem-v2', moHinh: 'turbo' }
    const T = cau[cau.length - 1].den + 1
    return moc.dungNoiDung(vung([clip(ban.path, { seqTu: 0, seqDen: T, srcTu: 0, srcDen: T })]), [ban])
  }
  const loaiTai = (nd, giayCau, tc) => {
    const q = hd.timCauHoi(nd, tc).find((x) => nd.cau[nd.tu[x.hoi].cau].tu === giayCau)
    return q ? q.loai : 'KHONG-THAY'
  }
  const tuKhoi = (K) => K.map((k) => r3(k.tu)).join(',')

  // Chuoi hoi: 3,9 s sau "?" -> chung khoi · 4,1 s -> khoi rieng.
  const ndChuoi = ndGia([
    [0, 'Xin chào mọi người hôm nay mình nói chuyện.'],
    [20, 'Vậy thì anh tên đầy đủ là gì vậy?', 1], // "?" o 28
    [31.9, 'Rồi anh làm nghề gì vậy?', 1], // 3,9 s sau
    [40, 'Tôi làm nghề dựng phim đã lâu rồi.'],
    [60, 'Vậy thì anh đang sống ở khu nào vậy?', 1], // "?" o 68
    [72.1, 'Rồi anh bao nhiêu tuổi rồi vậy?', 1], // 4,1 s sau
    [90, 'Tôi năm nay ba mươi tuổi rồi.'],
  ])
  const Kc = hd.lamKhoi(ndChuoi, hd.timKhoi(ndChuoi))
  kiem('Chuoi hoi: 3,9 s -> chung khoi, 4,1 s -> khoi rieng (khoi o 0, 20, 60, 72,1)', tuKhoi(Kc) === '0,20,60,72.1', tuKhoi(Kc))
  kiem('Chuoi hoi: cauHoi khoi gop co CA HAI cau, traLoiDau = cau tra loi sau cau hoi CUOI', Kc[1] && Kc[1].cauHoi.includes('tên') && Kc[1].cauHoi.includes('nghề') && Kc[1].traLoiDau === 'Tôi làm nghề dựng phim đã lâu rồi.', Kc[1] && `${Kc[1].cauHoi} | ${Kc[1].traLoiDau}`)

  // Loc: ngan (<=2 tu) · duoi ", right?" · trich · bia · duoi Viet (tuy chon).
  const ndLoc = ndGia([
    [0, 'Mở đầu câu chuyện hôm nay nhé.'],
    [20, 'What?'],
    [30, 'Thật hả?'],
    [40, 'Thật vậy hả?'],
    [60, "It's big, right?"],
    [80, "It's big right?"],
    [100, '"Where have you been?'],
    [120, 'She asked where have I been?"'],
    [140, 'Hãy subscribe cho kênh Ghiền Mì Gõ nhé?'],
    [160, 'Em làm ở đây lâu rồi, phải không?'],
    [180, 'Kết thúc ở đây.'],
  ])
  const mong = { 20: 'ngan', 30: 'ngan', 40: '', 60: 'duoi', 80: '', 100: 'trich', 120: 'trich', 140: 'bia', 160: '' }
  const thuc = Object.fromEntries(Object.keys(mong).map((g) => [g, loaiTai(ndLoc, +g)]))
  kiem('Loc: 1-2 tu = ngan, 3 tu mo khoi · ", right?" = duoi, khong phay thi mo · nhay dau / "?\\"" = trich · cau bia = bia', JSON.stringify(thuc) === JSON.stringify(mong), JSON.stringify(thuc))
  kiem('Duoi Viet ", phải không?": mac dinh MO khoi, bat duoiHoiViet thi = duoi', loaiTai(ndLoc, 160) === '' && loaiTai(ndLoc, 160, { duoiHoiViet: true }) === 'duoi')

  // Tran lui 30 tu: 5 tu khong dau cau + 25 tu hoi = 30 -> khong tran; 26 -> tran.
  const tuHoi = (n) => Array.from({ length: n }, (_, i) => 'chữ' + i).join(' ') + ' không?'
  const nd30 = ndGia([[0, 'Mở đầu.'], [10, 'một hai ba bốn năm'], [12, tuHoi(24)], [40, 'Trả lời ở đây.']], 0.1)
  const nd31 = ndGia([[0, 'Mở đầu.'], [10, 'một hai ba bốn năm'], [12, tuHoi(25)], [40, 'Trả lời ở đây.']], 0.1)
  const q30 = hd.timCauHoi(nd30)[0]
  const q31 = hd.timCauHoi(nd31)[0]
  kiem('Lui dung 30 tu: khong tran, dau cau hoi = dau cau truoc (10 s)', q30 && !q30.tran && nd30.tu[q30.dau].tu === 10, q30 && `${q30.tran} ${nd30.tu[q30.dau].tu}`)
  kiem('Lui 31 tu: TRAN, dau = dau cau Whisper chua "?" (12 s), khoi co "khong-ro-dau-cau"', q31 && q31.tran && nd31.tu[q31.dau].tu === 12 && hd.lamKhoi(nd31, hd.timKhoi(nd31))[1].co.includes('khong-ro-dau-cau'))

  // Gop khoi < 10 s vao khoi truoc; khoi hoi DAU TIEN khong gop vao "Mo dau".
  const ndNgan = ndGia([
    [0, 'Mở đầu nhé.'],
    [20, 'Câu hỏi thứ nhất là gì?', 0.2], // "?" o 21
    [40, 'Trả lời một.'],
    [60, 'Câu hỏi thứ hai là gì?', 0.2], // "?" o 61 — khoi 60..65,5 = 5,5 s
    [65.5, 'Câu hỏi thứ ba là gì?', 0.2],
    [80, 'Trả lời ba.'],
  ])
  const Kn = hd.lamKhoi(ndNgan, hd.timKhoi(ndNgan))
  kiem('Khoi 5,5 s gop vao khoi truoc (khoi o 0, 20, 65,5; gopNgan 1)', tuKhoi(Kn) === '0,20,65.5' && hd.chanDoanKhoi(ndNgan).gopNgan === 1, tuKhoi(Kn))
  const ndDau = ndGia([[0, 'Mở đầu nhé.'], [20, 'Câu hỏi đầu là gì?', 0.2], [26, 'Câu hỏi sau là gì vậy?', 0.2], [60, 'Trả lời.']])
  kiem('Khoi hoi dau tien 6 s KHONG gop vao "Mo dau" (khoi o 0, 20, 26)', tuKhoi(hd.lamKhoi(ndDau, hd.timKhoi(ndDau))) === '0,20,26', tuKhoi(hd.lamKhoi(ndDau, hd.timKhoi(ndDau))))

  // Co "dai": > 180 s.
  const ndDai = ndGia([[0, 'Mở đầu.'], [10, 'Câu hỏi dài là gì?'], [191.5, 'Kết thúc.']])
  const ndVua = ndGia([[0, 'Mở đầu.'], [10, 'Câu hỏi vừa là gì?'], [188.5, 'Kết thúc.']])
  const kDai = hd.lamKhoi(ndDai, hd.timKhoi(ndDai))[1]
  const kVua = hd.lamKhoi(ndVua, hd.timKhoi(ndVua))[1]
  kiem(`Co "dai": ${f1(kDai.den - kDai.tu)} s co, ${f1(kVua.den - kVua.tu)} s khong`, kDai.co.includes('dai') && !kVua.co.includes('dai') && kDai.den - kDai.tu > 180 && kVua.den - kVua.tu <= 180)

  // keoGach: "- Anh co khoe khong?" dau cau -> khoi o dau cau, khong co oan; tat -> co.
  const ndGach = ndGia([[0, 'Mở đầu nhé.'], [10, '- Anh có khỏe không?'], [20, 'Dạ khỏe. - Còn anh thì sao?'], [40, 'Tôi cũng khỏe.']])
  const Kg = hd.lamKhoi(ndGach, hd.timKhoi(ndGach))
  const Kg0 = hd.lamKhoi(ndGach, hd.timKhoi(ndGach, { keoGach: false }), { keoGach: false })
  kiem('keoGach: "- Anh..." dau cau -> khoi bat dau o 10 s, KHONG co "ranh-gioi-can-nghe"', Kg[1].tu === 10 && !Kg[1].co.includes('ranh-gioi-can-nghe') && ndGach.tu[Kg[1].dau].chu === '-', `${Kg[1].tu} ${Kg[1].co}`)
  kiem('keoGach tat (v0): cung cau do bi co "ranh-gioi-can-nghe" oan', Kg0[1].co.includes('ranh-gioi-can-nghe'))
  kiem('keoGach: "- Còn anh..." giua cau -> khoi o dau "-", co "ranh-gioi-can-nghe", cauHoi bo "-"', Kg[2] && ndGach.tu[Kg[2].dau].chu === '-' && Kg[2].co.includes('ranh-gioi-can-nghe') && Kg[2].cauHoi === 'Còn anh thì sao?', Kg[2] && `${Kg[2].cauHoi} ${Kg[2].co}`)
}

// ═══════════════════════ TIM CHU + MOC HIEN ═══════════════════════
console.log('\n=== timChu + mocHienThi ===')
{
  const { nd } = nap.Heygen
  const a = hd.timChu(nd, 'khong')
  const b = hd.timChu(nd, 'KHÔNG')
  const tay = nd.cau.map((c, i) => (c.chu.toLowerCase().includes('không') ? i : -1)).filter((i) => i >= 0)
  kiem('timChu "khong" = "KHÔNG" = cac cau chua "không"', JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(tay) && a.length > 0, `${a.length}/${tay.length}`)
  const dd = { ...nd, cau: [{ ...nd.cau[0], chu: 'Đường đi Đà Lạt' }] }
  kiem('timChu "duong di da lat" khop "Đường đi Đà Lạt" (đ khong tach duoc bang NFD)', hd.timChu(dd, 'duong di da lat').length === 1)
  kiem('timChu chuoi rong / khoang trang -> []', hd.timChu(nd, '').length === 0 && hd.timChu(nd, '   ').length === 0)
  const m = hd.mocHienThi
  kiem('mocHienThi: 0:00 · 0:59 · 1:01 · 1:00:00 · 1:02:05 · am/NaN -> 0:00', m(0) === '0:00' && m(59.9) === '0:59' && m(61) === '1:01' && m(3600) === '1:00:00' && m(3725.5) === '1:02:05' && m(-3) === '0:00' && m(NaN) === '0:00',
    [m(0), m(59.9), m(61), m(3600), m(3725.5), m(-3), m(NaN)].join(' '))
}

// ═══════════════════════ (7) TAB "TOAN BO LOI" ═══════════════════════
// Them 21/09 cho phan so lieu + bung tung tu + chep/xuat .txt/.srt.
// ☠️ Thuoc doc lap: khong so ket qua cua xuat.ts voi chinh xuat.ts. giayNoi do
// lai bang cach danh dau TUNG MILI-GIAY (thuat toan khac han phep hop khoang);
// .srt thi PHAN TICH LAI file da sinh roi doi chieu voi nd.cau.
console.log('\n=== (7) TAB "TOAN BO LOI": so lieu · tung tu · xuat .txt/.srt ===')
{
  // ── (7a) id cau = chi so trong nd.cau ──
  // App cat vung chon bang `nd.cau.slice(dau, cuoi+1)` — bat bien nay vo la cat sai cau.
  for (const ten of ['Machine', 'Gnostic', 'Heygen']) {
    const { nd } = nap[ten]
    kiem(`${ten}: id cau = chi so trong nd.cau (App cat vung chon bang chi so)`, nd.cau.every((c, i) => c.id === i))
  }

  // ── (7b) Tung TU cua mot cau: nd.tu.slice(tuDau, tuCuoi) ──
  // Day la du lieu cho phan "bung mot cau ra xem tung tu kem p".
  {
    const { nd } = nap.Machine
    let rong = 0
    let ngoaiCau = 0
    let saiThuTu = 0
    let saiCau = 0
    let pNgoai = 0
    let tong = 0
    for (const c of nd.cau) {
      const tu = nd.tu.slice(c.tuDau, c.tuCuoi)
      if (!tu.length) rong++
      tong += tu.length
      for (let i = 0; i < tu.length; i++) {
        if (tu[i].tu < c.tu - 1e-6 || tu[i].tu > c.den + 1e-6) ngoaiCau++
        if (i && tu[i].tu < tu[i - 1].tu - 1e-9) saiThuTu++
        if (tu[i].cau !== c.id) saiCau++
        if (!(tu[i].p >= 0 && tu[i].p <= 1)) pNgoai++
      }
    }
    const yeu = nd.tu.filter((w) => w.p < 0.5).length
    console.log(`  Machine: ${nd.cau.length} cau · ${tong} tu lay qua slice (nd.tu ${nd.tu.length}) · tu co p<0,5: ${yeu}`)
    kiem('Machine: slice(tuDau,tuCuoi) phu HET nd.tu, khong cau nao rong', tong === nd.tu.length && rong === 0, `${tong}/${nd.tu.length} rong ${rong}`)
    kiem('Machine: moi tu nam trong [cau.tu, cau.den] va tang dan', ngoaiCau === 0 && saiThuTu === 0, `ngoai ${ngoaiCau} sai thu tu ${saiThuTu}`)
    kiem('Machine: tu[].cau tro dung id cau, p trong [0,1]', saiCau === 0 && pNgoai === 0, `saiCau ${saiCau} pNgoai ${pNgoai}`)
  }

  // ── (7c) soLieuLoi: doi chieu bang phep dem DOC LAP ──
  for (const ten of ['Machine', 'Gnostic', 'Conspiracy']) {
    const { nd } = nap[ten]
    const s = xu.soLieuLoi(nd.cau)
    const biaTay = nd.cau.filter((c) => c.bia).length
    const nghiTay = nd.cau.filter((c) => c.tinCayThap && !c.bia).length
    // Thuoc doc lap: danh dau tung mili-giay co nguoi noi (khong dung phep hop khoang).
    let het = 0
    for (const c of nd.cau) if (c.den > het) het = c.den
    const bo = new Uint8Array(Math.ceil(het * 1000) + 2)
    for (const c of nd.cau) {
      if (c.bia || !(c.den > c.tu)) continue
      const a = Math.round(c.tu * 1000)
      const b = Math.round(c.den * 1000)
      for (let i = a; i < b; i++) bo[i] = 1
    }
    let msNoi = 0
    for (let i = 0; i < bo.length; i++) if (bo[i]) msNoi++
    const saiSo = 0.001 * (2 * nd.cau.length + 2) // moi cau tron 2 dau, moi dau <= 1 ms
    console.log(
      `  ${ten}: ${s.soCau} cau · noi ${f1(s.giayNoi)} s (dem tung ms: ${f1(msNoi / 1000)} s) · khong chac ${s.soNghiNgo} · bia ${s.soBia}`,
    )
    kiem(`${ten}: soCau / soBia / soNghiNgo khop phep dem tay`, s.soCau === nd.cau.length && s.soBia === biaTay && s.soNghiNgo === nghiTay, `${s.soCau}/${s.soBia}/${s.soNghiNgo} vs ${nd.cau.length}/${biaTay}/${nghiTay}`)
    kiem(`${ten}: giayNoi khop thuoc "danh dau tung ms" (lech <= ${f1(saiSo)} s)`, Math.abs(s.giayNoi - msNoi / 1000) <= saiSo, `${s.giayNoi.toFixed(3)} vs ${(msNoi / 1000).toFixed(3)}`)
    kiem(`${ten}: giayNoi <= tong do dai noi dung (hop khoang, khong cong don)`, s.giayNoi <= het + 1e-9, `${f1(s.giayNoi)} > ${f1(het)}`)
    kiem(`${ten}: soNghiNgo + soBia <= soCau (hai con so khong de nhau)`, s.soNghiNgo + s.soBia <= s.soCau)
    // MAU SO cua soNghiNgo la soThat (= soCau - soBia), KHONG phai soCau: man hinh
    // tung in "khong chac N/363" trong khi N chi dem tren 310 cau that (Conspiracy
    // co 53 cau bia) — brain 5k-bis. Conspiracy la ca DUY NHAT co soBia > 0 nen
    // do la ca phai giu.
    kiem(`${ten}: soThat = soCau - soBia (${s.soThat} = ${s.soCau} - ${s.soBia})`, s.soThat === s.soCau - s.soBia, `${s.soThat}`)
    kiem(`${ten}: soNghiNgo <= soThat (tu so nam trong dung mau so cua no)`, s.soNghiNgo <= s.soThat, `${s.soNghiNgo}/${s.soThat}`)
  }
  {
    // Cau CHONG mocnhau: cong don la dem hai lan, hop khoang thi khong.
    const c = (id, tu, den) => ({ id, tu, den, chu: 'x', tuDau: id, tuCuoi: id + 1, path: 'p', srcTu: tu, srcDen: den, bia: false, tinCayThap: false })
    kiem('soLieuLoi: hai cau chong nhau [0,10) + [5,12) -> noi 12 s (cong don se ra 17)', xu.soLieuLoi([c(0, 0, 10), c(1, 5, 12)]).giayNoi === 12)
    kiem('soLieuLoi: hai cau roi [0,2) + [10,12) -> noi 4 s (khong tinh khoang lang)', xu.soLieuLoi([c(0, 0, 2), c(1, 10, 12)]).giayNoi === 4)
    kiem('soLieuLoi: cau bia khong tinh vao giayNoi', xu.soLieuLoi([{ ...c(0, 0, 10), bia: true }, c(1, 20, 25)]).giayNoi === 5)
    kiem('soLieuLoi: danh sach rong -> 0 het', JSON.stringify(xu.soLieuLoi([])) === JSON.stringify({ soCau: 0, giayNoi: 0, soNghiNgo: 0, soBia: 0, soThat: 0 }))
    kiem('soLieuLoi: 3 cau trong do 1 bia -> soThat 2, mau so cua soNghiNgo la 2', (() => {
      const s = xu.soLieuLoi([{ ...c(0, 0, 2), tinCayThap: true }, { ...c(1, 3, 5), bia: true, tinCayThap: true }, c(2, 6, 8)])
      return s.soCau === 3 && s.soBia === 1 && s.soThat === 2 && s.soNghiNgo === 1
    })())
  }

  // ── (7d) mocSrt: sat mep + lam tron nho so ──
  {
    const m = xu.mocSrt
    kiem('mocSrt: 0 · 1,5 · 61,25 · 3661,5 · 35999,999', m(0) === '00:00:00,000' && m(1.5) === '00:00:01,500' && m(61.25) === '00:01:01,250' && m(3661.5) === '01:01:01,500' && m(35999.999) === '09:59:59,999', [m(0), m(1.5), m(61.25), m(3661.5), m(35999.999)].join(' '))
    // ☠️ Cho lam tron: 59,9996 phai nho len thanh 00:01:00,000, khong ra 00:00:59,1000.
    kiem('mocSrt: 59,9994 -> 00:00:59,999 · 59,9996 -> 00:01:00,000 (nho so dung)', m(59.9994) === '00:00:59,999' && m(59.9996) === '00:01:00,000', `${m(59.9994)} ${m(59.9996)}`)
    kiem('mocSrt: 3599,9999 -> 01:00:00,000 (nho qua ca gio)', m(3599.9999) === '01:00:00,000', m(3599.9999))
    kiem('mocSrt: giay am / NaN -> 00:00:00,000', m(-5) === '00:00:00,000' && m(NaN) === '00:00:00,000')
    kiem('mocSrt: dung dau PHAY truoc mili-giay (chuan SubRip)', /^\d\d:\d\d:\d\d,\d\d\d$/.test(m(12.345)), m(12.345))
    // mocNgan cua xuat.ts va mocHienThi cua hoidap.ts phai noi cung mot thu.
    const lech = [0, 0.4, 59.9, 61, 3600, 3725.5, 7199.999].filter((g) => xu.mocNgan(g) !== hd.mocHienThi(g))
    kiem('mocNgan (xuat.ts) = mocHienThi (hoidap.ts) tren 7 moc', lech.length === 0, JSON.stringify(lech))
  }

  // ── (7e) xuatSrt tren dem THAT: phan tich lai file vua sinh ──
  for (const ten of ['Machine', 'Conspiracy']) {
    const { nd } = nap[ten]
    const k = xu.xuatSrt(nd.cau)
    const biaTay = nd.cau.filter((c) => c.bia).length
    const giu = nd.cau.filter((c) => !c.bia)
    const khoi = k.chu.split('\n\n').filter((x) => x.trim() !== '')
    const giayTu = (s) => {
      const m = /^(\d\d):(\d\d):(\d\d),(\d\d\d)$/.exec(s)
      return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : NaN
    }
    let soLech = 0
    let lechMax = 0
    let saiSo = 0
    let ngan = 0
    let luiThoiGian = 0
    let truoc = -1
    khoi.forEach((b, i) => {
      const d = b.split('\n')
      if (+d[0] !== i + 1) saiSo++
      const mm = /^(\S+) --> (\S+)$/.exec(d[1] || '')
      if (!mm) {
        soLech++
        return
      }
      const a = giayTu(mm[1])
      const z = giayTu(mm[2])
      if (!(z > a)) ngan++
      if (a < truoc - 1e-9) luiThoiGian++
      truoc = a
      const c = giu[i]
      if (!c) {
        soLech++
        return
      }
      lechMax = Math.max(lechMax, Math.abs(a - c.tu), Math.abs(z - Math.max(c.den, c.tu + 0.001)))
      if (d.slice(2).join(' ').replace(/\s+/g, ' ').trim() !== c.chu.replace(/\s+/g, ' ').trim()) soLech++
    })
    console.log(`  ${ten} .srt: ${k.soCau} cue · bo bia ${k.soBoBia} · keo dai ${k.soKeoDai} · chong lan ${k.soChongLan} · ${k.chu.length} ky tu · lech moc lon nhat ${(lechMax * 1000).toFixed(2)} ms`)
    kiem(`${ten} .srt: so cue = so cau khong bia (${giu.length}), bo dung ${biaTay} cau bia`, k.soCau === giu.length && khoi.length === giu.length && k.soBoBia === biaTay, `${k.soCau}/${khoi.length}/${giu.length} bia ${k.soBoBia}/${biaTay}`)
    kiem(`${ten} .srt: so thu tu 1..N lien tuc, chu khop nd.cau`, saiSo === 0 && soLech === 0, `saiSo ${saiSo} lechChu ${soLech}`)
    kiem(`${ten} .srt: moc doc lai khop nd.cau (lech <= 1 ms) va moc dau khong lui`, lechMax <= 0.0011 && luiThoiGian === 0, `${(lechMax * 1000).toFixed(2)} ms · lui ${luiThoiGian}`)
    kiem(`${ten} .srt: khong cue nao dai 0 (trinh phat bo qua)`, ngan === 0, ngan)
    kiem(`${ten} .srt: chi dung \\n, khong lan \\r (CRLF la viec cua luuRa.ts)`, k.chu.indexOf('\r') < 0)
  }
  {
    // Cue dai 0 -> keo them 1 ms; hai cau de moc -> bao soChongLan, KHONG tu sua.
    const c = (id, tu, den, chu) => ({ id, tu, den, chu, tuDau: id, tuCuoi: id + 1, path: 'p', srcTu: tu, srcDen: den, bia: false, tinCayThap: false })
    const k1 = xu.xuatSrt([c(0, 5, 5, 'Da')])
    kiem('xuatSrt: cau dai 0 -> keo 1 ms, soKeoDai 1', k1.soKeoDai === 1 && k1.chu.indexOf('00:00:05,000 --> 00:00:05,001') > 0, k1.chu.split('\n')[1])
    const k2 = xu.xuatSrt([c(0, 0, 10, 'Mot'), c(1, 5, 12, 'Hai')])
    kiem('xuatSrt: hai cau de moc -> soChongLan 1, moc GIU NGUYEN (khong tu sua)', k2.soChongLan === 1 && k2.chu.indexOf('00:00:00,000 --> 00:00:10,000') > 0, `${k2.soChongLan}`)
    kiem('xuatSrt: ca danh sach la cau bia -> chu rong, soCau 0, soBoBia 2', (() => { const k = xu.xuatSrt([{ ...c(0, 0, 1, 'a'), bia: true }, { ...c(1, 2, 3, 'b'), bia: true }]); return k.chu === '' && k.soCau === 0 && k.soBoBia === 2 })())
  }

  // ── (7f) xuatTxt ──
  {
    const { nd } = nap.Machine
    const k = xu.xuatTxt(nd.cau)
    const dong = k.chu.split('\n').filter((x) => x !== '')
    const giu = nd.cau.filter((c) => !c.bia)
    const thieuTab = dong.filter((d) => d.indexOf('\t') < 0).length
    const saiMoc = dong.filter((d, i) => d.split('\t')[0] !== hd.mocHienThi(giu[i].tu)).length
    const saiChu = dong.filter((d, i) => d.split('\t').slice(1).join('\t') !== giu[i].chu.replace(/\s+/g, ' ').trim()).length
    console.log(`  Machine .txt: ${k.soCau} dong · bo bia ${k.soBoBia} · ${k.chu.length} ky tu`)
    kiem('Machine .txt: so dong = so cau khong bia, moi dong co TAB', dong.length === giu.length && k.soCau === giu.length && thieuTab === 0, `${dong.length}/${giu.length} thieuTab ${thieuTab}`)
    kiem('Machine .txt: cot moc = mocHienThi, cot chu = nguyen van cau', saiMoc === 0 && saiChu === 0, `saiMoc ${saiMoc} saiChu ${saiChu}`)
    kiem('Machine .txt: khong lan \\r', k.chu.indexOf('\r') < 0)
    kiem('xuatTxt: danh sach rong -> chu rong', xu.xuatTxt([]).chu === '' && xu.xuatTxt([]).soCau === 0)
  }

  // ── (7g) tenFileSach: ten file an toan tren Windows ──
  {
    const t = xu.tenFileSach
    kiem('tenFileSach: bo ky tu cam < > : " / \\ | ? *', t('PV: Thien/Trong *bản 1?') === 'PV Thien Trong bản 1', JSON.stringify(t('PV: Thien/Trong *bản 1?')))
    kiem('tenFileSach: bo dau cach / dau cham o cuoi (Explorer tu cat)', t('ten cuoi. ') === 'ten cuoi' && t('a...') === 'a', `${JSON.stringify(t('ten cuoi. '))} ${JSON.stringify(t('a...'))}`)
    kiem('tenFileSach: chuoi rong / toan ky tu cam -> ten du san', t('') === 'khong-ten' && t('///') === 'khong-ten' && t('', 'Short Viral') === 'Short Viral')
    kiem('tenFileSach: ten thiet bi cu (CON, NUL, COM1) duoc them gach duoi', t('CON') === 'CON_' && t('nul') === 'nul_' && t('COM1') === 'COM1_')
    kiem('tenFileSach: giu dau tieng Viet', t('Phỏng vấn Thiện') === 'Phỏng vấn Thiện')
  }

  // ── (7h) QUY MO THAT (luat 2b): ~2.000 cau phai duoi 200 ms ──
  {
    const ban = nap.Machine.ban
    const T = tongGiay(ban)
    const clips = Array.from({ length: 3 }, (_, i) => clip(ban.path, { clipOrd: i, seqTu: i * T, seqDen: (i + 1) * T, srcTu: 0, srcDen: T }))
    const nd = moc.dungNoiDung(vung(clips), [ban])
    let t0 = performance.now()
    const s = xu.soLieuLoi(nd.cau)
    const tSo = ms(t0)
    t0 = performance.now()
    const kSrt = xu.xuatSrt(nd.cau)
    const tSrt = ms(t0)
    t0 = performance.now()
    const kTxt = xu.xuatTxt(nd.cau)
    const tTxt = ms(t0)
    const tong = tSo + tSrt
    console.log(`  QUY MO (${nd.cau.length} cau / ${nd.tu.length} tu = ${hd.mocHienThi(3 * T)}): soLieuLoi ${tSo.toFixed(1)} ms · xuatSrt ${tSrt.toFixed(1)} ms (${(kSrt.chu.length / 1024).toFixed(0)} KB) · xuatTxt ${tTxt.toFixed(1)} ms (${(kTxt.chu.length / 1024).toFixed(0)} KB)`)
    kiem(`QUY MO: >= 2.000 cau (${nd.cau.length})`, nd.cau.length >= 2000, nd.cau.length)
    kiem(`QUY MO: soLieuLoi + xuatSrt < 200 ms (${tong.toFixed(1)} ms)`, tong < 200, tong.toFixed(1))
    kiem('QUY MO: cat mot vung 500 cau giua bai (kieu App) < 20 ms va ra dung 500 cue', (() => {
      const t1 = performance.now()
      const phan = nd.cau.slice(700, 1200)
      const k = xu.xuatSrt(phan)
      const t = ms(t1)
      return t < 20 && k.soCau + k.soBoBia === 500
    })())
    // Tu cua MOI cau tren quy mo nay (cai App lam khi bung tung cau).
    const t2 = performance.now()
    let demTu = 0
    for (const c of nd.cau) demTu += nd.tu.slice(c.tuDau, c.tuCuoi).length
    const tTu = ms(t2)
    kiem(`QUY MO: slice tu cho CA ${nd.cau.length} cau = ${demTu} tu, ${tTu.toFixed(1)} ms (< 50)`, demTu === nd.tu.length && tTu < 50, `${demTu}/${nd.tu.length} ${tTu.toFixed(1)} ms`)
    void s
  }
}

// ═══════════════════════ (8) PILL CHON / BO CHON TAT CA ═══════════════════════
//
// `trangThaiChon` viet NHAN cua pill, `daoChonHet` lam viec khi bam. Hai thu phai
// ra tu MOT ham: tach hai cho tinh la co ngay nhan noi "Bo chon (31)" ma cu bam
// lai di chon them. Phan nay kiem dung cai do.
console.log('\n=== (8) PILL CHON / BO CHON TAT CA (them 21/09) ===')
{
  const K = (dau, bo) => ({ dau, cuoi: dau + 1, tu: dau, den: dau + 1, cauHoi: '', traLoiDau: '', tieuDe: 't' + dau, co: [], bo: !!bo })
  const ds = [K(0), K(10), K(20, true), K(30)] // 3 khoi chon duoc, 1 khoi da BO
  kiem('Danh sach rong -> muc "khong", tong 0', (() => {
    const t = hd.trangThaiChon([], [])
    return t.muc === 'khong' && t.tong === 0 && t.daChon === 0
  })())
  kiem('Chua chon gi -> muc "trong", tong = so khoi CHON DUOC (3, khong phai 4)', (() => {
    const t = hd.trangThaiChon(ds, [])
    return t.muc === 'trong' && t.tong === 3 && t.daChon === 0
  })(), JSON.stringify(hd.trangThaiChon(ds, [])))
  // DOI CHUNG cho mau so (brain 5k-bis): bo khoi `bo` ra thi tong phai TUT 1.
  kiem('DOI CHUNG mau so: bo khoi da-bo khoi danh sach -> tong 3 -> 3, con danh sach 4 khoi thuong -> 4',
    hd.trangThaiChon(ds.filter((k) => !k.bo), []).tong === 3 && hd.trangThaiChon([K(0), K(1), K(2), K(3)], []).tong === 4)
  kiem('Chon mot phan -> muc "nua" + dung daChon', (() => {
    const t = hd.trangThaiChon(ds, [10])
    return t.muc === 'nua' && t.daChon === 1 && t.tong === 3
  })(), JSON.stringify(hd.trangThaiChon(ds, [10])))
  kiem('Chon het 3 khoi chon duoc -> muc "het" (khoi da bo KHONG can chon)', hd.trangThaiChon(ds, [0, 10, 30]).muc === 'het')
  kiem('Khoi da BO co trong chon (rac tu lan truoc) khong lam thanh "het" oan', hd.trangThaiChon(ds, [0, 10, 20]).muc === 'nua')
  kiem('Nhan Set hay mang deu ra so giong nhau', JSON.stringify(hd.trangThaiChon(ds, new Set([0, 30]))) === JSON.stringify(hd.trangThaiChon(ds, [0, 30])))

  // ── daoChonHet: dung mot hanh dong, dao theo trang thai hien tai ──
  const sx = (a) => a.slice().sort((x, y) => x - y)
  kiem('trong -> CHON HET dung 3 khoi chon duoc (khong keo khoi da bo vao)', JSON.stringify(sx(hd.daoChonHet(ds, []))) === '[0,10,30]')
  kiem('nua -> CHON HET (khong phai bo het)', JSON.stringify(sx(hd.daoChonHet(ds, [10]))) === '[0,10,30]')
  kiem('het -> BO HET', JSON.stringify(hd.daoChonHet(ds, [0, 10, 30])) === '[]')
  kiem('Bam hai lan lien tiep (chon het roi bo het) ve dung diem xuat phat', (() => {
    const a = hd.daoChonHet(ds, [])
    const b = hd.daoChonHet(ds, a)
    return b.length === 0
  })())
  // Khoi dang chon ma O TIM che: KHONG duoc am tham bo (chi dung khoi DANG HIEN).
  const hien = [K(0), K(10)]
  kiem('Loc roi CHON HET: khoi bi loc (99) van giu nguyen trong chon', JSON.stringify(sx(hd.daoChonHet(hien, [99]))) === '[0,10,99]')
  kiem('Loc roi BO HET: chi bo khoi dang hien, khoi bi loc (99) van con', JSON.stringify(sx(hd.daoChonHet(hien, [0, 10, 99]))) === '[99]')
  kiem('Khoi bi loc KHONG tinh vao mau so pill', hd.trangThaiChon(hien, [0, 10, 99]).muc === 'het' && hd.trangThaiChon(hien, [0, 10, 99]).tong === 2)
  // Bat bien: khong sua mang dau vao, khong doi gi thi tra CHINH mang cu.
  const vao = Object.freeze([0, 10, 30])
  let loiDongBang = null
  let raBang
  try {
    raBang = hd.daoChonHet(ds, vao)
  } catch (e) {
    loiDongBang = e
  }
  kiem('Khong sua mang chon dau vao (mang dong bang khong nem loi)', !loiDongBang, loiDongBang && loiDongBang.message)
  kiem('Mang dau vao y nguyen sau khi dao', JSON.stringify(vao) === '[0,10,30]' && raBang && raBang.length === 0)
  kiem('Khong doi gi -> tra CHINH mang cu (khoi day buoc vo ich)', (() => {
    const c = [5]
    return hd.daoChonHet([], c) === c && hd.daoChonHet([K(0, true)], c) === c
  })())

  // ── Quy mo THAT: khoi that cua mot dem that, khong phai du lieu gia ──
  {
    const { nd } = nap.Machine
    const Kt = hd.lamKhoi(nd, hd.timKhoi(nd))
    const moiDau = Kt.map((k) => k.dau)
    const t0 = performance.now()
    let tt = hd.trangThaiChon(Kt, [])
    const het = hd.daoChonHet(Kt, [])
    const ttHet = hd.trangThaiChon(Kt, het)
    const tDao = ms(t0)
    console.log(`  Machine: ${Kt.length} khoi that -> trangThaiChon + daoChonHet + trangThaiChon = ${tDao.toFixed(2)} ms`)
    kiem(`Khoi that: chua chon -> "trong", tong = ${Kt.length}`, tt.muc === 'trong' && tt.tong === Kt.length)
    kiem('Khoi that: dao mot cu -> "het", dung tung khoa dau', ttHet.muc === 'het' && JSON.stringify(sx(het)) === JSON.stringify(sx(moiDau)))
    kiem(`Khoi that: 3 phep tren ${Kt.length} khoi < 5 ms (${tDao.toFixed(2)} ms)`, tDao < 5, tDao.toFixed(2))
    // Bo mot khoi giua roi chon het: khoi do phai NGOAI danh sach chon.
    const boGiua = hd.batBo(hd.timKhoi(nd), Kt[3].dau)
    const Kb = hd.lamKhoi(nd, boGiua)
    const hetB = hd.daoChonHet(Kb, [])
    tt = hd.trangThaiChon(Kb, hetB)
    kiem('Khoi that: bo 1 khoi -> tong tut 1, khoi da bo khong nam trong chon', tt.tong === Kt.length - 1 && tt.muc === 'het' && hetB.indexOf(Kt[3].dau) < 0, `${tt.tong} vs ${Kt.length - 1}`)
  }
}

// ═══════════════════════ (7i) CHOT CHAN BYTE DIEU KHIEN ═══════════════════════
//
// Bay da can 5 lan (brain 5ax). Lan 21/09: mot byte NUL nam tran o xuat.ts:199 ->
// tsc sach, vite build sach, bo kiem 189/0, ma ban DA DONG GOI mo ra TRANG TRON
// (Chrome tren dist da build: "Invalid regular expression ... Range out of order",
// <div id="root"> RONG). Thuoc phai co DOI CHUNG, khong thi no chua chung minh
// duoc no biet do la gi (luat 5aj).
{
  console.log('\n— (7i) chot chan byte dieu khien —')
  const kb = await import(pathToFileURL(path.join(THU_MUC, 'kiem-byte.mjs')).href)
  const src = path.join(path.dirname(THU_MUC), 'client', 'src')
  const hongSrc = kb.quetThuMuc(src)
  kiem(
    `client/src sach: 0 file co byte dieu khien nam tran`,
    hongSrc.length === 0,
    hongSrc.map((h) => path.basename(h.duong)).join(', '),
  )
  // DOI CHUNG 1: co tinh chen mot byte NUL -> thuoc phai BAO DO.
  const tam = path.join(os.tmpdir(), 'sv-kiem-byte-' + process.pid)
  fs.mkdirSync(tam, { recursive: true })
  const fTho = path.join(tam, 'co-nul.ts')
  fs.writeFileSync(fTho, Buffer.concat([Buffer.from('const A = /[', 'utf8'), Buffer.from([0, 45, 31]), Buffer.from(']/g\n', 'utf8')]))
  const fSach = path.join(tam, 'sach.ts')
  fs.writeFileSync(fSach, 'const A = /[\\x00-\\x1f]/g\n', 'utf8')
  const hongTam = kb.quetThuMuc(tam)
  kiem('DOI CHUNG: file co byte NUL -> thuoc BAO DO dung 1 file', hongTam.length === 1 && path.basename(hongTam[0].duong) === 'co-nul.ts', JSON.stringify(hongTam.map((h) => path.basename(h.duong))))
  kiem('DOI CHUNG: file viet bang chuoi thoat 4 ky tu ASCII -> thuoc BAO SACH', kb.quetFile(fSach).length === 0)
  // DOI CHUNG 2: ban dong goi CHI bat NUL. Ban dang CHAY THAT trong Premiere hom
  // nay (build 19/09) co 2 byte dieu khien cua chinh React (`"\x1f"`, `"\x1e"`) —
  // bat ca hai loai o day la bao do mot ban chay tot.
  const fGoi = path.join(tam, 'goi-react.html')
  fs.writeFileSync(fGoi, Buffer.concat([Buffer.from('<script>const a="', 'utf8'), Buffer.from([31]), Buffer.from('",b="', 'utf8'), Buffer.from([30]), Buffer.from('"</script>\n', 'utf8')]))
  kiem('DOI CHUNG: ban goi co 0x1F/0x1E cua React -> KHONG bao do (chi NUL moi chet)', kb.quetBanGoi(fGoi).length === 0)
  const fGoiNul = path.join(tam, 'goi-nul.html')
  fs.writeFileSync(fGoiNul, Buffer.concat([Buffer.from('<script>const a="', 'utf8'), Buffer.from([0]), Buffer.from('"</script>\n', 'utf8')]))
  kiem('DOI CHUNG: ban goi co NUL -> BAO DO', kb.quetBanGoi(fGoiNul).length === 1)
  fs.rmSync(tam, { recursive: true, force: true })
}

console.log(`\n=== TONG: ${dat} DAT · ${hong} HONG ===`)
process.exit(hong ? 1 : 0)
