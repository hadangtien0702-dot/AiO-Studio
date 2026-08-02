# AiO Studio — Asset Manager (CEP Panel cho Premiere Pro)

Panel quản lý asset chạy bên trong **Adobe Premiere Pro**: quét thư viện → bấm để xem
trước → kéo thả (hoặc bấm Import) thẳng vào timeline.

| | |
|---|---|
| **Trạng thái** | ✅ **Đã phát hành 1.0.0** — Phase 0–7 (Windows/Premiere) hoàn tất |
| **Phiên bản** | **1.1.0** — bấm để xem/nghe, Import chèn đúng track |
| **Kế tiếp** | Bám theo việc dựng phim thật của chủ dự án. *(Chứng chỉ thương mại · macOS · bản quyền: **không làm** — panel dùng nội bộ)* |

**Tài liệu liên quan** *(đọc theo thứ tự này)*
1. **[RULES.md](RULES.md)** — ⚠️ **ĐỌC TRƯỚC TIÊN.** Quy định ràng buộc: được làm gì / không
   được làm gì, danh sách file khoá, **bản đồ phụ thuộc** (sửa chỗ này hỏng chỗ nào),
   và chi tiết đầy đủ các phase
2. [HANDOFF_PHASE2.md](HANDOFF_PHASE2.md) — bàn giao chi tiết cho người/AI làm Phase 2
3. [PLAN.md](PLAN.md) — kế hoạch tổng thể, kiến trúc, các quyết định đã chốt
4. [OPTIMIZE.md](OPTIMIZE.md) — danh sách tối ưu hiệu năng (preview nhanh, không giật)
5. [design-system/aio-studio/MASTER.md](design-system/aio-studio/MASTER.md) — hệ thiết kế:
   màu, thang chữ, khoảng cách, quy ước component
6. [PROGRESS.md](PROGRESS.md) — nhật ký thay đổi từng phiên bản

---

## Tính năng hiện có

**Mở panel là chọn 1 trong 2 phần chính** — mỗi phần là một không gian riêng, menu
trái và lưới riêng, không dùng chung bộ lọc:

- **Asset Manager** — quét thư mục trên máy, xem trước, chèn vào timeline.
- **Power Bins (Brand Kit)** — tài nguyên nhận diện của từng brand, dùng lại ở mọi dự án.

**Brand Kit (trong Power Bins)**

Cấu trúc 2 tầng: **Brand** (Kênh A, Coca-Cola…) → **Khay** (Logo, Intro/Outro, Nhạc nền…).
Khay không thuộc brand nào nằm ở mục **Khay chung** — dữ liệu Power Bin cũ giữ nguyên,
không cần quét lại. Xoá brand **không** xoá khay bên trong: chúng chuyển sang Khay chung.

Hai cách đưa tài nguyên vào khay:

1. **Chọn clip trên timeline → bấm "Thêm từ timeline"** — panel đọc đường dẫn file gốc
   của các clip đang chọn. Clip không có file trên đĩa (title, color matte, adjustment
   layer, nested sequence) được bỏ qua.
2. **Kéo file từ Windows Explorer thả vào lưới.**

File đã có trong thư viện thì chỉ được gán vào khay, **giữ nguyên** thumbnail/sóng
âm/proxy đã sinh — không phải xử lý lại.

**Quét & xem trước**

- Quét thư mục đệ quy, phân loại **video / audio / ảnh / MOGRT / preset**.
- Ghép cặp MOGRT với file preview đi kèm, và **bung ảnh nhúng bên trong `.mogrt`**.
- **Bấm để xem/nghe** — xem mục *Xem / nghe* bên dưới.
- FFmpeg tự sinh **thumbnail** cho video, **sóng âm** cho audio (800×200), và
  **proxy 360p** cho video 4K/ProRes để xem trước luôn mượt.
- Lưới **ảo hoá** — mượt với thư viện 15.000+ asset. 2 dạng hiển thị (**xem vừa** /
  **xem to**), chọn ở **góc phải phía dưới**.

**Phần Âm thanh**

