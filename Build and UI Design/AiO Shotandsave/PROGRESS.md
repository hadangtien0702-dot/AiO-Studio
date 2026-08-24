# PROGRESS — AiO Shot & Save

## 2026-08-24 23:45 — Logo AiO · doi cho luu anh · SUA LOI KHAY PHINH KHI KEO

### 1. ☠️ Khay tu phinh to khi keo — anh Tien phat hien, DO DUOC
Anh Tien: *"drag cai khay la cang keo no tu scale to ra"*.

Khong doan — them che do do `--selftest-drag`, keo 120 buoc va ghi kich thuoc:

```
truoc-khi-keo   w=383  h=132
sau-120-buoc    w=384  h=252     <-- moi buoc CAO THEM 1px
```

**Goc:** man hinh chinh chay DPI 1.25. Cach cu moi buoc keo lai `getPosition()`
roi `setPosition()` — moi vong la mot lan doi DIP <-> pixel that, SAI SO LAM
TRON CONG DON vao chieu cao.

**Chua:** neo `getBounds()` MOT LAN luc bat dau keo; moi buoc gui delta TUYET
DOI tu diem bam chuot, `setBounds` co khai bao width/height de khoa cung. Khong
bao gio doc lai `getPosition()` giua chung. Ap cho CA khay va cua so ghim (cua
so ghim dinh cung mot loi, chua ai bao nhung do la cung mot duong code).

Do lai: `KET LUAN: OK — giu nguyen 382x130 sau 120 buoc keo`.

☠️ Lan do dau con day them mot bai hoc ve CONG CU DO: no so kich thuoc cuoi voi
hang `SHELF_W/H` (380x128) nen bao "phinh" ngay ca khi da sua xong — thuc ra cua
so tao ra o DPI 1.25 da bao 382x130 TU DAU, do la quy doi DIP chu khong phai
phinh. Da sua phep do: so voi bounds NGAY TRUOC KHI KEO.

### 2. Doi cho luu anh — anh Tien NGHIEM CAM luu vao Pictures
Truoc: `Pictures\AiO Shot & Save` — ma may nay `Pictures` bi OneDrive doi huong,
moi tam chup tu bay len dam may.
Nay: `<thu muc tool>\Anh chup` (`kho.thuMucGoc()` — da tinh ca truong hop dong
goi: luc do lay thu muc chua file .exe vi ma nguon nam trong app.asar khong ghi
duoc).
Da CHUYEN (khong xoa) 4 tam da lo luu sang cho moi, va xoa thu muc rong trong
OneDrive.
⚠️ 3 tam anh Tien chup luc 23:35 co the DA kip dong bo len OneDrive truoc khi
chuyen — muon sach hoan toan thi phai xoa ca ban tren may.

### 3. Logo AiO
Gan vao 3 cho: dau thanh khay (thay 6 cham keo — logo vua la nhan dien vua la
cho cam), dai chi dan luc chup, va sua icon tray dang bi BOP MEO (logo 386x351
ma ep vao o vuong 18x18 -> nay chi ghim chieu cao 16, rong tu theo ti le).
SVG goc chep vao `assets/logo.svg`; trong HTML thi nhung thang inline vi CSP
chi cho `img-src data:`.

### 4. Chan ro ri
`.gitignore` chan `Anh chup/` — day la anh chup man hinh THAT cua anh Tien
(Facebook, tin nhan). Da kiem `git ls-files`: chua tung co tam nao lot len git.

## 2026-08-24 23:33 — v0.2.0: KHAY ANH + luu file that tren dia

Anh Tien: *"chup nhieu tam thi can co mot cho luu o tren man hinh chinh"*.
Chot: chup xong VUA vao khay VUA ghim; khay KEO DE DAU CUNG DUOC va nho cho.

- `src/kho.js` — noi anh song that: ghi PNG vao `Pictures\AiO Shot & Save\`
  (ten `AiO-YYYY-MM-DD-HHmmss-mmm.png`) + doc/ghi `cau-hinh.json` trong
  userData (KHONG canh ma nguon, de ban cai sau khong de len cau hinh user).
- `src/shelf/` + `preload-shelf.js` — khay noi alwaysOnTop: thanh tren co tay
  cam keo, ten, so dem, nut Mo thu muc / Don khay / An. Day thumbnail cuon
  ngang, anh moi nhat ben trai, co animation vao.
- Luong chup nay la: crop -> **luu file** -> **them vao khay** -> ghim noi.
  Luu file TRUOC nen dong ghim hay tat app deu khong mat anh.
- Bam thumbnail = ghim lai (dat giua man hinh co con tro, xep chong 24px cho
  khoi de len nhau). Nut X = **chi bo khoi khay, file tren dia giu nguyen** —
  xoa file cua nguoi dung phai do ho quyet dinh, khong phai mot cu bam nham.
- Khay hien bang `showInactive()` — KHONG cuop focus khi anh dang dung Premiere.
- Vi tri khay luu vao cau hinh luc THA chuot; mo lai dung cho cu. Co kiem
  `trongManHinh()` phong khi thao man hinh phu -> vi tri cu roi ra ngoai.
- Tray them 2 muc: Hien khay anh · Mo thu muc luu anh.

**Do that (selftest):** 3 anh bang chung (overlay/pin/shelf), `errors.txt`
khong sinh ra, va file that da nam tren dia:
`AiO-2026-08-24-233251-581.png` 28.573 byte.

☠️ **Phat hien can anh Tien quyet:** `Pictures` cua may nay bi OneDrive doi
huong -> `C:\Users\hadan\OneDrive\Pictures\AiO Shot & Save`. Nghia la MOI tam
chup se dong bo len dam may. Chua doi mac dinh vi day la lua chon cua anh Tien,
khong phai cua em.

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
