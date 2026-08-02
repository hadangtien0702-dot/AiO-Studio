/**
 * MinhHoa.tsx — hình động DIỄN GIẢI panel này làm gì.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ ANIMATION PHẢI DIỄN GIẢI, KHÔNG ĐƯỢC TRANG TRÍ
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Anh Tiến chốt 29/07 ở panel Autocut: *"điều quan trọng là em phải có
 * animation diễn giải cho từng phần"*. Mỗi chuyển động phải trả lời được **nó
 * đang kể điều gì**; không kể gì thì bỏ.
 *
 * Panel Autocut kể chuyện CẮT (đoạn rơi xuống rồi dồn sát). Panel này kể
 * chuyện khác hẳn — **CHÉP LỜI** — nên không chép lại animation đó, chỉ chép
 * cách làm và tên lớp.
 *
 * BA Ý, nên BA PHA, và giữa các pha có NHỊP NGHỈ:
 *
 *    1. NGHE      vệt sáng quét dọc clip          -> "máy đang nghe cả đoạn"
 *       ~ nghỉ ~
 *    2. RA CHỮ    các khối phụ đề hiện dần        -> "lời biến thành chữ,
 *                 từ trái sang phải                   đúng chỗ người ta nói"
 *       ~ nghỉ ~
 *    3. CẮM CỜ    cờ đỏ bật lên ở 2 chỗ           -> "chỗ máy nghe không chắc,
 *                                                     bấm M đi tới soát"
 *
 * Nhịp nghỉ là thứ đắt nhất: làm liền một mạch thì mắt không tách được ba ý.
 * Bài học 29/07 đã trả giá đúng chỗ này ở panel Autocut.
 *
 * Và **kể xong thì DỪNG** — không `infinite`. Lặp mãi thành đèn nhấp nháy,
 * kéo mắt người dựng trong lúc họ đang làm việc. Muốn xem lại thì bấm vào hình.
 */

/** Bề ngang viewBox. Thanh giãn ngang theo panel — xem `preserveAspectRatio`. */
const W = 320

/* ══════════════════════════════════════════════════════════════════════════
   THỨ TỰ DẢI PHẢI GIỐNG PREMIERE THẬT — anh Tiến sửa 29/07
   ══════════════════════════════════════════════════════════════════════════

   Bản đầu vẽ dải phụ đề màu TÍM nằm DƯỚI track tiếng. Sai cả hai:
   anh Tiến chỉ vào ảnh chụp: *"phần caption là phần màu vàng chứ không phải
   màu tím nha em, và nó xuất hiện ở TRÊN phần timeline"*.

   Trên Premiere, từ trên xuống:  marker → caption (C1) → video (V1) → tiếng (A1).
   Hình minh hoạ mà xếp khác thứ tự thật thì người dựng phải dịch trong đầu —
   đúng thứ hình minh hoạ sinh ra để tránh. */
const Y_CO = 0 //  cờ marker — trên cùng, như thanh marker của Premiere
const CAO_CO = 7
const Y_CC = 9 //  caption track C1 — NGAY TRÊN track hình
const CAO_CC = 10
const Y_V = 22 //  track hình V1
const CAO_V = 14
const KHE = 1.5
const Y_A = Y_V + CAO_V + KHE //  track tiếng A1
const CAO_A = 16
const CAO_TONG = Y_A + CAO_A

/**
 * Các câu phụ đề: `[bắt đầu %, dài %]`.
 *
 * Dài ngắn KHÔNG đều nhau và có khe hở giữa vài câu — giống lời nói thật.
 * Chia đều tăm tắp thì nhìn như thanh tiến độ, không ra phụ đề.
 */
const CAU: [number, number][] = [
  [1, 17],
  [20, 13],
  [35, 21],
  [58, 15],
  [75, 24],
]

/** Chỗ máy nghe không chắc — cắm cờ. Hai chỗ: đủ để hiểu ý, không rối. */
const CHO_NGO = [35, 75]

/**
 * Biên độ sóng âm giả — CỐ ĐỊNH, không random.
 * Random thì mỗi lần React vẽ lại là sóng nhảy một kiểu, nhìn như lỗi.
 */
const SONG = [
  0.55, 0.8, 0.42, 0.95, 0.62, 0.35, 0.78, 0.5, 0.88, 0.45, 0.7, 0.33, 0.92, 0.58,
  0.4, 0.85, 0.52, 0.75, 0.38, 0.68, 0.9, 0.47, 0.6, 0.82, 0.36, 0.72, 0.55, 0.48,
]