- Thẻ audio lấy **sóng âm làm nội dung chính**, có vạch playhead chạy khi nghe thử.
- **Bấm vào sóng âm để tua** tới đúng đoạn đó — không phải nghe lại từ đầu.
- Cụm nghe thử nằm **ngay trong phần Âm thanh**: **âm lượng** và **cao độ (pitch)**
  −12…+12 nửa cung. Pitch kiểu varispeed (băng từ) nên **đổi cao độ thì tốc độ nghe
  thử đổi theo**; chỉ ảnh hưởng lúc nghe thử, không sửa file gốc.

**Xem / nghe** *(0.18.1: chỉ còn BẤM, đã bỏ hover-preview)*

- **Bấm vào thẻ** để xem video hoặc nghe nhạc — nó **phát tiếp cả khi chuột đã rời
  thẻ**, viền cam cho biết thẻ nào đang phát. Bấm lần nữa (hoặc bấm thẻ khác) thì dừng.
- **Rê chuột KHÔNG còn tự phát.** Lý do bỏ: chuột đi ngang một ô là ô đó tự phát và
  tự nhận mình là mục tiêu của nút Import → Import chèn nhầm. Lướt qua lưới 15.000
  asset còn là hàng chục lần tự phát ngoài ý muốn.
- **Nhạc không lặp** — hết bài tự dừng, tắt viền cam. Video thì lặp (overlay/
  transition thường chỉ 1–17 giây, dừng sau một lượt là chưa kịp nhìn).
- **Bấm vào sóng âm** để nghe từ đúng đoạn đó.

**Đưa vào timeline**

- Nút **Import** ở **thanh dưới**: chèn **thẻ đang phát** vào playhead. Nếu không có
  thẻ nào đang phát thì chèn thẻ vừa bấm gần nhất.
- Panel tự chọn **track trống ở đúng vị trí playhead** — nhạc xuống track âm thanh,
  video/MOGRT lên track video. Hết chỗ thì **tự thêm track mới**, không bao giờ đè
  lên clip đang có. Không thêm được track thì báo lỗi rõ ràng.
- **Đã bỏ "bấm đúp để chèn"** (0.17.0): chèn là thao tác sửa dự án thật, không nên
  nằm ngay trên thứ người dùng bấm suốt để xem.

**Khác**

- **Nút "Render preview"** trên thanh công cụ, có ba trạng thái nhìn là biết:
  *Đang render 587/1.999* (đang chạy) · *Render preview (1.856)* (còn thiếu) ·
  *Preview đã đủ* (xong). Trước khi chạy, panel tự dọn các đường dẫn trỏ tới file
  cache đã bị xoá (nếu không, nó tưởng "đã có ảnh" và không render lại).
  File nào FFmpeg không đọc được thì bị đánh dấu và bỏ qua — không thử lại vô ích;
  bấm nút là thử lại chính những file đó.
- **Menu trái**: bấm một loại asset để xổ danh sách thư mục bên trong, **bấm lần
  nữa để thu gọn**. Thư mục chỉ có một nhánh con sẽ được bỏ qua để đi tới cấp
  thật sự chia được — nhờ vậy 2.138 file âm thanh nằm sâu trong `Overlay Video\
  UV BUNDLE\...` hiện thành các pack thật thay vì một dòng vô dụng.
- **Menu trái kéo rộng được**: kéo mép phải (hoặc bấm vào mép rồi dùng phím mũi
  tên) để đọc được tên thư mục dài. Bề rộng được nhớ cho lần mở sau.
- **Power Bins**: nút **Bỏ khỏi khay** ở thanh dưới — chỉ gỡ asset khỏi khay,
  không xoá file trên đĩa.
- **Cài đặt** (mở được từ mọi màn hình): chất lượng bản xem nhanh và bộ nhớ đệm.
  - **Nơi lưu bộ nhớ đệm** — đổi sang ổ khác được (ổ C hay đầy). Panel tự chuyển
    file sang chỗ mới và sửa đường dẫn trong thư viện, không phải render lại.
  Bộ nhớ đệm tách làm hai phần vì hậu quả khác hẳn nhau:
  - **Dọn rác** — chỉ xoá file cache không asset nào còn dùng. Không mất gì.
  - **Xoá tất cả** — nói rõ sẽ phải tạo lại bao nhiêu ảnh / sóng âm / bản xem
    nhanh, và phải bấm hai lần. Thư viện, brand, khay và mục yêu thích luôn giữ
    nguyên; panel tự render lại ngay sau đó.
