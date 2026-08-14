/**
 * MinhHoaNoiDat.tsx — hình động giải thích **ĐẶT KẾT QUẢ Ở ĐÂU**.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO CHỖ NÀY PHẢI KỂ BẰNG HÌNH, KHÔNG KỂ BẰNG CHỮ
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Anh Tiến nhắc 30/07: *"chỗ này hôm qua anh có bảo là tạo một animation
 * timeline để giải thích mà sao em không làm?"* — đúng, hôm 29/07 anh khoanh
 * HAI thanh chọn, tôi chỉ làm cho panel Transcript rồi bỏ sót panel này.
 *
 * Và đây là chỗ **cần hình hơn cả**. Ở Transcript, khác biệt giữa hai lựa chọn
 * là ĐỘ DÀI CÂU — một dòng chữ nói được. Ở đây khác biệt là **KHÔNG GIAN**:
 *
 *     Tạo sequence mới  ->  bản gốc CÒN NGUYÊN, sinh ra một sequence THỨ HAI
 *     Cắt tại chỗ       ->  CHỈ MỘT sequence, và chính nó bị sửa
 *
 * Thứ người dựng cần biết trước khi bấm là **cái nào phá bản gốc**. Chữ nói
 * "sửa thẳng vào sequence đang mở" thì phải đọc và tưởng tượng; hình cho thấy
 * ngay **một dải hay hai dải**.
 *
 * Nên hai lựa chọn phải có HAI CHUYỂN ĐỘNG KHÁC NHAU, không phải cùng một hiệu
 * ứng đổi màu:
 *   - Tạo mới : các đoạn RƠI XUỐNG dải dưới — dải trên vẫn còn đủ, kể cả chỗ đỏ
 *   - Tại chỗ : chỗ đỏ TAN ĐI, các đoạn TRƯỢT NGANG dồn lại trên chính dải đó
 */
import { dich } from './ngonngu'

const W = 320
const CAO_V = 7 //  track hình
const CAO_A = 9 //  track tiếng
const KHE = 1
const CAO_DAI = CAO_V + KHE + CAO_A //  một dải = 17
const CAO_TONG = 42

/** Vị trí dải khi có HAI dải (tạo sequence mới). */
const Y_GOC = 1
const Y_MOI = CAO_TONG - CAO_DAI - 1 //  = 24

/** Vị trí dải khi chỉ có MỘT dải (cắt tại chỗ) — nằm giữa khung. */
const Y_GIUA = (CAO_TONG - CAO_DAI) / 2

/**
 * Các đoạn BỎ trên bản gốc: `[bắt đầu %, dài %]`.
 * Lấy đúng dáng của mức "Vừa" — thưa, không dày đặc.
 */
const BO: [number, number][] = [
  [16, 7],
  [38, 8],
  [62, 6],
  [82, 7],
]

/** Biên độ sóng âm giả — CỐ ĐỊNH, không random (random thì mỗi lần vẽ một kiểu). */
const SONG = [
  0.55, 0.8, 0.42, 0.95, 0.62, 0.35, 0.78, 0.5, 0.88, 0.45, 0.7, 0.33, 0.92, 0.58,
  0.4, 0.85, 0.52, 0.75, 0.38, 0.68, 0.9, 0.47, 0.6, 0.82, 0.36, 0.72, 0.55, 0.48,
]

/* ── Nhịp: tính bằng SỐ, không để cứng trong CSS ─────────────────────────────
   Thêm/bớt một đoạn trong `BO` là mọi mốc tự dời theo. */
const TRE_DAU = 120
const BUOC = 70 //  đoạn sau đi sau đoạn trước
const DAI_DI = 620 //  một đoạn đi hết quãng đường của nó
const TAN_DO = 380 //  chỗ đỏ tan đi (chỉ ở "cắt tại chỗ")

