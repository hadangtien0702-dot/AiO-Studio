# AiO Auto Cut Short — đọc cái này trước

> Dự án thứ 6 của bộ AiO Studio. Anh Tiến giao 2026-07-30:
> *"tiếp theo là tự tạo nội dung short 60s - dạng short cho các nền tảng"*.
>
> **TRẠNG THÁI: MỚI ĐẶT MÓNG — chưa có code.** File này ghi kiến trúc dự kiến
> và NHỮNG CÂU HỎI SẢN PHẨM CHỜ ANH TIẾN CHỐT trước khi xây.

---

## Sản phẩm này làm gì (dự kiến)

Đưa video dài (podcast, phỏng vấn, bài giảng) → tool **tự chọn đoạn đáng làm
short**, cắt gọn, dựng thành **short dọc 9:16 có phụ đề**, sẵn đăng
TikTok/Reels/Shorts.

*Ví dụ đời thường:* quay talkshow 1 tiếng, muốn ra 5 short đăng cả tuần — thay
vì ngồi tua lại cả tiếng tìm "đoạn nào hay", tool đưa sẵn các đoạn ứng cử kèm
lý do, bấm chọn là ra short hoàn chỉnh.

---

## VÌ SAO DỰ ÁN NÀY RẺ HƠN NHÌN BỀ NGOÀI — 3/4 đường ống ĐÃ CÓ

Đây là dự án GHÉP — não của bộ AiO đã xây gần đủ:

| Mảnh | Lấy từ | Trạng thái |
|---|---|---|
| Nghe hiểu + mốc từng từ + độ tin cậy | Transcripts (`whisper.ts`, đệm `.autocut-nghe.json` **dùng chung theo file video**) | ✅ đã bán được |
| Dò khoảng lặng + cắt gọn + chốt chặn "không nuốt lời" | Autocut (`amluong.ts`, `plan.ts`) | ✅ |
| Dựng bản dọc 9:16 + bám chủ thể (Sensei) | Re-Frames (`rf_lamDoc`, spike 5/5) | ✅ 30/07 |
| Phụ đề khung DỌC (20 đơn vị · 6 từ/khối, đo 0 vượt) | Transcripts (`gioiHanTheoKhung('doc')`) | ✅ 30/07 |
| **CHỌN ĐOẠN NÀO đáng làm short** | **CHƯA CÓ AI LÀM — đây là não của tool này** | 🔴 |

Đường ống dự kiến: nghe hiểu (trúng đệm là 0 giây) → **chấm điểm cửa sổ
45–75s** → người dùng chọn trong các ứng viên → cắt lặng trong đoạn → dựng
sequence dọc + Auto Reframe → gắn phụ đề dọc → short nằm trên timeline.

## Não "chọn đoạn" — hướng v0, chấm bằng TÍN HIỆU ĐO ĐƯỢC

Không gọi API ngoài (tool bán offline). Tín hiệu có sẵn từ đệm nghe:
- **Trọn câu**: cửa sổ bắt đầu/kết thúc đúng ranh giới câu — short cắt ngang
  câu là vứt.
- **Mật độ lời**: tỉ lệ nói/lặng cao (đo từ mốc từ) — đoạn ít ngập ngừng.
- **Hook mở màn**: câu đầu là câu hỏi / con số / phủ định mạnh (danh sách mẫu
  theo ngôn ngữ — cần đo, đừng đoán).
- **Độ tin cậy nghe cao**: đoạn máy nghe chắc thì phụ đề sạch.

☠️ **Thước "đoạn hay" là thước CẢM QUAN — mắt anh Tiến là bộ chấm cuối.**
v0 phải đưa **danh sách ứng viên kèm lý do bằng số**, không tự quyết một đoạn.
Đừng hứa "AI chọn đoạn viral" — chưa có bằng chứng nào đo được chữ "viral".

---

## ✅ QUYẾT ĐỊNH SẢN PHẨM — ANH TIẾN CHỐT 30/07/2026 (đừng làm ngược lại)

| Câu hỏi | Anh chốt | Nghĩa là |
|---|---|---|
| **Chia đoạn thế nào** | *"podcast 1 tiếng thì cứ đo lường theo CÂU HỎI — 1 câu hỏi + trả lời có thể dài hơn 60s nhưng cứ cut ra để editor sửa thêm"* | **Não v0 = dò cấu trúc HỎI–ĐÁP trong bản chép lời.** Mỗi câu hỏi + phần trả lời của nó = MỘT ứng viên short. KHÔNG chấm điểm "hay/dở" mơ hồ — cắt theo cấu trúc, editor tinh chỉnh sau. Đây là kinh nghiệm 5 năm dựng của anh, không phải đoán của máy. |
| **Đầu ra** | *"cut file video ra sequence mới, có nút xuất định dạng thấp 480 để check"* | Mỗi ứng viên = **một sequence mới** trên timeline + **nút xuất bản nháp 480p** để xem nhanh/gửi duyệt. Không xuất bản final — đó là việc của editor. |
| **Độ dài** | Dải 30–90s, ưu tiên ~60s | Cắt ở ranh giới câu trọn. Hỏi–đáp dài quá 90s **vẫn cắt ra** (anh chốt: "dài hơn 60s cũng được, editor sửa thêm"). |
| **Phụ đề** | *"khối dọc thì cứ làm như Transcripts có sẵn, hiệu ứng thì làm sau"* | v1 dùng nguyên engine phụ đề khung dọc đã đo (20 đơn vị · 6 từ/khối). Karaoke từng chữ = việc SAU, đừng nhét vào v1. |

### Não "dò HỎI–ĐÁP" — việc MỚI duy nhất, hướng làm

- Tín hiệu câu hỏi trong bản chép: dấu `?` của Whisper + từ để hỏi đầu/cuối câu
  (tiếng Việt: "tại sao/như thế nào/có...không/là gì" · tiếng Anh: wh-words,
  đảo trợ động từ). **Phải đo trên podcast thật trước khi tin** — Whisper có
  chấm `?` đều tay không là chuyện chưa ai kiểm.
- Phần "trả lời" = từ sau câu hỏi đến câu hỏi kế / đến khoảng lặng dài.
- Podcast 2 người: sau này ghép được speaker (ai hỏi ai trả lời) — v0 chưa cần.

### Việc phải SPIKE trước khi xây (thứ tự)

1. **Whisper có chấm dấu `?` tin được không** — đo trên 3 video Test có sẵn
   (đếm câu `?` thật vs nghe tai vài đoạn).
2. **Xuất 480p bằng script**: `seq.exportAsMediaDirect(outPath, eprPath,
   workArea)` — cần file preset `.epr` 480p. Spike trên sequence rác.
3. Cắt vùng hỏi–đáp thành sequence mới: dùng lại đường `createNewSequenceFromClips`
   + in/out (đã chứng minh ở Autocut/Re-Frames).

## Quy ước đã đặt trước (theo bộ)

- Extension ID dự kiến: `com.aiostudio.short` · cổng debug **8093**
  (8088→8092 đã dùng). Đăng ký vào bảng cổng ở `Production\CLAUDE.md` khi dựng.
- Dùng chung đệm nghe `.autocut-nghe.json` (cố ý — khách có cả bộ).
- Sửa `whisper.ts`/`amluong.ts` thì nhớ chép đồng bộ với Autocut + Transcripts.
