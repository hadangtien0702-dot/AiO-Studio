// chup.rs — luong chup + keo chon + khay + ghim. Port 1:1 tu main.js Electron.
//
// Kien truc Tauri (tu spike 31/08-01/09):
// - Overlay TAO SAN luc boot, hotkey chi SHOW (am 13ms). HIDE + reload sau
//   moi lan chup de trang thai JS sach nhu Electron (Electron tao moi cua so).
// - Grab chay THREAD RIENG (xcap), anh di qua protocol aioshot:// — IPC chi
//   mang URL (luat "du lieu to khong qua IPC", may nha 31/08).
// - Keo chon: MAIN (Rust) theo doi chuot he thong 16ms phat sel-rect; man CHU
//   tu ve local (overlay.js nguyen van tu Electron da lo phan nay).

use crate::trang::*;
use image::RgbaImage;
use serde_json::json;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

pub const PIN_PAD: f64 = 12.0;
pub const SHELF_W: f64 = 380.0;
pub const SHELF_H: f64 = 128.0;
pub const SHELF_DOC_W: f64 = 252.0;
pub const SHELF_DOC_H: f64 = 448.0;
pub const SHELF_MARGIN: f64 = 16.0;

/* ── Windows helpers ───────────────────────────────────────────────────── */

#[cfg(windows)]
pub fn con_tro_phys() -> (i32, i32) {
    use windows::Win32::Foundation::POINT;
    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
    let mut p = POINT::default();
    unsafe { let _ = GetCursorPos(&mut p); }
    (p.x, p.y)
}

/// Hien cua so KHONG cuop focus (nhu showInactive cua Electron).
#[cfg(windows)]
pub fn hien_khong_focus(win: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
    if let Ok(h) = win.hwnd() {
        unsafe { let _ = ShowWindow(HWND(h.0 as *mut _), SW_SHOWNOACTIVATE); }
    }
}

/// workArea PHYS cua man chua diem (tru taskbar) — cho vi tri khay/ghim.
#[cfg(windows)]
pub fn work_area_phys(x: i32, y: i32) -> RectPhys {
    use windows::Win32::Foundation::POINT;
    use windows::Win32::Graphics::Gdi::{
        GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST,
    };
    let mon = unsafe { MonitorFromPoint(POINT { x, y }, MONITOR_DEFAULTTONEAREST) };
    let mut mi = MONITORINFO { cbSize: std::mem::size_of::<MONITORINFO>() as u32, ..Default::default() };
    let ok = unsafe { GetMonitorInfoW(mon, &mut mi) }.as_bool();
    if ok {
        RectPhys {
            x: mi.rcWork.left, y: mi.rcWork.top,
            w: mi.rcWork.right - mi.rcWork.left, h: mi.rcWork.bottom - mi.rcWork.top,
        }
    } else {
        RectPhys { x: 0, y: 0, w: 1920, h: 1080 }
    }
}

/* ── Emit co hang doi (doi cua so bao ready) ───────────────────────────── */

pub fn phat_hoac_doi(app: &AppHandle, label: &str, evt: &str, payload: serde_json::Value) {
    let trang = app.state::<ArcTrang>();
    let mut t = trang.lock().unwrap();
    if t.ready.contains(label) {
        drop(t);
        let _ = app.emit_to(label, evt, payload);
    } else {
        t.cho.entry(label.to_string()).or_default().push((evt.to_string(), payload));
    }
}

/// Cua so bao "listener gan xong" — xa hang doi.
pub fn cua_so_ready(app: &AppHandle, label: &str) {
    let trang = app.state::<ArcTrang>();
    let doi = {
        let mut t = trang.lock().unwrap();
        t.ready.insert(label.to_string());
        t.cho.remove(label).unwrap_or_default()
    };
    for (evt, payload) in doi {
        let _ = app.emit_to(label, &evt, payload);
    }
}

/* ── Man hinh + overlay tao san ────────────────────────────────────────── */

