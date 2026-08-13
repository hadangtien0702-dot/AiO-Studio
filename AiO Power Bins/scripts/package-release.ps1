# =====================================================================
#  AiO Studio - package-release.ps1
#
#  Dong goi BAN PHAT HANH cho nguoi dung cuoi. Khac sign-install.ps1 o ba diem:
#    1. Build bang `npm run build:release` -> VITE_RELEASE=1 -> TAT auto-reload
#       (cong cu cua nguoi viet code; nguoi dung cai de len ban dang chay se bi
#        panel reload giua chung)
#    2. KHONG dong goi file .debug (cong debug 8088 khong thuoc ban phat hanh)
#    3. Xuat ra file co SO PHIEN BAN trong ten, kem huong dan cai dat
#
#  Chay:  powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
#  Khong can quyen Admin. ASCII-only cho Windows PowerShell 5.1.
#
#  -BinChung : KHONG kem FFmpeg vao goi. Panel se lay tu kho dung chung
#              %APPDATA%\AiOStudio\bin\win64 (cai bang design-system\
#              cai-bin-chung.ps1). Goi tut tu ~91,5 MB xuong ~0,2 MB.
#              MAC DINH TAT - bat len thi goi KHONG tu chay duoc neu may chua
#              co kho chung, nen chi dung khi dong bo cai ghep ca bo.
#              CHU Y: panel nay can CA ffmpeg.exe LAN ffprobe.exe (probe.ts).
# =====================================================================
param(
  [switch]$BinChung
)

$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$certDir  = Join-Path $root 'certs'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage-release'
$outDir   = Join-Path $root 'build\release'

Write-Host "AiO Studio - dong goi ban phat hanh" -ForegroundColor Cyan

# --- Doc so phien ban tu manifest (mot nguon su that duy nhat) ---
$manifestPath = Join-Path $root 'CSXS\manifest.xml'
[xml]$manifest = Get-Content $manifestPath
$version = $manifest.ExtensionManifest.ExtensionBundleVersion
$bundleName = $manifest.ExtensionManifest.ExtensionBundleName
if (-not $version) { throw "Khong doc duoc ExtensionBundleVersion trong manifest.xml" }
Write-Host ("  Phien ban: " + $version + "  (" + $bundleName + ")") -ForegroundColor Gray

# --- Tim ZXPSignCmd ---
$signDir = Join-Path $root 'client\node_modules\zxp-provider\bin'
if (-not (Test-Path $signDir)) { throw "Chua cai dependencies. Chay: cd client && npm install" }
$sign = Get-ChildItem $signDir -Recurse -Filter 'ZXPSignCmd.exe' |
        Where-Object { $_.FullName -like '*win64*' } |
        Sort-Object FullName -Descending | Select-Object -First 1
if (-not $sign) { throw "Khong tim thay ZXPSignCmd.exe trong zxp-provider." }

if (-not (Test-Path $certP12)) {
  throw "Chua co chung chi ky. Chay scripts\sign-install.ps1 mot lan de tao."
}

# --- 1. Build ban phat hanh ---
Write-Host "  Dang build ban phat hanh (tat auto-reload)..." -ForegroundColor Gray
Push-Location (Join-Path $root 'client')
try {
  # KHONG dung `2>&1` voi lenh native: Windows PowerShell 5.1 boc moi dong
  # stderr thanh ErrorRecord, va vite in mot dong canh bao vo hai ra stderr
  # -> script chet oan du build thanh cong. Doi lai: ha ErrorActionPreference
  # trong dung doan nay va tu kiem tra ma thoat.
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & cmd /c "npm run build:release"
  $buildExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($buildExit -ne 0) { throw "Build that bai (ma thoat $buildExit)." }
} finally {
  Pop-Location
}

$distIndex = Join-Path $root 'dist\index.html'
if (-not (Test-Path $distIndex)) { throw "Khong thay dist\index.html sau khi build." }

# Chot chan: ban phat hanh KHONG duoc con auto-reload.
$distText = Get-Content $distIndex -Raw
if ($distText -match 'startAutoReload\(\)') {
  Write-Host "  [CANH BAO] Van thay startAutoReload() trong ban build." -ForegroundColor Yellow
  Write-Host "             Kiem tra lai client\.env.release va App.tsx." -ForegroundColor Yellow
}

