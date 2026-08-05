# AiO Auto Podcast — BẢNG THEO DÕI: CÁI GÌ XONG, CÁI GÌ CHƯA

> Anh Tiến yêu cầu 04/08/2026 khi test gặp nhiều trở ngại: *"em tạo cho anh
> một track list cái gì đã xong và cái nào [chưa] em nhé"*. Và ngay sau đó:
> *"ủa anh thấy còn nhiều lỗi lắm mà em"* — anh đúng, bản đầu của bảng này
> khoe phần xong nhiều quá. Đã sắp lại: **LỖI ĐỨNG TRÊN CÙNG**.
>
> Luật của bảng: chỉ được ghi ✅ khi có SỐ ĐO thật (ghi trong PROGRESS.md).
> Cập nhật mỗi phiên làm việc. Chi tiết kỹ thuật: `TINH-NANG.md` + `PROGRESS.md`.

*Cập nhật lần cuối: 05/08/2026 15:48 — panel **v0.6.1**, host **v0.4.3**.
✅ **RA BẢN DỰNG THẬT ĐẦU TIÊN trên liệu 58 phút của anh Tiến** (sequence
`Will - Podcast Cut (2)`): **299/299 nhát cắt**, V1 100% cam Will · V2 100% cam
Trọng, A1/A2 đúng mic mono từng người liền mạch 0→3528,4s, **0 clip lạ, 0 lỗ
đen**, nhát ngắn nhất 1,04s, chia 54,4/45,6. Xem PROGRESS.md mục
[chuoi-con-giet-ban-dung].
Sửa gốc lỗi "hình 164/299": `pc__item` còn luật **khớp chuỗi con** → tên
sequence trùng tên THƯ MỤC quay ăn khớp vào mọi đường dẫn file → mic mono
không được nhập → cả một sequence 31 phút bị đặt lên A1/A2 và kéo hình xuống
V1/V2, giết 135/299 nhát. Nay chỉ nhận khớp chắc chắn, **item không có file
media không bao giờ là ứng viên**, **bỏ cache tra cứu** (anh Tiến: "remove
cache"). Bấm sang tab sequence khác không còn giết bản dựng (`ERR:SEQ_DOI`).
`kiem-host` **22 → 31 phép, 31/31 đạt**.
☠️ CÒN NỢ: (1) chưa có thước ngoài cho "cắt đúng người" — cần anh chấm marker;
(2) cài BẰNG TAY vì `kiem-nao`/`stress` đang trượt 2 phép (phiên trước đổi bản
chất não sang đường "nghe trọn từng kênh" mà chưa sửa phép kiểm cũ) — phải
chỉnh 2 phép đó rồi cài lại qua `sign-install.ps1`.*

*05/08/2026 14:03 — panel **v0.6.1**, host **v0.4.2**.
**Phiên soát toàn bộ (anh Tiến: "kiểm tra và chốt hạ")** — tìm và sửa **4 lỗi
có thể phá timeline thật**, xem PROGRESS.md mục [soat-toan-bo]:
(A) `pc_sapXepClipsLenTrack` xoá sạch mọi clip TRƯỚC rồi mới tìm project item
→ tìm trượt là clip bay luôn; (B) panel bỏ qua giá trị host trả về nên xếp
hỏng vẫn báo "đã khớp N người"; (C) `pc__item` khớp chuỗi con hai chiều rồi
lấy cái gặp đầu tiên → "A.wav" ăn khớp "mic_data.wav"; (D) vòng lặp vô hạn
tuKhop ↔ tuTimVaSyncMicProject, mỗi vòng ghi đè timeline.
☠️ **Bản v0.6.0 anh đang dùng sáng nay: bấm Auto Match lúc một file media
offline là XOÁ TRẮNG timeline** — đo được bằng cách chạy bộ kiểm mới ngược
lên nó (video 3 clip → 0, audio 2 → 0, mà host vẫn trả "OK:").
Cổng kiểm mới **`node tests/kiem-host.mjs` 22/22** (dựng `app` Premiere giả),
đã cắm vào `sign-install.ps1` — nay 5 bộ chặn trước khi cài.
Bốn bộ kiểm cũ đều BÁO ĐẠT suốt thời gian 4 lỗi này nằm trong sản phẩm, vì
không bộ nào chạm tới host.
CHỜ TAY ANH: bấm Auto Match → Auto Podcast trên liệu thật.*

*05/08/2026 09:50 — panel v0.6.0, host v0.4.1.
Ba nhãn nút anh chốt 05/08 (giữ nguyên ở cả VI lẫn EN): **Auto Match** ·
**Auto Sync** · **Auto Podcast**.
Mới trong v0.6.0: **nút "Auto Match"** (anh Tiến đặt hàng: kéo hết
source clip vào sequence rồi bấm một nút). Một cú bấm điền cả bản đồ: tiếng
đi kèm cam → "Không dùng"; cam ↔ mic ghép theo TÊN FILE (token có trọng số
IDF); cam toàn cảnh nhận theo từ khoá; tên người lấy từ token chung, giữ
nguyên dấu. Tên không nói gì thì ghép theo thứ tự và NÓI THẲNG là đoán.
Nút tự sync không mất — ẩn đi, tự hiện khi đo ra là cần.
☠️ Hướng "ghép bằng TIẾNG CAM" đã đo trên 4 cam thật và **trượt 3/4** (mọi
cam thu chung một phòng nên biên độ chỉ 0,017–0,056 = nhiễu) — đã ghi CẤM
ở đầu `dist/khop.js`, đừng thử lại. Cổng kiểm mới: `kiem-khop` 28/28.
Đo trên panel thật (Premiere 26.5): bấm 1 nút → V0=A, V1=B, A0=Not used,
A1=A, A2=B, nút Cắt mở. CHỜ TAY ANH: bấm Cắt sau khi tự khớp.*

*04/08/2026 23:44 — panel v0.5.0 (GIAO DIỆN MỚI theo
thiết kế Studio Console anh Tiến chốt), host v0.4.1.
Mới trong v0.5.0: gõ TÊN người thẳng vào track (cam chung = 2 tên, phẩy
ngăn) · monitor + dải nhát cắt · hộp CÀI ĐẶT CẮT ăn thật (cắt sớm, cam
ngắn/lâu nhất→đảo wide, ngưỡng dB, chế độ tiếng) · tự lưu project trước
khi ghi · nút tiến độ %/xanh khi xong. E2E: cắt PodTest Nguon 10 đoạn,
chia micA 0:40/micB 0:49 khớp đáp án. Đã bắt+sửa 2 bug bằng đo cô lập
(save() kéo activeSequence về tab trước mặt; kết quả bị xoá sau 1s).
CHỜ TAY ANH: bấm thử UI mới; 2 sequence PV_* cần dọn mic về 1 clip liền.*
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
