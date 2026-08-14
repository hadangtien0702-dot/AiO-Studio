# AiO Asset Manager — đọc cái này trước

> Nạp tự động mỗi phiên trong thư mục dự án, và **đi theo mã nguồn** (copy sang
> ổ khác, gửi cho người khác — vẫn còn).
> Lập 2026-07-27 · viết lại 2026-07-29 sau khi tách thành sản phẩm riêng.

## Trước khi sửa bất kỳ dòng nào

1. **Đọc `RULES.md`** — luật ràng buộc, **danh sách file khoá**, **bản đồ phụ
   thuộc** (sửa chỗ này thì hỏng chỗ nào).
2. **Đọc khối "Trang thai hien tai"** ở đầu `PROGRESS.md`.
3. Trước khi tối ưu hiệu năng: **đọc `OPTIMIZE.md` TẦNG F** — ở đó có bốn thứ
   *tưởng là nút thắt mà không phải*, và hai "tối ưu" từng làm hoá ra chính là
   nguyên nhân giật.

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

Trước 29/07/2026 file này ghi *"panel làm cho anh Tiến tự dùng, đừng đề xuất
chứng chỉ code-signing thương mại, khoá bản quyền, macOS"*. **Hết hiệu lực.**
Anh Tiến chốt làm bộ công cụ bán ra nước ngoài, cả ba thứ đó nay là **bắt buộc**.

Bốn thư mục, cùng một bộ sản phẩm:

| Sản phẩm | Extension ID | Cổng debug | Kho dữ liệu |
|---|---|---|---|
| **Asset Manager** (đây) | `com.aiostudio.assetmanager` | 8088 | `%APPDATA%\AiOStudio` |
| Power Bins | `com.aiostudio.powerbin` | 8090 | `%APPDATA%\AiOPowerBins` |
| Autocut | `com.aiostudio.autocut` | 8089 | cạnh file video |
| Transcript | `com.aiostudio.transcript` | 8091 | cạnh file video |

**Bốn dự án độc lập hoàn toàn** — anh Tiến chốt 29/07 khi được hỏi "sửa một lỗi
chung thì sửa mấy nơi": *"làm sao để sau này anh bán như thằng auto cut là được"*.
Ưu tiên mỗi thư mục tự build, tự ký, tự ra bộ cài; chấp nhận lỗi chung sửa 2 nơi.

☠️ **Dính chặt với Power Bins ~90% mã** (`store.ts`, `Grid.tsx`, `jobQueue`,
`mediaServer`, `ffmpeg`, thumbnail/sóng âm/proxy). Sửa mấy file đó thì **nhớ chép
sang Power Bins**. Riêng **kho dữ liệu thì RIÊNG** — đã kiểm chứng bằng số.

---

## Sản phẩm này làm gì

CEP Extension Panel cho **Adobe Premiere Pro** (Windows). Quét thư viện asset
trên ổ cứng → bấm xem/nghe → chèn vào timeline.

*Ví dụ đời thường:* ổ cứng đầy asset mua về giống như **một nhà kho không có
bảng chỉ dẫn** — biết đồ nằm đâu đó nhưng phải bới. Panel này là **người thủ kho
đứng sẵn trong Premiere**: gõ tên là lôi ra, bấm là nghe thử, ưng là đưa thẳng
vào timeline, không phải rời khỏi phần mềm.

**Thư viện thật của anh Tiến:** `E:\D\Plugins\All in one` — bộ Envato, cấu trúc
thư mục lộn xộn, có pack nhét SFX vào thư mục tên "Overlay Video".
Đo 29/07: **28.846 asset** (Video 1.562 · Mogrt 4.156 · Âm thanh 12.948 ·
Hình ảnh 9.871 · Preset 309). Mọi quyết định hiệu năng phải đứng vững ở quy mô đó.

---

## ☠️ NÚT THẮT LÀ ĐẦU ĐỌC Ổ CỨNG, KHÔNG PHẢI CPU

Đo 28/07/2026:

| Ổ | Thiết bị | Loại | Chứa |
|---|---|---|---|
| `E:` | HGST HUH721212ALE604 12TB SATA | **HDD** | 28.892 asset gốc |
| `C:` | Kingston SNV2S500G NVMe | SSD | cache preview |

