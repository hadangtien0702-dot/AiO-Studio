# AiO Studio — SỔ CẬP NHẬT TOÀN BỘ PHẦN MỀM

> Lập 2026-09-13 theo lệnh anh Tiến: *"làm một hệ thống ghi nhận lại toàn bộ
> phần mềm - những bản update"*. Một chỗ duy nhất, mỗi app một mục, mỗi bản
> một dòng: **ngày · bản · làm gì · ai chấm**.
>
> **Luật ghi:** bump version app nào → thêm dòng ở mục app đó, dòng mới trên
> cùng. Số bản đọc từ `CSXS/manifest.xml` (panel CEP) hoặc `package.json`
> (Shot & Save). Bản đã có bộ cài thì ghi thư mục `Release/`. Bản anh Tiến
> chấm bằng tay/tai thì ghi rõ chữ **anh chấm**. Bản chỉ chạy xanh trên máy
> dev thì ghi **chưa qua tay anh**.
>
> Bảng trạng thái hiện tại (một dòng một app): `Marketing/AiO MVP and Plan
> Marketing/TOOL_VERSION_TRACKER.md`. Chi tiết kỹ thuật từng ngày: `PROGRESS.md`
> trong thư mục từng app. File này đứng giữa: đủ để nhìn cả bộ, không quá dài.
>
> Bản đồ FigJam "AiO Studio" là hình của file này — sửa file trước, chép lên
> FigJam sau.

Ký hiệu: ✅ anh chấm đạt · 🟢 chạy được, chưa qua tay anh · 🟡 đang làm ·
🧊 đóng băng · ⬜ chưa có code · 📦 có bộ cài trong `Release/`

---

## TỔNG QUAN — 13 app, bản hiện hành (14/09/2026)

| # | App | Bản | Trạng thái | Bản đầu | Bản mới nhất |
|:-:|---|:-:|:-:|:-:|:-:|
| 1 | Autocut | 1.6.0 | ✅ xong, ngưng phát triển | 14/08 beta-01 | 19/08 |
| 2 | Asset Manager | 2.0.0 | 🧊 đóng băng | 14/08 | 24/08 |
| 3 | Power Bins | 2.0.0 | 🟢 | 14/08 | 24/08 |
| 4 | Transcripts | 2.5.5 | 🟢 | 14/08 | 24/08 |
| 5 | WELCOME | 1.5.0 | 🟢 | 24/08 | 24/08 |
| 6 | Auto Re-Frames | 0.6.0 | 🟡 | 30/07 | 27/08 |
| 7 | Auto Guideline Frame | 0.3.0 | 🟡 | 02/08 | 26/08 |
| 8 | Auto Podcast | UI 0.6.6 · host 0.4.9 (manifest 0.1.0) | 🟢 | 01/08 | 31/08 |
| 9 | Music & SFX | 1.0.0 | 🟡 | 14/08 | 14/08 |
| 10 | Auto Cut Short | — | ⬜ | 30/07 (móng) | — |
| 11 | Auto Organize Folder | — | ⬜ | 14/08 (yêu cầu) | — |
| 12 | Shot & Save (Electron) | **0.4.16** | ✅ | 24/08 | 14/09 |
| 13 | Video Download | 0.1.0 | 🟡 | 08/09 | 10/09 |

---

## 1. AiO Autocut — `com.aiostudio.autocut` · 8089

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 19/08 | **1.6.0** | Anh dựng bài thật 1 giờ, nghe lại không mất lời. **Ngưng phát triển.** 📦 `Release/2026-08-19-autocut-1.6.0/` 46 MB | ✅ anh chấm |
| 14/08 | 1.5.0 | Gói beta-01 chung cả bộ. 📦 `Release/2026-08-14-beta-01/` | 🟢 |
| 03/08 | — | UI chốt theo thiết kế anh tự dựng; đổi sang cửa sổ riêng Modeless 1280×800 | ✅ UI |
| 07/2026 | 1.x | Dò khoảng lặng → cắt + xoá + dồn clip; bộ đệm nghe dùng chung với Transcripts | 🟢 |

Nợ còn treo: cài máy sạch · tốc độ 19 phút/giờ (mục tiêu <5) · đếm caption MOGRT như clip video (đóng băng, hỏi anh trước khi vá).