- Panel **tự tải lại** khi có bản build mới.
- Bàn phím dùng được: Tab tới mọi mục menu và mọi thẻ; Enter/Space = xem-nghe;
  Esc = đóng hộp thoại. Nút Import cũng Tab tới được.

> **Đã bỏ ở 0.9.0-dev.1:** nút Chụp màn hình, nút Dán clipboard (cùng phím tắt
> `Ctrl+V`), nút Export/Transcoder, dãy chip loại asset ở thanh trên (trùng menu
> trái), dãy chip sắp xếp, cây cấu trúc thư mục, và mục nhãn màu. Dữ liệu nhãn màu
> cũ vẫn còn trong `library.json`, bật lại được.
>
> **0.9.1-dev.1:** đã xoá hẳn 3 file không còn nơi nào gọi —
> `TranscodeModal.tsx`, `renderService.ts`, `screenCaptureService.ts`.
>
> **0.9.2-dev.1:** bỏ nút *Tạo Pack* ở thanh chọn nhiều, bỏ lối vào *Gói Packs* ở
> màn hình chọn, bỏ nút ẩn/hiện menu trái (menu trái giờ luôn hiện).
>
> **0.18.0-dev.1:** chủ dự án chốt **xoá hẳn Gói Packs** — đã gỡ toàn bộ giao
> diện và hành động. Trường `packs` trong `library.json` vẫn được giữ nguyên vẹn
> (xoá khỏi state là lần lưu kế tiếp ghi đè mất dữ liệu cũ, không lấy lại được).
>
> **0.12–0.15:** đổi hệ màu sang **đen + cam**; bỏ thanh thao tác hàng loạt và cả
> thao tác chọn nhiều; bỏ chế độ xem danh sách ngang; bỏ
> nút "quét lại tất cả" ở thanh trên (mỗi mục đã có nút quét lại riêng, bấm nhầm
> nút cũ là quét lại cả 15.000 asset); bỏ thông báo khi chèn thành công.

---

## Yêu cầu

- **Windows** (Mac làm sau)
- **Node.js** ≥ 18 — đã kiểm chứng trên v24.18.0
- **Adobe Premiere Pro** — đã kiểm chứng trên Beta 26.5.0 (CEP 12)

## Cài đặt trên máy mới

Mở **PowerShell** tại thư mục dự án và chạy:

```bash
powershell -ExecutionPolicy Bypass -File scripts\bootstrap.ps1
```

Lệnh này sẽ: cài dependencies → build panel → tạo chứng chỉ ký → ký → cài vào Premiere.

Sau đó mở Premiere và vào:

> **Window → Extensions → AiO Studio - Asset Manager**

## Gỡ panel

```bash
powershell -ExecutionPolicy Bypass -File scripts\uninstall-dev.ps1
```

---

## Vòng lặp phát triển

Sau khi sửa code trong `client/src/`:

```bash
cd client && npm run build
```
```bash
powershell -ExecutionPolicy Bypass -File scripts\sign-install.ps1
```

Panel **tự tải lại sau ~1,5 giây** — không cần đóng/mở panel hay khởi động lại Premiere.

> **Ngoại lệ:** nếu sửa `CSXS/manifest.xml` thì **phải tắt hẳn Premiere rồi mở lại**.

---

## Đóng gói bản phát hành

```bash
powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
```

Script tự làm hết: đọc số phiên bản từ `CSXS/manifest.xml` → build bản phát hành →
ký → **tự kiểm tra chữ ký** → đóng gói thành **một file duy nhất để gửi đi**:

```
build/AiO-Studio-Asset-Manager-<phiên bản>-SETUP.zip
```

Người nhận giải nén rồi **bấm đúp `CAI-DAT.bat`** — không cần cài thêm phần mềm nào.
Bên trong gói có:

