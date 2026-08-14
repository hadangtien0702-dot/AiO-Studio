# =============================================================================
#  dong-bo-tokens.ps1 - Chep NGUON CHAN LY (tokens.css) sang ca 4 panel.
# =============================================================================
#  Anh Tien 2026-07-29: *"anh thay ca 4 phan UI chua dong bo do em. Em nen dua
#  ra mot UI Design System cho thong nhat... anh thay moi lan em thiet ke lai
#  lap lai cac loi tu hoi xua den gio"*.
#
#  Nguyen nhan do duoc: BON file CSS chep tay lan nhau. So bai hoc thiet ke da
#  ghi tu lau (quy tac 21) ma van vap - vi loi dan nam trong TAI LIEU chu khong
#  nam trong CO CHE.
#
#  File nay LA co che do. Sua tokens.css roi chay script nay; dung sua ban copy.
#
#  Chay:  .\design-system\dong-bo-tokens.ps1
#         .\design-system\dong-bo-tokens.ps1 -KiemThoi   (chi bao lech, khong ghi)
# =============================================================================
param([switch]$KiemThoi)

$ErrorActionPreference = 'Stop'
$goc = Split-Path -Parent $MyInvocation.MyCommand.Path
$nguon = Join-Path $goc 'tokens.css'
if (-not (Test-Path $nguon)) { throw "Khong thay $nguon" }

$noiDung = Get-Content $nguon -Raw -Encoding UTF8
$studio = Split-Path -Parent $goc

# Bon dich den. Asset Manager / Power Bins dung SCSS - nhung SCSS la superset
# cua CSS nen file .css hop le cung la .scss hop le, chep thang duoc.
$dich = @(
  'AiO Asset Manager\client\src\styles\_tokens.scss',
  'AiO Power Bins\client\src\styles\_tokens.scss',
  'AiO Autocut\client\src\tokens.css',
  'AiO Transcripts\client\src\tokens.css'
)

$doi = 0; $giong = 0; $thieu = 0
foreach ($d in $dich) {
  $p = Join-Path $studio $d
  $thuMuc = Split-Path -Parent $p
  if (-not (Test-Path $thuMuc)) {
    Write-Output "  [BO QUA] khong thay thu muc: $d"
    $thieu++
    continue
  }
  $cu = if (Test-Path $p) { Get-Content $p -Raw -Encoding UTF8 } else { '' }
  if ($cu -eq $noiDung) {
    Write-Output "  [GIONG]  $d"
    $giong++
    continue
  }
  if ($KiemThoi) {
    Write-Output "  [LECH]   $d"
    $doi++
    continue
  }
  # -NoNewline: giu nguyen tung byte de lan sau so sanh khong bao lech oan.
  Set-Content -Path $p -Value $noiDung -Encoding UTF8 -NoNewline
  Write-Output "  [DA CHEP] $d"
  $doi++
}

Write-Output ''
if ($KiemThoi) {
  if ($doi -gt 0) {
    Write-Output "LECH $doi noi. Chay lai KHONG co -KiemThoi de dong bo."
    exit 1
  }
  Write-Output "Ca $giong noi deu KHOP nguon chan ly."
} else {
  Write-Output "Xong: $doi noi da chep, $giong noi da giong san, $thieu noi khong thay."
  Write-Output "Nho build lai panel nao vua doi token."
}
