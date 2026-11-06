'use strict'
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), v)
      }
    }
    return s
  },
})

/* 06/11: phim chup DANG DAT + nut Chup ngay cho trang trong. Dung invoke (khong sendSync) de bai do khong dung main that van nap duoc. */
contextBridge.exposeInMainWorld('hotkeyInfo', {
  lay: () => ipcRenderer.invoke('hotkey:lay'),
  chupNgay: () => ipcRenderer.send('chup-ngay'),
})

contextBridge.exposeInMainWorld('timAnh', {
  tim: (q) => ipcRenderer.invoke('tim-anh:tim', q),
  thumb: (duong) => ipcRenderer.invoke('tim-anh:thumb', duong),
  trangThai: () => ipcRenderer.invoke('tim-anh:trang-thai'),
  tamDung: (b) => ipcRenderer.invoke('tim-anh:tam-dung', b),
  lamMoi: () => ipcRenderer.invoke('tim-anh:lam-moi'),
  ghim: (duong) => ipcRenderer.send('tim-anh:ghim', duong),
  moThuMuc: (duong) => ipcRenderer.send('tim-anh:mo-thu-muc', duong),
  keo: (duong) => ipcRenderer.send('tim-anh:keo', duong),
  close: () => ipcRenderer.send('tim-anh:close'),
  onTienDo: (cb) => ipcRenderer.on('tim-anh:tien-do', (_e, s) => cb(s)),
  onLamMoi: (cb) => ipcRenderer.on('tim-anh:lam-moi', () => cb()),
})
