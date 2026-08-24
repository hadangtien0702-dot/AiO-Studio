'use strict'

/* =========================================================================
   kho.js — noi anh SONG THAT tren dia + cau hinh nho vi tri khay.
   -------------------------------------------------------------------------
   Khay anh chi la CAI NHIN. File that nam trong thu muc nay — do la ly do
   dong cua so ghim / tat app khong lam mat anh, va la nen de sau nay
   keo-tha file ra Premiere / Zalo / Messenger.
   ========================================================================= */

const { app } = require('electron')
const path = require('path')
const fs = require('fs')

/**
 * Thu muc GOC cua tool (noi dat package.json / file .exe khi da dong goi).
 * Khi chua dong goi: `app.getAppPath()` = thu muc du an.
 * Khi da dong goi: ma nguon nam trong app.asar (KHONG ghi duoc) — phai lay
 * thu muc chua file .exe.
 */
function thuMucGoc() {
  return app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath()
}

/**
 * Thu muc luu anh. Mac dinh: <thu muc tool>\Anh chup
 *
 * ☠️ ANH TIEN NGHIEM CAM luu vao `Pictures` mac dinh cua may (24/08).
 * Ly do do duoc: may nay co `Pictures` bi OneDrive doi huong sang
 * `C:\Users\hadan\OneDrive\Pictures` — moi tam chup se tu dong bay len dam may.
 * ⇒ Anh phai nam TRONG thu muc cua tool. Dung `app.getPath('pictures')` o day.
 */
function thuMucAnh() {
  const c = docCauHinh()
  if (c.thuMucAnh) return c.thuMucAnh
  return path.join(thuMucGoc(), 'Anh chup')
}

function baoDamThuMuc(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** Ten file theo thoi diem chup: AiO-2026-08-24-231530.png */
function tenTheoGio(d) {
  const p = (n, k) => String(n).padStart(k || 2, '0')
  return (
    'AiO-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) +
    '-' + p(d.getMilliseconds(), 3) + '.png'
  )
}

/**
 * Ghi mot NativeImage ra file PNG. Tra ve duong dan, hoac null neu that bai
 * (khong nem — mat anh tren dia thi van con anh ghim, dung lam sap app).
 */
function luuAnh(image) {
  try {
    const dir = baoDamThuMuc(thuMucAnh())
    const file = path.join(dir, tenTheoGio(new Date()))
    fs.writeFileSync(file, image.toPNG())
    return file
  } catch (err) {
    console.error('[kho] khong luu duoc anh:', err)
    return null
  }
}

/* ── Cau hinh (vi tri khay, thu muc anh) ─────────────────────────────────
   Nam trong userData, KHONG nam canh ma nguon — de ban cai dat sau nay
   khong ghi de len cau hinh cua nguoi dung. */

function duongDanCauHinh() {
  return path.join(app.getPath('userData'), 'cau-hinh.json')
}

function docCauHinh() {
  try {
    return JSON.parse(fs.readFileSync(duongDanCauHinh(), 'utf8')) || {}
  } catch (e) {
    return {}
  }
}

function ghiCauHinh(patch) {
  try {
    const cur = docCauHinh()
    const next = Object.assign({}, cur, patch)
    fs.mkdirSync(path.dirname(duongDanCauHinh()), { recursive: true })
    fs.writeFileSync(duongDanCauHinh(), JSON.stringify(next, null, 2))
    return next
  } catch (err) {
    console.error('[kho] khong ghi duoc cau hinh:', err)
    return docCauHinh()
  }
}

module.exports = {
  thuMucGoc, thuMucAnh, baoDamThuMuc, luuAnh,
  docCauHinh, ghiCauHinh,
}
