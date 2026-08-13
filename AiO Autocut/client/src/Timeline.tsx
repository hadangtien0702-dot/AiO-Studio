/**
 * Timeline.tsx — hai dải "Bản gốc" / "Sau khi cắt", dựng đúng thiết kế anh Tiến
 * chốt (`AiO Design System/Design/Auto Cut.html`).
 *
 * Anh Tiến 2026-08-03, khoanh đỏ hai khối rồi nói: *"2 phần này tỉ lệ chưa
 * giống, nội dung cũng không giống luôn em"*. Bản ghép đầu vẽ dải sóng dB bằng
 * canvas — một tầng xanh lá cao 96px. Thiết kế thì là **timeline Premiere**:
 *
 *   Bản gốc     = vạch đỏ 6px  +  dải video 22px  +  dải audio 40px   (tổng 92)
 *   Sau khi cắt = phần giữ co đúng tỉ lệ  +  khối gạch chéo "đã cắt bỏ"
 *
 * Số đo lấy bằng cách ĐO THẲNG file thiết kế, không ước bằng mắt.
 *
 * ☠️ HÌNH ĐỔI, DỮ LIỆU KHÔNG ĐỔI. Sóng trắng trong dải audio vẽ từ `mucAm.cua`
 * — mức âm đo thật từng cửa sổ 20ms của chính clip đang mở. Vệt đỏ là chỗ SẼ
 * cắt thật. Đây là hình của dữ liệu thật, không phải hình minh hoạ.
 *
 * MẤT ĐI so với bản canvas cũ: **đường ngưỡng cam nhấp nhô theo nền ồn**. Nó là
 * thứ chứng minh tool không cắt nhầm lời người ngồi xa mic (nền dao động 7,9 dB
 * giữa các phút). Thiết kế không có chỗ cho nó. Cần thì lấy lại được — vẽ mảnh
 * đè lên dải audio.
 */
import type { MucAm, Quang } from './services/amluong'
import { dich } from './ngonngu'

function mmss(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  return `${Math.floor(g / 60)}:${String(g % 60).padStart(2, '0')}`
}

/** "1 phút 55 giây" — cỡ chữ to thì nói bằng tiếng người, đừng bắt đọc 115. */
function dai(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const p = Math.floor(g / 60)
  return p > 0
    ? `${p} ${dich('phút')} ${g % 60} ${dich('giây')}`
    : `${g} ${dich('giây')}`
}

/** Số vạch sóng trải trên toàn dải. Đo thiết kế: 171 vạch cho 3 clip. */
const SO_VACH = 170
const DB_DAY = -75
const DB_DINH = -5

/** Chiều cao vạch sóng (%) tại một lát cắt thời gian, đọc từ mức âm đã đo. */
function cao(mucAm: MucAm, tu: number, den: number): number {
  const b = mucAm.buocGiay
  const i0 = Math.max(0, Math.floor(tu / b))
  const i1 = Math.min(mucAm.cua.length, Math.max(i0 + 1, Math.ceil(den / b)))
  let dinh = -Infinity
  for (let i = i0; i < i1; i++) if (mucAm.cua[i] > dinh) dinh = mucAm.cua[i]
  if (dinh === -Infinity) return 6
  const t = (dinh - DB_DAY) / (DB_DINH - DB_DAY)
  // Lấy ĐỈNH của cụm chứ không lấy trung bình: trung bình làm tiếng nói ngắn
  // biến mất khỏi hình (bài học của bản canvas cũ, giữ nguyên ở đây).
  return Math.round(Math.max(0.06, Math.min(1, t)) * 100)
}

/** Một dải audio: các vạch sóng trắng. Nhận sẵn chiều cao để dùng được cho cả
    dữ liệu THẬT lẫn dữ liệu MẪU — một khuôn vẽ, hai nguồn số. */
function Song({ cao }: { cao: number[] }) {
  return (
    <span className="a">
      {cao.map((h, i) => (
        <i key={i} style={{ height: `${h}%` }} />
      ))}
    </span>
  )
}

