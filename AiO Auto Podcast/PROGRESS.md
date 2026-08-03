# AiO Auto Podcast - Nhat ky

## [tu-sync] - 2026-08-03 15:51 - CUU dist/ (3 PANEL) + TU DO OFFSET, DUNG SEQUENCE THU

Anh Tien chot 2 viec: (1) chep dist ve repo va commit luon; (2) em tu tao
project rieng, tu do offset — KHONG dung project that cua anh.

### 1. CUU dist/ — nguyen nhan goc la .gitignore, khong phai tai nan
`.gitignore` dong 9 co `dist/` — dung cho panel CO BUILD, nhung 3 panel
KHONG build thi `dist/` chinh LA MA NGUON viet tay. Quy tac chung nuot mat
chung trong im lang.

Do that truoc khi sua:

| Panel | dist tren o | git theo doi | ban da cai |
|---|---|---|---|
| Auto Podcast | MAT SACH | 0 file | con |
| Guide Frame | MAT SACH | 0 file | con |
| Re-Frames | con 3 file | 0 file | con |
| Auto Cut Short | chua co code | 0 | chua cai |

-> Khong va rieng Podcast (bai hoc 5n): sua ca 3. Them ngoai le
`!/​<panel>/dist/` — phai un-ignore CHINH THU MUC vi git khong descend vao
thu muc bi ignore, un-ignore file ben trong khong co tac dung. Da kiem
`git check-ignore`: ca 3 duong dan khong con bi chan.

Chep dist tu ban da cai ve repo cho Podcast + Guide Frame. Re-Frames doi
chieu MD5: 3/3 file giong het ban cai.

Kiem chung (chay tu REPO sau khi chep, khong phai ban sao scratchpad):
- `tests/kiem-nao.mjs`: **16/16 DAT**, ranh lech 0 ms
- `tests/stress.mjs` : **12/12 ca bat buoc DAT**, dung 100% moi ca
- Ca "cuoi-chung 2s" ra 10/10 -> dung ban v0.3.1, khong mat chuc nang.
- Commit `f6c7e70`, 15 file, 5181 dong. 12 file dist nay da nam trong git.

### 2. TU SYNC — do offset bang tuong quan cheo, co THUOC NGOAI cham
Tach tieng 6 file cam 4K (~17 GB/file) -> wav 8kHz mono: **25-28 giay/file**
(ffmpeg seek theo index, khong doc het file). Envelope dB chuan hoa (bo
trung binh, chia do lech chuan) roi tuong quan cheo: quet tho 0,2s +-12
phut, tinh chinh 20ms.

Ket qua (BUOI 2 = C4026/C4234/C4089 + Trong2/Dilys2): r = 0,71-0,75,
offset +1,74 / +1,56 / +1,18 giay.

**THUOC NGOAI:** `PR\Audio.xml` cua anh Tien co "Synced Sequence" do
**PluralEyes** sync — cong cu doc lap hoan toan. Doi chieu:

| Cap | Em do | PluralEyes | Lech |
|---|---|---|---|
| C4026 - C4234 | +0,180s | +0,167s | 0,32 frame |
| C4026 - C4089 | +0,560s | +0,584s | 0,57 frame |
| C4234 - C4089 | +0,380s | +0,417s | 0,89 frame |
| **C4026 <-> mic (tuyet doi)** | **+1,740s** | **+1,752s** | **0,30 frame** |

Lech trung binh **0,59 frame**. Day la lan dau tien cac con so cua du an
duoc cham bang thuoc DUNG NGOAI thuat toan (bai hoc 5d).

**PluralEyes KHONG sync duoc mic Trong(2)** — no vut file do vao dong cuoi
timeline (frame 130753, cung cho voi C4023/C4088 la cac clip vun). Em sync
duoc, va vi tri em tinh ra (66828) TRUNG KHIT voi Dilys(2) ma PluralEyes
dat — dung nhu ky vong (cung may ghi, chia file cung luc).

