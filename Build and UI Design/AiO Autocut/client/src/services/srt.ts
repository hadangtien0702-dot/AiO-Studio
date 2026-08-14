/**
 * srt.ts — quy đổi mốc thời gian của phụ đề, và sinh file .srt.
 *
 * ĐÂY LÀ MẮT XÍCH QUAN TRỌNG NHẤT của phần phụ đề.
 *
 * Whisper nghe trên **file gốc** nên mốc thời gian là mốc của file gốc. Nhưng
 * phụ đề phải gắn lên **sequence đã cắt**, nơi các khoảng lặng đã biến mất và
 * mọi thứ phía sau đã dồn lên. Hai trục thời gian đó khác nhau.
 *
 * May là ta biết chính xác cách dồn: chính bảng "đoạn cần giữ" đã dùng để cắt.
 * Nên không cần render lại tiếng của bản đã cắt rồi nghe lại — chỉ cần quy đổi.
 * Đây đúng là chỗ dự án anh em AiO Sub đã vấp (họ phải tách hẳn module timecode
 * với 2 chiến lược), nên làm thuần và kiểm được bằng số.
 */

import type { Segment } from './plan'

/**
 * Một câu nghe được, thời gian tính trên FILE GỐC.
 *
 * Cố ý khai báo ở đây chứ không ở `whisper.ts`: file này phải THUẦN để chạy
 * kiểm được ngoài Premiere (`npm run kiem`). Nhập kiểu từ `whisper.ts` là kéo
 * theo cả `lib/node`, và bộ kiểm hết chạy độc lập.
 */
export interface Cau {
  tu: number
  den: number
  chu: string
}

/** Một đoạn giữ, kèm vị trí của nó trên sequence mới. */
export interface Moc {
  srcTu: number
  srcDen: number
  seqTu: number
}

/**
 * Dựng bảng quy đổi từ danh sách đoạn cần giữ.
 * Các đoạn được đặt LIÊN TIẾP nên vị trí trên sequence là tổng dồn độ dài.
 */
export function dungBangQuyDoi(keeps: Segment[]): Moc[] {
  const ra: Moc[] = []
  let moc = 0
  for (const k of keeps) {
    ra.push({ srcTu: k.start, srcDen: k.end, seqTu: moc })
    moc += k.end - k.start
  }
  return ra
}

/** Một clip THẬT trên sequence: nó lấy đoạn `[srcTu, srcDen]` của file gốc và đặt tại `seqTu`. */
export interface ClipMoc {
  srcTu: number
  srcDen: number
  seqTu: number
}

/**
 * [2.0.0] Dựng bảng quy đổi từ CÁC CLIP THẬT đang nằm trên sequence.
 *
 * Vì sao phải có hàm này, và vì sao `dungBangQuyDoi` KHÔNG thay được nó:
 *
 * `dungBangQuyDoi` giả định các đoạn nằm LIÊN TIẾP, nên nó tự cộng dồn độ dài
 * để suy ra vị trí trên sequence. Đúng khi ta vừa tự dựng sequence đó ra.
 * Nhưng khi người dùng bấm LÀM PHỤ ĐỀ cho một sequence **đã có sẵn**, các clip
 * có thể HỞ nhau — cộng dồn là trượt hết mốc.
 *
 * Ở đây ta biết vị trí thật của từng clip (`seqTu` đọc từ Premiere) nên dùng
 * thẳng, không suy diễn.
 *
 * ☠️ LỖI ĐÃ TRẢ GIÁ (29/07/2026): trước bản này, phụ đề chỉ lấy `clips[0]` làm
 * cả bảng quy đổi. Chạy trên sequence 17 clip do Auto Cut sinh ra thì bảng chỉ
 * có đoạn `[0 → 3,36]`, nên **15 trên 16 câu rơi ra ngoài bảng và bị bỏ** —
 * file .srt ra đúng 1 câu / 136 byte mà KHÔNG báo lỗi gì.
 *
 * @param clips  các clip trong vùng, cùng MỘT file gốc
 * @param gocSeq mốc 0 của phụ đề trên sequence (thường là đầu vùng I–O)
 */
export function dungBangTuClip(clips: ClipMoc[], gocSeq = 0): Moc[] {
  return clips
    .slice()
    .sort((a, b) => a.seqTu - b.seqTu)
    .map((c) => ({ srcTu: c.srcTu, srcDen: c.srcDen, seqTu: c.seqTu - gocSeq }))
}

