# AiO Studio — NGHIÊN CỨU THỊ TRƯỜNG (số đo thật, 10/09/2026)

> Lập **10/09/2026** theo yêu cầu anh Tiến *"giúp anh làm Market Research"*.
> Khác hai bản tháng 8 (`BAO_CAO_TONG_HOP…` 02/08, `MASTER_PLAN` 07/08): **mọi con
> số ở đây đều lấy trực tiếp từ trang của đối thủ / Adobe / nền tảng trong ngày
> 10/09/2026, kèm link.** Ô nào không mở được nguồn thì ghi **KXM** (không xác
> minh được) chứ không đoán. Mục 10 liệt kê chỗ hai bản cũ ghi sai.
>
> Cách đọc nhanh: đọc **mục 0** (1 trang) rồi **mục 11** (việc anh cần quyết).
> Các mục giữa là bằng chứng.

---

## 0. TÓM TẮT — 6 điều quan trọng nhất

| # | Phát hiện | Bằng chứng | Hệ quả cho AiO |
|---|---|---|---|
| 1 | ☠️ **Adobe đã viết thành văn sẽ GỠ CEP khỏi Premiere.** 11 panel của mình đều là CEP. | ReadMe chính thức `Adobe-CEP/Samples/PProPanel` (cập nhật 11/2025): *"the plan is to support both CEP and UXP for a calendar year, after which we will remove support for CEP extensibility"*. UXP đã chính thức (không còn beta) trong Premiere 2026. HyperBrew 31/03/2026 lại dẫn lời Adobe nói *"several years"* → **ngày cắt chưa có**, hai nguồn lệch nhau. | Cửa sổ rủi ro **cuối 2026 – 2027**. Phải có kế hoạch port UXP **trước khi** đổ tiền quảng cáo. Xem mục 9. |
| 2 | **Adobe làm native gần hết những gì AiO bán**, miễn phí trong gói $22.99. Cắt lặng (Text-Based Editing), caption từng chữ (26.3, 06/2026), dịch 27 ngôn ngữ, Auto Reframe, 11k SFX + 2k nhạc free, Enhance Speech. | Mục 3. | Còn **hai chỗ Adobe chưa có**: **multicam cắt theo người nói** (feature request 01/2026 vẫn "Open for Voting") và **caption offline đa ngôn ngữ có tiếng Việt** (Adobe: 18 ngôn ngữ, không VI, bug accuracy 46 reply chưa dứt). Đây là hai mũi nhọn duy nhất đáng đưa lên đầu trang bán. |
| 3 | **$17/tháng đứng giữa bảng, không rẻ.** Lớp mới 2025–2026 (PremiereCopilot $7.99, CutDeck $7.99, KreateFlo $6.39, REDitors $11.60, AutoCut Basic $9.90) đã kéo giá sàn xuống, **cắt lặng gần như đã thành hàng free** (Plentake, CutDeck, Phantom, KreateFlo đều free + local). | Mục 2, 20 đối thủ. | Cắt lặng **không bán được tiền riêng** nữa. Giá $17 phải được bảo vệ bằng **không quota** (đối thủ rẻ đều giới hạn giờ/lượt) + multicam + caption offline. |
| 4 | **Lifetime đang phổ biến ở đối thủ** dù anh chốt 16/08 không làm: PremiereCopilot $59, CutDeck $49, Wraith Multicam $118, Recut $99–129, BCut $129, TimeBolt $347. Chuẩn license là **2 máy** (AutoPod 1 máy bị chê). Hoàn tiền tốt = 30 ngày (TimeBolt, Recut). | Mục 2. | Không bắt anh đổi quyết định, nhưng cần biết thị trường đang đi ngược. Đề xuất ở mục 8. |
| 5 | **Bán từ Việt Nam được**, nhưng không qua Stripe (Stripe không hỗ trợ VN). Đường khả thi: **Lemon Squeezy** (payout về ngân hàng VN, ~90,6% về tay với gói $17) hoặc **Paddle → Payoneer** (~90%). aescripts lấy 30%. Adobe Exchange lấy 10% nhưng đang có sự cố FastSpring từ 04/2026. | Mục 6. | Chọn Lemon Squeezy làm chính (đã có trong kế hoạch cũ, nay xác nhận nhận seller VN). Rủi ro: LS đang gộp vào Stripe Managed Payments, chưa rõ có giữ VN. |
| 6 | **Quy mô cộng đồng đủ lớn, nhưng nhu cầu tìm kiếm lệch về nước không trả tiền.** r/VideoEditing 527k, r/premiere 187k, r/podcasting 191k. "premiere pro plugins" 150k tìm/tháng trên YouTube nhưng **41,5% từ Ấn Độ**; "autocut premiere" 61,5% từ Brazil. Podcast **đang hoạt động** chỉ ~478k trên 3,8M tổng (12,6%). | Mục 5. | Ngân sách quảng cáo phải **khoá cứng US/CA/UK/AU/DE**, đừng tin tổng lượt tìm. Kênh YouTube của mọi đối thủ đều nhỏ (lớn nhất AutoCut 6,8k sub) → traction đến từ creator/affiliate, không từ kênh brand. |

