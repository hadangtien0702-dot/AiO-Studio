# AiO Studio — Design System ("Studio Console")

> **Tài liệu tự chứa — dán THẲNG khối này vào Claude design làm ngữ cảnh.**
> Nó mô tả đủ để một bản thiết kế mới trông như cùng một nhà làm ra với 7 panel
> đang có. Lập 2026-08-02, rút từ `tokens.css` + `MASTER.md` (nguồn chân lý).
>
> Khi đưa cho Claude design, kèm một câu: *"Thiết kế theo đúng design system
> 'Studio Console' dưới đây. Dùng đúng các biến màu/cỡ/khoảng cách này, tuân thủ
> mục KHÔNG ĐƯỢC LÀM. Đây là panel tối sống cạnh timeline Adobe Premiere Pro,
> phải chạy được ở bề rộng hẹp 300px."*

---

## 0. Sản phẩm là gì (để thiết kế đúng ngữ cảnh)

AiO Studio là **bộ 7 panel mở rộng bên trong Adobe Premiere Pro** (không phải web
độc lập). Người dùng là **editor đang làm việc**, panel nằm nép **cạnh timeline**.
Vì vậy giao diện phải:

- **Tối, trung tính** — không tranh sáng với Premiere (nền Premiere cũng xám đen).
- **Gọn, dày thông tin, nội dung là chính** — không hero, không gradient lớn,
  không chữ to gây ấn tượng, không khoảng trắng phung phí.
- **Sống được ở 300px** — panel dock hẹp tới ~300px; mọi bố cục phải không vỡ ở đó.
- **Accent cam dùng rất tiết chế** — chỉ cho: mục đang chọn · CTA chính · vòng focus.

Khẩu quyết: **"nhẹ để nhanh, không nặng để đẹp"** — máy khách yếu hơn.

---

## 1. Màu

Nền **ĐEN trung tính 7 bậc** (không xanh, không nâu). Viền là **hairline trắng mờ**
(không xám đặc) — đây là chữ ký của phong cách.

### Bề mặt (surfaces)
| Biến | Hex | Dùng cho |
|---|---|---|
| `--bg-0` | `#0a0a0b` | sâu nhất — khung xem media, ô nhập |
| `--bg-1` | `#0f0f11` | rail / menu trái / **thanh trên** |
| `--bg-2` | `#151517` | **nền chính của app** |
| `--bg-3` | `#1c1c1f` | thẻ, mặt nổi |
| `--bg-4` | `#232327` | nút, ô nhập |
| `--bg-5` | `#2c2c31` | nút khi rê chuột |
| `--bg-6` | `#161618` | mặt chìm (thân modal) |
| `--bg-hover` | `rgb(255 255 255 / 5%)` | phủ hover |
| `--bg-active` | `rgb(255 255 255 / 9%)` | phủ active |

### Viền — hairline, KHÔNG xám đặc
| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--line-1` | `rgb(255 255 255 / 6%)` | viền mặc định |
| `--line-2` | `rgb(255 255 255 / 10%)` | viền nút/ô nhập |
| `--line-strong` | `rgb(255 255 255 / 16%)` | viền nhấn |

### Chữ (đã đo tương phản thật, trộn alpha)
| Biến | Hex | Tương phản | Dùng cho |
|---|---|---|---|
| `--text-1` | `#f5f5f7` | 14.4:1 | chữ chính |
| `--text-2` | `#c3c3c8` | 8.9:1 | chữ phụ |
| `--text-3` | `#8d8d95` | 4.8:1 | nhãn, số đếm |
| `--text-meta` | `#9b9ba3` | 5.7:1 | meta trong thẻ asset |
| `--icon-dim` | `#8f8f97` | 4.9:1 | icon placeholder |

