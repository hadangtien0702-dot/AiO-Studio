# Thu ca chuoi tai ban moi bang MA THAT (23/11/2026): cong aio-mail -> link Polar -> tai bo cai ve thu muc tam -> so sha256
# voi ban-moi.json tren web (giong het viec app lam truoc khi cai). Ma nhap AN (khong hien tren man, khong luu, khong in ra).
# Chay: powershell -ExecutionPolicy Bypass -File scripts\test\thu-cong-tai.ps1
$ErrorActionPreference = 'Stop'
$an = Read-Host 'Dan ma ban quyen (se khong hien chu)' -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($an)).Trim()
$web = Invoke-RestMethod -Uri ('https://aio-shotsave.vercel.app/ban-moi.json?v=' + [DateTime]::Now.Ticks)
Write-Output "[1] Web bao ban moi: $($web.phienBan) · sha256Win $($web.sha256Win.Substring(0, 8))"
$r = Invoke-RestMethod -Method Post -Uri 'https://aio-mail.vercel.app/api/tai-ban-moi' -ContentType 'application/json' -Body (@{ key = $key } | ConvertTo-Json)
Write-Output "[2] Cong tra: $($r.ten) · $($r.kichThuoc) byte · sha256 $($r.sha256.Substring(0, 8))"
$f = Join-Path $env:TEMP ('aio-thu-' + $r.ten)
$t0 = Get-Date
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri $r.url -OutFile $f -UseBasicParsing
$giay = ((Get-Date) - $t0).TotalSeconds
$sha = (Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLower()
$co = (Get-Item -LiteralPath $f).Length
Remove-Item -LiteralPath $f -Force
Write-Output ("[3] Tai ve {0} byte trong {1:N1} giay · sha256 {2}" -f $co, $giay, $sha.Substring(0, 8))
$dung = ($sha -eq $web.sha256Win) -and ($sha -eq $r.sha256.ToLower()) -and ($r.ten -like "*$($web.phienBan)*")
Write-Output $(if ($dung) { '[4] DAT: file tai ve = web = Polar, dung ban moi. App se cai file nay.' } else { '[4] TRUOT: file tai ve KHONG khop, app se tu choi cai.' })
