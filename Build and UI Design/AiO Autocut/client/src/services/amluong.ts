/**
 * amluong.ts — đo MỨC ÂM THẬT của file, để tự chọn ngưỡng thay vì đoán.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHẢI CÓ FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Ba mức cũ dùng ba con số dB CỐ ĐỊNH (−30 / −25 / −22). Đo thật 2026-07-28 trên
 * hai file của anh Tiến thì thấy chúng khác nhau một trời một vực:
 *
 *      clip Heygen (studio)      nền −78,4 dBFS · giọng −14,8 → cách nhau 63,6 dB
 *      video iPhone (garage, 2 người) nền −40,8 dBFS · giọng −26,3 → cách nhau 14,6 dB
 *
 * Hậu quả thật: mức "Cắt sạch" (−22 dB) trên file iPhone **cắt mất 249 câu nói**
 * (5,7 phút lời) — vì người ngồi xa mic chỉ nói ở −36 dB, tức là NGƯỠNG NẰM CAO
 * HƠN CẢ GIỌNG NGƯỜI TA. Cùng con số đó trên file Heygen thì vô hại.
 *
 * Nên ngưỡng phải đo trên chính file, không được đặt cứng.
 *
 * ── Cách đo ──
 * Chia file thành cửa sổ 20 ms, tính RMS từng cửa sổ, dựng histogram 1 dB, rồi
 * lấy ngưỡng **Otsu** — chỗ tách hai cụm sao cho hai cụm xa nhau nhất. Đây là
 * cách chuẩn để tách hai cụm mà không phải đoán hệ số.
 *
 * ⚠️ Otsu chỉ là ĐIỂM XUẤT PHÁT, không phải câu trả lời. Đo thật: Otsu cho −48 dB
 * trên file Heygen (quá chặt, gần như không tìm ra khoảng lặng nào) và −34 dB trên
 * file iPhone. Việc chọn ngưỡng cuối cùng do `plan.ts` làm, bằng cách thử vài
 * ngưỡng rồi lấy cái mạnh tay nhất mà KHÔNG nuốt trọn câu nói nào.
 *
 * ⚠️ Dùng `Int16Array` chứ KHÔNG dùng `buf.readInt16LE()` trong vòng lặp — đo
 * thật: nhanh hơn ~20 lần. File 58 phút (56 triệu mẫu) mất **0,2 giây**.
 */

/**
 * ⚠️ File này viết THUẦN — không `import` gì cả, không đụng Node, không đụng CEP.
 * Nhờ vậy `npm run kiem` biên dịch và chạy nó ngoài Premiere được, và toàn bộ
 * phần quyết định cắt ở đâu kiểm chứng được bằng số. Việc đọc file để bên gọi làm.
 */

export interface MucAm {
  /** Số cửa sổ 20 ms đã đo. */
  soCua: number
  /** Ngưỡng Otsu (dBFS, làm tròn về 1 dB) — điểm xuất phát để dò. */
  nguongOtsu: number
  /** Mức trung bình của cụm dưới (nền phòng). */
  nenOn: number
  /** Mức trung bình của cụm trên (giọng nói). */
  mucGiong: number
  /** Cụm dưới chiếm bao nhiêu phần thời lượng (0..1). */
  tyLeIm: number
  /** Mức dBFS của từng cửa sổ — dùng để tự dò khoảng lặng, xem `timKhoangLang`. */
  cua: Float32Array
  /**
   * NỀN ỒN CỤC BỘ của từng cửa sổ (dBFS) — phân vị 20% trong khối 30 giây.
   *
   * Vì sao phải cục bộ chứ không một số cho cả file: anh Tiến quay nhiều cam,
   * cam xa mic thu nhỏ hơn hẳn. Đo thật 2026-07-28 — một ngưỡng cho cả file làm
   * **321 câu bị cắt mất quá nửa lời**, toàn của người ngồi xa.
   */
  nenCucBo: Float32Array
  /** Mỗi cửa sổ dài bao nhiêu giây (0,02). */
  buocGiay: number
}

/** Một cửa sổ dài 20 ms — cỡ tai người gộp năng lượng để nghe ra "to hay nhỏ". */
const CUA_GIAY = 0.02

const DAY = -90 // đáy histogram; dưới mức này coi như im tuyệt đối

