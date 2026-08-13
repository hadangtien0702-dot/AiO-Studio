import { useEffect, useRef, useState } from 'react'
import type { Asset } from '../types'
import { mediaUrl } from '../services/mediaServer'
import { getMogrtThumb } from '../services/mogrtThumb'
import { useLibrary, reportBrokenPreview } from '../state/store'
import { markHoverStart, markFirstFrame, cancelHoverMark } from '../services/perf'
import { noteHover } from '../services/hoverProxy'
import { dich } from '../ngonngu'
import {
  IconHeart,
  IconMusic,
  IconLayers,
  IconFile,
  IconFilm,
  IconImage,
  IconZap,
} from './Icons'

/**
 * Icon đại diện loại asset. Dùng ICON thay vì nhãn chữ hoa tô màu:
 * một nhãn đúng nhưng lặp 60+ lần trên một màn hình thì thành nhiễu,
 * không còn là thông tin. Nghĩa được trả lại bằng title + aria-label.
 */
const TYPE_ICON: Record<Asset['type'], (p: { size?: number }) => JSX.Element> = {
  video: IconFilm,
  mogrt: IconLayers,
  audio: IconMusic,
  image: IconImage,
  preset: IconZap,
  other: IconFile,
}

/**
 * Gán tốc độ phát kèm TẮT bộ giữ cao độ. `preservesPitch` chưa có trong lib
 * DOM của mọi bản TS nên phải ép kiểu; tên cũ `webkitPreservesPitch` để chắc.
 */
function applyPitch(el: HTMLMediaElement, rate: number): void {
  const m = el as HTMLMediaElement & {
    preservesPitch?: boolean
    webkitPreservesPitch?: boolean
  }
  m.preservesPitch = false
  m.webkitPreservesPitch = false
  el.playbackRate = rate
}

/**
 * [0.17.0 - OPTIMIZE D3] "Giữ ấm" vài clip vừa xem.
 *
 * Bản cũ: rời chuột là `pause()` + `currentTime = 0`. Rê lại phát từ đầu, và
 * với clip dài thì lại chờ nạp lại đoạn đầu. Người dựng thường rê đi rê lại
 * đúng vài clip khi so sánh — lần nào cũng bắt xem lại từ giây 0 là sai.
 *
 * Nay nhớ vị trí đang xem của 3 clip gần nhất (đủ để so sánh qua lại, không
 * đủ nhiều để ngốn bộ nhớ). Bản đồ nằm ở tầng module nên sống qua việc thẻ bị
 * huỷ khi cuộn ra khỏi tầm nhìn.
 */
const WARM_MAX = 3
const warmTime = new Map<string, number>()

function rememberTime(id: string, t: number): void {
  if (!isFinite(t) || t <= 0.15) return // gần đầu clip thì nhớ làm gì
  warmTime.delete(id) // xoá rồi thêm lại = đẩy lên cuối (mới nhất)
  warmTime.set(id, t)
  if (warmTime.size > WARM_MAX) {
    const oldest = warmTime.keys().next().value
    if (oldest !== undefined) warmTime.delete(oldest)
  }
}

/**
 * [1.2.0-dev.1] RAM Pre-decoding Cache.
 * Nạp trước và giải mã bitmap trong GPU/RAM Chromium trước khi render <img>.
 * Loại bỏ hoàn toàn nhấp nháy (flicker) do độ trễ HTTP/Decode khi cuộn qua lại.
 */
const decodedImages = new Set<string>()
export function preloadAndDecodeImage(url: string): void {
  if (!url || decodedImages.has(url)) return
  const img = new Image()
  img.src = url
  if ('decode' in img && typeof img.decode === 'function') {
    img.decode().then(() => decodedImages.add(url)).catch(() => {})
  } else {
    decodedImages.add(url)
  }
}

/**
 * ☠️ HẰNG TẦNG MODULE — KHÔNG bọc `dich()` ở đây (chạy lúc import, trước khi
 * React gắn bảng chữ). Nó chỉ được dùng trong một template có `${...}` ở
 * `title` của thẻ; câu đó CHƯA dịch được, xem báo cáo.
 */
