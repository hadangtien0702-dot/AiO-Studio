# AiO Auto Re-Frames — đọc cái này trước

> Panel thứ 5 của bộ AiO Studio. Sinh 2026-07-30 theo lệnh anh Tiến:
> *"làm chức năng tự động thay tracking chủ thể và thay đổi khung hình từ
> ngang sang dọc đi em"*.

| | |
|---|---|
| Extension ID | `com.aiostudio.reframe` |
| Cổng debug | **8092** (8088 Asset · 8089 Autocut · 8090 PowerBins · 8091 Transcripts) |
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

## ☠️ CHƯA ĐẠT — thật thà, đừng hứa quá

| | Vì sao chưa |
|---|---|
| **Mắt người duyệt chất lượng tracking** | Máy chỉ kiểm được "effect ĐÃ GẮN", không kiểm được "Sensei bám ĐÚNG người". Cần anh Tiến mở bản dọc xem. |
| **Sequence NHIỀU clip / nhiều track** | QE `getItemAt(c)` mới kiểm trên track 1 clip. Track có khoảng trống thì chỉ số QE có thể lệch với `clips[c]` — phải đo trước khi tin. |
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
