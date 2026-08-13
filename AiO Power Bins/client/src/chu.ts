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
 * 1. ~~**49 chuoi co `${...}` ben trong**~~ — **DA XU LY 13/08/2026 (dot 2).**
 *    Xem muc "CHUOI CO CHO TRONG" o CUOI bang. Cach lam: khoa chua CA CAU voi
 *    cho trong `{ten}` / `{n}`, ma nguon goi
 *    `dich('… {n} …').replace('{n}', String(n))`.
 *    KHONG tach cau thanh manh vun: manh dich roi ghep lai ra cau nua Anh nua
 *    Viet, te hon la de nguyen tieng Viet (luat 4).
 *    ⚠️ Cho trong nao nhan **chu do NGUOI DUNG go** (ten brand, ten khay, ten
 *    file, duong dan) thi phai dung dang HAM: `.replace('{ten}', () => ten)`.
 *    Dang chuoi thuong se dich `$&` `$'` `` $` `` trong ten file thanh thu
 *    khac — ten thu muc `Nhac $& Loop` se ra sai.
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
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ CON HAI CHO CHUA XONG — NAM NGOAI `client/src`, DO THAT 13/08/2026
 * ══════════════════════════════════════════════════════════════════════════
 * A. **`host/ppro.jsx` con 6 cau bao loi TIENG VIET KHONG DAU, VA CHUNG HIEN
 *    RA MAN HINH THAT.** Grep theo dau khong thay chung — dung bay 2 o tren.
 *      'Chua mo project' · 'Chua mo sequence nao' · 'Import that bai' ·
 *      'Chen MOGRT that bai' ·
 *      'Moi track {am thanh|video} deu co clip tai vi tri nay, va khong them
 *       duoc track moi. Hay them mot track trong roi thu lai.' ·
 *      'Moi track video deu co clip tai vi tri nay, va khong them duoc track
 *       moi. Hay them mot track video trong roi thu lai.'
 *    Duong di da do: `parseResult()` (lib/cep.ts) cat 'ERR:' roi tra `message`
 *    -> `store.ts:703` (`sendToTimeline`, chi hien khi THAT BAI) va
 *    `store.ts:512` (`addTimelineSelectionToPowerBin`). Cac cau 'OK:…' KHONG
 *    bao gio hien (ca hai cho deu boc trong `if (!res.ok)`), nen chi 6 cau ERR
 *    la thay duoc.
 *    -> CHUA SUA vi hai le: (1) sua `host/*.jsx` thi Premiere phai TAT HAN roi
 *    mo lai moi nap ban moi, khong kiem chung duoc trong phien nay; (2) cach
 *    dung khong phai dich thang trong jsx ma la cho host tra ve MA LOI
 *    ('ERR:NO_SEQUENCE'…) roi panel tra bang — de con lai jsx tu dich la sau
 *    nay co hai bang chu o hai noi.
 *
 * B. **`services/cachePaths.ts:28` con dinh dung cai bay `process.env`** ma
 *    dau muc nay canh bao. Doc ban build 13/08: `var Om = {}` roi
 *    `typeof process<"u"&&Om.APPDATA` -> luon `undefined`.
 *    `ngonngu.tsx` va `services/ffmpeg.ts` DA sua xong (do lai: ca hai nay doc
 *    `cep_node.process` / `bienMT()` luc chay, khong con chu `process.env`).
 *    -> CHUA SUA vi day la duong LUI cua `userDataPath()`, ma trong Premiere
 *    thi `userDataPath()` luon co gia tri nen nhanh nay chua tung chay. Bat
 *    mot nhanh chua tung chay o cho GIAI DUONG DAN KHO CACHE la viec phai do
 *    tren Premiere that truoc, khong lam ke ben mot viec dich chu.
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
    // ☠️ Man hinh DAU TIEN cua panel. Ban cu chi sang nut "Thêm thư mục" /
    // "Add folder" — nut do nam trong nhanh `isLibrary` cua Toolbar.tsx, ma
    // `activeMasterTab` khoi tao 'powerbin' va `setActiveMasterTab` KHONG duoc
    // goi o dau ca (do 13/08), nen nhanh do khong bao gio chay. Cau moi chi
    // dung "Thêm từ timeline" — nut CO THAT tren thanh dau cua panel nay.
    'Tạo brand và khay ở menu bên trái, rồi bấm':
      'Create a brand and a bin in the left menu, then press',
    'ở thanh trên — hoặc kéo thẳng file từ Explorer vào đây.':
      'in the top bar — or drag files straight from Explorer into this grid.',
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

    // ══════════════════════════════════════════════════════════════════════
    // CHUOI CO CHO TRONG — cau tron ven, ma nguon dien so bang `.replace()`
    // ══════════════════════════════════════════════════════════════════════
    // `{ten}` `{khay}` `{loai}` nhan CHU, `{n}` `{tong}` `{loi}` nhan SO.
    // Cho trong nhan chu nguoi dung go thi ben ma nguon phai dung dang ham:
    // `.replace('{ten}', () => ten)` — xem ghi chu dau file.

    // ─── components\PowerBinHub.tsx — ☠️ HAI HOP THOAI XOA ───
    // Day la cho nguy hiem nhat panel: nguoi dung EN bam Xoa ma doc khong
    // hieu minh dang dong y xoa cai gi thi ho mat du lieu.
    'Xoá khay {ten}': 'Delete bin {ten}',
    'Xoá brand {ten}': 'Delete brand {ten}',
    'Thêm khay vào brand {ten}': 'Add a bin to brand {ten}',
    'Xoá khay "{ten}"? Asset gốc trên đĩa không bị xoá.':
      'Delete the bin "{ten}"? The source files on disk are not deleted.',
    'Xoá brand "{ten}"?\n\nCác khay bên trong KHÔNG bị xoá — chúng chuyển sang mục "Khay chung".':
      'Delete the brand "{ten}"?\n\nThe bins inside are NOT deleted — they move to "Shared bins".',

    // ─── components\Grid.tsx ───
    'Chèn {ten} vào timeline': 'Add {ten} to the timeline',
    'Đã thêm {n} file vào khay': 'Added {n} files to the bin',
    'Bỏ {ten} khỏi khay': 'Remove {ten} from the bin',
    'Âm lượng {n}% — bấm để tắt tiếng': 'Volume {n}% — press to mute',
    'Chèn "{ten}" vào timeline tại playhead': 'Add "{ten}" to the timeline at the playhead',
    'Bỏ "{ten}" khỏi khay (không xoá file trên đĩa)':
      'Remove "{ten}" from the bin (the file on disk is not deleted)',
    'Cao độ {n} nửa cung — đổi cao độ thì tốc độ nghe thử đổi theo':
      'Pitch {n} semitones — changing the pitch changes the preview speed with it',

    // ─── components\AssetCard.tsx ───
    'Bỏ yêu thích {ten}': 'Remove {ten} from favorites',
    'Đánh dấu yêu thích {ten}': 'Add {ten} to favorites',
    'Bấm để xem · Kéo thả vào timeline, hoặc bấm nút Import':
      'Click to view · Drag and drop onto the timeline, or press Import',
    'Bấm để nghe (bấm vào sóng âm để nghe từ đoạn đó) · Kéo thả vào timeline, hoặc bấm nút Import':
      'Click to listen (click the waveform to play from that point) · Drag and drop onto the timeline, or press Import',

    // ─── components\SettingsModal.tsx ───
    '{n} sóng âm': '{n} waveforms',
    'Dọn {n} file': 'Clean up {n} files',
    '{n} ảnh xem trước': '{n} thumbnails',
    '{n} bản xem nhanh': '{n} proxies',
    'Đã dọn {n} file thừa': 'Cleaned up {n} leftover files',
    'Đang dùng cho {n} asset': 'In use by {n} assets',
    'Đã chuyển {n} file rác vào Thùng rác': 'Moved {n} junk files to the Recycle Bin',
    '{n} file thừa ({dung}) — dọn đi không mất gì':
      '{n} leftover files ({dung}) — cleaning them up costs you nothing',
    'Chuyển {n} file rác vào Thùng rác Windows — khôi phục lại được nếu cần':
      'Move {n} junk files to the Windows Recycle Bin — you can restore them if you need to',
    'Đã chuyển {n} file vào Thùng rác — {loi} file không chuyển được (đang mở?)':
      'Moved {n} files to the Recycle Bin — {loi} files could not be moved (still open?)',
    '{n} file thừa ({dung}) do giải nén file zip của máy Mac — không phải nhạc/video, Premiere cũng không mở được':
      '{n} leftover files ({dung}) left behind by unzipping Mac archives — not audio or video, and Premiere cannot open them either',

    // ─── components\Sidebar.tsx ───
    'Gỡ thư mục {ten}': 'Remove the folder {ten}',
    'Quét lại riêng thư mục {ten}': 'Rescan only the folder {ten}',
    'Bấm để xổ {n} thư mục bên trong': 'Press to expand the {n} folders inside',
    'Bấm lần nữa để thu gọn {n} thư mục': 'Press again to collapse the {n} folders',
    '{n} {loai} — cả thư mục có {tong} file mọi loại':
      '{n} {loai} — the whole folder holds {tong} files of every kind',

    // ─── components\Toolbar.tsx ───
    'Dừng render ({n}/{tong})': 'Stop rendering ({n}/{tong})',
    'Cả {n} asset trong thư viện đã render xong.':
      'All {n} assets in the library have finished rendering.',
    '{n} file đọc không ra (hỏng hoặc sai định dạng).':
      '{n} files could not be read (damaged, or in an unsupported format).',
    'Cả {n} asset trong thư viện đều đã có preview. Bấm để kiểm tra lại.':
      'All {n} assets in the library already have a preview. Press to check again.',
    '{n} file Mogrt không có ảnh xem trước kèm trong gói — file vẫn tốt, Premiere dùng bình thường, chỉ là không có gì để hiện.':
      '{n} Mogrt files carry no thumbnail inside the package — the files are fine and Premiere uses them normally, there is simply nothing to show.',
    'Đang render {n}/{tong} asset còn thiếu preview — tính trên TOÀN thư viện {all} asset, không riêng thư mục đang chọn.\nMáy chạy hết sức nên Premiere có thể hơi ì. Bấm để DỪNG; phần đã render vẫn giữ nguyên.':
      'Rendering {n}/{tong} assets that are missing a preview — counted across the WHOLE library of {all} assets, not just the folder you picked.\nYour machine runs at full speed, so Premiere may feel sluggish. Press to STOP; whatever is already rendered is kept.',
    'Render preview cho {n} asset còn thiếu ảnh/sóng âm — tính trên TOÀN thư viện {all} asset, không riêng thư mục đang chọn.\nMáy sẽ bận trong lúc chạy — bấm lần nữa để dừng bất cứ lúc nào.':
      'Render previews for {n} assets missing a thumbnail or waveform — counted across the WHOLE library of {all} assets, not just the folder you picked.\nYour machine will be busy while it runs — press again to stop at any time.',

    // ─── state\store.ts ───
    'Đã tạo brand: {ten}': 'Brand created: {ten}',
    'Đã tạo khay: {ten}': 'Bin created: {ten}',
    'Đã quét {n} asset': 'Scanned {n} assets',
    'Đã bỏ "{ten}" khỏi khay': 'Removed "{ten}" from the bin',
    'Đã gán nhãn cho {n} asset': 'Tagged {n} assets',
    'Đã quét lại {ten}: {n} file': 'Rescanned {ten}: {n} files',
    'Đã thêm {n} file từ timeline': 'Added {n} files from the timeline',
    'Đã thêm {n} file từ timeline vào khay "{khay}"':
      'Added {n} files from the timeline to the bin "{khay}"',

    // ─── services\cacheMove.ts ───
    'Đã chuyển {n} file sang chỗ mới.': 'Moved {n} files to the new location.',
    'Đã chuyển {n} file, {loi} file không chuyển được (đang mở?).':
      'Moved {n} files, {loi} files could not be moved (still open?).',

    // ─── services\timelineImport.ts ───
    'Đã đọc {n} file từ timeline': 'Read {n} files from the timeline',
  },
}
