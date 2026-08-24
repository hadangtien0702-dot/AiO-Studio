# AiO Transcript — đọc cái này trước

> Nạp tự động mỗi phiên trong thư mục dự án, và **đi theo mã nguồn**.
> Dự án **tách ra khỏi AiO Autocut ngày 2026-07-29** để phát triển độc lập.

## Đọc trước khi sửa

1. `PROGRESS.md` — khối "Trang thai hien tai" ở đầu file
2. `../PIPELINE.md` — hướng sản phẩm chung của cả bộ

---

## ☠️ HƯỚNG SẢN PHẨM: PHÁT TRIỂN RIÊNG, BÁN CHUNG MỘT BỘ

Anh Tiến chốt 2026-07-29: *"anh muốn là phát triển từng tính năng cho hoàn chỉnh,
sau đó sẽ ghép lại một bộ thành cài đặt một lần — người dùng sẽ trả tiền cho toàn
bộ tính năng đó để có thể dùng"*.

Nghĩa là:
- **Bốn thư mục riêng** = để dễ sửa, dễ quản lý, dễ phát triển từng cái cho xong.
  **KHÔNG phải** để bán rời từng cái.
- **Đích đến: MỘT bộ cài, MỘT giá, mở ra có đủ 4 tính năng.**
- Nên đừng thiết kế gì theo hướng "khách chỉ mua panel này" — ví dụ đừng bỏ công
  làm bộ đệm riêng chỉ vì sợ khách không có panel kia. Cứ giả định **khách có đủ**.

Chi tiết lộ trình: **`../PIPELINE.md`**.

| Thư mục | Extension ID | Cổng debug |
|---|---|---|
| AiO Asset Manager | `com.aiostudio.assetmanager` | 8088 |
| AiO Power Bins | `com.aiostudio.powerbin` | 8090 |
| AiO Autocut | `com.aiostudio.autocut` | 8089 |
| **AiO Transcripts** (đây) | `com.aiostudio.transcript` | **8091** |
| AiO WebDessign | — | web bán hàng (Next.js) |

☠️ **Dính với Autocut ~80% mã** — `whisper.ts`, `ffmpeg.ts`, `amluong.ts`.
Sửa mấy file đó thì **nhớ chép sang Autocut**.

---

## Sản phẩm này làm gì

Đọc clip trên timeline → chép lời thành **phụ đề `.srt`**, gắn thẳng lên sequence
đang mở, kèm **marker ở chỗ máy nghe không chắc**. Không cắt gì, không dựng
sequence mới.

*Ví dụ đời thường:* làm phụ đề tay cho video 1 tiếng là ngồi nghe đi nghe lại,
gõ từng câu, canh từng mốc — nửa ngày. Panel này chép xong trong **4 phút**, và
**cắm cờ ở đúng chỗ nó nghe không chắc** để mình chỉ phải nghe lại vài chỗ đó
thay vì cả video.

---

## TỪNG TÍNH NĂNG — ba lớp

### 1. LÀM PHỤ ĐỀ

**Người xài thấy gì:**
- Khoanh `I`/`O` → chọn mô hình (**Nhanh** / **Phụ đề câu dài**) → bấm **LÀM PHỤ ĐỀ**
- Phụ đề + marker gắn **thẳng vào sequence đang mở**
- Xong: số câu đã chép · chạy mất · số chỗ cần soát · đường dẫn file `.srt`
- Thời gian: **video 1 giờ ≈ 4 phút** — và nếu vừa chạy Autocut trên đúng file đó
  thì chỉ còn **vài giây** (dùng lại bộ đệm)

**Builder phải biết:**
- Đây là **Auto Cut bỏ phần cắt**: chung 80% (tách tiếng + nghe hiểu), bỏ bước dò
  khoảng lặng, bỏ bước tính điểm cắt và dựng sequence.
- Kiểu kết quả **RIÊNG** (`KetPhuDe`), không nới `Ket` — `Ket` gắn chặt với việc
  dựng, nới ra là phải sửa mọi chỗ đọc `ket.kq`.
- ☠️ **Whisper BẮT BUỘC.** Không có công tắc tắt — tắt nghe hiểu thì panel này
  không còn gì để làm.

### 2. ☠️ QUY ĐỔI MỐC — MẮT XÍCH DỄ SAI NHẤT, ĐÃ HỎNG HAI LẦN

Whisper nghe trên **file gốc** nên mốc là mốc của file gốc. Nhưng phụ đề phải gắn
lên **sequence**, nơi clip đã bị trim, cắt, dồn. Hai trục thời gian khác nhau.

**Hai lỗi đã sửa ngày 29/07 — cả hai đều CÓ SẴN, không phải do lần tách:**

**Lỗi 1 — sequence nhiều clip chỉ ra 1 câu.**
Code chỉ lấy `vung.clips[0]` làm cả bảng quy đổi. Chạy trên sequence 17 clip do
Autocut sinh ra thì bảng chỉ có đoạn `[0 → 3,36]` → **15 trên 16 câu rơi ra ngoài
bảng và bị bỏ**. File `.srt` ra đúng **1 câu / 136 byte**, KHÔNG báo lỗi gì.
→ Sửa: `dungBangTuClip()` dựng bảng từ **mọi clip** trong vùng.

**Lỗi 2 — phụ đề đặt sai chỗ khi clip không bắt đầu ở giây 0.**
Anh Tiến chỉ ra bằng ảnh chụp timeline và hỏi đúng đặc tả: *"nhiều clip trong 1
sequence thì phụ đề được tạo đứng bên trong vùng in và out mới đúng em hả?"*
Host gọi `seq.createCaptionTrack(pi, 0, …)` — caption track **luôn đặt tại giây
0**. Mà bảng quy đổi lại chuẩn hoá mốc về 0. Kết quả: clip nằm 0:45–2:00 mà phụ
đề nằm 0:00–1:12, **lệch đúng 38,53 giây**. Marker lệch y hệt.
→ Sửa: mốc trong `.srt` là **GIỜ TUYỆT ĐỐI trên sequence** (`gocSeq = 0`).

