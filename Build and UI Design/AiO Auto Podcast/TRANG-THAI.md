# AiO Auto Podcast — BẢNG THEO DÕI: CÁI GÌ XONG, CÁI GÌ CHƯA

> Anh Tiến yêu cầu 04/08/2026 khi test gặp nhiều trở ngại: *"em tạo cho anh
> một track list cái gì đã xong và cái nào [chưa] em nhé"*. Và ngay sau đó:
> *"ủa anh thấy còn nhiều lỗi lắm mà em"* — anh đúng, bản đầu của bảng này
> khoe phần xong nhiều quá. Đã sắp lại: **LỖI ĐỨNG TRÊN CÙNG**.
>
> Luật của bảng: chỉ được ghi ✅ khi có SỐ ĐO thật (ghi trong PROGRESS.md).
> Cập nhật mỗi phiên làm việc. Chi tiết kỹ thuật: `TINH-NANG.md` + `PROGRESS.md`.

*Cập nhật lần cuối: 06/08/2026 07:47 — panel **v0.6.6**, host **v0.4.8**.
✅ **ĐỒNG HỒ ĐẾM NGƯỢC** khi dựng: *"Đang cắt đoạn 260/299 · còn ~2 phút"*.
☠️ Bản đầu tính trung bình từ đầu → **lạc quan 30–40%** (báo ~2 phút lúc thực tế
còn 3,5 phút) vì tốc độ đặt clip CHẬM DẦN khi timeline đông clip. Sửa bằng **cửa
sổ trượt** (chỉ nhìn ~15 giây gần nhất) → sai số còn ~15%.
✅ **BỊT HAI LỖI UX** (rà soát 3 vai + phản biện, em kiểm chứng lại trước khi sửa):
(A) `tuDienMic` gán tiếng cam làm mic → người dùng làm ĐÚNG vẫn bị báo "trùng mic"
và khoá nút. Sửa CÓ ĐIỀU KIỆN — né tiếng cam chỉ khi sequence có mic rời khác,
nếu không sẽ giết luồng "không có mic rời". (B) Trong lúc dựng, nút **Auto Match
vẫn bấm được** → hai lượt xoá-và-đặt-lại chồng nhau lên timeline GỐC. Đo thật:
trước `{dựng:khoá, match:MỞ, sync:MỞ}` → sau **`{khoá, khoá, khoá}`**.
☠️ Không bọc cả hàm `tuKhop` bằng cờ (11 đường thoát + đệ quy — sót một chỗ là ba
nút chết vĩnh viễn); chỉ khoá đúng đoạn ghi timeline: một chỗ đặt, một chỗ hạ.
📊 **ĐO HIỆU NĂNG — hai nghi ngờ ban đầu đều SAI:** round-trip không phải thủ phạm
(bước bật/tắt cùng 30 lô chỉ tốn 6,1 s vs 184 s của đặt clip); bỏ cache không tốn
gì (`pc__item` 0,95 ms × 598 = **0,57 s trên tổng 211 s**). Nút thắt thật là
`overwriteClip` của Premiere — **0,30 giây mỗi clip, chiếm 87%**. Phần công nghệ
gần như không còn gì đáng tối ưu.

*05/08/2026 21:46 — panel **v0.6.5**, host **v0.4.8**.
✅ **HẾT PHẢI CÀI BẰNG TAY** — `sign-install.ps1` chạy trót lọt, 5/5 bộ kiểm sạch.
Chốt gãy an toàn mới cho đường nghe-từng-kênh: **biên độ nhất–nhì** (chênh mức
vượt ngưỡng giữa kênh nhất và nhì). Ngưỡng chọn bằng số: liệu thật 4,61 dB → tha,
gán nhầm 2 người vào 1 file mic 0,00 dB → chặn. Liệu thật **vẫn 300 lượt, không đổi**.
☠️ Suýt xây chốt lên chỉ số VÔ DỤNG: "chồng lấn" đo ra 0,999 ở cả bleed −16 dB
(cắt đúng 10/10) lẫn −5 dB — không tách được ca tốt khỏi ca xấu (bài học 5s).
☠️ Thử 2 hướng sửa 2 ca stress còn lại, **cả hai phá chỗ khác** (kẹp ngưỡng theo
trung vị → hỏng ca độc thoại 90/10; chuẩn hoá mức vượt → gần như mọi ca báo
KHONG_PHAN_BIET). Đã hoàn tác cả hai; 2 ca đó đánh dấu BAOCAO **kèm số đo và lý
do ngay trong file kiểm**, không lặng lẽ hạ chuẩn.
✅ **GAIN — anh Tiến không còn phải tự kéo +25 dB.** Chuẩn hoá lúc tách file mic:
Will −42,6 → **−17,5 dB**, Trọng −36,4 → **−17,2 dB**, hai mic từ lệch 6,2 dB
còn **0,3 dB**, đỉnh có headroom. Đuôi file đổi `.aio-mono-n.wav` để bản dựng cũ
không bị đụng. Chỉ file ĐẶT LÊN TIMELINE được chuẩn hoá, file PHÂN TÍCH giữ nguyên.
✅ Đã xoá sequence hỏng cũ (10 clip không có file).
❌ **THƯỚC NGOÀI vẫn chưa có** — máy không có `whisper-cli.exe`. Chờ anh Tiến chọn:
tải whisper.cpp (~1–3 GB) hay tự nghe bộ 12 clip ở `podcast-nghe-kiem` rồi chấm.
Bản chuẩn để anh xem: `Podcast - BAN CHUAN (bat-tat + ducking + tieng da chuan hoa)`.

