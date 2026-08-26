# PROGRESS — AiO Shot & Save














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
