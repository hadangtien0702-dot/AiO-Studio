# AiO Autocut — đọc cái này trước

> Nạp tự động mỗi phiên trong thư mục dự án, và **đi theo mã nguồn**.
> Lập 2026-07-27 · viết lại 2026-07-29 sau khi tách phần phụ đề ra panel riêng.

## Đọc trước khi sửa

1. `PLAN.md` — mục tiêu, quyết định đã chốt, **rủi ro lớn nhất**
2. `PROGRESS.md` — khối "Trang thai hien tai" ở đầu file
3. `KE-HOACH.md` — thứ tự việc tiếp theo và **lý do** của thứ tự đó

---

## Sản phẩm này làm gì

Đọc clip trên timeline Premiere → dò **khoảng lặng** trong tiếng nói → **cắt, xoá
đoạn lặng, dồn clip lại**. Cho nội dung talking-head / UGC / review.

*Ví dụ đời thường:* dựng một video phỏng vấn 1 tiếng, người ta nói xong một câu
rồi **ngập ngừng nửa giây** trước câu sau — cả trăm chỗ như vậy. Ngồi cắt tay là
hết buổi chiều. Panel này làm hết trong một nút, và **chừa lại nhịp thở** để nghe
vẫn tự nhiên chứ không dồn cục.

Đã chốt với anh Tiến: dò **khoảng lặng** (không phải cảnh / nhịp nhạc / lời
thoại), và **cắt + xoá + dồn** (không phải chỉ đánh dấu).

**Panel này KHÔNG làm phụ đề** (anh Tiến chốt 29/07). Whisper vẫn chạy ngầm để
quyết định điểm cắt, và kết quả nghe được **ghi lại làm bộ đệm** cho panel
Transcript. Làm phụ đề là panel riêng: `com.aiostudio.transcript`.

---

## ☠️ HƯỚNG SẢN PHẨM: PHÁT TRIỂN RIÊNG, BÁN CHUNG MỘT BỘ

Anh Tiến chốt 2026-07-29: *"anh muốn là phát triển từng tính năng cho hoàn chỉnh,
sau đó sẽ ghép lại một bộ thành cài đặt một lần — người dùng sẽ trả tiền cho toàn
bộ tính năng đó để có thể dùng"*.

Nghĩa là:
- **Bốn thư mục riêng** = để dễ sửa, dễ quản lý, dễ phát triển từng cái cho xong.
  **KHÔNG phải** để bán rời từng cái.
- **Đích đến: MỘT bộ cài, MỘT giá, mở ra có đủ 4 tính năng.**
- Đừng thiết kế gì theo hướng "khách chỉ mua panel này". Cứ giả định **khách có đủ**.

Chi tiết lộ trình: **`../PIPELINE.md`**.

Anh Tiến chốt: *"anh muốn xây dựng tool của người Việt để đem ra nước ngoài bán…
phải là bộ tool này đó em"* — cạnh tranh **AutoCut** (10 thẻ) và **AutoPod**
($29/tháng, khoá theo máy).

Kèm lời anh nhắc: *"anh có kinh nghiệm làm editor 5 năm, anh biết pain point của
editor"* → **hỏi anh khi cần quyết định sản phẩm**, đừng tự đoán thay.

| Sản phẩm | Extension ID | Cổng debug |
|---|---|---|
| Asset Manager | `com.aiostudio.assetmanager` | 8088 |
| Power Bins | `com.aiostudio.powerbin` | 8090 |
| **Autocut** (đây) | `com.aiostudio.autocut` | **8089** |
| Transcript | `com.aiostudio.transcript` | 8091 |

☠️ **Dính với Transcript ~80% mã** — `whisper.ts`, `ffmpeg.ts`, `amluong.ts`.
Sửa mấy file đó thì **nhớ chép sang Transcript**.
**Bộ đệm nghe dùng chung** (`<tên>.autocut-nghe.json` cạnh video) — **cố ý**, để
khách chạy Autocut xong bấm Transcript chỉ mất ~0,8 giây. Bán chung một bộ nên
luôn giả định khách có đủ cả hai.

### Ba luật cũ nay LỖI THỜI
Chứng chỉ code-signing thương mại · khoá bản quyền · macOS — bán ra ngoài thì cả
ba đều **bắt buộc**. Chữ ký tự tạo như hiện nay thì máy khách cài sẽ bị Windows chặn.

