/**
 * After Effects — logic riêng (LÀM SAU, dùng chung khung với Premiere).
 * Hiện chỉ là stub; sẽ mở #include trong index.jsx khi mở rộng sang AE.
 */

/**
 * Kiểm tra nhanh môi trường After Effects.
 * @returns {string}
 */
function ae_check() {
  try {
    if (app && app.project) {
      return 'AEFT OK';
    }
    return 'AEFT OK: (chưa mở project)';
  } catch (e) {
    return 'AEFT ERROR: ' + e.toString();
  }
}
