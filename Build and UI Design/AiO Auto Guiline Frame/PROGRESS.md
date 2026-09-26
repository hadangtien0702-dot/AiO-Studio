# PROGRESS — AiO Auto Guiline Frame

## 2026-09-26 16:35 — VÒNG ĐO 10 APP LẦN 1 CHẾT VÌ HẾT HẠN MỨC; LẬP BỘ TÍCH HỢP TỰ ĐỘNG, CHẠY LẠI LẦN 2

**Bối cảnh.** Workflow 10 agent đo (đường B, ảnh app thật) chạy ~10:0x, **cả 10 agent chết cùng lúc vì hết hạn mức
phiên** ("session limit, resets 1pm") sau khi đã tải 137 ảnh (172 MB) nhưng chưa trả kết quả; 2,5 triệu token mất
trắng. Anh: *"Try again"*. Hạn mức reset 13:00, chạy lại lúc 16:33.

**Nguyên nhân thật.** Agent làm cả 3 việc (tìm + tải + đo) trong một lượt dài, không ghi kết quả trung gian ra
đĩa → chết là mất hết. Ảnh tải về thì còn (trên đĩa), nên vòng 2 chỉ cần đo.

**Thay đổi.**
- Vòng 2 (`wf_7b732065-42c`, 10 agent, 1 pha): dùng ảnh CÓ SẴN trong `scratchpad/anh-app/<id>/`, không tải thêm,
  **ghi `ket-qua.json` ngay sau khi đo xong** (trước khi soạn đề xuất) để chết giữa chừng vẫn còn số; bỏ 10 agent
  phản biện (tiết kiệm hạn mức) — thay bằng ghép chồng kiểm của em. Đầu ra bắt buộc theo đúng định dạng `MOCK_DO`.
- `dist/ve-guide.js`: thêm 2 dòng đánh dấu `BAT DAU/KET THUC MOCK_DO SINH TU KET QUA DO` để script ghi đè bảng.
- `scripts/do-anh-that/ap-ket-qua.mjs` (mới): đọc kết quả agent → in bảng duyệt (đo thật % / hiện tại / đề xuất,
  cảnh báo `!!` nếu đề xuất nhỏ hơn đo thật) → `--ap` ghi `MOCK_DO[id]` vào ve-guide.js + vùng vào safe-zones.json
  (pt/px1080 tính lại, `trangThai` ben_thu_3, `nguon` nối cách đo; **không bao giờ ghi số nhỏ hơn số đo**) → `manifest.json`.
- `scripts/do-anh-that/ghep-tat-ca.py` (mới): theo manifest, ghép `guide-<id>.png` lên ảnh app thật (gọi
  `ghep-app.py`) + montage 5 ảnh/hàng. Harness `ve-shorts.html` thêm `veTatCa()` vẽ 17 định dạng gửi lên `/luu`.

**File ảnh hưởng:** `dist/ve-guide.js` (chỉ 2 dòng đánh dấu), `scripts/do-anh-that/ap-ket-qua.mjs`, `ghep-tat-ca.py`.

**Kiểm chứng bằng số.** `node --check` ve-guide.js + ap-ket-qua.mjs sạch, `ast.parse` ghep-tat-ca.py sạch. Kho ảnh
đã kiểm kê: 10/10 app có ≥ 1 ảnh khung thiết bị thật (1242×2688 / 1284×2778 / 1290×2796 / 1080×1920…), 3 app có
sẵn script đo dở của agent. Chưa có số đo nào được áp — chờ vòng 2.

## TRẠNG THÁI HIỆN TẠI (cập nhật 2026-09-26 16:35)

- **Phiên bản:** v0.3.1 (manifest · `gf_phienBan()` · `PHIEN_BAN`; huy hiệu đọc từ `PHIEN_BAN`). Đã cài máy công ty.
- **Dữ liệu safe zone:** chỉ **YouTube Shorts** đã đo từ ảnh app thật (25/09, iPhone của anh). **12 định dạng có mock
  còn lại đang dùng số từ tài liệu = CHƯA KIỂM** (anh 26/09: *"em đã lấy thông số ảo để áp vào"*, bài brain `5bf`).
- **Đang chạy (26/09 16:33, vòng 2):** workflow 10 agent đo trên 137 ảnh app thật đã tải (vòng 1 chết vì hạn mức).
  Kết quả về → `ap-ket-qua.mjs` duyệt + ghi `MOCK_DO` + `safe-zones.json` → `veTatCa()` + `ghep-tat-ca.py` ghép
  chồng kiểm 10 app → cài → ghi sổ. Ảnh tạm 172 MB trong scratchpad, xong sẽ xoá, giữ ảnh đã dùng.
- Việc chờ anh: 3 ảnh YouTube (góc người xem · iPhone 15/16 hoặc Android · máy anh sau khi tắt Zoom to fill).

## 2026-09-26 11:47 — MOCK UI CHUYỂN SANG BẢNG TOẠ ĐỘ ĐO ĐƯỢC (`MOCK_DO`) + bộ ghép chồng dùng chung cho mọi app

**Bối cảnh.** Anh: *"Vậy tính ra các nền tảng khác cũng bị sai luôn chứ đâu phải mỗi mình YouTube"* rồi *"Sửa lại
toàn bộ chưa?"* và chọn đường **B** (em tự lấy ảnh giao diện app thật từ App Store / Google Play / trang chính
thức, đo, sửa; anh đối chiếu bằng máy mình sau). Để 10 kết quả đo đổ thẳng vào panel mà không viết lại 10 hàm vẽ,
cần đổi cách vẽ mock.

**Nguyên nhân thật.** `UI_THAT.<app>` là 13 hàm vẽ tay, toạ độ nằm rải trong code theo cảm tính (`W*0.07`,
`H*0.815`…), không có chỗ nào để "đổ số đo vào" — nên mỗi lần có ảnh thật lại phải sửa code, và không ai đối chiếu
được số trong code với số đo. Chính vì vậy YouTube sai suốt từ 02/08.

**Thay đổi.**
- `dist/ve-guide.js`: thêm bảng **`MOCK_DO[id]`** = danh sách phần tử `{t, x, y, w, h, s, nhan, mo}` (toạ độ % của
  1080×1920, đọc thẳng từ ảnh) + bộ vẽ chung **`veMockData()`** (19 loại: tim, binhluan, luudau, chiase, lap,
  bacham, kinhlup, back, x, avatar, dia, oNhac, not, chu, pill, dongMo, progress, hatch, tienTrinh). `veUiThat()`:
  app có trong `MOCK_DO` thì vẽ từ bảng, chưa có thì rơi về hàm cũ. YouTube Shorts đã chuyển sang bảng (16 dòng).
- `scripts/do-anh-that/ghep-app.py`: ghép guide lên ảnh chụp của **bất kỳ app** theo hình chữ nhật vùng video +
  mapping (`fill` phủ kín chiều cao / `fit` vừa bề rộng / `khit`), thay cho `ghep-shorts.py` chỉ dành cho YouTube.

**File ảnh hưởng:** `dist/ve-guide.js`, `scripts/do-anh-that/ghep-app.py` (mới). Chưa cài đè (chờ gom cùng 10 app).

**Kiểm chứng bằng số.** `node --check` sạch. Vẽ yt-shorts bằng bảng vs bằng hàm cũ trên cùng khung 1080×1920: **0,97%
điểm ảnh khác (5.028/518.400)**, tập trung ở hàng dưới cùng (nét chữ Subscribe / vạch tiêu đề do làm tròn %),
cột icon và hàng trên không khác. Ghép bản bảng lên ảnh anh bằng `ghep-app.py` (vùng 0,0–1290,2553, fill): trùng icon
như bản 21:54. Workflow lúc 11:46: 10/10 agent đo đã tải **137 ảnh (172 MB)** cho 10 app — nhiều hơn 10–20 ảnh đã
xin anh vì agent lấy cả bộ ảnh App Store để chọn; xong sẽ xoá, chỉ giữ ảnh đã dùng.

## 2026-09-25 21:28 — YOUTUBE SHORTS: KHUNG SAI, SỬA THEO ẢNH CHỤP THẬT CỦA ANH (anh: "Khung guideline frames youtube short chưa đúng")

**Bối cảnh.** Anh gửi ảnh chụp màn hình video của anh trên YouTube Shorts (iPhone 1290×2796, góc chủ
kênh). Em đo pixel (Python/PIL) rồi vẽ guide của panel chồng lên ảnh theo đúng cách iPhone hiện video
(phủ kín chiều cao 0..2545, cắt 53 px nguồn mỗi mép) → thấy ngay: cột icon phải thật nằm NGOÀI vùng đỏ
10% và mock icon của panel vẽ tâm ~94%W nên bị cắt khỏi màn, bắt đầu 46%H trong khi thật 59,8%H; hàng
trên panel vẽ 4,5%H trong khi thật 9,7%H; chữ dưới-trái panel vẽ từ 4,5%W (bị cắt) trong khi thật 8,5%W.
Bảng đo đầy đủ: `nghien-cuu-safe-zone.md` mục 2a.

**Đã sửa.**
- `safe-zones.json` yt-shorts: top 10 → **12%** (230 px), right 10 → **17%** (184 px), bottom giữ 25%,
  thêm **left 6% loại crop** (mép bị điện thoại cắt); `trangThai` các cạnh đo = `ben_thu_3`, `nguon` ghi
  cách đo. 53 → **54 vùng**, `sinh-du-lieu` ĐẠT, panel đã cài (`sign-install`) + reload: panel đọc
  `top=12,bottom=25,right=17,left=6`.
- `dist/ve-guide.js` `UI_THAT.shorts`: vẽ lại theo toạ độ đo (back/search/3 chấm 9,7%H; cột phải tâm
  88,3%W, 5 icon từ 59,8%H bước 7,1%H + đĩa 95,9%H, bỏ avatar trong cột; avatar + tên + Subscribe
  79,4%H, tiêu đề 83,4%H, dòng nhạc 86,5%H, chữ từ 8,5%W). Góc NGƯỜI XEM, cùng toạ độ góc chủ kênh.
- Bộ đo giữ lại trong `scripts/do-anh-that/` (đo ảnh, harness vẽ guide, máy chủ tĩnh, ghép chồng) để
  lần sau anh gửi ảnh app khác là đo được ngay. Ảnh gốc của anh chép vào `Test Media/` (ngoài git).

