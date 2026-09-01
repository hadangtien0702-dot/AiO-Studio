// AiO Shot & Save — ban TAURI 2. Van hanh Y CHANG ban Electron 0.4.2:
// UI (HTML/CSS/JS) copy nguyen van, bridge.js thay preload, file nay + chup.rs
// + trang.rs thay main.js. Moi khac biet co y deu ghi chu ro.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod chup;
mod trang;

use chup::*;
use serde_json::json;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use trang::*;

const DEFAULT_HOTKEY: &str = "CommandOrControl+Shift+S";

/* ── i18n phia Rust (tray + notification) — chuoi GIONG HET i18n.js ────── */

fn t_rust(lang: &str, key: &str) -> &'static str {
    let vi = match key {
        "tray.chup" => "Chụp vùng chọn",
        "tray.khay" => "Hiện khay ảnh",
        "tray.moThuMuc" => "Mở thư mục lưu ảnh",
        "tray.caiDat" => "Cài đặt…",
        "tray.thoat" => "Thoát",
        "app.phimBiGiu" => "Phím tắt chụp {phim} đang bị ứng dụng khác giữ — bấm sẽ không ăn. Mở Cài đặt để đổi phím.",
        _ => "",
    };
    if lang != "en" { return vi }
    match key {
        "tray.chup" => "Capture area",
        "tray.khay" => "Show shelf",
        "tray.moThuMuc" => "Open save folder",
        "tray.caiDat" => "Settings…",
        "tray.thoat" => "Quit",
        "app.phimBiGiu" => "Capture shortcut {phim} is taken by another app — pressing it won't work. Open Settings to change it.",
        _ => vi,
    }
}

/* ── Phim tat: accelerator KIEU ELECTRON (luu config + hien thi) <-> chuoi
   global_hotkey (dang ky). Giu dinh dang Electron lam nguon chan ly de
   settings.js (nguyen van) van doc/ghi dung. ─────────────────────────── */

fn accel_sang_ghk(accel: &str) -> Option<String> {
    let mut ra = Vec::new();
    for phan in accel.split('+') {
        let p = match phan {
            "CommandOrControl" | "CmdOrCtrl" | "Ctrl" | "Control" => "Control".into(),
            "Cmd" | "Command" => "Super".into(),
            "Alt" | "Option" => "Alt".into(),
            "Shift" => "Shift".into(),
            "Space" => "Space".into(),
            "PrintScreen" => "PrintScreen".into(),
            x if x.len() == 1 && x.chars().next().unwrap().is_ascii_uppercase() => format!("Key{}", x),
            x if x.len() == 1 && x.chars().next().unwrap().is_ascii_digit() => format!("Digit{}", x),
            x if x.starts_with("num") && x.len() == 4 => format!("Numpad{}", &x[3..]),
            x if x.starts_with('F') && x[1..].parse::<u8>().map(|n| (1..=24).contains(&n)).unwrap_or(false) => x.into(),
            "`" => "Backquote".into(), "-" => "Minus".into(), "=" => "Equal".into(),
            "[" => "BracketLeft".into(), "]" => "BracketRight".into(), "\\" => "Backslash".into(),
            ";" => "Semicolon".into(), "'" => "Quote".into(), "," => "Comma".into(),
            "." => "Period".into(), "/" => "Slash".into(),
            _ => return None,
        };
        ra.push(p);
    }
    Some(ra.join("+"))
}

/// formatAccel cua Electron (Windows): CommandOrControl -> Ctrl, ghep " + ".
fn hien_thi_phim(accel: &str) -> String {
    accel.split('+').map(|x| match x {
        "CommandOrControl" | "CmdOrCtrl" | "Ctrl" | "Control" => "Ctrl",
        "Cmd" | "Command" => "⌘",
        "Alt" | "Option" => "Alt",
        "Shift" => "Shift",
        k => k,
    }).collect::<Vec<_>>().join(" + ")
}

fn dang_ky_phim(app: &AppHandle, accel: &str) -> bool {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    let Some(ghk) = accel_sang_ghk(accel) else { return false };
    app.global_shortcut()
        .on_shortcut(ghk.as_str(), |app, _s, ev| {
            if ev.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                bat_dau_chup(app);
            }
        })
        .is_ok()
}

