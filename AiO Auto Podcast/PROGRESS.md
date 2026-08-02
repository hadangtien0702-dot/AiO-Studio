# AiO Auto Podcast - Nhat ky

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
