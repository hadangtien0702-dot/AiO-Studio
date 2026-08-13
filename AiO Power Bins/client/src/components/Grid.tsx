import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { dich } from '../ngonngu'
import { useLibrary } from '../state/store'
import { filesFromDropEvent } from '../services/timelineImport'
import { setQueuePriorityIds } from '../services/jobQueue'
import AssetCard from './AssetCard'
import {
  IconFile,
  IconSearch,
  IconZap,
  IconGridMedium,
  IconGridLarge,
  IconVolumeOn,
  IconVolumeOff,
  IconPitch,
  IconImport,
  IconClose,
} from './Icons'

const GAP = 10
/**
 * Bề rộng ô MONG MUỐN theo cỡ lưới. Đây là mục tiêu, không phải sàn cứng:
 * số cột lấy bằng làm TRÒN (không phải làm sàn), nên panel hẹp sẽ cho 2 ô
 * hơi nhỏ thay vì 1 ô khổng lồ chiếm cả bề ngang.
 */
const COL_W: Record<'M' | 'L', number> = { M: 170, L: 260 }
const INFO_H = 44 // chiều cao phần tên + loại file
/**
 * Số hàng render thêm ngoài vùng nhìn thấy.
 * [1.2.0-dev.1] Đặt 6 hàng cho đọc bình thường và 2 hàng khi cuộn nhanh
 * để ảnh WebP siêu nhẹ được giải mã sẵn trên RAM trước khi cuộn tới -> cuộn mượt 60 FPS.
 */
const OVERSCAN = 4

/**
 * [1.3.0] Mỗi lần đổ thêm bấy nhiêu asset vào lưới.
 *
 * 1.000 asset ≈ 333 hàng ≈ 49.600px — trong khung 411px thì kéo thanh cuộn 1px
 * đi khoảng 120px, tức chưa tới một hàng. Kéo tới đâu thấy tới đó.
 * (Để nguyên cả 91.256 thì 1px = 74 hàng.)
 */
const PAGE = 1000

/**
 * ☠️ ĐỪNG bọc `dich()` vào chính mảng này. Hằng tầng module chạy lúc IMPORT,
 * trước khi React gắn bảng chữ -> tiếng Việt đóng cứng vĩnh viễn. Bọc ở CHỖ
 * VẼ RA: `title={dich(title)}` trong `BottomDock`.
 */
const SIZES: {
  key: 'M' | 'L'
  title: string
  Icon: (p: { size?: number }) => JSX.Element
}[] = [
  { key: 'M', title: 'Xem vừa', Icon: IconGridMedium },
  { key: 'L', title: 'Xem to', Icon: IconGridLarge },
]

/**
 * Thanh nổi góc phải phía dưới: nút Chèn + nút đổi cỡ hiển thị.
 *
 * [0.17.0] Nút Chèn chuyển từ TỪNG THẺ về ĐÂY — một nút duy nhất cho cả lưới.
 * Mục tiêu của nó là asset vừa rê chuột tới, và mục tiêu đó được GIỮ LẠI khi
 * chuột rời thẻ, nên thao tác tự nhiên là: rê xem clip -> đưa chuột xuống bấm
 * Chèn. Từ 0.17.0 đây là ĐƯỜNG DUY NHẤT để chèn: bấm vào thẻ giờ là xem/nghe,
 * và "bấm đúp để chèn" đã bỏ hẳn — sửa dự án của người dùng không nên nằm sau
 * một thao tác dễ lỡ tay ngay trên thứ người ta bấm suốt để xem.
 */
