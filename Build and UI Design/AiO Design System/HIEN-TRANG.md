# Hiện trạng UI — lỗi đo được (2026-08-02)

> Em tự mở cả 5 panel + website ở 420px (kẹp cạnh timeline) và 800px (thả nổi),
> đo trên DOM, đối chiếu sổ bài học. Ảnh trong `anh-hien-trang/`.
>
> **Tin tốt: không panel nào vỡ layout** — không cái nào tràn ngang ở 420px. Vấn
> đề là **đồng bộ + rườm + vài nhãn nói dối**, đúng cảm giác "chưa ưng" của anh —
> không phải "hỏng".

---

## Xuyên suốt cả bộ

### 🔴 Bốn panel bốn kiểu thanh trên — đây là "chưa đồng bộ" rõ nhất
Mở 4 panel cạnh nhau thấy ngay 4 dáng khác nhau:
- **Re-Frames:** nút `EN` góc phải + trạng thái "(đang chờ Premiere…)".
- **Transcript:** có **dải cờ ngôn ngữ** riêng ở dưới.
- **Asset Manager:** pill xanh "Preview đã đủ" + nút cam "Thêm thư mục".
- **Power Bins:** chỉ một nút "Thêm từ timeline".

→ Thanh trên phải **một khuôn** cho cả 7 (xem spec ở [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md#5-component)):
icon nhận diện (đổi màu theo trạng thái) · tên + version · tối đa 1–2 nút · trạng
thái host nói một nơi. Nút đổi ngôn ngữ đặt cùng chỗ ở mọi panel.

---

## Theo từng phần

### 🔴 Power Bins — nhãn nói dối + nhiều chỗ trống
- Nút thanh trên ghi *"Thêm từ timeline"*, nhưng khung trống ngay dưới bảo *"Bấm
  **Thêm thư mục** ở thanh trên"* — **trỏ vào nút không tồn tại** (bài học: đổi
  logic phải rà lại câu chữ).
- Panel trái gần trống (chỉ nút "Tạo brand"), nhiều khoảng chết ở bề rộng hẹp.
- Ảnh: `anh-hien-trang/power-bins-420.png`.

### 🔴 Re-Frames — màn hình đầu quá dài
Đếm được trên một màn: hộp hướng dẫn viền cam + **preview người xám chiếm ~40% màn**
(trông như chưa làm xong) + **4 dải nhãn section** (KHUNG ĐÍCH / SHORT THEO NỘI
DUNG / CẢ SEQUENCE / XUẤT CHECK) + 3 nút. Nhiều tầng chrome trước khi tới việc.
→ Gom section bằng **bề mặt** thay vì 4 dải nhãn; thu preview lại; gộp nút phụ.
→ Ảnh: `anh-hien-trang/re-frames-420.png` và `-800.png`.

### 🟡 Transcripts — ổn, chỉ cần khớp khuôn chung
Bố cục gọn (khoanh đoạn → khung hình → cách chép → 1 nút chính). Dải cờ ngôn ngữ
là điểm khác biệt cần đưa về đúng khuôn chung với các panel. Ảnh: `transcripts-420.png`.

### 🟡 Autocut — dày nhưng có mục đích
Hai waveform (bản gốc / sau khi cắt) + segmented 3 mức + nút chính. Đúng hướng "xem
trước cái bị mất". Chủ yếu cần đồng bộ thanh trên + nhịp khoảng cách. Ảnh: `autocut-420.png`.

### 🟢 Asset Manager — đang ổn nhất bộ
Sidebar trái + lưới phải + empty state rõ. Là mẫu tốt để các panel khác nhìn theo.
Ảnh: `asset-manager-420.png`.

---

## 🔴 Website bán hàng
Tổng thể **đã đẹp và đúng brand** (nền tối, cam tiết chế, hero mạnh) — cần *dọn nhất
quán*, không làm lại. Ảnh: `website-desktop.png`, `website-mobile.png`.

1. **Trộn Việt/Anh giữa trang:** hero tiếng Việt, nhưng tiêu đề các mục lại tiếng
   Anh — *"8 Native Tools"*, *"Built for Pros Who Refuse Web Clutter"*, *"Crafted
   with 5 Years of Professional NLE Passion"*, cả bảng giá. Đọc bị giật. Chốt một
   ngôn ngữ chủ đạo (hoặc song ngữ theo khuôn nhất quán).
2. **Con số đá nhau:** chỗ ghi *"8 Native Tools / all 8 Native Panels"*, nhưng mục
   feature chỉ kể **4 tool**. Thực tế mới dựng **7 panel** (Auto Cut Short chưa có
   code) — nói "8" là tính cả cái chưa tồn tại. Khách đối chiếu sẽ thấy. Thống nhất
   con số với thực tế sản phẩm.
