import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
// Nạp SAU `styles.css` — giao diện mới thắng ở những tên class trùng
// (`.topbar`, `.btn`, `.seg`). Xem đầu file để biết vì sao tách riêng.
import './giao-dien.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
