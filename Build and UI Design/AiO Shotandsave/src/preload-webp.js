'use strict'
/* Preload cua CUA SO AN ma hoa / giai ma WebP (xem src/webp.js). Khong lo gi ra trang; moi viec lam trong preload
   (OffscreenCanvas + createImageBitmap co san, khong can gan vao trang). Diem anh qua IPC la BGRA (NativeImage),
   canvas dung RGBA: doi bang view 32 bit (little-endian). */
const { ipcRenderer } = require('electron')

function doiBgraRgba(nguon, dich) {
  const a = new Uint32Array(nguon.buffer, nguon.byteOffset, nguon.byteLength >> 2)
  const b = new Uint32Array(dich.buffer, dich.byteOffset, dich.byteLength >> 2)
  for (let i = 0; i < a.length; i++) {
    const v = a[i]
    b[i] = (v & 0xff00ff00) | ((v & 0xff) << 16) | ((v >>> 16) & 0xff)
  }
}

async function ma(m) {
  const src = new Uint8Array(m.buf.buffer ? m.buf.buffer.slice(m.buf.byteOffset, m.buf.byteOffset + m.buf.byteLength) : m.buf)
  const rgba = new Uint8ClampedArray(m.w * m.h * 4)
  doiBgraRgba(src, rgba)
  const oc = new OffscreenCanvas(m.w, m.h)
  oc.getContext('2d').putImageData(new ImageData(rgba, m.w, m.h), 0, 0)
  const blob = await oc.convertToBlob({ type: 'image/webp', quality: m.q })
  if (!blob || blob.type !== 'image/webp') return { ok: false, loi: 'trinh duyet tra ' + (blob && blob.type) }
  return { ok: true, buf: new Uint8Array(await blob.arrayBuffer()) }
}

async function giai(m) {
  const src = m.buf.buffer ? new Uint8Array(m.buf.buffer, m.buf.byteOffset, m.buf.byteLength) : m.buf
  const bm = await createImageBitmap(new Blob([src], { type: 'image/webp' }))
  const oc = new OffscreenCanvas(bm.width, bm.height)
  const cx = oc.getContext('2d', { willReadFrequently: true })
  cx.drawImage(bm, 0, 0)
  const d = cx.getImageData(0, 0, bm.width, bm.height)
  const bgra = new Uint8Array(d.data.length)
  doiBgraRgba(new Uint8Array(d.data.buffer), bgra) // phep doi la doi xung: RGBA <-> BGRA
  const kq = { ok: true, w: bm.width, h: bm.height, buf: bgra }
  bm.close()
  return kq
}

ipcRenderer.on('webp:lenh', async (_e, m) => {
  let kq
  try { kq = m.kieu === 'ma' ? await ma(m) : await giai(m) } catch (e) { kq = { ok: false, loi: String((e && e.message) || e) } }
  kq.id = m.id
  ipcRenderer.send('webp:xong', kq)
})
