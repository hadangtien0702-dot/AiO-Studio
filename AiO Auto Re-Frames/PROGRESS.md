# AiO Auto Re-Frames - Nhat ky

## [0.5.1] - 2026-08-06 22:06 (UTC+7) - REDESIGN UI THEO CHUAN STUDIO CONSOLE DESIGN SYSTEM

1. **Redesign UI dist/index.html**: Nang cap toan bo giao dien panel AiO Auto Re-Frames theo chuan Studio Console Design System (topbar brand logo, bar selbar giam sat sequence real-time, live preview dynamic animation bam chu the, aspect ratio selector grid, card Shorts theo noi dung voi list checkbox & badge thoi luong).
2. **Xuat file Design System HTML**: Tao file `AiO Auto Re-Frames.html` trong thu muc `AiO Design System/AiO Auto Re-Frames/` khop chuan voi bo file showcase Design System.

## [0.5.0] - 2026-08-01 15:09 (UTC+7) - BAN PHAT HANH DAU TIEN + day bao hiem

1. **Tu luu project truoc khi ghi timeline** (`rf__luuTruoc`): gan vao ca 3 ham
   ghi (rf_lamDoc / rf_catShort / rf_ghepDoan). Giao thuc nay da cuu chinh
   minh HAI lan trong tuan (2 cu sap Premiere, mat 0 du lieu) — nay no cuu
   KHACH tu dong, khong can ai nho. Do: host nap sach, rf__luuTruoc=function.
2. **scripts/package-release.ps1** (moi): dong goi ban phat hanh — khong kem
   .debug, co chot chan "version UI phai KHOP manifest", xuat 1 file SETUP.zip
   (zxp + CAI-DAT.bat + cai-dat.ps1 + huong dan). Ky va VERIFY dat.
   -> `build/AiO-Auto-ReFrames-0.5.0-SETUP.zip`
3. Version 0.1.0 -> **0.5.0** khop 3 cho (manifest x2 + UI topbar).

## Trang thai hien tai  (chot phien 2026-08-01 15:09)

**v0.4.2 da cai — panel hoan thien nhat bo, lam CHUAN cho 4 panel kia.**
Loi: shorts theo noi dung (hoi-dap, ngat cau 0,000s) · bam chu the Sensei ·
do nguoi/mat (COCO+MediaPipe, luat kep) · xuat check 720p bang FFmpeg ·
song ngu VI/EN · onboarding 3 buoc · den trang thai 1s · tu luu truoc khi ghi
(`rf__luuTruoc` — vua gan vao ca 3 ham ghi, da kiem host nap sach).

☠️ CAM TREN BETA 26.5: exportAsMediaDirect + app.encoder (2 cu sap 31/07 +
01/08). Xuat = FFmpeg tu file goc. Thu lai app.encoder tren ban RELEASE.

**Bàn xem cả bộ**: `design-system/xem-bo.mjs` (node, cong 8095, bind LAN) +
`xem-bo.html` — 5 panel iframe canh nhau, nguon la dist that. Da chay, anh
Tien xem duoc tu localhost:8095 va 192.168.2.211:8095. Muon gui ra ngoai:
3 duong da tu van (LAN / tunnel cloudflared / dua len hosting) — CHO anh chot.

