'use strict'
/* 01/10 Cua so KHAY VIDEO (src/video). Khuon = preload-storyboard.js. */
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('i18n', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.split('{' + k + '}').join(String(v))
    }
    return s
  },
})

contextBridge.exposeInMainWorld('video', {
  /** { ds: [{ id, ten, url, ms, w, h, tieng, bytes, taoLuc }], moiId, lang, dangQuay } — moi nhat truoc. */
  getData: () => ipcRenderer.invoke('video:get-data'),
  /** Anh nho (dataURL) cua khung dau -> main giu lam icon luc keo. */
  icon: (id, dataUrl) => ipcRenderer.send('video:icon', id, dataUrl),
  /** Keo file MP4 that ra app khac. Phai goi trong nhip dragstart. */
  keo: (id) => ipcRenderer.send('video:keo', id),
  moThuMuc: (id) => ipcRenderer.send('video:mo-thu-muc', id),
  /** Chon ban dung khi phat / keo tha: coTieng true|false -> { ok, boTieng, bytesXoa, loi }. Lan dau chon Khong tieng
      main tao file "-khong-tieng.mp4" canh ban goc. */
  chonTieng: (id, coTieng) => ipcRenderer.invoke('video:chon-tieng', id, !!coTieng),
  /** Dua file vao Thung rac + go khoi so -> { ok }. */
  xoa: (id) => ipcRenderer.invoke('video:xoa', id),
  close: () => ipcRenderer.send('video:close'),
})
