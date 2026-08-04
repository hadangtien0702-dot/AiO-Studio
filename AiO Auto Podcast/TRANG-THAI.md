# AiO Auto Podcast — BẢNG THEO DÕI: CÁI GÌ XONG, CÁI GÌ CHƯA

> Anh Tiến yêu cầu 04/08/2026 khi test gặp nhiều trở ngại: *"em tạo cho anh
> một track list cái gì đã xong và cái nào [chưa] em nhé"*. Và ngay sau đó:
> *"ủa anh thấy còn nhiều lỗi lắm mà em"* — anh đúng, bản đầu của bảng này
> khoe phần xong nhiều quá. Đã sắp lại: **LỖI ĐỨNG TRÊN CÙNG**.
>
> Luật của bảng: chỉ được ghi ✅ khi có SỐ ĐO thật (ghi trong PROGRESS.md).
> Cập nhật mỗi phiên làm việc. Chi tiết kỹ thuật: `TINH-NANG.md` + `PROGRESS.md`.

*Cập nhật lần cuối: 04/08/2026 22:47 — panel v0.4.1, host v0.4.1.
Mới nhất: **màu nhãn theo NGƯỜI** sau mỗi lần cắt — cam + mic cùng người
cùng màu (khớp màu chip panel), cam chung màu nâu; đo ngược trên bản cắt
buổi 1: V1+A1=nhãn 4, V2+A2=nhãn 8, wide=14, từng cặp cùng màu.*
Mới trong v0.4.0 — **"Thêm mic từ file — TỰ SYNC"** (giải triệt để bài toán
đầu vào, anh Tiến duyệt tối 04/08): chọn 2–6 file mic → tool tự đo mốc bằng
tương quan chéo (lệch PluralEyes 0,19–0,29 frame trên liệu thật) → tự dựng
sequence "AiO Sync" → TỰ GỢI Ý gán theo thứ tự → bấm Cắt. E2E đo thật:
sync 48s + cắt 32s = 103 lượt khớp từng số bản chuẩn, không thao tác tay.
Kèm: cảnh báo "mic dán đầu clip cam", tự gợi ý gán cho sequence lạ, cổng
kiểm mới kiem-sync 9/9. CHỜ TAY ANH: bấm nút thật (dialog chọn file em mới
kiểm bằng stub), và nghe bản cắt.*
Mới trong v0.3.6 (từ ca anh test "căn bản nhất" bị kẹt): lỗi gán chỉ ĐÍCH
DANH ai thiếu gì; lỗi trước-khi-chạy đổi tiêu đề "CHƯA CHẠY — GÁN CHƯA ĐỦ";
thông báo một-người-nói dạy luôn "cần FILE MIC RIÊNG trong sequence".
⚠️ Project AiO-Podcast-Test bị mở lại không lưu → mic + các bản Cut hôm nay
bay sạch; sequence "test thực tế" anh sync lại chỉ có tiếng cam (sync chuẩn,
lệch PluralEyes đúng 1 frame) — đang chờ anh chốt đường đưa mic vào.*
Mới trong v0.3.5: tuỳ chọn "Giữ tiếng liền mạch" cạnh nút Dựng (anh xin
đường nghe thử — chỉ cắt hình, tiếng mic nguyên vẹn). Trước đó v0.3.4:
thất bại hiện KHUNG TO kèm số đo từng người. "test thực tế" đã được thay
mic thật vào (15:44) — tool chạy được trên nó rồi. Việc kế tiếp chờ anh
Tiến chốt: (1) nới luật onset cứu ~2-3/12 mốc lỗi; (2) buổi thu sau sửa
khâu mic (line-in cam Trọng đang câm −75,5 dB, mic cài xa miệng).*

---

## ⛔ NÓI THẲNG: SẢN PHẨM CHƯA DÙNG ĐƯỢC ĐỂ GIAO KHÁCH

