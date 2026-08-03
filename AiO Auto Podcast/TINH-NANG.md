# AiO Auto Podcast — Bảng theo dõi tính năng theo level

> Anh Tiến yêu cầu 01/08/2026: *"tạo cho anh một file text để theo dõi các
> tính năng ở level cần có - level chuyên nghiệp"*.
>
> Cách dùng: mỗi dòng một tính năng, `[x]` = xong VÀ có số đo, `[ ]` = chưa.
> Tính năng chỉ được tick khi có phép đo ghi trong PROGRESS.md — build sạch
> không tính là xong.

---

## Định vị — thắng AutoPod bằng CẢ BỘ

AutoPod ($29/tháng) bán 3 mảnh: Multi-Camera Editor + Jump Cut Editor +
Social Clip Creator. Bộ AiO đã có sẵn 2 mảnh sau:

| Mảnh của AutoPod | Bên mình | Trạng thái |
|---|---|---|
| Jump Cut Editor (cắt khoảng lặng) | AiO Autocut | Đã bán được |
| Social Clip Creator (clip dọc social) | AiO Re-Frames (+ Auto Cut Short) | Đã chạy |
| **Multi-Camera Editor (cắt theo người nói)** | **Tool này** | v0.1.0 |

→ Tool này chỉ cần thắng MỘT mảnh multi-camera là cả bộ ngang AutoPod,
offline, mua một lần. Đừng ôm thêm việc của hai mảnh kia vào đây.

---

## LEVEL 0 — Đã có, đã đo (v0.2.0 · 01/08/2026)

- [x] Não "ai đang nói" ≥2 mic — RMS 20ms, chênh ≥6dB, hysteresis, nuốt lượt <1s
      *(đo: 10/10 lượt, ranh lệch 0ms ở bleed −16/−8dB; 3 mic chạy đúng)*
- [x] Gãy an toàn khi mic giống nhau — báo "kiểm tra thu âm", không đoán bậy
      *(đo: bleed −5dB → 0 đoạn bịa)*
- [x] Bước GÁN thủ công: track nào = cam ai, mic ai (anh chốt, không đoán thứ tự)
- [x] **Cắt BẢN SAO timeline giữ nguyên cấu trúc track** (v0.2, theo phản
      hồi anh Tiến + chuẩn AutoPod): cam ai nói thì đoạn đó còn trên track
      người đó, đúng vị trí gốc; tiếng là mic người đó trên track mic gốc.
      Bản gốc không bị đụng, tự lưu trước khi ghi.
      *(đo end-to-end trên panel thật: 10 lượt 5+5, thước ngoài khớp từng clip)*
- [x] Chặn "mic" có âm lượng đều suốt (tiếng cam / nhạc nền) — chỉ rõ tên
      người + track *(tái hiện đúng ca gán nhầm 01/08: chặn đúng câu)*
- [x] Chặn bản dựng chỉ 1 lượt (gần như chắc là gán sai) — giải thích, không im
- [x] Đo lại sau dựng (số clip từng track, thời lượng) — lệch là báo, không im
- [x] Nhớ bước gán theo TỪNG sequence (localStorage) — dựng xong quay lại
      sequence nguồn thì lựa chọn còn nguyên
- [x] UI v0.3: bước GÁN = BẢN ĐỒ TRACK kiểu mini-timeline (gán theo track,
      V xếp ngược như Premiere) · mỗi người một màu xuyên suốt chip → track
      → minh hoạ → kết quả · thanh "ai nói bao nhiêu" theo thời lượng
- [x] Song ngữ VI/EN · tiến độ theo lô · chốt SEQ_DOI · chốt phiên bản host

---

## LEVEL 1 — CẦN CÓ: editor thật dùng được hằng ngày (chặn bán nếu thiếu)

> Thứ tự dưới đây là thứ tự nên làm. Ba mục đầu là MỘT cụm: độ tin nhát cắt
> trên liệu thật — xong cụm này mới biết sản phẩm sống hay chết.

- [ ] **1. Chạy đúng trên liệu THẬT** — 1 podcast thật ≥2 cam ≥2 mic của anh
      Tiến. Đo: bleed thực tế bao nhiêu dB, bao nhiêu % lượt đúng khi có nói
      chồng / cười / ừ-hử. **Chưa có liệu thật — đang chờ anh.**
