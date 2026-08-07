# AiO Studio — LỘ TRÌNH SẢN PHẨM

> Lập 2026-07-29. Đây là file trả lời câu **"bộ này bán thế nào, còn thiếu gì"**.
> Chi tiết kỹ thuật của từng tính năng nằm ở `CLAUDE.md` trong thư mục tương ứng.

---

## 1. HƯỚNG SẢN PHẨM — anh Tiến chốt 2026-07-29

> *"Anh muốn là phát triển từng tính năng cho hoàn chỉnh, sau đó sẽ ghép lại một
> bộ thành cài đặt một lần — người dùng sẽ trả tiền cho toàn bộ tính năng đó để
> có thể dùng."*

Ba điều rút ra, và mọi quyết định sau này phải bám vào:

1. **Tách thư mục là để PHÁT TRIỂN, không phải để BÁN RỜI.** Bốn panel nằm bốn
   thư mục vì như vậy dễ sửa, dễ đo, dễ biết cái nào xong cái nào chưa.
2. **Đích đến là MỘT bộ cài, MỘT giá.** Khách trả một lần, mở Premiere ra thấy
   đủ 4 panel.
3. **Luôn giả định khách có đủ cả bộ.** Đừng bỏ công làm cơ chế dự phòng cho
   trường hợp "khách chỉ mua một cái" — trường hợp đó không tồn tại.

**Cạnh tranh:** AutoCut (10 thẻ) · AutoPod ($29/tháng, khoá theo máy).
Anh Tiến: *"anh có kinh nghiệm làm editor 5 năm, anh biết pain point của editor"*
→ **hỏi anh khi cần quyết định sản phẩm**, đừng tự đoán thay.

---

## 2. BẢN ĐỒ THƯ MỤC — cái nào làm gì

```
E:\2026\Production\AiO Studio\
├── AiO Asset Manager\   Kho asset: quét ổ → bấm xem/nghe → chèn timeline
│                        com.aiostudio.assetmanager · cổng 8088
│                        kho %APPDATA%\AiOStudio
├── AiO Power Bins\      Brand Kit hiện ở MỌI project Premiere
│                        com.aiostudio.powerbin · cổng 8090
│                        kho %APPDATA%\AiOPowerBins
├── AiO Autocut\         Dò khoảng lặng → cắt + xoá + dồn clip
│                        com.aiostudio.autocut · cổng 8089
├── AiO Transcripts\     Chép lời thành .srt + marker chỗ nghe không chắc
│                        com.aiostudio.transcript · cổng 8091
├── AiO Auto Re-Frames\  Bản dọc 9:16 tự bám chủ thể (bọc Sensei Auto Reframe)
│                        com.aiostudio.reframe · cổng 8092 · sinh 30/07
├── AiO Auto Guiline Frame\  Guideline safe zone theo nền tảng lên sequence
│                        com.aiostudio.guideframe · cổng 8096 · sinh 01/08
├── AiO WebDessign\      Web bán hàng (Next.js + Drizzle + Cloudflare Worker)
│                        anh Tiến dựng 29/07 · chưa nối vào sản phẩm · có .git riêng
├── file pr for test\    File THỬ dùng chung cho cả 4 panel (1,33 GB)
│                        `test 2.prproj` + 36 bản auto-save + media MOGRT.
│                        Dời từ `AiO Editing` ra đây 29/07 vì nó là của CHUNG.
│                        ☠️ 1.288 MB trong đó là `.cfa` — cache âm thanh Premiere
│                        tự sinh lại được. Phần cần giữ thật chỉ ~36 MB.
└── PIPELINE.md          (file này)
```

**Đã xoá 29/07:** `AiO Editing` — bản gộp cũ (Asset Manager + Power Bins chung
một panel). Đã tách xong, 4 panel chạy thật trên Premiere, nên bản gộp hết vai trò.

☠️ **Bốn extension ID và bốn cổng debug KHÔNG được trùng.** Trùng ID là bộ cài
này đè lên panel kia. Đã có lỗi thật: bộ cài Autocut từng cài vào thư mục
`com.aiostudio.assetmanager` (script báo một đằng, làm một nẻo). Sửa 29/07.

