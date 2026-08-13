/**
 * Toolbar.tsx — hai dải mỏng trên cùng.
 *  Dải 1: quay lại màn hình chọn · tên không gian làm việc · hành động chính.
 *  Dải 2: tìm kiếm (+ âm lượng, CHỈ hiện khi đang ở mục Âm thanh & Nhạc).
 *
 * Cố ý KHÔNG có: dãy chip loại asset (trùng menu trái), dãy chip sắp xếp,
 * nút Chụp/Dán/Export. Cụm chọn dạng hiển thị nằm ở góc phải dưới (Grid).
 */
import { useLibrary } from '../state/store'
import type { MasterTab } from '../state/store'
import { NutDoiNgonNgu, dich } from '../ngonngu'
import {
  IconFolderPlus,
  IconSearch,
  IconClose,
  IconFolder,
  IconZap,
  IconClock,
  IconCheck,
  IconAddFromTimeline,
  IconSettings,
  IconRefresh,
} from './Icons'

/**
 * ☠️ HẰNG TẦNG MODULE — KHÔNG bọc `dich()` ở đây (chạy lúc import, trước khi
 * React gắn bảng chữ → trả tiếng Việt vĩnh viễn). Hai nhãn dưới là TÊN THƯƠNG
 * HIỆU (`Asset Manager` · `Power Bins`), giữ nguyên ở cả hai thứ tiếng nên
 * cũng không có trong `chu.ts`.
 */
const WORKSPACE: Record<
  Exclude<MasterTab, 'home'>,
  { label: string; Icon: (p: { size?: number }) => JSX.Element }
> = {
  library: { label: 'Asset Manager', Icon: IconFolder },
  powerbin: { label: 'Power Bins', Icon: IconZap },
}