### Accent CAM — dùng rất tiết chế
| Biến | Hex | Ghi chú |
|---|---|---|
| `--accent` | `#ff5714` | active · CTA · focus. 4.9:1 khi làm chữ/icon trên nền tối |
| `--accent-hover` | `#ff7038` | hover |
| `--accent-soft` | `rgb(255 87 20 / 16%)` | nền chip/khối accent nhạt |
| `--accent-line` | `rgb(255 87 20 / 40%)` | viền accent |
| `--accent-text` | `#ffb599` | 9.2:1 — chữ trên nền `accent-soft` |
| `--accent-on` | `#150700` | **chữ trên nút cam ĐẶC** (nâu gần đen), 6.2:1 |

> ☠️ **Chữ trên nút cam đặc PHẢI là `--accent-on`**, không dùng chữ trắng — trắng
> trên cam chỉ đạt 3.3:1, trượt AA.

### Ngữ nghĩa — sắc phải PHÂN BIỆT được với cam
| Biến | Hex | Nghĩa |
|---|---|---|
| `--ok` | `#4ec98a` xanh lá | xong · đạt |
| `--warn` | `#e8c05a` vàng | **còn việc phải làm** (không phải hỏng) |
| `--danger` | `#ff5f6d` hồng-đỏ | hỏng · phá huỷ · chỗ cần soát |
| `--danger-strong` | `#ff4757` | phá huỷ nhấn mạnh |
| `--heart` | `#ff6b81` | yêu thích |

> ☠️ `--danger` **cố ý là hồng-đỏ**, tách khỏi cam. Dùng đỏ-cam thì hai thứ khác
> nghĩa hoàn toàn lại nhìn giống nhau dưới ánh đèn phòng dựng.

> ☠️ **Vẽ lại thứ có thật trong Premiere thì lấy MÀU CỦA PREMIERE**, đừng tự chọn
> cho "hài hoà": clip video **xanh dương**, audio **xanh lá**, caption/phụ đề
> **vàng và nằm TRÊN** timeline, playhead **xanh nhạt**. Vẽ sai màu/sai tầng thì
> người dựng phải dịch trong đầu — đúng cái việc panel sinh ra để tránh.

---

## 2. Chữ (typography)

**Một thang duy nhất, sáu bậc** cho cả bộ. Font SF Pro, tự lùi về Inter → Segoe UI.

```
--font-ui:      'SF Pro Text','SF Pro Display',-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;
--font-display: 'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
```

| Biến | Cỡ | Dùng cho |
|---|---|---|
| `--fs-2xs` | 10px | micro: số đếm, nhãn nhóm |
| `--fs-xs` | 11px | meta, nhãn phụ, chỉ dẫn |
| `--fs-sm` | 12px | nhãn, chip, control phụ |
| `--fs-md` | **13px** | **mặc định · body · chữ trên nút** |
| `--fs-lg` | 15px | tiêu đề mục |
| `--fs-xl` | 19px | số lớn trong ô kết quả, empty-state |

Độ đậm: `--fw-normal:400` · `--fw-medium:500` · `--fw-semibold:600` · `--fw-bold:700`.
Line-height: `--lh-tight:1.25` · `--lh:1.45`. Siết chữ cỡ lớn: `--ls-display:-0.014em`.

> ☠️ **ĐỪNG NÂNG CẢ THANG.** Muốn chữ to hơn ở một chỗ thì dùng **bậc cao hơn** ở
> đúng chỗ đó, đừng cộng px cho mọi bậc — hai panel cạnh nhau sẽ lệch một bậc và
> lộ ra ngay.
> ☠️ **Phân cấp bằng CỠ và ĐỘ ĐẬM, không bằng `opacity`** — opacity kéo màu chữ
> về phía nền và làm trượt tương phản.

---

## 3. Khoảng cách, bo góc, bóng

**Lưới 4px:** `--sp-1:4` · `--sp-2:6` · `--sp-3:8` · `--sp-4:12` · `--sp-5:16` · `--sp-6:24`.

**Bo góc:** `--r-sm:6px` (nút phụ, chip, ô nhập) · `--r-md:8px` (nút, thẻ nhỏ) ·
`--r-lg:12px` (khối section, modal) · `--r-pill:999px`.

