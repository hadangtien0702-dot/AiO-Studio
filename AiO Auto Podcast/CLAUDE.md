# AiO Auto Podcast — đọc cái này trước

> Dự án thứ 7 của bộ AiO Studio. Anh Tiến giao 2026-08-01:
> *"tiếp theo là podcast tool nha em"* — và cùng ngày: *"rồi vào việc đi em"*.
>
> **TRẠNG THÁI 04/08/2026: panel v0.3.6 · host v0.3.1 — ĐÃ CÀI.**
> Trạng thái chi tiết từng tính năng (xong/chưa/lỗi mở): **`TRANG-THAI.md`**
> — anh Tiến yêu cầu, mỗi phiên sửa code PHẢI cập nhật. Diễn biến: `PROGRESS.md`.
> Giải thích chi tiết về Âm thanh & Quy trình Auto Cut: `GIAI-THICH-AUDIO-CHO-CLAUDE.md`.
>
> Chốt trong ngày 04/08:
> - `dist/` ĐÃ vào git (commit f6c7e70, 03/08) — hết cảnh mất trắng.
> - Sàn im lặng −50 dB cứng → **Otsu tự đo theo file** (bàn đo có đáp án:
>   sàn cứng 0/6 ở tiếng nhỏ, tự đo 12/12). Ngưỡng chênh 6 dB giữ nguyên.
> - Tiếng mic stereo hết xé 2 track (panel tách bản `.aio-mono.wav` cạnh
>   file gốc rồi đặt bản đó). Ô CHỌN sequence làm việc. CAM CHUNG gán được
>   (im >2s về wide). Thất bại hiện KHUNG TO kèm số đo từng người.
> - **Lỗi số 1 (cắt sai người trên liệu thật) ĐÃ CÓ CHẨN ĐOÁN** từ 12
>   marker anh Tiến chấm + soi khung hình: phần lớn do KHÂU THU (giọng
>   Dilys vào mic Trọng to hơn chính mic cô ấy 10 dB; line-in cam Trọng
>   gần như câm −75,5 dB). Code còn cứu được ~2-3/12 mốc (nới luật onset)
>   — CHƯA làm, chờ anh Tiến chốt ưu tiên.
> - ☠️ **CẤM HỌ API XUẤT TỪ SCRIPT** (`exportAsMediaDirect`, `app.encoder.*`)
>   — 04/08 lặp lại tai nạn đã ghi trong skill từ 01/08, Premiere sập trên
>   project thật. Trước khi dò API host lạ: grep skill `adobe-cep-panel` TRƯỚC.

> 📋 **BẢNG "CÁI GÌ XONG, CÁI GÌ CHƯA": `TRANG-THAI.md`** — anh Tiến yêu cầu
> 04/08 khi test gặp nhiều trở ngại. Mỗi phiên sửa mã nguồn PHẢI cập nhật nó
> (chỉ ghi ✅ khi có số đo trong PROGRESS.md).

| | |
|---|---|
| Extension ID | `com.aiostudio.podcast` |
| Cổng debug | **8094** (8088 Asset · 8089 Autocut · 8090 PowerBins · 8091 Transcripts · 8092 ReFrames) |
| Cài dev | `powershell -File scripts/sign-install.ps1` (tự chạy bộ kiểm não trước khi ký) |
| Đo trên panel | `scripts/do-tren-panel.ps1 -Expression "..."` (mặc định cổng 8094) |
| Kiểm não | `node tests/kiem-nao.mjs` — 16 phép kiểm, có seed, thoát mã 1 nếu trượt |
| Stress | `node tests/stress.mjs` — 12 ca khó (chồng lấn, cười chung, 60 phút, sample rate lẫn…), gác cổng cài |
| Liệu thử | `node tests/sinh-lieu-media.mjs` → `../file pr for test/podcast-lieu/` |

---

## Sản phẩm này làm gì — ba lớp

### Người xài
Podcast quay nhiều cam, mỗi người một mic riêng, đã sync vào MỘT sequence.
Mở panel → chỉ cho tool biết *track nào là cam ai, track nào là mic ai* →
bấm **một nút** → tool nghe mic từng người, dựng **sequence mới**: ai đang
nói thì hình cắt qua cam người đó và tiếng là mic người đó. Bản gốc giữ nguyên.