### FFmpeg — ĐÃ XONG
Trước 29/07 bundle bản GPL (`--enable-gpl`, `libx264`) → bán là phải mở mã nguồn.
Nay dùng **LGPL** `N-125829-gfe953596e9-20260728`. Đã đo: `silencedetect` cho
**32 khoảng lặng y hệt bản cũ**, chạy AUTO CUT thật ra **16 nhát cắt y hệt**,
sequence lệch **0,04 giây = đúng một khung hình**.
Whisper thì sạch sẵn: `whisper.cpp` và model đều MIT.

### ☠️ ĐA NGÔN NGỮ: KHÔNG DÙNG CHUNG BỘ SỐ CỦA TIẾNG VIỆT
Hiện khoá cứng `-l vi`. Whisper nghe được 99 thứ tiếng nên mở ra không khó về kỹ
thuật, nhưng **ba tham số dưới đây đo riêng trên giọng Việt của anh Tiến**:
- **biên +2 dB** — tiếng Anh nói nhanh, nối âm, khoảng lặng giữa từ ngắn hơn
- **`-mc 0`** — bật để chữa Whisper bịa; với tiếng Anh có thể không cần
- **từ đệm** — "ờ, ừm" khác "uh, um, like"

→ Làm **bảng tham số theo ngôn ngữ**, mỗi ngôn ngữ phải có một file thật để đo.

### Tool MÙ về hình ảnh — nhớ khi hứa tính năng
Nó chỉ nghe, chưa từng đọc một khung hình nào. **AutoZoom** (phóng vào mặt),
**AutoBRoll** (chèn cảnh minh hoạ) đều cần thứ mình chưa có.
Riêng **multicam** có đường vòng: mỗi người một track tiếng riêng thì suy ra được
ai đang nói mà không cần nhìn hình.

---

## TỪNG TÍNH NĂNG — ba lớp

### 1. AUTO CUT — cắt khoảng lặng

**Người xài thấy gì:**
- Khoanh `I`/`O` → chọn 1 trong 3 mức → chọn nơi đặt kết quả → bấm **AUTO CUT**
- Ba mức nói bằng tiếng nghề, và bấm mức nào là thấy ngay **hình timeline mô
  phỏng** (đỏ là chỗ bỏ):

  | Mức | Mô tả | Còn lại |
  |---|---|---|
  | Giữ nhịp | Bỏ dead silent dài · giữ nhịp nói tự nhiên | **87%** |
  | Vừa | Bỏ phần lớn dead silent · vẫn còn khoảng thở | **74%** |
  | Cắt sạch | Bỏ sạch dead silent · nhịp dồn liên tục | **57%** |

- Chạy một lúc thì **dừng lại cho xem dải sóng THẬT** của chính clip mình, ưng
  rồi mới bấm **CẮT ĐI**
- Hai lựa chọn đặt kết quả: **Tạo sequence mới** (mặc định, an toàn) hoặc **Cắt
  tại chỗ** (sửa thẳng sequence đang mở, có nút **↩ Hoàn tác cắt**)
- Xong: ba con số (nhát cắt · rút ngắn · chạy mất) + số **chỗ cần nghe lại**
- Thời gian: **video 1 giờ ≈ 19 phút**

**Builder phải biết:**
- Luật cắt = **giao hai nguồn**. Dùng một nguồn là hỏng — đã trả giá cả hai lần.
- **Whisper BẮT BUỘC**, không có công tắc tắt. Chưa cài thì **báo lỗi và dừng**,
  không lùi về cắt-bằng-độ-to (bản 0.9.0 làm vậy và **cắt mất 321 câu**).
- Luôn dùng mô hình **nhanh** — đã đo, hai mô hình cho **cùng 920 nhát cắt**.
- Bước dựng chiếm **83% thời gian**, thủ phạm là `overwriteClip` của Adobe.
- **Cắt tại chỗ**: Premiere không cho panel ripple delete, nên host **xoá sạch
  vùng rồi chèn lại**. Từ chối khi còn clip phía sau vùng (`CON_CLIP_SAU_VUNG`).
- **Ctrl+Z KHÔNG cứu được cắt tại chỗ** — N đoạn = N bước undo. Premiere Beta
  26.5 **không có** API gộp undo (đã đo). Nên panel tự nhớ mô tả clip gốc.
- ⚠️ **Ba nút mức bị KHOÁ ở bước xem trước** (`disabled={!!dangChay}`). Đo 29/07:
  bấm mức nào cũng không ăn, con số không đổi. Chúng chỉ đổi được **trước khi
  bấm AUTO CUT**. Tài liệu cũ ghi "đổi mức xem lại được" là **sai** — đã sửa câu
  đó ở đây. Muốn cho đổi mức ở bước xem trước thì phải sửa điều kiện `disabled`.

