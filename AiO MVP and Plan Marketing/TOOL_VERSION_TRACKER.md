# AIO STUDIO — BẢNG THEO DÕI PHIÊN BẢN CHUẨN XÁC & NHẬT KÝ CẬP NHẬT (VERIFIED VERSION TRACKER)

> **Tài liệu theo dõi chính xác 100% phiên bản kiểm tra từ file `CSXS/manifest.xml` & `package.json` của từng thư mục dự án.**
> **Thời gian đối soát thực tế:** 2026-08-07

---

## 📊 1. BẢNG TỔNG HỢP PHIÊN BẢN CHUẨN XÁC CỦA CÁC TOOL (VERIFIED MASTER DASHBOARD)

| STT | Tên Công Cụ (Tool Folder) | Phiên Bản Chuẩn (Manifest / Actual) | Extension ID (Bundle ID) | Cổng Debug | Trạng Thái (Status) | Ghi Chú Tính Năng & Phiên Bản |
| :-: | :--- | :-: | :--- | :-: | :-: | :--- |
| **1** | **AiO Asset Manager** | `v2.0.0` | `com.aiostudio.assetmanager` | `8088` | 🟢 Stable | Quản lý 28.846+ tài nguyên, xem trước sóng âm/video <1s, WebP q80, chèn đúng track. |
| **2** | **AiO Power Bins** | `v2.0.0` | `com.aiostudio.powerbin.panel` | `8090` | 🟢 Stable | Universal Brand Kit tự động hiện ở MỌI project Premiere mới toanh không cần re-import. |
| **3** | **AiO Transcripts** | `v2.4.0` | `com.aiostudio.transcript.panel` | `8091` | 🟢 Stable | Speech-to-Text siêu tốc (60p ➔ 14s), ngắt dòng ngắn chuẩn (193 ➔ 42 ký tự), Caption hoạt hình. |
| **4** | **AiO Autocut** | `v1.5.0` | `com.aiostudio.autocut.panel` | `8089` | 🟢 Stable | Dò khoảng lặng (Silence removal), cắt dồn clip thô 1-click, LGPL FFmpeg, Undo 100%. |
| **5** | **AiO WELCOME** | `v1.5.0` | `com.aio.welcome` | `8087` | 🟢 Stable | Panel chào mừng, hướng dẫn khởi tạo & chọn nhanh các công cụ AiO Studio. |
| **6** | **AiO Auto Re-Frames** | `v0.5.0` *(UI v0.5.1)* | `com.aiostudio.reframe.panel` | `8092` | 🟢 Stable | Redesign UI Studio Console, Reframe ngang 16:9 ➔ Dọc 9:16 bám chủ thể bằng AI, tự lưu `rf__luuTruoc`. |
| **7** | **AiO Auto Guideline Frame** | `v0.2.0` | `com.aiostudio.guideframe.panel` | `8096` | 🟢 Stable | Khung Safe Zone 10 nền tảng (53 vùng) & lưới bố cục hiển thị trên Premiere Monitor 0.2s. |
| **8** | **AiO Auto Podcast** | `v0.1.0` *(Dev v0.3.1)* | `com.aiostudio.podcast.panel` | `8093` | 🟡 Active Dev | Dựng Multicam Podcast tự động theo giọng nói, chống trôi lip-sync >90m, mixed sample-rate. |
| **9** | **AiO Auto Cut Short** | `v0.0.3` | `com.aiostudio.cutshort` | `8094` | 🟡 Active Dev | Thuật toán dò điểm cao trào âm thanh (peaks) & hỏi-đáp để trích xuất clip Short 60s. |
| **10**| **AiO Music & SFX** | `v1.0.0` | `com.aiostudio.music` | `8097` | 🟢 UI Ready | Kho BGM, Smart Auto-Ducking né giọng, Auto Beat Sync, Auto-Fit vừa khít video, Tách Stem. |
| **11**| **AiO WebDesign & Store** | `v0.1.0` | Next.js + Drizzle | `3000` | 🟡 Active Dev | Web bán hàng & trang quản trị cấp Key tự động (LemonSqueezy Subscriptions). |

---

## 🔍 2. CHI TIẾT ĐỐI SOÁT TỪNG FOLDER TRONG WORKSPACE

### 📁 1. `AiO Asset Manager`
- **File kiểm chứng:** `AiO Asset Manager/CSXS/manifest.xml` ➔ `ExtensionBundleVersion="2.0.0"`
- **Extension ID:** `com.aiostudio.assetmanager` (Cổng `8088`)
- **Trạng thái:** Phiên bản **v2.0.0** hoạt động hoàn chỉnh với 28.846 assets.

