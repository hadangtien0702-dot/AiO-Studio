# =====================================================================
#  AiO Auto Guiline Frame - sign-install.ps1
#  Premiere Beta (CEP 12) BAT BUOC extension phai duoc KY. Script nay:
#    0. Lay chung chi dung chung cua bo AiO (hoac tao moi)
#    1. Bat PlayerDebugMode (remote debug cong 8096)
#    2. Sinh lai dist/safe-zones.js tu safe-zones.json (nguon chan ly)
#    3. Gom file runtime (CSXS, dist, host, .debug) vao staging sach
#    4. Ky thanh ZXP
#    5. CHEP DE vao CEP extensions (khong xoa thu muc - bai hoc file khoa)
#
#  Panel nay KHONG co buoc build - dist/ la file tinh viet tay.
#  ZXPSignCmd muon tu node_modules cua panel anh em (khoi cai them).
#  Khong can quyen Admin. ASCII-only cho Windows PowerShell 5.1.
# =====================================================================
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$suite    = Split-Path -Parent $root
$extId    = 'com.aiostudio.guideframe'
$certDir  = Join-Path $root 'certs'
$sharedCert = Join-Path $suite 'AiO Asset Manager\certs\aiostudio-dev.p12'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage'
$zxpOut   = Join-Path $root 'build\aio-guideframe.zxp'
$cepExt   = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$target   = Join-Path $cepExt $extId

Write-Host "AiO Auto Guiline Frame - sign & install" -ForegroundColor Cyan

# --- Tim ZXPSignCmd: muon cua cac panel anh em, panel nao co cung duoc ---
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
if (-not $sign) { throw "Khong tim thay ZXPSignCmd.exe o panel nao. Cai deps mot panel anh em truoc." }

# --- 0. Chung chi: dung chung ca bo AiO ---
if ((-not (Test-Path $certP12)) -and (Test-Path $sharedCert)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  Copy-Item $sharedCert $certP12 -Force
  Write-Host "  Dung lai chung chi chung cua bo AiO" -ForegroundColor Gray
}
if (-not (Test-Path $certP12)) {
  Write-Host "  Chua co chung chi, dang tao moi..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  & $sign.FullName -selfSignedCert VN HCM "AiO Studio" "AiO Studio Dev" $certPass $certP12 | Out-Host
  if (-not (Test-Path $certP12)) { throw "Tao chung chi that bai." }
}

# --- 1. PlayerDebugMode ---
foreach ($v in 9..12) {
  $key = "HKCU:\Software\Adobe\CSXS.$v"
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
}

# --- 2. Sinh lai du lieu tu nguon chan ly + kiem file bat buoc ---
node (Join-Path $root 'scripts\sinh-du-lieu.mjs')
if ($LASTEXITCODE -ne 0) { throw "safe-zones.json co loi - xem thong bao ben tren." }
if (-not (Test-Path (Join-Path $root 'dist\index.html')))    { throw "Thieu dist\index.html." }
if (-not (Test-Path (Join-Path $root 'dist\safe-zones.js'))) { throw "Thieu dist\safe-zones.js." }
if (-not (Test-Path (Join-Path $root 'dist\ve-guide.js')))   { throw "Thieu dist\ve-guide.js." }
if (-not (Test-Path (Join-Path $root 'host\guideframe.jsx'))){ throw "Thieu host\guideframe.jsx." }
# Font Inter DONG GOI: thiet ke tro toi '../fonts/Inter.woff2' tu dist/index.html.
# Thieu thu muc nay la panel roi ve font he thong (tren Windows SF Pro cai tach
# roi tung weight nen font-weight khong an) - do 06/08/2026.
if (-not (Test-Path (Join-Path $root 'fonts\Inter.woff2'))) {
  throw "Thieu fonts\Inter.woff2 - chep tu 'AiO Design System\fonts\' sang."
}

# --- 3. Staging sach ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
Copy-Item (Join-Path $root 'fonts') (Join-Path $stage 'fonts') -Recurse
if (Test-Path (Join-Path $root '.debug')) {
  Copy-Item (Join-Path $root '.debug') (Join-Path $stage '.debug')
}
Write-Host "  [OK] Staging" -ForegroundColor Green

# --- 4. Ky ZXP ---
if (Test-Path $zxpOut) { Remove-Item $zxpOut -Force }
New-Item -ItemType Directory -Path (Split-Path $zxpOut -Parent) -Force | Out-Null
& $sign.FullName -sign $stage $zxpOut $certP12 $certPass -tsa "http://timestamp.digicert.com" 2>&1 | Out-Host
if (-not (Test-Path $zxpOut)) {
  Write-Host "  TSA khong dung duoc, ky khong timestamp..." -ForegroundColor Yellow
  & $sign.FullName -sign $stage $zxpOut $certP12 $certPass 2>&1 | Out-Host
}
if (-not (Test-Path $zxpOut)) { throw "Ky ZXP that bai." }
Write-Host "  [OK] Da ky" -ForegroundColor Green

# --- 5. Cai: CHEP DE tung file, file khoa thi bo qua va bao ten ---
if (-not (Test-Path $cepExt)) { New-Item -ItemType Directory -Path $cepExt -Force | Out-Null }
New-Item -ItemType Directory -Path $target -Force | Out-Null

$zipTmp   = Join-Path $env:TEMP 'aioguideframe_signed.zip'
$unzipTmp = Join-Path $env:TEMP ('aioguideframe_unzip_' + [System.Guid]::NewGuid().ToString('N'))
Copy-Item $zxpOut $zipTmp -Force
Expand-Archive -Path $zipTmp -DestinationPath $unzipTmp -Force

$locked = @()
Get-ChildItem $unzipTmp -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($unzipTmp.Length + 1)
  $dst = Join-Path $target $rel
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  try { Copy-Item $_.FullName $dst -Force -ErrorAction Stop }
  catch { $locked += $rel }
}
Remove-Item $zipTmp -Force -ErrorAction SilentlyContinue
Remove-Item $unzipTmp -Recurse -Force -ErrorAction SilentlyContinue

if (-not (Test-Path (Join-Path $target 'dist\index.html'))) {
  throw "Cai that bai: thieu dist\index.html trong ban da cai."
}
if ($locked.Count -gt 0) {
  Write-Host ("  [BO QUA] " + $locked.Count + " file dang bi khoa:") -ForegroundColor Yellow
  $locked | ForEach-Object { Write-Host ("     " + $_) -ForegroundColor Yellow }
}
Write-Host ("  [OK] Da cai: " + $target) -ForegroundColor Green

Write-Host ""
Write-Host "LAN DAU cai panel nay: phai TAT HAN Premiere roi mo lai" -ForegroundColor Cyan
Write-Host "(manifest moi chi duoc CEP doc luc khoi dong). Sau do:" -ForegroundColor Cyan
Write-Host "  Window > Extensions > AiO Studio - Guide Frame"