# --- 2. Staging sach (KHONG co .debug) ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
if ($BinChung) {
  # [13/08/2026] Bo qua bin/ - panel tim FFmpeg o kho dung chung
  # %APPDATA%\AiOStudio\bin\win64 (ung vien cuoi trong getFFmpegPath /
  # getFFprobePath). Panel nay can CA HAI file.
  Write-Host "  [BIN CHUNG] Khong kem FFmpeg - goi se can kho chung tren may" -ForegroundColor Yellow
} elseif (Test-Path (Join-Path $root 'bin')) {
  Copy-Item (Join-Path $root 'bin') (Join-Path $stage 'bin') -Recurse
}
# [2.0.0] LGPL BAT BUOC: ban ra thi phai kem toan van giay phep + ghi ro dung
# FFmpeg ban nao, lay nguon o dau. Thieu hai file nay la vi pham.
foreach ($gp in 'LICENSE-FFmpeg.txt', 'THIRD-PARTY-NOTICE.txt') {
  $nguon = Join-Path $root $gp
  if (Test-Path $nguon) { Copy-Item $nguon (Join-Path $stage $gp) }
  else { Write-Host ("  [CANH BAO] Thieu " + $gp + " - ban ra la vi pham LGPL.") -ForegroundColor Yellow }
}
Write-Host "  [OK] Staging (khong kem .debug)" -ForegroundColor Green

# --- 3. Ky ---
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$zxpOut = Join-Path $outDir ("AiO-Studio-Asset-Manager-" + $version + ".zxp")
if (Test-Path $zxpOut) { Remove-Item $zxpOut -Force }

& $sign.FullName -sign $stage $zxpOut $certP12 $certPass -tsa "http://timestamp.digicert.com" 2>&1 | Out-Host
if (-not (Test-Path $zxpOut)) {
  Write-Host "  TSA khong dung duoc, ky khong timestamp..." -ForegroundColor Yellow
  & $sign.FullName -sign $stage $zxpOut $certP12 $certPass 2>&1 | Out-Host
}
if (-not (Test-Path $zxpOut)) { throw "Ky ZXP that bai." }

# --- 4. Kiem tra goi da ky ---
& $sign.FullName -verify $zxpOut 2>&1 | Out-Host

$sizeMb = [math]::Round((Get-Item $zxpOut).Length / 1MB, 1)
Write-Host ("  [OK] Da tao: " + $zxpOut + "  (" + $sizeMb + " MB)") -ForegroundColor Green

# --- 5. Huong dan cai dat di kem ---
$guide = Join-Path $outDir 'HUONG-DAN-CAI-DAT.txt'
$lines = @(
  ("AiO Studio - Power Bins  " + $version),
  "Panel quan ly asset cho Adobe Premiere Pro (Windows).",
  "",
  "YEU CAU",
  "  - Windows 10/11",
  "  - Adobe Premiere Pro (da kiem chung tren Beta 26.5 / CEP 12)",
  "  - KHONG can cai them gi ca: khong can Python, khong can Node.js,",
  "    khong can FFmpeg (da nam san trong goi), khong can quyen Admin.",
  "",
  "TRUOC KHI GIAI NEN - LAM BUOC NAY TRUOC CHO DO VUONG",
  "  File tai tu mang (Gmail, Drive, Zalo...) bi Windows danh dau la 'tu",
  "  Internet', nen bam dup CAI-DAT.bat se hien bang xanh chan lai.",
  "  Cach tranh: chuot phai vao file ZIP -> Properties -> tick o 'Unblock'",
  "  (Bo chan) o duoi cung -> OK. Xong roi moi giai nen.",
  "  Neu lo giai nen truoc va bang xanh hien ra: bam 'More info' ->",
  "  'Run anyway'. Khong sao ca, do chi la canh bao cho file tai tu mang.",
  "",
  "CACH CAI (cach 1 - de nhat, khong can cai them gi)",
  "  1. Dong han Premiere Pro.",
  "  2. Bam dup vao file CAI-DAT.bat trong thu muc nay.",
  "  3. Mo Premiere -> Window -> Extensions -> AiO Studio - Power Bins",
  "",
  "CACH CAI (cach 2 - neu quen dung ZXP Installer)",
  "  1. Tai ZXP Installer (mien phi) tu aescripts.com/learn/zxp-installer",
  "  2. Dong Premiere Pro lai.",
  ("  3. Keo tha file " + (Split-Path $zxpOut -Leaf) + " vao cua so ZXP Installer."),
  "  Ban nay ky bang chung chi TU TAO nen ZXP Installer se hoi xac nhan mot lan;",
  "  chon 'Yes' / 'Install anyway' de tiep tuc.",
  "",
  "GO CAI DAT",
  "  Dung ZXP Installer, hoac xoa thu muc:",
  "  %APPDATA%\Adobe\CEP\extensions\com.aiostudio.powerbin",
  "",
  "DU LIEU PANEL LUU O DAU",
  "  Thu vien:      %APPDATA%\AiOStudio\library.json",
  "  Bo nho dem:    %APPDATA%\AiOStudio\thumbs va \proxies",
  "                 (doi cho duoc trong Cai dat > Noi luu bo nho dem)"
)
$lines | Out-File -FilePath $guide -Encoding utf8

