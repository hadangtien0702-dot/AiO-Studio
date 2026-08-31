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
  bundler.
- ☠️ **MAY MOI PHAI `npm install` TRUOC.** `node_modules/` bi gitignore nen
  `git pull` khong bao gio mang Electron ve — keo code ve bam chay la chet
  ngay buoc dau, trong nhu tool hong. Da vap that o may cong ty 25/08.

```
npm install    # chi lan dau tren moi may
npm start
```

☠️ **Chay .ps1 phai them `-ExecutionPolicy Bypass`** (Windows mac dinh chan
chay script, bao "running scripts is disabled"). Vap that o may cong ty 25/08:
```
powershell -ExecutionPolicy Bypass -File scripts\cai-loi-tat.ps1        # cai loi tat
powershell -ExecutionPolicy Bypass -File scripts\cai-loi-tat.ps1 -Go    # go loi tat
```
- Giao dien: HTML/CSS/JS thuan + `assets/tokens.css` (copy tu
  `../design-system/tokens.css`). Font Inter tai `assets/fonts/Inter.woff2`.

## Cau truc

```
src/
  main.js            App, tray, phim tat, dieu phoi chup, tao cua so, IPC.
  i18n.js            Tu dien VI/EN + t(lang,key). main require; preload nap lang
                     SYNC (ipcRenderer.sendSync 'i18n:lang') -> window.i18n.t().
  kho.js             Luu anh (thuMucAnh doc config, DOI DUOC) + cau-hinh.json.
  preload-overlay.js Cau IPC cho overlay (-> window.overlay) + i18n.
  preload-pin.js     Cau IPC cho cua so ghim (-> window.pin) + i18n.
  preload-shelf.js   Cau IPC cho khay (-> window.shelf) + i18n + hotkey display.
  preload-settings.js Cau IPC cho Cai dat (-> window.settings) + i18n.
  overlay/           Man chon vung: MOI man mot overlay, anh dong bang + fade.
  pin/               Cua so ghim sticky: anh + thanh cong cu + keo di chuyen.
  shelf/             Khay anh: thumbnail + keo-tha ra app khac.
  settings/          Man Cai dat (frameless, logo AiO, card): doi phim tat, doi
                     thu muc luu, toggle ngon ngu VI/EN.
assets/              tokens.css, fonts/Inter.woff2, tray.png, app.ico (AiO logo).
```

## Luong chup (main.js)

1. Phim tat (mac dinh `CommandOrControl+Shift+S` = Ctrl tren Win / ⌘ tren Mac;
   DOI DUOC qua man Cai dat, luu vao `cau-hinh.json`) / bam tray -> `startCapture()`.
2. `openOverlays()` mo MOT overlay TRONG SUOT cho MOI man, hien NGAY (~165ms,
   thay man hinh that qua no) — tuc thi nhu Lightshot. ☠️ KHONG grab TRUOC roi moi
   hien: `desktopCapturer.getSources` CHAN luong chinh ~0,5s -> overlay hien muon
   = "pop-up". ☠️ KHONG dung 1 cua so vat ngang ca man hinh ao: may 4K + man phu
   DPI 150% no khong phu het.
3. `kickGrab()` (goi SAU khi overlay dau tien hien+paint, setTimeout 40ms) chup
   TUNG man qua `desktopCapturer` (device px), gui anh dong bang -> renderer dat
   lam nen (`overlay:frozen`, freeze view) + luu full-res de cat.
   ☠️ PHAI dan frozen lam nen (dao quyet dinh 25/08, chot lai 31/08): video
   phan cung (YouTube) nhin xuyen cua so trong suot ra MANG DEN (lop MPO),
   chi anh WGC moi co hinh — khong dan la nguoi dung khoanh vung tren mang
   den. Chi dan anh cua CHINH man do (own) thi khong lech/taskbar-2-lan.
4. Renderer: keo chon vung (toa do toan cuc qua `origin`; khung chon guong sang
   man kia qua 'overlay:sel'). Vung GON 1 man -> thanh cong cu ve (khung/mui ten,
   7 mau). Vung VAT NGANG 2 man -> `confirmComposite` ghep tu anh dong bang cac
   man (dung sf tung man) -> `{dataUrl}` luu thang, KHONG co buoc ve. Xong:
   co shape -> canvas GHEP gui `{dataUrl}`; khong shape -> gui `{rect}`.
5. `handleConfirm()`: `{dataUrl}` thi dung thang; `{rect}` thi cat anh goc full-res
   (net). -> luu file -> `shelfAdd()` (khay tu hien). ☠️ 25/08: chup xong CHI vao
   khay, KHONG bung pin. Ghim chi khi bam thumbnail (`shelf:pin`).

## Verify — KHONG tin "build sach"