### 2. XEM TRƯỚC DẢI SÓNG

**Người xài thấy gì:** đường cam là ngưỡng — nó **nhấp nhô theo nền ồn từng
đoạn**, không phải một mức cứng cho cả file. Đỏ là chỗ sẽ bỏ.

**Builder phải biết:** ước lượng ở bước này cố ý **hơi thấp** — bước nghe hiểu
chạy sau còn bỏ thêm. Không được để ước lượng **cao hơn** thực tế.

---

## ☠️ LUẬT CẮT — GIAO HAI NGUỒN (1.0.0)

```
cắt  ⟺  Whisper KHÔNG nghe ra chữ ở đó  VÀ  năng lượng dưới nền ồn CỤC BỘ + biên
```

Mỗi nguồn chỉ được hỏi đúng thứ nó giỏi. **Dùng một mình nguồn nào cũng hỏng —
đã trả giá cả hai lần trong cùng một ngày:**

| Đã thử | Kết quả |
|---|---|
| Chỉ mốc CÂU (0.5.0–0.6.2) | phủ 99,2% timeline → 58 phút cắt được **9,8 giây** |
| Chỉ năng lượng (0.7.0–0.9.0) | **321 câu bị cắt mất quá nửa lời** |
| **Giao hai nguồn (1.0.0)** | 413 nhát, rút 4:03, **0 câu hỏng** |

Ba điều kèm theo, đều đo được:
- **Nền ồn phải đo CỤC BỘ** (mỗi 30 giây) — nó dao động 7,9 dB giữa các phút.
- **Lọc dải giọng nói 300–3400 Hz trước khi ĐO** → tách rộng thêm 3,6 dB.
- **Nhưng Whisper phải nghe bản GỐC** — nghe bản lọc thì kém hẳn (2.033 → 1.576
  câu). *Lọc cho máy ĐO, giữ nguyên cho máy NGHE.*

### Ba mức quyết định — máy không tự quyết ở chỗ nó không chắc

| Tình huống | Máy làm |
|---|---|
| Hai nguồn đều thuận | **CẮT** |
| Có nguồn chống | **GIỮ**, im lặng |
| **Hai nguồn KHÔNG ĐỒNG Ý** | **GIỮ + đặt marker VÀNG** — người nghe tự quyết |

"Không đồng ý" = năng lượng bảo có tiếng mà Whisper **không đặt chữ nào** vào
vùng đó, dài ≥ 0,8s (`vungNgoNgo`). Đo trên video 58 phút: **6 chỗ**, và nó bắt
đúng chỗ anh Tiến chỉ ra mà không phân giải được bằng dữ liệu.

Panel này **chỉ giữ marker VÀNG**. Marker ĐỎ (nghe không chắc chữ) là chuyện của
phụ đề, đã chuyển sang panel Transcript.

### ☠️ NGƯỠNG dB KHÔNG ĐƯỢC ĐẶT CỨNG
Bản 0.7.0 để cứng −22 dB cho mức "Cắt sạch" và **cắt mất 249 câu nói (5,7 phút)**
trên clip hai người: người ngồi xa mic nói ở **−36 dB**.

| file | nền ồn | giọng | cách nhau |
|---|---|---|---|
| Heygen (studio) | −78,4 dBFS | −14,8 | 63,6 dB |
| iPhone (garage, 2 người) | −40,8 dBFS | −26,3 | **14,6 dB** |

Otsu cũng không cứu được. **Không có công thức nào bắc cầu được giữa hai file**
→ phải dò bằng đo, xem `chonNguong()`.

**Bài học rộng hơn: kết quả "đẹp" chưa chắc đúng.** 58:37 → 24:41 nhìn rất ngon
cho tới khi đo cái **BỊ MẤT ĐI**. Luôn đo cả hai phía.

### ☠️ ĐỪNG DÙNG WHISPER LÀM "NGƯỜI GÁC CỔNG" ĐIỂM CẮT
Bản 0.5.0–0.6.2 đặt luật *"chỉ cắt khi biên độ thấp VÀ không nằm trong câu nào"*.
Đã gỡ ở 0.7.0. Bằng chứng đo thật:
1. **Mốc CÂU phủ 99,2%** timeline video 58 phút.
2. **Mốc TỪ cũng không cứu — phủ 95,5%.** 13.563 từ thì **1.391 từ có mốc kết
   thúc ≤ mốc bắt đầu**.
