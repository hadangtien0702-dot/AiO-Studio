# AiO Auto Re-Frames — đọc cái này trước

> Panel thứ 5 của bộ AiO Studio. Sinh 2026-07-30 theo lệnh anh Tiến:
> *"làm chức năng tự động thay tracking chủ thể và thay đổi khung hình từ
> ngang sang dọc đi em"*.

| | |
|---|---|
| Extension ID | `com.aiostudio.reframe` |
| Cổng debug | **8092** (8088 Asset · 8089 Autocut · 8090 PowerBins · 8091 Transcripts) |
| Đo trên panel đang chạy | `scripts\do-tren-panel.ps1 -Expression "<js>"` (mượn từ Autocut 27/08, đã đổi cổng 8092). ☠️ Chuỗi **có dấu tiếng Việt méo khi qua PowerShell** — thước phải dùng dấu hiệu không dấu. |
| Build | **KHÔNG có bước build** — `dist/` là file tĩnh viết tay (v0.1) |
| Cài | `scripts\sign-install.ps1` (mượn ZXPSignCmd của panel anh em) |

---

## Sản phẩm này làm gì — MVP anh Tiến chốt 31/07/2026

Nguyên văn: *"Re-Frames này sẽ **tự động lấy nội dung và tạo các video ngắn**
dựa trên video chính. Tool sẽ tự động **đo lường nội dung bằng transcripts**
rồi đưa ra các nội dung phù hợp với nội dung chính. Các nội dung này **có thể
không chính xác 60s** vì tool sẽ ưu tiên việc **bắt hết nội dung của một câu
chủ đề hoặc một câu hỏi mà người trả lời sẽ trả lời hết ý**."*

Hai tầng tính năng:
1. **Đổi khung cả sequence** (đã chạy): nhân bản sequence ngang → bản
   dọc/vuông, Sensei tự bám chủ thể. Bản gốc giữ nguyên.
2. **TỰ TẠO SHORTS THEO NỘI DUNG** (MVP chốt 31/07): đọc bản chép lời (đệm
   `.autocut-nghe.json` của Autocut/Transcripts — khách có cả bộ), chia đoạn
   theo **câu hỏi được trả lời hết ý**, cắt mỗi đoạn thành một sequence dọc
   bám chủ thể. Độ dài KHÔNG ép 60s — trọn ý là ưu tiên số một.

*Ví dụ đời thường:* podcast 1 tiếng quay ngang → bấm một nút, tool đọc lời
thoại, tìm từng câu hỏi–trả lời trọn vẹn, và trên timeline mọc ra các short
dọc sẵn — editor chỉ tỉa lại thay vì ngồi tua cả tiếng tìm đoạn.

⚠️ Ranh giới với thư mục `AiO Auto Cut Short`: não "chọn đoạn theo hỏi–đáp"
anh chốt đặt VÀO Re-Frames (lời anh 31/07 ở trên). Thư mục Short giữ các phần
chưa làm: phụ đề gắn lên short, xuất nháp 480p, karaoke — chốt số phận sau.

---

## ☠️ KIẾN TRÚC — chốt 30/07 sau 5 spike, ĐỪNG NGHĨ LẠI TỪ ĐẦU

**Không tự làm ML tracking.** Dùng chính effect **Auto Reframe (Sensei)** có sẵn
trong Premiere. Lý do: offline, đi kèm host, không phải bundle model, không thêm
gánh bản quyền, chất lượng tracking là của Adobe. Panel chỉ làm phần Adobe bắt
người dùng làm tay: nhân bản + đổi khung + gắn effect **hàng loạt**.

5 spike đo thật trên Premiere Beta 26.5 (30/07/2026), đường sống đã kiểm:

| # | Câu hỏi sống còn | Kết quả |
|---|---|---|
| 1 | Clip có component Motion không? | ✅ `AE.ADBE Motion`, đủ Position/Scale/Crop |
| 2 | Ghi keyframe Motion được không? | ✅ ghi 2 key Position, **đọc lại đúng từng số** ([0.3,0.5]@1s) |
| 3 | Đổi sequence sang 1080×1920? | ✅ `setSettings` — đọc lại đúng 1080×1920 |
| 4 | Gắn Auto Reframe bằng script? | ✅ QE `addVideoEffect` — components 2→3, matchName `AE.ADBE AEFilterAutoFramer` (kiểm bằng API chính thức) |
| 5 | Nhân bản sequence? | ✅ `seq.clone()` — số sequence tăng 1 |

