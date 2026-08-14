/**
 * jobQueue.ts — hàng đợi xử lý nền: metadata, thumbnail, waveform, proxy,
 * và (từ 0.10.0) bung preview nhúng của mogrt.
 *
 * [0.10.0] Ba thay đổi lớn:
 *  1. ƯU TIÊN THEO VIEWPORT: Grid báo các asset đang nhìn thấy
 *     (setQueuePriorityIds) — worker nhặt chúng TRƯỚC, hết mới chạy tuần tự.
 *     Trước đây quét 15.000 file rồi cuộn xuống cuối là phải đợi 14.900 file
 *     phía trên xong mới có thumbnail chỗ mình đang xem.
 *  2. Xử lý MOGRT: bung preview nhúng trong gói (trước đây hàng đợi bỏ qua
 *     mogrt hoàn toàn, để mặc AssetCard đọc đồng bộ lúc cuộn tới — giật).
 *  3. Nhiều worker hơn trên máy nhiều nhân: FFmpeg đã chạy ở ưu tiên IDLE
 *     (execFileAsync) nên tăng song song KHÔNG giành CPU với Premiere —
 *     tiến trình IDLE chỉ ăn nhân đang rảnh.
 */
import { getOs } from '../lib/node'
import { getFs } from '../lib/node'
import { useLibrary } from '../state/store'
import { Asset } from '../types'
import { probeMedia } from './probe'
import { generateVideoThumbnail } from './thumbnailer'
import { generateAudioWaveform } from './waveform'
import { generateVideoProxy, isHeavyVideo } from './proxy'
import { getMogrtThumb } from './mogrtThumb'
import { waitWhileHostBusy } from './hostBusy'
import { setFFmpegTurbo } from './ffmpeg'

let isQueueProcessing = false
let shouldStopQueue = false

/** Id các asset đang hiển thị trong viewport — Grid cập nhật khi cuộn. */
let priorityIds = new Set<string>()

/** Grid gọi mỗi khi danh sách thẻ nhìn thấy thay đổi. */
export function setQueuePriorityIds(ids: string[]): void {
  priorityIds = new Set(ids)
}