☠️ **Đừng sửa lại về kiểu cũ.** Bộ tự kiểm mục **9b** có 9 phép đo dựng trên số
thật đo từ Premiere, trong đó **2 phép tái hiện lại chính hai lỗi này** — sửa
ngược là nó báo ngay.

**Còn nợ:** vùng trộn **nhiều file gốc** khác nhau. Nay chọn file chiếm nhiều
thời lượng nhất và **báo rõ** còn bao nhiêu clip của file khác chưa chép (trước
đây im lặng lấy `clips[0]`). Chép phụ đề cho nhiều file trong cùng một vùng là
việc riêng, chưa làm.

### 3. CẮT CÂU DÀI + XUỐNG DÒNG — cho phụ đề đọc kịp

**Người xài thấy gì:** phụ đề tự xuống dòng, **tối đa 42 ký tự một dòng, 2 dòng
một khối** — đúng chuẩn Netflix/BBC. Câu dài tự tách thành nhiều khối nối nhau,
cắt ở dấu chấm/dấu phẩy nếu được.

**Builder phải biết:**
- Giới hạn ở `GIOI_HAN_MAC_DINH`: `kyTuMoiDong 42` · `soDongToiDa 2` ·
  `giayToiThieu 1.0`. Truyền `gioiHan = null` vào `sinhSrt` là giữ nguyên kiểu cũ.
- ☠️ **Cắt SAU khi quy đổi mốc, không cắt trước.** Quy đổi làm việc trên mốc của
  file gốc; cắt trước là phải quy đổi lại từng mẩu, mà mẩu có thể rơi vào chỗ đã
  bị cắt bỏ → mất chữ.
- ☠️ **Để việc VẼ DÒNG quyết định chỗ cắt, đừng đoán bằng số ký tự.** Bản đầu
  29/07 cắt ở trần 84 rồi mới chia đôi — chia đôi ở ranh giới TỪ thì hai dòng
  không bao giờ đều, dòng sau lòi ra **45 ký tự**. Bộ tự kiểm bắt được **39 dòng**
  như vậy trên dữ liệu thật. Nay `catCauDai` gom **từng TỪ** vào khối, dừng ngay
  trước khi tràn quá số dòng → ràng buộc được bảo đảm **theo cấu tạo**.
- ☠️ **`xuongDong` trả về MẢNG dòng, không trả chuỗi nối bằng `\n`.** Cả file
  `.srt` nối bằng `\r\n`; nhét `\n` vào giữa là file trộn hai kiểu xuống dòng,
  có trình phát đọc sai. Bản đầu mắc đúng lỗi này.
- **Không cắt nếu khối con ngắn hơn `giayToiThieu`** — phụ đề chớp 0,3 giây còn
  khó chịu hơn một dòng hơi dài.

**MVP:** ✅ đo trên **765 câu thật** từ video 60 phút — dòng dài nhất **193 → 42**,
tỉ lệ vượt chuẩn **78,5% → 0,0%**, và **53.616 → 53.616 ký tự: không mất chữ nào**.

⚠️ **Cái KHÔNG chữa được, đừng hứa:** tốc độ đọc. Trung bình 18,8 ký tự/giây,
**25,5% vẫn quá 20**. Cắt khối không đổi được số này — đó là tốc độ **người ta
nói**. Chia 3 khối thì mỗi khối cũng chỉ hiện 1/3 thời gian. Muốn chữa thật thì
phải **bớt chữ** (tóm tắt), là việc khác.

### 3b. ☠️ HAI KHUNG HÌNH — NGANG 16:9 và DỌC 9:16

**Người xài thấy gì:** thanh **Khung hình** đặt TRƯỚC thanh chọn cách chép —
vì khung quyết định luật cắt câu. Mỗi thanh có một dòng nói **chọn cái này thì
sao**, khỏi phải chạy thử mấy phút mới biết.

| | NGANG 16:9 | DỌC 9:16 |
|---|---|---|
| Ký tự mỗi dòng | 42 | 20 |
| Dòng tối đa | 2 | 2 |
| **Từ tối đa mỗi khối** | không giới hạn | **6** |
| Khối ngắn nhất | 1,0s | 0,7s |
| Đo trên 1.028 khối thật | 0 vượt · 0 mất chữ | 0 vượt · 0 mất chữ |

**Builder phải biết:**
- ☠️ **`tuToiDa` là TRỤC THỨ HAI, không thay được bằng đếm ký tự.** Anh Tiến
  30/07: *"tối đa từ 4-6 từ thôi em, vì nó sẽ bị đè mép biên safe zone hoặc là
  tràn mép **mất chữ**"*. Ký tự là thước của MÁY; **từ là thước của người dựng**
  khi họ nhìn khung 9:16 và ước xem chữ có tràn không. 6 từ ngắn gọn hơn hẳn
  3 từ dài — giữ cả hai thì ràng buộc chắc ở cả hai phía.
- ☠️ **Có `tuToiDa` thì lệnh "khối chớp quá nhanh → trả về câu nguyên" BỊ VÔ
  HIỆU HOÁ, cố ý.** Đánh đổi đảo chiều: mất chữ là mất hẳn thông tin, không khâu
  nào sau cứu được; phụ đề chớp nhanh thì người xem vẫn đọc được. Giá phải trả
  đo được: **188 khối ngắn hơn 0,5s** (8,1%) so với 9 khối (0,9%) ở bản ngang.
