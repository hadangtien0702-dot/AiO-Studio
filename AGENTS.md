# AGENTS.md — LUẬT CHUNG cho Claude Code VÀ Gemini (cả hai đều phải đọc)

> **Một file duy nhất, hai AI cùng đọc** (anh Tiến chốt 27/09/2026: *"tạo 1 file mà 2 đứa đều phải đọc"*).
> - **Gemini / Antigravity** tự đọc file này (AGENTS.md ở gốc workspace, luôn bật).
> - **Claude Code** tự nạp qua dòng `@AGENTS.md` trong `CLAUDE.md` gốc repo.
> Sửa luật = sửa Ở ĐÂY, một chỗ. Đừng chép luật này sang file khác (chép là sẽ lệch).
> Kỹ thuật riêng từng app: `CLAUDE.md` + `PROGRESS.md` trong thư mục app — đọc trước khi sửa app đó.

## 0. Người chủ và cách nói chuyện

- **Anh Tiến**: editor dựng phim, làm sản phẩm, **không phải lập trình viên**. Trả lời **tiếng Việt**, dễ hiểu,
  nói bằng **kết quả + con số** (trước/sau, bao nhiêu, đo bằng gì), không nói bằng tính từ.
- Anh quyết định, AI thực thi. Việc khó đảo ngược (xoá, ghi đè, đổi cấu hình dùng chung, cài đè) → **hỏi trước**.
- Repo `hadangtien0702-dot/AiO-Studio` là **PUBLIC**: không commit token, mật khẩu, `.exe`, ảnh của anh.
- Anh làm trên nhiều máy (công ty `E:\2026\Production\AiO Studio`, nhà `D:\Production\AiO Studio`), đồng bộ qua GitHub.

## 1. ☠️ BA LUẬT LÀM CHUNG (chốt 27/09/2026)

**Vì sao có luật này:** ngày 27/09 hai AI làm cùng một thư mục. Commit `e62ec52` của Gemini gom nhầm ~20 file việc dở
của Claude rồi push; 7 bản Shot & Save không có dòng kiểm thử nào và lọt lỗi "ảnh vừa chụp hiện 2 lần"; các bảng số
phiên bản kẹt ở 0.5.5 trong khi app đã 0.6.4.

### Luật 1 — Mỗi AI một bàn làm việc riêng
| | Thư mục (máy nhà) | Nhánh git |
|---|---|---|
| **Claude** | `D:\Production\AiO Studio` | `main` |
| **Gemini** | `D:\Production\AiO Studio - Gemini` (git worktree) | `gemini` |

- Hai thư mục có vùng chờ commit RIÊNG → không gom nhầm file của nhau.
- **Gemini không commit/push lên `main`**, không sửa file trong thư mục của Claude. **Claude không sửa file trong thư mục
  của Gemini.** Máy khác chưa có thư mục Gemini: `git worktree add "<repo> - Gemini" gemini`.
- Đầu mỗi buổi, Gemini: `git fetch origin` rồi `git merge origin/main` (lấy bản mới nhất đã gộp) trước khi sửa.

