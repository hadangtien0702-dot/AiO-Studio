'use strict'
/* 04/11/2026 MO CUNG WINDOWS (anh bao: "app khong tu mo cung windown"). Goc DA DO: ca src/ khong co lenh
   setLoginItemSettings nao, HKCU\...\Run khong co dong cua app -> tu truoc gio app chua tung tu mo.
   Mac dinh BAT (app song o khay he thong: khong mo thi phim tat chup khong an), tat duoc trong Cai dat.
   Chi Windows + ban dong goi:
   - ban chay tu nguon (isPackaged = false) ma dang ky thi Windows se mo electron.exe tran luc dang nhap;
   - macOS chua do (app ky ad-hoc, so loi #21: chua do tren he kia thi chua bat).
   ☠️ DO 04/11 tren Electron 43.4.1 (bai do bat duoc, doc tai lieu thi khong thay):
      - getLoginItemSettings chi nhin dong mang ten AppUserModelID. Truyen `name` khac thi ghi van vao Run nhung doc lai luon
        openAtLogin false -> KHONG truyen name, de Electron dung AppUserModelID (main.js dat 'com.aiostudio.shotandsave').
      - executableWillLaunchAtLogin luon false du dong dang chay binh thuong -> khong dung de biet "bi chan", tu doc StartupApproved.
   ☠️ Luc boot KHONG ghi lai khi da co dong trong Run: setLoginItemSettings mac dinh enabled = true nen ghi lai se de len lua
      chon "Tat" cua nguoi dung trong Task Manager (Startup apps). Chi nguoi dung bam Bat trong Cai dat moi duoc de len.
   Bai do: npm run test:mocungmay (ghi that vao registry bang ten thu rieng, don dung ten do). */

const { execFileSync } = require('child_process')

const TEN = 'com.aiostudio.shotandsave' // = AppUserModelID trong main.js, la ten dong trong Run
const DUYET = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'

function hoTro(app, o) {
  return (o && o.nen || process.platform) === 'win32' && app.isPackaged === true
}

function thamSo(o) {
  return { path: (o && o.duong) || process.execPath, args: [] }
}

/** Task Manager tat app = ghi dong cung ten vao StartupApproved\\Run, byte dau LE (03, 07); chan (02, 06) la dang cho chay. */
function windowsChan(o) {
  try {
    const ra = execFileSync('reg.exe', ['query', DUYET, '/v', (o && o.ten) || TEN], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    const m = /REG_BINARY\s+([0-9A-Fa-f]{2})/.exec(ra)
    return !!m && (parseInt(m[1], 16) & 1) === 1
  } catch (e) { return false } // reg.exe bao loi khi khong co dong = chua ai tat
}

/** { hoTro, bat, biChan }: biChan = co dong trong Run nhung Windows dang chan (nguoi dung tat trong Task Manager). */
function trangThai(app, o) {
  if (!hoTro(app, o)) return { hoTro: false, bat: false, biChan: false }
  const s = app.getLoginItemSettings(thamSo(o))
  const coDong = !!s.openAtLogin
  return { hoTro: true, bat: coDong, biChan: coDong && windowsChan(o) }
}

/** Nguoi dung bam Bat / Tat trong Cai dat. Doc lai sau khi ghi, tra trang thai THAT (luat 5l: khong bao loi khong co nghia la da ghi). */
function dat(app, kho, ghiLog, bat, o) {
  if (!hoTro(app, o)) return trangThai(app, o)
  const t = thamSo(o)
  app.setLoginItemSettings(Object.assign({ openAtLogin: !!bat, enabled: !!bat }, t))
  kho.ghiCauHinh({ moCungMay: !!bat })
  const kq = trangThai(app, o)
  ghiLog('mo-cung-may: nguoi dung ' + (bat ? 'BAT' : 'TAT') + ' -> co dong ' + kq.bat + ', bi chan ' + kq.biChan)
  if (kq.bat !== !!bat) ghiLog('CANH BAO mo-cung-may: ghi xong doc lai khong khop')
  return kq
}

/** Goi luc boot. Chi ghi khi nguoi dung chua tat va Run chua co dong (lan dau, hoac dong bi mat). */
function khoiDong(app, kho, ghiLog, o) {
  if (!hoTro(app, o)) return trangThai(app, o)
  const c = kho.docCauHinh()
  const dau = trangThai(app, o)
  if (c.moCungMay === false || dau.bat) {
    ghiLog('mo-cung-may: cau hinh ' + c.moCungMay + ', co dong ' + dau.bat + ', bi chan ' + dau.biChan)
    return dau
  }
  app.setLoginItemSettings(Object.assign({ openAtLogin: true }, thamSo(o)))
  kho.ghiCauHinh({ moCungMay: true })
  const kq = trangThai(app, o)
  ghiLog(kq.bat ? 'mo-cung-may: da dang ky' : 'CANH BAO mo-cung-may: dang ky xong doc lai khong thay')
  return kq
}

module.exports = { TEN, hoTro, trangThai, dat, khoiDong }
