'use strict'
/* 13/11 BAN CHU (anh Tien: "em cai ban moi tren may anh, ban khong can key").
   Boi canh: may nha cua anh mat file ban quyen vi sap nguon (so loi #30), app ve dung thu roi het han 12/11: chinh chu san pham bi
   khoa chup tren may minh (run-log 12/11 08:53 va 09:06: "capture: KHOA").
   Cach lam, giu cho bo cai ban cho khach SACH:
   - Ma nguon va bo cai phat hanh KHONG co gi bo khoa: package.json trong repo khong co truong `aioBanChu`, `npm run dist` /
     `dist:mac` khong them truong do (bai do scripts/test/do-ban-chu.cjs gac).
   - Chi `node scripts/cai-tai-cho.mjs --ban-chu` (nap tai cho vao may dang ngoi) moi them `aioBanChu` = DAU VAN TAY CUA MAY DO
     vao package.json BEN TRONG ban dong goi (electron-builder extraMetadata). App chi bo khoa khi dau van tay trong goi trung dau
     van tay may dang chay -> chep ban do sang may khac thi van hoi ma nhu thuong.
   - Repo nay cong khai: ai doc ma cung tu dung duoc mot ban khong khoa, nen co che nay khong mo them cua nao; no chi bao dam
     ban anh dung va ban khach mua la hai ban khac nhau.
   Chi bo KHOA CHUP. Man Cai dat van hien trang thai dung thu / ma nhu cu (khong gia lam "da kich hoat"). */
const crypto = require('crypto')

function maMay(os) {
  os = os || require('os')
  let ten = ''
  try { ten = os.userInfo().username } catch (e) {}
  return crypto.createHash('sha256').update(['aio-ban-chu', os.hostname(), ten, os.homedir(), os.platform(), os.arch()].join('|')).digest('hex').slice(0, 32)
}

/* pkg = noi dung package.json cua ban dang chay. Chi nhan CHUOI 32 ky tu trung dau van tay may nay (true / 1 / chuoi khac = khong). */
function laBanChu(pkg, os) {
  const v = pkg && pkg.aioBanChu
  return typeof v === 'string' && v.length === 32 && v === maMay(os)
}

module.exports = { maMay, laBanChu }
