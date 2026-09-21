/**
 * luuRa.ts — đưa chữ RA KHỎI panel: chép vào bộ nhớ tạm · ghi file cạnh video ·
 * tải về (khi chạy ngoài Premiere).
 *
 * Phần SINH chữ nằm ở `xuat.ts` (thuần, kiểm được bằng `npm run kiem`). File này
 * là phần chạm vào máy thật (Node `fs`, DOM `clipboard`), nên không kiểm ngoài
 * Premiere được — mọi chỗ CHƯA ĐO đều ghi rõ ở dưới.
 */

import { dich } from '../ngonngu'
import { getFs, getPath, nodeAvailable } from '../lib/node'

// ═══════════════════════════════ BỘ NHỚ TẠM ═══════════════════════════════

/**
 * Chép `chu` vào bộ nhớ tạm. Trả tên đường đã dùng ('api' | 'lenh-cu') để lần
 * chẩn đoán sau biết đường nào ăn; ném Error (câu đã dịch) nếu cả hai đường trượt.
 *
 * ☠️ CHƯA ĐO trong Premiere: panel CEP nạp trang qua `file://`, mà
 * `navigator.clipboard` chỉ có ở "secure context" — Chromium nhúng của CEP có
 * coi `file://` là secure context hay không thì phải cài mới biết. Nên giữ ĐỦ
 * HAI đường: API mới, rồi `document.execCommand('copy')` trên một ô ẩn (đường
 * này chạy được ở mọi Chromium cũ, chỉ đòi đang trong một cử chỉ của người dùng
 * — nút bấm là đúng điều kiện đó).
 */
export async function chepChu(chu: string): Promise<'api' | 'lenh-cu'> {
  const s = String(chu ?? '')
  if (!s) throw new Error(dich('Không có chữ nào để chép.'))
  try {
    const nav = navigator as Navigator & { clipboard?: { writeText?: (t: string) => Promise<void> } }
    if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(s)
      return 'api'
    }
  } catch {
    /* API có mà bị chặn (không phải secure context, thiếu quyền) — thử đường cũ */
  }
  // Ô ẩn phải NẰM TRONG trang và có kích thước thật: `display:none` thì trình
  // duyệt không cho chọn chữ, `execCommand` trả false. Nên đặt ngoài khung nhìn.
  let o: HTMLTextAreaElement | null = null
  try {
    o = document.createElement('textarea')
    o.value = s
    o.setAttribute('readonly', '')
    o.setAttribute('aria-hidden', 'true')
    o.style.position = 'fixed'
    o.style.top = '-9999px'
    o.style.left = '-9999px'
    o.style.opacity = '0'
    document.body.appendChild(o)
    o.select()
    o.setSelectionRange(0, s.length)
    const ok = document.execCommand('copy')
    if (ok) return 'lenh-cu'
  } catch {
    /* rơi xuống câu báo lỗi dưới */
  } finally {
    if (o && o.parentNode) o.parentNode.removeChild(o)
  }
  throw new Error(dich('Không chép được vào bộ nhớ tạm. Bấm vào một câu, chọn chữ rồi nhấn Ctrl+C.'))
}

// ═══════════════════════════════ GHI FILE ═══════════════════════════════

/** Dấu BOM UTF-8. Thiếu nó thì Notepad / một số bộ đọc .srt trên Windows hiện
 *  tiếng Việt thành ký tự lạ. (Premiere có cần BOM khi nhập .srt hay không: CHƯA ĐO.) */
const BOM = '﻿'

/** Giới hạn cho cả đường dẫn — Windows cắt ở 260, chừa chỗ cho ' (99)' + đuôi. */
const DAI_DUONG_TOI_DA = 240

/** Số lần thử thêm ' (2)', ' (3)'… trước khi chịu. */
const THU_TOI_DA = 99

/**
 * Đổi mọi xuống dòng sang CRLF. DÙNG CHUNG cho cả hai đường ra file (ghi cạnh
 * video và tải về) — `xuat.ts` chỉ sinh `\n`.
 * ☠️ Sửa 21/09 sau soát: trước đó chỉ đường GHI đổi CRLF, đường TẢI VỀ giữ LF →
 * mọi phép đo trên trình duyệt (chế độ thử) nói về một file KHÁC file mà khách
 * nhận trong Premiere. Bộ Transcripts luôn CRLF (`srt.ts` dòng 789).
 */
function crlf(chu: string): string {
  return String(chu ?? '').replace(/\r?\n/g, '\r\n')
}

/**
 * Đổi lỗi Node thô của `fs` thành câu ĐÃ DỊCH, nguyên văn dời vào `chiTiet`
 * (tooltip) — `thanhLoi` trong `ui/chung.tsx` hiểu cặp `message` + `chiTiet`.
 *
 * ☠️ Vì sao cần: lưới cuối của `thanhLoi` chỉ bắt `spawn …` / `Command failed`,
 * nên `EPERM: operation not permitted, open 'E:\…'` đi thẳng ra màn hình —
 * tiếng Anh thô + lộ đường dẫn, giữa một bản tiếng Việt.
 */
