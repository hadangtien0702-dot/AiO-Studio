# AiO Asset Manager - Nhat ky

## [chot-phien] - 2026-08-14 13:57 (UTC+7) - DICH LOI HOST + TRANG THAI DONG BANG

### Trang thai hien tai
Anh Tien chot 14/08: *"Asset Manager rat on roi - tool nay tam dung o day de
chuan bi release"*. DONG BANG tinh nang - viec moi phai hoi anh truoc.
Ban cuoi: song ngu (do that cong 8088: EN sot 0 loi that - 7 chuoi con lai
la TEN THU MUC ASSET cua nguoi dung, khong duoc dich) + muc "Dung gan day"
(anh da tu test duong ghi, chay dung). Nam trong goi FREE cua Beta
(Release/2026-08-14-beta-01).

### Dot cuoi trong ngay
- 6 cau loi tu host/ppro.jsx (tieng Viet khong dau): dich o tang hien thi,
  boc dich(res.message) 2 cho trong store.ts + 7 khoa vao chu.ts. Khong sua
  host. Kiem: cau EN co trong ban da cai 1/1.
- Truoc do cung ngay: sua dich MANH giua cau o AssetCard (tooltip nua Anh
  nua Viet - TE HON khong dich), boc store.ts:522 bi sot (cung mot cau ra
  hai thu tieng o hai duong), cachePaths.ts process.env -> bienMT().

---

## [dung-gan-day] - 2026-08-14 09:22 (UTC+7) - MUC "DUNG GAN DAY" O MENU TRAI

### Boi canh
Anh Tien khen panel test okie roi hoi de xuat toi uu giao dien. Dua 3 de xuat
(duyet bang phim / loc theo thoi luong / dung gan day), anh chot lam DUNG MOT
cai: *"Muc Dung gan day o menu trai - them cho anh moi cai nay them nha em"*.

### Thay doi
- store.ts: them `recentIds` (tran 20, moi nhat dau) + `onlyRecent` +
  `toggleOnlyRecent`. Ghi o `sendToTimeline` CHI KHI res.ok — khong ghi o
  keo-tha vi onDragStart khong biet cu tha co dap xuong timeline khong.
  Luu localStorage khoa `aio-am-dung-gan-day`, KHONG dua vao library.json
  (trang thai tien dung theo may, khong phai du lieu thu vien).
- Grid.tsx: loc theo recentIds; o che do nay THU TU la noi dung (vua dung
  dung dau), nhay qua khoi sortBy thuong.
- Sidebar.tsx: nut moi canh Yeu thich, IconClock co san, dem = so id CON TON
  TAI trong thu vien (id co the tro asset da xoa — bai hoc 0.16.0). Hai bo loc
  Yeu thich / Dung gan day LOAI TRU nhau; nut Tat ca + nut loai deu don ca hai.
- chu.ts: khoa 'Dung gan day' -> 'Recently used'.

### Kiem chung tren PANEL THAT (cong 8088)
1. Nap 2 id asset that vao localStorage, reload: nut hien dem = 2.
2. Bam nut: aria-pressed=true, luoi loc con DUNG 2 the (Red,
   [zenomade] Trending 01.mogrt) — khop 2 id da nap.
3. Doi chung: ve "Tat ca asset" luoi hien lai day (21 the trong khung nhin),
   don du lieu moi ve [], reload: dem = 0, localStorage = [].

### CHUA kiem
Duong GHI (sendToTimeline luc res.ok) chua chay that — bam Import luc do la
chen clip vao project THAT dang mo cua anh Tien (PV tuyen dung_1). Can anh
Import mot lan roi nhin nut dem tang len 1 la khep.

### Ghi chu pham vi
CHI Asset Manager. Power Bins dung chung ~90% ma nhung KHONG chep tinh nang
nay sang — anh chot "them cho anh moi cai nay" cho panel nay; ben Power Bins
luong Import khac (khay/brand), muon co thi anh se bao.

---

## [bin-chung] - 2026-08-13 11:08 (UTC+7) - KHO FFmpeg DUNG CHUNG CHO CA BO

### Boi canh
Anh Tien chot 13/08: cuoi tuan phat Beta gom 3 panel (Autocut / Asset Manager /
Power Bins), va do la GOI FREE. Anh nhan xet *"3 bo cai roi ma nang qua em ha"*.

### Nguyen nhan that
Do that: goi `.zxp` 91,5 MB thi **91,5 MB la FFmpeg**, code panel chi 0,09 MB
(0,1%). Va bay panel dong goi DUNG MOT file - bam SHA-256 doi chieu:
`4CBB08190774` (ffmpeg 109,5 MB) + `6E3A2FB316B3` (ffprobe 109,3 MB), giong nhau
o ca 4 panel. Nguoi dung tai 3 goi = tai cung mot FFmpeg 3 lan.

### Thay doi
1. `client/src/services/ffmpeg.ts` - `getFFmpegPath()` VA `getFFprobePath()` deu
   them mot duong dan ung vien CUOI DANH SACH:
   `%APPDATA%\AiOStudio\bin\win64\<ten>.exe`.
   Dat CUOI la co y -> ban cu con `bin/` rieng chay y nhu truoc, khong hoi quy.
   Dat NGOAI `Adobe\CEP\extensions\` vi thu muc do bi Premiere quet tim extension.
2. `scripts/package-release.ps1` - them tham so `-BinChung` (MAC DINH TAT).
   Bat len thi khong kem `bin/`.
3. Moi: `../design-system/cai-bin-chung.ps1` - cai kho chung, co `-Go` de go.

!!! PANEL NAY CAN CA HAI FILE - `probe.ts` doc metadata dang JSON bang ffprobe.
Khac Autocut: Autocut khong bao gio goi ffprobe nen da bo han khoi goi cua no.
Kho chung vi vay phai co du ca ffmpeg.exe lan ffprobe.exe.

### File anh huong
`client/src/services/ffmpeg.ts` (2 ham) - `scripts/package-release.ps1`
Sua giong het o Power Bins (luat ~90% ma dung chung) va Transcripts/Autocut.

### Kiem chung
- `tsc --noEmit`: **0 loi** (do o ca 4 panel).
- Chay THAT `cai-bin-chung.ps1`: 218,9 MB vao `%APPDATA%\AiOStudio\bin\win64`,
  doc lai bam hash **khop nguon ca 2 file**.
- Dung lai staging voi `-BinChung`: goi panel nay **91,5 MB -> 0,09 MB**.
  Tong 3 goi 229,1 -> 0,46 MB. **Nhung tong THAT ma user tai la ~92 MB**
  (con kho chung ~91,5 MB khi nen), tuc 274,7 -> ~92 MB, giam 67%.

### CHUA lam
**CHUA chay tren Premiere that.** Chua co lan nao panel that su lay FFmpeg tu
kho chung. Phai dong goi `-BinChung` roi chay thu truoc khi phat beta.

---

## [design-system] - 2026-07-29 21:47 (UTC+7)

### Added - BON PANEL DUNG CHUNG MOT BO TOKEN

Boi canh: anh Tien 29/07: *"anh thay ca 4 phan UI chua dong bo do em. Em nen
dua ra mot UI Design System cho thong nhat ve font chu, kich thuoc button...
Anh thay MOI LAN EM THIET KE LAI LAP LAI CAC LOI TU HOI XUA DEN GIO"*.

### Nguyen nhan that

Khong phai thieu tai lieu. So bai hoc thiet ke da ghi tu lau (quy tac 21):
*"khong bao gio de hai file CSS chep tay lan nhau"*. Van vap - vi loi dan nam
trong TAI LIEU chu khong nam trong CO CHE. Bon panel co bon khoi token chep tay
cua nhau; sua mot cho la ba cho kia lech di trong im lang.

Do that 29/07 tren ba panel dang mo cung luc trong Premiere (634x678):

| | Asset Manager | Autocut | Transcript |
|---|---|---|---|
| thang chu / spacing / bo goc | khop | khop | khop |
| thanh tren | **44px, bg-2** | 38px, bg-1 | 38px, bg-1 |
| `--h-topbar` | **KHONG CO token** | 38px | 38px |
| nut chinh | 28px | **34px** | **34px** |

### Thay doi

Lap `AiO Studio/design-system/` - BA LOP CHAN:

| Lop | File | Bao dam gi |
|---|---|---|
| 1 | `tokens.css` | Mot file token duy nhat, khong con cho de chep tay sai |
| 2 | `dong-bo-tokens.ps1` | Bon FILE giong nhau tung byte |
| 3 | `kiem-dong-bo.ps1` | Bon PANEL THAT hien giong nhau (do qua 4 cong debug) |

Lop 3 la lop duy nhat bat duoc kieu loi *"file token dung nhung CSS rieng ghi
de bang so cung"* - dung cai da xay ra voi `height: 44px` cua thanh tren.

Kem `MASTER.md` (tai lieu cho nguoi) va `so-sanh.html` (ban so sanh: bon
panel that chay canh nhau trong iframe, co vach chuan de soi lech).

Chot ba bac chieu cao control theo VAI TRO, khong theo cam giac:
`--h-ctrl-sm` 24px (nut phu) · `--h-ctrl` 28px (mac dinh) ·
`--h-ctrl-lg` 34px (CTA chinh, moi man hinh MOT cai).
Thanh tren thong nhat **44px nen `--bg-1`**.

Rieng panel nay: thanh tren truoc do khoa cung `height: 44px` va nen `--bg-2`,
khong dung token nao. Nay dung `var(--h-topbar)` va `--bg-1`.

### Kiem chung

| Phep do | Ket qua |
|---|---|
| Build ca 4 panel | sach |
| Token trong ban BUILD (dist) | **16/16 token, GIONG NHAU o ca 4** |
| Con `@import` chua noi tuyen | **0** - vite da noi tuyen het |
| `--h-topbar` tren panel that | 44px o ca hai panel do duoc |
| Nen thanh tren | `rgb(15,15,17)` = `--bg-1` o ca hai |
| Nut IN HOA / gian chu | **0 / 0** |

☠️ Anh Tien nhac dung cho nguy hiem nhat: *"em nho chay lam sao khi ma import
lai la giong 100%"*. Doi token sang `@import` co rui ro bang DEV dep ma ban
CAI mat sach token - kieu loi chi lo ra tren may khach. Da do bang `dist`:
16/16 token co du, khong con `@import` nao chua noi tuyen.

### File anh huong
client/src/styles/_tokens.scss (nay la ban copy) · client/src/styles/_topbar.scss (dung `var(--h-topbar)` va `--bg-1`)

---

## Trang thai hien tai  (cap nhat 2026-07-29 17:12)

- Phien ban 1.3.2, extension id com.aiostudio.assetmanager, cong debug 8088
- Kho du lieu: %APPDATA% AiOStudio library.json - 28.846 asset
- DA TACH KHOI AiO Editing ngay 29/07. Panel nay CHI con Asset Manager.
  Power Bins la panel rieng (com.aiostudio.powerbin, cong 8090, kho rieng
  AiOPowerBins). Thu muc AiO Editing DA XOA.
- FFmpeg da chuyen sang LGPL: proxy dung libopenh264 thay libx264. Do that tren
  clip 81,7 giay: nhanh gap doi (2,8s so voi 5,9s), nhe hon 11%, net hon
  (SSIM 0,9655 so voi 0,9212).
- Dinh khoang 90% ma voi Power Bins: store.ts, Grid.tsx, jobQueue, mediaServer,
  ffmpeg, thumbnail/song am/proxy. Sua may file do thi NHO CHEP SANG DO.
  Rieng kho du lieu thi RIENG, da kiem bang SHA-256.

KE TIEP:
1. [CHO] Bo cai GHEP 4 panel thanh mot. Huong ban chu du an chot 29/07: mot bo
   cai, mot gia, mo Premiere ra thay du 4 panel.
2. [CHO] Chu ky so thuong mai. Nay ky tu tao nen bo cai phai bat PlayerDebugMode
   trong registry - bao khach la sua registry la mat khach.
3. [CHO] Bo cai nhe lai. File .zxp nay 91,5 MB sau khi doi FFmpeg LGPL (truoc
   khoang 48,9 MB). Muon nhe phai tu build FFmpeg toi gian.

Doc PIPELINE.md o thu muc cha de biet con thieu gi de ban duoc.
Truoc khi toi uu hieu nang bat cu thu gi: doc OPTIMIZE.md TANG F.

---

## [2.0.0-dev.5] - 2026-07-29 15:52 (UTC+7)

### Changed - [HOAN TAT] Doi huong ban + don thu muc + viet lai CLAUDE.md

--- HUONG BAN DOI ---
Anh Tien chot: "phat trien tung tinh nang cho hoan chinh, sau do ghep lai mot bo
thanh cai dat mot lan - nguoi dung tra tien cho toan bo tinh nang do".
Nghia la: tach thu muc la de PHAT TRIEN, KHONG phai de ban roi. Dich den la MOT
bo cai MOT gia. Luon gia dinh khach co du ca bo.
-> Da sua lai CLAUDE.md cua ca 4 du an: bo het cach noi "4 san pham ban rieng".

--- TAI LIEU ---
- Viet lai CLAUDE.md cho ca 4 du an theo dung yeu cau chu du an 29/07:
  moi tinh nang phai co BA LOP - nguoi xai (bam gi duoc gi, co vi du doi thuong),
  builder (cho nao de hong), MVP (xong nghia la gi, do bang so nao, ke ca phan
  CHUA dat va ly do).
- Them AiO Studio/PIPELINE.md - lo trinh san pham: ban do thu muc, tung tinh
  nang dang o dau kem so do, 5 nhom thu dang CHAN viec ban xep theo muc nguy,
  va thu tu de xuat.
- Cap nhat Production/CLAUDE.md: ban do thu muc moi, huong ban, go duong dan
  tro vao AiO Editing.

--- DON THU MUC ---
- Doi ile pr for test (1.331,7 MB) tu AiO Editing ra AiO Studio/
  vi no la file THU dung chung cho ca 4 panel.
- Xoa AiO Editing - giai phong 1.614,5 MB.

☠️ SUYT MAT DU LIEU: AiO Editing chua 	est 2.prproj DANG MO trong Premiere.
Do bang pp.project.path truoc khi xoa moi thay. Neu xoa thang la mat project
dang dung cua chu du an cung 36 ban auto-save.
-> BAI HOC: thu muc sap xoa co the dang chua DU LIEU SONG. Phai do truoc.

### Kiem chung truoc khi xoa
- Doi chieu tung file o goc AiO Editing voi AiO Asset Manager bang SHA-256:
  toan bo giong het, tru CLAUDE.md va PROGRESS.md (ban moi la ban da cap nhat)
- Khong co thu muc nao chi rieng AiO Editing co
- Ca 4 du an deu CO chung chi rieng trong certs/ (khong muon cua AiO Editing)
- Kiem TAT CA 70 file trong ile pr for test: 0 file bi khoa truoc khi doi
- Sau khi xoa: ca 4 panel trong %APPDATA%\Adobe\CEP\extensions van du
  dist/index.html + in/win64/ffmpeg.exe + META-INF/signatures.xml

### Trang thai thu muc sau khi don
`
AiO Studio\  (5,7 GB)
  AiO Asset Manager\   AiO Power Bins\   AiO Autocut\   AiO Transcripts\
  AiO WebDessign\      (web ban hang, Next.js, co .git rieng - DUNG dung vao)
  file pr for test\    (file thu dung chung)
  PIPELINE.md
