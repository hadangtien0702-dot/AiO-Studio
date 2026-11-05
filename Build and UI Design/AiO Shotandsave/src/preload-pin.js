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
  /** 05/11: mo cua so Lam dep anh voi anh dang ghim (luu FILE MOI, khong ghi de). */
  lamDep: () => ipcRenderer.send('pin:lam-dep'),
  /** Keo file .png that ra app khac (Premiere/Zalo/Mess). */
  startDrag: () => ipcRenderer.send('pin:start-drag'),
  /** Da ve khung/mui ten -> ghi de file + cap nhat thumbnail khay. */
  saveEdit: (dataUrl, chep) => ipcRenderer.send('pin:save-edit', dataUrl, chep),
  setOpacity: (v) => ipcRenderer.send('pin:opacity', v),
  /** 05/11 Che thong minh: doc chu CA ANH ghim kem toa do tung tu / dong (pixel anh that). */
  ocrTu: () => ipcRenderer.invoke('pin:ocr-tu'),
  /* Keo: neo mot lan roi gui delta TUYET DOI (xem preload-shelf.js). */
  dragStart: () => ipcRenderer.send('pin:drag-start'),
  dragTo: (tongDx, tongDy) => ipcRenderer.send('pin:drag-to', tongDx, tongDy),
  dragEnd: () => ipcRenderer.send('pin:drag-end'),
  /** 14/09: nhat ky chan doan che do ve (anh Tien: khong ve duoc tren anh ghim, chua tai lap). */
  log: (m) => ipcRenderer.send('pin:log', String(m)),
  /** Cap nhat cau hinh khi dang mo: { lamMoKieu }. */
  onUpdateConfig: (cb) => ipcRenderer.on('pin:update-config', (_e, d) => cb(d)),
})
