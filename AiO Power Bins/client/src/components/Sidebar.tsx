/**
 * Sidebar.tsx — menu trái. Nhiệm vụ DUY NHẤT: điều hướng.
 *
 * Cố ý KHÔNG có: cây cấu trúc thư mục, mục nhãn màu, và nút "thêm thư mục"
 * thứ hai/thứ ba (hành động chính đã nằm ở thanh trên — mỗi màn hình chỉ
 * nên có một CTA chính).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { dich } from '../ngonngu'
import { useLibrary } from '../state/store'
import type { Asset, AssetFilter, AssetType } from '../types'
import PowerBinHub from './PowerBinHub'
import {
  IconClose,
  IconHeart,
  IconFolder,
  IconRefresh,
  IconGridMedium,
  IconFilm,
  IconLayers,
  IconMusic,
  IconImage,
  IconZap,
} from './Icons'

/** Giới hạn bề rộng menu trái khi kéo. */
const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 460
const SIDEBAR_KEY = 'aio.sidebarW'

/**
 * [0.18.0] Kéo mép phải để nới rộng menu trái.
 *
 * Tên thư mục thật rất dài ("CB - Sound Effects Pack Vol 2…") nên ở bề rộng cố
 * định 204px thì cắt cụt gần hết, không phân biệt được các pack với nhau. Bề
 * rộng ghi vào localStorage nên mở panel lần sau vẫn giữ.
 */
function useSidebarResize() {
  const drag = useRef({ x: 0, w: 0 })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved) document.documentElement.style.setProperty('--sidebar-w', saved)
    } catch {
      /* không đọc được thì dùng mặc định */
    }
  }, [])

  const currentWidth = (): number => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')
    return parseInt(raw, 10) || 204
  }

  const applyWidth = (w: number) => {
    const clamped = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w)))
    document.documentElement.style.setProperty('--sidebar-w', `${clamped}px`)
    try {
      localStorage.setItem(SIDEBAR_KEY, `${clamped}px`)
    } catch {
      /* bỏ qua */
    }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    drag.current = { x: e.clientX, w: currentWidth() }
    const move = (ev: MouseEvent) => applyWidth(drag.current.w + (ev.clientX - drag.current.x))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.classList.remove('is-resizing')
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    document.body.classList.add('is-resizing')
  }

  // Bàn phím: mọi thứ kéo được cũng phải chỉnh được bằng phím mũi tên.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 12
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      applyWidth(currentWidth() - step)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      applyWidth(currentWidth() + step)
    }
  }

  return { onMouseDown, onKeyDown }
}

/** Mũi tên gập/mở — xoay khi mở. */
function Caret({ open }: { open: boolean }) {
  return (
    <svg
      className={`nav-caret ${open ? 'nav-caret--open' : ''}`}
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.5L10.5 8L6 12.5" />
    </svg>
  )
}

/** Một thư mục con cấp 1 (dưới thư mục gốc đã quét) chứa asset của một loại. */
interface SubfolderRow {
  /** Đường dẫn tuyệt đối của thư mục con — dùng làm khoá lọc. */
  key: string
  /** Tên hiển thị (tên folder, như khi mở trong Explorer). */
  name: string
  /** Thư mục GỐC đã quét chứa nó — cần cho quét lại riêng từng phần. */
  root: string
  /** Số asset THUỘC LOẠI ĐANG XEM trong thư mục này — con số hiện trên menu. */
  count: number
  /**
   * [1.3.1] Tổng asset MỌI LOẠI trong cùng thư mục đó.
   *
   * Chỉ dùng cho chú thích khi rê chuột. Vì sao cần: menu gom theo LOẠI, nên
   * đứng ở mục "Âm thanh" thì pack "1200+ Transitions" hiện **64** — đúng, đó là
   * số file âm thanh. Nhưng thư mục thật có **3.866** file (2.757 ảnh + 1.022
   * video + 64 âm thanh + 23 preset). Chủ dự án đã hiểu nhầm 64 là toàn bộ thư
   * mục, rồi thấy hàng đợi render báo 258 thì tưởng panel làm gì mờ ám.
   *
   * Lý do phải rõ ràng (chủ dự án 28/07): *"nếu mình không rõ ràng, editor sẽ
   * hiểu là render gian dối, ngốn tài nguyên"*.
   */
  totalAll: number
}

