# AiO Studio — DANH SÁCH TỐI ƯU HỆ THỐNG

Chỉ về **hiệu năng**: preview nhanh, xem nhanh, không giật khi đang dựng.
Mọi mục dưới đây là quan sát từ mã nguồn thật (đã đọc từng file), không phải lời
khuyên chung. Mỗi mục ghi: **vấn đề · vì sao · sửa thế nào · ăn bao nhiêu · công sức**.

| | |
|---|---|
| Lập ngày | 2026-07-26 |
| Trạng thái | ĐỢT 1 XONG (0.10.0): E0, A1–A5, B1–B2, C1–C5 · ĐỢT 2 XONG (0.17.0): B3 (một nửa, cố ý), C6, D1, D3 · ĐỢT 3 XONG (0.18.0): gom cập nhật state, trần ghi đĩa 15s, lọc nhịp tiến độ · **D4 và D2: CHỐT KHÔNG LÀM** |
| Nguyên tắc | Preview NHANH-NHẸ-MƯỢT là ưu tiên số 1 của v1 |

> **Đọc trước:** `RULES.md` Phần C (file khoá). Nhiều mục dưới đây chạm file khoá
> cứng (`mediaServer.ts`, `jobQueue.ts`, `ffmpeg.ts`) — phải khai báo vào
> `PROGRESS.md` TRƯỚC khi sửa.

---

## TẦNG A — ăn ngay, làm trước

### ✅ A1. Mỗi thẻ video đang mount một `<video>` thật, dù chưa rê chuột 🔴

**Vấn đề.** `AssetCard.tsx` render `<video>` cho MỌI asset loại video nằm trong
tầm nhìn. Lưới ảo hoá với `OVERSCAN = 4` hàng → ở lưới vừa 2 cột có thể là
**25–35 thẻ**, tức 25–35 phần tử `<video>` cùng tồn tại, mỗi cái là một decoder
của Chromium.

**Vì sao đắt.** Chromium giới hạn số decoder phần cứng đồng thời (thường 8–16);
vượt ngưỡng là nó rơi về giải mã mềm hoặc treo pipeline. Cộng thêm mỗi `<video>`
giữ một socket tới media server.

**Sửa.** Mặc định render `<img src={thumbPath}>`. Chỉ khi `hover === true` mới
mount `<video>` (giữ nguyên độ trễ 120ms đang có). Ảnh tĩnh đã có sẵn — thumbnail
do FFmpeg sinh rồi.

**Ăn:** rất lớn — cuộn lưới trở thành cuộn ảnh. **Công sức:** nhỏ (một nhánh
render trong `AssetCard`).

### ✅ A2. `preload="auto"` trên mọi thẻ video 🔴

**Vấn đề.** `AssetCard.tsx` đặt `preload="auto"` vô điều kiện → mỗi `<video>` tự
tải sẵn dữ liệu ngay khi vào DOM, chưa ai rê chuột.

**Vì sao đắt.** 30 thẻ × vài MB đầu file = hàng chục MB đọc đĩa + băng thông
localhost cho thứ người dùng có thể không bao giờ xem.

**Sửa.** `preload="none"` (hoặc `"metadata"`), khi hover thì gọi `load()` rồi
`play()`. Đi kèm A1 là gần như miễn phí.

**Ăn:** lớn. **Công sức:** rất nhỏ.

### ✅ A3. Media server nói "đừng cache" với cả file không bao giờ đổi 🟠

**Vấn đề.** `mediaServer.ts` trả `Cache-Control: no-cache` cho **mọi** response,
kể cả `thumbs/<id>.jpg` và `thumbs/wf_<id>.png`.

**Vì sao đắt.** Tên file đã chứa hash id → nội dung bất biến. Nhưng cuộn xuống rồi
cuộn lên là tải lại toàn bộ ảnh từ đầu.

**Sửa.** Nếu đường dẫn nằm trong `AiOStudio/thumbs` hoặc `AiOStudio/proxies` →
`Cache-Control: public, max-age=31536000, immutable`. File gốc của người dùng thì
GIỮ `no-cache` (họ có thể thay file trên đĩa).

**Ăn:** trung bình–lớn khi cuộn qua lại. **Công sức:** rất nhỏ.
**Lưu ý:** `mediaServer.ts` là file KHOÁ CỨNG — phải khai báo trước.

