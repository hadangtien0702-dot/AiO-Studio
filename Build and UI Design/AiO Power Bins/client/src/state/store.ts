/**
 * store.ts — trạng thái thư viện asset (zustand).
 */
import { create } from 'zustand'
import { dich } from '../ngonngu'
import type { Asset, AssetFilter, SortBy, Tag, AppSettings, Brand, PowerBinFolder, AssetPack } from '../types'
import { scanFolder, assetsFromPaths } from '../services/scanner'
import { getSelectedTimelineClipPaths } from '../services/timelineImport'
import { loadLibrary, saveLibrary, LIBRARY_VERSION } from '../services/library'
import { pickFolder, importToTimeline, importMogrt } from '../lib/cep'
import { nodeAvailable } from '../lib/node'
import { startMediaServer } from '../services/mediaServer'
import { startBackgroundProcessing, stopBackgroundProcessing } from '../services/jobQueue'
import { clearCache, clearOrphanCache } from '../services/cacheService'
import { pruneMissingCachePaths } from '../services/cacheAudit'
import { moveCacheTo } from '../services/cacheMove'

/** Không gian làm việc đang mở. 'home' là màn hình chọn lúc mới mở panel. */
export type MasterTab = 'home' | 'library' | 'powerbin'

interface LibraryState {
  assets: Asset[]
  folders: string[]
  filter: AssetFilter
  scanning: boolean
  scanCount: number
  error: string
  mediaReady: boolean
  toast: string
  /** Tiến độ hàng đợi xử lý nền Phase 2 (FFmpeg thumbnail/waveform/metadata). */
  queueProgress: { total: number; done: number } | null

  // ── Tuỳ chọn hiển thị & Cài đặt ─────────────────────
  muted: boolean
  /** Mức âm lượng khi xem thử (0.0 đến 1.0). */
  volume: number
  /**
   * Cao độ khi NGHE THỬ audio, tính bằng nửa cung (-12…+12; 0 = nguyên bản).
   * Chỉ đổi lúc nghe thử, KHÔNG ghi vào file và không ảnh hưởng file chèn
   * vào timeline. Kiểu tape/varispeed: đổi cao độ thì tốc độ đổi theo.
   */
  pitch: number
  cardSize: 'M' | 'L'
  /** Từ khoá tìm kiếm. */
  search: string
  /** Nhánh thư mục đang chọn ở menu trái ('' = tất cả). */
  selectedPath: string
  /** Tag màu đang chọn để lọc ('', 'red', 'green'...). */
  selectedTagId: string
  /** Danh sách nhãn màu sắc. */
  tags: Tag[]
  /** Cài đặt ứng dụng. */
  settings: AppSettings
  /**
   * Asset được TRỎ TỚI gần nhất (rê chuột hoặc Tab vào thẻ).
   * Giữ lại cả sau khi rời chuột — nhờ vậy người dùng rê xem một clip rồi đưa
   * chuột xuống bấm nút "Chèn" ở thanh dưới mà mục tiêu không bị mất.
   */
  activeAsset: Asset | null
  setActiveAsset: (a: Asset) => void
  /**
   * Asset đang được BẤM để xem/nghe ('' = không có).
   * Khác `activeAsset` ở chỗ: cái này do người dùng chủ động bấm, và nó tiếp
   * tục phát cả khi chuột đã rời thẻ. Mỗi lúc chỉ MỘT asset được phát.
   */
  pinnedId: string
  /**
   * Chính asset đang được bấm phát. Nút Import nhắm vào ĐÂY trước.
   *
   * [0.18.1] Vì sao cần: `activeAsset` đổi theo mỗi thẻ chuột đi ngang qua. Người
   * dùng bấm nghe bài A rồi đưa chuột xuống nút Import — trên đường đi chuột quét
   * qua vài thẻ khác, và Import chèn nhầm bài cuối cùng bị lướt qua.
   * Đã BẤM CHỌN thì lựa chọn đó thắng con chuột.
   */
  pinnedAsset: Asset | null
  setPinned: (id: string, asset?: Asset | null) => void
  /** Chỉ hiện asset yêu thích. */
  onlyFavorites: boolean
  sortBy: SortBy
  sortDesc: boolean

  // ── Không gian làm việc ───────────────────────────
  // 'home' = màn hình chọn (Asset Manager / Power Bins) hiện ra khi mở panel.
  activeMasterTab: MasterTab
  setActiveMasterTab: (tab: MasterTab) => void
  /** Cài đặt thuộc về cả tool nên mở được từ mọi màn hình -> để ở store. */
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // ── Brand Kit ─────────────────────────────────────
  brands: Brand[]
  /** Brand đang mở ('' = chưa chọn brand nào). */
  selectedBrandId: string
  createBrand: (name: string) => void
  renameBrand: (id: string, name: string) => void
  deleteBrand: (id: string) => void
  setSelectedBrandId: (id: string) => void

