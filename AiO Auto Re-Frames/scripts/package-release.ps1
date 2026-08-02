# =====================================================================
#  AiO Auto Re-Frames - package-release.ps1
#
#  Dong goi BAN PHAT HANH cho nguoi dung cuoi. Khac sign-install.ps1:
#    1. KHONG dong goi file .debug (cong 8092 khong thuoc ban phat hanh)
#    2. Xuat file co SO PHIEN BAN trong ten + huong dan + bo cai 1 file
#  Panel nay KHONG co buoc build (dist/ tinh) va KHONG bundle binary nao
#  (FFmpeg muon cua AiO Transcripts/Autocut luc chay -> khong kem LGPL).
#
#  Chay:  powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
#  Khong can quyen Admin. ASCII-only cho Windows PowerShell 5.1.
# =====================================================================
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$suite    = Split-Path -Parent $root
$certDir  = Join-Path $root 'certs'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage-release'
$outDir   = Join-Path $root 'build\release'

Write-Host "AiO Auto Re-Frames - dong goi phat hanh" -ForegroundColor Cyan

# --- Phien ban tu manifest (mot nguon su that) ---
[xml]$manifest = Get-Content (Join-Path $root 'CSXS\manifest.xml')
$version = $manifest.ExtensionManifest.ExtensionBundleVersion
if (-not $version) { throw "Khong doc duoc ExtensionBundleVersion." }
Write-Host ("  Phien ban: " + $version) -ForegroundColor Gray

# Chot chan: version trong UI phai KHOP manifest (luat version khop 3 cho).
$uiVer = Select-String -Path (Join-Path $root 'dist\index.html') -Pattern 'topbar__ver">v([\d.]+)<'
if ($uiVer -and $uiVer.Matches[0].Groups[1].Value -ne $version) {
  throw ("UI ghi v" + $uiVer.Matches[0].Groups[1].Value + " nhung manifest la " + $version + " - dong bo truoc khi dong goi.")
}

# --- ZXPSignCmd: muon cua panel anh em ---
$sign = $null
foreach ($panel in @('AiO Transcripts', 'AiO Autocut', 'AiO Asset Manager', 'AiO Power Bins')) {
  $signDir = Join-Path $suite "$panel\client\node_modules\zxp-provider\bin"
  if (Test-Path $signDir) {
    $sign = Get-ChildItem $signDir -Recurse -Filter 'ZXPSignCmd.exe' |
            Where-Object { $_.FullName -like '*win64*' } |
            Sort-Object FullName -Descending | Select-Object -First 1
    if ($sign) { break }
  }
}
if (-not $sign) { throw "Khong tim thay ZXPSignCmd.exe o panel nao." }

$sharedCert = Join-Path $suite 'AiO Asset Manager\certs\aiostudio-dev.p12'
if ((-not (Test-Path $certP12)) -and (Test-Path $sharedCert)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  Copy-Item $sharedCert $certP12 -Force
}
if (-not (Test-Path $certP12)) { throw "Chua co chung chi. Chay sign-install.ps1 mot lan." }

# --- Staging sach: CSXS + dist + host, KHONG .debug ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
if (Test-Path (Join-Path $stage '.debug')) { throw "Stage dinh .debug - khong duoc phat hanh." }
Write-Host "  [OK] Staging (khong .debug, khong binary)" -ForegroundColor Green

# --- Ky ---
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$zxpOut = Join-Path $outDir ("AiO-Auto-ReFrames-" + $version + ".zxp")
if (Test-Path $zxpOut) { Remove-Item $zxpOut -Force }
& $sign.FullName -sign $stage $zxpOut $certP12 $certPass -tsa "http://timestamp.digicert.com" 2>&1 | Out-Host
if (-not (Test-Path $zxpOut)) {
  Write-Host "  TSA khong dung duoc, ky khong timestamp..." -ForegroundColor Yellow
  & $sign.FullName -sign $stage $zxpOut $certP12 $certPass 2>&1 | Out-Host
}
if (-not (Test-Path $zxpOut)) { throw "Ky ZXP that bai." }
& $sign.FullName -verify $zxpOut 2>&1 | Out-Host
$sizeMb = [math]::Round((Get-Item $zxpOut).Length / 1MB, 1)
Write-Host ("  [OK] " + $zxpOut + "  (" + $sizeMb + " MB)") -ForegroundColor Green

