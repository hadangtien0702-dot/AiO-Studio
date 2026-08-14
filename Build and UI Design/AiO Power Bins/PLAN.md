# AiO Studio — Asset Manager Panel

### Plan & Pipeline (v1)

> Một panel quản lý asset chạy bên trong **Premiere Pro** (host chính) — mở rộng **After Effects** sau,
> mô hình giống Mister Horse, tập trung vào **quản lý file → preview → render → đẩy vào timeline**.

> **🎯 Host ưu tiên: PREMIERE PRO.** Toàn bộ phần Host Bridge (Phase 5) làm cho PPro trước
> (import vào sequence tại playhead). AE làm sau, dùng chung khung service/UI.

---

## 0. Quyết định đã chốt (Locked) & Trọng tâm sản phẩm

> Chốt ngày 2026-07-24 sau khi làm rõ với anh chủ dự án.

### 0.1. Quyết định kỹ thuật

| Mục             | Chốt                                           | Ghi chú                                                                                                                                                         |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host**   | Premiere Pro**Beta mới nhất** (Windows) | Khai báo range CEP rộng, mở từ version cao trở lên trong`manifest.xml`. Dev test trên Beta; nếu Beta lỗi vặt thì đối chiếu bản PPro ổn định. |
| **OS**     | **Windows trước**                       | Chỉ bundle`ffmpeg.exe` + `ffprobe.exe`. `getFFmpegPath()` resolve theo Win. Mac để sau.                                                                 |
| **FFmpeg** | **Bundle sẵn trong `bin/`**            | Cài panel là chạy, user không phải tự cài gì.                                                                                                            |

### 0.2. Trọng tâm v1 — TRÁI TIM của app

> ⚡ Ưu tiên số 1: **Preview nhanh – nhẹ – gọn – mượt.** Category / tag / search / render-export
> là hàng phụ, làm sau. Tinh thần: **Mister Horse / Motion Bro.**

1. **Hover-to-preview** (rê chuột vào ô là xem ngay, KHÔNG cần click):
   - **Video thường** → rê là **auto-play** proxy nhẹ (360p), rê ra thì dừng.
   - **MOGRT** → rê là **phát clip `.mp4` preview** đi kèm.
   - **Audio** → rê là **nghe** + hiện **waveform**.
2. **MOGRT workflow** (nguồn chính: **Envato**, luôn có cặp `.mogrt` + `.mp4`):
   - Ghép cặp tự động `.mogrt` ↔ `.mp4` cùng tên trong scanner.
   - Preview = phát file `.mp4`.
   - **Kéo-thả** → thả **file `.mogrt`** vào timeline/sequence Premiere đang mở.
3. **Kéo-thả nhanh vào timeline** cho cả video/audio/mogrt.
4. **File nằm ở ổ local (máy cá nhân):** panel trỏ thẳng `<video>/<img>` vào
   **file gốc** để preview ngay (đã bật `--allow-file-access` trong manifest).
   → Proxy chỉ sinh khi file quá nặng/định dạng lạ gây giật, KHÔNG tạo proxy tràn lan.

### 0.3. Ảnh hưởng tới Roadmap

- MOGRT **không còn để V2** — đưa lên nhóm lõi (vì đã có sẵn mp4 preview, làm dễ).
- Phase Preview (cũ = Phase 3) **nâng lên ưu tiên cao**, làm kỹ phần hover + auto-play.
- Render/transcode (Phase 4) **hạ xuống làm sau**, không phải mục tiêu v1.
- Thứ tự làm thực tế: **0 → 1 (scanner + ghép cặp mogrt/mp4 + grid) → 3 (hover preview) → 5 (kéo-thả vào timeline)** rồi mới tới phần còn lại.

---

## 1. Mục tiêu sản phẩm

Xây một **CEP Extension Panel** cho Adobe, giúp người dựng:

1. **Quản lý** mọi loại asset ở một chỗ: video, âm thanh, ảnh/overlay, MOGRT, preset AE.
2. **Phân loại** theo category / tag / pack / favorite, tìm kiếm nhanh.
3. **Preview** ngay trong panel: xem video (proxy nhẹ), nghe audio (kèm waveform), xem ảnh, xem thumbnail MOGRT.
4. **Render / transcode** file bằng FFmpeg (đổi định dạng, nén, resize, xuất proxy…).
5. **Đẩy asset vào project/timeline** của AE/PPro chỉ bằng 1 click (hoặc kéo-thả).

---

## 2. Vì sao chọn CEP (không phải UXP)

