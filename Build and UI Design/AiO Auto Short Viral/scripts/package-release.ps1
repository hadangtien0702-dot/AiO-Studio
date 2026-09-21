# =====================================================================
#  AiO Studio AUTO SHORT VIRAL - package-release.ps1
#
#  Dong goi BAN PHAT HANH cho nguoi dung cuoi:
#    1. Build client
#    2. Staging KHONG co .debug (cong 8100 khong thuoc ban phat hanh)
#    3. Ky ZXP co SO PHIEN BAN trong ten
#    4. Kem HUONG-DAN-CAI-DAT.txt + CAI-DAT.bat (bo cai tu chay, khong can
#       ZXP Installer) -> gom thanh MOT file SETUP.zip
#
#  Chay:  powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
#  Khong can Admin. ASCII-only cho Windows PowerShell 5.1.
#  Chep khuon tu Autocut/scripts/package-release.ps1.
#
#  Bo cai sinh ra o build\ cua panel; chep TAY sang
#  Release\AiO Auto Short Viral\win\ (chi giu ban moi nhat - Release\README.md).
# =====================================================================
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$extId    = 'com.aiostudio.shortviral'
$certDir  = Join-Path $root 'certs'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage-release'
$outDir   = Join-Path $root 'build\release'

Write-Host "AiO Studio Auto Short Viral - dong goi" -ForegroundColor Cyan

$manifestPath = Join-Path $root 'CSXS\manifest.xml'
[xml]$manifest = Get-Content $manifestPath
$version = $manifest.ExtensionManifest.ExtensionBundleVersion
$bundleName = $manifest.ExtensionManifest.ExtensionBundleName
if (-not $version) { throw "Khong doc duoc ExtensionBundleVersion trong manifest.xml" }
Write-Host ("  Phien ban: " + $version + "  (" + $bundleName + ")") -ForegroundColor Gray

$signDir = Join-Path $root 'client\node_modules\zxp-provider\bin'
if (-not (Test-Path $signDir)) { throw "Chua cai dependencies. Chay: cd client && npm install" }
$sign = Get-ChildItem $signDir -Recurse -Filter 'ZXPSignCmd.exe' |
        Where-Object { $_.FullName -like '*win64*' } |
        Sort-Object FullName -Descending | Select-Object -First 1
if (-not $sign) { throw "Khong tim thay ZXPSignCmd.exe trong zxp-provider." }

$sharedCert = Join-Path (Split-Path -Parent $root) 'AiO Asset Manager\certs\aiostudio-dev.p12'
if ((-not (Test-Path $certP12)) -and (Test-Path $sharedCert)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  Copy-Item $sharedCert $certP12 -Force
}
if (-not (Test-Path $certP12)) { throw "Chua co chung chi ky. Chay scripts\sign-install.ps1 mot lan de tao." }

# --- 1. Build ---
Write-Host "  Dang build..." -ForegroundColor Gray
Push-Location (Join-Path $root 'client')
try {
  # KHONG dung `2>&1` voi lenh native (PowerShell 5.1 boc stderr thanh loi).
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & cmd /c "npm run build"
  $buildExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($buildExit -ne 0) { throw "Build that bai (ma thoat $buildExit)." }
} finally { Pop-Location }
if (-not (Test-Path (Join-Path $root 'dist\index.html'))) { throw "Khong thay dist\index.html sau khi build." }

