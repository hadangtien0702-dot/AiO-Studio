# AiO Video Download — nhật ký

> Mục mới trên cùng. Giờ lấy bằng lệnh `date`, không suy từ mục trước.

## Trạng thái hiện tại (21/09/2026 18:48)

- **0.2.2 ĐÃ CÀI máy công ty (18:4x)**: sửa 3 lỗi của 0.2.1 + 1 lỗi do chính bản vá
  sinh ra, tất cả do **Codex (OpenAI) soát chéo** bắt được — lượt thử đầu của "QA khác
  hãng" (AI Company OS, xem `AiO Studio/CLAUDE.md` mục 3 ngày 21/09).
- Cài đặt đang để cookie **Chrome** (file đổi 14:54, không phải Claude) → đọc link báo
  "Không đọc được cookie của Chrome" (đo 18:4x). Chưa đổi — cài đặt của anh.
- 0.2.1: 15:0x anh dùng: *"tạm thời anh chưa thấy lỗi — okie rồi đó em"*.
- **Việc kế tiếp (chờ anh chọn):** đóng gói bộ cài vào `Release/AiO Video Download/win/`.
- **[CHO]** nhánh "lỗi lạ → tự cập nhật → tự thử lại" chưa đo (không tạo được lỗi
  `khac` khi engine đã mới nhất) — gặp lỗi lạ thật thì soi `lan-kiem.json`.

- **21/09 14:51 anh Tiến tự test 0.2.0 trên máy công ty: *"anh test thấy ổn mà em"*.**
  Đây là lượt anh TỰ THỬ panel, chưa phải dùng trên bài dựng thật (mốc MVP cuối
  vẫn ⏳). Anh không báo lỗi nào.
- **0.2.0 ĐÃ CÀI máy công ty**.
  Giao diện hướng A (anh chọn) + responsive 3 mức (<560 dọc · 560–879 thẻ ngang ·
  ≥880 hai cột). Đã commit + push 21/09; chưa đóng gói bộ cài.
- **[CHO] Chờ đo:** lượt thử Shorts 1080p TRÊN PANEL không ra kết quả trong 40 s (lý do
  chưa đo; cùng tham số chạy ngoài panel thì đọc được 3,5 s, 46 định dạng).

---

## [0.2.2] 2026-09-21 18:40–18:48 — Codex soát chéo bản 0.2.1: 3 lỗi thật + 1 lỗi do bản vá

**Bối cảnh:** anh muốn áp "AI Company OS" (artifact LYDRzb8efWYwHKf2AN3hZJ) vào AiO
Studio, chọn *"ghép vào để anh biết thật sự ra sao"*. Ghế QA khác hãng: **Codex CLI**
(`codex exec --sandbox read-only`, đã đăng nhập sẵn). Gemini CLI **chết**:
`IneligibleTierError … migrate to Antigravity` (đo 18:3x).

**Lượt 1 (0.2.1, 81 s, 55.064 token Codex) — 3 lỗi, Claude đọc lại code: cả 3 THẬT:**
1. (cao) Tự thử lại không kiểm lượt tải đang chạy → người dùng đã bấm "Thử lại" thì
   thành HAI lượt cùng ghi một file, nút Dừng chỉ giữ một.
2. (vừa) Lượt lỗi chạy lúc đang `-U` (dùng bản đóng gói cũ) → `moi=false` → không thử lại
   dù bản sao tốt đang có.
3. (vừa) `_phienBanGoi` rỗng 5 s đầu → nhận bản sao AppData CŨ HƠN bản vừa cài kèm panel.

**Lượt 2 (soát bản vá, 78 s, 43.267 token):** lỗi 1 hết; 2 và 3 **một phần** (lấy exe lúc
NHẬN lỗi chứ không phải lúc CHẠY; đọc link không chờ `--version`); và **lỗi MỚI do Claude**:
`useRef(phienBanEngine())` đánh giá đối số MỖI lần render → khi bản sao mới hơn, mỗi
render (nhịp hỏi host 2 s) sinh một tiến trình `yt-dlp --version`.

