# Bam chuot trai MOT lan tai toa do man hinh (diem anh that) roi tra con tro ve cho cu. Dung: bam-xy.ps1 <x> <y>
param([int]$x, [int]$y)
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class BamXY {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT p);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, UIntPtr e);
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
}
"@
[void][BamXY]::SetProcessDPIAware()
$cu = New-Object BamXY+POINT; [void][BamXY]::GetCursorPos([ref]$cu)
[void][BamXY]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 200
[BamXY]::mouse_event(0x2, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 70
[BamXY]::mouse_event(0x4, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 150
[void][BamXY]::SetCursorPos($cu.X, $cu.Y)
