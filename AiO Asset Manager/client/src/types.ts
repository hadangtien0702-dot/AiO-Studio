/** Kiểu asset trong thư viện. */
export type AssetType =
  | 'video'
  | 'audio'
  | 'image'
  | 'mogrt'
  | 'preset'
  | 'other'

/** Một asset đã quét được. */
export interface Asset {
  /** id ổn định = hash của đường dẫn tuyệt đối. */
  id: string
  /** tên hiển thị (không đuôi). */
  name: string
  /** tên file đầy đủ (có đuôi). */
  fileName: string
  /** đường dẫn tuyệt đối tới file gốc. */
  path: string
  /** loại asset. */
  type: AssetType
  /** đuôi file (thường, không dấu chấm). */
  ext: string
  /** kích thước file (bytes). */
  fileSize: number
  /** thời điểm thêm vào thư viện (epoch ms). */
  dateAdded: number
  /** thư mục gốc mà asset được quét từ đó. */
  folder: string
  /**
   * Đường dẫn file dùng để preview:
   *  - video/image/audio: chính nó
   *  - mogrt: file preview đi kèm (mp4/mov/webm HOẶC webp/gif/png/jpg)
   * Rỗng nếu không có preview.
   */
  previewPath?: string
  /**
   * Kiểu render preview — quyết định dùng <video> hay <img>.
   * Cần tách khỏi `type` vì MOGRT có thể kèm video HOẶC ảnh động.
   */
  previewKind?: 'video' | 'image' | 'audio'
  /** Đánh dấu yêu thích (ghim lên đầu, lọc riêng). */
  favorite?: boolean

  /** [Phase 2] Thời lượng (giây). */
  duration?: number
  /** [Phase 2] Chiều rộng (px). */
  width?: number
  /** [Phase 2] Chiều cao (px). */
  height?: number
  /** [Phase 2] Tên codec. */
  codec?: string
  /** [Phase 2] Khung hình trên giây. */
  fps?: number
  /** [Phase 2] Bitrate (bps). */
  bitrate?: number
  /** [Phase 2] Đường dẫn tới thumbnail static được FFmpeg sinh ra. */
  thumbPath?: string
  /** [Phase 2] Đường dẫn tới proxy video nhẹ. */
  proxyPath?: string
  /** [Phase 2] Đường dẫn tới ảnh waveform cho audio. */
  waveformPath?: string
  /**
   * [0.17.1] Đã thử tạo preview cho file này và THẤT BẠI (file hỏng, codec lạ,
   * FFmpeg không đọc được). Có cờ này thì hàng đợi bỏ qua — nếu không, mỗi lần
   * chạy lại đều tốn một tiến trình FFmpeg cho đúng file không bao giờ xong,
   * và con số "còn thiếu" trên thanh công cụ không bao giờ về 0 nên người dùng
   * không biết đã render xong hay chưa. Bấm nút "Render preview" sẽ xoá cờ này
   * để thử lại (phòng khi file đã được thay/sửa).
   */
  previewFailed?: boolean
  /** [Phase 6] Danh sách tag màu sắc đã gán cho asset. */
  tags?: string[]
  /** [Phase 6 - Power Bins] Asset thuộc kho Power Bin toàn cục. */
  isPowerBin?: boolean
  /** [Phase 6 - Power Bins] ID thư mục Power Bin chứa asset. */
  powerBinFolderId?: string
}

/**
 * [Phase 6 - Brand Kit] Một thương hiệu / kênh.
 * Brand là tầng TRÊN của Power Bin: mỗi brand chứa nhiều khay (logo, intro,
 * nhạc nền…) để tái sử dụng ở mọi dự án Premiere.
 */
export interface Brand {
  id: string
  name: string
  /** Màu nhận diện — chỉ dùng làm dải màu nhận biết brand trong menu. */
  color?: string
  dateCreated: number
}

/** Thư mục Power Bin toàn cục DaVinci style. */
export interface PowerBinFolder {
  id: string
  name: string
  color?: string
  dateCreated: number
  /**
   * [Phase 6 - Brand Kit] Khay này thuộc brand nào.
   * Rỗng/thiếu = khay chung, không thuộc brand nào (dữ liệu cũ giữ nguyên,
   * không cần migrate).
   */
  brandId?: string
}

/** Gói tài nguyên Asset Pack. */
export interface AssetPack {
  id: string
  name: string
  assetIds: string[]
}

/** Nhãn màu phân loại asset. */
export interface Tag {
  id: string
  name: string
  color: string
}

/** Thống số cài đặt ứng dụng. */
export interface AppSettings {
  proxyQuality: '360p' | '480p'
  defaultVolume: number
}

/** Cách sắp xếp danh sách asset. */
export type SortBy = 'name' | 'date' | 'size' | 'duration' | 'type'

/** Bộ lọc theo loại (kèm 'all'). */
export type AssetFilter = AssetType | 'all'
