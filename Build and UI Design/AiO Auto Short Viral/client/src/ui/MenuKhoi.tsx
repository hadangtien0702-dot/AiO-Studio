/**
 * Menu "⋯" của một khối — vẽ ở TẦNG NGOÀI CÙNG của app, `position: fixed`.
 *
 * ☠️ Vì sao không đặt trong thẻ khối: thẻ có `content-visibility: auto` ⇒ paint
 * containment ⇒ thẻ thành khối chứa của cả phần tử `fixed` con và CẮT mọi thứ
 * tràn khỏi mép thẻ. Menu đặt trong thẻ sẽ bị xén mất nửa dưới.
 *
 * Đóng khi: bấm ra ngoài · cuộn (toạ độ fixed không chạy theo nội dung) · đổi
 * cỡ panel · Escape. Mở ra thì tiêu điểm vào mục đầu để dùng được bằng phím.
 */
import { useEffect, useRef } from 'react'
import type { KeyboardEvent as PhimReact } from 'react'
import { dich } from '../ngonngu'

export interface ViTriMenu {
  /** Khoảng cách từ mép PHẢI cửa sổ. */
  phai: number
  /** Mở xuống: toạ độ đỉnh. Mở lên: khoảng cách từ mép DƯỚI cửa sổ. */
  tren?: number
  duoi?: number
}

export function MenuKhoi({
  viTri,
  coTren,
  bo,
  onNhay,
  onDoiTen,
  onGop,
  onBo,
  onDong,
}: {
  viTri: ViTriMenu
  /** Có khối phía trên để gộp vào không. */
  coTren: boolean
  bo: boolean
  onNhay: () => void
  onDoiTen: () => void
  onGop: () => void
  onBo: () => void
  onDong: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ngoai = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !ref.current) return
      if (ref.current.contains(t)) return
      // Bấm lại đúng nút "⋯" thì để App tự bật/tắt — đóng ở đây rồi cú click
      // mở lại ngay là thành "không tắt được".
      if (t.closest && t.closest('[data-nut-menu]')) return
      onDong()
    }
    const dong = () => onDong()
    document.addEventListener('mousedown', ngoai, true)
    window.addEventListener('scroll', dong, true)
    window.addEventListener('resize', dong)
    const dau = ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    dau?.focus()
    return () => {
      document.removeEventListener('mousedown', ngoai, true)
      window.removeEventListener('scroll', dong, true)
      window.removeEventListener('resize', dong)
    }
  }, [onDong])

  const diChuyen = (e: PhimReact<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const ds = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
    if (!ds.length) return
    const i = ds.indexOf(document.activeElement as HTMLButtonElement)
    const j = e.key === 'ArrowDown' ? (i + 1) % ds.length : (i - 1 + ds.length) % ds.length
    ds[j].focus()
  }

  return (
    <div
      ref={ref}
      className="menu menu--noi"
      role="menu"
      aria-label={dich('Thao tác khối')}
      style={{ right: viTri.phai, top: viTri.tren, bottom: viTri.duoi }}
      onKeyDown={diChuyen}
    >
      <button type="button" role="menuitem" className="menu__muc" onClick={onNhay}>
        {dich('Nhảy tới đầu khối')}
      </button>
      <button type="button" role="menuitem" className="menu__muc" onClick={onDoiTen}>
        {dich('Đổi tên khối')}
      </button>
      <button
        type="button"
        role="menuitem"
        className="menu__muc"
        disabled={!coTren}
        onClick={onGop}
        title={coTren ? undefined : dich('Đây là khối đầu tiên')}
      >
        {dich('Gộp với khối trên')}
        <kbd>M</kbd>
      </button>
      <div className="menu__vach" role="separator" />
      <button type="button" role="menuitem" className="menu__muc" onClick={onBo}>
        {bo ? dich('Lấy lại khối') : dich('Bỏ khối')}
      </button>
    </div>
  )
}