## 2. AiO Asset Manager — `com.aiostudio.assetmanager` · 8088

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 24/08 | 2.0.0 | Đồng bộ token design-system (sự cố `--accent-on` làm nút cam 11px tụt tương phản 6,2→2,7, đã ghi sổ) | 🟢 |
| 14/08 | 2.0.0 | **Đóng băng** — anh: *"rất ổn rồi, tạm dừng"*. Là gói FREE | 🧊 |
| 29/07 | — | FFmpeg đổi sang LGPL, proxy 360p dùng `libopenh264` (nhanh gấp đôi, SSIM 0,9655) | 🟢 |
| 07/2026 | 1.x | Kho ~28.900 asset: quét → xem/nghe → chèn timeline; turbo 8 tiến trình × 2 luồng | 🟢 |

## 3. AiO Power Bins — `com.aiostudio.powerbin` · 8090

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 24/08 | 2.0.0 | Đồng bộ token design-system | 🟢 |
| 14/08 | 2.0.0 | Gói beta-01 | 🟢 |
| 07/2026 | 1.x | Brand Kit theo brand, hiện ở mọi project Premiere; ~90% mã chung Asset Manager, kho riêng | 🟢 |

## 4. AiO Transcripts — `com.aiostudio.transcript` · 8091

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 24/08 | **2.5.5** | Vá caption rơi sang sequence khác (`activeSequence` trôi theo tab). Khối hiệu ứng **ẨN** (`HIEN_HIEU_UNG=false`) vì 3 đường native Premiere 27 chết. 📦 `Release/2026-08-24-transcript-2.5.5/` | 🟢 |
| 22/08 | 2.5.x | Hai nút *Làm phụ đề* / *Làm hiệu ứng* (MOGRT); vá 6 lỗi vòng soát; E2E 16/23 caption lên V3 | 🟢 |
| 14/08 | 2.x | Gói beta-01 | 🟢 |
| 07/2026 | 1.x | Chép lời thành .srt + marker chỗ nghe không chắc (whisper `turbo`) | 🟢 |

Nợ: bộ cài phải cài font (Montserrat ×3 + Bangers) · anh dùng caption hiệu ứng trên bài thật.

## 5. AiO WELCOME — `com.aio.welcome` · 8087

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 24/08 | 1.5.0 | Panel chào mừng, không build | 🟢 |

## 6. AiO Auto Re-Frames — `com.aiostudio.reframe` · 8092

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 27/08 | 0.6.0 | Khoanh In/Out là tracking đúng đoạn đó | 🟡 |
| 14/08 | 0.x | Vào gói beta-01 | 🟡 |
| 30/07 | 0.1.0 | Sinh móng: nhân bản sequence thành bản dọc 9:16, Sensei bám chủ thể | 🟡 |

## 7. AiO Auto Guideline Frame — `com.aiostudio.guideframe` · 8096

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 26/08 | 0.3.0 | Vùng In/Out: guide đặt đúng đoạn khoanh; đo đặt 0,74s / gỡ 0,13s trên sequence 4K 306 clip | 🟡 |
| 06/08 | 0.2.x | Ghép UI anh chốt (sự cố chép đè `dist/index.html` mất 14 id JS — đã ghi sổ) | ✅ UI |
| 02/08 | 0.1.0 | Data 10 nền tảng / 53 vùng; đo thật trên Premiere đặt/gỡ 0,2s; anh import `.guides` OK | ✅ |

## 8. AiO Auto Podcast — `com.aiostudio.podcast` · 8094

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 31/08 | UI 0.6.6 · host 0.4.9 | Chỉnh nhỏ; manifest vẫn 0.1.0, **chờ anh gật** mới bump | 🟢 |
| 25/08 | 0.6.x | *"Cắt đúng người"* giải bằng tai anh: liệu 40 phút 2 người + wide, 411 nhát, *"không thấy sai"* | ✅ trong phạm vi đã nghe |
| 04/08 | 0.4.x | UI chốt theo thiết kế anh | ✅ UI |
| 02/08 | 0.3.1 | Panel + UI bản đồ track + stress 12/12 (60 phút / 227 lượt) | 🟢 |
| 01/08 | 0.1.0 | Spike não: multicam tự cắt theo người đang nói | 🟢 |

Chưa đo: >2 người · mic rời bleed nặng (bộ Will–Trọng) · >1 giờ.

## 9. AiO Music & SFX — `com.aiostudio.music` · 8097

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 14/08 | 1.0.0 | Có UI, chưa nối việc thật | 🟡 |

## 10. AiO Auto Cut Short — dành `com.aiostudio.cutshort` · 8093

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 30/07 | — | Đặt móng, chờ anh chốt 5 câu hỏi sản phẩm | ⬜ |

## 11. AiO Auto Organize Folder

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 14/08 | — | Mới có `yêu cầu.txt` | ⬜ |

