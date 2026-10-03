# PROGRESS — AiO Studio (panel tổng)

## [mac-premiere] - 2026-09-30 21:05 (UTC+7) - DO TRONG PREMIERE TREN MAC

- Premiere Pro Beta 26.5, Mac i9 Intel + Radeon Pro 5500M, project thu Untitled.prproj, do qua cong go loi (CDP).
- Panel tong: thay du 11 panel (getExtensions), doi EN->VI ghi `{"lang":"vi"}` vao `~/Library/Application Support/AiOStudio/ngonngu.json`, 6 panel React doi VI theo. Mo 10 panel bang the: 10/10 len giao dien, duong dan extension dung `/Users/...`, host tra loi.

## [2.1.1+mac] - 2026-09-30 19:27 (UTC+7) - File ngon ngu chung tren Mac (CHUA do trong Premiere tren Mac)

- **Boi canh:** anh: *"ok em lam het 8 panel cho mac luon di"* (Mac Intel, Premiere Pro Beta 26.5).
- **Goc:** Mac khong co `APPDATA` -> `layAppData()` lui ve `~/AppData/Roaming` (thu muc Windows tren may Mac).
- **Da sua:** `hub.js layAppData` nhanh Mac -> `~/Library/Application Support`, file chung thanh
  `~/Library/Application Support/AiOStudio/ngonngu.json`. Sua CUNG LUC o `design-system/ngonngu.tsx` (+6 ban chep
  trong client/src cua cac panel React) va `design-system/ngonngu-chung.js` (+3 ban chep dist) -> ca bo cung mot file.
  Windows khong doi (van `%APPDATA%\AiOStudio\ngonngu.json`).
- **Kiem (Node, ham duongDan cua ngonngu-chung.js):** darwin -> `/Users/u/Library/Application Support/AiOStudio/ngonngu.json`;
  win32 co APPDATA va khong co APPDATA -> `C:\Users\u\AppData\Roaming\AiOStudio\ngonngu.json` (nhu cu).
  7 ban ngonngu.tsx cung md5, 4 ban ngonngu-chung.js cung md5. `node --check hub.js` dat.
- **Soi them:** trang thai da cai doc bang `getExtensions()` (khong phu thuoc he dieu hanh); Shot & Save da co nhanh
  Mac (`/Applications/AiO Shot & Save.app`, mo bang `open -a`). Khong con cho nao chi chay Windows.
- **Chua kiem:** trong Premiere tren Mac (12 the, mo panel, doi VI/EN lan sang cac panel).

## [2.1.1] - 2026-09-27 20:34 (UTC+7) - Tang so phien ban

- manifest 2.1.0 -> 2.1.1 (mac dinh ngon ngu 'en' cua hub.js). Luat /xong 2b (push = tang so). Thay doi cua phien 27/09 da bi phien Shot & Save gom vao commit e62ec52 va push khi chua tang so; nay tang bu.

## [2.1.0+] - 2026-09-27 18:03 (UTC+7) - Kiểm trên Premiere MÁY NHÀ + sửa mặc định ngôn ngữ

- **Bối cảnh:** anh nhờ kiểm panel tổng trên máy nhà (vừa cài lại cả bộ 27/09 17:4x — 8 junction cũ
  trỏ đường dẫn trước lần sắp xếp 14/08, chết im lặng; Video Download chưa cài vì thiếu yt-dlp/FFmpeg).
- **Đo qua cổng 8101 (Premiere 27.0.0, project Tập2.prproj):** 12 thẻ, trạng thái khớp máy (10 có,
  Video Download "Chưa cài", Organize "Sắp có"), 0 phần tử tràn ở 1867×794. Bấm 9 thẻ → 9/9 panel mở,
  161–323 ms, cả 9 lên giao diện thật (đọc đúng project). Lần bấm đầu Power Bins mở chậm > 8 s.
  Video Download / Organize bấm ra đúng câu báo. Chữ cắt đuôi: 1 thẻ ("Nhạc nền và hiệu ứng âm thanh",
  thiếu 2 px ở khổ 6 cột).