/** Đổi một mốc trên file gốc sang mốc trên sequence. -1 nếu rơi đúng vào đoạn đã bỏ. */
export function doiMoc(bang: Moc[], t: number): number {
  for (const m of bang) {
    if (t >= m.srcTu && t <= m.srcDen) return m.seqTu + (t - m.srcTu)
  }
  return -1
}

/**
 * Quy đổi một câu sang trục thời gian của sequence đã cắt.
 *
 * Câu có thể chớm vào phần đã bị bỏ (Whisper cắt câu ở khoảng lặng, mà ta cũng
 * cắt ở đó — hai bên lệch nhau vài phần mười giây là thường). Khi đó:
 *   - đầu câu rơi vào chỗ đã bỏ  -> kéo tới đầu đoạn giữ kế tiếp
 *   - cuối câu rơi vào chỗ đã bỏ -> lùi về cuối đoạn giữ liền trước
 * Không còn chỗ nào hợp lệ thì bỏ câu, chứ không bịa mốc.
 */
export function quyDoiCau(bang: Moc[], cau: Cau): { tu: number; den: number } | null {
  if (!bang.length) return null

  let tu = doiMoc(bang, cau.tu)
  if (tu < 0) {
    const sau = bang.find((m) => m.srcTu >= cau.tu)
    if (!sau) return null
    tu = sau.seqTu
  }

  let den = doiMoc(bang, cau.den)
  if (den < 0) {
    let truoc: Moc | null = null
    for (const m of bang) if (m.srcDen <= cau.den) truoc = m
    if (!truoc) return null
    den = truoc.seqTu + (truoc.srcDen - truoc.srcTu)
  }

  if (den - tu < 0.08) return null // ngắn hơn 2 khung: đọc không kịp, bỏ
  return { tu, den }
}

/** Một từ kèm điểm tin cậy (bản sao kiểu, để file này giữ THUẦN — kiểm được ngoài Premiere). */
export interface TuTinCay {
  chu: string
  giay: number
  p: number
}

/** Một chỗ đáng nghe lại, mốc đã quy đổi sang sequence đã cắt. */
export interface ChoSoat {
  chu: string
  /** Giây trên SEQUENCE ĐÃ CẮT — dùng đặt marker. */
  giay: number
  p: number
}

/**
 * Chọn những chỗ đáng nghe lại và quy đổi mốc sang sequence đã cắt.
 *
 * Vì sao dùng được: đo thật 2026-07-28, 5 chỗ Whisper nghe sai xếp hạng 1, 2, 3,
 * 5, 8 trong 330 từ kém tin cậy nhất — trong khi cùng những chữ ấy ở chỗ nghe
 * ĐÚNG được 0,997–1,000. Máy tự biết chỗ nào nó đoán mò.
 *
 * @param nguong điểm dưới mức này thì đánh dấu. 0,6 cho ra 1,5% số từ.
 * @param toiDa  trần số marker — video vài tiếng có thể ra hàng trăm chỗ, rải
 *               kín timeline thì marker mất tác dụng. Lấy những chỗ TỆ NHẤT.
 */
export function chonChoSoat(
  tu: TuTinCay[],
  keeps: Segment[],
  nguong = 0.6,
  toiDa = 60,
  /** [2.0.0] Bảng quy đổi dựng sẵn (từ `dungBangTuClip`). Có thì dùng, khỏi suy từ `keeps`. */
  bangSan?: Moc[],
): ChoSoat[] {
  const bang = bangSan ?? dungBangQuyDoi(keeps)
  const ra: ChoSoat[] = []
  for (const t of tu) {
    if (t.p >= nguong) continue
    const g = doiMoc(bang, t.giay)
    if (g < 0) continue // rơi vào đoạn đã bị cắt bỏ — khỏi đánh dấu
    ra.push({ chu: t.chu, giay: g, p: t.p })
  }
  // Tệ nhất lên trước, cắt lấy `toiDa`, rồi xếp lại theo thời gian cho dễ đi tuần tự.
  ra.sort((a, b) => a.p - b.p)
  return ra.slice(0, toiDa).sort((a, b) => a.giay - b.giay)
}

/** Một cặp sửa từ: nghe nhầm -> đúng. */
export interface ThayTu {
  sai: string
  dung: string
}