/** Không đi sâu quá mức này — tên thư mục cấp 5 thì menu không đọc nổi nữa. */
const MAX_SUB_DEPTH = 4

/**
 * Gom asset theo THƯ MỤC CON dưới mỗi thư mục gốc đã quét, tách theo loại —
 * để menu hiện "list như trong folder" (vd E:\D\Music có SFX/Cinematic…).
 *
 * [0.17.1] BỎ QUA CÁC CẤP "ĐI XUYÊN". Bản cũ luôn lấy đúng cấp 1, nên với thư
 * viện thật của dự án, mục Âm thanh chỉ hiện MỘT dòng duy nhất:
 *     Âm thanh 2138  ->  Overlay Video 2138
 * vì cả 2.138 file .wav đều nằm sâu trong
 *     ...\Overlay Video\UV BUNDLE\2000+ Cinematic Sound Effects\...
 * (bộ Envato nhét SFX vào trong thư mục tên "Overlay Video"). Dòng đó vừa vô
 * dụng để đi lại — nó chứa 100% số file — vừa đọc như báo sai loại.
 *
 * Nay: khi một cấp chỉ có ĐÚNG MỘT thư mục và mọi file còn nằm sâu hơn nữa,
 * cấp đó không chia được gì cả nên đi tiếp xuống cấp sau. Với thư viện trên,
 * menu thành "2000+ Cinematic Sound Effects (2074)" và "1200+ Transitions (64)"
 * — đúng thứ người dùng cần bấm. Đường dẫn đầy đủ vẫn nằm ở tooltip.
 *
 * Một lượt duyệt cho MỌI loại; memo theo assets.
 */
