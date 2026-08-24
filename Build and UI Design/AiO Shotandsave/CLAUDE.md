# AiO Shot & Save — chup vung chon + ghim sticky, cho he thong AiO Studio

App desktop nho: bam phim tat -> chon vung -> anh "dan dinh" (sticky) noi len
tren moi cua so, de vua nhin tham chieu vua (sau nay) keo-tha vao Premiere /
Zalo / Messenger.

## ☠️ VI SAO KHONG LAM CEP PANEL nhu 7 panel kia

7 panel AiO song BEN TRONG Premiere (CSXS + host/*.jsx), bi nhot trong sandbox:
- KHONG chup duoc toan man hinh.
- KHONG keo-tha file ra app ngoai (Zalo/Mess).

Cai tool nay can dung o tang HE DIEU HANH. Nen no la app Electron doc lap, KHONG
co extension ID / cong debug CEP. Dung chung: design-system (tokens.css, i18n,
luat tai nguyen) va thuong hieu AiO.

## Stack

- Electron (ban moi nhat — hien 43.4.1), JavaScript thuan (CommonJS), khong
  bundler. Chay: `npm start`.
- Giao dien: HTML/CSS/JS thuan + `assets/tokens.css` (copy tu
  `../design-system/tokens.css`). Font Inter tai `assets/fonts/Inter.woff2`.

## Cau truc

```
src/
  main.js            App, tray, phim tat, dieu phoi chup, tao cua so, IPC.
  preload-overlay.js Cau IPC cho overlay (contextBridge -> window.overlay).
  preload-pin.js     Cau IPC cho cua so ghim (-> window.pin).
  overlay/           Man chon vung: anh dong bang + keo chon + lam mo.
  pin/               Cua so ghim sticky: anh + thanh cong cu + keo di chuyen.
assets/              tokens.css, fonts/Inter.woff2, tray.png (AiO logo).
```

## Luong chup (main.js)

1. Phim tat `Ctrl+Shift+S` / bam tray -> `startCapture()`.
2. `grabDisplay()` chup man hinh DUOI CON TRO qua `desktopCapturer`, do phan
   giai that = size * scaleFactor (device px). Chup TRUOC khi hien overlay.
3. `openOverlay()` mo cua so opaque phu dung man hinh do, gui anh dong bang sang.
4. Renderer overlay: keo chon vung (CSS px). Tha -> `overlay:confirm` voi rect.
5. `handleConfirm()` crop anh goc (rect * scaleFactor) -> `createPinWindow()`
   dat tai vi tri man hinh cua vung chon, alwaysOnTop 'screen-saver'.

## Verify — KHONG tin "build sach"

Windows che den (mask) app la khi chup bang cong cu ngoai, nen dung co
`--selftest`: app tu chup -> tu chon vung giua -> tu ghim -> `capturePage()` luu
`.selftest/*.png` (app tu chup chinh no, vuot mask) -> tu thoat.

```
npm start -- --selftest --dev
```

Roi doc `.selftest/selftest-overlay.png` + `selftest-pin.png` de kiem mat.

## Chua lam (xem PROGRESS.md)

Tu luu thu muc · KEO-THA ra app khac (`webContents.startDrag`) · man cai dat ·
dong goi bo cai · da man hinh day du.
