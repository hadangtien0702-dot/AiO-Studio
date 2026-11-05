'use strict'
/* 06/10 Cau noi cua cua so AN xuat GIF (src/gif). Trang chi duoc: nhan MOT viec tu main, DOC dung file video cua viec
   do (file mo san o day, trang khong truyen duong dan), gui tung khuc GIF ve main. Khong co quyen nao khac. */
const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')

let fd = null
let kich = 0

contextBridge.exposeInMainWorld('cau', {
  /** -> { kich, buocMs, canhDai, toiDaMs, nguong } hoac null. Mo file nguon (chi doc). */
  viec: async () => {
    const v = await ipcRenderer.invoke('gif:viec')
    if (!v || !v.nguon) return null
    fd = fs.openSync(v.nguon, 'r')
    kich = fs.fstatSync(fd).size
    return { kich, buocMs: v.buocMs, canhDai: v.canhDai, toiDaMs: v.toiDaMs, nguong: v.nguong, dang: v.dang, tuKiem: !!v.tuKiem, soiMoc: v.soiMoc }
  },
  /** Doc `dai` byte tu `viTri` cua file nguon -> Uint8Array DUNG kich thuoc (ban sao rieng: contextBridge chep ca
      vung nho goc cua mang, Buffer nho lai nam trong be chung 8 KB). */
  doc: (viTri, dai) => {
    if (fd === null || !(dai > 0) || viTri < 0) return new Uint8Array(0)
    const b = Buffer.allocUnsafe(dai)
    const n = fs.readSync(fd, b, 0, dai, viTri)
    const ra = new Uint8Array(n)
    ra.set(b.subarray(0, n))
    return ra
  },
  /** Mot khuc byte GIF, theo dung thu tu ghi. */
  khuc: (u8) => ipcRenderer.send('gif:khuc', u8),
  tienDo: (p) => ipcRenderer.send('gif:tien-do', p),
  /** { khung, w, h, ms, bytes, cat } */
  xong: (tt) => { dong(); ipcRenderer.send('gif:xong', tt) },
  loi: (chuoi) => { dong(); ipcRenderer.send('gif:loi', String(chuoi)) },
})

function dong() { if (fd !== null) { try { fs.closeSync(fd) } catch (e) {} fd = null } }
