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
| 1 | **Autocut** | **1.6.0** | `com.aiostudio.autocut` · 8089 | ✅ **XONG, NGƯNG PHÁT TRIỂN** (anh chốt 19/08) | Anh tự dựng bài thật + nghe lại, không mất lời. Bộ cài `Release/2026-08-19-autocut-1.6.0/` 46 MB. Việc mới phải hỏi anh |
| 2 | Asset Manager | 2.0.0 | `com.aiostudio.assetmanager` · 8088 | 🧊 **Đóng băng** (14/08: *"rất ổn rồi, tạm dừng"*) | Kho ~28.900 asset. Là **gói FREE** |
| 3 | Power Bins | 2.0.0 | `com.aiostudio.powerbin` · 8090 | 🟢 Chạy được | Brand kit hiện ở mọi project Premiere |
| 4 | Transcripts | **2.5.5** | `com.aiostudio.transcript` · 8091 | 🟢 Chạy được | 24/08: 2 nút *Làm phụ đề* / *Làm hiệu ứng*; khối hiệu ứng **ẨN** (`HIEN_HIEU_UNG=false`) vì đo chết 3 đường native Premiere 27; vá caption rơi sang sequence khác. Nợ: anh dùng bài thật, bộ cài cài font |
| 5 | WELCOME | 1.5.0 | `com.aio.welcome` · 8087 | 🟢 | Panel chào mừng, không build |
| 6 | Auto Re-Frames | 0.6.0 | `com.aiostudio.reframe` · 8092 | 🟡 Đang làm | Dọc 9:16 Sensei bám chủ thể; khoanh I/O là tracking đúng đoạn (27/08). Không build |
| 7 | Auto Guideline Frame | 0.3.0 | `com.aiostudio.guideframe` · 8096 | 🟡 Đang làm | Safe zone 10 nền tảng / 53 vùng; đặt 0,74s / gỡ 0,13s trên sequence 4K 306 clip. Không build |
| 8 | Auto Podcast | UI 0.6.6 · host 0.4.9 (☠️ manifest **0.1.0** chưa bump — chờ anh gật) | `com.aiostudio.podcast` · 8094 | 🟢 Chạy được | 25/08 *"cắt đúng người"* ĐÃ GIẢI bằng tai anh: liệu 40 phút 2 người + wide, tiếng cam làm mic, 411 nhát. **Chưa đo**: >2 người, mic rời bleed nặng, >1 giờ. Ngưỡng cắt KHÔNG đụng |
| 9 | Music & SFX (`AiO Mussic`) | 1.0.0 | `com.aiostudio.music` · 8097 | 🟡 | Có UI, chưa nối việc thật |
| 10 | Auto Cut Short | — | dành `com.aiostudio.cutshort` · 8093 | ⬜ Chưa có code | Chờ anh chốt 5 câu hỏi sản phẩm (trong `CLAUDE.md` của nó) |
| 11 | Auto Organize Folder | — | — | ⬜ Chưa có code | Mới có `yêu cầu.txt` |
| 12 | **Shot & Save** | Electron **0.4.3** | app độc lập, KHÔNG CEP | ✅ Electron là bản dùng thật (0.4.2 anh chấm ĐẠT 31/08; 0.4.3 10/09 sửa mất ảnh im lặng, chờ cài đè). ☠️ **Tauri ĐÃ BỎ 10/09** | Xem mục 5 |
| 13 | **Video Download** | **0.1.0** | `com.aiostudio.videodownload` · **8098** | 🟡 Mới dựng 08/09 | Dán link → tải (yt-dlp + QuickJS 2 MB + FFmpeg LGPL) → tự vào bin. Đo: YouTube 1080p H.264 255,9 MB/30 s; TikTok chặn ngẫu nhiên → tự thử lại 3 lần. Anh đang bấm thử, chưa qua bài thật. Chi tiết: `CLAUDE.md` + `PROGRESS.md` trong thư mục nó |

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
  Cơ chế khoá gói phải tách **1 free / 7 trả tiền** — CHƯA làm.
- Kho FFmpeg dùng chung `%APPDATA%\AiOStudio\bin\win64` + `package-release.ps1
  -BinChung`: 3 gói từ 274,7 MB → ~92 MB. ☠️ CHƯA có `SETUP.exe` gộp, CHƯA panel
  nào chạy thật bằng kho chung trên Premiere.
- Bộ cài `CAI-DAT.bat` tự bật `PlayerDebugMode`, không cần Admin.
- Mỗi bản phát hành một thư mục `Release/<ngày>-<app>-<bản>/`; `.exe/.zip/.rar`
  **không lên git**.
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

---

## 5. Shot & Save — app ngoài Premiere

