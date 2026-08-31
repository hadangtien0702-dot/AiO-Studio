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
   ☠️ Anh di qua protocol `aioshot://` (buffer PNG o main, `frozenStore`),
   IPC CHI mang URL (0.4.1, may nha 31/08): man 5K2K ra base64 ~5,7MB, gui
   chuoi do qua IPC la renderer DANG KEO nghen mot nhip = giat. Canvas ghep
   can anh CORS sach -> protocol tra ACAO:* + Image crossOrigin=anonymous;
   dan nen bang CHINH the <img> da decode, KHONG CSS background (cache key
   no-CORS khac -> decode lan 2).
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

## ☠️☠️ SO LOI TAI DIEN — DOC TRUOC KHI SUA / THEM TINH NANG (anh Tien chot 31/08)

> Anh Tien: *"em phai luu lai cac loi da lam, da bi sua va bi lai de lan sau
> khong bi nua... moi lan anh sua thay them tinh nang khong it thi nhieu no se
> bi cac loi do lai"*. Tong hop tu TOAN BO PROGRESS.md (24/08 -> 31/08).
> **Luat: truoc khi dung vao vung nao, doc dong tuong ung. Sua xong chay muc
> "Kiem hoi quy" ben duoi roi moi bao xong.**

| # | Loi (da bi may lan) | Goc DA DO (khong phai doan) | Chot chan dang gac |
|---|---|---|---|
| 1 | **Double taskbar / anh dan lech** (25/08, TAI DIEN 31/08) | Windows KEP cua so non-resizable vao workArea ngay luc tao: xin 1440 duoc 1392 (hut 48px taskbar) -> anh nen doc | `setBounds(b)` sau khi tao + ve nen theo kich thuoc man that (anh/sf) + app TU DO moi lan mo, hut la ghi `CANH BAO overlay HUT` vao run-log |
| 2 | **Vet sang/toi chia doi man thu 2** (25/08 x2) | box-shadow spread 100vmax "duc lo" chi phu 100vmax tu mep -> hut giua man 4K | CAM box-shadow duc lo; guong = 4 TAM MO rieng (#guong gT/gB/gL/gR) |
| 3 | **"Sua roi van thay cu"** (26/08, TAI DIEN 27/08) | Anh Tien chay BAN CAI (loi tat Desktop tro `AppData\Local\Programs\`), sua ma nguon khong toi do | Sua xong = bump version + `npm run dist` + CAI DE + do `ProductVersion` cua TIEN TRINH dang chay + doc dong `boot vX.Y.Z` trong run-log |
| 4 | **Xoa nham file cua anh khi don test** (24/08 loc theo gio, TAI DIEN 26/08 glob `AiO-...-1*`) | Gio / mau ten / duoi file la thuoc tinh KHONG phan biet chu so huu | Luc TAO file test ghi TEN vao danh sach; don = xoa DICH DANH tung ten trong danh sach do. CAM glob/loc-gio |
| 5 | **Version lech** (2 dot push ten 0.3.2/0.3.3 ma package.json khong bump) | Quen bump; khong co gi nhac | Bump package.json + sua dong 12 TOOL_VERSION_TRACKER trong CUNG commit |
| 6 | **Selftest/kiem XANH GIA** (24/08 loi bi nuot; 26/08 xanh nho RACE grab-nhanh-hon-dim; 26/08 selftest 1 man khong du — anh Tien day thang) | Selftest thoat som nuot hop thoai loi; phep kiem xanh ma khong hieu vi sao xanh | uncaughtException ghi `.selftest/errors.txt`; checklist 4 diem o muc Verify (ti le sang / vat 2 man 2 phia / dem file / doc run-log); mot phep kiem chua tung DO thi chua tin |
| 7 | **Dan quyet dinh cu bi dao ma khong do lai nguyen nhan** (31/08 — chinh la #1 quay lai) | So cu chi ghi TRIEU CHUNG ("dan la lech") khong ghi nguyen nhan da do -> phien sau DOAN | Ghi bay = ghi kem NGUYEN NHAN DA DO + con so; dao quyet dinh cu = TAI LAP nguyen nhan bang so do truoc (brain: `bay-dao-quyet-dinh-cu-khong-do-lai.md`) |
| 8 | **Ve khung khi keo — HOI QUY 3 LAN TRONG 1 NGAY 31/08** (giat drop-fps -> rung 2 nguon -> te le -> nhay khi vat man) | Vung nay co HAI nguon ve (mousemove local + main sel-rect 16ms) tren NHIEU man/DPI — moi lan chinh mot nguon la ho nguon kia. Chuot ra khoi man chu la mousemove NGUNG (khong pointer capture) | Luat hien hanh (0.3.17): local vua ve <50ms thi main NHUONG; local im thi main TIEP QUAN (`lanVeLocal`). ☠️ Dung vao onSelRect/mousemove ma khong chay `test-keo-vat-man.js` (3 giai doan) + `test-overlay-drag.js` la se hoi quy lan 4 |
| 9 | **"DAT o cong ty, may NHA van y chang"** (31/08 toi — chuoi keo-chon vua cham DAT buoi trua) | Chi phi ti le voi PIXEL man: may nha 5120x2160 -> PNG 1,8-4,3MB -> base64 ~5,7MB qua IPC do vao renderer DANG keo (log: 6/6 luot drag-start dinh 20-40ms sau grab-xong). Man cong ty nho -> cung code ma nhe hon han | 0.4.1: anh di `aioshot://`, IPC chi mang URL. Run-log ghi `keo N khung, gap-max=Xms` moi luot — "muot" phai la SO tu may co man LON nhat, khong phai mat tren may dev. Duong frozen dung vao PHAI chay `test-frozen-storm.js` + `test-composite.js` (taint + vat man) |

**Bay 1-lan nhung se can lai khi them tinh nang** (deu da co chot trong code —
DUNG go):
- `getSources` CHAN main ~0,5-1,5s: khong grab truoc khi overlay hien; UI theo
  chuot phai ve LOCAL trong renderer, khong cho main phat (0.3.9 "drop fps").
- Video MPO (YouTube) nhin xuyen cua so trong suot ra DEN -> PHAI dan frozen
  (0.3.10) + fade 160ms + decode truoc (0.3.11 "giut mot cai").
- `webContents.id` doc sau 'closed' = crash — cache `wcId` ngay luc tao.
- app.asar CHI DOC — log/anh cua ban dong goi phai ra userData / canh exe.
- Config: ghi ATOMIC (tmp+rename, 0.3.8); doc fail tra {} IM LANG — file BOM
  tung lam JSON.parse chet, moi cai dat ve mac dinh khong ai biet.
- Hieu ung CSS lan RONG hon le cua so trong suot bi CHAT CANH ("khung vien
  xau" 26/08): luat `offset+blur <= PIN_PAD`.
- Keo cua so tren DPI le: gui delta TUYET DOI tu diem neo, cam cong don
  getPosition/setPosition (khay phinh 24/08).
- desktopCapturer MOT thumbnailSize chung UPSCALE man nho — goi RIENG tung man
  voi size native; moi phep cat/ghep do kich thuoc anh THAT roi quy doi.
- Accelerator backtick la `` Alt+` `` literal; bo ghi phim doc `e.code`.
- ☠️ **CSS de len co che AN phan tu** (bay "te le" 31/08): `#id{display:flex}`
  DE LEN `[hidden]` (id-specificity > UA) -> `el.hidden=true` vo tac dung;
  `animation:...both` giu opacity khung cuoi DE LEN `.hidden{opacity:0}`.
  Toggle .hidden/[hidden] ma khong an -> DO computed display/opacity, dung tin
  la da an. Sua: `#id[hidden]{display:none!important}` / fill `backwards`.
- ☠️ **KHONG xoa `vk_swiftshader.dll` / `vulkan-1.dll`** de giam dung luong:
  la bo render PHAN MEM du phong cho may YEU / khong GPU (gpucheck xac nhan
  app roi ve software rendering van OK nho no) — bo la may khach man den.
  `afterPack.js` chi xoa locale thua + dxcompiler/dxil (WebGPU, app khong dung).
- ☠️ **Dung luong Electron co SAN ~84 MB** (.exe Chromium 225 MB unpacked):
  cat locale+WebGPU shader la het phan an toan. Muon nhe nhu Lightshot (~5 MB)
  phai VIET LAI bang Tauri — quyet dinh lon, hoi anh Tien truoc.

**Bay THUOC DO ve GPU/hieu nang** (dinh 31/08 khi tim lag keo — deu la thuoc
hong, khong phai san pham hong):
- `getGPUFeatureStatus()` query QUA SOM (ngay app.ready) bao `disabled_software`
  GIA — GPU process chua init. Phai co CUA SO hien + cho ~3s roi moi query.
  May nay THAT ra la RTX 4060 Ti, gpu_compositing ENABLED.
- `requestAnimationFrame` cadence bi VSYNC khoa 60fps -> MU voi lag compositor.
  Con so 16.7ms phang li = thuoc hong, khong phai muot. Do lag ghep man that
  bang **CDP Page.screencast** (dem khung day ra man), khong bang rAF.
- Anh nen test PHANG (mau don) giau chi phi ghep — dung anh chi tiet + full-res.
- ☠️ Run-log truoc 0.4.1 ghi gio UTC (toISOString) — lech -7h so voi ten file
  anh, doc log tuong "chup tu trua" trong khi vua chup xong (suyt lac duong
  31/08 toi). Da sua sang gio dia phuong; doc log cu thi +7h.
- ☠️ Selftest khi BAN CAI dang chay: khoa single-instance lam selftest TU THOAT
  exit 0 (xanh gia) va BUNG overlay chup tren man nguoi dung (second-instance
  -> startCapture). Da chan: --selftest/--selftest-drag cach ly userData vao
  `.selftest/userData`.

**Kiem hoi quy truoc khi bao xong** (sau MOI lan sua/them tinh nang):
1. `npm start -- --selftest --dev` + doc `.selftest/` (muc Verify: 4 diem).
2. 3 harness scratchpad neu dung vung do: khay (wheel) · settings (hotkey) ·
   overlay (freeze/drag) — mo ta trong PROGRESS 28-31/08.
3. Dong goi + cai de + do ProductVersion tien trinh + doc run-log: dong boot
   OK va KHONG co dong `CANH BAO`.
4. Ra soat bang tren: thay doi cua minh co dung vao dong nao khong.

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
