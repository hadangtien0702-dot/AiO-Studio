'use strict'

/* Lay DANH SACH CUA SO dang mo + vi tri (05/11/2026) cho tinh nang "re chuot chon cua so".
   KHONG them mo-dun native (anh chot 14/09): chi goi cong cu CO SAN cua he dieu hanh, mot lan luc mo overlay, chay nen.
   - Windows: powershell.exe + Add-Type C# goi EnumWindows / DwmGetWindowAttribute (user32 + dwmapi la co san).
     Script tu bat DPI-aware nen toa do ra PIXEL VAT LY (cung he voi screen.dipToScreenPoint cua main.js).
   - macOS: osascript -l JavaScript goi CGWindowListCopyWindowInfo (CoreGraphics co san). Toa do ra DIP (point);
     main.js doi sang phys bang raPhys. ☠️ CHUA DO TREN MAC (khong co may o day): loi thi tra danh sach rong =
     tinh nang tu tat tren Mac, bam khong chon cua so, keo chon van nhu cu.
   Thu tu ra: cua so TREN CUNG truoc (z-order). Dau ra moi dong "x y w h". Khong ghi file, khong mang. */

const { spawn } = require('child_process')

const CS_WIN = `
using System; using System.Collections.Generic; using System.Runtime.InteropServices; using System.Text;
public static class AioCs {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll", EntryPoint="GetWindowLongW")] static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr c);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out int v, int sz);
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT v, int sz);
  public static string Lay(uint boQuaPid) {
    try { if (!SetProcessDpiAwarenessContext(new IntPtr(-4))) SetProcessDPIAware(); } catch (Exception) { try { SetProcessDPIAware(); } catch (Exception) {} }
    var sb = new StringBuilder();
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h) || IsIconic(h)) return true;
      int cloaked; if (DwmGetWindowAttribute(h, 14, out cloaked, 4) == 0 && cloaked != 0) return true;
      int ex = GetWindowLong(h, -20);
      if ((ex & 0x80) != 0) return true;      // WS_EX_TOOLWINDOW
      if ((ex & 0x20) != 0) return true;      // WS_EX_TRANSPARENT (click xuyen: lop phu cua app khac)
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pid == boQuaPid) return true;       // cua so cua chinh app nay (overlay, khay...)
      var cls = new StringBuilder(128); GetClassName(h, cls, 128);
      string c = cls.ToString();
      if (c == "Progman" || c == "WorkerW") return true;                 // hinh nen desktop
      var tit = new StringBuilder(8); GetWindowText(h, tit, 8);
      if (tit.Length == 0 && c != "Shell_TrayWnd") return true;          // cua so khong tieu de (lop ao he thong)
      RECT r;
      if (DwmGetWindowAttribute(h, 9, out r, 16) != 0 && !GetWindowRect(h, out r)) return true; // 9 = khung nhin thay duoc (khong tinh bong)
      int w = r.R - r.L, hh = r.B - r.T;
      if (w < 20 || hh < 20) return true;
      sb.Append(r.L).Append(' ').Append(r.T).Append(' ').Append(w).Append(' ').Append(hh).Append('\\n');
      return true;
    }, IntPtr.Zero);
    return sb.ToString();
  }
}`

const PS_WIN = (pid) => `$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
${CS_WIN}
'@
[Console]::Out.Write([AioCs]::Lay(${Number(pid) >>> 0}))`

const JXA_MAC = (pid) => `ObjC.import('CoreGraphics');
var raw = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0);
var arr = ObjC.deepUnwrap(ObjC.castRefToObject(raw));
var out = [];
for (var i = 0; i < arr.length; i++) {
  var w = arr[i], b = w.kCGWindowBounds;
  if (!b || w.kCGWindowLayer !== 0 || w.kCGWindowOwnerPID === ${Number(pid) >>> 0}) continue;
  if (typeof w.kCGWindowAlpha === 'number' && w.kCGWindowAlpha <= 0) continue;
  if (b.Width < 20 || b.Height < 20) continue;
  out.push(Math.round(b.X) + ' ' + Math.round(b.Y) + ' ' + Math.round(b.Width) + ' ' + Math.round(b.Height));
}
out.join('\\n');`

/** Chay lenh, tra { ok, out, ms } — KHONG BAO GIO nem loi / treo qua han (het gio thi giet tien trinh, ok=false). */
function chay(lenh, args, gioiHanMs) {
  return new Promise((xong) => {
    const t0 = Date.now()
    let out = '', xongRoi = false
    const ket = (ok) => { if (xongRoi) return; xongRoi = true; clearTimeout(tm); xong({ ok, out, ms: Date.now() - t0 }) }
    let p
    try { p = spawn(lenh, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }) } catch (e) { xong({ ok: false, out: '', ms: 0 }); return }
    const tm = setTimeout(() => { try { p.kill() } catch (e) {} ket(false) }, gioiHanMs)
    p.stdout.on('data', (d) => { out += d.toString('utf8') })
    p.on('error', () => ket(false))
    p.on('close', (code) => ket(code === 0))
  })
}

/** Lay danh sach cua so. Tra Promise<{ ok, text, ms }>; text = cac dong "x y w h" (Windows: phys; Mac: DIP). */
function layDanhSach(opts) {
  const pid = (opts && opts.pid) || process.pid
  const gioiHan = (opts && opts.gioiHanMs) || 6000
  if (process.platform === 'win32') {
    const b64 = Buffer.from(PS_WIN(pid), 'utf16le').toString('base64')
    return chay('powershell.exe', ['-NoProfile', '-NonInteractive', '-NoLogo', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', b64], gioiHan)
      .then((r) => ({ ok: r.ok, text: r.out, ms: r.ms }))
  }
  if (process.platform === 'darwin') {
    return chay('/usr/bin/osascript', ['-l', 'JavaScript', '-e', JXA_MAC(pid)], gioiHan)
      .then((r) => ({ ok: r.ok, text: r.out, ms: r.ms }))
  }
  return Promise.resolve({ ok: false, text: '', ms: 0 })
}

module.exports = { layDanhSach, PS_WIN, JXA_MAC }