/**
 * Bảng sửa mặc định — **CỐ Ý RỖNG**.
 *
 * ☠️ [2.0.0] TRƯỚC ĐÂY BẢNG NÀY CÓ SẴN 6 CẶP, VÀ ĐÓ LÀ LỖI.
 *
 * Sáu cặp đó đo được trên clip **bảo hiểm** của anh Tiến ngày 28/07:
 *   chia trẻ → chi trả · chỉ chỉ trả → chỉ chi trả · lại xuất → lãi suất
 *   lợi suất → lãi suất · tiền lợi → tiền lãi · quỷ dự phòng → quỹ dự phòng
 *
 * Anh Tiến bắt lỗi 29/07 khi mở một video **tuyển dụng** và thấy panel bày ra
 * mấy chữ đó: *"mấy cái từ này làm gì có trong video mới của anh?"*. Đúng —
 * chúng là thuật ngữ của MỘT chủ đề, không phải lỗi nghe chung của tiếng Việt.
 *
 * Ba lý do phải rỗng:
 *   1. Bán ra thì khách lạ mở tool lên thấy thuật ngữ bảo hiểm của người khác.
 *   2. `lợi suất → lãi suất` **SỬA BẬY**: "lợi suất" (yield) là từ đúng trong
 *      tài chính, khác hẳn "lãi suất". Ai làm video tài chính là bị sửa sai.
 *   3. Nó sửa **im lặng** — không báo gì, người dùng không biết mà kiểm.
 *
 * Cách dùng đúng: người dùng tự thêm cặp của NGÀNH MÌNH bằng nút "+ Thêm một
 * cặp". Thêm xong lưu vào `localStorage`, sống mãi trên máy đó.
 *
 * Vì sao vẫn cần tính năng này: đã thử mồi từ vựng cho Whisper (`--prompt`) và
 * **không sửa được chữ nào**, còn làm "quỹ" thành "quỷ". Đây là lỗi NGHE (giọng
 * miền Nam), không phải lỗi thiếu từ vựng — nên phải sửa sau khi nhận dạng.
 */
export const THAY_TU_MAC_DINH: ThayTu[] = []

/* ══════════════════════════════════════════════════════════════════════════
   CẮT CÂU DÀI + XUỐNG DÒNG — cho phụ đề ĐỌC KỊP
   ══════════════════════════════════════════════════════════════════════════

   ☠️ Vì sao phải có: đo thật 2026-07-29 trên video 60 phút (765 câu) do chính
   tool này xuất ra:

     dài hơn 42 ký tự  : 79%      (một dòng phụ đề chuẩn chỉ 42)
     dài hơn 84 ký tự  : 34%      (tức tràn quá 2 dòng)
     câu dài nhất      : 193 ký tự hiện trong 9,6 giây

   Một khối 193 ký tự là một bức tường chữ — người xem đọc không nổi. Đây là
   thứ editor nhìn một cái là thấy, nên bán ra mà để vậy là hỏng.

   ⚠️ NÓI RÕ GIỚI HẠN: cắt khối chỉ chữa ĐỘ DÀI MỖI KHỐI, **không chữa được
   tốc độ đọc**. Người nói nhanh 25 ký tự/giây thì cắt kiểu gì cũng vẫn 25
   ký tự/giây — chia 3 khối thì mỗi khối cũng chỉ hiện 1/3 thời gian. Cái cắt
   được là: thay vì một bức tường, người xem đọc ba mẩu nối nhau. */

/** Giới hạn của một khối phụ đề. Theo chuẩn nghề (Netflix/BBC). */
export interface GioiHanPhuDe {
  /** Tối đa bao nhiêu ký tự MỘT DÒNG. */
  kyTuMoiDong: number
  /** Tối đa bao nhiêu DÒNG một khối. */
  soDongToiDa: number
  /** Khối ngắn hơn ngần này giây thì nhìn như chớp — cố không cắt ra nữa. */
  giayToiThieu: number
}

export const GIOI_HAN_MAC_DINH: GioiHanPhuDe = {
  kyTuMoiDong: 42,
  soDongToiDa: 2,
  giayToiThieu: 1.0,
}

/**
 * Vẽ chuỗi thành các DÒNG, mỗi dòng ≤ `rong` ký tự, cắt ở khoảng trắng.
 *
 * ☠️ Đây là hàm NỀN, mọi thứ khác phải hỏi nó. Bản đầu tiên (29/07) làm ngược:
 * cắt khối ở trần 84 trước, rồi mới chia đôi — nhưng chia đôi ở ranh giới TỪ
 * thì hai dòng không bao giờ đều, dòng sau lòi ra **45 ký tự**. Bộ tự kiểm bắt
 * được 39 dòng như vậy trên dữ liệu thật.
 * → Sửa: để việc VẼ DÒNG quyết định chỗ cắt, không đoán bằng số ký tự.
 */