fn go_phim(app: &AppHandle, accel: &str) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    if let Some(ghk) = accel_sang_ghk(accel) {
        let _ = app.global_shortcut().unregister(ghk.as_str());
    }
}

/// Doi phim: that bai (app khac giu) thi KHOI PHUC phim cu (port setHotkey).
fn dat_phim(app: &AppHandle, accel: &str) -> serde_json::Value {
    let cu = { app.state::<ArcTrang>().lock().unwrap().hotkey.clone() };
    go_phim(app, &cu);
    if !dang_ky_phim(app, accel) {
        let _ = dang_ky_phim(app, &cu);
        ghi_log(&format!("doi phim {} -> {} FAIL (bi giu), giu phim cu", cu, accel));
        return json!({ "ok": false, "hotkey": cu });
    }
    {
        app.state::<ArcTrang>().lock().unwrap().hotkey = accel.to_string();
    }
    ghi_cau_hinh(app, |c| c.hotkey = Some(accel.to_string()));
    dung_tray_menu(app);
    ghi_log(&format!("doi phim {} -> {} OK, da luu config", cu, accel));
    json!({ "ok": true, "hotkey": accel })
}

/* ── Tray ──────────────────────────────────────────────────────────────── */

fn dung_tray_menu(app: &AppHandle) {
    use tauri::menu::{MenuBuilder, MenuItemBuilder};
    let (lang, hotkey) = {
        let t = app.state::<ArcTrang>();
        let t = t.lock().unwrap();
        (t.lang.clone(), t.hotkey.clone())
    };
    let tr = |k: &str| t_rust(&lang, k).to_string();
    let ver = app.package_info().version.to_string();
    let ket_qua = (|| -> tauri::Result<()> {
        let chup_item = MenuItemBuilder::with_id("chup", tr("tray.chup"))
            .accelerator(hien_thi_phim(&hotkey)).build(app)?;
        let khay = MenuItemBuilder::with_id("khay", tr("tray.khay")).build(app)?;
        let thu_muc = MenuItemBuilder::with_id("thumuc", tr("tray.moThuMuc")).build(app)?;
        let cai_dat = MenuItemBuilder::with_id("caidat", tr("tray.caiDat")).build(app)?;
        let phien_ban = MenuItemBuilder::with_id("ver", format!("AiO Shot & Save  v{}", ver))
            .enabled(false).build(app)?;
        let thoat = MenuItemBuilder::with_id("thoat", tr("tray.thoat")).build(app)?;
        let menu = MenuBuilder::new(app)
            .items(&[&chup_item]).separator()
            .items(&[&khay, &thu_muc]).separator()
            .items(&[&cai_dat]).separator()
            .items(&[&phien_ban]).separator()
            .items(&[&thoat])
            .build()?;
        if let Some(tray) = app.tray_by_id("main") {
            tray.set_menu(Some(menu))?;
        }
        Ok(())
    })();
    if let Err(e) = ket_qua { ghi_log(&format!("tray menu LOI: {}", e)); }
}

fn tao_tray(app: &AppHandle) {
    use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png"))
        .unwrap_or_else(|_| app.default_window_icon().unwrap().clone());
    let kq = TrayIconBuilder::with_id("main")
        .icon(icon)
        .tooltip("AiO Shot & Save")
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, ev| {
            // Bam TRAI vao tray = chup ngay (nhu Electron tray.on('click')).
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = ev {
                bat_dau_chup(tray.app_handle());
            }
        })
        .on_menu_event(|app, e| match e.id().as_ref() {
            "chup" => bat_dau_chup(app),
            "khay" => hien_khay(app),
            "thumuc" => mo_thu_muc(app),
            "caidat" => mo_cai_dat(app),
            "thoat" => { ghi_log("thoat tu tray menu"); app.exit(0) }
            _ => {}
        })
        .build(app);
    match kq {
        Ok(_) => dung_tray_menu(app),
        Err(e) => ghi_log(&format!("tray LOI: {}", e)),
    }
}

fn mo_thu_muc(app: &AppHandle) {
    use tauri_plugin_opener::OpenerExt;
    let dir = bao_dam_thu_muc(&thu_muc_anh(&doc_cau_hinh(app)));
    let _ = app.opener().open_path(dir.to_string_lossy(), None::<&str>);
}

/* ── Cua so Cai dat ────────────────────────────────────────────────────── */