Spike 2 để dành cho chế độ **tinh chỉnh tay** sau này (tự ghi keyframe khi người
dùng không ưng đường Sensei chọn) — đường ống đã thông, chưa dùng.

### Ba cái bẫy đã né sẵn — đừng dẫm lại

1. ☠️ **`getVideoEffectByName` với tên BỊA vẫn trả về object** — nhưng `name`
   RỖNG. Kiểm `fx.name === 'Auto Reframe'` trước khi dùng, đừng kiểm truthy.
2. ☠️ **`clone()` không trả về sequence mới** — tìm bản sao bằng **hiệu số
   `sequenceID` trước/sau**, đừng đoán tên (tên đặt theo ngôn ngữ giao diện).
3. ☠️ **Luật QE** (skill adobe-cep-panel): sai tham số là SẬP Premiere. Mỗi lệnh
   QE trong dự án này đã kiểm đúng-một-lần trên sequence rác. Muốn thêm lệnh QE
   mới: spike trên project rác trước, một cách một lần.

---

## TỪNG TÍNH NĂNG — ba lớp

### 1. TẠO BẢN DỌC 9:16 (`rf_lamDoc`)

**Người xài thấy gì:** mở sequence ngang → bấm **"Tạo bản dọc 9:16"** → vài giây
sau timeline nhảy sang sequence mới `<tên> - Doc 9-16`, khung dọc, chủ thể được
bám tự động. Biên lai: số clip đã gắn + khung hình.

**Builder phải biết:**
- Luồng: clone (diff ID) → rename → `setSettings` 1080×1920 (đọc lại kiểm) →
  kích hoạt bản sao → QE `addVideoEffect` từng clip → **đọc lại components
  bằng API chính thức** (không tin "không báo lỗi").
- Clip đã có `AEFilterAutoFramer` thì **bỏ qua** — chạy lại không gắn trùng.
- Sensei **phân tích nền sau khi gắn** — evalScript trả về trước khi phân tích
  xong. Panel nói rõ điều đó, đừng hứa "xong ngay".

**MVP:** ✅ chạy thật 30/07 trên `Test3 Insane` (1 clip 26:17): sequence mới
đúng tên, khung 1080×1920, 1/1 clip gắn, 0 lỗi. **CHƯA đo trên sequence
nhiều clip / nhiều track / có khoảng trống** — xem CHƯA ĐẠT.

---

### 2. ĐOẠN ĐANG CHỌN — khoanh I/O rồi bám chủ thể đúng đoạn đó (`rf_catVung`)

> Anh Tiến chốt 27/08: *"khi anh mở sequence a sẽ xác định đoạn cần làm và em
> phải tracking cho anh đoạn đó — anh xác định bằng I hoặc O cho em luôn"*.

**Người xài thấy gì:** mở sequence ngang → bấm `I` và `O` khoanh đoạn cần làm
→ panel **tự hiện** khối "Đoạn đang chọn · 1 phút 12 giây" (không phải bấm gì
để nó biết) → bấm **"Bám chủ thể đoạn này · dọc 9:16"** → vài giây sau timeline
mở ra sequence `Doan 15s-42s - Doc 9-16`, đúng đoạn đó, khung dọc, chủ thể được
bám. Bản gốc nguyên vẹn.

*Ví dụ đời thường:* podcast 1 tiếng, chỉ có 40 giây đáng làm short. Trước đây
bấm nút là tool đổi khung **cả tiếng** rồi Sensei ngồi phân tích cả tiếng. Nay
khoanh đúng 40 giây đó, Sensei chỉ phải nhìn 40 giây.

**Builder phải biết:**
- Ba hàm host: `rf_getRange()` (nhẹ, 4 số, gọi mỗi giây) · `rf_getRangeClips()`
  (nặng, duyệt mọi clip mọi track) · `rf_catVung()` (dựng lại + gắn effect).
- ☠️ **Chưa khoanh vùng thì `getInPointAsTime().seconds` trả `-400000`**, không
  phải `-1`, và không ném lỗi. Kiểm `< 0`.
- ☠️ **Mốc I–O đứng yên KHÔNG có nghĩa là vùng không đổi** — tắt một clip ở
  track trên là nội dung vùng đổi hẳn mà mốc không nhúc nhích. Vì vậy: mỗi 4
  nhịp làm mới đầy đủ + `focus` làm mới ngay + **đọc lại vùng ngay trước khi
  dựng** (chốt chặn thật: hiển thị được phép trễ, dựng thì không).