*Ví dụ đời thường:* tập podcast 1 tiếng 2 khách — editor phải nghe lại cả
tiếng và đặt vài trăm nhát cắt chuyển cam bằng tay. Tool làm phần đó trong
vài phút; editor chỉ tinh chỉnh nhịp. Đối thủ trực tiếp: **AutoPod $29/tháng**
chỉ cho đúng tính năng này — mình offline, nằm trong bộ, một giá.

### Builder — chạy thế nào, chỗ nào dễ hỏng
- **Não** `dist/nao.js` — file THUẦN (không Node/CEP, kiểm được ngoài
  Premiere): RMS cửa sổ 20ms từng mic → mic to nhất chênh mic nhì ≥6dB là
  người đó đang nói → cửa sổ mù giữ người trước (hysteresis) → nuốt lượt
  <1s (chống nhấp nháy cam — anh chốt đây là chống lỗi, không phải tối ưu).
  **Gãy an toàn:** <20% cửa sổ phân biệt được → trả `KHONG_PHAN_BIET`,
  panel bảo người dùng kiểm tra thu âm — KHÔNG đoán bậy.
- **Host** `host/podcast.jsx` (v0.2): `pc_nhanBan` CLONE sequence nguồn
  (giữ settings/số track/tên track) rồi gỡ sạch clip → `pc_datHinh` đặt
  từng đoạn cam về ĐÚNG TRACK GỐC, ĐÚNG VỊ TRÍ gốc (không dồn — nhìn như
  timeline bị cắt) → `pc_donTieng` gỡ tiếng cam kéo theo → `pc_datTieng`
  đặt mic về đúng track gốc của mic. Ghi theo LÔ ~20 đoạn + chốt `SEQ_DOI`
  mỗi lô + `pc_phienBan()` CUỐI FILE (evalFile có thể nuốt file giữa chừng
  không báo lỗi — panel kiểm version sau mỗi lần nạp).
- **Hai chốt an toàn trước khi dựng** (từ ca thật 01/08 anh Tiến gán nhầm
  A1 = tiếng cam làm mic → cả tập thành 1 lượt): (1) mic có phổ âm lượng
  ĐỀU suốt (p90−p10 < 6dB, p50 > −50) → chặn, chỉ rõ tên người + track;
  (2) não nghe ra < 2 lượt → chặn và giải thích. Không bao giờ báo thành
  công cho một bản dựng đáng ngờ.
- **Panel** `dist/index.html` — tĩnh, không build (khuôn Re-Frames). Song
  ngữ VI/EN. FFmpeg MƯỢN của Transcripts/Autocut (như Re-Frames làm).
- ☠️ **Bẫy đã đo 01/08:** item WAV lưu in/out HỤT xuống lưới ~0,025s, đặt
  lên track tròn XUỐNG khung hình → tiếng hụt 1 khung so với hình. Đã sửa
  gốc trong `pc_themTieng`: đệm out +0,05s, đặt tuần tự tăng để clip sau
  cắt đuôi đệm. Đừng bỏ phần đệm đi khi "dọn code".

### MVP — "xong" nghĩa là gì, đo bằng số nào
Đo thật 01/08/2026 trên Premiere Beta 26.5, liệu tổng hợp có đáp án
(2 cam + 2 mic, 89s, 10 lượt, bleed −16dB):

| Phép đo | Kết quả |
|---|---|
| Não trên bộ kiểm (bleed −16/−8dB) | 10/10 lượt · ranh lệch **0ms** · câu chen 0,6s bị nuốt |
| Não khi mic giống nhau (−5dB) | Trả lỗi tử tế, không đoán — **0 đoạn bịa** |
| Dựng trên Premiere: hình | **10/10 clip đúng cam đúng người**, ranh khớp từng frame |
| Dọn tiếng cam | 10 → **0** clip tiếng cam, hình nguyên 10/10 |
| Tiếng mic | **10/10 đúng mic đúng người**, ranh hình–tiếng khớp tuyệt đối |
| Tổng thời lượng | 89,000s — đúng bằng liệu gốc |
| **v0.2 end-to-end trên PANEL THẬT** (16:00) | Bài âm tính: gán tiếng cam làm mic → **CHẶN đúng câu, không dựng**. Bài dương tính: 10 lượt (5+5), thước ngoài đo V0=5 đoạn camA · V1=5 camB · mic đúng track đúng người, vị trí khớp đáp án |