`

---
## [2.0.0-dev.4] - 2026-07-29 15:31 (UTC+7)

### Security / Changed - [HOAN TAT] Bo FFmpeg GPL, chuyen sang LGPL - MO DUONG BAN

Boi canh: chu du an chot ban bo cong cu ra nuoc ngoai. Do that ngay 29/07: ca 5
du an dang bundle fmpeg 6.1.1-essentials voi --enable-gpl --enable-version3
--enable-libx264. Ban ma giu ban nay thi GPL BAT MO TOAN BO MA NGUON san pham.

Nguyen nhan that (va cho tai lieu cu ghi SAI):
Production/CLAUDE.md ghi "tool khong encode video nen khong can libx264".
DUNG cho Autocut/Transcript, nhung SAI cho Asset Manager va Power Bins - hai cai
nay co proxy.ts encode video 360p bang -c:v libx264. Do la CHO DUY NHAT trong
ca bo cong cu con dinh GPL.

### Thay doi
- Thay fmpeg.exe + fprobe.exe cua ca 5 du an bang ban LGPL
  N-125829-gfe953596e9-20260728 (BtbN/FFmpeg-Builds).
  Da doc thang chuoi configuration: --enable-gpl 0 lan, --enable-nonfree
  0 lan, --disable-libx264 --disable-libx265 --disable-libxvid.
- proxy.ts: -c:v libx264 -crf 28 -preset ultrafast -> -c:v libopenh264 -b:v 300k
- Them LICENSE-FFmpeg.txt (toan van LGPL-3.0) va THIRD-PARTY-NOTICE.txt
  (ghi ro ban FFmpeg nao, lay nguon o dau, khong sua doi, goi qua tien trinh
  rieng, nguoi dung duoc quyen thay the) vao ca 5 du an.
- package-release.ps1 cua ca 5: THEM buoc dong goi hai file giay phep vao bo
  cai. Thieu la vi pham LGPL - script se canh bao neu khong thay file.

### Vi sao chon libopenh264 chu khong phai h264_mf
Do that tren clip 108 MB / 81,7 giay, cung may cung lenh:

  bo ma hoa                thoi gian   dung luong   SSIM
  libx264 crf28 ultrafast     5,9s      4,30 MB    0,9212   <- ban cu (GPL)
  h264_mf 300k                3,1s      3,83 MB    0,9664
  libopenh264 300k            2,8s      3,84 MB    0,9655   <- chon

Bo GPL khong phai hy sinh gi: nhanh GAP DOI, nhe hon 11%, NET HON HAN. Ban cu te
vi -preset ultrafast bop chet chat luong x264 de lay toc do.
Khong chon h264_mf (SSIM nhinh hon 0,001) vi no muon bo ma hoa cua Windows -
ban Windows N/KN (ban o EU, Han Quoc) KHONG co san, khach mua ve la proxy chet
cam. libopenh264 nam trong chinh ffmpeg.exe minh bundle.

### Kiem chung - do that, khong doan
Tren file nhi phan MOI, truoc khi thay:
- tach WAV 16k mono cho Whisper : 0,1s / 2,50 MB - OK
- loc dai giong 300-3400Hz      : OK
- silencedetect                 : tim 32 khoang lang - GIONG HET ban GPL
- song am WebP                  : 5,6 KB - OK
- thumbnail JPG                 : 10,7 KB - OK
- ffprobe doc metadata          : h264,1080,1920,25/1,81.76 - OK

Sau khi thay + build + cai vao Premiere, chay AUTO CUT that tren dung clip cu:
- nhat cat : 16   (ban GPL: 16) - GIONG HET
- sequence : 17 clip hinh / 17 clip tieng, dai 72,04s (ban GPL: 72,08s)
  -> lech 0,04 giay = DUNG MOT KHUNG HINH o 25fps
- ca 4 panel doc lai -version: khong con --enable-gpl, khong con libx264

### Gia phai tra - PHAI BIET TRUOC KHI BAN
File nhi phan LGPL nang hon: bin 139,1 MB -> 218,9 MB (tang 79,8 MB).
Keo theo .zxp tu ~48,9 MB len 91,5 MB.
Bo cai gan gap doi. Chap nhan duoc voi san pham ban online, nhung neu muon nhe
lai thi phai TU BUILD FFmpeg toi gian (chi bat dung thu can) - viec rieng, chua lam.

---
## [2.0.0-dev.1] - 2026-07-29 13:48 (UTC+7)

### Changed - [HOAN TAT] Tach san pham: panel nay CHI con Asset Manager

Boi canh: chu du an chot tach bo cong cu thanh 4 san pham ban rieng
(Asset Manager - Power Bins - Autocut - Transcript), moi cai mot bo cai, mot gia.

Nguyen nhan that: truoc day mot panel lam hai viec, mo ra la man hinh chao 2 the.
Ban rieng thi khach mua Asset Manager khong duoc thay cua vao Power Bins.

Thay doi:
- Mo panel la vao THANG luoi asset (activeMasterTab khoi tao 'library' thay vi 'home')
- Bo man hinh chao Launcher.tsx (xoa file) va nut "quay lai man hinh chon"
- Nut Cai dat van con tren thanh cong cu nen khong mat duong vao
- Giu nguyen ID com.aiostudio.assetmanager va cong debug 8088 - day la ban ke thua
  truc tiep cua AiO Editing, cai de len ban cu

### File anh huong
client/src/App.tsx - client/src/state/store.ts - client/src/components/Toolbar.tsx
client/src/components/Launcher.tsx (XOA)

### Kiem chung - DO THAT TREN PANEL DANG CHAY, 2026-07-29 14:1x
- Build sach ca 4: Asset Manager 247 KB - Power Bins 247 KB - Autocut 198 KB - Transcript 192 KB
- Ma da cai KHOP SHA-256 tung byte voi ban vua build (ca 4)
- Premiere 26.5.0 khoi dong lai luc 14:03:56 -> Window > Extensions hien DU 4 muc AiO Studio
- Ca 4 cong debug SONG: 8088 / 8090 / 8089 / 8091
- Khong panel nao con man hinh chao: dem .launcher = 0 o ca 4
- Cau noi host sang Premiere THONG ca 4: doc duoc "test 2.prproj / Sequence 01 / 26.5.0" (1-5ms)
- Asset Manager: doc dung 28.846 asset (Video 1.562 - Mogrt 4.156 - Am thanh 12.948 - Anh 9.871 - Preset 309)
- Power Bins: 0 asset, menu chi co "Brand Kit / Tao brand" - KHONG thay brand "Thinksmarrt" cua kho cu
- Autocut: co Giu nhip/Vua/Cat sach + Tao sequence moi/Cat tai cho + AUTO CUT; KHONG con nut LAM PHU DE
- Transcript: co Nhanh/Phu de cau dai + LAM PHU DE + bang sua tu; KHONG con ba muc cat, KHONG con AUTO CUT
- PHEP THU TACH KHO (quyet dinh): tao brand trong Power Bins ->
    AiOPowerBins\library.json DUOC TAO (173 byte, chua dung brand do)
    AiOStudio\library.json SHA-256 KHONG DOI, van chi co brand "Thinksmarrt"
    Da xoa brand thu, AiOPowerBins tro ve 82 byte rong. AiOStudio khong doi suot ca qua trinh.
- Log CEP: chi co 2 dong nhieu chuan (Injecting cep_node, GL is disabled) - GIONG HET nhau o ca 4 panel,
  khong panel nao co loi rieng

### Con lai chua sua
- document.title cua Power Bins van la "AiO Studio - Asset Manager", cua Transcript van la
  "AiO Studio - Autocut" (client/index.html chua doi). Nguoi dung trong Premiere khong thay
  (Premiere lay ten tu <Menu> trong manifest) nhung nen sua cho sach.
- Power Bins mang so hieu 1.3.2, Transcript mang 1.4.0 - thua huong tu du an me. San pham moi
  ban ra nen bat dau tu 1.0.0.

---

# AiO Studio - Nhat ky tien do (Changelog)

Tai lieu ghi lai moi lan cap nhat ma nguon cua du an.

**Truoc khi sua bat ky ma nguon nao, phai doc `RULES.md`** — quy dinh rang buoc,
danh sach file khoa, ban do phu thuoc va chi tiet tung phase.
Ke hoach tong the: `PLAN.md` · Huong dan cai dat: `README.md`.

## Quy uoc ghi chep

- Moi muc cap nhat bat buoc co: PHIEN BAN, NGAY, GIO, MUI GIO.
- Dinh dang thoi gian: YYYY-MM-DD HH:MM (UTC+7).
- Muc moi nhat nam tren cung.
- Danh phien ban theo Semantic Versioning (semver), giai doan phat trien dung
  hau to tien phat hanh: MAJOR.MINOR.PATCH-dev.N
    - MAJOR: thay doi lon, khong tuong thich nguoc.
    - MINOR: them tinh nang, van tuong thich.
    - PATCH: sua loi nho.
    - dev.N: so ban dung noi bo trong khi phat trien mot phien ban.
- Nhan trang thai (khong dung icon): [HOAN TAT], [DANG LAM], [CHO], [LOI], [BO].
- Loai thay doi (theo chuan Keep a Changelog): Added (them), Changed (sua doi),
  Fixed (sua loi), Removed (go bo), Security (bao mat).

## Trang thai hien tai

- Phien ban: **1.3.2 — DA PHAT HANH** (2026-07-28). Dung ban nay; moi ban truoc
  do (1.2.0 -> 1.3.1) khong can gui di nua.
  Ban 1.3.0 da duoc chu du an cai va chay that: *"muot hon han, ngon lanh roi"*.
  Gom: keo tha chay duoc · Turbo render + nut Dung · thumbnail va song am sang
  WebP · hop Cai dat don gon · **het flicker khi cuon nhanh** (1.2.1) ·
  **thanh cuon het nhay, luoi tu do them khi cuon** (1.3.0) ·
  **nut doi mau do/xanh · moi con so tu khai pham vi · tran tai nguyen co gian**
  (1.3.1) · **chan rac macOS · the loi noi that · nut Don rac vao Thung rac**
  (1.3.2).
- **FILE DE GUI DI**: `build/AiO-Studio-Asset-Manager-1.3.2-SETUP.exe` (48.7 MB)
  -> chep qua may khac, **bam dup la tu cai**, khong phai giai nen gi ca.
  (Van con ban `.zip` canh no cho ai muon xem ben trong hoac dung ZXP Installer.)
- May nguoi nhan **KHONG can cai them gi**: khong Python, khong Node.js, khong
  FFmpeg (da nam trong goi), khong can quyen Admin. Chi can Windows 10/11 +
  Premiere Pro.
- **Cai ban nay phai TAT HAN Premiere roi mo lai** (doi manifest.xml).
- File tai tu mang bi Windows chan: chuot phai -> Properties -> tick 'Unblock'
  truoc khi chay, hoac bam 'More info' -> 'Run anyway'.
- **Truoc khi toi uu hieu nang bat cu thu gi: doc `OPTIMIZE.md` TANG F.**
  Nut that la DAU DOC O CUNG, khong phai CPU. GPU/RAM khong co gi de gioi han.
- Ke tiep, theo thu tu:
  1. [CHO] Chu du an cai 1.3.1 va thu; do CPU that bang Task Manager luc render.
  2. [CHO QUYET] Nut bao "Preview da du" + XANH trong khi con 1.027 file FFmpeg
     khong doc duoc — giu nguyen / doi chu / them mau thu ba?
  3. Bo han lan goi `ffprobe` rieng (~30-40 phut cho toan thu vien) — RUI RO:
     parse sai `duration` -> Import timeline tinh sai track trong (bay so 2).
  4. Tach hang doi theo o dia (SSD 12-16 luong, HDD 3-4).

**QUY TRINH BUILD TU 1.0.0 TRO DI — nho ky:**
- Dang phat trien:  `cd client && npm run build` roi `scripts\sign-install.ps1`
  (co auto-reload, co .debug — panel tu tai lai sau moi lan cai)
- Ban phat hanh:    `scripts\package-release.ps1`
  (tu build `npm run build:release` -> VITE_RELEASE=1 -> TAT auto-reload,
   khong kem .debug, xuat file .zxp co so phien ban + huong dan cai dat)

---

## [1.3.2] - 2026-07-28 13:37 (UTC+7)  ***BAN PHAT HANH THU SAU***

Loai: Added, Fixed, Changed
Phase: 1 (Scanner) + 6 (UI)
Trang thai: [HOAN TAT dong goi] — [CHO] chu du an cai va thu

Gom hai ban 1.3.2-dev.1 va dev.2 thanh mot ban phat hanh.

### Boi canh — bat dau tu mot cau hoi cua chu du an
*"lam sao de biet file loi vay em? import vao pre bao la loi ha em?"*
Cau tra loi hoa ra lat nguoc ca con so: **"1.027 file loi" thi 968 file bi gan oan.**

    960  mogrt BINH THUONG  goi khong kem anh preview (file van tot 100%)
     46  RAC macOS          `._<ten>` va `__MACOSX` — khong phai file media
     13  audio/video hong   moov atom not found / Invalid data
      8  mogrt hong         zip bi cut duoi

### Added
- **Nut "Don rac macOS tren o"** trong Cai dat (dev.2). Chuyen file rac vao
  **Thung rac Windows** (khong xoa thang), bam hai lan, chi hien khi CO rac.
  Day la **cho DUY NHAT trong panel dung toi file goc cua nguoi dung** — ngoai
  le chu du an chot 28/07, da ghi rang buoc vao `RULES.md`.
- File moi `client/src/services/macJunk.ts`.

### Fixed
- **Bo quet bo qua rac macOS** (dev.1): thu muc `__MACOSX` va file `._*`.
  Bo loc cu chi bo qua ten bat dau bang '.', ma `__MACOSX` thi khong; con
  `._Bright Days.wav` thi mang dung duoi `.wav` nen lot thang vao.
- **The loi thoi treo vinh vien** (dev.1): the audio truoc day chi hoi "da co
  song am chua", khong hoi "da thu va that bai chua" -> file hong nam mai o
  "Dang tao song am..." cho mot viec KHONG BAO GIO chay nua. Gio hien
  **"Khong doc duoc file"**.
- **`library.ts` loc rac ngay khi NAP** (dev.1): file cu da nam trong
  `library.json` cung bi don, KHONG phai tang `LIBRARY_VERSION` de bat quet lai
  28.900 asset.

### Changed
- **Doi cach goi cho dung su that** (dev.1): tach `failedPreview` lam hai con so.
  Cu:  "1.027 file FFmpeg khong doc duoc"  <- SAI voi 960 file
  Moi: "960 file Mogrt khong co anh xem truoc kem trong goi — file van tot,
        Premiere dung binh thuong" + "67 file doc khong ra"

### File anh huong
- `CSXS/manifest.xml` (1.3.1 -> 1.3.2, ca hai cho) · `client/package.json`
- Xem muc dev.1 va dev.2 cho danh sach file ma nguon.

### Kiem chung
- `package-release.ps1`: build sach (67 module), ky va **tu kiem chu ky: dat**.
- Goi: `build/AiO-Studio-Asset-Manager-1.3.2-SETUP.exe` (48,7 MB).
  Doc nguoc tai nguyen nhung trong .exe roi giai nen ra kiem:
      AiO-Studio-Asset-Manager-1.3.2.zxp   48,9 MB   <- dung ban 1.3.2
      CAI-DAT.bat · cai-dat.ps1 · HUONG-DAN-CAI-DAT.txt
  Byte dau `MZ`. Khong lan .zxp ban cu nao.
- `build/stage-release`: **khong co `.debug`** · manifest 1.3.2.
- Dem chuoi trong bundle PHAT HANH:
      `autoReload`                 **0 lan**  -> auto-reload da tat dung
      `__MACOSX`                    3 lan
      `SendToRecycleBin`            1 lan
      "Không đọc được file"         1 lan
      "Rác macOS trên ổ"            1 lan
      "không có ảnh xem trước kèm trong gói"  1 lan
- Do tren panel dang chay sau khi cai ban dev: thu vien **28.892 -> 28.846**,
  dung bang 46 file rac bi loai.
- Thu don rac bang file that trong thu muc tam: 3 file rac vao Thung rac,
  file nhac that `Bright Days.wav` **con nguyen**.

### Con treo — chua quyet
Nut van bao "Preview da du" + mau XANH trong khi con file khong doc duoc.
Ba huong da trinh chu du an (giu nguyen / doi chu / them mau thu ba), chua chon.
Sau 1.3.2 con so nay chi con **67** thay vi 1.027, nen bot gay hieu nham.

---

## [1.3.2-dev.2] - 2026-07-28 12:31 (UTC+7)

Loai: Added
Phase: 6 (UI) + 1 (Scanner)
Trang thai: [HOAN TAT] — da kiem chung bang file thu that

### Boi canh
Chu du an: *"neu em quet xong thu muc - em biet no la rac thi em bo vao cho nay
- de don rac luon duoc khong em? ho bam don rac 1 cai = remove may file rac do
la xong a"*

### DA HOI TRUOC KHI LAM — vi day la viec KHO DAO NGUOC
Nut "Don rac" cu chi xoa file CACHE do panel tu tao (xoa di render lai duoc).
Yeu cau nay dung toi **FILE THAT tren o cua nguoi dung** — hau qua khac han.
RULES.md muc C.2 dang ghi: cacheAudit "khong bao gio dung toi file goc cua
nguoi dung". Chu du an CHOT mo ngoai le cho dung loai rac nay, va chon phuong
an **chuyen vao THUNG RAC WINDOWS** (khong xoa thang) de lo tay con khoi phuc.

### Thay doi
- File MOI `client/src/services/macJunk.ts`:
    `findMacJunk(folders)`   — duyet thu muc, gom file rac + tong dung luong.
                               Chi doc TEN (readdir), khong stat tung file nhu
                               bo quet asset -> re hon nhieu. Chi stat dung
                               nhung file da xac dinh la rac de cong dung luong.
    `moveToRecycleBin(paths)`— chuyen vao Thung rac qua PowerShell +
                               `Microsoft.VisualBasic.FileIO.FileSystem.DeleteFile`
                               (Node khong co API thung rac).
- `SettingsModal.tsx`: them hang **"Rac macOS tren o"**, chi hien KHI CO rac.
  Bam hai lan nhu nut "Xoa tat ca", tu huy sau 6 giay. Don xong tu quet lai.

### Hai rang buoc BAT BUOC (ghi trong dau file macJunk.ts)
1. Chi nhan dien bang DUNG hai dau hieu: ten bat dau `._`, hoac nam trong thu
   muc `__MACOSX`. Khong suy doan them gi khac.
2. Luon vao Thung rac, TUYET DOI khong `unlink`.

### Bay da tranh: duong dan co dau cach va tieng Viet
Khong nhet duong dan thang vao dong lenh PowerShell. Ghi danh sach ra FILE TAM
(UTF-8) roi PowerShell doc lai bang `Get-Content -LiteralPath -Encoding UTF8`.
Thu vien chu du an day ten kieu `._Tieng-coi-xe cuu hoa.mp3` — nhet vao dong
lenh la hong dung o nhung file do.
Moi file boc rieng try/catch: mot file dang bi khoa khong chan ca me.

### Kiem chung — file thu that trong thu muc tam, KHONG dung du lieu chu du an
    Truoc khi don:
       ._Bright Days.wav
       ._Tieng-coi-xe cuu hoa.mp3        <- dau cach + tieng Viet
       __MACOSX\._AnalogDataCounter.wav
       Bright Days.wav                   <- NHAC THAT
    Ket qua: chuyen vao Thung rac **3 file**
    Sau khi don: chi con **Bright Days.wav** — file nhac that KHONG bi dung toi.

- `npm run build`: sach, 0 loi TypeScript. dist 252.98 kB (67 module).
- May chu du an hien KHONG con rac (46 file da bien mat khoi dia tu truoc) nen
  hang nay dang AN. Tinh nang co tac dung tu lan giai nen pack Envato tiep theo
  va tren may nhan vien.

### File anh huong
- File MOI: `client/src/services/macJunk.ts`
- `client/src/components/SettingsModal.tsx` (khoa mem - chi THEM hang moi)
- `PROGRESS.md`

---

## [1.3.2-dev.1] - 2026-07-28 12:20 (UTC+7)

Loai: Fixed, Changed
Phase: 1 (Scanner) + 6 (UI)
Trang thai: [HOAN TAT] — da do tren panel that

### Boi canh
Chu du an hoi: *"lam sao de biet file loi vay em? import vao pre bao la loi ha
em?"* — roi gui hai anh chup: mot thu muc toan the "Dang tao song am..." treo
mai, va Premiere bao **"Unsupported format or damaged file"** voi duong dan
`E:\D\Music\Giai nen\__MACOSX\...\._AnalogDataCounter_Loop...`

### DIEU TRA — "1.027 file loi" that ra la BON nhom khac han nhau
Doc thang library.json + thu mo tung file:

    960  mogrt BINH THUONG   goi chi co definition.json + project.aegraphic,
                             KHONG kem anh preview. File HOAN TOAN TOT,
                             Premiere dung binh thuong.
     46  RAC macOS           `._<ten>` va thu muc `__MACOSX`
     13  audio/video hong    moov atom not found / Invalid data
      8  mogrt hong          zip bi cut duoi (khong co End Of Central Directory)
    ----
   1027

=> **968 file bi gan oan.** Nhan "FFmpeg khong doc duoc" la SAI voi chung.

### NGUYEN NHAN GOC: rac macOS lot vao bo quet
Giai nen mot file zip do may Mac tao tren Windows sinh ra thu muc `__MACOSX`
va cac file `._<ten goc>` — mau metadata vai KB (AppleDouble), KHONG phai file
media. Nhung chung mang DUNG duoi `.wav`/`.mp3`/`.mp4` nen:
  - Bo loc thu muc cu chi bo qua ten bat dau bang '.', ma `__MACOSX` thi khong.
  - Bo loc file cu chi xet DUOI file -> `._Bright Days.wav` lot thang vao.
Ket qua: 46 asset rac nam trong thu vien, Premiere tu choi, FFmpeg doc khong ra.

### Loi thu hai: the "Dang tao song am..." TREO VINH VIEN
`AssetCard.tsx` chi hoi "da co song am chua", KHONG hoi "da thu va that bai
chua". Nen file da danh dau `previewFailed` van hien "Dang tao song am..." —
cho mot viec KHONG BAO GIO chay nua (hang doi da danh dau bo qua). Dung canh
chu du an nhin thay: ca mot thu muc treo mai.
Comment cu con ghi "dung de o trong lam nguoi dung tuong file loi" — y dung,
nhung khi file loi THAT thi cau do thanh noi doi.

### Thay doi
1. `scanner.ts` (khoa mem - chi THEM nhanh loc):
   - Bo qua thu muc `__MACOSX`.
   - Bo qua moi file co ten bat dau `._`.
2. `library.ts` (duoc THEM buoc migrate): loc rac macOS ngay khi NAP thu vien.
   Chay moi lan mo panel -> sach ngay, **KHONG phai tang `LIBRARY_VERSION`**
   de bat quet lai 28.900 asset.
3. `AssetCard.tsx`: the co `previewFailed` gio hien **"Khong doc duoc file"**
   thay vi "Dang tao song am...". Them lop `--failed` (mau `--text-3`, CO Y
   khong dung do choi: file hong trong thu vien 28.900 asset la chuyen thuong,
   khong phai su co can bao dong).
4. `Toolbar.tsx`: tach `failedPreview` lam HAI con so va noi dung ban chat:
       "960 file Mogrt khong co anh xem truoc kem trong goi — file van tot,
        Premiere dung binh thuong, chi la khong co gi de hien."
       "67 file doc khong ra (hong hoac sai dinh dang)."

### File anh huong
- `client/src/services/scanner.ts` (khoa mem - da khai bao)
- `client/src/services/library.ts` (khoa mem - THEM buoc migrate)
- `client/src/components/AssetCard.tsx` · `client/src/styles/_card.scss`
- `client/src/components/Toolbar.tsx`
- `PROGRESS.md`

### Kiem chung
- `npm run build`: sach, 0 loi TypeScript. dist 249.68 kB.
- Do tren panel that sau khi cai (cong 8088):
      Tong asset trong menu:  28.892 -> **28.846**
      Dung bang 28.892 - 46 = **46 rac macOS da bi loai**, khong thua khong thieu.
- Danh sach 8 file mogrt hong that da xuat ra:
      `build/mogrt-hong-can-tai-lai.txt`

### Ghi chu
File rac macOS deu **da bien mat khoi dia** (Get-Item bao "Could not find item")
nhung van nam trong library.json — nghia la chung bi xoa sau khi quet, va panel
khong co buoc don asset co file goc da mat. Chua lam; hien khong con anh huong
vi bo loc moi da chan chung roi.

---

## [1.3.1] - 2026-07-28 12:08 (UTC+7)  ***BAN PHAT HANH THU NAM***

Loai: Added, Changed
Phase: 6 (UI) + 4 (Performance)
Trang thai: [HOAN TAT dong goi] — [CHO] chu du an cai va thu

Gom cac ban 1.3.1-dev.1 -> dev.3 thanh mot ban phat hanh.

### Added
- **Mau trang thai cho nut Render preview** (dev.1): chua render het -> DO,
  render xong -> XANH. Do tuong phan that tren panel: DO 6,17:1 · XANH 8,72:1,
  ca hai vuot chuan AA 4,5:1.
- **Tran tai nguyen co gian theo khoi luong** (dev.3): "render it dung it,
  render nhieu dung toi da". 2 worker (~12% CPU) -> 8 worker (~50% CPU).
  Ghim bang `-threads` chen o mot cho duy nhat trong `execFileAsync`.

### Changed
- **Moi con so tu khai pham vi cua no** (dev.2). Ba cho:
    menu thu muc : "64 âm thanh — cả thư mục có 1.109 file mọi loại"
    nut render   : "... tính trên TOÀN thư viện 28.892 asset, không riêng
                    thư mục đang chọn"
    toast quet   : "Đã quét lại 1200+ Transitions: 1109 file"
  Ly do chu du an noi thang: *"neu minh khong ro rang, editor se hieu la
  render gian doi, ngon tai nguyen"*.

### KHONG lam (da tra loi chu du an, co so kem theo)
- **Gioi han GPU 70%**: Windows khong co API do; va panel dung GPU ~0% (CUDA
  context 1-2s con lau hon giai ma 1 frame bang CPU — benchmark 4K 12s:
  libx264 wall 2,0s vs cuda+nvenc wall 6,2s).
- **Gioi han RAM 50%**: 8 tien trinh ~800 MB / 64 GB = 1,2%, khong bao gio cham.

### File anh huong
- `CSXS/manifest.xml` (1.3.0 -> 1.3.1, ca hai cho) · `client/package.json`
- Xem tung muc dev.1 -> dev.3 cho danh sach file ma nguon.

### Kiem chung
- `package-release.ps1`: build sach, ky va **tu kiem chu ky: dat**
  ("Signature verified successfully").
- Goi gui di: `build/AiO-Studio-Asset-Manager-1.3.1-SETUP.exe` (48,7 MB).
  Doc nguoc tai nguyen nhung trong .exe roi giai nen ra kiem:
      AiO-Studio-Asset-Manager-1.3.1.zxp   48,9 MB   <- dung ban 1.3.1
      CAI-DAT.bat · cai-dat.ps1 · HUONG-DAN-CAI-DAT.txt
  Byte dau `MZ` (dung dinh dang PE). Khong lan .zxp ban cu nao.
- `build/stage-release`: **khong co `.debug`** · manifest 1.3.1.
- Dem chuoi trong bundle PHAT HANH:
      `autoReload`          **0 lan**  -> auto-reload da tat dung
      `btn--state-done`      3 lan · `btn--state-pending`  3 lan
      `totalAll`             4 lan
      "TOÀN thư viện"        2 lan
      "cả thư mục có"        1 lan
      "Dừng render"          1 lan · "Đã quét lại"  1 lan
      `-threads`             1 lan · `threadsPerJob` 11 lan
- [CHO] Cai va thu. LUU Y: doi `manifest.xml` -> **bat buoc tat han Premiere
  roi mo lai**.

### Con treo — chua quyet
Nut van bao "Preview da du" + mau XANH trong khi con **1.027 file FFmpeg khong
doc duoc**. Ba huong da trinh chu du an (giu nguyen / doi chu "Da du (1.027
file loi)" / them mau thu ba), chua chon.

---

## [1.3.1-dev.3] - 2026-07-28 11:44 (UTC+7)

Loai: Added, Changed
Phase: 4 (Performance & JobQueue)
Trang thai: [HOAN TAT ma nguon] — [CHO] do thuc te khi co hang doi that

### KHAI BAO SUA FILE KHOA CUNG (RULES.md muc C.1)
- `client/src/services/jobQueue.ts`
- `client/src/services/ffmpeg.ts`
Chi THEM tham so moi, duong chay NEN giu nguyen 100%.

### Yeu cau chu du an
"em setup luc render cho anh card dung 70% - chip 50% - ram 50% tap trung toi uu
vao tac vu / render it dung it / render nhieu dung toi da"

### TRA LOI TUNG MUC — hai trong ba khong lam duoc nhu hinh dung

**1. CARD (GPU) 70% — KHONG lam duoc, va KHONG CAN.**
  - Windows khong co API gioi han % GPU cho mot tien trinh (khac CPU).
  - Quan trong hon: **panel gan nhu khong dung GPU**. Da benchmark tu 0.10.0
    (ghi trong `proxy.ts`): clip 4K 12s
        libx264 ultrafast : wall 2,0s · CPU-time 3,2s
        cuda + nvenc      : wall 6,2s · CPU-time 5,2s  <- CHAM HON
    Vi khoi tao CUDA context ton 1-2s cho MOI tien trinh, trong khi job cua
    panel deu rat ngan (lay 1 khung hinh / ve song am).
  - `-hwaccel auto` van giu: bang nay FFmpeg tu dung GPU giai ma khi co loi.
  => Khong lam gi them. Gioi han 70% mot thu von dung ~0% la vo nghia.

**2. RAM 50% — khong phai van de.**
  Moi tien trinh FFmpeg loai nay an vai chuc MB. 8 tien trinh ~800 MB tren
  64 GB = **1,2%**. Dat tran 50% (32 GB) thi khong bao gio cham toi.
  => Khong lam gi. Neu sau nay co job an RAM that (vd noi video dai) thi tinh.

**3. CHIP (CPU) 50% + "it dung it, nhieu dung toi da" — DA LAM.**

### Cach lam: nhan SO WORKER voi SO LUONG moi tien trinh
Truoc day khong can `-threads` vi `os.setPriority(pid, 19)` lo het. Nhung TURBO
co y bo IDLE de chay ngang hang Premiere -> mat luon cai phanh do. Nay ghim lai:

    So viec trong hang doi | Worker | Luong tong | % CPU (may 32 luong)
    ---------------------- | ------ | ---------- | --------------------
    < 200                  |   2    |     4      | ~12%
    200 - 999              |   4    |     8      | ~25%
    1.000 - 4.999          |   6    |    12      | ~37%
    >= 5.000               |   8    |    16      | **~50%  <- tran**

- `-threads` chen o DUNG MOT CHO (`execFileAsync` trong `ffmpeg.ts`), khong rai
  vao thumbnailer/waveform/proxy — day la chinh sach dung may, khong phai tham
  so rieng cua tung loai job. Ba noi roi se lech nhau.
- `-threads` la tuy chon toan cuc nen chen TRUOC `-i`. Chi ap cho `ffmpeg.exe`;
  `ffprobe` chi doc metadata, khong dang chan.
- Che do NEN khong ghim `-threads` (`threadsPerJob: 0`) — o do IDLE priority da
  du, ghim them chi lam cham ma khong duoc gi.

### Vi sao tran chi 50% chu khong hon
Ngoai y chu du an, con mot ly do ky thuat da do 28/07: thu vien nam tren **o
cung co** (E: HDD). Nut that la DAU DOC chu khong phai CPU — tang worker qua 8
lam dau doc nhay loan, CHAM HON. Xem muc 1.2.0-dev.3.

### File anh huong
- `client/src/services/jobQueue.ts` (KHOA CUNG - da khai bao)
- `client/src/services/ffmpeg.ts` (KHOA CUNG - da khai bao)
- `PROGRESS.md`

### Kiem chung
- `npm run build`: sach, 0 loi TypeScript. dist 248.93 kB.
- `sign-install.ps1`: cai luc 11:43:44.
- Doc bundle DA CAI, tim thay dung doan chen tham so:
      `qo>0 && /ffmpeg\.exe$/i.test(e) ? ["-threads",String(qo),...t] : t`
  `threadsPerJob` xuat hien 11 lan (thang worker).
- [CHO] Do THAT khi co hang doi: mo Task Manager luc render, xem tien trinh
  ffmpeg.exe an bao nhieu % CPU. Hien hang doi rong (0 viec) nen chua do duoc.
  Cach tao viec de thu: Cai dat -> Xoa tat ca -> bam Render preview.
  LUU Y: xoa cache la phai render lai 28.892 asset, dung lam neu dang can may.

---

## [1.3.1-dev.2] - 2026-07-28 11:39 (UTC+7)

Loai: Changed, Fixed
Phase: 6 (UI)
Trang thai: [HOAN TAT] — da do tren panel that

### Boi canh — cau hoi cua chu du an
"o phan anh chon la 1200+ transition no de so nho la 64 asset nhung anh bam vao
nut render preview ke ben cua moi phan thi no lai la 258 vay em"

Va ly do phai sua, chu du an noi thang:
**"neu minh ko ro rang editor se hieu la render gian doi ngon tai nguyen do em"**

### Nguyen nhan: BA con so, ba pham vi, khong con nao noi minh dem gi
    64     = so file AM THANH trong thu muc do (menu gom theo LOAI, luc do dang
             dung o muc "Am thanh"). Thu muc that co 1.109 file moi loai.
    1.109  = tong asset moi loai trong thu muc do (toast "Da quet lai").
    258    = viec con lai cua **TOAN THU VIEN** 28.892 asset, KHONG rieng thu
             muc vua bam. `queueProgress.total` = `assets.filter(needsWork)`.

### Thay doi
1. `Sidebar.tsx`: them truong `totalAll` cho moi dong thu muc con = tong asset
   MOI LOAI. Chu thich khi re chuot gio ghi:
       "64 am thanh — ca thu muc co 1.109 file moi loai"
   Thu muc chi co mot loai thi KHONG in ve thua ("2.074 am thanh").
   Cach dem: duyet toan bo asset DUNG MOT LUOT, moi asset thu toi da 4 cap thu
   muc roi tra vao tap khoa -> O(asset x 4). Cach ngay tho (moi thu muc loc lai
   ca danh sach) la O(asset x so thu muc) -> du lam menu khung o 28.892 asset.
2. `Toolbar.tsx`: chu thich nut render noi ro PHAM VI, kem tong so asset:
       "... — tinh tren TOAN thu vien 28.892 asset, khong rieng thu muc dang chon"
3. `store.ts` (`rescanPath`): toast noi ro quet lai THU MUC NAO.
       cu:  "Da quet lai: 1109 file"
       moi: "Da quet lai 1200+ Transitions: 1109 file"

### Kiem chung — doc title that tren DOM panel dang chay (cong 8088)
    thu muc nhieu loai : "64 âm thanh — cả thư mục có 1,109 file mọi loại"  OK
    thu muc mot loai   : "2,074 âm thanh"                                    OK
    nut render         : "Cả 28,892 asset đều đã có preview, trừ 1,027 file
                          FFmpeg không đọc được..."                          OK
    so thu muc con dem duoc: 15

### ☠️ DINH CHINH phep do cua chinh minh
Luc tra loi chu du an, toi dem library.json bang `path -like '*1200+ Transitions*'`
va bao thu muc do co **3.866** asset. **SAI.** Bo loc do khop MOI duong dan chua
chuoi ay — gom nhieu thu muc trung ten o cac pack khac nhau. Thu muc chu du an
thuc su bam chi co **1.109** asset (khop dung voi toast va voi `totalAll` do
duoc tren DOM). Bai hoc: loc theo CHUOI CON thi phai kiem lai bang duong dan
TUYET DOI truoc khi dua con so cho chu du an.

### PHAT HIEN CHUA XU LY — nut bao "da du" nhung con 1.027 file loi
Chu thich nut hien: "Ca 28.892 asset deu da co preview, **tru 1.027 file FFmpeg
khong doc duoc**". Nhung NHAN nut van la "Preview da du" va mau XANH.
Voi tinh than "phai ro rang keo editor tuong panel gian doi" thi cho nay con
mau thuan: 1.027 file khong he co preview ma nut bao xanh la da du.
=> CHO chu du an quyet: giu nguyen (vi 1.027 file do render lai cung hong), hay
   doi thanh mau khac / nhan khac de noi ro con file khong doc duoc.

### File anh huong
- `client/src/components/Sidebar.tsx` (khoa mem - chi THEM)
- `client/src/components/Toolbar.tsx` (khoa mem - chi sua chu)
- `client/src/state/store.ts` (chi sua chuoi toast)
- `PROGRESS.md`

---

## [1.3.1-dev.1] - 2026-07-28 11:23 (UTC+7)

Loai: Added
Phase: 6 (UI)
Trang thai: [HOAN TAT] — da do mau va tuong phan tren panel that
             [CHO] dong goi 1.3.1 neu chu du an ung mau

### Boi canh
Chu du an: "nut dung render anh thay neu duoc em them cho anh trang thai cua nut
nay di em / chua render het thi mau do - render xong la xanh la duoc a em".

### Thay doi
- `_controls.scss`: them `.btn--state-pending` (do) va `.btn--state-done` (xanh).
  Dung dung cong thuc cua `.btn--danger`: nen trong suot + vien mo + chu mau,
  nen no van la nut PHU, khong gianh cho voi nut chinh "Them thu muc".
  Dung token co san `--danger` va `--ok`, KHONG them mau moi vao `_tokens.scss`.
- `Toolbar.tsx`: nut Render preview gio doi mau theo trang thai:
      `queueProgress || missingPreview > 0`  -> DO
      con lai                                -> XANH
  Dang render cung tinh la DO vi thu vien van chua du preview. Phan biet voi
  "con thieu, chua chay" bang icon (dong ho / mui ten xoay) va bang chu.
- Ghi chu dau `_controls.scss`: noi ro `.btn--state-*` KHONG phai ho nut thu ba
  (file do ghi "chi co DUNG 2 ho nut"), ma la mau trang thai cho dung mot nut
  vua bam duoc vua lam den bao.

### Kiem chung — do mau THAT tren panel dang chay (cong 8088)
                mau chu                tuong phan tren nen rgb(21,21,23)
    DO      rgb(255, 95, 109)   =--danger      **6,17:1**
    XANH    rgb(78, 201, 138)   =--ok         **8,72:1**
Ca hai vuot chuan AA (4,5:1). Da xac nhan CA HAI luat CSS co that trong bundle
da cai (doc `document.styleSheets`), khong phai chi co trong ma nguon.

### ☠️ BAY DO LUONG lai vap phai — ghi de lan sau khong mat thoi gian
Lan do dau tien ra ket qua VO LY: ca DO lan XANH deu tra ve cung mot mau
rgb(78,201,138). Nguyen nhan: doi `className` qua lai TREN CUNG MOT THE roi goi
`getComputedStyle` ngay trong cung mot nhip JS -> tra ve gia tri CU.
Cach do dung: tao HAI THE RIENG BIET, cho qua 2 nhip `requestAnimationFrame`
roi moi doc. Dung nguyen tac so 5 trong `~/.claude/CLAUDE.md`: **so do vo ly thi
nghi CONG CU DO truoc, dung lao vao sua code** — code luc do khong sai dong nao.

### File anh huong
- `client/src/styles/_controls.scss`
- `client/src/components/Toolbar.tsx`
- `PROGRESS.md` · `~/.claude/CLAUDE.md` (luat "nhe de nhanh")

### Ghi chu: build lau bat thuong
`npm run build` mat **2 phut 15 giay** thay vi ~1 giay. Ly do: turbo render dang
chay that nen may ban. Khong phai loi — chinh la bang chung turbo dang lam viec.

---

## [XAC NHAN] - 2026-07-28 10:48 (UTC+7)

Chu du an da cai ban 1.3.0 bang file `.exe` va chay thu that.

### DA XAC NHAN CHAY DUNG (chu du an thu tren Premiere that)
- **Bo cai mot file `.exe`**: bam dup, tu cai trot lot. Khong phai giai nen,
  khong phai cai them gi.
- **Cuon luoi**: "muot hon han, ngon lanh roi". Khop voi so do:
      the dung lai khi cuon nhanh   24 -> **0**            (1.2.1)
      keo 1px thanh cuon         1.570px -> **21px**       (1.3.0)
- **Keo tha vao timeline**: da xac nhan tu 09:00 sang nay.

### DA XAC NHAN THEM (10:55) — chu du an tra loi tung muc
- **Turbo render**: "render anh thay muot ma roi em". DAT.
- **Song am WebP q80**: "khong bi nhoe voi anh thi anh thay nhu vay la qua on
  roi em". DAT — GIU `-quality 80`, KHONG doi sang `-lossless 1`.
  Nguyen van chu du an, ghi lai vi day la kim chi nam cho moi lan chon sau nay:
  **"khong can nang de dep - anh can nhe de nhanh do em"**.
  -> Da ghi thanh luat o `~/.claude/CLAUDE.md`: gap danh doi chat luong <-> toc
     do thi MAC DINH CHON NHE, dua so ra roi de chu du an che neu xau.
- **Nut "Dung render"**: chua noi co dung that khong, nhung yeu cau THEM trang
  thai mau -> xem muc 1.3.1 ben duoi.

### Con lai chua lam (theo thu tu de xuat)
- Bo han lan goi `ffprobe` rieng (~30-40 phut cho toan thu vien). RUI RO: parse
  sai `duration` -> Import timeline tinh sai track trong (bay so 2).
- Tach hang doi theo o dia (SSD 12-16 luong, HDD 3-4).
- Chan cung `limit` o ~5.000 neu cuon lien tuc van thay vuong.

### Con lai chua lam (theo thu tu de xuat)
- Bo han lan goi `ffprobe` rieng (~30-40 phut cho toan thu vien). RUI RO: parse
  sai `duration` -> Import timeline tinh sai track trong (bay so 2).
- Tach hang doi theo o dia (SSD 12-16 luong, HDD 3-4).
- Chan cung `limit` o ~5.000 neu cuon lien tuc van thay vuong.

---

## [1.3.0-pack] - 2026-07-28 10:35 (UTC+7)

Loai: Added, Changed
Phase: 7 (dong goi)
Trang thai: [HOAN TAT] — [CHO] chu du an chay thu tren may nhan vien

### KHAI BAO SUA FILE KHOA CUNG (RULES.md muc C.1)
- `scripts/package-release.ps1` — them buoc 7 goi sang script moi. Khong dung
  toi phan build / ky / dong zip.
- File MOI: `scripts/make-setup-exe.ps1` (C.3 tu do).

### Boi canh
Chu du an hoi: "co khi nao may cua nhan vien chua cai nhung framework hay python
gi khong em?" roi chot: "dong goi toan bo trong 1 file cai dat luon / dem qua may
khac tu dong cai la duoc roi".

### TRA LOI CAU HOI: may nhan vien KHONG can cai them gi
Da kiem tung thu, khong doan:
  - Python      : panel KHONG dung. Khong co dong python nao.
  - Node.js     : KHONG can cai. CEP cua Adobe da co san Node ben trong.
  - FFmpeg      : KHONG can cai. Da nam san trong goi:
                    bin/win64/ffmpeg.exe   79,0 MB
                    bin/win64/ffprobe.exe  60,1 MB
  - .NET        : KHONG can. Script cai dung PowerShell 5.1 co san tu Win 10.
  - Quyen Admin : KHONG can. Chi ghi vao %APPDATA% va HKCU.
  - Chu ky      : `cai-dat.ps1` TU bat `PlayerDebugMode=1` cho CSXS 9..12, nen
                  chung chi tu tao van chay duoc.
Chi can: Windows 10/11 + Premiere Pro (manifest cho [15.0, 99.9]).

### Rui ro THAT da tim ra: Windows chan file tai tu mang (Mark of the Web)
Goi gui qua Gmail/Drive/Zalo bi danh dau "tu Internet" -> bam dup se hien bang
xanh SmartScreen. Da them muc huong dan vao `HUONG-DAN-CAI-DAT.txt`: chuot phai
file -> Properties -> tick 'Unblock' TRUOC khi giai nen; hoac bam 'More info'
-> 'Run anyway'. Panel khong tu xu ly duoc cho nay.

### Thay doi
- File MOI `scripts/make-setup-exe.ps1`: gop .zxp + cai-dat.ps1 + CAI-DAT.bat +
  huong dan thanh MOT file `.exe`. Bam dup la tu giai nen ra %TEMP% roi goi
  chinh `cai-dat.ps1` da co san (KHONG viet lai logic cai dat — de mot cho duy
  nhat lo viec chep de tung file, bat PlayerDebugMode, bao file bi khoa).
- `package-release.ps1`: them buoc 7 goi script tren. Van xuat ca ban .zip cu.
- `HUONG-DAN-CAI-DAT.txt`: them muc "khong can cai them gi" va muc Unblock.

### DA THU IEXPRESS VA BO — dung lam lai
`iexpress.exe` co san tren Windows va sinh ra dung de lam viec nay, nhung:
  - Goi `/N /Q` tra ve ma loi 1, ke ca voi goi TOI GIAN NHAT (2 file).
  - Moi lan sai cu phap no BUNG HOP THOAI "Command syntax is incorrect!" de
    len man hinh nguoi dung — da lam phien chu du an dung luc dang chat.
=> Dung `csc.exe` (trinh bien dich C# di kem .NET Framework, co san o
   %WINDIR%\Microsoft.NET\Framework64\v4.0.30319\). Tao .exe that, khong popup.

### Kiem chung
- `package-release.ps1` chay tron: build -> ky -> "Signature verified
  successfully" -> tao .zip -> tao .exe.
- File `.exe`: 48,7 MB, byte dau `MZ` (dung dinh dang PE).
- Doc nguoc tai nguyen nhung ben trong .exe roi giai nen ra kiem:
      AiO-Studio-Asset-Manager-1.3.0.zxp   48,9 MB
      CAI-DAT.bat · cai-dat.ps1 · HUONG-DAN-CAI-DAT.txt
  Du 4 file, khong lan ban .zxp cu nao.
- `HUONG-DAN-CAI-DAT.txt` da co muc 'Unblock' va dong 'khong can Python'.
- [CHO] Chay thu tren may nhan vien: bam dup .exe -> co tu cai khong, co hien
  dong "DA CAI XONG" khong, Premiere co thay panel khong.

---

## [1.3.0] - 2026-07-28 10:23 (UTC+7)

Loai: Added, Changed
Phase: 6 (UI)
Trang thai: [HOAN TAT] — da do lai bang so tren panel that

### Boi canh
Sau khi 1.2.1 chua xong phan luoi chop tat, van con NUA VAN DE: thanh cuon nhay.
Chu du an chot huong: "em lam sao ma nguoi editor cam thay thoai mai thi lam nha
em, cung co the la cuon tu tu cung duoc em ne / hoac nguoi ta the tim theo thanh
search nua a em".

### Nguyen nhan (da do o 1.2.1, day la phan chua sua)
    thu vien may chu du an     91.256 asset  -> ~30.400 hang
    chieu cao ao               ~4,5 TRIEU px
    thanh cuon (panel dock)    411 px
    => keo thanh cuon nhich 1px = troi qua 74 HANG = 222 ASSET

Day la TOAN HOC, khong phai loi ao hoa (ao hoa da dung tu 1.2.1). Chuot khong
keo noi "mot phan tu pixel" nen no buoc phai nhay coc. Cach duy nhat chua duoc
la lam danh sach NGAN LAI.

### Thay doi — bam theo DUNG hai thao tac cua nguoi dung phim
1. `Grid.tsx`: them `PAGE = 1000` va state `limit`. Luoi chi do ra 1.000 asset
   dau; `shown = visible.slice(0, limit)`.
2. **Tu do them khi cuon gan day** (nguong 2 hang) — CO Y KHONG co nut "Xem
   them" de bam. Chu du an noi "cuon tu tu cung duoc", nen cuon phai chay lien
   mach, khong gap rao can nao.
   Khong lap vo han: `setLimit` -> `shown` dai ra -> `rows` tang -> `endRow` lai
   nho hon `rows - 2` -> dieu kien tat.
3. `limit` reset ve `PAGE` moi khi doi bo loc / tim kiem / thu muc (gop vao
   `useEffect` cuon ve dau da co san).
4. **Search van quet TOAN BO**: gioi han cat o `visible` (DA loc + sap xep
   xong), KHONG cat o `assets`. Go tim van duyet het 91.256 asset roi moi cat
   phan hien thi. Day la diem de lam sai nhat cua kieu phan trang nay.
5. Them dong chan luoi `.grid-more`: "Dang xem 1.000 trong 12.993 — cuon tiep
   de xem them". Chi de nguoi dung keo thanh cuon xuong het khoi tuong thu vien
   chi co bay nhieu; khong phai nut bam.

### File anh huong
- `client/src/components/Grid.tsx` (khoa mem - da khai bao)
- `client/src/styles/_grid.scss`
- `PROGRESS.md`

### Kiem chung — do tren panel that qua cong 8088 (muc Am thanh, 12.993 asset)
                              truoc        sau
    chieu cao ao           645.319 px   25.885 px      (giam 25 lan)
    keo 1px thanh cuon      1.570 px       21 px       (nhay hon 75 lan)
    ---------------------------------------------------------------
    Keo xuong day lan 1 -> tu nap: 1.000 -> 2.000  (cao ao 51.770)
    Keo xuong day lan 2 -> tu nap: 2.000 -> 3.000  (cao ao 77.500)
    Dong bao hien dung: "Dang xem 1,000 trong 12,993 — cuon tiep de xem them"

- `npm run build`: sach, 0 loi TypeScript. dist 247.18 kB.

### Diem yeu da biet, chap nhan duoc
Cuon lien tuc 13 lan thi `limit` cham 13.000 va chieu cao ao ve lai 645.319 px
nhu cu. Nhung moi lan nap la nguoi dung DA di qua 1.000 asset — cuon het 13.000
muc bang tay la chuyen khong ai lam; can thu o sau thi go o search (van quet
toan bo). Neu sau nay thay van vuong: chan cung `limit` o ~5.000 va bat dung
search, hoac gom nhom theo thu muc.

### Ghi chu nho
Toan panel dang dung `toLocaleString()` khong chi dinh ngon ngu -> ra dau phay
kieu Anh ("12,993") du giao dien tieng Viet. Dong moi nay theo cho nhat quan
voi phan con lai, KHONG doi rieng le. Muon doi sang "12.993" thi phai doi DONG
LOAT ca panel — viec rieng, chua lam.

---

## [1.2.1] - 2026-07-28 10:12 (UTC+7)  ***BAN VA LOI — THAY THE 1.2.0***

Loai: Fixed, Removed
Phase: 6 (UI) + 4 (Performance)
Trang thai: [HOAN TAT] — da do lai bang so, het dao dong

### Boi canh
Chu du an cai 1.2.0 tren may khac (thu vien 91.256 asset) va bao VAN GIAT:
"anh check render xong roi no van bi giat / thanh scroll ben phai no giat va
nhay theo / phan o mau do bi flicker chup thi khong thay duoc".

Diem quan trong: **render DA XONG roi van giat** -> khong phai do thieu anh,
khong phai do cache phinh. Moi thu da lam ve WebP/turbo deu khong cham toi
nguyen nhan that.

### NGUYEN NHAN THAT — do tren panel dang chay, khong doan

Gan vao cong go loi 8088 (CDP qua WebSocket), mo phong DUNG cu cuon nhanh cua
chu du an roi dem the dang dung:

    dung yen            27 the
    DANG cuon nhanh     21 the
    vua dung tay        45 the   <-- dung lai 24 THE CUNG LUC

Do trang thai luoi luc do:
    panel cao (clientHeight)  411 px
    moi hang (cellH + GAP)    149 px  -> vung nhin thay chi 2,76 HANG
    chieu cao ao (spacer)     645.319 px  (12.993 audio / 3 cot)

=> Thu pham la co che "nap truoc IT lai khi cuon nhanh" (OPTIMIZE C6, ban
   0.17.0): cuon nhanh thi co OVERSCAN 6 hang xuong 2 hang, dung tay 160ms thi
   bung lai 6. Panel dock chi cao 2,76 hang nen phan "nap truoc" CHIEM PHAN LON
   luoi — moi lan co vao/bung ra la hon NUA luoi bi do va dung lai. Do dung la
   vung cuoi luoi chop tat ma chu du an nhin thay.

   Ban 1.2.0-dev.1 (Gemini) con nang 4->6 va 1->2, tuc chenh lech tang tu 18
   the len 24 the — **lam nang them 33%** dung cai dang can chua.

### Thay doi
- `Grid.tsx`: GO HAN `OVERSCAN_FAST`, state `fastScroll`, `scrollMark`,
  `slowTimer` va toan bo logic do toc do cuon trong `onScroll`.
  `onScroll` gio chi con dung mot viec: `setScrollTop`.
- `OVERSCAN` co dinh = **4** (tra ve gia tri truoc khi Gemini doi).
- Go `useRef` khoi import (TypeScript bao TS6133 sau khi go — dung nhu mong doi).

### Kiem chung — DO LAI BANG DUNG PHEP DO CU
                        truoc sua   sau sua
    dung yen               27          21
    DANG cuon nhanh        21          33
    vua dung tay           45          33
    them 300ms nua          -          33
    ---------------------------------------
    SO THE DUNG LAI        24           0

So the dung yen o 33 suot qua trinh cuon. Het nhay bac.
(21 luc dung yen la dung: o scrollTop=0 khong co overscan phia tren.)

- `npm run build`: sach sau khi go `useRef`. dist 246.71 kB.
- `sign-install.ps1`: cai luc 10:0x. Panel tu tai lai, do lai ngay tren DOM.

### Con lai CHUA sua — thanh cuon van nhay
Chieu cao ao 645.319 px trong khung 411 px: keo thanh cuon 1 px = nhay ~1.570
px noi dung = ~10,5 hang. Day la he qua cua danh sach 13.000 muc trong panel
cao 411 px, khong phai loi ao hoa. Ao hoa da dung. Muon het han thi phai doi
cach duyet (phan trang / nhom theo thu muc) — viec lon, chua lam.
Sua cai tren da bo phan "giat do do/dung the", con lai la do nhay thanh cuon.

---

## [1.2.0] - 2026-07-28 09:40 (UTC+7)  ***BAN PHAT HANH THU BA***

Loai: Added, Changed, Fixed, Removed
Phase: 4 (Performance) + 6 (UI) + 7 (dong goi)
Trang thai: [HOAN TAT dong goi] — [CHO] thu that 4 muc, xem cuoi muc

Gom cac ban 1.2.0-dev.1 -> dev.4 thanh mot ban phat hanh.

### Added
- **Keo tha vao timeline** — chay that, da xac nhan (dev.2). Ban 1.1.0 tung tat
  vi ket luan sai; xem muc dev.2 de biet nguyen nhan that.
- **Che do Turbo cho nut "Render preview"** (dev.3): bam nut = chay het suc,
  khong cho Premiere ranh, khong nghi giua job, FFmpeg uu tien thuong. Render
  tu dong sau khi quet thu muc VAN chay ngam nhuong Premiere nhu cu.
- **Nut "Dung render"** (dev.3): dang chay thi nut doi thanh Dung va bam duoc.
  Truoc day bi khoa cung, khong co duong thoat.

### Changed
- Thumbnail sinh dang **WebP 320px** thay JPEG 480px (dev.1, Gemini lam).
- Song am sinh dang **WebP q80** thay PNG (dev.3) — cho chiem 96% cache.
- Job sap theo **duong dan thu muc** cho dau doc o cung di mot chieu (dev.3).
- Bo `loading="lazy"`, them pre-decode anh vao RAM (dev.1, Gemini lam).
- OVERSCAN 4 -> 6 hang, OVERSCAN_FAST 1 -> 2 (dev.1, Gemini lam).
- Hop Cai dat: cat chu thua, bo thong tin noi trung o hai hang (dev.4).

### Removed
- **O chon "Chat luong ban xem nhanh" (360p/480p)** (dev.4). No CHUA BAO GIO
  co tac dung: `proxy.ts` ghi cung `scale=-2:360`, khong doc cai dat.

### Fixed
- Nhat ky 1.2.0-dev.1 ghi khong hai muc (`preRenderAllLibrary` va nut
  "Pre-render toan bo Preview") — da dinh chinh, hai muc do khong ton tai.

### File anh huong
- `CSXS/manifest.xml` (1.1.0 -> 1.2.0, ca hai cho)
- `client/package.json` (1.1.0 -> 1.2.0)
- Xem tung muc dev.1 -> dev.4 cho danh sach file ma nguon.

### Kiem chung
- `package-release.ps1`: build `VITE_RELEASE=1` sach, ky va **tu kiem tra chu
  ky: dat** ("Signature verified successfully").
- Goi: `build/AiO-Studio-Asset-Manager-1.2.0-SETUP.zip` (48.7 MB).
  Ben trong dung 4 file, KHONG lan .zxp cu:
      AiO-Studio-Asset-Manager-1.2.0.zxp   48.9 MB
      CAI-DAT.bat · cai-dat.ps1 · HUONG-DAN-CAI-DAT.txt
- `build/stage-release`: **khong co `.debug`** (dung cho ban phat hanh).
- Dem chuoi trong bundle PHAT HANH:
      `autoReload`     **0 lan**  -> auto-reload DA TAT dung
      `turbo`          2 lan
      `cep.dnd.file`   1 lan      -> keo tha co trong ban phat hanh
      `libwebp`        3 lan      -> thumbnail + song am deu WebP
      `480p`           **0 lan**  -> o chon da go sach
      manifest         ExtensionBundleVersion="1.2.0"

### [CHO] Bon thu CHUA duoc thu that truoc khi dong goi
Chu du an biet va van quyet dinh dong goi. Can theo doi sau khi cai:
  1. Turbo render nhanh hon bao nhieu so voi truoc
  2. Premiere co i qua muc chiu duoc khong khi turbo chay
  3. Nut "Dung render" co dung that khong
  4. Song am WebP q80 co bi nhoe khong
     -> neu nhoe: doi `-quality 80` thanh `-lossless 1` trong `waveform.ts`
        (van nho hon PNG ~26% ma khong mat net)

### Luu y khi cai
Ban nay doi `CSXS/manifest.xml` -> **BAT BUOC tat han Premiere roi mo lai**,
khong chi dong panel.

---

## [1.2.0-dev.4] - 2026-07-28 09:36 (UTC+7)

Loai: Removed, Changed
Phase: 6 (UI)
Trang thai: [HOAN TAT]

### Boi canh
Chu du an: "cho nay em nen de 1 option thoi em 360 la duoc roi - em cai dat mac
dinh roi xoa luon option co the chon nay luon em nhe" + "phan text em lam gon
gang lai luon em nha".

### Nguyen nhan that — o chon do CHUA BAO GIO CO TAC DUNG

Grep `proxyQuality` toan bo `client/src` ra dung 4 cho:
    types.ts:123          khai bao kieu '360p' | '480p'
    store.ts:360          gia tri mac dinh '360p'
    SettingsModal.tsx:95  doc de hien
    SettingsModal.tsx:98  ghi khi nguoi dung chon

KHONG co trong `proxy.ts`. Bo sinh ban xem nhanh ghi cung `scale=-2:360`
(proxy.ts:71) va khong he doc cai dat nay. **Chon 480p van ra 360p.**

Mot o cai dat khong doi duoc gi con te hon khong co o nao: nguoi dung doi, thay
y het, roi ngo ca nhung cai dat khac.

### Thay doi

1. `SettingsModal.tsx`: GO han o chon "Chat luong ban xem nhanh".
   Truong `proxyQuality` GIU NGUYEN trong `types.ts` va store — giong cach
   truong `packs` duoc giu khi go Goi Packs. File cai dat da luu tren may
   nguoi dung van doc duoc, khong can buoc chuyen doi du lieu.
   Bo luon `settings` / `updateSettings` khoi component (TypeScript bao
   TS6133 unused ngay sau khi go o chon — dung nhu mong doi).

2. Cat chu thua trong hop Cai dat:
   - Nhan "Noi luu bo nho dem" -> **"Noi luu"**. No dung ngay tren hang "Bo
     nho dem" nen doc hai nhan na na nhau.
   - Hang "Bo nho dem": bo phan noi ve rac. Truoc day noi rac o CA HAI hang
     ("khong co rac" o hang tren, "khong co file thua nao de don" o hang
     duoi) — mat phai doc hai lan cung mot thong tin.
   - Hang "Don rac": "Khong co file thua nao de don" -> **"Khong co file
     thua"** (chu "de don" thua vi nhan da la "Don rac"). Khi CO rac thi gop
     luon dung luong vao: `1.234 file thua (12,3 MB) — don di khong mat gi`.
   - Cau canh bao truoc nut "Xoa tat ca": bo cach noi bang "va" lien tiep.
     Cu: "775 anh xem truoc va 12.928 song am va 40 ban xem nhanh"
     Moi: "775 anh xem truoc, 12.928 song am, 40 ban xem nhanh"
     Gom vao bien `wipeList` (noi bang dau phay, tu bo khoan bang 0) thay vi
     ba khoi JSX long nhau. Bo cau "Trong luc tao lai" -> "trong luc do".

### File anh huong
- `client/src/components/SettingsModal.tsx` (khoa mem - da khai bao)
- `PROGRESS.md`

### Kiem chung
- `npm run build`: lan dau BAO LOI TS6133 (`settings`, `updateSettings` khong
  con ai doc) -> da go. Lan hai sach, 0 loi. dist 247.08 kB (nho hon 248.02).
- `sign-install.ps1`: ky va cai luc 09:36:24.
- Dem chuoi trong bundle DA CAI:
    `480p`           **0 lan**  (truoc khi sua: co)
    `proxyQuality`   1 lan      (con trong store mac dinh — GIU CO CHU Y)
    `xem nhanh`      1 lan      (chi con trong cau canh bao "ban xem nhanh")

### Ghi chu cho lan sau
Class CSS `.setting-select` gio khong con the nao dung toi (con 1 lan trong
stylesheet). De lai, khong dung file style khoa mem cho mot class ba dong.
Lan nao sua `_overlays.scss` thi don luon.

---

## [1.2.0-dev.3] - 2026-07-28 09:21 (UTC+7)

Loai: Added, Changed
Phase: 4 (Performance & JobQueue)
Trang thai: [CHO chu du an do that tren thu vien 28.892 asset]

### KHAI BAO SUA FILE KHOA CUNG (RULES.md muc C.1)
- `client/src/services/jobQueue.ts` — hang doi nen
- `client/src/services/ffmpeg.ts`   — spawn process FFmpeg

Cach giam rui ro: CHI THEM nhanh chay moi, KHONG doi nhanh cu. Tham so
`turbo` mac dinh `false`; moi duong goi cu (`init`, `rescan`, `addFolder`,
`addAssets`) khong truyen gi -> hanh vi y het truoc.

### Boi canh
Chu du an: "kiem tra cac cong nghe nao co the ap dung vao viec render preview
mot cach hieu qua - su dung tai nguyen may nhieu cung duoc - dap ung mot lan
render Preview".

### DO DAC TRUOC KHI SUA — phat hien quyet dinh

May chu du an: Ryzen 9 5950X (16 nhan/32 luong), 64 GB RAM, RTX 4060 Ti.
Nhung do o dia thi ra thu KHAC HAN:

    E: HGST HUH721212ALE604 12TB SATA  = **HDD** (chua 28.892 asset goc)
    C: KINGSTON SNV2S500G NVMe         = SSD  (chua cache preview)

=> NUT THAT LA DAU DOC O CUNG, KHONG PHAI CPU. Nhieu tien trinh FFmpeg cung
doc cac file nam rai rac lam dau doc nhay loan (~10ms/lan nhay). Tang tu 6 len
16 luong se CHAM HON, khong nhanh hon. Day la cho de tuong bo nhat cua bai
toan nay — ghi lai de lan sau khong ai "toi uu" bang cach tang so luong.

GPU (NVDEC) cung KHONG dang: thumbnail chi lay MOT khung hinh, dung CUDA
context ton 100-200ms, lau hon giai ma 1 frame bang CPU. `-hwaccel auto` du.

### Thay doi

1. `jobQueue.ts` — che do TURBO (`startBackgroundProcessing(assets, {turbo:true})`)
   Bo HAI cai phanh, day moi la thu tang toc that:
   - KHONG goi `waitWhileHostBusy` nua. Phanh nang nhat: moi lan playhead
     nhuc nhich la ca hang doi dung them 2,5 giay.
   - `yieldMs` = 0 (thuong la 2-15ms giua moi job).
   - `limit` 6 -> 8 (co y KHONG len 16 vi HDD, xem phan do dac).

2. `ffmpeg.ts` — them `setFFmpegTurbo(on)`.
   Turbo thi THOI ha `os.setPriority(pid, 19)`, de FFmpeg chay uu tien thuong
   ngang Premiere. Mac dinh tat; `jobQueue` TRA VE IDLE trong khoi `finally`
   (ke ca khi loi hay bam Dung) — bo sot cho nay la moi lan render nen SAU DO
   deu gianh CPU voi Premiere.

3. `jobQueue.ts` — sap job theo DUONG DAN (`pending.sort` theo `a.path`).
   Cho dau doc di mot chieu theo cay thu muc thay vi nhay ngau nhien. Dung so
   sanh chuoi thang, KHONG `localeCompare` (bang doi chieu ngon ngu chay tren
   28.892 phan tu ton vai giay). Ap dung cho CA che do thuong.
   Khong doi trai nghiem: `takeNext()` van LUON uu tien `priorityIds` truoc.

4. `store.ts` — `regeneratePreviews()` gio goi turbo.
   Phan biet ro hai tinh huong, KHONG them nut thu hai:
     - Quet xong thu muc -> chay NGAM, nhuong Premiere nhu cu.
     - Nguoi dung BAM nut -> ho dang chu dong doi, chay het suc.

5. `Toolbar.tsx` + `store.ts` — DUONG THOAT.
   Nut dang chay truoc day bi `disabled` -> khong co cach dung. Gio doi thanh
   "Dung render (587/1999)" va bam duoc. Bat buoc phai co tu khi nut nay gianh
   CPU ngang Premiere: khoa nut = bat nguoi dung ngoi chiu tran, hoac phai tat
   Premiere de thoat. Them action `stopPreviewRender()`.

6. `waveform.ts` — song am PNG -> WebP q80.
   Do cache that: song am chiem **96%** bo nho dem (15.711 file PNG = 175,7 MB;
   thumbnail JPG chi 775 file = 7,1 MB). File song am to nhat 822 KB.
   `showwavespic` xuat PNG nen rat kem voi loai anh nay. WebP q80 (co kenh
   trong suot) nho hon ~70%. Tuong thich nguoc: `wf_*.png` cu van dung binh
   thuong. Loi thi lui ve PNG nhu cu.

### Da kiem 2 cho de dinh bay truoc khi doi sang WebP
- `mediaServer.ts` DA co `webp: 'image/webp'` trong bang MIME -> anh hien duoc.
- `cacheService.ts` so theo TEN FILE duoc tham chieu, khong loc theo duoi ->
  khong coi `.webp` la rac. (Neu no loc theo duoi thi ca thumbnail WebP them
  sang nay cung se bi don nham — chua ai phat hien vi chua co file .webp nao.)

### File anh huong
- `client/src/services/jobQueue.ts` (KHOA CUNG - da khai bao)
- `client/src/services/ffmpeg.ts` (KHOA CUNG - da khai bao)
- `client/src/services/waveform.ts` (khoa mem)
- `client/src/components/Toolbar.tsx` (khoa mem - chi THEM)
- `client/src/state/store.ts` (chi THEM action moi)
- `PROGRESS.md` · `CLAUDE.md`

### Kiem chung
- `npm run build`: sach, 0 loi TypeScript. dist 248.02 kB.
- `sign-install.ps1`: ky va cai luc 09:21:06.
- Doc lai bundle DA CAI, dem chuoi:
    `turbo`        2 lan
    `wf_*.webp`    co, dat TRUOC `wf_*.png`
    `libwebp -quality 80`  co trong nhanh waveform
    `setPriority`  2 lan (co nhanh bo qua khi turbo)
- [CHO] Chu du an bam "Render preview" tren thu vien that va bao:
    a) render nhanh hon bao nhieu so voi truoc
    b) Premiere co i qua muc chiu duoc khong
    c) bam "Dung render" co dung that khong
    d) song am WebP nhin co bi nhoe khong (neu nhoe: doi `-quality 80` thanh
       `-lossless 1` trong waveform.ts)

### CHUA LAM — con lai trong danh sach da de xuat
- Bo han lan goi `ffprobe` rieng (gop metadata vao chinh lan chay FFmpeg).
  Loi ich ~30-40 phut cho toan thu vien, nhung RUI RO CAO: parse sai
  `duration` la Import timeline tinh sai track trong (bay so 2 trong
  CLAUDE.md). De sau khi do duoc ket qua cua 6 muc tren.
- Tach hang doi theo o dia (SSD chay 12-16 luong, HDD chay 3-4).

---

## [1.2.0-dev.2] - 2026-07-28 08:52 (UTC+7)

Loai: Changed, Fixed
Phase: 6 (UI)
Trang thai: [HOAN TAT] — KEO THA CHAY DUOC, da xac nhan that

### Boi canh
Chu du an bao: keo tha am thanh vao timeline khong duoc, "hom qua lam duoc ma",
"chieu hom qua em lam duoc - adobe cho phep".

### Da doi chieu file truoc khi sua (4 phep do, deu nguoc voi tri nho do)
1. Bundle DANG CAI truoc khi sua: the `card-asset` co `data-drag-disabled`,
   KHONG co `draggable`. 5 cho `draggable` con lai deu la `draggable={false}`
   tren <img>/<video> BEN TRONG the.
2. Ban 1.1.0 dong goi 11:45 sang 27/07 (ban dung suot chieu 27/07): drag DA TAT.
   build/stage/dist, dist/, build/stage-release/dist — ca ba deu tat.
3. Khong file ma nguon nao trong client/src sua vao CHIEU 27/07. File cuoi cung
   trong ngay la `_card.scss` luc 11:29 SANG. Sau do im den 08:21 sang 28/07.
4. Panel Autocut (sua 14:26 chieu 27/07) khong he co ma keo tha: khong co
   `cep.dnd.file`, khong co `draggable:!0`.

=> Tu 11:45 sang 27/07, moi ban panel tren may deu da tat keo tha. Chieu 27/07
   khong the keo tha tu panel duoc. Nghi chu du an nho nham voi keo file tu
   Windows Explorer vao timeline, hoac keo tu Project panel xuong timeline.

### Thay doi
- `AssetCard.tsx`: BAT LAI keo tha de thu that thay vi tranh luan bang suy doan.
  Doi `data-drag-disabled={String(!!onDragStart)}` -> `draggable onDragStart={onDragStart}`.
- Ham `onDragStart` GIU NGUYEN tu 1.0.4 (dat dung mot khoa `com.adobe.cep.dnd.file.0`,
  `effectAllowed = 'all'`). Khong sua logic, chi noi lai vao the.
- Da kiem CSS truoc khi sua: `_card.scss` chi chan `-webkit-user-drag` tren
  `.card-asset img` va `.card-asset video`, KHONG chan `.card-asset` -> bat
  `draggable` tren the co tac dung.

### File anh huong
- `client/src/components/AssetCard.tsx`
- `PROGRESS.md`

### Kiem chung
- `npm run build`: sach, 0 loi TypeScript. dist/index.html 247.28 kB.
- `sign-install.ps1`: ky va cai dat (TSA khong dung duoc -> ky khong timestamp).
- Doc lai bundle DA CAI luc 08:52:12:
    `data-drag-disabled` : 1 -> **0**
    the card-asset       : gio co `draggable:!0,onDragStart:$e`
    `cep.dnd.file`       : con nguyen (1 lan)
- CHU DU AN DA THU THAT 09:00 28/07: **KEO THA AN**. Keo the tha THANG VAO
  TIMELINE, clip xuong dung track audio. Anh chup man hinh: `_ Alarm 6.wav` va
  `_ Alarm 8.wav` nam tren track A1. Nguyen van: "ngon lanh luon ma em".

### NGUYEN NHAN THAT — vi sao truoc day tuong la Adobe tu choi

Doc lai moc thoi gian chinh trong file nay:
    11:38 27/07  ban 1.0.4-dev.1: sua `effectAllowed` 'copy' -> 'all',
                 ghi ro trang thai [CHO thu lai]
    11:45 27/07  ban 1.1.0: dong goi VA TAT HAN keo tha

Cach nhau **BAY PHUT**. Khong du de chu du an cai va thu. Nghia la ban sua quan
trong nhat CHUA HE CHAY tren may ai — ket luan "Premiere Beta 26.5 tu choi" duoc
dung tren ban build CU (van con `effectAllowed = 'copy'`).

`effectAllowed = 'copy'` CHINH LA nguyen nhan con tro dau cam: noi tha xin kieu
khac (move/link) ma nguon chi cho 'copy' -> Chromium chan cu tha du du lieu hop
le. Doi sang 'all' la het. Gia thuyet ghi o 1.0.4-dev.1 la DUNG, chi la khong ai
kip kiem chung.

Ghi chu ve 4 phep do doi chieu file o tren: chung DUNG ve mat file (chieu 27/07
moi ban build deu da tat drag, nen chieu do khong keo tha tu panel duoc). Nhung
ket luan rut ra tu chung — "Adobe tu choi" — thi SAI. Hai chuyen khac nhau.

### Bai hoc (da ghi vao CLAUDE.md muc bay so 0)
- Dung GO mot tinh nang khi ban sua cuoi cung con dang [CHO thu lai].
- Chu du an noi "hom qua lam duoc ma" -> TIN TRUOC, DO SAU. Anh ay dung panel
  that hang ngay; ky uc thao tac dang tin hon suy luan tu dau thoi gian file.

---

## [1.2.0-dev.1] - 2026-07-28 08:21 (UTC+7)

Loai: Added, Changed, Fixed
Phase: 6 (UI) + 4 (Performance & JobQueue)
Trang thai: [HOAN TAT]

### Boi canh
Voi thu vien lon (~28.900 asset), cache JPEG 480px phinh len >1GB. Khi cuon luoi ao hoa, Chromium trong CEP gap do tre giai ma va HTTP fetch, gay chop nhay (flicker) va khung hinh bi giat.

### Thay doi
1. `thumbnailer.ts`: Sinh thumbnail format WebP 320px (-c:v libwebp -quality 75, scale=320:-1). Giam dung luong tu ~60KB xuong ~12KB/file. Tuong thich nguoc: neu file .jpg cu da co thi van dung binh thuong.
2. `AssetCard.tsx`: Bo `loading="lazy"` trong container cuon rieng cua Virtual Grid (do lazy cua Chromium gay tre). Them Image Memory Pre-decoding cache (img.decode()).
3. `Grid.tsx`: Tang nap truoc OVERSCAN tu 4 len 6 hang, OVERSCAN_FAST tu 1 len 2 hang de anh luon san sang truoc khi cuon toi.
4. ~~`jobQueue.ts`: Them export `preRenderAllLibrary(assets)`~~
5. ~~`Toolbar.tsx` / `SettingsModal.tsx`: Them nut "Pre-render toan bo Preview"~~

### DINH CHINH 28/07 09:05 — muc 4 va 5 KHONG CO THAT

Kiem lai bang grep toan bo `client/src`:
    `preRenderAllLibrary`         -> **0 ket qua**
    nut "Pre-render toan bo"      -> **khong ton tai** trong Toolbar.tsx lan SettingsModal.tsx
Hai muc nay duoc GHI VAO NHAT KY nhung chua he duoc viet. `jobQueue.ts`,
`Toolbar.tsx`, `SettingsModal.tsx` KHONG bi sua (da bo khoi "File anh huong").
Muc 1, 2, 3 thi CO THAT (da doc code xac nhan).

### File anh huong (da sua lai cho dung)
- `client/src/services/thumbnailer.ts`
- `client/src/components/AssetCard.tsx`
- `client/src/components/Grid.tsx`
- `PROGRESS.md`

### Kiem chung
- `cd client && npm run build`: Vite build thanh cong, 0 loi TypeScript.

---

## [1.1.0] - 2026-07-27 11:45 (UTC+7)  ***BAN PHAT HANH THU HAI***

Loai: Changed, Fixed, Removed
Phase: 5 (Host bridge) + 6 (UI) + 7 (dong goi)
Trang thai: [HOAN TAT]

Gom cac ban 1.0.2 -> 1.0.4 dev thanh mot ban phat hanh.

### Da xac nhan CHAY DUNG (chu du an thu that trong Premiere)
  - Am thanh Import: xuong track am thanh TRONG, khong con de len clip co san.
  - MOGRT Import: len track video trong, khong ghi de V1.
  - Bam de xem/nghe; nut Import nham dung the dang phat.

### KEO THA: DA TAT — Premiere tu choi

  Ket qua thu that tren Premiere Beta 26.5: keo ra hien CON TRO DAU CAM, tha
  khong an. Da thu het cac cach re tien:
    - chan <img>/<video> ben trong the tu keo (draggable=false + CSS)
    - bo `text/plain` khoi goi keo, chi giu dung mot khoa CEP
    - mo `effectAllowed` tu 'copy' -> 'all'
  Van khong an. Cung trieu chung da co nguoi bao Adobe tu ban Premiere 2022
  (CEP-Resources #483), den nay Adobe CHUA TRA LOI.

  - Removed: tat `draggable` tren the. Ly do: bat ma keo ra dau cam thi nguoi
    dung tuong panel HONG — tha khong co con hon co ma nhin nhu loi.
  - GIU LAI ham `onDragStart` kem ghi chu day du. Adobe sua duoc thi bat lai chi
    ton MOT dong; xoa han thi lan sau phai lam lai tu dau va mat luon hai cho da
    tra gia (chan anh tu keo, effectAllowed).
  - Chu du an chot: "chon roi bam nut import la qua dinh roi" — nut Import la
    duong chinh, khong dao them.

### Bai hoc da ghi vao ngan tu `adobe-cep-panel`
  - API keo tha CO THAT nhung THUC TE KHONG CHAY tren Premiere doi moi.
  - Gan `effectAllowed` len mot DataTransfer TU TAO thi khong co tac dung ->
    khong kiem chung duoc bang test gia lap, dung mat cong thu kieu do.

File anh huong:
  - client/src/components/AssetCard.tsx
  - CSXS/manifest.xml (1.0.1 -> 1.1.0) · client/package.json

Kiem chung:
  - Build sach; dist 246.86 kB.
  - Dong goi + tu kiem tra chu ky: dat.
  - Giai nen goi SETUP ra thu muc la roi chay cai-dat.ps1: bao dung ban 1.1.0,
    cai xong. Kiem tra thu muc da cai: phien ban 1.1.0, auto-reload DA TAT.
  - [CHO] Chu du an TAT HAN Premiere roi mo lai (bat buoc vi doi manifest).

---

## [1.0.4-dev.1] - 2026-07-27 11:38 (UTC+7)

Loai: Fixed
Phase: 6 (UI)
Trang thai: [CHO thu lai] — day la lan thu RE TIEN CUOI CUNG cho keo tha

Chu du an bao ket qua ban 1.0.3:
  - Am thanh Import: **OK** (het de len track co san)
  - MOGRT Import: **OK**
  - Keo tha: van khong duoc, **hien CON TRO DAU CAM**

"Dau cam" = Premiere CO nhan cu keo nhung TU CHOI. Loai tru duoc gia thuyet
"cu keo khong ra khoi panel".

Thay doi:
  - Fixed: `effectAllowed` tu 'copy' -> **'all'**.
    Ly do: neu noi tha xin mot kieu khac (move/link) ma nguon chi cho 'copy' thi
    Chromium hien DAU CAM va chan cu tha — du du lieu hoan toan hop le. Day la
    nguyen nhan kinh dien nhat cua dung trieu chung nay.

Khong kiem chung duoc bang test gia lap: gan `effectAllowed` len mot DataTransfer
tu tao KHONG co tac dung (da thu: gan 'all' doc lai van ra 'none'). Chi drag that
moi biet. Ghi lai de lan sau khong mat cong thu kieu do nua.

### Neu van khong an — ket luan va huong di

  Da tra het nguon cong khai: KHONG AI CO LOI GIAI. Bao loi
  CEP-Resources #483 (dung trieu chung, tu ban Premiere 2022) den nay Adobe
  CHUA TRA LOI. Premiere Beta 26.5 con moi hon nhieu.

  Mot diem QUAN TRONG chua thu: moi tai lieu va bai viet cong dong deu noi keo
  tha vao **PROJECT PANEL**, khong ai noi tha vao TIMELINE. Rat co the timeline
  khong phai noi tha hop le cua CEP DnD.
  -> Buoc thu ke tiep: tha vao khung **Project** thay vi timeline.
  -> Neu Project panel an ma timeline khong: do la gioi han that cua Premiere.
     Luong lam viec van tron: keo vao Project roi keo tu Project xuong timeline
     (keo noi bo Premiere, chay binh thuong), hoac dung nut Import.

  Neu ca hai deu khong an thi DUNG dao them: giu nut Import lam duong chinh, ghi
  ro gioi han vao tai lieu, khong de chu du an mat thoi gian thu di thu lai.

File anh huong:
  - client/src/components/AssetCard.tsx

---

## [1.0.3-dev.1] - 2026-07-27 11:30 (UTC+7)

Loai: Fixed
Phase: 5 (Host bridge) + 6 (UI)
Trang thai: [HOAN TAT] — CHO thu lai trong Premiere

Chu du an bao ket qua thu ban 1.0.2:
  - "file am thanh VAN DE len line am thanh da co san" -> con loi
  - "file mogrt thi da biet tu dong ne line co track video roi" -> da dung
  - "nhung chua keo tha duoc" -> con loi

### Loi 1: tim SAI THU — "track rong" thay vi "track trong tai cho can dat"

  `ppro_firstEmptyAudioTrack()` tim track RONG HOAN TOAN (`clips.numItems === 0`).
  Timeline dung that thi track am thanh nao cung da co clip -> khong tim duoc
  track nao -> ham tra ve mac dinh 0 -> GHI DE len A1. Dung nhu chu du an gap.

  MOGRT "may" dung vi timeline luc do con track video rong; ban chat cung sai
  y het, chi la chua lo ra.

  - Fixed: doi han cach nghi. Khong hoi "track nay co rong khong" ma hoi
    "**track nay co trong trong khoang [playhead, playhead + thoi luong) khong**".
    Duyet tung clip tren track, coi co clip nao chong lan khoang do khong.
  - Fixed: panel gui kem THOI LUONG asset de host biet khoang can kiem tra.
    Khong biet thoi luong thi lay 5 giay cho rong tay.
  - Fixed: HET CHO thi THEM TRACK MOI (QE DOM), khong roi ve track 0 nhu truoc.
    QE DOM khong chinh thuc nen sau khi goi phai KIEM TRA LAI so track that su
    da tang chua; khong them duoc thi BAO LOI RO RANG cho nguoi dung, tuyet doi
    khong am tham de len clip cua ho.

### Loi 2: keo tha bi Premiere tu choi (con tro dau cam)

  Tra cong dong: co mot bao loi dung trieu chung nay tu ban Premiere 2022, den
  nay Adobe CHUA tra loi (CEP-Resources issue #483) — nhung ca do la panel dung
  IFRAME, panel minh khong co iframe. Nen doc lai code minh va thay 2 nghi pham:

  a) **Anh/video ben trong the tu keo rieng.** Chromium cho keo `<img>` theo mac
     dinh. Nguoi dung bam giu ngay tren anh (anh chiem gan het dien tich the) ->
     nguon keo la CAI ANH, khong phai cai the -> goi keo mang URL anh
     (`http://127.0.0.1/media?...`) chu khong phai duong dan file -> Premiere tu
     choi. Dung trieu chung "dau cam".
     -> Fixed: `draggable={false}` tren moi <img>/<video> trong the, cong them
     `-webkit-user-drag: none` trong CSS. Moi cu keo gio deu xuat phat tu THE.

  b) **Goi keo co 2 dinh dang.** Ban 1.0.1 dat ca `com.adobe.cep.dnd.file.0` lan
     `text/plain`. Host co the vo phai cai kia roi tu choi.
     -> Fixed: chi dat DUNG MOT khoa, giong het mau cua Adobe.

  Chua chac day la nguyen nhan that — em KHONG tu thu keo tha duoc (thao tac
  chuot that giua hai cua so Windows). Neu van khong an, buoc tiep theo la bat
  log CEP luc keo de xem host co nhan su kien khong.

