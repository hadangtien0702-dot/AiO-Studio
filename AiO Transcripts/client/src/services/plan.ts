/**
 * plan.ts — quyết định CẮT Ở ĐÂU.
 *
 * Đây là lõi của cả công cụ, nên viết THUẦN (không Node, không CEP) để kiểm
 * được bằng số ngoài Premiere: `npm run kiem`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ ĐÃ THỬ DÙNG WHISPER LÀM "NGƯỜI GÁC CỔNG" — HỎNG. ĐỪNG LÀM LẠI.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Bản 0.5.0 đặt luật: chỉ cắt khi **biên độ thấp (FFmpeg) VÀ không nằm trong câu
 * nào (Whisper)**. Ý định đúng — sợ cắt vào chỗ ngắt hơi giữa câu. Nhưng:
 *
 *   1. Mốc CÂU của Whisper kéo dài tới tận đầu câu sau (nó chia audio theo đoạn
 *      30 giây rồi gán mốc thô). Video 58 phút có 2.033 câu nối đuôi nhau nên
 *      vùng "đang nói" phủ **99,2%** timeline.
 *   2. Mốc TỪ (`tokens[].offsets`) **cũng không cứu được**: đo 2026-07-28 trên
 *      13.563 từ — 1.391 từ có mốc kết thúc ≤ mốc bắt đầu, từ dài nhất 8,33 giây.
 *      Vùng từ vẫn phủ **95,5%**. Kết quả y hệt: 14 nhát cắt, 9,8 giây.
 *   3. Cờ `-dtw` (căn mốc bằng cross-attention) chạy lại mất 6 phút và ra file
 *      **giống hệt từng byte** — bản whisper.cpp đang dùng không hỗ trợ.
 *
 * Hậu quả: video 58 phút tìm 1.914 khoảng lặng mà chỉ cắt 14 chỗ, rút 9,8 giây.
 *
 * ── BẰNG CHỨNG QUYẾT ĐỊNH: đọc thẳng PCM của WAV, đo âm lượng THẬT ──
 *
 *      nhóm                     | số chỗ | đỉnh (trung vị) | RMS   | chỗ có tiếng
 *      -------------------------|--------|-----------------|-------|-------------
 *      đang BỊ Whisper chặn     |  1.837 |   -26,2 dBFS    | -37,4 |      0
 *      đang được cắt            |     15 |   -26,2 dBFS    | -37,1 |      0
 *
 * **Hai nhóm im ngang nhau.** Vùng bảo vệ không lọc được gì — nó chặn bừa, và
 * chặn mất 15,4 phút khoảng lặng trống trơn. Trên clip 82 giây cũng vậy: 18 chỗ
 * bị chặn có đỉnh -41 đến -60 dBFS, nhỏ hơn tiếng nói ~300 lần.
 *
 * Con số "23 chỗ đâm vào câu nói" hồi 0.5.0 được đếm **bằng chính mốc ẩu của
 * Whisper**, không đo bằng âm thanh. Đúng cái bẫy "số đo vô lý thì nghi CÔNG CỤ
 * ĐO trước" — xem ~/.claude/CLAUDE.md nguyên tắc 5.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * LUẬT HIỆN TẠI — MỘT NGUỒN, HAI NÚM CHỈNH
 * ══════════════════════════════════════════════════════════════════════════
 *
 *      cắt  ⟺  FFmpeg báo im  ≥ `minSilence` giây,  chừa `pad` ở hai đầu
 *
 * Whisper vẫn chạy, nhưng làm đúng hai việc nó giỏi: **phụ đề** và **đánh dấu
 * chỗ nghe không chắc**. Nó KHÔNG còn quyền phủ quyết điểm cắt.
 *
 * `pad` là thứ giữ cho câu không cụt hơi: mỗi mối nối còn lại `2 × pad` giây im
 * lặng. Đó cũng là ý nghĩa của ba mức Giữ nhịp / Vừa / Cắt sạch.
 *
 * ⚠️ CÒN NỢ: ngưỡng dB đang là số CỐ ĐỊNH nên không dùng chung được cho hai máy
 * quay. Đo thật: nền ồn file Heygen -46,7 dBFS, file iPhone -37,1 dBFS — nên mức
 * "Giữ nhịp" (-30 dB) trên file iPhone gần như không tìm ra gì (rút 3:21) trong
 * khi trên file Heygen thì ăn. Việc tiếp theo: tự đo nền ồn rồi đặt ngưỡng theo nền.
 */

