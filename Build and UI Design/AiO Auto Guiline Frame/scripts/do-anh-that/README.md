# Đo safe zone từ ẢNH CHỤP THẬT của app (lập 25/09/2026, ca đầu: YouTube Shorts trên iPhone của anh Tiến)

Thước tốt nhất cho vùng an toàn là ảnh chụp màn hình app thật trên máy thật. Bộ này gồm 4 file:

1. `do-anh-shorts.py` — đọc ảnh chụp (PIL), tìm thanh điều hướng đen, hàng icon trên, cột icon phải,
   khối chữ dưới; in toạ độ px + quy đổi. Sửa đường dẫn `<duong-dan-anh-chup>` rồi chạy `python`.
2. `may-chu-gf.mjs` — máy chủ tĩnh cổng 8125: `/dist/*` = dist của panel, `/<file>` = thư mục làm việc,
   `POST /luu?ten=x.png` nhận dataURL canvas ghi ra PNG. Sửa `<thu-muc-lam-viec>`.
3. `ve-shorts.html` — mở qua máy chủ trên (không mở file://, trình duyệt app không chạy JS file://), vẽ
   guide 1080×1920 bằng đúng `ve-guide.js` + `safe-zones.js` đang dùng; `window.PNG` = ảnh; gửi lên
   `/luu` để lấy file.
4. `ghep-shorts.py <guide.png> <ra.jpg> <navTop>` — đặt guide chồng lên ảnh chụp theo cách app hiện
   video 9:16 (YouTube Shorts iPhone: PHỦ KÍN chiều cao vùng trên thanh điều hướng, cắt 2 mép; navTop
   = hàng đầu của thanh đen, đo bằng tay vì hàng "đen phẳng" tự dò dễ trúng vùng tối của video).

☠️ Ảnh chụp là dữ liệu của anh — để trong `Test Media/` (ngoài git), đừng đưa vào repo public.
Trước khi sửa mock UI của app nào: đo ảnh thật app đó, ghép chồng, rồi mới sửa `UI_THAT` trong `ve-guide.js`.
