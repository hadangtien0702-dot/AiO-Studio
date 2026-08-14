# AiO Autocut — kế hoạch bước tiếp theo

> Viết 2026-07-28, sau buổi đo dày đặc với anh Tiến. Đọc cùng `PROGRESS.md`.
> File này trả lời đúng một câu: **làm gì tiếp, và vì sao theo thứ tự đó.**

---

## ⚠️ CẬP NHẬT 2026-07-29 13:00 — thứ tự dưới đây ĐÃ ĐỔI

Hướng sản phẩm đổi: anh Tiến chốt làm **bộ công cụ bán ra nước ngoài**
(xem `CLAUDE.md`). Danh sách gốc bên dưới viết khi còn là tool tự dùng.

**Đã xong, không cần đọc lại phần mô tả bên dưới:**
- ✅ **Mục 0 — mức giữa "giữ + đặt marker"** → xong ở bản 1.1.0
- ✅ **Auto Transcript tách thành công cụ riêng** (không có trong danh sách gốc)
  → xong 29/07, kèm **bộ đệm kết quả nghe** nên chạy lại chỉ mất vài giây

**Chưa làm, và lý do dừng:**
| Việc | Trạng thái |
|---|---|
| **Silero VAD** (mục 2) | Đã đo: `whisper-cli` **hỗ trợ sẵn** `--vad`, `-vm`, `-vt`. Chỉ cần tải file ~2 MB. *Dừng vì tải file về máy phải hỏi anh Tiến.* |
| **FCPXML** (mục 3) | Vẫn đáng làm — bước dựng chiếm **83%** (video 58 phút mất 19 phút). Đây là điểm yếu rõ nhất khi so với AutoPod. *Dừng vì chưa chốt ưu tiên.* |
| **Sổ ghi phiếu** (mục 1) | Vẫn đúng, nhưng **kém gấp** hơn Silero VAD: nó cần anh Tiến dựng xong một video mới có dữ liệu, còn Silero đo được ngay. |
| **Cắt từ đệm** (mục 4) | Vẫn bị chặn bởi mốc từ Whisper hỏng. Không đổi. |
| **Podcast nhiều mic** (mục 5) | Nay thành **món chính để đấu AutoPod**. Phần khó nhất (biết ai nói lúc nào) đã có; còn thiếu: đọc A1/A2/A3 riêng, đặt nhiều track V, chọn góc. |

**Việc MỚI phát sinh, chặn việc bán:**
- **Đổi FFmpeg sang bản LGPL** — bản đang bundle là GPL, bán mà giữ thì phải mở
  toàn bộ mã nguồn. Sửa rẻ: tool không encode video nên không cần `libx264`.
- **Bảng tham số theo ngôn ngữ** — hiện khoá cứng `-l vi`, mà biên +2 dB / `-mc 0`
  / danh sách từ đệm đều đo riêng trên giọng Việt.

---

## Đang đứng ở đâu (1.0.0)

Luật cắt hiện tại — **giao của hai nguồn**:

```
cắt  ⟺  Whisper KHÔNG nghe ra chữ ở đó   VÀ   năng lượng dưới nền ồn cục bộ + biên
```

Mỗi nguồn chỉ trả lời đúng câu nó giỏi:

| Nguồn | Trả lời câu | Đã đo được độ tin |
|---|---|---|
| Whisper — có chữ hay không | **CÓ AI NÓI KHÔNG** | cao |
| Năng lượng RMS 20 ms | **NÓI Ở CHÍNH XÁC CHỖ NÀO** | cao, sau khi lọc dải giọng |
| ~~Whisper — mốc thời gian~~ | — | **hỏng**: 1.391/13.563 từ mốc sai |

Ba thứ đã trả giá để học được, **đừng làm lại**:

1. Dùng **một mình mốc câu** → phủ 99,2% timeline → 58 phút cắt được 9,8 giây.
2. Dùng **một mình năng lượng** → 321 câu bị cắt mất quá nửa lời.
3. Dùng **một ngưỡng dB cho cả file** → sai chắc chắn, vì nền ồn dao động 7,9 dB
   giữa các phút (nhiều cam).