**Bóng — chỉ cho lớp NỔI:** `--shadow-sm:0 1px 2px rgb(0 0 0 /30%)` ·
`--shadow-md:0 8px 24px rgb(0 0 0 /45%)` · `--shadow-pop:0 18px 52px rgb(0 0 0 /62%)`.
Bề mặt phẳng nằm trong luồng thì **không đổ bóng** — phân tầng bằng bậc nền.

---

## 4. Chiều cao ô điều khiển — BA bậc, chọn theo VAI TRÒ

| Biến | Cao | Vai trò |
|---|---|---|
| `--h-ctrl-sm` | 24px | nút phụ trên thanh công cụ, chip |
| `--h-ctrl` | 28px | nút thường, ô nhập, mục menu — **mặc định** |
| `--h-ctrl-lg` | 34px | **CTA chính** — mỗi màn hình chỉ MỘT |

Thanh trên: `--h-topbar: 44px`.

> ☠️ **Cỡ chữ và chiều cao là một CẶP** — phép kiểm bắt buộc: `chiều cao − line-height ≥ 6px`.
> ☠️ **Dùng đúng token nhưng sai vai trò vẫn sai.** Trước khi chọn bậc, hỏi:
> *phần tử này đóng vai gì trong màn hình?* Một trong hai quyết định chính của màn
> hình thì không được để `--h-ctrl-sm`.

**Vùng bấm (touch/click target) — ngoại lệ có chủ đích:**
- **Panel (desktop, dùng chuột):** 24–28px là **ĐÚNG** — Premiere gốc cũng ~24px,
  editor cần mật độ cao. Chuẩn 44px của mobile KHÔNG áp cho panel. Nếu nút nhỏ hơn
  vùng bấm mong muốn thì nới **vùng bấm** bằng padding (giữ dáng nhỏ), đừng phình nút.
- **Website (có người dùng mobile):** giữ **44×44px** cho mọi thứ bấm được, cách nhau ≥8px.

---

## 5. Component — đặc tả dùng lại

### Thanh trên (topbar) — CHUNG cho cả 7 panel
- Cao `--h-topbar` (44px), nền `--bg-1`, viền dưới `--line-1`.
- Trái: **icon nhận diện panel** (icon đổi màu theo trạng thái kết nối Premiere —
  gộp luôn vai trò "đèn báo", đừng thêm chấm tròn riêng) + **tên panel** + version nhỏ.
- Phải: tối đa **1–2 nút hành động**. Nhãn nút là VIỆC nó làm.
- Trạng thái host ("đang chờ Premiere" / "không chạy trong Premiere") nói **ở một
  nơi**, ngắn, không lặp.

### Nút — HAI họ, không hơn
| Họ | Dáng | Khi nào |
|---|---|---|
| **Thường** `.btn` | nền `--bg-4`, viền `--line-2`, chữ `--text-1` | mọi việc |
| **Chính** `.btn--primary` | nền `--accent` đặc, chữ `--accent-on` | đúng MỘT cái/màn hình |

Việc **phá huỷ**: nút viền `--danger` (chữ màu danger), đặt **xa** nút hay bấm.
Ba luật tuyệt đối cho nút:
1. ☠️ **KHÔNG viết hoa** (`text-transform: none`).
2. ☠️ **KHÔNG `letter-spacing`.**
3. Chữ trên nút cam đặc là `--accent-on`.

> Nút to + IN HOA + giãn chữ đọc ra thành **biển hiệu**, không phải nút bấm. Giữ độ
> nổi bằng **màu** và **bề ngang**, không cần hét.

### Ô nhập / ô tìm
Nền `--bg-0` hoặc `--bg-4`, viền `--line-2`, cao `--h-ctrl`, bo `--r-sm`. Focus:
viền `--accent-line` + ring `--accent`. Placeholder màu `--text-3`.

