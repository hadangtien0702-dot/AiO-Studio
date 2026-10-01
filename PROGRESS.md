# AiO Studio (gốc repo) — Nhật ký

> Nhật ký cho thứ nằm ở **gốc repo**: `scripts/`, `.claude/`, `CLAUDE.md`, cấu
> trúc thư mục. Việc của từng panel ghi ở `PROGRESS.md` **trong thư mục panel đó**.
>
> Lập 21/09/2026 — trước đó mục 8 `CLAUDE.md` ghi *"PROGRESS.md gốc repo | Chưa có"*.

## [web-premiere] - 2026-10-01 19:31 (UTC+7) - Trang bộ tool Premiere (nháp 3) LÊN LIVE ở aio-shotsave.vercel.app/premiere/

- **Bối cảnh:** anh: *"aio-shotsave.vercel.app/premiere/ đưa thằng này lên http://127.0.0.1:8124/premiere/?v=3 đi em lẹ lên"*.
  Trước đó `/premiere/` trên live trả 404 (thư mục chưa có trong web).
- **Đã làm:** chép nguyên văn `Website/Nhap web ShotSave/premiere-nhap-3.html` thành
  `Website/AiO ShotSave Web/premiere/index.html`, không sửa chữ nào. Bản ở cổng 8124, file nháp 3 và file mới cùng md5
  `83d975d9` (154.691 byte). Trang chỉ gọi 3 đường dẫn nội bộ (`../`, `../legal.html#privacy`, `../legal.html#terms`),
  font Google và GSAP 3.13.0 từ cdnjs, không có ảnh hay file phụ phải chép kèm.
- **Cách push:** máy công ty đang giữ 6 commit Shot & Save 0.8.0 chưa được push (luật 01/10, chờ anh test) nên dựng
  commit trên đúng `origin/main` trong một worktree tạm rồi đẩy riêng: `12609a2..fe54c7d`, 1 file. Sau đó gộp về `main` trên máy.
- **Kiểm chứng trên LIVE:**
  - md5 live = md5 blob git `fe54c7d` = `83d975d9`; `/premiere`, `/premiere/`, `/premiere/index.html` đều 200 (154.691 byte).
    Ngay sau deploy `/premiere` (không gạch cuối) trả 404 một lần, đo lại vài giây sau là 200.
  - Trang Shot & Save `/` 200 (271.841 byte), `/legal.html` 200, `/.env.local` 404.
  - Chrome thật qua Playwright, 1440×900, lăn chuột thật: vào section ra clip 01, 5 nấc xuống = 02, 03, 04, 05, 06,
    2 nấc lên = 05, 04. GSAP 3.13.0 + ScrollTrigger nạp được, font Inter nạp được, 0 lỗi console, 0 request hỏng, tràn ngang 0.
  - Đo lại lần 2 lúc 19:32, đủ cả dải, hai khổ 1440×900 và 2048×1030: 12 nấc xuống = clip 01 → 12 (12/12), 3 nấc lên =
    11, 10, 9; 0 lỗi console, 0 request hỏng, tràn ngang 0; 3 link `../` trỏ đúng `/`, `/legal.html#terms`, `/legal.html#privacy`.
- **CHƯA kiểm trên live:** điện thoại thật, Safari, tiếng Việt, nền sáng, phím J K L, kéo ngang (các mục này đã đo trên
  bản ở máy lúc 16:20, cùng file từng byte, nhưng chưa đo lại trên live).
- **Còn hở:**
  - Ô email "Báo tôi khi mở bán" CHƯA nối lưu. Bấm gửi chỉ hiện câu *"Bản nháp: chưa nối gửi, chưa lưu gì cả."*
    Khách thật để lại email lúc này là mất. Cần anh chốt lưu vào đâu rồi mới nối.
  - Trang Shot & Save (`/`) chưa có link sang `/premiere/`. Chưa có trang chủ chung (quyết định 25/09).
  - Sửa trang về sau: sửa `premiere-nhap-3.html` rồi chép đè sang `premiere/index.html` (hai file phải cùng md5), và chạy
    lại `tao-artifact.cjs` nếu muốn bản xem trên điện thoại khớp.
    Sửa 19:3x: trên Windows đừng so md5 hai file TRONG MÁY. Sau khi gộp về máy, `premiere/index.html` được git chép ra
    kiểu xuống dòng Windows nên md5 thành `d3a4f861` dù nội dung y hệt. So bằng bản trong git:
    `git show HEAD:"Website/AiO ShotSave Web/premiere/index.html" | md5sum` (ra `83d975d9`, khớp live).