### ✅ A4. Đọc `.mogrt` là đọc ĐỒNG BỘ CẢ FILE, ngay trên luồng giao diện 🔴

**Vấn đề.** `AssetCard` gọi `getMogrtThumb()` trong `useEffect` mỗi lần một thẻ
mogrt vào tầm nhìn. Hàm đó chạy `fs.readFileSync(mogrtPath)` — đọc **toàn bộ** gói
.mogrt (thường 5–60 MB) vào RAM, đồng bộ, rồi mới đi tìm `thumb.png` bên trong.

**Vì sao đắt nhất với anh.** Thư viện chính của dự án là **mogrt Envato**. Cuộn
nhanh qua 100 thẻ mogrt chưa cache = 100 lần đọc file đồng bộ → panel đứng hình
từng nhịp. Đây là nguồn giật số 1 cho đúng loại thư viện anh dùng.

**Sửa (3 bước, độc lập nhau):**
1. Đọc ZIP **không cần đọc cả file**: đọc 66 KB cuối để lấy EOCD → đọc đúng vùng
   entry cần. Giảm I/O hàng chục lần.
2. Chuyển sang **bất đồng bộ** (`fs.promises.read`) để không chặn giao diện.
3. Đưa việc bung thumb vào **`jobQueue`** (hiện hàng đợi chỉ xử lý video + audio,
   bỏ qua mogrt hoàn toàn) để làm sẵn từ trước thay vì làm lúc người dùng cuộn tới.

**Ăn:** rất lớn với thư viện mogrt. **Công sức:** trung bình.

### ✅ A5. Hàng đợi nền xử lý theo thứ tự mảng, không theo thứ tự người dùng đang xem 🔴

**Vấn đề.** `jobQueue.ts` chạy `index++` tuần tự trên `pendingAssets`. Nếu anh vừa
quét 15.000 file rồi cuộn xuống cuối, những thẻ anh đang nhìn nằm ở cuối hàng đợi —
anh phải đợi 14.900 file khác xử lý xong mới có thumbnail.

**Sửa.** Hàng đợi **ưu tiên theo viewport**: Grid báo cho queue danh sách id đang
hiển thị (nó đã tính sẵn `slice`), queue đẩy các id đó lên đầu. Thêm mức ưu tiên
cao nhất cho asset **vừa được hover**.

**Ăn:** rất lớn về CẢM GIÁC nhanh (dù tổng thời gian không đổi). **Công sức:**
trung bình. `jobQueue.ts` là file KHOÁ CỨNG — khai báo trước.

---

## TẦNG B — không tranh CPU với Premiere

### ✅ B1. Cờ hạ ưu tiên FFmpeg KHÔNG có tác dụng — Node không hỗ trợ nó 🔴

**Vấn đề.** `ffmpeg.ts` truyền `{ creationflags: 0x00000040 }` kèm comment
*"IDLE_PRIORITY_CLASS giúp FFmpeg tuyệt đối không tranh chấp CPU với Premiere"*.
**Node `child_process` không có option `creationflags`** — nó bị bỏ qua âm thầm.
FFmpeg đang chạy ở **ưu tiên NORMAL**, ngang hàng Premiere.

**Vì sao quan trọng.** Đây đúng là thứ làm Premiere giật khi panel đang sinh
thumbnail/proxy — mà cả comment lẫn tài liệu đều tin là đã xử lý xong.

**Sửa (chọn 1):**
- Đơn giản & chắc: thêm `-threads 1` (hoặc 2) vào mọi lệnh FFmpeg nền. Không cần
  quyền gì, giới hạn trực tiếp lượng CPU.
- Đúng bài hơn: hạ ưu tiên tiến trình thật sau khi spawn (đọc `child.pid` rồi gọi
  PowerShell `$p.PriorityClass = 'Idle'`), hoặc chạy qua `cmd /c start /LOW /B /WAIT`.

**Ăn:** lớn với cảm giác "Premiere có mượt không". **Công sức:** nhỏ (phương án
`-threads`). `ffmpeg.ts` KHOÁ CỨNG — khai báo trước.

### ✅ B2. Proxy sinh ra KHÔNG CÓ TIẾNG 🟠

**Vấn đề.** `proxy.ts` dùng `-an` (bỏ audio). `AssetCard` lại ưu tiên
`proxyPath ?? previewPath` khi hover. Nghĩa là **video nặng hover không nghe được
gì** — trong khi cả cụm âm lượng/pitch vừa làm là để nghe thử.

