# =====================================================================
#  AiO Studio TRANSCRIPT - package-release.ps1
#
#  Dong goi BAN PHAT HANH cho nguoi dung cuoi. Khac sign-install.ps1 o ba diem:
#    1. Build ban thuong (Autocut chua co auto-reload nen khong can tach 2 duong)
#    2. KHONG dong goi file .debug (cong debug 8088 khong thuoc ban phat hanh)
#    3. Xuat ra file co SO PHIEN BAN trong ten, kem huong dan cai dat
#
#  Chay:  powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
#  Khong can quyen Admin. ASCII-only cho Windows PowerShell 5.1.
# =====================================================================
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$certDir  = Join-Path $root 'certs'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage-release'
$outDir   = Join-Path $root 'build\release'

Write-Host "AiO Studio Transcript - dong goi" -ForegroundColor Cyan

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

$sharedCert = Join-Path (Split-Path -Parent $root) 'AiO Asset Manager\certs\aiostudio-dev.p12'
if ((-not (Test-Path $certP12)) -and (Test-Path $sharedCert)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  Copy-Item $sharedCert $certP12 -Force
}
if (-not (Test-Path $certP12)) {
  throw "Chua co chung chi ky. Chay scripts\sign-install.ps1 mot lan de tao."
}

# --- 1. Build ban phat hanh ---
Write-Host "  Dang build..." -ForegroundColor Gray
Push-Location (Join-Path $root 'client')
try {
  # KHONG dung `2>&1` voi lenh native: Windows PowerShell 5.1 boc moi dong
  # stderr thanh ErrorRecord, va vite in mot dong canh bao vo hai ra stderr
  # -> script chet oan du build thanh cong. Doi lai: ha ErrorActionPreference
  # trong dung doan nay va tu kiem tra ma thoat.
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & cmd /c "npm run build"
  $buildExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($buildExit -ne 0) { throw "Build that bai (ma thoat $buildExit)." }
} finally {
  Pop-Location
}

$distIndex = Join-Path $root 'dist\index.html'
if (-not (Test-Path $distIndex)) { throw "Khong thay dist\index.html sau khi build." }

# Chot chan: ban phat hanh KHONG duoc con auto-reload.
# Autocut chua co auto-reload nen khong can kiem tra nhu AiO Editing.

