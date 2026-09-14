# Cai AiO Studio - Autocut vao Adobe Premiere Pro.
# Chay bang CAI-DAT.bat (bam dup). Khong can quyen Admin.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
# Neu vi ly do nao do co nhieu file .zxp thi lay ban MOI NHAT, dung lay ban dau
# danh sach (sap theo ten se ra 1.0.0 truoc 1.0.1 -> cai nham ban cu).
$zxp = Get-ChildItem $here -Filter '*.zxp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zxp) { Write-Host "Khong tim thay file .zxp trong thu muc nay." -ForegroundColor Red; exit 1 }
Write-Host ("Ban se cai: " + $zxp.Name) -ForegroundColor Gray

$target = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.aiostudio.autocut'
$zip = Join-Path $env:TEMP 'aio_install.zip'
$tmp = Join-Path $env:TEMP ('aio_install_' + [System.Guid]::NewGuid().ToString('N'))

Write-Host "Dang cai..." -ForegroundColor Cyan
Copy-Item $zxp.FullName $zip -Force
Expand-Archive -Path $zip -DestinationPath $tmp -Force
New-Item -ItemType Directory -Path $target -Force | Out-Null

# Chep de tung file. File dang bi khoa (Premiere con mo) thi bo qua va bao ten.
$locked = @()
Get-ChildItem $tmp -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($tmp.Length + 1)
  $dst = Join-Path $target $rel
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  try { Copy-Item $_.FullName $dst -Force -ErrorAction Stop } catch { $locked += $rel }
}
Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue

# Premiere doi extension phai duoc ky; bat co cho phep chay ban ky self-signed.
foreach ($v in 9..12) {
  $key = "HKCU:\Software\Adobe\CSXS.$v"
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
}

if (-not (Test-Path (Join-Path $target 'dist\index.html'))) {
  Write-Host "CAI THAT BAI: thieu file trong ban cai." -ForegroundColor Red
  exit 1
}
if ($locked.Count -gt 0) {
  Write-Host ""
  Write-Host "Mot so file dang bi khoa (Premiere con dang mo?):" -ForegroundColor Yellow
  $locked | ForEach-Object { Write-Host ("   " + $_) -ForegroundColor Yellow }
  Write-Host "Hay dong han Premiere roi chay lai file nay." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "DA CAI XONG." -ForegroundColor Green
Write-Host "Mo Premiere Pro -> Window -> Extensions -> AiO Studio - Autocut"
