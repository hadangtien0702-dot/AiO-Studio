'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key) => i18n.t(lang, key),
})

contextBridge.exposeInMainWorld('settings', {
  /** Lay phim tat hien tai + co phai Mac + thu muc luu + ngon ngu. */
  get: () => ipcRenderer.invoke('settings:get'),
  /** Doi phim tat. Tra { ok, hotkey } — that bai giu phim cu. */
  setHotkey: (accel) => ipcRenderer.invoke('settings:set-hotkey', accel),
  /** Ve phim tat mac dinh. */
  reset: () => ipcRenderer.invoke('settings:reset'),
  /** Chon thu muc luu anh (mo hop thoai). Tra { folder, huy? }. */
  pickFolder: () => ipcRenderer.invoke('settings:pick-folder'),
  /** Mo thu muc luu anh hien tai trong Explorer. */
  openFolder: () => ipcRenderer.invoke('settings:open-folder'),
  /** Doi dinh dang/chat luong anh: { anhLoai, anhChatLuong }. */
  setAnh: (d) => ipcRenderer.invoke('settings:set-anh', d),
  /** Doi kieu khay: 'ngang' | 'doc'. */
  setKhay: (kieu) => ipcRenderer.invoke('settings:set-khay', kieu),
  /** So anh tu dong nap vao khay: 0 | 5 | 10 | 20. */
  setKhaySoAnh: (n) => ipcRenderer.invoke('settings:set-khay-so-anh', n),
  /** So giay cho roi khay tu thu ve nut tron: 5 | 10 | 15. */
  setKhayTuThu: (n) => ipcRenderer.invoke('settings:set-khay-tu-thu', n),
  /** Doi kieu lam mo: 'mosaic' (Kham o) | 'blur' (Mo min) | 'kin' (To kin, 04/10). */
  setLamMo: (kieu) => ipcRenderer.invoke('settings:set-lam-mo', kieu),
  /** Doi ngon ngu 'vi' | 'en' — main nap lai cua so de dich. */
  setLang: (l) => ipcRenderer.invoke('settings:set-lang', l),
  /** Dong cua so cai dat (frameless nen phai tu goi). */
  close: () => ipcRenderer.send('settings:close'),
  /** Keo di chuyen cua so bang thanh tieu de (16/09, thay app-region drag bi nhay). */
  dragStart: () => ipcRenderer.send('settings:drag-start'),
  dragTo: (tongDx, tongDy) => ipcRenderer.send('settings:drag-to', tongDx, tongDy),
  dragEnd: () => ipcRenderer.send('settings:drag-end'),
})

/* Ban quyen (24/09): dung thu 14 ngay + ma Polar */
contextBridge.exposeInMainWorld('banQuyen', {
  get: () => ipcRenderer.invoke('bq:get'),
  kichHoat: (ma) => ipcRenderer.invoke('bq:kich-hoat', ma),
  huy: () => ipcRenderer.invoke('bq:huy'),
  mua: () => ipcRenderer.invoke('bq:mua'),
})