## [web-premiere] - 2026-10-01 16:20 (UTC+7) - Trang bộ tool Premiere NHÁP 3: sân khấu thành TIMELINE PREMIERE TRÔI NGANG

> Ghi ở sổ gốc vì trang này là web chung AiO Studio (không phải Shot & Save), và `AiO Shotandsave/PROGRESS.md` đang có
> phiên khác sửa dở (0.8.0, ghi tới 16:07). Mục nháp 2 (30/09 00:39) nằm trong `AiO Shotandsave/PROGRESS.md`.

- **Bối cảnh:** anh mở `http://127.0.0.1:8124/premiere/`, chụp dải 12 clip cuối sân khấu (đầu đọc kẹt ở `00:00:03:09`):
  *"anh muốn ở chỗ này khi scroll thì section sang ngang đi em hiện tại nó đứng yên à"*, rồi nhắn thêm *"đặc biệt phải
  Creative hơn nữa đó em em ơi section phải đặc biệt"*.
- **Nguyên nhân gốc của "đứng yên" (đã đo trước khi sửa):** lăn chuột THẬT trên bản nháp 2 ở 2048×1030: 16 nấc xuống +
  6 nấc lên + 6 chùm 3 nấc = **0/28 lần qua được cảnh**, kẹt ở cảnh 01 (tiến độ 0,0559 = đúng `00:00:03:09` trong ảnh anh).
  Gốc: 30/09 em đổi snap thành "hút về mốc GẦN VỊ TRÍ nhất" (để nhảy thẳng không hút sai cảnh) → mỗi nấc 100 px bị kéo
  ngược về chỗ cũ (phải lăn liền > 374 px mới qua). Bài đo 30/09 chỉ NHẢY `scrollTo` tới đúng mốc, không lăn chuột như
  người dùng → "12/12 cảnh đạt" là đo trên thao tác không ai làm. Cùng lỗi: cuộn chậm không RA được khỏi section ở hai đầu.
- **Đã làm (bản nháp 3):**
  - Sân khấu = một timeline Premiere: dãy ngang `[thẻ tiêu đề][12 clip][mốc Out "}"]`, cuộn dọc → cả dãy trượt ngang dưới
    đầu đọc cố định ở giữa. Mỗi clip = thước timecode | gáy tên dọc | cột chữ (số clip, nhãn, tên, mô tả, số thứ tự viền
    cỡ lớn, số đo) | cảnh diễn (12 cảnh cũ giữ nguyên) | dải âm thanh đầy dần theo tiến độ cảnh diễn.
  - Clip hai bên ló ra, nghiêng 7°, nhỏ 6%, mờ 55%; chữ trong clip trượt lệch tốc độ (tên 90 px, mô tả 56 px…), chữ nền
    trôi tiếp trong lúc cảnh diễn; thẻ vào hơi lệch phải rồi trôi về giữa → không lúc nào đứng yên. JS đặt 3 biến trên
    từng clip: `--d` (lệch bao nhiêu clip), `--a`, `--ap`.
  - Chữ của clip NHÂN BẢN từ lưới thẻ `#toolGrid` (giữ `data-i`) → một nguồn chữ, đổi ngôn ngữ tự đổi.
  - Snap: `snapTo: [0, 12 mốc, 1], inertia: false` (hút THEO HƯỚNG cuộn, có mốc 0 và 1 để ra được khỏi section).
  - Điều khiển: nút Lùi / Phát / Tới, phím J K L Space ← →, kéo ngang bằng chuột hoặc ngón tay, lăn ngang trackpad, dải 12
    clip thu nhỏ = thanh tua (chạm / rê). Link trong trang tự cuộn bằng GSAP (CSS `scroll-behavior:smooth` chỉ còn cho bản tĩnh).
- **File:** `Website/Nhap web ShotSave/premiere-nhap-3.html` (1.736 dòng, md5 `83d975d9`, = bản đang chạy ở scratchpad
  `…/premiere/index.html`; nháp 2 giữ ở `premiere-nhap-2.html` và `index-v2-30-09.html`). Bài đo: scratchpad phiên cũ
  `do-lan.mjs` (đo trước khi sửa), `do-v3.mjs` (lan | canh | phim | vi | mob), `do-v3b.mjs`, `do-duphong.mjs`.
