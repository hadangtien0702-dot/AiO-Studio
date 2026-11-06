'use strict'
/* 06/11 Cau noi cua cua so AN xuat video da sua (src/sua-xuat). Khuon = preload-gif.js. Trang chi duoc: nhan MOT viec tu
   main, DOC dung file video cua viec do (file mo san o day, trang khong truyen duong dan), gui byte file moi ve main
   (main ghi vao `<dich>.tam`). Khong co quyen nao khac. */
const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')

let fd = null
let kich = 0

contextBridge.exposeInMainWorld('cau', {
  /** -> { kich, tuyChon, conTro } hoac null. Mo file nguon (chi doc). */
  viec: async () => {
    const v = await ipcRenderer.invoke('sua:viec')
    if (!v || !v.nguon) return null
    fd = fs.openSync(v.nguon, 'r')
    kich = fs.fstatSync(fd).size
    return { kich, tuyChon: v.tuyChon, conTro: v.conTro || null }
  },
  /** Doc `dai` byte tu `viTri` cua file nguon -> Uint8Array DUNG kich thuoc (ban sao rieng). */
  doc: (viTri, dai) => {
    if (fd === null || !(dai > 0) || viTri < 0) return new Uint8Array(0)
    const b = Buffer.allocUnsafe(dai)
    const n = fs.readSync(fd, b, 0, dai, viTri)
    const ra = new Uint8Array(n)
    ra.set(b.subarray(0, n))
    return ra
  },
  /** Ghi `u8` vao file moi tai `viTri` (bo ghep MP4 co quay lai sua dau hop). */
  ghi: (viTri, u8) => ipcRenderer.send('sua:ghi', viTri, u8),
  tienDo: (p) => ipcRenderer.send('sua:tien-do', p),
  /** { khung, w, h, ms, bytes, tieng } */
  xong: (tt) => { dong(); ipcRenderer.send('sua:xong', tt) },
  loi: (chuoi) => { dong(); ipcRenderer.send('sua:loi', String(chuoi)) },
})

function dong() { if (fd !== null) { try { fs.closeSync(fd) } catch (e) {} fd = null } }
