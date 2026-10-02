# Theo doi 3 phut (CHI DOC): moi 0,1 giay, khi cua so "Khay anh" cua Shot & Save dang HIEN thi ghi lai
#  - cua so nao dang o TRUOC (foreground), cua so nao nam ngay tai TAM khay (WindowFromPoint)
#  - cac cua so dang hien nam TREN khay trong thu tu tren-duoi ma co phan de len khay
# Ket qua: theo-doi-khay.log canh file nay. Khong hien gi len man, khong dung vao cua so nao.
param([int]$Giay = 180)
$ErrorActionPreference = 'Continue'
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public class TD {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll", EntryPoint="GetWindowLongPtr")] public static extern IntPtr GetWindowLongPtr(IntPtr h, int i);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(POINT p);
  [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint f);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
  static string Ten(IntPtr h) {
    if (h == IntPtr.Zero) return "(khong)";
    uint pid; GetWindowThreadProcessId(h, out pid);
    var t = new StringBuilder(60); GetWindowText(h, t, 60); var c = new StringBuilder(60); GetClassName(h, c, 60);
    long ex = GetWindowLongPtr(h, -20).ToInt64(); RECT r; GetWindowRect(h, out r);
    return "pid" + pid + " [" + c + "] '" + t + "' " + ((ex & 0x8) != 0 ? "TOPMOST " : "") + r.L + "," + r.T + " " + (r.R - r.L) + "x" + (r.B - r.T);
  }
  // tra ve "" neu khay khong hien; nguoc lai mot dong mo ta
  public static string Soi() {
    var ds = new List<IntPtr>(); IntPtr khay = IntPtr.Zero; int viTri = -1;
    EnumWindows((h, l) => { ds.Add(h);
      if (khay == IntPtr.Zero && IsWindowVisible(h)) { var t = new StringBuilder(60); GetWindowText(h, t, 60); var c = new StringBuilder(60); GetClassName(h, c, 60);
        if (c.ToString() == "Chrome_WidgetWin_1" && t.ToString().StartsWith("AiO") && t.ToString().Contains("Khay")) { khay = h; viTri = ds.Count - 1; } }
      return true; }, IntPtr.Zero);
    if (khay == IntPtr.Zero) return "";
    RECT k; GetWindowRect(khay, out k); long exK = GetWindowLongPtr(khay, -20).ToInt64();
    POINT p; p.X = (k.L + k.R) / 2; p.Y = (k.T + k.B) / 2;
    IntPtr tai = GetAncestor(WindowFromPoint(p), 2);
    var tren = new List<string>();
    for (int i = 0; i < viTri; i++) { IntPtr h = ds[i]; if (!IsWindowVisible(h) || IsIconic(h)) continue; RECT r; GetWindowRect(h, out r);
      if (Math.Min(r.R, k.R) - Math.Max(r.L, k.L) > 4 && Math.Min(r.B, k.B) - Math.Max(r.T, k.T) > 4) tren.Add(Ten(h)); }
    return "khay#" + viTri + " " + ((exK & 0x8) != 0 ? "TOPMOST" : "KHONG-TOPMOST") + " " + k.L + "," + k.T + " " + (k.R - k.L) + "x" + (k.B - k.T)
      + " | TAI TAM KHAY: " + (tai == khay ? "chinh khay" : Ten(tai))
      + " | TRUOC (foreground): " + Ten(GetForegroundWindow())
      + " | DE LEN KHAY (" + tren.Count + "): " + String.Join(" ;; ", tren.ToArray());
  }
}
'@
$ra = Join-Path $PSScriptRoot 'theo-doi-khay.log'
"bat dau $(Get-Date -Format 'HH:mm:ss'), theo doi $Giay giay" | Out-File -FilePath $ra -Encoding utf8
$het = (Get-Date).AddSeconds($Giay); $truoc = ''; $dem = 0
while ((Get-Date) -lt $het) {
  $d = [TD]::Soi()
  $rut = $d -replace '^khay#\d+ ', ''
  if ($d -ne '' -and $rut -ne $truoc) { "$(Get-Date -Format 'HH:mm:ss.fff') $d" | Out-File -FilePath $ra -Append -Encoding utf8; $truoc = $rut; $dem++ }
  if ($d -eq '' -and $truoc -ne '') { "$(Get-Date -Format 'HH:mm:ss.fff') (khay an)" | Out-File -FilePath $ra -Append -Encoding utf8; $truoc = '' }
  Start-Sleep -Milliseconds 90
}
"ket thuc $(Get-Date -Format 'HH:mm:ss'), $dem dong" | Out-File -FilePath $ra -Append -Encoding utf8