*05/08/2026 21:11 — panel **v0.6.4**, host **v0.4.8**.
✅ **PICKER** (anh Tiến: *"click là được"*) — radio thật, Tab + mũi tên dùng được:
**Hình**: `Bật / tắt clip` · `Cắt bỏ` — **Tiếng**: `Ducking` · `Bật / tắt clip` ·
`Cắt bỏ` · `Giữ nguyên`. Đường **Cắt bỏ cho tiếng là MỚI**. Bỏ `cat-chim` cho gọn.
Mọi khuôn cũ trong localStorage đều được quy về khuôn mới (không thì picker mở ra
trống và im lặng chạy sai đường). Đã xoá 2 dòng chia mục anh chỉ.
Chạy thật **cả 4 tổ hợp** trên liệu 58 phút, đều đúng 299/299.
☠️ **Tương phản chữ nút đang chọn ban đầu chỉ 3,00 — TRƯỢT AA**; đổi sang chữ tối
thì 6,43. Và lần đo đầu mọi số ra **0** vì modal còn đóng (bẫy quy tắc vàng #20).
☠️☠️ **BỊT HAI ĐƯỜNG LÀM MẤT CLIP VĨNH VIỄN** (rà soát 5 góc nhìn + phản biện, em
đo lại bằng phép kiểm của mình trước khi tin):
(A) lệnh trỏ vào **track không tồn tại** bị nuốt im lặng SAU KHI đã xoá sạch
timeline → host trả `OK:daDat=1|soLoi=0` mà timeline còn 0 clip. Ca thật: kéo 6
cam vào một sequence rồi bấm Auto Match. Nay chặn TRƯỚC KHI XOÁ → `ERR:THIEU_TRACK`,
timeline còn nguyên. (B) `setInPoint/setOutPoint` hỏng bị catch rỗng nuốt rồi vẫn
đặt clip → clip dài sai đè clip bên cạnh, `soLoi=0`. (C) nhãn `seq_doi` khai báo mà
không chỗ nào gọi → anh nhận nguyên mã thô `Build failed: ERR:SEQ_DOI|`; nay có
`cauLoiHost()` dịch, nối vào 14 chỗ.
`kiem-host` **74/74** (68 → 74).

*05/08/2026 20:38 — panel **v0.6.3**, host **v0.4.7**.
✅ **HÌNH CŨNG BẬT/TẮT ĐƯỢC — ĐÃ CHẠY THẬT, 299/299 ĐÚNG.** Anh Tiến: *"ở phần
video anh cũng muốn làm theo kiểu là các clip cut có thể theo dạng là enable
hoặc disable luôn"*. Ô mới **"Hình sau khi cắt"**: `Đủ cam — tắt cam không dùng`
(mặc định) / `Chỉ cam người đang nói` (kiểu cũ).
Đo trên `Podcast - DU CAM bat-tat + duong am luong`: 299 mốc, V1 299 clip
(tắt 150), V2 299 clip (tắt 149), **mỗi mốc bật đúng 1 cam: 299 đúng · 0 màn
hình đen · 0 chồng cam**; đường âm lượng đi kèm vẫn 299/299.
Độ nặng: 598 clip duyệt hết **189 ms** vs 299 clip **84 ms** → tuyến tính, không
có N². (Đây là chi phí API, không phải "kéo timeline có mượt không" — cái đó
cần anh cảm nhận; thấy ì thì đổi ô về `Chỉ cam người đang nói`.)
`kiem-host` **68/68** (58 → 68, thêm mục 2f).
☠️ Lần thứ TƯ trong ngày công cụ đo sai trước sản phẩm: `kiem-am-luong.ps1` dựng
lịch cắt từ MỌI clip video nên với đường "đủ cam" nó đọc ra 598 đoạn và báo
trượt 299. Sửa: chỉ lấy clip **đang BẬT**. Đối chiếu ngược trên bản cũ vẫn
299/299 → không phải nới lỏng cho qua.

*05/08/2026 17:06 — panel **v0.6.2**, host **v0.4.6**.
✅ **Ô CHỌN 4 ĐƯỜNG TIẾNG — ĐÃ CHẠY THẬT CẢ BỐN TRÊN LIỆU 58 PHÚT, ĐỀU 299/299.**
`duck` (mặc định, vẽ đường âm lượng) · `cat-tat` (cắt rời + tắt clip người kia,
anh Tiến đề xuất) · `cat-chim` (cắt rời + chìm) · `giu`. Ô mức chìm −8/−15/−24 dB,
mặc định −15, tự ẩn khi chế độ không có chìm.
Bốn sequence để anh nghe so sánh: `Podcast - DUONG AM LUONG -15 dB` ·
`Podcast - CAT ROI + TAT clip nguoi kia` · `Podcast - CAT ROI + chim -15 dB` ·
`Podcast - GIU NGUYEN 2 mic`. Cả bốn: 299 clip hình, 0 clip lạ.
Bộ kiểm: `kiem-host` **58/58** · `kiem-sync` 9/9 · `kiem-khop` 32/32.
☠️ **BA lần trong một phiên, CÔNG CỤ ĐO sai trước khi sản phẩm sai** — nếu tin
thì đã đi sửa thứ không hỏng: (1) mốc "xong" lấy theo `nút.disabled` (nút vẫn
disabled cả khi đã dừng); (2) khớp clip bằng `toFixed(2)` trong khi
`overwriteClip` đặt theo **lưới khung hình** — panel gửi 2,3000, clip thật ở
2,2940, lệch 6 ms, trượt 14/20 lệnh; (3) so `Level` bằng số thực dung sai `1e-9`
trong khi Premiere lưu float 32-bit — lệch 1,4e-9 = **0,0000004 dB**, báo trượt
oan cả 299 đoạn.
❌ CÒN NỢ: `kiem-nao` + `stress` vẫn trượt 2 phép (nợ từ phiên đổi não, CỐ Ý
chưa sửa — sửa là chạm vào não đang chạy đúng trên liệu thật) → **vẫn phải cài
bằng tay**; chưa xử lý gain tổng; chưa có thước ngoài cho "cắt đúng người".

*05/08/2026 16:17 — panel **v0.6.1**, host **v0.4.4**.
✅ **ĐƯỜNG ÂM LƯỢNG (ducking)** — anh Tiến 05/08: *"khi Trọng nói audio mà cam
đoạn đó được ẩn đi tôn lên audio của Trọng và ngược lại"*. Anh chọn: vẽ keyframe
(giữ 2 clip mic liền mạch, anh kéo lại được), chìm **−15 dB**, chuyển mượt 150 ms.
Đo: **597 keyframe/mic**, đối chiếu tâm **299/299 đoạn ĐẠT**, quét 3.628 điểm —
**0 lần cả hai cùng to, 0 lần cả hai cùng chìm**. Xem PROGRESS.md [duong-am-luong].
☠️ Hai cái bẫy đã đo chứ không đoán: (1) `Level = 0,177828` là **MẶC ĐỊNH = 0 dB**,
không phải −15 dB như công thức `20*log10` quen thuộc gợi ý → hàm nhận **hệ số
nhân**, không nhận dB, nên không phá mất chỉnh tay của người dùng; (2) mốc keyframe
tính theo **thời gian trong FILE**, phải cộng `inPoint` — sai là lệch cả 299 mốc
7 giây; xác nhận bằng thước ngoài (anh Tiến nhìn hố thử: "khoảng 4:53").
CÒN NỢ: chưa có nút trong panel (đang chạy bằng script ngoài); chưa xử lý gain
tổng (anh vẫn phải tự kéo +25 dB).

*05/08/2026 15:48 — panel **v0.6.1**, host **v0.4.3**.
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
