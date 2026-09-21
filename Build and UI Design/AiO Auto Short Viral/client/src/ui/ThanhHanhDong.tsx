/**
 * Thanh hành động ghim đáy — chỉ hiện SAU khi đã đọc nội dung.
 *
 * Một nút CHÍNH: "Tạo sequence" (kèm mũi tên chọn cách: mỗi khối một sequence /
 * gộp vào một sequence). Một nút phụ: "Đặt marker". Nhãn nói HẬU QUẢ bằng số
 * thật ("Tạo 5 sequence", "Đặt 5 marker") — người dùng biết trước khi bấm.
 *
 * Nút vừa là NÚT vừa là ĐÈN (luật anh Tiến 28/07): làm xong thì nút chính XANH
 * "Đã tạo 5 sequence" cho tới khi đổi lựa chọn — nên không cần thêm dòng báo
 * thành công nào nữa (một thông điệp chỉ nói ở MỘT nơi). Dòng thông báo phía
 * trên chỉ dùng khi hỏng, dừng giữa chừng, hoặc có con số cần soát.
 *
 * Menu chọn cách tạo nằm trong thanh này (KHÔNG trong thẻ có content-visibility)
 * nên đặt `position: absolute` bình thường được.
 */
import { useEffect, useRef, useState } from 'react'
import { dich } from '../ngonngu'
import { DangChay } from './DangChay'
import { Ic, dp } from './chung'
import type { LoiHien } from './chung'

export type CheDoTao = 'moi-khoi' | 'gop'

export interface ThongBao {
  loai: 'loi' | 'canh' | 'ok'
  loi: LoiHien
  /**
   * Nút cho ĐÚNG việc câu báo bảo người dùng làm. Vì sao (soát 19/09): câu "Bản
   * nghe … bị lệch … Bấm Nghe lại" hiện ở màn bắt đầu, nơi KHÔNG có nút Nghe lại
   * nào (nút đó chỉ vẽ khi đã có phiên đọc từ đệm cũ) — người dùng kẹt vĩnh viễn.
   * Câu nào chỉ tới một nút thì nút đó phải nằm ngay cạnh câu.
   */
  hanhDong?: { nhan: string; lam: () => void }
}

export function DongThongBao({ tb, onDong }: { tb: ThongBao; onDong: () => void }) {
  return (
    <div className={'thong-bao thong-bao--' + tb.loai} role={tb.loai === 'loi' ? 'alert' : 'status'}>
      <p className="thong-bao__chu" title={tb.loi.chiTiet || undefined}>
        {tb.loi.chu}
      </p>
      {tb.hanhDong && (
        <button type="button" className="btn btn--nho" onClick={tb.hanhDong.lam}>
          {tb.hanhDong.nhan}
        </button>
      )}
      <button type="button" className="nut-ic nut-ic--nho" aria-label={dich('Đóng')} title={dich('Đóng')} onClick={onDong}>
        <Ic ten="xoa" co={13} />
      </button>
    </div>
  )
}

