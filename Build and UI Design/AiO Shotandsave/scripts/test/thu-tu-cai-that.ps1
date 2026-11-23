# Thu THAT buoc cuoi cua nut "Cap nhat ngay" (23/11/2026): bo cai NSIS chay `/S --force-run` trong luc app vua tu thoat.
# Lam dung nhu app: chay bo cai tach roi -> 0,4 giay sau app dong -> do: bo cai xong sau bao lau, app co TU MO LAI khong,
# ban cai la ban nao, anh / video / du lieu nguoi dung con du khong (so tung file truoc / sau).
# Chay o terminal CUA ANH (ngoai container MSIX cua Claude), khong thi bo cai ghi vao AppData ao.
# Bo cai la ban KHACH (khong phai ban chu): chay xong phai nap lai `node scripts/cai-tai-cho.mjs --ban-chu`.
# Chay: powershell -ExecutionPolicy Bypass -File scripts\test\thu-tu-cai-that.ps1 -BoCai <duong dan .exe> -Sha <sha256>
param([Parameter(Mandatory = $true)][string]$BoCai, [Parameter(Mandatory = $true)][string]$Sha)
$ErrorActionPreference = 'Stop'
$TEN = 'AiO Shot & Save'
$CAI = Join-Path $env:LOCALAPPDATA 'Programs\aio-shot-and-save'
$UD = Join-Path $env:APPDATA 'AiO Shot & Save'
$LOG = Join-Path $UD 'run-log.txt'

if (-not (Test-Path -LiteralPath $BoCai)) { throw "Khong thay bo cai: $BoCai" }
$shaThat = (Get-FileHash -LiteralPath $BoCai -Algorithm SHA256).Hash.ToLower()
if ($shaThat -ne $Sha.ToLower()) { throw "sha256 bo cai lech: $shaThat" }
Write-Output "[1] Bo cai: $BoCai (sha256 khop)"

$thuMucAnh = $null
try { $thuMucAnh = (Get-Content -LiteralPath (Join-Path $UD 'cau-hinh.json') -Raw -Encoding UTF8 | ConvertFrom-Json).thuMucAnh } catch {}
if (-not $thuMucAnh) { $thuMucAnh = Join-Path $env:LOCALAPPDATA 'shotandsave' }

function Chup-DanhSach {
  $ds = @{}
  foreach ($goc in @($thuMucAnh, $UD)) {
    if (-not (Test-Path -LiteralPath $goc)) { continue }
    Get-ChildItem -LiteralPath $goc -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
      if ($_.Name -notmatch '^run-log' -and $_.FullName -notmatch '\\(Cache|Code Cache|GPUCache|DawnCache|DawnGraphiteCache|DawnWebGPUCache|Local Storage|Session Storage|Network|Shared Dictionary|blob_storage|Crashpad|Service Worker|IndexedDB|WebStorage|shared_proto_db|Partitions)\\') {
        $ds[$_.FullName] = $_.Length
      }
    }
  }
  return $ds
}

$truoc = Chup-DanhSach
$soDongLog = 0; if (Test-Path -LiteralPath $LOG) { $soDongLog = (Get-Content -LiteralPath $LOG -Encoding UTF8).Count }
$exeCu = Join-Path $CAI "$TEN.exe"
$asarCu = (Get-FileHash -LiteralPath (Join-Path $CAI 'resources\app.asar') -Algorithm MD5).Hash.Substring(0, 8)
$chay = @(Get-Process -Name $TEN -ErrorAction SilentlyContinue)
Write-Output "[2] Truoc: $($truoc.Count) file (anh + du lieu) · app dang chay $($chay.Count) tien trinh · app.asar $asarCu · thu muc anh $thuMucAnh"

# 3) Lam dung nhu app: chay bo cai tach roi, 0,4 giay sau app thoat
$t0 = Get-Date
$p = Start-Process -FilePath $BoCai -ArgumentList '/S', '--force-run' -PassThru
Start-Sleep -Milliseconds 400
Get-Process -Name $TEN -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Output "[3] Da chay bo cai (pid $($p.Id)) va tat app"

$p.WaitForExit(180000) | Out-Null
$tXong = ((Get-Date) - $t0).TotalSeconds
Write-Output ("[4] Bo cai xong sau {0:N1} giay, ma thoat {1}" -f $tXong, $p.ExitCode)

# 5) App co tu mo lai khong + dong boot moi trong run-log
$moLai = $null; $boot = $null
$han = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $han) {
  if (-not $moLai -and @(Get-Process -Name $TEN -ErrorAction SilentlyContinue).Count) { $moLai = ((Get-Date) - $t0).TotalSeconds }
  if (Test-Path -LiteralPath $LOG) {
    $moi = Get-Content -LiteralPath $LOG -Encoding UTF8 | Select-Object -Skip $soDongLog
    $boot = $moi | Where-Object { $_ -match 'boot v' } | Select-Object -Last 1
  }
  if ($moLai -and $boot) { break }
  Start-Sleep -Milliseconds 250
}
if ($moLai) { Write-Output ("[5] App TU MO LAI sau {0:N1} giay tinh tu luc bam" -f $moLai) } else { Write-Output '[5] App KHONG tu mo lai trong 60 giay sau khi bo cai xong' }
Write-Output ("[6] Dong boot moi: " + $(if ($boot) { $boot } else { '(khong co)' }))
$ver = (Get-Item -LiteralPath $exeCu).VersionInfo.ProductVersion
$asarMoi = (Get-FileHash -LiteralPath (Join-Path $CAI 'resources\app.asar') -Algorithm MD5).Hash.Substring(0, 8)
Write-Output "[7] Ban cai: ProductVersion $ver · app.asar $asarCu -> $asarMoi"

# 8) So du lieu nguoi dung
Start-Sleep -Seconds 3
$sau = Chup-DanhSach
$mat = @($truoc.Keys | Where-Object { -not $sau.ContainsKey($_) })
$doi = @($truoc.Keys | Where-Object { $sau.ContainsKey($_) -and $sau[$_] -ne $truoc[$_] })
$anhTruoc = @($truoc.Keys | Where-Object { $_ -like "$thuMucAnh*" }).Count
$anhSau = @($sau.Keys | Where-Object { $_ -like "$thuMucAnh*" }).Count
Write-Output "[8] Thu muc anh: $anhTruoc -> $anhSau file · tong du lieu: $($truoc.Count) -> $($sau.Count) · MAT $($mat.Count) · DOI CO $($doi.Count)"
$mat | Select-Object -First 20 | ForEach-Object { Write-Output "    mat: $_" }
$doi | Select-Object -First 20 | ForEach-Object { Write-Output "    doi: $_ ($($truoc[$_]) -> $($sau[$_]) byte)" }
