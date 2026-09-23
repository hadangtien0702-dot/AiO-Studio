Anh Tiến vừa gõ `/congty` — **gắn một sản phẩm vào Trung tâm Điều hành** (sổ công
ty), hoặc cập nhật sản phẩm đã có trong đó.

Tham số (tuỳ chọn): tên app, ví dụ `/congty Video Download`. Không có tham số thì
làm bước 0.

> **Từ 23/09 `/xong` tự làm việc này ở bước 2f** (anh chốt gộp). Gõ `/congty`
> riêng khi muốn cập nhật sổ mà chưa chốt phiên, hoặc gắn một app chưa đụng tới
> trong phiên. File này cũng là **sổ luật chi tiết** mà bước 2f đọc theo.

> **Trung tâm Điều hành** = artifact `https://claude.ai/artifact/MwhxaNXJNGMrUwKtUDW9Wn`
> (anh lập 21/09/2026). Đọc/ghi bằng công cụ **ArtifactData** với `url` đó.
> Dữ liệu gồm 4 bộ: `app` (danh sách sản phẩm) · `phongban` (9 phòng) ·
> `viec` (đầu việc đang nằm ở từng phòng) · `hoatdong` (nhật ký) + `meta/tong`.

---

## 0. Chưa biết gắn app nào

1. `ArtifactData` action `list`, collection `app` → danh sách đang có trong sổ.
2. `ls "E:\2026\Production\AiO Studio\Build and UI Design"` → app đang có mã nguồn.
3. In **bảng chênh lệch**: app nào có trong repo mà chưa có trong sổ, app nào có
   trong sổ mà số phiên bản đã cũ so với repo.
4. Hỏi anh chọn, **đừng tự gắn hết**.

## 1. Lấy SỰ THẬT từ repo — không bịa, không nhớ

Mỗi con số phải đọc từ file, ghi kèm nguồn:

| Cần gì | Đọc ở đâu |
|---|---|
| Số phiên bản | `CSXS/manifest.xml` (`ExtensionBundleVersion`) hoặc `client/package.json`; app Electron: `package.json` gốc |
| Trạng thái + việc gần nhất | `PROGRESS.md` của app (mục trên cùng) |
| Sản phẩm làm gì, việc chờ | `CLAUDE.md` của app |
| Dòng chính thức của cả bộ | Bảng mục 2 trong `AiO Studio/CLAUDE.md` |

☠️ Số ở ba chỗ này hay lệch nhau (đã xảy ra: bảng ghi 0.4.17 trong khi
`package.json` là 0.5.5). **Lệch thì nói ra và hỏi anh lấy số nào**, đừng tự chọn.

## 2. Đọc sổ công ty trước khi ghi

`ArtifactData` action `list` cho `app`, `phongban`, `viec`. Ghi lại `version` của
từng tài liệu — mọi lệnh ghi sau đó phải kèm `if_version` để không đè mất thay
đổi anh vừa làm trên trang.

## 3. Ghi vào sổ

Một lệnh `batch` duy nhất, gồm:

1. **`app/<mã app>`** — `ten` · `ban` (số phiên bản) · `trangThai` · `ghiChu`
   (≤ 90 ký tự, nói **việc gần nhất bằng kết quả**) · `thuTu` (số thứ tự trong
   bảng mục 2).
   `trangThai` chỉ được là: `xong` · `chay` · `lam` · `dong` · `chua`.
2. **`hoatdong/<YYYYMMDD-HHmm>`** — `loai:'app'` · `app:'<tên app>'` ·
   `t` (mili giây, lấy bằng `Date.now()` chạy thật, **không bịa**) ·
   `muc`: `ok` (ra bản mới, anh nghiệm thu đạt) / `loi` (lỗi thật) / `info` ·
   `noiDung`: một câu, có số đo.
3. **`meta/tong`** — `capNhat` = cùng mốc thời gian.

☠️ Nhật ký chia hai khung trên trang: `loai:'app'` vào **Lịch sử app**, mọi thứ
khác (giao việc, xong việc, đổi nhân sự) vào **Vận hành phòng ban**. Ghi sai
`loai` là dòng đó nằm nhầm khung.

## 4. Việc đang chờ của app → có gắn vào phòng ban không

Hỏi anh trước, đừng tự thêm. Anh gật thì ghi `viec/<mã>`:
`ten` (≤ 70 ký tự) · `tram` (mã phòng) · `ghiChu` · `loi` (nếu việc đang hỏng) ·
`t` · `thuTu` · `trangThai`.

**Luật MỖI PHÒNG MỘT VIỆC (anh chốt 21/09):** phòng đang có việc (`trangThai`
khác `'cho'`) thì việc mới phải là `trangThai:'cho'` — nó nằm im tới khi việc
hiện tại được bấm ✓. Trang **không hiện** hàng chờ nữa, nên phải **nói với anh**
là việc vừa giao đang xếp sau việc nào.

Mã phòng: `ceo` (Ban Giám đốc) · `dieuphoi` (Điều hành dự án) · `engineering`
(Phát triển sản phẩm) · `qa` (Kiểm soát chất lượng) · `duyet` (Nghiệm thu) ·
`phathanh` (Phát hành) · `nguoidung` (Kinh doanh & CSKH) · `research` (Nghiên cứu
thị trường, phòng hỗ trợ) · `baomat` (An ninh thông tin, phòng hỗ trợ).
**Không tự tạo phòng mới.**

## 5. Cấm

- **Không đưa bí mật lên trang**: token, mật khẩu, đường dẫn ổ đĩa của anh, nội
  dung `.env`. Trang là sổ công ty, không phải nơi cất khoá.
- Không đổi `ten`/`vaiTro`/`ghe` của phòng ban trong lệnh này — đó là việc riêng,
  hỏi anh.
- Không xoá tài liệu của người khác ghi. Xoá bất cứ thứ gì thì hỏi trước
  (luật 4 của brain).

## 6. Báo cáo cho anh

Ngắn, bằng bảng **trước → sau**: app nào, phiên bản nào, trạng thái nào, thêm mấy
dòng nhật ký, việc nào vào phòng nào (và đang xếp sau việc gì). Kèm link trang.
Nhắc anh tải lại trang nếu đang mở bản cũ.

## 7. Ghi lại vào repo

Nếu trong lúc làm phát hiện bảng mục 2 của `AiO Studio/CLAUDE.md` hoặc
`TOOL_VERSION_TRACKER.md` ghi sai phiên bản / sai trạng thái → **sửa ngay tại
chỗ** (nguyên tắc 0 của brain), rồi nói rõ đã sửa gì.