export default function Toolbar() {
  const scanning = useLibrary((s) => s.scanning)
  const scanCount = useLibrary((s) => s.scanCount)
  const addFolder = useLibrary((s) => s.addFolder)
  const activeMasterTab = useLibrary((s) => s.activeMasterTab)
  const queueProgress = useLibrary((s) => s.queueProgress)
  const stopPreviewRender = useLibrary((s) => s.stopPreviewRender)
  const search = useLibrary((s) => s.search)
  const setSearch = useLibrary((s) => s.setSearch)
  const brands = useLibrary((s) => s.brands)
  const selectedBrandId = useLibrary((s) => s.selectedBrandId)
  const selectedPowerBinFolderId = useLibrary((s) => s.selectedPowerBinFolderId)
  const addTimelineSelectionToPowerBin = useLibrary((s) => s.addTimelineSelectionToPowerBin)
  const setSettingsOpen = useLibrary((s) => s.setSettingsOpen)
  const assets = useLibrary((s) => s.assets)
  const regeneratePreviews = useLibrary((s) => s.regeneratePreviews)
  const showToast = useLibrary((s) => s.showToast)

  if (activeMasterTab === 'home') return null

  const { label, Icon } = WORKSPACE[activeMasterTab]
  const isLibrary = activeMasterTab === 'library'
  const isPowerBin = activeMasterTab === 'powerbin'

  // Ở Power Bins, tiêu đề cho biết đang mở brand nào — nếu không thì người dùng
  // không biết khay mình vừa tạo nằm ở đâu.
  /**
   * Asset còn thiếu preview — hiện ngay trên nút để biết còn bao nhiêu.
   * Đếm đúng 3 loại mà hàng đợi nền có việc để làm: video thiếu ảnh tĩnh,
   * audio thiếu sóng âm, mogrt chưa bung được preview nào.
   */
  const missingPreview = assets.reduce(
    (n, a) =>
      n +
      (!a.previewFailed &&
      ((a.type === 'video' && !a.thumbPath) ||
        (a.type === 'audio' && !a.waveformPath) ||
        (a.type === 'mogrt' && !a.previewPath && !a.thumbPath))
        ? 1
        : 0),
    0,
  )
  /**
   * Asset đã thử sinh preview mà không ra.
   *
   * [1.3.2] TÁCH LÀM HAI, vì gộp chung là nói sai. Đo thật 28/07 trên 1.027
   * asset bị đánh dấu:
   *    960 mogrt  — gói chỉ có `definition.json` + `project.aegraphic`,
   *                 KHÔNG kèm ảnh preview. File hoàn toàn tốt, Premiere dùng
   *                 bình thường. Gọi chúng là "FFmpeg không đọc được" là oan.
   *     67 khác   — hỏng thật (zip cụt, `moov atom not found`), hoặc là rác
   *                 macOS `._*` (từ 1.3.2 đã chặn ngay ở bộ quét).
   */
  const noPreviewMogrt = assets.reduce(
    (n, a) => n + (a.previewFailed && a.type === 'mogrt' ? 1 : 0),
    0,
  )
  const brokenFiles = assets.reduce(
    (n, a) => n + (a.previewFailed && a.type !== 'mogrt' ? 1 : 0),
    0,
  )
  const failedPreview = noPreviewMogrt + brokenFiles

  const brandName = brands.find((b) => b.id === selectedBrandId)?.name ?? ''
  const title = isPowerBin && brandName ? brandName : label

  return (
    <>
      <header className="topbar">
        {/* [2.0.0] Nút "quay lại màn hình chọn" đã bỏ: panel này chỉ có MỘT
            không gian làm việc nên không còn chỗ nào để quay về. */}
        <span className="topbar__title" title={isPowerBin && brandName ? `Brand: ${brandName}` : label}>
          <span className="topbar__title-icon">
            <Icon size={13} />
          </span>
          {title}
        </span>

        <div className="topbar__spacer" />

        {scanning && (
          <span className="topbar__scanning" aria-live="polite">
            {dich('Đang quét')} {scanCount.toLocaleString()} {dich('file…')}
          </span>
        )}

        {/* Nút đổi ngôn ngữ VI/EN. Đặt cạnh nút Cài đặt vì nó cũng tác động lên
            CẢ panel, không thuộc riêng mục nào. Đổi ở đây thì mọi panel AiO đổi
            theo — lựa chọn lưu ở `%APPDATA%\AiOStudio\ngonngu.json`. */}
        <NutDoiNgonNgu />

        {/* [0.17.1] Chip tiến độ riêng ĐÃ BỎ: nó và cái nút bên cạnh cùng nói
            về một việc, đặt cạnh nhau thành hai nguồn tin phải đối chiếu. Tiến
            độ giờ nằm NGAY TRÊN nút — một việc, một chỗ. */}

        <button
          className="icon-btn"
          title={dich('Cài đặt (chất lượng proxy, xoá cache)')}
          aria-label={dich('Mở cài đặt')}
          onClick={() => setSettingsOpen(true)}
        >
          <IconSettings size={14} />
        </button>

        {/* Cố ý KHÔNG có nút "quét lại tất cả" ở đây: bấm nhầm là quét lại cả
            thư viện (hàng chục nghìn file). Mỗi mục trong menu trái đã có nút
            quét lại riêng — phạm vi hẹp, hậu quả nhẹ. */}
        {isLibrary && (
          <>
            {/* Nhãn nút phải là VIỆC NÓ LÀM, không phải tên của thứ nó tạo ra:
                "Ảnh xem trước" đọc như một mục xem, "Render preview" mới nói
                đúng hành động. Việc phụ nên KHÔNG dùng kiểu primary — mỗi màn
                hình chỉ một nút chính (ở đây là "Thêm thư mục").

                [0.17.1] Nút này có BA trạng thái nhìn là biết, vì trước đây
                render xong rồi mà con số vẫn y nguyên nên không ai biết đã
                xong hay chưa:
                  đang chạy  -> "Đang render 587/1999"  (mờ, không bấm được)
                  còn thiếu  -> "Render preview (1.856)"
                  xong hết   -> "Preview đã đủ" + dấu tích */}
            <button
              /**
               * [1.3.1] Nút này vừa là NÚT BẤM vừa là ĐÈN BÁO.
               *
               * Chủ dự án yêu cầu 28/07: "chưa render hết thì màu đỏ, render
               * xong là xanh". Nhìn lướt thanh công cụ là biết tình trạng thư
               * viện, khỏi phải đọc con số.
               *
               * Đang render cũng tính là ĐỎ — vì lúc đó thư viện vẫn chưa đủ
               * preview. Phân biệt với trạng thái "còn thiếu, chưa chạy" bằng
               * icon (đồng hồ / mũi tên xoay) và bằng chữ trên nhãn.
               */
              className={`btn btn--sm ${
                queueProgress || missingPreview > 0
                  ? 'btn--state-pending'
                  : 'btn--state-done'
              }`}
              /**
               * [1.3.1] Nói rõ PHẠM VI là toàn thư viện.
               *
               * Ca thật: bấm quét lại riêng một thư mục (menu trái hiện 64),
               * xong nút này nhảy lên "Dừng render (0/258)" — người dùng đọc
               * thành "thư mục 64 file mà nó render 258", tưởng panel bịa việc
               * ra làm cho tốn máy. Chủ dự án nói thẳng: *"nếu mình không rõ
               * ràng, editor sẽ hiểu là render gian dối, ngốn tài nguyên"*.
               *
               * Số 258 là việc còn lại của CẢ THƯ VIỆN, nên phải nói ra kèm
               * tổng số asset để nó tự giải thích.
               */
              title={
                queueProgress
                  ? dich(
                      'Đang render {xong}/{tong} asset còn thiếu preview — tính trên TOÀN thư viện {thuvien} asset, không riêng thư mục đang chọn.\nMáy chạy hết sức nên Premiere có thể hơi ì. Bấm để DỪNG; phần đã render vẫn giữ nguyên.',
                    )
                      .replace('{xong}', queueProgress.done.toLocaleString())
                      .replace('{tong}', queueProgress.total.toLocaleString())
                      .replace('{thuvien}', assets.length.toLocaleString())
                  : missingPreview > 0
                    ? dich(
                        'Render preview cho {n} asset còn thiếu ảnh/sóng âm — tính trên TOÀN thư viện {thuvien} asset, không riêng thư mục đang chọn.\nMáy sẽ bận trong lúc chạy — bấm lần nữa để dừng bất cứ lúc nào.',
                      )
                        .replace('{n}', missingPreview.toLocaleString())
                        .replace('{thuvien}', assets.length.toLocaleString())
                    : failedPreview > 0
                      ? [
                          dich('Cả {n} asset trong thư viện đã render xong.').replace(
                            '{n}',
                            assets.length.toLocaleString(),
                          ),
                          noPreviewMogrt > 0
                            ? dich(
                                '{n} file Mogrt không có ảnh xem trước kèm trong gói — file vẫn tốt, Premiere dùng bình thường, chỉ là không có gì để hiện.',
                              ).replace('{n}', noPreviewMogrt.toLocaleString())
                            : '',
                          brokenFiles > 0
                            ? dich('{n} file đọc không ra (hỏng hoặc sai định dạng).').replace(
                                '{n}',
                                brokenFiles.toLocaleString(),
                              )
                            : '',
                          dich('Bấm để thử lại những file đó.'),
                        ]
                          .filter(Boolean)
                          .join('\n')
                      : dich(
                          'Cả {n} asset trong thư viện đều đã có preview. Bấm để kiểm tra lại.',
                        ).replace('{n}', assets.length.toLocaleString())
              }
              /**
               * [1.2.0-dev.3] Đang chạy thì nút KHÔNG khoá nữa mà đổi thành
               * "Dừng render". Có đường vào thì phải có đường ra — nhất là từ
               * khi nút này chạy turbo và giành CPU ngang Premiere: khoá nút
               * lúc đó đồng nghĩa bắt người dùng ngồi chịu trận tới hết hàng
               * đợi, hoặc phải tắt Premiere để thoát.
               */
              disabled={scanning}
              onClick={() => {
                if (queueProgress) {
                  stopPreviewRender()
                  showToast(dich('Đã dừng render. Phần đã xong vẫn giữ nguyên.'))
                  return
                }
                regeneratePreviews()
                showToast(
                  missingPreview > 0 || failedPreview > 0
                    ? dich('Đang render hết sức — máy sẽ bận. Bấm lại để dừng.')
                    : dich('Đã kiểm tra: mọi asset đều có preview.'),
                )
              }}
            >
              {queueProgress ? (
                <IconClock size={13} />
              ) : missingPreview > 0 ? (
                <IconRefresh size={13} />
              ) : (
                <IconCheck size={13} />
              )}
              <span>
                {queueProgress
                  ? dich('Dừng render ({xong}/{tong})')
                      .replace('{xong}', queueProgress.done.toLocaleString())
                      .replace('{tong}', queueProgress.total.toLocaleString())
                  : missingPreview > 0
                    ? `Render preview (${missingPreview.toLocaleString()})`
                    : dich('Preview đã đủ')}
              </span>
            </button>

            <button
              className="btn btn--primary btn--sm"
              title={dich('Chọn thư mục trên máy để thêm vào thư viện')}
              onClick={addFolder}
              disabled={scanning}
            >
              <IconFolderPlus size={13} />
              <span>{dich('Thêm thư mục')}</span>
            </button>
          </>
        )}

        {isPowerBin && (
          <button
            className="btn btn--primary btn--sm"
            title={
              selectedPowerBinFolderId
                ? dich('Chọn clip trên timeline rồi bấm đây để thêm file gốc của chúng vào khay')
                : dich('Chọn một khay ở menu bên trái trước đã')
            }
            disabled={!selectedPowerBinFolderId}
            onClick={() => addTimelineSelectionToPowerBin(selectedPowerBinFolderId)}
          >
            <IconAddFromTimeline size={13} />
            <span>{dich('Thêm từ timeline')}</span>
          </button>
        )}
      </header>

      <div className="contextbar">
        <div className="searchbox">
          <span className="searchbox__icon">
            <IconSearch size={13} />
          </span>
          <input
            className="searchbox__input"
            placeholder={dich('Tìm asset theo tên…')}
            aria-label={dich('Tìm asset theo tên')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="searchbox__clear"
              title={dich('Xoá từ khoá')}
              aria-label={dich('Xoá từ khoá tìm kiếm')}
              onClick={() => setSearch('')}
            >
              <IconClose size={11} />
            </button>
          )}
        </div>

      </div>
    </>
  )
}
