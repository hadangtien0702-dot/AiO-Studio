'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', { lang, t: (key) => i18n.t(lang, key) })

contextBridge.exposeInMainWorld('overlay', {
  /** Overlay san sang (hien ngay, trong suot): { selftest, origin }. */
  onInit: (cb) => ipcRenderer.on('overlay:init', (_e, data) => cb(data)),
  /** Anh dong bang MOI man da grab xong: { layers: [{x,y,w,h,sf,url}] } —
      url la aioshot:// (buffer o main), KHONG con dataUrl base64 qua IPC. */
  onFrozen: (cb) => ipcRenderer.on('overlay:frozen', (_e, data) => cb(data)),
  /** Xac nhan: { rect } (main cat full-res) HOAC { dataUrl } (da ve shape). */
  confirm: (payload) => ipcRenderer.send('overlay:confirm', payload),
  /** Huy chup. */
  cancel: () => ipcRenderer.send('overlay:cancel'),
  /** Bat dau keo chon — MAIN theo doi chuot he thong (dung moi scale/DPI). */
  dragStart: () => ipcRenderer.send('overlay:drag-start'),
  /** Tha chuot — main chot vung va dieu phoi (annotate / composite / huy). */
  dragEnd: () => ipcRenderer.send('overlay:drag-end'),
  /** Vung chon hien tai (DIP toan cuc) tu main; { rect, laChu } hoac null. */
  onSelRect: (cb) => ipcRenderer.on('overlay:sel-rect', (_e, d) => cb(d)),
  /** Vung chon nam tron man nay -> vao che do ve. rect CUC BO (DIP man nay). */
  onAnnotate: (cb) => ipcRenderer.on('overlay:annotate', (_e, rect) => cb(rect)),
  /** Vung vat ngang nhieu man -> ghep va gui. rect DIP toan cuc. */
  onComposite: (cb) => ipcRenderer.on('overlay:composite', (_e, rect) => cb(rect)),
  /** Bao: toi bat dau keo — cac man khac khoa chuot. */
  lock: () => ipcRenderer.send('overlay:lock'),
  /** Man khac da bat dau keo — man nay bo qua chuot. */
  onLocked: (cb) => ipcRenderer.on('overlay:locked', () => cb()),
  /** Ghi nhat ky chay (qua main). */
  log: (msg) => ipcRenderer.send('overlay:log', msg),
})
