/**
 * timelineImport.ts — lấy file từ TIMELINE Premiere vào panel.
 *
 * GIỚI HẠN CỦA PREMIERE (phải biết trước khi đọc file này):
 * Premiere KHÔNG có API cho phép kéo một clip từ timeline/project panel rồi thả
 * vào panel CEP. Không có cách nào làm được cảm giác kéo-thả đúng nghĩa theo
 * chiều đó — mọi panel thương mại cũng vậy.
 *
 * Cách chạy được, và là cách file này làm:
 *   1. Người dùng chọn clip trên timeline (chọn bao nhiêu cũng được).
 *   2. Bấm một nút trong panel.
 *   3. Panel gọi `ppro_getSelectedClipPaths()` để lấy ĐƯỜNG DẪN FILE THẬT.
 *
 * Chiều còn lại — kéo file từ Windows Explorer vào panel — thì chạy bình thường
 * bằng HTML5 drop (xem `filesFromDropEvent`).
 */
import { evalScript, isInHost } from '../lib/cep'
import { dich } from '../ngonngu'

/** Kết quả lấy đường dẫn từ host. */
export interface TimelinePathsResult {
  ok: boolean
  paths: string[]
  message: string
}

/**
 * Đường dẫn file gốc của các clip đang chọn trên timeline.
 * Clip không có file trên đĩa (title, color matte, adjustment layer, nested
 * sequence) bị bỏ qua ở phía ExtendScript.
 */
export async function getSelectedTimelineClipPaths(): Promise<TimelinePathsResult> {
  if (!isInHost()) {
    return {
      ok: false,
      paths: [],
      message: dich('Chức năng này chỉ chạy khi panel mở trong Premiere.'),
    }
  }

  const raw = await evalScript('ppro_getSelectedClipPaths()')

  if (!raw) {
    return { ok: false, paths: [], message: dich('Không có phản hồi từ Premiere.') }
  }
  if (raw.indexOf('ERR:') === 0) {
    return { ok: false, paths: [], message: raw.slice(4) }
  }
  if (raw.indexOf('OK:') !== 0) {
    return { ok: false, paths: [], message: raw }
  }

  const body = raw.slice(3)
  const paths = body ? body.split('|').filter((p) => p.trim() !== '') : []

  if (paths.length === 0) {
    return {
      ok: false,
      paths: [],
      message: dich('Chưa chọn clip nào trên timeline (hoặc clip không có file gốc).'),
    }
  }

  return { ok: true, paths, message: `Đã đọc ${paths.length} file từ timeline` }
}

/**
 * Đường dẫn thật của các file được kéo-thả từ Windows Explorer vào panel.
 *
 * Trong CEP (Chromium), object File của một file kéo từ hệ điều hành có thuộc
 * tính `path` — trình duyệt thường KHÔNG có. Vì vậy hàm này chỉ trả về dữ liệu
 * khi panel chạy trong Premiere; mở bằng trình duyệt sẽ ra danh sách rỗng.
 */
export function filesFromDropEvent(e: DragEvent): string[] {
  const list = e.dataTransfer?.files
  if (!list || list.length === 0) return []

  const out: string[] = []
  for (let i = 0; i < list.length; i++) {
    const p = (list[i] as File & { path?: string }).path
    if (p) out.push(p)
  }
  return out
}
