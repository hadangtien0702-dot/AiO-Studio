import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
// Version LAY TU package.json, khong go tay o day.
// Anh Tien 30/07: *"em nho them cac ki hieu version cua 4 tool hien tai"*.
// Do luc do: ca 4 panel lech version giua nhat ky va manifest, va da hai lan
// panel chay ban cu ma khong ai biet.
// Dong bo + kiem 3 cho (manifest x2, package.json) bang:
//     node design-system/version.mjs        (do)
//     node design-system/version.mjs --sua  (ghi)
var PKG = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// CEP nạp panel qua file://, mà Chromium chặn nạp ES module + asset rời qua file://.
// => Dùng viteSingleFile để NHÚNG toàn bộ JS/CSS thẳng vào index.html (1 file duy nhất),
//    không còn file rời để bị chặn. Đây là pattern chuẩn cho panel CEP.
export default defineConfig({
    // Nhung version vao ban build de panel TU BAO no la ban nao.
    define: { __VERSION__: JSON.stringify(PKG.version) },
    plugins: [react(), viteSingleFile()],
    base: './',
    css: {
        preprocessorOptions: {
            // API cũ của Sass sẽ bị bỏ ở Dart Sass 2.0 — dùng trình biên dịch mới.
            scss: { api: 'modern-compiler' },
        },
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome88',
        // Gộp thành 1 chunk, không tách file.
        assetsInlineLimit: 100000000,
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            },
        },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
});
