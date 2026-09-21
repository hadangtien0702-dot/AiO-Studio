# AiO Studio (gốc repo) — Nhật ký

> Nhật ký cho thứ nằm ở **gốc repo**: `scripts/`, `.claude/`, `CLAUDE.md`, cấu
> trúc thư mục. Việc của từng panel ghi ở `PROGRESS.md` **trong thư mục panel đó**.
>
> Lập 21/09/2026 — trước đó mục 8 `CLAUDE.md` ghi *"PROGRESS.md gốc repo | Chưa có"*.

## [ba-may-mac] - 2026-09-21 16:21 (UTC+7) - THÊM MÁY MAC: script dong-bo-mac.sh + /xong push cho 3 máy

### Trạng thái hiện tại (phiên sau đọc đầu tiên)
- Anh có **3 máy**: công ty Win `E:\` · nhà Win `D:\` · **nhà Mac** (mới, 21/09). Tối 21/09 anh làm tiếp **trên Mac**.
- `scripts/dong-bo-mac.sh` = bản Mac của `dong-bo-may.ps1` + `dong-bo-brain.ps1`. **CHƯA chạy trên Mac thật.**
- [CHỜ] **Đổi AiO Music → "Keynote"** (đổi tên + định hình lại) — anh giao 16:1x, chờ anh nói Keynote làm gì.
- [CHỜ] `AiO Map` chưa đăng ký (không biết là tool gì) — đã đưa lên git theo lệnh push.
- [CHỜ] Music đã nối vào Premiere máy công ty nhưng Premiere Beta mở TRƯỚC khi nối → anh phải tắt mở lại mới thấy.

### Bối cảnh
`/xong` kèm lời anh: *"push code lên git đi để tối về anh làm tiếp… anh sẽ làm trên máy Mac… em cần làm những gì
để đồng bộ máy ở nhà và máy mac"*, rồi *"máy ở nhà anh có 2 máy là máy mac và máy win luôn đó em"*.
Mac không có PowerShell → cả 2 script đồng bộ (.ps1) đều không chạy được ở đó.

### Đã làm
- `scripts/dong-bo-mac.sh` (bash 3.2, bản có sẵn trên macOS): pull · đếm file khớp GitHub · node + node_modules
  (`--cai-them` tự cài) · chép /xong + /batdau + batdau.mjs · clone/nhận brain (sao lưu file khác trước khi ghi đè).
  `--day-brain` = đẩy brain lên GitHub (thay `dong-bo-brain.ps1 -Day`).
- `.claude/commands/xong.md` bước đẩy brain: thêm dòng cho Mac. `CLAUDE.md` mục 7: 2 máy → 3 máy.
- `.gitignore`: bỏ qua 2 thư mục tải về khi test Video Download trong `Test Media/` (1,05 GB; video đã bị `*.mp4`
  chặn, còn lại là `.autocut-nghe.json` vô dụng khi thiếu video).
- Skill `adobe-cep-panel` mục 5: panel mới chỉ hiện sau khi tắt mở Premiere + `Get-Process -Name` mù với "(Beta)".

### Kiểm chứng (trên Windows, HOME giả trong scratchpad — KHÔNG đụng ~/.claude thật, KHÔNG đẩy brain thật)
- Chạy đủ: pull khớp GitHub, **756/756 file**, 9 package đủ node_modules, chép 3 file lệnh, brain khớp. Chạy lần 2: toàn DAT.
- Sao lưu brain: CLAUDE.md giả nội dung "cu" → giữ lại `CLAUDE.md.truoc-dong-bo-<giờ>`, bản mới = bản brain-repo (cmp).
- Script **tự bắt được 2 lỗi "báo đạt giả"** của chính nó, đã sửa:
  (1) git chết ("dubious ownership") → `ls-files` rỗng → báo "DAT 0/0". Nay: báo LOI.
  (2) `--day-brain` commit hỏng (thiếu user.email) nhưng push "thành công" (không có gì để push) → báo "Da day 306 file".
  Nay: quyết định bằng `git status`, sau push so `HEAD` = `origin/main`. Thử 3 ca trên bản sao bare cục bộ:
  thiếu user → LOI · chạy lại → đẩy được (30a8f03 → 99003d6, đúng 1 file) · không đổi gì → DAT.
- Chưa thử được: đường clone brain lần đầu qua mạng (repo private — cần đăng nhập GitHub trên Mac).

### Phiên bản
Không bump panel nào: thay đổi code duy nhất là `AiO Auto Short Viral` `cep.ts` + `package.json` — bản sửa lệch
phiên bản đã **cài lên Premiere lúc 11:22 dưới số 0.1.2** (md5 dist khớp, xem PROGRESS của panel). Repo = bản đang cài,
nên giữ 0.1.2 để số trên máy anh và số trong repo trùng nhau. Còn lại toàn tài liệu + script đồng bộ.


## [gop-cut-short] - 2026-09-21 15:37 (UTC+7) - Gộp Auto Cut Short vào Auto Short Viral · Guide Frame anh test ĐẠT · sửa số phiên bản Shot & Save

### Bối cảnh
Anh hỏi "app nào bán được" rồi "tổng bao nhiêu tool" (em đếm 14, 12 có code). Anh chốt:
*"Auto Short Viral và Auto Cut Short 2 cái này là một và giữ cái tên Auto Short Viral là chính"*
— đè quyết định 18/09 "giữ riêng hai sản phẩm". Cùng lúc: *"Auto Guideline Frame - anh test thấy okie rồi đó em"*.

### Đã làm
- `git mv` 2 file ghi chép của Cut Short (CLAUDE.md 95 dòng, PROGRESS.md 116 dòng — cả thư mục chỉ có 2 file này,
  chưa có code) sang `AiO Auto Short Viral/tai-lieu/cut-short-CLAUDE-cu.md` + `cut-short-PROGRESS-cu.md`, thêm dòng LƯU TRỮ đầu file.
- Bỏ `Release/AiO Auto Cut Short/` (chỉ có 2 file giữ chỗ) và `AiO Design System/AiO Auto Cut Short/` (0 file).
- Sửa ghi chép ở 4 file: `CLAUDE.md` gốc (bảng app dòng 10 + 14, bảng quyết định thêm dòng 21/09, gạch dòng 18/09,
  việc chờ bỏ "ranh giới hai tool"), `AiO Auto Short Viral/CLAUDE.md`, `AiO Auto Re-Frames/CLAUDE.md`, `TOOL_VERSION_TRACKER.md`.
  Cổng 8093 + ID `com.aiostudio.short` trả lại. Tổng tool 14 → 13.
- Guide Frame: bảng app dòng 7 → "✅ Anh test ĐẠT 21/09"; vẫn chưa có bộ cài.
- Shot & Save: bảng app ghi 0.4.17, thực tế package.json + bộ cài Release 16/09 là **0.5.5** → sửa.

### Kiểm chứng
- `ls` Build / Design System / Release: 0 thư mục tên "Cut Short".
- `git grep "Cut Short"` trên CLAUDE.md + tracker: chỉ còn các dòng ghi lịch sử/đã gộp.

### CHƯA làm (cố ý)
- Não hỏi–đáp cũ (`chiaDoan/timDoan/taoShorts` + host `rf_catShort/rf_ghepDoan`) vẫn nằm trong Re-Frames 0.6.0 —
  gỡ khỏi Re-Frames hay để nguyên là việc của anh quyết.

---

## [cua-vao-brain] - 2026-09-21 08:37 (UTC+7) - LẮP CỬA VÀO: hook SessionStart tự đọc PROGRESS.md đầu mỗi phiên

### Trạng thái hiện tại
- **21/09 11:14 — anh thử `/batdau` gõ tay** ở Auto Short Viral (phiên "Batdau"):
  Claude tóm đúng 0.1.2 · 222/0 · 253 ms/37 khối · 4,1 s gộp 4 khối · 6 mục dở chỗ
  khác · 4 việc chờ. Đối chiếu từng số với file: **khớp hết, 0 số bịa** (các số nằm
  dòng 25–33, trong 40 dòng script đưa). Hai chỗ chưa đạt: tóm **~20 dòng** thay vì
  3–5 như lệnh dặn; và **hook tự chạy CHƯA được thử** (anh gõ `/batdau` ngay câu
  đầu nên không tách được hook với lệnh tay). Chưa có lời chấm của anh.
- Hook `SessionStart` đã lắp ở `~/.claude/settings.json` (máy công ty DRT-G21).
  Hook `Stop` cũ **còn nguyên**, 12 quyền `allow` còn nguyên, JSON hợp lệ.
- Script `scripts/batdau/batdau.mjs` chạy **259 ms**, ra **850–3.744 ký tự**
  (~243–1.070 token) tuỳ panel. Thư mục không có gì → **0 byte** (đối chứng đạt).
- Lệnh `/batdau` gọi tay được ở **mọi** dự án (đã chép sang `~/.claude/commands`).
- `dong-bo-may.ps1` bước 4 đã chép script + cảnh báo nếu máy kia thiếu hook.
- ☠️ **Máy nhà chưa có gì** — phải chạy `dong-bo-may.ps1` rồi lắp hook bằng tay
  (script chép được, hook thì không: nó nằm ngoài repo).

### Bối cảnh
Anh Tiến 21/09: *"brain anh có xây rồi, có câu lệnh /xong luôn nhưng khi dùng
thực tế context chán lắm em"*. Anh chốt hướng **C** (làm cả A lắp cửa vào + B dọn
brain), và sửa phạm vi: **bỏ "5 commit git"**, thay bằng **git status** — nguyên
văn *"thường anh không có upload lên git thường xuyên đó em"*.

### Nguyên nhân thật (đo 21/09)
Mở Claude ở một panel con nạp sẵn **38.084 token** trước khi anh gõ chữ đầu:
`~/.claude/CLAUDE.md` 19.978 (52%, toàn bài học **sửa code**) · panel CLAUDE.md
8.565 · `AiO Studio/CLAUDE.md` 7.894 · `Production/CLAUDE.md` 1.159 · MEMORY.md 488.

Nhưng **`PROGRESS.md` không bao giờ được nạp** — Claude Code chỉ tự đọc file tên
đúng `CLAUDE.md` đi theo cây thư mục. Autocut 4.326 dòng, Transcripts 4.531 dòng
nằm im.

→ **Brain có cửa RA (`/xong` ghi rất đầy đủ) mà không có cửa VÀO.** Thứ nạp tự
động dạy Claude *đừng lặp lỗi cũ*; không có dòng nào nói *anh đang ở đâu*.

Đo thêm, cùng gốc:
- **13/31 ngăn nhớ RỖNG**, gồm đúng slug từng panel (`...AiO-Autocut` 0 file,
  `...AiO-Asset-Manager` 0 file). Mở Claude ở thư mục panel = trí nhớ trắng.
- **Slug lạc**: `AiO-Studio-AiO-Autocut` và `AiO-Studio-Build-and-UI-Design-AiO-Autocut`
  — hai ngăn cho cùng một panel (đường dẫn trước/sau lần dời 14/08), cả hai 0 file.
- **`worktrees/` còn 652 file / 36,8 MB** từ 01/09, nhân đôi 13 file `CLAUDE.md`.
- **`Thinksmart Tool` không có `PROGRESS.md`** — hook `Stop` không bắt được vì nó
  chỉ canh `src, client/src, app, lib, host, scripts, server`; Thinksmart dùng `public/`.

### Thay đổi
| File | Làm gì |
|---|---|
| `scripts/batdau/batdau.mjs` | **MỚI** — đọc mục mới nhất PROGRESS.md + git status + việc chờ của đúng app |
| `scripts/batdau/README.md` | **MỚI** — số đo, 3 bẫy đã vấp, chỗ lắp |
| `.claude/commands/batdau.md` | **MỚI** — lệnh `/batdau` gọi tay |
| `scripts/dong-bo-may.ps1` | bước 4 chép thêm `batdau.mjs`, cảnh báo máy thiếu hook |
| `~/.claude/settings.json` | thêm hook `SessionStart` (sao lưu: `settings.json.truoc-batdau-2026-09-21`) |
| `PROGRESS.md` (file này) | **MỚI** — xoá việc chờ *"PROGRESS.md gốc repo: chưa có"* |

### Ba bẫy vấp khi viết script — đều do ĐỌC KẾT QUẢ mới thấy, số đo không nói
1. **Regex `/Vi[eê]c đang CHỜ/` mù với chính chữ "Việc"** — "ệ" là ê + dấu nặng,
   một ký tự khác, không nằm trong `[eê]`. Autocut ra **0 việc chờ** trong khi
   `CLAUDE.md` có 2. Sửa: bỏ dấu bằng NFD rồi so khớp — không còn gì để đoán (`5as`).
2. **`git status --porcelain` luôn trả đường dẫn từ GỐC REPO** — đứng ở Autocut mà
   thấy 19 file của `Release/`, `design-system/`. Sửa: pathspec `.` cho thư mục
   hiện tại, đếm riêng phần còn lại → Autocut còn **1 file + 24 chỗ khác**.
3. **Khớp app bằng `includes` bắt nhầm** — `"autocutshort".includes("autocut")` =
   đúng, nên Autocut **nuốt việc của Auto Cut Short**. Sửa theo `5t`: bỏ hẳn
   `includes`, chỉ khớp CHÍNH XÁC, tên viết tắt ghi tường minh ở `BIET_DANH` (`5ae`).
4. Vấp lại `5ax`: `node -e` với `\\` trong bash bị gộp — kiểm JSON phải viết lại
   không dùng backslash.

### Kiểm chứng bằng số
- Hook chạy **259 ms** trong Git Bash, đúng lệnh hook gọi.
- `settings.json` sau khi sửa: **JSON hợp lệ**, `Stop` còn, `allow` vẫn 12 mục.
- **Đối chứng rỗng**: chạy ở `/tmp` → **0 byte** (không ồn ở thư mục không liên quan).
- **Đối chứng gán đúng app**: việc *"Cài thử máy sạch"* (ô ghi 3 app) hiện ở
  **đúng 3/3** app; Autocut **không còn** nuốt việc của Auto Cut Short.
- Chạy đủ **13/13 panel**, không panel nào lỗi.
- PROGRESS.md **tươi hơn code ở 11/11 panel** → nguồn đáng tin để nạp.

### CHƯA làm (giai đoạn B, anh đã chốt nhưng chưa tới)
- Cắt `~/.claude/CLAUDE.md` 1.145 dòng → ~150 dòng, đẩy 62 bài học thành skill.
  **Phải đo A có ăn không trước** (anh chọn đúng phương án đó), và phải commit
  `brain-repo` làm mốc trước khi cắt (`3c`).
- Dọn `worktrees/` 652 file · gộp 2 slug lạc của Autocut · `PROGRESS.md` cho
  Thinksmart Tool · nới danh sách thư mục hook `Stop` canh (thiếu `public/`, `ui/`).
- ☠️ `~/.claude/settings.json` có **token n8n JWT** và **Google `client_secret`**
  nằm thẳng trong `permissions.allow` — chưa xử, chờ anh quyết.