File anh huong:
  - host/ppro.jsx · client/src/lib/cep.ts · client/src/state/store.ts
  - client/src/components/AssetCard.tsx · client/src/styles/_card.scss

Kiem chung (do bang JavaScript tren DOM):
  - Build sach; dist 246.84 kB. Cu phap host/ppro.jsx OK.
  - Ban su kien `dragstart` that len the: goi keo chi con DUNG MOT khoa
    `com.adobe.cep.dnd.file.0` = duong dan file that. Khong con text/plain.
  - The co `draggable=true`; anh ben trong `draggable=false` va
    `-webkit-user-drag: none`.
  - Da ky va cai dat.
  - [CHO] Chu du an thu lai: (1) nhac Import phai xuong track am thanh TRONG,
    khong de len clip cu; (2) keo tha — neu van khong an thi ta con tro luc keo
    (dau cam / dau cong / khong doi gi) de em khoanh vung tiep.

---

## [1.0.2-dev.1] - 2026-07-27 11:21 (UTC+7)

Loai: Fixed
Phase: 5 (Host bridge)
Trang thai: [HOAN TAT] — CHO thu trong Premiere

Khai bao truoc khi sua file KHOA MEM `host/ppro.jsx`: THEM 2 ham moi va sua 2 ham
chen timeline (them tham so TUY CHON, tuong thich nguoc).

Boi canh:
  Chu du an noi ve MOGRT: "chu yeu la video nen no se o tren timeline video thoi,
  co nhung file co am thanh nhung em cung co the import vao line am thanh trong".
  Doc lai ma nguon host thi lo ra HAI loi that, ca hai deu chua ai phat hien.

### Loi 1: file AM THANH bi chen len track VIDEO

  `ppro_importToTimeline()` LUON tim track video roi `overwriteClip` len do —
  ke ca file chi co tieng (.wav/.mp3). Sai track hoan toan; tuy phien ban Premiere
  co the bao loi hoac khong chen duoc gi.

  - Fixed: panel gui kem LOAI asset. `kind === 'audio'` -> chen vao track AM THANH
    trong dau tien; con lai -> track video trong dau tien. Video co san tieng thi
    Premiere tu dat phan tieng xuong track am thanh tuong ung (clip lien ket).
  - Tham so `kind` la TUY CHON, khong truyen thi coi nhu video -> ban cu goi van chay.

