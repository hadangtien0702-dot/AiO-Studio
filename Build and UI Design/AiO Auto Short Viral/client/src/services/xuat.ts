/**
 * xuat.ts — SỐ LIỆU của tab "Toàn bộ lời" + xuất .txt / .srt.
 *
 * THUẦN: không Node, không CEP, không React, không `dich()`. Chỉ ăn `CauSeq[]`
 * (đã quy về trục SEQUENCE ở `moc.ts`) và nhả ra số / chuỗi. Nhờ vậy kiểm được
 * bằng số ngoài Premiere: `cd client && npm run kiem` (mục (7) của
 * `tests/kiem-hoidap.mjs`).
 *
 * Việc ghi ra đĩa / tải về / chép vào bộ nhớ tạm nằm ở `luuRa.ts` (cần Node và
 * DOM) — tách ra để phần sinh chữ kiểm được mà không cần panel.
 *
 * ── Ba quyết định về NỘI DUNG xuất ra, đều cố ý ──
 * 1. **Bỏ câu BỊA** (`CauSeq.bia`) khỏi cả .txt và .srt. Giao diện hiện nó là
 *    "không nghe rõ" chứ không hiện chữ, nên xuất nguyên văn chữ máy tự bịa
 *    ("Hãy subscribe cho kênh…") vào file phụ đề là đưa rác cho người dùng.
 *    Trả về `soBoBia` để bên vẽ NÓI RA đã bỏ bao nhiêu — đừng bỏ im lặng.
 * 2. **KHÔNG sửa chữ của câu tin cậy thấp** (`tinCayThap`). Chữ đó là lời thật,
 *    chỉ máy nghe không chắc; thêm dấu "(?)" vào là làm hỏng file phụ đề. Muốn
 *    biết câu nào đáng soát thì xem trong panel (có gạch chân báo).
 * 3. **Không gộp, không cắt, không dịch mốc.** Mốc trong file = giây TUYỆT ĐỐI
 *    trên sequence, y như panel hiện. Mở file ra là đối chiếu được với Timeline.
 *
 * ☠️ Chuỗi trả về CHỈ dùng `\n`. Đổi sang CRLF là việc của `luuRa.ts`, làm ĐÚNG
 * MỘT LẦN lúc ghi file (trộn `\n` với `\r\n` trong một file: brain bài 5h).
 */

import type { CauSeq } from './kieu'

// ═══════════════════════════════ SỐ LIỆU ═══════════════════════════════

export interface SoLieuLoi {
  /** Tổng số câu (kể cả bịa) — đây là MẪU SỐ của mọi số còn lại. */
  soCau: number
  /**
   * Thời lượng NÓI: hợp của các khoảng [tu, den) của câu KHÔNG bịa.
   * Hợp (union), không phải tổng: hai câu chồng mốc (mảnh câu từ hai clip đặt
   * cạnh nhau) thì cộng dồn là đếm hai lần. Khoảng lặng giữa các câu không tính.
   */
  giayNoi: number
  /**
   * Số câu máy nghe KHÔNG CHẮC (`tinCayThap`) mà KHÔNG phải câu bịa.
   * ☠️ Trừ câu bịa ra để hai con số không đè nhau — gộp "có ghi nhận" với "có
   * vi phạm" là kiểu phóng đại brain bài 5k-ter đã trả giá.
   */
  soNghiNgo: number
  /** Số câu máy tự bịa (`bia`). */
  soBia: number
  /**
   * Số câu THẬT (`soCau − soBia`) — MẪU SỐ của `soNghiNgo`.
   * ☠️ Thêm 21/09 sau soát: `soNghiNgo` đếm trên tập KHÔNG bịa, mà bên vẽ lại in
   * kèm `soCau` (tổng, kể cả bịa) → hai con số khác mẫu số. Ca lộ ra: Conspiracy
   * 363 câu, 53 câu bịa → màn hình ghi "không chắc N/363" trong khi N chỉ chạy
   * trên 310 câu thật. Tỉ lệ phải ghi ĐÚNG mẫu số của tử số — brain bài 5k-bis.
   */
  soThat: number
}

export function soLieuLoi(cau: readonly CauSeq[]): SoLieuLoi {
  const ds = cau || []
  let soBia = 0
  let soNghiNgo = 0
  const khoang: [number, number][] = []
  for (const c of ds) {
    if (c.bia) {
      soBia++
      continue
    }
    if (c.tinCayThap) soNghiNgo++
    if (c.den > c.tu) khoang.push([c.tu, c.den])
  }
  khoang.sort((a, b) => a[0] - b[0])
  let giayNoi = 0
  let dau = 0
  let cuoi = -1
  for (const [a, b] of khoang) {
    if (cuoi < 0) {
      dau = a
      cuoi = b
      continue
    }
    if (a <= cuoi) {
      if (b > cuoi) cuoi = b
      continue
    }
    giayNoi += cuoi - dau
    dau = a
    cuoi = b
  }
  if (cuoi >= 0) giayNoi += cuoi - dau
  return { soCau: ds.length, giayNoi, soNghiNgo, soBia, soThat: ds.length - soBia }
}

// ═══════════════════════════════ MỐC .SRT ═══════════════════════════════

function hai(x: number): string {
  return x < 10 ? '0' + x : String(x)
}

