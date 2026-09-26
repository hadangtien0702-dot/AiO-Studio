# AiO Auto Guiline Frame — guideline safe zone cho editor

> Sinh 2026-08-01 từ file `Brandstorm chức năng.txt` của anh Tiến.
> Đọc file này TRƯỚC khi sửa bất cứ dòng nào trong thư mục.

---

## Ba lớp sản phẩm

| Lớp | Trả lời câu | Nội dung |
|---|---|---|
| **Người xài** | Bấm gì, được gì | Editor đang dựng video cho Facebook/TikTok/Reels… mở panel, **chọn nền tảng** → sequence hiện ngay các đường guideline: chỗ nào bị avatar, tiêu đề, nút like/share của app che mất. Ví dụ đời thường: *như tấm kính lót có kẻ ô đặt lên bàn cắt — nhìn qua kính là biết chỗ nào dao được phép đi.* |
| **Builder** | Chạy thế nào | Panel CEP Premiere. Dữ liệu safe zone nằm trong **một file JSON nguồn chân lý** (`safe-zones.json`), panel vẽ overlay từ JSON đó — KHÔNG hard-code toạ độ trong UI. Cách đưa guideline lên sequence: đang chốt (xem "Quyết định chờ anh Tiến"). |
| **MVP** | "Xong" nghĩa là gì, đo bằng số nào | Chọn 1 preset → overlay hiện đúng trong ≤2 giây · toạ độ overlay khớp JSON từng pixel (đo bằng script, không ước lượng) · **xuất video KHÔNG dính overlay** (render thử và soi file ra) · tắt preset → sequence sạch như cũ (đếm clip trước/sau bằng nhau). |

## Định danh — ĐẶT CHỖ, không được trùng

| | Giá trị |
|---|---|
| Extension ID | `com.aiostudio.guideframe` |
| Cổng debug | **8096** (8088 Asset · 8089 Autocut · 8090 PowerBins · 8091 Transcripts · 8092 Re-Frames · 8093 dành Auto Cut Short · 8094 Podcast · 8095 xem-bo) |
| Thư mục | `E:\2026\Production\AiO Studio\AiO Auto Guiline Frame` |

## Nguồn chân lý dữ liệu — LUẬT SỬA SỐ LIỆU

- `safe-zones.json` — toạ độ safe zone từng nền tảng. **Sửa số liệu thì sửa Ở ĐÂY**,
  rồi chạy `node scripts/sinh-du-lieu.mjs` (sign-install tự chạy). ĐỪNG sửa tay
  `dist/safe-zones.js` — nó là file SINH RA, lần đóng gói sau sẽ đè mất.
- ☠️ **Nguồn số HỢP LỆ từ 26/09/2026: ẢNH CHỤP APP THẬT trên điện thoại thật** (đo pixel + ghép chồng
  bằng `scripts/do-anh-that/`). Spec/tài liệu quảng cáo chỉ là **biên trên/dưới**, KHÔNG dùng để chốt
  cạnh phải, mép cắt hay vị trí icon giả. "Rà soát" mà không có ảnh mới thì ghi *"chưa kiểm được"*,
  không ghi *"không đổi"*. (Anh 26/09: *"em đã lấy thông số ảo để áp vào"* — bài brain `5bf`.)
  Trạng thái: YouTube Shorts đã đo ảnh thật 25/09; 12 định dạng còn lại **chưa**.
- `nghien-cuu-safe-zone.md` — nghiên cứu gốc kèm nguồn + ngày tra. Số nào trong
  JSON cũng phải chỉ được về một dòng trong file này.
- `dist/ve-guide.js` — bộ vẽ DÙNG CHUNG cho panel và bàn xem trước. Một nguồn vẽ.
- `xem-truoc-safe-zones.html` — bàn duyệt bằng mắt 18 khung hình (mở trình duyệt).
- **Rà soát dữ liệu MỖI QUÝ** theo các nguồn trong JSON (`nguonRaSoat`). Spec ads đổi
  2–4 năm/lần nhưng UI organic đổi 1–3 lần/năm. Lần 1: 01/08/2026. **Lần 2: 25/09/2026
  (anh yêu cầu) — 17/17 định dạng không đổi số**, bảng đối chiếu ở
  `nghien-cuu-safe-zone.md` mục 17. **Lần tới: 2026-12-25.** Cách rà: fetch thẳng 6
  trang chính thức + tìm nguồn 2026 cho nền tảng không công bố; đổi số nào phải có
  câu trích + ngày; đối chứng script "53/53 pt/px trước = sau" khi chỉ cập nhật ghi chú.

