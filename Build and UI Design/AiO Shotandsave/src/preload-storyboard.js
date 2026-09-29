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
  // 29/09 keo CA DAI: ve san (byte PNG giu o main) roi dragstart chi gui id -> main startDrag ngay
  chuanBiKeo: (id, ver, u8, iconDataUrl, msVe) => ipcRenderer.invoke('storyboard:chuan-bi-keo', id, ver, u8, iconDataUrl, msVe),
  keoDai: (id, ver) => ipcRenderer.send('storyboard:keo-dai', id, ver),
  close: () => ipcRenderer.send('storyboard:close'),
  // 29/09 khay Storyboard: xoa 1 khung trong dai / xoa ca dai (kho dai trong userData)
  boKhung: (id, seq) => ipcRenderer.invoke('storyboard:bo-khung', id, seq),
  xoaDai: (id) => ipcRenderer.invoke('storyboard:xoa-dai', id),
})