### Segmented control (2–3 lựa chọn loại trừ)
- Dùng `grid-auto-flow: column; grid-auto-columns: 1fr` — **KHÔNG chôn số con vào
  CSS** (`repeat(3,1fr)` sẽ chừa trống khi chỉ có 2 nút).
- Mục đang chọn: nền `--bg-4` + chữ `--accent`; mục thường: chữ `--text-2`.
- Nếu hai lựa chọn khác nhau về HÌNH (vd bố cục kết quả), kèm **hình minh hoạ nhỏ**
  bên dưới kể sự khác biệt — tooltip chữ không đủ.

### Khối section
- Nền `--bg-3`, viền `--line-1`, bo `--r-lg`, padding `--sp-4`/`--sp-5`.
- **Tách section theo QUYẾT ĐỊNH của người dùng**, không theo thứ tự code.
- **Đừng xếp nhiều nhãn section chữ hoa xám tí xíu** chồng lên nhau — mỗi dải nhãn
  là một tầng chrome trước khi tới việc. Gộp hoặc bỏ bớt (xem file `01`).

### Empty state
- Icon mờ (`--icon-dim`) + một câu nói **phải làm gì tiếp** + đúng **một** CTA.
- Không để khối trống mênh mông — canh giữa theo chiều cao vùng nội dung.
- Câu chỉ dẫn phải **trỏ đúng nút đang có thật** trên màn hình (đừng bảo bấm nút
  không tồn tại).

### Chip / badge
- Có viền để tách khối (`border: 1px solid`); nền nhạt cùng tông rất dễ chìm —
  đo tương phản **viền với nền xung quanh** ≥ 3:1.

### Status / kết quả
- **Chỉ báo khi THẤT BẠI.** Việc thành công mà người dùng đã thấy thì im lặng.
- Nút xoá nói **hậu quả bằng số** ("Xoá 3 phụ đề") và **ẩn khi số = 0**.
- Bước chạy > ~30 giây phải có **con số nhúc nhích** (không để nhãn đứng im).

### Loading / tiến trình — ☠️ chỗ THẮNG đối thủ (AutoCut/AutoPod báo tiến trình rất tệ)
Đây là component quan trọng nhất mà bản đầu còn thiếu. Ba trạng thái rõ ràng:
- **Nút chính LÀ đèn báo:** đang chạy → nền chuyển trạng thái + khoá + đổi nhãn
  thành tiến trình ("Đang cắt… 42%"); xong → **đổi màu rõ** (dùng `--ok`) rồi mới
  về thường. Người dùng nhìn MÀU là biết, khỏi đọc số.
- **Bước > ~30 giây bắt buộc có số nhúc nhích** (%, "câu 42/2033", giai đoạn) — kiểm
  xem công cụ nền đã in tiến trình chưa trước khi tự viết bộ đếm.
- **Vùng dữ liệu đang xử lý:** làm mờ tại chỗ, **không chèn banner** đẩy layout.
  Khung xương phải cao đúng bằng hàng thật để lúc thay dữ liệu không nhảy.
- Mốc "xong" lấy **tín hiệu xong thật của tác vụ** (nút hiện lại), không đặt giờ chờ.

### Dropdown / select (4+ lựa chọn — segmented chỉ cho 2–3)
- Nút mở nền `--bg-4` viền `--line-2`, cao `--h-ctrl`; menu nổi `--bg-3` + `--shadow-md`,
  bo `--r-md`. Mục đang chọn có dấu tick + chữ `--accent`.
- ☠️ **Xổ chứa đúng MỘT mục là phản tác dụng** — làm mục phẳng bấm thẳng.

### Modal / dialog
- Lớp phủ `rgb(0 0 0 / 55%)`; thân `--bg-6` + `--shadow-pop`, bo `--r-lg`, `max-width` ~420px.
- **Bẫy phím Tab trong modal** (không tab ra ngoài); Esc đóng; focus vào nút an toàn.
- Nút xác nhận **phá huỷ** đặt xa nút Huỷ, dùng họ danger, nói hậu quả bằng số.

