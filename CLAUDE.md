# AiO Studio — TOÀN BỘ kiến thức về dự án, một chỗ duy nhất

> ☠️ **LUẬT LÀM CHUNG VỚI GEMINI (27/09/2026) nằm ở `AGENTS.md` — Claude và Gemini cùng đọc MỘT file đó.**
> Dòng dưới nạp nó tự động; sửa luật làm chung thì sửa trong `AGENTS.md`, không chép sang đây.

@AGENTS.md

> **File này nằm TRONG repo** → máy nào pull về cũng đọc được, khác ngăn nhớ tự
> động của Claude (gắn theo đường dẫn từng máy, dời thư mục là mất).
>
> Gom lại **2026-09-08** theo lệnh anh Tiến *"đem toàn bộ dữ liệu về AiO Studio
> vào"* — trước đó kiến thức rải ở 4 nơi: brain tổng `~/.claude/CLAUDE.md`,
> `E:\2026\Production\CLAUDE.md`, 8 file ngăn nhớ, và file này (40 dòng).
> Nay: thứ gì về **AiO Studio** thì ở đây; thứ gì về **cách làm việc chung** thì
> ở brain tổng; thứ gì về **một panel cụ thể** thì ở `CLAUDE.md` + `PROGRESS.md`
> **trong thư mục panel đó** (đọc trước khi sửa một dòng của panel).
>
> Mọi con số ở đây là số **đã đo**, kèm ngày. Số phiên bản đọc từ manifest
> 08/09/2026. Thấy lệch với thực tế thì **sửa ngay tại chỗ**, đừng để nguyên.

---

## 1. AiO Studio là gì

Bộ công cụ cho **editor dựng phim trên Adobe Premiere Pro**, do anh Tiến (Senior
Editor / Creative Production Lead) làm để **tự dùng trước, rồi bán ra nước
ngoài** (cạnh tranh AutoCut, AutoPod). Gồm **11 panel CEP** chạy bên trong
Premiere + **1 app desktop** (Shot & Save) chạy ngoài Premiere + **1 website**
bán hàng.

**Ví dụ đời thường:** editor có một buổi quay talking-head 1 giờ. Bấm *Auto Cut*
→ 19 phút sau timeline đã cắt sạch khoảng lặng, không mất lời (anh Tiến tự nghe
lại 19/08). Bấm *Transcripts* → có phụ đề .srt. Kéo *Asset Manager* → chèn nhạc,
logo từ kho 28.900 file. Mở project khác vẫn thấy *Power Bins* (brand kit) ở đó.

Repo GitHub: `hadangtien0702-dot/AiO-Studio` — **PUBLIC** (anh chốt 31/08).

---

## 2. 12 app — đang ở đâu (manifest đọc 08/09/2026)

| # | App | Bản | ID · cổng | Trạng thái | Việc gần nhất |
|:-:|---|:-:|---|:-:|---|
| 1 | **Autocut** | **1.6.0** | `com.aiostudio.autocut` · 8089 | ✅ **XONG, NGƯNG PHÁT TRIỂN** (anh chốt 19/08) | Anh tự dựng bài thật + nghe lại, không mất lời. Bộ cài `Release/AiO Autocut/win/` 46 MB. Việc mới phải hỏi anh |
| 2 | Asset Manager | 2.0.0 | `com.aiostudio.assetmanager` · 8088 | 🧊 **Đóng băng** (14/08: *"rất ổn rồi, tạm dừng"*) | Kho ~28.900 asset. Là **gói FREE**. 14/09 anh *"xài ổn định rồi"* → bộ cài kèm FFmpeg `Release/AiO Asset Manager/win/` SETUP.exe 91,4 MB (cài thử trên máy công ty: 4 s, 13 file md5 khớp; chưa cài máy sạch, chưa mở Premiere sau khi cài) |
| 3 | Power Bins | 2.0.0 | `com.aiostudio.powerbin` · 8090 | 🟢 Chạy được | Brand kit hiện ở mọi project Premiere |
| 4 | Transcripts | **2.5.5** | `com.aiostudio.transcript` · 8091 | 🟢 Chạy được | 24/08: 2 nút *Làm phụ đề* / *Làm hiệu ứng*; khối hiệu ứng **ẨN** (`HIEN_HIEU_UNG=false`) vì đo chết 3 đường native Premiere 27; vá caption rơi sang sequence khác. Nợ: anh dùng bài thật, bộ cài cài font |
| 5 | **AiO Studio (panel tổng)** — thay WELCOME | **2.1.1** (27/09: mặc định ngôn ngữ EN như cả bộ; 9/9 thẻ mở đúng panel trên máy nhà) | `com.aiostudio.hub` · **8101** (ID cũ `com.aio.welcome` bỏ) | 🟡 **Đã nối vào Premiere máy công ty 22/09 14:1x — chờ anh tắt/mở Premiere để xem** | Viết lại 22/09 theo thiết kế anh chốt (2 dạng + Option 2). Mở 12 tool từ một chỗ, trạng thái cài + phiên bản đọc thật từ Premiere. **25/09 đo trên Premiere THẬT: 10/10 panel CEP mở từ thẻ (458–486 ms), phiên bản 11/11 khớp.** 2.1.0 cùng ngày (anh: *"đồng bộ UI với website aio-shotsave… anh thích animation của trang web này… panel mở lên cũng có animation"*): token màu/chữ/thẻ/nút chép từ HTML live web Shot & Save (giữ mỗi tool một màu), nút Nền sáng/tối thật, animation "vào" lúc mở (đo trên panel thật + 11 khổ: 0 tràn, 0 cắt). ☠️ Thư mục `AiO WELCOME/` vẫn UNTRACKED trong git. Đổi tên thư mục chưa chốt. Chi tiết: `AiO WELCOME/CLAUDE.md` + `PROGRESS.md` |
| 6 | Auto Re-Frames | 0.6.1 (27/09: theo ngôn ngữ chung) | `com.aiostudio.reframe` · 8092 | 🟡 Đang làm | Dọc 9:16 Sensei bám chủ thể; khoanh I/O là tracking đúng đoạn (27/08). Không build |
| 7 | Auto Guideline Frame | **0.3.2** (27/09: ngôn ngữ chung + dịch hết EN) | `com.aiostudio.guideframe` · 8096 | ✅ Anh test ĐẠT 21/09 (0.3.0) · 🟡 **chờ anh bấm trên bài thật** | Safe zone 10 nền tảng / 59 vùng; đặt 0,74s / gỡ 0,13s trên sequence 4K 306 clip. **25–26/09:** anh chỉ ra khung YouTube Shorts sai (*"em lấy thông số ảo"*) → đo lại từ ẢNH APP THẬT: **10/11 định dạng dọc** đã đo + mock UI theo toạ độ đo (YouTube từ máy anh; FB Reels/Stories, TikTok, LinkedIn, IG Reels/Stories, Zalo, Snapchat, X từ App Store/Google Play/ảnh máy thật; cài đè 26/09 18:38), Pinterest thiếu ảnh, chờ anh soi bằng điện thoại. **25/09:** tự thêm track video khi timeline đầy + tìm track trống theo vùng In/Out; sửa lỗi gỡ guide xoá bin. **27/09 (0.3.2):** theo ngôn ngữ chung + dịch hết chế độ EN (0 chuỗi tiếng Việt sót ở 40 bước đo). Không build. Chưa có bộ cài |
| 8 | Auto Podcast | UI 0.6.7 (27/09: ngôn ngữ chung) · host 0.4.9 (☠️ manifest **0.1.0** chưa bump — chờ anh gật) | `com.aiostudio.podcast` · 8094 | 🟢 Chạy được | 25/08 *"cắt đúng người"* ĐÃ GIẢI bằng tai anh: liệu 40 phút 2 người + wide, tiếng cam làm mic, 411 nhát. **Chưa đo**: >2 người, mic rời bleed nặng, >1 giờ. Ngưỡng cắt KHÔNG đụng |
| 9 | Music & SFX (`AiO Mussic`) | 1.0.1 · UI v2.1 | `com.aiostudio.music` · 8097 | 🟡 | 27/09 việc chính anh cần: **tìm key bài nhạc trên timeline** (nhạc tải bằng Video Download). Bộ đo key cũ SAI HỆ THỐNG (phép nâng cao độ: 22,4%) → viết lại 79,0%; màn Key = ô thả + tự theo clip đang chọn. [CHỜ ANH] thử kéo thả + nghe kiểm. Chi tiết `AiO Mussic/PROGRESS.md` |
| 10 | ~~Auto Cut Short~~ | — | ~~`com.aiostudio.short` · 8093~~ — **trả lại** | ⛔ **ĐÃ GỘP vào Auto Short Viral (dòng 14) 21/09** | Anh: *"2 cái này là một và giữ cái tên Auto Short Viral là chính"* — đè quyết định 18/09 "giữ riêng". Thư mục `AiO Auto Cut Short` (Build, Design System rỗng, Release chỉ có file giữ chỗ) đã bỏ; 2 file ghi chép cũ (4 quyết định 30/07, số đo 31/07: 803 câu → 21 câu hỏi → 8 đoạn) chuyển sang `AiO Auto Short Viral/tai-lieu/cut-short-*-cu.md`. Não hỏi–đáp cũ vẫn nằm trong Re-Frames 0.6.0 — chưa đụng |
| 11 | Auto Organize Folder | — | — | ⬜ Chưa có code | Mới có `yêu cầu.txt` |
| 12 | **Shot & Save** | Electron **0.8.0** (**06/10, vẫn 0.8.0, nạp lần 29 vào app đang cài máy công ty, code ở nhánh `may-cong-ty`, CHƯA đóng gói lại, anh CHƯA báo test xong:** thêm xuất GIF từ Khay video · bút vẽ tay phím 7 + dạ quang phím 8 · chụp cuộn trang dài phím 9 (chạy được trên màn thật 12:42; bản sửa cho bài có video + thanh menu dính 13:10 chưa có lượt thật) · đánh số bước phím 6 (02/10) · ảnh ghim cao hơn màn tự thu nhỏ; ECC soát bắt 8 điểm thật, đã sửa; 4 tính năng đã lên web 06/10 (17 cảnh). Chi tiết: khối TRẠNG THÁI đầu `PROGRESS.md` của app. Trước đó: 01/10 chiều, vẫn 0.8.0, nạp thẳng vào app đang cài, commit trên máy công ty CHƯA push: KHAY ẢNH TỰ THU về nút tròn ở góc dưới-phải sau 5 / 10 / 15 giây, xuất hiện kiểu ống kính, thu về kiểu xấp ảnh, `npm run test:khaynut` 30/30 chạy ẩn, CHƯA xem trên màn thật; cửa sổ Khay Storyboard + Khay video gộp thành MỘT cửa sổ 2 thẻ (bản xem trước, anh mở thật 15:18 không lỗi); Khay video đồng bộ cỡ chữ + hết cắt dòng thông tin; viền quay đủ 4 cạnh trên màn 125% (`DAI` 40 → 64). 01/10 sáng: QUAY VIDEO vùng màn hình, khoanh vùng + nút Quay / phím R → viền cam + đồng hồ + nút Dừng ngoài vùng → MP4 vào thư mục ảnh, Khay video riêng; quay LUÔN có tiếng máy, chọn Có tiếng / Không tiếng trong khay; trần 5 phút; không cần FFmpeg; ☠️ bản đầu bị GIẬT (hình thật 5 lần/giây vì dùng chung bộ chụp với luồng chạy sẵn 5 khung/giây), sửa 11:10: bảng đếm đo 91–94% khung đúng nhịp, 0 khung rớt; viền cam 0% lọt vào video; anh đã bấm thử trên app, CHƯA xem lại sau khi sửa giật; Premiere nhận MP4 phân mảnh hay không chưa đo, Mac chưa đo; 0.7.9 29/09 16:09: ĐỌC CHỮ phím 5 → bảng dòng chữ + Sao chép; Windows luôn Tesseract kèm app (Windows không có bộ đọc tiếng Việt: bảng FOD Microsoft), sai 0,2–0,7% trên đoạn chuẩn, anh test *"khá là tốt rồi"*; Mac Apple Vision chưa đo; 0.7.8 29/09 13:18: khay Storyboard riêng, giữ dải sau khi tắt app, mỗi dải 1 hàng, xoá từng khung, kéo CẢ DẢI thả vào app khác (vẽ sẵn khi rê chuột), xuất luôn dạng lưới, animation phím S "xoè 6 khung", viền quay trong suốt hết viền trắng, ô mã "Dán key"; anh dùng thử *"khá mượt"*; CHƯA thử trên Mac; 0.7.7: gọn 4 chữ phụ Cài đặt, mỗi hàng 1 dòng; 0.7.6: màn Cài đặt làm lại theo hướng B anh chọn + thanh cuộn mảnh + sửa câu chữ; viền quay Storyboard kiểu 1, sửa lỗi viền lọt cam vào 3/6 khung; 0.7.5 29/09: icon Storyboard đổi sang clapper Lucide nét 1,9, cùng hình ở khay + khung chọn + thanh vẽ; anh chê ô lưới cũ "gớm quá"; 0.7.4 28/09: bật Storyboard + khoanh vùng = quay 3 giây, 6 khung ghép dải, tự lưu; bỏ cụm Hiển thị + dải ngày giờ; khay Storyboard theo đúng khuôn màn Cài đặt: font, pill, sắp xếp; Claude rà 0.7.0 của Gemini, sửa 2 lỗi nút Storyboard; NÚT CHƯA CHẠY GÌ, chỉ bật/tắt đèn. Tích hợp nút và menu chọn Multi-Shot Storyboard Strip ngay trên khung kéo chọn Overlay và thanh toolbar (phím S); Storyboard Strip ghép ảnh khay thành dải/lưới phân cảnh 0.6.8-0.6.9) | app độc lập, KHÔNG CEP | ✅ **Anh chấm ĐẠT 14/09** trên bản cài 0.4.4.0 máy công ty (Tauri đã gỡ 14/09 08:06); 0.4.6 nền chữ + dời thư mục ảnh ra ngoài thư mục cài (cài đè từng mất 2 ảnh); 0.4.8 cài 14/09 10:19: ảnh ghim rê chuột hiện 3 nút vẽ (trước chỉ có phím 1/2/3) — anh chấm ĐẠT 14/09; 0.4.9 cài 10:44: màn tối đi mượt (grab chờ 200 ms) — anh chấm ĐẠT 10:52; 0.4.12 kéo to khay = thấy nhiều ảnh hơn (anh ĐẠT 11:2x); 0.4.13–0.4.15 cài 12:00: frozen JPEG + cắt gốc PNG lúc Xong; chụp TRƯỚC khi phủ overlay (overlay phủ ≥0,5 s là video đen — đo), overlay hiện ~0,6 s có hình đứng yên — anh chấm ĐẠT 12:0x; 0.4.16 12:37: thư mục ảnh mặc định đổi `AiOShotSave\AnhChup` vì `&` trong tên làm kéo-thả vào app Chromium ra file rỗng (đo) — anh chấm ĐẠT 12:4x; 0.4.17 13:10: thư mục `shotandsave`, file `shotandsave-…`, kéo-thả an toàn qua hard link với mọi ký tự — anh chấm ĐẠT 13:2x. ☠️ **Tauri ĐÃ BỎ 10/09** | Xem mục 5. [Chờ đo] run-log chết im lặng từ 14/09 09:03 |
| 13 | **Video Download** | **0.2.2** | `com.aiostudio.videodownload` · **8098** | 🟢 Đã cài máy công ty 21/09 | Dán link → tải (yt-dlp + QuickJS 2 MB + FFmpeg LGPL) → tự vào bin. 21/09: giao diện mới (hướng A anh chốt), sửa "Mở thư mục" (gốc: explorer bị `windowsHide` → 9 cửa sổ ẩn 1,67 GB), "Đã vào project" thành nhãn sống theo project đang mở, thư mục mặc định `<project>\AiO Studio Download`. Đo trên Premiere thật bằng project thử riêng. 21/09 14:51 anh tự test: *"thấy ổn"*, không báo lỗi. Chưa dùng trên bài dựng thật; chưa đóng gói bộ cài. Chi tiết: `CLAUDE.md` + `PROGRESS.md` trong thư mục nó |
| 14 | **Auto Short Viral** | **0.1.2** | `com.aiostudio.shortviral` · **8100** | 🟢 **Đã cài, chạy thật trong Premiere 19–21/09** | Đọc nội dung → chia khối HỎI–ĐÁP (thẻ) · bấm câu nhảy đầu đọc · đặt marker · tạo sequence (mỗi khối một cái, hoặc gộp một cái, có tiến độ từng khối) · tab *Toàn bộ lời* xem từng chữ + điểm tin cậy, chọn nhiều câu, chép/xuất `.txt`/`.srt`. Đo thật: bộ 40 phút → 61 khối; sequence 20 phút → 37 khối trong **253 ms**; in/out clip gốc không đổi; `npm run kiem` **222/0**. Chi tiết + việc chờ: `CLAUDE.md` + `PROGRESS.md` trong thư mục nó. ☠️ Chưa làm: AI offline, bản Mac (21/09: đã gộp Auto Cut Short vào đây). 8099 bị `xem-rieng.mjs` (Re-Frames) dùng nên lấy 8100 |

