'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pin', {
  /** Nhan anh da crop + padding + kich thuoc DIP. */
  onData: (cb) => ipcRenderer.on('pin:data', (_e, data) => cb(data)),
  copy: () => ipcRenderer.send('pin:copy'),
  close: () => ipcRenderer.send('pin:close'),
  setOpacity: (v) => ipcRenderer.send('pin:opacity', v),
  /* Keo: neo mot lan roi gui delta TUYET DOI (xem preload-shelf.js). */
  dragStart: () => ipcRenderer.send('pin:drag-start'),
  dragTo: (tongDx, tongDy) => ipcRenderer.send('pin:drag-to', tongDx, tongDy),
  dragEnd: () => ipcRenderer.send('pin:drag-end'),
})
