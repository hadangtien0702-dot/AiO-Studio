'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', { lang, t: (key) => i18n.t(lang, key) })

contextBridge.exposeInMainWorld('pin', {
  /** Nhan anh da crop + padding + kich thuoc DIP. */
  onData: (cb) => ipcRenderer.on('pin:data', (_e, data) => cb(data)),
  copy: () => ipcRenderer.send('pin:copy'),
  close: () => ipcRenderer.send('pin:close'),
  /** Keo file .png that ra app khac (Premiere/Zalo/Mess). */
  startDrag: () => ipcRenderer.send('pin:start-drag'),
  /** Da ve khung/mui ten -> ghi de file + cap nhat thumbnail khay. */
  saveEdit: (dataUrl) => ipcRenderer.send('pin:save-edit', dataUrl),
  setOpacity: (v) => ipcRenderer.send('pin:opacity', v),
  /* Keo: neo mot lan roi gui delta TUYET DOI (xem preload-shelf.js). */
  dragStart: () => ipcRenderer.send('pin:drag-start'),
  dragTo: (tongDx, tongDy) => ipcRenderer.send('pin:drag-to', tongDx, tongDy),
  dragEnd: () => ipcRenderer.send('pin:drag-end'),
})