| Tiêu chí                       | CEP ✅ (chọn)         | UXP ❌                                   |
| -------------------------------- | ---------------------- | ---------------------------------------- |
| Chạy FFmpeg (child_process)     | Có Node.js đầy đủ | Bị sandbox, không spawn được binary |
| Đọc/ghi file hệ thống tự do | Có                    | Hạn chế                                |
| Tương thích AE hiện tại     | Rất tốt              | AE hỗ trợ UXP còn hạn chế           |
| Mister Horse đang dùng         | CEP                    | —                                       |

> **Kết luận:** CEP là con đường bắt buộc để có FFmpeg + quản lý file mạnh.
> (Sau này nếu Adobe ép chuyển UXP, phần lõi Node/FFmpeg tách riêng vẫn tái dùng được.)

---

## 3. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    ADOBE HOST (AE / PPro)                 │
│                                                          │
│   ┌──────────────────────────────────────────────┐      │
│   │              CEP PANEL (WebView)               │      │
│   │                                                │      │
│   │   [1] UI LAYER — React + TS + Vite             │      │
│   │        Library grid · Preview · Render · Tags  │      │
│   │                     │                          │      │
│   │   [2] SERVICE LAYER — Node.js                  │      │
│   │        AssetService · DatabaseService          │      │
│   │        PreviewService · RenderService (FFmpeg) │      │
│   │                     │                          │      │
│   └─────────┬───────────┴───────────┬──────────────┘      │
│             │ CSInterface.evalScript │                     │
│   [3] HOST BRIDGE — ExtendScript (.jsx)                    │
│        import file · thêm vào timeline · apply preset      │
│             │                                             │
└─────────────┼─────────────────────────────────────────────┘
              ▼
   [4] STORAGE
        SQLite DB (metadata) · Thumbnail/Proxy cache · Asset folders
        FFmpeg + FFprobe (bundled binaries)
```

**4 lớp:**

- **[1] UI Layer** — React + TypeScript + Vite. Giao diện grid, preview player, panel render, tag/search.
- **[2] Service Layer (Node.js)** — logic quét file, database, gọi FFmpeg.
  - `AssetService` — quét thư mục, thêm/xoá/sửa asset.
  - `DatabaseService` — SQLite (better-sqlite3) lưu metadata.
  - `PreviewService` — FFmpeg tạo thumbnail, proxy, waveform.
  - `RenderService` — dựng lệnh FFmpeg render/transcode + parse tiến độ.
- **[3] Host Bridge (ExtendScript)** — `.jsx` chạy trong AE/PPro qua `CSInterface.evalScript()` để import file vào project & timeline.
- **[4] Storage** — SQLite + cache thư mục thumbnail/proxy + binary FFmpeg.

---

## 4. Data model (SQLite)

```
Asset
  id            (uuid)
  name          (string)
  path          (đường dẫn file gốc)
  type          (video | audio | image | mogrt | preset)
  categoryId    (fk)
  tags          (string[] — bảng phụ asset_tags)
  duration      (giây, nếu có)
  width, height (px)
  fileSize      (bytes)
  codec / format
  thumbnailPath (ảnh preview)
  proxyPath     (video/audio proxy nhẹ để play)
  waveformPath  (ảnh waveform cho audio)
  favorite      (bool)
  dateAdded

Category   (id, name, icon, parentId)   ← cây thư mục ảo
Pack       (id, name, cover, description) ← gói asset kiểu Mister Horse
Tag        (id, name, color)
```

---

## 5. Pipeline xử lý (luồng chính)

### 5.1. Import pipeline (thêm asset vào thư viện)

```
User chọn folder/file
   ▼
Scanner quét đệ quy → lọc theo đuôi file hợp lệ
   ▼
FFprobe đọc metadata (duration, codec, resolution, bitrate)
   ▼
FFmpeg sinh:
   • thumbnail (frame giữa video / cover ảnh)
   • proxy nhẹ (h264 360p) để preview mượt
   • waveform.png (với audio)
   ▼
Ghi vào SQLite
   ▼
Hiện lên library grid (real-time, có progress)
```

### 5.2. Preview pipeline

```
Click asset → load proxy/thumbnail từ cache
   ▼
video/audio → HTML5 <video>/<audio> player (play proxy)
image        → hiện full
mogrt/preset → hiện thumbnail + metadata
```

### 5.3. Render / Export pipeline

```
Chọn asset + preset xuất (format, độ phân giải, codec, bitrate)
   ▼
RenderService dựng lệnh FFmpeg
   ▼
Spawn FFmpeg → parse stderr lấy % tiến độ → cập nhật UI progress bar
   ▼
Xuất file ra thư mục đích + báo hoàn tất
```

> Hỗ trợ hàng đợi (queue) nhiều job, batch render.

### 5.4. Host integration pipeline (đẩy vào AE/PPro)

```
Click "Add to timeline" / kéo-thả
   ▼
