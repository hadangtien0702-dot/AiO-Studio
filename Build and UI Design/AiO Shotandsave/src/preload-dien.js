'use strict'
/* 01/10 Cua so SAN DIEN (src/dien): noi chay chuyen dong khay <-> nut tron. Main: src/khay-thu.js. */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dien', {
  /** Lenh tu main: { viec: 'thu' | 'mo' | 'chay' | 'tan' | 'don', ... } */
  onLenh: (cb) => ipcRenderer.on('dien:lenh', (_e, g) => cb(g)),
  /** Bao ve main: 'san-sang' | 'toi' | 'xong' | 'sach'. kem (tuy chon) = so do cua chang vua dien (02/10: do do muot). */
  bao: (ten, kem) => ipcRenderer.send('dien:bao', ten, kem),
})
