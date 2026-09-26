# Nghiên cứu safe zone các nền tảng — nguồn gốc mọi con số trong `safe-zones.json`

> Bắt đầu 2026-08-01. Mỗi con số trong JSON phải chỉ về được một dòng ở đây.
> Quy ước trạng thái: ✅ chính thức / khớp nhiều nguồn · ⚠️ UNVERIFIED (bên thứ
> ba, đơn nguồn) · ❗ MÂU THUẪN giữa các nguồn (ghi nguyên trạng, KHÔNG lấy trung bình).

## Phát hiện xuyên suốt (cập nhật dần)

1. **Không nền tảng nào công bố safe zone dạng máy-đọc-được (JSON/API).** TikTok
   giấu số trong file .zip ở trang ads specs; Google chỉ công bố **phần trăm**.
   → "Real time theo nền tảng" chỉ khả thi ở dạng: bộ JSON do MÌNH duy trì + panel
   tự kiểm tra bản mới.
2. **Số cho ORGANIC hầu hết là đo lại của bên thứ ba** — chính chủ chỉ công bố cho
   ADS. May là UI ads ⊇ organic nên số ads là biên an toàn.

---

## 1. TikTok — video dọc (canvas 1080×1920, 9:16)

Nguồn chính thức duy nhất có px: file safe-zone .zip đính kèm trang ads specs
(ads.tiktok.com, bản 06/2026). Số dưới đây được ≥3 nguồn 2026 tái bản từ file đó, khớp nhau:

| Zone | Kích thước | UI chiếm chỗ | Trạng thái |
|---|---|---|---|
| Top | **130 px** | Tabs LIVE/Following/For You + Search (gồm cả status bar OS) | ✅ |
| Bottom | **484 px** (một nguồn ghi 483) | Username, caption, music ticker, CTA (ads), music disc | ✅ (❗ 483 vs 484) |
| Right | **140 px** | Avatar+follow, Like, Comments, Bookmark, Share, disc xoay | ✅ |
| Left | **44 px** | Không icon — chống crop mép giữa các đời máy | ✅ |

- Bottom 484 là số **ads** (có CTA). Organic bên thứ ba đo 250–350 px (❗ zeely
  250–300 · recharm 300–320 · tikadsuite 350). Dùng 484 là biên an toàn cho cả hai.
- **Profile grid crop ~3:4**: tile lưới profile center-crop → mất ~240 px trên +
  ~240 px dưới của khung 1920. ⚠️ chỉ bên thứ ba xác nhận (socialrails, pixpipe,
  nemovideo 2026); 240 px là suy từ ratio, không phải số đo gốc.
- ❗ tikadsuite (2026) nói right chỉ 64 px, bottom 350 px — lệch hẳn cụm 140/484,
  mâu thuẫn với ảnh chụp UI thật. Nghiêng về 140/484.
- TopView: 2 giai đoạn (3s đầu full-screen cấm đè logo/nút Skip → về in-feed).
  Số px trong zip TopView (146,76 KB) — ⚠️ chưa mở được zip.
- TikTok ghi rõ: safe zone **co giãn theo độ dài caption + Interactive Add-on** —
  số cố định chỉ là baseline.

### TikTok photo mode / 16:9
- Photo mode: UI như video + chấm pagination trên caption (bottom dày thêm).
  Bên thứ ba: top 150 · bottom 250–270 · right 100 (wavegen, postfa.st 01/2026). ⚠️ toàn bộ.
- Video 16:9: phát letterbox giữa khung 9:16 — UI hầu như không đè lên video.
  Mọi nguồn khuyên đừng dùng 16:9 trên TikTok.

Nguồn: ads.tiktok.com/help/article/video-ads-specifications (06/2026) ·
ads.tiktok.com/help/article/tiktok-reservation-topview ·
ezugc.ai · getkoro.app (03/02/2026) · tikadsuite.com · hopperhq.

## 2. YouTube Shorts (canvas 1080×1920, 9:16)

**Số CHÍNH THỨC duy nhất (Google, trang Shorts Ads, fetch trực tiếp 01/08/2026):**
tránh **top 10% = 192 px · bottom 25% = 480 px · right 10% = 108 px**.
Nguồn: business.google.com/us/ad-solutions/youtube-ads/shorts-ads ·
support.google.com/google-ads/answer/9128498 · /13547298.

Bên thứ ba đo organic (❗ mâu thuẫn — ghi nguyên trạng):

| Zone | Hopper HQ 25/03/26 | Pod2Reels 10/07/26 | AdvertHunt 26 | PostPlanify 26 | UI chiếm chỗ |
|---|---|---|---|---|---|
| Top | 180 | ~170 | 180 | 120 | Search + camera/3-chấm |
| Bottom | 390 | ~330 | 350 | 300 (360–400 khi mở description) | Kênh + Subscribe, title, music ticker |
| Right | 120 | ~120 | 120 | 96 | Like, Dislike, Comments, Share, Remix |
| Left | 60 | ~50 | 40 | ~48 | Không icon |

→ Dải hội tụ: top 170–190 · bottom 330–400 · right 96–120 · left 40–60.
Mốc chính thức Google (192/480/108) **bao trùm** mọi số đo → an toàn nhất để nhúng.
- Progress bar sát mép dưới ~10–20 px ⚠️. Subscribe 2026 to hơn ~180×80 góc dưới ⚠️ đơn nguồn.