/// Doc danh sach man + bao dam moi man co MOT overlay (tao hidden neu thieu).
pub fn cap_nhat_man(app: &AppHandle) {
    let mons = app.available_monitors().unwrap_or_default();
    let mut mans = Vec::new();
    for m in &mons {
        mans.push(Man {
            px: m.position().x,
            py: m.position().y,
            pw: m.size().width,
            ph: m.size().height,
            sf: m.scale_factor(),
        });
    }
    for (i, man) in mans.iter().enumerate() {
        let label = format!("overlay{}", i);
        let win = match app.get_webview_window(&label) {
            Some(w) => w,
            None => {
                match WebviewWindowBuilder::new(app, &label, WebviewUrl::App("overlay/index.html".into()))
                    .transparent(true)
                    .decorations(false)
                    .always_on_top(true)
                    .skip_taskbar(true)
                    .resizable(false)
                    .maximizable(false)
                    .minimizable(false)
                    .shadow(false)
                    .visible(false)
                    .focused(false)
                    .build()
                {
                    Ok(w) => w,
                    Err(e) => { ghi_log(&format!("tao overlay{} LOI: {}", i, e)); continue }
                }
            }
        };
        let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: man.px, y: man.py }));
        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: man.pw, height: man.ph }));
        // ☠️ LOAI overlay khoi anh chup (WDA_EXCLUDEFROMCAPTURE): grab chay SAU
        // khi overlay hien — khong co dong nay la lop mo 42% nuong vao anh
        // ("ket qua hinh bi toi", ban Electron 26/08).
        let _ = win.set_content_protected(true);
    }
    // Man thao bot: dong overlay thua
    let mut i = mans.len();
    while let Some(w) = app.get_webview_window(&format!("overlay{}", i)) {
        let _ = w.close();
        i += 1;
    }
    let trang = app.state::<ArcTrang>();
    trang.lock().unwrap().mans = mans;
}

/* ── DIP <-> PHYS (he quy chieu tu dinh nghia, nhat quan 2 chieu) ──────── */

pub fn dip_sang_phys(mans: &[Man], x: f64, y: f64) -> (i32, i32) {
    let man = mans.iter().find(|m| m.chua_dip(x, y)).or_else(|| mans.first());
    match man {
        Some(m) => (
            m.px + ((x - m.dip_x()) * m.sf).round() as i32,
            m.py + ((y - m.dip_y()) * m.sf).round() as i32,
        ),
        None => (x as i32, y as i32),
    }
}

/* ── Bat dau chup ──────────────────────────────────────────────────────── */

pub fn bat_dau_chup(app: &AppHandle) {
    let selftest;
    {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        if t.dang_chup { return }
        t.dang_chup = true;
        t.keo = None;
        selftest = t.selftest;
    }
    cap_nhat_man(app);
    let mans = { app.state::<ArcTrang>().lock().unwrap().mans.clone() };
    ghi_log(&format!(
        "capture-start displays={} {}",
        mans.len(),
        mans.iter().map(|m| format!("{},{} {}x{}@{}", m.px, m.py, m.pw, m.ph, m.sf)).collect::<Vec<_>>().join(" | ")
    ));
    for (i, man) in mans.iter().enumerate() {
        let label = format!("overlay{}", i);
        phat_hoac_doi(app, &label, "overlay:init", json!({
            "selftest": selftest && i == 0,
            "origin": { "x": man.dip_x(), "y": man.dip_y() },
        }));
        if let Some(w) = app.get_webview_window(&label) {
            let _ = w.show();
            let _ = w.set_focus();
        }
    }
    // Grab o THREAD RIENG — overlay da hien, khong cham UI (luat spike).
    let app2 = app.clone();
    std::thread::spawn(move || grab(&app2));

    // ☠️ MOI AM DUONG INPUT (01/09, "bi giat"): cu di chuot DAU TIEN sau khi
    // overlay mo bi nuot ~280ms (do: viTriDut "0+283ms" lap y het moi luot;
    // chi di khong bam cung dinh; sau do muot 17ms deu — renderer rAF 18ms
    // suot). Nguoi dung bam phim tat roi keo NGAY nen lan nao cung dinh dung
    // cu dau = "giat". Nhich con tro 1px qua-lai ngay khi overlay hien de
    // nuot cai lo truoc khi tay nguoi cham vao. Vo hai (±1px, tra ve cho cu).
    #[cfg(windows)]
    std::thread::spawn(|| {
        use windows::Win32::UI::Input::KeyboardAndMouse::{mouse_event, MOUSEEVENTF_MOVE};
        for _ in 0..12 {
            std::thread::sleep(std::time::Duration::from_millis(30));
            unsafe {
                mouse_event(MOUSEEVENTF_MOVE, 1, 0, 0, 0);
                std::thread::sleep(std::time::Duration::from_millis(12));
                mouse_event(MOUSEEVENTF_MOVE, -1, 0, 0, 0);
            }
        }
    });
}

