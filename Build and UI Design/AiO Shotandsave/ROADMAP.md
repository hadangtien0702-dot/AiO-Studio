# AiO Shot & Save — Ke hoach tinh nang phat trien (Roadmap)

> Tai lieu dinh huong cac tinh nang sang tao danh rieng cho Editor, Filmmaker va Content Creator.
> Bien AiO Shot & Save tu mot cong cu chup man hinh don thuan thanh tro ly visual khong the thieu ben canh Premiere Pro, After Effects va DaVinci Resolve.
> Cap nhat: 2026-09-27.

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