# --- 6. Bo cai TU CHAY (khong can ZXP Installer) ---
#  Nguoi dung binh thuong khong muon cai them mot phan mem nua chi de cai mot
#  panel. File .zxp thuc chat la mot file zip da ky, nen chi can giai nen dung
#  cho la Premiere nhan. Kem theo mot file .bat de bam dup la xong.
$installPs1 = Join-Path $outDir 'cai-dat.ps1'
@'
# Cai AiO Studio - Power Bins vao Adobe Premiere Pro.
# Chay bang CAI-DAT.bat (bam dup). Khong can quyen Admin.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
# Neu vi ly do nao do co nhieu file .zxp thi lay ban MOI NHAT, dung lay ban dau
# danh sach (sap theo ten se ra 1.0.0 truoc 1.0.1 -> cai nham ban cu).
$zxp = Get-ChildItem $here -Filter '*.zxp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zxp) { Write-Host "Khong tim thay file .zxp trong thu muc nay." -ForegroundColor Red; exit 1 }
Write-Host ("Ban se cai: " + $zxp.Name) -ForegroundColor Gray

$target = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.aiostudio.powerbin'
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
Write-Host "Mo Premiere Pro -> Window -> Extensions -> AiO Studio - Power Bins"
'@ | Out-File -FilePath $installPs1 -Encoding utf8

$installBat = Join-Path $outDir 'CAI-DAT.bat'
@'
@echo off
title AiO Studio - Power Bins : Cai dat
echo.
echo    AiO Studio - Power Bins
echo    ==========================
echo.
echo    HAY DONG HAN PREMIERE PRO TRUOC KHI CAI.
echo.
pause
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cai-dat.ps1"
echo.
pause
'@ | Out-File -FilePath $installBat -Encoding ascii

# Gom thanh MOT file de gui di.
#
# [1.0.1] SUA LOI: truoc day goi bang `$outDir\*` — thu muc release giu ca cac ban
# CU nen goi phinh gap doi (97 MB thay vi 49 MB), va bo cai co the vo phai file
# .zxp cua ban cu. Nay liet ke DUNG 4 file cua ban dang dong goi.
$bundle = Join-Path (Join-Path $root 'build') ("AiO-Studio-Asset-Manager-" + $version + "-SETUP.zip")
if (Test-Path $bundle) { Remove-Item $bundle -Force }
Compress-Archive -Path @($zxpOut, $installBat, $installPs1, $guide) -DestinationPath $bundle -CompressionLevel Optimal
$bundleMb = [math]::Round((Get-Item $bundle).Length / 1MB, 1)

# --- 7. Gop tat ca thanh MOT file .exe tu chay ---
#  Ban .zip o tren bat nguoi nhan giai nen roi tim dung file de bam. Dem qua may
#  khac cho nguoi khac cai thi moi buoc thua la mot cho de sai. File .exe nay
#  bam dup la tu giai nen va tu cai. Chi tiet trong scripts/make-setup-exe.ps1.
$setupExe = Join-Path (Join-Path $root 'build') ("AiO-Studio-Asset-Manager-" + $version + "-SETUP.exe")
if (Test-Path $setupExe) { Remove-Item $setupExe -Force }
& (Join-Path $PSScriptRoot 'make-setup-exe.ps1') -ReleaseDir $outDir -OutExe $setupExe -Version $version

Write-Host ""
Write-Host "XONG." -ForegroundColor Cyan
if (Test-Path $setupExe) {
  $exeMb = [math]::Round((Get-Item $setupExe).Length / 1MB, 1)
  Write-Host ("  GUI CAI NAY:  " + $setupExe + "  (" + $exeMb + " MB)") -ForegroundColor Green
  Write-Host "  Chep qua may khac, bam dup la tu cai. Khong phai giai nen gi ca."
  Write-Host ""
  Write-Host ("  Ban .zip (neu can):  " + $bundle + "  (" + $bundleMb + " MB)") -ForegroundColor Gray
} else {
  Write-Host ("  MOT FILE DE GUI DI:  " + $bundle + "  (" + $bundleMb + " MB)") -ForegroundColor Green
  Write-Host "  Giai nen ra roi bam dup CAI-DAT.bat la xong, khong can ZXP Installer."
}
Write-Host ""
Write-Host "  Thu muc phat hanh:" -ForegroundColor Gray
Get-ChildItem $outDir | ForEach-Object { Write-Host ("     " + $_.Name) }