Máy anh Tiến rất mạnh (Ryzen 9 5950X 16 nhân/32 luồng, 64 GB RAM, RTX 4060 Ti) —
nhưng nhiều tiến trình FFmpeg cùng đọc file nằm rải rác làm **đầu đọc nhảy loạn**
(~10ms mỗi lần nhảy).

- **Tăng số luồng song song sẽ CHẬM HƠN.**
- Cách tăng tốc đúng: **bỏ các chỗ chờ**, và **sắp job theo đường dẫn** cho đầu
  đọc đi một chiều.
- **GPU (NVDEC) không giúp** — thumbnail chỉ lấy một khung hình, dựng CUDA
  context còn lâu hơn giải mã bằng CPU.

⚠️ **Từ 28/07 có nhân viên của anh dùng.** Máy họ yếu hơn, và khi panel kẹt thì
không ai ngồi sửa tại chỗ. Mặc định phải an toàn; thứ ăn tài nguyên chỉ chạy khi
người dùng **chủ động bấm**, và luôn phải có **đường dừng**.
Số liệu họ báo về là **số thật** — đừng lấy máy anh Tiến làm chuẩn. Ca thật: anh
báo cache >1 GB, đo trên máy anh chỉ 218,9 MB, vì đó là máy nhân viên.

---

## TỪNG TÍNH NĂNG — ba lớp

### 1. QUÉT THƯ VIỆN

**Người xài thấy gì:** bấm *Thêm thư mục* → chọn thư mục trên ổ → panel quét đệ
quy, phân loại thành video / ảnh / nhạc / SFX / mogrt / preset. Menu trái hiện
cây thư mục và số lượng từng loại.

**Builder phải biết:**
- `scanner.ts` lọc **đuôi file trước khi `stat`**, dùng `statSync`, nhường luồng
  mỗi 500 file. Bỏ mấy thứ này là panel treo ở quy mô 28.900.
- Ghép cặp MOGRT với file preview rời — hỗ trợ `Ten.mogrt`→`Ten.mp4` và
  `Ten.mogrt`→`Ten.mogrt.webp`, kèm hậu tố `_preview` `-preview` ` preview`
  `_thumb` `-thumb`.
- `mogrtThumb.ts` tự bung `thumb.png` bên trong gói `.mogrt` (nó là file ZIP)
  bằng `fs` + `zlib` của Node — **không thêm thư viện ngoài**.
- Rác macOS (`._*`, `__MACOSX`) bị chặn ngay ở bộ quét từ 1.3.2.

**MVP:** ✅ quét được thư viện thật, không sập. Đo: `library.json` có **28.846
asset**, file 15,37 MB, `version: 5`.

### 2. XEM / NGHE THỬ

**Người xài thấy gì:** **bấm** vào thẻ để xem hoặc nghe — một thẻ phát tại một
thời điểm. Nhạc có **chỉnh cao độ ±nửa cung**.

**Builder phải biết:**
- ☠️ **KHÔNG dùng hover-preview.** Đưa chuột từ thẻ A xuống nút Import sẽ lướt
  qua vài thẻ khác, và Import chèn nhầm thẻ cuối cùng bị lướt qua. **Lỗi thật đã
  xảy ra.** Bấm là hành động có chủ ý — đúng thẻ đó mới là mục tiêu Import.
- Cố ý đặt `preservesPitch = false` → **đổi cao độ thì tốc độ đổi theo**, đúng
  kiểu varispeed tua băng, KHÔNG phải pitch-shift giữ nguyên tempo.
- Mọi tài nguyên đi qua `mediaUrl()` của `mediaServer.ts` (máy chủ HTTP nội bộ
  `127.0.0.1`, token ngẫu nhiên, hỗ trợ Range). **Dùng `file://` trực tiếp là
  mọi preview đen thui** — Chromium chặn trang `file://` đọc file khác trên đĩa.

**MVP:** ✅

### 3. SÓNG ÂM + THUMBNAIL + PROXY (hàng đợi nền)

