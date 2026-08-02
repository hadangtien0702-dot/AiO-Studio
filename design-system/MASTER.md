# AiO Studio — Hệ thiết kế dùng chung cho cả 4 panel

> **Nguồn chân lý cho MÁY:** [`tokens.css`](tokens.css) — sửa ở đó rồi chạy
> `dong-bo-tokens.ps1`. **Đừng sửa bản copy trong từng dự án.**
>
> Lập 2026-07-29 sau khi anh Tiến nói: *"anh thấy cả 4 phần UI chưa đồng bộ đó
> em. Em nên đưa ra một UI Design System cho thống nhất về font chữ, kích thước
> button… Anh thấy **mỗi lần em thiết kế lại lặp lại các lỗi từ hồi xưa đến giờ**."*

---

## ☠️ Vì sao lỗi cứ lặp lại — và cách chặn

Nguyên nhân **không phải** thiếu tài liệu. Sổ bài học thiết kế đã ghi từ lâu:

> *Quy tắc 21: Không bao giờ để hai file CSS chép tay lẫn nhau. Cùng một bug sẽ
> phải sửa nhiều lần và chắc chắn có lần quên.*

Vẫn vấp, vì lời dặn nằm trong **tài liệu** chứ không nằm trong **cơ chế**. Bốn
panel có bốn khối token chép tay của nhau; mỗi lần sửa một chỗ là ba chỗ kia
lệch đi trong im lặng.

**Ba lớp chặn, xếp theo mức tin cậy:**

| Lớp | Là gì | Bảo đảm được điều gì |
|---|---|---|
| `tokens.css` | Một file token duy nhất | Không còn chỗ để chép tay sai |
| `dong-bo-tokens.ps1` | Script chép sang 4 panel | Bốn **file** giống nhau từng byte |
| `kiem-dong-bo.ps1` | Đo thật trên 4 panel đang chạy | Bốn **panel** thật sự hiện giống nhau |

Lớp 3 là lớp duy nhất bắt được kiểu lỗi *"file token đúng nhưng CSS riêng ghi đè
bằng số cứng"* — đúng cái đã xảy ra với `height: 44px` của thanh trên.

```bash
# Sửa token xong:
powershell -File "design-system/dong-bo-tokens.ps1"

# Trước khi báo xong (cần 4 panel đang mở trong Premiere):
powershell -File "design-system/kiem-dong-bo.ps1"
```

---

## Hướng thiết kế: "Studio Console"

Panel sống **cạnh timeline Premiere**, không phải một trang web độc lập. Nên:

- **Tối, gọn, nội dung là chính.** Không tranh sáng với giao diện Premiere.
- **Viền hairline** (`rgb(255 255 255 / 6-16%)`), không dùng xám đặc.
- **Accent cam dùng rất tiết chế** — chỉ cho: mục đang chọn, CTA chính, vòng focus.
- Người dùng là **editor đang làm việc**, không phải khách ghé thăm. Không có
  chỗ cho hero, gradient, hay chữ to gây ấn tượng.

---

## Thang chữ — MỘT thang, sáu bậc

| Token | Cỡ | Dùng cho |
|---|---|---|
| `--fs-2xs` | 10px | số đếm, nhãn nhóm |
| `--fs-xs` | 11px | meta, chỉ dẫn, nhãn phụ |
| `--fs-sm` | 12px | nhãn, chip, control phụ |
| `--fs-md` | **13px** | mặc định · body · **chữ trên nút** |
| `--fs-lg` | 15px | tiêu đề mục |
| `--fs-xl` | 19px | số lớn trong ô kết quả, empty-state |

☠️ **Đừng nâng cả thang.** Vấp thật 29/07: anh Tiến bảo *"tăng font lên **giống
như** Asset Manager"*, bản sửa nâng cả thang `+2px` nên **vượt** Asset Manager
một bậc. Hai panel cạnh nhau trong cùng cửa sổ lộ ra ngay — *"phần ui này cũng
thấy gớm luôn"*.

→ **"Giống như X" nghĩa là BẰNG X.** Mở X ra đo lấy số, đừng dịch câu nói thành
một phép biến đổi. Muốn chữ to hơn ở một chỗ thì dùng **bậc cao hơn** ở chỗ đó.

---

## Chiều cao control — BA bậc, chọn theo VAI TRÒ