/**
 * Đo mức âm từ NỘI DUNG một file WAV 16-bit PCM mono (đã đọc sẵn vào bộ nhớ).
 *
 * Nhận dữ liệu chứ không nhận đường dẫn để file này giữ được tính THUẦN — xem
 * khối ghi chú đầu file.
 *
 * Trả null nếu file hỏng hoặc không phải PCM 16-bit. Bên gọi phải chịu được
 * `null` — mất phần đo mức âm chứ không được sập.
 */
export function doMucAm(buf: Uint8Array): MucAm | null {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const doc4 = (p: number) =>
    String.fromCharCode(buf[p], buf[p + 1], buf[p + 2], buf[p + 3])

  // ── Tìm khối `data` trong file WAV ──
  let pos = 12
  let dataOff = 0
  let dataLen = 0
  let sr = 16000
  try {
    while (pos < buf.byteLength - 8) {
      const id = doc4(pos)
      const sz = dv.getUint32(pos + 4, true)
      if (id === 'fmt ') sr = dv.getUint32(pos + 12, true)
      if (id === 'data') {
        dataOff = pos + 8
        dataLen = Math.min(sz, buf.byteLength - dataOff)
        break
      }
      pos += 8 + sz + (sz & 1)
    }
  } catch {
    return null
  }
  if (!dataLen || !(sr > 0)) return null

  const soMau = Math.floor(dataLen / 2)
  let pcm: Int16Array
  try {
    pcm = new Int16Array(buf.buffer, buf.byteOffset + dataOff, soMau)
  } catch {
    return null // dataOff lẻ -> không dựng được Int16Array; file lạ, bỏ qua
  }

  const cua = Math.round(sr * CUA_GIAY)
  const soCua = Math.floor(soMau / cua)
  if (soCua < 10) return null

  const hist = new Int32Array(-DAY + 1)
  const mucCua = new Float32Array(soCua)
  for (let w = 0; w < soCua; w++) {
    let t = 0
    const i0 = w * cua
    for (let i = i0; i < i0 + cua; i++) {
      const v = pcm[i] / 32768
      t += v * v
    }
    const r = Math.sqrt(t / cua)
    let d = r <= 0 ? DAY : 20 * Math.log10(r)
    if (d < DAY) d = DAY
    if (d > 0) d = 0
    mucCua[w] = d
    hist[Math.round(d) - DAY]++
  }

  return {
    ...otsu(hist),
    soCua,
    cua: mucCua,
    nenCucBo: tinhNenCucBo(mucCua),
    buocGiay: CUA_GIAY,
  }
}

/**
 * Nền ồn CỤC BỘ: phân vị 20% của từng khối 30 giây.
 *
 * Vì sao 30 giây: đủ dài để có cả lúc nói lẫn lúc im (nên phân vị 20% rơi vào
 * phần im), đủ ngắn để bám theo lúc đổi cam hoặc người nói dịch ra xa mic.
 */
function tinhNenCucBo(muc: Float32Array): Float32Array {
  const khoi = Math.round(30 / CUA_GIAY)
  const ra = new Float32Array(muc.length)
  for (let k = 0; k < muc.length; k += khoi) {
    const het = Math.min(muc.length, k + khoi)
    const lat = Array.from(muc.slice(k, het)).sort((a, b) => a - b)
    const p20 = lat[Math.floor(lat.length * 0.2)] ?? -90
    for (let i = k; i < het; i++) ra[i] = p20
  }
  return ra
}

/**
 * Tìm khoảng lặng từ mức của từng cửa sổ 20 ms.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ VÌ SAO KHÔNG DÙNG `silencedetect` CỦA FFMPEG NỮA
 * ══════════════════════════════════════════════════════════════════════════
 *
 * `silencedetect` so sánh **TỪNG MẪU** (16.000 mẫu/giây) với ngưỡng. Một mẫu
 * vượt ngưỡng là nó coi như "có tiếng" và phá vỡ cả chuỗi im lặng.
 *
 * Trên phòng quay ồn thì luật đó sai hẳn. Anh Tiến chỉ ra một đoạn 1,17 giây
 * (mốc gốc 4,967–6,134s) mà tool không cắt. Đo thật 2026-07-28:
 *
 *      RMS cả đoạn           = -31,9 dB     <- tai người nghe là IM
 *      mẫu to nhất           = -21,9 dB
 *      số MẪU vượt -28 dB    = 1.914/16.192 = **11,8%**
 *
 * Tiếng nền lụp bụp nên cứ vài mili giây lại có một mẫu vọt lên. FFmpeg báo
 * "có tiếng" suốt, còn tai anh Tiến nghe là im — và tai anh ấy đúng: **tai
 * người nghe theo năng lượng trong khoảng 20–50 ms, không nghe từng mẫu.**
 *
 * Nên dùng RMS cửa sổ 20 ms. Cùng đoạn đó: 0/59 cửa sổ vượt ngưỡng -28 dB.
 *
 * Được thêm: phép dò này chạy trên mảng có sẵn nên **tức thì** — thử 8 ngưỡng
 * không còn tốn 8 lần gọi FFmpeg.
 */
