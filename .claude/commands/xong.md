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
5. **Đẩy brain tổng — LUÔN LUÔN, mỗi lần `/xong`** (anh chốt 23/09: *"mỗi lần anh
   bấm /xong thì cập nhật brain và map công ty luôn 1 lần"*), kể cả phiên không
   sửa mã nguồn và không có bài học mới. Chạy **SAU bước 2f** (2f chụp sổ công ty
   vào repo brain trước, lệnh này đẩy cả hai lên một lượt): chạy `powershell -ExecutionPolicy Bypass -File
   "%USERPROFILE%\.claude\brain-repo\dong-bo-brain.ps1" -Day` (☠️ **trên Mac** không có PowerShell: chạy `bash "<repo>/scripts/dong-bo-mac.sh" --day-brain`) — nó chép brain
   vào repo PRIVATE `hadangtien0702-dot/brain` rồi push. ☠️ Brain KHÔNG được
   nằm trong repo AiO-Studio (repo đó PUBLIC — anh Tiến chốt để public 31/08).
6. Trong báo cáo cuối (bước 5) nhắc một dòng: *"đã push commit `<mã>` — máy kia
   chạy `scripts\dong-bo-may.ps1` là xong (kéo code + brain + cài thiếu)"*.

Phiên không sửa mã nguồn → bỏ qua mục 0–4 và 6 (không có code để push), nói rõ
là không có gì để push. **Mục 5 (brain + sổ công ty) vẫn chạy.**

## 2d. ☠️ ĐIỀU KIỆN CHỌN CÔNG NGHỆ — anh Tiến chốt 31/08/2026

Sau vụ Shot & Save: chọn Electron cho app chụp màn hình → cả tuần fix chuỗi
lỗi giật/rung/nhảy mà gốc là **kiến trúc không hợp thể loại app** (cả thị
trường chụp hình đều native 1 tiến trình). Anh Tiến: *"đây là một lỗi rất
nghiêm trọng, em mất thời gian của anh"*. Ba luật, áp cho MỌI dự án:

1. **Trước khi build một tính năng/tool mới: LUÔN tìm xem các app cùng loại
   trên thị trường đang chạy công nghệ lõi gì, và trình cho anh Tiến** —
   không được nhảy thẳng vào stack mình sẵn có.
2. **Luôn ưu tiên công nghệ mới - nhanh - mạnh - nhẹ, nhưng BẮT BUỘC chạy
   được đa hệ điều hành (Windows + macOS)** — sản phẩm AiO bán cho editor
   nước ngoài, phần lớn dùng Mac.
3. **Luôn tham khảo thị trường TRƯỚC khi chốt khuyên anh Tiến dùng công nghệ
   gì** — khuyến nghị phải kèm bảng "app nào đang dùng lõi nào", không
   khuyên chay.

Khi `/xong`: nếu trong phiên có khởi đầu tính năng/tool mới, tự kiểm đã làm
đủ 3 điều trên chưa — thiếu thì ghi rõ vào báo cáo, đừng im.

## 2e. ☠️ TOOL MỚI = ĐỦ FOLDER Ở MỌI NGĂN — anh Tiến chốt 18/09/2026

Nguyên văn: *"khi có yêu cầu tạo Tool mới thì em hãy tạo cho anh các thư mục trong
từng folder tương ứng đang có trong folder Production"*. Luật đầy đủ (ngăn nào,
file giữ chỗ, thứ không tạo tay): **`AiO Studio/CLAUDE.md` mục 4h** — đọc ở đó,
file này chỉ giữ bước kiểm.

Khi `/xong`: nếu phiên có **tạo tool mới hoặc đổi tên tool**, kiểm bằng lệnh,
đừng kiểm bằng trí nhớ:

1. **Dò lại danh sách ngăn** — ngăn nào đang có folder `AiO <Tên>` cho từ 2 app
   trở lên (đo 18/09: `Build and UI Design/` · `Build and UI Design/AiO Design
   System/` · `Release/<app>/win|mac`). Ngăn mới xuất hiện sau ngày đó thì cũng tính.
