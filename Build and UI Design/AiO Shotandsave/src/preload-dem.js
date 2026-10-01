'use strict'
/* 01/10 Dong ho QUAY VIDEO (src/dem/quay.html): chi mot viec — bao main nguoi dung bam Dung. */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dem', {
  dung: () => ipcRenderer.send('quay:dung'),
})