/// Chup TUNG man (xcap, native res) -> PNG vao frozen store + full-res de cat.
fn grab(app: &AppHandle) {
    let t0 = std::time::Instant::now();
    let mans = { app.state::<ArcTrang>().lock().unwrap().mans.clone() };
    let xmons = match xcap::Monitor::all() {
        Ok(v) => v,
        Err(e) => { ghi_log(&format!("grab LOI liet ke man: {}", e)); return }
    };
    let gen = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        t.gen += 1;
        t.frozen.clear();
        t.anh_man.clear();
        t.gen
    };
    let mut layers = Vec::new();
    let mut mo_ta = Vec::new();
    for (i, man) in mans.iter().enumerate() {
        // Khop man xcap theo GOC PHYS (khong theo thu tu — thu tu hai ben co the khac)
        let xm = xmons.iter().find(|x| {
            x.x().ok() == Some(man.px) && x.y().ok() == Some(man.py)
        });
        let img = match xm.map(|x| x.capture_image()) {
            Some(Ok(im)) => im,
            Some(Err(e)) => { ghi_log(&format!("grab man {} LOI: {}", i, e)); continue }
            None => { ghi_log(&format!("grab man {} KHONG khop xcap ({},{})", i, man.px, man.py)); continue }
        };
        let png = ma_hoa_png(&img);
        mo_ta.push(format!("anh {}x{} / native {}x{} / png {}KB", img.width(), img.height(), man.pw, man.ph, png.len() / 1024));
        {
            let trang = app.state::<ArcTrang>();
            let mut t = trang.lock().unwrap();
            t.frozen.insert(format!("{}/{}", gen, i), png);
            t.anh_man.insert(i, img);
        }
        layers.push(json!({
            "x": man.dip_x(), "y": man.dip_y(), "w": man.dip_w(), "h": man.dip_h(),
            "sf": man.sf, "url": format!("http://aioshot.localhost/frozen/{}/{}.png", gen, i),
            "px": man.px, "py": man.py, "pw": man.pw, "ph": man.ph,
        }));
    }
    // Da Esc/dong truoc khi grab xong? — khong phat nua (buffer da don o dong_chup)
    let van_chup = { app.state::<ArcTrang>().lock().unwrap().dang_chup };
    if !van_chup { return }
    ghi_log(&format!("grab-xong {}ms layers={} [{}]", t0.elapsed().as_millis(), layers.len(), mo_ta.join(" | ")));
    for i in 0..mans.len() {
        phat_hoac_doi(app, &format!("overlay{}", i), "overlay:frozen", json!({ "layers": layers }));
    }
}

/* ── Keo chon (main theo doi chuot he thong — luat 26/08 + neo 0.4.2) ──── */