fn mo_cai_dat(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.show();
        let _ = w.set_focus();
        return;
    }
    let kq = WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("settings/index.html".into()))
        .title("AiO Shot & Save - Cai dat")
        .inner_size(440.0, 700.0)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .decorations(false)
        .center()
        .build();
    if let Err(e) = kq { ghi_log(&format!("mo cai dat LOI: {}", e)); }
}

/* ── Lenh (bridge.js goi) ──────────────────────────────────────────────── */

#[tauri::command]
fn boot_info(app: AppHandle) -> serde_json::Value {
    let (lang, hotkey) = {
        let t = app.state::<ArcTrang>();
        let t = t.lock().unwrap();
        (t.lang.clone(), t.hotkey.clone())
    };
    json!({
        "lang": lang,
        "hotkeyDisplay": hien_thi_phim(&hotkey),
        "khayKieu": kieu_khay(&app),
    })
}

#[tauri::command]
fn win_ready(app: AppHandle, window: tauri::WebviewWindow) {
    let label = window.label().to_string();
    if label == "shelf" {
        // Khay ve lai tu NGUON CHAN LY (sau reload doi ngon ngu / doi kieu):
        // bo hang doi (tranh add trung), phat lai toan bo item.
        let items: Vec<serde_json::Value> = {
            let t = app.state::<ArcTrang>();
            let mut t = t.lock().unwrap();
            t.cho.remove("shelf");
            t.ready.insert(label.clone());
            t.khay.iter().map(|(id, it)| chup::goi_khay_item(*id, it)).collect()
        };
        use tauri::Emitter;
        for j in items { let _ = app.emit_to("shelf", "shelf:add", j); }
        return;
    }
    if label.starts_with("pin") {
        // Ghim sau reload: phat lai pin:data tu trang thai.
        let data = {
            let t = app.state::<ArcTrang>();
            let mut t = t.lock().unwrap();
            t.cho.remove(&label);
            t.ready.insert(label.clone());
            t.ghims.get(&label).map(|g| json!({
                "dataUrl": format!("http://aioshot.localhost/pin/{}.png", label),
                "pad": PIN_PAD, "w": g.dip_w, "h": g.dip_h,
            }))
        };
        if let Some(d) = data {
            use tauri::Emitter;
            let _ = app.emit_to(label.as_str(), "pin:data", d);
        }
        return;
    }
    chup::cua_so_ready(&app, &label);
}

#[tauri::command]
fn overlay_confirm(app: AppHandle, window: tauri::WebviewWindow, payload: serde_json::Value) {
    // Thread rieng: duong rect co the CHO grab (den 15s tren debug build) —
    // khong duoc chan thread lenh/main.
    let label = window.label().to_string();
    std::thread::spawn(move || xac_nhan(&app, &label, payload));
}

/// Nhat ky tu bridge/UI (moi cua so) — de loi JS khong chet cam.
#[tauri::command]
fn ui_log(window: tauri::WebviewWindow, msg: String) {
    ghi_log(&format!("[ui {}] {}", window.label(), msg));
}

#[tauri::command]
fn overlay_cancel(app: AppHandle) { huy_chup(&app); }

#[tauri::command]
fn overlay_drag_start(app: AppHandle, window: tauri::WebviewWindow, x: f64, y: f64) {
    keo_bat_dau(&app, window.label(), x, y);
}

#[tauri::command]
fn overlay_drag_end(app: AppHandle) { keo_ket_thuc(&app); }

#[tauri::command]
fn overlay_lock(app: AppHandle, window: tauri::WebviewWindow) {
    use tauri::Emitter;
    let n = { app.state::<ArcTrang>().lock().unwrap().mans.len() };
    for i in 0..n {
        let label = format!("overlay{}", i);
        if label != window.label() {
            let _ = app.emit_to(label.as_str(), "overlay:locked", json!({}));
        }
    }
}

#[tauri::command]
fn overlay_log(msg: String) { ghi_log(&format!("[overlay] {}", msg)); }

/* — Ghim — */

#[tauri::command]
fn pin_copy(app: AppHandle, window: tauri::WebviewWindow) {
    let img = {
        let t = app.state::<ArcTrang>();
        let t = t.lock().unwrap();
        t.ghims.get(window.label()).map(|g| g.img.clone())
    };
    if let Some(img) = img { copy_clipboard(&app, &img); }
}