[CHO] ke tiep theo bang: noi phu de tu dong vao short · check update + nut
bao loi (co che chung 5 panel) · i18n 4 panel React · Silero VAD (chan ban #1).

## [0.4.2] - 2026-08-01 13:09 (UTC+7) - ONBOARDING LAN DAU (muc cuoi bang nguoi-mua cua panel nay)

Dai huong dan 3 buoc hien LAN DAU mo panel (nguoi thuong khong doc docs):
  1. Mo sequence NGANG chua video dai
  2. Bam "Tim doan theo noi dung video"
  3. Tick doan ung -> "Tao short"
Bam "Da hieu" la bien mat vinh vien (localStorage 'aio-rf-daXemHuongDan').
Song ngu nhu moi chu khac (hd_1..hd_3, hd_ok).

Do tron vong doi qua 8092: hien lan dau DUNG (3 buoc dung chu) -> bam Da hieu
-> mat NGAY -> co da nho "1". Da reset co de anh Tien tu thay trai nghiem
lan-dau khi liec panel.

Bang nguoi-mua cua RE-FRAMES: i18n ✓ · xuat check 720p ✓ · onboarding ✓.
Con lai o muc BO: check update + nut bao loi (lam chung co che ca 5 panel),
i18n 4 panel React, silero VAD, bo cai gop, chu ky so.

## [0.4.1] - 2026-08-01 - ☠️ app.encoder CUNG SAP PREMIERE -> xuat check bang FFmpeg

Anh Tien duyet lam nut xuat MP4 toi da 720p, "lien ket qua Adobe ME render
hang loat cung duoc". Theo giao thuc an toan: LUU project truoc, roi spike
app.encoder.encodeSequence (duong hang doi AME - render ngoai tien trinh).

### ☠️ KET QUA SPIKE: SAP PREMIERE LAN HAI
encodeSequence(seq, mp4, epr chinh chu frame.io 720, 0, 1) -> Premiere bien
mat khoi danh sach tien trinh trong vai giay, AME chua kip mo, khong hop
thoai khong log. Anh Tien xac nhan tu phia anh: "adobe cua anh tu crash".
**Thiet hai: 0** - project da luu ngay truoc spike.

-> KHAC VAO SO CEP (skill 6e-bis da sua): tren Beta 26.5, TOAN BO ho API
xuat tu script (exportAsMediaDirect + app.encoder.*) la CAM. Khong thu lan 3.
Ghi no: thu lai tren ban Premiere RELEASE (khach mua dung ban release).

### Duong thay the DA XAY: xuat check bang FFmpeg tu FILE GOC
- Host `rf_thongTinXuat()` - CHI DOC: duong media + in/out giay + ten seq.
  V1 chi nhan sequence 1 clip (chinh la cac short); nhieu clip thi noi that.
- Panel: khu "Xuat check" + nut "Xuat MP4 check 720p" (song ngu). FFmpeg
  muon cua panel anh em (Transcripts/Autocut, tu do tim), libopenh264 (BSD,
  sach de ban), scale=-2:720, -ss truoc -i. File ra canh video goc
  `<ten seq>-check-720.mp4`. Khong dung API Premiere nao.
- Noi that tren UI: ban check la khung NGANG tu file goc (duong crop doc cua
  Sensei nam trong Premiere, FFmpeg khong tai tao duoc) - khung doc xem tren
  timeline. Xuat ban doc that = File > Export tay, hoac cho do tren ban release.

### NGHIEM THU 01/08 sang - nut that tren panel, DAT
Bam "Xuat MP4 check 720p" tren "Short 1 - Doc 9-16":
    h264 1280x720 · 43,043s (dung dai short 43,04s) · 12,4 MB
    file nam canh video goc, Premiere KHONG bi dung den (khong sap)
Thuoc do cua em lai vap bay encoding (chuoi "Da xuat" meo qua PowerShell nen
poller mu) - tinh nang chay dung, thuoc bao cham. Lan thu ~n cua bai hoc 5j:
moc do phai ASCII thuan.

## [0.4.0] - 2026-07-31 toi - SONG NGU VIET-ANH (chan ban tu bai nhap vai)

Anh Tien: "lam tung cai di em" — cai dau tien trong bang uu tien nguoi mua:
UI song ngu (ban Tay ma UI Viet la khach dong panel).

- Toan bo chu di qua tu dien NGON_NGU (vi/en) + t()/tp() co placeholder.
  KHONG con chuoi cung nao trong logic — them tieng thu 3 chi la them 1 khoi.
- Nut gat VI/EN tren thanh tren, nho lua chon (localStorage 'aio-lang').
- Doi ngon ngu ve lai ca phan DONG (nhan nut theo ti le, den trang thai,
  mo ta) — khong phai mo lai panel.

Do qua nut gat that (8092): VI du bo nhan dung; EN ra "Target frame /
Shorts from content / Whole sequence / Find segments from video content /
Convert whole sequence to vertical 9:16 / Open: ... — ready." Gat ve VI ok.

Panel nay la MAU i18n cho ca bo — 4 panel React con lai dung cung tu dien
2 lop (file rieng cho moi panel + khoi chung), lam o phien sau.

## [0.3.4] - 2026-07-31 22:23 (UTC+7) - DO MAT NGUOI (anh Tien chot tieu chi)

Anh Tien chot cau hoi "ngon tay co tinh khong": **"do MAT nguoi"**.

### ☠️ BlazeFace BIA MAT — bat duoc nho soi mau bang mat
Ban do mat dau (BlazeFace, nguong 0.8): cham **0,92 cho NGON TAY cam chip**,
thay "mat" trong chum den tim va ong kim loai (90 khung co "mat" ma khong co
"person"). BlazeFace sinh cho camera selfie — tha vao footage may moc la ao
giac, va DIEM CUA NO KHONG PHAN BIET duoc (0,92 > moi nguong hop ly).
-> Vut ket qua, doi model. Khong co buoc "soi mau bang mat" thi bo du lieu
rac nay da thanh sequence giao cho anh.

### Ban chay that: MediaPipe Face Detector (tfjs, full) + LUAT KEP
Co MAT NGUOI = MediaPipe thay mat **VA** COCO-SSD thay person cung khung
(do hoa bia mat -> person chan; tay/chan khong mat -> mat chan).

| | So do |
|---|---|
| MediaPipe mat / COCO person / LUAT KEP | 654 / 763 / **610** tren 1.650 khung |
| Ca then chot | ngon tay LOAI ✓ · 2 nguoi noi GIU ✓ · den tim LOAI ✓ |
| Soi mat 6 mau | 6/6 dung theo tieu chi |
| Doan >=4s | **99 doan, tong 20:18** (person-only: 94 doan / 25:38) |
| Sequence "Chi Doan Co Mat Nguoi" | **99/99 hinh + 99/99 tieng · 1.217,88s vs 1.218,00s (lech 0,12s/99 moi) · 0 loi** |

### Ranh gioi cua tieu chi "MAT nguoi" — bao anh Tien roi, ghi lai
Nguoi mac do phong sach TRUM KIN MAT va bong nguoi silhouette deu bi LOAI —
co nguoi nhung khong thay mat. Do la dung nghia den tieu chi anh chon; neu
muon giu ca ho thi dung ban person-only (van con sequence "Chi Doan Co Nguoi").

Ca hai sequence deu tren timeline, project DA LUU.

## [0.3.3] - 2026-07-31 toi - ANH TIEN PREVIEW, DUYET SO BO

Anh Tien mo xem ket qua (sequence "Chi Doan Co Nguoi" + cac short) va bao
*"thay cung kha on"*. Day la phep kiem MAT NGUOI dau tien qua — chat luong
bam chu the va noi dung doan cat o muc chap nhan duoc voi editor 5 nam nghe.
Chua phai nghiem thu cuoi: moi la preview nhanh, chua soi tung moi noi.

## [0.3.2] - 2026-07-31 18:17 (UTC+7) - ten khong trung + danh sach doan theo VIDEO

Hai bao loi cua anh Tien trong ngay:

1. *"chung no bi luu de"* — soat ra co HAI sequence trung ten "Test3 Insane -
   Doc 9-16" (chay luong "ca sequence" 2 lan la trung). Sua: moi ten sequence
   sinh ra deu qua `rf__tenKhongTrung` — trung thi " (2)", " (3)"...
   Ap cho ca rf_lamDoc / rf_catShort / rf_ghepDoan.
2. *"anh chuyen sequence thi cung mac dinh la 10 cau hoi ha em?"* — danh sach
   doan cua video CU dung li khi doi sang video KHAC. Sua goc: vong soi 1s
   doc them duong media cua sequence dang mo; media DOI thi danh sach tu don
   + moi quet lai. Doi giua cac sequence CUNG video (ban goc <-> shorts cua no)
   thi danh sach giu nguyen — no la thuoc tinh cua VIDEO, dung nghia.

Kem: soat marker per-sequence cho thay ban doc (clone) KE THUA 60 marker cua
ban goc — khong phai cam nham. Ghi nhan la hanh vi clone cua Premiere; co xoa
marker thua ke tren ban sao hay khong la quyet dinh san pham CHO ANH TIEN.

## [0.3.3] - 2026-07-31 18:35 (UTC+7) - BAI TEST "CAT DOAN CO NGUOI": DAT

De bai anh Tien: *"chon mot clip dai va cat ra toan bo doan video CO NGUOI dua
vao mot sequence moi"*. Video Machine 54:59. Ket qua:

| Buoc | So do |
|---|---|
| Tach khung (FFmpeg 0,5fps 320px) | 1.650 khung |
| Do nguoi (COCO-SSD lite, nguong 0.5) | 763/1.650 khung co nguoi (46,2%) |
| Ghep doan (lap ho <=4s, bo <4s) | **94 doan, tong 25:38** |
| SOI MAT 6 mau | 6/6 dung (2 nguoi noi + 1 NGON TAY cam chip / 3 do hoa khong nguoi) |
| Dung sequence "Chi Doan Co Nguoi" (rf_ghepDoan) | **94/94 clip hinh + 94/94 clip tieng · dai 1.537,99s vs mong muon 1.538,00s (lech 0,01s tren 94 moi noi) · 0 loi** |

Ca ranh gioi dang bao: model tinh NGON TAY la "person" (dung nghia den "co
nguoi trong hinh"). Muon "co MAT nguoi" thi doi tieu chi — quyet dinh san pham.

Toc do: don luong ~15 phut -> **12 tien trinh song song ~5 phut** (48% CPU
toan may; cham hon 12x ly thuyet vi 12 con chen bang thong bo nho). Duong
toi uu cho ban san pham da ghi: do chuyen canh truoc -> 1 khung/canh -> muc
tieu video 1 gio duoi 1 phut. GPU de danh khi can.

Giay phep: TFJS + coco-ssd = Apache 2.0 (ban thuong mai OK, kem notice nhu
FFmpeg). ☠️ TRANH YOLO/Ultralytics — AGPL, dinh la phai mo ma nguon ca tool.

### Bay da tra gia trong bai test
1. rf_ghepDoan viet vao NGUON nhung quen sign-install -> goi ham chua ton tai
   o ban cai -> "EvalScript error." — dung bay host-cu, lan nay o chieu cai.
2. Thuoc do cho ket qua don luong dat tran 120s/10phut — viec that lau hon.

## [0.3.x-test] - 2026-07-31 - BAI TEST "CAT DOAN CO NGUOI" (dang chay)

Anh Tien ra de: *"chon mot clip dai va cat ra toan bo doan video CO NGUOI dua
vao mot sequence moi"* — bai thi giac, khac nao transcript.

Cach lam (offline, khong goi API ngoai):
- FFmpeg tach khung 0,5fps 320px (video Machine 55 phut -> 1.650 khung)
- COCO-SSD (TensorFlow.js, lop "person", nguong 0.5) chay Node tren may
- Ghep khung -> doan: lap ho <=4s, bo doan <4s
- Host moi `rf_ghepDoan(duong, "a,b;...", ten)`: doan dau
  createNewSequenceFromClips (hinh + tieng), cac doan sau overwriteClip noi
  tiep, moc dat doc lai tu track (bai hoc lam tron fps cua Autocut),
  DO LAI so clip + tong dai truoc khi bao OK.

## [0.3.1] - 2026-07-31 18:04 (UTC+7) - SAP XEP LAI UI THEO VAI MOI

Anh Tien: "em thiet ke lai UI cho chuan chi". Shorts theo noi dung nay la
tinh nang LOI -> bo cuc xep lai theo vai:

1. Minh hoa (khung 16:9 tinh + khung phu bay vao) — giu nguyen kich ban da chot
2. Den trang thai (soi 1s)
3. KHUNG DICH (dung chung ca hai luong)
4. **SHORT THEO NOI DUNG** — luong chinh, mang nut cam DUY NHAT cua man:
   "Tim doan theo noi dung video" -> co danh sach thi nut cam DOI VAI thanh
   "Tao N short <ti le>", nut Tim lui ve dang vien "Tim lai"
5. **CA SEQUENCE** — luong phu, nut vien "Tao ban <ti le> cho ca sequence"
6. canLam / loi / bien lai chung o cuoi

Sua kem: den trang thai khoa CA HAI luong (truoc chi khoa luong phu); chot
`dangTim` chan vong soi 1s mo lai nut giua chung viec tim.

### Do bang so truoc khi bao xong (qua 8092, bam nut that)
- Truoc khi tim: nut cam = ["Tim doan theo noi dung video"], 1 nut vien
- Sau khi tim (10 doan): nut cam = ["Tao 10 short doc 9:16"] — van DUNG MOT
  nut cam; "Tim lai" + "Ca sequence" thanh vien
- Mo sequence DOC: ca hai luong tu khoa (timKhoa=true, seqKhoa=true), den noi ly do
- Tuong phan CO TRON ALPHA tren nen bg-2: thap nhat **5,54** (nhan khu / mo ta),
  nut chinh 6,24, con lai 10,4+ — **8/8 cho dat AA**, khong cho nao duoi 4,5

Project da luu, active sequence tra ve Test3 Machine.

### Con no UI (ghi de khoi quen)
- Bang so sanh 4-panel (`so-sanh.html`) + `kiem-dong-bo.ps1` van danh sach
  cung 4 panel — chua co Re-Frames. Can them truoc khi khoa design.
- Mat anh Tien duyet tong the — may do gia tri, mat do can doi.

## [0.3.0] - 2026-07-31 15:39 (UTC+7) - MVP "TU TAO SHORT THEO NOI DUNG" CHAY THAT

Anh Tien chot MVP (nguyen van trong CLAUDE.md): tool tu do luong noi dung bang
transcripts, dua ra cac doan phu hop, KHONG ep 60s — uu tien bat het y cua mot
cau hoi duoc tra loi tron.

### Da xay
- Host: `rf_duongDanMedia()` (doc duong media cua seq dang mo) ·
  `rf__timItemTheoDuong` (khop item theo duong dan, chuan hoa gach/hoa thuong) ·
  `rf_catShort(duong, in, out, W, H, ten)` (cat doan -> seq khung dich -> gan
  Sensei; KHONG can clone) · `rf__ganEffectLenSeq` dung chung ca hai duong.
- Panel: khu "Tu tao short theo noi dung" — nut tim doan (doc dem
  `.autocut-nghe.json` canh video bang Node fs), danh sach ung vien co tick
  (giay + cau hoi), nut "Tao N short <ti le>" chay tuan tu co tien do.
- Nao chia doan: cau "?" -> het cau truoc cau "?" ke; dai mem 20-180s; tran 12.

### Nghiem thu qua NUT THAT tren panel (video Machine 54:59, dem san)
- Tim doan: **10 ung vien** hoi-dap tron y, hien giay + cau hoi.
- Tao 2 short dau:

| | Khung | Dai (ung vien) | Effect | Key bam |
|---|---|---|---|---|
| Short 1 - Doc 9-16 | 1080x1920 | **43,04s** (43,0) | co | **93** |
| Short 2 - Doc 9-16 | 1080x1920 | **49,30s** (49,3) | co | **109** |

Dai lech ung vien < 1 khung hinh -> **ngat cau dung** giu nguyen qua duong ong.
43s va 49s — dung tinh than "khong ep 60s, tron y la chinh". Project DA LUU.

### THUOC DO SAI LAN NUA (ghi de khoi lap)
Poller cua em dat tran 120s; viec that (2 short + Sensei chen giua) xong SAU
moc do -> bao "QUA 120S" trong khi taoKq da ra "Da tao 2/2". Doc truc tiep DOM
+ ping engine moi ra su that. -> Cho viec co Sensei chay nen: moc xong la
TRANG THAI (taoKq xuat hien), khong phai dong ho; tran phai rong hon nhieu.

### Chua lam / cho
- Chat luong bam cua TUNG short: mat anh Tien (bam play tren timeline).
- "Cau CHU DE" (video khong co cau hoi) — nao v2, chua lam.
- Phu de len short · xuat nhap · nut chinh cua man hinh nen la gi khi shorts
  thanh tinh nang loi — cho anh Tien chot.

## [0.2.1] - 2026-07-31 15:2x (UTC+7) - MINH HOA THEO KICH BAN ANH TIEN + topbar tu lanh

Anh Tien chot kich ban minh hoa qua 3 tin nhan: (1) "ti le khung hinh va nguoi
phai duoc thay doi tuong ung", (2) khung nguon phai la 16:9 that, (3) *"khung
16:9 cu de no la khung chinh DUNG YEN, chon ti le thi khung phu cua ti le se
VAO"*. Lam dung vay:

- Khung chinh 16:9 dung yen (san khau = video nguon), nguoi dung trong khung.
- Chon ti le -> khung phu BAY VAO (fade + scale 450ms) om lay nguoi, roi nguoi
  dich nhe va khung phu BAM theo (tre 180ms cho ra dang duoi).
- Moi kich thuoc tinh tu HINH HOC THAT bang JS (Web Animations API), khong co
  so trang tri. Doi ti le / resize panel deu tinh lai.

Do that qua 8092 (bam tung nut ti le, doc rect):

| | Khung chinh | 9:16 | 1:1 | 4:5 |
|---|---|---|---|---|
| Do duoc | 520x291 (ti le 1,787 ~ 16:9) | rong 157 | 279 | 223 |
| Hinh hoc dung | 518x291,4 | 156,9 | 279 | 223,2 |

2 hoat canh song moi lan doi ti le (vao + bam).

### Fixed - topbar "EvalScript error." treo vinh vien
Panel hoi host DUNG MOT LAN luc boot; Premiere chua san sang la chu loi dung
do mai. Sua goc: gop phien ban + project + sequence + khung vao MOT cu doc
moi giay (khong can nap host) -> thanh tren va den TU LANH o nhip ke.
Do sau sua: "Premiere 26.5.0 - Test3.prproj" hien dung.

## [0.2.0] - 2026-07-31 15:08 (UTC+7) - DUNG LAI UI SAU KHI ANH TIEN REJECT

Anh Tien nhin v0.1: *"cai panel nay ma dem di ban thi lam sao ma lay tien nguoi
ta duoc em... hien thi len cho anh la reject thang"*. Dung — mot dong chu + mot
nut giua khoang den, khong phai san pham.

Doc MASTER.md (10 loi) + LESSONS.md truoc khi sua. v0.2 theo ngon ngu cua bo:
- **Minh hoa dong** (chu ky cua bo): nguoi di chuyen trong khung ngang, khung
  9:16 mau accent DUOI THEO, vung ngoai toi di — ke viec "bam chu the" bang
  hinh, chay 1 lan 3,6s.
- **Den trang thai song** (soi 1s, chot chan goi chong — bai hoc Transcripts):
  noi ten sequence dang mo + kich thuoc + du dieu kien chua; nut tu khoa khi
  khong hop le.
- **Chon khung dich VE BANG HINH** (loi #8: lua chon phai tra loi "khac gi"
  ngay): 9:16 / 1:1 / 4:5, moi cai mot hinh ti le that + mot dong nen tang.
- Host nhan tham so: rf_lamDoc(rong, cao, nhan) + rf_trangThai() (chi doc).
- Guard mo rong: chan moi nguon khong phai ban ngang (>=).

Do sau cai: v0.2.0 hien dung, den bao "khong phai ban ngang" chinh xac khi
dang mo ban doc, 3 nut ti le co hinh, minh hoa chay. **CHO MAT ANH TIEN duyet.**

### Do "bam theo noi dung" bang so (phuc vu cau hoi cua anh)
- Clip doc Gnostic 39 phut: Position cua Auto Reframe co **3.641 keyframe**.
- Short 60s: 142 key, X di 0,22 -> 0,90 (bien do 1,69) — duoi theo noi dung that.
- Scale (Auto Generated) = 177,78% = 1920/1080, dung cong thuc phu khung doc.
- ☠️ `seq.exportFramePNG` KHONG ton tai tren Beta 26.5 — muon nhin khung hinh
  phai qua duong xuat (AME queue) hoac mat nguoi trong Premiere.

## [0.1.0] - 2026-07-30 16:0x (UTC+7) - PANEL CHAY THAT SAU KHI RESTART PREMIERE

Anh Tien tat han Premiere, mo lai, mo panel. Do qua cong 8092:

| Buoc | Ket qua |
|---|---|
| Panel nap, cau ExtendScript | topbar doc dung "Premiere 26.5.0 - Test3.prproj" |
| Bam nut that tren seq ngang (Test3 Gnostic) | **3,9s** -> "Test3 Gnostic - Doc 9-16", 1 clip bam, 1080x1920, 0 loi |
| Bam lai tren seq DOC | **200ms** -> canLam "Sequence nay da la ban doc roi" - KHONG de them ban sao |

### Fixed - CHAN CHAY TREN SEQUENCE DA DOC (lo ra ngay lan test dau)

Script test doi sequence bi loi cu phap PowerShell -> nut chay tren chinh ban
doc dang mo -> panel ngoan ngoan de ra "... - Doc 9-16 - Doc 9-16" voi bien lai
"0 clip" khong loi giai thich. Nguoi dung that se dam dung vet nay (ho vua tao
ban doc xong thi timeline DANG DUNG o do).

Sua hai lop:
- Host: khung goc height > width -> tra ERR:DA_LA_BAN_DOC truoc khi clone.
- Panel: ma do thanh cau canLam (khong do); va daCoSan > 0 thi noi ro
  "N clip da duoc bam tu lan chay truoc" - bien lai "0 clip" cam khong con.

Seq loi "... - Doc 9-16 - Doc 9-16" da xoa (deleteSequence, kiem lai danh sach).

## [0.1.0] - 2026-07-30 15:43 (UTC+7) - SINH RA: spike 5/5 dat + chuc nang loi chay that

Lenh anh Tien: "lam chuc nang tu dong thay tracking chu the va thay doi khung
hinh tu ngang sang doc di em".

### Kien truc chot: BOC Auto Reframe (Sensei) cua Premiere, khong tu lam ML
Ly do: offline, di kem host, khong bundle model, khong them ganh ban quyen.
Panel lam phan Adobe bat lam tay: nhan ban sequence + doi khung + gan effect
hang loat.

### 5 spike do that tren Premiere Beta 26.5 (qua cong 8091, sequence rac)
1. Motion component: CO - AE.ADBE Motion, du Position/Scale/Crop
2. Ghi keyframe Position: DUOC - ghi [0.3,0.5]@1s + [0.7,0.5]@3s, doc lai
   DUNG TUNG SO. areKeyframesSupported=true. Scale set 178 doc lai 178.
3. setSettings doi khung: 1920x1080 -> 1080x1920, doc lai dung
4. Auto Reframe qua QE: getVideoEffectByName tra effect that (name khac rong
   - TEN BIA cung tra object nhung name RONG, phai kiem name). addVideoEffect
   1 lan duy nhat: components 2 -> 3, matchName AE.ADBE AEFilterAutoFramer
   (doc lai bang API chinh thuc)
5. seq.clone(): so sequence 4 -> 5

### Chuc nang loi rf_lamDoc - chay that lan dau DAT
Tren sequence "Test3 Insane" (1 clip video 26:17):
    seqMoi=Test3 Insane - Doc 9-16
    khung=1080x1920  tongClip=1  daGan=1  daCoSan=0  soLoi=0
Ban goc khong bi dung. Timeline tu nhay sang ban doc.

### Da dung
- host/reframe.jsx: rf_probe (chi doc) + rf_lamDoc (clone -> diff sequenceID
  tim ban sao -> setSettings 1080x1920 doc lai kiem -> gan effect tung clip,
  bo qua clip da co, doc lai components moi tin)
- dist/index.html: panel tinh v0.1, mot nut "Tao ban doc 9:16", dung
  tokens.css cua design-system, nhan loi tach canLam/loi
- CSXS/manifest.xml (com.aiostudio.reframe) + .debug cong 8092
- scripts/sign-install.ps1: muon ZXPSignCmd + chung chi chung cua bo AiO
- DA CAI vao %APPDATA%\Adobe\CEP\extensions\com.aiostudio.reframe

### VIEC KE TIEP - xep theo do chan
1. [CHO ANH TIEN] TAT HAN Premiere, mo lai, Window > Extensions >
   "AiO Studio - Re-Frames", bam thu tren sequence that va NHIN chat luong
   tracking - may chi kiem duoc "da gan effect", khong kiem duoc "bam dung
   nguoi".
2. [CHO] Do sequence NHIEU clip / nhieu track / co khoang trong - QE
   getItemAt co the dem lech voi clips[] khi track co gap. Spike tren
   project rac truoc.
3. [CHO] Doc/ghi tham so Motion cua effect (slower/default/faster).
4. [CHO] Them ti le 1:1 va 4:5 (cung duong ong).
5. [CHO] Dua panel vao dong-bo-tokens.ps1 + kiem-dong-bo.ps1 (danh sach
   dang cung 4 panel, nay la 5).
6. [CHO] version.mjs cua design-system: them panel nay vao kiem khop version.
