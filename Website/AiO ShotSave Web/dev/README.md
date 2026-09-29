# Chạy thử web Shot & Save trên máy — gửi thư cảm ơn THẬT

Anh Tiến 25/09: *"không nhận được email cảm ơn… tạm thời phát triển trên localhost"*.
Trên Vercel trang demo mua **không gửi gì**. Chạy máy chủ nhỏ này trên máy thì trang demo mua
**gửi thư cảm ơn thật** (mẫu `../email/cam-on-mua.vi|en.html`) tới email nhập ở bước 1.
Mã trong thư là **mã THỬ** (`AIOSS-TEST-…-DEMO`), không kích hoạt được trong app.

## Lần đầu (1 lần mỗi máy)

1. Cài Node.js 18 trở lên (nodejs.org) nếu máy chưa có.
2. Mở thư mục này trong terminal, chạy `npm install`.
3. Tạo **mật khẩu ứng dụng** Gmail cho tài khoản dùng để GỬI thư:
   https://myaccount.google.com/apppasswords (tài khoản phải bật Xác minh 2 bước).
   Google đưa 16 ký tự, chép lại.
4. Chép `.env.example` thành `.env` rồi điền:
   ```
   GMAIL_USER=email-gui@gmail.com
   GMAIL_APP_PASSWORD=16kytukhongcach
   ```
   ☠️ `.env` **không bao giờ lên git** (repo public) — đã chặn trong `.gitignore`.

## Mỗi lần chạy

- Windows: bấm đúp `CHAY-THU.bat` · Mac/khác: `npm start`
- Mở **http://localhost:3000/checkout-demo.html**, nhập email, bấm Thanh toán (demo) → thư tới trong vài giây.
- Chân trang đổi thành "Đang chạy thử trên máy…" là đúng chế độ gửi thật.
- Chưa có `.env` → thư được **lưu** vào `dev/hop-thu/` (mở file .html để xem), không gửi đi.

## Kiểm

`npm test` — 14 phép, dựng máy chủ thư GIẢ ở 127.0.0.1 (không gửi ra ngoài): lưu file, gửi thật, người nhận,
tiêu đề, không còn ô `{{…}}`, chặn bấm liên tục (1 thư/20 s/địa chỉ), sai mật khẩu, không lộ thư mục `dev/`.

Ảnh trong thư lấy từ bản live `https://aio-shotsave.vercel.app/img/email/` (Gmail không tải được ảnh từ localhost).
