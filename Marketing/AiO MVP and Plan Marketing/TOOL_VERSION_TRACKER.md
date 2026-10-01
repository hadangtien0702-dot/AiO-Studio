# AiO Studio — BẢNG THEO DÕI CÁC APP

> **Số phiên bản đọc thẳng từ `CSXS/manifest.xml` của từng panel, không chép tay.**
> Đối soát gần nhất: **2026-09-08** (thêm #13 Video Download 0.1.0; các dòng khác giữ số 24/08).
> 18/09: thêm #14 Auto Short Viral (chưa có manifest), sửa ghi chú #10 — KHÔNG đối soát lại số bản các dòng khác.
>
> ☠️ File này từng đối soát 07/08 rồi để nguyên 12 ngày — Autocut đã lên 1.6.0 mà
> bảng vẫn ghi 1.5.0. **Mỗi lần bump version một panel thì sửa luôn dòng đó ở đây.**
> Lệnh đọc lại toàn bộ (chạy trong `Build and UI Design/`):
> ```
> for d in */; do m="$d/CSXS/manifest.xml"; [ -f "$m" ] && \
>   printf "%-28s %s\n" "${d%/}" "$(grep -o 'ExtensionBundleVersion="[^"]*"' "$m" | head -1 | cut -d'"' -f2)"; done
> ```

---

## 1. BẢNG TỔNG — 12 app

| # | App | Bản | ID | Cổng | Trạng thái | Ghi chú thật |
|:-:|---|:-:|---|:-:|:-:|---|
| 1 | **AiO Autocut** | **1.6.0** | `com.aiostudio.autocut` | 8089 | ✅ **XONG** | Anh Tiến tự dùng bài thật + **nghe lại, không mất lời** (19/08). Bộ cài `Release/2026-08-19-autocut-1.6.0/` |
| 2 | AiO Asset Manager | 2.0.0 | `com.aiostudio.assetmanager` | 8088 | 🧊 Đóng băng · 📦 bộ cài | Anh chốt 14/08: *"rất ổn rồi, tạm dừng ở đây"*. 14/09 anh: *"xài ổn định rồi"* → bộ cài kèm FFmpeg `Release/AiO Asset Manager/win/` (91,4 MB). Việc mới phải hỏi anh trước |
| 3 | AiO Power Bins | 2.0.0 | `com.aiostudio.powerbin` | 8090 | 🟢 Chạy được | Brand Kit hiện ở mọi project |
| 4 | AiO Transcripts | **2.5.5** | `com.aiostudio.transcript` | 8091 | 🟢 Chạy được | **22/08 đêm:** HAI NÚT — *Làm phụ đề* (caption C1) / *Làm hiệu ứng* (graphic MOGRT, chọn kiểu trong ô xổ) theo ý anh 22/08; vá 6 lỗi vòng soát (caption rơi dưới hình, chữ mẫu im lặng, karaoke < 1 khung, khối 1 từ không sáng, khối > 10 s, kiểu riêng không thay); E2E trên sequence tự tạo: 16/23 caption lên V3 trên hình, chạy lại THAY không chồng. ☠️ Đã đo: Premiere 27 KHÔNG cho API đặt chữ vào graphic native / upgrade caption → hiệu ứng vẫn là MOGRT AE (nặng hơn caption track). Chưa qua vòng anh dùng bài thật. **24/08: vá lỗi caption rơi sang sequence KHÁC** (`activeSequence` tự trôi về tab có tiêu điểm) — bẫy tái lập: ép trỏ sai, caption vẫn vào đúng sequence đang hiện |
| 5 | AiO WELCOME → **AiO Studio (panel tổng)** | **2.1.1** (27/09) | `com.aiostudio.hub` | **8101** | 🟢 Đo trên Premiere thật 25/09: 10/10 tool mở từ thẻ; chờ anh dùng thật | Bệ phóng mở 12 tool, phong cách Option 2 · **25/09:** đồng bộ token UI với web Shot & Save (sáng/tối), animation "vào" lúc mở panel như web, bỏ gạch dài trong chữ; ☠️ thư mục còn untracked trong git |
| 6 | AiO Auto Re-Frames | 0.6.1 (27/09) | `com.aiostudio.reframe` | 8092 | 🟡 Đang làm | Dọc 9:16 bám chủ thể · **khoanh I/O là tracking đúng đoạn đó** (27/08) |
| 7 | AiO Auto Guideline Frame | 0.3.2 (27/09) | `com.aiostudio.guideframe` | 8096 | 🟡 Đang làm (anh test ĐẠT 0.3.0 ngày 21/09) | Safe zone 10 nền tảng / 53 vùng · **25/08:** vùng chọn In/Out — guide đặt đúng đoạn khoanh · **25/09 (0.3.1):** hết track trống thì tự thêm track video lên trên cùng (QE addTracks, đo thật 298 ms) + tìm track trống theo vùng In/Out; cùng ngày sửa thêm lỗi cũ "gỡ guide ở sequence B làm mất guide ở A" + bỏ quét xoá PNG trên đĩa; cài máy công ty, chờ anh bấm trên bài 11 track |
| 8 | AiO Auto Podcast | 0.6.7 UI (27/09) · 0.4.9 host (☠️ manifest CSXS còn 0.1.0, chưa từng bump — [CHỜ] anh gật mới sửa, đang đóng băng build) | `com.aiostudio.podcast` | 8094 | 🟢 Chạy được | ✅ **25\08: "cắt đúng NGƯỜI" ĐÃ GIẢI bằng tai anh Tiến** — liệu thật 40 phút 2 người + wide, KHÔNG mic rời (tiếng cam làm mic), 411 nhát, anh nghe "không thấy sai". Còn để bán: FFmpeg riêng · cài máy sạch · khoá gói |
| 9 | AiO Music & SFX | 1.0.1 · UI v2.1 (27/09) | `com.aiostudio.music` | 8097 | 🟡 Đang làm | Bộ đo key viết lại (22,4% → 79,0% phép nâng cao độ) · ô thả + tự theo clip đang chọn · chờ anh thử |
| 10 | ~~AiO Auto Cut Short~~ | — | — | — | ⛔ **Đã GỘP vào Auto Short Viral 21/09** (anh: *"2 cái này là một và giữ cái tên Auto Short Viral là chính"*); cổng 8093 trả lại |
| 11 | AiO Auto Organize Folder | — | — | — | ⬜ **Chưa có code** | Mới có `yêu cầu.txt` |
| 13 | **AiO Video Download** | **0.2.2** | `com.aiostudio.videodownload` | **8098** | 🟢 Đã cài máy công ty 21/09; anh tự test "thấy ổn" 14:51; 0.2.1 engine tự cập nhật ngầm (không còn nút); 0.2.2 sửa 4 lỗi do Codex soát chéo bắt | Dán link → tải video (yt-dlp + QuickJS + FFmpeg LGPL) → tự vào bin "AiO Video Download". Đo 08/09: YouTube 1080p H.264 255,9 MB/30 s; TikTok chặn ngẫu nhiên ~1/6 request → tự thử lại 3 lần; Vimeo cần cookie trình duyệt. Anh Tiến đang bấm thử trên project copy, chưa qua bài thật. Mã ở `Build and UI Design/AiO Video Download/` |
| 14 | **AiO Auto Short Viral** | **0.1.2** | `com.aiostudio.shortviral` | **8100** | 🟢 **Đã cài máy công ty 21/09, chạy thật trong Premiere** | CEP + React; nghe bằng whisper.cpp local (dùng lại đệm `.autocut-nghe.json`). Chia khối HỎI–ĐÁP (giao diện THẺ, anh chốt 21/09), pill chọn/bỏ chọn tất cả, tạo sequence (mỗi khối / gộp một, có tiến độ từng khối), đặt marker có chữ ký `[AiO SV]`, tab *Toàn bộ lời* xem từng chữ + điểm tin cậy, chép / xuất `.txt` `.srt`. Đo: bộ 40 phút → 61 khối; sequence 20 phút → 37 khối trong 253 ms; gộp 4 khối 4,1 s; in/out clip gốc không đổi; bộ kiểm 222/0. Chưa: AI offline (anh chốt 20/09 không Ollama, chờ gật), ranh giới với Cut Short, bản Mac, bộ cài phát hành |
| 12 | **AiO Shot & Save** | **0.8.0** (01/10: QUAY VIDEO vùng màn hình — khoanh vùng + nút Quay / phím R → MP4, bấm Dừng (trần 5 phút), luôn có tiếng máy, Khay video riêng có nút Có tiếng / Không tiếng, không cần FFmpeg; sửa lỗi giật 11:10 (hình thật 5 → 30 lần/giây, bảng đếm 91–94% khung đúng nhịp); viền cam không lọt vào video; chờ anh xem lại sau khi sửa giật; 0.7.9 29/09 16:09: ĐỌC CHỮ — khoanh vùng + phím 5 → bảng các dòng chữ + Sao chép; Windows đọc bằng Tesseract kèm app vì Windows không có bộ đọc tiếng Việt, sai 0,2–0,7% trên đoạn chuẩn, ~1–2 s; Mac dùng Apple Vision, chưa đo; anh test: "khá là tốt rồi"; 0.7.8: khay Storyboard giữ dải sau khi tắt app, mỗi dải 1 hàng, xoá từng khung, KÉO CẢ DẢI thả vào app khác, xuất lưới; ô mã = "Dán key"; anh dùng thử: "khá mượt") | app Electron độc lập (KHÔNG CEP — version từ `package.json`, không có manifest) | — | ✅ **Anh Tiến đã test OK (25/08)** | Chụp vùng (Alt+`, đổi được) + khay ảnh + ghim sticky + vẽ khung/mũi tên 7 màu + Ctrl+C copy + kéo-thả file ra app khác + chụp VẮT NGANG 2 màn + song ngữ VI/EN. **28/09 (0.7.0):** Tích hợp nút và menu chọn Multi-Shot Storyboard Strip ngay trên khung kéo chọn Overlay và thanh toolbar (phím S). **0.6.8-0.6.9:** Ghép ảnh khay thành dải/lưới phân cảnh. **0.6.6-0.6.7:** Khảm khối và Mờ mịn. |

**Không phải app:** `AiO Design System` (file thiết kế anh chốt) · `design-system`
(token dùng chung) · `AiO Git Public` · `Website/AiO WebDessign` (web bán hàng,
Next.js — xem `Website/AiO WebDessign/PROGRESS.md`).

---

## 2. GÓI BÁN — anh Tiến chốt 16/08

| Gói | Gồm | Giá |
|---|---|---|
| Free | **CHỈ** Asset Manager | 0 |
| Pro | Đủ 8 tool | **$17 / THÁNG** |

Không có lifetime, không có gói năm. (Bản 13/08 ghi "3 tool free" đã **hết hiệu lực**.)

---

## 3. VIỆC ĐANG CHỜ — đọc trước khi nhận việc mới

| Việc | Thuộc app | Vì sao chưa làm |
|---|---|---|
| **Cài thử trên MÁY SẠCH** | Autocut | Món duy nhất còn chặn beta. Chỉ anh Tiến làm được |
| Tốc độ: video 1 giờ ~19 phút | Autocut | Bước dựng ăn 83% (`overwriteClip` của Adobe). Cần xuất FCPXML |
| Ba ca khó chưa đo | Autocut | Nhiều người + xa mic · nhạc nền · video >30 phút |
| `color-scheme: dark` cho cả bộ | Transcripts + panel khác | Mới sửa riêng Autocut. Đưa lên `design-system/tokens.css` là chạm 4 panel, phải đo lại từng cái |
| Ca mic rời bleed nặng chưa có đáp án tai | Auto Podcast | 25\08 đã giải "cắt đúng người" cho ca tiếng-cam-làm-mic; riêng bộ Will–Trọng (mic rời, bleed nặng) 8 clip stereo `podcast-nghe-kiem-2` vẫn chờ anh chấm |

| **Bộ cài phải CÀI FONT** (Montserrat ×3 + Bangers, OFL, trong `fonts/`) | Transcripts | Caption MOGRT cần font trên máy khách; Montserrat có trên Adobe Fonts (tự sync) nhưng Bangers thì không. Chưa sửa `package-release.ps1`/bộ cài |
| **Autocut đếm clip caption MOGRT như clip video** → từ chối chạy ("đổi tốc độ 2083%") trên sequence đã có caption AiO | Autocut | Cùng hàm `ac_getRangeClips`; Transcripts đã vá (bỏ qua `.mogrt`). Autocut ĐÓNG BĂNG → **hỏi anh** trước khi vá 1 dòng |
| Anh Tiến dùng caption kiểu hiệu ứng trên bài thật | Transcripts | Mới đo trên sequence test 20 s; chưa có thước tai người |

---

## 4. ☠️ BẢO MẬT — phát hiện 19/08, CHƯA XỬ

Repo GitHub `hadangtien0702-dot/AiO-Studio` đang để **PUBLIC**, trong đó có:
- **3 file chứng chỉ ký** `aiostudio-dev.p12` (Guide Frame · Podcast · Re-Frames)
- **Mật khẩu chứng chỉ** nằm nguyên văn trong 5 script `.ps1`

Ai cũng lấy được cả hai → ký được file `.zxp` mạo danh "AiO Studio".
**Mức thật:** chứng chỉ **tự tạo**, Windows không tin sẵn nên máy khách vẫn phải
bấm "Run anyway" — thiệt hại là **danh tiếng**, không phải chiếm quyền máy.
Anh Tiến 19/08 chốt: *"cứ push, tính sau"*.

---

## 5. Cách đọc bảng này

- **Số bản** lấy từ manifest, là thứ Premiere đọc. Panel còn hiện số đó ở góc trên.
- **Trạng thái** nói bằng việc làm được, không bằng tính từ:
  ✅ xong = người dùng đã dùng thật và duyệt ·
  🟢 chạy được = chạy đúng nhưng chưa qua vòng dùng thật ·
  🟡 đang làm · 🧊 đóng băng · ⬜ chưa có code
- Chi tiết từng app nằm ở `PROGRESS.md` **trong thư mục app đó** — file này chỉ là
  bảng tổng, đừng chép nội dung sang đây rồi để hai nơi nói khác nhau.