3. **Cờ `-dtw` không có tác dụng** — chạy lại 6 phút, ra file giống hệt từng byte.

Đọc thẳng PCM của WAV: nhóm bị Whisper chặn (1.837 chỗ) và nhóm được cắt (15 chỗ)
**im ngang nhau** (−26,2 dBFS) ⇒ vùng bảo vệ không lọc được gì.

→ Whisper chỉ còn làm **chốt chặn** (nhát cắt nào nuốt trọn một câu thì bỏ nhát
đó — phải chặn **SAU** bước gộp khoảng) và **thước đo để tự dò ngưỡng**.

### ☠️ ĐỪNG BỎ `-mc 0` — nó chữa việc Whisper BỊA suốt 26 phút
Whisper mang **ngữ cảnh chữ** từ đoạn 30 giây này sang đoạn sau. Trượt một lần là
nó lấy chính chữ nó vừa bịa làm ngữ cảnh → trượt tới hết file.

| | câu | nằm trong chuỗi LẶP | chuỗi dài nhất |
|---|---|---|---|
| mặc định | 2.033 | **1.238 (60,9%) — 25:45** | **806 lần** cùng một câu |
| **`-mc 0`** | 762 | 28 (3,7%) — 62 giây | 15 lần |

Đã đo tác dụng phụ: **cắt không đổi** (415 → 415 nhát), chỗ "máy không chắc"
**giảm 17 → 3**.

**Và đừng bỏ `-p 1`.** `-p 2` nhanh hơn 27% nhưng **chẻ câu thành nhiều mảnh**.

⚠️ Chuyện Whisper bịa **KHÔNG làm hỏng việc cắt** — đã đo: vùng nghi bịa và vùng
câu thật có năng lượng y hệt nhau (70,8%/70,8%). Chỉ phụ đề là rác.

---

## MVP — bảng chốt, đo bằng số

| Tính năng | MVP = xong khi | Đo bằng | Nay |
|---|---|---|---|
| **Auto Cut** | Khoanh I/O → bấm → ra sequence mới, hình tiếng liền mạch, không nuốt trọn câu nào | Hình = Tiếng = Yêu cầu; `demCauBiNuot` = 0 | ✅ đo 29/07: **17 đoạn · 72,04s cả ba · 0 câu nuốt** |
| Xem trước dải sóng | Bấm 3 mức thấy ngay khác biệt, ước lượng **không cao hơn** thực tế | ba mức ba số khác nhau | ✅ **87% / 74% / 57%** |
| Cắt tại chỗ | Cắt thẳng sequence đang mở, và **lùi lại được** | hoàn tác về đúng số clip + độ dài | ✅ 1 clip 81,72s → cắt → **về lại 1 clip 81,72s** |
| Sạch GPL để bán | FFmpeg không `--enable-gpl` | đọc chuỗi configuration | ✅ LGPL từ 29/07 |
| **Đổi FFmpeg không làm đổi cách cắt** | Thuật toán ra kết quả y hệt bản GPL | chạy lại đúng clip cũ | ✅ `silencedetect` **32 = 32** khoảng lặng · **16 = 16** nhát cắt · sequence lệch **0,04s = đúng 1 khung hình** |

**☠️ CHƯA ĐẠT — thứ quan trọng nhất còn nợ:**

| | MVP = xong khi | Vì sao chưa đạt |
|---|---|---|
| **Tin được là không cắt mất lời** | Có **thước đo TỪ NGOÀI** xác nhận | Đang lấy chính Whisper + năng lượng để chấm điểm việc cắt do chúng quyết định — **vòng quanh, nó luôn tự khen mình**. Đã báo "0 câu mất" **ba lần**, ba lần anh Tiến vẫn nghe ra chỗ mất. → Cần **Silero VAD** (mô hình khác) hoặc tai anh Tiến. |
| **Đủ nhanh để bán** | Video 1 giờ chạy **dưới 5 phút** | Nay **19 phút**; bước dựng ăn 83% (`overwriteClip` của Adobe, không sửa được từ ExtendScript). → Cần **xuất FCPXML** rồi import một lần. |
| Chữ ký thương mại · khoá bản quyền · macOS | | Chưa có |

☠️ **Chừng nào chưa có thước từ ngoài, mọi con số chỉ được nói ở mức "khá hơn
lần trước", KHÔNG được nói "đã đúng".** Và phải nói rõ giới hạn đó với anh Tiến.

