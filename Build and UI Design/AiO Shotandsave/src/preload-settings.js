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
  /** Doi ngon ngu 'vi' | 'en' — main nap lai cua so de dich. */
  setLang: (l) => ipcRenderer.invoke('settings:set-lang', l),
  /** Dong cua so cai dat (frameless nen phai tu goi). */
  close: () => ipcRenderer.send('settings:close'),
})
