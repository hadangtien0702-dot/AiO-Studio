# AiO Studio

Đây là thư mục chứa toàn bộ mã nguồn của dự án AiO Studio.

## Hướng dẫn đồng bộ mã nguồn về máy ở nhà

Để máy ở nhà có toàn bộ thư mục và file y hệt như máy ở công ty và bạn có thể tiếp tục làm việc, bạn làm theo các bước sau:

1. **Cài đặt Git**: Đảm bảo máy ở nhà đã được cài đặt Git (tải tại https://git-scm.com/).
2. **Mở Terminal/PowerShell**: Mở thư mục bạn muốn lưu code (ví dụ `E:\2026\Production`), click chuột phải chọn **Open in Terminal** hoặc **Git Bash Here**.
3. **Clone (tải) mã nguồn về**:
   Chạy lệnh sau:
   ```bash
   git clone https://github.com/hadangtien0702-dot/AiO-Studio.git
   ```
   Lệnh này sẽ tạo ra một thư mục `AiO-Studio` (hoặc `AiO Studio` tuỳ bạn đổi tên) chứa toàn bộ code y hệt máy công ty.

4. **Quy trình làm việc hàng ngày**:
   - **Khi ở nhà**: Trước khi bắt đầu làm việc, bạn mở thư mục code trong Terminal và chạy `git pull` để cập nhật code mới nhất từ công ty. Làm xong thì `git add .`, `git commit -m "update"` và `git push` để đẩy lên.
   - **Khi đến công ty**: Tương tự, trước khi làm việc chạy `git pull` để lấy code đã làm ở nhà về.

Chúc anh làm việc hiệu quả!