export interface Quang {
  tu: number
  den: number
}

/**
 * VÙNG NÓI THẬT — giao của "Whisper bảo quanh đây có người nói" với "năng lượng
 * bảo chính xác là chỗ nào".
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ĐÂY LÀ CHỖ HAI NGUỒN KIỂM TRA CHÉO NHAU
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Đã thử và hỏng cả hai cách dùng một nguồn:
 *   - Chỉ mốc CÂU (bản 0.5.0–0.6.2): phủ 99,2% timeline -> 58 phút cắt được 9,8 giây
 *   - Chỉ năng lượng (bản 0.7.0–0.9.0): **321 câu bị cắt mất quá nửa lời**
 *
 * Giao hai nguồn thì mỗi bên làm đúng việc nó giỏi:
 *   - Whisper giỏi trả lời **CÓ AI NÓI KHÔNG** (nghe ra chữ nghĩa là gần như chắc)
 *   - Năng lượng giỏi trả lời **NÓI Ở CHÍNH XÁC CHỖ NÀO** (mốc Whisper quá thô:
 *     1.391/13.563 từ có mốc hỏng, từ dài nhất 8,33 giây)
 *
 * So với **NỀN CỤC BỘ** chứ không phải một ngưỡng cho cả file. Đo thật
 * 2026-07-28 trên video 58 phút: nền ồn dao động **7,9 dB** giữa các phút (anh
 * Tiến quay nhiều cam), giọng dao động 9,9 dB. Một con số cho cả file bắt buộc
 * phải sai ở ít nhất một đầu.
 *
 * @param bien Cao hơn nền cục bộ bao nhiêu dB thì tính là đang nói. Đo trên
 *   video 58 phút (năng lượng đo trên bản ĐÃ LỌC dải giọng nói):
 *   +2 dB -> 0 câu hỏng · +3 -> 3 · +4 -> 9 · +5 -> 15 · +6 -> 31.
 */
export function vungNoiThat(
  m: MucAm,
  cauNoi: Quang[],
  bien: number,
  toiThieuNgoaiCau = 0.3,
): Quang[] {
  const b = m.buocGiay
  const ra: Quang[] = []

  // ── 1. Phần trong câu: giao mốc câu với năng lượng ──
  for (const c of cauNoi) {
    const i0 = Math.max(0, Math.floor(c.tu / b))
    const i1 = Math.min(m.cua.length, Math.ceil(c.den / b))
    let dau = -1
    for (let i = i0; i < i1; i++) {
      if (m.cua[i] > m.nenCucBo[i] + bien) {
        if (dau < 0) dau = i
      } else if (dau >= 0) {
        ra.push({ tu: dau * b, den: i * b })
        dau = -1
      }
    }
    if (dau >= 0) ra.push({ tu: dau * b, den: i1 * b })
  }

  // ── 2. ☠️ LỖ HỔNG PHẢI VÁ: chỗ CÓ TIẾNG mà Whisper bỏ sót HẲN ──
  //
  // Bước 1 chỉ bảo vệ phần nằm TRONG một câu. Nếu Whisper không nghe ra tiếng đế
  // nào đó thì vùng năng lượng ấy **không ai bảo vệ và bị cắt lặng lẽ**.
  //
  // Đo thật 2026-07-28 bằng kiểm tra chéo hai mô hình: 9 câu bị mất thì **7 câu
  // ngắn dưới 2 giây** ("wow", "Lên xuống.", "Chú có quỹ đen không chú.") —
  // tiếng đế của người thứ hai. Và tổng vùng "có tiếng mà không có câu nào" đo
  // được **17 vùng / 8,5 giây**, xấp xỉ đúng tổng độ dài mấy câu bị mất đó.
  //
  // Giá phải trả: 8,5 giây trên tổng 4:03 cắt được = **3,5%**. Rẻ.
  // Những vùng này sau đó thành **marker VÀNG** — máy giữ lại và hỏi người nghe.
  if (toiThieuNgoaiCau > 0 && cauNoi.length) {
    const trongCau = gopQuang(cauNoi)
    let k = 0
    let dau = -1
    for (let i = 0; i <= m.cua.length; i++) {
      const to = i < m.cua.length && m.cua[i] > m.nenCucBo[i] + bien
      if (to) {
        if (dau < 0) dau = i
        continue
      }
      if (dau < 0) continue
      const a = dau * b
      const z = i * b
      dau = -1
      if (z - a < toiThieuNgoaiCau) continue
      // Có câu nào chạm vào [a,z) không — con trỏ chạy, cả hai đều tăng dần.
      while (k > 0 && trongCau[k - 1].den > a) k--
      while (k < trongCau.length && trongCau[k].den <= a) k++
      const cham = k < trongCau.length && trongCau[k].tu < z
      if (!cham) ra.push({ tu: a, den: z })
    }
  }

  return gopQuang(ra)
}

