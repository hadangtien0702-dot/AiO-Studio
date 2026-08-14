# =====================================================================
#  AiO Studio BETA - cai-dat.ps1 - CAI MOT PHAT CA BO 3 PANEL
#
#  Cai: Autocut + Asset Manager + Power Bins + kho FFmpeg dung chung.
#  Chay bang CAI-DAT.bat (bam dup). Khong can quyen Admin.
#
#  Vi sao co kho FFmpeg dung chung: ca 3 panel dung DUNG MOT file ffmpeg.exe
#  (da doi chieu SHA-256). Dong goi rieng tung panel la 274,7 MB; gop ve
#  %APPDATA%\AiOStudio\bin\win64 thi ca bo con ~92 MB.
#
#  -ThuMucDich <duong-dan> : che do THU - giai nen vao thu muc nay thay vi
#      cai that, va KHONG dung registry. Dung de kiem bo cai truoc khi phat.
# =====================================================================
param(
  [string]$ThuMucDich = ''
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$goc      = $PSScriptRoot
$thuMode  = $ThuMucDich -ne ''
$extRoot  = if ($thuMode) { Join-Path $ThuMucDich 'extensions' } else { Join-Path $env:APPDATA 'Adobe\CEP\extensions' }
$binDich  = if ($thuMode) { Join-Path $ThuMucDich 'AiOStudio\bin\win64' } else { Join-Path $env:APPDATA 'AiOStudio\bin\win64' }

Write-Host ""
Write-Host "=== AiO Studio BETA - cai ca bo 3 panel ===" -ForegroundColor Cyan
if ($thuMode) { Write-Host "    (CHE DO THU - khong dung registry, cai vao $ThuMucDich)" -ForegroundColor Yellow }
Write-Host ""

# --- 1. Bat PlayerDebugMode (panel ky chung chi tu tao can no de Premiere chiu nap) ---
if (-not $thuMode) {
  foreach ($v in 9..12) {
    $key = "HKCU:\Software\Adobe\CSXS.$v"
    if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
    New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
  }
  Write-Host "  [OK] Da bat che do nap extension (registry nguoi dung, khong can Admin)" -ForegroundColor Green
}

# --- 2. Cai tung panel tu panels\*.zxp ---
# .zxp thuc chat la file zip da ky - giai nen dung cho la Premiere nhan.
# Doc ExtensionBundleId tu CHINH manifest trong goi, khong doan theo ten file
# (da co loi that: goi mang ten panel nay ma ruot la panel kia).
$dsZxp = @(Get-ChildItem (Join-Path $goc 'panels') -Filter '*.zxp' -ErrorAction SilentlyContinue)
if ($dsZxp.Count -eq 0) { throw "Khong thay file .zxp nao trong thu muc panels\" }

$daCai = @()
foreach ($zxp in $dsZxp) {
  $tam = Join-Path $env:TEMP ("aio-beta-" + [IO.Path]::GetRandomFileName())
  [System.IO.Compression.ZipFile]::ExtractToDirectory($zxp.FullName, $tam)

  $mfPath = Join-Path $tam 'CSXS\manifest.xml'
  if (-not (Test-Path $mfPath)) { Remove-Item $tam -Recurse -Force; throw ("Goi hong (khong co manifest): " + $zxp.Name) }
  [xml]$mf = Get-Content $mfPath
  $id = $mf.ExtensionManifest.ExtensionBundleId
  if (-not $id) { Remove-Item $tam -Recurse -Force; throw ("Khong doc duoc BundleId: " + $zxp.Name) }

  $dich = Join-Path $extRoot $id
  if (-not (Test-Path $dich)) { New-Item -ItemType Directory -Path $dich -Force | Out-Null }

  # CHEP DE TUNG FILE, khong xoa sach thu muc cu: neu panel dang mo va giu
  # file thi lenh xoa chet giua chung nhung DA kip xoa dist\index.html
  # -> panel trang. Loi that da xay ra, dung doi lai kieu xoa-roi-chep.
  $loi = 0
  Get-ChildItem $tam -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($tam.Length + 1)
    $den = Join-Path $dich $rel
    $thu = Split-Path $den -Parent
    if (-not (Test-Path $thu)) { New-Item -ItemType Directory -Path $thu -Force | Out-Null }
    try { Copy-Item $_.FullName $den -Force } catch { $loi++ }
  }
  Remove-Item $tam -Recurse -Force

  # Doc lai de kiem - "khong bao loi" khong co nghia la "da ghi".
  $co = Test-Path (Join-Path $dich 'dist\index.html')
  if (-not $co) { throw ("Cai " + $zxp.Name + " xong ma khong thay dist\index.html - hong.") }
  $nhan = if ($loi -gt 0) { "($loi file bi khoa, bo qua - thuong la panel dang mo)" } else { "" }
  Write-Host ("  [OK] " + $id + " " + $nhan) -ForegroundColor Green
  $daCai += $id
}

# --- 3. Kho FFmpeg dung chung ---
$binNguon = Join-Path $goc 'bin-chung\win64'
if (-not (Test-Path $binNguon)) { throw "Khong thay thu muc bin-chung\win64 trong bo cai." }
if (-not (Test-Path $binDich)) { New-Item -ItemType Directory -Path $binDich -Force | Out-Null }

foreach ($f in (Get-ChildItem $binNguon -File)) {
  $den = Join-Path $binDich $f.Name
  $daDung = $false
  if (Test-Path $den) {
    # Da co san va giong het (nguoi da cai ban truoc) thi khoi chep 100 MB lai.
    $h1 = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    $h2 = (Get-FileHash $den -Algorithm SHA256).Hash
    if ($h1 -eq $h2) { $daDung = $true }
  }
  if (-not $daDung) {
    try { Copy-Item $f.FullName $den -Force }
    catch {
      Write-Host ("  [!] " + $f.Name + " dang bi khoa (panel dang chay?) - giu ban cu.") -ForegroundColor Yellow
      continue
    }
    # Doc lai bam hash - chep hong (dia day, ngat giua chung) phai lo ngay o day,
    # dung de toi luc panel bao "thieu FFmpeg" moi di tim.
    $h1 = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    $h2 = (Get-FileHash $den -Algorithm SHA256).Hash
    if ($h1 -ne $h2) { throw ("Chep " + $f.Name + " ra ban HONG (hash lech). Kiem dung luong o dia.") }
  }
  Write-Host ("  [OK] " + $f.Name + " -> kho dung chung") -ForegroundColor Green
}

# --- 4. Tom tat ---
Write-Host ""
Write-Host ("  Da cai " + $daCai.Count + " panel: " + ($daCai -join ", ")) -ForegroundColor Cyan
Write-Host ("  Kho FFmpeg: " + $binDich) -ForegroundColor Cyan
Write-Host ""
if (-not $thuMode) {
  Write-Host "  BUOC CUOI: mo Premiere Pro -> Window -> Extensions ->" -ForegroundColor Yellow
  Write-Host "             AiO Studio - Autocut / Asset Manager / Power Bins" -ForegroundColor Yellow
  Write-Host "  (Neu Premiere dang mo luc cai: tat han roi mo lai.)" -ForegroundColor Yellow
}
Write-Host ""
