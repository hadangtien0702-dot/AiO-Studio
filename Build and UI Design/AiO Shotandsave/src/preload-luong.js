'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('luong', {
  sanSang: (info) => ipcRenderer.send('luong:san-sang', info),
  loi: (msg) => ipcRenderer.send('luong:loi', msg),
  ketThuc: (id) => ipcRenderer.send('luong:ket-thuc', id),
  guiKhung: (d) => ipcRenderer.send('luong:khung', d),
  onLay: (cb) => ipcRenderer.on('luong:lay', (_e, d) => cb(d)),
  /* 28/09 Quay 3s: cat DUNG vung (khong gui ca man raw ~33MB). */
  onCat: (cb) => ipcRenderer.on('luong:cat', (_e, d) => cb(d)),
  guiCat: (d) => ipcRenderer.send('luong:cat-xong', d),
})
