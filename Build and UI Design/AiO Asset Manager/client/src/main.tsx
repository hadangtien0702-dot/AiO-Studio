import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/main.scss'
// Song ngu VI/EN — bọc TOÀN BỘ App để mọi component gọi được `useNgonNgu()`.
// Bảng chữ ở `chu.ts`, cơ chế ở `ngonngu.tsx` (nguồn chân lý: design-system).
import { NhaNgonNgu } from './ngonngu'
import { CHU } from './chu'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NhaNgonNgu bang={CHU}>
      <App />
    </NhaNgonNgu>
  </StrictMode>,
)
