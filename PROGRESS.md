# AiO Studio (gốc repo) — Nhật ký

> Nhật ký cho thứ nằm ở **gốc repo**: `scripts/`, `.claude/`, `CLAUDE.md`, cấu
> trúc thư mục. Việc của từng panel ghi ở `PROGRESS.md` **trong thư mục panel đó**.
>
> Lập 21/09/2026 — trước đó mục 8 `CLAUDE.md` ghi *"PROGRESS.md gốc repo | Chưa có"*.

## [mac-thu-that] - 2026-10-04 01:56 (UTC+7) - Thử VIỆC THẬT của 11 panel trong Premiere trên Mac + cài Shot & Save 0.8.0 - máy Mac nhà

- **Bối cảnh:** anh: *"em test toàn bộ cho anh luôn nha em"* rồi *"cài luôn cho anh AiO Studio nha em"*. So bản đang chạy với repo
  của MỌI app trong bộ (bài 5ay-bis): 11 panel đã bằng repo, chỉ Shot & Save lệch (máy 0.7.9, mã 0.8.0) nên "cài" = Shot & Save 0.8.0.
- **Cách thử** (`scripts/thu-panel-mac/`, mới): bấm nút thật của panel qua cổng gỡ lỗi, đọc lại kết quả bằng ExtendScript. Tự dựng
  1 bin + file thử riêng (clip nói 55 s và 14 s, bài nhạc 3:07, liệu podcast 89 s có đáp án) + 18 sequence `CL04 …`; thử xong dọn theo
  danh sách: project về đúng ảnh chụp trước khi thử (13 item, 8 sequence, 0 dòng khác), lưu lại 1 lần (Re-Frames + Podcast tự lưu
  project khi dựng nên file trên đĩa từng dính đồ thử; sau khi lưu: 0 chữ `CL04` trong file). Liệu thử + dữ liệu panel sinh ra đã vào Thùng rác.
- **ĐẠT (đo trên Premiere Beta 26.5, Mac Intel):**
  | Panel | Đã bấm gì | Số đo |
  |---|---|---|
  | Autocut | Cắt khoảng lặng: Sequence mới · Cắt tại chỗ · Hoàn tác cắt | 8 nhát, 55,28 → 40,04 s, 0 khe hở hình + tiếng (y hệt 30/09); 8/8 câu còn nguyên (3 mép nghi mất chữ đo ra −91 dB = lặng thật, đối chứng tiếng nói −18 dB); bước cắt 33,7 s; hoàn tác về 1 clip 55,28 s |
  | Transcripts | Làm phụ đề · Xoá marker | 9 khối, 38,1 s, `.srt` đúng thứ tự + có dấu, 2 marker; xoá marker chỉ đụng sequence đang làm (sequence khác giữ 2 marker) |
  | Short Viral | Đọc nội dung · Đặt marker · Tạo sequence | 3 khối trong 1,5 s (dùng lại bộ đệm nghe), 3 marker, 3 sequence 7,0 / 14,64 / 31,52 s trong 3 s; in/out clip gốc không đổi |
  | Video Download | Nhập file đã tải · Tải MP3 · Bỏ khỏi danh sách | nhập vào bin, nhãn "Trong project"; tải 6 s, file mp3 thật 19,0 s, tự vào bin; bỏ khỏi danh sách không xoá file |
  | Guide Frame | Hiện khung · Thay khung ở sequence khác | guide lên V2 đúng độ dài; **lỗi 25/09 không tái diễn**: đặt rồi thay guide ở sequence B, guide ở A còn nguyên (clip + item + PNG) |
  | Re-Frames | Cả sequence dọc 9:16 · Xuất check 720p · Tìm đoạn theo nội dung → Tạo short | sequence 1080×1920 có hiệu ứng Auto Reframe; file check h264 1280×720 14,36 s **trùng từng byte** bản 30/09; tìm ra 1 đoạn 32 s, tạo short 31,52 s |
  | Asset Manager (lần đầu đo trên Mac) | Thêm thư mục · Chèn vào timeline · lọc · tìm · Gỡ thư mục | 4 asset, 3 ảnh xem trước / sóng âm tạo bằng FFmpeg Mac, hiện qua máy chủ nội bộ; tiếng xuống A2, video lên V3 + A3, 0 clip cũ bị đè |
  | Power Bins (lần đầu đo trên Mac) | Tạo brand · Thêm khay · Thêm từ timeline · mở lại panel · Chèn · Xoá brand | asset vào khay, còn nguyên sau khi đóng mở panel; chèn lên V4 + A4 (panel tự thêm track) |
  | Music (lần đầu đo trên Mac) | Tìm Key · Tìm BPM · Import thư mục · phát · Chèn vào Timeline | tiếng nói: cảnh báo "cao độ không rõ" (đúng); bài nhạc: C#m 84 %, 126 BPM; 60 s đầu của cùng bài đo nền ra đúng C#m + 126; phát chạy 0,17 → 2,18 s; chèn vào A2 |
  | Podcast, tiếng máy quay làm mic (tiếng 2 kênh) | Auto Podcast | **10/10 đoạn bật đúng máy quay của người đang nói**, 0 màn đen, 0 chồng cam, mép cắt sớm đúng 0,40 s ở cả 9 ranh, 19 keyframe ducking mỗi mic, 24 s |
  | Panel tổng | 10 thẻ · đổi ngôn ngữ · thẻ Shot & Save | 10/10 mở; VI → EN: 3 panel đang mở đổi theo trong 3,5 s (0 ký tự có dấu), trả lại VI |