function buildSubfolders(assets: Asset[]): Map<AssetType, SubfolderRow[]> {
  /** Một file đã tách sẵn phần đường dẫn tương đối. */
  interface Item {
    parts: string[]
    path: string
    /** Vị trí trong `path` nơi phần tương đối bắt đầu. */
    relStart: number
  }

  /**
   * Vị trí dấu phân cách thứ `n` (1-based) trong chuỗi, -1 nếu không đủ.
   * Dùng ĐẾM TRÊN CHUỖI GỐC thay vì cộng độ dài các phần đã tách — cách cộng
   * độ dài sẽ lệch khi đường dẫn có hai dấu phân cách liền nhau.
   */
  const nthSep = (s: string, n: number): number => {
    let count = 0
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (c === '\\' || c === '/') {
        count++
        if (count === n) return i
      }
    }
    return -1
  }

  // 1. Gom theo loại -> thư mục gốc (mỗi gốc tự quyết định độ sâu của mình).
  const byType = new Map<AssetType, Map<string, Item[]>>()
  for (const a of assets) {
    const root = a.folder
    if (!root || a.path.length <= root.length) continue
    let relStart = root.length
    const first = a.path[relStart]
    if (first === '\\' || first === '/') relStart++
    const rel = a.path.slice(relStart)
    const parts = rel.split(/[\\/]/).filter(Boolean)
    if (parts.length < 2) continue // file nằm ngay tại gốc -> không tạo mục con

    let roots = byType.get(a.type)
    if (!roots) {
      roots = new Map()
      byType.set(a.type, roots)
    }
    const item: Item = { parts, path: a.path, relStart }
    const arr = roots.get(root)
    if (arr) arr.push(item)
    else roots.set(root, [item])
  }

  const out = new Map<AssetType, SubfolderRow[]>()

  for (const [type, roots] of byType) {
    const rows = new Map<string, SubfolderRow>()

    for (const [root, items] of roots) {
      // 2. Tìm cấp đầu tiên THẬT SỰ chia được danh sách ra làm nhiều nhánh.
      let depth = 1
      while (depth < MAX_SUB_DEPTH) {
        const keys = new Set<string>()
        let allDeeper = true
        for (const it of items) {
          if (it.parts.length <= depth) {
            // Có file nằm ngay trong thư mục này -> đây là thư mục thật sự
            // chứa đồ, không phải cấp đi xuyên. Dừng.
            allDeeper = false
            break
          }
          keys.add(it.parts.slice(0, depth).join('/'))
        }
        if (!allDeeper || keys.size > 1) break
        depth++
      }

      // 3. Dựng dòng menu ở cấp đã chọn. Khoá cắt TRÊN CHUỖI GỐC (giữ nguyên
      //    dấu phân cách của Windows) vì Grid lọc theo tiền tố đường dẫn.
      for (const it of items) {
        if (it.parts.length <= depth) continue
        const rel = it.path.slice(it.relStart)
        const cut = nthSep(rel, depth)
        if (cut <= 0) continue
        const key = it.path.slice(0, it.relStart + cut)
        const row = rows.get(key)
        if (row) row.count++
        else rows.set(key, { key, name: it.parts[depth - 1], root, count: 1, totalAll: 0 })
      }
    }

    out.set(
      type,
      [...rows.values()].sort((x, y) => x.name.localeCompare(y.name, 'vi')),
    )
  }

  /**
   * [1.3.1] Đếm tổng MỌI LOẠI cho từng thư mục đã dựng ở trên.
   *
   * Duyệt toàn bộ asset đúng MỘT lượt, mỗi asset chỉ thử tối đa 4 cấp thư mục
   * (`MAX_SUB_DEPTH`) rồi tra vào tập khoá đã có — O(asset × 4). Cách ngây thơ
   * là với mỗi thư mục lại lọc lại cả danh sách, thành O(asset × số thư mục),
   * chạy trên 28.892 asset và hàng trăm thư mục thì đủ làm menu khựng.
   */
  const allKeys = new Set<string>()
  for (const rows of out.values()) for (const r of rows) allKeys.add(r.key)

  const totalByKey = new Map<string, number>()
  for (const a of assets) {
    const root = a.folder
    if (!root || a.path.length <= root.length) continue
    let relStart = root.length
    const first = a.path[relStart]
    if (first === '\\' || first === '/') relStart++
    const rel = a.path.slice(relStart)
    for (let d = 1; d <= MAX_SUB_DEPTH; d++) {
      const cut = nthSep(rel, d)
      if (cut <= 0) break
      const key = a.path.slice(0, relStart + cut)
      if (allKeys.has(key)) totalByKey.set(key, (totalByKey.get(key) ?? 0) + 1)
    }
  }
  for (const rows of out.values()) {
    for (const r of rows) r.totalAll = totalByKey.get(r.key) ?? r.count
  }

  return out
}

/**
 * Nhãn loại asset. Quy ước: CHỈ viết hoa chữ cái đầu, không viết hoa toàn bộ và
 * không thêm hậu tố ("Clips", "Templates", "& Nhạc"...) — nhãn ngắn để quét mắt
 * nhanh, và viết hoa đồng bộ với mọi nhãn khác trong menu.
 *
 * ☠️ ĐỪNG bọc `dich()` vào chính mảng này. Hằng tầng module chạy lúc IMPORT,
 * trước khi React gắn bảng chữ -> tiếng Việt bị đóng cứng vĩnh viễn, đổi ngôn
 * ngữ không bao giờ ăn. Bọc ở CHỖ VẼ RA: `{dich(label)}` bên dưới.
 */
const TYPE_ITEMS: {
  key: AssetFilter
  label: string
  Icon: (p: { size?: number }) => JSX.Element
}[] = [
  { key: 'video', label: 'Video', Icon: IconFilm },
  { key: 'mogrt', label: 'Mogrt', Icon: IconLayers },
  { key: 'audio', label: 'Âm thanh', Icon: IconMusic },
  { key: 'image', label: 'Hình ảnh', Icon: IconImage },
  { key: 'preset', label: 'Preset', Icon: IconZap },
]

