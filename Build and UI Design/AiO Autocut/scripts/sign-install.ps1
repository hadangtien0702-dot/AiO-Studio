# =====================================================================
#  AiO Studio AUTOCUT - sign-install.ps1
#  Premiere Beta (CEP 12) BAT BUOC extension phai duoc KY. Script nay:
#    0. Tao chung chi self-signed neu chua co
#    1. Bat PlayerDebugMode (de dung remote debug qua cong 8088)
#    2. Gom file runtime (CSXS, dist, host, .debug) vao folder staging sach
#    3. Ky thanh ZXP bang chung chi self-signed
#    4. Go ban cu trong CEP extensions, giai nen ban da ky vao do
#
#  Chay sau moi lan build:  cd client && npm run build  roi chay script nay.
#  Khong can quyen Admin. ASCII-only cho Windows PowerShell 5.1.
# =====================================================================
$ErrorActionPreference = 'Stop'

$root     = Split-Path -Parent $PSScriptRoot
$extId    = 'com.aiostudio.autocut'
# Dung CHUNG chung chi voi AiO Editing (cung mot nguoi phat hanh, khoi tao 2 cai).
$certDir  = Join-Path $root 'certs'
$sharedCert = Join-Path (Split-Path -Parent $root) 'AiO Asset Manager\certs\aiostudio-dev.p12'
$certP12  = Join-Path $certDir 'aiostudio-dev.p12'
$certPass = 'aiostudio_dev_2026'
$stage    = Join-Path $root 'build\stage'
$zxpOut   = Join-Path $root 'build\aio-autocut.zxp'
$cepExt   = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$target   = Join-Path $cepExt $extId

Write-Host "AiO Studio Autocut - sign & install" -ForegroundColor Cyan

# --- Tim ZXPSignCmd (win64 moi nhat) ---
$signDir = Join-Path $root 'client\node_modules\zxp-provider\bin'
if (-not (Test-Path $signDir)) {
  throw "Chua cai dependencies. Chay: cd client && npm install"
}
$sign = Get-ChildItem $signDir -Recurse -Filter 'ZXPSignCmd.exe' |
        Where-Object { $_.FullName -like '*win64*' } |
        Sort-Object FullName -Descending | Select-Object -First 1
if (-not $sign) { throw "Khong tim thay ZXPSignCmd.exe trong zxp-provider." }

# --- 0. Tao chung chi neu chua co ---
if ((-not (Test-Path $certP12)) -and (Test-Path $sharedCert)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  Copy-Item $sharedCert $certP12 -Force
  Write-Host "  Dung lai chung chi cua AiO Editing" -ForegroundColor Gray
}
if (-not (Test-Path $certP12)) {
  Write-Host "  Chua co chung chi, dang tao moi..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
  & $sign.FullName -selfSignedCert VN HCM "AiO Studio" "AiO Studio Dev" $certPass $certP12 | Out-Host
  if (-not (Test-Path $certP12)) { throw "Tao chung chi that bai." }
}

# --- 1. Bat PlayerDebugMode (cho remote debug cong 8088) ---
foreach ($v in 9..12) {
  $key = "HKCU:\Software\Adobe\CSXS.$v"
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
}

# --- Kiem tra da build chua ---
if (-not (Test-Path (Join-Path $root 'dist\index.html'))) {
  throw "Chua co dist\index.html. Chay 'npm run build' trong thu muc client truoc."
}

