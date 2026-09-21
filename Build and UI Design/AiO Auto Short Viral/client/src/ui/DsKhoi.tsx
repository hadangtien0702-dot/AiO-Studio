/**
 * Tab "Khối hỏi–đáp" — mỗi khối một thẻ.
 *
 * Người dựng nhìn một thẻ phải quyết được ngay "giữ hay bỏ, gộp hay tách" mà
 * không cần nghe lại: số thứ tự · mốc từ–đến trên SEQUENCE · độ dài · câu hỏi
 * (tiêu đề) · câu trả lời đầu tiên · cờ máy không chắc. Đo ở Machine 19/09 (báo
 * cáo nao-hoi-dap): 5/19 ranh giới máy chia sai → sửa tay phải NHANH, nên gộp /
 * tách / bỏ / đổi tên đều làm ngay trên thẻ, và mọi thao tác hoàn tác được.
 *
 * ☠️ THẺ CÓ `content-visibility: auto` (xem styles.css) ⇒ trình duyệt bật
 * paint containment ⇒ mọi thứ `position: absolute/fixed` BÊN TRONG thẻ bị CẮT
 * theo mép thẻ. Nên menu "⋯" KHÔNG nằm trong thẻ — thẻ chỉ báo toạ độ nút lên
 * App, App vẽ menu ở tầng ngoài cùng (`MenuKhoi`).
 */
import { memo, useRef } from 'react'
import { dich } from '../ngonngu'
import { mocHienThi } from '../services/hoidap'
import type { TrangThaiChon } from '../services/hoidap'
import type { CoKhoi, Khoi, NoiDung } from '../services/kieu'
import { HangCau } from './HangCau'
import { Ic, dp, tenKhoi } from './chung'

/**
 * PILL CHỌN TẤT CẢ / BỎ CHỌN — đứng ngay đầu danh sách khối (anh Tiến giao
 * 21/09: *"một pill ngay đầu danh sách: bấm lần một tick hết, bấm lần hai bỏ
 * hết, trên pill có SỐ"*). Trước đó chỉ có chữ "Chọn hết" nhỏ ở thanh đáy, và
 * muốn bỏ chọn thì phải đi tắt từng ô tích.
 *
 * Ba trạng thái, mỗi trạng thái nói bằng BA đường (không chỉ bằng màu):
 *   chưa chọn → ô tích rỗng   · nhãn "Chọn tất cả (31)"      · aria-pressed=false
 *   nửa vời   → ô tích có gạch · nhãn "Chọn tất cả (5/31)"    · aria-pressed=mixed
 *   chọn hết  → ô tích có tick · nhãn "Bỏ chọn (31)"          · aria-pressed=true
 *
 * `<button>` thật nên Tab tới được, Enter/Space bấm được — không tự bắt phím.
 * Con số trong ngoặc là số khối CHỌN ĐƯỢC ĐANG HIỆN (khối đã bỏ không tính, ô
 * tìm lọc bớt thì số tụt theo) — `trangThaiChon` của hoidap.ts tính, cùng một
 * hàm với cú bấm nên nhãn không bao giờ nói khác việc.
 */
export const PillChon = memo(function PillChon({
  tt,
  khoa,
  onBam,
}: {
  tt: TrangThaiChon
  khoa: boolean
  onBam: () => void
}) {
  const het = tt.muc === 'het'
  const nua = tt.muc === 'nua'
  return (
    <div className="pill-hang">
      <button
        type="button"
        className={'pill-chon' + (het ? ' pill-chon--het' : nua ? ' pill-chon--nua' : '')}
        aria-pressed={het ? true : nua ? 'mixed' : false}
        disabled={khoa || tt.muc === 'khong'}
        onClick={onBam}
        title={het ? dich('Bỏ chọn tất cả khối đang hiện') : dich('Chọn tất cả khối đang hiện')}
      >
        <span className="pill-chon__o" aria-hidden="true">
          {het && <Ic ten="dung" co={11} />}
          {nua && <Ic ten="gach" co={11} />}
        </span>
        {het
          ? dp('Bỏ chọn ({n})', { n: tt.tong })
          : nua
            ? dp('Chọn tất cả ({a}/{n})', { a: tt.daChon, n: tt.tong })
            : dp('Chọn tất cả ({n})', { n: tt.tong })}
      </button>
    </div>
  )
})

