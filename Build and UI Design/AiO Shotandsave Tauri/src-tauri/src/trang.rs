// trang.rs — trang thai app + cau hinh + kho anh + nhat ky chay.
// Port 1:1 tu kho.js + phan trang thai cua main.js (ban Electron 0.4.2).

use base64::Engine as _;
use image::RgbaImage;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap, HashSet};
use std::io::Write as _;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

/* ── Thoi gian dia phuong (khong keo crate chrono) ─────────────────────── */

#[cfg(windows)]
pub fn gio_dia_phuong() -> (u16, u16, u16, u16, u16, u16, u16) {
    // (nam, thang, ngay, gio, phut, giay, ms)
    let st = unsafe { windows::Win32::System::SystemInformation::GetLocalTime() };
    (st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond, st.wMilliseconds)
}

/* ── Nhat ky chay (LUON bat, nhu .run-log.txt ban Electron) ────────────── */

/// Dang chay tu ban DEV (exe nam trong target/) hay ban CAI?
/// env!(CARGO_MANIFEST_DIR) la duong dan luc BUILD — tren may khach khong
/// ton tai, phai nhan biet bang vi tri exe (nhu app.isPackaged cua Electron).
fn la_ban_dev() -> bool {
    std::env::current_exe()
        .ok()
        .map(|p| {
            let s = p.to_string_lossy().to_lowercase();
            s.contains("\\target\\release\\") || s.contains("\\target\\debug\\")
        })
        .unwrap_or(false)
}

fn thu_muc_exe() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|x| x.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

pub fn duong_run_log() -> PathBuf {
    if la_ban_dev() {
        // Dev: canh thu muc du an (cha cua src-tauri), nhu .run-log.txt Electron dev
        let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        p.pop();
        p.push(".run-log.txt");
        p
    } else {
        // Ban cai per-user (%LOCALAPPDATA%\...) ghi duoc canh exe
        thu_muc_exe().join("run-log.txt")
    }
}

pub fn ghi_log(msg: &str) {
    let (_, _, _, h, m, s, ms) = gio_dia_phuong();
    let dong = format!("{:02}:{:02}:{:02}.{:03} {}\n", h, m, s, ms, msg);
    let p = duong_run_log();
    // Tu cat khi qua 300KB (nhu Electron)
    if let Ok(meta) = std::fs::metadata(&p) {
        if meta.len() > 300 * 1024 {
            let _ = std::fs::write(&p, "");
        }
    }
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&p) {
        let _ = f.write_all(dong.as_bytes());
    }
}

/* ── Cau hinh (cau-hinh.json, ghi ATOMIC nhu kho.js) ───────────────────── */

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct ViTri {
    pub x: i32,
    pub y: i32,
}

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct CauHinh {
    pub hotkey: Option<String>,        // dinh dang accelerator KIEU ELECTRON (giu nguyen)
    pub lang: Option<String>,          // 'vi' | 'en'
    pub anh_loai: Option<String>,      // 'jpeg' | 'png'
    pub anh_chat_luong: Option<String>, // 'thap' | 'cao' | 'sieu'
    pub khay_kieu: Option<String>,     // 'ngang' | 'doc'
    pub thu_muc_anh: Option<String>,
    pub vi_tri_khay: Option<ViTri>,    // pixel VAT LY (ban Electron la DIP — app id khac, config rieng)
}

pub fn duong_cau_hinh(app: &tauri::AppHandle) -> PathBuf {
    use tauri::Manager;
    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    dir.join("cau-hinh.json")
}

pub fn doc_cau_hinh(app: &tauri::AppHandle) -> CauHinh {
    std::fs::read_to_string(duong_cau_hinh(app))
        .ok()
        // ☠️ BOM lam serde chet im -> MOI cai dat ve mac dinh (bay Electron
        // 31/08 tai dien 01/09: PowerShell Out-File utf8 ghi BOM). Cat truoc.
        .and_then(|s| serde_json::from_str(s.trim_start_matches('\u{feff}')).ok())
        .unwrap_or_default()
}

