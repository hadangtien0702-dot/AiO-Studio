'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', { lang, t: (key) => i18n.t(lang, key) })

contextBridge.exposeInMainWorld('overlay', {
  /** Overlay san sang (hien ngay, trong suot): { selftest, origin }. */
  onInit: (cb) => ipcRenderer.on('overlay:init', (_e, data) => cb(data)),
  /** Anh dong bang MOI man da grab xong: { layers: [{x,y,w,h,sf,dataUrl}] }. */
  onFrozen: (cb) => ipcRenderer.on('overlay:frozen', (_e, data) => cb(data)),
  /** Xac nhan: { rect } (main cat full-res) HOAC { dataUrl } (da ve shape). */
  confirm: (payload) => ipcRenderer.send('overlay:confirm', payload),
  /** Huy chup. */
  cancel: () => ipcRenderer.send('overlay:cancel'),
})
