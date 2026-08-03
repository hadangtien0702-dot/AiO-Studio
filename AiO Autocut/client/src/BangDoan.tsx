/**
 * BangDoan.tsx — bảng "N đoạn sẽ cắt".
 *
 * Anh Tiến 2026-08-03, nhìn panel thật rồi hỏi: *"khi anh mở panel lên cái bảng
 * này của anh đâu?"* — bản ghép đầu tiên bỏ mất hai cột **Dạng sóng** và
 * **Giữ lại**, và lúc chưa phân tích thì không có gì cả.
 *
 * Nên file này làm ba việc:
 *   1. BẢNG THẬT — đủ 5 cột như thiết kế, dạng sóng vẽ từ mức âm ĐO ĐƯỢC của
 *      chính đoạn đó, không phải hình trang trí.
 *   2. BẢNG MẪU — lúc chưa phân tích, cho khách hình dung panel làm gì.
 *      ☠️ Phải NÓI RÕ là ví dụ. Bày số giả mà không nói thì người dùng tưởng
 *      đó là clip của mình — đúng loại lỗi anh Tiến đã bắt: *"đừng lấy số đo
 *      ra bao biện cho thứ hiển thị sai"*.
 *   3. ẢO HOÁ — chỉ dựng những hàng đang nhìn thấy.
 *      Đo 03/08 trên chính thiết kế: 1.914 đoạn (video 58 phút) × 45 vạch =
 *      **101.442 phần tử DOM**, dựng mất **688ms**, và mỗi lần bấm "Giữ lại"
 *      là dựng lại từ đầu. Với 73 đoạn thì không sao — nhưng người dùng thật
 *      không cắt video 4 phút.
 */
import { useEffect, useRef, useState } from 'react'
import type { MucAm, Quang } from './services/amluong'

/** Số vạch mỗi dạng sóng. 45 vạch đủ thấy nhịp mà không thành cái lược. */
const SO_VACH = 45
/** Chiều cao một hàng, PHẢI khớp `.tbl td { height }` trong `giao-dien.css`.
    Lệch nhau là ảo hoá tính sai vị trí, hàng nhảy lung tung khi cuộn. */
const CAO_HANG = 33
/** Dưới ngần này thì dựng hết cho xong, ảo hoá chỉ tổ phức tạp. */
const NGUONG_AO_HOA = 120
/** Dựng thừa trên/dưới khung nhìn ngần này hàng, để cuộn nhanh không thấy trắng. */
const DEM = 12

const DB_DAY = -75
const DB_DINH = -5

/** Chiều cao từng vạch (%) cho khoảng [tu, den] — đọc thẳng mức âm đã đo. */
function veVach(mucAm: MucAm, tu: number, den: number): number[] {
  const b = mucAm.buocGiay
  const i0 = Math.max(0, Math.floor(tu / b))
  const i1 = Math.min(mucAm.cua.length, Math.max(i0 + 1, Math.ceil(den / b)))
  const moiVach = (i1 - i0) / SO_VACH
  const ra: number[] = []
  for (let v = 0; v < SO_VACH; v++) {
    const a = i0 + Math.floor(v * moiVach)
    const z = Math.min(i1, Math.max(a + 1, i0 + Math.floor((v + 1) * moiVach)))
    let dinh = -Infinity
    for (let i = a; i < z; i++) if (mucAm.cua[i] > dinh) dinh = mucAm.cua[i]
    const t = (dinh - DB_DAY) / (DB_DINH - DB_DAY)
    // Sàn 6%: vạch cao 0px thì nhìn ra ô trống, người dùng tưởng mất dữ liệu.
    ra.push(Math.round(Math.max(0.06, Math.min(1, t)) * 100))
  }
  return ra
}

function Song({ cao, giu }: { cao: number[]; giu: boolean }) {
  return (
    <span className={giu ? 'spark spark--giu' : 'spark'}>
      {cao.map((h, i) => (
        <i key={i} style={{ height: `${h}%` }} />
      ))}
    </span>
  )
}

interface Props {
  cat: Quang[]
  mucAm: MucAm
  giuLai: Quang[]
  onDoiGiu: (q: Quang) => void
  tcode: (giay: number) => string
}