export default function MinhHoaNoiDat({ noi }: { noi: 'moi' | 'taicho' }) {
  const taiCho = noi === 'taicho'
  const px = (p: number) => (p / 100) * W

  // Các đoạn GIỮ = phần bù của `BO`
  const giu: [number, number][] = []
  let moc = 0
  for (const [tu, dai] of BO) {
    if (tu > moc) giu.push([moc, tu - moc])
    moc = tu + dai
  }
  if (moc < 100) giu.push([moc, 100 - moc])

  // Cũng các đoạn đó nhưng đã DỒN SÁT
  const don: [number, number][] = []
  let dat = 0
  for (const [, dai] of giu) {
    don.push([dat, dai])
    dat += dai
  }

  /** Sóng âm trong track tiếng. Lấy chỉ số theo vị trí THẬT để cùng một đoạn
      luôn ra cùng hình sóng ở cả dải trên lẫn dải dưới — nhìn mới nhận ra nó. */
  const veSong = (x: number, w: number, yA: number, mocPhanTram: number) => {
    const vach = []
    const giua = yA + CAO_A / 2
    let i = Math.round(mocPhanTram)
    for (let dx = 2; dx < w - 1; dx += 4, i++) {
      const a = (SONG[i % SONG.length] * (CAO_A - 3)) / 2
      vach.push(
        <line
          key={dx}
          x1={x + dx}
          y1={giua - a}
          x2={x + dx}
          y2={giua + a}
          className="mh__song"
        />,
      )
    }
    return <g>{vach}</g>
  }

  /** Một đoạn: track hình + track tiếng + sóng. */
  const veDoan = (tu: number, dai: number, y: number, khoa: string, kieu?: React.CSSProperties) => {
    const x = px(tu)
    const w = Math.max(2, px(dai))
    return (
      <g key={khoa} className={kieu ? 'mhn__di' : undefined} style={kieu}>
        <rect x={x} y={y} width={w} height={CAO_V} rx="1.5" className="mh__v" />
        <rect x={x} y={y + CAO_V + KHE} width={w} height={CAO_A} rx="1.5" className="mh__a" />
        {veSong(x, w, y + CAO_V + KHE, tu)}
      </g>
    )
  }

  const yGoc = taiCho ? Y_GIUA : Y_GOC

  return (
    // `key` đổi là React dựng lại cả cây → animation chạy lại từ đầu.
    <svg
      key={noi}
      className="mhn"
      viewBox={`0 0 ${W} ${CAO_TONG}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={
        taiCho
          ? dich('Cắt thẳng vào sequence đang mở: chỗ lặng biến mất, các đoạn dồn lại trên chính nó')
          : dich('Tạo sequence mới: bản gốc còn nguyên, sinh thêm một sequence đã cắt bên dưới')
      }
    >
      {/* ── BẢN GỐC ────────────────────────────────────────────────────────
          Tạo mới : giữ nguyên đủ cả chỗ đỏ — đó chính là ý "gốc không bị đụng".
          Tại chỗ : các đoạn giữ sẽ TRƯỢT NGANG dồn lại ngay trên dải này. */}
      {giu.map(([tu, dai], i) =>
        veDoan(
          tu,
          dai,
          yGoc,
          `goc-${i}`,
          taiCho
            ? ({
                // Trượt NGANG về chỗ dồn sát — không rơi, vì không sinh dải mới.
                '--dx': `${px(don[i][0]) - px(tu)}px`,
                '--dy': '0px',
                '--tre': `${TRE_DAU + TAN_DO + i * BUOC}ms`,
              } as React.CSSProperties)
            : undefined,
        ),
      )}

      {/* Chỗ BỎ trên bản gốc. Tại chỗ thì nó TAN ĐI (sắp bị xoá thật);
          tạo mới thì nó Ở LẠI (bản gốc không đụng gì). */}
      {BO.map(([tu, dai], i) => (
        <rect
          key={`bo-${i}`}
          x={px(tu)}
          y={yGoc}
          width={Math.max(2, px(dai))}
          height={CAO_DAI}
          rx="1.5"
          className={taiCho ? 'mh__bo mhn__tan' : 'mh__bo'}
          style={taiCho ? ({ '--tre': `${TRE_DAU}ms` } as React.CSSProperties) : undefined}
        />
      ))}

      {/* ── SEQUENCE MỚI — chỉ có ở "Tạo sequence mới" ─────────────────────
          Các đoạn RƠI từ dải gốc xuống rồi dồn sát. Hai pha tách bạch, có nhịp
          nghỉ ở giữa (xem `mhn-di` trong styles.css): mắt phải tách được
          "rơi khỏi bản gốc" với "dồn sát vào nhau" — đó là hai ý. */}
      {!taiCho &&
        don.map(([tu, dai], i) =>
          veDoan(tu, dai, Y_MOI, `moi-${i}`, {
            '--dx': `${px(giu[i][0]) - px(tu)}px`,
            '--dy': `${Y_GOC - Y_MOI}px`,
            '--tre': `${TRE_DAU + i * BUOC}ms`,
          } as React.CSSProperties),
        )}
    </svg>
  )
}

export const NHIP_MINH_HOA = { TRE_DAU, BUOC, DAI_DI, TAN_DO }