| 7 | **Tiếng than lớn nhất của editor không phải cắt lặng mà là CAPTION trong Premiere lag** — 6 người, 2021→2026, *"close to unusable"*, *"re-render cả timeline"*, chưa được sửa. Multicam theo người nói: nhân viên Adobe trả lời thẳng *"There is not."* | Mục 7 (Reddit bị chặn, chỉ có diễn đàn Adobe). | Transcripts nên bán là "caption không lag" (sau khi đo được). Autocut nên vào Free vì đối thủ thật là Premiere miễn phí. |

**Windows-only:** không có khảo sát uy tín 2024–2026 về tỉ lệ Mac/Win của editor. Proxy StatCounter 08/2026 Mỹ: Windows 53%, Mac 26%. Giới editor lệch Mac hơn dân số chung. Ước lượng thận trọng: **mất ¼ đến ½ khách US/EU/AU** chừng nào chưa có bản Mac. Con số "68% editor dùng Mac" trên mạng **không có nguồn**.

---

## 1. Phương pháp & độ tin cậy

- 4 nhánh khảo sát song song, ~500 lượt fetch/search trong ngày 10/09/2026.
- Ưu tiên: trang giá chính thức → trang cộng đồng có ngày → báo chuyên ngành → nguồn thứ cấp (ghi rõ "thứ cấp").
- `helpx.adobe.com` chặn bot 10/10 lần → phần Adobe dựa vào `adobe.com`, `community.adobe.com`, `blog.adobe.com`.
- Trustpilot/G2 của nhiều đối thủ 403/404 → chỉ AutoCut (276 reviews) và Phantom (17) đo được trực tiếp.
- Số YouTube lấy từ vidIQ cùng ngày.
- Mọi tỉ lệ ghi kèm **mẫu số** (luật 5k-bis).

---

## 2. Đối thủ chạy TRONG Premiere / DaVinci — 20 sản phẩm, giá fetch 10/09/2026

| # | Sản phẩm · nước | Tháng | Năm (quy /tháng) | Trọn đời | Trial · hoàn tiền | Máy | Win/Mac · NLE | Xử lý | Traction công khai |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **AutoPod** · autopod.fm | **$29** | $29×11 | Không | 30 ngày (cần thẻ) · gần như không hoàn (thứ cấp) | **1** | Win+Mac · Premiere 2023+ · Resolve | Local | YouTube 784 sub / 1 video |
| 2 | **AutoCut** · Pháp | Basic **$9.90** · AI **$19.80** | $6.60 · $14.90 | Không | 14 ngày không thẻ · hoàn "case-by-case" | KXM | Win+Mac · Premiere 2023–2026 · Resolve 18.6+ | KXM (không công bố) | Trustpilot **4.8 / 276** · YouTube 6.820 sub |
| 3 | **FireCut** · UK (có Ali Abdaal) | $10 · **$18** · $24 | $5 · $11 · $18 | "upon request" | 7 ngày · không hoàn | KXM | Premiere + Resolve | **Cloud, bắt buộc online**; 25 h / 100 h transcription/tháng | YouTube 1.930 sub · logo ABC, NVIDIA, Shopify |
| 4 | **TimeBolt** · US | $17 | $8.08 | **$347** | Free watermark · **30 ngày hoàn** | **2** | Win+Mac · app ngoài, XML + extension | Local | "11.700+ paid customers" (tự công bố, nhất quán 2 kênh) |
| 5 | **Recut** · US | $15 | $15 | **$99–129** (2 trang lệch nhau) | 3 export · **30 ngày hoàn** | 1 user, Mac+Win | app ngoài, XML | Local | 70+ reviews |
| 6 | **PremiereCopilot** · "Adobe approved" | **$7.99** | $6.39 · Creator $15.99 | **$59** Podcast+JumpCut | Free theo lượt/ngày · 7/60 ngày hoàn | **2** | Win+Mac · Premiere 2022+ | Silence local; caption/multicam cloud | KXM |
| 7 | **Cutback Premiere Assistant** · Adobe Video Partner | $9 · $15 · $35 | $8 · $13 · $30 | Không | Free 3 lượt/tháng | 2 (Pro) | Premiere | Cloud; silence tính **lượt** | KXM |
| 8 | **Phantom Editor** · Canada | $19 | $19 | **Wraith Multicam $118** một lần | Free 60 phút AI | KXM | Win + Mac M1+ · Premiere 2023+ | Wraith local/offline; caption cloud | Trustpilot 4.3 / 17 |
| 9 | **Plentake** · ex-Microsoft/xAI | $25 · $129 | KXM | Không | Silence + auto camera switch **free, local** | KXM | **Mac only** | Local | Public beta 2026 |
| 10 | **CaptionX** · Úc | KXM | $139/n | Có | Free 5+5 | KXM | Win+Mac · Premiere 2026 | Cloud | "40.000 editors" tự công bố |
| 11 | **KreateFlo** | $6.39 · $19.99 · $44.99 | — | Không | Free 3 tool, silence local | KXM | Premiere | Silence local; AI cloud 20–50 h | KXM |
| 12 | **CutDeck** | $7.99 | KXM | **$49** | Silence **free vĩnh viễn** | KXM | Win+Mac | **Local Whisper** | KXM |
| 13 | **AutoEdit** | $9.99 · $29.99 · $79.99 | — | Không | Free 4 tool | KXM | Win+Mac | Cloud (Claude AI) | "15k" và "30k editors" trên 2 trang ⚠️ |
| 14 | **REDitors** | $4.80 · $11.60 · $31.50 (promo −50%) | — | Không | Free 30 phút/ngày · 7 ngày hoàn | KXM | Win+Mac · Premiere 2020+ | Hybrid (upload audio) | "400+ editors" |
| 15 | **GoatEdit** | KXM | KXM | KXM | 7 ngày | KXM | Premiere | KXM | "10.000+" tự công bố |
| 16 | **Excalibur** | — | — | $120 | KXM | 2 | Win+Mac | Local | Command palette, không cắt lặng |
| 17 | Premiere Composer (Mister Horse) | free + pack | — | — | — | — | Premiere/AE | Local | Không phải đối thủ trực tiếp |
| 18 | Silence Killer (Gumroad) | — | — | $10+, **ngưng bán** | — | — | Win | — | — |
| 19 | **BCut** | $12 | $6.58 | $129 | Free watermark | KXM | app ngoài, FCPXML | 100% local kể cả transcription | KXM |
| 20 | **AutoTrim** | $15 | $9.92 | $149 (thường $279) | 14 ngày hoàn | 2 | app ngoài, XML | Local | KXM |