export default function Sidebar() {
  const assets = useLibrary((s) => s.assets)
  const folders = useLibrary((s) => s.folders)
  const filter = useLibrary((s) => s.filter)
  const setFilter = useLibrary((s) => s.setFilter)
  const onlyFavorites = useLibrary((s) => s.onlyFavorites)
  const toggleOnlyFavorites = useLibrary((s) => s.toggleOnlyFavorites)
  const removeFolder = useLibrary((s) => s.removeFolder)

  const selectedPath = useLibrary((s) => s.selectedPath)
  const setSelectedPath = useLibrary((s) => s.setSelectedPath)
  const scanning = useLibrary((s) => s.scanning)
  const rescanPath = useLibrary((s) => s.rescanPath)
  const activeMasterTab = useLibrary((s) => s.activeMasterTab)

  const [showFolders, setShowFolders] = useState(false)
  /**
   * [0.17.1] Loại nào đang bị THU GỌN (đã chọn nhưng người dùng cụp danh sách
   * thư mục con lại). Bấm lần đầu = mở loại đó ra; bấm lại chính nó = cụp vào.
   * Trước đây bấm lại không có phản ứng gì, trông như nút bị kẹt.
   */
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const resize = useSidebarResize()

  // [0.10.0] Đếm MỘT lượt duyệt cho mọi loại + yêu thích. Bản cũ gọi
  // assets.filter() riêng cho từng dòng menu (5 lượt × 15.000 phần tử),
  // không memo, chạy lại cả khi đang gõ tìm kiếm.
  const { favCount, countByType } = useMemo(() => {
    const byType = new Map<string, number>()
    let fav = 0
    for (const a of assets) {
      byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
      if (a.favorite) fav++
    }
    return { favCount: fav, countByType: byType }
  }, [assets])

  const countOf = (f: AssetFilter) =>
    f === 'all' ? assets.length : countByType.get(f) ?? 0

  /** Thư mục con cấp 1 theo loại — "list như trong folder" của chủ dự án. */
  const subfoldersByType = useMemo(() => buildSubfolders(assets), [assets])

  const allActive = filter === 'all' && !onlyFavorites

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {activeMasterTab === 'powerbin' ? (
          <PowerBinHub />
        ) : (
          <>
            <div className="nav-section">{dich('Tổng quan')}</div>

            <button
              type="button"
              className={`nav-item ${allActive ? 'nav-item--active' : ''}`}
              aria-pressed={allActive}
              onClick={() => {
                setFilter('all')
                setSelectedPath('')
                if (onlyFavorites) toggleOnlyFavorites()
              }}
            >
              <IconGridMedium size={13} />
              <span className="nav-label">{dich('Tất cả asset')}</span>
              <span className="nav-count">{assets.length.toLocaleString()}</span>
            </button>

            <button
              type="button"
              className={`nav-item ${onlyFavorites ? 'nav-item--active' : ''}`}
              aria-pressed={onlyFavorites}
              onClick={() => {
                if (!onlyFavorites) toggleOnlyFavorites()
              }}
            >
              <span className="nav-heart">
                <IconHeart size={13} filled={onlyFavorites} />
              </span>
              <span className="nav-label">{dich('Yêu thích')}</span>
              <span className="nav-count">{favCount}</span>
            </button>

            <div className="nav-section">{dich('Loại asset')}</div>
            {TYPE_ITEMS.map(({ key, label, Icon }) => {
              const active = filter === key && !onlyFavorites
              const subs = subfoldersByType.get(key as AssetType) ?? []
              const open = active && subs.length > 0 && !collapsed.has(key)
              return (
                <div key={key}>
                  <button
                    type="button"
                    className={`nav-item ${active ? 'nav-item--active' : ''}`}
                    aria-pressed={active}
                    aria-expanded={open}
                    title={
                      subs.length === 0
                        ? undefined
                        : open
                          ? `Bấm lần nữa để thu gọn ${subs.length} thư mục`
                          : `Bấm để xổ ${subs.length} thư mục bên trong`
                    }
                    onClick={() => {
                      // Bấm lại chính mục đang mở = cụp danh sách thư mục con.
                      // Bấm sang mục khác = chuyển loại và mở nó ra.
                      const next = new Set(collapsed)
                      if (active) {
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                      } else {
                        next.delete(key)
                      }
                      setCollapsed(next)

                      setFilter(key)
                      setSelectedPath('')
                      if (onlyFavorites) toggleOnlyFavorites()
                    }}
                  >
                    <Icon size={13} />
                    <span className="nav-label">{dich(label)}</span>
                    <span className="nav-count">{countOf(key)}</span>
                    {/* Mũi tên cho biết mục này XỔ RA ĐƯỢC — không có nó thì
                        không ai đoán được bấm vào sẽ có thư mục con hiện ra. */}
                    {subs.length > 0 && <Caret open={open} />}
                  </button>

                  {/* Danh sách thư mục con — "như trong folder" (vd E:\D\Music).
                      Chỉ xổ dưới mục ĐANG chọn để menu không dài vô tận.
                      Là div role=button vì bên trong có nút Quét lại riêng —
                      nút lồng trong nút là HTML không hợp lệ. */}
                  {open &&
                    subs.map((sf) => {
                      const on = selectedPath === sf.key
                      const toggle = () => setSelectedPath(on ? '' : sf.key)
                      return (
                        <div
                          key={sf.key}
                          className={`nav-sub ${on ? 'nav-sub--active' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-pressed={on}
                          /**
                           * [1.3.1] Nói rõ con số bên cạnh đang đếm CÁI GÌ.
                           *
                           * Menu gom theo LOẠI, nên đứng ở mục "Âm thanh" thì
                           * pack "1200+ Transitions" hiện 64 — đúng, nhưng đó
                           * là 64 FILE ÂM THANH, còn cả thư mục có 3.866 file.
                           * Chủ dự án đã hiểu 64 là toàn bộ thư mục, rồi thấy
                           * hàng đợi báo 258 thì tưởng panel làm gì mờ ám:
                           * *"nếu mình không rõ ràng, editor sẽ hiểu là render
                           * gian dối, ngốn tài nguyên"*.
                           */
                          title={
                            sf.totalAll > sf.count
                              ? `${sf.count.toLocaleString()} ${dich(label).toLowerCase()} — cả thư mục có ${sf.totalAll.toLocaleString()} file mọi loại\n${sf.key}`
                              : `${sf.count.toLocaleString()} ${dich(label).toLowerCase()}\n${sf.key}`
                          }
                          onClick={toggle}
                          onKeyDown={(e) => {
                            if (e.target !== e.currentTarget) return
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              toggle()
                            }
                          }}
                        >
                          <IconFolder size={11} />
                          <span className="nav-label">{sf.name}</span>
                          <span className="nav-count">{sf.count}</span>
                          <button
                            className="nav-sub__refresh"
                            title={`Quét lại riêng thư mục ${sf.name}`}
                            aria-label={`Quét lại riêng thư mục ${sf.name}`}
                            disabled={scanning}
                            onClick={(e) => {
                              e.stopPropagation()
                              void rescanPath(sf.key, sf.root)
                            }}
                          >
                            <IconRefresh size={11} />
                          </button>
                        </div>
                      )
                    })}
                </div>
              )
            })}
          </>
        )}
      </nav>

      {/* Nguồn thư mục đã thêm + Cài đặt — chỉ ở Asset Manager */}
      {activeMasterTab === 'library' && (
        <div className="sidebar__foot">
          <div className="sidebar__foot-row">
            <button
              className="foot-toggle"
              onClick={() => setShowFolders(!showFolders)}
              aria-expanded={showFolders}
            >
              <Caret open={showFolders} />
              <span>{dich('Nguồn đã thêm')}</span>
              <span className="nav-count">{folders.length}</span>
            </button>

          </div>

          {showFolders && (
            <div className="foot-list">
              {folders.length === 0 ? (
                <div className="nav-empty">{dich('Chưa có thư mục nào')}</div>
              ) : (
                folders.map((f) => (
                  <div className="foot-row" key={f} title={f}>
                    <span className="foot-row__path">{f}</span>
                    <button
                      className="foot-row__del"
                      title={dich('Gỡ thư mục khỏi thư viện')}
                      aria-label={`Gỡ thư mục ${f}`}
                      onClick={() => removeFolder(f)}
                    >
                      <IconClose size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Mép kéo — nằm sát viền phải của menu. */}
      <div
        className="sidebar__resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label={dich('Kéo để đổi bề rộng menu (hoặc dùng phím mũi tên trái/phải)')}
        tabIndex={0}
        title={dich('Kéo để xem tên thư mục dài')}
        onMouseDown={resize.onMouseDown}
        onKeyDown={resize.onKeyDown}
      />
    </aside>
  )
}