**Người xài thấy gì:** nút **Render preview** trên thanh công cụ — vừa là nút bấm
vừa là **đèn báo**. Anh Tiến chốt 28/07: *"chưa render hết thì màu đỏ, render
xong là xanh"*. Ba trạng thái nhìn là biết:
`Đang render 587/1999` (đỏ) · `Render preview (1.856)` (đỏ) · `Preview đã đủ` (xanh).
Bấm lại lúc đang chạy là **dừng** — có đường vào thì phải có đường ra.

**Builder phải biết:**
- Sóng âm xuất **WebP q80**, không phải PNG. Đo thật: sóng âm chiếm **96%** bộ
  nhớ đệm (15.711 file PNG = 175,7 MB). WebP nhỏ hơn ~70%.
  Anh Tiến 28/07: *"không cần nặng để đẹp — anh cần nhẹ để nhanh đó em"*.
- Proxy 360p chỉ dựng khi thật sự cần: file > 200 MB, hoặc ProRes / 4K trở lên.
- ☠️ **[2.0.0] Proxy dùng `libopenh264`, KHÔNG được quay lại `libx264`.**
  `libx264` là GPL → bán là phải mở toàn bộ mã nguồn. Và đo thật 29/07 trên clip
  81,7 giây thì bản mới còn tốt hơn mọi mặt:

  | bộ mã hoá | thời gian | dung lượng | SSIM |
  |---|---|---|---|
  | `libx264` crf28 ultrafast (GPL) | 5,9s | 4,30 MB | 0,9212 |
  | **`libopenh264` 300k (BSD)** | **2,8s** | **3,84 MB** | **0,9655** |

  Không chọn `h264_mf` (SSIM nhỉnh hơn 0,001): nó mượn bộ mã hoá của Windows, mà
  **Windows N/KN** (bán ở EU, Hàn Quốc) không có sẵn → khách mua về proxy chết câm.
- ☠️ **Ảnh vỡ đầy lưới thì soi DỮ LIỆU trước.** Bài học 0.16.0, mất 3 bản mới tìm
  ra: gốc là `library.json` giữ đường dẫn tới file đã xoá, và **chính đường dẫn
  treo đó làm hàng đợi tưởng "xong rồi"** nên không bao giờ sinh lại ảnh. Sửa
  phần hiển thị 2 lần vẫn không hết; dọn dữ liệu mới hết.

**MVP:** ✅ WebP q80, nhỏ hơn PNG ~70%.

### 4. CHÈN VÀO TIMELINE

**Người xài thấy gì:** hai đường — **nút Import**, hoặc **kéo thẻ thả thẳng vào
timeline** Premiere.

**Builder phải biết:**
- ☠️ **"Track rỗng hoàn toàn" là SAI bài toán.** Timeline dùng thật thì không
  track nào rỗng → code rơi về track 0 → **đè lên clip của người dùng**. Phải hỏi
  *"track có trống trong khoảng [playhead, playhead + thời lượng) không"*.
  Kiểm chứng 29/07: V1 đang có clip → Import đặt vào **V2**, không đè.
- ☠️ **Kéo thả CHẠY ĐƯỢC — đừng tắt lại.** Chìa khoá là hai thứ trong
  `onDragStart`: đặt **đúng một** khoá `com.adobe.cep.dnd.file.0` (thêm
  `text/plain` là hỏng) và **`effectAllowed = 'all'`** (để `'copy'` thì Chromium
  hiện con trỏ dấu cấm và chặn cú thả).
- **Không có bấm đúp để chèn.**
- ExtendScript không có JSON — `host/*.jsx` trả về chuỗi `OK:` / `ERR:` phân
  cách, **không được dùng `JSON.stringify`**.

**MVP:** ✅ Import 10 lần trúng 10.

### 5. CÀI ĐẶT / DỌN CACHE

**Người xài thấy gì:** chất lượng proxy, **đổi chỗ để cache** (mặc định ổ C, mà ổ
C máy dựng phim thường nhỏ và hay đầy), và nút xoá cache **kèm số thật** (bao
nhiêu file, bao nhiêu MB) chứ không chỉ một chữ "Clear".

**Builder phải biết:**
- Tách **"dọn rác vô hại"** khỏi **"xoá sạch phải làm lại"**. Nút xoá sạch phải
  bấm **hai lần**.