**Kiểm chứng.** Ghép chồng bản mới lên ảnh thật (`shorts-truoc-sau.jpg` gửi anh 21:27): tim/bình
luận/lưu/chia sẻ/remix/đĩa giả trùng icon thật; hàng trên trùng; avatar + tên + Subscribe trùng hàng kênh;
vùng đỏ phải phủ trọn cột icon; dải gạch chéo trái đúng phần bị cắt. `node --check ve-guide.js` sạch.
**21:32 — 2 agent đo lại ĐỘC LẬP (phương pháp khác: mode màu nền nav, texture theo hàng, bbox theo
ngưỡng sáng) khớp số của em:** navTop **2553** (em lấy 2545 = vạch sáng seek bar, lệch 0,3%), phủ kín
chiều cao xác nhận bằng 3 bằng chứng (257/260 hàng vùng 2293–2553 còn texture; mép cột x 1250–1290 có
hình; fit-width thì navTop quy về 2137 > 1920 vô lý), cắt **55 px nguồn mỗi mép**; top 208–209 px,
right 175 px (16,2%), bottom 435 px (chủ kênh), left 91 px; tâm cột 952,5 px; 6 phần tử cột cùng tâm x
1193,5 ± 0,5, bước 178 px màn. Em tinh chỉnh mock (xT 8,4%W · tim 59,6%H · bước 7,0%H · đĩa 95,6%H),
cài lại + reload panel, đo lại bằng số: **tâm 6 icon giả lệch tâm icon thật −1…−12 px màn hình (≤ 9 px
nguồn, icon cao 58 px), tâm cột lệch 1 px.** Vùng: right 17% = 184 px > 175 px đo (biên 9 px).
**21:5x — nhóm agent xong (9 agent, 2,1 triệu token, 30 phút): 3 nghiên cứu + 1 tổng hợp + 3 phản biện
(2/3 bác bỏ có lý). Em sửa theo, cài đè lần cuối 21:54, panel đọc `top=13,bottom=25,right=18,left=7`:**
- **Phản biện 1 (đúng):** UI YouTube neo theo pt, ảnh anh là Pro Max (máy CAO nhất = ca dễ nhất); iPhone
  15/16 (852 pt) hàng icon trên chiếm ~12,0%H → 12% hết dư → **top 13%** (250 px). Phải: iPhone 15/16 dư
  12 px, 13 mini 3 px, Android 20:9 (tính hình học) 5–7 px → **18%** (194 px, trùng 192 px của PNG Google);
  nhãn cột theo ngôn ngữ app (Share / Compartir…) chưa đo.
- **Phản biện 2 (không bác được mapping):** 4 bằng chứng phủ-kín: không có đường nối sắc→mờ tại y 2293
  (loại letterbox + blur), ảnh gamma thấy vải liền tới 2543, hàng 0–60 có 460–520 màu (video sau status
  bar), fit-width cho navTop → 2240 > 1920 vô lý. Sửa số trong sổ: navTop **2553**, cắt **55 px = 5,1%**.
  Cảnh báo giữ lại: giả định cắt ĐỐI XỨNG + iOS "Zoom to fill screen" tắt — chưa kiểm.
- **Phản biện 3 (đúng, quan trọng nhất):** khối dưới-trái trong ảnh là góc CHỦ KÊNH, bắt đầu cao (77,3%H)
  vì bị 3 hàng riêng (AI / Bị chặn / nút Chia sẻ video của bạn ~300 px) đẩy lên; NGƯỜI XEM chỉ có 3 hàng,
  neo đáy → khối bắt đầu ~85,8%H. Mock vẽ theo góc chủ kênh sẽ lệch 80–160 px so với màn người xem. Sửa:
  mock khối dưới vẽ theo góc NGƯỜI XEM neo đáy (nhạc 95,6%H ngang ô nhạc cột phải · tiêu đề 91,5%H · avatar
  + tên + Subscribe 87,6%H), ghi rõ ƯỚC trong mã; vùng bottom 25% phủ cả hai góc.
- Nghiên cứu: không nguồn web 2026 nào cho toạ độ từng phần tử (chỉ dải mép, lệch nhau 120–380 / 300–672 /
  96–200); **PNG chính thức Google tải + đo PIL = 288/672/48/192 nhưng file in chữ "Vertical Video ADS Safe
  Zone"** — 5 site chép nhầm thành số organic, không dùng; Google 13547298 còn nói "without cutting off your
  content" trái với 5,1% đo được. Left **7%** crop (Android 20:9 ~6,2% hình học; 21:9 ~9% chưa phủ).
- Mock thêm: mũi tên Back tâm 10,6%W, ô nhạc vuông bo góc 72 px (thay đĩa 88 px), avatar 72 px, tên từ
  183 px, pill Subscribe cao 72 px, tiêu đề rộng 71%W, Phối lại mờ 60%, gạch chéo mờ dải cắt phải 5,1%.
- Đo lại lần cuối: tâm 6 icon cột phải giả vs thật lệch ≤ 12 px màn; khối dưới CỐ Ý thấp hơn ảnh chủ kênh
  (góc người xem). Ảnh so sánh `shorts-truoc-sau.jpg` cập nhật.
- **Xin anh 3 ảnh để khoá số:** (1) Shorts góc NGƯỜI XEM (tài khoản khác / máy khác), (2) iPhone 15/16 hoặc
  Android, (3) máy anh sau khi tắt Settings → General → Display Zoom / "Zoom to fill" nếu có bật.

**Chưa:** ảnh góc NGƯỜI XEM và ảnh Android (cắt mép nhiều hơn) chưa có; TikTok / Reels mock vẫn là
"minh hoạ" chưa đo từ ảnh thật — anh gửi ảnh chụp là em đo y hệt.

## 2026-09-25 16:1x — RÀ SOÁT SAFE ZONE LẦN 2 (anh: "truy quét lại các frame trên các nền tảng… đúng vị trí, kích thước, an toàn")

> ☠️ **GHI THÊM 26/09 09:5x — lần rà này SAI PHƯƠNG PHÁP.** Nó chỉ đọc lại tài liệu (6 trang chính thức
> + nguồn 2026) và kết luận "17/17 không đổi số"; **5 giờ sau ảnh chụp thật của anh cho thấy YouTube Shorts
> sai** (cột phải 10% vs 16% thật, icon giả ngoài màn). Anh: *"Em không đo hình ảnh thực tế từ sản phẩm mà
> em đã lấy thông số ảo để áp vào."* Kết luận "không đổi" bên dưới chỉ có nghĩa **"spec không đổi"**, KHÔNG
> có nghĩa khung đúng. Bài học brain `5bf`. Trạng thái thật của 17 định dạng: chỉ YouTube Shorts đã đo từ
> ảnh sản phẩm; 12 định dạng có mock còn lại **chưa kiểm được** tới khi có ảnh chụp app thật.

Anh xác nhận trước đó: *"anh bấm và thấy nó lên rồi đó em"* (0.3.1 chạy trên bài thật).

**Cách rà:** đọc lại TRỰC TIẾP 6 trang chính thức trong `nguonRaSoat` (Meta IG Reels, FB
Reels, FB Stories, TikTok ads specs, Google Shorts ads, Pinterest specs) + tìm nguồn 2026 cho
Snapchat (trang Snap render JS không đọc được), LinkedIn, X, Zalo, lưới IG. So từng số với
JSON bản 01/08/2026. Bảng đầy đủ + nguồn: `nghien-cuu-safe-zone.md` mục 17.

**Kết quả: 17/17 định dạng, 53 vùng — KHÔNG con số nào đổi.** Đáng chú ý: Meta vẫn 14/35/6
cho Reels (độ phân giải khuyến nghị nay 1440×2560); FB Stories vẫn "14% (250 px) / 20% (340
px)", mâu thuẫn với Reels chưa được Meta sửa sau 2 tháng; TikTok trang vẫn bản 06/2026, HTML lộ
5 link .zip template chính thức (chưa tải, cần anh gật); Snapchat ngoài 150/330 còn Story Ad
tile 175/269 và Collection 150/450 (format khác, ghi chú, không áp).

**Đã sửa:** `safe-zones.json` — `phienBanDuLieu` 2026-08-01 → **2026-09-25**, `raSoatTiepTheo`
→ **2026-12-25**, thêm 3 URL vào `nguonRaSoat`, 17 dòng `nguon` nối "ra lai 25/09/2026: …",
ghi chú Snapchat. Script vá tự đối chứng: **53/53 pt/px1080 trước = sau**. `sinh-du-lieu`:
ĐẠT 10/17/53, `dist/safe-zones.js` 19.050 byte. Cài đè + reload panel 16:08, đọc
`window.SAFE_ZONES` của panel đang chạy trong Premiere qua cổng 8096 rồi so với JSON nguồn:
**53/53 vùng khớp (pt, px1080, loại, trạng thái), 0 lệch, phiên bản panel = 2026-09-25.**

**Còn mở:** (1) đo pixel trực tiếp file template chính thức TikTok (.zip ~84 KB) + ảnh vùng đỏ
của Google — là TẢI FILE, chờ anh gật; (2) `zalo-916` phải 12% vs thiết kế 12,96% — vẫn chờ
anh chốt; (3) kỳ rà tiếp 25/12/2026.

## 2026-09-25 13:48 — v0.3.1: HẾT TRACK TRỐNG THÌ TỰ THÊM TRACK (anh: "add không được em à")

**Bối cảnh.** Anh dựng bài thật (`Tap_1_Hay_Yeu_Thuong_Nhau`, sequence 11 track video,
V1–V11 đều có clip trong vùng In/Out 0–1:36), bấm *Show safe zone* → hộp đỏ "No empty
video track left. Add a video track in Premiere and try again…". Anh chụp màn hình:
*"add không được em à"*.

**Nguyên nhân thật (đọc `gf_datOverlay`).** (1) Host chỉ nhận track trống LIÊN TIẾP trên
cùng; V11 có clip → dừng ngay → `ERR:HET_TRACK`, đúng như thiết kế v0.1 "không dùng QE,
bắt người dùng thêm track tay" (quyết định 4 trong CLAUDE.md, nay đã đè). (2) Bẫy thứ
hai nằm sẵn: `gf_trackTrong_` hỏi "trống suốt cả sequence [0, daiSeq)" kể cả khi đã
khoanh In/Out — track chỉ bận NGOÀI vùng khoanh vẫn bị coi là bận (skill 6b đã ghi luật
"hỏi đúng khoảng", panel này chưa theo).

**Đã sửa.**
- `host/guideframe.jsx`: `gf_trackTrong_(track, tu, den)` hỏi đúng vùng [a,b); thêm
  `gf_themTrackVideo_` = đúng MỘT lệnh QE `addTracks(1, soTrack, 0, 0)` (chữ ký Asset
  Manager / Power Bins / Transcripts đang dùng; 2 thread Adobe Community cùng mô tả tham
  số: số track video, chỗ chèn, số track tiếng, loại tiếng), gọi xong ĐỌC LẠI số track,
  có chốt tên sequence QE = sequence đang đặt. Trả thêm `themTrack=0/1|themAudio=N`.
  Hết đường mới trả `HET_TRACK`.
- `dist/index.html`: câu lỗi HET_TRACK mới ("Không thêm được track video mới nên chưa
  đặt được guide…"); đặt xong mà có thêm track thì mở đầu bằng "Đã thêm track V{n}
  mới."; huy hiệu `v…` trên thanh tiêu đề đọc từ `PHIEN_BAN` (nơi thứ 4 bị quên khi
  bump); bỏ gạch dài "—" trong 8 chuỗi người dùng thấy đã đụng tới (luật 22/09). Trong
  khu DICT + hộp trạng thái còn **8 dòng** có "—" chưa đụng (đếm dòng, chưa phân loại
  chữ hay ghi chú) — chờ anh gật rồi dọn một lượt.
- Phiên bản 0.3.1 ở manifest ×2 · `gf_phienBan()` · `PHIEN_BAN`. Đã ký + cài đè
  (`sign-install.ps1` 2 lần, lần 2 vì huy hiệu), reload panel qua cổng 8096:
  panel = host = huy hiệu = 0.3.1.

**Kiểm chứng — ĐO THẬT trên Premiere 27 (Beta), bài test tự dựng môi trường (luật 3a,
script `thu-them-track.js` chạy trong panel qua CDP):** bin riêng `AiO GF THU <ts>` +
2 PNG riêng + sequence riêng tạo bằng `createNewSequenceFromClips` ở gốc project
(3V/3A, 4,97 s), lấp đầy V1–V3 bằng clip nền.