import type { Silence } from './silencelog'

export interface Segment {
  start: number
  end: number
}

/**
 * Một câu Whisper nghe được, thời gian trên FILE GỐC.
 *
 * KHÔNG còn dùng để quyết định điểm cắt (xem khối đầu file) — chỉ còn dùng làm
 * phụ đề và để đếm xem có bao nhiêu nhát cắt rơi vào câu nói, in ra cho người
 * dùng tự soát.
 */
export interface CauNoi {
  tu: number
  den: number
}

export interface PlanOptions {
  /** Vùng của file gốc mà clip trên timeline đang dùng. */
  srcIn: number
  srcOut: number
  /** Chừa lại bao nhiêu giây im lặng ở hai đầu mỗi đoạn nói (nghe đỡ cụt hơi). */
  pad: number
  /** Cắt xong mà chỉ bỏ được ít hơn ngần này giây thì không bõ — bỏ qua. */
  minCut: number
  /** Đoạn giữ ngắn hơn ngần này giây thì vứt luôn (vụn, không nghe ra gì). */
  minKeep: number
  /** Tốc độ khung hình của FILE GỐC — dùng để làm tròn về đúng mốc khung. */
  fps: number
  /**
   * Câu Whisper nghe được — dùng làm **CHỐT CHẶN CUỐI**, không phải mặt nạ.
   *
   * Luật đúng một dòng: **một nhát cắt nuốt TRỌN nguyên một câu có chữ thì bỏ
   * nhát đó đi.** Không dùng mốc câu để khoanh vùng cấm (mốc đó ẩu, phủ 99%
   * timeline — xem khối đầu file), chỉ dùng dữ kiện *"chỗ này có người nói"*,
   * là thứ Whisper nói đáng tin.
   *
   * Vì mốc câu bị NỚI RỘNG chứ không bị co, phép thử "câu nằm gọn trong nhát
   * cắt" là phép thử **thận trọng**: câu nới rộng mà còn lọt trong nhát cắt thì
   * lời nói thật chắc chắn cũng lọt.
   *
   * Đo thật 2026-07-28 trên video 58 phút, số câu bị nuốt trọn:
   *      −22 dB: 234 → **0**  ·  −25 dB: 27 → **0**  ·  −30 dB: 1 → **0**
   */
  cauNoi?: CauNoi[]
}

export interface Plan {
  keeps: Segment[]
  /** Các khoảng thật sự bị bỏ đi (đã trừ phần đệm hai đầu). */
  cuts: Segment[]
  /** Thời lượng gốc của clip trên timeline (giây). */
  truoc: number
  /** Thời lượng sau khi cắt (giây). */
  sau: number
  /** Số giây tiết kiệm được. */
  tietKiem: number
  /**
   * Bao nhiêu khoảng lặng bị bỏ qua vì sau khi chừa đệm thì còn ngắn hơn `minCut`.
   *
   * Con số này thay cho `soBoVeBoiCauNoi` cũ. Nó là thứ giải thích được vì sao
   * "tìm ra N khoảng lặng mà chỉ cắt M chỗ" — nếu chênh lệch lớn thì đệm đang
   * nuốt hết khoảng lặng, phải hạ `pad` hoặc nâng `minSilence`.
   */
  soBoViQuaNgan: number
  /** Bao nhiêu nhát cắt bị chốt chặn giữ lại vì nuốt trọn một câu nói. */
  soCuuBoiCauNoi: number
}

/**
 * Đếm xem trong `cuts` có bao nhiêu nhát nuốt TRỌN một câu nói.
 *
 * Cả hai danh sách đều tăng dần nên chạy con trỏ, không lồng hai vòng —
 * 1.914 nhát × 2.033 câu mà lồng nhau là 3,9 triệu phép, video 3 tiếng thì gấp ba.
 */
export function demCauBiNuot(cuts: Segment[], cauNoi: CauNoi[], saiSo = 0.02): number {
  let n = 0
  let k = 0
  for (const c of cuts) {
    while (k > 0 && cauNoi[k - 1].den > c.start) k--
    while (k < cauNoi.length && cauNoi[k].den < c.start) k++
    for (let m = k; m < cauNoi.length && cauNoi[m].tu < c.end; m++) {
      if (cauNoi[m].tu >= c.start - saiSo && cauNoi[m].den <= c.end + saiSo) n++
    }
  }
  return n
}