| Token | Cao | Vai trò |
|---|---|---|
| `--h-ctrl-sm` | 24px | nút phụ trên thanh công cụ, chip |
| `--h-ctrl` | 28px | nút thường, ô nhập, mục menu — **mặc định** |
| `--h-ctrl-lg` | 34px | **CTA chính** — mỗi màn hình chỉ MỘT |

☠️ **Dùng đúng token nhưng sai VAI TRÒ vẫn ra kết quả sai.** Vấp 29/07: đem
`--h-ctrl-sm` (24px) áp cho thanh chọn vốn là một trong hai quyết định chính của
màn hình → *"nút này hơi nhỏ làm lại"*.

Trước khi chọn bậc, hỏi: **phần tử này đóng vai gì trong màn hình?**

**Phép kiểm bắt buộc:** `chiều cao − line-height ≥ 6px`. Cỡ chữ và chiều cao là
một cặp — đổi một cái mà quên cái kia thì hoặc chật cứng, hoặc rỗng hoác.

---

## Nút — hai họ, không hơn

| Họ | Dáng | Khi nào |
|---|---|---|
| **Thường** (`.btn`) | nền `--bg-4`, viền `--line-2` | mọi việc |
| **Chính** (`.btn--primary`) | nền `--accent` đặc, chữ `--accent-on` | đúng MỘT cái mỗi màn hình |

**Ba luật tuyệt đối:**

1. ☠️ **Không viết hoa.** Đo 29/07: cả 4 nút của Asset Manager đều
   `text-transform: none`. Nút "LÀM PHỤ ĐỀ" in hoa + giãn chữ đọc ra như **biển
   hiệu**, không phải nút bấm.
2. ☠️ **Không `letter-spacing`.** Cùng lý do.
3. **Chữ trên nút cam đặc phải là `--accent-on`** (nâu gần đen). Chữ trắng chỉ
   đạt 3.3:1 trên nền cam — trượt AA.

Bộ kiểm `kiem-dong-bo.ps1` đếm hai luật đầu trên panel thật.

---

## Màu — ngữ nghĩa, không phải sở thích

| Token | Màu | Nghĩa |
|---|---|---|
| `--accent` | `#ff5714` cam | đang chọn · CTA · focus |
| `--ok` | `#4ec98a` xanh lá | xong, đạt |
| `--warn` | `#e8c05a` vàng | **còn việc phải làm** (không phải hỏng) |
| `--danger` | `#ff5f6d` hồng-đỏ | hỏng · phá huỷ · chỗ cần soát |

☠️ `--danger` cố ý là **hồng-đỏ**, tách khỏi cam. Dùng đỏ-cam thì hai thứ khác
nghĩa hoàn toàn lại nhìn giống nhau dưới ánh đèn phòng dựng.

**Khi vẽ lại thứ có thật trong Premiere thì lấy màu CỦA PREMIERE.** Vấp 29/07:
vẽ dải phụ đề màu tím vì "tách hẳn khỏi xanh và đỏ, ba tầng ba sắc" — nghe rất
hợp lý, nhưng caption track của Premiere **màu vàng** và nằm **trên** timeline.
Anh Tiến bắt ngay. Hình minh hoạ sai màu / sai tầng thì người dựng phải dịch
trong đầu — đúng cái việc nó sinh ra để tránh.

---

## Tương phản — đo, đừng đoán

- Chữ có nghĩa: **≥ 4.5:1**. Icon/ranh giới: ≥ 3:1.
- ☠️ **Đo phải TRỘN ALPHA** với nền bên dưới. Vấp 29/07: dòng ghi chú
  `opacity: 0.75` — không trộn alpha ra **5,54** (tưởng đạt), trộn alpha ra
  **3,66** (trượt).
- ☠️ **`opacity` không phải cách làm nhạt chữ** — nó kéo màu chữ về phía nền.
  Muốn phân cấp thì dùng **cỡ chữ** và **độ đậm**.

---

## Chuyển động

| Loại | Thời lượng | Ghi chú |
|---|---|---|
| Phản hồi bấm, đổi trạng thái | `--dur` = 150ms | `--ease` |
| **Hình minh hoạ giải thích** | **1.000–2.500ms** | KHÔNG dùng `--dur` |

☠️ **Animation phải DIỄN GIẢI, không được trang trí.** Anh Tiến chốt: *"điều
quan trọng là em phải có animation diễn giải cho từng phần"*. Mỗi chuyển động
phải trả lời được **nó đang kể điều gì**; không kể gì thì bỏ.

Ba luật rút từ hai lần làm hình minh hoạ:

1. **Tách PHA khi có nhiều ý** — và chèn **nhịp nghỉ** giữa các pha. Làm liền
   một mạch thì mắt không tách được các ý. Đây là thứ đắt nhất.
2. **Được phép chậm.** Người ta đang *ngắm để hiểu*, không đợi máy trả lời.
3. **Mốc thời gian TÍNH theo dữ liệu**, đừng để cứng — thêm một phần tử vào là
   mọi mốc tự dời theo.
4. **Kể xong thì dừng** (`iterations: 1`). Lặp mãi thành đèn nhấp nháy kéo mắt
   người dựng trong lúc họ đang làm việc. Cho một đường **xem lại** thay vì lặp.

Tôn trọng `prefers-reduced-motion` — nhưng tắt chuyển động thì phần tử phải hiện
đủ ở trạng thái cuối, không được kẹt ở trạng thái đầu.

---

## Bố cục

- **`.than` giới hạn `max-width: 680px`**, căn giữa. Panel CEP kéo được tới hết
  màn hình; không giới hạn thì nút chính dài cả 1500px.
- **Tách section theo QUYẾT ĐỊNH**, không theo thứ tự code. Anh Tiến 29/07 chỉ
  vào Asset Manager: *"em thấy phần Asset Manager nó có 2 phần không em, anh cũng
  muốn tách ra như vậy"*.
- **Một màn hình một CTA chính.** Việc phá huỷ đặt xa nút hay bấm.
- Panel dock hẹp tới ~300px — mọi bố cục phải sống được ở đó.

---

## Chữ trên giao diện

- **Nhãn nút là VIỆC nó làm**, không phải TÊN thứ nó tạo ra.
- **Chỉ báo khi THẤT BẠI.** Việc thành công mà người dùng đã nhìn thấy thì im lặng.
- **Một thông điệp chỉ nói ở MỘT nơi.**
- **Mỗi con số phải tự khai phạm vi của nó** khi có hai con số khác phạm vi nằm
  gần nhau. Phần mềm chạy đúng mà nói mơ hồ thì bị nghi là chạy sai.
- ☠️ **Lời người dùng GIẢI THÍCH ≠ lời đem lên giao diện.** Lấy **thuật ngữ
  nghề** họ dùng, còn câu chữ thì viết lại: một khuôn, ngắn, song song nhau.

---

---

## ☠️☠️ MƯỜI LỖI ĐÃ VẤP — ĐỌC TRƯỚC KHI ĐỘNG VÀO UI

Chủ dự án 29/07: *"anh thấy mỗi lần em thiết kế lại lặp lại các lỗi từ hồi xưa
đến giờ"*. Đây là danh sách đó, viết ra để lần sau không phải trả giá lần nữa.
**Đọc mục này TRƯỚC khi sửa, không phải sau khi bị chỉ ra.**

### 1. "Giống như X" nghĩa là **BẰNG** X — đi đo X

Nghe *"tăng font lên giống như Asset Manager"* rồi nâng cả thang `+2px` → vượt
Asset Manager một bậc. Hai panel cạnh nhau lộ ra ngay.
→ **Mở X ra đo lấy con số.** Đừng dịch câu nói thành một phép biến đổi.

### 2. Token khớp ≠ nhìn giống nhau — phải có **bàn so sánh**

Script báo *"16/16 token giống nhau ở cả 4 panel"*, đo DOM từng cái cũng khớp.
Xếp 4 panel cạnh nhau thì chủ dự án chỉ ra **4 lỗi trong 10 phút**.
→ Máy đo *giá trị*; mắt đo *cân đối, nhịp, nhất quán*. Chạy `so-sanh.html`
**trước**, script **sau**.

### 3. Đừng chôn số lượng con vào CSS

`repeat(3, 1fr)` cho ba mức cắt → thanh hai nút chừa trống 1/3. Lần đầu chữa
bằng cách đẻ thêm `.seg--nho` — **đó là vá, không phải sửa**, nên hôm sau lộ lại
ở panel khác.
→ `grid-auto-flow: column` + `grid-auto-columns: 1fr`. **Thêm một lớp biến thể
để vá là dấu hiệu đang sửa sai chỗ.**

### 4. Dùng đúng token nhưng **sai vai trò** vẫn ra kết quả sai

Đem `--h-ctrl-sm` (24px, cỡ nút phụ trên thanh công cụ) áp cho thanh chọn vốn là
một trong hai quyết định chính → *"nút này hơi nhỏ làm lại"*.
→ Hỏi trước: **phần tử này đóng vai gì trong màn hình?** rồi mới chọn bậc.