export function ThanhHanhDong({
  nguon,
  soChon,
  tatCa,
  coTheChon,
  cheDoTao,
  onDoiCheDo,
  onChonHet,
  onTao,
  onMarker,
  daTao,
  daDat,
  chay,
  demChay,
  onDung,
  dangDung,
  thongBao,
  onDongThongBao,
  khoa,
  chiXem,
  xacNhanMarker,
  onXacNhanMarker,
  onThoiMarker,
}: {
  /**
   * Lựa chọn đang lấy từ đâu: `'khoi'` = thẻ khối ở tab "Khối hỏi–đáp",
   * `'cau'` = vùng câu liền nhau ở tab "Toàn bộ lời". Thanh này chỉ ĐỔI CHỮ theo
   * nguồn (đếm khối / đếm câu); việc dựng do App làm.
   * ☠️ Vùng câu luôn là MỘT khoảng liền → luôn ra một sequence, nên nút mũi tên
   * chọn cách tạo (mỗi khối một sequence / gộp) ẩn đi ở nguồn này: để lại là cho
   * người dùng bấm một lựa chọn không có tác dụng.
   */
  nguon: 'khoi' | 'cau'
  /** Số khối (nguồn 'khoi') hoặc số câu (nguồn 'cau') đang chọn — kể cả cái bị ô tìm che. */
  soChon: number
  /** Đã chọn hết → nút đổi thành "Bỏ chọn". */
  tatCa: boolean
  /** Có gì đang hiện mà chọn được không. */
  coTheChon: boolean
  cheDoTao: CheDoTao
  onDoiCheDo: (c: CheDoTao) => void
  onChonHet: () => void
  onTao: () => void
  onMarker: () => void
  /** Số sequence vừa tạo cho ĐÚNG lựa chọn đang có; null = chưa. */
  daTao: number | null
  daDat: number | null
  /** Đang tạo / đang đặt marker: hiện thanh tiến độ thay cho hai nút. */
  chay: { batDau: number; phanTram: number } | null
  /**
   * Dòng đếm hiện trên thanh tiến độ ("Đang đưa khối 3/12"). Rỗng / không có thì
   * thanh nói "Đang xử lý…" như cũ — dùng cho việc chỉ có MỘT bước (đặt marker,
   * tạo một sequence từ vùng câu): "1/1" không nói thêm được gì.
   */
  demChay?: string
  onDung?: () => void
  dangDung?: boolean
  thongBao: ThongBao | null
  onDongThongBao: () => void
  /** Có việc khác đang chạy (đọc nội dung) — khoá hai nút. */
  khoa: boolean
  /** Chạy ngoài Premiere: hai nút vẫn hiện nhưng bấm là báo "Chỉ chạy trong Premiere". */
  chiXem: boolean
  /**
   * Đang hỏi trước khi đặt marker: số marker CŨ của panel sẽ bị thay (đếm lại ngay
   * lúc bấm). null = không hỏi. ☠️ Vì sao hỏi (soát 19/09): host xoá mọi marker cũ
   * của panel RỒI mới đặt — nút "Đặt 3 marker" thật ra cũng là nút xoá 19 marker,
   * mà người dùng chỉ biết sau khi đã xoá. Luật anh Tiến: nút xoá nói hậu quả bằng
   * số thật TRƯỚC khi bấm.
   */
  xacNhanMarker: number | null
  onXacNhanMarker: () => void
  onThoiMarker: () => void
}) {
  const [moMenu, setMoMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moMenu) return
    const ngoai = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMoMenu(false)
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoMenu(false)
    }
    document.addEventListener('mousedown', ngoai, true)
    window.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('mousedown', ngoai, true)
      window.removeEventListener('keydown', phim)
    }
  }, [moMenu])

  const theoCau = nguon === 'cau'
  const nhanTao =
    daTao !== null
      ? dp('Đã tạo {n} sequence', { n: daTao })
      : soChon === 0
        ? dich('Tạo sequence')
        : theoCau
          ? dich('Tạo 1 sequence')
          : cheDoTao === 'gop'
            ? dich('Gộp vào 1 sequence')
            : dp('Tạo {n} sequence', { n: soChon })

  const nhanMarker =
    daDat !== null
      ? dp('Đã đặt {n} marker', { n: daDat })
      : soChon === 0
        ? dich('Đặt marker')
        : theoCau
          ? dich('Đặt 1 marker')
          : dp('Đặt {n} marker', { n: soChon })

  return (
    <footer className="thanh-hd">
      <div className="thanh-hd__ruot">
        {thongBao && <DongThongBao tb={thongBao} onDong={onDongThongBao} />}
        {xacNhanMarker !== null && !chay && (
          <div className="xac-nhan" role="alertdialog" aria-label={dich('Đặt marker')}>
            <p className="xac-nhan__chu">
              {dp('Đặt {a} marker và thay {b} marker cũ của panel? Marker khác trên sequence giữ nguyên.', {
                // Nguồn 'cau' đặt ĐÚNG MỘT marker phủ cả vùng — không phải mỗi câu một marker.
                a: theoCau ? 1 : soChon,
                b: xacNhanMarker,
              })}
            </p>
            <div className="xac-nhan__nut">
              <button type="button" className="btn btn--nho" onClick={onThoiMarker}>
                {dich('Thôi')}
              </button>
              <button type="button" className="btn btn--nho btn--nguy" disabled={khoa || soChon === 0} onClick={onXacNhanMarker}>
                {dich('Đặt và thay')}
              </button>
            </div>
          </div>
        )}
        {chay ? (
          <DangChay batDau={chay.batDau} phanTram={chay.phanTram} nhan={demChay} onDung={onDung} dangDung={dangDung} />
        ) : (
          <div className="thanh-hd__hang">
            <div className="thanh-hd__dem">
              <span className="thanh-hd__so">
                {theoCau ? dp('Đã chọn {n} câu', { n: soChon }) : dp('Đã chọn {n} khối', { n: soChon })}
              </span>
              {/* ☠️ Chữ "Chọn hết" CHỈ còn ở nguồn 'cau'. Tab khối đã có PILL ngay đầu
                  danh sách (anh Tiến giao 21/09) — để cả hai là hai cái nút làm cùng
                  một việc cách nhau 300 px, đúng thứ luật "một thông điệp một nơi"
                  cấm. Số "Đã chọn N khối" thì giữ: nó là con số, không phải nút. */}
              {theoCau && (
                <button type="button" className="nut-chu" onClick={onChonHet} disabled={khoa || !coTheChon}>
                  {tatCa ? dich('Bỏ chọn') : dich('Chọn hết')}
                </button>
              )}
            </div>
            <button
              type="button"
              className={'btn thanh-hd__phu' + (daDat !== null ? ' btn--da-xong' : '')}
              // KHÔNG khoá sau khi đặt xong: người dùng xoá tay marker trong
              // Premiere rồi muốn đặt lại thì bấm lại được (host thay marker
              // cũ của panel, không đặt trùng). Nút tạo sequence thì KHOÁ —
              // bấm lại là ra bộ sequence trùng thứ hai.
              disabled={khoa || soChon === 0}
              onClick={onMarker}
              title={
                chiXem
                  ? dich('Chỉ chạy trong Premiere')
                  : theoCau
                    ? dich('Đặt một marker phủ vùng câu đã chọn. Marker cũ do panel đặt (tên bắt đầu “SV ”) được thay mới; marker khác giữ nguyên.')
                    : dich('Đặt marker ở đầu mỗi khối đã chọn. Marker cũ do panel đặt (tên bắt đầu “SV ”) được thay mới; marker khác giữ nguyên.')
              }
            >
              {nhanMarker}
            </button>
            <div
              className={
                'tach-nut' +
                (daTao === null && soChon === 0 ? ' tach-nut--tat' : '') +
                // Không có nút mũi tên thì nút chính phải tròn cả hai mép phải.
                (theoCau ? ' tach-nut--mot' : '')
              }
              ref={menuRef}
            >
              <button
                type="button"
                className={'btn btn--chinh tach-nut__chinh' + (daTao !== null ? ' btn--xong' : '')}
                disabled={khoa || soChon === 0 || daTao !== null}
                onClick={onTao}
                title={chiXem ? dich('Chỉ chạy trong Premiere') : undefined}
              >
                {nhanTao}
              </button>
              {!theoCau && (
                <button
                  type="button"
                  className={'btn btn--chinh tach-nut__mui' + (daTao !== null ? ' btn--xong' : '')}
                  aria-label={dich('Chọn cách tạo sequence')}
                  title={dich('Chọn cách tạo sequence')}
                  aria-haspopup="menu"
                  aria-expanded={moMenu}
                  disabled={khoa}
                  onClick={() => setMoMenu((m) => !m)}
                >
                  <Ic ten="xuong" co={14} />
                </button>
              )}
              {!theoCau && moMenu && (
                <div className="menu menu--tren" role="menu" aria-label={dich('Chọn cách tạo sequence')}>
                  {(
                    [
                      ['moi-khoi', 'Mỗi khối một sequence', 'Mỗi khối thành một sequence riêng, đặt tên theo câu hỏi'],
                      ['gop', 'Gộp vào một sequence', 'Các khối đã chọn nối liền nhau trong một sequence mới'],
                    ] as const
                  ).map(([ma, nhan, giai]) => (
                    <button
                      key={ma}
                      type="button"
                      role="menuitemradio"
                      aria-checked={cheDoTao === ma}
                      className={'menu__muc menu__muc--chon' + (cheDoTao === ma ? ' menu__muc--dang' : '')}
                      onClick={() => {
                        onDoiCheDo(ma)
                        setMoMenu(false)
                      }}
                    >
                      <span className="menu__dau" aria-hidden="true">
                        {cheDoTao === ma && <Ic ten="dung" co={13} />}
                      </span>
                      <span className="menu__chu">
                        <span>{dich(nhan)}</span>
                        <small>{dich(giai)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  )
}