/** Một ngưỡng đã thử: cắt được bao nhiêu, và nuốt mất bao nhiêu câu. */
export interface ThuNguong {
  noiseDb: number
  tietKiem: number
  soCauBiNuot: number
}

/**
 * Chọn ngưỡng dB: lấy cái **mạnh tay nhất mà không nuốt trọn câu nào**.
 *
 * Vì sao dò thay vì tính bằng công thức: đo thật 2026-07-28 cho thấy không có
 * công thức nào bắc được cầu giữa hai file của anh Tiến. Nền ồn cách giọng 63,6 dB
 * ở clip studio nhưng chỉ 14,6 dB ở video quay iPhone hai người — ở file sau,
 * giọng người ngồi xa **nằm lọt trong chính cụm "im lặng"**, Otsu cũng không tách
 * được. Nên đừng đoán hệ số: thử vài ngưỡng rồi lấy cái đạt.
 *
 * @param nganSach cho phép nuốt tối đa mấy câu (0 = tuyệt đối không).
 */
export function chonNguong(daThu: ThuNguong[], nganSach = 0): ThuNguong | null {
  const dat = daThu.filter((t) => t.soCauBiNuot <= nganSach)
  if (!dat.length) {
    // Không cái nào đạt -> lấy cái nuốt ít nhất, hoà thì lấy cái nhẹ tay hơn.
    const sx = daThu.slice().sort((a, b) => a.soCauBiNuot - b.soCauBiNuot || a.noiseDb - b.noiseDb)
    return sx[0] ?? null
  }
  // Đạt rồi thì lấy cái CẮT ĐƯỢC NHIỀU NHẤT, không phải cái ngưỡng cao nhất:
  // ngưỡng cao hơn không phải lúc nào cũng cắt được nhiều hơn.
  return dat.slice().sort((a, b) => b.tietKiem - a.tietKiem)[0]
}

/** Làm tròn về đúng mốc khung hình — tránh sai số dồn lại sau vài chục đoạn. */
function snap(x: number, fps: number): number {
  if (!(fps > 0)) return x
  return Math.round(x * fps) / fps
}

/** Gộp các khoảng chồng lên nhau / dính nhau thành một. */
function gopKhoang(ds: Segment[]): Segment[] {
  const sx = ds.slice().sort((a, b) => a.start - b.start)
  const ra: Segment[] = []
  for (const c of sx) {
    const cuoi = ra[ra.length - 1]
    if (cuoi && c.start <= cuoi.end) cuoi.end = Math.max(cuoi.end, c.end)
    else ra.push({ ...c })
  }
  return ra
}

/**
 * Trừ `vungCam` ra khỏi `khoang`.
 *
 * Một khoảng bị vùng cấm cắt ngang thì vỡ thành hai mảnh hai bên; bị trùm trọn
 * thì biến mất.
 *
 * Giữ lại dù `lapKeHoach` không còn gọi: nó là hàm thuần, đã có phép kiểm riêng,
 * và sẽ cần lại khi làm bước "chừa vùng người dùng khoá tay".
 */
export function truVung(khoang: Segment[], vungCam: Segment[]): Segment[] {
  let ra = khoang
  for (const c of vungCam) {
    const moi: Segment[] = []
    for (const k of ra) {
      if (c.end <= k.start || c.start >= k.end) {
        moi.push(k) // không dính gì tới nhau
        continue
      }
      if (c.start > k.start) moi.push({ start: k.start, end: c.start })
      if (c.end < k.end) moi.push({ start: c.end, end: k.end })
    }
    ra = moi
  }
  return ra
}

/**
 * Tính danh sách đoạn cần giữ.
 *
 * Thứ tự xử lý — đổi thứ tự là ra kết quả khác:
 *   1. Cắt gọn khoảng lặng về trong vùng clip đang dùng
 *   2. Gộp các khoảng chồng nhau
 *   3. Thu hẹp mỗi khoảng `pad` giây ở hai đầu — phần đệm này GIỮ LẠI
 *   4. CHỐT CHẶN: nhát nào nuốt trọn một câu nói thì bỏ nhát đó
 *   5. Bỏ khoảng còn lại quá ngắn (không bõ một nhát cắt)
 *   6. Lấy phần bù -> các đoạn cần giữ; vứt đoạn giữ quá vụn
 */
