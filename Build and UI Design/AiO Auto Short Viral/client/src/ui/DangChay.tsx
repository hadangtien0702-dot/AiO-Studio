/**
 * Khối ĐANG CHẠY — chép khuôn `DangChay` của Transcripts (App.tsx ~1280-1330)
 * để các panel trong bộ nói cùng một kiểu.
 *
 * ☠️ GIẤU QUY TRÌNH (anh Tiến chốt 13/08, nhắc lại 24/08): chỉ "Đang xử lý… N%"
 * + đồng hồ. KHÔNG tên bước ("đang tách tiếng", "đang nạp mô hình"…) — đọc tên
 * bước là ra nguyên pipeline, phần giá trị nhất của tool.
 * ☠️ GIỮ % và đồng hồ CÓ CHỦ Ý: bỏ nốt thì người dùng không phân biệt được
 * "đang chạy" với "đã treo". Giấu VIỆC, không giấu TIẾN ĐỘ.
 *
 * Đồng hồ tự đếm BÊN TRONG component này — để App không phải vẽ lại mỗi giây
 * (App vẽ lại là cả danh sách khối/câu bị so lại, phí vô ích).
 */
import { useEffect, useState } from 'react'
import { dich } from '../ngonngu'
import { dongHo } from './chung'

export function DangChay({
  batDau,
  phanTram,
  nhan,
  onDung,
  dangDung,
}: {
  /** Date.now() lúc bắt đầu. */
  batDau: number
  /** 0..100; < 0 = chưa đo được (vệt sáng trôi, không đứng ở 0%). */
  phanTram: number
  /**
   * Dòng ĐẾM thay cho chữ "Đang xử lý…" — "Đang đưa khối 3/12" (anh Tiến giao
   * 21/09). Vẫn là TIẾN ĐỘ, không phải tên bước kỹ thuật, nên không phạm luật
   * giấu quy trình. Thay chữ chứ không thêm dòng thứ hai: hai chỗ cùng nói
   * "đang chạy" là bắt mắt đọc hai lần (luật "một thông điệp một nơi"), và
   * panel rộng 300 px không còn chỗ.
   *
   * ☠️ Có `nhan` thì KHÔNG in thêm "N%" và KHÔNG thêm dấu "…": "3/12" với "25%"
   * là CÙNG một sự thật, mà chỗ cho chữ ở khổ 300 px rất hẹp. % vẫn còn ở vệt
   * sáng của thanh và ở `aria-valuenow` (bộ đọc màn hình vẫn nghe được).
   *
   * SỐ ĐO LẠI 21/09 (soát lần hai — thước cũ báo THIẾU ~7 px vì đo bằng canvas
   * measureText, không phải bề rộng dàn trang): CSS rút từ `dist/index.html` đã
   * build, DOM dựng lại đúng cây này ở khổ 300 px, Chrome headless=new, chờ
   * `document.fonts.ready`, bề rộng chữ đo bằng span thử cùng font + đối chứng
   * `scrollWidth` ở ca tràn (72 cảnh):
   *   "Đang đưa khối 12/12…" = 145,1 px · bỏ dấu "…" = 132,6 px
   *   "Adding block 12/12…"  = 137,4 px · bỏ dấu "…" = 124,9 px
   * Chỗ cho chữ KHÔNG phải 158–176 px như ghi lần đầu, mà 97–175 px — tuỳ nhãn
   * nút Dừng, tuỳ đồng hồ (`dongHo` là m:ss, phút không chặn trên → "100:05")
   * và tuỳ `--rong-thanh-cuon` (App đo bề rộng thanh cuộn thật, danh sách dài
   * thì 11–15 px). Hẹp nhất còn dùng được: gutter 15 + "100:05" → 140 px, nên
   * "…" phải bỏ (145,1 thì CẮT 5 px, 132,6 thì còn thừa 7,4 px).
   * Kết luận cũ "bỏ ô N%" vẫn đúng theo cả hai thước — giữ nguyên.
   */
  nhan?: string
  /** Có thì hiện nút Dừng — việc ăn tài nguyên phải luôn có đường dừng. */
  onDung?: () => void
  dangDung?: boolean
}) {
  const [giay, setGiay] = useState(() => Math.floor((Date.now() - batDau) / 1000))
  useEffect(() => {
    setGiay(Math.floor((Date.now() - batDau) / 1000))
    const h = window.setInterval(() => setGiay(Math.floor((Date.now() - batDau) / 1000)), 1000)
    return () => window.clearInterval(h)
  }, [batDau])

  const doDuoc = phanTram >= 0
  const pt = Math.max(0, Math.min(100, Math.round(phanTram)))
  return (
    <div className="chay">
      <div
        className={'chay__thanh' + (doDuoc ? '' : ' chay__thanh--troi') + (onDung ? ' chay__thanh--co-dung' : '')}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={doDuoc ? pt : undefined}
        aria-label={nhan || dich('Đang xử lý')}
      >
        {doDuoc && <div className="chay__day" style={{ width: pt + '%' }} />}
        <span className="chay__chu">
          {nhan ? nhan : dich('Đang xử lý') + '…'}
          {!nhan && doDuoc && <b>{pt}%</b>}
        </span>
        <span className="chay__gio">{dongHo(giay)}</span>
        {/* ☠️ NHÃN NÚT KHÔNG ĐƯỢC ĐỔI BỀ RỘNG LÚC ĐANG CHẠY (soát 21/09). Bản đầu
            đổi "Dừng" → "Đang dừng…": nút phình 48,9 → 92 px, chỗ cho dòng đếm tụt
            127 px và "Đang đưa khối 12/12…" (145,1 px) BỊ CẮT ĐUÔI đúng chỗ con số
            i/n — mất đúng thứ tính năng này sinh ra để hiện, mất đúng lúc người
            dùng đang đợi xem lệnh dừng có ăn. Đo 72 cảnh: nhãn "Đang dừng…" CẮT
            18–48 px (VI) và 1–29 px (EN, "Stopping…"); giữ nhãn "Dừng" thì mọi
            cảnh vừa (thừa 7,4–50,1 px). Trạng thái "đã nhận lệnh dừng" vẫn NHÌN RA
            ĐƯỢC mà không đổi bề rộng: `disabled` + `.btn:disabled{opacity:.5}`, và
            bộ đọc màn hình đọc là nút không dùng được nữa. */}
        {onDung && (
          <button type="button" className="btn btn--nho chay__dung" onClick={onDung} disabled={dangDung}>
            {dich('Dừng')}
          </button>
        )}
      </div>
    </div>
  )
}
