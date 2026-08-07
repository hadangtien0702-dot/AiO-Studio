# PROGRESS — AiO Auto Guiline Frame

## TRANG THAI HIEN TAI (cap nhat 2026-08-06 16:41)

- **Phien ban:** v0.2.0 — UI moi cua anh Tien DA GHEP + noi day that vao Premiere.
- **DA DO THAT TREN PREMIERE** (project that cua anh Tien: `PV tuyen dung.prproj`,
  sequence 4K 3840x2160 dai **3.897 giay / 306 clip**):
  - Dat guide **0,74 giay** (chi tieu <=2s) · Go **0,13 giay**.
  - Vao **track V3 trong**, phu **3897,76s / 3897,76s** — khong dung V1 (306 clip)
    hay V2 (6 clip).
  - **Go xong sequence GIONG HET ban goc** — so sanh chuoi anh chup truoc/sau
    (ten + moc dau/cuoi tung clip, ca track tieng, so muc goc project): **khop y het**.
  - 2 ham host moi chay dung: `gf_dsSequence` liet ke 2 sequence that;
    `gf_moSequence` mo "PV sales" (4018s) roi tra ve "Synced Sequence" (3897s).
  - **Soi file PNG 4K that su gui sang Premiere**: 3840x2160, khung dich 9:16
    rong 1215px giua khung, ngoai khung lam toi (alpha 115), **giua khung
    alpha = 0** (khong am mau hinh), dong "TAT TRUOC KHI XUAT VIDEO" nam o
    y 194-253 — **49.879 diem chu** tren toan anh.
- **DA DO tren trinh duyet:** 17/17 khung hinh khop safe-zones.json tung con so ·
  .guides ra dung vi tri · 21/21 phep thu tuong tac · 0 loi JS · 0 lan goi mang.
- Chi tiet: xem muc 2026-08-06 16:41 ben duoi.

---

## Trang thai truoc do (2026-08-02 20:56)

- **Phien ban:** v0.1.0 · ID `com.aiostudio.guideframe` · cong debug 8096.
- **Da ODO THAT tren Premiere Beta 26.5 (PID phien 02/08):**
  - Dat guideline tu panel **0,2 giay** (chi tieu <=2s) · go sach nhu cu tung con so.
  - Dat len track trong tren cung V3, khong dung clip nguoi dung (do: V1 camA,
    V2 camB, V3 AIO_GUIDE).
  - Nhanh lech ti le (9:16 tren sequence 16:9 -> ve vung giua 405x720) chay dung.
  - **Import .guides: anh Tien da them vao timeline OK** sau khi lam tron so 2 chu
    so (parser Adobe kho tinh voi so le dai kieu 74.789999...).
- **UI da qua 2 dot lam dep** (bo cuc 2 cot + chat lieu vien thiet bi). Cach do:
  chup man hinh panel that qua CDP cong 8096, khong doan qua DOM.
- **Viec ke tiep (chua lam):**
  - `[CHO]` Render thu 1 doan roi SOI FILE xuat co dinh overlay khong (moi chung
    minh gian tiep bang dem clip, chua soi file that).
  - `[CHO]` Doi chieu nguoc huong ngang/doc trong .guides cho DU cac ti le (moi
    xac nhan 1 ca TikTok qua mat anh Tien; chua thu ca ngang).
  - `[CHO]` Cau hoi UX con treo: guide goc Premiere ghi thang vao "Installed
    Guides.guides" luc dang chay co hien ngay khong, hay phai restart — anh Tien
    chua tra loi co thay "AiO TikTok Safe Zone" trong menu Guide Templates chua.
  - Chua co: nut xuat MP4, bo cai ghep, khoa ban quyen, macOS (xem PIPELINE.md).

---

## 2026-08-06 16:41 — GHEP THIET KE MOI (v0.2.0) + noi lai day that vao Premiere

**Boi canh:** anh Tien giao file thiet ke moi
`AiO Design System/AiO Auto Guiline Frame/AiO Guide Frame.html`, nho "them vao
Adobe". Mo ra thi thay `dist/index.html` DA bi chep de bang chinh file thiet ke
do (md5 GIONG HET, ca hai deu mtime 15:36 cung ngay) — khong phai do phien nay.

### Cai gia phai tra cua ban chep de (do bang so, khong doan)

| Mat gi | Bang chung |
|---|---|
| `ve-guide.js` + `safe-zones.js` khong con duoc nap | grep: 0 lan trong ban chep, 2 lan trong ban cu |
| **Khong con duong GO guide** (`gf_tatOverlay`) | ban chep chi goi 2 ham host; ban cu goi 5 |
| Mat kiem phien ban host (`gf_phienBan`) | benh "panel moi noi voi host cu" mo toang |
| Mat dem lop guide con sot (`gf_demOverlay`) | canh bao truoc khi xuat khong con |
| Mat xuat `.guides` (Tang B) | nut bien mat khoi HTML |
| Ghi PNG vao `os.tmpdir()` | vi pham bai hoc 28/07: Premiere ao hoa thu muc trong %APPDATA% |
| **14 id JS goi ma HTML khong co** | `$('moCaiDat').title` khong bao ve -> bam nut EN la CHET |
| Tai video mau tu Internet | `mixkit.co` + `googleapis.com` — panel chay trong Premiere may khach |
| So lieu safe zone hard-code trong UI | vi pham luat "safe-zones.json la nguon chan ly" |

**So lieu:** mang hard-code trong thiet ke khop JSON **52/53 vung**. Lech duy
nhat: `zalo-916` canh phai — JSON **12%**, thiet ke **12,96%**. Nay panel doc
JSON nen 12% thang. **Anh Tien chot lai giup so nao dung.**

### Da lam

- **Giu nguyen hinh thuc thiet ke.** Phan them vao deu dung ĐUNG class CSS co
  san trong chinh file thiet ke (`.tt`, `.phu`, `.chugiai`, `.btn--icon`) —
  CSS cua no van con day du cho nhung khoi ma HTML bi thieu.
