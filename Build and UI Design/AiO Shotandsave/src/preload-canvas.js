'use strict'
/* 12/10 Cua so CANVAS Y TUONG (src/canvas). Main: src/main.js (khoi "CANVAS Y TUONG") + src/canvas-kho.js. */
const { contextBridge, ipcRenderer, webUtils } = require('electron')
const i18n = require('./i18n')

const lang = ipcRenderer.sendSync('i18n:lang') || 'vi'

contextBridge.exposeInMainWorld('cv', {
  lang,
  t: (key, params) => {
    let s = i18n.t(lang, key)
    if (params) for (const [k, v] of Object.entries(params)) s = s.split('{' + k + '}').join(String(v))
    return s
  },
  /** -> { tt: { khung, muc, vat, noi, net, z, khoa }, loiSo } : doc so + quet thu muc + khop. */
  nap: () => ipcRenderer.invoke('canvas:nap'),
  /** Vi tri moi sau khi keo: { khung: [{ id, x, y, w, h, mau? }], vt: { khoa: { x, y } } }. */
  luu: (p) => ipcRenderer.send('canvas:luu', p),
  /** Thu khong phai anh: { vat, noi, net, z, khoa } (truong nao gui thi thay nguyen truong do). */
  luuVat: (p) => ipcRenderer.send('canvas:luu-vat', p),
  /** Tao khung = tao thu muc con -> { kq: { ok, id }, tt }. */
  taoKhung: (x, y) => ipcRenderer.invoke('canvas:tao-khung', x, y),
  /** Doi ten khung = doi ten thu muc -> { kq: { ok, loi }, tt }. */
  doiTen: (id, ten) => ipcRenderer.invoke('canvas:doi-ten', id, ten),
  /** Xoa khung (chi khi trong thu muc chi con ban noi cua anh goc) -> { kq: { ok, loi }, tt }. */
  xoaKhung: (id) => ipcRenderer.invoke('canvas:xoa-khung', id),
  /** [{ khoa, khung: id | null }] -> { kq: [{ khoa, ok, loi, giu }], tt }. */
  xep: (ds) => ipcRenderer.invoke('canvas:xep', ds),
  /** Duong dan that cua File tha tu Finder (Electron khong con File.path). */
  duongDan: (file) => { try { return webUtils.getPathForFile(file) || '' } catch (e) { return '' } },
  /** Dua file tu ngoai vao thu muc anh. nguon: [duong dan], buf: [{ ten, bytes: ArrayBuffer }] -> { kq: [{ ok, ten }], tt }. */
  nhap: (nguon, buf) => ipcRenderer.invoke('canvas:nhap', nguon || [], buf || []),
  /** Nhan doi tam anh = chep file that -> { kq: [{ ok, tu, khoa }], tt }. */
  nhanDoi: (khoas) => ipcRenderer.invoke('canvas:nhan-doi', khoas),
  /** Cmd+V -> { kieu: 'anh', kq, tt } | { kieu: 'text', text }. */
  dan: () => ipcRenderer.invoke('canvas:dan'),
  /** { text } hoac { anh: khoa } -> clipboard he thong. */
  chep: (p) => ipcRenderer.send('canvas:chep', p),
  keoRa: (khoas) => ipcRenderer.send('canvas:keo-ra', khoas),
  moLink: (url) => ipcRenderer.send('canvas:mo-link', url),
  /** Xem nhanh mot tam: macOS mo Quick Look that -> { ok, native: true }; nguoc lai { ok, native: false } de trang tu phong to. */
  xemNhanh: (khoa) => ipcRenderer.invoke('canvas:xem-nhanh', khoa),
  /** Mui ten trai / phai bam luc Quick Look cua macOS dang mo (main chuyen sang): cb(-1 | 1). */
  onXemTiep: (cb) => ipcRenderer.on('canvas:xem-tiep', (_e, h) => cb(h)),
  /** loai 'png' | 'pdf', bytes = PNG (png) hoac JPEG (pdf), w / h = diem anh -> { ok, ten } | { ok: false, huy }. */
  xuat: (loai, bytes, ten, w, h) => ipcRenderer.invoke('canvas:xuat', loai, bytes, ten, w, h),
  mo: (khoa) => ipcRenderer.send('canvas:mo', khoa),
  moThuMuc: (id) => ipcRenderer.send('canvas:mo-thu-muc', id || null),
  chup: () => ipcRenderer.send('canvas:chup'),
  onLamMoi: (cb) => ipcRenderer.on('canvas:lam-moi', () => cb()),
})