### 2a. ☠️ ĐO THẬT 25/09/2026 trên ảnh chụp điện thoại anh Tiến — KHUNG CŨ SAI Ở CỘT PHẢI + HÀNG TRÊN

Anh gửi ảnh chụp màn hình chính video của anh trên YouTube Shorts (iPhone, **1290×2796**, góc
CHỦ KÊNH: có pill "Số liệu phân tích", badge AI, "Bị chặn", nút "Chia sẻ video của bạn") và nói
*"khung guideline frame YouTube Short chưa đúng"*. Đo pixel bằng Python/PIL (`scripts/do-anh-that/`):

| Thứ | Toạ độ màn hình (px) | Quy về 1080×1920 | Khung CŨ | Khung MỚI |
|---|---|---|---|---|
| Thanh điều hướng dưới (đen phẳng) | từ y **2553** (seek bar 2544–2552, vạch xám 2550–2552, nền #0f0f0f từ 2553) | video = vùng 0..2553 | — | — |
| Cách iPhone hiện video 9:16 | hình còn dưới mốc 9:16 vừa-bề-rộng (2293); không có đường nối sắc→mờ tại 2293 (loại letterbox+blur); hàng 0–60 có 460–520 màu (video sau status bar); fit-width cho navTop → 2240 > 1920 vô lý → **phủ kín chiều cao, cắt 2 mép** | k = 2553/1920 = 1,3297; cắt **55 px nguồn mỗi mép (5,1%)** | không có vùng cắt | left **7%** loại crop (iPhone 5,1%; Android 20:9 ~6,2% hình học; 21:9 ~9% chưa phủ) |
| Hàng trên: back / search / 3 chấm | y 219–278 (status bar 64–108) | hết ở **208 px = 10,8%** trên Pro Max; UI neo pt → iPhone 15/16 ~**12,0%** | top 10% (192) cắt ngang icon | **top 13%** (250) |
| Cột icon phải: tim, bình luận, lưu, chia sẻ, phối lại (mờ), ô nhạc | x **1131–1255**, y 1493–2489; 6 phần tử cùng tâm x 1193,5 ± 0,5, bước 178 px | nhãn "Chia sẻ" mép trái **905 px** → lấn **16,2%** (Android 20:9 ~17,3%); tâm x 952,5 (88,2%W); tim 59,6%H, bước 7,0%H; ô nhạc 95,6%H | right 10% (108): icon nằm NGOÀI vùng đỏ, mock vẽ tâm ~94%W (bị cắt khỏi màn) và bắt đầu 46%H, có avatar trong cột | **right 18%** (194); mock tâm 88,2%W từ 59,6%H, ô nhạc vuông 72 px |
| Khối chữ dưới-trái (**góc chủ kênh**) | y 1974 (avatar) … 2489 (nút), x từ 48 | bắt đầu **1485 px = 77,3%** (cần 22,7%); chữ từ 91 px = 8,4%W | bottom 25% (480) đã phủ; mock chữ từ 4,5%W (bị cắt) | bottom 25% giữ. Mock vẽ góc **NGƯỜI XEM neo đáy** (ước, phản biện #3): nhạc 95,6%H · tiêu đề 91,5%H · avatar + tên + Subscribe 87,6%H; ngang: chữ từ 8,4%W, avatar 72 px, tên từ 183 px |

- Phép kiểm: vẽ guide 1080×1920 bằng chính `ve-guide.js` (harness `ve-shorts.html` + máy chủ tĩnh
  8125), phóng lên 1432×2545, dịch −71 px, đặt chồng lên ảnh chụp → bản cũ: mock icon lệch hẳn cột
  thật; bản mới: icon giả trùng icon thật, hàng trên trùng, hàng kênh trùng. Ảnh `shorts-truoc-sau.jpg`
  đã gửi anh 21:27.
- 2 agent đo lại độc lập (21:3x): navTop **2553** (2545 là vạch seek bar), k = 1,3297, cắt **55 px
  nguồn/mép**, top 208–209, right 175 (16,2%), bottom 435 (chủ kênh), left 91, tâm cột 952,5 px, 6 phần
  tử cột cùng tâm x 1193,5 ± 0,5, bước 178 px màn. Mock sau tinh chỉnh: tâm icon giả lệch icon thật
  ≤ 12 px màn hình (≤ 9 px nguồn), tâm cột lệch 1 px.
- Góc NGƯỜI XEM khác góc chủ kênh (không có pill Số liệu / AI / Bị chặn / nút Chia sẻ), khối chữ
  ngắn hơn nên nằm THẤP hơn → vùng 25% đo từ góc chủ kênh vẫn phủ. Chưa có ảnh góc người xem + Android.
- Bài học: số ads chính thức (10/25/10) là biên cho ADS; UI organic trên máy thật lấn khác — **ảnh chụp
  thật của người dùng là thước tốt nhất**, mock UI phải đo từ ảnh, không vẽ theo cảm tính.

## 3. YouTube 16:9 player (1920×1080)

| Thứ | Số liệu | Trạng thái |
|---|---|---|
| End screens | 5–20 s cuối · video ≥25 s · tối đa 4 element · element video ≈ 1/3 bề rộng (~640 px) · subscribe circle ≈ 10% cao (~108 px) | ✅ official (answer/6388789); kích thước element ⚠️ ANFX |
| Control bar | Quy ước chừa bottom 10% = 108 px khi controls hiện | ⚠️ convention |
| Watermark kênh | 150×150 px min, hiện góc dưới-phải ~40×40 px, chỉ landscape | ✅ specs · 40 px ⚠️ |
| Captions | Đáy-giữa, tự đẩy lên khi controls hiện, user kéo được | ⚠️ |
| Broadcast safe | SMPTE ST 2046-1: action 93% · title 90%. Mặc định Premiere: action 90% · title 80% → 1920×1080: action margin 96/54 px, title margin 192/108 px | ✅ chuẩn ổn định |
| Thumbnail 1280×720 | Badge thời lượng ~90×34 px góc dưới-phải; chừa ~150×60 px góc đó; bo góc UI mới ~16 px | ⚠️ |

- 16:9 trên mobile feed: 1 nguồn claim vài placement crop ~8–10% hai bên ❗ DISPUTED
  — không nhúng làm số cứng, chỉ khuyên "giữ nội dung chính trong 80% giữa".
- Máy màn 19.5:9 pinch-to-zoom fill: crop ~18% tổng chiều cao — hành vi user, không phải overlay.

## 4. Template chính thức tải được (để ĐO KIỂM)

| Nền tảng | File | URL |
|---|---|---|
| TikTok | Safe zone .zip theo placement (In-Feed 84 KB · In-Feed+Anchor 3,8 MB · TopView 146,76 KB) | ads.tiktok.com — 3 trang specs; link render động, cần browser |
| Google/YouTube | Ảnh "red safe area" 1080×1920 + template PNG trong suốt | support.google.com/google-ads/answer/9128498 · /13547298 |

Cả hai đều KHÔNG có spec machine-readable.

## 16. Biến thiên thiết bị + lịch sử đổi UI 2023–2026

### 16a. Một bộ số mỗi nền tảng là ĐỦ — chính nền tảng làm vậy
- **Meta nói thẳng** (Help 980593475366490): màn hình cao hơn 9:16 thì video "có
  thể zoom-fill (cắt mép) hoặc letterbox" — advertiser không kiểm soát được. Và lề
  hông 6% của Meta **chính là khoản trừ hao cho máy màn dài** (trang ads-guide ghi
  rõ lý do).
- TikTok phát MỘT bộ template cho mọi máy (chỉ tách bản LTR/RTL), tự nhận "preview
  không theo thiết bị cụ thể". Google cũng một bộ %.
- Hình học (tự tính): máy 19.5:9 (iPhone) zoom-fill cắt ~97 px mỗi bên trên canvas
  1080; máy 20:9 (đa số Android) cắt ~108 px (~10%/bên) — VƯỢT lề 6% của Meta.
  Letterbox thì ngược lại: safe zone công bố còn DƯ hơn thực tế. Sai số dọc do
  system inset (nav bar Android 48dp, home indicator iOS ~34pt) ≈ ±5% chiều cao —
  đã được các biên bottom 20–35% nuốt trọn.
- **Dân chuyên nghiệp thiết kế theo spec ads của nền tảng và bỏ qua khác biệt máy**
  (mọi agency guide có ngày 2024–2026 đều vậy). Mẹo ngành: design MỘT LẦN theo
  vùng chặt nhất (Reels 14/35/6) → qua được Reels là qua gần hết TikTok/Shorts.
- **Rủi ro crop lớn nhất KHÔNG phải thiết bị mà là NGỮ CẢNH HIỂN THỊ**: lưới
  profile IG cắt 9:16 về 3:4, feed cổ điển cắt về 4:5 (mất ~30% chiều cao 1920).
  Đây là thứ đáng vẽ thành overlay riêng ("grid-safe", "feed-preview-safe").
→ Panel: mỗi nền tảng MỘT bộ số theo %; thêm tuỳ chọn "màn dài zoom-fill" lề hông
  10% cho ai cần chặt.

### 16b. Lịch sử đổi UI — trả lời câu "real time nghĩa là gì"
- **Hai nhịp đổi khác nhau:** số spec ads đổi RẤT chậm (Meta giữ ~4 năm, TikTok
  ~5 năm → 2–4 năm/lần); UI organic (nút, tab, caption) đổi **1–3 lần/năm/nền
  tảng**, thường xê dịch vài chục px bên trong biên đã công bố.
- Sự kiện lớn 2023–2026: **IG đổi lưới profile 1:1 → 3:4 (01/2025)** — phá mọi
  template grid-safe qua đêm · **Facebook biến MỌI video thành Reels (17/06/2025,
  chính thức từ about.fb.com)** — safe zone Reels nay áp cho toàn bộ video FB ·
  **Meta gộp 4 placement về một vùng 14/35/6 (~03/2026)** · YouTube Shorts đổi
  player 10/2024 và **03/07/2026** (bỏ dislike, thêm tim, 2x speed, chế độ "clear
  screen" cho người xem ẩn toàn bộ overlay).
- ❗ Cảnh giác content farm 2026: "TikTok thêm nút playlist làm right zone +20px
  (01/2026)", "Subscribe to hơn 30% cuối 2025" — CHỈ có trên blog SEO/AI, không
  nguồn gốc. KHÔNG nhúng vào data. (Câu "TikTok thêm nút 01/2026" em từng nói
  với anh Tiến từ báo cáo nhóm 4 — nhóm 5 rà lại thì thuộc diện nghi ngờ này.)
- **Nhịp cập nhật thực tế cần thiết: rà mỗi QUÝ** 4 nguồn chính thức (Meta help
  980593475366490 + ads-guide · TikTok ads specs · Google answer/16041697 ·
  blog.youtube + about.fb.com) + rà đột xuất khi có announcement lớn.
- **Dữ liệu phải là JSON có ngày, TÁCH khỏi code panel** — data đổi thường xuyên
  hơn app 5–10 lần, không thể bắt người dùng cài lại .zxp mỗi lần.
- Tin vui: sau đợt gộp 2026 của Meta, bộ data co lại — 4 placement Meta = 1 vùng.

## Khuyến nghị preset (chưa chốt — chờ đủ 5 nhóm research + đo kiểm template)

- **TikTok:** top 130 · bottom 484 · left 44 · right 140. Tuỳ chọn phụ "organic": bottom 350.
- **Shorts "official":** top 192 · bottom 480 · right 108. "Measured": 180/350(→400)/120/60.
- **YouTube 16:9:** action 90% + title 80% (khớp Premiere) + lớp "player controls" bottom 108 px + watermark góc dưới-phải (approximate).
- Tooltip panel phải ghi: *"UI đổi theo phiên bản app — số cập nhật 08/2026"*.

---

## 5. Snapchat (canvas 1080×1920)

Số **chính thức hiện hành** từ Snap Business Help (đọc trực tiếp 01/08/2026),
áp dụng THỐNG NHẤT cho Stories + Spotlight + Commercials (Snap ghi rõ "one safe
zone spec"):

| Zone | Kích thước | UI chiếm chỗ | Trạng thái |
|---|---|---|---|
| Top | **150 px** | Tên brand + headline, progress bar | ✅ businesshelp.snapchat.com/s/article/snap-ads-practices |
| Bottom | **330 px** | Nút CTA (vị trí ĐỘNG theo từng lần hiển thị), vùng swipe-up | ✅ |
| Hai bên | Không có số chính thức | (bên thứ ba vẽ 40–65 px ⚠️) | |

❗ **Số "top 150 / bottom 460" lan truyền trên mạng là số CŨ** (Spotlight
~2021–2023). Số hiện hành là **150/330**. Nếu muốn preset siêu an toàn thì thêm
"Spotlight legacy 460" ghi rõ nhãn legacy.

## 6. Pinterest

- **9:16 full-bleed (kiểu Idea Pin)** — 1080×1920. Safe zone **CHÍNH THỨC** từ
  help.pinterest.com/en/business/article/pinterest-product-specs (còn sống 08/2026):
  **top 270 · bottom 440 · left 65 · right 195**. (Idea Pins đã gộp vào Pin thường
  2024 nhưng trang specs vẫn công bố đúng bộ số này.)
- **Video pin thường 2:3 (1000×1500)**: KHÔNG có safe zone — UI nằm dưới card,
  video hiện sạch. ✅ "official absence".

## 7. LinkedIn

- **Feed video thường**: ratio chấp nhận 1:2.4 → 2.4:1 (ngoài khoảng thì letterbox,
  không crop). **UI KHÔNG đè lên video** — header trên, thanh reaction dưới, chỉ có
  nút mute/captions thoáng qua góc. ✅ Không cần zone che, chỉ cần guide lề.
  (linkedin.com/help/linkedin/answer/a1311816)
- **Feed video DỌC kiểu TikTok (2024–2025)**: 1080×1920, LinkedIn KHÔNG công bố
  safe zone. Bên thứ ba (aicarousels.com 2025, chỉ MỘT nguồn có số): top 108 ·
  bottom 320 · left 60 · right 120. ⚠️ toàn bộ UNVERIFIED.
- Ads: 16:9 / 1:1 / 4:5 / 9:16, không có safe zone công bố.

## 8. X (Twitter)

- Ratio hỗ trợ chính thức (business.x.com ad specs): 4:5 1440×1800 · 2:3 1080×1620 ·
  1:1 · 1.91:1 · 16:9 · 9:16 (max 1080×1920). ✅
- **Immersive viewer (video dọc)**: X KHÔNG công bố safe zone. Bên thứ ba
  (socialk.it 2026): bottom ~400 · right ~140. ⚠️ UNVERIFIED.
- Amplify pre-roll: cảnh báo chính thức overlay ở góc trên-trái + hai góc dưới,
  không có px.

## 9. Threads

- Không có trang spec chính thức. Bên thứ ba: 1080×1920 khuyến nghị, max 5 phút/1 GB.
  9:16 hiển thị **thu nhỏ căn trái trong feed** (không full-bleed). UI không đè
  lên video. → Chỉ cần crop guide, không cần zone che. ⚠️/✅ absence.

## 10. Zalo (nền tảng Việt)

- **Zalo Ads chính thức** (ads.zalo.me, sống 08/2026): video 16:9 / 9:16 / 1:1 ·
  MP4 H.264 · ≤150 MB · **max 60 giây**. ✅
- Chính sách Zalo BẮT BUỘC "nội dung chính nằm trong vùng an toàn" nhưng **không
  công bố con số nào** — chỉ có hình minh hoạ. Bên thứ ba ước 10–15%/cạnh ⚠️.
- ❗ Hai trang chính thức của Zalo vênh nhau về thumbnail: 1440×810 vs 1200×627.
- Zalo Video (tab kiểu TikTok): không có spec công khai. → preset phải ghi rõ
  nhãn "ước lượng — Zalo không công bố".

## 11. Chuẩn broadcast — đọc từ văn bản gốc

- **EBU R95 v1.1 (06/2017, hiện hành)** và **SMPTE ST 2046-1:2009** KHỚP NHAU
  từng pixel: **action-safe = lề 3,5% mỗi cạnh (vùng 93%)** · **graphics/title-safe
  = lề 5% (vùng 90%)**.
  - 1920×1080: action 1786×1004 (lề 67/38 px) · title 1728×972 (lề 96/54 px).
  - 3840×2160: action lề 134/76 · title lề 192/108. 1280×720: action lề 45/25 · title lề 64/36.
- ❗ **Cặp "90%/80%" (mặc định Premiere đang hiện) là chuẩn ANALOG CŨ** — ST 2046-1
  chỉ giữ làm chế độ legacy cho 720×480. Caption CEA-708 vẫn tham chiếu vùng 80%
  → nên có toggle "caption-safe 80%".
  - ⚠️ Ghi chú lại mục 3 ở trên: dòng "Mặc định Premiere: action 90/title 80" vẫn
    đúng là *mặc định của Premiere*, nhưng KHÔNG phải chuẩn broadcast hiện hành.
- Bonus EBU: bảo vệ 4:3 caption-safe = lề 16,25% hai bên (312 px mỗi bên trên 1920).

Nguồn gốc: tech.ebu.ch/docs/r/r095.pdf · pub.smpte.org/pub/st2046-1/st2046-1-2009.pdf.

---

## 12. Meta — Facebook (đọc trực tiếp Ads Guide 01/08/2026)

**Phát hiện quan trọng nhất:** Meta công bố theo **PHẦN TRĂM, không phải pixel**
(top 14% / bottom 35% / mỗi bên 6% cho mọi Reels + IG Stories ads). Pixel do mình
tự quy đổi theo canvas — và chính px Meta tự ghi còn lệch toán (14% của 1920 = 269
mà Meta ghi "250 px"). → **JSON phải lưu %, panel quy đổi theo canvas.**

### 12a. Facebook Feed video 4:5
- Canvas: 1080×1350 (organic) / 1440×1800 (ads khuyến nghị hiện tại). ✅
- **UI KHÔNG đè lên video**: avatar + tên + caption nằm TRÊN khung, thanh
  like/comment/share nằm DƯỚI khung. ✅ (AdNabu 06/2026, LucidMedia 05/2026)
- Trong player chỉ có: nút mute ~90×90 px góc dưới-phải ⚠️ · thanh tua khi chạm ⚠️.
- **Crop:** 4:5 hiện nguyên vẹn trong feed. Cái BỊ crop là **video 9:16 khi xuất
  hiện trong feed cổ điển → bị cắt còn ~4:5** (mất trên+dưới). Desktop right-column
  ads crop 1:1.
- Khoảng đệm ~100 px các cạnh chỉ là khuyến nghị bên thứ ba ⚠️ — vẽ nhãn
  "recommended", không phải "UI che".

### 12b. Facebook Reels 9:16
- Canvas 1080×1920 (ads khuyến nghị 1440×2560).
- **CHÍNH THỨC:** tránh **top 14% (269 px) · bottom 35% (672 px) · mỗi bên 6%
  (65 px)** — facebook.com/business/ads-guide/update/video/facebook-facebook-reels
  (URL lặp chữ "facebook" — URL thường 404).
- Safe rect trên 1080×1920: **x 65→1015, y 269→1248 (≈950×980 giữa khung)**.
- ❗ Cột icon phải đo thật rộng ~110–120 px (cách mép ~49 px) — RỘNG HƠN 65 px
  chính thức → panel nên vẽ CẢ HAI vạch (official 65 + measured 120).
- Ads có disclaimer (nhà đất/chính trị): tránh **bottom 40% = 768 px** ✅
  (Help 980593475366490). Trang này cũng ghi: màn hình lớn có thể **crop hoặc
  letterbox phần ngoài safe zone**.

### 12c. Facebook Stories
- **CHÍNH THỨC trang FB Story:** top "14% (250 px)" · bottom "20% (340 px)".
  (Toán của Meta lệch: 14%=269, 20%=384.)
- ❗ **MÂU THUẪN THẬT giữa hai trang chính thức:** trang IG Story đã đổi sang bộ
  thống nhất 14/35/6, trang FB Story vẫn 14/20 (đọc 01/08/2026). → Vẽ vạch 35%
  nhãn "unified/strict" + vạch 20% nhãn "FB Stories legacy".
- Zones: top 250–269 (progress bar, avatar, tên, X) · bottom 340–384 (CTA ads;
  organic là thanh "Send message").

### 12d. FB 1:1 + in-stream
- Feed 1:1: như 4:5 — không UI đè. In-stream ads 16:9/1:1: tag Sponsored +
  skip/countdown gần đáy player, KHÔNG có số chính thức ⚠️ → gợi ý dải cảnh báo
  bottom 10%.

## 13. Meta — Instagram

### 13a. IG Reels
- **CHÍNH THỨC ads:** top 14% (269) · bottom 35% (672) · bên 6% (65) trên 1080×1920 ✅.
- **Organic đo bên thứ ba (❗ mâu thuẫn, ghi nguyên trạng):**
  - Top: 108 px (Outfy/Minta — chỉ dải mute/username) vs 250 px (ScreenSnap
    04/2026 — tính cả pill tên nhạc).
  - Bottom: **320** (Outfy, Minta, CampaignSwift) vs **350** (ScreenSnap) vs
    **480** (Zeely). KHÔNG lấy trung bình.
  - Right: 120 px (cột like/comment/share/save/3-chấm) · Left: 60 px.
  - Safe rect organic hay được công bố: x 60→960, y 108→1600.
- Vạch ads 35% BAO TRÙM mọi số organic → là biên an toàn.

### 13b. Lưới profile 3:4 (đổi từ 1:1, Mosseri công bố 01/2025, xong trong 2025)
- Reel 9:16 trên tile 3:4: hiện **giữa khung 1080×1440 → MẤT 240 px trên +
  240 px dưới**. ✅ hình học + Buffer 03/2026, Oktopost, Growthscribe.
- ❗ Số "center 1080×1350, mất 285 px" còn lan truyền là **toán 4:5 CŨ — đã lỗi
  thời** với lưới 3:4.
- Post 4:5 trên tile 3:4: mất ~33 px mỗi BÊN (hiện ~1012×1350). Post 3:4
  (1080×1440, thêm từ ~05/2025): không crop.
- User chỉnh lại được crop preview sau khi đăng (tính năng chính thức).

### 13c. IG Stories
- **Trang ads chính thức đã đổi sang 14/35/6** (đọc 01/08/2026) — thay cho
  "250 px trên dưới" tồn tại lâu nay.
- Organic thực tế vẫn khớp ~250 px trên (progress+avatar) + ~250 px dưới (thanh
  reply DM). → Panel: organic = vạch 250; ads = overlay 14/35/6.

### 13d. IG Feed dọc 2026
- Ảnh: 4:5 (1080×1350) vẫn là khuyến nghị; **3:4 (1080×1440) upload thẳng được
  từ ~05/2025**, hiện nguyên trong feed + khớp lưới mới.
- **Video feed nay chính là Reels**: trang ads IG Feed video ghi 1080×1920 9:16.

### 13e. Đáng giá cho panel
- Ads Manager có sẵn toggle **"Safe Zone Range"** hiện overlay vàng trên preview ✅
  — bằng chứng Meta tự thấy cần tool này; mình đem nó vào thẳng Premiere.
- Template chính thức của Meta (PPT/PSD/Keynote, bản 2023-08-24, vẫn khớp luật
  14/35/6): facebook.com/gms_hub/share/safe-zone-checker-2023-08-24.psd (+.pptx/.key)
  — link từ facebook.com/business/ads/facebook-instagram-reels-ads. **Dùng để ĐO KIỂM.**
- Không có spec máy-đọc-được.

---

## 14. Đối thủ trên thị trường (nghiên cứu 01/08/2026)

### Kết luận 30 giây
- Đối thủ trực tiếp nhất trong Premiere: **Guideify** — $15 (đang giảm $9), CEP
  extension trên Gumroad, 4.5★/11 đánh giá. Dùng **guide thật của Premiere**
  ("không tạo layer trên timeline, 1 click bật/tắt"), tự nhận kích thước sequence.
  KHÔNG tự cập nhật dữ liệu.
- Thị trường chia 3 nhóm: (1) extension tạo guide thật — chỉ Guideify; (2) pack
  PNG/MOGRT $0–10 thả lên track — nhiều vô kể, "ngu", dễ quên xoá trước export;
  (3) tool web ngoài NLE (Kapwing, StreamLadder, PostPlanify) — dữ liệu tươi
  ("updated monthly") nhưng không nằm trong Premiere.
- **KHÔNG đối thủ nào trong Premiere/AE cập nhật dữ liệu safe zone từ xa.** Khoảng
  trống đúng chỗ mình nhắm. Nỗi đau có thật: TikTok thêm nút "Add to Playlist"
  01/2026, IG phóng to thanh audio cuối 2025 → mọi pack PNG bán trước đó sai hết.
- Người dùng đã xin Adobe tính năng này nhiều năm (≥3 feature request còn mở);
  Adobe mới chỉ làm cho Adobe Express (có toggle Social safe zones, tự cập nhật)
  — chứng tỏ Adobe biết nhu cầu mà chưa đem vào Premiere. Vừa là cơ hội, vừa là
  rủi ro bị Adobe nuốt tính năng sau này.
- Meta Ads Manager cũng có sẵn toggle "Safe Zone Range" trên preview — thêm một
  bằng chứng nhu cầu.
- FCP có chuẩn vàng UX: View > Choose Custom Overlay — PNG chỉ hiện trong viewer,
  **không bao giờ dính export**. Premiere không có cơ chế tương đương.
- Mốc giá tham chiếu: $9–15 là trần tâm lý cho tool đơn năng; muốn cao hơn phải
  có "dữ liệu sống" làm lý do.
- Ghi chú: "Safe Zones của Knights of the Editing Table" KHÔNG tồn tại (đã kiểm
  trang chủ + Gumroad của họ).

(Bảng đối thủ đầy đủ 12 dòng kèm link: xem báo cáo research gốc — Guideify ·
Automation Blocks $59.99 · Andy's Safe Guides free/Mac · BretFX Power Guides $10/FCP ·
pack Gumroad $0–10 · CapCut · FCP built-in · StreamLadder/Kapwing/PostPlanify ·
Descript · Opus Clip · Adobe Express.)

## 15. Kỹ thuật hiển thị guideline trong Premiere — ĐÃ ĐO MỘT PHẦN TRÊN MÁY THẬT

### 15a. Đường 1 — Guides gốc của Premiere ✅ khả thi nhất
- **Đã đọc file thật trên máy anh Tiến:**
  `C:\Users\DRT-G21\Documents\Adobe\Premiere Pro (Beta)\26.0\Profile-DRT-G21\Installed Guides.guides`
  — **định dạng JSON thuần**: mỗi guide có màu RGB (0–1), `orientationType`
  (ngang/dọc), `position` + `positionType` (1 = **phần trăm → tự co theo mọi
  kích thước sequence**), `pinToOpposite`. Panel sinh file này bằng vài dòng code.
- Premiere có Import/Export guide template chính thức (View > Guide Templates >
  Manage Guides), guide sống ở tầng app, **không bao giờ dính vào export**. ✅ helpx.
- File `.guides` tương thích 2 chiều với After Effects; AE có API scripting guides.
- ⚠️ CHƯA CHẮC (đo được trong 30 phút): Premiere ExtendScript KHÔNG có API guides
  trong tài liệu; QE DOM có hàm ẩn không thì phải soi `qe.reflect.methods` (nhớ
  luật: QE sai tham số là SẬP — chỉ dò trên project trắng). Ghi đè file .guides
  lúc Premiere đang chạy có nhận không, hay phải khởi động lại — phải tự đo.
  Guideify là bằng chứng sống CEP làm được guide thật, nhưng không công bố cách.
- **Giới hạn cứng:** guide gốc chỉ là ĐƯỜNG THẲNG ngang/dọc — vẽ khung được,
  KHÔNG mô phỏng UI (nút tim, avatar, thanh audio). Muốn "nhìn như trên điện
  thoại" phải đi đường 2.

### 15b. Đường 2 — PNG trên track trên cùng ⚠️ bẫy chí mạng
- Chèn/xoá bằng ExtendScript làm được (Asset Manager đang làm hằng ngày).
- ☠️ **Premiere KHÔNG có "guide layer" kiểu AE.** Track output tắt = ẩn cả
  monitor LẪN export; Clip Enable y hệt; Global FX Mute không ẩn PNG.
  → **Không có công tắc nào cho overlay hiện trong monitor mà tự né export.**
  Mọi đối thủ PNG đều bắt người dùng TỰ XOÁ trước khi xuất.
- Cách xử lý: panel là người duy nhất thêm/xoá overlay (đặt tên clip + label màu
  riêng), nút bật/tắt 1 chạm, **quét cảnh báo nếu sequence còn overlay** (CEP
  không có hook chặn export → phải chủ động nhắc).
- Hiệu năng PNG tĩnh: không đáng lo. Nỗi lo thật là bẫy export.

### 15c. Đường 3 — MOGRT: `sequence.importMGT()` có thật, nhưng chung bẫy với
đường 2 và nặng hơn PNG. Chỉ đáng nếu cần overlay đổi tham số tại chỗ.

### 15d. Đường 4 — Vẽ thẳng lên Program Monitor: **KHÔNG LÀM ĐƯỢC** (xác nhận).
CEP không có API; UXP reference cũng không một chữ về guides/overlay; hack cửa
sổ trong suốt thì vỡ khi kéo panel/đổi DPI — không đi.

### 15e. ☠️ CEP sắp hết hạn — ảnh hưởng CẢ BỘ AiO, không riêng panel này
- Premiere 25.6+ coi CEP là "superseded"; Adobe giữ CEP/ExtendScript **đến
  ~09/2026** rồi bỏ. Đã có extension CEP không load trên Premiere 2026 ngoài đồng.
- Nghịch lý: UXP chưa có API guides và thao tác timeline còn thiếu hơn ExtendScript.
- **Đường ghi file `.guides` MIỄN NHIỄM cả hai** — chỉ cần đọc/ghi file.

### 15f. Safe Margins có sẵn của Premiere
- Mặc định action 10% / title 20% (chuẩn analog cũ — xem mục 11), chỉnh % theo
  từng project ở Project Settings. Không thấy API chỉnh được (⚠️ có thể trong QE).

### 15g. Kiến trúc gợi ý (chờ anh Tiến chốt)
**Lai 2 tầng:** Tầng 1 = guide gốc (%, tự co theo sequence, không dính export,
sống qua thời CEP→UXP). Tầng 2 = PNG mô phỏng UI thật do panel quản (bật/tắt 1
chạm + quét cảnh báo trước export). Điểm khác biệt bán hàng: **dữ liệu sống** —
panel tải spec từ server của mình.

**Việc 30 phút TRƯỚC khi viết code:** (a) ghi thử template vào `Installed
Guides.guides` lúc Premiere đang chạy vs khởi động lại — xem lúc nào nhận;
(b) soi `qe.reflect.methods` tìm hàm guide ẩn (project trắng).

---

## 17. RÀ SOÁT LẦN 2 — 25/09/2026 (anh Tiến yêu cầu: *"truy quét lại các frame trên các nền tảng"*)

Cách làm: đọc lại **trực tiếp** các trang chính thức trong `nguonRaSoat` (fetch 25/09/2026,
16:0x), tìm thêm nguồn 2026 cho nền tảng không có trang chính thức, so từng con số với
JSON bản 01/08/2026. **Kết quả: 17/17 định dạng, 53 vùng — KHÔNG con số nào đổi.**
Chỉ đổi ngày phiên bản dữ liệu (`2026-09-25`), kỳ rà tiếp (`2026-12-25`) và ghi chú nguồn.

| Nền tảng / định dạng | Đọc được gì hôm nay | So với JSON | Trạng thái |
|---|---|---|---|
| **IG Reels ads** (ads-guide instagram-reels, bản tiếng Việt) | *"Tránh … trong khoảng 14% không gian trên cùng, 35% không gian dưới cùng và 6% không gian ở mỗi cạnh bên"*; độ phân giải khuyến nghị **1440×2560** | 14/35/6 | ✅ không đổi |
| **FB Reels ads** (ads-guide facebook-facebook-reels) | Câu y hệt 14/35/6; 1440×2560; text 40/55 ký tự | 14/35/6 | ✅ không đổi |
| **FB Stories ads** (ads-guide facebook-story) | *"top 14% (250 pixel) and 20% bottom (340 pixel)"* | 14/20 | ✅ không đổi — ❗ vẫn mâu thuẫn với Reels sau 2 tháng, Meta chưa sửa |
| Meta Help 980593475366490 | Trang chỉ trả tiêu đề (body render JS) cả bản VI lẫn `?locale=en_US` | — | ⚠️ không đọc lại được; hai trang ads-guide ở trên xác nhận thay |
| **TikTok** (ads.tiktok.com video-ads-specifications) | Trang ghi cập nhật **06/2026** (cùng bản đã đọc 01/08). Vẫn *"safe zone size is determined by the dimension, ad caption length, and any additional formats"*; HTML có **5 link .zip template** chính thức trên `lf-tt4b.tiktokcdn.com` (chưa tải — cần anh gật vì là tải file). 4 nguồn 2026 (renderforest, creamate, ezugc, adaptlypost) tái bản **130/484/44/140** | 130/484/44/140 | ✅ không đổi (vẫn là số tái bản, chưa đo file gốc) |
| **YouTube Shorts** (business.google.com shorts-ads) | *"Avoid placing critical elements in the top 10%, the bottom 25%, and the right-hand 10% of the frame"*; 1080×1920; tối đa 3 phút | 10/25/10 | ✅ không đổi. Bên thứ ba 2026 vẫn tản mát (120–380 top, 300–420 bottom, 96–140 right) — mốc % Google bao trùm |
| **Snapchat** (businesshelp safe-zones) | Trang không tải (JS, chỉ ra "loading"); 6 nguồn 2026 (adnabu, zeely, adkit, recruitmentads, spilno, auditsocials) tái bản **150 top / 330 bottom** cho Single Image/Video. Mới ghi nhận: **Story Ad TILE 175/269**, **Collection 150/450** — format khác | 150/330 | ✅ không đổi; ghi chú thêm 2 format khác vào JSON |
| **Pinterest** (help.pinterest.com product-specs) | *"Top: 270 px Left: 65 px Right: 195 px Bottom: 440 px"* cho Idea Ads 9:16; 1080×1920 | 270/440/65/195 | ✅ không đổi |
| **IG lưới profile** | 2026: tile **3:4 = 1080×1440** đã ổn định; Reel 9:16 hiện khúc giữa, mất trên/dưới (Oktopost, Buffer, YourSocialTeam) | 240/240 | ✅ không đổi |
| LinkedIn dọc | Vẫn không công bố; nguồn 2026 chỉ nói "giữ caption trong vùng giữa có đệm" | ước lượng 108/320/60/120 | ⚠️ giữ nguyên, vẫn UNVERIFIED |
| X immersive | Vẫn không công bố; socialk.it 2026: *"clear the bottom ~400 px and right ~140 px"* | 400/140 | ⚠️ giữ nguyên |
| Zalo | ads.zalo.me (quy định video, tạo quảng cáo video): vẫn *"nội dung chính trong vùng an toàn"*, không số; 16:9/9:16/1:1, MP4 H.264, ≤150 MB, ≤60 s | ước lượng | ⚠️ giữ nguyên. ⬜ `zalo-916` phải 12% vs thiết kế 12,96% — vẫn chờ anh chốt |
| Broadcast / YT 16:9 | EBU R95 v1.1 + SMPTE ST 2046-1 là chuẩn cố định, không cần đọc lại | 5% / 3,5% | ✅ |

**Việc còn mở sau lần rà này (cần anh gật vì là TẢI FILE về máy):**
- Tải 1 file zip template In-Feed của TikTok (~84 KB, `lf-tt4b.tiktokcdn.com`) và ảnh "red
  safe area" 1080×1920 của Google (answer/9128498) để **đo pixel trực tiếp trên file gốc**
  — nâng TikTok từ "tái bản bên thứ ba" lên "đo từ file chính thức". Meta có PSD/PPTX
  safe-zone-checker 2023-08-24 (vẫn khớp 14/35/6) — đo thêm nếu anh muốn.

Nguồn đọc 25/09/2026: facebook.com/business/ads-guide/update/video/instagram-reels ·
…/facebook-facebook-reels · …/facebook-story · ads.tiktok.com/help/article/video-ads-specifications ·
business.google.com/us/ad-solutions/youtube-ads/shorts-ads · help.pinterest.com/en/business/article/pinterest-product-specs ·
blog.adnabu.com/snapchat/snapchat-ad-specs · zeely.ai/blog/snapchat-safe-zones-explained-for-ads ·
adkit.so/tools/safe-zones/snapchat · renderforest.com/blog/tiktok-video-specs-dimensions ·
creamate.ai/en/blog/tiktok-safe-zone-guide · oktopost.com/blog/instagram-grid-size-guide ·
buffer.com/resources/instagram-image-size · socialk.it/en/sizes/x-video-size ·
ads.zalo.me/business/quy-dinh-ve-su-dung-quang-cao-video.

*(Mục biến thiên thiết bị: đang chờ research, sẽ bổ sung bên dưới.)*
