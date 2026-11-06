'use strict'
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('nop', (ab) => ipcRenderer.send('nguon:nop', ab))
contextBridge.exposeInMainWorld('nopLoi', (s) => ipcRenderer.send('nguon:loi', s))