function loiGhi(e: unknown): Error {
  const tho = e instanceof Error ? e.message : String(e ?? '')
  const ma = e && typeof e === 'object' ? String((e as { code?: unknown }).code ?? '') : ''
  let cau: string
  if (ma === 'EACCES' || ma === 'EPERM' || ma === 'EROFS')
    cau = dich('Không ghi được cạnh video — thư mục chỉ cho đọc, hoặc file đang bị khoá. Mở quyền ghi rồi xuất lại.')
  else if (ma === 'ENOSPC') cau = dich('Ổ đĩa đã đầy — chưa ghi được file.')
  else if (ma === 'ENOENT' || ma === 'ENOTDIR')
    cau = dich('Không tìm thấy thư mục của file gốc — ổ mạng rớt, hoặc file đã bị dời đi.')
  else if (ma === 'EBUSY') cau = dich('File đang bị một chương trình khác giữ — đóng nó rồi xuất lại.')
  else cau = dich('Không ghi được file cạnh video.')
  const l = new Error(cau) as Error & { chiTiet?: string }
  l.chiTiet = tho
  return l
}

export interface KetGhi {
  /** Đường dẫn THẬT đã ghi (có thể khác tên xin vì đã tránh file cũ). */
  duong: string
  /** Đã phải thêm ' (n)' vì tên xin đã có file — bên vẽ nói ra nếu cần. */
  daDoiTen: boolean
  /** Số byte đã ghi (đọc lại bằng `statSync`, không phải `chu.length`). */
  soByte: number
}

/**
 * Ghi `chu` thành file CẠNH FILE MEDIA `mediaPath`, tên `<tên media> - <tenRieng><duoi>`.
 *
 * ☠️ KHÔNG BAO GIỜ GHI ĐÈ: tên đã có file thì thêm ' (2)', ' (3)'… Luật 4 của
 * anh Tiến — việc khó đảo ngược phải hỏi trước; ở đây khỏi phải hỏi vì không
 * đụng vào file nào đang có. Bên vẽ PHẢI nói đường dẫn thật ra màn hình, không
 * thì người dùng không biết file nằm đâu.
 *
 * Xuống dòng đổi sang CRLF ĐÚNG MỘT LẦN tại đây (`xuat.ts` chỉ sinh `\n`) —
 * trộn hai kiểu trong một file là lỗi brain bài 5h đã trả giá.
 */
export function ghiCanhMedia(mediaPath: string, tenRieng: string, duoi: string, chu: string): KetGhi {
  if (!nodeAvailable()) throw new Error(dich('Panel không dùng được Node.js — chưa ghi được file.'))
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) throw new Error(dich('Panel không dùng được Node.js — chưa ghi được file.'))
  const thuMuc = path.dirname(mediaPath)
  const tenMedia = path.basename(mediaPath).replace(/\.[^.]+$/, '')
  let goc = tenRieng ? `${tenMedia} - ${tenRieng}` : tenMedia
  // Cắt cho cả đường dẫn nằm trong giới hạn; cắt phần TÊN, không cắt thư mục.
  const conLai = DAI_DUONG_TOI_DA - thuMuc.length - 1 - duoi.length - 5
  if (conLai > 8 && goc.length > conLai) goc = goc.slice(0, conLai).replace(/[. ]+$/, '')
  const noi = (ten: string) => path.join(thuMuc, ten + duoi)
  let duong = noi(goc)
  let daDoiTen = false
  try {
    for (let i = 2; i <= THU_TOI_DA && fs.existsSync(duong); i++) {
      duong = noi(`${goc} (${i})`)
      daDoiTen = true
    }
  } catch (e) {
    throw loiGhi(e)
  }
  if (fs.existsSync(duong)) throw new Error(dich('Cạnh video đã có quá nhiều file cùng tên — dọn bớt rồi xuất lại.'))
  try {
    fs.writeFileSync(duong, BOM + crlf(chu), 'utf8')
  } catch (e) {
    throw loiGhi(e)
  }
  let soByte = 0
  try {
    soByte = Number(fs.statSync(duong).size) || 0
  } catch {
    /* đọc lại không được thì thôi — file đã ghi xong */
  }
  return { duong: String(duong).replace(/\\/g, '/'), daDoiTen, soByte }
}

/**
 * Tải về bằng thẻ `a[download]` — đường dùng khi chạy NGOÀI Premiere (chế độ thử
 * trên trình duyệt, không có Node và cũng không có file media trên đĩa).
 */
export function taiVe(tenFile: string, chu: string): void {
  const b = new Blob([BOM + crlf(chu)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(b)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = tenFile
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.parentNode?.removeChild(a)
  } finally {
    // Thu hồi NGAY là có trình duyệt huỷ luôn lần tải — chờ một nhịp.
    window.setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}