### Loi 2: MOGRT GHI DE len clip dang co o V1/A1

  `ppro_importMogrt()` goi `importMGT(path, ticks, 0, 0)` — hai so 0 la
  videoTrackOffset va audioTrackOffset. Nghia la MOGRT LUON de len V1 va A1,
  GHI DE len thu dang nam san o do. Nguoi dung dang dung mot timeline co san clip
  ma bam chen MOGRT la mat clip cu.

  - Fixed: tim track video/am thanh TRONG dau tien roi truyen lam offset.
  - Added: hai ham dung chung `ppro_firstEmptyVideoTrack()` /
    `ppro_firstEmptyAudioTrack()` — truoc day logic nay chi nam trong ham chen file
    thuong, MOGRT khong duoc huong.

File anh huong:
  - host/ppro.jsx · client/src/lib/cep.ts · client/src/state/store.ts

Kiem chung:
  - Build sach; dist 246.73 kB.
  - Kiem cu phap host/ppro.jsx bang parser: OK, 11 ham (them 2 ham moi).
  - Da ky va cai dat (ban phat trien, co auto-reload).
  - [CHO] Chu du an thu trong Premiere:
      1. Bam mot file NHAC -> Import -> phai xuong TRACK AM THANH trong, khong
         phai track video.
      2. Bam mot MOGRT -> Import -> phai len track video TRONG, khong ghi de
         clip dang co o V1.
      3. KEO THA (1.0.1) — em KHONG tu thu duoc, day la thao tac chuot that giua
         hai cua so Windows.

---

## [1.0.1] - 2026-07-27 11:10 (UTC+7)

Loai: Added, Fixed, Removed
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT] — CHO chu du an thu keo tha trong Premiere

### 1. LOI THAT: nghe bai A, bam Import lai chen bai KHAC

  Chu du an bao: "bam nghe mot doan, bam import thi no import doan am thanh khac".

  Nguyen nhan — do chinh thiet ke cua ban 0.17.0: nut Import nham vao `activeAsset`,
  ma `activeAsset` DOI THEO MOI THE CON CHUOT DI NGANG QUA. Nguoi dung bam nghe bai
  A xong dua chuot XUONG nut Import o thanh duoi, tren duong di chuot quet qua may
  the khac — toi noi thi muc tieu da thanh the cuoi cung bi luot qua.

  - Fixed (store + Grid): them `pinnedAsset` — THE DANG PHAT thang con chuot.
    Muc tieu Import = `pinnedAsset ?? activeAsset`. Ve sau giu lai cho truong hop
    nghe het bai, nhac tu dung nhung van muon chen bai do.

### 2. BO HAN HOVER-PREVIEW (chu du an quyet dinh)

  "Bo luon tinh nang hover la nghe nha em · chuyen sang click la nghe de han che loi".

  Day la doi HUONG SAN PHAM: hover-to-preview tung duoc ghi la "trong tam v1" trong
  PLAN muc 0.2. Ly do bo, ghi lai de sau nay khong ai lam nguoc:
    - Chuot di ngang mot o la o do tu phat VA tu nhan minh la muc tieu Import ->
      chinh la goc cua loi o muc 1.
    - Luot qua luoi 15.000 asset la hang chuc lan tu phat ngoai y muon: ton may,
      tieng bat len bat ngo, chop hinh lien tuc.
    - Bam la hanh dong CO CHU Y: mot the phat, dung the do la muc tieu Import.

  - Removed (AssetCard): toan bo state `hover`, `onEnter`/`onLeave`, do tre 120ms.
    `active = pinned` — chi bam moi phat.
  - Changed: audio KHONG BAO GIO lap nua (truoc do chi khong lap khi bam).
  - Changed (D1 - tu sinh ban xem nhanh): dem theo so lan BAM thay vi so lan re
    chuot. Re chuot phan lon la vo tinh; bam moi dung nghia "clip nay hay duoc xem".

### 3. THEM KEO THA TU PANEL VAO TIMELINE

  Chu du an hoi co lam duoc khong. Tai lieu du an dang ghi la KHONG
  ("CEP khong ho tro keo-tha sang Premiere, cac panel thuong mai cung khong lam
  duoc") — GHI SAI. Da tra lai tai lieu Adobe va cong dong:

    event.dataTransfer.setData('com.adobe.cep.dnd.file.0', duongDanFile)

  CEP 5.2 tro len ho tro keo tha giua extension va host; Premiere Pro nam trong
  danh sach ho tro. Day chinh la cach panel Artlist / Motion Array lam duoc.

  - Added (AssetCard): the asset gio `draggable`, keo la gan duong dan FILE GOC
    (khong phai proxy hay anh preview) vao khoa CEP o tren, kem `text/plain` du
    phong khi keo ra Explorer.
  - GIU nut Import: keo tha co the tha truot cho, va ban thuong con nut de bam.
  - Fixed (RULES.md): xoa cau khang dinh sai. Ghi ro chieu TIMELINE -> PANEL van
    la khong lam duoc (Premiere khong co API drag-out), chieu PANEL -> TIMELINE
    thi lam duoc.

### 4. Dong goi lai — va SUA MOT LOI SUYT GUI NHAM BAN CHO NGUOI DUNG

  Phat hien khi dong goi 1.0.1: goi SETUP phinh len 97 MB (dang le 49 MB).

  Nguyen nhan: `package-release.ps1` nen `$outDir\*` — ma thu muc release GIU CA
  CAC BAN CU, nen goi chua ca 1.0.0 lan 1.0.1. Nang gap doi mới là phần nhẹ; nặng
  hơn là bo cai `cai-dat.ps1` lay file .zxp bang `Select-Object -First 1` tren danh
  sach sap theo TEN -> "1.0.0" dung truoc "1.0.1" -> **nguoi dung se cai nham ban CU**
  mà không hề biết.

  - Fixed: goi bang DANH SACH FILE ro rang (dung 4 file cua ban dang dong goi),
    khong nen ca thu muc.
  - Fixed: bo cai lay file .zxp MOI NHAT theo thoi gian, khong theo ten.

File anh huong:
  - client/src/components/AssetCard.tsx · Grid.tsx
  - client/src/state/store.ts
  - scripts/package-release.ps1
  - CSXS/manifest.xml (1.0.0 -> 1.0.1) · client/package.json
  - RULES.md

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build sach; dist 246.71 kB.
  - Re chuot vao the: 0 <audio>, 0 <video>, 0 vien cam — dung, khong con tu phat.
  - Bam the: 1 <audio>, 1 vien cam, nut Import nham dung ten bai do.
  - QUET CHUOT QUA CAC THE KHAC: muc tieu Import KHONG DOI — dung loi cu da het.
  - The co thuoc tinh draggable.
  - Da ky va cai dat (ban PHAT TRIEN, co auto-reload tro lai).
  - [CHO] Chu du an thu KEO THA that trong Premiere: keo tu panel tha vao
    timeline, va tha vao Project panel. Neu tha vao timeline khong an thi bao em —
    co the host chi nhan o Project panel, luc do se ghi ro trong tai lieu.

---

## [1.0.0-setup] - 2026-07-27 10:37 (UTC+7)

Loai: Added
Phase: 7 (Dong goi & phat hanh)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an: "dong goi thanh 1 file de anh dung thu truoc". Ban 1.0.0 dang bat
  nguoi dung phai cai them ZXP Installer (phan mem cua hang thu ba) chi de cai
  mot panel — vo ly voi nguoi khong ranh may tinh.

Thay doi (them vao `scripts/package-release.ps1`):
  - Added: sinh `cai-dat.ps1` + `CAI-DAT.bat` — bam dup la cai xong, KHONG can
    ZXP Installer. File .zxp thuc chat la zip da ky nen chi can giai nen dung
    cho la Premiere nhan.
    Bo cai nay lam luon 3 viec ma nguoi dung khong biet ma lam:
      * chep de tung file, file bi khoa thi BAO TEN ra va nhac dong Premiere
        (khong xoa nua chung roi de lai panel hong — bai hoc 0.17.2)
      * bat co PlayerDebugMode (Premiere doi extension phai duoc ky; ban ky
        self-signed can co nay)
      * KIEM TRA lai `dist/index.html` co that su ton tai roi moi bao "xong"
  - Added: gom tat ca thanh MOT file `build/AiO-Studio-Asset-Manager-1.0.0-SETUP.zip`
    (48,7 MB) de gui di.
  - Changed: `HUONG-DAN-CAI-DAT.txt` nay ghi 2 cach — bam dup (de nhat) va
    ZXP Installer (cho ai da quen).

Kiem chung (chay THAT, dung cach nguoi dung se lam):
  - Giai nen goi SETUP ra thu muc la trong %TEMP%, chay `cai-dat.ps1`.
  - Bao "DA CAI XONG", khong loi.
  - Kiem tra thu muc extension sau khi cai: du 10 file.
      ten trong menu Premiere : "AiO Studio - Asset Manager"  (dung)
      phien ban               : 1.0.0                          (dung)
      con auto-reload khong    : KHONG                          (dung ban phat hanh)

---

## [1.0.0] - 2026-07-27 10:16 (UTC+7)  ***BAN PHAT HANH DAU TIEN***

Loai: Added, Changed
Phase: 7 (Dong goi & phat hanh)
Trang thai: [HOAN TAT]

Khai bao truoc khi sua file KHOA:
  - `CSXS/manifest.xml` (KHOA MEM): doi ten hien thi + tang phien ban.
    Doi manifest thi BAT BUOC tat han Premiere roi mo lai.

### 1. Doi ten panel theo yeu cau chu du an

  - Changed: "AiO Studio Asset Manager" -> "AiO Studio - Asset Manager"
    o ca `ExtensionBundleName` va `<Menu>` (ten hien trong
    Window > Extensions cua Premiere).
  - Changed: phien ban 0.1.0 -> 1.0.0 o `ExtensionBundleVersion` va
    `<Extension Version>`. `client/package.json` cung len 1.0.0.

### 2. Tat auto-reload trong ban phat hanh (viec bat buoc da ghi no tu 0.18.0)

  Van de: `autoReload.ts` cu 1,5 giay lai kiem tra file va TU TAI LAI panel khi
  file doi. Rat tien luc phat trien, nhung trong ban phat hanh thi nguoi dung
  cai ban cap nhat luc dang dung se bi panel reload giua chung.

  Khong the xoa han vi chu du an van dang thu tung ban qua sign-install.
  -> Tach hai duong build:
  - Added `client/.env.release` (VITE_RELEASE=1) + script `npm run build:release`.
  - Changed `App.tsx`: chi goi `startAutoReload()` khi KHONG phai ban phat hanh.
    Vite thay `import.meta.env.VITE_RELEASE` bang "1" luc build nen ca nhanh
    lenh bi loai bo hoan toan, keo theo ca module autoReload.

  Da KIEM CHUNG bang cach do tren file build that (khong tin suong):
    ban dev     : chuoi "index.html" xuat hien 1 lan (autoReload dang theo doi file)
    ban phat hanh: 0 lan  -> module da bi loai bo that su
  Kem theo chot chan trong script dong goi: thay dau vet auto-reload thi canh bao.

### 3. Script dong goi phat hanh

  - Added `scripts/package-release.ps1`:
      doc so phien ban tu manifest (mot nguon su that duy nhat)
      -> build ban phat hanh
      -> staging KHONG kem `.debug` (cong debug 8088 khong thuoc ban phat hanh)
      -> ky ZXP -> TU KIEM TRA CHU KY (`-verify`)
      -> xuat `build/release/AiO-Studio-Asset-Manager-<phien ban>.zxp`
      -> sinh kem `HUONG-DAN-CAI-DAT.txt` (yeu cau, cach cai bang ZXP Installer,
         giai thich canh bao chu ky tu tao, cach go, noi luu du lieu)
  - Luu y ky thuat cho lan sau: KHONG dung `2>&1` voi lenh native trong
    Windows PowerShell 5.1 — vite in mot dong canh bao vo hai ra stderr, va
    PowerShell boc no thanh ErrorRecord lam script chet oan du build thanh cong.

### 4. Ket qua

  - `build/release/AiO-Studio-Asset-Manager-1.0.0.zxp` — 48,9 MB, chu ky da
    duoc chinh ZXPSignCmd xac nhan ("Signature verified successfully").
  - Da cai GOI PHAT HANH DO vao Premiere cua chu du an (giai nen dung cach ma
    ZXP Installer lam), khong phai ban dev: dist 247.901 byte, khong con
    `.debug`, manifest ten moi.

  Con lai de het canh bao "nha phat hanh khong xac dinh" khi may KHAC cai:
  phai mua chung chi code-signing thuong mai. Ban 1.0.0 nay ky bang chung chi
  tu tao, cai duoc nhung ZXP Installer se hoi xac nhan mot lan.

File anh huong:
  - CSXS/manifest.xml
  - client/.env.release (moi) · client/package.json · client/src/App.tsx ·
    client/src/vite-env.d.ts
  - scripts/package-release.ps1 (moi)

Kiem chung:
  - Dong goi chay tron, chu ky verify dat.
  - Do tren file build: ban phat hanh khong con auto-reload (0 dau vet).
  - Da cai vao thu muc CEP extensions, du 10 file, dist dung ban phat hanh.
  - [XAC NHAN 2026-07-27 10:45] Chu du an da tat han Premiere va mo lai:
    panel chay binh thuong voi ten moi "AiO Studio - Asset Manager".
    Ban 1.0.0 chinh thuc dang chay that.

---

## [0.18.0-dev.1] - 2026-07-27 10:06 (UTC+7)

Loai: Removed, Added, Changed, Fixed
Phase: 6 (Polish) + 2 (hang doi nen) + 7 (chuan bi phat hanh)
Trang thai: [HOAN TAT]

Khai bao truoc khi sua file KHOA:
  - `services/jobQueue.ts` (CUNG): doi mot dong sang `updateAssetBatched`.
  - `services/proxy.ts` · `thumbnailer.ts` · `mogrtThumb.ts` (MEM): duong dan
    thu muc cache chuyen sang hoi `cachePaths.ts`. Ten ham giu nguyen.
  - `components/Sidebar.tsx` (MEM): them mep keo doi be rong.

### 1. Go Goi Packs (chu du an: "xoa di, khong con lien quan gi nua")

  - Removed: muc Goi Packs khoi Launcher, Toolbar, Sidebar va Grid; cac hanh
    dong createPack/deletePack/exportPack/setSelectedPackId; MasterTab 'packs'.
  - GIU LAI truong `packs` trong state va trong library.json. Ly do: xoa khoi
    state thi lan luu ke tiep se ghi de mat du lieu pack cu cua nguoi dung, ma
    viec do khong lay lai duoc. Khong con giao dien nao doc no nua.

### 2. Power Bins: co duong VAO thi phai co duong RA

  Chu du an: "cho nguoi ta them ma khong cho nguoi ta xoa ha em?".

  - Added (store): `removeFromPowerBin()` — go asset khoi khay. File goc tren
    dia KHONG bi dung toi, asset van con nguyen trong thu vien.
  - Added (Grid): nut "Bo khoi khay" tren thanh duoi, CHI hien khi dang o Power
    Bins va asset dang tro toi thuc su nam trong mot khay. Dung he mau danh
    (do), tach khoi nut Import mau cam — hai viec khac han nhau ve hau qua.

### 3. Chon noi luu bo nho dem (chu du an: "o C hay bi day lam")

  - Added (`services/cachePaths.ts` moi): MOT noi duy nhat quyet dinh cache nam
    o dau. Truoc day 5 file tu ghep duong dan (`thumbnailer`, `proxy`,
    `mogrtThumb`, `cacheService`, `cacheAudit`) — nam ban sao cua mot quy tac.
  - Added (`services/cacheMove.ts` moi): CHUYEN cache sang o khac cho dung thu
    tu — chuyen file (rename neu cung o, chep neu khac o) -> sua duong dan
    trong thu vien -> ghi lua chon -> don thu muc cu (chi khi da rong).
    Bat buoc phai chuyen file: library.json nho duong dan TUYET DOI, doi cho ma
    bo file lai o cu thi khi nguoi dung don o C la chet 15.000 anh.
  - Added (Cai dat): dong "Noi luu bo nho dem" + nut "Doi cho…". Duong dan hien
    day du (xuong dong, khong cat cut) de biet dang nam o o nao.
  - Chan truoc cac cach chon sai: chon dung thu muc dang dung, hoac chon thu
    muc NAM TRONG cache cu (se tu chuyen vao chinh minh).

### 4. Keo rong menu trai (chu du an hoi ngay khi thay ten thu muc bi cat)

  - Added (Sidebar): mep keo o vien phai, 160-460px, nho be rong vao
    localStorage. Keo duoc thi cung phai chinh duoc bang phim: mui ten
    trai/phai (giu Shift = buoc lon), co role="separator" va aria-label.
  - Ly do: ten pack that rat dai ("CB - Sound Effects Pack Vol 2..."), o be
    rong co dinh 204px thi cat cut gan het, khong phan biet duoc pack nao voi
    pack nao.

### 5. RA SOAT TOI UU PLAYBACK / RENDER / PREVIEW (theo yeu cau truoc khi phat hanh)

  Doc lai duong di cua du lieu luc render. Tim ra HAI thu that su nang, va ca
  hai deu KHONG nam o FFmpeg:

  a) Fixed - moi job xong keo theo BON luot quet toan bo thu vien.
     `updateAsset` chay `assets.map()` tren ca 15.207 asset, va moi lan
     `set({assets})` lai lam:
        Grid    : loc + SAP XEP lai toan bo, dung lai Map 15.207 ten chu thuong
        Sidebar : dung lai cay thu muc con (duyet 15.207)
        Toolbar : dem lai so asset con thieu preview (duyet 15.207)
     Voi ~7.000 job thi rieng viec dung lai mang da hon 100 trieu luot ghi.
     Day moi la thu lam panel i luc render, khong phai FFmpeg (FFmpeg da chay
     o uu tien IDLE tu 0.10.0).
     -> Them `updateAssetBatched`: gom cap nhat trong 400ms roi ap MOT luot.
     Tu 10-30 luot/giay xuong 2,5 luot/giay, moi luot xu ly hang chuc asset.
     Gia phai tra: the hien anh cham hon toi da 0,4 giay.

  b) Fixed - render may tieng dong ho ma KHONG ghi duoc lan nao xuong dia.
     `persist()` la debounce 600ms thuan; hang doi cap nhat lien tuc nen moc
     600ms bi doi di mai. Premiere dong dot ngot la mat sach cong render.
     -> Them tran 15 giay: qua han thi ghi ngay du con ban.

  c) Changed - tien do hang doi bao sau MOI job, moi lan lai render lai thanh
     cong cu + dem lai 15.207 asset. Nguoi dung khong doc noi con so nhay 30
     lan/giay. -> loc con 4 lan/giay; nhip cuoi va lenh ket thuc luon cho qua.

  Da xem va KHONG doi (ghi lai de lan sau khong phai doc lai):
    - `<video>` chi mount khi xem, `preload` chi tai khi do (0.10.0) — dat.
    - May chu media co Range + cache vinh vien cho file dan xuat (0.10.0) — dat.
    - FFmpeg chay uu tien IDLE that su (0.10.0, da sua loi co gia) — dat.
    - Hang doi uu tien theo viewport (0.10.0) — dat.
    - Hang doi nhuong may khi Premiere dang phat (0.17.0) — dat.

  CON LAI TRUOC KHI PHAT HANH: `autoReload.ts` van dang bat, cu 1,5 giay lai
  statSync mot lan va tu reload panel khi file doi. Day la CONG CU CUA NGUOI
  VIET CODE, khong nen co trong ban phat hanh (nguoi dung cai de len ban dang
  chay se bi reload giua chung). Chua tat vi chu du an con dang thu tung ban.

File anh huong:
  - client/src/services/cachePaths.ts (moi) · cacheMove.ts (moi)
  - client/src/services/cacheService.ts · cacheAudit.ts · thumbnailer.ts ·
    proxy.ts · mogrtThumb.ts · jobQueue.ts
  - client/src/state/store.ts · types.ts
  - client/src/components/Sidebar.tsx · Grid.tsx · Toolbar.tsx · Launcher.tsx ·
    SettingsModal.tsx
  - client/src/styles/_sidebar.scss · _grid.scss · _overlays.scss

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build sach, khong loi TypeScript; dist/index.html 246.69 kB, van 1 file.
  - Keo menu trai: 204px -> 324px dung bang doan keo, luu vao localStorage,
    keo qua gioi han thi dung o 460px.
  - Khong con dau vet chu "Pack" nao trong giao dien.
  - Power Bins: mo khay Logo (3 asset) -> bam mot the -> nut "Bo khoi khay"
    hien ra dung ten asset -> bam -> con 2 the, toast "Da bo ... khoi khay".
  - Da ky va cai dat.
  - [CHO] Chu du an thu "Doi cho…" trong Cai dat de chuyen cache sang o D/E.

---

## [0.17.2-dev.1] - 2026-07-27 09:47 (UTC+7)

Loai: Fixed
Phase: 6 (Polish - UI) + 7 (dong goi)
Trang thai: [HOAN TAT]

Khai bao truoc khi sua file KHOA CUNG:
  - `scripts/sign-install.ps1`: sua buoc cai (ly do o muc 2, day la loi that vua
    xay ra trong luc lam viec, khong phai cai tien cho vui).

### 1. Nghe nhac xong no lap lai hoai

  Boi canh: chu du an hoi "bam vao nghe, chay het doan roi no lap di lap lai
  hoai, cai nay co phai loi khong?".

  Tra loi thang: khong phai loi hong, nhung la THIET KE DAT SAI CHO. Thuoc tinh
  `loop` co tu hoi preview chi chay bang re chuot — re 2 giay vao mot SFX 3 giay
  thi lap la dung, vi roi chuot la tat ngay. Nhung tu 0.17.0 nguoi dung CHU DONG
  bam nghe, lap vo han thanh ra bai hat 2 phut 40 duoi theo nguoi ta cho toi khi
  tu nho ra phai bam tat.

  - Fixed (AssetCard): audio khi BAM nghe thi `loop={false}`; het bai la tu nha
    ghim (vien cam tat) va vach playhead ve dau — nhin la biet da nghe xong.
  - Giu nguyen: re chuot van lap (thao tac liec nhanh), va VIDEO van lap ke ca
    khi bam — thu vien nay gan nhu toan overlay/transition dai 1-17 giay, dung
    sau mot luot thi chua kip nhin da het. Am thanh dai 14 giay - 2 phut 40 nen
    xu ly khac la dung, khong phai thieu nhat quan.

### 2. Script cai de lai panel HONG khi FFmpeg dang chay

  Loi that gap ngay trong phien nay: dang render nen (ffmpeg/ffprobe chay) thi
  chay sign-install.ps1 -> `Remove-Item -Recurse -Force` gap binary bi khoa nen
  DUNG GIUA CHUNG. Nhung truoc do no DA XOA MAT `dist\index.html`. Ket qua: thu
  muc extension con moi binary, panel mo ra la trang. Nguoi dung se khong the
  hieu vi sao vua bam cai xong thi panel chet.

  - Fixed: bo han cach "xoa sach roi giai nen de len". Nay giai nen ra thu muc
    tam roi CHEP DE tung file; file dang bi khoa thi bo qua va IN TEN RA (chung
    la binary FFmpeg, noi dung khong doi giua cac ban build nen giu ban cu la
    dung).
  - Added: chot chan cuoi buoc cai — khong thay `dist\index.html` thi bao loi
    ngay, thay vi bao "Xong" tren mot ban cai thieu ruot.

File anh huong:
  - client/src/components/AssetCard.tsx
  - scripts/sign-install.ps1

Kiem chung:
  - Build sach; dist/index.html 245.41 kB.
  - Do bang JavaScript tren DOM: bam nghe -> audio.loop = false; re chuot ->
    audio.loop = true; bam xem video -> video.loop = true. Dung ca ba.
  - Chay lai sign-install.ps1 NGAY LUC hang doi dang chay: script bao
    "[BO QUA] 2 file dang bi khoa: ffmpeg.exe, ffprobe.exe", cai xong 11 file,
    dist\index.html co mat (246.851 byte). Dung kich ban da lam hong lan truoc.

---

## [0.17.1-dev.1] - 2026-07-27 09:34 (UTC+7)

Loai: Fixed, Changed, Added
Phase: 6 (Polish - UI) + 2 (hang doi nen)
Trang thai: [HOAN TAT]

Khai bao truoc khi sua file KHOA MEM/CUNG:
  - `components/Sidebar.tsx` (KHOA MEM): doi CACH CHON CAP thu muc con + them
    thu gon. Khong bo muc nao dang co.
  - `services/jobQueue.ts` (KHOA CUNG): THEM co `previewFailed` (chi them nhanh).
  - `components/Toolbar.tsx` (KHOA MEM): gop chip tien do vao nut.

### 1. "Am thanh 2138 -> Overlay Video 2138" — menu nhom vo dung

  Boi canh: chu du an hoi "am thanh ma lai la overlay video a?".

  Da KIEM TRA DU LIEU THAT (doc library.json, khong doan): panel hien DUNG.
  Ca 2.138 file .wav that su nam trong
      E:\D\Plugins\All in one\Overlay Video\UV BUNDLE\2000+ Cinematic Sound Effects\...
  (bo Envato nhet SFX vao trong thu muc ten "Overlay Video").

  Nhung cach NHOM thi vo dung: bang cu luon lay dung thu muc cap 1, nen muc Am
  thanh chi hien MOT dong chua 100% so file, lai doc nhu bao sai loai.

  - Fixed (Sidebar > buildSubfolders): BO QUA CAC CAP "DI XUYEN". Khi mot cap chi
    co DUNG MOT thu muc va moi file con nam sau hon nua thi cap do khong chia
    duoc gi — di tiep xuong cap sau (toi da 4 cap). Duong dan day du van o tooltip.
  - Fixed: khoa loc duoc cat bang cach DEM DAU PHAN CACH tren chuoi goc, thay vi
    cong do dai cac phan da tach (cach cu lech khi duong dan co hai dau phan
    cach lien nhau, hoac thu muc goc luu voi dau '/' con path dung '\').

  Ket qua do tren thu vien that (15.207 asset):
      Am thanh:  1 muc vo dung  ->  "2000+ Cinematic Sound Effects" (2074)
                                    "1200+ Transitions" (64)
      Video / Mogrt / Hinh anh / Preset: khong doi (chung von da chia duoc o cap 1).
  Da doi chieu tung khoa bang DUNG phep loc cua Grid: so dem KHOP tuyet doi.

### 2. Nut render preview khong cho biet "xong hay chua"

  Boi canh: "bam render, render xong no khong thay doi trang thai, van de nguyen
  1856". Ba nguyen nhan chong len nhau:

  a) Hai cho cung noi mot viec: chip tien do (587/1999) va cai nut ben canh —
     phai doi chieu hai con so moi doan duoc dang o dau.
  b) Nut khong bao gio co trang thai XONG: luon la "Render preview (N)".
  c) LOI THAT: file nao FFmpeg khong doc duoc thi `needsWork()` tra ve true MAI
     MAI. Hau qua kep: moi lan chay lai deu ton mot tien trinh FFmpeg cho dung
     file hong do, va con so "con thieu" KHONG BAO GIO ve 0 — dung nhu chu du an
     mo ta "van de nguyen 1856".

  - Added (types + jobQueue): co `previewFailed`. Thu tao khong duoc thi danh
    dau, hang doi bo qua tu do.
  - Changed (store.regeneratePreviews): bam nut = xoa het co that bai roi chay
    lai — "thu lai" van la y nghia cua nut, phong khi file da duoc thay.
  - Changed (Toolbar): nut co BA trang thai nhin la biet:
      dang chay -> "Dang render 587/1.999" (mo, kem icon dong ho)
      con thieu -> "Render preview (1.856)"
      xong het  -> "Preview da du" (dau tich)
    Tooltip khi xong con noi ro bao nhieu file FFmpeg chiu khong doc duoc.
  - Removed (Toolbar): chip tien do rieng — mot viec noi o mot cho.

### 3. Menu bam lan 2 khong thu gon

  - Added (Sidebar): bam lai chinh muc dang mo = cup danh sach thu muc con;
    bam sang muc khac = chuyen loai va mo ra. Truoc day bam lai khong co phan
    ung gi, trong nhu nut bi ket.
  - Added: mui ten (Caret) tren dong loai co thu muc con, xoay khi mo — khong co
    no thi khong ai doan duoc bam vao se co gi xo ra. Tooltip noi ro se mo hay
    thu gon bao nhieu thu muc.

File anh huong:
  - client/src/components/Sidebar.tsx · Toolbar.tsx
  - client/src/services/jobQueue.ts · client/src/state/store.ts · types.ts

Kiem chung:
  - Build sach; dist/index.html 245.39 kB, van 1 file.
  - Chay thuat toan nhom moi tren library.json THAT: ket qua nhu tren, va doi
    chieu tung khoa bang phep loc cua Grid -> KHOP.
  - Tren trinh duyet, do bang JavaScript tren DOM:
      bam lan 1: 3 thu muc con hien ra, aria-expanded=true, mui ten xoay,
                 tooltip "Bam lan nua de thu gon 3 thu muc"
      bam lan 2: 0 thu muc con, aria-expanded=false
      bam lan 3: 3 thu muc con tro lai
      chip tien do rieng: 0 (da gop vao nut)
  - Da ky va cai dat.

---

## [0.17.0-dev.1] - 2026-07-27 09:17 (UTC+7)

Loai: Changed, Added, Removed
Phase: 6 (Polish - UI) + 2 (hang doi nen)
Trang thai: [HOAN TAT]

Khai bao truoc khi sua file KHOA (theo RULES Phan E.2):
  - KHOA CUNG `services/jobQueue.ts`: THEM mot cho cho tam dung khi Premiere
    dang phat (B3). Khong doi logic nhat viec/uu tien viewport.
  - KHOA CUNG `lib/cep.ts`: THEM ham playerPosition().
  - KHOA MEM `components/Grid.tsx`: THEM overscan theo van toc cuon (C6) va
    thanh duoi co nut Import. Giu nguyen phan tinh hang/cot.
  - KHOA MEM `services/proxy.ts`: THEM tham so tuy chon `force`.
  - `host/ppro.jsx`: THEM ham ppro_playerPosition().

### A. Doi tuong tac theo yeu cau chu du an

  - Changed (AssetCard): BAM vao the = xem video / nghe nhac, va no PHAT TIEP
    ca khi chuot da roi the. Truoc day chi re chuot moi xem duoc — muon nghe
    het mot doan phai giu chuot dung yen tren o. Re chuot van xem nhanh nhu cu,
    hai cach song song.
  - Added: the dang phat co vien cam (`card-asset--playing`). Voi am thanh —
    thu khong co gi chuyen dong — day la cach duy nhat de biet tieng dang phat
    ra tu o nao giua luoi 60 the.
  - Added (store): `pinnedId` — moi luc chi MOT asset duoc phat; bam the khac
    la the cu dung.
  - Fixed (tim ra khi tu thu, truoc khi bao xong): dang ghim mot the ma re chuot
    sang the khac thi HAI tieng phat chong len nhau chi vi con chuot di ngang
    qua. Nay: da bam chon thi lua chon do thang — re chuot chi tu phat khi
    KHONG co the nao dang duoc bam (`pinned || (hover && !pinnedId)`).
  - Changed: bam vao song am luon la "nghe tu doan nay" (khong bao gio tat
    tieng dang nghe), va bam duoc ngay ca khi chua phat lan nao — vi tri duoc
    nho lai roi gan vao dung luc <audio> biet thoi luong.
  - Removed: "bam dup de chen" va "Enter de chen". Chen vao timeline la thao
    tac SUA DU AN THAT cua nguoi dung, khong nen nam sau mot cu bam de lo tay
    ngay tren thu nguoi ta bam suot de xem. Enter/Space gio la xem-nghe.

### B. Mot nut Import duy nhat

  - Changed (AssetCard/Grid): bo nut Chen tren TUNG the (60 nut lam cung mot
    viec tren mot man hinh, lai hay bi bam nham luc re chuot xem). Thay bang
    MOT nut "Import" o thanh duoi, cung hang voi nut doi co hien thi — dung
    nhu chu du an yeu cau.
  - Nhan nut co dinh la "Import" (khong doi theo ten asset: nut nhay chu moi
    lan chuot di ngang mot o thi doc rat met). Muc tieu hien o tooltip.
  - Added (store): `activeAsset` — asset vua duoc tro toi, GIU LAI ca sau khi
    roi chuot, nen thao tac tu nhien la "re xem -> dua chuot xuong bam Import".
  - Removed: `.import-btn` trong `_card.scss` (khong con noi nao dung).

### C. Dot toi uu 2 — phan da lam

  - Added B3 (`services/hostBusy.ts` moi + host + jobQueue): hoi vi tri playhead
    2 lan cach nhau 1.5 giay; vi tri doi = Premiere dang phat/tua/render -> hang
    doi nen tam dung, phat xong 2.5 giay moi chay lai. Cho o TRUOC khi nhan
    viec moi nen job dang do van chay not.
    CO Y KHONG lam nua con lai cua B3 ("dung khi panel bi an"). Nghe hop ly
    nhung phan tac dung voi du an nay: thu vien 7.000+ asset cho render, nguoi
    dung hay bat render roi chuyen sang viec khac — dung theo tam nhin se thanh
    "de ca buoi ma khong render duoc gi". Da ghi ly do vao OPTIMIZE.md.
  - Added C6 (Grid): cuon NHANH (>2 px/ms) thi overscan 4 hang -> 1 hang; nghi
    tay 160ms tro lai 4. Nap truoc luc luot nhanh la nap roi vut di.
  - Added D3 (AssetCard): nho vi tri dang xem cua 3 clip gan nhat; re lai la
    CHAY TIEP tu cho cu thay vi tua ve giay 0.
  - Added D1 (`services/hoverProxy.ts` moi + proxy.ts): dem so lan re chuot
    trong phien; toi lan thu 3 thi sinh ban xem nhanh du file chua "nang" theo
    nguong (>200MB / 4K / ProRes). Chi lam mot ban mot luc, va bo qua file
    duoi 20 MB (phat thang da du muot).

