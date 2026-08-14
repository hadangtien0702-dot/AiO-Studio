/**
 * wer.mjs — CÂY THƯỚC đo độ chính xác chép lời tiếng Việt.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHẢI CÓ FILE NÀY — 2026-07-29
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Trước file này, dự án đo được: số câu, số byte, tỉ lệ lặp, tốc độ, độ dài
 * dòng. KHÔNG có con số nào trả lời được "chép ĐÚNG bao nhiêu phần trăm".
 *
 * Điểm tin cậy `p` của Whisper là **nó tự chấm nó** — cùng vật liệu với cái
 * nó đo, nên nó luôn tự khen mình. Đó là lý do suốt 28/07 tool báo "0 câu bị
 * cắt mất" ba lần liền mà tai anh Tiến vẫn nghe ra chỗ mất.
 *
 * Cây thước duy nhất tin được là **bản chép tay do người soát bằng tai**.
 * File này so bản máy chép với bản người soát, ra một con số.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ ĐÂY LÀ SER, KHÔNG PHẢI WER THEO NGHĨA TIẾNG ANH
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Tiếng Việt viết rời từng ÂM TIẾT: "bảo hiểm" là 2 tiếng, không phải 1 từ.
 * Tách bằng khoảng trắng thì đơn vị đếm là ÂM TIẾT, nên con số này đúng ra
 * gọi là SER (Syllable Error Rate). Giới nghiên cứu tiếng Việt vẫn quen gọi
 * là WER và tính đúng như vậy — giữ tên WER cho khỏi lệch với tài liệu ngoài,
 * nhưng phải biết mình đang đếm gì.
 *
 * Hệ quả thực tế: một chữ sai dấu ("quỹ" -> "quỷ") tính là **1 lỗi trên 1 âm
 * tiết**, nặng ngang mất hẳn một tiếng. Đúng với cảm nhận người đọc phụ đề.
 */

/* ══════════════════════════════════════════════════════════════════════════
   CHUẨN HOÁ — chỗ dễ tạo ra con số DỐI nhất
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * ☠️ NFC BẮT BUỘC, ĐỪNG BỎ.
 *
 * Tiếng Việt có HAI cách mã hoá cùng một chữ:
 *   "ế" = U+1EBF (dựng sẵn)  hoặc  "ê" + U+0301 (tổ hợp)
 * Nhìn trên màn hình giống hệt nhau, `===` trả về false.
 *
 * Whisper xuất NFC; người gõ tay trên máy Mac hoặc dán từ web rất hay ra NFD.
 * Không chuẩn hoá thì bản chép ĐÚNG HOÀN TOÀN vẫn có thể ra WER gần 100% —
 * một con số vô lý mà rất dễ tưởng là mô hình hỏng.
 */
export function chuanHoaChu(s) {
  return String(s ?? '').normalize('NFC')
}

