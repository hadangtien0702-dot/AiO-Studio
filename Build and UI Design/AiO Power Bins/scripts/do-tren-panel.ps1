# =============================================================================
#  do-tren-panel.ps1 - Chay JavaScript THANG TREN PANEL dang mo trong Premiere.
# =============================================================================
#  Dung de KIEM CHUNG BANG SO thay vi doan: dem phan tu DOM, doc style da tinh,
#  mo phong thao tac cua nguoi dung roi do lai.
#
#  Dieu kien: dang cai ban DEV (co file .debug mo cong 8088). Ban PHAT HANH
#  khong kem .debug -> khong do duoc; cai lai ban dev bang scripts\sign-install.ps1
#
#  Vi du:
#    .\scripts\do-tren-panel.ps1 -Expression "document.querySelectorAll('.card-asset').length"
#    .\scripts\do-tren-panel.ps1 -Expression "JSON.stringify({cao: document.querySelector('.grid-scroll').scrollHeight})"
#
#  BA CHO DA TRA GIA (dung sua lai kieu cu):
#   - `.Wait()` tren `CloseAsync` hay nem loi -> cu `Dispose()`, du lieu nhan xong roi.
#   - Dung `[ArraySegment[byte]]::new($bytes)`, KHONG dung `New-Object ArraySegment[byte]`.
#   - Doi `className` roi doc `getComputedStyle` NGAY trong cung mot nhip JS thi ra
#     GIA TRI CU. Muon so sanh hai trang thai: tao HAI THE RIENG, cho qua 2 nhip
#     `requestAnimationFrame` roi moi doc.
# =============================================================================
param([Parameter(Mandatory=$true)][string]$Expression)

$ErrorActionPreference = 'Stop'

$targets = Invoke-RestMethod -Uri 'http://localhost:8088/json' -TimeoutSec 5
$page = $targets | Where-Object { $_.webSocketDebuggerUrl } | Select-Object -First 1
if (-not $page) { Write-Output 'KHONG tim thay trang de gan vao'; exit 1 }

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$ct = [Threading.CancellationToken]::None
Write-Output ('Dang gan vao: ' + $page.webSocketDebuggerUrl)
try {
  $ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, $ct).Wait(10000) | Out-Null
} catch {
  $e = $_.Exception
  while ($e.InnerException) { $e = $e.InnerException }
  Write-Output ('KHONG GAN DUOC: ' + $e.GetType().Name + ' -> ' + $e.Message)
  exit 1
}

$payload = @{
  id     = 1
  method = 'Runtime.evaluate'
  params = @{
    expression    = $Expression
    returnByValue = $true
    awaitPromise  = $true
  }
} | ConvertTo-Json -Depth 8 -Compress

try {
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $seg = [ArraySegment[byte]]::new($bytes)
  $ws.SendAsync($seg, [Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait(10000) | Out-Null

  $sb = New-Object Text.StringBuilder
  $buf = New-Object byte[] 131072
  do {
    $rseg = [ArraySegment[byte]]::new($buf)
    $task = $ws.ReceiveAsync($rseg, $ct)
    $task.Wait(15000) | Out-Null
    $res = $task.Result
    [void]$sb.Append([Text.Encoding]::UTF8.GetString($buf, 0, $res.Count))
  } while (-not $res.EndOfMessage)
} catch {
  $e = $_.Exception
  while ($e.InnerException) { $e = $e.InnerException }
  Write-Output ('LOI TRUYEN TIN: ' + $e.GetType().Name + ' -> ' + $e.Message)
  exit 1
}

# Dong ket noi: khong quan trong neu that bai, du lieu da nhan xong roi.
try { $ws.Dispose() } catch {}

$json = $sb.ToString() | ConvertFrom-Json
if ($json.result.exceptionDetails) {
  Write-Output ('LOI JS: ' + $json.result.exceptionDetails.exception.description)
} else {
  Write-Output $json.result.result.value
}