- **LỖI TÌM RA (không lỗi nào riêng của Mac trừ dòng ghi rõ):**
  1. **Podcast, 2 mic rời MỘT KÊNH: hỏng.** Mic của người thứ hai mặc định lấy kênh PHẢI (`pan=mono|c0=c1`, `dist/index.html`
     ~1948 và ~1971); file mic một kênh không có kênh phải nên file phân tích ra −91 dB (đo; đối chứng `c0=c0` ra −30,8 dB). Hộp
     Cài đặt cắt không có chỗ chọn kênh. Hậu quả: báo "mic có tín hiệu phẳng/đều", hoặc nếu project có sẵn file mic thì rơi vào nhánh
     "tự tìm mic trong project" và **lặp vô hạn** (đếm 390 lệnh host, panel đứng ở "Đang phân tích tiếng nói…" tới khi nạp lại):
     lệnh panel gửi có 6 trường (`A,3,<file>,0,89,0`) còn host `pc_datTieng` đòi 5 → `daDat=0|soLoi=2`, panel không đọc kết quả mà
     chạy lại. CHƯA sửa (tool anh đã chốt xong 06/08; chờ anh gật). Chi tiết: `AiO Auto Podcast/PROGRESS.md`.
  2. Video Download: tải MP3 xong danh sách ghi "OPUS · 0:19" (file là mp3 thật).
  3. Asset Manager: gỡ thư mục xong nút dưới vẫn sáng "Chèn video-thu vào timeline" (lựa chọn cũ); 3 ảnh xem trước mồ côi không được dọn.
  4. Music: màn Key không theo clip được chọn lúc đang ở màn khác (giữ kết quả cũ tới khi chọn lại) · BPM bản tăng tốc 12,2 % ra 71
     (kỳ vọng 141, tức ra nửa nhịp) mà vẫn ghi tin cậy 100 % · key bản nâng 2 nửa cung ra B 48 % có cảnh báo (kỳ vọng D#m), 1 mẫu ·
     thông báo "Da chen vao A2 tai 0.00s" không dấu · **riêng Mac:** nhật ký thả file ghi vào `~/AppData/Roaming/AiOMusic` (đường Windows).
  5. Guide Frame: panel rộng 340 px thì ô tên sequence co thành ô trống, chữ trong hình xem trước chồng nhau (ảnh:
     `scripts/thu-panel-mac/anh-04-10/guide-frame-340px.png`).
  6. Podcast: lúc chạy hiện tên từng bước ("Đang thay tiếng mic thu riêng…"), trái luật "không lộ quy trình"; đổi sequence thì dòng lỗi cũ còn.
  7. Transcripts: khối phụ đề 4 chỉ có một chữ "đề." dài 0,73 s (câu 3 bị ngắt lẻ).
  8. Nút ngôn ngữ: Re-Frames + Podcast ghi "EN" khi đang ở tiếng Việt, các panel khác ghi "VI".
  9. Premiere: 2 lần không trả lời ExtendScript > 18 s ngay sau khi Autocut dựng xong (khoảng 170 lệnh); hỏi lại thì được.
- **Shot & Save 0.8.0 trên Mac:** dựng `electron-builder --mac --x64 --dir` (ký ad-hoc), cài vào `/Applications` 01:54; bản 0.7.9 cất ở
  `~/Library/Application Support/AiO-Studio/ban-cai-truoc/AiO Shot & Save 0.7.9.app`; 432/432 file, `app.asar` md5 khớp bản dựng. Mở lên:
  `boot v0.8.0`, 4 ảnh + cấu hình còn nguyên. **CHƯA chụp được:** nhật ký ghi `Failed to get sources` (4/4 lần lúc khởi động) = macOS
  chưa cấp quyền quay màn hình. Bản 0.7.9 cũng vậy từ 02/10 (12 lần anh bấm chụp, 57 dòng lỗi này). Em đã mở sẵn trang quyền trong
  System Settings; bật công tắc là việc của anh. Dùng thử còn 11 ngày. Quay video / khay / số bước của 0.8.0 CHƯA thử trên Mac.
- **Thước sai trong lúc thử:** regex dừng khớp nhầm chữ có sẵn (3 lần) · hộp `confirm()` của Power Bins làm script đứng 20 s (anh bấm
  giúp) · bộ liệu `podcast-lieu` thiếu 2 file mic nên lượt đầu chỉ có tiếng tone (panel từ chối đúng).
- **CHƯA thử:** kéo-thả từ panel ra timeline và từ Finder vào panel · hộp chọn thư mục thật (em trả lời sẵn thay hộp thoại) · Podcast
  có cam toàn cảnh / Auto Sync · Transcripts dọc 9:16 + Câu dài · video dài (mọi số trên là clip ≤ 3 phút) · máy Mac chip M.

## [mac-do-premiere] - 2026-10-04 00:27 (UTC+7) - Đo 11 panel vừa cài trong Premiere trên Mac: 10/10 mở từ panel tổng, trả lời đúng - máy Mac nhà

- **Bối cảnh:** tối 03/10 Premiere dừng ở một cửa sổ nhỏ nên em chưa đo được. Anh: *"anh mở panel rồi em kiểm tra đi"* (anh mở panel tổng AiO Studio).
- **Cách đo** (`scripts/do-panel-qua-hub.mjs`, mới, chỉ đọc, không đụng project / sequence): nối cổng gỡ lỗi 8101 của panel tổng, **bấm
  từng thẻ** (`button[data-i]`.click(), đúng đường người dùng bấm) → chờ cổng của panel tool sống → đọc giao diện + gọi `app.version`
  và `typeof <hàm host>` qua cầu nối → đóng panel vừa mở (`closeExtension`). Project thử `Untitled.prproj`, Premiere Beta 26.5.0.
- **Kết quả 00:26:**
  - Panel tổng 442×571: 12 thẻ, 0 nhãn "Chưa cài", số phiên bản trên thẻ 10/10 khớp manifest (1.6.0 · 0.1.0 · 0.1.2 · 0.6.1 · 2.5.5 ·
    0.3.2 · 2.0.0 · 2.0.0 · 0.2.2 · 1.0.1); Shot & Save là thẻ mở app, Organize "Sắp có".
  - **10/10 panel mở từ thẻ** sau 1.266–1.285 ms (thước nhảy từng 250 ms, nên thật ra trong khoảng 1,0–1,3 giây; Windows 25/09 đo
    458–486 ms bằng thước khác, không so trực tiếp được); giao diện 29–445 thẻ HTML, có chữ, không có chuỗi lỗi; `app.version` =
    26.5.0 trả về trong 1–54 ms; hàm host của cả 10 panel = `function` (host `.jsx` đã nạp); 10/10 đóng lại được, sau khi đo chỉ
    còn cổng 8101 sống (đúng trạng thái anh để).
- **CHƯA đo:** việc thật của từng panel sau lần cài 03/10 (cắt, nghe lời, tải video, đặt guide); thẻ Shot & Save (bấm là mở app
  lên màn anh); lỗi "ExtendScript ngừng trả lời" ghi 30/09 ở Short Viral không gặp trong lần đo này (10 lượt gọi, 0 lượt hết giờ).

## [mac-cai-panel + gom-production] - 2026-10-03 22:43 (UTC+7) - Script cài panel cho Mac, cài 11/11; gom cả Production về ~/Production; bản thừa vào Thùng rác - máy Mac nhà

- **Bối cảnh:** anh: *"cần làm gì thì làm luôn đi em ơi"* → *"cài rồi kiểm tra xem đúng chưa - xóa đi các file nào dư thừa luôn đi em"*.
  Em hỏi lại 2 câu vì đo ra `Downloads/Production` là CẢ bộ thư mục công ty (27 dự án, 40 GB): anh chọn **một thư mục duy nhất
  = `~/Production`** và **bản thừa đưa vào Thùng rác**.
- **Script `scripts/cai-panel-mac.mjs`** (mới): bảng 11 panel (id, thư mục, mục cần chép, lệnh build); build → dựng ra thư mục tạm →
  kiểm manifest (đúng id, MainPath/ScriptPath trỏ tới file có thật) → đổi chỗ bản đang cài sang `AiO-Studio/ban-cai-truoc/<id>`
  (không xoá) → chép → so lại từng file. `--thu` chỉ so, `--dich` cài chỗ khác, `--khong-build`.
  - Thử (không ghi): 11/11 panel, 0 file lệch nội dung so với bản đang chạy; Transcripts bản cài thừa 8 file thử trong `mogrt/`.
  - Đối chứng trên thư mục tạm: cài lần đầu 3 panel khớp 33/33; cài lần hai bản trước được cất (file đánh dấu còn ở bản cất, không
    còn ở bản mới); cố ý sửa 1 file + cất 1 file + thêm 1 file → thước báo đúng 1 lệch / 1 thiếu / 2 thừa; ẩn `host/index.jsx`
    → script từ chối cài, không ghi gì vào đích; tên panel sai → báo danh sách tên đúng.
  - **Cài thật 19:43: 11/11 panel, 101/101 file khớp**, 11 bản trước cất ở `ban-cai-truoc` (8,6 MB). Chạy `--thu` lại: 11/11 giống hết.
  - **CHƯA đo trong Premiere:** mở Premiere Beta 26.5 với project thử `~/Documents/Adobe/Premiere Pro (Beta)/26.0/Untitled.prproj`
    (19:44), CEP khởi động 19:45:16, nhưng 3 phút sau và lúc 22:42 vẫn 0/11 cổng panel sống, 0 tiến trình CEPHtmlEngine; Premiere
    chỉ có một cửa sổ 800×812 (màn chào hoặc hộp thoại). Em không nhìn / không bấm được màn hình. Premiere đang để mở.
- **Gom Production:** 26 mục (79.334 file, 18,6 GB) chuyển chỗ từ `~/Downloads/Production` về `~/Production` (cùng ổ, không chép,
  không xoá); đếm lại 26/26 khớp số file, 0 mục sót. File bản đồ `~/Production/CLAUDE.md` thêm ghi chú Mac.
- **Lắp brain (theo README trong `Brain Claude - Gemini - Chatgpt`, bản `.ps1` không chạy trên Mac):** lệnh `/brain` (Mac thiếu),
  70 file ngăn nhớ của 9 dự án thuộc Production đổi tên theo đường dẫn Mac (8/9 có thư mục khớp; `AiO-Editing` là thư mục cũ đã
  bỏ). 11 ngăn của dự án ngoài Production (N8N, Porto, DRT…) không lắp vì Mac không có thư mục đó. Brain chính + skill + hook: đã
  có sẵn và mới hơn gói (GitHub `ad9f94b` 03/10 15:16 so với gói 14:10).
- **Việc làm trên Mac chỉ còn trong Thùng rác, đã lấy lại:** bộ cài Mac Shot & Save 0.7.9 (x64 115 MB + arm64 111 MB) vào
  `Release/AiO Shotandsave/mac/` (sửa `HUONG-DAN-CAI-DAT.txt` 0.5.6 → 0.7.9) · portfolio `Pored/V3.2/V3`: 4 ảnh reels + 2 file
  `.tsx` sửa 30/09 01:29 (bản công ty 12/08 cất ở `Pored/V3.2/_ban-cong-ty-truoc-khi-gop-03-10/`). `Cha - 1 Min For Bibble`: việc
  30/09 trên Mac là commit `8bbedf3`, đã là tổ tiên của bản công ty `56f2a36`, 24 file "chỉ có ở Thùng rác" là file công ty đã chủ
  động xoá/đổi tên 01/10 → không cần lấy.
- **Bản thừa → Thùng rác (không xoá vĩnh viễn):** bản AiO Studio cũ ở Downloads (202 mục, 20 GB; giữ lại tại chỗ 19 mục cấu hình /
  chứng chỉ / ảnh chụp, 66 MB), thư mục Gemini cũ (984 MB, 0 file sửa dở, nhánh `gemini` có trên GitHub), thư mục dự phòng
  `cuu-ban-mac-30-09`, 2 bộ cài Mac 0.5.5. Trước khi đưa: so từng file bản cũ với thư mục chính (xem bảng mục 8 `CLAUDE.md`) và cứu
  nhánh `backup-cong-ty-26-09` (`e5fcab9`) + bản cất tạm 29/09 (`cffe418` → nhánh `cat-tam-cong-ty-29-09`) vào repo chính.
- **Sửa kèm:** `scripts/dong-bo-mac.sh` so với nhánh GitHub của chính nhánh đang dùng (trước: luôn `origin/main` → trên nhánh `mac`
  sẽ báo LỆCH giả); bỏ câu "7 panel chưa chạy được trên Mac", thay bằng kiểm 4 file ở kho chung (đo: 4/4 có).
- **Thước sai gặp trong lúc làm:** "thiếu 4 file Test Media" + "3 file lệch cỡ" (tên có dấu khác chuẩn Unicode; file git theo dõi lệch
  CRLF) · `echo "ma thoat: $?"` sau một ống `| cut` in mã thoát của `cut`, không phải của script (2 lần).
- **CHƯA làm:** Codex CLI · plugin ECC · Shot & Save 0.8.0 chạy thử trên Mac · gộp `mac` vào `main` · tăng số phiên bản · kiểm lại
  nhánh Windows của 11 panel · đẩy 2 nhánh cứu lên GitHub · bản Mac cho `dong-bo-cuoi-ngay.ps1` · `--day-brain` trên Mac.

## [mac-may-chinh] - 2026-10-03 18:15 (UTC+7) - Lấy lại bản Mac 11 panel từ Thùng rác, gom 3 bản sao về một thư mục, Mac là máy chính - máy Mac nhà

- **Bối cảnh:** anh: *"đây là folder được download mới xong"* → *"cứ kiểm tra đi"* → *"em lấy lại cho anh rồi giúp anh tổng hợp thành một
  file duy nhất và từ nay mac sẽ là máy làm việc chính của anh"* → *"lắp brain vào luôn… chắc chắn rằng máy mac ở nhà làm việc như ở công ty"*.
- **Tìm ra:** trên Mac có 3 bản AiO Studio. Bản clone 01/10 (`~/Production`, sạch) · `Downloads/Production` (chép từ máy công ty 02/10,
  20 GB) · Thùng rác (bản 29/09, 20 GB). Bản Mac của 11 panel làm 30/09 (82 file đổi thật + 3 file mới, +2.352 / −239 dòng, đã đo trong
  Premiere Beta 26.5 trên Mac) CHỈ còn ở Thùng rác và trong panel đang cài; 0 nhánh GitHub có. Số phiên bản panel đang cài = repo 11/11
  nên so số không thấy; so nội dung thì 6 panel lệch.
- **Sai của em trong lúc kiểm:** báo "11/11 panel khớp repo" khi chỉ so số phiên bản; báo "Mac không có FFmpeg" khi chỉ tìm ở PATH và
  `bin/` của repo (bản Mac nằm ở kho chung `~/Library/Application Support/AiO-Studio/`).
- **Đã làm:**
  - Bản dự phòng ngoài repo: `~/Production/cuu-ban-mac-30-09/` (bản vá 82 file + 3 file mới). Không đụng Thùng rác.
  - Nhánh `mac` (từ `may-cong-ty` `49e3b6e`), 2 commit, đã đẩy: `0312c82` việc dở Guide Frame của máy công ty 26/09 (8 file; bản Thùng rác
    và bản Downloads giống nhau) · `8ccbcb6` bản Mac 11 panel (77 file). Không tăng số phiên bản.
  - Chép phần không qua git từ Downloads (+ 4 file chỉ có ở Thùng rác): Test Media 242 file (bỏ bộ đệm tiếng Premiere 3,7 GB), Release
    (bản mới nhất, 623 MB; bỏ 11 bộ cài Shot & Save cũ), liệu thử Transcripts + `mogrt/`, 2 file `preview.mp4`. Thư mục 2,8 → 7,1 GB.
  - Electron 43.4.1 cho Shot & Save (`node_modules/electron/install.js`). Hook `SessionStart` + `Stop`: đã có sẵn từ 17:54 (không phải em lắp).
- **Kiểm:** bản vá áp lên bản gốc ra đúng bản Mac (0 file khác); 83/85 file trong repo = bản Thùng rác (2 file còn lại là `CLAUDE.md` gốc
  + tracker, repo mới hơn); thử ghép 82/82 sạch, đối chứng ghép ngược 0/82. Sau khi ghép: **11/11 panel đang cài khớp nội dung repo**
  (trước: 6 panel lệch); **6/6 panel có build ra đúng từng byte** với bản đang cài (Asset Manager + Power Bins phải `build:release`).
  `git ls-remote` nhánh `mac` = `8ccbcb6`. Test Media 242/242, 0 thiếu (4 file "thiếu" + 3 file "lệch cỡ" là thước sai: tên có dấu khác
  chuẩn Unicode, và file git theo dõi lệch CRLF). Bài kiểm thuần node trên Mac: 6/8 đạt; Short Viral `kiem` cần file ở `E:\` máy công ty;
  Transcripts `kiem` lỗi biên dịch `cep.ts` (thiếu `--jsx`), chưa thử trên máy khác.
- **CHƯA làm / CHƯA kiểm:** script cài panel cho Mac · Codex CLI trên Mac · mở Shot & Save 0.8.0 từ mã nguồn trên Mac · nhánh Windows
  của 11 panel sau khi thêm nhánh Mac · gộp `mac` vào `main` · `.env.local`, `.vercel`, `Anh chup` chưa chép (lớp bảo vệ chặn) · 2 bản
  cũ 40 GB chưa xoá (anh tự xoá). Ai đổi nhánh sang `may-cong-ty` + kéo brain + lắp hook lúc 17:54 thì em không xác định được.

## [web-shotsave] - 2026-10-02 09:33 (UTC+7) - Rạp: chuyển cảnh hết "giật và khựng" (một nhịp mờ ra / hiện vào, sân giữ nguyên chiều cao) - máy công ty

- **Bối cảnh:** sau bản tự chuyển cảnh 08:58 anh báo: *"khi chuyển giữa các phần có đang bị giật và khựng lại"*.
- **Nguyên nhân (đo trên LIVE, Chrome ngầm 1920×950, ghi từng khung hình 12 lần chuyển):**
  - **Khựng:** cảnh xong → đứng hình 0,93 giây → trang cuộn mượt 0,33 giây → cảnh mới bắt đầu sau **1,25 giây**.
  - **Giật:** chú thích dưới sân dài 1–3 dòng tuỳ cảnh → sân đổi chiều cao **25–50 px ở 7/12 lần** (642 / 667 / 617 / 592),
    và chữ chú thích đổi trước, 0,14 giây sau hình trên sân mới bị cắt sang cảnh mới = nhảy hai nhịp.
  - KHÔNG phải rớt khung: khoảng cách khung lớn nhất 17 ms (một lần 42 ms), 0 tác vụ dài.
- **Đã sửa** (`Website/AiO ShotSave Web/index.html`):
  - `tuSang(i)`: cảnh xong nghỉ **0,5 giây** (trước 0,9) → sân mờ đi 0,18 giây → nhảy vị trí cuộn NGAY (`behavior: "instant"`;
    sân ghim nên trên màn không có gì trượt) → đổi chú thích + dựng cảnh mới cùng một lúc → sân hiện dần 0,22 giây.
  - `dien()`: mọi cảnh mới đều hiện dần 0,22 giây (trước: cắt thẳng). `khiCuon()`: người xem tự cuộn thì cảnh cũ mờ ngay.
  - `giuCao()`: giữ chỗ cho chú thích theo cảnh có chú thích cao nhất → sân cùng một chiều cao ở mọi cảnh; `.cap` neo trên
    để tên cảnh không trồi sụt. Gọi lại khi đổi ngôn ngữ, đổi cỡ cửa sổ, font về.
- **Lỗi do chính bản sửa, bài đo bắt được trước khi đẩy:** giữ chỗ trên điện thoại làm sân ở 360×740 lùn 421 → 317 px (−25%)
  và nhãn cảnh 9 đè khay 4 px → ở bề rộng ≤ 640 px KHÔNG giữ chỗ (sân vẫn đổi chiều cao, nhưng đúng lúc đang mờ).
- **Đo sau sửa** (phim tua ×4 nên đoạn mờ 0,18 giây chỉ còn 0,045 giây trong số đo; tốc độ thật ≈ 0,68 giây):
  | | Trước (live 08:58) | Sau |
  |---|---|---|
  | Cảnh xong → cảnh mới bắt đầu | 1,23–1,33 giây | 0,57–0,60 giây đo ×4 (≈ 0,68 giây thật) |
  | Trang cuộn kéo dài | 0,32–0,38 giây | 0 (nhảy ngay) |
  | Sân đổi chiều cao, 1920×950 | 7/12 lần | **0/12** (592 px cả 13 cảnh) |
  | Khung chậm > 34 ms | 1 | 0–1 |
  390×844: 12/12 lần chuyển một nhịp; sân còn đổi chiều cao 9/12 lần (cố ý, xem trên). Tự chuyển 12/12 bước đúng thứ tự;
  giảm chuyển động: 8 giây không tự cuộn; cảnh 9 ở 6 khổ × 2 ngôn ngữ: 0 tràn, 0 đè; 0 lỗi console.
- **CHƯA đo / giới hạn:** bài đo là Chrome ngầm, đếm khung của luồng chính, KHÔNG thấy độ mượt thật trên card màn hình →
  cần mắt anh xác nhận. Ở 1920×950 sân thấp đi tối đa 75 px ở cảnh có chú thích ngắn (667 → 592). Trên điện thoại, người
  xem TỰ cuộn thì chú thích đổi trước khi cảnh cũ mờ hết (0,12 giây). Điện thoại thật / Safari chưa đo.
- **Sân thấp hơn có làm hình tràn không:** 13 cảnh × 3 khổ (1024×768, 1280×800, 1920×950) ở khung cuối, đếm phần tử đang
  thấy tràn ra ngoài sân > 3 px: bản sửa **0/39 cảnh**, bản live 0/39, không cảnh nào xấu hơn. Đối chứng: bóp sân còn 60%
  thì thước bắt được 13/13 cảnh. (Thước chỉ đo TRÀN và nhãn đè chữ to, không đo các khối đè nhau bên trong sân.)

## [web-shotsave] - 2026-10-02 09:17 (UTC+7) - Cảnh 9 "Nhớ ảnh": đổi "5 ảnh vẫn còn" thành "Ảnh gần nhất tự hiện lại" + nói số ảnh chỉnh trong Cài đặt - máy công ty

- **Bối cảnh:** anh chụp cảnh 9 của rạp: *"cái này anh cần sửa lại là 5 ảnh vẫn còn như sau: mở lại sẽ tự động hiển thị ảnh
  gần nhất, có thể tùy chỉnh trong settings số ảnh cần gợi ý trong phiên mở mới"*.
- **Kiểm app trước khi viết lên web:** app CÓ SẴN tuỳ chọn này: `src/settings/index.html` hàng "Mở lại ảnh gần nhất" với 4 nút
  Tắt / 5 / 10 / 20, `main.js napAnhGanNhatVaoKhay()` đọc `khaySoAnh` (mặc định 5). Web không hứa thứ app chưa có.
- **Đã sửa** (`Website/AiO ShotSave Web/index.html`):
  - Chữ to cuối cảnh: VI *"Ảnh gần nhất / tự hiện lại."*, EN *"Your latest shots / come right back."* (2 dòng: câu mới dài gần
    gấp đôi câu cũ, 1 dòng sẽ chiếm ~94% bề rộng sân).
  - Thêm nhãn nhỏ dưới khay: VI *"Chọn số ảnh mở lại trong Cài đặt: Tắt, 5, 10 hoặc 20"*, EN *"Pick how many reopen in
    Settings: Off, 5, 10 or 20"*. Cảnh giữ lâu hơn 1 giây (1,6 → 2,6 giây) để kịp đọc.
  - Thẻ mô tả `f9p` (VI + EN): bỏ con số "5 ảnh", thêm câu chọn số ảnh trong Cài đặt.
- **Đo** (Chrome ngầm, 6 khổ 360 → 1440 × VI/EN = 12 lượt, cảnh ở khung cuối): chữ to và nhãn tràn sân **0/12**, đè khay
  **0/12**, đè nhau **0/12**, chữ to lệch tâm **0 px**; 0 lỗi console. Ảnh chụp 1440 và 390 (VI): 5 thumbnail hiện đủ, nhãn
  nằm dưới khay. Ở 360 và 390 nhãn xuống 2 dòng, cách đáy khay 11 và 24 px.
- **Bẫy đo (thước sai 3 lần trong một việc nhỏ):** (1) trang có cuộn mượt: đo ngay sau `scrollTo` thì cảnh bị dựng lại giữa
  chừng → bản VI đo nhầm câu "Tắt ứng dụng." (phải chờ vị trí cuộn đứng yên + kiểm chữ đang hiện đúng là câu cuối);
  (2) `tl.progress(1)` bắn `onComplete` → 0,9 giây sau trang TỰ SANG cảnh 10 (tính năng thêm lúc 08:58) đúng lúc chụp → ảnh ra
  chữ cảnh 9 với chú thích cảnh 10; đưa phim tới 99,9% thay vì 100%; (3) ép từng tween về cuối làm thumbnail trong khay biến
  mất (lệnh `set` opacity 0 chạy sau lệnh hiện) → không ép tween, chờ 600 ms. Phép đếm thumbnail bằng nhãn "#n" ra 0 ở khổ
  hẹp vì nhãn số bị ẩn trên điện thoại (ảnh chụp cho thấy đủ 5).
- **CHƯA đo:** điện thoại thật / Safari; nền sáng.

## [web-shotsave] - 2026-10-02 08:58 (UTC+7) - Rạp 13 cảnh: cảnh diễn xong TỰ SANG cảnh kế (trước: lặp lại chính nó) - máy công ty

- **Bối cảnh:** anh chụp dải 13 clip của rạp trên web Shot & Save: *"chạy xong cái số 1 nó tự nhảy qua chạy cái số 2 được
  không, hiện tại mình không bấm next nó sẽ loop lại cái số 1"*.
- **Nguyên nhân:** `dien(i)` gắn `onComplete` → 0,9 giây sau gọi lại `dien(i)` (cố ý từ đầu: cuộn tới đâu diễn cảnh đó, đứng
  yên thì lặp). Không có đường nào tự sang cảnh kế.
- **Đã sửa** (`Website/AiO ShotSave Web/index.html`, khối "cuộn tới đâu, diễn cảnh đó"):
  - Cảnh xong → nghỉ 0,9 giây → `toi(i + 1)` (cuộn mượt sang cảnh kế, đúng đường bấm clip đang dùng). Cảnh 13 thì diễn lại
    chính nó (cuộn tiếp là ra khỏi rạp).
  - Chỉ tự sang khi rạp đang chiếm phần lớn màn hình (`ganGiua()`: mép trên rạp ≤ 40% màn, mép dưới ≥ 60% màn) và sân đang
    thấy; rạp mới ló ra một ít thì trang KHÔNG tự cuộn, cảnh lặp như cũ.
  - Người bật "giảm chuyển động": cảnh đứng ở khung cuối, không tự cuộn. ☠️ Bản sửa đầu gắn `onComplete` TRƯỚC
    `tl.progress(1)` nên nó bắn ngay → trang tự cuộn mỗi 1,2 giây qua 7 cảnh trong 8 giây (bài đo F2 bắt được) → đổi thứ tự.
    Bản cũ cũng có lỗi cùng gốc nhưng vô hại: dựng lại cảnh tĩnh mỗi 0,9 giây.
- **Đo** (Chrome chạy ngầm qua CDP, máy chủ tĩnh 127.0.0.1, cuộn bằng BÁNH XE CHUỘT thật `Input.dispatchMouseEvent`, 0 lỗi console):
  - Tốc độ thật, 1440×900, vào cảnh 1 rồi không đụng gì: sang cảnh 2 sau **5,7 giây**, cảnh 3 sau **11,7 giây**.
  - Phim tua ×8, từ cảnh 1: **12/12** bước chuyển, mỗi bước đúng +1 cảnh, tới cảnh 13 sau 22,9 giây. Cảnh 13: diễn lại tại
    chỗ 5 lần / 9 giây, vị trí cuộn đứng yên.
  - Tự lăn ngược 52 nấc về cảnh 6 giữa chừng: chạy tiếp 6 → 7 → 8.
  - Rạp mới ló (mép trên ở 55% màn): 9 giây, vị trí cuộn không đổi (937 px), cảnh 1 lặp 6 lần.
  - Bề rộng 390 px: 3/3 bước chuyển. Giảm chuyển động: 8 giây không tự cuộn.
  - **Đối chứng bản đang live (bản cũ):** cảnh 1 lặp 6 lần / 9 giây, vị trí cuộn không đổi → thước phân biệt được hai hành vi.
- **Bẫy đo:** (1) giả lập điện thoại (`mobile: true`) thì lệnh bánh xe chuột không bao giờ được trả lời → bài đo treo 8
  phút; nay mỗi lệnh CDP có hạn 15 giây và đo 390 px bằng chuột. (2) `Runtime.evaluate` với `returnByValue` trên lệnh trả
  về cả đối tượng GSAP (`gsap.globalTimeline.timeScale(8)`) treo > 15 giây, trong lúc đó trang đi tiếp 2 cảnh → trông như
  "nhảy cóc 2 cảnh"; cho biểu thức trả về số 1.
- **CHƯA đo:** vuốt tay trên điện thoại thật / Safari; người xem lăn chuột đúng lúc trang đang tự cuộn. **Chưa có nút
  tạm dừng**: người muốn đọc kỹ một cảnh sẽ bị đưa sang cảnh kế sau khi cảnh diễn xong (muốn xem lại thì bấm clip đó).

## [web-premiere] - 2026-10-01 23:42 (UTC+7) - Cảnh diễn TRONG cửa sổ Premiere (khung pm-): Auto Cut + Podcast; làm chậm + mượt sân khấu - máy nhà

- **Bối cảnh:** anh xem bản 21:49: *"thiết kế UI thì đẹp nhưng layout từng section lại bị rời rạc"*, *"những con số và câu từ gây khó hiểu…
  người không phải editor không hiểu"*, rồi chốt hướng: *"em làm animation phải có thêm phần mềm vào để diễn tả… giống như 02 phần ở dưới
  rất dễ hiểu khi em đưa hoạt họa phần mềm vào"* (2 hình phần Vì sao có cửa sổ Premiere). Sau đó: *"animation quá nhanh người xem không hiểu"*.
- **Số đo trước khi sửa** (1920x1000, live): hình diễn chỉ phủ 26% ô (Auto Cut), 34% (Organize), 41% (Video Download), 44–58% phần lớn cảnh;
  mỗi cảnh diễn hết trong 1,3–1,5 giây khi lăn 1 nấc.
- **Đã làm:**
  - Khung dùng chung `pm-` (CSS + `pmKhung()` trước `const BUILD`): 3 bước chữ đời thường + cửa sổ "Adobe Premiere Pro" (Project | màn hình |
    Timeline | panel của tool) chiếm trọn ô; con trỏ bấm nút (`r.bam`), bước (`r.buoc`), chữ EN+VI qua `pmTxt` + `data-i`.
  - Cảnh 01 Auto Cut (`pmc-`): đầu đọc quét, chỗ im lặng đỏ lên, bị rút đi, timeline ngắn lại, đồng hồ 58:37 → 54:34, panel: 413 chỗ im lặng /
    ngắn đi 4 phút 03 giây / 0 chữ mất. Hết khối "um/uh" trong cảnh. Cảnh 02 Podcast (`pmp-`): 3 máy quay + 2 mic trên timeline, cắt theo người
    đang nói, màn hình chuyển theo, "Bản dựng mới" hiện trong Project.
  - Làm chậm + mượt (`cham.cjs`, theo bộ số agent đo): thẻ trượt .9 sine, `scrub 1`, snap tuyến tính theo `RATE .34`, `syncInterval 40`,
    `end` theo TOTAL, cảnh pm `step 2.2`, hệ số `CHAM` cho Short Viral 1.7 / Re-Frames 1.4 / Guide Frame 1.5 / Video Download + Power Bins 1.35.
  - Nút Notify trên thanh menu `min-width:148px` (đổi EN/VI từng đẩy cụm nút 42px).
- **Kiểm:** Auto Cut và Podcast diễn 6,66 s (trước 1,53 / 1,43 s), Short Viral 5,67 s, Transcripts 3,41 s, chờ thẻ vào 1,5–1,7 s; sân khấu
  9.180 → 10.151 px. 0 lỗi console; chụp cảnh 1, 2, 4, 12 + VI + điện thoại. Commit `a577947` (Podcast), `19a3f39` (Auto Cut) đã live, md5 khớp git.
- **Bẫy đo:** Chrome ngầm đột nhiên báo `prefers-reduced-motion: reduce` (Windows tắt hiệu ứng, có thể do đang điều khiển từ xa) → trang hiện
  lưới thẻ tĩnh, `__rp` không có, phép đo ra rỗng. `chup.mjs` nay ép `no-preference` (GIAM=1 để thử chế độ giảm). `nhay.js`: lần gọi đầu sau
  khi nạp trang ra sai thời điểm vì tween scrub còn chạy → thêm `gsap.killTweensOf(r.M)`.
- **[CHO] VIEC DAU TIEN ngay mai — cuộn khó kiểm soát:** sau bản làm chậm (live 23:45) anh báo *"phần scroll ở các section chính đang bị lỗi…
  scroll rất khó để kiểm soát các animation"*. Chưa đo, chưa sửa (anh đã bảo mai làm tiếp). Nghi: animation buộc vào cuộn (scrub) + trang tự trôi
  tới hết cảnh, nay trôi 6–8 s nên lăn chuột là mất lái. Đề xuất: tách animation khỏi cuộn (lăn 1 nấc = sang 1 cảnh, cảnh tự diễn theo thời gian
  rồi lặp, như 3 hình Vì sao). Lùi nhanh nếu anh cần: `git revert 7267808` phần `premiere/index.html` (trả thông số cuộn về `19a3f39`).
- **[CHO] mai làm tiếp:** 10 cảnh còn lại theo khung pm- (Transcripts, Short Viral, Re-Frames, Guide Frame, Video Download, Asset Manager,
  Power Bins, Organize, Keynote, Hub), anh chưa trả lời "kiểu này đúng ý chưa" · anh báo "thanh menu lỗi, light dark lỗi" nhưng chụp 4 tổ hợp
  không thấy vỡ, cần anh chụp màn hình · tiêu đề đầu trang còn diễn cắt "um/uh" (Auto Cut cắt khoảng lặng) · hình "Install once" vẽ một bộ cài
  chung chưa có thật · icon Short Viral còn là điện thoại dọc · thẻ lưới (bản giảm chuyển động) chưa soát lại câu chữ · chưa đo Safari/iPhone.
  Công cụ chụp khung hình đã chép vào repo: `Website/Nhap web ShotSave/cong-cu/` (chup.mjs, nhay.js, README). Các mảnh pm.css / pm.js /
  cut.* / pod.* chỉ là bản nháp ở scratchpad, mã thật đã nằm hết trong `premiere/index.html` (sửa thẳng ở đó, rồi chép đè sang nháp 3).

## [web-premiere] - 2026-10-01 21:49 (UTC+7) - Làm lại 4 cảnh tool + 3 hình "Vì sao" để người không làm dựng hiểu ngay - máy nhà

- **Bối cảnh:** anh duyệt trang /premiere/ từng cảnh: Podcast *"chưa diễn tả được Podcast là gì"*, Short Viral *"khó hiểu"*,
  Re-Frames *"người diễn tả bị xấu"*, Guide Frame *"vừa xấu vừa khó hiểu"*, 3 hình phần Vì sao *"nhìn vào cũng ko hiểu gì"* /
  *"cần show ra phần mềm mình đang dùng"*. Rồi: *"xong cái nào push code lên cái đó"*.
- **Cách làm:** workflow 42 agent: kiểm công dụng thật 4 tool (đọc CLAUDE/PROGRESS/mã từng panel) → mỗi chỗ 2 bản thử dựng
  trên bản sao trang + chụp Chrome ngầm (máy tính + điện thoại, EN + VI) → 2 giám khảo (người ngoài nghề / độ đẹp + sự thật +
  điện thoại) → 1 agent ghép bản cuối. Bộ nhân vật chung nv- (2 người, có miệng nói, tư thế cận / ngồi mic / đứng / đi) thay
  hình tròn + khối hộp. Gộp 7 bản cuối bằng git merge-file, giải 9 chỗ chồng bằng tay (từ điển VI, khối CSS điện thoại, 3 thẻ).
- **Sửa sai sự thật trên trang (theo kiểm công dụng):** ô số Podcast 588/588 "đúng người" → 411 lần đổi cam podcast 40 phút
  nghe lại không thấy sai (588 chỉ đếm cấu trúc) · why2p "hai cam" → "hai người" · Guide Frame 59 → 54 vùng, bỏ câu "đo từ màn
  hình thật từng app", animation không còn tự dời chữ (con trỏ "Bạn" kéo) · Short Viral bỏ điện thoại dọc + chữ trên hình (tool
  ra sequence ngang) · Re-Frames bỏ "sẵn sàng sau 3,9 giây". CHƯA SỬA: thẻ Podcast "ducks the music" nếu còn; hero + cảnh 1
  diễn cắt "um/uh" trong khi Auto Cut cắt khoảng lặng (chờ anh trả lời); icon sv vẫn là điện thoại dọc.
- **Kiểm:** mỗi bản cuối agent tự đo: 0 lỗi console, 0 gạch dài, chữ điện thoại ≥ 10px, 0 phần tử tràn ở 6–8 khổ. Sau khi gộp:
  chụp 7 cảnh + bản VI + điện thoại trên bản gộp, 0 lỗi console; 1 bộ nhân vật (bỏ 2 bản chép thừa). CHƯA làm: thông số cuộn
  mới (đo xong, đẩy đợt sau); soát lại 8 cảnh còn lại (bảng soát trong scratchpad audit/).

## [web-shotsave] - 2026-10-01 20:07 (UTC+7) - Web Shot & Save theo app 0.8.0: Quay video, Khay tự thu, cửa sổ Cài đặt mới, thanh công cụ 8 nút - máy công ty

- **Bối cảnh:** anh: *"cập nhật tính năng mới lên website đi em"*, rồi *"chiều nay mình mới làm hiệu ứng thu nhỏ khi không
  dùng đó"*, *"em cũng chưa cập nhật UI settings mới lên website"*, *"còn gì chưa đưa lên em phải đưa lên website chứ chuẩn bị
  bán hàng"*. Anh chọn **chỉ đẩy web** (mã app 0.8.0 vẫn là 3 commit trên máy công ty, chưa đóng gói, chưa push).
- **Rà app so với web (đo trước khi sửa):** web dừng ở 0.7.9 (29/09), 0 chỗ nhắc quay video / Khay video / nút tròn; cửa sổ
  Cài đặt trên web là bản 5 thẻ dựng 23/09, app đã đổi sang danh sách nhóm từ 0.7.6; thanh công cụ demo có 4 nút, app có 8.
- **Đã sửa** (`Website/AiO ShotSave Web/index.html`, một file):
  - **Rạp chiếu 11 → 13 cảnh.** Cảnh 12 *Quay video*: khoanh vùng, phím R, viền cam ngoài vùng + đồng hồ đếm giây thật +
    nút Dừng (chép `src/dem/quay.html`), MP4 bay vào Khay video (chép thẻ `.dai.vd`), phát lại, chọn Không tiếng. Cảnh 13
    *Khay tự thu*: chuyển động chép `src/dien/dien.js` + `__khayBung` của app (thu về kiểu xấp ảnh, nút đếm 1→5 rồi hiện tấm
    mới nhất; bấm nút, ống kính lướt tới chỗ khay, màn trập bung + nháy sáng), chạy chậm hơn app 1,6 lần. Phím R nhảy cảnh 12.
  - **Cửa sổ Cài đặt dựng lại** theo `src/settings` của 0.8.0: thẻ Bản quyền (trạng thái Đã kích hoạt, cập nhật trọn đời), 3
    nhóm Chụp ảnh / Khay ảnh / Lưu ảnh, 8 hàng, có hàng *Tự thu khay về góc sau 5s / 10s / 15s*. Chữ lấy nguyên `i18n.js`.
    Phim 5 bước → 6 bước (thêm bước tự thu), danh sách bên trái thêm dòng "Khay tự thu gọn".
  - **Thanh công cụ demo đầu trang:** thêm V, 5, S, R cho đủ 8 nút như app. Demo chỉ vẽ được 1–4 nên 4 nút mới đưa người
    xem xuống đúng cảnh của tính năng đó (`window.ssRapToi`). Ẩn trên điện thoại (thanh đã phải xuống 2 hàng).
  - 2 thẻ dự phòng trong lưới (f12, f13), thẻ giá "Chụp, quay, vẽ, ghim, kéo thả", mô tả trang thêm "or record".
- **3 lỗi CÓ SẴN lộ ra khi đo, sửa luôn:**
  - Chữ to trong cảnh đổi câu bị **lệch tâm**: GSAP đổi `translate(-50%,-50%)` ra px theo bề rộng câu ĐẦU, câu sau rộng khác
    là lệch. Đo: cảnh 9 "Mở lại…" lệch 31 px ở 360; cảnh mới bản EN lệch 138 px. Sửa: `gsap.set(ch, {xPercent:-50, yPercent:-50})`.
  - Tên "Shot & Save" trên thanh trên **bẻ 2–3 dòng** ở điện thoại 360–390 px (đo trên bản LIVE: logo cao 54–82 px thay vì
    44). Sửa: `nowrap` + dồn gọn dưới 480 px; dưới 360 px chỉ còn dấu logo.
  - `aria-label="What you pay"` không đổi theo ngôn ngữ.
- **Đo (Playwright headless + khung trình duyệt của Claude, máy chủ tĩnh 127.0.0.1:8126):**
  - Cảnh 9, 12, 13 ở 6 khổ (360, 390, 768, 1024, 1280, 1440) × VI/EN × 12 mốc phim: **144/144** không tràn sân khấu, không
    khối chữ đè nhau, hàng đầu thẻ video không tràn, chữ to lệch tâm ≤ 2 px. Thước này trước khi sửa đã bắt đúng 3 loại
    lỗi (thẻ video tràn 31–220 px ở sân hẹp, nhãn đè thẻ 17 px, chữ lệch tâm) → không phải thước mù.
  - Lăn chuột THẬT qua rạp (nấc 100 px): đi qua đủ **13/13** cảnh sau 92 nấc và ra khỏi rạp được; lăn ngược lùi cảnh;
    phím R → cảnh 12, phím S → cảnh 11.
  - Cửa sổ Cài đặt: **440 × 705 px** (app 440 × 700); 0 hàng tràn / đè ở 1280 và 360, VI và EN. Phim chạy thật trong khung
    trình duyệt đang hiện: đủ 6 bước rồi lặp (ghi phím → PNG làm mờ hàng chất lượng → Mờ mịn → 10s → 5s → thư mục → EN → VI).
  - Thanh công cụ demo: 8 nút `V 1 2 3 4 5 S R`, rộng 535 px trong khung 960 px; phím 2 vẫn đổi công cụ; bấm R → cảnh 12.
    Demo tự chạy: 3 ảnh vào khay sau 18 giây (khung trình duyệt đang hiện).
  - Cả trang: 0 gạch ngang dài trong 2.146 đoạn chữ + thuộc tính (2 ngôn ngữ, gồm shadow DOM); 0 lỗi console; cuộn ngang
    0 px ở 6 khổ; lưới thẻ dự phòng 13 thẻ không lẻ hàng (3-3-3-2-2).
- **Bẫy đo trong buổi:** (1) Playwright headless + chụp ảnh liên tục làm đồng hồ GSAP chạy chậm (7,6 giây thật = 0,9 giây
  phim) → đo cảnh bằng `tl.pause(); tl.time(t)` rồi chụp; (2) demo tự chạy và phim Cài đặt KHÔNG tiến trong headless, kể cả
  trên bản live (thước mù, không phải trang hỏng) → hai thứ này đo trong khung trình duyệt đang hiện.
- **CHƯA kiểm / chưa đúng với lời trên web, anh cần biết trước khi bán:**
  - Web giờ giới thiệu tính năng 0.8.0 trong khi **bộ cài mới nhất là 0.7.9** (chưa có quay video, chưa có khay tự thu).
    Phải đóng gói 0.8.0 trước khi người mua đầu tiên tải.
  - Thẻ Quay video ghi "kéo cả hàng thả vào khung chat hay ứng dụng khác": đường kéo có trong mã nhưng **chưa ai thả thử
    file MP4 vào Zalo / Messenger / Premiere**; Premiere có nhận MP4 phân mảnh hay không vẫn chưa đo (nên web không ghi tên
    Premiere cho video). "Trên Windows quay được tiếng máy": Mac chưa đo.
  - Khay tự thu: anh chưa thấy nó chạy trên màn thật lần nào. Anh đổi ý về chuyển động thì cảnh 13 phải làm lại.
  - Web chưa có nút Tải / chưa nhắc dùng thử 14 ngày (chưa có chỗ để bộ cài công khai).
  - Safari / iPhone thật chưa đo (máy chỉ có Chromium).

## [web-premiere] - 2026-10-01 19:52 (UTC+7) - Sửa chữ viền lộ đường nối bên trong (dải cam, chữ nền, số thứ tự) - máy nhà

- **Bối cảnh:** anh gửi 2 ảnh dải cam ("Auto Short Viral", "Auto Podcast" có vạch thừa trong chữ A, S, t): *"sửa cho anh
  cái này"*, rồi ảnh chữ nền "SAFE" ở cảnh Guide Frame: *"lỗi luôn"*.
- **Nguyên nhân thật:** Inter từ Google Fonts là font biến thiên, mỗi chữ ghép từ nhiều nét CHỒNG nhau. `-webkit-text-stroke`
  với ruột trong suốt vẽ viền của từng nét, nên lộ cả đường nối bên trong. Không phải lỗi CSS viết sai.
- **Đo trên bản cũ** (Chrome headless, hệ số 2, chữ 120px, đếm điểm mực nằm trong thân chữ đã co 4 điểm ảnh):
  dải cam lỗi **12/12 tên** (19.333 điểm) · chữ nền `.bgw` lỗi **9/12** (CUT, 9:16, HUB sạch: chữ không có nét chồng) ·
  số `.pn-no` lỗi **1/12** (04).
- **Đã sửa** (`premiere/index.html`, chép y hệt sang `premiere-nhap-3.html`):
  - Dải cam (nền một màu): ruột chữ tô trùng màu dải (`--mq-nen`), viền 3px, `paint-order:stroke fill` (ruột vẽ SAU viền
    nên che nửa trong và mọi đường nối, còn 1,5px viền ngoài). Đo: 19.333 → **0**.
  - Chữ nền + số (nền chuyển màu, không tô ruột trùng nền được): chữ đặc + bộ lọc SVG `#chu-vien` đặt đầu `<body>`
    (`feMorphology` nới 1,5px rồi `feComposite out` khoét thân chữ). Đo: 9.530 → 56 điểm, 1.013 → 8.
  - ☠️ **Lần sửa 1 trên trang thật vẫn hỏng:** màu cũ là `color-mix(... 55%, transparent)`. Bộ lọc khoét theo độ đặc
    của chữ, nên chữ đặc 55% chỉ bị khoét 55%, ruột còn ~25% màu (chữ "SAFE", số "06" hiện thành chữ đặc mờ). Trang thử
    của em dùng màu trắng đặc nên không thấy. Sửa: màu đặc `var(--c)`, phần trong suốt dồn sang `opacity`
    (`.bgw` .28 × .55 = **.154**, `.pn-no` .55 × .7 = **.385**). Đo lại bằng màu có độ trong suốt như trang thật:
    bản lỗi 571.546 điểm, bản sửa **24**.
- **Kiểm trên trang thật** (máy chủ tĩnh 127.0.0.1:8131, Chrome 152): phóng to chữ trên trang (chỉ để soi, không sửa
  file) thấy "Auto Podcast" và "SAFE" sạch, ruột trong suốt. **Cuộn 12 cảnh, so cũ/mới xen kẽ 3 lượt mỗi bản:** tổng
  5.011–5.532 ms vs 5.045–5.516 ms, khung hình khựng (LoAF) **0 và 0**, khung >20 ms 0–2 mỗi lượt ở CẢ HAI bản → bộ
  lọc không làm cuộn nặng thêm. (Thước rAF bị khoá theo tần số màn hình, không thấy chi phí của bộ dựng hình GPU.)
- **Bản điện thoại** https://claude.ai/artifact/RKgs9dfNu3U8sjM8z1MVV9 đăng đè (Version 2) bằng `tao-artifact.cjs` từ
  nháp 3. Bản đang đăng trước đó khớp từng dòng với bản cũ sinh lại (chỉ thêm phần vỏ do Claude bọc ngoài), bản mới
  khác đúng 12 dòng. Script báo "còn thẻ `<head`" là báo nhầm do khớp vào thẻ `<header`.
- **Bẫy đo trong buổi:** mở trang bằng `file://` trong khung trình duyệt của Claude thì sân khấu 12 cảnh KHÔNG chạy
  (đứng ở cảnh đầu, timecode 00:00:00:00) → phải mở qua máy chủ. Chụp Chrome headless cao hơn ~16.384 điểm ảnh bị cắt.
- **Chưa kiểm:** Safari / Firefox / iPhone (máy chỉ có Chrome, Edge). Nếu trình duyệt không nhận bộ lọc SVG thì chữ
  nền hiện thành chữ đặc mờ (không vỡ trang); nếu không nhận `paint-order` thì dải cam hiện viền dày 3px chồng lên chữ.

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
