# AiO Studio — DESIGN SYSTEM (MASTER)

Nguồn chân lý cho giao diện. Mọi màn hình phải tuân theo. Token cài đặt thực tế
nằm trong `client/src/styles/_tokens.scss`.

| | |
|---|---|
| Hướng thiết kế | "Studio Console" — **đen + cam**, dense, precise |
| Tham chiếu | Linear · Raycast · Vercel dashboard |
| Bối cảnh | Panel công cụ nhúng trong Adobe Premiere Pro |
| Chữ | SF Pro (Text cho UI, Display cho tiêu đề) |
| Style sheet | SCSS — `client/src/styles/main.scss` + 10 partial |
| Cập nhật | 2026-07-26 |

---

## 1. Triết lý

Đây là **công cụ**, không phải trang tiếp thị. Ba nguyên tắc:

1. **Nội dung là chính, giao diện lùi lại.** Asset của người dùng là ngôi sao;
   khung phải im lặng để chúng nổi bật.
2. **Tiết chế màu nhấn.** Accent (xanh) chỉ dùng cho: mục đang chọn, nút primary,
   nút Chèn trên thẻ, vòng focus. Hết. Không rải accent — đó là thứ làm rối.
3. **Kỷ luật hệ thống.** Mọi kích thước chữ, khoảng cách, bo góc đều lấy từ token.
   Không viết px rời rạc trong component.

---

## 2. Cấu trúc file SCSS

```
client/src/styles/
  main.scss        ← điểm vào duy nhất (main.tsx import file này)
  _tokens.scss     ← CSS custom properties: màu, chữ, spacing, bo góc, motion
  _mixins.scss     ← khuôn dùng lại: ellipsis, surface, control-row, ring, motion,
                     scroll-thin, caps-label
  _base.scss       ← reset, khung app, focus-visible, prefers-reduced-motion
  _controls.scss   ← btn, icon-btn, searchbox, audio-ctrl, queue-progress
  _topbar.scss     ← 2 dải trên cùng
  _launcher.scss   ← màn hình chọn không gian làm việc
  _sidebar.scss    ← menu trái + hub Power Bins/Packs
  _grid.scss       ← vùng lưới, trạng thái rỗng, view-switch nổi
  _card.scss       ← thẻ asset (lưới + dạng Line)
  _overlays.scss   ← modal, toast, batch bar
```

Quy tắc: **thuộc tính DÁNG khai trên chính class của thành phần**; chỉ thứ thuộc
bố cục của chỗ chứa (flex, grid-area, lề) mới được nằm dưới selector cha. Nếu
thấy mình đang chép rule sang file thứ hai → tách thành mixin trong `_mixins.scss`.

---

## 3. Màu (tokens)

### Nền — dark trung tính hơi ngả lạnh
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg-0` | #0a0a0b | Sâu nhất: khung xem media, ô nhập |
| `--bg-1` | #0f0f11 | Rail / menu trái |
| `--bg-2` | #151517 | Nền chính |
| `--bg-3` | #1c1c1f | Thẻ, mặt nổi |
| `--bg-4` | #232327 | Nút, ô nhập |
| `--bg-5` | #2c2c31 | Nút khi rê chuột |
| `--bg-6` | #161618 | Mặt chìm (modal body) |

### Viền — hairline mờ (KHÔNG dùng đường xám đặc)
`--line-1` 6% · `--line-2` 10% · `--line-strong` 16% (đều là rgb trắng + alpha).

### Chữ — đã ĐO tương phản thật trên nền tương ứng
| Token | Giá trị | Đo được |
|---|---|---|
| `--text-1` | #f5f5f7 | 14.4:1 |
| `--text-2` | #c3c3c8 | 8.9:1 |
| `--text-3` | #8d8d95 | 4.8:1 (nhãn, số đếm) |
| `--text-meta` | #9b9ba3 | 5.7:1 (meta trong thẻ) |

### Accent + ngữ nghĩa
`--accent #ff5714` (cam đỏ) · `--accent-hover #ff7038` · `--accent-soft` (nền mục đang chọn) ·
`--accent-line` (viền focus) · `--accent-text #ffb599` (9.2:1 trên accent-soft) ·
`--accent-on #150700` (6.2:1 — chữ trên nền cam đặc).
`--ok #4ec98a` · `--warn #e8c05a` · `--danger #ff5f6d` (hồng-đỏ, tách khỏi cam) · `--heart #ff6b81`.