## Quyết định đã chốt

0. ☠️ **ĐỔI 26/08/2026 — anh Tiến yêu cầu GỠ 5 khối khỏi giao diện.**
   Khối hành động nay chỉ còn **DUY NHẤT nút chính**.
   - Gỡ: **"Preset của tôi"** · **nút "Lưu file .guides"** (tức **Tầng B** của
     quyết định số 1 — nay KHÔNG còn trong panel) · **thông báo thành công**
     ("Đã đặt lên track V3…") · **cảnh báo "Đang có N guide trên timeline"** ·
     **nút "Gỡ guideline"**.
   - Hộp trạng thái vẫn còn nhưng **chỉ hiện khi lệch tỉ lệ hoặc khi LỖI**
     (chưa nối Premiere, hết track trống…). Giữ vì gỡ hẳn thì panel câm lúc
     hỏng, người dùng không biết vì sao không ra guide.
   - **Đường RA thay cho nút Gỡ:** xoá clip guide trên V3 bằng tay trong
     Premiere — panel tự nhận ra sau ~1,5s. Bấm nút chính khi đang có guide thì
     vẫn **gỡ cũ rồi đặt mới**. Đánh đổi: không còn ai dọn giúp **bin "AiO Guide
     Frame" + file PNG** trong project.
   - Hàm host `gf_tatOverlay` **vẫn dùng** (đường thay thế gọi nó). Code chết
     của phần giao diện đã dọn sạch — 0 tham chiếu còn lại.
   - Gỡ thêm: **dòng chữ "LOP GUIDE — TAT TRUOC KHI XUAT VIDEO" nung trong ảnh**
     (`veTag()` xoá hẳn khỏi `ve-guide.js`). ⚠️ Hệ quả: **panel không còn nhắc
     gì về việc tắt guide trước khi xuất** — không nút, không cảnh báo, không
     chữ trong ảnh. Chữ còn lại trong ảnh là **mô phỏng UI nền tảng**
     (`veUiThat`, tính năng 02/08); tắt bằng `{ uiThat:false }` nếu cần.
   - ☠️ **Tên file PNG phải DUY NHẤT mỗi lần** (`..._<Date.now()>.png`). Tên cố
     định thì bấm lần hai cho cùng khung hình là dính `EBUSY` — Premiere giữ
     file cũ kể cả sau khi gỡ clip và xoá bin. `donFileCu()` dọn file cũ theo
     kiểu tốt-nhất-có-thể (file đang bị giữ thì để lần sau).
1. **Kiến trúc lai 2 tầng** (build 01/08 sau khi anh Tiến duyệt "build đi em")
   — ☠️ **Tầng B đã gỡ khỏi giao diện 06/08, xem mục 0**:
   Tầng A = overlay PNG do panel vẽ đúng kích thước sequence, đặt lên track video
   trống trên cùng — mô phỏng UI thật, có tag "TẮT TRƯỚC KHI XUẤT" nhúng trong ảnh
   + cảnh báo vàng trong panel (Premiere KHÔNG có guide-layer kiểu AE: mọi công
   tắc ẩn clip đều ẩn luôn khỏi preview). Tầng B = xuất file `.guides` (guide gốc
   Premiere, vị trí %, không bao giờ dính export — format JSON đã giải mã).
2. **"Real time"** = bộ JSON mình duy trì + rà mỗi quý. Nền tảng không có API safe
   zone; spec máy-đọc-được không tồn tại. (Giai đoạn sau: panel tự tải JSON mới
   từ server — chưa làm.)
3. **Nền tảng bản đầu:** đủ 10 (TikTok, IG, FB, YouTube, Snapchat, Pinterest,
   LinkedIn, X, Zalo, Broadcast) vì data-driven nên thêm gần như miễn phí.
