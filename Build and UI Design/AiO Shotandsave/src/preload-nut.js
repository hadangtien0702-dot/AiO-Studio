'use strict'
/* 01/10 Cua so NUT TRON cua khay (src/nut). Main: src/khay-thu.js. */
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('nut', {
  chu: { mo: i18n.t(lang, 'nut.mo'), an: i18n.t(lang, 'nut.an') },
  /** { mat: dataURL anh moi nhat | '', so: so anh trong khay } */
  onCapNhat: (cb) => ipcRenderer.on('nut:cap-nhat', (_e, g) => cb(g)),
  /** Bam nut: mo khay ra (chuyen dong ong kinh). */
  mo: () => ipcRenderer.send('nut:mo'),
  /** Bam x: an han nut tron. */
  an: () => ipcRenderer.send('nut:an'),
  /** 12/10 KEO nut: bat dau · tong do lech tu diem bam (toa do man hinh) · tha chuot. Main: src/khay-thu.js. */
  keoBatDau: () => ipcRenderer.send('nut:keo-bat-dau'),
  keoDen: (dx, dy) => ipcRenderer.send('nut:keo-den', dx, dy),
  keoXong: () => ipcRenderer.send('nut:keo-xong'),
})