/** Gộp các quãng chồng lấn / dính nhau. */
function gopQuang(ds: Quang[]): Quang[] {
  const sx = ds.slice().sort((x, y) => x.tu - y.tu)
  const gop: Quang[] = []
  for (const q of sx) {
    const cuoi = gop[gop.length - 1]
    if (cuoi && q.tu <= cuoi.den) cuoi.den = Math.max(cuoi.den, q.den)
    else gop.push({ ...q })
  }
  return gop
}

/**
 * Phần BÙ của vùng nói = các khoảng được phép cắt.
 *
 * Trả về đúng kiểu `Silence` để `lapKeHoach` xử lý tiếp (đệm, làm tròn khung,
 * chốt chặn, tính đoạn giữ) — không phải viết lại nhánh thứ hai.
 */
export function khoangKhongNoi(vung: Quang[], thoiLuong: number): { start: number; end: number }[] {
  const ra: { start: number; end: number }[] = []
  let moc = 0
  for (const v of vung) {
    if (v.tu > moc) ra.push({ start: moc, end: v.tu })
    moc = Math.max(moc, v.den)
  }
  if (thoiLuong > moc) ra.push({ start: moc, end: thoiLuong })
  return ra
}

/**
 * CHỖ MÁY KHÔNG CHẮC — năng lượng bảo "có tiếng" mà Whisper không đặt chữ nào vào.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO CẦN — ca thật, đo được 2026-07-28
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Anh Tiến chỉ ra đoạn gốc 4,93–6,20s trên video 58 phút, bảo lẽ ra phải cắt.
 * Đo kỹ thì **không phân giải được bằng dữ liệu đang có**:
 *
 *   - cao hơn nền cục bộ **11–15 dB** -> năng lượng nói "có tín hiệu thật"
 *   - độ lệch chuẩn mức âm 5,15 dB, nằm ở **phân vị 40%** của 1.773 câu Whisper
 *     nghe rõ -> **có nhịp giống hệt tiếng nói**, không phải tiếng động đều
 *     (đã thử giả thuyết "tiếng động đều" và bị bác bỏ)
 *   - nhưng Whisper chép ra chữ lộn xộn -> không dùng làm bằng chứng được
 *
 * Máy nên nói **"tôi không chắc"** thay vì đoán. Nên: giữ đoạn đó lại (an toàn),
 * và đặt marker để người nghe tự quyết.
 *
 * Dấu hiệu chọn: **vùng nói dài mà không có mốc bắt đầu của từ nào rơi vào**.
 * Mốc từ của Whisper thô, nhưng chuyện "có hay không có chữ trong một khoảng ~1
 * giây" thì đáng tin hơn nhiều so với mốc chính xác.
 *
 * Đo trên video 58 phút (9.226 vùng nói, 13.563 từ):
 *   dài ≥ 0,5s -> 75 chỗ · **≥ 0,8s -> 6 chỗ** · ≥ 1,5s -> 0 chỗ
 * Lấy 0,8s: đủ ít để marker không rải kín timeline, và **vẫn bắt đúng chỗ anh
 * Tiến chỉ** (ra 5,06–6,14s).
 */