**Sửa gốc:** `docBanGoi()` chạy `--version` đúng 1 lần/phiên, đọc và tải đều `await` nó;
`_exeLanCuoi` ghi lúc SPAWN; thử lại chỉ khi `trangThai === 'loi'` và (có bản mới hoặc
exe giờ khác exe đã lỗi); bỏ lời gọi trong render. ☠️ Lúc sửa dính lại bẫy `5ax`:
regex viết qua heredoc mất `\` thành `/^d{4}.d{2}.d{2}/` (không bao giờ khớp) — sửa
bằng công cụ Edit.

**Đo trên panel thật (8098):**
| Phép thử | Kết quả |
|---|---|
| Bản sao ghi 2026.07.04 (cũ hơn gói 08.19), dán link 3 s sau khi mở | 3/3 mẫu tiến trình = **bản đóng gói** |
| Đối chứng: bản sao ghi 2026.09.99 | 3/3 mẫu = **bản sao AppData** (+2 mẫu `--version` bản gói) |
| Panel nằm yên 12 s | **0** tiến trình yt-dlp ở cả 8 lần đếm |
| Mở lại trong 24 giờ | `lan-kiem.json` không đổi (14:58:00) |
| `tsc -b` · `kiem-chu.mjs` | sạch · 89/0 |
`engine.json` đã trả về nguyên bản sau khi thử.

**[CHO]** chưa đo: nhánh lỗi lạ → thử lại (vẫn không tạo được lỗi `khac` thật).

---

## [0.2.1] 2026-09-21 14:52–14:59 — engine tự cập nhật, không còn nút

**Anh Tiến (ảnh chụp menu Cài đặt):** *"cái này mình ko show cho người dùng — có
engine mới nhất tự động cài và cập nhật luôn đi e"*.

**Đã sửa:**
- Bỏ khối "Engine tải · phiên bản · nút Cập nhật" khỏi menu Cài đặt, bỏ câu gợi ý
  "mở Cài đặt → Cập nhật engine" ở lỗi lạ, bỏ 8 chuỗi song ngữ không còn dùng.
- `tuCapNhatEngine()` (ytdlp.ts) chạy ngầm ở 2 lúc: (1) mở panel + 5 s, tối đa
  1 lần/24 giờ (mốc `lan-kiem.json`, ghi cả khi thất bại để mất mạng không thử lại
  mỗi lần mở); bỏ qua nếu đang tải. (2) Đọc/tải gặp lỗi `khac` → ép cập nhật; có
  bản mới và người dùng vẫn ở đúng link đó → tự thử lại 1 lần/link.
- Trong lúc `-U` đang thay exe bản sao, `duongYtDlp()` dùng bản đóng gói
  (cờ `_dangCapNhat`) — tránh bắt đầu tải bằng một exe đang bị ghi dở.

**Kiểm chứng trên panel thật (cổng 8098):**
| Phép thử | Kết quả |
|---|---|
| Menu Cài đặt | chỉ còn Cookie; nhãn nút "Cài đặt: cookie trình duyệt"; `v0.2.1` |
| Mở panel lần đầu | `lan-kiem.json` ghi lúc 14:56:50, ok, 2026.08.19 (đã mới nhất) |
| Mở lại trong 24 giờ | 20 s sau: 3 file trong thư mục engine không đổi giờ sửa → bỏ qua đúng |
| Engine cũ | hạ bản sao về 2026.07.04, xoá mốc, mở lại panel → 15 s sau bản sao = **2026.08.19**, không hiện gì trên giao diện |
| `kiem-chu.mjs` · `tsc -b` | 89 khoá, thiếu 0 · sạch |

**CHƯA đo:** nhánh (2) "lỗi lạ → cập nhật → tự thử lại" — không tạo được lỗi
`khac` thật khi engine đã là bản mới nhất. Chưa tải lại một video sau khi sửa
(luồng đọc/tải không bị đổi, chỉ thêm một lời gọi ở nhánh lỗi).

---

## [0.2.0] 2026-09-21 14:10–14:43 — soi lại code mới (8 agent), responsive, 2 lỗi dùng chung

**Anh Tiến giữa buổi:** *"phần này em để trống làm gì … thiết kế responsive"* —
khung ảnh 16:9 có `max-height:260px` → Chromium chuyển thành max-width → chừa
khoảng trống bên phải khi panel rộng. Sửa: bỏ max-height, 3 mức responsive.
Đo 300/420/666/1000 px: tràn ngang 0 px ở cả 4, ảnh lấp kín thẻ.

**Lỗi lớn do soi code bắt (đã đo trên Premiere thật):**
1. ☠️ `getHostInfo` là hàm TOÀN CỤC 8 panel cùng định nghĩa trong MỘT engine
   ExtendScript; 0.2.0 đổi nó thành 3 trường → panel khác đọc nhầm. Đã trả về
   2 trường như cũ; Video Download dùng `vd_thongTinHost()` riêng. Đo:
   `getHostInfo()` = `27.0.0|Test3_1.prproj`.
2. ☠️ ExtendScript `new File()` VÀ `importFiles` GIẢI MÃ `%XX` trong đường dẫn:
   `100%Beef` → `100?ef`, nhập thì bật hộp modal "File Import Failure" (đã bật thật
   trong project thử, em bấm OK). Sửa: tải đổi `%`→`％` trong tên
   (`--replace-in-metadata`), host không gọi importFiles khi còn `%`.
3. Video dọc: `[height<=1080]` ra 480×854 → đổi `-S res:N` (đo: 1080×1920).
4. Dừng để lại `_MEI` 22,7 MB/lần trong %TEMP% → giết tiến trình CON trước
   (đo 0/3 sót, bản cũ 1/1). Link kênh lớn 75 s → `-I :2` (1,6 s).
5. Thêm: vòng hỏi gộp một lệnh, dấu hiệu theo file "Trong project", % tiến độ
   không bị cắt ở 300px, vòng focus đặc, radio đi bằng phím mũi tên, dichLoi bỏ
   tiền tố `[extractor] id:` (9/9 câu lỗi đúng).

**Vòng cuối trên panel thật (project thử riêng):** Dừng ở 3% → 0 file mới còn
lại, 2,1 s; `_MEI` trong %TEMP% 2 → 2 (không thêm). Shorts: xem "Chờ đo" ở trên.

---

## [0.2.0 — dở] 2026-09-21 13:55 — "Mở thư mục không được", "Đã vào project là ảo", làm lại UI

**Bối cảnh.** Anh Tiến gửi ảnh panel 0.1.0: *"làm lại UI … chưa đẹp"*,
*"bấm mở thư mục không được"*, *"nút Đã vào project là Ảo"*, *"kiểm tra lại
toàn bộ"*. Soi toàn bộ mã bằng 4 agent + 4 agent phản biện: 46 phát hiện, 33
chắc chắn đúng, 13 có thể, 0 bị bác (bảng đầy đủ trong scratchpad phiên).

**Nguyên nhân thật (đã đo):**

1. **"Mở thư mục" — gốc là `windowsHide: true` trên explorer.exe.** Explorer
   TẠO CỬA SỔ ẨN. Máy anh có **9 cửa sổ Explorer vô hình** (9 tiến trình
   ~185 MB, tổng **1.666 MB** cạnh Premiere) từ 9 lần bấm 13:11–13:16. Đã
   `Quit()` đúng 9 cửa sổ ẩn → 0, không đụng cửa sổ hiện / shell chính.
   ☠️ Đoạn PowerShell "kéo lên trước" của 0.1.0 **chưa từng chạy**:
   JSON.stringify nhân đôi `\`, PowerShell không giải mã → so
   `file:///e://2026//…` với `file:///E:/2026/…` → 0/9 khớp. Tức số đo 08/09
   "foreground = File Explorer" ghi ở mục 0.1.0 bên dưới **không thể** đến từ
   đoạn code đó — ghi đính chính ở đây.
   Cộng thêm: 5/6 mục lịch sử trỏ file test trong Temp phiên 08/09 **đã mất**.