### ☠️ EM DA KET LUAN SAI MOT LAN — nguong tin cay qua chat
Truoc khi doi chieu, em bao "buoi 1 khong co mic" vi dat nguong r >= 0,25
va cap buoi 1 chi ra r = 0,13-0,17. **Sai.** Doi chieu PluralEyes:

| Cap | Em do (lag) | PluralEyes | |
|---|---|---|---|
| C4025 <-> Thien(1) | -10,4s | -10,34s | khop |
| C4233 <-> Thien(1) | -3,2s | -3,13s | khop |
| C4087 <-> Thien(1) | -3,8s | -3,71s | khop |

**Lag em do dung ca 3, chi co r thap.** Nguong tin cay tu dat da loai nham
cap DUNG. Bai hoc: voi tuong quan cheo, **dinh o dung mot cho qua nhieu cap
doc lap** la bang chung manh hon gia tri r tuyet doi. Neu sau nay lam tinh
nang tu sync, ĐUNG chan bang nguong r cung — hay xet tinh nhat quan giua
cac cap.

### 3. SEQUENCE THU da dung
`file pr for test\podcast-buoi2\PODCAST-BUOI2-da-sync.xml` (7,7 KB) —
FCP7 xmeml theo dung khuon Premiere tu xuat (doc mau tu `PR\Audio.xml`).
- 3 track video (Cam1/2/3) + 2 track audio (mic Trong, mic Dilys)
- **Moi track dung 1 clip lien** -> thoa rang buoc MVP cua tool
- Vi tri frame: 42 / 38 / 28 (lay tu PluralEyes), mic o 0
- Dai 63.926 frame = 44,44 phut @ 23,976 fps
- Mic dung ban copy TEN ASCII (`Mic-Trong.mp3`/`Mic-Dilys.mp3`, MD5 giong
  ban goc) de ne ky tu U+F022 lam Premiere mat link.

Kiem chung: `XmlDocument.Load` -> hop le (well-formed); giai ma pathurl ra
dung 3 duong dan that; dem duoc 3 track video + 2 track audio, moi track 1
clip.

**CHUA KIEM:** chua import thu vao Premiere. Khong tu lam vi Premiere dang
mo project that cua anh Tien, import se tao sequence trong project do.
Buoc nay can anh Tien.

### File anh huong
- `.gitignore` (goc AiO Studio) — them 3 ngoai le
- `AiO Auto Podcast/dist/` · `AiO Auto Guiline Frame/dist/` ·
  `AiO Auto Re-Frames/dist/` — dua vao git