Bảng chi tiết hơn (lịch sử từng bản, việc đang chờ): `Marketing/AiO MVP and
Plan Marketing/TOOL_VERSION_TRACKER.md`. **Bump version panel nào thì sửa luôn
dòng đó ở tracker** — file đó từng để lệch 12 ngày.

**Không phải app:** `AiO Design System` (file thiết kế anh chốt) · `design-system`
(token dùng chung) · `AiO Git Public` · `Website/AiO WebDessign`.

☠️ **8 extension ID + cổng debug KHÔNG được trùng** — trùng là bộ cài này đè
panel kia (đã xảy ra 29/07: bộ cài Autocut cài vào thư mục Asset Manager).
Cổng chỉ sống khi panel **đang mở** trong Premiere. 8095 = máy chủ `xem-bo.mjs`.
⚠️ 8097 vừa là cổng Music vừa là cổng `scripts/brain-map` — hai thứ không chạy
cùng lúc nên chưa đụng nhau; đổi một bên nếu có lúc cần cả hai.

---

## 3. Anh Tiến đã CHỐT gì — theo thứ tự thời gian, mỗi quyết định kèm lý do

Đọc từ dưới lên nếu muốn biết cái mới nhất đè cái nào.

| Ngày | Quyết định | Vì sao | Còn hiệu lực? |
|---|---|---|---|
| 29/07 | Là **SẢN PHẨM ĐỂ BÁN ra nước ngoài**, không phải tool tự dùng | Cạnh tranh AutoCut/AutoPod | ✅ |
| 29/07 | Tách thành từng thư mục panel để **phát triển**, bán thành **một bộ** | Dễ làm từng tính năng | ✅ tách · ❌ "một bộ một giá" bị đè 13/08 |
| 29/07 | FFmpeg **LGPL** `N-125829` thay GPL, `libopenh264` thay `libx264` | Bán được; đo: nhanh gấp đôi, SSIM 0,9655 vs 0,9212 | ✅ |
| 03/08 | Anh **tự thiết kế UI** bằng Claude Design, Claude Code chỉ ghép | Hết cảnh "mỗi lần thiết kế lại lặp lỗi cũ", 4 UI không đồng bộ | ✅ — Auto Cut 03/08, Podcast 04/08, Guide Frame 06/08 đã chốt UI |
| 04/08 | **Luật tài nguyên**: mọi tool dùng RAM/CPU/GPU **sàn 50% – trần 70%** | Premiere là host chính, ăn hết máy là host giật | ✅ (mục 4) |
| 13/08 | **NGƯNG build tool, dồn lực sang website quảng bá** | Lần đầu ra người lạ, phải có chỗ tải + để lại email | ✅ |
| 13/08 | Có **gói FREE** ⇒ phải khoá được tính năng theo gói | Free tier là mồi câu | ✅ nhưng nội dung gói bị đè 16/08 |
| 14/08 | Asset Manager **đóng băng** | *"rất ổn rồi"* | ✅ |
| 14/08 | **KHÔNG mua chứng chỉ ký số** | *"dẹp, anh không tốn tiền cho mấy thứ này"*; bộ cài tự bật PlayerDebugMode, chỉ còn 1 cú "Run anyway" | ✅ |
| 14/08 | Tổ chức lại thành **5 ngăn** (Build and UI Design / Website / Marketing / Release / Test Media) | *"một đống bùi nhùi khó kiểm soát"* | ✅ |
| **16/08** | **Free = CHỈ Asset Manager · Pro = $17/THÁNG đủ 8 tool · KHÔNG lifetime, KHÔNG gói năm** | *"chưa sẵn sàng làm one-time"* | ✅ **BẢNG GIÁ HIỆN HÀNH** |
| 17/08 | Website **đập đi xây mới 100%**, CẤM tái dùng ý/code bản Gemini (tag `ban-cu-17-08`) | *"ngu và build xấu"* | ✅ |
| 19/08 | **Autocut XONG, ngưng phát triển** | Anh dựng bài thật + nghe lại: *"gọn không có gì để chê"* | ✅ |
| 19/08 | **"Dùng trước khi bán"** — chưa qua tay anh trên bài thật thì chưa xong | Tai người là thước duy nhất đứng ngoài; máy đo tự khen mình | ✅ luật |
| 19/08 | **"Tool phải đồng hành"** — panel phải tự biết khi người dùng đổi in/out, sequence, project | Số cũ trên panel = mất niềm tin mọi số khác | ✅ luật (mục 4) |
| 19/08 | Repo public dù có `.p12` + mật khẩu chứng chỉ trong 5 `.ps1` | *"cứ push, tính sau"* — chứng chỉ tự tạo, thiệt hại là danh tiếng, không phải chiếm máy | ✅ CHƯA XỬ |
| 24/08 | Transcripts: **ẨN** khối hiệu ứng (không xoá) | Đo chết 3 đường native, hiệu ứng buộc là MOGRT AE = nặng timeline | ✅ |
| 25/08 | Podcast: *"không thấy sai"* trên liệu thật 40 phút | Thước tai người đầu tiên | ✅ trong phạm vi đã nghe |
| 31/08 | Shot & Save: **đi theo TAURI 2** (Win+Mac), Electron đóng băng 0.4.2 | Chuỗi giật/rung/nhảy 0.3.9→0.4.2 là **bệnh kiến trúc 2 tiến trình** của Electron; app cùng ngành đều native; exe 84 MB vs mục tiêu ~5 MB | ❌ **bị đè 10/09** |
| 31/08 | **3 luật chọn công nghệ**: khảo sát thị trường trước · ưu tiên nhanh-nhẹ · phải chạy Win + Mac | Rút từ vụ Electron | ✅ (ghi trong `/xong` mục 2d) |
| 31/08 | Mỗi dự án phải có **SỔ LỖI TÁI DIỄN** trong `CLAUDE.md` repo + checklist hồi quy | *"lỗi cũ lặp lại hoài"* — double taskbar 25/08 tái diễn 31/08 vì cảnh báo cũ không ghi nguyên nhân đã đo | ✅ Shot & Save đã có; panel khác lập theo mẫu |
| 31/08 | Làm việc **2 máy** đồng bộ qua GitHub; `/xong` = push + lo cho máy kia | Máy nhà từng đứng ở 24/08, thiếu 32 commit không cảnh báo | ✅ (mục 6) |
| 01/09 | Tauri **phải giống y chang bản cũ từng nút** trong Settings | Người dùng không được thấy khác | ❌ bị đè 10/09 |
| **10/09** | **Shot & Save: BỎ bản Tauri, anh tự xoá thư mục; Electron là bản dùng thật, hết đóng băng (sửa lỗi + tính năng đều làm trên Electron)** | Anh: *"anh không dùng bản Tauri"* rồi *"anh sẽ xóa bản Tauri"* (chưa nêu lý do kỹ thuật). ☠️ Lúc chốt, máy công ty đang cài Tauri 0.5.0 với **75 ảnh / 15 MB trong chính thư mục cài** `%LOCALAPPDATA%\AiO Shot & Save\Anh chup` — gỡ cài là mất, phải chép ra trước | ✅ **HIỆN HÀNH** |
| **14/09** | **Shot & Save: KHÔNG làm mô-đun chụp native (C++/Rust) trong Electron, không quay lại Tauri** | Em đề xuất để hạ đen video FB ~0,75 s → ~0,4 s (getSources Electron có sàn ~370 ms kể cả chụp 1×1; Tauri từng đo 141–152 ms). Anh: *"trời ơi đụng đến Tauri là bị lỗi tè le… không nên"*. Hệ quả: ~0,75 s là sàn, đừng đề xuất lại | ✅ **HIỆN HÀNH** |
| **18/09** | **Tính năng "bản đồ nội dung + tách hỏi–đáp" = panel MỚI `AiO Auto Short Viral`, KHÔNG gộp vào Autocut** | Em đề xuất (Autocut xong + đóng băng 19/08; việc khác bản chất; dock 360px chật; nghiên cứu 10/09 đề xuất Autocut vào Free), anh đặt tên: *"tách ra làm phần mới mang tên là Auto Short Viral"* | ✅ |
| **18/09** | ~~**Giữ Auto Cut Short là sản phẩm riêng**~~ (❌ bị đè 21/09 — đã gộp) · **Short Viral không liên quan Re-Frames** · chỉ chuẩn hoá folder Short Viral (không đụng app cũ) · web chưa đổi | Anh chọn trong bảng hỏi; nguyên văn về Re-Frames: *"Re-frames đâu có liên quan gì tới short viral đâu em?"* | ✅ |
| **18/09** | **Tool mới = tạo đủ folder ở mọi ngăn trước khi code** (mục 4h) | *"khi có yêu cầu tạo Tool mới thì em hãy tạo cho anh các thư mục trong từng folder tương ứng"* | ✅ luật |
| **19/09** | **Short Viral làm bằng CEP**, không UXP | Em trình bảng 12 đối thủ (luật 2d): 8/8 app cùng loại xác minh được đều CEP, chưa ai lên UXP; Premiere 27 vẫn chạy CEP; UXP **không chạy được whisper** bằng JS thuần (phải viết addon C++) và bản Mac đòi chứng chỉ Apple 99 USD/năm — trái quyết định 14/08. Kèm điều kiện: tách riêng lớp gọi Premiere và lớp chạy tiến trình để sau đổi UXP chỉ thay 2 file | ✅ |
| **20/09** | **AI của Short Viral chạy OFFLINE, KHÔNG dùng Ollama** | Anh: *"có thể offline luôn nha em, ko dùng ollama"*. Hệ quả: bước 1 không cần model (chia theo chủ đề bằng độ dính từ vựng, tiêu đề lấy cụm từ khoá); bước 2 nếu cần thì nhúng model nhỏ chạy bằng llama.cpp — cùng họ whisper.cpp, vẫn offline, không token | ✅ |
| **21/09** | **Giao diện Short Viral: giữ kiểu THẺ** cho khối hỏi–đáp; tab *Toàn bộ lời* phải đọc được chi tiết | Anh xem artifact 4 bản vẽ rồi chốt: *"anh chốt thẻ C"*, kèm *"khi full scripts em phải đọc và show ra details chi tiết"* | ✅ |
| **21/09** | **Áp “AI Company OS” vào AiO Studio — bước 1: GHÉP vào cách làm hiện tại để xem thật ra sao** (không dựng hệ điều phối riêng). Ghế đầu: **QA khác hãng = Codex CLI** (`codex exec --sandbox read-only`) soát code Claude viết trước khi báo anh | Anh gửi sơ đồ (artifact LYDRzb8efWYwHKf2AN3hZJ), chọn *“ghép vào để anh biết thật sự ra sao”*. Lượt thử đầu trên Video Download 0.2.1: Codex bắt **3 lỗi thật** mà phép đo của Claude đã báo đạt, rồi soát bản vá bắt thêm **1 lỗi do Claude sinh ra**; tốn 55k + 43k token Codex, ~80 s/lượt. Gemini CLI chết (Google bắt chuyển Antigravity) — ghế Gemini CHƯA có | ✅ thử nghiệm |
| **21/09** | **Routine đám mây “Soát code đêm – AiO Studio”** (`trig_01Dpz3fnVmwr21rv79Bij5Qd`, 02:00 VN mỗi ngày, Sonnet 5, CHỈ ĐỌC, không gắn connector nào, báo cáo nằm trong phiên chạy — KHÔNG lên GitHub vì repo public). Xem/xoá: claude.ai/code/routines | Anh hỏi *“có cách nào giao việc 24/7”*, chọn cách “đám mây, soát code mỗi đêm”. ☠️ Máy chủ TỰ GẮN cả 11 connector (Gmail, Supabase, Vercel…) lúc tạo — đã gỡ. Lượt thử 21/09 19:42: 6 commit, 0 lỗi, 117 s — nhưng ghi 0.2.1 “Sạch” trong khi Codex bắt 3 lỗi thật ở đó → Sonnet soát NÔNG hơn Codex; chưa quyết đổi model | ✅ thử nghiệm |
| **21/09** | **Trung tâm Điều hành** (artifact MwhxaNXJNGMrUwKtUDW9Wn, dữ liệu sống + giao việc): tên PHÒNG BAN thật (Ban Giám đốc · Điều hành dự án · Phát triển sản phẩm · Kiểm soát chất lượng · Nghiệm thu · Phát hành · Kinh doanh & CSKH · An ninh thông tin · Nghiên cứu thị trường); trạng thái chỉ 3: Đang làm việc / Chưa tuyển / Có rủi ro; rủi ro nằm ở phòng của nó, không có thông báo tổng; **một chỗ giao việc duy nhất** (ô chỉ đạo); **MỖI PHÒNG CHỈ MỘT VIỆC trên dây chuyền**, việc thứ hai vào Hàng chờ, xong việc thì việc chờ đầu tiên tự vào. **Lệnh `/congty` (23/09), đã GỘP vào `/xong` bước 2f cùng ngày theo lời anh** gắn/cập nhật một sản phẩm vào sổ này (đọc số phiên bản từ repo, ghi app + nhật ký Lịch sử app, hỏi trước khi giao việc cho phòng); bản gốc `.claude/commands/congty.md` | Anh chỉnh qua ~10 góp ý trong buổi: *"chỉ được một tính năng đi qua các phòng ban… không thì timeline bị rối, không kiểm soát được"* | ✅ |
| **21/09** | **GỘP Auto Cut Short vào Auto Short Viral, giữ tên "Auto Short Viral"** — đè dòng 18/09 "giữ riêng" | Anh: *"Auto Short Viral và Auto Cut Short 2 cái này là một và giữ cái tên Auto Short Viral là chính"*. Hệ quả: hết việc chờ "ranh giới hai tool"; cổng 8093 + ID `com.aiostudio.short` trả lại; tổng số tool 14 → 13 | ✅ **HIỆN HÀNH** |
| **21/09** | **Panel tổng = kiểu "BỆ PHÓNG"**: một panel hiện 12 tool dạng thẻ, bấm thẻ → mở panel RIÊNG của tool đó (`requestOpenExtension`); 11 panel giữ nguyên. Làm bằng cách **sửa + nâng cấp `AiO Welcome Hub`** (03/08), không làm mới. Giao diện: **em vẽ nháp 2–3 bản, anh chọn** | Anh: *"làm ra một panel tổng để dễ dàng mở tool… nhìn cho đẹp và chuyên nghiệp"*. Em trình A (bệ phóng) vs B (gộp hết vào 1 panel như AutoCut — đo 21/09: AutoCut là 1 panel có menu 10 tool); anh chọn A. Lý do A: không viết lại 11 panel, tool nặng không làm khựng panel tổng, sau này gắn được báo bản mới + khoá Free/Pro + ngôn ngữ chung. ☠️ Welcome Hub cũ đo 21/09: CHƯA cài, chỉ 7/12 tool, **7/7 nút gọi sai ID** (`com.aio.autocut` ≠ `com.aiostudio.autocut`) → bấm không mở gì; cửa sổ Modeless 1020×720 (panel tổng phải dock được ở 300–450px) | ✅ |
| **21/09** | **Mac: KHÔNG mua Apple Developer 99 USD/năm** → app Mac chỉ **báo có bản mới + nút tải DMG**, người dùng tự kéo cài lại; mở lần đầu vẫn "Open Anyway" | Anh xem ảnh MFinder (hộp Sparkle "Install Update") và muốn app cài như vậy; em báo: tự cài bản mới trên Mac **bắt buộc** ký Developer ID + notarize (tài liệu Electron + electron-builder). Anh chọn "Không mua" — giữ quyết định 14/08. Hệ quả: đừng đề xuất lại electron-updater tự cài trên Mac khi chưa có tài khoản | ✅ |
| **21/09** | **Giao diện panel tổng = HAI dạng tự đổi theo kích thước**: panel **thu hẹp** → **thanh icon** (dọc khi hẹp; ngang khi dock thành dải thấp) · panel **mở rộng / toàn màn hình** → **lưới thẻ A** (380px 2 cột · 1280px 4 cột). **Bỏ hướng B** | Anh xem 3 hướng (https://claude.ai/artifact/GmdDjRe5oRJuNBr3uAbubN): *"option C thành icon dọc cũng khá là hay"* · *"B không được tốt lắm"* · *"thẻ A… ở khổ 3A [380] thì nó sẽ đẹp hơn"* · *"anh muốn có hai dạng… thanh icon dọc khi panel thu lại, và full screen thì lấy của lưới thẻ A"*. Ngưỡng đổi dạng (hẹp < ~340px hoặc thấp < ~260px) là **đề xuất của em, anh CHƯA duyệt** | ✅ |
| **22/09** | **Phong cách panel tổng = "Option 2" trong ảnh ý tưởng anh gửi**: nền tối · **banner cam** "Tất cả công cụ, cho nhà sáng tạo hiện đại" · **mỗi tool một màu riêng** (ô icon màu đặc) · thẻ nằm ngang · hàng lọc nhóm (nút chọn cam đặc) · nút sáng/tối · chuông · VI · ảnh đại diện. Áp cho cả 2 dạng (trang "Bản 3" https://claude.ai/artifact/GmdDjRe5oRJuNBr3uAbubN) | Anh gửi ảnh 6 option (tạo bằng AI) rồi chốt: *"cái này đi em"*. ☠️ **ĐÈ 2 luật "Studio Console" của MASTER.md** — "không hero, không gradient" và "accent tiết chế" — nhưng CHỈ cho panel tổng; 11 panel tool giữ luật cũ. Hàng lọc nhóm quay lại (22/09 sáng anh bảo bỏ ở bản của em; Option 2 có). Chưa có thật: chuông (hệ thông báo) + ảnh đại diện (tài khoản — sẽ gắn với khoá Free/Pro), hình khối 3D (em dựng CSS), bảng 12 màu tool chưa vào `tokens.css`, chữ "Create Faster Together" dùng font Caveat (OFL) phải đóng gói | ✅ |
| **22/09** | **Shot & Save bán RIÊNG: $9.99 trả một lần (lần trừ tiền đầu), rồi $3/năm tuỳ chọn để nhận tính năng mới** — web bán `Website/AiO ShotSave Web/index.html` (1 file tĩnh, sáng/tối có nút chuyển, EN/VI, demo chụp–vẽ–khay–ghim chạy thật trên trang) | Anh: *"chỉ có một gói duy nhất… charge lần đầu $9.99… mỗi năm $3 để duy trì nhân sự update"*, tham khảo CleanShot ($35 + $19/năm). Tin nhắn đầu có cả "$2/năm" — anh chốt lại **$3**. ☠️ Khác bảng giá bộ AiO (Pro $17/tháng, 16/08) — Shot & Save là app ngoài Premiere, bán lẻ. Giả định CHƯA duyệt: không gia hạn thì app vẫn chạy. Chưa có cổng thanh toán | ❌ **giá bị đè 23/09** (cấu trúc 1 lần + năm tuỳ chọn vẫn giữ) |
| **23/09** | **Shot & Save đổi giá: $7.99 trả một lần + $2/năm tuỳ chọn để nhận bản cập nhật** (đè $9.99 + $3/năm của 22/09) | Anh: *"giá anh muốn thay đổi thành $7.99 và $2/year updated"* (chưa nêu lý do). Đã đổi đủ 18 chỗ trên web (thẻ giá, nút Mua, ghi chú tiền, 3 hỏi đáp, mô tả trang, số đếm lên). Cổng thanh toán vẫn chưa có | ❌ **bị đè 28/09** ($14.99 một lần, cập nhật trọn đời) |
| **23/09** | **Shot & Save bán qua POLAR (polar.sh) · hoàn tiền 14 ngày** | Anh chọn trong bảng 4 cổng em tra 23/09: Polar 5% + $0,50 (+1,5% thẻ ngoài Mỹ; rút tiền $2/tháng có rút + 0,25%), trang supported-countries CÓ Việt Nam (Stripe Connect Express), **khoá bản quyền có sẵn** (hết hạn sau N năm, giới hạn số máy, tự thu hồi khi huỷ thuê bao), app kiểm mã qua `POST api.polar.sh/v1/customer-portal/license-keys/activate` + `/validate` (không cần token, cần `organization_id`) → không phải dựng máy chủ. Bỏ: Lemon Squeezy (đang chuyển sang Stripe Managed Payments, bản mới chỉ nhận người bán 35+ nước), Paddle (không có khoá bản quyền), Gumroad (phí 10%). Mô hình: SP1 $7.99 một lần + khoá hết hạn 1 năm = hết QUYỀN CẬP NHẬT, app vẫn chạy (logic trong app); SP2 $2/năm tạo sau. Anh chọn 14 ngày (em đề xuất 30). ☠️ Tạo tài khoản/KYC/ngân hàng = ANH làm, Claude cấm nhập | ✅ |
| **23/09** | **Shot & Save: 1 mã bản quyền = 2 MÁY** (Polar License Keys: prefix `AIOSS`, hết hạn 1 năm, Limit Activations = 2). Org Polar `aiostudio` (Individual, USD) anh tạo 23/09 | Anh chốt *"1 mã 1 máy"* rồi đổi ngay sang **2 máy** (*"nên là 2 máy hợp lí"*) vì người có máy công ty + máy nhà; lỗ 1 mã chia sẻ ~$7 không đáng làm khó khách thật. Hệ quả: app PHẢI có nút **huỷ kích hoạt** (Polar `/license-keys/deactivate`) để khách đổi máy; legal.html đã sửa theo (EN+VI). Polar Organization ID `05f1edf9-2456-4d3f-8ff1-a824e433673e` (công khai, app gửi kèm khi kích hoạt) | ✅ |
| **23/09** | **Shot & Save: chưa nhập mã = DÙNG THỬ 14 NGÀY đủ tính năng**, hết hạn thì khoá chụp + hiện ô nhập mã/nút Mua · **Tải bộ cài phải qua bước để lại EMAIL** (SĐT đã bỏ, xem cột lý do) | Anh: *"cho dùng 14 ngày đi em"*, *"tải được qua bước để lại Email và Số Phone"*. → Anh chốt tiếp: lưu vào **Google Sheet**; **BỎ số điện thoại** (*"nếu biết được thì ko cần số phone"*) vì quốc gia tự lấy từ header `x-vercel-ip-country` + múi giờ, và SMS quảng cáo khách nước ngoài phạm luật (TCPA/GDPR). Form = email bắt buộc + ô tích đồng ý nhận tin + quốc gia tự lấy. Chưa có: email hỗ trợ công khai. legal.html mục Quyền riêng tư phải thêm câu thu email khi tải. Bộ cài CHƯA có chỗ tải công khai (web chưa có nút Tải; đề xuất GitHub Releases, chờ anh gật). Link Checkout đã tạo ("Web chinh") nhưng anh CHƯA dán dạng chữ | ✅ |
| **24/09** | **Shot & Save: mã bản quyền QUÁ 1 NĂM vẫn kích hoạt được — dùng mãi, chỉ hết bản cập nhật (phương án A)** | Đọc mã nguồn Polar: `activate` từ chối mã hết hạn (403 "License key has expired.") → khách mua năm trước cài lại máy sẽ bị khoá, trái luật "không gia hạn thì app vẫn chạy". Anh chọn A trong bảng hỏi (B = bắt gia hạn $2 mới cài máy mới). Đổi lại: mã hết hạn không còn giới hạn 2 máy. Hằng `NHAN_MA_HET_HAN` trong `src/banquyen.js` | ✅ còn trong mã, nhưng từ 28/09 mã mới KHÔNG hết hạn nên hiếm khi dùng tới |
| **25/09** | **GỘP thành MỘT web AiO Studio: trang chủ + 2 trang con (bộ tool Premiere · Shot & Save).** Bản web bộ tool cũ (Next.js 17/08, `Website/AiO WebDessign`) **BỎ**: anh *"bản cũ của anh xấu quá"*. Trang bộ tool làm MỚI, **lấy trang Shot & Save làm CHUẨN** (1 file tĩnh, cùng token/thanh trên/EN-VI/sáng-tối), nằm cùng thư mục web Shot & Save ở đường dẫn `/premiere/`; Shot & Save giữ `/` tới khi có trang chủ chung (nút Mua trong app 0.5.6 trỏ `aio-shotsave.vercel.app/#checkout` không hỏng) | Anh đề xuất gộp, em đồng ý (1 tên miền, khách giới thiệu chéo, Polar đã tên `aiostudio`). Cách làm A (ghép, không viết lại trang Shot & Save đã duyệt) | ✅ |
| **25/09** | **Trang bộ tool (nháp 1):** hiện **ĐỦ 11 tool** (kể cả chưa xong, gắn nhãn Sẵn sàng / Mới / Đang làm / Sắp có) + thẻ "AiO Studio hub" = 12 thẻ · **KHÔNG hiện giá**, chỉ ô "Sắp mở bán, để lại email" · tên **"AiO Studio for Premiere Pro"** (AiO Studio = tên chung của web). Mọi số trên thẻ lấy từ số đo đã ghi (scratchpad `du-lieu-tool.md` có nguồn file:dòng); ☠️ 3 số web cũ KHÔNG dùng lại: Autocut "6 phút/23 giây" (không có nguồn), Re-Frames "0,2 giây" (đường từ chối, đúng là 3,9 s), Podcast 588/588 ghép với 411 nhát (hai bộ liệu khác nhau). Web cũ tự ghi "DaVinci Resolve" trong khi 11 panel chỉ chạy Premiere → trang mới ghi rõ Premiere Pro · Windows | Anh chọn trong bảng hỏi 25/09 (*"xây nháp trước 1 trang bao gồm tất cả tool"*, chưa hiện giá, tên đề xuất). Nháp 1 chạy ở máy công ty `http://127.0.0.1:8124/premiere/` (scratchpad). **30/09 anh xem: *"chưa đủ Creative… animation lồng lộn lên"*** → nháp 2 "cả trang là một bài đang được dựng" (tiêu đề bị Auto Cut cắt, sân khấu 12 cảnh cuộn tới đâu tool diễn tới đó, razor cuối trang). Cả 2 nháp đã vào repo `Website/Nhap web ShotSave/premiere-nhap-{1,2}.html` (`2d3d960`, NGOÀI thư mục web, không lên Vercel). **01/10 anh xem nháp 2: *"khi scroll thì section sang ngang đi em, hiện tại nó đứng yên"* + *"phải Creative hơn nữa, section phải đặc biệt"*** → nháp 3 `premiere-nhap-3.html`: phần 12 tool thành **timeline Premiere trôi ngang** (12 clip xếp hàng, cuộn dọc = trượt ngang dưới đầu đọc, clip hai bên nghiêng + mờ, lăn 1 nấc = 1 clip, kéo ngang, nút Lùi / Phát / Tới, phím J K L Space). ☠️ Gốc của "đứng yên": snap "hút về mốc gần nhất" của nháp 2 — lăn chuột thật 28 nấc không qua được cảnh nào (bài đo cũ chỉ nhảy `scrollTo`). Nhật ký: `PROGRESS.md` gốc repo, mục 01/10 16:20. **Anh duyệt nháp 3 lúc 16:33: *"quá đẹp em push lên git"*** → đã push (chỉ commit web `ce061fd`, không kèm Shot & Save 0.8.0 đang test). Link xem trên điện thoại (riêng tư, tài khoản Claude của anh): https://claude.ai/artifact/RKgs9dfNu3U8sjM8z1MVV9 — sinh từ nháp 3 bằng `Website/Nhap web ShotSave/tao-artifact.cjs`, sửa trang thì sửa nháp 3 rồi chạy lại script và đăng đè, đừng sửa tay bản đăng. **01/10 19:28 anh: *"đưa thằng này lên… lẹ lên"*** → nháp 3 chép nguyên văn thành `Website/AiO ShotSave Web/premiere/index.html`, **LIVE ở https://aio-shotsave.vercel.app/premiere/** (`fe54c7d`; md5 live = blob git `83d975d9`; lăn chuột thật trên live 01→06, 0 lỗi console). ☠️ Ô email của trang CHƯA nối lưu (bấm gửi chỉ hiện "chưa lưu gì cả"); trang Shot & Save `/` chưa có link sang `/premiere/`. Sửa trang: sửa nháp 3 rồi chép đè sang `premiere/index.html` | ✅ hướng "timeline trôi ngang" anh duyệt · ✅ **đã live ở `/premiere/` 01/10** · 🟡 ô email chưa nối lưu, chưa có trang chủ chung |
| **27/09** | **Shot & Save làm bằng CẢ Gemini lẫn Claude Code, theo 3 luật trong `AGENTS.md`** (một file cả hai cùng đọc): mỗi AI một bàn làm việc (Gemini: git worktree `D:\Production\AiO Studio - Gemini`, nhánh `gemini`; Claude: `main`) · Gemini dựng → BÀN GIAO → Claude soát, gộp `main`, cài · mỗi app một người cầm bút, anh báo tới lượt ai | Cùng ngày: Gemini commit `e62ec52` gom nhầm ~20 file dở của Claude; 7 bản Gemini (0.5.7→0.6.4) 0 dòng kiểm thử, lọt lỗi ảnh hiện 2 lần; bảng phiên bản kẹt 0.5.5. Anh: *"làm sao để 2 đứa em cùng nhau làm mà không lỗi?"* → em đề xuất, anh: *"tạo 1 file mà 2 đứa đều phải đọc"*. Antigravity tự đọc `AGENTS.md` (docs chính thức), Claude nạp qua `@AGENTS.md` đầu file này | ✅ **HIỆN HÀNH** |
| **28/09** | **Shot & Save: MỘT giá duy nhất $14.99 trả một lần, CẬP NHẬT TRỌN ĐỜI** (bỏ $2/năm, đè 23/09) | Anh: *"anh suy nghĩ rồi giá mình chỉ để một giá duy nhất là $14,99 là xong cho nó tiện đi em"*; chọn "Cập nhật trọn đời" trong bảng hỏi (phương án kia: kèm 1 năm cập nhật, hết năm mua lại). Đã đổi web: trang chủ (thẻ giá, nút Mua, 3 hỏi đáp, mô tả trang, số chạy lên), legal.html EN+VI (bỏ mục hoàn tiền gia hạn, ngày 28/09), checkout-demo, 2 mẫu thư cảm ơn. **Polar 06/10:** giá sản phẩm ĐÃ đổi $14.99 (Claude sửa qua Chrome của anh, link Checkout giữ nguyên, đọc lại trên trang thanh toán ra $14.99). ☠️ **CÒN trên Polar:** License Key vẫn hết hạn "1 year after grant" + tên benefit còn chữ "+ 1 year updates" (chờ anh gật mới sửa; giữ 2 máy), không tạo SP $2/năm; org vẫn "test mode" nên nút Pay now khoá (chờ anh xong xác minh tài khoản). ☠️ **App còn 1 chỗ sai:** `src/settings/settings.js:301` mã KHÔNG có ngày hết hạn lại hiện "Đã hết hạn nhận bản cập nhật" — phải sửa trước khi bán | ✅ **HIỆN HÀNH** |
| **28/09** | **Shot & Save Storyboard: khoanh vùng + bật Storyboard = QUAY 3 GIÂY → 6 khung (0,5 s/khung) → 1 dải tự lưu**; trong lúc quay có viền cam + đếm 3-2-1; nhãn SHOT luôn hiện, **bỏ** cụm "Hiển thị" và dải ngày giờ. Giao diện cửa sổ ghép theo **màn Cài đặt** | Anh: *"khi chọn Multi-Shot Storyboard Strip mình khoanh vùng thì app sẽ tự động lưu lại hình ảnh với 3s và chuyển thành dải hình ảnh thì nó sẽ rất tiện"* + chọn trong 2 bảng hỏi (*"khoanh 1 lần chụp 1 lần 3s"*, *"cứ đủ 3s là tạo thành 1 strips"*, 6 khung, viền + đếm ngược, bỏ ngày giờ). Giao diện: anh chê 0.7.2 *"chưa chuẩn như UI đang có · font chữ - pill - cách em sắp xếp"*. Làm ở 0.7.4 (`a1bf23f`), chưa chạy app thật | ✅ **HIỆN HÀNH** |
| **29/09** | **Shot & Save ĐỌC CHỮ: khoanh vùng + phím 5 → bảng các dòng chữ + nút Sao chép. Bộ đọc: native (Windows OCR / Apple Vision), NHƯNG trên Windows LUÔN đọc bằng Tesseract đóng gói kèm app** (+ nút đổi sang bộ đọc Windows) | Khảo sát thị trường 29/09: thiếu OCR là lỗ lớn nhất (cả Snipping Tool miễn phí có). Anh: *"khoanh vùng, bấm phím số 5, sinh ra bảng các dòng text và nút copy"* + *"ưu tiên Native, chính xác, dùng được trên win và mac"*. Đo: Windows KHÔNG có bộ đọc tiếng Việt (bảng FOD Microsoft) → anh chọn "theo ngôn ngữ app", thử thấy sai (app để tiếng Anh, đọc chat Việt) → chọn lại **"Luôn Tesseract"** (sai 0,2–0,7% vs Windows ~20% trên đoạn chuẩn 1.226 ký tự). Anh test *"khá là tốt rồi"*, ra 0.7.9 (`14ea322`). Mac chưa đo; bộ cài nặng thêm (~20 MB trước nén, chưa đo bộ cài) | ✅ **HIỆN HÀNH** |
| **01/10** | **Cách phát hành khi đang làm: nạp bản mới THẲNG vào app đang cài, KHÔNG tạo bộ cài; test xong hết mới đóng gói + push git + đưa lên web, làm một lượt** (đè luật 28/09 "mỗi lần làm xong thêm bộ cài vào Release") | Anh: *"mỗi lần update em chỉ cần cài vào bản hiện tại - không cài bộ cài mới khi nào test xong hết thì em mới đóng gói và push code lên git và update tính năng lên website luôn"*. Lúc anh nói `Release/AiO Shotandsave/win` đang có 11 bộ cài. Cách làm: `node scripts/cai-tai-cho.mjs` trong thư mục app (27 s dựng + vài giây nạp); luật ở `AGENTS.md` mục 5 | ✅ **HIỆN HÀNH** |
| **01/10** | **Shot & Save quay video: LUÔN có tiếng máy, BỎ nút loa trên thanh công cụ; chọn "Có tiếng / Không tiếng" nằm trong Khay video, từng video một** (đè phần "nút bật tiếng, mặc định tắt" của dòng dưới) | Anh quay 2 lượt đầu không có tiếng vì không để ý nút loa, rồi chốt: *"mặc định sẽ cho người xem quay video có tiếng… khi quay xong vào khay rồi em hãy cho người dùng chọn 2 nút này phía trong thì nó sẽ đỡ thao tác hơn… ở ngoài thanh menu em bỏ luôn nút loa"*. Bản không tiếng tạo không cần FFmpeg (đổi tên hộp tiếng trong file, hình giống bản gốc từng điểm ảnh, 90 MB mất 27 ms) | ✅ **HIỆN HÀNH** |
| **01/10** | **Shot & Save QUAY VIDEO vùng màn hình: quay tới khi BẤM DỪNG (trần 5 phút) · ~~có NÚT BẬT TIẾNG MÁY (mặc định tắt)~~ · video nằm ở KHAY RIÊNG · MP4 trước, GIF làm sau** | Anh xem danh sách 11 tính năng có thể làm tiếp (`ROADMAP.md` mục 0) và chọn *"quay vùng màn hình nha em"*; 4 lựa chọn trên anh chọn trong bảng hỏi (em đề xuất "chung Khay ảnh", anh chọn **khay riêng**). Đo trước khi xây: Electron 43.4.1 tự quay được MP4 H.264 + AAC từ cửa sổ ẩn (4K 30 khung/giây) → **không gắn FFmpeg**, bộ cài không nặng thêm vì tính năng này. Ra 0.8.0 | ✅ **HIỆN HÀNH** |
| **01/10** | **Shot & Save: Khay ảnh TỰ THU về một NÚT TRÒN ở góc dưới-phải màn hình khi không dùng. Xuất hiện kiểu "ống kính" (A), thu về kiểu "xấp ảnh" (B) · tự thu sau 5 giây, Cài đặt chọn 5s / 10s / 15s · mở lại bằng BẤM nút tròn · kéo khay đi đâu nút vẫn về góc, mở ra khay về chỗ cũ** | Anh: *"khi không dùng tới chụp ảnh khay sẽ tự thu về thành một nút tròn ở góc màn hình để đỡ tốn diện tích… animation phải đẹp"*. 3 kiểu chuyển động đầu (co / hút / nhanh) anh chê *"chưa đủ đẹp và creative"* → 3 ý tưởng kể đúng việc app làm (ống kính, xấp ảnh, khoanh vùng; `nhap/khay-nut-tron.html`), anh *"cái nào cũng đẹp"* rồi chốt trong bảng hỏi: *"Xuất hiện A và Thu về B"*, *"5 giây, thêm tuỳ chọn 5s - 10s - 15s trong settings"*, bấm để mở. Đã làm + nạp vào app đang cài 16:07 (`src/khay-thu.js`), bài đo ẩn 30/30; **chưa xem trên màn thật** | ✅ **HIỆN HÀNH** |
| **01/10** | **Shot & Save: GỘP cửa sổ Khay Storyboard + Khay video thành MỘT cửa sổ 2 thẻ (bản xem trước)** | Anh: *"phần khay mình tối ưu hóa thành 1 khay?"* → em đề xuất gộp 2 cửa sổ trước, Khay ảnh nổi giữ nguyên; anh *"gộp cho anh xem trước đi"*. Nạp 13:59, anh mở thật 15:18 không lỗi, rồi hỏi *"cách nào tiện hơn nữa không"* (hướng "một khay 3 thẻ", `ROADMAP.md` mục 0b/0c, chưa chốt) | 🟡 anh đang dùng thử, chưa chốt |
| **01/10** | **Web `/premiere/`: mỗi cảnh tool phải diễn TRONG PHẦN MỀM** (cửa sổ Adobe Premiere Pro: Project, màn hình, Timeline, panel của tool; con trỏ bấm nút → timeline + màn hình đổi → kết quả), kèm 3 bước chữ đời thường. Tiêu chí duyệt: **người KHÔNG làm editor nhìn vào phải hiểu tool làm gì**; cảnh diễn chậm đủ đọc (đo: 6,7 s/cảnh, bản cũ 1,5 s) | Anh duyệt từng cảnh bản nháp 3: Podcast *"chưa diễn tả được Podcast là gì"*, Short Viral *"khó hiểu"*, Re-Frames *"người diễn tả bị xấu"*, Guide Frame *"vừa xấu vừa khó hiểu"*, *"layout từng section bị rời rạc"*, *"con số và câu từ gây khó hiểu"*. Chốt hướng: *"làm animation phải có thêm phần mềm vào để diễn tả… giống 02 phần ở dưới rất dễ hiểu khi em đưa hoạt họa phần mềm vào… mặc dù UI không creative bằng nhưng rất dễ hiểu"*. Khung dùng chung `pm-` + `pmKhung()` trong `premiere/index.html`; bộ nhân vật `nv-` thay hình tròn + khối hộp. Đã live: cảnh 01 Auto Cut, 02 Podcast (`19a3f39`) + 3 hình Vì sao + làm chậm. Kiểm công dụng thật 4 tool sửa luôn số sai trên trang (Podcast 588/588 → 411; Guide Frame 59 → 54 vùng; Short Viral KHÔNG ra video dọc, KHÔNG gắn phụ đề; Re-Frames 3,9 s là lúc sequence hiện ra). Nhật ký: `PROGRESS.md` gốc, 3 mục 01/10 | ✅ **HIỆN HÀNH** · 🟡 còn 10/12 cảnh chưa theo khung mới |
| **03/10** | **Mac ở nhà là MÁY LÀM VIỆC CHÍNH**; một thư mục duy nhất `~/Production/AiO Studio`, nhánh `mac` | Anh: *"em lấy lại cho anh rồi giúp anh tổng hợp thành một file duy nhất và từ nay mac sẽ là máy làm việc chính của anh"*, *"chắc chắn rằng máy mac ở nhà của anh làm việc như ở công ty"* (chưa nêu lý do). Trước đó trên Mac có 3 bản: Thùng rác (bản 29/09 có mã Mac 30/09), `Downloads/Production` (bản máy công ty 02/10), bản clone 01/10. Đã gom về bản clone: mã Mac + việc dở Guide Frame (2 commit nhánh `mac`), Test Media 242 file, bộ cài mới nhất. ☠️ Nhánh `mac` CHƯA gộp `main`; nhánh Windows của 11 panel CHƯA kiểm lại sau khi thêm nhánh Mac; số phiên bản panel CHƯA tăng | ✅ **HIỆN HÀNH** |

---

## 4. LUẬT của dự án — phải giữ ở mọi panel

### 4a. Dùng trước khi bán (19/08)
Thứ gì anh chưa **dùng thật trên bài thật** thì chưa được coi là xong, dù mọi
con số xanh. Panel phải có đường ghi lại chỗ tool làm sai ngay lúc đang dựng.
Đừng đề xuất tính năng mới khi món đang làm chưa qua vòng anh tự dùng.

### 4b. Tool phải đồng hành (19/08)
Câu kiểm: *người dùng đổi thứ gì TRONG Premiere mà không đụng panel — panel có
biết không?* Adobe **không bắn sự kiện** sang panel. Cách đúng (đo trên Autocut):
vòng thăm dò ~1s · hàm host NHẸ chỉ đọc mấy số (`ac_getRange` 1 ms) · so mốc,
đổi thật mới gọi hàm nặng · **đang chạy thì ngưng hỏi** (ExtendScript 1 luồng)
· mất dữ liệu thì xoá số cũ. ☠️ `window.focus` KHÔNG đủ — bấm I/O trên
timeline panel không nhận focus. Chỗ còn phải rà: tên project/sequence trên
thanh trên thường chỉ đọc **một lần lúc mở**.

### 4c. Tài nguyên: sàn 50% – trần 70% (04/08)
Nguồn chân lý `Build and UI Design/design-system/tai-nguyen.js`; kiểm bằng
`kiem-tai-nguyen.ps1`. 70% là **TRẦN**, 50% là **SÀN khi người dùng đang đợi**;
chạy nền chỉ áp trần + hạ ưu tiên IDLE. Đo thật 04/08 (encode 4K→720p, máy 32
luồng): không ghim `-threads` FFmpeg **chỉ dùng 10,5 luồng, 5,2s**; ghim 22
(trần 70%) **3,6s** — ghim trần rộng **nhanh hơn 31%**. Asset Manager/Power Bins
giữ 8 tiến trình × 2 luồng = 50% **cố ý** (nút thắt là ổ cứng, 16 luồng chậm
hơn 8). GPU: whisper `turbo` đỉnh 67% (dưới trần), `large-v3` đỉnh 88% (**cấm
làm mặc định**); không chạy 2 whisper song song.

### 4d. Thiết kế: đọc `design-system/` trước khi làm UI bất kỳ panel nào
| File | Là gì |
|---|---|
| `Build and UI Design/design-system/MASTER.md` | Có mục "10 lỗi đã vấp" |
| `tokens.css` | **Nguồn chân lý**. Sửa ở đây, KHÔNG sửa bản copy trong panel |
| `dong-bo-tokens.ps1` | Chép nguồn sang các panel (chép `Inter.woff2` vào `client/src/fonts/` TRƯỚC) |
| `kiem-dong-bo.ps1` · `so-sanh.html` · `xem-bo.mjs` (cổng 8095, bind LAN) | Đo thật + bàn so sánh panel cạnh nhau |

- ☠️ `AiO Design System/` (file thiết kế anh chốt, **BẤT KHẢ XÂM PHẠM** — *"em
  không được sửa thiết kế anh chốt"*) **KHÁC** `design-system/` (hạ tầng máy, 32
  file trỏ tới bằng đường dẫn — ĐỪNG dời/đổi tên).
- Ghép thiết kế = bê hình thức sang, **giữ bộ máy**. ☠️ Guide Frame 06/08 từng
  bị **chép đè** `dist/index.html` bằng file thiết kế (md5 giống hệt): mất đường
  gỡ guide, 14 id JS không có thẻ. Đừng chép đè — ghép.
- Được **thêm** thứ thiết kế chưa có, được **bỏ** thứ nền tảng không cho — bỏ gì
  thì **nói ra**.
- Màu: nền `#181818`, accent `#F86820`. Chữ trắng trên cam = **3,00:1**, chỉ hợp
  lệ cho chữ bold ≥14px; nút nhỏ phải chữ **tối** (đo 6,43). ☠️ 24/08 đổi
  `--accent-on` nâu→trắng làm nút cam 11px của Asset Manager tụt 6,2→2,7:1.
- ☠️ **Token khớp ≠ nhìn giống nhau**: script báo 16/16 token giống, anh Tiến
  xếp 4 panel cạnh nhau chỉ ra 4 lỗi trong 10 phút. Dựng bàn so sánh TRƯỚC.
- Khi chạy **không lộ quy trình** — chỉ "Đang xử lý… N%" (13/08, 24/08 Transcripts sót).
- Song ngữ VI/EN cả bộ, lựa chọn lưu chung `%APPDATA%\AiOStudio\ngonngu.json`.
- Bài học UI đã đúc: `~/.claude/skills/design-lessons/LESSONS.md` (đọc trước khi ghép).

### 4e. Đóng gói & bán
- Bảng giá hiện hành (16/08): **Free = Asset Manager · Pro $17/tháng đủ 8 tool**.
- **Nghiên cứu thị trường số thật 10/09/2026:** `Marketing/AiO MVP and Plan
  Marketing/NGHIEN_CUU_THI_TRUONG_2026-09-10.md` — 20 đối thủ trong Premiere
  (giá fetch cùng ngày), Adobe native đã làm gì, kênh bán từ VN, tiếng nói
  khách hàng. Hai bản tháng 8 (`BAO_CAO_TONG_HOP`, `MASTER_PLAN`) có số sai —
  mục 10 của file đó liệt kê. ☠️ Phát hiện lớn nhất: **Adobe viết thành văn sẽ
  gỡ CEP** khỏi Premiere ("a calendar year" sau UXP chính thức; HyperBrew dẫn
  lời nói miệng "several years") — 11 panel đều CEP, chưa có kế hoạch port UXP.
  Cơ chế khoá gói phải tách **1 free / 7 trả tiền** — CHƯA làm.
- Kho FFmpeg dùng chung `%APPDATA%\AiOStudio\bin\win64` + `package-release.ps1
  -BinChung`: 3 gói từ 274,7 MB → ~92 MB. ☠️ CHƯA có `SETUP.exe` gộp, CHƯA panel
  nào chạy thật bằng kho chung trên Premiere.
- Bộ cài `CAI-DAT.bat` tự bật `PlayerDebugMode`, không cần Admin.
- Bộ cài: `Release/<Tên app như Build>/win/` + `mac/`, CHỈ bản mới nhất (anh chốt 14/09; mac
  chưa có bản nào); `.exe/.zip/.rar` **không lên git**. Xem `Release/README.md`.
- ☠️ **BẢO MẬT CHƯA XỬ (19/08):** repo public chứa 3 file `aiostudio-dev.p12` +
  mật khẩu trong 5 `.ps1` → ai cũng ký được `.zxp` mạo danh. Anh chốt "tính sau".

### 4f. Hai cặp panel dính nhau — sửa một bên thì kiểm bên kia (đo 29/07)
| Cặp | Dùng chung | Lưu ý |
|---|---|---|
| Asset Manager ↔ Power Bins | ~90% mã (`store.ts`, `Grid.tsx`, `jobQueue`, `mediaServer`, ffmpeg, thumbnail) | Kho dữ liệu **RIÊNG**: `AiOStudio` vs `AiOPowerBins` |
| Autocut ↔ Transcripts | ~80% (tách WAV + `whisper.ts` + `amluong.ts`) | **Bộ đệm nghe dùng chung** `<tên>.autocut-nghe.json` cạnh video — cố ý |

☠️ Autocut đếm clip caption MOGRT như clip video → từ chối chạy trên sequence
đã có caption AiO. Transcripts đã vá (bỏ `.mogrt`), Autocut **đóng băng → hỏi
anh** trước khi vá 1 dòng.

### 4g. Hai bẫy CEP đắt nhất (chi tiết: skill `adobe-cep-panel`)
1. **Panel mới nói chuyện với HOST CŨ** — Premiere nạp `host/*.jsx` một lần lúc
   khởi động. Cài bản mới + reload panel = `EvalScript error.` khắp nơi.
2. **QE DOM sập Premiere nếu sai tham số** — không dò API nội bộ trên máy đang
   mở dự án thật. 04/08 đã làm sập Premiere của anh vì dò `encodeSequence`
   dù sổ đã ghi CẤM (bài 5q brain tổng).
3. `app.project.activeSequence` **bám tab có tiêu điểm**, tự trôi — 24/08
   caption rơi sang sequence của anh mà panel báo thành công. Giữ ID cái đang
   hiện, ép mở + đọc lại rồi mới ghi. **Dọn xong soi CẢ project.**

### 4h. ☠️ TOOL MỚI = TẠO ĐỦ FOLDER Ở MỌI NGĂN, TRƯỚC KHI VIẾT CODE (anh chốt 18/09)
Nguyên văn: *"khi có yêu cầu tạo Tool mới thì em hãy tạo cho anh các thư mục trong
từng folder tương ứng đang có trong folder Production"* — lúc tách **Auto Short
Viral**, kèm *"chuẩn hóa Folder trước khi chúng ta bắt đầu làm cái gì đó"*.
Vì sao: trước đó mỗi app có mặt ở ngăn này mà thiếu ở ngăn kia (18/09: Video
Download có Release nhưng không có folder trong Design System) → tìm đồ phải đoán.

1. **DÒ, đừng nhớ danh sách.** Ngăn nào đang có folder riêng `AiO <Tên>` cho từ
   2 app trở lên thì tool mới cũng phải có folder ở đó. Đo 18/09 ra **3 ngăn**:

   | Ngăn | Để làm gì | Ai bỏ đồ vào |
   |---|---|---|
   | `Build and UI Design/AiO <Tên>/` | mã nguồn + `CLAUDE.md` + `PROGRESS.md` ngay từ ngày đầu | Claude |
   | `Build and UI Design/AiO Design System/AiO <Tên>/` | file thiết kế anh chốt | **Anh** — Claude chỉ tạo thư mục, KHÔNG tạo/sửa file thiết kế |
   | `Release/AiO <Tên>/win/` + `mac/` | bộ cài mới nhất (luật trong `Release/README.md`) | Claude, lúc đóng gói |

   `Marketing/`, `Test Media/`, `Website/`, `Research and Architecture/` là ngăn
   **dùng chung**, không có folder từng app → đừng tạo.
2. **Cùng MỘT tên y hệt ở mọi ngăn** (`AiO <Tên>`) — để NGƯỜI đi tìm thấy ngay.
   Không script nào đọc tên thư mục `Release/` (đo 18/09): bộ cài sinh ra trong
   `<panel>/build/release`, chép TAY sang `Release/AiO <Tên>/win/`.
3. ☠️ **Git không theo dõi thư mục rỗng** → folder rỗng thì máy kia pull về
   **không có**. Mỗi thư mục mới phải có một file giữ chỗ (`README.md` 2–3 dòng
   nói thư mục để làm gì; `mac/` dùng `CHUA-CO-BAN-MAC.txt` như các app khác).
4. **KHÔNG tạo tay** `dist/` · `build/` · `bin/` · `node_modules/` — do build/cài
   sinh ra, bị gitignore hoặc bị script ghi đè.
5. **Đăng ký tên** ngay: bảng mục 2 file này (extension ID + cổng, **không trùng**),
   `Marketing/AiO MVP and Plan Marketing/TOOL_VERSION_TRACKER.md`.
6. Tool **kế thừa / đổi tên** dự án cũ → **hỏi anh** giữ song song hay gộp. Gộp
   thì `git mv` ở cả mọi ngăn để giữ lịch sử (thư mục rỗng thì đổi tên thường,
   `git mv` báo lỗi). *(Dòng này là đề xuất của Claude 18/09, CHƯA phải lời anh —
   đừng trình cho anh như "luật cấm".)* Ca đầu tiên 18/09: Short Viral kế thừa ý
   của Cut Short → anh chọn **GIỮ RIÊNG hai sản phẩm** — tức là không mặc định gộp. (21/09 anh đổi ý: **gộp**, giữ tên Short Viral — xem mục 3.)
6b. Panel mới chép khuôn từ panel cũ: **tạo `.gitignore` riêng ĐẦU TIÊN**, trước
   lần chạy `sign-install.ps1` đầu tiên — `.gitignore` gốc KHÔNG chặn `certs/`,
   repo PUBLIC; 3 panel thiếu nó (Podcast, Re-Frames, Guide Frame) đã đưa `.p12`
   lên GitHub. Và `git grep` tên/ID/cổng của panel khuôn phải ra **0 dòng** trước
   lần cài đầu — sót một chỗ `$extId` là cài đè lên panel khuôn (sự cố 29/07).
7. Kiểm bằng số trước khi báo xong: `ls` từng ngăn thấy đủ folder, `git ls-files`
   thấy file giữ chỗ trong từng folder. `/xong` có bước kiểm này (mục 2e).

---

## 5. Shot & Save — app ngoài Premiere

Chụp vùng màn hình (phím tắt) → khay ảnh → ghim sticky → vẽ khung/mũi tên →
Ctrl+C / kéo-thả ra Zalo, Messenger, Explorer. Vắt ngang 2 màn đúng pixel vật
lý (máy anh 150% + 125%). Song ngữ. Không làm CEP vì sandbox Premiere không cho
chụp màn hình và kéo file ra ngoài.

| Bản | Ở đâu | Trạng thái |
|---|---|---|
| **Electron 0.4.4** | `Build and UI Design/AiO Shotandsave/` | **BẢN DUY NHẤT từ 10/09** (hết đóng băng). 0.4.2 anh chấm ĐẠT 31/08 *"kéo lại ổn định"*; 0.4.3 sửa mất ảnh im lặng; 0.4.4 thêm công cụ CHỮ + phím 1/2/3 + sửa khung ghim lệch 1,5×. **Cài đè máy công ty 14/09 08:06 (đo 0.4.4.0), anh chấm ĐẠT 14/09 09:04** *"ổn định rồi"*; 0.4.6 cài 14/09 09:22: chữ có hộp nền + ☠️ thư mục ảnh mặc định dời ra `%LOCALAPPDATA%` (cài đè NSIS xoá thư mục cài = mất ảnh, sổ lỗi #11 panel) — chờ anh test; **0.4.8 (14/09 10:19)** ảnh ghim rê chuột hiện 3 nút vẽ, bấm là vào vẽ (anh: "bấm chuột chọn vào thì không được") |
| ~~Tauri 0.5.0~~ | `Build and UI Design/AiO Shotandsave Tauri/` — **anh xoá 10/09** | **ĐÃ BỎ 10/09.** Từng đo máy công ty: grab 2 màn 141–152ms, exe 11,7 MB, bộ cài 3,0 MB — số giữ lại để sau này có cân nhắc lại thì không đo từ đầu. Trước khi xoá còn 32 file chưa commit; lịch sử vẫn trong git (commit `9dcaf5c`, `6e3242b`) |

Chuỗi 10 bản vá kéo-chọn trong ngày 31/08 (0.3.9 → 0.4.2) = một bệnh kiến trúc:
2 tiến trình Electron + IPC 16ms + grab 880ms chặn main. **Sổ lỗi tái diễn** (9
lỗi, gốc đã đo, chốt chặn) ở `AiO Shotandsave/CLAUDE.md` — đọc trước khi đụng
vào kéo-chọn ở bất kỳ bản nào.

☠️ Máy mới: `npm install` trước (node_modules không qua git); chạy `.ps1` phải
`-ExecutionPolicy Bypass`.

---

## 6. Website — `Website/AiO WebDessign/`

Next.js + Drizzle + Cloudflare Worker, deploy Vercel `ai-o-studio.vercel.app`.
Xây mới 100% ngày 17/08 (hero tự diễn theo playhead, 8 plugin demo tương tác,
card Pro đủ 8 tên). Bản Gemini cũ: tag `ban-cu-17-08`, **CẤM tái dùng** (có
test chốt chặn). Commit web đã lên `origin/main` 24/08 → **live có phải bản mới
chưa thì chưa đo** — kiểm bằng cách mở trang thật trước khi nói.
`.env.local` **CẤM push**. Luật + trạng thái chi tiết: `CLAUDE.md` + `PROGRESS.md`
trong thư mục đó. Bẫy đo web tĩnh: Chrome headless ép viewport ≥500px; `npx
serve out` giữ thư mục làm `next build` in "✓" mà không ghi được bản mới.

**Web bán Shot & Save** — `Website/AiO ShotSave Web/` (index.html + legal.html, tĩnh, không build) → Vercel dự án **`aio-shotsave`**
(tài khoản `hadangtien0702-8981`), **https://aio-shotsave.vercel.app**, lên lần đầu 23/09 bằng CLI (`vercel deploy --prod --yes`
trong thư mục đó). **Nối GitHub 23/09 11:2x** (anh: *"nối GitHub với Vercel luôn"*): push `main` → tự deploy; Root Directory
`Website/AiO ShotSave Web`; bỏ qua build khi thư mục web không đổi (`git diff --quiet HEAD^ HEAD -- .`). Cài bằng `vercel git
connect <url repo>` (CLI không tự thấy .git ở thư mục con) + `vercel api PATCH /v9/projects/...` — ☠️ connector Vercel MCP trong
Claude đăng nhập TÀI KHOẢN KHÁC (403 scope), đừng dùng nó cho dự án này. ☠️ **`vercel.json` ở GỐC repo là của web AiO Studio**
(build Next.js `Website/AiO WebDessign`) và Vercel đem nó áp cho dự án có Root Directory con → lần push đầu ERROR `cd: Website/AiO
WebDessign: No such file`. Sửa: `vercel.json` RIÊNG trong thư mục web (install/build = echo, output = `.`). Đừng sửa file gốc.
Thử thật 23/09: push ngoài thư mục web → CANCELED (đúng); push có đổi web → READY, md5 live = local. ☠️ `vercel link` tự tạo
`.env.local` chứa token OIDC, mà danh sách bỏ qua mặc định của Vercel KHÔNG có `.env*` → đã chặn bằng `.vercelignore`
(`.env*`, `.vercel`, 2 file ignore); đo live: `/.env.local` 404. Sau mỗi deploy: curl md5 live = **`git show HEAD:"Website/AiO ShotSave Web/index.html" | md5sum`** — ☠️ KHÔNG so với file trong máy: trên Windows file máy là CRLF, git/Vercel là LF → md5 luôn lệch dù web đúng (vấp 27/09: tưởng deploy hỏng, thật ra khớp từng byte với git).

**Thư cảm ơn khách mua Shot & Save** (25/09, anh chốt kiểu thẻ Apple): `Website/AiO ShotSave Web/email/cam-on-mua.{vi,en}.html`
(ô trống `{{license_key}}`…`{{asset_base}}`), ảnh PNG @2x `img/email/` (Gmail bỏ SVG); `email/` nằm trong `.vercelignore`.
☠️ Polar tự gửi thư mã bằng mẫu CỦA POLAR — mẫu này chỉ tới tay khách khi có webhook Polar → dịch vụ gửi thư (chưa làm, chưa
gật). ☠️ Phiên Claude trên ĐÁM MÂY chỉ nhận connector (Gmail…) lúc MỞ phiên: anh đăng nhập giữa chừng vẫn báo "sign in again" →
mở phiên mới. Gmail connector chỉ tạo THƯ NHÁP, không tự gửi.

---

## 7. Làm việc 3 máy — chốt 31/08, thêm Mac 21/09

| Máy | Repo |
|---|---|
| Công ty (DRT-G21) | `E:\2026\Production\AiO Studio` |
| Nhà (user `hadan`) | `D:\Production\AiO Studio` |
| **Nhà — MAC = MÁY LÀM VIỆC CHÍNH từ 03/10** (anh: *"từ nay mac sẽ là máy làm việc chính của anh"*, *"máy mac ở nhà làm việc như ở công ty"*; chưa nêu lý do). Intel x86_64, macOS 26.3, Premiere Pro (Beta) 26.5 | `~/Production/AiO Studio` (clone 01/10, đo 03/10: 921/921 file). Nhánh làm việc **`mac`** = `may-cong-ty` (Shot & Save 0.8.0 chưa lên `main`) + bản Mac 11 panel |

- Làm xong ở máy nào → **pull rồi push** ngay (`/xong` bước 2c).
- **Mac không có PowerShell** → dùng `bash scripts/dong-bo-mac.sh` (cùng 5 bước: pull · đếm file · node_modules · /xong+/batdau · nhận brain) và `--day-brain` thay cho `dong-bo-brain.ps1 -Day`. Viết + thử 21/09 **trên Windows** (thư mục HOME giả, brain đẩy vào bản sao cục bộ); 03/10 các bước của nó (pull, lệnh, brain, hook) đã có kết quả trên Mac thật, `--day-brain` CHƯA chạy trên Mac.
- **Mac (đo 03/10):** FFmpeg / ffprobe / yt-dlp / qjs / whisper-cli + 2 model (4,4 GB) bản Mac KHÔNG nằm trong `bin/` của repo hay PATH mà ở **kho chung `~/Library/Application Support/AiO-Studio/`** (`bin/mac/`, `whisper/`); `bin/` trong repo là `.exe` Windows, Mac không cần. 11 panel trong Premiere là **bản chép** ở `~/Library/Application Support/Adobe/CEP/extensions`. 6 panel có build: `npm run build` chạy được trên Mac (4–5 s/panel); Asset Manager + Power Bins bản đang cài là `build:release`. CHƯA có Codex CLI trên Mac. ☠️ FFmpeg ở kho chung Mac là bản **GPL** (evermeet 9.0.2, `--enable-gpl`): tự dùng được, KHÔNG đóng gói bán (luật LGPL 29/07).
- **Cài panel trên Mac: `node scripts/cai-panel-mac.mjs <tên | tat-ca>`** (viết 03/10, thay `sign-install.ps1`; Mac không ký `.zxp`). Tự build, dựng đúng bố cục, kiểm manifest trỏ tới file có thật, **đổi chỗ bản đang cài sang `~/Library/Application Support/AiO-Studio/ban-cai-truoc/<id>` (không xoá)**, chép bản mới, so lại từng file. `--thu` = chỉ so bản sẽ cài với bản đang cài, không ghi gì (dùng nó TRƯỚC khi cài để biết có đè mất gì không). `--dich <thư mục>` = cài vào chỗ khác để thử. Đo 03/10: thử 11/11 panel 0 file lệch nội dung; đối chứng cố ý làm hỏng bắt đúng 1 lệch / 1 thiếu / 2 thừa; cài thật 11/11, 101/101 file khớp. **Đo trong Premiere Beta 26.5 trên Mac 04/10 00:26** (anh mở panel tổng, em bấm từng thẻ qua cổng gỡ lỗi bằng `scripts/do-panel-qua-hub.mjs`, mở xong đo rồi đóng lại): **10/10 panel mở từ thẻ trong khoảng 1,0–1,3 giây**, giao diện dựng đủ, cầu nối host trả `26.5.0` trong 1–54 ms, hàm host của từng panel đã nạp; panel tổng hiện 12 thẻ, 0 nhãn "Chưa cài", số phiên bản 10/10 khớp manifest. CHƯA đo việc thật (cắt, nghe lời, tải video) sau lần cài này; nội dung thì y hệt bản đã đo 30/09. ☠️ Build làm đổi `tsconfig.tsbuildinfo` của Asset Manager + Power Bins (file bị git theo dõi): `git checkout --` trả lại, đừng commit.
- ☠️ **Bản đang cài có thể MỚI hơn repo.** 03/10: bản Mac của 11 panel (làm 30/09, 82 file) chỉ còn trong bản sao ở Thùng rác + trong panel đang cài; thư mục clone sạch không có, số phiên bản thì y hệt (11/11) nên so số là không thấy. Trước khi cài lại panel trên bất kỳ máy nào: so NỘI DUNG bản đang cài với repo (bỏ lệch CRLF), không so số phiên bản. Đã lấy lại vào nhánh `mac` (`8ccbcb6`); kiểm: 11/11 panel đang cài khớp repo, 6/6 panel build lại ra đúng từng byte.
- Ngồi máy kia → chạy `scripts\dong-bo-may.ps1` TRƯỚC (pull · đếm file so
  GitHub · soi node_modules/FFmpeg; `-CaiThem` = tự npm install). 31/08: 636/636.
- Máy công ty push bị 403 (gh CLI đè credential `Vincentnguyen1809`):
  `git -c credential.helper= -c credential.helper=manager push`. Sửa gốc
  (`~/.gitconfig`) cần anh gật — chưa làm. (01/10: `git push origin HEAD:main` thường chạy được 2 lần liền, không 403.
  Cứ thử lệnh thường trước, 403 mới dùng lệnh né.)
- **Đẩy RIÊNG việc web khi `main` trên máy đang giữ commit chưa được push** (luật 01/10: Shot & Save test xong hết mới
  push). KHÔNG `git push` từ `main`, nó kéo theo cả commit đang chờ. Cách đã chạy 3 lần ngày 01/10 (`ce061fd`, `12609a2`,
  `fe54c7d`): `git worktree add --detach <thư mục nháp> origin/main` → sửa/chép file trong đó → `git commit -- <đúng file>`
  → `git push origin HEAD:main` → về thư mục chính `git merge origin/main` → `git worktree remove`. Việc web ghi sổ ở
  `PROGRESS.md` gốc (file này giống nhau giữa máy và GitHub nên gộp không đụng nhau); `CLAUDE.md` gốc thì KHÁC (có dòng
  0.8.0 chưa push) nên phần sửa `CLAUDE.md` chỉ commit trên máy, lên GitHub cùng lượt push 0.8.0.
- `/xong` bản gốc nằm **trong repo** `.claude/commands/xong.md`; script đồng bộ
  chép về `~/.claude/commands`. Sửa bản trong repo, đừng sửa bản `~/.claude`.

**Cố ý KHÔNG qua git — pull về không có là ĐÚNG:** bộ cài `Release/**/*.exe|zip|rar`
(46–93 MB/bản) · `bin/` FFmpeg (~219 MB × 4) · `node_modules/` · `dist/` của 5
panel có build (Asset Manager, Autocut, Power Bins, Transcripts, Shot & Save) ·
`Test Media/` (1,33 GB) · `.env.local`. `dist/` của panel KHÔNG build (Podcast,
Re-Frames, Guide Frame, WELCOME) là mã viết tay → **trong** git.

---

## 8. Việc đang CHỜ — đọc trước khi nhận việc mới

| Việc | App | Vì sao chưa |
|---|---|---|
| ~~Cài đè Electron + chép 75 ảnh rồi gỡ Tauri~~ **XONG 14/09** (75/75 ảnh sang `Pictures/AiO Shot & Save`, Tauri đã gỡ, 0.4.4.0 chạy, anh chấm ĐẠT) | Shot & Save | — |
| Run-log không ghi dòng nào từ tiến trình 09:03 ngày 14/09 dù ảnh vẫn lưu (file ghi được, `ghiLog` nuốt lỗi) | Shot & Save | Chưa đo được gốc; xem `[CHỜ ĐO]` đầu PROGRESS.md panel |
| Cài thử **máy sạch** | Autocut, Shot & Save, Asset Manager (bộ cài 14/09) | Chỉ anh làm được |
| Khoá gói Free/Pro (1/7) | Cả bộ | Chưa làm; ngưng build tool từ 13/08 |
| `SETUP.exe` gộp + panel chạy thật bằng kho FFmpeg chung | Cả bộ | Chưa làm |
| Bộ cài cài font (Montserrat ×3 + Bangers) | Transcripts | Caption MOGRT cần font máy khách |
| Anh dùng caption hiệu ứng trên bài thật | Transcripts | Mới đo sequence test 20s |
| Bump manifest Podcast 0.1.0 → 0.6.6 | Podcast | Chờ anh gật (đóng băng build) |
| Mic rời bleed nặng (bộ Will–Trọng, 8 clip stereo `podcast-nghe-kiem-2`) | Podcast | Chờ tai anh |
| Tốc độ 19 phút/giờ (mục tiêu <5) | Autocut | 83% ở `overwriteClip` của Adobe; hướng: xuất FCPXML |
| Đo não hỏi–đáp trên podcast tiếng Việt thật (việc cũ của Cut Short, nay thuộc Short Viral) | Auto Short Viral | Gộp 21/09 |
| **AI offline bước 1** (chia theo chủ đề bằng độ dính từ vựng · tiêu đề cụm từ khoá · chấm đoạn đáng làm short) | Auto Short Viral | Anh chốt 20/09 chạy offline không Ollama; chờ anh gật mới viết |
| Dọn 3 sequence thử trong `Test3_1`: `PodTest Nguon – Q1…`, `– Q2…`, `PodTest 20 phut… – Q5+Q6+Q7` (giữ `PodTest 20 phut - thu Short Viral`) | Auto Short Viral | Chờ anh gật |
| **Bản Mac** cho Short Viral: panel CEP chạy được trên Mac nhưng whisper/FFmpeg và 3 script `.ps1` mới chỉ có bản Windows | Auto Short Viral | Luật 31/08 "phải chạy Win + Mac" CHƯA đạt — nói rõ để không tưởng đã xong |
| Độ chính xác nghe lời: **chưa có con số WER cho bất kỳ thứ tiếng nào** (thiếu bản chuẩn do tai anh duyệt); tên riêng tiếng Việt bị chép sai | Cả bộ (whisper) | Cần anh duyệt 10 phút làm bản chuẩn; hướng rẻ nhất là bảng sửa tên riêng sau khi nghe (mồi từ vựng đã đo 2 lần: vô tác dụng) |
| **Panel tổng "AiO Studio" 2.0.0** — ĐÃ VIẾT + nối vào Premiere máy công ty 22/09 (thiết kế: 2 dạng + Option 2, bản vẽ trang "Bản 3" https://claude.ai/artifact/GmdDjRe5oRJuNBr3uAbubN) | Panel tổng | ✅ 25/09 đo thật qua cổng 8101: 10/10 tool mở; 2.1.0 đồng bộ UI web + animation vào. Còn: anh dùng thật; chuông/tài khoản mới là nút "sắp có"; Shot & Save khi app chưa chạy chưa đo; `git add` thư mục (đang untracked); đổi tên thư mục `AiO WELCOME` chưa chốt; dọn `AiO WELCOME Page` (bản cũ); Podcast hiện 0.1.0 tới khi bump |
| **Đổi AiO Music thành "Keynote"** — đổi tên + định hình lại sản phẩm (anh giao 21/09 16:1x: *"làm lại thằng AiO Music thành Keynote… đổi tên đổi định hình sản phẩm luôn"*) | Music | Chưa làm: chờ anh nói Keynote làm việc gì cho editor. Khi làm: luật 4h (đổi tên ở mọi ngăn, `git mv`) + luật 2d (khảo sát app cùng loại trước) |
| `Build and UI Design/AiO Map/` (tạo 21/09 08:27, 52 file, có `codex-preview/` → có vẻ do Codex dựng; bản đồ Mỹ + dữ liệu phỏng vấn MẪU) chưa có trong bảng mục 2, chưa có ID/cổng | ? | Đã đưa lên git 21/09 theo lệnh "push code"; chờ anh nói nó là gì |
| Folder app cũ lệch chuẩn 4h: Design System thiếu Video Download / Shotandsave / Auto Organize Folder · `AiO Power Bins` + `AiO Transcripts` trong Design System rỗng (0 file, máy nhà không có) · tên lệch `AiO Mussic`↔`AiO Music`, `AiO WELCOME Page`↔`AiO WELCOME` · bảng mục 2 ghi WELCOME 8087 nhưng `.debug` là **8095** (trùng `xem-bo.mjs`) | Cả bộ | 18/09 anh chọn "chỉ Short Viral lúc này" — đo xong, chưa sửa |
| `.p12` + mật khẩu trong repo public | Cả bộ | Anh chốt "tính sau" |
| **Quyết CEP → UXP** (spike đo chi phí port 1 panel nhỏ) | Cả bộ | Adobe ghi sẽ gỡ CEP; ngày cắt chưa rõ (xem nghiên cứu 10/09) |
| 7 câu hỏi giá/định vị từ nghiên cứu thị trường 10/09 (mục 11) | Cả bộ | Chờ anh chốt |
| ~~`PROGRESS.md` gốc repo~~ **XONG 21/09** (lập cùng lúc lắp cửa vào brain) | — | — |
| Lắp hook `SessionStart` ở **máy nhà** (script chép được qua git, hook thì không) | Cả bộ | Chỉ anh làm được — xem `scripts/batdau/README.md` |
| Giai đoạn B: cắt `~/.claude/CLAUDE.md` 1.145 → ~150 dòng, 62 bài học thành skill | Cả bộ | Anh chốt 21/09, chờ đo giai đoạn A có ăn không |
| `worktrees/` 652 file/36,8 MB từ 01/09 nhân đôi 13 `CLAUDE.md` · 2 slug lạc của Autocut · hook `Stop` không canh `public/` nên Thinksmart không bị chặn | Cả bộ | Đo 21/09, chưa dọn |
| ☠️ `~/.claude/settings.json` có token n8n JWT + Google `client_secret` trong `permissions.allow` | Cả bộ | Chờ anh quyết |
| Harness kéo-chọn (sổ lỗi #8) cho 0.5.7 — 8 tay nắm co giãn khung Gemini thêm, CHƯA ai chạy | Shot & Save | Harness bật cửa sổ chụp lên màn anh (luật #12) — cần anh cho giờ |
| Anh chụp 1 tấm sau khi mở app 0.6.5 → khay đúng 1 ô (xác nhận hết lỗi "ảnh hiện 2 lần") · anh dùng thử làm mờ / V / chỉnh khung trên máy thật | Shot & Save | Tính năng đã lên web (27/09) nhưng anh chưa dùng — luật "dùng trước khi bán" |
| Kích thước khối làm mờ 8–15 px (chữ nhỏ có thể khôi phục) — giữ hay tăng ≥ 20 px / tô kín | Shot & Save | Chờ anh quyết |
| Xoá 7 bộ cài cũ 0.5.8→0.6.4 (~620 MB) trong `Release/AiO Shotandsave/win/`, giữ 0.6.5 | Shot & Save | Chờ anh gật (xoá = không đảo ngược) |
| Máy công ty `Release/AiO Shotandsave/win/` đang giữ 6 bộ cài cũ (0.5.5 · 0.6.6 · 0.6.9 · 0.7.1 · 0.7.2 · 0.7.3, ~84 MB/bản) cạnh 0.7.4 — luật Release chỉ giữ bản mới nhất | Shot & Save | Chờ anh gật xoá (đo 28/09 16:0x) |
| ~~Anh cài 0.7.4 và thử quay 3 giây~~ **XONG 29/09**: anh quay nhiều dải trên máy thật (bản nguồn), kéo cả dải *"khá mượt"*. ☠️ CÒN: **khung 1 trên video có thể ĐEN** (ảnh khay 10:41: Storyboard 04 SHOT 01 đen, dải 03 bắt đầu từ SHOT 02) — chưa đo | Shot & Save | Cần anh quay thử trên video YouTube khi em được chạy app thật |
| ~~Web chưa cập nhật 0.7.2–0.7.4~~ **XONG 29/09** (section Storyboard `8dda50f`, thẻ Lấy chữ `729566a`, sửa phim `6214188`) · **[CHỜ ANH] chọn cách trình bày 11 tính năng trên web**: nháp 2 hướng `Website/Nhap web ShotSave/nhap-11-tinh-nang.html` (A: danh sách + màn phim lớn, em nghiêng A · B: 6 ô phim) | Shot & Save | Anh: 11 thẻ chữ *"vô duyên, không đủ thuyết phục"*, giữ đủ 11, *"chưa nghĩ ra trình bày kiểu gì"* |
| ~~Đóng gói bộ cài 0.7.9~~ **XONG 30/09 12:50**: 96,1 MB (+7,7 MB bộ đọc chữ), cài máy công ty (ảnh 413/413, Storyboard 61/61 còn nguyên). CÒN: anh bấm phím 5 trên bản cài · đọc chữ trên Mac + máy không SIMD chưa đo | Shot & Save | Chờ anh thử |
| Nút bên màn Cài đặt hiện font **Arial** (button không kế thừa font), chữ còn lại Inter — đổi cả Cài đặt + Storyboard sang Inter không | Shot & Save | Chờ anh quyết; cửa sổ Storyboard đang giữ y hệt Cài đặt |
| **Quay video 0.8.0 (01/10)**: anh bấm thật (khoanh vùng → R → Dừng → kéo hàng video vào Premiere / Zalo) · **Premiere có nhận file MP4 phân mảnh không** (file mẫu `Build and UI Design/AiO Shotandsave/.selftest/thu-quay/mau-quay-thu-720p-co-tieng.mp4`; không nhận thì phải thêm bước đóng lại file khi bấm Dừng) · quay trên video YouTube có đen không · máy yếu / Mac chưa đo · chưa đưa lên web (luật 28/09: mỗi bản mới lên web, làm sau khi anh dùng thử) · GIF + tiếng micro: anh chốt làm sau | Shot & Save | Chờ anh thử |
| **Khay tự thu về nút tròn (01/10 16:07, đã nạp vào app đang cài, vẫn 0.8.0)**: anh CHƯA thấy nó chạy lần nào trên màn thật (run-log từ 16:07 tới 19:07 không có lượt chụp). Cần anh: chụp 1 tấm → để chuột ngoài khay 5 giây → bấm nút tròn → kéo khay sang màn phụ rồi bấm "–". Chưa đo: độ mượt, nháy hình lúc đổi bản vẽ ↔ cửa sổ thật, màn 125%, nút tròn đè lên video có làm video đen không, RAM 2 tiến trình mới, `test:khay` + `test:co-khay` (bật cửa sổ lên màn). Chưa làm: kiểu C, bản Mac | Shot & Save | Chờ anh thử; chi tiết đầu `PROGRESS.md` của app |
| **Cửa sổ Khay gộp 2 thẻ Storyboard + Video (bản xem trước 13:59)**: anh mở thật 15:18 không lỗi, CHƯA chốt giữ. Trên Khay ảnh vẫn 2 nút. Hướng "một khay 3 thẻ" (`ROADMAP.md` 0b/0c) chưa chốt · `test:quayapp` chưa chạy lại sau khi gộp | Shot & Save | Chờ anh quyết |
| Việc Shot & Save 01/10 → 06/10 (nút tròn, khay gộp, đánh số, bút, chụp cuộn, GIF, 2 lượt ECC) nằm ở nhánh **`may-cong-ty`** trên GitHub, CHƯA gộp `main`, CHƯA đóng gói (bộ cài 0.8.0 trong Release là bản 01/10 19:22), CHƯA tăng số phiên bản. Anh dặn 06/10: *"còn bản cài thì khi nào anh bảo mới xuất ra bản mới"* | Shot & Save | Chờ anh báo test xong |
| **Shot & Save 06/10, chờ anh thử trên app thật:** chụp cuộn lại bài Facebook có video (bản 13:10 + 14:59 chưa có lượt thật) · bấm GIF rồi kéo vào Zalo / Messenger · bút 7, dạ quang 8, số 6. **Chờ anh quyết:** chụp cuộn mất dấu giữa chừng thì dừng sạch (hiện nay) hay nối tiếp có vết nối · các số em tự chọn cho GIF (10 hình/giây, rộng 800 px, trần 60 giây) | Shot & Save | Chờ anh |
| **Web Shot & Save trên điện thoại "không mượt bằng desktop"** (anh 06/10): đã sửa rạp không dựng lại cảnh khi thanh địa chỉ ẩn/hiện, bỏ lớp mờ thanh trên, 9 điểm theo ECC (live `39d61cd`). CHƯA có số đo độ mượt trên máy thật (nhịp khung dưới giả lập và WebKit chạy ngầm đều là thước hỏng). CHƯA sửa 3 chỗ vẽ nặng mỗi khung (bóng `200vmax` của khung chọn ở 6 cảnh, ảnh dài cảnh Chụp cuộn đổi `height`, video giả ghi `left`) | Web | Chờ anh nói iPhone hay Android + chỗ nào chưa mượt |
| **Polar:** mã bản quyền còn "hết hạn 1 năm" + tên benefit còn "+ 1 year updates" (giá đã $14.99 từ 06/10); tổ chức còn "test mode" nên nút Pay khoá | Shot & Save | Chờ anh gật sửa 2 mục đầu; xác minh tài khoản là việc của anh |
| **Trang bộ tool Premiere đã LIVE 01/10 19:3x ở `aio-shotsave.vercel.app/premiere/`** nhưng: (1) ô email "Báo tôi khi mở bán" CHƯA lưu gì, khách bấm gửi thấy câu "Bản nháp: chưa nối gửi, chưa lưu gì cả" → email khách để lại là mất; (2) trang Shot & Save `/` chưa có link sang `/premiere/`, chưa có trang chủ chung; (3) trên live chưa đo: điện thoại thật, Safari, tiếng Việt, nền sáng, phím J K L, kéo ngang | Web | Chờ anh chốt lưu email vào đâu + có gắn link từ trang Shot & Save không |
| Tiến trình chính Shot & Save 0.7.9 giữ **1.168 MB RAM** sau ~21 giờ chạy (đo 01/10 09:36 máy công ty, bình thường các tiến trình khác 43–300 MB) — chưa tìm gốc (nghi ảnh gốc BGRA 4K ~33 MB/màn giữ lại sau mỗi lần chụp) | Shot & Save | Đã lập việc riêng (chip "Đo vì sao Shot & Save ăn 1,1 GB RAM"), chưa ai làm |
| Máy công ty: thư mục chính `E:\2026\Production\AiO Studio` **đã khớp GitHub (đo 30/09 12:5x: chậm 0 commit)**, vẫn còn file sửa dở của phiên Guide Frame (1 dòng CLAUDE.md, TOOL_VERSION_TRACKER, 7 file Guide Frame) | Cả bộ | Việc của phiên Guide Frame, đừng commit giùm |
| Thư mục làm việc của Gemini (git worktree nhánh `gemini`) mới có ở **máy nhà** — máy công ty chưa tạo | Shot & Save | Tạo khi ngồi máy công ty: `git worktree add "E:\2026\Production\AiO Studio - Gemini" gemini` |
| Luật `AGENTS.md` chưa thử lần nào — lượt Gemini bàn giao đầu tiên phải soát xem có theo đúng không | Cả bộ | Chờ lượt Gemini làm đầu tiên |
| **Rà bản Gemini: `ROADMAP.md` Shot & Save** (nhánh `gemini` `879fe5c`, 27/09 21:17, CHƯA gộp `main`; chỉ tài liệu, 0 dòng mã). Góp ý Claude đọc 27/09: (1) Storyboard Strip đáng làm nhất — làm **1 bố cục** trước, không làm 3 cùng lúc; (2) đánh số bước 1-2-3 rẻ, làm sau; (3) bảng màu được; (4) khung an toàn MXH **trùng AiO Guide Frame** → dùng chung `safe-zones.json`, không làm bộ số thứ hai; (5) "đóng dấu tên sequence" **không làm được** (app ngoài Premiere) → chỉ ngày giờ. Viện dẫn SAI: "Luật 01 AGENTS.md cấm emoji UI" không tồn tại (AGENTS chỉ cấm emoji trong nhật ký); 4/5 mã màu "token" (`#090a0d #0d0e12 #eeeef2 #6f7185`) không có trong `tokens.css` nào, chỉ `#f86820` thật | Shot & Save | Anh bảo "rà bản Gemini" → ghi góp ý vào PROGRESS rồi mới gộp; Gemini sửa roadmap trước khi code Storyboard (Gemini định làm 28/09) |
| Máy nhà thiếu `bin/` FFmpeg/whisper/yt-dlp: Video Download chưa cài, tool xử lý âm thanh/video lỗi khi chạy việc thật; Music đang dùng tạm ffmpeg-static **GPL** (không đóng gói) | Cả bộ | Chép `bin/` từ máy công ty hoặc anh gật tải (~2 GB) |
| Music: anh thử kéo file / kéo clip từ timeline vào ô (đọc `%APPDATA%\AiOMusic\tha-vao.log`), bấm clip, nghe kiểm key; panel có mở vào màn Key không | Music | Chờ anh thử |
| 3 script cài (Re-Frames, Guide Frame, Podcast) không gỡ junction chết trước khi chép | 3 panel | Chưa sửa (anh chưa gật) |
| ☠️ **Web `/premiere/`: CUỘN Ở SÂN KHẤU KHÓ KIỂM SOÁT** (anh 01/10 23:5x: *"phần scroll ở các section chính đang bị lỗi… scroll rất khó để kiểm soát các animation"*). Hiện animation của từng cảnh BUỘC vào vị trí cuộn (scrub) + trang tự trôi tới hết cảnh (snap, sau khi làm chậm 23:45 có thể trôi 6–8 s) → người xem lăn chuột là mất lái. Hướng sửa em đề xuất, CHƯA làm, CHƯA được anh gật: **tách animation khỏi cuộn** như 3 hình phần Vì sao (anh ưng): lăn 1 nấc = sang 1 cảnh (trượt nhanh ~0,6 s), cảnh vào giữa thì TỰ diễn theo thời gian (6–7 s) rồi lặp lại, cuộn không tua animation nữa. Phương án lùi: trả thông số cuộn về bản `19a3f39` (trước khi làm chậm). LÀM VIỆC NÀY TRƯỚC khi làm tiếp 10 cảnh | Web | Dừng theo lời anh *"mai làm tiếp"*; chờ anh chọn hướng |
| **Web `/premiere/`: làm nốt 10 cảnh theo khung `pm-`** (Transcripts, Short Viral, Re-Frames, Guide Frame, Video Download, Asset Manager, Power Bins, Organize, Keynote, Hub); xong cảnh nào push cảnh đó (anh dặn 01/10). Mẫu: cảnh 01 + 02 trong `premiere/index.html`; công cụ chụp `Website/Nhap web ShotSave/cong-cu/` | Web | Anh chưa trả lời "kiểu Podcast/Auto Cut mới đúng ý chưa"; dừng 01/10 23:4x theo lời anh *"mai làm tiếp"* |
| Web `/premiere/`: anh báo *"thanh menu bị lỗi, light dark cũng đang bị lỗi"* — chụp 4 tổ hợp sáng/tối × EN/VI ở đầu trang, giữa sân khấu, phần Vì sao KHÔNG thấy vỡ | Web | Cần anh chụp màn hình đúng chỗ lỗi |
| ~~Script cài panel cho Mac~~ **XONG 03/10** (`scripts/cai-panel-mac.mjs`, đã cài 11/11). 04/10 00:26 đo trong Premiere: 10/10 panel mở từ panel tổng và trả lời đúng. CÒN: anh dùng một panel trên bài thật trên Mac (cắt / phụ đề / tải) vì lần đo này mới tới mức mở panel + cầu nối host | Cả bộ (Mac) | Chờ anh |
| Nhánh `mac` (bản Mac 11 panel + việc dở Guide Frame 26/09) chưa gộp `main`; chưa tăng số phiên bản; nhánh Windows chưa kiểm lại; việc dở Guide Frame trên máy công ty còn nguyên chưa commit ở đó (gộp sau sẽ trùng) | Cả bộ | Chờ anh quyết lúc nào gộp |
| Mac thiếu: Codex CLI (ghế soát chéo) · plugin ECC (máy công ty cài 02/10, nguồn GitHub bên thứ ba, anh quyết có cài không) · bản Mac của Shot & Save 0.8.0 (đang cài 0.7.9; bộ cài Mac 0.7.9 đã vào `Release/AiO Shotandsave/mac/`; Electron 43.4.1 đã có để chạy từ mã nguồn, CHƯA mở thử) · FFmpeg LGPL bản Mac (kho chung đang là GPL) · bài kiểm Short Viral cần file ở `E:\` · bài kiểm Transcripts lỗi `--jsx` | Mac | Chờ anh |
| 19 mục cấu hình của máy công ty KHÔNG chép sang thư mục chính (lớp bảo vệ chặn chép file bí mật vào repo public): 2 `.env.local`, 2 `.vercel`, `.claude` gốc (3 file) + 5 panel, 6 thư mục `certs` (chứng chỉ ký Windows), `Anh chup` 58 MB. Để nguyên ở `~/Downloads/Production/AiO Studio` (66 MB, 201 file) | Mac | Anh cần thì kéo sang, không cần thì bỏ. Mac không ký `.zxp` nên không cần `certs` |
| ~~Dọn 2 bản cũ trên Mac~~ **03/10: đã đưa vào Thùng rác** (không xoá): bản AiO cũ ở Downloads 20 GB + thư mục Gemini cũ 984 MB + bản dự phòng + 2 bộ cài Mac 0.5.5. Trước đó đã so từng file bản cũ với thư mục chính (1.389 file: 882 giống, 215 chỉ lệch xuống dòng, 69 khác = thư mục chính mới hơn, 223 không có = 19 mục ở dòng trên + 11 bộ cài cũ + log) và cứu 2 thứ chỉ có trong `.git` bản cũ thành nhánh `backup-cong-ty-26-09` + `cat-tam-cong-ty-29-09` (chỉ trên máy, chưa đẩy) | Mac | **Anh bấm Empty Trash** để lấy lại ~59 GB (Thùng rác còn bản tải 30/09 38 GB; đã lấy hết thứ chỉ có ở đó: mã Mac, 2 bộ cài Mac 0.7.9, 4 file thử, 6 file portfolio) |
| Thư mục làm việc của Gemini trên Mac chưa tạo (bản cũ là bản chép từ Windows, trỏ về `E:\`, đã vào Thùng rác; 0 file sửa dở). Khi anh dùng Gemini trên Mac: `git worktree add "$HOME/Production/AiO Studio - Gemini" gemini` | Shot & Save | Chờ lượt Gemini đầu tiên trên Mac |
| Web `/premiere/` còn chỗ chưa đúng sự thật / chưa soát: tiêu đề đầu trang diễn cắt "um/uh" (Auto Cut cắt khoảng lặng, không cắt từ đệm) · hình "Install once" vẽ MỘT bộ cài chung (chưa có `SETUP.exe` gộp) · icon Short Viral là điện thoại dọc · cảnh 11 Keynote diễn marker theo nhịp (tính năng chưa định nghĩa) · câu chữ lưới thẻ (bản giảm chuyển động) · chưa đo Safari/iPhone | Web | Chờ anh quyết từng mục |

---

## 9. Bản đồ thư mục (sau khi tổ chức lại 14/08)

```
AiO Studio\
├── Build and UI Design\   11 panel + AiO Shotandsave + design-system
│                          + AiO Design System (file anh chốt) + AiO Git Public
├── Website\AiO WebDessign\
├── Marketing\AiO MVP and Plan Marketing\   PIPELINE.md (còn thiếu gì để bán)
│                          · TOOL_VERSION_TRACKER.md · MASTER_PLAN · BANG_GIA
├── Release\               <Tên app>/win|mac — chỉ bản mới nhất (README.md trong đó)
├── Test Media\file pr for test\   1,33 GB, dùng chung (project Premiere sẽ hỏi relink)
├── Research and Architecture\
├── scripts\               dong-bo-may.ps1 · brain-map\ (bản đồ brain, cổng 8097)
└── CLAUDE.md              ← file này
```

Còn thiếu gì để bán, xếp theo mức chặn: `Marketing/.../PIPELINE.md` mục 4.
