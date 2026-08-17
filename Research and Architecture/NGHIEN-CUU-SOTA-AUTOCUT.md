# Báo Cáo Nghiên Cứu & Kiến Trúc Tối Ưu Hóa AiO Autocut (SOTA 2026)

> **Tài liệu chuyển giao kỹ thuật** dành cho anh Tiến và **Claude Code**.
> Tổng hợp nghiên cứu công nghệ Voice Activity Detection (VAD) mới nhất thế giới, chiến lược đánh bại đối thủ quốc tế và kế hoạch triển khai chi tiết.

---

## 1. TỔNG QUAN ĐỐI SÁCH VỚI CÁC ĐỐI THỦ LỚN

| Tiêu chí | **AutoPod (JumpCut)** | **TimeBolt / Recut** | **AiO Autocut (Mục tiêu)** |
|---|---|---|---|
| **Vị trí làm việc** | Native Premiere Panel | App ngoài (Standalone) | **Native Premiere Panel** |
| **Quy trình** | Cắt trực tiếp | Qua XML trung gian | **Cắt trực tiếp 1-Click trên Timeline** |
| **Giá cả** | $29/tháng (Khoá máy) | $17/tháng hoặc $97/năm | **All-in-One Suite / Lifetime** |
| **Tốc độ (Video 1h)** | ~1–2 phút | ~30 giây (trong app) | **< 3–5 giây (với Silero VAD)** |
| **Độ chính xác** | Dễ mất âm đuôi khi nói thầm | Cắt theo dB thô | **Giao hai nguồn: VAD 30ms + Whisper** |
| **Bảo tồn hơi thở** | Cố định | Kéo tay phức tạp | **3 Preset chuẩn: 87%, 74%, 57%** |
| **Bộ đệm dùng chung** | Không có | Không có | **Tự tạo cache cho Transcript (~0.8s)** |

---

## 2. CÔNG NGHỆ MỚI NHẤT: KIẾN TRÚC HYBRID VAD (SOTA 2026)

### Sơ đồ luồng xử lý siêu tốc:
```
[Timeline Audio Track] 
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Trích xuất Audio (FFmpeg LGPL - PCM 16kHz Mono: ~0.5s)  │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. LỚP 1: Silero VAD v5 (ONNX Runtime C++ / Node Addon)     │
│    • Kích thước: ~2 MB                                      │
│    • Tốc độ: > 500x Real-time (Video 1h xử lý trong ~2s)    │
│    • Nhận diện giọng nói chính xác ở chunk 30ms            │
│    • Miễn nhiễm tạp âm: Quạt gió, gõ phím, tiếng ồn nền    │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LỚP 2: Whisper.cpp GPU Acceleration (DirectML / Vulkan) │
│    • Xác nhận ranh giới từ vựng (Word Boundaries)          │
│    • Đảm bảo 100% không cắt phạm chữ khi nói thì thầm      │
│    • Tự động ghi file cache .autocut-nghe.json              │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. LỚP 3: Adaptive Padding & Pacing Buffer                  │
│    • Lead-in: Mở sớm 0.15s trước khi từ bắt đầu             │
│    • Lead-out: Giữ lại 0.25s sau khi từ kết thúc            │
│    • 3 Preset: Giữ nhịp (87%), Vừa (74%), Cắt sạch (57%)    │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. LỚP 4: Premiere Batch Razor Engine (Reverse Slicing)     │
│    • Gom toàn bộ điểm cắt thành 1 mảng JSON                 │
│    • Cắt ngược từ cuối timeline về đầu (tránh lệch timecode)│
│    • Tắt UI refresh tạm thời -> Cắt 500 clips trong < 2s    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. LỘ TRÌNH TRIỂN KHAI DÀNH CHO CLAUDE CODE

### Hạng mục 1: Tích hợp Silero VAD v5
- Tải mô hình `silero_vad.onnx` (phiên bản v5).
- Tích hợp qua `onnxruntime-node` hoặc binary C++ siêu nhẹ.
- Xây dựng hàm `detectSpeechSegments(audioPath)` trả về danh sách mảng timestamp `[{start: ms, end: ms}]`.

### Hạng mục 2: Tối ưu hoá ExtendScript trong `host/`
- Viết lại hàm `batchCutAndRipple(sequence, cutPoints)`:
  - Sắp xếp `cutPoints` theo thứ tự thời gian giảm dần (Descending: từ cuối về đầu).
  - Tắt QE update tạm thời hoặc dùng batch track manipulation.
  - Tự động nhân bản Sequence dự phòng trước khi can thiệp timeline.

### Hạng mục 3: Nâng cấp tính năng Pro mở rộng
1. **Khử từ đệm (Filler Words)**: Lọc các từ "ờ, ừm, à thì là, like, you know" dựa trên mốc từ Whisper.
2. **Loại bỏ câu vấp (False Starts)**: So sánh độ tương đồng ngữ nghĩa (Levenstein distance / embedding) của 2 câu liền kề để xóa câu bị nói vấp đầu tiên.
3. **Interactive Waveform Preview**: Trả dữ liệu mảng sóng âm để hiển thị trực tiếp các nhát cắt đỏ trên panel trước khi bấm xác nhận.

---

## 4. GHI CHÚ BẢN QUYỀN & MÃ NGUỒN MỞ
- **FFmpeg**: Sử dụng bản LGPL (N-125829), không dùng cờ `--enable-gpl` để đảm bảo phân phối thương mại hợp pháp.
- **Whisper.cpp**: Giấy phép MIT.
- **Silero VAD**: Giấy phép MIT.
- **Tất cả các thành phần đều an toàn 100% để thương mại hóa toàn cầu.**