pub fn keo_bat_dau(app: &AppHandle, label: &str, x: f64, y: f64) {
    let idx: usize = label.trim_start_matches("overlay").parse().unwrap_or(0);
    let (anchor, luc_nhan, mans) = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        if let Some(k) = &t.keo { k.stop.store(true, Ordering::SeqCst); }
        let anchor = dip_sang_phys(&t.mans, x, y);
        let luc_nhan = con_tro_phys();
        let stop = Arc::new(AtomicBool::new(false));
        t.keo = Some(Keo { stop: stop.clone(), owner: idx, anchor });
        (anchor, luc_nhan, t.mans.clone())
    };
    let lech = (((anchor.0 - luc_nhan.0).pow(2) + (anchor.1 - luc_nhan.1).pow(2)) as f64).sqrt().round() as i32;
    ghi_log(&format!(
        "drag-start anchor={:?}{}",
        anchor,
        if lech > 2 { format!(" (con tro luc main nhan da troi {}px)", lech) } else { String::new() }
    ));
    let stop = { app.state::<ArcTrang>().lock().unwrap().keo.as_ref().unwrap().stop.clone() };
    let app2 = app.clone();
    std::thread::spawn(move || {
        /* ☠️ GIAT (01/09, anh Tien cham tren ban cai): phat sel-rect MU 60/s
           cho MOI man la moi phat mot cu evaluate_script cua WebView2 (marshal
           qua main thread) — keo la overlay tut 30fps + khung ~700ms, du
           cua so tu ve lai 60fps sach (do C: rAF 209 khung gapMax 31ms).
           Electron gui IPC re nen 16ms khong sao — Tauri thi KHONG.
           Luat moi: chi phat cho man nao vung chon THAT SU GIAO, va chi khi
           rect DOI; het giao thi phat dung MOT phat de xoa khung roi im.
           Keo gon trong mot man (ca thuong gap nhat) = 0 phat/giay. */
        let mut lan_cuoi: Vec<Option<(i32, i32, i32, i32)>> = vec![None; mans.len()];
        let mut nhip: u64 = 0;
        while !stop.load(Ordering::SeqCst) {
            nhip += 1;
            let c = con_tro_phys();
            let rect = rect_tu_neo(anchor, c);
            let key = (rect.x, rect.y, rect.w, rect.h);
            for (i, m) in mans.iter().enumerate() {
                let la_chu = i == idx;
                if la_chu && m.chua_phys(c.0, c.1) { continue } // local la nguon duy nhat
                let giao = rect.x < m.px + m.pw as i32 && rect.x + rect.w > m.px
                    && rect.y < m.py + m.ph as i32 && rect.y + rect.h > m.py;
                if giao {
                    if lan_cuoi[i] == Some(key) { continue } // rect dung yen — khong phat
                    if nhip % 2 != 0 { continue } // guong 30Hz la du — evaluate_script dat
                    lan_cuoi[i] = Some(key);
                } else {
                    if lan_cuoi[i].is_none() { continue } // chua tung ve — khong co gi de xoa
                    lan_cuoi[i] = None; // phat mot phat cuoi (khong giao) de overlay tu xoa guong
                }
                let _ = app2.emit_to(&format!("overlay{}", i) as &str, "overlay:sel-rect", json!({
                    "x": (rect.x - m.px) as f64 / m.sf,
                    "y": (rect.y - m.py) as f64 / m.sf,
                    "w": rect.w as f64 / m.sf,
                    "h": rect.h as f64 / m.sf,
                    "physW": rect.w, "physH": rect.h,
                    "laChu": la_chu,
                }));
            }
            std::thread::sleep(std::time::Duration::from_millis(16));
        }
    });
}

fn rect_tu_neo(neo: (i32, i32), c: (i32, i32)) -> RectPhys {
    RectPhys {
        x: neo.0.min(c.0), y: neo.1.min(c.1),
        w: (c.0 - neo.0).abs(), h: (c.1 - neo.1).abs(),
    }
}

/// rect PHYS -> rect CUC BO (DIP) tung man. con_tro: TRONG man chu thi bo qua
/// man chu (local la nguon duy nhat — het nhap nhay 2 nguon, luat 0.4.2).
fn phat_sel_rect(app: &AppHandle, mans: &[Man], owner: usize, rect: RectPhys, con_tro: Option<(i32, i32)>) {
    for (i, m) in mans.iter().enumerate() {
        let la_chu = i == owner;
        if la_chu {
            if let Some(c) = con_tro {
                if m.chua_phys(c.0, c.1) { continue }
            }
        }
        let _ = app.emit_to(&format!("overlay{}", i) as &str, "overlay:sel-rect", json!({
            "x": (rect.x - m.px) as f64 / m.sf,
            "y": (rect.y - m.py) as f64 / m.sf,
            "w": rect.w as f64 / m.sf,
            "h": rect.h as f64 / m.sf,
            "physW": rect.w, "physH": rect.h,
            "laChu": la_chu,
        }));
    }
}