/// Ghi ATOMIC (tmp + rename) — file nay ghi moi lan keo khay; sap giua chung
/// la JSON hong -> MOI cai dat ve mac dinh (bay 31/08 ban Electron).
pub fn ghi_cau_hinh(app: &tauri::AppHandle, sua: impl FnOnce(&mut CauHinh)) -> CauHinh {
    let mut c = doc_cau_hinh(app);
    sua(&mut c);
    let p = duong_cau_hinh(app);
    if let Some(cha) = p.parent() {
        let _ = std::fs::create_dir_all(cha);
    }
    let tmp = p.with_extension("json.tmp");
    if std::fs::write(&tmp, serde_json::to_string_pretty(&c).unwrap_or_default()).is_ok() {
        let _ = std::fs::rename(&tmp, &p);
    }
    c
}

/* ── Kho anh (thu muc luu + luu file, port kho.js) ─────────────────────── */

/// Thu muc GOC cua tool. ☠️ CAM Pictures mac dinh (OneDrive doi huong — luat 24/08).
/// Dev: thu muc du an. Ban cai: thu muc chua exe (nhu kho.js Electron).
pub fn thu_muc_goc() -> PathBuf {
    if la_ban_dev() {
        let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        p.pop();
        p
    } else {
        thu_muc_exe()
    }
}

pub fn thu_muc_anh(cfg: &CauHinh) -> PathBuf {
    match &cfg.thu_muc_anh {
        Some(s) if !s.is_empty() => PathBuf::from(s),
        _ => thu_muc_goc().join("Anh chup"),
    }
}

pub fn bao_dam_thu_muc(dir: &PathBuf) -> PathBuf {
    let _ = std::fs::create_dir_all(dir);
    dir.clone()
}

/// Ten file theo thoi diem chup: AiO-2026-09-01-101530-123.jpg
pub fn ten_theo_gio(duoi: &str) -> String {
    let (y, mo, d, h, mi, s, ms) = gio_dia_phuong();
    format!(
        "AiO-{}-{:02}-{:02}-{:02}{:02}{:02}-{:03}.{}",
        y, mo, d, h, mi, s, ms, duoi
    )
}

/// Chat luong JPEG nhu Electron (anh Tien 26/08 "basic nhat cung ~100KB").
pub fn chat_luong_q(ten: &str) -> u8 {
    match ten {
        "thap" => 95,
        "sieu" => 100,
        _ => 98, // 'cao' mac dinh
    }
}

pub struct DinhDang {
    pub la_png: bool,
    pub q: u8,
}

pub fn lay_dinh_dang(cfg: &CauHinh) -> DinhDang {
    let la_png = cfg.anh_loai.as_deref() == Some("png");
    let q = chat_luong_q(cfg.anh_chat_luong.as_deref().unwrap_or("cao"));
    DinhDang { la_png, q }
}

pub fn ma_hoa_png(img: &RgbaImage) -> Vec<u8> {
    let mut buf = Vec::new();
    let _ = img.write_to(
        &mut std::io::Cursor::new(&mut buf),
        image::ImageFormat::Png,
    );
    buf
}

pub fn ma_hoa_jpeg(img: &RgbaImage, q: u8) -> Vec<u8> {
    // JPEG khong co alpha — chuyen RGB truoc.
    let rgb = image::DynamicImage::ImageRgba8(img.clone()).to_rgb8();
    let mut buf = Vec::new();
    let mut con_tro = std::io::Cursor::new(&mut buf);
    let mut enc = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut con_tro, q);
    let _ = enc.encode_image(&rgb);
    drop(enc);
    drop(con_tro);
    buf
}

/// Luu anh theo dinh dang nguoi dung chon. Tra duong dan (None neu that bai).
pub fn luu_anh(img: &RgbaImage, dd: &DinhDang, cfg: &CauHinh) -> Option<PathBuf> {
    let dir = bao_dam_thu_muc(&thu_muc_anh(cfg));
    let file = dir.join(ten_theo_gio(if dd.la_png { "png" } else { "jpg" }));
    let bytes = if dd.la_png {
        ma_hoa_png(img)
    } else {
        ma_hoa_jpeg(img, dd.q)
    };
    match std::fs::write(&file, bytes) {
        Ok(_) => Some(file),
        Err(e) => {
            ghi_log(&format!("[kho] khong luu duoc anh: {}", e));
            None
        }
    }
}