---

## Vấn đề gốc chưa giải: KHÔNG CÓ THƯỚC ĐO ĐỘC LẬP

Đây là thứ quan trọng nhất trong file này.

Hôm nay báo cáo **ba lần** "0 câu bị cắt mất", **ba lần anh Tiến vẫn nghe thấy chỗ
mất**. Không phải báo cáo sai — mà **thước đo làm bằng cùng thứ vật liệu với cái
nó đo**: lấy Whisper + năng lượng để quyết định cắt, rồi lại lấy chính Whisper +
năng lượng để chấm điểm. Vòng quanh.

**Chừng nào chưa có thước từ ngoài, mọi con số chỉ nên tin ở mức "khá hơn lần
trước", không được tin ở mức "đã đúng".**

Chỉ có hai nguồn thông tin từ ngoài:

- **Tai anh Tiến** — rẻ nhất, và anh ấy vốn đã phải dựng tiếp.
- **Một mô hình khác** không dùng chung nguyên liệu (Silero VAD).

---

## Thứ tự làm

### 0. MỨC GIỮA: "GIỮ + ĐẶT MARKER" ⭐ rẻ nhất, đã có ca thật cần tới nó

Hiện tại máy chỉ có hai lựa chọn: **cắt** hoặc **giữ**. Chỗ mập mờ nó vẫn phải
tự quyết thay anh Tiến — và đó là chỗ sai.

**Ca thật đã gặp:** đoạn gốc `4,93–6,20s` trên video 58 phút. Đo được:
- cao hơn nền cục bộ **11–15 dB** → năng lượng nói "có tín hiệu"
- lệch chuẩn 5,15 dB, nằm ở **phân vị 40%** của các câu Whisper nghe rõ →
  **có nhịp giống hệt tiếng nói**, không phải tiếng động đều
- nhưng Whisper chép ra chữ lộn xộn → không dùng làm bằng chứng được

**Không phân giải được bằng dữ liệu.** Máy nên nói "tôi không chắc" thay vì đoán.

**Làm gì:** đoạn được GIỮ mà dài trên ~0,8s và không có chữ nào đáng tin gần đó
→ đặt marker. Anh Tiến bấm `M` đi qua từng chỗ, nghe rồi tự quyết.

**Chi phí:** thấp — cơ chế marker đã có sẵn (`datMarker`, đang dùng cho chỗ nghe
không chắc). Chỉ cần thêm nguồn thứ hai vào danh sách marker.

---

### 1. SỔ GHI PHIẾU + học từ tay anh Tiến ⭐ ưu tiên cao nhất

Đây là thứ duy nhất phá được vòng quanh ở trên, và cũng chính là điều anh Tiến
gọi là *"thông minh hơn mỗi ngày"*.

**Làm gì:**
- Mỗi nhát cắt ghi lại: mốc, biên vượt bao nhiêu dB, có chữ gần đó không, độ tin
  cậy của chữ, cách ngưỡng bao xa. Lưu cạnh file `.srt` đang ghi.
- Anh Tiến dựng tiếp như thường. Khi anh **nối lại** một chỗ → chỗ đó máy đã sai.
- Một nút "Học từ bản đã dựng": so sequence anh dựng xong với đề xuất ban đầu,
  in ra **phiếu nào đã sai** ở những chỗ anh sửa.

**Vì sao trước tiên:** không có nó thì mọi cải tiến sau chỉ là đoán. Có nó rồi
thì mỗi buổi dựng của anh Tiến tự động thành dữ liệu.

**Chi phí:** vừa. Không cần tải gì thêm, không đụng thuật toán.

---

### 2. Silero VAD — mô hình dò giọng người

**Làm gì:** tải `ggml-silero-v5.1.2.bin` (**~2 MB**), whisper.cpp đang cài **đã hỗ
trợ sẵn** cờ `--vad`. Nó trả lời thẳng *"chỗ này có giọng người không"* mà không
suy từ độ to.