> **Chữ trên nút cam đặc phải là `--accent-on` (nâu gần đen), KHÔNG dùng trắng** —
> trắng trên #ff5714 chỉ đạt 3.2:1, trượt chuẩn ở cỡ chữ 12px của panel.

> **Quy tắc contrast:** mọi màu chữ mới phải đạt ≥ 4.5:1 trên nền của nó. Đo bằng
> luminance **có trộn alpha** của nền lên nền dưới nó — đừng đọc mã màu rồi đoán.

---

## 4. Typography

`--font-ui` = **SF Pro Text** → SF Pro Display → -apple-system → Inter → Segoe UI.
`--font-display` = **SF Pro Display** (dùng cho tiêu đề, tên workspace, `.state__title`).

Font KHÔNG được nhúng vào dự án (giấy phép Apple giới hạn phân phối) — máy nào
không có SF Pro sẽ tự lùi về Inter rồi Segoe UI, layout không vỡ vì hai font này
metric gần nhau. `font-variant-numeric: tabular-nums` để số thẳng cột.
`--ls-display: -0.014em` siết chữ ở cỡ lớn theo optical sizing của Apple.

### Type scale — thang DUY NHẤT
| Token | px | Dùng cho |
|---|---|---|
| `--fs-2xs` | 10 | Micro: số đếm, meta thẻ, nhãn nhóm |
| `--fs-xs` | 11 | Meta, tên asset, nhãn phụ |
| `--fs-sm` | 12 | Nhãn menu, control phụ, ô nhập |
| `--fs-md` | 13 | Mặc định / body / tên workspace |
| `--fs-lg` | 15 | Tiêu đề mục, tiêu đề thẻ chọn |
| `--fs-xl` | 19 | Tên app ở màn hình chọn |

Weight: 400 / 500 / 600 / 700. Line-height: `--lh-tight 1.25` · `--lh 1.45`.

> **Cấm** viết `font-size: 14px` trong component. Dùng token gần nhất.
> Thang này là thang GIAO DIỆN — nội dung dạng đọc dài cần thang riêng cục bộ.

### Quy ước viết hoa nhãn (bắt buộc)

Nhãn mô tả **chỉ viết hoa chữ cái đầu**: `Tổng quan`, `Loại asset`, `Video`, `Mogrt`,
`Âm thanh`, `Tất cả asset`, `Khay chung`. Không viết hoa toàn bộ, không thêm hậu tố
cho dài ra ("Video Clips", "MOGRT Templates").

Ngoại lệ — **tên riêng** giữ nguyên cách viết của nó: `AiO Studio`, `Asset Manager`,
`Power Bins`, `Brand Kit`. Và **mã định dạng file** trên thẻ asset (`MP4`, `WAV`,
`PNG`, `MOGRT`) viết hoa theo quy ước chung của ngành — chúng không phải nhãn.

> **CẤM `text-transform: uppercase` cho nhãn.** Nó phá quy ước ngay tại tầng trình
> bày: code viết đúng mà màn hình vẫn ra chữ in hoa toàn bộ, và grep trong code sẽ
> không tìm ra nguyên nhân. Phân tầng thị giác lấy bằng **cỡ chữ + màu + giãn chữ**.

---

## 5. Spacing · Radii · Elevation

**Spacing** (lưới 4px): `--sp-1 4` · `--sp-2 6` · `--sp-3 8` · `--sp-4 12` · `--sp-5 16` · `--sp-6 24`.

**Bo góc**: `--r-sm 6` · `--r-md 8` · `--r-lg 12` · `--r-pill 999`.

**Đổ bóng** (chỉ cho lớp nổi): `--shadow-sm` · `--shadow-md` (toast, batch bar,
view-switch) · `--shadow-pop` (modal).

**Chiều cao control**: `--h-ctrl 28px` · `--h-ctrl-sm 24px`.
**Chiều cao chân thẻ**: `--card-info-h 44px` — PHẢI khớp hằng `INFO_H` trong
`components/Grid.tsx` (Grid tính chiều cao thẻ bằng JS).

---

## 6. Chuyển động

`--dur 150ms` · `--ease cubic-bezier(0.32,0.72,0,1)` (vào nhanh, dừng mượt).
Dùng mixin `motion(...)` thay vì viết `transition` tay.

- Micro-interaction 150ms. Không hiệu ứng > 300ms.
- Tôn trọng `prefers-reduced-motion` (đã cài toàn cục).
- **Không nhấc phần tử trong lưới khi hover** — nó làm mắt giật khi quét lưới.
  Dùng sáng viền + zoom ảnh 1.03.