**Lỗi số 1 — nhát cắt còn SAI trên liệu thật.** Anh Tiến nghe và chỉ ra
nhiều mốc: người nữ nói mà không lên hình/tiếng, đang nói thì cắt nhầm
sang người nam. Gốc đã đo được: mic thật chênh nhau chỉ 6–7 dB (liệu
tổng hợp trước giờ chênh 16 dB), tool chỉ **nghe rõ 28% thời lượng** —
72% còn lại là đoán. Mọi thứ ✅ bên dưới chỉ là MẢNH KỸ THUẬT; chừng nào
lỗi này chưa hết thì sản phẩm chưa xong.

## ⛔ LỖI ĐANG MỞ — anh đã báo / em đã thấy

| # | Lỗi | Hiện trạng |
|---|---|---|
| 1 | **Cắt sai người trên liệu thật** — anh chấm 12 marker, "nữ nói mà hình nam" | **ĐÃ CÓ CHẨN ĐOÁN (14:57 04/08)** từ 12 marker + soi mắt 5 mốc: (B) ~5 mốc **mic sai phía** — Dilys nói mà mic Trọng to hơn chính mic cô ấy 10 dB → thuật toán nào so âm lượng cũng thua, gốc ở khâu THU; (A) ~2 mốc não nghe đúng mà luật đổi người quá chặt → sửa được bằng code; (C) ~5 mốc vùng mù/đối đáp nhanh. Chờ anh xác nhận cách đặt mic buổi đó |
| 2 | **Hai người nói chồng nhau** — hình nhảy loạn hoặc kẹt một người | Chưa làm luật riêng; đợi cùng bộ đáp án với lỗi 1 |
| 3 | **Sequence sync bằng Premiere chỉ có tiếng cam** → tool không chạy được, thông báo chưa dạy người dùng cách sửa | Mới có ghi chú xám "tiếng của cam V1"; chưa có hướng dẫn "sync kèm 2 file mic" ngay trên panel. Riêng "test thực tế" em đã thay mic thật vào (04/08 15:44, vị trí theo PluralEyes lệch ≤1 frame) — tool chạy được trên nó rồi |
| 4 | **Đầu bản dựng trống ~1,6 giây** (vùng phủ bắt đầu từ mốc mic, không phải 0) | Mới phát hiện 04/08 khi đo lỗ trống; nhìn như lỗi dù là chủ ý — cần quyết cách xử lý |
| 5 | *(chỗ cho các lỗi anh thấy thêm — báo em từng dòng: mốc thời gian + hiện tượng)* | |

Đã đo để loại trừ: bản dựng **không có lỗ trống** giữa chừng (0 lỗ trên
cả 2 bản, hình phủ kín 1,6s → cuối) — vùng "trống" anh thấy là track của
người bị cắt nhầm, không phải mất đoạn.

## ✅ MẢNH KỸ THUẬT ĐÃ CHẠY ĐÚNG — có số đo, đã cài trên máy anh
*(xong mảnh ≠ xong sản phẩm — sản phẩm chỉ xong khi hết mục ⛔ ở trên)*