/**
 * Mốc chuẩn SubRip: `HH:MM:SS,mmm` (dấu PHẨY trước mili-giây, không phải dấu chấm).
 *
 * ☠️ Làm tròn về mili-giây TRƯỚC rồi mới chia giờ/phút/giây, để 59,9996 s ra
 * `00:01:00,000` chứ không ra `00:00:59,1000`. Chia trước rồi tròn từng phần là
 * lỗi nhớ-số cổ điển, và nó chỉ lộ ra ở đúng mấy ca sát mép.
 * Giây âm / NaN → `00:00:00,000` (mốc âm không có nghĩa trên timeline).
 */
export function mocSrt(giay: number): string {
  const ms = Number.isFinite(giay) && giay > 0 ? Math.round(giay * 1000) : 0
  const g = Math.floor(ms / 1000)
  const le = ms - g * 1000
  const h = Math.floor(g / 3600)
  const p = Math.floor((g % 3600) / 60)
  const s = g % 60
  return `${hai(h)}:${hai(p)}:${hai(s)},${le < 100 ? (le < 10 ? '00' : '0') : ''}${le}`
}

/** Mốc ngắn cho .txt và cho chỗ chép một câu: `m:ss` hoặc `h:mm:ss`. */
export function mocNgan(giay: number): string {
  const g = Number.isFinite(giay) && giay > 0 ? Math.floor(giay + 1e-9) : 0
  const h = Math.floor(g / 3600)
  const p = Math.floor((g % 3600) / 60)
  const s = g % 60
  return h > 0 ? `${h}:${hai(p)}:${hai(s)}` : `${p}:${hai(s)}`
}

// ═══════════════════════════════ XUẤT ═══════════════════════════════

export interface KetXuat {
  chu: string
  /** Số câu THẬT SỰ có trong file. */
  soCau: number
  /** Số câu bịa đã bỏ — bên vẽ phải nói ra. */
  soBoBia: number
  /**
   * Số mốc bị KÉO DÀI thêm 1 ms vì `den <= tu` (câu một từ, mốc cuối hụt).
   * Cue dài 0 thì trình phát bỏ qua. Chỉ .srt cần, .txt luôn 0.
   */
  soKeoDai: number
  /**
   * Số cue có mốc cuối vượt qua mốc đầu của cue kế tiếp (phụ đề đè nhau).
   * KHÔNG tự sửa — sửa là bóp méo mốc thật. Báo ra để soát. .txt luôn 0.
   */
  soChongLan: number
}

/** Một dòng .txt / một câu khi chép: `m:ss` + TAB + chữ (tab để dán được vào bảng). */
export function dongTxt(c: CauSeq): string {
  return mocNgan(c.tu) + '\t' + String(c.chu || '').replace(/\s+/g, ' ').trim()
}

/** Toàn bộ lời dạng chữ trơn, mỗi câu một dòng. Không có dòng tiêu đề. */
export function xuatTxt(cau: readonly CauSeq[]): KetXuat {
  const ra: string[] = []
  let soBoBia = 0
  for (const c of cau || []) {
    if (c.bia) {
      soBoBia++
      continue
    }
    ra.push(dongTxt(c))
  }
  return { chu: ra.length ? ra.join('\n') + '\n' : '', soCau: ra.length, soBoBia, soKeoDai: 0, soChongLan: 0 }
}

/** Mốc cuối hụt thì kéo thêm bấy nhiêu giây (1 ms) — cue dài 0 bị trình phát bỏ. */
const KEO_TOI_THIEU = 0.001

/**
 * Phụ đề SubRip. Khối: số thứ tự · `mốc --> mốc` · chữ · dòng trống.
 * Thứ tự giữ nguyên thứ tự câu trong mảng (đã sắp theo thời gian ở `moc.ts`).
 */
export function xuatSrt(cau: readonly CauSeq[]): KetXuat {
  const giu: CauSeq[] = []
  let soBoBia = 0
  for (const c of cau || []) {
    if (c.bia) soBoBia++
    else giu.push(c)
  }
  let soKeoDai = 0
  let soChongLan = 0
  const ra: string[] = []
  for (let i = 0; i < giu.length; i++) {
    const c = giu[i]
    let den = c.den
    if (!(den > c.tu)) {
      den = c.tu + KEO_TOI_THIEU
      soKeoDai++
    }
    if (i + 1 < giu.length && den > giu[i + 1].tu + 1e-9) soChongLan++
    ra.push(
      String(i + 1) +
        '\n' +
        mocSrt(c.tu) +
        ' --> ' +
        mocSrt(den) +
        '\n' +
        String(c.chu || '').replace(/\s+/g, ' ').trim() +
        '\n',
    )
  }
  return { chu: ra.join('\n'), soCau: giu.length, soBoBia, soKeoDai, soChongLan }
}

// ═══════════════════════════════ TÊN FILE ═══════════════════════════════

/** Ký tự Windows không cho nằm trong tên file (`\ / : * ? " < > |`) + ký tự điều khiển. */
const KY_TU_CAM = /[\x00-\x1f<>:"/\\|?*]+/g

/**
 * Tên file an toàn trên Windows: bỏ ký tự cấm, bỏ dấu cách / dấu chấm ở cuối
 * (Explorer tự cắt, thành ra tên khác tên mình xin), chặn tên thiết bị cũ
 * (CON, PRN, AUX, NUL, COM1…, LPT1… — mở được nhưng ghi vào là mất dữ liệu).
 */
export function tenFileSach(s: string, dungSan = 'khong-ten'): string {
  let t = String(s || '')
    .replace(KY_TU_CAM, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(t)) t = t + '_'
  return t || dungSan
}
