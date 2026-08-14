# =========================================================================
#  so-hdd-ssd.ps1 - do THAT xem o dia anh huong bao nhieu toi Autocut.
#
#  Chay:  powershell -File tests\so-hdd-ssd.ps1 "E:\duong\dan\video.mov"
#
#  Buoc "tach tieng" bi DIA quyet dinh (FFmpeg phai doc het file goc), con buoc
#  "nghe hieu" bi GPU quyet dinh. Script nay tach bach hai thu do bang cach chay
#  CUNG MOT FILE tu hai o khac loai.
#
#  Vi sao khong doan: HDD tuan tu ~150-200 MB/s, SSD NVMe 1.500+ MB/s - nghe thi
#  chenh 10 lan, nhung giai ma tieng cung ton CPU nen chenh THAT it hon nhieu.
#  Do roi hay ket luan.
#
#  Luu y cu phap: PowerShell KHONG cho viet bieu thuc long trong loi goi ham
#  (`Ham $a ("x" + $b)` la loi parse) - tinh ra bien truoc roi moi truyen.
# =========================================================================
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$ODichSsd = 'C:',
  [string]$ODichHdd = 'E:'
)
$ErrorActionPreference = 'Stop'

$ff = Join-Path (Split-Path -Parent $PSScriptRoot) 'bin\win64\ffmpeg.exe'
if (-not (Test-Path $ff)) { throw "Khong thay ffmpeg: $ff" }
if (-not (Test-Path $File)) { throw "Khong thay file: $File" }

$co = (Get-Item $File).Length
$coGb = "{0:N2}" -f ($co / 1GB)
"File : $File"
"Co   : $coGb GB"
""

function DoTrich {
  param([string]$Nguon, [string]$Nhan, [long]$Bytes, [string]$Ffmpeg)
  $ra = Join-Path $env:TEMP ('aio-do-' + [Guid]::NewGuid().ToString('N') + '.wav')
  # KHONG dung `2>&1` voi file exe: PowerShell 5.1 boc moi dong stderr thanh
  # ErrorRecord (NativeCommandError) va script chet oan, du FFmpeg chay dung —
  # ma FFmpeg thi in TAT CA thong tin ra stderr. Dung Start-Process de tach han.
  $err = Join-Path $env:TEMP 'aio-do-err.txt'
  $a = @('-hide_banner', '-nostats', '-y', '-i', $Nguon, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', $ra)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $p = Start-Process -FilePath $Ffmpeg -ArgumentList $a -NoNewWindow -Wait -PassThru `
       -RedirectStandardError $err -RedirectStandardOutput "$env:TEMP\aio-do-out.txt"
  $sw.Stop()
  $s = $sw.Elapsed.TotalSeconds
  $mb = ($Bytes / 1MB) / $s
  Remove-Item $ra -Force -ErrorAction SilentlyContinue
  $dong = "{0,-24} {1,9} giay {2,9} MB/s" -f $Nhan, $s.ToString('F1'), $mb.ToString('F0')
  Write-Host $dong
  return $s
}

"{0,-24} {1,9}      {2,9}" -f 'Vi tri file', 'Thoi gian', 'Toc do doc'
"-" * 60

$oGoc = $File.Substring(0, 2)
$nhan1 = "Cho hien tai ($oGoc)"
$goc = DoTrich -Nguon $File -Nhan $nhan1 -Bytes $co -Ffmpeg $ff

# Chep sang o KHAC LOAI roi do lai
$laHdd = $oGoc -eq $ODichHdd
$dich = if ($laHdd) { $ODichSsd } else { $ODichHdd }
$thuMuc = Join-Path $dich 'aio-do-dia'
New-Item -ItemType Directory -Force -Path $thuMuc | Out-Null
$ban = Join-Path $thuMuc (Split-Path $File -Leaf)

Write-Host ""
Write-Host "(dang chep sang $dich de doi chieu - cho chut...)"
Copy-Item $File $ban -Force
$nhan2 = "Chep sang $dich"
$sau = DoTrich -Nguon $ban -Nhan $nhan2 -Bytes $co -Ffmpeg $ff

Remove-Item $ban -Force -ErrorAction SilentlyContinue
Remove-Item $thuMuc -Force -Recurse -ErrorAction SilentlyContinue

Write-Host ""
if ($sau -lt $goc) {
  $lan = "{0:N2}" -f ($goc / $sau)
  $tk = "{0:N1}" -f ($goc - $sau)
  Write-Host "=> $dich nhanh hon $lan lan (tiet kiem $tk giay)"
} else {
  Write-Host "=> Khong nhanh hon - o dia KHONG phai cho nghen cho file nay."
}

# --- DOC SO CHO DUNG: bo nho dem cua Windows se noi doi -------------------
# (File .ps1 phai ASCII THUAN. PowerShell 5.1 doc theo ANSI, mot ky tu Unicode
#  trong comment cung du lam vo chuoi va bao "string is missing the terminator".)
$ramGb = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
Write-Host ""
Write-Host "CANH BAO khi doc so tren:" -ForegroundColor Yellow
Write-Host "  May nay co $ramGb GB RAM. Windows giu file vua doc/vua chep trong bo nho dem,"
Write-Host "  nen ban CHEP SANG se doc tu RAM chu khong tu dia => nhanh GIA TAO."
Write-Host ""
Write-Host "  Cach doc so cho dung - nhin cot MB/s:"
Write-Host "     150-250 MB/s  = doc THAT tu HDD"
Write-Host "     500-3500 MB/s = doc THAT tu SSD"
Write-Host "     > 4000 MB/s   = doc tu RAM, KHONG phai so cua o dia"
Write-Host ""
Write-Host "  Muon do that chinh xac: khoi dong lai may (xoa sach bo nho dem) roi chay"
Write-Host "  DUNG MOT lan do, khong chay lan hai tren cung file."
