/**
 * chu.ts — BANG DICH TIENG ANH cho AiO Autocut.
 *
 * Khoa = CHINH CAU TIENG VIET trong ma nguon. Khong co trong bang thi tra lai
 * nguyen van cau do -> quen dich mot cau chi lam no hien tieng Viet, khong lam
 * vo giao dien. Xem giai thich day du o `ngonngu.tsx`.
 *
 * Sinh tu do that ngay 13/08/2026: 254 chuoi -> loc rac con 223 -> doc tay
 * tung dong, bo them ~40 manh ma nguon lot luoi -> con 183 chuoi that.
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
 *   khoanh vung I/O   -> in/out points        (KHONG "marked area")
 *   nhat cat          -> cut                  (KHONG "cutting point")
 *   don clip          -> ripple delete        (KHONG "push clips together")
 *   dai song          -> waveform
 *   cho can soat      -> marker
 *   phu de            -> captions             (KHONG "subtitles" — Premiere
 *                                              goi track do la Captions)
 *   sequence moi      -> new sequence
 *   khoang lang       -> silence
 *   clip / timeline / track / project  -> giu nguyen, la tu nghe
 *
 * Gap tu chua co trong bang tren: tra trong giao dien Premiere truoc, dung
 * tu dat. Neu Premiere khong co khai niem do thi moi dat, va ghi them mot
 * dong vao bang tren de lan sau khong dich kieu khac.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ BA MUC CAT: LUAT 13/08 DA HET HIEU LUC — NAY CO DICH
 * ══════════════════════════════════════════════════════════════════════════
 * Cho nay TRUOC ghi: *"`Giu nhip` · `Vua` · `Cat sach` la TEN THUONG HIEU,
 * anh Tien chot 13/08 giu nguyen o ca hai thu tieng. Khong co trong bang =
 * tra lai nguyen van. DUNG 'dich cho du'."*
 *
 * ANH TIEN DAO NGUOC 19/08, sau khi tu mo ban EN ra nhin:
 * *"phan chuyen doi giua tieng Anh va tieng Viet no dang bi con giu 3 chu
 * tieng Viet ne em"* — tuc anh doc ba chu do la LOI, khong phai thuong hieu.
 * Anh chon bo chu **Light · Medium · Aggressive** (kieu dat ten cac tool tu
 * dong hay dung; khach quen AutoCut/Descript doc la hieu ngay).
 *
 * => Ba khoa do NAY NAM TRONG BANG (xem muc 'Giu nhip' ben duoi).
 *
 * ☠️ VA MOT BAI HOC VE THUOC DO, ghi ngay day de khong lap lai:
 * Sau khi dich ba muc, toi bao "ban EN chi con DUNG MOT chuoi tieng Viet".
 * SAI. Thuoc do cua toi loc `e.childElementCount === 0` de lay the la — ma
 * nhan "Se cat · N doan" nam trong <span> co <i> ben trong, nen bi bo qua.
 * Anh Tien chup man hinh chi ra. Quet lai bang TEXT NODE (khong loc theo the)
 * thi ra **5 chuoi**: ten project (2 cho, hop le) · "Se cat ·" · "doan" ·
 * tooltip nut ngon ngu (CO Y — noi bang thu tieng SE DOI SANG, xem `ngonngu.tsx`).
 * => Con so "mot chuoi" truoc do la con so cua THUOC DO HONG, khong phai su that.
 *
 * Bai hoc de lai: "giu nguyen lam thuong hieu" chi dung khi NGUOI DUNG doc no
 * ra thuong hieu. Anh Tien la nguoi Viet ma con thay chuong mat, thi editor
 * nuoc ngoai cang khong doc ra y do.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    // ─── Khoi tien trinh (13/08: giau quy trinh, chi con mot chu) ───
    'Đang xử lý': 'Loading',

    // ─── Don vi thoi gian (13/08: do tren panel that thay '7 phut 39 giay' con tieng Viet) ───
    'phút': 'min',
    'giây': 'sec',

    // ─── App.tsx — nhan va o nhap ───
    'Hình': 'Video',
    'Tiếng': 'Audio',
    'Chừa': 'Padding',
    'Mức cắt': 'Cut level',
    'Còn lại': 'Remaining',
    'Giữ lại': 'Keep',
    'giữ lại': 'kept',
    'Kết quả': 'Result',
    // Nhan chu thich o khoi Xem truoc — anh Tien bat 19/08: ban EN van hien
    // "Se cat · 0 doan". Thuoc do cu cua toi bo sot vi loc `childElementCount===0`,
    // ma the nay co <i> ben trong. Nay quet bang TEXT NODE, khong loc theo the.
    'Sẽ cắt': 'Will cut',
    'Cắt': 'Cut',
    'khoảng lặng': 'silences',
    'đoạn': 'segments',
    'Vùng chọn đã đổi — bấm lại để phân tích vùng mới.':
      'The selected range changed — press again to analyse the new range.',
    'Chưa chạy — bấm nút ở trên.': 'Not run yet — press the button above.',
    // Ba mức cắt — anh Tiến chốt 19/08, đảo quyết định 14/08 ("giữ nguyên
    // tiếng Việt làm thương hiệu"). Bộ chữ theo kiểu các tool tự động.
    'Giữ nhịp': 'Light',
    'Vừa': 'Medium',
    'Cắt sạch': 'Aggressive',
    'Yêu cầu': 'Requested',
    'chạy mất': 'took',
    'Chạy mất': 'Took',
    'Nhát cắt': 'Cuts',
    'Rút ngắn': 'Shortened',
    'chỉnh tay': 'manual',
    'Thời lượng': 'Duration',
    'Tham số đo': 'Analysis settings',
    'chưa khoanh': 'no in/out points',
    'Đoạn sẽ cắt': 'Segments to cut',
    'Ước còn lại': 'Estimated remaining',
    'Cắt tại chỗ': 'Cut in place',
    'câu đã chép': 'lines transcribed',
    'Lỗi khi đặt': 'Error while placing',
    'Sequence mới': 'New sequence',
    'quanh chỗ đó': 'around that point',
    'chỗ cần soát': 'markers to review',
    'Mức đang chọn': 'Selected level',
    'To hơn nền ồn': 'Above noise floor',
    'Đoạn đang chọn': 'Selected range',
    'Cách phân tích': 'Analysis method',
    'Nơi đặt kết quả': 'Where to put the result',
    'Cắt khoảng lặng': 'Cut silences',
    'Chờ anh chọn mức': 'Waiting for you to pick a level',
    'chỗ cần nghe lại': 'markers to review',
    'Dựng sequence mới': 'Build new sequence',
    'Xem trước kết quả': 'Preview result',
    'Chi tiết kỹ thuật': 'Technical details',
    'Thông số sequence': 'Sequence settings',
    'Chỗ máy không chắc': 'Where the tool is unsure',
    'Đổi vùng bằng phím': 'Change range with',
    'Bản gốc còn nguyên': 'Original untouched',
    'trên timeline — bấm': 'on the timeline — press',
    'Khoanh vùng đang nói': 'Mark the speaking range',
    'chép từ sequence gốc': 'copied from the source sequence',
    'Biên trên nền ồn (dB)': 'Margin above noise floor (dB)',
    'nguyên, không tự cắt.': 'as is — nothing is cut automatically.',
    ' · không phải nghe lại': ' · no re-listening needed',
    'KHÔNG có tiếng trên A1': 'NO audio on A1',
    'Sửa thẳng sequence này': 'Edit this sequence directly',
    ' · đã lọc dải giọng nói': ' · speech band filtered',
    'Chừa chỗ anh bấm Giữ lại': 'Keeps the parts you marked as Keep',
    'Không có đoạn nào để cắt': 'No segments to cut',
    'đo biên độ trên file gốc': 'measure levels on the original file',
    'chỗ đang giữ, sẽ không cắt': 'kept segments will not be cut',
    'Đệm giữ lại hai đầu (giây)': 'Padding at both ends (seconds)',
    'chỗ vì có câu nói trong đó': 'kept because speech was found there',
    'Dùng lại kết quả nghe đã có': 'Reuse existing transcription',
    'Chỉ dùng khi TẮT nghe hiểu.': 'Only used when transcription is OFF.',
    ' · đánh dấu chỗ cần nghe lại': ' · mark points to review',
    'Khoảng lặng tối thiểu (giây)': 'Minimum silence length (seconds)',
    'im lặng. Sát quá thì cụt hơi.': 'of silence. Too tight and it clips the breath.',
    'Sequence về như trước khi cắt.': 'Sequence restored to before the cut.',
    'Ngưỡng im lặng (dB) — dự phòng': 'Silence threshold (dB) — fallback',
    'Dựng lại sequence như trước khi cắt': 'Restore the sequence to before the cut',
    'Phụ đề đã gắn lên sequence đang mở.': 'Captions added to the open sequence.',
    'Không câu nào rơi vào phần đã giữ lại.': 'No speech falls inside the kept parts.',
    'để đi tới từng chỗ máy nghe không chắc.': 'to jump to each uncertain point.',
    'không đọc được WAV — dùng ngưỡng đặt sẵn': 'could not read the WAV — using the preset threshold',
    'trên timeline để đi tới từng chỗ. Máy đã': 'on the timeline to jump between them. The tool',
    'ở hai đầu mỗi khoảng lặng, nên mỗi mối nối còn lại':
      'at both ends of each silence, so every join still has',
    'bỏ chỗ im trên 0,3s · chừa 0,10s hai đầu — cân bằng':
      'removes silence over 0.3s · 0.10s padding both ends — balanced',
    'KHÔNG chạy trong Premiere (đang mở bằng trình duyệt)':
      'NOT running inside Premiere (opened in a browser)',
    '— nghe có tiếng nhưng không ra chữ, GIỮ lại và đánh dấu':
      '— sound detected but no words, KEPT and marked',
    'bỏ mọi chỗ im trên 0,2s · chừa 0,06s — sát nhất, nhịp dồn':
      'removes every silence over 0.2s · 0.06s padding — tightest, fastest pace',
    'chỉ bỏ chỗ im trên 0,6s · chừa 0,15s hai đầu — thong thả nhất':
      'only removes silence over 0.6s · 0.15s padding both ends — most relaxed',

    // ─── App.tsx — buoc chay ───
    'Đo mức âm': 'Measure levels',
    'Đo biên độ': 'Measure amplitude',
    'Tính điểm cắt': 'Compute cut points',
    'Dò khoảng lặng': 'Detect silences',
    'Đang đo mức âm': 'Measuring levels',
    'Đang dựng lại…': 'Rebuilding…',
    '↩ Hoàn tác cắt': '↩ Undo cut',
    '(đang kiểm tra…)': '(checking…)',
    'Đọc vùng đã khoanh': 'Read the marked range',
    'Đo mức âm của file': 'Measure the file levels',
    'Đang tính điểm cắt': 'Computing cut points',
    'Nghe hiểu tiếng Việt': 'Speech recognition',
    'Tách tiếng khỏi video': 'Extract audio from video',
    'Đang đọc vùng đã khoanh…': 'Reading the marked range…',
    'Đang tách tiếng khỏi video': 'Extracting audio from video',
    'Nghe hiểu tiếng Việt (GPU)': 'Speech recognition (GPU)',
    'Đang quy đổi mốc thời gian…': 'Converting timecodes…',
    'Đang gắn phụ đề lên timeline…': 'Adding captions to the timeline…',

    // ─── App.tsx — bao loi ───
    'Dựng thất bại': 'Build failed',
    'Cắt đồng bộ thất bại': 'Synced cut failed',
    'Không nạp được host.': 'Could not load the host script.',
    'Không đọc được vùng đã khoanh': 'Could not read the marked range',
    'Panel không dùng được Node.js': 'The panel cannot use Node.js',
    'Dựng thất bại — không có lô nào chạy': 'Build failed — no batch ran',
    'Không nạp được host/index.jsx từ thư mục extension.':
      'Could not load host/index.jsx from the extension folder.',
    'Panel không dùng được Node.js — không gọi được bộ xử lý media.':
      'The panel cannot use Node.js — the media processor is unreachable.',
    'Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.':
      'The panel is missing its media component — reinstall the latest build.',
    'Không còn đoạn nào để giữ — chọn mức nhẹ tay hơn rồi chạy lại.':
      'Nothing left to keep — pick a gentler level and run again.',
    'Dựng xong nhưng số đo không khớp — xem phần đối chiếu bên dưới.':
      'Build finished but the numbers do not match — see the comparison below.',
    'Chưa cài bộ nghe hiểu nên chưa cắt được. Autocut bắt buộc phải có nó: ':
      'Speech recognition is not installed, so nothing can be cut. Autocut requires it: ',
    'Không nghe ra câu nào trong vùng này. Kiểm lại xem clip có tiếng không.':
      'No speech found in this range. Check that the clip actually has audio.',
    'Không có khoảng lặng nào đủ dài để cắt trong vùng này. Chưa dựng gì cả.':
      'No silence long enough to cut in this range. Nothing was built.',
    'Đã tạo file phụ đề nhưng chưa gắn được lên timeline — mở tay từ đường dẫn dưới.':
      'The caption file was created but could not be added to the timeline — open it manually from the path below.',
    'Autocut chưa quy đổi được thời gian cho clip đổi tốc độ — trả về 100% rồi chạy lại.':
      'Autocut cannot convert timecodes for speed-changed clips — set them back to 100% and run again.',
    'Lúc đó không có lời nói để đối chiếu nên tool phải đoán bằng mình độ to — kém chính xác hơn hẳn.':
      'With no speech to cross-check, the tool has to guess from loudness alone — noticeably less accurate.',

    // ─── lib\cep.ts — bao loi tu Premiere ───
    'Chưa mở project nào.': 'No project is open.',
    'Chưa mở sequence nào.': 'No sequence is open.',
    'Không có phản hồi từ Premiere': 'No response from Premiere',
    'Không còn đoạn nào để giữ — nới ngưỡng im lặng rồi chạy lại.':
      'Nothing left to keep — loosen the silence threshold and run again.',
    'Cách làm: khoanh tới hết timeline, hoặc đổi sang "Tạo sequence mới".':
      'What to do: mark out to the end of the timeline, or switch to "New sequence".',
    'Cắt tại chỗ làm ngắn phần trong vùng lại, mà Premiere không cho panel dồn ':
      'Cutting in place shortens the marked range, and Premiere does not let a panel ripple ',
    'Vùng vừa khoanh không trùm lên clip nào có file gốc. Khoanh lại cho trúng clip.':
      'The marked range does not cover any clip with a source file. Mark it over a clip.',
    'Nếu file nằm trong %APPDATA% thì Premiere Beta không thấy — phải để cạnh video gốc.':
      'Premiere Beta cannot see files inside %APPDATA% — keep it next to the source video.',
    'Mất dấu sequence giữa chừng (có thể Premiere đã được khởi động lại). Bấm lại để chạy từ đầu.':
      'Lost track of the sequence (Premiere may have restarted). Press again to start over.',
    'Chưa khoanh vùng cần cắt.nTrên timeline: đặt điểm vào bằng phím I, điểm ra bằng phím O, rồi bấm lại.':
      'No range marked.\nOn the timeline: set the in point with I, the out point with O, then press again.',

    // ─── Timeline.tsx ───
    'còn': 'left',
    'ví dụ': 'example',
    'Bản gốc': 'Original',
    'đã cắt bỏ': 'removed',
    'Sau khi cắt': 'After the cut',
    'Đỏ là chỗ sẽ bỏ.': 'Red is what will be removed.',
    'Bỏ sạch dead silent · nhịp dồn liên tục':
      'Removes all dead silence · continuous, tight pace',
    'Bỏ dead silent dài · giữ nhịp nói tự nhiên':
      'Removes long dead silence · keeps a natural speaking rhythm',
    'Bỏ phần lớn dead silent · vẫn còn khoảng thở':
      'Removes most dead silence · still leaves room to breathe',

    // ─── services\whisper.ts ───
    'bộ nghe hiểu': 'the speech recognition engine',
    'Phụ đề câu dài': 'Long-line captions',
    'Không đọc được thư mục ': 'Could not read the folder ',
    'Panel không dùng được Node.js.': 'The panel cannot use Node.js.',
    'dữ liệu nghe hiểu (khoảng 3 GB)': 'the speech model (about 3 GB)',
    'Nghe kỹ hơn · câu phụ đề dài hơn': 'More careful · longer caption lines',
    'Chép nhanh hơn · câu ngắn, nhiều khối': 'Faster · shorter lines, more blocks',
    'Thiếu thành phần xử lý media của panel': 'The panel is missing its media component',
    'Không đọc được kết quả nghe hiểu (dữ liệu hỏng)':
      'Could not read the transcription result (corrupt data)',
    'Không xác định được thư mục cài đặt của bộ nghe hiểu.':
      'Could not locate the speech recognition install folder.',
    'Bộ nghe hiểu chạy xong nhưng không thấy file kết quả:n':
      'Speech recognition finished but no result file was found:\n',

    // ─── DaiSong.tsx ───
    'hơi thấp': 'on the low side',
    'Đây là ước tính': 'This is an estimate',
    'nhấp nhô theo nền ồn từng đoạn': 'rises and falls with the local noise floor',
    'Đỏ là chỗ sẽ bỏ · đường cam là ngưỡng, nó':
      'Red is what will be removed · the orange line is the threshold, it',
    'chứ không phải một mức cứng cho cả file. Bấm ba mức để xem khác nhau chỗ nào.':
      'rather than one fixed level for the whole file. Try the three levels to see the difference.',
    '— bước nghe hiểu chạy sau còn bỏ thêm mấy chỗ có tiếng động nhưng không phải lời nói, nên thực tế thường ngắn hơn chừng 3–8% nữa.':
      '— the speech pass that runs afterwards also removes spots that have sound but no words, so the real result is usually another 3–8% shorter.',

    // ─── BangDoan.tsx ───
    'Dài': 'Length',
    'Bắt đầu': 'Start',
    'Đang giữ': 'Kept',
    'Kết thúc': 'End',
    'Thao tác': 'Action',
    'Dạng sóng': 'Waveform',
    'Ví dụ cho dễ hình dung — chưa phải clip của bạn. Bấm':
      'An example to show the idea — not your clip yet. Press',
    'để panel nghe clip đang khoanh rồi liệt kê đúng chỗ im của nó.':
      'and the panel will listen to the marked clip and list its actual silences.',

    // ─── MinhHoa.tsx ───
    'Timeline gốc, chỗ tô đỏ là dead silent sẽ bị bỏ':
      'Original timeline — the red parts are dead silence that will be removed',

    // ─── services\ffmpeg.ts ───
    'Không đọc được file này:n': 'Could not read this file:\n',
    'Không dùng được Node.js trong panel': 'Node.js is not available in the panel',
    'Không dùng được child_process.execFile': 'child_process.execFile is not available',
    'Thiếu thành phần xử lý media của panel — cài lại bản mới nhất':
      'The panel is missing its media component — reinstall the latest build',

    // ─── MinhHoaNoiDat.tsx ───
    'Tạo sequence mới: bản gốc còn nguyên, sinh thêm một sequence đã cắt bên dưới':
      'New sequence: the original stays untouched and a cut version is created below it',
    'Cắt thẳng vào sequence đang mở: chỗ lặng biến mất, các đoạn dồn lại trên chính nó':
      'Cut in place: the silences disappear and the remaining segments ripple together in the same sequence',
  },
}
