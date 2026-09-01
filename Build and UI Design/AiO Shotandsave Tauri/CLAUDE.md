# AiO Shot & Save — ban TAURI 2 (Rust + webview, Win + Mac)

Anh Tien chot 31/08/2026: cong nghe di theo cho tool chup man hinh la Tauri 2
(sau chuoi loi kien truc Electron — xem so 9 loi ben `AiO Shotandsave/CLAUDE.md`).
Ban Electron 0.4.2 DONG BANG, van la ban anh dang dung hang ngay; ban nay chi
thay the khi qua du harness + anh cham DAT.

## Giai doan hien tai: PORT 0.5.0 — KHUNG DAY DU, van hanh Y CHANG ban Electron

> Anh Tien chot 01/09: *"lam ban moi phai giong y chang ban cu ve cach van
> hanh va tung nut bam trong setting"*. Cach lam: **UI (HTML/CSS/JS) COPY
> NGUYEN VAN** tu `../AiO Shotandsave/src/` — overlay.js/pin.js/shelf.js/
> settings.js/i18n.js khong sua logic (i18n chi boc IIFE + doi dong xuat).
> `ui/bridge.js` gia lap dung API cua 4 preload; Rust (main.rs/chup.rs/
> trang.rs) port 1:1 tu main.js + kho.js. Sua UI o ban GOC Electron thi
> copy sang + build lai (frontendDist NUONG VAO exe — xem bay 11).

### DA DO DAT 01/09 (may cong ty 2 man 4K@150% + 2K@125%, release build)

| Kiem | Ket qua |
|---|---|
| Chup 1 man: keo chon -> annotate -> Enter | ✅ rect dung tung px (neo mousedown), luu file that. grab 2 man **141-152ms** (Electron ~880ms) |
| Do muot keo chon | ✅ 66 khung, **gap-max 18ms** (nguong giat cu ~880ms) |
| Vat 2 man (composite) | ✅ 900x200 dung tung px, ghep phys 1:1 tu 2 man khac DPI, mo anh doc bang mat co noi dung 2 man |
| Khay | ✅ them o + dem + tooltip kich thuoc/KB + kieu doc/ngang (dung lai cua so, item con nguyen) + keo bar di chuyen **KHONG phinh** (252x448 giu nguyen sau 40 buoc — loi tai dien #4 Electron khong tai dien) |
| Keo-tha ra Explorer | ✅ file PNG that roi vao thu muc dich (tu khay) |
| Ghim | ✅ click o khay -> pin dung kich thuoc DIP (600px/1.5 = 400), ve khung -> Luu ghi de file that (60957->61139 bytes), copy -> clipboard co anh 600x401 |
| Settings — TUNG NUT | ✅ keycaps · Doi phim (luu NGAY khi nhan to hop, nhay xanh, im lang) · Ve mac dinh · JPEG/PNG (PNG lam mo hang chat luong; file sau doi ra .png that) · Thap/Cao/Sieu · khay Mac dinh/Doc · VI/EN (reload moi cua so, dich het, khay GIU item) · duong dan + Mo/Doi thu muc · footer v0.5.0 |
| Hotkey | ✅ doi Ctrl+Shift+D qua UI -> bam phim THAT mo overlay; Esc huy sach |
| Config | ✅ cau-hinh.json (APPDATA/com.aiostudio.shotandsave.tauri) ghi atomic, doc lai dung |

### CHUA DO (duong code y het Electron, 1-dong emit — nhung chua co so)
- Nut X bo o khay / Don khay / An khay · savePos khoi phuc vi tri sau restart
- Doi thu muc luu qua hop thoai that (dialog plugin, blocking_pick_folder)
- Notification khi phim bi app khac giu luc boot
- Pin: keo di chuyen (dung chung duong voi khay da DAT) · Ctrl+lan doi mo
  (lam bang CSS opacity — Tauri khong co setOpacity cua so; mat nhin y het)
- Keo-tha tu PIN ra app khac (cung keoFileRa voi khay da DAT)
- May it man / man doi cau hinh giua chung · cai may sach

### Khac biet CO Y so voi Electron (deu vo hinh voi nguoi dung)
1. Overlay TAO SAN + HIDE + reload (Electron tao moi moi lan) — am 13ms.
2. Khay sau reload (doi ngon ngu) VE LAI item tu nguon chan ly — Electron
   reload xong khay TRONG (bug goc), day la sua tot hon, anh Tien khong thay khac.
3. Pin opacity = CSS body opacity (cua so von trong suot).
4. viTriKhay luu PIXEL VAT LY (Electron DIP) — config o app id khac, khong dung cham.

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
9. **(01/09) `onEvent` la KEY BAT BUOC cua start_drag** — thieu la loi
   "missing required key onEvent" va cu keo chet im (bridge tung nuot loi
   trong .catch rong — moi loi JS/promise gio ghi ve run-log qua ui_log).
10. **(01/09) OLE drag ben Tauri KHONG nuot mouseup cua webview** — tha xong
   lot mot cu CLICK vao o vua keo (khay: bung nham cua so ghim). Electron
   khong bi. bridge chan click capture-once ngay khi bat dau keoFileRa.
11. **(01/09) frontendDist NUONG VAO exe luc build** — sua file trong ui/ ma
   khong `cargo build` lai thi app van chay ban CU (da vap: sua i18n xong
   chay lai van loi y nguyen). Sua UI = build lai, ke ca debug.
12. **(01/09) Tao cua so tu trong LENH (IPC/main thread) ket o about:blank** —
   pin tao tu shelf_pin command khong bao gio nap trang; day sang
   `std::thread::spawn` (nhu duong selftest) la chay. Moi cho tao cua so tu
   command deu phai qua thread rieng.
13. **(01/09) i18n.js phai boc IIFE** — `function t` cua no dung ten `const t`
   trong overlay.js/shelf.js khi cung nap mot trang (Electron nap i18n trong
   preload nen khong dung). Loi "Identifier 't' has already been declared".
14. **(01/09) CDP /json cua WebView2 cham cap nhat target moi** — cua so vua
   tao co the chua hien trong danh sach du trang DA nap (log ui bao nap xong).
   Harness phai retry/moi lai; dung voi ket luan "cua so khong mo".
15. **☠️☠️ (01/09) THUOC gia lap chuot phai PMv2** — `SetProcessDPIAware()`
   (API cu) chi la SYSTEM-aware: SetCursorPos tren MAN PHU dat toa do AO
   (lech 1,5/1,25 = 1,2 lan) -> vung vat 2 man ra 800x17 va suyt do oan cho
   app (app doc DUNG). Man chinh thi 2 he trung nhau nen moi test 1 man deu
   xanh gia. Harness PHAI `SetThreadDpiAwarenessContext(-4)` (PMv2). App
   cung tu ep PMv2 dau main() cho chac. Ho hang 5u/5y: thuoc sai truoc.

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