- Them lai: **hop trang thai**, **nut Go guideline**, **nut Luu .guides**,
  **nut Cai dat** (thiet ke co CSS + JS cho ca 4, chi thieu the HTML).
- Noi lai bo may cu: `napHost()` + kiem phien ban truoc MOI lenh · `evalP` co
  han cho · ghi PNG vao `C:/AiOStudio/GuideFrame` · dem lop guide con sot.
- **Ve PNG bang `ve-guide.js` dung chung** -> anh dat len timeline giong het
  khung xem truoc, va co lai dong "TAT TRUOC KHI XUAT VIDEO" nhung trong anh.
- Du lieu nap tu `safe-zones.js`; mang trong file doi ten thanh `NEN_GOC`, chi
  con la luoi an toan khi file du lieu khong nap duoc.
- **O chon sequence nay la THAT**: host them `gf_dsSequence()` + `gf_moSequence()`,
  chon mot cai la Premiere mo dung cai do.
- Nho lua chon giua hai lan mo panel (localStorage).
- **Font Inter dong goi**: thiet ke tro toi `../fonts/Inter.woff2` nhung panel
  KHONG co thu muc do -> chep tu `AiO Design System/fonts/`, va them buoc chep
  `fonts/` vao `sign-install.ps1` (truoc do khong chep -> cai vao Premiere la 404).
- Nhip hoi host: 1,5s mot cau re; danh sach sequence chi hoi lai khi doi hoac
  moi 8 nhip — khong tranh CPU voi Premiere.
- Bo video mau tai tu Internet, thay bang nen ve bang CSS. **0 loi goi ra ngoai.**

### Da kiem the nao (so do, khong noi suong)

Dung may chu tinh + do thang tren DOM/canvas:

- **17/17 khung hinh**: do hinh hoc THAT do layout engine tra ve, doi chieu
  voi `safe-zones.json` — lech cho phep 0,35%, thuc te 0 ca truot. Nhan
  "khung an toan WxH" cung khop phep tinh doc lap.
- **PNG gui sang Premiere**: tam khung **alpha = 0** (khong am mau hinh) ·
  vung UI to do dung `rgba(255,95,109,0.26)` · dong canh bao co **8.213 diem
  chu** (VI) / 8.608 (EN); **tat `opts.tag` thi con 0 diem** — chung minh
  chinh tag ve ra chu khong phai thu khac.
- **`.guides`**: 8 duong, vi tri **6,77 / 74,79 (ngang)** va **4,07 / 87,04
  (doc)** — dung y het phep tinh doc lap tu JSON; khoa file dung dinh dang Premiere.
- **21/21 phep thu tuong tac** (doi ngon ngu 2 chieu, mo/dong cai dat, them-xoa
  duong, doi mau, luu-ap-xoa preset, di het 10 nen tang, nho sau khi tai lai).
- **0 loi JS**, **0 lan goi mang**.

### Hai lan THUOC DO SAI, khong phai san pham sai (ghi de lan sau khoi mat cong)

1. Do "dong canh bao trong anh" o **y=112** -> bao KHONG CO. Doc lai
   `ve-guide.js`: tag neo theo **mep vung an toan** (`sUi.y + pad*2 + co`),
   voi TikTok 1080x1920 la y≈161–237. Do lai dung cho: co du.
2. Do be rong khung xem truoc bang `getBoundingClientRect` -> **259x460** o
   moi kho man hinh. Doc thang bien CSS thi la **337,5x600** (dung cong thuc).
   Nguyen nhan: khung Browser khong dung hinh nen layout tra gia tri CU —
   dung cai bay da ghi trong `~/.claude/CLAUDE.md` muc 5.
   -> **Ket luan: KHONG do duoc bo cuc bang mat trong moi truong nay.**

### DO TREN PREMIERE THAT (16:55, anh Tien mo Premiere de do not)

Project **`PV tuyen dung.prproj`** — sequence `Synced Sequence` **3840x2160,
3.897 giay (65 phut), 306 clip tren V1**. Quy mo that, khong phai mau nho.

Kiem AN TOAN truoc khi bam (bai hoc 3b — chup trang thai goc truoc):
`V1=306 V2=6 V3=0` · root 11 muc · **0 clip nao ten bat dau `AIO_GUIDE`** ·
**khong co bin ten 'AiO Guide Frame'** -> go se khong xoa nham gi cua anh Tien.

| Do | Ket qua |
|---|---|
| Phien ban panel vs host | 0.2.0 == 0.2.0 (chot kiem host cu chay dung) |
| Dat guide | **0,74 giay** (chi tieu <=2s) |
| Vao dau | **track V3** (trong), phu **3897,76s / 3897,76s** |
| Go guide | **0,13 giay** |
| Sequence sau khi go | **GIONG HET ban goc** — so chuoi anh chup (ten + moc dau/cuoi TUNG clip + track tieng + so muc goc project): khop y het |
| Con sot | 0 clip guide · 0 bin guide · sequence dang mo tra ve dung `Synced Sequence` |
| `gf_dsSequence` | liet ke dung 2 sequence that kem ID |
| `gf_moSequence` | mo "PV sales" (4018s) -> tra ve "Synced Sequence" (3897s), doc lai xac nhan |
| Font Inter trong Premiere | `document.fonts.check` = true |
| Nhanh lech ti le | 9:16 tren sequence 16:9 -> panel bao "guide chi ve vung giua 1215x2160" |

**Soi CHINH FILE PNG da gui sang Premiere** (doc lai tu dia, khong ve lai tu code):

- `AIO_GUIDE_tiktok-video_3840x2160_vi.png` — 377 KB, **3840x2160 khop sequence**.
- Khung dich do TU ANH: x 1308..2531 -> **1224px** (ky vong 1215 + net vien 7px).
- Ngoai khung dich: den alpha **115** (lam toi). Trong khung: **alpha = 0** —
  **khong am mau hinh cua anh Tien**.
- Vung UI to `255,97,108` alpha 66 (dung `rgba(255,95,109,0.26)` cua ve-guide.js).
- Vung lam viec giua: **1004px** (ky vong 1008 tru 2 net vien).
- **Dong "TAT TRUOC KHI XUAT VIDEO"** nam o **y 194-221 va y 232-253** (2 dong),
  tong ca anh **49.879 diem chu**.

