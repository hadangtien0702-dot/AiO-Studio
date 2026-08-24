'use strict'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('shelf', {
  onAdd: (cb) => ipcRenderer.on('shelf:add', (_e, item) => cb(item)),
  onRemove: (cb) => ipcRenderer.on('shelf:removed', (_e, id) => cb(id)),
  onClear: (cb) => ipcRenderer.on('shelf:cleared', () => cb()),

  /** Ghim lai mot anh trong khay len man hinh. */
  pin: (id) => ipcRenderer.send('shelf:pin', id),
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
