import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// ☠️ `styles.css` PHẢI nạp ở đây. Trước 13/08 nó chỉ được nạp bên trong
// `AppNewUI.tsx` — mà file đó không được vẽ ra, nên bản dựng thật không có
// một dòng CSS nào của panel. Nạp ở gốc thì ai vẽ cũng có.
import './styles.css'
// Song ngu VI/EN — bọc TOÀN BỘ App để mọi component gọi được `useNgonNgu()`,
// và để `dich()` (dùng ở lib/ · services/, nơi không gọi hook được) biết đang
// ở thứ tiếng nào. Bảng chữ ở `chu.ts`, cơ chế ở `ngonngu.tsx`
// (nguồn chân lý: `design-system/ngonngu.tsx`).
import { NhaNgonNgu } from './ngonngu'
import { CHU } from './chu'

/**
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ [13/08/2026] TRẢ LẠI SẢN PHẨM THẬT — trước đó file này vẽ BẢN MOCKUP
 * ══════════════════════════════════════════════════════════════════════════
 * Đo được lúc nối bảng dịch vào panel:
 *
 *   - `main.tsx` đang `render(<AppCyberpunkUI />)` từ 02/08 16:49.
 *   - `dist/index.html` (bản đã dựng 02/08 21:07, tức bản đang cài trên máy)
 *     **chỉ chứa mockup**: có chuỗi "PRO ENGINE 2026" / "Studio Presets",
 *     và **0 lần** xuất hiện chuỗi của App thật ("Dọn thứ panel đã tạo").
 *   - `AppCyberpunkUI.tsx` không gọi Premiere một lần nào: nút chính chỉ chạy
 *     một `setInterval` cộng dồn `progress` rồi dừng ở 100%. Bấm không ra
 *     phụ đề, không ra marker, không ra file `.srt`.
 *   - `App.tsx` (v2.4.0 — ô chọn sequence, ghim theo ID, nút gỡ phụ đề/marker)
 *     **không nằm trong bản dựng nào cả**.
 *
 * `chu.ts` gọi đúng tên hai file kia: *"BAN MOCKUP GIAO DIEN, KHONG PHAI SAN
 * PHAM"*. Không tài liệu nào (PROGRESS.md · CLAUDE.md) ghi rằng panel đã đổi
 * sang mockup — nên đây là **thứ sót lại của một phiên dựng thử giao diện**,
 * không phải một quyết định.
 *
 * → Trả về `<App />`. Hai file mockup GIỮ NGUYÊN, không xoá.
 *   Muốn xem lại mockup thì đổi đúng một dòng:
 *       import App from './AppCyberpunkUI'      // hoặc './AppNewUI'
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NhaNgonNgu bang={CHU}>
      <App />
    </NhaNgonNgu>
  </React.StrictMode>,
)