- `file pr for test\podcast-buoi2\` — 2 mp3 ten ASCII + 1 XML sequence
- Ban do trong scratchpad: `tach-tieng-cam.mjs` · `do-offset.mjs` ·
  `soi-buoi1.mjs` · `doi-chieu-offset.mjs` · `sinh-sequence.mjs`

### Con no
1. Anh Tien import XML -> mo panel Auto Podcast -> chay that (chua lam).
2. Anh cham 12 clip nghe kiem (`podcast-nghe-kiem\_BANG-CHAM.csv`).
3. Nguong 6 dB / san -50 dB van chua sua — doi dap an.

## [do-lieu-that] - 2026-08-03 15:34 - DO NAO TREN LIEU PODCAST THAT + PHAT HIEN MAT dist/

Anh Tien dua lieu that: `G:\Quay PV tuyen dung_DRT_0902\Video` (+ folder
`Audio` canh no). Day la mon no ghi trong CLAUDE.md: "CHUA do bleed tren
lieu THAT". KHONG sua mot dong ma nguon nao trong phien nay — chi DO.

### Boi canh: lieu that khong giong gia dinh
Do ra KHONG phai 1 podcast 3 nguoi, ma la **2 buoi phong van rieng, moi
buoi 2 nguoi**, anh Trong dan ca hai buoi:

| | Buoi 1 (video ~40,4 phut) | Buoi 2 (video ~44,3 phut) |
|---|---|---|
| Mic | Trong (1) + Thien (1) | Trong (2) + Dilys (2) |
| Tuong quan envelope trong buoi | r = 0,52 | r = 0,54 |
| Tuong quan CHEO giua 2 buoi | r ~ 0,02 (khac thoi diem) | |

Video: 3 cam x 4K x 24000/1001 fps, moi cam quay ca 2 buoi.
Ca 5 file mp3 deu dung 44,25 phut / 106.199.040 byte — do may ghi tu chia
theo dung luong (320kbps x 2655s), KHONG phai chia theo nguoi.
L va R trong moi file r = 1,0000 -> mono nhan doi, moi file = 1 mic. Dat.

### HAI BAY TRONG CHINH DU LIEU (bat duoc truoc khi no cam vao san pham)
1. **Ky tu U+F022 trong ten file.** `Quay Phim 9<U+F022>2 ...mp3` — do dau `"`
   hop le tren Mac, Windows map sang vung Private Use Area. Truyen ten nay
   qua PowerShell 5.1 sang ffmpeg.exe -> "No such file or directory" o CA 4
   FILE, du Get-ChildItem doc duoc binh thuong. Ne bang cach copy sang ten
   ASCII. 8.3 shortpath KHONG cuu duoc (o G: tat 8dot3name).
   -> Ban ban PHAI xu ly: nguoi dung Mac-sang-Windows se dinh 100%.
2. **File trung y het.** `Dylis (2).mp3` trung TUNG BYTE voi
   `Quay Phim 9"2 Dilys (2).mp3` (cung MD5) — thua 101 MB. Neu gan ca hai
   lam 2 nguoi khac nhau thi chenh luon = 0dB, nao se tra KHONG_PHAN_BIET.

### PHAT HIEN CHAN: thu muc dist/ MAT khoi repo
`dist/nao.js` + `dist/index.html` KHONG con trong repo va **chua bao gio
duoc git theo doi** (`git ls-files` khong co dong nao ve dist) -> khong co
ban lui. Toan bo file repo cung mot moc 2026-08-02 21:22:41 = mot lan chep
de hang loat; dist bi bo lai vi untracked.

