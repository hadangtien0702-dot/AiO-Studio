// AiO Shot & Save — SPIKE Tauri 2 (31/08/2026, anh Tien chot di Tauri)
// Do 4 diem bang SO truoc khi cam ket port full (ghi spike-ket-qua.txt):
//   1. overlay trong suot hien tren MOI man (khac DPI) — bao nhieu ms?
//   2. chup man tu Rust (xcap) — bao nhieu ms moi man? (Electron: ~400-880ms)
//   3. keo-tha file ra app khac — (vong sau, can plugin drag)
//   4. phim tat toan cuc + tray — dang ky OK khong?
// Ctrl+Shift+F10: mo/dong lai overlay de do them bang tay.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fmt::Write as _;
use std::io::Write as _;
use std::time::Instant;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

fn duong_ket_qua() -> std::path::PathBuf {
    // canh thu muc du an (cha cua src-tauri), nhu .run-log ban Electron
    let mut p = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    p.pop();
    p.push("spike-ket-qua.txt");
    p
}

fn ghi(msg: &str) {
    let dong = format!("{}\n", msg);
    print!("{}", dong);
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(duong_ket_qua())
    {
        let _ = f.write_all(dong.as_bytes());
    }
}

/// Diem do 1: mo mot cua so webview TRONG SUOT phu kin TUNG man. Tra ve ms.
/// Cua so DA CO (dang an) thi chi show lai — do duoc duong "AM" (chien luoc
/// san pham: tao san luc boot, hotkey chi hien -> tuc thi).
fn mo_overlays(app: &tauri::AppHandle) -> tauri::Result<u128> {
    let t0 = Instant::now();
    let monitors = app.available_monitors()?;
    for (i, m) in monitors.iter().enumerate() {
        let label = format!("overlay{}", i);
        if let Some(w) = app.get_webview_window(&label) {
            w.show()?;
            continue;
        }
        let win = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("overlay.html".into()))
            .transparent(true)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .visible(false)
            .build()?;
        // Dat vi tri/kich thuoc bang PIXEL VAT LY cua man that (bai hoc Electron:
        // workArea/DPI le lam hut kich thuoc — do sau khi dat, hut la ghi log).
        win.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: m.position().x,
            y: m.position().y,
        }))?;
        win.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: m.size().width,
            height: m.size().height,
        }))?;
        win.show()?;
        // So INNER (vung ve that) — outer tinh ca bong/vien vo hinh nen to hon
        // vai px, khong phai hut (do 22:42: outer 5138x2170 khi inner dung 5120x2160).
        let b = win.inner_size()?;
        if b.width < m.size().width || b.height < m.size().height {
            ghi(&format!(
                "  CANH BAO overlay{} HUT: xin {}x{} duoc {}x{}",
                i, m.size().width, m.size().height, b.width, b.height
            ));
        }
    }
    Ok(t0.elapsed().as_millis())
}

/// AN thay vi DONG: cua so song san -> lan hien sau tuc thi, va vong su kien
/// luon co cua so (nghi van hotkey cam khi app 0 cua so, 22:55).
fn dong_overlays(app: &tauri::AppHandle) {
    for (_, w) in app.webview_windows() {
        if w.label().starts_with("overlay") {
            let _ = w.hide();
        }
    }
}

/// Diem do 2: chup TUNG man bang xcap, 3 vong (vong 1 = lanh, sau = am).
fn do_chup() {
    match xcap::Monitor::all() {
        Ok(mons) => {
            for vong in 1..=3 {
                let mut dong = format!("  chup vong {}:", vong);
                for m in &mons {
                    let t = Instant::now();
                    match m.capture_image() {
                        Ok(anh) => {
                            let _ = write!(
                                dong,
                                " {}x{}={}ms",
                                anh.width(),
                                anh.height(),
                                t.elapsed().as_millis()
                            );
                        }
                        Err(e) => {
                            let _ = write!(dong, " LOI({})", e);
                        }
                    }
                }
                ghi(&dong);
            }
        }
        Err(e) => ghi(&format!("  chup LOI: khong liet ke duoc man ({})", e)),
    }
}

/// Mo/dong overlay tu bat ky nguon kich hoat nao (hotkey / tray menu) — log
/// kem NGUON de khoanh vung duong nao chay duong nao khong.
fn chuyen_overlay(app: &tauri::AppHandle, nguon: &str) {
    // xet DANG HIEN, khong phai ton tai — overlay gio an chu khong dong
    let co = app.webview_windows().values().any(|w| {
        w.label().starts_with("overlay") && w.is_visible().unwrap_or(false)
    });
    if co {
        dong_overlays(app);
        ghi(&format!("[{}] DONG overlay", nguon));
    } else {
        match mo_overlays(app) {
            Ok(ms) => ghi(&format!("[{}] MO overlay (AM) = {}ms", nguon, ms)),
            Err(e) => ghi(&format!("[{}] MO overlay LOI: {}", nguon, e)),
        }
    }
}

/// Cho UI ghi vao spike-ket-qua.txt (ket qua Dropped/Cancelled cua keo-tha).
#[tauri::command]
fn ghi_log(msg: String) {
    ghi(&msg);
}

