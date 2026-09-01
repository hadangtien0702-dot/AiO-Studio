# AiO Shot & Save — ban TAURI 2 (Rust + webview, Win + Mac)

Anh Tien chot 31/08/2026: cong nghe di theo cho tool chup man hinh la Tauri 2
(sau chuoi loi kien truc Electron — xem so 9 loi ben `AiO Shotandsave/CLAUDE.md`).
Ban Electron 0.4.2 DONG BANG, van la ban anh dang dung hang ngay; ban nay chi
thay the khi qua du harness + anh cham DAT.

## Giai doan hien tai: SPIKE XONG 4/4 ✅ (01/09 may cong ty + 31/08 may nha)

| # | Phai do | KET QUA |
|---|---|---|
| 1 | Overlay trong suot hien TUC THI tren MOI man (khac DPI) | ✅ Tao moi (lanh) 289ms / **AM (an→hien) 13ms** — chien luoc san pham: tao san luc boot, hotkey chi show. Do THAT do sang 43→15→43 (hien va dong sach) |
| 2 | Toc do chup man tu Rust (xcap) | ✅ **5120x2160 = 72-79ms · 2560x1440 = 22-28ms** (may nha) · **3840x2160 = 61-70ms** (may cong ty). Encode+ghi PNG 4K chi **18ms** → tron goi chup-toi-file ~90ms vs Electron ~880ms. Thread rieng, khong cham UI |
| 3 | Keo-tha file RA app khac | ✅ 01/09 may cong ty: tauri-plugin-drag 2.1.1, keo PNG 4K (1,01MB) tha vao Explorer THANH CONG — kiem bang file that xuat hien o dich, khong tin chu "Dropped". Payload day du: FileDrop + FileContents + FileGroupDescriptorW (do bang cua so hung drop WinForms) |
| 4 | Phim tat toan cuc + tray | ✅ tray + menu chuot phai OK; hotkey chay (xem bay duoi) |

Kem: exe release **7,9MB** (spike 3 diem) → **12,8MB** (them plugin drag + crate image).
(Electron: bo cai 84MB / giai nen 225MB.)

**Spike DA DU — buoc tiep theo la PORT that (kien truc: overlay tao san +
capture thread rieng + keo tu cua so ghim/khay), cho anh Tien chot thu tu uu tien.**
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
6. **(01/09) KEO-THA: khong keo duoc tu OVERLAY** — overlay phu kin man thi
   khong con cho de tha. San pham that phai keo tu cua so ghim/khay (nho),
   giong ban Electron. Spike dung cua so `keospike` rieng.
7. **(01/09) "Dropped" cua tauri-plugin-drag chi nghia la DA NHA TAY** —
   DoDragDrop tra ve ke ca khi dich TU CHOI (effect NONE). Explorer chi copy
   khi tha dung VUNG FILE (DirectUIHWND). Kiem keo-tha phai kiem FILE THAT
   xuat hien o dich, khong tin ket qua callback (ho hang bai 5k/5l).
8. **(01/09) invoke goi plugin truc tiep khong can npm**: frontend tinh dung
   `withGlobalTauri: true` + `window.__TAURI__.core.invoke('plugin:drag|start_drag',
   { item: [duong], image: icon, options: {}, onEvent: new Channel() })` —
   doi chieu guest-js cua plugin (nhanh v2) truoc khi viet, dung doan ten field.

## Mang theo tu ban Electron (KHONG lam lai tu dau)

- UI: HTML/CSS/JS thuan + tokens.css — webview nap thang.
- 3 luat keo-chon: mot man mot nguoi cam but · su that lay tai nguon (neo =
  diem mousedown) · du lieu to khong qua IPC.
- SO 9 LOI TAI DIEN + 4 harness (`AiO Shotandsave/CLAUDE.md`).

## Build

Can: rustup (stable-msvc) + VS Build Tools C++ (cai 31/08 may nha · 01/09 may
cong ty, qua winget) + WebView2 (Win11 co san). Chay: `cargo run` trong
`src-tauri/` (frontend la file tinh, khong can dev server / npm).
Build release lan dau ~5 phut; `cargo build --release` -> exe o
`src-tauri/target/release/`.