#[tauri::command]
fn pin_close(app: AppHandle, window: tauri::WebviewWindow) {
    {
        let t = app.state::<ArcTrang>();
        let mut t = t.lock().unwrap();
        t.ghims.remove(window.label());
        t.ready.remove(window.label());
        t.cho.remove(window.label());
    }
    let _ = window.close();
}

#[tauri::command]
fn pin_drag_info(app: AppHandle, window: tauri::WebviewWindow) -> serde_json::Value {
    let t = app.state::<ArcTrang>();
    let t = t.lock().unwrap();
    match t.ghims.get(window.label()) {
        Some(g) => json!({
            "path": g.path.as_ref().map(|p| p.to_string_lossy().to_string()),
            "icon": g.icon.to_string_lossy(),
        }),
        None => json!({}),
    }
}

#[tauri::command]
fn pin_save_edit(app: AppHandle, window: tauri::WebviewWindow, data_url: String) {
    ghim_luu_ve(&app, window.label(), &data_url);
}

/* — Keo di chuyen cua so (pin + khay) — */

#[tauri::command]
fn win_drag_start(app: AppHandle, window: tauri::WebviewWindow) {
    cua_so_keo_bat_dau(&app, &window);
}

#[tauri::command]
fn win_drag_to(app: AppHandle, window: tauri::WebviewWindow, dx: f64, dy: f64) {
    cua_so_keo_den(&app, &window, dx, dy);
}

#[tauri::command]
fn win_drag_end(app: AppHandle, window: tauri::WebviewWindow) {
    cua_so_keo_xong(&app, &window);
}

/* — Khay — */

#[tauri::command]
fn shelf_pin(app: AppHandle, id: u32) {
    // Thread rieng: tao cua so tu trong lenh (chay tren main/IPC thread) tung
    // lam webview ket o about:blank — duong selftest (thread rieng) chay dung.
    std::thread::spawn(move || ghim_tu_khay(&app, id));
}

#[tauri::command]
fn shelf_drag_info(app: AppHandle, id: u32) -> serde_json::Value {
    let t = app.state::<ArcTrang>();
    let t = t.lock().unwrap();
    match t.khay.get(&id) {
        Some(it) => json!({
            "path": it.path.to_string_lossy(),
            "icon": it.icon.to_string_lossy(),
        }),
        None => json!({}),
    }
}

#[tauri::command]
fn shelf_remove(app: AppHandle, id: u32) {
    use tauri::Emitter;
    // CHI bo khoi khay — file tren dia GIU NGUYEN (luat Electron).
    {
        let t = app.state::<ArcTrang>();
        t.lock().unwrap().khay.remove(&id);
    }
    let _ = app.emit_to("shelf", "shelf:removed", json!(id));
}

#[tauri::command]
fn shelf_clear(app: AppHandle) {
    use tauri::Emitter;
    {
        let t = app.state::<ArcTrang>();
        t.lock().unwrap().khay.clear();
    }
    let _ = app.emit_to("shelf", "shelf:cleared", json!({}));
}

#[tauri::command]
fn shelf_hide(app: AppHandle) {
    if let Some(w) = app.get_webview_window("shelf") { let _ = w.hide(); }
}

#[tauri::command]
fn shelf_save_pos(app: AppHandle) {
    if let Some(w) = app.get_webview_window("shelf") {
        if let Ok(p) = w.outer_position() {
            ghi_cau_hinh(&app, |c| c.vi_tri_khay = Some(ViTri { x: p.x, y: p.y }));
        }
    }
}

#[tauri::command]
fn mo_thu_muc_luu(app: AppHandle) { mo_thu_muc(&app); }

/* — Cai dat — */

#[tauri::command]
fn settings_get(app: AppHandle) -> serde_json::Value {
    let cfg = doc_cau_hinh(&app);
    let (lang, hotkey) = {
        let t = app.state::<ArcTrang>();
        let t = t.lock().unwrap();
        (t.lang.clone(), t.hotkey.clone())
    };
    let anh_loai = if cfg.anh_loai.as_deref() == Some("png") { "png" } else { "jpeg" };
    let cl = match cfg.anh_chat_luong.as_deref() {
        Some(x @ ("thap" | "cao" | "sieu")) => x,
        _ => "cao",
    };
    json!({
        "hotkey": hotkey,
        "def": DEFAULT_HOTKEY,
        "isMac": cfg!(target_os = "macos"),
        "saveFolder": thu_muc_anh(&cfg).to_string_lossy(),
        "lang": lang,
        "version": app.package_info().version.to_string(),
        "anhLoai": anh_loai,
        "anhChatLuong": cl,
        "khayKieu": kieu_khay(&app),
    })
}