### 17:10 — 3 loi anh Tien bat duoc khi dung that (da sua + do lai)

**1. O chon sequence khong chon duoc.** Anh Tien chup man hinh bao. Do: o xo CO
mo (`hidden=false`, 2 muc) nhung bi **`.selbar { overflow:hidden }` CAT CUT** —
danh sach cao 69px bat dau y=68, thanh sequence ket thuc y=110 -> chi lot dong
dau, "PV sales" bi cat.
→ Sua GOC: khi mo thi neo o xo bang **`position:fixed`** theo toa do nut (tinh
trong `comboBox()`), nen khong to tien nao cat duoc, va **khong sua mot dong CSS
nao cua ban thiet ke**. Kem lat len tren khi tran day panel + bam theo khi cuon.
→ Do lai: ca 2 muc `elementFromPoint` deu tra ve dung muc do; bam that qua giao
dien -> `gf_moSequence` chay -> Premiere doi sang "PV sales" -> tra ve duoc.

☠️ **Lan do dau em bao "khong doi duoc" la THUOC SAI**: dat gio cho cung 2,5s,
trong khi lenh dau sau khi nap lai panel phai `$.evalFile` host truoc nen lau
hon. Dung bai hoc 5f (lay tin hieu xong cua chinh no) thi ra dung ngay.

**2. Nhan canh bao de len mat nhan vat.** Anh Tien chup anh: khoi chu
"LOP GUIDE — TAT TRUOC KHI XUAT VIDEO" nam ngay dinh dau nguoi tren sequence 16:9.
Nguyen nhan: `veTag` cu neo vao **mep vung an toan** (`sUi.y + pad*2 + co`) — tuc
dat dung vao CHO NGUOI TA CAN NHIN.
→ Sua: gom tag cua `ve()` va `veLuoi()` thanh MOT ham `veTag()`, dat **sat day
khung** (luon nam trong dai da bi UI nen tang che) va **co chu con 62%**.
→ Do lai 3 ca — `yt-169` tren 4K, `tiktok-video` tren 4K (lech ti le), va
`tiktok-video` dung khung 1080x1920: **0 diem chu trong vung an toan** o ca ba,
tam khung van alpha 0. Chu chi con o dai duoi cung (y 2100 / 2140 / 1902).

**3. Nut ghi "Thay bang khung an toan moi" nhung KHONG thay.** Phat hien khi do:
con guide cu tren timeline thi track tren cung khong con trong -> bam vao se
truot `HET_TRACK`. Nhan noi doi (trai luat "nhan nut la VIEC no lam").
→ Sua: `hienGuide()` goi `gf_tatOverlay()` truoc khi dat neu `soLopGuide > 0`.
→ Do: truoc 1 guide -> bam -> **sau van 1 guide** (khong thanh 2, khong loi),
V3=1 clip, **0,76 giay**.

### 17:35 — Anh Tien yeu cau GO 3 khoi (kem anh chup khoanh do)

| Go gi | Ly do / cach xu |
|---|---|
| **"Preset cua toi"** (o ten + nut Luu + danh sach) | Go het markup. Don luon trinh xu ly, bien `presets`, khoa localStorage `aio-gf-presets` va 4 khoa tu dien -> **0 tham chieu chet con lai** |
| **Nut "Luu file .guides"** + dong ghi chu duoi no | Go markup + `luuGuides()` + `motGuide()` + khoa tu dien. ☠️ Day la **Tang B** cua kien truc lai 2 tang chot 01/08 — nay khong con trong giao dien |
| **Hop trang thai bao "Da dat len track V3..."** | KHONG go han hop. Theo dung luat anh Tien *"chi bao khi THAT BAI"*: hop **an khi `m === 'ok'`**, van hien khi `warn`/`err`. Go han thi panel se CAM luc "het track trong" / "chua noi Premiere" — nguoi dung khong biet vi sao khong ra guide |

☠️ Bay khi an hop: `.tt{display:flex}` **de len** quy tac `[hidden]{display:none}`
cua trinh duyet (class co do uu tien cao hon). Phai dung `style.display='none'`.

Do lai sau khi go: `khoi_preset`/`nut_luu_guides`/`dong_ghi_chu` deu **khong con
trong DOM** · **0 loi JS** · them-xoa duong, doi mau, doi ngon ngu, di het 10 nen
tang **van chay** · ep trang thai loi thi hop **hien lai** (`display:flex`, muc
`err`) · dat xong thi hop **`display:none`**.

Kem: bam "Thay bang khung an toan moi" khi timeline dang co **2** guide chong
nhau -> **con dung 1**, V3=1 clip.

### 17:50 — Anh Tien go tiep 2 khoi: canh bao "con guide" + nut "Go guideline"

Sau khi go, khoi hanh dong chi con **DUY NHAT nut chinh**.

**Duong RA gio la gi:** xoa clip guide tren track V3 bang tay trong Premiere.
Panel tu nhan ra sau ~1,5 giay (nhip doc `gf_demOverlay`) va doi nhan nut ve
"Hien khung an toan". Bam nut chinh khi dang co guide thi van **go cu roi dat
moi** (`hienGuide()` goi `gf_tatOverlay()` truoc). Loi nhac an toan that van
con: dong "TAT TRUOC KHI XUAT VIDEO" nung trong chinh tam anh.
**Danh doi da noi ro voi anh Tien:** khong con ai don giup **bin 'AiO Guide
Frame' + file PNG** trong project — truoc day nut Go don luon.

Da don sach: markup, `tatGuide()`, trinh xu ly, 5 khoa tu dien (`tat` `dangTat`
`daTat` `tatTrong` `tatThieu`), trang thai `condu` trong `TRANG_THAI`, va dong
`iTT = 3` trong `demLop()`. **0 tham chieu chet con lai.**

**Do 5 canh (bang bao gio hien hop trang thai):**