| File | Việc của nó |
|---|---|
| `CAI-DAT.bat` | Bấm đúp là cài (gọi `cai-dat.ps1`) |
| `cai-dat.ps1` | Giải nén vào thư mục CEP, bật `PlayerDebugMode`, kiểm tra lại rồi mới báo xong |
| `…-<phiên bản>.zxp` | Cho ai quen dùng ZXP Installer |
| `HUONG-DAN-CAI-DAT.txt` | Hướng dẫn cho người dùng cuối |

**Khác gì bản phát triển:**

| | Bản phát triển (`npm run build`) | Bản phát hành (`package-release.ps1`) |
|---|---|---|
| Auto-reload | Bật — panel tự tải lại sau mỗi lần cài | **Tắt** — người dùng đang dựng không bị reload giữa chừng |
| File `.debug` | Có (cổng debug 8088) | Không |
| Tên file ra | `build/aiostudio.zxp` | `build/release/…-<phiên bản>.zxp` |

Tăng phiên bản: sửa `ExtensionBundleVersion` **và** `<Extension Version>` trong
`CSXS/manifest.xml` (script đọc số từ đó), rồi sửa `version` trong `client/package.json`.

**Về cảnh báo chữ ký:** bản này ký bằng **chứng chỉ tự tạo**. Cài bằng `CAI-DAT.bat`
thì không thấy cảnh báo nào; cài bằng [ZXP Installer](https://aescripts.com/learn/zxp-installer)
thì nó hỏi xác nhận một lần. Muốn hết hẳn thì phải mua chứng chỉ code-signing thương
mại (~220 USD/năm) — khi có rồi chỉ cần đổi đường dẫn chứng chỉ trong script, không
sửa code.

**Remote debug:** khi panel đang chạy, mở trình duyệt tới <http://localhost:8088>.

---

## Vì sao phải ký extension

Premiere Beta 26.5 (CEP 12) **từ chối extension chưa ký** — cờ `PlayerDebugMode` không còn
đủ để bỏ qua kiểm tra chữ ký (log báo `Signature verification failed`). Vì vậy quy trình dev
bắt buộc phải chạy `sign-install.ps1` sau mỗi lần build.

Chứng chỉ **self-signed** được tạo tự động vào `certs/aiostudio-dev.p12` (đã `.gitignore`,
chứa private key nên không đưa lên version control).

---

## Cấu trúc thư mục

```
AiO Editing/
├─ CSXS/manifest.xml          # khai báo extension (PPRO, bật Node + tăng tốc GPU)
├─ .debug                     # cấu hình remote debug (cổng 8088)
│
├─ client/                    # UI panel — React + TypeScript + Vite
│  ├─ public/CSInterface.js   # cầu nối CEP (nạp trước React)
│  ├─ src/
│  │  ├─ lib/
│  │  │  ├─ cep.ts            # gọi ExtendScript kiểu Promise, chọn thư mục, đường dẫn hệ thống
│  │  │  ├─ node.ts           # truy cập Node (fs/path) bên trong CEP
│  │  │  ├─ tree.ts           # dựng cây danh mục từ đường dẫn asset
│  │  │  └─ format.ts         # định dạng kích thước file
│  │  ├─ services/
│  │  │  ├─ scanner.ts        # quét đệ quy, phân loại, ghép cặp MOGRT
│  │  │  ├─ library.ts        # lưu/đọc library.json + migrate theo phiên bản
│  │  │  ├─ mediaServer.ts    # máy chủ media nội bộ (127.0.0.1, hỗ trợ tua)
│  │  │  ├─ mogrtThumb.ts     # bung thumb.png bên trong gói .mogrt
│  │  │  ├─ ffmpeg.ts         # đường dẫn & thực thi binary FFmpeg/FFprobe
│  │  │  ├─ probe.ts          # ffprobe trích xuất metadata duration/res/fps/codec
│  │  │  ├─ thumbnailer.ts    # FFmpeg sinh thumbnail .jpg tĩnh cho video
│  │  │  ├─ waveform.ts       # FFmpeg sinh dạng sóng nhạc .png cho audio
│  │  │  ├─ proxy.ts          # FFmpeg sinh proxy 360p siêu nhẹ cho video 4K/ProRes
│  │  │  ├─ jobQueue.ts       # hàng đợi xử lý nền đa luồng GPU acceleration
│  │  │  ├─ cacheService.ts   # đo dung lượng · tách rác/đang dùng · xoá bộ nhớ đệm
│  │  │  ├─ cacheAudit.ts     # dọn đường dẫn trỏ tới file cache đã bị xoá
│  │  │  ├─ timelineImport.ts # đọc clip đang chọn trên timeline · nhận file kéo-thả
│  │  │  └─ autoReload.ts     # panel tự tải lại khi có bản build mới
│  │  ├─ components/          # Launcher · Toolbar · Sidebar · Grid · AssetCard · Icons
│  │  │                       #  · PowerBinHub · SettingsModal · Toast
│  │  ├─ state/store.ts       # trạng thái toàn cục (zustand)
│  │  ├─ types.ts             # kiểu Asset, Brand, PowerBinFolder, AssetPack, Tag, AppSettings
│  │  ├─ dev/mockData.ts      # dữ liệu DEMO chỉ dùng khi mở bằng trình duyệt
│  │  └─ styles/              # SCSS: main.scss + _tokens _mixins _base _controls
│  │                          #  _topbar _launcher _sidebar _grid _card _overlays
│  │                          #  (tài liệu: design-system/aio-studio/MASTER.md)
│  └─ vite.config.ts          # build ra ../dist, gói thành 1 file duy nhất
│
├─ host/                      # ExtendScript chạy trong Premiere
│  ├─ index.jsx               # router
│  ├─ ppro.jsx                # import file / MOGRT vào timeline, export selection
│  └─ ae.jsx                  # After Effects (stub, làm sau)
│
├─ scripts/                   # bootstrap · sign-install · uninstall-dev (PowerShell, ASCII)
├─ bin/win64/                 # binary ffmpeg.exe & ffprobe.exe bundled
├─ dist/                      # kết quả build (sinh tự động, đã .gitignore)
├─ build/                     # staging + file .zxp đã ký (đã .gitignore)
└─ certs/                     # chứng chỉ ký (đã .gitignore)
```

---

## Nơi xem dữ liệu và log

| Nội dung | Đường dẫn |
|---|---|
| Thư viện đã quét | `%APPDATA%\AiOStudio\library.json` |
| Cache ảnh thumbnail | `%APPDATA%\AiOStudio\thumbs\` |
| Log CEP (lỗi nạp panel) | `%LOCALAPPDATA%\Temp\CEP12-PPRO.log` |
| Extension đã cài | `%APPDATA%\Adobe\CEP\extensions\com.aiostudio.assetmanager` |

---

## Giới hạn đã biết

- **Không kéo-thả từ panel vào Premiere.** API thì có thật
  (`com.adobe.cep.dnd.file.0`, CEP 5.2+) nhưng **thử thực tế trên Premiere Beta 26.5
  thì Premiere từ chối** — kéo ra hiện con trỏ dấu cấm, thả cả vào timeline lẫn
  Project panel đều không ăn. Cùng triệu chứng đã có người báo Adobe từ bản 2022
  ([CEP-Resources #483](https://github.com/Adobe-CEP/CEP-Resources/issues/483)),
  đến nay chưa có trả lời. Mã nguồn vẫn giữ, bật lại chỉ tốn một dòng khi Adobe sửa.
  Dùng nút **Import**.
- **Không kéo-thả từ timeline vào panel:** Premiere cũng không có API cho chiều ngược lại.
  Đã làm hai cách chạy được thay thế: nút **Thêm từ timeline** (đọc clip đang chọn) và
  **kéo file từ Windows Explorer** vào lưới. Xem `services/timelineImport.ts`.
- **Font SF Pro không được nhúng** vào sản phẩm (giấy phép Adobe/Apple giới hạn phân phối).
  Máy nào không cài SF Pro sẽ tự lùi về Inter rồi Segoe UI — layout không vỡ.
- **Đổi màu/kích cỡ sóng âm** thì các file `wf_*.png` đã cache vẫn giữ bản cũ. Bấm
  **Xoá bộ nhớ đệm Cache** trong Cài đặt để sinh lại.