**Sửa.** Thêm `-c:a aac -b:a 96k` (tăng dung lượng proxy không đáng kể), hoặc giữ
`-an` nhưng phát tiếng từ file gốc bằng một `<audio>` song song.

**Ăn:** không phải tốc độ, mà là **đúng chức năng**. **Công sức:** rất nhỏ.
**Lưu ý:** proxy đã cache sẽ vẫn không có tiếng đến khi xoá cache.

### ✅ B3. Hàng đợi không biết Premiere đang làm gì 🟡 — làm MỘT NỬA (0.17.0)

**Vấn đề.** `jobQueue` chạy bất kể Premiere đang render/export/phát timeline.

**Đã làm.** `services/hostBusy.ts`: hỏi `ppro_playerPosition()` hai lần cách nhau
1.5s; vị trí đổi = timeline đang chạy → hàng đợi chờ, phát xong 2.5s mới tiếp.

**CỐ Ý KHÔNG làm** nửa "tạm dừng khi panel không phải panel đang hiện". Nghe hợp
lý nhưng phản tác dụng với chính dự án này: thư viện 7.000+ asset cần render,
chủ dự án hay bật render rồi chuyển sang việc khác — dừng theo tầm nhìn sẽ thành
*"để cả buổi mà không render được gì"*. Premiere giật hay không nằm ở lúc PHÁT,
và việc đó đã bắt được bằng playhead.

---

## TẦNG C — thư viện lớn (15.000+ asset)

### ✅ C1. Quét thư mục gọi `statSync` cho từng file 🟠

**Vấn đề.** `scanner.ts > walk()` gọi `fs.statSync(full)` mỗi file chỉ để lấy
`size`. 15.000 file = 15.000 syscall đồng bộ, chỉ nhường luồng mỗi 500 file.

**Sửa.** Bỏ `stat` khỏi bước quét (đặt `fileSize: 0`), lấy size trong hàng đợi nền
cùng lúc với probe. Sắp xếp theo dung lượng chỉ cần dữ liệu đã có.

**Ăn:** rút ngắn thời gian quét rõ rệt. **Công sức:** nhỏ, nhưng `scanner.ts`
KHOÁ MỀM (chỉ được THÊM nhánh mới) → cần khai báo.

### ✅ C2. Mỗi asset một tiến trình `ffprobe` riêng 🟠

**Vấn đề.** `probe.ts` gọi `-show_format -show_streams` (đọc TOÀN BỘ stream) cho
mỗi file. Trên Windows, chỉ riêng việc tạo tiến trình đã ~30–60ms; 15.000 file ≈
**8–15 phút thuần chi phí spawn**, chưa tính thời gian phân tích.

**Sửa.**
- Giới hạn phân tích: `-probesize 2M -analyzeduration 0`.
- Chỉ hỏi thứ cần: `-select_streams v:0` cho video, `a:0` cho audio, và bỏ
  `-show_format` nếu chỉ cần duration từ stream.
- **Không probe ảnh** (`type === 'image'` không cần duration/fps) — hiện `jobQueue`
  đã bỏ qua image, tốt rồi, giữ nguyên.

**Ăn:** lớn với thư viện lớn. **Công sức:** nhỏ.

### ✅ C3. Ghi `library.json` chặn giao diện, lại còn ghi thừa 🟠

**Vấn đề.** `library.ts > saveLibrary()` dùng `fs.writeFileSync` +
`JSON.stringify(data, null, 2)`. File thực tế ~8 MB. Ghi **đồng bộ** = đóng băng
panel; `null, 2` làm file phình ~30% và tốn thời gian tạo chuỗi.

**Sửa.** Bỏ `null, 2`; ghi bất đồng bộ; ghi **nguyên tử** (ghi ra `.tmp` rồi
`rename`) để mất điện giữa lúc ghi không làm hỏng thư viện.

**Ăn:** hết micro-đứng mỗi 600ms trong lúc hàng đợi chạy. **Công sức:** nhỏ.
`library.ts` KHOÁ MỀM — khai báo trước.

### ✅ C4. Tìm kiếm lọc + sắp xếp lại toàn bộ thư viện mỗi lần gõ một chữ 🟠

