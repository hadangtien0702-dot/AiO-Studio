# dong-bo-ngonngu.ps1 - Chep module song ngu tu NGUON CHAN LY sang cac panel React.
#
# Cung luat voi dong-bo-tokens.ps1: sua o design-system\ngonngu.tsx, KHONG sua
# ban copy trong client\src\ cua tung panel. Chay file nay de chep sang.
#
#   powershell -ExecutionPolicy Bypass -File "design-system\dong-bo-ngonngu.ps1"
#   ... -Kiem   : chi KIEM xem con khop nguon khong, khong chep (dung truoc khi build)
#
[CmdletBinding()]
param(
  [switch]$Kiem
)

$ErrorActionPreference = 'Stop'

$goc    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)  # AiO Studio
$nguon  = Join-Path $goc 'design-system\ngonngu.tsx'

# Chi panel React+Vite. Panel HTML tinh (Podcast, Re-Frames, Guide Frame, Mussic)
# dung khuon NGON_NGU/t()/tp() viet thang trong index.html - khong dung file nay.
$panels = @(
  'AiO Autocut',
  'AiO Asset Manager',
  'AiO Power Bins',
  'AiO Transcripts'
)

if (-not (Test-Path $nguon)) { Write-Host "  [LOI] Khong thay nguon: $nguon" -ForegroundColor Red; exit 1 }

$hNguon = (Get-FileHash $nguon -Algorithm SHA256).Hash

Write-Host ""
Write-Host "=== MODULE SONG NGU - dong bo tu nguon chan ly ===" -ForegroundColor Cyan
Write-Host ("    Nguon: design-system\ngonngu.tsx  ({0:N1} KB, hash {1})" -f `
  ((Get-Item $nguon).Length/1KB), $hNguon.Substring(0,12)) -ForegroundColor Gray
Write-Host ""

$lech = 0
foreach ($p in $panels) {
  $dich = Join-Path $goc "$p\client\src\ngonngu.tsx"
  $thuMuc = Split-Path -Parent $dich
  if (-not (Test-Path $thuMuc)) {
    Write-Host ("  [BO QUA] {0} - khong co client\src" -f $p) -ForegroundColor DarkGray
    continue
  }

  $daCo = Test-Path $dich
  $hDich = if ($daCo) { (Get-FileHash $dich -Algorithm SHA256).Hash } else { '' }

  if ($hDich -eq $hNguon) {
    Write-Host ("  [KHOP]  {0}" -f $p) -ForegroundColor Green
    continue
  }

  if ($Kiem) {
    $ly = if ($daCo) { 'LECH nguon' } else { 'CHUA co' }
    Write-Host ("  [{0}] {1}" -f $ly, $p) -ForegroundColor Yellow
    $lech++
    continue
  }

  Copy-Item $nguon $dich -Force

  # !!! DOC LAI DE KIEM - "Copy-Item khong bao loi" KHONG co nghia la "da ghi dung".
  $hSau = (Get-FileHash $dich -Algorithm SHA256).Hash
  if ($hSau -ne $hNguon) {
    Write-Host ("  [LOI]   {0} - hash sau khi chep KHAC nguon" -f $p) -ForegroundColor Red
    $lech++
    continue
  }
  Write-Host ("  [CHEP]  {0}" -f $p) -ForegroundColor Cyan
}

Write-Host ""
if ($Kiem) {
  if ($lech -gt 0) {
    Write-Host "  $lech panel chua khop nguon. Chay lai khong co -Kiem de chep." -ForegroundColor Yellow
    exit 1
  }
  Write-Host "  Ca $($panels.Count) panel deu khop nguon." -ForegroundColor Green
  exit 0
}
if ($lech -gt 0) { Write-Host "  $lech panel that bai." -ForegroundColor Red; exit 1 }
Write-Host "  Xong. Nho chay 'npm run build' o panel nao vua doi." -ForegroundColor Gray
Write-Host ""