| Ca | Host trả | Đọc lại timeline |
|---|---|---|
| 3 track đầy, bấm đặt | `OK:track=4\|themTrack=1\|themAudio=0`, **298 ms** | nV 3→4, nA 3=3, V4 = guide [0,00..4,97], 3 clip dưới nguyên |
| gỡ rồi bấm lại (V4 trống) | `track=4\|themTrack=0` | nV vẫn 4 |
| V4 bận [0..1,97) · vùng chọn [3..4,97) | `track=4\|batDau=3,00\|themTrack=0` | V4 có 2 clip: nền [0..1,97] + guide [3,00..4,97] |

Dọn: `deleteSequence=true`, bin thử xoá, bin "AiO Guide Frame" không còn; sequence
"Tập 2" của anh mở lại đúng ID, **12V/3A/9 clip/2 item gốc/2 sequence trước = sau**.
2 PNG thử trong `C:/AiOStudio/GuideFrame/` Premiere còn giữ (EBUSY quen thuộc, xem mục
0 CLAUDE.md) — `donFileCu()` dọn ở lần bấm sau. Cú pháp: `node --check` host (chép
sang .js) + script inline của index.html sạch.

**Soát lại lần 2 (anh: *"kiểm tra kĩ lại"*, 13:48→15:15 theo `date`; bản nháp đầu của mục này
ghi "14:0x" là giờ ĐOÁN, đã sửa — bài 5aw) — đọc lại diff bằng mắt, tìm được 2 chỗ còn tin lời
hơn tin số đo, sửa cả hai, cài đè lần 3:**
1. **Sau khi thêm track, code cũ tin "track mới nằm trên cùng" (`sau - 1`) rồi
   `overwriteClip` lên đó.** Nếu QE có lúc chèn ở đầu/giữa thì track trên cùng vẫn là
   track có clip của người dùng → ĐÈ MẤT clip. Lần đo 13:43 chèn đúng trên cùng
   (clipDuoi=3 nguyên), nhưng đó là 1 mẫu. Nay: thêm xong TÌM LẠI track trống từ
   trên xuống bằng đúng vòng lặp cũ; không có thì trả `ERR:TRACK_MOI_KHONG_TREN_CUNG`
   (chuỗi VI/EN mới), tuyệt đối không đè. Hệ quả chấp nhận được: lỡ thêm track rồi mà
   import PNG lỗi thì thừa một track trống, không hại gì.
2. **Chốt "tên sequence QE = tên sequence DOM" có thể ÂM TÍNH GIẢ với tên tiếng
   Việt** ("Tập 2" của anh) nếu hai đường mã hoá dấu khác nhau → panel báo "không thêm
   được track" oan. Chưa đo được (Premiere đã đóng lúc soát) nên đổi sang so bản
   "xương ASCII" (bỏ ký tự ngoài 0x20–0x7E): "Tập 2" hai bên đều thành "Tp 2" → khớp;
   tên khác hẳn vẫn bắt được. ⬜ Khi anh mở lại Premiere: chạy `soat-doc.js` đo
   `qe.name === seq.name` trên "Tập 2" để đóng câu hỏi này.
3. Cú pháp: `node --check` host (chép .js) + script inline sạch; quét host không có
   `let/const/=>/forEach/map`, 3 `indexOf` đều trên CHUỖI (ES3 có). Bản cài trong
   `%APPDATA%` có đủ mã lỗi mới + regex ASCII (đo grep bản đã cài).
4. Gạch dài "—" còn trong chữ người dùng thấy: **7 chuỗi** (đọc từng dòng, không đếm
   mò): `lblTtDemoSub` VI/EN · `l_HOST_CU` VI/EN · 2 dòng cảnh báo ở khung xem trước
   ("Khung hẹp hơn sequence — …", "Chưa bật lưới nào — …") · trạng thái "Lệch tỉ lệ —
   guide chỉ vẽ…". 2 dòng còn lại là ghi chú code. Chưa sửa, chờ anh gật.
5. Cho **Codex CLI** (QA khác hãng, ghế đã chốt 21/09) soát diff + đọc cả file, đề bài
   chỉ tìm lỗi thật kèm file:dòng. **Vòng 1 (47.727 token, ~10 phút): 5 phát hiện**, em
   đọc lại code từng cái (lời QA vẫn là lời khai, bài 5d-ter):

   | # | Codex nói | Đối chiếu code | Xử lý (cài đè lần 4) |
   |---|---|---|---|
   | 1 | Thêm track rồi bước sau lỗi → thừa track trống | Đúng | Đảo thứ tự: **import PNG TRƯỚC**, thêm track sau → import hỏng thì không đụng timeline. Đặt clip hỏng sau khi đã thêm thì vẫn thừa 1 track trống (không có API gỡ, QE không dò) — chấp nhận, ghi rõ |
   | 2 | Hai sequence trùng tên → QE thêm nhầm | Đúng một phần (QE không lộ ID) | So thêm `qs.numVideoTracks` với số track DOM (chỉ ĐỌC thuộc tính) — trùng tên mà khác số track thì bắt được |
   | 3 | **`setOutPoint` không ăn → guide dài hơn vùng → `overwriteClip` ĐÈ clip người dùng ngay sau Out** | **Đúng, nặng nhất**: bước tìm track chỉ kiểm [a,b) | Đọc lại `getOutPoint(4)−getInPoint(4)` của item; dài hơn vùng thì bắt track trống tới `a+daiItem`, không thì KHÔNG đặt (`DAT_HONG` kèm số). Không đọc được → coi dài bằng cả sequence. Sau khi đặt: dài hơn vùng thì cắt `clip.end = b` (trước chỉ kéo dài) |
   | 4 | Đặt hỏng để rác item PNG trong bin | Đúng | `gf_xoaItemMoi_`: bin chỉ còn item đó → `deleteBin`; còn item khác → bin tạm + `moveBin` + `deleteBin` (đường đã đo Transcripts 30/07). Gọi ở **6** đường lỗi sau import |
   | 5 | `addTracks` thêm xong mới ném lỗi → báo HET_TRACK oan | Có thể | Bọc riêng lệnh gọi, đọc lại số track bất kể lỗi (2 đường đọc) |

   Chuỗi trả về thêm `daiItem=` để bài test đọc được.
   **Vòng 2 trên bản vá (60.859 token): 3 phát hiện, đều về DỌN RÁC, không còn điểm nào
   về đè clip / sai track / sai sequence.** Đã vá cả 3 (cài đè lần 5): `importFiles` ném
   lỗi sau khi đã đưa item vào → đếm lại bin, dọn item lọt vào, bin rỗng vừa tạo thì xoá ·
   dọn rác thất bại thì nối câu "(không dọn được ảnh guide trong bin…)" vào chi tiết lỗi
   thay vì nuốt (`gf_xoaItemMoi_` trả true/false + `gf_ghiDon_`) · đọc lại độ dài clip
   ĐÃ đặt mà hỏng thì không xoá item (clip đang tham chiếu), coi như dài bằng vùng, vẫn
   trả OK. **Dừng ở vòng 2** — cả 3 điểm đều nhẹ, vòng 3 tốn ~60k token nữa của gói
   ChatGPT anh (bài 5bc).
6. ☠️ Bản cuối (guard + ASCII) **CHƯA đo lại trên Premiere** — lúc soát thì cổng 8096 tắt
   và `tasklist` không còn Premiere (anh đã đóng, giờ chính xác không biết). Việc đầu
   tiên khi mở lại: chạy lại `thu-them-track.js` (3 ca phải đạt như 13:43) rồi anh bấm
   trên bài thật.

**15:49 — chạy lại 4 ca trên bản cuối theo lời anh (*"mở panel rồi đó, chạy test đi em"*):
4/4 ĐẠT** (thêm V4 226 ms · không thêm lại · vùng [3,5) lên V4 tại 3,00 · vùng ngắn [0,2)
cạnh clip [3,5): guide 1,97 s, clip của anh nguyên; `daiItem` đọc lại 4,94/1,97 đúng).
Đo thêm chỉ-đọc: `qe.name === seq.name` trên "Tập 2" = **true**, `typeof` string,
`qs.numVideoTracks` = 15 = DOM → chốt ASCII không cần nhưng vô hại.

☠️☠️ **NHƯNG dòng dọn lộ ra bài test đã XOÁ MẤT GUIDE ANH VỪA ĐẶT trên "Tập 2":** trước
test 15V/3A/**11 clip**/**13** item gốc, bin guide **CÓ 1 item**; sau test 15V/3A/**10
clip**/**12** item, bin **không còn**. Gốc là **HAI LỖI CÓ SẴN từ 06/08**, chỉ lộ khi
project có nhiều sequence (bài test gỡ guide trên sequence RIÊNG của em đúng như người
dùng gỡ ở sequence B trong khi A đang có guide):
1. `gf_tatOverlay` đếm guide chỉ trên sequence ĐANG MỞ; = 0 là **xoá cả bin "AiO Guide
   Frame"** → item PNG của guide ở sequence khác mất → Premiere xoá luôn clip đó.
2. Panel `donFileCu()` quét xoá MỌI `AIO_GUIDE_*.png` trên đĩa lúc mở panel và mỗi lần
   bấm; file của guide đang dùng chỉ được OS "giữ" tạm, hết giữ là mất → clip offline.
   (Chính nó xoá file của anh sau khi item mất: 15:49 trên đĩa không còn file của anh.)
Em đã **ghi rủi ro số 1 ra giấy lúc 12:3x** ("bin guide có sẵn thì tránh gf_tatOverlay")
rồi **không đưa vào script test** — lần 1 (13:43) thoát vì bin trống, lần 2 dính. Bài
học vào brain tổng (`5be`). Guide của anh lấy lại bằng cách bấm nút lần nữa (0,3 s), em
không tự đặt lại vì không biết track/vùng anh đã chọn.

**Sửa gốc (cài đè lần 6, 15:57):**
- Host: `gf_tenGuideDangDung_()` gom tên clip guide trên **MỌI sequence**;
  `gf_donBinGuide_()` chỉ xoá item **không còn sequence nào dùng** (bin tạm → `moveBin`
  → `deleteBin`, rồi mới xoá file trên đĩa — xoá file TRƯỚC khi xoá bin tạm thì Premiere
  còn giữ, đo `xoaFile=0`), bin rỗng mới xoá bin; file Premiere còn giữ thì xếp vào
  `GF_FILE_CHO` thử lại lần dọn sau. Gọi ở `gf_tatOverlay` và đầu `gf_datOverlay`.
- Panel: **bỏ hẳn `donFileCu()`** (hàm + 2 chỗ gọi), giữ ghi chú vì sao.
- Bài test v3: chụp toàn project (mỗi sequence: track/clip/guide; tên item bin) trước và
  sau, phải giống hệt; hai sequence riêng A + B, gỡ ở B thì A phải còn.
- Đo được trước khi anh đóng panel (15:5x): **gỡ ở B → `xoaItem=1|giuItem=1`, guide A còn
  nguyên** = sửa gốc ĂN. Bài test v3 lần đầu vỡ giữa chừng vì lỗi THƯỚC (`fs` không phải
  biến toàn cục trong panel, phải `nodeFs()`) — chính lỗi này làm mọi dòng "fileGiu" ở
  các lần trước là **giả** (chưa bao giờ xoá được file, không phải Premiere giữ). Đã sửa
  thước; 5 file PNG test xoá tay theo tên.