Windows che den (mask) app la khi chup bang cong cu ngoai, nen dung co
`--selftest`: app tu chup -> tu chon vung giua -> tu ghim -> `capturePage()` luu
`.selftest/*.png` (app tu chup chinh no, vuot mask) -> tu thoat.

```
npm start -- --selftest --dev
```

Roi doc `.selftest/selftest-overlay.png` + `selftest-pin.png` de kiem mat.

☠️ **Selftest duong dep 1 man KHONG DU** (anh Tien day 26/08 sau 3 loi lot luoi).
Truoc khi bao xong PHAI them: (a) do TI LE SANG anh luu vs vung man goc (~1.0;
0.58 = dinh lop mo); (b) keo vat 2 man tu CA HAI phia, anh phai chua du 2 man;
(c) moi luot chup ra DUNG 1 file; (d) doc `.run-log.txt` (nhat ky chay luon bat)
doi chieu tung buoc. Overlay PHAI co `setContentProtection(true)` — khong thi
grab (chay sau khi overlay hien) nuong lop mo vao anh.

## Da lam

KEO-THA ra app khac (`webContents.startDrag`, 25/08): keo anh GHIM hoac
thumbnail KHAY -> tha file .png that vao Premiere / Zalo / Mess / Explorer...
Tren cua so ghim: keo ANH = tha ra app, keo THANH TREN (#bar) = di chuyen cua so
(dragstart chiem cho keo-di-chuyen nen phai tach). Da do that: file roi dung vao
Explorer, xuyen ca 2 man hinh.

VE SHAPE khi chup (25/08): chon vung xong hien thanh cong cu -> ve KHUNG VUONG /
MUI TEN (canvas device-res) -> Enter/Xong. Co shape thi renderer ghep gui dataURL;
khong shape thi main cat full-res. Ctrl+Z hoan tac, Esc huy.

HIEN TUC THI (25/08): overlay cua so TRONG SUOT hien NGAY (~165ms), grab chay NEN
sau khi overlay hien (getSources CHAN luong chinh nen KHONG duoc grab truoc khi
hien). Frozen den sau -> freeze view.
☠️ KEO CHON PHAI VE LOCAL (31/08): man CHU ve khung NGAY trong mousemove cua
chinh no (clientX — DIP man do, dung cho diem tren chinh man do); main van
theo doi chuot 16ms nhung CHI lo nhan phys + guong man kia + chot vung luc
tha. Truoc do khung CHI ve khi main phat sel-rect -> main ban getSources ~1s
ngay luc mo overlay (dung luc nguoi dung keo) la khung DUNG HINH — anh Tien
ta "giat nhu game drop fps". Cau "clientX chi dung khi 2 man cung scale" chi
ap cho toa do XUYEN man, khong ap cho ve tren chinh man minh.

MAN CAI DAT PHIM TAT (25/08): mo tu tray -> "Doi phim…" -> nhan to hop -> LUU
NGAY. ☠️ 31/08 BO nut "Luu": anh Tien nhan to hop, thay keycaps moi hien len
-> dong cua so tuong xong, nhung phim chi nam trong bien pending cua renderer
-> restart may thay "phim tu doi" (thuc ra chua tung luu). Nhan to hop hop le
la setHotkey ngay. Kem 31/08: ghiCauHinh ghi ATOMIC (tmp+rename — file nay ghi
moi lan keo khay, sap giua chung la JSON hong -> MOI cai dat ve mac dinh);
run-log ghi dong "boot ... dang-ky=OK/FAIL"; phim bi app khac giu luc boot thi
bao Notification (truoc do chet im lang).
Bo ghi dung `e.code` (vi tri phim), khong dung `e.key` (doi theo Shift). Luu vao
`cau-hinh.json`, nap luc khoi dong. Doi that bai (app khac giu phim) thi giu phim
cu. ☠️ Accelerator backtick la `Alt+\`` (literal), KHONG phai 'Alt+Backquote'.

DONG GOI BO CAI (26/08): `npm run dist` -> electron-builder/NSIS mot-cu-bam,
per-user, ra `dist/AiO-Shot-and-Save-Setup-<ver>.exe` (~99MB, KHONG len git —
`*.exe` ignored; ban phat hanh nam o `Release/<ngay>-shotandsave-<ver>/`).
☠️ 2 bay da vap: (1) RUN_LOG trong app.asar CHI DOC -> ban dong goi phai ghi
vao userData (da lam trong ghiLog); (2) bo cai NSIS TU DE loi tat Desktop cung
ten -> sau khi cai, loi tat tro BAN CAI chu khong phai ban nguon.

## Chua lam (xem PROGRESS.md)

Cai thu MAY SACH (khong Node/nguon) truoc khi phat ra ngoai · ky so (SmartScreen)
· pre-warm overlay ~30ms · cong cu ve them (chu, but, che mo) neu anh Tien can.