| Canh | Hop trang thai | Nhan nut chinh |
|---|---|---|
| Khop ti le, chua dat | **an** | Hien khung an toan |
| Khop ti le, DA co guide tren timeline | **an** | Thay bang khung an toan moi |
| Vua bam dat xong | **an** | Thay bang khung an toan moi |
| **Lech ti le** (9:16 tren seq 16:9) | **hien** (warn) | Thay bang khung an toan moi |
| **Chua noi Premiere** | **hien** (err) | Hien khung an toan |

0 loi JS · them-xoa duong, doi ngon ngu, di het 10 nen tang van chay.

☠️ **Thuoc do sai lan nua:** doc dau tien bao "hop van hien" o canh binh thuong.
Nguyen nhan: ban thu con nho khung `yt-169` trong localStorage nen dang o canh
**lech ti le** — tuc hop hien la DUNG. Dung bai hoc 5p (do tren mot trang thai
khong phai trang thai minh tuong).

### 18:15 — Go han dong chu trong anh + SUA LOI EBUSY anh Tien gap

**A. Go han nhan "LOP GUIDE — TAT TRUOC KHI XUAT VIDEO"** (anh Tien: *"text nay
anh khong can"*). Xoa han `veTag()` trong `ve-guide.js` + 2 cho goi + `opts.tag`
/ `tenNenTang` / `phienBanDuLieu` ben panel + hang `PHIEN_BAN_DU_LIEU`.
Ban xem truoc noi bo von da truyen `tag:false` nen khong anh huong.
→ **Do co DOI CHUNG**: ve lai voi `uiThat:false` -> **0 diem chu**. Nghia la tag
bay sach that; **6.188 diem chu con lai la MO PHONG UI NEN TANG** (avatar,
caption, nhan icon) — tinh nang anh Tien xin 02/08, khong dung toi.
Muon tat luon thi truyen `{ uiThat:false }` trong `taoPngGuideline()`.
→ Danh doi da noi ro: anh guide nay KHONG con loi nhac nao. Cong voi viec da go
nut "Go guideline" va canh bao "dang co N guide", panel khong con nhac gi ve
"tat truoc khi xuat" — nguoi dung tu nho.

**B. ☠️ `EBUSY: resource busy or locked` khi bam lan thu HAI cho CUNG mot khung.**
Anh Tien bao loi (anh chup). Nguyen nhan **khong phai** do chon 2 option luoi
nhu ban dau tuong: ten file PNG dat CO DINH theo `(khung + kich thuoc + ngon
ngu)`, nen lan hai ghi de len chinh file **Premiere van dang giu** — no khong
tra lai handle ngay ca khi clip da bi go va bin da bi xoa.
→ Sua goc: **ten file duy nhat moi lan** (`..._<Date.now()>.png`), kem
`donFileCu()` xoa cac PNG cu (file nao Premiere con giu thi bo qua, lan sau don
tiep) — goi sau moi lan ghi va mot lan luc mo panel.
→ Do: bam **4 lan lien tiep** cung khung `yt-169` tren sequence 4K (lan 2 bat
them "Tam khung", lan 3 bat "Ti le vang" — dung kieu anh Tien lam):
**4/4 dat**, 0,62–0,77 giay, **luon chi con dung 1 guide** tren timeline,
**khong con EBUSY**.
→ Con lai: PNG cu **chua xoa duoc trong cung phien** (Premiere giu file) — 4 lan
bam de lai 4 file ~0,4 MB. Chung se bi don o lan mo Premiere sau.

### 18:30 — Dua khung xem truoc len DAU panel (anh Tien: "chi thay doi vi tri")

Anh Tien dung panel o dock **806px** -> `.grid` roi ve 1 cot, khung xem truoc bi
day xuong duoi cung, phai cuon qua het dieu khien moi thay.

Sua: doi **vi tri trong DOM** — khoi `.col--xem` bay len truoc `.col`. Noi dung
khoi giu **nguyen si** (`seqbox` / `dich` / `chugiai` khong sua mot ky tu).
Them dung **3 dong CSS** de dock rong khong bi dao theo:
`@media (min-width:901px){ .col--xem{order:2} .col:not(.col--xem){order:1} }`.

Do that:

| Kho | Ket qua |
|---|---|
| Panel that 806px (1 cot) | thanh sequence y=68 -> **xem truoc y=122** -> chon nen tang y=591 -> nut chinh y=1015 |
| Ban do 1280px (2 cot) | dieu khien **TRAI** x=61 rong=360 · xem truoc **PHAI** x=433 — **dung y thiet ke goc** |

Moi thu khac khong doi: 10 nut nen tang · 2 chip khung · 4 vung ve · nhan
"Khung an toan 3456x1836" · chu giai · nhan nut · hop trang thai van an ·
khong tran ngang · **0 loi JS** · doi ngon ngu va di het 10 nen tang van chay.

### 18:45 — "Vi tri khong deu" o khoi DUONG TU THEM (anh Tien chup anh)

**Do ra nguyen nhan:** nut huong rong theo CHU nen hai hang lech nhau —
`Doc` **33px** vs `Ngang` **46px** -> thanh keo bat dau lech **12,6px**, con
truot cung o gia tri 50 lai khong thang hang.

**Sua THEO CAU TAO, khong ghim be rong bang tay:** cho ca `.duongs` thanh mot
LUOI 4 cot, tung hang `.duong` dung `display:contents` de gop vao cung luoi ->
moi cot bang nhau o moi hang. Ghim `min-width` bang tay se vo lai khi doi ngon
ngu ("Horizontal" dai gap doi "Ngang"); cach nay thi khong the lech.

| Ca do | Lech nut | Lech diem bat dau thanh keo | Lech o so | Lech nut xoa |
|---|---|---|---|---|
| VI: Doc + Ngang | **0** | **0** | **0** | **0** |
| EN: Vertical + Horizontal | **0** | **0** | **0** | **0** |
| VI: 5 duong tron lan | **0** | **0** | **0** | **0** |

Con truot o gia tri 50 cua hai hang: **cung x = 380,8** (truoc do lech 12,6px).
Nut "+ Them duong" van o hang rieng (`grid-column:1/-1`).

**Kiem `display:contents` co pha gi khong** (no bo hop cua `.duong` di, ma JS
dung `closest('.duong')` de tim hang): keo thanh truot -> o so dong bo · go so
-> thanh truot chay theo · doi huong · **xoa dung hang minh bam** (xoa hang 2
trong 3 hang, con lai dung 2 hang con lai) · duong ve len khung xem truoc ·
them duong. **6/6 dat, 0 loi JS.**

### CON CHO — chua do duoc

- `[CHO]` Nhin bang MAT xem thiet ke con dung y anh Tien khong (xem muc tren:
  moi truong nay do bo cuc khong dang tin).
- `[CHO]` So `zalo-916` canh phai: 12% (JSON) hay 12,96% (thiet ke)?
- Van con tu truoc: render thu roi soi file xuat · doi chieu nguoc huong
  ngang/doc trong `.guides` cho du cac ti le.

### Code chet con lai trong file thiet ke (khong pha gi, de biet ma don sau)

7 id JS con goi ma HTML khong co — deu DA co bao ve `if ($('x'))` nen khong nem
loi: `tabSafe` `tabLuoi` (he tab cu) · `dMot` `dNhieu` `dsNen` (che do chon
nhieu nen tang) · `chipsTiLe` `lblTiLeKhung` (chip ti le khung). Day la ve tich
cua ban thiet ke doi truoc; ban moi bo khoi giao dien nhung JS+CSS van giu.

---

## 2026-08-02 20:56 — Dot lam dep lan 2 (anh Tien: "van thay xau qua")

Lan 1 sua BO CUC (2 cot) — chua du. Lan 2 sua CHAT LIEU BE MAT:
- **Khung xem truoc boc VIEN THIET BI**: khung doc = dien thoai (bo goc 26px,
  vien toi 2 lop, bong do), khung ngang = man hinh, vuong = the — class doi
  tu dong theo ti le. San khau cham mo (dot grid 18px) + vignette.
- Nut chinh: gradient cam + glow nhe + inset highlight, hover nhac 1px,
  trang thai xong gradient xanh. Nut thuong gradient bg-5->bg-4.
- Tab: vien thuoc gon max 420px giua panel, active co bong.
- Cot trai gom thanh 2 CARD (.khoi gradient bg-3->bg-2): dieu khien + hanh dong.
- Chip nen: trong suot vien hairline, chon = accent-soft + dot phat sang.
- Legend thanh pill can giua duoi san khau. Version thanh badge tren topbar.
- Van 100% token Studio Console — khong them mau moi.

Kiem: cu phap sach, cai + reload panel that, CHUP MAN HINH nghiem thu qua CDP
— vien dien thoai + card + nut co chieu sau hien dung. Anh luu:
%TEMP%\panel-dep.png.

## 2026-08-02 16:1x — Lam dep giao dien (anh Tien: "UI qua xau roi em oi" + goi skill ui-ux-pro-max)

**Meo do moi (quan trong):** panel dang mo co cong debug -> CHUP MAN HINH panel
that bang CDP `Page.captureScreenshot` qua cong 8096 — lan dau NHIN thay dung
cai anh Tien nhin, khong doan qua DOM nua. Anh truoc/sau luu o
%TEMP%\panel-hien-tai.png / panel-ban-cuoi.png.

**Benh thay tu anh chup (panel dock RONG ~1340px):**
1. Bo cuc MOT COT keo dai — hinh xem truoc be ti giua khoi den khong lo.
2. "PPro undefined" tren topbar (getHostInfo khong ton tai sau reload panel —
   ScriptPath chi nap luc extension khoi dong, khong nap lai theo location.reload).
3. The khung hinh mini 40px nho vun; thanh cuon lo duoi hang chip; CTA gay dong.

**Sua:**
- **Bo cuc 2 cot tu 560px**: dieu khien trai (max 340px) + xem truoc la NHAN
  VAT CHINH ben phai (sticky, canvas toi 480px rong/520px cao — gap ~2,5 lan),
  panel hep van 1 cot theo thu tu chon -> xem -> hanh dong (order tren flex).
- Canvas xem truoc kieu MAN HINH THIET BI: bo goc 10px, vien sang + do bong,
  san khau radial gradient. Ve lai khi keo gian panel (resize + debounce 150ms).
- Fix host label: doc thang `app.version` (khong phu thuoc ScriptPath) ->
  "Premiere 26.5.0".
- The khung hinh: mini 52px, hover nang nhe, chon co vien accent quanh hinh.
- Chip: giau thanh cuon. Nut chinh MOT MINH mot hang (white-space nowrap),
  nut Tat xep duoi. Topbar them dau cham accent truoc ten.
- Palette pink/blue do database ui-ux-pro-max goi y -> BO, giu token Studio
  Console (luat dong bo 7 panel); chi lay nguyen tac OLED/density/hover/focus.

**Kiem chung:** cu phap sach, khong tham chieu mo coi (phanSafe/phanLuoi/
getHostInfo = 0 loi goi), cai lai + location.reload panel that, chup anh
nghiem thu: 2 cot dung, mock TikTok nhin nhu man hinh dien thoai, CTA 1 dong,
"Premiere 26.5.0" hien dung. Anh Tien dang mo panel — thay ngay ban moi.

## 2026-08-02 15:3x — DO PANEL THAT TRONG PREMIERE: DAT HET, dat overlay 0,2 giay

Anh Tien bao "mo roi do em" nhung cong 8096 van chet. Truy ra: Premiere da
RESTART LAN NUA luc 15:25 (log CEP moi + 5 renderer log moi, khong co
guideframe) — panel van chua duoc bam mo. Hoi CEP qua panel anh em:
`__adobe_cep__.getExtensions()` -> guideframe DANG KY DUNG (ten menu, 340x480).
-> Mo panel bang lenh `requestOpenExtension('com.aiostudio.guideframe.panel')`
qua cong 8088 — cong 8096 len ngay. MEO MOI: khoi can nguoi dung bam menu.

**Ket qua do tren panel that (sequence 1280x720/89s dang mo):**
- Khoi dong: v0.1.0 · PPro 26.5.0 · den xanh "San sang — sequence: 1280x720"
  · 2 tab · 10 chip nen tang · the khung hinh + dong tran an hien dung.
- **Bam "Hien guideline" (TikTok doc 9:16 tren sequence ngang 16:9): 201ms**
  (chi tieu MVP <= 2s — nhanh gap 10). Trang thai bao dung: "Dat len track V3
  · phu 89.00s/89.00s" + luu y ve vao vung giua 405x720 (nhanh lech ti le
  CHAY THAT trong production). Canh bao vang bat, nut doi "Da dat guideline ✓".
