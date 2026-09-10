/**
 * chu.ts — BẢNG DỊCH TIẾNG ANH cho AiO Video Download.
 *
 * Khoá = CHÍNH CÂU TIẾNG VIỆT trong mã nguồn (App.tsx, lib/cep.ts). Không có
 * trong bảng thì trả lại nguyên văn → quên dịch chỉ làm hiện tiếng Việt,
 * không làm vỡ giao diện. Xem giải thích ở `ngonngu.tsx`.
 *
 * Từ vựng bám theo giao diện tiếng Anh của Premiere (bin, project, import) —
 * anh Tiến 13/08: *"anh không giỏi tiếng Anh đâu em"*, nên lấy Premiere làm
 * thước ngoài, không lấy cảm nhận của mình.
 */
import type { BangChu } from './ngonngu'

export const CHU: BangChu = {
  en: {
    'Không có phản hồi từ Premiere': 'No response from Premiere',
    'ngoài Premiere': 'outside Premiere',
    'Panel này chỉ chạy bên trong Premiere.': 'This panel only works inside Premiere.',
    'Thiếu file {f} trong bộ cài. Cài lại panel.': 'Missing {f} in the install. Reinstall the panel.',
    'Đường link video': 'Video link',
    'Dán link từ clipboard': 'Paste link from clipboard',
    'Dán': 'Paste',
    'Đang đọc link…': 'Reading link…',
    'tối đa {h}p': 'up to {h}p',
    'Chất lượng': 'Quality',
    'Tốt nhất': 'Best',
    '1080p': '1080p',
    '720p': '720p',
    '480p': '480p',
    'Chỉ tiếng (MP3)': 'Audio only (MP3)',
    'Video này không có mức đó — sẽ lấy mức cao nhất có sẵn': 'Not available for this video — the highest available will be used',
    'Lưu vào': 'Save to',
    '(chưa chọn)': '(not set)',
    'Bấm để mở thư mục này': 'Click to open this folder',
    'Đổi': 'Change',
    'Nhập vào project sau khi tải (bin "AiO Video Download")': 'Import into project after download (bin "AiO Video Download")',
    'Đang tải… {p}% · {v} · còn {t}': 'Downloading… {p}% · {v} · {t} left',
    'Đang xử lý…': 'Processing…',
    'Trang chặn, đang thử lại ({n}/{m})…': 'Site blocked the request, retrying ({n}/{m})…',
    'Đã tải xong': 'Downloaded',
    'Tải tiếng': 'Download audio',
    'Tải video': 'Download video',
    'Dừng': 'Stop',
    'Đây không phải đường link.': 'This is not a link.',
    'Trang này chưa hỗ trợ tải.': 'This site is not supported.',
    'Video không xem được (đã xoá, riêng tư, hoặc sai link).': 'Video unavailable (removed, private, or wrong link).',
    'Trang này đòi đăng nhập. Chọn "Cookie từ trình duyệt" ở dưới, nơi anh đã đăng nhập, rồi thử lại.':
      'This site requires sign-in. Pick "Browser cookies" below, using a browser where you are signed in, then retry.',
    'Trang từ chối yêu cầu (bị chặn). Thử lại sau, hoặc dùng cookie từ trình duyệt.':
      'The site refused the request (blocked). Retry later, or use browser cookies.',
    'Không kết nối được. Kiểm tra mạng rồi thử lại.': 'Could not connect. Check your network and retry.',
    'Tải không thành công.': 'Download failed.',
    'Nếu link này từng tải được: bấm "Cập nhật engine" ở dưới rồi thử lại.':
      'If this link used to work: click "Update engine" below and retry.',
    'Đã tải ({n})': 'Downloaded ({n})',
    'Nhập vào Premiere không được:': 'Import into Premiere failed:',
    'Codec này Premiere có thể không đọc — chọn 1080p/720p để lấy H.264.':
      'Premiere may not read this codec — pick 1080p/720p to get H.264.',
    'Mở thư mục': 'Show in folder',
    'Bỏ khỏi danh sách (không xoá file)': 'Remove from list (keeps the file)',
    'Đã vào project': 'In project',
    'Đang nhập…': 'Importing…',
    'Nhập vào Premiere': 'Import into Premiere',
    'Cookie từ trình duyệt': 'Browser cookies',
    'Không': 'None',
    'Edge': 'Edge',
    'Chrome': 'Chrome',
    'Firefox': 'Firefox',
    'Dùng khi trang đòi đăng nhập (Vimeo, video riêng tư). Trình duyệt đó phải đang đăng nhập sẵn.':
      'Use when a site requires sign-in (Vimeo, private videos). You must already be signed in on that browser.',
    'Engine': 'Engine',
    'Đang cập nhật…': 'Updating…',
    'Cập nhật engine': 'Update engine',
  },
}
