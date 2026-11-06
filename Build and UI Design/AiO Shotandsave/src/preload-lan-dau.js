'use strict'
/* The lan chay dau (06/11): i18n co tham so + 3 lenh gui main. */
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')
const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) for (const [k, v] of Object.entries(params)) s = s.split('{' + k + '}').join(String(v))
    return s
  },
})
contextBridge.exposeInMainWorld('lanDau', {
  cao: (h) => ipcRenderer.send('lan-dau:cao', h),
  dong: () => ipcRenderer.send('lan-dau:dong'),
  doiPhim: () => ipcRenderer.send('lan-dau:doi-phim'),
})
