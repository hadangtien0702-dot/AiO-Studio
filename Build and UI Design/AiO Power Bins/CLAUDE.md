# AiO Power Bins — đọc cái này trước

> Nạp tự động mỗi phiên trong thư mục dự án, và **đi theo mã nguồn**.
> Dự án **tách ra khỏi AiO Editing ngày 2026-07-29** để phát triển độc lập.

## Trước khi sửa bất kỳ dòng nào

1. **Đọc `RULES.md`** — luật ràng buộc, danh sách file khoá, bản đồ phụ thuộc.
2. **Đọc khối "Trang thai hien tai"** ở đầu `PROGRESS.md`.

---

## Sản phẩm này giải bài toán gì

Mở project Premiere mới là **trắng trơn**. Phải đi import lại logo, intro, lower
third, nhạc nền… dù tuần trước vừa import đúng mấy file đó.

Power Bin là **bin không nằm trong project nào** — nó ở tầng phần mềm. Ghim rồi
thì mở project nào cũng thấy, y nguyên nội dung.

*Ví dụ đời thường:* bin thường là **ngăn kéo trong một căn phòng** — ra khỏi
phòng là mất. Power Bin là **cái ba lô đeo trên lưng** — đi phòng nào cũng mang
theo.

**Khác Power Bin gốc của Adobe ở chỗ:** asset trong khay **giữ nguyên thumbnail,
sóng âm, proxy 360p đã render** → bấm là nghe/xem được ngay. Bản Adobe chỉ cho
cái tên file. Đây là điểm bán.

---

## ☠️ HƯỚNG SẢN PHẨM: PHÁT TRIỂN RIÊNG, BÁN CHUNG MỘT BỘ

Anh Tiến chốt 2026-07-29: *"anh muốn là phát triển từng tính năng cho hoàn chỉnh,
sau đó sẽ ghép lại một bộ thành cài đặt một lần — người dùng sẽ trả tiền cho toàn
bộ tính năng đó để có thể dùng"*.

Nghĩa là:
- **Bốn thư mục riêng** = để dễ sửa, dễ quản lý, dễ phát triển từng cái cho xong.
  **KHÔNG phải** để bán rời từng cái.
- **Đích đến: MỘT bộ cài, MỘT giá, mở ra có đủ 4 tính năng.**
- Đừng thiết kế gì theo hướng "khách chỉ mua panel này". Cứ giả định **khách có đủ**.

Chi tiết lộ trình: **`../PIPELINE.md`**.

Bốn thư mục, cùng một bộ sản phẩm:

| Sản phẩm | Extension ID | Cổng debug | Kho dữ liệu |
|---|---|---|---|
| Asset Manager | `com.aiostudio.assetmanager` | 8088 | `%APPDATA%\AiOStudio` |
| **Power Bins** (đây) | `com.aiostudio.powerbin` | **8090** | **`%APPDATA%\AiOPowerBins`** |
| Autocut | `com.aiostudio.autocut` | 8089 | cạnh file video |
| Transcript | `com.aiostudio.transcript` | 8091 | cạnh file video |

☠️ **Dính chặt với Asset Manager ~90% mã** (`store.ts`, `Grid.tsx`, `jobQueue`,
`mediaServer`, `ffmpeg`, thumbnail/sóng âm/proxy). Sửa mấy file đó thì **nhớ chép
sang Asset Manager**.

---

## ☠️ KHO DỮ LIỆU RIÊNG — điều quan trọng nhất của lần tách này

Anh Tiến chốt 29/07 khi được hỏi Power Bins tách ra thì lấy asset ở đâu:
*"Người dùng tự import file từ time-line vào mà em"*.

Nên panel này có **kho riêng** `%APPDATA%\AiOPowerBins\library.json`, **tuyệt đối
không đọc/ghi** `library.json` của Asset Manager.

**Đã kiểm chứng bằng phép thử thật 29/07** — tạo một brand trong panel này rồi
soi file nào bị ghi:

| File | Kết quả |
|---|---|
| `AiOPowerBins\library.json` | **được tạo**, chứa đúng brand vừa tạo |
| `AiOStudio\library.json` | **SHA-256 không đổi**, vẫn chỉ có brand cũ |