/* ══════════════════════════════════════════════════════════════════════════
   NHỊP — tính bằng SỐ, không để cứng trong CSS
   ══════════════════════════════════════════════════════════════════════════

   Bài học 29/07 (c): *"thời điểm phải TÍNH theo dữ liệu, đừng để cứng"*. Ở
   Autocut vệt sáng để cứng một con số nên cảnh nhiều đoạn thì loé trước khi
   đoạn cuối kịp vào chỗ, nhìn hụt.

   Ở đây: số cờ và thời điểm cắm cờ đều phải chờ khối chữ CUỐI CÙNG hiện xong.
   Thêm một câu vào `CAU` là mọi mốc tự dời theo.
*/
const DAI_QUET = 900 //  pha 1
const NGHI_1 = 260
const TRE_CHU = DAI_QUET + NGHI_1
const BUOC_CHU = 90 //  câu sau hiện sau câu trước
const DAI_CHU = 380
const XONG_CHU = TRE_CHU + (CAU.length - 1) * BUOC_CHU + DAI_CHU
const NGHI_2 = 170
const TRE_CO = XONG_CHU + NGHI_2

/* ══════════════════════════════════════════════════════════════════════════
   MINH HOẠ HAI MÔ HÌNH — bấm cái nào thì THẤY NGAY nó khác cái kia chỗ nào
   ══════════════════════════════════════════════════════════════════════════

   Anh Tiến 29/07, chỉ vào thanh chọn: *"2 phần này cần có animation để hiểu,
   thêm vào"*. Trước đó thanh chỉ tô sáng nút đang chọn — người dùng không có
   cách nào biết "Nhanh" khác "Phụ đề câu dài" ở chỗ nào ngoài việc chạy thử
   cả hai, mỗi lần mất mấy phút.

   Khác biệt THẬT (đo 28/07 trên cùng một video 58 phút):
       turbo    2.033 câu — câu NGẮN, nhanh gấp 3,3×
       large-v3 1.277 câu — câu DÀI hơn, chậm hơn 2,7×
   Nên hình phải kể đúng điều đó: **số khối và độ dài khối**.

   Animation: đổi lựa chọn là các khối hiện lại từ trái sang phải (60ms/khối).
   Mắt bám được "à, ít khối hơn nhưng mỗi khối dài hơn". */

const KHOI_MO_HINH: Record<string, [number, number][]> = {
  // [bắt đầu %, dài %] — turbo: nhiều khối ngắn
  turbo: [
    [1, 12], [15, 9], [26, 14], [42, 10], [54, 13], [69, 11], [82, 17],
  ],
  // large-v3: ít khối, mỗi khối dài hơn — TỔNG PHỦ như nhau, chỉ khác cách chia
  v3: [
    [1, 23], [26, 26], [54, 20], [76, 23],
  ],
}