Ban duy nhat con lai tren may: panel DA CAI o
`%APPDATA%\Adobe\CEP\extensions\com.aiostudio.podcast\dist\`.

**Do that tren ban sot do (chay trong scratchpad, khong dung ban dang chay):**
- `kiem-nao.mjs`: **16/16 DAT**, ranh lech 0 ms.
- `stress.mjs`: **12/12 ca bat buoc DAT**, dung 100% moi ca.
- Ca 2 "cuoi-chung 2s" ra **10/10** (dung dap an) -> ban sot CO chot chuyen
  nguoi, tuc dung la v0.3.1. Doc code xac nhan: K_ONSET=25, NG_X=15, NG_CUR=5.
- `index.html` co `banDo` 12 lan -> co UI ban do track (v0.3.0).
=> **Khong mat chuc nang nao**, chi can chep nguoc ve repo (CHO ANH TIEN DUYET).

### KET QUA NAO TREN LIEU THAT — bleed nang hon du doan nhieu
Chay nao that (`AiONao.doDb` + `aiDangNoi`) tren 2 cap mic, 44,25 phut/cap:

| Phep do | Buoi 1 | Buoi 2 |
|---|---|---|
| trangThai | OK | OK |
| tyLeRo (nguong gay an toan 20%) | 30,6% | **23,0%** — sat mep |
| So luot / mat do | 120 luot · 2,7 nhat/phut | 79 luot · 1,8 nhat/phut |
| Chia hinh | Trong 21,3% / Thien 78,7% | Trong 32,7% / Dilys 67,3% |
| **Chenh mic to nhat vs mic nhi (p50)** | **7,1 dB** | **6,2 dB** |
| % cua so co tieng chenh DUOI 6 dB | **35,0%** | **46,5%** |
| Thoi gian chay nao | 8 ms | 10 ms |

Lieu tong hop tu truoc gio dung bleed -16 dB (chenh rat ro). Lieu that chi
chenh 6-7 dB -> **nguong 6 dB dang nam dung giua dai du lieu that**, khong
con khoang an toan.

Chot an toan "mic deu" cho qua ca 4 mic (dai p90-p10 = 15,4 den 26,2 dB) —
dung, khong bat oan.

### KET QUA KHONG ON DINH — bang chung
Quet nguong tren buoi 2 (san x chenh):

| san | chenh | tyLeRo | luot | nhat/phut | chia hinh |
|---|---|---|---|---|---|
| -50 | 6 dB | 23,0% | 79 | 1,8 | 33/67 |
| -55 | 6 dB | 29,3% | 105 | 2,4 | 38/62 |
| -60 | 6 dB | 36,0% | **171** | 3,9 | **50/50** |
| -65 | 6 dB | 37,6% | 215 | 4,9 | 57/43 |

Chi ha san 10 dB ma chia hinh nhay 33/67 -> 50/50 va so nhat cat gap doi.
Nhay den muc do thi CHUA duoc tin bat ky gia tri nao. Buoi 1 on dinh hon
(21/79 -> 25/75) nhung cung khong chung minh duoc gi.

**Nghi van huong sua (CHUA sua):** san -50 dB la HANG SO CUNG, ma mic buoi
nay thu nho (p90 chi -44 dB, p50 -54 dB) nen no loai 60-78% so cua so.
San nen tinh theo MUC NEN CUA CHINH FILE, khong phai so co dinh. Nhung
chua co dap an thi sua la sua mu — doi anh Tien cham tai truoc.

### GIOI HAN PHAI NOI RO (bai hoc 5d)
Moi con so tren deu do em dung **chinh nang luong dB** de cham diem mot
thuat toan **cung chay bang dB** — thuoc lam bang cung vat lieu voi cai no
do thi luon tu khen minh. Chi duoc noi "chay ra ket qua trong hop ly",
KHONG duoc noi "cat dung".

Da dung bo NGHE KIEM lam thuoc ngoai:
`file pr for test\podcast-nghe-kiem\` — 12 clip 6 giay (6 moi buoi, chon
bang PRNG co seed 2026/803), moi clip la mot moc tool bao CHUYEN NGUOI,
moc nam o giay thu 3, tron 2 mic + loudnorm de nghe nhu trong phong.
Kem `_BANG-CHAM.csv` de anh Tien danh Dung/Sai.

### File anh huong
- KHONG sua ma nguon nao. Chi them thu muc lieu thu:
  `file pr for test\podcast-nghe-kiem\` (12 mp3 + 1 csv, ~850 KB).
- Ban do trong scratchpad phien nay: `phan-tich.mjs` · `chay-nao-that.mjs` ·
  `quet-nguong.mjs` · `sinh-nghe-kiem.mjs`.

### Con no sau phien nay
1. Chep `dist/` tu ban da cai ve repo — CHO ANH TIEN DUYET (ghi vao repo).
   Va lan nay phai **commit dist vao git**, dung de untracked nua.
2. Anh Tien cham 12 clip nghe kiem -> co dap an moi dong vao nguong.
3. Chua dung thu tren Premiere voi project that (`Quay PV tuyen
   dung_DRT_0902.prproj`) — viec nay CHO ANH DUYET, va neu lam thi chi chay
   tren BAN SAO (bai hoc undo 29/07).

## [0.3.1] - 2026-08-02 20:56 - STRESS TEST 12 CA KHO + SUA NAO "CUOI CHUNG"

(Ghi chu ngay thang: cac muc 0.1.0 -> 0.3.1 deu la viec lam trong PHIEN
02/08. Phien 01/08 chi lam spike nao (muc 0.1.0-spike tro xuong). Truoc do
ghi nham la 01/08 vi suy tu context thay vi chay lenh date — da sua.)

Anh Tien: "tao stress test voi cac tinh huong audio va video kho khan hon".
Viet tests/stress.mjs — 12 ca co dap an theo cua so 20ms, cham DAT/TRUOT:
chong lan 1s · cuoi chung 2s · u-hu 0.35s · bleed nang dan (-12 -> -6.5) ·
mic lech 13dB · nen on -44dB · im lang 12s · doc thoai 90/10 · 3 nguoi chen ·
60 PHUT (~227 luot) · chot "mic deu" (tone/nhac/mic that/mic cam) ·
sample rate lan 44.1k+48k qua FFMPEG THAT.

STRESS BAT DUOC 1 LOI THAT: ca "cuoi chung" ra 12 luot thay vi 10 — hai
nguoi cung to thi vai cua so trung hop am tiet chenh du 6dB, nao nhay cam
sang nguoi cuoi roi nhay ve (dung kieu "cat may moc" nguoi ta che AutoPod).

Sua goc trong nao.js: CHOT CHUYEN NGUOI — muon doi sang X tai mot moc thi
trong 0,5s ke tiep X phai ro >=60% cua so va nguoi dang giu hinh gan nhu im
(<=5/25 cua so ro). Vao luot sach thi cua so dau da dat ngay nen ranh khong
suy suyen (do lai: van 0ms).

Ket qua sau sua (moi con so deu do that):
- kiem-nao: 16/16 DAT, ranh van 0ms — va khong con lech.
- stress: 12/12 ca bat buoc DAT, dung 100% moi ca.
- 60 phut / 227 luot: sinh lieu 2.0s, doDb 160ms, nao 10ms — quy mo that
  khong phai van de voi nao (phan Premiere scale van cho lieu that).
- Diem gay bleed: -6.5dB van an tren lieu nay (bao cao, khong hua) —
  nguong tin cay van la -8dB nhu spike.
- Sample rate lan: 10 luot, lech chuan toi da 0ms.
- phoMic don ve nao.js (mot nguon chan ly, panel + bo kiem dung chung).
- sign-install them CONG STRESS: kiem-nao + stress truot la khong cai.

## [0.3.0] - 2026-08-02 19:30 - LAM LAI UI THEO YEU CAU ANH TIEN

Anh Tien: "UI chua dep va truc quan lam". Ba doi chinh:
1. Buoc GAN doi tu "chon track cho tung nguoi" (dropdown kho, dao nguoc
   tu duy) sang BAN DO TRACK nhu mini-timeline Premiere: moi hang = badge
   track + ten clip + chon "cua ai". Track hinh xep NGUOC chi so (V2 tren
   V1 — dung thu tu Premiere), track tieng xep xuoi. Dung theo chinh cau
   anh mo ta viec: "track nao la cam ai, track nao la mic ai".
2. Moi nguoi mot MAU (xanh duong, tim, teal, vang...) chay xuyen suot:
   chip nguoi -> vien trai hang track -> minh hoa -> thanh ket qua.
   Mau chi lam cham/vien (khong bat ai doc mau), chu luon di kem. Bang mau
   rieng cho DINH DANH, khong dung mau ngu nghia cua he (accent/ok/warn).
3. Ket qua them thanh "AI NOI BAO NHIEU" chia theo thoi luong tung nguoi.

Do that tren panel that (cong 8094):
- Smoke test qua DUONG UI MOI (ganTrack -> dungBan): 10 luot, 1:29,
  thanh chia 44.9%/55.1%, "Nguoi 1 — 5 luot 0:40 / Nguoi 2 — 5 luot 0:49"
  — khop dap an (A 38s loi + nghi ~0:40, B 47s + nghi ~0:49).
- Nho buoc gan theo sequence chay that: ve nguon la ban do tu dien lai
  dung 5 hang (V2=Nguoi 2, V1=Nguoi 1, A1=trong, A2=Nguoi 1, A3=Nguoi 2).
- Hinh hoc: khong tran ngang; select 28 / CTA 34 / chip 24 (dung 3 bac
  token); vien hang dung mau nguoi da gan.
- node --check script truoc khi cai (bai hoc 16:00 — lan nay bat truoc).
- Da don 2 ban dung thu trung; project test con: nguon + 1 ban dung dung.

## [0.2.0] - 2026-08-02 18:30 - DOI DANG DAU RA THEO PHAN HOI ANH TIEN + 2 CHOT AN TOAN

Anh Tien bam thu v0.1.0 va bao "hinh nhu dang bi sai sai": ban dung ra
1 LUOT (Nguoi 1: 1, Nguoi 2: 0) va "timeline cua anh phai duoc CAT theo
ban dung — cam va voice nguoi nao noi thi cut do". Do trang thai panel
qua cong 8094 thi ra HAI tang nguyen nhan, ca hai da sua va do lai:

1. GAN NHAM TIENG CAM LAM MIC (loi UX cua tool, khong phai loi anh):
   anh gan mic Nguoi 1 = A1 — chinh la tieng cua camA (tone keu lien tuc).
   Nao nghe "mot nguoi noi suot" -> 1 luot. Tool con bao THANH CONG em ru
   (dung bai hoc 5g). Sua:
   - Chot an toan 1: do PHO am luong tung mic truoc khi nghe — "mic" co
     p90-p10 < 6dB va p50 > -50dB la am luong deu suot (tieng cam / nhac
     nen) -> CHAN, chi ro ten nguoi + track. DO THAT: tai hien dung thao
     tac cua anh -> panel chan voi cau "Mic cua Nguoi 1 (track A1)...".
   - Chot an toan 2: nao nghe ra <2 luot -> chan va giai thich (ca tap
     mot nguoi noi = gan nhu chac gan sai).
   - Sua kem: ten WAV tam doi tu "mic0/mic1" (theo so thu tu) sang bam
     theo DUONG DAN nguon — truoc do doi buoc gan la tai dung nham tieng
     da tach cua track cu.
2. DANG DAU RA SAI CHUAN NGHE: v0.1 don phang ve V1/A1 cua sequence moi.
   Chuan nghe (AutoPod cut tai cho, giu cau truc track) va y anh: ban
   dung phai NHIN NHU TIMELINE CUA MINH BI CAT. Kien truc moi:
   pc_nhanBan (clone sequence nguon — giu settings/so track/ten track —
   roi go sach clip) -> pc_datHinh (tung doan ve DUNG TRACK GOC cua cam,
   DUNG VI TRI goc, khong don) -> pc_donTieng -> pc_datTieng (mic ve
   dung track goc cua mic). Van la ban SAO — ban goc khong dung toi.

DO THAT tren panel that (cong 8094, moc xong = nut hien lai, bai 5f):
- Bai am tinh: gan tieng cam lam mic -> CHAN dung cau, khong dung gi.
- Bai duong tinh: gan dung -> "Podcast Cut (3)": 10 luot (5+5), 1:29.
  Thuoc ngoai do tung clip: V0 = 5 doan camA dung vi tri dap an, V1 = 5
  doan camB, A1/A2 = mic dung nguoi dung track, ranh khop tung frame,
  duoi dem <=0.08s nhu thiet ke.
- Da xoa 4 sequence thu hong/cu trong project test (2 ban 1-luot, 1 ban
  dang phang v0.1, 1 ban spike trung) — giu nguon + ban dung dung.

Bay moi ghi vao skill adobe-cep-panel:
- ☠️ $.evalFile co the NUOT FILE GIUA CHUNG khong bao loi — ham dinh
  nghia truoc diem dut ton tai, ham sau van la BAN CU. Trieu chung: ham
  moi chay, ham cuoi file tra dinh dang cu. Chan: ham pc_phienBan() dat
  CUOI FILE, panel kiem sau moi lan nap, khop moi chay.
- Sua panel xong PHAI node --check script truoc khi cai — mot lan Edit
  them .then( quen dong ngoac lam chet ca trang (da dinh 16:00).

## [0.1.0] - 2026-08-02 17:00 - PANEL DUNG XONG, DUONG MULTICAM DO THAT TREN PREMIERE

Anh Tien: "roi vao viec di em". Tu mong den ban cai duoc trong mot phien.

Da lam:
- NAO (dist/nao.js — THUAN nhu amluong.ts, khong dung Node/CEP) + bo kiem
  tests/kiem-nao.mjs co SEED: 16/16 DAT. Bleed -16/-8dB: 10/10 luot, ranh
  lech dap an 0ms, cau chen 0,6s bi nuot, 3 mic chay dung. Bleed -5dB:
  gay an toan — tra KHONG_PHAN_BIET, khong doan bay.
- HOST host/podcast.jsx: pc_trangThai / pc_thongTinSeq / pc_batDau /
  pc_themDoan / pc_donTieng / pc_themTieng / pc_doKetQua. Ghi theo LO ~20
  doan de bao tien do; chot kiem SEQ_DOI moi lo (nguoi dung bam sang
  sequence khac giua chung la DUNG NGAY, khong ghi nham cho).
- PANEL dist/index.html: song ngu VI/EN, buoc GAN cam/mic tung nguoi
  (anh chot: nguoi dung tu chon, khong doan theo thu tu track), mot CTA,
  minh hoa quet MOT lan roi dung. Soi 300px khong tran ngang.
- SPIKE #3 DO THAT tren Premiere Beta dang mo — qua cong 8089 cua panel
  anh em ($.evalFile podcast.jsx tu Autocut), KHONG can cai / restart:
  sinh lieu tong hop co dap an (tests/sinh-lieu-media.mjs -> "file pr for
  test/podcast-lieu/": camA do/camB xanh + tone 300/600Hz lam bay,
  micA/micB WAV 89s 10 luot). Ket qua dung 10 doan:
    10/10 clip hinh dung cam dung nguoi, ranh khop dap an tung frame
    don tieng cam 10 -> 0 (hinh nguyen 10/10 — remove khong keo hinh)
    10/10 tieng mic dung nguoi, ranh hinh-tieng khop tuyet doi
    daiThat = 89.000 dung bang lieu goc
- ☠️ BAY MOI TIM RA (suyt thanh loi ban): item WAV luu in/out HUT xuong
  luoi ~0.025s (setOutPoint(8.4) -> luu 8.375; 14.8 -> 14.7814), dat len
  track lai tron XUONG khung hinh -> clip tieng co the HUT 1 khung so voi
  hinh (do duoc: clip dau 8.360 vs 8.400). Sua goc: DEM out +0.05s va dat
  tuan tu tang — clip sau de dung ranh nen duoi dem tu bi cat. Gia con
  lai: clip CUOI du toi da 0.05s duoi tieng phong (do that: 89.040) —
  chon DU thay vi HUT vi hut la mat loi nguoi noi.
- Cai ban dev: scripts/sign-install.ps1 (TU CHAY bo kiem nao truoc khi ky
  — truot la khong cai). Da cai vao CEP extensions. Cong debug 8094.
  Panel hien sau khi TAT HAN Premiere roi mo lai.
- Dung san sequence "PodTest Nguon" trong project test dang mo (V1=camA
  V2=camB A1=tieng-cam A2=micA A3=micB) — restart xong la bam thu duoc.

Chua lam / cho (co y):
- Chua bam thu tren PANEL THAT (cho restart Premiere): duong FFmpeg tach
  WAV trong panel chua do end-to-end (lenh giong het Autocut, rui ro thap).
- Van CAN lieu podcast THAT cua anh Tien de do bleed thuc te (lieu tong
  hop chua co: noi chong nhau, cuoi, u-o dem) — chua do thi chua hua.
- FFmpeg dang MUON cua Transcripts/Autocut (nhu Re-Frames) — ban ban se
  tinh chuyen bundle sau.

## [0.1.0-spike] - 2026-08-01 - NAO "AI DANG NOI" CHAY, cham diem bang dap an

Anh Tien: "em phai lam auto podcast di em" — khong cho lieu that nua. Che
LIEU TONG HOP CO DAP AN: giong Gnostic = A, giong Machine = B, 10 luot xen ke
(5-15s) theo kich ban biet truoc, tron bleed gia mic thu cheo.

Thuat toan: RMS cua so 20ms tung mic -> so chenh dB (nguong 6dB) + hysteresis
+ nuot luot <1s. ~80 dong JS thuan, khong ML.

| Bleed (mic thu cheo) | Ket qua |
|---|---|
| -16dB (phong tot) | 10/10 luot · **100%** cua so dung · lech ranh **0ms** |
| -8dB (mic gan nhau) | 10/10 · 100% · 0ms |
| **-5dB (duoi nguong 6dB)** | **0 luot — GAY AN TOAN**: khong doan bay, tra "khong phan biet duoc" |

Ket luan ky thuat:
- Setup podcast binh thuong (tach mic 10-20dB) -> nao du chinh xac tuyet doi.
- Diem gay = nguong 6dB. Panel PHAI bao "hai mic giong nhau qua — kiem tra
  thu am" thay vi im lang. V2: nguong TU DO theo bleed thuc (do luc solo).
- ☠️ Lieu tong hop chua co: NOI CHONG LOI (2 nguoi noi cung luc), cuoi, u-o.
  Van can lieu THAT cua anh Tien de do truoc khi hua chat luong.

Ke tiep: host pc_thongTinSeq + pc_dungMulticam (duong overwriteClip da chung
minh) + panel buoc GAN track (anh chot: nguoi dung tu gan cam/mic).

## [0.0.0] - 2026-08-01 - DAT MONG, CHUA CO CODE

Anh Tien giao: "tiep theo la podcast tool nha em".

Da lam:
- CLAUDE.md: kien truc du kien — nao "ai dang noi" = so sanh nang luong
  N kenh mic (amluong.ts co san), dung sequence moi bang duong overwriteClip
  da chung minh (rf_ghepDoan 94 doan lech 0,01s). Doi thu: AutoPod $29/thang.
- Danh cho: com.aiostudio.podcast · cong 8094.
- 3 spike phai lam truoc khi xay (do bleed giua mic la cai QUYET DINH kha thi
  — phai co du lieu podcast nhieu mic THAT de do).
- 4 cau hoi san pham gui anh Tien.

## [0.0.1] - 2026-08-01 - ANH TIEN CHOT 4 QUYET DINH

1. Mic RIENG tung nguoi (khong ML).
2. Nguoi dung TU GAN track = cam ai / mic ai (khong doan thu tu).
3. MVP = CAT DUNG truoc, chua can dep: ai noi -> cam nguoi do + AUDIO nguoi
   do. Khong luat wide o v1. Chi giu nguong gop ky thuat ~1s chong nhap nhay.
4. Gia dinh da sync bang Premiere Synchronize.

CHO ANH TIEN: mot sequence podcast THAT da sync (>=2 cam + >=2 mic, vai phut)
de spike do BLEED giua mic — cai quyet dinh kha thi, khong co lieu that thi
khong hua gi.

Chua lam (co y): code — cho vat lieu spike.
