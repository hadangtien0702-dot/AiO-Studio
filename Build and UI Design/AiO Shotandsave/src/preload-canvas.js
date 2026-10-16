'use strict'
/* 12/10 Cua so CANVAS Y TUONG (src/canvas). Main: src/main.js (khoi "CANVAS Y TUONG") + src/canvas-kho.js. */
const { contextBridge, ipcRenderer } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('cv', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) for (const [k, v] of Object.entries(params)) s = s.split('{' + k + '}').join(String(v))
    return s
  },
  /** -> { tt: { khung: [...], muc: [...] }, loiSo } : doc so + quet thu muc + khop. */
  nap: () => ipcRenderer.invoke('canvas:nap'),
  /** Vi tri moi sau khi keo: { khung: [{ id, x, y, w, h }], vt: { khoa: { x, y } } }. */
  luu: (p) => ipcRenderer.send('canvas:luu', p),
  /** Tao khung = tao thu muc con -> { kq: { ok, id }, tt }. */
  taoKhung: (x, y) => ipcRenderer.invoke('canvas:tao-khung', x, y),
  /** Doi ten khung = doi ten thu muc -> { kq: { ok, loi }, tt }. */
  doiTen: (id, ten) => ipcRenderer.invoke('canvas:doi-ten', id, ten),
  /** [{ khoa, khung: id | null }] -> { kq: [{ khoa, ok, loi, giu }], tt }. */
  xep: (ds) => ipcRenderer.invoke('canvas:xep', ds),
  mo: (khoa) => ipcRenderer.send('canvas:mo', khoa),
  moThuMuc: (id) => ipcRenderer.send('canvas:mo-thu-muc', id || null),
  chup: () => ipcRenderer.send('canvas:chup'),
  onLamMoi: (cb) => ipcRenderer.on('canvas:lam-moi', () => cb()),
})
