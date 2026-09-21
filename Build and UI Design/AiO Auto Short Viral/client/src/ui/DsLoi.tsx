/**
 * Tab "Toàn bộ lời" — chỗ anh Tiến ĐỌC cả bài. Mỗi câu một dòng: mốc trên
 * SEQUENCE · nhãn khối (Q mấy) nếu câu đó mở khối · chữ · độ dài câu. Bấm câu =
 * đầu đọc Premiere nhảy tới đó VÀ câu đó thành neo của vùng chọn; Shift+bấm câu
 * khác = chọn cả khoảng giữa hai câu (thanh đáy tạo sequence / đặt marker theo
 * đúng khoảng đó). Bung một câu ra thì thấy TỪNG TỪ kèm mốc giờ và điểm tin cậy
 * p của máy — bấm một từ là nhảy đúng tới từ đó.
 *
 * Đầu tab là một dòng số liệu (số câu · thời lượng nói · số chỗ máy nghe không
 * chắc · số câu máy tự bịa, mỗi tỉ lệ kèm MẪU SỐ — brain bài 5k-bis) và ba nút
 * chép / xuất .txt / xuất .srt.
 *
 * Video 58 phút ra ~2.000 câu (đo Autocut 28/07). Bốn thứ giữ cho nó mượt:
 *   1. mỗi dòng `content-visibility: auto` (styles.css) — dòng ngoài màn hình
 *      không bị dàn trang/vẽ;
 *   2. `memo` ở đây và ở `HangCau` — gõ tìm chỉ dựng lại khi kết quả lọc đổi;
 *   3. đầu đọc KHÔNG đi qua props (App đặt `data-phat` thẳng lên DOM);
 *   4. mảng từ chỉ dựng cho câu ĐANG MỞ, câu khác nhận `null`.
 *
 * Có ô tìm thì LỌC (chỉ còn câu khớp, chữ khớp được tô). Không tìm thì chèn
 * vạch mảnh báo chỗ một khối bắt đầu — để nhìn toàn bài vẫn thấy khung hỏi–đáp.
 *
 * ☠️ Vùng chọn là một KHOẢNG id câu liền nhau, nên đang lọc mà Shift+bấm thì mấy
 * câu KHÔNG khớp nằm giữa cũng vào vùng. Không im lặng chuyện đó: có câu ẩn
 * trong vùng thì hiện hẳn một dòng nói số ẩn là bao nhiêu.
 *
 * ☠️ VÙNG CHỌN KHÔNG ĐI QUA PROPS — App đặt `data-chon` thẳng lên DOM (`veVungChon`),
 * y như `data-phat` của đầu đọc. Đo 21/09 trên bản đầu (vùng chọn là prop của từng
 * dòng, 803 câu Machine trong trình duyệt, bấm giờ bằng MutationObserver):
 * Shift+bấm chọn 501 câu = **43,2 ms**, kéo tới 794 câu = 28,4 ms, Esc bỏ chọn
 * 794 câu = 57,2 ms — ba tới bốn khung hình đứng máy mỗi cú bấm. Nên phần ĐẦU tab
 * (số liệu + nút chép/xuất) tách ra thành `DauLoi`: nó đổi theo vùng chọn, còn
 * danh sách thì không nhận prop nào của vùng chọn nên KHÔNG vẽ lại.
 */
import { Fragment, memo } from 'react'
import { dich } from '../ngonngu'
import { mocHienThi } from '../services/hoidap'
import type { NoiDung } from '../services/kieu'
import type { SoLieuLoi } from '../services/xuat'
import { HangCau } from './HangCau'
import { Ic, dp } from './chung'

export interface NhanKhoiCau {
  /** "Q3" — '' với khối Mở đầu. */
  so: string
  /** Tiêu đề khối (đã rút gọn). */
  ten: string
}

/**
 * Đầu tab: số liệu + nút chép / xuất + dòng báo câu đang bị ô tìm che.
 * Tách khỏi `DsLoi` vì nó ĐỔI THEO VÙNG CHỌN, mà danh sách 2.000 dòng thì không
 * được vẽ lại mỗi lần vùng chọn đổi (xem ghi chú đầu file).
 */