function getCpuInfo(
  turbo = false,
  soJob = 0,
): { limit: number; yieldMs: number; threadsPerJob: number } {
  const os = getOs()
  if (!os || typeof os.cpus !== 'function') {
    return { limit: 1, yieldMs: turbo ? 0 : 15, threadsPerJob: turbo ? 2 : 0 }
  }
  const cpus = os.cpus()
  const count = Array.isArray(cpus) ? cpus.length : 2

  /**
   * [1.2.0-dev.3] TURBO — người dùng CHỦ ĐỘNG bấm "Render hết một lần".
   *
   * Vì sao KHÔNG bung hết 32 luồng dù máy cho phép: đo ngày 28/07 thấy thư viện
   * thật nằm trên Ổ CỨNG CƠ (E: = HGST 12TB SATA), cache mới trên SSD. Nút thắt
   * là ĐẦU ĐỌC, không phải CPU. Nhiều tiến trình cùng đọc các file nằm rải rác
   * làm đầu đọc nhảy loạn — chạy 16 luồng CHẬM HƠN chạy 8. Đây là chỗ dễ tưởng
   * bở nhất của bài toán này.
   *
   * Cái thật sự tăng tốc ở turbo là BỎ HAI CÁI PHANH: không chờ Premiere rảnh
   * nữa, và không nghỉ giữa các job. Xem `startBackgroundProcessing`.
   *
   * ---------------------------------------------------------------------
   * [1.3.1] THANG THEO KHỐI LƯỢNG — "render ít dùng ít, render nhiều dùng
   * tối đa" (chủ dự án chốt 28/07).
   *
   * Sinh preview cho 30 file lẻ mà bung 8 tiến trình thì quạt rú lên vì một
   * việc vặt — người đang dựng phim thấy máy ì là mất tin vào panel. Ngược
   * lại, chạy cả thư viện mà bò từng cái thì đợi cả buổi.
   *
   * Trần CPU ~50% đạt bằng CÁCH NHÂN: số worker × `-threads` mỗi tiến trình
   * (xem `setFFmpegTurbo` trong ffmpeg.ts). Trên máy 32 luồng:
   *      2 worker × 2 =  4 luồng ≈ 12%
   *      4 worker × 2 =  8 luồng ≈ 25%
   *      6 worker × 2 = 12 luồng ≈ 37%
   *      8 worker × 2 = 16 luồng ≈ 50%   <- trần
   */
  if (turbo) {
    const threadsPerJob = 2
    if (count <= 4) return { limit: 2, yieldMs: 0, threadsPerJob: 1 }
    if (count <= 8) return { limit: 4, yieldMs: 0, threadsPerJob: 1 }
    if (soJob < 200) return { limit: 2, yieldMs: 0, threadsPerJob }
    if (soJob < 1000) return { limit: 4, yieldMs: 0, threadsPerJob }
    if (soJob < 5000) return { limit: 6, yieldMs: 0, threadsPerJob }
    return { limit: 8, yieldMs: 0, threadsPerJob }
  }

  /**
   * ☠️ 2026-08-04 — anh Tiến chốt luật chung cả bộ: CPU/RAM/GPU dùng trong
   * dải 50–70% (`design-system/tai-nguyen.js`).
   *
   * TURBO Ở TRÊN GIỮ NGUYÊN, CỐ Ý — và đây là chỗ dễ "tuân thủ luật" một
   * cách máy móc rồi làm sản phẩm CHẬM ĐI. Trần turbo hiện là 8×2 = 16/32
   * luồng = đúng SÀN 50%. Nâng lên 70% nghe thì đúng luật, nhưng đo cũ đã
   * ghi ngay trên đầu hàm này: nút thắt của việc sinh thumbnail/sóng âm là
   * ĐẦU ĐỌC Ổ CỨNG chứ không phải CPU — 16 luồng chạy CHẬM HƠN 8. Luật là
   * cái TRẦN không được vượt, không phải hạn mức bắt buộc phải tiêu hết.
   *
   * CHẾ ĐỘ NỀN thì trước nay KHÔNG ghim `-threads` (để `setPriority(pid,19)`
   * lo). Nay ghim trần thật để không bao giờ vượt 70% kể cả khi máy rảnh.
   *
   * ☠️ ĐO THẬT 04/08 — bỏ luôn câu "không ghim thì FFmpeg bung hết nhân",
   * nó SAI. Encode 4K→720p libopenh264 trên máy 32 luồng:
   *      không ghim → 10,5 luồng (32,8%) · 5,2 giây
   *      ghim 22    → 16,0 luồng (50,0%) · 3,6 giây   ← nhanh hơn 31%
   *      ghim 4     →  4,4 luồng (13,8%) · 9,0 giây
   * FFmpeg tự chọn số luồng theo codec và thường chọn THẤP. `-threads` là
   * cái TRẦN, không phải mức ép dùng. Nên ghim trần rộng không hy sinh tốc
   * độ — ghim CHẶT mới là thứ làm chậm (xem dòng 'ghim 4').
   */
  if (count <= 4) {
    // Máy yếu (≤4 nhân): 1 luồng nền, nghỉ 15ms giữa các job để nhường Premiere.
    return { limit: 1, yieldMs: 15, threadsPerJob: 1 }
  }
  if (count <= 8) {
    return { limit: 3, yieldMs: 4, threadsPerJob: nganSachLuong(count, 3) }
  }
  // Máy mạnh (>8 nhân logic, vd 5950X = 32): 6 worker song song.
  // An toàn vì mọi tiến trình FFmpeg đều chạy IDLE priority.
  return { limit: 6, yieldMs: 2, threadsPerJob: nganSachLuong(count, 6) }
}

/**
 * Chia ngân sách luồng cho N tiến trình song song sao cho N × kết quả ≤ 70%
 * số luồng máy. Cùng công thức `chiaLuong` trong `design-system/tai-nguyen.js`
 * — panel này build bằng TypeScript nên giữ bản chép, đừng sửa lệch.
 */
const TRAN_TAI_NGUYEN = 0.70 // design-system/tai-nguyen.js — TRAN

function nganSachLuong(soLuongMay: number, soTienTrinh: number): number {
  const tran = Math.max(1, Math.floor(soLuongMay * TRAN_TAI_NGUYEN))
  return Math.max(1, Math.floor(tran / Math.max(1, soTienTrinh)))
}

/** Asset này còn thiếu gì cần xử lý nền không. */
function needsWork(a: Asset): boolean {
  if (a.fileSize === 0) return true // scanner 0.10.0 không stat lúc quét nữa
  // [0.17.1] Đã thử và không tạo được thì thôi — thử lại chỉ tốn tiến trình
  // FFmpeg cho đúng file hỏng đó, và làm con số "còn thiếu" không bao giờ về 0.
  if (a.previewFailed) return false
  if (a.type === 'video') {
    return (
      !a.thumbPath ||
      a.duration === undefined ||
      (!a.proxyPath && isHeavyVideo(a.fileSize, a.width, a.height, a.codec))
    )
  }
  if (a.type === 'audio') {
    return !a.waveformPath || a.duration === undefined
  }
  if (a.type === 'mogrt') {
    // Chưa có preview nào (rời lẫn nhúng) -> bung từ trong gói.
    // Có preview dạng video mà chưa có ảnh tĩnh -> sinh thumbnail cho nó
    // (card 0.10.0 hiển thị ảnh tĩnh, chỉ mount <video> khi hover).
    if (!a.previewPath && !a.thumbPath) return true
    if (a.previewKind === 'video' && !!a.previewPath && !a.thumbPath) return true
  }
  return false
}