pub fn keo_ket_thuc(app: &AppHandle) {
    let (keo, mans) = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        let k = t.keo.take();
        (k, t.mans.clone())
    };
    let Some(keo) = keo else { return };
    keo.stop.store(true, Ordering::SeqCst);
    let c = con_tro_phys();
    let rect = rect_tu_neo(keo.anchor, c);
    ghi_log(&format!("drag-end rect={:?}", rect));
    if rect.w < 8 || rect.h < 8 {
        ghi_log("huy (vung qua nho)");
        dong_chup(app);
        return;
    }
    // Dong bang khung tren moi man
    phat_sel_rect(app, &mans, usize::MAX, rect, None);
    // Nam TRON mot man? (so bang PIXEL VAT LY)
    let chua = mans.iter().enumerate().find(|(_, m)| {
        rect.x >= m.px && rect.y >= m.py
            && rect.x + rect.w <= m.px + m.pw as i32
            && rect.y + rect.h <= m.py + m.ph as i32
    });
    if let Some((i, m)) = chua {
        ghi_log(&format!("vao annotate tren man {}", i));
        let label = format!("overlay{}", i);
        let _ = app.emit_to(&label as &str, "overlay:annotate", json!({
            "x": (rect.x - m.px) as f64 / m.sf,
            "y": (rect.y - m.py) as f64 / m.sf,
            "w": rect.w as f64 / m.sf,
            "h": rect.h as f64 / m.sf,
        }));
        if let Some(w) = app.get_webview_window(&label) { let _ = w.set_focus(); }
        return;
    }
    // Vat ngang nhieu man -> owner ghep theo PIXEL VAT LY
    ghi_log("composite (vat ngang, phys)");
    let _ = app.emit_to(&format!("overlay{}", keo.owner) as &str, "overlay:composite", json!({
        "x": rect.x, "y": rect.y, "w": rect.w, "h": rect.h,
    }));
}

/* ── Xac nhan -> luu -> khay ───────────────────────────────────────────── */

pub fn xac_nhan(app: &AppHandle, label: &str, payload: serde_json::Value) {
    let idx: usize = label.trim_start_matches("overlay").parse().unwrap_or(0);
    ghi_log(&format!(
        "confirm tu man {} kieu={}",
        idx,
        if payload.get("dataUrl").is_some() { "dataUrl" } else { "rect" }
    ));

    let cropped: Option<RgbaImage> = if let Some(du) = payload.get("dataUrl").and_then(|v| v.as_str()) {
        doc_data_url(du)
    } else if let Some(r) = payload.get("rect") {
        // Anh dong bang co the CHUA grab xong (chon nhanh hon grab) — CHO,
        // nhu Electron `await grabPromise` (toi da 15s, debug build cham).
        let mut cho = 0;
        loop {
            let co = {
                let trang = app.state::<ArcTrang>();
                let t = trang.lock().unwrap();
                t.anh_man.contains_key(&idx) || !t.dang_chup
            };
            if co || cho >= 150 { break }
            cho += 1;
            std::thread::sleep(std::time::Duration::from_millis(100));
        }
        let (man, img) = {
            let trang = app.state::<ArcTrang>();
            let t = trang.lock().unwrap();
            (t.mans.get(idx).cloned(), t.anh_man.get(&idx).cloned())
        };
        match (man, img) {
            (Some(m), Some(img)) => {
                let f = |k: &str| r.get(k).and_then(|v| v.as_f64()).unwrap_or(0.0);
                // rect CUC BO (DIP man nay) -> pixel anh (k = anh-that / native)
                let kx = img.width() as f64 / m.pw as f64;
                let ky = img.height() as f64 / m.ph as f64;
                let cx = ((f("x") * m.sf * kx).round() as i64).max(0) as u32;
                let cy = ((f("y") * m.sf * ky).round() as i64).max(0) as u32;
                let cw = ((f("w") * m.sf * kx).round() as i64).max(1) as u32;
                let ch = ((f("h") * m.sf * ky).round() as i64).max(1) as u32;
                let cw = cw.min(img.width().saturating_sub(cx).max(1));
                let ch = ch.min(img.height().saturating_sub(cy).max(1));
                Some(image::imageops::crop_imm(&img, cx, cy, cw, ch).to_image())
            }
            _ => {
                ghi_log("confirm rect nhung CHUA co anh grab — bo qua");
                None
            }
        }
    } else { None };

    dong_chup(app);
    let Some(cropped) = cropped else { return };

    // Ctrl+C: copy clipboard (them, ngoai luong luu)
    if payload.get("copy").and_then(|v| v.as_bool()).unwrap_or(false) {
        copy_clipboard(app, &cropped);
    }

    // 1) Luu file THAT truoc — tat app khong mat anh
    let cfg = doc_cau_hinh(app);
    let dd = lay_dinh_dang(&cfg);
    let Some(path) = luu_anh(&cropped, &dd, &cfg) else { return };
    ghi_log(&format!(
        "luu {} {}x{}",
        path.file_name().and_then(|s| s.to_str()).unwrap_or(""),
        cropped.width(), cropped.height()
    ));
    // 2) Vao khay (anh Tien 25/08: CHI vao khay, KHONG bung pin)
    khay_them(app, cropped, path);

    // [selftest] chay tiep duong GHIM roi thoat (kiem pipeline)
    let selftest = { app.state::<ArcTrang>().lock().unwrap().selftest };
    if selftest {
        let app2 = app.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(600));
            let id = { app2.state::<ArcTrang>().lock().unwrap().khay.keys().next_back().copied() };
            if let Some(id) = id { ghim_tu_khay(&app2, id); }
            std::thread::sleep(std::time::Duration::from_millis(1600));
            ghi_log("selftest XONG — thoat");
            app2.exit(0);
        });
    }
}