2. `ls` từng ngăn → tool mới có folder **cùng một tên** ở **mọi** ngăn đó.
3. `git ls-files` từng folder → có ít nhất một file giữ chỗ (thư mục rỗng không lên
   git, máy kia pull về sẽ không có).
4. Tên đã vào bảng app trong `AiO Studio/CLAUDE.md` mục 2 (ID + cổng không trùng)
   và `TOOL_VERSION_TRACKER.md`.

Thiếu mục nào → làm cho đủ, hoặc ghi rõ vào báo cáo bước 5 là còn thiếu gì.
Tool nằm **ngoài** AiO Studio (dự án khác trong `E:\2026\Production`) → hỏi anh
Tiến cấu trúc ngăn của dự án đó, đừng áp khuôn AiO.

## 2f. Cập nhật Trung tâm Điều hành (sổ công ty) — anh Tiến chốt 23/09/2026

Anh chốt gộp `/congty` vào đây: *"gộp /congty vào /xong luôn đi em"*. Mỗi lần chốt
phiên, sổ công ty (artifact `https://claude.ai/artifact/MwhxaNXJNGMrUwKtUDW9Wn`)
phải nói đúng như repo.

**Làm khi phiên có đụng tới một app của AiO Studio** (sửa code, ra bản mới, anh
nghiệm thu, đổi trạng thái). Phiên chỉ tra cứu, hoặc dự án ngoài AiO Studio → bỏ
qua, nói rõ là bỏ qua.

1. Với **từng app đã đụng trong phiên**: đọc số phiên bản + trạng thái từ repo
   (manifest / `package.json` / `PROGRESS.md`), đọc dòng `app/<mã>` trong sổ
   bằng `ArtifactData`, so hai bên.
2. Khác nhau → một lệnh `batch` (kèm `if_version`): cập nhật `app/<mã>` · thêm
   **một** dòng `hoatdong` với `loai:'app'`, `app:'<tên>'` (vào khung **Lịch sử
   app**) · đổi `meta/tong.capNhat`. Giờ lấy bằng `Date.now()` chạy thật.
3. Việc anh đã giao trên trang mà phiên này làm xong → gỡ thẻ `viec/<mã>` đó, ghi
   `hoatdong` `loai:'phong'`, và việc `'cho'` kế tiếp của đúng phòng đó chuyển
   sang `'moi'` (luật **mỗi phòng một việc**).
4. Việc CÒN DỞ của app → **không tự đẩy lên trang**; liệt kê trong báo cáo bước 5
   và hỏi anh có muốn giao cho phòng nào không.
5. **CHỤP SỔ LÊN GIT — LUÔN LUÔN, mỗi lần `/xong`** (anh chốt 23/09, chọn repo
   PRIVATE `brain`, không phải AiO-Studio vì repo đó public). Làm cả khi mục 1–4
   bỏ qua:
   - `Artifact` read `path:"index.html"`, `out_dir` = `~/.claude/brain-repo/trung-tam-dieu-hanh`.
   - `ArtifactData` list (`query.limit:1000`) 5 collection `phongban` · `app` ·
     `viec` · `hoatdong` · `meta`, `out_dir` = **thư mục nháp** (☠️ ghi thẳng vào
     `~/.claude` bị chặn bởi luật an toàn), rồi **xoá sạch** `trung-tam-dieu-hanh/du-lieu/`
     và chép bản mới vào (việc đã xong bị gỡ trên trang thì file cũ phải mất theo).
   - `node tao-readme.mjs` trong thư mục đó → `README.md` (bảng đọc được trên GitHub).
   - Soát: `grep -ri "eyJ\|sk-\|ghp_\|password\s*[:=]"` trong `du-lieu/` phải ra 0.
   - Rồi chạy bước 2c mục 5 (đẩy brain) — nó commit cả thư mục này.
   - Link cho anh xem: https://github.com/hadangtien0702-dot/brain/tree/main/trung-tam-dieu-hanh

Luật chi tiết (mã phòng, giá trị trạng thái, những thứ cấm đưa lên trang như
token / mật khẩu / đường dẫn ổ đĩa): đọc `congty.md` cùng thư mục với file này.

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