**Vấn đề.** `Grid.tsx > visible` memo phụ thuộc `search`, nên mỗi ký tự gõ vào là:
15.000 lần `a.name.toLowerCase()` (cấp phát chuỗi mới) + `.includes()` + một lần
`sort()` trên kết quả.

**Sửa.**
- Precompute `nameLower` một lần khi quét (thêm field), đừng `toLowerCase()` lại
  15.000 lần mỗi keystroke.
- Debounce ô tìm kiếm ~150ms.
- Tách memo lọc và memo sắp xếp để đổi từ khoá không bắt sắp xếp lại từ đầu.

**Ăn:** gõ tìm kiếm mượt hẳn. **Công sức:** nhỏ.

### ✅ C5. Menu trái quét toàn bộ thư viện 5 lần mỗi lần render 🟠

**Vấn đề.** `Sidebar.tsx > countOf()` gọi `assets.filter(...)` và nó được gọi một
lần cho **mỗi** dòng loại asset → 5 lượt quét 15.000 phần tử, **không memo hoá**,
chạy lại mỗi lần bất kỳ state nào đổi (kể cả gõ tìm kiếm).

**Sửa.** Một `useMemo` đếm tất cả loại trong MỘT lượt (giống `countByBin` em đã
làm trong `PowerBinHub`).

**Ăn:** trung bình, và rất rẻ để sửa. **Công sức:** rất nhỏ.

### ❌ C6. Giảm overscan khi cuộn nhanh — **ĐÃ LÀM RỒI GỠ BỎ** (1.2.1, 28/07/2026)

**Đề xuất gốc:** cuộn nhanh thì nạp trước thành nạp thừa → giảm overscan theo vận
tốc cuộn. Bản 0.17.0 làm thật (4 hàng ↔ 1 hàng), bản 1.2.0-dev.1 còn nâng thành
6 ↔ 2 cho "mượt hơn".

**Kết quả: SAI HƯỚNG — chính nó là nguồn nhấp nháy.** Đo trên panel thật, mô phỏng
đúng cú cuộn của chủ dự án rồi đếm thẻ đang dựng:

| | đang cuộn nhanh | vừa dừng tay | thẻ dựng lại |
|---|---:|---:|---:|
| overscan co giãn 6↔2 | 21 | 45 | **24** |
| overscan cố định 4 | 33 | 33 | **0** |

Panel dock chỉ cao ~411px = vừa **2,76 hàng**, nên phần nạp trước chiếm phần lớn
lưới; mỗi lần nó co vào rồi bung ra là **hơn nửa lưới bị dỡ và dựng lại**.

**Chốt: giữ `OVERSCAN` CỐ ĐỊNH = 4. Đừng đề xuất lại kiểu "tối ưu theo tốc độ
thao tác".** Tiết kiệm vài chục thẻ render không đáng đổi lấy lưới chớp tắt.

---

## TẦNG D — nâng chất lượng cảm nhận

### ✅ D1. Sinh proxy theo HÀNH VI, không chỉ theo ngưỡng 🟡 — xong 0.17.0

`isHeavyVideo` chỉ nhận >200MB / ≥4K / ProRes. File 1080p 150MB vẫn phát từ gốc.
**Sửa:** đếm số lần hover mỗi asset; hover ≥2–3 lần thì sinh proxy dù chưa "nặng".
Thư viện dùng thật sẽ tự tối ưu theo thói quen của anh.

### D2. Thumbnail động thay vì phát video 🟡 — **KHÔNG LÀM** (A1 đã giải quyết phần lớn; công sức lớn, lợi ích còn lại nhỏ)

Sinh sẵn **sprite/webp nhiều frame** (vd 12 frame) lúc nền. Hover là chạy sprite
bằng CSS/canvas — thấy chuyển động mà **không cần decoder video nào**. Đây là cách
các thư viện stock lớn làm. Nặng công sức nhưng là bước nhảy về độ mượt.

### ✅ D3. Giữ ấm 2–3 video vừa hover 🟡 — xong 0.17.0

`onLeave` hiện `pause()` + `currentTime = 0`. Rê lại là buffer lại từ đầu.
**Sửa:** giữ nguyên `currentTime` và giữ `<video>` sống cho 2–3 thẻ gần nhất.

### D4. Sóng âm nên là DỮ LIỆU, không phải ảnh 🟡 — **VẪN KHÔNG LÀM**, nhưng đã giải quyết được phần NẶNG bằng cách rẻ hơn nhiều