function veDong(chu: string, rong: number): string[] {
  const dong: string[] = []
  let nay = ''
  for (const tu of chu.split(' ')) {
    const thu = nay ? nay + ' ' + tu : tu
    if (thu.length <= rong) {
      nay = thu
      continue
    }
    if (nay) dong.push(nay)
    nay = tu // một từ dài hơn cả dòng thì đành để nó tràn, còn hơn cắt giữa từ
  }
  if (nay) dong.push(nay)
  return dong
}

/** Khối này vẽ ra bao nhiêu dòng. */
function demDong(chu: string, gh: GioiHanPhuDe): number {
  return veDong(chu, gh.kyTuMoiDong).length
}

/**
 * Cắt một câu dài thành nhiều khối phụ đề, chia thời gian theo ĐỘ DÀI CHỮ.
 *
 * Câu vừa vặn thì trả về nguyên nó (mảng 1 phần tử) — không đụng vào.
 *
 * ☠️ Không cắt nếu cắt xong khối con ngắn hơn `giayToiThieu`: phụ đề chớp
 * 0,3 giây còn khó chịu hơn một dòng hơi dài.
 */
export function catCauDai(cau: Cau, gh: GioiHanPhuDe = GIOI_HAN_MAC_DINH): Cau[] {
  const chu = cau.chu.trim().replace(/\s+/g, ' ')
  if (!chu) return []
  if (demDong(chu, gh) <= gh.soDongToiDa) return [{ ...cau, chu }]

  const tongGiay = cau.den - cau.tu

  // ── Gom TỪ vào khối, dừng ngay trước khi tràn quá số dòng cho phép ──
  // Làm kiểu này thì ràng buộc "mỗi dòng ≤ 42, mỗi khối ≤ 2 dòng" được bảo đảm
  // theo cấu tạo, không phải kiểm lại sau.
  const manh: string[] = []
  let nay = ''
  for (const tu of chu.split(' ')) {
    const thu = nay ? nay + ' ' + tu : tu
    if (demDong(thu, gh) <= gh.soDongToiDa) {
      nay = thu
      continue
    }
    if (nay) manh.push(nay)
    nay = tu
  }
  if (nay) manh.push(nay)

  // Cắt ra mà mỗi khối chớp quá nhanh thì thà để nguyên một dòng hơi dài.
  if (tongGiay > 0 && tongGiay / manh.length < gh.giayToiThieu) return [{ ...cau, chu }]

  // ── Ưu tiên cắt ở chỗ người ta vốn ngắt hơi ──
  // Gom theo từ cho ra khối ĐÚNG LUẬT nhưng có thể cắt giữa mệnh đề. Nếu khối
  // đang xét kết thúc lửng mà lùi lại tới dấu câu gần nhất vẫn còn ≥ 60% độ
  // dài thì lùi — đọc thuận hơn hẳn.
  for (let i = 0; i < manh.length - 1; i++) {
    const m = manh[i]
    const dau = Math.max(m.lastIndexOf('. '), m.lastIndexOf('? '), m.lastIndexOf('! '))
    const ve = Math.max(m.lastIndexOf(', '), m.lastIndexOf('; '), m.lastIndexOf(': '))
    const cat = dau > m.length * 0.6 ? dau + 1 : ve > m.length * 0.6 ? ve + 1 : -1
    if (cat > 0 && cat < m.length) {
      manh[i] = m.slice(0, cat).trim()
      manh[i + 1] = (m.slice(cat).trim() + ' ' + manh[i + 1]).trim()
      // Đẩy sang khối sau có thể làm nó tràn — vẽ lại cho chắc.
      if (demDong(manh[i + 1], gh) > gh.soDongToiDa) {
        // Trả lại như cũ, thà cắt giữa vế còn hơn làm hỏng khối sau.
        manh[i + 1] = manh[i + 1].slice(m.length - cat).trim()
        manh[i] = m
      }
    }
  }

  // ── Chia thời gian theo TỈ LỆ CHỮ — mẩu dài được hiện lâu hơn ──
  const tongChu = manh.reduce((t, x) => t + x.length, 0) || 1
  const ra: Cau[] = []
  let moc = cau.tu
  for (let i = 0; i < manh.length; i++) {
    const den = i === manh.length - 1 ? cau.den : moc + (manh[i].length / tongChu) * tongGiay
    ra.push({ tu: moc, den, chu: manh[i] })
    moc = den
  }
  return ra
}

/**
 * Xuống dòng một khối cho CÂN, tối đa `soDongToiDa` dòng.
 *
 * Cân là quan trọng: `41 ký tự / 3 ký tự` đọc khó chịu hơn `22 / 22`. Nên
 * chia đều rồi mới tìm khoảng trắng gần chỗ chia nhất.
 */
