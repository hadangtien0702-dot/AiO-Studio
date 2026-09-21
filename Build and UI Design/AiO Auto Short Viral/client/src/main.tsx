import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// styles.css nạp ở GỐC (bài học Transcripts 13/08: nạp trong component không
// được vẽ ra thì bản dựng thật không có một dòng CSS nào).
import './styles.css'
import { NhaNgonNgu } from './ngonngu'
import { CHU } from './chu'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NhaNgonNgu bang={CHU}>
      <App />
    </NhaNgonNgu>
  </React.StrictMode>,
)
