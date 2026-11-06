'use strict'
/* 06/11 Cau noi cua man SUA VIDEO (src/sua-video). Khuon = preload-khay.js (i18n) + cau IPC rieng. */
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

contextBridge.exposeInMainWorld('sua', {
  /** { id, ten, url, ms, w, h, coTieng, daBoTieng, conTro: { mau, tre, w, h } | null, dangXuat } hoac null. */
  getData: () => ipcRenderer.invoke('sua:get-data'),
  /** Xuat video moi. tuyChon: { tuMs, denMs, giuTieng, zoom: { bat, muc }, nen: {...} } -> { ok, file, ten, bytes, ms, ... } | { ok: false, loi } */
  xuat: (id, tuyChon) => ipcRenderer.invoke('sua:xuat', id, tuyChon),
  huy: () => ipcRenderer.send('sua:huy'),
  onTienDo: (cb) => ipcRenderer.on('sua:tien-do-ui', (_e, p) => cb(p)),
  /** Keo file moi ra app khac (chi file do phien nay vua xuat). Goi trong nhip dragstart. */
  keo: (file) => ipcRenderer.send('sua:keo', file),
  moThuMuc: (file) => ipcRenderer.send('sua:mo-thu-muc', file),
  dong: () => ipcRenderer.send('sua:dong'),
})
