# AiO Auto Podcast — đọc cái này trước

> Dự án thứ 7 của bộ AiO Studio. Anh Tiến giao 2026-08-01:
> *"tiếp theo là podcast tool nha em"* — và cùng ngày: *"rồi vào việc đi em"*.
>
> **TRẠNG THÁI 05/08/2026 17:06: panel v0.6.2 · host v0.4.6 — ĐÃ CÀI (bằng tay).**
>
> ✅ **BỐN ĐƯỜNG TIẾNG, chọn bằng ô trong "Cài đặt cắt"** — cả bốn đã chạy thật
> trên liệu 58 phút và đều **299/299 đúng**:
>
> | Giá trị | Nghĩa | Người không nói |
> |---|---|---|
> | `duck` (mặc định) | 2 clip mic liền mạch + keyframe âm lượng | chìm −15 dB, mượt 150 ms |
> | `cat-tat` | cắt rời từng đoạn cho CẢ HAI mic, tắt clip người kia | im hẳn (Shift+E bật lại) |
> | `cat-chim` | cắt rời như trên, hạ Level thay vì tắt | chìm −15 dB |
> | `giu` | 2 clip liền mạch, không đụng âm lượng | để nguyên |
>
> Ô mức chìm −8/−15/−24 dB (mặc định −15), tự ẩn với `cat-tat` và `giu`.
> ☠️ `cat-*` đặt clip cho **CẢ HAI người ở MỌI đoạn** — đó là chỗ khác khuôn
> `theo` cũ: có clip thì bật lại được, không phải đi tìm lại file.
>
> ☠️☠️ **`overwriteClip` ĐẶT CLIP THEO LƯỚI KHUNG HÌNH.** Panel gửi `2.3000`,
> clip thật nằm ở `2.2940` — lệch 6 ms. Nên khớp clip theo mốc thời gian phải
> **khớp GẦN NHẤT** (`PC_GAN = 0,06s ≈ 2 khung), không khớp bằng chính xác:
> bản đầu dùng `toFixed(2)` trượt 14/20 lệnh. Đừng nới rộng thêm — 500 ms phải
> vẫn trượt, và hai clip cách nhau 50 ms phải chọn đúng cái gần nhất.
>
> ☠️ **Premiere lưu `Level` dạng float 32-bit** — đọc về lệch ~1,4e-9 so với
> thứ ghi vào. Mọi phép kiểm âm lượng phải **so bằng dB** (dung sai 0,05 dB),
> đừng so số thực: dung sai `1e-9` báo trượt oan cả 299 đoạn.
>
> ✅ **ĐƯỜNG ÂM LƯỢNG (ducking)** — ai nói thì mic người kia chìm **−15 dB**,
> chuyển mượt 150 ms. Giữ 2 clip mic liền mạch + keyframe `Volume > Level` nên
> editor kéo lại được; KHÔNG cắt tiếng, KHÔNG bake. Đo: 597 keyframe/mic,
> **299/299 đoạn đúng**, quét 3.628 điểm → 0 lần cả hai cùng to, 0 lần cả hai
> cùng chìm. Hàm host: `pc_docAmLuong` · `pc_veAmLuong` · `pc_xoaAmLuong` ·
> `pc_nhanBanGiuClip`.
>
> ☠️☠️ **`Level = 0,177828` LÀ MẶC ĐỊNH CỦA PREMIERE = 0 dB.** Công thức quen
> thuộc `dB = 20*log10(value)` đọc ra −15 dB — **SAI**, và nghe rất hợp lý nên
> suýt tin. Bằng chứng: mọi clip audio ở mọi sequence (kể cả clip panel vừa đặt
> tự động) đều đúng con số đó. Thang thật: `value = 10^((dB−15)/20)`, value 1.0
> = +15 dB. → Vì vậy `pc_veAmLuong` **nhận HỆ SỐ NHÂN, không nhận dB**: đúng dù
> offset thang là bao nhiêu, và không ghi đè chỉnh tay của người dùng.
>
> ☠️☠️ **MỐC KEYFRAME TÍNH THEO THỜI GIAN TRONG FILE, KHÔNG PHẢI SEQUENCE.**
> Mọi mốc = `thờiGianSequence + clip.inPoint`. Sai là lệch cả 299 mốc 7 giây.
> Đo bằng hai đường: keyframe đặt tại t=3534 được nhận nguyên vẹn dù vượt độ dài
> clip trên timeline (3528,4) nhưng nằm trong media (3535,4); và thước NGOÀI —
> đặt hố −40 dB trên **bản sao** rồi hỏi anh Tiến hố nằm ở đâu, anh trả lời
> "khoảng 4:53" (= 300 − 7,007) → xác nhận.
>
> ☠️ Thử thứ nguy hiểm thì dùng `pc_nhanBanGiuClip` tạo **bản sao đầy đủ clip**
> rồi thử trên đó — đừng thử trên bản dựng của anh Tiến (luật 3b).
>
> ✅ **ĐÃ RA BẢN DỰNG THẬT ĐẦU TIÊN** trên liệu 58 phút của anh Tiến —
> sequence `Will - Podcast Cut (2)`: **299/299 nhát cắt**, V1 100% cam Will ·
> V2 100% cam Trọng, A1/A2 đúng mic mono từng người liền mạch 0→3528,4s,
> **0 clip lạ · 0 lỗ đen**, nhát ngắn nhất 1,04s, chia 54,4/45,6.
>
> ☠️☠️ **`pc__item` CHỈ ĐƯỢC KHỚP CHẮC CHẮN — ĐỪNG BAO GIỜ THÊM LẠI LUẬT
> "CHUỖI CON".** Ngày 05/08 luật đó (điểm 1) giết 135/299 nhát cắt trên
> project thật: anh Tiến đặt tên sequence **trùng tên THƯ MỤC quay**, mà tên
> thư mục nằm trong đường dẫn của *mọi* file trong buổi quay → file mic mono
> chưa nhập "khớp" vào cái sequence đó → `pc_nhapMono` tưởng đã có sẵn, nhập
> 0 file → `pc_datTieng` đặt cả một sequence 31 phút lên A1/A2, và vì nó là
> clip có cả hình, Premiere thả hình xuống V1/V2 đè chết nửa đầu tập.
> Ba luật cứng, đã cắm vào `tests/kiem-host.mjs` (31/31): (1) chỉ nhận điểm 4
> (đường dẫn trùng) và 3 (tên file trùng); (2) **item không có media path
> (sequence/bin) không bao giờ là ứng viên**; (3) **KHÔNG cache tra cứu** —
> anh Tiến 05/08: *"remove cache"* — bắt nhầm một lần là nhầm suốt phiên.
>
> ☠️ **ĐẾM KHÔNG PHẢI LÀ KIỂM** — cùng ca đó `pc_doKetQua` báo "tiếng 2/2 đạt"
> trong khi CẢ HAI clip tiếng là đồ đặt nhầm. Nay trả thêm `hinhLa`/`tiengLa`
> (clip không phải file media) và panel chặn khi > 0.
>
> ☠️ **Bấm sang tab sequence khác KHÔNG còn giết bản dựng.** Chốt `SEQ_DOI` cũ
> bỏ lại một sequence dựng dở 260 clip. Nay `pc__seqDangDung` ghim lại active
> về đúng bản dựng theo TÊN; chỉ dừng tay khi bản dựng thật sự biến mất.
>
> ☠️ **CÀI BẰNG TAY, chưa qua `sign-install.ps1`** — vì `kiem-nao` và `stress`
> đang TRƯỢT 2 phép: phiên trước đổi bản chất não sang đường "nghe trọn từng
> kênh" (`dist/nao.js` 14:50) mà chưa sửa 2 phép kiểm viết cho thuật toán CŨ.
> **Giữ não bản mới là CÓ Ý**: trên liệu này bản cũ chỉ ra **1 nhát cắt**
> (100% một cam), bản mới ra 299 nhát cân đối. Việc kế tiếp: sửa 2 phép kiểm
> đó rồi cài lại chuẩn.
>
> **v0.6.0 — NÚT "Auto Match"** (anh Tiến 05/08: *"anh sẽ kéo toàn bộ
> source clip vào sequence bấm một nút auto match"*). Não: `dist/khop.js`
> (thuần) + `tests/kiem-khop.mjs` 28/28. Một cú bấm điền cả bản đồ.
> ☠️ **ĐỪNG THỬ GHÉP CAM↔MIC BẰNG TIẾNG CAM** — đã đo trên 4 cam thật của
> anh, **trượt 3/4 ca**: mọi cam thu chung một phòng nên cặp nào cũng tương
> quan r 0,53–0,74, biên độ nhất/nhì chỉ 0,017–0,056 (nhiễu); cặp "thắng"
> là mic của người NÓI NHIỀU NHẤT, không phải người ngồi trước cam. Số đo
> đầy đủ ở đầu `dist/khop.js` và `PROGRESS.md` mục [tu-khop].
>
> **Ba nhãn nút anh Tiến tự chốt 05/08 — giữ nguyên ở CẢ HAI ngôn ngữ:**
> `Auto Match` (tự khớp bản đồ) · `Auto Sync` (thêm mic từ file, ẩn khi
> không cần) · `Auto Podcast` (nút chính, cắt timeline theo người nói).
> Anh chọn dạng tên-thương-hiệu chứ không phải mô tả việc — đừng "sửa lại
> cho đúng luật nhãn nút", đây là quyết định của anh.
> Trạng thái chi tiết từng tính năng (xong/chưa/lỗi mở): **`TRANG-THAI.md`**
> — anh Tiến yêu cầu, mỗi phiên sửa code PHẢI cập nhật. Diễn biến: `PROGRESS.md`.
> Giải thích chi tiết về Âm thanh & Quy trình Auto Cut: `GIAI-THICH-AUDIO-CHO-CLAUDE.md`.
>
> **VIỆC KẾ TIẾP** (chờ anh Tiến, không tự làm):
> 1. Anh bấm tay trên UI v0.5.0 — mọi phép đo tới giờ là em lái qua cổng
>    8094; riêng **hộp thoại chọn file** của nút tự sync CHƯA qua tay thật.
> 2. Anh **nghe bản cắt** rồi chấm mốc nào sai → đó là bộ đáp án để đụng
>    vào ngưỡng. Chưa có nó thì KHÔNG sửa ngưỡng (bài học 5d: thước cùng
>    vật liệu luôn tự khen mình).
> 3. `PV_Buoi1/Buoi2` của anh: mic đang **2 clip/track** → nút Cắt tự khoá
>    kèm lý do. Dọn về 1 clip liền là mở.
>
> Chốt trong ngày 04/08 → rạng sáng 05/08:
> - **v0.4.0 TỰ SYNC** (`dist/sync.js` + `tests/kiem-sync.mjs`): chọn 2–6
>   file mic → tool tự đo mốc bằng tương quan chéo → tự dựng sequence
>   "AiO Sync" → tự gợi ý gán. Đo thật: lệch PluralEyes **0,19–0,29 frame**.
>   ☠️ Chốt tin cậy bằng **HAI NỬA file phải cùng chỉ một mốc**, KHÔNG dùng
>   ngưỡng r tuyệt đối — r=0,13–0,17 vẫn là mốc ĐÚNG (đã đối chiếu), ngưỡng
>   r≥0,25 từng loại nhầm cặp đúng.
> - **v0.4.1 MÀU NHÃN THEO NGƯỜI**: cam + mic cùng người cùng màu, tô ở mức
>   projectItem (`pc_toMau`) nên mọi clip ở mọi sequence lên màu cùng lúc.
> - **v0.5.0 GIAO DIỆN Studio Console** theo thiết kế anh Tiến chốt: gõ TÊN
>   người thẳng vào track · monitor + dải nhát cắt · hộp **Cài đặt cắt** ăn
>   thật vào engine (cắt sớm · cam ngắn/lâu nhất→đảo wide · ngưỡng dB · chế
>   độ tiếng) · tự lưu project trước khi ghi.
> - `dist/` ĐÃ vào git (commit f6c7e70, 03/08) — hết cảnh mất trắng.
> - Sàn im lặng −50 dB cứng → **Otsu tự đo theo file** (bàn đo có đáp án:
>   sàn cứng 0/6 ở tiếng nhỏ, tự đo 12/12). Ngưỡng chênh 6 dB giữ nguyên.
> - Tiếng mic stereo hết xé 2 track (panel tách bản `.aio-mono.wav` cạnh
>   file gốc rồi đặt bản đó). Ô CHỌN sequence làm việc. CAM CHUNG gán được
>   (im >2s về wide). Thất bại hiện KHUNG TO kèm số đo từng người.
> - **Lỗi số 1 (cắt sai người trên liệu thật) ĐÃ CÓ CHẨN ĐOÁN** từ 12
>   marker anh Tiến chấm + soi khung hình: phần lớn do KHÂU THU (giọng
>   Dilys vào mic Trọng to hơn chính mic cô ấy 10 dB; line-in cam Trọng
>   gần như câm −75,5 dB). Code còn cứu được ~2-3/12 mốc (nới luật onset)
>   — CHƯA làm, chờ anh Tiến chốt ưu tiên.
> - ☠️ **CẤM HỌ API XUẤT TỪ SCRIPT** (`exportAsMediaDirect`, `app.encoder.*`)
>   — 04/08 lặp lại tai nạn đã ghi trong skill từ 01/08, Premiere sập trên
>   project thật. Trước khi dò API host lạ: grep skill `adobe-cep-panel` TRƯỚC.

> 📋 **BẢNG "CÁI GÌ XONG, CÁI GÌ CHƯA": `TRANG-THAI.md`** — anh Tiến yêu cầu
> 04/08 khi test gặp nhiều trở ngại. Mỗi phiên sửa mã nguồn PHẢI cập nhật nó
> (chỉ ghi ✅ khi có số đo trong PROGRESS.md).

| | |
|---|---|
| Extension ID | `com.aiostudio.podcast` |
| Cổng debug | **8094** (8088 Asset · 8089 Autocut · 8090 PowerBins · 8091 Transcripts · 8092 ReFrames) |
| Cài dev | `powershell -File scripts/sign-install.ps1` (tự chạy bộ kiểm não trước khi ký) |
| Đo trên panel | `scripts/do-tren-panel.ps1 -Expression "..."` (mặc định cổng 8094) |
| Kiểm não | `node tests/kiem-nao.mjs` — 16 phép kiểm, có seed, thoát mã 1 nếu trượt |
| Kiểm tự sync | `node tests/kiem-sync.mjs` — 9 phép kiểm, có seed, gác cổng cài |
| Kiểm tự khớp | `node tests/kiem-khop.mjs` — 28 phép kiểm, tất định, gác cổng cài |
| Stress | `node tests/stress.mjs` — 12 ca khó (chồng lấn, cười chung, 60 phút, sample rate lẫn…), gác cổng cài |
| Liệu thử | `node tests/sinh-lieu-media.mjs` → `../file pr for test/podcast-lieu/` |

---

## Sản phẩm này làm gì — ba lớp

### Người xài
Podcast quay nhiều cam, mỗi người một mic riêng, đã sync vào MỘT sequence.
Mở panel → chỉ cho tool biết *track nào là cam ai, track nào là mic ai* →
bấm **một nút** → tool nghe mic từng người, dựng **sequence mới**: ai đang
nói thì hình cắt qua cam người đó và tiếng là mic người đó. Bản gốc giữ nguyên.

*Ví dụ đời thường:* tập podcast 1 tiếng 2 khách — editor phải nghe lại cả
tiếng và đặt vài trăm nhát cắt chuyển cam bằng tay. Tool làm phần đó trong
vài phút; editor chỉ tinh chỉnh nhịp. Đối thủ trực tiếp: **AutoPod $29/tháng**
chỉ cho đúng tính năng này — mình offline, nằm trong bộ, một giá.

### Tự khớp (auto match) — người xài
Kéo hết clip nguồn vào một sequence rồi bấm **một nút**: panel tự điền cả bản
đồ — track tiếng đi kèm cam thành "Không dùng", cam ghép với mic của đúng
người, cam toàn cảnh thành cam chung, và tên người tự điền vào ô. Xong là bấm
Cắt luôn. *Ví dụ đời thường:* như người trợ lý cầm đống băng lên đọc nhãn rồi
xếp vào đúng ngăn — nó đọc **nhãn** (tên file), không "nghe" ra ai là ai.
Nên đặt tên kiểu `Cam_Trọng.mp4` / `Mic_Trọng.mp3` là khớp đúng ngay; đặt kiểu
`C4026.MP4` / `ZOOM0001.WAV` thì nó ghép theo thứ tự track và **nói thẳng là
đang đoán** để mình kiểm lại.

### Builder — chạy thế nào, chỗ nào dễ hỏng
- **Não** `dist/nao.js` — file THUẦN (không Node/CEP, kiểm được ngoài
  Premiere): RMS cửa sổ 20ms từng mic → mic to nhất chênh mic nhì ≥6dB là
  người đó đang nói → cửa sổ mù giữ người trước (hysteresis) → nuốt lượt
  <1s (chống nhấp nháy cam — anh chốt đây là chống lỗi, không phải tối ưu).
  **Gãy an toàn:** <20% cửa sổ phân biệt được → trả `KHONG_PHAN_BIET`,
  panel bảo người dùng kiểm tra thu âm — KHÔNG đoán bậy.
- **Host** `host/podcast.jsx` (v0.2): `pc_nhanBan` CLONE sequence nguồn
  (giữ settings/số track/tên track) rồi gỡ sạch clip → `pc_datHinh` đặt
  từng đoạn cam về ĐÚNG TRACK GỐC, ĐÚNG VỊ TRÍ gốc (không dồn — nhìn như
  timeline bị cắt) → `pc_donTieng` gỡ tiếng cam kéo theo → `pc_datTieng`
  đặt mic về đúng track gốc của mic. Ghi theo LÔ ~20 đoạn + chốt `SEQ_DOI`
  mỗi lô + `pc_phienBan()` CUỐI FILE (evalFile có thể nuốt file giữa chừng
  không báo lỗi — panel kiểm version sau mỗi lần nạp).
- **Hai chốt an toàn trước khi dựng** (từ ca thật 01/08 anh Tiến gán nhầm
  A1 = tiếng cam làm mic → cả tập thành 1 lượt): (1) mic có phổ âm lượng
  ĐỀU suốt (p90−p10 < 6dB, p50 > −50) → chặn, chỉ rõ tên người + track;
  (2) não nghe ra < 2 lượt → chặn và giải thích. Không bao giờ báo thành
  công cho một bản dựng đáng ngờ.
- **Panel** `dist/index.html` — tĩnh, không build (khuôn Re-Frames). Song
  ngữ VI/EN. FFmpeg MƯỢN của Transcripts/Autocut (như Re-Frames làm).
- ☠️ **Bẫy đã đo 01/08:** item WAV lưu in/out HỤT xuống lưới ~0,025s, đặt
  lên track tròn XUỐNG khung hình → tiếng hụt 1 khung so với hình. Đã sửa
  gốc trong `pc_themTieng`: đệm out +0,05s, đặt tuần tự tăng để clip sau
  cắt đuôi đệm. Đừng bỏ phần đệm đi khi "dọn code".

### MVP — "xong" nghĩa là gì, đo bằng số nào
Đo thật 01/08/2026 trên Premiere Beta 26.5, liệu tổng hợp có đáp án
(2 cam + 2 mic, 89s, 10 lượt, bleed −16dB):

| Phép đo | Kết quả |
|---|---|
| Não trên bộ kiểm (bleed −16/−8dB) | 10/10 lượt · ranh lệch **0ms** · câu chen 0,6s bị nuốt |
| Não khi mic giống nhau (−5dB) | Trả lỗi tử tế, không đoán — **0 đoạn bịa** |
| Dựng trên Premiere: hình | **10/10 clip đúng cam đúng người**, ranh khớp từng frame |
| Dọn tiếng cam | 10 → **0** clip tiếng cam, hình nguyên 10/10 |
| Tiếng mic | **10/10 đúng mic đúng người**, ranh hình–tiếng khớp tuyệt đối |
| Tổng thời lượng | 89,000s — đúng bằng liệu gốc |
| **v0.2 end-to-end trên PANEL THẬT** (16:00) | Bài âm tính: gán tiếng cam làm mic → **CHẶN đúng câu, không dựng**. Bài dương tính: 10 lượt (5+5), thước ngoài đo V0=5 đoạn camA · V1=5 camB · mic đúng track đúng người, vị trí khớp đáp án |

**CHƯA đạt / còn nợ (lý do):**
- Anh Tiến chưa tự tay bấm bản v0.2 (mọi phép đo trên là em điều khiển panel
  thật qua cổng debug — thao tác tay của anh vẫn là thước cuối).
- Mỗi clip đặt ra có đuôi đệm ≤0,08s chống hụt khung (đo thật); giữa hai
  track khác nhau đuôi này thành overlap nhỏ — tiếng phòng, không nghe ra.
- ☠️ **BLEED LIỆU THẬT chỉ 6,2–7,1 dB** (đo 03/08) so với −16 dB của liệu
  tổng hợp. **Sàn −50 dB cứng ĐÃ SỬA 04/08** thành Otsu tự đo theo file
  (nghe rõ 23% → 28,1%). Ngưỡng chênh 6 dB giữ nguyên. Phần còn sai nằm ở
  KHÂU THU (xem chẩn đoán 12 marker trong `PROGRESS.md` 04/08 14:57):
  giọng người này lọt vào mic người kia to hơn chính mic họ — thuật toán
  so năng lượng không vượt qua được, đã chứng minh bằng 2 phép thử
  (line-in + chuẩn hoá gain, cùng ngày).
- **Chưa có thước ĐỨNG NGOÀI.** Mọi số trên là dùng chính năng lượng dB
  chấm điểm thuật toán cũng chạy bằng dB (bài học 5d) — chỉ nói được "kết
  quả trông hợp lý", KHÔNG nói được "cắt đúng". Đã dựng bộ nghe kiểm
  `file pr for test\podcast-nghe-kiem\` (12 clip 6 giây + `_BANG-CHAM.csv`),
  chờ anh Tiến chấm bằng tai.
- ✅ **`dist/` ĐÃ vào git từ 03/08** (commit f6c7e70 — từng mất một lần vì
  `.gitignore` chung nuốt). Panel này không có bước build, `dist/` LÀ mã
  nguồn viết tay — đừng bao giờ cho nó vào ignore lại.
- **Hai bẫy nằm trong chính dữ liệu người dùng** (bắt được 03/08): tên file
  từ Mac chứa ký tự **U+F022** (dấu `"`) làm mọi lệnh truyền tên qua CLI gãy
  hết dù `Get-ChildItem` đọc bình thường — bản bán phải xử lý; và file mic
  **trùng từng byte** (cùng MD5) nếu gán làm 2 người thì chênh luôn = 0 dB.
- FFmpeg chưa bundle riêng (bản bán mới cần).

---

## ✅ QUYẾT ĐỊNH SẢN PHẨM — ANH TIẾN CHỐT 01/08/2026 (đừng làm ngược lại)

| Câu hỏi | Anh chốt | Nghĩa là |
|---|---|---|
| Đầu vào audio | **Mỗi người một mic riêng** | Đo năng lượng từng mic — không cần ML. Track trộn = để bản sau |
| Gán cam/mic | *"anh sẽ là người CHỌN cam và mic cho em"* | UI có bước GÁN: người dùng tự chỉ track nào = cam ai, mic ai. Không đoán theo thứ tự track |
| Nhịp dựng | *"CHƯA CẦN tối ưu — cut đúng cam và audio trước"* | **MVP = cắt ĐÚNG.** Không luật wide, không nhịp nghệ thuật ở v1. Chỉ giữ ngưỡng gộp ~1s chống nhấp nháy |
| Đồng bộ | Người dùng sync trước bằng Premiere Synchronize | Tool giả định các track đã sync trên MỘT sequence |

Ràng buộc MVP thêm (tự đặt, nói rõ trên UI khi vi phạm): mỗi track được gán
phải có **đúng 1 clip liền** — sync xong để nguyên là đạt. Nhiều clip/track
= bản sau.
