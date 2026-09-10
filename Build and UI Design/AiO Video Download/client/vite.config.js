import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
// Version LAY TU package.json, khong go tay o day (cung luat voi Autocut).
// Kiem 3 cho (manifest x2, package.json): node design-system/version.mjs
var PKG = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// CEP nap panel qua file://, Chromium chan ES module roi qua file:// -> nhung
// toan bo JS/CSS vao MOT index.html (viteSingleFile). Pattern chuan cua ca bo.
export default defineConfig({
    define: { __VERSION__: JSON.stringify(PKG.version) },
    plugins: [react(), viteSingleFile()],
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        target: 'chrome88',
        assetsInlineLimit: 100000000,
        cssCodeSplit: false,
        rollupOptions: { output: { inlineDynamicImports: true } },
    },
    server: { port: 5178, strictPort: true },
});