/** Nhãn chữ của từng cờ: [chữ trên chip, giải thích trong tooltip, loại màu]. */
const CO_NHAN: Record<CoKhoi, [string, string, 'canh' | 'thuong']> = {
  dai: ['Dài', 'Dài hơn 3 phút — nên xem lại, máy không tự chia nhỏ', 'canh'],
  'ranh-gioi-can-nghe': ['Ranh giới cần nghe', 'Câu hỏi bắt đầu giữa một câu — mốc lấy theo từ, chưa nghe kiểm', 'canh'],
  'khong-ro-dau-cau': ['Không rõ đầu câu hỏi', 'Không tìm ra chỗ câu hỏi bắt đầu — mốc đầu có thể lệch', 'canh'],
  'mo-dau': ['Mở đầu', 'Phần trước câu hỏi đầu tiên', 'thuong'],
  'sua-tay': ['Đã sửa tay', 'Khối này đã được gộp, tách hoặc đổi tên bằng tay', 'thuong'],
}

/** Câu (hoặc mẩu câu) thuộc một khối — khối có thể bắt đầu GIỮA câu Whisper. */
function cauCuaKhoi(nd: NoiDung, k: Khoi) {
  const ra: { id: number; giay: number; chu: string; bia: boolean; nghi: boolean; tachTu: number }[] = []
  if (k.cuoi <= k.dau || k.dau >= nd.tu.length) return ra
  const a = nd.tu[k.dau].cau
  const b = nd.tu[Math.min(k.cuoi, nd.tu.length) - 1].cau
  for (let i = a; i <= b; i++) {
    const c = nd.cau[i]
    if (!c) continue
    const tu0 = Math.max(c.tuDau, k.dau)
    const tu1 = Math.min(c.tuCuoi, k.cuoi)
    let chu = c.chu
    // Câu bị ranh giới khối cắt ngang: chỉ hiện phần thuộc khối này, có "…"
    // ở phía bị cắt để người dựng biết câu còn tiếp ở khối bên cạnh.
    if (tu0 > c.tuDau || tu1 < c.tuCuoi) {
      chu =
        (tu0 > c.tuDau ? '…' : '') +
        nd.tu
          .slice(tu0, tu1)
          .map((t) => t.chu)
          .join(' ') +
        (tu1 < c.tuCuoi ? '…' : '')
    }
    ra.push({
      id: c.id,
      giay: tu0 > c.tuDau && nd.tu[tu0] ? nd.tu[tu0].tu : c.tu,
      chu,
      bia: c.bia,
      nghi: c.tinCayThap,
      // Tách được khi câu bắt đầu BÊN TRONG khối (không phải câu mở khối).
      tachTu: c.tuDau > k.dau && c.tuDau < k.cuoi ? c.tuDau : -1,
    })
  }
  return ra
}

interface GoiLai {
  onChon: (dau: number) => void
  onMoRong: (dau: number) => void
  onNhay: (giay: number) => void
  onSua: (dau: number | null) => void
  onDoiTen: (dau: number, ten: string) => void
  onMenu: (dau: number, nut: HTMLElement) => void
  onTach: (tuIdx: number) => void
  onTro: (dau: number) => void
}