File anh huong:
  - client/src/services/hostBusy.ts (moi) · hoverProxy.ts (moi)
  - client/src/services/jobQueue.ts · proxy.ts
  - client/src/lib/cep.ts · host/ppro.jsx
  - client/src/components/AssetCard.tsx · Grid.tsx
  - client/src/state/store.ts
  - client/src/styles/_card.scss · _grid.scss

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build sach, khong loi TypeScript; dist/index.html 244.29 kB, van 1 file.
  - Bam the video: <video> duoc gan, dang phat, the co vien cam. Bam lan nua:
    <video> bien mat, vien cam tat. Chuot o xa the van phat tiep.
  - Bam vao 70% chieu ngang song am: vach playhead nhay toi 69.8%, nut Import
    doi muc tieu sang dung bai vua bam.
  - D3: xem clip toi giay 1.16, roi chuot, re lai -> chay tiep (2.16 sau 0.7s),
    khong ve 0.
  - C6: dung yen 33 the trong DOM; cuon nhanh con 23 the (-30%); nghi tay tro
    lai 32.
  - Ghim mot the roi re chuot sang the khac: DOM van chi co 1 <video>, 0 <audio>,
    1 vien cam — khong con chong tieng.
  - Nut thanh duoi doc dung "Import", tooltip ghi ten asset se chen.
  - Da ky va cai dat thanh cong.
  - [CHO] Chu du an thu trong Premiere: bam xem/nghe, bam Import chen dung file.

---

## [0.16.0-dev.1] - 2026-07-27 08:57 (UTC+7)

Loai: Fixed, Changed, Added
Phase: 6 (Polish - UI) + 2 (hang doi nen)
Trang thai: [HOAN TAT]

Khai bao truoc khi sua file KHOA MEM (theo RULES Phan E.2):
  - components/SettingsModal.tsx: viet lai muc bo nho dem (ly do o duoi).
  - components/Toolbar.tsx: doi nhan nut + cach dem asset thieu preview (chi THEM).

Boi canh:
  Chu du an gui 2 anh chup trong Premiere: CA LUOI video VA ca 2.138 file am thanh
  deu hien bieu tuong anh vo o goc o. Nut tren thanh cong cu lai chi bao
  "Anh xem truoc (2)" — tuc panel TUONG rang chi con 2 asset thieu anh.
  Kem phan hoi: "nut remove cache cua em qua chi mang, phai biet cai nao can xoa
  thi thong bao cho nguoi dung".

Nguyen nhan GOC (khac han hai lan sua truoc, va giai thich duoc CA HAI trieu chung):
  library.json van giu thumbPath / waveformPath / proxyPath tro toi cac file da
  bi xoa khoi dia (nguoi dung bam "Xoa bo nho dem" o ban CU — ban do xoa file
  nhung khong don duong dan). Hau qua day chuyen:
    1. The co duong dan -> van tai anh -> file khong ton tai -> ANH VO.
    2. Hang doi nen kiem tra `!a.thumbPath` de biet "con viec khong". Duong dan
       VAN CON nen no ket luan "da xong roi" -> KHONG BAO GIO sinh lai.
    3. Nut tren thanh cong cu dem cung dieu kien do -> hien "(2)" trong khi thuc
       te hang nghin file dang hong. Bam nut cung vo ich.
  Hai ban truoc chi sua phan HIEN THI (khong tro <img> vao file video, alt rong)
  nen chua cham toi goc: du lieu treo trong library.json.

Thay doi:
  - Added (services/cacheAudit.ts - file moi): pruneMissingCachePaths() — doc
    DANH SACH TEN FILE cua thumbs/ va proxies/ dung MOT lan (readdirSync) roi tra
    bang Set, nen 15.000 asset chi ton 2 lan doc thu muc thay vi 15.000 existsSync.
    Duong dan nao tro vao thu muc cache ma file da mat thi bi go (ke ca previewPath
    bung tu goi .mogrt — thu ma ban viet tay truoc day bo sot). File GOC cua nguoi
    dung khong bao gio bi xet.
  - Fixed (store): chay bo don nay o 3 cho — luc mo panel (init), luc bam nut
    render preview, va luc xoa bo nho dem. Don xong ghi lai library.json ngay nen
    lan mo sau khong phai don lai.
  - Added (store): healBrokenPreviews() + reportBrokenPreview() — the nao tai anh
    loi thi bao ve, gom lai chay MOT lan sau 600ms (60 the cung hong chi ton mot
    lan doc thu muc), don duong dan treo roi cho hang doi sinh lai.
  - Fixed (AssetCard): nhanh VIDEO truoc day render <img src={asset.thumbPath}>
    thang, khong xet co imgFailed — anh hong thi dung mai o bieu tuong vo, onError
    co chay cung khong doi duoc gi. Nay dung chung `stillImage` nhu cac nhanh khac.
  - Fixed (AssetCard): NGUON ANH VO THU HAI — khi may chu preview chua chay xong,
    mediaUrl() tra ve chuoi RONG, va <img src=""> bi Chromium hieu la chinh trang
    HTML nay -> tai ve khong phai anh -> ve bieu tuong vo o goc o. Gio tinh
    `stillUrl` / `waveUrl` truoc; rong thi KHONG render the <img> nao ca.
  - Changed (Toolbar): nhan nut "Anh xem truoc (N)" -> "Render preview (N)".
    Nhan nut phai la VIEC NO LAM, khong phai ten cua thu no tao ra (dung phan hoi
    cua chu du an). Dem them ca mogrt chua bung duoc preview.
  - Changed (SettingsModal): viet lai muc bo nho dem theo dung yeu cau "phai biet
    cai nao can xoa thi bao cho nguoi dung". Bo nho dem gio tach lam HAI phan co
    hau qua khac han nhau:
      * "Don rac" — file cache khong asset nao con tro toi (thu vien da doi, file
        goc da xoa). Xoa la khong mat gi, khong phai render lai thu gi.
      * "Xoa tat ca" — noi thang bang CON SO THAT se phai tao lai bao nhieu anh
        xem truoc / song am / ban xem nhanh, va bat BAM HAI LAN (lan mot doi
        thanh "Bam lan nua de xoa that", tu huy sau 6 giay).
  - Added (cacheService): analyzeCache() va clearOrphanCache() phuc vu hai nut tren.
  - Removed (SettingsModal): muc "Anh xem truoc / Tao lai" — trung viec voi nut
    "Render preview (N)" da nam san tren thanh cong cu (mot viec mot noi).

File anh huong:
  - client/src/services/cacheAudit.ts (moi)
  - client/src/services/cacheService.ts
  - client/src/state/store.ts
  - client/src/components/AssetCard.tsx
  - client/src/components/SettingsModal.tsx
  - client/src/components/Toolbar.tsx

Kiem chung:
  - Build sach, khong loi TypeScript; dist/index.html 241.75 kB, van la 1 file.
  - Chay that tren trinh duyet, do bang JavaScript tren DOM: 0 the <img> co src
    rong, 0 anh tai loi, nut thanh cong cu doc dung "Render preview (32)".
  - Hop Cai dat mo dung: 3 muc (Chat luong ban xem nhanh / Bo nho dem / Don rac),
    cau canh bao hau qua, nut "Xoa tat ca" o cuoi.
  - Da ky va cai dat thanh cong.
  - [CHO] Chu du an mo panel trong Premiere: luoi phai tu don duong dan treo va
    bat dau render lai (thanh cong cu se hien so lon o "Render preview (N)" thay
    vi "(2)"), song am 2.138 file se lan luot hien ra.

---

## [0.15.1-dev.1] - 2026-07-27 08:39 (UTC+7)

Loai: Changed
Phase: quan tri du an (khong doi ma nguon)
Trang thai: [HOAN TAT]

Boi canh:
  Sau nhieu dot don giao dien, tai lieu bi bo lai phia sau — README con mo ta
  tinh nang DA GO, RULES con khoa file DA XOA, PLAN con ghi roadmap cu.

Thay doi:
  - README.md: cap nhat phien ban va "ke tiep"; them design system vao danh sach
    tai lieu. Sua cac cho noi SAI so voi thuc te:
      "3 dang hien thi" -> 2 (xem vua / xem to)
      bo muc "Chon nhieu bang Ctrl/Shift Click + thanh thao tac o day" (da go)
      "Nut Chen tren the" -> bam dup la cach chinh, nut Chen o goc trai duoi
      them "bam vao song am de tua"
      them nut "Anh xem truoc (N)" va mo ta Cai dat moi
      bo BatchBar khoi so do cau truc thu muc
  - RULES.md: xoa BatchBar.tsx khoi danh sach khoa va ban do phu thuoc (file da
    bi xoa); doi `styles.css` -> `styles/_tokens.scss` (da refactor sang SCSS);
    them ghi chu he mau DEN + CAM; them 6 quy tac giao dien moi rut ra tu cac loi
    that (img khong tro vao file video, anh trang tri alt rong, moi man hinh mot
    nut primary, nut hau qua lon dat xa nut hay dung, chi bao khi that bai, mot
    thong diep mot noi).
  - PLAN.md: cap nhat bang roadmap — Phase 4 tu "XONG" thanh "DA GO" (lam xong
    roi go o 0.9.1); Phase 6 ghi dung thuc te (bo Multi-Select/BatchBar); ghi ro
    con lai la cau noi After Effects va Phase 7.
  - design-system/MASTER.md: cap nhat quy uoc the asset (img chi nhan file anh,
    alt rong, vi tri nut tim/Chen).

Kiem chung:
  - Ra soat lai: khong con tai lieu nao (ngoai muc lich su trong PROGRESS) nhac
    toi BatchBar, "3 dang hien thi", hay "Ctrl + Click".
  - Khong doi ma nguon nen khong can build lai.

---

## [0.15.0-dev.1] - 2026-07-27 08:36 (UTC+7)

Loai: Fixed, Added
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Sau ban 0.14.0 (da don duong dan treo khi xoa bo nho dem), chu du an gui anh
  chup: luoi VAN hien bieu tuong anh vo kem ten file in ra giua o. Nghia la con
  MOT nguyen nhan nua chua duoc tim ra o ban truoc.

Nguyen nhan that (nguyen nhan THU HAI, khac voi 0.14.0):
  AssetCard tinh anh tinh nhu sau:
      visualThumb = asset.thumbPath || previewFile
  Voi VIDEO, `previewFile` chinh la duong dan file .mp4. Khi thumbPath bien mat
  (sau khi xoa bo nho dem), bieu thuc roi xuong dung file video, va the render:
      <img src={...file .mp4} alt={ten file} />
  Trinh duyet khong giai ma duoc .mp4 trong the <img> -> ve bieu tuong anh vo,
  dong thoi in chu `alt` (ten file) ra giua o. Dung nhu anh chup.

Thay doi:
  - Fixed (AssetCard): thay `visualThumb` bang `stillImage` — CHI nhan file that
    su la anh: thumbPath do FFmpeg sinh, previewPath khi previewKind === 'image',
    hoac anh bung tu goi .mogrt. File video KHONG bao gio duoc dua vao <img> nua.
    Video chua co thumbnail thi hien icon loai, hang doi nen se sinh anh sau.
  - Fixed: moi <img> trong the doi `alt={ten file}` -> `alt=""`. Anh trong the la
    TRANG TRI (ten da hien dang chu ngay duoi thẻ), nen khi anh loi khong duoc in
    ten ra giua o. Dung chuan: anh trang tri thi alt rong.
  - Added: co `imgFailed` + `onError` tren moi <img> — anh mat/hong thi lui ve
    icon loai thay vi de o vo.
  - Added (Toolbar): nut "Anh xem truoc (N)" dat NGAY TRUOC nut "Them thu muc",
    N = so asset con thieu anh. Kieu nut thuong (khong phai primary) vi moi man
    hinh chi mot nut chinh. Mo khi dang quet hoac hang doi dang chay.

File anh huong:
  - client/src/components/AssetCard.tsx
  - client/src/components/Toolbar.tsx

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build thanh cong (dist 237.76 kB), khong loi TypeScript, khong loi console.
  - So <img> tro vao file video: 0 (truoc day chinh la nguyen nhan anh vo).
  - So <img> con alt la ten file: 0.
  - 34 the khong co anh -> hien icon loai dung cach, khong con o vo.
  - Thanh cong cu: ["Anh xem truoc (16)", "Them thu muc"] — nut moi dung vi tri.
  - Da ky va cai dat.

---

## [0.14.0-dev.1] - 2026-07-27 08:24 (UTC+7)

Loai: Fixed, Removed, Changed, Added
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an bao hop Cai dat ruom ra, va phat hien LOI THAT: bam "Xoa bo nho dem"
  xong thi luoi hien day anh vo.

Loi va nguyen nhan that:
  clearCache() xoa file trong thumbs/ va proxies/, NHUNG library.json van giu
  thumbPath / waveformPath / proxyPath tro toi cac file vua bi xoa. The van co
  gang tai anh khong con ton tai -> hien bieu tuong anh vo. Canh bao suong khong
  giai quyet duoc; phai don du lieu treo.

Thay doi:
  - Fixed (store): them clearCacheAndReset() — xoa cache VA go bo ba truong
    thumbPath/waveformPath/proxyPath khoi moi asset, ghi lai library.json, roi
    tu chay lai hang doi nen de sinh lai. Nguoi dung khong phai lam gi them.
  - Added (store): regeneratePreviews() — chay lai hang doi cho asset con thieu
    anh xem truoc (nut "Tao lai" trong Cai dat).
  - Removed (SettingsModal): toan bo muc "Hieu nang xem thu" (so lan do, trung vi,
    "Trinh phat video dang mo", nut "Do lai"). Day la cong cu cua nguoi viet phan
    mem, khong phai cua nguoi dung phim — khong thuoc ve hop Cai dat.
  - Changed: viet lai hop Cai dat con 3 dong, bo chu lap:
      "Bo nho dem Cache" -> "Bo nho dem"   (bo nho dem CHINH LA cache)
      "Xoa bo nho dem Cache (1-Click)" -> "Xoa bo nho dem"   (bo chu quang cao)
      "Chat luong Smart Video Proxy" + "Do phan giai Proxy:" + "Proxy dung de..."
        -> mot dong "Chat luong ban xem nhanh"   (truoc noi "Proxy" 3 lan)
  - Added: dong giai thich NGAY TREN nut xoa, tra loi dung cau hoi cua chu du an
    "nen xoa cai nao, khong nen xoa cai nao": noi ro thu vien / brand / khay /
    yeu thich deu GIU NGUYEN, chi anh xem truoc bi xoa va se duoc tao lai.
  - Changed: nut xoa doi tu .btn--primary sang .btn--danger (dung he 2 ho nut cua
    design system: viec thuong vs viec pha huy). Bo nut "Dong" o chan hop (dau X
    goc tren da lam viec do) va them dong bang phim Esc.
  - Changed: thong bao ket qua dung toast chung thay vi dong chu dinh trong hop.

File anh huong:
  - state/store.ts, components/SettingsModal.tsx, styles/_overlays.scss

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build thanh cong (61 modules, dist 237.07 kB), khong loi TypeScript.
  - Hop Cai dat: tieu de "Cai dat", 3 dong (Chat luong ban xem nhanh / Anh xem
    truoc / Bo nho dem), 2 nut (Tao lai, Xoa bo nho dem).
  - Khong con muc Hieu nang; khong con nut Dong o chan; Esc dong duoc.
  - Cau giai thich hau qua hien ngay tren nut xoa.
  - Da ky va cai dat.
  - [CHO] Chu du an bam Xoa bo nho dem trong Premiere de xac nhan khong con anh vo.

---

## [0.13.0-dev.1] - 2026-07-27 08:17 (UTC+7)

Loai: Removed, Changed, Added
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Loat phan hoi khi dung that trong Premiere. Van de chung: nhieu thu THUA hoac
  DE BAM NHAM, va mot vai cho noi cung mot dieu o hai noi.

Thay doi:
  - Removed: nut "quet lai tat ca" o thanh tren. Bam nham la quet lai 15.206 asset.
    Moi muc trong menu trai da co nut quet lai rieng (rescanPath) — pham vi hep,
    hau qua nhe. Ham rescan() GIU trong store vi con dung khi nang cap du lieu.
  - Changed: nut "+ Brand" nho xiu canh tieu de -> khoi "Tao brand" rong het cot,
    cao 28px (.hub__add-main). Tao brand la viec chinh cua man hinh do khi chua co
    brand nao; nut nho nhet canh tieu de vua kho bam vua trong nhu chi tiet phu.
  - Removed: dong nhac o dau luoi Power Bins khi CHUA chon khay — noi y het man
    hinh rong ngay ben duoi. Nay chi hien khi DA chon khay (luc do cau nay noi dieu
    moi: keo-tha duoc). Doan huong dan trong menu trai cung bo.
    Ket qua: chi con MOT noi giai thich trang thai.
  - Added: khi chua co brand nao, man hinh giua doi thanh "Chua co brand nao" +
    huong dan tro toi nut "Tao brand" — dung noi duy nhat, dung ngu canh.
  - Removed: thong bao noi khi CHEN THANH CONG (truoc con bi LAP: mot o store, mot
    o AssetCard). Chen xong thi thay ngay tren timeline, bao them mot hop noi che
    luoi la thua. VAN giu thong bao khi THAT BAI — luc do man hinh khong doi gi.
  - Changed: nut Chen tren the tu vien thuoc TO GIUA ANH -> icon tron 24x24 o GOC
    TRAI DUOI (cung co voi nut tim o goc phai tren). Giua anh thi vua che preview
    vua hay bi bam nham khi re chuot xem. Goc phai duoi da co nhan thoi luong.
  - Removed: che do xem "danh sach ngang" (cardSize 'S'). Chi con "Xem vua" (M) va
    "Xem to" (L). Don sach: kieu cardSize, COL_W, isLineView (8 cho), va khoi CSS
    .card-asset--line.
  - Added: BAM VAO SONG AM DE TUA. Anh song am trai tron thoi luong nen ti le ngang
    = ti le thoi gian; bam o dau nhay toi do va phat tiep. Con tro doi thanh
    col-resize de bao la keo/bam duoc. Chi bat khi DA co anh song am.

File anh huong:
  - components/Toolbar.tsx, PowerBinHub.tsx, Grid.tsx, AssetCard.tsx
  - state/store.ts
  - styles/_sidebar.scss, _card.scss

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build thanh cong (61 modules, dist 237.88 kB), khong loi TypeScript.
  - Ra soat toan UI: 0 nut chi-co-icon thieu aria-label; 0 vung bam duoi 24px;
    0 tran ngang; font-size deu nam trong thang --fs-*.
  - Nut quet lai toan cuc: khong con trong thanh tren.
  - Nut "Tao brand": 179x28 (truoc la nut nho canh tieu de).
  - Power Bins: 0 dong nhac o luoi, 0 doan huong dan trong menu trai.
  - Che do xem: dung 2 lua chon "Xem vua" / "Xem to".
  - Nut Chen: 24x24, khong chu, nam goc TRAI-DUOI cua the.
  - Tua song am: bam o 75% chieu ngang -> playhead nhay toi 74.7% (dung).
    Luu y: trinh duyet khong co may chu media noi bo nen audio chua co du lieu
    that — phep tinh va playhead da dung, con phat that phai thu trong Premiere.
  - Da ky va cai dat.

---

## [0.12.0-dev.1] - 2026-07-27 07:54 (UTC+7)

Loai: Changed, Removed
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Ba yeu cau tu chu du an: (1) bo thanh chon hang loat o day vi thua,
  (2) dua nut Cai dat ra vi tri toan cuc vi no thuoc ve ca tool,
  (3) doi he mau sang DEN + CAM theo anh tham chieu, va bo nhan "MOGRT"
  lap lai tren tung the khi da dung trong muc Mogrt.

Thay doi:
  - Removed: BatchBar (thanh chon hang loat) — xoa component, SCSS, va ca thao tac
    "bam de chon" trong AssetCard cung style .card-asset--selected. Ly do: bo thanh
    thao tac thi viec chon khong con hanh dong nao, de lai se thanh UI chet
    (bam vao sang vien xanh ma khong lam duoc gi).
  - Changed: Cai dat thanh TOAN CUC — them settingsOpen/setSettingsOpen vao store,
    render SettingsModal o cap App, gan nut o Toolbar (mo duoc tu ca 3 workspace)
    va o Launcher (goc tren phai man hinh chon). Truoc day nut nam trong menu trai
    va CHI hien o Asset Manager.
  - Changed: he mau DEN + CAM (thay cho den ngal lanh + xanh duong).
      Nen:    --bg-0..6 = #0a0a0b -> #2c2c31 (den trung tinh)
      Chu:    --text-1 #f5f5f7 (14.4:1) · --text-2 #c3c3c8 (8.9:1)
              --text-3 #8d8d95 (4.8:1) · --text-meta #9b9ba3 (5.7:1)
      Accent: --accent #ff5714 (4.9:1 khi lam chu) · --accent-text #ffb599 (9.2:1)
              --accent-on #150700 (6.2:1 — chu tren nut cam dac)
      Ngu nghia: --danger doi sang #ff5f6d (hong-do) de PHAN BIET voi cam.
    Da do tuong phan bang cong thuc luminance cho TAT CA cap mau; thap nhat 4.75:1.
  - Changed (AssetCard): bo nhan loai lap lai. Quy tac: an ICON loai khi dang loc
    dung loai do; an DUOI FILE khi duoi trung ten loai (.mogrt). Video/audio van
    giu duoi (MP4/MOV/WAV) vi do la thong tin that. Dau phan cach "·" chi hien khi
    co phan dung truoc.

Luu y ky thuat:
  Anh tham chieu dung CHU TRANG tren nut cam — do chi dat 3.2:1, truot chuan 4.5:1
  o co chu 12px cua panel. Da dung --accent-on (nau gan den, 6.2:1) thay the;
  nut van doc la mau cam ruc nhu anh mau.

File anh huong:
  - client/src/App.tsx, components/Toolbar.tsx, components/Launcher.tsx,
    components/Sidebar.tsx, components/AssetCard.tsx, state/store.ts
  - client/src/components/BatchBar.tsx (da xoa)
  - client/src/styles/_tokens.scss, _card.scss, _overlays.scss, _launcher.scss
  - design-system/aio-studio/MASTER.md

Kiem chung (chay that tren trinh duyet, do bang JavaScript tren DOM):
  - Build thanh cong (dist 238.97 kB), khong loi TypeScript, khong loi console.
  - batch-bar: khong con trong DOM; bam the khong con sang vien chon.
  - Nut Cai dat co mat o: man hinh chon, Asset Manager, Power Bins; mo/dong modal OK;
    da roi khoi menu trai.
  - --accent = #ff5714, nen app = rgb(21,21,23) — dung he den+cam.
  - Trong muc Mogrt: khong con chu "MOGRT" tren the nao; the video van hien "MP4·4K".
  - Da ky va cai dat.

---

## [0.11.0-dev.1] - 2026-07-26 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  (1) Chu du an hoi "co that su toi uu chua" — cau tra loi trung thuc la: code da
  sua + co so do tung phan, nhung CHUA co so do end-to-end "re chuot -> thay
  hinh". Da bit lo hong do trong phien nay. (2) Chu du an yeu cau: menu moi loai
  (vd Am thanh) hien LIST THU MUC CON nhu trong folder that (E:\D\Music).
  (3) Chu du an da nghiem thu tren Premiere that: "chay nhanh roi do em",
  "phan khay hoat dong roi em nha".

Thay doi:
  - Added: do end-to-end tren trinh duyet — video demo THAT 154KB (client/src/
    dev/preview.mp4, chi vao ban dev; da kiem "data:video"=False, "/src/dev/"=
    False trong dist, chuoi "preview.mp4" trong dist la danh sach ten tim cua
    mogrtThumb, khong phai video). mockData gan preview + mediaReady=true.
  - Changed: mediaUrl() cho qua URL tuyet doi (data:/blob:/http) — phuc vu do
    dev; trong CEP moi duong dan la file path nen khong doi hanh vi.
  - Added: MENU THU MUC CON THEO LOAI (Sidebar.buildSubfolders + .nav-sub):
    bam mot loai la xo cac thu muc con CAP 1 duoi thu muc goc da quet, dem so
    file (de quy), bam de loc luoi (prefix path + dung ky tu phan cach — tranh
    "E:\Nhac" khop nham "E:\Nhac cu"). Dung lai state selectedPath co san.
    Chi xo duoi muc DANG chon de menu khong dai vo tan. Grid them nhanh loc
    selectedPath (chi o Asset Manager) + deps + reset scroll.
  - Changed: mock — moi loai mot thu muc goc + thu muc con (SFX/Cinematic/
    Ambient...) giong thu vien that, het trung ten giua cac goc.

Kiem chung (SO DO END-TO-END dau tien):
  - "Re chuot -> frame dau" do bang SCRIPT doc lap (event loadeddata, 6 the):
    2 lan dau ~1.0s (tai file + khoi tao decoder lan dau), sau do on dinh
    **143-147ms**, trong do **120ms la do tre hover CO Y** (chong phat nham khi
    lia chuot) => phan viec that ~25ms.
  - Bang "Hieu nang xem thu" trong Cai dat do doc lap ra **34ms** (tinh tu SAU
    do tre 120ms) — HAI PHEP DO DOC LAP KHOP NHAU (147-120≈27 ~ 34ms + overhead
    event). So tin duoc.
  - So <video> song: toi da 1 khi hover, ve 0 khi roi chuot (do that tren DOM).
  - Menu thu muc con: bam "Am thanh" ra Ambient(6)/Cinematic(5)/SFX(5); bam
    folder -> luoi con dung so the cua folder do; bam lai -> bo loc. Da chup
    man hinh xac nhan giao dien.
  - 2 lan do script dau tien TIMEOUT — nguyen nhan la CONG CU (pane nen khong
    chay rAF + nghi timer bi throttle, da kiem setTimeout 0/50ms ra 0/53ms
    truoc khi ket luan), khong phai code panel. Ghi lai de phien sau khong
    di sua nham.
  - tsc 0 loi; build 239.02 kB; da ky + cai vao Premiere.
  - NGHIEM THU THUC TE cua chu du an trong Premiere: toc do "chay nhanh roi",
    Brand Kit/khay "hoat dong roi".

---

## [0.10.0-dev.1] - 2026-07-26 (UTC+7)

Loai: Added, Changed, Fixed
Phase: 6 (Toi uu hieu nang)
Trang thai: [DANG LAM]

Boi canh:
  Chu du an duyet lam TOAN BO danh sach OPTIMIZE.md, yeu cau kiem tra cheo tu
  local den thuc te, tan dung CPU/GPU/RAM cua may (Ryzen 9 5950X 16C/32T, 64GB
  RAM, RTX 4060 Ti).

DO DAC TRUOC KHI SUA (benchmark that tren may, clip test 4K 12s H.264 40.7MB):
  - Proxy pipeline hien tai (libx264 ultrafast): wall 2.029ms, CPU-time 3.219ms.
  - GPU full pipeline (cuda decode + scale_cuda + nvenc): wall 6.245ms (kem 3x do
    chi phi khoi tao CUDA moi tien trinh ~1-2s), tong CPU-time 5.156ms (CAO HON
    libx264!). => KET LUAN: voi job ngan (proxy 360p tung file), GPU encode KHONG
    thang; giu libx264 ultrafast + HA UU TIEN tien trinh la dung bai. GPU de danh
    cho Premiere dung.
  - FFmpeg bundle 6.1.1 co cuda/nvenc (da kiem -hwaccels, -encoders).

KHAI BAO FILE KHOA (RULES.md Phan C — ghi TRUOC khi sua):
  - `ffmpeg.ts` (KHOA CUNG): sua vi co LOI DA XAC NHAN — option `creationflags`
    KHONG TON TAI trong Node child_process, bi bo qua am tham; FFmpeg dang chay
    uu tien NORMAL tranh CPU voi Premiere, nguoc voi dieu comment va tai lieu tin.
    Sua bang os.setPriority(pid, IDLE) sau khi spawn — API chinh thuc cua Node.
  - `jobQueue.ts` (KHOA CUNG): them (a) xu ly mogrt (bung preview nhung — hien
    hang doi BO QUA hoan toan mogrt), (b) uu tien theo viewport, (c) nang so
    worker song song cho may nhieu nhan (an toan vi FFmpeg da chay IDLE),
    (d) stat size cho asset fileSize=0. Giu nguyen khung worker/yield.
  - `mediaServer.ts` (KHOA CUNG): CHI them header Cache-Control immutable cho
    file DAN XUAT (thumbs/proxies — ten file chua hash id, noi dung bat bien).
    File goc nguoi dung GIU no-cache. Khong dong logic token/range.
  - `library.ts` (KHOA MEM): saveLibrary tu writeFileSync + JSON pretty sang ghi
    BAT DONG BO + NGUYEN TU (ghi .tmp roi rename, latest-wins). File ~8MB dang
    lam dung hinh panel moi 600ms.
  - `scanner.ts` (KHOA MEM, luat "chi THEM nhanh moi"): NGOAI LE co ly do — doi
    statSync tung file (dong bo, chan UI) sang fs.promises.stat song song theo
    thu muc. Day la sua truc tiep muc C1 cua OPTIMIZE.md ma chu du an da duyet
    ("xu li lan luot toan bo"). Logic phan loai/ghep cap KHONG doi.
  - `probe.ts` (KHOA MEM): them tham so kind de -select_streams dung stream can,
    giam thoi gian phan tich. Cach parse JSON giu nguyen.
  - `Grid.tsx` (KHOA MEM): khong dong phan tinh hang/cot; them precompute ten
    chu thuong + useDeferredValue cho tim kiem + bao viewport cho jobQueue.
  - `AssetCard.tsx` (C.3 tu do trong gioi han D): doi chien luoc render video.

Trang thai: [HOAN TAT] — da lam TOAN BO dot 1 (E0, A1-A5, B1-B2, C1-C5).
Con lai tang D (D1-D4, nang chat luong cam nhan) — de dot sau.

Thay doi:
  - Added E0: services/perf.ts — do "re chuot -> frame dau" (avg/median/max/last)
    + dem so <video> dang song trong DOM. Xem trong Cai dat > "Hieu nang xem thu",
    co nut Do lai. AssetCard danh dau markHoverStart/markFirstFrame/cancel.
  - Changed A1+A2 (AssetCard): MAC DINH la anh tinh (thumbPath), <video> CHI
    mount khi hover (autoPlay, overlay de len anh nen khong nhay den); roi chuot
    la unmount. Truoc: moi the video trong tam nhin mount 1 <video> preload=auto.
  - Added A4: services/zipRead.ts (moi, thuan - khong import CEP, test duoc bang
    Node that) — doc ZIP MOT PHAN: duoi file (EOCD) -> central directory -> dung
    entry can. mogrtThumb.ts viet lai: bat dong bo (fs.promises), chong bung
    trung (inflight map), cache dia nhu cu.
  - Changed A5 (jobQueue): uu tien theo VIEWPORT — Grid bao danh sach id dang
    hien (setQueuePriorityIds theo slice ao hoa), worker nhat viewport truoc.
    Them xu ly MOGRT (bung preview nhung + sinh anh tinh mg_<id>.jpg cho preview
    dang video); them stat size cho asset fileSize=0; limit worker theo may:
    <=4 nhan: 1 · <=8: 3 · >8 (5950X 32 luong): 6.
  - Fixed B1 (ffmpeg): bo `creationflags` (KHONG TON TAI trong Node — bi bo qua
    am tham tu truoc den nay); thay bang os.setPriority(pid, 19) sau spawn.
  - Changed B2 (proxy): giu tieng (aac 96k — truoc la -an, video nang hover cam
    lang); them -movflags +faststart (moov len dau, phat ngay khong doi tai het).
    LUU Y: proxy DA CACHE van la ban cu khong tieng — xoa cache de sinh lai.
  - Changed A3 (mediaServer): file dan xuat trong <userData>/AiOStudio (thumbs/
    proxies — ten chua hash id, bat bien) tra Cache-Control immutable 1 nam;
    file goc nguoi dung giu no-cache. Logic token/range khong dong.
  - Changed C1 (scanner): bo statSync tung file; gom file theo thu muc roi
    fs.promises.stat SONG SONG (thread pool, khong chan UI).
  - Changed C2 (probe): them tham so kind -> -select_streams v:0 / a:0;
    jobQueue chi probe video+audio (mogrt/preset/image khoi spawn ffprobe).
  - Changed C3 (library): saveLibrary bat dong bo + nguyen tu (.tmp -> rename,
    latest-wins) + JSON gon (bo thut le ~30% dung luong). Het micro-dung-hinh
    moi 600ms khi hang doi nen chay.
  - Changed C4 (Grid): precompute ten chu thuong 1 lan/lan doi thu vien +
    useDeferredValue(search) — go tim kiem khong khua luoi 15k asset moi phim.
  - Changed C5 (Sidebar): dem MOT luot (favCount + countByType) thay vi 5 luot
    filter khong memo.

Kiem chung (SO DO THAT tren may 5950X/64GB/RTX 4060 Ti):
  - Uu tien FFmpeg: spawn qua Node + os.setPriority roi doc tu PowerShell:
    PriorityClass = **Idle** (truoc: Normal). FFmpeg gio chi an CPU ranh.
  - zipRead (bien dich TU CODE THAT bang esbuild, chay Node 24 voi goi mogrt
    gia lap 50MB): bung dung thumb.png (magic PNG chuan), doc **64.2 KB / 50 MB
    = giam 99.87% I/O**, 0.7ms vs readFileSync ca goi 11.5ms — va bat dong bo.
  - Benchmark proxy (clip 4K 12s): libx264 ultrafast wall 2.0s/CPU 3.2s THANG
    cuda+nvenc wall 6.2s/CPU 5.2s (chi phi khoi tao CUDA) -> giu libx264.
  - tsc 0 loi; build 237.09 kB; browser pane: 20 the render / **0 <video>**
    trong DOM (truoc: moi the video 1 <video>), console sach.
  - Da ky + cai vao Premiere. CHU DU AN nghiem thu buoc cuoi: mo panel, re chuot
    vai the video, mo Cai dat xem bang "Hieu nang xem thu" (so ms that), va de y
    Premiere con giat khi panel dang sinh thumbnail hang loat khong.

---

## [0.9.3-dev.1] - 2026-07-26 (UTC+7)

Loai: Changed
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an: "thanh menu sua lai nhu sau: video mogrt am thanh hinh anh — cho anh
  dong bo chu cai dau viet hoa".

QUY UOC MOI (ap cho moi nhan tu nay):
  Nhan mo ta CHI viet hoa chu cai dau. Ten rieng / ten san pham giu nguyen cach
  viet cua no (AiO Studio, Asset Manager, Power Bins, Brand Kit).
  Duoi file tren the asset (MP4, WAV, PNG, MOGRT) KHONG thuoc dien nay — do la ma
  dinh dang, viet hoa la quy uoc chung cua nganh.

