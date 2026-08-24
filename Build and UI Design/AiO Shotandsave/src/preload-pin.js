'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pin', {
  /** Nhan anh da crop + padding + kich thuoc DIP. */
  onData: (cb) => ipcRenderer.on('pin:data', (_e, data) => cb(data)),
  copy: () => ipcRenderer.send('pin:copy'),
  close: () => ipcRenderer.send('pin:close'),
  setOpacity: (v) => ipcRenderer.send('pin:opacity', v),
  /** Keo cua so ghim di (delta pixel man hinh). */
  move: (dx, dy) => ipcRenderer.send('pin:move', dx, dy),
})