# --- 2. Staging sach ---
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item (Join-Path $root 'CSXS') (Join-Path $stage 'CSXS') -Recurse
Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse
Copy-Item (Join-Path $root 'host') (Join-Path $stage 'host') -Recurse
if (Test-Path (Join-Path $root '.debug')) {
  Copy-Item (Join-Path $root '.debug') (Join-Path $stage '.debug')
}
# Thu muc bin/ (ffmpeg) - tu dong dong goi neu co
if (Test-Path (Join-Path $root 'bin')) {
  Copy-Item (Join-Path $root 'bin') (Join-Path $stage 'bin') -Recurse

  # !!! [13/08/2026] KHONG dong goi ffprobe.exe cho Autocut.
  #
  # Panel nay KHONG BAO GIO goi ffprobe. No lay thoi luong + fps bang cach doc
  # stderr cua chinh lenh ffmpeg (parseDuration/parseVideoFps trong
  # services/silencelog.ts) - xem ghi chu san o whisper.ts:190.
  # Do that 13/08: dist/ bundle nhac "ffprobe" 0 lan, "ffmpeg" 1 lan.
  #
  # Truoc khi bo: goi .zxp = 91,7 MB, trong do ffprobe.exe chiem 45,7 MB nen
  # (109,3 MB goc) = mot nua bo cai cho mot file khong ai goi.
  #
  # CHU Y: Asset Manager va Power Bins thi CO dung that (services/probe.ts doc
  # metadata dang JSON) - dung chep luat nay sang hai panel do.
  #
  # Neu sau nay Autocut can ffprobe: bo khoi block nay, va nho do lai kich thuoc.
  $boFfprobe = Join-Path $stage 'bin\win64\ffprobe.exe'
  if (Test-Path $boFfprobe) {
    $mb = [math]::Round((Get-Item $boFfprobe).Length / 1MB, 1)
    Remove-Item $boFfprobe -Force
    Write-Host ("  [BO] ffprobe.exe (" + $mb + " MB) - Autocut khong dung") -ForegroundColor DarkGray
  }
}
Write-Host "  [OK] Staging" -ForegroundColor Green

# --- 3. Ky thanh ZXP ---
if (Test-Path $zxpOut) { Remove-Item $zxpOut -Force }
& $sign.FullName -sign $stage $zxpOut $certP12 $certPass -tsa "http://timestamp.digicert.com" 2>&1 | Out-Host
if (-not (Test-Path $zxpOut)) {
  Write-Host "  TSA khong dung duoc, ky khong timestamp..." -ForegroundColor Yellow
  & $sign.FullName -sign $stage $zxpOut $certP12 $certPass 2>&1 | Out-Host
}
if (-not (Test-Path $zxpOut)) { throw "Ky ZXP that bai." }
Write-Host "  [OK] Da ky" -ForegroundColor Green

# --- 4. Cai ban da ky ---
#
# [0.17.2] KHONG con xoa sach thu muc roi giai nen de len.
# Ly do (loi that da xay ra): panel chay hang doi nen nen ffmpeg.exe/ffprobe.exe
# trong bin\ dang BI KHOA. Remove-Item -Recurse gap file khoa la dung giua chung,
# nhung luc do no DA XOA MAT dist\index.html -> panel thanh trang, va nguoi dung
# khong hieu vi sao vua bam cai xong thi panel chet.
#
# Cach moi: giai nen ra thu muc tam, roi CHEP DE tung file. File nao dang bi khoa
# thi bo qua va bao ten ra - cac file do la binary FFmpeg, noi dung khong doi
# giua cac ban build nen giu nguyen ban cu la dung.
if (-not (Test-Path $cepExt)) { New-Item -ItemType Directory -Path $cepExt -Force | Out-Null }
if (Test-Path $target) {
  $item = Get-Item $target -Force
  if ($item.LinkType) { $item.Delete() }
}
New-Item -ItemType Directory -Path $target -Force | Out-Null

$zipTmp   = Join-Path $env:TEMP 'aiostudio_signed.zip'
$unzipTmp = Join-Path $env:TEMP ('aiostudio_unzip_' + [System.Guid]::NewGuid().ToString('N'))
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

# Bat buoc phai co file nay, neu khong panel se trang.
if (-not (Test-Path (Join-Path $target 'dist\index.html'))) {
  throw "Cai that bai: thieu dist\index.html trong ban da cai."
}
if ($locked.Count -gt 0) {
  Write-Host ("  [BO QUA] " + $locked.Count + " file dang bi khoa (giu ban cu):") -ForegroundColor Yellow
  $locked | ForEach-Object { Write-Host ("     " + $_) -ForegroundColor Yellow }
}
Write-Host ("  [OK] Da cai: " + $target) -ForegroundColor Green

Write-Host ""
# Autocut CHUA co auto-reload (khac AiO Editing) - phai tu dong/mo lai panel.
Write-Host "Xong. Dong panel Autocut roi mo lai (Window > Extensions) de nap ban moi." -ForegroundColor Cyan
Write-Host "Neu vua sua CSXS\manifest.xml thi phai TAT HAN Premiere roi mo lai."
