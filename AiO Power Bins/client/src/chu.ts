/**
 * chu.ts — BANG DICH TIENG ANH cho AiO Power Bins.
 *
 * Khoa = CHINH CAU TIENG VIET trong ma nguon. Khong co trong bang thi tra lai
 * nguyen van cau do -> quen dich mot cau chi lam no hien tieng Viet, khong lam
 * vo giao dien. Xem giai thich day du o `ngonngu.tsx`.
 *
 * Sinh tu do that ngay 13/08/2026 tren `client/src` (tru `ngonngu.tsx`):
 *      172  chuoi co dau tieng Viet (da xoa comment TRUOC khi do)
 *    -  49  chuoi chua `${...}`            -> phai sua tay, xem muc duoi
 *    -   9  khong phai chu hien thi        -> 3 mockData · 5 ten nhan mau · 1 console
 *    = 114
 *    +   5  chuoi hien thi VIET KHONG DAU  -> bo quet theo dau khong the thay
 *    = 119  khoa
 *
 * Da doi chieu HAI CHIEU voi ma nguon (`doikhop.mjs`): 0 khoa chet (khoa nao
 * cung co that trong ma nguon), 0 chuoi con sot ngoai 6 dong da co y bo o duoi.
 * Bo doi chieu do da thu doi chung: bia them 1 khoa va bo bot 1 khoa thi no
 * bao do dung ca hai chieu.
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
 *   khay              -> bin                   (Adobe goi tinh nang nay la
 *                                                "Power Bin" — dung dung chu do)
 *   khay chung        -> shared bins           (khay khong thuoc brand nao)
 *   anh xem truoc     -> thumbnail             (KHONG "preview image")
 *   ban xem nhanh     -> proxy                 (Premiere goi la Proxy)
 *   song am           -> waveform
 *   bo nho dem        -> cache
 *   Thung rac Windows -> Windows Recycle Bin
 *   yeu thich         -> favorites
 *   nua cung          -> semitone
 *   clip / timeline / track / project / bin / proxy / asset / brand / Mogrt
 *                     -> giu nguyen, la tu nghe
 *
 * ☠️ MOT NGOAI LE CO CAN NHAC: `Chèn vào timeline` -> **"Add to timeline"**,
 * KHONG dich thanh "Insert" hay "Overwrite". Ly do do duoc: doc
 * `host/ppro.jsx` (`ppro_importToTimeline`) thi thay no goi `ppro_pickFreeTrack`
 * de tim track TRONG roi moi `overwriteClip` — het cho thi TAO track moi. Tuc
 * la no khong bao gio de len clip cua nguoi dung.
 *   - dich "Insert"    -> editor hieu nham la se ripple, day clip phia sau di
 *   - dich "Overwrite" -> editor hieu nham la se an mat clip dang co
 * Ca hai deu la hai chu CO NGHIA RAT CHAT trong Premiere. "Add to timeline"
 * dung voi viec no lam that, va khop voi nhan nut dang co ("Import").
 *
 * Gap tu chua co trong bang tren: tra trong giao dien Premiere truoc, dung
 * tu dat. Neu Premiere khong co khai niem do thi moi dat, va ghi them mot
 * dong vao bang tren de lan sau khong dich kieu khac.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️☠️ BAY 1 — BON CHO NAY LA HANG `const` TANG MODULE: DICH O CHO VE RA
 * ══════════════════════════════════════════════════════════════════════════
 * Bang nay CO chua chu cua bon mang duoi, nhung chung chay luc IMPORT, truoc
 * khi React gan bang chu. Boc `dich()` NGAY TRONG MANG la tieng Viet dong
 * cung vinh vien, doi ngon ngu khong bao gio an:
 *
 *   components/Grid.tsx      `const SIZES`      'Xem vừa' · 'Xem to'
 *   components/Sidebar.tsx   `const TYPE_ITEMS` 'Âm thanh' · 'Hình ảnh'
 *   components/AssetCard.tsx `const TYPE_NAME`  'Âm thanh' · 'Hình ảnh'
 *
 * -> Giu nguyen mang, boc o cho VE RA: `title={dich(title)}`,
 *    `<span>{dich(label)}</span>`, `dich(TYPE_NAME[asset.type])`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️☠️ BAY 2 — BAY CHUOI HIEN THI VIET KHONG DAU, GREP THEO DAU KHONG THAY
 * ══════════════════════════════════════════════════════════════════════════
 * Quet bang bang chu cai co dau bo sot HET nhung chuoi duoi. Chung nam trong
 * bang nay, nhung phien sau dung lai bo quet cu thi se tuong la thua:
 *
 *   'Xem to'      components/Grid.tsx        (cap voi 'Xem vừa')
 *   'Khay chung'  components/PowerBinHub.tsx (tieu de muc)
 *   'trong'       components/Grid.tsx        manh cua "Đang xem N trong M — …"
 *   'file'        components/Grid.tsx        manh cua "Đang quét… N file"
 *   'file…'       components/Toolbar.tsx     manh cua "Đang quét N file…"
 *
 * ⚠️ 'file' -> 'files' va 'file…' -> 'files…' la CO Y: tieng Viet khong co so
 * nhieu, tieng Anh thi "5 file" doc sai. Cho nao chi co dung 1 file thi cau
 * tieng Anh se hoi cung — chap nhan, vi day la o dem so luong asset (gan nhu
 * luon > 1). Muon chuan thi phai doi sang `tp('Đang quét {n} file', { n })`,
 * tuc sua ca ma nguon chu khong chi sua bang nay.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ THU CO Y KHONG NAM TRONG BANG NAY
 * ══════════════════════════════════════════════════════════════════════════
 * 1. **49 chuoi co `${...}` ben trong** (template literal). Chung khong bao gio
 *    khop khoa duoc vi noi dung doi theo du lieu. Phai sua tay o ma nguon:
 *    tach phan chu ra `dich()`, hoac doi sang `tp('… {n} …', { n })`.
 *    Danh sach day du nam trong bao cao cua phien 13/08.
 * 2. **Ten thuong hieu**: `Power Bins` · `Brand Kit` · `Asset Manager` ·
 *    `Premiere` · `Mogrt` · `Import` — von da la tieng Anh, giu nguyen o ca hai
 *    thu tieng. Khong co trong bang = tra lai nguyen van. DUNG "dich cho du".
 * 3. **`dev/mockData.ts`**: 'Kênh Demo' · 'Nhạc nền' · 'Hay dùng'. Do la ten
 *    brand/khay GIA cua ban demo, chi nap khi `import.meta.env.DEV` — khong
 *    lot vao ban build. Chung dong vai "chu nguoi dung tu go", khong phai chu
 *    cua giao dien.
 * 4. **`state/store.ts` `tags`**: 'Đỏ' · 'Vàng' · 'Xanh lá' · 'Xanh dương' ·
 *    'Tím'. Da do bang grep: **khong component nao doc `s.tags`**, nen chung
 *    chua he hien ra man hinh. Va chung nam trong `create()` — dung cai bay 1
 *    o tren. Bao gio dung lai muc nhan mau thi them vao day, va nho boc o cho
 *    VE RA chu khong boc trong mang.
 * 5. **`services/library.ts` 'Lưu thư viện thất bại:'** — do la `console.error`,
 *    nguoi dung khong bao gio thay.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    // ─── Manh dem so (Grid + Toolbar) — xem BAY 2 o dau file ───
    'file': 'files',
    'file…': 'files…',
    'trong': 'of',
    'Đang xem': 'Showing',
    '— cuộn tiếp để xem thêm': '— scroll for more',

    // ─── components\Toolbar.tsx ───
    'Đang quét': 'Scanning',
    'Xoá từ khoá': 'Clear search',
    'Mở cài đặt': 'Open settings',
    'Thêm thư mục': 'Add folder',
    'Preview đã đủ': 'Previews complete',
    'Thêm từ timeline': 'Add from timeline',
    'Tìm asset theo tên': 'Search assets by name',
    'Tìm asset theo tên…': 'Search assets by name…',
    'Xoá từ khoá tìm kiếm': 'Clear the search box',
    'Bấm để thử lại những file đó.': 'Press to retry those files.',
    'Cài đặt (chất lượng proxy, xoá cache)': 'Settings (proxy quality, clear cache)',
    'Đã kiểm tra: mọi asset đều có preview.': 'Checked: every asset has a preview.',
    'Chọn một khay ở menu bên trái trước đã': 'Pick a bin in the left menu first',
    'Chọn thư mục trên máy để thêm vào thư viện':
      'Choose a folder on this computer to add to the library',
    'Đã dừng render. Phần đã xong vẫn giữ nguyên.':
      'Rendering stopped. What is already done is kept.',
    'Đang render hết sức — máy sẽ bận. Bấm lại để dừng.':
      'Rendering at full speed — your machine will be busy. Press again to stop.',
    'Chọn clip trên timeline rồi bấm đây để thêm file gốc của chúng vào khay':
      'Select clips on the timeline, then press here to add their source files to the bin',

    // ─── components\Sidebar.tsx ───
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

    // ─── components\Sidebar.tsx + AssetCard.tsx — nhan loai asset ───
    // ☠️ Nam trong `TYPE_ITEMS` / `TYPE_NAME` tang module — xem BAY 1.
    'Âm thanh': 'Audio',
    'Hình ảnh': 'Image',

    // ─── components\PowerBinHub.tsx ───
    'Lưu': 'Save',
    'Tạo brand': 'New brand',
    'Thêm khay': 'Add bin',
    'Khay chung': 'Shared bins',
    'Tên khay mới': 'New bin name',
    'Tên brand mới': 'New brand name',
    'Tên khay (vd: Logo)…': 'Bin name (e.g. Logo)…',
    'Tên brand (vd: Kênh A)…': 'Brand name (e.g. Channel A)…',
    'Tạo brand mới (bộ nhận diện dùng lại ở mọi dự án)':
      'Create a new brand (an identity set reused in every project)',
    'Mỗi brand là một bộ tài nguyên nhận diện dùng lại ở mọi dự án Premiere':
      'A brand is a set of identity assets you reuse in every Premiere project',

    // ─── components\Grid.tsx — nut va nhan ───
    'Bấm': 'Press',
    'Xem to': 'Large view',
    'Xem vừa': 'Medium view',
    'Bật tiếng': 'Unmute',
    'Tắt tiếng': 'Mute',
    'Đang quét…': 'Scanning…',
    'Bỏ khỏi khay': 'Remove from bin',
    'Đang quét thêm…': 'Scanning more…',
    'ở menu bên trái.': 'in the left menu.',
    'Chèn vào timeline': 'Add to timeline',
    'Âm lượng nghe thử': 'Preview volume',
    'Chưa có asset nào': 'No assets yet',
    'Chưa có brand nào': 'No brands yet',
    'Thanh thao tác lưới': 'Grid actions',
    'Khay này chưa có gì': 'This bin is empty',
    'Không tìm thấy asset nào': 'No assets found',
    'Đưa cao độ về nguyên bản': 'Reset pitch to original',
    'Đang tắt tiếng — bấm để bật': 'Muted — press to unmute',
    'Điều khiển nghe thử âm thanh': 'Audio preview controls',
    'Cao độ nghe thử, tính bằng nửa cung': 'Preview pitch, in semitones',
    'Các file này đã có trong khay rồi': 'Those files are already in the bin',
    'Cao độ khi nghe thử — bấm để về nguyên bản (0)':
      'Preview pitch — press to reset to original (0)',
    'Thử đổi từ khoá hoặc chọn loại asset khác.':
      'Try another keyword, or pick a different asset type.',
    'Chọn một khay ở menu bên trái trước đã.': 'Pick a bin in the left menu first.',
    'Bấm (hoặc rê chuột) vào một asset trước, rồi bấm đây để chèn':
      'Pick an asset first (click or hover), then press here to add it',
    'ở thanh trên để quét asset trên máy (video, Mogrt, âm thanh, ảnh).':
      'in the top bar to scan assets on this computer (video, Mogrt, audio, images).',
    'Không đọc được đường dẫn file. Kéo thả chỉ chạy khi mở trong Premiere.':
      'Could not read the file path. Drag and drop only works inside Premiere.',
    'Chọn một khay ở menu bên trái, hoặc gán asset vào khay để dùng chung cho mọi dự án.':
      'Pick a bin in the left menu, or put assets into a bin to share them across every project.',
    'Kéo file từ Explorer vào đây, hoặc chọn clip trên timeline rồi bấm “Thêm từ timeline”.':
      'Drag files from Explorer here, or select clips on the timeline and press “Add from timeline”.',
    'Brand là bộ nhận diện dùng lại ở mọi dự án: logo, intro, nhạc nền… Tạo brand đầu tiên bằng nút':
      'A brand is an identity set you reuse in every project: logos, intros, background music… Create your first brand with',

    // ─── components\AssetCard.tsx ───
    'Bỏ yêu thích': 'Remove from favorites',
    'Đánh dấu yêu thích': 'Add to favorites',
    'Không đọc được file': 'Could not read the file',
    'Đang tạo sóng âm…': 'Building waveform…',

    // ─── components\SettingsModal.tsx ───
    'Cài đặt': 'Settings',
    'Nơi lưu': 'Location',
    'Dọn rác': 'Clean up',
    'Đổi chỗ…': 'Move…',
    'Đang dọn…': 'Cleaning…',
    'Xoá tất cả': 'Clear all',
    'Đóng (Esc)': 'Close (Esc)',
    'Bộ nhớ đệm': 'Cache',
    'Đóng cài đặt': 'Close settings',
    '(chưa xác định)': '(not set)',
    'Rác macOS trên ổ': 'macOS junk on disk',
    'Không có file thừa': 'No leftover files',
    'Bấm lần nữa để dọn': 'Press again to clean up',
    'Không có file thừa nào': 'No leftover files found',
    'Bấm lần nữa để xoá thật': 'Press again to really clear',
    'Xoá tất cả thì phải tạo lại': 'Clearing everything means rebuilding',
    'Đã xoá bộ nhớ đệm — đang tạo lại từ đầu…': 'Cache cleared — rebuilding from scratch…',
    'Chỉ xoá file cache không asset nào còn dùng':
      'Only deletes cache files no asset uses any more',
    'Bấm lần nữa để chuyển vào Thùng rác Windows':
      'Press again to move them to the Windows Recycle Bin',
    'Xoá toàn bộ ảnh xem trước đã tạo (phải tạo lại từ đầu)':
      'Clear every thumbnail already built (they must be rebuilt from scratch)',
    'Chuyển ảnh xem trước sang ổ khác — panel sẽ chuyển file và sửa đường dẫn giúp anh':
      'Move the cache to another drive — the panel moves the files and fixes the paths for you',
    '— trong lúc đó các thẻ chỉ hiện icon. Thư viện, brand, khay và yêu thích giữ nguyên.':
      '— until then cards show only an icon. Library, brands, bins and favorites are untouched.',
    'Chưa có ảnh xem trước nào để xoá. Thư viện, brand, khay và yêu thích không nằm trong bộ nhớ đệm.':
      'No thumbnails to clear yet. Library, brands, bins and favorites are not part of the cache.',

    // ─── state\store.ts ───
    'Quét lỗi: ': 'Scan error: ',
    'Chọn thư mục lưu bộ nhớ đệm': 'Choose a folder for the cache',
    'Đang cập nhật thư viện theo chuẩn mới…': 'Updating the library to the new format…',
    'Không khởi động được máy chủ preview nội bộ.':
      'Could not start the internal preview server.',
    'Không có file nào dùng được (đuôi file không hỗ trợ).':
      'No usable files (unsupported file extensions).',
    'Node không khả dụng — mở panel trong Premiere để dùng.':
      'Node is not available — open the panel inside Premiere to use it.',
    'Đã xoá brand. Các khay bên trong được giữ lại ở mục Khay chung.':
      'Brand deleted. Its bins were kept under Shared bins.',

    // ─── lib\cep.ts ───
    'Chọn thư mục asset': 'Choose an asset folder',
    'Không có phản hồi từ Premiere': 'No response from Premiere',

    // ─── services\timelineImport.ts ───
    'Không có phản hồi từ Premiere.': 'No response from Premiere.',
    'Chức năng này chỉ chạy khi panel mở trong Premiere.':
      'This only works when the panel is open inside Premiere.',
    'Chưa chọn clip nào trên timeline (hoặc clip không có file gốc).':
      'No clips selected on the timeline (or the clips have no source file).',

    // ─── services\scanner.ts ───
    'Node fs/path không khả dụng (ngoài CEP).': 'Node fs/path is not available (outside CEP).',

    // ─── services\cacheMove.ts ───
    'Chưa chọn thư mục.': 'No folder chosen.',
    'Không truy cập được hệ thống file.': 'Could not access the file system.',
    'Đang lưu ở đúng thư mục này rồi.': 'The cache is already in that folder.',
    'Không xác định được chỗ lưu hiện tại.': 'Could not determine the current cache location.',
    'Không chọn được thư mục nằm bên trong chỗ lưu hiện tại.':
      'You cannot choose a folder inside the current cache location.',
    'Không ghi được vào thư mục mới. Kiểm tra lại quyền ghi của ổ đĩa.':
      'Could not write to the new folder. Check the write permissions on that drive.',
  },
}
