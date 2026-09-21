---
description: Đọc lại trạng thái dự án — đang ở đâu, lần cuối làm gì, đang sửa dở gì
---

Chạy lệnh sau rồi đọc kỹ kết quả:

```
node "$HOME/.claude/scripts/batdau.mjs"
```

Nó in ra 3 thứ của đúng thư mục đang mở:
1. **Mục mới nhất của `PROGRESS.md`** — lần cuối làm gì, dừng ở đâu
2. **`git status`** — đang sửa dở file nào (anh Tiến ít commit nên `git log` không
   phản ánh việc thật, `git status` mới phản ánh)
3. **Việc đang CHỜ** của đúng app đó, lấy từ bảng trong `CLAUDE.md`

Sau khi đọc xong:

- **Tóm tắt lại cho anh Tiến trong 3–5 dòng**: đang ở app nào, phiên trước dừng ở
  đâu, còn dở gì. Nói bằng số (phiên bản, số phép kiểm, ngày giờ), không nói bằng
  tính từ.
- **Đừng hỏi lại anh "mình đang làm gì"** — thông tin đã có trong kết quả.
- Nếu `PROGRESS.md` cũ hơn 7 ngày so với hôm nay, **nói thẳng ra** là số liệu có
  thể đã cũ, đừng coi nó là hiện trạng.
- Nếu thư mục không có `PROGRESS.md`, **báo cho anh biết** — đó là một chỗ hở:
  phiên sau sẽ vào với trí nhớ trắng.

Lệnh này tự chạy ở đầu mỗi phiên qua hook `SessionStart`. Gọi tay khi cần đọc lại
giữa phiên, hoặc sau khi `cd` sang panel khác.

☠️ **Bản gốc của script nằm trong repo** (`scripts/batdau/batdau.mjs`).
Bản ở `~/.claude/scripts/` là bản CHÉP — `dong-bo-may.ps1` sẽ ghi đè nó.
Sửa bản trong repo, đừng sửa bản `~/.claude`.
