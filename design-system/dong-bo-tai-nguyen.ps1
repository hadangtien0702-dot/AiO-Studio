# =============================================================================
#  dong-bo-tai-nguyen.ps1 - Chep NGUON CHAN LY (tai-nguyen.js) sang cac panel.
# =============================================================================
#  Anh Tien chot 2026-08-04: CPU/RAM/GPU dung trong dai 50% - 70%, ap cho CA BO
#  chu khong rieng tung tool.
#
#  ☠️ CHI CHEP CHO PANEL KHONG BUILD (JS thuan nap bang <script src>).
#  Bon panel CO BUILD (Asset Manager, Power Bins, Autocut, Transcripts) giu ban
#  chep hang so `TRAN_TAI_NGUYEN` ngay trong file .ts cua no — TypeScript khong
#  import duoc file JS thuan nay ma khong doi cau hinh build, doi cau hinh build
#  cua 4 panel dang chay la rui ro lon hon loi ich.
#  => Sau khi doi ti le trong tai-nguyen.js, PHAI sua tay 4 hang so do, roi
#     chay `kiem-tai-nguyen.ps1` de no bat cho nao con lech.
#
#  Chay:  powershell -File "design-system\dong-bo-tai-nguyen.ps1"
#         powershell -File "design-system\dong-bo-tai-nguyen.ps1" -KiemThoi
# =============================================================================
param([switch]$KiemThoi)

$ErrorActionPreference = 'Stop'
$goc = Split-Path -Parent $MyInvocation.MyCommand.Path
$studio = Split-Path -Parent $goc
$nguon = Join-Path $goc 'tai-nguyen.js'
if (-not (Test-Path $nguon)) { throw "Khong thay $nguon" }

# Panel KHONG build — nap tai-nguyen.js bang <script src="./tai-nguyen.js">
$dich = @(
  'AiO Auto Podcast\dist\tai-nguyen.js',
  'AiO Auto Re-Frames\dist\tai-nguyen.js'
)

$bamNguon = (Get-FileHash $nguon -Algorithm MD5).Hash
$doi = 0
$giong = 0

foreach ($d in $dich) {
  $day = Join-Path $studio $d
  $thuMuc = Split-Path -Parent $day
  if (-not (Test-Path $thuMuc)) {
    Write-Output "  BO QUA (khong co thu muc): $d"
    continue
  }
  if ((Test-Path $day) -and (Get-FileHash $day -Algorithm MD5).Hash -eq $bamNguon) {
    Write-Output "  giong    $d"
    $giong++
    continue
  }
  if ($KiemThoi) {
    Write-Output "  LECH     $d  (chay khong co -KiemThoi de ghi de)"
    $doi++
  } else {
    Copy-Item $nguon $day -Force
    Write-Output "  DA CHEP  $d"
    $doi++
  }
}

Write-Output ''
Write-Output "Nguon: $nguon"
Write-Output ("Giong san: $giong | " + $(if ($KiemThoi) { "Lech: $doi" } else { "Da chep: $doi" }))
Write-Output ''
Write-Output '--- NHAC: 4 panel CO BUILD giu hang so rieng, kiem bang: ---'
Write-Output '  powershell -File "design-system\kiem-tai-nguyen.ps1"'

if ($KiemThoi -and $doi -gt 0) { exit 1 }