/** Dấu câu bỏ khi so. Giữ dấu nối trong từ ghép ("COVID-19") thì bỏ luôn cho đơn giản. */
const DAU_CAU = /[.,!?;:"'`´""''…()[\]{}<>«»\-–—/\\|*_~^#$%&+=@]/g

/**
 * Bảng đọc số cơ bản, để "2024" và "hai nghìn không trăm hai tư" không bị chấm
 * là hai thứ khác nhau.
 *
 * Whisper hay xuất số Ả Rập, người gõ tay hay gõ chữ — cùng một lời nói.
 * Không quy về một mối thì con số WER phồng lên vì chuyện không phải lỗi nghe.
 *
 * Cố ý làm ĐƠN GIẢN: chỉ đọc số nguyên tới hàng tỉ, không xử lý "tư/bốn",
 * "lăm/năm", "mốt/một" — mấy biến thể đó để phần so lo (chúng là lỗi 1 âm tiết,
 * và ép cứng một cách đọc còn sai hơn).
 */
const HANG_DON_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

function docBaChuSo(n, batBuocDuBa) {
  const tram = Math.floor(n / 100)
  const chuc = Math.floor((n % 100) / 10)
  const donVi = n % 10
  const ra = []
  if (tram > 0 || batBuocDuBa) ra.push(HANG_DON_VI[tram], 'trăm')
  if (chuc > 1) {
    ra.push(HANG_DON_VI[chuc], 'mươi')
    if (donVi > 0) ra.push(HANG_DON_VI[donVi])
  } else if (chuc === 1) {
    ra.push('mười')
    if (donVi > 0) ra.push(HANG_DON_VI[donVi])
  } else if (donVi > 0) {
    if (tram > 0 || batBuocDuBa) ra.push('linh')
    ra.push(HANG_DON_VI[donVi])
  }
  return ra
}

/** Đọc một số nguyên thành chuỗi âm tiết tiếng Việt. Trả '' nếu quá lớn. */
export function docSo(soChuoi) {
  const n = Number(soChuoi)
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999_999) return ''
  if (n === 0) return 'không'
  const NHOM = ['', 'nghìn', 'triệu', 'tỉ']
  const nhom = []
  let con = n
  while (con > 0) {
    nhom.push(con % 1000)
    con = Math.floor(con / 1000)
  }
  const ra = []
  for (let i = nhom.length - 1; i >= 0; i--) {
    // ☠️ Bỏ qua MỌI nhóm rỗng, kể cả nhóm cuối. Bản đầu viết `&& i > 0` nên
    // 1000 ra "một nghìn KHÔNG TRĂM" — số 0 ở nhóm đơn vị vẫn bị đọc thành
    // "không trăm". Không sợ ra chuỗi rỗng vì n === 0 đã trả về ở trên.
    if (nhom[i] === 0) continue
    // Nhóm không phải đầu tiên phải đọc đủ ba chữ số: 1024 -> "một nghìn KHÔNG TRĂM hai mươi bốn"
    ra.push(...docBaChuSo(nhom[i], i < nhom.length - 1))
    if (NHOM[i]) ra.push(NHOM[i])
  }
  return ra.join(' ')
}

/**
 * Bổ chuỗi thành mảng âm tiết đã chuẩn hoá.
 *
 * @param {string} s
 * @param {{soThanhChu?: boolean}} tuyChon
 *   soThanhChu — đổi "2024" thành "hai nghìn không trăm hai mươi bốn".
 *   Mặc định BẬT. Tắt đi để xem con số thô (đo riêng ảnh hưởng của chuyện số).
 */
export function boTiengViet(s, { soThanhChu = true } = {}) {
  let t = chuanHoaChu(s).toLowerCase()
  // Bỏ dấu câu TRƯỚC khi đọc số, để "2024." không thành "2024." khi parse.
  t = t.replace(DAU_CAU, ' ')
  if (soThanhChu) {
    t = t.replace(/\d+/g, (m) => {
      const doc = docSo(m)
      return doc ? ` ${doc} ` : ` ${m} `
    })
  }
  return t.split(/\s+/).filter(Boolean)
}

/* ══════════════════════════════════════════════════════════════════════════
   SO HAI BẢN — Levenshtein có lần vết, để in ra được CHỖ NÀO SAI
   ══════════════════════════════════════════════════════════════════════════ */

/** Mã thao tác, nhét trong Uint8Array cho nhẹ bộ nhớ. */
const DUNG = 0
const THAY = 1
const XOA = 2 // có trong bản chuẩn, máy bỏ mất
const THEM = 3 // máy tự thêm, bản chuẩn không có

/**
 * ☠️ BỘ NHỚ: ma trận là n×m. Đây là chỗ mẫu nhỏ giấu lỗi rất giỏi.
 *
 * 5 phút  ≈  1.500 âm tiết ->  1.500² =   2,25 triệu ô =   2,2 MB  (thoải mái)
 * 60 phút ≈ 18.000 âm tiết -> 18.000² = 324 triệu ô   = 324 MB    (sát ngưỡng)
 * 3 tiếng ≈ 54.000 âm tiết -> 54.000² = 2,9 tỉ ô      = 2,9 GB    (SẬP)
 *
 * Dùng Uint8Array (1 byte/ô) thay vì mảng JS thường (8 byte/ô) là đã rẻ gấp 8.
 * Vượt ngưỡng thì BÁO LỖI RÕ chứ không để Node chết vì hết bộ nhớ — chết kiểu
 * đó thì không ai biết vì sao.
 */