- **Lỗi thật đã sửa:** `hub.js` mặc định `'vi'` trong khi cả bộ mặc định `'en'` (`design-system/ngonngu.tsx`
  MAC_DINH, anh chốt bán ra nước ngoài). Máy chưa có `ngonngu.json` (máy khách mới cài, máy nhà) →
  panel tổng tiếng Việt, 9 tool tiếng Anh. Đổi thành `'en'`. Đo sau khi nạp lại: nút EN, thẻ "Cut silences";
  bấm VI → ghi `{"lang":"vi"}` → Autocut/Transcripts/Asset/Power Bins đổi VI trong ≤ 3 s.
- **[CHO] Chưa sửa (ngoài panel tổng):** Podcast, Re-Frames, Guide Frame có nút EN riêng nhưng KHÔNG đọc
  `ngonngu.json` (grep 0) → không theo cả bộ; Music chỉ có tiếng Việt.

## [2.1.0] - 2026-09-25 16:45 (UTC+7) - ĐO THẬT trên Premiere: 10/10 tool mở được · đồng bộ UI với web Shot & Save · animation "vào" lúc mở panel

### Trạng thái hiện tại (phiên sau đọc đầu tiên)
- **2.1.0 đang chạy trong Premiere máy công ty** (junction → thư mục này, reload panel là nhận; manifest 2.1.0 chỉ được
  đọc lại khi khởi động Premiere, không ảnh hưởng chạy). Chưa push git — ☠️ **cả thư mục `AiO WELCOME/` vẫn
  UNTRACKED** (`git status` ra `??`), `/xong` phải `git add` trọn thư mục.

### Bối cảnh (3 tin nhắn của anh trong một buổi)
1. *"tiếp theo em làm panel AiO Studio tổng này nha em, kiểm tra xem toàn bộ tool có hoạt động không, tiếp đến tối ưu
   hóa và animation về UI"* 2. *"anh muốn làm đồng bộ UI với website UI/UX của https://aio-shotsave.vercel.app/ anh thích
   animation của trang web này"* 3. *"anh muốn Panel UI khi mở lên cũng có animation tương tự như vậy"*.

### 1. Kiểm 12 tool trên Premiere THẬT (script `thu-mo-tool.mjs`: bấm thẻ qua cổng 8101, chờ cổng debug của tool sống, rồi đóng bằng `closeExtension` của chính nó)
| Tool | Kết quả |
|---|---|
| Autocut · Podcast · Short Viral · Re-Frames · Transcripts · Asset Manager · Power Bins · Video Download · Music | **MỞ ĐƯỢC**, 458–486 ms mỗi cái, đóng lại được |
| Guide Frame | đang mở sẵn (anh dùng) |
| Shot & Save | app đang chạy sẵn (3 tiến trình) → bấm không mở thêm tiến trình, panel báo "Đang mở Shot & Save…"; **ca app chưa chạy chưa đo** |
| Auto Organize Folder | "Sắp có", đúng |
Premiere `getExtensions()` trả 11 ext AiO; phiên bản panel đọc **11/11 khớp manifest trên đĩa** (Guide Frame 0.3.1, Podcast 0.1.0…); 0 thẻ "Chưa cài".

### 2. Đồng bộ UI với web (hub.css viết lại)
- Token đọc từ HTML **live** 25/09 (md5 `c52b6062`, khác bản git `0f5eae39`): tối `--bg #141210 · --surface #1f1b18 ·
  --line #2e2925/#3b352f · --ink #f6f1ec/#cfc6bd/#a89e94 · --brand-soft #2d1d12 · --brand-ink #ffb58a · --glow ·
  --shadow · radius 20`; sáng `#fff / #fbf8f5 / #ece6e0 / #16110d…`. Thẻ = `.card` web (viền inset, bóng khi rê, không
  nhảy), chip đang chọn = `.btn-main` (cam đặc, hover đậm `#e0560f`, glow), nhãn banner = `.eyebrow`, ô tìm/nút = bg-soft
  + inset line. **Giữ "mỗi tool một màu"** (anh chốt 22/09). Nút **Nền sáng / Nền tối THẬT** (localStorage `aio-theme`,
  mặc định tối vì nằm trong Premiere tối; 11 panel tool vẫn tối). Thanh trên có vạch dưới khi cuộn (`header.scrolled`).
