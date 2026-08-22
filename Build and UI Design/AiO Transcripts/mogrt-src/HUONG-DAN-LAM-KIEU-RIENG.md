# Tự làm KIỂU CAPTION riêng bằng After Effects → chọn thẳng trong Premiere

> Anh Tiến 22/08/2026: *"kiểu caption anh muốn em sau khi thiết kế bên AE thì có
> thể chọn trực diện ở bên PR cho tiện luôn"*. Đây là cách làm.

## Ba bước

1. **Thiết kế trong After Effects** một composition **1920 × 1920 px** (vuông — Premiere
   đặt template ở TÂM sequence, không phóng to/thu nhỏ, nên một file dùng được cho cả
   video ngang 16:9 lẫn dọc 9:16). Chữ căn giữa ngang, một text layer tên `Caption`.
2. **Đưa tham số lên Essential Graphics** (Window → Essential Graphics → kéo thuộc tính
   vào). Tên tham số phải ĐÚNG như bảng dưới — panel tìm theo tên.
3. **Export → Motion Graphics Template** (file `.mogrt`), rồi trong panel Transcripts bấm
   **"Thêm kiểu từ After Effects…"** → thả file vào thư mục vừa mở → quay lại panel là
   thấy nút kiểu mới.

Thư mục kiểu riêng: `%APPDATA%\AiOStudio\caption-styles\` (dùng chung cả bộ AiO).

## Tham số template — panel đặt gì, tên gì

| Tên tham số trong Essential Graphics | Bắt buộc? | Panel đặt gì |
|---|:-:|---|
| `Text` | **CÓ** | Chữ của khối caption (đã xuống dòng, `\r` giữa hai dòng) |
| `Position Y` | không | % chiều cao comp (0 = mép trên, 100 = đáy). Dọc 75 · Ngang 70 |
| `Highlight Word` | không | Số thứ tự từ được tô (1 = từ đầu). 0 = không tô. Karaoke: panel đặt mỗi TỪ một clip với số này tăng dần |
| `Text Size` | không | % cỡ chữ — panel hạ xuống khi một từ dài tràn khung |
| `Pop In` | không | Bật/tắt hiệu ứng phóng khi vào (checkbox) |
| `Box Padding` | không | Lề hộp nền (kiểu Boxed) |

Thiếu tham số nào thì panel bỏ qua tham số đó — **chỉ `Text` là bắt buộc**.

## ☠️ BA LUẬT ĐÃ ĐO TRÊN PREMIERE BETA 27 (22/08/2026) — làm sai là template "câm"

1. **Slider đưa lên Essential Graphics bị kẹp 0..100** → mọi tham số số đều là PHẦN
   TRĂM hoặc số thứ tự, đừng làm slider pixel (đặt 420 đọc lại 100).
2. **Premiere chỉ chạy expression dạng MỘT BIỂU THỨC** — không `var`, không `if`,
   không vòng lặp, không `function`. Viết `[a, b]`, ternary `c ? x : y`, `Math.*`,
   `effect("Tên")("Slider")`, `time`, `sourceRectAtTime(time,false)`. Expression nhiều
   dòng không báo lỗi gì, thuộc tính chỉ lặng lẽ giữ giá trị tĩnh (đo qua 14 template
   thử A→N: `[50,50]` co đúng, `var v = …; [v,v]` không đổi gì).
3. **Tô từ nổi bật = Text Animator + Range Selector** (Units = Index, Based On = Words),
   Start/End mỗi cái một biểu thức đọc slider `Highlight Word`:
   `Math.max(0, Math.round(effect("Highlight Word")("Slider")) - 1)` và
   `Math.max(0, Math.round(effect("Highlight Word")("Slider")))`.
   **Expression Selector (`textIndex`) KHÔNG chạy** trên Premiere. **Keyframe tham số
   MOGRT qua API ExtendScript không đổi hình** (dữ liệu có, render không) — nên karaoke
   làm bằng clip con theo từng từ, không bằng keyframe.

## Ghi đè luật cắt câu cho kiểu riêng (tuỳ chọn)

Đặt file `<cùng tên>.json` cạnh file `.mogrt`. Không có thì panel dùng luật của kiểu
**Boxed** (2 dòng · dọc 14 ký tự/dòng · ngang 24). Ví dụ:

```json
{
  "ten": "Kênh Phoebe",
  "inHoa": true,
  "noiBat": true,
  "karaoke": false,
  "pxMoiKyTu": 80,
  "gioiHan": {
    "doc":   { "kyTuMoiDong": 12, "soDongToiDa": 2, "giayToiThieu": 0.5, "tuToiDa": 4, "luonCat": true, "giuTuNguyen": true },
    "ngang": { "kyTuMoiDong": 20, "soDongToiDa": 2, "giayToiThieu": 0.5, "tuToiDa": 4, "luonCat": true, "giuTuNguyen": true }
  }
}
```

- `pxMoiKyTu`: ước lượng bề rộng một ký tự (px) ở cỡ gốc của template — dùng để hạ
  `Text Size` khi từ dài. Đo nhanh: gõ 10 chữ cái hoa trong AE, đọc bề rộng, chia 10.
- `inHoa`: panel tự IN HOA chữ · `noiBat`: tô từ dài nhất · `karaoke`: mỗi từ một clip.

## Font

- Font có trên **Adobe Fonts** (Montserrat…) → máy khách tự sync, không cần cài.
- Font khác (Bangers, Inter Display…) → phải có trên máy khách, không thì Premiere báo
  thiếu font và thay font khác. Bộ cài AiO kèm 4 font OFL trong `fonts/`.

## 5 kiểu có sẵn được sinh thế nào

`build-mogrt.jsx` trong thư mục này chạy trong AE (gửi qua **BridgeTalk** từ Premiere —
`AfterFX.exe -r` không chạy script trên AE Beta 27; xem `PROGRESS.md` mục 2.5.0) → sinh
5 file vào `../mogrt/`. Sửa kiểu có sẵn thì sửa bảng `KIEU` trong script rồi chạy lại,
**đừng sửa tay file .mogrt**. Script tự lưu project trước mỗi lần export (export đòi
project không có thay đổi chưa lưu) và tắt hộp thoại bằng `app.beginSuppressDialogs()`.
