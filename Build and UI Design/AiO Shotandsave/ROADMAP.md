# AiO Shot & Save — Ke hoach tinh nang phat trien (Roadmap)

> Tai lieu dinh huong cac tinh nang sang tao danh rieng cho Editor, Filmmaker va Content Creator.
> Bien AiO Shot & Save tu mot cong cu chup man hinh don thuan thanh tro ly visual khong the thieu ben canh Premiere Pro, After Effects va DaVinci Resolve.
> Cap nhat: 2026-09-27 (Gemini) · 2026-10-01 (Claude: muc 0 duoi day).

---

## 0. DANH SACH TINH NANG CO THE LAM TIEP (Claude viet lai 01/10/2026, anh Tien yeu cau)

Nguon: danh gia thi truong 29/09 (PROGRESS.md muc [web] 29/09 13:3x) + muc 2 cua file nay + "Chua lam" trong CLAUDE.md.
Cong suc la UOC LUONG (nho = ~1 buoi, vua = 2-3 buoi, lon = 1 tuan tro len), CHUA do.

DA XONG, khong con trong danh sach: Storyboard quay 3 giay (0.7.4-0.7.8) · Doc chu phim 5 (0.7.9) · Lam mo 2 kieu
(0.6.6) · cong cu chon V + co gian khung (0.5.7-0.6.x).
**01/10 anh chon muc 4 (quay vung man hinh) -> da lam o 0.8.0: MP4 + nut tieng may + khay video rieng (xem CLAUDE.md).
Con lai cua muc 4: xuat GIF (anh chot "lam sau") · thu tieng micro.**

**02/10 14:44 muc 1 (danh so buoc) DA LAM, phim 6, nap vao app dang cai, cho anh bam thu (xem CLAUDE.md + PROGRESS.md).
Anh nhan "thêm tính năng đi em" sau khi em de xuat thu tu 1 -> GIF -> 3 -> 2; anh khong chi dich danh muc nao.**

**06/10 anh chot lam 3 muc trong MOT luot roi moi push: xuat GIF (phan con lai cua muc 4) · muc 2 (but ve tay + da quang,
phim 7 / 8) · muc 5 (chup cuon, phim 9). Ca 3 DA LAM va nap vao app dang cai (10:36 / 10:49 / 10:59), cho anh bam thu; chup
cuon CHUA chay tren man that. Con lai trong danh sach: muc 3 (hut mau), 6, 7, 8; thu tieng micro; app tu cuon khi chup cuon.**

Nhom 1 - re, hop editor, lam ngay duoc:
| # | Tinh nang | Nguoi dung duoc gi | Cong suc + luu y |
|---|---|---|---|
| 1 | Danh so buoc 1-2-3 | Bam len anh la ra huy hieu so tu tang: ghi chu sua cho khach ("1 doi mau, 2 cat ngan"), lam huong dan | Nho. Phim 5 da la Doc chu -> dung phim 6 |
| 2 | But ve tu do + but da quang | Khoanh tay, to sang mot dong chu | Nho. Di chung duong canvas voi khung/mui ten |
| 3 | Hut mau + bang 5 mau chu dao | Bam o mau la chep ma HEX; colorist lay bang mau cua mot canh tham chieu | Nho den vua |

Nhom 2 - lo hong so voi doi thu (ShareX, CleanShot, Snagit deu co):
| # | Tinh nang | Nguoi dung duoc gi | Cong suc + luu y |
|---|---|---|---|
| 4 | Quay vung man hinh ra GIF / MP4 | Gui khach 1 doan chuyen dong thay vi 6 khung tinh | Vua. Nen da co: luong chup chay san + vien quay + dem nguoc cua Storyboard. Ra MP4/GIF can FFmpeg LGPL -> bo cai nang them (chua do) |
| 5 | Chup cuon trang dai | Chup ca trang web / doan chat dai thanh 1 anh | Lon, rui ro cao nhat: ghep nhieu khung khi cuon de lech; Electron khong dieu khien cuon app khac -> nguoi dung tu cuon, app ghep |
| 6 | Khung an toan MXH + luoi 1/3 + ti le 9:16, 2.39:1 | Khoanh vung thay ngay cho bi nut TikTok/Reels che | Vua. PHAI dung chung `safe-zones.json` cua AiO Guide Frame (so da do tu anh app that), khong lam bo so thu hai |
| 7 | Storyboard: ban duyet co o ghi chu duoi moi khung + chon so khung / so giay | Gui dao dien 1 to duyet co cho ghi "sua mau shot nay" | Vua. Lam SAU khi do xong loi khung 1 den tren video |
| 8 | Ban Mac chay that | Ban duoc cho editor dung Mac | Bo cai Mac da dung duoc qua GitHub Actions nhung CHUA chay tren Mac that lan nao (doc chu Apple Vision, quay 3 giay chua do) |