const TYPE_NAME: Record<Asset['type'], string> = {
  video: 'Video',
  mogrt: 'Mogrt',
  audio: 'Âm thanh',
  image: 'Hình ảnh',
  preset: 'Preset',
  other: 'File',
}

export default function AssetCard({ asset }: { asset: Asset }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [ready, setReady] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  /** Ảnh tĩnh tải lỗi (file bị xoá/hỏng) -> lùi về icon loại. */
  const [imgFailed, setImgFailed] = useState(false)
  /** Preview/thumb nhúng bên trong file .mogrt (khi pack không kèm preview rời). */
  const [embedThumb, setEmbedThumb] = useState<{ path: string; kind: 'video' | 'image' } | null>(null)

  const mediaReady = useLibrary((s) => s.mediaReady)
  const muted = useLibrary((s) => s.muted)
  const volume = useLibrary((s) => s.volume)
  const pitch = useLibrary((s) => s.pitch)
  const filter = useLibrary((s) => s.filter)
  const toggleFavorite = useLibrary((s) => s.toggleFavorite)
  const setActiveAsset = useLibrary((s) => s.setActiveAsset)
  const pinnedId = useLibrary((s) => s.pinnedId)
  const setPinned = useLibrary((s) => s.setPinned)

  /**
   * [0.18.1] CHỈ CÒN BẤM ĐỂ XEM/NGHE. Rê chuột KHÔNG còn tự phát nữa.
   *
   * Vì sao bỏ hover-preview — vốn là "trọng tâm v1" lúc đầu:
   *  - Chuột đi ngang một ô là ô đó tự phát, và tự nhận mình là mục tiêu của nút
   *    Import. Người dùng bấm nghe bài A rồi đưa chuột xuống nút Import, trên
   *    đường đi quét qua vài thẻ khác -> Import chèn NHẦM bài cuối cùng bị lướt
   *    qua. Lỗi thật, chủ dự án gặp phải.
   *  - Lướt qua lưới 15.000 asset là hàng chục lần tự phát ngoài ý muốn: tốn máy,
   *    tiếng bật lên bất ngờ, và chớp hình liên tục.
   * Bấm là hành động CÓ CHỦ Ý — một thẻ phát, đúng thẻ đó là mục tiêu Import.
   */
  const pinned = pinnedId === asset.id
  /** Đang phát. Từ 0.18.1 chỉ do BẤM, không còn do rê chuột. */
  const active = pinned

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = muted ? 0 : volume
  }, [muted, volume])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [muted, volume])

  /**
   * Cao độ khi nghe thử. `preservesPitch = false` tắt bộ giữ cao độ của
   * Chromium, để playbackRate kéo cả cao độ đi theo — đúng kiểu varispeed
   * (băng từ) mà editor hay dùng để thử SFX. Đổi cao độ ⇒ tốc độ/độ dài
   * clip nghe thử cũng đổi theo; file gốc không bị ảnh hưởng.
   */
  const previewRate = Math.pow(2, pitch / 12)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    applyPitch(a, previewRate)
  }, [previewRate, pinnedId])

  const TypeIcon = TYPE_ICON[asset.type]

  // MOGRT không có preview rời -> bung preview (mp4/png) nhúng bên trong gói.
  // [0.10.0] Hàm này giờ BẤT ĐỒNG BỘ + chỉ đọc vài trăm KB thay vì cả gói —
  // hàng đợi nền thường đã bung sẵn, đây chỉ là đường dự phòng khi cuộn tới
  // trước lúc hàng đợi kịp làm.
  useEffect(() => {
    if (asset.type !== 'mogrt' || asset.previewPath) return
    let alive = true
    void getMogrtThumb(asset.path, asset.id).then((t) => {
      if (alive && t) setEmbedThumb(t)
    })
    return () => {
      alive = false
    }
  }, [asset.type, asset.previewPath, asset.path, asset.id])

  // Ưu tiên dùng proxyPath nếu có cho video nặng để hover mượt tuyệt đối
  const previewFile = asset.proxyPath ?? asset.previewPath ?? embedThumb?.path ?? ''
  const hasPreview = !!previewFile && mediaReady
  const kind = hasPreview
    ? (asset.previewPath || asset.proxyPath ? asset.previewKind : embedThumb?.kind ?? 'image')
    : asset.thumbPath
    ? 'image'
    : undefined

  /**
   * Ảnh TĨNH hiện khi không rê chuột. CHỈ nhận file thật sự là ảnh.
   *
   * Bản cũ rơi xuống dùng `previewFile` — mà với video, file đó chính là
   * cái .mp4. Trỏ <img> vào .mp4 thì trình duyệt không giải mã được và vẽ
   * biểu tượng ảnh vỡ kèm chữ alt (lỗi lộ ra sau khi xoá bộ nhớ đệm, lúc
   * thumbPath biến mất). Video chưa có thumbnail thì hiện icon loại, và hàng
   * đợi nền sẽ sinh ảnh sau.
   */
  const stillImage =
    imgFailed
      ? ''
      : asset.thumbPath ||
        (asset.previewKind === 'image' ? asset.previewPath : '') ||
        (embedThumb?.kind === 'image' ? embedThumb.path : '') ||
        ''

  /**
   * URL thật để đưa vào `<img src>`. Rỗng khi máy chủ preview CHƯA chạy xong —
   * và khi rỗng thì TUYỆT ĐỐI không render thẻ `<img>`: `src=""` bị trình duyệt
   * hiểu là chính trang HTML này, tải về không phải ảnh nên vẽ biểu tượng ảnh
   * vỡ ở góc ô. Đây là một trong hai nguồn "ảnh vỡ" người dùng nhìn thấy.
   */
  const stillUrl = stillImage ? mediaUrl(stillImage) : ''
  /** Cùng lý do với `stillUrl`, cho ảnh sóng âm của file audio. */
  const waveUrl = !imgFailed && asset.waveformPath ? mediaUrl(asset.waveformPath) : ''

  // [1.2.0-dev.1] Pre-decode ảnh vào RAM GPU để khi cuộn lướt qua thẻ hiển thị ngay lập tức (0ms)
  useEffect(() => {
    if (stillUrl) preloadAndDecodeImage(stillUrl)
    if (waveUrl) preloadAndDecodeImage(waveUrl)
  }, [stillUrl, waveUrl])

  /**
   * Ảnh tải lỗi: lùi về icon loại NGAY, đồng thời báo cho store dọn đường dẫn
   * treo trong `library.json` để hàng đợi nền sinh lại ảnh mới.
   */
  function onImgError() {
    setImgFailed(true)
    reportBrokenPreview()
  }

  function formatDuration(sec?: number): string {
    if (!sec || isNaN(sec) || sec <= 0) return ''
    const s = Math.round(sec)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const r = s % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`
  }

  function formatRes(w?: number, h?: number): string {
    if (!w || !h) return ''
    if (w >= 3840 || h >= 2160) return '4K'
    if (w >= 2560 || h >= 1440) return '2K'
    if (w >= 1920 || h >= 1080) return '1080p'
    if (w >= 1280 || h >= 720) return '720p'
    return `${w}×${h}`
  }

  const durationStr = formatDuration(asset.duration)
  const resStr = formatRes(asset.width, asset.height)

  /** Đang lọc đúng loại của asset này -> icon loại là thừa. */
  const inThisType = filter === asset.type
  /** Đuôi file trùng tên loại (.mogrt) -> chữ "MOGRT" không thêm thông tin gì. */
  const extSameAsType = asset.ext.toLowerCase() === asset.type
  /** Có phần nào đứng trước dấu chấm phân cách không. */
  const hasLead = !inThisType || !extSameAsType

  /** Tỉ lệ 0-1 cần tua tới ngay khi thẻ audio vừa sẵn sàng (bấm trước khi phát). */
  const seekOnReadyRef = useRef<number | null>(null)

  /** Bấm vào thẻ = xem/nghe. Bấm lần nữa (hoặc bấm thẻ khác) thì dừng. */
  function togglePlay() {
    // Bấm là "chọn" — nút Import ở thanh dưới nhắm đúng thẻ này.
    setActiveAsset(asset)

    if (pinned) {
      // Dừng: nhớ vị trí đang xem để lần sau chạy tiếp (D3).
      if (videoRef.current) rememberTime(asset.id, videoRef.current.currentTime)
      cancelHoverMark(asset.id)
      setAudioProgress(0)
      setReady(false)
      setPinned('')
      return
    }

    // Đếm số lần XEM để tự làm bản xem nhanh cho clip hay được mở (D1).
    // Trước 0.18.1 đếm theo lần rê chuột — nhưng rê chuột phần lớn là vô tình,
    // đếm theo lần BẤM mới đúng là "clip này hay được xem".
    noteHover(asset)
    if (kind === 'video') markHoverStart(asset.id)
    setAudioProgress(0)
    setPinned(asset.id, asset)
  }

  /**
   * [0.18.1] KÉO THẢ THẲNG VÀO PREMIERE.
   *
   * Tài liệu dự án trước đây ghi "CEP không kéo-thả sang Premiere được" — SAI.
   * Adobe có API riêng cho việc này: đặt đường dẫn file vào khoá
   * `com.adobe.cep.dnd.file.<số thứ tự>` lúc bắt đầu kéo, host sẽ nhận file thật.
   * Đây chính là cách panel Artlist / Motion Array làm được.
   *
   * Kéo FILE GỐC (`asset.path`), tuyệt đối không kéo bản xem nhanh hay ảnh
   * preview — người dùng cần đúng file để dựng.
   */
  function onDragStart(e: React.DragEvent) {
    try {
      // [1.0.3] CHỈ đặt đúng một khoá này.
      //
      // Bản 1.0.1 đặt thêm `text/plain` — nhưng khi gói kéo có nhiều định dạng,
      // Premiere có thể vớ phải cái kia và từ chối (con trỏ hiện dấu cấm). Giữ
      // gói tối giản đúng như mẫu Adobe. Muốn kéo ra Explorer thì tính sau.
      e.dataTransfer.setData('com.adobe.cep.dnd.file.0', asset.path)
      /**
       * [1.0.4] ĐÂY CHÍNH LÀ NGUYÊN NHÂN của "con trỏ dấu cấm" — đã xác nhận
       * bằng thử thật ngày 28/07/2026, kéo vào timeline ăn ngay.
       *
       * `effectAllowed = 'copy'`: nếu nơi thả xin một kiểu khác (move/link) mà
       * nguồn chỉ cho phép 'copy', Chromium hiện dấu cấm và CHẶN cú thả — dù dữ
       * liệu hoàn toàn hợp lệ. Đặt 'all' để nơi thả muốn kiểu nào cũng được.
       *
       * ĐỪNG đổi về 'copy'. Không phải Adobe từ chối — là mình siết quá chặt.
       */
      e.dataTransfer.effectAllowed = 'all'
    } catch {
      /* trình duyệt thường không cho đặt khoá lạ -> bỏ qua, nút Import vẫn còn */
    }
    setActiveAsset(asset)
  }

  /**
   * Bấm vào sóng âm -> nhảy tới đúng vị trí đó trong file.
   * Tỉ lệ ngang của ảnh sóng âm = tỉ lệ thời gian (ảnh trải trọn thời lượng),
   * nên vị trí chuột đổi thẳng thành currentTime.
   *
   * Bấm vào sóng âm KHÔNG bao giờ tắt tiếng đang nghe: nó luôn là "nghe từ chỗ
   * này", nên bấm nhiều điểm liên tiếp để dò đoạn ưng ý là chuyện tự nhiên.
   */
  function onWaveformSeek(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation() // đừng để thẻ hiểu nhầm thành "bấm để dừng"
    const box = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))

    setActiveAsset(asset) // nút Import phải nhắm đúng bài vừa bấm nghe
    if (!pinned) setPinned(asset.id)
    setAudioProgress(ratio * 100)

    const a = audioRef.current
    if (!a) {
      // Chưa phát bao giờ -> <audio> vừa mới được gắn ở lần render này, chưa
      // có ref. Nhớ vị trí lại, gán ngay khi nó sẵn sàng (onLoadedMetadata).
      seekOnReadyRef.current = ratio
      return
    }
    const total = a.duration || asset.duration || 0
    if (!total) {
      seekOnReadyRef.current = ratio
      return
    }
    a.currentTime = ratio * total
    void a.play().catch(() => {})
  }

  function onAudioTimeUpdate() {
    const a = audioRef.current
    if (a && a.duration) {
      setAudioProgress((a.currentTime / a.duration) * 100)
    }
  }

  return (
    <div
      className={`card-asset ${pinned ? 'card-asset--playing' : ''}`}
      // Thẻ bấm được thì phải Tab tới được. Không dùng <button> vì bên trong
      // đã có nút Yêu thích.
      role="button"
      tabIndex={0}
      aria-pressed={pinned}
      // [0.18.1] BẤM = xem/nghe (rê chuột không còn tự phát).
      // [0.17.0] Bỏ hẳn "bấm đúp để chèn": chèn vào timeline là việc sửa dự án
      // thật, không nên nằm sau một thao tác dễ lỡ tay ngay trên thứ người ta
      // bấm suốt để xem. Chèn qua nút Import ở thanh dưới, hoặc kéo thả.
      onClick={togglePlay}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return // để nút con tự xử lý
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          togglePlay()
        }
      }}
      /**
       * [1.2.0-dev.2] KÉO THẢ CHẠY ĐƯỢC — đã xác nhận thật 28/07/2026.
       *
       * Kéo thẻ thả thẳng vào TIMELINE của Premiere Beta 26.5: ăn. Chủ dự án thử
       * và xác nhận ("ngon lành"), clip xuống đúng track audio.
       *
       * ĐỪNG TẮT LẠI. Bản 1.1.0 từng tắt vì tưởng Adobe từ chối — đó là KẾT LUẬN
       * SAI, dựng trên bản build cũ. Mốc thời gian trong PROGRESS.md nói rõ:
       *   11:38 27/07 — sửa `effectAllowed` 'copy' -> 'all', ghi [CHO thu lai]
       *   11:45 27/07 — đóng gói 1.1.0, TẮT kéo thả
       * Cách nhau 7 phút: bản sửa quan trọng nhất CHƯA HỀ được thử. `effectAllowed
       * = 'all'` chính là thứ gỡ được con trỏ dấu cấm — xem ghi chú ở onDragStart.
       *
       * Bài học: đừng gỡ một tính năng khi bản sửa cuối cùng còn đang chờ thử.
       */
      draggable
      onDragStart={onDragStart}
      title={`${asset.fileName} — ${TYPE_NAME[asset.type]}${resStr ? ' · ' + resStr : ''}\nBấm để ${
        asset.type === 'audio' ? dich('nghe (bấm vào sóng âm để nghe từ đoạn đó)') : dich('xem')
      } · Kéo thả vào timeline, hoặc bấm nút Import`}
    >
      <div className="card-asset__thumb">
        {asset.type === 'audio' ? (
          <div
            className={`card-asset__waveform-box ${
              waveUrl ? 'card-asset__waveform-box--seek' : ''
            }`}
            // Bấm vào sóng âm để nhảy tới đúng đoạn đó — nghe thử giữa file mà
            // không phải chờ phát từ đầu. Chỉ bật khi ĐÃ có ảnh sóng âm, vì
            // người dùng cần nhìn thấy mình đang bấm vào đâu.
            onClick={waveUrl ? onWaveformSeek : undefined}
          >
            {waveUrl ? (
              <>
                <img
                  draggable={false}
                  className="card-asset__media card-asset__media--waveform"
                  src={waveUrl}
                  alt=""
                  onError={onImgError}
                  decoding="async"
                />
                {active && (
                  <div
                    className="waveform-playhead"
                    style={{ left: `${audioProgress}%` }}
                  />
                )}
              </>
            ) : asset.previewFailed ? (
              /**
               * [1.3.2] ĐÃ THỬ VÀ HỎNG thì phải nói thật.
               *
               * Bản cũ chỉ hỏi "đã có sóng âm chưa", không hỏi "đã thử và thất
               * bại chưa" — nên file hỏng nằm mãi ở "Đang tạo sóng âm…", chờ
               * một việc KHÔNG BAO GIỜ chạy nữa (hàng đợi đã đánh dấu bỏ qua).
               * Chủ dự án nhìn thấy đúng cảnh đó: cả một thư mục treo vĩnh viễn.
               *
               * Comment cũ ghi "đừng để ô trống làm người dùng tưởng file lỗi"
               * — ý đúng, nhưng khi file lỗi THẬT thì câu đó thành nói dối.
               */
              <div className="card-asset__waveform-wait card-asset__waveform-wait--failed">
                <IconMusic size={20} />
                <span>{dich('Không đọc được file')}</span>
              </div>
            ) : (
              // Sóng âm do FFmpeg sinh ở hàng đợi nền — chưa có thì nói rõ đang
              // chờ, đừng để ô trống làm người dùng tưởng file lỗi.
              <div className="card-asset__waveform-wait">
                <IconMusic size={20} />
                <span>{dich('Đang tạo sóng âm…')}</span>
              </div>
            )}
          </div>
        ) : kind === 'video' ? (
          // [0.10.0] MẶC ĐỊNH LÀ ẢNH TĨNH, <video> chỉ tồn tại khi hover.
          // Trước đây MỌI thẻ video trong tầm nhìn đều mount <video> thật
          // (25-35 decoder Chromium cùng sống + preload="auto" tải sẵn dữ
          // liệu ai cũng chưa xem) — nguồn nặng số 1 khi cuộn lưới.
          <>
            {active && (
              <video
                draggable={false}
                ref={videoRef}
                className="card-asset__media card-asset__media--overlay"
                src={mediaUrl(previewFile)}
                muted={muted}
                // Video thì GIỮ lặp kể cả khi bấm: thư viện này gần như toàn
                // overlay/transition dài 1-17 giây, dừng sau một lượt thì chưa
                // kịp nhìn đã hết. Khác hẳn âm thanh (14 giây - 2 phút 40).
                loop
                playsInline
                autoPlay
                preload="auto"
                // Rê lại clip vừa xem thì CHẠY TIẾP từ chỗ cũ (D3), không bắt
                // xem lại từ đầu. Đặt ở loadedmetadata vì lúc đó đã biết
                // duration — gán currentTime sớm hơn sẽ bị bỏ qua.
                onLoadedMetadata={(e) => {
                  const t = warmTime.get(asset.id)
                  if (t && t < e.currentTarget.duration - 0.2) {
                    e.currentTarget.currentTime = t
                  }
                }}
                onLoadedData={(e) => {
                  e.currentTarget.volume = muted ? 0 : volume
                  markFirstFrame(asset.id)
                  setReady(true)
                }}
              />
            )}
            {/* Ảnh tĩnh nằm DƯỚI video: hover vào vẫn thấy hình ngay,
                video đè lên khi frame đầu sẵn sàng — không có nháy đen.
                Dùng `stillImage` (không phải `asset.thumbPath`): nó đã trừ
                trường hợp ảnh tải lỗi, nên ảnh hỏng lùi về icon loại thay vì
                đứng mãi ở biểu tượng ảnh vỡ. */}
            {!ready &&
              (stillUrl ? (
                <img
                  draggable={false}
                  className="card-asset__media"
                  src={stillUrl}
                  alt=""
                  onError={onImgError}
                  decoding="async"
                />
              ) : (
                <div className="card-asset__icon">
                  <TypeIcon size={22} />
                </div>
              ))}
            {active && !ready && <div className="thumb-loading" />}
          </>
        ) : stillUrl ? (
          <img
            draggable={false}
            className="card-asset__media"
            src={stillUrl}
            // alt rỗng: ảnh này chỉ để nhìn, tên đã nằm ngay dưới thẻ. Để alt =
            // tên thì lúc ảnh lỗi trình duyệt in tên ra giữa ô, trông như hỏng.
            alt=""
            decoding="async"
            onLoad={() => setReady(true)}
            // Ảnh mất/hỏng -> lùi về icon loại thay vì để ô vỡ.
            onError={onImgError}
          />
        ) : (
          <div className="card-asset__icon">
            <TypeIcon size={22} />
          </div>
        )}

        {asset.type === 'audio' && active && (
          <audio
            ref={audioRef}
            src={mediaUrl(asset.path)}
            autoPlay
            /**
             * [0.17.2] BẤM nghe thì KHÔNG lặp — nghe hết bài là dừng.
             *
             * `loop` có từ hồi preview chỉ chạy bằng rê chuột: rê 2 giây vào
             * một SFX 3 giây thì lặp là đúng, vì rời chuột là tắt ngay. Nhưng
             * khi người dùng CHỦ ĐỘNG bấm nghe một track 2 phút 40, lặp vô hạn
             * thành ra bài hát đuổi theo người ta cho tới khi tự nhớ ra phải
             * bấm tắt. Từ 0.18.1 chỉ còn bấm để nghe, nên KHÔNG bao giờ lặp.
             */
            loop={false}
            onEnded={() => {
              // Hết bài -> tự nhả, viền cam tắt: nhìn là biết đã nghe xong.
              setPinned('')
              setAudioProgress(0)
            }}
            muted={muted}
            // Bấm vào giữa sóng âm lúc chưa phát: lúc đó chưa có <audio> nào để
            // tua, nên vị trí được nhớ lại và gán ngay khi biết thời lượng.
            onLoadedMetadata={(e) => {
              const ratio = seekOnReadyRef.current
              seekOnReadyRef.current = null
              if (ratio !== null && e.currentTarget.duration) {
                e.currentTarget.currentTime = ratio * e.currentTarget.duration
              }
            }}
            onPlay={(e) => {
              e.currentTarget.volume = muted ? 0 : volume
              applyPitch(e.currentTarget, previewRate)
            }}
            onTimeUpdate={onAudioTimeUpdate}
          />
        )}

        {/* Dạng lưới: thời lượng đè lên ảnh. Dạng danh sách: nó nằm ở dòng meta
            bên dưới tên — ô ảnh chỉ rộng 46px, nhét badge vào là bị cắt. */}
        {durationStr && (
          <span className="duration-badge">{durationStr}</span>
        )}
      </div>

      <div className="card-asset__info">
        <span className="card-asset__name">{asset.name}</span>
        <span className="card-asset__meta">
          {/* Đang đứng trong đúng mục loại này thì icon loại chỉ lặp lại điều đã
              biết — bỏ đi. Đuôi file cũng bỏ khi nó TRÙNG tên loại (.mogrt);
              còn MP4 / MOV / WAV thì vẫn giữ vì đó là thông tin thật. */}
          {!inThisType && <TypeIcon size={10} />}
          {!extSameAsType && <span>{asset.ext.toUpperCase()}</span>}
          {resStr && (
            <>
              {hasLead && <span className="card-asset__meta-sep">·</span>}
              <span>{resStr}</span>
            </>
          )}
        </span>
      </div>

      {/* Nút hành động là con của THẺ, không phải của ô ảnh — để dạng danh sách
          xếp được chúng ra cuối hàng thay vì nhồi vào trong ô ảnh. */}
      <div className="card-asset__actions">
        <button
          className={`fav-btn ${asset.favorite ? 'fav-btn--on' : ''}`}
          title={asset.favorite ? dich('Bỏ yêu thích') : dich('Đánh dấu yêu thích')}
          aria-label={
            asset.favorite
              ? `Bỏ yêu thích ${asset.name}`
              : `Đánh dấu yêu thích ${asset.name}`
          }
          aria-pressed={!!asset.favorite}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(asset.id)
          }}
        >
          <IconHeart size={13} filled={!!asset.favorite} />
        </button>

        {/* [0.17.0] Nút Chèn KHÔNG còn nằm trên từng thẻ. 60 nút Chèn trên một
            màn hình là 60 lần lặp cùng một việc, lại hay bị bấm nhầm lúc rê
            chuột xem. Giờ chỉ còn MỘT nút Chèn ở thanh dưới (cùng hàng với nút
            đổi cỡ hiển thị), chèn asset vừa rê chuột tới. */}
      </div>
    </div>
  )
}
