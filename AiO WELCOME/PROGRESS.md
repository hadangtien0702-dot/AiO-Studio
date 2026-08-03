# AiO Welcome — Nhật ký Tiến độ (PROGRESS.md)

## [1.5.0] - 2026-08-03
### Added - KHỞI TẠO PANEL AIO WELCOME HUB

Bối cảnh: Tạo panel trung tâm chào mừng và tổng hợp toàn bộ 7 công cụ tự động hóa trong bộ sản phẩm AiO Studio cho Adobe Premiere Pro.

### Đã làm
- **`dist/tokens.css`**: Nhúng bộ token màu Dominic ấm (`#181818`, `#141414`), accent cam `#f86820` và font Inter variable đính kèm.
- **`dist/index.html`**: Giao diện Hub trung tâm tổng hợp 7 tool:
  1. **AiO Autocut** (Cắt lọc khoảng lặng AI)
  2. **AiO Auto Podcast** (Hậu kỳ podcast đa mic)
  3. **AiO Auto Re-Frames** (Reframe video 9:16)
  4. **AiO Guide Frame** (Khung an toàn UI MXH)
  5. **AiO Asset Manager** (Kho tài nguyên FX / Sound / Preset)
  6. **AiO Power Bins** (Sắp xếp Bin & nhãn màu)
  7. **AiO Transcripts** (Bóc băng & đồng bộ phụ đề)
- **Tính năng mở rộng**: Thanh tìm kiếm keyword realtime, bộ lọc theo danh mục, nút mở nhanh CEP extension, Modal preview thông tin tool.
- **`CSXS/manifest.xml`**: Cấu hình Modeless window `1020x720` (Min `340x500`).
