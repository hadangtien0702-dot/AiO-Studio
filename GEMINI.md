# GEMINI.md — Đọc trước khi sửa bất cứ gì trong repo này

> Viết bởi Claude (Claude Code) ngày 27/09/2026 theo lời anh Tiến (chủ dự án), để Gemini và Claude
> cùng làm trên MỘT repo mà không giẫm chân nhau. Luật đầy đủ của dự án nằm ở `CLAUDE.md` (gốc repo)
> và `CLAUDE.md` + `PROGRESS.md` trong thư mục từng app — **đọc file của đúng app trước khi sửa app đó**.

## 0. Bối cảnh trong 5 dòng

- Chủ dự án: **anh Tiến**, editor dựng phim, không phải lập trình viên. Trả lời anh bằng **tiếng Việt**, dễ hiểu,
  nói bằng **kết quả + con số** (trước/sau, bao nhiêu, đo bằng gì), không nói bằng tính từ.
- Repo `hadangtien0702-dot/AiO-Studio` là **PUBLIC**: không bao giờ commit token, mật khẩu, file cài `.exe`, ảnh của anh.
- Anh làm trên **2–3 máy** (công ty `E:\2026\Production\AiO Studio`, nhà `D:\Production\AiO Studio`), đồng bộ qua GitHub.
- **Nhiều AI làm song song trên cùng thư mục** (Claude ở Premiere panels, Gemini ở Shot & Save…). Vùng chờ commit
  (git index) là DÙNG CHUNG — đây là nguồn lỗi số 1 giữa hai bên (xem mục 1).
- Anh quyết định; mình thực thi. Việc khó đảo ngược (xoá, ghi đè, đổi cấu hình dùng chung) → **hỏi trước**.

## 1. ☠️ GIT — luật bắt buộc (đã vấp thật 27/09/2026)

**Chuyện đã xảy ra:** commit `e62ec52` "AiO Shot & Save v0.6.1" của Gemini gom luôn ~20 file việc của Claude đang để
sẵn trong thư mục (panel tổng, Guide Frame, Podcast, Re-Frames, 6 file `package-lock.json`) rồi push. Nội dung
không mất, nhưng lịch sử ghi sai chủ và các panel đó lên GitHub mà chưa tăng số phiên bản.

1. **KHÔNG dùng** `git add -A`, `git add .`, `git commit -a`. Chỉ add **đúng đường dẫn file mình sửa**.
2. Trước khi commit, chạy **riêng** `git diff --cached --name-only`, **đọc** danh sách. Có file không phải của mình
   → dùng `git commit -m "..." -- <đường dẫn của mình>` (chỉ commit các đường dẫn chỉ định), để nguyên phần kia.
3. `git status` thấy file lạ đang sửa dở ở app khác → **đó là việc của AI khác, không đụng**.
4. Làm xong một cụm việc → **commit ngay**, đừng để dồn cuối buổi.
5. `git pull` trước khi push. Commit message tiếng Việt không dấu, nói kết quả, không dùng dấu nháy kép.
6. Sau commit: `git show --stat HEAD` — kiểm đúng các file của mình, không thừa file.

## 2. Mỗi lần push = TĂNG SỐ PHIÊN BẢN, trong CÙNG commit

- Shot & Save: `Build and UI Design/AiO Shotandsave/package.json` → `"version"`.
- **Và** sửa dòng của app trong 2 bảng: `CLAUDE.md` gốc (mục 2, dòng `| 12 | **Shot & Save**`) và
  `Marketing/AiO MVP and Plan Marketing/TOOL_VERSION_TRACKER.md` (dòng 12).
  (27/09 đã lệch: 2 bảng kẹt 0.5.5 / 0.5.6 trong khi app đã 0.6.4 — Claude sửa về 0.6.5. Đừng để lệch lại.)

## 3. Nhật ký `PROGRESS.md` của app

- Mục mới ở **TRÊN CÙNG**. Giờ lấy bằng lệnh (`date` / `Get-Date`), **không tự đoán giờ**.
- Ghi: bối cảnh (anh yêu cầu gì, nguyên văn nếu có) · nguyên nhân thật · đã sửa gì · file · **kiểm chứng bằng số**.
- Luật dự án: nhật ký **không emoji**. Cập nhật khối "TRẠNG THÁI HIỆN TẠI" ở đầu file.
- **Chỉ ghi điều đã đo được.** Không viết lời quảng cáo như *"độ an toàn tuyệt đối không thể đảo ngược bằng AI"* —
  câu đó sai (mục 5, lỗi 4). Chưa đo thì ghi rõ **"chưa kiểm"**.

## 4. Shot & Save — trước khi sửa, đọc SỔ LỖI TÁI DIỄN

File: `Build and UI Design/AiO Shotandsave/CLAUDE.md`, mục **"SO LOI TAI DIEN"** (12 lỗi đã lặp lại nhiều lần, mỗi
lỗi có nguyên nhân đã đo + chốt chặn). Những vùng Gemini vừa sửa nằm đúng vùng nguy hiểm:

