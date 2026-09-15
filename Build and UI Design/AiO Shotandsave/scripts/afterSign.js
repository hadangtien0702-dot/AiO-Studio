'use strict'
/* Ky AD-HOC ban mac sau khi electron-builder dong goi (15/09).
   Ly do: khong mua chung chi Apple (anh chot 14/08). Khong ky gi ca thi Intel chi bi Gatekeeper canh bao,
   nhung CHIP M tu choi hoan toan: "AiO Shot & Save is damaged and can't be opened" (anh cai thu 15/09).
   Ky ad-hoc (`--sign -`) = chu ky khong danh tinh, du de chip M chay; nguoi dung van phai "Open Anyway" 1 lan.
   Chay tren runner mac cua GitHub Actions; tren Windows/Linux ham nay bo qua. */
const { execFileSync } = require('child_process')
const path = require('path')
exports.default = async function (context) {
  if (process.platform !== 'darwin') return
  const app = path.join(context.appOutDir, context.packager.appInfo.productFilename + '.app')
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' })
  const kq = execFileSync('codesign', ['-dv', '--verbose=2', app], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  console.log('[afterSign] da ky ad-hoc: ' + app)
}
