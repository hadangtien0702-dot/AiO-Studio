/**
 * Icons.tsx — bộ icon SVG vẽ tay, nét mảnh, thống nhất.
 * Dùng SVG thay emoji/ký tự để hiển thị rõ ràng và giống nhau trên mọi máy.
 */

interface Props {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

/** Menu (3 gạch). */
export function IconMenu({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  )
}

/** Thêm thư mục. */
export function IconFolderPlus({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M1.5 4.5a1 1 0 0 1 1-1h3l1.2 1.5h6.8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z" />
      <path d="M8 8v3.5M6.25 9.75h3.5" />
    </svg>
  )
}

/** Quét lại (mũi tên vòng). */
export function IconRefresh({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.7 2.5v3.2h-3.2" />
    </svg>
  )
}

/** Loa bật tiếng. */
export function IconVolumeOn({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M3 6.2h2L8 3.6v8.8L5 9.8H3z" />
      <path d="M10.4 6.2a2.6 2.6 0 0 1 0 3.6" />
      <path d="M12.2 4.4a5 5 0 0 1 0 7.2" />
    </svg>
  )
}

/** Loa tắt tiếng. */
export function IconVolumeOff({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M3 6.2h2L8 3.6v8.8L5 9.8H3z" />
      <path d="M10.8 6.4l3.2 3.2M14 6.4l-3.2 3.2" />
    </svg>
  )
}

/** Cỡ ô NHỎ — nhiều ô. */
export function IconGridSmall({ size = 14 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.2}>
      <rect x="2" y="2" width="3.2" height="3.2" rx="0.6" />
      <rect x="6.4" y="2" width="3.2" height="3.2" rx="0.6" />
      <rect x="10.8" y="2" width="3.2" height="3.2" rx="0.6" />
      <rect x="2" y="6.4" width="3.2" height="3.2" rx="0.6" />
      <rect x="6.4" y="6.4" width="3.2" height="3.2" rx="0.6" />
      <rect x="10.8" y="6.4" width="3.2" height="3.2" rx="0.6" />
      <rect x="2" y="10.8" width="3.2" height="3.2" rx="0.6" />
      <rect x="6.4" y="10.8" width="3.2" height="3.2" rx="0.6" />
      <rect x="10.8" y="10.8" width="3.2" height="3.2" rx="0.6" />
    </svg>
  )
}

/** Cỡ ô VỪA — 4 ô. */
export function IconGridMedium({ size = 14 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.3}>
      <rect x="2" y="2" width="5.2" height="5.2" rx="0.8" />
      <rect x="8.8" y="2" width="5.2" height="5.2" rx="0.8" />
      <rect x="2" y="8.8" width="5.2" height="5.2" rx="0.8" />
      <rect x="8.8" y="8.8" width="5.2" height="5.2" rx="0.8" />
    </svg>
  )
}

/** Cỡ ô LỚN — 1 ô to. */
export function IconGridLarge({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <rect x="2" y="2.8" width="12" height="10.4" rx="1" />
    </svg>
  )
}

/** Kính lúp. */
export function IconSearch({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <circle cx="7" cy="7" r="4.3" />
      <path d="M10.2 10.2L14 14" />
    </svg>
  )
}

/** Trái tim (đặc / rỗng). */
export function IconHeart({ size = 13, filled = false }: Props & { filled?: boolean }) {
  return (
    <svg {...base(size)} fill={filled ? 'currentColor' : 'none'}>
      <path d="M8 13.2S2.4 9.9 2.4 6.2A2.9 2.9 0 0 1 8 4.9a2.9 2.9 0 0 1 5.6 1.3c0 3.7-5.6 7-5.6 7z" />
    </svg>
  )
}

/** Dấu X (đóng). */
export function IconClose({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

/** Nốt nhạc — placeholder cho asset audio. */
export function IconMusic({ size = 22 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.2}>
      <path d="M6 12.2V3.6l7-1.4v8.6" />
      <circle cx="4.2" cy="12.4" r="1.9" />
      <circle cx="11.2" cy="10.9" r="1.9" />
    </svg>
  )
}

/** Lớp chồng — placeholder cho MOGRT. */
export function IconLayers({ size = 22 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.2}>
      <path d="M8 1.8l6 3.1-6 3.1-6-3.1z" />
      <path d="M2 8.4l6 3.1 6-3.1" />
      <path d="M2 11.6l6 3.1 6-3.1" />
    </svg>
  )
}

/** File chung — placeholder mặc định. */
export function IconFile({ size = 22 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.2}>
      <path d="M9 1.8H4.5a1 1 0 0 0-1 1v10.4a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.3z" />
      <path d="M9 1.8V5.3h3.5" />
    </svg>
  )
}

/** Mũi tên sắp xếp tăng/giảm. */
export function IconSortArrow({ size = 10, desc = false }: Props & { desc?: boolean }) {
  return (
    <svg
      {...base(size)}
      style={{ transform: desc ? 'rotate(180deg)' : undefined }}
    >
      <path d="M8 12.5V3.5M4.5 7L8 3.5 11.5 7" />
    </svg>
  )
}