function BottomDock() {
  const cardSize = useLibrary((s) => s.cardSize)
  const setCardSize = useLibrary((s) => s.setCardSize)
  const lastAsset = useLibrary((s) => s.activeAsset)
  const pinnedAsset = useLibrary((s) => s.pinnedAsset)
  const sendToTimeline = useLibrary((s) => s.sendToTimeline)
  const activeMasterTab = useLibrary((s) => s.activeMasterTab)
  const removeFromPowerBin = useLibrary((s) => s.removeFromPowerBin)

  /**
   * [0.18.1] Mục tiêu của nút Import: THẺ ĐANG PHÁT trước đã.
   *
   * Lỗi thật đã gặp: bấm nghe bài A rồi đưa chuột xuống nút Import, dọc đường
   * chuột quét qua vài thẻ khác và Import chèn nhầm bài cuối cùng bị lướt qua.
   * Nay thẻ đang phát thắng; chỉ khi không có thẻ nào phát mới dùng thẻ vừa bấm
   * gần nhất (trường hợp nghe hết bài, nhạc tự dừng nhưng vẫn muốn chèn nó).
   */
  const activeAsset = pinnedAsset ?? lastAsset

  /** Asset đang trỏ tới có nằm trong khay không — quyết định hiện nút Bỏ khỏi khay. */
  const canRemove =
    activeMasterTab === 'powerbin' && !!activeAsset?.powerBinFolderId

  return (
    <div className="view-switch" role="group" aria-label={dich('Thanh thao tác lưới')}>
      <button
        className="view-switch__insert"
        disabled={!activeAsset}
        title={
          activeAsset
            ? `Chèn "${activeAsset.name}" vào timeline tại playhead`
            : dich('Bấm (hoặc rê chuột) vào một asset trước, rồi bấm đây để chèn')
        }
        aria-label={
          activeAsset ? `Chèn ${activeAsset.name} vào timeline` : dich('Chèn vào timeline')
        }
        onClick={() => activeAsset && void sendToTimeline(activeAsset)}
      >
        <IconImport size={13} />
        {/* Nhãn cố định "Import" — đổi theo tên asset thì nút nhảy chữ liên tục
            mỗi lần chuột đi ngang một ô, đọc rất mệt. Muốn biết sắp chèn cái gì
            thì đã có tooltip. */}
        <span>Import</span>
      </button>

      {/* [0.18.0] Có đường THÊM vào khay thì phải có đường RA. Chỉ hiện trong
          Power Bins, và chỉ khi asset đang trỏ tới thật sự nằm trong một khay —
          nút mờ sẵn ở nơi không dùng được chỉ tổ gây thắc mắc.
          Đây KHÔNG phải xoá file: file gốc trên đĩa và trong thư viện vẫn còn. */}
      {canRemove && (
        <button
          className="view-switch__remove"
          title={`Bỏ "${activeAsset!.name}" khỏi khay (không xoá file trên đĩa)`}
          aria-label={`Bỏ ${activeAsset!.name} khỏi khay`}
          onClick={() => removeFromPowerBin(activeAsset!.id)}
        >
          <IconClose size={12} />
          <span>{dich('Bỏ khỏi khay')}</span>
        </button>
      )}

      <span className="view-switch__sep" aria-hidden="true" />

      {SIZES.map(({ key, title, Icon }) => (
        <button
          key={key}
          className={`view-switch__btn ${cardSize === key ? 'view-switch__btn--active' : ''}`}
          title={dich(title)}
          aria-label={dich(title)}
          aria-pressed={cardSize === key}
          onClick={() => setCardSize(key)}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  )
}

/**
 * Cụm nghe thử của phần Âm thanh: âm lượng + cao độ.
 * Đặt ở ĐẦU phần âm thanh, không đặt ở thanh tìm kiếm chung — tìm kiếm dùng cho
 * mọi mục, nhồi thêm 2 cụm vào đó là rối.
 */
function AudioPreviewBar() {
  const muted = useLibrary((s) => s.muted)
  const volume = useLibrary((s) => s.volume)
  const toggleMuted = useLibrary((s) => s.toggleMuted)
  const setVolume = useLibrary((s) => s.setVolume)
  const pitch = useLibrary((s) => s.pitch)
  const setPitch = useLibrary((s) => s.setPitch)

  const volumePercent = Math.round((muted ? 0 : volume) * 100)

  return (
    <div className="audio-bar" role="group" aria-label={dich('Điều khiển nghe thử âm thanh')}>
      <div className="audio-ctrl">
        <button
          className="icon-btn"
          title={
            muted || volume === 0
              ? dich('Đang tắt tiếng — bấm để bật')
              : `Âm lượng ${volumePercent}% — bấm để tắt tiếng`
          }
          aria-label={muted ? dich('Bật tiếng') : dich('Tắt tiếng')}
          aria-pressed={muted}
          onClick={toggleMuted}
        >
          {muted || volume === 0 ? <IconVolumeOff /> : <IconVolumeOn />}
        </button>

        <input
          type="range"
          className="audio-ctrl__slider"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : volume}
          aria-label={dich('Âm lượng nghe thử')}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />

        <span className="audio-ctrl__value">{volumePercent}%</span>
      </div>

      <div className="audio-ctrl">
        <button
          className="icon-btn"
          title={dich('Cao độ khi nghe thử — bấm để về nguyên bản (0)')}
          aria-label={dich('Đưa cao độ về nguyên bản')}
          onClick={() => setPitch(0)}
        >
          <IconPitch />
        </button>

        <input
          type="range"
          className="audio-ctrl__slider"
          min="-12"
          max="12"
          step="1"
          value={pitch}
          aria-label={dich('Cao độ nghe thử, tính bằng nửa cung')}
          title={`Cao độ ${pitch > 0 ? '+' : ''}${pitch} nửa cung — đổi cao độ thì tốc độ nghe thử đổi theo`}
          onChange={(e) => setPitch(parseInt(e.target.value, 10))}
        />

        <span className="audio-ctrl__value">
          {pitch > 0 ? '+' : ''}
          {pitch}
        </span>
      </div>
    </div>
  )
}

/**
 * Grid ảo hoá: chỉ render các thẻ trong vùng nhìn thấy.
 * Với thư viện 15.000+ asset, render hết sẽ treo panel — cách này giữ
 * số phần tử DOM ở mức vài chục bất kể thư viện lớn cỡ nào.
 */
export default function Grid() {
  const assets = useLibrary((s) => s.assets)
  const filter = useLibrary((s) => s.filter)
  const scanning = useLibrary((s) => s.scanning)
  const scanCount = useLibrary((s) => s.scanCount)
  const error = useLibrary((s) => s.error)
  const cardSize = useLibrary((s) => s.cardSize)
  const minColW = COL_W[cardSize]

  // Dùng callback ref (không phải useRef) để hiệu ứng đo chạy ĐÚNG LÚC
  // phần tử xuất hiện trong DOM — useRef + useLayoutEffect([]) sẽ đo hụt
  // khi vùng cuộn được render muộn hơn lần mount đầu.
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [scrollTop, setScrollTop] = useState(0)

  useLayoutEffect(() => {
    if (!el) return
    // clientWidth CÓ tính padding — phải trừ ra, nếu không mọi thẻ sẽ cao hơn
    // tỉ lệ 16:10 đúng một khoảng bằng padding (ảnh bị hở viền dưới).
    const update = () => {
      const cs = getComputedStyle(el)
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      setSize({ w: Math.max(0, el.clientWidth - padX), h: el.clientHeight })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])

  /**
   * [1.2.1] ĐÃ GỠ cơ chế "nạp trước ít lại khi cuộn nhanh" (OPTIMIZE C6, 0.17.0).
   *
   * Ý tưởng cũ: cuộn vèo qua hàng nghìn asset thì mấy hàng nạp trước chỉ là việc
   * làm rồi vứt đi, nên co từ 4 hàng xuống 1; dừng tay 160ms thì bung lại.
   *
   * THỰC TẾ NÓ CHÍNH LÀ THỦ PHẠM GÂY FLICKER. Đo trên panel thật ngày 28/07
   * (thư viện 12.993 audio, panel cao 411px) bằng cách mô phỏng đúng cú cuộn
   * nhanh của chủ dự án:
   *      đứng yên          27 thẻ
   *      đang cuộn nhanh   21 thẻ
   *      vừa dừng tay      45 thẻ   <-- dựng lại 24 thẻ CÙNG LÚC
   *
   * Panel dock chỉ cao 411px = vừa 2,76 hàng, nên phần "nạp trước" chiếm phần
   * lớn lưới. Mỗi lần nó co vào rồi bung ra là hơn NỬA lưới bị dỡ và dựng lại —
   * đúng vùng cuối lưới chớp tắt mà chủ dự án nhìn thấy. Bản 1.2.0-dev.1 còn
   * nâng 4->6 và 1->2 nên chênh lệch tăng từ 18 lên 24 thẻ, tức nặng thêm 33%.
   *
   * Giữ OVERSCAN CỐ ĐỊNH thì số thẻ không bao giờ nhảy bậc: cuộn tới đâu chỉ
   * thay hàng ở hai đầu, không có cú dỡ/dựng hàng loạt nào cả.
   *
   * ĐỪNG làm lại kiểu "tối ưu theo tốc độ cuộn" này. Tiết kiệm được vài chục
   * thẻ render, nhưng đổi lại là lưới nhấp nháy — thứ người dùng thấy ngay.
   */
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  /**
   * Kéo file từ Windows Explorer vào khay Power Bin.
   * Chiều này CHẠY ĐƯỢC (HTML5 drop). Chiều từ timeline Premiere vào panel thì
   * KHÔNG — Premiere không có API drag-out; dùng nút "Thêm từ timeline".
   */
  const [dragOver, setDragOver] = useState(false)

  const search = useLibrary((s) => s.search)
  const activeMasterTab = useLibrary((s) => s.activeMasterTab)
  const brands = useLibrary((s) => s.brands)
  const selectedPath = useLibrary((s) => s.selectedPath)
  const selectedPowerBinFolderId = useLibrary((s) => s.selectedPowerBinFolderId)
  const selectedBrandId = useLibrary((s) => s.selectedBrandId)
  const powerBinFolders = useLibrary((s) => s.powerBinFolders)
  const addPathsToPowerBin = useLibrary((s) => s.addPathsToPowerBin)
  const showToast = useLibrary((s) => s.showToast)
  const onlyFavorites = useLibrary((s) => s.onlyFavorites)
  const sortBy = useLibrary((s) => s.sortBy)
  const sortDesc = useLibrary((s) => s.sortDesc)

  /**
   * [0.10.0] Hai tối ưu tìm kiếm cho thư viện hàng chục nghìn asset:
   *  - Tên chữ thường tính TRƯỚC một lần mỗi khi thư viện đổi — bản cũ
   *    toLowerCase() lại 15.000 chuỗi cho MỖI ký tự người dùng gõ.
   *  - useDeferredValue: đang gõ nhanh thì React ưu tiên cập nhật ô nhập,
   *    việc lọc chạy sau — gõ không còn khựng.
   */
  const lowerById = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of assets) m.set(a.id, a.name.toLowerCase())
    return m
  }, [assets])

  const deferredSearch = useDeferredValue(search)

  /** Lọc + sắp xếp. Memo hoá vì thư viện có thể tới hàng chục nghìn asset. */
  const visible = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    let list = assets

    // 1. Phân tách dứt điểm theo không gian làm việc
    if (activeMasterTab === 'powerbin') {
      if (selectedPowerBinFolderId) {
        list = list.filter((a) => a.powerBinFolderId === selectedPowerBinFolderId)
      } else if (selectedBrandId) {
        // Mở brand mà chưa chọn khay: hiện TOÀN BỘ asset của brand đó.
        const binIds = new Set(
          powerBinFolders.filter((f) => f.brandId === selectedBrandId).map((f) => f.id),
        )
        list = list.filter((a) => !!a.powerBinFolderId && binIds.has(a.powerBinFolderId))
      } else {
        list = list.filter((a) => !!a.powerBinFolderId)
      }
    }

    if (filter !== 'all') list = list.filter((a) => a.type === filter)
    if (onlyFavorites) list = list.filter((a) => a.favorite)
    // Thư mục con đang chọn ở menu (list "như trong folder"): lấy mọi file
    // NẰM DƯỚI thư mục đó (kể cả cấp sâu hơn). So sánh prefix + đúng ký tự
    // phân cách ngay sau — tránh "E:\Nhac" khớp nhầm "E:\Nhac cu".
    if (selectedPath && activeMasterTab === 'library') {
      list = list.filter(
        (a) =>
          a.path.length > selectedPath.length &&
          a.path.startsWith(selectedPath) &&
          (a.path[selectedPath.length] === '\\' || a.path[selectedPath.length] === '/'),
      )
    }
    if (q) list = list.filter((a) => (lowerById.get(a.id) ?? '').includes(q))

    const dir = sortDesc ? -1 : 1
    return [...list].sort((a, b) => {
      // Yêu thích luôn ưu tiên ghim lên đầu
      if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1
      if (sortBy === 'size') return (a.fileSize - b.fileSize) * dir
      if (sortBy === 'date') return (a.dateAdded - b.dateAdded) * dir
      if (sortBy === 'duration') return ((a.duration || 0) - (b.duration || 0)) * dir
      if (sortBy === 'type') return a.type.localeCompare(b.type) * dir
      return a.name.localeCompare(b.name) * dir
    })
  }, [
    assets,
    lowerById,
    filter,
    deferredSearch,
    selectedPath,
    onlyFavorites,
    sortBy,
    sortDesc,
    activeMasterTab,
    selectedPowerBinFolderId,
    selectedBrandId,
    powerBinFolders,
  ])

  /**
   * [1.3.0] Đổ ra dần, không đổ hết một lúc.
   *
   * VÌ SAO: thư viện thật 91.256 asset xếp 3 cột = ~30.400 hàng ≈ 4,5 TRIỆU px
   * chiều cao, trong khi thanh cuộn của panel dock chỉ cao 411px. Ép 4,5 triệu
   * vào 411 nghĩa là kéo thanh cuộn nhích 1px = trôi qua 74 hàng = 222 asset.
   * Chuột không kéo nổi "một phần tư pixel" nên nó buộc phải nhảy cóc — đúng
   * cái chủ dự án thấy: "thanh scroll bên phải nó giật và nhảy".
   *
   * Đây là TOÁN HỌC, không phải lỗi ảo hoá. Ảo hoá đã chạy đúng (xem 1.2.1).
   * Cách duy nhất chữa được là làm danh sách NGẮN LẠI.
   *
   * Cách làm bám theo hai thao tác thật của người dựng phim:
   *  - CUỘN TỪ TỪ ĐỂ NHÌN -> không được gặp rào cản nào. Nên KHÔNG có nút
   *    "Xem thêm" để bấm: cuộn gần tới cuối là tự nạp tiếp, lưới chảy liền mạch.
   *  - TÌM BẰNG Ô SEARCH -> phải tìm trong TOÀN BỘ thư viện. Giới hạn này cắt ở
   *    `visible` (đã lọc xong), KHÔNG cắt ở `assets`, nên gõ tìm vẫn quét hết
   *    91.256 asset rồi mới cắt phần hiển thị.
   */
  const [limit, setLimit] = useState(PAGE)

  // Cuộn về đầu khi đổi điều kiện lọc — và đổ lại từ trang đầu.
  useEffect(() => {
    if (el) el.scrollTop = 0
    setScrollTop(0)
    setLimit(PAGE)
  }, [filter, search, selectedPath, onlyFavorites, activeMasterTab, selectedPowerBinFolderId, el])

  /** Phần thật sự đưa vào lưới. Cắt SAU khi đã lọc + sắp xếp. */
  const shown = limit >= visible.length ? visible : visible.slice(0, limit)

  // ── Tính toán lưới (chỉ khi đã đo được bề rộng) ─────────
  const measured = size.w > 0
  const cols = measured
    ? Math.max(1, Math.round((size.w + GAP) / (minColW + GAP)))
    : 1
  const cardW = measured ? (size.w - (cols - 1) * GAP) / cols : minColW
  const cardH = Math.round((cardW * 10) / 16) + INFO_H
  const rowH = cardH + GAP
  const rows = Math.ceil(shown.length / cols)

  const startRow = Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN)
  const endRow = Math.min(
    rows,
    Math.ceil((scrollTop + (size.h || 600)) / rowH) + OVERSCAN,
  )
  const slice = measured ? shown.slice(startRow * cols, endRow * cols) : []

  /**
   * Cuộn gần chạm đáy -> đổ thêm một trang, KHÔNG bắt bấm nút.
   *
   * Ngưỡng 2 hàng: nạp trước khi người dùng nhìn thấy đáy, nên lướt từ từ là
   * lưới chảy liền mạch, không bao giờ cụt giữa chừng.
   *
   * Không sợ lặp vô hạn: `setLimit` làm `shown` dài ra -> `rows` tăng ->
   * `endRow` lại nhỏ hơn `rows - 2` -> điều kiện tắt. Khi đã đổ hết
   * `visible.length` thì `limit < visible.length` là false, dừng hẳn.
   */
  useEffect(() => {
    if (!measured) return
    if (limit >= visible.length) return
    if (endRow >= rows - 2) setLimit((l) => l + PAGE)
  }, [measured, endRow, rows, limit, visible.length])

  // [0.10.0] Báo cho hàng đợi nền biết asset nào ĐANG TRONG TẦM NHÌN — chúng
  // được xử lý thumbnail/waveform/preview TRƯỚC, thay vì chờ đến lượt tuần tự.
  const sliceIdsKey = slice.map((a) => a.id).join(',')
  useEffect(() => {
    setQueuePriorityIds(sliceIdsKey ? sliceIdsKey.split(',') : [])
  }, [sliceIdsKey])

  /** Nội dung đặc biệt (lỗi / đang quét / rỗng) — render BÊN TRONG vùng cuộn
   *  để phép đo kích thước luôn hoạt động. */
  let overlay: React.ReactNode = null
  if (error) {
    overlay = <div className="state state--error">{error}</div>
  } else if (scanning && assets.length === 0) {
    overlay = (
      <div className="state">
        {dich('Đang quét…')} <b>{scanCount}</b> {dich('file')}
      </div>
    )
  } else if (assets.length === 0) {
    overlay = (
      <div className="state state--empty">
        <div className="state__icon">
          <IconFile size={34} />
        </div>
        <p className="state__title">{dich('Chưa có asset nào')}</p>
        <p className="state__hint">
          {dich('Bấm')} <b>{dich('Thêm thư mục')}</b>{' '}
          {dich('ở thanh trên để quét asset trên máy (video, Mogrt, âm thanh, ảnh).')}
        </p>
      </div>
    )
  } else if (visible.length === 0) {
    if (activeMasterTab === 'powerbin') {
      // ĐÂY là nơi DUY NHẤT giải thích trạng thái của Power Bins. Menu trái cố ý
      // không lặp lại lời hướng dẫn — hai chỗ cùng nói một điều thì mắt phải đọc
      // hai lần mới biết chúng giống nhau.
      overlay = brands.length === 0 ? (
        <div className="state state--empty">
          <div className="state__icon"><IconZap size={34} /></div>
          <p className="state__title">{dich('Chưa có brand nào')}</p>
          <p className="state__hint">
            {dich(
              'Brand là bộ nhận diện dùng lại ở mọi dự án: logo, intro, nhạc nền… Tạo brand đầu tiên bằng nút',
            )}{' '}
            <b>{dich('Tạo brand')}</b> {dich('ở menu bên trái.')}
          </p>
        </div>
      ) : (
        <div className="state state--empty">
          <div className="state__icon"><IconZap size={34} /></div>
          <p className="state__title">{dich('Khay này chưa có gì')}</p>
          <p className="state__hint">
            {dich(
              'Chọn một khay ở menu bên trái, hoặc gán asset vào khay để dùng chung cho mọi dự án.',
            )}
          </p>
        </div>
      )
    } else {
      overlay = (
        <div className="state state--empty">
          <div className="state__icon">
            <IconSearch size={34} />
          </div>
          <p className="state__title">{dich('Không tìm thấy asset nào')}</p>
          <p className="state__hint">{dich('Thử đổi từ khoá hoặc chọn loại asset khác.')}</p>
        </div>
      )
    }
  }

  const canDrop = activeMasterTab === 'powerbin' && !!selectedPowerBinFolderId

  const onDragOver = (e: React.DragEvent) => {
    if (activeMasterTab !== 'powerbin') return
    e.preventDefault()
    setDragOver(true)
  }

  const onDrop = (e: React.DragEvent) => {
    if (activeMasterTab !== 'powerbin') return
    e.preventDefault()
    setDragOver(false)

    if (!selectedPowerBinFolderId) {
      showToast(dich('Chọn một khay ở menu bên trái trước đã.'))
      return
    }

    const paths = filesFromDropEvent(e.nativeEvent as DragEvent)
    if (paths.length === 0) {
      showToast(dich('Không đọc được đường dẫn file. Kéo thả chỉ chạy khi mở trong Premiere.'))
      return
    }

    const added = addPathsToPowerBin(selectedPowerBinFolderId, paths)
    if (added > 0) showToast(`Đã thêm ${added} file vào khay`)
    else showToast(dich('Các file này đã có trong khay rồi'))
  }

  return (
    <>
      <div
        className={`grid-scroll ${dragOver ? 'grid-scroll--dragover' : ''}`}
        ref={setEl}
        onScroll={onScroll}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {filter === 'audio' && <AudioPreviewBar />}

        {/* Chỉ nhắc khi ĐÃ chọn khay — lúc đó câu này nói điều mới (kéo-thả được).
            Khi chưa chọn khay, màn hình rỗng bên dưới đã nói đúng việc cần làm,
            nhắc thêm ở đây là lặp lại. */}
        {activeMasterTab === 'powerbin' && canDrop && (
          <div className="dropzone-hint">
            {dich(
              'Kéo file từ Explorer vào đây, hoặc chọn clip trên timeline rồi bấm “Thêm từ timeline”.',
            )}
          </div>
        )}

        {scanning && assets.length > 0 && (
          <div className="scan-banner">
            {dich('Đang quét thêm…')} {scanCount} {dich('file')}
          </div>
        )}

        {overlay ?? (
          <>
          {/* Khung có tổng chiều cao thật để thanh cuộn đúng tỉ lệ */}
          <div style={{ height: rows * rowH, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: startRow * rowH,
                left: 0,
                right: 0,
                display: 'grid',
                // minmax(0,1fr) — bắt buộc: '1fr' không co nhỏ hơn nội dung,
                // nên một tên file dài sẽ banh rộng cột đó và làm lệch cả lưới.
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: GAP,
              }}
            >
              {slice.map((a) => (
                <div key={a.id} style={{ height: cardH }}>
                  <AssetCard asset={a} />
                </div>
              ))}
            </div>
          </div>
          {/**
            * Cho biết còn nữa. Không có nút bấm ở đây là CỐ Ý: cuộn tới gần đáy
            * là lưới tự đổ tiếp, dòng này chỉ để người dùng khỏi tưởng thư viện
            * chỉ có bấy nhiêu khi họ kéo thanh cuộn xuống hết.
            */}
          {limit < visible.length && (
            <div className="grid-more">
              {dich('Đang xem')} {shown.length.toLocaleString()} {dich('trong')}{' '}
              {visible.length.toLocaleString()} {dich('— cuộn tiếp để xem thêm')}
            </div>
          )}
          </>
        )}
      </div>

      <BottomDock />
    </>
  )
}