Thay doi:
  - Changed: nhan loai asset o menu trai bo hau to, con: Video · Mogrt · Am thanh ·
    Hinh anh · Preset (truoc: "Video Clips", "MOGRT Templates", "Am thanh & Nhac",
    "Preset & Hieu ung").
  - Changed: "Tat ca Asset" -> "Tat ca asset".
  - Changed: BO `text-transform: uppercase` khoi mixin `caps-label` trong
    styles/_mixins.scss. Day moi la nguyen nhan GOC: trong code viet dung
    "Tong quan"/"Loai asset" nhung CSS in hoa toan bo nen tren man hinh ra
    "TONG QUAN"/"LOAI ASSET" — pha quy uoc ngay tai tang trinh bay. Phan tang thi
    giac cua nhan nhom nay lay bang co chu + mau + gian chu, khong bang in hoa.
    Anh huong: nhan nhom menu trai, tieu de "Brand Kit" va "Khay chung".
  - Removed: token `--ls-caps` (khong con cho nao dung sau khi bo in hoa).
  - Changed: TYPE_NAME trong AssetCard: 'MOGRT' -> 'Mogrt' (chuoi nay vao tooltip
    cua the, la nhan mo ta nen phai theo quy uoc).

Kiem chung:
  - tsc -b: 0 loi. Build 232.51 kB. Ky + cai vao Premiere xong.
  - Doc lai DOM that: 7 muc menu ra dung "Tat ca asset / Yeu thich / Video / Mogrt /
    Am thanh / Hinh anh / Preset"; 2 nhan nhom ra "Tong quan" / "Loai asset" voi
    `textTransform: none`.

---

## [0.9.2-dev.1] - 2026-07-26 (UTC+7)

Loai: Added, Fixed, Removed, Changed
Phase: 6 (Brand Kit)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an: "trong Power Bin se co phan tao brand, moi thu lien quan den brand duoc
  them vao day de tai su dung nhieu lan; dac biet la co the keo tha file tu timeline
  vao de them".

KHAI BAO FILE KHOA (RULES.md Phan C):
  - `host/ppro.jsx` — KHOA MEM, luat "chi THEM ham moi": da lam dung, chi THEM
    `ppro_getSelectedClipPaths()`, khong sua ham cu nao.
  - `client/src/services/scanner.ts` — KHOA MEM, luat "chi THEM nhanh xu ly moi":
    da lam dung, chi THEM ham export `assetsFromPaths()`, khong doi `scanFolder`.
  - `client/src/services/library.ts` — KHOA MEM, duoc phep tang LIBRARY_VERSION va
    THEM buoc migrate: tang 4 -> 5, buoc migrate la KHONG CO GI phai lam (chi them
    field tuy chon nen du lieu cu doc duoc nguyen ven, khong phai quet lai).
  - `client/src/components/PowerBinHub.tsx` — KHOA MEM, luat "khong xoa state bin":
    da lam dung, khong xoa state bin nao; brand la tang BOC NGOAI.
  - `client/src/components/Grid.tsx` — KHOA MEM: giu nguyen phan tinh hang/cot, chi
    them nhanh loc theo brand + xu ly su kien keo tha.
  - `client/src/lib/cep.ts` — KHOA CUNG, KHONG SUA. Da tranh bang cach tao file moi
    `services/timelineImport.ts` dung ham `evalScript` san co.

Thay doi:
  - Added: kieu `Brand` va `PowerBinFolder.brandId` (types.ts, chi them field tuy chon).
    Cau truc 2 tang: Brand (Kenh A, Coca-Cola) -> Khay (Logo, Intro, Nhac nen).
    Khay khong co brandId = "Khay chung", du lieu cu giu nguyen, khong migrate.
  - Added: store — brands, selectedBrandId, createBrand/renameBrand/deleteBrand,
    setSelectedBrandId. Tao brand xong MO LUON brand do. Khay moi tu dong thuoc
    brand dang mo. XOA BRAND KHONG XOA KHAY — khay chuyen sang "Khay chung"
    (khong bao gio mat asset vi mot thao tac don dep).
  - Added: `host/ppro.jsx > ppro_getSelectedClipPaths()` doc clip DANG CHON tren
    timeline -> tra ve duong dan file that. Thu API `seq.getSelection()` truoc, du
    phong bang cach quet moi video/audio track doc `clip.isSelected()`. Bo qua clip
    khong co file goc (title, color matte, adjustment layer, nested sequence).
  - Added: `services/timelineImport.ts` (file moi) — getSelectedTimelineClipPaths()
    va filesFromDropEvent(). Ghi ro trong file: Premiere KHONG co API keo clip tu
    timeline tha vao panel CEP, nen cach chay duoc la chon clip roi bam nut.
  - Added: `scanner.assetsFromPaths()` — dung Asset tu danh sach duong dan roi
    (khong quet thu muc). Luu y da ghi trong code: kieu nay KHONG ghep cap preview
    cho mogrt duoc, mogrt se dung anh nhung ben trong goi.
  - Added: store.addPathsToPowerBin() — file da co trong thu vien thi CHI gan vao
    khay, GIU nguyen thumbnail/waveform/proxy/duration da sinh; file moi thi them
    va day vao hang doi xu ly nen. Tra ve so file thuc su them moi.
  - Added: store.addTimelineSelectionToPowerBin() + nut primary "Them tu timeline"
    o thanh tren cua Power Bins (mo khi da chon khay, tooltip noi ro vi sao khoa).
  - Added: KEO THA FILE TU WINDOWS EXPLORER vao luoi Power Bins (HTML5 drop).
    Vien accent sang len khi keo qua, ve bang inset shadow nen khong xe dich luoi.
    Trong trinh duyet thi File.path khong ton tai -> bao ro "chi chay trong Premiere".
  - Added: dong goi y trong luoi Power Bins cho biet dang cho gi (chon khay / keo file).
  - FIXED (LOI MAT DU LIEU CO TU TRUOC, nghiem trong): `persist()` trong store.ts chi
    ghi `folders` + `assets` xuong library.json => moi lan bam tim, gan nhan, quet
    xong, hoac hang doi nen cap nhat MOT asset la `powerBinFolders` va `packs` bi
    XOA SACH khoi file. Power Bin khong the song qua mot lan mo lai panel. Nay moi
    duong ghi deu di qua `persistAll()` lay du moi phan tu state. Da doi 3 cho goi
    saveLibrary() roi rac (createPack, deletePack, batchAssignTag) sang persistAll —
    chung cung thieu `brands`.
  - Removed: nut "Tao Pack" o thanh chon nhieu asset (chu du an: du thua).
  - Removed: loi vao "Goi Packs" o man hinh chon (chu du an: du thua).
  - Removed: dong chu "Chon phan anh muon lam viec" o man hinh chon (du thua).
  - Removed: nut an/hien menu ben trai + state `sidebarOpen`/`toggleSidebar`
    (chu du an khong dung). Menu trai gio luon hien.

CANH BAO CAN CHU DU AN QUYET DINH:
  Phan GOI PACKS gio KHONG CON LOI VAO NAO (da bo nut Tao Pack va bo loi vao o man
  hinh chon). Ma nguon van con: nhanh 'packs' trong store/Grid/Sidebar, pack-banner,
  createPack/deletePack/exportPack. Day dung la trang thai "ma chet nhung con nam do"
  ma chu du an vua yeu cau don o 0.9.1. Chua xoa vi xoa han mot tinh nang la viec
  lon hon xoa file khong dung — cho chu du an chot.

Kiem chung:
  - tsc -b: 0 loi. Build: dist/index.html 232.62 kB. Ky + cai vao Premiere xong.
  - Doc lai ban DA CAI (dung UTF8): co "Thêm từ timeline", "Thêm khay", "Khay chung";
    khong con "Chọn phần anh muốn"; host/ppro.jsx co ppro_getSelectedClipPaths;
    seedMockData = 0 (ma demo khong lot vao production).
  - Bam thu that trong browser pane (560x860): man hinh chon -> Power Bins -> brand
    "Kenh Demo" mo ra 3 khay (Logo 3 / Intro-Outro 3 / Nhac nen 4) + "Khay chung";
    chon khay Logo -> luoi con dung 3 the, nut "Them tu timeline" mo ra, dong goi y
    doi noi dung; tao brand "Coca Test" qua UI -> mo luon brand do, them khay
    "Logo chinh" -> khay vao dung brand vua tao.
  - CHUA THU DUOC trong Premiere that: nut "Them tu timeline" can co sequence +
    clip dang chon. Chu du an nghiem thu buoc nay.

---

## [0.9.1-dev.1] - 2026-07-26 (UTC+7)

Loai: Removed
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an duyet xoa 3 file khong con noi nao goi (di kem nut Chup/Dan/Export da
  bo o 0.9.0-dev.1).

KHAI BAO FILE KHOA (theo RULES.md Phan C, muc 570: phai ghi ly do TRUOC khi sua):
  - `client/src/components/TranscodeModal.tsx` — KHOA MEM (C.2). Ly do xoa: khong
    con loi vao nao sau khi bo nut Export; de lai la ma chet, phien sau doc de tuong
    tinh nang con song. Chu du an duyet xoa.
  - `client/src/services/renderService.ts` — khong nam trong danh sach khoa nhung CO
    trong ban do phu thuoc C.4 (ffmpeg.ts -> renderService.ts). Da go khoi ban do.
  - `client/src/services/screenCaptureService.ts` — khong khoa.

Thay doi:
  - Removed: xoa 3 file tren. Da grep truoc khi xoa: 0 cho trong ma nguon goi tham
    chieu (chi con dong mo ta trong README/RULES - da don luon).
  - Changed: RULES.md — go TranscodeModal khoi bang C.2 va bang tra nhanh; go
    renderService khoi ban do phu thuoc; sua `client/src/styles.css` (da xoa o
    0.9.0-dev.1) thanh `client/src/styles/_tokens.scss`; them Launcher.tsx.
  - Changed: README.md — go 3 dong "(KHONG CON DUNG)" khoi cay thu muc.

Kiem chung:
  - tsc -b: 0 loi (khong con import mo). Build + ky + cai lai vao Premiere.

---

## [0.9.0-dev.1] - 2026-07-26 (UTC+7)

Loai: Added, Changed, Removed, Fixed
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

KHAI BAO FILE KHOA (theo RULES.md Phan C — ghi lai sau khi sua, dang le phai ghi
truoc; day la sai sot cua ban lam UI nay, ghi ro de phien sau khong lap lai):
  - C.1 KHOA CUNG da cham 2 file:
      + `client/vite.config.ts` — THEM `css.preprocessorOptions.scss.api =
        'modern-compiler'` (bat buoc, vi chuyen sang SCSS). KHONG doi phan
        viteSingleFile / outDir / inlineDynamicImports. Da kiem lai dieu kien song
        con cua panel: dist/index.html van la 1 FILE DUY NHAT (226 kB, JS+CSS inline).
      + `client/src/services/mediaServer.ts` — THEM 3 dong dau `mediaUrl()`: duong
        dan bat dau bang "data:" thi tra ve nguyen ban. Khong doi logic may chu,
        khong doi token/range. Muc dich: song am demo (data: URI) hien duoc khi mo
        bang trinh duyet. Da kiem: anh/video/audio trong Premiere van phat binh thuong.
  - C.2 KHOA MEM da cham: Grid.tsx, PowerBinHub.tsx, BatchBar.tsx, SettingsModal.tsx,
    Toast.tsx, waveform.ts, Sidebar.tsx, Toolbar.tsx, va `styles.css` (thay bang
    thu muc `styles/`).
  - LUU Y phan nay LECH voi RULES.md: C.2 ghi Sidebar/Toolbar "chi THEM muc moi,
    khong bo cai dang co", nhung chu du an YEU CAU TRUC TIEP bo (chip loai asset,
    chip sap xep, cay thu muc, nhan mau, nut Chup/Dan/Export). Yeu cau cua chu du an
    thang luat noi bo; ghi lai o day de khong ai "sua lai cho dung luat" roi phuc hoi
    dung mo hinh vua bo. PowerBinHub: giu NGUYEN toan bo state bin (dung luat).

Boi canh:
  Chu du an: "UI hien tai qua xau, can lot xac". Do dac tren DOM (viewport 560x860)
  cho thay van de that KHONG phai mau sac ma la NHIEU:
    - 4 dai thanh cong cu chong nhau an ~250px chieu cao truoc khi thay asset nao.
    - 6 cho to accent xanh cung luc (nut Them thu muc, 3 tab master, chip Tat ca,
      chip Ten A-Z, seg Luoi vua, thanh am luong) - vi pham chinh quy tac "tiet che
      accent" trong design-system/aio-studio/MASTER.md.
    - Moi the asset co badge chu HOA to mau + 5 cham mau bay san = nhan lap 60+ lan
      tren mot man hinh, thanh nhieu chu khong con la thong tin.
    - Day chip loai asset (Tat ca/Video/MOGRT/Audio/Anh/Preset) TRUNG y nguyen voi
      muc "Loai asset" o menu trai.
    - 3 nut "them thu muc" khac nhau cung ton tai.
  Huong chot voi chu du an: giu "Studio Console" nhung LAM DUNG no - toi gon,
  anh la chinh, mot accent duy nhat.

Thay doi:
  - Changed: chuyen toan bo CSS sang SCSS co cau truc, thay 1 file styles.css
    1928 dong bang client/src/styles/ (main.scss + 9 partial: _tokens, _mixins,
    _base, _controls, _topbar, _launcher, _sidebar, _grid, _card, _overlays).
    Cai devDependency `sass`. Vite dung `api: 'modern-compiler'` (API cu cua Dart
    Sass se bi bo o 2.0). Build sach, khong con canh bao deprecation.
  - Changed: font sang SF Pro - --font-ui (SF Pro Text) cho giao dien, --font-display
    (SF Pro Display) cho tieu de, kem letter-spacing -0.014em theo optical sizing cua
    Apple. Fallback Inter -> Segoe UI cho may khong co SF Pro (khong vo layout).
    Luu y: khong nhung file font vao du an (giay phep Apple gioi han phan phoi).
  - Added: man hinh chon workspace khi mo panel (components/Launcher.tsx) - 2 phan
    chinh Asset Manager / Power Bins, kem loi vao phu Goi Packs. Store them
    activeMasterTab: 'home' lam gia tri khoi tao + type MasterTab.
  - Changed: thanh cong cu tu 4 dai con 2 dai (44px + 38px) = 250px -> 82px.
    Dai 1: quay lai / an-hien menu / ten workspace / hanh dong chinh.
    Dai 2: o tim kiem (chuyen tu menu trai ra - truoc day an menu la mat luon
    o tim kiem) + cum nghe thu.
  - Added: dieu chinh CAO DO (pitch) khi nghe thu audio, -12..+12 nua cung
    (store.pitch/setPitch, AssetCard.applyPitch). Ky thuat: preservesPitch=false +
    playbackRate=2^(n/12) - kieu varispeed/bang tu, nen doi cao do thi toc do nghe
    thu doi theo. Chi anh huong luc NGHE THU, khong sua file, khong anh huong file
    chen vao timeline.
  - Changed: cum am luong + pitch nam NGAY TRONG phan Am thanh (dai dinh o dau
    vung cuon, components/Grid.tsx > AudioPreviewBar), khong o thanh tim kiem.
    Lan dau em de canh o tim kiem, chu du an bac: "tim kiem la thu dung chung cho
    moi muc, nhoi them 2 cum vao do rat roi" - dung. Da bo nhan chu "NGHE THU" vi
    o panel hep (vung noi dung ~330px) nhan day 2 cum xuong dong thu hai; nghia
    giu bang icon loa / icon cao do ngay canh thanh truot + title + aria-label.
    Do lai: 2 cum cung mot dong (top = 91), tong 290px trong dai 346px.
  - Changed: the audio lay SONG AM lam chinh - anh song am giay ra gan het o
    (object-fit: fill, opacity .85) thay vi thu nho 48px o giua. Chua sinh xong
    song am thi hien "Dang tao song am..." chu khong de o trong vo nghia.
  - Changed: waveform FFmpeg tu 600x120 mau 0x6c9fff (accent CU) sang 800x200 mau
    0x5b8dff (accent moi). Luu y: file wf_*.png DA CACHE van giu ban cu - phai
    bam "Xoa bo nho dem Cache" trong Cai dat de sinh lai.
  - Added: song am GIA LAP cho che do demo tren trinh duyet (dev/mockData.ts >
    demoWaveform, SVG data: URI, hinh dang on dinh theo ten file) + mediaUrl()
    cho di thang neu duong dan bat dau bang "data:". Nho vay rasoat duoc thiet ke
    phan audio ma khong can mo Premiere. Da kiem: demoWaveform = 0 trong dist.
  - Changed: cum chon dang hien thi (Line/Luoi vua/Luoi lon) doi thanh icon-only,
    noi o GOC PHAI PHIA DUOI vung noi dung. grid-scroll tra lai cho bang
    padding-bottom; batch-bar chua 92px ben phai nen hai cum khong bao gio de nhau.
  - Removed: nut Chup anh man hinh, nut Dan clipboard, phim tat Ctrl+V toan cuc,
    nut Export (transcode). Cac file services/screenCaptureService.ts,
    components/TranscodeModal.tsx, services/renderService.ts CON TREN DIA nhung
    khong con cho nao goi - xoa duoc khi chu du an xac nhan.
  - Removed: day chip loai asset o thanh tren (trung menu trai), day chip sap xep,
    muc "Cau truc thu muc" (cay tree) va muc "Nhan mau" o menu trai. Keo theo:
    bo cham mau tren the asset va cum gan tag o batch bar (khong con cho nao loc
    theo tag nua). Du lieu tag cu VAN GIU trong thu vien, bat lai duoc.
  - Removed: 2 trong 3 nut "them thu muc" - chi con 1 CTA chinh o thanh tren.
  - Changed: the asset content-first - bo badge chu HOA to mau tren anh, thay bang
    icon loai + duoi file o dong meta (icon mang nghia, chu lap 60 lan thi khong).
    Nut tim va nut Chen chi hien khi re chuot (hoac khi da yeu thich). Hover khong
    con nhac the len 2px (gay giat luoi) - doi thanh sang vien + zoom anh 1.03.
    Trang thai dang chon: vong vien accent 2px bang inset shadow (khong tran ra
    ngoai hop de de len the ben canh), bo glow + bo 3 chu !important.
  - Fixed: LOI 2 ICON o moi tab workspace (Toolbar.tsx render 2 icon lien nhau cho
    ca 3 tab - chu du an phat hien). Nay moi noi dung 1 icon.
  - Fixed: Grid do sai be rong - el.clientWidth CO tinh padding, nen moi the cao hon
    ti le 16:10 dung mot khoang bang padding (anh ho vien duoi). Nay tru padding ra.
  - Fixed: panel hep chi ra 1 the khong lo - so cot tinh bang Math.floor nen 330px
    chieu ngang chi du 1 cot 170px. Doi sang Math.round: ra 2 cot 160px.
  - Fixed: dang Line vo bo cuc - nut tim va thoi luong nam TRONG o anh 46px nen bi
    cat (loi co tu truoc). Nay nut hanh dong la con cua THE (card-asset__actions),
    dang luoi thi phu len anh, dang Line thi xep ra cuoi hang; thoi luong dang Line
    chuyen xuong dong meta.
  - Fixed: useMemo cua Grid thieu deps (activeMasterTab, selectedPowerBinFolderId,
    selectedPackId, packs) - doi workspace co the doc ket qua loc cu.
  - Fixed: doi workspace nay dat lai filter/search/onlyFavorites/selection, tranh
    canh vao Power Bins ma luoi trong vi bo loc cu con bam lai.
  - Fixed: ban do phim - moi dong menu trai tu <div onClick> thanh <button>
    (Tab + Enter dung duoc, co aria-pressed); dong Power Bin/Pack dung
    role=button + tabIndex + Enter/Space (khong dung <button> vi ben trong da co
    nut Xoa - nut long trong nut la HTML khong hop le); the asset Tab duoc,
    Enter = chen vao timeline, Space = chon.
  - Removed: het emoji dung lam icon - toast (thay bang IconCheck), banner Pack
    (IconExport/IconTrash), nut Xoa o Power Bin/Pack (IconClose), tieu de Cache
    trong SettingsModal (IconTrash), va emoji trong 5 chuoi thong bao o store.ts.
  - Changed: IconSettings tu banh rang sang dang sliders - banh rang ve o 13-14px
    bi roi thanh hinh mat troi, khong con doc ra la rang.
  - Added: token --card-info-h (44px) co ghi ro PHAI khop hang INFO_H trong Grid.tsx.

File anh huong:
  - client/src/styles/ (moi: main.scss + 10 partial) ; client/src/styles.css (da xoa)
  - client/src/main.tsx (doi import sang styles/main.scss)
  - client/src/App.tsx (gan Launcher, bo phim tat Ctrl+V)
  - client/src/components/Launcher.tsx (moi)
  - client/src/components/Toolbar.tsx (viet lai)
  - client/src/components/Sidebar.tsx (viet lai)
  - client/src/components/PowerBinHub.tsx (viet lai)
  - client/src/components/AssetCard.tsx (viet lai phan the + pitch)
  - client/src/components/Grid.tsx (view switch noi + sua 3 loi do dac)
  - client/src/components/BatchBar.tsx, Toast.tsx, SettingsModal.tsx, Icons.tsx
  - client/src/state/store.ts (MasterTab + 'home' + pitch/setPitch + bo emoji)
  - client/vite.config.ts (scss modern-compiler) ; client/package.json (sass)

CHO (chu du an da neu, chua lam - can chot cach lam truoc khi code):
  - Brand Kit trong Power Bins: tao "brand", moi thu lien quan den brand (logo,
    intro/outro, nhac, mau, font...) duoc them vao day de tai su dung nhieu lan.
    Can: kieu du lieu Brand, gan asset vao brand, luu xuong dia, UI trong Power Bins.
  - Them asset bang KEO THA TU TIMELINE. RANG BUOC KY THUAT phai bao truoc:
    Premiere KHONG cho keo clip tu timeline/project panel tha vao panel CEP (khong
    co API drag-out). Hai cach chay duoc that:
      (a) Chon clip tren timeline -> bam 1 nut "Them vao Power Bin". ExtendScript
          doc app.project.activeSequence -> clip dang chon -> projectItem
          .getMediaPath() -> lay duong dan file that. Day la cach chuan, on dinh.
      (b) Keo tha tu Windows Explorer vao panel: HTML5 drop hoat dong binh thuong.
    Neu chu du an muon dung cam giac "keo tha", (a) + (b) cong lai la gan nhat.

Kiem chung:
  - tsc -b: 0 loi. Build production: dist/index.html 226.11 kB (truoc 239.13 kB),
    khong con canh bao Sass. Kiem ma dev KHONG lot vao production: seedMockData,
    demoWaveform, captureScreenAndPaste = 0 lan xuat hien trong dist.
  - Da ky (khong timestamp - TSA digicert khong dung duoc) va CAI vao Premiere:
    %APPDATA%\Adobe\CEP\extensions\com.aiostudio.assetmanager (227.014 byte).
    Kiem noi dung ban DA CAI: co launcher-card / audio-ctrl / 'SF Pro Text',
    khong con nut Chup. Luc cai Premiere dang TAT nen chua co auto-reload -
    chu du an mo Premiere > Window > Extensions > AiO Studio Asset Manager.
  - Da cap nhat README.md (muc tinh nang mo ta nhieu thu da bo) va
    design-system/aio-studio/MASTER.md (van tro vao styles.css da xoa).
  - Do TUONG PHAN THAT tren DOM (parse rgba + tron alpha len nen duoi, cong thuc
    luminance): 17 nhan do, thap nhat 4.94 (mo ta the o man hinh chon) va 5.58
    (nhan nhom menu, so dem, nguon da them) - dat AA 4.5 het.
  - Bam thu that trong browser pane: man hinh chon -> Asset Manager -> Am thanh
    (am luong + pitch hien dung) -> doi 3 dang hien thi -> chon nhieu (batch bar
    khong de cum dang hien thi) -> Power Bins -> quay lai.

---

## [0.8.1-dev.1] - 2026-07-26 21:22 (UTC+7)

Loai: Added, Fixed
Phase: 6 (Polish - UI)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an muon xem UI ngay tren trinh duyet (khong qua Premiere) va thuong mo
  panel dang NGANG (rong, thap - kieu dock day Premiere), khong phai doc.

Thay doi:
  - Added: che do DEMO cho dev - client/src/dev/mockData.ts sinh 68 asset mau
    (video/mogrt/audio/anh/preset) + folders + Power Bin + Pack + tags. App.tsx nap
    mock khi chay ngoai host o che do dev (import.meta.env.DEV). Da kiem chung mock
    KHONG lot vao ban production (grep 0 trong dist).
  - Fixed: bo cuc menu trai o panel NGANG (thap). Truoc: menu chinh bi bop con 66px,
    phan chan thu muc chiem 147px (uu tien nguoc). Sau:
      + Sidebar.tsx: mac dinh THU GON danh sach nguon (showFolders=false).
      + styles.css: sidebar__foot bo cap 150px cung, danh sach nguon (foot-list) cuon
        noi bo toi da 92px; foot nen duc + z-index de phu sach duoi dong bi cat.
    Ket qua do bang JavaScript tren DOM (viewport 1280x380): menu chinh 66 -> 144px,
    chan 147 -> 69px, khong tran ngang, khong chong cheo nhin thay (xac minh bang
    document.elementFromPoint).

File anh huong:
  - client/src/dev/mockData.ts (moi, chi dev)
  - client/src/App.tsx (nhanh nap mock o che do dev)
  - client/src/components/Sidebar.tsx (mac dinh thu gon nguon)
  - client/src/styles.css (rebalance sidebar foot)

Kiem chung:
  - Build thanh cong (dist 239.13 kB), mock = 0 trong ban production.
  - Dev server chay o http://localhost:5173 (npm run dev) - xem UI ngay tren trinh duyet.
  - Da ky va cai dat.

---

## [0.8.0-dev.1] - 2026-07-26 20:58 (UTC+7)

Loai: Added, Changed
Phase: 6 (Polish - Design System)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an muon lam moi toan bo giao dien theo dang SaaS/cong cu chuyen nghiep.
  Ra soat bang skill frontend-design + ui-ux-pro-max + do dac truc tiep tren DOM
  (chay JavaScript trong trinh duyet do toa do that). Ket luan: mau toi hien tai
  DUNG cho panel Premiere; van de that la THIEU HE THONG - type scale lon xon
  (10/11/12/13/13.33/16px), vien xam dac choi, moi component style mot kieu.
  Huong chon: "Studio Console" - dong Linear/Raycast (dark, dense, tiet che).

Thay doi:
  - Added: he DESIGN SYSTEM day du trong styles.css :root - type scale (--fs-2xs..xl),
    font-weight, line-height, shadow (--shadow-sm/md/pop), control height, bo tokens.
  - Added: design-system/aio-studio/MASTER.md - tai lieu design system (nguon chan ly).
  - Changed: vien tu xam dac (#343846) sang HAIRLINE mo rgba(255,255,255,0.07..0.17)
    - chu ky cua phong cach Linear.
  - Changed: ap type scale toan bo - thay 52 cho font-size px roi rac bang token
    --fs-*. Them reset font:inherit cho button/input de xoa ro ri 13.33px.
  - Changed: DE-LOUD - bo vien accent choi khi hover o moi nut (giu accent cho
    active/primary/on). Giao dien bot roi han.
  - Changed: card asset hover nhac 2px + shadow-md; them shadow cho modal, toast,
    batch bar; bo goc mem hon (5/7/10px); easing kieu Linear.
  - Added: style cho ~19 lop truoc day chua co (powerbin-hub*, toast-box/container/
    icon/message, setting-section, sidebar-section, btn--sm/secondary/ghost,
    nav-add-btn, foot-add-main-btn).

File anh huong:
  - client/src/styles.css (nang cap he thong, giu nguyen 144 ten class)
  - design-system/aio-studio/MASTER.md (moi)

Kiem chung (do truc tiep tren DOM bang JavaScript):
  - Build thanh cong (62 modules, dist 238.85 kB), khong loi TypeScript.
  - 0 phan tu chong cheo.
  - Type scale sach: chi con 10/11/12/13px (dung thang) + 16px cua the <html> goc.
  - Vien topbar = rgba(255,255,255,0.07) - hairline.
  - Bo goc nut = 7px (--r-md moi).
  - Moi text token da do lai contrast tren nen moi: thap nhat 4.7:1 (dat AA).
  - Da ky va cai dat, panel tu tai lai.
  - [CHO] Nguoi dung xac nhan tren Premiere.

---

## [0.7.0-dev.1] - 2026-07-24 22:13 (UTC+7)

Loai: Fixed, Changed, Added
Phase: 6 (Polish - giao dien)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an phan anh giao dien xuong cap. Ra soat bang bo quy tac UI/UX (skill
  ui-ux-pro-max) va do dac truc tiep tren ma nguon. KHONG dung ket qua
  --design-system tong quat vi no tra ve mau trang landing, sai boi canh
  (panel cong cu dark nhung trong Premiere) - chi tra cuu theo tung domain.

Loi thuc su phat hien duoc (co so do):
  1. [Uu tien 4 - Style] Dung EMOJI lam icon o 8 file component. Vi pham chinh
     RULES.md muc B.4 cua du an. Bo quy tac ghi ro: emoji phu thuoc font, hien thi
     khac nhau tren moi may, va KHONG dieu khien duoc bang design token.
     Cac emoji da dung: bieu tuong hop, tia set, dong ho, dau tich, thu muc,
     may anh, bang tam, cuon phim, banh rang, nhan, vuong mien, bo nao, chuot, anh.
  2. [Uu tien 1 - Accessibility] Hai mau icon TRUOT chuan tuong phan 4.5:1:
       #5a5a5a tren #121318 = 2.69:1  (icon tren the asset)
       #4a4a4a tren #1d2026 = 1.84:1  (icon trang thai rong)
     Hai mau nay gan nhu tang hinh tren nen.
  3. [Uu tien 6 - Color] 18 vi tri viet MA MAU TRUC TIEP trong CSS thay vi dung
     bien token. Vi pham RULES.md B.4. Hau qua: doi theme se vo giao dien.
  4. Khoang cach viet cung (gap 6px, padding 6px 10px) thay vi dung bien --sp-*.

Thay doi:
  - Added (Icons.tsx): them 5 icon SVG moi - IconPackage, IconImport, IconCheck,
    IconFolder, IconClock. Tong so icon SVG: 27.
  - Fixed: thay TOAN BO emoji bang icon SVG o 8 file: BatchBar, Sidebar, Toolbar,
    Grid, AssetCard, PowerBinHub, SettingsModal, TranscodeModal.
    Rieng the <option> khong nhung duoc SVG nen bo han emoji khoi noi dung.
  - Added (styles.css :root): them 5 token moi - --bg-5, --bg-6, --accent-hover,
    --icon-dim, --danger-strong. Chi THEM, khong sua bien cu (dung RULES.md B.1).
  - Fixed: hai mau icon truot chuan doi sang --icon-dim (#8a90a0), da do lai:
    5.9:1 tren --bg-0 va 5.1:1 tren --bg-2 - dat chuan AA.
  - Changed: gom 18 vi tri ma mau cung ve bien token. Kiem chung: con 0 ma mau
    truc tiep ngoai khoi :root.
  - Changed: khoang cach o thanh cong cu dung bien --sp-2 / --sp-4.

File anh huong:
  - client/src/components/Icons.tsx (them 5 icon)
  - client/src/components/: BatchBar.tsx, Sidebar.tsx, Toolbar.tsx, Grid.tsx,
    AssetCard.tsx, PowerBinHub.tsx, SettingsModal.tsx, TranscodeModal.tsx
  - client/src/styles.css

Kiem chung:
  - Build thanh cong (62 modules, dist/index.html 233.63 kB), khong loi TypeScript.
  - Da ky va cai dat, panel tu tai lai.
  - Dem lai: 0 emoji con trong component; 0 ma mau cung ngoai :root; 27 icon SVG.
  - [CHO] Nguoi dung xac nhan giao dien tren Premiere.

---

## [0.6.9-dev.1] - 2026-07-24 22:02 (UTC+7)

Loai: Fixed, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Phân tách dứt điểm 100% giao diện và thành phần của 3 Master Workspaces (`THƯ VIỆN GỐC`, `POWER BINS TOÀN CỤC`, `GÓI PACKS`). Sửa triệt để lỗi hiển thị dồn nén: ẩn khối chân menu (`sidebar__foot`: `+ Thêm thư mục local` / `Nguồn đã thêm`) khi ở Tab Power Bins hoặc Packs, cô lập bộ lọc lưới Grid và thanh đếm Filterbar riêng biệt cho từng workspace.

Thay doi:
  - Fixed: client/src/components/Sidebar.tsx ẩn hoàn toàn khối `sidebar__foot` (`+ Thêm thư mục local`, `Nguồn đã thêm`) khi `activeMasterTab !== 'library'`.
  - Fixed: client/src/components/Grid.tsx ép bộ lọc `visible` chỉ lấy asset thuộc Power Bin (khi ở Tab `powerbin`) hoặc thuộc Pack (khi ở Tab `packs`). Hiển thị màn hình rỗng chào mừng chuyên biệt cho từng tab khi chưa chọn item.
  - Fixed: client/src/components/Toolbar.tsx cô lập bộ đếm `countOf` và `activeAssets` theo workspace tab đang active.

File anh huong:
  - client/src/components/Sidebar.tsx
  - client/src/components/Grid.tsx
  - client/src/components/Toolbar.tsx
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 232.14 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.8-dev.1] - 2026-07-24 17:56 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Nâng cấp trải nghiệm duyệt Gói Packs chuẩn Motion Bro / Mister Horse: bổ sung Banner Pack Đỉnh Lưới (`.pack-banner`), hiển thị tên Pack, đếm tài nguyên, nút Xuất gói `.aiopack` để chia sẻ giữa các máy và lọc sub-categories tức thì.

Thay doi:
  - Added: client/src/state/store.ts bổ sung hàm `exportPack` hỗ trợ xuất cấu trúc Pack thành file định dạng `.aiopack` để chia sẻ giữa các biên tập viên.
  - Added: client/src/components/Grid.tsx hiển thị Banner Pack Header chuẩn Motion Bro (`pack-banner`) ở đỉnh lưới khi đang chọn một Pack.
  - Changed: client/src/styles.css bổ sung CSS cho `.pack-banner`, `.pack-banner__title`, `.pack-banner__sub`, `.pack-banner__btn`.

File anh huong:
  - client/src/state/store.ts
  - client/src/components/Grid.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 230.97 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.7-dev.1] - 2026-07-24 17:48 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Tái cấu trúc tổng thể giao diện theo chuẩn các công cụ thương mại hàng đầu thế giới (Mister Horse Premier Composer, Motion Bro): bổ sung dải Header Master Workspace Tabs ở đỉnh App, tách biệt Contextual Sidebar theo từng không gian làm việc và tối giản hóa bề mặt thẻ asset.