Nguồn từng dòng: autopod.fm/pricing · autocut.com/en/pricing · firecut.ai/pricing · timebolt.io/pricing · getrecut.com/pricing · premierecopilot.com/en/pricing · cutback.video/premiere-assistant/pricing · phantomeditor.video · plentake.com · caption-x.com/pricing · kreateflo.com · cutdeckapp.com · autoeditai.net · reditors.com · bcut.app · autotrim.app (tất cả 10/09/2026).

**Không phải đối thủ trong Premiere (đã kiểm):** Submagic, Zeemo, Captions.ai không có extension Premiere. "Vocal Cut" không tồn tại.

### Đọc ra từ bảng

1. **AutoCut vừa ra "Angles" (24/08/2026)**: tự đổi góc máy cho 1 người nói nhiều cam. Cập nhật hàng tuần, 10 tool, Trustpilot 276 reviews → là đối thủ **mạnh nhất về sản phẩm**. Điểm yếu để đánh: không công bố local/offline; Basic $9.90 chỉ có silence.
2. **PremiereCopilot là đối thủ sát nhất về mô hình** với AiO: $6.39–7.99, free tier theo lượt, silence local, lifetime $59, có reframe + multicam ≤10 cam + captions. Tuyên bố "10× nhanh hơn AutoCut".
3. **Phantom Editor có danh mục giống AiO nhất**: multicam local ($118 một lần) + video downloader + folder manager + reframe + silence. Còn nhỏ (17 reviews), Mac chỉ M1+.
4. **AutoPod** (đối thủ đầu tiên anh nhắc): kênh YouTube gần chết, 1 máy, không hoàn tiền, Product Hunt chỉ 88 upvote. Đòi nhiều cam + track audio riêng. Thread 04/2025: *"DaVinci Resolve 20 SmartSwitch put AutoPod out of business"* — chưa đo được thật hay không.
5. **Cắt lặng đã thành hàng free** ở 5 sản phẩm (Plentake, CutDeck, Phantom, KreateFlo, Cutback free tier). Autocut của AiO đứng một mình **không bán được tiền**.
6. **Local/offline không còn độc quyền** cho cắt lặng. Cái còn hiếm: **caption/transcript local trong Premiere** — chỉ CutDeck tuyên bố. Transcripts của AiO (whisper local) là lợi thế **đo được**.
7. **Windows-only** bất lợi với 3 ông lớn (đều Win+Mac), nhưng là lợi thế trước Plentake (Mac only) và Phantom (Mac M1+).

---

## 3. Adobe làm native gì rồi — đối chiếu từng tool AiO

Giá Premiere 10/09/2026 (adobe.com): đơn lẻ **$22.99/tháng** (25 credit AI) · CC Pro $69.99 (4.000 credit) · CC Standard $54.99. Tăng giá 17/06/2025: All Apps $59.99 → $69.99; credit gói đơn lẻ 500 → 25 (−95%) từ 01/07/2025. 01/2026 đổi tên "Premiere Pro" → "Adobe Premiere". Tăng giá cá nhân 2026: KXM.