2. **"Đã vào project" — cờ `daNhap:'roi'` LƯU CỨNG ra file lịch sử**, không
   gắn project nào, không hỏi lại Premiere, và khoá luôn nút. 5/6 mục mang
   cờ từ project test `AiO-VD-test_1` trong khi anh mở `Test3_1`.
3. **Nút "Đổi" mở `Folder.selectDialog` trong ExtendScript** = hộp modal chặn
   MỌI evalScript của mọi panel AiO. Đo: hộp mở từ 13:16 tới 13:45, `1+1` hết
   giờ 8 s; panel vẫn đẩy thêm lệnh hỏi project mỗi 2 s. Em bấm Cancel hộp
   (không chọn gì) để đo tiếp.

**Đo engine trước khi sửa (tải thử video 1 giây vào scratchpad):**

| Đo | Kết quả |
|---|---|
| Tiến độ 1080p/720p | chạy 0→100% cho luồng `135`, rồi LẠI 0→100% cho `140` |
| Dòng `postprocess:` khi có `--print` | ra **stderr** (stdout bị quiet) |
| Tải lại cùng link 480→360 | trả FILE CŨ 470p, in `height=352` → nhãn sai |
| Link kênh `@YouTube/videos` + `--flat-playlist -J` | `playlist`, 194 mục, 3,5 s (0.1.0 sẽ tải CẢ 194) |
| `findItemsMatchingMediaPath` (Test3_1, 99 item) | 1 ms, tìm cả bin con; `e:` thay `E:` → 0, gạch xuôi → 0 |
| Đi cây project + getMediaPath | 39 ms / 99 item |