/** Một clip trên timeline: dải video xanh dương + dải audio xanh lá. */
function Clip({ cao: c }: { cao: number[] }) {
  return (
    <span className="clip">
      <span className="v" />
      <Song cao={c} />
    </span>
  )
}

/** Chiều cao các vạch cho khoảng [tu, den] — đọc mức âm ĐO THẬT. */
function vachThat(mucAm: MucAm, tu: number, den: number, soVach: number): number[] {
  const buoc = (den - tu) / soVach
  const v: number[] = []
  for (let k = 0; k < soVach; k++) v.push(cao(mucAm, tu + k * buoc, tu + (k + 1) * buoc))
  return v
}

/** Vạch sóng MẪU — tất định, mở panel lần nào cũng ra đúng một hình.
    Random ở đây là hại: hình nhảy mỗi lần vẽ lại thì người dùng tưởng máy
    đang đo cái gì đó của clip mình. */
function vachMau(hat: number, soVach: number): number[] {
  return Array.from({ length: soVach }, (_, i) => {
    const x = Math.sin((hat * 71 + i * 12.9) * 1.3) * 0.5 + 0.5
    const y = Math.sin((hat * 31 + i * 4.7) * 0.7) * 0.5 + 0.5
    return Math.round(18 + Math.pow(x * 0.7 + y * 0.3, 1.4) * 74)
  })
}

interface PropsGoc {
  mucAm: MucAm
  cat: Quang[]
  tong: number
  /** Số clip video trong vùng — vẽ đúng số khe như trên timeline thật. */
  soClip: number
}

/** BẢN GỐC: vạch đỏ đánh dấu + các clip + vệt đỏ phủ chỗ sẽ cắt. */
function DaiGoc({ mucAm, cat, tong, soClip }: PropsGoc) {
  const n = Math.max(1, Math.min(soClip, 12)) // trên 12 khe thì mỗi khe mảnh như sợi chỉ
  const moiClip = tong / n
  const vachMoiClip = Math.max(1, Math.round(SO_VACH / n))
  return (
    <div className="tl">
      {/* Vạch đỏ trên cùng: chỗ nào sẽ cắt. Tối thiểu 2px, nếu không thì
          khoảng lặng 0,3 giây trong video 58 phút chỉ chiếm 0,08px và biến mất
          khỏi hình — người dùng tưởng chỗ đó không bị cắt. */}
      <div className="marks">
        {cat.map((c, i) => (
          <i
            key={i}
            style={{ left: `${(c.tu / tong) * 100}%`, width: `max(2px, ${((c.den - c.tu) / tong) * 100}%)` }}
          />
        ))}
      </div>
      <div className="lanes">
        {Array.from({ length: n }, (_, k) => (
          <Clip key={k} cao={vachThat(mucAm, k * moiClip, (k + 1) * moiClip, vachMoiClip)} />
        ))}
      </div>
      <div className="cuts">
        {cat.map((c, i) => (
          <i
            key={i}
            style={{ left: `${(c.tu / tong) * 100}%`, width: `max(2px, ${((c.den - c.tu) / tong) * 100}%)` }}
          />
        ))}
      </div>
    </div>
  )
}

interface PropsSau {
  mucAm: MucAm
  cat: Quang[]
  tong: number
  conLai: number
  boDi: number
  /** "1 phút 55 giây" — chữ to thì nói bằng tiếng người. */
  nhanBoDi: string
}