| Tool AiO | Adobe có chưa | Adobe yếu chỗ nào (bằng chứng có ngày) | Khe hở còn lại |
|---|---|---|---|
| **Autocut** | **CÓ** — Text-Based Editing "Delete All pauses" + filler words | Sàn pause **0,1 s không hạ được**, xoá xong còn hàng trăm pause, staff nói cố ý (thread 06/02/2025). Chạy **cả sequence, bỏ In/Out** (yêu cầu 07/08/2025 còn mở). Không threshold/padding. Bản 26.2 dò pause sai, fix beta 22/07/2026. | Phải nói được **"sạch hơn Adobe bao nhiêu"** bằng số trên cùng một file. Không quota. Theo In/Out (AiO đã có). |
| **Transcripts** | **CÓ, mạnh lên nhanh** — model mới 26.2 (04/2026, −36% lỗi), **single-word captions 26.3** (17/06/2026), dịch 27 ngôn ngữ | **18 ngôn ngữ, không tiếng Việt.** Bug 04/03/2026 (46 reply) transcript sai cả audio sạch, PT/ES tệ nhất, chưa dứt ở 26.2.2. Caption workflow bị chê "clunky, tệ hơn app free". Offline hoàn toàn hay không: KXM. | **Tiếng Việt + offline thật + đa ngôn ngữ whisper.** Đây là rủi ro lớn nhất và cũng là mũi nhọn rõ nhất. |
| **Auto Podcast** | **KHÔNG** — chỉ sync waveform, cắt tay | Feature request 27/01/2026 "AI multicam cắt theo người nói" còn "Open for Voting", 0 reply Adobe. | **Khe hở lớn nhất.** ⚠️ **Separate Crosstalk beta (IBC 08/09/2026)** tách người nói chồng nhau → viên gạch nền cho multicam tự động. Theo dõi từng bản. |
| **Auto Re-Frames** | **CÓ** (Auto Reframe) | Thread 01/2023 → 10/2025 (17 reply) chưa fix: chủ thể bị đẩy ra khỏi khung 9:16, analyze kẹt 90%, drift trên talking head. | AiO đang **bọc chính Sensei của Adobe** → không khác biệt về lõi. Chỉ hơn ở "khoanh I/O = tracking đúng đoạn". Giá trị bán thấp. |
| **Guide Frame** | Không (chỉ broadcast safe) | Yêu cầu guide TikTok/IG 27/11/2024, 1 vote. | Có khe nhưng **giá trị thấp**, editor dùng PNG free. Giữ làm tính năng kèm, không bán riêng. |
| **Music & SFX** | **CÓ** — ~11k SFX + 2k nhạc free, Remix, license Stock trong panel (26.3), **Generate Music/SFX** (09/2026) | — | **Khó cạnh tranh.** Chỉ còn "kho riêng của studio". Không nên đầu tư thêm. |
| **Asset Manager / Power Bins** | Không tương đương cục bộ (Stock, CC Libraries là cloud) | — | Hợp lý làm **gói Free** như anh chốt. |
| **Video Download** | Không | — | Rủi ro pháp lý riêng (bản quyền nội dung), không phải rủi ro Adobe. |

**Kết luận mục 3:** với $22.99 người dùng đã có cắt lặng, caption từng chữ, dịch, reframe, stock audio, enhance speech — **không tốn credit**. AiO ở $17 chỉ đứng được nhờ (1) **multicam theo người nói**, (2) **caption offline có tiếng Việt**, (3) **cắt lặng đo được sạch hơn sàn 0,1 s**. Ba thứ này phải là 3 dòng đầu trang bán.

## 4. Web SaaS (không chạy trong Premiere) — giá 10/09/2026

| Tool | Giá tháng / năm quy tháng | Hạn mức | Về Premiere được không |
|---|---|---|---|
| Descript | $24/$16 · $35/$24 · $65/$50 | 10 h / 30 h / 40 h | XML từ gói Creator; **mất caption, effect, keyframe** |
| Submagic | $19/$12 · $39/$23 · $69/$41 | 15/40/100 video, trần 2–30 phút | Không plugin, SRT |
| OpusClip | $15 · $29 ($174/n) | 60/150/300 phút, credit hết hạn 60 ngày | XML chỉ Pro, caption không sửa được |
| Gling | $20/$10 · $40/$20 · $100/$50 | 10/30/100 h | **XML mọi gói kể cả free** |
| Captions (Mirage) | $9.99 · $24.99 (iOS) | credit | Không; không có app Windows |
| Riverside | $29/$24 · $39/$34 | 5 h / 20 h track riêng | XML track thô đã sync |
| Wisecut · Vizard · Async (Podcastle) · VEED · CapCut | trang giá lỗi hoặc chỉ nguồn thứ cấp → **KXM** | | |

Không SaaS nào chạy trong Premiere. Điểm chung: **upload + quota + mất caption khi về timeline** → đúng thông điệp "workflow không gãy" của bản kế hoạch cũ, nay có bằng chứng.

---

## 5. Quy mô thị trường, cộng đồng, nhu cầu tìm kiếm

### 5a. Adobe / Premiere

| Chỉ số | Số | Nguồn |
|---|---|---|
| Adobe Q2 FY2026 | Doanh thu **$6,62 tỷ**; Total ARR **$27,1 tỷ** | transcript Q2 (theglobeandmail), Futurum |
| Số thuê bao Creative Cloud | **Adobe ngưng công bố từ FY2018 (17 triệu).** Ước tính bên thứ ba 32,5–41 triệu, lệch nhau 26% → **KXM** | prodesigntools, skillademia |
| Số người dùng Premiere | **KXM** — không có ước tính có phương pháp | — |
| Thị phần NLE | Stat-site: Premiere 35% · FCP 25% · Resolve 15% · Avid 10% — **không nêu mẫu số**, tin cậy thấp. Khảo sát có mẫu duy nhất: Post Production World 2022, 63% editor dùng Premiere (cũ 4 năm) | electroiq, gurusoftware |
| Mac vs Windows của editor | **KXM** — không khảo sát 2024–2026. Proxy StatCounter 08/2026 Mỹ: Win 53,3% / Mac 25,6% | gs.statcounter.com |

### 5b. Cộng đồng (gummysearch / vidIQ, 08–10/09/2026)

| Cộng đồng | Số |
|---|---|
| r/VideoEditing | **527k** (+12,4%/năm) |
| r/youtubers | 345k |
| r/editors | 196k |
| r/podcasting | 191k (+16,5%/năm) |
| r/premiere | 187k |
| Discord Adobe Video chính thức | 26,7k (snippet, chưa xác minh trực tiếp) |
| Facebook groups Premiere | KXM (chặn khi chưa đăng nhập) |