**Mã dùng chung — sửa một nơi nhớ chép sang nơi kia:**

| Cặp | Chung cái gì |
|---|---|
| Asset Manager ↔ Power Bins | ~90%: `store.ts` · `Grid.tsx` · `jobQueue` · `mediaServer` · `ffmpeg` · thumbnail/sóng âm/proxy |
| Autocut ↔ Transcripts | ~80%: `whisper.ts` · `ffmpeg.ts` · `amluong.ts` · **bộ đệm nghe dùng chung** (cố ý) |

---

## 3. TỪNG TÍNH NĂNG ĐANG Ở ĐÂU

Đo thật ngày 2026-07-29, trên Premiere Pro Beta 26.5.0.

| Tính năng | Trạng thái | Số đo |
|---|---|---|
| **Asset Manager** — quét, xem/nghe, Import, kéo thả | ✅ **xong** | 28.846 asset · Import vào track trống, không đè |
| Sóng âm / thumbnail / proxy nền | ✅ xong | WebP q80, nhẹ hơn PNG ~70% |
| Cài đặt / dọn cache | ✅ xong | nút xoá nói số file + MB |
| **Power Bins** — Brand → Khay, thêm từ timeline | ✅ **xong** | kho riêng đã chứng minh; **"mở project KHÁC vẫn thấy nguyên" ĐÃ ĐO 29/07** — project mới toanh vẫn hiện đủ brand/khay/asset, ảnh tải được, Import chèn được ngay |
| **Autocut** — cắt khoảng lặng | 🟡 **chạy được, chưa tin được** | 16 nhát cắt · 17 đoạn · 72,04s · 0 câu nuốt |
| Xem trước dải sóng | ✅ xong | 3 mức: 87% / 74% / 57% |
| Cắt tại chỗ + hoàn tác | ✅ xong | 1 clip 81,72s → cắt → về lại 1 clip 81,72s |
| **Transcript** — làm phụ đề | ✅ **xong** | 16 câu · 2.497 byte · 7 marker |
| Phụ đề đúng chuẩn đọc | ✅ **xong 29/07** | dòng dài nhất **193 → 42** ký tự · vượt chuẩn **78,5% → 0,0%** · **không mất chữ** (53.616 = 53.616) |
| Chạy ở quy mô thật | ✅ **xong 29/07** | video **60 phút → 765 câu**; lần đầu 143s, các lần sau ~14s |
| Chạy lại 10 lần | ✅ **xong 29/07** | **10/10 giống hệt từng byte**, RAM không rò rỉ |
| Bộ đệm nghe dùng chung | ✅ xong | 0,4–2,4 giây thay vì ~20 giây; video 60 phút: 143s → 14s |
| **Auto Re-Frames** — bản dọc 9:16 bám chủ thể | 🟡 **lõi chạy được 30/07, chờ mắt người duyệt tracking** | 5/5 spike đạt · chạy thật 1 clip: khung 1080×1920, 1/1 gắn effect, 0 lỗi · chưa đo sequence nhiều clip |
| **Auto Podcast** — multicam cắt theo người nói (01/08) | 🟡 **v0.3.1: lõi + UI xong, đo trên liệu TỔNG HỢP** | não 16/16 + stress 12/12 (60 phút · 227 lượt · 0,17s · cười chung/chồng lấn/sample-rate lẫn đều đạt) · dựng cắt-tại-chỗ trên bản sao đo end-to-end trên panel thật · **chờ liệu thật đo bleed** |
| **Guide Frame** — safe zone + lưới bố cục (01–02/08) | 🟢 **v0.1.0 ĐO THẬT TRÊN PREMIERE ĐẠT** | 10 nền tảng · 17 khung · 53 vùng (nguồn chính thức, số vênh ghi nguyên trạng) · UI thật từng app · đặt guideline **0,2s** (chỉ tiêu 2s) · gỡ sạch như cũ từng con số · tab lưới (tỉ lệ/màu/đường tự thêm/preset — ngang Guideify $15) · song ngữ · còn nợ: render soi file + đối chiếu ngược .guides |
| **Web bán hàng** | 🔴 mới dựng khung | Next.js + Drizzle, chưa nối gì |

