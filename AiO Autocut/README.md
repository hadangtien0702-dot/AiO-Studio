# AiO Studio — Autocut

Tự dò **khoảng lặng** trong tiếng nói rồi **cắt bỏ và dồn lại** — cho nội dung
talking-head, UGC, review sản phẩm. Panel CEP chạy bên trong Adobe Premiere Pro.

| | |
|---|---|
| **Trạng thái** | ✅ **0.5.0 — CHẠY ĐƯỢC.** Đo thật trên Premiere Beta 26.5 ngày 2026-07-28 |
| **Ngày** | Bắt đầu 2026-07-27 |
| **Chạy trên** | Windows · Premiere Pro Beta 26.5 (CEP 12) |
| **Kế tiếp** | Hoàn thiện autocut · *(multicam podcast — để sau)* |

**Số đo thật** — clip talking-head 81,77 giây, 25 fps, mức "Vừa":

| | |
|---|---|
| Nhát cắt | **15** · rút **8,8 giây** (1:21,7 → 1:13,0) |
| **Giữ lại chỗ ngắt hơi giữa câu** | **17 chỗ** — chỉ đo biên độ thì đã cắt mất |
| **Nhát cắt đâm vào câu nói** | **0** |
| Hình / tiếng | 15 đoạn / 15 đoạn — khớp nhau đến 1/100 giây |
| Khe hở giữa các clip | **0,0000 giây** |
| Phụ đề tiếng Việt | 15 câu, gắn thẳng lên timeline |
| Tổng thời gian | **16,5 giây** |

**Tài liệu** *(đọc theo thứ tự)*
1. **[CLAUDE.md](CLAUDE.md)** — đọc trước tiên: dự án là gì, đang ở đâu, luật riêng
2. [PLAN.md](PLAN.md) — mục tiêu, quyết định đã chốt, rủi ro, đường đi kỹ thuật
3. [PROGRESS.md](PROGRESS.md) — nhật ký từng bản, kèm **số đo thật**

---

## Luồng dùng

> 1. Khoanh đoạn cần cắt trên timeline bằng phím **I** và **O**
> 2. Bấm **một nút AUTO CUT**
> 3. Xong — ra một **sequence mới**, sequence gốc giữ nguyên

Không có bước xác nhận, cũng không có màn hình cấu hình. Được phép bỏ bước xác
nhận vì kết quả ra sequence **mới**: bấm nhầm không mất gì.

**Ba mức mạnh tay** — con số đo trên clip 81,77 giây:

| Mức | Chừa quanh mỗi câu | Bỏ được | Đâm vào câu nói |
|---|---|---|---|
| Giữ nhịp | 0,15s | 6,7s | **0** |
| **Vừa** *(mặc định)* | 0,08s | **8,8s** | **0** |
| Cắt sạch | 0,04s (1 khung) | 10,0s | **0** |

---

## Cách nó quyết định "cắt ở đâu"

**Một nguồn dữ liệu là không đủ.** Máy đo biên độ chỉ trả lời được *"to hay nhỏ"*.
Nó không phân biệt được hai thứ khác hẳn nhau:

- người nói **xong một câu**, im lặng chờ câu sau → **nên cắt**
- người nói **đang nói dở**, ngắt hơi lấy giọng → **không được đụng**

Đo thật trên clip talking-head: trong 32 khoảng "im lặng" tìm được thì **23 chỗ
đâm vào giữa câu nói**. Cắt hết là câu bị xén vụn, nghe giật.

Nên luật cắt là **giao của hai điều kiện**:

```
cắt  ⟺  biên độ thấp (FFmpeg)  VÀ  không nằm trong câu nào (Whisper)
```

An toàn cả hai chiều:
- Whisper **nghe sót** một câu → chỗ đó biên độ vẫn cao → FFmpeg không báo lặng →
  không cắt. **Không bao giờ mất tiếng.**
- Whisper **nghe nhầm** ra câu ở chỗ im lặng → chỗ đó được bảo vệ → không cắt.
  Cùng lắm là cắt ít đi, không bao giờ cắt lố.

```
FFmpeg silencedetect trên FILE GỐC  ->  các khoảng biên độ thấp
Whisper nghe hiểu tiếng Việt        ->  từng câu bắt đầu / kết thúc ở đâu
TRỪ vùng nói ra khỏi khoảng lặng    ->  bỏ hết chỗ ngắt hơi giữa câu
bỏ khoảng còn lại quá ngắn          ->  không bõ một nhát cắt
phần bù = các đoạn CẦN GIỮ          ->  làm tròn theo fps của FILE GỐC
```

Whisper chạy **một lần** phục vụ cả hai việc: quyết định cắt ở đâu, và làm phụ đề.

Khi dựng, mốc đặt clip kế tiếp **đọc lại từ clip vừa đặt**, không cộng dồn con số
tự tính — Premiere làm tròn vị trí về lưới khung hình, cộng dồn 32 đoạn là đủ hở
một khung.

Kiểm phần này bằng số, không cần mở Premiere:

```bash
cd client && npm run kiem
```

---

## Giai đoạn 1 đã xong — đo được gì

Chạy thật trên Premiere Beta 26.5, sequence 30 fps, clip 81,73 giây:

| Việc | Kết quả | Bằng chứng |
|---|---|---|
| Nạp QE DOM | ✅ | có đủ `razor` · `getVideoTrackAt` · `remove` |
| Đọc in/out của sequence | ✅ | đọc đúng `10.00 → 20.03` |
| **Cắt (razor)** | ✅ | 1 clip → 4 clip, ranh giới đúng 10 và 20.03 |
| Định dạng razor nhận | **chuỗi timecode** | `"00:00:10:00"` ăn · số giây / số khung **không** ăn |
| Razor tác động tới đâu | **cả V1 lẫn A1 cùng lúc** | khỏi phải cắt hai lần |
| Xoá đoạn | ✅ | đoạn 10→20.03 biến mất |
| **Dồn (ripple)** | ❌ | để lại `Empty 10 → 20.03`, phần sau đứng yên |
| Dò tham số `remove()` | ☠️ **làm sập Premiere** | xem `PROGRESS.md` bản 0.1.5 |

### Kiến trúc đã chốt

**Bỏ** hướng "cắt → xoá → dồn". **Dùng** hướng **DỰNG LẠI**: tính các đoạn *cần
giữ* rồi đặt liền nhau bằng `overwriteClip` — API chính thức, không đụng QE,
không bao giờ để lại lỗ, và làm trên **sequence mới** nên bản gốc còn nguyên.

Giữ lại từ giai đoạn 1: cách đọc in/out · cách đọc danh sách item trên track (để
kiểm chứng kết quả) · cách quy đổi giây → timecode.

---

## Ba bài học đắt nhất

**1. ☠️ Đừng dò tham số API nội bộ trên máy đang mở dự án thật.**
Hàm bắn thử 3 tổ hợp `remove()` liên tiếp — trong đó có gọi không tham số — làm
**Premiere tắt ngang**. QE DOM không kiểm tra đầu vào, nó gọi thẳng xuống lớp dưới.
Nếu buộc phải dò: mỗi lần **đúng một cách**, trên **project rác**.
Bản tự lưu nằm ở `<thư mục dự án>\Adobe Premiere Pro Auto-Save\`.

**2. Ba lần liên tiếp kết luận sai vì PHÉP ĐO sai, không phải Premiere sai.**
- Cắt tại playhead — mà playhead đang ở giây 0, chân clip, không có gì để tách
- Báo "cắt được" trong khi ranh giới đó **đã có sẵn** từ trước
- Chỉ nhìn V1 — mà clip nằm ở A1, nên báo "không có clip" giữa timeline đầy clip

→ Số đo vô lý thì **nghi công cụ đo trước**, đừng vội sửa thứ đang chạy đúng.

**3. Vá file bằng thay-thế-chuỗi thì phải đọc lại file.**
Phần thêm vào ăn, phần khai báo trượt, lệnh **không báo lỗi** → panel chết với
`tenTrack is undefined`. "Lệnh chạy xong không báo lỗi" không phải là đã kiểm.

---

## Chạy thử

**Cài:** giải nén `build\AiO-Studio-Autocut-<phiên bản>-SETUP.zip` → đóng Premiere
→ bấm đúp `CAI-DAT.bat` → mở Premiere → *Window → Extensions → AiO Studio - Autocut*

**Sửa code rồi cài lại:**

```bash
cd client && npm run build
```
```bash
powershell -ExecutionPolicy Bypass -File scripts\sign-install.ps1
```

**Đóng gói:**

```bash
powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
```

> Sửa `CSXS/manifest.xml` thì **phải tắt hẳn Premiere rồi mở lại**.
> Cổng debug là **8089** (AiO Editing dùng 8088 — hai panel không được trùng).

---

## Cấu trúc

```
AiO Autocut/
├─ CLAUDE.md · PLAN.md · PROGRESS.md · README.md   ← tài liệu
├─ CSXS/manifest.xml         # khai báo extension (id com.aiostudio.autocut)
├─ host/
│   ├─ index.jsx             # router ExtendScript
│   └─ autocut.jsx           # đọc clip đang chọn · dựng sequence mới · (+ bộ thăm dò cũ)
├─ client/src/services/
│   ├─ silencelog.ts         # đọc log silencedetect      ┐ THUẦN — kiểm được
│   ├─ plan.ts               # khoảng lặng → đoạn cần giữ ┘ ngoài Premiere
│   └─ ffmpeg.ts             # gọi ffmpeg.exe ở ưu tiên IDLE
├─ tests/kiem-tinh-toan.mjs  # 20 phép kiểm, chạy bằng `npm run kiem`
├─ bin/win64/                # ffmpeg.exe + ffprobe.exe (đóng gói sẵn, ~145 MB)
├─ scripts/
│   ├─ sign-install.ps1      # build → ký → cài (dùng chung chứng chỉ AiO Editing)
│   └─ package-release.ps1   # đóng gói 1 file SETUP.zip có bộ cài bấm đúp
└─ build/release/            # gói đã ký
```

**Vì sao bundle sẵn FFmpeg 145 MB:** dự án anh em **AiO Sub** nằm im từ 2026-05-06
đúng vì bắt người dùng tự cài ffmpeg/whisper. Tốn đĩa còn hơn tốn 3 tháng.

---

## Liên quan

- **AiO Editing** (`../AiO Editing`) — panel quản lý asset, đã phát hành 1.1.0.
  Autocut kế thừa cách làm: bundle FFmpeg, bộ ký, bộ cài chép-đè-từng-file.
- **AiO Sub** (`../Autosub`) — làm phụ đề, đang dừng. Sẽ quay lại sau khi Autocut
  chạy: Whisper cho ra mốc thời gian **theo từng từ**, dùng được cho **cả hai**
  (phụ đề tiếng Việt + cắt theo câu nói thay vì chỉ dò biên độ).
- Kinh nghiệm CEP chung: skill `~/.claude/skills/adobe-cep-panel/`
