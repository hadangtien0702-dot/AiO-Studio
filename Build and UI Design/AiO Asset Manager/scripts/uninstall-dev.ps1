# =====================================================================
#  AiO Studio - uninstall-dev.ps1
#  Remove the panel junction from the CEP extensions folder.
#  ASCII-only for Windows PowerShell 5.1 compatibility.
# =====================================================================
$ErrorActionPreference = 'Stop'

$extId    = 'com.aiostudio.assetmanager'
$linkPath = Join-Path $env:APPDATA "Adobe\CEP\extensions\$extId"

if (Test-Path $linkPath) {
  $item = Get-Item $linkPath -Force
  if ($item.LinkType) { $item.Delete() } else { Remove-Item $linkPath -Recurse -Force }
  Write-Host ("[OK] Removed: " + $linkPath) -ForegroundColor Green
} else {
  Write-Host ("Panel not found: " + $linkPath) -ForegroundColor Yellow
}
Write-Host "Restart Premiere to apply."