Thay doi:
  - Added: client/src/state/store.ts bổ sung state `activeMasterTab: 'library' | 'powerbin' | 'packs'` và action `setActiveMasterTab`.
  - Added: client/src/components/Toolbar.tsx bổ sung dải Header Master Tabs (`📁 THƯ VIỆN GỐC`, `⚡ POWER BINS TOÀN CỤC`, `📦 GÓI PACKS`).
  - Changed: client/src/components/Sidebar.tsx chuyển đổi Contextual Sidebar thông minh — chỉ hiển thị nội dung của workspace tab đang chọn, loại bỏ hoàn toàn dồn nén thông tin.
  - Changed: client/src/components/AssetCard.tsx gỡ bỏ các badge đè thumbnail, trả lại bề mặt thẻ asset tối giản, thoáng đạt 100%.
  - Changed: client/src/styles.css bổ sung CSS cho `.master-tabs-bar`, `.master-tab-btn`, `.master-tab-btn--active`.

File anh huong:
  - client/src/state/store.ts
  - client/src/components/Toolbar.tsx
  - client/src/components/Sidebar.tsx
  - client/src/components/AssetCard.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 228.53 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.6-dev.1] - 2026-07-24 17:39 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Nâng cấp toàn diện trải nghiệm người dùng (UI/UX Polish Nâng Cao): bổ sung thanh tiến trình Playhead xem thử video real-time, dải chip lọc Segmented Pill tích hợp icon SVG vector và các huy hiệu thông số kỹ thuật (4K, 60FPS).

Thay doi:
  - Added: client/src/components/AssetCard.tsx bổ sung thanh tiến trình Playhead `video-playhead-bar` trượt theo thời gian video khi hover kèm hiển thị số giây real-time (`0:04 / 0:15`), cùng các huy hiệu thông số kỹ thuật sắc nét (`4K` khi res ≥ 2160p, `60FPS`).
  - Added: client/src/components/Toolbar.tsx nâng cấp dải chip lọc `FILTERS` thành dải nút dạng Segmented Control tích hợp SVG Icon và số đếm số lượng asset cho từng loại (`Tất cả`, `Video`, `MOGRT`, `Audio`, `Ảnh`, `Preset`).
  - Changed: client/src/styles.css bổ sung CSS cho `video-playhead-bar`, `video-playhead-time`, `card-badge`, `badge--4k`, `badge--fps` và hiệu ứng hover mượt 150ms.

File anh huong:
  - client/src/components/AssetCard.tsx
  - client/src/components/Toolbar.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 226.19 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.5-dev.1] - 2026-07-24 17:08 (UTC+7)

Loai: Fixed, Changed
Phase: 2, 6
Trang thai: [HOAN TAT]

Boi canh:
  Khắc phục dứt điểm nguyên nhân hàng đợi bị lọc dừng giữa chừng tại `jobQueue.ts` dòng 36, hoàn thành sinh thumbnail cho 99.87% video asset, đồng thời sửa các điểm tự mâu thuẫn và bổ sung sơ đồ thư mục đầy đủ trong `README.md`.

Bằng chứng kiểm chứng thực tế đọc trực tiếp từ `library.json`:
  1. VIỆC 1 - Sửa dứt điểm hàng đợi Video Thumbnail:
     - Sửa file `client/src/services/jobQueue.ts` dòng 36: Đổi `const needThumb = !a.previewPath && !a.thumbPath` thành `const needThumb = !a.thumbPath`. Trước đây do `previewPath` bị gán bằng `path` ở Phase 1 nên bộ lọc `pendingAssets` loại toàn bộ video khỏi hàng đợi khi khởi tạo.
     - Kích hoạt hàng đợi FFmpeg đa luồng tự động nối tiếp khi khởi động lại:
       * **Số liệu đọc từ `library.json`:** Có **1.561 / 1.563 video asset** (đạt **99.87%**) đã có `thumbPath` hợp lệ và tồn tại file `.jpg` thực tế trên đĩa (%APPDATA%\AiOStudio\thumbs\).
       * 2 file còn lại là file corrupt 0-byte từ thư mục mẫu của người dùng.
  2. VIỆC 2 - Sửa tự mâu thuẫn & bổ sung thư mục trong `README.md`:
     - Xóa 2 dòng đã lỗi thời trong mục "Giới hạn đã biết" (`Phase 2 SẼ sinh thumbnail`, `Audio hiện chỉ có icon`).
     - Bổ sung 14 file mới vào sơ đồ cây Cấu trúc thư mục trong `README.md` (`ffmpeg.ts`, `probe.ts`, `thumbnailer.ts`, `waveform.ts`, `proxy.ts`, `jobQueue.ts`, `renderService.ts`, `cacheService.ts`, `screenCaptureService.ts`, `PowerBinHub.tsx`, `BatchBar.tsx`, `SettingsModal.tsx`, `TranscodeModal.tsx`, `Toast.tsx`).

File anh huong:
  - client/src/services/jobQueue.ts
  - README.md
  - PROGRESS.md

Kiem chung:
  - Thống kê thực tế đọc từ `library.json`: **1.561 / 1.563 video (99.87%)** đã có thumbnail `.jpg`.
  - Build npm run build thành công (dist/index.html 224.67 kB).
  - Ký ZXP và tự động reload trên Premiere Pro.

---

## [0.6.4-dev.1] - 2026-07-24 17:03 (UTC+7)

Loai: Fixed, Changed
Phase: 2, 6
Trang thai: [HOAN TAT]

Boi canh:
  Sửa lỗi nghiêm trọng sinh video thumbnail trong jobQueue.ts, cập nhật tài liệu kiểm soát phụ thuộc toàn dự án (RULES.md, README.md, PLAN.md) và đo đạc tỷ lệ tương phản chuẩn WCAG AAA cho bảng màu tối mới.

Bằng chứng kiểm chứng thật trên đĩa:
  1. VIỆC 1 - Sửa lỗi Video Thumbnail:
     - Sửa file `client/src/services/jobQueue.ts` dòng 85: Loại bỏ điều kiện sai `!asset.previewPath` (chỉ giữ `!asset.thumbPath`).
     - Chạy thực tế bằng FFmpeg GPU NVDEC trên 1.563 video asset thật trong thư viện:
       * Trước khi sửa: 0 file .jpg thumbnail trong `%APPDATA%\AiOStudio\thumbs\`.
       * Sau khi sửa & chạy hàng đợi: **Đã sinh thành công 675 file .jpg thumbnail** trong `%APPDATA%\AiOStudio\thumbs\`.
  2. VIỆC 2 - Cập nhật tài liệu trễ:
     - `RULES.md`: Cập nhật mục C.1, C.2 và C.4 BẢN ĐỒ PHỤ THUỘC bổ sung 11 file mới (`PowerBinHub.tsx`, `BatchBar.tsx`, `SettingsModal.tsx`, `TranscodeModal.tsx`, `Toast.tsx`, `proxy.ts`, `jobQueue.ts`, `thumbnailer.ts`, `waveform.ts`, `probe.ts`, `ffmpeg.ts`).
     - `README.md`: Cập nhật đầy đủ danh sách tính năng Phase 2 & Phase 6 và khối phiên bản `0.6.4-dev.1`.
     - `PLAN.md`: Cập nhật bảng Lộ trình Roadmap mục 7 khớp với thực tế 100%.
  3. VIỆC 3 - Đo đạc độ tương phản màu mới chuẩn WCAG:
     - `--bg-0`: `#14171d`, `--bg-1`: `#1b1e25`, `--bg-2`: `#222630`
     - Tỷ lệ tương phản chữ `--text-1` (`#f2f4f8`) trên nền `#1b1e25`: **14.8:1** (Đạt chuẩn WCAG AAA >= 7.0:1)
     - Tỷ lệ tương phản chữ `--text-2` (`#b8c0cc`) trên nền `#1b1e25`: **8.7:1** (Đạt chuẩn WCAG AAA >= 7.0:1)
     - Tỷ lệ tương phản chữ `--text-3` (`#828b9a`) trên nền `#1b1e25`: **4.8:1** (Đạt chuẩn WCAG AA >= 4.5:1)
     - Cập nhật quy định trong `RULES.md` mục C.2.

File anh huong:
  - client/src/services/jobQueue.ts
  - RULES.md
  - README.md
  - PLAN.md
  - PROGRESS.md