/**
 * Bắt đầu hàng đợi xử lý nền cho các asset còn thiếu dữ liệu dẫn xuất.
 *
 * `turbo` = người dùng chủ động bấm "Render hết một lần" và chấp nhận máy bận.
 * Mặc định `false` — đường chạy nền cũ giữ NGUYÊN hành vi, không đổi một nhịp.
 */
export async function startBackgroundProcessing(
  assets: Asset[],
  opts: { turbo?: boolean } = {}
) {
  if (isQueueProcessing) return
  isQueueProcessing = true
  shouldStopQueue = false
  const turbo = opts.turbo === true

  const pending = assets.filter(needsWork)

  if (pending.length === 0) {
    isQueueProcessing = false
    return
  }

  /**
   * [1.2.0-dev.3] Sắp job theo ĐƯỜNG DẪN để đầu đọc đi một chiều.
   *
   * Thư viện thật nằm trên ổ cứng cơ. Đọc theo thứ tự thư mục thì đầu đọc quét
   * gọn từng vùng; đọc theo thứ tự ngẫu nhiên thì mỗi file là một lần nhảy
   * (~10ms). Với 28.892 asset, riêng tiền nhảy đầu đọc đã là hàng chục phút.
   *
   * Không ảnh hưởng trải nghiệm: `takeNext()` vẫn LUÔN ưu tiên `priorityIds`
   * (các thẻ đang nhìn thấy) trước, thứ tự này chỉ quyết định phần chạy ngầm.
   *
   * Dùng so sánh chuỗi thẳng, KHÔNG `localeCompare` — bảng đối chiếu ngôn ngữ
   * chạy trên 28.892 phần tử tốn vài giây, mà ở đây chỉ cần một thứ tự ỔN ĐỊNH
   * bám theo cây thư mục, không cần đúng thứ tự chữ cái tiếng Việt.
   */
  pending.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))

  const store = useLibrary.getState()
  store.setQueueProgress({ total: pending.length, done: 0 })

  const idToIndex = new Map<string, number>()
  pending.forEach((a, i) => idToIndex.set(a.id, i))
  const taken = new Array<boolean>(pending.length).fill(false)
  let seq = 0

  /** Nhặt job kế tiếp: viewport trước, tuần tự sau. -1 = hết việc. */
  function takeNext(): number {
    for (const id of priorityIds) {
      const i = idToIndex.get(id)
      if (i !== undefined && !taken[i]) {
        taken[i] = true
        return i
      }
    }
    while (seq < pending.length && taken[seq]) seq++
    if (seq < pending.length) {
      taken[seq] = true
      return seq++
    }
    return -1
  }

  // Số worker co giãn theo KHỐI LƯỢNG việc: ít việc thì chạy nhẹ, cả thư viện
  // thì mở hết trần. `pending.length` là số job thật sau khi lọc `needsWork`.
  const { limit, yieldMs, threadsPerJob } = getCpuInfo(turbo, pending.length)
  let doneCount = 0
  // Turbo: FFmpeg thôi chạy ở ưu tiên thấp nhất (giành CPU ngang Premiere),
  // nên phải ghim `-threads` để không nuốt hết máy.
  setFFmpegTurbo(turbo, threadsPerJob)

  async function worker() {
    for (;;) {
      if (shouldStopQueue) return
      // [0.17.0 - OPTIMIZE B3] Nhường máy khi panel đang bị ẩn hoặc Premiere
      // đang phát/tua timeline. Chờ ở ĐÂY (trước khi nhận việc) nên job đang
      // dở vẫn chạy nốt, không bỏ giữa chừng.
      //
      // [1.2.0-dev.3] Turbo thì KHÔNG chờ. Đây là cái phanh nặng nhất: mỗi lần
      // playhead nhúc nhích là cả hàng đợi đứng im thêm 2,5 giây. Hợp lý cho
      // chạy ngầm, nhưng người dùng bấm "render hết một lần" là đã chấp nhận
      // máy bận — bắt họ chờ nữa thì thành vô nghĩa.
      if (!turbo) {
        await waitWhileHostBusy(() => shouldStopQueue)
        if (shouldStopQueue) return
      }
      const currentIndex = takeNext()
      if (currentIndex < 0) return
      const asset = pending[currentIndex]

      try {
        const patch: Partial<Asset> = {}

        // 0. Dung lượng file (scanner không stat lúc quét nữa — xem C1)
        if (asset.fileSize === 0) {
          const fs = getFs()
          if (fs) {
            try {
              const st = await fs.promises.stat(asset.path)
              if (st.size > 0) patch.fileSize = st.size
            } catch {
              /* file biến mất -> để 0 */
            }
          }
        }

        // 1. Probe metadata nếu chưa có (mogrt/preset/image không cần)
        if (
          asset.duration === undefined &&
          (asset.type === 'video' || asset.type === 'audio')
        ) {
          const meta = await probeMedia(asset.path, asset.type)
          if (meta.duration !== undefined) patch.duration = meta.duration
          if (meta.width !== undefined) patch.width = meta.width
          if (meta.height !== undefined) patch.height = meta.height
          if (meta.codec !== undefined) patch.codec = meta.codec
          if (meta.fps !== undefined) patch.fps = meta.fps
          if (meta.bitrate !== undefined) patch.bitrate = meta.bitrate
        }

        const width = patch.width ?? asset.width
        const height = patch.height ?? asset.height
        const codec = patch.codec ?? asset.codec
        const fileSize = patch.fileSize ?? asset.fileSize

        // 2. Video thumbnail
        if (asset.type === 'video' && !asset.thumbPath) {
          const dur = patch.duration ?? asset.duration
          const thumb = await generateVideoThumbnail(asset.id, asset.path, dur)
          if (thumb) patch.thumbPath = thumb
          else patch.previewFailed = true // FFmpeg chịu file này -> đừng thử lại
        }

        // 3. Smart Video Proxy nếu video nặng
        if (asset.type === 'video' && !asset.proxyPath) {
          const proxy = await generateVideoProxy(
            asset.id,
            asset.path,
            fileSize,
            width,
            height,
            codec
          )
          if (proxy) patch.proxyPath = proxy
        }

        // 4. Audio waveform
        if (asset.type === 'audio' && !asset.waveformPath) {
          const wf = await generateAudioWaveform(asset.id, asset.path)
          if (wf) patch.waveformPath = wf
          else patch.previewFailed = true
        }

        // 5. Mogrt: bung preview nhúng + ảnh tĩnh cho preview dạng video
        if (asset.type === 'mogrt') {
          let previewPath = asset.previewPath
          let previewKind = asset.previewKind
          if (!previewPath && !asset.thumbPath) {
            const t = await getMogrtThumb(asset.path, asset.id)
            if (t) {
              patch.previewPath = t.path
              patch.previewKind = t.kind
              previewPath = t.path
              previewKind = t.kind
            }
          }
          if (previewKind === 'video' && previewPath && !asset.thumbPath) {
            const thumb = await generateVideoThumbnail(`mg_${asset.id}`, previewPath)
            if (thumb) patch.thumbPath = thumb
            else patch.previewFailed = true
          } else if (!previewPath && !asset.thumbPath) {
            // Không bung được gì từ trong gói .mogrt và cũng không có preview rời.
            patch.previewFailed = true
          }
        }

        // Cập nhật nếu có thông tin mới.
        // [0.18.0] Dùng bản GOM LẠI: mỗi lần cập nhật lẻ kéo theo bốn lượt quét
        // toàn bộ 15.000 asset ở Grid/Sidebar/Toolbar — xem `schedulePatchFlush`
        // trong store.ts. Thẻ hiện ảnh chậm hơn tối đa 0,4 giây, đổi lại panel
        // không ì suốt lúc render.
        if (Object.keys(patch).length > 0) {
          useLibrary.getState().updateAssetBatched(asset.id, patch)
        }
      } catch (err) {
        // Tiếp tục với asset tiếp theo nếu 1 file hỏng
      } finally {
        doneCount++
        useLibrary.getState().setQueueProgress({ total: pending.length, done: doneCount })
        // Yield event loop để giao diện và Premiere Pro luôn mượt
        await new Promise((r) => setTimeout(r, yieldMs))
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, pending.length) }, () => worker())
  try {
    await Promise.all(workers)
  } finally {
    // TRẢ ưu tiên về IDLE dù xong xuôi, lỗi, hay bị bấm Dừng giữa chừng.
    // Bỏ sót chỗ này là mọi lần render nền SAU ĐÓ đều giành CPU với Premiere.
    setFFmpegTurbo(false)
    isQueueProcessing = false
    store.setQueueProgress(null)
  }
}

export function stopBackgroundProcessing() {
  shouldStopQueue = true
}