- ☠️ **Chuẩn Netflix/BBC 42 ký tự là CHO VIDEO NGANG.** Đừng đem nguyên sang
  khung dọc — khung dọc chỉ rộng 9/16 = **56%**.
- Chọn bộ giới hạn bằng `gioiHanTheoKhung(khung)`, đừng gọi hằng trực tiếp.

**MVP:** ✅ cả hai bộ đo trên 1.028 khối thật đều **0 vượt chuẩn, 0 mất chữ**.
Bộ tự kiểm bắt được **2 lỗi** trong bản đầu — xem `PROGRESS.md` mục 2.2.0-dev.1.
✅ **Dọc đã chạy THẬT trên Premiere 30/07** (video tiếng Anh 39:01): 1.211 khối,
20/20 đơn vị · 0 vượt · 0 khối quá 6 từ · **giống hệt từng ký tự** với bản ngang
(28.502 = 28.502). Khối <0,5s chỉ **0,8%** trên tiếng Anh (dữ liệu Việt: 8,1%).
CJK trên Premiere thật vẫn chưa thử.

### 4. BẢNG SỬA TỪ NGHE NHẦM — ĐÃ GỠ KHỎI GIAO DIỆN 29/07

☠️ Anh Tiến chốt: *"editor sẽ sửa trong phần Properties của Pr luôn, không cần
phải thêm chỗ này"*. Premiere có sẵn panel Text/Captions, sửa thẳng trên
timeline thì thấy ngay chữ nằm ở đâu.

**Cái MẤT ĐI** (ghi ra để sau này ai cần thì biết): bảng đó sửa **tự động** cho
mọi lần chạy sau, còn Properties là sửa **tay** từng lần. Với người làm nhiều
video cùng một ngành (thuật ngữ lặp lại) thì cơ chế tự động tiết kiệm hơn.
`sinhSrt` **vẫn nhận** tham số `bangSua` — chỉ thiếu phần giao diện, bật lại được.

Phần dưới đây giữ lại vì nó giải thích **vì sao mồi từ vựng không dùng được** —
kết luận đó vẫn đúng và đã đo hai lần.

#### (giữ để tra cứu) Vì sao không mồi từ vựng cho Whisper

**Người xài thấy gì:** bảng cặp *"nó nghe ra" → "đúng phải là"*. Dạy máy thuật
ngữ ngành một lần, lần sau tự đúng. **Mặc định TRỐNG** — người dùng tự thêm từ
của ngành mình.

**Builder phải biết:**
- Mồi từ vựng cho Whisper (`--prompt`) **không sửa được chữ nào** (đã đo), còn
  làm "quỹ" thành "quỷ". Đây là lỗi NGHE (giọng miền Nam), không phải thiếu từ
  vựng — nên phải sửa **sau** khi nhận dạng.
- Lưu trong `localStorage`, khoá `aio-autocut-thay-tu`. Không có khoá thì dùng
  `THAY_TU_MAC_DINH`.
- ☠️ **`THAY_TU_MAC_DINH` PHẢI RỖNG — đừng nhét từ vào lại.**
  Trước 29/07 nó có sẵn 6 cặp đo trên clip **bảo hiểm** của anh Tiến. Anh mở một
  video **tuyển dụng** và bắt lỗi ngay: *"mấy cái từ này làm gì có trong video
  mới của anh?"*. Ba lý do:
  1. Bán ra thì khách lạ mở tool lên thấy thuật ngữ của một kênh Việt Nam.
  2. `lợi suất → lãi suất` **sửa BẬY** — "lợi suất" (yield) là từ đúng trong tài
     chính, khác hẳn "lãi suất". Ai làm video tài chính là bị sửa sai.
  3. Nó sửa **im lặng**, người dùng không có cách nào biết mà kiểm.

  Bộ tự kiểm mục 8 có 2 phép đo chặn việc nhét lại — sửa ngược là nó báo ngay.

  ☠️ **Bài học rộng hơn, cho mọi tính năng:** lần đầu em đo đúng (0 cặp ăn vào
  video mới, 25/25 câu giống hệt) nhưng **kết luận sai** — gọi nó là "vô hại".
  Anh Tiến bác lại và đúng. **Số đo "không gây hại lần này" không biến việc bày
  sai thành chấp nhận được.** Đừng lấy con số ra bao biện cho thứ hiển thị sai.

### 5. MARKER CHỖ NGHE KHÔNG CHẮC

**Người xài thấy gì:** marker trên timeline, bấm `M` đi tới từng chỗ.

**Builder phải biết:** dùng được vì đo thật 28/07 — 5 chỗ Whisper nghe sai xếp
hạng 1, 2, 3, 5, 8 trong 330 từ kém tin cậy nhất, trong khi cùng những chữ ấy ở
chỗ nghe ĐÚNG được 0,997–1,000. **Máy tự biết chỗ nào nó đoán mò.**
Ngưỡng 0,6 cho ra ~1,5% số từ; trần 60 marker (video vài tiếng ra hàng trăm chỗ,
rải kín timeline thì marker mất tác dụng — lấy những chỗ TỆ NHẤT).

### 6. ☠️ CÂY THƯỚC ĐO ĐỘ CHÍNH XÁC (WER) — mới 29/07, chưa dùng được hết

**Người xài thấy gì:** chưa thấy gì — đây là đồ nghề của builder, không lên UI.

**Builder phải biết:**
- `tests/wer.mjs` — so bản máy chép với **bản người soát bằng tai**, ra một con
  số. Chạy tự kiểm: `node tests/kiem-wer.mjs` (**52/52 đạt**).
