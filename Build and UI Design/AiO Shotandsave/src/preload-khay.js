'use strict'
/* 01/10 Cua so KHAY GOP (src/khay): mot cua so, 2 the Storyboard | Video.
   i18n khai MOT lan o day; cau noi cua tung the nam o 2 file phan (window.storyboard, window.video). */
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.split('{' + k + '}').join(String(v))
    }
    return s
  },
})

require('./preload-storyboard')
require('./preload-video')