export function BangDoan({ cat, mucAm, giuLai, onDoiGiu, tcode }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [cuon, setCuon] = useState(0)
  const [caoBox, setCaoBox] = useState(400)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const doLai = () => {
      setCuon(el.scrollTop)
      setCaoBox(el.clientHeight || 400)
    }
    doLai()
    el.addEventListener('scroll', doLai, { passive: true })
    const ro = new ResizeObserver(doLai)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', doLai)
      ro.disconnect()
    }
  }, [])

  const aoHoa = cat.length > NGUONG_AO_HOA
  const dau = aoHoa ? Math.max(0, Math.floor(cuon / CAO_HANG) - DEM) : 0
  const cuoi = aoHoa
    ? Math.min(cat.length, Math.ceil((cuon + caoBox) / CAO_HANG) + DEM)
    : cat.length
  const dangGiu = (c: Quang) => giuLai.some((g) => g.tu === c.tu && g.den === c.den)

  return (
    <div className="scroller" ref={boxRef}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            <th>Dài</th>
            <th>Dạng sóng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {/* Hai hàng đệm giữ đúng chiều cao thật, để thanh cuộn không nhảy. */}
          {dau > 0 && (
            <tr style={{ height: dau * CAO_HANG }} aria-hidden="true">
              <td colSpan={5} />
            </tr>
          )}
          {cat.slice(dau, cuoi).map((c, k) => {
            const i = dau + k
            const giu = dangGiu(c)
            return (
              <tr key={i} data-giu={giu ? '' : undefined}>
                <td>{tcode(c.tu)}</td>
                <td>{tcode(c.den)}</td>
                <td className="dur">{(c.den - c.tu).toFixed(1).replace('.', ',')} s</td>
                <td>
                  <Song cao={veVach(mucAm, c.tu, c.den)} giu={giu} />
                </td>
                <td>
                  <button
                    className="btn btn--sm keep-btn"
                    aria-pressed={giu}
                    onClick={() => onDoiGiu(c)}
                  >
                    {giu ? 'Đang giữ' : 'Giữ lại'}
                  </button>
                </td>
              </tr>
            )
          })}
          {cuoi < cat.length && (
            <tr style={{ height: (cat.length - cuoi) * CAO_HANG }} aria-hidden="true">
              <td colSpan={5} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   BẢNG MẪU — lúc chưa phân tích
   ══════════════════════════════════════════════════════════════════════════ */

/** Số cố định, KHÔNG random: mở panel hai lần thấy hai bảng khác nhau thì
    người dùng tưởng máy đang đo cái gì đó. Mẫu thì phải đứng yên. */
const MAU: { tu: string; den: string; dai: string; song: number[] }[] = [
  { tu: '00:00:16:15', den: '00:00:18:06', dai: '1,6' },
  { tu: '00:00:20:15', den: '00:00:24:22', dai: '4,3' },
  { tu: '00:00:26:13', den: '00:00:29:15', dai: '3,1' },
  { tu: '00:00:34:22', den: '00:00:39:06', dai: '4,3' },
  { tu: '00:00:43:06', den: '00:00:44:03', dai: '0,9' },
  { tu: '00:00:46:21', den: '00:00:50:22', dai: '4,1' },
].map((r, k) => ({
  ...r,
  song: Array.from({ length: SO_VACH }, (_, i) => {
    // Nhiễu tất định — cùng một hàng luôn ra cùng một hình.
    const x = Math.sin((k * 97 + i * 13.37) * 1.7) * 0.5 + 0.5
    return Math.round(8 + x * 34)
  }),
}))

export function BangMau() {
  return (
    <div className="mau">
      {/* Nói TRƯỚC khi người ta kịp đọc số. Đây là chỗ dễ hiểu nhầm nhất trong
          cả panel: bảng nhìn y như thật. */}
      <p className="mau__nhan">
        Ví dụ cho dễ hình dung — chưa phải clip của bạn. Bấm <b>Cắt khoảng lặng</b> để
        panel nghe clip đang khoanh rồi liệt kê đúng chỗ im của nó.
      </p>
      <div className="mau__bang" aria-hidden="true">
        <table className="tbl">
          <thead>
            <tr>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Dài</th>
              <th>Dạng sóng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {MAU.map((r, i) => (
              <tr key={i}>
                <td>{r.tu}</td>
                <td>{r.den}</td>
                <td className="dur">{r.dai} s</td>
                <td>
                  <Song cao={r.song} giu={false} />
                </td>
                <td>
                  <span className="btn btn--sm">Giữ lại</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
