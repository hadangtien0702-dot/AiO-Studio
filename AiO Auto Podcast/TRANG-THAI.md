# AiO Auto Podcast — BẢNG THEO DÕI: CÁI GÌ XONG, CÁI GÌ CHƯA

> Anh Tiến yêu cầu 04/08/2026 khi test gặp nhiều trở ngại: *"em tạo cho anh
> một track list cái gì đã xong và cái nào [chưa] em nhé"*.
>
> Luật của bảng: chỉ được ghi ✅ khi có SỐ ĐO thật (ghi trong PROGRESS.md).
> Cập nhật mỗi phiên làm việc. Chi tiết kỹ thuật: `TINH-NANG.md` + `PROGRESS.md`.

*Cập nhật lần cuối: 04/08/2026 — panel v0.3.3, host v0.3.1.*

---

## ✅ XONG — đã đo, đã cài trên máy anh

| Tính năng | Bằng chứng đo được | Ngày |
|---|---|---|
| **Cắt theo người nói** (2 người, mic riêng, bản sao timeline) | 124 đoạn trên liệu 44 phút thật, cấu trúc track khớp từng con số, 0 cảnh báo | 04/08 |
| **Chọn sequence làm việc** ngay trên panel | 11 sequence hiện đủ, đổi xuôi/ngược khớp cả ô chọn + panel + Premiere | 04/08 |
| **Cam chung (wide)** — gán được, im >2s tự về toàn cảnh | 14 đoạn wide 2:02 đúng chỗ không ai nói; bộ kiểm 11/11 ranh 0ms | 04/08 |
| **V và A kể cùng một chuyện** — tiếng dính liền cam tự ghi chú "tiếng của cam V1/cam chung", gán cam chung là tiếng của nó tự về "—" | đo trên "test thực tế": 3/3 hàng tiếng hiện đúng gốc | 04/08 |
| **Tiếng mic không còn xé 2 track L/R** (tách bản mono đặt cạnh file gốc) | 103 clip tiếng đúng số lượt (trước: 206); A1/A2 sạch | 04/08 |
| **Sàn im lặng TỰ ĐO theo file** (bỏ số cứng −50dB) | nghe rõ 23%→28,1% thời lượng; 0/6 → 12/12 trên liệu tiếng nhỏ | 04/08 |
| **Autocut không còn xoá mic** khi cắt sequence multicam | A1 sạch tiếng camera (trước lẫn 23 clip); 20/20 phép kiểm | 04/08 |
| **Luật tài nguyên 50–70%** cho cả 7 panel | 12/12 mục kiểm; đo thật: ghim trần 70% còn nhanh hơn 31% | 04/08 |
| Hai chốt an toàn: chặn gán tiếng cam làm mic · chặn bản dựng 1 lượt | tái hiện ca gán nhầm: chặn đúng, không dựng bậy | 02/08 |
| Nhớ bước gán theo từng sequence | quay lại sequence cũ, bản đồ tự điền | 01/08 |
| Tự sync bằng thuật toán (spike — chưa thành nút) | lệch 0,59 frame so với PluralEyes; import vào Premiere khớp 5/5 clip | 03/08 |

## 🔧 CHƯA XONG — biết rồi, chưa làm / đang chờ đáp án

| Việc | Vì sao chưa | Cần gì để làm |
|---|---|---|
| **Độ CHÍNH XÁC cắt trên liệu thật** — anh chỉ ra 3 mốc sai (thiếu hình người nữ, cắt nhầm cam) | ngưỡng nghe đang mong manh (mic thật chênh chỉ 6–7dB); sửa mù là đổi kiểu sai | **mốc thời gian sai từ tai anh** — càng nhiều càng tốt |
| Nói chồng nhau → về cam chung | cùng lý do trên | đáp án tai |
| Track nhiều clip (cam bấm stop/start giữa buổi) | MVP đang đòi 1 clip liền/track | làm được ngay khi anh cần |
| Tự sync thành NÚT trong panel (Level 3: trỏ folder là xong) | mới xong phần thuật toán + import | quyết định ưu tiên |
| Panel chặn/cảnh báo khi sequence CHƯA có mic riêng (như "test thực tế") | mới có ghi chú xám, chưa chặn hẳn | quyết định cách hiển thị |
| File mono 244MB/mic hơi nặng | FLAC nhẹ hơn ~60% nhưng chưa thử với Premiere | anh gật thì em thử |

## 🙋 ĐANG CHỜ TAI ANH — máy không tự chấm được

1. **Nghe bản dựng** `AiO-WIDE-TEST - Podcast Cut` (có cam chung) và
   `PODCAST BUOI2 da sync - Podcast Cut (4)` (bản mono sạch) — cắt có đúng
   nhịp không, ghi giúp em mốc nào sai.
2. **Chấm 12 clip** trong `file pr for test\podcast-nghe-kiem\_BANG-CHAM.csv`.
3. **Sync lại "test thực tế" CÓ 2 file mic riêng** — hiện nó chỉ có tiếng
   camera nên tool không nghe được ai đang nói.
4. Xoá tay các sequence thử: `AiO-THU-KENH` · `AiO-THU-DONGBO` ·
   `AiO-THU-DONGBO-2` (Premiere không cho panel xoá sequence).
