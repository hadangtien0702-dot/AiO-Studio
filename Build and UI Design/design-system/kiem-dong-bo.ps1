# =============================================================================
#  kiem-dong-bo.ps1 - DO THAT tren 4 panel dang chay, so voi nguon chan ly.
# =============================================================================
#  Vi sao can: `dong-bo-tokens.ps1` chi bao dam FILE giong nhau. No KHONG bao
#  dam panel dang chay dung dung token do - CSS rieng cua tung panel van co the
#  ghi de bang so cung (`height: 44px` thay vi `var(--h-topbar)`), va do la
#  dung cai bay da vap 29/07.
#
#  File nay do THANG tren DOM cua panel dang mo trong Premiere. Build sach
#  KHONG tinh la da kiem.
#
#  Dieu kien: ca 4 panel dang MO trong Premiere, va cai ban DEV (co file .debug).
#
#  Chay:  .\design-system\kiem-dong-bo.ps1
# =============================================================================
$ErrorActionPreference = 'Continue'

$goc = Split-Path -Parent $MyInvocation.MyCommand.Path
$doTool = Join-Path (Split-Path -Parent $goc) 'AiO Transcripts\scripts\do-tren-panel.ps1'

$PANEL = @(
  @{ Ten = 'Asset Manager'; Port = 8088 },
  @{ Ten = 'Autocut';       Port = 8089 },
  @{ Ten = 'Power Bins';    Port = 8090 },
  @{ Ten = 'Transcript';    Port = 8091 }
)

# Nhung thu PHAI giong nhau o ca 4 panel.
$JS = @'
(() => {
  const t = getComputedStyle(document.documentElement);
  const v = (n) => t.getPropertyValue(n).trim() || 'THIEU';
  const r = {};
  for (const n of ['--fs-2xs','--fs-xs','--fs-sm','--fs-md','--fs-lg','--fs-xl',
                   '--h-ctrl-sm','--h-ctrl','--h-ctrl-lg','--h-topbar',
                   '--sp-1','--sp-2','--sp-3','--sp-4','--sp-5','--sp-6',
                   '--r-sm','--r-md','--r-lg',
                   '--accent','--bg-1','--bg-2','--bg-3','--text-1','--text-3',
                   '--ok','--warn','--danger','--dur']) r[n] = v(n);
  // Do THUC TE tren man hinh, khong chi doc bien - CSS rieng co the ghi de.
  const tb = document.querySelector('.topbar');
  r['@topbar-cao'] = tb ? Math.round(tb.getBoundingClientRect().height) + 'px' : 'khong co';
  r['@topbar-nen'] = tb ? getComputedStyle(tb).backgroundColor : '-';
  const nut = [...document.querySelectorAll('button')]
    .filter(b => b.getBoundingClientRect().height > 0);
  r['@nut-in-hoa'] = String(nut.filter(b => getComputedStyle(b).textTransform === 'uppercase').length);
  // NGOAI LE co chu y (24/08/2026): nut doi ngon ngu `.aio-ngonngu` ("VI"/"EN")
  // gian chu 0,44px — ma 2 ky tu IN HOA gian nhe la typography chuan, va DA
  // dong deu ca 3 panel (do that: cung 0.44px o 8088/8089/8091). Thuoc nay do
  // su DONG BO, khong phai do gu — thu gi deu nhau va co chu y thi bo qua.
  r['@nut-gian-chu'] = String(nut.filter(b => !b.classList.contains('aio-ngonngu') && getComputedStyle(b).letterSpacing !== 'normal').length);
  return JSON.stringify(r);
})()
'@

$ketQua = @{}
$song = @()
foreach ($p in $PANEL) {
  try {
    $raw = & $doTool -Expression $JS -Port $p.Port 2>$null
    $ketQua[$p.Ten] = $raw | ConvertFrom-Json
    $song += $p.Ten
  } catch {
    Write-Output "  [KHONG MO] $($p.Ten) (cong $($p.Port)) - bo qua"
  }
}

if ($song.Count -lt 2) {
  Write-Output ''
  Write-Output "Can it nhat 2 panel dang MO trong Premiere moi so duoc. Dang mo: $($song.Count)."
  exit 2
}

Write-Output ''
Write-Output "Dang so $($song.Count) panel: $($song -join ', ')"
Write-Output ''

$khoa = $ketQua[$song[0]].PSObject.Properties.Name
$lech = 0
foreach ($k in $khoa) {
  $giaTri = @{}
  foreach ($t in $song) { $giaTri[$t] = $ketQua[$t].$k }
  $duyNhat = $giaTri.Values | Select-Object -Unique
  if ($duyNhat.Count -gt 1) {
    $lech++
    Write-Output "  [LECH] $k"
    foreach ($t in $song) { Write-Output ("           {0,-15} {1}" -f $t, $giaTri[$t]) }
  }
}

# Hai luat rieng, khong phai so sanh chuoi
foreach ($t in $song) {
  if ($ketQua[$t].'@nut-in-hoa' -ne '0') {
    $lech++
    Write-Output "  [LECH] $t co $($ketQua[$t].'@nut-in-hoa') nut IN HOA - bo nut nao cung khong viet hoa"
  }
  if ($ketQua[$t].'@nut-gian-chu' -ne '0') {
    $lech++
    Write-Output "  [LECH] $t co $($ketQua[$t].'@nut-gian-chu') nut GIAN CHU - khong dung letter-spacing cho nut"
  }
}

Write-Output ''
if ($lech -eq 0) {
  Write-Output "DAT: $($song.Count) panel dong bo hoan toan."
} else {
  Write-Output "$lech cho LECH. Sua tokens.css roi chay dong-bo-tokens.ps1, hoac sua CSS rieng cua panel."
  exit 1
}
