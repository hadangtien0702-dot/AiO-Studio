/**
 * chu.ts — BẢNG DỊCH TIẾNG ANH cho AiO Video Download.
 *
 * Khoá = CHÍNH CÂU TIẾNG VIỆT trong mã nguồn (App.tsx, lib/cep.ts). Không có
 * trong bảng thì trả lại nguyên văn → quên dịch chỉ làm hiện tiếng Việt,
 * không làm vỡ giao diện. Xem giải thích ở `ngonngu.tsx`.
 * Kiểm đủ khoá: `node scripts/kiem-chu.mjs` (0 khoá thiếu mới được build).
 *
 * Từ vựng bám theo giao diện tiếng Anh của Premiere (bin, project, import) —
 * anh Tiến 13/08: *"anh không giỏi tiếng Anh đâu em"*, nên lấy Premiere làm
 * thước ngoài, không lấy cảm nhận của mình.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    // Dấu thập phân: "9,7 MB/s" (VI) ↔ "9.7 MB/s" (EN).
    ',': '.',
    'Không có phản hồi từ Premiere': 'No response from Premiere',
    'ngoài Premiere': 'outside Premiere',
    'Chưa mở project': 'No project open',
    'Đang nối với Premiere': 'Connected to Premiere',
    'Panel này chỉ chạy bên trong Premiere.': 'This panel only works inside Premiere.',
    'Thiếu file {f} trong bộ cài. Cài lại panel.': 'Missing {f} in the install. Reinstall the panel.',
    'Premiere đang bận hoặc đang mở một hộp thoại — panel chờ Premiere trả lời.':
      'Premiere is busy or has a dialog open — the panel is waiting for Premiere.',

    // Thanh trên + Cài đặt
    'Cài đặt': 'Settings',
    'Cài đặt: cookie trình duyệt, engine tải': 'Settings: browser cookies, download engine',
    'Cookie trình duyệt': 'Browser cookies',
    'Chỉ cần khi trang đòi đăng nhập (Vimeo, video riêng tư). Trình duyệt đó phải đang đăng nhập sẵn.':
      'Only needed when a site requires sign-in (Vimeo, private videos). You must already be signed in on that browser.',
    'Không': 'None',
    'Edge': 'Edge',
    'Chrome': 'Chrome',
    'Firefox': 'Firefox',
    'Engine tải': 'Download engine',
    'Cập nhật': 'Update',
    'Đang cập nhật…': 'Updating…',
    'Đã cập nhật lên {v}': 'Updated to {v}',
    'Engine đã là bản mới nhất': 'Engine is already up to date',
    'Cập nhật không thành công. Kiểm tra mạng rồi thử lại.': 'Update failed. Check your network and retry.',

    // Ô link
    'Link video': 'Video link',
    'Dán link video': 'Paste a video link',
    'YouTube, Facebook, TikTok… — dán cả câu có link cũng được': 'YouTube, Facebook, TikTok… — pasting a whole sentence with the link works too',
    'Trang chặn, đang thử lại…': 'Site blocked, retrying…',
    'Xoá link': 'Clear link',
    'Dán link': 'Paste link',
    'Dán link (Ctrl+V)': 'Paste link (Ctrl+V)',
    'Chưa thấy đường link trong chữ vừa dán.': 'No link found in the pasted text.',
    'Đang dùng cookie của {b}': 'Using {b} cookies',
    'Đang đọc link…': 'Reading link…',
    'tối đa {h}p': 'up to {h}p',

    // Chất lượng
    'Chất lượng': 'Quality',
    'Tốt nhất': 'Best',
    '1080p': '1080p',
    '720p': '720p',
    '480p': '480p',
    'MP3': 'MP3',
    'MP3 (chỉ tiếng)': 'MP3 (audio only)',
    'Tốt nhất (tối đa {h}p)': 'Best (up to {h}p)',
    'Video này không có mức đó — sẽ lấy mức cao nhất có sẵn': 'Not available for this video — the highest available will be used',
    'bản tốt nhất': 'best quality',

    // Lưu vào
    'Lưu vào': 'Save to',
    '(chưa chọn)': '(not set)',
    'Bấm để mở thư mục này': 'Click to open this folder',
    'Đổi': 'Change',
    'Đang chọn…': 'Choosing…',
    'Chọn thư mục lưu video': 'Choose a folder for downloaded videos',
    'Về mặc định: cạnh file project': 'Back to default: next to the project file',
    'Tự nhập vào bin': 'Auto-import into bin',
    'sau khi tải': 'after download',
    'Tự nhập vào bin {b} sau khi tải': 'Auto-import into bin {b} after download',

    // Nút chính / tiến độ
    'Tải video': 'Download video',
    'Tải {q} vào bin': 'Download {q} to bin',
    'Tải {q}': 'Download {q}',
    'Thử lại': 'Retry',
    'Đã tải xong': 'Downloaded',
    'Đang tải': 'Downloading',
    'Đang tải…': 'Downloading…',
    'Đang chuẩn bị…': 'Preparing…',
    'Đang xử lý…': 'Processing…',
    'còn {t}': '{t} left',
    'Trang chặn, đang thử lại ({n}/{m})…': 'Site blocked the request, retrying ({n}/{m})…',
    'Dừng': 'Stop',

    // Lỗi tải
    'Đây không phải đường link video.': 'This is not a video link.',
    'Trang này chưa hỗ trợ tải.': 'This site is not supported.',
    'Video không xem được (đã xoá, riêng tư, hoặc sai link).': 'Video unavailable (removed, private, or wrong link).',
    'Trang này đòi đăng nhập. Mở Cài đặt, chọn cookie của trình duyệt đã đăng nhập, rồi thử lại.':
      'This site requires sign-in. Open Settings, pick the cookies of a browser where you are signed in, then retry.',
    'Trang từ chối yêu cầu (bị chặn). Thử lại sau, hoặc dùng cookie trình duyệt trong Cài đặt.':
      'The site refused the request (blocked). Retry later, or use browser cookies in Settings.',
    'Không kết nối được. Kiểm tra mạng rồi thử lại.': 'Could not connect. Check your network and retry.',
    'Windows chặn engine tải (phần mềm diệt virus?). Cho phép trong Windows Security rồi thử lại.':
      'Windows blocked the download engine (antivirus?). Allow it in Windows Security, then retry.',
    'Không đọc được cookie của {b}. Đóng hẳn {b} (kể cả chạy nền), hoặc chọn Firefox / Không trong Cài đặt.':
      'Could not read {b} cookies. Fully close {b} (including background), or pick Firefox / None in Settings.',
    'Không ghi được vào thư mục lưu (ổ đã rút, hết chỗ hoặc không có quyền). Bấm "Đổi" để chọn chỗ khác.':
      'Cannot write to the save folder (drive removed, disk full or no permission). Click "Change" to pick another one.',
    'Link này là danh sách {n} video. Bản này tải từng video — dán link của đúng video cần tải.':
      'This link is a list of {n} videos. This version downloads one video at a time — paste the link of the video you need.',
    'Link này là danh sách nhiều video. Bản này tải từng video — dán link của đúng video cần tải.':
      'This link is a list of videos. This version downloads one video at a time — paste the link of the video you need.',
    'Tải không thành công.': 'Download failed.',
    'Nếu link này từng tải được: mở Cài đặt → Cập nhật engine, rồi thử lại.':
      'If this link used to work: open Settings → Update engine, then retry.',

    // Danh sách
    'Đã tải': 'Downloaded',
    'Dọn {n} mục mất file': 'Clear {n} missing',
    'Chỉ bỏ khỏi danh sách, không xoá gì trên đĩa': 'Only removes them from the list, deletes nothing on disk',
    'File không còn trên đĩa': 'File no longer on disk',
    'Đang nhập…': 'Importing…',
    'Trong project': 'In project',
    'File này đang nằm trong project đang mở': 'This file is in the open project',
    'Offline trong project': 'Offline in project',
    'Có trong project nhưng Premiere báo offline': 'In the project, but Premiere reports it offline',
    'Nhập vào project': 'Import to project',
    'Mở thư mục': 'Show in folder',
    'Bỏ khỏi danh sách': 'Remove from list',
    'Bỏ khỏi danh sách (không xoá file)': 'Remove from list (keeps the file)',
    '{c} — Premiere có thể không đọc được': '{c} — Premiere may not be able to read it',

    // Lỗi nhập
    'File không còn ở chỗ cũ.': 'The file is no longer where it was.',
    'Chưa mở project nào trong Premiere.': 'No project is open in Premiere.',
    'Project đang mở đã đổi — bấm lại để nhập vào project này.': 'The open project changed — click again to import into this project.',
    'Không tạo được bin (project chỉ đọc?).': 'Could not create the bin (read-only project?).',
    'Premiere không nhận file này.': 'Premiere did not accept this file.',
    'Panel vừa cập nhật — tắt hẳn Premiere rồi mở lại.': 'The panel was just updated — quit Premiere completely and reopen it.',
    'Premiere chưa trả lời — bấm lại.': 'Premiere did not respond — click again.',
    'Tên file có dấu "%" — Premiere không mở được. Đổi tên file (bỏ dấu %) rồi bấm nhập lại.':
      'The file name contains "%" — Premiere cannot open it. Rename the file (remove %) and import again.',
  },
}
