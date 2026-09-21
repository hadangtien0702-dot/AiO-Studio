/**
 * chu.ts — BẢNG DỊCH TIẾNG ANH cho AiO Auto Short Viral.
 *
 * Khoá = CHÍNH CÂU TIẾNG VIỆT trong mã nguồn (App.tsx, ui/*, lib/cep.ts,
 * services/*). Không có trong bảng thì trả lại nguyên văn → quên dịch chỉ làm
 * hiện tiếng Việt, không làm vỡ giao diện. Xem giải thích ở `ngonngu.tsx`.
 *
 * Từ vựng bám theo giao diện tiếng Anh của Premiere (sequence, marker, clip,
 * In/Out, Timeline, playhead, Source Monitor) — anh Tiến 13/08: *"anh không
 * giỏi tiếng Anh đâu em"*, nên lấy Premiere làm thước ngoài, không lấy cảm nhận.
 *
 * ☠️ SỐ NHIỀU: tiếng Việt không chia số nhiều, tiếng Anh thì có ("1 sequences"
 * là lỗi lộ ngay). Câu có đếm `{n}` mà n hay bằng 1 thì bản EN để con số ở
 * dạng "Tên: {n}" hoặc "(…{n})" — đúng với mọi n, khỏi phải tách khoá.
 *
 * ☠️ Khoá phải khớp TỪNG KÝ TỰ với câu trong mã: gạch ngang dài (—), gạch nối
 * (–), ngoặc kép cong (“ ”), dấu cách thừa ở đầu/cuối (' và ', 'Không đọc được
 * thư mục ') và cả `\n` cuối câu. Lệch một ký tự là bản EN hiện tiếng Việt.
 * Kiểm bằng script quét khoá (báo cáo phần giao diện 19/09): khoá nào gọi
 * `dich()`/`dp()` mà thiếu ở đây, và `{x}` hai bên có khớp không.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    // ── Thanh trên + nguồn ────────────────────────────────────────────────
    'Đang mở ngoài Premiere': 'Opened outside Premiere',
    'Sequence panel đang làm việc': 'Sequence the panel works on',
    '(chưa mở sequence)': '(no sequence open)',
    '(ngoài Premiere)': '(outside Premiere)',
    'Chưa có sequence nào đang mở.': 'No sequence is open.',
    'Clip đang chọn:': 'Selected clips:',
    'Vùng In/Out:': 'In/Out range:',
    'Chọn clip trên timeline, hoặc khoanh vùng bằng phím': 'Select clips on the timeline, or mark a range with',
    'Vùng đã đổi — đọc lại': 'Range changed — read again',
    'Đọc lại sẽ bỏ {n} lần sửa khối — bấm lần nữa để đọc lại':
      'Reading again discards your block edits ({n}) — click again to confirm',

    // ── Trước khi đọc ─────────────────────────────────────────────────────
    'Máy nghe vùng đang chọn rồi chia thành từng khối hỏi–đáp. Gộp, tách, bỏ khối xong thì đặt marker hoặc tạo sequence mới.':
      'Listens to the selected range and splits it into question–answer blocks. Merge, split or drop blocks, then place markers or create new sequences.',
    'Đọc nội dung': 'Read content',
    'Panel này chỉ chạy bên trong Premiere.': 'This panel only works inside Premiere.',
    'Kiểm lại': 'Check again',
    'Chỉ chạy trong Premiere': 'Only works inside Premiere',
    'Thử ngoài Premiere': 'Test outside Premiere',
    'Chế độ thử ngoài Premiere — đọc từ file đệm, các nút ghi vào Premiere không chạy.':
      'Test mode outside Premiere — reading from a cache file; buttons that write to Premiere do nothing.',
    'Không đọc được file đệm thử: {e}': 'Could not read the test cache file: {e}',
    'File đệm thử không đúng định dạng.': 'The test cache file has the wrong format.',

    // ── Đang chạy ─────────────────────────────────────────────────────────
    'Đang xử lý': 'Processing',
    'Đang dừng…': 'Stopping…',
    'Dừng': 'Stop',

    // ── Lỗi lúc đọc (App) ─────────────────────────────────────────────────
    'Trong vùng không có clip nào để đọc — chọn clip hoặc khoanh In/Out rồi thử lại.':
      'No clips to read in this range — select a clip or set In/Out, then try again.',
    'Trong vùng có {n} đoạn đã đổi tốc độ. Panel chưa quy đổi được thời gian cho clip đổi tốc độ — trả về 100% rồi đọc lại.':
      'Speed-changed segments in the range: {n}. The panel cannot map time on speed-changed clips yet — set them back to 100% and read again.',
    'Không có clip nào nghe được trong vùng.': 'No clips with audio to listen to in this range.',
    'Premiere không làm được việc này.': 'Premiere could not do this.',
    'Có lỗi không rõ nguyên nhân.': 'Something went wrong (cause unknown).',

    // ── Sau khi đọc: ghi chú ──────────────────────────────────────────────
    'Nội dung lấy từ bản nghe cũ của Autocut (luôn nghe tiếng Việt). Video không phải tiếng Việt thì bấm Nghe lại.':
      'This transcript comes from an older Autocut cache (always Vietnamese). If the video is not in Vietnamese, click Listen again.',
    'Nghe lại': 'Listen again',
    'Nghe lại sẽ bỏ {n} lần sửa khối — bấm lần nữa để nghe lại.':
      'Listening again discards your block edits ({n}) — click again to confirm.',
    'Bỏ qua {n} clip chồng thời gian với phần đang đọc (cam phụ, B-roll, nhạc, mic rời, logo) — không đọc và không đưa vào sequence mới.':
      'Skipped clips overlapping the part being read (extra cameras, B-roll, music, separate mics, logos): {n} — not read and not included in new sequences.',
    '{n} clip đang tắt — không đọc.': 'Disabled clips not read: {n}.',
    '{n} clip không có file gốc (title, sequence lồng, multicam) — không đọc.':
      'Clips without a source file (titles, nested or multicam sequences) not read: {n}.',
    'nhiều': 'many',

    // ── Tìm + thẻ ─────────────────────────────────────────────────────────
    'Tìm chữ (không cần gõ dấu)': 'Search text',
    'Tìm chữ trong lời': 'Search the transcript',
    '{n} khối': 'Blocks: {n}',
    '{n} câu': 'Sentences: {n}',
    'Xoá ô tìm': 'Clear search',
    'Cách xem': 'View',
    'Khối hỏi–đáp': 'Q&A blocks',
    'Toàn bộ lời': 'Full transcript',
    'Hoàn tác': 'Undo',
    'Hoàn tác ({n}) — Ctrl+Z': 'Undo ({n}) — Ctrl+Z',
    'Chưa có gì để hoàn tác': 'Nothing to undo',

    // ── Thẻ khối ──────────────────────────────────────────────────────────
    'Mở đầu': 'Intro',
    '(chưa có tên)': '(untitled)',
    'Chọn khối {n}': 'Select block {n}',
    'Khối đã bỏ — lấy lại mới chọn được': 'Dropped block — restore it to select',
    'Nhảy tới đầu khối': 'Jump to block start',
    'Độ dài khối': 'Block length',
    'Thao tác khối': 'Block actions',
    'Tên khối': 'Block name',
    'Bấm: nhảy tới đầu khối · Bấm đúp: đổi tên': 'Click: jump to block start · Double-click: rename',
    'Đổi tên khối': 'Rename block',
    'Không đặt marker, không tạo sequence cho khối này': 'No marker and no sequence for this block',
    'Đã bỏ': 'Dropped',
    '{n} câu khớp': 'Matches: {n}',
    'Không có khối nào chứa chữ này.': 'No block contains this text.',
    'Không nghe ra lời nào trong vùng này.': 'No speech was heard in this range.',
    'Dài': 'Long',
    'Dài hơn 3 phút — nên xem lại, máy không tự chia nhỏ': 'Longer than 3 minutes — worth reviewing; it is not split automatically',
    'Ranh giới cần nghe': 'Check boundary',
    'Câu hỏi bắt đầu giữa một câu — mốc lấy theo từ, chưa nghe kiểm':
      'The question starts mid-sentence — the cut point is word-based and has not been checked by ear',
    'Không rõ đầu câu hỏi': 'Unclear question start',
    'Không tìm ra chỗ câu hỏi bắt đầu — mốc đầu có thể lệch': 'Could not find where the question starts — the start point may be off',
    'Phần trước câu hỏi đầu tiên': 'Everything before the first question',
    'Đã sửa tay': 'Edited',
    'Khối này đã được gộp, tách hoặc đổi tên bằng tay': 'This block was merged, split or renamed by hand',

    // ── Dòng câu ──────────────────────────────────────────────────────────
    'Không có câu nào khớp.': 'No matching sentences.',
    'Máy nghe ra: “{c}” — thường là chữ máy tự bịa': 'Heard: “{c}” — usually text the model made up',
    'không nghe rõ': 'unclear',
    'Máy nghe không chắc câu này — nên nghe lại': 'Low confidence on this sentence — worth listening to',
    'Tách tại đây': 'Split here',

    // ── Menu khối ─────────────────────────────────────────────────────────
    'Đây là khối đầu tiên': 'This is the first block',
    'Gộp với khối trên': 'Merge with block above',
    'Lấy lại khối': 'Restore block',
    'Bỏ khối': 'Drop block',

    // ── Phím tắt ──────────────────────────────────────────────────────────
    'chọn khối': 'move between blocks',
    'nhảy tới': 'jump to',
    'gộp với khối trên': 'merge with block above',
    'tích chọn': 'select',
    'hoàn tác': 'undo',
    // Dòng phím tắt của tab "Toàn bộ lời" (thêm 21/09): Shift+bấm và Esc không có
    // đường nào khác để người dùng biết chúng tồn tại.
    'Bấm': 'Click',
    'nhảy tới câu': 'jump to a sentence',
    'bấm': 'click',
    'chọn cả khoảng': 'select the whole range',
    'bỏ chọn': 'deselect',
    'xem từng từ': 'show every word',

    // ── Pill chọn / bỏ chọn tất cả (đầu danh sách khối, 21/09) ────────────
    // Con số nằm trong ngoặc nên đúng với mọi n — khỏi tách khoá số ít/số nhiều.
    'Chọn tất cả ({n})': 'Select all ({n})',
    'Chọn tất cả ({a}/{n})': 'Select all ({a}/{n})',
    'Bỏ chọn ({n})': 'Deselect all ({n})',
    'Chọn tất cả khối đang hiện': 'Select every block shown',
    'Bỏ chọn tất cả khối đang hiện': 'Deselect every block shown',

    // ── Thanh hành động ───────────────────────────────────────────────────
    'Đóng': 'Close',
    'Đã chọn {n} khối': 'Selected: {n}',
    'Bỏ chọn': 'Deselect all',
    'Chọn hết': 'Select all',
    'Tạo sequence': 'Create sequences',
    'Tạo {n} sequence': 'Create sequences ({n})',
    'Gộp vào 1 sequence': 'Combine into 1 sequence',
    'Đã tạo {n} sequence': 'Sequences created: {n}',
    'Đặt marker': 'Place markers',
    'Đặt {n} marker': 'Place markers ({n})',
    'Đã đặt {n} marker': 'Markers placed: {n}',
    'Đặt marker ở đầu mỗi khối đã chọn. Marker cũ do panel đặt (tên bắt đầu “SV ”) được thay mới; marker khác giữ nguyên.':
      'Places a marker at the start of each selected block. Old panel markers (names starting with “SV ”) are replaced; other markers stay.',
    'Chọn cách tạo sequence': 'Choose how to create sequences',
    'Mỗi khối một sequence': 'One sequence per block',
    'Mỗi khối thành một sequence riêng, đặt tên theo câu hỏi': 'Each block becomes its own sequence, named after its question',
    'Gộp vào một sequence': 'Combine into one sequence',
    'Các khối đã chọn nối liền nhau trong một sequence mới': 'The selected blocks are joined back to back in one new sequence',

    // ── Đang dựng sequence: dòng đếm + dòng kết quả (21/09) ───────────────
    // Dòng đếm THAY chữ "Đang xử lý…" trên thanh tiến độ, nên phải ngắn: đo ở khổ
    // 300 px chỉ còn 158–176 px cho chữ. VI 138 px · EN 131 px — vừa, còn
    // "Creating sequence 12/12…" 167 px thì tràn khi đồng hồ sang giờ.
    'Đang đưa khối {i}/{n}': 'Adding block {i}/{n}',
    // Số nhiều: để con số sau dấu hai chấm thì đúng với cả n = 1.
    'Đã đưa {n} khối vào 1 sequence mới · {t}': 'Blocks added to 1 new sequence: {n} · {t}',
    'Đã tạo {n} sequence · {t}': 'Sequences created: {n} · {t}',

    // ── Kết quả tạo sequence / marker ─────────────────────────────────────
    'Các khối đã chọn không có media nằm trong vùng.': 'The selected blocks have no media inside the range.',
    'Premiere không tạo được sequence.': 'Premiere could not create the sequence.',
    'Chưa tạo được sequence gộp. Lỗi ở {k}: {l}': 'Could not create the combined sequence. Failed at {k}: {l}',
    'Sequence gộp mới có {x}/{n} khối. Lỗi ở {k}: {l}': 'The combined sequence has only {x}/{n} blocks. Failed at {k}: {l}',
    'Sequence gộp mới có {x}/{n} khối — khối {k} đã vào nhưng cần kiểm: {l}':
      'The combined sequence has {x}/{n} blocks — block {k} went in but needs checking: {l}',
    'Đã tạo {x}/{n} sequence. Sequence của {k} đã tạo nhưng cần kiểm: {l}':
      'Created {x}/{n} sequences. The sequence for {k} was created but needs checking: {l}',
    'Đã tạo {x}/{n} sequence. Dừng ở {k}: {l}': 'Created {x}/{n} sequences. Stopped at {k}: {l}',
    'Đã dừng — sequence gộp mới có {x}/{n} khối.': 'Stopped — the combined sequence has {x}/{n} blocks.',
    'Đã dừng — tạo được {x}/{n} sequence.': 'Stopped — created {x}/{n} sequences.',
    'Bỏ qua {n} khối không có media nằm trong vùng.': 'Skipped blocks with no media in the range: {n}.',
    'Đã thay {n} marker cũ của panel.': 'Replaced old panel markers: {n}.',
    'Không đếm được marker trên sequence này — chưa xoá gì.': 'Could not count the markers on this sequence — nothing was deleted.',
    'Không đếm được marker trên sequence này — chưa đặt gì.': 'Could not count the markers on this sequence — nothing was placed.',
    'Đặt {a} marker và thay {b} marker cũ của panel? Marker khác trên sequence giữ nguyên.':
      "Place new markers ({a}) and replace the panel's old markers ({b})? Other markers on the sequence stay.",
    'Đặt và thay': 'Place and replace',
    '{n} marker chỉ đặt được dạng điểm (Premiere không nhận độ dài).':
      'Markers placed as points only (Premiere did not accept a duration): {n}.',
    // Câu này dùng chung cho CẢ HAI nguồn chọn (khối ở tab thẻ · vùng câu ở tab
    // "Toàn bộ lời") nên KHÔNG được nhắc chữ "khối" — sửa 21/09 sau soát.
    'Marker nằm lệch {x} giây so với mốc đầu đã chọn — kiểm tra lại trên Timeline.':
      'Markers are off by {x} s from the selected start — check them in the Timeline.',
    'Premiere chưa quay lại được sequence gốc — Timeline đang mở sequence vừa tạo.':
      'Premiere could not switch back to the source sequence — the Timeline is showing the new sequence.',
    'Sequence này không còn marker nào do panel đặt.': 'This sequence has no markers placed by the panel.',
    'Đã xoá {a}/{b} marker.': 'Deleted {a}/{b} markers.',
    'Xoá {n} marker panel đã đặt': 'Delete panel markers ({n})',
    'Xoá marker': 'Delete markers',
    'Xoá {n} marker do panel đặt (tên bắt đầu bằng “SV ”)? Marker khác trên sequence giữ nguyên.':
      'Delete the markers placed by the panel ({n}, names starting with “SV ”)? Other markers on the sequence stay.',
    'Thôi': 'Cancel',
    'Xoá {n} marker': 'Delete markers ({n})',

    // ── Tab "Toàn bộ lời": số liệu · từng từ · vùng câu · chép / xuất ─────
    // (thêm 21/09 — anh Tiến: "khi full scripts em phải đọc và show ra details")
    //
    // ☠️ Khoá `,` là DẤU THẬP PHÂN (xem `soLe` trong ui/chung.tsx): tiếng Việt
    // viết 0,87 — tiếng Anh viết 0.87. Bỏ dòng này là bản EN hiện "0,87", người
    // đọc tiếng Anh hiểu thành dấu ngăn nghìn, tức 87 lần con số thật.
    ',': '.',
    '{x} s': '{x}s',
    'Tổng số câu máy nghe ra trong vùng': 'Total sentences heard in this range',
    'nói {t}': 'speech {t}',
    'Tổng thời lượng có người nói (đã trừ khoảng lặng và câu máy tự bịa)':
      'Total time with someone speaking (silence and made-up sentences excluded)',
    'không chắc {a}/{b}': 'unsure {a}/{b}',
    'Câu có từ nửa số từ trở lên bị máy chấm tin cậy dưới 0,5 — nên nghe lại. Không tính câu máy tự bịa.':
      'Sentences where at least half the words score below 0.5 — worth a listen. Made-up sentences are not counted.',
    'bịa {a}/{b}': 'made up {a}/{b}',
    'Câu máy tự bịa (chuỗi lặp, câu mời đăng ký kênh) — hiện là “không nghe rõ”, không xuất ra file':
      'Sentences the model made up (repeat loops, “subscribe” lines) — shown as “unclear” and left out of exports',
    'Xem từng từ': 'Show every word',
    'Xem từng từ kèm mốc giờ và điểm tin cậy': 'Show every word with its timecode and confidence score',
    'Câu này mở đầu một khối hỏi–đáp': 'This sentence starts a Q&A block',
    'Độ dài câu': 'Sentence length',
    'Nhảy tới {m} — điểm tin cậy {p}': 'Jump to {m} — confidence {p}',
    'Bản nghe này không có mốc từng từ.': 'This transcript has no per-word timecodes.',
    'Vùng chọn gồm {n} câu liền nhau, trong đó {m} câu không khớp ô tìm nên đang bị ẩn.':
      'The selection covers {n} consecutive sentences; {m} of them do not match the search and are hidden.',
    'Đang chọn {n} khối, trong đó {m} khối không khớp ô tìm nên đang bị ẩn — nút tạo sequence vẫn dựng cả {n}.':
      'Selected blocks: {n}; {m} of them do not match the search and are hidden — the create button still builds all {n}.',
    'Đã chọn {n} câu': 'Selected sentences: {n}',
    'Tạo 1 sequence': 'Create 1 sequence',
    'Đặt 1 marker': 'Place 1 marker',
    'Đặt một marker phủ vùng câu đã chọn. Marker cũ do panel đặt (tên bắt đầu “SV ”) được thay mới; marker khác giữ nguyên.':
      'Places one marker spanning the selected sentences. Old panel markers (names starting with “SV ”) are replaced; other markers stay.',
    'Vùng câu đã chọn không có media nằm trong vùng.': 'The selected sentences have no media inside the range.',
    '{n} câu · {t}': 'sentences: {n} · {t}',

    // Chép
    'Chép câu này': 'Copy this sentence',
    'Chép cả bài': 'Copy all',
    'Chép {n} câu': 'Copy selection ({n})',
    'Đã chép {n} câu': 'Copied: {n}',
    'Chép phần đang chọn vào bộ nhớ tạm': 'Copy the selection to the clipboard',
    'Chép cả bài vào bộ nhớ tạm': 'Copy the whole transcript to the clipboard',
    'Câu này là chữ máy tự bịa — không chép.': 'This sentence is text the model made up — nothing copied.',
    'Không có câu nào để chép — chỗ này chỉ có chữ máy tự bịa.':
      'Nothing to copy — this part only contains text the model made up.',
    'Không có chữ nào để chép.': 'There is no text to copy.',
    'Không chép được vào bộ nhớ tạm. Bấm vào một câu, chọn chữ rồi nhấn Ctrl+C.':
      'Could not copy to the clipboard. Click a sentence, select the text and press Ctrl+C.',

    // Xuất file
    '.txt': '.txt',
    '.srt': '.srt',
    'Xuất phần đang chọn ra file chữ, lưu cạnh video': 'Export the selection as a text file, saved next to the video',
    'Xuất cả bài ra file chữ, lưu cạnh video': 'Export the whole transcript as a text file, saved next to the video',
    'Xuất phần đang chọn ra file phụ đề, lưu cạnh video':
      'Export the selection as a subtitle file, saved next to the video',
    'Xuất cả bài ra file phụ đề, lưu cạnh video':
      'Export the whole transcript as a subtitle file, saved next to the video',
    'Không có câu nào để xuất — chỗ này chỉ có chữ máy tự bịa.':
      'Nothing to export — this part only contains text the model made up.',
    'Đã xuất {n} câu: {f}': 'Exported sentences: {n} — {f}',
    'Đã tải về {f} ({n} câu).': 'Downloaded {f} (sentences: {n}).',
    '{n} byte': '{n} bytes',
    'Bỏ {n} câu máy tự bịa.': 'Made-up sentences left out: {n}.',
    '{n} câu có mốc cuối hụt, đã kéo dài thêm 1 mili-giây.':
      'Sentences whose end time was missing and got 1 ms added: {n}.',
    '{n} chỗ hai câu đè mốc nhau — mở file ra soát lại.':
      'Places where two sentences overlap in time: {n} — open the file and check.',
    'Không biết file gốc nằm ở đâu để lưu cạnh — chưa xuất được.':
      'The panel does not know where the source file is, so it cannot save next to it — nothing exported.',
    'Cạnh video đã có file cùng tên nên panel thêm số vào tên mới, không ghi đè file cũ.':
      'A file with that name already sits next to the video, so the panel added a number instead of overwriting it.',
    'Cạnh video đã có quá nhiều file cùng tên — dọn bớt rồi xuất lại.':
      'Too many files with that name already sit next to the video — clean some up and export again.',
    'Panel không dùng được Node.js — chưa ghi được file.':
      'Node.js is not available in the panel — the file could not be written.',
    // Mốc trong file .srt là giây trên SEQUENCE, mà file nằm cạnh video và mang
    // tên video — phải nói ra, không thì người mở file tưởng khớp với video gốc.
    'Mốc trong file tính theo SEQUENCE — đối chiếu trên Timeline, đừng kéo thẳng vào video gốc.':
      'Timecodes in this file follow the SEQUENCE — check them in the Timeline, do not drop the file onto the source video.',
    // Lỗi ghi file đã dịch (thêm 21/09): trước đó lỗi Node thô ("EPERM: operation
    // not permitted, open 'E:\\…'") đi thẳng ra màn hình — xem `loiGhi` ở luuRa.ts.
    'Không ghi được cạnh video — thư mục chỉ cho đọc, hoặc file đang bị khoá. Mở quyền ghi rồi xuất lại.':
      'Could not write next to the video — the folder is read-only or the file is locked. Grant write access and export again.',
    'Ổ đĩa đã đầy — chưa ghi được file.': 'The drive is full — the file could not be written.',
    'Không tìm thấy thư mục của file gốc — ổ mạng rớt, hoặc file đã bị dời đi.':
      "Could not find the source file's folder — a network drive dropped out, or the file was moved.",
    'File đang bị một chương trình khác giữ — đóng nó rồi xuất lại.':
      'Another program is holding the file — close it and export again.',
    'Không ghi được file cạnh video.': 'Could not write the file next to the video.',

    // ══ Chuỗi của lib/cep.ts (dichLoi) ═══════════════════════════════════
    'Chưa mở project nào trong Premiere.': 'No project is open in Premiere.',
    'Chưa chọn sequence để làm.': 'No sequence selected.',
    'Không tìm thấy sequence đang chọn — có thể nó vừa bị xoá hoặc project vừa đổi. Chọn lại sequence.':
      'Cannot find the selected sequence — it may have been deleted or the project changed. Pick the sequence again.',
    'Premiere không chuyển sang được sequence đang chọn. Bấm vào tab của sequence đó trên Timeline rồi thử lại.':
      "Premiere could not switch to the selected sequence. Click that sequence's tab in the Timeline and try again.",
    'Chưa khoanh vùng. Trên Timeline: đặt điểm vào bằng phím I, điểm ra bằng phím O, rồi bấm lại.':
      'No range set. In the Timeline, mark In with I and Out with O, then click again.',
    'Chưa chọn clip nào trên Timeline. Bấm chọn clip rồi bấm lại.': 'No clip selected in the Timeline. Select a clip, then click again.',
    'Chưa chọn clip và cũng chưa khoanh vùng. Chọn clip trên Timeline, hoặc đặt điểm vào (I) và điểm ra (O), rồi bấm lại.':
      'No clip selected and no range set. Select a clip in the Timeline, or mark In (I) and Out (O), then click again.',
    'Premiere báo đang chọn {x} mục nhưng panel không tìm ra clip đó trên Timeline. Bỏ chọn, khoanh vùng bằng I và O rồi bấm lại.':
      'Premiere reports {x} selected item(s), but the panel cannot find them in the Timeline. Deselect, mark a range with I and O, then click again.',
    'Có {x} clip nằm chồng đúng mốc với clip đang chọn nên panel không phân biệt được clip nào đang chọn. Bỏ chọn, khoanh vùng bằng I và O rồi bấm lại.':
      'Clips stacked at exactly the same position as the selection ({x}) — the panel cannot tell which one is selected. Deselect, mark a range with I and O, then click again.',
    'Chỗ đang chọn không có clip nào đọc được file gốc. Clip đang tắt, title và sequence lồng đều bị bỏ qua.':
      'The selection has no clips with a readable source file. Disabled clips, titles and nested sequences are skipped.',
    'Không có mục nào để làm.': 'Nothing to do.',
    'Timeline đã thay đổi từ lúc panel đọc nội dung. Đọc lại nội dung rồi làm tiếp.':
      'The Timeline changed since the panel read the content. Read the content again, then continue.',
    'Các đoạn lẫn cả clip hình và clip chỉ có tiếng — chưa dựng chung được một sequence.':
      'The segments mix video clips and audio-only clips — they cannot be built into one sequence yet.',
    'Có đoạn nằm trên clip không có file gốc (title, sequence lồng) nên không dựng được.':
      'Some segments sit on clips without a source file (titles, nested sequences), so they cannot be built.',
    'Sequence đích đã có clip nằm sau chỗ nối — nối thêm sẽ đè lên. Đã dừng, không đè.':
      'The target sequence already has clips after the join point — appending would overwrite them. Stopped without overwriting.',
    'Không tìm thấy sequence vừa tạo — có thể nó đã bị xoá.': 'Cannot find the sequence just created — it may have been deleted.',
    'Premiere không trả lời sau {x} giây — có thể đang mở một hộp thoại. Nhìn màn hình Premiere, đóng hộp thoại rồi thử lại.':
      'Premiere did not respond after {x} seconds — a dialog may be open. Check Premiere, close the dialog, then try again.',
    'Không có phản hồi từ Premiere': 'No response from Premiere',
    'Phần điều khiển của panel chưa nạp vào Premiere. Đóng panel rồi mở lại.':
      "The panel's script is not loaded into Premiere. Close the panel and open it again.",
    'Không nạp được phần điều khiển của panel vào Premiere. Cài lại panel.':
      "Could not load the panel's script into Premiere. Reinstall the panel.",
    'Phần chạy trong Premiere đang là bản {x}, không khớp giao diện. Tắt hẳn Premiere rồi mở lại; còn lệch thì cài lại panel.':
      'The part running inside Premiere is version {x} and does not match the panel. Quit Premiere completely and reopen it; if it still differs, reinstall the panel.',
    'Không đọc được vị trí đầu đọc.': 'Could not read the playhead position.',
    'Mốc thời gian không hợp lệ.': 'Invalid time.',
    'Premiere không cho dời đầu đọc.': 'Premiere did not allow moving the playhead.',
    'Đầu đọc không tới đúng chỗ (lệch {x} giây).': 'The playhead did not land on the exact spot (off by {x} s).',
    'Bản Premiere này thiếu chức năng panel cần.': 'This Premiere version lacks a feature the panel needs.',
    'Không xoá được marker cũ của panel.': "Could not delete the panel's old markers.",
    'Chỉ đặt được {x} marker.': 'Markers placed: only {x}.',
    'Dữ liệu gửi sang Premiere bị hỏng.': 'The data sent to Premiere was corrupted.',
    'Không đọc được điểm vào/ra gốc của clip nguồn — đã dừng để không ghi đè.':
      "Could not read the source clip's original In/Out points — stopped so nothing gets overwritten.",
    'Premiere không nhận điểm vào/ra của đoạn.': "Premiere did not accept the segment's In/Out points.",
    'Đã dựng nhưng chưa trả lại được điểm vào/ra gốc của {x} clip nguồn. Mở clip đó trong Source Monitor để kiểm tra.':
      'Built, but the original In/Out points of source clips could not be restored ({x}). Open them in the Source Monitor to check.',
    'Tạo sequence mới thất bại.': 'Creating the new sequence failed.',
    'Sequence mới không có track để đặt clip.': 'The new sequence has no track to place clips on.',
    'Không được nối vào chính sequence nguồn.': 'Cannot append into the source sequence itself.',
    'Sequence mới thiếu {x} đoạn — Premiere không nhận một số đoạn.':
      'The new sequence is missing segments ({x}) — Premiere rejected some of them.',
    'Độ dài sequence mới không khớp độ dài cần có ({x}).': "The new sequence's length does not match the expected length ({x}).",
    'Sequence mới có {x} đoạn thiếu tiếng.': 'Segments missing audio in the new sequence: {x}.',
    'Premiere báo lỗi khi chạy lệnh.': 'Premiere reported an error while running the command.',
    'Premiere trả về kết quả không đọc được.': 'Premiere returned a result that could not be read.',
    'Premiere báo lỗi chưa rõ nguyên nhân.': 'Premiere reported an error with no known cause.',

    // ══ Chuỗi của services/ (nghe, whisper, ffmpeg, moc) ═════════════════
    'Đã dừng.': 'Stopped.',
    'Không dùng được Node.js trong panel': 'Node.js is not available in the panel',
    'Không dùng được child_process.execFile': 'child_process.execFile is not available',
    'Không chạy được bộ xử lý media. Cài lại panel hoặc khởi động lại máy.':
      "The panel's media tools could not start. Reinstall the panel or restart the computer.",
    'Bản nghe của "{f}" bị lệch: câu có {a} từ nhưng có {b} mốc từ. Bấm Nghe lại để nghe lại file này.':
      'The transcript of "{f}" is out of sync: the sentences have {a} words but there are {b} word timestamps. Click Listen again to re-listen to this file.',
    'Panel không dùng được Node.js — không gọi được bộ xử lý media.':
      'Node.js is not available in the panel — the media tools cannot be started.',
    'Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.':
      "The panel's media tools are missing — reinstall the latest version.",
    'Chưa cài bộ nghe hiểu nên chưa đọc được nội dung.\n':
      'The speech recognizer is not installed, so the content cannot be read yet.\n',
    'Không thấy file gốc trên đĩa (có thể đã bị dời, đổi tên hoặc ổ chưa cắm):\n':
      'Source file not found on disk (it may have been moved or renamed, or the drive is not connected):\n',
    'Panel không dùng được Node.js.': 'Node.js is not available in the panel.',
    'Không xác định được thư mục cài đặt của bộ nghe hiểu.': "Could not determine the speech recognizer's install folder.",
    'bộ nghe hiểu': 'the speech recognizer',
    'dữ liệu nghe hiểu (khoảng 1,5 GB)': 'the speech model data (about 1.5 GB)',
    'Không đọc được thư mục ': 'Could not read the folder ',
    'Chưa có {x} trong:\n': 'Missing {x} in:\n',
    ' và ': ' and ',
    'Panel không dùng được Node.js': 'Node.js is not available in the panel',
    'Không đọc được tiếng của file này:\n': 'Could not read the audio of this file:\n',
    'Bộ nghe hiểu chạy xong nhưng không có kết quả. Thử lại, hoặc khởi động lại máy nếu vẫn lỗi.':
      'The speech recognizer finished without a result. Try again, or restart the computer if it keeps failing.',
    'Không đọc được kết quả nghe hiểu (dữ liệu hỏng)': 'Could not read the recognition result (corrupted data)',
  },
}