export function vungNgoNgo(vungNoi: Quang[], mocTu: number[], minDai = 0.8): Quang[] {
  const moc = mocTu.slice().sort((a, b) => a - b)
  /** Có mốc từ nào nằm trong [a,b) không — tìm nhị phân, đừng quét cả mảng. */
  const coChu = (a: number, b: number): boolean => {
    let lo = 0
    let hi = moc.length
    while (lo < hi) {
      const giua = (lo + hi) >> 1
      if (moc[giua] < a) lo = giua + 1
      else hi = giua
    }
    return lo < moc.length && moc[lo] < b
  }
  return vungNoi.filter((v) => v.den - v.tu >= minDai && !coChu(v.tu, v.den))
}

export function timKhoangLang(
  m: MucAm,
  noiseDb: number,
  minSilence: number,
): { start: number; end: number }[] {
  const ra: { start: number; end: number }[] = []
  const b = m.buocGiay
  let dau = -1
  for (let i = 0; i < m.cua.length; i++) {
    const im = m.cua[i] <= noiseDb
    if (im) {
      if (dau < 0) dau = i
    } else if (dau >= 0) {
      if ((i - dau) * b >= minSilence) ra.push({ start: dau * b, end: i * b })
      dau = -1
    }
  }
  if (dau >= 0 && (m.cua.length - dau) * b >= minSilence) {
    ra.push({ start: dau * b, end: m.cua.length * b })
  }
  return ra
}

/**
 * ƯỚC các khoảng SẼ BỊ CẮT khi chỉ nhìn năng lượng — dùng cho DẢI SÓNG ở bước
 * xem trước, lúc Whisper còn chưa chạy.
 *
 * Dùng đúng phép so của `vungNoiThat`: cao hơn **nền cục bộ** cộng biên thì
 * tính là đang nói. Nhờ vậy hình vẽ ra khớp với thứ máy thật sự làm, chứ không
 * phải một đường ngưỡng cứng vẽ cho đẹp.
 *
 * ⚠️ Đây là mức bỏ **tối đa**: bước nghe hiểu chạy sau sẽ giữ lại những chỗ có
 * người nói (xem `vungNoiThat` phần vá lỗ hổng), nên thực tế bỏ ít hơn. Màn
 * xem trước phải nói rõ điều đó ra, đừng để người dùng tin nhầm.
 */
export function uocVungCat(
  m: MucAm,
  bien: number,
  minSilence: number,
  pad: number,
): Quang[] {
  const b = m.buocGiay
  const ra: Quang[] = []
  let dau = -1

  // ☠️ PHẢI LỌC SAU KHI TRỪ ĐỆM, không phải trước — cho khớp `lapKeHoach`
  //    (`minCut`: khoảng lặng phải còn đủ dài SAU KHI chừa đệm hai đầu).
  //
  // Đo thật 2026-07-29 trên Sequence 01 (82 giây), bản lọc-trước:
  //      mức        dải sóng vẽ    máy cắt thật    lệch
  //      Giữ nhịp      6,0s           3,8s        +58%  <-- nói dối
  //      Vừa           9,0s           9,9s         −9%
  //      Cắt sạch     12,0s          13,1s         −8%
  //
  // Giữ nhịp lệch nặng nhất vì nó có đệm lớn nhất (0,15s hai đầu = 0,30s) và
  // ngưỡng dài nhất (0,6s): lọc trước thì chỉ cần khoảng ≥ 0,6s, mà máy thật
  // đòi ≥ 0,9s. Bằng chứng khớp: số nhịp bị bỏ vì quá ngắn là 55 (Giữ nhịp) >
  // 43 (Vừa) > 38 (Cắt sạch) — đúng thứ tự độ lệch.
  const them = (tu: number, den: number): void => {
    if (den - tu - pad * 2 < minSilence) return
    const t = tu + pad
    const d = den - pad
    if (d - t > 0.01) ra.push({ tu: t, den: d })
  }

  for (let i = 0; i < m.cua.length; i++) {
    if (m.cua[i] <= m.nenCucBo[i] + bien) {
      if (dau < 0) dau = i
    } else if (dau >= 0) {
      them(dau * b, i * b)
      dau = -1
    }
  }
  if (dau >= 0) them(dau * b, m.cua.length * b)
  return ra
}

