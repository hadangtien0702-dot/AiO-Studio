'use strict'

/* TEN UNG DUNG DANG NAM DUOI MOT DIEM MAN HINH (06/11/2026) — chi de dien {app} trong mau ten file tu dat.
   Khong them mo-dun native (anh chot 14/09): goi cong cu CO SAN cua he dieu hanh, mot lan, chay nen, chi khi mau ten co {app}.
   - Windows: powershell + Add-Type C# (WindowFromPoint / GetAncestor / GetWindowThreadProcessId). Diem vao la PIXEL VAT LY.
   - macOS: osascript JXA (CGWindowListCopyWindowInfo), diem la DIP. ☠️ CHUA DO TREN MAC.
   Tra ten tien trinh ("chrome", "Code", "Premiere Pro"), rong neu khong tim duoc / het gio. KHONG BAO GIO nem. */

const { spawn } = require('child_process')

const CS_WIN = `
using System; using System.Runtime.InteropServices; using System.Diagnostics;
public static class AioApp {
  [StructLayout(LayoutKind.Sequential)] struct PT { public int X, Y; }
  [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(PT p);
  [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr h, uint f);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  public static string Lay(int x, int y, int boQuaPid) {
    try { SetProcessDPIAware(); } catch (Exception) {}
    PT p; p.X = x; p.Y = y;
    IntPtr h = WindowFromPoint(p); if (h == IntPtr.Zero) return "";
    h = GetAncestor(h, 2); uint pid; GetWindowThreadProcessId(h, out pid);
    if (pid == 0 || pid == (uint)boQuaPid) return "";
    try { return Process.GetProcessById((int)pid).ProcessName; } catch (Exception) { return ""; }
  }
}`

const psWin = (x, y, pid) => `$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
${CS_WIN}
'@
[Console]::Out.Write([AioApp]::Lay(${Math.round(x)}, ${Math.round(y)}, ${Number(pid) >>> 0}))`

const jxaMac = (x, y, pid) => `ObjC.import('CoreGraphics');
var raw = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0);
var arr = ObjC.deepUnwrap(ObjC.castRefToObject(raw)), kq = '';
for (var i = 0; i < arr.length; i++) {
  var w = arr[i], b = w.kCGWindowBounds;
  if (!b || w.kCGWindowLayer !== 0 || w.kCGWindowOwnerPID === ${Number(pid) >>> 0}) continue;
  if (${Math.round(x)} >= b.X && ${Math.round(x)} <= b.X + b.Width && ${Math.round(y)} >= b.Y && ${Math.round(y)} <= b.Y + b.Height) { kq = w.kCGWindowOwnerName || ''; break; }
}
kq;`

function chay(lenh, args, gioiHanMs) {
  return new Promise((xong) => {
    let out = '', daXong = false
    const ket = (ok) => { if (daXong) return; daXong = true; clearTimeout(tm); xong(ok ? out : '') }
    let p
    try { p = spawn(lenh, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }) } catch (e) { xong(''); return }
    const tm = setTimeout(() => { try { p.kill() } catch (e) {} ket(false) }, gioiHanMs)
    p.stdout.on('data', (d) => { out += d.toString('utf8') })
    p.on('error', () => ket(false))
    p.on('close', (code) => ket(code === 0))
  })
}

/** (x, y): Windows = pixel vat ly, Mac = DIP toan cuc. */
async function lay(x, y, opts) {
  const pid = (opts && opts.pid) || process.pid
  const gioiHan = (opts && opts.gioiHanMs) || 6000
  let ten = ''
  if (process.platform === 'win32') {
    ten = await chay('powershell.exe', ['-NoProfile', '-NonInteractive', '-NoLogo', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(psWin(x, y, pid), 'utf16le').toString('base64')], gioiHan)
  } else if (process.platform === 'darwin') {
    ten = await chay('/usr/bin/osascript', ['-l', 'JavaScript', '-e', jxaMac(x, y, pid)], gioiHan)
  }
  ten = String(ten || '').trim()
  return ten ? ten.charAt(0).toUpperCase() + ten.slice(1) : ''
}

module.exports = { lay }
