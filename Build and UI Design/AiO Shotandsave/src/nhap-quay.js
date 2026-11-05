'use strict'
/* NGUON SU KIEN CHUOT + PHIM cho tinh nang "hien cu bam chuot / phim" luc QUAY VIDEO (05/11).

   Vi sao nguon nay nam o tien trinh chinh va chi GUI SU KIEN: viec VE vong tron / the phim lam o renderer luong,
   VAO KHUNG HINH dang ghi (xem veNhap trong src/luong/luong.js). Tuyet doi KHONG dung cua so trong suot phu len vung
   dang quay: so loi "cua so trong suot phu len video tang toc phan cung -> video DEN" (xem CLAUDE.md app, quay 3 giay).

   Nguon that: thu vien `uiohook-napi` (hook toan cuc cua he dieu hanh, co ban dung san cho win32 x64 + darwin x64/arm64).
   Day la thu vien npm DUY NHAT them cho tinh nang nay (khai o optionalDependencies): Electron khong co API nao nghe
   chuot/phim toan cuc, tu viet bang PowerShell (GetAsyncKeyState) thi giong het phan mem ghi phim va Windows Defender
   hay bao dong. Khong co thu vien (chua cai / khong nap duoc) thi tinh nang tu TAT, van quay binh thuong.
   Mac can cap quyen "Giam sat dau vao" (Input Monitoring) cho app — CHUA do tren Mac.

   RIENG TU: phim thuong (chu, so, dau cau, Space) KHONG BAO GIO roi khoi file nay — de nguoi quay go mat khau khong bi
   hien len video. Chi di tiep: to hop co Ctrl / Alt / Cmd (vd Ctrl + C) va phim dac biet (Enter, Esc, Tab, mui ten, F1-F24...).

   Dau ra (onSuKien): { loai: 'chuot', x, y, t }  x,y = toa do DIP toan cuc cua man hinh; t = Date.now()
                      { loai: 'phim', nhan: 'Ctrl + C', t } */

const MAC = process.platform === 'darwin'
const TEN_MOD = MAC ? { ctrl: 'Ctrl', alt: 'Option', shift: 'Shift', meta: 'Cmd' } : { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Win' }
const LA_MOD = new Set(['Ctrl', 'CtrlRight', 'Alt', 'AltRight', 'Shift', 'ShiftRight', 'Meta', 'MetaRight', 'CapsLock'])
const DAC_BIET = new Set(['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'])
const HIEN_TEN = { Escape: 'Esc', ArrowLeft: '←', ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓', PageUp: 'PgUp', PageDown: 'PgDn', Backspace: 'Backspace' }
const LA_PHIM_F = /^F(\d|1\d|2[0-4])$/

/** Nhan hien tren video cho mot lan bam phim, hoac null neu KHONG duoc hien (phim thuong, rieng tu).
    mod = { ctrl, alt, shift, meta }; ten = ten phim kieu uiohook ('C', 'Enter', 'F5', ...). */
function nhanPhim(mod, ten) {
  if (!ten || LA_MOD.has(ten)) return null
  const m = mod || {}
  const coLenh = !!(m.ctrl || m.alt || m.meta)
  const dacBiet = DAC_BIET.has(ten) || LA_PHIM_F.test(ten)
  if (!coLenh && !dacBiet) return null // chu / so / dau cau / Space: khong bao gio hien
  const phan = []
  if (m.ctrl) phan.push(TEN_MOD.ctrl)
  if (m.alt) phan.push(TEN_MOD.alt)
  if (m.shift) phan.push(TEN_MOD.shift)
  if (m.meta) phan.push(TEN_MOD.meta)
  phan.push(HIEN_TEN[ten] || (ten.length === 1 ? ten.toUpperCase() : ten))
  return phan.join(' + ')
}

let nghe = null   // onSuKien dang nghe (null = khong ai nghe)
let nguon = null  // { ten, dung() }
let nguonGia = process.env.AIO_NHAP_GIA === '1' // bai do: khong nap hook that, chi nhan gia()

function laySuKien(sk) { if (nghe) { try { nghe(sk) } catch (e) {} } }

function nguonThat() {
  let u
  try { u = require('uiohook-napi') } catch (e) { return { ok: false, loi: 'khong nap duoc uiohook-napi: ' + (e && e.message) } }
  const { uIOhook, UiohookKey } = u
  const tenPhim = new Map(Object.entries(UiohookKey).map(([ten, ma]) => [ma, ten]))
  const { screen } = require('electron')
  const doiDip = (x, y) => {
    // Windows: hook tra toa do VAT LY; Electron dung DIP. Mac: da la diem (point) = DIP.
    if (process.platform === 'win32') { try { return screen.screenToDipPoint({ x, y }) } catch (e) {} }
    return { x, y }
  }
  const khiChuot = (e) => { const p = doiDip(e.x, e.y); laySuKien({ loai: 'chuot', x: p.x, y: p.y, t: Date.now() }) }
  const khiPhim = (e) => {
    const nhan = nhanPhim({ ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey }, tenPhim.get(e.keycode))
    if (nhan) laySuKien({ loai: 'phim', nhan, t: Date.now() })
  }
  try {
    uIOhook.on('mousedown', khiChuot)
    uIOhook.on('keydown', khiPhim)
    uIOhook.start()
  } catch (e) {
    try { uIOhook.removeListener('mousedown', khiChuot); uIOhook.removeListener('keydown', khiPhim) } catch (e2) {}
    return { ok: false, loi: 'khong bat duoc hook: ' + (e && e.message) }
  }
  return {
    ok: true, ten: 'uiohook',
    dung() {
      try { uIOhook.removeListener('mousedown', khiChuot); uIOhook.removeListener('keydown', khiPhim); uIOhook.stop() } catch (e) {}
    },
  }
}

/** Bat nghe. Tra { ok, nguon } hoac { ok: false, loi }. Chi MOT nguoi nghe tai mot luc. */
function bat(onSuKien) {
  dung()
  if (nguonGia) {
    nghe = onSuKien
    nguon = { ten: 'gia', dung() {} }
    return { ok: true, nguon: 'gia' }
  }
  const n = nguonThat()
  if (!n.ok) return n
  nghe = onSuKien
  nguon = n
  return { ok: true, nguon: n.ten }
}

function dung() {
  const n = nguon
  nguon = null; nghe = null
  if (n) n.dung()
}

/** CHI CHO BAI DO: bat nguon gia (khong nap hook that, khong dong vao chuot/phim cua nguoi dung). */
function datNguonGia(bat_) { nguonGia = !!bat_ }

/** CHI CHO BAI DO: dua mot su kien vao nhu the hook vua bao. phim thi di qua dung bo loc rieng tu (nhanPhim). */
function gia(sk) {
  if (!nghe) return false
  if (sk.loai === 'phim') {
    const nhan = nhanPhim(sk.mod, sk.ten)
    if (nhan) laySuKien({ loai: 'phim', nhan, t: sk.t || Date.now() })
    return !!nhan
  }
  laySuKien({ loai: 'chuot', x: sk.x, y: sk.y, t: sk.t || Date.now() })
  return true
}

module.exports = { bat, dung, nhanPhim, datNguonGia, gia }
