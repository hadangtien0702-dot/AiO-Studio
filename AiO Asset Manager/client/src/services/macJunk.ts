/**
 * macJunk.ts — tìm và dọn RÁC macOS nằm lẫn trong thư viện asset.
 *
 * Rác macOS là gì: giải nén một file zip do máy Mac tạo ra, trên Windows sẽ đẻ
 * thêm thư mục `__MACOSX` và các file `._<tên gốc>`. Chúng là mẩu metadata vài
 * KB (AppleDouble resource fork), KHÔNG phải file media — nhưng mang đúng đuôi
 * `.wav` / `.mp3` / `.mp4` nên bộ quét theo đuôi cho lọt hết vào thư viện.
 *
 * Hậu quả đã đo 28/07/2026 trên thư viện thật: 46 file rác nằm trong lưới, thẻ
 * treo vĩnh viễn ở "Đang tạo sóng âm…", và Premiere từ chối với
 * "Unsupported format or damaged file". Chủ dự án gặp đúng cảnh đó.
 *
 * Từ 1.3.2 `scanner.ts` đã CHẶN không cho chúng vào thư viện nữa. File này lo
 * việc còn lại: dọn chúng khỏi Ổ ĐĨA cho sạch hẳn.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ ĐÂY LÀ CHỖ DUY NHẤT TRONG PANEL ĐỤNG TỚI FILE GỐC CỦA NGƯỜI DÙNG
 * ---------------------------------------------------------------------------
 * Luật dự án (RULES.md) vốn cấm đụng file gốc — chủ dự án mở ngoại lệ ngày
 * 28/07 cho đúng loại rác này. Vì vậy hai ràng buộc BẮT BUỘC:
 *
 *   1. Chỉ nhận diện bằng ĐÚNG hai dấu hiệu: tên bắt đầu `._`, hoặc nằm trong
 *      thư mục `__MACOSX`. Không suy đoán thêm gì khác.
 *   2. Chuyển vào THÙNG RÁC WINDOWS, tuyệt đối không `unlink`. Chủ dự án chọn
 *      cách này để lỡ tay còn khôi phục được.
 */
import { getFs, getPath, nodeRequire } from '../lib/node'

export interface MacJunkResult {
  paths: string[]
  bytes: number
}

/** Tên file/thư mục này có phải rác macOS không. */
export function isMacJunkName(name: string): boolean {
  return name === '__MACOSX' || name.startsWith('._')
}

/**
 * Duyệt các thư mục thư viện, gom mọi file rác macOS.
 *
 * Chỉ đọc TÊN (`readdir`), không `stat` từng file như bộ quét asset — nên rẻ
 * hơn nhiều. `stat` chỉ gọi cho đúng những file đã xác định là rác, để cộng
 * dung lượng hiển thị.
 */
export async function findMacJunk(folders: string[]): Promise<MacJunkResult> {
  const fs = getFs()
  const path = getPath()
  const out: string[] = []
  let bytes = 0
  if (!fs || !path || !folders.length) return { paths: out, bytes }

  const stack = [...folders]
  while (stack.length) {
    const dir = stack.pop() as string
    let entries: any[]
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true })
    } catch {
      continue // thư mục không đọc được -> bỏ qua, đừng làm hỏng cả lượt quét
    }

    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        if (ent.name === '__MACOSX') {
          // Cả thư mục là rác: gom mọi file bên trong rồi thôi, không đi tiếp.
          await gomTrongThuMuc(full, out)
          continue
        }
        if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue
        stack.push(full)
      } else if (ent.isFile() && ent.name.startsWith('._')) {
        out.push(full)
      }
    }
  }

  // Cộng dung lượng — file rác rất nhỏ nên vòng này nhanh.
  await Promise.all(
    out.map(async (p) => {
      try {
        const st = await fs.promises.stat(p)
        bytes += st.size
      } catch {
        /* file vừa biến mất -> bỏ qua */
      }
    }),
  )

  return { paths: out, bytes }
}

/** Gom mọi file nằm dưới một thư mục `__MACOSX`. */
async function gomTrongThuMuc(dir: string, out: string[]): Promise<void> {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) return
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop() as string
    let entries: any[]
    try {
      entries = await fs.promises.readdir(d, { withFileTypes: true })
    } catch {
      continue
    }
    for (const ent of entries) {
      const full = path.join(d, ent.name)
      if (ent.isDirectory()) stack.push(full)
      else if (ent.isFile()) out.push(full)
    }
  }
}

/**
 * Chuyển danh sách file vào THÙNG RÁC WINDOWS.
 *
 * Node không có sẵn API thùng rác, nên mượn .NET qua PowerShell:
 * `Microsoft.VisualBasic.FileIO.FileSystem.DeleteFile(..., SendToRecycleBin)`.
 *
 * Đường dẫn được ghi ra một FILE TẠM (UTF-8) rồi PowerShell đọc lại, thay vì
 * nhét thẳng vào dòng lệnh: thư viện của chủ dự án có tên tiếng Việt có dấu,
 * dấu cách, dấu ngoặc — nhét vào dòng lệnh là hỏng ở đúng những file đó.
 */
export async function moveToRecycleBin(
  paths: string[],
): Promise<{ moved: number; failed: number }> {
  const fs = getFs()
  const path = getPath()
  const req = nodeRequire()
  if (!fs || !path || !req || !paths.length) return { moved: 0, failed: 0 }

  const os = req('os')
  const cp = req('child_process')
  const stamp = Math.random().toString(36).slice(2, 10)
  const listFile = path.join(os.tmpdir(), `aio-mac-junk-${stamp}.txt`)

  await fs.promises.writeFile(listFile, paths.join('\r\n'), 'utf8')

  //  -Encoding UTF8 để đọc đúng tên file tiếng Việt.
  //  Bọc từng file trong try/catch để một file khoá không chặn cả mẻ.
  const ps = [
    'Add-Type -AssemblyName Microsoft.VisualBasic;',
    `$ds = Get-Content -LiteralPath '${listFile.replace(/'/g, "''")}' -Encoding UTF8;`,
    '$ok = 0;',
    'foreach ($d in $ds) {',
    '  if (-not $d) { continue }',
    '  try {',
    '    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(',
    '      $d,',
    '      [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,',
    '      [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)',
    '    $ok++',
    '  } catch { }',
    '}',
    'Write-Output $ok',
  ].join(' ')

  const moved = await new Promise<number>((resolve) => {
    cp.execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (_err: any, stdout: string) => {
        const n = parseInt(String(stdout).trim(), 10)
        resolve(isNaN(n) ? 0 : n)
      },
    )
  })

  try {
    await fs.promises.unlink(listFile)
  } catch {
    /* file tạm để lại cũng không sao */
  }

  return { moved, failed: paths.length - moved }
}
