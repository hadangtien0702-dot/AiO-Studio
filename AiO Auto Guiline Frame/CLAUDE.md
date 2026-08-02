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
- `nghien-cuu-safe-zone.md` — nghiên cứu gốc kèm nguồn + ngày tra. Số nào trong
  JSON cũng phải chỉ được về một dòng trong file này.
- `dist/ve-guide.js` — bộ vẽ DÙNG CHUNG cho panel và bàn xem trước. Một nguồn vẽ.
- `xem-truoc-safe-zones.html` — bàn duyệt bằng mắt 18 khung hình (mở trình duyệt).
- **Rà soát dữ liệu MỖI QUÝ** (lần tới: 2026-11-01) theo 4 nguồn trong JSON
  (`nguonRaSoat`). Spec ads đổi 2–4 năm/lần nhưng UI organic đổi 1–3 lần/năm.

## Quyết định đã chốt

1. **Kiến trúc lai 2 tầng** (build 01/08 sau khi anh Tiến duyệt "build đi em"):
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
4. **KHÔNG dùng QE DOM trong v0.1** — hết track trống thì báo lỗi kèm hướng dẫn
   thêm track, không tự thêm (QE sai tham số là sập Premiere).
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

## Đã đo / chưa đo (chi tiết: PROGRESS.md mục mới nhất)

- ✅ **Đường đặt/gỡ overlay ĐO THẬT trên Premiere 02/08**: đặt lên track trống
  trên cùng, phủ trọn 89/89s (setOutPoint ăn — hết lo ảnh tĩnh 5s), gỡ xong
  trạng thái sequence + project GIỐNG HỆT gốc từng con số.
- ✅ **Panel UI ĐO THẬT trong Premiere 02/08 chiều**: bấm nút từ panel — đặt
  **0,2 giây** (chỉ tiêu ≤2s), gỡ 0,2s, cảnh báo vàng bật/tắt đúng, nhánh lệch
  tỉ lệ (9:16 trên sequence 16:9 → vẽ vùng giữa 405×720) chạy đúng, tab lưới
  đủ điều khiển, xuất .guides được. Mẹo: mở panel bằng lệnh
  `__adobe_cep__.requestOpenExtension(id)` qua panel anh em — khỏi chờ bấm menu.
- ⬜ Mapping ngang/dọc trong file `.guides` suy từ file mẫu, chưa đối chiếu ngược.
- ⬜ Render thử: file xuất KHÔNG dính overlay sau khi tắt (đã chứng minh gián
  tiếp bằng đếm clip; chưa soi file render).

## Nhật ký

Ghi vào `PROGRESS.md` sau mỗi lần sửa mã nguồn — mục mới trên cùng, giờ lấy bằng lệnh.
