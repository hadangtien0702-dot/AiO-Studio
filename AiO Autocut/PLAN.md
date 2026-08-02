# AiO Autocut — kế hoạch

> Lập 2026-07-27. Dự án thứ 5 trong bộ AiO Studio (cùng AiO Editing · Autosub ·
> Autoupload · Free Image Convert).

---

## 1. Làm cái gì

Đọc clip trên timeline Premiere → **dò khoảng lặng trong tiếng nói** → **cắt, xoá
đoạn lặng, dồn clip lại liền mạch**.

**Đã chốt với anh Tiến (2026-07-27):**

| Câu hỏi | Chốt |
|---|---|
| Cắt dựa vào gì | **Khoảng lặng** (không phải cảnh / nhịp nhạc / lời thoại) |
| Cắt xong làm gì | **Cắt + xoá + dồn lại** (ripple delete), không phải chỉ đánh dấu |

Loại nội dung nhắm tới: talking-head, UGC, review sản phẩm — thứ anh làm hằng ngày.
Đây là việc **ăn giờ dựng nhiều nhất** và FFmpeg làm được chính xác, **không cần AI**.

---

## 2. Bài học từ hai dự án anh em — đọc trước khi quyết kiến trúc

**AiO Sub (Autosub)** — UXP panel + helper **Python** (cổng 48112) lo ffmpeg/whisper.
Trạng thái: **nằm im từ 2026-05-06**. Hai lý do ghi trong `PROJECT_TRACKING_AIOSUB.md`:
1. Chèn kết quả về timeline **không ổn định 100%**
2. **Máy chưa có ffmpeg/whisper** nên chưa chạy thật được — người dùng phải tự cài

**AiO Editing** — CEP panel, đã phát hành 1.1.0, đang dùng thật hằng ngày. Đã giải
xong đúng hai chỗ AiO Sub kẹt:
- **FFmpeg đóng gói sẵn** trong `bin/win64/`, chạy ưu tiên IDLE, không cần cài gì
- Cầu ExtendScript ổn định, **đã có hàm đọc clip đang chọn trên timeline**
  (`ppro_getSelectedClipPaths`), và đã biết chọn track không đè clip cũ

> **Kết luận: Autocut đi theo đường AiO Editing.** Lặp lại đường AiO Sub là lặp lại
> đúng chỗ nó chết.

---

## 3. Rủi ro LỚN NHẤT — phải hạ trước khi viết gì nhiều

**Ghi ngược về timeline.** Đây chính là chỗ AiO Sub kẹt, và Autocut còn cần nhiều
hơn: không chỉ chèn, mà phải **cắt** và **xoá dồn**.

Vấn đề: **ExtendScript của Premiere KHÔNG có API cắt (razor) chính thức.** Cách các
plugin thương mại dùng là **QE DOM** — API nội bộ không được Adobe hỗ trợ chính thức:

```js
app.enableQE();
qe.project.getActiveSequence().razor(timecode);        // cắt
qeTrackItem.remove(true /* ripple */, false);           // xoá + dồn
```

**Chưa xác nhận** hai lệnh này chạy trên Premiere Beta 26.5 của anh.

> **Việc số 1: SPIKE.** Thử đúng hai lệnh đó trên một sequence thật, xem có cắt và
> dồn được không. Chạy trước, viết sau. Nếu QE không dùng được thì cả kiến trúc đổi
> (phải dựng lại clip bằng `overwriteClip` với in/out point) — biết sớm đỡ mất công.

Rủi ro thứ hai: **quy đổi thời gian**. Khoảng lặng FFmpeg trả về tính theo **file
gốc**; timeline thì tính theo **sequence**, mà clip còn bị trim đầu (`inPoint`) và
có thể đổi tốc độ. Sai chỗ này là cắt lệch hết. AiO Sub cũng đã vấp đúng đây —
họ phải tách hẳn module timecode với 2 chiến lược (`relative` / `absolute`).

---

## 3b. LUỒNG DÙNG — anh Tiến chốt 2026-07-27

> 1. Anh chọn clip từ sequence
> 2. Anh bấm **1 nút** auto cut
> 3. Tool đo lường → cut và ripple lại

Ba điều rút ra, coi như ràng buộc thiết kế:

- **MỘT nút.** Không có màn hình cấu hình bắt đặt thông số trước khi chạy. Ba tham
  số (ngưỡng ồn, độ dài tối thiểu, đệm) để ở chỗ phụ, có sẵn giá trị mặc định
  dùng được ngay. Bấm là chạy.
- **Đối tượng = CLIP ĐANG CHỌN trên timeline**, không phải file, không phải cả
  sequence. Người dùng tự quyết cắt cái nào bằng cách chọn nó.
- **Tool tự đo, không hỏi lại.** Người dùng không phải nghe trước rồi nhập số.

Panel cần đọc được từ clip đang chọn: **đường dẫn file gốc** (để đưa FFmpeg đo)
và **vị trí trên sequence + điểm vào (inPoint) + tốc độ** (để quy đổi ngược thời
gian). AiO Editing đã có sẵn hàm đọc đường dẫn clip đang chọn — phần vị trí và
inPoint sẽ viết thêm.

## 4. Đường đi kỹ thuật (khi spike xong)

```
1. Người dùng chọn clip trên timeline  ->  panel đọc:
      đường dẫn file gốc · start/end trên sequence · inPoint · tốc độ
2. FFmpeg dò khoảng lặng trên FILE GỐC:
      ffmpeg -i <file> -af silencedetect=noise=-30dB:d=0.5 -f null -
      -> danh sách (silence_start, silence_end)
3. Quy đổi sang thời gian TRÊN SEQUENCE (trừ inPoint, nhân tốc độ)
4. Lọc: bỏ khoảng lặng quá ngắn, chừa "đệm" đầu/cuối mỗi đoạn nói
      (cắt sát quá thì nghe cụt hơi — phải để lại ~0.1-0.2s)
5. ExtendScript: cắt tại các điểm -> xoá đoạn lặng -> dồn lại
```