- `cacheAudit.ts` chỉ được gỡ đường dẫn **nằm trong thư mục cache** — không bao
  giờ đụng tới file gốc của người dùng.
- `macJunk.ts` là **chỗ DUY NHẤT** trong panel được đụng tới file gốc (ngoại lệ
  chủ dự án chốt 28/07, chỉ cho rác macOS). Luôn chuyển vào **Thùng rác Windows**,
  tuyệt đối không `unlink`.

**MVP:** ✅

---

## MVP — bảng chốt, đo bằng số

| Tính năng | MVP = xong khi | Đo bằng | Nay |
|---|---|---|---|
| Quét thư viện | Quét được thư viện THẬT, không sập | đủ 28.900 asset | ✅ **28.846** |
| Xem/nghe + Import | Bấm thẻ nào Import đúng thẻ đó | Import 10 lần trúng 10 | ✅ V1 có clip → chèn V2, không đè |
| Kéo thả ra timeline | Kéo thẻ thả vào timeline ăn ngay | thử trên Premiere Beta 26.5 | ✅ |
| Sóng âm | Nghe được trước khi Import, không phình cache | WebP q80, nhỏ hơn PNG ~70% | ✅ |
| Cài đặt / dọn cache | Người dùng tự dọn, **biết trước mất gì** | nút xoá nói số file + MB | ✅ |
| **Sạch GPL để bán được** | FFmpeg không có `--enable-gpl` | đọc chuỗi configuration | ✅ **LGPL** từ 29/07 |
| **Proxy đổi bộ mã hoá mà không tệ đi** | Bỏ `libx264` (GPL) mà chất lượng không giảm | đo SSIM + dung lượng + thời gian trên clip 81,7s | ✅ **tốt hơn cả ba mặt**: 5,9s→**2,8s** · 4,30→**3,84 MB** · SSIM 0,9212→**0,9655** |

**Chưa đạt — cần trước khi bán ra ngoài:**

| | Vì sao chưa đạt |
|---|---|
| Chữ ký số thương mại | Đang ký tự tạo, bộ cài phải bật `PlayerDebugMode` trong registry. Bảo khách lạ sửa registry là mất khách. Cần cert code-signing (~$200–400/năm). |
| Khoá bản quyền | Chưa có. Bán một bản là cả thế giới copy. |
| macOS | Chưa có. Editor nước ngoài phần lớn dùng Mac. Cần bundle FFmpeg macOS + notarize Apple ($99/năm). |
| Bộ cài nhẹ | `.zxp` **91,5 MB** (trước khi đổi LGPL là ~48,9 MB). Muốn nhẹ phải tự build FFmpeg tối giản. |

**Ngoài MVP — cố ý CHƯA làm:** gói Packs (đã gỡ ở 0.18.0; trường `packs` trong
`library.json` vẫn giữ nguyên vẹn). Tag tự đặt. Chọn nhiều asset cùng lúc.

---

## Hai quy trình build — ĐỪNG LẪN

```
Phát triển:  cd client && npm run build   rồi   scripts\sign-install.ps1
             (có auto-reload, panel tự tải lại sau ~1,5 giây)

Phát hành:   scripts\package-release.ps1
             (tự build VITE_RELEASE=1 -> TẮT auto-reload, không kèm .debug,
              tự đóng gói LICENSE-FFmpeg.txt + THIRD-PARTY-NOTICE.txt,
              xuất SETUP.exe -- MỘT file bấm đúp là tự cài)
```

Sửa `CSXS/manifest.xml` thì **bắt buộc tắt hẳn Premiere rồi mở lại** — kiểm chứng
29/07: cài lúc 13:53 mà Premiere mở lúc 13:52 thì nó **không thấy panel mới**.
Tăng phiên bản phải sửa **cả** `ExtensionBundleVersion` **và** `<Extension Version>`.

**Gửi bản cài cho người khác:**
- Máy người nhận **không cần cài thêm gì** — không Python, không Node.js (CEP có
  sẵn), không FFmpeg (đã nằm trong gói), không cần quyền Admin.