pub fn copy_clipboard(app: &AppHandle, img: &RgbaImage) {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    let tim = tauri::image::Image::new_owned(img.as_raw().clone(), img.width(), img.height());
    if let Err(e) = app.clipboard().write_image(&tim) {
        ghi_log(&format!("copy clipboard LOI: {}", e));
    }
}

pub fn huy_chup(app: &AppHandle) {
    ghi_log("cancel");
    dong_chup(app);
}

/// AN + reload overlay (trang thai JS sach nhu Electron tao cua so moi),
/// don buffer PNG (5K2K ~10-25MB/man — khong giu sau khi chup).
pub fn dong_chup(app: &AppHandle) {
    let n = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        if let Some(k) = &t.keo { k.stop.store(true, Ordering::SeqCst); }
        t.keo = None;
        t.dang_chup = false;
        t.frozen.clear();
        t.anh_man.clear();
        let n = t.mans.len();
        for i in 0..n {
            let label = format!("overlay{}", i);
            t.ready.remove(&label);
            t.cho.remove(&label);
        }
        n
    };
    for i in 0..n {
        if let Some(w) = app.get_webview_window(&format!("overlay{}", i)) {
            let _ = w.hide();
            let _ = w.eval("window.location.reload()");
        }
    }
}

/* ── Khay ──────────────────────────────────────────────────────────────── */

pub fn kieu_khay(app: &AppHandle) -> String {
    match doc_cau_hinh(app).khay_kieu.as_deref() {
        Some("doc") => "doc".into(),
        _ => "ngang".into(),
    }
}

fn co_khay(app: &AppHandle) -> (f64, f64) {
    if kieu_khay(app) == "doc" { (SHELF_DOC_W, SHELF_DOC_H) } else { (SHELF_W, SHELF_H) }
}

/// Vi tri khay: tu cau hinh (PHYS, con tren man nao do) hoac goc phai duoi
/// workArea man chinh.
fn vi_tri_khay(app: &AppHandle) -> (i32, i32) {
    let cfg = doc_cau_hinh(app);
    let mans = { app.state::<ArcTrang>().lock().unwrap().mans.clone() };
    if let Some(p) = &cfg.vi_tri_khay {
        let tren_man = mans.iter().any(|m| m.chua_phys(p.x, p.y));
        if tren_man { return (p.x, p.y) }
    }
    let chinh = mans.iter().find(|m| m.px == 0 && m.py == 0).or_else(|| mans.first());
    let (sf, (cw, ch)) = (chinh.map(|m| m.sf).unwrap_or(1.0), co_khay(app));
    let wa = work_area_phys(chinh.map(|m| m.px).unwrap_or(0), chinh.map(|m| m.py).unwrap_or(0));
    (
        wa.x + wa.w - ((cw + SHELF_MARGIN) * sf) as i32,
        wa.y + wa.h - ((ch + SHELF_MARGIN) * sf) as i32,
    )
}

pub fn bao_dam_khay(app: &AppHandle) -> Option<tauri::WebviewWindow> {
    if let Some(w) = app.get_webview_window("shelf") { return Some(w) }
    let (cw, ch) = co_khay(app);
    let win = WebviewWindowBuilder::new(app, "shelf", WebviewUrl::App("shelf/index.html".into()))
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .shadow(false)
        .inner_size(cw, ch)
        .visible(false)
        .focused(false)
        .build()
        .ok()?;
    let (x, y) = vi_tri_khay(app);
    let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
    Some(win)
}

/// Hien khay KHONG cuop focus — nguoi dung dang dung Premiere.
pub fn hien_khay(app: &AppHandle) {
    if let Some(w) = bao_dam_khay(app) {
        if !w.is_visible().unwrap_or(false) { hien_khong_focus(&w); }
    }
}

