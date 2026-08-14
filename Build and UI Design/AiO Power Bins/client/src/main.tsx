import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/main.scss'
// Song ngu VI/EN — boc TOAN BO App de moi component goi duoc `useNgonNgu()`.
// Bang chu o `chu.ts`, co che o `ngonngu.tsx` (nguon chan ly: design-system).
import { NhaNgonNgu } from './ngonngu'
import { CHU } from './chu'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NhaNgonNgu bang={CHU}>
      <App />
    </NhaNgonNgu>
  </StrictMode>,
)
