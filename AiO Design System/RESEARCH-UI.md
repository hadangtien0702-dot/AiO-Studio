# Research UI — tư liệu để thiết kế (đối thủ · tool pro dark · Adobe)

> Lập 2026-08-02 từ 3 nhánh nghiên cứu web (đã kiểm nguồn, dẫn link). Đây là
> phần "research UI để anh làm" — đọc để lấy hướng đúng ngành trước khi đưa
> Claude design. Không phải luật; luật nằm ở [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

---

## ☠️ QUYẾT ĐỊNH CẦN CHỐT TRƯỚC KHI THIẾT KẾ: CAM hay XANH?

Nghiên cứu Adobe lộ ra một mâu thuẫn nền tảng, anh cần chốt vì nó đổi cả hệ màu:

- **Hệ hiện tại (đang dùng):** nền đen sâu `#0a0a0b`, **accent CAM `#ff5714`** — một
  bản sắc riêng, giống cách AutoCut/AutoPod tự làm thương hiệu, khác Premiere.
- **Hướng "native" (Adobe Spectrum):** nền xám `#1D1D1D→#323232`, **accent XANH
  `#1379F3`** — panel trông như của chính Adobe. Frame.io (Adobe mua) đi hướng này
  và được coi là chuẩn mực "hoà vào Premiere".

| | Cam (bản sắc riêng) | Xanh (giống Adobe) |
|---|---|---|
| Cảm giác | Sản phẩm riêng, nổi bật, dễ nhớ | Như panel gốc của Premiere, đáng tin |
| Rủi ro | Trông "gắn thêm" nếu nền quá tối so với Premiere | Chìm, mất nhận diện thương hiệu |
| Đối thủ | AutoCut/AutoPod đều tự làm màu riêng (không mimic Adobe) | Frame.io mimic Adobe |
| Chi phí đổi | 0 — đang dùng cam khắp 7 panel + website | LỚN — đổi toàn bộ, kể cả website |

**Gợi ý của em:** **giữ CAM** (đang là bản sắc, website + 7 panel đã theo, đối thủ
cũng tự làm màu). Nhưng cân nhắc **kéo nền xám ấm lại gần Premiere hơn** một chút
(`#0a0a0b` đang tối hơn Premiere `#1D1D1D`, dễ đọc ra "panel lạ"). Đây là chốt của
anh — em chỉ nêu.

---

## Đối thủ trực tiếp

### AutoCut — gần mình nhất (1 panel, nhiều tính năng)
- **Bố cục "hub → màn hình chuyên biệt":** mở ra là **danh sách tính năng**, bấm vào
  một cái mới vào màn điều khiển riêng. Ở panel hẹp, cách này hơn hẳn thanh tab
  ngang. → Nếu sau này gộp 7 panel thành một bộ, đây là mẫu nên theo.
- **Mỗi màn = một cột dọc các nhóm control + MỘT nút chính ở đáy.**
- **Preset xếp TRÊN thông số thô** ("Calm…Jumpy" tự điền dB/thời lượng) — người mới
  không phải đụng số, người rành vẫn chỉnh được.
- **Ô số hiện GIÁ TRỊ ĐO THẬT làm mặc định** (vd noise floor `-39.11 dB`), không để trống.
- **☠️ Điểm mạnh nhất — xem trước cái BỊ MẤT:** vẽ đè lên waveform, **đỏ = sẽ cắt,
  xanh = giữ**. Đúng bài học "đo cả cái bị mất đi". Nên học, nhưng giữ CAM cho nút
  chính — dùng đỏ trầm cho vùng cắt.
- **Điểm yếu:** báo tiến trình sơ sài; khoá tính năng theo gói gây khó chịu (mình
  bán MỘT bộ MỘT giá nên không dính lỗi này).

### AutoPod — đối thủ của panel Podcast
- **Mỗi editor = form ngắn → MỘT nút verb** ("Create Multi-cam Edit", "Create Jump
  Cuts", "Create Clips"). Đúng "nhãn nút là việc nó làm".
- **Gán nhãn track làm mô hình nhập:** người dùng đặt tên `A1/V1…`, tool tự suy —
  gọn ở panel hẹp.
- **Lưu được cấu hình** ("Save layout") để tái dùng.
- **Kết quả đổ vào bin có tên riêng**, không đè sequence đang mở.
- **☠️ Điểm yếu lớn (cơ hội của mình):** báo tiến trình + trạng thái xong rất tệ —
  cả một "ngành" hỏi "nó chạy xong chưa / có bị gì không". **Làm rõ trạng thái
  đang-chạy / % / xong (đổi màu) + tóm tắt "đã làm gì" là chỗ thắng rõ nhất.**

### Descript / CapCut — tham khảo
- **Descript:** AI gom về MỘT chỗ (sidebar), sửa theo VĂN BẢN (list câu) — ở panel
  hẹp, **list chữ dễ đọc hơn mini-timeline**.
- **CapCut:** preview nhanh gần đúng, render nặng để dành lúc xuất — hợp "nhẹ để nhanh".

---

## Tool pro dark tốt nhất (Linear · Raycast · Framer)

Phát hiện xuyên suốt: **phân tầng bằng THANG NỀN gần-đen + viền hairline, KHÔNG
bằng bóng, KHÔNG bằng nhiều nhãn.** Đúng cái mình cần để chữa "quá nhiều dải".

1. **Thanh trên:** ~56px (panel hẹp lùi về 44–48px), **3 vùng** — nhận diện trái ·
   trạng thái giữa/ẩn · **đúng 1 nút chính phải**. Tách bằng viền 1px, không bóng.
2. **Empty state:** icon mờ + **một câu nói CỤ THỂ phải làm gì** + 1 CTA. Bỏ câu
   chung chung ("No data"). Canh giữa hơi lệch lên, để nền đen làm khoảng thở.
3. **Tách nhóm KHÔNG cần nhãn:** đặt nhóm control lên một **bậc nền sáng hơn** +
   viền hairline — cái khay đã nói "chúng thuộc về nhau". Chỉ dùng nhãn khi bề mặt
   và đường kẻ không nói được. (Adobe: chỉ hiện nhóm liên quan tới lựa chọn; giấu
   nâng cao sau nút "⋯".)
4. **Segmented:** mục chọn **nổi bằng nền lift**, không bằng màu — để dành accent
   cho focus. 2–3 lựa chọn thì segmented; 4+ hoặc nhãn dài thì đổi dropdown.
5. **Nút:** đúng **1 nút tương phản cao/màn**; phụ = **chip nền tối cùng cỡ**, KHÔNG
   dùng nút viền rỗng (ghost). Hai nút chỉ khác nhau ở nền, giống hệt về cao/bo.
6. **Nhịp:** lưới 4px, **hai cỡ gap** (trong nhóm ~24px, giữa section lớn hơn) — hai
   cỡ tạo nhịp, năm cỡ lung tung là "nhìn lộn xộn / chưa đồng bộ".

> ☠️ Nhắc lại từ brain: **token khớp ≠ nhìn giống nhau.** Mấy con số trên cho *giá
> trị*; kiểm *nhịp và cân đối* bằng mắt trên `so-sanh.html`, đừng chỉ tin script.

---

## Adobe Premiere — để panel trông "native"

**Bản chất:** panel của mình thuộc nhóm **tiện ích cạnh timeline** (như FILM IMPACT,
Frame.io) — nên **mimic Adobe, đừng làm màu to**; để bản sắc ở một logo nhỏ trên
thanh, còn chrome thì theo Adobe.

### Màu nền Premiere (Spectrum "dark" = mặc định)
| Vai trò | Hex | Ghi chú |
|---|---|---|
| Nền sâu nhất | `#1D1D1D` | timeline area |
| Nền thân panel | `#262626` | |
| Thẻ / ô nhập | `#323232` | |
| Hover | `#3F3F3F` | |
| Viền | `#545454` | |
| Chữ body | `#D1D1D1` | |
| Chữ nhấn | `#EBEBEB` | |
| Accent XANH (nút chính) | `#1379F3` | |
| Vòng focus | `#348FF4` | 2px |

> Nền Premiere **sáng hơn** hệ hiện tại của mình. Panel tối hơn Premiere sẽ hơi
> "float". Cân nhắc khi chốt câu hỏi cam/xanh ở trên.

### Màu vật thể timeline (vẽ mini-timeline thì LẤY ĐÚNG — bảng Classic)
| Vật thể | Hex |
|---|---|
| Clip video (iris, A/V mặc định) | `#729ACC` |
| Clip video-only | `#970097` (tím) |
| Clip audio / waveform | `#1D7021` (xanh lá) |
| Clip chọn | viền **trắng** `#FFFFFF` (không đổi nền) |
| Playhead | xanh nhạt ~`#2D8CEB` (ước lượng — nên sample lại từ ảnh thật) |

> ⚠️ **Caption:** brain (MASTER.md lỗi #7) ghi anh Tiến quan sát caption **VÀNG và
> nằm TRÊN** timeline; nghiên cứu Adobe nói caption **thừa hưởng màu label** (không
> vàng cố định). Hai nguồn lệch — **lấy quan sát thật của anh trên máy anh làm
> chuẩn**, và nên sample pixel một lần cho chắc. Bảng label mặc định bản mới
> (v24.4+) đã đổi, chỉ bảng **Classic** ở trên là chắc chắn.

### Ràng buộc CEP ảnh hưởng bố cục
- **Bề rộng tối thiểu ~132px** (sàn cứng). Panel dock KHÔNG giữ min/max — **phải
  co giãn hoàn toàn**. Thiết kế cho bề rộng thật ~**200–260px**, sống được tới 132px.
  (Hệ hiện tại ghi 300px — nên hạ kỳ vọng xuống ~200px để chắc.)
- **Chiều cao control:** Premiere đặc hơn web — control gốc ~**24px**. Hệ mình để
  mặc định 28px; nếu muốn khít Premiere hơn thì cân nhắc 24px cho control phụ.
- **Theo theme host:** đọc `appSkinInfo` để chọn thang nền, nhưng nó **báo sai** —
  chỉ dùng để chọn tối/sáng, neo màu thật vào token, đừng tin hex nó trả.
- ⚠️ **CEP đang bị Adobe khai tử dần**, tương lai là **UXP** (Premiere 2026 đã đưa
  UXP thành chuẩn). Chưa có hạn cuối, còn "vài năm". Đây là chuyện của builder, nhưng
  nếu port sang UXP thì mimic Spectrum sẵn sẽ đỡ hơn — thêm một lý do cân nhắc câu
  hỏi cam/xanh.

---

## Nguồn
Đối thủ: autocut.com/pricing · cined.com · autopodcastai.com · autopod.fm/pricing ·
cutback.video. Tool dark: VoltAgent/awesome-design-md (Linear/Raycast/Framer
DESIGN.md — token chính xác) · muz.li dark-mode guide · Larry Jordan (Premiere
Properties) · Browser Company (Dia). Adobe: spectrum.adobe.com color archive ·
@spectrum-web-components theme tokens · Premiere community (label colors, 132px min,
appSkinInfo) · help.frame.io · hyperbrew.co (UXP 2026).
