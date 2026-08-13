import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
// Nạp SAU `styles.css` — giao diện mới thắng ở những tên class trùng
// (`.topbar`, `.btn`, `.seg`). Xem đầu file để biết vì sao tách riêng.
import './giao-dien.css'
// Song ngu VI/EN — bọc TOÀN BỘ App để mọi component gọi được `useNgonNgu()`.
// Bảng chữ ở `chu.ts`, cơ chế ở `ngonngu.tsx` (nguồn chân lý: design-system).
import { NhaNgonNgu } from './ngonngu'
import { CHU } from './chu'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NhaNgonNgu bang={CHU}>
      <App />
    </NhaNgonNgu>
  </React.StrictMode>,
)
