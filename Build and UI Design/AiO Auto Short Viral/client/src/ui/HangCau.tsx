/**
 * Một dòng câu — dùng chung cho tab "Toàn bộ lời" và danh sách câu khi mở
 * rộng một khối.
 *
 * ☠️ `data-cau` là CHỖ NEO của đầu đọc: App tô sáng câu đang phát bằng cách đặt
 * thuộc tính `data-phat` thẳng lên DOM (xem `veDauDoc` trong App.tsx), KHÔNG qua
 * state React. Nhờ vậy mỗi nhịp 1 giây đầu đọc nhúc nhích không làm vẽ lại
 * 2.000 dòng. Đừng đổi tên thuộc tính này mà không sửa App.
 *
 * ☠️ `data-chon` (câu nằm trong vùng đang chọn) cũng KHÔNG đi qua props — App đặt
 * thẳng lên DOM như `data-phat` (`veVungChon`). Đo 21/09: để nó thành prop thì
 * Shift+bấm chọn 501 câu mất 43,2 ms, bỏ chọn 794 câu mất 57,2 ms.
 *
 * `memo` + callback ổn định từ App: gõ tìm hay đổi khối chỉ vẽ lại những dòng
 * có props đổi thật. Mọi thứ thêm 21/09 (độ dài câu, nhãn khối, bung từ) đều
 * truyền bằng GIÁ TRỊ ĐƠN — trừ `tu` (mảng từ) chỉ truyền cho dòng đang mở, các
 * dòng khác nhận `null` (một giá trị bất biến, memo không vỡ).
 *
 * Hai lối bấm dòng (tab "Toàn bộ lời" đưa `onBam`, tab khối thì không):
 *  - bấm thường : nhảy đầu đọc tới câu + lấy câu này làm NEO của vùng chọn
 *  - Shift+bấm  : kéo vùng chọn tới câu này, KHÔNG dời đầu đọc (đang gom một
 *                 khoảng để tạo sequence thì đừng làm đầu đọc chạy lung tung)
 */
import { memo } from 'react'
import { dich } from '../ngonngu'
import type { TuSeq } from '../services/kieu'
import { Ic, ToSang, daiHienThi, dp, mocTu, soLe } from './chung'

/** Từ có điểm tin cậy dưới mức này thì tô khác — cùng ngưỡng với `CauSeq.tinCayThap`. */
const P_YEU = 0.5

export const HangCau = memo(function HangCau({
  id,
  giay,
  moc,
  chu,
  bia,
  nghi,
  q,
  tachTu,
  dai = -1,
  nhanKhoi = '',
  mo = false,
  tu = null,
  onNhay,
  onTach,
  onBam,
  onMo,
  onChep,
}: {
  /** CauSeq.id */
  id: number
  /** Giây SEQUENCE để nhảy tới. */
  giay: number
  moc: string
  chu: string
  bia: boolean
  nghi: boolean
  /** Chuỗi đang tìm — chỉ để tô, rỗng = không tô. */
  q: string
  /** Chỉ số từ để tách khối tại đây; < 0 = dòng này không tách được. */
  tachTu: number
  /** Độ dài câu (giây); < 0 = không hiện. */
  dai?: number
  /** "Q3" khi câu này mở đầu một khối; '' = không phải. */
  nhanKhoi?: string
  /** Đang bung ra xem từng từ. */
  mo?: boolean
  /** Các từ của câu — CHỈ truyền khi `mo`, còn lại để `null`. */
  tu?: TuSeq[] | null
  onNhay: (giay: number) => void
  onTach?: (tuIdx: number) => void
  onBam?: (id: number, giay: number, keoDai: boolean) => void
  onMo?: (id: number) => void
  onChep?: (id: number) => void
}) {
  return (
    <li className="cau" data-cau={id}>
      {onMo && (
        <button
          type="button"
          className="cau__mo"
          aria-expanded={mo}
          aria-label={dich('Xem từng từ')}
          title={dich('Xem từng từ kèm mốc giờ và điểm tin cậy')}
          onClick={() => onMo(id)}
        >
          <Ic ten={mo ? 'xuong' : 'phai'} co={13} />
        </button>
      )}
      <button
        type="button"
        className="cau__nut"
        onClick={(e) => (onBam ? onBam(id, giay, e.shiftKey) : onNhay(giay))}
        title={bia ? dp('Máy nghe ra: “{c}” — thường là chữ máy tự bịa', { c: chu }) : undefined}
      >
        <span className="cau__moc">{moc}</span>
        {nhanKhoi && (
          <span className="cau__khoi" title={dich('Câu này mở đầu một khối hỏi–đáp')}>
            {nhanKhoi}
          </span>
        )}
        {bia ? (
          <span className="cau__chu cau__chu--bia">{dich('không nghe rõ')}</span>
        ) : (
          <span
            className={nghi ? 'cau__chu cau__chu--nghi' : 'cau__chu'}
            title={nghi ? dich('Máy nghe không chắc câu này — nên nghe lại') : undefined}
          >
            <ToSang chu={chu} q={q} />
          </span>
        )}
        {dai >= 0 && (
          <span className="cau__dai" title={dich('Độ dài câu')}>
            {daiHienThi(dai)}
          </span>
        )}
      </button>
      <span className="cau__do">
        {onChep && (
          <button
            type="button"
            className="cau__ic"
            aria-label={dich('Chép câu này')}
            title={dich('Chép câu này')}
            onClick={() => onChep(id)}
          >
            <Ic ten="chep" co={13} />
          </button>
        )}
        {onTach && tachTu >= 0 && (
          <button type="button" className="cau__tach" onClick={() => onTach(tachTu)}>
            <Ic ten="keo" co={13} />
            {dich('Tách tại đây')}
          </button>
        )}
      </span>
      {mo &&
        (tu && tu.length ? (
          <ol className="ds-tu">
            {tu.map((w, i) => (
              <li className={'tu' + (w.p < P_YEU ? ' tu--yeu' : '')} key={i}>
                <button
                  type="button"
                  className="tu__nut"
                  // Bấm một từ = đầu đọc nhảy ĐÚNG mốc từ đó, không phải đầu câu.
                  onClick={() => onNhay(w.tu)}
                  title={dp('Nhảy tới {m} — điểm tin cậy {p}', { m: mocTu(w.tu), p: soLe(w.p, 2) })}
                >
                  <span className="tu__chu">{w.chu}</span>
                  <span className="tu__so">
                    {mocTu(w.tu)} · {soLe(w.p, 2)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          // Đệm cũ có câu mà không có mốc từ nào — nói ra, đừng để một khoảng
          // trống không ai hiểu.
          <p className="ds-tu__trong">{dich('Bản nghe này không có mốc từng từ.')}</p>
        ))}
    </li>
  )
})
