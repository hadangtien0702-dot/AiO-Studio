# design/ — hồ sơ research UI để thiết kế lại từng phần

> Lập 2026-08-02. Anh Tiến: *"research UI để anh làm em nha — anh sẽ tạo một
> folder tên design để thiết kế riêng bằng Claude design, thiết kế riêng từng
> phần, sau đó sẽ chỉnh sửa."*
>
> Folder này **không phải code**. Nó là **tư liệu để anh cầm đi thiết kế**:
> mỗi phần một bản research gồm *hiện trạng đo được → lỗi cụ thể → ràng buộc
> bắt buộc → hướng tham khảo đối thủ → prompt dán vào Claude design*.

---

## Cách dùng

1. Mở phần anh muốn làm (bảng dưới), đọc từ trên xuống.
2. Xem ảnh hiện trạng trong `anh-hien-trang/` để thấy chính xác đang trông thế nào.
3. Đọc mục **Ràng buộc bắt buộc** — copy nguyên khối đó vào Claude design để bản
   thiết kế không phá vỡ hệ thống đã có (màu, cỡ chữ, chiều cao nút, luật đã học).
4. Đọc **Hướng tham khảo** để lấy cảm hứng đúng ngành (đối thủ + tool pro dark).
5. Dùng **Prompt gợi ý** làm điểm khởi đầu — sửa theo ý anh rồi đưa Claude design.
6. Ra bản ưng → báo em, **em mới là người ghép vào code panel thật** (không sửa
   trực tiếp `dist/`, sửa nguồn rồi build).

---

## Bản đồ các phần

| # | Phần | File | Mức ưu tiên (theo lỗi đo được) |
|---|------|------|------|
| 00 | **Ràng buộc CHUNG** (đọc trước mọi phần) | [00-rang-buoc-chung.md](00-rang-buoc-chung.md) | — |
| 01 | **Thanh trên** (dùng cho cả 7 panel) | [01-thanh-tren.md](01-thanh-tren.md) | 🔴 Cao — 4 panel 4 kiểu |
| 02 | Re-Frames | [02-re-frames.md](02-re-frames.md) | 🔴 Cao — màn đầu quá dài |
| 03 | Power Bins | [03-power-bins.md](03-power-bins.md) | 🔴 Cao — nhãn nói dối + nhiều chỗ trống |
| 04 | Transcripts | [04-transcripts.md](04-transcripts.md) | 🟡 Vừa |
| 05 | Autocut | [05-autocut.md](05-autocut.md) | 🟡 Vừa |
| 06 | Asset Manager | [06-asset-manager.md](06-asset-manager.md) | 🟢 Thấp — đang ổn nhất |
| 07 | Website bán hàng | [07-website.md](07-website.md) | 🔴 Cao — trộn Việt/Anh + số 8/4/7 đá nhau |

---

## Nguyên tắc xuyên suốt (rút gọn — chi tiết ở file 00)

- **Studio Console**: tối, gọn, nội dung là chính. Panel sống cạnh timeline
  Premiere — không tranh sáng, không hero, không chữ to gây ấn tượng.
- **Đồng bộ trước, đẹp sau.** Lỗi lớn nhất anh cảm thấy là *"chưa đồng bộ"* —
  bốn panel phải trông như một nhà làm ra, không phải bốn.
- **Sửa gốc `tokens.css`, không sửa bản copy.** Mọi bản thiết kế mới phải map
  được về token đang có; cần token mới thì thêm vào nguồn.
- **Nhẹ để nhanh, không nặng để đẹp.** Máy khách yếu hơn máy anh.

---

## Ảnh hiện trạng

Trong `anh-hien-trang/` — chụp từ file `dist` thật (đúng bản đang cài trong
Premiere), ở hai bề rộng: **420px** (kẹp cạnh timeline) và **800px** (thả nổi).
Đo 2026-08-02, không panel nào tràn ngang — vấn đề là *đồng bộ + rườm + polish*,
không phải *vỡ layout*.
