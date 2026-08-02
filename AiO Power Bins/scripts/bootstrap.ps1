# =====================================================================
#  AiO Studio - bootstrap.ps1
#  Cai dat 1-phat tren may moi: cai deps -> build panel -> ky -> cai vao Premiere.
#  Chay:  powershell -ExecutionPolicy Bypass -File scripts\bootstrap.ps1
#  ASCII-only cho Windows PowerShell 5.1.
# =====================================================================
$ErrorActionPreference = 'Stop'

$root   = Split-Path -Parent $PSScriptRoot
$client = Join-Path $root 'client'

Write-Host "=== AiO Studio - Bootstrap ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Cai dependencies (npm install)..." -ForegroundColor Cyan
Push-Location $client
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm install that bai." }

Write-Host "`n[2/3] Build panel (npm run build)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm run build that bai." }
Pop-Location

Write-Host "`n[3/3] Ky va cai vao Premiere..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'sign-install.ps1')

Write-Host "`n=== HOAN TAT ===" -ForegroundColor Green
Write-Host "Mo Premiere Pro -> Window -> Extensions -> AiO Studio Asset Manager"
