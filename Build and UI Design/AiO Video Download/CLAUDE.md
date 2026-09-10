# AiO Video Download — đọc cái này trước

> App thứ 13 của bộ AiO Studio. Anh Tiến giao 2026-09-08:
> *"anh cần build một app mới có tên AiO Video Download — ở đây người ta chỉ
> cần gắn một đường link bất kì và down video về"*.
>
> Nạp tự động mỗi phiên trong thư mục này, và **đi theo mã nguồn**.
> Trước khi sửa: đọc mục "Trạng thái" đầu `PROGRESS.md`.

---

## Sản phẩm này làm gì — ba lớp

### Người xài
Dán link (YouTube, Facebook, và ~1.800 trang khác) → panel tự đọc tiêu đề,
thời lượng, ảnh bìa → chọn chất lượng → bấm **Tải video** → file nằm trong
thư mục đã chọn **và tự vào bin "AiO Video Download"** của project đang mở.

*Ví dụ đời thường:* khách gửi link YouTube "lấy đoạn này làm b-roll". Trước
đây editor mở web tải lậu, đợi quảng cáo, tải về Downloads, kéo vào Premiere.
Giờ Ctrl+V vào panel, 13 giây sau clip đã nằm trong bin, đúng H.264 Premiere
đọc được.

### Builder — chạy thế nào
| Mảnh | Ở đâu | Ghi chú |
|---|---|---|
| Engine tải | `bin/win64/yt-dlp.exe` (Unlicense) | gọi bằng `child_process.spawn` từ panel (Node của CEP) |
| Runtime JS cho YouTube | `bin/win64/qjs.exe` (QuickJS-ng, MIT, **2,1 MB**) | ☠️ thiếu là YouTube mất định dạng mà chỉ WARNING. Đo 08/09: qjs ra đúng 53 định dạng như Node |
| Ghép hình+tiếng / MP3 | `bin/win64/ffmpeg.exe` (LGPL, bản của Autocut) | copy stream, không encode — không đụng luật tài nguyên 50–70% |
| Lõi gọi engine | `client/src/services/ytdlp.ts` | đọc thông tin (`-J`), tải (`--progress-template` + `--print after_move`), dịch lỗi, `-U` |
| Cài đặt người dùng | `%APPDATA%\AiOStudio\videodownload.json` | thư mục, chất lượng, nhập vào project, cookie |
| Việc cần Premiere | `host/videodownload.jsx` | gợi ý thư mục cạnh project · hộp chọn thư mục · `importFiles` vào bin |
| Giao diện | `client/src/App.tsx` | React, 1 file `dist/index.html` (viteSingleFile) |

`bin/` **không lên git** (135 MB). Máy mới: tải `yt-dlp.exe` (GitHub releases
mới nhất), `qjs-windows-x86_64.exe` → đổi tên `qjs.exe`, copy `ffmpeg.exe` từ
`AiO Autocut/bin/win64/`.

Extension ID `com.aiostudio.videodownload` · cổng debug **8098** · Premiere
`Window > Extensions > AiO Studio - Video Download`.

### MVP — "xong" nghĩa là gì
| Mốc | Đo bằng | Trạng thái |
|---|---|---|
| Tải YouTube 1080p H.264 về đúng thư mục | file tồn tại, `vcodec` bắt đầu `avc1` | ✅ đo ngoài panel 08/09 (720p, 82 MB / 13 s) |
| Tiến độ hiện %, tốc độ, còn lại; Dừng giết cả ffmpeg con | dòng `AIOTD\|` đọc được; `taskkill /T` | ✅ engine · ⏳ đo trên panel thật |
| File tự vào bin "AiO Video Download" | đếm `bin.children` trước/sau tăng 1 | ⏳ |
| Facebook công khai · YouTube Shorts | `-J` trả JSON | ✅ 08/09 |
| Vimeo / video riêng tư | cookie trình duyệt | ⏳ chưa đo với cookie thật |
| TikTok | — | ❌ 403 (08/09), chưa giải |
| Anh Tiến dùng trên bài thật | tai/mắt anh | ⏳ **chưa** |

---

## Quyết định đã chốt

| Ngày | Quyết định | Vì sao |
|---|---|---|
| 08/09 | Là **panel CEP trong Premiere**, không phải app rời | Giá trị nằm ở "tải xong là ở trong bin"; cả bộ bán chung $17/tháng. Lõi `ytdlp.ts` không dính CEP, sau tách ra Tauri được nếu anh muốn bản rời |
| 08/09 | Engine **yt-dlp** | Public domain, 1.800 trang, tự cập nhật `-U`. Không tự viết trình tải — YouTube đổi cơ chế vài tuần một lần |
| 08/09 | Runtime JS = **QuickJS** (2 MB), không phải deno (100 MB) / Node | Máy khách không có Node; "nhẹ để nhanh" |
| 08/09 | Mặc định **1080p**, không phải "Tốt nhất" | YouTube ≥1440p là VP9/AV1, Premiere không đọc VP9. Chuỗi định dạng ưu tiên `avc1` trước; codec lạ thì báo vàng |
| 08/09 | Một link một lần, không hàng đợi | v0.1 tối giản; hàng đợi làm khi anh cần thật |

## Sổ lỗi tái diễn (mẫu theo luật 31/08)

| Lỗi | Gốc ĐÃ ĐO | Chốt chặn |
|---|---|---|
| `--print` mà không tải gì | yt-dlp: `--print` ngầm bật `--simulate` | luôn kèm `--no-simulate` (ytdlp.ts) |
| YouTube thiếu định dạng, không lỗi | không có JS runtime → chỉ WARNING | `kiemEngine()` đòi `qjs.exe`; panel báo đỏ nếu thiếu |
| `proc.kill()` để lại ffmpeg chạy ngầm | yt-dlp sinh ffmpeg con | `taskkill /pid /T /F` |
| `importFiles` trả true mà bin trống | đường dẫn không tồn tại (bẫy Autocut) | `File.exists` trước + đếm trước/sau |
| Tiêu đề có dấu/emoji → "không thấy file" dù đã tải | `--print` in đường dẫn theo codepage máy, mất dấu; env Python không đỡ | `--encoding utf-8` trong `thamSoChung()` + `StringDecoder` |
| "Mở thư mục" bấm mà không thấy gì | Explorer mở SAU LƯNG Premiere (đếm được 8 cửa sổ); Windows không cho tiến trình con đổi foreground | `moThuMuc()` tìm cửa sổ qua Shell.Application + Alt ảo + `SetForegroundWindow`; đo: foreground = File Explorer |
| TikTok 403 | anti-bot ngẫu nhiên ~1/6 request (đo 6 lần), impersonate không đỡ | tự thử lại 3 lần cho lỗi bị-chặn/mất-mạng |

## Chưa làm / chờ anh
- TikTok 403 — có thể cần `curl_cffi` impersonation (không có trong exe chuẩn).
- Playlist / nhiều link một lần.
- Cắt đoạn (`--download-sections`) — tải đúng phút cần thay vì cả video.
- Bản rời ngoài Premiere (Tauri) nếu anh muốn bán riêng.
