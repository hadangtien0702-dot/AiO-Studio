# =====================================================================
#  AiO Studio VIDEO DOWNLOAD - sign-install.ps1
#  Premiere Beta (CEP 12) BAT BUOC extension phai duoc KY. Script nay:
#    0. Dung chung chi self-signed dung chung ca bo (tao neu chua co)
#    1. Bat PlayerDebugMode (de dung remote debug qua cong 8098)
#    2. Gom file runtime (CSXS, dist, host, bin, .debug) vao folder staging
#    3. Ky thanh ZXP
#    4. Chep de vao %APPDATA%\Adobe\CEP\extensions\com.aiostudio.videodownload
#
#  Chay sau moi lan build:  cd client && npm run build  roi chay script nay.
#  Khong can quyen Admin. ASCII-only cho Windows PowerShell 5.1.
#  Chep tu Autocut/scripts/sign-install.ps1 (da chay that tu 7/2026).
# =====================================================================
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$extId    = 'com.aiostudio.videodownload'
$certDir  = Join-Path $root 'certs'
$sharedCert = Join-Path (Split-Path -Parent $root) 'AiO Asset Manager\certs\aiostudio-dev.p12'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage'
$zxpOut   = Join-Path $root 'build\aio-videodownload.zxp'
$cepExt   = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$target   = Join-Path $cepExt $extId

Write-Host "AiO Studio Video Download - sign & install" -ForegroundColor Cyan

$signDir = Join-Path $root 'client\node_modules\zxp-provider\bin'
if (-not (Test-Path $signDir)) { throw "Chua cai dependencies. Chay: cd client && npm install" }
$sign = Get-ChildItem $signDir -Recurse -Filter 'ZXPSignCmd.exe' |
        Where-Object { $_.FullName -like '*win64*' } |
        Sort-Object FullName -Descending | Select-Object -First 1
if (-not $sign) { throw "Khong tim thay ZXPSignCmd.exe trong zxp-provider." }

if ((-not (Test-Path $certP12)) -and (Test-Path $sharedCert)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  Copy-Item $sharedCert $certP12 -Force
  Write-Host "  Dung lai chung chi dung chung cua bo" -ForegroundColor Gray
}
if (-not (Test-Path $certP12)) {
  Write-Host "  Chua co chung chi, dang tao moi..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  & $sign.FullName -selfSignedCert VN HCM "AiO Studio" "AiO Studio Dev" $certPass $certP12 | Out-Host
  if (-not (Test-Path $certP12)) { throw "Tao chung chi that bai." }
}

foreach ($v in 9..12) {
  $key = "HKCU:\Software\Adobe\CSXS.$v"
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
}

if (-not (Test-Path (Join-Path $root 'dist\index.html'))) {
  throw "Chua co dist\index.html. Chay 'npm run build' trong thu muc client truoc."
}

# Ba binary bat buoc - thieu la panel mo ra bao "Thieu file".
foreach ($b in 'yt-dlp.exe', 'qjs.exe', 'ffmpeg.exe') {
  if (-not (Test-Path (Join-Path $root ('bin\win64\' + $b)))) { throw ("Thieu bin\win64\" + $b) }
}

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
Copy-Item (Join-Path $root 'bin')  (Join-Path $stage 'bin')  -Recurse
if (Test-Path (Join-Path $root '.debug')) { Copy-Item (Join-Path $root '.debug') (Join-Path $stage '.debug') }
Write-Host "  [OK] Staging" -ForegroundColor Green

if (Test-Path $zxpOut) { Remove-Item $zxpOut -Force }
& $sign.FullName -sign $stage $zxpOut $certP12 $certPass -tsa "http://timestamp.digicert.com" 2>&1 | Out-Host
if (-not (Test-Path $zxpOut)) {
  Write-Host "  TSA khong dung duoc, ky khong timestamp..." -ForegroundColor Yellow
  & $sign.FullName -sign $stage $zxpOut $certP12 $certPass 2>&1 | Out-Host
}
if (-not (Test-Path $zxpOut)) { throw "Ky ZXP that bai." }
Write-Host "  [OK] Da ky" -ForegroundColor Green

# Chep de tung file; file dang bi khoa (yt-dlp/ffmpeg dang chay) thi giu ban cu.
if (-not (Test-Path $cepExt)) { New-Item -ItemType Directory -Path $cepExt -Force | Out-Null }
New-Item -ItemType Directory -Path $target -Force | Out-Null
$zipTmp   = Join-Path $env:TEMP 'aiostudio_vd_signed.zip'
$unzipTmp = Join-Path $env:TEMP ('aiostudio_vd_' + [System.Guid]::NewGuid().ToString('N'))
Copy-Item $zxpOut $zipTmp -Force
Expand-Archive -Path $zipTmp -DestinationPath $unzipTmp -Force
$locked = @()
Get-ChildItem $unzipTmp -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($unzipTmp.Length + 1)
  $dst = Join-Path $target $rel
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  try { Copy-Item $_.FullName $dst -Force -ErrorAction Stop } catch { $locked += $rel }
}
Remove-Item $zipTmp -Force -ErrorAction SilentlyContinue
Remove-Item $unzipTmp -Recurse -Force -ErrorAction SilentlyContinue

if (-not (Test-Path (Join-Path $target 'dist\index.html'))) { throw "Cai that bai: thieu dist\index.html." }
if ($locked.Count -gt 0) {
  Write-Host ("  [BO QUA] " + $locked.Count + " file dang bi khoa (giu ban cu):") -ForegroundColor Yellow
  $locked | ForEach-Object { Write-Host ("     " + $_) -ForegroundColor Yellow }
}
Write-Host ("  [OK] Da cai: " + $target) -ForegroundColor Green
Write-Host ""
Write-Host "Xong. Dong panel roi mo lai (Window > Extensions > AiO Studio - Video Download)." -ForegroundColor Cyan
Write-Host "Neu vua sua CSXS\manifest.xml thi phai TAT HAN Premiere roi mo lai."