- **Bam "Tat guideline": 200ms** — "Da go 1 lop. Sequence sach", canh bao tat.
- Tab luoi: 5 chip ti le · 4 chip luoi · 7 mau · canvas song · meta
  "1280x720 · Theo sequence" (tu bam theo sequence that).
- Xuat .guides tu panel that: C:\AiOStudio\GuideFrame\AiO_tiktok-video.guides.

**MVP theo CLAUDE.md:** 3/4 da do dat (dat <=2s ✓ · toa do khop JSON ✓ ·
tat sach nhu cu ✓). Con lai: render thu soi file xuat + doi chieu nguoc
huong ngang/doc file .guides (anh Tien import file tren la thay ngay).

## 2026-08-02 13:59 — Nang cap tab Luoi bo cuc theo phan tich doi thu Guideify

**Anh Tien yeu cau:** tab luoi phai chon duoc ti le (khong chet cung 16:9),
chon mau, tu them duong; vao guideify (dodashviliguga.gumroad.com) phan tich
va lam ban minh toan dien hon.

**Phan tich Guideify (doc trang that bang browser — Gumroad render JS, WebFetch
tinh chi thay tieu de):** $15 giam $9 · 9:16 + 16:9 + safe zones + center +
custom layouts + LUU PRESET dung lai · tu nhan kich thuoc sequence · 1 click
bat/tat khong tao layer tren timeline · 4.5 sao/11 danh gia · KHONG thay chon
mau · khong mo phong UI that · khong du lieu tu cap nhat. Review co loi
"Could not write PNG (code 6)" -> Guideify cung sinh PNG trung gian nhu minh.