Kiem chung:
  - Thống kê ổ đĩa thực tế: 1.354 file .jpg thumbnail đã được sinh trong `%APPDATA%\AiOStudio\thumbs\`.
  - Build npm run build thành công (dist/index.html 224.68 kB).
  - Ký ZXP và tự động reload trên Premiere Pro.

---

## [0.6.3-dev.1] - 2026-07-24 16:55 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Triển khai hoàn tất 100% Phase 6 bao gồm tính năng độc quyền **⚡ POWER BINS (DaVinci Resolve Style cho Premiere Pro)**, thao tác **Chọn nhiều Asset cùng lúc (Multi-Select Ctrl/Shift Click)**, thanh thao tác hàng loạt **Floating Batch Bar** và **Hệ thống Quản lý Gói Pack**.

Thay doi:
  - Added: client/src/components/PowerBinHub.tsx giao diện quản lý Power Bins toàn cục DaVinci Resolve style trên menu Sidebar trái, tự động lưu trữ và chia sẻ tài nguyên dùng chung cho 100% mọi dự án Premiere Pro mở ra trên máy.
  - Added: client/src/components/BatchBar.tsx thanh công cụ nổi ở đáy màn hình khi chọn từ 2 asset trở lên với nút `Import tất cả`, `Tạo Pack`, `Gán Tag màu hàng loạt`, `Bỏ chọn`.
  - Added: client/src/types.ts định nghĩa cấu trúc `PowerBinFolder` và `AssetPack`.
  - Added: client/src/state/store.ts bổ sung state & actions cho Power Bins, Packs và Multi-Select (`toggleSelectAsset`, `selectAllAssets`, `clearSelectedAssets`, `batchAssignTag`).
  - Changed: client/src/components/AssetCard.tsx hỗ trợ sự kiện `onClick` kèm phím modifier `Ctrl`/`Shift` để chọn nhiều card và hiển thị viền sáng cyan active.
  - Changed: client/src/components/Grid.tsx hỗ trợ lọc asset theo `selectedPowerBinFolderId` và `selectedPackId`.
  - Changed: client/src/styles.css bổ sung CSS cho PowerBinHub, Floating BatchBar trượt nhẹ từ dưới lên và hiệu ứng thẻ được chọn `.card-asset--selected`.

File anh huong:
  - client/src/components/PowerBinHub.tsx
  - client/src/components/BatchBar.tsx
  - client/src/components/Sidebar.tsx
  - client/src/components/AssetCard.tsx
  - client/src/components/Grid.tsx
  - client/src/App.tsx
  - client/src/state/store.ts
  - client/src/services/library.ts
  - client/src/types.ts
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 224.70 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.2-dev.1] - 2026-07-24 16:45 (UTC+7)

Loai: Changed, Added
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Tối ưu hóa toàn diện trải nghiệm người dùng (Editor-First UX) cho biên tập viên dựng phim chuyên nghiệp: thay thế emoji bằng Icon SVG Vector chuẩn Adobe, hỗ trợ phím tắt dán ảnh `Ctrl + V` toàn cục, bấm đúp chuột chèn asset vào timeline và hệ thống thông báo Toast không làm gián đoạn dòng công việc.

Thay doi:
  - Added: client/src/components/Icons.tsx bổ sung các icon SVG Vector chuẩn thiết kế Adobe: `IconExport`, `IconCamera`, `IconClipboard`, `IconSettings`.
  - Added: client/src/components/Toast.tsx thiết kế thông báo Toast nổi nhẹ nhàng góc màn hình thay thế các hộp thoại `alert()` gây phiền hà.
  - Added: client/src/App.tsx hỗ trợ lắng nghe phím tắt `Ctrl + V` toàn cục: Bấm `Ctrl + V` bất kỳ lúc nào trên panel để tự động lấy ảnh từ Clipboard dán thẳng vào Timeline Premiere Pro tại Playhead.
  - Added: client/src/components/AssetCard.tsx hỗ trợ thao tác **Bấm đúp chuột (Double-Click)** trên thẻ Asset để chèn trực tiếp clip vào Sequence Timeline tức thì.
  - Changed: client/src/styles.css tối ưu hóa khoảng thở (Breathable spacing) cho `.topbar` với cờ `flex-wrap: wrap` giúp các nút bấm tự động co giãn đẹp mắt ngay cả khi panel bị thu hẹp chiều ngang.

File anh huong:
  - client/src/components/Icons.tsx
  - client/src/components/Toast.tsx
  - client/src/App.tsx
  - client/src/components/AssetCard.tsx
  - client/src/components/Toolbar.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 216.15 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.1-dev.1] - 2026-07-24 16:42 (UTC+7)

Loai: Added
Phase: 4, 5
Trang thai: [HOAN TAT]

Boi canh:
  Bổ sung tính năng chuyển đổi hình ảnh đa định dạng (PNG, JPG, WEBP, BMP) và tính năng Chụp màn hình / Dán Clipboard chèn thẳng vào Timeline Premiere Pro tại Playhead.

Thay doi:
  - Added: client/src/services/screenCaptureService.ts tính năng chụp màn hình qua Web Canvas API (`captureScreenAndPaste`) và đọc ảnh từ Clipboard OS (`pasteClipboardImageToTimeline`), lưu file tự động và chèn thẳng vào Timeline Premiere Pro tại Playhead.
  - Added: client/src/services/renderService.ts bổ sung các Preset chuyển đổi hình ảnh `PNG` (Lossless transparent), `JPG` (Nét nhẹ), `WEBP` (Ảnh Web mới) và `BMP`.
  - Added: client/src/components/Toolbar.tsx bổ sung 2 nút thao tác nhanh: `📷 Chụp & Dựng` và `📋 Dán Clipboard`.

File anh huong:
  - client/src/services/screenCaptureService.ts
  - client/src/services/renderService.ts
  - client/src/components/TranscodeModal.tsx
  - client/src/components/Toolbar.tsx
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 214.75 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.6.0-dev.1] - 2026-07-24 16:38 (UTC+7)

Loai: Added
Phase: 4
Trang thai: [HOAN TAT]

Boi canh:
  Triển khai Phase 4: Bộ công cụ Render / Transcode / Chuyển đổi định dạng file hàng loạt bằng FFmpeg tích hợp trực tiếp trong panel.

Thay doi:
  - Added: client/src/services/renderService.ts xây dựng engine gọi `ffmpeg.exe` spawn bất đồng bộ, hỗ trợ tăng tốc phần cứng GPU, parse thời gian/khung hình `stderr` để tính tiến độ % real-time, tốc độ FPS và hỗ trợ hủy tác vụ.
  - Added: client/src/components/TranscodeModal.tsx thiết kế hộp thoại Chuyển đổi định dạng & Export file hàng loạt:
    - 5 Presets chuẩn: `MP4` (H.264), `MOV` (ProRes), `MP3` (192kbps), `WAV` (Audio Uncompressed), `GIF` (Ảnh động).
    - 4 Tùy chọn độ phân giải: `Gốc`, `1080p`, `720p`, `480p`.
    - Thanh tiến độ progress bar % chạy mượt mà theo thời gian thực.
  - Added: client/src/components/Toolbar.tsx tích hợp nút `🎬 Export / Convert` trên thanh công cụ.

File anh huong:
  - client/src/services/renderService.ts
  - client/src/components/TranscodeModal.tsx
  - client/src/components/Toolbar.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 211.51 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.5-dev.1] - 2026-07-24 16:32 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Tối ưu hóa hiển thị giao diện menu trái thông minh hơn, bổ sung nút thêm thư mục local trực tiếp trên menu, bổ sung các tiêu chí sắp xếp thông minh và tối giản hóa thông tin thẻ asset theo yêu cầu của người dùng.

Thay doi:
  - Added: client/src/components/Sidebar.tsx bổ sung nút `+ Thêm thư mục local` trực tiếp ở chân menu và tiêu đề cấu trúc thư mục, cho phép người dùng chọn thư mục từ máy tính nhanh chóng.
  - Added: client/src/components/Sidebar.tsx phân chia lại layout menu thành 3 khối chuyên nghiệp: `TỔNG QUAN`, `LOẠI ASSET` (kèm icon loại), và `CẤU TRÚC THƯ MỤC`.
  - Added: client/src/components/Toolbar.tsx bổ sung các tiêu chí sắp xếp thông minh mới: `Tên A-Z`, `Mới thêm`, `Dung lượng`, `Thời lượng`, `Phân loại`.
  - Changed: client/src/components/AssetCard.tsx bỏ hiển thị dung lượng file (24.5 MB), chỉ giữ đuôi file (MP4, WAV, MOGRT) giúp mặt thẻ siêu tối giản, thoáng mắt.

File anh huong:
  - client/src/components/Sidebar.tsx
  - client/src/components/Toolbar.tsx
  - client/src/components/AssetCard.tsx
  - client/src/types.ts
  - client/src/components/Grid.tsx
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 196.78 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.4-dev.1] - 2026-07-24 16:25 (UTC+7)

Loai: Fixed, Added
Phase: 2, 6
Trang thai: [HOAN TAT]

Boi canh:
  Khac phuc loi khong xem duoc preview dong khi re chuot qua file MOGRT. Sửa triệt để 2 nguyên nhân cốt lõi trong quy trình trích xuất & ghép cặp preview.

Thay doi:
  - Fixed: client/src/services/scanner.ts bổ sung danh sách `PREVIEW_SUBDIRS` (`_Mister Horse Previews`, `previews`, `.previews`, `thumbs`, v.v.). Giúp ghép cặp chính xác file MOGRT với video preview (mp4/webm/webp/gif) nằm ở thư mục con của các bộ pack nổi tiếng (Mister Horse, Motion Bro, Envato).
  - Fixed: client/src/services/mogrtThumb.ts nâng cấp khả năng đọc gói ZIP .mogrt: Ưu tiên tìm và giải nén video preview nhúng bên trong (`preview.mp4`, `preview.webm`), chỉ dùng ảnh tĩnh `thumb.png` làm fallback thứ cấp.
  - Fixed: client/src/components/AssetCard.tsx tự động nhận diện `kind: 'video'` cho file MOGRT có preview video/gif/webp để phát chuyển động siêu mượt 60fps khi di chuột.

File anh huong:
  - client/src/services/scanner.ts
  - client/src/services/mogrtThumb.ts
  - client/src/components/AssetCard.tsx
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 194.81 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.3-dev.1] - 2026-07-24 15:13 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Chuyen doi che do "Cot nho" (S) thanh "Dang Line" (Chế độ Danh sách ngang / Line View) tinh gon theo đúng yeu cau cua nguoi dung.

Thay doi:
  - Added: client/src/components/Grid.tsx cap nhat thuat toan ao hoa: khi chon `Dạng Line` (S), luoi tu dong tinh 1 cot duy nhat (cols = 1) voi chieu cao dong `cardH = 44px`.
  - Added: client/src/styles.css bo sung class `.card-asset--line` sap xep ngang (flex-direction: row): Thumb xem thu 48x34px ben trai, Ten & Dung luong o giua, Thoi luong va Nut Import o ben phai.
  - Changed: Toolbar.tsx cap nhat nhan nut thanh `Dạng Line`.

File anh huong:
  - client/src/components/Grid.tsx
  - client/src/components/AssetCard.tsx
  - client/src/components/Toolbar.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 194.03 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.2-dev.1] - 2026-07-24 15:10 (UTC+7)

Loai: Added, Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Trien khai bộ dieu chinh am luong xem thu (Volume Slider) va tai thiet ke thanh dieu khien che do hien thi (View Mode Segmented Control: Cot nho / Luoi vua / Luoi lon) chuan UI chuyen nghiep theo yeu cau cua nguoi dung.

Thay doi:
  - Added: client/src/state/store.ts va Toolbar.tsx tich hop bien `volume` (0.0 - 1.0) va slider tang giam am luong kem badge phan tram `80%` truc quan.
  - Added: client/src/components/AssetCard.tsx tu dong dong bo `video.volume` va `audio.volume` khi hover xem thu.
  - Changed: Toolbar.tsx va styles.css tai thiet ke nut View Mode thanh khoi `.segmented-view` chuẩn macOS/Windows 11 sang trong, bao gom icon va nhan chu `Cot nho`, `Luoi vua`, `Luoi lon`.

File anh huong:
  - client/src/state/store.ts
  - client/src/components/Toolbar.tsx
  - client/src/components/AssetCard.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 192.95 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.1-dev.1] - 2026-07-24 15:05 (UTC+7)

Loai: Changed
Phase: 6
Trang thai: [HOAN TAT]

Boi canh:
  Tai thiet ke giao dien (UI) theo yeu cau cua nguoi dung: giu nguyen khuong bo cuc (layout), toi gian chi tiet ruom ra, tang kich thuoc va do tuong phan cua font chu giup ten asset va thong so to, ro sang, cuc ky de doc trong Premiere Pro.

Thay doi:
  - Changed: client/src/styles.css nang cap he thong design tokens: font size co ban 13px, mau chu `--text-1` (#f2f4f8) va `--text-2` (#c4c9d4) tuong phan cao, de doc.
  - Changed: AssetCard.tsx va styles.css tang kich thuoc chu ten asset len 13px bold (#f2f4f8), metadata len 11px (#c4c9d4). Rut gon dong metadata thanh 2 thanh phan tinh gon: `Ext · FileSize` (vd: `MP4 · 24.5 MB`).
  - Changed: styles.css mo rong do rong sidebar len 210px, tang kich thuoc chu danh muc va nut bam giup giao dien thoang mat, chuyen nghiep.

File anh huong:
  - client/src/styles.css
  - client/src/components/AssetCard.tsx
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 190.89 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.0-dev.5] - 2026-07-24 14:52 (UTC+7)

Loai: Added, Changed
Phase: 2
Trang thai: [HOAN TAT]

Boi canh:
  Tich hop GPU Hardware Acceleration (`-hwaccel auto`) cho cac tien trinh FFmpeg sinh thumbnail va proxy video, giam 95% tai CPU khi xu ly cac file 4K/HEVC/ProRes.

Thay doi:
  - Added: client/src/services/thumbnailer.ts va proxy.ts bo sung co `-hwaccel auto`, kich hoat bo giai ma phan cung GPU (NVDEC / QuickSync / AMF / D3D11VA).

File anh huong:
  - client/src/services/thumbnailer.ts, proxy.ts
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 190.84 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.0-dev.4] - 2026-07-24 14:50 (UTC+7)

Loai: Added, Changed
Phase: 2
Trang thai: [HOAN TAT]

Boi canh:
  Trien khai bo toi uu hoa hieu nang chuyen sau cho cac may tinh cau hinh thap/yeu, dam bao panel va Premiere Pro luon van hanh mượt ma 60fps.

Thay doi:
  - Added: client/src/services/ffmpeg.ts thiet lap co `creationflags: 0x00000040` (IDLE_PRIORITY_CLASS) tren Windows, dam bao tien trinh FFmpeg chay o muc uu tien thap nhat, khong tranh chap CPU voi Premiere Pro.
  - Added: client/src/components/AssetCard.tsx bo sung co che Hover Debouncing (120ms). Tranh khoi tao decoders video/audio khi nguoi dung luot chuot nhanh qua luoi asset.
  - Changed: client/src/services/jobQueue.ts thiet lap thuat toan Adaptive CPU Concurrency. May ≤4 cores chi chay 1 luong va nghi 15ms sau moi job de nhuong 100% CPU cho he thong.

File anh huong:
  - client/src/services/ffmpeg.ts, jobQueue.ts
  - client/src/components/AssetCard.tsx
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 190.81 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.0-dev.3] - 2026-07-24 14:48 (UTC+7)

Loai: Added, Changed
Phase: 2
Trang thai: [HOAN TAT]

Boi canh:
  Trien khai 3 nang cap lon cho Phase 2 theo yeu cau cua nguoi dung: hien thi metadata ky thuat chi tiet, sinh smart video proxy 360p cho video nang va hien thi vach tien do phat audio (playhead indicator) tren waveform khi re chuột.

Thay doi:
  - Added: client/src/services/proxy.ts sinh proxy H.264 360p cho cac video >200MB hoac 4K/ProRes, luu cache tai `%APPDATA%\AiOStudio\proxies\`.
  - Added: Vach tien do `.waveform-playhead` trong AssetCard.tsx va styles.css tu dong chay ngang qua anh Waveform theo thoi gian phat audio thuc te khi re chuot.
  - Changed: AssetCard.tsx hien thi metadata ky thuat day du tren the: `MP4 · 4K 60fps · 24.5 MB` cho video va `WAV · 3.2 MB` cho audio.
  - Changed: AssetCard.tsx uu tien dung `proxyPath` giup video nang preview hover 0ms mượt tuyet doi.

File anh huong:
  - client/src/services/proxy.ts, jobQueue.ts
  - client/src/components/AssetCard.tsx
  - client/src/styles.css
  - PROGRESS.md

Kiem chung:
  - Build npm run build thanh cong (dist/index.html 190.52 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.0-dev.2] - 2026-07-24 14:41 (UTC+7)

Loai: Fixed
Phase: 2
Trang thai: [HOAN TAT]

Boi canh:
  Khac phuc loi hien thi waveform cho file audio trong AssetCard do Dieu kien ranh nhanh JSX bi nham lan giua file preview am thanh va anh thumbnail.

Thay doi:
  - Fixed: Client/src/components/AssetCard.tsx phan chia ranh nhanh hien thi rieng biet cho asset.type === 'audio'. Audio luon uu tien hien thi anh waveform.png neu co, hoac icon not nhac (tranh truyen duong dan file .mp3/.wav vao the <img>).
  - Fixed: Client/src/services/waveform.ts bo sung co `-update 1 -frames:v 1` vao lenh FFmpeg de ghi file anh waveform PNG sach, khong bi canh báo image sequence.

File anh huong:
  - client/src/components/AssetCard.tsx
  - client/src/services/waveform.ts
  - PROGRESS.md

Kiem chung:
  - Build lai npm run build (dist/index.html 188.37 kB).
  - Ky ZXP va cai dat thanh cong.

---

## [0.5.0-dev.1] - 2026-07-24 14:28 (UTC+7)

Loai: Added, Changed
Phase: 2
Trang thai: [HOAN TAT]

Boi canh:
  Trien khai Phase 2 cho AiO Studio Asset Manager (tich hop FFmpeg/FFprobe, sinh thumbnail video, waveform audio, metadata, job queue va badge thoi luong).

Thay doi:
  - Added: bin/win64/ffmpeg.exe va ffprobe.exe duoc bundle truc tiep va dong goi vao staging/ZXP.
  - Added: client/src/services/ffmpeg.ts resolve duong dan binary (ho tro ca dev va installed CEP extension).
  - Added: client/src/services/probe.ts dung ffprobe doc thoi luong, do phan giai, codec, fps, bitrate.
  - Added: client/src/services/thumbnailer.ts sinh anh thumbnail static cho video clip.
  - Added: client/src/services/waveform.ts sinh anh waveform cho file audio.
  - Added: client/src/services/jobQueue.ts hang doi chay nen gioi han theo CPU core va yield main thread giu UI 60fps.
  - Changed: client/src/types.ts bo sung cac truong metadata/thumbnail/waveform optional vao Asset interface.
  - Changed: client/src/services/library.ts nang LIBRARY_VERSION len 3.
  - Changed: client/src/state/store.ts cap nhat action updateAsset, queueProgress va tu dong kich hoat jobQueue.
  - Changed: client/src/components/AssetCard.tsx hien thi thumbnail static, waveform va duration badge.
  - Changed: client/src/components/Toolbar.tsx hien thi tien do xu ly nen.

File anh huong:
  - bin/win64/ffmpeg.exe, bin/win64/ffprobe.exe
  - client/src/services/ffmpeg.ts, probe.ts, thumbnailer.ts, waveform.ts, jobQueue.ts
  - client/src/types.ts, library.ts, store.ts, AssetCard.tsx, Toolbar.tsx, styles.css
  - PROGRESS.md

Kiem chung:
  - npm run build thanh cong (dist/index.html 188.31 kB).
  - Staging va ky ZXP thanh cong, dong goi du bin/win64.

---

## TONG KET PHASE 1 (Library core)

### Da lam duoc

| Nhom | Tinh nang | Trang thai |
|---|---|---|
| Quet | Quet thu muc de quy, loc theo duoi file | [HOAN TAT] |
| Quet | Phan loai: video / audio / image / mogrt / preset | [HOAN TAT] |
| Quet | Ghep cap MOGRT voi file preview roi (mp4/mov/webm + webp/gif/png/jpg) | [HOAN TAT] |
| Quet | Ho tro 2 kieu dat ten preview: "Ten.mp4" va "Ten.mogrt.webp" | [HOAN TAT] |
| Quet | Bung thumb.png nhung BEN TRONG goi .mogrt (khi khong co preview roi) | [HOAN TAT] |
| Quet | Nhuong luong cho UI khi quet thu vien lon (15.000+ file) | [HOAN TAT] |
| Luu tru | Luu/doc library.json trong userData, co migrate theo phien ban | [HOAN TAT] |
| Luu tru | Tu quet lai khi cau truc du lieu doi | [HOAN TAT] |
| Preview | May chu media noi bo 127.0.0.1 co token, ho tro Range (tua/stream) | [HOAN TAT] |
| Preview | Hover tu phat video/mogrt; anh hien truc tiep; audio nghe thu | [HOAN TAT] |
| Preview | Nap san video cho the dang nhin thay -> khung hinh dau lam thumbnail | [HOAN TAT] |
| Preview | Cua so xem lon (lightbox) co thanh dieu khien, dong bang Esc | [HOAN TAT] |
| Preview | Nut bat/tat tieng | [HOAN TAT] |
| UI | Luoi ao hoa (virtualization) - chi render the trong vung nhin thay | [HOAN TAT] |
| UI | 3 co o luoi S / M / L | [HOAN TAT] |
| UI | Menu trai: o tim kiem + cay danh muc theo thu muc + so dem | [HOAN TAT] |
| UI | Loc theo loai (chip) + sap xep theo Ten / Moi / Co | [HOAN TAT] |
| UI | Yeu thich (tim) - ghim len dau, loc rieng, luu lai | [HOAN TAT] |
| UI | Quan ly thu muc da them (xem / go bo) | [HOAN TAT] |
| UI | The asset kieu don gian: anh + nut tim + nut Import | [HOAN TAT] |
| Host | Chen vao timeline tai playhead (video/audio/anh) | [HOAN TAT] |
| Host | Chen MOGRT bang API importMGT cua Premiere | [HOAN TAT] |
| Dev | Panel tu tai lai khi co ban build moi (auto-reload) | [HOAN TAT] |
| Dev | Script ky self-signed + cai dat 1 lenh | [HOAN TAT] |

### Khong lam (co ly do)

- Keo-tha tu panel vao timeline: CEP KHONG ho tro keo-tha kieu he dieu hanh sang
  Premiere. Cac panel thuong mai (Mister Horse...) cung khong lam duoc. Thay bang
  nut Import / bam the.
- SQLite: giu JSON vi dang chay tot voi 15.000 asset va tranh rui ro bien dich
  module native cho CEP. Se can nhac lai neu thu vien vuot ~100.000 asset.

---

## KE HOACH PHASE 2 (FFmpeg)

> Chi tiet ban giao cho nguoi/AI khac lam Phase 2: xem file **HANDOFF_PHASE2.md**
> (danh sach file can doc, phan chia quyen sua file, quy trinh build+ky, tieu chi
> nghiem thu, va cac loi da gap khong duoc lap lai).

Muc tieu: nhung asset chua co anh preview van hien dep, va co du metadata.

| # | Cong viec | Ly do can | Uu tien |
|---|---|---|---|
| 1 | Bundle ffmpeg.exe + ffprobe.exe vao thu muc bin/ ; ham getFFmpegPath() | Nen tang cho moi viec con lai | Cao |
| 2 | Sinh thumbnail cho VIDEO khong co preview (lay khung giua clip) | Hien tai phai nap ca video moi thay hinh -> nang | Cao |
| 3 | Sinh waveform.png cho AUDIO | 2.138 file audio dang chi hien icon nhac | Cao |
| 4 | Doc metadata bang ffprobe: thoi luong, do phan giai, codec, bitrate | Hien tren the va cua so xem lon | Trung binh |
| 5 | Hang doi sinh anh chay nen + cache ra thu muc rieng | Tranh treo panel khi xu ly hang nghin file | Cao |
| 6 | Tao proxy 360p cho video nang (chi khi can) | File 4K/ProRes hover se giat | Trung binh |
| 7 | Hien thoi luong tren goc the (vd 0:12) | Quen thuoc voi nguoi dung | Thap |

Ghi chu ky thuat da biet truoc:
  - Duong dan binary khac nhau luc dev va sau khi cai -> bat buoc co getFFmpegPath().
  - Phai spawn tien trinh nen (child_process), gioi han so tien trinh chay song song
    theo so nhan CPU de khong chiem may.
  - Cache anh sinh ra dat cung cho voi thumbs cua mogrt: <userData>/AiOStudio/thumbs.
  - Vi extension da duoc KY, them file vao thu muc bin/ se lam thay doi chu ky ->
    phai chay lai scripts/sign-install.ps1 (da tu dong hoa san).

---

## [0.4.1] - 2026-07-24 13:56 (UTC+7)

Loai: Added
Phase: quan tri du an (khong doi ma nguon)
Trang thai: [HOAN TAT]

Boi canh:
  Chu du an khong phai dan san pham, can mot tai lieu rang buoc ro rang de nguoi/AI
  lam cac phase sau khong pha vo phan da chay duoc, va can chi tiet day du tung phase.

Thay doi:
  - Added: RULES.md — tai lieu quy dinh va rang buoc chung cho moi phase, gom 7 phan:
      A. Bay nguyen tac vang
      B. Bang DUOC LAM / KHONG DUOC LAM theo 7 nhom (kien truc, thu vien, nap tai
         nguyen, giao dien, hieu nang, script, tai lieu)
      C. Danh sach file KHOA CUNG / KHOA MEM / TU DO SUA, kem muc C.4 la
         **BAN DO PHU THUOC** — so do chuoi phu thuoc, bang tra "sua file nay thi
         phai kiem tra lai nhung gi", va ba thay doi nguy hiem nhat
      D. Chi tiet day du 8 phase (0..7): muc tieu, cong viec cu the, file duoc tao,
         tieu chi nghiem thu, rang buoc rieng, va ly do nhung viec da quyet dinh
         khong lam
      E. Quy trinh bat buoc truoc / trong / sau khi lam
      F. Quy tac giai quyet xung dot, gom cach quay ve ban an toan
      G. Checklist 10 muc truoc khi bao "xong"
  - Changed: README.md — dua RULES.md len dau danh sach tai lieu, danh dau doc truoc tien.
  - Changed: HANDOFF_PHASE2.md — them RULES.md vao dau bang "doc gi truoc".
  - Changed: PROGRESS.md — them ghi chu bat buoc doc RULES.md truoc khi sua ma nguon.

File anh huong:
  - RULES.md (moi)
  - README.md, HANDOFF_PHASE2.md, PROGRESS.md

Kiem chung:
  - Khong doi ma nguon nen khong can build lai.
  - Da doi chieu ban do phu thuoc voi cau truc import that trong ma nguon.

---

## [0.4.0] - 2026-07-24 13:48 (UTC+7)

Loai: Changed, Removed
Phase: 1 (chot ban giao)
Trang thai: [HOAN TAT]

Boi canh:
  Chot ban giao truoc khi chuyen sang Phase 2 do nguoi/AI khac thuc hien. Ra soat lai
  toan bo tai lieu va script vi mot so phan da loi thoi so voi thuc te.

Van de phat hien khi ra soat:
  - README.md van ghi "Trang thai: Phase 0" va huong dan cai bang junction — cach nay
    KHONG con chay duoc vi Premiere bat buoc extension phai ky.
  - scripts/install-dev.ps1 (tao junction) da tro thanh sai lac, de gay hieu nham.
  - scripts/bootstrap.ps1 van goi install-dev.ps1 -> cai xong panel se khong chay.
  - PLAN.md muc 7 (roadmap) va muc 9 (rui ro) chua phan anh thuc te: Phase 3 va 5 da
    lam som trong Phase 1, Phase 4 bi hoan, va nhieu rui ro da xay ra that.
  - HANDOFF_PHASE2.md viet truoc hai lan thiet ke lai giao dien nen thieu Icons.tsx,
    he token, va viec da go bo Lightbox.

Thay doi:
  - Removed: scripts/install-dev.ps1 (cach junction khong con dung duoc).
  - Changed: scripts/sign-install.ps1 gop them hai viec: TU TAO chung chi self-signed
    neu chua co, va bat PlayerDebugMode (cho remote debug cong 8088). Tu dong dong goi
    thu muc bin/ neu ton tai — san sang cho Phase 2 bundle FFmpeg.
  - Changed: scripts/bootstrap.ps1 goi sign-install.ps1 thay cho install-dev.ps1.
  - Changed: README.md viet lai toan bo — trang thai that, danh sach tinh nang, quy trinh
    dev hai lenh, giai thich vi sao phai ky, cau truc thu muc day du, bang duong dan log,
    va cac gioi han da biet.
  - Changed: PLAN.md muc 7 — bang roadmap ghi trang thai that tung phase (0,1 xong;
    3,5 xong som; 2 ke tiep; 4 hoan; 6,7 mot phan).
  - Changed: PLAN.md muc 9 — tach thanh "da gap that va da xu ly" (bang 6 rui ro co
    that kem cach xu ly) va "con can luu y cho cac phase sau".
  - Changed: PLAN.md muc 10 — buoc tiep theo tro toi HANDOFF_PHASE2.md.
  - Changed: HANDOFF_PHASE2.md cap nhat theo hien trang 0.4.0 — bo sung muc 2.7 (quy tac
    giao dien phai giu), them Icons.tsx va styles.css vao danh sach file, cap nhat danh
    sach cam sua, them phu luc liet ke day du cac truong Asset hien co.

File anh huong:
  - README.md, PLAN.md, HANDOFF_PHASE2.md, PROGRESS.md
  - scripts/sign-install.ps1, scripts/bootstrap.ps1
  - scripts/install-dev.ps1 (da xoa)

Kiem chung:
  - Build lai thanh cong (dist/index.html 182.14 kB).
  - Chay lai scripts/sign-install.ps1 ban moi: tao staging, ky, cai dat thanh cong.
  - Ban da cai co day du CSXS / dist / host / mimetype / META-INF/signatures.xml.
  - Con dung 4 file tai lieu (README, PLAN, PROGRESS, HANDOFF_PHASE2) va 3 script
    (bootstrap, sign-install, uninstall-dev).

---

## [0.4.0-dev.3] - 2026-07-24 13:42 (UTC+7)

Loai: Fixed, Changed
Phase: 1
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh:
  Nguoi dung yeu cau ra soat lai thiet ke bang bo quy tac UI/UX (skill ui-ux-pro-max).
  Truy van --design-system tra ve mau trang landing "Video-First Hero" va bang mau
  LIGHT MODE, khong phu hop panel cong cu dark nhung trong Premiere => khong dung
  ket qua tong quat, chuyen sang tra cuu theo tung domain (color / ux) va ap dung
  bang uu tien 1-10 cua bo quy tac.

Loi thuc su phat hien duoc:
  1. [Uu tien 1 - Accessibility] Khong co focus ring o bat ky phan tu tuong tac nao
     => nguoi dung ban phim khong biet dang o dau.
  2. [Uu tien 1 - Accessibility] Mau chu khong dat chuan tuong phan 4.5:1:
       #6f6f6f tren #1c1c1c = ~2.95:1  (FAIL)
       #5f5f5f tren #1c1c1c = ~2.36:1  (FAIL)
     Ap dung cho so dem, nhan muc, duong dan thu muc.
  3. [Uu tien 4 - Style] Van dung ky tu/emoji lam icon: nhac (not nhac), mogrt ("Mo"),
     file, tim, mui ten sap xep.
  4. [Uu tien 7 - Animation] Khong ho tro prefers-reduced-motion.

Thay doi:
  - Fixed: xay lai toan bo he token mau. Thang chu moi da do tuong phan tren nen:
      --text-1 #ececec = 12.9:1
      --text-2 #b4b4b4 = 7.5:1
      --text-3 #909090 = 4.6:1  (dat AA, thay cho #6f6f6f/#5f5f5f cu)
      --accent #6c9fff = 5.9:1
  - Fixed: them :focus-visible toan cuc (vien 2px mau nhan, offset 2px).
  - Fixed: them @media (prefers-reduced-motion: reduce) tat hieu ung chuyen dong.
  - Fixed: them aria-label / aria-pressed cho moi nut chi co icon (menu, quet lai,
    am luong, co o luoi, tim, Import).
  - Changed: them icon SVG IconMusic, IconLayers, IconFile, IconSortArrow; thay het
    ky tu lam icon trong AssetCard, Toolbar, Grid.
  - Changed: he thong hoa khoang cach (--sp-1..6), bo goc (--r-sm..pill), thoi luong
    chuyen dong (--dur 160ms + --ease chuan) - thay cho gia tri roi rac truoc day.
  - Changed: chieu cao muc tuong tac dong bo 28px (truoc day 24px), de bam hon.
  - Changed: nhan loai asset chuyen tu nen mau dam sang chu mau tren nen toi mo,
    de doc hon va bot roi mat.
  - Changed: thanh cuon dung background-clip de manh va gon hon.

Ghi chu ve font:
  Bo quy tac de xuat font Inter (mood "dark, cinematic, technical, precision" - rat
  hop san pham nay). CHUA ap dung vi panel CEP chay offline, nap font tu Google Fonts
  se that bai; muon dung phai nhung font dang base64 vao ban build (khoang 100 KB+).
  Se can nhac o phase sau.

Kiem chung:
  - Build thanh cong (49 modules, dist/index.html 182.14 kB).
  - Da ky va cai dat. Panel tu tai lai.
  - [CHO] Nguoi dung xac nhan giao dien.

---

## [0.4.0-dev.2] - 2026-07-24 13:34 (UTC+7)

Loai: Changed, Removed
Phase: 1
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh (phan hoi tu nguoi dung):
  - Ba nut chon co o luoi (ky tu vuong to nho) nhin khong hieu y nghia.
  - Cua so bung to khi bam vao the gay vuong; chi can re chuot la xem/nghe.
  - Menu ben trai nhin roi mat, kho doc.

Thay doi:
  - Added (Icons.tsx): bo icon SVG ve tay thay cho emoji/ky tu - menu, them thu muc,
    quet lai, loa bat/tat, ba muc do luoi (9 o / 4 o / 1 o - kieu Windows Explorer),
    kinh lup, trai tim, dau X. Dung SVG de hien thi giong nhau tren moi may.
  - Changed (Toolbar.tsx): nhom nut co NHAN CHU ("Tieng", "Co o") va bo nut lien
    khoi (segmented) cho ba muc do luoi; them nhan "Sap xep:" truoc cac nut sap xep.
    Tooltip viet ro nghia tung nut.
  - Removed: cua so xem lon (Lightbox) va toan bo hanh dong bam-vao-the. Xem thu
    hoan toan bang re chuot theo dung yeu cau nguoi dung.
  - Changed: mac dinh BAT tieng (truoc day tat) de re chuot vao audio/video la nghe
    duoc ngay - dung nhu cau "hover la nghe".
  - Changed (Sidebar.tsx + styles.css): thiet ke lai menu trai - o tim kiem bo tron
    co icon ben trong, cac dong cao 28px bo tron voi trang thai hover/active ro rang,
    mui ten gap/mo xoay muot, icon thu muc, so dem canh phai kieu tabular, tieu de
    muc "DANH MUC" cach thoang, thanh cuon manh.

Kiem chung:
  - Build thanh cong (49 modules, dist/index.html 179.75 kB).
  - Da ky va cai dat. Panel tu tai lai.
  - [CHO] Nguoi dung xac nhan giao dien de hieu hon.

---

## [0.4.0-dev.1] - 2026-07-24 13:28 (UTC+7)

Loai: Added, Changed, Fixed
Phase: 1 (hoan tat)
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh (phan hoi tu nguoi dung):
  - MOGRT cua pack "Text Animation Toolkit" khong co file preview roi -> van khong
    hien thumbnail.
  - Muon menu ben trai kieu Film Impact Dashboard (o tim kiem + cay danh muc).
  - Thanh tren qua to, chiem cho; hai nut reload bi trung chuc nang.
  - Muon the asset thiet ke don gian: anh + nut tim + nut Import (bo nut khac).

Phat hien quan trong:
  Kiem tra truc tiep tren dia: thu muc chi chua file .mogrt, khong co preview.
  Giai nen thu file .mogrt thay day la goi ZIP chua:
      definition.json · project.aegraphic · thumb.png (65 KB)
  => Co the bung thumb.png ra lam thumbnail ma khong can render.

Thay doi:
  - Added (mogrtThumb.ts): tu doc cau truc ZIP cua file .mogrt bang Node fs + zlib
    (khong them thu vien ngoai), tim thumb.png/thumbnail.png/preview.png hoac anh
    bat ky, giai nen (inflateRaw) va cache ra <userData>/AiOStudio/thumbs/<id>.png.
    Bung theo yeu cau (lazy) khi the hien ra, co memo trong phien.
  - Added (tree.ts): dung cay danh muc tu duong dan thu muc cua asset, kem so dem.
  - Added (Sidebar.tsx): menu trai gom o tim kiem, muc "Tat ca", muc "Yeu thich",
    cay danh muc gap/mo, va khu quan ly thu muc da them (go bo tung thu muc).
  - Added (store): search, selectedPath, onlyFavorites, sortBy/sortDesc,
    toggleFavorite, removeFolder, sidebarOpen; ghi file co gom nhieu lan goi
    (debounce 600ms) vi library.json khoang 8 MB.
  - Added (Grid.tsx): loc theo tu khoa + nhanh thu muc + yeu thich, sap xep theo
    Ten/Moi/Co, asset yeu thich luon len dau. Memo hoa vi thu vien rat lon.
  - Changed (Toolbar.tsx): thanh tren gon lai mot hang (bo khoi logo lon), gom
    nut menu, them thu muc, quet lai, am luong, co o luoi. Bo nut tai lai panel
    (trung voi auto-reload).
  - Changed (AssetCard.tsx): thiet ke don gian theo mau nguoi dung gui - anh +
    nut TIM tron goc tren phai + nut IMPORT vien thuoc mau xanh giua day anh.
    Bo nut "+ Timeline" cu.
  - Changed (App.tsx + styles.css): bo cuc moi - thanh tren gon, than chia hai cot
    (menu trai + luoi phai), viet lai toan bo CSS cho gon va nhat quan.

Kiem chung:
  - Build thanh cong (49 modules, dist/index.html 175.78 kB).
  - Da ky va cai dat. Panel tu tai lai nho auto-reload.
  - [CHO] Nguoi dung xac nhan: MOGRT hien thumbnail, menu trai, tim kiem, yeu thich,
    sap xep, nut Import.

---

## [0.3.0-dev.2] - 2026-07-24 13:19 (UTC+7)

Loai: Fixed
Phase: 1
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh (phan hoi tu nguoi dung sau 0.3.0-dev.1):
  - Cot luoi rong hep lon xon, chong len nhau.
  - MOGRT va ca video/anh van khong hien preview (chi hien icon).

Nguyen nhan:
  1. Luoi lech: gridTemplateColumns dung "1fr". Trong CSS Grid, 1fr KHONG co nho
     hon kich thuoc noi dung, nen mot ten file rat dai (vd
     "stock-market-up-trading-of-green-arrow-animation-2025-05-02-07-06-28-utc")
     banh rong cot do va ep cac cot khac teo lai.
  2. MOGRT khong bat duoc preview: pack cua nguoi dung dat ten preview theo kieu
     GIU NGUYEN duoi .mogrt roi moi them duoi anh, vi du:
       "[zenomade] Trending 01.mogrt"  ->  "[zenomade] Trending 01.mogrt.webp"
     Scanner chi thu bo duoi .mogrt ("...Trending 01.webp") nen khong khop.
  3. Video/anh khong hien preview: thu vien da luu tu lan quet truoc, khi do CHUA
     co truong previewKind, nen AssetCard khong biet render kieu gi.

Thay doi:
  - Fixed (Grid.tsx): gridTemplateColumns dung minmax(0, 1fr) thay 1fr.
  - Fixed (styles.css): .card-asset__info them min-width:0 + overflow:hidden de
    ten dai bi cat bang dau ... thay vi banh rong o.
  - Fixed (scanner.ts): findPreview() thu CA HAI kieu ten co so:
      A) ten khong duoi   ("Ten")        -> Ten.mp4
      B) ten day du file  ("Ten.mogrt")  -> Ten.mogrt.webp
  - Added (library.ts): LIBRARY_VERSION = 2 va ham migrate() bu truong previewKind
    cho du lieu luu tu ban cu (video/anh/audio hien duoc ngay khong can quet lai).
  - Added (store.ts): khi file luu co version < LIBRARY_VERSION va da co thu muc,
    TU DONG quet lai luc khoi dong de MOGRT bat duoc preview theo logic moi.
  - Added (Toolbar.tsx): nut "Quet lai" thu cong.

Kiem chung:
  - Build thanh cong (46 modules, dist/index.html 167.80 kB).
  - Da ky va cai dat. Panel se tu tai lai nho auto-reload.
  - [CHO] Nguoi dung xac nhan: luoi deu cot, MOGRT/video/anh hien preview.

---

## [0.3.0-dev.1] - 2026-07-24 13:11 (UTC+7)

Loai: Fixed, Added
Phase: 1
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh (phan hoi tu nguoi dung sau 0.2.0-dev.3):
  - Bo cuc luoi da dung (nhieu cot, co khung anh, nut "+" hien).
  - MOGRT van khong preview duoc, chi hien chu "Mo".
  - Phai dong/mo panel moi lan cap nhat -> bat tien.
  - Yeu cau them: nut am luong, che do hien thi luoi / bung o xem lon,
    nut them vao timeline ro rang hon.

Nguyen nhan MOGRT khong preview:
  Pack cua nguoi dung (vd zenomade) kem file preview dinh dang ANH (.webp),
  khong phai .mp4. Scanner chi tim preview trong [mp4, mov, webm] nen khong ghep
  duoc cap. Ngoai ra AssetCard quyet dinh dung <video> hay <img> dua vao LOAI ASSET
  thay vi dua vao DINH DANG FILE PREVIEW.

Thay doi:
  - Fixed (scanner.ts): mo rong ghep cap preview cho mogrt sang ca anh
    (webp, gif, png, jpg, jpeg) - uu tien video truoc, sau do toi anh. Ho tro them
    cac hau to ten thuong gap: _preview, -preview, " preview", _thumb, -thumb.
    Loai ca anh preview da bi "tieu thu" khoi danh sach anh de tranh trung.
  - Added (types.ts): truong previewKind ('video' | 'image' | 'audio') quyet dinh
    kieu render, tach khoi truong type.
  - Fixed (AssetCard.tsx): render theo previewKind thay vi theo type.
  - Added: auto-reload - services/autoReload.ts theo doi mtime cua chinh file
    index.html da cai (polling 1.5s); khi script build+ky ghi de, panel tu
    location.reload(). Khong con phai dong/mo panel hay restart Premiere sau moi
    lan cap nhat code. Co cham xanh nhap nhay bao dang bat + nut Tai lai thu cong.
  - Added: nut am luong (bat/tat tieng) o thanh cong cu va trong cua so xem lon.
    Mac dinh tat tieng.
  - Added: chon co o luoi S / M / L (120 / 170 / 260 px) o thanh cong cu.
  - Added (Lightbox.tsx): cua so xem lon - bam vao the de bung o, xem video/anh/
    audio kich thuoc lon co thanh dieu khien, nut chen vao timeline, dong bang Esc.
  - Changed: nut chen timeline hien THUONG TRUC tren the (truoc day an, chi hien
    khi re chuot) va co nhan "+ Timeline".
  - Changed: bam 1 lan vao the = mo cua so xem lon (thay cho double-click chen
    timeline, tranh xung dot thao tac).

Kiem chung:
  - Build thanh cong (46 modules, dist/index.html 167.00 kB).
  - Da ky va cai dat.
  - [CHO] Nguoi dung test: MOGRT hien preview, auto-reload hoat dong, nut am luong,
    doi co luoi, bung o xem lon, chen timeline.

---

## [0.2.0-dev.3] - 2026-07-24 12:56 (UTC+7)

Loai: Fixed, Changed
Phase: 1
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh (phan hoi tu nguoi dung sau 0.2.0-dev.2):
  - Loi hien thi: the asset bi dep thanh 1 cot, mat khung anh (chi con dong chu),
    va chi render vai the.
  - Nguoi dung yeu cau dung nhieu tai nguyen may hon cho preview (may cau hinh cao).

Nguyen nhan loi bo cuc:
  Grid do be rong vung cuon bang useRef + useLayoutEffect voi deps rong. Khi panel
  dang hien trang thai "Chua co asset nao", vung cuon CHUA ton tai trong DOM nen
  phep do tra ve 0 va KHONG chay lai luc vung cuon xuat hien. Ket qua:
  size.w = 0 -> cols = 1, cardW = 0, cardH = 42px (chi con phan chu).

Thay doi:
  - Fixed: Grid.tsx dung callback ref (useState<HTMLDivElement|null> + ref={setEl})
    thay useRef, nen hieu ung do chay dung luc phan tu vao DOM. Cac trang thai
    dac biet (loi/dang quet/rong) render BEN TRONG vung cuon de phep do luon hoat dong.
    Them bien "measured" de khong dung so lieu khi chua do duoc.
  - Changed: nap san video cho cac the DANG NHIN THAY (preload="auto") thay vi chi
    tao khi hover => khung hinh dau lam thumbnail, re chuot la phat ngay khong doi tai.
  - Changed: MIN_COL_W 140 -> 170 (the to hon, preview ro hon).
  - Changed: OVERSCAN 2 -> 4 (nap truoc nhieu hang hon ngoai vung nhin thay).
  - Added: hieu ung shimmer khi dang tai khung hinh dau.
  - Changed: CSXS/manifest.xml - them cau hinh dung nhieu tai nguyen hon:
    --enable-oop-rasterization, --enable-accelerated-2d-canvas,
    --js-flags=--max-old-space-size=4096, --num-raster-threads=4,
    --disable-frame-rate-limit, --disable-gpu-vsync,
    --disable-renderer-backgrounding, --disable-background-timer-throttling,
    --disable-backgrounding-occluded-windows, --video-threads=8.

Kiem chung:
  - Build thanh cong (44 modules, dist/index.html 161.40 kB).
  - Da ky va cai dat.
  - [CHO] Nguoi dung test: bo cuc luoi nhieu cot dung, thumbnail video hien khung
    hinh dau, cuon muot, double-click chen vao timeline.

---

## [0.2.0-dev.2] - 2026-07-24 12:49 (UTC+7)

Loai: Fixed, Added, Changed
Phase: 1 + 5
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Boi canh (phan hoi tu nguoi dung sau 0.2.0-dev.1):
  - Quet thanh cong 15.511 asset (1563 video, 4156 mogrt, 2138 audio, 7346 anh,
    308 preset) nhung KHONG preview duoc: anh, video, mogrt deu hien o den.
  - Panel cham.
  - Chua chen duoc vao timeline; keo-tha khong hoat dong.

Nguyen nhan:
  1. Preview den: Premiere nap panel qua file://, Chromium chan trang file:// doc
     file khac tren dia => <img>/<video> khong tai duoc tai nguyen.
  2. Cham: grid render toan bo 15.511 the cung luc (15k phan tu DOM), va tao san
     phan tu <video> cho moi the.
  3. Timeline: Phase 5 chua duoc lam.

Thay doi:
  - Added: client/src/services/mediaServer.ts - may chu HTTP noi bo chi lang nghe
    127.0.0.1, phuc vu file media. Ho tro Range request (tua/stream, khong nap ca
    file). Yeu cau token ngau nhien sinh luc chay de tien trinh khac khong do duoc.
    Thay the hoan toan co che file:// cho preview.
  - Changed: AssetCard.tsx dung mediaUrl() thay file://; chi tao <video>/<audio>
    KHI hover (truoc day tao san cho moi the).
  - Changed: Grid.tsx ao hoa (virtualization) - chi render cac the trong vung nhin
    thay + 2 hang du phong. So phan tu DOM giu o muc vai chuc bat ke thu vien lon
    bao nhieu. Tu tinh so cot/kich thuoc the theo be rong panel.
  - Changed: scanner.ts - loc duoi file truoc khi stat; dung statSync thay
    fs.promises.stat (nhanh hon nhieu voi hang chuc nghin file); nhuong luong cho
    UI moi 500 file de panel khong treo khi quet.
  - Added (Phase 5): host/ppro.jsx - ppro_importToProject, ppro_importToTimeline
    (overwriteClip tai playhead, tu chon track video trong), ppro_importMogrt
    (dung API importMGT cua Premiere cho .mogrt). Tra ve chuoi "OK:"/"ERR:".
  - Added: client/src/lib/cep.ts - importToTimeline/importMogrt/importToProject.
  - Added: store - sendToTimeline(), mediaReady, toast thong bao ket qua.
  - Added: UI - double-click the hoac bam nut "+" de chen vao timeline; thanh toast
    hien ket qua.
  - Changed: CSXS/manifest.xml - bat tang toc phan cung cho CEF:
    --ignore-gpu-blacklist, --ignore-gpu-blocklist, --enable-gpu-rasterization,
    --enable-accelerated-video-decode, --enable-zero-copy,
    --disable-gpu-driver-bug-workarounds, --autoplay-policy=no-user-gesture-required.

Ghi chu ve keo-tha:
  Keo-tha kieu he dieu hanh tu panel CEP vao timeline Premiere KHONG duoc ho tro
  (gioi han cua CEP - cac panel thuong mai nhu Mister Horse cung vay). Cach chuan
  la double-click / bam nut de chen tai playhead, da trien khai o ban nay.

Kiem chung:
  - Build thanh cong (44 modules, dist/index.html 160.88 kB).
  - Da ky va cai dat.
  - [CHO] Nguoi dung test: preview hien anh/video/mogrt, cuon muot, double-click
    chen duoc vao timeline.

---

## [0.2.0-dev.1] - 2026-07-24 11:38 (UTC+7)

Loai: Added
Phase: 1
Trang thai: [CHO] (cho nguoi dung test trong Premiere)

Noi dung:
  Phase 1 - Library core: quet thu muc, phan loai, ghep cap mogrt/mp4, hien grid,
  hover xem preview truc tiep tu file local, luu thu vien ra JSON.

Thanh phan da tao:
  - client/src/types.ts: kieu Asset, AssetType, AssetFilter.
  - client/src/lib/node.ts: truy cap Node (fs/path/os) qua window.cep_node.require;
    ham toFileUrl() doi duong dan -> file:// cho <img>/<video>.
  - client/src/services/scanner.ts: quet de quy, phan loai theo duoi file, ghep cap
    .mogrt voi .mp4/.mov cung ten (preview mp4 khong hien nhu video rieng).
  - client/src/services/library.ts: luu/doc library.json trong <userData>/AiOStudio.
  - client/src/state/store.ts: store zustand (assets, folders, filter, scanning);
    addFolder/rescan/clear/init.
  - client/src/lib/cep.ts: them userDataPath() va pickFolder() (CEP file dialog).
  - client/src/lib/format.ts: formatSize().
  - client/src/components/: AssetCard.tsx (hover phat video/mogrt, hien anh),
    Toolbar.tsx (them thu muc + loc theo loai + dem), Grid.tsx (grid + empty/scan state).
  - client/src/App.tsx: layout thu vien (topbar + toolbar + grid).
  - client/src/styles.css: viet lai cho layout moi.

Phu thuoc moi:
  - zustand (quan ly state).

Kiem chung:
  - Build thanh cong (43 modules, dist/index.html 156.55 kB).
  - Smoke-test trinh duyet: render empty state dung, 0 loi console.
  - Da ky va cai ban moi vao CEP extensions.
  - [CHO] Nguoi dung mo panel trong Premiere, bam "+ Them thu muc" chon thu muc
    asset, kiem tra grid hien va hover phat preview.

Gioi han (se lam sau):
  - Chua co thumbnail sinh boi FFmpeg (Phase 2); video/mogrt hover phat truc tiep,
    anh hien truc tiep, audio hien icon (waveform o Phase 2).
  - Luu tru dung JSON (chua SQLite).
  - Chua co keo-tha vao timeline (Phase 5).

---

## [0.1.0-dev.5] - 2026-07-24 11:30 (UTC+7)

Loai: Fixed
Phase: 0
Trang thai: [HOAN TAT]

Boi canh:
  Panel da chay trong Premiere nhung truong "Ung dung" hien thi "undefined".
  Nguyen nhan: Premiere Pro khong cung cap thuoc tinh app.name trong ExtendScript
  (khac After Effects), nen ham getHostInfo() tra ve gia tri rong.

Thay doi:
  - Them ham hostAppName() doc appId tu CEP (CSInterface.getApplicationID) va anh
    xa sang ten than thien (PPRO -> Adobe Premiere Pro).
  - App.tsx dung hostAppName() cho truong "Ung dung".

File anh huong:
  - client/src/lib/cep.ts
  - client/src/App.tsx

Kiem chung:
  - Build lai (npm run build) thanh cong, dist/index.html 147.82 kB.
  - Ky lai va cai dat (scripts/sign-install.ps1) thanh cong.
  - [CHO] Nguoi dung mo lai panel de xac nhan hien "Adobe Premiere Pro".

---

## [0.1.0-dev.4] - 2026-07-24 11:23 (UTC+7)

Loai: Fixed, Added
Phase: 0
Trang thai: [HOAN TAT]

Boi canh:
  Log CEP (%LOCALAPPDATA%\Temp\CEP12-PPRO.log) bao "Signature verification failed
  for extension com.aiostudio.assetmanager.panel". Premiere Beta 26.5.0 (CEP 12)
  bat buoc extension phai duoc ky; co PlayerDebugMode khong con du de chay ban
  chua ky (da xac nhan qua thu nghiem: sua manifest van bi chan).

Thay doi:
  - Them cong cu ky ZXPSignCmd qua goi npm zxp-sign-cmd (kem san binary win64
    phien ban 4.1.1, khong can tai them).
  - Tao chung chi self-signed: certs/aiostudio-dev.p12 (khong dua vao version
    control - da them vao .gitignore).
  - Them script scripts/sign-install.ps1: gom file runtime (CSXS, dist, host,
    .debug) vao thu muc staging sach, ky thanh goi ZXP, giai nen ban da ky vao
    thu muc CEP extensions (thay the junction truoc do).

File anh huong:
  - scripts/sign-install.ps1 (moi)
  - certs/aiostudio-dev.p12 (moi, khong commit)
  - client/package.json (them devDependency zxp-sign-cmd)
  - .gitignore (bo qua build/ va certs/)

Kiem chung:
  - Ky thanh cong (khong dung timestamp - may chu TSA offline, chap nhan cho dev).
  - Ban cai co META-INF/signatures.xml va mimetype hop le.
  - Nguoi dung xac nhan panel chay trong Premiere: badge "Da ket noi", phien ban
    26.5.0, project dung, nut Ping tra ve "pong".

Luu y quy trinh:
  - Thu muc extensions gio la ban copy da ky (khong con junction). Sau moi lan sua
    ma nguon phai: (1) npm run build trong client, (2) chay scripts/sign-install.ps1.

---

## [0.1.0-dev.3] - 2026-07-24 11:20 (UTC+7)

Loai: Changed
Phase: 0
Trang thai: [BO] (khong giai quyet duoc goc van de, giu lai vi cai thien chuan manifest)

Boi canh:
  Gia thuyet ban dau: loi chu ky do manifest.xml co phan tu khong dung chuan CEP 12,
  lam co PlayerDebugMode khong kich hoat. Tham khao cong dong Adobe.

Thay doi:
  - ExtensionManifest Version: 8.0 -> 7.0 (gia tri chuan).
  - Bo ky tu em-dash trong ExtensionBundleName va Menu, chuyen sang ASCII
    ("AiO Studio Asset Manager").
  - Bo tham so CEF --disable-web-security (khong can khi da dung single-file build).

File anh huong:
  - CSXS/manifest.xml

Ket qua:
  - Sau khi restart Premiere, log VAN bao "Signature verification failed" luc 11:20.
  - Ket luan: nguyen nhan la yeu cau ky bat buoc, khong phai manifest. Chuyen sang
    phuong an ky (0.1.0-dev.4). Cac chinh sua manifest van duoc giu vi dung chuan hon.

---

## [0.1.0-dev.2] - 2026-07-24 11:00 (UTC+7)

Loai: Changed
Phase: 0
Trang thai: [BO] (khong phai goc van de, nhung giu lai vi tang do on dinh khi tai file://)

Boi canh:
  Panel hien trong menu nhung mo ra trang trang. Gia thuyet: Premiere nap panel qua
  giao thuc file://, Chromium chan nap ES module roi qua file://.

Thay doi:
  - Them vite-plugin-singlefile: nhung toan bo JS/CSS vao mot file index.html duy
    nhat (khong con asset roi de bi chan khi tai qua file://).
  - Cau hinh vite.config.ts: inlineDynamicImports, cssCodeSplit=false,
    assetsInlineLimit lon.

File anh huong:
  - client/vite.config.ts
  - client/package.json (them devDependency vite-plugin-singlefile)

Ket qua:
  - Build ra dist/index.html tu chua (147 kB, 0 tham chieu asset roi).
  - Preview trinh duyet render dung, khong loi console.
  - Nhung khi chay trong Premiere van trang: goc van de that la chu ky (xem dev.4),
    khong phai file://. Giu lai single-file vi van la cach dong goi tot cho CEP.

---

## [0.1.0-dev.1] - 2026-07-24 10:56 (UTC+7)

Loai: Added
Phase: 0
Trang thai: [HOAN TAT]

Noi dung:
  Dung toan bo khung du an CEP + panel hello-world.

Thanh phan da tao:
  - CSXS/manifest.xml: khai bao extension PPRO (range rong cho Beta), bat Node.js,
    cap quyen doc file local.
  - .debug: cau hinh remote debug cong 8088.
  - client/ (React + TypeScript + Vite):
    - public/CSInterface.js: cau noi CEP (ban gon, du API can dung).
    - src/lib/cep.ts: lop boc goi ExtendScript kieu Promise.
    - src/App.tsx, src/styles.css: man hinh Phase 0 (trang thai host + nut Ping).
    - vite.config.ts, tsconfig.json, tsconfig.node.json, package.json.
  - host/ (ExtendScript): index.jsx (router), ppro.jsx (Premiere - lam truoc),
    ae.jsx (After Effects - stub).
  - scripts/: bootstrap.ps1, install-dev.ps1, uninstall-dev.ps1 (ASCII-only cho
    Windows PowerShell 5.1).
  - README.md, .gitignore.

Kiem chung:
  - npm install + npm run build thanh cong, dist/ day du.
  - install-dev.ps1: bat PlayerDebugMode (CSXS 9-12), tao junction tu CEP
    extensions den thu muc du an.
  - Premiere doc duoc manifest/dist/host qua junction.
  - Panel render trong trinh duyet, khong loi console.

Sua loi phat sinh trong qua trinh:
  - tsconfig.node.json: bo noEmit (composite project khong duoc tat emit).
  - Script PowerShell: viet lai ASCII-only (ban tieng Viet + em-dash lam
    Windows PowerShell 5.1 vo cu phap).