**Hai tham số người dùng sẽ muốn chỉnh:**
- **Ngưỡng im lặng** (dB) — phòng ồn thì phải nới
- **Độ dài tối thiểu** của khoảng lặng mới cắt (giây) — tránh cắt vụn từng hơi thở
- (và **đệm** giữ lại hai đầu — mặc định ~0.15s)

---

## 5. ĐÃ CHỐT: dự án RIÊNG, extension riêng

Anh Tiến chốt 2026-07-27: *"file mới bỏ vào folder này nhé"* — toàn bộ mã nguồn
Autocut nằm trong `E:\2026\Production\AiO Studio\AiO Autocut\`, là một CEP
extension **độc lập** với AiO Editing (id riêng: `com.aiostudio.autocut`).

Giá phải trả — biết trước để khỏi ngạc nhiên:
- Đóng gói **thêm ~145 MB** FFmpeg (chấp nhận được, ổ anh dư)
- Anh **cài 2 panel**, mỗi cái một lần bấm đúp

Đổi lại: mỗi việc một panel, gỡ/cập nhật riêng, không làm phình panel đang dùng
hằng ngày. Dùng lại **cách làm** của AiO Editing (bộ ký, bộ cài, cách gọi FFmpeg,
cách chọn track không đè) chứ không dùng chung mã nguồn.

<details>
<summary>Bảng cân nhắc lúc đầu (giữ lại để sau này không bàn lại)</summary>

| | Extension RIÊNG | Thêm vào AiO Editing |
|---|---|---|
| FFmpeg | Đóng gói **thêm 145 MB** nữa | Dùng chung, 0 MB |
| Cài đặt | Anh cài **2 panel** | Cài 1 lần |
| Ký / bộ cài | Làm lại bộ script | Có sẵn |
| Chạy thử ExtendScript | Phải dựng panel mới xong mới thử được | **Thử được ngay hôm nay** |
| Gọn gàng | Mỗi việc một panel | Panel phình thêm một mục |

Đề xuất lúc đầu là thêm vào AiO Editing cho đỡ tốn — anh chọn tách riêng.

</details>

**Hệ quả cho việc SPIKE:** cách duy nhất chạy ExtendScript trong Premiere là qua một
CEP panel. Vì làm extension riêng nên phải dựng khung panel trước đã — nhưng dựng
**tối giản**, màn hình đầu tiên CHÍNH LÀ nút thử razor. Không có gì phải vứt đi.

---

## 5b. Tính năng kế tiếp — AUTOSUB TIẾNG VIỆT (anh Tiến đặt 2026-07-27)

Sau khi Autocut chạy: **tự tạo phụ đề tiếng Việt**.

**Nặng hơn Autocut nhiều — biết trước để không hứa ẩu:**

| | Autocut (đang làm) | Autosub tiếng Việt |
|---|---|---|
| Công cụ | FFmpeg (đã bundle, 145 MB) | **Whisper** — mô hình AI nghe tiếng nói |
| Dung lượng | 0 thêm | mô hình **0,5–3 GB** tuỳ độ chính xác |
| Thời gian chạy | vài giây | **vài phút** cho clip vài phút (tuỳ CPU/GPU) |
| Độ chắc chắn | FFmpeg đo biên độ, không đoán | AI nghe — tiếng Việt **có thể sai**, nhất là tên riêng, số, từ chuyên ngành |

**Đây đúng là chỗ AiO Sub đã chết.** Tài liệu của nó ghi: *"chưa có ASR thật vì
máy chưa cài ffmpeg/whisper"*. Nếu lặp lại kiểu "bắt người dùng tự cài" thì
Autosub trong Autocut cũng sẽ nằm im y như vậy.

**Ba câu phải trả lời trước khi bắt tay (chưa hỏi anh Tiến):**
1. **Mô hình nằm ở đâu?** Bundle luôn (panel phình 1–3 GB) hay tải về lần đầu
   dùng (có thanh tiến trình)? Nghiêng về tải lần đầu — một lần rồi thôi.
2. **Độ chính xác nào là đủ?** `small` nhanh nhưng tiếng Việt sai nhiều;
   `medium`/`large` chính xác hơn nhưng nặng và chậm.
3. **Làm mới hay hồi sinh AiO Sub?** AiO Sub đã có sẵn phần sinh SRT + gắn
   timecode + import vào Premiere — bỏ đi thì phí.

**Điểm cộng nếu làm:** Whisper trả về mốc thời gian **theo từng từ**. Nghĩa là
cùng một lần chạy, ta có luôn:
- phụ đề tiếng Việt
- và **autocut chính xác hơn** — cắt theo câu nói, bỏ được từ đệm ("ừm", "à")
  thay vì chỉ dò biên độ âm thanh.

Tức là hai tính năng dùng chung một bộ máy. Nhưng **chỉ làm sau khi Autocut bằng
FFmpeg chạy được** — đừng chồng một cái khó lên một cái chưa chắc.

## 6. Thứ tự làm

1. **SPIKE razor + ripple delete** (rủi ro cao nhất, làm trước)
2. FFmpeg dò khoảng lặng → danh sách thời điểm (phần này chắc chắn chạy)
3. Quy đổi thời gian file gốc ↔ sequence, test với clip đã trim đầu
4. Ghép hai đầu + giao diện 3 tham số
5. Thử trên video thật của anh, đo: cắt đúng bao nhiêu điểm, sai bao nhiêu