  // ── Power Bins ───────────────────────────────────────
  powerBinFolders: PowerBinFolder[]
  selectedPowerBinFolderId: string
  /**
   * [0.18.0] Gói Packs ĐÃ GỠ khỏi giao diện theo yêu cầu chủ dự án ("không còn
   * liên quan gì nữa"). Trường này GIỮ LẠI và vẫn được đọc/ghi nguyên vẹn xuống
   * `library.json` — xoá khỏi state là lần lưu kế tiếp sẽ ghi đè mất dữ liệu cũ
   * của người dùng, mà việc đó thì không lấy lại được.
   */
  packs: AssetPack[]
  selectedAssetIds: string[]

  createPowerBinFolder: (name: string) => void
  deletePowerBinFolder: (id: string) => void
  setSelectedPowerBinFolderId: (id: string) => void
  /** Thêm file (đường dẫn tuyệt đối) vào một khay. Trả về số file đã thêm mới. */
  addPathsToPowerBin: (binId: string, paths: string[]) => number
  /** Thêm clip ĐANG CHỌN trên timeline Premiere vào một khay. */
  addTimelineSelectionToPowerBin: (binId: string) => Promise<void>
  /** Bỏ asset khỏi khay Power Bin (file gốc trên đĩa không bị đụng tới). */
  removeFromPowerBin: (id: string) => void
  toggleSelectAsset: (id: string, isMulti: boolean) => void
  selectAllAssets: () => void
  clearSelectedAssets: () => void
  batchAssignTag: (tagId: string) => void
  toggleMuted: () => void
  setVolume: (v: number) => void
  setPitch: (semitones: number) => void
  setCardSize: (s: 'M' | 'L') => void
  setSearch: (q: string) => void
  setSelectedPath: (p: string) => void
  setSelectedTagId: (tagId: string) => void
  toggleAssetTag: (assetId: string, tagId: string) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  showToast: (msg: string) => void
  toggleOnlyFavorites: () => void
  setSort: (by: SortBy) => void
  toggleFavorite: (id: string) => void
  updateAsset: (id: string, patch: Partial<Asset>) => void
  /**
   * Như `updateAsset` nhưng GOM NHIỀU LẦN GỌI lại rồi áp một lượt.
   * Dành riêng cho hàng đợi nền — xem giải thích ở `schedulePatchFlush`.
   */
  updateAssetBatched: (id: string, patch: Partial<Asset>) => void
  setQueueProgress: (p: { total: number; done: number } | null) => void

  init: () => void
  initMedia: () => Promise<void>
  sendToTimeline: (asset: Asset) => Promise<void>
  setFilter: (f: AssetFilter) => void
  addFolder: () => Promise<void>
  rescan: () => Promise<void>
  /**
   * Quét lại MỘT thư mục con (không đụng phần còn lại của thư viện).
   * @param subPath    thư mục con cần quét lại (đường dẫn tuyệt đối)
   * @param parentRoot thư mục GỐC đã thêm chứa nó — asset quét ra vẫn ghi
   *                   folder = gốc để menu nhóm đúng cấp 1
   */
  rescanPath: (subPath: string, parentRoot: string) => Promise<void>
  removeFolder: (folder: string) => void
  /**
   * Xoá bộ nhớ đệm VÀ dọn đường dẫn đã trỏ tới file vừa xoá.
   * Thiếu bước dọn thì asset vẫn ghi thumbPath cũ -> thẻ hiện ảnh vỡ.
   */
  clearCacheAndReset: () => void
  /**
   * Chỉ dọn RÁC trong bộ nhớ đệm (file không asset nào còn dùng).
   * Không thẻ nào mất ảnh, không phải render lại gì.
   */
  cleanOrphanCache: () => { freedBytes: number; count: number }
  /** Chạy lại hàng đợi nền để sinh ảnh xem trước cho asset còn thiếu. */
  regeneratePreviews: () => void
  /**
   * Dừng hàng đợi đang chạy. Phần đã render giữ nguyên trên đĩa — dừng chỉ là
   * thôi nhận job mới, job đang dở vẫn chạy nốt cho khỏi để lại file cụt.
   */
  stopPreviewRender: () => void
  /**
   * Đổi chỗ lưu bộ nhớ đệm sang ổ khác: chuyển file + sửa đường dẫn trong thư
   * viện. Trả về câu thông báo kết quả để hộp Cài đặt hiển thị.
   */
  changeCacheLocation: () => void
  /**
   * Dọn đường dẫn ảnh/sóng âm/proxy đã trỏ tới file không còn trên đĩa, rồi
   * cho hàng đợi nền sinh lại. Gọi khi thẻ báo tải ảnh lỗi.
   */
  healBrokenPreviews: () => void
  clear: () => void
}

