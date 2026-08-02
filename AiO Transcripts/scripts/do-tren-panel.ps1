# =============================================================================
#  do-tren-panel.ps1 - Chay JavaScript THANG TREN PANEL Autocut dang mo trong Premiere.
# =============================================================================
#  Dung de KIEM CHUNG BANG SO thay vi doan: doc DOM, goi evalScript sang host,
#  lay duong dan media that cua du an dang mo.
#
#  Dieu kien: dang cai ban DEV (co file .debug mo cong 8089 cho Autocut).
#  AiO Editing dung 8088 - hai panel khong duoc trung.
#
#  Vi du:
#    .\scripts\do-tren-panel.ps1 -Expression "document.querySelector('h1').textContent"
#    .\scripts\do-tren-panel.ps1 -Expression "new Promise(r=>new CSInterface().evalScript('ac_getRangeClips()',r))"
#
#  BA CHO DA TRA GIA (dung sua lai kieu cu):
#   - `.Wait()` tren `CloseAsync` hay nem loi -> cu `Dispose()`, du lieu nhan xong roi.
#   - Dung `[ArraySegment[byte]]::new($bytes)`, KHONG dung `New-Object ArraySegment[byte]`.
#   - Doi `className` roi doc `getComputedStyle` NGAY trong cung mot nhip JS thi ra
#     GIA TRI CU. Muon so sanh hai trang thai: tao HAI THE RIENG, cho qua 2 nhip
#     `requestAnimationFrame` roi moi doc.
# =============================================================================
param(
  [Parameter(Mandatory=$true)][string]$Expression,
  [int]$Port = 8089,
  [int]$TimeoutMs = 60000
)

$ErrorActionPreference = 'Stop'

$targets = Invoke-RestMethod -Uri ("http://127.0.0.1:{0}/json" -f $Port) -TimeoutSec 5
$page = $targets | Where-Object { $_.webSocketDebuggerUrl } | Select-Object -First 1
if (-not $page) { Write-Output 'KHONG tim thay trang de gan vao'; exit 1 }

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$ct = [Threading.CancellationToken]::None
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
  $buf = New-Object byte[] 262144
  do {
    $rseg = [ArraySegment[byte]]::new($buf)
    $task = $ws.ReceiveAsync($rseg, $ct)
    $task.Wait($TimeoutMs) | Out-Null
    $res = $task.Result
    [void]$sb.Append([Text.Encoding]::UTF8.GetString($buf, 0, $res.Count))
  } while (-not $res.EndOfMessage)
} catch {
  $e = $_.Exception
  while ($e.InnerException) { $e = $e.InnerException }
  Write-Output ('LOI TRUYEN TIN: ' + $e.GetType().Name + ' -> ' + $e.Message)
  exit 1
}

try { $ws.Dispose() } catch {}

$json = $sb.ToString() | ConvertFrom-Json
if ($json.result.exceptionDetails) {
  Write-Output ('LOI JS: ' + $json.result.exceptionDetails.exception.description)
} else {
  Write-Output $json.result.result.value
}