**Lam gi (dist/index.html + ve-guide.js):**
- Ti le khung xem truoc: Theo sequence / 9:16 / 1:1 / 4:5 / 16:9 (dat len
  sequence thi van luon theo kich thuoc sequence that).
- Mau luoi: 7 lua chon (Tu dong = moi nhom mot mau + 6 mau don). Mau ep ca
  vao overlay PNG lan file .guides (hex -> RGB 0-1).
- Duong tu them: toi da 12 duong, moi duong Ngang/Doc + vi tri %, ve mau cam
  accent, vao ca .guides. duongLuoi loai duong ngoai bien (pt<=0 hoac >=100).
- Preset cua toi: luu nguyen bo cau hinh (luoi+duong+mau+ti le) theo ten,
  bam ap lai, x xoa — ngang tinh nang "Save & Reuse Custom Presets" cua Guideify.
- luoiCfg them 3 truong (tiLe/mau/tuyChinh) co di cu tu ban cu trong localStorage.

**Kiem chung:** ham thuan: tuyChinh 2 duong / tat ca 15 duong / ngoai bien 0 —
DAT. Browser: 5 chip ti le · 7 swatch · canvas 9:16 ra 0.563, 1:1 ra 1.00 ·
2 hang duong · mau luu dung · preset luu + ap OK · 0 loi console. Cu phap sach.
Cai lai 13:59.

**So voi Guideify sau dot nay:** ngang (ti le, custom line, preset, tu nhan
sequence) + hon (mau tuy chon · UI that tung nen tang · 10 nen tang safe zone
co nguon · .guides export · du lieu ra soat quy). Con thua: ho co ban AE +
DaVinci, minh chi Premiere.

## 2026-08-02 13:53 — Lam lai UI duoi goc nguoi dung (review truc tiep cua anh Tien)

**Anh Tien che dung 4 diem, sua het:**
1. Chu %·px trong hinh "du thua, nhin khong hieu" -> BO khoi panel + PNG xuat.
   Chi con o ban duyet noi bo (opts.nhan, xem-truoc-safe-zones.html).
2. Ten dinh dang kieu nghien cuu ("Reels/moi video tu 06/2025") -> doi 17 ten
   sang ngon ngu nguoi dung ("Reels", "Stories", "Video doc tren Feed"...).
   XOA preset trung "ig-reels-organic" (2 Reels lam nguoi dung boi roi).
   Du lieu con 17 dinh dang / 53 vung — van qua bo kiem bat bien.
3. Moi so lieu phan tich tren panel (meta, ghi chu, cham trang thai nghien cuu)
   -> thay bang MOT dong: "✓ Thong so ky thuat da cap nhat phien ban moi nhat".
4. Chon nen tang/khung hinh "chua dep, chua than thien" -> chip nen tang co
   CHAM MAU THUONG HIEU (10 mau dung brand), khung hinh thanh THE HINH THU NHO
   dung ti le co ve san vung che (9:16 ra 23x40, 16:9 ra 64x36 — do that).

**Kiem chung:** 0 loi console · the mini dung ti le · 10 cham mau · dong tran an
hien · ten FB = [Reels, Stories, Feed 4:5, Video doc tren Feed] · 53/53 vung
khop JSON · khong tham chieu mo coi · cai lai 13:53 (Premiere PID 21120 dang
chay — panel mo len la an ban moi, manifest khong doi nen khong can restart).

**Ghi bo nho theo yeu cau anh:** 4 bai hoc vao design-lessons/LESSONS.md
(so lieu khong len UI nguoi dung / ten la ngon ngu nguoi dung / bo preset trung /
chon bang hinh) + luat UI vao CLAUDE.md du an (muc Quyet dinh so 5).

**Tra loi 2 cau kiem dinh cua anh (da nhan trong chat):** ranh vung = so kiem
chung tu tai lieu chinh thuc, 53/53 khop tung pixel; ICON la minh hoa dat dung
vi tri trong vung, co ~44px/1080 theo chuan pho bien — muon dung tung pixel theo
tung ban app phai can theo screenshot that moi quy (da ghi vao viec ra soat).