pub fn goi_khay_item(id: u32, it: &AnhKhay) -> serde_json::Value {
    let thumb = png_data_url(&thu_nho(&it.img, 128));
    let kb = std::fs::metadata(&it.path).map(|m| (m.len() / 1024) as u64).unwrap_or(0);
    json!({
        "id": id, "thumb": thumb,
        "filePath": it.path.to_string_lossy(),
        "w": it.img.width(), "h": it.img.height(), "kb": kb,
    })
}

pub fn khay_them(app: &AppHandle, img: RgbaImage, path: std::path::PathBuf) {
    let _ = bao_dam_khay(app);
    // icon keo-tha 96px (file PNG trong cache — plugin drag can DUONG DAN)
    let icon_dir = app.path().app_cache_dir().unwrap_or_else(|_| std::env::temp_dir());
    let _ = std::fs::create_dir_all(&icon_dir);
    let (id, item_json) = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        t.seq += 1;
        let id = t.seq;
        let icon = icon_dir.join(format!("icon-{}.png", id));
        let _ = std::fs::write(&icon, ma_hoa_png(&thu_nho(&img, 96)));
        let it = AnhKhay { path, img, icon };
        let j = goi_khay_item(id, &it);
        t.khay.insert(id, it);
        (id, j)
    };
    let _ = id;
    phat_hoac_doi(app, "shelf", "shelf:add", item_json);
    hien_khay(app);
}

/// Dung lai cua so khay (doi kieu ngang/doc) + ve lai anh tu nguon chan ly.
pub fn khay_dung_lai(app: &AppHandle) {
    let co_anh = {
        let trang = app.state::<ArcTrang>();
        let t = trang.lock().unwrap();
        !t.khay.is_empty()
    };
    if let Some(w) = app.get_webview_window("shelf") {
        {
            let trang = app.state::<ArcTrang>();
            let mut t = trang.lock().unwrap();
            t.ready.remove("shelf");
            t.cho.remove("shelf");
        }
        let _ = w.close();
    }
    if co_anh {
        let _ = bao_dam_khay(app);
        let items: Vec<serde_json::Value> = {
            let trang = app.state::<ArcTrang>();
            let t = trang.lock().unwrap();
            t.khay.iter().map(|(id, it)| goi_khay_item(*id, it)).collect()
        };
        for j in items { phat_hoac_doi(app, "shelf", "shelf:add", j); }
        hien_khay(app);
    }
}

/* ── Ghim ──────────────────────────────────────────────────────────────── */

/// Ghim mot anh trong khay len man hinh (giua man co con tro, xep chong nhe).
pub fn ghim_tu_khay(app: &AppHandle, id: u32) {
    let (img, path, icon) = {
        let trang = app.state::<ArcTrang>();
        let t = trang.lock().unwrap();
        match t.khay.get(&id) {
            Some(it) => (it.img.clone(), it.path.clone(), it.icon.clone()),
            None => return,
        }
    };
    let c = con_tro_phys();
    let mans = { app.state::<ArcTrang>().lock().unwrap().mans.clone() };
    let man = mans.iter().find(|m| m.chua_phys(c.0, c.1)).cloned()
        .or_else(|| mans.first().cloned())
        .unwrap_or(Man { px: 0, py: 0, pw: 1920, ph: 1080, sf: 1.0 });
    let sf = man.sf;
    let dip_w = (img.width() as f64 / sf).round();
    let dip_h = (img.height() as f64 / sf).round();
    let off = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        let o = (t.cascade % 6) * 24;
        t.cascade += 1;
        o as f64
    };
    let wa = work_area_phys(man.px, man.py);
    let x = wa.x + ((wa.w as f64 - dip_w * sf) / 2.0 + off * sf).round() as i32;
    let y = wa.y + ((wa.h as f64 - dip_h * sf) / 2.0 + off * sf).round() as i32;
    tao_ghim(app, img, path, icon, x, y, dip_w, dip_h, sf);
}

