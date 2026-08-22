/**
 * chu.ts — BANG DICH TIENG ANH cho AiO Transcripts.
 *
 * Khoa = CHINH CAU TIENG VIET trong ma nguon. Khong co trong bang thi tra lai
 * nguyen van cau do -> quen dich mot cau chi lam no hien tieng Viet, khong lam
 * vo giao dien. Xem giai thich day du o `ngonngu.tsx`.
 *
 * Sinh tu do that ngay 13/08/2026 tren `client/src` (tru `ngonngu.tsx`):
 * xoa comment truoc roi moi quet -> 183 chuoi co dau -> loc rac con 139.
 *
 * ☠️ Vong quet do CHU CO DAU BO SOT MOT LOP: chuoi hien thi viet bang TIENG
 * VIET KHONG DAU (`Nhanh` · `Ngang 16:9` · `Nghe ra` · `Anh` · `Nga` · `Trung`
 * · `Indonesia` · `Ba Lan` · `Ukraina`) khong co dau nao de bo loc bam vao.
 * Phai quet vong hai — bat them 9 chuoi. Bai hoc: bo loc dua tren MOT dau
 * hieu thi cai nao khong mang dau hieu do se bien mat trong im lang.
 *
 * Doc tay tung cho thi cuu them 4 manh bi bo loc rac nem nham, va tach
 * `'tiếng '` ra khoi `'tiếng'` -> **152 khoa**.
 *
 * Da tu kiem (`scratchpad/kiem-khoa.mjs`): 152 khoa · 0 khoa trung nhau ·
 * **0 khoa khong ton tai trong ma nguon** · `tsc --noEmit` 0 loi.
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
 *   phu de            -> captions             (KHONG "subtitles" — Premiere
 *                                              goi track do la Captions)
 *   chep loi          -> transcribe           (Premiere: "Transcribe Sequence")
 *   lam phu de        -> create captions      (dung chu tren nut cua Premiere)
 *   cho can soat      -> marker
 *   Ngang 16:9        -> Horizontal 16:9      (ten preset cua Auto Reframe)
 *   Doc 9:16          -> Vertical 9:16        (ten preset cua Auto Reframe)
 *   khung hinh        -> aspect ratio         (chu Adobe dung o Auto Reframe)
 *   nhat cat          -> cut
 *   don clip          -> ripple delete
 *   dai song          -> waveform
 *   sequence moi      -> new sequence
 *   khoang lang       -> silence
 *   clip / timeline / track / project  -> giu nguyen, la tu nghe
 *
 * Gap tu chua co trong bang tren: tra trong giao dien Premiere truoc, dung
 * tu dat. Neu Premiere khong co khai niem do thi moi dat, va ghi them mot
 * dong vao bang tren de lan sau khong dich kieu khac.
 *
 * ☠️ Nhung cau TRUNG voi Autocut thi CHEP Y NGUYEN ban dich cua Autocut
 * (`../../AiO Autocut/client/src/chu.ts`) — hai panel dung chung ~80% ma
 * (`whisper.ts` · `ffmpeg.ts` · `cep.ts`), khach mua ca bo va mo ca hai cung
 * luc. Cung mot loi ma hai panel noi hai kieu la loi hien thi.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ NHUNG NHAN CO Y KHONG NAM TRONG BANG NAY
 * ══════════════════════════════════════════════════════════════════════════
 * Khong co trong bang = tra lai nguyen van. DUNG "dich cho du":
 *
 *   `Transcript`      ten panel (thuong hieu)
 *   `Sequence`        tu cua Premiere, giong nhau ca hai thu tieng
 *   `Delete Track`    ten muc menu THAT cua Premiere — dich la nguoi dung
 *                     khong tim thay no trong menu nua
 *   `Hindi` `Khmer` `Tagalog`   ten ngon ngu viet giong het o ca hai thu tieng
 *   `I` `O` `M`       ten phim
 *   `vi-VN`           day la MA VUNG cua `toLocaleString`, KHONG phai chu
 *                     hien thi — dung boc `dich()` quanh no
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ HAI CHO PHAI GO TAY, DUNG BOC MAY MOC
 * ══════════════════════════════════════════════════════════════════════════
 * 1. `'tieng '` (co DAU CACH cuoi) -> chuoi RONG. Cho goi:
 *        Nghe ra <b>tiếng {tenNgonNgu(...)}</b>
 *    Tieng Viet phai co chu "tieng" dang truoc ("tieng Viet"), tieng Anh thi
 *    KHONG ("Vietnamese"). Nen ban `en` cua no la chuoi rong, va dau cach
 *    phai nam TRONG khoa chu khong nam ngoai `dich()`.
 *
 * 2. `` `Tiếng ${c.ten}` `` trong `Co.tsx` (title cua tung la co) — co `${}`
 *    ben trong nen khong khop khoa nao. Phai sua tay thanh
 *    `dich('tiếng ') + dich(c.ten)` hoac bo han title.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    // ─── Ten ngon ngu (App.tsx `TEN_NGON_NGU` + Co.tsx `CO[].ten`) ───
    // Dung chung mot khoa cho ca hai file. `Hindi` `Khmer` `Tagalog` khong co
    // o day vi viet giong het nhau o ca hai thu tieng.
    'Việt': 'Vietnamese',
    'Anh': 'English',
    'Trung': 'Chinese',
    'Quảng Đông': 'Cantonese',
    'Nhật': 'Japanese',
    'Hàn': 'Korean',
    'Tây Ban Nha': 'Spanish',
    'Bồ Đào Nha': 'Portuguese',
    'Pháp': 'French',
    'Đức': 'German',
    'Nga': 'Russian',
    'Ý': 'Italian',
    'Thái': 'Thai',
    'Indonesia': 'Indonesian',
    'Mã Lai': 'Malay',
    'Ả Rập': 'Arabic',
    'Thổ Nhĩ Kỳ': 'Turkish',
    'Hà Lan': 'Dutch',
    'Ba Lan': 'Polish',
    'Ukraina': 'Ukrainian',
    'Lào': 'Lao',

    // ─── App.tsx — thanh dau va trang thai host ───
    '(đang kiểm tra…)': '(checking…)',
    'KHÔNG chạy trong Premiere (đang mở bằng trình duyệt)':
      'NOT running inside Premiere (opened in a browser)',

    // ─── App.tsx — dong chi dan (khoi 1) ───
    'và': 'and',
    'bằng': 'with',
    'chép lời': 'transcribe',
    'Khoanh đoạn cần': 'Mark the range to',
    '. Chọn khung và cách chép rồi bấm.':
      '. Pick the aspect ratio and transcription method, then press.',

    // ─── [2.5.0] App.tsx — doan dang chon (bam theo I/O, chep tu Autocut) ───
    'Đoạn đang chọn': 'Selected range',
    'chưa khoanh': 'no in/out points',
    'Đổi vùng bằng phím': 'Change the range with',

    // ─── [2.5.0] App.tsx + caption-kieu.ts — kieu caption hieu ung ───
    // Ten kieu (Hormozi/Beast/Karaoke/Boxed/Clean) la TEN RIENG, khong dich.
    'Kiểu caption': 'Caption style',
    'Mặc định': 'Default',
    'Caption track thường của Premiere — sửa chữ trong Text panel':
      'Standard Premiere caption track — edit text in the Text panel',
    'Chữ in hoa, viền đen dày, từ khoá tô vàng, pop khi vào — kiểu Alex Hormozi':
      'Uppercase, thick black stroke, yellow keyword, pop-in — Alex Hormozi style',
    'Chữ to màu vàng, viền + bóng đậm, pop mạnh — kiểu MrBeast':
      'Big yellow text, heavy stroke + shadow, strong pop — MrBeast style',
    'Câu đủ 1–2 dòng, từng từ sáng xanh theo lúc nói':
      'Full 1–2 line sentences, each word lights up green as it is spoken',
    'Chữ trắng trên hộp đen bo góc — gọn, dễ đọc':
      'White text on a rounded black box — compact, easy to read',
    'Chữ mảnh, bóng mềm, không hiệu ứng — cho video dài':
      'Light text, soft shadow, no effects — for long-form video',
    'Đang đặt caption lên timeline…': 'Placing captions on the timeline…',
    'Đang đặt caption {a}/{b}…': 'Placing captions {a}/{b}…',
    'Không còn track video trống trong vùng — thêm một track video rồi chạy lại.':
      'No free video track in this range — add a video track and run again.',
    'Không đặt được caption lên timeline: {l}': 'Could not place captions on the timeline: {l}',
    'Đã đặt {n} caption kiểu {k} lên V{t} của sequence':
      'Placed {n} {k} captions on V{t} of sequence',
    'Mỗi caption là một graphic — bấm vào là sửa chữ, đổi màu như text thường.':
      'Each caption is a graphic — click it to edit the text or colors like any text layer.',
    'Kiểu riêng — file .mogrt trong thư mục kiểu caption':
      'Custom style — a .mogrt file in the caption styles folder',
    'Thêm kiểu từ After Effects…': 'Add a style from After Effects…',
    // ─── [2.5.1] hai nut: Lam phu de / Lam hieu ung (anh Tien 22/08 dem) ───
    'Hiệu ứng': 'Effects',
    'Làm hiệu ứng': 'Add effects',
    'Mỗi caption là một graphic MOGRT — sửa chữ ngay trên graphic. Nặng hơn caption track, hợp short.':
      'Each caption becomes a MOGRT graphic — edit the text right on it. Heavier than a caption track; best for shorts.',
    'Track video {x} không còn — timeline vừa đổi, bấm lại để chạy từ đầu.':
      'Video track {x} is gone — the timeline changed, click again to start over.',
    'Vùng caption không hợp lệ ({x}). Khoanh lại vùng rồi bấm lại.':
      'Invalid caption range ({x}). Set the range again and retry.',
    'Thiếu file kiểu caption:\n{x}\nCài lại panel, hoặc thả lại file .mogrt vào thư mục kiểu riêng.':
      'Caption style file missing:\n{x}\nReinstall the panel, or drop the .mogrt back into the custom styles folder.',
    '({c} clip — mỗi từ một clip để từ đang nói sáng lên)':
      '({c} clips — one per word so the spoken word lights up)',

    // ─── App.tsx — hinh minh hoa ───
    'phụ đề': 'captions',
    'cờ đỏ': 'red markers',
    'Bấm để xem lại': 'Click to replay',
    'Máy nghe hết đoạn → chép thành': 'The tool listens to the whole range → turns it into',
    'đặt đúng chỗ người ta nói → cắm': 'placed where people actually speak → and drops',
    'ở chỗ nó nghe không chắc.': 'wherever it is unsure.',

    // ─── App.tsx — thanh chon KHUNG HINH ───
    'Khung hình': 'Aspect ratio',
    'Ngang 16:9': 'Horizontal 16:9',
    'Dọc 9:16': 'Vertical 9:16',
    'Chuẩn phụ đề quốc tế cho video ngang': 'Broadcast caption standard for horizontal video',
    'Câu ngắn hơn — khỏi tràn mép, khỏi đè safe zone':
      'Shorter lines — no overflow, clear of the safe zone',

    // ─── App.tsx — thanh chon CACH CHEP ───
    'Cách chép': 'Transcription method',
    'Câu ngắn': 'Short lines',
    'Câu dài': 'Long lines',
    'Câu ngắn, nhiều khối · chạy nhanh hơn': 'Short lines, more blocks · faster',
    'Câu dài, ít khối · nghe kỹ hơn': 'Long lines, fewer blocks · more careful',

    // ─── App.tsx — nut chinh ───
    'Làm phụ đề': 'Create captions',
    'Chép lại': 'Transcribe again',

    // ══════════════════════════════════════════════════════════════════════
    // ☠️ KHOA CO CHO TRONG `{...}` — cho cau von la TEMPLATE LITERAL
    // ══════════════════════════════════════════════════════════════════════
    // Cau co `${bien}` o giua thi template literal KHONG khop khoa nao, va
    // vong quet chuoi cung khong bat duoc. Hai cach sai da tranh:
    //   - de nguyen tieng Viet  -> nguoi dung EN doc mot cau Viet
    //   - tach ra dich tung manh -> "Removed 3 phụ đề khỏi project", nua no nua
    //     kia, TE HON la de nguyen
    // Cach dung: MOT khoa chua CA CAU, cho trong dat ten theo nghia
    // (`{n}` so luong · `{x}` tham so host · `{f}` ten file), roi `.replace()`
    // o chinh cho goi. Doi ten cho trong thi phai sua CA HAI ben.
    'Trong vùng có {n} clip đã đổi tốc độ ({p}%). ':
      '{n} clips in this range have a speed change ({p}%). ',
    'Vùng này có {n} file khác nhau. Mới làm phụ đề cho "{f}" ({c} clip); {b} clip của file khác chưa được chép.':
      'This range has {n} different source files. Captions were made only for "{f}" ({c} clips); {b} clips from the other files were not transcribed.',
    'Đang đánh dấu {n} chỗ cần soát…': 'Placing markers at {n} spots to review…',
    'Đã gỡ {n} phụ đề khỏi project. File trên đĩa vẫn còn — ':
      'Removed {n} caption files from the project. The files on disk are still there — ',
    'Gỡ {n} file phụ đề khỏi project': 'Remove {n} caption files from the project',
    'Đã xoá {n} marker. Còn lại {m} marker trên sequence.':
      'Deleted {n} markers. {m} markers left on the sequence.',
    'Xoá {n} marker': 'Delete {n} markers',

    // ─── App.tsx — cac buoc chay (`CAC_BUOC` va `buoc[]`) ───
    'Đọc vùng đã khoanh': 'Read the marked range',
    'Tách tiếng khỏi video': 'Extract audio from video',
    'Nghe hiểu lời nói': 'Speech recognition',
    'Nghe hiểu lời nói (GPU)': 'Speech recognition (GPU)',
    'Gắn phụ đề lên timeline': 'Add captions to the timeline',
    'Dùng lại kết quả nghe đã có': 'Reuse existing transcription',
    'Đang đọc vùng đã khoanh…': 'Reading the marked range…',
    'Đang tách tiếng khỏi video': 'Extracting audio from video',
    'Đang gắn phụ đề lên timeline': 'Adding captions to the timeline',
    'Đang gắn phụ đề lên timeline…': 'Adding captions to the timeline…',
    'Đang quy đổi mốc thời gian…': 'Converting timecodes…',
    'Đang nghe hiểu lời nói': 'Recognizing speech',
    'Đang nạp mô hình lên GPU': 'Loading the model onto the GPU',
    // `buoc[].ket` — dong ket qua cua tung buoc. CHUA VE RA MAN HINH (khoi
    // "may da lam nhung gi" da go 29/07), nhung van dich: no van duoc thu
    // thap de go loi, va bat lai khoi la mot dong nua Anh nua Viet.
    'xong': 'done',
    '{a} câu · {b} từ': '{a} lines · {b} words',
    '{a} câu · {b} từ · không phải nghe lại': '{a} lines · {b} words · no need to listen again',
    '{n}s tiếng': '{n}s of audio',
    ' · đọc {n} GB': ' · read {n} GB',
    ' · nghe ra tiếng {x}': ' · detected {x}',

    // ─── App.tsx — khoi ket qua ───
    'câu đã chép': 'lines transcribed',
    'chạy mất': 'took',
    'chỗ cần soát': 'markers to review',
    'đã chạy': 'just processed',
    'Phụ đề đã gắn lên sequence': 'Captions added to sequence',
    'Số liệu dưới đây là của «': 'The numbers below are for «',
    '— anh đang mở «': '— you currently have «',
    '». Muốn chép cho sequence này thì khoanh vùng rồi bấm lại.':
      '» open. To transcribe this one, mark the range and press again.',

    // ─── App.tsx — dong ngon ngu nhan ra duoc ───
    // ☠️ `'tiếng '` co DAU CACH cuoi va ban `en` la CHUOI RONG — xem ghi chu
    // dau file. Tieng Viet: "tieng Viet" · tieng Anh: "Vietnamese".
    'Nghe ra': 'Detected',
    'tiếng ': '',
    ' — cắt dòng theo chuẩn chữ vuông': ' — line wrapping follows the CJK standard',

    // ─── App.tsx — dong marker ───
    'chỗ': 'spots',
    '. Bấm': '. Press',
    'chỗ tệ nhất': 'worst spots',
    'Máy không chắc ở': 'The tool is unsure at',
    '— đã cắm marker': '— markers placed at the',
    'để đi tới từng chỗ.': 'to jump to each one.',
    'trên timeline — bấm': 'on the timeline — press',
    'để đi tới từng chỗ máy nghe không chắc.': 'to jump to each uncertain point.',

    // ─── App.tsx — khoi DON (duong ra) ───
    'Đang gỡ…': 'Removing…',
    'Đang xoá…': 'Deleting…',
    'Dọn thứ panel đã tạo': 'Clean up what the panel created',
    'panel không tự xoá file của anh.': 'the panel does not delete your files.',
    'Chỉ xoá thứ panel tạo ra. Phụ đề và marker anh tự làm không bị chạm.':
      'Only removes what the panel created. Captions and markers you made yourself are untouched.',
    'Track caption trên timeline Premiere không cho tool xoá — chuột phải vào đầu track →':
      'Premiere does not let a tool delete a caption track on the timeline — right-click the track header →',
    'Sequence này chưa có gì do panel tạo — chạy "Làm phụ đề" xong thì nút xoá phụ đề và marker sẽ hiện ở đây.':
      'Nothing on this sequence was created by the panel — once you run "Create captions", the buttons to delete captions and markers appear here.',

    // ─── App.tsx — dai co ngon ngu ───
    'Tự nhận ngôn ngữ —': 'Automatic language detection —',
    '+ thứ tiếng': '+ languages',
    ', không phải chọn tay.': ', no manual picking.',

    // ─── App.tsx — bao loi ───
    'Không nạp được host.': 'Could not load the host script.',
    'Không đọc được vùng đã khoanh': 'Could not read the marked range',
    'Panel không dùng được Node.js': 'The panel cannot use Node.js',
    'Không câu nào rơi vào phần đã giữ lại.': 'No speech falls inside the kept parts.',
    'Không nạp được host/index.jsx từ thư mục extension.':
      'Could not load host/index.jsx from the extension folder.',
    'Panel không dùng được Node.js — không gọi được bộ xử lý media.':
      'The panel cannot use Node.js — the media processor is unreachable.',
    'Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.':
      'The panel is missing its media component — reinstall the latest build.',
    'Chưa cài bộ nghe hiểu nên chưa chép lời được.\n':
      'Speech recognition is not installed, so nothing can be transcribed.\n',
    'Không nghe ra câu nào trong vùng này. Kiểm lại xem clip có tiếng không.':
      'No speech found in this range. Check that the clip actually has audio.',
    'Đã tạo file phụ đề nhưng chưa gắn được lên timeline — mở tay từ đường dẫn dưới.':
      'The caption file was created but could not be added to the timeline — open it manually from the path below.',
    'Panel chưa quy đổi được thời gian cho clip đổi tốc độ — trả về 100% rồi chạy lại.':
      'The panel cannot convert timecodes for speed-changed clips — set them back to 100% and run again.',

    // ─── lib\cep.ts — bao loi tu Premiere ───
    'Chưa mở project nào.': 'No project is open.',
    'Chưa mở sequence nào.': 'No sequence is open.',
    'Không có phản hồi từ Premiere': 'No response from Premiere',
    'phần phía sau lên — sẽ hở một khoảng trống.\n':
      'the rest forward — it would leave a gap.\n',
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
    'Chưa khoanh vùng cần cắt.\nTrên timeline: đặt điểm vào bằng phím I, điểm ra bằng phím O, rồi bấm lại.':
      'No range marked.\nOn the timeline: set the in point with I, the out point with O, then press again.',
    // Bao loi tu host CO THAM SO — khoa chua ca cau, `{x}` la tham so host gui
    // ve (ten API, ten track, duong dan). Xem khoi "KHOA CO CHO TRONG" o tren.
    'Bản Premiere này không có `{x}`.': 'This version of Premiere does not have `{x}`.',
    'Tạo sequence mới thất bại: {x}': 'Could not create the new sequence: {x}',
    'Sequence mới không có track {x} nào.': 'The new sequence has no {x} track.',
    'Không tạo được track phụ đề: {x}': 'Could not create the caption track: {x}',
    'Không nhập được file phụ đề vào project: {x}':
      'Could not import the caption file into the project: {x}',
    'Premiere không đọc được file phụ đề:\n{x}\n':
      'Premiere could not read the caption file:\n{x}\n',
    'Timeline đã thay đổi giữa chừng ({x}). Bấm lại để chạy từ đầu.':
      'The timeline changed while running ({x}). Press again to start over.',
    'Sau vùng anh khoanh còn {n} clip nữa, nên không cắt tại chỗ được.\n':
      'There are still {n} clips after the marked range, so cutting in place is not possible.\n',

    // ─── services\whisper.ts ───
    // `' và '` la CHU NOI trong cau "Chua co A va B trong:". Dich no la bat
    // buoc — de nguyen thi ra "the speech recognition engine và the model".
    ' và ': ' and ',
    'Chưa có {x} trong:\n': 'Could not find {x} in:\n',
    'Nhanh': 'Fast',
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
    'Bộ nghe hiểu chạy xong nhưng không thấy file kết quả:\n':
      'Speech recognition finished but no result file was found:\n',

    // ─── services\ffmpeg.ts ───
    'Không đọc được file này:\n': 'Could not read this file:\n',
    'Không dùng được Node.js trong panel': 'Node.js is not available in the panel',
    'Không dùng được child_process.execFile': 'child_process.execFile is not available',
    'Thiếu thành phần xử lý media của panel — cài lại bản mới nhất':
      'The panel is missing its media component — reinstall the latest build',

    // ─── MinhHoa.tsx — chu doc cho trinh doc man hinh (`aria-label`) ───
    'Chia thành nhiều khối phụ đề ngắn': 'Split into many short caption blocks',
    'Chia thành ít khối phụ đề, mỗi khối dài hơn':
      'Split into fewer caption blocks, each one longer',
    'Máy nghe hết đoạn, chép lời thành phụ đề gắn lên timeline, và cắm cờ ở chỗ nghe không chắc':
      'The tool listens to the whole range, turns the speech into captions on the timeline, and flags the spots it is unsure about',

    // ══════════════════════════════════════════════════════════════════════
    // AppNewUI.tsx — BAN MOCKUP GIAO DIEN, KHONG PHAI SAN PHAM
    // ══════════════════════════════════════════════════════════════════════
    // File nay (va `AppCyberpunkUI.tsx`) la ban dung thu giao dien, so lieu
    // trong do la SO GIA ('48 cau', '4.2 giay', 'Product_Launch_Sequence_01').
    // Dich san de khoi sot neu no duoc dung that, NHUNG dung di boc `dich()`
    // vao mockup khi chua co ai chot dung ban thiet ke do.
    // Bo ca khoi nay khi xoa mockup.
    'Tự động chép lời & Tạo phụ đề Timeline': 'Automatic transcription & timeline captions',
    'Khoanh vùng bằng': 'Mark the range with',
    'trên Premiere Sequence. Hệ thống tự nhận diện giọng nói, ngắt câu chuẩn dòng và đánh dấu mốc nghi vấn.':
      'on the Premiere sequence. The engine detects speech, breaks lines to standard, and flags uncertain points.',
    'Cấu hình phiên chép lời': 'Transcription settings',
    'Tối ưu theo định dạng video': 'Tuned to the video format',
    'Khung hình & Quy chuẩn dòng': 'Aspect ratio & line rules',
    'Ngang 16:9 (Chuẩn TV/YouTube)': 'Horizontal 16:9 (TV/YouTube standard)',
    'Dọc 9:16 (Shorts/Reels)': 'Vertical 9:16 (Shorts/Reels)',
    '✓ Tối đa 42 ký tự/dòng — chuẩn phụ đề quốc tế không che hình':
      '✓ Max 42 characters per line — broadcast caption standard, does not cover the picture',
    '✓ Tối đa 24 ký tự/dòng — ngắt ngắn chống tràn mép & né Safe Zone':
      '✓ Max 24 characters per line — short breaks avoid overflow and the safe zone',
    'Chế độ AI Whisper': 'Whisper AI mode',
    '⚡ Turbo (Câu ngắn - Tốc độ cao)': '⚡ Turbo (short lines - high speed)',
    '🎯 Deep Transcribe (Chính xác cao)': '🎯 Deep Transcribe (high accuracy)',
    '⚡ Tốc độ gấp 3 lần — phù hợp video ngắn, vlog cá nhân':
      '⚡ 3× faster — good for short videos and personal vlogs',
    '🎯 Nghe kỹ từng từ — phù hợp Podcast, phỏng vấn, từ ngữ chuyên ngành':
      '🎯 Listens to every word — good for podcasts, interviews and technical terms',
    'Bắt đầu làm phụ đề': 'Start creating captions',
    'Chép lại đoạn này': 'Transcribe this range again',
    'Đang nhận diện giọng nói & tách câu... 78%': 'Detecting speech & splitting lines... 78%',
    '✓ ĐÃ GẮN LÊN TIMELINE': '✓ ADDED TO TIMELINE',
    'Thời gian xử lý: 4.2 giây': 'Processing time: 4.2 seconds',
    'Câu phụ đề': 'Caption lines',
    'Tổng số từ': 'Total words',
    'Mốc nghi vấn (Cờ đỏ)': 'Uncertain points (red markers)',
    'Xem danh sách Marker': 'View marker list',
    'Xuất file .SRT': 'Export .SRT file',
  },
}
