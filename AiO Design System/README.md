# AiO Design System — hồ sơ design để làm việc với Claude design

> Lập 2026-08-02. Anh Tiến: *"trước tiên anh cần một Design System để đem thẳng
> vào Claude design"* + *"research UI để anh làm"*.
>
> Folder này gom **mọi thứ về design** để anh cầm đi thiết kế từng phần bằng
> Claude design, rồi báo em ghép vào code panel thật.

---

## Có gì ở đây

| File | Là gì | Dùng khi nào |
|---|---|---|
| **[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)** | Hệ thiết kế tự chứa — màu, chữ, khoảng cách, component, luật, cả `tokens.css` | **Dán THẲNG vào Claude design** làm ngữ cảnh |
| **[style-guide.html](style-guide.html)** | Bản render xem bằng MẮT — mở file là thấy toàn bộ hệ thống trông thế nào | Cho Claude design *nhìn*; đối chiếu khi review |
| **[RESEARCH-UI.md](RESEARCH-UI.md)** | Nghiên cứu đối thủ (AutoCut/AutoPod) + tool pro dark (Linear/Raycast) + Adobe | Lấy hướng đúng ngành trước khi thiết kế |
| **[HIEN-TRANG.md](HIEN-TRANG.md)** | Lỗi UI đo được trên 5 panel + website (2026-08-02) | Biết cần sửa gì, có bằng chứng |
| **anh-hien-trang/** | Ảnh chụp thật 5 panel (420px + 800px) + website | Xem chính xác đang trông thế nào |

---

## Cách dùng với Claude design

1. Mở [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), **copy toàn bộ** dán vào Claude design.
2. Kèm câu: *"Thiết kế theo đúng design system 'Studio Console' này, dùng đúng các
   biến màu/cỡ/khoảng cách, tuân thủ mục KHÔNG ĐƯỢC LÀM. Panel tối sống cạnh
   timeline Adobe Premiere, chạy được ở bề rộng hẹp ~200px."*
3. Muốn Claude design *nhìn thấy* hệ thống: mở [style-guide.html](style-guide.html)
   (double-click là chạy, không cần server), chụp màn hình đưa vào.
4. Lấy cảm hứng đúng ngành từ [RESEARCH-UI.md](RESEARCH-UI.md).
5. Ra bản ưng → gửi em, **em ghép vào nguồn rồi build** (không sửa thẳng `dist/`).

---

## ⚠️ Hai việc cần biết

1. **Có một quyết định lớn chưa chốt** — accent **CAM** (bản sắc riêng) hay **XANH**
   giống Adobe. Nó đổi cả hệ màu. Xem mục đầu [RESEARCH-UI.md](RESEARCH-UI.md).
   Gợi ý của em: giữ cam.
2. **Folder `design-system/` (cũ) KHÁC folder này** và **chưa dời vào đây** — vì nó
   là hạ tầng máy chạy: `tokens.css` (nguồn chân lý) + script đồng bộ + viewer, có
   **32 file trỏ tới bằng đường dẫn** (vite.config của từng panel, CLAUDE.md…). Dời
   nó phải sửa 32 chỗ + build lại cả 4 panel để kiểm — là một việc riêng, rủi ro,
   em không dời ẩu. Nếu anh muốn gộp cả nó vào đây, nói em làm cẩn thận từng bước.
