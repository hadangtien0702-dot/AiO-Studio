# AiO Studio — PANEL TỔNG ("bệ phóng") — đọc cái này trước

> Thư mục tên `AiO WELCOME` vì panel này **thay** Welcome Hub 1.5.0 (03/08). Tên thư mục
> chính thức (giữ `AiO WELCOME` hay đổi) **chưa chốt — hỏi anh Tiến** trước khi `git mv`
> (luật 4h mục 6). `AiO WELCOME Page/` bên cạnh là bản cũ: file thiết kế + manifest
> `com.aio.welcome` (không cài ở đâu) — đừng nhầm hai thư mục.

## 1. Người xài — bấm gì, được gì

Mở **Window → Extensions → AiO Studio** trong Premiere. Panel liệt kê **12 tool AiO**,
mỗi tool một màu riêng. Bấm thẻ nào → panel của tool đó mở ra (dock riêng, như mở từ menu).

*Ví dụ đời thường:* 11 panel AiO là 11 món đồ nghề; panel tổng là **cái hộp đồ nghề có
ngăn dán nhãn màu** — mở hộp là thấy hết, lấy đúng món trong một cú bấm.

| Panel đang… | Hiện ra |
|---|---|
| rộng ≥ 720px | lưới **thẻ nằm ngang** · banner cam (khi cao ≥ 520px) · khối 3D + chữ "Create Faster Together" (khi rộng ≥ 1100px) |
| 340–719px | lưới **thẻ đứng** (380px = 2 cột), ô tìm thu thành icon |
| hẹp < 340px | **thanh icon dọc** (12 ô màu, chia 4 nhóm) |
| thấp < 260px, rộng hơn cao | **dải icon ngang** (con lăn chuột dọc cuộn được dải) |

Thẻ tự báo: tool **chưa cài** → nhãn vàng "Chưa cài", bấm thì nhắc cách cài · Shot & Save
(app ngoài Premiere) → mở file `.exe`/`.app` · Organize → "Sắp có". Tool đã cài: **không
nhãn gì** (luật "chỉ báo khi khác thường"). Tìm được **không dấu** ("phu de" → Transcripts).
VI/EN dùng chung file `%APPDATA%\AiOStudio\ngonngu.json` với cả bộ — đổi ở panel khác thì
panel tổng đổi theo trong ≤ 2 giây.

**2.1.0 (25/09, anh yêu cầu):** nhìn **giống web Shot & Save** (aio-shotsave.vercel.app): cùng
màu nền/viền/chữ, thẻ, nút cam, nhãn viên thuốc; nút **Nền sáng / Nền tối** thật (nhớ riêng
panel này, mặc định tối). **Mở panel là có animation "vào"** như trang web: thanh trên → nhãn →
tiêu đề → chip → từng thẻ hiện nối nhau (icon nảy nhẹ), ~1,9 s là xong; đổi dạng lưới↔thanh
icon cũng chạy lại; lọc/tìm thì thẻ hiện nhẹ 220 ms; rê chuột thì icon nảy như thẻ web.

## 2. Builder — chạy thế nào, chỗ nào dễ hỏng

- **Viết tay, không build**: `dist/index.html` + `hub.css` + `hub.js`. `dist/` PHẢI nằm trong
  git — `.gitignore` có dòng mở riêng (22/09 sửa: dòng cũ trỏ `AiO WELCOME Page/dist/` — thư
  mục không tồn tại — nên Welcome Hub 1.5.0 **chưa từng lên git**; bản đó nay ở `_archive/`).
- ID `com.aiostudio.hub` / panel `com.aiostudio.hub.panel` · cổng debug **8101** · Menu "AiO Studio".
- **Danh sách tool đã cài = hỏi Premiere**: `__adobe_cep__.getExtensions()`. **Phiên bản** =
  đọc `ExtensionBundleVersion` trong `<basePath>/CSXS/manifest.xml` (getExtensions không trả
  version). ☠️ Podcast sẽ hiện **0.1.0** vì manifest chưa bump (việc chờ ở CLAUDE.md gốc).
- **ID mở tool** gõ trong `TOOLS` của `hub.js` = Extension Id thật, grep 11 manifest 22/09.
  Thêm tool mới → thêm một dòng ở đó (id, tên, icon, nhóm, màu, việc VI/EN).
