# AiO Auto Short Viral — đọc cái này trước

> Panel mới của bộ AiO Studio. Anh Tiến đặt tên và giao **18/09/2026**.
> **TRẠNG THÁI (21/09/2026 09:09): bản 0.1.0 ĐÃ CHẠY THẬT trong Premiere** (bản cài
> build 19/09: bộ phỏng vấn 40 phút → 61 khối / 579 câu, bấm khối nhảy đúng mốc,
> tạo sequence + marker đều đạt, in/out clip gốc không bị đụng — số do người chạy
> Premiere hôm nay báo, không phải em đo). Tab "Toàn bộ lời" sâu hơn + bản sửa lỗi
> soát 21/09 thì **CHƯA cài** (xem `PROGRESS.md` mục trên cùng).
> ☠️ Bản `dist` build 08:23 ngày 21/09 **mở ra TRẮNG TRƠN** vì một byte NUL trong
> mã nguồn — đã sửa 09:0x và lắp chốt chặn (sổ lỗi #9). Đừng cài bản dist cũ hơn.
> Chi tiết + nợ: `PROGRESS.md`.
> *(Dòng cũ "mới chuẩn hoá folder — chưa có dòng code nào" đúng tới 18/09; dòng
> "CHƯA cài, CHƯA chạy trong Premiere lần nào" đúng tới 19/09 — cả hai đã hết đúng.)*
> Extension ID `com.aiostudio.shortviral` · cổng debug **8100**.

---

## Anh giao gì (18/09/2026)

Bốn ý, gần nguyên văn:
1. Chọn clip, bấm chạy → **ngay trong panel biết đoạn nào đang nói gì**.
2. **Kiểm soát được nội dung** trong video.
3. **Tự đề xuất** các đoạn cùng ý nghĩa hoặc theo câu hỏi: host hỏi — khách trả
   lời thì tool tự nhận ra câu hỏi đó và **tự chia từng đoạn** bên trong một
   sequence hoặc tạo sequence mới.
4. Thao tác **cực kỳ mượt** ngay bên trong panel.

*Ví dụ đời thường:* Auto Cut là máy cắt cỏ — bấm một nút, bỏ hết chỗ không nói.
Panel này là **bàn dựng trên giấy** (paper edit): nhìn cả bài dưới dạng chữ,
thấy từng câu hỏi là một khối, kéo gộp/tách/bỏ rồi mới đưa lên timeline.

---

## Quyết định anh đã chốt — kèm lý do

| Ngày | Quyết định | Vì sao |
|---|---|---|
| 18/09 | **Panel riêng, KHÔNG gộp vào Auto Cut** | Em đề xuất, anh đồng ý và đặt tên: Auto Cut đã xong + đóng băng 19/08 (qua tai anh); việc khác bản chất (1 nút ↔ thao tác liên tục); dock 360px không đủ chỗ; nghiên cứu 10/09 đề xuất đưa Auto Cut vào gói Free |
| 18/09 | **Giữ `AiO Auto Cut Short` là sản phẩm RIÊNG**, không gộp vào đây | Anh chọn "Giữ riêng 2 sản phẩm". Cut Short giữ cổng 8093 |
| 18/09 | **Không liên quan tới Re-Frames** | Anh: *"Re-frames đâu có liên quan gì tới short viral đâu em?"* |
| 18/09 | Web bán hàng **chưa** thêm tên này | Anh chọn "để khi có bản chạy" |

☠️ **Ranh giới với Auto Cut Short CHƯA vạch.** Cut Short đã chốt 30/07 "chia đoạn
theo HỎI–ĐÁP, mỗi đoạn một sequence mới" — trùng ý (3) ở trên. Phải hỏi anh hai
tool khác nhau ở đâu **trước khi** viết não chia đoạn, đừng tự vạch.

---

## Việc CHỜ trước khi viết code

1. **Ranh giới với Auto Cut Short** (xem trên).
2. **"Các đoạn cùng ý nghĩa"** cần mô hình hiểu nghĩa: chạy trên máy (offline,
   không hạn mức, kém hơn, ăn tài nguyên máy đang mở Premiere) hay gọi AI qua
   mạng (hiểu tốt hơn, tốn tiền theo giờ video → phải có hạn mức, gửi nội dung
   khách lên mạng). Anh quyết. Đề xuất: bản đầu CHƯA làm phần này.
3. **File đo thật**: podcast tiếng Việt host–khách. Đề xuất liệu Podcast 40 phút
   2 người anh đã test 25/08 — cần anh xác nhận còn trên ổ và cho dùng.
4. **Luật chọn công nghệ 31/08** (`/xong` mục 2d): khảo sát app cùng loại đang
   dùng lõi gì, trình anh trước khi chốt stack.
5. **UI do anh tự thiết kế** bằng Claude Design (luật 03/08) → file đặt ở
   `AiO Design System/AiO Auto Short Viral/`, Claude chỉ ghép.

---

## Builder — thứ đã có, dùng lại được (kỹ thuật, không phải nối panel)

- **Đệm nghe dùng chung** `<tên>.autocut-nghe.json` cạnh video (Autocut/Transcripts
  ghi). Có sẵn thì đọc lại nội dung **0,4–2,4 giây** (đo ở Transcripts), khỏi nghe lại.
- **Quy đổi mốc file gốc → sequence đã cắt**: Transcripts đã giải (`dungBangTuClip`,
  đo trên sequence 17 clip, 2 lỗi đã vá — đọc `AiO Transcripts/CLAUDE.md` mục 2).
- **Mã tham khảo chia hỏi–đáp**: `chiaDoan()` trong `AiO Auto Re-Frames/dist/index.html`
  (anh chốt 18/09 hai sản phẩm KHÔNG liên quan — chỉ đọc để học, không nối panel).
- **Cắt vùng thành sequence mới**: `setInPoint/OutPoint` + `createNewSequenceFromClips`
  (chạy được 31/07, xem `AiO Auto Cut Short/PROGRESS.md` [0.0.2]). Bản của panel này:
  `sv__dung` trong `host/shortviral.jsx` — cất in/out gốc TRƯỚC, trả lại sau (bài 3a-bis).

### Số đo đã có về dấu `?` (18/09, đọc thẳng 4 bản chép lời trên ổ)

Cột cuối = số dấu `?` mà **sau nó trong câu Whisper còn chữ**, trên mẫu số = tổng
dấu `?` của file — đúng thứ não chia khối dùng (`hoidap.ts` dòng 10).

| Video | Câu | Dấu `?` | Còn chữ sau `?` trong câu Whisper |
|---|---|---|---|
| Heygen (tiếng Việt, 1,4 phút) | 16 | 2 | 0/2 |
| Conspiracy (26 phút) | 363 | 3 | 0/3 |
| Gnostic (39 phút) | 455 | 21 | **10/21 (48%)** |
| Machine (55 phút) | 803 | 28 | **6/28 (21%)** |

*(Sửa 19/09 sau soát, đếm lại bằng node: bản trước ghi 12 và 7, kết luận "tới 57%" —
số đó đếm cả dấu `?` đứng cuối câu mà sau nó chỉ còn dấu nháy (`?"`). Hai con số
đúng theo hai mẫu số khác nhau, bảng cũ không ghi mẫu số nào — brain bài 5k-bis.)*

→ Whisper **có** chấm `?`, kể cả tiếng Việt. Nhưng tới 48% (Gnostic) nằm giữa câu
→ **tách ở mức TỪ**, không ở mức câu. `?` chỉ biết là câu hỏi, **không biết ai hỏi**
(Gnostic toàn câu hỏi tu từ của người thuyết minh). Cả 4 file là phim thuyết minh —
**chưa đo trên phỏng vấn host–khách**.

⚠️ **Tên có chữ "Viral"** là tên sản phẩm anh chọn. Chưa có phép đo nào cho chữ
"viral" — trang bán / mô tả đừng hứa "AI chọn đoạn viral" khi chưa có bằng chứng.

---

## Sổ lỗi tái diễn (mẫu theo luật 31/08) — bẫy đã trả giá ở dự án anh em

| # | Lỗi | Gốc đã đo | Chốt chặn |
|---|---|---|---|
| 1 | Xuất bản nháp 480p làm **SẬP Premiere** | `exportAsMediaDirect` (31/07) và `app.encoder.encodeSequence` (01/08) sập Beta 26.5 — skill `adobe-cep-panel` 6e-bis | CẤM cả họ API xuất. Bản nháp = FFmpeg cắt thẳng từ file gốc |
| 2 | Chứng chỉ `.p12` lên repo PUBLIC | `.gitignore` gốc KHÔNG chặn `certs/`; 3 panel thiếu `.gitignore` riêng đã lộ | `.gitignore` riêng đã tạo **18/09, trước mọi lần build** (6 dòng, giống Video Download) |
| 3 | Chép khuôn panel cũ, sót ID/cổng → **cài đè panel khuôn** | `sign-install.ps1` chép thẳng vào `CEP\extensions\<extId>` (sự cố 29/07) | Trước lần cài đầu: `git grep` tên/ID/cổng panel khuôn trong thư mục này = **0 dòng** |
| 4 | Caption/sequence rơi sang sequence khác của người dùng | `activeSequence` bám tab có tiêu điểm (24/08, Transcripts) | Giữ ID sequence đang chọn, ép mở + đọc lại trước khi ghi |
| 5 | Tạo sequence từ khối có B-roll / multicam → B-roll **nối đuôi** sau lời nói, hoặc nội dung ra hai lần — mà host vẫn báo ĐẠT | Bắt lúc ghép 19/09 (chưa từng cài): host `sv__dung` đặt các đoạn **nối tiếp trên MỘT track**, không xếp lớp; App từng đưa nó `doanNguon` (mọi làn). Đo: khối 16,47 s có B-roll → 2 đoạn / 26,47 s. Phép kiểm độ dài host vẫn qua vì `mongMuon` cộng cả hai | App chỉ đưa host `doanDung()` (moc.ts — đúng làn đã NGHE). `npm run kiem` mục (3) có phép đối chứng: sửa `doanDung` về cách cũ → 4 HỎNG. Muốn mang B-roll sang thì phải dạy HOST xếp lớp trước, đừng nới `doanDung` |
| 6 | Panel nghe tiếng của FILE gắn với clip hình, không nghe thứ người xem nghe → B-roll cắt chèn trên V1 làm **mất lời phỏng vấn** chạy liền ở A1, short dựng ra có tiếng B-roll giữa câu trả lời; L-cut mất phần tiếng dài hơn hình | Soát 19/09: host đời đầu có clip hình là **bỏ hẳn track tiếng**. Đo trên đệm thật C4091 (240 s, B-roll 12 s): người xem nghe 726 từ, panel đọc 683 | Host gửi CẢ hình lẫn tiếng; `chonClipNghe` chọn làn theo HÌNH (luật cũ — nhạc / mic rời chỉ-tiếng không được thắng) rồi nghe bằng TIẾNG liên kết. `npm run kiem` mục (3b): 726/726, có đối chứng "chỉ hình" + phá thử (bỏ nghe-bằng-tiếng → 9 HỎNG) |
| 7 | Chọn làn bằng TỔNG THỜI LƯỢNG → logo PNG / ảnh nền dài hơn người nói 1 khung là panel nghe file ẢNH | Soát 19/09, chạy trên moc.js thật | Ảnh tĩnh (đuôi file) không bao giờ là làn nghe; mục (3b) có đối chứng cùng hình học đổi đuôi `.mp4` |
| 8 | Xoá marker theo MẪU TÊN 'SV ' → xoá cả marker người dùng đặt tên "SV …" | Soát 19/09 (brain 5am-ter) | Marker của panel = tiền tố 'SV ' **VÀ** chữ ký `[AiO SV]` dòng cuối ghi chú. Nút "Đặt marker" cũng xoá marker cũ → đếm lại + hỏi bằng số trước |
| 9 | ☠️ **Một byte ĐIỀU KHIỂN nằm trần trong mã nguồn ⇒ bản đã đóng gói mở ra TRẮNG TRƠN**, mà `tsc` sạch · `vite build` sạch · `npm run kiem` xanh hết | Đo 21/09: `xuat.ts` dòng 199 có 1 byte NUL + 1 byte 0x1F thật (viết `\x00-\x1f` trong regex, vỏ lệnh gộp mất một tầng thoát — brain 5ax). Vite gói cả mã vào MỘT khối `<script>` nội tuyến; bộ đọc HTML đổi U+0000 thành U+FFFD ở "script data" nên lớp ký tự thành khoảng NGƯỢC → Chrome trên `dist` đã build: *"Invalid regular expression … Range out of order in character class"*, `<div id="root">` **RỖNG**. `vite dev` không lộ (file phục vụ dạng `.js`, không qua bộ đọc HTML). Kèm: NUL trong 8.000 byte đầu làm **git coi file là NHỊ PHÂN** (`git diff` in "Binary files differ", `git blame` mất từng dòng) và **ripgrep BỎ QUA file** → hai phép kiểm bắt buộc của dự án (`git grep` ID/cổng panel khuôn, grep mã màu cứng) cho ÂM TÍNH GIẢ | `npm run build` chạy `node ../tests/kiem-byte.mjs` — mã nguồn: cấm mọi byte < 0x20 ngoài TAB/CR/LF; `dist/index.html`: cấm **NUL** (chỉ NUL mới chết — bản đang chạy thật 19/09 có 2 byte 0x1E/0x1F của chính React, bắt cả hai loại là báo đỏ một bản chạy tốt). `npm run kiem` mục (7i) có **đối chứng hai chiều**. Cần dải ký tự điều khiển thì viết 4 ký tự ASCII `\x00` hoặc `String.fromCharCode(...)` như `ui/chung.tsx:102`, và **ghi file bằng Write/Edit, không heredoc** |
| 10 | Phím tắt một chữ của panel **trùng phím mặc định Premiere** → có thể sửa timeline của người dùng | CHƯA ĐO (21/09 không được mở/chạy Premiere). `preventDefault()` chỉ chặn trình duyệt nhúng, không chứng minh host không nhận cùng cú phím; grep skill `adobe-cep-panel` ra **0 dòng** về phím bị host ăn | Đã **bỏ `E`** (Extend Selected Edit to Playhead — phá timeline) khỏi đường bung câu, giữ `←`/`→` (xấu nhất là đầu đọc nhích 1 khung). Lần cài đầu phải đo: bấm `→` 10 lần, ghi 3 số TRƯỚC/SAU — vị trí đầu đọc, số clip trên track, mốc đầu/cuối clip đang chọn. Cả ba không đổi thì phím sạch; đổi thì bỏ luôn `←`/`→`. Tab khối đang dùng J/K/M/X/Enter — cũng **chưa đo** |
| 11 | Một nhãn **đổi bề rộng lúc đang chạy** làm CẮT ĐUÔI con số bên cạnh nó — mất đúng thứ vừa làm ra để hiện | Đo 21/09 (36 cảnh, DOM thật + CSS của `dist` đã build, khổ 300 px): nút Dừng đổi chữ `Dừng`→`Đang dừng…` phình **48,9 → 92 px**, chỗ cho dòng đếm tụt còn 97–127 px trong khi `Đang đưa khối 12/12…` cần **145,1 px** → cắt 18–48 px. Thanh đó có **BA biến** cùng ăn bề rộng: nhãn nút · đồng hồ (`dongHo` là m:ss, phút KHÔNG chặn trên → "100:05") · `--rong-thanh-cuon` (11–15 px khi danh sách dài) | Nhãn nút trong thanh tiến độ **giữ nguyên chữ**, trạng thái nói bằng `disabled` + opacity. Thêm gì vào `.chay__thanh` thì phải đo lại với đủ BA biến trên, ở **cả hai** bản VI/EN. ☠️ **Thước phải là bề rộng DÀN TRANG** (span thử cùng font trong DOM thật, đối chứng bằng `scrollWidth` ở ca tràn) — canvas `measureText` báo **thiếu ~7 px (~5%)** và chính nó làm vòng soát trước tưởng còn thừa 20 px |

---

## Folder — chuẩn hoá 18/09 (luật `AiO Studio/CLAUDE.md` mục 4h)

| Ngăn | Đường dẫn | Hiện có |
|---|---|---|
| Mã nguồn | `Build and UI Design/AiO Auto Short Viral/` | `.gitignore` · `CLAUDE.md` · `PROGRESS.md` · từ 19/09 thêm `CSXS/` `client/` `host/` `scripts/` `tests/` `.debug` + giấy phép FFmpeg |
| Thiết kế (của anh) | `Build and UI Design/AiO Design System/AiO Auto Short Viral/` | `README.md` giữ chỗ |
| Bộ cài | `Release/AiO Auto Short Viral/win/` + `mac/` | `CHUA-CO-BAN-WIN.txt` · `CHUA-CO-BAN-MAC.txt` |

**18/09 cố ý CHƯA tạo** `CSXS/` · `client/` · `host/` · `scripts/` · `.debug` — **đã tạo
cùng file thật 19/09** (khuôn: `AiO Video Download` + FFmpeg/whisper từ Transcripts). Để
README giữ chỗ trong `CSXS/`/`host/` là nó đi thẳng vào bộ cài khách (script chép
nguyên hai thư mục đó). **Không bao giờ tạo tay:** `dist/` · `build/` · `bin/` ·
`node_modules/` · `certs/` — do build/cài sinh ra.

## Quy ước

- Cổng **8100**. 8093 là của Auto Cut Short; 8099 đang bị `xem-rieng.mjs` của
  Re-Frames dùng. Bảng cổng đầy đủ: `AiO Studio/CLAUDE.md` mục 2.
- `cd client && npm run build` = `tsc -b` + `vite build` + **chốt chặn byte điều khiển**
  (`node ../tests/kiem-byte.mjs`, sổ lỗi #9). Build đỏ ở bước đó thì ĐỪNG cài.
- `cd client && npm run kiem` = phần thuần (moc · hoidap · xuat), 201 phép ở 21/09,
  mục (7i) là chốt chặn byte kèm đối chứng hai chiều.
- Ghi `PROGRESS.md` sau mỗi lần sửa: không dấu, không emoji, giờ lấy bằng lệnh.