---

## 7. Quy ước component

| Thành phần | Quy ước |
|---|---|
| Bố cục | Đúng **2 dải** trên cùng (44px + 38px). Thêm dải thứ ba = phải bỏ một dải khác |
| Nút | Cao 28px, bo `--r-md`. Đúng **2 họ**: việc thường (`.btn`) và việc phá huỷ (`.btn--danger`, viền màu) |
| CTA chính | **Tối đa 1 primary mỗi màn hình**, gán theo ngữ cảnh. Ẩn hẳn nút không áp dụng được |
| Nút icon | 28×28, chỉ icon SVG, bắt buộc `aria-label` |
| Icon | Chỉ dùng SVG từ `Icons.tsx`. **CẤM emoji/ký tự** (kể cả ✕ ✓ trong nút và trong chuỗi toast). Nét 1.5px, cỡ 10–14 |
| Ô nhập | Nền `--bg-0`, viền `--line-2`, focus = `--accent-line` |
| Thẻ asset | Ảnh tràn kín ô. `<img>` CHỈ nhận file thật sự là ảnh (không bao giờ trỏ vào .mp4). `alt=""` vì tên đã hiện dưới thẻ. Tim góc trên phải, nút Chèn góc trái dưới — cả hai chỉ hiện khi rê chuột |
| Đang chọn | Vòng viền accent 2px bằng `inset box-shadow` — không tràn ra ngoài hộp, không glow |
| Menu trái | Dòng cao 28px là `<button>`, active = `--accent-soft`. Nhãn nhóm `--fs-2xs`, **không** in hoa |
| Modal | Body nền `--bg-6`, viền `--line-2`, `--shadow-pop`, nền mờ phía sau |
| Toast | Nền `--bg-5`, `--shadow-md`, tự ẩn ~3s, nằm TRÊN batch bar |
| Cụm nổi ở đáy | View-switch (phải) và batch bar (trải ngang, chừa 92px phải) — chia chỗ, không đè nhau |

---

## 8. Tiếp cận (bắt buộc)

- Tương phản chữ ≥ 4.5:1 — **đo bằng code**, không đoán bằng mắt.
- `:focus-visible` viền accent 2px — không được gỡ.
- Mọi phần tử bấm được phải Tab tới được: ưu tiên `<button>`; nếu bên trong đã có
  nút khác thì dùng `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space),
  vì **nút lồng trong nút là HTML không hợp lệ**.
- Nút chỉ có icon phải có `aria-label`; nút bật/tắt có `aria-pressed`.
- Trạng thái động (đang quét, toast) dùng `aria-live="polite"`.
- Tôn trọng `prefers-reduced-motion`.

---

## 9. Chống lặp lại (bài học đã có)

- **Không emoji làm icon** — phụ thuộc font, không đổi màu theo token được.
- **Không mã màu viết cứng** — luôn dùng biến. Đổi theme không được vỡ.
- **SVG trong dòng chữ** phải có `vertical-align: middle` + nằm trong flex, nếu không
  sẽ tụt baseline và đè lên chữ.
- **Đừng bày cùng một lối điều hướng ở hai chỗ.** Dãy chip loại asset ở thanh trên
  từng trùng y nguyên mục "Loại asset" ở menu trái → đã bỏ dãy chip.
- **Nhãn lặp 60 lần là nhiễu, không phải thông tin.** Mã hoá bằng icon/màu, rồi trả
  nghĩa lại bằng `title` + `aria-label`.
- **Phần tử nổi (`position: fixed/absolute`) không chiếm chỗ** — phải trả lại chỗ cho
  dòng chảy bằng `padding`, và chỉ trừ MỘT lần.
- **`clientWidth` có tính padding.** Tính bố cục bằng JS thì phải trừ padding ra.
- **Số cột lấy bằng `Math.round`, không `Math.floor`** — floor làm panel hẹp ra đúng
  1 ô khổng lồ thay vì 2 ô hơi nhỏ.
- **Nút hành động của thẻ phải là con của THẺ, không phải của ô ảnh** — nếu không,
  dạng danh sách (ô ảnh 46px) sẽ cắt mất chúng.
- **Sửa `_tokens.scss`** chỉ được THÊM biến hoặc đổi giá trị đã đo lại contrast.
  Ghi vào `PROGRESS.md`.
