# CHECKLIST kiểm duyệt — chạy TRƯỚC khi nhận một bản Claude design

> Gộp ưu tiên của ui-ux-pro-max (1→10) + luật Studio Console + bài học đã vấp.
> Mỗi lần Claude design ra một bản, soi qua bảng này. Xếp theo mức chặn.

## 🔴 Chặn (sai là trả lại, không bàn)

- [ ] **Tương phản** chữ ≥ 4.5:1, icon/ranh giới ≥ 3:1 — đo TRỘN ALPHA, cả sáng lẫn tối.
- [ ] **Focus thấy được** trên MỌI control (`:focus-visible` ring) — không `outline:none` trần.
- [ ] **Bàn phím đi hết** — Tab tới được mọi thứ, Enter/Space kích hoạt, thứ tự khớp mắt.
- [ ] **Icon là SVG**, không emoji/ký tự; không cờ emoji; kiểm ở đúng cỡ sẽ dùng.
- [ ] **Nút:** không IN HOA, không `letter-spacing`, chữ trên cam là `--accent-on`.
- [ ] **Sống ở ~200px** (panel) — không tràn ngang; website không tràn ở 375px.
- [ ] **Một CTA chính** mỗi màn hình; việc phá huỷ đặt xa, họ danger, nói hậu quả bằng số.
- [ ] **Dùng đúng token** — không màu/cỡ chế mới ngoài `tokens.css`.
- [ ] **Control TÍNH LẠI THẬT** — đổi một lựa chọn thì MỌI con số phụ thuộc đổi theo (§8b).
      Chỉ đổi màu nút = trả lại.
- [ ] **Khung ngoài KHÔNG `overflow:hidden`** — cửa sổ thấp là mất nút chính.

## 🟡 Phải có

- [ ] **5 trạng thái** đủ: thường/hover/nhấn/focus/vô hiệu (+ đang chạy nếu tác vụ dài).
- [ ] **Tiến trình rõ** cho bước > 30s: số nhúc nhích + màu xong (đây là chỗ thắng đối thủ).
- [ ] **Chỉ báo khi THẤT BẠI** — việc thành công người dùng đã thấy thì im lặng.
- [ ] **Tách nhóm bằng BỀ MẶT**, không xếp nhiều nhãn xám chồng nhau.
- [ ] **Phân cấp bằng cỡ + độ đậm**, không bằng `opacity` (opacity làm trượt tương phản).
- [ ] **Thang chữ không nâng cả cụm** — to hơn thì dùng bậc cao hơn ở đúng chỗ.
- [ ] **Chuyển động 150ms** phản hồi bấm; hình minh hoạ mới được chậm, và phải DIỄN GIẢI.
- [ ] `prefers-reduced-motion` được tôn trọng (vẫn hiện đủ ở trạng thái cuối).
- [ ] **Nhãn = việc nó làm**; một thông điệp một nơi; không chú thích dài.
- [ ] **Empty state:** icon + câu nói phải làm gì + 1 CTA trỏ đúng nút CÓ THẬT.
- [ ] **Không lỗ trống** — chỗ dôi ra được dời/cho to ra/gom thành MỘT khoảng nghỉ (§8).
- [ ] **Hai cột kết thúc bằng nhau ở đáy** — đo, đừng ước lượng bằng mắt.
- [ ] **Một con số một nơi** — quét cả màn xem có số nào hiện hai chỗ không.
- [ ] **Bỏ câu mô tả nói lại thứ nút bên cạnh đã nói.**

## 🟢 Nên soi

- [ ] Vẽ vật thể Premiere đúng màu/đúng tầng (clip xanh, audio lá, caption vàng-trên).
- [ ] Xổ/accordion không chứa đúng một mục; segmented chỉ cho 2–3, 4+ thì dropdown.
- [ ] Thanh cuộn tối tuỳ biến (không để trắng mặc định Windows).
- [ ] Z-index theo thang (`--z-*`), không đặt số bừa.
- [ ] **Bản thương mại không lộ công cụ nền** (tên OSS, thông số, đường dẫn, tên file).
- [ ] Website: một ngôn ngữ chủ đạo; con số khớp thực tế sản phẩm.
- [ ] Số **kết quả** ăn màu `--ok`, số **đầu vào** để `--text-1` — không cho xanh cả cụm.
- [ ] Xuất SVG cho Illustrator: không `rgba()`, `id` không dấu cách, chữ thành đường vẽ (§16).

## Phép kiểm bằng SỐ (không tin bằng mắt suông)

- [ ] `chiều cao control − line-height ≥ 6px` cho mọi nút.
- [ ] Đo trên **panel/bề rộng THẬT**, cả 200px lẫn rộng — không đo mẫu nhỏ tự dựng.
- [ ] **Xếp cạnh bản panel anh em** (`so-sanh.html`) — token khớp KHÔNG có nghĩa nhìn giống.
- [ ] Số đo vô lý → **nghi công cụ đo trước**, đừng vội sửa code.
- [ ] Kiểm ở **nhiều chiều cao cửa sổ** (760 · 900 · 1400px), không chỉ một cỡ.
- [ ] File xuất cho AI: dựng thử bằng bộ đọc SVG 1.1 nghiêm ngặt, **đừng tin trình duyệt**.