CSInterface.evalScript( importAsset(path, options) )
   ▼
ExtendScript (.jsx):
   • import file vào Project panel
   • add vào comp/sequence đang mở (tại playhead)
   • (MOGRT/preset → apply đúng cách của host)
   ▼
Trả kết quả về panel
```

---

## 6. Tính năng theo bản

**MVP (bản chạy được đầu tiên)**

- Panel mở trong AE/PPro
- Thêm thư mục asset → quét → hiện grid
- FFprobe metadata + FFmpeg thumbnail
- Preview video/audio/ảnh
- Import 1 asset vào timeline

**V1 (đủ dùng)**

- Category / tag / search / favorite
- Waveform cho audio
- Proxy preview mượt
- Render/transcode 1 file + preset xuất cơ bản
- Packs (gom asset thành gói)

**V2 (nâng cao)**

- Batch render + queue
- Drag-drop trực tiếp vào timeline
- Cài đặt (đường dẫn thư viện, chất lượng proxy, thư mục cache)
- Import/Export pack (chia sẻ giữa máy)
- Đóng gói MOGRT / preset apply đúng chuẩn từng host

---

## 7. Lộ trình (Roadmap theo Phase)

| Phase                     | Nội dung                                                             | Trạng thái thực tế                                                                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0. Setup**        | Scaffold CEP,`manifest.xml`, `.debug`, dev env, hello-world panel | ✅**XONG** — panel chạy thật trong Premiere Beta 26.5                                                                                                                                                                                                                 |
| **1. Library core** | Scanner + lưu trữ + React grid                                      | ✅**XONG** — quét 15.511 asset thật, lưới ảo hoá, tìm kiếm, cây danh mục, yêu thích, sắp xếp                                                                                                                                                              |
| **2. FFmpeg**       | Bundle FFmpeg/FFprobe, metadata, thumbnail, waveform, proxy           | ✅**XONG** — thumbnail `.jpg`, waveform `.png`, 360p proxy, ffprobe metadata bằng GPU acceleration                                                                                                                                                                 |
| **3. Preview**      | Xem trước video/audio/ảnh                                          | ✅**XONG** — rê chuột là xem/nghe 60fps, qua máy chủ media nội bộ hỗ trợ Range                                                                                                                                                                                 |
| **4. Render**       | RenderService + FFmpeg Transcoder + preset xuất                      | ⏸**ĐÃ GỠ** — làm xong rồi gỡ ở 0.9.1 vì không thuộc trọng tâm; mã nguồn đã xoá                                                                                                                                                                        |
| **5. Host bridge**  | ExtendScript import vào project/timeline                             | ✅**XONG (PPro)** — nút **Import** ở thanh dưới chèn tại playhead, MOGRT `importMGT`, đọc clip đang chọn trên timeline. **After Effects chưa làm**                                                                                           |
| **6. Polish**       | Power Bins, Brand Kit, Settings, hệ thiết kế                       | ✅**XONG** — Power Bins 2 tầng (Brand → Khay), hệ màu **đen + cam**, hệ thiết kế tài liệu hoá. Chọn nhiều + thanh thao tác hàng loạt **đã gỡ** (0.13); Gói Packs **đã gỡ hẳn** (0.18)                                         |
| **7. Đóng gói**  | Ký ZXP (ZXPSignCmd) + bộ cài                                       | ✅**XONG (1.0.0)** — `scripts/package-release.ps1` xuất `.zxp` có số phiên bản + hướng dẫn cài; bản phát hành tắt auto-reload và không kèm `.debug`. Còn lại: **chứng chỉ thương mại** để hết cảnh báo trên máy người khác |

> **Ghi chú:** Phase 3 và 5 được làm sớm ngay trong Phase 1 vì đó là **trọng tâm sản phẩm**
> (mục 0.2). Phase 4 (render/transcode) đã làm xong rồi **gỡ bỏ** — nó không phục vụ
> trọng tâm v1 và làm giao diện nặng thêm.
>
> **Đã phát hành 1.0.0 ngày 2026-07-27.** Gói cài: `build/release/AiO-Studio-Asset-Manager-1.0.0.zxp`.
>
> **Còn lại:** chứng chỉ code-signing thương mại (hết cảnh báo khi máy khác cài),
> hỗ trợ macOS, và cầu nối After Effects (`host/ae.jsx` mới là khung rỗng).

---

## 8. Cấu trúc thư mục dự kiến

```
AiO Studio/
├─ CSXS/
│  └─ manifest.xml            # khai báo extension (id, host, version)
├─ .debug                     # bật remote debug khi dev
├─ client/                    # UI panel (React + TS + Vite)
│  ├─ src/
│  │  ├─ components/          # Grid, PreviewPlayer, RenderPanel, Sidebar...
│  │  ├─ services/            # gọi xuống Node layer
│  │  ├─ state/               # store (zustand)
│  │  └─ index.tsx
│  └─ index.html
├─ node/                      # Service layer (Node.js)
│  ├─ AssetService.ts
│  ├─ DatabaseService.ts
│  ├─ PreviewService.ts       # FFmpeg thumbnail/proxy/waveform
│  ├─ RenderService.ts        # FFmpeg render/transcode
│  └─ scanner.ts
├─ host/                      # ExtendScript
│  ├─ index.jsx               # router evalScript
│  ├─ ppro.jsx                # logic riêng Premiere (LÀM TRƯỚC)
│  └─ ae.jsx                  # logic riêng After Effects (làm sau)
├─ bin/                       # FFmpeg + FFprobe (win/mac)
├─ lib/
│  └─ CSInterface.js
└─ PLAN.md
```

---

## 9. Rủi ro & lưu ý kỹ thuật

### 9.1. Đã gặp thật và đã xử lý

| Rủi ro                           | Thực tế xảy ra                                                                                                          | Cách đã xử lý                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Ký ZXP**                 | Premiere Beta 26.5**từ chối extension chưa ký**; `PlayerDebugMode` KHÔNG còn đủ (dự đoán ban đầu sai) | Tự ký self-signed bằng`ZXPSignCmd`, tự động hoá trong `scripts/sign-install.ps1`              |
| **Nạp tài nguyên**       | Panel nạp qua`file://` → Chromium **chặn** đọc file khác trên ổ đĩa, mọi preview đen thui              | Dựng**máy chủ media nội bộ** (127.0.0.1 + token, hỗ trợ Range)                              |
| **Hiệu năng**             | Render cả 15.511 thẻ cùng lúc làm panel treo                                                                          | **Ảo hoá lưới** — chỉ render thẻ đang nhìn thấy                                          |
| **MOGRT preview**           | Mỗi pack đặt tên preview một kiểu; có pack**không kèm preview**                                             | Ghép cặp 2 kiểu tên +**bung `thumb.png` nhúng trong gói `.mogrt`** (file .mogrt là ZIP) |
| **Kéo-thả vào timeline** | CEP**không hỗ trợ** kéo-thả kiểu hệ điều hành sang Premiere                                                | Thay bằng nút**Import** chèn tại playhead                                                      |
| **Script PowerShell**       | PowerShell 5.1 đọc sai ký tự Unicode → vỡ cú pháp                                                                  | Mọi file`.ps1` viết **ASCII thuần**                                                           |

