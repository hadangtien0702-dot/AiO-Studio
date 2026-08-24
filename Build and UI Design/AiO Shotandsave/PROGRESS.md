# PROGRESS — AiO Shot & Save

## 2026-08-24 23:25 — SUA LOI LAM SAP APP khi dong cua so ghim

Anh Tien chay ban that va gap hop thoai Electron:
`TypeError: Object has been destroyed  at main.js:284`.

**Goc:** handler `win.on('closed')` doc `win.webContents.id` — luc 'closed' ban
ra thi `webContents` DA bi huy, doc thuoc tinh la nem. Sua: nho `const wcId =
win.webContents.id` NGAY khi tao cua so, handler chi dung bien do.

☠️ **Bai hoc dat hon ca loi:** selftest truoc do bao "chay sach" nhung SAI —
no `forceQuit()` ngay sau khi ghim, nen hop thoai loi bi nuot, va duong
"nguoi dung dong cua so ghim" chua he duoc chay. Da sua hai cho:
1. Dev/selftest dat `process.on('uncaughtException')` ghi ra `.selftest/errors.txt`
   — loi khong con im lang duoc. (Ban that KHONG dat, de Electron hien hop thoai.)
2. Selftest nay THAT SU dong cua so ghim truoc khi thoat — chay dung duong da sap.

Chay lai: `errors.txt` khong sinh ra => sach that. Bai hoc chung: **selftest ma
khong chay duong nguoi dung thuc su bam thi chi la build sach doi lot do kiem.**

## 2026-08-24 23:18 — v0.1.0: dung khung + chup vung chon + ghim sticky (CHAY DUOC)

- Dung app desktop Electron 43.4.1 (KHONG phai CEP panel — xem CLAUDE.md, muc
  "Vi sao khong lam CEP").
- Luong da chay that (verify bang selftest, khong phai build sach):
  chup man hinh duoi con tro (desktopCapturer, do phan giai that theo
  scaleFactor) -> overlay opaque phu kin man hinh, ve anh dong bang + lam mo +
  chi dan -> keo chon vung -> crop anh goc -> tao cua so GHIM alwaysOnTop tai
  dung cho, bo goc + bong + vien theo token AiO.
- Cua so ghim: keo di chuyen (gui delta qua IPC), Copy (clipboard), Dong,
  Ctrl+lan chuot = chinh do mo. Thanh cong cu hien khi re chuot.
- Phim tat toan cuc: Ctrl+Shift+S. Song o khay he thong (tray, icon = AiO logo),
  bam trai tray = chup ngay. Dong het cua so KHONG thoat app.
- Dung lai design-system: assets/tokens.css + assets/fonts/Inter.woff2 (copy tu
  design-system, phong bien mat khi dong bo). Mau accent cam, nen toi.
- Verify: them co `--selftest` — app tu chup, tu chon vung giua, tu ghim, tu
  luu .selftest/selftest-overlay.png + selftest-pin.png (webContents.capturePage,
  vuot qua viec Windows che den app la khi chup ngoai), roi tu thoat. Ca hai
  anh dung nhu thiet ke. `.selftest/` da gitignore.

### Con thieu (ban sau)
- Tu luu anh vao thu muc rieng (dat ten theo mau + cau hinh duong dan).
- KEO-THA file ra app khac (Premiere / Zalo / Mess) bang webContents.startDrag
  — day la tinh nang loi cua tool, chua lam.
- Man hinh cai dat (chon thu muc luu, doi phim tat).
- Dong goi bo cai (electron-builder) + ky so.
- Ho tro da man hinh day du (hien moi chup man hinh duoi con tro).