export function MinhHoaMoHinh({ ma }: { ma: string }) {
  const khoi = KHOI_MO_HINH[ma] ?? KHOI_MO_HINH.turbo
  const CAO = 14
  const px = (p: number) => (p / 100) * W
  return (
    <svg
      key={ma}
      className="mh__mohinh"
      viewBox={`0 0 ${W} ${CAO}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={
        ma === 'turbo'
          ? 'Chia thành nhiều khối phụ đề ngắn'
          : 'Chia thành ít khối phụ đề, mỗi khối dài hơn'
      }
    >
      {khoi.map(([tu, dai], i) => (
        <g
          key={i}
          className="mh__mhkhoi"
          style={{ '--tre': `${i * 60}ms` } as React.CSSProperties}
        >
          <rect
            x={px(tu)}
            y={1}
            width={Math.max(4, px(dai))}
            height={CAO - 2}
            rx="2"
            className="mh__ccnen"
          />
          <line
            x1={px(tu) + 2.5}
            y1={CAO / 2}
            x2={px(tu) + Math.max(4, px(dai)) - 2.5}
            y2={CAO / 2}
            className="mh__ccchu"
          />
        </g>
      ))}
    </svg>
  )
}

export default function MinhHoa({ lan }: { lan: number }) {
  const px = (phanTram: number) => (phanTram / 100) * W

  /** Sóng âm: vạch dọc trong track tiếng, cách nhau 4 đơn vị. */
  const veSong = () => {
    const vach = []
    const giua = Y_A + CAO_A / 2
    let i = 0
    for (let x = 3; x < W - 2; x += 4, i++) {
      const a = (SONG[i % SONG.length] * (CAO_A - 5)) / 2
      vach.push(
        <line key={x} x1={x} y1={giua - a} x2={x} y2={giua + a} className="mh__song" />,
      )
    }
    return <g>{vach}</g>
  }

  return (
    // `key` đổi là React dựng lại cả cây -> animation chạy lại từ đầu. Rẻ hơn
    // nhiều so với gỡ/gắn class rồi ép trình duyệt tính lại layout.
    <svg
      key={lan}
      className="mh__hinh"
      viewBox={`0 0 ${W} ${CAO_TONG}`}
      /* Thanh timeline vốn phải GIÃN NGANG theo panel. `meet` sẽ để hở hai bên;
         `none` kéo ngang đúng như timeline thật.
         ☠️ Kèm chiều cao CỐ ĐỊNH trong CSS — `height:auto` làm hình phình lên
         310px khi panel kéo rộng 1600px (đã đo ở panel Autocut 29/07). */
      preserveAspectRatio="none"
      role="img"
      aria-label="Máy nghe hết đoạn, chép lời thành phụ đề gắn lên timeline, và cắm cờ ở chỗ nghe không chắc"
    >
      <defs>
        {/* Vệt quét mờ dần hai bên — mép cứng nhìn như một thanh chắn đang
            trượt qua, không ra "đang nghe". */}
        <linearGradient id="mh-quet-mau" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Clip trên timeline: track hình + track tiếng ────────────────── */}
      <rect x={0} y={Y_V} width={W} height={CAO_V} rx="2" className="mh__v" />
      <rect x={0} y={Y_A} width={W} height={CAO_A} rx="2" className="mh__a" />
      {veSong()}

      {/* ── PHA 1: vệt quét = máy đang nghe ─────────────────────────────── */}
      {/* Bọc trong khung cắt riêng: vệt không được tràn ra ngoài clip. */}
      <clipPath id="mh-vung-clip">
        <rect x={0} y={Y_V} width={W} height={Y_A + CAO_A - Y_V} rx="2" />
      </clipPath>
      <g clipPath="url(#mh-vung-clip)">
        <rect
          className="mh__quet"
          x={-40}
          y={Y_V}
          width={40}
          height={Y_A + CAO_A - Y_V}
          style={{ '--quet-dai': `${DAI_QUET}ms` } as React.CSSProperties}
        />
      </g>

      {/* ── PHA 2: lời thành chữ ────────────────────────────────────────── */}
      {CAU.map(([tu, dai], i) => (
        <g
          key={i}
          className="mh__cc"
          style={
            {
              '--tre': `${TRE_CHU + i * BUOC_CHU}ms`,
              '--dai': `${DAI_CHU}ms`,
            } as React.CSSProperties
          }
        >
          <rect
            x={px(tu)}
            y={Y_CC}
            width={Math.max(3, px(dai))}
            height={CAO_CC}
            rx="2"
            className="mh__ccnen"
          />
          {/* Hai vạch = hai dòng chữ. Đúng chuẩn panel đang làm: tối đa 2 dòng,
              42 ký tự một dòng. Vạch dưới ngắn hơn — dòng cuối bao giờ cũng hụt. */}
          <line
            x1={px(tu) + 2.5}
            y1={Y_CC + 3.6}
            x2={px(tu) + Math.max(3, px(dai)) - 2.5}
            y2={Y_CC + 3.6}
            className="mh__ccchu"
          />
          <line
            x1={px(tu) + 2.5}
            y1={Y_CC + 6.6}
            x2={px(tu) + Math.max(3, px(dai)) * 0.62}
            y2={Y_CC + 6.6}
            className="mh__ccchu"
          />
        </g>
      ))}

      {/* ── PHA 3: cắm cờ ở chỗ nghe không chắc ─────────────────────────── */}
      {CHO_NGO.map((tu, i) => (
        <g
          key={tu}
          className="mh__co"
          style={
            {
              '--tre': `${TRE_CO + i * 110}ms`,
              // Gốc xoay ở CHÂN cờ — cờ mọc lên từ timeline, không phình ra
              // từ giữa thân. Toạ độ theo đơn vị viewBox.
              transformOrigin: `${px(tu)}px ${Y_CO + CAO_CO}px`,
            } as React.CSSProperties
          }
        >
          <line
            x1={px(tu)}
            y1={Y_CO}
            x2={px(tu)}
            y2={Y_CO + CAO_CO}
            className="mh__cocan"
          />
          <path
            d={`M${px(tu)} ${Y_CO} L${px(tu) + 7} ${Y_CO + 2} L${px(tu)} ${Y_CO + 4} Z`}
            className="mh__cola"
          />
        </g>
      ))}
    </svg>
  )
}
