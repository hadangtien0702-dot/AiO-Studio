# cai-bin-chung.ps1 - Cai KHO FFmpeg DUNG CHUNG cho ca bo AiO Studio
#
# ===========================================================================
# VI SAO CO FILE NAY
# ===========================================================================
# Do that 13/08/2026: bay panel deu dong goi DUNG MOT file ffmpeg.exe.
#
#   ffmpeg.exe   SHA-256 bat dau 4CBB08190774   109,5 MB
#   ffprobe.exe  SHA-256 bat dau 6E3A2FB316B3   109,3 MB
#
# Ba bo cai beta (Autocut + Asset Manager + Power Bins) = 274,7 MB, trong do
# 99,7% la FFmpeg lap lai. Code panel that su chi chiem 0,1-0,3 MB moi goi.
#
# Gop ve mot cho -> ~92 MB. Giam 67%.
#
# ===========================================================================
# DAT O DAU VA VI SAO
# ===========================================================================
#   %APPDATA%\AiOStudio\bin\win64\
#
# - KHONG dat trong %APPDATA%\Adobe\CEP\extensions\ : thu muc do bi Premiere
#   quet tim extension, nhet mot thu muc khong co CSXS\manifest.xml vao day la
#   tu chuoc rac roi.
# - KHONG dat trong Program Files : can quyen Admin, nguoi dung lanh se bo cuoc.
# - %APPDATA% thi khong ai quet, khong can Admin, va song qua moi lan cai lai
#   panel.
#
# Phia panel doc kho nay o cuoi danh sach duong dan ung vien trong
# client/src/services/ffmpeg.ts (ham getFFmpegPath / getFFprobePath).
# DAT CUOI la co y: ban cu con bin/ rieng van chay y nhu truoc, khong hoi quy.
#
# ===========================================================================
# CACH DUNG
# ===========================================================================
#   powershell -ExecutionPolicy Bypass -File "design-system\cai-bin-chung.ps1"
#   ... -Go        : go kho chung di (khong dung toi bin/ cua tung panel)
#
[CmdletBinding()]
param(
  [switch]$Go
)

$ErrorActionPreference = 'Stop'

$goc    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)  # AiO Studio
$dich   = Join-Path $env:APPDATA 'AiOStudio\bin\win64'
$canCo  = @('ffmpeg.exe', 'ffprobe.exe')

Write-Host ""
Write-Host "=== KHO FFmpeg DUNG CHUNG - AiO Studio ===" -ForegroundColor Cyan
Write-Host "    Dich: $dich" -ForegroundColor Gray
Write-Host ""

# ---------------------------------------------------------------- GO
if ($Go) {
  if (-not (Test-Path $dich)) {
    Write-Host "  Khong co kho chung de go." -ForegroundColor Yellow
    exit 0
  }
  $truoc = (Get-ChildItem $dich -File | Measure-Object -Property Length -Sum).Sum
  try {
    Remove-Item $dich -Recurse -Force
    Write-Host ("  [OK] Da go kho chung, giai phong {0:N1} MB" -f ($truoc/1MB)) -ForegroundColor Green
    Write-Host "  Luu y: bin/ rieng cua tung panel KHONG bi dung toi." -ForegroundColor Gray
  } catch {
    Write-Host "  [LOI] Khong go duoc: $_" -ForegroundColor Red
    Write-Host "  Thuong la vi Premiere dang mo va FFmpeg dang chay. Dong Premiere roi thu lai." -ForegroundColor Yellow
    exit 1
  }
  exit 0
}