const TRAN_O = 400_000_000

export function soHaiBan(chuan, may) {
  const n = chuan.length
  const m = may.length
  if ((n + 1) * (m + 1) > TRAN_O) {
    throw new Error(
      `Hai bản quá dài để so nguyên khối (${n} × ${m} âm tiết). ` +
        'Cắt theo mốc thời gian rồi so từng đoạn.',
    )
  }

  const rong = m + 1
  const d = new Int32Array((n + 1) * rong)
  const op = new Uint8Array((n + 1) * rong)

  for (let j = 1; j <= m; j++) {
    d[j] = j
    op[j] = THEM
  }
  for (let i = 1; i <= n; i++) {
    d[i * rong] = i
    op[i * rong] = XOA
  }

  for (let i = 1; i <= n; i++) {
    const dong = i * rong
    const truoc = (i - 1) * rong
    for (let j = 1; j <= m; j++) {
      if (chuan[i - 1] === may[j - 1]) {
        d[dong + j] = d[truoc + j - 1]
        op[dong + j] = DUNG
        continue
      }
      const cThay = d[truoc + j - 1] + 1
      const cXoa = d[truoc + j] + 1
      const cThem = d[dong + j - 1] + 1
      // Thứ tự ưu tiên khi hoà: THAY trước — nó giữ hai bản thẳng hàng nhau,
      // đọc biên bản dễ hơn là một chuỗi xoá rồi thêm.
      if (cThay <= cXoa && cThay <= cThem) {
        d[dong + j] = cThay
        op[dong + j] = THAY
      } else if (cXoa <= cThem) {
        d[dong + j] = cXoa
        op[dong + j] = XOA
      } else {
        d[dong + j] = cThem
        op[dong + j] = THEM
      }
    }
  }

  // Lần ngược để biết TỪNG chỗ sai — con số tổng không đủ, phải đọc được bằng mắt.
  const viec = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i === 0) {
      viec.push({ loai: THEM, chuan: null, may: may[j - 1] })
      j--
      continue
    }
    if (j === 0) {
      viec.push({ loai: XOA, chuan: chuan[i - 1], may: null })
      i--
      continue
    }
    const t = op[i * rong + j]
    if (t === DUNG) {
      viec.push({ loai: DUNG, chuan: chuan[i - 1], may: may[j - 1] })
      i--
      j--
    } else if (t === THAY) {
      viec.push({ loai: THAY, chuan: chuan[i - 1], may: may[j - 1] })
      i--
      j--
    } else if (t === XOA) {
      viec.push({ loai: XOA, chuan: chuan[i - 1], may: null })
      i--
    } else {
      viec.push({ loai: THEM, chuan: null, may: may[j - 1] })
      j--
    }
  }
  viec.reverse()

  let thay = 0
  let xoa = 0
  let them = 0
  for (const v of viec) {
    if (v.loai === THAY) thay++
    else if (v.loai === XOA) xoa++
    else if (v.loai === THEM) them++
  }

  return { thay, xoa, them, tongChuan: n, tongMay: m, viec }
}

/**
 * Đo một bản chép so với bản chuẩn.
 *
 * WER = (thay + xoá + thêm) / số âm tiết của BẢN CHUẨN.
 *
 * ⚠️ WER có thể VƯỢT 100%: máy bịa thêm nhiều thì phần "thêm" không có trần.
 * Đúng chuyện đã xảy ra 29/07 — bản mặc định bịa 806 lần cùng một câu. Con số
 * trên 100% không phải lỗi tính toán, nó đang nói đúng mức độ thảm hoạ.
 */
