'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', { lang, t: (key) => i18n.t(lang, key) })

contextBridge.exposeInMainWorld('lamdep', {
  getData: () => ipcRenderer.invoke('lamdep:get-data'),
  /* Nhan byte PNG (Uint8Array). Luu = FILE MOI canh anh goc, khong bao gio ghi de. */
  luu: (u8) => ipcRenderer.invoke('lamdep:luu', u8),
  chep: (u8) => ipcRenderer.invoke('lamdep:chep', u8),
  close: () => ipcRenderer.send('lamdep:close'),
})