- ☠️ **Đây là SER, đếm ÂM TIẾT.** Tiếng Việt viết rời từng tiếng ("bảo hiểm" =
  2 tiếng). Sai một dấu ("quỹ"→"quỷ") tính là **1 lỗi trên 1 âm tiết** — nặng
  ngang mất hẳn một tiếng, đúng cảm nhận người đọc phụ đề.
- ☠️ **NFC BẮT BUỘC.** "ế" có hai cách mã hoá Unicode nhìn giống hệt nhau. Bỏ
  chuẩn hoá thì bản chép **đúng hoàn toàn** vẫn ra WER gần 100% — số vô lý rất
  dễ tưởng là mô hình hỏng.
- **WER được phép vượt 100%** khi máy bịa thêm — phần "thêm" không có trần. Đó
  không phải lỗi tính toán, nó đang nói đúng mức độ thảm hoạ.
- Bộ nhớ: ma trận n×m. 5 phút ≈ 2,2 MB · 60 phút ≈ 324 MB · 3 tiếng thì **sập**
  → có trần `TRAN_O`, vượt thì báo lỗi rõ chứ không chết câm.

**☠️ CHƯA DÙNG ĐƯỢC HẾT — thiếu BẢN CHUẨN.** Cây thước có rồi nhưng chưa có
"mét chuẩn" để so. Bản chuẩn phải do **tai người** duyệt, không tự sinh được:
lấy bản Whisper làm chuẩn rồi chấm chính Whisper là đúng cái bẫy *thước làm
bằng cùng vật liệu với cái nó đo*.
→ `tests/soan-ban-chuan.mjs` soạn sẵn bản nháp, đánh dấu `[!]` chỗ hai mô hình
bất đồng và `[?]` chỗ máy tự khai không chắc — rút công soát từ "nghe hết"
xuống "nghe vài dòng". Soát xong đổi tên thành `<tên>.chuan.txt`.

### 7. ĐIỂM YẾU ĐÃ ĐO ĐƯỢC: TÊN RIÊNG TIẾNG ANH

Đo 29/07 trên hai clip thật của anh Tiến, **cả hai mô hình đều sai như nhau**:

| Đúng phải là | Máy nghe ra |
|---|---|
| ThinkSmart Insurance | **Think Small & Strong** |
| Elite Sales Agent | **Elix Sale Agent** |
| agent | **asian** (riêng large-v3; turbo đúng) |

- ☠️ **`--prompt` KHÔNG chữa được** — đo cả bài: **0 âm tiết đổi trên 295**.
  Đây là lần đo thứ hai, lần này trên **tên riêng** (lần trước 28/07 đo trên
  thuật ngữ tài chính tiếng Việt). Đừng thử lại lần ba.
- turbo **vẫn bịa lặp** dù đã có `-mc 0`: *"là một ceo một mentor"* lặp 2 lần.
  `-mc 0` giảm mạnh chứ không diệt hết.
- → Chỗ chữa được nằm ở **bảng sửa từ** (sau nhận dạng), không nằm ở mồi từ vựng.

### 8. BỘ ĐỆM KẾT QUẢ NGHE — điểm bán của cả bộ

**Người xài thấy gì:** chạy Autocut xong, bấm LÀM PHỤ ĐỀ trên cùng file thì gần
như tức thì.

**Builder phải biết:**
- Ghi cạnh video: `<tên>.autocut-nghe.json`
- Khoá theo **kích thước + giờ sửa của video** VÀ **theo mô hình**
- ☠️ **Dùng nhầm đệm là ra phụ đề của video khác** — hỏng âm thầm, kiểu lỗi tệ nhất
- **Cố ý dùng chung với Autocut.** Vì bán chung một bộ nên khách luôn có cả hai.

### 9. CAPTION KIỂU HIỆU ỨNG — Hormozi · Beast · Karaoke · Boxed · Clean (2.5.0, 22/08)

**Người xài thấy gì:** hàng **Kiểu caption** (Mặc định + 5 kiểu + kiểu riêng). Chọn
Hormozi → bấm → mỗi khối caption là **một graphic trên track video trống** (V2/V3…),
chữ in hoa viền đen, **từ khoá tô vàng**, pop khi vào; bấm vào clip là sửa chữ/đổi màu
trong Essential Graphics như text thường. Karaoke: từ đang nói sáng lên. Chạy lại thì
**thay** caption cũ, không chồng. Nút *"Thêm kiểu từ After Effects…"* mở thư mục
`%APPDATA%\AiOStudio\caption-styles` — thả `.mogrt` xuất từ AE vào là hiện nút mới
(xem `mogrt-src/HUONG-DAN-LAM-KIEU-RIENG.md`).

*Ví dụ đời thường:* caption track của Premiere là **phụ đề rạp phim** — đúng chuẩn,
nhưng không ai làm short kiểu Hormozi bằng nó. Kiểu hiệu ứng là **bộ chữ động của
CapCut/Submagic** nhưng nằm ngay trong Premiere và **sửa được từng chữ**.

**Builder phải biết:**
- Ba tầng: template `mogrt-src/build-mogrt.jsx` (chạy trong **AE qua BridgeTalk** từ
  Premiere — `AfterFX -r` không chạy trên Beta 27) → `mogrt/*.mogrt` · tính toán thuần
  `services/caption-kieu.ts` (kiểm bằng `npm run kiem:caption`) · host
  `ac_datCaptionMogrt` / `ac_chonTrackCaption` / `ac_xoaCaptionAiO` / `ac_getRange`.