### 📁 2. `AiO Power Bins`
- **File kiểm chứng:** `AiO Power Bins/CSXS/manifest.xml` ➔ `ExtensionBundleVersion="2.0.0"`
- **Extension ID:** `com.aiostudio.powerbin.panel` (Cổng `8090`)
- **Trạng thái:** Phiên bản **v2.0.0** tự động mang Brand Kit sang mọi dự án Premiere mới.

### 💬 3. `AiO Transcripts`
- **File kiểm chứng:** `AiO Transcripts/CSXS/manifest.xml` & `package.json` ➔ `Version="2.4.0"`
- **Extension ID:** `com.aiostudio.transcript.panel` (Cổng `8091`)
- **Trạng thái:** Phiên bản **v2.4.0** Speech-to-Text 60 phút trong 14s.

### 🎬 4. `AiO Autocut`
- **File kiểm chứng:** `AiO Autocut/CSXS/manifest.xml` & `package.json` ➔ `Version="1.5.0"`
- **Extension ID:** `com.aiostudio.autocut.panel` (Cổng `8089`)
- **Trạng thái:** Phiên bản **v1.5.0** đã chuẩn hóa FFmpeg LGPL bản quyền.

### 🏠 5. `AiO WELCOME`
- **File kiểm chứng:** `AiO WELCOME/CSXS/manifest.xml` ➔ `ExtensionBundleVersion="1.5.0"`
- **Extension ID:** `com.aio.welcome` (Cổng `8087`)
- **Trạng thái:** Phiên bản **v1.5.0** panel mở màn của AiO Studio.

### 📱 6. `AiO Auto Re-Frames`
- **File kiểm chứng:** `AiO Auto Re-Frames/CSXS/manifest.xml` ➔ `Version="0.5.0"` (UI nâng cấp `v0.5.1`)
- **Extension ID:** `com.aiostudio.reframe.panel` (Cổng `8092`)
- **Trạng thái:** Phiên bản **v0.5.0** có bảo hiểm tự lưu project `rf__luuTruoc`.

### 📐 7. `AiO Auto Guideline Frame`
- **File kiểm chứng:** `AiO Auto Guiline Frame/CSXS/manifest.xml` ➔ `Version="0.2.0"`
- **Extension ID:** `com.aiostudio.guideframe.panel` (Cổng `8096`)
- **Trạng thái:** Phiên bản **v0.2.0** vẽ Safe Zone 53 vùng trong 0.74s.

### 🎙️ 8. `AiO Auto Podcast`
- **File kiểm chứng:** `AiO Auto Podcast/CSXS/manifest.xml` ➔ `Version="0.1.0"` (Lõi phát triển `v0.3.1`)
- **Extension ID:** `com.aiostudio.podcast.panel` (Cổng `8093`)
- **Trạng thái:** Lõi **v0.3.1** xử lý Multicam Podcast chống lệch tiếng >90 phút.

### ✂️ 9. `AiO Auto Cut Short`
- **File kiểm chứng:** `AiO Auto Cut Short/PROGRESS.md` ➔ `Version="0.0.3"`
- **Extension ID:** `com.aiostudio.cutshort` (Cổng `8094`)
- **Trạng thái:** Lõi pipeline **v0.0.3** trích xuất khoảnh khắc đắt giá 60s ngắt câu chuẩn 0,000s.

### 🎵 10. `AiO Music & SFX`
- **File kiểm chứng:** `AiO Mussic/index.html` ➔ `Version="1.0.0"`
- **Extension ID:** `com.aiostudio.music` (Cổng `8097`)
- **Trạng thái:** Bản thiết kế UI Studio Console **v1.0.0** hoàn chỉnh.

### 🕸️ 11. `AiO WebDesign & Store`
- **File kiểm chứng:** `AiO WebDessign/package.json` ➔ `Version="0.1.0"`
- **Trạng thái:** Web Next.js bán hàng & quản trị cấp Key tự động **v0.1.0**.

---

## 🛠️ 3. QUY TRÌNH QUẢN LÝ PHIÊN BẢN ĐỒNG BỘ (VERSION SYNC RULE)

Để tránh lệch phiên bản giữa UI, `manifest.xml` và `package.json`:
1. Mỗi khi nâng cấp phiên bản (ví dụ từ `v1.5.0` ➔ `v1.6.0`), phải sửa đồng thời ở:
   - `CSXS/manifest.xml` (thẻ `ExtensionBundleVersion` và `Extension Version`).
   - `client/package.json` (thẻ `version`).
   - Header Topbar của giao diện HTML/React (`dist/index.html`).
2. Ghi nhật ký vào file [TOOL_VERSION_TRACKER.md](file:///e:/2026/Production/AiO%20Studio/TOOL_VERSION_TRACKER.md).

---

*Tài liệu kiểm tra & đối soát phiên bản thực tế thuộc hệ sinh thái AiO Studio 2026.*
