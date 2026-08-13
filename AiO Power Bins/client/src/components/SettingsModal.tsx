/**
 * SettingsModal.tsx — hộp Cài đặt.
 *
 * Chỉ chứa thứ người dùng THỰC SỰ quyết định. Số đo hiệu năng (số trình phát
 * đang mở, thời gian rê chuột → thấy hình) là công cụ của người viết phần mềm,
 * không phải của người dựng phim — đã bỏ khỏi đây.
 */
import { useEffect, useState } from 'react'
import { dich } from '../ngonngu'
import { useLibrary } from '../state/store'
import { analyzeCache, type CacheBreakdown } from '../services/cacheService'
import { getCacheRoot } from '../services/cachePaths'
import { findMacJunk, moveToRecycleBin, type MacJunkResult } from '../services/macJunk'
import { IconSettings, IconClose, IconTrash, IconFolder } from './Icons'

/** Đổi byte sang câu chữ ngắn. Rác macOS thường chỉ vài KB mỗi file. */
function doDung(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const EMPTY_CACHE: CacheBreakdown = {
  totalBytes: 0,
  fileCount: 0,
  formattedSize: '…',
  orphanBytes: 0,
  orphanCount: 0,
  formattedOrphan: '0 MB',
  usedThumbs: 0,
  usedWaveforms: 0,
  usedProxies: 0,
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  // [1.2.0-dev.4] Không còn đọc `settings`/`updateSettings`: hộp Cài đặt giờ
  // thuần về bộ nhớ đệm, không còn tuỳ chọn nào để chỉnh. `updateSettings` vẫn
  // nằm trong store cho lần sau cần tới.
  const assets = useLibrary((s) => s.assets)
  const queueProgress = useLibrary((s) => s.queueProgress)
  const clearCacheAndReset = useLibrary((s) => s.clearCacheAndReset)
  const cleanOrphanCache = useLibrary((s) => s.cleanOrphanCache)
  const showToast = useLibrary((s) => s.showToast)

  const changeCacheLocation = useLibrary((s) => s.changeCacheLocation)

  const folders = useLibrary((s) => s.folders)

  const [cache, setCache] = useState<CacheBreakdown>(EMPTY_CACHE)
  const [cacheRoot, setCacheRootShown] = useState('')
  /** Nút xoá tất cả phải bấm hai lần — lần một chỉ đổi thành câu xác nhận. */
  const [confirmWipe, setConfirmWipe] = useState(false)

  /**
   * [1.3.2] Rác macOS nằm trên Ổ ĐĨA của người dùng (không phải trong cache).
   * `null` = chưa quét xong. Quét ngầm lúc mở hộp, không chặn giao diện.
   */
  const [junk, setJunk] = useState<MacJunkResult | null>(null)
  /** Nút này đụng FILE GỐC nên cũng phải bấm hai lần như "Xoá tất cả". */
  const [confirmJunk, setConfirmJunk] = useState(false)
  const [junkBusy, setJunkBusy] = useState(false)

  useEffect(() => {
    setCache(analyzeCache(useLibrary.getState().assets))
    setCacheRootShown(getCacheRoot())
  }, [])

  useEffect(() => {
    let huy = false
    void findMacJunk(useLibrary.getState().folders).then((r) => {
      if (!huy) setJunk(r)
    })
    return () => {
      huy = true
    }
  }, [folders])

  // Đóng bằng Esc — hộp này không còn nút "Đóng" ở chân nên phím tắt phải có.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const running = !!queueProgress
  /** Số asset đang dựa vào bộ nhớ đệm — mất là phải render lại đúng bấy nhiêu. */
  const usedTotal = cache.usedThumbs + cache.usedWaveforms + cache.usedProxies
  const hasUsed = usedTotal > 0

  /**
   * Những thứ phải tạo lại nếu xoá sạch, nối bằng dấu phẩy.
   *
   * Bản cũ nối bằng "và" giữa từng khoản nên ra câu vấp: "775 ảnh xem trước và
   * 12.928 sóng âm và 40 bản xem nhanh". Đọc phải dừng ba lần mới nắm được con
   * số — mà đây đúng là câu người dùng cần đọc nhanh trước khi bấm nút phá huỷ.
   */
  const wipeList = [
    cache.usedThumbs > 0 &&
      dich('{n} ảnh xem trước').replace('{n}', cache.usedThumbs.toLocaleString()),
    cache.usedWaveforms > 0 &&
      dich('{n} sóng âm').replace('{n}', cache.usedWaveforms.toLocaleString()),
    cache.usedProxies > 0 &&
      dich('{n} bản xem nhanh').replace('{n}', cache.usedProxies.toLocaleString()),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        role="dialog"
        aria-label={dich('Cài đặt')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">
            <IconSettings size={14} /> {dich('Cài đặt')}
          </span>
          <button
            className="icon-btn"
            onClick={onClose}
            title={dich('Đóng (Esc)')}
            aria-label={dich('Đóng cài đặt')}
          >
            <IconClose size={13} />
          </button>
        </div>

        <div className="modal-body">
          {/**
           * [1.2.0-dev.4] ĐÃ GỠ ô chọn "Chất lượng bản xem nhanh" (360p/480p).
           *
           * Hai lý do, lý do thứ hai mới là lý do nặng:
           *  1. Chủ dự án chốt 28/07: 360p là đủ, không cần cho chọn.
           *  2. Ô đó CHƯA BAO GIỜ CÓ TÁC DỤNG. `proxyQuality` chỉ tồn tại ở
           *     types.ts, giá trị mặc định trong store, và chính ô này — bộ
           *     sinh bản xem nhanh (`proxy.ts`) ghi cứng `scale=-2:360` và
           *     không hề đọc cài đặt. Chọn 480p vẫn ra 360p.
           *
           * Một ô cài đặt không đổi được gì là tệ hơn không có ô nào: người
           * dùng đổi, thấy y hệt, rồi ngờ cả những cài đặt khác.
           *
           * Trường `proxyQuality` GIỮ NGUYÊN trong `types.ts` và store (giống
           * cách `packs` được giữ khi gỡ Gói Packs) — file cài đặt đã lưu trên
           * máy người dùng vẫn đọc được, không cần bước chuyển đổi dữ liệu.
           */}

          {/* Cố ý KHÔNG lặp lại nút render preview ở đây: nút "Render preview (N)"
              đã nằm sẵn trên thanh công cụ, luôn nhìn thấy và có kèm số asset
              còn thiếu. Cùng một việc mà đặt ở hai nơi thì người dùng phải đoán
              xem hai nút có khác nhau không. */}

          {/* ── Nơi lưu bộ nhớ đệm ────────────────────────────── */}
          <div className="setting-row">
            <div className="setting-row__info">
              {/* "Nơi lưu bộ nhớ đệm" đứng ngay trên hàng "Bộ nhớ đệm" thành ra
                  đọc hai nhãn na ná nhau. Ở trong hộp Cài đặt thì "Nơi lưu" đã
                  đủ rõ nó là nơi lưu cái gì. */}
              <span className="setting-row__label">{dich('Nơi lưu')}</span>
              {/* Đường dẫn dài nên cho xuống dòng thay vì cắt cụt — người dùng
                  cần đọc được nó đang nằm ở ổ nào. */}
              <span className="setting-row__desc setting-row__desc--path" title={cacheRoot}>
                {cacheRoot || dich('(chưa xác định)')}
              </span>
            </div>
            <button
              className="btn btn--sm"
              disabled={running}
              title={dich(
                'Chuyển ảnh xem trước sang ổ khác — panel sẽ chuyển file và sửa đường dẫn giúp anh',
              )}
              onClick={() => {
                changeCacheLocation()
                setCache(analyzeCache(useLibrary.getState().assets))
                setCacheRootShown(getCacheRoot())
              }}
            >
              <IconFolder size={12} />
              <span>{dich('Đổi chỗ…')}</span>
            </button>
          </div>

          {/* ── Bộ nhớ đệm ────────────────────────────────────── */}
          <div className="setting-row">
            <div className="setting-row__info">
              <span className="setting-row__label">{dich('Bộ nhớ đệm')}</span>
              {/* CHỈ nói phần đang dùng. Chuyện rác để hàng "Dọn rác" ngay dưới
                  nói — bản cũ nói ở cả hai chỗ nên mắt phải đọc hai lần cùng
                  một thông tin ("không có rác" / "không có file thừa nào"). */}
              <span className="setting-row__desc">
                {dich('Đang dùng cho {n} asset').replace('{n}', usedTotal.toLocaleString())}
              </span>
            </div>
            <div className="setting-row__value">{cache.formattedSize}</div>
          </div>

          {/* VIỆC NÊN LÀM: dọn rác. Không thẻ nào mất ảnh, không render lại gì. */}
          <div className="setting-row">
            <div className="setting-row__info">
              <span className="setting-row__label">{dich('Dọn rác')}</span>
              <span className="setting-row__desc">
                {cache.orphanCount > 0
                  ? dich('{n} file thừa ({dung}) — dọn đi không mất gì')
                      .replace('{n}', cache.orphanCount.toLocaleString())
                      .replace('{dung}', cache.formattedOrphan)
                  : dich('Không có file thừa')}
              </span>
            </div>
            <button
              className="btn btn--sm"
              disabled={cache.orphanCount === 0}
              title={dich('Chỉ xoá file cache không asset nào còn dùng')}
              onClick={() => {
                const res = cleanOrphanCache()
                setCache(analyzeCache(assets))
                showToast(
                  res.count > 0
                    ? dich('Đã dọn {n} file thừa').replace('{n}', res.count.toLocaleString())
                    : dich('Không có file thừa nào'),
                )
              }}
            >
              <IconTrash size={12} />
              <span>{dich('Dọn rác')}</span>
            </button>
          </div>

          {/**
            * [1.3.2] RÁC macOS NẰM TRÊN Ổ CỦA NGƯỜI DÙNG — khác hẳn hàng trên.
            *
            * Hàng "Dọn rác" ở trên chỉ đụng file cache do panel tự tạo, xoá đi
            * render lại được. Hàng này đụng FILE THẬT trên ổ của người dùng —
            * đây là chỗ DUY NHẤT trong panel làm việc đó, nên:
            *   - Chuyển vào THÙNG RÁC Windows, không xoá thẳng (chủ dự án chọn
            *     ngày 28/07 để lỡ tay còn khôi phục được).
            *   - Bấm HAI LẦN như nút "Xoá tất cả".
            *   - Nói rõ đây là gì, vì "rác macOS" không phải ai cũng biết.
            *
            * Không có rác thì ẩn hẳn hàng này đi — đa số lúc sẽ không có, bày ra
            * một dòng "không có gì" chỉ làm hộp Cài đặt dài thêm.
            */}
          {junk !== null && junk.paths.length > 0 && (
            <div className="setting-row">
              <div className="setting-row__info">
                <span className="setting-row__label">{dich('Rác macOS trên ổ')}</span>
                <span className="setting-row__desc">
                  {dich(
                    '{n} file thừa ({dung}) do giải nén file zip của máy Mac — không phải nhạc/video, Premiere cũng không mở được',
                  )
                    .replace('{n}', junk.paths.length.toLocaleString())
                    .replace('{dung}', doDung(junk.bytes))}
                </span>
              </div>
              <button
                className={`btn btn--sm ${confirmJunk ? 'btn--danger' : ''}`}
                disabled={junkBusy}
                title={
                  confirmJunk
                    ? dich('Bấm lần nữa để chuyển vào Thùng rác Windows')
                    : dich(
                        'Chuyển {n} file rác vào Thùng rác Windows — khôi phục lại được nếu cần',
                      ).replace('{n}', junk.paths.length.toLocaleString())
                }
                onClick={() => {
                  if (!confirmJunk) {
                    setConfirmJunk(true)
                    // Tự huỷ sau 6 giây, giống nút "Xoá tất cả": người dùng bỏ
                    // đi rồi quay lại bấm nhầm thì nút phải về trạng thái an toàn.
                    window.setTimeout(() => setConfirmJunk(false), 6000)
                    return
                  }
                  setConfirmJunk(false)
                  setJunkBusy(true)
                  void moveToRecycleBin(junk.paths).then((res) => {
                    setJunkBusy(false)
                    showToast(
                      res.failed > 0
                        ? dich(
                            'Đã chuyển {n} file vào Thùng rác — {loi} file không chuyển được (đang mở?)',
                          )
                            .replace('{n}', res.moved.toLocaleString())
                            .replace('{loi}', res.failed.toLocaleString())
                        : dich('Đã chuyển {n} file rác vào Thùng rác').replace(
                            '{n}',
                            res.moved.toLocaleString(),
                          ),
                    )
                    void findMacJunk(useLibrary.getState().folders).then(setJunk)
                  })
                }}
              >
                <IconTrash size={12} />
                <span>
                  {junkBusy
                    ? dich('Đang dọn…')
                    : confirmJunk
                      ? dich('Bấm lần nữa để dọn')
                      : dich('Dọn {n} file').replace('{n}', junk.paths.length.toLocaleString())}
                </span>
              </button>
            </div>
          )}

          {/* VIỆC PHÁ HUỶ: đặt cuối cùng, nói RÕ hậu quả bằng con số thật, và
              bắt bấm hai lần. Bản trước gộp chung vào một nút "Xoá bộ nhớ đệm"
              nghe như dọn dẹp vô hại — bấm xong là cả lưới mất ảnh hàng giờ. */}
          <p className="setting-note">
            {hasUsed ? (
              <>
                {dich('Xoá tất cả thì phải tạo lại')} <b>{wipeList}</b>{' '}
                {dich(
                  '— trong lúc đó các thẻ chỉ hiện icon. Thư viện, brand, khay và yêu thích giữ nguyên.',
                )}
              </>
            ) : (
              <>
                {dich(
                  'Chưa có ảnh xem trước nào để xoá. Thư viện, brand, khay và yêu thích không nằm trong bộ nhớ đệm.',
                )}
              </>
            )}
          </p>

          <button
            className={`btn btn--sm ${confirmWipe ? 'btn--danger' : ''}`}
            disabled={running || cache.totalBytes === 0}
            title={
              confirmWipe
                ? dich('Bấm lần nữa để xoá thật')
                : dich('Xoá toàn bộ ảnh xem trước đã tạo (phải tạo lại từ đầu)')
            }
            onClick={() => {
              if (!confirmWipe) {
                setConfirmWipe(true)
                // Tự huỷ sau 6 giây: người dùng bỏ đi rồi quay lại bấm nhầm thì
                // nút phải trở về trạng thái an toàn.
                window.setTimeout(() => setConfirmWipe(false), 6000)
                return
              }
              setConfirmWipe(false)
              clearCacheAndReset()
              setCache(analyzeCache(useLibrary.getState().assets))
              showToast(dich('Đã xoá bộ nhớ đệm — đang tạo lại từ đầu…'))
            }}
          >
            <IconTrash size={12} />
            <span>{confirmWipe ? dich('Bấm lần nữa để xoá thật') : dich('Xoá tất cả')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
