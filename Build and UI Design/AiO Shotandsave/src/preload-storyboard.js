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
  copy: (dataUrl) => ipcRenderer.invoke('storyboard:copy', dataUrl),
  save: (dataUrl) => ipcRenderer.invoke('storyboard:save', dataUrl),
  startDrag: (dataUrl) => ipcRenderer.send('storyboard:start-drag', dataUrl),
  close: () => ipcRenderer.send('storyboard:close'),
  dragWindow: (dx, dy) => ipcRenderer.send('storyboard:drag-window', dx, dy),
})