---

## 4. ☠️ CÒN THIẾU GÌ ĐỂ BÁN ĐƯỢC — xếp theo mức chặn

### 4.1. Chặn NIỀM TIN — nguy nhất, khách bỏ đi vì cái này

**Autocut: chưa chứng minh được "không cắt mất lời".**
Đang lấy chính Whisper + năng lượng để chấm điểm việc cắt do chúng quyết định —
**vòng quanh, nó luôn tự khen mình**. Đã báo "0 câu mất" **ba lần**, ba lần anh
Tiến vẫn nghe ra chỗ mất.

→ Cần **thước đo TỪ NGOÀI**: **Silero VAD** (mô hình khác, không dùng chung
nguyên liệu) hoặc tai anh Tiến.

☠️ **Chừng nào chưa có, mọi con số chỉ được nói ở mức "khá hơn lần trước",
KHÔNG được nói "đã đúng".** Bán mà khách mất lời là hoàn tiền.

### 4.2. Chặn PHÁP LÝ

| | Trạng thái |
|---|---|
| **FFmpeg GPL** | ✅ **XONG 29/07** — đổi sang LGPL `N-125829-gfe953596e9-20260728`, kèm `LICENSE-FFmpeg.txt` + `THIRD-PARTY-NOTICE.txt`, `package-release.ps1` tự đóng gói |
| Whisper | ✅ sạch sẵn — `whisper.cpp` và model đều MIT |
| OpenH264 | ⚠️ đã ghi rõ trong `THIRD-PARTY-NOTICE.txt`: bản build lại từ nguồn **không** thuộc diện Cisco trả phí sáng chế. Cần luật sư xem nếu bán ở Mỹ/EU. |

### 4.3. Chặn CÀI ĐẶT — khách không cài được thì không bán được

| | Vì sao chặn | Chi phí |
|---|---|---|
| **Chữ ký số thương mại** | Đang ký tự tạo → bộ cài phải bật `PlayerDebugMode` trong registry. Bảo khách lạ sửa registry là mất khách. | ~$200–400/năm |
| **macOS** | Editor nước ngoài phần lớn dùng Mac. Cần bundle FFmpeg macOS + notarize. | $99/năm |
| **Khoá bản quyền** | Chưa có. Bán một bản là cả thế giới copy. AutoPod khoá theo máy. | tự làm |
| **Bộ cài GHÉP 4 panel** | Nay mỗi panel một bộ cài riêng. Phải gộp thành **một `SETUP.exe`** cài cả 4. | tự làm |
| Bộ cài nặng | `.zxp` 91,5 MB/panel sau khi đổi LGPL (trước ~48,9 MB). Ghép 4 panel là rất nặng. → cân nhắc **dùng chung một thư mục `bin/`** hoặc tự build FFmpeg tối giản. | tự làm |

### 4.4. Chặn TỐC ĐỘ

**Autocut: video 1 giờ chạy 19 phút.** Mục tiêu anh Tiến đặt: **dưới 5 phút**.
Bước dựng ăn **83%** thời gian — thủ phạm là `overwriteClip` của Adobe, không sửa
được từ ExtendScript. → Đường đi: **xuất FCPXML** rồi import một lần.

### 4.4b. Chặn TRẢI NGHIỆM NGƯỜI MUA — lộ ra từ bài nhập vai 31/07/2026

Đóng vai "editor tự do vừa trả tiền, máy Windows tầm trung, không quen ai":