- [ ] **2. Đúng ở QUY MÔ THẬT** — podcast 60–90 phút (~300–600 lượt).
      NÃO đã qua (stress 01/08: 60 phút · 227/227 lượt · đúng 100% · chạy
      0,17s); còn nợ phần DỰNG trên Premiere ở quy mô đó (cần liệu thật —
      đo thời gian dựng, không treo, lệch hình–tiếng cuối tập < 1 frame).
      (AutoPod TRÔI TIẾNG trên tập quá 45–60 phút — thắng ở đây là thắng đau nhất.)
- [ ] **3. Ngưỡng chênh TỰ ĐO theo file** — thay 6dB cứng bằng ngưỡng đo từ
      chính liệu (như Autocut bỏ −30dB cứng sang Otsu). Đo: cùng một bộ liệu
      thật, ngưỡng tự động ≥ ngưỡng cứng về % lượt đúng.
- [ ] 4. Track NHIỀU clip (cam bấm stop/start giữa buổi) — hiện đang chặn
      "1 clip liền/track". Đo: liệu có 2–3 clip/track dựng vẫn đúng ranh.
- [ ] 5. Lead-in chỉnh được — cắt sớm ~0,3–0,5s TRƯỚC khi người nói bắt đầu
      (nhịp editor thật; AutoPod có). Đo: ranh cắt = mốc nói trừ đúng số cài.
- [ ] 6. Chế độ TIẾNG: (a) theo người nói — hiện tại · (b) GIỮ NGUYÊN mọi mic,
      chỉ cắt hình (chuẩn AutoPod — giữ được tiếng cười, "ừ, đúng rồi" của
      người kia). Đo chế độ (b): số clip tiếng = số mic, không bị dọn.
- [ ] 7. Shot tối thiểu chỉnh được trên UI (hiện 1s chôn trong code)
- [x] 8. Nhớ bước gán theo TỪNG SEQUENCE (localStorage, sống qua đóng/mở
      panel) *(đo 01/08 tối: về lại sequence nguồn, bản đồ tự điền đúng 5 hàng)*
- [ ] 9. **Hai người CHUNG một cam** (2 lav trên 1 khung hình) — gỡ luật
      cấm trùng cam trong bước GÁN (mic vẫn phải riêng). *(Từ nghiên cứu
      đối thủ 01/08: AutoPod giả định cứng 1 mic = 1 cam và vỡ ở ca này —
      với mình chỉ là một dòng validation.)* Đo: 3 người 2 cam cắt đúng.
- [ ] 10. Chịu liệu BẨN thực tế mà không bắt dọn: ~~sample rate lẫn~~
      **(ĐÃ ĐO 01/08 — stress ca 12: 44.1k + 48k qua FFmpeg thật, lệch
      chuẩn 0ms)**; còn lại: clip không bắt đầu ở 0:00, sequence còn
      in/out mark — kiến trúc đã né (mốc đọc từ clip được gán), chờ đo
      trên liệu thật. (AutoPod vỡ ở cả ba ca này — NGHIEN-CUU-DOI-THU.md.)

---

## LEVEL 2 — CHUYÊN NGHIỆP: ngang/vượt AutoPod, đủ tự tin thu tiền

- [ ] 1. **Cam WIDE + luật về wide**: gán một cam là wide; nhiều người nói
      cùng lúc → wide · im lâu → wide · cùng shot quá N giây → đảo wide.
      (Anh đã chốt v1 chưa cần — đây là mục MỞ LẠI khi lên chuyên nghiệp.)
- [ ] 2. Nói chồng nhau xử lý tử tế — hai mic to ngang nhau trong >1s không
      được nhấp nháy cam (về wide nếu có, không thì giữ shot đang mở)
- [ ] 3. 3+ người / 3+ cam đo thật trên Premiere (não đã qua bộ kiểm 3 mic,
      chưa đo trên timeline thật)
- [ ] 4. Vai HOST: host được ưu tiên hình khi tranh chấp, guest solo khi kể
      chuyện dài (kiểu "camera preferences" của AutoPod)
- [ ] 5. Marker màu theo người nói trên sequence dựng ra — editor tinh chỉnh
      nhát nào là thấy ngay của ai
- [ ] 6. Preset theo SHOW — podcast tuần nào cũng cùng setup: lưu bộ (gán
      track + ngưỡng + lead-in) gọi lại một cú bấm
- [ ] 7. Đo trên MÁY YẾU — RAM + thời gian trên máy không phải máy anh
      (khách không có máy dựng khủng)
- [ ] 8. Tôn trọng đường chung cả bộ (PIPELINE.md): bundle FFmpeg riêng ·
      ký thương mại · khoá bản quyền · bản Mac