Kênh YouTube dạy Premiere còn hoạt động (vidIQ 10/09/2026): Peter McKinnon 6,03M (filmmaking chung) · Justin Odisho 1,14M (chủ yếu Shorts) · Premiere Basics 634k (+7,5%/năm) · Premiere Gal 614k (+6,4%/năm, có Patreon + Discord) · Motion Array 569k · Adobe Video 391k · Javier Mercedes 281k. **Cinecom 2,70M đã ngưng đăng từ 12/2023** — bỏ khỏi danh sách outreach.

### 5c. Nhu cầu tìm kiếm — chỉ có số YouTube (vidIQ 09/09/2026); Google volume **KXM**

| Từ khoá | Tìm/tháng (YouTube) | Xu hướng 30 ngày | Nước chính |
|---|---|---|---|
| premiere pro plugins | 150.013 | −4,6% | **Ấn Độ 41,5%**, Mỹ 7,5%, Canada 7,5% |
| autocut premiere | 49.740 | +11,1% | **Brazil 61,5%**, Nga 15% |
| autopod | 41.923 | +8,0% | Mexico / UK 16,7% mỗi nước |
| premiere pro captions plugin | 19.840 | **+458%** | — |
| silence remover premiere pro | 14.506 | −30% | — |
| auto reframe premiere | 5.199 | 0% | — |
| multicam podcast editing | <750 | — | — |

Đọc ra: (1) tổng lượt tìm **không phải** nhu cầu trả tiền — phần lớn từ Ấn Độ/Brazil; (2) "captions plugin" tăng 458% trùng lúc Adobe ra single-word captions → thị trường đang nóng đúng chỗ Adobe vừa đánh; (3) "multicam podcast editing" gần như không ai tìm bằng từ đó → phải bán qua từ "autopod alternative", không qua từ mô tả.

### 5d. Podcast (proxy nhu cầu Auto Podcast)

Tổng 3.807.659 podcast (Listen Notes) nhưng **đang hoạt động ~478.000 (12,6%)** (Podcast Index 2026 qua Riverside 30/07/2026). YouTube là nền tảng nghe podcast #1 (40%). Mẫu số thật để tính thị trường Auto Podcast là **478k**, không phải 3,8M.

---

## 6. Kênh bán & thanh toán từ Việt Nam

| Kênh | Phí | Nhận seller VN | Ghi chú |
|---|---|---|---|
| **Lemon Squeezy** | 5% + $0,50 · +1,5% quốc tế · +0,5% subscription; payout bank 1% | ✅ VN có trong danh sách bank payout | ⚠️ Đang gộp vào Stripe Managed Payments (preview 02/2026). SMP có nhận VN không: **KXM** |
| **Paddle** | 5% + $0,50; sản phẩm <$10 phải hỏi sales | ✅ (không nằm trong 27 nước cấm) | Payout wire/Payoneer, tháng 1 lần, min $100 |
| **Gumroad** | 10% + $0,50 (30% nếu qua Discover) | ✅ payout VND | Đắt nhất |
| **Stripe** | — | ❌ **không hỗ trợ VN** | Chặn đường bán trực tiếp |
| **aescripts + aeplugins** | 30% flat | ✅ (W-8BEN, Wise) | Nhận Premiere-only; aescripts quyết giá cuối |
| **Adobe Exchange** | 10% (dev giữ 90%), qua FastSpring | KXM (trang payee không mở) | Nhận CEP/ZXP từ 06/2023; duyệt ≤10 ngày làm việc; **sự cố 16/04/2026: doanh thu không hiện, coupon hỏng** |

**Tính cho $17/tháng, khách Mỹ, trả sub:** Lemon Squeezy bank payout ≈ **$15,40 về tay (90,6%)** · Paddle + Payoneer ≈ $15,34 · Gumroad ≈ $14,80 (87%).