**Hệ quả phải biết:** mất **đường đưa asset vào khay thứ 3** ("Import từ lưới
Asset Manager"). Còn **hai đường** — xem dưới. Đó là cái giá đã chấp nhận để bán
riêng được.

---

## TỪNG TÍNH NĂNG — ba lớp

### 1. CÂY BRAND → KHAY

**Người xài thấy gì:** mở panel là vào thẳng Brand Kit. Cấu trúc **2 tầng**:
`Brand` (Kênh A, Coca-Cola…) → `Khay` (Logo, Intro, Nhạc nền…). Chọn brand nào
thì chỉ hiện khay của brand đó. Trên thẻ hiện **số asset trong từng khay**.
Khay không thuộc brand nào nằm ở mục **"Khay chung"** — không bao giờ bị ẩn mất.

**Builder phải biết:**
- ☠️ **BẪY MẤT DỮ LIỆU ĐÃ XẢY RA THẬT:** `persist()` chỉ ghi `folders` +
  `assets`. Nghĩa là mỗi lần bấm tìm kiếm, gắn nhãn, quét xong, hoặc hàng đợi
  cập nhật MỘT asset → `brands` + `powerBinFolders` bị **XOÁ SẠCH** khỏi file.
  Power Bin không sống nổi qua một lần đóng-mở panel.
  → Đã sửa: **mọi** đường ghi đĩa phải đi qua `persistAll()`. Thêm bất kỳ state
  nào cần sống lâu thì **nhớ nhét vào `persistAll()`**, đừng gọi `saveLibrary()`
  rời rạc.
- Asset thuộc khay qua trường `powerBinFolderId`; đếm một lượt bằng `useMemo`
  chứ đừng lọc lại cho mỗi dòng.
- Xoá brand thì khay con **không bị xoá** — chúng rơi về "Khay chung".
- Nút xoá dùng `window.confirm()`. **Đo qua cổng debug thì hộp thoại không hiện
  → `confirm` trả `false` → không xoá được.** Muốn đo tự động thì tạm thay
  `window.confirm`, và **trả lại nguyên bản ngay sau đó**.
- ☠️ Đây là chỗ **dữ liệu sống lâu hơn project**, nên đổi cấu trúc lưu trữ là
  việc phải cực kỳ thận trọng. `LIBRARY_VERSION` hiện là **5**.

### 2. HAI ĐƯỜNG ĐƯA ASSET VÀO KHAY

Phải **chọn khay trước**, chưa chọn thì nút khoá (đã kiểm chứng 29/07).

1. **Nút "Thêm từ timeline"** — chọn clip trên timeline Premiere rồi bấm, panel
   tự lấy đường dẫn file gốc của clip đó.
2. **Kéo thả file từ Windows Explorer** thả thẳng vào lưới.

**Builder phải biết:**
- ⚠️ Premiere **không có API để kéo clip từ TIMELINE vào PANEL** — giới hạn của
  Adobe, không sửa được. Nhưng **lấy asset từ timeline thì LÀM ĐƯỢC RỒI** bằng
  nút "Thêm từ timeline". Ghi rõ ra đây vì đã suýt đi làm lại một tính năng đã có.
- Kéo thả từ Explorer chỉ chạy **trong Premiere** — mở bằng trình duyệt thì
  `File.path` không tồn tại, panel phải báo rõ.
- File mới thì thêm vào rồi đẩy vào hàng đợi nền sinh thumbnail/sóng âm/proxy.

### 3. MỘT ĐƯỜNG ĐƯA RA

**Người xài thấy gì:** nút **"Bỏ khỏi khay"** — chỉ hiện khi asset đang chọn thực
sự nằm trong một khay. **File gốc trên đĩa không bị đụng tới.**

Anh Tiến chốt điều này: *"cho người ta thêm mà không cho người ta xoá hả em?"*
→ **Có đường vào thì phải có đường ra.** Nút xoá phải nói hậu quả bằng **số thật**.

### 4. THUMBNAIL / SÓNG ÂM / PROXY

Giống hệt Asset Manager. Sóng âm **WebP q80** (nhỏ hơn PNG ~70%).

☠️ **[2.0.0] Proxy dùng `libopenh264`, KHÔNG quay lại `libx264`** — `libx264` là
GPL, bán là phải mở mã nguồn. Đo thật 29/07 trên clip 81,7 giây: bản mới **nhanh
gấp đôi** (2,8s vs 5,9s), **nhẹ hơn 11%**, **nét hơn** (SSIM 0,9655 vs 0,9212).
Không chọn `h264_mf` vì Windows N/KN không có sẵn bộ mã hoá đó.

---

## MVP — bảng chốt, đo bằng số

| Tính năng | MVP = xong khi | Đo bằng | Nay |
|---|---|---|---|
| Cấu trúc Brand → Khay | Tạo brand, tạo khay, xoá được | menu trái hiện đúng | ✅ đo 29/07 |
| **Kho riêng, không đụng Asset Manager** | Ghi vào khay mà `AiOStudio` không đổi | SHA-256 trước/sau | ✅ **không đổi một byte** |
| Thêm từ timeline | Chọn clip → bấm → asset vào khay | đếm asset trong khay | ✅ 1 clip → khay hiện **1** |
| Sống qua đóng-mở panel | Tải lại panel, khay + asset còn nguyên | đếm lại sau reload | ✅ còn nguyên |
| **Proxy đổi bộ mã hoá mà không tệ đi** | Bỏ `libx264` (GPL) mà chất lượng không giảm | SSIM + dung lượng + thời gian, clip 81,7s | ✅ **tốt hơn cả ba mặt**: 5,9s→**2,8s** · 4,30→**3,84 MB** · SSIM 0,9212→**0,9655** |
| **☠️ MỞ PROJECT KHÁC VẪN THẤY NGUYÊN** | Mở project Premiere **mới toanh**, khay + asset còn đủ **và dùng được ngay** | xem bảng dưới | ✅ **ĐẠT 29/07 16:0x** |
| Sạch GPL để bán | FFmpeg không có `--enable-gpl` | đọc chuỗi configuration | ✅ LGPL từ 29/07 |

### ☠️ Phép đo "mở project khác" — đo thật 2026-07-29, đây là câu chuyện bán hàng

**Cách đo phải đúng, không được ăn gian:** không dùng lại `test 2.prproj` hay bản
auto-save của nó. Giả sử dữ liệu có bị lưu trong project đi nữa thì bản sao cũng
mang theo → nhìn vào vẫn thấy đủ, phép thử vô nghĩa. **Phải là project chưa từng
biết Power Bin là gì.**

| Đo | Kết quả |
|---|---|
| Project đang mở | `Untitled.prproj` — **mới tạo**, `Sequence 01` có **0 clip**, project chỉ có **1 item** |
| Menu trái | `Brand Kit · Kenh Test 1 · Logo 1` — **còn nguyên** |
| Lưới | **1 thẻ** `_Glitch After Noise 1.mp4` |
| Ảnh xem trước | `<img>` **tải được thật** (320×1800), không phải ảnh vỡ — *đây là chỗ hơn Power Bin gốc của Adobe, bản đó chỉ cho cái tên file* |
| File kho trên đĩa | SHA-256 **KHÔNG ĐỔI** (`555E347A6D5D3B42…`), giờ sửa vẫn 14:49:44 → panel chỉ **ĐỌC** |
| **Dùng được ngay** | Bấm Import → V1 từ **0 → 1 clip**, sequence dài ra **4,96 giây** |

→ Vòng khép kín: **ghim ở project này, mở project khác vẫn còn, và chèn thẳng vào
timeline được ngay.** Đó đúng là cái ba lô đeo trên lưng.

**☠️ CHƯA ĐẠT:**

| | Vì sao chưa đạt |
|---|---|
| Chữ ký thương mại · khoá bản quyền · macOS | Chưa có — xem `../PIPELINE.md` |
| Bộ cài nhẹ | `.zxp` 91,5 MB sau khi đổi FFmpeg LGPL |
| Bộ cài GHÉP 4 panel | Nay mỗi panel một bộ cài riêng; hướng bán là **một bộ cài, một giá** |

**Ngoài MVP — cố ý CHƯA làm:** chép phụ đề, gói Packs (đã gỡ 0.18.0), tag tự đặt.

---

## Hai quy trình build — ĐỪNG LẪN

```
Phát triển:  cd client && npm run build   rồi   scripts\sign-install.ps1
Phát hành:   scripts\package-release.ps1
             (tự đóng gói LICENSE-FFmpeg.txt + THIRD-PARTY-NOTICE.txt)
```

Sửa `CSXS/manifest.xml` thì **bắt buộc tắt hẳn Premiere rồi mở lại**.
Chứng chỉ lấy từ `AiO Asset Manager\certs\aiostudio-dev.p12` (dùng chung, cùng
một người phát hành) — dự án này cũng có bản sao trong `certs/` của chính nó.

## ☠️ LGPL — bán ra thì bắt buộc

FFmpeg đang dùng: **LGPL** `N-125829-gfe953596e9-20260728`. Gọi qua tiến trình
riêng (`execFile`), không link tĩnh. `LICENSE-FFmpeg.txt` +
`THIRD-PARTY-NOTICE.txt` phải nằm trong bộ cài — `package-release.ps1` tự làm và
sẽ cảnh báo nếu thiếu.

## Ghi nhật ký — bắt buộc, sau MỖI lần sửa mã nguồn

Mục mới ở **trên cùng** `PROGRESS.md`, giờ lấy bằng lệnh, **không dấu, không emoji**.

## Tự kiểm chứng trước khi báo xong

Build sạch **không tính**. Mở panel, đo qua **cổng debug 8090**, hoặc đọc thẳng
`%APPDATA%\AiOPowerBins\library.json`. Báo cáo kèm **số trước/sau**.

☠️ **Mỗi lần sửa chỗ ghi đĩa, phải đo lại rằng `AiOStudio\library.json` KHÔNG
ĐỔI.** Đó là ranh giới giữa hai sản phẩm — vượt qua là hỏng dữ liệu của khách.