Chủ dự án chốt 2026-07-27: *"màu như vậy được rồi"* → không cần vector hoá.

**Nhưng phần dung lượng thì phải xử.** Đo cache thật 28/07: sóng âm chiếm **96%**
bộ nhớ đệm (15.711 file PNG = 175,7 MB; thumbnail JPG chỉ 775 file = 7,1 MB), file
to nhất **822 KB**. `showwavespic` xuất PNG nén rất kém với loại ảnh này.

**Đã làm (1.2.0):** đổi PNG → **WebP q80**, nhỏ hơn ~70%, vẫn giữ kênh trong suốt.
Tương thích ngược: `wf_*.png` cũ dùng bình thường, không ai phải render lại.
Chủ dự án duyệt: *"không bị nhoè… không cần nặng để đẹp, anh cần nhẹ để nhanh"*.

Nếu sau này thật sự cần đổi màu theo theme / phóng to không mờ thì mới quay lại
phương án peaks + canvas.

---

## TẦNG E — không đo thì không biết có nhanh hơn

### ✅ E0. Hiện tại KHÔNG có phép đo nào 🔴

Mọi mục trên đều là suy luận từ code. Trước khi sửa, cần một chế độ đo bật/tắt
được, ghi ra:

- **hover → frame đầu hiện ra** (ms) — đây là con số quan trọng nhất của sản phẩm.
- thời gian quét / 1.000 file.
- số job hoàn thành mỗi phút, thời gian trung bình từng loại job.
- số `<video>` đang tồn tại trong DOM (bắt trực tiếp vấn đề A1).
- thời gian ghi `library.json`.

**Cách rẻ nhất:** `performance.mark/measure` + một bảng nhỏ trong Cài đặt. Đo
**trước** khi sửa để có mốc so sánh, nếu không sẽ lặp lại đúng bài học cũ: sửa mãi
mà không biết có khác gì không.

### ✅ E1. ĐÃ CÓ CÁCH ĐO — gắn thẳng vào panel đang chạy (28/07/2026)

Không cần dựng bảng đo trong Cài đặt nữa. Bản dev có file `.debug` mở cổng
**8088**; gắn vào bằng Chrome DevTools Protocol qua WebSocket là chạy được JavaScript
tuỳ ý **trên panel thật đang mở trong Premiere** — đếm phần tử DOM, đọc style đã
tính, mô phỏng thao tác rồi đo lại.

Script dùng lại được, đã để sẵn trong repo: **`scripts\do-tren-panel.ps1`**
(PowerShell + `ClientWebSocket`, không cần cài gì).

```powershell
.\scripts\do-tren-panel.ps1 -Expression "document.querySelectorAll('.card-asset').length"
```

Ba lưu ý đã trả giá:

- **`.Wait()` trên `CloseAsync` hay ném lỗi** → cứ `Dispose()`, dữ liệu đã nhận rồi.
- **`[ArraySegment[byte]]::new($bytes)`**, đừng dùng `New-Object ArraySegment[byte]`.
- Bản **phát hành không kèm `.debug`** → không đo được. Muốn đo lại thì cài bản dev
  bằng `scripts\sign-install.ps1`.

Nhờ cách này mà C6, F1, F2 dưới đây tìm ra được nguyên nhân thật thay vì đoán.

---

## TẦNG F — đo được ngày 28/07/2026 trên thư viện thật

> Cả tầng này rút từ một buổi: chủ dự án báo "render xong rồi vẫn giật".
> Điểm chung của mọi mục: **thứ tưởng là nút thắt đều không phải.**

### ✅ F1. Nút thắt là ĐẦU ĐỌC Ổ CỨNG, không phải CPU 🔴

| Ổ | Thiết bị | Loại | Chứa |
|---|---|---|---|
| `E:` | HGST HUH721212ALE604 12TB SATA | **HDD** | 28.892 asset gốc |
| `C:` | Kingston SNV2S500G NVMe | SSD | cache preview |

Máy rất mạnh (Ryzen 9 5950X 16 nhân/32 luồng, 64 GB RAM, RTX 4060 Ti) nhưng vô
nghĩa: nhiều tiến trình FFmpeg cùng đọc file nằm rải rác làm đầu đọc nhảy loạn
(~10ms mỗi lần nhảy). **Tăng từ 8 lên 16 luồng sẽ CHẬM HƠN.**