**CHƯA đạt / còn nợ (lý do):**
- Anh Tiến chưa tự tay bấm bản v0.2 (mọi phép đo trên là em điều khiển panel
  thật qua cổng debug — thao tác tay của anh vẫn là thước cuối).
- Mỗi clip đặt ra có đuôi đệm ≤0,08s chống hụt khung (đo thật); giữa hai
  track khác nhau đuôi này thành overlap nhỏ — tiếng phòng, không nghe ra.
- ☠️ **BLEED LIỆU THẬT chỉ 6,2–7,1 dB** (đo 03/08) so với −16 dB của liệu
  tổng hợp. **Sàn −50 dB cứng ĐÃ SỬA 04/08** thành Otsu tự đo theo file
  (nghe rõ 23% → 28,1%). Ngưỡng chênh 6 dB giữ nguyên. Phần còn sai nằm ở
  KHÂU THU (xem chẩn đoán 12 marker trong `PROGRESS.md` 04/08 14:57):
  giọng người này lọt vào mic người kia to hơn chính mic họ — thuật toán
  so năng lượng không vượt qua được, đã chứng minh bằng 2 phép thử
  (line-in + chuẩn hoá gain, cùng ngày).
- **Chưa có thước ĐỨNG NGOÀI.** Mọi số trên là dùng chính năng lượng dB
  chấm điểm thuật toán cũng chạy bằng dB (bài học 5d) — chỉ nói được "kết
  quả trông hợp lý", KHÔNG nói được "cắt đúng". Đã dựng bộ nghe kiểm
  `file pr for test\podcast-nghe-kiem\` (12 clip 6 giây + `_BANG-CHAM.csv`),
  chờ anh Tiến chấm bằng tai.
- ✅ **`dist/` ĐÃ vào git từ 03/08** (commit f6c7e70 — từng mất một lần vì
  `.gitignore` chung nuốt). Panel này không có bước build, `dist/` LÀ mã
  nguồn viết tay — đừng bao giờ cho nó vào ignore lại.
- **Hai bẫy nằm trong chính dữ liệu người dùng** (bắt được 03/08): tên file
  từ Mac chứa ký tự **U+F022** (dấu `"`) làm mọi lệnh truyền tên qua CLI gãy
  hết dù `Get-ChildItem` đọc bình thường — bản bán phải xử lý; và file mic
  **trùng từng byte** (cùng MD5) nếu gán làm 2 người thì chênh luôn = 0 dB.
- FFmpeg chưa bundle riêng (bản bán mới cần).

---

## ✅ QUYẾT ĐỊNH SẢN PHẨM — ANH TIẾN CHỐT 01/08/2026 (đừng làm ngược lại)

| Câu hỏi | Anh chốt | Nghĩa là |
|---|---|---|
| Đầu vào audio | **Mỗi người một mic riêng** | Đo năng lượng từng mic — không cần ML. Track trộn = để bản sau |
| Gán cam/mic | *"anh sẽ là người CHỌN cam và mic cho em"* | UI có bước GÁN: người dùng tự chỉ track nào = cam ai, mic ai. Không đoán theo thứ tự track |
| Nhịp dựng | *"CHƯA CẦN tối ưu — cut đúng cam và audio trước"* | **MVP = cắt ĐÚNG.** Không luật wide, không nhịp nghệ thuật ở v1. Chỉ giữ ngưỡng gộp ~1s chống nhấp nháy |
| Đồng bộ | Người dùng sync trước bằng Premiere Synchronize | Tool giả định các track đã sync trên MỘT sequence |

Ràng buộc MVP thêm (tự đặt, nói rõ trên UI khi vi phạm): mỗi track được gán
phải có **đúng 1 clip liền** — sync xong để nguyên là đạt. Nhiều clip/track
= bản sau.