### 9.2. Còn cần lưu ý cho các phase sau

- **Bundle FFmpeg**: phải resolve đúng path binary lúc dev vs sau khi cài → cần `getFFmpegPath()`.
  Thêm file vào `bin/` sẽ **làm đổi chữ ký** → bắt buộc chạy lại `sign-install.ps1`.
- **Không thêm thư viện native** (`better-sqlite3`, `sharp`…): Node của CEP khác Node hệ thống,
  biên dịch native sẽ hỏng. Đây là lý do **giữ JSON thay vì SQLite**.
- **Build phải là 1 file duy nhất** (`vite-plugin-singlefile`) — không tách chunk.
- **Tương thích host**: mỗi version AE/PPro map CEP version khác nhau → giữ range rộng trong `manifest.xml`.
- **AE vs PPro khác API**: ExtendScript import/timeline tách file riêng từng host (`ppro.jsx` / `ae.jsx`).

---

## 10. Bước tiếp theo

**Phase 0 và Phase 1 đã hoàn tất** (kèm Phase 3 và 5 làm sớm). Bước kế tiếp là **Phase 2 — FFmpeg**:

1. Bundle `ffmpeg.exe` + `ffprobe.exe` vào `bin/win64/`, viết `getFFmpegPath()`
2. Sinh thumbnail cho video chưa có preview (lấy khung giữa clip)
3. Sinh waveform cho audio (2.138 file đang chỉ có icon)
4. Hàng đợi chạy nền có giới hạn tiến trình song song
5. Đọc metadata bằng `ffprobe` (thời lượng, độ phân giải, codec)

> Chi tiết đầy đủ — gồm **danh sách file được sửa / cấm sửa**, quy trình build+ký,
> tiêu chí nghiệm thu và các lỗi không được lặp lại — nằm ở **[HANDOFF_PHASE2.md](HANDOFF_PHASE2.md)**.
>
> Nhật ký thay đổi chi tiết từng phiên bản: **[PROGRESS.md](PROGRESS.md)**.