/**
 * Thẻ nào tải ảnh lỗi thì gọi `reportBrokenPreview()`. Nhiều thẻ cùng hỏng một
 * lúc là chuyện thường (vừa xoá cả thư mục cache), nên gom lại chạy MỘT lần
 * sau 600ms thay vì dọn 60 lần. Việc dọn chỉ tốn một lần đọc thư mục.
 */
let brokenTimer: any = null
export function reportBrokenPreview(): void {
  if (brokenTimer) return
  brokenTimer = setTimeout(() => {
    brokenTimer = null
    useLibrary.getState().healBrokenPreviews()
  }, 600)
}

/**
 * [0.18.0 - TỐI ƯU RENDER] Gom cập nhật của hàng đợi nền lại rồi áp MỘT LƯỢT.
 *
 * Vì sao: mỗi job xong gọi `updateAsset`, mà hàm đó `assets.map()` trên TOÀN BỘ
 * thư viện. Với 15.207 asset và ~7.000 job thì riêng việc dựng lại mảng đã là
 * hơn 100 triệu lượt ghi con trỏ. Nặng hơn nữa là mỗi lần `set({assets})` kéo
 * theo:
 *   - Grid: lọc + SẮP XẾP lại toàn bộ danh sách, và dựng lại Map 15.207 tên
 *     chữ thường (`lowerById`)
 *   - Sidebar: dựng lại cây thư mục con (duyệt 15.207 asset)
 *   - Toolbar: đếm lại số asset còn thiếu preview (duyệt 15.207 asset)
 * Tức là mỗi tấm thumbnail sinh ra kéo theo bốn lượt quét toàn thư viện. Đây
 * chính là thứ làm panel ì lúc đang render, không phải FFmpeg.
 *
 * Nay gom trong 400ms rồi áp một lần: 10-30 lượt/giây xuống còn 2,5 lượt/giây,
 * và mỗi lượt xử lý hàng chục asset thay vì một.
 */
const pendingPatches = new Map<string, Partial<Asset>>()
let patchTimer: any = null
const PATCH_FLUSH_MS = 400
/** Mốc lần báo tiến độ gần nhất — xem `setQueueProgress`. */
let lastProgressAt = 0

function flushPatches(): void {
  patchTimer = null
  if (pendingPatches.size === 0) return
  const patches = new Map(pendingPatches)
  pendingPatches.clear()

  const s = useLibrary.getState()
  const assets = s.assets.map((a) => {
    const p = patches.get(a.id)
    return p ? { ...a, ...p } : a
  })
  useLibrary.setState({ assets })
  persist(s.folders, assets)
}

function schedulePatchFlush(): void {
  if (patchTimer) return
  patchTimer = setTimeout(flushPatches, PATCH_FLUSH_MS)
}

/** Gộp assets mới vào cũ theo id, giữ lại cờ favorite của bản cũ. */
function mergeAssets(oldA: Asset[], newA: Asset[]): Asset[] {
  const byId = new Map<string, Asset>()
  for (const a of oldA) byId.set(a.id, a)
  for (const a of newA) {
    const prev = byId.get(a.id)
    byId.set(a.id, prev?.favorite ? { ...a, favorite: true } : a)
  }
  return Array.from(byId.values())
}

/**
 * Ghi TOÀN BỘ thư viện xuống đĩa từ một ảnh chụp state.
 *
 * Bắt buộc đi qua hàm này thay vì gọi saveLibrary() rời rạc: mỗi chỗ tự liệt kê
 * field là một chỗ để QUÊN field mới, và quên nghĩa là xoá sạch dữ liệu đó trên
 * đĩa (đã suýt mất `brands` vì createPack không liệt kê nó).
 */
function persistAll(s: {
  folders: string[]
  assets: Asset[]
  brands: Brand[]
  powerBinFolders: PowerBinFolder[]
  packs: AssetPack[]
}): void {
  saveLibrary({
    version: LIBRARY_VERSION,
    folders: s.folders,
    assets: s.assets,
    brands: s.brands,
    powerBinFolders: s.powerBinFolders,
    packs: s.packs,
  })
}

/**
 * Ghi thư viện xuống đĩa nhưng gộp nhiều lần gọi liên tiếp (file khá lớn).
 *
 * SỬA LỖI MẤT DỮ LIỆU (0.9.2-dev.1): trước đây hàm này ghi ĐÚNG `folders` +
 * `assets`, nên mỗi lần bấm tim / gán nhãn / quét xong / hàng đợi nền cập nhật
 * một asset là `powerBinFolders` và `packs` bị XOÁ SẠCH khỏi library.json.
 * Power Bin không sống nổi qua một lần mở lại panel. Nay lấy đủ mọi phần từ
 * state hiện tại.
 */
let saveTimer: any = null
/**
 * [0.18.0] Lần ghi đĩa THẬT gần nhất. Cần vì debounce thuần có một lỗ hổng:
 * hàng đợi nền cập nhật liên tục thì mốc 600ms bị dời đi mãi, và trong suốt
 * mấy tiếng render 15.000 asset panel KHÔNG ghi được lần nào. Premiere đóng
 * đột ngột là mất sạch công render. Nay quá 15 giây là ghi, dù còn bận.
 */