- ☠️ **SÁU LUẬT ĐÃ TRẢ GIÁ TRÊN PREMIERE** (chi tiết + số đo: `PROGRESS.md` [2.5.0]):
  (1) slider lên EG kẹp 0..100 → mọi số là % · (2) **expression chỉ chạy dạng MỘT
  BIỂU THỨC**, nhiều dòng thì im lặng giữ giá trị tĩnh — 14 template thử A→N mới ra ·
  (3) keyframe tham số MOGRT qua API không đổi hình → karaoke = **clip con theo từng
  từ** · (4) export MOGRT đòi project đã lưu + không thay đổi chưa lưu · (5) AE cần
  pref cho script ghi file, và AE ghi đè prefs lúc tắt · (6) clip MOGRT có
  `getMediaPath()` = file .mogrt → `ac_getRangeClips` phải bỏ qua, không thì panel
  từ chối chạy lại ("đổi tốc độ 2083%").
- Tô từ = Text Animator + **Range Selector** (Index, Words), Start/End mỗi cái một
  biểu thức đọc slider `Highlight Word`. Expression Selector (`textIndex`) KHÔNG chạy.
- Khối KHÔNG được đè nhau trên track; từ Latin dài hơn dòng thì **giữ nguyên từ + co
  `Text Size`** (không bẻ theo ký tự như luật CJK); kiểu hiệu ứng luôn cắt cho vừa
  2 dòng (`luonCat`) vì graphic không tự co như caption track.
- Panel **tự nhận khung** Ngang/Dọc theo w/h sequence (reload panel từng làm
  caption tràn hai mép vì khung về mặc định Ngang).
- Font: Montserrat có trên Adobe Fonts (máy khách tự sync); **Bangers thì không** →
  bộ cài phải cài `fonts/` (CHƯA làm). Máy anh Tiến đã cài 4 font per-user 22/08.

**MVP:** ✅ 5 kiểu ảnh thật đúng (từ nổi bật một từ, pop, Text Size, hộp nền, karaoke
chạy theo từ) · bộ kiểm **tất cả đạt** trên 5 bộ dữ liệu thật tới 803 câu/11.723 từ
(0 mất chữ, 0 vượt 2 dòng) · Hormozi 23 clip 2–4 s, Karaoke 83 clip 9,1 s · ô "Đoạn
đang chọn" bám I/O 630 ms · kiểu riêng quét được.
**☠️ CHƯA ĐẠT:** anh Tiến chưa dùng trên bài thật · bộ cài chưa cài font · sequence
>1920 px chữ không tự scale · Autocut chưa vá lỗi (6) (đóng băng, hỏi anh) · nút gỡ
caption chưa nối UI.

**☠️☠️ 2.5.2 (24/08) — `activeSequence` TỰ TRÔI, đọc TRƯỚC khi sửa bất cứ chỗ nào ghi lên timeline:**
Bấm chạy khi panel đang hiện sequence A → caption rơi sang sequence B của người dùng, panel báo
**thành công**. Gốc: `app.project.activeSequence` bám theo **tab Timeline có TIÊU ĐIỂM**, không
theo cái script vừa đặt — đặt xong nó giữ tới khi cửa sổ Premiere lấy lại tiêu điểm rồi **tự quay
về tab cũ, im lặng**. Đo lại được bằng bẫy: ép trỏ sang B rồi bấm ngay → vẫn ghi vào A (bản đã vá),
nhưng đọc lại `activeSequence` ra B.
→ Luật cho panel này (và mọi panel): **KHÔNG hỏi `activeSequence` để biết người dùng định làm ở
đâu.** Giữ ID của cái đang hiện trong ô chọn (`idSeqChonRef`), trước khi ghi thì **ép mở + đọc lại
kiểm**, lệch thì DỪNG. Chi tiết + bẫy tái lập: `PROGRESS.md` mục [2.5.2] và skill `adobe-cep-panel`.
→ Kèm bài học quy trình: 22/08 đã báo "dọn sạch" nhưng chỉ dọn sequence **em tạo**; sequence của
anh Tiến còn **56 clip caption** sót. **Dọn xong phải SOI CẢ PROJECT**, đừng chỉ soi phần mình tạo.

**☠️ 2.5.1 (22/08 đêm) — HAI NÚT, và ba đường "native" ĐÃ ĐO CHẾT. Đọc trước khi đụng mục 9:**
Anh Tiến chốt 22/08: *"chia thành 2 nút: Làm phụ đề / Làm hiệu ứng"*, *"editor cần sửa thì sửa
trên graphic là đủ"* (tool KHÔNG đọc lại C1), và không muốn MOGRT từ AE vì *"nặng timeline"*.
- **Người xài thấy gì (2.5.1):** nút chính **Làm phụ đề** = caption track C1 chữ mặc định (style
  = style caption gần nhất của Premiere, user đổi trong Text panel). Hàng **Hiệu ứng** bên dưới:
  ô xổ kiểu (Hormozi/Beast/Karaoke/Boxed/Clean + kiểu riêng) + nút **Làm hiệu ứng** = graphic
  MOGRT trên track video **TRÊN hình**, chạy lại thì thay; sửa chữ ngay trên graphic. Dòng sự
  thật dưới nút: *"Nặng hơn caption track, hợp short."* C1 và graphic cùng hiện → user tắt mắt C1.
- **Đã đo (Premiere 27.0, sequence tự tạo, chụp PrintWindow):** (1) KHÔNG có API "Upgrade
  caption to graphic" (0/42 DOM, 0/63 QE, `captionTracks` undefined); (2) graphic làm từ
  Premiere (`Bold Web Caption.mogrt` của Adobe, authorApp=ppro): `Source Text.setValue` trả
  **true** nhưng chữ **TRỐNG** trên hình — Adobe (B. Bullis) xác nhận API MOGRT chỉ cho AE;
  (3) `createCaptionTrack` không nhận style (tham số 4 → Illegal Parameter). ⇒ hiệu ứng **vẫn là
  MOGRT AE**; tô-từng-từ/karaoke chỉ có ở đường này. Giữ hay bỏ nút "Làm hiệu ứng" là việc của anh.
