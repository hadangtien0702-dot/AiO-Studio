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
thời lượng, ảnh bìa → chọn chất lượng → bấm nút cam ở đáy panel
(**"Tải 1080p vào bin"**) → file nằm trong thư mục **`AiO Studio Download`
cạnh file project** và **tự vào bin "AiO Video Download"** của project đang mở.

Danh sách "Đã tải" nói THẬT về thế giới bên ngoài: nhãn xanh **"Trong project"**
chỉ hiện khi project ĐANG MỞ có clip đó (xoá clip / đổi project → nhãn tự đổi
thành nút vàng "Nhập vào project" sau ~4 s); file bị xoá/dời trên đĩa → nhãn đỏ
"File không còn trên đĩa" + lệnh "Dọn N mục mất file".

*Ví dụ đời thường:* khách gửi link YouTube "lấy đoạn này làm b-roll". Trước
đây editor mở web tải lậu, đợi quảng cáo, tải về Downloads, kéo vào Premiere.
Giờ Ctrl+V vào panel (chép cả câu "lấy đoạn này nhé https://…" cũng được — panel
tự rút link), vài giây sau clip đã nằm trong bin, đúng H.264 Premiere đọc được.

### Builder — chạy thế nào
| Mảnh | Ở đâu | Ghi chú |
|---|---|---|
| Engine tải | `bin/win64/yt-dlp.exe` (Unlicense) | gọi bằng `child_process.spawn` từ panel (Node của CEP) |
| Runtime JS cho YouTube | `bin/win64/qjs.exe` (QuickJS-ng, MIT, **2,1 MB**) | ☠️ thiếu là YouTube mất định dạng mà chỉ WARNING. Đo 08/09: qjs ra đúng 53 định dạng như Node |
| Ghép hình+tiếng / MP3 | `bin/win64/ffmpeg.exe` (LGPL, bản của Autocut) | copy stream, không encode — không đụng luật tài nguyên 50–70% |
| Lõi gọi engine | `client/src/services/ytdlp.ts` | đọc thông tin (`--flat-playlist -J`), tải (tiến độ cộng dồn theo `format_id`), dịch lỗi, mở thư mục |
| Đồng hành | `client/src/services/dongHanh.ts` | `useHost` (project theo ĐƯỜNG DẪN, bỏ lượt khi Premiere kẹt) · `useTinhTrang` (file còn trên đĩa + có trong project đang mở) |
| Engine cập nhật | `%APPDATA%\AiOStudio\videodownload\engine\` | `-U` chạy trên BẢN SAO ở đây, không ghi đè exe trong thư mục extension đã ký |
| Cài đặt / lịch sử | `%APPDATA%\AiOStudio\videodownload.json` · `videodownload-lichsu.json` | lịch sử KHÔNG lưu trạng thái "đã vào project" (bài 21/09) |
| Việc cần Premiere | `host/videodownload.jsx` | `vd_trangThai` · `vd_dauHieu` · `vd_nhap(path, projectKyVong)` · `vd_phienBan()` ở CUỐI file |
| Giao diện | `client/src/App.tsx` + `ui/Ic.tsx` + `styles.css` | Hướng A anh chốt 21/09; 1 file `dist/index.html` (viteSingleFile) |
| Kiểm song ngữ | `scripts/kiem-chu.mjs` | mọi `t()/tp()/dich()` phải có trong `chu.ts` — chạy trước khi build |

`bin/` **không lên git** (135 MB). Máy mới: tải `yt-dlp.exe` (GitHub releases
mới nhất), `qjs-windows-x86_64.exe` → đổi tên `qjs.exe`, copy `ffmpeg.exe` từ
`AiO Autocut/bin/win64/`.

Extension ID `com.aiostudio.videodownload` · cổng debug **8098** · Premiere
`Window > Extensions > AiO Studio - Video Download`.

**Cách test không đụng project của anh (dùng 21/09):** chép một `.prproj` vào
scratchpad, `app.openDocument(p, true, true, true, true)` (mở ~17 s, project
anh vẫn mở bên cạnh), test, rồi `closeDocument(0, 0)` trên ĐÚNG project đó
(kiểm `.path` trước). Panel tự đổi theo project đang mở — không cần gì thêm.

### MVP — "xong" nghĩa là gì
| Mốc | Đo bằng | Trạng thái |
|---|---|---|
| Tải YouTube H.264 về đúng thư mục | file tồn tại, `vcodec` bắt đầu `avc1` | ✅ 21/09 trên panel thật: 3,6 s đọc → 6,9 s xong |
| Tiến độ chỉ đi lên; pha ghép hiện "Đang xử lý…" | log trạng thái nút đáy | ✅ 21/09: 21% → 76% → Đang xử lý → Đã tải xong |
| Tự vào bin + nhãn "Trong project" SỐNG | `findItemsMatchingMediaPath` | ✅ 21/09: nhãn sau 7,9 s; xoá clip → đổi sau 3,9 s; nhập lại 0,66 s, đúng 1 item |
| Đổi project → panel theo | đóng project thử | ✅ 21/09: 0,2 s về Test3_1, thư mục + nhãn đổi theo |
| "Mở thư mục" lên TRƯỚC Premiere, tô sẵn file | cú bấm chuột THẬT + GetForegroundWindow | ✅ 21/09: `DA_TRUOC`, file được chọn |
| Dừng giữa chừng không để rác | chụp danh sách trước/sau | ✅ 21/09 (ngoài panel, đúng lệnh): xoá 1 `.part`, giữ file có sẵn cùng [id] |
| Link kênh/playlist bị chặn | `--flat-playlist -J` | ✅ engine 21/09 (194 mục, 3,5 s) · ⏳ chưa bấm trên panel |
| Facebook công khai · YouTube Shorts | `-J` trả JSON | ✅ 08/09 |
| Vimeo / video riêng tư | cookie trình duyệt | ⏳ chưa đo với cookie thật |
| TikTok | — | ❌ 403 ngẫu nhiên (08/09), tự thử lại 3 lần |
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
| **21/09** | **Giao diện = HƯỚNG A** ("một cột + thanh đáy", khuôn Short Viral) | Anh xem canvas 3 hướng A/B/C (https://claude.ai/artifact/6BmtRecyvqDUczVpVovQEg) và chọn *"A1 sẵn sàng và A1 đang tải"* |
| **21/09** | **Thư mục lưu mặc định = cạnh file project Premiere, thư mục con `AiO Studio Download`**; bấm "Đổi" thì dùng đúng chỗ người dùng chọn (có nút về mặc định) | Anh: *"mặc định … tạo cùng Project đang lưu File Adobe PR hiện tại (sẽ tạo folder AiO Studio Download) … còn chọn đổi sẽ tùy theo người dùng chọn"*. Chưa lưu project → `Downloads\AiO Studio Download` |
| 21/09 | Codec lạ (VP9/AV1) **không tự nhập**, chờ người dùng bấm | importFiles có thể bung hộp "File Import Failure" — hộp modal chặn MỌI panel (đề xuất của Claude, chưa hỏi anh) |

## Sổ lỗi tái diễn (mẫu theo luật 31/08)

| Lỗi | Gốc ĐÃ ĐO | Chốt chặn |
|---|---|---|
| `--print` mà không tải gì | yt-dlp: `--print` ngầm bật `--simulate` (và `--quiet`) | luôn kèm `--no-simulate` (ytdlp.ts) |
| YouTube thiếu định dạng, không lỗi | không có JS runtime → chỉ WARNING | `kiemEngine()` chạy lại trước MỖI lần đọc/tải, thiếu thì chặn |
| `proc.kill()` để lại ffmpeg chạy ngầm | yt-dlp sinh ffmpeg con | `taskkill /pid /T /F`, CHỜ taskkill xong mới dọn file |
| `importFiles` trả true mà bin trống | đường dẫn không tồn tại (bẫy Autocut) | `File.exists` trước + TÌM LẠI item sau khi nhập |
| Tiêu đề có dấu/emoji → "không thấy file" dù đã tải | `--print` in đường dẫn theo codepage máy, mất dấu | `--encoding utf-8` trong `thamSoChung()` + `StringDecoder` |
| ☠️ **"Mở thư mục" bấm mà không thấy gì** (08/09 và lại 21/09) | **`windowsHide: true` trên explorer.exe → Explorer TẠO CỬA SỔ ẨN** (đo 21/09: 9 cửa sổ vô hình, 9 tiến trình, 1.666 MB). Đoạn PowerShell "kéo lên trước" 0.1.0 chưa từng chạy (JSON.stringify nhân đôi `\` → 0/9 khớp) — tức "đo 08/09: foreground = File Explorer" là số đo KHÔNG chứng minh cơ chế | KHÔNG BAO GIỜ `windowsHide` cho explorer.exe; kiểm file/thư mục tồn tại trước; PowerShell nhận đường dẫn qua biến môi trường, chỉ xét cửa sổ ĐANG HIỆN, in kết quả (`window.__vdMoCuoi`). Đo bằng CÚ BẤM CHUỘT THẬT |
| ☠️ **"Đã vào project" là ảo** (21/09) | cờ `daNhap:'roi'` LƯU CỨNG ra lịch sử, không gắn project, không hỏi lại Premiere, khoá luôn nút | không lưu trạng thái này; hỏi `vd_trangThai` theo project đang mở; nhãn là NHÃN, không phải nút xám |
| ☠️ **Nút "Đổi" làm treo mọi panel AiO** (21/09) | `Folder.selectDialog` trong ExtendScript = hộp modal chặn MỌI evalScript; bấm "Đổi" 2 lần lúc hộp khuất → hộp thứ 2 xếp hàng bật lên sau | chọn thư mục bằng `window.cep.fs.showOpenDialogEx` (tiến trình panel); vòng thăm dò bỏ lượt khi còn lệnh treo; panel báo "Premiere đang bận" |
| Tiến độ "nhảy về 0" / đứng ở 100% | bv+ba = 2 luồng lần lượt; dòng hậu xử lý ra **stderr** khi có `--print` | cộng dồn theo `info.format_id` + kích thước từ dòng `video:`; đọc stderr theo dòng |
| Tải lại mức khác → nhãn sai, trả file cũ | cùng tên đích → "already downloaded" nhưng in thông số mức MỚI | tên file kèm `%(height)sp` |
| Dán link kênh → tải cả trăm video | `--no-playlist` không chặn link playlist thuần | `--flat-playlist -J` + mã `la-playlist` + `-I 1` |
| TikTok 403 | anti-bot ngẫu nhiên ~1/6 request (đo 6 lần), impersonate không đỡ | tự thử lại 3 lần cho lỗi bị-chặn/mất-mạng |

## Chưa làm / chờ anh
- TikTok 403 — có thể cần `curl_cffi` impersonation (không có trong exe chuẩn).
- Playlist / nhiều link một lần (hiện chặn và báo rõ).
- Cắt đoạn (`--download-sections`) — tải đúng phút cần thay vì cả video.
- Bản rời ngoài Premiere (Tauri) nếu anh muốn bán riêng.
- Cookie Chrome/Edge trên Windows (app-bound từ Chrome 127) — chưa đo; đã có câu báo lỗi riêng.
- Thư mục `AiO Design System/AiO Video Download/` chưa có (luật 4h) — anh chốt 18/09 "chỉ Short Viral lúc này".
