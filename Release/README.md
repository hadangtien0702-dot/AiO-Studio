# Release — bộ cài phát hành

Cấu trúc (anh Tiến chốt 14/09/2026):

```
Release/
  <Tên app đúng như trong Build and UI Design>/
    win/   bộ cài Windows MỚI NHẤT (.exe / .zip + CAI-DAT.bat) + HUONG-DAN-CAI-DAT.txt
    mac/   bộ cài macOS mới nhất (chưa có → file CHUA-CO-BAN-MAC.txt)
  Chỉ giữ bản mới nhất mỗi app (anh chốt 14/09). Số bản nằm trong tên file. Lịch sử: CHANGELOG.md.
```

Luật: `.exe` / `.zip` / `.rar` KHÔNG lên git (gitignore) — chỉ hướng dẫn, ghi chú, script cài.
Máy nào cần bộ cài thì lấy từ máy đã build hoặc build lại (`npm run dist` cho Shot & Save,
`package-release.ps1` cho panel CEP). Bản mới nhất từng app: `CHANGELOG.md` ở gốc repo.