let lastSaveAt = 0
const MAX_SAVE_GAP = 15_000

function persist(folders: string[], assets: Asset[]) {
  const now = Date.now()
  if (lastSaveAt && now - lastSaveAt > MAX_SAVE_GAP) {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    lastSaveAt = now
    const s = useLibrary.getState()
    persistAll({
      folders,
      assets,
      brands: s.brands,
      powerBinFolders: s.powerBinFolders,
      packs: s.packs,
    })
    return
  }
  if (!lastSaveAt) lastSaveAt = now
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    lastSaveAt = Date.now()
    const s = useLibrary.getState()
    persistAll({
      folders,
      assets,
      brands: s.brands,
      powerBinFolders: s.powerBinFolders,
      packs: s.packs,
    })
    saveTimer = null
  }, 600)
}

export const useLibrary = create<LibraryState>((set, get) => ({
  assets: [],
  folders: [],
  filter: 'all',
  scanning: false,
  scanCount: 0,
  error: '',
  mediaReady: false,
  toast: '',
  queueProgress: null,

  // Mặc định BẬT tiếng: rê chuột vào audio/video là nghe được ngay.
  muted: false,
  volume: 0.8,
  pitch: 0,
  cardSize: 'M',
  search: '',
  selectedPath: '',
  selectedTagId: '',
  tags: [
    { id: 'red', name: 'Đỏ', color: '#ef6b6b' },
    { id: 'yellow', name: 'Vàng', color: '#f0be5e' },
    { id: 'green', name: 'Xanh lá', color: '#5ec294' },
    { id: 'blue', name: 'Xanh dương', color: '#6c9fff' },
    { id: 'purple', name: 'Tím', color: '#c49eff' },
  ],
  settings: {
    proxyQuality: '360p',
    defaultVolume: 0.8,
  },
  // [2.0.0] Panel này CHỈ còn Power Bins -> mở ra là vào thẳng cây Brand/Khay.
  // Asset Manager đã tách thành panel riêng, kho dữ liệu cũng riêng.
  activeMasterTab: 'powerbin',
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  activeAsset: null,
  setActiveAsset: (a) => {
    // Rê qua nhiều thẻ liên tiếp là chuyện thường -> chỉ ghi khi thật sự đổi,
    // tránh render lại thanh dưới mỗi lần chuột đi ngang một ô.
    if (get().activeAsset?.id !== a.id) set({ activeAsset: a })
  },
  pinnedId: '',
  pinnedAsset: null,
  setPinned: (id, asset) => set({ pinnedId: id, pinnedAsset: id ? asset ?? null : null }),
  onlyFavorites: false,
  sortBy: 'name',
  sortDesc: false,
  // Đổi không gian làm việc = dọn sạch mọi bộ lọc đang bám lại từ chỗ cũ,
  // nếu không người dùng sẽ thấy lưới trống mà không hiểu vì sao.
  setActiveMasterTab: (tab) => set({
    activeMasterTab: tab,
    selectedPowerBinFolderId: tab === 'powerbin' ? get().selectedPowerBinFolderId : '',
    selectedPath: tab === 'library' ? get().selectedPath : '',
    filter: 'all',
    onlyFavorites: false,
    selectedTagId: '',
    search: '',
    selectedAssetIds: [],
  }),

  brands: [],
  selectedBrandId: '',
  powerBinFolders: [],
  selectedPowerBinFolderId: '',
  packs: [],
  selectedAssetIds: [],

  // ── Brand Kit ──────────────────────────────────────────────────────────
  createBrand: (name: string) => {
    const brand: Brand = {
      id: `brand_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      dateCreated: Date.now(),
    }
    const brands = [...get().brands, brand]
    // Tạo xong thì MỞ LUÔN brand đó — người dùng vừa tạo là muốn thêm đồ vào.
    set({ brands, selectedBrandId: brand.id })
    persistAll(get())
    get().showToast(dich('Đã tạo brand: {ten}').replace('{ten}', () => name))
  },

  renameBrand: (id: string, name: string) => {
    const brands = get().brands.map((b) => (b.id === id ? { ...b, name } : b))
    set({ brands })
    persistAll(get())
  },

  /**
   * Xoá brand nhưng KHÔNG xoá khay bên trong — khay chỉ được gỡ khỏi brand và
   * trở thành khay chung. Asset của người dùng không bao giờ bị mất theo một
   * thao tác dọn dẹp.
   */
  deleteBrand: (id: string) => {
    const brands = get().brands.filter((b) => b.id !== id)
    const powerBinFolders = get().powerBinFolders.map((f) =>
      f.brandId === id ? { ...f, brandId: undefined } : f,
    )
    set({
      brands,
      powerBinFolders,
      selectedBrandId: get().selectedBrandId === id ? '' : get().selectedBrandId,
    })
    persistAll(get())
    get().showToast(dich('Đã xoá brand. Các khay bên trong được giữ lại ở mục Khay chung.'))
  },

  setSelectedBrandId: (id: string) => {
    // Đổi brand thì bỏ khay đang chọn của brand cũ, nếu không lưới sẽ hiện đồ
    // của brand khác mà người dùng không hiểu vì sao.
    set({ selectedBrandId: id, selectedPowerBinFolderId: '', selectedAssetIds: [] })
  },

  // ── Power Bins ─────────────────────────────────────────────────────────
  createPowerBinFolder: (name: string) => {
    const newFolder: PowerBinFolder = {
      id: `bin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      dateCreated: Date.now(),
      // Đang mở brand nào thì khay mới thuộc brand đó.
      brandId: get().selectedBrandId || undefined,
    }
    const updated = [...get().powerBinFolders, newFolder]
    set({ powerBinFolders: updated })
    persistAll({ ...get(), powerBinFolders: updated })
    get().showToast(dich('Đã tạo khay: {ten}').replace('{ten}', () => name))
  },

  deletePowerBinFolder: (id: string) => {
    const updated = get().powerBinFolders.filter((f) => f.id !== id)
    set({ powerBinFolders: updated, selectedPowerBinFolderId: get().selectedPowerBinFolderId === id ? '' : get().selectedPowerBinFolderId })
    persistAll({ ...get(), powerBinFolders: updated })
  },

  setSelectedPowerBinFolderId: (id: string) => {
    set({ selectedPowerBinFolderId: id, selectedPath: '', selectedTagId: '' })
  },

  addPathsToPowerBin: (binId: string, paths: string[]) => {
    if (!binId || paths.length === 0) return 0

    const incoming = assetsFromPaths(paths)
    if (incoming.length === 0) {
      get().showToast(dich('Không có file nào dùng được (đuôi file không hỗ trợ).'))
      return 0
    }

    const byId = new Map(get().assets.map((a) => [a.id, a]))
    let added = 0

    for (const a of incoming) {
      const prev = byId.get(a.id)
      if (prev) {
        // File đã có trong thư viện: chỉ gán vào khay, GIỮ metadata đã sinh
        // (thumbnail/waveform/proxy/duration) để không phải xử lý lại.
        if (prev.powerBinFolderId !== binId) added++
        byId.set(a.id, { ...prev, isPowerBin: true, powerBinFolderId: binId })
      } else {
        byId.set(a.id, { ...a, isPowerBin: true, powerBinFolderId: binId })
        added++
      }
    }

    const assets = Array.from(byId.values())
    set({ assets })
    persistAll({ ...get(), assets })
    // Sinh thumbnail/waveform/metadata cho file mới thêm.
    void startBackgroundProcessing(assets)
    return added
  },

  addTimelineSelectionToPowerBin: async (binId: string) => {
    if (!binId) {
      get().showToast(dich('Chọn một khay ở menu bên trái trước đã.'))
      return
    }

    const res = await getSelectedTimelineClipPaths()
    if (!res.ok) {
      get().showToast(dich(res.message))
      return
    }

    const added = get().addPathsToPowerBin(binId, res.paths)
    const bin = get().powerBinFolders.find((f) => f.id === binId)
    // Hai khoa RIENG chu khong ghep manh ` vào khay "…"` vao cau: manh dich roi
    // ghep lai se ra cau nua Anh nua Viet. Ket qua hien ra y het ban cu.
    get().showToast(
      added > 0
        ? bin
          ? dich('Đã thêm {n} file từ timeline vào khay "{khay}"')
              .replace('{n}', String(added))
              .replace('{khay}', () => bin.name)
          : dich('Đã thêm {n} file từ timeline').replace('{n}', String(added))
        : dich('Các file này đã có trong khay rồi'),
    )
  },

  /**
   * [0.18.0] Bỏ asset khỏi khay Power Bin.
   *
   * Trước đây chỉ có đường THÊM vào khay mà không có đường ra — thêm nhầm là
   * chịu. Đây chỉ gỡ asset khỏi khay: file gốc trên đĩa KHÔNG bị đụng tới, và
   * asset vẫn còn nguyên trong thư viện.
   */
  removeFromPowerBin: (id: string) => {
    const target = get().assets.find((a) => a.id === id)
    if (!target) return
    const assets = get().assets.map((a) => {
      if (a.id !== id) return a
      const copy = { ...a }
      delete copy.isPowerBin
      delete copy.powerBinFolderId
      return copy
    })
    set({ assets, activeAsset: null, pinnedId: '', pinnedAsset: null })
    persistAll({ ...get(), assets })
    get().showToast(dich('Đã bỏ "{ten}" khỏi khay').replace('{ten}', () => target.name))
  },

  toggleSelectAsset: (id: string, isMulti: boolean) => {
    const current = get().selectedAssetIds
    if (!isMulti) {
      set({ selectedAssetIds: current.includes(id) && current.length === 1 ? [] : [id] })
    } else {
      if (current.includes(id)) {
        set({ selectedAssetIds: current.filter((x) => x !== id) })
      } else {
        set({ selectedAssetIds: [...current, id] })
      }
    }
  },

  selectAllAssets: () => {
    set({ selectedAssetIds: get().assets.map((a) => a.id) })
  },

  clearSelectedAssets: () => {
    set({ selectedAssetIds: [] })
  },

  batchAssignTag: (tagId: string) => {
    const selected = get().selectedAssetIds
    if (selected.length === 0) return
    const assets = get().assets.map((a) => {
      if (selected.includes(a.id)) {
        const cur = a.tags ?? []
        const has = cur.includes(tagId)
        return { ...a, tags: has ? cur.filter((t) => t !== tagId) : [...cur, tagId] }
      }
      return a
    })
    set({ assets })
    persistAll({ ...get(), assets })
    get().showToast(dich('Đã gán nhãn cho {n} asset').replace('{n}', String(selected.length)))
  },

  toggleMuted: () => set({ muted: !get().muted }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), muted: false }),
  setPitch: (semitones) => set({ pitch: Math.max(-12, Math.min(12, Math.round(semitones))) }),
  setCardSize: (s) => set({ cardSize: s }),
  setSearch: (q) => set({ search: q }),
  setSelectedPath: (p) => set({ selectedPath: p, selectedTagId: '', selectedPowerBinFolderId: '' }),
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId, selectedPath: '', selectedPowerBinFolderId: '' }),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  showToast: (msg: string) => {
    set({ toast: msg })
    setTimeout(() => {
      if (get().toast === msg) set({ toast: '' })
    }, 3200)
  },

  toggleAssetTag: (assetId, tagId) => {
    const assets = get().assets.map((a) => {
      if (a.id !== assetId) return a
      const existing = a.tags ?? []
      const has = existing.includes(tagId)
      const nextTags = has ? existing.filter((t) => t !== tagId) : [...existing, tagId]
      return { ...a, tags: nextTags }
    })
    set({ assets })
    persist(get().folders, assets)
  },

  toggleOnlyFavorites: () => set({ onlyFavorites: !get().onlyFavorites }),

  setSort: (by) =>
    set((s) => (s.sortBy === by ? { sortDesc: !s.sortDesc } : { sortBy: by, sortDesc: false })),

  toggleFavorite: (id) => {
    const assets = get().assets.map((a) =>
      a.id === id ? { ...a, favorite: !a.favorite } : a,
    )
    set({ assets })
    persist(get().folders, assets)
  },

  updateAsset: (id, patch) => {
    const assets = get().assets.map((a) => (a.id === id ? { ...a, ...patch } : a))
    set({ assets })
    persist(get().folders, assets)
  },

  updateAssetBatched: (id, patch) => {
    const prev = pendingPatches.get(id)
    pendingPatches.set(id, prev ? { ...prev, ...patch } : patch)
    schedulePatchFlush()
  },

  /**
   * [0.18.0] Có LỌC BỚT NHỊP. Hàng đợi báo tiến độ sau MỖI job; mỗi lần báo là
   * thanh công cụ render lại và đếm lại 15.000 asset xem còn thiếu bao nhiêu.
   * Người dùng không đọc nổi con số nhảy 30 lần/giây, nên 4 lần/giây là đủ.
   * Nhịp CUỐI (done = total) và lệnh kết thúc (null) luôn được cho qua.
   */
  setQueueProgress: (p) => {
    if (p && p.done < p.total) {
      const now = Date.now()
      if (now - lastProgressAt < 250) return
      lastProgressAt = now
    }
    set({ queueProgress: p })
  },

  init: () => {
    if (!nodeAvailable()) return
    const lib = loadLibrary()

    // TỰ CHỮA khi mở panel: thư viện có thể còn nhớ ảnh xem trước / sóng âm /
    // proxy đã bị xoá khỏi đĩa. Không dọn thì thẻ hiện ẢNH VỠ, mà hàng đợi nền
    // lại tưởng "có đường dẫn = đã xong" nên không bao giờ sinh lại.
    const pruned = pruneMissingCachePaths(lib.assets)

    set({
      assets: pruned.assets,
      folders: lib.folders,
      brands: lib.brands ?? [],
      powerBinFolders: lib.powerBinFolders ?? [],
      packs: lib.packs ?? [],
    })

    // Dữ liệu lưu từ bản cũ: logic ghép cặp preview đã đổi -> quét lại tự động.
    if (lib.version < LIBRARY_VERSION && lib.folders.length) {
      set({ toast: dich('Đang cập nhật thư viện theo chuẩn mới…') })
      void get().rescan()
    } else if (pruned.assets.length) {
      // Ghi lại ngay phần đã dọn, để lần mở sau không phải dọn lại.
      if (pruned.removed > 0) persist(lib.folders, pruned.assets)
      void startBackgroundProcessing(pruned.assets)
    }
  },

  initMedia: async () => {
    if (!nodeAvailable()) return
    const url = await startMediaServer()
    set({ mediaReady: !!url })
    if (!url) set({ error: dich('Không khởi động được máy chủ preview nội bộ.') })
  },

  sendToTimeline: async (asset) => {
    const res =
      asset.type === 'mogrt'
        ? await importMogrt(asset.path)
        : // Gửi kèm loại + thời lượng: host cần cả hai để chọn ĐÚNG TRACK và
          // KHÔNG đè lên clip đang có ở chỗ playhead.
          await importToTimeline(asset.path, asset.type, asset.duration ?? 0)
    // Chèn xong THÌ THẤY NGAY trên timeline — báo thêm một hộp nổi che mất lưới
    // là thừa. Chỉ lên tiếng khi THẤT BẠI, vì lúc đó màn hình không đổi gì và
    // người dùng cần biết vì sao.
    if (!res.ok) {
      set({ toast: dich(res.message) })
      setTimeout(() => {
        if (get().toast) set({ toast: '' })
      }, 3500)
    }
  },

  setFilter: (f) => set({ filter: f }),

  addFolder: async () => {
    if (!nodeAvailable()) {
      set({ error: dich('Node không khả dụng — mở panel trong Premiere để dùng.') })
      return
    }
    const folder = pickFolder()
    if (!folder) return

    set({ scanning: true, scanCount: 0, error: '' })
    try {
      const found = await scanFolder(folder, (n) => set({ scanCount: n }))
      const folders = Array.from(new Set([...get().folders, folder]))
      const assets = mergeAssets(get().assets, found)
      set({ assets, folders, scanning: false })
      persist(folders, assets)
      void startBackgroundProcessing(assets)
    } catch (e: any) {
      set({ scanning: false, error: dich('Quét lỗi: ') + (e?.message ?? e) })
    }
  },

  rescan: async () => {
    const { folders, assets: prev } = get()
    if (!folders.length || !nodeAvailable()) return
    set({ scanning: true, scanCount: 0, error: '' })
    try {
      let all: Asset[] = []
      for (const f of folders) {
        const found = await scanFolder(f, (n) => set({ scanCount: n }))
        all = mergeAssets(all, found)
      }
      // Giữ lại các asset đã đánh dấu yêu thích
      const favIds = new Set(prev.filter((a) => a.favorite).map((a) => a.id))
      all = all.map((a) => (favIds.has(a.id) ? { ...a, favorite: true } : a))

      set({
        assets: all,
        scanning: false,
        toast: dich('Đã quét {n} asset').replace('{n}', String(all.length)),
      })
      persist(folders, all)
      void startBackgroundProcessing(all)
      setTimeout(() => get().toast && set({ toast: '' }), 3000)
    } catch (e: any) {
      set({ scanning: false, error: dich('Quét lỗi: ') + (e?.message ?? e) })
    }
  },

  rescanPath: async (subPath, parentRoot) => {
    if (get().scanning || !nodeAvailable()) return
    set({ scanning: true, scanCount: 0, error: '' })
    try {
      const found = await scanFolder(subPath, (n) => set({ scanCount: n }))

      const isUnder = (p: string) =>
        p.length > subPath.length &&
        p.startsWith(subPath) &&
        (p[subPath.length] === '\\' || p[subPath.length] === '/')

      // Asset cũ nằm dưới thư mục này — để giữ lại những gì NGƯỜI DÙNG đã gán
      // và những gì hàng đợi nền đã sinh (id = hash đường dẫn nên khớp được).
      const prevById = new Map(
        get().assets.filter((a) => isUnder(a.path)).map((a) => [a.id, a]),
      )

      const merged = found.map((raw) => {
        // scanFolder đặt folder = subPath; trả về gốc để menu nhóm đúng cấp 1.
        const a = { ...raw, folder: parentRoot }
        const prev = prevById.get(a.id)
        if (!prev) return a
        return {
          ...a,
          // của người dùng
          favorite: prev.favorite,
          tags: prev.tags,
          isPowerBin: prev.isPowerBin,
          powerBinFolderId: prev.powerBinFolderId,
          // dẫn xuất đã sinh — khỏi bắt hàng đợi làm lại
          thumbPath: prev.thumbPath,
          waveformPath: prev.waveformPath,
          proxyPath: prev.proxyPath,
          duration: prev.duration,
          width: prev.width,
          height: prev.height,
          codec: prev.codec,
          fps: prev.fps,
          bitrate: prev.bitrate,
          previewPath: a.previewPath ?? prev.previewPath,
          previewKind: a.previewKind ?? prev.previewKind,
        }
      })

      // Thay TRỌN phần dưới subPath bằng kết quả mới (file đã xoá sẽ biến mất).
      const rest = get().assets.filter((a) => !isUnder(a.path))
      const assets = [...rest, ...merged]
      set({ assets, scanning: false })
      /**
       * [1.3.1] Nói rõ quét lại THƯ MỤC NÀO.
       *
       * Bản cũ chỉ báo "Đã quét lại: 1109 file" — người dùng vừa bấm ở một thư
       * mục mà menu ghi 64, nên con số 1109 (rồi 258 ở nút render) đọc như panel
       * tự bịa việc. Kèm tên thư mục vào là hết mơ hồ.
       */
      const tenThuMuc = subPath.split(/[\\/]/).filter(Boolean).pop() || subPath
      get().showToast(
        dich('Đã quét lại {ten}: {n} file')
          .replace('{ten}', () => tenThuMuc)
          .replace('{n}', String(merged.length)),
      )
      persist(get().folders, assets)
      void startBackgroundProcessing(assets)
    } catch (e: any) {
      set({ scanning: false, error: dich('Quét lỗi: ') + (e?.message ?? e) })
    }
  },

  removeFolder: (folder) => {
    const folders = get().folders.filter((f) => f !== folder)
    const assets = get().assets.filter((a) => a.folder !== folder)
    set({ folders, assets, selectedPath: '' })
    persist(folders, assets)
  },

  regeneratePreviews: () => {
    // Dọn đường dẫn treo TRƯỚC. Không có bước này thì asset nào còn nhớ
    // `thumbPath` (dù file đã mất) sẽ bị hàng đợi bỏ qua — bấm nút mà không
    // có gì xảy ra, đúng như lỗi đã gặp.
    const pruned = pruneMissingCachePaths(get().assets)
    // Bấm nút = "thử lại đi": xoá cờ thất bại để file từng lỗi được thử lần
    // nữa (biết đâu người dùng đã thay file hỏng bằng bản tốt).
    const assets = pruned.assets.map((a) => {
      if (!a.previewFailed) return a
      const copy = { ...a }
      delete copy.previewFailed
      return copy
    })
    set({ assets })
    persist(get().folders, assets)
    /**
     * [1.2.0-dev.3] Bấm nút = TURBO.
     *
     * Phân biệt rạch ròi hai tình huống, không cần thêm nút thứ hai:
     *   - Quét xong thư mục -> hàng đợi tự chạy NGẦM, nhường Premiere như cũ.
     *   - Người dùng BẤM nút này -> họ đang chủ động đợi render, nên chạy hết
     *     sức: không chờ Premiere rảnh, không nghỉ giữa job, FFmpeg ưu tiên
     *     thường thay vì thấp nhất.
     */
    void startBackgroundProcessing(assets, { turbo: true })
  },

  stopPreviewRender: () => {
    stopBackgroundProcessing()
  },

  changeCacheLocation: () => {
    const dir = pickFolder(dich('Chọn thư mục lưu bộ nhớ đệm'))
    if (!dir) return

    // Dừng hàng đợi trước: đang có FFmpeg ghi file vào thư mục cũ mà chuyển
    // giữa chừng thì vừa mất file vừa sai đường dẫn.
    stopBackgroundProcessing()

    const { result, assets } = moveCacheTo(dir, get().assets)
    if (!result.ok) {
      get().showToast(result.message)
      void startBackgroundProcessing(get().assets)
      return
    }

    set({ assets })
    persist(get().folders, assets)
    get().showToast(result.message)
    // Chạy lại hàng đợi cho phần còn thiếu (và cho những file không chuyển được).
    void startBackgroundProcessing(assets)
  },

  healBrokenPreviews: () => {
    const pruned = pruneMissingCachePaths(get().assets)
    if (pruned.removed === 0) return // ảnh lỗi vì lý do khác -> không đụng dữ liệu
    set({ assets: pruned.assets })
    persist(get().folders, pruned.assets)
    void startBackgroundProcessing(pruned.assets)
  },

  cleanOrphanCache: () => clearOrphanCache(get().assets),

  clearCacheAndReset: () => {
    clearCache()
    // Bỏ mọi đường dẫn trỏ tới file vừa xoá. Không làm bước này thì thẻ vẫn
    // trỏ tới ảnh không còn tồn tại và hiện biểu tượng ảnh vỡ.
    // Dùng chung bộ dọn với lúc mở panel: nó xét cả preview bung từ gói .mogrt
    // (cũng nằm trong thư mục thumbs), thứ bản viết tay trước đây bỏ sót.
    const assets = pruneMissingCachePaths(get().assets).assets
    set({ assets })
    persist(get().folders, assets)
    // Sinh lại ngay: người dùng không phải làm gì thêm.
    void startBackgroundProcessing(assets)
  },

  clear: () => {
    set({ assets: [], folders: [], selectedPath: '' })
    persist([], [])
  },
}))