- Bỏ gạch dài "—" khỏi mọi chuỗi UI (luật 22/09): đo trên panel thật **0** text node / title / aria-label có "—" ở cả VI và EN.
- Tối ưu: `focus` không vẽ lại nếu danh sách cài / phiên bản / app không đổi (trước: vẽ lại mỗi lần focus → nháy, mất
  trạng thái rê chuột, và với 2.1.0 sẽ chạy lại animation).

### 3. Animation "vào" (keyframes chép từ web: `vao-hero`, `vao`, `ico-nen`; thêm `ico-vao`, `hien`)
- Nhịp: thanh trên 0→315 ms (45 ms/phần tử) · eyebrow .08 s · tiêu đề .2 s · phụ .32 s · khối 3D .44 s · chip .3 s +
  30 ms/chip · thẻ 260 ms + 55 ms/thẻ (icon nảy +120 ms) · thanh icon 80 + 40 ms/ô; ease `cubic-bezier(.2,.8,.2,1)` của web.
  Chỉ chạy khi `#hub.khoi-dong` (lần vẽ đầu của mỗi dạng; đổi dạng lưới↔thanh cũng chạy), gỡ bằng `setTimeout` 2,2 s
  (không chờ `animationend`, bài 5ao). Lọc/tìm: thẻ `.moi` 220 ms. Rê chuột: icon `ico-nen` như thẻ tính năng web.
  `prefers-reduced-motion`: tắt hết.

### Kiểm chứng
- **Panel thật** (8101, dạng thanh dọc 132×392): sau reload nền `rgb(20,18,16)`; kích lại đường mở, ghi opacity mỗi 80 ms:
  ô đầu 0 → 0,71 (181 ms) → 1 (514 ms); ô cuối bắt đầu ở 514 ms → 1 ở 1.021 ms; `--tre` 80…520 ms đúng 12 ô; lớp
  `khoi-dong` gỡ ~2,2 s. ☠️ **Bắt được lỗi**: keyframe khai `to{opacity:1}` làm ô "Sắp có" (opacity .5) sáng 1 suốt
  animation rồi tụt về .5 lúc gỡ lớp (nháy ở 2,2 s) → đổi sang chỉ khai `from` (đích = giá trị gốc); đo lại sau reload:
  Organize giữ **0,5**, keyframe trong stylesheet đúng bản mới.
- Nút nền: bấm → `light`, bg `rgb(255,255,255)`, aria-label "Nền tối", localStorage `light`; bấm lại → `dark`. Focus giả
  → DOM không đổi (không vẽ lại). Tràn ngang 0.
- **Bàn 11 khung** (iframe đúng cỡ, máy chủ tĩnh 8123, trình duyệt trong app): dạng đúng 11/11 (1280→4 cột + banner + khối;
  960→3; 700→3; 380/359/340→2; 339/300/72→thanh dọc 12 ô; 1280×64 và 600×200→dải ngang), **0 px tràn** (hub + document),
  **0 tên bị cắt**, banner chỉ ở rộng+cao; lúc 320 ms **25/25** (lưới) và **12/12** (thanh) phần tử đang mờ = animation
  đang chạy; 2,8 s: 0 phần tử mờ, `khoi-dong` đã gỡ; nút nền ở khung 1280 đổi trắng/tối đúng.
- `node --check` sạch; 0 byte CR/chuông; CSS không dùng `color-mix` / `:has()` / `@container` (CEF của CEP 12 ≈ Chromium 99).

### Chưa
- Shot & Save khi app CHƯA chạy (đường `spawn`) chưa đo hôm nay · anh dùng thật · chuông / tài khoản vẫn "sắp có" · font
  Caveat chưa đóng gói · đổi tên thư mục chưa chốt · `git add` cả thư mục.

## [2.0.0] - 2026-09-22 14:17 (UTC+7) - VIẾT LẠI Welcome Hub thành panel tổng theo thiết kế anh chốt

