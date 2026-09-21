/**
 * silencelog.ts — đọc kết quả `silencedetect` từ log của FFmpeg.
 *
 * Tách riêng khỏi `ffmpeg.ts` vì đây là hàm THUẦN: vào một chuỗi, ra một danh
 * sách. Không đụng Node, không đụng CEP — nên chạy thử được ngoài Premiere,
 * và đó là cách duy nhất để tự kiểm chứng phần này bằng số đo.
 */

/** Một khoảng lặng đo được trên FILE GỐC, tính bằng giây. */
export interface Silence {
  start: number
  end: number
}

/**
 * Tách khoảng lặng từ stderr của FFmpeg.
 *
 * Dạng dòng:
 *   [silencedetect @ 0x...] silence_start: 12.345
 *   [silencedetect @ 0x...] silence_end: 15.678 | silence_duration: 3.333
 *
 * Bẫy: nếu file KẾT THÚC trong lúc đang lặng thì có `silence_start` mà không có
 * `silence_end` đi kèm — phải tự đóng lại bằng thời lượng file, nếu không mất
 * hẳn khoảng lặng cuối (thường là khoảng dài nhất, lúc người quay với tay tắt máy).
 */
export function parseSilenceLog(stderr: string, mediaDuration?: number): Silence[] {
  const out: Silence[] = []
  let open: number | null = null

  for (const line of stderr.split(/\r?\n/)) {
    const s = /silence_start:\s*(-?[\d.]+)/.exec(line)
    if (s) {
      open = parseFloat(s[1])
      continue
    }
    const e = /silence_end:\s*(-?[\d.]+)/.exec(line)
    if (e && open !== null) {
      const end = parseFloat(e[1])
      if (end > open) out.push({ start: open, end })
      open = null
    }
  }

  if (open !== null && typeof mediaDuration === 'number' && mediaDuration > open) {
    out.push({ start: open, end: mediaDuration })
  }
  return out
}

/** Thời lượng media đọc từ dòng `Duration:` của FFmpeg (giây, -1 nếu không có). */
export function parseDuration(stderr: string): number {
  const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(stderr)
  if (!m) return -1
  return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3])
}

/**
 * Tốc độ khung hình của FILE GỐC, đọc từ dòng `Stream #...: Video: ... 25 fps`.
 * Trả -1 nếu không đọc được (file chỉ có tiếng chẳng hạn).
 *
 * Vì sao cần: sequence do Autocut dựng ra lấy thông số của CLIP GỐC, không phải
 * của sequence đang mở. Làm tròn điểm cắt theo fps của sequence (30) trong khi
 * file là 25 thì Premiere phải snap lại từng đoạn, mỗi đoạn hụt vài phần nghìn
 * giây, cộng dồn 28 đoạn thành khe hở 0,16s. Đo được 2026-07-28.
 */
export function parseVideoFps(stderr: string): number {
  const m = /Video:.*?,\s*([\d.]+)\s*fps/.exec(stderr)
  if (!m) return -1
  const f = parseFloat(m[1])
  return f > 0 ? f : -1
}