## 12. AiO Shot & Save — app Electron độc lập (ngoài Premiere)

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 14/09 | **0.4.17** | Thư mục mặc định `%LOCALAPPDATA%\shotandsave`, file `shotandsave-…`; **kéo-thả an toàn**: đường dẫn có `&`/dấu cách/ký tự lạ thì kéo qua hard link `.keo` (người dùng chọn thư mục gì cũng kéo được vào Chrome/Lark/Teams/Zalo). Unit 4/4, selftest 5/5. Anh: *"kéo ầm ầm rồi"* | ✅ anh chấm |
| 14/09 | 0.4.16 | Thư mục ảnh mặc định → `%LOCALAPPDATA%\AiOShotSave\AnhChup`: tên cũ có `&` làm kéo-thả vào Chrome/Lark/Teams/Zalo/Messenger ra file RỖNG (đo 3 cửa sổ thả thử); 123 ảnh dời, dọn 133 MB rác Tauri/updater. Đích kéo-thả đo thật: Premiere, Photoshop, Explorer, Claude, Messenger, Lark, Teams, Zalo, Chrome, FigJam | ✅ anh chấm |
| 14/09 | 0.4.15 | Chụp TRƯỚC khi phủ overlay (kiểu Lightshot): overlay phủ ≥0,5 s là WGC trả video đen (đo) → YouTube/Facebook hết đen; overlay hiện ~0,6 s kèm hình đứng yên | ✅ anh chấm |
| 14/09 | 0.4.14 | Fade ảnh đóng băng 160→100 ms. Đo sàn getSources ~370 ms (chụp 1×1 cũng vậy). **Anh chốt KHÔNG làm mô-đun chụp native/Tauri** | ✅ anh chấm |
| 14/09 | 0.4.13 | Chụp nhanh 2,7× (grab 1.240→465 ms): ảnh đóng băng JPEG chỉ để nhìn (toPNG 4K = 642 ms trên luồng chính), lúc Xong cắt đúng vùng từ ảnh gốc PNG qua `aioshot://raw` → file lưu vẫn lossless. Harness `test:raw` | ✅ anh chấm |
| 14/09 | 0.4.12 | Kéo to khay = THẤY NHIỀU ẢNH HƠN: lưới ô cố định, ngang thêm hàng / dọc thêm cột (0.4.10–0.4.11 phóng ảnh = sai ý, đã đè). Harness `test:co-khay` 8/8 | ✅ anh chấm |
| 14/09 | 0.4.10 | Kéo to khay: tay nắm góc trên-trái, sàn = cỡ cũ, trần 60% màn chứa khay, nhớ cỡ riêng dọc/ngang | ❌ đè (phóng ảnh) |
| 14/09 | 0.4.9 | Màn tối đi mượt sau phím tắt: grab chờ 200 ms cho lớp mờ tối xong (đo screencast 40 ms: 3 khung rồi đứng 1 s). Nhãn khay Ngang/Dọc | ✅ anh chấm |
| 14/09 | 0.4.8 | Ảnh ghim: rê chuột hiện 3 nút khung/mũi tên/chữ, bấm là vào vẽ (sau khi bỏ bút chì 10/09 chỉ còn phím 1/2/3, cầm chuột không vào được) | ✅ anh chấm |
| 14/09 | 0.4.7 | Nhãn tray `&&` (hết "AiO Shot  Save") + nhật ký chẩn đoán cửa sổ ghim | 🟢 trung gian |
| 14/09 | 0.4.6 | Thư mục ảnh mặc định dời RA NGOÀI thư mục cài — cài đè NSIS xoá thư mục cài, mất 2 ảnh anh chụp (sổ lỗi #11) | ✅ anh chấm |
| 14/09 | 0.4.5 | Chữ có HỘP NỀN tối bo góc, bỏ viền chữ; ô gõ cùng nền (WYSIWYG) | 🟢 |
| 14/09 | 0.4.4 | Cài đè máy công ty sau khi gỡ Tauri (75 ảnh chép ra trước). Công cụ CHỮ + phím 1/2/3 + sửa khung ghim lệch 1,5× (sổ lỗi #10). Anh: *"ổn định rồi"* | ✅ anh chấm |
| 13/09 | 0.4.3 | Anh test máy nhà từ mã nguồn: *"mượt rồi"*. Phát hiện Lightshot giữ phím `Shift+``. Thư mục Tauri xoá khỏi repo | ✅ anh chấm |
| 10/09 | **0.4.3** | Không lưu được ảnh thì báo + clipboard + vẫn vào khay (hết mất im lặng); grab lỗi 1 màn không kéo mất màn kia; cuộn khay mượt (p95 46→30ms); `npm test` tự chấm; ghim Electron 43.4.1. Bộ cài 84,3 MB `dist/`. **Anh chốt bỏ Tauri, Electron là bản duy nhất** | 🟢 chờ cài đè máy công ty |
| 01/09 | ~~Tauri 0.5.0~~ | Viết lại lõi Tauri 2: grab 2 màn 141–152ms, exe 11,7 MB, bộ cài 3 MB. **Đã bỏ 10/09** (số giữ lại để tham khảo) | ❌ bỏ |
| 31/08 | 0.4.2 | Kéo-và-giữ hết giật: neo = điểm mousedown renderer gửi kèm. 📦 `2026-08-31-shotandsave-0.4.2`. Anh: *"kéo lại ổn định"* | ✅ anh chấm |
| 31/08 | 0.4.1 | Máy nhà 5120×2160 giật: ảnh đóng băng đi protocol `aioshot://` thay base64 5,7 MB qua IPC | 🟢 |
| 31/08 | **0.4.0** | Bản phát hành gom 10 vá kéo-chọn trong ngày. 📦 84 MB. Anh: *"ngon rồi em, hết nhảy rồi"* | ✅ anh chấm |
| 31/08 | 0.3.17 | Kéo vắt sang màn kia hết nhảy (local vẽ <50ms thì main nhường) | 🟢 |
| 31/08 | 0.3.16 | Toolbar/hint hiện lạc lúc kéo (CSS đè `[hidden]`); hâm nóng getSources | 🟢 |
| 31/08 | 0.3.15 | Bỏ nguồn vẽ khung trùng (mousemove local + IPC) | 🟢 |
| 31/08 | 0.3.14 | Bộ cài 99→84 MB (cắt locale + shader WebGPU + LZMA) | 🟢 |
| 31/08 | 0.3.12–0.3.13 | Hết double taskbar (workArea hụt 48px) + chốt chặn tự đo | 🟢 |
| 31/08 | 0.3.11 | Ảnh đóng băng hiện dần 160ms, hết "giựt một cái" | 🟢 |
| 31/08 | 0.3.10 | Vùng video YouTube hết đen lúc khoanh (dán ảnh WGC làm nền) | 🟢 |
| 31/08 | 0.3.9 | Kéo chọn hết giật lần đầu (màn chủ tự vẽ trong mousemove) | 🟢 |
| 31/08 | 0.3.8 | Đổi phím tắt là lưu ngay; run-log ghi boot; báo khi phím bị app khác giữ | 🟢 |
| 28/08 | 0.3.7 | Con lăn cuộn được khay | ✅ anh gật |
| 27/08 | 0.3.6 | Vẽ khung/mũi tên 7 màu lên ảnh đã ghim | 🟢 |
| 26/08 | 0.3.5 | Chụp được video đang phát (WGC); hết viền xấu quanh ảnh ghim | 🟢 |
| 26/08 | 0.3.4 | Chụp vắt 2 màn pixel vật lý; JPEG/PNG + chất lượng; khay dọc; **bộ cài .exe đầu tiên** 99 MB | 🟢 |
| 25/08 | 0.3.x | Chụp vùng + khay + ghim sticky + Ctrl+C + kéo-thả ra app khác + song ngữ | ✅ anh test OK |
| 24/08 | 0.1.0 | Khởi tạo app Electron | 🟢 |

## 13. AiO Video Download — `com.aiostudio.videodownload` · 8098

| Ngày | Bản | Cập nhật | Chấm |
|---|:-:|---|:-:|
| 10/09 | 0.1.0 | Commit mã nguồn 34 file | 🟡 |
| 08/09 | 0.1.0 | Dán link → tải (yt-dlp + QuickJS 2 MB + FFmpeg LGPL) → tự vào bin. Đo YouTube 1080p 255,9 MB/30s; TikTok chặn ngẫu nhiên → thử lại 3 lần | 🟡 anh đang bấm thử |

---

## Mốc chung cả bộ

| Ngày | Sự kiện |
|---|---|
| 29/07 | Chốt bán ra nước ngoài; tách thư mục; FFmpeg LGPL |
| 04/08 | Luật tài nguyên sàn 50% – trần 70% |
| 13/08 | Ngưng build tool, dồn sang website |
| 14/08 | Gói beta-01 cả bộ; tổ chức lại 5 ngăn |
| 16/08 | Bảng giá: Free = Asset Manager · Pro $17/tháng |
| 17/08 | Website đập đi xây mới |
| 31/08 | Làm việc 2 máy qua GitHub; 3 luật chọn công nghệ |
| 10/09 | Bỏ Tauri, Electron là bản Shot & Save duy nhất |
