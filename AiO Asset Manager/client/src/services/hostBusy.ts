/**
 * hostBusy.ts — [OPTIMIZE B3] "Hàng đợi phải biết Premiere đang làm gì".
 *
 * Cách nhận biết, không cần API riêng nào của CEP: hỏi vị trí playhead qua
 * ExtendScript hai lần cách nhau ~1.5 giây. Vị trí ĐỔI nghĩa là timeline đang
 * chạy (phát, tua, hoặc render) — lúc đó nhường hẳn máy cho Premiere, vì đây
 * đúng là khoảnh khắc người dùng nhạy cảm nhất với giật hình.
 *
 * CỐ Ý KHÔNG LÀM nửa còn lại của B3 ("tạm dừng khi panel không phải panel đang
 * hiện"). Nghe hợp lý nhưng thực tế phản tác dụng: thư viện của dự án có 7.000+
 * asset chờ render, người dùng hay bật render rồi chuyển sang việc khác. Dừng
 * theo tầm nhìn sẽ thành "để cả buổi mà chẳng render được gì" — hại đúng thứ
 * quan trọng hơn, trong khi Premiere giật hay không thì nằm ở lúc PHÁT, và
 * việc đó đã bắt được bằng playhead ở trên.
 */
import { playerPosition } from '../lib/cep'

const POLL_MS = 1500
/** Phát xong vẫn nhường thêm một nhịp, tránh bật/tắt liên tục. */
const BUSY_TAIL_MS = 2500

let lastPos = ''
let lastPollAt = 0
let busyUntil = 0

/**
 * Có nên tạm dừng việc nền lúc này không.
 * Gọi được liên tục — bên trong đã tự giới hạn tần suất hỏi host.
 */
export async function hostIsBusy(): Promise<boolean> {
  const now = performance.now()
  if (now < busyUntil) return true
  if (now - lastPollAt < POLL_MS) return false
  lastPollAt = now

  const pos = await playerPosition()
  // '' = không chạy trong Premiere, hoặc chưa mở sequence nào -> không bận.
  if (!pos) {
    lastPos = ''
    return false
  }

  const moved = lastPos !== '' && pos !== lastPos
  lastPos = pos
  if (moved) {
    busyUntil = now + BUSY_TAIL_MS
    return true
  }
  return false
}

/** Chờ tới khi host rảnh. `stopped()` cho phép huỷ giữa chừng. */
export async function waitWhileHostBusy(stopped: () => boolean): Promise<void> {
  while (!stopped() && (await hostIsBusy())) {
    await new Promise((r) => setTimeout(r, 800))
  }
}
