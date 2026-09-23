# AiO Studio — TOÀN BỘ kiến thức về dự án, một chỗ duy nhất

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
| 5 | WELCOME | 1.5.0 | `com.aio.welcome` · 8087 | 🟢 | Panel chào mừng, không build |
| 6 | Auto Re-Frames | 0.6.0 | `com.aiostudio.reframe` · 8092 | 🟡 Đang làm | Dọc 9:16 Sensei bám chủ thể; khoanh I/O là tracking đúng đoạn (27/08). Không build |
| 7 | Auto Guideline Frame | 0.3.0 | `com.aiostudio.guideframe` · 8096 | ✅ **Anh test ĐẠT 21/09** (*"anh test thấy okie rồi đó em"*) | Safe zone 10 nền tảng / 53 vùng; đặt 0,74s / gỡ 0,13s trên sequence 4K 306 clip. Không build. Chưa có bộ cài |
| 8 | Auto Podcast | UI 0.6.6 · host 0.4.9 (☠️ manifest **0.1.0** chưa bump — chờ anh gật) | `com.aiostudio.podcast` · 8094 | 🟢 Chạy được | 25/08 *"cắt đúng người"* ĐÃ GIẢI bằng tai anh: liệu 40 phút 2 người + wide, tiếng cam làm mic, 411 nhát. **Chưa đo**: >2 người, mic rời bleed nặng, >1 giờ. Ngưỡng cắt KHÔNG đụng |
| 9 | Music & SFX (`AiO Mussic`) | 1.0.0 | `com.aiostudio.music` · 8097 | 🟡 | Có UI, chưa nối việc thật |
| 10 | ~~Auto Cut Short~~ | — | ~~`com.aiostudio.short` · 8093~~ — **trả lại** | ⛔ **ĐÃ GỘP vào Auto Short Viral (dòng 14) 21/09** | Anh: *"2 cái này là một và giữ cái tên Auto Short Viral là chính"* — đè quyết định 18/09 "giữ riêng". Thư mục `AiO Auto Cut Short` (Build, Design System rỗng, Release chỉ có file giữ chỗ) đã bỏ; 2 file ghi chép cũ (4 quyết định 30/07, số đo 31/07: 803 câu → 21 câu hỏi → 8 đoạn) chuyển sang `AiO Auto Short Viral/tai-lieu/cut-short-*-cu.md`. Não hỏi–đáp cũ vẫn nằm trong Re-Frames 0.6.0 — chưa đụng |
| 11 | Auto Organize Folder | — | — | ⬜ Chưa có code | Mới có `yêu cầu.txt` |
| 12 | **Shot & Save** | Electron **0.5.5** (sửa 21/09: bảng cũ ghi 0.4.17; package.json + bộ cài Release 16/09 là 0.5.5, có cả mac x64/arm64) | app độc lập, KHÔNG CEP | ✅ **Anh chấm ĐẠT 14/09** trên bản cài 0.4.4.0 máy công ty (Tauri đã gỡ 14/09 08:06); 0.4.6 nền chữ + dời thư mục ảnh ra ngoài thư mục cài (cài đè từng mất 2 ảnh); 0.4.8 cài 14/09 10:19: ảnh ghim rê chuột hiện 3 nút vẽ (trước chỉ có phím 1/2/3) — anh chấm ĐẠT 14/09; 0.4.9 cài 10:44: màn tối đi mượt (grab chờ 200 ms) — anh chấm ĐẠT 10:52; 0.4.12 kéo to khay = thấy nhiều ảnh hơn (anh ĐẠT 11:2x); 0.4.13–0.4.15 cài 12:00: frozen JPEG + cắt gốc PNG lúc Xong; chụp TRƯỚC khi phủ overlay (overlay phủ ≥0,5 s là video đen — đo), overlay hiện ~0,6 s có hình đứng yên — anh chấm ĐẠT 12:0x; 0.4.16 12:37: thư mục ảnh mặc định đổi `AiOShotSave\AnhChup` vì `&` trong tên làm kéo-thả vào app Chromium ra file rỗng (đo) — anh chấm ĐẠT 12:4x; 0.4.17 13:10: thư mục `shotandsave`, file `shotandsave-…`, kéo-thả an toàn qua hard link với mọi ký tự — anh chấm ĐẠT 13:2x. ☠️ **Tauri ĐÃ BỎ 10/09** | Xem mục 5. [Chờ đo] run-log chết im lặng từ 14/09 09:03 |
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
| **23/09** | **Shot & Save đổi giá: $7.99 trả một lần + $2/năm tuỳ chọn để nhận bản cập nhật** (đè $9.99 + $3/năm của 22/09) | Anh: *"giá anh muốn thay đổi thành $7.99 và $2/year updated"* (chưa nêu lý do). Đã đổi đủ 18 chỗ trên web (thẻ giá, nút Mua, ghi chú tiền, 3 hỏi đáp, mô tả trang, số đếm lên). Cổng thanh toán vẫn chưa có | ✅ **HIỆN HÀNH** |

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

---

## 7. Làm việc 3 máy — chốt 31/08, thêm Mac 21/09

| Máy | Repo |
|---|---|
| Công ty (DRT-G21) | `E:\2026\Production\AiO Studio` |
| Nhà (user `hadan`) | `D:\Production\AiO Studio` |
| **Nhà — MAC** (thêm 21/09: anh *"máy ở nhà anh có 2 máy là máy mac và máy win"*) | đề xuất `~/Production/AiO Studio` — **chưa đo**, lần đầu phải `git clone` |

- Làm xong ở máy nào → **pull rồi push** ngay (`/xong` bước 2c).
- **Mac không có PowerShell** → dùng `bash scripts/dong-bo-mac.sh` (cùng 5 bước: pull · đếm file · node_modules · /xong+/batdau · nhận brain) và `--day-brain` thay cho `dong-bo-brain.ps1 -Day`. Viết + thử 21/09 **trên Windows** (thư mục HOME giả, brain đẩy vào bản sao cục bộ) — **CHƯA chạy trên Mac thật**. ☠️ FFmpeg/whisper trong `bin/` là `.exe` → 7 panel dùng chúng chưa chạy được trên Mac.
- Ngồi máy kia → chạy `scripts\dong-bo-may.ps1` TRƯỚC (pull · đếm file so
  GitHub · soi node_modules/FFmpeg; `-CaiThem` = tự npm install). 31/08: 636/636.
- Máy công ty push bị 403 (gh CLI đè credential `Vincentnguyen1809`):
  `git -c credential.helper= -c credential.helper=manager push`. Sửa gốc
  (`~/.gitconfig`) cần anh gật — chưa làm.
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
| **Panel tổng "AiO Studio" (bệ phóng)** — giao diện ĐÃ CHỐT: 2 dạng (21/09) + phong cách Option 2 (22/09), bản vẽ trang "Bản 3": https://claude.ai/artifact/GmdDjRe5oRJuNBr3uAbubN | WELCOME → panel tổng | Chờ anh duyệt ngưỡng đổi dạng + bấm "làm" thì mới code. Khi code: sửa từ `AiO WELCOME` (ID thật `com.aiostudio.*`, đổi Modeless 1020×720 thành Panel dock được), đọc danh sách tool bằng `getExtensions()` thay vì gõ cứng, dọn 2 thư mục `AiO WELCOME` + `AiO WELCOME Page` (luật 4h), sửa cổng debug 8095 trùng `xem-bo.mjs`. ☠️ Hub đọc phiên bản từ manifest → Podcast sẽ hiện **0.1.0** cho tới khi bump |
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