- Tra web 22/08: caption native = một style tĩnh/track; Premiere 26.3 có caption "Single word".
- Vòng soát 22/08 đã vá 6 lỗi (PROGRESS [2.5.1]): caption rơi dưới hình · chữ mẫu im lặng ·
  karaoke < 1 khung · khối 1 từ không sáng · khối > 10 s · kiểu riêng không thay.
  Chi tiết số đo: skill `adobe-cep-panel`, mục "MOGRT LAM TU PREMIERE".

---

## ☠️ ĐỪNG BỎ `-mc 0` — nó chữa việc Whisper BỊA suốt 26 phút

Whisper mang **ngữ cảnh chữ** từ đoạn 30 giây này sang đoạn sau. Trượt một lần là
nó lấy chính chữ nó vừa bịa làm ngữ cảnh → trượt tới hết file.

Đo thật 29/07, video 58 phút, cùng file cùng mô hình turbo:

| | câu | nằm trong chuỗi LẶP | chuỗi dài nhất |
|---|---|---|---|
| mặc định | 2.033 | **1.238 (60,9%) — 25:45** | **806 lần** cùng một câu |
| **`-mc 0`** | 762 | 28 (3,7%) — 62 giây | 15 lần |

806 lần *"Chú có quỷ đen không chú."* kéo suốt 14 phút cuối video.
**Bằng chứng nguyên nhân:** cắt riêng 3 phút chỗ hỏng ra chạy lại thì **nghe đúng
hoàn toàn** — âm thanh không có lỗi, lỗi ở ngữ cảnh tự tha.

Giá phải trả: ~20 câu rác kiểu *"Hãy subscribe cho kênh…"* (nó học từ phụ đề
YouTube). **Lọc mấy câu đó ở bước SINH SRT thôi.**

**Và đừng bỏ `-p 1`.** `-p 2` nhanh hơn 27% nhưng **chẻ câu thành nhiều mảnh** —
đo thật: 15 câu thành 24 câu vụn. Phụ đề vỡ vụn thì đọc không kịp.

## ☠️ ĐA NGÔN NGỮ — ĐÃ MỞ 30/07, nhưng CHƯA ĐƯỢC HỨA CHẤT LƯỢNG

Anh Tiến chốt 30/07: dùng **`-l auto`**, để Whisper tự nhận (99 thứ tiếng), không
bày thanh chọn. Whisper trả lại mã ngôn ngữ ở `result.language` nên panel biết
được **sau khi nghe** — kịp để chọn luật cắt dòng trước khi sinh `.srt`.

### Chữ vuông rộng gấp 2,16 lần — đếm ký tự KHÔNG dùng được

Đo thật 30/07 trên DOM, cùng font, lấy Latin làm mốc:

| | Rộng/ký tự | So Latin | Vừa dòng 42 đơn vị |
|---|---|---|---|
| Latin · Việt · Thái · Ả Rập | 8,6–9,9px | 0,94–1,08× | 39–44 |
| **Trung · Nhật · Hàn** | **20,0px** | **2,16×** | **19** |

→ `kyTuMoiDong` từ 2.3.0 có nghĩa là **ĐƠN VỊ ĐỘ RỘNG** (chữ vuông tính 2), không
phải số ký tự. Latin 1 ký tự = 1 đơn vị nên **mọi con số cũ không đổi**.

| | NGANG | DỌC 9:16 |
|---|---|---|
| Latin / Việt / Thái… | 42 đơn vị · 2 dòng | 20 đơn vị · 2 dòng · **6 từ** |
| **Trung / Nhật / Hàn** | **32 đơn vị** (=16 chữ vuông, chuẩn Netflix) | **16 đơn vị** (=8 chữ) |

### Ba cái bẫy của CJK

1. ☠️ **Không có khoảng trắng giữa từ.** `split(' ')` cho ra **đúng một** token =
   cả câu → hàm cắt-theo-từ không có chỗ nào để cắt → trả về nguyên câu, vượt cả
   trần lẫn số dòng. Bộ tự kiểm bắt được ngay lần chạy đầu (1 khối, vượt 2 dòng).
   → Phải **bỏ nhỏ token quá to TRƯỚC khi gom** (`catTheoKyTu`).
2. ☠️ **`tuToiDa` vô nghĩa** — đếm "từ" ra 1, ràng buộc thành vô hiệu. Nên
   `GIOI_HAN_CJK_*` **không đặt** trường này.
3. ☠️ **`PHIEN_BAN_DEM` phải là 2.** Đệm sinh trước 30/07 chép bằng `-l vi` và
   không có trường `ngonNgu` → đọc lên thì panel coi như nhóm khác CJK → video
   tiếng Nhật đã chép trước đó bị **cắt sai luật mà không báo gì**.

### ⚠️ CHƯA ĐƯỢC HỨA CHẤT LƯỢNG — chỉ được nói "chạy được"

Ba tham số này **đo riêng trên giọng Việt** và đang dùng chung cho mọi thứ tiếng:

| Tham số | Vì sao không dùng chung được |
|---|---|
| `-mc 0` | Chữa Whisper bịa; với tiếng Anh có thể không cần |
| Biên dB | Tiếng Anh nói nhanh, nối âm, khoảng lặng giữa từ ngắn hơn |
| Từ đệm | "ờ, ừm" khác "uh, um, like" |