/**
 * Phần BÙ của các khoảng bị cắt — tức là những đoạn CÒN LẠI sau khi cắt.
 *
 * Dùng để vẽ dải sóng thứ hai ("timeline sau khi cắt"): người dựng nhìn hai dải
 * chồng nhau là thấy ngay video ngắn đi bao nhiêu, không phải đọc con số.
 */
export function vungConLai(cat: Quang[], thoiLuong: number): Quang[] {
  const ra: Quang[] = []
  let moc = 0
  for (const c of cat) {
    if (c.tu > moc) ra.push({ tu: moc, den: Math.min(c.tu, thoiLuong) })
    moc = Math.max(moc, c.den)
  }
  if (moc < thoiLuong) ra.push({ tu: moc, den: thoiLuong })
  return ra.filter((x) => x.den > x.tu)
}

/** Ngưỡng Otsu trên histogram dB + mức trung bình của hai cụm. */
function otsu(hist: Int32Array): Omit<MucAm, 'soCua' | 'cua' | 'nenCucBo' | 'buocGiay'> {
  const n = hist.length
  let tong = 0
  let tongW = 0
  for (let i = 0; i < n; i++) {
    tong += hist[i]
    tongW += i * hist[i]
  }
  let w0 = 0
  let sum0 = 0
  let tot = -1
  let moc = 0
  for (let i = 0; i < n; i++) {
    w0 += hist[i]
    if (!w0) continue
    const w1 = tong - w0
    if (!w1) break
    sum0 += i * hist[i]
    const m0 = sum0 / w0
    const m1 = (tongW - sum0) / w1
    const v = w0 * w1 * (m0 - m1) * (m0 - m1)
    if (v > tot) {
      tot = v
      moc = i
    }
  }

  let a0 = 0
  let c0 = 0
  let a1 = 0
  let c1 = 0
  for (let i = 0; i < n; i++) {
    if (i <= moc) {
      a0 += (i + DAY) * hist[i]
      c0 += hist[i]
    } else {
      a1 += (i + DAY) * hist[i]
      c1 += hist[i]
    }
  }
  return {
    nguongOtsu: moc + DAY,
    nenOn: c0 ? a0 / c0 : DAY,
    mucGiong: c1 ? a1 / c1 : 0,
    tyLeIm: tong ? c0 / tong : 0,
  }
}

/**
 * CẮT KẾT QUẢ ĐO VỀ ĐÚNG VÙNG I–O NGƯỜI DÙNG KHOANH.
 * ══════════════════════════════════════════════════════════════════════════
 * Vì sao cần: `trichTieng()` tách tiếng từ **CẢ FILE**, nên `doMucAm()` cũng
 * đo cả file — đúng cho bước dò khoảng lặng (nó cần toàn cảnh để tính nền ồn
 * cục bộ), nhưng SAI cho màn xem trước.
 *
 * ☠️ Đo thật 2026-08-19, anh Tiến bắt: khoanh 53,68s / 40s / **16s** — cả ba
 * lần màn xem trước đều hiện *"Original 54 sec · Cắt 5 khoảng lặng"*. Ba vùng
 * khác nhau, ba lần cùng một con số, vì nó vẽ cả file.
 * Trong khi bước cắt THẬT lại chỉ làm trong vùng (`lapKeHoach` nhận
 * `srcIn`/`srcDen` đã kẹp theo I–O). Tức panel nói một đằng, cắt một nẻo —
 * phạm đúng luật "nhãn nút phải là VIỆC nó làm".
 *
 * ☠️ GIỮ NGUYÊN các số thống kê (`nguongOtsu`, `nenOn`, `mucGiong`, `tyLeIm`)
 * — CỐ Ý, không phải bỏ sót. Bước cắt thật lấy ngưỡng từ bản đo CẢ FILE
 * (`nguongDau = mucAm.nguongOtsu`); tính lại ngưỡng riêng cho vùng thì xem
 * trước sẽ vẽ theo một ngưỡng khác với ngưỡng đem đi cắt — lại lệch, chỉ khác
 * kiểu. Ở đây chỉ đổi PHẠM VI, không đổi THƯỚC.
 *
 * @param tuGiay  mốc đầu vùng, tính theo thời gian NGUỒN của file (`srcTu`)
 * @param denGiay mốc cuối vùng (`srcDen`)
 */
