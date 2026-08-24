# AiO Studio - Transcript 2.5.5

Ngay dong goi: 2026-08-24 · Bo cai: `AiO-Studio-Transcript-2.5.5-SETUP.zip` (92,5 MB)

## Nguoi dung thay gi

Khoanh vung bang `I` / `O` tren timeline -> bam **Lam phu de** -> phu de (caption
track) nam dung cho nguoi ta noi, kem marker o cho may nghe khong chac.

Panel **di theo thao tac**: doi vung I/O, doi sequence, doi khung hinh (Ngang 16:9 /
Doc 9:16 tu nhan theo kich thuoc sequence) — panel cap nhat trong khoang 1 giay.

## Doi gi so voi 2.5.0

| | |
|---|---|
| Luc chay | Chi hien **"Dang xu ly... N%"** + dong ho. Khong lo ten buoc (luat anh Tien 13/08) |
| Giao dien | Go 9 cum chu thua; khoi "Don thu panel da tao" an khi khong co gi de don |
| Duong dan .srt | Them nut **Mo thu muc** — mo Explorer va boi sang san file |
| Nut chinh | Dong bo voi Autocut: cam #f86820, chu trang 15px/700, co icon |
| Khoi **Hieu ung** | **DA AN** — xem ly do ben duoi |

## Vi sao an khoi Hieu ung

Anh Tien muon hieu ung lam bang duong **native cua Premiere** ("update to graphics").
Do co doi chung 24/08 tren Premiere 27.0:

| Doi tuong | So method | Co ham bien caption -> graphic |
|---|---|---|
| `sequence` | 42 | KHONG (chi co `createCaptionTrack`) |
| `app` | 34 | KHONG chay duoc lenh menu |
| `qe.sequence` | 63 | KHONG |

Cong voi do 22/08: graphic do Premiere tao thi `Source Text.setValue` tra `true`
nhung chu **TRONG** tren hinh (Adobe xac nhan API MOGRT chi cho After Effects).
=> Duong con lai la MOGRT tu AE, ma Premiere coi no la file import — **nang timeline**,
dung thu anh Tien khong muon. Nen AN, **khong xoa**: bat lai bang mot dong
`HIEN_HIEU_UNG = true` trong `client/src/App.tsx`.

## Con no

- Anh Tien dung tren **bai that** (thuoc do tu ngoai, chua co).
- Chua thu bo cai tren **may sach**.
