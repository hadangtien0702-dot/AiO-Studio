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

☠️ **10/09 ANH TIEN CHOT LAI: BO BAN TAURI, anh tu xoa thu muc `AiO Shotandsave
Tauri/`. ELECTRON (thu muc nay) LA BAN DUY NHAT, HET DONG BANG** — sua loi va
them tinh nang deu lam o day. Doan duoi giu lai de biet VI SAO tung dinh doi:

~~ANH TIEN CHOT 31/08 22:30: cong nghe di theo la TAURI 2 (Rust + webview,
mot ma nguon Win + Mac).~~ Electron duoi day tung DONG BANG o
0.4.2 (31/08 -> 10/09). Ly do dinh doi: the loai app chup man
(theo chuot tung ms + capture nang + da man DPI) danh thang vao diem yeu
2-tien-trinh cua Electron — ca chuoi loi giat/rung/nhay 0.3.9→0.4.2 la mot
benh kien truc; cac app cung nganh (Lightshot, ShareX, Flameshot, CleanShot)
deu native 1 tien trinh. Truoc khi port full PHAI SPIKE do 4 diem (xem
PROGRESS muc TRANG THAI). UI HTML/CSS/tokens + 3 luat keo-chon + so loi +
harness mang theo nguyen.

- Electron **43.4.1 ghim cung** trong package.json (10/09 — truoc la `latest`:
  `npm install` co the nhay major Chromium, app chup man nhay nhat cho do).
  Nang ban = doi so co y + chay `npm test` + `npm run test:khay`. JavaScript
  thuan (CommonJS), khong bundler.
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
  kho.js             Luu anh (thuMucAnh doc config, DOI DUOC; mac dinh ban cai =
                     %LOCALAPPDATA%/shotandsave, file shotandsave-<gio>.ext — so loi #11) + cau-hinh.json
                     + duongDanKeoAnToan(): keo-tha qua hard link .keo khi duong dan co ky tu la (0.4.17).
  preload-overlay.js Cau IPC cho overlay (-> window.overlay) + i18n.
  preload-pin.js     Cau IPC cho cua so ghim (-> window.pin) + i18n.
  preload-shelf.js   Cau IPC cho khay (-> window.shelf) + i18n + hotkey display.
  preload-settings.js Cau IPC cho Cai dat (-> window.settings) + i18n.
  overlay/           Man chon vung: MOI man mot overlay, anh dong bang + fade.
  pin/               Cua so ghim sticky: anh + thanh cong cu + keo di chuyen.
  shelf/             Khay anh: thumbnail + keo-tha ra app khac + tay nam DOI CO o CA 4 GOC (0.5.1 `.grip-goc`,
                     goc doi dien dung yen; #grip = goc tren-trai giu id cho harness); anh DOC (h>w) co class
                     `doc-anh` hien cao toi 340px khong cat (0.5.3) (0.4.12: san = co mac dinh, tran 60% man chua khay, luu khayCo.{ngang,doc};
                     #list la LUOI o co dinh: ngang cao len = them HANG, doc rong ra = them COT —
                     anh Tien: "xem nhieu anh hon, KHONG phong anh").
  settings/          Man Cai dat (frameless, logo AiO, card): doi phim tat, doi
                     thu muc luu, toggle ngon ngu VI/EN.
  luong-chup.js      Cua so AN giu luong chup chay san (0.5.0) + bo QUAY VIDEO (0.8.0). luong/ = trang cua no.
  khay-thu.js        01/10 KHAY ANH TU THU VE NUT TRON O GOC: dieu phoi 3 cua so (khay · nut tron src/nut · san dien
                     src/dien) + hen gio tu thu. Doc dau file truoc khi dung vao. preload-nut.js, preload-dien.js.
  kho-video.js       So ghi cac doan quay video (0.8.0).
  khay/              01/10 13:59 CUA SO KHAY GOP (ban xem truoc, anh chua chot): MOT cua so, 2 the Storyboard | Video.
                     index.html + khay.js (doi the) + khay.css. Noi dung tung the van do storyboard/storyboard.js va
                     video/video.js dung (ca hai boc trong ham, nap chung 1 trang). preload-khay.js = i18n +
                     require preload-storyboard.js + preload-video.js (2 file nay la PHAN, khong dung rieng).
                     main.js: moKhay('dai' | 'video'). KHONG con storyboard/index.html, video/index.html.
                     Bay: thanh tieu de la vung keo cua so -> cum the phai `-webkit-app-region: no-drag`; hai file
                     danh sach chung trang nen id phai rieng (#dem-dai / #dem-video, #trong-dai / #trong-video).
  dem/               Thuoc dem quay 3 giay (index.html), net vien (vien.html), dong ho + nut Dung quay video
                     (quay.html + preload-dem.js).
assets/              tokens.css, fonts/Inter.woff2, tray.png, app.ico (AiO logo).
```

## Luong chup (main.js)

☠️ **0.5.0 (15/09): LUONG CHUP CHAY SAN + OVERLAY TAO SAN — doc `src/luong-chup.js` truoc.**
Bam phim -> `startCapture` -> `kickGrab`: neu `luong.sanSang()` thi lay khung tu luong
(0.5.2: JPEG NHANH nua do phan giai ve truoc ~30-60 ms -> `phatFrozen(...,nhanh)` URL `.../nhanh.jpg`;
JPEG day du ~120-200 ms -> `capNhatFrozenDayDu`; raw BGRA ve sau ~250-350 ms -> `rawStore` + `rec.image`),
KHONG thi roi ve `grabDisplaysList()` (getSources, sàn ~400 ms) — log `nguon=luong|grab`.
`openOverlays` dung `poolWins` (tao + nap san sau boot 1,5 s va sau moi `closeOverlay` 0,4 s)
-> overlay hien 12-35 ms sau phim (do 15/09). Doi chung: `AIO_LUONG=0` (grab cu),
`AIO_POOL=0` (tao overlay moi), `AIO_LUONG_FPS=n`, `AIO_USERDATA=<dir>` (chay song song ban
cai de do), `AIO_SELFTEST_TRE=ms` (selftest doi luong san sang). Cac buoc 1-5 duoi day la
duong DU PHONG, van dung khi luong chua san sang.

1. Phim tat (mac dinh `CommandOrControl+Shift+S` = Ctrl tren Win / ⌘ tren Mac;
   DOI DUOC qua man Cai dat, luu vao `cau-hinh.json`) / bam tray -> `startCapture()`.
2. ☠️ **0.4.15 (14/09) DAO LAI: GRAB TRUOC, overlay SAU** (`GRAB_TRUOC`, mac dinh 1).
   Do that: cua so trong suot phu len video (YouTube Shorts, lop MPO) **>=0,5s la WGC
   tra vung video DEN (sang 0)**, <=0,2s con hinh. Che do cu (overlay hien ~165ms ->
   grab) khoanh khac chup roi ~600ms sau khi phu -> anh chup video den (anh Tien bao
   14/09). Nay `startCapture` goi `kickGrab()` roi moi `openOverlays()`: chup xong
   +515ms, overlay hien +594ms KEM frozen san (kieu Lightshot). Doi lai overlay hien
   muon hon ~0,4s — la gia cua viec video khong den. `AIO_GRAB_TRUOC=0` = che do cu
   (chi de doi chung, DUNG bat lai cho nguoi dung). ☠️ KHONG dung 1 cua so vat ngang ca man hinh ao: may 4K + man phu
   DPI 150% no khong phu het.
3. `kickGrab()` (goi SAU khi overlay hien + lop mo toi xong: `GRAB_TRE_MS` = **200ms**
   tu 0.4.9 — 40ms cu lam fade #dim dung hinh 1s, do `do-mo-dan.mjs` 14/09) chup
   TUNG man qua `desktopCapturer` (device px), gui anh dong bang -> renderer dat
   lam nen (`overlay:frozen`, freeze view) + luu full-res de cat.
   ☠️ Anh di qua protocol `aioshot://` (buffer o main, `frozenStore`), IPC CHI
   mang URL (0.4.1, may nha 31/08). **0.4.13 (14/09): frozen la JPEG q92 CHI DE
   NHIN** — toPNG 4K = 642ms SYNC tren luong chinh (do that; ghi chu cu "~250ms,
   chay nen" SAI), grab 1.240 -> 465ms. Anh co shape / vat 2 man: renderer xin
   cat DUNG VUNG tu NativeImage goc (`rawStore`) qua `aioshot://raw/<key>/x_y_w_h.png`
   luc Xong (PNG, 960x630 = 36ms) -> file luu van lossless. Harness `npm run
   test:raw`. DUNG doi lai PNG toan man. ☠️ getSources co SAN ~370ms (chup 1x1 cung
   vay, 1 hay 2 lenh nhu nhau) + grab-tre 200ms + fade 100ms = den video ~0,75s la
   GIOI HAN; anh chot 14/09 KHONG lam mo-dun chup native/Tauri — dung de xuat lai. man 5K2K ra base64 ~5,7MB, gui
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

**`npm test`** (10/09) = chinh selftest tren nhung TU CHAM bang ma thoat (5 dieu
kien, xem dau `scripts/test/selftest.mjs`), don dich danh file test. Chay tai
MAY THAT — KHONG dua len CI headless (do gia). Doi chung: `AIO_TEST_GRAB_LOI=all
npm test` phai TRUOT. **`npm run test:co-khay [doc|ngang]`** (14/09) = keo to/kep san-tran/luu
config/them hang-cot/net, 8 phep — dung vao co khay thi chay (dat `AIO_TEST_ANH_DIR`
tro thu muc BAN SAO anh lon de phep NET co nghia). **`npm run test:mo-dan [ms]`** = quay lop mo
sau phim tat (grab-tre). **`npm run test:khay [ngang]`** = do MUOT cuon khay bang
CDP screencast (chuan DAT: gap p95 <= 40ms, 0 buoc nhay >60px; so 10/09: doc
p95 30ms, ngang 29ms). Dung vao shelf.js cuon/wheel thi chay lai.

Ep duong LOI (10/09): `AIO_TEST_GRAB_LOI=all` (0 man -> phai thay `LOI grab:
0/N` + overlay dong, 0 anh; selftest se treo toi timeout — binh thuong) hoac
`AIO_TEST_GRAB_LOI=<displayId>` (man do bi loai, man kia van ra anh,
`layers=N-1`). Ep loi LUU: sua `.selftest/userData/cau-hinh.json`
`thuMucAnh` tro o khong ton tai -> phai thay `LOI luu anh` + van qua buoc
ghim/khay. Xong nho tra config va xoa DICH DANH file anh test sinh ra.

☠️ **Selftest duong dep 1 man KHONG DU** (anh Tien day 26/08 sau 3 loi lot luoi).
Truoc khi bao xong PHAI them: (a) do TI LE SANG anh luu vs vung man goc (~1.0;
0.58 = dinh lop mo); (b) keo vat 2 man tu CA HAI phia, anh phai chua du 2 man;
(c) moi luot chup ra DUNG 1 file; (d) doc `.run-log.txt` (nhat ky chay luon bat)
doi chieu tung buoc. Overlay PHAI co `setContentProtection(true)` — khong thi
grab (chay sau khi overlay hien) nuong lop mo vao anh.

## QUY TAC ANH TIEN CHOT 10/09 — doc truoc khi nhan bao cao review / de xuat refactor

> Rut tu buoi 10/09: mot bao cao review (AI khac) dua 2 muc "uu tien". Do that
> thi muc 1 SAI o ket luan (nhung lo ra loi that khac), muc 2 dung so nhung
> khong dang lam. Anh dan: *"nho note vao brain cua du an cac quy tac nay"*.

**1. Bao cao review (nguoi hay AI) la GIA THUYET, khong phai ket luan — DO
truoc khi tin, DO truoc khi sua.**
- Ca that: bao cao noi *"luuAnh tra null -> path.basename(null) -> main vang"*.
  Doc code thi dung tung buoc. Chay thu Electron 43 thi **main KHONG vang**:
  `handleConfirm` la async goi khong `await` -> TypeError thanh unhandled
  rejection, Electron chi in canh bao, tien trinh song tiep (do: song sau 3s,
  exit 0). Nhung hau qua THAT con te hon cai bao cao noi: **anh mat im lang**
  — khong vao khay, khong log, khong bao.
- Cach do re nhat: dung app Electron toi gian ~10 dong lap lai dung kich ban,
  hoac ep config ve trang thai hong (`thuMucAnh = Q:\khong-ton-tai`) roi chay
  `--selftest` doc run-log. Mat 2 phut, khoi sua nham huong.
- ☠️ Bay ky thuat di kem: **ham async goi khong `await` thi loi nem ben trong
  KHONG bao gio len `uncaughtException`** — handler o dau main.js mu voi no,
  `.selftest/errors.txt` cung khong ghi. Duong nao co the that bai (ghi file,
  encode, IPC) thi phai tra ket qua ro (null/false) va **ben goi phai kiem**,
  dung tin "khong thay loi".
- Luat cu van ap: "chi bao khi THAT BAI" (anh, 25/08) — that bai ma im lang
  la loi nang hon ca crash, vi nguoi dung tuong da xong.

**2. KHONG tach file / refactor vi "file lon". Chi tach khi (a) co tinh nang
moi can cho o, hoac (b) do duoc do dinh cheo cao.**
- Ca that: de xuat tach `main.js` 1.238 dong thanh 4 module. Do: 36 ham,
  **32/36 chi cham DUNG MOT vung trang thai**, 4 ham cham cheo deu o keo-chon
  + ghim (ban chat phai cheo). File lon nhung KHONG roi. Tach = doi kien truc
  tren ban anh da cham DAT 31/08, loi ich nguoi dung = 0, rui ro hoi quy that
  (so loi #8: 3 lan hoi quy/ngay o keo-chon — do 2 nguon ve da nhau, tach
  file khong doi duoc).
- Truoc khi gat mot de xuat refactor, do 3 so: **so ham cham >=2 vung trang
  thai / tong so ham**, **ham dai nhat**, **so bien trang thai dung chung**.
  Ti le cheo thap thi tu choi, ghi so vao PROGRESS de lan sau khoi do lai.
- Neu van muon gon: cat khoi IT DINH NHAT truoc (Settings, Hotkey — moi khoi
  1 vung, ~150 dong), KHONG dung keo-chon/frozen. Kiem bang selftest + harness
  settings.
- Nguyen tac chung cua anh: **"dung truoc khi ban"** — thu anh khong nhin
  thay tren man hinh thi khong xep truoc thu anh nhin thay.

**3. Sua xong thi hoi "con ai di qua dung cho nay?" — nhung CHI sua noi anh
dang dung.** 10/09 em va cung loi sang ban Tauri, anh chan ngay: *"anh khong
dung ban Tauri"* roi *"anh se xoa"*. Ban khong dung = khong sua, va cap nhat
tai lieu cho khop ngay trong buoi (CLAUDE.md repo muc 2/3/5/8/9 da sua).

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
| 3 | **"Sua roi van thay cu"** (26/08, TAI DIEN 27/08) | Anh Tien chay BAN CAI (loi tat Desktop tro `AppData\Local\Programs\`), sua ma nguon khong toi do | **01/10 anh chot: dang lam / dang test thi NAP THANG vao app dang cai, khong tao bo cai** -> sua xong = `node scripts/cai-tai-cho.mjs` + doc dong `boot vX.Y.Z` trong run-log THAT (script doc qua `\\localhost\C$`, vi `%APPDATA%` trong container cua Claude la ban ao cu). ☠️ Nap tai cho thi `ProductVersion` cua .exe KHONG doi -> dung do no. Chi khi anh bao "test xong het" moi `npm run dist` + cai de + push + web (AGENTS.md muc 5) |
| 4 | **Xoa nham file cua anh khi don test** (24/08 loc theo gio, TAI DIEN 26/08 glob `AiO-...-1*`) | Gio / mau ten / duoi file la thuoc tinh KHONG phan biet chu so huu | Luc TAO file test ghi TEN vao danh sach; don = xoa DICH DANH tung ten trong danh sach do. CAM glob/loc-gio |
| 5 | **Version lech** (2 dot push ten 0.3.2/0.3.3 ma package.json khong bump) | Quen bump; khong co gi nhac | Bump package.json + sua dong 12 TOOL_VERSION_TRACKER trong CUNG commit |
| 6 | **Selftest/kiem XANH GIA** (24/08 loi bi nuot; 26/08 xanh nho RACE grab-nhanh-hon-dim; 26/08 selftest 1 man khong du — anh Tien day thang) | Selftest thoat som nuot hop thoai loi; phep kiem xanh ma khong hieu vi sao xanh | uncaughtException ghi `.selftest/errors.txt`; checklist 4 diem o muc Verify (ti le sang / vat 2 man 2 phia / dem file / doc run-log); mot phep kiem chua tung DO thi chua tin |
| 7 | **Dan quyet dinh cu bi dao ma khong do lai nguyen nhan** (31/08 — chinh la #1 quay lai) | So cu chi ghi TRIEU CHUNG ("dan la lech") khong ghi nguyen nhan da do -> phien sau DOAN | Ghi bay = ghi kem NGUYEN NHAN DA DO + con so; dao quyet dinh cu = TAI LAP nguyen nhan bang so do truoc (brain: `bay-dao-quyet-dinh-cu-khong-do-lai.md`) |
| 8 | **Ve khung khi keo — HOI QUY 3 LAN TRONG 1 NGAY 31/08** (giat drop-fps -> rung 2 nguon -> te le -> nhay khi vat man) | Vung nay co HAI nguon ve (mousemove local + main sel-rect 16ms) tren NHIEU man/DPI — moi lan chinh mot nguon la ho nguon kia. Chuot ra khoi man chu la mousemove NGUNG (khong pointer capture) | Luat hien hanh (0.3.17): local vua ve <50ms thi main NHUONG; local im thi main TIEP QUAN (`lanVeLocal`). ☠️ Dung vao onSelRect/mousemove ma khong chay `test-keo-vat-man.js` (3 giai doan) + `test-overlay-drag.js` la se hoi quy lan 4 |
| 10 | **Khung/chu ve tren ANH GHIM lech xa chuot** (26/08 co san, anh bao 10/09 khi them cong cu chu) | Canvas `#ve` chi co `position:absolute; inset:0` — canvas la REPLACED element, `inset:0` KHONG keo theo khung, lay kich thuoc THUOC TINH dip*DPR -> man 150% to gap 1,5 lan, do lech 101px | `width:100%;height:100%` CSS + JS dat `style.width/height` = DIP. Harness `npm run test:khung -- <ban sao>` (lech phai <=3px). Luat: canvas do phan giai that PHAI dat CA thuoc tinh (device px) LAN style (DIP) |
| 11 | **CAI DE = MAT ANH nguoi dung** (14/09: 2 anh anh chup sang do bien mat sau `Setup-0.4.5 /S`, khong vao thung rac) | NSIS one-click xoa sach `$INSTDIR` truoc khi chep ban moi; mac dinh cu `thuMucAnh` = `<thu muc exe>/Anh chup` nam ngay trong do (chon 24/08 vi cam Pictures/OneDrive) | 0.4.6: mac dinh ban dong goi ngoai INSTDIR; **0.4.16: `%LOCALAPPDATA%/AiOShotSave/AnhChup`** — ten cu `AiO Shot & Save` co '&' lam keo-tha vao Chrome/Lark/Teams/Zalo/Messenger ra FILE RONG (Chrome: size=0, lastMod=gio tha; do 14/09 bang 3 cua so tha thu, doi ten thu muc la du byte). Luat: **KHONG BAO GIO ghi du lieu nguoi dung vao thu muc cai; duong dan mac dinh KHONG '&' KHONG dau cach; doi thu muc mac dinh = do lai KEO-THA vao Chrome that**. 0.4.17: moi duong keo di qua `kho.duongDanKeoAnToan()` — thu muc nguoi dung co ky tu la thi keo qua hard link `.keo`; truoc moi lan cai de PHAI chup danh sach `Anh chup` va so lai sau cai. Harness ghi de anh chi chay tren BAN SAO — va ban sao do KHONG phai ban luu du phong (14/09 mat ban goc anh 2 vi the) |
| 15 | **Video quay "SAI VOICE": tieng lech hinh** (0.8.0, anh bao 01/10) | Hinh di qua nhieu khau hon tieng (chup man -> luong -> canvas -> bo ghi) nen toi bo ghi TRE hon: tieng di TRUOC hinh 110-123 ms (vung 600x210) va 152-205 ms (vung 2400x1350) — do bang bang chop + bip 3 kHz. `captureTime` cua khung KHONG dung de tu do duoc (bao 4 ms). ☠️ Thuoc dau tien do bip bang bien do: may dang phat am thanh khac la bat hut (2-5 / 9) -> loc dung tan so | `src/luong/luong.js`: tieng qua WebAudio DelayNode, tre = 105 + 12 x trieu-diem-anh ms; lay khung thang tu luong (MediaStreamTrackProcessor). **`npm run test:dongbotieng`** (hien bang dem + PHAT bip ra loa ~35 s — hoi anh truoc): lech giua -40..+80 ms, doi chung khong lam tre phai <= -80 ms. ☠️ Muc tre can tren 1 may (4K 60 Hz, RTX 4060 Ti); doi may / doi duong lay khung / doi co tran video thi DO LAI |
| 14 | **Video quay GIUT "nhu thieu fps"** (0.8.0, anh bao 01/10 sau khi xem lai trong Khay video) | File ghi 30 khung/giay nhung HINH THAT chi doi 5 lan/giay: luong chay san cua cung man xin toi da 5 khung/giay va Chromium chia CHUNG mot bo chup cho moi luong cua cung man -> luong quay 30 fps mo them van chi nhan 5 hinh/giay; 25 khung con lai moi giay la khung lap. Do: bang dem tren man 60 Hz so chi nhay moi 12 lan ve; 3 file that cua anh hinh doi moi 6 khung (53-56 lan/file), 13 % khung co hinh moi. ☠️ Lot luoi vi bai do chi DEM khung/giay (29-30 nen bao dat) va md5 tung khung dem THIEU khung lap (bo nen H.264 tinh chinh dan nen khung lap khong giong het tung bit: bao 2,5-10 % trong khi that la 87 %) | `src/luong/luong.js`: luc quay NANG luong chay san cua man do len 30 khung/giay (applyConstraints), quay xong ha ve 5; ve theo khung that (MediaStreamTrackProcessor, du phong requestVideoFrameCallback) + `captureStream(60)` de bo ghi tu bat khung (☠️ KHONG `captureStream(0)` + `requestFrame()`: 2 / ~35 luot moi lan goi ra HAI khung), man dung yen thi giu nhip 30 bang hen gio. **`npm run test:nhipquay`** (hien bang dem 400x140 ~30 s — hoi anh truoc): cach mac dinh >= 85 % dung nhip, lap <= 3 %, rot <= 1 %; DOI CHUNG cach cu phai bi bat. Luat: **do video = doc NOI DUNG tung khung (bang dem / muc khac biet giua 2 khung), khong dem so khung; dung vao luong-chup / luong.js thi chay lai bai nay** |
| 13 | **Vien quay Storyboard LOT VAO ANH** (0.7.4, anh chup 29/09 08:09: 3/6 khung dinh cam 31 px canh tren + trai) | Windows KHONG cho cua so mong hon ~30 px (do 29/09 man 150%, 7 cau hinh: mac dinh 301x31, thickFrame false 300x38, transparent 300x38, minWidth/minHeight 1, setMinimumSize(1,1), type toolbar 4x300 nhung 300x38) va tra cua so TO THEM 1 px phai/duoi (40 -> 41). Thanh 3 px xin o mep vung phinh 31 px LAN VAO vung | 0.7.6: `src/vien-quay.js` — moi canh 1 cua so >= 40 px cach vung 2 px (KE) + `setShape` giu net 2 px + `setContentProtection`; sau khi hien do `getBounds`, cham vung thi huy + run-log `CANH BAO vien`. `npm run test:vienquay` (2006 vung, ep 40 px + 1 px, doi chung hinh cu phai truot). Luat: ~~cua so phu nho KHONG BAO GIO xin co < 40 px~~ **SUA 01/10: co toi thieu tinh theo DIEM ANH THAT (~57-58 px), khong theo DIP: 150% -> 38 DIP, 125% -> 46 DIP (run-log 12:56: xin cao 40 duoc 46, canh tren bi huy, doan anh quay mat 1 canh vien), 100% -> ~58 DIP (suy ra, chua do). Cua so phu nho xin >= 64 DIP** (`DAI = 64`; bai do ep 58 + doi chung so do that man 125%). ☠️ **SUA 29/09 09:18: setShape tren cua so DAC van ve phan ngoai hinh mau TRANG** (do tren nen #202020: ca dai 40 px ra f3f3f3, anh thay "vien trang"; setShape sau khi hien cung vay) -> vien = cua so TRONG SUOT, thickFrame false, net ve bang HTML `src/dem/vien.html`; anh cham "qua dep". Van nam NGOAI vung (video phan cung qua vien: chua do) |
| 12 | **Test bung cua so len man anh DANG LAM** (24/08 khay thu 2; 15/09 selftest + video spike + exe dong goi chay lan 2 -> `second-instance` cua ban cai BUNG overlay; anh: "bật overlay xong để đó hả em") | selftest/harness = chup THAT tren man that; exe cung ten chay lan 2 thua lock -> ban cai nhan second-instance = startCapture | Anh dang ngoi may thi KHONG chay selftest/exe thu — xin gio truoc; `AIO_USERDATA` cho ban dong goi; run-log ghi `boot: da co ban khac dang chay` |
| 9 | **"DAT o cong ty, may NHA van y chang"** (31/08 toi — chuoi keo-chon vua cham DAT buoi trua; sau 0.4.1 con "keo va GIU giat 15xx/1405") | HAI goc cung mot kich ban bam-chuot-khi-grab-dang-chay: (a) base64 ~5,7MB qua IPC do vao renderer DANG keo (6/6 luot drag-start dinh 20-40ms sau grab-xong); (b) main nhan drag-start MUON ~880ms moi hoi con tro lay NEO — tay da keo 100-150px -> neo main LECH neo local -> giu yen tay la 2 nguon nhap nhay 2 so khac nhau, vung LUU cung lech | 0.4.1: anh di `aioshot://`, IPC chi mang URL. 0.4.2: neo = DIEM MOUSEDOWN renderer gui kem drag-start; con tro TRONG man chu thi main khong ve man chu (local la nguon duy nhat), ra ngoai (vat man) main moi ve. Run-log ghi `keo gap-max` + `con tro luc main nhan da troi Xpx` — "muot" phai la SO tu may man LON nhat. Duong frozen/neo dung vao PHAI chay du 4 harness (drag · keo-vat-man · frozen-storm · composite) |

**Bay 1-lan nhung se can lai khi them tinh nang** (deu da co chot trong code —
DUNG go):
- ☠️ **DOC CHU (phim 5, 29/09):** Windows KHONG co bo doc tieng Viet (bang FOD Microsoft: vi-vn khong co goi OCR) ->
  app tieng Viet dung Tesseract (`src/ocr.js`). tesseract.js 5.1.1 co 3 bay CHI lo trong Electron / ban dong goi:
  langPath -> fetch loi; langs {code,data} -> Init loi; getCore luon nap core DAY DU (khong phai -lstm). Duong dung:
  cachePath=assets/ocr + cacheMethod 'readOnly' + asarUnpack node_modules. Doi gi o day PHAI do lai bang
  `"dist/win-unpacked/AiO Shot & Save.exe" --thu-ocr <anh> <ra.json>` (khong cua so, khong danh thuc ban dang chay).
  Chay electron tu shell cua Claude: bo `ELECTRON_RUN_AS_NODE` (VS Code dat =1 -> electron chay nhu Node tran).
  ☠️ NGON NGU GIAO DIEN ≠ NGON NGU NOI DUNG: ban dau chon bo doc theo ngon ngu app -> anh de app tieng Anh, doc chat
  tieng Viet -> 2 lan bam 5 deu ra bo doc Windows, mat dau ~20%. Nay Windows LUON Tesseract (sai 0,2-0,7%, ~1-1,5 s).
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
~~Tren cua so ghim: keo ANH = tha ra app, keo THANH TREN (#bar) = di chuyen cua so~~
**DOI 0.5.8 (27/09, Gemini lam, anh yeu cau):** keo ANH ghim = DI CHUYEN cua so; tha file ra app = keo nut
`#drag-file` tren thanh cong cu, hoac GIU Alt + keo anh. Khay anh van keo thumbnail = tha ra app nhu cu.
(dragstart chiem cho keo-di-chuyen nen phai tach). Da do that: file roi dung vao
Explorer, xuyen ca 2 man hinh. **14/09 (0.4.16, thu muc khong '&'):** Premiere (len
timeline) · Photoshop (Smart Object) · Claude desktop · Messenger · Lark · Teams web ·
Zalo web · Chrome · FigJam/Figma — anh Tien tu keo, deu nhan du file.

VE SHAPE khi chup (25/08): chon vung xong hien thanh cong cu -> ve KHUNG VUONG /
MUI TEN / CHU (10/09; 0.4.5 14/09 chu co HOP NEN toi bo goc, bo vien chu) (canvas device-res) -> Enter/Xong. **Phim 1/2/3** = khung /
mui ten / chu (so nho tren nut). CHU: bam vao anh -> o go -> Enter chot,
Shift+Enter xuong dong, Esc bo o go. Tren ANH GHIM: KHONG con nut but chi
(anh bo 10/09) — bam 1/2/3 la vao thang che do ve; **0.4.8 (14/09): RE CHUOT len anh
-> hien 3 nut khung/mui ten/chu (nhu #bar), bam nut = vao ve** (anh: "bam chuot chon vao
thi khong duoc" — 4 ngay khong co duong vao bang chuot). Harness: `npm run test:chu
-- <thu muc BAN SAO anh>` (15 buoc, ghi de file nen PHAI la ban sao) va
`npm run test:khung -- <ban sao>` (dinh vi khung, lech <=3px — so loi #10). Co shape thi renderer ghep gui dataURL;
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
`*.exe` ignored; ban phat hanh nam o `Release/AiO Shotandsave/win/` (chi ban moi nhat)).
☠️ 2 bay da vap: (1) RUN_LOG trong app.asar CHI DOC -> ban dong goi phai ghi
vao userData (da lam trong ghiLog); (2) bo cai NSIS TU DE loi tat Desktop cung
ten -> sau khi cai, loi tat tro BAN CAI chu khong phai ban nguon.

DOC CHU TRONG ANH (0.7.9, 29/09 — anh test "kha la tot roi"):
- Nguoi xai: khoanh vung -> phim **5** (hoac nut "Lay chu" tren thanh cong cu) -> bang canh vung hien cac dong chu ->
  **Sao chep** (Enter) chep het roi dong man chup; boi den 1 doan + Ctrl+C = chep doan do; Esc dong bang, ve tiep.
  Vi du doi thuong: dang xem video co phu de / tin nhan khach, muon lay chu de dan vao Premiere hay Zalo ma khong go lai.
- Builder: `src/ocr.js`. Windows LUON Tesseract (tesseract.js 5.1.1 + assets/ocr vie/eng, luong phu, giu san 10 phut),
  nen toi thi `daoNeuNenToi()` truoc; nut tren bang doi sang bo doc Windows (PowerShell giu san, 0,03 s, KHONG co tieng
  Viet). Mac: Apple Vision qua osascript. Bay tesseract.js trong Electron: xem "Bay 1-lan" o tren.
- MVP (so): doan chuan 1.226 ky tu nen toi, 100/125/150%: Tesseract sai 0,2-0,7%, 1,2-1,5 s; Windows sai ~20%. Anh bam
  that 16:07: 1261x668 -> 18 dong 2,1 s (lan dau, gom nap), 909x76 -> 0,13 s. CHUA: Mac, may khong SIMD, anh chup nhieu
  nhieu/chu rat nho (~7 px), ngon ngu khac Viet/Anh (Tesseract chi co vie+eng -> bam nut doi sang bo doc Windows).

QUAY VIDEO VUNG MAN HINH (0.8.0, 01/10 — anh chot trong bang hoi: bam Dung · nut bat tieng may · khay rieng · MP4 truoc):
- Nguoi xai: khoanh vung -> bam nut may quay tren thanh cong cu (hoac phim **R**) -> vien cam + dong ho dem len + nut
  **Dung** hien NGOAI vung -> bam Dung (hoac bam lai phim tat chup / bam bieu tuong khay he thong) -> file MP4 vao thu muc
  anh, **Khay video** mo ra. **Quay LUON co tieng dang phat tren may, khong co nut loa** (anh chot 01/10 10:4x sau khi
  quay 2 luot dau khong tieng vi khong de y nut loa). Trong khay, moi video co 2 nut **Co tieng / Khong tieng**: chon
  ben nao thi ban do duoc phat va duoc keo tha ra ngoai (lan dau chon Khong tieng app tao file `...-khong-tieng.mp4`
  canh ban goc, `src/mp4-bo-tieng.js`: doi ten hop tieng thanh `free`, khong nen lai hinh, 90 MB = 27 ms).
  Tran 5 phut tu dung. Khay video: bam vao video = phat/dung · keo CA HANG tha vao Premiere / Zalo · Mo thu muc ·
  Xoa (vao Thung rac, bam 2 lan, nut ghi ro dung luong). Mo khay: nut may quay tren Khay anh, hoac menu khay he thong.
  Vi du doi thuong: dang xem mot doan chuyen canh tren YouTube / mot loi tren timeline, khoanh lai va gui khach 8 giay
  chuyen dong thay vi 6 tam anh tinh.
- Builder: bo quay nam trong cua so luong AN (`src/luong-chup.js batDauQuay/dungQuay` + `src/luong/luong.js`): mo THEM
  mot luong getDisplayMedia 30 fps (luong 5 fps chay san giu nguyen), cat vung -> canvas (ve bang setInterval, cua so an
  thi rAF dung) -> `canvas.captureStream` -> MediaRecorder `video/mp4;codecs=avc1...(,mp4a.40.2)`. KHONG can FFmpeg.
  Khuc MP4 ve toi dau main ghi NOI vao file `.tam` toi do (`main.js batDauGhiHinh/ketThucGhiHinh`), xong doi ten.
  So video `src/kho-video.js` (userData/video/danh-sach.json: id, file, ms, co, tieng); file that nam o thu muc anh,
  ten `shotandsave-video-*.mp4` (khay anh thuong chi nap png/jpg nen khong lan). Khay `src/video/` dung CHUNG
  `storyboard.css`. Dong ho `src/dem/quay.html` + `preload-dem.js`. Vien = `moVienQuay(display, rect, 'video')`.
  ☠️ Cho de hong: (1) file ra la MP4 PHAN MANH (moof/mdat), khuc ve ~1-3 s/lan; (2) co video phai CHAN, tran
  2560x1440 (to hon thi thu nho); (3) tieng may chi Windows ('loopback'), phai xin `channelCount: 2` + tat
  echoCancellation/noiseSuppression/autoGainControl, khong thi ra MONO da xu ly; (3b) hang dau cua the video: 4 dieu
  khien PHAI cung cao 26 px (o pill cao 20 + dem 2x2 + vien 2), dong thong tin KHONG lap thoi luong (da co nhan tren
  khung), cua so <= 760 px dong thong tin xuong hang rieng; `.dai-meta` nam o storyboard.css, sua la doi CA HAI khay
  (01/10 13:08, do 14 luot 560-860 px x VI/EN); (4) `[hidden]` tren `.cong-cu` bi
  `display:flex` de -> co luat `.cong-cu[hidden]`; (5) dang quay ma man hinh doi / may ngu day: hoan khoi dong lai luong.
- MVP (so, 01/10 may cong ty RTX 4060 Ti, man 4K 150%, 60 Hz): **`npm run test:nhipquay` = thuoc CHINH cua do muot**
  (quay bang dem chay tren man, doc so tren tung khung): 91-94 % khung dung nhip, 0-3 khung lap / ~175, 0 khung rot;
  doi chung cach cu: 0 % dung nhip, 137/164 khung lap. ☠️ So "28,5-29,6 khung/giay" ghi o day truoc 11:10 la DEM so
  khung trong file, khong phai so HINH MOI — luc do hinh that chi 5 lan/giay (so loi #14).
  `npm run test:quayvideo` (bo quay, an): 6 luot DAT, vung le 21x15 -> 32x22, ca man 4K -> 2560x1440, tieng AAC 2 kenh
  48 kHz. `npm run test:botieng`: ban khong tieng 0 duong tieng, hinh giong ban goc tung diem anh. `npm run test:quayapp` (duong
  that, HIEN len man ~6 s — hoi anh truoc): vien cam 0,0% lot vao video (co doi chung), dong ho dem 0:02, bam Dung ->
  1 file dung thu muc, khay phat duoc, xoa vao Thung rac, tu dung khi het tran. `npm run test:khovideo`: so + day noi.
  CHUA DAT / CHUA DO: anh chua bam tren app that (R tren overlay that, keo tha vao Premiere/Zalo) · Premiere co nhan MP4
  phan manh khong (file mau `.selftest/thu-quay/`) · video tang toc phan cung (YouTube) co den khong · may yeu / khong
  co bo nen H.264 (roi ve webm) · Mac · vung vat 2 man khong co nut Quay · GIF (lam sau).

KHAY TU THU VE NUT TRON (01/10 16:07 — anh chot kieu chuyen dong trong bang hoi, CHUA dung tren man that):
- Nguoi xai: khay anh khong dung toi 5 giay (Cai dat chon 5s / 10s / 15s) thi tu thu ve MOT NUT TRON o goc duoi-phai man
  hinh: tung tam anh bay vao nut, nut dem len roi hien tam moi nhat + so anh. Bam nut tron -> ong kinh luot ve cho khay cu,
  man trap bung ra kem mot nhay sang. Chup anh moi luc dang la nut -> khay tu bung ra. Nut "–" tren khay = thu ngay; re chuot
  vao nut tron hien dau x = an han (mo lai tu bieu tuong khay he thong hoac lan chup sau). Keo khay di dau cung duoc: nut
  luon ve goc, mo ra khay ve dung cho cu. Vi du doi thuong: khay la cai ngan keo; khong dung thi no tu dong lai thanh mot
  cai num o goc ban, go vao num la ngan keo truot ra dung cho cu.
- Builder: `src/khay-thu.js` (trang thai mo / thu / an; `thu()`, `bung()`, `hienThang()`, hoi con tro 0,4 giay mot lan).
  Khay anh chi them 3 ham trong shelf.js (`__khayThongTin`, `__khayAn`, `__khayBung`) + `#chop`. Chuyen dong chay tren SAN
  DIEN (`src/dien`, cua so trong suot phu workArea, bam xuyen qua, chi hien < 1 giay): thu ve dung anh `capturePage` cua
  cua so khay lam bong + cat o anh tu chinh anh do. NUT (`src/nut`) cua so 80x80, vong tron 52. Cho de hong: (1) cua so
  nut < 64 px la Windows ep to (so loi #13); (2) bong cua nut > 14 px la bi chat canh; (3) trang dang AN thi rAF /
  `finished` khong toi -> moi cho doi phai dua voi hen gio; (4) an cua so truoc khi ve khung trong = lan hien sau lo hinh
  cu (lenh `don` cua san dien, `__khayAn` cua khay); (5) san dien phu video > 0,5 giay la video den trong anh chup ->
  `banKhac()` + `khayThu.huy()` luc bat dau chup; (6) che do tu kiem phai tat tu thu (`tuDong`).
- MVP (so): `npm run test:khaynut` 30/30 (offscreen): thu ve 0,86-1,06 giay, xuat hien 0,90 giay, tu thu sau 5 giay, 5
  doi chung. CHUA DAT: chua ai xem tren man that (thu tu chong cua so, do muot, man 125%, nhay hinh luc doi ban ve <->
  cua so that) · RAM 2 tien trinh moi chua do · `test:khay` / `test:co-khay` chua chay lai · Mac chua thu · kieu C chua lam.

## Chua lam (xem PROGRESS.md)

Cai thu MAY SACH (khong Node/nguon) truoc khi phat ra ngoai · ky so (SmartScreen Windows; mac = Apple
Developer 99 USD/nam, hien ky ad-hoc qua `scripts/afterSign.js`) · tat luong chup khi may ranh lau (CPU nam nen
~10-12 % mot loi) · cong cu ve them (but, che mo) neu anh Tien can. Ban mac dung qua GitHub Actions
(`.github/workflows/shotandsave-mac.yml`, Windows khong build duoc mac).

## Ke hoach tinh nang: Multi-Shot Storyboard Strip (Dai phan canh dien anh)

> Xem chi tiet toan bo roadmap tinh nang sang tao tai file [ROADMAP.md](ROADMAP.md).
Chot voi anh Tien toi 27/09: phat trien tinh nang ghep nhieu anh chup thanh dai phan canh / contact sheet cho editor.

### 1. Nhu cau
- Editor dung Premiere/AE/DaVinci chup 3-10 khung hinh tren timeline de gui dao dien, khach hang hoac team duyet.
- Thay vi gui 10 file le hoac mo Photoshop cat dan 15 phut, tool cho phep 1-click ghep thanh 1 tam anh storyboard dien anh duy nhat.

### 2. Giao dien & Luong thao tac
- Nut `#storyboard` tren thanh tieu de khay anh (`#bar`, canh nut mo thu muc `#folder`), phom icon Lucide film/layout inline SVG.
- Phim tat: `S` khi dang mo cua so khay.
- Dau vao: Lay toan bo anh dang mo trong khay (theo thu tu `#1`, `#2`... da danh so o 0.6.2) hoac cho phep multi-select.
- 3 Che do bo cuc (Layout Templates):
  (1) Cinema Filmstrip: Xep ngang cac khung hinh tren dai nen toi `#090a0d`, ngan cach boi vach 1px, nhan `SHOT 01`, `SHOT 02`...
  (2) Storyboard Grid: Tu dong tinh cot/hang (2x2, 3x2, 4x2) tuy theo so luong shot, bo goc radius 8px theo style Studio Console.
  (3) Director Contact Sheet: Header banner co Logo AiO, ten phan canh, ngay gio; duoi moi o anh co vung ghi chu revision note.
- Xuat: `Ctrl+C` copy clipboard, `Ctrl+S` luu file vao thu muc anh (tu dong nap lai vao khay), hoac keo tha file vao Premiere Pro.

### 3. Kien truc & File can thiep (28/09)
- `src/shelf/index.html` & `shelf.css`: Nut `#storyboard`, style tooltip, hieu ung hover theo token `--accent` (#f86820).
  [Sua 28/09 Claude: ban dau ghi `--acc` — token do KHONG co trong tokens.css, la token tu khai rieng cua storyboard.css cu.]
- `src/shelf/shelf.js`: Bat su kien click / phim `S`, thu thap danh sach anh.
- Module ghep anh `src/storyboard/`: Dung HTML5 Canvas 2D (khong can thu vien ngoai nang ne), render tai ty le goc 1:1.
- `src/i18n.js`: Bo tu dien VI/EN cho tieu de va cac nut thao tac storyboard.
- `src/main.js`: IPC handler mo modal/cua so xem truoc hoac luu file anh ghep.


### 4. TRANG THAI THAT 28/09 (ban 0.7.4) — thay cho ke hoach tren
Nguoi xai:
- **Ghep tu khay:** nut Storyboard tren khay anh -> cua so ghep MOI anh dang co trong khay, chon Dai cuon phim / Luoi,
  bam x tren tung shot de bo, Sao chep / Luu PNG / keo tha. Nhan SHOT luon hien, KHONG co dai ngay gio (anh bo 28/09).
- **Quay 3 giay (anh chot 28/09):** khoanh vung -> bam S (hoac nut "Storyboard Strip" o goc khung) -> Xong/Enter ->
  vien cam + dem 3-2-1 quanh vung -> 6 khung (0,5 s/khung) -> cua so ghep mo dang dai va TU LUU dai (dai vao khay,
  6 khung le KHONG vao khay). Vi du doi thuong: dang xem mot canh video, khoanh vung la duoc ngay 1 dai phan canh
  3 giay de gui dao dien.
Builder:
- overlay.js `xong()` + `isStoryboardMode` -> `{rect, storyboard:true}` -> main.js `quay3Giay` (cho 350 ms) ->
  `layKhungVung` = `luong.catVung` (renderer luong cat DUNG vung, JPEG) / du phong `grabDisplaysList` -> `daiQuay` ->
  `storyboard:get-data` tra `{boCuc:'filmstrip', tuLuu}` (tuLuu chi lan dau). Mo tu khay -> `daiQuay = null`.
- ☠️ Vien quanh vung la 4 cua so thanh DAC ngoai vung, khong cua so trong suot nao phu vung (video den).
- Giao dien cua so ghep chep khuon man Cai dat (xem AGENTS.md muc 5). Nut ben Cai dat dang hien font Arial (button
  khong ke thua font) -> cua so ghep giu y het; doi sang Inter thi doi CA HAI man cung luc (cho anh quyet).
MVP ("xong" = so nao):
- DAT (trinh duyet, 28/09): cat vung dung co + dung cho (DIP 200 -> 300 px o sf 1.5), 6 khung khac nhau, nhip 0..2,51 s,
  16-31 ms/lan; cua so ghep khop man Cai dat 9/9 thanh phan; 2 ngon ngu x 5 kho 0 tran.
- CHUA DAT: chua chay tren app that (vien/dong ho tren man 150%/125%, khung dau, video co den khong) · vung vat 2 man
  khong ho tro (di duong chup thuong) · anh chua dung tren viec that.