# ---------------------------------------------------------------- TIM NGUON
# Lay tu bat ky panel nao co bin/win64 - chung y het nhau nen lay cai nao cung duoc,
# nhung van doi chieu hash de chac khong co panel nao lech ban.
$nguon = @{}
foreach ($ten in $canCo) {
  # !!! @() BAT BUOC: Get-ChildItem tra ve MOT doi tuong (khong phai mang) khi
  # chi khop 1 file, luc do $tim[0] va $tim.Count deu cho ket qua sai.
  $tim = @(Get-ChildItem $goc -Recurse -Filter $ten -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -like '*\bin\win64\*' -and $_.FullName -notlike '*\build\*' })
  if ($tim.Count -eq 0) {
    Write-Host "  [LOI] Khong tim thay $ten trong bin\win64 cua panel nao." -ForegroundColor Red
    exit 1
  }

  # Doi chieu hash giua cac panel - lech nhau la co panel dung ban FFmpeg khac,
  # gop chung se lam panel do doi hanh vi ma khong ai biet.
  # !!! @() BAT BUOC o day nua: `Select-Object -Unique` tra ve MOT CHUOI khi chi
  # con 1 gia tri duy nhat - luc do $khac[0] lay ra mot KY TU, va .Substring()
  # tren [char] nem loi "does not contain a method named 'Substring'".
  # Da vap that 13/08/2026, script chet ngay lan chay dau.
  $hashes = @($tim | ForEach-Object { (Get-FileHash $_.FullName -Algorithm SHA256).Hash })
  $khac   = @($hashes | Select-Object -Unique)
  if ($khac.Count -gt 1) {
    Write-Host "  [LOI] $ten KHONG giong nhau giua cac panel ($($khac.Count) ban khac nhau):" -ForegroundColor Red
    $tim | ForEach-Object {
      $h = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.Substring(0,12)
      Write-Host ("        {0}  {1}" -f $h, $_.FullName.Replace($goc + '\','')) -ForegroundColor Red
    }
    Write-Host "  Dung gop chung khi chua biet vi sao lech. Kiem lai truoc." -ForegroundColor Yellow
    exit 1
  }

  $nguon[$ten] = $tim[0]
  Write-Host ("  Nguon {0,-12} {1,7:N1} MB  hash {2}  ({3} panel deu giong)" -f `
    $ten, ($tim[0].Length/1MB), $khac[0].Substring(0,12), $tim.Count) -ForegroundColor Gray
}

# ---------------------------------------------------------------- CHEP
if (-not (Test-Path $dich)) { New-Item -ItemType Directory -Path $dich -Force | Out-Null }

Write-Host ""
$loi = 0
foreach ($ten in $canCo) {
  $to = Join-Path $dich $ten
  try {
    Copy-Item $nguon[$ten].FullName $to -Force
  } catch {
    Write-Host "  [LOI] Khong chep duoc $ten : $_" -ForegroundColor Red
    Write-Host "        Thuong la file dang bi khoa (Premiere dang chay FFmpeg)." -ForegroundColor Yellow
    $loi++
    continue
  }

  # !!! DOC LAI DE KIEM - "khong bao loi" KHONG co nghia la "da ghi dung".
  # Copy-Item chay tron lot van co the ra file thieu byte neu dia day.
  if (-not (Test-Path $to)) {
    Write-Host "  [LOI] $ten : chep xong ma file khong ton tai." -ForegroundColor Red
    $loi++
    continue
  }
  $hNguon = (Get-FileHash $nguon[$ten].FullName -Algorithm SHA256).Hash
  $hDich  = (Get-FileHash $to -Algorithm SHA256).Hash
  if ($hNguon -ne $hDich) {
    Write-Host "  [LOI] $ten : hash dich KHAC nguon - ban chep bi hong." -ForegroundColor Red
    $loi++
    continue
  }
  Write-Host ("  [OK] {0,-12} {1,7:N1} MB  hash khop nguon" -f $ten, ((Get-Item $to).Length/1MB)) -ForegroundColor Green
}

if ($loi -gt 0) {
  Write-Host ""
  Write-Host "  $loi file that bai. Kho chung CHUA dung duoc." -ForegroundColor Red
  exit 1
}

# ---------------------------------------------------------------- BAO CAO
$tong = (Get-ChildItem $dich -File | Measure-Object -Property Length -Sum).Sum
Write-Host ""
Write-Host ("  Kho chung: {0:N1} MB tai {1}" -f ($tong/1MB), $dich) -ForegroundColor Cyan
Write-Host ""
Write-Host "  BUOC TIEP THEO (phai lam thu cong):" -ForegroundColor Yellow
Write-Host "   1. Dong goi lai panel voi tham so -BinChung de goi KHONG kem FFmpeg:" -ForegroundColor Gray
Write-Host "        scripts\package-release.ps1 -BinChung" -ForegroundColor Gray
Write-Host "   2. Mo Premiere, chay thu MOI panel mot lan tren video that." -ForegroundColor Gray
Write-Host "      Panel phai tim thay FFmpeg o kho chung nay - neu bao thieu file la" -ForegroundColor Gray
Write-Host "      duong dan trong ffmpeg.ts chua khop, KHONG duoc phat beta." -ForegroundColor Gray
Write-Host ""