export function doWer(banChuan, banMay, tuyChon = {}) {
  const chuan = boTiengViet(banChuan, tuyChon)
  const may = boTiengViet(banMay, tuyChon)
  const kq = soHaiBan(chuan, may)
  const loi = kq.thay + kq.xoa + kq.them
  return {
    ...kq,
    loi,
    wer: kq.tongChuan ? loi / kq.tongChuan : may.length ? Infinity : 0,
    /** Tỉ lệ âm tiết khớp trên tổng bản chuẩn — con số dễ hiểu cho người không rành. */
    dung: kq.tongChuan ? (kq.tongChuan - kq.thay - kq.xoa) / kq.tongChuan : 1,
  }
}

/**
 * Đo trên KÝ TỰ (CER) — cùng thuật toán, đơn vị nhỏ hơn.
 *
 * Vì sao cần cả hai: tiếng Việt sai dấu ("quỹ" -> "quỷ") làm hỏng nguyên một
 * âm tiết ở WER, nhưng ở CER chỉ là 1 ký tự trong 3. Chênh lệch giữa hai con số
 * cho biết lỗi thiên về SAI DẤU hay NGHE HẲN RA CHỮ KHÁC.
 */
export function doCer(banChuan, banMay, tuyChon = {}) {
  const chuan = [...boTiengViet(banChuan, tuyChon).join(' ')]
  const may = [...boTiengViet(banMay, tuyChon).join(' ')]
  const kq = soHaiBan(chuan, may)
  const loi = kq.thay + kq.xoa + kq.them
  return { ...kq, loi, cer: kq.tongChuan ? loi / kq.tongChuan : may.length ? Infinity : 0 }
}

/* ══════════════════════════════════════════════════════════════════════════
   IN RA CHO NGƯỜI ĐỌC — con số tổng không đủ
   ══════════════════════════════════════════════════════════════════════════

   Bài học 29/07: tổng 2.033 câu trông rất khoẻ mạnh, **mở ra đọc mới thấy
   60,9% là rác**. Nên bộ đo nào cũng phải in được cái để ĐỌC BẰNG MẮT.
*/

/** Danh sách chỗ sai, gộp các chỗ sai liền nhau thành một mẩu để dễ đọc. */
export function danhSachSai(kq, { quanhCo = 3 } = {}) {
  const ra = []
  const v = kq.viec
  let i = 0
  while (i < v.length) {
    if (v[i].loai === DUNG) {
      i++
      continue
    }
    let j = i
    while (j < v.length && v[j].loai !== DUNG) j++
    const dau = Math.max(0, i - quanhCo)
    const cuoi = Math.min(v.length, j + quanhCo)
    ra.push({
      truoc: v
        .slice(dau, i)
        .map((x) => x.chuan ?? '')
        .filter(Boolean)
        .join(' '),
      chuan: v
        .slice(i, j)
        .map((x) => x.chuan)
        .filter(Boolean)
        .join(' '),
      may: v
        .slice(i, j)
        .map((x) => x.may)
        .filter(Boolean)
        .join(' '),
      sau: v
        .slice(j, cuoi)
        .map((x) => x.chuan ?? '')
        .filter(Boolean)
        .join(' '),
    })
    i = j
  }
  return ra
}

/** Đếm cặp nhầm hay gặp nhất — thứ đem nhét thẳng vào bảng "Sửa từ nghe nhầm". */
export function capNhamHayGap(kq, { toiThieu = 2 } = {}) {
  const dem = new Map()
  for (const v of kq.viec) {
    if (v.loai !== THAY) continue
    const k = `${v.chuan} ${v.may}`
    dem.set(k, (dem.get(k) ?? 0) + 1)
  }
  return [...dem.entries()]
    .filter(([, n]) => n >= toiThieu)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => {
      const [chuan, may] = k.split(' ')
      return { mayNgheRa: may, dungPhaiLa: chuan, soLan: n }
    })
}

export const LOAI = { DUNG, THAY, XOA, THEM }
