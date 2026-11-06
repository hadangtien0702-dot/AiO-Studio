'use strict'
/* NHUNG LUAT NHO TACH TU main.js DE DO DUOC (06/11, sua 4 loi Codex soat). Khong phu thuoc Electron.
   main.js chi con goi cac ham nay; bai do scripts/test/do-luat-main.cjs chay chung chinh ham do, kem ban CU de DOI CHUNG. */

/* Cua so nao DUOC nap lai khi doi ngon ngu (loi 4): cua so AN khong co chu de dich thi KHONG nap lai.
   02/10: luong (bo quay + luong chup chay san), dem (dong ho / vien quay), dien (san dien cua khay).
   06/11: them gif (xuat GIF: nap lai giua chung la bo ma hoa chay lai tu dau ma van noi vao file .tam cu) va
   sua-xuat (xuat video da sua: cung ly do). */
function duocNapLai(url) {
  if (/^data:/i.test(String(url || ''))) return false // cua so an ma hoa WebP: nap lai la cat ngang viec dang lam (06/11 soat)
  return !/\/src\/(luong|dem|dien|gif|sua-xuat)\//.test(String(url || '').replace(/\\/g, '/'))
}

/* Bam phim tat chup (loi 5): 'dung-quay' | 'dung-cuon' | 'bo-qua-quay3s' | 'tiep'.
   Dang QUAY 3 GIAY Storyboard thi khong mo man chon vung: overlay phu anh dong bang len vung dang lay mau. */
function quyetDinhPhimChup(t) {
  if (t.ghiHinh) return 'dung-quay'
  if (t.cuon) return 'dung-cuon'
  if (t.dangQuay) return 'bo-qua-quay3s'
  return 'tiep'
}

/* Bo nho "da ve san" cua cac dai Storyboard de keo (loi 6): giu toi da `toiDa`, muc moi nhat o cuoi.
   them() tra ve danh sach id BI LOAI de main bao giao dien quen chung (giao dien nho "da ve san" thi se khong gui lai du lieu). */
function taoBoVeSan(toiDa) {
  const m = new Map()
  return {
    them(id, rec) {
      m.delete(id); m.set(id, rec)
      const boDi = []
      while (m.size > toiDa) { const k = m.keys().next().value; m.delete(k); boDi.push(k) }
      return boDi
    },
    lay: (id) => m.get(id),
    size: () => m.size,
  }
}

/* Co "dang tao GIF" cua tung video (loi 7). Chon ban khac trong luc dang tao thi GIF xong khong duoc gianh lai lua chon.
   batDau(id) tra false neu video nay DANG tao GIF roi (yeu cau thu hai bi tu choi NGAY, khong dong vao co cua yeu cau dau). */
function taoCoGif() {
  const dang = new Set(), boChon = new Set()
  return {
    dangTao: (id) => dang.has(id),
    batDau(id) { if (dang.has(id)) return false; dang.add(id); boChon.delete(id); return true },
    chonBanKhac(id) { if (dang.has(id)) boChon.add(id) },
    /* Ket thuc: tra true neu nguoi dung da chon ban khac trong luc tao. */
    ketThuc(id) { dang.delete(id); return boChon.delete(id) },
  }
}

/* Nen anh do renderer ghim gui len de doc chu (soat dot 3, muc 7): chi nhan dataURL PNG hop le va khong qua lon.
   Tra Buffer PNG, hoac null (khong hop le -> main tu choi, KHONG roi ve doc anh cu). */
const TOI_DA_NEN_OCR = 120 * 1024 * 1024
function pngTuDataUrl(s, toiDa) {
  if (typeof s !== 'string' || s.length > (toiDa || TOI_DA_NEN_OCR) * 1.4) return null
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(s)
  if (!m) return null
  const b = Buffer.from(m[1], 'base64')
  return b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? b : null
}

module.exports = { duocNapLai, quyetDinhPhimChup, taoBoVeSan, taoCoGif, pngTuDataUrl }