export function catMucAmTheoVung(m: MucAm, tuGiay: number, denGiay: number): MucAm {
  const b = m.buocGiay
  if (!(b > 0) || !Number.isFinite(tuGiay) || !Number.isFinite(denGiay)) return m

  const i0 = Math.max(0, Math.floor(tuGiay / b))
  const i1 = Math.min(m.cua.length, Math.ceil(denGiay / b))
  // Vùng rỗng / nằm ngoài dữ liệu đo: thà trả nguyên bản còn hơn trả mảng rỗng
  // rồi vẽ ra một dải sóng trắng trơn mà không ai hiểu vì sao.
  if (i1 - i0 < 1) return m
  // Đã trùng khít cả file thì khỏi tạo bản sao.
  if (i0 === 0 && i1 === m.cua.length) return m

  const cua = m.cua.slice(i0, i1)
  const nenCucBo = m.nenCucBo.slice(i0, i1)
  return { ...m, soCua: cua.length, cua, nenCucBo }
}


/** Một mảnh cần vẽ: lấy từ bản đo `m`, khoảng nguồn [tu, den] giây. */
export interface LatDo {
  m: MucAm
  tu: number
  den: number
}

/**
 * GỘP NHIỀU MẢNH — kể cả từ NHIỀU FILE KHÁC NHAU — thành một dải liền mạch.
 * ══════════════════════════════════════════════════════════════════════════
 * Vì sao cần: `trichTieng()` tách tiếng theo TỪNG FILE, nên mỗi file có một
 * bản đo riêng. Còn vùng I–O người dùng khoanh thì cắt ngang mọi thứ:
 *   - sequence đã Auto Cut lần đầu  → nhiều mảnh của CÙNG một file
 *   - sequence ghép nhiều nguồn      → mảnh của NHIỀU file
 *
 * ☠️ Ba đời đã sai ở chỗ này, ghi lại để không quay về:
 *   1. vẽ CẢ FILE               → vùng 16s hiện "Original 54 sec" (19/08 sáng)
 *   2. cắt theo clip ĐẦU        → vùng 19s hiện "Original 6 sec"  (19/08 trưa)
 *   3. gộp mảnh cùng một file   → đúng khi vùng một file, thiếu khi nhiều file
 *   4. (đây) gộp mọi mảnh mọi file
 *
 * ⚠️ Bên gọi phải truyền `lat` ĐÚNG THỨ TỰ TIMELINE (theo `seqTu`), vì chỉ bên
 * đó mới biết thứ tự đó — ở đây chỉ thấy mốc nguồn, mà mốc nguồn của hai file
 * khác nhau không so được với nhau.
 *
 * Thống kê (`nguongOtsu`…) lấy của mảnh ĐẦU: bước cắt thật cũng chấm ngưỡng
 * theo từng file bằng chính bản đo của file đó, nên ở đây không có một con số
 * chung nào đúng cho mọi file. Xem thêm `catMucAmTheoVung`.
 */
export function gopLatMucAm(lat: LatDo[]): MucAm | null {
  const dung = lat.filter((l) => l.m && l.m.buocGiay > 0)
  if (!dung.length) return null

  const mau = dung[0].m
  const b = mau.buocGiay

  const mieng: Float32Array[] = []
  const mieng2: Float32Array[] = []
  let tong = 0
  for (const l of dung) {
    // Mỗi mảnh đọc theo bước của CHÍNH bản đo nó — hai file có thể khác nhau
    // (dù thực tế đều 20 ms, đừng dựa vào đó).
    const bl = l.m.buocGiay
    const i0 = Math.max(0, Math.floor(l.tu / bl))
    const i1 = Math.min(l.m.cua.length, Math.ceil(l.den / bl))
    if (i1 - i0 < 1) continue
    mieng.push(l.m.cua.subarray(i0, i1))
    mieng2.push(l.m.nenCucBo.subarray(i0, i1))
    tong += i1 - i0
  }
  if (!tong) return null

  const cua = new Float32Array(tong)
  const nenCucBo = new Float32Array(tong)
  let o = 0
  for (let k = 0; k < mieng.length; k++) {
    cua.set(mieng[k], o)
    nenCucBo.set(mieng2[k], o)
    o += mieng[k].length
  }
  return { ...mau, soCua: tong, cua, nenCucBo, buocGiay: b }
}
