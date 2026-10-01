'use strict'
/* 01/10 Cua so KHAY VIDEO (src/video). Khuon = preload-storyboard.js. */
const { contextBridge, ipcRenderer } = require('electron')
/* 01/10 GOP KHAY: file nay la PHAN cau noi Video cua src/preload-khay.js (i18n khai o do). Khong dung lam preload rieng. */

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
})
