# Nghiên cứu đối thủ — AutoPod và thị trường multicam tự cắt

> Anh Tiến giao 01/08/2026: *"anh cần em nghiên cứu đối thủ AutoPod —
> mình phải làm tốt hơn họ thật nhiều"*.
> Nguồn: trang chính thức autopod.fm, tài liệu hướng dẫn, bài tổng hợp lỗi
> của người dùng thật, và trang của các đối thủ cạnh tranh với chính AutoPod.
> Link nguồn ở cuối file.

---

## 1. AutoPod là ai — số liệu đã kiểm chứng

| | |
|---|---|
| Sản phẩm | Bộ 3 plugin cho Premiere Pro (không có bản DaVinci/FCP chính thức) |
| Giá | **$29/tháng, KHÔNG có mua đứt** · trả năm tặng 1 tháng · thử 30 ngày |
| License | **1 máy / license** (đổi máy phải làm thủ tục) |
| Giới hạn | Tối đa **10 người nói · 10 cam** · cần Premiere 2023+ |
| Bộ 3 tool | Multi-Camera Editor · Jump Cut Editor · Social Clip Creator |

**Multi-Camera Editor của họ** (mảnh tool này của mình đấu trực tiếp):
chọn số người/số cam, đặt tên người nói, chọn cut method (standard /
multicam / enable-disable), chỉnh tần suất wide shot, lưu preset. Hỗ trợ
solo shot, two-shot, wide shot. Cắt dựa trên mic từng người (giống hướng
mình chọn — xác nhận hướng đi đúng).

**Social Clip Creator**: xuất hàng loạt 3 tỉ lệ (16:9, 4:5, 9:16) + auto
reframe + watermark + endpage. **Jump Cut Editor**: cắt khoảng lặng theo
ngưỡng dB người dùng nhập ← thua Autocut nhà mình (mình đo ngưỡng tự động
từ file, họ bắt người dùng đoán số dB).

---

## 2. ☠️ TÁM ĐIỂM YẾU THẬT CỦA AUTOPOD — và mình đánh vào đâu

Gom từ bài tổng hợp lỗi 2026 + diễn đàn Adobe + bài của đối thủ họ.
Mỗi dòng: họ yếu gì → mình làm gì → **đo bằng số nào để dám nói "tốt hơn"**.

| # | AutoPod yếu | Mình làm | Đo bằng |
|---|---|---|---|
| 1 | **Trôi tiếng trên tập dài** — quá 45–60 phút là lệch lip-sync, phải tự chặt nhỏ tập ra | Mốc đặt clip ĐỌC LẠI từ track (chống trôi cộng dồn — đã dùng ở Re-Frames 94 đoạn lệch 0,01s) | Dựng tập 90 phút, lệch hình–tiếng cuối tập < 1 frame |
| 2 | **Vỡ khi sample rate lẫn lộn** (cam 48kHz + Zoom 44.1kHz) — người dùng phải tự Interpret Footage | FFmpeg quy hết mic về 16kHz PCM trước khi não nghe — sample rate gốc là gì cũng được | Liệu trộn 44.1 + 48kHz dựng vẫn đúng ranh |
| 3 | **Cắt cứng, không phải multicam thật** — muốn đổi một nhát sang cam khác là phải làm tay lại | v1 mình cũng cắt cứng (nhanh hơn). LEVEL 2: thêm lựa chọn dựng bằng Multicam Source Sequence thật — đổi angle 1 click | Đổi angle một nhát cắt trong < 5 giây |
| 4 | **Giả định cứng 1 mic = 1 cam** — 2 lav trên 1 khung hình là loạn cắt | Bước GÁN của mình là THỦ CÔNG → chỉ cần CHO PHÉP 2 người trỏ chung 1 cam (hiện đang cấm — phải sửa, xem TINH-NANG) | Liệu 3 người 2 cam: 2 người chung cam vẫn cắt đúng |
| 5 | **Bắt dọn timeline trước** — còn gap, còn in/out mark là chạy sai; clip phải thẳng hàng từ 0:00 | Mình đọc mốc THẬT từng clip được gán (start/inPoint) — clip nằm đâu cũng quy đổi đúng | Liệu clip KHÔNG bắt đầu ở 0:00 dựng vẫn đúng ranh |
| 6 | **Chạy xong tự xê dịch track** — người dùng báo layer nhảy lung tung sau khi chạy | Mình KHÔNG đụng sequence gốc — chỉ dựng sequence MỚI + đo lại và báo số sau mỗi lần dựng | pc_doKetQua đối chiếu số đoạn/thời lượng, lệch là báo |
| 7 | **Cảm giác cắt "máy móc"** — đối thủ họ (Wraith) lấy đúng cái này ra đánh | Lead-in cắt sớm ~0,3–0,5s + nuốt lượt ngắn (đã có) + luật wide (Level 2) | Editor thật xem bản cắt, đếm số nhát phải sửa tay |
| 8 | **Chỉ cho thuê $29/tháng, 1 máy, không mua đứt** — bị chê "đắt ngang tiền Premiere" | Bộ AiO: **mua một lần**, offline, không gọi server | Giá bộ < 1 năm tiền thuê AutoPod ($348/năm) |

Điểm yếu 1–2–5–6 mình **đã tự nhiên tốt hơn nhờ kiến trúc** (không phải
làm thêm gì nhiều — chỉ cần ĐO để có bằng chứng). Điểm 3–4–7 là việc phải
làm thêm, đã ghi vào TINH-NANG.md.

---

## 3. Thị trường không chỉ có AutoPod — bảng giá 08/2026

