---
description: Kết phiên — ghi nhật ký, rút bài học, cập nhật brain
---

Anh Tiến vừa gõ `/xong`: phiên làm việc kết thúc. Hãy **chốt sổ** trước khi đóng.

Làm đủ các bước dưới đây, theo đúng thứ tự. Bước nào không có gì để ghi thì **nói
rõ là không có**, đừng bịa ra cho đủ mục.

## 1. Nhìn lại phiên này đã làm gì

Tự trả lời trước khi viết: **phiên này có sửa mã nguồn không?**

- Không sửa gì (chỉ hỏi đáp, tra cứu) → bỏ qua bước 2, sang thẳng bước 3.
- Có sửa → làm đủ từ bước 2.

## 2. Ghi nhật ký dự án

Tìm `PROGRESS.md` (hoặc file nhật ký tương đương) trong thư mục dự án.

- Thêm mục mới ở **TRÊN CÙNG**, theo đúng khuôn đã dùng trong file đó.
- Giờ lấy bằng lệnh `date "+%Y-%m-%d %H:%M %z"` — **tuyệt đối không bịa**.
- Ghi đủ: **bối cảnh · nguyên nhân thật · đã sửa gì · file ảnh hưởng · kiểm chứng
  bằng số**.
- Cập nhật khối **"Trạng thái hiện tại"** ở đầu file: phiên bản, đang ở đâu, việc
  kế tiếp. Đây là thứ phiên sau đọc đầu tiên — sai chỗ này là phiên sau đi lạc.
- Việc còn dở phải ghi `[CHO]` kèm **lý do dừng**, đừng để lửng lơ.

Nếu dự án chưa có `PROGRESS.md`, hỏi anh Tiến có muốn tạo không — đừng tự tạo.

## 2b. ☠️ ĐẨY LÊN GIT = BUMP SỐ PHIÊN BẢN. Không có ngoại lệ.

Anh Tiến chốt 18/08/2026, nguyên văn: *"mỗi lần anh bảo e update lên git là mỗi lần
update verson mà"*.

**Nghĩa là:** anh Tiến bảo push → **trước khi commit**, tăng số phiên bản hiển thị
cho người dùng và đổi ngày về **hôm nay** (lấy bằng lệnh `date`, không bịa).

Vì sao quan trọng: số phiên bản là thứ **anh Tiến và 77 sale dùng để đối chiếu**
xem mình đang chạy bản nào. Đẩy code mới mà để số cũ thì người dùng báo lỗi của
bản cũ, còn mình đi tìm trong bản mới — mất thời gian cả hai bên.

**Cách làm:**
- Tìm chỗ hiển thị phiên bản (thường ở chân trang). Nó có thể nằm ở **NHIỀU trang** —
  grep hết, đừng sửa một chỗ. *(Thinksmart Tool: `version-badge` + `version-date`,
  có ở 3 trang `index.html` / `members.html` / `tool.html`.)*
- Sửa nhỏ/sửa lỗi → tăng số cuối (v1.44 → v1.45). Đổi lớn → hỏi anh Tiến.
- **Ngày phải giống nhau ở mọi trang.** Đã vấp 18/08/2026: index và members ghi
  `11/08`, còn tool ghi `12/08` — lệch mà không ai để ý.
- Ghi số phiên bản mới vào **cả nhật ký dự án** để phiên sau dò được.

## 2c. Đẩy lên GitHub cho MÁY KIA — anh Tiến chốt 31/08/2026

Anh Tiến làm việc trên **2 máy** (công ty `E:\...` / nhà `D:\...`), đồng bộ qua
GitHub. `/xong` mà không push là máy kia ngồi làm trên bản cũ không cảnh báo
(đã xảy ra: máy nhà đứng ở 24/08, thiếu 32 commit).

`/xong` = lo cho máy kia đủ 3 việc (anh Tiến chốt 31/08): **kéo code mới · kiểm
thư mục khớp · cài thứ còn thiếu để chạy**. Hai việc sau chạy TRÊN máy kia bằng
script `scripts/dong-bo-may.ps1` nằm trong repo (pull → đếm file so GitHub →
soi node_modules/Electron/FFmpeg, thêm `-CaiThem` là tự npm install). Sửa script
đó khi quy trình đổi — đó là nơi cơ chế sống, không phải file này.

