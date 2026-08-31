# dong-bo-may.ps1 — chay tren BAT KY may nao cua anh Tien de dong bo voi GitHub.
# Viet 31/08/2026 theo yeu cau: /xong phai lo cho may kia du 3 viec
#   1. keo code moi ve (git pull)
#   2. kiem tra thu muc co khop voi GitHub khong (dem file)
#   3. bao/cai nhung thu con thieu de CHAY duoc (node_modules, Electron, FFmpeg...)
#
# Cach dung (tren may nha, mo cmd hoac PowerShell):
#   powershell -ExecutionPolicy Bypass -File "D:\Production\AiO Studio\scripts\dong-bo-may.ps1"
#   -> chi KIEM TRA va BAO, khong tu cai gi.
#   Them  -CaiThem  vao cuoi de tu dong npm install nhung panel thieu node_modules.
#
# Luu y: script nay chay bang duong dan cua CHINH NO nen may nao chay cung dung,
# khong can sua duong dan.

param([switch]$CaiThem)

$ErrorActionPreference = 'Continue'
# Ten file co dau tieng Viet: bat git tra ve UTF-8 that (khong escape \341...)
# va bat PowerShell doc dung UTF-8 — thieu mot trong hai la Test-Path nghen.
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
$repo = Split-Path $PSScriptRoot -Parent
Write-Host "=== DONG BO MAY - repo: $repo ===" -ForegroundColor Cyan

# ---------- 1. KEO CODE MOI VE ----------
Write-Host "`n[1/3] git pull..." -ForegroundColor Yellow
Push-Location $repo
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "LOI: git pull that bai - kiem tra mang / dang nhap GitHub roi chay lai." -ForegroundColor Red
    Pop-Location
    exit 1
}

# ---------- 2. KIEM THU MUC KHOP GITHUB ----------
Write-Host "`n[2/3] Doi chieu file voi GitHub..." -ForegroundColor Yellow
$dsFile = git -c core.quotepath=false ls-files
$soFile = ($dsFile | Measure-Object).Count
$thieu = $dsFile | Where-Object { -not (Test-Path -LiteralPath (Join-Path $repo $_)) }
Write-Host "  Git quan ly: $soFile file"
if ($thieu) {
    Write-Host "  THIEU $($thieu.Count) file tren o (bi xoa tay?):" -ForegroundColor Red
    $thieu | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Write-Host "  -> chay: git checkout -- . de lay lai" -ForegroundColor Red
} else {
    Write-Host "  DAT: du 100% file tren o, khop GitHub." -ForegroundColor Green
}

# ---------- 3. KIEM DO CHAY: node_modules / Electron / FFmpeg ----------
Write-Host "`n[3/3] Kiem nhung thu can de CHAY (khong nam tren GitHub)..." -ForegroundColor Yellow

$npmOk = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $npmOk) {
    Write-Host "  CHUA CO Node.js/npm - cai tu https://nodejs.org (ban LTS) roi chay lai script." -ForegroundColor Red
}

# Tim moi package.json trong repo (bo qua node_modules), kiem node_modules canh no
$goiThieu = @()
Get-ChildItem $repo -Recurse -Filter package.json -File |
    Where-Object { $_.FullName -notmatch 'node_modules|\\\.next|\\\.wrangler|\\dist\\|\\out\\' } |
    ForEach-Object {
        $nm = Join-Path $_.DirectoryName 'node_modules'
        $ten = $_.DirectoryName.Substring($repo.Length + 1)
        if (Test-Path $nm) {
            Write-Host "  DAT: $ten (da co node_modules)" -ForegroundColor Green
        } else {
            $goiThieu += $_.DirectoryName
            Write-Host "  THIEU node_modules: $ten" -ForegroundColor Red
        }
    }

if ($goiThieu.Count -gt 0 -and $CaiThem -and $npmOk) {
    Write-Host "`n  -CaiThem: dang npm install $($goiThieu.Count) cho thieu (co the mat vai phut)..." -ForegroundColor Yellow
    foreach ($d in $goiThieu) {
        Write-Host "  npm install: $d"
        Push-Location $d
        npm install
        Pop-Location
    }
} elseif ($goiThieu.Count -gt 0) {
    Write-Host "`n  -> Muon tu cai het, chay lai kem:  -CaiThem" -ForegroundColor Yellow
}

# FFmpeg bin/ cua 4 panel (khong qua git - phai chep tay tu may kia)
$binThieu = @()
foreach ($p in 'AiO Asset Manager','AiO Autocut','AiO Power Bins','AiO Transcripts') {
    $bin = Join-Path $repo "Build and UI Design\$p\bin"
    if (-not (Test-Path $bin)) { $binThieu += $p }
}
if ($binThieu.Count -gt 0) {
    Write-Host "`n  THIEU bin\ FFmpeg (~219 MB/panel): $($binThieu -join ', ')" -ForegroundColor Yellow
    Write-Host "  -> Chi can khi CHAY panel that tren Premiere. Chep tay tu may kia (USB/Drive)." -ForegroundColor Yellow
}

Write-Host "`n=== Nhung thu CO Y khong co (khong phai loi): bo cai .exe/.rar trong Release, Test Media 1,33 GB, .env.local cua Website ===" -ForegroundColor DarkGray
Pop-Location
Write-Host "`nXONG." -ForegroundColor Cyan
