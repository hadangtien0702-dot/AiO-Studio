# AiO Studio BETA 01 - 2026-08-14

## Ban nay co gi
- File phat: `AiO-Studio-Beta-3-panel.zip` (91,9 MB)
- 3 panel (dung 3 tool anh Tien chot chac chan 14/08):

| Panel | Goi | Phien ban |
|---|---|---|
| AiO Autocut | AiO-Studio-Autocut-1.5.0.zxp | 1.5.0 |
| AiO Asset Manager | AiO-Studio-Asset-Manager-2.0.0.zxp | 2.0.0 |
| AiO Power Bins | AiO-Studio-Power-Bins-2.0.0.zxp | 2.0.0 |

- Kho FFmpeg dung chung (LGPL N-125829-gfe953596e9-20260728):
  ffmpeg.exe SHA256 dau `4CBB08190774` · ffprobe.exe `6E3A2FB316B3`
- Cai bang CAI-DAT.bat: tu bat PlayerDebugMode, cai 3 panel + kho FFmpeg,
  khong can quyen Admin.

## Diem noi bat cua ban nay
- Song ngu VI/EN ca 3 panel (nut o thanh dau, doi mot phat ca bo)
- Autocut: dock chung voi cac panel (het cua so roi), UI ket qua gon,
  giau quy trinh luc chay (chi hien Loading + %)
- Asset Manager: them muc "Dung gan day" (20 asset Import gan nhat)
- Bo cai 274,7 MB -> 91,9 MB nho kho FFmpeg dung chung

## Da kiem chung
- Cai thu che do -ThuMucDich: 3/3 panel dung id, hash FFmpeg khop nguon,
  ban build sach loi Vite xoa process.env, du giay phep LGPL
- Song ngu do tren panel that: Autocut 0 loi · Asset Manager 0 loi ·
  Power Bins 0 sot

## CHUA kiem - phai lam truoc khi gui ra ngoai
- [ ] Cai that tren MAY SACH (may nha anh Tien) bang chinh file zip
- [ ] Chay Autocut mot clip that tren may do (chung minh kho FFmpeg chung)
- [ ] SmartScreen: xac nhan chi mot lan "More info -> Run anyway"

## Luat cua ngan Release
Moi ban mot thu muc theo ngay (`2026-08-14-beta-01`, `-02`...), KHONG BAO GIO
ghi de ban cu — tester bao loi "ban thu Sau" la loi dung file ho cam ra doi
chieu duoc.