const KhoiThe = memo(function KhoiThe({
  k,
  nhan,
  nd,
  daDoiTen,
  chon,
  moRong,
  tro,
  dangSua,
  soKhop,
  q,
  khoa,
  cb,
}: {
  k: Khoi
  nhan: string
  nd: NoiDung
  daDoiTen: boolean
  chon: boolean
  moRong: boolean
  tro: boolean
  dangSua: boolean
  soKhop: number
  q: string
  khoa: boolean
  cb: GoiLai
}) {
  const ten = tenKhoi(k, daDoiTen)
  const boQuaBlur = useRef(false)
  const dsCau = moRong ? cauCuaKhoi(nd, k) : null
  const soCau =
    k.cuoi > k.dau && k.dau < nd.tu.length ? nd.tu[Math.min(k.cuoi, nd.tu.length) - 1].cau - nd.tu[k.dau].cau + 1 : 0

  const co = k.co.filter((c) => c !== 'mo-dau' || daDoiTen)

  let lop = 'khoi'
  if (chon) lop += ' khoi--chon'
  if (k.bo) lop += ' khoi--bo'
  if (tro) lop += ' khoi--tro'

  return (
    <article className={lop} data-khoi={k.dau} onClick={() => cb.onTro(k.dau)}>
      <div className="khoi__dau">
        <input
          type="checkbox"
          className="khoi__chon"
          checked={chon}
          disabled={k.bo || khoa}
          onChange={() => cb.onChon(k.dau)}
          aria-label={dp('Chọn khối {n}', { n: nhan || ten })}
          title={k.bo ? dich('Khối đã bỏ — lấy lại mới chọn được') : undefined}
        />
        <span className="khoi__so">{nhan || '—'}</span>
        <button type="button" className="khoi__moc" onClick={() => cb.onNhay(k.tu)} title={dich('Nhảy tới đầu khối')}>
          {mocHienThi(k.tu)} – {mocHienThi(k.den)}
        </button>
        <span className="khoi__dai" title={dich('Độ dài khối')}>
          {mocHienThi(Math.max(0, k.den - k.tu))}
        </span>
        <button
          type="button"
          className="nut-ic khoi__menu"
          data-nut-menu=""
          aria-label={dich('Thao tác khối')}
          aria-haspopup="menu"
          title={dich('Thao tác khối')}
          disabled={khoa}
          onClick={(e) => {
            e.stopPropagation()
            cb.onTro(k.dau)
            cb.onMenu(k.dau, e.currentTarget)
          }}
        >
          <Ic ten="them" />
        </button>
      </div>

      <div className="khoi__ten-hang">
        {dangSua ? (
          <input
            className="khoi__o-ten"
            defaultValue={ten}
            autoFocus
            maxLength={120}
            aria-label={dich('Tên khối')}
            onFocus={(e) => {
              // Lần sửa MỚI: xoá cờ còn sót từ lần trước (gỡ ô nhập khỏi DOM thì
              // có lúc không có blur nào tới để tự xoá cờ).
              boQuaBlur.current = false
              e.currentTarget.select()
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Ghi NGAY, đừng nhờ blur: đo 19/09 trên trình duyệt, ô nhập
                // không giữ được tiêu điểm (cửa sổ không có focus) thì `blur()`
                // không bắn sự kiện nào → Enter không lưu gì cả. Cờ chặn blur
                // bắn sau đó ghi lần hai.
                e.preventDefault()
                boQuaBlur.current = true
                cb.onDoiTen(k.dau, e.currentTarget.value)
              } else if (e.key === 'Escape') {
                // Gỡ ô nhập khỏi DOM thì có trình duyệt bắn blur, có cái không —
                // cờ này chặn blur ghi nhầm cái tên người dùng vừa định BỎ.
                boQuaBlur.current = true
                cb.onSua(null)
              }
            }}
            onBlur={(e) => {
              if (boQuaBlur.current) {
                boQuaBlur.current = false
                return
              }
              cb.onDoiTen(k.dau, e.currentTarget.value)
            }}
          />
        ) : (
          <>
            <button
              type="button"
              className="khoi__ten"
              title={ten + '\n' + dich('Bấm: nhảy tới đầu khối · Bấm đúp: đổi tên')}
              onClick={(e) => {
                // Bấm đúp = hai cú bấm + một dblclick. Cú thứ hai (detail 2) bỏ
                // qua để khỏi gọi Premiere nhảy hai lần liền.
                if (e.detail > 1) return
                cb.onNhay(k.tu)
              }}
              onDoubleClick={() => {
                if (!khoa) cb.onSua(k.dau)
              }}
            >
              {ten}
            </button>
            <button
              type="button"
              className="nut-ic nut-ic--nho khoi__but"
              aria-label={dich('Đổi tên khối')}
              title={dich('Đổi tên khối')}
              disabled={khoa}
              onClick={() => cb.onSua(k.dau)}
            >
              <Ic ten="but" co={13} />
            </button>
          </>
        )}
      </div>

      {k.traLoiDau && !k.bo && <p className="khoi__tra">{k.traLoiDau}</p>}

      <div className="khoi__chan">
        <button type="button" className="khoi__mo" aria-expanded={moRong} onClick={() => cb.onMoRong(k.dau)}>
          <Ic ten={moRong ? 'xuong' : 'phai'} co={14} />
          {dp('{n} câu', { n: soCau })}
        </button>
        {k.bo && (
          <span className="the-co the-co--bo" title={dich('Không đặt marker, không tạo sequence cho khối này')}>
            {dich('Đã bỏ')}
          </span>
        )}
        {soKhop > 0 && <span className="the-co the-co--khop">{dp('{n} câu khớp', { n: soKhop })}</span>}
        {co.map((c) => (
          <span key={c} className={'the-co the-co--' + CO_NHAN[c][2]} title={dich(CO_NHAN[c][1])}>
            {dich(CO_NHAN[c][0])}
          </span>
        ))}
      </div>

      {dsCau && (
        <ol className="ds-cau ds-cau--khoi">
          {dsCau.map((c) => (
            <HangCau
              key={c.id}
              id={c.id}
              giay={c.giay}
              moc={mocHienThi(c.giay)}
              chu={c.chu}
              bia={c.bia}
              nghi={c.nghi}
              q={q}
              tachTu={khoa ? -1 : c.tachTu}
              onNhay={cb.onNhay}
              onTach={cb.onTach}
            />
          ))}
        </ol>
      )}
    </article>
  )
})