**Bay do luong moi ghi nhan:** `Select-Object -First N` sau script .ps1 lam
DUNG PIPELINE giua chung -> script chet truoc buoc cai ma tuong loi that.

## 2026-08-02 13:4x — DO END-TO-END TREN PREMIERE THAT: DAT het duong dat/go overlay

Anh Tien restart Premiere (PID moi 21120, 13:36). Cong 8096 im lang = panel
chua duoc mo — nhung khong can cho: engine ExtendScript la MOT engine chung,
muon cong debug 8088 (Asset Manager) de nap va do host Guide Frame BAN DA CAI.
Cong cu: `scripts/do-qua-cep.mjs` (CDP qua WebSocket, Node >= 22, ho tro @file).

**Ket qua do that (sequence thu "PodTest Nguon" 1280x720, 89s — dung bai
tren ban nhap):**

| Buoc | Ket qua |
|---|---|
| Nap host ban da cai | OK, gf_phienBan = 0.1.0 (ca file nap tron) |
| Trang thai goc | 3 track video, clip [1,1,0], 22 project item |
| gf_thongTinSeq | OK:1280/720/89s — doc dung |
| Ve + ghi PNG 1280x720 (yt-169) | 123.826 byte |
| **gf_datOverlay** | **OK: len V3 (track trong tren cung), daiThuc=89.00/daiSeq=89.00** |
| gf_demOverlay | 1 — dem dung |
| Trang thai sau dat | [1,1,1], 23 item — chi them dung 1 clip + 1 item |
| **gf_tatOverlay** | **xoa=1, conLai=0** |
| Trang thai sau go | **3#1,1,0#22 — GIONG HET goc, bin PNG cung tu don** |

**Hai rui ro da dong so:**
- ~~"Anh tinh mac dinh ~5s"~~ -> `setOutPoint(daiSeq, 4)` truoc khi dat AN THAT:
  overlay phu tron 89/89s, khong can ganh clip.end.
- ~~"Xoa co sach khong"~~ -> trang thai truoc/sau GIONG TUNG SO, ke ca so item
  trong project (don bin OK).

**Con lai chua do:** panel UI mo trong Premiere (anh chua mo — cong 8096 se
song khi mo Window > Extensions > AiO Studio - Guide Frame) · mapping
orientationType file .guides (cho import thu) · render thu xem overlay co trong
file xuat khi CO va KHONG co lop guide.

## 2026-08-02 09:03 — Tab "Luoi bo cuc" + lop UI THAT tung nen tang

**Anh Tien yeu cau 2 thu (sang 02/08):**
1. "Them mot tab guiline nua" — hoi lai bang AskUserQuestion, anh chot LUOI BO CUC.
2. "Phan frames hien elements dung chinh xac tung nen tang, tung icon cho thuc te".

**Lam gi:**
- `dist/ve-guide.js` +400 dong:
  - Bo icon vector canvas (tim, binh luan, chia se, luu dau, kinh lup, dia nhac,
    avatar+follow, pill, dong chu ma...) — khong anh ngoai, tu co theo khung.
  - 13 layout UI THAT theo nen tang: tiktok (tabs+cot phai+dia nhac+caption),
    reels (IG/FB), stories (progress+avatar+X+thanh reply), shorts (Subscribe
    trang+remix+progress do), snap (brand+CTA vang), pinterest (Save do),
    linkedin, x, zalo, yt-player 16:9 (thanh dieu khien+watermark), fb-feed
    (nut mute). Mac dinh BAT, tat duoc bang opts.uiThat=false.
  - `duongLuoi(cfg)` HAM THUAN + `veLuoi`: chia 3 (4 duong), tam (2+dau cong),
    ti le vang 38.2/61.8 (4), le tuy chinh % (4 duong dut). Mau tach nhom.
- `dist/index.html`: thanh 2 tab (Safe zone | Luoi bo cuc). Tab luoi: 4 chip
  bat/tat ghep duoc + o nhap le % (hien khi bat Le), preview theo TI LE SEQUENCE
  dang mo (chua noi Premiere thi 16:9), nho cau hinh localStorage. Nut Hien/Tat/
  .guides DUNG CHUNG hai tab (1 CTA moi man hinh) — Hien va .guides re nhanh
  theo tab dang chon. Chan bam khi chua bat luoi nao.

**Kiem chung (so do that):**
- Node (ham thuan): chia3=4 tam=2 vang=4 le=4 tatca=14 duong, cu phap sach.
- Browser: 0 loi console · icon TikTok ve that (341 pixel trang trong cot phai)
  · chuyen tab an/hien dung · chip luoi 4 + o nhap le hien dung · canvas luoi
  ti le 1.78 (16:9 fallback) · ve thu 18/18 khung khong nem loi, 14 khung co
  UI that · 57/57 vung van khop JSON tung pixel.
- Cai lai 09:03. Premiere van chua restart — mo lai la co ban nay.

**Luu y:** vi tri ICON la MINH HOA nam trong vung so lieu da kiem; RANH vung
van la so tu safe-zones.json. Con so tren icon (328K...) la gia lap co y.

## 2026-08-02 08:50 — Don UI theo yeu cau "clean va gon gang" cua anh Tien

**Sua gi (dist/index.html):**
- Chip nen tang: bo wrap (10 chip an 3-4 hang doc) -> MOT hang cuon ngang,
  chieu cao co dinh 1 chip du panel hep.
- Legend: truoc hien du 4 muc moi luc -> chi hien LOAI VUNG co mat trong khung
  dang chon (tiktok-video: 2 muc, grid-crop: 2 muc, fb-feed: 1 muc).
- Gop 2 dong meta thanh 1: "1080x1920 - so chinh thuc - so lieu 2026-08-01".
- Xoa footer (lap lai thong tin ngay du lieu da co o meta — mot thong diep
  mot noi) + xoa CSS .chan mo coi + cat chu thua o hint .guides.