export function xuongDong(chu: string, gh: GioiHanPhuDe = GIOI_HAN_MAC_DINH): string[] {
  const s = chu.trim().replace(/\s+/g, ' ')
  const dong = veDong(s, gh.kyTuMoiDong)

  // Đúng 2 dòng thì CÂN lại: `41 / 3` đọc khó chịu hơn `22 / 22`.
  // Cân bằng cách vẽ lại với bề rộng hẹp hơn, miễn vẫn ra đúng 2 dòng.
  if (dong.length === 2) {
    for (let rong = Math.ceil(s.length / 2); rong < gh.kyTuMoiDong; rong++) {
      const thu = veDong(s, rong)
      if (thu.length === 2) return thu
    }
  }
  return dong
}

/** Bỏ ký tự đặc biệt để ghép vào biểu thức tìm kiếm. */
function thoat(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Áp bảng sửa từ lên một câu. Không phân biệt hoa thường. */
export function suaTu(chu: string, bang: ThayTu[]): string {
  let ra = chu
  for (const t of bang) {
    if (!t.sai.trim()) continue
    ra = ra.replace(new RegExp(thoat(t.sai.trim()), 'gi'), t.dung)
  }
  return ra
}

/** Đổi giây -> "HH:MM:SS,mmm" theo chuẩn SRT. */
export function mocSrt(giay: number): string {
  const g = Math.max(0, giay)
  const ms = Math.round((g - Math.floor(g)) * 1000)
  const tong = Math.floor(g)
  const hh = Math.floor(tong / 3600)
  const mm = Math.floor((tong % 3600) / 60)
  const ss = tong % 60
  const p = (n: number, r = 2) => String(n).padStart(r, '0')
  return `${p(hh)}:${p(mm)}:${p(ss)},${p(ms, 3)}`
}

/**
 * Sinh nội dung file .srt cho sequence ĐÃ CẮT.
 *
 * @param cauGoc danh sách câu Whisper nghe được (mốc trên FILE GỐC)
 * @param keeps  các đoạn đã giữ lại khi cắt — chính là bảng quy đổi
 * @param bangSua bảng sửa từ nghe nhầm
 */
export function sinhSrt(
  cauGoc: Cau[],
  keeps: Segment[],
  bangSua: ThayTu[],
  /** [2.0.0] Bảng quy đổi dựng sẵn (từ `dungBangTuClip`). Có thì dùng, khỏi suy từ `keeps`. */
  bangSan?: Moc[],
  /** [2.0.0] Giới hạn khối phụ đề. Đặt `null` để giữ nguyên câu, không cắt. */
  gioiHan: GioiHanPhuDe | null = GIOI_HAN_MAC_DINH,
): { noiDung: string; soCau: number; soBo: number; soCatRa: number } {
  const bang = bangSan ?? dungBangQuyDoi(keeps)
  const ra: string[] = []
  let stt = 0
  let bo = 0
  let catRa = 0

  for (const c of cauGoc) {
    const m = quyDoiCau(bang, c)
    if (!m) {
      bo++
      continue
    }
    const chu = suaTu(c.chu, bangSua).trim()
    if (!chu) {
      bo++
      continue
    }

    // ☠️ Cắt SAU khi đã quy đổi mốc, KHÔNG cắt trước.
    // Quy đổi làm việc trên mốc của FILE GỐC; cắt trước là phải quy đổi lại
    // cho từng mẩu, mà mẩu có thể rơi vào chỗ đã bị cắt bỏ -> mất chữ.
    // Cắt sau thì mốc `m` đã nằm trên trục sequence, chia tỉ lệ là xong.
    const khoi = gioiHan
      ? catCauDai({ tu: m.tu, den: m.den, chu }, gioiHan)
      : [{ tu: m.tu, den: m.den, chu }]
    if (khoi.length > 1) catRa += khoi.length - 1

    for (const k of khoi) {
      stt++
      ra.push(String(stt))
      ra.push(`${mocSrt(k.tu)} --> ${mocSrt(k.den)}`)
      // ☠️ Đẩy TỪNG DÒNG vào mảng, đừng nối sẵn bằng '\n'. Cả file nối bằng
      // '\r\n'; nhét '\n' vào giữa là file trộn hai kiểu xuống dòng, có trình
      // phát đọc sai. Bản đầu 29/07 mắc đúng lỗi này, bộ tự kiểm bắt được.
      if (gioiHan) for (const d of xuongDong(k.chu, gioiHan)) ra.push(d)
      else ra.push(k.chu)
      ra.push('')
    }
  }

  return { noiDung: ra.join('\r\n'), soCau: stt, soBo: bo, soCatRa: catRa }
}