Nhom 3 - Claude khuyen CHUA lam:
| # | Tinh nang | Vi sao chua |
|---|---|---|
| 9 | Link chia se nhanh | Can may chu + tien luu tru hang thang, trai mo hinh ban 14,99 USD mot lan; anh cua khach nam tren may chu minh = trach nhiem rieng tu |
| 10 | Dong dau ngay gio / ten sequence len anh | Ten sequence KHONG lay duoc (app nam ngoai Premiere); ngay gio anh da bo o Storyboard 28/09 |
| 11 | Ky so bo cai, tu cap nhat tren Mac | Anh da chot khong mua chung chi (14/08, 21/09) |

De xuat thu tu cua Claude: 1 -> 4 -> 3. Truoc khi lam cai moi con 2 viec cua ban dang co: anh bam phim 5 tren ban cai
0.7.9, va do loi khung 1 den cua Storyboard tren video. Anh CHUA chot muc nao trong danh sach nay.

### 0b. GOP KHAY THANH MOT (anh neu 01/10/2026 13:2x: "phan khay minh toi uu hoa thanh 1 khay?") — anh CHUA chot
> 01/10 13:59: anh bao *"gop cho anh xem truoc"* -> huong A DA DUNG va nap vao app dang cai (cua so `src/khay`, 2 the).
> Anh dang xem, chua chot giu hay bo. Chua lam: gop 2 nut tren Khay anh thanh 1; huong B.
> 01/10 15:18 anh mo that tren app (run-log: `khay mo the=dai`, `khay mo the=video`, khong co `khay LOI`), roi hoi
> *"cach nao tien hon nua khong"*.