4. ~~**KHÔNG dùng QE DOM trong v0.1** — hết track trống thì báo lỗi kèm hướng dẫn
   thêm track, không tự thêm (QE sai tham số là sập Premiere).~~
   **ĐÈ 25/09/2026 (v0.3.1): hết track trống thì panel TỰ THÊM một track video lên
   trên cùng rồi đặt guide lên đó.** Vì sao: anh dựng bài thật, timeline 11 track
   V1–V11 đều có clip trong vùng In/Out, bấm nút ra hộp đỏ "No empty video track
   left…", anh chụp màn hình: *"add không được em à"*. Cách làm: đúng MỘT lệnh QE
   `qe.project.getActiveSequence().addTracks(1, soTrack, 0, 0)` — chữ ký Asset
   Manager / Power Bins / Transcripts đang dùng, KHÔNG dò tham số khác — gọi xong
   ĐỌC LẠI số track, không tăng mới trả `HET_TRACK`; chốt tên sequence QE = sequence
   đang đặt. Đo thật 25/09: 3 track đầy → thêm V4 + đặt guide **298 ms**, 0 track
   tiếng thêm nhầm, 3 clip bên dưới nguyên. Sửa gốc thứ hai cùng lần: tìm track
   trống **trong vùng In/Out [a,b)** chứ không hỏi cả sequence (skill 6b) — top
   track bận [0,2) mà vùng [3,5) thì đặt lên chính track đó, không thêm.