- **Kiểm chứng (Chrome thật qua Playwright, thao tác thật):**
  - Lăn chuột 2048×1030 và 1440×900: mỗi nấc = đúng 1 clip (01→12 rồi ra khỏi section); lăn ngược lùi từng clip; chùm 3
    nấc = 1 clip; vuốt nhanh 20 nấc dừng ở clip 08 (k nguyên); từ clip 1 lăn lên 2 nấc là ra khỏi section. Trước: 0/28.
  - 12/12 clip vào giữa (lệch ≤ 1 px), đúng tên, cảnh diễn chạy hết (`--ap` 1), 0 phần tử lọt ngoài ô diễn, tiêu đề 0 px tràn.
    Ô diễn: 848×683 (u 9,14 px) ở 1440×900; 1218×813 (u 13,1 px) ở 2048×1030 (nháp 2: 10,86 / 13,3 px).
  - Phím + nút: L×3 → 03, J → 02, → → 03, clip thu nhỏ 7 → 07, Lùi → 06, Tới → 07, Phát từ 07 chạy 9 s → 10 (nhịp
    2,4 s vào + diễn, nghỉ 1,4 s; nhịp đầu 1,6 + 1,1 s ra 4 clip / 9 s, không kịp xem) rồi bấm lại là dừng đứng yên,
    Space 6,5 s 01→03 / K dừng, kéo trái 420 px 03→04, kéo phải 04→03, lăn ngang 03→04, thanh tua rê 2→9 = 09, bấm
    không kéo không đổi cảnh, link FAQ / Why / Tools tới đúng chỗ (top 64 px), không bị hút ngược.
  - Điện thoại 390×844 (sự kiện chạm thật): vuốt dọc 14 lần = 01→12 rồi ra; vuốt ngang trái 03→04, phải →03; chạm nút Tới;
    tràn ngang 0; nút 44×44.
  - Tiếng Việt: 0 chuỗi sót khi về EN (kể cả aria-label), 0 gạch dài; tiêu đề mỗi câu một dòng ở 1440 / 2048 / 390 / 820.
  - Tương phản 13 loại chữ mới: thấp nhất 3,51:1 (chữ 40 px đậm, cần 3), chữ nhỏ thấp nhất 5,94:1.
  - Trượt 1→4 lấy mẫu 206 khung: header lệch 0 px, khung ghim lệch tối đa 0,44 px, p50 16,7 ms, p95 16,8 ms, 2 khung > 33 ms.
  - Màn thấp 1366×650, 1280×600, 1024×700: số đo nằm trong thẻ (23–30 px), cột chữ không tràn.
  - Dự phòng: `prefers-reduced-motion` và chặn CDN GSAP → sân khấu ẩn, lưới 12 thẻ hiện, 0 lỗi JS. 0 lỗi JS ở mọi lượt.
- **Bẫy đo vấp trong buổi:** `Input.synthesizeScrollGesture` kiểu touch KHÔNG cuộn được trang nào trong Chrome không đầu
  (y đứng 0 cả trên trang đối chứng) → dùng chuỗi `Input.dispatchTouchEvent`. Ảnh chụp giữa lúc đang cuộn lệch 11–13 px
  (header + khung ghim cùng lệch) là lỗi của phép chụp, đo trong trang ra 0 / 0,44 px. `st.isActive` = false ngay tại mốc
  đầu (tiến độ 0) → phím L không ăn ở thẻ tiêu đề → tự kiểm theo `scrollY`. Heredoc nuốt `\s` trong regex (bài `5ax`),
  bắt nhờ grep lại dòng vừa sửa.
