/**
 * Thanh trên + dòng NGUỒN (panel sẽ đọc cái gì).
 *
 * Thanh trên: icon · tên panel · ô chọn sequence · nút đổi ngôn ngữ.
 * - Icon ĐỔI MÀU theo trạng thái (cam = đang nối Premiere, xám = ngoài
 *   Premiere) thay cho một chấm đèn riêng — MASTER lỗi #9 "một phần tử làm được
 *   hai việc thì đừng bày hai".
 * - Ô chọn sequence chọn THEO ID (tên sequence trùng nhau được trong Premiere).
 *   Mọi lệnh host đều nhận ID này — KHÔNG dựa vào `activeSequence`, vì nó bám
 *   tab có tiêu điểm và tự trôi (Transcripts 24/08: caption rơi sang sequence
 *   khác mà panel vẫn báo thành công).
 *
 * Dòng nguồn: "Clip đang chọn: N" hoặc "Vùng In/Out: a → b" — App hỏi Premiere
 * mỗi 1 giây (tool phải ĐỒNG HÀNH, luật 19/08): người dùng đổi vùng, chọn clip,
 * đổi sequence thì dòng này đổi theo mà không cần bấm gì trên panel.
 */
import { NutDoiNgonNgu, dich } from '../ngonngu'
import { mocHienThi } from '../services/hoidap'
import { Ic } from './chung'

export interface SeqMucHien {
  id: string
  ten: string
}

export function ThanhTren({
  trongHost,
  dsSeq,
  seqId,
  onDoiSeq,
  khoa,
}: {
  trongHost: boolean
  dsSeq: SeqMucHien[]
  seqId: string
  onDoiSeq: (id: string) => void
  khoa: boolean
}) {
  return (
    <header className="topbar">
      <span
        className={'topbar__icon' + (trongHost ? '' : ' topbar__icon--tat')}
        title={trongHost ? undefined : dich('Đang mở ngoài Premiere')}
      >
        <Ic ten="hoiDap" co={17} />
      </span>
      <h1 className="topbar__ten" title={'AiO Auto Short Viral v' + __VERSION__}>
        Auto Short Viral
      </h1>
      <select
        className="chon-seq"
        value={seqId}
        disabled={khoa || dsSeq.length === 0}
        onChange={(e) => onDoiSeq(e.target.value)}
        aria-label={dich('Sequence panel đang làm việc')}
        title={dich('Sequence panel đang làm việc')}
      >
        {dsSeq.length === 0 && (
          <option value="">{trongHost ? dich('(chưa mở sequence)') : dich('(ngoài Premiere)')}</option>
        )}
        {dsSeq.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ten}
          </option>
        ))}
      </select>
      <NutDoiNgonNgu />
    </header>
  )
}

/** Tóm tắt vùng Premiere đang chọn — đọc NHẸ từ host mỗi giây. */
export interface NguonHien {
  vao: number
  ra: number
  soChon: number
  /**
   * Chọn quá 50 mục: host chỉ đếm thô (gồm cả clip tiếng đi kèm) — `soChon` KHÔNG
   * phải số clip. Soát 19/09: 25 clip hình + tiếng hiện "25", 26 clip hiện "52".
   */
  uocLuong?: boolean
}

export function DongNguon({ nguon, coSeq }: { nguon: NguonHien | null; coSeq: boolean }) {
  if (!nguon || !coSeq) {
    return (
      <div className="nguon nguon--trong" aria-live="polite">
        <Ic ten="ngoac" co={14} className="nguon__ic" />
        <span className="nguon__nhan">{dich('Chưa có sequence nào đang mở.')}</span>
      </div>
    )
  }
  if (nguon.soChon > 0) {
    return (
      <div className="nguon" aria-live="polite">
        <Ic ten="clip" co={14} className="nguon__ic" />
        <span className="nguon__nhan">{dich('Clip đang chọn:')}</span>
        {/* Số ước lượng thì KHÔNG in số — số sai trên màn hình làm mất tin mọi số khác. */}
        <span className="nguon__so">{nguon.uocLuong ? dich('nhiều') : nguon.soChon}</span>
      </div>
    )
  }
  // In/Out chưa khoanh: host trả số ÂM (−400000) — kiểm `< 0`, đừng kiểm `=== 0`
  // (khoanh từ đầu sequence thì In = 0 là hợp lệ).
  if (nguon.vao >= 0 && nguon.ra > nguon.vao) {
    return (
      <div className="nguon" aria-live="polite">
        <Ic ten="ngoac" co={14} className="nguon__ic" />
        <span className="nguon__nhan">{dich('Vùng In/Out:')}</span>
        <span className="nguon__so">
          {mocHienThi(nguon.vao)} → {mocHienThi(nguon.ra)}
        </span>
        <span className="nguon__dai">({mocHienThi(nguon.ra - nguon.vao)})</span>
      </div>
    )
  }
  return (
    <div className="nguon nguon--trong" aria-live="polite">
      <Ic ten="ngoac" co={14} className="nguon__ic" />
      <span className="nguon__nhan">{dich('Chọn clip trên timeline, hoặc khoanh vùng bằng phím')}</span>
      <span className="nguon__phim">
        <kbd>I</kbd> <kbd>O</kbd>
      </span>
    </div>
  )
}