- Shot & Save: `%LOCALAPPDATA%\Programs\aio-shot-and-save\AiO Shot & Save.exe` (Mac:
  `/Applications/AiO Shot & Save.app`), chạy thẳng bằng `spawn` — KHÔNG qua explorer +
  `windowsHide` (Video Download 21/09: 9 cửa sổ ẩn, 1,67 GB).
- ☠️ Đổi dạng theo kích thước dùng `setTimeout`, **không** `requestAnimationFrame` — tab bị
  che thì rAF đứng yên, panel kẹt ở dạng cũ (đo 22/09).
- ☠️ Đo khổ hẹp: Chrome headless ép cửa sổ ≥ ~512px, khung trình duyệt < 768px giả lập
  điện thoại (ra 980×2321). Thước đúng: **iframe đúng kích thước** trong một trang lớn.
- Thiết kế: bản vẽ trang "Bản 3" https://claude.ai/artifact/GmdDjRe5oRJuNBr3uAbubN. Panel này
  CỐ Ý đè 2 luật "Studio Console" (banner/gradient, accent nhiều) — anh chốt 22/09, chỉ panel này.
  **25/09: token màu/chữ/bo góc/bóng lấy ĐÚNG từ HTML live của web Shot & Save** (bảng ở
  `PROGRESS.md` 2.1.0); web đổi token thì chép lại vào `:root` + `:root[data-theme="light"]`
  của `hub.css`. Giữ "mỗi tool một màu" cho ô icon.
- **Animation "vào"**: chỉ khi `#hub.khoi-dong` — `st.moDau = true` trước `ve()` (khởi động,
  đổi dạng), `ve()` gắn lớp rồi gỡ bằng `setTimeout` 2,2 s. Vẽ lại vì focus/đổi ngôn ngữ/đổi nền
  KHÔNG chạy lại. ☠️ Keyframe chỉ khai `from`, đừng khai `to{opacity:1}`: thẻ "Sắp có" (.65) và
  ô thanh mờ (.5) phải kết thúc ở độ mờ của chính nó, không thì nháy lúc gỡ lớp (đo 25/09).
- `focus` chỉ vẽ lại khi danh sách cài / phiên bản / app đổi (so JSON trước–sau).
- CEF của CEP 12 ≈ Chromium 99: KHÔNG dùng `color-mix()`, `:has()`, container query trong CSS.

## 3. MVP — "xong" nghĩa là gì

| Mốc | Đo bằng | Trạng thái |
|---|---|---|
| 12 thẻ, dạng đúng theo 11 kích thước | iframe 1280×720 … 72×900 · 1280×64: 0px tràn, 0 tên bị cắt | ✅ 22/09 · ✅ đo lại 25/09 với 2.1.0 (11/11, 0 tràn, 0 cắt) |
| Bấm thẻ mở đúng panel | cổng debug của tool sống sau khi bấm | ✅ **Premiere thật 25/09: 10/10 panel CEP mở 458–486 ms**, Shot & Save gọi được app (đang chạy sẵn) |
| Trạng thái cài + phiên bản là số THẬT | so với `CEP/extensions` + manifest | ✅ 25/09: 11/11 khớp manifest, 0 thẻ "Chưa cài" |
| Animation "vào" chạy trên Premiere thật | ghi opacity mỗi 80 ms qua cổng 8101 | ✅ 25/09: ô đầu 0→1 trong 514 ms, ô cuối 514→1.021 ms, gỡ lớp 2,2 s, không nháy |
| Nền sáng/tối | bấm nút → `data-theme` + màu nền đổi, nhớ sau reload | ✅ 25/09 (panel thật + khung 1280) |
| Anh dùng thật mở tool hằng ngày | lời anh | ⬜ |

**CHƯA có thật** (nút có, bấm báo "sắp có"): chuông thông báo · tài khoản (sẽ gắn khoá
Free/Pro). Hình khối 3D = CSS (chưa có ảnh). Chữ tay dùng font hệ thống (Segoe Script trên
Windows) — muốn đúng Caveat phải đóng gói file font (OFL), chưa tải. Shot & Save khi app
CHƯA chạy (đường `spawn`) chưa đo.