**16:00 — bài test v3 chạy TRỌN trên bản cài 15:57, ngay trong project mới anh đang
mở (`Friend_comforting_young_man_…`, 7V/11 clip/**1 guide thật của anh**, bin có PNG của
anh):**

| Ca | Kết quả |
|---|---|
| A: sequence riêng, V2/V3 trống → đặt | `track=2`, không thêm track |
| B: 3 track đầy → đặt | thêm V4, **189 ms**, `themAudio=0`, 3 clip dưới nguyên |
| **Gỡ ở B** | `xoaItem=1` (item B) · **`giuItem=2`** (item của A + của anh giữ nguyên) · A vẫn `guide=1` |
| B: bấm lại khi V4 trống · vùng [3,5) · vùng ngắn [0,2) cạnh clip [3,5) | 3/3 như 15:49, `daiItem` 4,94 / 1,97 đúng |
| Gỡ ở A | item A xoá, bin còn đúng 1 item của anh |
| **Chụp project trước/sau** | `PROJECT_CUA_ANH_KHOP_TRUOC_SAU=DUNG` — sequence của anh vẫn 7V/11 clip/1 guide, bin vẫn 1 PNG của anh |

Phát hiện kèm: **xoá file PNG trên đĩa từ host cũng KHÔNG ăn trong phiên** (`xoaFile=0`,
`fileCho` 1→5): Premiere giữ handle cả sau khi item đã xoá, `File.remove()` trả false —
cùng cơ chế EBUSY 26/08. Quyết định: **chấp nhận rác nhỏ** (~50 KB/lần bấm) thay vì quét
đĩa (quét là cắn nhầm guide của project khác). `GF_FILE_CHO` thử lại trong phiên, vô hại.

**Chưa đo:** anh bấm lại trên "Tập 2" để lấy lại guide đã mất (anh đã đặt được guide ở
project mới, ca thật đã chạy) + trên bài 11 track; chưa đóng gói `Release/`; skill
`adobe-cep-panel` + bảng app + tracker đã cập nhật.

## 2026-09-21 15:37 — ANH TEST ĐẠT
Anh Tiến: *"Auto Guideline Frame - anh test thấy okie rồi đó em"* (bản 0.3.0). Chưa có bộ cài trong `Release/`;
đóng gói là bước tiếp theo nếu anh muốn đưa ra ngoài.

## (CŨ) TRANG THAI 2026-08-26 14:40 — giữ để tham khảo, trạng thái hiện hành ở ĐẦU FILE

- **Phien ban:** v0.3.1 tu 25/09/2026 (khop ca 3 noi: manifest · `gf_phienBan()` · `PHIEN_BAN`; huy hieu doc tu `PHIEN_BAN`).
- Giao dien: ban thiet ke anh Tien chot, DA noi day that vao Premiere va da qua
  **7 dot sua theo yeu cau truc tiep cua anh** (muc 2026-08-26 ben duoi).
- Khoi hanh dong chi con **DUY NHAT nut chinh**. Khong con: nut Go guideline ·
  nut Luu .guides · Preset cua toi · canh bao "con guide tren timeline" ·
  dong chu nhac nho nung trong anh. Hop trang thai chi hien khi **lech ti le**
  hoac khi **loi**.
- Duong RA: xoa clip guide tren track V3 bang tay trong Premiere.

---

## 2026-08-26 14:39 — GHEP THIET KE MOI vao panel v0.3.0 + 6 dot sua theo yeu cau anh Tien

☠️ **SUA NGAY: cac muc duoi day BAN DAU BI GHI NHAM 06/08/2026 va bi chen vao
muc 2026-08-06.** Dau phien toi chay `date` ra "2026-08-06" roi tin luon, trong
khi ngay that la **26/08/2026** (lech 20 ngay). Phat hien khi anh Tien gui anh
chup panel ghi **v0.3.0** — ban ma `CLAUDE.md` da ghi la lam ngay 2026-08-25,
tuc khong the dang la 06/08. Da doi lai ngay o **13 comment trong ma nguon**
(`dist/index.html` 10 · `dist/ve-guide.js` 2 · `CLAUDE.md` 1) va dua khoi nay ve
dung cho. Gio trong tung muc con (17:10, 17:35...) cung la gio BIA ra theo ngay
sai nen da bo, thay bang so thu tu. Bai hoc 5q: lay ngay bang lenh la chua du —
phai **doi chieu voi mot moc doc lap** (o day la so phien ban dang chay).

### (1) 3 loi anh Tien bat duoc khi dung that (da sua + do lai)

**1. O chon sequence khong chon duoc.** Anh Tien chup man hinh bao. Do: o xo CO
mo (`hidden=false`, 2 muc) nhung bi **`.selbar { overflow:hidden }` CAT CUT** —
danh sach cao 69px bat dau y=68, thanh sequence ket thuc y=110 -> chi lot dong
dau, "PV sales" bi cat.
→ Sua GOC: khi mo thi neo o xo bang **`position:fixed`** theo toa do nut (tinh
trong `comboBox()`), nen khong to tien nao cat duoc, va **khong sua mot dong CSS
nao cua ban thiet ke**. Kem lat len tren khi tran day panel + bam theo khi cuon.
→ Do lai: ca 2 muc `elementFromPoint` deu tra ve dung muc do; bam that qua giao
dien -> `gf_moSequence` chay -> Premiere doi sang "PV sales" -> tra ve duoc.

☠️ **Lan do dau em bao "khong doi duoc" la THUOC SAI**: dat gio cho cung 2,5s,
trong khi lenh dau sau khi nap lai panel phai `$.evalFile` host truoc nen lau
hon. Dung bai hoc 5f (lay tin hieu xong cua chinh no) thi ra dung ngay.

**2. Nhan canh bao de len mat nhan vat.** Anh Tien chup anh: khoi chu
"LOP GUIDE — TAT TRUOC KHI XUAT VIDEO" nam ngay dinh dau nguoi tren sequence 16:9.
Nguyen nhan: `veTag` cu neo vao **mep vung an toan** (`sUi.y + pad*2 + co`) — tuc
dat dung vao CHO NGUOI TA CAN NHIN.
→ Sua: gom tag cua `ve()` va `veLuoi()` thanh MOT ham `veTag()`, dat **sat day
khung** (luon nam trong dai da bi UI nen tang che) va **co chu con 62%**.
→ Do lai 3 ca — `yt-169` tren 4K, `tiktok-video` tren 4K (lech ti le), va
`tiktok-video` dung khung 1080x1920: **0 diem chu trong vung an toan** o ca ba,
tam khung van alpha 0. Chu chi con o dai duoi cung (y 2100 / 2140 / 1902).

**3. Nut ghi "Thay bang khung an toan moi" nhung KHONG thay.** Phat hien khi do:
con guide cu tren timeline thi track tren cung khong con trong -> bam vao se
truot `HET_TRACK`. Nhan noi doi (trai luat "nhan nut la VIEC no lam").
→ Sua: `hienGuide()` goi `gf_tatOverlay()` truoc khi dat neu `soLopGuide > 0`.
→ Do: truoc 1 guide -> bam -> **sau van 1 guide** (khong thanh 2, khong loi),
V3=1 clip, **0,76 giay**.

### (2) Anh Tien yeu cau GO 3 khoi (kem anh chup khoanh do)

| Go gi | Ly do / cach xu |
|---|---|
| **"Preset cua toi"** (o ten + nut Luu + danh sach) | Go het markup. Don luon trinh xu ly, bien `presets`, khoa localStorage `aio-gf-presets` va 4 khoa tu dien -> **0 tham chieu chet con lai** |
| **Nut "Luu file .guides"** + dong ghi chu duoi no | Go markup + `luuGuides()` + `motGuide()` + khoa tu dien. ☠️ Day la **Tang B** cua kien truc lai 2 tang chot 01/08 — nay khong con trong giao dien |
| **Hop trang thai bao "Da dat len track V3..."** | KHONG go han hop. Theo dung luat anh Tien *"chi bao khi THAT BAI"*: hop **an khi `m === 'ok'`**, van hien khi `warn`/`err`. Go han thi panel se CAM luc "het track trong" / "chua noi Premiere" — nguoi dung khong biet vi sao khong ra guide |

☠️ Bay khi an hop: `.tt{display:flex}` **de len** quy tac `[hidden]{display:none}`
cua trinh duyet (class co do uu tien cao hon). Phai dung `style.display='none'`.

Do lai sau khi go: `khoi_preset`/`nut_luu_guides`/`dong_ghi_chu` deu **khong con
trong DOM** · **0 loi JS** · them-xoa duong, doi mau, doi ngon ngu, di het 10 nen
tang **van chay** · ep trang thai loi thi hop **hien lai** (`display:flex`, muc
`err`) · dat xong thi hop **`display:none`**.

Kem: bam "Thay bang khung an toan moi" khi timeline dang co **2** guide chong
nhau -> **con dung 1**, V3=1 clip.

### (3) Anh Tien go tiep 2 khoi: canh bao "con guide" + nut "Go guideline"

Sau khi go, khoi hanh dong chi con **DUY NHAT nut chinh**.

**Duong RA gio la gi:** xoa clip guide tren track V3 bang tay trong Premiere.
Panel tu nhan ra sau ~1,5 giay (nhip doc `gf_demOverlay`) va doi nhan nut ve
"Hien khung an toan". Bam nut chinh khi dang co guide thi van **go cu roi dat
moi** (`hienGuide()` goi `gf_tatOverlay()` truoc). Loi nhac an toan that van
con: dong "TAT TRUOC KHI XUAT VIDEO" nung trong chinh tam anh.
**Danh doi da noi ro voi anh Tien:** khong con ai don giup **bin 'AiO Guide
Frame' + file PNG** trong project — truoc day nut Go don luon.

Da don sach: markup, `tatGuide()`, trinh xu ly, 5 khoa tu dien (`tat` `dangTat`
`daTat` `tatTrong` `tatThieu`), trang thai `condu` trong `TRANG_THAI`, va dong
`iTT = 3` trong `demLop()`. **0 tham chieu chet con lai.**

**Do 5 canh (bang bao gio hien hop trang thai):**

| Canh | Hop trang thai | Nhan nut chinh |
|---|---|---|
| Khop ti le, chua dat | **an** | Hien khung an toan |
| Khop ti le, DA co guide tren timeline | **an** | Thay bang khung an toan moi |
| Vua bam dat xong | **an** | Thay bang khung an toan moi |
| **Lech ti le** (9:16 tren seq 16:9) | **hien** (warn) | Thay bang khung an toan moi |
| **Chua noi Premiere** | **hien** (err) | Hien khung an toan |

0 loi JS · them-xoa duong, doi ngon ngu, di het 10 nen tang van chay.

☠️ **Thuoc do sai lan nua:** doc dau tien bao "hop van hien" o canh binh thuong.
Nguyen nhan: ban thu con nho khung `yt-169` trong localStorage nen dang o canh
**lech ti le** — tuc hop hien la DUNG. Dung bai hoc 5p (do tren mot trang thai
khong phai trang thai minh tuong).

### (4) Go han dong chu trong anh + SUA LOI EBUSY anh Tien gap

**A. Go han nhan "LOP GUIDE — TAT TRUOC KHI XUAT VIDEO"** (anh Tien: *"text nay
anh khong can"*). Xoa han `veTag()` trong `ve-guide.js` + 2 cho goi + `opts.tag`
/ `tenNenTang` / `phienBanDuLieu` ben panel + hang `PHIEN_BAN_DU_LIEU`.
Ban xem truoc noi bo von da truyen `tag:false` nen khong anh huong.
→ **Do co DOI CHUNG**: ve lai voi `uiThat:false` -> **0 diem chu**. Nghia la tag
bay sach that; **6.188 diem chu con lai la MO PHONG UI NEN TANG** (avatar,
caption, nhan icon) — tinh nang anh Tien xin 02/08, khong dung toi.
Muon tat luon thi truyen `{ uiThat:false }` trong `taoPngGuideline()`.
→ Danh doi da noi ro: anh guide nay KHONG con loi nhac nao. Cong voi viec da go
nut "Go guideline" va canh bao "dang co N guide", panel khong con nhac gi ve
"tat truoc khi xuat" — nguoi dung tu nho.

**B. ☠️ `EBUSY: resource busy or locked` khi bam lan thu HAI cho CUNG mot khung.**
Anh Tien bao loi (anh chup). Nguyen nhan **khong phai** do chon 2 option luoi
nhu ban dau tuong: ten file PNG dat CO DINH theo `(khung + kich thuoc + ngon
ngu)`, nen lan hai ghi de len chinh file **Premiere van dang giu** — no khong
tra lai handle ngay ca khi clip da bi go va bin da bi xoa.
→ Sua goc: **ten file duy nhat moi lan** (`..._<Date.now()>.png`), kem
`donFileCu()` xoa cac PNG cu (file nao Premiere con giu thi bo qua, lan sau don
tiep) — goi sau moi lan ghi va mot lan luc mo panel.
→ Do: bam **4 lan lien tiep** cung khung `yt-169` tren sequence 4K (lan 2 bat
them "Tam khung", lan 3 bat "Ti le vang" — dung kieu anh Tien lam):
**4/4 dat**, 0,62–0,77 giay, **luon chi con dung 1 guide** tren timeline,
**khong con EBUSY**.
→ Con lai: PNG cu **chua xoa duoc trong cung phien** (Premiere giu file) — 4 lan
bam de lai 4 file ~0,4 MB. Chung se bi don o lan mo Premiere sau.

### (5) Dua khung xem truoc len DAU panel (anh Tien: "chi thay doi vi tri")

Anh Tien dung panel o dock **806px** -> `.grid` roi ve 1 cot, khung xem truoc bi
day xuong duoi cung, phai cuon qua het dieu khien moi thay.

Sua: doi **vi tri trong DOM** — khoi `.col--xem` bay len truoc `.col`. Noi dung
khoi giu **nguyen si** (`seqbox` / `dich` / `chugiai` khong sua mot ky tu).
Them dung **3 dong CSS** de dock rong khong bi dao theo:
`@media (min-width:901px){ .col--xem{order:2} .col:not(.col--xem){order:1} }`.

Do that:

| Kho | Ket qua |
|---|---|
| Panel that 806px (1 cot) | thanh sequence y=68 -> **xem truoc y=122** -> chon nen tang y=591 -> nut chinh y=1015 |
| Ban do 1280px (2 cot) | dieu khien **TRAI** x=61 rong=360 · xem truoc **PHAI** x=433 — **dung y thiet ke goc** |

Moi thu khac khong doi: 10 nut nen tang · 2 chip khung · 4 vung ve · nhan
"Khung an toan 3456x1836" · chu giai · nhan nut · hop trang thai van an ·
khong tran ngang · **0 loi JS** · doi ngon ngu va di het 10 nen tang van chay.

### (6) "Vi tri khong deu" o khoi DUONG TU THEM (anh Tien chup anh)

**Do ra nguyen nhan:** nut huong rong theo CHU nen hai hang lech nhau —
`Doc` **33px** vs `Ngang` **46px** -> thanh keo bat dau lech **12,6px**, con
truot cung o gia tri 50 lai khong thang hang.

**Sua THEO CAU TAO, khong ghim be rong bang tay:** cho ca `.duongs` thanh mot
LUOI 4 cot, tung hang `.duong` dung `display:contents` de gop vao cung luoi ->
moi cot bang nhau o moi hang. Ghim `min-width` bang tay se vo lai khi doi ngon
ngu ("Horizontal" dai gap doi "Ngang"); cach nay thi khong the lech.

| Ca do | Lech nut | Lech diem bat dau thanh keo | Lech o so | Lech nut xoa |
|---|---|---|---|---|
| VI: Doc + Ngang | **0** | **0** | **0** | **0** |
| EN: Vertical + Horizontal | **0** | **0** | **0** | **0** |
| VI: 5 duong tron lan | **0** | **0** | **0** | **0** |

Con truot o gia tri 50 cua hai hang: **cung x = 380,8** (truoc do lech 12,6px).
Nut "+ Them duong" van o hang rieng (`grid-column:1/-1`).

**Kiem `display:contents` co pha gi khong** (no bo hop cua `.duong` di, ma JS
dung `closest('.duong')` de tim hang): keo thanh truot -> o so dong bo · go so
-> thanh truot chay theo · doi huong · **xoa dung hang minh bam** (xoa hang 2
trong 3 hang, con lai dung 2 hang con lai) · duong ve len khung xem truoc ·
them duong. **6/6 dat, 0 loi JS.**


### (7) O nhap "Le %" khac han phan con lai (anh Tien: "sao loi ra cai ong noi 5%")

**Do truoc khi sua** — o "Le" so voi o so trong "Duong tu them":

| | O "Le" | O "Duong tu them" |
|---|---|---|
| Cao | 21,3px | 24px |
| Nen | `rgb(59,59,59)` (mac dinh trinh duyet) | `#0e0e0e` |
| Vien | `2px inset rgb(133,133,133)` (vien 3D) | `1px solid` mo |
| Bo goc | **0** | 6px |
| Font | **Arial** | Inter var |

**Nguyen nhan:** JS phat ra `class="nhaple"` — **0 luat CSS nao khop**. Trong khi
ban thiet ke CO SAN `.lebox` (2 luat) nhung khong ai dung. Input con mang
`class="so"`, ma `.so` chi duoc dinh nghia la `.duong .so` (hau due cua `.duong`)
nen cung khong an. Ket qua: o do roi ve kieu mac dinh cua trinh duyet.
→ Cung ho voi 14 id JS goi ma HTML khong co: **ve tich cua ban thiet ke doi
truoc** — CSS giu ten cu, JS giu ten khac.

**Sua:** doi `nhaple` -> `lebox`, bo `class="so"` thua. Khong them mot dong CSS nao.

**Do lai:** cao **28px** dung bang chip "Le" va **thang hang tam** (ca hai y=803,
lech < 1,5px) · nen `#0e0e0e` · vien 1px solid · bo goc 6px · font Inter var —
**giong het** o cua "Duong tu them". Go so van an vao khung xem truoc (`le=12`,
1 duong le duoc ve) · tat Le thi o bien mat · **0 loi JS**.

---

## 2026-08-25 15:27 — v0.3.0: VUNG CHON In/Out — guide dat dung doan anh Tien khoanh

**Boi canh:** anh Tien yeu cau "vung tron o phan tool" — hoi lai bang cau hoi
lua chon thi ro y: giong o "Doan dang chon" cua Auto Cut. Panel phai tu nhan
vung In/Out anh khoanh tren timeline, hien thoi luong, va khi bam nut thi
guideline chi dat DUNG TRONG vung do thay vi phu ca sequence.

**Da lam:**
- `host/guideframe.jsx` (0.3.0):
  - Them `gf_inSec_` / `gf_outSec_` — chep dung bai `ac_seqInSec` cua Autocut
    (getInPointAsTime truoc, getInPoint du phong, -1 khi khong doc duoc).
  - `gf_thongTinSeq` tra them `|in|out` vao cau tra loi SAN CO — vong tham do
    1,5s cua panel biet vung chon ma KHONG ton them luot evalScript nao
    (luat "tool phai dong hanh" 19/08). Kem sua tiem an: ten sequence chua `|`
    nay duoc thay bang dau cach (truoc gio se lech truong).
  - `gf_datOverlay(png, batDau, ketThuc)` — them 2 tham so tuy chon. Kep ve
    [0, daiSeq]; so vo ly thi roi ve ca sequence (an toan hon bao loi).
    Dat clip bang `overwriteClip(item, giay)` + du phong Time object (bai
    `ac_datClip` cua Autocut da chay that tren 588 clip).
- `dist/index.html` (0.3.0):
  - Chip "Vung chon / In/Out range" tren thanh sequence — CHI hien khi co vung
    THAT (khac ca sequence), hien thoi luong (vd `12.4s`). Mat vung / mat
    sequence -> chip an ngay (xoa so cu, khong noi doi).
  - ☠️ An chip bang `style.display` chu KHONG dung `[hidden]` — `.selbar-chip`
    co `display:inline-flex` de len `[hidden]{display:none}` (dung bay `.tt`
    da ghi 06/08).
  - `tinhVungChon`: Premiere tra in=0/out=cuoi khi CHUA khoanh gi — khong phan
    biet duoc voi "khoanh tron sequence", va hai truong hop cho cung ket qua
    nen gop lam mot: coi la khong co vung.
  - Luc bam nut: doc In/Out TUOI trong chinh lan bam (khong tin cache cua vong
    tham do), truyen xuong `gf_datOverlay`. Thong bao thanh cong dung cau
    rieng `daDatVung` (song ngu); canh bao "phu thieu" so voi do dai VUNG chu
    khong phai do dai sequence nua.
- Phien ban dong bo 3 noi: manifest 0.3.0 · `gf_phienBan` 0.3.0 · `PHIEN_BAN`
  0.3.0 (+ nhan v0.3.0 tren topbar).

**Da kiem chung:**
- Cu phap JS panel: node new Function OK; quet id JS-goi-ma-HTML-thieu: chi con
  7 id cu (deu boc `if ($())`), 0 id moi thieu.
- Logic vung chon + kep cua host: **15/15 ca bien DAT** (chua khoanh / khoanh
  tron seq / vung giua / cham dau / cham cuoi / out vuot seq / out<=in / NaN /
  thieu tham so / am...).
- DOM tren trinh duyet: chip an mac dinh -> `datVungChon({a:5,b:17.4})` hien
  `12.4s` -> doi EN ra "In/Out range" -> `datVungChon(null)` an lai. 0 loi JS moi.
- **DO THAT tren Premiere 27.0 dang mo** (chi DOC, khong dung timeline cua anh):
  nap host moi qua cong 8096, `gf_thongTinSeq` tra
  `OK:1280|720|2433.4|PodTest Nguon|0|2433.4` — chua khoanh I/O nen in=0,
  out=cuoi, panel hieu dung la "khong co vung". Da cai ban 0.3.0
  (sign-install, 0 file khoa) + reload panel dang mo: PHIEN_BAN 0.3.0, vong
  tham do chay, chip an dung.

**CHUA do (noi thang):**
- ⬜ Ca CO vung chon tren Premiere that (khoanh I/O -> chip hien -> bam nut ->
  guide nam dung [in, out]). Khong tu dung duoc ma khong dat I/O len sequence
  cua anh Tien (dung bai 19/08 da cam) — **cho anh khoanh vung roi bam thu**.
- ⬜ `overwriteClip` tai moc > 0 cho clip GUIDE noi rieng (Autocut da chung
  minh voi clip video thuong).

**Ghi nhan ngoai le:** console co san 3 loi `<path> attribute d` cua icon
share trong khung mo phong UI nen tang (co tu ban thiet ke cu, khong lien quan
ban sua nay).

---
- **DA DO THAT TREN PREMIERE** (project that cua anh Tien: `PV tuyen dung.prproj`,
  sequence 4K 3840x2160 dai **3.897 giay / 306 clip**):
  - Dat guide **0,74 giay** (chi tieu <=2s) · Go **0,13 giay**.
  - Vao **track V3 trong**, phu **3897,76s / 3897,76s** — khong dung V1 (306 clip)
    hay V2 (6 clip).
  - **Go xong sequence GIONG HET ban goc** — so sanh chuoi anh chup truoc/sau
    (ten + moc dau/cuoi tung clip, ca track tieng, so muc goc project): **khop y het**.
  - 2 ham host moi chay dung: `gf_dsSequence` liet ke 2 sequence that;
    `gf_moSequence` mo "PV sales" (4018s) roi tra ve "Synced Sequence" (3897s).
  - **Soi file PNG 4K that su gui sang Premiere**: 3840x2160, khung dich 9:16
    rong 1215px giua khung, ngoai khung lam toi (alpha 115), **giua khung
    alpha = 0** (khong am mau hinh), dong "TAT TRUOC KHI XUAT VIDEO" nam o
    y 194-253 — **49.879 diem chu** tren toan anh.
- **DA DO tren trinh duyet:** 17/17 khung hinh khop safe-zones.json tung con so ·
  .guides ra dung vi tri · 21/21 phep thu tuong tac · 0 loi JS · 0 lan goi mang.
- Chi tiet: xem muc 2026-08-06 16:41 ben duoi.

---

## Trang thai truoc do (2026-08-02 20:56)

- **Phien ban:** v0.1.0 · ID `com.aiostudio.guideframe` · cong debug 8096.
- **Da ODO THAT tren Premiere Beta 26.5 (PID phien 02/08):**
  - Dat guideline tu panel **0,2 giay** (chi tieu <=2s) · go sach nhu cu tung con so.
  - Dat len track trong tren cung V3, khong dung clip nguoi dung (do: V1 camA,
    V2 camB, V3 AIO_GUIDE).
  - Nhanh lech ti le (9:16 tren sequence 16:9 -> ve vung giua 405x720) chay dung.
  - **Import .guides: anh Tien da them vao timeline OK** sau khi lam tron so 2 chu
    so (parser Adobe kho tinh voi so le dai kieu 74.789999...).
- **UI da qua 2 dot lam dep** (bo cuc 2 cot + chat lieu vien thiet bi). Cach do:
  chup man hinh panel that qua CDP cong 8096, khong doan qua DOM.
- **Viec ke tiep (chua lam):**
  - `[CHO]` Render thu 1 doan roi SOI FILE xuat co dinh overlay khong (moi chung
    minh gian tiep bang dem clip, chua soi file that).
  - `[CHO]` Doi chieu nguoc huong ngang/doc trong .guides cho DU cac ti le (moi
    xac nhan 1 ca TikTok qua mat anh Tien; chua thu ca ngang).
  - `[CHO]` Cau hoi UX con treo: guide goc Premiere ghi thang vao "Installed
    Guides.guides" luc dang chay co hien ngay khong, hay phai restart — anh Tien
    chua tra loi co thay "AiO TikTok Safe Zone" trong menu Guide Templates chua.
  - Chua co: nut xuat MP4, bo cai ghep, khoa ban quyen, macOS (xem PIPELINE.md).

---

## 2026-08-06 16:41 — GHEP THIET KE MOI (v0.2.0) + noi lai day that vao Premiere

**Boi canh:** anh Tien giao file thiet ke moi
`AiO Design System/AiO Auto Guiline Frame/AiO Guide Frame.html`, nho "them vao
Adobe". Mo ra thi thay `dist/index.html` DA bi chep de bang chinh file thiet ke
do (md5 GIONG HET, ca hai deu mtime 15:36 cung ngay) — khong phai do phien nay.

### Cai gia phai tra cua ban chep de (do bang so, khong doan)

| Mat gi | Bang chung |
|---|---|
| `ve-guide.js` + `safe-zones.js` khong con duoc nap | grep: 0 lan trong ban chep, 2 lan trong ban cu |
| **Khong con duong GO guide** (`gf_tatOverlay`) | ban chep chi goi 2 ham host; ban cu goi 5 |
| Mat kiem phien ban host (`gf_phienBan`) | benh "panel moi noi voi host cu" mo toang |
| Mat dem lop guide con sot (`gf_demOverlay`) | canh bao truoc khi xuat khong con |
| Mat xuat `.guides` (Tang B) | nut bien mat khoi HTML |
| Ghi PNG vao `os.tmpdir()` | vi pham bai hoc 28/07: Premiere ao hoa thu muc trong %APPDATA% |
| **14 id JS goi ma HTML khong co** | `$('moCaiDat').title` khong bao ve -> bam nut EN la CHET |
| Tai video mau tu Internet | `mixkit.co` + `googleapis.com` — panel chay trong Premiere may khach |
| So lieu safe zone hard-code trong UI | vi pham luat "safe-zones.json la nguon chan ly" |

**So lieu:** mang hard-code trong thiet ke khop JSON **52/53 vung**. Lech duy
nhat: `zalo-916` canh phai — JSON **12%**, thiet ke **12,96%**. Nay panel doc
JSON nen 12% thang. **Anh Tien chot lai giup so nao dung.**

### Da lam

- **Giu nguyen hinh thuc thiet ke.** Phan them vao deu dung ĐUNG class CSS co
  san trong chinh file thiet ke (`.tt`, `.phu`, `.chugiai`, `.btn--icon`) —
  CSS cua no van con day du cho nhung khoi ma HTML bi thieu.
- Them lai: **hop trang thai**, **nut Go guideline**, **nut Luu .guides**,
  **nut Cai dat** (thiet ke co CSS + JS cho ca 4, chi thieu the HTML).
- Noi lai bo may cu: `napHost()` + kiem phien ban truoc MOI lenh · `evalP` co
  han cho · ghi PNG vao `C:/AiOStudio/GuideFrame` · dem lop guide con sot.
- **Ve PNG bang `ve-guide.js` dung chung** -> anh dat len timeline giong het
  khung xem truoc, va co lai dong "TAT TRUOC KHI XUAT VIDEO" nhung trong anh.
- Du lieu nap tu `safe-zones.js`; mang trong file doi ten thanh `NEN_GOC`, chi
  con la luoi an toan khi file du lieu khong nap duoc.
- **O chon sequence nay la THAT**: host them `gf_dsSequence()` + `gf_moSequence()`,
  chon mot cai la Premiere mo dung cai do.
- Nho lua chon giua hai lan mo panel (localStorage).
- **Font Inter dong goi**: thiet ke tro toi `../fonts/Inter.woff2` nhung panel
  KHONG co thu muc do -> chep tu `AiO Design System/fonts/`, va them buoc chep
  `fonts/` vao `sign-install.ps1` (truoc do khong chep -> cai vao Premiere la 404).
- Nhip hoi host: 1,5s mot cau re; danh sach sequence chi hoi lai khi doi hoac
  moi 8 nhip — khong tranh CPU voi Premiere.
- Bo video mau tai tu Internet, thay bang nen ve bang CSS. **0 loi goi ra ngoai.**

### Da kiem the nao (so do, khong noi suong)

Dung may chu tinh + do thang tren DOM/canvas:

- **17/17 khung hinh**: do hinh hoc THAT do layout engine tra ve, doi chieu
  voi `safe-zones.json` — lech cho phep 0,35%, thuc te 0 ca truot. Nhan
  "khung an toan WxH" cung khop phep tinh doc lap.
- **PNG gui sang Premiere**: tam khung **alpha = 0** (khong am mau hinh) ·
  vung UI to do dung `rgba(255,95,109,0.26)` · dong canh bao co **8.213 diem
  chu** (VI) / 8.608 (EN); **tat `opts.tag` thi con 0 diem** — chung minh
  chinh tag ve ra chu khong phai thu khac.
- **`.guides`**: 8 duong, vi tri **6,77 / 74,79 (ngang)** va **4,07 / 87,04
  (doc)** — dung y het phep tinh doc lap tu JSON; khoa file dung dinh dang Premiere.
- **21/21 phep thu tuong tac** (doi ngon ngu 2 chieu, mo/dong cai dat, them-xoa
  duong, doi mau, luu-ap-xoa preset, di het 10 nen tang, nho sau khi tai lai).
- **0 loi JS**, **0 lan goi mang**.

### Hai lan THUOC DO SAI, khong phai san pham sai (ghi de lan sau khoi mat cong)

1. Do "dong canh bao trong anh" o **y=112** -> bao KHONG CO. Doc lai
   `ve-guide.js`: tag neo theo **mep vung an toan** (`sUi.y + pad*2 + co`),
   voi TikTok 1080x1920 la y≈161–237. Do lai dung cho: co du.
2. Do be rong khung xem truoc bang `getBoundingClientRect` -> **259x460** o
   moi kho man hinh. Doc thang bien CSS thi la **337,5x600** (dung cong thuc).
   Nguyen nhan: khung Browser khong dung hinh nen layout tra gia tri CU —
   dung cai bay da ghi trong `~/.claude/CLAUDE.md` muc 5.
   -> **Ket luan: KHONG do duoc bo cuc bang mat trong moi truong nay.**

### DO TREN PREMIERE THAT (16:55, anh Tien mo Premiere de do not)

Project **`PV tuyen dung.prproj`** — sequence `Synced Sequence` **3840x2160,
3.897 giay (65 phut), 306 clip tren V1**. Quy mo that, khong phai mau nho.

Kiem AN TOAN truoc khi bam (bai hoc 3b — chup trang thai goc truoc):
`V1=306 V2=6 V3=0` · root 11 muc · **0 clip nao ten bat dau `AIO_GUIDE`** ·
**khong co bin ten 'AiO Guide Frame'** -> go se khong xoa nham gi cua anh Tien.

| Do | Ket qua |
|---|---|
| Phien ban panel vs host | 0.2.0 == 0.2.0 (chot kiem host cu chay dung) |
| Dat guide | **0,74 giay** (chi tieu <=2s) |
| Vao dau | **track V3** (trong), phu **3897,76s / 3897,76s** |
| Go guide | **0,13 giay** |
| Sequence sau khi go | **GIONG HET ban goc** — so chuoi anh chup (ten + moc dau/cuoi TUNG clip + track tieng + so muc goc project): khop y het |
| Con sot | 0 clip guide · 0 bin guide · sequence dang mo tra ve dung `Synced Sequence` |
| `gf_dsSequence` | liet ke dung 2 sequence that kem ID |
| `gf_moSequence` | mo "PV sales" (4018s) -> tra ve "Synced Sequence" (3897s), doc lai xac nhan |
| Font Inter trong Premiere | `document.fonts.check` = true |
| Nhanh lech ti le | 9:16 tren sequence 16:9 -> panel bao "guide chi ve vung giua 1215x2160" |

**Soi CHINH FILE PNG da gui sang Premiere** (doc lai tu dia, khong ve lai tu code):

- `AIO_GUIDE_tiktok-video_3840x2160_vi.png` — 377 KB, **3840x2160 khop sequence**.
- Khung dich do TU ANH: x 1308..2531 -> **1224px** (ky vong 1215 + net vien 7px).
- Ngoai khung dich: den alpha **115** (lam toi). Trong khung: **alpha = 0** —
  **khong am mau hinh cua anh Tien**.
- Vung UI to `255,97,108` alpha 66 (dung `rgba(255,95,109,0.26)` cua ve-guide.js).
- Vung lam viec giua: **1004px** (ky vong 1008 tru 2 net vien).
- **Dong "TAT TRUOC KHI XUAT VIDEO"** nam o **y 194-221 va y 232-253** (2 dong),
  tong ca anh **49.879 diem chu**.

### CON CHO — chua do duoc

- `[CHO]` Nhin bang MAT xem thiet ke con dung y anh Tien khong (xem muc tren:
  moi truong nay do bo cuc khong dang tin).
- `[CHO]` So `zalo-916` canh phai: 12% (JSON) hay 12,96% (thiet ke)?
- Van con tu truoc: render thu roi soi file xuat · doi chieu nguoc huong
  ngang/doc trong `.guides` cho du cac ti le.

### Code chet con lai trong file thiet ke (khong pha gi, de biet ma don sau)

7 id JS con goi ma HTML khong co — deu DA co bao ve `if ($('x'))` nen khong nem
loi: `tabSafe` `tabLuoi` (he tab cu) · `dMot` `dNhieu` `dsNen` (che do chon
nhieu nen tang) · `chipsTiLe` `lblTiLeKhung` (chip ti le khung). Day la ve tich
cua ban thiet ke doi truoc; ban moi bo khoi giao dien nhung JS+CSS van giu.

---

## 2026-08-02 20:56 — Dot lam dep lan 2 (anh Tien: "van thay xau qua")

Lan 1 sua BO CUC (2 cot) — chua du. Lan 2 sua CHAT LIEU BE MAT:
- **Khung xem truoc boc VIEN THIET BI**: khung doc = dien thoai (bo goc 26px,
  vien toi 2 lop, bong do), khung ngang = man hinh, vuong = the — class doi
  tu dong theo ti le. San khau cham mo (dot grid 18px) + vignette.
- Nut chinh: gradient cam + glow nhe + inset highlight, hover nhac 1px,
  trang thai xong gradient xanh. Nut thuong gradient bg-5->bg-4.
- Tab: vien thuoc gon max 420px giua panel, active co bong.
- Cot trai gom thanh 2 CARD (.khoi gradient bg-3->bg-2): dieu khien + hanh dong.
- Chip nen: trong suot vien hairline, chon = accent-soft + dot phat sang.
- Legend thanh pill can giua duoi san khau. Version thanh badge tren topbar.
- Van 100% token Studio Console — khong them mau moi.

Kiem: cu phap sach, cai + reload panel that, CHUP MAN HINH nghiem thu qua CDP
— vien dien thoai + card + nut co chieu sau hien dung. Anh luu:
%TEMP%\panel-dep.png.

## 2026-08-02 16:1x — Lam dep giao dien (anh Tien: "UI qua xau roi em oi" + goi skill ui-ux-pro-max)

**Meo do moi (quan trong):** panel dang mo co cong debug -> CHUP MAN HINH panel
that bang CDP `Page.captureScreenshot` qua cong 8096 — lan dau NHIN thay dung
cai anh Tien nhin, khong doan qua DOM nua. Anh truoc/sau luu o
%TEMP%\panel-hien-tai.png / panel-ban-cuoi.png.

**Benh thay tu anh chup (panel dock RONG ~1340px):**
1. Bo cuc MOT COT keo dai — hinh xem truoc be ti giua khoi den khong lo.
2. "PPro undefined" tren topbar (getHostInfo khong ton tai sau reload panel —
   ScriptPath chi nap luc extension khoi dong, khong nap lai theo location.reload).
3. The khung hinh mini 40px nho vun; thanh cuon lo duoi hang chip; CTA gay dong.

**Sua:**
- **Bo cuc 2 cot tu 560px**: dieu khien trai (max 340px) + xem truoc la NHAN
  VAT CHINH ben phai (sticky, canvas toi 480px rong/520px cao — gap ~2,5 lan),
  panel hep van 1 cot theo thu tu chon -> xem -> hanh dong (order tren flex).
- Canvas xem truoc kieu MAN HINH THIET BI: bo goc 10px, vien sang + do bong,
  san khau radial gradient. Ve lai khi keo gian panel (resize + debounce 150ms).
- Fix host label: doc thang `app.version` (khong phu thuoc ScriptPath) ->
  "Premiere 26.5.0".
- The khung hinh: mini 52px, hover nang nhe, chon co vien accent quanh hinh.
- Chip: giau thanh cuon. Nut chinh MOT MINH mot hang (white-space nowrap),
  nut Tat xep duoi. Topbar them dau cham accent truoc ten.
- Palette pink/blue do database ui-ux-pro-max goi y -> BO, giu token Studio
  Console (luat dong bo 7 panel); chi lay nguyen tac OLED/density/hover/focus.

**Kiem chung:** cu phap sach, khong tham chieu mo coi (phanSafe/phanLuoi/
getHostInfo = 0 loi goi), cai lai + location.reload panel that, chup anh
nghiem thu: 2 cot dung, mock TikTok nhin nhu man hinh dien thoai, CTA 1 dong,
"Premiere 26.5.0" hien dung. Anh Tien dang mo panel — thay ngay ban moi.

## 2026-08-02 15:3x — DO PANEL THAT TRONG PREMIERE: DAT HET, dat overlay 0,2 giay

Anh Tien bao "mo roi do em" nhung cong 8096 van chet. Truy ra: Premiere da
RESTART LAN NUA luc 15:25 (log CEP moi + 5 renderer log moi, khong co
guideframe) — panel van chua duoc bam mo. Hoi CEP qua panel anh em:
`__adobe_cep__.getExtensions()` -> guideframe DANG KY DUNG (ten menu, 340x480).
-> Mo panel bang lenh `requestOpenExtension('com.aiostudio.guideframe.panel')`
qua cong 8088 — cong 8096 len ngay. MEO MOI: khoi can nguoi dung bam menu.

**Ket qua do tren panel that (sequence 1280x720/89s dang mo):**
- Khoi dong: v0.1.0 · PPro 26.5.0 · den xanh "San sang — sequence: 1280x720"
  · 2 tab · 10 chip nen tang · the khung hinh + dong tran an hien dung.
- **Bam "Hien guideline" (TikTok doc 9:16 tren sequence ngang 16:9): 201ms**
  (chi tieu MVP <= 2s — nhanh gap 10). Trang thai bao dung: "Dat len track V3
  · phu 89.00s/89.00s" + luu y ve vao vung giua 405x720 (nhanh lech ti le
  CHAY THAT trong production). Canh bao vang bat, nut doi "Da dat guideline ✓".
- **Bam "Tat guideline": 200ms** — "Da go 1 lop. Sequence sach", canh bao tat.
- Tab luoi: 5 chip ti le · 4 chip luoi · 7 mau · canvas song · meta
  "1280x720 · Theo sequence" (tu bam theo sequence that).
- Xuat .guides tu panel that: C:\AiOStudio\GuideFrame\AiO_tiktok-video.guides.

**MVP theo CLAUDE.md:** 3/4 da do dat (dat <=2s ✓ · toa do khop JSON ✓ ·
tat sach nhu cu ✓). Con lai: render thu soi file xuat + doi chieu nguoc
huong ngang/doc file .guides (anh Tien import file tren la thay ngay).

## 2026-08-02 13:59 — Nang cap tab Luoi bo cuc theo phan tich doi thu Guideify

**Anh Tien yeu cau:** tab luoi phai chon duoc ti le (khong chet cung 16:9),
chon mau, tu them duong; vao guideify (dodashviliguga.gumroad.com) phan tich
va lam ban minh toan dien hon.

**Phan tich Guideify (doc trang that bang browser — Gumroad render JS, WebFetch
tinh chi thay tieu de):** $15 giam $9 · 9:16 + 16:9 + safe zones + center +
custom layouts + LUU PRESET dung lai · tu nhan kich thuoc sequence · 1 click
bat/tat khong tao layer tren timeline · 4.5 sao/11 danh gia · KHONG thay chon
mau · khong mo phong UI that · khong du lieu tu cap nhat. Review co loi
"Could not write PNG (code 6)" -> Guideify cung sinh PNG trung gian nhu minh.

**Lam gi (dist/index.html + ve-guide.js):**
- Ti le khung xem truoc: Theo sequence / 9:16 / 1:1 / 4:5 / 16:9 (dat len
  sequence thi van luon theo kich thuoc sequence that).
- Mau luoi: 7 lua chon (Tu dong = moi nhom mot mau + 6 mau don). Mau ep ca
  vao overlay PNG lan file .guides (hex -> RGB 0-1).
- Duong tu them: toi da 12 duong, moi duong Ngang/Doc + vi tri %, ve mau cam
  accent, vao ca .guides. duongLuoi loai duong ngoai bien (pt<=0 hoac >=100).
- Preset cua toi: luu nguyen bo cau hinh (luoi+duong+mau+ti le) theo ten,
  bam ap lai, x xoa — ngang tinh nang "Save & Reuse Custom Presets" cua Guideify.
- luoiCfg them 3 truong (tiLe/mau/tuyChinh) co di cu tu ban cu trong localStorage.

**Kiem chung:** ham thuan: tuyChinh 2 duong / tat ca 15 duong / ngoai bien 0 —
DAT. Browser: 5 chip ti le · 7 swatch · canvas 9:16 ra 0.563, 1:1 ra 1.00 ·
2 hang duong · mau luu dung · preset luu + ap OK · 0 loi console. Cu phap sach.
Cai lai 13:59.

**So voi Guideify sau dot nay:** ngang (ti le, custom line, preset, tu nhan
sequence) + hon (mau tuy chon · UI that tung nen tang · 10 nen tang safe zone
co nguon · .guides export · du lieu ra soat quy). Con thua: ho co ban AE +
DaVinci, minh chi Premiere.

## 2026-08-02 13:53 — Lam lai UI duoi goc nguoi dung (review truc tiep cua anh Tien)

**Anh Tien che dung 4 diem, sua het:**
1. Chu %·px trong hinh "du thua, nhin khong hieu" -> BO khoi panel + PNG xuat.
   Chi con o ban duyet noi bo (opts.nhan, xem-truoc-safe-zones.html).
2. Ten dinh dang kieu nghien cuu ("Reels/moi video tu 06/2025") -> doi 17 ten
   sang ngon ngu nguoi dung ("Reels", "Stories", "Video doc tren Feed"...).
   XOA preset trung "ig-reels-organic" (2 Reels lam nguoi dung boi roi).
   Du lieu con 17 dinh dang / 53 vung — van qua bo kiem bat bien.
3. Moi so lieu phan tich tren panel (meta, ghi chu, cham trang thai nghien cuu)
   -> thay bang MOT dong: "✓ Thong so ky thuat da cap nhat phien ban moi nhat".
4. Chon nen tang/khung hinh "chua dep, chua than thien" -> chip nen tang co
   CHAM MAU THUONG HIEU (10 mau dung brand), khung hinh thanh THE HINH THU NHO
   dung ti le co ve san vung che (9:16 ra 23x40, 16:9 ra 64x36 — do that).

**Kiem chung:** 0 loi console · the mini dung ti le · 10 cham mau · dong tran an
hien · ten FB = [Reels, Stories, Feed 4:5, Video doc tren Feed] · 53/53 vung
khop JSON · khong tham chieu mo coi · cai lai 13:53 (Premiere PID 21120 dang
chay — panel mo len la an ban moi, manifest khong doi nen khong can restart).

**Ghi bo nho theo yeu cau anh:** 4 bai hoc vao design-lessons/LESSONS.md
(so lieu khong len UI nguoi dung / ten la ngon ngu nguoi dung / bo preset trung /
chon bang hinh) + luat UI vao CLAUDE.md du an (muc Quyet dinh so 5).

**Tra loi 2 cau kiem dinh cua anh (da nhan trong chat):** ranh vung = so kiem
chung tu tai lieu chinh thuc, 53/53 khop tung pixel; ICON la minh hoa dat dung
vi tri trong vung, co ~44px/1080 theo chuan pho bien — muon dung tung pixel theo
tung ban app phai can theo screenshot that moi quy (da ghi vao viec ra soat).

**Bay do luong moi ghi nhan:** `Select-Object -First N` sau script .ps1 lam
DUNG PIPELINE giua chung -> script chet truoc buoc cai ma tuong loi that.

## 2026-08-02 13:4x — DO END-TO-END TREN PREMIERE THAT: DAT het duong dat/go overlay

Anh Tien restart Premiere (PID moi 21120, 13:36). Cong 8096 im lang = panel
chua duoc mo — nhung khong can cho: engine ExtendScript la MOT engine chung,
muon cong debug 8088 (Asset Manager) de nap va do host Guide Frame BAN DA CAI.
Cong cu: `scripts/do-qua-cep.mjs` (CDP qua WebSocket, Node >= 22, ho tro @file).

**Ket qua do that (sequence thu "PodTest Nguon" 1280x720, 89s — dung bai
tren ban nhap):**

| Buoc | Ket qua |
|---|---|
| Nap host ban da cai | OK, gf_phienBan = 0.1.0 (ca file nap tron) |
| Trang thai goc | 3 track video, clip [1,1,0], 22 project item |
| gf_thongTinSeq | OK:1280/720/89s — doc dung |
| Ve + ghi PNG 1280x720 (yt-169) | 123.826 byte |
| **gf_datOverlay** | **OK: len V3 (track trong tren cung), daiThuc=89.00/daiSeq=89.00** |
| gf_demOverlay | 1 — dem dung |
| Trang thai sau dat | [1,1,1], 23 item — chi them dung 1 clip + 1 item |
| **gf_tatOverlay** | **xoa=1, conLai=0** |
| Trang thai sau go | **3#1,1,0#22 — GIONG HET goc, bin PNG cung tu don** |

**Hai rui ro da dong so:**
- ~~"Anh tinh mac dinh ~5s"~~ -> `setOutPoint(daiSeq, 4)` truoc khi dat AN THAT:
  overlay phu tron 89/89s, khong can ganh clip.end.
- ~~"Xoa co sach khong"~~ -> trang thai truoc/sau GIONG TUNG SO, ke ca so item
  trong project (don bin OK).

**Con lai chua do:** panel UI mo trong Premiere (anh chua mo — cong 8096 se
song khi mo Window > Extensions > AiO Studio - Guide Frame) · mapping
orientationType file .guides (cho import thu) · render thu xem overlay co trong
file xuat khi CO va KHONG co lop guide.

## 2026-08-02 09:03 — Tab "Luoi bo cuc" + lop UI THAT tung nen tang

**Anh Tien yeu cau 2 thu (sang 02/08):**
1. "Them mot tab guiline nua" — hoi lai bang AskUserQuestion, anh chot LUOI BO CUC.
2. "Phan frames hien elements dung chinh xac tung nen tang, tung icon cho thuc te".

**Lam gi:**
- `dist/ve-guide.js` +400 dong:
  - Bo icon vector canvas (tim, binh luan, chia se, luu dau, kinh lup, dia nhac,
    avatar+follow, pill, dong chu ma...) — khong anh ngoai, tu co theo khung.
  - 13 layout UI THAT theo nen tang: tiktok (tabs+cot phai+dia nhac+caption),
    reels (IG/FB), stories (progress+avatar+X+thanh reply), shorts (Subscribe
    trang+remix+progress do), snap (brand+CTA vang), pinterest (Save do),
    linkedin, x, zalo, yt-player 16:9 (thanh dieu khien+watermark), fb-feed
    (nut mute). Mac dinh BAT, tat duoc bang opts.uiThat=false.
  - `duongLuoi(cfg)` HAM THUAN + `veLuoi`: chia 3 (4 duong), tam (2+dau cong),
    ti le vang 38.2/61.8 (4), le tuy chinh % (4 duong dut). Mau tach nhom.
- `dist/index.html`: thanh 2 tab (Safe zone | Luoi bo cuc). Tab luoi: 4 chip
  bat/tat ghep duoc + o nhap le % (hien khi bat Le), preview theo TI LE SEQUENCE
  dang mo (chua noi Premiere thi 16:9), nho cau hinh localStorage. Nut Hien/Tat/
  .guides DUNG CHUNG hai tab (1 CTA moi man hinh) — Hien va .guides re nhanh
  theo tab dang chon. Chan bam khi chua bat luoi nao.

**Kiem chung (so do that):**
- Node (ham thuan): chia3=4 tam=2 vang=4 le=4 tatca=14 duong, cu phap sach.
- Browser: 0 loi console · icon TikTok ve that (341 pixel trang trong cot phai)
  · chuyen tab an/hien dung · chip luoi 4 + o nhap le hien dung · canvas luoi
  ti le 1.78 (16:9 fallback) · ve thu 18/18 khung khong nem loi, 14 khung co
  UI that · 57/57 vung van khop JSON tung pixel.
- Cai lai 09:03. Premiere van chua restart — mo lai la co ban nay.

**Luu y:** vi tri ICON la MINH HOA nam trong vung so lieu da kiem; RANH vung
van la so tu safe-zones.json. Con so tren icon (328K...) la gia lap co y.

## 2026-08-02 08:50 — Don UI theo yeu cau "clean va gon gang" cua anh Tien

**Sua gi (dist/index.html):**
- Chip nen tang: bo wrap (10 chip an 3-4 hang doc) -> MOT hang cuon ngang,
  chieu cao co dinh 1 chip du panel hep.
- Legend: truoc hien du 4 muc moi luc -> chi hien LOAI VUNG co mat trong khung
  dang chon (tiktok-video: 2 muc, grid-crop: 2 muc, fb-feed: 1 muc).
- Gop 2 dong meta thanh 1: "1080x1920 - so chinh thuc - so lieu 2026-08-01".
- Xoa footer (lap lai thong tin ngay du lieu da co o meta — mot thong diep
  mot noi) + xoa CSS .chan mo coi + cat chu thua o hint .guides.

**Kiem chung:** node --check sach, khong con tham chieu mo coi (grep chan/
metaDuLieu = 0), do DOM: chips 1 hang = true, legend 2/2/1 dung ngu canh,
57/57 vung van khop JSON, footer = null. Cai lai ban moi 08:50 — Premiere van
chua restart tu 01/08 15:11 nen ban trong Premiere se la ban nay khi anh mo lai.

## 2026-08-01 22:23 — v0.1.0: research 5 nhanh + build panel dau tien + cai dev

**Boi canh:** anh Tien tao folder + file `Brandstorm chuc nang.txt`: tool cho editor
chon nen tang (FB/TikTok/IG/Shorts...) -> sequence hien guideline safe zone. Yeu cau
research ky roi dua so chinh xac vao panel. Anh chot "xong roi thi build di em".

**Research (5 agent song song, ket qua day du trong `nghien-cuu-safe-zone.md`):**
- Meta cong bo theo PHAN TRAM (14/35/6 cho Reels, gop 4 placement tu ~03/2026);
  TikTok co so px chinh thuc trong file ads (130/484/44/140); Google Shorts 10%/25%/10%.
- KHONG nen tang nao co spec may-doc-duoc -> "real time" = JSON minh tu duy tri,
  ra soat moi QUY (spec ads doi 2-4 nam/lan, UI organic doi 1-3 lan/nam).
- Doi thu: chi Guideify ($9-15) lam guide that trong Premiere; KHONG ai co du lieu
  tu cap nhat tu xa. Premiere KHONG co guide-layer kieu AE: track output/enable
  tat la mat ca preview lan export -> khong co cong tac "hien ma khong xuat".
- File `Installed Guides.guides` cua Premiere la JSON thuan, vi tri theo %,
  khong bao gio dinh vao export (da doc file that tren may nay).
- Mot bo so moi nen tang la du (chinh nen tang lam vay; le hong 6% cua Meta
  chinh la khoan tru hao may man dai).

**Build v0.1.0 (theo khuon Re-Frames: dist tinh, khong buoc build):**
- `safe-zones.json` = NGUON CHAN LY: 10 nen tang, 18 dinh dang, 57 vung, moi vung
  co pt (%), px1080 tham chieu, trangThai (chinh_thuc/ben_thu_3/uoc_luong),
  loai (ui/crop/khuyen_nghi), nhan song ngu, nguon.
- `scripts/sinh-du-lieu.mjs`: kiem bat bien (pt<->px lech >1px la FAIL, vung phu
  >95% khung la FAIL) roi sinh `dist/safe-zones.js`. Chay trong sign-install.
- `dist/ve-guide.js`: bo ve DUNG CHUNG cho panel + ban xem truoc (1 nguon ve).
  Ham thuan `tinhVungPx` do kiem duoc khong can DOM.
- `dist/index.html`: song ngu VI/EN tu dong dau (NGON_NGU + t()), chon nen tang
  -> khung hinh -> xem truoc -> CTA "Hien guideline tren sequence". Overlay =
  PNG ve dung kich thuoc sequence, ghi ra `C:/AiOStudio/GuideFrame/` (KHONG dung
  %APPDATA% - bi ao hoa), import vao bin "AiO Guide Frame", dat len track video
  TRONG tren cung. Seq khac ti le khung -> ve vao vung giua dung ti le + lam mo
  ngoai. Tag "TAT TRUOC KHI XUAT" nhung thang vao anh. Canh bao vang khi sequence
  con lop guide. Nut phu "Luu file .guides" (guide goc Premiere, vi tri %).
- `host/guideframe.jsx`: gf_thongTinSeq / gf_datOverlay / gf_tatOverlay /
  gf_demOverlay + gf_phienBan CUOI FILE (chan benh evalFile nuot giua chung).
  Panel $.evalFile lai host truoc MOI lenh (chan benh panel moi - host cu).
  AN TOAN: KHONG dung QE (khong tu them track - het track trong thi bao
  ERR:HET_TRACK kem huong dan); khong dat de len clip nguoi dung; xoa duyet nguoc.
- `xem-truoc-safe-zones.html`: ban duyet bang mat 18 khung cho anh Tien.
- ID `com.aiostudio.guideframe`, cong debug 8096, v0.1.0. Da ky + cai dev OK.

**Da kiem chung (so do that):**
- sinh-du-lieu: 57/57 vung qua bo kiem bat bien.
- Browser: 57/57 vung tinhVungPx khop px1080 tung pixel, 0 loi console,
  0 tran ngang o be rong 300px, nut chinh 34px/nut thuong 28px dung token,
  ban xem truoc 18/18 canvas co net ve.
- node --check sach: ve-guide.js, safe-zones.js, script inline cua index.html.
- sign-install chay tron: ky OK (khong timestamp - TSA loi mang), cai vao
  %APPDATA%\Adobe\CEP\extensions\com.aiostudio.guideframe, du dist/index.html.

**CHUA kiem duoc (Premiere dang chay tu 15:11, chua restart):**
- Panel chua tung mo trong Premiere that -> gf_datOverlay/gf_tatOverlay chua do
  end-to-end. Rui ro da biet truoc: (1) anh tinh mac dinh ~5s, da co 2 lop
  keo dai (setOutPoint truoc khi dat + gan clip.end sau khi dat, doc lai bao
  daiThuc that); (2) mapping orientationType 0/1 trong file .guides suy tu file
  mau, chua doi chieu nguoc — neu nguoc thi guide ngang/doc trao nhau, sua 1 dong.
- Chua thu ghi de "Installed Guides.guides" luc Premiere dang chay (spike 30
  phut, de danh sau khi anh duyet huong).

**Bai hoc:**
- Content farm 2026 bia "thay doi UI" nghe rat that (vi du "TikTok them nut
  playlist 01/2026") — chi tin thay doi co nguon goc (blog chinh chu, bao lon).
- Do DOM khi Browser pane an: clientWidth/innerWidth = 0 -> "tran ngang 264px"
  la so ao. Phai doi chieu scrollWidth voi be rong NOI DUNG truoc khi sua.