#[tauri::command]
fn settings_set_hotkey(app: AppHandle, accel: String) -> serde_json::Value {
    dat_phim(&app, &accel)
}

#[tauri::command]
fn settings_reset(app: AppHandle) -> serde_json::Value {
    dat_phim(&app, DEFAULT_HOTKEY)
}

#[tauri::command]
async fn settings_pick_folder(app: AppHandle) -> serde_json::Value {
    use tauri_plugin_dialog::DialogExt;
    let hien_tai = thu_muc_anh(&doc_cau_hinh(&app));
    let chon = app.dialog().file().set_directory(&hien_tai).blocking_pick_folder();
    match chon.and_then(|f| f.into_path().ok()) {
        Some(p) => {
            ghi_cau_hinh(&app, |c| c.thu_muc_anh = Some(p.to_string_lossy().to_string()));
            json!({ "folder": p.to_string_lossy() })
        }
        None => json!({ "folder": hien_tai.to_string_lossy(), "huy": true }),
    }
}

#[tauri::command]
fn settings_set_anh(app: AppHandle, d: serde_json::Value) {
    let loai = d.get("anhLoai").and_then(|v| v.as_str()).map(|s| s.to_string());
    let cl = d.get("anhChatLuong").and_then(|v| v.as_str()).map(|s| s.to_string());
    ghi_cau_hinh(&app, |c| {
        if let Some(l) = &loai { if l == "png" || l == "jpeg" { c.anh_loai = Some(l.clone()); } }
        if let Some(x) = &cl { if ["thap", "cao", "sieu"].contains(&x.as_str()) { c.anh_chat_luong = Some(x.clone()); } }
    });
    ghi_log(&format!("doi dinh dang anh: {:?} {:?}", loai, cl));
}

#[tauri::command]
fn settings_set_khay(app: AppHandle, kieu: String) -> serde_json::Value {
    let k = if kieu == "doc" { "doc" } else { "ngang" };
    ghi_cau_hinh(&app, |c| c.khay_kieu = Some(k.to_string()));
    ghi_log(&format!("doi kieu khay: {}", k));
    khay_dung_lai(&app);
    json!({ "khayKieu": k })
}

#[tauri::command]
fn settings_set_lang(app: AppHandle, l: String) -> serde_json::Value {
    let lang = if l == "en" { "en" } else { "vi" };
    {
        app.state::<ArcTrang>().lock().unwrap().lang = lang.to_string();
    }
    ghi_cau_hinh(&app, |c| c.lang = Some(lang.to_string()));
    dung_tray_menu(&app);
    // NAP LAI cac cua so dang mo de dich lai (nhu Electron reload).
    for (_, w) in app.webview_windows() {
        let _ = w.eval("window.location.reload()");
    }
    json!({ "lang": lang })
}

#[tauri::command]
fn settings_close(app: AppHandle, window: tauri::WebviewWindow) {
    {
        let t = app.state::<ArcTrang>();
        let mut t = t.lock().unwrap();
        t.ready.remove(window.label());
        t.cho.remove(window.label());
    }
    let _ = window.close();
}

/* ── main ──────────────────────────────────────────────────────────────── */