### Toast / thông báo
- Chỉ hiện khi **THẤT BẠI** (hoặc việc người dùng KHÔNG nhìn thấy kết quả). Góc dưới,
  `--bg-3` + viền ngữ nghĩa (`--danger`/`--ok`), tự tắt sau ~4s, có nút đóng.
- `aria-live="polite"` để máy đọc màn hình đọc.

### Tooltip
- Cho nút chỉ có icon (bắt buộc kèm `aria-label` + `title`). Nền `--bg-0` viền `--line-2`,
  `--fs-xs`, hiện sau ~400ms. **Không nhét thông tin bắt buộc chỉ vào tooltip.**

### Thanh cuộn (panel hay cuộn)
- Tuỳ biến tối: `width:10px`, tay cuộn `rgb(255 255 255 / 14%)` bo tròn, rãnh trong
  suốt. Đừng để thanh cuộn trắng mặc định của Windows phá nền tối.

---

## 6. Tương phản — đo, đừng đoán
- Chữ có nghĩa **≥ 4.5:1**; icon/ranh giới **≥ 3:1**.
- **Đo phải TRỘN ALPHA** với nền bên dưới (kể cả nền badge trên nền app).
- Kiểm **cả hai** khi có: một bên đạt bên kia trượt là chuyện thường.

---

## 7. Chuyển động
| Loại | Thời lượng | Ghi chú |
|---|---|---|
| Phản hồi bấm, đổi trạng thái | `--dur` = 150ms | `--ease: cubic-bezier(.32,.72,0,1)` |
| **Hình minh hoạ giải thích** | **1.000–2.500ms** | KHÔNG dùng `--dur` |

☠️ **Animation phải DIỄN GIẢI, không trang trí** — mỗi chuyển động trả lời "nó
đang kể điều gì". Tách pha khi có nhiều ý, chèn nhịp nghỉ, **kể xong thì dừng**
(`iterations:1`; cho nút "xem lại" thay vì lặp). Tôn trọng `prefers-reduced-motion`
nhưng phần tử phải hiện đủ ở trạng thái cuối.

---

## 8. Bố cục
- Vùng nội dung chính `max-width: 680px`, căn giữa (panel kéo tới hết màn hình,
  không giới hạn thì nút chính dài cả nghìn px).
- **Một màn hình một CTA chính**; việc phá huỷ đặt xa.
- **Sống được ở 300px** — kiểm ở bề rộng hẹp, không tràn ngang.
- Nhãn dài làm vỡ hàng thì cho thanh **xếp dọc** theo media query, **đừng cắt chữ**
  nếu chữ mang thông tin người dùng cần trước khi bấm.

---

## 9. Chữ trên giao diện
- **Nhãn nút = VIỆC nó làm**, không phải TÊN thứ nó tạo (giữ tên riêng panel là
  thương hiệu; nhãn hành động thì mô tả hành động).
- **Một thông điệp một nơi.** Không lặp.
- **Mỗi con số tự khai phạm vi** khi có số khác phạm vi nằm gần.
- **Không ai đọc chú thích dài** — chỉ giữ thứ KHÔNG suy ra được từ cái mắt đang thấy.
- Nhãn song ngữ (nếu có): chốt một format rồi áp mọi nơi — **tiếng Anh trước, một
  dòng, gạch chéo** (`English / Tiếng Việt`); chỉ áp cho NHÃN, không cho đoạn dài.
- ☠️ **Bản thương mại KHÔNG để lộ công cụ nền** (tên OSS, thông số nội bộ, đường
  dẫn, tên file kỹ thuật). Thay bằng **lợi ích người dùng**.

---

## 10. ☠️ KHÔNG ĐƯỢC LÀM (dán kèm mọi lần nhờ Claude design)