export function lapKeHoach(silences: Silence[], opt: PlanOptions): Plan {
  const { srcIn, srcOut, pad, minCut, minKeep, fps } = opt
  const nhich = 1 / Math.max(fps, 1) // một khung — dùng làm sai số cho phép

  // 1. Cắt gọn về trong vùng đang dùng
  const trongVung: Segment[] = []
  for (const s of silences) {
    const a = Math.max(s.start, srcIn)
    const b = Math.min(s.end, srcOut)
    if (b > a) trongVung.push({ start: a, end: b })
  }

  // 2. Gộp
  const ungVien = gopKhoang(trongVung)

  // 3-4. Đệm hai đầu, rồi bỏ khoảng quá ngắn
  const cuts: Segment[] = []
  let soBoViQuaNgan = 0
  for (const k of ungVien) {
    let a = k.start
    let b = k.end
    // Đệm sinh ra để câu nói không bị cụt hơi — mỗi mối nối còn lại `2 × pad`
    // giây im lặng. Ở HAI ĐẦU CLIP không có câu nói nào cần chừa, nên khoảng
    // lặng chạm mép đầu/mép cuối thì cắt sát — dead air ở đầu và đuôi phải bay
    // hết, đó mới là thứ người dựng muốn.
    if (a > srcIn + nhich) a += pad
    if (b < srcOut - nhich) b -= pad
    if (b - a < minCut) {
      soBoViQuaNgan++
      continue
    }
    cuts.push({ start: snap(a, fps), end: snap(b, fps) })
  }

  // 5. CHỐT CHẶN — chạy SAU khi gộp, không phải trước.
  //
  // ☠️ Đã sai một lần: chặn trước rồi mới gộp thì hai nhát cắt liền nhau, mỗi
  // nhát tự nó không nuốt câu nào, gộp lại thành một nhát nuốt trọn một câu.
  // Đo thật 2026-07-28 ở ngưỡng -22 dB: chặn-trước-gộp còn lọt 1 câu, chặn sau
  // khi gộp thì về 0.
  const cauNoi = opt.cauNoi ?? []
  let soCuuBoiCauNoi = 0
  let gop = gopKhoang(cuts)
  if (cauNoi.length) {
    const giu: Segment[] = []
    let conTro = 0 // cả hai danh sách đều tăng dần -> chạy con trỏ, không lồng vòng
    for (const c of gop) {
      while (conTro > 0 && cauNoi[conTro - 1].den > c.start) conTro--
      while (conTro < cauNoi.length && cauNoi[conTro].den < c.start) conTro++
      let nuot = false
      for (let m = conTro; m < cauNoi.length && cauNoi[m].tu < c.end; m++) {
        if (cauNoi[m].tu >= c.start - 0.02 && cauNoi[m].den <= c.end + 0.02) {
          nuot = true
          break
        }
      }
      if (nuot) soCuuBoiCauNoi++
      else giu.push(c)
    }
    gop = giu
  }

  // 6. Phần bù = các đoạn cần giữ
  const keeps: Segment[] = []
  let moc = snap(srcIn, fps)
  for (const c of gop) {
    if (c.start - moc >= minKeep) keeps.push({ start: moc, end: c.start })
    moc = c.end
  }
  const het = snap(srcOut, fps)
  if (het - moc >= minKeep) keeps.push({ start: moc, end: het })

  const truoc = srcOut - srcIn
  let sau = 0
  for (const k of keeps) sau += k.end - k.start

  return { keeps, cuts: gop, truoc, sau, tietKiem: truoc - sau, soBoViQuaNgan, soCuuBoiCauNoi }
}

/** Đóng gói danh sách đoạn giữ thành chuỗi để gửi sang ExtendScript. */
export function keepsToString(keeps: Segment[]): string {
  return keeps.map((k) => `${k.start.toFixed(4)},${k.end.toFixed(4)}`).join(';')
}

/** Đổi giây -> "m:ss" cho người đọc. */
export function mmss(giay: number): string {
  const g = Math.max(0, giay)
  const m = Math.floor(g / 60)
  const s = g - m * 60
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`
}