/** SAU KHI CẮT: phần giữ co đúng tỉ lệ + khối gạch chéo nói phần mất đi. */
function DaiSau({ mucAm, cat, tong, conLai, boDi, nhanBoDi }: PropsSau) {
  const tyLe = tong > 0 ? conLai / tong : 1
  // Vẽ phần GIỮ bằng chính đoạn đầu của bản gốc: nó chỉ cần nói "ngắn lại bấy
  // nhiêu", không cần khớp từng khung với bản đã dồn.
  return (
    <div className="tl tl--after">
      <div className="kept" style={{ flexBasis: `${(tyLe * 100).toFixed(2)}%` }}>
        <div className="lanes">
          <Clip cao={vachThat(mucAm, 0, conLai, Math.max(12, Math.round(SO_VACH * tyLe)))} />
        </div>
        {/* Mỗi nhát cắt để lại một mối nối — vẽ ra để thấy timeline sẽ có bao
            nhiêu chỗ ghép, thứ người dựng phải soát lại sau này. */}
        <div className="seams">
          {cat.map((_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      {boDi > 0 && (
        <div className="gone">
          {/* Cắt được ÍT thì khối này hẹp, nhét chữ vào là tràn đè lên gạch
              chéo. Đo thật 03/08 trên video 26 phút của anh Tiến: bỏ 0:30 =
              1,9%, khối rộng chưa tới 20px. Dưới 15% để trống — con số đã có
              sẵn ở nhãn "Sau khi cắt" ngay trên đầu. */}
          {1 - tyLe >= 0.15 && (
            <>
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
              </svg>
              <span className="n">{nhanBoDi}</span>
              <span className="l">{dich('đã cắt bỏ')}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   KHỐI "XEM TRƯỚC KẾT QUẢ" — hai dải + nhãn
   ══════════════════════════════════════════════════════════════════════════ */

interface PropsXem {
  mucAm: MucAm
  /** Danh sách khoảng SẼ cắt — App tính sẵn rồi truyền xuống, vì bảng danh
      sách và ba ô Kết quả cũng dùng chính nó. Tính hai lần là hai nguồn số cho
      CÙNG một việc, kiểu gì cũng có lúc lệch nhau. */
  cat: Quang[]
  soClip: number
}

export function XemTruoc({ mucAm, cat, soClip }: PropsXem) {
  const tong = mucAm.cua.length * mucAm.buocGiay
  let boDi = 0
  for (const c of cat) boDi += c.den - c.tu
  const conLai = Math.max(0, tong - boDi)

  return (
    <>
      <div className="trk-hd">
        <span>{dich('Bản gốc')}</span>
        <span className="meta">{dai(tong)}</span>
      </div>
      <DaiGoc mucAm={mucAm} cat={cat} tong={tong} soClip={soClip} />

      <div className="trk-hd" style={{ marginTop: 'var(--sp-5)' }}>
        <span>{dich('Sau khi cắt')}</span>
        <span className="meta">
          {dai(conLai)}
          <i>−{mmss(boDi)}</i>
        </span>
      </div>
      <DaiSau
        mucAm={mucAm}
        cat={cat}
        tong={tong}
        conLai={conLai}
        boDi={boDi}
        nhanBoDi={dai(boDi)}
      />

      {/* ☠️ ĐÃ GỠ dòng "Đây là ước tính hơi thấp — thực tế thường ngắn hơn
          chừng 3–8% nữa". Anh Tiến 03/08: *"remove cho anh chỗ này của em luôn,
          anh không [muốn] nó hiện lên UI"*.

          Ghi lại để phiên sau biết mình đã đánh đổi cái gì: câu đó là thứ DUY
          NHẤT trên màn hình nói rằng con số "còn 99%" mới là ƯỚC LƯỢNG, và
          bước nghe hiểu chạy sau còn bỏ thêm. Đo trên video 58 phút: Giữ nhịp
          141,4s → 152,3s · Vừa 303,9s → 315,4s · Cắt sạch 488,6s → 501,0s —
          máy luôn cắt NHIỀU HƠN hình vẽ ở đây. Gỡ đi thì người dùng đọc con số
          như thể nó chính xác. Cần nói lại thì để ở màn KẾT QUẢ sau khi cắt,
          chỗ đã có số thật để so. */}
      <p className="xem__luu">{dich('Đỏ là chỗ sẽ bỏ.')}</p>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TIMELINE MẪU — lúc chưa phân tích
   ══════════════════════════════════════════════════════════════════════════

   Anh Tiến 03/08, nhìn panel chưa chạy: *"tỉ lệ vẫn chưa đúng"*. Đo được lý do:
   chỗ đó đang là `MinhHoa.tsx` cũ — khung **36px**, trong khi timeline thiết kế
   là **92px**. Hai khuôn khác nhau cho cùng một ô thì bấm chạy xong bố cục nhảy.

   ⇒ Dùng CHUNG khuôn `.tl`. Chỉ khác nguồn số: ở đây là số mẫu tất định, còn
   sau khi phân tích là mức âm thật. Bấm ba mức vẫn thấy ngay cắt thưa hay dày.
*/

/** Còn lại bao nhiêu % và cắt bao nhiêu đoạn, theo từng mức — đo thật trên
    video 58:37. Thứ tự khớp `MUC` trong `App.tsx`. */
const MAU_MUC = [
  { conLai: 0.87, soDoan: 9, mo: 'Bỏ dead silent dài · giữ nhịp nói tự nhiên' },
  { conLai: 0.74, soDoan: 17, mo: 'Bỏ phần lớn dead silent · vẫn còn khoảng thở' },
  { conLai: 0.57, soDoan: 29, mo: 'Bỏ sạch dead silent · nhịp dồn liên tục' },
]

export function TimelineMau({ muc, soClip }: { muc: number; soClip: number }) {
  const m = MAU_MUC[muc] ?? MAU_MUC[1]
  const boTong = 1 - m.conLai
  const moiDoan = boTong / m.soDoan
  // Rải đều: mỗi ô một khoảng cắt nằm giữa. Tổng đúng bằng phần bị bỏ.
  const cat = Array.from({ length: m.soDoan }, (_, i) => {
    const giua = (i + 0.5) / m.soDoan
    return { tu: giua - moiDoan / 2, den: giua + moiDoan / 2 }
  })
  const n = Math.max(1, Math.min(soClip, 12))
  const vachMoiClip = Math.max(1, Math.round(SO_VACH / n))
  const pct = (x: number) => `${(x * 100).toFixed(3)}%`

  return (
    <>
      {/* Nói NGAY ở nhãn là hình mẫu — rẻ hơn một khối cảnh báo riêng, mà
          không ai đọc lướt qua được. */}
      <div className="trk-hd">
        <span>
          {dich('Bản gốc')} <em className="vd">{dich('ví dụ')}</em>
        </span>
      </div>
      <div className="tl">
        <div className="marks">
          {cat.map((c, i) => (
            <i key={i} style={{ left: pct(c.tu), width: `max(2px, ${pct(c.den - c.tu)})` }} />
          ))}
        </div>
        <div className="lanes">
          {Array.from({ length: n }, (_, k) => (
            <Clip key={k} cao={vachMau(k + muc * 7, vachMoiClip)} />
          ))}
        </div>
        <div className="cuts">
          {cat.map((c, i) => (
            <i key={i} style={{ left: pct(c.tu), width: `max(2px, ${pct(c.den - c.tu)})` }} />
          ))}
        </div>
      </div>

      <div className="trk-hd" style={{ marginTop: 'var(--sp-5)' }}>
        <span>{dich('Sau khi cắt')}</span>
        <span className="meta">
          {dich('còn')} <i>{Math.round(m.conLai * 100)}%</i>
        </span>
      </div>
      <div className="tl tl--after">
        <div className="kept" style={{ flexBasis: pct(m.conLai) }}>
          <div className="lanes">
            <Clip cao={vachMau(muc * 7 + 3, Math.max(12, Math.round(SO_VACH * m.conLai)))} />
          </div>
          <div className="seams">
            {cat.map((_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <div className="gone" />
      </div>

      <p className="xem__luu">{dich(m.mo)}</p>
    </>
  )
}
