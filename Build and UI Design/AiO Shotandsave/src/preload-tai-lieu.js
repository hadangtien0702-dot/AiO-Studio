'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'
contextBridge.exposeInMainWorld('i18n', { lang, t: (key) => i18n.t(lang, key) })

contextBridge.exposeInMainWorld('taiLieu', {
  /** { tieuDe, khay: [{khoa, ten, thumb, w, h}], buoc: [{khoa, ten, thumb, moTa}], anhMat } */
  lay: () => ipcRenderer.invoke('tl:lay'),
  luuNhap: (d) => ipcRenderer.invoke('tl:luu-nhap', d),
  /** Mo hop thoai chon anh tu may. Tra { ds: [{khoa, ten, thumb, w, h}] } */
  themFile: () => ipcRenderer.invoke('tl:them-file'),
  /** { kieu: 'html' | 'md' | 'pdf', tieuDe, buoc: [{khoa, moTa}] } -> { ok, duong, ten } | { huy } | { ok: false, loi } */
  xuat: (d) => ipcRenderer.invoke('tl:xuat', d),
  moThuMuc: (p) => ipcRenderer.send('tl:mo-thu-muc', p),
  close: () => ipcRenderer.send('tl:close'),
  onLamMoi: (cb) => ipcRenderer.on('tl:lam-moi', () => cb()),
  dragStart: () => ipcRenderer.send('tl:drag-start'),
  dragTo: (dx, dy) => ipcRenderer.send('tl:drag-to', dx, dy),
  dragEnd: () => ipcRenderer.send('tl:drag-end'),
})