# --- Huong dan ---
$guide = Join-Path $outDir 'HUONG-DAN-CAI-DAT.txt'
@(
  ("AiO Auto Re-Frames  " + $version),
  "Tu tao SHORT doc tu video dai + doi khung bam chu the, ngay trong Premiere.",
  "",
  "TINH NANG",
  "  - Doc ban chep loi, tach tung cau hoi duoc tra loi tron y -> tao short",
  "    doc 9:16 / vuong 1:1 / doc 4:5, Premiere tu bam theo nguoi noi.",
  "  - Doi khung CA sequence sang doc/vuong mot nut.",
  "  - Xuat ban nhap MP4 720p de duyet noi dung (khong cham Premiere).",
  "  - Giao dien song ngu Viet-Anh (nut gat goc phai).",
  "",
  "YEU CAU",
  "  - Windows 10/11 · Adobe Premiere Pro (kiem chung tren Beta 26.5 / CEP 12)",
  "  - De dung SHORT THEO NOI DUNG va XUAT NHAP: can cai kem AiO Transcripts",
  "    (hoac AiO Autocut) - panel nay dung ban chep loi va bo xu ly media cua bo.",
  "",
  "CACH CAI (de nhat)",
  "  1. Dong han Premiere Pro.",
  "  2. Bam dup CAI-DAT.bat.",
  "  3. Mo Premiere -> Window -> Extensions -> AiO Studio - Re-Frames",
  "",
  "GO CAI DAT",
  "  Xoa thu muc: %APPDATA%\Adobe\CEP\extensions\com.aiostudio.reframe"
) | Out-File -FilePath $guide -Encoding utf8

# --- Bo cai 1 file ---
$installPs1 = Join-Path $outDir 'cai-dat.ps1'
@'
# Cai AiO Auto Re-Frames vao Adobe Premiere Pro. Khong can quyen Admin.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$zxp = Get-ChildItem $here -Filter '*.zxp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zxp) { Write-Host "Khong tim thay file .zxp." -ForegroundColor Red; exit 1 }
Write-Host ("Ban se cai: " + $zxp.Name) -ForegroundColor Gray

$target = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.aiostudio.reframe'
$zip = Join-Path $env:TEMP 'aio_reframe.zip'
$tmp = Join-Path $env:TEMP ('aio_reframe_' + [System.Guid]::NewGuid().ToString('N'))
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
if (-not (Test-Path (Join-Path $target 'dist\index.html'))) {
  Write-Host "CAI THAT BAI: thieu file." -ForegroundColor Red; exit 1
}
if ($locked.Count -gt 0) {
  Write-Host "File dang bi khoa (Premiere con mo?):" -ForegroundColor Yellow
  $locked | ForEach-Object { Write-Host ("   " + $_) -ForegroundColor Yellow }
}
Write-Host "DA CAI XONG. Mo Premiere -> Window -> Extensions -> AiO Studio - Re-Frames" -ForegroundColor Green
'@ | Out-File -FilePath $installPs1 -Encoding utf8

$installBat = Join-Path $outDir 'CAI-DAT.bat'
@'
@echo off
title AiO Auto Re-Frames : Cai dat
echo.
echo    AiO Auto Re-Frames
echo    ==================
echo.
echo    HAY DONG HAN PREMIERE PRO TRUOC KHI CAI.
echo.
pause
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cai-dat.ps1"
echo.
pause
'@ | Out-File -FilePath $installBat -Encoding ascii

# --- MOT file de gui di (chi 4 file cua ban NAY) ---
$bundle = Join-Path (Join-Path $root 'build') ("AiO-Auto-ReFrames-" + $version + "-SETUP.zip")
if (Test-Path $bundle) { Remove-Item $bundle -Force }
Compress-Archive -Path @($zxpOut, $installBat, $installPs1, $guide) -DestinationPath $bundle -CompressionLevel Optimal
$bundleMb = [math]::Round((Get-Item $bundle).Length / 1MB, 1)

Write-Host ""
Write-Host "XONG." -ForegroundColor Cyan
Write-Host ("  MOT FILE DE GUI DI:  " + $bundle + "  (" + $bundleMb + " MB)") -ForegroundColor Green