**Đã làm:** trần 8 worker · sắp job theo **đường dẫn thư mục** cho đầu đọc đi một
chiều · so sánh chuỗi thẳng, KHÔNG `localeCompare` (chạy trên 28.892 phần tử tốn
vài giây).

### ✅ F2. Thanh cuộn nhảy là TOÁN HỌC, không phải lỗi ảo hoá 🔴

91.256 asset / 3 cột × 149px = **4,5 triệu px** nội dung, trong thanh cuộn cao
**411px** → kéo 1px trôi qua **74 hàng = 222 asset**. Ảo hoá đã chạy đúng.

**Đã làm (1.3.0):** đổ dần 1.000 mục, **tự nạp khi cuộn gần đáy** (không có nút
"Xem thêm" — chủ dự án muốn cuộn liền mạch). 645.319px → **25.885px**, kéo 1px còn
**21px**, nhạy hơn **75 lần**.

⚠️ **Điểm dễ làm sai nhất:** giới hạn phải cắt **SAU khi lọc** (`visible`), không
cắt vào kho (`assets`) — cắt sai chỗ là ô tìm kiếm hoá mù, chỉ tìm trong 1.000 mục.

### ✅ F3. Turbo — bỏ phanh khi người dùng CHỦ ĐỘNG bấm 🟠

Ba thứ vốn cố tình làm chậm để nhường Premiere: `waitWhileHostBusy` (playhead
nhúc nhích là đứng im thêm 2,5s), `yieldMs` nghỉ giữa job, và IDLE priority.
Đúng cho chạy ngầm, sai cho "render một lần cho xong".

**Đã làm:** nút "Render preview" bấm tay → bỏ cả ba. Quét thư mục xong → vẫn chạy
ngầm nhường Premiere như cũ. Kèm **đường thoát**: nút đổi thành "Dừng render".

### ✅ F4. Trần tài nguyên co giãn theo khối lượng 🟠

Chủ dự án 28/07: *"render ít dùng ít, render nhiều dùng tối đa"*, CPU ~50%.

| Số việc | Tiến trình | Luồng | CPU (32 luồng) |
|---|---:|---:|---:|
| < 200 | 2 | 4 | ~12% |
| 200–999 | 4 | 8 | ~25% |
| 1.000–4.999 | 6 | 12 | ~37% |
| ≥ 5.000 | 8 | 16 | **~50%** |

`-threads` chèn ở **một chỗ duy nhất** (`execFileAsync`), không rải vào
thumbnailer/waveform/proxy — đó là chính sách dùng máy, không phải tham số riêng
từng job. Chế độ nền **không** ghim `-threads`: ở đó IDLE priority đã đủ.

### ❌ F5. Giới hạn GPU / RAM — **KHÔNG LÀM, không có gì để giới hạn**

- **GPU:** Windows không có API giới hạn % GPU cho tiến trình. Quan trọng hơn,
  panel gần như **không dùng GPU**: benchmark clip 4K 12s → libx264 wall **2,0s**
  vs cuda+nvenc wall **6,2s** (dựng CUDA context tốn 1–2s mỗi tiến trình, mà job
  của panel toàn loại ngắn). Giới hạn 70% một thứ dùng ~0% là vô nghĩa.
- **RAM:** mỗi FFmpeg loại này ăn vài chục MB; 8 tiến trình ≈ **800 MB / 64 GB =
  1,2%**. Trần 50% không bao giờ chạm tới.

---

## Thứ tự em đề nghị

1. **E0** (đo) — nhỏ, và làm mọi bước sau có bằng chứng.
2. **A1 + A2** cùng một lần sửa — ăn nhiều nhất, rủi ro thấp nhất.
3. **A4** — vì thư viện chính của dự án là mogrt.
4. **B1** — Premiere mượt hay không nằm ở đây, mà đang tưởng là đã xong.
5. **A3, C5, C3, C4** — đều nhỏ, ăn ngay.
6. **A5** — cảm giác nhanh với thư viện lớn.
7. **C1, C2** — rút ngắn lần quét đầu.
8. **B2** (đúng chức năng), rồi **D1 → D3 → D2 → D4** khi có thời gian.

Mỗi mục làm xong phải **đo lại và ghi số vào `PROGRESS.md`** — số trước/sau, không
ghi cảm nhận.
