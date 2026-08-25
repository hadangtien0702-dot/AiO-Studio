# Cai/go LOI TAT cho AiO Shot & Save tren may hien tai.
# KHONG dong goi .exe - app van chay thang tu ma nguon (sua code la doi ngay),
# dung de vua dung vua test. Anh Tien chot 25/08: "cai de vua su dung vua test,
# khong dong goi exe nhe".
#
#   powershell -File scripts\cai-loi-tat.ps1        # cai
#   powershell -File scripts\cai-loi-tat.ps1 -Go    # go ra
param([switch]$Go)

$ErrorActionPreference = 'Stop'
$duAn = Split-Path -Parent $PSScriptRoot
$exe  = Join-Path $duAn 'node_modules\electron\dist\electron.exe'
$ico  = Join-Path $duAn 'assets\app.ico'
$ten  = 'AiO Shot & Save.lnk'

$dich = @(
  (Join-Path ([Environment]::GetFolderPath('Desktop')) $ten),
  (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\$ten")
)

if ($Go) {
  foreach ($d in $dich) {
    if (Test-Path -LiteralPath $d) { Remove-Item -LiteralPath $d -Force; Write-Output "GO : $d" }
    else { Write-Output "bo qua (khong co): $d" }
  }
  Write-Output ''
  Write-Output 'Da go loi tat. Ma nguon + anh da chup KHONG bi dung toi.'
  return
}

# ☠️ node_modules bi gitignore -> may moi keo code ve la thieu Electron.
if (-not (Test-Path -LiteralPath $exe)) {
  throw "Chua co Electron. Chay `npm install` trong '$duAn' truoc da."
}

# Icon: logo goc 387x353 KHONG vuong. Ep thang vao shortcut la MEO
# (dung loi da sua cho tray 24/08) -> ve len khung vuong 256, can giua.
if (-not (Test-Path -LiteralPath $ico)) {
  Add-Type -AssemblyName System.Drawing
  $png = Join-Path $duAn 'assets\tray.png'
  $src = [System.Drawing.Image]::FromFile($png)
  $W = 256
  $h = [int][Math]::Round($src.Height * $W / $src.Width)
  $bmp = New-Object System.Drawing.Bitmap($W, $W, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($src, 0, [int](($W - $h) / 2), $W, $h)
  $g.Dispose(); $src.Dispose()
  $tmp = Join-Path $env:TEMP 'aio-icon-256.png'
  $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()

  # ICO boc PNG (Vista+ doc duoc): header 6 byte + entry 16 byte + PNG.
  $b  = [IO.File]::ReadAllBytes($tmp)
  $ms = New-Object IO.MemoryStream
  $bw = New-Object IO.BinaryWriter($ms)
  $bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)
  $bw.Write([byte]0); $bw.Write([byte]0)      # 0 = 256 px
  $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([uint16]1); $bw.Write([uint16]32)
  $bw.Write([uint32]$b.Length); $bw.Write([uint32]22)
  $bw.Write($b); $bw.Flush()
  [IO.File]::WriteAllBytes($ico, $ms.ToArray())
  $bw.Dispose(); $ms.Dispose()
  Write-Output "TAO icon: assets\app.ico"
}

$ws = New-Object -ComObject WScript.Shell
foreach ($d in $dich) {
  $sc = $ws.CreateShortcut($d)
  $sc.TargetPath       = $exe
  $sc.Arguments        = '.'
  $sc.WorkingDirectory = $duAn
  $sc.IconLocation     = "$ico,0"
  $sc.Description      = 'AiO Shot & Save - chup vung chon + ghim sticky'
  $sc.Save()
  Write-Output "CAI: $d"
}

Write-Output ''
Write-Output 'Xong. Ctrl+Shift+S de chup, hoac bam trai icon AiO duoi khay he thong.'
Write-Output 'App da chay roi thi bam loi tat lan nua = CHUP NGAY (co khoa mot ban chay).'
