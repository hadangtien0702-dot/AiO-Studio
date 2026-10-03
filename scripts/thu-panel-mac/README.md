# thu-panel-mac — thử 11 panel AiO trong Premiere bằng cổng gỡ lỗi (CDP)

Lập 04/10/2026 trên Mac (Premiere Pro Beta 26.5). Thuần Node ≥ 22, không cần cài gì, chạy được cả Windows.
Không nhìn / không bấm được màn hình thì đây là cách bấm nút và đọc kết quả của panel.

## Cần gì

- Premiere đang mở một project **thử** và panel tổng **AiO Studio** đang mở (cổng 8101).
  Mọi lệnh ExtendScript đi qua cầu nối của panel tổng; các panel khác được mở bằng cách **bấm thẻ** trên panel tổng.
- Luật 3a: **tự dựng** bin + file + sequence riêng (xem `vi-du-04-10/dung.jsx`), thử xong **tự dọn** theo danh sách
  (`vi-du-04-10/don.jsx`: chạy `LIET_KE` đọc trước, rồi mới `LAM`), cuối cùng so với ảnh chụp trước khi thử (`doc.mjs`).

## File dùng chung

| File | Làm gì |
|---|---|
| `lib.mjs` | `chay(cổng, js)` chạy JS trong panel · `es(jsx)` chạy ExtendScript (bọc hàm ẩn danh, không để lại tên toàn cục) · `moPanel` / `dongPanel` · `chu` · `nut` · `chup` |
| `xem.mjs <panel> [sequenceID] [ảnh.png]` | mở sequence (đặt In/Out cả sequence), mở panel, in chữ + nút, chụp ảnh panel |
| `bam.mjs <panel> "<chữ trên nút>" [giây] [regex dừng]` | bấm nút theo chữ rồi in mỗi lần trạng thái đổi (đã bỏ đồng hồ và % khỏi phép so) |
| `bamid.mjs <panel> "<css selector>" [giây]` | bấm theo selector (nút chỉ có icon) |
| `cho.mjs <panel> "<chữ nút>" [giây]` | chờ tới khi nút đó BẬT lại (mốc xong của chính panel) |
| `soi.mjs [tiền tố]` + `soi.jsx` | đọc lại từ Premiere: clip từng track, khe hở, marker, độ dài |
| `doc.mjs` + `doc-project.jsx` | chụp toàn bộ project (item, đường dẫn, offline, sequence) để so trước / sau |
| `nghe-loi.mjs <cổng> <selector> [giây]` | nạp lại panel, bấm nút, ghi mọi lỗi JS + console trong lúc chạy |
| `hopthoai.mjs <cổng> accept` | trả lời hộp `confirm()` nếu CDP thấy nó (trên Mac hộp của CEP KHÔNG hiện qua CDP: phải nhờ người bấm) |
| `dong.mjs <panel...>` | đóng panel do script mở |

## Bẫy đã vấp 04/10 (đừng lặp lại)

- **Hộp chọn thư mục / `confirm()` của panel là hộp thoại hệ thống**: script đứng chờ vô hạn. Chọn thư mục: thay
  `window.cep.fs.showOpenDialog(Ex)` bằng hàm trả sẵn đường dẫn rồi bấm nút thật. `confirm()`: nhờ anh bấm.
- Regex dừng của `bam.mjs` rất dễ khớp nhầm chữ có sẵn trên panel ("Cần mic rời", "nhát cắt sẽ lệch", "như trước").
  Mốc xong chắc nhất là **nút chính bật lại** (`cho.mjs`).
- Nút chỉ có icon thì `innerText` rỗng: tìm theo `aria-label` / `title`. Nhãn thẻ trên panel tổng có khoảng trắng lạ: gộp `\s+` trước khi so.
- Tên file có dấu: so danh sách phải chuẩn hoá Unicode (NFC), không thì "thiếu file" giả.
- Re-Frames và Podcast **tự lưu project** khi dựng: thử xong, dọn xong phải lưu lại một lần để file trên đĩa sạch.
- Phát nhạc thử: tắt tiếng trước (`HTMLMediaElement.prototype.play` → `muted = true`).
- Ngay sau khi Autocut dựng xong, Premiere có lúc không trả lời ExtendScript > 18 giây (2 lần / ~170 lệnh): hỏi lại là được.
