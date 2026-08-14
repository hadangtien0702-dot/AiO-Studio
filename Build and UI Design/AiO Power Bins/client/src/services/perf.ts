/**
 * perf.ts — đo hiệu năng THẬT của panel, xem trong Cài đặt.
 *
 * Con số quan trọng nhất của sản phẩm: RÊ CHUỘT -> FRAME ĐẦU HIỆN RA (ms).
 * Không có số này thì mọi lần "tối ưu" đều là cảm nhận, không phải bằng chứng
 * (bài học cũ: sửa mãi không biết có khác gì không).
 */

interface Sample {
  ms: number
  at: number
}

const MAX_SAMPLES = 100

/** Thời điểm bắt đầu hover từng asset (đợi frame đầu). */
const hoverStart = new Map<string, number>()

/** Các mẫu hover→frame gần nhất. */
const samples: Sample[] = []

/** Gọi khi người dùng rê chuột vào thẻ video (sau độ trễ hover). */
export function markHoverStart(id: string): void {
  hoverStart.set(id, performance.now())
}

/** Gọi khi video render được frame đầu (onLoadedData). */
export function markFirstFrame(id: string): void {
  const t0 = hoverStart.get(id)
  if (t0 === undefined) return
  hoverStart.delete(id)
  samples.push({ ms: performance.now() - t0, at: Date.now() })
  if (samples.length > MAX_SAMPLES) samples.shift()
}

/** Gọi khi rời thẻ trước lúc frame kịp hiện — huỷ phép đo dở. */
export function cancelHoverMark(id: string): void {
  hoverStart.delete(id)
}

export interface PerfStats {
  /** Số mẫu hover→frame thu được. */
  count: number
  /** Trung bình (ms). */
  avg: number
  /** Trung vị (ms). */
  median: number
  /** Chậm nhất (ms). */
  max: number
  /** Lần gần nhất (ms). */
  last: number
  /** Số phần tử <video> đang tồn tại trong DOM ngay lúc đọc. */
  videoElements: number
}

/** Ảnh chụp số liệu hiện tại (đọc lúc mở Cài đặt). */
export function perfStats(): PerfStats {
  const ms = samples.map((s) => s.ms).sort((a, b) => a - b)
  const sum = ms.reduce((a, b) => a + b, 0)
  return {
    count: ms.length,
    avg: ms.length ? Math.round(sum / ms.length) : 0,
    median: ms.length ? Math.round(ms[Math.floor(ms.length / 2)]) : 0,
    max: ms.length ? Math.round(ms[ms.length - 1]) : 0,
    last: samples.length ? Math.round(samples[samples.length - 1].ms) : 0,
    videoElements: document.querySelectorAll('video').length,
  }
}