/** Video / Cuộn phim. */
export function IconFilm({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <rect x="2" y="2.5" width="12" height="11" rx="1" />
      <path d="M5 2.5v11M11 2.5v11M2 6h3M11 6h3M2 10h3M11 10h3" />
    </svg>
  )
}

/** Bức ảnh. */
export function IconImage({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <rect x="2" y="2.5" width="12" height="11" rx="1" />
      <circle cx="5.5" cy="6" r="1.2" />
      <path d="M14 10l-3.5-3.5L4 13.5" />
    </svg>
  )
}

/** Sét / Preset. */
export function IconZap({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <polygon points="9 1.5 2.5 9 7.5 9 6.5 14.5 13.5 7 8.5 7 9 1.5" />
    </svg>
  )
}

/** Máy ảnh / Chụp màn hình. */
export function IconCamera({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M14.5 4.5h-3l-1-1.5h-5l-1 1.5h-3A1.5 1.5 0 0 0 0 6v6.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5z" />
      <circle cx="8" cy="9.25" r="2.75" />
    </svg>
  )
}

/** Bảng kẹp / Dán Clipboard. */
export function IconClipboard({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M5.5 2h5A1.5 1.5 0 0 1 12 3.5V5H4V3.5A1.5 1.5 0 0 1 5.5 2z" />
      <path d="M3 5h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    </svg>
  )
}

/** Xuất file / Export. */
export function IconExport({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M3.5 13.5h9M8 2.5v8M4.5 7L8 3.5 11.5 7" />
    </svg>
  )
}

/**
 * Cài đặt — dạng thanh trượt. Bánh răng vẽ ở cỡ 13-14px bị rối thành hình
 * mặt trời (các nan toả ra không còn đọc ra là răng), nên dùng sliders.
 */
export function IconSettings({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M2.5 5.2h5.6M12.2 5.2h1.3M2.5 10.8h2.3M8.9 10.8h4.6" />
      <circle cx="10.1" cy="5.2" r="1.9" />
      <circle cx="6.8" cy="10.8" r="1.9" />
    </svg>
  )
}

/** Thùng/gói — dùng cho Asset Pack (thay emoji hộp). */
export function IconPackage({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M8 1.8l5.7 2.9v6.6L8 14.2 2.3 11.3V4.7z" />
      <path d="M2.3 4.7L8 7.6l5.7-2.9M8 7.6v6.6" />
    </svg>
  )
}

/** Mũi tên vào khay — dùng cho hành động Import (thay emoji hộp thư). */
export function IconImport({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M8 1.8v7.4M4.8 6l3.2 3.2L11.2 6" />
      <path d="M2.3 11.2v1.5a1 1 0 0 0 1 1h9.4a1 1 0 0 0 1-1v-1.5" />
    </svg>
  )
}

/** Dấu tích — báo thành công. */
export function IconCheck({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M2.8 8.4l3.4 3.4 7-7.6" />
    </svg>
  )
}

/** Thư mục — dùng cho tab Thư viện gốc. */
export function IconFolder({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M1.8 4.3a1 1 0 0 1 1-1h3.3l1.3 1.7h6.8a1 1 0 0 1 1 1v6.7a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z" />
    </svg>
  )
}

/** Đồng hồ — báo đang xử lý. */
export function IconClock({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.4V8l2.6 1.6" />
    </svg>
  )
}

/** Dấu cộng — thêm mục mới. */
export function IconPlus({ size = 12 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M8 3.2v9.6M3.2 8h9.6" />
    </svg>
  )
}

/** Mũi tên vào khung — thêm từ timeline vào khay. */
export function IconAddFromTimeline({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M2 2.6v10.8" />
      <path d="M14 8H6.4M9.2 5.2L6.4 8l2.8 2.8" />
      <path d="M11.4 2.6h2.6M11.4 13.4h2.6" />
    </svg>
  )
}

/** Cao độ (pitch) — sóng âm kèm mũi tên lên/xuống. */
export function IconPitch({ size = 14 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.4}>
      <path d="M1.6 8c1.1-3.2 2.4-3.2 3.5 0s2.4 3.2 3.5 0" />
      <path d="M12.6 3.4v9.2M10.9 5.1l1.7-1.7 1.7 1.7M10.9 10.9l1.7 1.7 1.7-1.7" />
    </svg>
  )
}

/** Mũi tên sang trái — quay về màn hình chọn không gian làm việc. */
export function IconChevronLeft({ size = 14 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M10 3.5L5.5 8l4.5 4.5" />
    </svg>
  )
}

/** Thùng rác — việc phá huỷ. */
export function IconTrash({ size = 13 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M2.8 4.5h10.4M6.2 4.5V3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.5" />
      <path d="M4.2 4.5l.6 8.2a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9l.6-8.2" />
    </svg>
  )
}

/** Dấu hiệu thương hiệu AiO Studio — 3 lớp lệch nhau. */
export function IconBrand({ size = 22 }: Props) {
  return (
    <svg {...base(size)} strokeWidth={1.3}>
      <path d="M8 1.8l5.6 2.9L8 7.6 2.4 4.7z" />
      <path d="M2.4 8.2L8 11.1l5.6-2.9" />
      <path d="M2.4 11.4L8 14.3l5.6-2.9" />
    </svg>
  )
}