**Product Hunt** (10/09/2026): FireCut 652 upvote (#3, 2023) và 385 (#2, 11/2025) · AutoEdit 305 (#3, 06/2026) · TimeBolt 94 · **AutoPod 88 (#44)**. Product Hunt không làm nên AutoPod; chỉ tool có chữ "AI" lên top 3.

**Affiliate:** AutoCut **20% trọn đời** (thứ cấp) · Riverside tới 20% · chuẩn SaaS creator-tool 20–30% recurring, giới hạn 12 tháng. Kế hoạch cũ ghi 10–15% → **thấp hơn đối thủ trực tiếp**.

---

## 7. Tiếng nói khách hàng — trích nguyên văn, có ngày

**Giới hạn phải nói trước:** Reddit chặn hoàn toàn (cả `old.reddit.com`, cả qua công cụ tìm kiếm), G2 và itch.io trả 403. Nguồn lấy được: **diễn đàn Adobe Community (7 thread, 2021–2026)** + AlternativeTo (2 bình luận). Vì vậy mẫu nhỏ; chỗ nào ≥3 nguồn độc lập ghi **PATTERN**, còn lại là **ANECDOTE**. Trích dẫn giữ nguyên lỗi chính tả của người viết.

| Chủ đề | Người dùng nói gì (nguyên văn) | Nguồn · ngày | Mức |
|---|---|---|---|
| **AutoPod đắt** | *"Oh yeah, autopod, costs as much as premiere pro."* | Dave_DIR, Adobe Community `auto-edit-1401566`, 19/07/2024 | **PATTERN n=3** (thêm jamesm 01/2024: *"horrendous costs from 3rd parties"*; m5heath 12/2023) |
| **AutoPod hỏng im lặng** | *"it basically gave me my sequence right back to me unedited."* · *"you'll need to have different audio sources, so the program can detect who is talking."* · lỗi khi clip lệch độ dài, 3 người "me too" từ 04/2024 → 05/2025, Adobe chỉ trả lời *"you should contact them"* | Michael356…, 25/02/2024 · CreativeWizard009, 31/07/2023 · thread `auto-pod-plug-in-issue` 14391139 | **PATTERN n=4** |
| **AutoCut được xếp trên AutoPod** | *"AutoCut has more features than AutoPod, it costs less, and it receives updates every week."* · *"Autocut is just the better tool"* | AlternativeTo, 22/04/2024 · 03/04/2026 | ANECDOTE n=2 |
| **Không muốn trả cho thứ Premiere nên có sẵn** | *"I don't see why I should pay $9.9 basic per month for Autocut"* · *"Does anyone know if theres a free alternative to autocut, firecut and autopod?"* · Nhân viên Adobe trả lời thẳng: *"Silence removal was introduced in version 24"*, *"text based editing … can remove silences nicely"* | m5heath 06/12/2023 · jamesm 24/01/2024 · Kes Akalaonu 12/2023, Kevin Monahan 02/2025 | **PATTERN n=3** |
| **Multicam theo người nói — Adobe xác nhận KHÔNG CÓ** | Người dùng podcast 4 người: *"it's just a bit tedious is all, and I feel that there should be an option"* → nhân viên Adobe: *"There is not."* · Podcast 3 cam *"takes about 1 hour to edit, which is as long as the podcast itself"* | thread 1390269, 03/05/2022 · thread 1408854 | **PATTERN n=3 thread** |
| **Caption trong Premiere — đau nhất, lâu nhất** | *"Captioning in Premiere is incredibly slow, cumbersome, buggy l, unintuitive and frankly just lagging behind all other apps."* · *"a slight change in captionih requires completely re rendering the timeline."* · *"wait 30 seconds to 1 minute until the changes are processed"* · *"super slow/laggy performance (close to unusable)."* · phải chia video caption 3–4 giờ thành *"20-40min portions"* | real_5081 30/03/2026 (feature request 1555697) · artur_b 07/2021 · timothyb 08/2021 · Cklewis 06/2022 · cluelet 11/2024 | **PATTERN n=6, 2021→2026, chưa được sửa 5 năm** |
| **Cắt lặng thủ công mệt** | *"I often make 100 cuts or more in a 3-5 minute video, and it is extremely time-consuming"* · *"We want AUTOMATIC SILENCE REMOVAL and we want it soon!!"* | Julia 15/02/2025 · m5heath 12/2023 | PATTERN n=3 |
| **Quản lý asset / relink** | *"everytime I open a project I need to relink files."* · *"relink 300 files just to see if this was the correct project or not"* — ước 4 giờ → 30 phút nếu có tool | Drew (8–12 project chia cho nhiều editor), 30/10/2025 | ANECDOTE n=1, nhưng là khách kiểu agency |
| **Brand kit đa project** | **Không tìm thấy** ai dùng từ này | — | Không có dữ liệu |
| **Reframe 9:16** | Chỉ có tiêu đề thread lỗi | — | Không đủ |
| **Lifetime vs tháng, gói vs lẻ** | Không có trích dẫn độc lập (nằm ở Reddit, bị chặn). Chỉ có đối thủ khai thác: PremiereCopilot bán lifetime $59 | — | Không có dữ liệu |
| **SmartScreen / installer không ký / "offline" có quan trọng không** | **0 bằng chứng** | — | Không có dữ liệu |

### Ai là người trả tiền (mẫu nhỏ, n≈4)

| Nhóm | Dấu hiệu | Họ quan tâm gì |
|---|---|---|
| Creator / podcaster cá nhân | Chê giá nhiều nhất ("bằng tiền Premiere", "$9.9 sao phải trả") | Giá |
| Editor nội bộ làm video đào tạo | 100+ nhát cắt / video 3–5 phút | Độ chính xác hơn tốc độ |
| Agency nhiều editor | 8–12 project, relink hàng trăm file, nói bằng **giờ tiết kiệm** (4h → 30 phút) | Giờ, nhiều máy |
| Nhà sản xuất podcast | Dính lỗi AutoPod lặp lại, vẫn sẵn sàng trả $29 | Chạy được, báo rõ khi hỏng |

### Hàm ý cho AiO (chỉ từ bằng chứng trên)

1. **Transcripts nên bán là "caption không lag, không render lại timeline"**, không phải "AI transcript". Đây là tiếng than lớn nhất, lâu nhất, và người ta đổ lỗi cho **panel caption native của Premiere** — đúng chỗ Adobe vừa thêm single-word captions nhưng chưa sửa gốc hiệu năng. ⚠️ Điều kiện: AiO phải **đo được** caption MOGRT của mình không gây lag như caption native; chưa đo thì chưa được nói.
2. **Auto Podcast: điểm tin cậy rẻ nhất là báo rõ lý do khi không cắt được** (thiếu track mic, clip lệch độ dài). Lỗi AutoPod bị đăng nhiều nhất là *im lặng trả lại sequence chưa cắt*.
3. **Autocut không phải sản phẩm bán được** — đối thủ thật là Premiere miễn phí và nhân viên Adobe chủ động chỉ người dùng sang đó. Củng cố đề xuất đưa Autocut vào Free.
4. **$17 chỉ an toàn khi người mua thấy dùng ≥2–3 tool hằng ngày.** Người dùng một tính năng sẽ so với $9.90 và với Premiere miễn phí.
5. **Power Bins chưa có từ vựng trên thị trường** — phải dạy bằng demo cụ thể, không bằng tên tính năng.
6. **Không được viết "editor quan tâm offline/bảo mật" lên web** chừng nào chưa có một nguồn nào nói vậy. Bản kế hoạch tháng 8 dựng cả Hook 3 quanh ý này mà không có bằng chứng.

---

## 8. Định vị & giá — đề xuất để anh quyết

### 8a. $17/tháng đứng ở đâu

```
$4.80  REDitors (promo)
$6.39  KreateFlo · PremiereCopilot (năm)
$7.99  PremiereCopilot · CutDeck
$9.90  AutoCut Basic (chỉ silence)
$10    FireCut Starter
$15    Recut · Cutback Basic
$17    TimeBolt  ◄── AiO Pro $17
$18    FireCut Pro (cloud, 25 h/tháng)
$19    Phantom Pro
$19.80 AutoCut AI (10 tool)
$29    AutoPod (3 tool, 1 máy)
```

$17 **không phải giá rẻ** như bản kế hoạch tháng 8 nghĩ ("rẻ hơn 70%"). Nó là giá **tầm trung**, ngang TimeBolt, chỉ rẻ hơn 3 ông lớn. Người mua sẽ so với AutoCut AI $19.80 (10 tool, cập nhật hàng tuần, 276 reviews) và hỏi "AiO hơn gì".

### 8b. Ba câu trả lời có bằng chứng

1. **Không quota.** FireCut 25 h/tháng, Cutback đếm lượt, PremiereCopilot free theo lượt/ngày, Descript 10–40 h. AiO chạy local → không giới hạn. Đây là dòng đầu tiên.
2. **Multicam theo người nói, offline, không cần track mic riêng.** Adobe chưa có. AutoPod đòi mic riêng, $29, 1 máy. Wraith $118 chỉ Mac M1+.
3. **Caption offline, có tiếng Việt và 99 ngôn ngữ whisper, và không làm lag timeline.** Adobe 18 ngôn ngữ, không VI, bug accuracy 46 reply, caption native bị than lag suốt 5 năm (mục 7). Vế "không lag" chỉ được nói sau khi đo caption MOGRT của AiO trên sequence dài.

**Không đưa lên trang bán (chưa có bằng chứng):** "100% offline nên bảo mật" — 0 người dùng nào nói họ quan tâm; và local đã là chuẩn của nửa bảng đối thủ.

### 8c. Đề xuất cụ thể (anh quyết, em không tự đổi)

| Việc | Đề xuất | Vì sao |
|---|---|---|
| Giá tháng | Giữ **$17** | Đúng tầm TimeBolt; rẻ hơn 3 ông lớn; không nên hạ xuống tầng $8 vì tầng đó sống bằng quota + cloud |
| Gói năm | **Thêm** gói năm ~$119 (≈$9.90/tháng, −42%) | 18/20 đối thủ có gói năm; không có là mất khách muốn trả một lần |
| Lifetime | Anh đã chốt không (16/08). Ghi nhận thị trường: 6/20 đối thủ có, $49–347 | Nếu sau này cân nhắc: chuẩn ở tầng multicam là $118 (Wraith) |
| Số máy | **2 máy** | Chuẩn thị trường; AutoPod 1 máy bị chê |
| Hoàn tiền | **30 ngày** | TimeBolt/Recut làm được; AutoPod/FireCut không → chỗ để hơn |
| Free tier | Giữ Asset Manager. **Cân nhắc thêm Autocut vào Free** | 5 đối thủ đã cho cắt lặng free; giữ nó trong gói trả tiền không thêm lý do mua, mà mất mồi câu |
| Affiliate | **20%** thay vì 10–15% | Bằng AutoCut |
| Mũi nhọn quảng cáo | **Auto Podcast** (từ khoá "autopod alternative") | Khe hở duy nhất Adobe chưa lấp; "silence remover" đang −30% và đã free |

---

## 9. Rủi ro CEP → UXP — việc phải quyết trước khi đổ tiền quảng cáo

| Nguồn | Nói gì | Ngày |
|---|---|---|
| Adobe, ReadMe `Adobe-CEP/Samples/PProPanel` | *"As of Premiere Pro 25.6, CEP extensions… have been superseded by UXP… support both CEP and UXP for a calendar year, after which we will remove support for CEP extensibility."* Và: *"we've stopped additional work on the ExtendScript API."* | cập nhật 11/2025 |
| Adobe Tech Blog | *"CEP 12 will be the last major update to CEP"* | 18/10/2024 |
| HyperBrew (dev plugin) | UXP là bản chính thức trong Premiere 2026; về ngày cắt CEP *"Adobe said 'several years'"*; *"Most APIs are stable. Some are still missing."* | 31/03/2026 |
| Adobe Developer Blog | UXP **Hybrid C++** cho Premiere từ 26.2 — đường để gọi native (ffmpeg, whisper) | 04/2026 |
| Filmit.io | CEP **vẫn nạp** trên Premiere 2026 | 07/2026 |
| Issue AutoSubs #571 | 1 người dùng báo CEP không nạp trên Premiere 2026 — 1 ca, chưa kết luận | 06/06/2026 |

Hai nguồn Adobe (văn bản) và HyperBrew (lời nói) lệch nhau: **1 năm** vs **vài năm**. Em không chốt được bên nào đúng. Điều chắc chắn: **hướng đi là UXP, ExtendScript đã ngừng phát triển**, và thời điểm Adobe công bố ngày cắt thì mọi dev đều dồn đi port cùng lúc.

Ảnh hưởng đến AiO: cả 11 panel dùng CEP + ExtendScript + Node (spawn ffmpeg/whisper). UXP không có Node; đường thay là UXP Hybrid C++. **Chi phí port chưa đo** — cần một spike riêng (1 panel nhỏ nhất, ví dụ Guide Frame) để đo trước khi ước lượng cả bộ.

---

## 10. Đối chiếu hai bản kế hoạch tháng 8 — chỗ ghi sai hoặc hết hiệu lực

| Bản cũ ghi | Thực tế đo 10/09/2026 |
|---|---|
| "Native trong Premiere Pro & **DaVinci Resolve**", "**Windows & macOS**" | AiO chỉ có Premiere + Windows. Đối thủ (AutoCut, AutoPod, FireCut) mới là Win+Mac+Resolve |
| "AutoCut.fr $14.90/tháng, $178/năm" | AutoCut Basic **$9.90**, AI **$19.80**/tháng; năm $79 / $178.80. Domain là autocut.com |
| "FireCut $24–34/tháng" | $10 / $18 / $24 (Max giảm từ $32) |
| "AutoPod $228/năm" | $29 × 11 = $319 (tặng 1 tháng) |
| "Lifetime $129 · $69/năm · rẻ hơn 70%" | Bị anh bỏ 16/08. Và $17/tháng không rẻ hơn 70% ai cả — ngang TimeBolt |
| "Plugins rời cần Cloud Server" | Sai với AutoPod, TimeBolt, Recut, PremiereCopilot (silence), Plentake, CutDeck — đều local |
| "Cập nhật tính năng: đối thủ hiếm khi cập nhật" | AutoCut changelog **hàng tuần**, ra Angles 24/08/2026 |
| "AutoPod 3 tools, AutoCut 1–2 tools" | AutoCut **10 tool**; AutoPod 3 tool đúng |
| "Affiliate 10–15%" | AutoCut 20% trọn đời; chuẩn ngành 20–30% |
| "Doanh thu 100 khách đầu = $11.700 (80 lifetime)" | Không còn lifetime; chưa có dữ liệu chuyển đổi nào để dự báo. Bỏ con số này |
| "Thị trường 100% quốc tế, ẩn tệp VN" | Mâu thuẫn với mũi nhọn **tiếng Việt** ở caption (Adobe không có VI). Cần anh chốt lại: tiếng Việt là lợi thế bán cho editor gốc Việt ở nước ngoài / agency đa ngôn ngữ, hay bỏ |

---

## 11. Việc cần anh quyết (theo thứ tự)

1. **CEP → UXP:** cho phép làm spike đo chi phí port 1 panel nhỏ? (Chưa quyết thì mọi kế hoạch quảng cáo đều đứng trên nền có hạn dùng.)
2. **Mũi nhọn:** Auto Podcast (khe hở Adobe) hay Transcripts (thị trường nóng +458% nhưng Adobe vừa đánh)?
3. **Giá:** giữ $17 + thêm gói năm ~$119? 2 máy? Hoàn tiền 30 ngày?
4. **Free tier:** có đưa Autocut vào Free không?
5. **Mac:** bắt đầu khi nào? (mất ¼–½ khách chừng nào chưa có)
6. **Tiếng Việt:** là lợi thế bán hay không nằm trong định vị "100% quốc tế"?
7. **Cổng thanh toán:** Lemon Squeezy (đơn giản, rủi ro gộp vào Stripe) hay Paddle + Payoneer (ổn định hơn, payout tháng 1 lần)?

---

## 12. Chỗ KHÔNG XÁC MINH ĐƯỢC — để anh biết chỗ mù

- **Toàn bộ Reddit** (r/premiere, r/editors, r/podcasting) — chặn cả fetch lẫn qua công cụ tìm kiếm. Vì vậy: lý do huỷ AutoPod, drift tập dài, lifetime vs tháng, phản ứng SmartScreen, "offline có quan trọng không" → **đều chưa có dữ liệu**. Cần một lượt anh tự mở Reddit hoặc dùng trình duyệt có đăng nhập.
- Số người dùng Premiere / thuê bao CC (Adobe ngưng công bố 2018).
- Tỉ lệ Mac/Win của editor (không có khảo sát 2024–2026).
- Google search volume (chỉ có YouTube từ vidIQ).
- Ngày cắt CEP cụ thể.
- Stripe Managed Payments / FastSpring có nhận seller VN.
- Refund AutoPod, FireCut (chỉ nguồn thứ cấp). Trustpilot TimeBolt/FireCut (403).
- Giá Vizard, Async, VEED, Wisecut, Captions gói năm.
- Speech-to-Text của Adobe chạy offline hoàn toàn hay không.
- Số user tự công bố của CaptionX (40k), GoatEdit (10k), AutoEdit (15k/30k lệch nhau) — không có nguồn ngoài.