/// Diem do 3 (chuan bi): chup man CHINH -> PNG that tren dia + icon thumbnail
/// 96px cho preview keo (Electron cung bat buoc icon khong rong). Do RIENG
/// chup vs encode+ghi — Electron 880ms la tron ca hai, 79ms hom qua chi la chup.
#[tauri::command]
fn luu_anh_keo() -> Result<serde_json::Value, String> {
    let mons = xcap::Monitor::all().map_err(|e| e.to_string())?;
    let m = mons.first().ok_or("khong co man nao")?;
    let t0 = Instant::now();
    let anh = m.capture_image().map_err(|e| e.to_string())?;
    let ms_chup = t0.elapsed().as_millis();

    let duong = duong_ket_qua().with_file_name("spike-keo-tha.png");
    let duong_icon = duong_ket_qua().with_file_name("spike-keo-tha-icon.png");
    let t1 = Instant::now();
    anh.save(&duong).map_err(|e| e.to_string())?;
    let ms_ghi = t1.elapsed().as_millis();
    let rong = (anh.width() * 96 / anh.height().max(1)).max(1);
    let icon = image::imageops::thumbnail(&anh, rong, 96);
    icon.save(&duong_icon).map_err(|e| e.to_string())?;

    ghi(&format!(
        "  [keo-tha] anh {}x{}: chup {}ms + encode/ghi PNG {}ms -> {}",
        anh.width(),
        anh.height(),
        ms_chup,
        ms_ghi,
        duong.display()
    ));
    Ok(serde_json::json!({
        "duong": duong.to_string_lossy(),
        "icon": duong_icon.to_string_lossy(),
        "msChup": ms_chup,
        "msGhi": ms_ghi,
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_drag::init())
        .invoke_handler(tauri::generate_handler![ghi_log, luu_anh_keo])
        .setup(|app| {
            ghi("");
            ghi(&format!(
                "=== SPIKE {} ===",
                chrono_gio()
            ));

            // Diem do 4a: tray + MENU (chuot phai) — duong kich hoat khong le
            // thuoc hotkey (22:50: anh Tien bam Ctrl+Shift+F10 that khong an)
            {
                use tauri::menu::{MenuBuilder, MenuItemBuilder};
                let mo = MenuItemBuilder::with_id("mo", "Mo / Dong overlay").build(app)?;
                let thoat = MenuItemBuilder::with_id("thoat", "Thoat spike").build(app)?;
                let menu = MenuBuilder::new(app).items(&[&mo, &thoat]).build()?;
                match tauri::tray::TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .tooltip("AiO Shot Tauri Spike — chuot phai de mo overlay")
                    .menu(&menu)
                    .on_menu_event(|app, e| match e.id().as_ref() {
                        "mo" => chuyen_overlay(app, "tray-menu"),
                        "thoat" => {
                            ghi("thoat tu tray menu");
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .build(app)
                {
                    Ok(_) => ghi("tray + menu: OK"),
                    Err(e) => ghi(&format!("tray: LOI {}", e)),
                }
            }

            // Diem do 4b: phim tat toan cuc — dang ky HAI to hop de khoanh vung
            // (22:50 F10 that khong an): F10 la phim he thong, Space thi khong.
            // Log ghi ro phim nao ban de biet loi o PHIM hay o PLUGIN.
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            for phim in ["ctrl+shift+f10", "ctrl+shift+space"] {
                let ten = phim.to_string();
                match app.global_shortcut().on_shortcut(phim, move |app, _s, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        chuyen_overlay(app, &ten);
                    }
                }) {
                    Ok(_) => ghi(&format!("hotkey {}: dang ky OK", phim)),
                    Err(e) => ghi(&format!("hotkey {}: dang ky LOI {}", phim, e)),
                }
            }

            // Diem do 3: cua so NHO rieng cho keo-tha (overlay phu kin man thi
            // khong con cho de tha — san pham that cung keo tu cua so ghim/khay,
            // khong keo tu overlay). Co vien de anh Tien tu keo di / dong duoc.
            match WebviewWindowBuilder::new(
                app,
                "keospike",
                WebviewUrl::App("keo.html".into()),
            )
            .title("AiO Spike — keo tha (diem do 3)")
            .inner_size(400.0, 190.0)
            .always_on_top(true)
            .build()
            {
                Ok(_) => ghi("cua so keo-tha: OK"),
                Err(e) => ghi(&format!("cua so keo-tha: LOI {}", e)),
            }

            // Diem do 1: overlay tuc thi (tu chay 1 lan luc boot)
            let handle = app.handle().clone();
            match mo_overlays(&handle) {
                Ok(ms) => ghi(&format!(
                    "overlay: mo tren {} man = {}ms (Electron ~165ms)",
                    handle.available_monitors().map(|m| m.len()).unwrap_or(0),
                    ms
                )),
                Err(e) => ghi(&format!("overlay: LOI {}", e)),
            }

            // Diem do 2: chup — chay o THREAD RIENG (dung nhu kien truc dich:
            // capture khong bao gio cham vao luong UI)
            let handle2 = app.handle().clone();
            std::thread::spawn(move || {
                ghi("chup man tu Rust (xcap), 3 vong — vong 1 la lanh:");
                do_chup();
                // xong phan tu dong: dong overlay sau 1,5s de nguoi dung thay no da hien
                std::thread::sleep(std::time::Duration::from_millis(1500));
                dong_overlays(&handle2);
                ghi("spike tu dong XONG — app van chay o tray, Ctrl+Shift+F10 de do lai tay.");
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("loi chay app spike");
}

/// Gio dia phuong don gian (khong keo them crate chrono cho spike).
fn chrono_gio() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let s = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // +7h gio VN — spike chay tren may anh Tien; log chinh xac phut la du
    let s = s + 7 * 3600;
    format!(
        "{:02}:{:02}:{:02} (gio VN)",
        (s / 3600) % 24,
        (s / 60) % 60,
        s % 60
    )
}
