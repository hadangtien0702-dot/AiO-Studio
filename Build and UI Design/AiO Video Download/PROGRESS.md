# AiO Video Download — nhật ký

> Mục mới trên cùng. Giờ lấy bằng lệnh `date`, không suy từ mục trước.

## Trạng thái hiện tại (08/09/2026 16:00)

- **0.1.0** — dựng từ trắng trong một buổi, đã cài máy công ty, anh Tiến
  đang bấm thử trực tiếp. Chưa qua vòng "dùng trên bài thật" (project thật
  của anh — em test trên project copy trong Temp).
- Chưa đóng gói bộ cài phát hành (`package-release.ps1` đã viết, chưa chạy).
- Chưa commit.

---

## [0.1.0] 2026-09-08 — dựng panel, đo tải thật, vá 5 lỗi anh Tiến bắt tại chỗ

**Bối cảnh.** Anh giao: *"gắn một đường link bất kì và down video về"*, kèm
dặn *"tạo folder mới theo đúng guidelines"*. Chọn làm **panel CEP** (đúng
khuôn 11 panel: CSXS · host · client Vite/React · scripts · bin) vì giá trị
nằm ở "tải xong là nằm trong bin Premiere".

**Đo trước khi dựng (engine, ngoài panel):**

| Thử | Kết quả |
|---|---|
| yt-dlp 2026.08.19, YouTube 10 phút, `-J` | 53 định dạng, nhưng WARNING thiếu JS runtime |
| + Node làm runtime | 53 định dạng (như nhau) |
| + **QuickJS 2,1 MB** làm runtime | **53 định dạng** → chọn QuickJS thay deno (~100 MB) |
| Tải 720p + ghép ffmpeg | 82 MB / **13 giây** |
| YouTube Shorts · Facebook công khai | OK |
| Vimeo | đòi đăng nhập → làm ô "Cookie từ trình duyệt" |
| TikTok | 403 (xem bên dưới) |

**Đo trên panel thật (Premiere Beta, project copy `AiO-VD-test_1`):**

| Bước | Số đo |
|---|---|
| Dán link → có tiêu đề/ảnh bìa/thời lượng | ~4 giây |
| Tải 1080p (mặc định) | 255,9 MB / ~30 giây, 11 MB/s, `h264 1920×1080 60fps` (ffprobe) |
| Tự vào bin "AiO Video Download" | bin đếm **0 → 1**, `getMediaPath()` đúng file |
| Bấm **Dừng** lúc 12% | tiến trình yt-dlp/ffmpeg còn lại: **0**; file `.part` còn lại: **0** |
| Tool đồng hành | tên project trên thanh trên đọc lại mỗi 2 s |

**Năm lỗi lộ ra khi anh Tiến bấm thử (sửa ngay trong buổi):**

1. **TikTok 403** (anh dán link thật). Tái lập bằng dòng lệnh: cùng lệnh,
   6 lần → **5 qua / 1 bị 403**; `--impersonate chrome` → 4/6 (không đỡ).
   Kết luận: anti-bot xác suất, không phải sai tham số. Sửa: **tự thử lại 3
   lần** khi lỗi thuộc loại bị-chặn/mất-mạng, nút hiện *"Trang chặn, đang thử
   lại (2/3)…"*. Đo lại qua panel 3 lượt: 3/3 tải được, lượt 3 phải thử lại
   lần 2 mới qua — đúng cơ chế.
2. **"Tải xong rồi không thấy video ở đâu"**. Gốc đo được: nút "Mở thư mục"
   CÓ mở — đếm được **8 cửa sổ Explorer** đúng thư mục — nhưng nằm sau lưng
   Premiere. Windows chỉ cho tiến trình đang có tiêu điểm đưa cửa sổ lên
   trước. Sửa: sau khi mở, PowerShell con tìm đúng cửa sổ (Shell.Application
   `LocationURL`), nhấn Alt ảo rồi `SetForegroundWindow`. Đo: cửa sổ tiêu
   điểm sau khi bấm = `Video Download - File Explorer` (trước đó là Chrome).
   Kèm: dòng "Lưu vào" bấm được để mở thẳng thư mục.
   ☠️ Thử `/select,"path"` thành một tham số (verbatim) → Explorer mở nhầm
   **Desktop**. Giữ dạng hai tham số.
3. Reload panel là mất danh sách "Đã tải" → lưu 30 mục ra
   `%APPDATA%\AiOStudio\videodownload-lichsu.json`. Đo: reload còn 1/1 mục.
4. Nút xong quay về xám ngay → giữ đèn xanh "Đã tải xong" tới khi dán link mới.
5. ETA in "NA", thiếu tổng MB → lọc NA, dùng `total_bytes,total_bytes_estimate`.
6. **Tiêu đề tiếng Việt + emoji → "KHONG_THAY_FILE"** (anh dán link Shorts
   *"Những bức ảnh được chụp…😮"*). File trên đĩa tên ĐÚNG; nhưng đường dẫn
   yt-dlp in qua `--print` ra `Nhng bc nh c chp v�o` (mất dấu) nên panel tìm
   sai tên. `PYTHONIOENCODING`/`PYTHONUTF8` **không** đỡ; **`--encoding utf-8`**
   của chính yt-dlp thì ra đúng từng ký tự. Kèm `StringDecoder` chống cắt
   ký tự giữa hai gói stdout. Đo lại qua panel: bin **2 → 3 clip**, tên clip
   thứ 3 đúng dấu + emoji.

7. Anh: *"khi dán link vào để đọc thì cần có một hiệu ứng loading"* → vòng
   xoay + vạch cam chạy dưới ô link lúc `dang-doc` (đo: 2 animation chạy,
   `doc-link-xoay` / `doc-link-vach`). Kèm nút **×** bỏ mục khỏi danh sách
   "Đã tải" (không xoá file) — có đường vào thì có đường ra.

8. Anh: *"video download về có thumbnail giống như lúc đang đọc link"* →
   tách khung giây 1 từ CHÍNH file đã tải bằng ffmpeg (192px, ~10 KB) vào
   `%APPDATA%\AiOStudio\vd-thumbs\<id>.jpg`; mục cũ tự tách nền lúc mở panel.
   Đo: 5/5 mục có ảnh (`naturalWidth` 192), 4 file jpg 2,8–16 KB. Không lấy
   URL ảnh của trang gốc để xem được lúc mất mạng.

**Bẫy kỹ thuật ghi vào CLAUDE.md:** `--print` ngầm bật `--simulate` ·
thiếu qjs.exe chỉ WARNING · `proc.kill()` bỏ sót ffmpeg con · dọn `.part`
theo `[id]` chứ không theo mẫu rộng (bài 5am-ter).

**Thước đo dùng trong buổi:** `scripts/do-tren-panel.ps1 -Port 8098` (DOM +
evalScript) · CDP `Page.captureScreenshot` chụp đúng panel · `PrintWindow`
chụp Premiere (CopyFromScreen ra đen — thước sai, không phải Premiere đen).

**Chưa làm:** Vimeo với cookie thật · playlist / nhiều link · cắt đoạn ·
máy sạch · bản rời ngoài Premiere.