- **CHƯA kiểm:** iPhone / Safari thật; trackpad thật (mới giả lập `deltaX`); máy yếu; trình đọc màn hình.
- **16:33 anh xem nháp 3: *"quá đẹp em push lên git cho a đi em"*.** Lúc đó `main` trên máy = `dd0716c` "Shot and Save 0.8.0
  (CHUA PUSH, cho anh test)" của phiên khác + commit web của em nằm TRÊN nó → `git push` thường sẽ đẩy luôn bản 0.8.0 đang
  test lên repo public (trái luật anh chốt 01/10: test xong hết mới push). Cách đã làm, KHÔNG đụng thư mục làm việc và
  vùng chờ commit của phiên kia: dựng một commit mới = `origin/main` + đúng phần thay đổi của em (index tạm, `git read-tree`
  → `git apply --cached` → `git commit-tree`), push commit đó lên `origin/main`, rồi gộp nó vào `main` trên máy bằng một
  merge commit CÙNG CÂY (`git update-ref` có so mốc cũ). Kết quả: GitHub có trang web, chưa có 0.8.0; `main` trên máy đi
  trước GitHub đúng phần 0.8.0, không lệch nhánh. Phiên Shot & Save push sau thì không phải làm gì thêm.
- **19:13–19:23 anh: *"gửi cho anh bản shot and save mới nhất và bản cho PR mới nhất nha"*.** Câu có ≥ 2 cách hiểu (bộ
  cài hay link web; 0.7.9 đã đóng gói hay 0.8.0 đang test) → hỏi bằng bảng chọn, anh chọn **"Link trang web"** +
  **"0.8.0 đang test"**. Đã làm: (1) web Shot & Save đang chạy thật `https://aio-shotsave.vercel.app` (HTTP 200, md5 live =
  md5 git); (2) nháp 3 đăng thành trang riêng tư `https://claude.ai/artifact/RKgs9dfNu3U8sjM8z1MVV9` để mở được trên điện
  thoại. Bản đăng sinh từ `premiere-nhap-3.html` bằng `Website/Nhap web ShotSave/tao-artifact.cjs` (nơi đăng tự bọc
  `<html><head><body>`; script đổi đúng 5 chỗ: header chừa vùng tai thỏ, phần đệm khung ghim, `color-scheme:dark`, 3 link
  `../` thành địa chỉ đầy đủ, sáng/tối theo nơi đăng). Kiểm bản bọc vỏ trên máy: lăn 3 nấc → clip 03, tràn ngang 0 ở
  1440 và 390, nguồn ngoài chỉ có Google Fonts + cdnjs. CHƯA mở kiểm trên chính link đã đăng. (3) bộ cài Shot & Save
  0.8.0: xem `AiO Shotandsave/PROGRESS.md` dòng 19:22.
- **[CHỜ ANH]** nháp 3 mới là file nháp trong repo (`Website/Nhap web ShotSave/`, ngoài thư mục web, KHÔNG lên Vercel):
  có muốn đưa lên web thật (`/premiere/`) không. Sửa trang thì sửa `premiere-nhap-3.html` rồi chạy lại `tao-artifact.cjs`
  và đăng đè lên link trên (truyền `url`), đừng sửa tay bản đăng.

## [congty] - 2026-09-23 10:12 (UTC+7) - Lệnh /congty, gộp vào /xong bước 2f

- **Bối cảnh:** anh cần một lệnh để gắn sản phẩm vào Trung tâm Điều hành (artifact
  `MwhxaNXJNGMrUwKtUDW9Wn`, sổ công ty dựng 21/09). Viết `/congty` xong thì anh bảo
  *"gộp /congty vào /xong luôn đi em"*.
- **Đã làm:** `.claude/commands/congty.md` (sổ luật: đọc phiên bản từ repo, ghi
  `app` + `hoatdong loai:'app'` + `meta`, mã 9 phòng, luật mỗi phòng một việc, cấm
  đưa bí mật lên trang) · `xong.md` thêm **bước 2f** gọi theo sổ luật đó ·
  `dong-bo-may.ps1` / `dong-bo-mac.sh` đổi nhãn (vốn đã chép mọi `*.md`).
- **Kiểm:** bản repo = bản `~/.claude/commands` (cmp 2/2). Thử bước 2f đọc thật:
  Video Download repo 0.2.2 = sổ 0.2.2 → không cần ghi. **[CHO]** chưa có lần 2f
  ghi THẬT (dữ liệu khác nhau) — lần `/xong` đầu có bản mới thì mở trang kiểm.

## [panel-tong-2.0.0] - 2026-09-22 14:17 (UTC+7) - Panel tổng AiO Studio 2.0.0 viết xong, nối vào Premiere · sửa .gitignore

### Trạng thái hiện tại (phiên sau đọc đầu tiên)
- [CHỜ ANH] tắt/mở Premiere → Window → Extensions → **AiO Studio**; rồi đo thật qua cổng 8101. Chi tiết + số đo: `Build and UI Design/AiO WELCOME/PROGRESS.md`.
- Chưa push (chờ anh bảo / `/xong`).