| Vùng | Lỗi cũ | Phải làm trước khi báo xong |
|---|---|---|
| Kéo-chọn khung / co giãn khung chụp (0.5.7) | **#8**: hồi quy 3 lần trong 1 ngày | chạy `test-keo-vat-man.js` + `test-overlay-drag.js` (xem sổ) |
| Canvas vẽ trên ảnh ghim (0.5.9) | **#10**: nét vẽ lệch xa chuột ở màn 150% | canvas đặt CẢ thuộc tính (px thật) LẪN style (DIP); `npm run test:khung -- <bản sao ảnh>` |
| Thư mục ảnh (0.6.3) | **#4, #11**: xoá nhầm / mất ảnh của anh | không xoá/ghi đè ảnh thật; test chạy trên BẢN SAO |
| Bất kỳ bài test nào bật cửa sổ chụp | **#12**: bung overlay lên màn anh đang làm | **anh đang ngồi máy thì KHÔNG chạy selftest** — hỏi anh trước |

**Kiểm hồi quy trước khi báo xong** (mục cuối sổ): selftest + harness đúng vùng đã sửa + đóng gói, cài đè, đọc
`ProductVersion` của tiến trình đang chạy + đọc run-log. Chữ người dùng nhìn thấy: **không dùng gạch ngang dài "—"**
(anh cấm 22/09), luôn đủ **VI + EN** trong `src/i18n.js`.

## 5. Kết quả Claude rà Shot & Save 0.5.7 → 0.6.3 (27/09/2026 20:4x)

> **Cập nhật 20:45:** Claude đã sửa mục 1, 2, 4 (câu nhật ký) và 5 trong bản **0.6.5** (commit `7623e83`).
> Còn mở: mục 3 (chạy harness kéo-chọn) và mục 6. Đừng sửa lại các mục đã xong.

Rà bằng đọc mã + đo, CHƯA chạy app (luật #12). Đã kiểm: cú pháp mọi file JS **sạch** · i18n đủ cặp VI/EN cho mọi
chuỗi mới · thư mục ảnh bị `.gitignore` chặn (0 ảnh lên git) · quét thư mục 5.000 ảnh mất ~45 ms (chấp nhận được).

1. **[ĐÃ SỬA 0.6.5] Ảnh vừa chụp hiện 2 lần trong khay** ở lần chụp đầu tiên sau khi mở app.
   `handleConfirm` lưu file xong mới gọi `shelfAdd()` → `ensureShelf()` → `napAnhGanNhatVaoKhay()` quét thư mục
   **thấy luôn file vừa lưu** (mới nhất) và nạp nó; rồi `shelfAdd` thêm chính file đó lần nữa với số khác.
   (`src/main.js`: `shelfAdd` ~dòng 1513, `ensureShelf` ~1466, `napAnhGanNhatVaoKhay` ~1446.)
   Hướng sửa: nạp ảnh gần nhất lúc app khởi động (trước lần chụp đầu), hoặc bỏ qua `filePath` đang thêm,
   hoặc lọc trùng theo `filePath` chứ không theo `id`. Kiểm: mở app → chụp 1 tấm → khay có đúng 1 ô ảnh đó.
2. **[ĐÃ SỬA 0.6.5] Gợi ý ảnh ghim ghi "Lăn chuột = độ mờ"** (`ghim.goiY` trong `src/i18n.js`) nhưng `src/pin/pin.js`
   dòng ~136 vẫn **bắt buộc giữ Ctrl** mới đổi độ mờ. Sửa chữ cho đúng (hoặc đổi hành vi nếu anh muốn), cả VI lẫn EN.
   Gợi ý cũng chưa nhắc phím **4 / B (làm mờ)** và **V (chọn)**.
3. **[CHƯA KIỂM] 7 bản 0.5.7 → 0.6.3 không có dòng kiểm thử nào trong PROGRESS**, trong khi 0.5.7 thêm 8 tay nắm
   co giãn khung ngay vùng kéo-chọn (sổ lỗi #8). Cần chạy harness mục 4 và ghi số vào nhật ký.
4. **[ĐÃ SỬA câu nhật ký 0.6.5; kích thước khối CHƯA đổi — chờ anh] Làm mờ = khảm khối 8–15 px** (`veBlurPixelate`, `blockSize = max(8, round(10*DPR))`). Với chữ nhỏ,
   khảm khối nhỏ **có thể bị khôi phục** (công cụ kiểu Depix). Nhật ký ghi "không thể đảo ngược bằng AI" là sai —
   sửa câu đó; nếu muốn che thông tin nhạy cảm chắc chắn: khối to hơn (≥ 20 px) hoặc tô kín.
5. **[ĐÃ SỬA 0.6.5]** `AiO Shotandsave/CLAUDE.md` mục "Da lam" vẫn ghi *"Tren cua so ghim: keo ANH = tha ra app,
   keo THANH TREN = di chuyen"*, nhưng 0.5.8 đã đổi: kéo ảnh = di chuyển cửa sổ, kéo ra app = nút `#drag-file` hoặc giữ Alt.
   Sửa tài liệu cho khớp. Sổ công ty (Trung tâm Điều hành) cũng đang ghi Shot & Save **0.5.6**.
6. **[NHỎ]** `veBlurPixelate` lấy mẫu từ `frozenImg` theo `toạ độ × DPR`; ~0,1–0,2 s đầu `frozenImg` là bản
   **nửa độ phân giải** (0.5.2) → nếu vẽ mờ ngay lúc đó sẽ lấy sai vùng. Khả năng gặp thấp.

## 6. Khi xong một việc, báo anh theo mẫu

- Đã sửa gì (1–2 dòng) · **đo bằng gì, ra số nào** · còn gì chưa kiểm và vì sao · số phiên bản mới · mã commit.
