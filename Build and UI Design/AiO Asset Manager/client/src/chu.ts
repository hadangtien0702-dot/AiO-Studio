/**
 * chu.ts — BANG DICH TIENG ANH cho AiO Asset Manager.
 *
 * Khoa = CHINH CAU TIENG VIET trong ma nguon. Khong co trong bang thi tra lai
 * nguyen van cau do -> quen dich mot cau chi lam no hien tieng Viet, khong lam
 * vo giao dien. Xem giai thich day du o `ngonngu.tsx`.
 *
 * Sinh tu do that ngay 13/08/2026 — con so lay bang script, khong uoc luong.
 *
 * DOT 1 (sang 13/08): 121 khoa. Con bo sot 49 chuoi co `${...}` ben trong va
 * 2 khoa la MANH GIUA CAU (`xem`, `nghe (bam vao song am…)`).
 *
 * DOT 2 (chieu 13/08) — sua dung 4 loi da xac dinh:
 *
 *   121  khoa cu
 *    -2  XOA hai khoa manh (xem muc "KHONG DICH MANH" ben duoi)
 *   +50  cau tron ven moi, phan lon la cau co CHO TRONG `{...}`
 *   ====
 *   169  khoa
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ SO DO CUOI CUNG — DO TREN BAN DA BUILD, KHONG PHAI TREN MA NGUON
 * ══════════════════════════════════════════════════════════════════════════
 * Ma nguon dung KHONG chung minh duoc ban build dung: Vite thay `process.env`
 * bang object rong, va bo minify doi `\n` thanh xuong dong THAT (chinh cho nay
 * lam phep do dau tien bao nham "thieu 3 ban dich" trong khi ca 3 deu co).
 *
 *   169/169  khoa tieng Viet co trong `dist/index.html`
 *   169/169  ban dich tieng Anh co trong `dist/index.html`
 *   165/166  cau duoc `dich('...')` goi that trong ma nguon -> tra ra tieng Anh
 *            (cau con lai `{n} {loai}` giong nhau o hai thu tieng — co y)
 *        0   khoa trung · 0 loi `tsc --noEmit` · build sach
 *
 * Bon khoa `Xem to` · `Xem vừa` · `Âm thanh` · `Hình ảnh` KHONG xuat hien
 * trong bat ky `dich('...')` nao — chung duoc goi qua BIEN (`dich(label)`,
 * `dich(title)`, `dich(TYPE_NAME[asset.type])`) vi la hang tang module. Do la
 * cach dung DUNG, dung tuong la khoa rac ma xoa.
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
 * 3. CHUOI CO `${...}` BEN TRONG: da noi san nen khong khop khoa duoc.
 *    ☠️ KHONG BAO GIO them vao bang mot khoa co `${...}` — no se khong bao
 *    gio khop, vi luc chay JS da noi chuoi xong roi.
 *    Cach lam (dot 2, 13/08): doi cho goi tu template sang CAU CO CHO TRONG
 *    `{ten}` / `{n}` / `{tong}`, roi dien bang `.replace()`:
 *
 *        `Đã tạo brand: ${name}`
 *        -> dich('Đã tạo brand: {ten}').replace('{ten}', name)
 *
 *    Loi the: khoa la MOT CAU DOC DUOC, va tieng Anh duoc dat lai cho trong
 *    dung trat tu cua no (`Bỏ yêu thích {ten}` -> `Remove {ten} from
 *    favorites`) — thu ma noi chuoi bang `+` khong lam duoc.
 * 4. CHUOI KHONG PHAI GIAO DIEN (9 chuoi):
 *      1  `console.error('Luu thu vien that bai:')` — chi ra devtools
 *      5  ten nhan mau trong `store.ts` (`tags`: Do/Vang/Xanh la/Xanh duong/
 *         Tim). Da grep: KHONG component nao doc `s.tags` -> khong ve ra man
 *         hinh bao gio. Ngay nao co man hinh nhan mau thi them vao day.
 *      3  trong `dev/mockData.ts` — chi chay khi mo panel bang trinh duyet,
 *         khong lot vao ban build production.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️☠️ KHONG DICH MANH GIUA CAU — TE HON LA DE NGUYEN TIENG VIET
 * ══════════════════════════════════════════════════════════════════════════
 * Vap that o dot 1 (13/08), sua o dot 2. `AssetCard.tsx` boc dung HAI TU nam
 * lot giua mot cau tieng Viet de nguyen:
 *
 *     title={`… Bấm để ${type === 'audio' ? dich('nghe (…)') : dich('xem')} ·
 *            Kéo thả vào timeline, hoặc bấm nút Import`}
 *
 * O che do EN, tooltip cua MOI THE ASSET doc ra:
 *     "Bấm để view · Kéo thả vào timeline, hoặc bấm nút Import"
 *
 * Nua Anh nua Viet kho doc hon han mot cau tieng Viet tron ven — nguoi dung
 * EN khong doc duoc phan Viet, ma nguoi dung VI thi vap phai chu la. Va no
 * KHONG lo ra khi dem: bo quet van thay "da boc `dich()`" o dong do.
 *
 * -> Luat: dich CA CAU. Cau bi mot bieu thuc cat doi thi TACH THANH NHIEU
 *    KHOA TRON VEN, moi khoa chon theo dieu kien — dung boc rieng cai manh.
 *    Neu cho trong la DU LIEU (ten file, con so) thi dung `{...}` + `.replace()`
 *    nhu muc 3, vi cho trong khong phai la mot manh cau.
 *
 * Cung ho o `store.ts`: ` vào khay "${bin.name}"` ghep vao duoi cau khac —
 * mot manh khong doc duoc doc lap. Nay la hai khoa tron ven, chon theo viec
 * co biet ten khay hay khong.
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
    'Dừng render ({xong}/{tong})': 'Stop rendering ({xong}/{tong})',
    'Cả {n} asset trong thư viện đã render xong.':
      'All {n} assets in the library have finished rendering.',
    '{n} file đọc không ra (hỏng hoặc sai định dạng).':
      '{n} files could not be read (corrupt or an unsupported format).',
    'Cả {n} asset trong thư viện đều đã có preview. Bấm để kiểm tra lại.':
      'All {n} assets in the library already have a preview. Press to check again.',
    '{n} file Mogrt không có ảnh xem trước kèm trong gói — file vẫn tốt, Premiere dùng bình thường, chỉ là không có gì để hiện.':
      '{n} Mogrt files ship without a preview image inside the package — the files are fine and Premiere uses them normally, there is just nothing to show.',
    'Render preview cho {n} asset còn thiếu ảnh/sóng âm — tính trên TOÀN thư viện {thuvien} asset, không riêng thư mục đang chọn.\nMáy sẽ bận trong lúc chạy — bấm lần nữa để dừng bất cứ lúc nào.':
      'Render previews for the {n} assets still missing a thumbnail or waveform — counted across the WHOLE library of {thuvien} assets, not just the selected folder.\nThe machine will be busy while it runs — press again to stop at any time.',
    'Đang render {xong}/{tong} asset còn thiếu preview — tính trên TOÀN thư viện {thuvien} asset, không riêng thư mục đang chọn.\nMáy chạy hết sức nên Premiere có thể hơi ì. Bấm để DỪNG; phần đã render vẫn giữ nguyên.':
      'Rendering {xong}/{tong} assets that are still missing a preview — counted across the WHOLE library of {thuvien} assets, not just the selected folder.\nThe machine is running at full speed, so Premiere may feel sluggish. Press to STOP; everything already rendered is kept.',

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
    // Grid.tsx — cau co CHO TRONG, dien bang `.replace()` o cho goi (xem muc 3)
    'Đã thêm {n} file vào khay': 'Added {n} files to the bin',
    'Chèn {ten} vào timeline': 'Insert {ten} into the timeline',
    'Bỏ {ten} khỏi khay': 'Remove {ten} from the bin',
    'Âm lượng {n}% — bấm để tắt tiếng': 'Volume {n}% — press to mute',
    'Chèn “{ten}” vào timeline tại playhead': 'Insert “{ten}” into the timeline at the playhead',
    'Bỏ “{ten}” khỏi khay (không xoá file trên đĩa)':
      'Remove “{ten}” from the bin (the file on disk is not deleted)',
    'Cao độ {n} nửa cung — đổi cao độ thì tốc độ nghe thử đổi theo':
      'Pitch {n} semitones — changing the pitch changes the preview speed too',

    // ─── Sidebar.tsx — menu trai ───
    'Âm thanh': 'Audio',
    'Hình ảnh': 'Images',
    'Tổng quan': 'Overview',
    'Yêu thích': 'Favorites',
    'Dùng gần đây': 'Recently used',
    'Loại asset': 'Asset type',
    'Tất cả asset': 'All assets',
    'Nguồn đã thêm': 'Added sources',
    'Chưa có thư mục nào': 'No folders yet',
    'Gỡ thư mục khỏi thư viện': 'Remove folder from library',
    'Kéo để xem tên thư mục dài': 'Drag to see long folder names',
    'Kéo để đổi bề rộng menu (hoặc dùng phím mũi tên trái/phải)':
      'Drag to resize the menu (or use the left/right arrow keys)',
    'Gỡ thư mục {ten}': 'Remove the folder {ten}',
    'Quét lại riêng thư mục {ten}': 'Rescan only the folder {ten}',
    'Bấm để xổ {n} thư mục bên trong': 'Press to expand the {n} folders inside',
    'Bấm lần nữa để thu gọn {n} thư mục': 'Press again to collapse {n} folders',
    // `{loai}` la ten loai asset da dich roi ha chu thuong (audio / images / video…)
    '{n} {loai} — cả thư mục có {tong} file mọi loại':
      '{n} {loai} — the whole folder has {tong} files of every type',

    // ─── AssetCard.tsx — the asset ───
    'Bỏ yêu thích': 'Remove from favorites',
    'Đánh dấu yêu thích': 'Add to favorites',
    'Không đọc được file': 'Could not read file',
    'Đang tạo sóng âm…': 'Building waveform…',
    'Bỏ yêu thích {ten}': 'Remove {ten} from favorites',
    'Đánh dấu yêu thích {ten}': 'Add {ten} to favorites',
    'Bấm để xem · Kéo thả vào timeline, hoặc bấm nút Import':
      'Click to preview · Drag it into the timeline, or press Import',
    'Bấm để nghe (bấm vào sóng âm để nghe từ đoạn đó) · Kéo thả vào timeline, hoặc bấm nút Import':
      'Click to listen (click the waveform to play from that point) · Drag it into the timeline, or press Import',

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
    'Dọn {n} file': 'Clean up {n} files',
    '{n} sóng âm': '{n} waveforms',
    '{n} ảnh xem trước': '{n} thumbnails',
    '{n} bản xem nhanh': '{n} proxies',
    'Đang dùng cho {n} asset': 'In use by {n} assets',
    'Đã dọn {n} file thừa': 'Cleaned up {n} leftover files',
    'Đã chuyển {n} file rác vào Thùng rác': 'Moved {n} junk files to the Recycle Bin',
    '{n} file thừa ({dungluong}) — dọn đi không mất gì':
      '{n} leftover files ({dungluong}) — cleaning them up costs nothing',
    'Chuyển {n} file rác vào Thùng rác Windows — khôi phục lại được nếu cần':
      'Move {n} junk files to the Windows Recycle Bin — you can restore them if you need to',
    'Đã chuyển {n} file vào Thùng rác — {loi} file không chuyển được (đang mở?)':
      'Moved {n} files to the Recycle Bin — {loi} files could not be moved (still open?)',
    '{n} file thừa ({dungluong}) do giải nén file zip của máy Mac — không phải nhạc/video, Premiere cũng không mở được':
      '{n} leftover files ({dungluong}) left behind by unzipping Mac archives — not audio or video, and Premiere cannot open them either',

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
    'Xoá khay {ten}': 'Delete bin {ten}',
    'Xoá brand {ten}': 'Delete brand {ten}',
    'Thêm khay vào brand {ten}': 'Add a bin to the brand {ten}',
    'Xoá khay “{ten}”? Asset gốc trên đĩa không bị xoá.':
      'Delete the bin “{ten}”? The source assets on disk are not deleted.',
    'Xoá brand “{ten}”?\n\nCác khay bên trong KHÔNG bị xoá — chúng chuyển sang mục “Khay chung”.':
      'Delete the brand “{ten}”?\n\nThe bins inside it are NOT deleted — they move to “Ungrouped bins”.',

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
    'Đã quét {n} asset': 'Scanned {n} assets',
    'Đã tạo khay: {ten}': 'Bin created: {ten}',
    'Đã tạo brand: {ten}': 'Brand created: {ten}',
    'Đã bỏ “{ten}” khỏi khay': 'Removed “{ten}” from the bin',
    'Đã gán nhãn cho {n} asset': 'Tagged {n} assets',
    'Đã quét lại {thumuc}: {n} file': 'Rescanned {thumuc}: {n} files',
    'Đã thêm {n} file từ timeline': 'Added {n} files from the timeline',
    'Đã thêm {n} file từ timeline vào khay “{khay}”':
      'Added {n} files from the timeline to the bin “{khay}”',

    // ─── lib\cep.ts — bao loi tu Premiere ───
    'Chọn thư mục asset': 'Pick an asset folder',
    'Không có phản hồi từ Premiere': 'No response from Premiere',

    // ─── services\timelineImport.ts ───
    'Không có phản hồi từ Premiere.': 'No response from Premiere.',
    'Chức năng này chỉ chạy khi panel mở trong Premiere.':
      'This only works while the panel is open inside Premiere.',
    'Chưa chọn clip nào trên timeline (hoặc clip không có file gốc).':
      'No clips selected on the timeline (or the clips have no source file).',
    'Đã đọc {n} file từ timeline': 'Read {n} files from the timeline',

    // ─── services\cacheMove.ts — doi cho luu bo nho dem ───
    'Chưa chọn thư mục.': 'No folder selected.',
    'Không truy cập được hệ thống file.': 'Could not reach the file system.',
    'Đã chuyển {n} file sang chỗ mới.': 'Moved {n} files to the new location.',
    'Đã chuyển {n} file, {loi} file không chuyển được (đang mở?).':
      'Moved {n} files, {loi} files could not be moved (still open?).',
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