# --- 2. Staging (KHONG .debug) ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
# Ban phat hanh CHAN CUNG khi thieu (khac ban dev chi canh bao): may khach
# thuong CHUA co dem nghe san -> ngay lan dau da can ffmpeg tach tieng cho whisper.
foreach ($b in 'ffmpeg.exe', 'ffprobe.exe') {
  if (-not (Test-Path (Join-Path $root ('bin\win64\' + $b)))) { throw ("Thieu bin\win64\" + $b + " - goi se khong chay duoc.") }
}
Copy-Item (Join-Path $root 'bin') (Join-Path $stage 'bin') -Recurse
# LGPL: phai kem toan van giay phep + ghi ro dung ban nao.
foreach ($gp in 'LICENSE-FFmpeg.txt', 'THIRD-PARTY-NOTICE.txt') {
  $nguon = Join-Path $root $gp
  if (Test-Path $nguon) { Copy-Item $nguon (Join-Path $stage $gp) }
  else { Write-Host ("  [CANH BAO] Thieu " + $gp + " - ban ra la vi pham giay phep.") -ForegroundColor Yellow }
}
Write-Host "  [OK] Staging (khong kem .debug)" -ForegroundColor Green

# --- 3. Ky ---
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$zxpOut = Join-Path $outDir ("AiO-Studio-AutoShortViral-" + $version + ".zxp")
if (Test-Path $zxpOut) { Remove-Item $zxpOut -Force }
& $sign.FullName -sign $stage $zxpOut $certP12 $certPass -tsa "http://timestamp.digicert.com" 2>&1 | Out-Host
if (-not (Test-Path $zxpOut)) {
  Write-Host "  TSA khong dung duoc, ky khong timestamp..." -ForegroundColor Yellow
  & $sign.FullName -sign $stage $zxpOut $certP12 $certPass 2>&1 | Out-Host
}
if (-not (Test-Path $zxpOut)) { throw "Ky ZXP that bai." }
& $sign.FullName -verify $zxpOut 2>&1 | Out-Host
$sizeMb = [math]::Round((Get-Item $zxpOut).Length / 1MB, 1)
Write-Host ("  [OK] Da tao: " + $zxpOut + "  (" + $sizeMb + " MB)") -ForegroundColor Green

# --- 4. Huong dan ---
$guide = Join-Path $outDir 'HUONG-DAN-CAI-DAT.txt'
# [14/09/2026] Anh Tien chot: huong dan cai cho nguoi dung cuoi = DUNG cac buoc
# cai, het. Khong changelog, khong duong dan, khong cach go (viec cua minh -
# ghi o CHANGELOG/PROGRESS). Truoc khi gui: MO RA DOC HET (bay 3d 19/08).
$lines = @(
  ("AiO Studio - Auto Short Viral " + $version + " - " + (Get-Date -Format "dd/MM/yyyy")),
  "",
  "1. Dong Premiere Pro.",
  "2. Giai nen file .zip, bam dup CAI-DAT.bat (khong can Admin).",
  "3. Mo Premiere -> Window -> Extensions -> AiO Studio - Auto Short Viral."
)
$lines | Out-File -FilePath $guide -Encoding utf8

# --- 5. Bo cai tu chay ---
$installPs1 = Join-Path $outDir 'cai-dat.ps1'
@'
# Cai AiO Studio - Auto Short Viral vao Adobe Premiere Pro. Chay bang CAI-DAT.bat.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$zxp = Get-ChildItem $here -Filter '*.zxp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zxp) { Write-Host "Khong tim thay file .zxp trong thu muc nay." -ForegroundColor Red; exit 1 }
Write-Host ("Ban se cai: " + $zxp.Name) -ForegroundColor Gray
$target = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.aiostudio.shortviral'
$zip = Join-Path $env:TEMP 'aio_sv_install.zip'
$tmp = Join-Path $env:TEMP ('aio_sv_install_' + [System.Guid]::NewGuid().ToString('N'))
Write-Host "Dang cai..." -ForegroundColor Cyan
Copy-Item $zxp.FullName $zip -Force
Expand-Archive -Path $zip -DestinationPath $tmp -Force
New-Item -ItemType Directory -Path $target -Force | Out-Null
$locked = @()
Get-ChildItem $tmp -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($tmp.Length + 1)
  $dst = Join-Path $target $rel
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  try { Copy-Item $_.FullName $dst -Force -ErrorAction Stop } catch { $locked += $rel }
}
Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue
foreach ($v in 9..12) {
  $key = "HKCU:\Software\Adobe\CSXS.$v"
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
}
if (-not (Test-Path (Join-Path $target 'dist\index.html'))) { Write-Host "CAI THAT BAI: thieu file trong ban cai." -ForegroundColor Red; exit 1 }
if ($locked.Count -gt 0) {
  Write-Host ""; Write-Host "Mot so file dang bi khoa (Premiere con dang mo?):" -ForegroundColor Yellow
  $locked | ForEach-Object { Write-Host ("   " + $_) -ForegroundColor Yellow }
  Write-Host "Hay dong han Premiere roi chay lai file nay." -ForegroundColor Yellow
}
Write-Host ""; Write-Host "DA CAI XONG." -ForegroundColor Green
Write-Host "Mo Premiere Pro -> Window -> Extensions -> AiO Studio - Auto Short Viral"
'@ | Out-File -FilePath $installPs1 -Encoding utf8

$installBat = Join-Path $outDir 'CAI-DAT.bat'
@'
@echo off
title AiO Studio - Auto Short Viral : Cai dat
echo.
echo    AiO Studio - Auto Short Viral
echo    =============================
echo.
echo    HAY DONG HAN PREMIERE PRO TRUOC KHI CAI.
echo.
pause
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cai-dat.ps1"
echo.
pause
'@ | Out-File -FilePath $installBat -Encoding ascii

$bundle = Join-Path (Join-Path $root 'build') ("AiO-Studio-AutoShortViral-" + $version + "-SETUP.zip")
if (Test-Path $bundle) { Remove-Item $bundle -Force }
Compress-Archive -Path @($zxpOut, $installBat, $installPs1, $guide) -DestinationPath $bundle -CompressionLevel Optimal
$bundleMb = [math]::Round((Get-Item $bundle).Length / 1MB, 1)
Write-Host ""
Write-Host "XONG." -ForegroundColor Cyan
Write-Host ("  MOT FILE DE GUI DI:  " + $bundle + "  (" + $bundleMb + " MB)") -ForegroundColor Green