Chụp vùng màn hình (phím tắt) → khay ảnh → ghim sticky → vẽ khung/mũi tên →
Ctrl+C / kéo-thả ra Zalo, Messenger, Explorer. Vắt ngang 2 màn đúng pixel vật
lý (máy anh 150% + 125%). Song ngữ. Không làm CEP vì sandbox Premiere không cho
chụp màn hình và kéo file ra ngoài.

| Bản | Ở đâu | Trạng thái |
|---|---|---|
| **Electron 0.4.3** | `Build and UI Design/AiO Shotandsave/` | **BẢN DUY NHẤT từ 10/09** (hết đóng băng). 0.4.2 anh chấm ĐẠT 31/08 *"kéo lại ổn định"*; 0.4.3 sửa mất ảnh im lặng khi không ghi được file, bộ cài 84,3 MB `dist/` chờ cài đè |
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

## 7. Làm việc 2 máy — chốt 31/08

| Máy | Repo |
|---|---|
| Công ty (DRT-G21) | `E:\2026\Production\AiO Studio` |
| Nhà (user `hadan`) | `D:\Production\AiO Studio` |

- Làm xong ở máy nào → **pull rồi push** ngay (`/xong` bước 2c).
- Ngồi máy kia → chạy `scripts\dong-bo-may.ps1` TRƯỚC (pull · đếm file so
  GitHub · soi node_modules/FFmpeg; `-CaiThem` = tự npm install). 31/08: 636/636.
- Máy công ty push bị 403 (gh CLI đè credential `Vincentnguyen1809`):
  `git -c credential.helper= -c credential.helper=manager push`. Sửa gốc
  (`~/.gitconfig`) cần anh gật — chưa làm.
- `/xong` bản gốc nằm **trong repo** `.claude/commands/xong.md`; script đồng bộ
  chép về `~/.claude/commands`. Sửa bản trong repo, đừng sửa bản `~/.claude`.

**Cố ý KHÔNG qua git — pull về không có là ĐÚNG:** bộ cài `Release/*.exe|zip|rar`
(46–93 MB/bản) · `bin/` FFmpeg (~219 MB × 4) · `node_modules/` · `dist/` của 5
panel có build (Asset Manager, Autocut, Power Bins, Transcripts, Shot & Save) ·
`Test Media/` (1,33 GB) · `.env.local`. `dist/` của panel KHÔNG build (Podcast,
Re-Frames, Guide Frame, WELCOME) là mã viết tay → **trong** git.

---

## 8. Việc đang CHỜ — đọc trước khi nhận việc mới

| Việc | App | Vì sao chưa |
|---|---|---|
| Cài đè Electron 0.4.3 + chép 75 ảnh khỏi thư mục cài Tauri rồi mới gỡ Tauri | Shot & Save | Chốt 10/09, anh tự làm |
| Cài thử **máy sạch** | Autocut, Shot & Save | Chỉ anh làm được |
| Khoá gói Free/Pro (1/7) | Cả bộ | Chưa làm; ngưng build tool từ 13/08 |
| `SETUP.exe` gộp + panel chạy thật bằng kho FFmpeg chung | Cả bộ | Chưa làm |
| Bộ cài cài font (Montserrat ×3 + Bangers) | Transcripts | Caption MOGRT cần font máy khách |
| Anh dùng caption hiệu ứng trên bài thật | Transcripts | Mới đo sequence test 20s |
| Bump manifest Podcast 0.1.0 → 0.6.6 | Podcast | Chờ anh gật (đóng băng build) |
| Mic rời bleed nặng (bộ Will–Trọng, 8 clip stereo `podcast-nghe-kiem-2`) | Podcast | Chờ tai anh |
| Tốc độ 19 phút/giờ (mục tiêu <5) | Autocut | 83% ở `overwriteClip` của Adobe; hướng: xuất FCPXML |
| 5 câu hỏi sản phẩm | Auto Cut Short | Chờ anh chốt |
| `.p12` + mật khẩu trong repo public | Cả bộ | Anh chốt "tính sau" |
| `PROGRESS.md` gốc repo | — | Chưa có |

---

## 9. Bản đồ thư mục (sau khi tổ chức lại 14/08)

```
AiO Studio\
├── Build and UI Design\   11 panel + AiO Shotandsave + design-system
│                          + AiO Design System (file anh chốt) + AiO Git Public
├── Website\AiO WebDessign\
├── Marketing\AiO MVP and Plan Marketing\   PIPELINE.md (còn thiếu gì để bán)
│                          · TOOL_VERSION_TRACKER.md · MASTER_PLAN · BANG_GIA
├── Release\               mỗi bản một thư mục theo ngày
├── Test Media\file pr for test\   1,33 GB, dùng chung (project Premiere sẽ hỏi relink)
├── Research and Architecture\
├── scripts\               dong-bo-may.ps1 · brain-map\ (bản đồ brain, cổng 8097)
└── CLAUDE.md              ← file này
```

Còn thiếu gì để bán, xếp theo mức chặn: `Marketing/.../PIPELINE.md` mục 4.