**Ngoài MVP — cố ý CHƯA làm:** cắt từ đệm/câu lặp (mốc từ Whisper hỏng 7–16%),
podcast nhiều mic (chưa đọc được A1/A2/A3 riêng), đa ngôn ngữ.

---

## 📋 Kế hoạch bước tiếp theo: đọc `KE-HOACH.md`

Thứ tự đã cân nhắc và có lý do: **(1) sổ ghi phiếu + học từ tay anh Tiến** →
(2) Silero VAD → (3) xuất FCPXML cho bước dựng → (4) cắt từ đệm/câu lặp →
(5) podcast nhiều mic.

## ☠️ ĐO CÁI MÌNH ĐỊNH SỬA, TRƯỚC KHI SỬA

Vấp thật 28/07. Bước dựng chậm dần theo độ sâu (0,50 → 1,13 giây/đoạn) — đúng
dấu hiệu N². Nhìn code thấy `ac_mocCuoi()` đọc `track.clips.numItems` sau mỗi
đoạn. Kết luận ngay đó là thủ phạm. Sửa, cài, chạy lại **25 phút**.

**Cả hai kết quả đều bác bỏ:** không nhanh hơn chút nào (độ dốc 0,00082 so với
0,00083), lại còn làm **hở 0,367 giây**.

Đo thẳng cái hàm bị nghi oan, trên track 588 clip: **`ac_mocCuoi` = 0,2 ms/lần**,
trong khi mỗi đoạn tốn 400–500 ms. Nó **chưa bao giờ** là thủ phạm.

**Luật:** thấy dấu hiệu là một chuyện, biết thủ phạm là chuyện khác.

## Ba cái bẫy đã trả giá — đọc trước khi sửa host

1. **Premiere nạp `host/index.jsx` đúng một lần lúc khởi động.** Cài bản mới rồi
   reload panel = giao diện mới, host cũ, mọi hàm mới trả `EvalScript error.`
   → panel tự gọi `napLaiHost()` (`$.evalFile`) trước mỗi lệnh.
2. **Không được bọc `$.evalFile` trong hàm** — hàm nạp vào scope hàm đó rồi biến mất.
3. **`createNewSequence()` mở hộp thoại rồi treo cả ExtendScript.** Dùng
   `createNewSequenceFromClips` — nó còn tôn trọng in/out và tự kéo tiếng theo.

## ☠️ UNDO LÀ THAO TÁC PHÁ, KHÔNG PHẢI ĐƯỜNG LÙI AN TOÀN

Vấp 29/07: gọi `undo()` trong vòng lặp 40 lần với điều kiện dừng không bao giờ
đạt → undo lùi qua điểm gốc rồi đi tiếp về **0 clip, sequence trống trơn**. Redo
không cứu. Phải dựng lại tay, kết quả **lệch 0,03 giây**.

- Thử tính năng **phá hoại** thì thử trên **bản sao**
- **Đừng bao giờ gọi undo trong vòng lặp**
- **Ghi lại trạng thái gốc TRƯỚC khi bấm** (số clip, mốc đầu/cuối)

## ☠️ GIAO DIỆN ĐÃ CHỐT 2026-08-03 — ĐỪNG THIẾT KẾ LẠI

Anh Tiến: *"anh chốt UI cho auto cut rồi đó em, chốt phiên bản này nhé em"*.

**Nguồn chân lý của HÌNH: `AiO Design System/Design/Auto Cut.html`** — anh Tiến
tự dựng bằng Claude design. ☠️ **File đó là của anh ấy, KHÔNG được sửa.** Nguyên
văn: *"file HTML là file anh chốt thiết kế, em không được sửa thiết kế anh chốt"*.
Muốn đổi hình thì đổi ở đó trước, rồi mới ghép vào panel.

Cách ghép (đã làm, giữ nguyên lối này cho các panel sau):
- `client/src/giao-dien.css` — **file riêng**, nạp SAU `styles.css` để thắng ở
  tên class trùng. Không viết đè `styles.css` vì file đó còn giữ dạng của
  `.chay` · `.ket` · `.lui` · `.loi` đang chạy — dựng lại giao diện và có nguy cơ
  phá mấy khối đó CÙNG LÚC thì không biết cái nào gây lỗi.