**Đã sửa (lõi, chưa build):**
- `host/videodownload.jsx`: `vd_trangThai([đường dẫn])` (0/1/2 = không có /
  có / offline, dùng findItemsMatchingMediaPath rồi SO LẠI getMediaPath),
  `vd_dauHieu()` (dấu hiệu nhẹ cho vòng thăm dò), `vd_nhap(path, projectKyVong)`
  (tìm trùng cả project + đi cây, đổi project thì không nhập bừa, bằng chứng
  = tìm thấy item sau khi nhập), `vd_moThuMuc` (Folder.execute, dự phòng),
  `vd_chonThuMuc` dùng `selectDlg` (dự phòng), `vd_phienBan()` ở CUỐI file.
- `host/index.jsx`: `getHostInfo` trả `version|đường dẫn|tên`.
- `lib/cep.ts`: đếm lệnh treo (`hostDangCho`, `hostBan`), `goiHost` gộp
  nạp-lại + kiểm phiên bản host + gọi thành MỘT lệnh, `parseResult` tách mã,
  `chuoiJsx` thoát U+2028/2029, chọn thư mục bằng `cep.fs.showOpenDialogEx`.
- `services/ytdlp.ts`: explorer KHÔNG `windowsHide`; mở thư mục kiểm tồn tại
  trước; PowerShell kéo lên trước nhận đường dẫn qua biến môi trường, chỉ xét
  cửa sổ hiện, `AttachThreadInput`, in kết quả; chặn playlist; tên file kèm
  `%(height)sp`; `-I 1`; `--no-post-overwrites`; tiến độ cộng dồn các luồng
  (chỉ đi lên); bắt pha xử lý từ stderr; Dừng → chờ taskkill xong rồi xoá
  đúng file MỚI mang [id] (chụp danh sách trước); mã lỗi mới (cookie, không
  ghi được, Windows chặn exe, playlist); huỷ đọc link luôn trả 'huy';
  cập nhật engine vào bản sao `%APPDATA%\AiOStudio\videodownload\engine`.
