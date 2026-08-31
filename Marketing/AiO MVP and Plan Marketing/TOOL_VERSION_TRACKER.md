# AiO Studio — BẢNG THEO DÕI CÁC APP

> **Số phiên bản đọc thẳng từ `CSXS/manifest.xml` của từng panel, không chép tay.**
> Đối soát gần nhất: **2026-08-24** (Transcripts lên 2.5.2; các dòng khác giữ số 19/08)
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
| 2 | AiO Asset Manager | 2.0.0 | `com.aiostudio.assetmanager` | 8088 | 🧊 Đóng băng | Anh chốt 14/08: *"rất ổn rồi, tạm dừng ở đây"*. Việc mới phải hỏi anh trước |
| 3 | AiO Power Bins | 2.0.0 | `com.aiostudio.powerbin` | 8090 | 🟢 Chạy được | Brand Kit hiện ở mọi project |
| 4 | AiO Transcripts | **2.5.5** | `com.aiostudio.transcript` | 8091 | 🟢 Chạy được | **22/08 đêm:** HAI NÚT — *Làm phụ đề* (caption C1) / *Làm hiệu ứng* (graphic MOGRT, chọn kiểu trong ô xổ) theo ý anh 22/08; vá 6 lỗi vòng soát (caption rơi dưới hình, chữ mẫu im lặng, karaoke < 1 khung, khối 1 từ không sáng, khối > 10 s, kiểu riêng không thay); E2E trên sequence tự tạo: 16/23 caption lên V3 trên hình, chạy lại THAY không chồng. ☠️ Đã đo: Premiere 27 KHÔNG cho API đặt chữ vào graphic native / upgrade caption → hiệu ứng vẫn là MOGRT AE (nặng hơn caption track). Chưa qua vòng anh dùng bài thật. **24/08: vá lỗi caption rơi sang sequence KHÁC** (`activeSequence` tự trôi về tab có tiêu điểm) — bẫy tái lập: ép trỏ sai, caption vẫn vào đúng sequence đang hiện |
| 5 | AiO WELCOME | 1.5.0 | `com.aio.welcome` | 8087 | 🟢 Chạy được | Panel chào mừng |
| 6 | AiO Auto Re-Frames | 0.6.0 | `com.aiostudio.reframe` | 8092 | 🟡 Đang làm | Dọc 9:16 bám chủ thể · **khoanh I/O là tracking đúng đoạn đó** (27/08) |
| 7 | AiO Auto Guideline Frame | 0.3.0 | `com.aiostudio.guideframe` | 8096 | 🟡 Đang làm | Safe zone 10 nền tảng / 53 vùng · **25/08:** vùng chọn In/Out — guide đặt đúng đoạn khoanh (ca có vùng chờ anh bấm thử trên Premiere) |
| 8 | AiO Auto Podcast | 0.6.6 UI · 0.4.9 host (☠️ manifest CSXS còn 0.1.0, chưa từng bump — [CHỜ] anh gật mới sửa, đang đóng băng build) | `com.aiostudio.podcast` | 8094 | 🟢 Chạy được | ✅ **25\08: "cắt đúng NGƯỜI" ĐÃ GIẢI bằng tai anh Tiến** — liệu thật 40 phút 2 người + wide, KHÔNG mic rời (tiếng cam làm mic), 411 nhát, anh nghe "không thấy sai". Còn để bán: FFmpeg riêng · cài máy sạch · khoá gói |
| 9 | AiO Music & SFX | 1.0.0 | `com.aiostudio.music` | 8097 | 🟡 Đang làm | Có UI, chưa nối việc thật |
| 10 | AiO Auto Cut Short | — | (dành `com.aiostudio.cutshort`) | 8093 | ⬜ **Chưa có code** | Chỉ có `CLAUDE.md` + `PROGRESS.md`. Chờ anh chốt 5 câu hỏi sản phẩm |
| 11 | AiO Auto Organize Folder | — | — | — | ⬜ **Chưa có code** | Mới có `yêu cầu.txt` |
| 12 | **AiO Shot & Save** | **0.4.1** | app Electron độc lập (KHÔNG CEP — version từ `package.json`, không có manifest) | — | ✅ **Anh Tiến đã test OK (25/08)** | Chụp vùng (Alt+`, đổi được) + khay ảnh + ghim sticky + vẽ khung/mũi tên 7 màu + Ctrl+C copy + kéo-thả file ra app khác + chụp VẮT NGANG 2 màn + song ngữ VI/EN. **26/08:** chụp vắt 2 màn ghép PIXEL VẬT LÝ (đúng mọi scale — máy anh 150%+125%), hết ảnh tối (content-protection), chọn JPEG/PNG + chất lượng (thấp 125KB/cao 171KB/siêu 221KB), khay hiện dung lượng, khay DỌC (option), run-log luôn bật. **Bộ cài .exe ĐÃ CÓ 26/08** (`Release/2026-08-26-shotandsave-0.3.4/`, NSIS 99MB, đã cài thử chạy thật trên máy công ty; còn [CHỜ]: máy sạch + ký số/SmartScreen). **0.3.5 (26/08 chiều):** chụp được VIDEO ĐANG PHÁT (bật WGC — trước đó vùng video ra trắng/mờ) + hết "khung viền xấu" quanh ảnh ghim. **0.3.6 (27/08):** VẼ khung/mũi tên 7 màu LÊN ẢNH ĐÃ GHIM (Enter lưu → file + thumbnail khay đổi theo); đã CÀI ĐÈ máy anh Tiến (`Release/2026-08-27-shotandsave-0.3.6/`), đo tiến trình chạy 0.3.6.0. **0.3.7 (28/08):** con lăn chuột cuộn được dải ảnh trong khay (anh báo trỏ vào khay lăn không ăn) — bộ cài `Release/2026-08-28-shotandsave-0.3.7/`, anh gật → đã CÀI ĐÈ máy anh, đo tiến trình chạy 0.3.7.0. **0.3.8 (31/08):** đổi phím tắt là LƯU NGAY — hết cảnh "restart máy nó đổi phím" (gốc: phím mới chỉ hiện trên màn, phải bấm Lưu mới lưu — anh đóng cửa sổ tưởng xong); kèm ghi config atomic + run-log ghi boot + báo Notification khi phím bị app khác giữ. **0.3.9 (31/08):** kéo chọn vùng hết giật (màn chủ tự vẽ khung trong mousemove, không đợi vòng IPC qua main — main bận getSources là khung đứng hình) + màn Cài đặt bỏ dòng "Saved" (keycaps nháy xanh thay chữ). **0.3.10 (31/08):** vùng video YouTube hết ĐEN lúc khoanh vùng — dán ảnh WGC làm nền overlay sau khi grab (~0,7s), đảo quyết định 25/08 "không dán frozen"; **0.3.11 (31/08):** ảnh đóng băng hiện dần 160ms + decode trước khi dán — hết "giựt một cái" lúc freeze (ảnh là khoảnh khắc ~0,5s trước, màn đang động); **0.3.12–0.3.13 (31/08):** hết DOUBLE TASKBAR (bẫy 25/08 tái diễn — gốc đo được: Windows kẹp cửa sổ overlay vào workArea, hụt 48px; setBounds lại + vẽ nền theo kích thước màn thật) + chốt chặn tự đo mỗi lần mở, hụt là ghi CANH BAO vào run-log; đã cài đè máy anh, 0.3.13.0, 2 lượt chụp thật không cảnh báo. **0.3.14 (31/08):** GIẢM DUNG LƯỢNG bộ cài 99→84 MB (cắt 53 locale thừa + shader WebGPU 26 MB + nén LZMA max) — verify canvas render vẫn chạy sau khi gỡ GPU dll; đã cài máy anh 0.3.14.0. ☠️ 84 MB gần sàn Electron (Chromium 225 MB); muốn ~5 MB như Lightshot phải viết lại Tauri (chờ anh chốt). **0.3.15 (31/08):** kéo chọn vùng bớt rung — bỏ nguồn vẽ khung trùng (mousemove local + main IPC 16ms toạ độ cũ đá nhau); ☠️ 3 bẫy thước đo trong buổi (getGPUFeatureStatus query sớm báo software giả — thật ra RTX 4060 Ti; rAF vsync-mù với lag; ảnh test phẳng giấu chi phí), không tái lập được lag trong harness → chờ mắt anh chấm. **0.3.16 (31/08):** anh báo giảm giật rồi nhưng "tè le khi kéo" (hồi quy) — chụp overlay tận mắt: toolbar + hint hiện lạc lúc kéo do CSS đè `[hidden]`/`opacity` (id `#toolbar{display:flex}` đè `[hidden]`; `#hint{animation:...both}` đè `.hidden{opacity:0}`) → sửa `[hidden]{display:none!important}` + fill `backwards`; kèm hâm nóng getSources chống giật video lần đầu (sàn ~400ms Electron enumerate không bỏ được); đã cài máy anh 0.3.16.0. **0.3.17 (31/08):** hết "kéo một chỗ NHẢY một chỗ" — chuột kéo VẮT sang màn kia là mousemove màn chủ ngừng (web không pointer capture), mà 0.3.15 chặn main vẽ vô điều kiện → khung đứng hình rồi nhảy; luật mới: local vừa vẽ <50ms thì main nhường, local im thì main TIẾP QUẢN; harness 3 giai đoạn ĐẠT, đã cài máy anh 0.3.17.0. ☠️ Vùng vẽ-khung-khi-kéo hồi quy 3 lần trong ngày → dòng #8 SỔ LỖI TÁI DIỄN (CLAUDE.md repo). **✅ 0.4.0 (31/08):** BẢN PHÁT HÀNH CHỐT theo yêu cầu anh — anh chấm ĐẠT cả chuỗi kéo-chọn ("ngon rồi em, hết nhảy rồi"); gom 10 bản vá trong ngày, `Release/2026-08-31-shotandsave-0.4.0/` (84 MB), đã cài máy anh 0.4.0.0. **0.4.1 (31/08 tối):** MÁY NHÀ anh (màn 5120×2160) "vẫn giật y chang" dù máy công ty đã ĐẠT — gốc đo được: ảnh đóng băng đi base64 ~5,7MB qua IPC đổ vào renderer ĐANG kéo (6/6 lượt drag-start dính 20-40ms sau grab-xong); sửa: ảnh đi protocol `aioshot://` (buffer ở main, IPC chỉ mang URL, CORS sạch cho canvas ghép — harness taint + ghép vắt màn ĐẠT); kèm run-log ghi `keo gap-max` mỗi lượt kéo (số thật từ máy anh) + log giờ địa phương (trước UTC lệch -7h) + selftest cách ly userData (bản cài đang chạy làm selftest xanh giả); `Release/2026-08-31-shotandsave-0.4.1/`, đã cài đè máy nhà 0.4.1.0 — CHỜ ANH CHẤM |

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
| 5 câu hỏi sản phẩm | Auto Cut Short | Chờ anh Tiến chốt mới viết code |
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
