# =============================================================================
#  kiem-tai-nguyen.ps1 - SOI 7 PANEL xem con tuan thu luat tai nguyen khong.
# =============================================================================
#  Anh Tien chot 2026-08-04: *"tat ca cac tool dang trong qua trinh xay dung em
#  set cai dat tai nguyen o muc RAM - CPU va GPU em dung toan bo o muc toi
#  thieu la 50% va toi da la 70% giup anh cho toan bo tool chu khong rieng gi
#  moi tool"*.
#
#  Cung ly do voi kiem-dong-bo.ps1: loi dan nam trong TAI LIEU thi moi panel
#  lai chep tay mot kieu roi lech di trong im lang. File nay LA co che do.
#
#  ☠️ NO CHI DOC MA NGUON, KHONG DO MAY THAT. Muon biet luc chay that an bao
#  nhieu CPU thi phai bam nut roi do bang Get-Counter - xem cuoi file.
#
#  Chay:  powershell -File "design-system\kiem-tai-nguyen.ps1"
# =============================================================================
$ErrorActionPreference = 'Stop'
$goc = Split-Path -Parent $MyInvocation.MyCommand.Path
$studio = Split-Path -Parent $goc

$TRAN = 0.70
$SAN = 0.50

Write-Output ''
Write-Output '=== LUAT: CPU/RAM/GPU trong dai 50% - 70% (anh Tien chot 04/08/2026) ==='
$luong = (Get-CimInstance Win32_Processor | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
Write-Output ("May nay: $luong luong logic - RAM $ram GB")
Write-Output ("  => tran CPU  = " + [math]::Floor($luong * $TRAN) + " luong")
Write-Output ("  => san CPU   = " + [math]::Floor($luong * $SAN) + " luong")
Write-Output ''

$loi = 0
$canhBao = 0

function Soi([string]$ten, [string]$duong, [string]$mau, [string]$mongDoi) {
  $day = Join-Path $studio $duong
  if (-not (Test-Path $day)) {
    Write-Output ("  ? $ten - KHONG THAY FILE: $duong")
    $script:canhBao++
    return
  }
  $noi = Get-Content $day -Raw -Encoding UTF8
  if ($noi -match $mau) {
    Write-Output ("  OK   $ten - $mongDoi")
  } else {
    Write-Output ("  LECH $ten - KHONG thay '$mongDoi' trong $duong")
    $script:loi++
  }
}

Write-Output '--- 1. Panel CO BUILD (TypeScript): hang so TRAN_TAI_NGUYEN = 0.70 ---'
Soi 'Autocut' 'AiO Autocut\client\src\services\ffmpeg.ts' 'TRAN_TAI_NGUYEN = 0\.70' 'TRAN_TAI_NGUYEN = 0.70'
Soi 'Transcripts' 'AiO Transcripts\client\src\services\ffmpeg.ts' 'TRAN_TAI_NGUYEN = 0\.70' 'TRAN_TAI_NGUYEN = 0.70'
Soi 'Asset Manager' 'AiO Asset Manager\client\src\services\jobQueue.ts' 'TRAN_TAI_NGUYEN = 0\.70' 'TRAN_TAI_NGUYEN = 0.70'
Soi 'Power Bins' 'AiO Power Bins\client\src\services\jobQueue.ts' 'TRAN_TAI_NGUYEN = 0\.70' 'TRAN_TAI_NGUYEN = 0.70'

Write-Output ''
Write-Output '--- 2. Panel KHONG BUILD (JS thuan): phai nap tai-nguyen.js va ghim -threads ---'
Soi 'Auto Podcast (nap)' 'AiO Auto Podcast\dist\index.html' 'tai-nguyen\.js' 'co <script src="./tai-nguyen.js">'
Soi 'Auto Podcast (ghim)' 'AiO Auto Podcast\dist\index.html' "AiOTaiNguyen\.chiaLuong" 'dung AiOTaiNguyen.chiaLuong cho -threads'
Soi 'Re-Frames (nap)' 'AiO Auto Re-Frames\dist\index.html' 'tai-nguyen\.js' 'co <script src="./tai-nguyen.js">'
Soi 'Re-Frames (ghim)' 'AiO Auto Re-Frames\dist\index.html' "AiOTaiNguyen\.chiaLuong" 'dung AiOTaiNguyen.chiaLuong cho -threads'

Write-Output ''
Write-Output '--- 3. Ban chep tai-nguyen.js con khop NGUON khong ---'
$nguon = Join-Path $goc 'tai-nguyen.js'
$bam = (Get-FileHash $nguon -Algorithm MD5).Hash
foreach ($p in @('AiO Auto Podcast', 'AiO Auto Re-Frames')) {
  $ban = Join-Path $studio "$p\dist\tai-nguyen.js"
  if (-not (Test-Path $ban)) {
    Write-Output ("  THIEU $p - chua co ban chep tai-nguyen.js")
    $loi++
    continue
  }
  if ((Get-FileHash $ban -Algorithm MD5).Hash -eq $bam) {
    Write-Output ("  OK   $p - khop nguon tung byte")
  } else {
    Write-Output ("  LECH $p - ban chep KHAC nguon, chay dong-bo-tai-nguyen.ps1")
    $loi++
  }
}

Write-Output ''
Write-Output '--- 4. Chua ai lam BUNG CPU (khong -threads truoc -i) ---'
$nghi = @(
  @{ ten = 'Auto Podcast'; duong = 'AiO Auto Podcast\dist\index.html' },
  @{ ten = 'Re-Frames'; duong = 'AiO Auto Re-Frames\dist\index.html' }
)
foreach ($n in $nghi) {
  $day = Join-Path $studio $n.duong
  if (-not (Test-Path $day)) { continue }
  $noi = Get-Content $day -Raw -Encoding UTF8
  # Dem so lan goi execFile(ffmpeg voi so lan co '-threads'
  $goiFf = ([regex]::Matches($noi, "execFile\(\s*ffmpeg")).Count
  $coThreads = ([regex]::Matches($noi, "'-threads'")).Count
  if ($goiFf -gt 0 -and $coThreads -lt $goiFf) {
    Write-Output ("  LECH " + $n.ten + " - $goiFf lan goi ffmpeg nhung chi $coThreads lan ghim -threads")
    $loi++
  } else {
    Write-Output ("  OK   " + $n.ten + " - $goiFf lan goi ffmpeg, $coThreads lan ghim -threads")
  }
}

Write-Output ''
if ($loi -eq 0) {
  Write-Output ">>> TAT CA KHOP LUAT (canh bao: $canhBao)"
} else {
  Write-Output ">>> CO $loi CHO LECH - sua roi chay lai"
}

Write-Output ''
Write-Output '--- GHI NHO: file nay chi DOC MA NGUON ---'
Write-Output 'Muon biet luc chay THAT an bao nhieu CPU thi bam nut trong panel roi do:'
Write-Output '  Get-Process ffmpeg | Select-Object Id, CPU, WorkingSet64, PriorityClass'
Write-Output '  Get-Counter "\Process(ffmpeg*)\% Processor Time" -SampleInterval 1 -MaxSamples 10'
Write-Output 'Chia ket qua cho so luong logic de ra % that. Ma nguon dung KHONG bao dam'
Write-Output 'may that chay dung - do that moi biet (bai hoc 2: build sach khong tinh la da kiem).'

if ($loi -gt 0) { exit 1 }
