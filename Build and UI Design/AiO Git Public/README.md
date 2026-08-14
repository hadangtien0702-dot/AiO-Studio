# AiO Studio - Git & Release Tooling

Thư mục này chứa các tệp trợ lý và công cụ hỗ trợ liên quan đến quá trình đẩy mã nguồn (Git Push) và phát hành dự án **AiO Studio**.

---

## 📌 Thông Tin Repository GitHub
- **Repository URL:** [https://github.com/hadangtien0702-dot/AiO-Studio](https://github.com/hadangtien0702-dot/AiO-Studio)
- **Branch chính:** `main`

---

## 🚀 Hướng Dẫn Sử Dụng Script Push Code Nhanh
Để thực hiện kiểm tra và đẩy toàn bộ thay đổi mã nguồn mới nhất lên GitHub:

1. Mở PowerShell hoặc Terminal tại thư mục `AiO Git Public`.
2. Chạy lệnh:
   ```powershell
   .\push.ps1 "Thông điệp cập nhật của bạn"
   ```
   *Nếu không truyền thông điệp, script sẽ tự đặt thông điệp mặc định.*

---

## 🛡 Thư Mục & Tệp Được Quản Lý Bởi Git (.gitignore)
Các tệp tạm, sản phẩm build và tệp truyền thông dung lượng lớn đã được loại trừ tự động trong `.gitignore` để đảm bảo tốc độ push nhanh và không bị vượt quá giới hạn 100MB của GitHub:
- `node_modules/`, `dist/`, `build/`, `.next/`, `.wrangler/`
- Các tệp thực thi `*.exe` (như `ffmpeg.exe`, `ffprobe.exe`)
- Các tệp preview truyền thông nặng (`*.cfa`, `*.pek`, `*.mp4`, `*.wav`)