**Được gì:** cắt đứt tận gốc chuỗi "nền ồn đổi → ngưỡng sai → cắt mất lời". Và nó
là **thông tin mới**, không dùng chung nguyên liệu với hai nguồn hiện có — nên nó
vừa cải thiện kết quả, vừa làm được **thước đo chéo** cho vấn đề gốc ở trên.

**Rủi ro:** phải tải thêm file (hỏi anh Tiến trước). Chưa đo trên tiếng Việt của
anh — phải đo trước khi tin.

---

### 3. Bước dựng: xuất FCPXML rồi import một lần

**Vấn đề đo được:** dựng 1.379 đoạn mất **1.098 giây = 83% tổng thời gian chạy**.
Càng sâu càng chậm (0,34 → 1,04 giây/đoạn). Thủ phạm là `overwriteClip` của
Adobe — **không sửa được từ ExtendScript** (đã thử tối ưu phần của mình, vô ích).

**Làm gì:** sinh file FCPXML mô tả toàn bộ các đoạn giữ, rồi import một lần.

**Được gì:** ước từ 18 phút xuống dưới 1 phút. **Chưa đo, chỉ là ước.**

**Lưu ý:** bản 1.0.0 cắt ít nhát hơn hẳn (413 thay vì 1.379) nên bước dựng đã tự
nhẹ đi nhiều. Việc này bớt gấp so với lúc sáng.

---

### 4. Cắt từ đệm / câu lặp — tầng NỘI DUNG

Anh Tiến hỏi từ đầu buổi, đã chốt hoãn. Số liệu đã đếm sẵn trên video 58 phút:

| | số lần | ghi chú |
|---|---|---|
| "ờ" · "ừm" | **0** | Whisper tự lọc bỏ tiếng ậm ừ — **tìm qua phụ đề là không thấy** |
| "ừ" | 3 | quá ít |
| "là" | 232 | **phần lớn là ngữ pháp** ("đây là", "tức là") — cắt hết là vỡ câu |
| **từ lặp liên tiếp** | **994 = 5,5 phút** | **món đáng lấy nhất** |

**Chặn bởi:** cắt từ lặp là cắt **vào giữa tiếng nói**, không còn lưới an toàn
"biên độ thấp" đỡ nữa. Mà mốc từ của Whisper đang hỏng (7–16%). Phải giải xong
chuyện mốc từ trước — mà `-dtw` thì đã đo là **vô tác dụng** trên bản đang cài.

**Đường khả dĩ:** dùng LLM đọc bản chép để **đề xuất** chỗ cắt, nhưng mốc cắt vẫn
phải do năng lượng chốt lại.

---

### 5. Podcast nhiều mic — tính năng mới, không phải sửa lỗi

Nếu mỗi người một track riêng thì bài toán **dễ hẳn**:

> cắt chỗ nào mà **TẤT CẢ các track đều im**

Toàn bộ chuyện đoán "ai đang nói" biến mất, vì đã có dữ liệu độc lập thật.

**Ba chỗ tool chưa làm được:**
1. chỉ đọc một luồng tiếng, chưa biết đọc A1/A2/A3 riêng;
2. chỉ dựng lên V1 + A1, chưa đặt lại nhiều track cho khớp;
3. nếu podcast đã trộn sẵn một track thì mất hết lợi thế.

---

## Ba việc PHẢI đo lại mỗi khi đụng vào thuật toán

1. `cd client && npm run kiem` — 90+ phép, chạy 2 giây, **có dữ liệu thật cả hai cỡ**
2. Chạy trên **clip 82 giây** (`E:\2025\T11\Video\Heygen\final.mp4`)
3. Chạy trên **video 58 phút** (`E:\IMG_3987.mov`) — **cỡ nhỏ giấu lỗi rất giỏi**

Và bộ thử ngoại tuyến trong scratchpad **dự đoán khớp tuyệt đối** với máy thật
(−30 dB · 1.379 nhát · 19:08,7 · cứu 149 chỗ). Dùng nó để thử thuật toán trong
vài giây thay vì chạy Premiere 22 phút.