1. ❌ Nút IN HOA / có `letter-spacing` → đọc ra là biển hiệu.
2. ❌ Chữ trắng trên nút cam đặc → dùng `--accent-on`.
3. ❌ Nâng cả thang chữ để "cho to" → dùng bậc cao hơn ở đúng chỗ.
4. ❌ Dùng `opacity` để làm nhạt chữ → dùng cỡ + độ đậm.
5. ❌ Xám đặc làm viền → dùng hairline trắng mờ (`--line-*`).
6. ❌ `--danger` màu đỏ-cam → phải hồng-đỏ, tách khỏi accent.
7. ❌ Nhiều dải nhãn section chữ hoa xám chồng nhau → gộp/bỏ bớt.
8. ❌ Hero / gradient lớn / chữ to gây ấn tượng → đây là panel làm việc.
9. ❌ Nhiều hơn 1 CTA chính mỗi màn hình.
10. ❌ Bố cục chết ở 300px.
11. ❌ Chôn số lượng lựa chọn vào CSS (`repeat(N,1fr)`).
12. ❌ Vẽ vật thể Premiere sai màu/sai tầng.
13. ❌ Chỉ dẫn trỏ vào nút không tồn tại; nhãn mô tả logic đã đổi.
14. ❌ Báo cả việc thành công (chỉ báo khi thất bại).

---

## 11. Trạng thái tương tác — MỌI control phải đủ 5 trạng thái

Mỗi phần tử bấm được phải khai đủ: **thường · hover · nhấn (active) · focus · vô hiệu**
(và **đang chạy** nếu có tác vụ dài). Thiếu một cái là cảm giác "chưa xong".

| Trạng thái | Quy định |
|---|---|
| Hover | đổi nền một bậc (`--bg-4`→`--bg-5`), chuyển `--dur` 150ms; con trỏ `pointer` |
| Nhấn | lún nhẹ `scale(.97)` hoặc tối thêm một chút, **0ms** (phản hồi tức thì) |
| **Focus** | ☠️ **`:focus-visible` viền `--accent-line` + ring `0 0 0 3px var(--accent-soft)`** trên MỌI control (không chỉ ô nhập). **Không bao giờ `outline:none` mà không thay thế.** |
| Vô hiệu | `opacity:.45` + `cursor:not-allowed`; **ẩn hẳn** nếu thao tác không áp dụng được (hơn là bày rồi báo lỗi) |
| Đang chạy | xem §5 Loading — khoá + đổi nhãn + màu |

**Bàn phím:** mọi thứ có click phải Tab tới được + Enter/Space kích hoạt; thứ tự Tab
khớp thứ tự nhìn; nút lồng trong nút phải `stopPropagation`. Modal bẫy Tab, Esc đóng.

---

## 12. Icon — SVG, KHÔNG bao giờ emoji/ký tự

- ☠️ **Icon là SVG** (bộ **Lucide** hoặc Heroicons — nét mảnh, hợp dark tool), **không
  dùng emoji hay ký tự unicode** làm icon. *(style-guide.html đang để vài ký tự như
  placeholder — bản thật phải thay bằng SVG.)*
- Cỡ trong panel: **16px** (khớp `--fs`), nét (stroke) ~1.5px. Icon phi văn bản cần
  tương phản ≥ 3:1 với nền.
- ☠️ **Kiểm icon Ở ĐÚNG CỠ SẼ DÙNG** — bánh răng 8 nan vẽ 13–14px đọc ra thành mặt
  trời; cỡ nhỏ chọn hình ít chi tiết (sliders thay bánh răng).
- ☠️ **Không dùng cờ emoji** (Windows không có glyph quốc kỳ → hiện hai chữ cái). Cần
  cờ thì vẽ SVG, mọi cờ rộng bằng nhau.

---

## 13. Z-index — thang lớp, không đặt số bừa