| | Vì sao chặn | Trạng thái |
|---|---|---|
| **☠️ UI SONG NGỮ Việt–Anh** | Bán cạnh tranh AutoCut/AutoPod ở thị trường Tây mà UI toàn tiếng Việt — khách mở panel là đóng. **Nặng ngang chữ ký số**, xếp vào nhóm "không có thì không bán được". | 🔨 Re-Frames ✅ 31/07 · Auto Podcast ✅ 01/08 (song ngữ từ dòng đầu) · còn 4 panel cũ |
| **Nút xuất MP4** cho short | Người phổ thông mua "file để đăng", không mua sequence. Đường an toàn: hàng đợi AME (`app.encoder`) — render ngoài tiến trình. | chưa — spike theo giao thức an toàn |
| **Onboarding 60 giây** | 5 tab panel, không ai dắt tay 3 bước đầu. Người thường không đọc docs. | chưa |
| **Check update + nút báo lỗi** | Sau bán: khách bơ vơ là khách một lần. | chưa |

(Sửa chữ phụ đề tại chỗ + bộ cài gộp đã nằm ở các mục trên.)

### 4.5. Chặn THỊ TRƯỜNG

**Đa ngôn ngữ.** Hiện khoá cứng `-l vi`. Whisper nghe được 99 thứ tiếng nên mở ra
không khó về kỹ thuật, nhưng **ba tham số đo riêng trên giọng Việt** (biên +2 dB,
`-mc 0`, bảng từ đệm) phải đo lại cho từng ngôn ngữ, mỗi thứ tiếng một file thật.

---

## 5. THỨ TỰ ĐỀ XUẤT

Xếp theo *"cái nào không có thì không bán được"*, không phải theo cái nào dễ.

| # | Việc | Vì sao trước |
|---|---|---|
| 1 | **Silero VAD** — thước đo từ ngoài cho Autocut | Không có nó thì không dám hứa gì với khách. Đây là rủi ro hoàn tiền. |
| ~~2~~ | ~~Đo "mở project khác vẫn thấy nguyên" cho Power Bins~~ | ✅ **XONG 29/07 16:0x** — đo trên `Untitled.prproj` mới tạo: brand/khay/asset còn nguyên, ảnh tải được 320×1800, Import vào timeline chạy (V1: 0→1 clip). File kho SHA-256 không đổi → panel chỉ đọc. |
| 3 | **Xuất FCPXML** cho bước dựng Autocut | 19 phút → mục tiêu dưới 5. Đối thủ nhanh hơn. |
| 4 | **Bộ cài GHÉP 4 panel thành một** | Đúng mô hình bán anh Tiến chốt. Phải có trước khi rao. |
| 5 | **Chữ ký số thương mại** | Không có thì khách lạ cài không nổi. Tốn tiền, làm khi sắp bán. |
| 6 | **Khoá bản quyền** | Bán được rồi mới cần chống copy. |
| 7 | **Đa ngôn ngữ (tiếng Anh trước)** | Mở thị trường. Cần file thật để đo. |
| 8 | **macOS** | Việc lớn nhất, để sau cùng. |

Song song: **web bán hàng** (`AiO WebDessign`) — chưa nối gì vào sản phẩm.

---

## 6. LUẬT CHUNG CHO MỌI DỰ ÁN TRONG THƯ MỤC NÀY

- **Sửa gốc, không vá bề mặt.** Giao diện sai thì soi **dữ liệu** trước.
- **Tự kiểm chứng bằng số đo.** Build sạch **không tính** là đã kiểm. Panel CEP
  đo được thẳng trên bản đang chạy qua cổng debug — xem `scripts\do-tren-panel.ps1`
  của từng dự án.
- **Số đo vô lý thì nghi CÔNG CỤ ĐO trước**, đừng lao vào sửa code.
- **Đo trên quy mô thật.** Chạy đúng trên mẫu nhỏ không chứng minh được gì.
- **Đo cả cái BỊ MẤT ĐI**, không chỉ cái còn lại.
- **Ghi `PROGRESS.md` sau mỗi lần sửa mã nguồn** — mục mới ở trên cùng, giờ lấy
  bằng lệnh, không dấu tiếng Việt, không emoji.
- **Panel là công cụ SỬA THẬT vào dự án của người dùng.** Mọi thao tác ghi lên
  timeline phải thử trên bản sao trước. **Undo là thao tác phá, không phải đường
  lùi an toàn.**

Kinh nghiệm CEP đầy đủ: skill `~/.claude/skills/adobe-cep-panel/`.