fn main() {
    // ☠️ PER-MONITOR DPI V2 — PHAI goi TRUOC moi cua so (01/09, may 2 man
    // 150%/125%): khong co dong nay process chay system-DPI-aware, GetCursorPos
    // tren MAN PHU tra toa do AO (lech dung he so 1,5/1,25 = 1,2) -> vung chon
    // vat 2 man ra 800x17 thay vi 900x200. Man chinh thi trung khop nen moi
    // test 1 man deu xanh — bay chi lo khi cham man thu hai.
    #[cfg(windows)]
    unsafe {
        use windows::Win32::UI::HiDpi::{
            SetProcessDpiAwarenessContext, DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2,
        };
        let _ = SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
    }

    let selftest = std::env::args().any(|a| a == "--selftest");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // Ban thu hai = chup ngay (nhu Electron second-instance).
            // `--cai-dat`: mo Cai dat (cho harness tu dong — tray khong bam duoc bang script).
            if argv.iter().any(|a| a == "--cai-dat") { mo_cai_dat(app) } else { bat_dau_chup(app) }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_drag::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .register_uri_scheme_protocol("aioshot", |ctx, req| {
            // Phuc vu anh tu bo nho: /frozen/<gen>/<idx>.png · /pin/<label>.png
            // ACAO de canvas ghep (composite / luuVe) khong bi taint.
            let path = req.uri().path().to_string();
            let bytes: Option<Vec<u8>> = {
                let t = ctx.app_handle().state::<ArcTrang>();
                let t = t.lock().unwrap();
                if let Some(khoa) = path.strip_prefix("/frozen/").and_then(|p| p.strip_suffix(".png")) {
                    t.frozen.get(khoa).cloned()
                } else if let Some(label) = path.strip_prefix("/pin/").and_then(|p| p.strip_suffix(".png")) {
                    t.ghims.get(label).map(|g| ma_hoa_png(&g.img))
                } else { None }
            };
            match bytes {
                Some(b) => tauri::http::Response::builder()
                    .header("Content-Type", "image/png")
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Cache-Control", "max-age=60")
                    .body(b)
                    .unwrap(),
                None => tauri::http::Response::builder().status(404).body(Vec::new()).unwrap(),
            }
        })
        .manage(std::sync::Arc::new(std::sync::Mutex::new(Trang::default())) as ArcTrang)
        .invoke_handler(tauri::generate_handler![
            boot_info, win_ready, ui_log,
            overlay_confirm, overlay_cancel, overlay_drag_start, overlay_drag_end,
            overlay_lock, overlay_log,
            pin_copy, pin_close, pin_drag_info, pin_save_edit,
            win_drag_start, win_drag_to, win_drag_end,
            shelf_pin, shelf_drag_info, shelf_remove, shelf_clear, shelf_hide,
            shelf_save_pos, mo_thu_muc_luu,
            settings_get, settings_set_hotkey, settings_reset, settings_pick_folder,
            settings_set_anh, settings_set_khay, settings_set_lang, settings_close,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();
            let cfg = doc_cau_hinh(&handle);
            {
                let t = handle.state::<ArcTrang>();
                let mut t = t.lock().unwrap();
                t.hotkey = cfg.hotkey.clone().unwrap_or_else(|| DEFAULT_HOTKEY.to_string());
                t.lang = cfg.lang.clone().unwrap_or_else(|| "vi".to_string());
                t.selftest = selftest;
            }
            tao_tray(&handle);
            let hotkey = { handle.state::<ArcTrang>().lock().unwrap().hotkey.clone() };
            let ok_phim = dang_ky_phim(&handle, &hotkey);
            ghi_log(&format!(
                "boot v{} (tauri) hotkey={}{} dang-ky={} lang={}",
                handle.package_info().version,
                hotkey,
                if cfg.hotkey.is_some() { "(config)" } else { "(default)" },
                if ok_phim { "OK" } else { "FAIL" },
                { handle.state::<ArcTrang>().lock().unwrap().lang.clone() },
            ));
            if !ok_phim {
                use tauri_plugin_notification::NotificationExt;
                let lang = { handle.state::<ArcTrang>().lock().unwrap().lang.clone() };
                let body = t_rust(&lang, "app.phimBiGiu").replace("{phim}", &hien_thi_phim(&hotkey));
                let _ = handle.notification().builder().title("AiO Shot & Save").body(body).show();
            }
            // Overlay TAO SAN (an) — hotkey chi show, am 13ms (spike 31/08).
            cap_nhat_man(&handle);
            // App song o tray, khong tu mo cua so nao.

            if selftest {
                let h2 = handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(1200));
                    bat_dau_chup(&h2);
                    // Chot chan treo: 15s chua xong la loi
                    std::thread::sleep(std::time::Duration::from_millis(15000));
                    ghi_log("selftest QUA GIO — thoat 1");
                    h2.exit(1);
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("loi khoi tao app")
        .run(|_app, ev| {
            // Dong het cua so KHONG thoat app (song o tray) — mac dinh cua
            // tauri se thoat khi het cua so, phai chan ExitRequested.
            if let tauri::RunEvent::ExitRequested { api, code, .. } = ev {
                if code.is_none() { api.prevent_exit(); }
            }
        });
}