- [ ] 9. **Tuỳ chọn dựng MULTICAM THẬT** (Multicam Source Sequence) thay vì
      cắt cứng — editor đổi một nhát sang cam khác bằng 1 click. *(Từ
      nghiên cứu 01/08: "hard-coded cuts" là lời chê lớn nhất về AutoPod.)*
      Đo: đổi angle một nhát cắt < 5 giây.
- [ ] 10. Bảng SỐ ĐO công khai kèm sản phẩm (benchmark tập 90 phút, liệu
      bẩn, máy yếu) — không đối thủ nào dám in số của chính họ; mình lấy
      minh bạch làm vũ khí bán.

## LEVEL 3 — "TRỎ VÀO FOLDER LÀ XONG" (anh Tiến mô tả 03/08/2026)

> Anh Tiến 03/08/2026: level basic là người dùng tự import + tự sync bằng
> Premiere rồi qua tab tool gán ai-là-ai; *"level xịn nhất: tool trỏ vào
> folder chứa hình ảnh và âm thanh, tự động làm các thao tác trên"*.
> Level basic = LEVEL 0–1 phía trên, ĐÃ CHẠY. Phần dưới là đường lên đỉnh.

- [ ] 1. Chọn folder → tool tự quét, phân loại video/audio. Phải xử lý ngay
      hai bẫy đã gặp trên liệu thật 03/08: tên file Mac chứa U+F022 làm CLI
      gãy, và file audio TRÙNG từng byte (cùng MD5) phải gộp làm một.
- [ ] 2. **TỰ SYNC bằng tương quan chéo** — spike ĐÃ ĐO 03/08 trên liệu
      thật (3 cam 4K + 2 mic, 44 phút): lệch trung bình **0,59 frame** so
      với PluralEyes, và sync được cả cặp mà PluralEyes bỏ cuộc. Còn thiếu:
      đóng thành module trong panel; KHÔNG chặn bằng ngưỡng r cứng — xét
      tính nhất quán giữa các cặp (bài học 03/08: r thấp mà lag vẫn đúng).
- [ ] 3. Tự dựng sequence đã sync trong Premiere. Spike 03/08 đã sinh FCP7
      XML hợp lệ (`podcast-buoi2\PODCAST-BUOI2-da-sync.xml`) nhưng CHƯA
      import thử; đường thứ hai là host JSX tự đặt clip theo offset — chưa
      làm. Đo: ranh sync trên timeline lệch < 1 frame so với PluralEyes.
- [ ] 4. Tự GỢI Ý ghép cặp mic ↔ cam (tương quan bleed), kèm gom file theo
      buổi quay (liệu thật 03/08: 1 folder = 2 buổi phỏng vấn khác nhau,
      tương quan chéo giữa 2 buổi r ~ 0,02 → tách được bằng máy). Người
      dùng chỉ XÁC NHẬN + đặt tên người. Cam wide / cam 2 người KHÔNG đoán
      được bằng âm thanh — chỗ đó vẫn phải hỏi người dùng.
- [ ] 5. Chuỗi liền một nút: folder → sync → sequence → xác nhận gán → cắt.
      Có đường dừng và sửa tay ở TỪNG chặng — tự động là mặc định, không
      phải bắt buộc.

## KHÔNG LÀM (đã chốt, đừng mở lại khi chưa hỏi anh)

- ML nhận diện giọng nói — bài toán này giải bằng SO SÁNH NĂNG LƯỢNG là đủ
- Track audio TRỘN sẵn (một track cho cả phòng) — yêu cầu mỗi người một mic
- ~~Tự sync các cam/mic — Premiere Synchronize làm tốt rồi, đừng làm lại~~
  **MỞ LẠI 03/08/2026 — chính anh Tiến mở**, khi mô tả Level 3 "trỏ vào
  folder". Với Level 0–2 người dùng vẫn sync bằng Premiere như cũ; tự sync
  chỉ nằm trong đường Level 3. Spike đã đo: 0,59 frame vs PluralEyes.
- Nhịp dựng "nghệ thuật" (đổi cam theo cảm xúc, theo nhạc…) — v1 cắt ĐÚNG
  trước đã, đẹp tính sau khi có người dùng thật chê

---

*Cập nhật lần cuối: 03/08/2026 — thêm LEVEL 3 theo mô tả của anh Tiến;
mở lại mục tự-sync (spike đã đo 0,59 frame so với PluralEyes).*