- **Gmail và Zalo CHẶN `.exe`** — chặn cả trong zip, chặn luôn `.bat`/`.ps1`.
  Gửi bằng Google Drive / OneDrive / USB.
- Người nhận phải **chuột phải → Properties → tick "Unblock"** trước khi chạy.
- Bộ cài `.exe` dựng bằng `scripts/make-setup-exe.ps1` dùng **`csc.exe`**.
  **Đừng thử lại IExpress** — trả mã lỗi 1 và bung hộp thoại đè lên màn hình.

## ☠️ LGPL — bán ra thì bắt buộc

FFmpeg đang dùng: **LGPL** `N-125829-gfe953596e9-20260728`
(`--enable-gpl` 0 lần, `--disable-libx264 --disable-libx265`).
Gọi qua **tiến trình riêng** (`execFile`), không link tĩnh — đúng cách LGPL yêu cầu.

`LICENSE-FFmpeg.txt` + `THIRD-PARTY-NOTICE.txt` nằm ở gốc dự án và **được
`package-release.ps1` tự đóng gói**. Thiếu hai file đó trong bộ cài là **vi phạm
giấy phép**. Script sẽ cảnh báo nếu không thấy.

## Ghi nhật ký — bắt buộc, sau MỖI lần sửa mã nguồn

Thêm mục mới ở **trên cùng** `PROGRESS.md`:
- Header `## [MAJOR.MINOR.PATCH-dev.N] - YYYY-MM-DD HH:MM (UTC+7)`
- Giờ lấy bằng lệnh `date "+%Y-%m-%d %H:%M %z"` — **không bịa**
- Các phần: Boi canh / Nguyen nhan that / Thay doi / File anh huong / Kiem chung
- **KHÔNG emoji, KHÔNG dấu tiếng Việt** trong `PROGRESS.md`

## Quyết định đã chốt — đừng tự làm ngược lại

- **Bấm** để xem/nghe. Đã bỏ hẳn hover-preview.
- Không bấm đúp để chèn. Chèn bằng **kéo thả** hoặc **nút Import**.
- Kéo thả **chạy được**, đừng tắt lại.
- Gói Packs: đã gỡ hẳn.
- `OPTIMIZE.md` mục D2 và D4: chốt **KHÔNG LÀM**.
- Proxy dùng `libopenh264`, không quay lại `libx264` (giấy phép + chất lượng).

## Ba cái bẫy đắt nhất

0. **Đừng "tối ưu" lưới theo TỐC ĐỘ CUỘN — chính nó gây nhấp nháy.** Đo trên
   panel thật 28/07: cuộn nhanh 21 thẻ → dừng tay 45 thẻ = **dỡ rồi dựng lại 24
   thẻ cùng lúc**, hơn nửa lưới. Panel dock chỉ cao ~411px = vừa 2,76 hàng, nên
   phần nạp trước chiếm phần lớn lưới. Giữ `OVERSCAN` **cố định** → 33 thẻ suốt
   lúc cuộn, **0 thẻ dựng lại**.
1. **Đừng GỠ một tính năng khi bản sửa cuối cùng còn đang chờ thử.** 27/07:
   11:38 sửa `effectAllowed`, ghi `[CHO thu lai]`; **11:45 tắt hẳn kéo thả** và
   ghi tài liệu là "Adobe từ chối". Bản sửa đó chưa hề chạy trên máy ai. 28/07
   bật lại đúng bản đó: **chạy ngay**. Mất một ngày và một tính năng.
   → Anh Tiến nói *"hôm qua làm được mà"* thì **tin trước, đo sau**.
2. **Cài đặt: chép đè từng file, đừng `Remove-Item -Recurse`.** FFmpeg đang chạy
   sẽ khoá file, lệnh xoá chết giữa chừng nhưng đã kịp xoá `dist/index.html` →
   panel trắng.

## Tự kiểm chứng trước khi báo xong

Build sạch **không tính** là đã kiểm. Mở panel lên, đo bằng JavaScript trên DOM
qua **cổng debug 8088** (`scripts\do-tren-panel.ps1`), hoặc đọc thẳng
`library.json` bằng Node. Báo cáo kèm **số trước/sau**, không kèm cảm nhận.