pub fn tao_ghim(
    app: &AppHandle, img: RgbaImage, path: std::path::PathBuf, icon: std::path::PathBuf,
    phys_x: i32, phys_y: i32, dip_w: f64, dip_h: f64, sf: f64,
) {
    let label = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        t.pin_seq += 1;
        format!("pin{}", t.pin_seq)
    };
    let win = match WebviewWindowBuilder::new(app, &label, WebviewUrl::App("pin/index.html".into()))
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .shadow(false)
        .inner_size(dip_w + PIN_PAD * 2.0, dip_h + PIN_PAD * 2.0)
        .visible(false)
        .build()
    {
        Ok(w) => w,
        Err(e) => { ghi_log(&format!("tao ghim LOI: {}", e)); return }
    };
    let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: phys_x - (PIN_PAD * sf) as i32,
        y: phys_y - (PIN_PAD * sf) as i32,
    }));
    {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        t.ghims.insert(label.clone(), Ghim {
            path: Some(path), img: img.clone(), icon, dip_w, dip_h,
        });
    }
    // Anh ghim di qua aioshot://pin/<label>.png (URL nho qua event; bridge da
    // set crossOrigin cho luuVe khong bi taint canvas).
    phat_hoac_doi(app, &label, "pin:data", json!({
        "dataUrl": format!("http://aioshot.localhost/pin/{}.png", label),
        "pad": PIN_PAD, "w": dip_w, "h": dip_h,
    }));
    let _ = win.show();
}

/// Anh ghim VE them -> ghi de file + cap nhat khay (port pin:save-edit).
pub fn ghim_luu_ve(app: &AppHandle, label: &str, data_url: &str) {
    let Some(da_ve) = doc_data_url(data_url) else { return };
    let cfg = doc_cau_hinh(app);
    let (path_opt, cap_nhat): (Option<std::path::PathBuf>, Vec<(u32, serde_json::Value)>) = {
        let trang = app.state::<ArcTrang>();
        let mut t = trang.lock().unwrap();
        let Some(rec) = t.ghims.get_mut(label) else { return };
        rec.img = da_ve.clone();
        let path_opt = rec.path.clone();
        // Ghi de icon keo cho ban moi
        let icon = rec.icon.clone();
        let _ = std::fs::write(&icon, ma_hoa_png(&thu_nho(&da_ve, 96)));
        let mut cap_nhat = Vec::new();
        if let Some(p) = &path_opt {
            for (_, it) in t.khay.iter_mut() {
                if &it.path == p {
                    it.img = da_ve.clone();
                    let _ = std::fs::write(&it.icon, ma_hoa_png(&thu_nho(&da_ve, 96)));
                }
            }
            for (id, it) in t.khay.iter() {
                if &it.path == p { cap_nhat.push((*id, goi_khay_item(*id, it))); }
            }
        }
        (path_opt, cap_nhat)
    };
    // Ghi de DUNG file cu, giu dinh dang theo duoi file
    if let Some(p) = &path_opt {
        let la_png = p.extension().map(|e| e.eq_ignore_ascii_case("png")).unwrap_or(false);
        let bytes = if la_png { ma_hoa_png(&da_ve) } else { ma_hoa_jpeg(&da_ve, lay_dinh_dang(&cfg).q) };
        match std::fs::write(p, bytes) {
            Ok(_) => ghi_log(&format!("pin ve-xong ghi de {}", p.file_name().and_then(|s| s.to_str()).unwrap_or(""))),
            Err(e) => ghi_log(&format!("pin ve-xong LOI ghi file: {}", e)),
        }
    }
    for (_, j) in cap_nhat { phat_hoac_doi(app, "shelf", "shelf:update", j); }
}

/* ── Keo di chuyen cua so (pin + khay — neo MOT lan, delta TUYET DOI) ──── */

pub fn cua_so_keo_bat_dau(app: &AppHandle, win: &tauri::WebviewWindow) {
    if let Ok(p) = win.outer_position() {
        let trang = app.state::<ArcTrang>();
        trang.lock().unwrap().keo_cua_so.insert(win.label().to_string(), (p.x, p.y));
    }
}

pub fn cua_so_keo_den(app: &AppHandle, win: &tauri::WebviewWindow, dx: f64, dy: f64) {
    let neo = {
        let trang = app.state::<ArcTrang>();
        let t = trang.lock().unwrap();
        t.keo_cua_so.get(win.label()).copied()
    };
    let Some((ax, ay)) = neo else { return };
    // dx/dy la CSS px (DIP) tu renderer -> phys theo sf cua man hien tai.
    let sf = win.scale_factor().unwrap_or(1.0);
    let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: ax + (dx * sf).round() as i32,
        y: ay + (dy * sf).round() as i32,
    }));
}

pub fn cua_so_keo_xong(app: &AppHandle, win: &tauri::WebviewWindow) {
    let trang = app.state::<ArcTrang>();
    trang.lock().unwrap().keo_cua_so.remove(win.label());
}