### Gốc repo đổi gì
- `.gitignore`: thêm `!/Build and UI Design/AiO WELCOME/dist/` — dòng cũ trỏ `AiO WELCOME Page/dist/` (không tồn tại) nên Welcome Hub 1.5.0 (44 KB) **chưa từng lên git**; kiểm `git check-ignore` → hub.js không còn bị chặn.
- `CLAUDE.md` bảng app dòng 5 (WELCOME → panel tổng `com.aiostudio.hub` · 8101) + việc chờ; `TOOL_VERSION_TRACKER.md` dòng 5.

## [hub-va-mac] - 2026-09-21 17:4x (UTC+7) - Panel tổng: chốt kiểu BỆ PHÓNG + 3 bản vẽ chờ chọn · Mac: KHÔNG mua Apple Developer

### Trạng thái hiện tại (phiên sau đọc đầu tiên)
- ✅ 21/09 18:0x anh CHỐT giao diện panel tổng: **2 dạng** — thu hẹp = thanh icon (dọc / ngang), mở rộng = lưới thẻ A
  (380px 2 cột · 1280px 4 cột); bỏ B. Bản vẽ trang "Bản 2 · hai dạng" (Bản 1 giữ ở trang riêng): https://claude.ai/artifact/GmdDjRe5oRJuNBr3uAbubN
- [CHỜ ANH] Duyệt ngưỡng đổi dạng (em đề xuất: hẹp < ~340px hoặc thấp < ~260px → thanh icon) rồi bấm "làm" mới code.
- [CHỜ ANH] Đổi Music → "Keynote": Keynote làm việc gì (xem mục [ba-may-mac]).
- Tối 21/09 anh làm trên Mac: lần đầu chạy `bash scripts/dong-bo-mac.sh --cai-them` (chưa từng chạy trên Mac thật).

### Bối cảnh
Anh gửi ảnh MFinder (app Mac có hộp "A new version… Install Update" của Sparkle) — *"trên mac anh muốn app mình được cài như thế này"* —
và *"làm ra một panel tổng để dễ dàng mở tool… quản lí toàn bộ tool qua panel tổng… nhìn cho đẹp và chuyên nghiệp"*.

### Đo trước khi đề xuất
- **Đã có sẵn** "AiO Welcome Hub" (`com.aio.welcome` 1.5.0, 03/08) — nhưng: CHƯA cài (`CEP/extensions` không có), liệt kê **7/12** tool,
  **7/7 nút gọi sai ID** (`com.aio.autocut` ≠ ID thật `com.aiostudio.autocut`) → bấm không mở được gì; cửa sổ Modeless 1020×720.
- Mở panel khác từ panel: `requestOpenExtension` — skill adobe-cep-panel đã ghi chạy được (panel đích lên sau ~1 s).
- Thị trường: AutoCut = MỘT panel có menu 10 tool (autocut.com). Mac tự cập nhật (Squirrel.Mac/Sparkle) **bắt buộc** ký Developer ID +
  notarize (tài liệu Electron + electron-builder) → 99 USD/năm. Shot & Save hiện KHÔNG có dòng code cập nhật nào, `hardenedRuntime: false`.

### Anh chốt (bảng hỏi 3 câu)
1. Panel tổng = **A. Bệ phóng** (không gộp 11 panel thành 1). 2. Mac = **Không mua** 99 USD/năm. 3. Giao diện = **em vẽ nháp để anh chọn**.
Ghi vào bảng quyết định mục 3 `CLAUDE.md` kèm lý do.

### Bản vẽ
6 artboard (A 380/300 · B 380/300 · C 72/300), dữ liệu thật: phiên bản đọc từ manifest 21/09, trạng thái cài đọc từ `CEP/extensions`
máy công ty (10 panel + Shot & Save app + Organize "Sắp có"). Logo thật `AiO Logo Mark.png` của website. Icon Lucide nét 1.9 (luật icon AiO),
0 emoji, thẻ mở/đóng khớp 6/6 file. **Đã tự nhìn**: chụp headless Chrome cả 6 bản cạnh nhau — 12 tool hiện đủ, không tràn ở 300px.
Bộ sinh: `scratchpad/hub/taoban.mjs` (ngoài repo).


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