# --- 2. Staging sach (KHONG co .debug) ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
if (Test-Path (Join-Path $root 'bin')) {
  Copy-Item (Join-Path $root 'bin') (Join-Path $stage 'bin') -Recurse
}
# [2.5.0] Caption kieu hieu ung: file .mogrt + font OFL (xem sign-install.ps1).
if (Test-Path (Join-Path $root 'mogrt')) {
  New-Item -ItemType Directory -Path (Join-Path $stage 'mogrt') -Force | Out-Null
  Copy-Item (Join-Path $root 'mogrt\*.mogrt') (Join-Path $stage 'mogrt')
}
if (Test-Path (Join-Path $root 'fonts')) {
  Copy-Item (Join-Path $root 'fonts') (Join-Path $stage 'fonts') -Recurse
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
# [2.5.0] Ten goi tung la "AiO-Studio-Autocut-..." (chep tu script Autocut, quen doi)
# -> khach tai ve tuong nham goi Autocut. Cung ho loi 3d: file minh tu sinh ra van
# noi sai ve san pham. Ten dung:
$zxpOut = Join-Path $outDir ("AiO-Studio-Transcript-" + $version + ".zxp")
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
# [2.5.0] Phan than TAY cua file nay tung la van ban cua ban Autocut 0.1.x
# ("tu cat khoang lang... BAN THAM DO... CHUA cat duoc") suot tu thang 7 - dung
# cai bay 3d da vap o Autocut 19/08: tieu de tu lay so phien ban nen nhin luot
# tuong da cap nhat. MO RA DOC HET truoc khi gui.
$lines = @(
  ("AiO Studio - Transcript  " + $version),
  # [2.5.5] Doan gioi thieu 5 kieu hieu ung DA GO — anh Tien chot 24/08 AN khoi
  # hieu ung (HIEN_HIEU_UNG=false trong App.tsx). Huong dan ma quang cao thu
  # nguoi dung tim khong thay la huong dan noi doi (dung bay 3d da vap 19/08).
  "Chep loi tren timeline Premiere thanh PHU DE (caption) gan thang len sequence",
  "dang mo: khoanh vung bang I/O, bam mot nut, phu de nam dung cho nguoi ta noi,",
  "kem marker o nhung cho may nghe khong chac de soat nhanh.",
  "",
  "YEU CAU",
  "  - Windows 10/11",
  "  - Adobe Premiere Pro 2025 tro len (da kiem tren Beta 26.5 va 27.0 / CEP 12)",
  "  - Khoanh vung bang phim I / O roi bam LAM PHU DE. Panel tu theo vung I/O va",
  "    tu nhan khung Ngang 16:9 / Doc 9:16 theo sequence.",
  "  - CAI-DAT.bat cai kem bo font (Montserrat, Bangers - giay phep OFL, thu muc",
  "    fonts/) cho tai khoan dang dung, khong can Admin.",
  "",
  "GIOI HAN DA BIET (khong giau)",
  "  - Tieng Viet va tieng Anh da do tren video that; thu tieng khac moi 'chay duoc'.",
  "  - Track caption tren timeline Premiere khong cho tool xoa - muon go thi chuot",
  "    phai vao dau track -> Delete Track.",
  "",
  "CACH CAI (cach 1 - de nhat, khong can cai them gi)",
  "  1. Dong han Premiere Pro.",
  "  2. Bam dup vao file CAI-DAT.bat trong thu muc nay.",
  "  3. Mo Premiere -> Window -> Extensions -> AiO Studio - Transcript",
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
  "  %APPDATA%\Adobe\CEP\extensions\com.aiostudio.transcript",
  "  Font da cai nam o %LOCALAPPDATA%\Microsoft\Windows\Fonts (xoa tay neu muon).",
  ""
  # [2.5.5] Muc "THU MUC KIEU RIENG" da go cung khoi hieu ung.
)
$lines | Out-File -FilePath $guide -Encoding utf8

# --- 6. Bo cai TU CHAY (khong can ZXP Installer) ---
#  Nguoi dung binh thuong khong muon cai them mot phan mem nua chi de cai mot
#  panel. File .zxp thuc chat la mot file zip da ky, nen chi can giai nen dung
#  cho la Premiere nhan. Kem theo mot file .bat de bam dup la xong.
$installPs1 = Join-Path $outDir 'cai-dat.ps1'
@'
# Cai AiO Studio - Transcript vao Adobe Premiere Pro.
# Chay bang CAI-DAT.bat (bam dup). Khong can quyen Admin.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
# Neu vi ly do nao do co nhieu file .zxp thi lay ban MOI NHAT, dung lay ban dau
# danh sach (sap theo ten se ra 1.0.0 truoc 1.0.1 -> cai nham ban cu).
$zxp = Get-ChildItem $here -Filter '*.zxp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zxp) { Write-Host "Khong tim thay file .zxp trong thu muc nay." -ForegroundColor Red; exit 1 }
Write-Host ("Ban se cai: " + $zxp.Name) -ForegroundColor Gray

$target = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.aiostudio.transcript'
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

# [2.5.0] Cai FONT cho caption hieu ung (Montserrat x3 + Bangers, OFL) vao tai
# khoan dang dung: chep vao %LOCALAPPDATA%\Microsoft\Windows\Fonts + ghi HKCU.
# Khong can Admin. Premiere/AE doc font nay sau khi MO LAI. Khong broadcast
# WM_FONTCHANGE (tung treo script 2 phut khi co cua so khong tra loi).
$fontDir = Join-Path $target 'fonts'
if (Test-Path $fontDir) {
  $userFonts = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
  New-Item -ItemType Directory -Path $userFonts -Force | Out-Null
  $regFonts = 'HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts'
  if (-not (Test-Path $regFonts)) { New-Item -Path $regFonts -Force | Out-Null }
  $soFont = 0
  Get-ChildItem $fontDir -Filter '*.ttf' | ForEach-Object {
    $dst = Join-Path $userFonts $_.Name
    try {
      Copy-Item $_.FullName $dst -Force -ErrorAction Stop
      # Ten hien thi: "Montserrat-Black.ttf" -> "Montserrat Black (TrueType)"
      $ten = ($_.BaseName -replace '-', ' ') + ' (TrueType)'
      New-ItemProperty -Path $regFonts -Name $ten -Value $dst -PropertyType String -Force | Out-Null
      $soFont++
    } catch { Write-Host ("  [canh bao] khong cai duoc font " + $_.Name) -ForegroundColor Yellow }
  }
  if ($soFont -gt 0) { Write-Host ("  Da cai " + $soFont + " font cho caption hieu ung.") -ForegroundColor Gray }
}

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
Write-Host "Mo Premiere Pro -> Window -> Extensions -> AiO Studio - Transcript"
'@ | Out-File -FilePath $installPs1 -Encoding utf8

$installBat = Join-Path $outDir 'CAI-DAT.bat'
@'
@echo off
title AiO Studio - Transcript : Cai dat
echo.
echo    AiO Studio - Transcript
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
# [1.0.1] SUA LOI: truoc day goi bang `$outDir\*` - thu muc release giu ca cac ban
# CU nen goi phinh gap doi (97 MB thay vi 49 MB), va bo cai co the vo phai file
# .zxp cua ban cu. Nay liet ke DUNG 4 file cua ban dang dong goi.
$bundle = Join-Path (Join-Path $root 'build') ("AiO-Studio-Transcript-" + $version + "-SETUP.zip")
if (Test-Path $bundle) { Remove-Item $bundle -Force }
Compress-Archive -Path @($zxpOut, $installBat, $installPs1, $guide) -DestinationPath $bundle -CompressionLevel Optimal
$bundleMb = [math]::Round((Get-Item $bundle).Length / 1MB, 1)

Write-Host ""
Write-Host "XONG." -ForegroundColor Cyan
Write-Host ("  MOT FILE DE GUI DI:  " + $bundle + "  (" + $bundleMb + " MB)") -ForegroundColor Green
Write-Host "  Giai nen ra roi bam dup CAI-DAT.bat la xong, khong can ZXP Installer."
Write-Host ""
Write-Host "  Thu muc phat hanh:" -ForegroundColor Gray
Get-ChildItem $outDir | ForEach-Object { Write-Host ("     " + $_.Name) }
