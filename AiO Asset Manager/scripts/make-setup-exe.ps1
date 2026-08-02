# =============================================================================
#  make-setup-exe.ps1 - Gop ca bo cai thanh MOT file .exe bam dup la chay.
# =============================================================================
#  Vi sao can: ban SETUP.zip bat nguoi nhan phai giai nen roi tim dung file
#  CAI-DAT.bat de bam. Dem qua may khac cho nguoi khac cai thi moi buoc thua la
#  mot cho de sai. File .exe nay tu giai nen ra thu muc tam roi tu chay cai-dat.
#
#  ---------------------------------------------------------------------------
#  DA THU IEXPRESS VA BO - dung lam lai (28/07/2026)
#  ---------------------------------------------------------------------------
#  `iexpress.exe` co san tren Windows va dung de lam viec nay, NHUNG:
#    - Goi bang /N /Q van tra ve ma loi 1, ke ca voi goi toi gian nhat.
#    - Moi lan sai cu phap no BUNG HOP THOAI "Command syntax is incorrect!"
#      de len man hinh nguoi dung - khong chap nhan duoc trong script tu dong.
#  => Dung `csc.exe` (trinh bien dich C# di kem .NET Framework, CO SAN o
#     %WINDIR%\Microsoft.NET\Framework64\v4.0.30319\). Tao ra .exe that, khong
#     popup, kiem soat duoc hoan toan.
#
#  ---------------------------------------------------------------------------
#  File .exe tao ra hoat dong the nao
#  ---------------------------------------------------------------------------
#    1. Nhung san mot file zip (chua .zxp + cai-dat.ps1 + CAI-DAT.bat + huong dan)
#       lam tai nguyen ben trong .exe.
#    2. Chay: giai nen ra %TEMP%\AiOStudioSetup_xxxx roi goi chinh cai-dat.ps1
#       da co san - KHONG viet lai logic cai dat o day, de mot cho duy nhat lo
#       viec cai (chep de tung file, bat PlayerDebugMode, bao file bi khoa).
#    3. Cai xong thi tu don thu muc tam.
#
#  Khong ky duoc, nen Windows SmartScreen se hien bang xanh o may la - huong dan
#  bam 'More info' -> 'Run anyway' da ghi trong HUONG-DAN-CAI-DAT.txt.
# =============================================================================
param(
  [Parameter(Mandatory = $true)][string]$ReleaseDir,
  [Parameter(Mandatory = $true)][string]$OutExe,
  [Parameter(Mandatory = $true)][string]$Version
)

$ErrorActionPreference = 'Stop'

$csc = @(
  "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
  "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $csc) {
  Write-Host "  [BO QUA] Khong co csc.exe - chi tao duoc ban .zip." -ForegroundColor Yellow
  exit 0
}

$zxp = Get-ChildItem $ReleaseDir -Filter '*.zxp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zxp) { throw "Khong thay file .zxp trong $ReleaseDir" }

# Thu muc lam viec KHONG DAU CACH (duong dan du an co dau cach, csc va cac cong
# cu dong lenh rat de gay).
$work = Join-Path $env:TEMP ('aioexe_' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
$payloadDir = Join-Path $work 'payload'
New-Item -ItemType Directory -Path $payloadDir -Force | Out-Null

try {
  # --- 1. Gom nhung thu can cai vao mot zip ---
  Copy-Item $zxp.FullName $payloadDir -Force
  Copy-Item (Join-Path $ReleaseDir 'cai-dat.ps1') $payloadDir -Force
  Copy-Item (Join-Path $ReleaseDir 'CAI-DAT.bat') $payloadDir -Force
  $guide = Join-Path $ReleaseDir 'HUONG-DAN-CAI-DAT.txt'
  if (Test-Path $guide) { Copy-Item $guide $payloadDir -Force }

  $payloadZip = Join-Path $work 'payload.zip'
  Compress-Archive -Path (Join-Path $payloadDir '*') -DestinationPath $payloadZip -CompressionLevel Optimal

  # --- 2. Chuong trinh .exe ---
  #  Console app de nguoi dung NHIN THAY tien trinh cai va thong bao loi (vd
  #  Premiere dang mo lam file bi khoa). Cua so tat ngay se giau mat loi.
  $cs = @'
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;

static class Setup
{
    static int Main()
    {
        Console.Title = "AiO Studio - Asset Manager : Cai dat";
        string tmp = Path.Combine(Path.GetTempPath(),
            "AiOStudioSetup_" + Guid.NewGuid().ToString("N").Substring(0, 8));

        try
        {
            Directory.CreateDirectory(tmp);

            string zipPath = Path.Combine(tmp, "payload.zip");
            Assembly asm = Assembly.GetExecutingAssembly();
            using (Stream src = asm.GetManifestResourceStream("payload.zip"))
            {
                if (src == null)
                {
                    Console.WriteLine("Loi: goi cai dat bi hong (thieu du lieu ben trong).");
                    Pause();
                    return 1;
                }
                using (FileStream fs = File.Create(zipPath)) src.CopyTo(fs);
            }

            ZipFile.ExtractToDirectory(zipPath, tmp);
            File.Delete(zipPath);

            // Goi dung script cai dat da co san - khong viet lai logic o day.
            string ps1 = Path.Combine(tmp, "cai-dat.ps1");
            ProcessStartInfo psi = new ProcessStartInfo("powershell.exe",
                "-NoProfile -ExecutionPolicy Bypass -File \"" + ps1 + "\"");
            psi.UseShellExecute = false;
            using (Process p = Process.Start(psi))
            {
                p.WaitForExit();
                Pause();
                return p.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine("CAI THAT BAI: " + ex.Message);
            Pause();
            return 1;
        }
        finally
        {
            try { Directory.Delete(tmp, true); } catch { }
        }
    }

    static void Pause()
    {
        Console.WriteLine();
        Console.WriteLine("Bam phim bat ky de dong...");
        try { Console.ReadKey(true); } catch { }
    }
}
'@
  $csFile = Join-Path $work 'Setup.cs'
  $cs | Out-File -FilePath $csFile -Encoding utf8

  # --- 3. Bien dich ---
  $tmpExe = Join-Path $work 'setup.exe'
  Write-Host "  Dang gop thanh mot file .exe..." -ForegroundColor Cyan

  $cscArgs = @(
    '/nologo'
    '/target:exe'
    '/platform:anycpu'
    '/optimize+'
    ('/out:' + $tmpExe)
    ('/resource:' + $payloadZip + ',payload.zip')
    '/reference:System.IO.Compression.dll'
    '/reference:System.IO.Compression.FileSystem.dll'
    $csFile
  )
  $out = & $csc $cscArgs 2>&1
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tmpExe)) {
    $out | ForEach-Object { Write-Host ("    " + $_) -ForegroundColor Red }
    throw ("csc.exe tra ve ma loi " + $LASTEXITCODE)
  }

  Copy-Item $tmpExe $OutExe -Force
  $mb = [math]::Round((Get-Item $OutExe).Length / 1MB, 1)
  Write-Host ("  [OK] Da tao: " + $OutExe + "  (" + $mb + " MB)") -ForegroundColor Green
}
finally {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}