**Mỗi ngôn ngữ cần MỘT FILE THẬT để đo lại.**

**Tiếng Anh: ĐÃ CÓ FILE THẬT VÀ ĐÃ ĐO — 30/07/2026.** Ba video ở `E:\2026\Test`
(26:17 · 39:01 · 54:59 = 2 giờ 20), chạy đúng pipeline panel với mô hình turbo:

| | Video 1 | Video 2 | Video 3 |
|---|---|---|---|
| `-l auto` nhận ra | en | en | en |
| Câu | 356 | 455 | 803 |
| Phủ sóng | 99,9% | 100,0% | 99,8% |
| **Lặp bịa** | **0%** | **0%** | **0%** |
| Chỗ nghe không chắc | 5,0% | 7,4% | 8,1% |
| Nghe hiểu mất | 39,2s | 52,6s | 77,2s |

→ **`-mc 0` không gây hại cho tiếng Anh** (0% lặp cả ba). Tốc độ ~**40× thời
gian thực** — nhanh hơn con số cũ đo trên tiếng Việt (60 phút/143s).

☠️ **Vẫn CHƯA được nói "chép chính xác bao nhiêu".** Cả sáu chỉ số trên đều là
thứ *sản phẩm tự khai* (nó không lặp, nó phủ hết thời lượng) — chưa có bản chuẩn
do tai người duyệt thì chưa có WER. Được nói: *"chạy được trên tiếng Anh, không
bịa lặp"*. Biên dB và từ đệm (việc của Autocut) vẫn chưa đo cho tiếng Anh.

**Chưa làm, cố ý:** dịch phụ đề. Whisper có cờ `-tr` nhưng **chỉ dịch sang tiếng
Anh**, không dịch sang tiếng khác. Muốn dịch đa chiều thì cần bộ dịch ngoài —
thêm một chỗ có thể bịa nội dung.

Bộ tự kiểm: `node tests/kiem-ngonngu.mjs` (**39 phép đo**).

---

## MVP — bảng chốt, đo bằng số

| Tính năng | MVP = xong khi | Đo bằng | Nay |
|---|---|---|---|
| **Auto Transcript** | Ra `.srt` gắn được lên timeline, **chữ đọc được** (không lặp bịa), mốc khớp lời | mở file **đọc bằng MẮT**; tỉ lệ câu trong chuỗi lặp < 5% | ✅ **16 câu · 2.497 byte** · đọc mạch lạc (`-mc 0` kéo lặp 60,9% → 3,7%) |
| **Mốc đúng trên sequence NHIỀU CLIP** | Phụ đề rải khắp vùng I–O, mỗi câu đứng đúng chỗ người ta nói | chạy trên sequence 17 clip | ✅ **1 câu → 16 câu**; câu 2 ở 3,42s, câu cuối 68,44s, hết ở 71,68s (vùng hết 72,08s) |
| **Mốc đúng khi clip không bắt đầu ở 0** | Phụ đề nằm trùng vị trí clip trên timeline | clip ở 38,53s | ✅ phụ đề **38,53s → 119,85s**, 7 marker đều trong clip |
| **Phụ đề ĐỌC ĐƯỢC, đúng chuẩn nghề** | ≤42 ký tự/dòng · tối đa 2 dòng · không mất chữ | đo trên 765 câu thật | ✅ dòng dài nhất **193 → 42** · vượt chuẩn **78,5% → 0,0%** · chữ **53.616 = 53.616** |
| **Chạy được ở QUY MÔ THẬT** | Video 1 giờ ra phụ đề, không sập, không mất chữ | ghép clip 90s ×40 = 60 phút | ✅ **765 câu**, lần đầu 143s, các lần sau ~14–18s |
| **Chạy lại nhiều lần vẫn y nhau** | Bấm 10 lần ra 10 kết quả giống hệt | SHA-256 phần chữ | ✅ **10/10 giống hệt từng byte**, RAM 10 MB → 10 MB |
| Bộ đệm | Chạy Autocut rồi bấm Transcript thì khỏi nghe lại | thời gian chạy lần hai | ✅ **0,4–2,4 giây** thay vì ~20 giây; trên video 60 phút: **143s → 14s** |
| Bảng sửa từ | Dạy một lần, lần sau tự đúng | — | ✅ mặc định **RỖNG**, người dùng tự thêm |
| Sạch GPL để bán | FFmpeg không `--enable-gpl` | đọc chuỗi configuration | ✅ LGPL từ 29/07 |

| **Có cây thước đo độ chính xác** | Đo được "chép đúng bao nhiêu %", so với bản tai người duyệt | bộ tự kiểm của chính cây thước | ⚠️ **thước xong (52/52), CHƯA có bản chuẩn** — xem mục CHƯA ĐẠT |
| **UI nói được panel làm gì** | Người mới mở panel hiểu ngay nó làm gì cho mình | animation diễn giải, đo trên DOM | ✅ 3 pha · 2.500ms · tách bạch · chạy 1 lần · tương phản 5,16–15,61 đều đạt AA |

**☠️ CHƯA ĐẠT:**