- ☠️ **Không dùng razor.** Autocut đã đo 27/07: `remove()` chỉ nhắc đi, dò tham
  số thì làm SẬP Premiere. Đường chính thức: `createNewSequenceFromClips` cho
  đoạn đầu + `overwriteClip` cho các đoạn sau, **mốc đọc lại từ clip vừa đặt**
  chứ không cộng dồn (cộng dồn hở 1 khung sau 32 đoạn).
- ☠️ `rf_catVung` **cất in/out gốc của MỌI project item nó đụng vào rồi trả lại
  nguyên văn** (luật 3a-bis). Đặt in/out lên project item là ghi vào dữ liệu
  của người dùng.
- Clip đang **tắt** (`clip.disabled`), clip `.mogrt` và caption AiO đều bị bỏ
  qua — sequence multicam của Auto Podcast tắt cam không dùng chứ không xoá.

**MVP:** ✅ đo thật 27/08 trên Premiere 27.0.0, sequence test tự tạo:
vùng 4 clip / 2 file cắt ngang biên → **27.00 / 27.00 giây, 0 khe hở, 4/4 clip
gắn Auto Reframe, 2,19 giây**; in/out gốc trả lại nguyên; panel bắt kịp đổi vùng
trong **1,1 giây**; đổi vùng ngầm rồi bấm nút thì **không dựng gì**.
**CHƯA đạt:** vùng có hình chồng lớp (B-roll đè) — panel báo thẳng và khoá nút,
chưa dựng lại được. Và chưa có mắt anh Tiến duyệt chất lượng tracking.

---

## ☠️ CHƯA ĐẠT — thật thà, đừng hứa quá

| | Vì sao chưa |
|---|---|
| **Mắt người duyệt chất lượng tracking** | Máy chỉ kiểm được "effect ĐÃ GẮN", không kiểm được "Sensei bám ĐÚNG người". Cần anh Tiến mở bản dọc xem. |
| **Sequence NHIỀU clip / nhiều track** | QE `getItemAt(c)` mới kiểm trên track 1 clip. Track có khoảng trống thì chỉ số QE có thể lệch với `clips[c]` — phải đo trước khi tin. Đường **`rf_catVung`** không dính chuyện này (nó dựng sequence mới nên clip luôn liền, đã đo 4/4 gắn đúng 27/08); chỉ đường `rf_lamDoc` (clone cả sequence) là còn nợ. |
| **Vùng có hình CHỒNG LỚP** | B-roll ở track trên đè clip track dưới: `rf_getRangeClips` đếm được và panel khoá nút + nói rõ, nhưng chưa dựng lại được. Dựng lại phẳng sẽ sai cả độ dài lẫn nội dung. |
| **Tham số Motion của Auto Reframe** | Effect có preset (slower/default/faster motion) — chưa đọc/ghi được property của nó, đang để mặc định. |
| ~~Chọn tỉ lệ khác~~ | ✅ XONG 31/07 — 3 tỉ lệ 9:16 / 1:1 / 4:5, vẽ bằng hình, minh hoạ đổi theo. |
| **Vào bộ kiểm đồng bộ design-system** | UI v0.4 đã theo tokens + đủ ngôn ngữ bộ (minh hoạ, đèn, song ngữ, onboarding) nhưng `dong-bo-tokens.ps1` / `kiem-dong-bo.ps1` / `so-sanh.html` vẫn danh sách cứng 4 panel. Bàn xem 5 panel tạm thời: `design-system/xem-bo.mjs` cổng 8095. |
| Chữ ký thương mại · macOS · bộ cài ghép | Chung số phận cả bộ — `../PIPELINE.md`. |

## Quy ước

- Sửa `host/*.jsx` → panel tự `$.evalFile` lại trước mỗi lệnh, chỉ cần cài.
  Sửa `CSXS/manifest.xml` → **tắt hẳn Premiere mở lại**.
- Đường dẫn gửi vào ExtendScript **luôn dùng `/`** (`\2` là escape bát phân).
- Host trả MÃ (`ERR:CHUA_MO_SEQUENCE|`), panel viết câu tiếng Việt.
- Ghi `PROGRESS.md` sau mỗi lần sửa: mục mới trên cùng, giờ lấy bằng lệnh,
  không dấu, không emoji.