- `services/caidat.ts`: lịch sử hỏng → đổi tên .bak (không ghi [] đè); ghi
  file tạm rồi đổi tên.
- `services/dongHanh.ts` (mới): `useHost` (bỏ lượt khi còn lệnh treo, chỉ đổi
  state khi đổi thật), `useTinhTrang` (file còn không — fs.stat bất đồng bộ;
  có trong project đang mở không — hỏi khi dấu hiệu đổi / focus / danh sách đổi).
- Phiên bản 0.2.0 ở package.json + manifest + host.

**Kiểm chứng bằng số:** tải thật với bộ tham số mới (`scratchpad/thu-engine2.mjs`):
tiến độ 1% → 76% → 80% → 100% (không tụt), dòng `Merger started/finished`
bắt được, file ra `… [tPEE9ZwTmy0] 470p.mp4`, MP3 chạy. **CHƯA** đo trên
panel: chưa build/cài.

**Còn phải làm:** anh chọn hướng UI → dựng App.tsx + styles.css + chu.ts →
build → cài → đo bằng cú bấm thật trong Premiere (Mở thư mục lên trước
Premiere? trạng thái "Trong project" đổi khi xoá clip / đổi project?).

---

## [0.1.0] 2026-09-08 — dựng panel, đo tải thật, vá 5 lỗi anh Tiến bắt tại chỗ

**Bối cảnh.** Anh giao: *"gắn một đường link bất kì và down video về"*, kèm
dặn *"tạo folder mới theo đúng guidelines"*. Chọn làm **panel CEP** (đúng
khuôn 11 panel: CSXS · host · client Vite/React · scripts · bin) vì giá trị
nằm ở "tải xong là nằm trong bin Premiere".

**Đo trước khi dựng (engine, ngoài panel):**

| Thử | Kết quả |
|---|---|
| yt-dlp 2026.08.19, YouTube 10 phút, `-J` | 53 định dạng, nhưng WARNING thiếu JS runtime |
| + Node làm runtime | 53 định dạng (như nhau) |
| + **QuickJS 2,1 MB** làm runtime | **53 định dạng** → chọn QuickJS thay deno (~100 MB) |
| Tải 720p + ghép ffmpeg | 82 MB / **13 giây** |
| YouTube Shorts · Facebook công khai | OK |
| Vimeo | đòi đăng nhập → làm ô "Cookie từ trình duyệt" |
| TikTok | 403 (xem bên dưới) |

**Đo trên panel thật (Premiere Beta, project copy `AiO-VD-test_1`):**

| Bước | Số đo |
|---|---|
| Dán link → có tiêu đề/ảnh bìa/thời lượng | ~4 giây |
| Tải 1080p (mặc định) | 255,9 MB / ~30 giây, 11 MB/s, `h264 1920×1080 60fps` (ffprobe) |
| Tự vào bin "AiO Video Download" | bin đếm **0 → 1**, `getMediaPath()` đúng file |
| Bấm **Dừng** lúc 12% | tiến trình yt-dlp/ffmpeg còn lại: **0**; file `.part` còn lại: **0** |
| Tool đồng hành | tên project trên thanh trên đọc lại mỗi 2 s |

**Năm lỗi lộ ra khi anh Tiến bấm thử (sửa ngay trong buổi):**

1. **TikTok 403** (anh dán link thật). Tái lập bằng dòng lệnh: cùng lệnh,
   6 lần → **5 qua / 1 bị 403**; `--impersonate chrome` → 4/6 (không đỡ).
   Kết luận: anti-bot xác suất, không phải sai tham số. Sửa: **tự thử lại 3
   lần** khi lỗi thuộc loại bị-chặn/mất-mạng, nút hiện *"Trang chặn, đang thử
   lại (2/3)…"*. Đo lại qua panel 3 lượt: 3/3 tải được, lượt 3 phải thử lại
   lần 2 mới qua — đúng cơ chế.
