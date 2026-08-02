import { useEffect } from 'react'
import { isInHost } from './lib/cep'
import { nodeAvailable } from './lib/node'
import { startAutoReload } from './services/autoReload'
import { useLibrary } from './state/store'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Grid from './components/Grid'
import Toast from './components/Toast'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const init = useLibrary((s) => s.init)
  const initMedia = useLibrary((s) => s.initMedia)
  const settingsOpen = useLibrary((s) => s.settingsOpen)
  const setSettingsOpen = useLibrary((s) => s.setSettingsOpen)

  useEffect(() => {
    if (isInHost() && nodeAvailable()) {
      init()
      void initMedia()
      // [1.0.0] Auto-reload là CÔNG CỤ CỦA NGƯỜI VIẾT CODE: cứ 1,5 giây kiểm
      // tra file và tự tải lại panel khi bản build mới được cài đè. Trong bản
      // PHÁT HÀNH phải tắt — người dùng cài bản cập nhật lúc đang dựng sẽ bị
      // panel reload giữa chừng, mất luôn thao tác đang làm.
      // Bản phát hành build bằng `npm run build:release` (đặt VITE_RELEASE=1).
      if (!import.meta.env.VITE_RELEASE) {
        startAutoReload()
      }
    } else if (import.meta.env.DEV) {
      // Chạy bằng trình duyệt thường (npm run dev) — nạp dữ liệu DEMO để xem giao diện.
      // Nhánh này KHÔNG lọt vào bản build production (import.meta.env.DEV = false).
      void import('./dev/mockData').then((m) => m.seedMockData())
    }
  }, [init, initMedia])

  // [2.0.0] Tách sản phẩm: panel này CHỈ còn Power Bins, nên mở ra là vào thẳng
  // cây Brand -> Khay. Màn hình chào 2 thẻ đã bỏ; Asset Manager nay là panel
  // riêng (com.aiostudio.assetmanager), có kho dữ liệu riêng của nó.
  return (
    <div className="app">
      <Toolbar />

      <div className="body">
        <Sidebar />
        <main className="content">
          <Grid />
        </main>
      </div>

      {/* Cài đặt thuộc về cả tool -> render ở cấp App, mở được từ mọi màn hình */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      <Toast />
    </div>
  )
}
