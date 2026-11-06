'use strict'

/* GHI BEN: file tam -> ep xuong dia (fsync) -> doi ten.
   Vi sao (06/11/2026, do tren may nha): may sap nguon 4 lan trong 2 tuan; `ban-quyen.json` thanh 325 byte TOAN SO 0, app ve dung thu.
   Chi tmp + rename thi ten file moi len dia truoc, noi dung con nam trong bo dem: mat dien la file dung co ma rong ruot.
   Dung cho file nho ma mat la dau (ban quyen, cau hinh, so video, bo cuc Canvas) va anh bi ghi de. KHONG dung cho anh moi chup:
   fsync chan luong chinh, va anh moi mat thi mat dung tam do, khong dung vao anh cu. */
function ghiBen(file, duLieu, fs = require('fs')) {
  const tam = file + '.tmp'
  const fd = fs.openSync(tam, 'w')
  try {
    fs.writeFileSync(fd, duLieu)
    fs.fsyncSync(fd)
  } finally {
    fs.closeSync(fd)
  }
  fs.renameSync(tam, file)
}

module.exports = { ghiBen }