export const DsKhoi = memo(function DsKhoi({
  khoi,
  nhan,
  nd,
  tieuDeTay,
  chon,
  moRong,
  tro,
  dangSua,
  soKhop,
  q,
  khoa,
  cb,
}: {
  /** Các khối ĐANG HIỆN (đã lọc theo ô tìm). */
  khoi: Khoi[]
  /** dau → "Q3" (đánh số trên TOÀN BỘ khối, lọc không làm đổi số). '' = khối Mở đầu. */
  nhan: Map<number, string>
  nd: NoiDung
  tieuDeTay: Record<number, string>
  chon: Set<number>
  moRong: Set<number>
  tro: number | null
  dangSua: number | null
  /** dau → số câu khớp ô tìm; null = không tìm. */
  soKhop: Map<number, number> | null
  q: string
  khoa: boolean
  cb: GoiLai
}) {
  if (!khoi.length) {
    return (
      <p className="trong">
        {q ? dich('Không có khối nào chứa chữ này.') : dich('Không nghe ra lời nào trong vùng này.')}
      </p>
    )
  }
  return (
    <div className="ds-khoi">
      {khoi.map((k) => {
        const mo = moRong.has(k.dau)
        return (
          <KhoiThe
            key={k.dau}
            k={k}
            nhan={nhan.get(k.dau) ?? ''}
            nd={nd}
            daDoiTen={Object.prototype.hasOwnProperty.call(tieuDeTay, k.dau)}
            chon={chon.has(k.dau)}
            moRong={mo}
            tro={tro === k.dau}
            dangSua={dangSua === k.dau}
            soKhop={soKhop ? soKhop.get(k.dau) ?? 0 : 0}
            // Chỉ thẻ đang MỞ mới cần chuỗi tìm (để tô trong danh sách câu) —
            // thẻ đóng nhận '' cố định, gõ tìm không làm nó vẽ lại.
            q={mo ? q : ''}
            khoa={khoa}
            cb={cb}
          />
        )
      })}
    </div>
  )
})