### Luật 2 — Một người dựng, người kia soát; mỗi app một người cầm bút tại một thời điểm
- **Gemini dựng** (tính năng / sửa lỗi) trên nhánh `gemini` → **BÀN GIAO** → dừng sửa app đó.
- **Claude soát**: đọc mã, chạy bài kiểm, đo; sửa nếu cần; **gộp vào `main`**; đóng gói + cài cho anh; báo anh.
- **Web bán hàng Shot & Save (`Website/AiO ShotSave Web/`) = việc của Claude** (anh chốt 27/09: *"Gemini phát
  triển tính năng, em đem lên web"*). Gemini không sửa thư mục web; tính năng mới xong + đã gộp `main` thì Claude đưa
  lên web, **chỉ quảng cáo thứ có thật trong mã app** và đã soát.
- Anh có thể đổi vai (Claude dựng, Gemini soát) — khi đó đổi chữ trong luật này cho khớp, đừng làm ngầm.
- **Anh là người báo "tới lượt ai"**. Chưa tới lượt thì chỉ ĐỌC app đó, không sửa.

**BÀN GIAO** = đủ 3 việc mới coi là xong:
1. Commit + push nhánh của mình (luật git mục 2, số phiên bản mục 3).
2. Mục trên cùng `PROGRESS.md` của app, dòng đầu **`[BAN GIAO CHO <CLAUDE|GEMINI>]`**: làm gì · file nào ·
   **đã kiểm bằng gì, ra số nào** · **CHƯA kiểm gì** (ghi thẳng) · chỗ người soát cần soi kỹ.
   ☠️ Bài kiểm phải kiểm **HÀNH VI** (mở trang/đo giao diện, bấm thử, đọc kết quả), không chỉ "file có chứa chuỗi X".
   28/09: 7/7 mục mới của bản 0.7.0 là `includes()` → vẫn ĐẠT khi còn 2 lỗi thật (đèn nút lệch nhau, nút chồng nhãn
   ở 4/7 bề rộng khung); 1 mục còn BẮT màu sai `#090a0d` phải có trong CSS. Tính năng mới mà nút chưa làm gì thì ghi
   thẳng "nút chưa làm gì" ở dòng đầu bàn giao.
3. Nhắn anh một câu: *"Xong [việc], đã push nhánh [x], anh bảo [người kia] rà nhé."*

**Người SOÁT** (thường là Claude) khi anh bảo "rà bản Gemini": `git fetch` · đọc diff nhánh `gemini` so `main` · đọc
mục BÀN GIAO · chạy bài kiểm vùng bị đụng (mục 5) · lỗi thì sửa trên `main` sau khi gộp, ghi rõ trong PROGRESS ·
gộp xong nhắn anh + ghi kết quả rà vào PROGRESS (Gemini đọc lại ở buổi sau).

### Luật 3 — Chung một sổ luật
File này là luật chung. Cả hai cùng theo **sổ lỗi tái diễn** của app và luật số phiên bản. Hai luật mâu thuẫn → hỏi anh.

## 2. Git — bắt buộc cho cả hai

1. **Không** `git add -A`, `git add .`, `git commit -a`. Chỉ add **đúng file mình sửa**.
2. Trước commit: chạy **riêng** `git diff --cached --name-only` và **đọc**. Có file lạ → `git commit -m "..." -- <file của mình>`.
3. `git status` có file lạ đang sửa dở → việc của người khác, **không đụng**.
4. Xong một cụm việc → **commit ngay**, đừng dồn cuối buổi.
5. `git pull` / `git merge origin/main` trước khi push. Message tiếng Việt không dấu, nói kết quả, không dấu nháy kép.
6. Sau commit: `git show --stat HEAD` — đúng file của mình, không thừa.

## 3. Mỗi lần push = TĂNG SỐ PHIÊN BẢN, trong CÙNG commit

- Tăng số hiển thị của app (Shot & Save: `package.json` → `"version"`; panel CEP: `CSXS/manifest.xml` + chỗ hiện số).
- **Và** sửa dòng của app trong 2 bảng: mục 2 `CLAUDE.md` gốc repo + `Marketing/AiO MVP and Plan Marketing/TOOL_VERSION_TRACKER.md`.

## 4. Nhật ký `PROGRESS.md`

- Mục mới ở **TRÊN CÙNG**; giờ lấy bằng lệnh (`date` / `Get-Date`), **không tự đoán giờ**; **không emoji**.
- Ghi: bối cảnh (lời anh, nguyên văn nếu có) · nguyên nhân thật · đã sửa gì · file · **kiểm chứng bằng số**.
- **Chỉ ghi điều đã đo được.** Chưa đo → ghi **"chưa kiểm"**. Không viết câu quảng cáo không đo được
  (27/09: "làm mờ không thể đảo ngược bằng AI" — sai, khảm 8–15 px còn khôi phục được).
- Cập nhật khối "TRẠNG THÁI HIỆN TẠI" ở đầu file.

## 5. Shot & Save — vùng nguy hiểm (đọc thêm `Build and UI Design/AiO Shotandsave/CLAUDE.md`, mục SO LOI TAI DIEN)

| Đụng vào | Lỗi từng lặp lại | Bắt buộc trước khi báo xong |
|---|---|---|
| Kéo chọn / co giãn khung chụp (`overlay`) | #8 hồi quy 3 lần/ngày | `test-keo-vat-man.js` + `test-overlay-drag.js` |
| Canvas vẽ trên ảnh ghim (`pin`) | #10 nét lệch xa chuột ở màn 150% | canvas đặt CẢ thuộc tính (px) LẪN style (DIP); `npm run test:khung -- <bản sao ảnh>` |
| Thư mục ảnh, khay (`kho.js`, shelf) | #4 #11 xoá/mất ảnh của anh | không xoá/ghi đè ảnh thật; test trên BẢN SAO; cài đè xong đếm ảnh trước = sau |
| Khay: nạp ảnh gần nhất | 27/09 ảnh vừa chụp hiện 2 lần | `shelfAdd` gọi `napAnhGanNhatVaoKhay(filePath)` TRƯỚC `ensureShelf` — đừng gỡ |
| Bài test bật cửa sổ chụp | #12 bung overlay lên màn anh đang làm | anh đang ngồi máy thì **không chạy selftest** — hỏi trước |
| Bản mới / Release | anh Tiến chốt 28/09: "mỗi lần làm xong cứ thêm vào bản release anh tự cài" | `npm run dist` -> chép bộ cài `.exe` vào `Release/<app>/win/` + cập nhật `HUONG-DAN-CAI-DAT.txt` (để anh tự cài) |
| Cửa sổ / màn hình mới, sửa giao diện | 28/09 anh chê 2 lần: *"chưa chuẩn như UI đang có · font chữ - pill - cách em sắp xếp"* | Chuẩn = **màn Cài đặt** (`src/settings/settings.css`, làm lại 29/09 theo hướng B anh chọn): header 46px chữ trắng 13/700, **danh sách nhóm** (tên nhóm chữ hoa nhỏ nằm ngoài, hàng kẻ mảnh), cụm lựa chọn `.chon-nhom/.chon-nut` ô bằng nhau bo 8px, **đang chọn = XÁM NỔI** (`--bg-5`), **cam chỉ cho nút chính** `.nut.chinh`, nút `.nut` 28px bo 8px, font Inter (nút + ô nhập `font-family: inherit`). KHÔNG khai `:root` riêng. `npm run test:storyboard` so 7 khối CSS với settings.css |
| Quay vùng màn hình theo thời gian (Storyboard quay 3 giây) | sổ lỗi: cửa sổ TRONG SUỐT phủ lên video tăng tốc phần cứng → video ĐEN trong ảnh chụp | Không cửa sổ nào đè lên vùng đang quay: viền = 4 thanh đặc NGOÀI vùng, đồng hồ trên/dưới vùng (`main.js moVienQuay`). ☠️ Windows KHÔNG cho cửa sổ mỏng hơn ~30 px (đo 29/09, 7 cấu hình) và ở màn 150% trả cửa sổ to thêm 1 px: 0.7.4 xin thanh 3 px thành 31 px, lọt cam vào 3/6 khung. Viền = cửa sổ ≥ 40 px cách vùng 2 px + `setShape` giữ nét mảnh; hình học ở `src/vien-quay.js`, kiểm `npm run test:vienquay` |

Chữ người dùng thấy: đủ **VI + EN** (`src/i18n.js`), **không dùng gạch ngang dài "—"**, câu hướng dẫn nói **đúng
hành vi thật**. Máy/thư mục mới: `npm install` trong thư mục app trước khi chạy.

**Shot & Save còn mở (28/09 16:0x, bản 0.7.4 trên `main`):** quay 3 giây Storyboard CHƯA chạy trên app thật (viền +
đồng hồ trên màn 150%/125%, khung đầu sau 350 ms, video có đen không) · chưa ai chạy harness kéo-chọn cho 0.5.7 và
0.7.x (nút Storyboard trên khung chọn) · kích thước khối làm mờ (8–15 px) chờ anh quyết · ~0,1–0,2 s đầu làm mờ có thể
lấy mẫu từ ảnh nửa độ phân giải (hiếm). **Gemini:** `git merge origin/main` trước khi sửa — nhánh `gemini` đang ở 0.7.0.

## 6. Báo anh khi xong việc

Đã làm gì (1–2 dòng) · **đo bằng gì, ra số nào** · còn gì chưa kiểm và vì sao · số phiên bản mới · mã commit · tới lượt ai.