**Làm khi phiên CÓ sửa mã nguồn và repo có remote `origin`:**

0. `git pull` trước — lỡ máy kia có đẩy gì lên thì nhận về trước khi push,
   đừng để hai nhánh toè ra.
1. `git status` — soi từng file chưa track trước khi add (bài 5af: mở ra đọc,
   đừng suy từ tên). Bộ cài / binary / file bí mật thì **không add** — thêm luật
   `.gitignore` nếu cần.
2. Commit message tiếng Việt không dấu, nói kết quả. **Không dùng dấu nháy kép
   trong message** (PowerShell 5.1 cắt argument — đã vấp 31/08).
3. Push. Trên máy công ty (DRT-G21) phải né credential 403:
   `git -c credential.helper= -c credential.helper=manager push`
4. Kiểm bằng số: `git status -sb` phải ra `## main...origin/main` không lệch,
   không còn file định đưa lên mà chưa lên.
5. Trong báo cáo cuối (bước 5) nhắc một dòng: *"đã push commit `<mã>` — máy kia
   chạy `scripts\dong-bo-may.ps1` là xong (kéo + kiểm + cài thiếu)"*.

Phiên không sửa mã nguồn → bỏ qua bước này, nói rõ là không có gì để push.

## 3. Rút bài học — ghi ĐÚNG TẦNG

Chỉ ghi thứ **không suy ra được từ mã nguồn**. Ghi trùng chỗ khác là lần sau đọc
mất thời gian mà không tìm ra cái cần.

| Bài học kiểu gì | Ghi vào đâu |
|---|---|
| Đúng ở **mọi dự án** (cách làm việc, cách anh Tiến quyết) | `~/.claude/CLAUDE.md` |
| Đúng theo **chủ đề** (panel Adobe, script Windows, backend…) | `~/.claude/skills/<tên>/SKILL.md` |
| Bài học **thiết kế / UI** | `~/.claude/skills/design-lessons/LESSONS.md` (mục tuần hiện tại) |
| Chỉ đúng **dự án này** | `CLAUDE.md` **nằm trong repo** — KHÔNG để trong bộ nhớ tự động |

Bốn thứ **bắt buộc** phải ghi, đừng đợi được nhắc:

1. **Anh Tiến sửa mình** → ghi thành bài học, nêu rõ *vì sao* và *áp dụng thế nào*
2. **Chốt một quyết định** (làm / không làm / đổi hướng) → ghi kèm **LÝ DO**
3. **Tìm ra nguyên nhân gốc của lỗi khó** → ghi cả **cái bẫy đã vấp**
4. **Phát hiện tài liệu ghi SAI** → **sửa ngay tại chỗ**, đừng để nguyên

## 4. Kiểm bộ nhớ dự án còn khớp không

Đọc `~/.claude/projects/<đường-dẫn-dự-án>/memory/` — nếu có mục nào giờ đã sai
(phiên bản cũ, quyết định đã đổi) thì **sửa hoặc xoá**, đừng để nó nói dối phiên sau.

Nhớ: bộ nhớ đó **gắn theo đường dẫn thư mục**. Dời thư mục là nó đứng lại ở tên cũ,
im lặng. Thứ gì quan trọng → viết vào `CLAUDE.md` trong repo.

## 5. Báo cáo cho anh Tiến

Ngắn gọn, tiếng Việt, nói bằng **kết quả chứ không bằng tính từ**:

- Đã ghi gì, vào file nào (dùng link bấm được)
- Việc còn dở và lý do dừng
- Nếu **không có gì đáng ghi** thì nói thẳng: *"phiên này chỉ tra cứu, không có gì
  để ghi vào brain"* — thà vậy còn hơn nhét cho đầy.

Đừng liệt kê lại toàn bộ những gì đã làm trong phiên — anh ấy vừa ngồi đó nhìn rồi.
Chỉ nói **cái gì đã được ghi lại để phiên sau dùng**.
