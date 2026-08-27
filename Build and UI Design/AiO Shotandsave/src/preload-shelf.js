'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key) => i18n.t(lang, key),
  hotkey: ipcRenderer.sendSync('hotkey:display') || '', // phim tat da dinh dang de hien
  khayKieu: ipcRenderer.sendSync('khay:kieu') || 'ngang', // 'ngang' | 'doc'
})

contextBridge.exposeInMainWorld('shelf', {
  onAdd: (cb) => ipcRenderer.on('shelf:add', (_e, item) => cb(item)),
  onRemove: (cb) => ipcRenderer.on('shelf:removed', (_e, id) => cb(id)),
  onClear: (cb) => ipcRenderer.on('shelf:cleared', () => cb()),
  /** Anh ghim vua duoc VE them -> lam moi thumbnail cua dung o do. */
  onUpdate: (cb) => ipcRenderer.on('shelf:update', (_e, item) => cb(item)),

  /** Ghim lai mot anh trong khay len man hinh. */
  pin: (id) => ipcRenderer.send('shelf:pin', id),
  /** Keo file .png that ra app khac (Premiere/Zalo/Mess). */
  startDrag: (id) => ipcRenderer.send('shelf:start-drag', id),
  /** Bo khoi khay (file tren dia GIU NGUYEN). */
  remove: (id) => ipcRenderer.send('shelf:remove', id),
  clear: () => ipcRenderer.send('shelf:clear'),
  openFolder: () => ipcRenderer.send('shelf:open-folder'),
  hide: () => ipcRenderer.send('shelf:hide'),

  /* Keo: neo mot lan roi gui delta TUYET DOI tu luc bat dau — khong gui delta
     tung buoc, vi cong don sai so lam khay phinh ra (vap 24/08). */
  dragStart: () => ipcRenderer.send('shelf:drag-start'),
  dragTo: (tongDx, tongDy) => ipcRenderer.send('shelf:drag-to', tongDx, tongDy),
  dragEnd: () => ipcRenderer.send('shelf:drag-end'),

  savePos: () => ipcRenderer.send('shelf:save-pos'),
})
