/**
 * CHẾ ĐỘ THỬ NGOÀI PREMIERE — để đo giao diện trên trình duyệt thường.
 *
 * Mở `http://localhost:5179/?dem=/@fs/E:/…/<tên>.autocut-nghe.json` (Vite dev
 * phục vụ file ngoài dự án qua `/@fs/`). Panel đọc thẳng file đệm nghe, dựng
 * một VÙNG GIẢ gồm đúng 1 clip phủ cả file, rồi đưa qua CHÍNH các hàm thật
 * `dungNoiDung` → `timKhoi` → `lamKhoi` như trong Premiere. Thứ khác duy nhất
 * là không có Premiere: các nút ghi (marker, sequence) báo "Chỉ chạy trong
 * Premiere"; bấm câu thì đầu đọc GIẢ nhảy theo (để thử phần tô sáng).
 *
 * ☠️ Chỉ bật khi `isInHost() === false` — App kiểm trước khi gọi. Trong
 * Premiere tham số `?dem` bị bỏ qua hoàn toàn: file đệm cạnh video KHÔNG được
 * phép thay cho vùng thật người dùng đã chọn.
 */
import { dich } from '../ngonngu'
import type { BanNghe, KetQuaNghe, VungLam } from '../services/kieu'
import { dp } from './chung'

/** Giá trị `?dem=` trên URL; '' nếu không có. */
export function thamSoDem(): string {
  try {
    return new URLSearchParams(window.location.search).get('dem') || ''
  } catch {
    return ''
  }
}

export async function docDemThu(url: string): Promise<{ vung: VungLam; ban: BanNghe[] }> {
  let j: any
  try {
    const r = await fetch(url)
    if (!r.ok) throw new Error(String(r.status))
    // ☠️ Đo 19/09: file đệm ở E:/2026/Test qua `/@fs/` đọc được; file ở ổ G:
    // và bản chép ở ổ C: thì Vite dev KHÔNG phục vụ mà trả trang index.html, mã
    // 200 (khởi động lại Vite vẫn vậy; file .mjs cùng thư mục ổ C: thì được) —
    // CHƯA rõ gốc. Không chặn ở đây thì ra lỗi JSON khó hiểu. Đường vòng: đặt
    // `?dem=` là URL của một máy chủ tĩnh khác có bật CORS.
    if ((r.headers.get('content-type') || '').indexOf('html') >= 0) throw new Error('Vite trả HTML thay vì JSON')
    j = await r.json()
  } catch (e) {
    throw new Error(dp('Không đọc được file đệm thử: {e}', { e: e instanceof Error ? e.message : String(e) }))
  }
  if (!j || !Array.isArray(j.cau) || !j.cau.length) throw new Error(dich('File đệm thử không đúng định dạng.'))

  // Đệm v1 (Autocut) luôn nghe bằng `-l vi` và không ghi ngôn ngữ.
  const v1 = j.phienBan === 1
  const ket: KetQuaNghe = {
    cau: j.cau,
    tu: Array.isArray(j.tu) ? j.tu : [],
    ngonNgu: typeof j.ngonNgu === 'string' && j.ngonNgu ? j.ngonNgu : v1 ? 'vi' : '',
  }
  const ten = decodeURIComponent(url.split(/[\\/]/).pop() || 'thu').replace(/\.autocut-nghe\.json$/i, '')
  const path = 'thu/' + ten
  let dai = 0
  for (const c of ket.cau) if (c.den > dai) dai = c.den

  const vung: VungLam = {
    seqId: 'dev',
    seqName: ten,
    fps: 25,
    cheDo: 'io',
    vungTu: 0,
    vungDen: dai,
    clips: [{ kind: 'V', trackIdx: 0, clipOrd: 0, seqTu: 0, seqDen: dai, srcTu: 0, srcDen: dai, speed: 1, path }],
    soTat: 0,
    chongLan: 0,
  }
  const ban: BanNghe[] = [{ path, ket, nguon: v1 ? 'dem-v1' : 'dem-v2', moHinh: String(j.moHinh || '') }]
  return { vung, ban }
}