### 5. Nút chính "to + IN HOA + giãn chữ" đọc ra là **biển hiệu**

Mảng cam 610×46px chữ 17px in hoa. Đếm nút của panel anh em: **4/4 đều
`text-transform: none`** — quy ước đã nằm sẵn trong code.
→ Giữ độ nổi bằng **màu** và **bề ngang**. Không cần hét lên mới thấy.

### 6. Nhãn nút nói **VIỆC** nó làm, không nói **TÊN** sản phẩm

Panel tên "Autocut" nên nút cũng đề "Auto Cut" — vừa lạc lõng giữa toàn nhãn
tiếng Việt, vừa không nói được nó sắp làm gì. → **"Cắt khoảng lặng"**.
Tên riêng panel thì giữ (thương hiệu), khác với nhãn hành động.

### 7. Vẽ lại thứ có thật trong Premiere thì **lấy màu của Premiere**

Vẽ caption track màu **tím** nằm **dưới** timeline vì "tách hẳn khỏi xanh và đỏ,
ba tầng ba sắc" — nghe rất hợp lý, nhưng caption của Premiere **màu vàng** và
nằm **trên**. Hình sai màu/sai tầng thì người dựng phải dịch trong đầu — đúng
cái việc nó sinh ra để tránh.

### 8. Lựa chọn tốn thời gian để thử thì phải trả lời "**khác gì**" ngay tại chỗ

Thanh chọn mô hình chỉ tô sáng nút. Muốn biết "Nhanh" khác "Phụ đề câu dài" ở
đâu thì phải chạy cả hai, mỗi lần mấy phút.
→ Hình động nhỏ ngay dưới thanh, kể bằng **số đo thật đã có**. Khác biệt về
HÌNH thì phải kể bằng hình — tooltip chữ không đủ.

### 9. Một phần tử làm được hai việc thì đừng bày hai

Thanh trên có chấm tròn báo trạng thái, lại thiếu icon nhận diện. Gộp: **icon
đổi màu theo trạng thái**. Bớt một phần tử trên thanh vốn đã chật.

### 10. Bốn cái bẫy của **công cụ đo** — trong một phiên báo sai 4 lần

Mỗi lần đều suýt làm sửa hỏng đoạn code vốn đang đúng:

| Triệu chứng | Sự thật |
|---|---|
| Độ dài animation ra **số âm** | `activeDuration` **không** chứa delay |
| `playState` vẫn `"running"` sau 3 giây | Pane ẩn → trình duyệt **dừng đồng hồ**; hỏi `iterations` mới đúng |
| Quét tràn ngang bắt được phần tử | Nó nằm trong `clipPath` — cố ý bị cắt |
| Layout "chồng 1px" | Animation đang kẹt ở khung đầu → phải `getAnimations().forEach(a => a.finish())` **trước khi đo** |

→ **Số đo vô lý thì nghi công cụ đo trước.** Và chọn chỉ số **không phụ thuộc
môi trường hiển thị** (`iterations` thay vì `playState`).

### Bẫy JSX hay chết nhất

Chú thích `{/* */}` đứng cạnh element **trong nhánh ternary** = hai biểu thức
trong một nhánh → **vỡ build**. Và `//` càng tệ: trong JSX nó là **text hiện ra
màn hình**. Chỗ để giải thích một quyết định về dáng là **CSS**, không phải JSX.

---

## Trước khi báo xong — bốn phép kiểm

1. `powershell -File design-system/kiem-dong-bo.ps1` → **DAT**
2. Đo tương phản **có trộn alpha** trên panel thật, cả chữ chính lẫn chữ phụ
3. Đo ở panel hẹp **300px** — không tràn ngang
4. `chiều cao control − line-height ≥ 6px` cho mọi nút vừa đụng

☠️ **Build sạch KHÔNG tính là đã kiểm.**

Và khi số đo vô lý: **nghi công cụ đo trước**. Trong một phiên ngày 29/07, công
cụ đo báo sai **bốn lần** và mỗi lần đều suýt làm sửa hỏng đoạn code vốn đang
đúng — `activeDuration` không chứa delay; `playState` vẫn "running" khi pane ẩn;
quét tràn bắt nhầm phần tử trong `clipPath`; đo layout của thứ có animation mà
quên ép về trạng thái cuối.