Đặt tầng theo thang cố định để không loạn khi thêm modal/toast:
`--z-base:0` · `--z-dropdown:100` · `--z-sticky:200` · `--z-modal:300` ·
`--z-toast:400` · `--z-tooltip:500`. ☠️ **Đừng chồng quá hai tầng `sticky`.**

---

## 14. Website bán hàng — khác panel

Website (Next.js, có người dùng mobile) theo cùng bảng màu/chữ nhưng **thêm**:
- **Responsive breakpoints:** 375 · 768 · 1024 · 1440px. Không tràn ngang, không tắt zoom.
- **Touch target 44px** (mobile), cách nhau ≥8px.
- **Một ngôn ngữ chủ đạo** — không trộn Việt/Anh giữa trang (lỗi hiện tại). Nếu song
  ngữ thì theo khuôn nhất quán.
- Được phép có **hero/điểm nhấn** (khác panel) — nhưng vẫn là chỗ tiêu boldness DUY
  NHẤT; phần còn lại giữ kỷ luật.
- **Con số phải khớp thực tế sản phẩm** (đang ghi "8 tool" nhưng mới có 7 + mục
  feature chỉ kể 4 — phải thống nhất).

---

## 15. tokens.css — nguồn chân lý (copy nguyên nếu cần dựng thật)

Khi Claude design xuất HTML/CSS, biến phải map về đúng đây. Đừng chế biến mới màu
đã có tên.

```css
:root {
  /* Bề mặt */
  --bg-0:#0a0a0b; --bg-1:#0f0f11; --bg-2:#151517; --bg-3:#1c1c1f;
  --bg-4:#232327; --bg-5:#2c2c31; --bg-6:#161618;
  --bg-hover:rgb(255 255 255 /5%); --bg-active:rgb(255 255 255 /9%);
  /* Viền */
  --line-1:rgb(255 255 255 /6%); --line-2:rgb(255 255 255 /10%); --line-strong:rgb(255 255 255 /16%);
  /* Chữ */
  --text-1:#f5f5f7; --text-2:#c3c3c8; --text-3:#8d8d95; --text-meta:#9b9ba3; --icon-dim:#8f8f97;
  /* Accent cam */
  --accent:#ff5714; --accent-hover:#ff7038; --accent-soft:rgb(255 87 20 /16%);
  --accent-line:rgb(255 87 20 /40%); --accent-text:#ffb599; --accent-on:#150700;
  /* Ngữ nghĩa */
  --ok:#4ec98a; --warn:#e8c05a; --danger:#ff5f6d; --danger-strong:#ff4757; --heart:#ff6b81;
  /* Font + thang chữ */
  --font-ui:'SF Pro Text','SF Pro Display',-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;
  --font-display:'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
  --fs-2xs:10px; --fs-xs:11px; --fs-sm:12px; --fs-md:13px; --fs-lg:15px; --fs-xl:19px;
  --fw-normal:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700;
  --lh-tight:1.25; --lh:1.45; --ls-display:-0.014em;
  /* Khoảng cách / bo / bóng */
  --sp-1:4px; --sp-2:6px; --sp-3:8px; --sp-4:12px; --sp-5:16px; --sp-6:24px;
  --r-sm:6px; --r-md:8px; --r-lg:12px; --r-pill:999px;
  --shadow-sm:0 1px 2px rgb(0 0 0 /30%); --shadow-md:0 8px 24px rgb(0 0 0 /45%);
  --shadow-pop:0 18px 52px rgb(0 0 0 /62%);
  /* Chiều cao control */
  --h-ctrl-sm:24px; --h-ctrl:28px; --h-ctrl-lg:34px; --h-topbar:44px;
  /* Chuyển động */
  --dur:150ms; --ease:cubic-bezier(.32,.72,0,1);
  /* Vòng focus (dùng cho MỌI control) */
  --focus-ring:0 0 0 3px var(--accent-soft);
  /* Z-index — thang lớp */
  --z-base:0; --z-dropdown:100; --z-sticky:200; --z-modal:300; --z-toast:400; --z-tooltip:500;
}
```
