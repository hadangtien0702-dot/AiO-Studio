'use strict'
/* PDF mot trang chua DUNG MOT anh JPEG (12/10, Canvas "Xuat khung ra PDF"). Khong thu vien ngoai: PDF toi thieu 5 doi tuong,
   anh JPEG nhung nguyen (DCTDecode) nen khong nen lai. w, h = kich thuoc anh theo diem anh; trang dung 1 diem anh = 0,5 pt (anh xuat o 2x). */
function taoPdf(jpeg, w, h) {
  if (!Buffer.isBuffer(jpeg) || jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('khong phai JPEG')
  w = Math.round(w); h = Math.round(h)
  if (!(w >= 1 && h >= 1 && w <= 20000 && h <= 20000)) throw new Error('kich thuoc anh sai')
  const pw = Math.max(1, Math.round(w / 2)), ph = Math.max(1, Math.round(h / 2))
  const phan = [], off = []
  let pos = 0
  const them = (b) => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1'); phan.push(buf); pos += buf.length }
  const doiTuong = (n, noiDung, luong) => {
    off[n] = pos
    them(n + ' 0 obj\n' + noiDung)
    if (luong) { them('\nstream\n'); them(luong); them('\nendstream') }
    them('\nendobj\n')
  }
  them('%PDF-1.4\n')
  doiTuong(1, '<< /Type /Catalog /Pages 2 0 R >>')
  doiTuong(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  doiTuong(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>')
  doiTuong(4, '<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>', jpeg)
  const nd = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q'
  doiTuong(5, '<< /Length ' + nd.length + ' >>', Buffer.from(nd, 'latin1'))
  const xref = pos
  let x = 'xref\n0 6\n0000000000 65535 f \n'
  for (let n = 1; n <= 5; n++) x += String(off[n]).padStart(10, '0') + ' 00000 n \n'
  them(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n')
  return Buffer.concat(phan)
}
module.exports = { taoPdf }
