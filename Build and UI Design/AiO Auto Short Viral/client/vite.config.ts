import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'node:fs'

// Version LẤY TỪ package.json, không gõ tay ở đây (cùng luật với Autocut).
// Kiểm 3 chỗ (manifest ×2, package.json): node design-system/version.mjs
const PKG = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// CEP nạp panel qua file://, Chromium chặn ES module rời qua file:// → nhúng
// toàn bộ JS/CSS vào MỘT index.html (viteSingleFile). Khuôn chuẩn của cả bộ.
//
// ☠️ Cổng dev 5179 — cổng kề dưới đã có panel khác giữ. Hai panel cùng mở
// `npm run dev` mà trùng cổng thì `strictPort` làm cái sau báo lỗi ngay, thay vì
// lặng lẽ nhảy sang một cổng khác mà người mở trình duyệt không biết.
export default defineConfig(({ command }) => ({
  define: { __VERSION__: JSON.stringify(PKG.version) },
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'chrome88',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  // CHỈ lúc chạy dev (`vite` = command 'serve'): tắt `fs.strict` để trang dev nạp
  // được đệm nghe MẪU (`<tên>.autocut-nghe.json` nằm cạnh video trong Test Media,
  // ngoài thư mục panel) qua đường `/@fs/E:/...`. Mặc định Vite chặn mọi file
  // ngoài gốc dự án → fetch trả 403 và giao diện trông như "đệm rỗng" (bẫy 5m:
  // kết quả rỗng thì nghi ĐƯỜNG TẢI trước).
  // Vì sao không bật luôn: bản build chạy trong Premiere qua file:// không cần nó,
  // và máy chủ dev mở toang ổ đĩa chỉ nên sống trên máy người làm, lúc làm.
  server:
    command === 'serve'
      ? { port: 5179, strictPort: true, fs: { strict: false } }
      : { port: 5179, strictPort: true },
}))
