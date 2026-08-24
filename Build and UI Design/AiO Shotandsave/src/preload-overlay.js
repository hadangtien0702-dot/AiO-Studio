'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('overlay', {
  /** Nhan anh dong bang + kich thuoc CSS cua man hinh dang chon. */
  onShot: (cb) => ipcRenderer.on('overlay:shot', (_e, data) => cb(data)),
  /** Xac nhan vung chon (CSS px, goc = goc man hinh). */
  confirm: (rect) => ipcRenderer.send('overlay:confirm', rect),
  /** Huy chup. */
  cancel: () => ipcRenderer.send('overlay:cancel'),
})