| | MVP = xong khi | Vì sao chưa đạt |
|---|---|---|
| **☠️ BIẾT ĐƯỢC NÓ CHÉP ĐÚNG BAO NHIÊU** | Có con số WER trên bản chuẩn do **tai anh Tiến** duyệt | Cây thước đã có (`tests/wer.mjs`, 52/52). Thiếu **bản chuẩn** — thứ duy nhất không tự sinh được. Bản nháp đã soạn sẵn ở `tests/du-lieu/chuan/`, chờ soát. ☠️ **Chừng nào chưa có, mọi con số chỉ được nói ở mức "hai mô hình bất đồng bao nhiêu", KHÔNG được nói "chính xác bao nhiêu".** |
| **Tên riêng tiếng Anh** | Chép đúng tên công ty / thuật ngữ ngành | Cả hai mô hình đều sai (xem mục 7). `--prompt` đo hai lần đều vô tác dụng. Chỗ chữa nằm ở bảng sửa từ hoặc mô hình luyện riêng tiếng Việt (PhoWhisper — **chưa đo**). |
| **Vật liệu thử thật** | Có ≥5 phút tiếng nói thật, không lặp, đủ khó | ✅ **TIẾNG ANH ĐÃ ĐỦ 30/07** — 3 video ở `E:\2026\Test` (2 giờ 20, nội dung khác nhau, đã đo: 0% lặp bịa cả ba). ⚠️ **TIẾNG VIỆT vẫn chỉ ~2,6 phút** (`Video tin 5` 90s + `Hiring…` 64,7s) — video 58 phút gốc **không còn trên ổ E**, mà mọi con số lịch sử (2.033 câu, 806 lần lặp) đo trên nó. `STRESS-1tieng.mp4` là clip 90s **lặp 40 lần**, không làm bản chuẩn được. |
| **Tốc độ đọc kịp** | ≤20 ký tự/giây | Nay trung bình 18,8 nhưng **25,5% vẫn quá 20**. ☠️ **Cắt khối KHÔNG chữa được cái này** — đó là tốc độ *người ta nói*, chia 3 khối thì mỗi khối cũng chỉ hiện 1/3 thời gian. Muốn chữa thật phải **bớt chữ** (tóm tắt), là tính năng khác. |
| Chạy nhiều lần **chồng caption track** | Chạy lại thì thay, hoặc hỏi trước | Chạy 13 lần = **13 caption track chồng nhau + 13 item trong project + 13 file `.srt` giống hệt**, không cảnh báo gì. Việc không ghi đè file cũ là **cố ý** (ghi đè thì caption đã nằm trên timeline không đổi theo), nhưng chưa ai nghĩ tới chuyện chạy nhiều lần. |
| Vùng trộn **nhiều file gốc** | Chép đủ mọi file trong vùng | Nay chỉ chép file chiếm nhiều thời lượng nhất, **có báo rõ** phần bỏ qua (trước đây im lặng lấy `clips[0]`). |
| Đa ngôn ngữ | Chạy được tiếng Anh | ✅ **tiếng Anh XONG 30/07** — `-l auto` nhận đúng `en` cả 3 video, 0% lặp bịa, phủ 99,8–100%. Còn lại: các thứ tiếng khác vẫn chưa có file thật; biên dB và từ đệm (của Autocut) chưa đo cho tiếng Anh. |
| Chữ ký thương mại · khoá bản quyền · macOS · bộ cài ghép 4 panel | | Xem `../PIPELINE.md` |

**Ngoài MVP — cố ý CHƯA làm:** karaoke (tô từng chữ theo lời), dịch sang ngôn ngữ
khác, xuất định dạng khác `.srt`, tóm tắt bớt chữ cho đọc kịp.

*(Trước 29/07 mục này ghi "phụ đề nhiều dòng" là chưa làm — **nay đã làm**, xem
dòng "Phụ đề ĐỌC ĐƯỢC" ở bảng trên.)*

---

## Tự kiểm chứng — bộ tự kiểm chạy được KHÔNG CẦN Premiere

```
cd client && npm run kiem      # phan tinh toan: srt / plan / amluong / silencelog
node tests/kiem-wer.mjs        # CAY THUOC do do chinh xac (52 phep do)
node tests/soan-ban-chuan.mjs tin5     # soan ban nhap de soat bang tai
```

Nó biên dịch `srt.ts` / `plan.ts` / `amluong.ts` / `silencelog.ts` rồi chạy
`tests/kiem-tinh-toan.mjs` — **toàn bộ dựng trên số liệu THẬT** đo từ máy anh Tiến
(log FFmpeg thật, 2.033 câu thật của video 58 phút, 17 clip thật của sequence
Autocut). Mục **9b** là phần quy đổi mốc phụ đề.

Build sạch **không tính** là đã kiểm. Sau `npm run kiem` còn phải mở panel thật,
đo qua **cổng debug 8091**, và **mở file `.srt` ra đọc bằng mắt** —
☠️ bài học 29/07: con số tổng (2.033 câu) trông rất khoẻ mạnh, **mở ra đọc mới
thấy 60,9% là rác**.

## Quy ước

- Cổng debug **8091** — bốn panel không được trùng cổng
- Build: `cd client && npm run build` rồi `scripts\sign-install.ps1`
- Phát hành: `scripts\package-release.ps1` (tự đóng gói file giấy phép LGPL)
- Sửa `CSXS/manifest.xml` → **tắt hẳn Premiere rồi mở lại**
- Ghi `PROGRESS.md` sau mỗi lần sửa: không dấu, không emoji, giờ lấy bằng lệnh

## Ba cái bẫy đã trả giá — đọc trước khi sửa host

1. **Premiere nạp `host/index.jsx` đúng một lần lúc khởi động** → panel tự gọi
   `napLaiHost()` (`$.evalFile`) trước mỗi lệnh.
2. **Không được bọc `$.evalFile` trong hàm.**
3. **Đường dẫn `.srt` PHẢI dùng dấu `/`** — `\2` trong chuỗi ExtendScript là
   escape bát phân, gửi `E:\2025\T11\...` thì Premiere nhận `E:5T11Video...`.
   Và **file `.srt` phải nằm NGOÀI `%APPDATA%`** — Premiere Beta chạy với AppData
   bị ảo hoá, `new File(...).exists` trả false dù file có thật.