### Trạng thái hiện tại (phiên sau đọc đầu tiên)
- **2.0.0** đã nối vào Premiere máy công ty (junction `%APPDATA%\Adobe\CEP\extensions\com.aiostudio.hub`
  → thư mục này). [CHỜ ANH] **tắt/mở lại Premiere** (Beta mở từ 13:33, trước khi nối) rồi
  Window → Extensions → **AiO Studio**. Sau đó đo thật qua cổng **8101**: danh sách đã cài,
  phiên bản, bấm mở từng tool.
- Chưa push git (chờ anh bảo / `/xong`).

### Bối cảnh
Anh: *"Dạng 2 · Lưới thẻ — panel mở rộng — chốt dạng này và style này nha em · làm và import
vào PR anh xem luôn nhé"* kèm ảnh Option 2. Thiết kế + quyết định: CLAUDE.md gốc mục 3 (21–22/09).

### Nguyên nhân thật của Welcome Hub cũ không dùng được (đo 21–22/09)
- 7/7 nút gọi ID sai `com.aio.<tên>` (thật: `com.aiostudio.<tên>.panel`) → bấm không mở gì.
- Chỉ 7/12 tool, cửa sổ Modeless 1020×720 (không dock được), chưa cài ở đâu.
- **Chưa từng lên git**: `.gitignore` mở ngoại lệ cho `AiO WELCOME Page/dist/` (không tồn tại),
  còn `AiO WELCOME/dist/` bị `dist/` nuốt. Đã sửa `.gitignore`; bản cũ cất `_archive/welcome-hub-1.5.0-0308/`.

### Đã làm
- `CSXS/manifest.xml` mới: `com.aiostudio.hub` 2.0.0, Panel dock được, Menu "AiO Studio", MinSize 56×56.
- `.debug` cổng 8101. `dist/index.html` + `hub.css` + `hub.js` viết tay. Logo thật (website), Inter (md5 khớp bộ thiết kế).
- Dữ liệu thật: getExtensions + manifest từng panel; Shot & Save theo file `.exe`; ngôn ngữ theo file chung.

### Kiểm chứng (trình duyệt + Premiere GIẢ LẬP — chưa phải Premiere thật)
- `node --check hub.js` sạch · 0 byte CR/chuông · `\n` trong chuỗi giữ nguyên.
- 11 kích thước đo trong **iframe đúng cỡ**: 1280×720 → 4 cột + banner + khối 3D (chữ cách khối 142px);
  960×640 → 3 cột; 700×500 → 3 cột; 380×900 → 2 cột; 359/340 → 2 cột; 339/300/72×900 → thanh dọc 12 icon;
  1280×64, 600×200 → dải ngang. Tất cả: **0px tràn ngang, 0 tên bị cắt**.
- Bấm (giả lập): Autocut → `com.aiostudio.autocut.panel`, Short Viral → `com.aiostudio.shortviral.panel`;
  Music (giả lập chưa cài) → không mở, báo "chưa cài"; Organize → "sắp có"; lọc "Tài nguyên" → 4 thẻ;
  tìm "phu de" → Transcripts; VI↔EN đúng, ghi `aio-lang`.
- **Thước đã sai 3 lần trong buổi, đều bắt được**: (1) rAF đứng yên ở tab ngầm → banner ẩn ở 1280 (sửa CODE:
  đổi sang setTimeout); (2) khung trình duyệt < 768px giả lập điện thoại → 380 ra 980×2321; (3) Chrome headless
  ép cửa sổ ≥ ~512px → 380/300/72 đều ra 512. Thước đúng: iframe.
- Lỗi thật đo ra + đã sửa: 700px thẻ đứng 4 cột cắt tên (min 150 → 170px); 340px chỉ 1 cột, cuộn 1.045px
  (→ `min(170px, 50% − 5px)`: 2 cột, cuộn 308px, tên dài xuống 2 dòng); dải ngang 600px tràn 309px mà con lăn
  dọc không cuộn (→ đổi wheel dọc thành cuộn ngang).
