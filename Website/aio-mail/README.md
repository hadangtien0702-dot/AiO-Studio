# aio-mail: gửi thư cảm ơn khi có đơn Shot & Save

Dự án Vercel riêng (Root Directory = `Website/aio-mail`), chỉ có một hàm: `api/polar-webhook.js`.
Polar báo "đơn đã trả tiền" (`order.paid`) thì hàm lấy mã bản quyền qua API Polar rồi gửi thư cảm ơn (có hình động) bằng Gmail.

- **Vì sao tách khỏi `Website/AiO ShotSave Web/`:** Vercel đặt tên hàm theo đường dẫn từ gốc repo và từ chối tên có dấu cách
  (`invalid_function_name`). Đặt hàm vào thư mục web bán hàng làm hỏng mọi lần dựng của trang đó (16/10/2026).
- **Mẫu thư:** nguồn là `Website/AiO ShotSave Web/email/cam-on-mua.v3.{vi,en}.html`. Sửa mẫu xong chạy
  `node "Website/Nhap web ShotSave/email-mau/nhung-mau.cjs"` để sinh lại `api/_mau-thu.js` (không sửa tay file đó).
- **Bài thử:** `node "Website/Nhap web ShotSave/email-mau/test-webhook.cjs"` (49 mục, không mạng, Polar và Gmail giả).
- **Biến môi trường** (đặt trong Vercel, không ghi vào repo): xem đầu file `api/polar-webhook.js`.