- `Timeline.tsx` (hai dải xem trước) · `BangDoan.tsx` (bảng + bảng mẫu) — mới.
- `DaiSong.tsx` và `MinhHoaNoiDat.tsx` **giữ lại, thôi dùng**. `DaiSong` có
  **đường ngưỡng cam nhấp nhô theo nền ồn** — thứ chứng minh tool không cắt nhầm
  lời người ngồi xa mic. Thiết kế mới không có chỗ cho nó. Cần trưng lại thì có sẵn.

**Panel nay là CỬA SỔ RIÊNG**, không dock được nữa: `<Type>Modeless</Type>`,
kho mở 1280x800. Anh Tiến: *"khi bấm vào thì mặc định mình sẽ bung một cửa sổ
riêng biệt nằm ngoài luôn với UI gốc đẹp nhất"*. Dock bên phải chỉ được 360px
thì lưới hai cột luôn rơi về một cột. ☠️ Đổi `Type` **bắt buộc tắt hẳn Premiere**
rồi mở lại, reload panel không ăn.

☠️ **Khổ cửa sổ THẬT khác số trong manifest.** Máy anh Tiến `devicePixelRatio
= 1.5` nên `Size 1280x800` mở ra chỉ **1005x682 CSS px**. Mọi ngưỡng media query
phải nghĩ theo số THẬT đó, và phải đo trên panel đang chạy chứ không đo trên
Chrome máy.

### Thứ đã GỠ khỏi màn hình — ghi để phiên sau đừng "sửa lại cho đúng"

| Gỡ cái gì | Vì sao | Mất gì |
|---|---|---|
| Dòng *"Đây là ước tính hơi thấp — thực tế ngắn hơn 3–8%"* | Anh Tiến: *"remove cho anh chỗ này của em luôn"* | Thứ DUY NHẤT nói con số kia là ước lượng. Đo thật: máy luôn cắt NHIỀU HƠN hình vẽ (Cắt sạch 488,6 → 501,0s) |
| Khối tiến trình ở bước xem trước | Lúc đó luồng đang **đợi người dùng**, mà nút ngay dưới đã nói đủ | Không mất gì — nó lặp |
| Card "Kết quả" trong lúc đang chạy | Nhường 138px cho ô tiến trình | Không mất — lúc đó ba số kia mới là ước lượng |

### Ô "Ước còn lại" đang NÓI DỐI — chưa chốt cách xử lý

Ba số 87/74/57% đo trên **video 58 phút**, không phải clip đang mở. Đo trên
Test3 (26 phút, mức "Cắt sạch"): thực tế **cắt được 30 giây, còn 98%** — lệch
**41 điểm phần trăm**. Đã báo anh Tiến hai lần, chưa chốt bỏ hay giữ.
→ Cùng loại lỗi anh Tiến từng bắt: *"đừng lấy số đo ra bao biện cho thứ hiển thị
sai"*. Đừng để nó nằm im mãi.

## Góc nhìn NGƯỜI DÙNG (bối cảnh cũ, vẫn đúng)

Anh Tiến chốt 28/07: *"anh em mình đang build và kiểm tra dưới góc nhìn của một
production owner. Khi build xong em sửa UI thành góc nhìn của một editor sử dụng
tool này."*

Người dựng cần biết *cắt xong chưa · ngắn đi bao nhiêu · có chỗ nào cần soát lại*.
KHÔNG cần số khoảng lặng thô, số từ, thời gian từng bước, tên mô hình.
**Đừng xoá code đo — chỉ giấu.** Lần sau sửa thuật toán lại cần.

## Nguyên tắc riêng của dự án này

**Đây là công cụ SỬA THẬT vào dự án của người dùng.** Cắt nhầm là mất công dựng lại.
- Mọi thao tác ghi lên timeline phải **thử trên sequence thử trước**
- Ưu tiên phương án **không phá được**: làm trên bản sao, hoặc cho hoàn tác
- Báo rõ **sẽ cắt bao nhiêu điểm** trước khi cắt

## Quy ước

- Cổng debug **8089** — bốn panel không được trùng cổng
- Build: `cd client && npm run build` rồi `scripts\sign-install.ps1`
- Phát hành: `scripts\package-release.ps1` (tự đóng gói file giấy phép LGPL)
- Sửa `CSXS/manifest.xml` → **tắt hẳn Premiere rồi mở lại**
- Phần tính toán tự kiểm được bằng số, không cần Premiere: `cd client && npm run kiem`
- Ghi `PROGRESS.md` sau mỗi lần sửa: không dấu, không emoji, giờ lấy bằng lệnh
