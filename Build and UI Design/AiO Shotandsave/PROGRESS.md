# PROGRESS — AiO Shot & Save

> **TRANG THAI HIEN TAI (phien sau doc dau tien)** — chot 2026-08-31 22:22 +0700
> - Ban dang chay tren MAY NHA anh Tien: **0.4.2** (cai de 22:20, boot OK,
>   phim Shift+`). Bo cai: `Release/2026-08-31-shotandsave-0.4.2/`.
> - 0.4.1+0.4.2 = sua "MAY NHA van giat khi keo" (may cong ty da DAT 0.4.0),
>   HAI goc cung kich ban bam-chuot-khi-grab-dang-chay: (0.4.1) base64 ~5,7MB
>   qua IPC -> anh di `aioshot://`; (0.4.2, anh ta "keo va GIU giat
>   15xx/1405") neo main lech neo local 100-150px vi main nhan drag-start
>   muon -> neo = diem mousedown renderer gui kem + con tro trong man chu
>   thi main khong ve man chu. ✅ ANH CHAM DAT may nha 22:35: "keo lai roi
>   thi on dinh". Run-log moi luot keo van ghi `keo gap-max` + do troi neo —
>   sau nay ai bao giat thi doc so nay truoc.
> - ☠️ Truoc khi sua bat cu gi: doc muc **SO LOI TAI DIEN** trong CLAUDE.md
>   (9 loi + bay thuoc do + checklist kiem hoi quy). Vung ve-khung-khi-keo /
>   duong frozen dung vao PHAI chay 4 harness scratchpad phien 21:45 31/08
>   (test-overlay-drag · test-keo-vat-man · test-frozen-storm · test-composite
>   — neu mat thi dung lai theo mo ta trong PROGRESS).
> - [CHO] anh cham: chup video con "giat mot cai" khong sau ham nong (san
>   ~400ms Electron enumerate; muon nhanh hon ~170ms nua phai doi nen hien
>   thi sang JPEG — danh doi chat luong, anh quyet).
> - ☠️ **ANH TIEN CHOT 22:30 31/08: DI THEO TAURI 2 (Rust + webview) cho ca
>   Win lan Mac** — sau chuoi loi giat keo "fix nhieu lan van gap" anh ket
>   luan Electron khong hop the loai app nay ("mat thoi gian cua anh qua").
>   Ban Electron 0.4.2 DONG BANG: anh dung tiep, chi sua loi, KHONG them
>   tinh nang. ☠️ Anh noi ro them 22:40: KHONG dap di lam lai bay gio ("build
>   loi khac lai fix them 1 tuan nua hay sao") — Tauri la huong DAI HAN, CHI
>   khoi dong khi can BAN MAC hoac PHAT HANH BAN RA NGOAI, va xay SONG SONG
>   (anh van dung Electron, chi thay khi ban moi qua du harness + anh cham
>   DAT). Khi khoi dong thi SPIKE do 4 diem truoc khi cam ket port full:
>   (1) overlay trong suot hien tuc thi da man khac DPI; (2) toc do WGC tu
>   Rust (ky vong < sàn 400ms Electron); (3) keo-tha file RA app khac
>   (tauri-plugin-drag — do that voi Zalo/Premiere/Explorer); (4) phim tat
>   toan cuc + tray. UI (HTML/CSS/JS + tokens.css) va 3 luat keo-chon +
>   so 9 loi + 4 harness MANG THEO nguyen.
> - [CHO] truoc khi phat ra ngoai (ap cho ban Tauri): cai may SACH · ky
>   so/SmartScreen · notarize Mac.
> - ☠️ Ghi chu sai gio: 2 muc duoi day tung ghi 14:50/14:55 — SAI (suy tien
>   len thay vi chay lenh date, vap dung luat 5q); gio that ~14:30/14:37.

## 2026-08-31 22:20 — 0.4.2: het "keo va GIU no giat 15xx/1405" — neo main lay tu diem mousedown, thoi hoi con tro muon

### Boi canh
Anh Tien cai 0.4.1 xong keo thu: "anh keo va giu no giat nha em, vi du kich
thuoc 15xx con 1405, giat nhanh qua khong doc duoc so chinh xac". Nhan size
nhay qua lai giua HAI so lech ~100-150px khi GIU YEN tay.

### Goc DA DO (khong doan)
Hai nguon ve dang cai nhau ve HAI KICH THUOC KHAC NHAU — khac 0.3.15 (rung
toa do cu 16ms), lan nay lech ca tram px:
- Renderer neo tai mousedown (clientX). Main thi doi NHAN duoc drag-start moi
  `getCursorScreenPoint()` lam neo — ma anh bam chuot khi grab dang chan main
  ~880ms (kich ban co dinh cua may nha, xem 0.4.1), luc main tinh day tay da
  keo di 100-150px => neo main LECH neo local tung ay.
- Giu yen tay: tay run nhe -> mousemove le te. Moi cai run local ve so cua no
  (vd 15xx); im >50ms la main TIEP QUAN (luat 0.3.17) ve so cua NO (1405) ->
  nhap nhay ~10Hz dung nhu anh ta.
- ☠️ Nang hon hien thi: mouseup chot vung bang NEO MAIN => vung ANH LUU cung
  lech 100-150px so voi khung anh nhin thay.

### Thay doi
1. **overlay.js + preload:** dragStart gui kem DIEM MOUSEDOWN (global DIP =
   origin + clientX/Y). **main.js:** neo = raPhys(diem do); chi fallback hoi
   con tro khi khong co diem gui kem. Log `con tro luc main nhan da troi Xpx`
   khi lech >2px — so do that tren may anh cho lan sau.
2. **main.js phatSelRect:** con tro dang NAM TRONG man chu -> main BO QUA man
   chu (local thay chuot, la nguon ve duy nhat — het canh 2 nguon); con tro
   RA NGOAI man chu (vat man) main moi ve cho man chu (local mu, giu 0.3.17).
   Luat 50ms renderer giu nguyen lam luoi do phong.

### Kiem chung
- 4/4 harness DAT lai het: drag cam 6/6 · keo-vat-man 3 giai doan (luat
  nhuong-gianh renderer khong doi) · frozen-storm (taint sach) · composite
  vat man dung tung pixel.
- Selftest DAT; file test xoa dich danh. May that: cai de /S, tien trinh
  0.4.2.0, boot dang-ky=OK phim Shift+`, 0 CANH BAO.
- Ghi chu: khong quay video ngoai duoc de "xem anh keo" — overlay bat
  content-protection nen moi trinh quay ngoai thay vung overlay DEN. Thay
  bang so trong run-log (gap-max + do troi neo).

### Cho anh
- Keo + GIU nhu luc nay: nhan size phai DUNG YEN mot so. Chup vai tam roi
  xem anh luu co khop khung da khoanh khong (truoc 0.4.2 co the lech
  100-150px ma chua ai de y).


## 2026-08-31 21:52 — 0.4.1: MAY NHA het "van giat y chang" — anh dong bang di aioshot://, thoi base64 qua IPC

### Boi canh
Anh Tien (may NHA, 21:34): "van bi giat khi keo khung chon" + "loi nay fix
nhieu lan o cong ty roi o nha anh van bi y chang". May nha: man 5120x2160@1.25
+ 2560x1440@1 — khac han 2 man cong ty (150%+125%).

### Goc DA DO (khong doan)
- Run-log ban cai 0.4.0 (bay #3 loai: tien trinh dung 0.4.0.0): 6/6 luot keo
  toi 21:30-21:32 deu co `drag-start` roi DUNG 20-40ms sau `grab-xong ~880ms`
  — deu tam tap khong the la tay nguoi => anh bam chuot TRONG luc grab chay,
  main nghen nen nhan drag-start muon, roi NGAY lap tuc gui 'overlay:frozen'.
- Payload do that: man 5K2K ra PNG 1,8-4,3MB (tuy noi dung man) -> base64
  ~2,4-5,7MB/man x 2 man x 2 cua so overlay — chuoi nay di qua IPC vao DUNG
  renderer dang ve khung theo chuot -> renderer nghen mot nhip = giat. May
  cong ty man nho -> chuoi nho -> "het"; ve nha 5K2K -> y chang.
- ☠️ Bay thuoc do MOI (suyt lac duong 30 phut): run-log ghi gio UTC
  (toISOString) lech -7h so voi ten file anh — log 14:31 thuc ra la 21:31
  (vua chup xong). Da sua ghiLog sang gio dia phuong.

### Thay doi
1. **main.js:** protocol `aioshot://` (registerSchemesAsPrivileged corsEnabled
   + handle tra buffer PNG tu `frozenStore` Map, header ACAO:* de canvas ghep
   khong taint). `grabDisplaysList` tra buffer thay dataUrl; `kickGrab` gui
   layers mang `url` (~100 byte) thay chuoi MB; grab-xong log them `png XKB`;
   frozenStore.clear() trong closeOverlay + khi Esc truoc grab-xong.
2. **overlay.js:** Image nap `L.url` voi `crossOrigin=anonymous`; dan nen bang
   CHINH the <img> da decode (replaceChildren vao #shot) — KHONG CSS
   background: cache key no-CORS khac voi Image CORS -> tai+decode anh 5K2K
   lan HAI giua luc keo. Kem thuoc do `keo N khung, gap-max=Xms` (rAF, chi do
   nghen main-thread renderer — rAF van MU voi lag compositor) ghi run-log
   moi luot keo -> lan sau anh keo la co so that tu may anh.
3. **index.html/css:** CSP img-src them `aioshot:`; `#shot img` neo goc
   tren-trai, -webkit-user-drag none; #shot pointer-events none.
4. **main.js:** selftest CACH LY userData (.selftest/userData) — ban cai dang
   chay giu khoa single-instance lam selftest TU THOAT exit 0 (XANH GIA so
   #6) va con BUNG overlay chup tren man nguoi dung (second-instance ->
   startCapture). Da xay ra that 21:43, anh Esc.
5. **main.js ghiLog:** gio dia phuong thay UTC (bay thuoc do o tren).

### Kiem chung (4 harness scratchpad + selftest + may that)
- test-overlay-drag (dung lai theo PROGRESS 0.3.9): main cam, keo 4 buoc khung
  bam local tung pixel. 6/6 DAT.
- test-keo-vat-man (dung lai theo PROGRESS 0.3.17): 3 giai doan nhuong-gianh.
  3/3 DAT — vung so #8 KHONG hoi quy.
- test-frozen-storm (MOI): keo 1,6s (mousemove 8ms), frozen do xuong o +400ms,
  anh MAN THAT 2,7MB. Duong CU (dataURL qua IPC) gap-max=19ms; duong MOI
  (aioshot) gap-max=12-14ms. Kem kiem TAINT: ve khung + Enter ra dataUrl
  250x188, nen phu 100% pixel duc, khung cam 1051px — canvas ghep SACH.
  (Luu y trung thuc: harness 1 layer/cua so nho — delta tren may that 2 layer
  x 2 cua so se lon hon; so quyet dinh la gap-max trong run-log may anh.)
- test-composite (MOI, muc b checklist): 2 layer aioshot (man that + anh xanh
  dac), vung 200x200 vat bien -> ra dung 200x200 phys 1:1, nua phai 20000/
  20000 px xanh (tu man 2), nua trai 0 px xanh. DAT.
- Selftest: capture -> grab -> luu OK; 2 file test da xoa DICH DANH (so #4).
- May that: cai de /S, tien trinh 0.4.1.0, boot `dang-ky=OK` phim Shift+`
  giu nguyen, 0 dong CANH BAO.

### Cho anh
- Keo thu vai phat tren may nha. Con giat thi doc run-log dong `keo ... gap-max`
  gui em: gap-max >30ms = renderer van nghen (em sua tiep huong renderer);
  gap-max nho ma mat van thay giat = lag COMPOSITOR (WGC dang grab giua luc
  keo — huong khac: doi lich grab/giam do phan giai grab man phu).

## 2026-08-31 14:37 — 0.4.0: BAN PHAT HANH CHOT (anh Tien yeu cau "lam lai ban cai")

Anh cham DAT chuoi keo-chon xong, xin ban cai moi -> bump 0.4.0 lam moc
phat hanh sach, gom 10 ban va trong ngay (0.3.8 -> 0.3.17):
phim tat luu ngay + config atomic + boot log + Notification phim bi giu ·
keo muot (local ve + luat nhuong-gianh voi main) · video het den (dan frozen
+ fade + decode) · het double taskbar (setBounds + chot chan) · bo cai 84 MB
(cat locale/WebGPU + LZMA max) · het te le (CSS de [hidden]/opacity) · ham
nong getSources.
- `Release/2026-08-31-shotandsave-0.4.0/` (exe 84 MB + HUONG-DAN tong hop
  viet moi, da doc lai).
- Cai de may anh: tien trinh 0.4.0.0, boot dang-ky OK, ham-nong xong,
  0 dong CANH BAO. Phim Shift+` cua anh giu nguyen.


## 2026-08-31 14:30 — ✅ ANH TIEN CHAM DAT chuoi keo-chon: "ngon roi em, het nhay roi"

Thuoc do cuoi (mat + tay anh Tien tren 2 man that 150%+125%) da qua cho ca
chuoi sua keo-chon trong ngay: giat drop-fps (0.3.9) -> rung 2 nguon (0.3.15,
anh xac nhan "giam giat roi") -> te le toolbar/hint (0.3.16) -> nhay khi vat
man (0.3.17, anh xac nhan "het nhay roi"). Vung ve-khung-khi-keo dong ho so
tai dong #8 SO LOI TAI DIEN — dung vao ma khong chay test-keo-vat-man.js +
test-overlay-drag.js la mo lai ho so.
Con cho anh cham tiep (chua co phan hoi): chup video con "giat mot cai" khong
sau ham nong 0.3.16 (san ~400ms Electron khong bo duoc, chi do duoc phan lanh).


## 2026-08-31 14:35 — 0.3.17: het "keo mot cho NHAY mot cho" (local/main nhuong-gianh dung luat)

### Boi canh
Anh Tien (sau 0.3.16): "van bi — keo mot cho no nhay mot cho". Trieu chung
NHAY (khung dung hinh roi bat toi vi tri khac) khac han rung — chi khop mot
kich ban: chuot keo RA KHOI man chu.

### Goc
Web KHONG co pointer capture tu dong: mousedown xong keo ra ngoai cua so la
mousemove NGUNG BAN vao renderer man chu. 0.3.15 chan main ve cho man chu
VO DIEU KIEN (`if (dragging && laChu) return`) -> chuot sang man kia la khung
man chu DONG BANG o vi tri cu (local im, main bi chan), chuot quay lai moi
ve tiep -> "keo mot cho nhay mot cho". Truoc 0.3.15 khong bi vi main luon ve.

### Thay doi (overlay.js — luat nhuong-gianh)
- `lanVeLocal` = moc moi lan mousemove local ve khung.
- onSelRect: `if (dragging && laChu && now - lanVeLocal < 50) return` —
  local VUA ve (chuot dang di tren man nay) thi main nhuong (het rung);
  local IM >50ms (chuot ra ngoai man) thi MAIN TIEP QUAN (het dung hinh/nhay).

### Kiem chung
- Harness moi `test-keo-vat-man.js` — 3 giai doan: (1) keo local khung 198px
  dung; (2) main gui goi LECH 50px trong luc chuot dang di -> khung GIU 200px
  (khong bi de = khong rung); (3) NGUNG mouse events (gia chuot ra khoi man),
  main phat vung tien xa -> khung chay theo toi 638px (het dung hinh). DAT.
- 2 harness cu (drag/freeze) DAT. May that: 0.3.17.0, boot + ham-nong OK.
- Ghi dong #8 vao SO LOI TAI DIEN: vung ve-khung-khi-keo hoi quy 3 lan/ngay,
  tu nay dung vao onSelRect/mousemove PHAI chay test-keo-vat-man + drag.


## 2026-08-31 14:05 — 0.3.16: sua "TE LE khi keo" (toolbar+hint hien lac) + ham nong chong giat video

### Boi canh
Anh Tien: (1) "lỗi tè le khi kéo khung chọn" — hoi quy tu 0.3.15; (2) truoc do
"chup video giat mot cai moi chup duoc".

### "TE LE" — nhin TAN MAT (chup overlay giua luc keo) moi thay
Luc keo, THANH CONG CU VE (goc trai) + DONG HUONG DAN (giua) hien cung luc,
dang le ca hai phai an. Hai loi CSS de len co che an:
1. ☠️ **`#toolbar { display:flex }` (id) DE LEN `[hidden]`** (UA `display:none`
   specificity thap hon) -> `toolbarEl.hidden=true` VO TAC DUNG, toolbar hien
   hoai o goc 0,0. Do computed: hidden=true nhung display=flex. AM I tu 0.3.5.
   Sua: `#toolbar[hidden],#ve[hidden]{display:none!important}`.
2. ☠️ **`#hint { animation:mo-vao ... both }`** — fill `both` giu khung cuoi
   (opacity 1) DE LEN `.hidden{opacity:0}` -> hint co class hidden nhung
   opacity van 1, khong bao gio mo di. Sua: fill `both` -> `backwards` (het
   animation tra ve CSS thuong -> .hidden an duoc).
3. Kem: 0.3.15 de early-return TRUOC dong an hint -> gop luon; nay de an hint
   TRUOC early-return.

### Ham nong chong giat video (do that)
getSources LANH ~454ms, AM ~390ms; 1x1 (chi enumerate) = 357ms = SAN khong
tranh duoc (Electron enumerate man). PNG encode 171ms/man. Bat getSources 1x1
luc mo app (fire-and-forget) -> khoi tao WGC/driver truoc, lan chup dau bot
cong-tac lanh. ☠️ KHONG doi PNG->JPEG duong LUU: do sai lech pixel JPEG98 max
~118 o vien chu (giu quyet dinh 25/08). Duong hien co the JPEG (chua lam, cho
anh chon danh doi).

### Kiem chung
- Chup overlay giua luc keo: SACH — chi khung + dim + nhan, het toolbar/hint.
- Luc mo: hint van hien (opacity 1), toolbar an (display none).
- 3 harness (drag/freeze/jitter) DAT. May that: 0.3.16.0, boot + ham-nong OK.

### ☠️ Thu nhan: buoi nay duoi nhieu huong sai truoc khi trung
GPU (tuong software - that ra RTX 4060 Ti), rAF vsync-mu, anh test phang. Da
ghi 3 bay thuoc do vao CLAUDE.md. Lag keo THAT do 2 nguon ve (0.3.15 sua),
te le do CSS de len hidden (0.3.16 sua).


## 2026-08-31 13:30 — 0.3.15: bo NGUON VE THUA khi keo (rung/lag) + 3 bay thuoc do

### Boi canh
Anh Tien: "drag khung chup lag vai" (sau 0.3.14). GPU tot ma van lag.

### 3 BAY THUOC DO cua em trong buoi (thu nhan — da lam mat thoi gian)
1. ☠️ **getGPUFeatureStatus() query QUA SOM = bao software GIA.** Query ngay
   luc app.ready (GPU process chua init) tra "disabled_software" -> em ket
   luan nham "may software rendering" va di ca huong sai. Do lai SAU khi co
   cua so hien + cho 3s: **enabled**, ANGLE NVIDIA RTX 4060 Ti. May GPU rat
   manh. -> Query GPU phai co cua so THAT + cho GPU process len.
2. ☠️ **rAF cadence VSYNC-CAPPED, mu voi lag compositor.** Do frame-time qua
   requestAnimationFrame ra 16.7ms PHANG LI (p50=p95=max) o MOI dieu kien —
   khong phai "muot" ma la rAF bi khoa 60fps theo vsync, khong phan anh chi
   phi ghep that. Con so qua deu = dau hieu thuoc hong.
3. ☠️ **Anh nen test PHANG giau chi phi.** Do dau dung anh mau phang (re) ->
   0 jank; anh chi tiet + full-res moi lo. (Lap lai bai 5aa.)
   Thuoc do dung cuoi cung: **CDP Page.screencast dem khung compositor THAT**
   day ra man (nen 4K 35fps vs khong nen 40fps — nen ngon ~13%).

### Nguyen nhan (khong do duoc 100%, nhung chac ve co che)
Khi keo tren man CHU, khung do HAI nguon ve: (a) mousemove LOCAL toa do tuoi,
(b) main ban 'sel-rect' moi 16ms mang toa do chuot CU toi 16ms. Hai nguon da
nhau -> khung giat toi-lui = "lag" du fps cao (rung chu khong cham).

### Thay doi
- overlay.js onSelRect: `if (dragging && d.laChu) return` — man chu dang keo
  BO redraw tu main (local lo). Man khac (mirror) van dung main.
- overlay.js mousemove: nhan kich thuoc tinh LOCAL (phys = DIP × DPR) — man
  chu single-source, khong cho main gui.

### Kiem chung
- 2 harness (jitter + drag): khung van bam local 4/4 buoc, 0 dao chieu, syntax OK.
- ☠️ KHONG tai lap duoc "lag vai" trong harness (harness khong tao duoc do
  lech pha async that giua 2 nguon). Nen day la ban va theo CO CHE + bot viec
  (chac chan khong te hon), THUOC DO CUOI la MAT ANH TIEN.
- May that: cai 0.3.15, tien trinh 0.3.15.0.

### Neu VAN lag (huong tiep, chua lam)
Screencast do duoc nen 4K ngon ~13%. Neu bo nguon thua chua du, buoc sau la
giam chi phi ghep nen 4K luc keo (dim bake san / chi repaint vung chon) —
danh doi voi video, se ban voi anh truoc khi lam.


## 2026-08-31 12:40 — 0.3.14: GIAM DUNG LUONG bo cai 99 -> 84 MB (cat an toan, da verify render)

### Boi canh
Anh Tien: "kiem tra ban cai dung luong bao nhieu, giam xuong muc thap vua phai
duoc khong — Lightshot rat nhe". Do: bo cai 98,97 MB, unpacked 358 MB.

### Do phan bo (unpacked, tim cho beo)
- `AiO Shot & Save.exe` 225 MB = Chromium framework (SAN CUNG, khong bo duoc)
- `locales/` 47 MB = 55 file .pak (app tu dich VI/EN -> chi can en-US)
- `dxcompiler.dll` 25 MB + `dxil.dll` 1,5 MB = shader WebGPU (app KHONG dung)
- LICENSES.chromium.html 20 MB (phap ly, nen text ~2 MB, GIU)
- icudtl.dat 11 MB (du lieu i18n, GIU) · vk_swiftshader 5,3 MB (GIU — xem duoi)

### Thay doi
- `scripts/afterPack.js` (MOI): sau khi build, TRUOC nen NSIS, xoa 53 locale
  (giu en-US.pak) + dxcompiler.dll + dxil.dll. Cat **72 MB truoc nen**.
- package.json build: `"compression": "maximum"` (LZMA manh) + `afterPack`.
- ☠️ KHONG dung vk_swiftshader.dll: la bo render PHAN MEM du phong cho may
  YEU/khong GPU (gpucheck cho thay app roi ve software rendering OK nho no) —
  bo la may khach yeu co the man den. Da ghi vao SO LOI TAI DIEN.

### Ket qua
- Bo cai **98,97 -> 84,27 MB** (-14,7 MB, -15%). Unpacked 358 -> 286 MB.

### Kiem chung (khong tin build sach — verify render sau khi cat GPU dll)
- Them che do `--gpucheck` (main.js): mo cua so an, ve canvas 2D (nen cam +
  o trang), capturePage, do mau tam. Ghi userData\gpucheck.json.
- Test dieu kien DLL VANG tren ban dev (tam mv dxcompiler/dxil ra .bak, chay,
  tra lai): tam anh ra TRANG (trang:true) = canvas render THAT khong can 2 dll.
  gpuFeature: webgpu=disabled_off, skia_graphite=disabled_off (2 thu duy nhat
  dung dxcompiler von da TAT san trong Electron 43).
- Chay `--gpucheck` THANG TU BAN CAI 0.3.14 (artifact that, dll da xoa that):
  boot=ok, render trang=true, ffmpeg con. dxcompiler.dll da vang, locales con 1.
- ☠️ Thuoc do co 1 loi nho da hieu: gocCam=false vi capturePage tra anh scale
  1.5x (279px) ma checker do toa do theo 200px — tam trang da du chung minh.
- WGC chup video: API he dieu hanh, khong dung dxcompiler -> khong anh huong
  (van cho anh Tien test YouTube nhu cu de chac).

### ☠☠ SU THAT ve dung luong (tra loi cau "nhe nhu Lightshot")
Lightshot ~5 MB vi viet C++ THUAN. App nay la ELECTRON -> BAT BUOC gánh nguyen
bo Chromium (cai .exe 225 MB). 84 MB la GAN SAN cua Electron — cat them nua la
dung vao render/phap ly. **Muon xuong ~5-10 MB that su thi phai VIET LAI bang
Tauri** (Rust + WebView2 co san trong Win11, tan dung lai HTML/CSS/JS hien co)
— nhung phai lam lai tu dau: chup man WGC, phim tat toan cuc, keo-tha file deu
viet lai bang Rust + test lai het. Day la QUYET DINH LON, cho anh Tien chot,
CHUA lam.


## 2026-08-31 10:50 — LAP SO LOI TAI DIEN trong CLAUDE.md (anh Tien chot quy trinh)

### Boi canh
Anh Tien: "em phai luu lai cac loi da lam, da bi sua va bi lai de lan sau
khong bi nua... moi lan anh sua thay them tinh nang khong it thi nhieu no se
bi cac loi do lai. kiem tra log progress va ghi chu lai."

### Lam gi
- Doc lai TOAN BO PROGRESS.md (1335 dong, 24/08 -> 31/08), rut ra:
  - 7 loi TAI DIEN hoac chac chan tai dien: double taskbar (25->31/08) ·
    vet sang/toi man 2 (25/08 x2) · "sua roi van thay cu" ban cai/nguon
    (26->27/08) · xoa nham file cua anh khi don test (24->26/08) · version
    lech (x2) · selftest xanh gia (x3) · dao quyet dinh cu khong do lai.
  - 9 bay 1-lan se can lai khi them tinh nang (getSources chan main, MPO
    den, wcId sau closed, asar chi doc, config BOM/atomic, CSS bi chat,
    delta tuyet doi khi keo, thumbnailSize chung, backtick accelerator).
- Ghi thanh muc "☠️☠️ SO LOI TAI DIEN — DOC TRUOC KHI SUA" trong CLAUDE.md
  cua repo (nap tu dong moi phien): bang [loi / goc DA DO / chot chan] +
  checklist KIEM HOI QUY 4 buoc truoc khi bao xong.
- Brain: cap nhat bay-dao-quyet-dinh-cu-khong-do-lai.md — anh chot quy trinh
  nay ap cho MOI du an (du an nao sua UI/tinh nang nhieu vong thi lap so
  theo mau Shot & Save).

### Vi sao dat o CLAUDE.md ma khong phai file rieng
CLAUDE.md la file DUY NHAT chac chan duoc nap moi phien lam viec sau —
PROGRESS.md dai 1335 dong khong ai doc het truoc khi sua mot dong code.
So loi phai nam tren duong di bat buoc, khong nam trong kho luu tru.


## 2026-08-31 10:25 — 0.3.12/0.3.13: het DOUBLE TASKBAR (bay 25/08 tai dien) + chot chan

### Boi canh
Sau 0.3.11 anh Tien bao "double thanh taskbar" — dung bay 25/08 quay lai, va
anh phe thang: "loi cu lap lai hoai". Nhan loi: khi dan lai frozen (0.3.10)
toi DOC canh bao 25/08 nhung DOAN nguyen nhan cu (tuong la dan anh khong khop
man) thay vi DO — sổ cu chi ghi trieu chung, khong ghi nguyen nhan da do.

### Nguyen nhan that (do bang script rieng, may 2 man)
Windows KEP cua so non-resizable vao workArea NGAY tu luc tao:
- Man chinh: xin 2560x1440 -> duoc 2560x1392 (hut dung 48px taskbar)
- Man phu:  xin 2048x1153 -> duoc 2048x1109
Overlay hut day -> anh dong bang (co taskbar, du chieu cao) keo 100%/100%
bi NEN DOC ~3% -> taskbar trong anh noi ngay TREN taskbar that = double.
(Cung la mot phan cam giac "giut" luc dan.)

### Thay doi
1. **0.3.12 — main.js:** `win.setBounds(b)` lai mot lan sau khi tao overlay
   — thoat kep. Do 3 phuong an: resizable:true van bi kep; setBounds an
   (man chinh khop tuyet doi, man phu DU 2px do lam tron DPI — du = tran
   ra ngoai mep vo hai, HUT moi nen anh).
2. **0.3.12 — overlay.js:** ve nen theo KICH THUOC MAN THAT (naturalWidth/sf,
   neo goc tren-trai) thay vi keo 100% theo cua so — cua so co du vai px
   anh van khong gian.
3. **0.3.13 — chot chan:** moi lan mo overlay tu do getBounds so voi man,
   HUT la ghi "CANH BAO overlay HUT man..." vao run-log — bay nay tai dien
   o may nao (ke ca may khach) la lo ngay, khong phai doan.
4. Ghi bai hoc vao brain (`bay-dao-quyet-dinh-cu-khong-do-lai.md`): dao
   quyet dinh cu co canh bao thi phai TAI LAP nguyen nhan bang so do; ghi
   bay phai kem nguyen nhan da do; sua xong lap chot chan tu dong.

### Kiem chung
- Script do bounds 3 phuong an x 2 man (so ket qua o tren).
- Harness freeze: backgroundSize dung cong thuc anh/sf (sf=2, anh 1x1 ->
  0.5px), neo 0 0, van dan dung anh man minh, fade con nguyen. DAT.
- May that 0.3.13: 2 luot chup lien (mot luot anh Tien tu keo tren man phu,
  luu anh 2003x1221 OK) — run-log KHONG co dong CANH BAO nao = cua so phu
  du man that. Tien trinh 0.3.13.0, boot dang-ky OK.
- Mat anh Tien cham cuoi: taskbar con double khong.


## 2026-08-31 09:40 — 0.3.11: freeze HIEN DAN (fade 160ms) — het "giut mot cai"

### Boi canh
Anh Tien thu 0.3.10: video het den nhung "no giut mot cai roi moi freeze".
Goc: anh dong bang la khoanh khac ~0,5s TRUOC (grab + nen PNG mat chung do),
man dang dong (video chay) — dap anh vao mot phat la ca man "khuc" lui nua
giay. Khong rut ngan duoc do tre (ban chat grab), nhung lam mem duoc cu
chuyen.

### Thay doi
- overlay.css: #shot opacity 0 -> transition 160ms -> .co-anh opacity 1.
- overlay.js: own.img.decode() XONG roi moi dan + rAF add class — tranh
  khung frame vi giai nen anh 4K dung luc chuyen canh.

### Kiem chung
- Harness freeze: opacity di 0 -> 0.10 -> 0.71 -> 0.90 -> 1 (co gia tri
  GIUA that, khong nhay phat mot), van dan dung anh man minh. DAT.
- May that: cai de, tien trinh 0.3.11.0, boot dang-ky OK.
- Cam giac "muot" cuoi cung van la mat anh Tien cham.


## 2026-08-31 09:25 — 0.3.10: vung video (YouTube) het DEN trong luc chon vung

### Boi canh
Anh Tien xac nhan 0.3.9 keo muot roi, nhung bao tiep: dang coi YouTube, bam
chup thi VUNG VIDEO DEN trong luc khoanh (chup xong anh lai co hinh). Goc:
video tang toc phan cung nam o lop MPO — nhin XUYEN cua so overlay trong
suot thi lop do khong duoc ve -> den. Anh WGC grab thi CO hinh (fix 26/08),
nen file luu van dung.

### Thay doi
- overlay.js onFrozen: DAN anh WGC cua CHINH man nay lam nen #shot (freeze
  view) khi grab xong (~0,7s sau khi overlay hien) — vung video hien lai,
  dong bang tai thoi diem grab (dung nghia chup, nhu Snipping Tool).
- ☠️ DAO quyet dinh 25/08 "khong dan anh dong bang" (hoi do bi lech/taskbar
  2 lan). Nay chi dan anh OWN (cung he quy chieu cua so, inset:0 keo 100%)
  — khong con nguon lech. Ghi ro trong comment.

### Kiem chung
- Harness (overlay that + preload that, 2 man 2 anh khac nhau): #shot dan
  DUNG anh man minh (origin 100,200 -> anh do), khong nham anh man kia. DAT.
- May that sau cai de: tien trinh 0.3.10.0, boot dang-ky OK.
- CHUA do duoc bang may: canh "video MPO that het den" can YouTube dang phat
  + overlay that — thuoc cuoi la MAT ANH TIEN (anh dang ngoi dung ca do).
  Gioi han con lai: ~0,7s DAU (truoc khi grab ve) vung video van den —
  ban chat grab can thoi gian, chua co cach re hon.

### Cho anh
- Bam chup tren trang YouTube dang phat: sau ~nua giay vung video phai hien
  hinh (dung im) de khoanh. Neu van den lau hon 1-2s thi bao em.


## 2026-08-31 09:05 — 0.3.9: keo chon het giat + man Cai dat bot chu

### Boi canh
Anh Tien (sau khi nhan 0.3.8): (1) dong "✓ Saved — ready to use" xau, bo di;
(2) keo khung chon "giat giat nhu game drop fps", kich hoat chup chua muot.

### Nguyen nhan giat
Khung chon KHONG do man dang keo tu ve — moi khung hinh di vong: chuot ->
main (setInterval 16ms getCursorScreenPoint) -> IPC 'sel-rect' -> renderer
moi ve. Main lai hay BAN: getSources chan ~0,7-1,5s NGAY luc overlay vua
hien (log that 07:15 va 01:50: drag-start truoc grab-xong) -> interval dung
-> khung dong bang tung nhip. IPC + timer jitter cong them.

### Thay doi
1. **overlay.js:** man CHU ve khung NGAY trong mousemove (clientX — DIP man
   nay, trung so voi main quy doi nen hai nguon ve khong lech). Main van
   theo doi 16ms: nhan phys + guong man kia + CHOT vung luc tha — logic
   toa do/luu anh KHONG doi. Xoa ham updateSel chet.
2. **settings.js/css:** thanh cong IM LANG bang chu — keycaps nhay XANH mot
   nhip (animation 0.9s) thay cho dong "Saved — ready to use". Chu chi con
   cho THAT BAI (bi giu phim). Dung luat "chi bao khi that bai" + "nhin mau
   la biet". Xoa msg thanh cong cua ca nut Reset.

### Kiem chung (2 harness rieng, CDP)
- Overlay voi main STUB CAM (khong phat sel-rect nao — gia lap main nghet):
  keo 4 buoc, khung bam DUNG 4/4 buoc tung pixel (78x48 -> 318x218),
  drag-start/drag-end van gui ve main. DAT.
- Cai dat: luu Alt+P -> msg RONG + keycaps co class vua-luu + main nhan
  dung 1 lenh; kho atomic khong sot .tmp. DAT.
- May that sau cai de: tien trinh 0.3.9.0, boot log "hotkey=Shift+`(config)
  dang-ky=OK".
- Do them tu log: 01:51:12 "doi phim Alt+` -> Shift+` OK" — chinh anh doi
  lai phim sau screenshot; nghi van "Alt+` khong dinh" la KHONG co that.
  Log doi-phim them o 0.3.8 vua tra cong.

### Cho anh
- Anh keo thu vai phat xem con "drop fps" khong — con thi bao em, phan
  con lai la getSources chan main (ban chat API, se can huong khac).


## 2026-08-31 07:49 — 0.3.8: doi phim tat la LUU NGAY — het canh "restart may no doi phim"

### Boi canh
Anh Tien bao: doi nut chup xong, khoi dong lai may thi phim "doi sang phim
khac". Doc code man Cai dat thi ra lo hong quy trinh: nhan to hop moi ->
man hinh hien KEYCAPS MOI ngay (trang thai pending) -> nguoi dung tuong xong,
dong cua so — nhung phim chi nam trong bien `pending` cua renderer, phai bam
nut "Luu" moi thanh that. Dong cua so la mat, restart may mo ra thay phim cu
-> cam giac "no tu doi". Config tren may anh (userData) dang luu "Shift+`",
ghi luc 07:39 sang nay — khop kich ban anh vua doi lai.

### Thay doi (4 lop, 1 goc + 3 chong tai dien)
1. **settings.js — GOC:** nhan to hop hop le la setHotkey NGAY, bo han trang
   thai pending + nut Luu (HTML bo button#save). Khong con buoc de quen.
2. **kho.js:** ghiCauHinh ghi ATOMIC (tmp + renameSync). File nay ghi moi lan
   keo khay (savePos) — may sap giua writeFileSync la JSON hong ->
   docCauHinh tra {} -> MOI cai dat ve mac dinh im lang (mot duong nua ra
   dung trieu chung "restart xong phim doi").
3. **main.js:** run-log gio ghi dong boot (version + phim + config/default +
   dang-ky OK/FAIL + lang) va ghi moi lan doi phim. Truoc do log chi ghi thao
   tac chup — chuyen phim tat MU hoan toan, lan nay phai doan tu code.
4. **main.js:** phim bi app khac giu luc boot -> Notification bao ro (VI/EN,
   i18n key app.phimBiGiu) — truoc do chet IM LANG, bam khong an cung de
   tuong "phim tu doi".

### Kiem chung (moi truong test rieng, userData tro scratchpad)
- Nap man Cai dat THAT + preload THAT, CDP bam nut "Doi phim…" roi nhan
  Alt+P: main nhan settings:set-hotkey('Alt+P') DUNG 1 LAN, UI bao
  "✓ Da luu", keycaps Alt+P, ve idle. DAT.
- kho.ghiCauHinh atomic: ghi -> doc lai dung het, khong sot file .tmp. DAT.
- node --check 4 file sua: sach.
- Dong boot trong run-log kiem tren may that sau khi cai 0.3.8 (xem duoi).

### Ghi chu chan doan
- Truoc ban vá, run-log KHONG co dau vet gi ve hotkey nen khong the khang
  dinh 100% kich ban (co the con duong config-hong). Ca hai duong deu da
  chan trong cung lan sua (luat 5aj).


## 2026-08-28 16:00 — 0.3.7: con lan chuot cuon duoc day anh trong khay

### Boi canh
Anh Tien gui anh chup: tro chuot vao khay (24 anh) thi khong dung con lan de
cuon duoc. Nguyen nhan: day thumbnail la dai cuon NGANG (`overflow-x`), con
lan chuot ban tin hieu cuon DOC (deltaY) — khay khong co truc doc nen tin hieu
roi vao khoang khong, khong ai xu ly.

### Thay doi
- `src/shelf/shelf.js`: them bo chuyen truc — wheel tren khay NGANG thi
  `preventDefault` + cong deltaY (hoac deltaX neu lon hon, cho trackpad) vao
  `scrollLeft`. Bat tren `window` de tro dau tren khay cung lan duoc. Khay
  DOC return som — cuon doc tu nhien giu nguyen.
- Bump 0.3.7 + TOOL_VERSION_TRACKER dong 12.

### Kiem chung (tu dung moi truong rieng, khong dung app anh dang chay)
- Script test rieng (scratchpad): nap trang khay THAT + preload THAT
  (webPreferences chep dung main.js:910), bom 30 anh gia cho tran
  (scrollWidth 2168 / clientWidth 545), ban con lan qua CDP
  `Input.synthesizeScrollGesture` — su kien di dung duong ong input Chromium.
- Khay NGANG: lan xuong scrollLeft 0 -> 602, lan len lui ve 242,7; scrollTop
  dung im (khong cuon bay truc doc). DAT.
- Khay DOC (doi chung): scrollTop 0 -> 600 -> 240, scrollLeft dung im —
  duong cuon doc co san KHONG bi pha. DAT.
- 3 lan thuoc do sai truoc khi ra so that (ghi de phien sau khoi vap):
  (1) thieu `sandbox:false` -> preload chet im, 0 anh vao khay;
  (2) `sendInputEvent('mouseWheel')` KHONG toi trang tren Windows — bo dem
  wheel trong trang bao 0 su kien, phai chuyen sang CDP;
  (3) toa do tu tinh y=80 nam ngoai viewport that (chi cao 77px) ->
  "Position out of bounds" — phai do `getBoundingClientRect` cua chinh day anh.

### Da cai (16:10, anh gat dau moi cai)
- Ban dau khong tu cai de vi khay anh dang mo 24 anh; anh Tien chot "cai di"
  -> cai de im lang /S. Do sau cai: file cai `ProductVersion 0.3.7.0`;
  cai im lang KHONG tu mo app -> tu Start-Process, do tien trinh dang chay:
  0.3.7.0 tu `AppData\Local\Programs\aio-shot-and-save\`. Khay cua anh
  trong lai nhu da bao truoc (file anh van trong thu muc luu).
- CHO anh lan thu con lan tren khay that de xac nhan bang tay.


## 2026-08-27 15:58 — 0.3.6: GOI + CAI DE de het canh "sua roi van thay cu"

### Boi canh
Anh Tien bao "sua xong van bi vien" + gui anh YouTube: bat chup thi vung video
bi che/mo ("luc bi luc khong"). Do lai: tien trinh dang chay la BAN CAI 0.3.4
(`AppData\Local\Programs\aio-shot-and-save\`) — phien lam viec hom qua bi ngat
lam app ban nguon tat, anh mo lai bang loi tat Desktop -> ra ban cu KHONG co
fix nao. Anh YouTube xac nhan chan doan hom qua: video o lop phan cung, bo chup
cu khong thay (YouTube lo nen mo ambient, TikTok ra trang — cung mot goc;
"luc bi luc khong" = Windows luc dung lop phan cung luc khong).

### Thay doi
- Bump 0.3.6, `npm run dist`, CAI DE truc tiep len may (im lang /S) — tu gio
  loi tat Desktop mo ra la ban co du: WGC chup video + het vien + VE len anh ghim.
- `Release/2026-08-27-shotandsave-0.3.6/` (exe + HUONG-DAN da doc lai, muc MOI
  ghi ca 3 thu).

### Kiem chung
- Cai de im lang OK; do tien trinh dang chay: `ProductVersion 0.3.6.0` tu
  `AppData\Local\Programs\aio-shot-and-save\` — loi tat Desktop nay het lech.
- Bo cai 103,7 MB da cat vao `Release/2026-08-27-shotandsave-0.3.6/`.
- CHO anh Tien test tren chinh trang YouTube do: bat chup -> vung video phai
  con nhin thay va anh luu ra phai co hinh video that. + 4 diem tinh nang VE
  (dung cho / thumbnail doi / keo-tha ra ban da ve / Esc khong dong nham).


## 2026-08-26 16:09 — v0.3.5 DONG GOI XONG + TINH NANG MOI: VE LEN ANH GHIM (CHO ANH TEST)

### Boi canh
1. Anh Tien xac nhan bang mat: "het vien roi" (fix bong do 15:57) + do file: 3/3
   anh chup sau khi bat WGC deu co noi dung (218/369/616 KB), 0 anh trang
   (anh trang chi 0-6 KB) -> ca 2 fix DAT -> dong goi 0.3.5.
2. Anh xin them: bam thumbnail khay ra anh ghim (preview) thi muon VE o /
   mui ten len anh do — truoc gio chi ve duoc LUC CHUP.

### Thay doi
**A. Dong goi 0.3.5** (2 fix da kiem: WGC chup video + het dai vien bong do):
- package.json bump 0.3.4 -> 0.3.5; TOOL_VERSION_TRACKER dong 12 da sua.
- `npm run dist` -> `Release/2026-08-26-shotandsave-0.3.5/` (.exe 99MB +
  HUONG-DAN-CAI-DAT.txt da doc lai het, co muc "MOI TRONG BAN 0.3.5").
  ⚠️ exe nay CHUA co tinh nang ve ben duoi — se dong goi lai khi anh test xong.

**B. VE KHUNG/MUI TEN LEN ANH GHIM** (tai dung logic overlay.js):
- `pin/index.html`: nut but (edit) tren #bar + canvas #ve + #toolbar (rect/
  arrow/7 mau/undo/huy/xong — markup giong overlay).
- `pin/pin.css`: style toolbar (copy tu overlay.css), canvas phu kin anh,
  `.dang-ve` an #bar. Toolbar day duoi anh, flex-wrap cho anh nho.
- `pin/pin.js`: viet lai co che do 've': ve toa do DIP tren canvas DPR;
  Enter/✓ = ghep anh o DO PHAN GIAI THAT (naturalWidth, shape phong he so
  k = natural/dip, lineWidth 3k) -> hien ngay + gui main. Esc dang ve = bo
  ve (KHONG dong cua so); Ctrl+Z hoan tac; dang ve khong keo-tha file.
- `preload-pin.js`: +saveEdit. `preload-shelf.js`: +onUpdate.
- `main.js`: +ipc 'pin:save-edit' — ghi de DUNG file cu (giu dinh dang theo
  duoi .png/.jpg, JPEG dung q tu cai dat), cap nhat rec.image (copy/keo-tha
  dung ban da ve), lam moi thumbnail + dung luong o khay ('shelf:update').
- `i18n.js`: +ghim.ve, +ghim.veXong (VI/EN).

### File anh huong
- src/main.js · src/i18n.js · src/pin/index.html · src/pin/pin.css ·
  src/pin/pin.js (viet lai) · src/preload-pin.js · src/preload-shelf.js ·
  src/shelf/shelf.js

### Kiem chung
- node --check 6/6 file OK. App nguon chay lai (3 tien trinh).
- ☠️ CHUA test tay duong ve (moi truong nay khong bam chuot len pin duoc;
  selftest hien thoat som khong ra anh — mon no rieng). Logic ve la ban sao
  overlay.js da chay that nhieu ngay, phan MOI can mat nguoi: (1) ve dung cho,
  (2) luu xong file + thumbnail khay doi theo, (3) keo-tha ra Premiere ra ban
  DA VE, (4) Esc dang ve khong dong nham cua so.
- CHO anh Tien test 4 diem tren -> dat thi dong goi 0.3.6.

### Trang thai hien tai (phien sau doc dau tien)
- v0.3.5 nguon = 0.3.5 exe + tinh nang ve (chua dong goi).
- Ban CAI tren may van 0.3.4 (loi tat Desktop tro ban cai) — anh dang chay
  ban NGUON. Cai 0.3.5.exe de len la het lech.




















## 2026-08-26 15:57 — TIM RA GOC "KHUNG VIEN XAU": BONG DO BI CHAT CUT, KHONG PHAI BORDER

### Boi canh
Sau khi doi vien CSS (muc 14:14) va chay ban NGUON, anh Tien ghim thu tren nen
TOI cua Premiere: "phan vien van con y chang". Tren nen toi lan nen sang deu lo
cung mot dai xam om quanh anh.

### Nguyen nhan that
KHONG phai duong border 1px (da doi ma khong doi gi). Thu pham la BONG DO:
`--shadow-pop: 0 18px 52px` lan toi ~70px, nhung le trong suot quanh anh
(PIN_PAD trong main.js) chi 12px -> bong bi CHAT NGANG tai mep cua so, thanh
DAI XAM CO CANH THANG om quanh anh = chinh "cai khung vien xau".
(Bai hoc: hieu ung CSS lan RONG HON vung cua so trong suot thi bi cat cung —
nhin nhu mot phan tu co that. Doi mau/vien khong an thi soi KICH THUOC hieu ung
so voi khoang chua no.)

### Thay doi
- `src/pin/pin.css` #frame: thay `var(--shadow-pop)` bang `0 2px 8px rgb(0 0 0/45%)`.
  Giu vong den 1px (0 0 0 1px 32%).

### File anh huong
- `src/pin/pin.css` (2 dong + comment ☠️ ghi luat "offset+blur <= PIN_PAD").

### Kiem chung bang so
- Tinh tay: bong lan toi da 2+8 = 10px < 12px (PIN_PAD) -> nam gon trong le
  trong suot, tu mo dan, khong con canh chat. (Bao dam THEO CAU TAO — rang buoc
  nam trong con so, khong can do lai tung lan.)
- Mat nguoi: CHO anh Tien dong ghim cu, bam lai thumbnail (cua so ghim moi moi
  doc CSS moi) va xac nhan het dai xam.
- Dau hieu tot kem theo: anh chup Premiere anh gui co DU khung video dang phat
  (khong con o trang) -> WGC (muc 14:37) co ve DA AN; van cho anh chup them
  vai phat tren video dang chay de chot.
- Ca hai OK -> dong goi lai ban cai (npm run dist) de cai de.

## 2026-08-26 14:37 — CHUP VUNG VIDEO RA TRANG -> EP BO CHUP WGC (CHO ANH TEST)

### Boi canh
Anh Tien chup video/hinh de LAY Y TUONG (reference cho dung phim). Chup vung dang
co VIDEO PHAT (TikTok) thi anh luu ra TRANG TRON. Anh keu "video phat ma khong lay
duoc y tuong la chet". Ban dau anh mo ta "khung vien xau" -> em SUA NHAM sang vien
CSS (muc 14:14), anh bao "y nguyen".

### Nguyen nhan that (da do, chac chan)
- Mo file .png vua luu: TRANG TRON, chi con 1 cham xam goc tren (nut "IQ" cua
  video). Nghia la bo chup BAT DUOC giao dien tinh, nhung VUNG VIDEO ra trang.
- File 942x1386 chi 6KB (anh co noi dung ~300KB). Hom nay 2/nhieu anh trang
  (0KB luc 09:57, 6KB luc 14:25) -> loi THI THOANG, dung luc video o lop overlay.
- Goc: video tang toc phan cung nam o lop OVERLAY (multi-plane overlay). Bo chup
  cu Desktop Duplication API doc bo mat desktop KHONG chua pixel video -> trang.
  (Tra web xac nhan: "app hands window to GPU, never writes pixels into the
  desktop surface Desktop Duplication reads".)

### Thay doi
- `src/main.js` (sau require electron, TRUOC app ready): bat feature WGC
  `app.commandLine.appendSwitch('enable-features',
   'AllowWgcScreenCapturer,AllowWgcWindowCapturer,AllowWgcZeroHz')`.
  WGC (Windows Graphics Capture) = bo chup moi, CO doc lop overlay video.
  Windows 11 >=22H2 khong con vien vang WGC (may anh Win11 26200 -> OK).

### File anh huong
- `src/main.js`: +8 dong (khoi appendSwitch).
- (muc 14:14 truoc: `src/pin/pin.css` doi vien — VO HAI, khong lien quan loi nay;
  cho anh Tien quyet giu hay tra ve.)

### Kiem chung
- ☠️ Da xac minh cong tac VAO lenh khoi dong: Win32_Process CommandLine co
  'AllowWgc' (3 tien trinh electron.exe).
- ☠️ CHUA co so do ket qua: em KHONG tu dung lai duoc canh video-overlay o day
  (can video that dang phat). Thuoc do = TAI MAT ANH TIEN chup TikTok that.
  CHO anh xac nhan: hinh video hien ra? con trang? co vien vang khong?
- Neu WGC an -> dong goi lai ban cai, cai de. Neu khong -> thu cach khac.
- ☠️ Ban CAI (%LOCALAPPDATA%\Programs\aio-shot-and-save) doc code trong app.asar,
  KHONG thay sua nay; anh dang test tren ban NGUON (npm start). Da tat ban cai.

## 2026-08-26 14:14 — SUA VIEN XAU CUA ANH GHIM (pin.css)

### Boi canh
Anh Tien bam thumbnail trong khay -> anh ghim noi len tren Facebook (nen trang).
Anh chup man hinh, chi 2 mui ten vao 2 mep anh ghim: "cai khung vien xau qua".

### Nguyen nhan that
`#frame` trong pin.css dung `border: 1px solid var(--line-strong)` = vien TRANG
16%. Tren anh chup nen sang thi vien trang chao/nhoe; tren vung toi thi lo khung.
Vien trang la sai lua chon cho anh ghim noi tren nen bat ky.

### Thay doi
- Bo `border` trang. Thay bang VONG DEN 1px om ngoai qua box-shadow:
  `box-shadow: 0 0 0 1px rgb(0 0 0 / 32%), var(--shadow-pop)` — tach anh khoi
  nen (sang hay toi) ma khong choi, giong Snipaste.
- Bo goc r-md (8px) -> r-sm (6px): anh chup bot bi cat goc.

### File anh huong
- `src/pin/pin.css` (#frame): doi 2 dong (border -> ring den, r-md -> r-sm).

### Kiem chung
- ☠️ CHUA co so do tren nen that. Selftest (`npm start -- --selftest --dev`) o
  moi truong nay THOAT SOM, `.selftest/` rong (log chi co "khong dang ky duoc
  phim tat", khong toi buoc chup) — nhieu kha nang desktopCapturer bi chan.
- Va anh selftest nen XAM cung KHONG lo duoc loi nay (vien trang chi choi tren
  nen SANG that) -> dung bai hoc "selftest 1 nen khong du".
- Xac minh dung: anh Tien ghim thu tren Facebook that. CHO anh phan hoi.
- Fix CSS thuan, KHONG can restart app: createPinWindow loadFile moi lan tao ->
  bam lai thumbnail la ap CSS moi.

## 2026-08-26 13:30 — DONG GOI BO CAI .EXE (electron-builder / NSIS) — DA CAI THU CHAY THAT

### Lam gi
- electron-builder 26.15.3, target NSIS mot-cu-bam, per-user (khong can Admin).
- package.json: khoi `build` (appId com.aiostudio.shotandsave, icon app.ico,
  artifact `AiO-Shot-and-Save-Setup-${version}.exe`) + script `npm run dist`.
- ☠️ Vá truoc khi build: RUN_LOG nam trong app.asar (CHI DOC) o ban dong goi —
  chuyen sang `userData/run-log.txt` khi `app.isPackaged` (log la duong cuu ho,
  chet im la mat dau vet).
- Ra: **AiO-Shot-and-Save-Setup-0.3.4.exe — 99 MB** ->
  `Release/2026-08-26-shotandsave-0.3.4/` kem HUONG-DAN-CAI-DAT.txt (da MO DOC
  LAI toan bo truoc khi dong — luat 3d).

### KIEM THAT (khong tin build sach)
- Cai lang le /S -> `%LOCALAPPDATA%\Programsio-shot-and-save\` du bo.
- Chay ban CAI: 3 tien trinh; Alt+` (config chung %APPDATA%) -> keo -> Enter ->
  **luu that** vao `Anh chup` canh exe; **run-log ghi vao userData** (va asar an).
- File test ban cai da xoa dich danh.

### ⚠️ Trang thai sau dong goi (phien sau + anh Tien can biet)
- Bo cai NSIS TU DE loi tat Desktop cung ten -> loi tat Desktop + Start Menu
  gio chay **BAN CAI v0.3.4** (khong con tro ban nguon). Ban nguon van o thu muc
  du an, dev bang `npm start`.
- File .exe 99MB KHONG len git (`*.exe` da ignore) — nam local o Release/;
  gui may khac qua Drive/USB.
- CHUA ky so: may la se dinh SmartScreen ("More info -> Run anyway") — da ghi
  trong huong dan; mua chung chi khi ban chinh thuc.
- CHUA thu tren may sach (khong co Node/nguon) — viec [CHO] ke tiep truoc khi
  phat cho nguoi ngoai.

## 2026-08-26 13:19 — CHOT PHIEN (/xong): bump 0.3.4, push khay doc

### Trang thai hien tai (phien sau doc dau tien)
- **v0.3.4** (package.json khop — 2 dot push truoc dat ten v0.3.2/0.3.3 trong
  commit ma QUEN bump package.json; da sua ve 0.3.4, dung quen luat 2b nua).
- App chay tu ma nguon qua loi tat Desktop, phim Alt+\`, config nguoi dung:
  PNG/Sieu net, khay DOC, lang EN (anh tu chon qua UI — dung reset).
- Anh Tien da test tay: chup 1 man / vat 2 man / mau / keo vao Premiere — OK.

### [CHO] viec con do + ly do
- **Dong goi bo cai .exe + ky so** — chua lam (dang chay tu ma nguon; can
  electron-builder, mo mat tran moi, cho anh Tien uu tien).
- **Doi chung mixed-scale tren may khac** — thiet ke phys da dung nguyen ly voi
  moi scale, da chay dung tren 150%+125% cua anh; chua do tren cau hinh thu 3.
- **Ve shape cho vung VAT NGANG 2 man** — hien luu thang khong co buoc ve
  (gioi han da bao anh, anh chua yeu cau them).
- 21+ anh test trong Thung rac (25/08) — anh chua quyet khoi phuc hay bo.

## 2026-08-26 13:09 — KHAY DOC: option kieu khay trong Cai dat (anh to, cuon doc)

Anh Tien: khay ngang anh hoi be — them option trong Cai dat:
- **Mac dinh (ngang)**: nhu cu, 380x128, cuon ngang.
- **Doc**: 252x448 DIP, anh chiem CA BE NGANG khay (to gap ~2.3 lan chieu cao
  64px cu, max 150px/anh), nhieu anh cuon DOC.

### Cach lam
- config `khayKieu` ('ngang'|'doc', mac dinh ngang). `coKhay()` tra kich thuoc
  theo kieu; ensureShelf/viTriKhay/trongManHinh dung chung.
- Renderer: preload sendSync 'khay:kieu' -> body.doc -> CSS #list doi truc
  (column + overflow-y), .item img width:100% object-fit cover.
- settings:set-khay: luu config + DUNG cua so khay + dung lai voi co moi +
  VE LAI toan bo anh tu shelfItems (nguon chan ly o main) -> doi kieu SONG,
  khong mat anh.
- Settings card "Khay anh": pill [Mac dinh | Doc]. i18n VI/EN. Cua so 440x700.

### Kiem chung (chup that tung buoc)
- Bo sung: khay DOC + TRONG — thong diep "chua co anh" xep thanh COT giua khay
  (truoc bi gay chu vi khay hep; anh Tien: "cho nay xau qua"). Chup kiem: 3 dong
  can giua sach.
- Seed doc + 2 anh: khay 383x672 phys (dung 252x448 DIP), 2 anh xep DOC to ro.
- Bam pill Default trong Settings (dang chay): khay tu dung lai 576x192 phys
  (dung 380x128 DIP), anh CON NGUYEN trong khay. selftest sach ca 2 kieu.
- Don file test DICH DANH tung ten; 3 anh anh Tien tu chup 13:07-13:08 giu nguyen.

## 2026-08-26 12:58 — NANG CHAT LUONG JPEG (basic >=100KB) + bo tron dong bo nut Settings

Anh Tien: *"dung luong dau ra hoi thap, basic nhat cung phai 100KB"* + *"nut lam
dong bo bo tron het"*.
- CHAT_LUONG_Q: thap 60->95, cao 85->98, sieu 95->100.
  DO CUNG VUNG 1200x700: thap **125KB** (>=100KB dat yeu cau) · cao **171KB** ·
  sieu **221KB** · PNG 424KB (khong doi).
- Settings: .nut -> border-radius pill, nut dong (x) -> tron — dong dang voi bo
  chon JPEG/PNG. Chup kiem: dong bo dep.
- Cau hinh nguoi dung (anh dang chon PNG/Sieu net qua UI) duoc CAT TRUOC KHI DO
  va TRA LAI sau khi do (khong dap len lua chon cua anh).
- Xoa file test bang DICH DANH tung ten (luat moi sau vu glob xoa nham).

## 2026-08-26 12:25 — CAI DAT ANH: dinh dang JPEG/PNG + chat luong (thap/cao/sieu net)

### Anh Tien chot
- Khay hien DUNG LUONG + kich thuoc tung anh (tooltip thumbnail).
- Settings them card "Anh chup": Dinh dang [JPEG|PNG] mac dinh JPEG · Chat luong
  [Thap|Cao|Sieu net] mac dinh CAO. Chon PNG thi hang chat luong tu MO di
  (PNG luon lossless).

### Cach lam
- kho.luuAnh(image, {loai, q}): jpeg -> .jpg toJPEG(q), png -> .png toPNG.
  Q map: thap=60, cao=85, sieu=95. main doc config MOI LAN LUU -> doi ap dung ngay.
- Lop trung gian (ghep shape / vat man) da doi sang PNG lossless tu truoc —
  chat luong cuoi chi phu thuoc lua chon luc LUU.
- settings:get/set-anh + card UI pill (segmented) + i18n VI/EN du.

### DO THAT — cung mot vung 1200x700 tren man 4K (bang dung luong cho anh):
| jpeg/thap  | 31 KB  |
| jpeg/cao   | 54 KB  | <- mac dinh
| jpeg/sieu  | 101 KB |
| png        | 424 KB |
Duoi file dung (.jpg/.png), kich thuoc dung 1200x701 ca 4 ca. Settings render
dung (PNG chon -> hang chat luong mo). selftest sach.

### ☠️ LOI DON DEP CUA EM (thu nhan)
rm voi mau `AiO-2026-08-26-1*` de xoa 4 file test nhung mau nay nuot MOI file
gio 10h-19h — xoa nham ca file test cua anh Tien luc 11:11 (khong qua thung rac).
Chung la anh chup man hinh thu nghiem trong buoi debug, khong phai tai lieu that.
Cung ho 5am-bis: mau xoa RONG hon danh sach minh tao = xoa do nguoi khac.
Luat: xoa file test = xoa DICH DANH TUNG TEN da ghi lai, khong dung glob.

## 2026-08-26 11:31 — GHEP THEO PIXEL VAT LY: dung ti le voi MOI cau hinh man/scale

### Anh Tien: "chua dung ti le vung chup khi 2 man khac do phan giai/kich thuoc"
DO THAT ra cau hinh that cua may: man 27" = 3840x2160 @150%, man 24" =
**2560x1441 @125%** — 2 SCALE KHAC NHAU (truoc gio tuong cung 150%).

### 3 loi goc tim ra bang so + log
1. Ghep theo DIP: 2 man khac scale thi phan man 24" bi PHONG 1.2x so voi man
   27" -> "chua dung ti le". Sua: ghep theo PIXEL VAT LY (nhu Snipping Tool) —
   moi man dan 1:1 anh goc, khong scale, khong meo. Theo doi keo cung bang phys
   (screen.dipToScreenPoint), chua/annotate/composite deu quyet bang phys bounds.
2. ☠️ desktopCapturer voi MOT thumbnailSize chung UPSCALE man nho (2560x1441 tra
   ve 3840x2160 — mo + sai co luu). Sua: goi getSources RIENG tung man voi size
   native (Promise.all; grab chay nen nen khong anh huong do tre overlay).
   Kem guard: moi duong cat/ghep tu do kich thuoc anh THAT roi quy doi (kx,ky).
3. ☠️ onFrozen chep layers lam ROI px/py/pw/ph -> composite khong bao gio san
   sang -> retry 15 lan -> fallback NaN (khong luu gi). Sua: chep du truong.

### Kiem chung bang so (log chuoi day du)
- frozen OK: px=0,0 3840x2160 | px=-2560,712 2560x1441, anh NATIVE tung man.
- Keo vat 2 man: drag-end phys {-834,783,1334x516} -> composite 1:1 ->
  luu **1334x516 KHOP TUNG PIXEL** voi duong chuot that. Mo anh: du 2 man,
  chu net ca 2 ben, khong con lech ti le. selftest sach.
- Nhan kich thuoc khi keo (gSize) nay hien theo PIXEL VAT LY = dung voi file luu.

### ☠️ Bay THUOC DO moi (ghi de khoi vap lai)
SetProcessDPIAware (system-aware) chi dung toa do 1:1 tren MAN CHINH —
SetCursorPos len man phu khac scale bi Windows quy doi lech (do duoc: dat
(-1000,940) -> chuot that (-834,783), he so 1.25/1.5). Test chuot xuyen man
tren may mixed-DPI phai dung Per-Monitor-V2 context, hoac doi chieu vi tri
THAT qua log cua app (cach da dung). Va: chay SendInput khi ANH TIEN dang cam
chuot that = hai nguon input danh nhau, ket qua nhiem — phai bao anh dung tay
hoac nho anh tu keo.

### Cho anh Tien kiem tay
May em khong the tu dat chuot chinh xac len man 125% (bay tren) — nho anh keo
vai nhat: 1 man 27", 1 man 24", vat 2 man; doi chieu nhan kich thuoc vs file.

## 2026-08-26 11:22 — KHUNG CAM hien tren man kia (khong vet) + toa do DUNG MOI SCALE

### Anh Tien yeu cau 2 viec (26/08)
1. Keo tu man 24" sang 27" phai THAY khung cam ben man 27" — nhung khong duoc
   tai phat vet sang/toi (ly do hom qua go guong).
2. ☠️ "Moi user mot cau hinh man/scale khac nhau" — toa do phai dung voi moi
   do phan giai / ti le / scale, khong chi may anh (2 man cung 150%).

### Sua goc — chuyen theo doi keo chon ve MAIN
Lo hong that: clientX cua renderer quy doi theo scale cua CUA SO DANG KEO —
2 man khac scale (100%/125%...) la toa do phan ben kia SAI. Nay:
- mousedown -> 'overlay:drag-start'; MAIN neo diem + interval 16ms doc
  `screen.getCursorScreenPoint()` (DIP toan cuc, Electron tu quy doi DUNG theo
  scale TUNG man) -> phat 'overlay:sel-rect' {rect, laChu} cho MOI overlay.
- Moi man tu ve PHAN GIAO: khung cam + 4 TAM MO quanh no (#guong) — khong
  box-shadow nen khong the tai phat vet sang/toi. laChu hien nhan kich thuoc.
- mouseup -> 'overlay:drag-end': MAIN chot vung, so voi bounds DIP tung man:
  nam tron 1 man -> 'overlay:annotate' (rect cuc bo, focus man do de Enter/Ctrl+C
  roi dung cho); vat ngang -> 'overlay:composite' cho chu ghep. Duoi 8px -> huy.

### Kiem chung bang so (log dieu phoi + file)
- 1 man: drag-end rect 400x266 DIP -> "vao annotate" -> ve khung -> Enter ->
  luu **600x399** (=400x266 x1.5, khop TUNG pixel).
- Vat 2 man: drag-end {-800,544,1133x322} -> "composite (vat ngang)" -> luu
  **1700x483** (=1133x322 x1.5) — mo anh: du noi dung CA 2 man, sang dung.
- Log guong (lan do truoc): 4 tam + khung bam chuot tung nhip 16ms.
- selftest sach. ☠️ Thuoc CopyFromScreen KHONG THAY overlay (setContentProtection
  loai no khoi capture) — muon kiem guong phai capturePage hoac mat nguoi.

### Gioi han con lai
May anh 2 man cung 150% nen chua co doi chung THUC TE cho truong hop 2 scale
KHAC nhau — thiet ke moi dung getCursorScreenPoint la dung ve nguyen ly voi moi
scale, nhung chua do tren may that co scale lech. Ghi de test khi co may.

## 2026-08-26 11:11 — SUA 3 LOI 2-MAN (toi/thieu man/2 anh) + NHAT KY CHAY + bai hoc kiem thu

### Anh Tien bao 3 loi (26/08 sang) + phe binh dung: "lam xong khong kiem truoc khi bao"
1. Anh ket qua BI TOI (thay ro khi keo vao Premiere).
2. Chup vat 2 man -> ket qua chi co 1 man.
3. Khay luc nhan 1 anh, luc nhan 2 anh.

### Nguyen nhan + sua
1. TOI: grab chay SAU khi overlay hien -> lop mo 42% bi NUONG vao anh chup.
   Truoc gio selftest "sach" la nho RACE hen (grab snapshot truoc khi dim paint).
   Sua GOC: `win.setContentProtection(true)` cho overlay (WDA_EXCLUDEFROMCAPTURE)
   -> Windows loai overlay khoi moi anh chup, het hen xui.
   DO: ti le sang anh-luu / man-goc = **0.98** (dinh mo se ra 0.58).
2. THIEU MAN + ANH TRANG 590 byte: confirmComposite chi cho layersReady — anh
   hong/chua nap van "xong" (onerror cung dem) -> drawImage im lang -> trang/thieu.
   Sua: guard `img.complete && naturalWidth>0` cho MOI man giao; chua san sang
   thi retry 200ms toi da 15 lan; het duong -> fallback cat phan man minh; try/catch.
   DO: keo vat 2 man ra **1601x581 va 5072x1239 (chinh anh Tien chup) — du CA 2 man**.
3. HAI ANH: them KHOA mot-nguoi-keo ('overlay:lock' relay) — man nao mousedown
   truoc giu quyen, man kia bo qua chuot. DO: moi luot chup ra DUNG 1 file.

### NHAT KY CHAY (.run-log.txt, luon bat, gitignore, tu cat 300KB)
Ghi: capture-start / grab-xong (layout man) / mousedown-mouseup (origin, rect) /
composite (OK-cho-retry-fallback) / confirm (kieu, kich thuoc) / luu (ten file).
La "duong ghi lai cho tool lam sai ngay luc dang dung" theo luat san pham.

### ☠️ BAI HOC KIEM THU (anh Tien day thang)
Selftest duong dep 1 man KHONG PHAI la kiem. Tu nay truoc khi bao xong cho tool
chup man hinh: (a) do TI LE SANG anh luu vs man goc; (b) chay ca duong vat 2 man
tu CA HAI phia; (c) dem so file sinh ra moi luot; (d) doc .run-log.txt doi chieu.
Cai bay sau: mot phep kiem TUNG XANH nho race (grab nhanh hon dim paint) —
xanh khong co nghia la dung, phai hieu VI SAO no xanh.

## 2026-08-26 08:56 — THIET KE LAI man Cai dat (than thien hon — anh Tien yeu cau)

Ap bai hoc so thiet ke #5: "mot man mot CTA chinh — nguoi dung that tung che
4 nut lang nhang". Man cu bay 3 nut cung luc o card phim tat.

### Thiet ke moi
- Phim tat hien dang KEYCAP that ([Alt] + [`], gradient + vien day 3px duoi).
- May trang thai mot-CTA: idle [Doi phim…] -> recording (khung cam net dut
  NHAP NHAY "Nhan to hop moi…" + Huy) -> pending (keycaps MOI + Luu cam + Huy).
- "Ve mac dinh" thanh link chu nho gach chan (het canh tranh voi CTA).
- Thu muc: icon chip cam + TEN thu muc dam + duong dan mo cat dau (RTL).
- Icon chip cam dau moi muc + footer "AiO Shot & Save · v0.3.1" (settings:get
  tra them version). Cua so 440x442.

### Kiem chung (chup that tung trang thai)
idle VI dep; bam Doi phim -> recording render dung; nhan Ctrl+Alt+P -> pending
[Ctrl]+[Alt]+[P] + Luu/Huy; bam Huy -> ve idle GIU Alt+` (khong luu nham);
EN dich du. selftest sach. Config cuoi: hotkey Alt+`, lang vi.

### ☠️ 2 bay THUOC DO khi tu dong test (khong phai loi app)
1. keybd_event KHONG kem scan code -> e.code = "Unidentified" -> bo ghi phim
   (doc e.code) bo qua. Phai gui KEYEVENTF_SCANCODE (sc 0x1D/0x38/0x19).
2. Moi phien PowerShell moi PHAI goi SetProcessDPIAware truoc SetCursorPos —
   quen la toa do bi nhan 1.5, click truot het (da vap lai trong chinh buoi nay).

## 2026-08-26 08:48 — ✅ ANH TIEN DA TEST THAT: "app rat okie roi do em"

Thuoc do ngoai (tay + mat anh Tien tren 2 man hinh that) da qua — theo luat
"dung truoc khi ban". Pham vi da test: chup 1 man, cac sua loi trong ngay.
Chot so: bump package.json 0.1.0 -> **0.3.1** (khop ten ban trong commit — tranh
bay version lech kieu Auto Podcast). Them dong 12 vao TOOL_VERSION_TRACKER.
Con de ban: dong goi bo cai .exe + ky so (chua lam).

## 2026-08-25 15:33 — BO khung "guong" man kia (het vet sang/toi chia doi)

### Boi canh
Anh Tien: *"bam chup ben man trai thi man ben kia co mot lop sang va toi"*.

### Nguyen nhan
Khung "guong" (sel-mirror) em them de xem truoc keo xuyen man: khi vung chon nam
TRON mot man, khung guong o man kia nam ngoai ria viewport — lop toi cua no la
box-shadow spread 100vmax, chi phu duoc 100vmax tinh tu mep phan tu -> HUT giua
man -> mot nua toi (co shadow) mot nua sang (het shadow) = vet chia doi.

### Sua
BO han sel-mirror (renderer + preload + relay o main). Man kia gio chi hien
dimEl 42% DONG DEU. Keo VAT NGANG 2 man van chup duoc (confirmComposite dua tren
toa do, khong can guong) — chi khong con xem truoc khung o man thu hai khi keo.

### Kiem chung bang so
Do TI LE sang (overlay/baseline) tai 8 diem ngang man phu khi dang chon vung o
man chinh: **0.57-0.63 deu** (~0.58 = dung dim 42%). Truoc do la nua toi nua
sang. selftest sach.

## 2026-08-25 15:22 — QUET LAI VUNG: bam ra ngoai = bo vung cu, chon lai (nhu Lightshot)

Anh Tien: *"o Lightshot anh chi duoc quet 1 vung"* -> chot y: bam RA NGOAI vung
da chon la bo vung cu + quet vung moi ngay (truoc day phai Esc roi bam phim tat
lai). Trong vung van la ve shape nhu cu.
- overlay.js batDauVe: bam ngoai vung -> chonLaiTuDau(e): ve mode select, xoa
  shapes + canvas, an toolbar, bat dau keo ngay tu diem bam.
Do that: chon vung A (700x450 physical) -> bam ngoai quet vung B (600x300) ->
Enter -> file luu DUNG 600x300 px (vung B). selftest sach.

## 2026-08-25 15:04 — KHOANH VAT NGANG 2 MAN HINH: luu du ca 2 (ghep multi-display)

### Boi canh
Anh Tien: *"chon vung o ca 2 man thi luu chi co 1 man"*. Truoc day moi overlay
lam viec doc lap theo toa do cuc bo -> keo sang man kia thi phan do mat.

### Cach lam
- main gui cho MOI overlay: goc DIP toan cuc cua man no (origin, trong
  overlay:init) + anh dong bang cua TAT CA man kem toa do (overlay:frozen
  {layers}).
- Renderer theo doi vung chon; khi tha chuot:
  - Vung nam GON trong man nay -> vao che do ve shape nhu cu.
  - Vung VAT NGANG man khac -> confirmComposite: canvas ghep phan giao tu anh
    dong bang cua TUNG man (dung sf tung man, thang do ra = sf lon nhat), gui
    dataUrl. Grab chua xong thi pendingComposite doi.
- Khung chon HIEN CA O MAN KIA: overlay dang keo phat 'overlay:sel' (DIP toan
  cuc), main tiep song 'overlay:sel-mirror' cho cac overlay khac ve phan giao
  (khong hien nhan kich thuoc o man guong).

### Gioi han (chu y)
- Vung vat ngang 2 man: LUU THANG, khong co buoc ve shape (ve shape chi khi vung
  nam trong 1 man).
- 2 man lech doc trong desktop ao -> phan khong man nao phu = MANG DEN trong anh
  (Snipping Tool cung vay).

### Kiem chung bang so
Keo that tu man chinh (physical 600,1500) vat sang man phu: file luu
**1434x516 px** — doi chieu toa do DIP khop cong thuc (556 DIP tu man phu +
400 DIP tu man chinh, S=1.5). Mo anh: TRAI = noi dung man phu (doan chat),
PHAI = man chinh (Premiere), dung vi tri va net. selftest sach.

## 2026-08-25 14:55 — BO dan anh dong bang len man hinh (het "duplicate")

### Boi canh
Anh Tien gui anh: taskbar hien 2 LAN, noi dung in bong nhu nhan doi, va dan
*"loai bo lop phu overlay"*.

### Nguyen nhan
Kien truc "hien tuc thi": anh dong bang grab NEN xong duoc DAN len lam nen
(#shot backgroundImage). Anh dan bi lech/scale khong khop pixel voi man hinh
that phia sau cua so trong suot -> nhin nhu moi thu duplicate (taskbar 2 lan).

### Sua
BO han viec dan anh len man hinh (onFrozen chi giu frozenImg NGAM de ghep shape
+ cat luu). Nguoi dung nhin man hinh THAT xuyen qua — khong the lech.
Danh doi (chap nhan): noi dung DONG (video dang chay) thi anh cat = khoanh khac
grab (~0,5s sau khi mo overlay), khong phai luc tha chuot. Voi man hinh tinh
(da so truong hop chup) thi khong khac gi.

### Kiem chung bang so
- Chup vung taskbar khi overlay dang mo (sau khi frozen ve): taskbar hien
  DUNG 1 LAN (truoc: 2).
- Ve khung + Enter: anh luu sang binh thuong, khung cam dung cho, khong dim,
  khong dinh hint. selftest sach.

## 2026-08-25 13:51 — Ctrl+C khi chup: vao khay + COPY clipboard (them, giu Enter/nut check)

Anh Tien: *"bam Ctrl+C cung vao khay duoc khong — them chu ko xoa 2 option dang co"*.
Them: che do annotate bam **Ctrl+C** -> xong (vao khay) VA copy anh vao clipboard
(vi Ctrl+C = copy, tien dan ngay). Enter + nut check VAN nguyen (khong copy).
- overlay.js keydown: Ctrl+C (mode annotate) -> xong(true).
- xong(copy): them co copy vao payload confirm.
- main handleConfirm: payload.copy -> clipboard.writeImage(cropped) truoc khi vao khay.
- Tooltip nut Xong: "Xong (Enter · Ctrl+C = sao chep)".
Do that: chup -> ve -> Ctrl+C: file VAO KHAY + Clipboard.ContainsImage()=True.

## 2026-08-25 13:48 — BANG CHON MAU cho cong cu ve (mac dinh CAM)

Anh Tien: *"cho anh bang chon mau, mac dinh cam"*. Them dai 7 mau vao thanh cong
cu ve: cam (accent, MAC DINH) · do · vang · xanh la · xanh duong · trang · den.
Bam swatch doi mau; moi shape LUU mau rieng (doi mau khong doi shape da ve).
- overlay/index.html: #mau-nhom 7 nut .mau (data-color + inline bg).
- overlay.css: .mau (tron 18px, .chon co vien trang).
- overlay.js: curColor mac dinh '#f86820'; chonMau(); shape luu {color}; veShape
  dung s.color.

Do that: ve khung -> CAM (mac dinh) dung; bam swatch -> shape doi mau (test hit
trang -> khung trang). Thanh cong cu render dep: swatch cam co vien trang (dang
chon).

## 2026-08-25 13:35 — HIEN TUC THI (nhu Lightshot) + VE SHAPE (khung/mui ten) + UI khay

### 1. Overlay hien TUC THI — het "pop-up cho ~0,5s"
Anh Tien: *"van bi pop-up — Lightshot khong bi"*. Goc: cho grab (~0,5s,
getSources CHAN luong chinh) xong MOI hien overlay.
Doi kien truc: overlay cua so TRONG SUOT hien NGAY (thay man hinh that qua no),
grab chay NEN — kick SAU khi overlay dau tien da hien+paint (setTimeout 40ms),
xong thi gui anh dong bang (freeze view) + luu full-res de cat. Selection do
RENDERER xu ly nen keo chon duoc ngay du main dang grab.
Do that: overlay HIEN o **~165ms** (truoc: 450ms), lop mo fade CSS 150ms.
handleConfirm: neu chua grab xong (chon nhanh) thi await grabPromise.

### 2. Ve shape khi chup (khung vuong + mui ten) — nhu Lightshot
Chon vung xong -> hien THANH CONG CU (khung/mui ten/hoan tac/huy/xong). Ve tren
canvas device-res dat dung vung chon. Xong: co shape thi renderer GHEP (crop
frozen device-res + canvas shape) -> dataURL; khong shape thi gui rect (main cat
full-res, net). Enter=xong, Ctrl+Z=hoan tac, Esc=huy. Mau shape = accent cam.
handleConfirm nhan { rect } HOAC { dataUrl }.
Do that: ve khung -> anh luu co khung cam dung cho; ve mui ten -> co mui ten +
dau mui ten dung huong. Thanh cong cu render dep (rect dang chon sang cam, xong
mau xanh).

### 3. UI khay: chu dinh nhau -> chip phim
Dong "chua co anh": phim tat truoc day <b> dinh sat chu. Nay tach thanh CHIP
kieu phim ban phim (.phim-chip: nen accent-soft, vien, bo goc), dung textContent
+ span rieng cho co khoang cach ro.

### File moi/sua
overlay: index.html (canvas #ve + #toolbar), overlay.css (toolbar/canvas/chip),
overlay.js (viet lai: may trang thai select->annotate, ve rect/arrow, ghep).
main.js (startCapture instant + kickGrab + handleConfirm rect|dataUrl),
preload-overlay (onInit/onFrozen/confirm payload), i18n (5 khoa cong cu ve),
shelf.js + shelf.css (chip phim).

### Kiem chung bang so
selftest sach (3 anh, 0 errors). overlay HIEN ~165ms. Ve khung + mui ten:
2 anh luu deu co shape dung. Don file test.

### Con lai
- Pre-warm overlay de xuong ~30ms (chua lam; 165ms da du muot).
- Keo-tha vao Premiere/Zalo: co san, chua tu dong test (chuan Windows).
- 21+ anh test trong Thung rac; chua commit/push.

## 2026-08-25 13:03 — HIEU UNG FADE muot khi hien overlay (anh Tien: "muot & than thien nhat")

### Thay doi
Overlay khong "pop" nua — FADE opacity 0->1 (~130ms) qua `fadeInOverlay()` o
main (setInterval 8 buoc). Ca anh dong bang + lop mo mo dan hien vao. Bo fade rieng
cua #dim/#hint trong CSS (de ca cua so fade cung nhau, khoi chong nhau).
Selftest thi hien ngay (khoi cho fade).

### Kiem chung bang so
Burst chup vung sang tren man chinh sau khi bam Alt+`:
t=0ms sang=249 -> 188 -> 171 -> 145 (t>=125ms on dinh). Giam DAN trong ~125ms,
khong sut dot ngot, khong khung den (min 145 = dung 42% dim). selftest sach.

## 2026-08-25 12:59 — SUA GOC "van pop-up khi bam chup" (nen den lo ra)

### Boi canh
Anh Tien: *"no van bi pop-up man hinh len — luc anh bam chup"*. Ban truoc da thu
sua "man den nhap len" bang cach doi 'overlay:ready' roi moi show, NHUNG van bi.

### Nguyen nhan GOC (do duoc)
Overlay tao voi `show: false`. ☠️ Cua so AN thi Chromium TREO
`requestAnimationFrame` (background throttling). Ma tin hieu 'overlay:ready'
(bao anh da ve) nam trong double-rAF -> KHONG bay ra khi cua so con an -> cua so
hien qua TIMER du phong 400ms, luc do anh chua chac ve xong -> lo NEN DEN.

### Sua
Them `webPreferences.backgroundThrottling: false` cho overlay -> cua so an van
ve + rAF chay -> 'overlay:ready' bay som. Doi timer du phong 400 -> 1000ms (chi
con la luoi an toan).

### Kiem chung bang so
- Log thoi diem show (tam): TRUOC nghi la ~400ms qua timer; SAU khi sua: show qua
  READY o **~180ms** (sau khi anh da ve). Da go log.
- Burst chup 10 khung ~40ms sau khi bam: do sang giu 225 roi giam nhe 198 (lop mo
  vao) — KHONG khung nao den. Het nen den lo ra.
- selftest sach.

### Con phai hoi anh Tien
Neu VAN thay "pop-up": co the y anh la (a) man PHU cung hien overlay (do moi man
mot overlay de khoanh dau cung duoc), hay (b) overlay hien hoi dot ngot. Cho anh
mo ta them.


## 2026-08-25 11:43 — MUOT HON + thu muc luu + logo/layout Cai dat + SONG NGU VI/EN

### Boi canh
Anh Tien (nhieu yeu cau trong buoi): *"xem phan mem co muot ma khi bam chup"*,
*"chac chan keo-tha vao bat ki app"*, *"them setup folder luu anh"*, *"thay logo
va thiet ke lai layout"*, *"ngon ngu app la tieng Anh va tieng Viet"*.

### 1. Muot hon — DO THAT truoc khi sua (luat 5b/5x)
Bam Alt+` -> doi ~1,2s moi thay overlay = do. Do tach:
- getSources goi 2 LAN (moi grabDisplay 1 lan) = 1220ms.
- Sau khi goi getSources 1 LAN: 924ms (getSources 487 + toDataURL PNG 4K 435).
- Doi hien thi sang JPEG (img.toJPEG 90, ~50ms/man) + GIU anh goc full-res o main
  de cat (net khong doi): **512ms**. Giam 58%.
Kem: overlay chi `show()` sau khi anh ve xong + FADE lop mo 140ms + chi dan
truot vao 180ms -> khoi den dot ngot, muot.
☠️ Cat chuyen ve MAIN (rect) tu anh goc -> net; renderer chi gui rect.
☠️ Cache wcId cho 'closed' cua overlay (doc webContents.id sau huy = nem).

### 2. Thu muc luu anh (settings)
kho.thuMucAnh() da doc config.thuMucAnh san. Them IPC pick-folder (dialog chon
thu muc) + open-folder, va muc trong man Cai dat. DO THAT: seed config thuMucAnh
= thu muc temp -> chup -> file VAO dung thu muc moi. Xoa seed, ve mac dinh.

### 3. Logo AiO + thiet ke lai Cai dat
Cua so Cai dat: FRAMELESS, header rieng co LOGO AiO (SVG inline, mau cam) + tieu
de + toggle VI/EN + nut dong. Than = 2 CARD (Phim tat / Thu muc). icon cua so =
app.ico (khoi hien logo Electron mac dinh). Do that: chup VI + EN deu dep.
Luat 5an-bis: nut cam dac >=13px bold.

### 4. Song ngu VI/EN
`src/i18n.js` — tu dien VI/EN + t(lang,key). main giu `lang` (config), tray
dung T(). Moi preload require i18n + nap lang SYNC (ipcRenderer.sendSync
'i18n:lang') -> window.i18n.t(). Renderer dich [data-i18n] / [data-i18n-title].
Doi ngon ngu: settings:set-lang -> luu config + rebuild tray + RELOAD moi cua so.
☠️ Sua luon dong "chua co anh" cua khay: truoc cung `Ctrl+Shift+S`, nay hien
PHIM TAT THAT qua ipcRenderer.sendSync 'hotkey:display' (formatAccel).
Do that: settings VI/EN, overlay hint EN "Drag to select · Esc to cancel".

### Kiem chung bang so
- selftest sach nhieu lan (3 anh, 0 errors.txt) qua tung buoc.
- grab 1220 -> 924 -> 512 ms (do bang console.time tam, da go).
- Chup that: overlay khong den nhap; anh cat NET (chu sac); thu muc moi nhan file;
  settings VI/EN + overlay hint EN chup man hinh xac nhan.
- Don: file selftest cua em; 21 file test cu nam trong THUNG RAC (khoi phuc duoc).

### Con lai / chua lam
- Keo-tha: da co (startDrag file), da do vao Explorer + xuyen 2 man. Anh dan
  "chac chan vao BAT KI app": startDrag file la chuan Windows (CF_HDROP) — moi
  app nhan file deu duoc. CHUA tu dong test vao Premiere/Zalo (kho automation).
- 6-21 anh test trong Thung rac: cho anh quyet khoi phuc hay bo.
- Chua commit/push.


## 2026-08-25 11:09 — CHUP DA MAN HINH: khoanh vung o man nao cung duoc (tu nhien nhu Lightshot)

### Boi canh
Anh Tien: *"nhu vay khong tu nhien lam — Lightshot va cac app khac khong ai lam
vay"*. Truoc do tool chi chup MAN CO CON TRO, man kia khong chup duoc.

### Nguyen nhan cach cu khong tu nhien
`startCapture` lay `getDisplayNearestPoint(cursor)` -> chi chup 1 man. Muon
chup man kia phai di chuot sang roi moi bam.

### Da thu cach A (MOT overlay khong lo vat ngang ca man hinh ao) — HONG
Ghep tat ca man vao 1 cua so `enableLargerThanScreen`. Do that tren may anh Tien
(man chinh 4K 3840x2160 + man phu 3072x1728, DPI 150%): cua so KHONG phu het man
chinh, bang tinh ben phai van sang (khong bi lam mo). Cua so vat qua nhieu man 4K
DPI khac nhau khong dang tin.

### Cach B (CHOT): moi man MOT overlay rieng
`grabDisplaysList()` chup tung man -> `openOverlays()` tao MOT cua so overlay
PHU DUNG tung man (toa do cuc bo 0,0). Khoanh vung o man nao cung duoc. Cat bang
CANVAS trong renderer (1 layer/overlay) -> giu net dung DPI tung man.
- `main.js`: `overlayWin` (1) -> `overlayWins` (mang). closeOverlay dong het.
  Selftest chi chay o overlay dau (idx 0) de khoi confirm N lan.
- `overlay.js` + overlay.css: da lam theo "layers" tu truoc nen dung lai duoc
  (moi overlay 1 layer). Cat canvas ghep tung layer, do net theo sf man chua tam
  vung chon.
- `handleConfirm(dataUrl)`: nhan anh da cat tu renderer -> luu -> khay.

### Kiem chung bang so — THAT tren 2 man
- selftest: 3 anh, khong errors.txt.
- Bam Alt+` -> dem cua so overlay lon: **2** (dung 1/man).
- Dong "Keo de chon vung" hien tren CA 2 man.
- Khoanh vung TREN MAN PHU (X am -2600..-1600): ra file that 6.148 byte, noi dung
  DUNG (panel Graphics cua Premiere tren man phu), NET.
- Da xoa file test cua em; 9 file con lai la cua anh Tien.

### Gioi han da biet
Khoanh vung VAT NGANG 2 man (bat dau man nay ket thuc man kia) KHONG duoc — moi
overlay chi trong man cua no. Hiem gap; Lightshot cung tach theo man. Neu anh can
thi phai quay lai cach A + xu ly DPI ky hon.


## 2026-08-25 10:32 — SUA "man den nhap len" + chup xong CHI vao khay (bo bung pin)

### Boi canh
Anh Tien: *"khi bam Alt+` thi man hinh co van de — no nhay ra mot man hinh nua
roi moi chup. Chup xong anh can no tu vao khay luon"*.

### #1 — "man hinh nua" = man DEN nhap len truoc khi hien anh
Overlay tao voi `backgroundColor: '#000000'` va `show()` goi NGAY sau khi gui
anh, nhung renderer chua ve anh dong bang xong -> nguoi dung thay MAN DEN full
man hinh nhap len roi anh moi hien.
Sua: renderer giai ma anh (`new Image().onload`) + double rAF roi moi bao
`overlay:ready`; main chi `show()` khi nhan ready (co timer du phong 400ms).
- `main.js`: bo show() trong did-finish-load, them IPC `overlay:ready` -> show.
- `preload-overlay.js`: them `ready()`.
- `overlay.js`: preload anh roi bao ready.
Do that: selftest-overlay.png hien DUNG anh man hinh (Premiere+trinh duyet),
KHONG den.

### #2 — chup xong CHI vao khay, KHONG bung pin (anh Tien chot)
`handleConfirm` truoc: luu -> shelfAdd -> createPinWindow (pin bung noi len).
Nay: luu -> shelfAdd. BO createPinWindow khoi luong chup.
Tinh nang ghim VAN CON: bam thumbnail trong khay -> `shelf:pin` -> createPinWindow.
Selftest van chay duong ghim (nhanh IS_SELFTEST trong handleConfirm) de kiem +
lo chup selftest-pin/shelf.png + thoat app.

### Kiem chung bang so
- selftest: 3 anh, khong errors.txt, app thoat sach.
- Chup THAT bang Alt+` (SendInput) -> liet ke cua so: **Khay hien=True,
  Pin hien=False** (dung mong doi), file moi `AiO-...103143-850.png` vao khay.
- Da xoa 1 file test cua em; 7 file con lai la cua anh Tien (test cua anh).


## 2026-08-25 10:09 — MAN CAI DAT PHIM TAT + doi duoc phim tat (Win/Mac)

### Boi canh
Anh Tien hoi: *"neu minh ban cho mac thi phim tat la gi, o win phim tat la gi?
minh khong co mot cai setup phim tat rieng do em"*. Roi chot phim moi: **Alt + `**.

### Mac/Win — da tu lo tu truoc
Phim mac dinh viet `CommandOrControl+Shift+S`: Electron tu anh xa **Ctrl** tren
Win, **Cmd (⌘)** tren Mac. Mot dong code, hai he dung.

### Thay doi
- `main.js`: HOTKEY co dinh -> `currentHotkey` nap tu config
  (`kho.docCauHinh().hotkey || DEFAULT`). Them `setHotkey()` (thu dang ky phim
  moi; that bai thi KHOI PHUC phim cu + bao that bai, khong de mat luon phim),
  cua so `openSettings()`, 3 IPC `settings:get/set-hotkey/reset`.
- `preload-settings.js` + `settings/` (index.html, settings.css, settings.js):
  man Cai dat mo tu tray. Bam "Ghi phim moi" -> nhan to hop -> Luu.
- Bo ghi phim dung `e.CODE` (vi tri phim vat ly) chu KHONG dung `e.key` —
  e.key doi theo Shift (Shift+` = ~, Shift+2 = @) lam sai accelerator.

### ☠️ Bay 1: phim backtick khong bat duoc neu chi cho [a-z0-9]
Anh muon Alt+`. Bo ghi ban dau chi nhan chu/so/F-keys -> backtick tuot.
Sua: map `e.code` -> ky tu: Backquote->`, Minus->-, ... (CODE_PUNCT).
Da test truoc: `globalShortcut.register('Alt+`')` = OK (literal backtick);
'Alt+Backquote'/'Alt+Grave'/'Alt+192' deu FAIL. Nen accelerator dung la `Alt+``.

### ☠️ Bay 2 (thuoc do cua em, KHONG phai app): BOM lam JSON.parse chet
Seed config bang PowerShell `Set-Content -Encoding utf8` -> them BOM ->
`JSON.parse` cua Node chet -> `docCauHinh` nuot loi tra {} -> app roi ve mac
dinh, settings hien "Ctrl+Shift+S" du config ghi Alt+`. Ghi lai bang .NET
UTF8 KHONG BOM thi settings hien dung "Alt + `". App tu ghi config (ghiCauHinh)
thi khong BOM nen binh thuong khong dinh.

### ☠️ Bay 3 (thuoc do): SetForegroundWindow tu PowerShell bi Windows chan
Lai driver man Cai dat bang SendInput -> phim roi vao TRINH DUYET phia sau (chup
ra trang Google). Doi cach: test phim tat TOAN CUC (khong can focus cua so nao).

### Kiem chung bang so — THAT
- Man Cai dat mo tu `--open-settings` (co tam, da GO): render dung, hien
  "Ctrl + Shift + S" (mac dinh), sau khi set config hien dung "Alt + `".
- Bam Alt+` TOAN CUC (SendInput VK_MENU+VK_OEM_3) -> ra overlay -> keo vung ->
  sinh file THAT `AiO-...100552-825.png` 19.489 byte. Toan chuoi
  config->register->capture chay dung voi phim anh chon.
- `main.js` sach (0 dau vet // TAM / IS_OPENSET / peek).

### ☠️ Chu y du lieu: 6 anh test cua anh Tien (09:23-09:27) o THUNG RAC
Trong luc lam, 6 anh anh Tien chup thu bi don vao Thung rac (goc: Anh chup).
`rm` cua em xoa THANG (khong qua thung rac) nen KHONG phai em -- nhieu kha nang
anh tu Delete trong Explorer. Van con nguyen, khoi phuc duoc. Da HOI anh co muon
khoi phuc khong. File 100456 (266KB, 10:04) nghi la anh tu bam Alt+` -> GIU LAI.

### Trang thai
config hien: `hotkey: "Alt+`"`. App dang chay voi phim nay.


## 2026-08-25 09:45 — DRAG & DROP: keo anh THA vao app khac (tinh nang loi)

### Boi canh
Anh Tien: *"em lam drag and drop di em — anh co the xem - keo va tha bat ki
phan mem va app nao"*. Day la tinh nang CLAUDE.md liet ke la CHUA LAM tu dau.

### Thay doi
Dung `webContents.startDrag({ file, icon })` — keo tha file .png THAT (khong
phai anh base64) nen tha duoc vao MOI app nhan file: Premiere, Zalo, Messenger,
Explorer, trinh duyet...
- `main.js`: `createPinWindow` nhan them `filePath`, luu vao `pins`.
  Them 2 handler: `pin:start-drag` va `shelf:start-drag` -> goi startDrag voi
  file that + icon 96px. Boc try/catch (icon rong la startDrag nem).
- `preload-pin.js` / `preload-shelf.js`: lo `startDrag`.
- `pin.js` + pin.css + index.html: KEO ANH GHIM = tha ra app. Vi keo-tha
  (dragstart) chiem cho keo-di-chuyen cu, DOI: di chuyen cua so = keo THANH TREN
  (#bar, con=move), keo anh = tha file. `img draggable=true`,
  `-webkit-user-drag: element`.
- `shelf.js` + shelf.css: thumbnail `draggable=true`, dragstart -> startDrag.
  BAM van = ghim lai (click va dragstart khong dam nhau).

### ☠️ Xung dot phai xu ly: keo-tha vs keo-di-chuyen
Tren cua so ghim, keo anh truoc gio = di chuyen cua so (mousedown+mousemove).
HTML5 dragstart CHIEM cho mousemove -> khong the vua keo-di-chuyen vua keo-tha
tren cung mot vung. Tach: anh = tha ra app; thanh tren = di chuyen.

### Kiem chung bang so — THAT, khong chi build sach
Tu dung moi truong test (luat 3a): tu bam Ctrl+Shift+S qua SendInput, tu keo
chon vung -> sinh file that `AiO-...094221-464.png` (23.082 byte). Roi:
- KEO TU KHAY -> tha vao cua so Explorer (thu muc dich rong truoc do):
  file 23.082 byte ROI DUNG vao thu muc. Explorer o MAN HINH PHU (-2160) ->
  keo xuyen 2 man hinh van an.
- Xoa file dich. KEO TU ANH GHIM -> tha vao Explorer: lai ra 23.082 byte.
- Ca 2 kenh (`pin:start-drag` + `shelf:start-drag`) deu PROVEN drop file that.
- selftest lai sau khi sua: 3 anh, khong `errors.txt` -> khong lam hong luong cu.
Da don: 2 file test cua em (KHONG dung 6 file 09:23-09:27 cua anh Tien — luat
5am-bis: xoa theo GIO se cham file cua nguoi khac), thu muc dich, cua so Explorer.


## 2026-08-25 09:33 — SUA "VIEN VO DUYEN" quanh khay anh

### Boi canh
Anh Tien: *"sao no co cai vien vo duyen vay em?"* (kem anh chup khay tren nen sang).

### Nguyen nhan that — DO DUOC, khong doan
`#shelf` co `inset: 10px` (le trong suot de chua bong) + `box-shadow: shadow-pop`
(`0 18px 52px den 62%`). Tren nen TOI (hinh nen desktop) thi tang hinh — nen
truoc gio khong ai thay. Tren nen SANG (cua so trang / chat phia sau) thi khe
10px lo nen sang + bong lon xoe ra = mot VIEN xam bo tron bao quanh khay toi.
Khong phai vien cua Windows — la CSS.

### Cach do (tu dung moi truong test cua minh — luat 3a)
Them co TAM `--peek-shelf` (hien khay + 1 anh gia, giu mo), tat ban dang chay,
mo ban peek, chup man hinh THAT co nen trang phia sau:
- TRUOC: ro vien xam bo tron + khe ho (`vien-nen-sang.png`).
- SAU:  tam phang sach, chi vien 1px, KHONG khe, KHONG halo (`vien-sau.png`).
Do tren ca nen toi va nen sang. Da GO co `--peek-shelf`; `main.js` byte giong
het ban commit (khong con trong `git diff`).

### Thay doi
`src/shelf/shelf.css` — `#shelf`: `inset: 10px` -> `inset: 0` (khay lap kin
cua so), bo `box-shadow`. Giu `border: 1px` + `border-radius: 12px`.
Goc bo tron van sach (window transparent nen ngoai ban kinh la trong suot,
Windows khong ve them vien).

### Con lai — CHUA sua, cho anh Tien quyet
Cua so GHIM (`pin.css` + PIN_PAD=12) dinh Y HET mau nay (le trong suot + bong).
Se hien cung "vien vo duyen" tren nen sang. NHUNG anh ghim la anh chup noi tren
noi dung bat ky -> bong giup tach khoi nen, co the la CO Y. Chua dong vao vi
anh Tien chi chi khay; hoi truoc khi sua (doi PIN_PAD con dung toi phep dat vi
tri cua so ghim).

### Kiem chung bang so
- Chup man hinh THAT truoc/sau tren nen trang: vien bien mat.
- `git diff`: chi `shelf.css` (+ CLAUDE.md/PROGRESS.md). `main.js` sach.
- App chay lai qua LOI TAT: 3 tien trinh electron song.


## 2026-08-25 09:14 — CAI LOI TAT tren may cong ty (chay tu ma nguon, KHONG dong goi exe)

### Boi canh
Anh Tien: *"cai de vua su dung vua test di em, khong dong goi exe nhe"*.
Ngay sau khi da chay duoc app o muc tren.

### Thay doi
- `assets/app.ico` (MOI) — icon Windows cho loi tat. Logo goc `tray.png`
  387x353 KHONG vuong; ep thang vao shortcut la MEO (dung loi da sua cho tray
  24/08). Ve len khung vuong 256x256, can giua theo chieu cao, boc PNG trong ICO.
- `scripts/cai-loi-tat.ps1` (MOI, 82 dong) — cai/go loi tat.
  Loi tat tro THANG `node_modules\electron\dist\electron.exe .` (khong qua
  npm -> khong hien cua so den). Tao 2 cho: Desktop + Start Menu.
  Co `-Go` de go (luat: co duong vao phai co duong ra). Go chi xoa 2 .lnk,
  KHONG dung ma nguon / anh da chup.
- `CLAUDE.md` — them canh bao "may moi phai npm install truoc".

### Vi sao KHONG dong goi exe / KHONG auto-start
- exe: anh Tien chot khong lam. Chay tu ma nguon de sua code la app doi ngay,
  hop cho vua-dung-vua-test.
- auto-start: anh noi "vua dung vua test" -> bat/tat lien tuc, chua cam auto-run.
  De anh chu dong bat sau neu can.

### ☠️ Bay: chay .ps1 tay bi Windows chan (bo sung sau khi anh Tien vap)
Anh Tien chay `powershell -File scripts\cai-loi-tat.ps1` -> bao
"running scripts is disabled on this system" (ExecutionPolicy = Restricted).
KHONG phai app hong — loi tat da cai san TU truoc (em cai qua tool noi bo,
tool do tu vuot chan) va van dung binh thuong. Chay .ps1 TAY thi phai them
`-ExecutionPolicy Bypass`. Da them vao CLAUDE.md.
Loi tat khong dinh bay nay vi no tro THANG electron.exe, khong qua .ps1.

### Kiem chung bang so
- Bam THAT vao loi tat Desktop (khong chi tao file): app len, MAIN PID sau 6s,
  WorkingSet 65 MB.
- App DOC LAP: tien trinh cha da thoat -> khong treo vao phien Claude.
- Icon: `System.Drawing.Icon` doc duoc 256x256.
- Doi chung script 2 chieu: TRUOC Desktop+Start=True -> `-Go` -> ca hai False
  -> cai lai -> ca hai True. Ca hai duong deu chay.
- `git status` sach (2 file .lnk + .ico + .ps1 nam ngoai / da gitignore hoac
  la file moi trong repo — kiem lai truoc khi commit).


## 2026-08-25 08:55 — CHAY DUOC TREN MAY CONG TY (KHONG sua ma nguon)

### Boi canh
Anh Tien: *"chay shot and save cho anh o may nay di toi qua dang bi loi"*.
May cong ty (DRT-G21), vua `git pull` ve 2 commit moi nhat (`cff7b2c`).

### Nguyen nhan that — KHONG phai loi code
`node_modules/` bi `.gitignore` chan (dung chuan). Nen `git pull` **khong bao
gio** mang Electron ve. Keo code ve xong bam chay la chet ngay buoc dau.
Day khong phai loi cua tool — day la buoc cai con thieu tren may moi.
☠️ Bai hoc dung cho MOI may moi / MOI panel Electron trong bo: **keo code ve
!= chay duoc**. File bi gitignore la file phai TU DUNG LAI tren tung may.

### Thay doi
KHONG sua mot dong ma nguon nao. `git status` sach truoc va sau.
Chi chay `npm install` -> 13 goi, 9 giay, Electron **43.4.1** dung ban ghi
trong CLAUDE.md.

### File anh huong
`node_modules/` (moi tao, gitignore) · `package-lock.json` (npm tu cham mtime,
noi dung KHONG doi — da xac nhan bang `git status`).

### Kiem chung bang so
Chay dung duong kiem cua du an: `npm start -- --selftest --dev`

| Kiem | Ket qua |
|---|---|
| `.selftest/errors.txt` | KHONG sinh ra |
| selftest-overlay.png | 2.078.018 byte, dung do phan giai that |
| selftest-pin.png | 584.354 byte — net, crop dung vung, bo goc + vien AiO |
| selftest-shelf.png | 27.841 byte — logo AiO, dem "1", du 3 nut |
| File that tren dia | `Anh chup/AiO-2026-08-25-085410-087.png` 505.429 byte |
| App that (`npm start`) | 3 tien trinh electron.exe song, log 0 loi |

Da MO 3 anh ra nhin bang mat, khong chi dem file.

### Don dep
Xoa 1 tam anh do selftest tu chup (`AiO-2026-08-25-085410-087.png`, 08:54) —
no chup dung man hinh chat cua anh Tien. Thu muc `Anh chup` trong TRUOC do
nen khong dung vao tam nao cua anh. Xoa ca `.selftest/`.


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
