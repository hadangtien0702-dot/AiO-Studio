/**
 * Co.tsx — dải cờ ngôn ngữ chạy ngang, cho thấy panel nghe được thứ tiếng nào.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ WINDOWS KHÔNG CÓ GLYPH QUỐC KỲ — ĐỪNG DÙNG EMOJI
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Đo thật 30/07 trên panel, font `Segoe UI Emoji`, cỡ 20px:
 *
 *     🇻🇳 21,3px   🇨🇳 21,0px   🇹🇭 19,8px   🇺🇸 19,2px
 *     🇰🇷 19,0px   🇫🇷 17,4px   🇯🇵 15,2px
 *     chênh lệch giữa các cờ: **6,1px**
 *
 * Glyph cờ thật thì mọi cờ đều là MỘT ô emoji nên phải rộng bằng nhau. Mỗi cờ
 * một bề rộng khác nhau = font đang vẽ **hai chữ regional indicator**. Bằng
 * chứng chốt: 🇻🇳 rộng đúng bằng tổng 🇻 (9,6px) + 🇳 (11,7px) = 21,3px.
 *
 * Nếu dùng emoji thì panel hiện ra "VN", "US", "JP" — hai chữ cái. Nên vẽ SVG.
 *
 * ⚠️ Và nói rõ một điều về bản chất: **ngôn ngữ KHÔNG phải quốc gia**. Tiếng
 * Tây Ban Nha dùng ở hơn 20 nước, tiếng Anh ở hàng chục nước. Lấy cờ một nước
 * đại diện cho một thứ tiếng là quy ước bán hàng cho dễ nhìn, không phải sự
 * thật về ngôn ngữ. Đã nói với anh Tiến 30/07 và anh chốt vẫn làm dạng cờ.
 */

/** Cờ vẽ trong viewBox 24×16 (tỉ lệ 3:2). Đơn giản hoá cho cỡ ~20px. */
type VeCo = () => JSX.Element

const CO: Record<string, { ten: string; ve: VeCo }> = {
  vi: {
    ten: 'Việt',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#DA251D" />
        <path d="M12 3.6l1.35 4.16h4.37l-3.54 2.57 1.36 4.16L12 11.92l-3.54 2.57 1.36-4.16L6.28 7.76h4.37z" fill="#FF0" />
      </>
    ),
  },
  en: {
    ten: 'Anh',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#fff" />
        {[0, 2, 4, 6].map((i) => (
          <rect key={i} y={i * 2.46} width="24" height="1.23" fill="#B22234" />
        ))}
        {[1, 3, 5, 7].map((i) => (
          <rect key={i} y={i * 2.46} width="24" height="1.23" fill="#B22234" />
        ))}
        <rect width="10" height="8.6" fill="#3C3B6E" />
      </>
    ),
  },
  zh: {
    ten: 'Trung',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#EE1C25" />
        <path d="M5 2.4l.95 2.92h3.07l-2.49 1.8.96 2.92L5 8.26l-2.49 1.8.96-2.92L.98 5.32h3.07z" fill="#FF0" />
        <circle cx="11" cy="2.2" r="0.9" fill="#FF0" />
        <circle cx="13.2" cy="4.2" r="0.9" fill="#FF0" />
        <circle cx="13.2" cy="7" r="0.9" fill="#FF0" />
        <circle cx="11" cy="9" r="0.9" fill="#FF0" />
      </>
    ),
  },
  ja: {
    ten: 'Nhật',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#fff" />
        <circle cx="12" cy="8" r="4.8" fill="#BC002D" />
      </>
    ),
  },
  ko: {
    ten: 'Hàn',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#fff" />
        <path d="M12 3.2a4.8 4.8 0 010 9.6 2.4 2.4 0 010-4.8 2.4 2.4 0 000-4.8z" fill="#CD2E3A" />
        <path d="M12 3.2a4.8 4.8 0 000 9.6 2.4 2.4 0 000-4.8 2.4 2.4 0 010-4.8z" fill="#0047A0" />
      </>
    ),
  },
  es: {
    ten: 'Tây Ban Nha',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#AA151B" />
        <rect y="4" width="24" height="8" fill="#F1BF00" />
      </>
    ),
  },
  pt: {
    ten: 'Bồ Đào Nha',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#DA020E" />
        <rect width="9.6" height="16" fill="#046A38" />
        <circle cx="9.6" cy="8" r="2.6" fill="#FFE800" />
      </>
    ),
  },
  fr: {
    ten: 'Pháp',
    ve: () => (
      <>
        <rect width="8" height="16" fill="#002395" />
        <rect x="8" width="8" height="16" fill="#fff" />
        <rect x="16" width="8" height="16" fill="#ED2939" />
      </>
    ),
  },
  de: {
    ten: 'Đức',
    ve: () => (
      <>
        <rect width="24" height="5.34" fill="#000" />
        <rect y="5.34" width="24" height="5.33" fill="#D00" />
        <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
      </>
    ),
  },
  ru: {
    ten: 'Nga',
    ve: () => (
      <>
        <rect width="24" height="5.34" fill="#fff" />
        <rect y="5.34" width="24" height="5.33" fill="#0039A6" />
        <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
      </>
    ),
  },
  th: {
    ten: 'Thái',
    ve: () => (
      <>
        <rect width="24" height="16" fill="#A51931" />
        <rect y="2.67" width="24" height="10.66" fill="#F4F5F8" />
        <rect y="5.34" width="24" height="5.33" fill="#2D2A4A" />
      </>
    ),
  },
  id: {
    ten: 'Indonesia',
    ve: () => (
      <>
        <rect width="24" height="8" fill="#CE1126" />
        <rect y="8" width="24" height="8" fill="#fff" />
      </>
    ),
  },
}

/** Thứ tự bày: tiếng Việt trước (đây là tool của người Việt), rồi theo thị trường. */
const THU_TU = ['vi', 'en', 'zh', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'ru', 'th', 'id']

export default function DaiCo() {
  // Nhân đôi danh sách để dải chạy vòng liền mạch — nửa sau là bản sao,
  // `translateX(-50%)` là vừa đúng một vòng, không thấy chỗ nối.
  const day = [...THU_TU, ...THU_TU]
  return (
    <div className="daico">
      <div className="daico__chay">
        {day.map((ma, i) => {
          const c = CO[ma]
          if (!c) return null
          return (
            <span className="daico__mot" key={`${ma}-${i}`} title={`Tiếng ${c.ten}`}>
              <svg
                className="daico__co"
                viewBox="0 0 24 16"
                width="20"
                height="13"
                aria-hidden="true"
              >
                {c.ve()}
              </svg>
              <span className="daico__ten">{c.ten}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Số thứ tiếng bày ra dải — dùng cho dòng chú thích, khỏi đếm tay rồi lệch. */
export const SO_NGON_NGU = THU_TU.length
