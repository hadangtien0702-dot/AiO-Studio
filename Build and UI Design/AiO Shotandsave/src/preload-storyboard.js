'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), v)
      }
    }
    return s
  },
})

contextBridge.exposeInMainWorld('storyboard', {
  getData: () => ipcRenderer.invoke('storyboard:get-data'),
  /* [ra 28/09] nhan byte PNG (Uint8Array) thay cho dataURL base64 */
  copy: (u8) => ipcRenderer.invoke('storyboard:copy', u8),
  save: (u8) => ipcRenderer.invoke('storyboard:save', u8),
  startDrag: (u8, iconDataUrl) => ipcRenderer.send('storyboard:start-drag', u8, iconDataUrl),
  close: () => ipcRenderer.send('storyboard:close'),
})