2. **"Tải xong rồi không thấy video ở đâu"**. Gốc đo được: nút "Mở thư mục"
   CÓ mở — đếm được **8 cửa sổ Explorer** đúng thư mục — nhưng nằm sau lưng
   Premiere. Windows chỉ cho tiến trình đang có tiêu điểm đưa cửa sổ lên
   trước. Sửa: sau khi mở, PowerShell con tìm đúng cửa sổ (Shell.Application
   `LocationURL`), nhấn Alt ảo rồi `SetForegroundWindow`. Đo: cửa sổ tiêu
   điểm sau khi bấm = `Video Download - File Explorer` (trước đó là Chrome).
   Kèm: dòng "Lưu vào" bấm được để mở thẳng thư mục.
   ☠️ Thử `/select,"path"` thành một tham số (verbatim) → Explorer mở nhầm
   **Desktop**. Giữ dạng hai tham số.
3. Reload panel là mất danh sách "Đã tải" → lưu 30 mục ra
   `%APPDATA%\AiOStudio\videodownload-lichsu.json`. Đo: reload còn 1/1 mục.
4. Nút xong quay về xám ngay → giữ đèn xanh "Đã tải xong" tới khi dán link mới.
5. ETA in "NA", thiếu tổng MB → lọc NA, dùng `total_bytes,total_bytes_estimate`.
6. **Tiêu đề tiếng Việt + emoji → "KHONG_THAY_FILE"** (anh dán link Shorts
   *"Những bức ảnh được chụp…😮"*). File trên đĩa tên ĐÚNG; nhưng đường dẫn
   yt-dlp in qua `--print` ra `Nhng bc nh c chp v�o` (mất dấu) nên panel tìm
   sai tên. `PYTHONIOENCODING`/`PYTHONUTF8` **không** đỡ; **`--encoding utf-8`**
   của chính yt-dlp thì ra đúng từng ký tự. Kèm `StringDecoder` chống cắt
   ký tự giữa hai gói stdout. Đo lại qua panel: bin **2 → 3 clip**, tên clip
   thứ 3 đúng dấu + emoji.

7. Anh: *"khi dán link vào để đọc thì cần có một hiệu ứng loading"* → vòng
   xoay + vạch cam chạy dưới ô link lúc `dang-doc` (đo: 2 animation chạy,
   `doc-link-xoay` / `doc-link-vach`). Kèm nút **×** bỏ mục khỏi danh sách
   "Đã tải" (không xoá file) — có đường vào thì có đường ra.

8. Anh: *"video download về có thumbnail giống như lúc đang đọc link"* →
   tách khung giây 1 từ CHÍNH file đã tải bằng ffmpeg (192px, ~10 KB) vào
   `%APPDATA%\AiOStudio\vd-thumbs\<id>.jpg`; mục cũ tự tách nền lúc mở panel.
   Đo: 5/5 mục có ảnh (`naturalWidth` 192), 4 file jpg 2,8–16 KB. Không lấy
   URL ảnh của trang gốc để xem được lúc mất mạng.

**Bẫy kỹ thuật ghi vào CLAUDE.md:** `--print` ngầm bật `--simulate` ·
thiếu qjs.exe chỉ WARNING · `proc.kill()` bỏ sót ffmpeg con · dọn `.part`
theo `[id]` chứ không theo mẫu rộng (bài 5am-ter).

**Thước đo dùng trong buổi:** `scripts/do-tren-panel.ps1 -Port 8098` (DOM +
evalScript) · CDP `Page.captureScreenshot` chụp đúng panel · `PrintWindow`
chụp Premiere (CopyFromScreen ra đen — thước sai, không phải Premiere đen).

**Chưa làm:** Vimeo với cookie thật · playlist / nhiều link · cắt đoạn ·
máy sạch · bản rời ngoài Premiere.
