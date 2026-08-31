# AiO Shot & Save — ban TAURI 2 (Rust + webview, Win + Mac)

Anh Tien chot 31/08/2026: cong nghe di theo cho tool chup man hinh la Tauri 2
(sau chuoi loi kien truc Electron — xem so 9 loi ben `AiO Shotandsave/CLAUDE.md`).
Ban Electron 0.4.2 DONG BANG, van la ban anh dang dung hang ngay; ban nay chi
thay the khi qua du harness + anh cham DAT.

## Giai doan hien tai: SPIKE — KET QUA DO 31/08 23:00 (release build, may nha)

| # | Phai do | KET QUA |
|---|---|---|
| 1 | Overlay trong suot hien TUC THI tren MOI man (khac DPI) | ✅ Tao moi (lanh) 289ms / **AM (an→hien) 13ms** — chien luoc san pham: tao san luc boot, hotkey chi show. Do THAT do sang 43→15→43 (hien va dong sach) |
| 2 | Toc do chup man tu Rust (xcap) | ✅ **5120x2160 = 72-79ms · 2560x1440 = 22-28ms** (Electron ~880ms ca hai + encode). Thread rieng, khong cham UI |
| 3 | Keo-tha file RA app khac | ⏳ CHUA DO — can tauri-plugin-drag, vong sau |
| 4 | Phim tat toan cuc + tray | ✅ tray + menu chuot phai OK; hotkey chay (xem bay duoi) |

Kem: exe release **7,9MB** (Electron: bo cai 84MB / giai nen 225MB).
Ket qua do ghi vao `spike-ket-qua.txt` (giong .run-log ban Electron — tin SO,
khong tin cam giac).

## ☠️ BAY TAURI DA VAP (31/08 — dem 1 tieng spike)

1. **Hotkey toan cuc CAM khi app khong con cua so nao.** Dang ky bao OK,
   bam that (tay anh Tien) lan bam gia (keybd_event) deu KHONG ban su kien.
   Giu it nhat MOT cua so song (an cung duoc) la chay ngay ([ctrl+shift+space]
   AM 13ms). → Luat: overlay HIDE chu khong CLOSE. Trung luon chien luoc
   "tao san, hien tuc thi".
2. `macOSPrivateApi: true` trong tauri.conf.json doi feature `macos-private-api`
   trong Cargo.toml — thieu la build fail voi loi kho hieu ve allowlist.
3. So kich thuoc overlay phai so `inner_size` — `outer_size` tinh ca bong/vien
   vo hinh (5138x2170 khi inner dung 5120x2160), khong phai "hut".
4. Debug build cham 5-10 lan (chup 432ms vs release 79ms) — MOI so do phai
   lay tu `--release`.
5. Log 22:47-22:49 co 3 luot chay bao "1 man 3620x2036" tren may 2 man —
   chua ro (cau hinh man Windows luc do?). GHI LAI, chua ket luan.

## Mang theo tu ban Electron (KHONG lam lai tu dau)

- UI: HTML/CSS/JS thuan + tokens.css — webview nap thang.
- 3 luat keo-chon: mot man mot nguoi cam but · su that lay tai nguon (neo =
  diem mousedown) · du lieu to khong qua IPC.
- SO 9 LOI TAI DIEN + 4 harness (`AiO Shotandsave/CLAUDE.md`).

## Build

Can: rustup (stable-msvc) + VS Build Tools C++ (cai 31/08 may nha) + WebView2
(Win11 co san). Chay: `cargo run` trong `src-tauri/` (frontend la file tinh,
khong can dev server / npm).