| Tool | Giá | Ghi chú |
|---|---|---|
| **AutoPod** | $29/tháng, không mua đứt | Nổi tiếng nhất, nhưng ĐẮT nhất và đang bị vây |
| Wraith (Phantom Editor) | **$119 mua đứt** / $19 mo | Sinh ra để "thay AutoPod", khoe xử lý nói chồng |
| FireCut | $34/tháng / **~$120 lifetime** | Có auto camera switching + tách file recorder nhiều kênh |
| PremiereCopilot | $7.99/tháng / **$59 lifetime** | Quảng cáo multicam podcast có bản free |
| AutoCut (autocut.com) | theo gói | ☠️ **TRÙNG TÊN với AiO Autocut nhà mình — xem mục 5** |

**Đọc ra điều gì:** cả thị trường đang chạy về **mua đứt giá $59–120**.
AutoPod là kẻ duy nhất còn thuê-bao-only → đó là cửa giá của mình. Nhưng
cũng nghĩa là "rẻ hơn AutoPod" KHÔNG đủ làm lợi thế — Wraith/Copilot đã rẻ
rồi. Lợi thế thật của mình phải là: **(a) cả BỘ 7 tool một giá** (họ bán
lẻ từng mảnh), **(b) chạy đúng trên liệu bẩn thực tế** (mục 2), **(c)
offline hoàn toàn** — không upload, không server, phòng dựng agency quay
nội dung khách hàng rất cần điều này.

---

## 4. AutoPod hơn mình chỗ nào (nói thật, không tự ru)

1. **Wide shot + luật đổi shot** — họ có, mình chưa (anh chốt v1 chưa cần;
   Level 2 phải có vì đây là chuẩn nghề).
2. **10 người / 10 cam** — não mình mới kiểm 3 mic, UI cho 6. Đủ cho
   podcast thật (2–4 người chiếm tuyệt đại đa số), nhưng con số marketing
   của họ to hơn.
3. **Preset lưu được** — họ có, mình chưa (đã nằm ở Level 2).
4. **3 năm tuổi thị trường + cộng đồng tutorial** — mình đấu bằng giá mua
   đứt + bộ đủ tool + số đo công khai (bảng benchmark kèm sản phẩm).
5. Social Clip Creator xuất hàng loạt 3 tỉ lệ một cú — Re-Frames nhà mình
   làm từng cái. (Việc của Re-Frames/Cut Short, không phải tool này.)

---

## 5. ☠️ CẢNH BÁO TÊN: "AutoCut" đã là thương hiệu có sẵn

**autocut.com** — plugin AI cho Premiere (cắt lặng, caption, v.v.) — đang
bán thương mại, có SEO mạnh. Tool nhà mình tên **AiO Autocut** gần như
trùng. Khi bán ra nước ngoài sẽ: (a) khó SEO, (b) rủi ro nhãn hiệu, (c)
khách tưởng mình nhái. **Cần anh Tiến quyết trước khi phát hành:** giữ
"AiO Autocut" (có tiền tố AiO che chắn phần nào) hay đổi tên mảnh cắt lặng
(ví dụ "AiO Silence Cut"). Chưa cần quyết ngay, nhưng phải quyết TRƯỚC khi
in tên lên trang bán.

---

## 6. Chốt: "tốt hơn họ thật nhiều" = ba mũi

1. **TIN được trên liệu bẩn** — tập dài không trôi, sample rate lẫn không
   vỡ, clip không thẳng hàng vẫn đúng, không đòi dọn timeline. Toàn bộ đo
   được, in số lên trang bán. (AutoPod thua ở đúng chỗ này — mục 2.)
2. **CẢ BỘ một giá mua đứt, offline** — AutoPod bán 3 mảnh $29/tháng;
   mình 7 panel, một lần trả, không đám mây.
3. **Minh bạch số đo** — mọi tính năng phát hành kèm con số (kiểu bảng
   MVP trong CLAUDE.md). Không đối thủ nào dám in benchmark của chính họ.

Việc cụ thể rút ra đã cập nhật vào TINH-NANG.md (mục nào mới thêm có ghi
"từ nghiên cứu đối thủ 01/08").

---

## Nguồn

- Trang chính thức: [autopod.fm](https://www.autopod.fm/) · [Giá](https://www.autopod.fm/pricing)
- Tổng hợp lỗi người dùng: [Autopod Not Working? Common Issues & Fixes (cutback.video, 2026)](https://cutback.video/blog/autopod-not-working-common-issues-and-fixes-for-premiere-pro-editors-2026-guide)
- Đối thủ của họ tự so: [Wraith Multi-Cam vs AutoPod (phantomeditor.video)](https://phantomeditor.video/blog/best-autopod-alternative-2026-multicam-editing-premiere-pro)
- Diễn đàn Adobe: [AutoPod plug-in issue](https://community.adobe.com/t5/premiere-pro-discussions/auto-pod-plug-in-issue/m-p/14391139) · [Feature request: built-in AI multicam](https://community.adobe.com/feature-requests-730/it-would-be-great-if-premiere-pro-had-a-built-in-ai-multicam-feature-that-automatically-cuts-between-camera-angles-based-on-who-is-speaking-instead-of-relying-on-third-party-plugins-like-autopod-1546778)
- Giá thị trường: [FireCut pricing](https://firecut.ai/pricing/all/) · [PremiereCopilot pricing](https://www.premierecopilot.com/en/pricing) · [Hướng dẫn dùng AutoPod (autopodcastai.com)](https://autopodcastai.com/autopod-multi-camera-editing/)
- Review tổng hợp: [Best Multi-cam Editing Plugins 2026 (cutback.video)](https://cutback.video/blog/best-multi-cam-editing-plugins-for-premiere-pro-users)