5. **Luật UI anh Tiến chốt 02/08 (sau khi review dưới góc người dùng):**
   - Panel KHÔNG hiện số liệu phân tích (%, px, nguồn, trạng thái nghiên cứu) —
     chỉ MỘT dòng: *"Thông số kỹ thuật đã cập nhật phiên bản mới nhất"*. Nhãn
     %·px trong bộ vẽ chỉ bật ở bàn duyệt nội bộ (`opts.nhan`).
   - Tên định dạng là ngôn ngữ người dùng ("Reels", không phải "Reels/mọi video
     từ 06/2025"). Chú thích nghiên cứu ở `ghiChu`/`nguon` trong JSON + tài liệu.
   - Chọn khung hình bằng THẺ hình thu nhỏ đúng tỉ lệ; nền tảng có chấm màu
     thương hiệu.
   - Số liệu chi tiết giải thích qua tài liệu (`nghien-cuu-safe-zone.md`,
     `xem-truoc-safe-zones.html`) hoặc khung chat — không qua panel.

## ☠️ UI ĐÃ THAY BẰNG THIẾT KẾ ANH TIẾN CHỐT (v0.2.0 — 2026-08-06)

- File thiết kế: `AiO Design System/AiO Auto Guiline Frame/AiO Guide Frame.html`.
  **BẤT KHẢ XÂM PHẠM** — muốn đổi hình thì đổi ở đó trước, rồi ghép lại.
- `dist/index.html` = thiết kế đó + dây nối Premiere. Panel này **KHÔNG có bước
  build**, `dist/` là mã nguồn viết tay nên sửa thẳng vào đó.
- ☠️ **Đừng chép đè file thiết kế lên `dist/index.html`.** Đã xảy ra một lần
  (06/08): mất đường gỡ guide, mất kiểm phiên bản host, mất xuất `.guides`, tải
  video mẫu từ Internet, và 14 id JS gọi mà HTML không có → bấm nút EN là chết.
  Bảng thiệt hại đầy đủ trong `PROGRESS.md` mục 2026-08-06.
- Thiết kế **hard-code số liệu safe zone**; panel đã bỏ qua mảng đó (`NEN_GOC`
  chỉ còn là lưới an toàn) và đọc từ `safe-zones.js`. Giữ nguyên luật nguồn chân lý.
- Font Inter đóng gói ở `fonts/` (thiết kế trỏ `../fonts/Inter.woff2`).
  `sign-install.ps1` đã chép thư mục này — trước 06/08 thì **không**, cài vào
  Premiere là 404 rồi rơi về font hệ thống.
- Phiên bản phải khớp ở **3 nơi**: `CSXS/manifest.xml` · `gf_phienBan()` cuối
  `host/guideframe.jsx` · `PHIEN_BAN` trong `dist/index.html`. Lệch = panel báo
  "Premiere đang giữ host CŨ" và chặn mọi lệnh (cố ý). Huy hiệu `v…` trên thanh
  tiêu đề (`<span class="ver">`) từ 25/09 đọc từ `PHIEN_BAN` — trước đó là nơi thứ 4
  viết tay, bump 0.3.1 xong vẫn hiện 0.3.0.

## Vùng chọn In/Out (v0.3.0 — 2026-08-25, anh Tiến yêu cầu)

- Panel tự nhận vùng In/Out anh khoanh trên timeline (ghép vào chính câu trả lời
  `gf_thongTinSeq` của vòng thăm dò 1,5s — KHÔNG thêm lượt evalScript nào).
  Chip "Vùng chọn + thời lượng" trên thanh sequence, CHỈ hiện khi có vùng thật.
  Bấm nút chính thì guide đặt đúng trong `[in, out]` (`gf_datOverlay` nhận thêm
  2 tham số, thiếu/vô lý thì rơi về phủ cả sequence như cũ).
- ☠️ Premiere trả in=0/out=cuối khi CHƯA khoanh — không phân biệt được với
  "khoanh trọn sequence"; hai ca cho cùng kết quả nên gộp: coi là không có vùng.
- ☠️ Chip ẩn bằng `style.display`, không dùng `[hidden]` (bẫy `.tt` 06/08).

## Đã đo / chưa đo (chi tiết: PROGRESS.md mục mới nhất)

- ✅ **Đường đặt/gỡ overlay ĐO THẬT trên Premiere 02/08**: đặt lên track trống
  trên cùng, phủ trọn 89/89s (setOutPoint ăn — hết lo ảnh tĩnh 5s), gỡ xong
  trạng thái sequence + project GIỐNG HỆT gốc từng con số.
- ✅ **Panel UI ĐO THẬT trong Premiere 02/08 chiều**: bấm nút từ panel — đặt
  **0,2 giây** (chỉ tiêu ≤2s), gỡ 0,2s, cảnh báo vàng bật/tắt đúng, nhánh lệch
  tỉ lệ (9:16 trên sequence 16:9 → vẽ vùng giữa 405×720) chạy đúng, tab lưới
  đủ điều khiển, xuất .guides được. Mẹo: mở panel bằng lệnh
  `__adobe_cep__.requestOpenExtension(id)` qua panel anh em — khỏi chờ bấm menu.
- ✅ **Bản v0.2.0 đo trên trình duyệt 06/08**: 17/17 khung hình khớp
  `safe-zones.json` từng con số · PNG đúng (tâm khung trong suốt, 8.213 điểm chữ
  cảnh báo trong ảnh, tắt tag còn 0) · `.guides` ra đúng vị trí · 21/21 phép thử
  tương tác · 0 lỗi JS · 0 lần gọi mạng.
- ✅ **v0.2.0 ĐO THẬT trên Premiere 06/08** — project `PV tuyển dụng.prproj`,
  sequence 4K **3.897 giây / 306 clip**: đặt **0,74s**, gỡ **0,13s**, vào track V3
  trống, phủ trọn 3897,76/3897,76s, **gỡ xong sequence giống hệt bản gốc** (so
  chuỗi ảnh chụp tên + mốc đầu/cuối từng clip). 2 hàm host mới chạy đúng. Soi
  chính file PNG 4K: tâm khung alpha 0, dòng "TẮT TRƯỚC KHI XUẤT" nằm trong ảnh.
- ⬜ Mapping ngang/dọc trong file `.guides` suy từ file mẫu, chưa đối chiếu ngược.
- ⬜ Render thử: file xuất KHÔNG dính overlay sau khi tắt (đã chứng minh gián
  tiếp bằng đếm clip; chưa soi file render).
- ⬜ Số `zalo-916` cạnh phải: JSON ghi **12%**, thiết kế ghi **12,96%** — chờ
  anh Tiến chốt số nào đúng.
- ✅ **v0.3.0 vùng chọn — phần ĐỌC đo thật trên Premiere 25/08** (logic 15/15 ca
  biên, chip đo trên DOM, host mới đọc in/out sequence thật). ⬜ Ca CÓ vùng chọn
  (khoanh I/O → bấm → guide nằm đúng vùng) CHƯA đo trên Premiere — không tự đặt
  I/O lên sequence của anh được (luật 19/08), chờ anh bấm thử.
- ✅ **v0.3.1 tự thêm track — ĐO THẬT trên Premiere 27 (Beta) 25/09**, bài test tự
  dựng môi trường (bin + 2 PNG + sequence riêng qua `createNewSequenceFromClips`,
  3V/3A 4,97 s, lấp đầy V1–V3; dọn xong sequence "Tập 2" của anh 12V/3A/9 clip
  trước = sau): 3 track đầy → thêm V4, guide lên V4 phủ 4,97/4,97 s, **298 ms**,
  `themAudio=0` · bấm lại khi V4 trống → không thêm · V4 bận [0,2) + vùng [3,5)
  → đặt lên V4 tại 3,00, không thêm. **Bản cuối (cài 15:57, sau 2 vòng Codex + sửa
  lỗi gỡ-xoá-nhầm) ĐO LẠI 16:00** trong project thật anh đang mở có 1 guide của anh:
  4 ca đặt/gỡ đạt (thêm V4 189 ms), gỡ ở B `giuItem=2` (guide của A và của anh còn),
  `PROJECT_CUA_ANH_KHOP_TRUOC_SAU=DUNG`. Biết và chấp nhận: file PNG trên đĩa không xoá
  được trong phiên (Premiere giữ handle kể cả sau khi item mất), ~50 KB/lần bấm.
  ⬜ Anh bấm trên bài thật 11 track — chưa.
- ✅ **YouTube Shorts đo từ ẢNH THẬT 25/09 tối** (iPhone Pro Max của anh, góc chủ kênh; 2 agent đo lại
  độc lập khớp; `nghien-cuu` 2a): vùng **top 13 / bottom 25 / right 18 / left 7 crop**; mock cột phải +
  hàng trên theo toạ độ đo (tâm icon lệch ≤ 13 px màn), khối dưới-trái theo góc NGƯỜI XEM neo đáy (ước).
  ⬜ Cần 3 ảnh để khoá: góc người xem · iPhone 15/16 hoặc Android · máy anh sau khi tắt "Zoom to fill".
  ⬜ TikTok / Reels / Snap… mock vẫn "minh hoạ", chưa đo ảnh thật.

## ☠️ SỔ LỖI TÁI DIỄN (luật 31/08: lỗi / gốc ĐÃ ĐO / chốt chặn)

| Lỗi | Gốc đã đo | Chốt chặn |
|---|---|---|
| Gỡ guide ở sequence B → guide ở sequence A **biến mất** (25/09/2026, xảy ra thật trên "Tập 2" của anh: 11→10 clip, 13→12 item) | `gf_tatOverlay` đếm guide chỉ trên sequence ĐANG MỞ, = 0 là `deleteBin` cả bin "AiO Guide Frame" → item của A mất → Premiere xoá clip A. Kèm panel `donFileCu()` quét xoá mọi PNG guide trên đĩa (file của A chỉ được OS giữ tạm) | `gf_tenGuideDangDung_()` gom tên guide trên MỌI sequence; `gf_donBinGuide_()` chỉ xoá item không còn ai dùng, xoá file SAU khi xoá bin tạm; panel không quét đĩa nữa. Bài test `thu-them-track.js` chụp cả project trước/sau và có ca A+B |
| Timeline đầy track → "No empty video track" (25/09, anh: *"add không được em à"*) | Thiết kế v0.1 không dùng QE; và `gf_trackTrong_` hỏi cả sequence thay vì vùng In/Out | Thêm 1 track bằng đúng chữ ký `addTracks(1,n,0,0)` + đọc lại số track + tìm lại track trống; hỏi trống theo [a,b) |
| Khung YouTube Shorts "chưa đúng" (anh, 25/09 tối): icon giả lệch icon thật, cột icon thật nằm ngoài vùng đỏ | Mock UI vẽ theo cảm tính (cột phải ~94%W từ 46%H, hàng trên 4,5%H, chữ từ 4,5%W) và vùng phải 10% là số ADS; đo ảnh chụp iPhone của anh: iPhone phủ kín chiều cao + cắt 5% mỗi mép, cột icon lấn 16%, hàng trên hết 10,8% | Vùng top 13 / right 18 / left 7 crop (sau 3 phản biện: iPhone nhỏ hơn Pro Max chiếm nhiều % hơn, Android cắt thêm); mock cột phải theo toạ độ đo, khối dưới theo góc NGƯỜI XEM neo đáy (ước — ảnh anh là góc chủ kênh) (`nghien-cuu` 2a). **Mock UI của mọi app phải đo từ ảnh chụp thật**, kiểm bằng ghép chồng (`scripts/do-anh-that/`) |
| Bấm lần hai cùng khung → `EBUSY` (26/08) | Tên PNG cố định, Premiere giữ file cũ | Tên file có `Date.now()` |
| Panel mới nói chuyện host cũ | Premiere nạp `.jsx` một lần | `napHost()` evalFile trước mỗi lệnh + so `PHIEN_BAN` |

**Checklist trước khi báo xong (sau mỗi lần sửa host):** chạy `thu-them-track.js` qua cổng
8096 → dòng cuối phải `PROJECT_CUA_ANH_KHOP_TRUOC_SAU=DUNG`, 4 ca đặt/gỡ OK, `giuItem` ≥ 1 ở
bước gỡ B. ☠️ Bài test **chỉ** được gọi `gf_tatOverlay` khi sequence đang mở là của mình.

## Nhật ký

Ghi vào `PROGRESS.md` sau mỗi lần sửa mã nguồn — mục mới trên cùng, giờ lấy bằng lệnh.
