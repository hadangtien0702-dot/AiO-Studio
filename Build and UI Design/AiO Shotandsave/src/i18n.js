'use strict'

/* Ngon ngu app: VI + EN. Dung chung cho main (require) va cac preload (require).
   Renderer lay chuoi qua window.i18n.t(key) (preload nap lang sync tu main). */

const DICH = {
  vi: {
    // Tray
    'tray.chup': 'Chụp vùng chọn',
    'tray.khay': 'Hiện khay ảnh',
    'tray.moThuMuc': 'Mở thư mục lưu ảnh',
    'tray.caiDat': 'Cài đặt…',
    'tray.thoat': 'Thoát',
    // Overlay
    'overlay.hint': 'Kéo để chọn vùng',
    'overlay.esc': 'Esc',
    'overlay.huy': 'để huỷ',
    'overlay.rect': 'Vẽ khung vuông',
    'overlay.arrow': 'Vẽ mũi tên',
    'overlay.undo': 'Hoàn tác (Ctrl+Z)',
    'overlay.done': 'Xong (Enter · Ctrl+C = sao chép)',
    'overlay.cancel': 'Huỷ',
    // Settings — chung
    'set.tieuDe': 'Cài đặt',
    // Settings — phim tat
    'set.phim.tieuDe': 'Phím tắt chụp',
    'set.phim.moTa': 'Bấm “Ghi phím mới” rồi nhấn tổ hợp anh muốn (cần ít nhất một phím Ctrl / Alt / Shift).',
    'set.phim.ghi': 'Ghi phím mới',
    'set.phim.doiPhim': 'Đổi phím…',
    'set.phim.nhanToHop': 'Nhấn tổ hợp mới…',
    'set.phim.luuNgan': 'Lưu',
    'set.phim.huyNgan': 'Huỷ',
    'set.phim.goiY': 'Bấm ở bất kỳ đâu để chụp nhanh',
    'set.phim.macDinh': 'Về mặc định',
    'set.phim.luu': 'Lưu phím',
    'set.phim.dangGhi': 'Nhấn tổ hợp phím…',
    'set.phim.canModifier': 'Cần ít nhất một phím Ctrl / Alt / Shift',
    'set.phim.canModifierMac': 'Cần ít nhất một phím Ctrl / Alt / Shift / ⌘',
    'set.phim.daLuu': '✓ Đã lưu — dùng ngay được',
    'set.phim.biGiu': '✗ Phím này đang bị app khác giữ. Giữ nguyên phím cũ.',
    'set.phim.veMacDinh': 'Đã về mặc định',
    'set.phim.veMacDinhLoi': '✗ Không đặt lại được (phím bị giữ)',
    // Settings — thu muc
    'set.thuMuc.tieuDe': 'Thư mục lưu ảnh',
    'set.thuMuc.moTa': 'Nơi mọi ảnh chụp được lưu.',
    'set.thuMuc.mo': 'Mở thư mục',
    'set.thuMuc.doi': 'Đổi thư mục…',
    'set.thuMuc.daDoi': '✓ Ảnh mới sẽ lưu vào đây',
    // Khay
    'khay.tieuDe': 'Khay ảnh',
    'khay.trong': 'Chưa có ảnh nào — bấm',
    'khay.trong2': 'để chụp',
    'khay.moThuMuc': 'Mở thư mục lưu ảnh',
    'khay.don': 'Dọn khay',
    'khay.an': 'Ẩn khay',
    'khay.oGhim': 'Bấm để ghim lại · Kéo để thả vào app khác',
    'khay.oXoa': 'Bỏ khỏi khay (ảnh vẫn còn trong thư mục)',
    // Ghim
    'ghim.copy': 'Sao chép (Ctrl+C)',
    'ghim.dong': 'Đóng (Esc)',
  },
  en: {
    'tray.chup': 'Capture area',
    'tray.khay': 'Show shelf',
    'tray.moThuMuc': 'Open save folder',
    'tray.caiDat': 'Settings…',
    'tray.thoat': 'Quit',
    'overlay.hint': 'Drag to select',
    'overlay.esc': 'Esc',
    'overlay.huy': 'to cancel',
    'overlay.rect': 'Rectangle',
    'overlay.arrow': 'Arrow',
    'overlay.undo': 'Undo (Ctrl+Z)',
    'overlay.done': 'Done (Enter · Ctrl+C = copy)',
    'overlay.cancel': 'Cancel',
    'set.tieuDe': 'Settings',
    'set.phim.tieuDe': 'Capture shortcut',
    'set.phim.moTa': 'Click “Record new key”, then press the combo you want (at least one Ctrl / Alt / Shift).',
    'set.phim.ghi': 'Record new key',
    'set.phim.doiPhim': 'Change key…',
    'set.phim.nhanToHop': 'Press new combo…',
    'set.phim.luuNgan': 'Save',
    'set.phim.huyNgan': 'Cancel',
    'set.phim.goiY': 'Press anywhere to capture instantly',
    'set.phim.macDinh': 'Reset',
    'set.phim.luu': 'Save key',
    'set.phim.dangGhi': 'Press a key combo…',
    'set.phim.canModifier': 'Need at least one Ctrl / Alt / Shift',
    'set.phim.canModifierMac': 'Need at least one Ctrl / Alt / Shift / ⌘',
    'set.phim.daLuu': '✓ Saved — ready to use',
    'set.phim.biGiu': '✗ That key is taken by another app. Kept the old one.',
    'set.phim.veMacDinh': 'Reset to default',
    'set.phim.veMacDinhLoi': '✗ Could not reset (key is taken)',
    'set.thuMuc.tieuDe': 'Save folder',
    'set.thuMuc.moTa': 'Where every screenshot is saved.',
    'set.thuMuc.mo': 'Open folder',
    'set.thuMuc.doi': 'Change folder…',
    'set.thuMuc.daDoi': '✓ New screenshots will save here',
    'khay.tieuDe': 'Shelf',
    'khay.trong': 'No shots yet — press',
    'khay.trong2': 'to capture',
    'khay.moThuMuc': 'Open save folder',
    'khay.don': 'Clear shelf',
    'khay.an': 'Hide shelf',
    'khay.oGhim': 'Click to pin · Drag to drop into another app',
    'khay.oXoa': 'Remove from shelf (file stays in folder)',
    'ghim.copy': 'Copy (Ctrl+C)',
    'ghim.dong': 'Close (Esc)',
  },
}

function t(lang, key) {
  const bang = DICH[lang] || DICH.vi
  return bang[key] != null ? bang[key] : (DICH.vi[key] != null ? DICH.vi[key] : key)
}

module.exports = { DICH, t }