### 0c. KHAY TU THU VE NUT TRON O GOC MAN HINH (anh neu 01/10/2026 15:2x) — anh CHUA chot chi tiet
Anh: *"khi khong dung toi chup anh khay se tu thu ve thanh mot nut tron o goc man hinh de do ton dien tich ...
animation phai dep"*. Claude tra loi + dua ban thu bam duoc trong chat (3 kieu chuyen dong: co mem / hut anh vao nut /
nhanh gon; nut tron 48 px o goc duoi-phai; tu thu sau 3 giay khong re chuot; bam nut de mo).
- Lam duoc: cua so Khay anh von TRONG SUOT (`main.js ensureShelf`) nen chuyen dong chay ben trong cua so, khong phai
  keo cua so tung khung. Nut tron phai nam trong cua so >= 64 px (Windows khong cho cua so nho hon ~58 px diem anh that,
  so loi #13) -> vong tron ve 44-48 px giua cua so trong suot.
- "Tien hon nua" Claude de xuat: MOT khay noi co 3 the Anh · Video · Storyboard (the Anh = luoi dang co, khong sua),
  thu ve thanh MOT nut tron -> tren man chi con 1 thu; cua so khay gop 13:59 thanh phan than cua 2 the kia.
- Cho anh chon: kieu chuyen dong (1/2/3) · khi nao thu (sau N giay / chi khi bam) · goc nao · mo bang bam hay re chuot
  · co lam "mot khay 3 the" luon hay chi lam nut tron truoc.
- 01/10 15:5x anh che 3 kieu dau: *"3 option animation nay chua du dep va creative"*. => NHAP 2 (chay that, keo khay duoc,
  co "xem cham"): `nhap/khay-nut-tron.html` (KHONG phai ma cua app, khong dong goi). 3 y tuong, moi cai ke mot viec app
  lam: **A Ong kinh** (khay khep nhu man trap, con ong kinh luot ve goc, mo ra co nhay sang) · **B Xap anh** (tung tam bay
  vao nut, nut dem len, luc nghi nut hien anh moi nhat, mo ra chia nhu chia bai) · **C Khoanh vung** (khung cam 4 goc om
  khay, chup lai, thu ve goc; mo ra 4 goc bung truoc). Them cho ca 3: chup anh moi luc khay dang thu thi nut GIAN thanh
  vien thuoc hien anh vua luu ~1,5 giay. Do toc do that: thu ve mat ~1,4 giay (A) — con cham cho viec lap lai ca ngay,
  chot y tuong roi moi ep nhip. Anh CHUA chon.
- **01/10 16:07 ANH CHOT + DA LAM, nap vao app dang cai:** xuat hien kieu A (ong kinh), thu ve kieu B (xap anh), tu thu 5
  giay + Cai dat 5s / 10s / 15s, bam nut de mo. Ma: `src/khay-thu.js`, `src/nut/`, `src/dien/`. Bai do `npm run
  test:khaynut` 30/30 (offscreen). CHUA xem tren man that. Con lai chua lam: kieu C, mot khay 3 the.
- 01/10 15:3x anh hoi: *"khi anh drag cai khay di tum lum cho, khi thu ve no van nam o goc dung khong?"* => anh muon nut
  tron LUON ve goc, khong phu thuoc khay dang nam dau. Claude tra loi: dung; de xuat goc duoi-phai cua MAN khay dang
  nam, bam nut thi khay mo lai DUNG CHO CU. Anh chua xac nhan goc nao + mo lai o dau.
Hien co 3 cho: Khay anh (noi, nho, luon tren cung) · cua so Khay Storyboard · cua so Khay video (sang 01/10 anh chon
"khay rieng" trong bang hoi; Claude luc do de xuat chung Khay anh). Hai cua so sau da dung chung mot khuon CSS
(`storyboard.css`, do 01/10 13:08: 14 luot dat). Claude tra loi anh 2 huong:
- **A. Gop 2 cua so (Storyboard + Video) thanh MOT cua so co 2 the, Khay anh noi giu nguyen.** 3 cho -> 2 cho, tren Khay
  anh 2 nut -> 1 nut. It rui ro: khong dung vao Khay anh (phan da chinh nhieu nhat: cuon, keo to, keo tha).
- **B. Gop ca ba vao Khay anh noi:** anh / video / dai nam chung mot luoi theo thoi gian, co hang loc Tat ca · Anh ·
  Video · Storyboard; video la o co nut phat + thoi luong, dai la o co so khung; bam vao moi mo phan chi tiet (phat, chon
  Co tieng / Khong tieng, bo khung, Luu / Sao chep). Mot cho duy nhat, keo tha thang tu khay. Rui ro: dung vao Khay anh.
- De xuat cua Claude: lam A truoc (cung la phan "chi tiet" ma B can), anh dung thu roi moi lam buoc dua o video / dai
  vao Khay anh. Loai moi sau nay (GIF) khong sinh them khay thu tu.

---

## 1. UU TIEN SO 1 (Phat trien ngay phien 28/09): Multi-Shot Storyboard Strip

### 1.1. Boi canh & Vande thuc te
- Video editor khi dung phim thuong xuyen phai chup nhieu shot tren Timeline (3 den 10 frame lien tiep) de gui dao dien, agency hoac khach hang duyet goc quay, mau sac, bo cuc hoac nhip cat (continuity).
- **Bat tien hien tai**: Phai chup tung anh rieng le roi gui 10 file anh roi rac khien nguoi xem kho hinh dung tong the; hoac phai mo Photoshop/Canva ton 10-15 phut de cat ghep, dan anh va go chu SHOT 1, SHOT 2 thu cong.

### 1.2. Giai phap thiet ke (1-Click Storyboard)
- **Diem cham UI tren khay**:
  - Nut moi `#storyboard` tren thanh tieu de khay anh (`#bar`, ben canh nut thu muc `#folder`).
  - Icon SVG inline kieu film/layout (chuan Studio Console, khong dung emoji).
  - Phim tat nhanh: **`S`** khi dang mo cua so khay anh.
  - Che do chon: Mac dinh lay toan bo cac anh dang co trong khay theo dung thu tu chup (`#1`, `#2`... da danh so o 0.6.2), hoac ho tro click chon 2-8 anh tuy y.

- **3 Che do bo cuc (Layout Templates)**:
  1. **Cinema Filmstrip (Dai ngang cuon phim)**:
     - Xep cac khung hinh theo hang ngang lien mach tren dai nen toi Studio Console (`#090a0d`).
     - Vach ngan cach tinh te 1px giua cac frame.
     - Phia tren hoac goc duoi moi frame co nhan badge nho: `SHOT 01`, `SHOT 02`, `SHOT 03`...
     - Toi uu nhat de xem nhip hanh dong lien tiep (action continuity / cut flow).
  2. **Storyboard Grid (Luoi phan canh 2x2, 3x2, 4x2)**:
     - Tu dong can doi chia cot va hang theo tong so luong shot duoc chon.
     - Vien khung bo goc mượt ma theo ban kinh 8px cua token he thong.
     - Toi uu de xem tong the mot phan doan / TVC tren 1 man hinh duy nhat.
  3. **Director Contact Sheet (Ban duyet dao dien & khach hang)**:
     - Co thanh Header banner sang trong phia tren cung: Logo AiO Studio, ten phan canh / Project, ngay gio xuat, tong so shot.
     - Duoi moi khung hinh co san o ghi chu hanh dong / revision note (vi du: "Sua mau shot nay", "Doi goc cam").

- **Hanh dong xuat ket qua (1-Click Export)**:
  - `Ctrl+C` (hoac nut Copy): Render anh ghep ra Clipboard de paste ngay vao Zalo, Messenger, Slack, Frame.io.
  - `Ctrl+S` (hoac nut Luu): Xuat 1 file anh PNG duy nhat vao thu muc anh chup (tu dong nap lai vao khay).
  - Keo tha truc tiep (Drag & Drop): Nam anh ghep tu modal keo thang vao Premiere Pro / AE de lam visual reference sequence tren timeline.

- **Kien truc ky thuat**:
  - Render bang HTML5 Canvas 2D noi bo (CommonJS, khong phu thuoc thu vien ngoai).
  - Tinh toan ty le va giu do phan giai goc 1:1, khong bi mo hay vo hat.
  - Cac file can thiep: `src/shelf/index.html`, `src/shelf/shelf.css`, `src/shelf/shelf.js`, module `src/storyboard/`, `src/i18n.js`, `src/main.js`.

---

## 2. CAC TINH NANG TIEP THEO TRONG PIPELINE

### 2.1. Color Palette Extractor (Trich xuat bang mau phan canh & Moodboard)
- **Nhu cau**: Editor va Colorist thuong xuyen can tham chieu bang mau cua mot canh quay hoac reference video.
- **Thiet ke**:
  - Bam nut trinh mau (hoac phim tat `C`), he thong tu dong phan tich vung anh chup (dung thuat toan K-means / Color Quantization nhe tren Canvas).
  - Trich xuat ra 5 mau chu dao nhat (Dominant Color Swatches).
  - Hien thi dai mau dep mat ngay chan anh ghim hoac khay anh.
  - Click vao tung o mau de copy ma HEX (`#f86820`) hoac copy toan bo dait mau vao clipboard.

### 2.2. Aspect Ratio & Safe Zone Overlays (Luoi ty le vang & Vung an toan MXH)
- **Nhu cau**: Chup anh tham chieu dung cho video doc (TikTok, Reels, YouTube Shorts) thuong bi che mat boi cac nut UI cua ung dung (nut Tim, Share, Avatar, Caption).
- **Thiet ke**:
  - Khi keo khung chup hoac xem anh ghim, ho tro toggle bat cac lop overlay huong dan:
    + **9:16 Social Safe Zone**: Hien thi vung dem an toan, danh dau vung de bi UI TikTok/Reels de len de editor can chinh chu va chi tiet quan trong.
    + **Cinematic Frames**: Khung 2.39:1 Anamorphic, 16:9, 4:5 Instagram, 1:1 Square.
    + **Rule of Thirds**: Luoi 1/3 ho tro can goc may va tam mat nhan vat.

### 2.3. Auto-Numbering Step Marker (Co danh so buoc 1-2-3 tu tang)
- **Nhu cau**: Editor lam video tutorial, huong dan quy trinh dung phim cho team hoac tai lieu SOP.
- **Thiet ke**:
  - Them cong cu co danh so (phim tat `5` hoac icon con so tren thanh ve).
  - Moi lan click chuot len anh la tu dong dong mot huy hieu badge tron so: `1`, click tiep thanh `2`, `3`, `4`... tu tang dan.
  - Tu dong doi mau theo token cam neon `--acc`, di chuyen hoac xoa duoc bang cong cu chon `V`.

### 2.4. Timeline Timestamp & Sequence Metadata (Dong dau ngu canh Timeline)
- **Nhu cau**: Luu tru nhat ky dung (edit log), de dang truy vet lai khung hinh thuoc ve sequence nao hoac duoc chup vao thoi diem nao.
- **Thiet ke**:
  - Tuy chon bat/tat watermark nho gon tinh te o goc anh: Thoi gian chup, sequence name hoac ghi chu ngan.
  - Font Inter chu nhat, do mo nhe khong che mat chi tiet quan trong cua anh.

---

## 3. NGUYEN TAC THIET KE & TRIEN KHAI (BAT BIEN)

1. **Cam tuyet doi dung emoji trong UI** (Luat 01 trong AGENTS.md):
   - Toan bo icon tren thanh cong cu, modal, khay anh phai la SVG inline (viewBox 0 0 24 24, stroke 1.9, Lucide style).
2. **Dong bo mau theo token Studio Console**:
   - Mau chu dao: Accent cam `--acc: #f86820`.
   - Nen toi chuyen nghiep: `--bg-0: #090a0d`, `--bg-1: #0d0e12`.
   - Chu va icon: `--t1: #eeeef2`, `--t3: #6f7185`.
3. **Trai nghiem 1-Click & Toc do la so 1**:
   - Moi thao tac phai tuc thoi (<50ms), khong lam gián đoạn luong lam viec cua editor.
   - Ho tro day du phim tat va thao tac keo tha (drag and drop) truc tiep vao Premiere Pro / After Effects.