| Tính năng | Bằng chứng đo được | Ngày |
|---|---|---|
| **Cắt theo người nói** (2 người, mic riêng, bản sao timeline) | 124 đoạn trên liệu 44 phút thật, cấu trúc track khớp từng con số, 0 cảnh báo | 04/08 |
| **Giữ tiếng liền mạch** (tuỳ chọn cạnh nút Dựng — chỉ cắt hình, tiếng mic nguyên vẹn để nghe thử) | "test thực tế - Podcast Cut (2)": hình 51+52 clip y bản thường, tiếng A1/A2 mỗi track đúng 1 clip liền 1,6s→2655s, dựng 32 giây | 04/08 |
| **Chọn sequence làm việc** ngay trên panel | 11 sequence hiện đủ, đổi xuôi/ngược khớp cả ô chọn + panel + Premiere | 04/08 |
| **Cam chung (wide)** — gán được, im >2s tự về toàn cảnh | 14 đoạn wide 2:02 đúng chỗ không ai nói; bộ kiểm 11/11 ranh 0ms | 04/08 |
| **V và A kể cùng một chuyện** — tiếng dính liền cam tự ghi chú "tiếng của cam V1/cam chung", gán cam chung là tiếng của nó tự về "—" | đo trên "test thực tế": 3/3 hàng tiếng hiện đúng gốc | 04/08 |
| **Tiếng mic không còn xé 2 track L/R** (tách bản mono đặt cạnh file gốc) | 103 clip tiếng đúng số lượt (trước: 206); A1/A2 sạch | 04/08 |
| **Sàn im lặng TỰ ĐO theo file** (bỏ số cứng −50dB) | nghe rõ 23%→28,1% thời lượng; 0/6 → 12/12 trên liệu tiếng nhỏ | 04/08 |
| **Autocut không còn xoá mic** khi cắt sequence multicam | A1 sạch tiếng camera (trước lẫn 23 clip); 20/20 phép kiểm | 04/08 |
| **Luật tài nguyên 50–70%** cho cả 7 panel | 12/12 mục kiểm; đo thật: ghim trần 70% còn nhanh hơn 31% | 04/08 |
| Hai chốt an toàn: chặn gán tiếng cam làm mic · chặn bản dựng 1 lượt | tái hiện ca gán nhầm: chặn đúng, không dựng bậy | 02/08 |
| Nhớ bước gán theo từng sequence | quay lại sequence cũ, bản đồ tự điền | 01/08 |
| **Tự sync thành NÚT trong panel (v0.4.0)** — chọn file mic là tool tự đo mốc, tự dựng sequence, tự gợi ý gán | lệch PluralEyes 0,19–0,29 frame; E2E: sync 48s → cắt 32s → 103 lượt khớp từng số bản chuẩn; kiem-sync 9/9; từ chối nguồn không liên quan (2 nửa không khớp) | 04/08 |

## 🔧 CHƯA LÀM — tính năng còn thiếu (không phải lỗi)

| Việc | Vì sao chưa | Cần gì để làm |
|---|---|---|
| Track nhiều clip (cam bấm stop/start giữa buổi) | MVP đang đòi 1 clip liền/track | làm được ngay khi anh cần |
| Tự sync thành NÚT trong panel (Level 3: trỏ folder là xong) | mới xong phần thuật toán + import | quyết định ưu tiên |
| Cắt sớm 0,3–0,5s trước khi người nói bắt đầu (lead-in, nhịp editor) | chưa đụng tới | làm sau khi lỗi 1 hết |
| File mono 244MB/mic hơi nặng | FLAC nhẹ hơn ~60% nhưng chưa thử với Premiere | anh gật thì em thử |

## 🙋 ĐANG CHỜ TAI ANH — máy không tự chấm được

1. **Nghe: `AiO-Sequence-TuDong - Podcast Cut (2)`** (bản 21:43 04/08 —
   103 lượt, tiếng liền mạch, mic đã đặt đúng mốc) — cắt có đúng nhịp
   không, ghi giúp em mốc nào sai. ⚠️ **XOÁ tay bản `AiO-Sequence-TuDong
   - Podcast Cut` cũ (193 lượt)** — dựng từ mic đặt lệch mốc, tiếng trễ
   môi 1,2–1,5s, đừng nghe nhầm bản đó. (Các bản Cut buổi chiều đã bay
   cùng lần mở lại project không lưu.)
2. **Chấm 12 clip** trong `file pr for test\podcast-nghe-kiem\_BANG-CHAM.csv`.
3. ~~Sync lại "test thực tế" CÓ 2 file mic riêng~~ **EM ĐÃ LÀM 04/08
   15:44** — mic thật đã nằm đúng vị trí (theo PluralEyes, lệch ≤1 frame).
4. Xoá tay các sequence thử: `AiO-THU-KENH` · `AiO-THU-DONGBO` ·
   `AiO-THU-DONGBO-2` (Premiere không cho panel xoá sequence).