/// Thumbnail cao `h` px, giu ti le.
pub fn thu_nho(img: &RgbaImage, h: u32) -> RgbaImage {
    let w = (img.width() as u64 * h as u64 / img.height().max(1) as u64).max(1) as u32;
    image::imageops::thumbnail(img, w, h)
}

pub fn png_data_url(img: &RgbaImage) -> String {
    format!(
        "data:image/png;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(ma_hoa_png(img))
    )
}

/// Giai ma dataURL PNG tu renderer (canvas.toDataURL).
pub fn doc_data_url(data_url: &str) -> Option<RgbaImage> {
    let b64 = data_url.split(",").nth(1)?;
    let bytes = base64::engine::general_purpose::STANDARD.decode(b64).ok()?;
    image::load_from_memory(&bytes).ok().map(|d| d.to_rgba8())
}

/* ── Trang thai chay ───────────────────────────────────────────────────── */

/// Mot man hinh: goc + co PIXEL VAT LY, scale, va goc DIP (phys/sf — he quy
/// chieu TU DINH NGHIA, nhat quan hai chieu nen khong lech).
#[derive(Clone, Debug)]
pub struct Man {
    pub px: i32,
    pub py: i32,
    pub pw: u32,
    pub ph: u32,
    pub sf: f64,
}

impl Man {
    pub fn dip_x(&self) -> f64 { self.px as f64 / self.sf }
    pub fn dip_y(&self) -> f64 { self.py as f64 / self.sf }
    pub fn dip_w(&self) -> f64 { self.pw as f64 / self.sf }
    pub fn dip_h(&self) -> f64 { self.ph as f64 / self.sf }
    pub fn chua_phys(&self, x: i32, y: i32) -> bool {
        x >= self.px && x < self.px + self.pw as i32 && y >= self.py && y < self.py + self.ph as i32
    }
    pub fn chua_dip(&self, x: f64, y: f64) -> bool {
        x >= self.dip_x() && x < self.dip_x() + self.dip_w()
            && y >= self.dip_y() && y < self.dip_y() + self.dip_h()
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct RectPhys {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

pub struct AnhKhay {
    pub path: PathBuf,
    pub img: RgbaImage,
    pub icon: PathBuf, // thumb 96px lam icon keo-tha
}

pub struct Ghim {
    pub path: Option<PathBuf>,
    pub img: RgbaImage,
    pub icon: PathBuf,
    pub dip_w: f64,
    pub dip_h: f64,
}

pub struct Keo {
    pub stop: Arc<AtomicBool>,
    pub owner: usize,       // idx man cua overlay giu quyen keo
    pub anchor: (i32, i32), // neo PHYS (tu diem mousedown renderer gui kem — luat 0.4.2)
}

#[derive(Default)]
pub struct Trang {
    pub hotkey: String, // accelerator kieu Electron
    pub lang: String,
    pub mans: Vec<Man>,
    pub gen: u64,
    pub dang_chup: bool,
    pub frozen: HashMap<String, Vec<u8>>,      // "gen/idx" -> PNG
    pub anh_man: HashMap<usize, RgbaImage>,    // idx man -> anh full-res gen hien tai
    pub keo: Option<Keo>,
    pub khay: BTreeMap<u32, AnhKhay>,
    pub seq: u32,
    pub cascade: u32,
    pub ghims: HashMap<String, Ghim>,          // label cua so ghim -> du lieu
    pub pin_seq: u32,
    pub keo_cua_so: HashMap<String, (i32, i32)>, // label -> outer pos luc bat dau keo (phys)
    pub ready: HashSet<String>,                // cua so da gan listener xong
    pub cho: HashMap<String, Vec<(String, serde_json::Value)>>, // su kien doi ready
    pub selftest: bool,
}

pub type ArcTrang = Arc<Mutex<Trang>>;