**Kiem chung:** node --check sach, khong con tham chieu mo coi (grep chan/
metaDuLieu = 0), do DOM: chips 1 hang = true, legend 2/2/1 dung ngu canh,
57/57 vung van khop JSON, footer = null. Cai lai ban moi 08:50 — Premiere van
chua restart tu 01/08 15:11 nen ban trong Premiere se la ban nay khi anh mo lai.

## 2026-08-01 22:23 — v0.1.0: research 5 nhanh + build panel dau tien + cai dev

**Boi canh:** anh Tien tao folder + file `Brandstorm chuc nang.txt`: tool cho editor
chon nen tang (FB/TikTok/IG/Shorts...) -> sequence hien guideline safe zone. Yeu cau
research ky roi dua so chinh xac vao panel. Anh chot "xong roi thi build di em".

**Research (5 agent song song, ket qua day du trong `nghien-cuu-safe-zone.md`):**
- Meta cong bo theo PHAN TRAM (14/35/6 cho Reels, gop 4 placement tu ~03/2026);
  TikTok co so px chinh thuc trong file ads (130/484/44/140); Google Shorts 10%/25%/10%.
- KHONG nen tang nao co spec may-doc-duoc -> "real time" = JSON minh tu duy tri,
  ra soat moi QUY (spec ads doi 2-4 nam/lan, UI organic doi 1-3 lan/nam).
- Doi thu: chi Guideify ($9-15) lam guide that trong Premiere; KHONG ai co du lieu
  tu cap nhat tu xa. Premiere KHONG co guide-layer kieu AE: track output/enable
  tat la mat ca preview lan export -> khong co cong tac "hien ma khong xuat".
- File `Installed Guides.guides` cua Premiere la JSON thuan, vi tri theo %,
  khong bao gio dinh vao export (da doc file that tren may nay).
- Mot bo so moi nen tang la du (chinh nen tang lam vay; le hong 6% cua Meta
  chinh la khoan tru hao may man dai).

**Build v0.1.0 (theo khuon Re-Frames: dist tinh, khong buoc build):**
- `safe-zones.json` = NGUON CHAN LY: 10 nen tang, 18 dinh dang, 57 vung, moi vung
  co pt (%), px1080 tham chieu, trangThai (chinh_thuc/ben_thu_3/uoc_luong),
  loai (ui/crop/khuyen_nghi), nhan song ngu, nguon.
- `scripts/sinh-du-lieu.mjs`: kiem bat bien (pt<->px lech >1px la FAIL, vung phu
  >95% khung la FAIL) roi sinh `dist/safe-zones.js`. Chay trong sign-install.
- `dist/ve-guide.js`: bo ve DUNG CHUNG cho panel + ban xem truoc (1 nguon ve).
  Ham thuan `tinhVungPx` do kiem duoc khong can DOM.
- `dist/index.html`: song ngu VI/EN tu dong dau (NGON_NGU + t()), chon nen tang
  -> khung hinh -> xem truoc -> CTA "Hien guideline tren sequence". Overlay =
  PNG ve dung kich thuoc sequence, ghi ra `C:/AiOStudio/GuideFrame/` (KHONG dung
  %APPDATA% - bi ao hoa), import vao bin "AiO Guide Frame", dat len track video
  TRONG tren cung. Seq khac ti le khung -> ve vao vung giua dung ti le + lam mo
  ngoai. Tag "TAT TRUOC KHI XUAT" nhung thang vao anh. Canh bao vang khi sequence
  con lop guide. Nut phu "Luu file .guides" (guide goc Premiere, vi tri %).
- `host/guideframe.jsx`: gf_thongTinSeq / gf_datOverlay / gf_tatOverlay /
  gf_demOverlay + gf_phienBan CUOI FILE (chan benh evalFile nuot giua chung).
  Panel $.evalFile lai host truoc MOI lenh (chan benh panel moi - host cu).
  AN TOAN: KHONG dung QE (khong tu them track - het track trong thi bao
  ERR:HET_TRACK kem huong dan); khong dat de len clip nguoi dung; xoa duyet nguoc.
- `xem-truoc-safe-zones.html`: ban duyet bang mat 18 khung cho anh Tien.
- ID `com.aiostudio.guideframe`, cong debug 8096, v0.1.0. Da ky + cai dev OK.

**Da kiem chung (so do that):**
- sinh-du-lieu: 57/57 vung qua bo kiem bat bien.
- Browser: 57/57 vung tinhVungPx khop px1080 tung pixel, 0 loi console,
  0 tran ngang o be rong 300px, nut chinh 34px/nut thuong 28px dung token,
  ban xem truoc 18/18 canvas co net ve.
- node --check sach: ve-guide.js, safe-zones.js, script inline cua index.html.
- sign-install chay tron: ky OK (khong timestamp - TSA loi mang), cai vao
  %APPDATA%\Adobe\CEP\extensions\com.aiostudio.guideframe, du dist/index.html.

**CHUA kiem duoc (Premiere dang chay tu 15:11, chua restart):**
- Panel chua tung mo trong Premiere that -> gf_datOverlay/gf_tatOverlay chua do
  end-to-end. Rui ro da biet truoc: (1) anh tinh mac dinh ~5s, da co 2 lop
  keo dai (setOutPoint truoc khi dat + gan clip.end sau khi dat, doc lai bao
  daiThuc that); (2) mapping orientationType 0/1 trong file .guides suy tu file
  mau, chua doi chieu nguoc — neu nguoc thi guide ngang/doc trao nhau, sua 1 dong.
- Chua thu ghi de "Installed Guides.guides" luc Premiere dang chay (spike 30
  phut, de danh sau khi anh duyet huong).

**Bai hoc:**
- Content farm 2026 bia "thay doi UI" nghe rat that (vi du "TikTok them nut
  playlist 01/2026") — chi tin thay doi co nguon goc (blog chinh chu, bao lon).
- Do DOM khi Browser pane an: clientWidth/innerWidth = 0 -> "tran ngang 264px"
  la so ao. Phai doi chieu scrollWidth voi be rong NOI DUNG truoc khi sua.
