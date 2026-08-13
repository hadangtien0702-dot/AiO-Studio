/**
 * chu.ts — BANG DICH TIENG ANH cho AiO Asset Manager.
 *
 * Khoa = CHINH CAU TIENG VIET trong ma nguon. Khong co trong bang thi tra lai
 * nguyen van cau do -> quen dich mot cau chi lam no hien tieng Viet, khong lam
 * vo giao dien. Xem giai thich day du o `ngonngu.tsx`.
 *
 * Sinh tu do that ngay 13/08/2026 — con so lay bang script, khong uoc luong:
 *
 *   168  chuoi bo quet ra (xoa comment truoc, roi lay string literal + JSX text)
 *   -49  co `${...}` ben trong  -> khong lam khoa duoc, xu ly tay (xem muc 3)
 *   ----
 *   119
 *   -15  khong vao bang nguyen van:  9 khong phai giao dien (muc 4)
 *                                    6 la JSX nhieu dong -> gom khoang trang lai
 *   ----
 *   104  vao thang bang
 *   +17  THEM TAY:  6 ban gom khoang trang cua 6 dong tren
 *                   7 manh bi cat boi mot bieu thuc `{...}` giua cau
 *                   2 chuoi ASCII (`Xem to`, `Khay chung`) — luoi dau bo sot
 *                   2 chuoi bi regex template nuot (`AssetCard.tsx:392`)
 *   ====
 *   121  khoa
 *
 * Da kiem: 121 khoa, 0 khoa trung, 0 loi `tsc --noEmit`. 115/121 khoa khop
 * NGUYEN VAN mot chuoi that trong ma nguon; 6 khoa con lai (`Đang quét`,
 * `file…`, `Đang quét thêm…`, `Đang xem`, `trong`, `— cuộn tiếp để xem thêm`)
 * CHUA khop duoc vi cau goc con dinh lien mot `{...}` — chung chi song khi
 * buoc boc tach dung cau do ra. Boc khac di la 6 khoa nay thanh rac.
 *
 * ☠️ VI SAO PHAI XOA COMMENT TRUOC KHI QUET: ma nguon panel nay ghi chu rat
 * day bang tieng Viet (co file 60% dong la ghi chu). Grep tho ra gap ~8 lan so
 * that. Bo quet dung mot mini-lexer bam trang thai code / chuoi / comment.
 *
 * ☠️ VA LOC THEO DAU TIENG VIET THI BO SOT: `Xem to`, `Khay chung` la chuoi
 * hien thi tieng Viet KHONG CO DAU nen luoi dau khong bat duoc. Phai quet them
 * mot luot cac chuoi thuan ASCII (JSX text + title/aria-label/placeholder) roi
 * doc bang mat. Do that: bat duoc 2 chuoi, deu la nhan nguoi dung nhin thay.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ LUAT DICH: BAM THEO TU VUNG TIENG ANH CUA CHINH PREMIERE
 * ══════════════════════════════════════════════════════════════════════════
 * Anh Tien 13/08/2026: *"anh khong gioi tieng anh dau em"*.
 *
 * Nghia la KHONG CO AI DUYET LAI phan tieng Anh. Nen khong duoc lay cam nhan
 * cua minh lam chuan — phai lay mot THUOC DO TU NGOAI. Thuoc do o day la
 * **giao dien tieng Anh cua Premiere Pro**: editor nuoc ngoai mo Premiere moi
 * ngay, ho da doc quen dung nhung chu do.
 *
 *   khay (Power Bin)  -> bin                 (KHONG "tray" — Premiere goi la bin)
 *   khay chung        -> ungrouped bins      (khay khong thuoc brand nao)
 *   anh xem truoc     -> thumbnail           (KHONG "preview image")
 *   ban xem nhanh     -> proxy               (Premiere goi la Proxy)
 *   song am           -> waveform
 *   bo nho dem        -> cache
 *   nghe thu/xem thu  -> preview
 *   cao do            -> pitch
 *   nua cung          -> semitone
 *   chen vao timeline -> insert into the timeline
 *   thu muc           -> folder              (KHONG "directory")
 *   thu vien          -> library
 *   yeu thich         -> favorites
 *   Thung rac Windows -> Windows Recycle Bin
 *   asset / clip / timeline / playhead / project / brand / proxy / mogrt
 *                     -> giu nguyen, la tu nghe
 *
 * Gap tu chua co trong bang tren: tra trong giao dien Premiere truoc, dung
 * tu dat. Neu Premiere khong co khai niem do thi moi dat, va ghi them mot
 * dong vao bang tren de lan sau khong dich kieu khac.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ NHUNG THU KHONG NAM TRONG BANG NAY — CO Y
 * ══════════════════════════════════════════════════════════════════════════
 * 1. TEN THUONG HIEU: `Asset Manager` · `Power Bins` · `Brand Kit` · `Import`.
 *    Giu nguyen o ca hai thu tieng (giong `Giu nhip`/`Vua`/`Cat sach` ben
 *    Autocut). Khong co trong bang = tra lai nguyen van. DUNG "dich cho du".
 * 2. TU GIONG NHAU O HAI THU TIENG: `Video` · `Mogrt` · `Preset` · `File`.
 *    Cho vao bang chi lam bang dai them ma khong doi gi tren man hinh.
 * 3. CHUOI CO `${...}` BEN TRONG (49 chuoi): da noi san nen khong khop khoa
 *    duoc. Phai tach o cho goi roi moi boc — xem bao cao, KHONG tu them vao
 *    day mot khoa co `${...}`, no se khong bao gio khop.
 * 4. CHUOI KHONG PHAI GIAO DIEN (9 chuoi):
 *      1  `console.error('Luu thu vien that bai:')` — chi ra devtools
 *      5  ten nhan mau trong `store.ts` (`tags`: Do/Vang/Xanh la/Xanh duong/
 *         Tim). Da grep: KHONG component nao doc `s.tags` -> khong ve ra man
 *         hinh bao gio. Ngay nao co man hinh nhan mau thi them vao day.
 *      3  trong `dev/mockData.ts` — chi chay khi mo panel bang trinh duyet,
 *         khong lot vao ban build production.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ HAI CHO DE VO KHI BOC (ghi truoc cho phien sau)
 * ══════════════════════════════════════════════════════════════════════════
 * - `SIZES` (Grid.tsx) · `TYPE_ITEMS` (Sidebar.tsx) · `TYPE_NAME`
 *   (AssetCard.tsx) · `WORKSPACE` (Toolbar.tsx) la HANG TANG MODULE. Boc
 *   `dich()` ngay trong may mang do la chay luc IMPORT — truoc khi React gan
 *   bang chu — nen tra tieng Viet VINH VIEN. Phai boc o CHO VE RA.
 * - `Sidebar.tsx` co `label.toLowerCase()` trong tooltip thu muc con. Sau khi
 *   dich, `label` la tieng Anh nen `.toLowerCase()` van chay dung, nhung dong
 *   do la template co `${...}` — nam trong nhom (3) o tren.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    // ─── Toolbar.tsx — thanh tren ───
    'Đang quét': 'Scanning',
    'file…': 'files…',
    'Mở cài đặt': 'Open settings',
    'Thêm thư mục': 'Add folder',
    'Xoá từ khoá': 'Clear search',
    'Preview đã đủ': 'Previews complete',
    'Thêm từ timeline': 'Add from timeline',
    'Tìm asset theo tên': 'Search assets by name',
    'Tìm asset theo tên…': 'Search assets by name…',
    'Xoá từ khoá tìm kiếm': 'Clear the search box',
    'Bấm để thử lại những file đó.': 'Press to retry those files.',
    'Chọn một khay ở menu bên trái trước đã': 'Pick a bin in the left menu first',
    'Cài đặt (chất lượng proxy, xoá cache)': 'Settings (proxy quality, clear cache)',
    'Đã kiểm tra: mọi asset đều có preview.': 'Checked: every asset already has a preview.',
    'Chọn thư mục trên máy để thêm vào thư viện':
      'Pick a folder on your machine to add to the library',
    'Đã dừng render. Phần đã xong vẫn giữ nguyên.':
      'Render stopped. Everything already finished is kept.',
    'Đang render hết sức — máy sẽ bận. Bấm lại để dừng.':
      'Rendering at full speed — the machine will be busy. Press again to stop.',
    'Chọn clip trên timeline rồi bấm đây để thêm file gốc của chúng vào khay':
      'Select clips on the timeline, then press here to add their source files to the bin',

    // ─── Grid.tsx — luoi + thanh thao tac ───
    'file': 'files',
    'Bấm': 'Press',
    'trong': 'of',
    'Đang xem': 'Showing',
    'Xem to': 'Large view',
    'Bật tiếng': 'Unmute',
    'Tắt tiếng': 'Mute',
    'Xem vừa': 'Medium view',
    'Tạo brand': 'Create brand',
    'Đang quét…': 'Scanning…',
    'Bỏ khỏi khay': 'Remove from bin',
    'ở menu bên trái.': 'in the left menu.',
    'Đang quét thêm…': 'Scanning more…',
    'Chưa có asset nào': 'No assets yet',
    'Chưa có brand nào': 'No brands yet',
    'Âm lượng nghe thử': 'Preview volume',
    'Chèn vào timeline': 'Insert into timeline',
    'Thanh thao tác lưới': 'Grid actions',
    'Khay này chưa có gì': 'This bin is empty',
    '— cuộn tiếp để xem thêm': '— scroll for more',
    'Không tìm thấy asset nào': 'No assets found',
    'Đưa cao độ về nguyên bản': 'Reset pitch to original',
    'Đang tắt tiếng — bấm để bật': 'Muted — press to unmute',
    'Điều khiển nghe thử âm thanh': 'Audio preview controls',
    'Cao độ nghe thử, tính bằng nửa cung': 'Preview pitch, in semitones',
    'Các file này đã có trong khay rồi': 'These files are already in the bin',
    'Thử đổi từ khoá hoặc chọn loại asset khác.':
      'Try a different search term, or pick another asset type.',
    'Chọn một khay ở menu bên trái trước đã.': 'Pick a bin in the left menu first.',
    'Cao độ khi nghe thử — bấm để về nguyên bản (0)':
      'Preview pitch — press to reset to original (0)',
    'Bấm (hoặc rê chuột) vào một asset trước, rồi bấm đây để chèn':
      'Click (or hover) an asset first, then press here to insert it',
    'Không đọc được đường dẫn file. Kéo thả chỉ chạy khi mở trong Premiere.':
      'Could not read the file paths. Drag and drop only works inside Premiere.',
    'ở thanh trên để quét asset trên máy (video, Mogrt, âm thanh, ảnh).':
      'in the top bar to scan the assets on your machine (video, Mogrt, audio, images).',
    'Chọn một khay ở menu bên trái, hoặc gán asset vào khay để dùng chung cho mọi dự án.':
      'Pick a bin in the left menu, or assign assets to a bin to reuse them across every project.',
    'Kéo file từ Explorer vào đây, hoặc chọn clip trên timeline rồi bấm “Thêm từ timeline”.':
      'Drag files from Explorer in here, or select clips on the timeline and press “Add from timeline”.',
    'Brand là bộ nhận diện dùng lại ở mọi dự án: logo, intro, nhạc nền… Tạo brand đầu tiên bằng nút':
      'A brand is an identity kit you reuse in every project: logo, intro, background music… Create your first brand with',

    // ─── Sidebar.tsx — menu trai ───
    'Âm thanh': 'Audio',
    'Hình ảnh': 'Images',
    'Tổng quan': 'Overview',
    'Yêu thích': 'Favorites',
    'Loại asset': 'Asset type',
    'Tất cả asset': 'All assets',
    'Nguồn đã thêm': 'Added sources',
    'Chưa có thư mục nào': 'No folders yet',
    'Gỡ thư mục khỏi thư viện': 'Remove folder from library',
    'Kéo để xem tên thư mục dài': 'Drag to see long folder names',
    'Kéo để đổi bề rộng menu (hoặc dùng phím mũi tên trái/phải)':
      'Drag to resize the menu (or use the left/right arrow keys)',

    // ─── AssetCard.tsx — the asset ───
    'xem': 'view',
    'Bỏ yêu thích': 'Remove from favorites',
    'Đánh dấu yêu thích': 'Add to favorites',
    'Không đọc được file': 'Could not read file',
    'Đang tạo sóng âm…': 'Building waveform…',
    'nghe (bấm vào sóng âm để nghe từ đoạn đó)':
      'listen (click the waveform to play from that point)',

    // ─── SettingsModal.tsx — hop Cai dat ───
    'Cài đặt': 'Settings',
    'Nơi lưu': 'Location',
    'Dọn rác': 'Clean up',
    'Đổi chỗ…': 'Change…',
    'Xoá tất cả': 'Clear all',
    'Đang dọn…': 'Cleaning…',
    'Bộ nhớ đệm': 'Cache',
    'Đóng (Esc)': 'Close (Esc)',
    '(chưa xác định)': '(not set)',
    'Đóng cài đặt': 'Close settings',
    'Không có file thừa': 'No leftover files',
    'Rác macOS trên ổ': 'macOS junk on the drive',
    'Bấm lần nữa để dọn': 'Press again to clean up',
    'Không có file thừa nào': 'There were no leftover files',
    'Bấm lần nữa để xoá thật': 'Press again to really delete',
    'Xoá tất cả thì phải tạo lại': 'Clearing everything means rebuilding',
    'Chỉ xoá file cache không asset nào còn dùng':
      'Only deletes cache files that no asset still uses',
    'Đã xoá bộ nhớ đệm — đang tạo lại từ đầu…': 'Cache cleared — rebuilding from scratch…',
    'Bấm lần nữa để chuyển vào Thùng rác Windows':
      'Press again to move them to the Windows Recycle Bin',
    'Xoá toàn bộ ảnh xem trước đã tạo (phải tạo lại từ đầu)':
      'Delete every thumbnail already built (they all have to be rebuilt)',
    'Chuyển ảnh xem trước sang ổ khác — panel sẽ chuyển file và sửa đường dẫn giúp anh':
      'Move the thumbnails to another drive — the panel moves the files and fixes the paths for you',
    '— trong lúc đó các thẻ chỉ hiện icon. Thư viện, brand, khay và yêu thích giữ nguyên.':
      '— until they are back, the cards show icons only. Library, brands, bins and favorites are untouched.',
    'Chưa có ảnh xem trước nào để xoá. Thư viện, brand, khay và yêu thích không nằm trong bộ nhớ đệm.':
      'There are no thumbnails to clear yet. Library, brands, bins and favorites are not stored in the cache.',

    // ─── PowerBinHub.tsx — menu trai cua Power Bins ───
    'Lưu': 'Save',
    'Thêm khay': 'Add bin',
    'Khay chung': 'Ungrouped bins',
    'Tên khay mới': 'New bin name',
    'Tên brand mới': 'New brand name',
    'Tên khay (vd: Logo)…': 'Bin name (e.g. Logo)…',
    'Tên brand (vd: Kênh A)…': 'Brand name (e.g. Channel A)…',
    'Tạo brand mới (bộ nhận diện dùng lại ở mọi dự án)':
      'Create a new brand (an identity kit reused in every project)',
    'Mỗi brand là một bộ tài nguyên nhận diện dùng lại ở mọi dự án Premiere':
      'Each brand is a set of identity assets you reuse in every Premiere project',

    // ─── state\store.ts — thong bao ───
    'Quét lỗi: ': 'Scan failed: ',
    'Chọn thư mục lưu bộ nhớ đệm': 'Pick a folder to store the cache',
    'Đang cập nhật thư viện theo chuẩn mới…': 'Updating the library to the new format…',
    'Không khởi động được máy chủ preview nội bộ.':
      'Could not start the internal preview server.',
    'Không có file nào dùng được (đuôi file không hỗ trợ).':
      'No usable files (unsupported file extensions).',
    'Node không khả dụng — mở panel trong Premiere để dùng.':
      'Node.js is not available — open the panel inside Premiere to use it.',
    'Đã xoá brand. Các khay bên trong được giữ lại ở mục Khay chung.':
      'Brand deleted. The bins inside it are kept under Ungrouped bins.',

    // ─── lib\cep.ts — bao loi tu Premiere ───
    'Chọn thư mục asset': 'Pick an asset folder',
    'Không có phản hồi từ Premiere': 'No response from Premiere',

    // ─── services\timelineImport.ts ───
    'Không có phản hồi từ Premiere.': 'No response from Premiere.',
    'Chức năng này chỉ chạy khi panel mở trong Premiere.':
      'This only works while the panel is open inside Premiere.',
    'Chưa chọn clip nào trên timeline (hoặc clip không có file gốc).':
      'No clips selected on the timeline (or the clips have no source file).',

    // ─── services\cacheMove.ts — doi cho luu bo nho dem ───
    'Chưa chọn thư mục.': 'No folder selected.',
    'Không truy cập được hệ thống file.': 'Could not reach the file system.',
    'Đang lưu ở đúng thư mục này rồi.': 'The cache is already stored in that folder.',
    'Không xác định được chỗ lưu hiện tại.': 'Could not determine the current location.',
    'Không chọn được thư mục nằm bên trong chỗ lưu hiện tại.':
      'You cannot pick a folder that sits inside the current location.',
    'Không ghi được vào thư mục mới. Kiểm tra lại quyền ghi của ổ đĩa.':
      'Could not write to the new folder. Check the write permissions on that drive.',

    // ─── services\scanner.ts ───
    'Node fs/path không khả dụng (ngoài CEP).': 'Node fs/path is not available (outside CEP).',
  },
}