export function DauLoi({
  soLieu,
  soChon,
  soAn,
  daChep,
  khoa,
  coCau,
  onChepHet,
  onXuat,
}: {
  soLieu: SoLieuLoi
  /** Số câu trong vùng đang chọn; 0 = chưa chọn (chép / xuất áp cho CẢ BÀI). */
  soChon: number
  /** Số câu trong vùng chọn đang bị ô tìm che. */
  soAn: number
  /** Số câu vừa chép xong (nút vừa là nút vừa là đèn); null = chưa chép. */
  daChep: number | null
  /** Có việc đang chạy — khoá mấy nút chép / xuất. */
  khoa: boolean
  /** Có câu nào để chép / xuất không. */
  coCau: boolean
  onChepHet: () => void
  onXuat: (loai: 'txt' | 'srt') => void
}) {
  return (
    <>
      <div className="loi-dau">
        <div className="so-lieu">
          <span className="so-lieu__o" title={dich('Tổng số câu máy nghe ra trong vùng')}>
            {dp('{n} câu', { n: soLieu.soCau })}
          </span>
          <span
            className="so-lieu__o"
            title={dich('Tổng thời lượng có người nói (đã trừ khoảng lặng và câu máy tự bịa)')}
          >
            {dp('nói {t}', { t: mocHienThi(soLieu.giayNoi) })}
          </span>
          <span
            className={'so-lieu__o' + (soLieu.soNghiNgo > 0 ? ' so-lieu__o--canh' : '')}
            title={dich(
              'Câu có từ nửa số từ trở lên bị máy chấm tin cậy dưới 0,5 — nên nghe lại. Không tính câu máy tự bịa.',
            )}
          >
            {/* ☠️ Mẫu số là `soThat` (đã trừ câu bịa), KHÔNG phải `soCau`: tử số chỉ
                đếm trên câu thật. Ô "bịa" bên cạnh mới lấy `soCau` — brain 5k-bis. */}
            {dp('không chắc {a}/{b}', { a: soLieu.soNghiNgo, b: soLieu.soThat })}
          </span>
          <span
            className={'so-lieu__o' + (soLieu.soBia > 0 ? ' so-lieu__o--canh' : '')}
            title={dich(
              'Câu máy tự bịa (chuỗi lặp, câu mời đăng ký kênh) — hiện là “không nghe rõ”, không xuất ra file',
            )}
          >
            {dp('bịa {a}/{b}', { a: soLieu.soBia, b: soLieu.soCau })}
          </span>
        </div>
        <div className="loi-nut">
          <button
            type="button"
            className={'btn btn--nho' + (daChep !== null ? ' btn--da-xong' : '')}
            disabled={khoa || !coCau}
            onClick={onChepHet}
            title={soChon > 0 ? dich('Chép phần đang chọn vào bộ nhớ tạm') : dich('Chép cả bài vào bộ nhớ tạm')}
          >
            <Ic ten="chep" co={13} />
            {daChep !== null
              ? dp('Đã chép {n} câu', { n: daChep })
              : soChon > 0
                ? dp('Chép {n} câu', { n: soChon })
                : dich('Chép cả bài')}
          </button>
          <button
            type="button"
            className="btn btn--nho"
            disabled={khoa || !coCau}
            onClick={() => onXuat('txt')}
            title={
              soChon > 0
                ? dich('Xuất phần đang chọn ra file chữ, lưu cạnh video')
                : dich('Xuất cả bài ra file chữ, lưu cạnh video')
            }
          >
            <Ic ten="xuatFile" co={13} />
            {dich('.txt')}
          </button>
          <button
            type="button"
            className="btn btn--nho"
            disabled={khoa || !coCau}
            onClick={() => onXuat('srt')}
            title={
              soChon > 0
                ? dich('Xuất phần đang chọn ra file phụ đề, lưu cạnh video')
                : dich('Xuất cả bài ra file phụ đề, lưu cạnh video')
            }
          >
            <Ic ten="xuatFile" co={13} />
            {dich('.srt')}
          </button>
        </div>
      </div>

      {soAn > 0 && (
        <p className="ghi-chu">
          {dp('Vùng chọn gồm {n} câu liền nhau, trong đó {m} câu không khớp ô tìm nên đang bị ẩn.', {
            n: soChon,
            m: soAn,
          })}
        </p>
      )}
    </>
  )
}

export const DsLoi = memo(function DsLoi({
  nd,
  khop,
  q,
  dauKhoi,
  moCau,
  onNhay,
  onBam,
  onMo,
  onChep,
}: {
  nd: NoiDung
  /** id câu khớp ô tìm; null = không tìm. */
  khop: Set<number> | null
  q: string
  /** id câu → nhãn khối bắt đầu ở câu đó. */
  dauKhoi: Map<number, NhanKhoiCau>
  /** id các câu đang bung xem từng từ. */
  moCau: Set<number>
  onNhay: (giay: number) => void
  onBam: (id: number, giay: number, keoDai: boolean) => void
  onMo: (id: number) => void
  onChep: (id: number) => void
}) {
  const hang = khop ? nd.cau.filter((c) => khop.has(c.id)) : nd.cau
  return (
    <>
      {!hang.length ? (
        <p className="trong">{q ? dich('Không có câu nào khớp.') : dich('Không nghe ra lời nào trong vùng này.')}</p>
      ) : (
        <ol className="ds-cau ds-cau--loi">
          {hang.map((c) => {
            const nhan = dauKhoi.get(c.id)
            const mo = moCau.has(c.id)
            return (
              <Fragment key={c.id}>
                {!khop && nhan && (
                  <li className="vach-khoi" aria-hidden="true">
                    <span>{(nhan.so ? nhan.so + ' · ' : '') + nhan.ten}</span>
                  </li>
                )}
                <HangCau
                  id={c.id}
                  giay={c.tu}
                  moc={mocHienThi(c.tu)}
                  chu={c.chu}
                  bia={c.bia}
                  nghi={c.tinCayThap}
                  q={q}
                  tachTu={-1}
                  dai={Math.max(0, c.den - c.tu)}
                  nhanKhoi={nhan ? nhan.so : ''}
                  mo={mo}
                  tu={mo ? nd.tu.slice(c.tuDau, c.tuCuoi) : null}
                  onNhay={onNhay}
                  onBam={onBam}
                  onMo={onMo}
                  onChep={onChep}
                />
              </Fragment>
            )
          })}
        </ol>
      )}
    </>
  )
})
